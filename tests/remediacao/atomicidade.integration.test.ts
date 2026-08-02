import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { replaceCompetencyDomains } from "@/modules/profiles/professional-repository";
import { attachDocumentToStory } from "@/modules/story/attachment-repository";
import { CARENCIA_EM_SEGUNDOS, listarCandidatosAOrfao } from "@/modules/story/documentos-orfaos";

import {
  casoComCurador,
  entrarComo,
  novaPaciente,
  perfilDePrioridades,
  profissionaisSinteticos,
  selecaoComOpcoes,
  serviceClient,
  type Sessao,
} from "./apoio";

/**
 * =============================================================================
 * GATES DO BLOCO B — ATOMICIDADE E CONTRATOS TRANSACIONAIS
 * =============================================================================
 *
 * Operações que hoje são sequências de escritas soltas (entrega, conversão de
 * lead, abertura de Case, competências, upload+vínculo) e que o Bloco B deve
 * transformar em atos únicos: ou tudo acontece, ou nada fica para trás.
 *
 * Cada asserção descreve o comportamento CORRETO pós-remediação — os testes
 * DEVEM estar VERMELHOS hoje, cada um pelo defeito que documenta.
 */

const service = serviceClient();

let curador: Sessao;
let atendente: Sessao;
let admin: Sessao;
/** Três profissionais sintéticos comuns (nunca publicados, nunca fixture). */
let profissionais: string[];

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
  atendente = await entrarComo("atendente");
  admin = await entrarComo("administrador");
  profissionais = await profissionaisSinteticos(service, 3, curador.userId, "atom");
});

describe("GATE-B11 [Bloco B] a entrega da Curadoria é uma RPC transacional", () => {
  it("deliver_curadoria deve existir como função única no banco (ADR-048)", async () => {
    // A entrega hoje é uma sequência de UPDATEs soltos feitos pelo servidor
    // (deliverSelection + markReportDelivered): uma falha no meio deixa
    // seleção entregue com Relatório não entregue, ou vice-versa.
    const { error } = await curador.client.rpc("deliver_curadoria", {
      _curated_selection_id: randomUUID(),
    });

    const inexistente = /could not find|does not exist|not find the function/i.test(
      error?.message ?? "",
    );
    expect(
      inexistente ? error : null,
      `RPC transacional da entrega inexistente (ADR-048/Bloco B): ${error?.message ?? "?"}`,
    ).toBeNull();
  });
});

