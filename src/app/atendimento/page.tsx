import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEAD_SOURCE_LABELS } from "@/modules/crm/lead";
import { nextStepForLead, sortLeadQueue } from "@/modules/crm/lead-next-step";
import { listLeadsForAtendente } from "@/modules/crm/lead-repository";

import { EmptyJourneyState, JourneyHeader } from "@/components/journey";

export const metadata = { title: "Quem chegou" };

/**
 * Fila do Atendente — a home da jornada do Nível 1.
 *
 * @metodo Guided Experience §2 — as Cinco Perguntas
 * @metodo UX_PRINCIPLES P6 — filas ordenam pelo que falta fazer
 *
 * A fila é ordenada pelo que falta fazer, não pela data. Um lead que espera
 * qualificação há três dias é mais urgente que um convertido hoje, e a lista
 * precisa dizer isso sem que ninguém tenha que ler tudo. Cada card já É a
 * próxima ação daquela pessoa (rótulo pelo efeito, nunca "Continuar").
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
      <JourneyHeader
        moment="Quem chegou"
        context={
          leads.length === 0
            ? undefined
            : aguardando === 0
              ? "Todas as pessoas que chegaram já têm acesso à Aliviar."
              : `${aguardando} ${aguardando === 1 ? "pessoa aguarda" : "pessoas aguardam"} um gesto seu. A ordem é a do que falta fazer.`
        }
        nothingPendingLabel={
          leads.length > 0 && aguardando === 0
            ? "Nada depende de você agora — os Cases seguem com o Curador."
            : undefined
        }
      />

      {leads.length === 0 ? (
        <EmptyJourneyState
          title="Ninguém aguardando agora"
          becauseOf="Ninguém entrou em contato ainda."
          whatWillHappen="Quando alguém escrever pelo site, WhatsApp ou indicação, a pessoa aparece aqui para você acolher."
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
