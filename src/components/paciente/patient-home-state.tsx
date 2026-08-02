
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { LinkButton } from "@/components/landing/link-button";
import type { PatientHomeState as PatientHomeStateValue } from "@/modules/paciente/home-state";

type PatientHomeStateProps = {
  state: PatientHomeStateValue;
};

export function PatientHomeState({ state }: PatientHomeStateProps) {
  switch (state.kind) {
    case "no_story":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Este espaço começa com a sua história.
          </h2>
          <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">
            Quando você se sentir pronto, pode nos contar o que está vivendo. Não precisa organizar tudo
            antes de começar.
          </p>
          <LinkButton href="/sua-historia/continuar">Contar minha história</LinkButton>
        </PatientCard>
      );

    case "draft":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Sua história continua aqui.
          </h2>
          <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">
            O que você já escreveu foi preservado. Você pode continuar de onde parou, no seu tempo.
          </p>
          <LinkButton href="/sua-historia/continuar">Continuar minha história</LinkButton>
        </PatientCard>
      );

    case "submitted_without_case":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Sua história já está conosco.
          </h2>
          <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">
            O envio foi concluído. Quando houver uma nova etapa disponível, ela aparecerá aqui com calma.
          </p>
        </PatientCard>
      );

    case "case_available":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
            Onde está meu caso?
          </p>
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Seu cuidado está em andamento.
          </h2>
          <p className="patient-body text-lg text-[var(--patient-ink)]">{state.statusLabel}</p>
          <p className="patient-body text-sm text-[var(--color-ink-muted)]">
            Este espaço será atualizado conforme o seu caso avançar — sempre com nome e data.
          </p>
          {/* Correção de Método (reintegração): enquanto o caso está com a
              equipe, NÃO há ação principal para o paciente — link aqui sugere
              que falta algo dele, e não falta (contrato do teste deste
              componente: sem link, sem botão neste estado). */}
        </PatientCard>
      );
  }
}
