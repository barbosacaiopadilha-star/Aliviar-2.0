import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { resetPatientPassword } from "@/modules/profiles/patient-account-repository";

import { createCuradoriaCertificationFixture } from "../integration/certificacao-fixture";

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
import { transicaoDespublicar, transicaoPublicar } from "../apoio/publicacao";

/**
 * =============================================================================
 * GATES DO BLOCO C — IMUTABILIDADE VIA POSTGREST COM SESSÃO LEGÍTIMA
 * =============================================================================
 *
 * Cada teste prepara o estado com service_role (fixture) e executa o ATAQUE
 * com a sessão REAL do papel indicado — login de verdade, RLS de verdade.
 * A asserção descreve o comportamento CORRETO pós-remediação: o banco recusa.
 *
 * HOJE o banco aceita — e é exatamente por isso que estes testes DEVEM estar
 * VERMELHOS até o Bloco C aterrissar. Verde antes disso significa que o gate
 * está medindo a coisa errada.
 */

const service = serviceClient();

let curador: Sessao;
let admin: Sessao;
/** Três profissionais sintéticos comuns (nunca publicados, nunca fixture). */
let profissionais: string[];
/** Um profissional de certificação PUBLICADO — só para o gate de despublicação. */
let profissionalPublicado: string;

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
  admin = await entrarComo("administrador");
  profissionais = await profissionaisSinteticos(service, 3, curador.userId, "imut");
  const fixture = await createCuradoriaCertificationFixture(service);
  profissionalPublicado = fixture.professionalIds["fixture-a"];
});

async function contarAuditoria(): Promise<number> {
  const { count, error } = await service
    .from("audit_logs")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`audit_logs: ${error.message}`);
  return count ?? 0;
}

describe("GATE-C1 [Bloco C] história enviada é imutável para a própria paciente", () => {
  it("paciente NÃO consegue regredir a própria história enviada -> rascunho", async () => {
    const paciente = await novaPaciente(service, "gate-c1");
    const { data: story } = await service
      .from("patient_stories")
      .insert({
        profile_id: paciente.userId,
        created_by: paciente.userId,
        status: "enviada",
        data: { motivo: "história já enviada" },
      })
      .select("id, status")
      .single();
    const storyId = story!.id as string;
    expect(story!.status, "estado ANTES do ataque").toBe("enviada");

    // ATAQUE: a própria paciente, por PostgREST, tenta voltar para rascunho.
    // O gatilho atual só protege `data` — a transição de status passa limpa.
    const { error } = await paciente.client
      .from("patient_stories")
      .update({ status: "rascunho" })
      .eq("id", storyId);

    const { data: depois } = await service
      .from("patient_stories")
      .select("status")
      .eq("id", storyId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR a regressão enviada->rascunho pela paciente ` +
        `(antes: "enviada"; depois do ataque: "${depois!.status}")`,
    ).not.toBeNull();
    expect(depois!.status, "a história deve permanecer 'enviada'").toBe("enviada");
  });
});

describe("GATE-C2 [Bloco C] Mapa de Prioridades congela com o Perfil VALIDATED", () => {
  it("Curador NÃO edita case_priority_map de um Perfil já VALIDATED", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c2");
    await perfilDePrioridades(service, caseId, curador.userId, { validado: true });

    const { data: conceito } = await service
      .from("method_subcriteria")
      .select("id")
      .eq("active", true)
      .limit(1)
      .single();
    const { data: linha } = await service
      .from("case_priority_map")
      .insert({ case_id: caseId, subcriterion_id: conceito!.id, importance: "IMPORTANTE" })
      .select("id, importance")
      .single();
    expect(linha!.importance, "estado ANTES do ataque").toBe("IMPORTANTE");

    // ATAQUE: sessão real do Curador do Case reescreve a importância de um
    // Mapa cujo Perfil já foi validado com a paciente.
    const { error } = await curador.client
      .from("case_priority_map")
      .update({ importance: "NAO_INFLUENCIA" })
      .eq("id", linha!.id as string);

    const { data: depois } = await service
      .from("case_priority_map")
      .select("importance")
      .eq("id", linha!.id as string)
      .single();

    expect(
      error,
      `o banco deve RECUSAR edição do Mapa após VALIDATED ` +
        `(antes: IMPORTANTE; depois do ataque: ${depois!.importance})`,
    ).not.toBeNull();
    expect(depois!.importance, "a importância validada não pode mudar").toBe("IMPORTANTE");
  });
});

describe("GATE-C3 [Bloco C] Perfil VALIDATED não regride", () => {
  it("Curador NÃO faz priority_profiles VALIDATED -> DRAFT", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c3");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    // ATAQUE: regressão de status com validated_at zerado — a CHECK de
    // coerência aceita o par (DRAFT, null), então hoje a regressão passa.
    const { error } = await curador.client
      .from("priority_profiles")
      .update({ status: "DRAFT", validated_at: null })
      .eq("id", profileId);

    const { data: depois } = await service
      .from("priority_profiles")
      .select("status, validated_at")
      .eq("id", profileId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR VALIDATED -> DRAFT ` +
        `(antes: VALIDATED; depois do ataque: ${depois!.status})`,
    ).not.toBeNull();
    expect(depois!.status, "o Perfil validado não pode regredir").toBe("VALIDATED");
    expect(depois!.validated_at, "o carimbo de validação não pode sumir").not.toBeNull();
  });
});

