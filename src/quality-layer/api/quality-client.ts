import type {
  IncidentCategory,
  IncidentSeverity,
  QualityIndicatorsView,
  QualityPanelView,
} from "@/quality-flow/contracts/operational-quality";

async function parseError(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return new Error(body.error?.message ?? "Operação de qualidade falhou.");
  } catch {
    return new Error("Operação de qualidade falhou.");
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function fetchQualityPanel(): Promise<QualityPanelView> {
  return getJson("/api/v1/admin/qualidade");
}

export async function fetchQualityIndicators(): Promise<QualityIndicatorsView> {
  return getJson("/api/v1/admin/qualidade?view=indicadores");
}

export async function createIncident(input: {
  jornada_id: string;
  categoria: IncidentCategory;
  severidade: IncidentSeverity;
  descricao: string;
  responsavel_id?: string | null;
}): Promise<void> {
  const response = await fetch("/api/v1/admin/qualidade/incidentes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
}

export async function updateIncident(
  id: string,
  input: { status?: "ABERTO" | "EM_ANDAMENTO" | "RESOLVIDO"; nota?: string },
): Promise<void> {
  const response = await fetch(`/api/v1/admin/qualidade/incidentes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
}

export async function registrarFeedbackPaciente(input: {
  jornada_id: string;
  satisfacao_geral: number;
  clareza_informacoes: number;
  facilidade_uso: number;
  comentarios?: string;
}): Promise<void> {
  const response = await fetch("/api/v1/me/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
}

export async function registrarFeedbackCurador(input: {
  jornada_id: string;
  dificuldades?: string;
  informacoes_ausentes?: string;
  sugestoes?: string;
  problemas_operacionais?: string;
}): Promise<void> {
  const response = await fetch("/api/v1/curador/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
}
