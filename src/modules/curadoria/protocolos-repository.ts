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

  const { data, error } = await supabase
    .from("case_needs")
    .upsert(
      {
        case_id: params.caseId,
        subcriterion_code: params.subcriterionCode,
        options: params.options,
        degree: params.degree,
        flexibility: params.flexibility,
        guided_text: params.guidedText,
        origin: params.origin,
        proposed_reading: params.proposedReading,
        acknowledgment,
        correction: null,
        declared_by: params.declaredBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "case_id,subcriterion_code" },
    )
    .select(NEED_COLUMNS)
    .single();

  if (error) throw new Error(`Necessidade da pessoa: ${error.message}`);
  return needFromRow(data as Record<string, unknown>);
}

/**
 * O ato da pessoa sobre uma leitura traduzida: reconhecer, corrigir ou
 * discordar. Registrado pelo Curador na conversa — mas o conteúdo é dela, e
 * fica separado da leitura proposta.
 *
 * **Contrato do campo `correction` (DT-22):**
 *
 * | Desfecho | `correction` |
 * |---|---|
 * | `CORRIGIDA` | o texto **substitutivo** dela — "não é isso, é isto" |
 * | `RECUSADA` | a **justificativa da discordância** — "eu disse isso, mas não é isso que significa" |
 * | `RECONHECIDA` | `null` — não há o que acrescentar |
 * | `PENDENTE` | `null` — é a ausência de ato, e não passa por aqui |
 *
 * Antes do DT-22 a recusa era gravada sem texto, e a discordância dela se
 * perdia: sobrava um estado sem o motivo. Oferecer "discordar" e não guardar o
 * que ela disse é cerimônia vazia — os dois desfechos que afirmam algo sobre a
 * tradução exigem texto, e a validação abaixo recusa os dois sem ele.
 */
export async function acknowledgePersonNeed(
  supabase: SupabaseClient,
  params: {
    caseId: string;
    subcriterionCode: string;
    acknowledgment: Exclude<AcknowledgmentState, "PENDENTE">;
    correction?: string | null;
  },
): Promise<void> {
  const exigeTexto = params.acknowledgment === "CORRIGIDA" || params.acknowledgment === "RECUSADA";
  const texto = (params.correction ?? "").trim();

  if (exigeTexto && texto === "") {
    throw new Error(
      params.acknowledgment === "CORRIGIDA"
        ? "Correção sem texto não é correção — o que ela disse precisa ficar registrado."
        : "Discordância sem texto não é discordância — o que ela disse precisa ficar registrado.",
    );
  }

  const { data, error } = await supabase
    .from("case_needs")
    .update({
      acknowledgment: params.acknowledgment,
      // DT-22: os dois desfechos que afirmam algo sobre a tradução guardam o
      // texto dela; o reconhecimento não tem o que guardar.
      correction: exigeTexto ? texto : null,
    })
    .eq("case_id", params.caseId)
    .eq("subcriterion_code", params.subcriterionCode)
    .eq("origin", "TRADUCAO")
    .select("case_id");

  if (error) throw new Error(`Reconhecimento: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Não há leitura traduzida deste conceito para reconhecer neste Case.");
  }
}

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
