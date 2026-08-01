import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PRACTICE_CATALOG_VERSION,
  evidenceReviewIsDue,
  validatePracticeEvidence,
  verificationTierRejection,
  type PracticeEvidenceInput,
} from "./evidencias-pratica";
import type { SourceTier } from "./fontes";

/**
 * BASE DE EVIDÊNCIAS DE PRÁTICA — o lado do banco.
 *
 * A única porta de escrita de `curadoria.practice_evidence`. O domínio recusa
 * primeiro (validatePracticeEvidence, contra o Catálogo 1.0.0 congelado); o
 * banco garante o resto (append-only por trigger, sequência de versão,
 * proveniência por CHECK, RLS de administrador).
 *
 * Nada aqui conclui compatibilidade, pontua ou compara profissionais. A Base
 * fornece informação; quem decide é o Curador, por Case.
 */

export type PracticeEvidenceRecord = {
  id: string;
  professionalProfileId: string;
  subcriterionCode: string;
  catalogVersion: string;
  version: number;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  observation: string | null;
  sourceTier: SourceTier;
  source: string;
  collectedAt: string;
  collectedBy: string;
  status: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationSource: string | null;
};

function fromRow(row: Record<string, unknown>): PracticeEvidenceRecord {
  return {
    id: row.id as string,
    professionalProfileId: row.professional_profile_id as string,
    subcriterionCode: row.subcriterion_code as string,
    catalogVersion: row.catalog_version as string,
    version: row.version as number,
    options: (row.options as string[]) ?? [],
    details: (row.details as Record<string, unknown>) ?? {},
    conditionNote: (row.condition_note as string | null) ?? null,
    observation: (row.observation as string | null) ?? null,
    sourceTier: row.source_tier as SourceTier,
    source: row.source as string,
    collectedAt: row.collected_at as string,
    collectedBy: row.collected_by as string,
    status: row.status as string,
    verifiedAt: (row.verified_at as string | null) ?? null,
    verifiedBy: (row.verified_by as string | null) ?? null,
    verificationSource: (row.verification_source as string | null) ?? null,
  };
}

const COLUNAS =
  "id, professional_profile_id, subcriterion_code, catalog_version, version, options, details, condition_note, observation, source_tier, source, collected_at, collected_by, status, verified_at, verified_by, verification_source";

