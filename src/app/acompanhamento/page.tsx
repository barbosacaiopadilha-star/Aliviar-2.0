import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";
import { EmptyJourneyState, JourneyHeader } from "@/components/journey";
import { responsibilityLabel } from "@/modules/connection/continuity-labels";

export const metadata: Metadata = {
  title: "Acompanhamento",
  robots: { index: false, follow: false },
};

/**
 * Superfície do Concierge — Nível 3.
 *
 * @metodo Correção de Domínio §2 — o Concierge recebe o MESMO Case após a Curadoria
 *
 * Mínima de propósito. O Concierge só passa a existir de verdade quando um
 * Case chega até ele, e nenhum chegou ainda em produção. Esta tela prova a
 * chegada: mostra os Cases sob a responsabilidade dele — e nada além disso.
 *
 * A lista não filtra por responsável no TypeScript. Quem filtra é a RLS
 * (`can_access_case`): se aparecer aqui um Case que não é dele, o problema
 * está na policy, e é lá que precisa ser visto. Filtrar aqui esconderia o
 * defeito em vez de revelá-lo.
 */
export default async function AcompanhamentoPage() {
  await requireAnyRole(["concierge", "administrador"]);
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .schema("curadoria")
    .from("cases")
    .select("id, status, responsible_role, created_at")
    .order("created_at", { ascending: false });

  const cases = (data ?? []) as { id: string; status: string; responsible_role: string | null; created_at: string }[];

  return (
    <PortalShellContainer
      homeHref="/acompanhamento"
      subtitle="Acompanhamento"
      nav={[{ href: "/acompanhamento", label: "Meus acompanhamentos" }]}
    >
      <div className="space-y-6">
        {/* Sem "o mais frio primeiro": a ordem é a de chegada, e apresentá-la
            como fila de urgência seria inventar uma régua que não existe. */}
        <JourneyHeader
          moment="Meus acompanhamentos"
          context="Cases que já passaram pela Curadoria e seguem com você até o encerramento."
          nothingPendingLabel={
            cases.length === 0
              ? undefined
              : `${cases.length} ${cases.length === 1 ? "caso" : "casos"}, do mais recente ao mais antigo.`
          }
        />

        {cases.length === 0 ? (
          <EmptyJourneyState
            title="Nenhum acompanhamento no momento"
            becauseOf="Nenhuma Curadoria foi concluída e encaminhada a você ainda."
            whatWillHappen="Quando um Curador concluir e encaminhar, o Case aparece aqui — o mesmo Case, com você como responsável."
          />
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4"
              >
                <span className="min-w-0">
                  <span className="text-sm text-ink">
                    Case {c.id.slice(0, 8)}
                    <span className="ml-2 text-ink-muted">
                      {CASE_STATUS_LABELS[c.status as CaseStatus] ?? c.status}
                    </span>
                  </span>
                </span>
                {/* Quem responde vem de `cases.responsible_role`, a fonte
                    única — nunca inferido de notificação ou tentativa. */}
                <span className="text-xs text-ink-muted">
                  {responsibilityLabel(c.responsible_role)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalShellContainer>
  );
}
