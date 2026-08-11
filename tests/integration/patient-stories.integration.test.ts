import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { uploadPatientDocument } from "@/modules/profiles/patient-document-repository";
import { attachDocumentToStory } from "@/modules/story/attachment-repository";
import { getOrCreateActiveStory, listStoryVersions, saveStoryDraft, submitStory } from "@/modules/story/repository";

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
  return `sua-historia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("Módulo Sua História — persistência permanente (ÉPICO 1/SPRINT 1, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  async function createSignedInPatient(displayName: string) {
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
    const created = await createPatientAccount(adminClient, adminAuthClient, { email, displayName }, adminUser!.id);
    await adminAuthClient.auth.signOut();

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: created.password });

    return { client: patientClient, profileId: created.profileId };
  }

  it("cria a história ativa em rascunho, revision 1", async () => {
    const { client, profileId } = await createSignedInPatient("Paciente História A");

    const story = await getOrCreateActiveStory(client, profileId);
    expect(story.status).toBe("rascunho");
    expect(story.revision).toBe(1);

    const again = await getOrCreateActiveStory(client, profileId);
    expect(again.id).toBe(story.id);

    await client.auth.signOut();
  });

  it("autosave grava com sucesso quando a revision informada bate com a atual", async () => {
    const { client, profileId } = await createSignedInPatient("Paciente História B");
    const story = await getOrCreateActiveStory(client, profileId);

    const result = await saveStoryDraft(client, story.id, story.revision, { motivo: "ansiedade" }, "motivo");
    expect(result.outcome).toBe("saved");
    if (result.outcome === "saved") {
      expect(result.story.data.motivo).toBe("ansiedade");
      expect(result.story.revision).toBe(story.revision + 1);
    }

    await client.auth.signOut();
  });

  it("concorrência: uma segunda escrita com revision desatualizada nunca sobrescreve, retorna conflito", async () => {
    const { client, profileId } = await createSignedInPatient("Paciente Concorrência");
    const story = await getOrCreateActiveStory(client, profileId);

    const first = await saveStoryDraft(client, story.id, story.revision, { motivo: "primeira aba" }, "motivo");
    expect(first.outcome).toBe("saved");

    // Segunda "aba" ainda usa a revision original (desatualizada).
    const second = await saveStoryDraft(client, story.id, story.revision, { motivo: "segunda aba" }, "motivo");
    expect(second.outcome).toBe("conflict");
    if (second.outcome === "conflict") {
      // O dado da primeira escrita nunca foi sobrescrito.
      expect(second.story.data.motivo).toBe("primeira aba");
    }

    await client.auth.signOut();
  });

  it("versiona a cada mudança de etapa, não a cada autosave de campo", async () => {
    const { client, profileId } = await createSignedInPatient("Paciente Versionamento");
    const story = await getOrCreateActiveStory(client, profileId);

    const save1 = await saveStoryDraft(client, story.id, story.revision, { motivo: "a" }, "motivo");
    expect(save1.outcome).toBe("saved");
    const revisionAfterSameStep = save1.outcome === "saved" ? save1.story.revision : story.revision;

    const save2 = await saveStoryDraft(
      client,
      story.id,
      revisionAfterSameStep,
      { motivo: "a e mais um pouco" },
      "motivo",
    );
    expect(save2.outcome).toBe("saved");

    const versionsBeforeStepChange = await listStoryVersions(client, story.id);

    const save3 = await saveStoryDraft(
      client,
      story.id,
      save2.outcome === "saved" ? save2.story.revision : revisionAfterSameStep,
      {},
      "historia",
    );
    expect(save3.outcome).toBe("saved");

    const versionsAfterStepChange = await listStoryVersions(client, story.id);
    expect(versionsAfterStepChange.length).toBe(versionsBeforeStepChange.length + 1);

    await client.auth.signOut();
  });

  it("história enviada fica imutável — nova tentativa de autosave é rejeitada", async () => {
    const { client, profileId } = await createSignedInPatient("Paciente Imutabilidade");
    const story = await getOrCreateActiveStory(client, profileId);

    const submitted = await submitStory(client, story.id, story.revision);
    expect(submitted.status).toBe("enviada");
    expect(submitted.submittedAt).not.toBeNull();

    const attempt = await saveStoryDraft(client, story.id, submitted.revision, { motivo: "editando depois" }, "motivo");
    expect(attempt.outcome).toBe("error");

    await client.auth.signOut();
  });

  it("um paciente não lê nem escreve a história de outro (RLS)", async () => {
    const { client: clientA, profileId: profileIdA } = await createSignedInPatient("Paciente Isolamento A");
    const storyA = await getOrCreateActiveStory(clientA, profileIdA);

    const { client: clientB } = await createSignedInPatient("Paciente Isolamento B");

    const { data: crossRead } = await clientB.from("patient_stories").select("id").eq("id", storyA.id);
    expect(crossRead ?? []).toHaveLength(0);

    const { data: crossWrite } = await clientB
      .from("patient_stories")
      .update({ current_step: "revisao" })
      .eq("id", storyA.id)
      .select("id");
    expect(crossWrite ?? []).toHaveLength(0);

    await clientA.auth.signOut();
    await clientB.auth.signOut();
  });

  it("anexos: um paciente não consegue anexar um documento de outro paciente à própria história (RLS)", async () => {
    const { client: clientA, profileId: profileIdA } = await createSignedInPatient("Paciente Anexo A");
    const documentA = await uploadPatientDocument(
      clientA,
      profileIdA,
      // D-12.3: `text/plain` deixou de ser aceitável no bucket (ADR-054).
      new File(["%PDF-1.7\n"], "exame-a.pdf", { type: "application/pdf" }),
      "application/pdf",
    );

    const { client: clientB } = await createSignedInPatient("Paciente Anexo B");
    const storyB = await getOrCreateActiveStory(clientB, (await clientB.auth.getUser()).data.user!.id);

    await expect(attachDocumentToStory(clientB, storyB.id, documentA.id)).rejects.toThrow();

    await clientA.auth.signOut();
    await clientB.auth.signOut();
  });
});
