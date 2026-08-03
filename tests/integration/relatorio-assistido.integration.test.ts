// RELATÓRIO ASSISTIDO — o ciclo contra os contratos reais
//
// O gerador puro é testado em tests/unit. Aqui é o resto: a montagem da
// entrada a partir do banco, a persistência do rascunho no Relatório
// existente, e o ciclo de vida que o banco garante — revisado, aprovado,
// emitido, congelado. Tudo sobre o Case de certificação; nada alcança
// paciente real.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { declareAreaCompatibility } from "@/modules/curadoria/area-repository";
import { declareCriterion } from "@/modules/curadoria/mesa-cruzamento";
import {
  generateAndSaveAssistedDraft,
  getReportLifecycle,
} from "@/modules/curadoria/relatorio-assistido";
import {
  composicaoPendenteDoCurador,
  FRASE_COMPOSICAO_RASCUNHO,
  GENERATOR_VERSION,
} from "@/modules/curadoria/relatorio-inteligente";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";

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

describe("Relatório assistido — geração, ciclo de vida e congelamento (Supabase local)", () => {
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

    const email = `relatorio-assistido-${Date.now()}@example.test`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Relatório Assistido (sintético)" },
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
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "AREA_DE_ATUACAO", CERTIFICATION_AREA_REQUIREMENT, null);
    await completarMapaDePrioridades(curador.client, priorityProfileId);
    await curadoria.validatePriorityProfile(curador.client, priorityProfileId, "Confirmado.");

    // Pesos do Modelo v1.0 — dois cruzamentos de 100.

    // Declarações de área e de critério para A, B e C.
    const declaracoesArea = {
      "fixture-a": "A atuação declarada inclui explicitamente Ortopedia e Cirurgia da Coluna.",
      "fixture-b": "A atuação declarada inclui Cirurgia da Coluna e condições complexas da coluna.",
      "fixture-c": "A atuação declarada inclui tratamento conservador e cirúrgico de patologias da coluna.",
    };
    for (const [key, rationale] of Object.entries(declaracoesArea)) {
      await declareAreaCompatibility(curador.client, {
        caseId,
        professionalProfileId: professionalIds[key]!,
        compatibility: "COMPATIVEL",
        rationale,
        declaredBy: curador.userId,
      });
    }

    const avaliacoes: Record<string, [string, string][]> = {
      "fixture-a": [
        ["FORMACAO", "ATENDE_PLENAMENTE"],
        ["EXPERIENCIA", "ATENDE_PLENAMENTE"],
        ["HISTORICO", "ATENDE_PARCIALMENTE"],
        ["ACESSO", "ATENDE_PLENAMENTE"],
        ["CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"],
        ["MODELO_DE_ATENDIMENTO", "ATENDE_PLENAMENTE"],
      ],
      "fixture-b": [
        ["FORMACAO", "ATENDE_PLENAMENTE"],
        ["EXPERIENCIA", "ATENDE_PLENAMENTE"],
        ["HISTORICO", "ATENDE_PLENAMENTE"],
        ["ACESSO", "ATENDE_PARCIALMENTE"],
        ["CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"],
        ["MODELO_DE_ATENDIMENTO", "INFORMACAO_INSUFICIENTE"],
      ],
      "fixture-c": [
        ["FORMACAO", "ATENDE_PARCIALMENTE"],
        ["EXPERIENCIA", "ATENDE_PLENAMENTE"],
        ["HISTORICO", "ATENDE_PARCIALMENTE"],
        ["ACESSO", "ATENDE_PLENAMENTE"],
        ["CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"],
        ["MODELO_DE_ATENDIMENTO", "ATENDE_PLENAMENTE"],
      ],
    };
    for (const [key, list] of Object.entries(avaliacoes)) {
      for (const [criterion, assessment] of list) {
        await declareCriterion(curador.client, caseId, {
          professionalProfileId: professionalIds[key]!,
          criterion: criterion as never,
          assessment: assessment as never,
          evidence: `Avaliação do Curador sobre ${criterion} desta fixture.`,
          declaredBy: curador.userId,
        });
      }
    }

    // ADR-042 — o Relatório lê o Mapa do Profissional. Cada fixture recebe um
    // padrão distinto para que os três dossiês possam divergir por FATO, e não
    // por acaso de geração.
    const { data: subcriterios } = await service
      .from("method_subcriteria")
      .select("id, code")
      .eq("active", true)
      .order("display_order");
    const idPorCodigo = new Map((subcriterios ?? []).map((row) => [row.code, row.id]));
    const codigos = (subcriterios ?? []).map((row) => row.code);

    const mapasDoProfissional: Record<string, Record<number, string>> = {
      // Confirma os três primeiros: um dossiê com âncoras reais.
      "fixture-a": { 0: "CONFIRMADO", 1: "CONFIRMADO", 2: "CONFIRMADO" },
      // Analisado e sem informação — diferente de nunca investigado.
      "fixture-b": { 0: "CONFIRMADO", 1: "CONFIRMADO", 2: "NAO_INFORMADO" },
      // Não confirmado: nunca vira "incompatível" no texto.
      "fixture-c": { 0: "CONFIRMADO", 1: "NAO_CONFIRMADO", 2: "CONFIRMADO" },
    };
    for (const [key, porIndice] of Object.entries(mapasDoProfissional)) {
      const linhas = Object.entries(porIndice).map(([indice, status]) => ({
        professional_profile_id: professionalIds[key]!,
        subcriterion_id: idPorCodigo.get(codigos[Number(indice)]!)!,
        status,
      }));
      const { error } = await service.from("professional_subcriterion_map").upsert(linhas, {
        onConflict: "professional_profile_id,subcriterion_id",
      });
      if (error) throw new Error(error.message);
    }

    await curadoria.saveSelection(
      curador.client,
      caseId,
      priorityProfileId,
      curador.userId,
      "Os três cobrem a área exigida por caminhos diferentes.",
      (["fixture-a", "fixture-b", "fixture-c"] as const).map((key) => ({
        professionalProfileId: professionalIds[key]!,
        rationale: "Área compatível declarada.",
      })),
    );
  }, 150_000);

  afterAll(async () => {
    await cleanupCuradoriaCertificationFixture(service);
    if (pacienteProfileId) {
      await service.from("patient_stories").delete().eq("profile_id", pacienteProfileId);
      await service.from("patient_profiles").delete().eq("profile_id", pacienteProfileId);
      await service.from("user_roles").delete().eq("profile_id", pacienteProfileId);
      await service.auth.admin.deleteUser(pacienteProfileId);
    }
  }, 60_000);

  let reportId: string;

  it("gera o rascunho a partir dos contratos reais e o persiste marcado como assistido", async () => {
    const { reportId: id, draft } = await generateAndSaveAssistedDraft(curador.client, {
      caseId,
      priorityProfileId,
    });
    reportId = id;

    expect(draft.options).toHaveLength(3);

    const lifecycle = await getReportLifecycle(curador.client, (await curadoria.getSelection(curador.client, priorityProfileId))!.id);
    expect(lifecycle!.assistedGeneratedAt).toBeTruthy();
    expect(lifecycle!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(lifecycle!.approvedAt).toBeNull();
    expect(lifecycle!.emittedAt).toBeNull();

    // As narrativas persistidas são distintas e falam a língua oficial. A
    // distinção vem do conjunto (relação com os cruzamentos + pontos de
    // atenção) — justificativas podem coincidir quando as âncoras de maior
    // peso são as mesmas, e isso é honestidade, não defeito.
    const { data: opcoes } = await service
      .from("curadoria_report_options")
      .select("justification, relation_to_weights, attention_points, suggested_questions, professional_profile_id")
      .eq("report_id", reportId);
    expect(opcoes).toHaveLength(3);
    const textos = (opcoes ?? []).map(
      (o) => `${o.relation_to_weights} ${(o.attention_points as string[]).join(" ")}`,
    );
    expect(new Set(textos).size).toBe(3);

    // O dossiê B tem um item ANALISADO e sem informação — a frase precisa
    // dizer isso, e não "ainda não foi investigado".
    const b = (opcoes ?? []).find((o) => o.professional_profile_id === professionalIds["fixture-b"])!;
    expect((b.attention_points as string[]).join(" ")).toContain(
      "não há informação suficiente disponível",
    );
    expect((b.suggested_questions as string[]).join(" ")).toContain("vale confirmar na conversa");

    // O dossiê C tem um item não confirmado — que nunca vira "incompatível".
    const c = (opcoes ?? []).find((o) => o.professional_profile_id === professionalIds["fixture-c"])!;
    expect((c.attention_points as string[]).join(" ")).toContain(
      "não foi confirmada para o profissional",
    );
    expect((c.attention_points as string[]).join(" ")).not.toMatch(/incompatível/i);

    // E nenhum texto do Relatório fala em pontos.
    expect(textos.join(" ")).not.toMatch(/pontos?|orçamento/i);
  });

  it("B-2 — o que o gerador grava na abertura é exatamente o que a guarda de emissão recusa", async () => {
    // Acoplamento gerador↔guarda à prova de deriva (ADR-064): a abertura do
    // Relatório sai do gerador como texto de trabalho interno, e a mesma
    // constante que a escreveu é a que a emissão procura. Se um dos dois lados
    // mudar sozinho, este teste cai antes de a paciente ler o bastidor.
    const { data: relatorio } = await service
      .from("curadoria_reports")
      .select("composition_rationale")
      .eq("id", reportId)
      .single();
    expect(relatorio!.composition_rationale).toBe(FRASE_COMPOSICAO_RASCUNHO);
    expect(composicaoPendenteDoCurador(relatorio!.composition_rationale as string)).toBe(
      "DO_SISTEMA",
    );
  });

  it("um rascunho assistido não pode ser emitido — o banco exige aprovação", async () => {
    await expect(reports.emitReport(curador.client, reportId)).rejects.toThrow(/aprovacao previa/);
  });

  it("edição do Curador marca revisão, e regenerar sobre ela exige força explícita", async () => {
    await reports.markReportReviewed(curador.client, reportId, curador.userId);

    await expect(
      generateAndSaveAssistedDraft(curador.client, { caseId, priorityProfileId }),
    ).rejects.toThrow(/Regenerar substituiria o texto/);

    // Com força explícita, regenera — e a revisão volta a zero.
    const { reportId: mesmo } = await generateAndSaveAssistedDraft(curador.client, {
      caseId,
      priorityProfileId,
      force: true,
    });
    expect(mesmo).toBe(reportId);
  });

  it("aprovar exige Curador e destrava a emissão; emitido, o documento congela", async () => {
    await reports.approveReport(curador.client, reportId, curador.userId);
    await reports.emitReport(curador.client, reportId);

    const lifecycle = await getReportLifecycle(
      curador.client,
      (await curadoria.getSelection(curador.client, priorityProfileId))!.id,
    );
    expect(lifecycle!.approvedBy).toBe(curador.userId);
    expect(lifecycle!.emittedAt).toBeTruthy();

    // Conteúdo congelado: nem texto, nem opções, nem regeneração.
    const { error: conteudo } = await service
      .from("curadoria_reports")
      .update({ composition_rationale: "Tentativa de reescrita pós-emissão." })
      .eq("id", reportId);
    expect(conteudo).not.toBeNull();
    expect(conteudo!.message).toContain("congelado");

    const { error: opcao } = await service
      .from("curadoria_report_options")
      .delete()
      .eq("report_id", reportId);
    expect(opcao).not.toBeNull();

    await expect(
      generateAndSaveAssistedDraft(curador.client, { caseId, priorityProfileId, force: true }),
    ).rejects.toThrow(/congelado/);
  });
});