async function currentVersion(
  supabase: SupabaseClient,
  professionalProfileId: string,
  subcriterionCode: string,
): Promise<{ version: number; row: PracticeEvidenceRecord | null }> {
  const { data, error } = await supabase
    .from("practice_evidence")
    .select(COLUNAS)
    .eq("professional_profile_id", professionalProfileId)
    .eq("subcriterion_code", subcriterionCode)
    .order("version", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Base de Evidências: ${error.message}`);
  const row = data?.[0] ? fromRow(data[0] as Record<string, unknown>) : null;
  return { version: row?.version ?? 0, row };
}

/**
 * Registra a resposta do Protocolo. Nasce `nao_verificado` SEMPRE — resposta
 * não é evidência verificada (P20); verificar é ato separado e assinado.
 */
export async function registerPracticeEvidence(
  supabase: SupabaseClient,
  input: PracticeEvidenceInput & {
    professionalProfileId: string;
    collectedBy: string;
    collectedAt?: string;
  },
): Promise<PracticeEvidenceRecord> {
  const recusas = validatePracticeEvidence(input);
  if (recusas.length > 0) throw new Error(recusas.join(" "));

  const { version } = await currentVersion(supabase, input.professionalProfileId, input.subcriterionCode);

  const { data, error } = await supabase
    .from("practice_evidence")
    .insert({
      professional_profile_id: input.professionalProfileId,
      subcriterion_code: input.subcriterionCode,
      catalog_version: PRACTICE_CATALOG_VERSION,
      version: version + 1,
      options: input.options,
      details: input.details,
      condition_note: input.conditionNote,
      observation: input.observation,
      source_tier: input.sourceTier,
      source: input.source,
      collected_at: input.collectedAt ?? new Date().toISOString(),
      collected_by: input.collectedBy,
      status: "nao_verificado",
    })
    .select(COLUNAS)
    .single();

  if (error) throw new Error(`Base de Evidências: ${error.message}`);
  return fromRow(data as Record<string, unknown>);
}

/**
 * Verificação: uma pessoa autorizada olhou a fonte e assina. A versão
 * declarada NÃO é tocada — nasce uma versão nova com o mesmo conteúdo e o
 * estado `verificado`. O histórico guarda as duas, e a diferença entre elas
 * é exatamente quem conferiu, quando e onde.
 */
export async function verifyPracticeEvidence(
  supabase: SupabaseClient,
  params: {
    professionalProfileId: string;
    subcriterionCode: string;
    verifiedBy: string;
    verificationSource: string;
    /** Nível da fonte CONSULTADA na verificação — precisa sustentar o conceito. */
    verificationTier: SourceTier;
    /**
     * A versão que o verificador tinha diante dos olhos. Se o conteúdo mudou
     * no meio do caminho, a verificação é recusada: verifica-se uma versão
     * específica, nunca o conceito em abstrato (Etapa 5).
     */
    expectedVersion: number;
    verifiedAt?: string;
  },
): Promise<PracticeEvidenceRecord> {
  const recusa = verificationTierRejection(params.subcriterionCode, params.verificationTier);
  if (recusa) throw new Error(recusa);

  const { row } = await currentVersion(supabase, params.professionalProfileId, params.subcriterionCode);
  if (!row) {
    throw new Error(
      `Não há evidência de ${params.subcriterionCode} para verificar — verificação sem declaração não existe.`,
    );
  }
  if (row.version !== params.expectedVersion) {
    throw new Error(
      `A informação mudou durante a verificação: você olhava a versão ${params.expectedVersion} e a corrente é ${row.version}. Confira o conteúdo novo antes de assinar.`,
    );
  }

  const { data, error } = await supabase
    .from("practice_evidence")
    .insert({
      professional_profile_id: row.professionalProfileId,
      subcriterion_code: row.subcriterionCode,
      catalog_version: row.catalogVersion,
      version: row.version + 1,
      options: row.options,
      details: row.details,
      condition_note: row.conditionNote,
      observation: row.observation,
      source_tier: row.sourceTier,
      source: row.source,
      collected_at: row.collectedAt,
      collected_by: row.collectedBy,
      status: "verificado",
      verified_at: params.verifiedAt ?? new Date().toISOString(),
      verified_by: params.verifiedBy,
      verification_source: params.verificationSource,
    })
    .select(COLUNAS)
    .single();

  if (error) throw new Error(`Base de Evidências: ${error.message}`);
  return fromRow(data as Record<string, unknown>);
}

/** Copia a versão corrente com um estado novo — o mecanismo único de flip. */
async function appendStateVersion(
  supabase: SupabaseClient,
  row: PracticeEvidenceRecord,
  status: "divergente" | "desatualizado",
  observation?: string | null,
): Promise<void> {
  const { error } = await supabase.from("practice_evidence").insert({
    professional_profile_id: row.professionalProfileId,
    subcriterion_code: row.subcriterionCode,
    catalog_version: row.catalogVersion,
    version: row.version + 1,
    options: row.options,
    details: row.details,
    condition_note: row.conditionNote,
    observation: observation !== undefined ? observation : row.observation,
    source_tier: row.sourceTier,
    source: row.source,
    collected_at: row.collectedAt,
    collected_by: row.collectedBy,
    status,
  });
  if (error) throw new Error(`Base de Evidências: ${error.message}`);
}

/**
 * Divergência: o que está declarado não bate com o que foi encontrado.
 * A divergência entra em `verification_divergences` — a MESMA tabela de
 * sempre, com o código do conceito como assunto — pelo cliente de QUEM ABRE
 * (a RLS decide: curador e administrador abrem). O flip do estado da
 * evidência para `divergente` passa pelo cliente com escrita na Base.
 */
export async function registerEvidenceDivergence(
  divergenceClient: SupabaseClient,
  evidenceClient: SupabaseClient,
  params: {
    professionalProfileId: string;
    subcriterionCode: string;
    declaredVersion: string;
    foundVersion: string;
    severity: "critica" | "observacao";
    openedBy: string;
  },
): Promise<void> {
  const { row } = await currentVersion(evidenceClient, params.professionalProfileId, params.subcriterionCode);
  if (!row) throw new Error(`Não há evidência de ${params.subcriterionCode} para divergir.`);

  const { error: divergenceError } = await divergenceClient.from("verification_divergences").insert({
    professional_profile_id: params.professionalProfileId,
    subject: params.subcriterionCode,
    declared_version: params.declaredVersion,
    found_version: params.foundVersion,
    severity: params.severity,
    opened_by: params.openedBy,
  });
  if (divergenceError) throw new Error(`Divergência: ${divergenceError.message}`);

  await appendStateVersion(evidenceClient, row, "divergente");
}

/**
 * Desatualização: a operação declara que a informação corrente não vale mais
 * (vencimento, prática que mudou, fonte que caiu). Versão nova, motivo curto
 * como observação — o conteúdo antigo permanece legível no histórico.
 */
export async function markEvidenceOutdated(
  supabase: SupabaseClient,
  params: { professionalProfileId: string; subcriterionCode: string; reason: string },
): Promise<void> {
  const motivo = params.reason.trim();
  if (motivo.length === 0 || motivo.length > 280) {
    throw new Error("Desatualizar exige um motivo curto (1 a 280 caracteres).");
  }
  const { row } = await currentVersion(supabase, params.professionalProfileId, params.subcriterionCode);
  if (!row) throw new Error(`Não há evidência de ${params.subcriterionCode} para desatualizar.`);
  await appendStateVersion(supabase, row, "desatualizado", motivo);
}

/**
 * Resolução de divergência — nos campos que a tabela vigente já tem
 * (resolution/resolved_by/resolved_at/resolved_version, com CHECK de
 * completude). A RLS decide quem resolve: administrador. Nunca edita a
 * evidência em silêncio: se o fato mudou, o caminho é resposta nova.
 */
export async function resolveEvidenceDivergence(
  supabase: SupabaseClient,
  params: {
    divergenceId: string;
    resolution: string;
    resolvedVersion: string;
    resolvedBy: string;
  },
): Promise<void> {
  const { data, error } = await supabase
    .from("verification_divergences")
    .update({
      status: "resolvida",
      resolution: params.resolution,
      resolved_version: params.resolvedVersion,
      resolved_by: params.resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.divergenceId)
    .eq("status", "aberta")
    .select("id");

  if (error) throw new Error(`Divergência: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Divergência não encontrada, já resolvida, ou sem permissão para resolver.");
  }
}

