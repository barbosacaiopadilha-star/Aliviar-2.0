import { ambienceFor } from "@/modules/paciente/ambiente";
import type { JornadaStageId } from "@/modules/curadoria/jornada";

/**
 * AmbientHero — a primeira coisa que a pessoa vê, e ela responde visualmente.
 *
 * Hierarquia da tela: imagem → título → resumo → ação. Aqui ficam os três
 * primeiros; a ação vive nos cartões abaixo, para que o hero tenha uma ideia
 * só. O ambiente muda com a etapa (Storytelling Ambiental) — quem volta
 * semanas depois percebe que algo andou antes de ler qualquer palavra.
 *
 * A cena é `aria-hidden` e a descrição vai para leitor de tela em texto
 * próprio: quem não vê a foto recebe a informação que ela carrega, sem ouvir
 * um nome de arquivo.
 */
export function AmbientHero({
  firstName,
  stage,
  eyebrow,
  greeting,
}: {
  firstName: string;
  stage: JornadaStageId;
  /** Onde a jornada está, em duas palavras. */
  eyebrow: string;
  /** "Bom dia" / "Boa tarde" / "Boa noite" — resolvido no servidor, sem flash. */
  greeting?: string;
}) {
  const ambience = ambienceFor(stage);

  return (
    <section className="patient-hero patient-fade-in" aria-labelledby="patient-hero-title">
      <div
        className="patient-hero__scene"
        style={{ backgroundImage: `url(${ambience.scene})` }}
        aria-hidden="true"
      />
      <div className="patient-hero__veil" aria-hidden="true" />

      <div className="patient-hero__content">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-sage)]">
          {eyebrow}
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
        <p className="sr-only">{ambience.sceneDescription}</p>
      </div>
    </section>
  );
}
