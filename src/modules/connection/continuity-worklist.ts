import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

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

  if (error || !data) return [];

  return data.map((row) => {
    const contactMode = isContactMode(row.contact_mode) ? row.contact_mode : null;
    return {
      caseId: row.case_id as string,
      connectionId: row.id as string,
      status: row.status as ConnectionStatus,
      contactMode,
      professionalProfileId: row.professional_profile_id as string,
      decidedAt: row.decided_at as string,
      awaitingContactMode: contactMode === null,
    };
  });
}
