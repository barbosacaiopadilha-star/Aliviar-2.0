import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

import { PortalShell } from "@/components/curadoria/portal-shell";
import { EmptyState } from "@/components/ui/empty-state";

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
  const state = await requireAnyRole(["concierge", "administrador"]);
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .schema("curadoria")
    .from("cases")
    .select("id, status, responsible_role, created_at")
    .order("created_at", { ascending: false });

  const cases = (data ?? []) as { id: string; status: string; responsible_role: string | null; created_at: string }[];

  return (
    <PortalShell
      homeHref="/acompanhamento"
      subtitle="Acompanhamento"
      nav={[{ href: "/acompanhamento", label: "Meus acompanhamentos" }]}
      identity={state.profile?.displayName ?? null}
    >
      <div className="space-y-6">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">Meus acompanhamentos</h1>
          <p className="text-sm text-ink-muted">
            Cases que já passaram pela Curadoria e seguem com você até o encerramento.
          </p>
        </div>

        {cases.length === 0 ? (
          <EmptyState
            title="Nenhum acompanhamento no momento."
            description="Quando um Curador concluir uma Curadoria e encaminhar o Case, ele aparece aqui — o mesmo Case, com você como responsável."
          />
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-ink-muted">{c.id}</span>
                  <span className="text-sm text-ink">
                    {CASE_STATUS_LABELS[c.status as CaseStatus] ?? c.status}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">
                  {c.responsible_role === "concierge" ? "Sob sua responsabilidade" : "Visível por vínculo anterior"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
