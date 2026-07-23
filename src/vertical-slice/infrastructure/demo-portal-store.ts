import type { PublicToPortalFlowResult } from "../services/run-public-to-portal-flow";

export interface DemoPortalSession {
  userId: string;
  flow: PublicToPortalFlowResult;
}

const sessions = new Map<string, DemoPortalSession>();

export function seedDemoPortalSession(session: DemoPortalSession): void {
  sessions.set(session.userId, session);
}

export function getDemoPortalSession(userId: string): DemoPortalSession | null {
  return sessions.get(userId) ?? null;
}

export function clearDemoPortalSessions(): void {
  sessions.clear();
}
