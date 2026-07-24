export type ConnectorEventType =
  | "ConnectorStarted"
  | "ConnectorSucceeded"
  | "ConnectorFailed"
  | "ConnectorRetried"
  | "ConnectorDisabled"
  | "ConnectorRecovered";

export type ConnectorStartedPayload = {
  connectorId: string;
  connectorName: string;
};

export type ConnectorSucceededPayload = {
  connectorId: string;
  recordCount: number;
  latencyMs: number;
};

export type ConnectorFailedPayload = {
  connectorId: string;
  error: string;
  attempt: number;
};

export type ConnectorRetriedPayload = {
  connectorId: string;
  attempt: number;
  nextRetryAt: string;
  error: string;
};

export type ConnectorDisabledPayload = {
  connectorId: string;
  reason: string;
};

export type ConnectorRecoveredPayload = {
  connectorId: string;
  previousHealth: string;
  currentHealth: string;
};
