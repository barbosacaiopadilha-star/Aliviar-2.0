import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { grantRole, listTeamMembers, revokeRole } from "@/modules/team/repository";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não existe. Rode `npm run bootstrap:test-users` antes dos testes de integração.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function uniqueEmail(): string {
  return `equipe-teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("gestão de papéis internos (SPRINT OPERACIONAL 1, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  it("administrador concede e revoga o papel curador_medico; a listagem reflete o estado atual", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminAuthClient = createCuradoriaClient(url, anonKey);
    await adminAuthClient.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user: adminUser },
    } = await adminAuthClient.auth.getUser();

    const adminClient = createAdminSupabaseClient();
    const email = uniqueEmail();
    const created = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email, displayName: "Pessoa Para Curadoria" },
      adminUser!.id,
    );

    await grantRole(adminAuthClient, created.profileId, "curador_medico", adminUser!.id);

    let members = await listTeamMembers(adminAuthClient, adminClient);
    let target = members.find((m) => m.profileId === created.profileId);
    expect(target?.roles).toContain("curador_medico");

    await revokeRole(adminAuthClient, created.profileId, "curador_medico");

    members = await listTeamMembers(adminAuthClient, adminClient);
    target = members.find((m) => m.profileId === created.profileId);
    expect(target?.roles ?? []).not.toContain("curador_medico");

    await adminAuthClient.auth.signOut();
  });

  it("uma conta sem papel administrador não consegue conceder papel algum (RLS)", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    await expect(grantRole(client, user!.id, "curador_medico", user!.id)).rejects.toThrow();

    await client.auth.signOut();
  });
});
