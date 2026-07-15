import { LinkButton } from "@/components/landing/link-button";
import type { PatientHomeState as PatientHomeStateValue } from "@/modules/paciente/home-state";

type PatientHomeStateProps = {
  state: PatientHomeStateValue;
};

// Apresentação pura do estado já resolvido — nunca busca dados, nunca
// interpreta `statusLabel` (ele é exibido exatamente como a view
// patient_case_overview o traduziu, sem reclassificação local). Cada estado
// tem no máximo uma ação principal; "case_available" não tem ação própria
// porque nenhum destino seguro é hoje derivável sem interpretar o texto do
// label (ex.: saber se a indicação já está pronta) — a navegação permanente
// do PatientShell ("Minha Curadoria") continua disponível para isso.
export function PatientHomeState({ state }: PatientHomeStateProps) {
  switch (state.kind) {
    case "no_story":
      return (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-medium leading-tight text-ink lg:text-3xl">
            Este espaço começa com a sua história.
          </h2>
          <p className="max-w-reading text-base leading-relaxed text-ink-muted">
            Quando você se sentir pronto, pode nos contar o que está vivendo. Não precisa organizar
            tudo antes de começar.
          </p>
          <LinkButton href="/sua-historia">Contar minha história</LinkButton>
        </div>
      );

    case "draft":
      return (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-medium leading-tight text-ink lg:text-3xl">
            Sua história continua aqui.
          </h2>
          <p className="max-w-reading text-base leading-relaxed text-ink-muted">
            O que você já escreveu foi preservado. Você pode continuar de onde parou, no seu tempo.
          </p>
          <LinkButton href="/sua-historia/continuar">Continuar minha história</LinkButton>
        </div>
      );

    case "submitted_without_case":
      return (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-medium leading-tight text-ink lg:text-3xl">
            Sua história já está conosco.
          </h2>
          <p className="max-w-reading text-base leading-relaxed text-ink-muted">
            O envio foi concluído. Quando houver uma nova etapa disponível, ela aparecerá neste
            espaço.
          </p>
        </div>
      );

    case "case_available":
      return (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-medium leading-tight text-ink lg:text-3xl">
            Seu cuidado está em andamento.
          </h2>
          <p className="max-w-reading text-base leading-relaxed text-ink">{state.statusLabel}</p>
          <p className="max-w-reading text-sm text-ink-muted">
            Este espaço será atualizado conforme o seu caso avançar.
          </p>
        </div>
      );
  }
}
