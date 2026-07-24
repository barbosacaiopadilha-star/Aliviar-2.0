import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/modules/crm/pipeline";

export function CrmStageBadge({ stage }: { stage: PipelineStage }) {
  return <Badge variant="sage">{PIPELINE_STAGE_LABELS[stage]}</Badge>;
}
