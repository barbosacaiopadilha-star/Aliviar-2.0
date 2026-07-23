import { describe, expect, it } from "vitest";

import {
  InMemoryAuthProvider,
  InMemoryJourneyScopePort,
  InMemoryJwtAuthProvider,
  InMemoryMagicLinkAuthProvider,
} from "../infrastructure/in-memory-auth-provider";
import { createAuthorizationService, resolveSessionContext } from "../session/resolve-session-context";

const CATALOG = [
  { id: "j-1", patientId: "p-1", assignedCuratorId: "cur-1", teamId: "team-a" },
];

describe("resolveSessionContext (I02)", () => {
  it("resolve usu├írio, papel, escopo e permiss├Áes", async () => {
    const auth = new InMemoryAuthProvider();
    auth.register({
      id: "cur-1",
      email: "curador@aliviar.health",
      identity: {
        userId: "cur-1",
        role: "CURATOR",
        isActive: true,
        staffProfileId: "cur-1",
      },
    });
    auth.signIn("cur-1");

    const context = await resolveSessionContext({
      authProvider: auth,
      journeyScopePort: new InMemoryJourneyScopePort(CATALOG),
    });

    expect(context.actor?.role).toBe("CURATOR");
    expect(context.permissions).toContain("delivery.publish");
    expect(context.journeyScope.type).toBe("assigned");
  });

  it("sess├úo ausente retorna contexto vazio", async () => {
    const auth = new InMemoryAuthProvider();
    const context = await resolveSessionContext({ authProvider: auth });
    expect(context.actor).toBeNull();
    expect(context.journeyScope.type).toBe("none");
  });

  it("createAuthorizationService centraliza autoriza├º├úo", async () => {
    const auth = new InMemoryAuthProvider();
    auth.register({
      id: "op-1",
      email: "op@aliviar.health",
      identity: {
        userId: "op-1",
        role: "OPERATION",
        isActive: true,
        staffProfileId: "op-1",
      },
    });
    auth.signIn("op-1");

    const context = await resolveSessionContext({
      authProvider: auth,
      journeyScopePort: new InMemoryJourneyScopePort(CATALOG),
    });

    const authorization = createAuthorizationService(context);
    expect(authorization.authorize("curator.assign").ok).toBe(true);
    expect(authorization.canAccessJourney(CATALOG[0]!).ok).toBe(true);
  });
});

describe("auth provider ports (I06)", () => {
  it("MagicLink provider exp├Áe provider magic_link", () => {
    const provider = new InMemoryMagicLinkAuthProvider();
    expect(provider.provider).toBe("magic_link");
  });

  it("JWT provider resolve sess├úo por token", async () => {
    const provider = new InMemoryJwtAuthProvider();
    provider.register({
      id: "jwt-user",
      email: "jwt@test.com",
      identity: {
        userId: "jwt-user",
        role: "ADMIN",
        isActive: true,
        staffProfileId: "jwt-user",
      },
    });

    const session = await provider.verifyToken("jwt-user");
    expect(session.status).toBe("authenticated");
    expect(session.provider).toBe("jwt");
  });
});
