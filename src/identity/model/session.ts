import type { User } from "./user";

export type SessionProvider = "supabase" | "magic_link" | "jwt";

export type SessionStatus = "authenticated" | "unauthenticated" | "invalid";

/** Sess├úo ativa ou ausente ÔÇö resultado do provedor de autentica├º├úo. */
export interface Session {
  status: SessionStatus;
  user: User | null;
  expiresAt: string | null;
  provider: SessionProvider;
  accessToken?: string | null;
}

export function unauthenticatedSession(provider: SessionProvider = "supabase"): Session {
  return { status: "unauthenticated", user: null, expiresAt: null, provider };
}

export function invalidSession(provider: SessionProvider = "supabase"): Session {
  return { status: "invalid", user: null, expiresAt: null, provider };
}

export function authenticatedSession(
  user: User,
  expiresAt: string | null,
  provider: SessionProvider,
  accessToken?: string | null,
): Session {
  return { status: "authenticated", user, expiresAt, provider, accessToken };
}

export function isAuthenticated(session: Session): boolean {
  return session.status === "authenticated" && session.user !== null;
}
