import type { MapaEtapaView } from "@/experience-layer/contracts/experience-models";

interface JourneyStageMapProps {
  etapas: MapaEtapaView[];
}

const STATUS_STYLE: Record<MapaEtapaView["status"], string> = {
  CONCLUIDA: "text-sage",
  ATUAL: "text-coral font-semibold",
  FUTURA: "text-ink-soft",
  BLOQUEADA: "text-coral",
};

export function JourneyStageMap({ etapas }: JourneyStageMapProps) {
  return (
    <ul className="space-y-2" data-testid="journey-stage-map" aria-label="Mapa da jornada">
      {etapas.map((etapa) => (
        <li
          key={etapa.codigo}
          className={`text-sm ${STATUS_STYLE[etapa.status]}`}
          data-testid={`stage-${etapa.codigo}`}
          data-status={etapa.status}
        >
          {etapa.label}
        </li>
      ))}
    </ul>
  );
}
