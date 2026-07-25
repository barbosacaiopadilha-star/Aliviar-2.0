import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { listAvailableCases } from "@/modules/curadoria/cos/repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * O CURADOR VÊ QUEM ATENDE, E ASSUME O QUE ESTÁ PARADO.
 *
 * @metodo Correção de Domínio §3 — o responsável muda, o Case não
 * @metodo Fundamentos §5 — nenhum paciente espera sem que alguém saiba
 *
 * Dois achados do teste em produção viraram estas regras. O que importa provar
 * aqui não é só que funciona: é que continua **impossível** pegar o caso de
 * outra pessoa ou atribuir um caso a um colega.
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

function uniqueEmail(): string {
  return `assume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("Curadorias disponíveis e autoassunção", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((entry) => entry.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  /** Um Case aberto e deixado sem responsável e sem curador atribuído. */
  async function createUnclaimedCase(patientName: string) {
    const admin = await loginAs("administrador");
    const service = createAdminSupabaseClient();
    const email = uniqueEmail();

    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: patientName },
      admin.userId,
    );

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: paciente.password });
    const draft = await getOrCreateActiveStory(patientClient, paciente.profileId);
    const story = await submitStory(patientClient, draft.id, draft.revision);

    const kase = await createCase(admin.client, story.id, undefined, admin.userId);

    // Garante o estado "de ninguém" — é o que a fila procura.
    await service
      .from("cases")
      .update({ assigned_curator_id: null, responsible_id: null, responsible_role: null })
      .eq("id", kase.id);

    return { caseId: kase.id, patientProfileId: paciente.profileId, patientName };
  }

  it("o Curador alcança o Case sem dono, e a fila traz o nome da pessoa", async () => {
    const nome = `Paciente Sem Dono ${Date.now()}`;
    const { caseId } = await createUnclaimedCase(nome);
    const curador = await loginAs("curador_medico");

    // A RLS alcança o Case específico — asserção independente da janela da
    // fila, que mostra os mais antigos primeiro e tem limite.
    const { data: alcancado } = await curador.client
      .from("cases")
      .select("id")
      .eq("id", caseId);
    expect(alcancado ?? [], "o Case sem dono precisa ser visível ao Curador").toHaveLength(1);

    // E a fila traz nome de gente, não o rótulo genérico. Este é o achado que
    // originou a mudança: aparecia "Paciente" no lugar do nome.
    const disponiveis = await listAvailableCases(curador.client);
    expect(disponiveis.length).toBeGreaterThan(0);
    expect(disponiveis.every((entry) => entry.waitingDays >= 0)).toBe(true);
    expect(
      disponiveis.some((entry) => entry.patientName !== "Paciente"),
      "a fila precisa resolver o nome real de quem espera",
    ).toBe(true);
  }, 60_000);

  it("o Curador assume para si, e o Case sai da fila de disponíveis", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Assumido ${Date.now()}`);
    const curador = await loginAs("curador_medico");

    const { error } = await curador.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: caseId,
      _new_responsible_id: curador.userId,
      _new_role: "curador_medico",
      _reason: "Tenho disponibilidade esta semana.",
    });
    expect(error, "o Curador precisa conseguir assumir um Case livre").toBeNull();

    const service = createAdminSupabaseClient();
    const { data } = await service
      .from("cases")
      .select("responsible_id, responsible_role, assigned_curator_id")
      .eq("id", caseId)
      .single();

    expect(data!.responsible_id).toBe(curador.userId);
    expect(data!.responsible_role).toBe("curador_medico");
    // Sem isto o Case ficaria "com ele" sem aparecer no portal dele.
    expect(data!.assigned_curator_id).toBe(curador.userId);

    const depois = await listAvailableCases(curador.client);
    expect(depois.some((entry) => entry.caseId === caseId)).toBe(false);

    // A auditoria não é lida aqui de propósito: `case_responsibility_changes`
    // nega SELECT até ao service role. Ela só é escrita pela própria função,
    // que roda como dono — ninguém a alcança por fora, nem para ler. Que a
    // gravação aconteceu está garantido pela transação: se o insert da
    // auditoria falhasse, o Case não teria se movido, e as três asserções
    // acima falhariam.
  }, 60_000);

  it("assumir sem motivo é recusado — a auditoria não aceita silêncio", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Sem Motivo ${Date.now()}`);
    const curador = await loginAs("curador_medico");

    const { error } = await curador.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: caseId,
      _new_responsible_id: curador.userId,
      _new_role: "curador_medico",
      _reason: "   ",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain("Motivo");
  }, 60_000);

  it("um Curador NÃO atribui um Case livre a outra pessoa", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Alheio ${Date.now()}`);
    const curador = await loginAs("curador_medico");
    const admin = await loginAs("administrador");

    // Tenta empurrar o Case para o administrador em vez de assumir.
    const { error } = await curador.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: caseId,
      _new_responsible_id: admin.userId,
      _new_role: "curador_medico",
      _reason: "Passando para outra pessoa.",
    });
    expect(error, "só a autoassunção é permitida").not.toBeNull();
  }, 60_000);

  it("um Curador NÃO toma o Case que já é de outro Curador", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Já Assumido ${Date.now()}`);
    const curadorA = await loginAs("curador_medico");
    const service = createAdminSupabaseClient();

    // Um segundo Curador de verdade. A escrita direta em `cases` é barrada
    // pelo trigger `cases_responsibility_guard` — a única forma de um Case
    // ganhar dono é a própria função, e é bom que seja assim.
    const outro = await loginAs("concierge");
    const { data: papel } = await service.from("roles").select("id").eq("slug", "curador_medico").single();
    await service
      .from("user_roles")
      .upsert(
        { profile_id: outro.userId, role_id: papel!.id },
        { onConflict: "profile_id,role_id" },
      );

    // Curador A assume legitimamente.
    const { error: assuncao } = await curadorA.client
      .schema("curadoria")
      .rpc("transfer_case_responsibility", {
        _case_id: caseId,
        _new_responsible_id: curadorA.userId,
        _new_role: "curador_medico",
        _reason: "Assumindo para conduzir.",
      });
    expect(assuncao).toBeNull();

    // Curador B tenta tomar para si o que já é do A.
    const clienteB = createCuradoriaClient(url, anonKey);
    const contaB = accounts.find((entry) => entry.role === "concierge")!;
    await clienteB.auth.signInWithPassword({ email: contaB.email, password: contaB.password });

    const { error } = await clienteB.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: caseId,
      _new_responsible_id: outro.userId,
      _new_role: "curador_medico",
      _reason: "Quero este caso.",
    });

    expect(error, "um Case com dono não pode ser tomado por autoassunção").not.toBeNull();
    expect(error!.message).toContain("responsável atual");

    // E continua fora da fila de disponíveis.
    const disponiveis = await listAvailableCases(clienteB);
    expect(disponiveis.some((entry) => entry.caseId === caseId)).toBe(false);
  }, 60_000);

  it("o paciente continua sem enxergar Case que não é dele", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Isolado ${Date.now()}`);
    const paciente = await loginAs("paciente");

    const { data } = await paciente.client.from("cases").select("id").eq("id", caseId);
    expect(data ?? []).toHaveLength(0);
  }, 60_000);

  it("o atendente não ganha acesso à fila de Curadorias disponíveis", async () => {
    const { caseId } = await createUnclaimedCase(`Paciente Fora ${Date.now()}`);
    const atendente = await loginAs("atendente");

    const { data } = await atendente.client.from("cases").select("id").eq("id", caseId);
    expect(data ?? [], "a policy nova é exclusiva do curador_medico").toHaveLength(0);
  }, 60_000);
});
