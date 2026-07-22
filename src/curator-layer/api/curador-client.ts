import type {
  CasoDeCuradoriaView,
  FilaCasoItemView,
  OpcaoRegistradaView,
} from "@/curator-flow/contracts/curador-view";

export class CuradorApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CuradorApiError";
  }
}

async function parseError(response: Response): Promise<CuradorApiError> {
  let code = "UNKNOWN_ERROR";
  let message = "Não foi possível concluir a operação.";
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    code = body.error?.code ?? code;
    message = body.error?.message ?? message;
  } catch {
    // mantém padrão
  }
  return new CuradorApiError(response.status, code, message);
}

export async function fetchFilaCurador(): Promise<FilaCasoItemView[]> {
  const response = await fetch("/api/v1/curador/fila", { cache: "no-store" });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: FilaCasoItemView[] };
  return body.data;
}

export async function fetchCasoCurador(jornadaId: string): Promise<CasoDeCuradoriaView> {
  const response = await fetch(`/api/v1/curador/casos/${encodeURIComponent(jornadaId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: CasoDeCuradoriaView };
  return body.data;
}

export async function curadorPost(endpoint: string, payload?: unknown): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw await parseError(response);
}

export async function curadorPut(endpoint: string, payload: unknown): Promise<void> {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseError(response);
}

export type { OpcaoRegistradaView };
