export type HandoffStatus = "STARTED" | "COMPLETED" | "BOOTSTRAPPED";

export function canBootstrap(status: HandoffStatus): boolean {
  return status === "COMPLETED" || status === "STARTED";
}

export function isHandoffFinished(status: HandoffStatus): boolean {
  return status === "BOOTSTRAPPED";
}
