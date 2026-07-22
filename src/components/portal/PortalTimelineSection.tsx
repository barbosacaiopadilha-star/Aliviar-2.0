import { JourneyTimeline } from "@/components/canonical";
import type { TimelineItemView } from "@/experience-flow/contracts/jornada-view";
import type { NotificationTimelineItemView } from "@/notification-flow/contracts/journey-notification";

type TimelineEntry = TimelineItemView | NotificationTimelineItemView;

function isNotificationItem(item: TimelineEntry): item is NotificationTimelineItemView {
  return "notificacao_id" in item;
}

interface PortalTimelineSectionProps {
  items: TimelineEntry[];
}

export function PortalTimelineSection({ items }: PortalTimelineSectionProps) {
  if (items.length === 0) {
    return null;
  }

  const timelineItems = items.map((item) => {
    if (isNotificationItem(item)) {
      return {
        id: item.id,
        tipo: "ATUALIZACAO" as const,
        titulo: item.lida ? item.titulo : `${item.titulo} (nova)`,
        descricao: `${item.descricao}${item.referencia_tipo ? ` — ref: ${item.referencia_tipo}` : ""}`,
        ocorrido_em: item.ocorrido_em,
        etapa: item.etapa as TimelineItemView["etapa"],
        visibilidade: "PUBLICO" as const,
      };
    }
    return item;
  });

  return (
    <section aria-label="Linha do tempo da jornada" data-testid="portal-timeline-section">
      <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Sua jornada até aqui</h2>
      <JourneyTimeline items={timelineItems} />
    </section>
  );
}
