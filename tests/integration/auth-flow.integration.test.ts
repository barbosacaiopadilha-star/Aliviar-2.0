import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { beforeAll, describe, expect, it } from "vitest";

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

describe("fluxo de autenticação (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(
      anonKey,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`",
    ).toBeTruthy();
    accounts = loadTestAccounts();
  });

  // Contrato oficial de scripts/bootstrap-local-test-users.mjs — 4 contas
  // fixas, uma por papel, upsert idempotente por (profile_id, role_id).
  // curador_medico foi adicionado ao bootstrap no commit 45e6610 ("MVP
  // completo"), bem antes desta suíte — este teste só não acompanhava.
  const BOOTSTRAP_ROLES = ["administrador", "curador_medico", "paciente", "profissional"];

  it("existem exatamente as 4 contas de bootstrap, uma por papel, sem duplicidade", () => {
    const roles = accounts.map((a) => a.role);
    expect(roles.sort()).toEqual(BOOTSTRAP_ROLES);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it.each(BOOTSTRAP_ROLES)(
    "login funciona e resolve o papel correto para %s",
    async (role) => {
      const account = accounts.find((a) => a.role === role);
      expect(account).toBeDefined();

      const client = createCuradoriaClient(url, anonKey);

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email: account!.email,
        password: account!.password,
      });

      expect(signInError).toBeNull();
      expect(signInData.session).not.toBeNull();

      const { data: roleRows, error: roleError } = await client
        .from("user_roles")
        .select("roles(slug)");

      expect(roleError).toBeNull();
      const slugs = (roleRows ?? []).flatMap((row) => {
        const roles = row.roles as { slug: string } | { slug: string }[] | null;
        return Array.isArray(roles) ? roles.map((r) => r.slug) : roles ? [roles.slug] : [];
      });
      expect(slugs).toContain(role);

      await client.auth.signOut();
    },
  );

  it("login com senha incorreta falha", async () => {
    const account = accounts[0];
    const client = createCuradoriaClient(url, anonKey);

    const { error } = await client.auth.signInWithPassword({
      email: account.email,
      password: "senha-incorreta-de-proposito",
    });

    expect(error).not.toBeNull();
  });

  it("paciente autenticado não consegue se autoconceder o papel administrador", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createCuradoriaClient(url, anonKey);

    await client.auth.signInWithPassword({
      email: paciente.email,
      password: paciente.password,
    });

    const { data: adminRole } = await client
      .from("roles")
      .select("id")
      .eq("slug", "administrador")
      .single();
    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client
      .from("user_roles")
      .insert({ profile_id: user!.id, role_id: adminRole!.id });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("paciente autenticado não consegue ler audit_logs", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createCuradoriaClient(url, anonKey);

    await client.auth.signInWithPassword({
      email: paciente.email,
      password: paciente.password,
    });

    const { data, error } = await client.from("audit_logs").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([]);

    await client.auth.signOut();
  });
});
