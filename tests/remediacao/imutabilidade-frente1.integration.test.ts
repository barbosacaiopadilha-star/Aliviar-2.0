import { describe, expect, it, beforeAll } from "vitest";

import {
  casoComCurador,
  entrarComo,
  perfilDePrioridades,
  serviceClient,
  type Sessao,
} from "./apoio";

/**
 * =============================================================================
 * GATES DA FRENTE 1 DO BLOCO C — SUPERSESSÃO, DESCONGELAMENTO E AUTORIA
 * =============================================================================
 *
 * Complementam os gates C2/C3/C10 de `imutabilidade.integration.test.ts` com
 * os contratos que a matriz aprovada exige e que os gates originais não
 * cobrem: idempotência e concorrência da supersessão, autorização por RELAÇÃO
 * com o Case (R4), motivo obrigatório, trilha de auditoria dos dois atos
 * (profile_superseded / profile_recognized) e o descongelamento do Mapa sob o
 * sucessor DRAFT.
 *
 * Mesmo padrão da casa: estado preparado com service_role, ato com sessão
 * REAL do papel — login de verdade, RLS de verdade.
 */

const service = serviceClient();

let curador: Sessao;

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
});

type PerfilRow = { id: string; status: string; case_id: string };

async function supersedePorCurador(caseId: string, reason: string) {
  return curador.client.rpc("supersede_priority_profile", {
    _case_id: caseId,
    _reason: reason,
  });
}

async function preencherMapaCompleto(caseId: string): Promise<void> {
  const { data: conceitos, error } = await service
    .from("method_subcriteria")
    .select("id")
    .eq("active", true);
  if (error) throw new Error(`catálogo: ${error.message}`);
  const { error: mapError } = await service.from("case_priority_map").upsert(
    (conceitos ?? []).map((conceito) => ({
      case_id: caseId,
      subcriterion_id: conceito.id as string,
      importance: "RELEVANTE",
    })),
    { onConflict: "case_id,subcriterion_id" },
  );
  if (mapError) throw new Error(`mapa completo: ${mapError.message}`);
}

