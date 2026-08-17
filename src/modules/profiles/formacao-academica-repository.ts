import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isFormacaoKind,
  ordenarParaApresentacao,
  type FormacaoEntrada,
  type FormacaoPublica,
  type FormacaoStatus,
} from "@/modules/profiles/formacao-academica";

/**
 * O repositório da formação acadêmica — as portas de leitura e escrita que a
 * extração NÃO tem. Confirmar, corrigir e excluir são atos de pessoa; a RLS
 * (admin para escrita; paciente só em `verificado` de Curadoria entregue)
 * decide o alcance — nenhuma segunda autoridade aqui.
 */

type LinhaEntry = {
  id: string;
  professional_profile_id: string;
  kind: string;
  title: string;
  institution: string | null;
  city: string | null;
  country: string | null;
  period_start: number | null;
  period_end: number | null;
  notes: string | null;
  verification_status: string;
  verified_at: string | null;
};

const CAMPOS = "id, professional_profile_id, kind, title, institution, city, country, period_start, period_end, notes, verification_status, verified_at";

function paraEntrada(l: LinhaEntry, origem: FormacaoEntrada["origem"]): FormacaoEntrada {
  return {
    id: l.id,
    professionalProfileId: l.professional_profile_id,
    kind: isFormacaoKind(l.kind) ? l.kind : "curso",
    title: l.title,
    institution: l.institution,
    city: l.city,
    country: l.country,
    periodStart: l.period_start,
    periodEnd: l.period_end,
    notes: l.notes,
    verificationStatus: l.verification_status as FormacaoStatus,
    verifiedAt: l.verified_at,
    origem,
  };
}

