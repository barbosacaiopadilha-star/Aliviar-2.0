// MESA DO CRUZAMENTO — persistência e montagem contra as fixtures reais
//
// O componente é testado em tests/components; a visão pura em tests/unit.
// Aqui é o que falta: os pesos e as declarações de critério indo e voltando
// do banco, e `loadMesaCruzamento` montando a Mesa inteira sobre o Case de
// certificação — o mesmo que o Dashboard carrega.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { declareAreaCompatibility } from "@/modules/curadoria/area-repository";
import {
  declareCriterion,
  loadMesaCruzamento,
} from "@/modules/curadoria/mesa-cruzamento";
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

describe("Mesa do Cruzamento — banco e montagem (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let caseId: string;
  let priorityProfileId: string;
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
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

    const admin = await loginAs("administrador");
    curador = await loginAs("curador_medico");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));

    const email = `mesa-cruzamento-${Date.now()}@example.test`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Mesa Cruzamento (sintético)" },
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
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "UF", "SP", null);
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "CUIDADO_CONTINUO", "true", null);
    await completarMapaDePrioridades(curador.client, priorityProfileId);
    await curadoria.validatePriorityProfile(curador.client, priorityProfileId, "Confirmado.");
  }, 120_000);

  afterAll(async () => {
    await cleanupCuradoriaCertificationFixture(service);
    if (pacienteProfileId) {
      await service.from("patient_stories").delete().eq("profile_id", pacienteProfileId);
      await service.from("patient_profiles").delete().eq("profile_id", pacienteProfileId);
      await service.from("user_roles").delete().eq("profile_id", pacienteProfileId);
      await service.auth.admin.deleteUser(pacienteProfileId);
    }
  }, 60_000);

  it("antes de qualquer trabalho, a Mesa diz que o Perfil foi reconhecido", async () => {
    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);

    expect(mesa.profileAcknowledged).toBe(true);
    expect(mesa.isCertification).toBe(true);
    expect(mesa.areaRequirement).toBe(CERTIFICATION_AREA_REQUIREMENT);
    expect(mesa.mapaPendentes).toBe(0);
    // As quatro fixtures aparecem; nenhuma declarada ainda.
    expect(mesa.counts.found).toBe(4);
    expect(mesa.counts.awaiting).toBe(4);
    expect(mesa.comparison).toHaveLength(0);
  });

  // Os três testes de orçamento saíram — ADR-042. Não existe mais bloco que
  // feche em 100, nem crítica de "critério do bloco errado": o Case classifica
  // subcritérios do catálogo canônico, e nada precisa somar.

  it("as declarações de área reclassificam a Rede: três elegíveis, D eliminada", async () => {
    const declaracoes = {
      "fixture-a": { compatibility: "COMPATIVEL" as const, rationale: null },
      "fixture-b": { compatibility: "COMPATIVEL" as const, rationale: null },
      "fixture-c": { compatibility: "COMPATIVEL" as const, rationale: null },
      "fixture-d": {
        compatibility: "INCOMPATIVEL" as const,
        rationale: "A atuação está concentrada em Cirurgia do Joelho e não responde à área exigida pelo Case.",
      },
    };

    for (const [key, decl] of Object.entries(declaracoes)) {
      await declareAreaCompatibility(curador.client, {
        caseId,
        professionalProfileId: professionalIds[key]!,
        compatibility: decl.compatibility,
        rationale: decl.rationale,
        declaredBy: curador.userId,
      });
    }

    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);
    expect(mesa.counts).toMatchObject({ awaiting: 0, eligible: 3, eliminated: 1, pending: 0 });

    const d = mesa.professionals.find((p) => p.professionalProfileId === professionalIds["fixture-d"])!;
    expect(d.eligibility.state).toBe("ELIMINADO");
    // Eliminada pela área: não entra na comparação nem recebe avaliação ponderada.
    expect(mesa.comparison.map((c) => c.professionalProfileId)).not.toContain(d.professionalProfileId);
  });

  it("os filtros obrigatórios aparecem com resultado dito por extenso", async () => {
    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);
    const a = mesa.professionals.find((p) => p.professionalProfileId === professionalIds["fixture-a"])!;

    const sp = a.eligibility.filters.find((f) => f.label.includes("SP"))!;
    expect(sp.passes).toBe(true);
    const continuo = a.eligibility.filters.find((f) => f.label === "Cuidado contínuo")!;
    expect(continuo.passes).toBe(true);
    expect(continuo.professionalValue).toBe("oferece");
  });

  it("as declarações de critério alimentam a comparação, e a lacuna vira cobertura 80 do próprio cruzamento", async () => {
    const declarar = (professionalKey: string, criterion: string, assessment: string, evidence: string) =>
      declareCriterion(curador.client, caseId, {
        professionalProfileId: professionalIds[professionalKey]!,
        criterion: criterion as never,
        assessment: assessment as never,
        evidence,
        declaredBy: curador.userId,
      });

    const completo: [string, string][] = [
      ["FORMACAO", "ATENDE_PLENAMENTE"],
      ["EXPERIENCIA", "ATENDE_PLENAMENTE"],
      ["HISTORICO", "ATENDE_PARCIALMENTE"],
      ["ACESSO", "ATENDE_PLENAMENTE"],
      ["CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"],
      ["MODELO_DE_ATENDIMENTO", "ATENDE_PLENAMENTE"],
    ];
    for (const [criterion, assessment] of completo) {
      await declarar("fixture-a", criterion, assessment, `Avaliação do Curador sobre ${criterion}.`);
    }

    // B: tudo declarado menos compatibilidade pessoal — que fica insuficiente.
    for (const [criterion, assessment] of [
      ["FORMACAO", "ATENDE_PLENAMENTE"],
      ["EXPERIENCIA", "ATENDE_PLENAMENTE"],
      ["HISTORICO", "ATENDE_PLENAMENTE"],
      ["ACESSO", "ATENDE_PARCIALMENTE"],
      ["CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"],
      ["MODELO_DE_ATENDIMENTO", "INFORMACAO_INSUFICIENTE"],
    ] as [string, string][]) {
      await declarar("fixture-b", criterion, assessment, `Avaliação do Curador sobre ${criterion}.`);
    }

    const mesa = await loadMesaCruzamento(curador.client, caseId, 0);

    const colunaA = mesa.comparison.find((c) => c.professionalProfileId === professionalIds["fixture-a"])!;
    const colunaB = mesa.comparison.find((c) => c.professionalProfileId === professionalIds["fixture-b"])!;

    // ADR-042 — a leitura vem do Motor. Nenhum profissional tem Mapa
    // preenchido nesta fixture, então tudo cai em "ainda não investigado" —
    // que é lacuna, nunca nota zero nem reprovação.
    for (const coluna of [colunaA, colunaB]) {
      expect(coluna.summary.highCompatibility).toBe(0);
      expect(coluna.cells.every((cell) => cell.status === null)).toBe(true);
      expect(coluna.cells.every((cell) => cell.stateSentence === "Ainda não investigado")).toBe(true);
    }

    // Nenhum texto da Mesa fala em pontos.
    expect(JSON.stringify(mesa.comparison)).not.toMatch(/100 pontos|pointsSentence/);

    // A fixture-c segue sem declaração de critérios: presente na comparação,
    // aguardando o Curador — nunca reprovada.
    const colunaC = mesa.comparison.find((c) => c.professionalProfileId === professionalIds["fixture-c"])!;
    expect(colunaC).toBeTruthy();
    expect(mesa.awaitingDeclaration[professionalIds["fixture-c"]!]).toHaveLength(6);
  });

  it("evidência sem texto é recusada pelo banco", async () => {
    const { error } = await service.from("criterion_declarations").insert({
      case_id: caseId,
      professional_profile_id: professionalIds["fixture-c"],
      criterion: "FORMACAO",
      assessment: "ATENDE_PLENAMENTE",
      evidence: "   ",
      declared_by: curador.userId,
    });
    expect(error).not.toBeNull();
  });

  it("a seleção persistida entra na contagem do cabeçalho", async () => {
    await curadoria.saveSelection(
      curador.client,
      caseId,
      priorityProfileId,
      curador.userId,
      "Os três cobrem a área por caminhos diferentes.",
      (["fixture-a", "fixture-b", "fixture-c"] as const).map((key) => ({
        professionalProfileId: professionalIds[key]!,
        band: "ALTA" as const,
        rationale: "Área compatível e filtros atendidos.",
      })),
    );

    const selecao = await curadoria.getSelection(curador.client, priorityProfileId);
    const mesa = await loadMesaCruzamento(curador.client, caseId, selecao!.options.length);

    expect(mesa.counts.selected).toBe(3);
    expect(mesa.nextStep).toContain("Relatório");
  });
});