// ---------------------------------------------------------------------------
// Histórico, divergências abertas e solicitações — leitura de governança
// ---------------------------------------------------------------------------

/** Todas as versões, da primeira à corrente. Somente leitura, por desenho. */
export async function loadEvidenceHistory(
  supabase: SupabaseClient,
  professionalProfileId: string,
  subcriterionCode: string,
): Promise<PracticeEvidenceRecord[]> {
  const { data, error } = await supabase
    .from("practice_evidence")
    .select(COLUNAS)
    .eq("professional_profile_id", professionalProfileId)
    .eq("subcriterion_code", subcriterionCode)
    .order("version", { ascending: true });

  if (error) throw new Error(`Histórico: ${error.message}`);
  return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
}

export type EvidenceDivergenceRecord = {
  id: string;
  professionalProfileId: string;
  subject: string;
  declaredVersion: string;
  foundVersion: string;
  severity: string;
  status: string;
  resolution: string | null;
  openedBy: string;
  createdAt: string | null;
};

export async function loadEvidenceDivergences(
  supabase: SupabaseClient,
  professionalProfileIds: readonly string[],
): Promise<EvidenceDivergenceRecord[]> {
  if (professionalProfileIds.length === 0) return [];
  const { data, error } = await supabase
    .from("verification_divergences")
    .select("id, professional_profile_id, subject, declared_version, found_version, severity, status, resolution, opened_by, created_at")
    .in("professional_profile_id", professionalProfileIds as string[]);

  if (error) throw new Error(`Divergências: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    professionalProfileId: row.professional_profile_id as string,
    subject: row.subject as string,
    declaredVersion: row.declared_version as string,
    foundVersion: row.found_version as string,
    severity: row.severity as string,
    status: row.status as string,
    resolution: (row.resolution as string | null) ?? null,
    openedBy: row.opened_by as string,
    createdAt: (row.created_at as string | null) ?? null,
  }));
}

export type UpdateRequestRecord = {
  id: string;
  professionalProfileId: string;
  subcriterionCodes: string[];
  reason: string;
  requestedBy: string;
  requestedAt: string;
  dueHint: string | null;
  status: string;
};

export async function requestPracticeUpdate(
  supabase: SupabaseClient,
  params: {
    professionalProfileId: string;
    subcriterionCodes: string[];
    reason: string;
    requestedBy: string;
    dueHint?: string | null;
  },
): Promise<UpdateRequestRecord> {
  const { data, error } = await supabase
    .from("practice_update_requests")
    .insert({
      professional_profile_id: params.professionalProfileId,
      subcriterion_codes: params.subcriterionCodes,
      reason: params.reason,
      requested_by: params.requestedBy,
      due_hint: params.dueHint ?? null,
    })
    .select("id, professional_profile_id, subcriterion_codes, reason, requested_by, requested_at, due_hint, status")
    .single();

  if (error) throw new Error(`Solicitação de atualização: ${error.message}`);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    professionalProfileId: row.professional_profile_id as string,
    subcriterionCodes: (row.subcriterion_codes as string[]) ?? [],
    reason: row.reason as string,
    requestedBy: row.requested_by as string,
    requestedAt: row.requested_at as string,
    dueHint: (row.due_hint as string | null) ?? null,
    status: row.status as string,
  };
}

export async function listOpenUpdateRequests(
  supabase: SupabaseClient,
  professionalProfileIds: readonly string[],
): Promise<UpdateRequestRecord[]> {
  if (professionalProfileIds.length === 0) return [];
  const { data, error } = await supabase
    .from("practice_update_requests")
    .select("id, professional_profile_id, subcriterion_codes, reason, requested_by, requested_at, due_hint, status")
    .in("professional_profile_id", professionalProfileIds as string[])
    .eq("status", "aberta")
    .order("requested_at", { ascending: true });

  if (error) throw new Error(`Solicitações: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    professionalProfileId: row.professional_profile_id as string,
    subcriterionCodes: (row.subcriterion_codes as string[]) ?? [],
    reason: row.reason as string,
    requestedBy: row.requested_by as string,
    requestedAt: row.requested_at as string,
    dueHint: (row.due_hint as string | null) ?? null,
    status: row.status as string,
  }));
}

