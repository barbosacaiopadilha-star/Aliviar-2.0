import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
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

describe("perfil do paciente — RLS e repositório (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  it("perfil do paciente não existe até o primeiro salvamento (inicialização preguiçosa)", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const {
      data: { user },
    } = await client.auth.getUser();

    // Garante estado limpo antes do teste (idempotente entre execuções).
    await client.from("patient_profiles").delete().eq("profile_id", user!.id);

    const { data, error } = await client
      .from("patient_profiles")
      .select("*")
      .eq("profile_id", user!.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();

    await client.auth.signOut();
  });

  it("paciente cria (upsert) e depois visualiza o próprio perfil", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error: upsertError } = await client
      .from("patient_profiles")
      .upsert({ profile_id: user!.id, city: "Curitiba", state: "PR" }, { onConflict: "profile_id" });

    expect(upsertError).toBeNull();

    const { data, error } = await client
      .from("patient_profiles")
      .select("*")
      .eq("profile_id", user!.id)
      .single();

    expect(error).toBeNull();
    expect(data?.city).toBe("Curitiba");
    expect(data?.state).toBe("PR");
    expect(data?.status).toBe("ativo");

    await client.auth.signOut();
  });

  it("paciente atualiza o próprio perfil", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const {
      data: { user },
    } = await client.auth.getUser();

    await client
      .from("patient_profiles")
      .upsert({ profile_id: user!.id, phone: "+55 11 90000-0000" }, { onConflict: "profile_id" });

    const { data, error } = await client
      .from("patient_profiles")
      .select("phone")
      .eq("profile_id", user!.id)
      .single();

    expect(error).toBeNull();
    expect(data?.phone).toBe("+55 11 90000-0000");

    await client.auth.signOut();
  });

  it("paciente não acessa perfil de outra pessoa (RLS filtra silenciosamente)", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const administrador = accounts.find((a) => a.role === "administrador")!;

    const adminClient = createClient(url, anonKey);
    await adminClient.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user: adminUser },
    } = await adminClient.auth.getUser();
    await adminClient.auth.signOut();

    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const { data, error } = await client
      .from("patient_profiles")
      .select("*")
      .eq("profile_id", adminUser!.id)
      .maybeSingle();

    // RLS nunca retorna erro para uma linha inacessível — apenas nenhuma linha.
    expect(error).toBeNull();
    expect(data).toBeNull();

    await client.auth.signOut();
  });

  it("uma conta sem o papel 'paciente' não consegue criar uma linha em patient_profiles para si mesma", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client
      .from("patient_profiles")
      .insert({ profile_id: user!.id, city: "Teste" });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });
});
