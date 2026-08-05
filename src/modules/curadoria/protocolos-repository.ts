import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { registerPracticeEvidence, type PracticeEvidenceRecord } from "./evidencias-pratica-repository";
import { validatePracticeEvidence } from "./evidencias-pratica";
import {
  PROFESSIONAL_PROTOCOL,
  validatePersonNeed,
  type AcknowledgmentState,
  type NeedDegree,
  type PersonMode,
  type PersonNeedInput,
} from "./protocolos";
import type { SourceTier } from "./fontes";

/**
 * PROTOCOLOS OFICIAIS — o lado do banco.
 *
 * Dois fluxos, duas naturezas:
 *
 *   PROFISSIONAL — rascunho reescrevível (`practice_protocol_drafts`) até a
 *   submissão; a submissão valida cada resposta contra o Catálogo e grava
 *   versões em `practice_evidence`, SEMPRE `nao_verificado`. A submissão
 *   passa pelo service role porque a Base é append-only com escrita da
 *   operação — mas o autor registrado é o profissional, e a fonte diz
 *   "autodeclaração": a proveniência conta a verdade.
 *
 *   PESSOA — cada resposta vive no Case (`case_needs`), com origem, leitura
 *   proposta e reconhecimento separados. Nada disso alcança o Motor.
 */

// ---------------------------------------------------------------------------
// Rascunho do profissional — salvar parcial, retomar
// ---------------------------------------------------------------------------

export type DraftResponse = {
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  observation: string | null;
};

export type ProtocolDraft = {
  responses: Record<string, DraftResponse>;
  updatedAt: string | null;
};

