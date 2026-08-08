import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A LEITURA da Fronteira do Mapa do Profissional (Item 2.C §10).
 *
 * Monta, por proposta do alvo profissional, os NOVE elementos do A2c a partir
 * das fontes canônicas — nada é copiado para cá como segunda origem:
 * proposta (`derivation_proposals`), declaração original (`practice_evidence`
 * exata do `origin_record`), regra+versão, ato/desfecho/autoria
 * (`derivation_proposal_acts` + `profiles`), estado atual do Mapa e o
 * julgamento VIGENTE associado quando exista (LEITURA de `curator_judgments`
 * — nunca edição, G-2.C-6).
 *
 * O chamador é a página interna com gate `administrador`; o cliente é o
 * caminho servidor já autorizado da operação. Nenhuma policy nasce.
 */

export type ItemDaFronteira = {
  proposalId: string;
  professionalProfileId: string;
  professionalName: string;
  subcriterionCode: string;
  conceptName: string;
  /** Elemento 2 — a proposta. */
  suggestedStatus: string;
  /** Elemento 1 — a declaração original, exata e imutável. */
  origem: {
    record: string;
    version: string;
    declaredAt: string;
    author: string;
    /** A leitura da evidência apontada (opções da coleta), para exibição. */
    resumo: string;
    verificationStatus: string | null;
  };
  /** Elemento 4 — a regra aplicada. */
  regra: { ruleId: string; ruleVersion: number; catalogVersion: string; emittedAt: string };
  /** Elemento 8 — o desfecho registrado (PROPOSTA = pendente, por leitura). */
  state: "PROPOSTA" | "CONFIRMADA" | "RECUSADA" | "SUPERADA" | "RETIRADA";
  /** Elementos 6 e 7 — autoria e data do ato, quando decidido. */
  ato: { natureza: string; actorName: string; actedAt: string } | null;
  /** Estado atual do Mapa para o par (contexto do item). */
  mapaAtual: { status: string; evidenceId: string | null } | null;
  /** Julgamento VIGENTE associado, quando exista — leitura, nunca edição. */
  julgamentoVigente: { conclusao: string; versao: number } | null;
};

