import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import type { Metadata } from "next";

import { EvidenceCard } from "@/components/curadoria/evidence-card";
import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { PERFIL_MESSAGE } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { PRIORITY_CRITERION_LABELS } from "@/modules/curadoria/types";

export const metadata: Metadata = { title: "Minhas prioridades" };

async function loadMinhaCuradoria() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;
  return loadCuradoriaRecord(supabase, caseId);
}

export default async function MinhasPrioridadesPage() {
  const record = await loadMinhaCuradoria();
  if (!record) return <SemCuradoria />;
  const { weights, observations } = record.prioridades;
  const total = weights.reduce((sum, weight) => sum + weight.weight, 0);

  return (
    <div className="space-y-10">
      <PatientPageHeader
        eyebrow="Perfil confirmado"
        title="Suas prioridades, nas suas palavras."
        description={PERFIL_MESSAGE}
      />

      <div className="space-y-5">
        {weights.map((weight) => (
          <PatientCard key={weight.criterion} variant="note" className="patient-fade-in">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
                {PRIORITY_CRITERION_LABELS[weight.criterion]}
              </h2>
              <p className="tabular-nums font-serif text-2xl font-semibold text-[var(--patient-forest)]">
                {weight.weight}
                <span className="ml-1 font-sans text-xs font-normal text-[var(--color-ink-muted)]">
                  {weight.weight === 1 ? "ponto" : "pontos"}
                </span>
              </p>
            </div>

            <div className="patient-progress-track mt-4" aria-hidden="true">
              <div className="patient-progress-fill" style={{ width: `${weight.weight}%` }} />
            </div>

            <EvidenceCard evidence={weight.evidence} className="mt-4 border-l-[var(--color-brand-sage)]/40 pl-4" />
          </PatientCard>
        ))}
      </div>

      <PatientCard>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-[var(--patient-ink)]">Total distribuído</span>
          <span className="tabular-nums font-serif text-xl font-semibold text-[var(--patient-ink)]">
            {total} pontos
          </span>
        </div>
      </PatientCard>

      <PatientCard variant="note">
        <p className="patient-body max-w-2xl text-[var(--patient-ink)]">
          Estes pesos representam apenas a importância que{" "}
          <strong className="font-medium">você</strong> atribuiu a cada critério durante nossa conversa. Eles
          nunca representam nota de médico — nenhum profissional é avaliado por eles. Servem para comparar o
          quanto cada opção responde ao que importa para você.
        </p>
      </PatientCard>

      {observations.length > 0 ? (
        <PatientCard>
          <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Também registramos</h2>
          <p className="patient-body mt-2 text-[var(--color-ink-muted)]">
            Coisas que você contou e que orientam o cuidado.
          </p>
          <ul className="mt-4 space-y-3 text-[var(--color-ink-muted)]">
            {observations.map((observation) => (
              <li key={observation} className="patient-body border-l-2 border-[var(--color-brand-sage)]/30 pl-4">
                {observation}
              </li>
            ))}
          </ul>
        </PatientCard>
      ) : null}

      {record.validacao ? (
        <p className="patient-body max-w-2xl text-sm text-[var(--color-ink-muted)]">
          Você validou este Perfil em{" "}
          {new Date(record.validacao.validatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          , junto com {record.curatorName}. A partir daí ele passou a orientar toda a Curadoria.
        </p>
      ) : null}

      <WhatsappContact topics={["duvida", "curador"]} />
    </div>
  );
}
