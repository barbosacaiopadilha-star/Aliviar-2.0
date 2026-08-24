import type { ReactNode } from "react";

import { StateMark } from "@/components/ui/state-mark";
import type { PapelVisual } from "@/foundation/estado-visual";
import { ambienceFor } from "@/modules/paciente/ambiente";
import type { JornadaStageId } from "@/modules/curadoria/jornada";

/**
 * AmbientHero — a primeira coisa que a pessoa vê, agora na gramática da
 * vitrine (24/08, "as configurações visuais da landing").
 *
 * A cena deixou de morar DENTRO do hero: ela é a casa inteira — a fotografia
 * em força total atrás de tudo (PatientAmbientLayer), como na landing. O
 * hero vira o que os cards da vitrine são: VIDRO sobre o ambiente, que
 * cristaliza na zona de leitura pelo mesmo motor (`patient-veu`).
 *
 * O que fica do desenho anterior: a hierarquia (estado → saudação → mensagem
 * → ação) e a mensagem que muda com a etapa (Storytelling Ambiental) — quem
 * volta semanas depois percebe que algo andou antes de ler qualquer palavra.
 */
export function AmbientHero({
  firstName,
  stage,
  eyebrow,
  greeting,
  estado,
  acao,
}: {
  firstName: string;
  stage: JornadaStageId;
  /** Onde a jornada está, em duas palavras. Usado quando não há `estado`. */
  eyebrow: string;
  /** "Bom dia" / "Boa tarde" / "Boa noite" — resolvido no servidor, sem flash. */
  greeting?: string;
  /**
   * A3b · o macroestado do contrato congelado, já projetado. O rótulo
   * canônico responde "o que está acontecendo agora?" — nada é decidido
   * aqui: o texto e o papel chegam prontos.
   */
  estado?: { texto: string; papel: PapelVisual };
  /**
   * A AÇÃO ENTRA NO HERO (decisão do Fundador, 23/08 — "o foco é o
   * celular"): uma tela responde onde você está e o que fazer com isso.
   */
  acao?: ReactNode;
}) {
  const ambience = ambienceFor(stage);

  return (
    <section
      className="patient-card patient-veu patient-fade-in p-6 lg:p-10"
      aria-labelledby="patient-hero-title"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-sage)]">
        {estado ? <StateMark papel={estado.papel}>{estado.texto}</StateMark> : eyebrow}
      </p>
      <h1
        id="patient-hero-title"
        className="mt-3 font-serif text-3xl font-medium leading-snug tracking-tight text-[var(--patient-ink)] lg:text-[2.6rem]"
      >
        {greeting ? `${greeting}, ${firstName}.` : `Olá, ${firstName}.`}
      </h1>
      <p className="p-read-mid mt-3 max-w-xl text-lg text-[var(--color-ink-muted)]">
        {ambience.message}
      </p>
      {acao ? <div className="mt-6">{acao}</div> : null}
    </section>
  );
}
