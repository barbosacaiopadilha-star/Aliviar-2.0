import type { RawOperationsInput } from "../types";

export const mockOperationsInput: RawOperationsInput = {
  discovery: {
    metrics: {
      candidatesFound: 10,
      readyForEvidence: 8,
      averageDurationMs: 1200,
      sourcesExecuted: 5,
      sourceFailures: 1,
    },
    queueSize: 3,
  },
  evidence: {
    metrics: {
      packagesCreated: 6,
      packagesRejected: 1,
      candidatesProcessed: 7,
      averageCoverage: 75,
    },
    packageCount: 6,
  },
  connectors: {
    metrics: {
      totalExecutions: 20,
      successfulExecutions: 18,
      failedExecutions: 2,
      retries: 6,
      averageLatencyMs: 800,
      availability: 0.85,
    },
    connectors: [
      {
        connectorId: "crm-estadual",
        name: "CRM Estadual",
        health: "DEGRADED",
        availability: 0.7,
        averageLatencyMs: 1500,
      },
      {
        connectorId: "cfm",
        name: "CFM",
        health: "ONLINE",
        availability: 0.95,
        averageLatencyMs: 400,
      },
      {
        connectorId: "failing",
        name: "Failing",
        health: "OFFLINE",
        availability: 0,
        averageLatencyMs: 0,
      },
    ],
    retryQueueSize: 2,
  },
  workflow: {
    metrics: {
      eventsPublished: 50,
      retryCount: 6,
      dlqCount: 4,
      averageProcessingMs: 300,
      eventsByType: {
        DiscoveryCompleted: 1,
        ProtocolStarted: 5,
        ProtocolEvaluated: 4,
        PublicationRequested: 3,
        PublicationSucceeded: 2,
        PublicationFailed: 1,
        VerificationRequested: 2,
        VerificationCompleted: 2,
        ProfileChanged: 1,
      },
    },
    dlqCount: 4,
    pendingRetries: 2,
    events: [
      {
        eventType: "DiscoveryCompleted",
        aggregateId: "run-1",
        timestamp: "2026-07-23T10:00:00.000Z",
        correlationId: "corr-abc",
        source: "discovery-facade",
        payload: {},
      },
      {
        eventType: "EvidencePackageCreated",
        aggregateId: "disc-abc123",
        timestamp: "2026-07-23T10:01:00.000Z",
        correlationId: "corr-abc",
        source: "evidence-bridge",
        payload: {},
      },
      {
        eventType: "ProtocolStarted",
        aggregateId: "disc-abc123",
        timestamp: "2026-07-23T10:02:00.000Z",
        correlationId: "corr-abc",
        source: "protocol-facade",
        payload: {},
      },
      {
        eventType: "ProtocolEvaluated",
        aggregateId: "disc-abc123",
        timestamp: "2026-07-23T10:03:00.000Z",
        correlationId: "corr-abc",
        source: "protocol-facade",
        payload: { outcome: "AUTO_PUBLISH" },
      },
      {
        eventType: "PublicationSucceeded",
        aggregateId: "disc-abc123",
        timestamp: "2026-07-23T10:05:00.000Z",
        correlationId: "corr-abc",
        source: "publication-facade",
        payload: {},
      },
    ],
  },
  verification: {
    metrics: {
      profilesVerified: 3,
      pendingQueue: 2,
      averageLatencyMs: 600,
      materialChanges: 1,
    },
    pendingReviewCount: 2,
    failedRuns: 1,
    completedRuns: 4,
  },
  protocol: {
    auditCount: 5,
    approvedCount: 3,
    rejectedCount: 1,
    reviewCaseCount: 2,
  },
  publication: {
    publishedCount: 2,
    failedCount: 1,
    reviewCaseCount: 1,
  },
};

export const mockOperationsInputHealthy: RawOperationsInput = {
  ...mockOperationsInput,
  connectors: {
    ...mockOperationsInput.connectors,
    metrics: {
      ...mockOperationsInput.connectors.metrics,
      retries: 0,
      availability: 0.99,
    },
    connectors: mockOperationsInput.connectors.connectors.map((c) => ({
      ...c,
      health: "ONLINE",
      availability: 0.99,
    })),
  },
  workflow: {
    ...mockOperationsInput.workflow,
    dlqCount: 0,
    metrics: {
      ...mockOperationsInput.workflow.metrics,
      retryCount: 0,
      dlqCount: 0,
    },
  },
  verification: {
    ...mockOperationsInput.verification,
    failedRuns: 0,
  },
  protocol: {
    ...mockOperationsInput.protocol,
    rejectedCount: 0,
  },
  publication: {
    ...mockOperationsInput.publication,
    failedCount: 0,
  },
};
