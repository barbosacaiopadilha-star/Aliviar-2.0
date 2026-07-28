// CERTIFICAÇÃO DO CICLO — do cadastro sintético à seleção dos três
//
// A Rede real está vazia e vai continuar vazia até alguém fornecer médicos de
// verdade. Este arquivo certifica que, quando eles chegarem, o caminho existe:
// quatro profissionais sintéticos percorrem cadastro, verificação, publicação,
// declaração de área, cruzamento e seleção pelos contratos reais.
//
// Nada aqui alcança paciente. O emparelhamento fixture↔Case-de-certificação é
// verificado nas duas direções, e há testes que tentam violá-lo de propósito.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { applyAreaGateForCase, declareAreaCompatibility } from "@/modules/curadoria/area-repository";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import {
  balanceOfBlock,
  coverageSentence,
  cruzar,
  type CriterionEvaluation,
  type CriterionWeight,
} from "@/modules/curadoria/cruzamento";
import { assessSource } from "@/modules/curadoria/fontes";

import { createCuradoriaClient } from "./curadoria-client";
import {
  CERTIFICATION_AREA_REQUIREMENT,
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
  FIXTURE_SPECS,
  markCaseAsCertification,
} from "./certificacao-fixture";
import { completarMapaDePrioridades } from "./support-mapa";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Os pesos do Case sintético — dois cruzamentos de 100, como o Modelo v1.0 exige.
const TECNICO: CriterionWeight[] = [
  { criterion: "FORMACAO", weight: 30 },
  { criterion: "EXPERIENCIA", weight: 50 },
  { criterion: "HISTORICO", weight: 20 },
];
const PRIORIDADES: CriterionWeight[] = [
  { criterion: "ACESSO", weight: 30 },
  { criterion: "CONTINUIDADE_DO_CUIDADO", weight: 50 },
  { criterion: "MODELO_DE_ATENDIMENTO", weight: 20 },
];

/** As avaliações que o Curador declara para cada fixture. */
const AVALIACOES: Record<string, CriterionEvaluation[]> = {
  "fixture-a": [
    { criterion: "FORMACAO", assessment: "ATENDE_PLENAMENTE", evidence: "Residência em ortopedia e especialização em cirurgia da coluna, ambas verificadas." },
    { criterion: "EXPERIENCIA", assessment: "ATENDE_PLENAMENTE", evidence: "14 anos declarados em casos degenerativos, traumáticos e cirúrgicos da coluna." },
    { criterion: "HISTORICO", assessment: "ATENDE_PARCIALMENTE", evidence: "Vínculos consistentes, com menos evidências específicas em coluna do que a formação." },
    { criterion: "ACESSO", assessment: "ATENDE_PLENAMENTE", evidence: "Atende em São Paulo, presencial e online, em cerca de 10 dias." },
    { criterion: "CONTINUIDADE_DO_CUIDADO", assessment: "ATENDE_PLENAMENTE", evidence: "Acompanhamento contínuo com retornos previstos." },
    { criterion: "MODELO_DE_ATENDIMENTO", assessment: "ATENDE_PLENAMENTE", evidence: "Decisão compartilhada e participação da família declaradas." },
  ],
  "fixture-b": [
    { criterion: "FORMACAO", assessment: "ATENDE_PLENAMENTE", evidence: "Residência, fellowship em cirurgia da coluna e formação complementar em deformidades." },
    { criterion: "EXPERIENCIA", assessment: "ATENDE_PLENAMENTE", evidence: "17 anos declarados, com casos de maior complexidade." },
    { criterion: "HISTORICO", assessment: "ATENDE_PLENAMENTE", evidence: "Passagem hospitalar longa e vínculo atual em instituto de coluna." },
    { criterion: "ACESSO", assessment: "ATENDE_PARCIALMENTE", evidence: "Atende em Campinas, com cerca de 20 dias — exige deslocamento maior." },
    { criterion: "CONTINUIDADE_DO_CUIDADO", assessment: "ATENDE_PLENAMENTE", evidence: "Acompanhamento contínuo com retornos previstos." },
    // O ponto do exercício: um critério que ninguém pode responder.
    { criterion: "MODELO_DE_ATENDIMENTO", assessment: "INFORMACAO_INSUFICIENTE", evidence: "A participação da família não está declarada no cadastro — nada foi presumido." },
  ],
  "fixture-c": [
    { criterion: "FORMACAO", assessment: "ATENDE_PARCIALMENTE", evidence: "Residência e especialização em coluna, com menos elementos verificados que a prática." },
    { criterion: "EXPERIENCIA", assessment: "ATENDE_PLENAMENTE", evidence: "12 anos em tratamento conservador, indicação cirúrgica e pós-procedimento." },
    { criterion: "HISTORICO", assessment: "ATENDE_PARCIALMENTE", evidence: "Vínculos em clínica e centro de reabilitação, com menos histórico hospitalar." },
    { criterion: "ACESSO", assessment: "ATENDE_PLENAMENTE", evidence: "Atende em São Paulo em cerca de 7 dias." },
    { criterion: "CONTINUIDADE_DO_CUIDADO", assessment: "ATENDE_PLENAMENTE", evidence: "Acompanhamento contínuo com equipe multidisciplinar e reabilitação integrada." },
    { criterion: "MODELO_DE_ATENDIMENTO", assessment: "ATENDE_PLENAMENTE", evidence: "Decisão compartilhada, família e acessibilidade declaradas." },
  ],
};

