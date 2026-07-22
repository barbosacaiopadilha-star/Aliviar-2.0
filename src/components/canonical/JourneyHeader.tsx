import type { EstadoVisivelJornada } from "@/experience-flow/contracts/jornada-view";
import { labelEstadoVisivel } from "@/experience-layer/mappers/estado-visivel";

interface JourneyHeaderProps {
  titulo: string;
  subtitulo?: string;
  estado_visivel?: EstadoVisivelJornada;
}

export function JourneyHeader({ titulo, subtitulo, estado_visivel }: JourneyHeaderProps) {
  return (
    <header className="space-y-2" data-testid="journey-header">
      <h1 className="font-serif text-3xl font-semibold text-ink">{titulo}</h1>
      {estado_visivel ? (
        <p className="text-sm font-medium text-coral" data-testid="journey-header-estado">
          {labelEstadoVisivel(estado_visivel)}
        </p>
      ) : null}
      {subtitulo ? <p className="text-ink-soft">{subtitulo}</p> : null}
    </header>
  );
}
