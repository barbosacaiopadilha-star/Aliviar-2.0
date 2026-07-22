import { THRESHOLD_FIRST_LINE } from "./threshold-model";
import { LimiarAtmosphere } from "./LimiarAtmosphere";

export function ThresholdExperience() {
  return (
    <div className="limiar">
      <LimiarAtmosphere />
      <main className="limiar__main">
        <div className="limiar__lamp" aria-hidden="true">
          <span className="limiar__lamp-halo" />
          <span className="limiar__lamp-core" />
        </div>

        <p className="limiar__line">{THRESHOLD_FIRST_LINE}</p>

        <p className="sr-only">
          Um lugar acolhedor permanece iluminado. Não há pressa.
        </p>
      </main>
    </div>
  );
}