export async function loadFronteiraDoMapa(service: SupabaseClient): Promise<ItemDaFronteira[]> {
  const { data: proposals, error } = await service
    .from("derivation_proposals")
    .select(
      "id, professional_profile_id, subcriterion_code, suggested_value, origin_record, origin_version, origin_declared_at, origin_author, rule_id, rule_version, catalog_version, emitted_at, state",
    )
    .not("professional_profile_id", "is", null)
    .order("emitted_at", { ascending: true });
  if (error || !proposals) return [];

  const professionalIds = [...new Set(proposals.map((p) => p.professional_profile_id as string))];
  const proposalIds = proposals.map((p) => p.id as string);
  const evidenceIds = proposals
    .map((p) => (p.origin_record as string).replace("practice_evidence:", ""))
    .filter((id) => id.length > 0);

  const [profissionais, conceitos, atos, evidencias, mapa, julgamentos] = await Promise.all([
    professionalIds.length
      ? service.from("professional_profiles").select("id, display_name").in("id", professionalIds)
      : Promise.resolve({ data: [] }),
    service.from("method_subcriteria").select("id, code, name"),
    proposalIds.length
      ? service
          .from("derivation_proposal_acts")
          .select("proposal_id, natureza, actor_id, acted_at")
          .in("proposal_id", proposalIds)
      : Promise.resolve({ data: [] }),
    evidenceIds.length
      ? service
          .from("practice_evidence")
          .select("id, options, details, status, subcriterion_code")
          .in("id", evidenceIds)
      : Promise.resolve({ data: [] }),
    professionalIds.length
      ? service
          .from("professional_subcriterion_map")
          .select("professional_profile_id, subcriterion_id, status, evidence_id")
          .in("professional_profile_id", professionalIds)
      : Promise.resolve({ data: [] }),
    professionalIds.length
      ? service
          .from("curator_judgments")
          .select("professional_profile_id, subcriterion_code, state, conclusao, versao")
          .in("professional_profile_id", professionalIds)
          .eq("state", "VIGENTE")
      : Promise.resolve({ data: [] }),
  ]);

  const nomeDoProfissional = new Map(
    (profissionais.data ?? []).map((p) => [p.id as string, p.display_name as string]),
  );
  const conceitoPorCode = new Map(
    (conceitos.data ?? []).map((c) => [c.code as string, c as { id: string; name: string }]),
  );
  const conceitoPorId = new Map(
    (conceitos.data ?? []).map((c) => [c.id as string, c.code as string]),
  );
  const atoPorProposal = new Map((atos.data ?? []).map((a) => [a.proposal_id as string, a]));
  const evidenciaPorId = new Map((evidencias.data ?? []).map((e) => [e.id as string, e]));
  const mapaPorAlvo = new Map(
    (mapa.data ?? []).map((m) => [
      `${m.professional_profile_id}:${conceitoPorId.get(m.subcriterion_id as string) ?? ""}`,
      m,
    ]),
  );
  const juizoPorAlvo = new Map(
    (julgamentos.data ?? []).map((j) => [
      `${j.professional_profile_id}:${j.subcriterion_code}`,
      j,
    ]),
  );

  const nomesDeAtores = [...new Set((atos.data ?? []).map((a) => a.actor_id as string))];
  const { data: perfisDeAtores } = nomesDeAtores.length
    ? await service.from("profiles").select("id, display_name").in("id", nomesDeAtores)
    : { data: [] };
  const nomeDoAtor = new Map(
    (perfisDeAtores ?? []).map((p) => [p.id as string, (p.display_name as string) ?? "—"]),
  );

  return proposals.map((proposta) => {
    const professionalProfileId = proposta.professional_profile_id as string;
    const code = proposta.subcriterion_code as string;
    const evidenceId = (proposta.origin_record as string).replace("practice_evidence:", "");
    const evidencia = evidenciaPorId.get(evidenceId);
    const ato = atoPorProposal.get(proposta.id as string);
    const chaveAlvo = `${professionalProfileId}:${code}`;
    const mapaAtual = mapaPorAlvo.get(chaveAlvo);
    const juizo = juizoPorAlvo.get(chaveAlvo);

    return {
      proposalId: proposta.id as string,
      professionalProfileId,
      professionalName: nomeDoProfissional.get(professionalProfileId) ?? "Profissional",
      subcriterionCode: code,
      conceptName: conceitoPorCode.get(code)?.name ?? code,
      suggestedStatus: proposta.suggested_value as string,
      origem: {
        record: proposta.origin_record as string,
        version: proposta.origin_version as string,
        declaredAt: proposta.origin_declared_at as string,
        author: proposta.origin_author as string,
        resumo: evidencia
          ? `${(evidencia.options as string[] | null)?.join(" · ") || "fato estruturado"}`
          : "evidência indisponível",
        verificationStatus: (evidencia?.status as string | null) ?? null,
      },
      regra: {
        ruleId: proposta.rule_id as string,
        ruleVersion: proposta.rule_version as number,
        catalogVersion: proposta.catalog_version as string,
        emittedAt: proposta.emitted_at as string,
      },
      state: proposta.state as ItemDaFronteira["state"],
      ato: ato
        ? {
            natureza: ato.natureza as string,
            actorName: nomeDoAtor.get(ato.actor_id as string) ?? "—",
            actedAt: ato.acted_at as string,
          }
        : null,
      mapaAtual: mapaAtual
        ? {
            status: mapaAtual.status as string,
            evidenceId: (mapaAtual.evidence_id as string | null) ?? null,
          }
        : null,
      julgamentoVigente: juizo
        ? { conclusao: juizo.conclusao as string, versao: juizo.versao as number }
        : null,
    };
  });
}
