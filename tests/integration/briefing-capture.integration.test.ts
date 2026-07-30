import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * CAPTURA DO BRIEFING — a fronteira provada contra os SETE atores.
 *
 * @metodo ACE_BOUNDARIES §3.1 — o paciente nunca vê o Briefing
 * @metodo ACE_BOUNDARIES §3.2 — o médico não vê o Briefing, mas revisa o que é dele
 * @metodo ACE_PRINCIPLES P8 — direito à revisão pelo autor
 *
 * Não basta que a tela não mostre: o banco precisa recusar. Estes testes batem
 * direto na tabela, sem passar por action nem por componente — se a RLS
 * afrouxar, aqui quebra antes de qualquer usuário descobrir.
 */

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
  return `briefing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("captura do Briefing — RLS contra os sete atores (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente").toBeTruthy();
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role);
    if (!account) throw new Error(`Conta de teste do papel "${role}" ausente — rode bootstrap:test-users.`);
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  /** Um Case real, com paciente real — a fronteira só se prova sobre dado real. */
  async function createCaseWithPatient() {
    const admin = await loginAs("administrador");
    const adminService = createAdminSupabaseClient();
    const email = uniqueEmail();
    const patient = await createPatientAccount(
      adminService,
      admin.client,
      { email, displayName: "Paciente Briefing" },
      admin.userId,
    );

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patient.password });

    const draft = await getOrCreateActiveStory(patientClient, patient.profileId);
    const sent = await submitStory(patientClient, draft.id, draft.revision);

    const curador = await loginAs("curador_medico");
    const created = await createCase(admin.client, sent.id, curador.userId, admin.userId);

    return { caseId: created.id, patientClient, patientProfileId: patient.profileId, admin, curador };
  }

  // -------------------------------------------------------------------------
  // ATOR 1 — Curador: registra e revisa o que é dele
  // -------------------------------------------------------------------------

  it("curador registra resposta do paciente e observação no Case que conduz", async () => {
    const { caseId, curador } = await createCaseWithPatient();

    const { error: respostaErro } = await curador.client.from("alignment_patient_answers").insert({
      case_id: caseId,
      question_id: "PA1",
      option: "LER_SOZINHO",
      verbatim: "Preciso ler com calma.",
      recorded_by: curador.userId,
    });
    expect(respostaErro).toBeNull();

    const { error: obsErro } = await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Pediu para incluir a filha na conversa.",
      author_id: curador.userId,
    });
    expect(obsErro).toBeNull();
  });

  it("curador corrige e remove a PRÓPRIA observação (P8)", async () => {
    const { caseId, curador } = await createCaseWithPatient();

    const { data: inserida } = await curador.client
      .from("curator_observations")
      .insert({ case_id: caseId, kind: "CU2", note: "Texto original.", author_id: curador.userId })
      .select("id")
      .single();

    const { data: corrigida } = await curador.client
      .from("curator_observations")
      .update({ note: "Texto corrigido." })
      .eq("id", inserida!.id)
      .select("id, note");
    expect(corrigida).toHaveLength(1);
    expect(corrigida![0].note).toBe("Texto corrigido.");

    const { data: removida } = await curador.client
      .from("curator_observations")
      .delete()
      .eq("id", inserida!.id)
      .select("id");
    expect(removida).toHaveLength(1);
  });

  it("curador NÃO remove nem corrige a observação de outro autor", async () => {
    const { caseId, curador, admin } = await createCaseWithPatient();

    // Observação escrita pelo administrador, no mesmo Case.
    const { data: alheia } = await admin.client
      .from("curator_observations")
      .insert({ case_id: caseId, kind: "CU1", note: "Leitura do administrador.", author_id: admin.userId })
      .select("id")
      .single();

    // A RLS não levanta erro — simplesmente não alcança linha nenhuma.
    const { data: tentativaUpdate } = await curador.client
      .from("curator_observations")
      .update({ note: "Apagando a leitura do outro." })
      .eq("id", alheia!.id)
      .select("id");
    expect(tentativaUpdate).toHaveLength(0);

    const { data: tentativaDelete } = await curador.client
      .from("curator_observations")
      .delete()
      .eq("id", alheia!.id)
      .select("id");
    expect(tentativaDelete).toHaveLength(0);

    // E o texto original continua intacto — as leituras coexistem.
    const { data: aindaLa } = await curador.client
      .from("curator_observations")
      .select("note")
      .eq("id", alheia!.id)
      .single();
    expect(aindaLa!.note).toBe("Leitura do administrador.");
  });

  // -------------------------------------------------------------------------
  // ATOR 2 — Paciente: nunca vê o Briefing, nem o que é sobre ele
  // -------------------------------------------------------------------------

  it("paciente NÃO lê as próprias respostas de alinhamento nem as observações (§3.1)", async () => {
    const { caseId, curador, patientClient } = await createCaseWithPatient();

    await curador.client.from("alignment_patient_answers").insert({
      case_id: caseId,
      question_id: "PA2",
      option: "DECIDIR_JUNTO",
      recorded_by: curador.userId,
    });
    await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU3",
      note: "Falar da distância antes de decidir.",
      author_id: curador.userId,
    });

    const { data: respostas } = await patientClient.from("alignment_patient_answers").select("id").eq("case_id", caseId);
    expect(respostas ?? []).toHaveLength(0);

    const { data: observacoes } = await patientClient.from("curator_observations").select("id").eq("case_id", caseId);
    expect(observacoes ?? []).toHaveLength(0);
  });

  it("paciente NÃO escreve observação sobre o próprio caso", async () => {
    const { caseId, patientClient } = await createCaseWithPatient();
    const {
      data: { user },
    } = await patientClient.auth.getUser();

    const { error } = await patientClient.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Tentativa do paciente.",
      author_id: user!.id,
    });
    expect(error).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // ATOR 3 — Médico: revisa o que é dele, não vê o Briefing
  // -------------------------------------------------------------------------

  it("médico declara e corrige as PRÓPRIAS respostas (P8)", async () => {
    const medico = await loginAs("profissional");

    const { error: insercao } = await medico.client.from("alignment_professional_answers").upsert(
      {
        professional_profile_id: medico.userId,
        question_id: "ME1",
        option: "TAMBEM_POR_ESCRITO",
      },
      { onConflict: "professional_profile_id,question_id" },
    );
    expect(insercao).toBeNull();

    const { data: corrigida } = await medico.client
      .from("alignment_professional_answers")
      .update({ option: "CONVERSO_E_RESPONDO" })
      .eq("professional_profile_id", medico.userId)
      .eq("question_id", "ME1")
      .select("option");
    expect(corrigida![0].option).toBe("CONVERSO_E_RESPONDO");
  });

  it("médico NÃO lê nem escreve declaração de outro profissional", async () => {
    const medico = await loginAs("profissional");
    const admin = await loginAs("administrador");

    // Declaração de outra pessoa (o administrador tem permissão de escrita).
    await admin.client.from("alignment_professional_answers").upsert(
      { professional_profile_id: admin.userId, question_id: "ME2", option: "CANAL_DIRETO" },
      { onConflict: "professional_profile_id,question_id" },
    );

    const { data: leitura } = await medico.client
      .from("alignment_professional_answers")
      .select("id")
      .eq("professional_profile_id", admin.userId);
    expect(leitura ?? []).toHaveLength(0);

    const { error: escrita } = await medico.client.from("alignment_professional_answers").insert({
      professional_profile_id: admin.userId,
      question_id: "ME4",
      option: "RECEBO_JUNTOS",
    });
    expect(escrita).not.toBeNull();
  });

  it("médico NÃO lê o Briefing do Case: nem observações, nem respostas do paciente (§3.2)", async () => {
    const { caseId, curador } = await createCaseWithPatient();
    await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU5",
      note: "Ressalva sobre uma das opções.",
      author_id: curador.userId,
    });

    const medico = await loginAs("profissional");
    const { data: obs } = await medico.client.from("curator_observations").select("id").eq("case_id", caseId);
    expect(obs ?? []).toHaveLength(0);

    const { data: respostas } = await medico.client
      .from("alignment_patient_answers")
      .select("id")
      .eq("case_id", caseId);
    expect(respostas ?? []).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // ATORES 4 e 5 — Atendente e Concierge: alcançam pelo can_access_case
  // -------------------------------------------------------------------------

  it("atendente NÃO alcança o Briefing de um Case que não é dele", async () => {
    const { caseId, curador } = await createCaseWithPatient();
    await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Observação da Curadoria.",
      author_id: curador.userId,
    });

    const atendente = await loginAs("atendente");
    const { data } = await atendente.client.from("curator_observations").select("id").eq("case_id", caseId);
    // O Case está com o Curador: o atendente não é responsável por ele.
    expect(data ?? []).toHaveLength(0);
  });

  it("concierge NÃO alcança o Briefing de um Case que não é dele", async () => {
    const { caseId, curador } = await createCaseWithPatient();
    await curador.client.from("alignment_patient_answers").insert({
      case_id: caseId,
      question_id: "PA4",
      option: "FAMILIA",
      recorded_by: curador.userId,
    });

    const concierge = await loginAs("concierge");
    const { data } = await concierge.client.from("alignment_patient_answers").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // ATOR 6 — Administrador: acesso global por definição
  // -------------------------------------------------------------------------

  it("administrador alcança o Briefing — acesso global é definição do papel", async () => {
    const { caseId, curador, admin } = await createCaseWithPatient();
    await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Observação visível ao administrador.",
      author_id: curador.userId,
    });

    const { data } = await admin.client.from("curator_observations").select("id").eq("case_id", caseId);
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // ATOR 7 — Anônimo: nada, em lugar nenhum
  // -------------------------------------------------------------------------

  it("anônimo não lê nem escreve em nenhuma das três tabelas", async () => {
    const { caseId, curador } = await createCaseWithPatient();
    await curador.client.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Não deve vazar.",
      author_id: curador.userId,
    });

    const anon = createCuradoriaClient(url, anonKey);

    for (const tabela of [
      "alignment_patient_answers",
      "alignment_professional_answers",
      "curator_observations",
    ]) {
      const { data } = await anon.from(tabela).select("id");
      expect(data ?? [], `anônimo leu ${tabela}`).toHaveLength(0);
    }

    const { error } = await anon.from("curator_observations").insert({
      case_id: caseId,
      kind: "CU1",
      note: "Tentativa anônima.",
      author_id: curador.userId,
    });
    expect(error).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // A garantia estrutural: o verbatim não cria nada sobre profissional
  // -------------------------------------------------------------------------

  it("verbatim citando um profissional não cria entidade, vínculo nem atributo (§1.4)", async () => {
    const { caseId, curador } = await createCaseWithPatient();
    const service = createAdminSupabaseClient();

    const antes = await service.from("professional_profiles").select("id");
    const perfisAntes = (antes.data ?? []).length;

    await curador.client.from("alignment_patient_answers").insert({
      case_id: caseId,
      question_id: "PA3",
      option: "TEM_ALGO",
      verbatim: "O Dr. Fulano de Tal não me deixou perguntar nada.",
      recorded_by: curador.userId,
    });

    // Nenhum perfil de profissional nasceu da fala.
    const depois = await service.from("professional_profiles").select("id");
    expect((depois.data ?? []).length).toBe(perfisAntes);

    // A fala está guardada onde pertence: no Case, como resposta do paciente.
    const { data: guardada } = await curador.client
      .from("alignment_patient_answers")
      .select("case_id, verbatim")
      .eq("case_id", caseId)
      .eq("question_id", "PA3")
      .single();
    expect(guardada!.verbatim).toContain("Dr. Fulano de Tal");
    expect(guardada!.case_id).toBe(caseId);
  });
});
