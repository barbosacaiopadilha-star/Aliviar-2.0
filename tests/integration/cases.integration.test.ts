import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  addCaseNote,
  changeCaseStatus,
  createCase,
  getCase,
  getPatientCaseOverview,
  listCaseNotes,
  listCases,
  reassignCurator,
} from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";

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
  return `caso-teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("Módulo de Caso (ÉPICO 1/SPRINT 2, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function createSentStoryPatient() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = uniqueEmail();
    const created = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Caso" }, admin.userId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: created.password });

    const draft = await getOrCreateActiveStory(patientClient, created.profileId);
    const sent = await submitStory(patientClient, draft.id, draft.revision);

    return { profileId: created.profileId, storyId: sent.id, patientClient, adminClient: admin.client };
  }

  it("administrador cria um caso a partir de uma história enviada", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const created = await createCase(adminClient, storyId, undefined, (await adminClient.auth.getUser()).data.user!.id);

    expect(created.status).toBe("NEW");
    expect(created.sourceStoryId).toBe(storyId);
  });

  it("bloqueia a criação de um caso a partir de uma história em rascunho", async () => {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = uniqueEmail();
    const created = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Rascunho" }, admin.userId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: created.password });
    const draft = await getOrCreateActiveStory(patientClient, created.profileId);

    await expect(createCase(admin.client, draft.id, undefined, admin.userId)).rejects.toThrow(
      /história já enviada/i,
    );
  });

  it("bloqueia um segundo caso ativo para a mesma história", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const actorId = (await adminClient.auth.getUser()).data.user!.id;
    await createCase(adminClient, storyId, undefined, actorId);

    await expect(createCase(adminClient, storyId, undefined, actorId)).rejects.toThrow(/já existe um caso ativo/i);
  });

  it("paciente não consegue criar um caso (RLS)", async () => {
    const { storyId, patientClient } = await createSentStoryPatient();
    const {
      data: { user },
    } = await patientClient.auth.getUser();

    await expect(createCase(patientClient, storyId, undefined, user!.id)).rejects.toThrow();
  });

  it("profissional não consegue criar um caso (RLS)", async () => {
    const { storyId } = await createSentStoryPatient();
    const profissional = await loginAs("profissional");

    await expect(createCase(profissional.client, storyId, undefined, profissional.userId)).rejects.toThrow();
  });

  it("curador médico visualiza apenas os casos atribuídos a ele", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const curador = await loginAs("curador_medico");

    const created = await createCase(adminClient, storyId, curador.userId, admin.userId);

    const curadorCases = await listCases(curador.client);
    expect(curadorCases.some((c) => c.id === created.id)).toBe(true);

    // Um segundo caso, sem atribuição a este curador, não deve aparecer.
    const { storyId: otherStoryId } = await createSentStoryPatient();
    const otherCase = await createCase(adminClient, otherStoryId, undefined, admin.userId);
    const curadorCasesAfter = await listCases(curador.client);
    expect(curadorCasesAfter.some((c) => c.id === otherCase.id)).toBe(false);
  });

  it("reatribuição registra responsável anterior, novo responsável e justificativa", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const curador = await loginAs("curador_medico");

    const created = await createCase(adminClient, storyId, undefined, admin.userId);
    await reassignCurator(adminClient, created.id, curador.userId, admin.userId, "Distribuição inicial de fila");

    const updated = await getCase(adminClient, created.id);
    expect(updated?.assignedCuratorId).toBe(curador.userId);
  });

  it("muda de status seguindo uma transição válida", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const created = await createCase(adminClient, storyId, undefined, admin.userId);

    await changeCaseStatus(adminClient, created.id, "IN_REVIEW", admin.userId);
    const updated = await getCase(adminClient, created.id);
    expect(updated?.status).toBe("IN_REVIEW");
  });

  it("rejeita uma transição de status inválida", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const created = await createCase(adminClient, storyId, undefined, admin.userId);

    await expect(changeCaseStatus(adminClient, created.id, "DELIVERED", admin.userId)).rejects.toThrow();
  });

  it("paciente só vê o status traduzido do próprio caso, nunca notas nem o enum bruto", async () => {
    const { storyId, adminClient, patientClient, profileId } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const created = await createCase(adminClient, storyId, undefined, admin.userId);
    await changeCaseStatus(adminClient, created.id, "IN_REVIEW", admin.userId);
    await adminClient
      .from("case_notes")
      .insert({ case_id: created.id, author_id: admin.userId, body: "Nota interna sigilosa" });

    const overview = await getPatientCaseOverview(patientClient, profileId);
    expect(overview?.statusLabel).toBe("Nossa equipe está organizando as informações.");

    // O paciente nunca consegue ler a tabela cases nem as notas diretamente.
    const { data: directRead } = await patientClient.from("cases").select("id, status").eq("id", created.id);
    expect(directRead ?? []).toHaveLength(0);

    const { data: directNotes } = await patientClient.from("case_notes").select("id").eq("case_id", created.id);
    expect(directNotes ?? []).toHaveLength(0);
  });

  it("notas do caso são append-only: nunca é possível editar ou apagar uma nota anterior", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const created = await createCase(adminClient, storyId, undefined, admin.userId);

    const first = await addCaseNote(adminClient, created.id, "Primeira nota", admin.userId);
    const second = await addCaseNote(adminClient, created.id, "Segunda nota", admin.userId);

    const notes = await listCaseNotes(adminClient, created.id);
    expect(notes.map((n) => n.body)).toEqual(expect.arrayContaining(["Primeira nota", "Segunda nota"]));
    expect(notes).toHaveLength(2);

    // Não existe caminho de update/delete — nem via RLS (sem policy), nem
    // via repositório (a função addCaseNote só insere).
    const { error: updateError } = await adminClient
      .from("case_notes")
      .update({ body: "Alterado" })
      .eq("id", first.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await adminClient.from("case_notes").delete().eq("id", second.id);
    expect(deleteError).not.toBeNull();

    const notesAfter = await listCaseNotes(adminClient, created.id);
    expect(notesAfter).toHaveLength(2);
    expect(notesAfter.some((n) => n.body === "Primeira nota")).toBe(true);
  });

  it("um paciente não lê o caso de outro paciente (RLS)", async () => {
    const { storyId, adminClient } = await createSentStoryPatient();
    const admin = await loginAs("administrador");
    const created = await createCase(adminClient, storyId, undefined, admin.userId);

    const { patientClient: otherPatientClient } = await createSentStoryPatient();
    const { data } = await otherPatientClient.from("cases").select("id").eq("id", created.id);
    expect(data ?? []).toHaveLength(0);
  });
});
