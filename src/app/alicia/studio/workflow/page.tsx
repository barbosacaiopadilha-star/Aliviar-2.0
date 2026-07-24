import { getWorkflowMonitorSnapshot } from "@/alicia/event-bus/studio-adapter";
import { WorkflowMonitor } from "@/components/alicia/studio/WorkflowMonitor";

export default async function AliciaStudioWorkflowPage() {
  const snapshot = await getWorkflowMonitorSnapshot();
  return <WorkflowMonitor snapshot={snapshot} />;
}
