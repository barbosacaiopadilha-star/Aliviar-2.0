// PROTOCOLOS OFICIAIS — contra o banco real.
//
// Quatro blocos, na ordem do risco:
//   1. o fluxo do profissional: rascunho → retomada → submissão → evidência
//      SEMPRE nao_verificado, com autoria e fonte de autodeclaração;
//   2. o fluxo da pessoa: direto nasce reconhecido, tradução nasce pendente e
//      só vira algo pelo ato dela — reconhecer, corrigir ou recusar;
//   3. a separação Base × Case (Etapa 7): evidência não tem case_id,
//      julgamento tem, os dois Cases concluem diferente sobre o MESMO
//      profissional, e nenhum lado reescreve o outro;
//   4. as guardas do Motor (Etapa 8): a virada do Catálogo 1.0.0 aconteceu —
//      os conceitos novos ESTÃO no catálogo ativo, os aposentados saíram, e
//      case_needs continua sem ser entrada do Motor.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { declareCriterion } from "@/modules/curadoria/mesa-cruzamento";
import { listSubcriterionCatalog } from "@/modules/curadoria/mapa-prioridades-repository";
import { loadCurrentPracticeEvidence } from "@/modules/curadoria/evidencias-pratica-repository";
import {
  acknowledgePersonNeed,
  loadCaseNeeds,
  loadProtocolDraft,
  registerPersonNeed,
  saveProtocolDraft,
  submitProfessionalProtocol,
} from "@/modules/curadoria/protocolos-repository";

import { createCuradoriaClient } from "./curadoria-client";
import {
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
} from "./certificacao-fixture";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const NOVOS_CODIGOS_1_0_0 = [
  "CONTINUIDADE_CANAIS",
  "PRATICA_LIMITES_DE_ATUACAO",
  "EXPERIENCIA_NO_TIPO_DE_CASO",
  "HISTORICO_ATIVIDADE_ACADEMICA",
  "HISTORICO_AREAS_DE_ATUACAO",
  "ACESSO_LOCAL_DE_ATENDIMENTO",
  "VIABILIDADE_COBERTURA_E_CONVENIO",
  "VIABILIDADE_CUSTO_E_PAGAMENTO",
];

