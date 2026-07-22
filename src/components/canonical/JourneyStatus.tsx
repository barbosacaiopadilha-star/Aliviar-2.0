import type { EstadoVisivelJornada } from "@/experience-flow/contracts/jornada-view";
import { labelEstadoVisivel } from "@/experience-layer/mappers/estado-visivel";

interface JourneyStatusProps {
  estado_visivel: EstadoVisivelJornada;
}

export function JourneyStatus({ estado_visivel }: JourneyStatusProps) {
  return (
    <div
      className="inline-flex items-center rounded-full bg-sage-soft px-3 py-1 text-sm font-medium text-sage"
      data-testid="journey-status"
      data-estado={estado_visivel}
    >
      {labelEstadoVisivel(estado_visivel)}
    </div>
  );
}