describe("GATE-C4 [Bloco C] seleção DELIVERED imutável", () => {
  it("Curador NÃO muta seleção DELIVERED -> DRAFT com delivered_at = null", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c4");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: true },
    );

    // ATAQUE: desentregar. A CHECK de coerência aceita o par (DRAFT, null),
    // então hoje o fato da entrega é apagável por um UPDATE comum.
    const { error } = await curador.client
      .from("curated_selections")
      .update({ status: "DRAFT", delivered_at: null })
      .eq("id", selectionId);

    const { data: depois } = await service
      .from("curated_selections")
      .select("status, delivered_at")
      .eq("id", selectionId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR a reversão da entrega ` +
        `(antes: DELIVERED; depois do ataque: ${depois!.status}, delivered_at=${depois!.delivered_at})`,
    ).not.toBeNull();
    expect(depois!.status, "entrega é fato — não regride").toBe("DELIVERED");
    expect(depois!.delivered_at, "o carimbo de entrega não pode ser apagado").not.toBeNull();
  });
});

describe("GATE-C5 [Bloco C] emitted_at de Relatório emitido é definitivo", () => {
  it("Curador NÃO sobrescreve emitted_at de um Relatório já emitido", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c5");
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

    const { data: antes } = await service
      .from("curadoria_reports")
      .select("emitted_at")
      .eq("id", reportId)
      .single();
    const emitidoOriginal = antes!.emitted_at as string;

    // ATAQUE: reescrever o carimbo de emissão. O trigger assert_report_lifecycle
    // congela o CONTEÚDO após a emissão, mas deixa o próprio emitted_at solto.
    const novoCarimbo = "2030-01-01T00:00:00.000Z";
    const { error } = await curador.client
      .from("curadoria_reports")
      .update({ emitted_at: novoCarimbo })
      .eq("id", reportId);

    const { data: depois } = await service
      .from("curadoria_reports")
      .select("emitted_at")
      .eq("id", reportId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR sobrescrita de emitted_at ` +
        `(antes: ${emitidoOriginal}; depois do ataque: ${depois!.emitted_at})`,
    ).not.toBeNull();
    expect(
      new Date(depois!.emitted_at as string).toISOString(),
      "o carimbo de emissão original deve sobreviver",
    ).toBe(new Date(emitidoOriginal).toISOString());
  });
});

describe("GATE-C6 [Bloco C] reentrega não reescreve o carimbo de entrega", () => {
  it("segundo update de delivered_at em Relatório e seleção já entregues deve ser recusado ou no-op", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c6");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: true },
    );
    const reportId = await relatorioDaSelecao(
      service,
      caseId,
      selectionId,
      curador.userId,
      profissionais,
      { emitido: true, entregue: true },
    );

    const { data: antesSel } = await service
      .from("curated_selections")
      .select("delivered_at")
      .eq("id", selectionId)
      .single();
    const { data: antesRep } = await service
      .from("curadoria_reports")
      .select("delivered_at")
      .eq("id", reportId)
      .single();

    const carimboSelecao = antesSel!.delivered_at as string;
    const carimboRelatorio = antesRep!.delivered_at as string;

    // ATAQUE: "reentregar" — um segundo update de delivered_at em artefatos já
    // entregues. Hoje nada impede o carimbo original de ser reescrito.
    const novoCarimbo = "2030-06-01T12:00:00.000Z";
    await curador.client
      .from("curated_selections")
      .update({ delivered_at: novoCarimbo })
      .eq("id", selectionId);
    await curador.client
      .from("curadoria_reports")
      .update({ delivered_at: novoCarimbo })
      .eq("id", reportId);

    const { data: depoisSel } = await service
      .from("curated_selections")
      .select("delivered_at")
      .eq("id", selectionId)
      .single();
    const { data: depoisRep } = await service
      .from("curadoria_reports")
      .select("delivered_at")
      .eq("id", reportId)
      .single();

    expect(
      new Date(depoisSel!.delivered_at as string).toISOString(),
      `o carimbo de entrega da SELEÇÃO deve ser imutável ` +
        `(antes: ${carimboSelecao}; depois do ataque: ${depoisSel!.delivered_at})`,
    ).toBe(new Date(carimboSelecao).toISOString());
    expect(
      new Date(depoisRep!.delivered_at as string).toISOString(),
      `o carimbo de entrega do RELATÓRIO deve ser imutável ` +
        `(antes: ${carimboRelatorio}; depois do ataque: ${depoisRep!.delivered_at})`,
    ).toBe(new Date(carimboRelatorio).toISOString());
  });
});

