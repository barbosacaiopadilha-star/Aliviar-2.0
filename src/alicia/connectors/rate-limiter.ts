import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_BACKOFF_MAX_MS,
  DEFAULT_RATE_LIMIT_PER_HOUR,
  DEFAULT_RATE_LIMIT_PER_MINUTE,
} from "./constants";
import type { RateLimitConfig } from "./types";

type RateLimitState = {
  minuteWindowStart: number;
  hourWindowStart: number;
  minuteCount: number;
  hourCount: number;
};

function nowMs(): number {
  return Date.now();
}

export class RateLimiter {
  private readonly states = new Map<string, RateLimitState>();

  private getState(connectorId: string): RateLimitState {
    const existing = this.states.get(connectorId);
    if (existing) {
      return existing;
    }

    const created: RateLimitState = {
      minuteWindowStart: nowMs(),
      hourWindowStart: nowMs(),
      minuteCount: 0,
      hourCount: 0,
    };
    this.states.set(connectorId, created);
    return created;
  }

  private resetWindows(state: RateLimitState, current: number): void {
    if (current - state.minuteWindowStart >= 60_000) {
      state.minuteWindowStart = current;
      state.minuteCount = 0;
    }
    if (current - state.hourWindowStart >= 3_600_000) {
      state.hourWindowStart = current;
      state.hourCount = 0;
    }
  }

  canExecute(connectorId: string, config: RateLimitConfig): boolean {
    const state = this.getState(connectorId);
    const current = nowMs();
    this.resetWindows(state, current);
    return state.minuteCount < config.perMinute && state.hourCount < config.perHour;
  }

  recordExecution(connectorId: string): void {
    const state = this.getState(connectorId);
    const current = nowMs();
    this.resetWindows(state, current);
    state.minuteCount += 1;
    state.hourCount += 1;
  }

  computeBackoff(attempt: number, config: RateLimitConfig): number {
    const base = config.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    const max = config.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    const delay = Math.min(base * 2 ** Math.max(0, attempt - 1), max);
    return delay;
  }

  defaultConfig(): RateLimitConfig {
    return {
      perMinute: DEFAULT_RATE_LIMIT_PER_MINUTE,
      perHour: DEFAULT_RATE_LIMIT_PER_HOUR,
      maxRetries: 3,
      backoffBaseMs: DEFAULT_BACKOFF_BASE_MS,
      backoffMaxMs: DEFAULT_BACKOFF_MAX_MS,
    };
  }

  reset(connectorId?: string): void {
    if (connectorId) {
      this.states.delete(connectorId);
      return;
    }
    this.states.clear();
  }
}