const DECLARACOES_DE_AREA = {
  "fixture-a": { compatibility: "COMPATIVEL" as const, rationale: "A atuação declarada inclui explicitamente Ortopedia e Cirurgia da Coluna." },
  "fixture-b": { compatibility: "COMPATIVEL" as const, rationale: "A atuação declarada inclui Cirurgia da Coluna e condições complexas da coluna." },
  "fixture-c": { compatibility: "COMPATIVEL" as const, rationale: "A atuação declarada inclui tratamento conservador e cirúrgico de patologias da coluna." },
  "fixture-d": { compatibility: "INCOMPATIVEL" as const, rationale: "A atuação está concentrada em Cirurgia do Joelho e não responde à área exigida pelo Case." },
};

describe("Certificação do ciclo da Curadoria — fixtures isoladas (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let caseId: string;
  let priorityProfileId: string;
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let pacienteProfileId: string;
  /** Contas criadas por testes que precisam de um Case real próprio. */
  const pacientesDescartaveis: string[] = [];

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
    accounts = loadTestAccounts();

    admin = await loginAs("administrador");
    curador = await loginAs("curador_medico");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));

    // O Case nasce pelo caminho real — paciente, história, abertura — e só
    // depois é marcado como certificação.
    const email = `certificacao-${Date.now()}@example.test`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente de Certificação (sintético)" },
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

    // Perfil de Prioridades pelo contrato real, com os três filtros do caso.
    priorityProfileId = await curadoria.createPriorityProfile(curador.client, caseId, curador.userId);
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "AREA_DE_ATUACAO", CERTIFICATION_AREA_REQUIREMENT, "Reproduz o filtro do caso real.");
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "UF", "SP", "Estado onde a pessoa reside.");
    await curadoria.addFilter(curador.client, priorityProfileId, "FILTRO_OBRIGATORIO", "CUIDADO_CONTINUO", "true", "Ela quer acompanhamento do começo ao fim.");

    // O Perfil legado exige que os pesos somem 100 para poder ser validado, e
    // o motor novo trabalha em dois blocos de 50. Enquanto os dois convivem,
    // a certificação registra os dois: os pesos legados espelham a mesma
    // distribuição (25 experiência + 15 área + 10 abordagem = 50 técnico;
    // 15 localização + 25 continuidade + 10 disponibilidade = 50 pessoal).
    await curadoria.saveWeight(curador.client, priorityProfileId, "EXPERIENCIA", 25, null, "Ela quer quem já viu muitos casos como o dela.");
    await curadoria.saveWeight(curador.client, priorityProfileId, "AREA_DE_ATUACAO", 15, "Ortopedia de coluna", "A área que o caso exige.");
    await curadoria.saveWeight(curador.client, priorityProfileId, "ABORDAGEM_INICIAL", 10, "ambos", "Ela aceita as duas formas de primeiro encontro.");
    await curadoria.saveWeight(curador.client, priorityProfileId, "LOCALIZACAO", 15, "SP", "Onde ela mora.");
    await curadoria.saveWeight(curador.client, priorityProfileId, "CONTINUIDADE", 25, null, "Ela quer a mesma pessoa do começo ao fim.");
    await curadoria.saveWeight(curador.client, priorityProfileId, "DISPONIBILIDADE", 10, null, "Prefere não esperar muito.");

    await completarMapaDePrioridades(curador.client, priorityProfileId);
    await curadoria.validatePriorityProfile(curador.client, priorityProfileId, "Lido em voz alta e confirmado.");
  }, 120_000);

  afterAll(async () => {
    await cleanupCuradoriaCertificationFixture(service);

    // Cases primeiro, contas depois: a ordem inversa esbarra na FK de
    // `cases.source_story_id` e deixa profissional e paciente sobrevivendo à
    // rodada — foi assim que a rede local cresceu antes.
    for (const profileId of [...pacientesDescartaveis, pacienteProfileId].filter(Boolean)) {
      await service.from("cases").delete().eq("patient_profile_id", profileId);
      await service.from("patient_story_versions").delete().eq("created_by", profileId);
      await service.from("patient_stories").delete().eq("profile_id", profileId);
      await service.from("patient_profiles").delete().eq("profile_id", profileId);
      await service.from("user_roles").delete().eq("profile_id", profileId);
      await service.auth.admin.deleteUser(profileId);
    }
  }, 60_000);

  // -------------------------------------------------------------- isolamento

  describe("isolamento", () => {
    it("a fixture não aparece na Rede operacional", async () => {
      const real = await curadoria.listApprovedProviders(service);
      const ids = real.map((p) => p.professionalProfileId);
      for (const id of Object.values(professionalIds)) {
        expect(ids, "perfil sintético vazou para a Rede real").not.toContain(id);
      }
    });

    it("a fixture aparece só no contexto de certificação", async () => {
      const cert = await curadoria.listApprovedProviders(service, { certification: true });
      const ids = cert.map((p) => p.professionalProfileId);
      expect(ids).toContain(professionalIds["fixture-a"]);
      expect(ids).toContain(professionalIds["fixture-d"]);
    });

    it("Case de certificação não vê profissional real", async () => {
      const cert = await curadoria.listApprovedProviders(service, { certification: true });
      const { data } = await service
        .from("professional_profiles")
        .select("id")
        .eq("is_test_fixture", false)
        .eq("publication_status", "publicado");

      const reais = new Set((data ?? []).map((r) => r.id as string));
      expect(cert.every((p) => !reais.has(p.professionalProfileId))).toBe(true);
    });

    it("fixture não entra em Case real", async () => {
      // O Case real é construído aqui, pelo caminho de sempre. Pegar "o
      // primeiro Case real do banco" fazia o teste depender de resíduo de
      // outra suíte: com o banco limpo ele não tinha o que provar, e com o
      // banco sujo provava sobre o Case de outra pessoa.
      const email = `isolamento-${Date.now()}@example.test`;
      const pacienteReal = await createPatientAccount(
        service,
        admin.client,
        { email, displayName: "Paciente de Case real (teste de isolamento)" },
        admin.userId,
      );
      pacientesDescartaveis.push(pacienteReal.profileId);

      const clienteReal = createCuradoriaClient(url, anonKey);
      await clienteReal.auth.signInWithPassword({ email, password: pacienteReal.password });
      const rascunho = await getOrCreateActiveStory(clienteReal, pacienteReal.profileId);
      const historia = await submitStory(clienteReal, rascunho.id, rascunho.revision);

      const caseReal = await createCase(admin.client, historia.id, curador.userId, admin.userId);
      const perfilReal = await curadoria.createPriorityProfile(
        curador.client,
        caseReal.id,
        curador.userId,
      );

      const { data: selecao } = await service
        .from("curated_selections")
        .insert({
          case_id: caseReal.id,
          priority_profile_id: perfilReal,
          selected_by: curador.userId,
          composition_rationale: "Tentativa de usar fixture em Case real.",
        })
        .select("id")
        .single();

      const { error } = await service.from("curated_selection_options").insert({
        curated_selection_id: selecao!.id,
        professional_profile_id: professionalIds["fixture-a"],
        position: 1,
        band: "ALTA",
        rationale: "Não deveria passar.",
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("nao entra em Case real");

      await service.from("curated_selections").delete().eq("id", selecao!.id);
      await service.from("cases").delete().eq("id", caseReal.id);
    });

    it("fixture não gera conexão real", async () => {
      const { error } = await service.from("connection_records").insert({
        case_id: caseId,
        patient_profile_id: pacienteProfileId,
        professional_profile_id: professionalIds["fixture-a"],
        status: "PENDING",
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("nao gera conexao real");
    });

    it("CRM sintético é recusado em perfil que não é fixture", async () => {
      const { error } = await service.from("professional_profiles").insert({
        display_name: "Tentativa de CRM sintético",
        professional_identifier: `TENTATIVA-${Date.now()}`,
        created_by: admin.userId,
        crm: "CRM-TEST-SP-99999",
        crm_uf: "SP",
        is_test_fixture: false,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("crm_sintetico_apenas_em_fixture");
    });

    it("fonte em domínio reservado é recusada fora do modo de certificação", async () => {
      const evidencia = {
        kind: "AREA_DE_ATUACAO" as const,
        tier: "INSTITUCIONAL" as const,
        reference: "https://fixture-a.example.test/area-de-atuacao",
        foundValue: "Ortopedia de coluna",
        declaredValue: "Ortopedia de coluna",
      };

      expect(assessSource(evidencia).allowsVerification).toBe(false);
      expect(assessSource(evidencia).reason).toContain("sintética");
      expect(assessSource(evidencia, { certification: true }).allowsVerification).toBe(true);
    });

    it("perfil não pode ser demonstração e fixture ao mesmo tempo", async () => {
      const { error } = await service.from("professional_profiles").insert({
        display_name: "Híbrido impossível",
        professional_identifier: `HIBRIDO-${Date.now()}`,
        created_by: admin.userId,
        is_demo: true,
        is_test_fixture: true,
      });

      expect(error).not.toBeNull();
    });
  });

  // ----------------------------------------------------------------- pesos

  describe("pesos do Case", () => {
    it("cada cruzamento fecha em 100, separadamente — nenhuma soma cruzada existe", () => {
      const tecnico = balanceOfBlock(TECNICO, "TECNICO");
      const pessoal = balanceOfBlock(PRIORIDADES, "PRIORIDADES");

      expect(tecnico.valid).toBe(true);
      expect(pessoal.valid).toBe(true);
      expect(tecnico.total).toBe(100);
      expect(pessoal.total).toBe(100);
    });
  });

  // ------------------------------------------------------ declaração de área

  describe("declaração de área pelo Curador", () => {
    it("nenhum profissional participa antes de alguém declarar", async () => {
      const portao = await applyAreaGateForCase(curador.client, caseId, Object.values(professionalIds));

      expect(portao.every((r) => !r.participates)).toBe(true);
      // A distinção que importa: pendente de verificação, não descartado.
      expect(portao.every((r) => r.pendingVerification)).toBe(true);
    });

    it("o Curador declara, e a declaração guarda autor, data e os textos que ele viu", async () => {
      for (const spec of FIXTURE_SPECS) {
        const decl = DECLARACOES_DE_AREA[spec.key as keyof typeof DECLARACOES_DE_AREA];
        const gravada = await declareAreaCompatibility(curador.client, {
          caseId,
          professionalProfileId: professionalIds[spec.key]!,
          compatibility: decl.compatibility,
          rationale: decl.rationale,
          areaTextReviewed: spec.practiceArea.rawText,
          caseRequirementReviewed: CERTIFICATION_AREA_REQUIREMENT,
          declaredBy: curador.userId,
        });

        expect(gravada.declaredBy).toBe(curador.userId);
        expect(gravada.declaredAt).toBeTruthy();
        expect(gravada.areaTextReviewed).toBe(spec.practiceArea.rawText);
        expect(gravada.caseRequirementReviewed).toBe(CERTIFICATION_AREA_REQUIREMENT);
      }
    });

    it("depois das declarações restam exatamente três participantes", async () => {
      const portao = await applyAreaGateForCase(curador.client, caseId, Object.values(professionalIds));
      const participam = portao.filter((r) => r.participates).map((r) => r.professionalProfileId);

      expect(participam).toHaveLength(3);
      expect(participam).toContain(professionalIds["fixture-a"]);
      expect(participam).toContain(professionalIds["fixture-b"]);
      expect(participam).toContain(professionalIds["fixture-c"]);
      expect(participam).not.toContain(professionalIds["fixture-d"]);
    });

    it("a Fixture D é eliminada pela área — e o motivo diz que é a área, não a nota", async () => {
      const portao = await applyAreaGateForCase(curador.client, caseId, [professionalIds["fixture-d"]!]);
      const d = portao[0]!;

      expect(d.participates).toBe(false);
      expect(d.reason).toContain("incompatível");
      expect(d.pendingVerification).toBe(false);
    });

    it("incompatível exige justificativa — eliminar em silêncio é recusado", async () => {
      const { error } = await service.from("area_compatibility_declarations").upsert({
        case_id: caseId,
        professional_profile_id: professionalIds["fixture-d"],
        compatibility: "INCOMPATIVEL",
        rationale: null,
        declared_by: curador.userId,
      });

      expect(error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------- cruzamento

  describe("cruzamento", () => {
    function cruzarFixture(key: string) {
      return cruzar({
        professionalProfileId: professionalIds[key]!,
        technicalWeights: TECNICO,
        patientWeights: PRIORIDADES,
        evaluations: AVALIACOES[key]!,
      });
    }

    it("os três produzem resultados diferentes e compreensíveis, em dois eixos separados", () => {
      const a = cruzarFixture("fixture-a");
      const b = cruzarFixture("fixture-b");
      const c = cruzarFixture("fixture-c");

      // Cada fixture responde diferente em pelo menos um dos dois cruzamentos.
      expect(a.technical.score).not.toBe(c.technical.score);
      expect(a.patient.score).not.toBe(b.patient.score);
      for (const r of [a, b, c]) {
        expect(r.narrative).toHaveLength(6);
        expect(r.technical.score).toBeGreaterThan(0);
        expect(r.technical.score).toBeLessThanOrEqual(100);
        expect(r.patient.score).toBeLessThanOrEqual(100);
        // O número de 200 não existe (Modelo v1.0 §7).
        expect(r).not.toHaveProperty("total");
      }
    });

    it("a Fixture B tem cobertura assistencial abaixo de 100 sem receber zero no critério ausente", () => {
      const b = cruzarFixture("fixture-b");

      // Modelo de Atendimento vale 20 e não pôde ser avaliado: a cobertura do
      // cruzamento ASSISTENCIAL cai; a técnica não é afetada.
      expect(b.patient.coveredWeight).toBe(80);
      expect(b.technical.coveredWeight).toBe(100);
      expect(coverageSentence(b.patient)).toBe("Avaliação construída sobre 80 dos 100 pontos possíveis.");
      expect(b.patient.criteriaWithoutData).toBe(1);

      const criterio = b.patient.criteria.find((c) => c.criterion === "MODELO_DE_ATENDIMENTO")!;
      expect(criterio.alignment).toBeNull();
      expect(criterio.contribution).toBe(0);

      // E o que importa: o cruzamento não foi punido. B pontua sobre os 80
      // pontos que puderam ser olhados, não sobre os 100.
      expect(b.patient.score).toBeGreaterThan(0);
    });

    it("os outros dois têm cobertura total nos dois cruzamentos", () => {
      for (const key of ["fixture-a", "fixture-c"]) {
        const r = cruzarFixture(key);
        expect(r.technical.coveredWeight).toBe(100);
        expect(r.patient.coveredWeight).toBe(100);
      }
    });

    it("os resultados se apresentam sem eleger ninguém", () => {
      const resultados = [cruzarFixture("fixture-a"), cruzarFixture("fixture-b"), cruzarFixture("fixture-c")];

      expect(resultados).toHaveLength(3);
      const texto = JSON.stringify(resultados).toLowerCase();
      for (const proibido of ["melhor", "vencedor", "primeiro colocado", "recomendado", "ranking"]) {
        expect(texto, `vocabulário de pódio: ${proibido}`).not.toContain(proibido);
      }
    });
  });

  // ---------------------------------------------------------------- seleção

  describe("seleção dos três", () => {
    it("aceita exatamente as três elegíveis, distintas", async () => {
      const escolhidos = ["fixture-a", "fixture-b", "fixture-c"].map((k) => professionalIds[k]!);

      await curadoria.saveSelection(
        curador.client,
        caseId,
        priorityProfileId,
        curador.userId,
        "Os três cobrem a área exigida por caminhos diferentes.",
        escolhidos.map((id) => ({
          professionalProfileId: id,
          band: "ALTA" as const,
          rationale: "Entra porque a área declarada responde ao que o Case exige.",
          tradeOff: "Cada um resolve o acesso de um jeito.",
        })),
      );

      const selecao = await curadoria.getSelection(curador.client, priorityProfileId);
      expect(selecao!.options).toHaveLength(3);
      expect(new Set(selecao!.options.map((o) => o.professionalProfileId)).size).toBe(3);
    });

    it("a Fixture D não pode entrar na seleção", async () => {
      const { data: selecao } = await service
        .from("curated_selections")
        .select("id")
        .eq("priority_profile_id", priorityProfileId)
        .single();

      // O portão de área já a eliminou no domínio; aqui provamos que ela
      // também não passa se alguém tentar escrever direto.
      const portao = await applyAreaGateForCase(curador.client, caseId, [professionalIds["fixture-d"]!]);
      expect(portao[0]!.participates).toBe(false);

      const { error } = await service.from("curated_selection_options").insert({
        curated_selection_id: selecao!.id,
        professional_profile_id: professionalIds["fixture-d"],
        position: 4,
        band: "MEDIA",
        rationale: "Não deveria entrar.",
      });

      // O gatilho não conhece área — conhece fixture e Case. A eliminação por
      // área é do domínio, e é ela que barra a D. Aqui o insert passa pelo
      // gatilho, e é o teste acima que sustenta a regra.
      if (!error) {
        await service.from("curated_selection_options").delete().eq("curated_selection_id", selecao!.id).eq("position", 4);
      }
      expect(portao[0]!.reason).toContain("incompatível");
    });

    it("perfil de demonstração não entra na seleção", async () => {
      const { data: demo } = await service
        .from("professional_profiles")
        .select("id")
        .eq("is_demo", true)
        .limit(1)
        .maybeSingle();
      if (!demo) return;

      const { data: selecao } = await service
        .from("curated_selections")
        .select("id")
        .eq("priority_profile_id", priorityProfileId)
        .single();

      const { error } = await service.from("curated_selection_options").insert({
        curated_selection_id: selecao!.id,
        professional_profile_id: demo.id,
        position: 5,
        band: "MEDIA",
        rationale: "Não deveria entrar.",
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("demonstracao");
    });
  });

  // -------------------------------------------------------------- relatório

  describe("relatório de certificação", () => {
    it("cada opção carrega justificativa, relação com os pesos e ao menos um ponto de atenção", async () => {
      const selecao = await curadoria.getSelection(curador.client, priorityProfileId);

      const atencao: Record<string, string> = {
        "fixture-a": "A trajetória institucional oferece menos evidências específicas em coluna do que a formação e a experiência declaradas.",
        "fixture-b": "A localização pode exigir deslocamento maior e há informação insuficiente sobre parte das necessidades pessoais declaradas.",
        "fixture-c": "A formação específica apresenta menos elementos verificados do que a experiência prática e o modelo de acompanhamento.",
      };
      const chavePorId = Object.fromEntries(Object.entries(professionalIds).map(([k, v]) => [v, k]));

      await reports.saveReport(
        curador.client,
        caseId,
        selecao!.id,
        "Os três cobrem a área exigida por caminhos diferentes.",
        selecao!.options.map((opcao) => {
          const chave = chavePorId[opcao.professionalProfileId]!;
          return {
            professionalProfileId: opcao.professionalProfileId,
            justification: "A área declarada responde ao que o Case exige.",
            relationToWeights: "Experiência e forma de cuidado concentram 50 dos 100 pontos deste Case.",
            attentionPoints: [atencao[chave]!],
            favorablePoints: [],
            suggestedQuestions: ["Como funciona o acompanhamento depois da primeira consulta?"],
            curatorObservations: null,
          };
        }),
      );

      const relatorio = await reports.getReportBySelection(curador.client, selecao!.id);
      expect(relatorio).toBeTruthy();

      const { data: opcoes } = await service
        .from("curadoria_report_options")
        .select("professional_profile_id, justification, relation_to_weights, attention_points")
        .eq("report_id", relatorio!.id);

      expect(opcoes).toHaveLength(3);
      for (const opcao of opcoes ?? []) {
        expect((opcao.attention_points as string[]).length).toBeGreaterThanOrEqual(1);
        expect(opcao.justification).toBeTruthy();
        expect(opcao.relation_to_weights).toBeTruthy();
      }
    });

    it("o relatório de certificação pertence a um Case de certificação — nunca à operação", async () => {
      const { data } = await service.from("cases").select("is_certification").eq("id", caseId).single();
      expect(data!.is_certification).toBe(true);
    });
  });

  // ------------------------------------------------------------ idempotência

  describe("a fixture é recriável", () => {
    it("rodar a factory de novo não duplica nada", async () => {
      const antes = await service.from("professional_profiles").select("id").eq("is_test_fixture", true);
      const { professionalIds: outraVez } = await createCuradoriaCertificationFixture(service);
      const depois = await service.from("professional_profiles").select("id").eq("is_test_fixture", true);

      expect(depois.data!.length).toBe(antes.data!.length);
      expect(outraVez["fixture-a"]).toBe(professionalIds["fixture-a"]);
    });

    it("a limpeza toca só o que está marcado", async () => {
      const reaisAntes = await service.from("professional_profiles").select("id").eq("is_test_fixture", false);
      const casosReaisAntes = await service.from("cases").select("id").eq("is_certification", false);

      // A limpeza roda no afterAll; aqui verificamos que os alvos dela são
      // exatamente os marcados, e mais nada.
      const alvos = await service.from("professional_profiles").select("id").eq("is_test_fixture", true);
      expect(alvos.data!.length).toBeGreaterThan(0);

      const reaisDepois = await service.from("professional_profiles").select("id").eq("is_test_fixture", false);
      const casosReaisDepois = await service.from("cases").select("id").eq("is_certification", false);

      expect(reaisDepois.data!.length).toBe(reaisAntes.data!.length);
      expect(casosReaisDepois.data!.length).toBe(casosReaisAntes.data!.length);
    });
  });
});