describe("GATE-C7 [Bloco C] entrega sem as três opções é impossível", () => {
  it("INSERT de curated_selections já-DELIVERED com 0 opções deve ser recusado", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c7");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);

    // ATAQUE: nascer entregue, sem nenhuma opção. A CHECK só exige coerência
    // status/delivered_at — a Barreira 4 (exatamente três) não é do banco.
    const { data, error } = await curador.client
      .from("curated_selections")
      .insert({
        case_id: caseId,
        priority_profile_id: profileId,
        selected_by: curador.userId,
        composition_rationale: "Entrega forjada sem opções.",
        status: "DELIVERED",
        delivered_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (data?.id) {
      const { count } = await service
        .from("curated_selection_options")
        .select("*", { count: "exact", head: true })
        .eq("curated_selection_id", data.id as string);
      expect(
        error,
        `o banco deve RECUSAR seleção que nasce DELIVERED sem opções ` +
          `(a linha foi aceita com ${count ?? 0} opções)`,
      ).not.toBeNull();
    }
    expect(error, "o banco deve RECUSAR o INSERT já-DELIVERED com 0 opções").not.toBeNull();
  });
});

describe("GATE-C8 [Bloco C] escolha da paciente congela depois de DECISAO_REGISTRADA (ADR-063 §6)", () => {
  // COMPORTAMENTO REAL VERIFICADO (2026-08-02): este é o ÚNICO gate do Bloco C
  // que já está VERDE hoje — o trigger `assert_connection_valid_transition`
  // (migration 20260723164933, stage 5) recusa a troca de profissional quando
  // o status já saiu de DECISAO_REGISTRADA. O teste permanece como pino de
  // regressão: o Bloco C não pode afrouxar essa tranca ao mexer na vizinhança.
  it("após avançar a Connection, a própria paciente NÃO altera mais a escolha", async () => {
    const { caseId, paciente } = await casoComCurador(service, curador.userId, "gate-c8");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(
      service,
      caseId,
      profileId,
      curador.userId,
      profissionais,
      { entregue: true },
    );
    const reportId = await relatorioDaSelecao(
      service,
      caseId,
      selectionId,
      curador.userId,
      profissionais,
      { emitido: true, entregue: true },
    );

    const agora = new Date().toISOString();
    const { data: connection, error: rpcError } = await paciente.client.rpc(
      "create_connection_from_report",
      {
        p_report_id: reportId,
        p_professional_profile_id: profissionais[0],
        p_decided_at: agora,
        p_actor_id: paciente.userId,
        p_event_payload: {},
        p_occurred_at: agora,
        p_recorded_at: agora,
      },
    );
    expect(rpcError, `a decisão da paciente precisa nascer: ${rpcError?.message}`).toBeNull();
    const connectionId = (connection as { id: string }).id;

    // Em DECISAO_REGISTRADA a correção é legítima (ADR-063 §6) — aqui a
    // Connection AVANÇA, e a partir daí a escolha vira fato.
    const { error: avancoError } = await paciente.client
      .from("connection_records")
      .update({ status: "CONTATO_INICIADO" })
      .eq("id", connectionId);
    expect(avancoError, `o avanço legítimo precisa passar: ${avancoError?.message}`).toBeNull();

    // ATAQUE: com sessão real da própria paciente, trocar o profissional
    // escolhido (por outro dos três entregues, para isolar SÓ a regra de fase).
    const { error } = await paciente.client
      .from("connection_records")
      .update({ professional_profile_id: profissionais[1] })
      .eq("id", connectionId);

    const { data: depois } = await service
      .from("connection_records")
      .select("professional_profile_id, status")
      .eq("id", connectionId)
      .single();

    expect(
      error,
      `o banco deve RECUSAR troca de escolha após ${depois!.status} ` +
        `(antes: ${profissionais[0]}; depois do ataque: ${depois!.professional_profile_id})`,
    ).not.toBeNull();
    expect(depois!.professional_profile_id, "a escolha registrada deve permanecer").toBe(
      profissionais[0],
    );
  });
});

describe("GATE-C9 [Bloco C] atos sensíveis deixam rastro em audit_logs", () => {
  it("(a) reset de senha de paciente gera linha de auditoria", async () => {
    const paciente = await novaPaciente(service, "gate-c9a");

    const antes = await contarAuditoria();
    await resetPatientPassword(service, paciente.userId);
    const depois = await contarAuditoria();

    expect(
      depois,
      `resetar a senha de ${paciente.userId} precisa deixar rastro em audit_logs ` +
        `(linhas antes: ${antes}; depois do ato: ${depois} — hoje o ato é invisível)`,
    ).toBeGreaterThan(antes);
  });

  it("(b) despublicação de profissional gera linha de auditoria", async () => {
    // Fixture de certificação (satisfaz a porta de publicação). Republicada
    // aqui para o teste ser auto-suficiente mesmo com resíduo de execuções
    // anteriores na stack local compartilhada.
    const alvo = profissionalPublicado;
    const { error: republicacao } = await service
      .from("professional_profiles")
      .update(await transicaoPublicar(service))
      .eq("id", alvo);
    expect(republicacao, `pré-condição (publicar): ${republicacao?.message}`).toBeNull();

    const { data: antes } = await service
      .from("professional_profiles")
      .select("publication_status")
      .eq("id", alvo)
      .single();
    expect(antes!.publication_status, "estado ANTES do ato").toBe("publicado");

    const linhasAntes = await contarAuditoria();
    const { error } = await admin.client
      .from("professional_profiles")
      .update(await transicaoDespublicar(service, admin.userId))
      .eq("id", alvo);
    expect(error, `a despublicação em si precisa funcionar: ${error?.message}`).toBeNull();
    const linhasDepois = await contarAuditoria();

    expect(
      linhasDepois,
      `despublicar o profissional ${alvo} precisa deixar rastro em audit_logs ` +
        `(linhas antes: ${linhasAntes}; depois do ato: ${linhasDepois} — hoje o ato é invisível)`,
    ).toBeGreaterThan(linhasAntes);
  });

  it("(c) delete de patient_documents gera linha de auditoria", async () => {
    const paciente = await novaPaciente(service, "gate-c9c");
    const { data: doc } = await paciente.client
      .from("patient_documents")
      .insert({
        profile_id: paciente.userId,
        uploaded_by: paciente.userId,
        file_path: `${paciente.userId}/${randomUUID()}.pdf`,
        file_name: "exame-sintetico.pdf",
        content_type: "application/pdf",
        file_size: 1234,
      })
      .select("id")
      .single();

    const antes = await contarAuditoria();
    const { error } = await admin.client
      .from("patient_documents")
      .delete()
      .eq("id", doc!.id as string);
    expect(error, `o delete em si precisa funcionar: ${error?.message}`).toBeNull();
    const depois = await contarAuditoria();

    expect(
      depois,
      `apagar o documento ${doc!.id} precisa deixar rastro em audit_logs ` +
        `(linhas antes: ${antes}; depois do ato: ${depois} — hoje o ato é invisível)`,
    ).toBeGreaterThan(antes);
  });
});

describe("GATE-C10 [Bloco C — CONTRATO FUTURO, ADR-049] supersessão atômica do Perfil", () => {
  it("deve existir fluxo atômico que marca o Perfil ativo como SUPERSEDED e cria o novo — hoje o índice one_active_per_case só sabe bloquear", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "gate-c10");
    const perfilOriginal = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    // Evidência do estado atual: a via ingênua (segundo Perfil ativo) esbarra
    // no índice parcial — não há NENHUM caminho para supersessão.
    const { error: insertError } = await curador.client.from("priority_profiles").insert({
      case_id: caseId,
      curator_id: curador.userId,
      status: "DRAFT",
      patient_history: "Nova rodada do Perfil (supersessão).",
    });

    // CONTRATO (Bloco C / ADR-049): um fluxo transacional único faz
    // SUPERSEDED + novo ativo sem janela intermediária.
    const { error: rpcError } = await curador.client.rpc("supersede_priority_profile", {
      _case_id: caseId,
      _reason: "Nova rodada de prioridades combinada com a paciente.",
    });

    expect(
      rpcError,
      `fluxo atômico de supersessão inexistente (contrato do Bloco C / ADR-049). ` +
        `RPC: ${rpcError?.message ?? "?"} — e a via direta hoje só bloqueia: ` +
        `${insertError?.message ?? "insert direto passou (?)"}`,
    ).toBeNull();

    const { data: original } = await service
      .from("priority_profiles")
      .select("status")
      .eq("id", perfilOriginal)
      .single();
    expect(original!.status, "o Perfil anterior deve ficar SUPERSEDED").toBe("SUPERSEDED");

    const { count: ativos } = await service
      .from("priority_profiles")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId)
      .neq("status", "SUPERSEDED");
    expect(ativos, "deve existir exatamente um Perfil ativo após a supersessão").toBe(1);
  });
});
