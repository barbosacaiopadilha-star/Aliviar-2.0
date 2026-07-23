import type { Session } from "../model/session";
import type { Identity } from "../model/identity";

/** Provedor de autentica├º├úo ÔÇö adapt├ível a Supabase, Magic Link ou JWT. */
export interface AuthProviderPort {
  readonly provider: "supabase" | "magic_link" | "jwt";
  resolveSession(): Promise<Session>;
  resolveIdentity(session: Session): Promise<Identity | null>;
}

export interface SupabaseAuthPort extends AuthProviderPort {
  readonly provider: "supabase";
}

export interface MagicLinkAuthPort extends AuthProviderPort {
  readonly provider: "magic_link";
  sendMagicLink(email: string): Promise<{ ok: boolean }>;
}

export interface JwtAuthPort extends AuthProviderPort {
  readonly provider: "jwt";
  verifyToken(token: string): Promise<Session>;
}
