// COERÊNCIA MESA × COS — as duas leituras, contra o mesmo banco.
//
// A certificação dinâmica deixou este item como "não verificável": Mesa e COS
// são `server-only` e a suíte de integração não carregava (NC-24). Com ela
// restaurada, aqui se prova o que faltava: os dois lêem a MESMA fonte e
// devolvem os MESMOS números — e um profissional com divergência crítica em
// aberto não chega a nenhum dos dois (NC-22).

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { declareAreaCompatibility } from "@/modules/curadoria/area-repository";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { conduct } from "@/modules/curadoria/cos/conduction";
import * as curadoria from "@/modules/curadoria/repository";

import { createCuradoriaClient } from "./curadoria-client";
import {
  CERTIFICATION_AREA_REQUIREMENT,
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
  markCaseAsCertification,
} from "./certificacao-fixture";
import { completarMapaDePrioridades } from "./support-mapa";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("Coerência Mesa × COS (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let caseId: string;
  let priorityProfileId: string;
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let pacienteProfileId: string;

  async function loginAs(role: string) {
    const account = accounts.find((entry) => entry.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));

    admin = await loginAs("administrador");
    curador = await loginAs("curador_medico");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));

    const email = `mesa-cos-${Date.now()}@example.test`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Coerência (sintético)" },
      admin.userId,
    );
    pacienteProfileId = paciente.profileId;

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: paciente.password });
    const draft = await getOrCreateActiveStory(patientClient, paciente.profileId);
    const story = await submitStory(patientClient, draft.id, draft.revision);

    const kase = await createCase(admin.client, story.id, curador.userId, admin.userId);
    caseId = kase.id;
    await markCaseAsCertification(service, caseId);

    priorityProfileId = await curadoria.createPriorityProfile(curador.client, caseId, curador.userId);
    await curadoria.addFilter(
      curador.client,
      priorityProfileId,
      "FILTRO_OBRIGATORIO",
      "AREA_DE_ATUACAO",
      CERTIFICATION_AREA_REQUIREMENT,
      null,
    );
    await completarMapaDePrioridades(curador.client, priorityProfileId);
    await curadoria.validatePriorityProfile(curador.client, priorityProfileId, "Confirmado.");

    // Duas áreas compatíveis, uma incompatível — a quarta fica sem declaração.
    await declareAreaCompatibility(curador.client, {
      caseId,
      professionalProfileId: professionalIds["fixture-a"]!,
      compatibility: "COMPATIVEL",
      declaredBy: curador.userId,
    });
    await declareAreaCompatibility(curador.client, {
      caseId,
      professionalProfileId: professionalIds["fixture-b"]!,
      compatibility: "COMPATIVEL",
      declaredBy: curador.userId,
    });
    await declareAreaCompatibility(curador.client, {
      caseId,
      professionalProfileId: professionalIds["fixture-c"]!,
      compatibility: "INCOMPATIVEL",
      rationale: "Área não responde ao que este caso exige.",
      declaredBy: curador.userId,
    });
  }, 120_000);

  afterAll(async () => {
    await service
      .from("verification_divergences")
      .delete()
      .in("professional_profile_id", Object.values(professionalIds ?? {}));
    await cleanupCuradoriaCertificationFixture(service);
    if (pacienteProfileId) {
      await service.from("patient_stories").delete().eq("profile_id", pacienteProfileId);
      await service.from("patient_profiles").delete().eq("profile_id", pacienteProfileId);
      await service.from("user_roles").delete().eq("profile_id", pacienteProfileId);
      await service.auth.admin.deleteUser(pacienteProfileId);
    }
  }, 60_000);

  it("Mesa e COS enxergam o mesmo universo, com os mesmos números", async () => {
    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);
    const record = await loadCuradoriaRecord(curador.client, caseId);
    const cos = record!.curadoriaTecnica;

    // A tabela de coerência da certificação, agora com dados reais.
    expect(cos.elegibilidade.found).toBe(mesa.counts.found);
    expect(cos.elegibilidade.awaitingArea).toBe(mesa.counts.awaiting);
    expect(cos.elegibilidade.eligible).toBe(mesa.counts.eligible);
    expect(cos.elegibilidade.eliminated).toBe(mesa.counts.eliminated);
    expect(cos.elegibilidade.pendingInfo).toBe(mesa.counts.pending);

    // As leituras do Motor: uma por elegível, nos dois lados.
    expect(cos.leituras).toHaveLength(mesa.comparison.length);
    expect(cos.leituras.map((l) => l.professionalId).sort()).toEqual(
      mesa.comparison.map((c) => c.professionalProfileId).sort(),
    );

    // Lacunas: o COS soma o que o Motor contou por profissional.
    const lacunasMesa = mesa.comparison.reduce(
      (total, coluna) => total + coluna.summary.informationGaps,
      0,
    );
    const lacunasCos = cos.leituras.reduce((total, l) => total + l.informationGaps, 0);
    expect(lacunasCos).toBe(lacunasMesa);

    // Nomes: fonte canônica nos dois.
    for (const profissional of mesa.professionals) {
      expect(cos.professionalNames[profissional.professionalProfileId]).toBe(
        profissional.displayName,
      );
    }

    // Seleção: nenhuma ainda.
    expect(cos.selectedProfessionalIds).toHaveLength(0);
  });

  it("o incompatível não entra, e quem não foi declarado fica aguardando — nunca eliminado", async () => {
    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);

    const incompativel = mesa.professionals.find(
      (p) => p.professionalProfileId === professionalIds["fixture-c"],
    )!;
    expect(incompativel.eligibility.state).toBe("ELIMINADO");
    expect(mesa.comparison.map((c) => c.professionalProfileId)).not.toContain(
      professionalIds["fixture-c"],
    );

    const semDeclaracao = mesa.professionals.find(
      (p) => p.professionalProfileId === professionalIds["fixture-d"],
    );
    if (semDeclaracao) expect(semDeclaracao.eligibility.state).toBe("AGUARDANDO_DECLARACAO");
  });

  it("NC-22: divergência crítica em aberto tira o profissional da Mesa E do COS", async () => {
    const alvo = professionalIds["fixture-a"]!;

    const antesMesa = await loadMesaCruzamento(curador.client, caseId, 0);
    expect(antesMesa.professionals.map((p) => p.professionalProfileId)).toContain(alvo);
    expect(antesMesa.comparison.map((c) => c.professionalProfileId)).toContain(alvo);

    await service.from("verification_divergences").insert({
      professional_profile_id: alvo,
      subject: "AREA_DE_ATUACAO",
      declared_version: "Área declarada no cadastro",
      found_version: "Área encontrada na fonte",
      severity: "critica",
      opened_by: admin.userId,
    });

    const depoisMesa = await loadMesaCruzamento(curador.client, caseId, 0);
    const depoisRecord = await loadCuradoriaRecord(curador.client, caseId);

    expect(depoisMesa.professionals.map((p) => p.professionalProfileId)).not.toContain(alvo);
    expect(depoisMesa.comparison.map((c) => c.professionalProfileId)).not.toContain(alvo);
    expect(
      depoisRecord!.curadoriaTecnica.leituras.map((l) => l.professionalId),
    ).not.toContain(alvo);
    expect(depoisMesa.counts.found).toBe(antesMesa.counts.found - 1);
    expect(depoisRecord!.curadoriaTecnica.elegibilidade.found).toBe(depoisMesa.counts.found);

    // A Rede aprovada concorda — é a mesma política, num lugar só.
    const rede = await curadoria.listApprovedProviders(curador.client, { certification: true });
    expect(rede.map((p) => p.professionalProfileId)).not.toContain(alvo);
  });

  it("conduct() opera sobre o registro real e não emite alerta por pontos ou banda", async () => {
    const record = await loadCuradoriaRecord(curador.client, caseId);
    const state = conduct(record!);

    expect(state.currentPhase).toBeTruthy();
    for (const alerta of state.alerts) {
      expect(alerta.code).not.toBe("C-01");
      expect(alerta.code).not.toBe("C-05");
      expect(`${alerta.title} ${alerta.detail}`.toLowerCase()).not.toMatch(
        /ponto|banda|moderada|score/,
      );
    }
    // Nenhuma inconsistência do modelo de pesos sobrevive.
    for (const inconsistencia of state.inconsistencies) {
      expect(["I-09", "I-10", "I-11", "I-12"]).toContain(inconsistencia.code);
    }
  });
});