export async function loadProtocolDraft(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<ProtocolDraft> {
  const { data, error } = await supabase
    .from("practice_protocol_drafts")
    .select("responses, updated_at")
    .eq("professional_profile_id", professionalProfileId)
    .maybeSingle();

  if (error) throw new Error(`Rascunho do protocolo: ${error.message}`);
  return {
    responses: (data?.responses as Record<string, DraftResponse>) ?? {},
    updatedAt: (data?.updated_at as string | null) ?? null,
  };
}

export async function saveProtocolDraft(
  supabase: SupabaseClient,
  params: {
    professionalProfileId: string;
    responses: Record<string, DraftResponse>;
    updatedBy: string;
  },
): Promise<void> {
  const { error } = await supabase.from("practice_protocol_drafts").upsert(
    {
      professional_profile_id: params.professionalProfileId,
      responses: params.responses,
      updated_by: params.updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "professional_profile_id" },
  );
  if (error) throw new Error(`Rascunho do protocolo: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Submissão — rascunho vira evidência declarada, nunca verificada
// ---------------------------------------------------------------------------

export const TEAM_REGISTRATION_SOURCE =
  "Registrado pela equipe Aliviar no cadastro administrativo";
export const SELF_DECLARATION_SOURCE = "Autodeclaração pelo Protocolo da Prática Profissional";
export const SELF_DECLARATION_TIER: SourceTier = "INSTITUCIONAL";

export type ProtocolSubmission = {
  registered: PracticeEvidenceRecord[];
  rejected: { subcriterionCode: string; errors: string[] }[];
};

/**
 * Valida TODAS as respostas antes de gravar QUALQUER uma — submissão não é
 * meio-termo. `evidenceClient` é o cliente com privilégio de escrita na Base
 * (service role, pela porta controlada da action que autenticou o dono);
 * `collectedBy` é o profissional, e a fonte diz autodeclaração.
 */
export async function submitProfessionalProtocol(
  evidenceClient: SupabaseClient,
  params: {
    professionalProfileId: string;
    responses: Record<string, DraftResponse>;
    collectedBy: string;
    collectedAt?: string;
    // Proveniência da coleta: por padrão, autodeclaração do próprio
    // profissional; o cadastro administrativo declara a própria origem.
    sourceTier?: SourceTier;
    source?: string;
  },
): Promise<ProtocolSubmission> {
  const codigos = Object.keys(params.responses);
  if (codigos.length === 0) {
    throw new Error("Nada a submeter — o rascunho está vazio.");
  }

  const rejected: ProtocolSubmission["rejected"] = [];
  for (const codigo of codigos) {
    const resposta = params.responses[codigo]!;
    const erros = validatePracticeEvidence({
      subcriterionCode: codigo,
      options: resposta.options,
      details: resposta.details,
      conditionNote: resposta.conditionNote,
      observation: resposta.observation,
      sourceTier: params.sourceTier ?? SELF_DECLARATION_TIER,
      source: params.source ?? SELF_DECLARATION_SOURCE,
    });
    if (erros.length > 0) rejected.push({ subcriterionCode: codigo, errors: erros });
  }
  if (rejected.length > 0) return { registered: [], rejected };

  const registered: PracticeEvidenceRecord[] = [];
  for (const codigo of codigos) {
    const resposta = params.responses[codigo]!;
    registered.push(
      await registerPracticeEvidence(evidenceClient, {
        professionalProfileId: params.professionalProfileId,
        subcriterionCode: codigo,
        options: resposta.options,
        details: resposta.details,
        conditionNote: resposta.conditionNote,
        observation: resposta.observation,
        sourceTier: params.sourceTier ?? SELF_DECLARATION_TIER,
        source: params.source ?? SELF_DECLARATION_SOURCE,
        collectedBy: params.collectedBy,
        collectedAt: params.collectedAt,
      }),
    );
  }

  return { registered, rejected: [] };
}

/** Quais das 28 já têm evidência corrente — para a revisão e o progresso. */
export function answeredConceptCodes(responses: Record<string, DraftResponse>): string[] {
  const validos = new Set(PROFESSIONAL_PROTOCOL.map((q) => q.concept.code));
  return Object.keys(responses).filter((codigo) => validos.has(codigo));
}

// ---------------------------------------------------------------------------
// A necessidade da pessoa — por Case
// ---------------------------------------------------------------------------

export type CaseNeedRecord = {
  caseId: string;
  subcriterionCode: string;
  options: string[];
  degree: NeedDegree;
  flexibility: string | null;
  guidedText: string | null;
  origin: PersonMode;
  proposedReading: string | null;
  acknowledgment: AcknowledgmentState;
  correction: string | null;
  declaredBy: string;
  declaredAt: string;
};

function needFromRow(row: Record<string, unknown>): CaseNeedRecord {
  return {
    caseId: row.case_id as string,
    subcriterionCode: row.subcriterion_code as string,
    options: (row.options as string[]) ?? [],
    degree: row.degree as NeedDegree,
    flexibility: (row.flexibility as string | null) ?? null,
    guidedText: (row.guided_text as string | null) ?? null,
    origin: row.origin as PersonMode,
    proposedReading: (row.proposed_reading as string | null) ?? null,
    acknowledgment: row.acknowledgment as AcknowledgmentState,
    correction: (row.correction as string | null) ?? null,
    declaredBy: row.declared_by as string,
    declaredAt: row.declared_at as string,
  };
}

const NEED_COLUMNS =
  "case_id, subcriterion_code, options, degree, flexibility, guided_text, origin, proposed_reading, acknowledgment, correction, declared_by, declared_at";

/**
 * Registra (ou atualiza) a necessidade. Resposta DIRETA nasce reconhecida —
 * a fala é dela; TRADUÇÃO nasce PENDENTE até o ato dela; DECLARAÇÃO CLÍNICA
 * nasce reconhecida como projeção do Curador, dita como tal.
 */
export async function registerPersonNeed(
  supabase: SupabaseClient,
  params: PersonNeedInput & { caseId: string; declaredBy: string },
): Promise<CaseNeedRecord> {
  const recusas = validatePersonNeed(params);
  if (recusas.length > 0) throw new Error(recusas.join(" "));

  const acknowledgment: AcknowledgmentState = params.origin === "TRADUCAO" ? "PENDENTE" : "RECONHECIDA";

  /**
   * PP-03C — O CURADOR NÃO ALCANÇA O DESFECHO DELA, NEM POR ACIDENTE.
   *
   * Este `upsert` gravava `acknowledgment` e `correction` em toda gravação. No
   * caminho de ATUALIZAÇÃO isso era um segundo escritor silencioso: bastava o
   * Curador reabrir "Atualizar registro" e salvar para o desfecho dela voltar a
   * `PENDENTE` e o texto dela virar `null` — sem aviso, sem trilha, e sem que
   * ninguém tivesse clicado em nada parecido com "desfazer o que ela disse".
   *
   * Agora os dois campos só são escritos no NASCIMENTO da linha, onde ainda não
   * há ato dela para apagar. Existindo linha, a atualização toca a tradução e
   * nada mais — o que ela respondeu é dela e permanece (I-7).
   */
  const { data: existente } = await supabase
    .from("case_needs")
    .select("id")
    .eq("case_id", params.caseId)
    .eq("subcriterion_code", params.subcriterionCode)
    .maybeSingle();

  const traducao = {
    options: params.options,
    degree: params.degree,
    flexibility: params.flexibility,
    guided_text: params.guidedText,
    origin: params.origin,
    proposed_reading: params.proposedReading,
    declared_by: params.declaredBy,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = existente
    ? await supabase
        .from("case_needs")
        .update(traducao)
        .eq("id", existente.id as string)
        .select(NEED_COLUMNS)
        .single()
    : await supabase
        .from("case_needs")
        .insert({
          case_id: params.caseId,
          subcriterion_code: params.subcriterionCode,
          ...traducao,
          acknowledgment,
          correction: null,
        })
        .select(NEED_COLUMNS)
        .single();

  if (error) throw new Error(`Necessidade da pessoa: ${error.message}`);
  return needFromRow(data as Record<string, unknown>);
}

/**
 * PP-03C — AQUI VIVIA `acknowledgePersonNeed`.
 *
 * Ela gravava `acknowledgment` e `correction` — o ato que o Método reserva à
 * paciente — a partir de uma action que exigia papel de Curador. O registro
 * dizia "reconhecida por ela" e ninguém podia provar que foi ela: assinatura
 * sem o autor não é autoria (ADR-068 §1).
 *
 * O desfecho passou a ter escritor único: a RPC `acknowledge_case_need`
 * (SECURITY DEFINER, autorizada por `is_patient_for_case`), chamada por
 * `registrarDesfechoAction`. O contrato do DT-22 não mudou de conteúdo — a
 * exigência do texto dela em CORRIGIDA e RECUSADA agora vive no banco, onde
 * nenhuma superfície a contorna. Mudou de dono, não de regra.
 *
 * `registerPersonNeed`, acima, continua sendo do Curador: a TRADUÇÃO é dele,
 * o DESFECHO é dela, e os dois nunca mais se escrevem pela mesma mão.
 */

export async function loadCaseNeeds(
  supabase: SupabaseClient,
  caseId: string,
): Promise<CaseNeedRecord[]> {
  const { data, error } = await supabase
    .from("case_needs")
    .select(NEED_COLUMNS)
    .eq("case_id", caseId)
    .order("subcriterion_code");

  if (error) throw new Error(`Necessidades do Case: ${error.message}`);
  return (data ?? []).map((row) => needFromRow(row as Record<string, unknown>));
}
