import Link from "next/link";

import { cn } from "@/components/ui/cn";

/**
 * JourneyWalk — a jornada como caminhada, não como lista de tarefas.
 *
 * A régua anterior mostrava sete caixas com descrição, estado e ação: sete
 * ideias competindo na mesma tela. Aqui a etapa atual recebe a palavra e as
 * demais viram marcas discretas no caminho — passado à esquerda, futuro à
 * direita, sem nenhuma parecer pendência cobrada.
 *
 * Acessibilidade: `ol` com `aria-current="step"` na etapa atual; cada marca
 * carrega o estado em texto para leitor de tela, nunca só em cor ou forma.
 */
export type WalkStage = {
  id: string;
  label: string;
  status: "done" | "current" | "ahead";
  /**
   * Para onde esta etapa leva. Ausente = etapa que ainda não tem superfície
   * própria; ela continua legível, mas não vira link para lugar nenhum —
   * navegar para uma tela que não existe é pior que não navegar.
   */
  href?: string;
};

const STATUS_LABEL: Record<WalkStage["status"], string> = {
  done: "concluída",
  current: "etapa atual",
  ahead: "ainda por vir",
};

export function JourneyWalk({
  stages,
  currentDetail,
}: {
  stages: WalkStage[];
  /** O que está acontecendo agora — a única frase desta seção. */
  currentDetail?: string;
}) {
  const current = stages.find((stage) => stage.status === "current");

  return (
    <section aria-labelledby="patient-walk-title" className="patient-walk">
      <h2 id="patient-walk-title" className="patient-section-title">
        Sua jornada
      </h2>

      <ol className="patient-walk__track">
        {stages.map((stage) => (
          <li
            key={stage.id}
            aria-current={stage.status === "current" ? "step" : undefined}
            className={cn("patient-walk__step", `patient-walk__step--${stage.status}`)}
          >
            <span className="patient-walk__dot" aria-hidden="true" />
            {/* A linha do tempo navega; o painel resume. Um não substitui o
                outro. Etapa sem destino continua legível como texto. */}
            {stage.href ? (
              <Link href={stage.href} className="patient-walk__label patient-walk__link">
                {stage.label}
                <span className="sr-only">, {STATUS_LABEL[stage.status]}</span>
              </Link>
            ) : (
              <>
                <span className="patient-walk__label">{stage.label}</span>
                <span className="sr-only">, {STATUS_LABEL[stage.status]}</span>
              </>
            )}
          </li>
        ))}
      </ol>

      {current ? (
        <p className="patient-body mt-5 max-w-xl text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--patient-ink)]">{current.label}.</span>{" "}
          {currentDetail}
        </p>
      ) : null}
    </section>
  );
}
