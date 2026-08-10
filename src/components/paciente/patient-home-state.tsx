
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { LinkButton } from "@/components/landing/link-button";
import type { LeituraDeEstado } from "@/foundation/contrato-de-estado";

type PatientHomeStateProps = {
  /**
   * A projeção do contrato congelado. Este componente **não decide estado**:
   * ele escolhe a composição do que a Fundação já leu. O motor local que
   * existia antes foi aposentado.
   */
  leitura: LeituraDeEstado;
  /**
   * Descritivo do Case, quando existe. Continua sendo exibido, mas **nunca
   * governa o macroestado** — derivar comportamento de texto foi o que
   * permitiu a Home contradizer a realidade.
   */
  statusLabel: string | null;
  /**
   * A3a · a ação desta pendência é apresentada por `ProximaAcao`, no nível 2 da
   * Home. Quando a Home a exibe lá, este componente para de repetir o botão:
   * a mesma pendência oferecida duas vezes obriga a pessoa a decidir se são
   * dois atos ou um só (§9 da missão).
   *
   * O padrão é `false` — quem monta a tela declara que assumiu a ação. O
   * estado, que é a responsabilidade deste componente, nunca deixa de ser dito.
   */
  acaoEmOutroLugar?: boolean;
};

export function PatientHomeState({
  leitura,
  statusLabel,
  acaoEmOutroLugar = false,
}: PatientHomeStateProps) {
  switch (leitura.estado) {
    case "HISTORIA_NAO_INICIADA":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Este espaço começa com a sua história.
          </h2>
          <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">
            Quando você se sentir pronto, pode nos contar o que está vivendo. Não precisa organizar tudo
            antes de começar.
          </p>
          {acaoEmOutroLugar ? null : (
            <LinkButton href="/sua-historia/continuar">Contar minha história</LinkButton>
          )}
        </PatientCard>
      );

    case "HISTORIA_EM_PREENCHIMENTO":
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Sua história continua aqui.
          </h2>
          <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">
            O que você já escreveu foi preservado. Você pode continuar de onde parou, no seu tempo.
          </p>
          {acaoEmOutroLugar ? null : (
            <LinkButton href="/sua-historia/continuar">Continuar minha história</LinkButton>
          )}
        </PatientCard>
      );

    case "HISTORIA_ENVIADA":
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

    default:
      return (
        <PatientCard className="patient-fade-in space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
            Onde está meu caso?
          </p>
          <h2 className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-3xl">
            Seu cuidado está em andamento.
          </h2>
          <p className="patient-body text-lg text-[var(--patient-ink)]">{statusLabel ?? leitura.rotuloPaciente}</p>
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