describe("GATE-B12 [Bloco B] seleção não é entregável sem Relatório emitido", () => {
  it("update DRAFT -> DELIVERED sem Relatório deve ser recusado pelo banco", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-b12");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: false },
    );

    // Estado antes: seleção DRAFT e NENHUM relatório para ela.
    const { count: relatorios } = await service
      .from("curadoria_reports")
      .select("*", { count: "exact", head: true })
      .eq("curated_selection_id", selectionId);
    expect(relatorios, "pré-condição: nenhum Relatório existe").toBe(0);

    // ATAQUE: entregar a seleção assim mesmo, com sessão real do Curador.
    const { error } = await curador.client
      .from("curated_selections")
      .update({ status: "DELIVERED", delivered_at: new Date().toISOString() })
      .eq("id", selectionId);

    const { data: depois } = await service
      .from("curated_selections")
      .select("status")
      .eq("id", selectionId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR entrega de seleção sem Relatório emitido ` +
        `(antes: DRAFT + 0 relatórios; depois do ataque: ${depois!.status})`,
    ).not.toBeNull();
    expect(depois!.status, "sem Relatório emitido, não há entrega").toBe("DRAFT");
  });
});

describe("GATE-B13 [Bloco B] duplo submit de open_case_from_lead", () => {
  it("chamar a RPC duas vezes para o MESMO lead não pode criar dois Cases", async () => {
    // Caminho mínimo real: lead qualificado + paciente convertida, tudo com
    // sessão real do atendente onde o produto usa sessão real.
    // A concessão do papel passa por uma sessão real de administrador (a RLS
    // de user_roles é admin-only) — mesmo padrão dos testes de integração.
    const email = `gate-b13-${randomUUID().slice(0, 8)}@aliviar-conexao.local`;
    const conta = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Gate B13" },
      admin.userId,
    );

    const { data: lead, error: leadError } = await service
      .from("crm_contacts")
      .insert({
        full_name: "Lead Gate B13",
        source: "teste-remediacao",
        initial_reason: "Dor lombar persistente relatada no primeiro contato.",
        qualified_at: new Date().toISOString(),
        qualified_by: atendente.userId,
        patient_profile_id: conta.profileId,
        converted_at: new Date().toISOString(),
        converted_by: atendente.userId,
      })
      .select("id")
      .single();
    expect(leadError, `fixture do lead: ${leadError?.message}`).toBeNull();
    const leadId = lead!.id as string;

    // ATAQUE: o duplo clique — a MESMA RPC, duas vezes, mesma sessão.
    const primeira = await atendente.client.rpc("open_case_from_lead", {
      _contact_id: leadId,
      _initial_story: null,
    });
    expect(primeira.error, `primeira abertura: ${primeira.error?.message}`).toBeNull();

    const segunda = await atendente.client.rpc("open_case_from_lead", {
      _contact_id: leadId,
      _initial_story: null,
    });

    const primeiroCase = (primeira.data as { id: string }).id;

    const { count: casesDaPaciente } = await service
      .from("cases")
      .select("*", { count: "exact", head: true })
      .eq("patient_profile_id", conta.profileId);

    // A idempotência declarada está quebrada na raiz: a função grava
    // `active_case_id = null` ao abrir o Case, então a segunda chamada não
    // encontra o Case existente e tenta criar TUDO de novo (nova história,
    // novo Case). Hoje ela não chega a duplicar só por acidente — esbarra no
    // índice um-rascunho-por-paciente e devolve um erro ininteligível para o
    // Atendente, em vez do mesmo Case.
    expect(
      segunda.error,
      `a segunda chamada deve ser idempotente e devolver o MESMO Case — hoje quebra ` +
        `com "${segunda.error?.message}" porque open_case_from_lead grava ` +
        `active_case_id = null (1ª chamada: Case ${primeiroCase}; ` +
        `Cases da paciente após o duplo submit: ${casesDaPaciente})`,
    ).toBeNull();

    const segundoCase = (segunda.data as { id: string } | null)?.id;
    expect(
      segundoCase,
      `a segunda chamada deve devolver O MESMO Case (1ª: ${primeiroCase}; 2ª: ${segundoCase})`,
    ).toBe(primeiroCase);
    expect(casesDaPaciente, "duplo submit não pode duplicar a ficha da pessoa").toBe(1);
  });
});

describe("GATE-B14 [Bloco B] conversão de lead com compensação", () => {
  it("recusa da RPC de conversão não pode deixar conta de paciente órfã (sem vínculo com lead nenhum)", async () => {
    // Lead NÃO qualificado: a RPC vai recusar a conversão no fluxo normal.
    const { data: lead } = await service
      .from("crm_contacts")
      .insert({
        full_name: "Lead Gate B14",
        source: "teste-remediacao",
        initial_reason: "Contato inicial ainda não qualificado.",
      })
      .select("id")
      .single();
    const leadId = lead!.id as string;

    // A MESMA sequência da Server Action (conversion-actions.ts): primeiro a
    // conta nasce pela Admin API, depois o banco decide — e recusa.
    const email = `gate-b14-${randomUUID().slice(0, 8)}@aliviar-conexao.local`;
    const conta = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Gate B14" },
      admin.userId,
    );

    const { error: rpcError } = await atendente.client.rpc("convert_lead_to_patient", {
      _contact_id: leadId,
      _patient_profile_id: conta.profileId,
      _administrative_exception: false,
      _reason: null,
    });
    expect(
      rpcError,
      "pré-condição do gate: a RPC precisa RECUSAR (lead não qualificado)",
    ).not.toBeNull();

    // Estado depois da recusa: o lead segue sem paciente...
    const { data: leadDepois } = await service
      .from("crm_contacts")
      .select("patient_profile_id")
      .eq("id", leadId)
      .single();
    expect(leadDepois!.patient_profile_id, "a conversão não aconteceu").toBeNull();

    // ...e a conta criada não pode ter sobrado como órfã: ou a compensação a
    // removeu, ou ela está vinculada a algum lead. Hoje: sobra, invisível.
    const { data: usuario } = await service.auth.admin.getUserById(conta.profileId);
    const contaAindaExiste = Boolean(usuario?.user);

    const { count: vinculos } = await service
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("patient_profile_id", conta.profileId);

    const orfa = contaAindaExiste && (vinculos ?? 0) === 0;
    expect(
      orfa ? conta.profileId : null,
      `conta ${conta.profileId} (${email}) ficou ÓRFÃ após a recusa da conversão: ` +
        `existe no Auth com papel de paciente e não está vinculada a lead nenhum — ` +
        `a falha da RPC precisa compensar a criação da conta (Bloco B)`,
    ).toBeNull();
  });
});

describe("GATE-B15 [Bloco B] update de profissional sem campos de competência não apaga as áreas", () => {
  it("profissional com 3 áreas + payload sem competência -> as áreas permanecem", async () => {
    // Profissional sintético próprio, com TRÊS áreas de competência.
    const { data: perfil } = await service
      .from("professional_profiles")
      .insert({
        display_name: "Dr. Gate B15 — Sintético",
        professional_identifier: `GATE-B15-${randomUUID().slice(0, 8)}`,
        is_test_fixture: true,
        created_by: atendente.userId,
      })
      .select("id")
      .single();
    const profissionalId = perfil!.id as string;

    // Os três domínios válidos do CHECK de professional_competency_areas.
    const dominios = ["saude_fisica", "saude_emocional_mental", "nao_determinado"];
    const { error: areasError } = await service.from("professional_competency_areas").insert(
      dominios.map((domain) => ({
        professional_profile_id: profissionalId,
        domain,
        focus: "avaliacao",
      })),
    );
    expect(areasError, `fixture das áreas: ${areasError?.message}`).toBeNull();
    const { count: antes } = await service
      .from("professional_competency_areas")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", profissionalId);
    expect(antes, "pré-condição: três áreas cadastradas").toBe(3);

    // O caminho real do defeito: um formulário de update SEM os campos de
    // competência parseia para `competencyDomains: []`, e a Server Action
    // chama `replaceCompetencyDomains(client, id, [])` — que apaga tudo.
    // Repositório real, client por DI, exatamente como o produto o usa.
    await replaceCompetencyDomains(service, profissionalId, []);

    const { count: depois } = await service
      .from("professional_competency_areas")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", profissionalId);

    expect(
      depois,
      `payload sem campos de competência NÃO pode significar "apagar tudo" ` +
        `(áreas antes: ${antes}; depois do update: ${depois}) — ausência de campo ` +
        `é ausência de declaração, nunca uma declaração de conjunto vazio`,
    ).toBe(3);
  });
});

describe("GATE-B16 [Bloco B] falha do vínculo não deixa documento órfão invisível", () => {
  it("documento criado + vínculo recusado -> o resíduo não pode sobrar sem compensação nem rastro", async () => {
    const paciente = await novaPaciente(service, "gate-b16");

    // O documento nasce (mesma escrita de uploadPatientDocument)...
    const { data: doc, error: docError } = await paciente.client
      .from("patient_documents")
      .insert({
        profile_id: paciente.userId,
        uploaded_by: paciente.userId,
        file_path: `${paciente.userId}/${randomUUID()}-gate-b16.pdf`,
        file_name: "exame-gate-b16.pdf",
        content_type: "application/pdf",
        file_size: 2048,
      })
      .select("id")
      .single();
    expect(docError, `criação do documento: ${docError?.message}`).toBeNull();
    const documentId = doc!.id as string;

    // ...e o vínculo falha (história inexistente), pelo repositório real.
    await expect(
      attachDocumentToStory(paciente.client, randomUUID(), documentId),
      "pré-condição do gate: o vínculo precisa FALHAR",
    ).rejects.toThrow();

    // Auditoria antes/depois — um rastro do resíduo também satisfaria o gate.
    const { count: auditoria } = await service
      .from("audit_logs")
      .select("*", { count: "exact", head: true });

    // Bem depois da carência: nenhuma operação "ainda em curso" justifica o resíduo.
    const bemDepois = new Date(Date.now() + (CARENCIA_EM_SEGUNDOS + 60) * 1000);
    const candidatos = await listarCandidatosAOrfao(service, { agora: bemDepois });
    const residuo = candidatos.find((candidato) => candidato.documentId === documentId);

    const { count: auditoriaDepois } = await service
      .from("audit_logs")
      .select("*", { count: "exact", head: true });
    const houveRastro = (auditoriaDepois ?? 0) > (auditoria ?? 0);

    expect(
      residuo && !houveRastro ? residuo.documentId : null,
      `o documento ${documentId} ficou órfão invisível após a falha do vínculo: ` +
        `aparece em listarCandidatosAOrfao (motivo: "${residuo?.motivo}") e nenhuma ` +
        `compensação ou registro auditável existe — a operação documento+vínculo ` +
        `precisa ser atômica ou compensada com rastro (Bloco B)`,
    ).toBeNull();
  });
});
