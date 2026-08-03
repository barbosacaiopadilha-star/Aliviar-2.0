import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { loadDashboardSource } from "@/modules/admin/dashboard-repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * FONTE REAL DO PAINEL EXECUTIVO — Release Gate 4, Parte 1.
 *
 * A lacuna que este arquivo fecha: `dashboard-metrics` sempre teve teste (a
 * matemática, com linhas construídas à mão), mas `loadDashboardSource` — a
 * LEITURA — não tinha nenhum. Foi por essa fresta que o 42501 de
 * `case_responsibility_changes` atravessou todas as suítes: o `safe()`
 * degradava para `null`, a tela dizia "Informação indisponível", e nenhum
 * oráculo olhava nem para o `null` nem para o log.
 *
 * O contrato provado aqui, contra o banco real e sessão real de administrador:
 *
 *  - As SEIS fontes lidas do banco (leads, cases, tasks, appointments,
 *    patients, team) não podem ser `null`. No desenho do repositório, `null`
 *    significa exatamente "falha de leitura" (acesso, privilégio, banco) —
 *    nunca "não há dados". Vazio legítimo é `[]`: a distinção falha×vazio É
 *    o contrato.
 *  - `pendingDocuments` é `null` POR DESENHO, declarado no repositório: não
 *    existe no domínio a noção de "documento pendente", e derivar um número
 *    seria inventar — o painel mostra "indisponível" com razão. Este teste
 *    fixa o contrato dos dois lados: se um dia o campo passar a vir
 *    preenchido, é sinal de que a pendência nasceu no domínio e este arquivo
 *    deve ser revisado junto.
 *  - Nenhum `registrarErro` pode disparar durante a carga. Isso cobre também
 *    a consulta de handoffs (`case_responsibility_changes`), que não aparece
 *    no shape de retorno — ela se dissolve em `handedToConciergeAt` dentro de
 *    `cases`, e só o log denuncia a falha dela (SQLSTATE 42501 incluso).
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

describe("loadDashboardSource — a leitura real, sob sessão real (Release Gate 4)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("administrador carrega as sete fontes sem NENHUM null e sem NENHUM erro estruturado", async () => {
    const admin = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    const { error: loginError } = await client.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    expect(loginError).toBeNull();

    // O espião no canal do registrarErro: qualquer falha de fonte — inclusive
    // a de handoffs, invisível no shape — grava um JSON com nivel:"error".
    const errosEstruturados: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      const texto = args.map(String).join(" ");
      if (texto.includes('"nivel":"error"')) errosEstruturados.push(texto);
    });

    const source = await loadDashboardSource(client);

    // null = "não conseguimos ler" — proibido para TODAS as fontes sob o
    // administrador num banco montado pelas migrations. Vazio legítimo é [].
    expect(source.leads, "leads (crm_contacts) veio null — falha de leitura").not.toBeNull();
    expect(source.cases, "cases veio null — falha de leitura").not.toBeNull();
    expect(source.tasks, "tasks (crm_tasks) veio null — falha de leitura").not.toBeNull();
    expect(
      source.appointments,
      "appointments (crm_appointments) veio null — falha de leitura",
    ).not.toBeNull();
    expect(source.patients, "patients veio null — falha de leitura").not.toBeNull();
    expect(source.team, "team (user_roles) veio null — falha de leitura").not.toBeNull();

    // Falha nunca se disfarça de vazio: o tipo do vazio é array.
    for (const campo of ["leads", "cases", "tasks", "appointments", "patients", "team"] as const) {
      expect(Array.isArray(source[campo]), `${campo} deveria ser array`).toBe(true);
    }

    // O único null LEGÍTIMO do painel — por desenho, não por falha (ver
    // dashboard-repository: "não existe no banco a noção de 'faltando'").
    expect(source.pendingDocuments).toBeNull();

    // E o log, limpo — é aqui que a consulta de handoffs presta contas. Um
    // 42501 em case_responsibility_changes reapareceria EXATAMENTE nesta
    // lista, com escopo admin.dashboard.handoffs.
    expect(
      errosEstruturados,
      `registrarErro disparou durante a carga:\n${errosEstruturados.join("\n")}`,
    ).toEqual([]);
  });
});
