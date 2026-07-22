import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

export interface ApiSuccessEnvelope<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export class JornadaApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "JornadaApiError";
  }
}

export async function fetchMeJornadaView(): Promise<JornadaDoPacienteView> {
  const response = await fetch("/api/v1/me/jornada", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = "Não foi possível carregar sua jornada.";

    try {
      const body = (await response.json()) as ApiErrorBody;
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // mantém mensagem padrão
    }

    throw new JornadaApiError(response.status, code, message);
  }

  const body = (await response.json()) as ApiSuccessEnvelope<JornadaDoPacienteView>;
  return body.data;
}

export async function fetchJornadaView(jornadaId: string): Promise<JornadaDoPacienteView> {
  const response = await fetch(`/api/v1/jornadas/${encodeURIComponent(jornadaId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = "Não foi possível carregar sua jornada.";

    try {
      const body = (await response.json()) as ApiErrorBody;
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // mantém mensagem padrão
    }

    throw new JornadaApiError(response.status, code, message);
  }

  const body = (await response.json()) as ApiSuccessEnvelope<JornadaDoPacienteView>;
  return body.data;
}

export async function postApiCommand(
  endpoint: string,
  payload?: unknown,
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    let message = "Não foi possível concluir a ação.";
    try {
      const body = (await response.json()) as ApiErrorBody;
      message = body.error?.message ?? message;
    } catch {
      // mantém mensagem padrão
    }
    throw new JornadaApiError(response.status, "API_COMMAND_FAILED", message);
  }
}
