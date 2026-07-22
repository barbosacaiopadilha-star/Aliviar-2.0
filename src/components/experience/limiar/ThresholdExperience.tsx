import { LimiarAtmosphere } from "./LimiarAtmosphere";
import { LimiarPresence } from "./LimiarPresence";
import { THRESHOLD_FIRST_LINE } from "./threshold-model";

export function ThresholdExperience() {
  return (
    <div className="limiar">
      <LimiarAtmosphere />
      <LimiarPresence />
      <main className="limiar__main">
        <div className="limiar__lamp">
          <span className="limiar__lamp-halo" />
          <span className="limiar__lamp-core" />
        </div>

        <p className="limiar__line">{THRESHOLD_FIRST_LINE}</p>

        <p className="sr-only">O ambiente permanece quieto. Não há pressa.</p>
      </main>
    </div>
  );
}
