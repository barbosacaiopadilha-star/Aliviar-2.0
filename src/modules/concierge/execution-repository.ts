import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProtocolId } from "@/modules/ace/core/protocol-id";

import type { CaseStatus } from "@/modules/cases/types";

import { getAceLanguageModelHealth } from "./language-model";
import type {
  AceArtifact,
  AceArtifactType,
  AceArtifactValidationStatus,
  AceExecution,
  AceExecutionEvent,
  AceExecutionEventType,
  AceExecutionMetrics,
  AceExecutionOverview,
  AceExecutionStatus,
  AceHealthCheck,
} from "./types";

const EXECUTION_COLUMNS =
  "id, case_id, started_by, started_at, finished_at, status, current_protocol, method_version, failure_code, failure_message, retry_of";

type ExecutionRow = {
  id: string;
  case_id: string;
  started_by: string;
  started_at: string;
  finished_at: string | null;
  status: AceExecutionStatus;
  current_protocol: ProtocolId | null;
  method_version: string;
  failure_code: string | null;
  failure_message: string | null;
  retry_of: string | null;
};

async function nameByProfileId(supabase: SupabaseClient, profileId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", profileId).maybeSingle();
  return (data?.display_name as string | null) ?? "Sem nome";
}

async function mapExecution(supabase: SupabaseClient, row: ExecutionRow): Promise<AceExecution> {
  return {
    id: row.id,
    caseId: row.case_id,
    startedBy: row.started_by,
    startedByName: await nameByProfileId(supabase, row.started_by),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    currentProtocol: row.current_protocol,
    methodVersion: row.method_version,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    retryOf: row.retry_of,
  };
}

