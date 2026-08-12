import type { Metadata } from "next";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { JornadaNarrativa } from "@/components/paciente/experiencia/jornada-narrativa";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lerEstado } from "@/foundation/contrato-de-estado";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { buildJornada } from "@/modules/curadoria/jornada";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { lerFatosDoCaso } from "@/modules/paciente/fatos-do-caso";
import { projetarNarrativa } from "@/modules/paciente/jornada-narrativa";
import { nomeDoCuradorDoCaso } from "@/modules/paciente/nome-do-curador";
import { getPatientProfile, listPatientDocuments, listPatientNotifications } from "@/modules/profiles";
import { listStoriesForProfile } from "@/modules/story/repository";

export const metadata: Metadata = {
  title: "Sua Jornada",
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

/**
 * SUA JORNADA — o percurso, e depois dele o registro do que passou.
 *
 * A4 · esta rota chamava-se "Linha do tempo" e mostrava **só** o segundo
 * bloco: conta criada, dados de contato, documentos guardados, notificações.
 * Um log de atividade. A jornada — os encontros, a análise, a decisão — não
 * aparecia em lugar nenhum além do resumo da Home.
 *
 * Não havia, portanto, duas narrativas concorrentes para consolidar: havia uma
 * narrativa (a da Home) e um registro de conta com nome de narrativa. O que
 * mudou é que o percurso passa a existir aqui, projetado pela **mesma fonte**
 * que a Home resume — `projetarNarrativa`, sobre `buildJornada`.
 *
 * A URL permanece: ela está em uso e trocá-la só pelo nome custaria um
 * redirect sem ganho para a paciente.
 */
export default async function PatientJourneyPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [{ data: profileRow }, patientProfile, documents, notifications, stories, caseOverview, caseIds] =
    await Promise.all([
      supabase.from("profiles").select("created_at").eq("id", authState.user.id).single(),
      getPatientProfile(supabase, authState.user.id),
      listPatientDocuments(supabase, authState.user.id),
      listPatientNotifications(supabase, authState.user.id),
      listStoriesForProfile(supabase, authState.user.id),
      getPatientCaseOverview(supabase, authState.user.id),
      listCaseIds(supabase),
    ]);

  const record = caseIds.length > 0 ? await loadCuradoriaRecord(supabase, caseIds[0]) : null;
  const nomeDoCurador = record ? await nomeDoCuradorDoCaso(supabase, record.caseId) : null;
  const jornada = record
    ? buildJornada(nomeDoCurador ? { ...record, curatorName: nomeDoCurador } : record)
    : null;

  // A mesma leitura do contrato congelado que a Home usa. Duas telas, uma
  // verdade — e `loadPatientCuradoria` continua sendo a prova de entrega.
  const curadoriaEntregue = record ? await loadPatientCuradoria(supabase) : null;
  const leitura = lerEstado(
    await lerFatosDoCaso(supabase, {
      storyStatuses: stories.map((story) => story.status),
      caseId: caseOverview?.caseId ?? null,
      curadoriaEntregueEm: curadoriaEntregue?.deliveredAt ?? null,
    }),
  );

  const narrativa = record && jornada ? projetarNarrativa({ record, jornada, leitura }) : null;

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
    <div className="space-y-14">
      <PatientPageHeader
        title="Sua Jornada"
        description="Onde você está no percurso, o que já aconteceu e o que vem depois."
      />

      {narrativa ? (
        <JornadaNarrativa narrativa={narrativa} />
      ) : (
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Seu percurso começa quando sua história chega até um Curador. Assim que isso acontecer,
          cada etapa aparece aqui — com nome, e sem pressa.
        </p>
      )}

      {/* O registro de conta continua existindo, agora onde ele pertence: um
          apêndice do percurso, não a página inteira. Perder isso seria apagar
          a memória do que ela guardou aqui. */}
      <section
        aria-labelledby="registro-titulo"
        className="max-w-2xl border-t border-[var(--color-border)] pt-8"
      >
        <h2
          id="registro-titulo"
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
        >
          O que já passou por aqui
        </h2>

        {events.length === 0 ? (
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Ainda não há momentos guardados aqui. Conforme sua jornada avançar, cada um deles
            aparecerá neste espaço.
          </p>
        ) : (
          <ul className="mt-6 space-y-5">
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
      </section>

      {/* C4 · Track C — o percurso inteiro numa tela é onde a dúvida costuma
          aparecer ("por que ainda estou aqui?"). A porta fica no fim, sem
          competir com a leitura. */}
      <ConciergeLink topic="jornada" />
    </div>
  );
}
