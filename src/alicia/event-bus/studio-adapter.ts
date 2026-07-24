import { WorkflowEngine } from "./workflow-engine";
import { resetWorkflowContext } from "./integration/workflow-context";
import { resetCorrelationRegistry } from "./correlation";
import type { WorkflowMonitorSnapshot } from "./types";

let sessionWorkflow: WorkflowEngine | null = null;

export function resetWorkflowSession(): void {
  sessionWorkflow?.stop();
  sessionWorkflow = null;
  resetWorkflowContext();
  resetCorrelationRegistry();
}

export function getWorkflowSession(): WorkflowEngine {
  if (!sessionWorkflow) {
    sessionWorkflow = new WorkflowEngine();
    sessionWorkflow.start();
  }
  return sessionWorkflow;
}

export async function getWorkflowMonitorSnapshot(
  options: { refresh?: boolean } = {},
): Promise<WorkflowMonitorSnapshot> {
  const workflow = getWorkflowSession();

  if (options.refresh) {
    await workflow.runDiscovery();
  } else if (workflow.getStore().size() === 0) {
    await workflow.runDiscovery();
  }

  const store = workflow.getStore();
  const events = store.list();
  const correlationId = events[0]?.correlationId ?? "n/a";

  return {
    correlationId,
    timeline: events.map((event) => ({
      event,
      inDlq: workflow.getDeadLetterQueue().list().some((item) => item.job.event.eventId === event.eventId),
    })),
    metrics: workflow.getMetrics().snapshot(),
    dlq: [...workflow.getDeadLetterQueue().list()],
    pendingRetries: workflow.getRetryQueue().listByStatus("Retrying"),
  };
}

export async function getWorkflowTimelineByCorrelation(
  correlationId: string,
): Promise<WorkflowMonitorSnapshot> {
  const workflow = getWorkflowSession();
  const events = workflow.getStore().listByCorrelationId(correlationId);

  return {
    correlationId,
    timeline: events.map((event) => ({
      event,
      inDlq: workflow.getDeadLetterQueue().list().some((item) => item.job.event.eventId === event.eventId),
    })),
    metrics: workflow.getMetrics().snapshot(),
    dlq: workflow.getDeadLetterQueue().list().filter((item) => item.job.event.correlationId === correlationId),
    pendingRetries: workflow
      .getRetryQueue()
      .list()
      .filter((job) => job.event.correlationId === correlationId && job.status === "Retrying"),
  };
}
