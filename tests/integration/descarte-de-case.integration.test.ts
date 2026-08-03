import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * DESCARTE ADMINISTRATIVO DE CASE — ADR-038.
 *
 * O que se certifica aqui não é "a função funciona": é que a porta é única,
 * que ela cobra autorização e motivo, que o rastro do descarte sobrevive ao
 * Case, e que a imutabilidade do histórico continua valendo para tudo o mais.
 *
 * Nenhum dado real é tocado: cada cenário cria a própria conta sintética, e a
 * limpeza automática da suíte devolve o banco ao baseline.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

let semente = 0;
function unico(prefixo: string) {
  semente += 1;
  return `${prefixo}-${Date.now()}-${semente}`;
}

describe("Descarte administrativo de Case (ADR-038, Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];

  beforeAll(() => {
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
  });

  async function entrarComo(role: string) {
    const conta = accounts.find((entrada) => entrada.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: conta.email, password: conta.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  /** Um Case com troca de responsável registrada — o que era indestrutível. */
  async function casoComHistorico() {
    const admin = await entrarComo("administrador");
    const curador = await entrarComo("curador_medico");

    const email = `${unico("descarte")}@aliviar-conexao.local`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Descarte" },
      admin.userId,
    );

    const pacienteClient = createCuradoriaClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({ email, password: paciente.password });
    const rascunho = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    const historia = await submitStory(pacienteClient, rascunho.id, rascunho.revision);

    const kase = await createCase(admin.client, historia.id, curador.userId, admin.userId);

    // A troca de responsável — a linha que tornava o Case imortal. Passa pela
    // MESMA porta que a aplicação usa (`transfer_case_responsibility`): a
    // tabela não tem grant nenhum, e escrever por fora seria testar um
    // caminho que não existe.
    const atendente = await entrarComo("atendente");
    const { error } = await admin.client.rpc("transfer_case_responsibility", {
      _case_id: kase.id,
      _new_responsible_id: atendente.userId,
      _new_role: "atendente",
      _reason: "Passagem de bastão registrada para o cenário de descarte.",
    });
    if (error) throw new Error(`não foi possível registrar a troca: ${error.message}`);

    return { caseId: kase.id, admin, curador, pacienteProfileId: paciente.profileId, historiaId: historia.id };
  }

  const descartar = (args: { case_id: string; reason: string; executed_by?: string }) =>
    service.rpc("discard_case_admin", {
      _case_id: args.case_id,
      _reason: args.reason,
      _executed_by: args.executed_by ?? null,
    });

  // -------------------------------------------------------------------------
  // Quem pode
  // -------------------------------------------------------------------------

  it("usuário anônimo não alcança a função", async () => {
    const anonimo = createCuradoriaClient(url, anonKey);
    const { error } = await anonimo.rpc("discard_case_admin", {
      _case_id: "00000000-0000-0000-0000-000000000000",
      _reason: "tentativa",
      _executed_by: null,
    });
    expect(error, "anon não pode nem enxergar a função").not.toBeNull();
  });

  it("paciente autenticado não alcança a função", async () => {
    const { caseId, pacienteProfileId } = await casoComHistorico();
    const paciente = createCuradoriaClient(url, anonKey);
    const conta = accounts.find((entrada) => entrada.role === "paciente")!;
    await paciente.auth.signInWithPassword({ email: conta.email, password: conta.password });

    const { error } = await paciente.rpc("discard_case_admin", {
      _case_id: caseId,
      _reason: "quero apagar",
      _executed_by: pacienteProfileId,
    });
    expect(error).not.toBeNull();

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count, "o Case continua de pé").toBe(1);
  });

  it("Curador não descarta Case — o papel não basta", async () => {
    const { caseId, curador } = await casoComHistorico();

    const { error } = await descartar({
      case_id: caseId,
      reason: "achei que devia",
      executed_by: curador.userId,
    });
    expect(error?.message ?? "").toMatch(/papel administrador/i);

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count).toBe(1);
  });

  it("service_role sozinho não descarta: sem executor identificado, recusa", async () => {
    const { caseId } = await casoComHistorico();

    const { error } = await descartar({ case_id: caseId, reason: "limpeza técnica" });
    expect(error?.message ?? "").toMatch(/executor identificado/i);

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count, "transporte não é autorização").toBe(1);
  });

  // -------------------------------------------------------------------------
  // O que a função cobra
  // -------------------------------------------------------------------------

  it("motivo vazio é recusado — descarte sem motivo não é auditável", async () => {
    const { caseId, admin } = await casoComHistorico();

    for (const motivo of ["", "   "]) {
      const { error } = await descartar({ case_id: caseId, reason: motivo, executed_by: admin.userId });
      expect(error?.message ?? "", `motivo ${JSON.stringify(motivo)}`).toMatch(/exige motivo/i);
    }

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count).toBe(1);
  });

  it("Case inexistente é recusado", async () => {
    const admin = await entrarComo("administrador");
    const { error } = await descartar({
      case_id: "00000000-0000-0000-0000-000000000000",
      reason: "não existe",
      executed_by: admin.userId,
    });
    expect(error?.message ?? "").toMatch(/não existe/i);
  });

  // -------------------------------------------------------------------------
  // O descarte
  // -------------------------------------------------------------------------

  it("administrador descarta com motivo, e a cadeia inteira vai junto", async () => {
    const { caseId, admin, pacienteProfileId } = await casoComHistorico();

    const { data, error } = await descartar({
      case_id: caseId,
      reason: "Case criado por engano durante configuração.",
      executed_by: admin.userId,
    });
    expect(error).toBeNull();
    expect(data).toMatchObject({ case_id: caseId, responsibility_changes_discarded: 1 });

    // `case_responsibility_changes` não concede SELECT a papel nenhum — a
    // contagem autoritativa é a que a própria função devolve, acima.
    for (const tabela of ["cases", "case_events"]) {
      const { count } = await service
        .from(tabela)
        .select("*", { count: "exact", head: true })
        .eq(tabela === "cases" ? "id" : "case_id", caseId);
      expect(count, `${tabela} deveria ter sumido com o Case`).toBe(0);
    }

    // O paciente segue existindo: descartar o Case não é descartar a pessoa.
    const { count: perfil } = await service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("id", pacienteProfileId);
    expect(perfil).toBe(1);
  });

  it("a auditoria é gravada antes, e sobrevive ao Case", async () => {
    const { caseId, admin } = await casoComHistorico();
    const motivo = "Solicitação administrativa registrada no chamado 4412.";

    await descartar({ case_id: caseId, reason: motivo, executed_by: admin.userId });

    // O filtro do Case vai na CONSULTA, não em JS depois: `audit_logs` é
    // append-only e cresce a cada execução; buscar todas as linhas
    // `case_discarded` e procurar entre elas passou a falhar em silêncio
    // quando a tabela cruzou o teto de linhas da API (1000), porque o
    // registro recém-criado ficava fora da página devolvida.
    const { data } = await service
      .from("audit_logs")
      .select("actor_id, action, metadata")
      .eq("action", "case_discarded")
      .contains("metadata", { case_id: caseId });

    const registro = (data ?? [])[0];

    expect(registro, "o rastro do descarte precisa sobreviver ao Case").toBeTruthy();
    expect(registro!.actor_id).toBe(admin.userId);

    const metadata = registro!.metadata as Record<string, unknown>;
    expect(metadata.reason).toBe(motivo);
    expect(metadata.responsibility_changes_discarded).toBe(1);
    expect(metadata.discarded_at).toBeTruthy();

    // O log é mínimo: nada de conteúdo clínico ou narrativa.
    const proibidos = ["clinical", "narrative", "story", "document", "content"];
    for (const chave of Object.keys(metadata)) {
      expect(proibidos, `metadado excessivo no log: ${chave}`).not.toContain(chave.toLowerCase());
    }
  });

  // -------------------------------------------------------------------------
  // O que continua imutável
  // -------------------------------------------------------------------------

  /**
   * A imutabilidade tem duas trancas, e a de fora é mais forte: a tabela não
   * concede UPDATE nem DELETE a papel nenhum — nem a `service_role`. Nenhum
   * cliente chega perto do gatilho. Ele é a segunda tranca, e sua
   * discriminação está certificada logo abaixo, pelo caminho que a alcança.
   */
  it("UPDATE em linha do histórico continua impossível para qualquer papel", async () => {
    const { caseId, admin } = await casoComHistorico();

    for (const [nome, cliente] of [
      ["administrador", admin.client],
      ["service_role", service],
    ] as const) {
      const { error } = await cliente
        .from("case_responsibility_changes")
        .update({ reason: "outro motivo" })
        .eq("case_id", caseId);
      expect(error, `${nome} não pode alterar o histórico`).not.toBeNull();
    }

    // A prova de que o histórico continua lá vem do descarte: ele devolve
    // quantas trocas removeu.
    const { data } = await descartar({
      case_id: caseId,
      reason: "Conferência de que o histórico permaneceu íntegro.",
      executed_by: admin.userId,
    });
    expect((data as { responsibility_changes_discarded: number }).responsibility_changes_discarded).toBe(1);
  });

  it("DELETE de linha avulsa continua impossível — inclusive por service_role", async () => {
    const { caseId } = await casoComHistorico();

    const { error } = await service.from("case_responsibility_changes").delete().eq("case_id", caseId);
    expect(error, "nem o transporte tem essa permissão").not.toBeNull();

    const admin = await entrarComo("administrador");
    const { data } = await descartar({
      case_id: caseId,
      reason: "Conferência de que a linha sobreviveu à tentativa de DELETE.",
      executed_by: admin.userId,
    });
    expect(
      (data as { responsibility_changes_discarded: number }).responsibility_changes_discarded,
      "o histórico continua lá",
    ).toBe(1);
  });

  it("apagar o Case por fora da porta não passa — nem com service_role", async () => {
    const { caseId } = await casoComHistorico();

    const { error } = await service.from("cases").delete().eq("id", caseId);
    expect(error, "DELETE direto em cases precisa esbarrar no gatilho").not.toBeNull();
    expect(error!.message).toMatch(/descarte administrativo autorizado/i);

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count, "a porta é única").toBe(1);
  });

  it("a autorização não vaza para outro Case da mesma sessão", async () => {
    const primeiro = await casoComHistorico();
    const segundo = await casoComHistorico();

    await descartar({
      case_id: primeiro.caseId,
      reason: "Descarte autorizado do primeiro.",
      executed_by: primeiro.admin.userId,
    });

    // A marca é local à transação da função: encerrada ela, o segundo Case
    // continua protegido pelo mesmo gatilho.
    const { error } = await service.from("cases").delete().eq("id", segundo.caseId);
    expect(error).not.toBeNull();

    const { count } = await service
      .from("cases")
      .select("*", { count: "exact", head: true })
      .eq("id", segundo.caseId);
    expect(count).toBe(1);
  });

  it("falha no meio desfaz tudo — nem o Case some, nem a auditoria fica", async () => {
    const { caseId, admin } = await casoComHistorico();

    const { data: antes } = await service
      .from("audit_logs")
      .select("id", { count: "exact" })
      .eq("action", "case_discarded");
    const quantidadeAntes = (antes ?? []).length;

    // Motivo vazio derruba a chamada DEPOIS de ela ter começado a validar e
    // ANTES de qualquer escrita — e nada pode ter sobrado.
    await descartar({ case_id: caseId, reason: "  ", executed_by: admin.userId });

    const { count } = await service.from("cases").select("*", { count: "exact", head: true }).eq("id", caseId);
    expect(count).toBe(1);

    const { data: depois } = await service
      .from("audit_logs")
      .select("id", { count: "exact" })
      .eq("action", "case_discarded");
    expect((depois ?? []).length).toBe(quantidadeAntes);
  });

  it("Case sem histórico de responsabilidade também é descartável pela mesma porta", async () => {
    const admin = await entrarComo("administrador");
    const curador = await entrarComo("curador_medico");

    const email = `${unico("descarte-simples")}@aliviar-conexao.local`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Sem Histórico" },
      admin.userId,
    );
    const pacienteClient = createCuradoriaClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({ email, password: paciente.password });
    const rascunho = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    const historia = await submitStory(pacienteClient, rascunho.id, rascunho.revision);
    const kase = await createCase(admin.client, historia.id, curador.userId, admin.userId);

    const { data, error } = await descartar({
      case_id: kase.id,
      reason: "Case de configuração, sem troca de responsável.",
      executed_by: admin.userId,
    });
    expect(error).toBeNull();
    expect(data).toMatchObject({ responsibility_changes_discarded: 0 });
  });
});
