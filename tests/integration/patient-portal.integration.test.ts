import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { listPatientNotifications } from "@/modules/profiles/patient-notification-repository";

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
  return `portal-paciente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("Portal do Paciente (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  it("uma nova conta de paciente recebe a notificação de boas-vindas automaticamente", async () => {
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
    const created = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email, displayName: "Paciente Portal" },
      adminUser!.id,
    );

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: created.password });

    const notifications = await listPatientNotifications(patientClient, created.profileId);
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications.some((n) => n.title === "Bem-vindo à Aliviar")).toBe(true);

    await patientClient.auth.signOut();
    await adminAuthClient.auth.signOut();
  });

  it("um paciente não consegue ler notificações nem documentos de outro paciente (RLS)", async () => {
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
    const emailA = uniqueEmail();
    const patientA = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email: emailA, displayName: "Paciente A" },
      adminUser!.id,
    );

    const emailB = uniqueEmail();
    const patientB = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email: emailB, displayName: "Paciente B" },
      adminUser!.id,
    );

    const clientB = createCuradoriaClient(url, anonKey);
    await clientB.auth.signInWithPassword({ email: emailB, password: patientB.password });

    const { data: crossNotifications } = await clientB
      .from("patient_notifications")
      .select("id")
      .eq("profile_id", patientA.profileId);
    expect(crossNotifications ?? []).toHaveLength(0);

    const { data: crossDocuments } = await clientB
      .from("patient_documents")
      .select("id")
      .eq("profile_id", patientA.profileId);
    expect(crossDocuments ?? []).toHaveLength(0);

    await clientB.auth.signOut();
    await adminAuthClient.auth.signOut();
  });

  it("um paciente não consegue alterar título/corpo da própria notificação, só read_at", async () => {
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
    const created = await createPatientAccount(
      adminClient,
      adminAuthClient,
      { email, displayName: "Paciente Protegido" },
      adminUser!.id,
    );

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: created.password });

    const notifications = await listPatientNotifications(patientClient, created.profileId);
    const notification = notifications[0];

    await patientClient
      .from("patient_notifications")
      .update({ title: "Título forjado pelo paciente" })
      .eq("id", notification.id);

    const refreshed = await listPatientNotifications(patientClient, created.profileId);
    const same = refreshed.find((n) => n.id === notification.id);
    expect(same?.title).toBe(notification.title);

    await patientClient.auth.signOut();
    await adminAuthClient.auth.signOut();
  });
});