export async function getLatestExecution(supabase: SupabaseClient, caseId: string): Promise<AceExecution | null> {
  const { data, error } = await supabase
    .from("ace_executions")
    .select(EXECUTION_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapExecution(supabase, data as ExecutionRow);
}

export async function getExecution(supabase: SupabaseClient, executionId: string): Promise<AceExecution | null> {
  const { data, error } = await supabase
    .from("ace_executions")
    .select(EXECUTION_COLUMNS)
    .eq("id", executionId)
    .maybeSingle();

  if (error || !data) return null;
  return mapExecution(supabase, data as ExecutionRow);
}

export async function createExecution(
  supabase: SupabaseClient,
  caseId: string,
  startedBy: string,
  methodVersion: string,
  retryOf: string | null,
): Promise<AceExecution> {
  const { data, error } = await supabase
    .from("ace_executions")
    .insert({
      case_id: caseId,
      started_by: startedBy,
      method_version: methodVersion,
      status: "RUNNING",
      retry_of: retryOf,
    })
    .select(EXECUTION_COLUMNS)
    .single();

  if (error || !data) {
    // A causa mais provável é o índice único de concorrência
    // (ace_executions_one_running_per_case_idx) — já existe uma execução
    // RUNNING para este caso.
    throw new Error("Já existe uma execução do ACE em andamento para este caso.");
  }

  return mapExecution(supabase, data as ExecutionRow);
}

export type UpdateExecutionPatch = {
  status?: AceExecutionStatus;
  currentProtocol?: ProtocolId | null;
  finishedAt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export async function updateExecution(
  supabase: SupabaseClient,
  executionId: string,
  patch: UpdateExecutionPatch,
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.currentProtocol !== undefined) update.current_protocol = patch.currentProtocol;
  if (patch.finishedAt !== undefined) update.finished_at = patch.finishedAt;
  if (patch.failureCode !== undefined) update.failure_code = patch.failureCode;
  if (patch.failureMessage !== undefined) update.failure_message = patch.failureMessage;

  const { error } = await supabase.from("ace_executions").update(update).eq("id", executionId);

  if (error) {
    throw new Error("Não foi possível atualizar a execução.");
  }
}

type ArtifactRow = {
  id: string;
  case_id: string;
  execution_id: string;
  artifact_type: AceArtifactType;
  version: number;
  protocol_id: ProtocolId;
  protocol_version: string;
  method_version: string;
  payload: unknown;
  created_by: string;
  created_at: string;
  supersedes: string | null;
  validation_status: AceArtifactValidationStatus;
};

function mapArtifact(row: ArtifactRow): AceArtifact {
  return {
    id: row.id,
    caseId: row.case_id,
    executionId: row.execution_id,
    artifactType: row.artifact_type,
    version: row.version,
    protocolId: row.protocol_id,
    protocolVersion: row.protocol_version,
    methodVersion: row.method_version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    supersedes: row.supersedes,
    validationStatus: row.validation_status,
    payload: row.payload,
  };
}

const ARTIFACT_COLUMNS =
  "id, case_id, execution_id, artifact_type, version, protocol_id, protocol_version, method_version, payload, created_by, created_at, supersedes, validation_status";

// A última linha persistida de um tipo, para um Caso, é sempre a versão
// válida atual — artefatos são imutáveis e nunca sobrescritos; retomar uma
// execução reaproveita esta linha em vez de recomputar (idempotência).
export async function getLatestArtifactByType(
  supabase: SupabaseClient,
  caseId: string,
  artifactType: AceArtifactType,
): Promise<AceArtifact | null> {
  const { data, error } = await supabase
    .from("ace_artifacts")
    .select(ARTIFACT_COLUMNS)
    .eq("case_id", caseId)
    .eq("artifact_type", artifactType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapArtifact(data as ArtifactRow);
}

export type PersistArtifactInput = {
  id: string;
  caseId: string;
  executionId: string;
  artifactType: AceArtifactType;
  version: number;
  protocolId: ProtocolId;
  protocolVersion: string;
  methodVersion: string;
  payload: unknown;
  createdBy: string;
  supersedes?: string | null;
  validationStatus: AceArtifactValidationStatus;
};

export async function persistArtifact(supabase: SupabaseClient, input: PersistArtifactInput): Promise<AceArtifact> {
  const { data, error } = await supabase
    .from("ace_artifacts")
    .insert({
      id: input.id,
      case_id: input.caseId,
      execution_id: input.executionId,
      artifact_type: input.artifactType,
      version: input.version,
      protocol_id: input.protocolId,
      protocol_version: input.protocolVersion,
      method_version: input.methodVersion,
      payload: input.payload,
      created_by: input.createdBy,
      supersedes: input.supersedes ?? null,
      validation_status: input.validationStatus,
    })
    .select(ARTIFACT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível persistir o artefato do ACE.");
  }

  return mapArtifact(data as ArtifactRow);
}

// Busca um artefato pelo seu próprio id (não "o mais recente do tipo") —
// necessário quando quem chama precisa exatamente da versão referenciada
// por outro artefato (ex.: P010 seguindo a cadeia de rastreabilidade a
// partir do HumanReviewResult), não a mais recente do caso.
export async function getArtifactById(supabase: SupabaseClient, artifactId: string): Promise<AceArtifact | null> {
  const { data, error } = await supabase.from("ace_artifacts").select(ARTIFACT_COLUMNS).eq("id", artifactId).maybeSingle();

  if (error || !data) return null;
  return mapArtifact(data as ArtifactRow);
}

export async function listArtifactsForCase(supabase: SupabaseClient, caseId: string): Promise<AceArtifact[]> {
  const { data, error } = await supabase
    .from("ace_artifacts")
    .select(ARTIFACT_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os artefatos do caso.");
  }

  return (data as ArtifactRow[]).map(mapArtifact);
}

// ---------------------------------------------------------------------
// Sprint de Observabilidade do ACE — log estruturado, histórico entre
// tentativas, dashboard operacional (cross-caso), métricas e health check.
// Tudo aqui é somente leitura (além de logExecutionEvent, que só insere) —
// esta sprint não introduz nenhuma nova decisão do Método, só visibilidade
// sobre o que já acontece.
// ---------------------------------------------------------------------

type EventRow = {
  id: string;
  execution_id: string;
  case_id: string;
  event_type: AceExecutionEventType;
  protocol_id: ProtocolId | null;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function mapEvent(row: EventRow): AceExecutionEvent {
  return {
    id: row.id,
    executionId: row.execution_id,
    caseId: row.case_id,
    eventType: row.event_type,
    protocolId: row.protocol_id,
    message: row.message,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

const EVENT_COLUMNS = "id, execution_id, case_id, event_type, protocol_id, message, metadata, created_at";

export type LogExecutionEventInput = {
  executionId: string;
  caseId: string;
  eventType: AceExecutionEventType;
  protocolId?: ProtocolId | null;
  message: string;
  metadata?: Record<string, unknown>;
};

// Append-only por desenho: sem policy de UPDATE/DELETE em
// ace_execution_events. Nunca lança para não interromper o pipeline por uma
// falha de log — falhar em registrar um evento não deveria derrubar a
// execução do ACE em si.
export async function logExecutionEvent(supabase: SupabaseClient, input: LogExecutionEventInput): Promise<void> {
  await supabase.from("ace_execution_events").insert({
    execution_id: input.executionId,
    case_id: input.caseId,
    event_type: input.eventType,
    protocol_id: input.protocolId ?? null,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function listExecutionEvents(supabase: SupabaseClient, executionId: string): Promise<AceExecutionEvent[]> {
  const { data, error } = await supabase
    .from("ace_execution_events")
    .select(EVENT_COLUMNS)
    .eq("execution_id", executionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o log da execução.");
  }

  return (data as EventRow[]).map(mapEvent);
}

// Todos os eventos de todas as tentativas de um Caso, já agrupáveis por
// execution_id no cliente — evita 1 consulta por execução na tela de
// histórico do Caso.
export async function listExecutionEventsForCase(supabase: SupabaseClient, caseId: string): Promise<AceExecutionEvent[]> {
  const { data, error } = await supabase
    .from("ace_execution_events")
    .select(EVENT_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o log do caso.");
  }

  return (data as EventRow[]).map(mapEvent);
}

// Todas as tentativas de execução de um Caso (não só a última) — a tela de
// histórico do Caso mostra cada uma, mais recente primeiro.
export async function listExecutionsForCase(supabase: SupabaseClient, caseId: string): Promise<AceExecution[]> {
  const { data, error } = await supabase
    .from("ace_executions")
    .select(EXECUTION_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar o histórico de execuções do caso.");
  }

  return Promise.all((data as ExecutionRow[]).map((row) => mapExecution(supabase, row)));
}

type CaseContextRow = { id: string; patient_profile_id: string; status: CaseStatus };

// Base do dashboard operacional (admin-only na UI, mas a RLS já limitaria
// um curador médico às execuções dos seus próprios casos caso esta função
// fosse chamada por ele — defesa em profundidade, não o único controle).
export async function listAllExecutionsOverview(supabase: SupabaseClient): Promise<AceExecutionOverview[]> {
  const { data, error } = await supabase
    .from("ace_executions")
    .select(EXECUTION_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar as execuções do ACE.");
  }

  const rows = data as ExecutionRow[];
  if (rows.length === 0) return [];

  const caseIds = Array.from(new Set(rows.map((row) => row.case_id)));
  const { data: casesData } = await supabase
    .from("cases")
    .select("id, patient_profile_id, status")
    .in("id", caseIds);

  const caseContextById = new Map(
    ((casesData ?? []) as CaseContextRow[]).map((row) => [row.id, row]),
  );

  const patientProfileIds = Array.from(
    new Set(Array.from(caseContextById.values()).map((row) => row.patient_profile_id)),
  );
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", patientProfileIds.length > 0 ? patientProfileIds : ["00000000-0000-0000-0000-000000000000"]);

  const patientNameById = new Map(
    ((profilesData ?? []) as { id: string; display_name: string | null }[]).map((row) => [
      row.id,
      row.display_name ?? "Sem nome",
    ]),
  );

  const executions = await Promise.all(rows.map((row) => mapExecution(supabase, row)));

  return executions.map((execution) => {
    const context = caseContextById.get(execution.caseId);
    return {
      ...execution,
      patientName: context ? (patientNameById.get(context.patient_profile_id) ?? "Sem nome") : "Sem nome",
      caseStatus: context?.status ?? "NEW",
    };
  });
}

const STUCK_RUNNING_THRESHOLD_MINUTES = 30;

// Calculada em memória a partir de listAllExecutionsOverview — volume
// esperado (execuções de curadoria, não eventos de alta frequência) não
// justifica uma view agregada no banco.
export async function getExecutionMetrics(supabase: SupabaseClient): Promise<AceExecutionMetrics> {
  const executions = await listAllExecutionsOverview(supabase);

  const byStatus: Record<AceExecutionStatus, number> = {
    PENDING: 0,
    RUNNING: 0,
    BLOCKED: 0,
    FAILED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  const blockedReasonCounts: Record<string, number> = {};
  const failureCodeCounts: Record<string, number> = {};
  const completionDurationsMinutes: number[] = [];

  for (const execution of executions) {
    byStatus[execution.status] += 1;

    if (execution.status === "BLOCKED" && execution.failureCode) {
      blockedReasonCounts[execution.failureCode] = (blockedReasonCounts[execution.failureCode] ?? 0) + 1;
    }
    if (execution.status === "FAILED" && execution.failureCode) {
      failureCodeCounts[execution.failureCode] = (failureCodeCounts[execution.failureCode] ?? 0) + 1;
    }
    if (execution.status === "COMPLETED" && execution.finishedAt) {
      const minutes = (new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 60_000;
      completionDurationsMinutes.push(minutes);
    }
  }

  const averageCompletionMinutes =
    completionDurationsMinutes.length > 0
      ? completionDurationsMinutes.reduce((sum, value) => sum + value, 0) / completionDurationsMinutes.length
      : null;

  return {
    totalExecutions: executions.length,
    byStatus,
    averageCompletionMinutes,
    blockedReasonCounts,
    failureCodeCounts,
  };
}

type CompetencyReadinessRow = { id: string; experience_level: string | null; intake_approach: string | null };

// Nunca infere prontidão — um profissional só conta como elegível quando os
// campos que P006/P007 exigem já foram preenchidos administrativamente
// (mesma regra de "nunca inventar" da adaptação dos ports do ACE).
export async function getAceHealthCheck(supabase: SupabaseClient): Promise<AceHealthCheck> {
  const [{ data: professionalsData }, { data: competencyAreaRows }, executions] = await Promise.all([
    supabase.from("professional_profiles").select("id, experience_level, intake_approach"),
    supabase.from("professional_competency_areas").select("professional_profile_id"),
    listAllExecutionsOverview(supabase),
  ]);

  const professionalIdsWithCompetencyArea = new Set(
    ((competencyAreaRows ?? []) as { professional_profile_id: string }[]).map((row) => row.professional_profile_id),
  );

  const professionals = (professionalsData ?? []) as CompetencyReadinessRow[];
  const eligibleProfessionalsCount = professionals.filter(
    (professional) =>
      professional.experience_level !== null &&
      professional.intake_approach !== null &&
      professionalIdsWithCompetencyArea.has(professional.id),
  ).length;

  const thresholdMs = STUCK_RUNNING_THRESHOLD_MINUTES * 60_000;
  const now = Date.now();
  const stuckRunningExecutions = executions.filter(
    (execution) => execution.status === "RUNNING" && now - new Date(execution.startedAt).getTime() > thresholdMs,
  );

  const languageModelHealth = getAceLanguageModelHealth();

  return {
    languageModelStatus: languageModelHealth.status,
    languageModelHealthy: languageModelHealth.healthy,
    eligibleProfessionalsCount,
    professionalsMissingCompetencyDataCount: professionals.length - eligibleProfessionalsCount,
    stuckRunningExecutions,
  };
}