describe("GATE-F1-SUP [Bloco C/Frente 1] supersessão: contrato completo da ADR-049", () => {
  it("o Mapa congelado DESCONGELA sob o sucessor DRAFT — e o vínculo/auditoria da supersessão existem", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f1-sup-mapa");
    const perfilOriginal = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    const { data: conceito } = await service
      .from("method_subcriteria")
      .select("id")
      .eq("active", true)
      .limit(1)
      .single();
    const { data: linha } = await service
      .from("case_priority_map")
      .insert({ case_id: caseId, subcriterion_id: conceito!.id, importance: "IMPORTANTE" })
      .select("id")
      .single();
    const linhaId = linha!.id as string;

    // ANTES da supersessão: o Mapa está congelado para o próprio Curador.
    const { error: congelado } = await curador.client
      .from("case_priority_map")
      .update({ importance: "RELEVANTE" })
      .eq("id", linhaId);
    expect(congelado, "pré-condição (C2): Mapa congelado sob VALIDATED").not.toBeNull();

    // O ato oficial.
    const { data: sucessor, error: rpcError } = await supersedePorCurador(
      caseId,
      "Nova rodada combinada com a paciente.",
    );
    expect(rpcError, `supersessão oficial: ${rpcError?.message}`).toBeNull();
    const sucessorId = (sucessor as PerfilRow).id;
    expect((sucessor as PerfilRow).status, "o sucessor nasce DRAFT").toBe("DRAFT");

    // O vínculo é explícito na linha superada.
    const { data: original } = await service
      .from("priority_profiles")
      .select("status, superseded_by, superseded_at, superseded_reason, superseded_actor_id, validated_at")
      .eq("id", perfilOriginal)
      .single();
    expect(original!.status).toBe("SUPERSEDED");
    expect(original!.superseded_by, "vínculo com o sucessor").toBe(sucessorId);
    expect(original!.superseded_at, "carimbo da supersessão").not.toBeNull();
    expect(original!.superseded_reason).toBe("Nova rodada combinada com a paciente.");
    expect(original!.superseded_actor_id, "autor da supersessão").toBe(curador.userId);
    expect(
      original!.validated_at,
      "o carimbo do reconhecimento anterior sobrevive como história",
    ).not.toBeNull();

    // A auditoria nomeia o ato.
    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata")
      .eq("action", "profile_superseded")
      .contains("metadata", { successor_profile_id: sucessorId });
    expect(trilha ?? [], "audit_log profile_superseded do ato").toHaveLength(1);
    expect(trilha![0]!.actor_id).toBe(curador.userId);

    // DEPOOIS da supersessão: o MESMO Curador volta a editar o Mapa — o
    // congelamento é do reconhecimento, nunca do Case (contrato do C2).
    const { error: descongelado } = await curador.client
      .from("case_priority_map")
      .update({ importance: "NAO_INFLUENCIA" })
      .eq("id", linhaId);
    expect(descongelado, `sob sucessor DRAFT o Mapa edita: ${descongelado?.message}`).toBeNull();

    const { data: depois } = await service
      .from("case_priority_map")
      .select("importance")
      .eq("id", linhaId)
      .single();
    expect(depois!.importance).toBe("NAO_INFLUENCIA");
  });

  it("repetir a supersessão com o sucessor DRAFT vivo devolve o MESMO sucessor (idempotência documentada)", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f1-sup-idem");
    await perfilDePrioridades(service, caseId, curador.userId, { validado: true });

    const primeira = await supersedePorCurador(caseId, "Primeira rodada nova.");
    expect(primeira.error, `primeira supersessão: ${primeira.error?.message}`).toBeNull();
    const sucessorId = (primeira.data as PerfilRow).id;

    const segunda = await supersedePorCurador(caseId, "Repetição do mesmo ato.");
    expect(segunda.error, `repetição deve devolver o sucessor: ${segunda.error?.message}`).toBeNull();
    expect((segunda.data as PerfilRow).id, "o MESMO sucessor, nunca um segundo").toBe(sucessorId);

    const { count: perfis } = await service
      .from("priority_profiles")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId);
    expect(perfis, "exatamente 2 Perfis no Case (original + sucessor)").toBe(2);
  });

  it("duas supersessões em PARALELO produzem exatamente 1 sucessor", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f1-sup-par");
    const perfilOriginal = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    const resultados = await Promise.allSettled([
      supersedePorCurador(caseId, "Rodada nova — clique um."),
      supersedePorCurador(caseId, "Rodada nova — clique dois."),
    ]);

    const ids = resultados.map((resultado) => {
      if (resultado.status !== "fulfilled") return `rejeitada: ${String(resultado.reason)}`;
      if (resultado.value.error) return `erro: ${resultado.value.error.message}`;
      return (resultado.value.data as PerfilRow).id;
    });

    const { count: perfis } = await service
      .from("priority_profiles")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId);
    const { count: ativos } = await service
      .from("priority_profiles")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId)
      .neq("status", "SUPERSEDED");

    expect(perfis, `paralelo => 1 sucessor só (resultados: ${ids.join(" | ")})`).toBe(2);
    expect(ativos, "exatamente um Perfil ativo").toBe(1);

    const { data: original } = await service
      .from("priority_profiles")
      .select("status")
      .eq("id", perfilOriginal)
      .single();
    expect(original!.status).toBe("SUPERSEDED");
  });

  it("autorização é por RELAÇÃO com o Case (R4): papel sem atribuição e a própria paciente são recusados", async () => {
    const { caseId, paciente } = await casoComCurador(service, curador.userId, "f1-sup-auth");
    const perfilId = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    // Papel de equipe SEM relação com o Case.
    const concierge = await entrarComo("concierge");
    const { error: semRelacao } = await concierge.client.rpc("supersede_priority_profile", {
      _case_id: caseId,
      _reason: "Não sou o Curador deste Case.",
    });
    expect(semRelacao, "papel sem atribuição ao Case não supersede").not.toBeNull();

    // A paciente também não: supersessão é ato de condução, não de consentimento.
    const { error: daPaciente } = await paciente.client.rpc("supersede_priority_profile", {
      _case_id: caseId,
      _reason: "Tentativa da própria paciente.",
    });
    expect(daPaciente, "a paciente não supersede o próprio Perfil").not.toBeNull();

    const { data: depois } = await service
      .from("priority_profiles")
      .select("status")
      .eq("id", perfilId)
      .single();
    expect(depois!.status, "as recusas não mudam nada").toBe("VALIDATED");
  });

  it("supersessão sem motivo é recusada; Perfil ainda DRAFT (nunca reconhecido) também não se supersede", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f1-sup-motivo");
    const perfilId = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: true,
    });

    const { error: semMotivo } = await supersedePorCurador(caseId, "   ");
    expect(semMotivo, "sem motivo não existe supersessão").not.toBeNull();

    const { data: aindaValidado } = await service
      .from("priority_profiles")
      .select("status")
      .eq("id", perfilId)
      .single();
    expect(aindaValidado!.status).toBe("VALIDATED");

    // Perfil DRAFT que nunca foi reconhecido: rascunho se edita, não se
    // supersede (recusa explícita — distinta da idempotência do sucessor).
    const { caseId: caseDraft } = await casoComCurador(service, curador.userId, "f1-sup-draft");
    await perfilDePrioridades(service, caseDraft, curador.userId, { validado: false });
    const { error: deDraft } = await supersedePorCurador(caseDraft, "Rodada sobre rascunho.");
    expect(deDraft, "rascunho nunca reconhecido não se supersede").not.toBeNull();
  });
});