describe("Protocolos Oficiais (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let alvo: string;
  let caseA: string;
  let caseB: string;
  const pacientes: string[] = [];

  async function loginAs(role: string) {
    const account = accounts.find((entry) => entry.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function criarCase(rotulo: string): Promise<string> {
    const email = `protocolos-${rotulo}-${Date.now()}@example.test`;
    const conta = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: `Paciente Protocolos ${rotulo} (sintético)` },
      admin.userId,
    );
    pacientes.push(conta.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: conta.password });
    const draft = await getOrCreateActiveStory(patientClient, conta.profileId);
    const story = await submitStory(patientClient, draft.id, draft.revision);
    const kase = await createCase(admin.client, story.id, curador.userId, admin.userId);
    return kase.id;
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));

    admin = await loginAs("administrador");
    curador = await loginAs("curador_medico");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));
    alvo = professionalIds["fixture-b"]!;

    await service.from("practice_evidence").delete().in("professional_profile_id", Object.values(professionalIds));
    await service.from("practice_protocol_drafts").delete().in("professional_profile_id", Object.values(professionalIds));

    caseA = await criarCase("a");
    caseB = await criarCase("b");
  }, 120_000);

  afterAll(async () => {
    await cleanupCuradoriaCertificationFixture(service);
    for (const profileId of pacientes) {
      await service.from("patient_stories").delete().eq("profile_id", profileId);
      await service.from("patient_profiles").delete().eq("profile_id", profileId);
      await service.from("user_roles").delete().eq("profile_id", profileId);
      await service.auth.admin.deleteUser(profileId);
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  // 1. O fluxo do profissional
  // -------------------------------------------------------------------------

  it("rascunho salva parcial, retoma, e submete como autodeclaração nao_verificado", async () => {
    // Parcial: duas respostas de 28.
    await saveProtocolDraft(service, {
      professionalProfileId: alvo,
      responses: {
        ACESSO_MODALIDADE: {
          options: ["PRIMEIRA_REMOTA_CONDICIONADA"],
          details: {},
          conditionNote: "Após análise prévia da documentação",
          observation: null,
        },
      },
      updatedBy: admin.userId,
    });

    // Retomada: o que foi salvo volta.
    const retomado = await loadProtocolDraft(service, alvo);
    expect(Object.keys(retomado.responses)).toEqual(["ACESSO_MODALIDADE"]);
    expect(retomado.updatedAt).toBeTruthy();

    // Continua e completa mais uma.
    const respostas = {
      ...retomado.responses,
      CONTINUIDADE_CANAIS: {
        options: ["MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA"],
        details: {},
        conditionNote: null,
        observation: null,
      },
    };
    await saveProtocolDraft(service, { professionalProfileId: alvo, responses: respostas, updatedBy: admin.userId });

    // Submissão: evidência declarada, autoria e fonte de autodeclaração.
    const resultado = await submitProfessionalProtocol(service, {
      professionalProfileId: alvo,
      responses: respostas,
      collectedBy: admin.userId,
    });

    expect(resultado.rejected).toEqual([]);
    expect(resultado.registered).toHaveLength(2);
    for (const registro of resultado.registered) {
      expect(registro.status).toBe("nao_verificado");
      expect(registro.source).toContain("Autodeclaração");
      expect(registro.collectedBy).toBe(admin.userId);
    }
  }, 60_000);

  it("submissão com resposta inválida não grava NADA — não existe meio-termo", async () => {
    const antes = await service
      .from("practice_evidence")
      .select("id", { count: "exact", head: true })
      .eq("professional_profile_id", alvo);

    const resultado = await submitProfessionalProtocol(service, {
      professionalProfileId: alvo,
      responses: {
        ACESSO_DISPONIBILIDADE: { options: ["MANHA_DIAS_UTEIS"], details: {}, conditionNote: null, observation: null },
        VIABILIDADE_COBERTURA_E_CONVENIO: {
          options: ["CONVENIOS_SELECIONADOS"], // sem operadoras — inválido
          details: {},
          conditionNote: null,
          observation: null,
        },
      },
      collectedBy: admin.userId,
    });

    expect(resultado.registered).toEqual([]);
    expect(resultado.rejected).toHaveLength(1);
    expect(resultado.rejected[0]!.errors.join(" ")).toContain("operadoras");

    const depois = await service
      .from("practice_evidence")
      .select("id", { count: "exact", head: true })
      .eq("professional_profile_id", alvo);
    expect(depois.count).toBe(antes.count);
  });

  it("corrigir uma resposta depois da submissão cria versão nova declarada — a verificação anterior não sobrevive ao conteúdo novo", async () => {
    const segunda = await submitProfessionalProtocol(service, {
      professionalProfileId: alvo,
      responses: {
        CONTINUIDADE_CANAIS: {
          options: ["APENAS_REAGENDAMENTO"],
          details: {},
          conditionNote: null,
          observation: null,
        },
      },
      collectedBy: admin.userId,
    });

    expect(segunda.registered[0]!.version).toBe(2);
    expect(segunda.registered[0]!.status).toBe("nao_verificado");

    const { data } = await service
      .from("practice_evidence")
      .select("version, options")
      .eq("professional_profile_id", alvo)
      .eq("subcriterion_code", "CONTINUIDADE_CANAIS")
      .order("version");
    expect(data).toHaveLength(2);
    expect((data![0] as { options: string[] }).options).toEqual(["MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA"]);
    expect((data![1] as { options: string[] }).options).toEqual(["APENAS_REAGENDAMENTO"]);
  });

  // -------------------------------------------------------------------------
  // 2. O fluxo da pessoa
  // -------------------------------------------------------------------------

  it("resposta direta nasce reconhecida — a fala é dela", async () => {
    const registro = await registerPersonNeed(curador.client, {
      caseId: caseA,
      subcriterionCode: "ACESSO_MODALIDADE",
      options: ["PRECISO_REMOTO"],
      degree: "ESSENCIAL",
      flexibility: "Não aceita presencial",
      guidedText: null,
      origin: "DIRETO",
      proposedReading: null,
      declaredBy: curador.userId,
    });

    expect(registro.acknowledgment).toBe("RECONHECIDA");
    expect(registro.origin).toBe("DIRETO");
  });

  it("tradução nasce PENDENTE e só o ato dela a move — aqui, corrigindo", async () => {
    const registro = await registerPersonNeed(curador.client, {
      caseId: caseA,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      options: ["RETORNO_JA_MARCADO_AO_SAIR"],
      degree: "PESA_MUITO",
      flexibility: null,
      guidedText: null,
      origin: "TRADUCAO",
      proposedReading: "Pelo que você me contou, entendi que quer sair da consulta com o retorno marcado. É isso?",
      declaredBy: curador.userId,
    });
    expect(registro.acknowledgment).toBe("PENDENTE");

    await acknowledgePersonNeed(curador.client, {
      caseId: caseA,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      acknowledgment: "CORRIGIDA",
      correction: "Prefere retorno conforme a evolução, não data fixa.",
    });

    const necessidades = await loadCaseNeeds(curador.client, caseA);
    const retornos = necessidades.find((n) => n.subcriterionCode === "CONTINUIDADE_RETORNOS")!;
    expect(retornos.acknowledgment).toBe("CORRIGIDA");
    expect(retornos.correction).toContain("conforme a evolução");
    expect(retornos.proposedReading).toContain("Pelo que você me contou");
  });

  it("o domínio recusa o que o protocolo recusa", async () => {
    // Conceito técnico não tem lado da pessoa.
    await expect(
      registerPersonNeed(curador.client, {
        caseId: caseA,
        subcriterionCode: "FORMACAO_FELLOWSHIP",
        options: [],
        degree: "ESSENCIAL",
        flexibility: null,
        guidedText: null,
        origin: "DIRETO",
        proposedReading: null,
        declaredBy: curador.userId,
      }),
    ).rejects.toThrow(/não tem lado da pessoa/);

    // Texto guiado fora de P14.
    await expect(
      registerPersonNeed(curador.client, {
        caseId: caseA,
        subcriterionCode: "ACESSO_MODALIDADE",
        options: ["PREFIRO_REMOTO"],
        degree: "DESEJAVEL",
        flexibility: null,
        guidedText: "texto livre proibido aqui",
        origin: "DIRETO",
        proposedReading: null,
        declaredBy: curador.userId,
      }),
    ).rejects.toThrow(/P14/);

    // Tradução sem leitura proposta.
    await expect(
      registerPersonNeed(curador.client, {
        caseId: caseA,
        subcriterionCode: "MODELO_COMUNICACAO",
        options: ["ALGO_ESCRITO_PARA_LEVAR"],
        degree: "PESA_MUITO",
        flexibility: null,
        guidedText: null,
        origin: "TRADUCAO",
        proposedReading: null,
        declaredBy: curador.userId,
      }),
    ).rejects.toThrow(/leitura proposta/);

    // Reconhecer o que não é tradução: não há o que reconhecer.
    await expect(
      acknowledgePersonNeed(curador.client, {
        caseId: caseA,
        subcriterionCode: "ACESSO_MODALIDADE",
        acknowledgment: "RECONHECIDA",
      }),
    ).rejects.toThrow(/leitura traduzida/);
  });

  // -------------------------------------------------------------------------
  // 3. Separação Base × Case (Etapa 7)
  // -------------------------------------------------------------------------

  it("a fronteira está no schema: evidência NÃO tem case_id; necessidade e julgamento TÊM", async () => {
    // Selecionar case_id explicitamente falha na evidência permanente…
    const { error: evidenciaSemCase } = await service
      .from("practice_evidence")
      .select("case_id")
      .limit(1);
    expect(evidenciaSemCase).not.toBeNull();

    // …e funciona onde o Case é dono.
    const { error: needsTemCase } = await service.from("case_needs").select("case_id").limit(1);
    expect(needsTemCase).toBeNull();
    const { error: declaracaoTemCase } = await service
      .from("criterion_declarations")
      .select("case_id")
      .limit(1);
    expect(declaracaoTemCase).toBeNull();
  });

  it("a MESMA evidência serve a dois Cases — e os dois concluem DIFERENTE", async () => {
    // A leitura da Base independe de Case: mesma consulta, mesmo resultado.
    const evidencia = await loadCurrentPracticeEvidence(curador.client, [alvo]);
    const canais = evidencia.get(alvo)!.find((r) => r.subcriterionCode === "CONTINUIDADE_CANAIS")!;
    expect(canais.options).toEqual(["APENAS_REAGENDAMENTO"]);

    // Case A: para quem precisa de canal, o Curador conclui que não atende.
    await declareCriterion(curador.client, caseA, {
      professionalProfileId: alvo,
      criterion: "CONTINUIDADE_DO_CUIDADO",
      assessment: "NAO_ATENDE",
      evidence: "Ela precisa de canal entre consultas; a prática registrada é apenas reagendamento.",
      declaredBy: curador.userId,
    });

    // Case B: para quem não precisa, a mesma prática atende plenamente.
    await declareCriterion(curador.client, caseB, {
      professionalProfileId: alvo,
      criterion: "CONTINUIDADE_DO_CUIDADO",
      assessment: "ATENDE_PLENAMENTE",
      evidence: "Ela não precisa de contato entre consultas; reagendamento basta.",
      declaredBy: curador.userId,
    });

    const { data: julgamentos } = await service
      .from("criterion_declarations")
      .select("case_id, assessment")
      .eq("professional_profile_id", alvo)
      .eq("criterion", "CONTINUIDADE_DO_CUIDADO");

    const porCase = new Map((julgamentos ?? []).map((row) => [row.case_id, row.assessment]));
    expect(porCase.get(caseA)).toBe("NAO_ATENDE");
    expect(porCase.get(caseB)).toBe("ATENDE_PLENAMENTE");
  });

  it("nenhuma conclusão de Case volta para a Base; atualizar a Base não reescreve Cases", async () => {
    // As declarações acima não tocaram a Base.
    const { data: baseAntes } = await service
      .from("practice_evidence")
      .select("version")
      .eq("professional_profile_id", alvo)
      .eq("subcriterion_code", "CONTINUIDADE_CANAIS")
      .order("version", { ascending: false })
      .limit(1);
    expect((baseAntes![0] as { version: number }).version).toBe(2);

    // Atualizar a Base (versão 3)…
    await submitProfessionalProtocol(service, {
      professionalProfileId: alvo,
      responses: {
        CONTINUIDADE_CANAIS: {
          options: ["CONTATO_DE_URGENCIA_FORA_DO_HORARIO"],
          details: {},
          conditionNote: null,
          observation: null,
        },
      },
      collectedBy: admin.userId,
    });

    // …não reescreve o julgamento histórico de nenhum Case.
    const { data: julgamentos } = await service
      .from("criterion_declarations")
      .select("case_id, assessment")
      .eq("professional_profile_id", alvo)
      .eq("criterion", "CONTINUIDADE_DO_CUIDADO");
    const porCase = new Map((julgamentos ?? []).map((row) => [row.case_id, row.assessment]));
    expect(porCase.get(caseA)).toBe("NAO_ATENDE");
    expect(porCase.get(caseB)).toBe("ATENDE_PLENAMENTE");
  });

  // -------------------------------------------------------------------------
  // 4. Guardas do Motor (Etapa 8)
  // -------------------------------------------------------------------------

  it("a virada aconteceu: os conceitos novos do 1.0.0 estão no catálogo ATIVO, os aposentados saíram", async () => {
    // Antes da virada este teste provava o oposto (novos FORA, 26 ativos).
    // O Catálogo 1.0.0 é vigente (migrations 20260802100000/110000,
    // ADR-046/047): agora a guarda é que o universo do Motor seja EXATAMENTE
    // o aprovado — 28 ativos, com os 8 novos dentro e os 6 aposentados fora.
    const ativos = (await listSubcriterionCatalog(curador.client)).map((entry) => entry.code);
    for (const codigo of NOVOS_CODIGOS_1_0_0) {
      expect(ativos, `${codigo} pertence ao catálogo ativo desde a virada`).toContain(codigo);
    }
    for (const aposentado of [
      "ACESSO_LOCALIZACAO",
      "EXPERIENCIA_CASOS_SEMELHANTES",
      "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
      "HISTORICO_ENSINO_E_PESQUISA",
      "HISTORICO_PRODUCAO_ACADEMICA",
      "HISTORICO_REGULARIDADE",
    ]) {
      expect(ativos, `${aposentado} saiu de circulação na virada`).not.toContain(aposentado);
    }
    expect(ativos).toHaveLength(29);
  });

  it("case_needs não é entrada do Motor: o cruzamento continua lendo só o Mapa de Prioridades", async () => {
    // A necessidade registrada em caseA (PRECISO_REMOTO) não criou linha no
    // case_priority_map — os dois são coisas diferentes, por desenho.
    const { data: mapa } = await service
      .from("case_priority_map")
      .select("subcriterion_id")
      .eq("case_id", caseA);
    expect(mapa ?? []).toHaveLength(0);
  });
});
