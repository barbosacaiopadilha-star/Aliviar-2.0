import type {
  JourneyNotificationType,
  JourneyNotificationView,
  NotificationPreferencesView,
} from "@/notification-flow/contracts/journey-notification";

class NotificacaoApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "NotificacaoApiError";
  }
}

async function parseError(response: Response): Promise<NotificacaoApiError> {
  let code = "UNKNOWN_ERROR";
  let message = "Não foi possível concluir a operação.";
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    code = body.error?.code ?? code;
    message = body.error?.message ?? message;
  } catch {
    // mantém padrão
  }
  return new NotificacaoApiError(response.status, code, message);
}

async function parseData<T>(response: Response): Promise<T> {
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function listarNotificacoes(params?: {
  tipo?: JourneyNotificationType;
  lida?: boolean;
  q?: string;
}): Promise<JourneyNotificationView[]> {
  const search = new URLSearchParams();
  if (params?.tipo) search.set("tipo", params.tipo);
  if (params?.lida !== undefined) search.set("lida", String(params.lida));
  if (params?.q) search.set("q", params.q);

  const query = search.toString();
  const response = await fetch(`/api/v1/notificacoes${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  return parseData(response);
}

export async function marcarNotificacaoLida(id: string): Promise<JourneyNotificationView> {
  const response = await fetch(`/api/v1/notificacoes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ lida: true }),
  });
  return parseData(response);
}

export async function obterPreferenciasNotificacao(): Promise<NotificationPreferencesView> {
  const response = await fetch("/api/v1/notificacoes/preferencias", { cache: "no-store" });
  return parseData(response);
}

export async function salvarPreferenciasNotificacao(
  input: Omit<NotificationPreferencesView, "atualizado_em">,
): Promise<NotificationPreferencesView> {
  const response = await fetch("/api/v1/notificacoes/preferencias", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseData(response);
}
