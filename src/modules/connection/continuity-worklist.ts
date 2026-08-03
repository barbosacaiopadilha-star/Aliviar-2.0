import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import { isContactMode, type ConnectionStatus, type ContactMode } from "./types";

/**
 * Caixa de Continuidade — projeção de leitura, nunca entidade.
 *
 * Decisão NT-4 (docs/architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md):
 * o trabalho pendente da continuidade é *derivado* de fatos que já existem —
 * quem responde pelo Case (`cases.responsible_id`) e em que estado está a
 * Connection. Nenhuma tabela de tarefa é criada, porque criar uma produziria
 * um segundo dono do Case, concorrente com `cases`.
 *
 * A autorização é inteiramente da RLS: `can_access_case` decide o que cada
 * pessoa enxerga. Esta consulta não filtra por papel e não confia em nenhum
 * predicado da aplicação — se a policy não deixar ver, não vem.
 *
 * O que esta projeção deliberadamente NÃO faz:
 *  - não classifica prioridade, urgência ou "atraso": não existe regra
 *    temporal aprovada, e inventar uma seria criar SLA por conta própria;
 *  - não usa tempo de permanência, número de visitas ou qualquer sinal de
 *    comportamento da paciente — a operação é o objeto da medição, ela nunca;
 *  - não se mistura com a fila de CRM: são fontes de trabalho distintas.
 */
export type ContinuityWorkItem = {
  caseId: string;
  connectionId: string;
  status: ConnectionStatus;
  contactMode: ContactMode | null;
  professionalProfileId: string;
  decidedAt: string;
  /** Fato observável, não julgamento: ela ainda não declarou como começar. */
  awaitingContactMode: boolean;

  // --- Incremento 2: tentativas e notificações -----------------------------
  // Todos derivados de fatos. Nenhum usa tempo para inferir atraso, nenhum
  // trata ausência de resposta como desfecho, e nenhum trata leitura como
  // execução.
  /** Tentativa criada e ainda não despachada — trabalho nosso, parado. */
  attemptCreatedNotDispatched: boolean;
  /** Despachada sem resposta registrada. NÃO é "sem resposta": é ausência de fato. */
  attemptDispatchedWithoutResponse: boolean;
  /** Última resposta disse indisponível — exige conversa, nunca substituição automática. */
  unavailabilityNeedsAction: boolean;
  /** Modo intermediado sem nenhuma tentativa aberta: ninguém está procurando ninguém. */
  intermediatedWithoutOpenAttempt: boolean;
  /** Quantas notificações continuam sem ninguém ter visto. */
  unreadNotifications: number;
  /**
   * Alguém já viu, e o trabalho continua. Existe para tornar visível a regra
   * da ADR-044: ler não executa.
   */
  readButStillPending: boolean;
  totalAttempts: number;
};

const TERMINAL_STATUSES: readonly string[] = [
  "PRIMEIRO_ATENDIMENTO_REALIZADO",
  "ENCERRADO_SEM_RELACIONAMENTO",
];

export async function loadContinuityWorklist(
  supabase: SupabaseClient,
): Promise<ContinuityWorkItem[]> {
  const { data, error } = await supabase
    .from("connection_records")
    .select(
      "id, case_id, status, contact_mode, professional_profile_id, decided_at",
    )
    .not("status", "in", `(${TERMINAL_STATUSES.join(",")})`)
    .order("decided_at", { ascending: true });

  // Bloco D (gate D19): erro LANÇA; [] fica reservado para a ausência
  // legítima ("ninguém espera nada"). Antes, uma falha de consulta fazia a
  // fila aparecer vazia e o Concierge concluir que não havia trabalho.
  if (error) {
    throw erroDeBanco("Não foi possível carregar a Caixa de Continuidade.", error);
  }
  if (!data || data.length === 0) return [];

  const connectionIds = data.map((row) => row.id as string);
  const caseIds = data.map((row) => row.case_id as string);

  // Duas consultas em lote, não N+1. A RLS já recortou o que é visível — se a
  // policy não deixar ver, não vem, e a projeção não precisa filtrar de novo.
  const [attemptsResult, notificationsResult] = await Promise.all([
    connectionIds.length
      ? supabase
          .from("approach_attempts")
          .select("connection_id, status, response_kind")
          .in("connection_id", connectionIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    caseIds.length
      ? supabase
          .from("team_notifications")
          .select("case_id, read_at, archived_at")
          .in("case_id", caseIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  // Mesma regra do gate D19 para as consultas em lote: uma falha aqui
  // silenciaria tentativas e avisos — o item apareceria "sem pendência".
  if (attemptsResult.error) {
    throw erroDeBanco("Não foi possível carregar as aproximações da continuidade.", attemptsResult.error);
  }
  if (notificationsResult.error) {
    throw erroDeBanco("Não foi possível carregar os avisos da continuidade.", notificationsResult.error);
  }

  const attemptsByConnection = new Map<string, { status: string; responseKind: string | null }[]>();
  for (const row of attemptsResult.data ?? []) {
    const key = row.connection_id as string;
    const list = attemptsByConnection.get(key) ?? [];
    list.push({
      status: row.status as string,
      responseKind: (row.response_kind as string | null) ?? null,
    });
    attemptsByConnection.set(key, list);
  }

  const notificationsByCase = new Map<string, { unread: number; anyRead: boolean }>();
  for (const row of notificationsResult.data ?? []) {
    const key = row.case_id as string;
    const acc = notificationsByCase.get(key) ?? { unread: 0, anyRead: false };
    if (row.archived_at === null) {
      if (row.read_at === null) acc.unread += 1;
      else acc.anyRead = true;
    }
    notificationsByCase.set(key, acc);
  }

  return data.map((row) => {
    const contactMode = isContactMode(row.contact_mode) ? row.contact_mode : null;
    const connectionId = row.id as string;
    const caseId = row.case_id as string;
    const attempts = attemptsByConnection.get(connectionId) ?? [];
    const notifications = notificationsByCase.get(caseId) ?? { unread: 0, anyRead: false };

    const attemptCreatedNotDispatched = attempts.some((a) => a.status === "CRIADA");
    const attemptDispatchedWithoutResponse = attempts.some((a) => a.status === "DESPACHADA");
    const unavailabilityNeedsAction = attempts.some(
      (a) => a.status === "RESPONDIDA" && a.responseKind === "INDISPONIVEL",
    );
    const hasOpenAttempt = attemptCreatedNotDispatched || attemptDispatchedWithoutResponse;

    const pending =
      contactMode === null ||
      attemptCreatedNotDispatched ||
      attemptDispatchedWithoutResponse ||
      unavailabilityNeedsAction;

    return {
      caseId,
      connectionId,
      status: row.status as ConnectionStatus,
      contactMode,
      professionalProfileId: row.professional_profile_id as string,
      decidedAt: row.decided_at as string,
      awaitingContactMode: contactMode === null,
      attemptCreatedNotDispatched,
      attemptDispatchedWithoutResponse,
      unavailabilityNeedsAction,
      intermediatedWithoutOpenAttempt:
        contactMode === "APROXIMACAO_INTERMEDIADA" && !hasOpenAttempt,
      unreadNotifications: notifications.unread,
      // Ler não executa: se alguém viu e o trabalho continua, isso aparece.
      readButStillPending: notifications.anyRead && pending,
      totalAttempts: attempts.length,
    };
  });
}
