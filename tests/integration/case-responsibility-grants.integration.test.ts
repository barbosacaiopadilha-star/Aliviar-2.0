import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * GRANTS DE `case_responsibility_changes` — Release Gate 3.
 *
 * A tabela nasceu (Fase 2) com RLS e policies, mas sem GRANT — e no Postgres
 * privilégio de tabela é camada ANTERIOR à policy: sem ele, toda leitura de
 * cliente morre com 42501 antes de qualquer política rodar. O sintoma foi o
 * painel executivo do /admin quebrando em silêncio a cada visita, sem que
 * nenhuma suíte percebesse.
 *
 * O que se prova aqui, contra o banco montado pelas migrations (em CI, do
 * zero — a prova de que a migration 20260803130000 basta por si):
 *  - o administrador autenticado LÊ (o privilégio existe);
 *  - papel sem vínculo continua limitado pela policy (privilégio ≠ acesso);
 *  - INSERT direto de cliente continua IMPOSSÍVEL no nível de privilégio —
 *    a passagem de bastão é operação de servidor
 *    (curadoria.transfer_case_responsibility, security definer), e a policy
 *    de INSERT fica como defesa em profundidade, nunca como porta.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users`.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("case_responsibility_changes — privilégio e policy, cada um no seu degrau", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((entry) => entry.role === role);
    expect(account, `conta permanente "${role}" ausente`).toBeTruthy();
    const client = createCuradoriaClient(url, anonKey);
    const { error } = await client.auth.signInWithPassword({
      email: account!.email,
      password: account!.password,
    });
    expect(error).toBeNull();
    return client;
  }

  it("administrador autenticado lê o histórico — o SELECT existe no nível de privilégio", async () => {
    const admin = await loginAs("administrador");
    const { data, error } = await admin
      .from("case_responsibility_changes")
      .select("id, case_id, new_role")
      .limit(5);

    // Sem o GRANT, isto era 42501 ("permission denied") ANTES da policy —
    // exatamente o que derrubava o painel executivo do /admin.
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("papel sem vínculo com Case algum segue limitado pela policy — privilégio não é acesso", async () => {
    const paciente = await loginAs("paciente");
    const { data, error } = await paciente
      .from("case_responsibility_changes")
      .select("id")
      .limit(5);

    // O privilégio deixa a consulta ACONTECER; a policy decide o que ela vê.
    // A conta permanente de paciente nunca foi responsável por Case: zero
    // linhas, sem erro — RLS filtrando, não privilégio bloqueando.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("INSERT direto de cliente é recusado no privilégio — mesmo pelo administrador", async () => {
    const admin = await loginAs("administrador");
    const { error } = await admin.from("case_responsibility_changes").insert({
      case_id: "00000000-0000-0000-0000-000000000001",
      new_role: "concierge",
      new_responsible_id: "00000000-0000-0000-0000-000000000002",
      changed_by: "00000000-0000-0000-0000-000000000003",
    });

    // A policy de INSERT até aceitaria um administrador — mas o GRANT de
    // INSERT nunca foi (nem será) concedido a authenticated: o rastro só
    // nasce pela operação oficial, security definer. Se este teste um dia
    // encontrar `error === null`, alguém abriu a porta que o desenho fechou.
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/permission denied/i);
  });
});