// ---------------------------------------------------------------------------
// A leitura do PRÓPRIO profissional — transparência com recorte
// ---------------------------------------------------------------------------

/**
 * O que o profissional vê de uma divergência sobre si.
 *
 * A policy `divergences_professional_select_own` entrega a linha inteira; a
 * PROJEÇÃO aqui é mais estreita de propósito. Ficam de fora: `resolution`
 * (o parecer da operação), `opened_by` e `resolved_by` (identidade de quem
 * analisou) e as fontes consultadas. Ele precisa saber o que esclarecer —
 * não quem falou o quê internamente. Governança é da operação.
 */
export type OwnDivergenceView = {
  subcriterionCode: string;
  /** O que a operação encontrou e precisa ser esclarecido. */
  foundVersion: string;
  /** O que ele havia declarado, para reconhecer do que se trata. */
  declaredVersion: string;
  status: string;
  severity: string;
  openedAt: string | null;
};

export async function loadOwnEvidenceDivergences(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<OwnDivergenceView[]> {
  const { data, error } = await supabase
    .from("verification_divergences")
    .select("subject, declared_version, found_version, status, severity, created_at")
    .eq("professional_profile_id", professionalProfileId)
    .eq("status", "aberta")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Divergências: ${error.message}`);
  return (data ?? []).map((row) => ({
    subcriterionCode: row.subject as string,
    foundVersion: row.found_version as string,
    declaredVersion: row.declared_version as string,
    status: row.status as string,
    severity: row.severity as string,
    openedAt: (row.created_at as string | null) ?? null,
  }));
}

/**
 * O histórico completo das próprias respostas, cronológico e determinístico.
 *
 * Projeção sem `verified_by` (identidade de quem verificou) e sem
 * `verification_source` (a fonte que a operação consultou — informação
 * protegida da apuração). Ele vê QUE foi verificado e QUANDO; por quem e
 * contra o quê é governança.
 */
export type OwnEvidenceVersion = {
  subcriterionCode: string;
  version: number;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  status: string;
  collectedAt: string;
  verifiedAt: string | null;
};

export async function loadOwnPracticeEvidence(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<OwnEvidenceVersion[]> {
  const { data, error } = await supabase
    .from("practice_evidence")
    .select("subcriterion_code, version, options, details, condition_note, status, collected_at, verified_at")
    .eq("professional_profile_id", professionalProfileId)
    .order("subcriterion_code")
    .order("version", { ascending: true });

  if (error) throw new Error(`Minhas evidências: ${error.message}`);
  return (data ?? []).map((row) => ({
    subcriterionCode: row.subcriterion_code as string,
    version: row.version as number,
    options: (row.options as string[]) ?? [],
    details: (row.details as Record<string, unknown>) ?? {},
    conditionNote: (row.condition_note as string | null) ?? null,
    status: row.status as string,
    collectedAt: row.collected_at as string,
    verifiedAt: (row.verified_at as string | null) ?? null,
  }));
}

export async function resolveUpdateRequest(
  supabase: SupabaseClient,
  params: { requestId: string; status: "atendida" | "cancelada"; resolvedBy: string },
): Promise<void> {
  const { data, error } = await supabase
    .from("practice_update_requests")
    .update({ status: params.status, resolved_by: params.resolvedBy, resolved_at: new Date().toISOString() })
    .eq("id", params.requestId)
    .eq("status", "aberta")
    .select("id");

  if (error) throw new Error(`Solicitação: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Solicitação não encontrada, já fechada, ou sem permissão.");
  }
}

