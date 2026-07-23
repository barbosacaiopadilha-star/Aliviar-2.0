export const PROCESS_STATUSES = [
  "CREATED",
  "INVESTIGATING",
  "RESEARCHING",
  "COMPARING",
  "REVIEWING",
  "READY_FOR_APPROVAL",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

export function isProcessStatus(value: string): value is ProcessStatus {
  return (PROCESS_STATUSES as readonly string[]).includes(value);
}

export function isProcessTerminal(status: ProcessStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function isProcessActive(status: ProcessStatus): boolean {
  return !isProcessTerminal(status);
}
