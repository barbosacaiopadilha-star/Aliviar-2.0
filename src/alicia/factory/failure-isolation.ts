export type CandidateFailure = {
  candidateId: string;
  stage: string;
  error: string;
  recordedAt: string;
};

export class FailureIsolation {
  private readonly failures = new Map<string, CandidateFailure[]>();

  record(runId: string, failure: Omit<CandidateFailure, "recordedAt">): void {
    const list = this.failures.get(runId) ?? [];
    list.push({ ...failure, recordedAt: new Date().toISOString() });
    this.failures.set(runId, list);
  }

  list(runId: string): CandidateFailure[] {
    return [...(this.failures.get(runId) ?? [])];
  }

  count(runId: string): number {
    return this.failures.get(runId)?.length ?? 0;
  }

  shouldContinue(): boolean {
    return true;
  }

  reset(runId?: string): void {
    if (runId) {
      this.failures.delete(runId);
    } else {
      this.failures.clear();
    }
  }
}
