import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
// Namespace de propósito (Bloco B.6): os gates B17/B19 nascem VERMELHOS antes
// da correção existir — um import nomeado de export inexistente derrubaria o
// arquivo inteiro (e com ele os gates B11–B16), poluindo a reprodução.
import * as patientAccounts from "@/modules/profiles/patient-account-repository";
import { replaceCompetencyDomains } from "@/modules/profiles/professional-repository";
import { attachDocumentToStory } from "@/modules/story/attachment-repository";
import { CARENCIA_EM_SEGUNDOS, listarCandidatosAOrfao } from "@/modules/story/documentos-orfaos";

import {
  casoComCurador,
  entrarComo,
  novaPaciente,
  perfilDePrioridades,
  profissionaisSinteticos,
  relatorioDaSelecao,
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

describe("GATE-B17 [Bloco B.6] par de entrega bidirecional", () => {
  // O gate B12 fechou UMA direção: seleção não vira DELIVERED sem Relatório
  // emitido. A direção INVERSA seguiu aberta (validação B.5, item B1):
  // `markReportDelivered`/PostgREST direto ainda gravam `delivered_at` no
  // Relatório com a seleção parada em DRAFT — o par de telas inconsistente
  // renasce pela outra ponta, e o Bloco C congelaria esse estado torto.
  it("Relatório NÃO é entregável com a seleção fora de DELIVERED — tentativa PostgREST direta recusada sem alterar nenhuma metade", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-b17");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: false },
    );
    const reportId = await relatorioDaSelecao(
      service,
      caseId,
      selectionId,
      curador.userId,
      profissionais,
      { emitido: true, entregue: false },
    );

    // ATAQUE: entregar o Relatório pela outra ponta — o MESMO update que
    // `markReportDelivered` executa, com sessão real do Curador designado.
    const { error } = await curador.client
      .from("curadoria_reports")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", reportId)
      .is("delivered_at", null);

    const { data: reportDepois } = await service
      .from("curadoria_reports")
      .select("delivered_at")
      .eq("id", reportId)
      .single();
    const { data: selecaoDepois } = await service
      .from("curated_selections")
      .select("status, delivered_at")
      .eq("id", selectionId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR Relatório entregue com a seleção em ${selecaoDepois!.status} ` +
        `(delivered_at do Relatório após o ataque: ${reportDepois!.delivered_at})`,
    ).not.toBeNull();
    expect(
      reportDepois!.delivered_at,
      "falha em qualquer metade não altera nenhuma: o Relatório segue não entregue",
    ).toBeNull();
    expect(
      selecaoDepois!.status,
      "falha em qualquer metade não altera nenhuma: a seleção segue DRAFT",
    ).toBe("DRAFT");
    expect(selecaoDepois!.delivered_at, "a seleção segue sem carimbo de entrega").toBeNull();
  });

  it("o caminho oficial (deliver_curadoria) atravessa a trava e entrega as DUAS metades no mesmo ato", async () => {
    // A trava nova não pode quebrar a via de produção: dentro da RPC a
    // seleção é entregue ANTES do Relatório, na MESMA transação (M150), e a
    // checagem do par deve enxergar isso.
    const { caseId } = await casoComCurador(service, curador.userId, "gate-b17-oficial");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: false },
    );
    const reportId = await relatorioDaSelecao(
      service,
      caseId,
      selectionId,
      curador.userId,
      profissionais,
      { emitido: true, entregue: false },
    );

    const { error } = await curador.client.rpc("deliver_curadoria", {
      _curated_selection_id: selectionId,
    });
    expect(error, `a entrega oficial deve passar pela trava: ${error?.message}`).toBeNull();

    const { data: selecao } = await service
      .from("curated_selections")
      .select("status, delivered_at")
      .eq("id", selectionId)
      .single();
    const { data: relatorio } = await service
      .from("curadoria_reports")
      .select("delivered_at")
      .eq("id", reportId)
      .single();

    expect(selecao!.status, "a seleção sai entregue").toBe("DELIVERED");
    expect(selecao!.delivered_at, "a seleção sai carimbada").not.toBeNull();
    expect(
      relatorio!.delivered_at,
      "o Relatório sai entregue JUNTO — nunca meia entrega",
    ).not.toBeNull();
    expect(
      new Date(relatorio!.delivered_at as string).toISOString(),
      "as duas metades carregam o MESMO carimbo",
    ).toBe(new Date(selecao!.delivered_at as string).toISOString());
  });
});

describe("GATE-B19 [Bloco B.6] idempotência administrativa real", () => {
  // A chave `patient-account:<profileId>` derivava do id gerado NA PRÓPRIA
  // tentativa — não deduplicava nada (validação B.5, item B3). O cenário
  // real do defeito: a 1ª execução conclui (conta criada, papel concedido,
  // operação registrada) mas a resposta se perde; o retry do administrador
  // criava... nada — batia no e-mail duplicado com erro genérico, sem
  // caminho de recuperação. Idempotência REAL: chave estável fornecida pelo
  // CHAMADOR + retry que RECUPERA o resultado da 1ª execução.
  it("retry com a MESMA chave após falha pós-criação recupera o resultado — nunca segunda conta, nunca senha inventada", async () => {
    const operationKey = randomUUID();
    const email = `gate-b19-${randomUUID().slice(0, 8)}@aliviar-conexao.local`;

    // 1ª execução: conclui por inteiro — e a resposta se perde no caminho
    // (falha intermediária DEPOIS do createUser, o cenário do B.5).
    const primeira = await patientAccounts.provisionPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Gate B19", operationKey },
      admin.userId,
    );
    expect(primeira.outcome, "1ª execução cria a conta").toBe("created");

    // Retry do administrador: o MESMO formulário reenviado, a MESMA chave.
    const retry = await patientAccounts.provisionPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Gate B19", operationKey },
      admin.userId,
    );

    expect(
      retry.outcome,
      "retry com a mesma chave RECUPERA a operação concluída — nunca cria de novo",
    ).toBe("already_provisioned");
    expect(retry.profileId, "o retry devolve a MESMA conta da 1ª execução").toBe(
      primeira.profileId,
    );
    expect(
      "password" in retry,
      "credenciais só existem na execução que concluiu — retry nunca inventa senha nova",
    ).toBe(false);

    // Exatamente UMA conta, com papel e operação registrada — zero órfão.
    const { data: usuarios } = await service.auth.admin.listUsers({ perPage: 1000 });
    const contas = (usuarios?.users ?? []).filter((usuario) => usuario.email === email);
    expect(contas, "mesma chave repetida => exatamente 1 conta no Auth").toHaveLength(1);

    const { data: operacao } = await service
      .from("patient_provisioning")
      .select("profile_id, status")
      .eq("operation_key", operationKey)
      .single();
    expect(operacao!.status, "a operação segue REGISTERED (concluída, não convertida)").toBe(
      "REGISTERED",
    );
    expect(operacao!.profile_id, "a operação aponta para a conta real").toBe(primeira.profileId);
  });

  it("a MESMA chave em PARALELO produz exatamente 1 criação e zero órfão", async () => {
    const operationKey = randomUUID();
    const email = `gate-b19-par-${randomUUID().slice(0, 8)}@aliviar-conexao.local`;

    // O duplo clique real: duas execuções simultâneas da mesma solicitação.
    const resultados = await Promise.allSettled([
      patientAccounts.provisionPatientAccount(
        service,
        admin.client,
        { email, displayName: "Paciente Gate B19 Paralelo", operationKey },
        admin.userId,
      ),
      patientAccounts.provisionPatientAccount(
        service,
        admin.client,
        { email, displayName: "Paciente Gate B19 Paralelo", operationKey },
        admin.userId,
      ),
    ]);

    const criadas = resultados.filter(
      (resultado) => resultado.status === "fulfilled" && resultado.value.outcome === "created",
    );
    expect(
      criadas,
      `exatamente UMA execução cria a conta (resultados: ${resultados
        .map((r) => (r.status === "fulfilled" ? r.value.outcome : `erro: ${String(r.reason)}`))
        .join(" | ")})`,
    ).toHaveLength(1);

    const { data: usuarios } = await service.auth.admin.listUsers({ perPage: 1000 });
    const contas = (usuarios?.users ?? []).filter((usuario) => usuario.email === email);
    expect(contas, "paralelo => exatamente 1 conta no Auth").toHaveLength(1);
    const profileId = contas[0]!.id;

    // Zero órfão: a conta que sobreviveu tem papel de paciente E operação.
    const { data: papel } = await service.from("roles").select("id").eq("slug", "paciente").single();
    const { count: papeis } = await service
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("role_id", papel!.id);
    expect(papeis, "a conta sobrevivente tem o papel de paciente").toBe(1);

    const { data: operacao } = await service
      .from("patient_provisioning")
      .select("profile_id, status")
      .eq("operation_key", operationKey)
      .single();
    expect(operacao!.profile_id, "a operação registra a conta sobrevivente").toBe(profileId);
    expect(operacao!.status).toBe("REGISTERED");
  });

  it("chave DIFERENTE com o mesmo e-mail é recusa clara de domínio — nunca segunda conta, nunca erro genérico", async () => {
    const email = `gate-b19-dup-${randomUUID().slice(0, 8)}@aliviar-conexao.local`;

    const primeira = await patientAccounts.provisionPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Gate B19 Duplicado", operationKey: randomUUID() },
      admin.userId,
    );
    expect(primeira.outcome).toBe("created");

    // OUTRA solicitação (chave nova) com o MESMO e-mail: conflito de domínio,
    // dito com todas as letras — nunca "Não foi possível criar a conta".
    await expect(
      patientAccounts.provisionPatientAccount(
        service,
        admin.client,
        { email, displayName: "Paciente Gate B19 Duplicado", operationKey: randomUUID() },
        admin.userId,
      ),
      "payload conflitante (mesmo e-mail, chave nova) exige recusa de DOMÍNIO nomeando o e-mail",
    ).rejects.toThrow(/e-mail/i);

    const { data: usuarios } = await service.auth.admin.listUsers({ perPage: 1000 });
    const contas = (usuarios?.users ?? []).filter((usuario) => usuario.email === email);
    expect(contas, "a recusa não cria nem remove nada: segue 1 conta").toHaveLength(1);
    expect(contas[0]!.id, "a conta original permanece intacta").toBe(primeira.profileId);
  });
});