/** Visão administrativa: tudo, com o rastro de origem para revisão. */
export async function listarFormacaoParaRevisao(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<FormacaoEntrada[]> {
  const [{ data: linhas }, { data: vinculos }] = await Promise.all([
    supabase
      .from("professional_education_entries")
      .select(CAMPOS)
      .eq("professional_profile_id", professionalProfileId),
    supabase
      .from("professional_education_extraction_links")
      .select("entry_id, document_id, human_edited"),
  ]);
  const origemPorEntry = new Map(
    (vinculos ?? []).map((v) => [
      v.entry_id as string,
      { documentId: v.document_id as string, humanEdited: Boolean(v.human_edited) },
    ]),
  );
  return ordenarParaApresentacao(
    ((linhas ?? []) as LinhaEntry[]).map((l) => paraEntrada(l, origemPorEntry.get(l.id) ?? null)),
  );
}

/**
 * Visão pública: SÓ campos de apresentação. Fonte, notas, documento e execução
 * ficam de fora do SELECT — e as tabelas de rastro nem têm policy de paciente.
 */
export type LeituraDeFormacao =
  | { ok: true; porProfissional: Map<string, FormacaoPublica[]> }
  | { ok: false; motivo: "indisponivel" };

export async function listarFormacaoConfirmada(
  supabase: SupabaseClient,
  professionalProfileIds: readonly string[],
): Promise<LeituraDeFormacao> {
  if (professionalProfileIds.length === 0) return { ok: true, porProfissional: new Map() };
  const { data, error } = await supabase
    .from("professional_education_entries")
    .select("professional_profile_id, kind, title, institution, city, country, period_start, period_end")
    .in("professional_profile_id", [...professionalProfileIds])
    .eq("verification_status", "verificado");

  // F-2 · erro de leitura NÃO é lista vazia. Ausência legítima e falha são
  // estados diferentes: dizer "sem formação" quando a verdade é "não
  // conseguimos ler" mentiria para a paciente. Nada do erro técnico atravessa
  // esta fronteira — quem chama recebe um motivo fechado.
  if (error) return { ok: false, motivo: "indisponivel" };

  const porProfissional = new Map<string, FormacaoPublica[]>();
  for (const l of data ?? []) {
    const kind = l.kind as string;
    if (!isFormacaoKind(kind)) continue;
    const lista = porProfissional.get(l.professional_profile_id as string) ?? [];
    lista.push({
      kind,
      title: l.title as string,
      institution: (l.institution as string | null) ?? null,
      city: (l.city as string | null) ?? null,
      country: (l.country as string | null) ?? null,
      periodStart: (l.period_start as number | null) ?? null,
      periodEnd: (l.period_end as number | null) ?? null,
    });
    porProfissional.set(l.professional_profile_id as string, lista);
  }
  for (const [id, lista] of porProfissional) porProfissional.set(id, ordenarParaApresentacao(lista));
  return { ok: true, porProfissional };
}

export type CamposDeFormacao = {
  kind: string;
  title: string;
  institution: string | null;
  city: string | null;
  country: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  notes: string | null;
};

export type ResultadoDeEscrita = { ok: true } | { ok: false; motivo: string };

/**
 * Edição pela equipe. Duas consequências deliberadas:
 * - o vínculo de extração (se houver) vira `human_edited` — reprocessamento
 *   nunca mais substitui esta linha;
 * - editar uma entrada `verificado` a REBAIXA para `nao_verificado`: mudou o
 *   conteúdo, a verificação anterior não fala mais por ele.
 */
export async function salvarEdicaoDeFormacao(
  supabase: SupabaseClient,
  entryId: string,
  campos: CamposDeFormacao,
): Promise<ResultadoDeEscrita> {
  if (!isFormacaoKind(campos.kind)) return { ok: false, motivo: "tipo_invalido" };
  if (!campos.title.trim()) return { ok: false, motivo: "titulo_obrigatorio" };

  const { error } = await supabase
    .from("professional_education_entries")
    .update({
      kind: campos.kind,
      title: campos.title.trim(),
      institution: campos.institution?.trim() || null,
      city: campos.city?.trim() || null,
      country: campos.country?.trim() || null,
      period_start: campos.periodStart,
      period_end: campos.periodEnd,
      notes: campos.notes?.trim() || null,
      verification_status: "nao_verificado",
      verified_at: null,
      verified_by: null,
    })
    .eq("id", entryId);
  if (error) return { ok: false, motivo: "escrita_recusada" };

  await supabase
    .from("professional_education_extraction_links")
    .update({ human_edited: true })
    .eq("entry_id", entryId);

  return { ok: true };
}

/**
 * Confirmação individual — o ÚNICO caminho para `verificado`.
 * Decisão vinculante 3: instituição presente no currículo é obrigatória na
 * publicação. Sem instituição, confirmar exige justificativa explícita, que
 * fica gravada nas notas administrativas (nunca exibidas ao paciente).
 */
export async function confirmarFormacao(
  supabase: SupabaseClient,
  entryId: string,
  actorId: string,
  opcoes?: { justificativaSemInstituicao?: string },
): Promise<ResultadoDeEscrita> {
  const { data: atual } = await supabase
    .from("professional_education_entries")
    .select("institution, notes, source")
    .eq("id", entryId)
    .single();
  if (!atual) return { ok: false, motivo: "entrada_inexistente" };

  // Política de Fontes (CHECK `verificado_exige_proveniencia`): confirmar sem
  // fonte é impossível no banco — aqui a recusa ganha nome antes do Postgres.
  if (!((atual.source as string | null) ?? "").trim()) {
    return { ok: false, motivo: "fonte_ausente" };
  }

  const temInstituicao = Boolean((atual.institution as string | null)?.trim());
  const justificativa = opcoes?.justificativaSemInstituicao?.trim();
  if (!temInstituicao && !justificativa) {
    return { ok: false, motivo: "instituicao_obrigatoria" };
  }

  const notas = !temInstituicao && justificativa
    ? [((atual.notes as string | null) ?? "").trim(), `Confirmada sem instituição: ${justificativa}`]
        .filter(Boolean)
        .join("\n")
    : ((atual.notes as string | null) ?? null);

  const { error } = await supabase
    .from("professional_education_entries")
    .update({
      verification_status: "verificado",
      verified_at: new Date().toISOString(),
      verified_by: actorId,
      notes: notas,
    })
    .eq("id", entryId);
  return error ? { ok: false, motivo: "escrita_recusada" } : { ok: true };
}

/** Exclusão pela equipe (candidato errado, entrada obsoleta). */
export async function excluirFormacao(
  supabase: SupabaseClient,
  entryId: string,
): Promise<ResultadoDeEscrita> {
  const { error } = await supabase.from("professional_education_entries").delete().eq("id", entryId);
  return error ? { ok: false, motivo: "escrita_recusada" } : { ok: true };
}

/**
 * Entrada manual — contingência administrativa (currículo visual, formação
 * fora do documento). Existe, mas não conta como preenchimento automático.
 */
export async function criarFormacaoManual(
  supabase: SupabaseClient,
  professionalProfileId: string,
  campos: CamposDeFormacao,
): Promise<ResultadoDeEscrita> {
  if (!isFormacaoKind(campos.kind)) return { ok: false, motivo: "tipo_invalido" };
  if (!campos.title.trim()) return { ok: false, motivo: "titulo_obrigatorio" };
  const { error } = await supabase.from("professional_education_entries").insert({
    professional_profile_id: professionalProfileId,
    kind: campos.kind,
    title: campos.title.trim(),
    institution: campos.institution?.trim() || null,
    city: campos.city?.trim() || null,
    country: campos.country?.trim() || null,
    period_start: campos.periodStart,
    period_end: campos.periodEnd,
    notes: campos.notes?.trim() || null,
    source: "digitacao_manual",
  });
  return error ? { ok: false, motivo: "escrita_recusada" } : { ok: true };
}

/** Currículos anexados do profissional + o desfecho da última leitura de cada um. */
export async function listarCurriculosComUltimaLeitura(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<
  Array<{ documentId: string; fileName: string; ultimaLeitura: { status: string; erro: string | null } | null }>
> {
  const [{ data: docs }, { data: runs }] = await Promise.all([
    supabase
      .from("professional_documents")
      .select("id, file_name, content_type")
      .eq("professional_profile_id", professionalProfileId)
      .order("created_at"),
    supabase
      .from("professional_education_extraction_runs")
      .select("document_id, status, erro, created_at")
      .eq("professional_profile_id", professionalProfileId)
      .order("created_at", { ascending: false }),
  ]);
  const ultimaPorDoc = new Map<string, { status: string; erro: string | null }>();
  for (const r of runs ?? []) {
    if (!ultimaPorDoc.has(r.document_id as string)) {
      ultimaPorDoc.set(r.document_id as string, {
        status: r.status as string,
        erro: (r.erro as string | null) ?? null,
      });
    }
  }
  return (docs ?? [])
    .filter((d) => (d.content_type as string | null)?.includes("pdf"))
    .map((d) => ({
      documentId: d.id as string,
      fileName: d.file_name as string,
      ultimaLeitura: ultimaPorDoc.get(d.id as string) ?? null,
    }));
}
