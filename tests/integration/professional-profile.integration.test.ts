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

function uniqueIdentifier(): string {
  return `TESTE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("perfil profissional — RLS e fundação administrativa (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  it("paciente (usuário comum) não consegue criar perfil profissional", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa de autocadastro",
      professional_identifier: uniqueIdentifier(),
      created_by: user!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("profissional (mesmo autenticado) não consegue criar o próprio perfil profissional", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa de autocadastro",
      professional_identifier: uniqueIdentifier(),
      created_by: user!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("administrador cria perfil profissional", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { data, error } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Profissional de Teste",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("ativo");
    expect(data?.publication_status).toBe("nao_publicado");
    expect(data?.created_by).toBe(user!.id);

    await client.auth.signOut();
  });

  it("administrador edita perfil profissional", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { data: created } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Antes da edição",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
      })
      .select("id")
      .single();

    const { data: updated, error } = await client
      .from("professional_profiles")
      .update({ display_name: "Depois da edição", updated_by: user!.id })
      .eq("id", created!.id)
      .select("display_name")
      .single();

    expect(error).toBeNull();
    expect(updated?.display_name).toBe("Depois da edição");

    await client.auth.signOut();
  });

  it("administrador ativa/desativa publicação", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { data: created } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Para Publicar",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
      })
      .select("id")
      .single();

    const { data: published, error: publishError } = await client
      .from("professional_profiles")
      .update({ publication_status: "publicado", updated_by: user!.id })
      .eq("id", created!.id)
      .select("publication_status")
      .single();

    expect(publishError).toBeNull();
    expect(published?.publication_status).toBe("publicado");

    const { data: deactivated, error: statusError } = await client
      .from("professional_profiles")
      .update({ status: "inativo", updated_by: user!.id })
      .eq("id", created!.id)
      .select("status")
      .single();

    expect(statusError).toBeNull();
    expect(deactivated?.status).toBe("inativo");

    await client.auth.signOut();
  });

  it("profissional autenticado, ainda sem vínculo, não vê nenhum registro profissional", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const { data, error } = await client.from("professional_profiles").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([]);

    await client.auth.signOut();
  });

  it("administrador não consegue atribuir created_by a outra pessoa (defesa em profundidade da RLS)", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const paciente = accounts.find((a) => a.role === "paciente")!;

    const pacienteClient = createClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({
      email: paciente.email,
      password: paciente.password,
    });
    const {
      data: { user: pacienteUser },
    } = await pacienteClient.auth.getUser();
    await pacienteClient.auth.signOut();

    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa inválida",
      professional_identifier: uniqueIdentifier(),
      created_by: pacienteUser!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });
});
