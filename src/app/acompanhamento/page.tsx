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
  const state = await requireAnyRole(["concierge", "administrador"]);
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .schema("curadoria")
    .from("cases")
    .select("id, status, responsible_role, created_at, patient_profile_id")
    .order("created_at", { ascending: false });

  const cases = (data ?? []) as { id: string; status: string; responsible_role: string | null; created_at: string; patient_profile_id: string }[];

  // V3 (auditoria 22/08): o Concierge acompanha PESSOAS — o rótulo é o nome
  // da paciente, nunca o UUID truncado do Case.
  const patientIds = [...new Set(cases.map((c) => c.patient_profile_id).filter(Boolean))];
  const { data: perfis } = patientIds.length
    ? await supabase.schema("curadoria").from("profiles").select("id, display_name").in("id", patientIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const nomePorPaciente = new Map((perfis ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null]));

  // D4 (auditoria 22/08): a RLS dá ao administrador a visão GLOBAL — todos
  // os Cases, em qualquer etapa. A descrição da tela dizia a promessa do
  // Concierge ("já passaram pela Curadoria") em cima de uma lista que não a
  // cumpre. Quem olha como supervisor lê a verdade da visão que tem.
  const supervisor = state.roles.includes("administrador") && !state.roles.includes("concierge");

  return (
    <PortalShellContainer
      homeHref="/acompanhamento"
      subtitle="Acompanhamento"
      nav={[{ href: "/acompanhamento", label: "Meus acompanhamentos" }]}
      variant="concierge"
    >
      <div className="space-y-6">
        {/* Sem "o mais frio primeiro": a ordem é a de chegada, e apresentá-la
            como fila de urgência seria inventar uma régua que não existe. */}
        <JourneyHeader
          moment={supervisor ? "Acompanhamentos" : "Meus acompanhamentos"}
          context={
            supervisor
              ? "Visão de supervisão: todos os Cases, em qualquer etapa — quem responde por cada um está ao lado."
              : "Cases que já passaram pela Curadoria e seguem com você até o encerramento."
          }
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
                    {nomePorPaciente.get(c.patient_profile_id) ?? `Case ${c.id.slice(0, 8)}`}
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