/** A leitura corrente: a versão mais alta de cada (profissional, conceito). */
export async function loadCurrentPracticeEvidence(
  supabase: SupabaseClient,
  professionalProfileIds: readonly string[],
): Promise<Map<string, PracticeEvidenceRecord[]>> {
  const porProfissional = new Map<string, PracticeEvidenceRecord[]>();
  if (professionalProfileIds.length === 0) return porProfissional;

  const { data, error } = await supabase
    .from("practice_evidence")
    .select(COLUNAS)
    .in("professional_profile_id", professionalProfileIds as string[])
    .order("version", { ascending: false });

  if (error) throw new Error(`Base de Evidências: ${error.message}`);

  const vistos = new Set<string>();
  for (const raw of data ?? []) {
    const row = fromRow(raw as Record<string, unknown>);
    const chave = `${row.professionalProfileId}:${row.subcriterionCode}`;
    if (vistos.has(chave)) continue; // versão mais alta já capturada
    vistos.add(chave);
    const lista = porProfissional.get(row.professionalProfileId) ?? [];
    lista.push(row);
    porProfissional.set(row.professionalProfileId, lista);
  }
  return porProfissional;
}

// O resumo por profissional é derivado onde é exibido (o painel da Mesa),
// a partir da leitura corrente e de `classifyEvidenceValidity`. Não existe
// sumarizador aqui: um resumo neste módulo só teria consumidor de teste, e
// código que só os testes usam é código morto com álibi.
