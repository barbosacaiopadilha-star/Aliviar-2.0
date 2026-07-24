import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEAD_SOURCE_LABELS } from "@/modules/crm/lead";
import { nextStepForLead, sortLeadQueue } from "@/modules/crm/lead-next-step";
import { listLeadsForAtendente } from "@/modules/crm/lead-repository";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Meus leads" };

/**
 * Fila do Atendente.
 *
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * A fila é ordenada pelo que falta fazer, não pela data. Um lead que espera
 * qualificação há três dias é mais urgente que um convertido hoje, e a lista
 * precisa dizer isso sem que ninguém tenha que ler tudo.
 */

const TOM: Record<string, string> = {
  qualificar: "text-ink-muted",
  converter: "text-brand-gold",
  abrir: "text-brand-primary",
  encaminhar: "text-brand-primary",
  concluido: "text-ink-muted",
};

export default async function AtendimentoPage() {
  const supabase = await createServerSupabaseClient();
  const leads = await listLeadsForAtendente(supabase);

  const ordenados = sortLeadQueue(leads);
  const aguardando = leads.filter((l) => !l.patientProfileId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Meus leads</h1>
        <p className="text-sm text-ink-muted">
          {leads.length === 0
            ? "Nenhum contato na fila."
            : aguardando === 0
              ? "Todos os contatos já viraram paciente."
              : `${aguardando} ${aguardando === 1 ? "contato aguarda" : "contatos aguardam"} sua próxima ação.`}
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead na fila."
          description="Quando alguém entrar em contato pelo site, WhatsApp ou indicação, o contato aparece aqui para você acolher e qualificar."
        />
      ) : (
        <ul className="space-y-2">
          {ordenados.map((lead) => {
            const etapa = nextStepForLead(lead);
            return (
              <li key={lead.id}>
                <Link
                  href={`/atendimento/${lead.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{lead.fullName}</span>
                    <span className="mt-0.5 block truncate text-sm text-ink-muted">
                      {LEAD_SOURCE_LABELS[lead.source]}
                      {lead.city ? ` · ${lead.city}` : ""}
                      {lead.initialReason ? ` · ${lead.initialReason}` : ""}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span className={`text-xs font-medium ${TOM[etapa.key]}`}>{etapa.status}</span>
                    <span className="text-sm font-medium text-brand-primary">{etapa.action} →</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
