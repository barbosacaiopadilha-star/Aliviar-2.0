import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  createPatientAccount,
  getPatientAccount,
  listPatientAccounts,
  resetPatientPassword,
  setPatientAccountAccess,
} from "@/modules/profiles/patient-account-repository";

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
  return `paciente-teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

// Estes testes exercitam o repositório real (o mesmo código que as Server
// Actions chamam), usando a service role key — nunca a senha é impressa,
// nunca é persistida por este teste; existe só na variável local enquanto
// o teste roda.
describe("criação e gestão administrativa de conta de paciente (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY ausente — rode `npm run supabase:env` (script atualizado nesta sprint)",
    ).toBeTruthy();
    accounts = loadTestAccounts();
  });

  it("administrador (via repositório) cria paciente com senha de alta entropia, nunca em texto puro no banco", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminAuthClient = createClient(url, anonKey);
    await adminAuthClient.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user: adminUser },
    } = await adminAuthClient.auth.getUser();

    const adminClient = createAdminSupabaseClient();
    const email = uniqueEmail();

    const result = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email, displayName: "Paciente Criado em Teste" },
      adminUser!.id,
    );

    expect(result.email).toBe(email);
    expect(result.password.length).toBeGreaterThanOrEqual(20);

    // Confirma que o login funciona com a senha gerada — prova que ela foi
    // realmente definida no Auth, sem depender de inspecionar o banco.
    const patientClient = createClient(url, anonKey);
    const { error: signInError } = await patientClient.auth.signInWithPassword({
      email,
      password: result.password,
    });
    expect(signInError).toBeNull();

    // O papel "paciente" foi concedido.
    const { data: roleRows } = await patientClient.from("user_roles").select("roles(slug)");
    const slugs = (roleRows ?? []).flatMap((row) => {
      const roles = row.roles as { slug: string } | { slug: string }[] | null;
      return Array.isArray(roles) ? roles.map((r) => r.slug) : roles ? [roles.slug] : [];
    });
    expect(slugs).toContain("paciente");

    await patientClient.auth.signOut();
    await adminAuthClient.auth.signOut();
  });

  it("uma conta sem o papel administrador não consegue conceder o papel paciente (defesa em profundidade da RLS)", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const { data: roleRow } = await client.from("roles").select("id").eq("slug", "paciente").single();
    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client
      .from("user_roles")
      .insert({ profile_id: user!.id, role_id: roleRow!.id });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("redefinição de senha gera uma nova senha e invalida a anterior", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminAuthClient = createClient(url, anonKey);
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
      { email, displayName: "Paciente Para Redefinir Senha" },
      adminUser!.id,
    );

    const newPassword = await resetPatientPassword(adminClient, created.profileId);
    expect(newPassword).not.toBe(created.password);

    const oldPasswordClient = createClient(url, anonKey);
    const { error: oldPasswordError } = await oldPasswordClient.auth.signInWithPassword({
      email,
      password: created.password,
    });
    expect(oldPasswordError).not.toBeNull();

    const newPasswordClient = createClient(url, anonKey);
    const { error: newPasswordError } = await newPasswordClient.auth.signInWithPassword({
      email,
      password: newPassword,
    });
    expect(newPasswordError).toBeNull();

    await newPasswordClient.auth.signOut();
    await adminAuthClient.auth.signOut();
  });

  it("desativar acesso bloqueia o login; ativar o restaura", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminAuthClient = createClient(url, anonKey);
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
      { email, displayName: "Paciente Para Desativar" },
      adminUser!.id,
    );

    await setPatientAccountAccess(adminClient, created.profileId, false);

    const blockedClient = createClient(url, anonKey);
    const { error: blockedError } = await blockedClient.auth.signInWithPassword({
      email,
      password: created.password,
    });
    expect(blockedError).not.toBeNull();

    await setPatientAccountAccess(adminClient, created.profileId, true);

    const restoredClient = createClient(url, anonKey);
    const { error: restoredError } = await restoredClient.auth.signInWithPassword({
      email,
      password: created.password,
    });
    expect(restoredError).toBeNull();

    await restoredClient.auth.signOut();
    await adminAuthClient.auth.signOut();
  });

  it("listPatientAccounts e getPatientAccount refletem o mesmo estado", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminAuthClient = createClient(url, anonKey);
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
      { email, displayName: "Paciente Para Listar" },
      adminUser!.id,
    );

    const list = await listPatientAccounts(adminAuthClient, adminClient);
    expect(list.some((p) => p.profileId === created.profileId)).toBe(true);

    const single = await getPatientAccount(adminAuthClient, adminClient, created.profileId);
    expect(single?.email).toBe(email);
    expect(single?.accountStatus).toBe("ativo");

    await adminAuthClient.auth.signOut();
  });
});
