import { ALIVIAR_SCENES } from "@/lib/aliviar-environments";

/** Camada atmosférica fixa — sala de leitura reservada, luz de fim de tarde. */
export function PatientAmbientLayer() {
  return (
    <div className="patient-ambient-layer" aria-hidden="true">
      <div
        className="patient-ambient-layer__image"
        style={{ backgroundImage: `url(${ALIVIAR_SCENES.patientStudy})` }}
      />
      <div className="patient-ambient-layer__wash" />
      <div className="patient-ambient-layer__glow" />
    </div>
  );
}