describe("GATE-F1-REC [Bloco C/Frente 1] o reconhecimento tem autora nomeada", () => {
  it("reconhecer grava audit_log profile_recognized com a paciente como autora — e repetir não duplica a trilha", async () => {
    const { caseId, paciente } = await casoComCurador(service, curador.userId, "f1-rec");
    const perfilId = await perfilDePrioridades(service, caseId, curador.userId, {
      validado: false,
    });
    await preencherMapaCompleto(caseId);

    const { data: resultado, error } = await paciente.client.rpc("acknowledge_priority_profile", {
      _case_id: caseId,
    });
    expect(error, `o reconhecimento precisa acontecer: ${error?.message}`).toBeNull();
    expect(resultado).toBe("RECONHECIDO");

    const trilhaDoCaso = () =>
      service
        .from("audit_logs")
        .select("actor_id, target_profile_id, metadata")
        .eq("action", "profile_recognized")
        .contains("metadata", { case_id: caseId });

    const { data: trilha } = await trilhaDoCaso();
    expect(trilha ?? [], "exatamente uma linha profile_recognized do ato").toHaveLength(1);
    expect(trilha![0]!.actor_id, "a autora é a própria paciente").toBe(paciente.userId);
    expect(trilha![0]!.target_profile_id).toBe(paciente.userId);
    expect((trilha![0]!.metadata as { priority_profile_id: string }).priority_profile_id).toBe(
      perfilId,
    );

    // Sem conteúdo clínico: a trilha carrega identificadores e carimbos, nada
    // do que a paciente contou.
    const metadata = JSON.stringify(trilha![0]!.metadata);
    expect(metadata).not.toContain("Histórico sintético");

    // Idempotência do ato não duplica a trilha.
    const repeticao = await paciente.client.rpc("acknowledge_priority_profile", {
      _case_id: caseId,
    });
    expect(repeticao.data).toBe("JA_RECONHECIDO");
    const { data: trilhaDepois } = await trilhaDoCaso();
    expect(trilhaDepois ?? [], "repetição não gera segunda linha").toHaveLength(1);
  });
});
