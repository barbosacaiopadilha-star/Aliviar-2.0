export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)]!;
}

export function successRate(successes: number, total: number): number {
  if (total === 0) {
    return 1;
  }
  return Math.round((successes / total) * 1000) / 1000;
}

export function todayDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
