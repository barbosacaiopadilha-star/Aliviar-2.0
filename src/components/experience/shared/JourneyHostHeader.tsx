import { CURATION_HOST } from "../chapter-four/curation-model";

export function JourneyHostHeader() {
  return (
    <>
      <p className="curation-presence__host-name">{CURATION_HOST}</p>
      <p className="curation-presence__host-role">Gestor da jornada · Equipe Aliviar</p>
    </>
  );
}
