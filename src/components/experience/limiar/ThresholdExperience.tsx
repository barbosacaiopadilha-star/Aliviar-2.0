import { THRESHOLD_FIRST_LINE } from "./threshold-model";
import { LimiarAtmosphere } from "./LimiarAtmosphere";

export function ThresholdExperience() {
  return (
    <div className="limiar">
      <LimiarAtmosphere />
      <main className="limiar__main">
        <p className="limiar__line">{THRESHOLD_FIRST_LINE}</p>

        <div className="limiar__presence" aria-hidden="true">
          <span className="limiar__presence-halo" />
          <span className="limiar__presence-pulse" />
        </div>

        <p className="sr-only">
          Um vídeo de boas-vindas aguarda ser iniciado. Não há pressa.
        </p>
      </main>
    </div>
  );
}
