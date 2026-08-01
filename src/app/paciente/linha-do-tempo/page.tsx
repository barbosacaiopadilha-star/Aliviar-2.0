import type { Metadata } from "next";

import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientProfile, listPatientDocuments, listPatientNotifications } from "@/modules/profiles";

export const metadata: Metadata = {
  title: "Linha do tempo",
  robots: { index: false, follow: false },
};

type TimelineEvent = {
  key: string;
  label: string;
  date: string;
};

// Só a data: hora-a-hora é precisão de log, não de memória (Onda 1 §7 —
// timestamps excessivos leem como rastreador).
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "long" });
}

export default async function PatientTimelinePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [{ data: profileRow }, patientProfile, documents, notifications] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", authState.user.id).single(),
    getPatientProfile(supabase, authState.user.id),
    listPatientDocuments(supabase, authState.user.id),
    listPatientNotifications(supabase, authState.user.id),
  ]);

  const events: TimelineEvent[] = [];

  // Momentos, não registros: cada frase descreve um fato com quem o fez —
  // ela, ou a Aliviar — nunca um evento de sistema.
  if (profileRow?.created_at) {
    events.push({
      key: "conta-criada",
      label: "Você chegou à Aliviar",
      date: profileRow.created_at as string,
    });
  }

  if (patientProfile) {
    events.push({
      key: "perfil-preenchido",
      label: "Você completou seus dados de contato",
      date: patientProfile.createdAt,
    });
  }

  for (const document of documents) {
    events.push({
      key: `documento-${document.id}`,
      label: `Você guardou aqui o documento "${document.fileName}"`,
      date: document.createdAt,
    });
  }

  for (const notification of notifications) {
    events.push({
      key: `notificacao-${notification.id}`,
      label: notification.title,
      date: notification.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-10">
      <PatientPageHeader
        title="Linha do tempo"
        description="Tudo que já aconteceu na sua jornada com a Aliviar, até aqui."
      />

      {/* A memória da continuidade: o fato em serifa (aconteceu com gente),
          a data na margem em sem-serifa (função da casa). Nenhum ícone como
          estado, nenhum medalhão — palavra antes de símbolo (F2 §8). */}
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          O que já aconteceu
        </h2>

        {events.length === 0 ? (
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Ainda não há momentos guardados aqui. Conforme sua jornada avançar, cada um deles
            aparecerá neste espaço.
          </p>
        ) : (
          <ul className="mt-6 space-y-6">
            {events.map((event) => (
              <li key={event.key} className="max-w-prose">
                <p className="text-xs text-[var(--color-ink-muted)]">{formatDate(event.date)}</p>
                <p className="mt-1 font-serif text-base leading-relaxed text-[var(--patient-ink)]">
                  {event.label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PatientCard>
    </div>
  );
}
