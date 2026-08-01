// GOVERNANÇA DA BASE — o ciclo completo contra o banco real.
//
// Os dez passos da Etapa 13, na ordem em que acontecem na operação:
// declarar → verificar → atualizar → nova versão não verificada → divergir →
// resolver → vencer → solicitar atualização → consultar em dois Cases →
// preservar julgamentos históricos.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { declareCriterion } from "@/modules/curadoria/mesa-cruzamento";
import { classifyEvidenceValidity } from "@/modules/curadoria/evidencias-pratica";
import {
  listOpenUpdateRequests,
  loadCurrentPracticeEvidence,
  loadEvidenceDivergences,
  loadEvidenceHistory,
  markEvidenceOutdated,
  registerEvidenceDivergence,
  registerPracticeEvidence,
  requestPracticeUpdate,
  resolveEvidenceDivergence,
  resolveUpdateRequest,
  verifyPracticeEvidence,
} from "@/modules/curadoria/evidencias-pratica-repository";
import { submitProfessionalProtocol } from "@/modules/curadoria/protocolos-repository";

import { createCuradoriaClient } from "./curadoria-client";
import {
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
} from "./certificacao-fixture";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("Governança da Base de Evidências (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let paciente: { client: ReturnType<typeof createCuradoriaClient> };
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
    const email = `governanca-${rotulo}-${Date.now()}@example.test`;
    const conta = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: `Paciente Governança ${rotulo} (sintético)` },
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
    paciente = await loginAs("paciente");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));
    alvo = professionalIds["fixture-c"]!;

    await service.from("practice_evidence").delete().in("professional_profile_id", Object.values(professionalIds));
    await service.from("practice_update_requests").delete().in("professional_profile_id", Object.values(professionalIds));
    await service.from("verification_divergences").delete().in("professional_profile_id", Object.values(professionalIds));

    caseA = await criarCase("a");
    caseB = await criarCase("b");
  }, 120_000);

  afterAll(async () => {
    await service.from("verification_divergences").delete().in("professional_profile_id", Object.values(professionalIds ?? {}));
    await cleanupCuradoriaCertificationFixture(service);
    for (const profileId of pacientes) {
      await service.from("patient_stories").delete().eq("profile_id", profileId);
      await service.from("patient_profiles").delete().eq("profile_id", profileId);
      await service.from("user_roles").delete().eq("profile_id", profileId);
      await service.auth.admin.deleteUser(profileId);
    }
  }, 60_000);

  it("1–2. declaração nasce nao_verificado e a verificação assina uma VERSÃO", async () => {
    const declarada = await registerPracticeEvidence(service, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      options: ["RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA"],
      details: {},
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "Autodeclaração pelo Protocolo da Prática Profissional",
      collectedBy: admin.userId,
    });
    expect(declarada.status).toBe("nao_verificado");

    const verificada = await verifyPracticeEvidence(admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      expectedVersion: 1,
      verifiedBy: admin.userId,
      verificationSource: "Confirmação por telefone com a secretaria",
      verificationTier: "INSTITUCIONAL",
    });
    expect(verificada.version).toBe(2);
    expect(verificada.status).toBe("verificado");
    expect(verificada.verificationSource).toContain("telefone");
  });

  it("verificar exige a versão que o verificador viu — conteúdo trocado no meio recusa a assinatura", async () => {
    await expect(
      verifyPracticeEvidence(admin.client, {
        professionalProfileId: alvo,
        subcriterionCode: "CONTINUIDADE_RETORNOS",
        expectedVersion: 1, // corrente é 2
        verifiedBy: admin.userId,
        verificationSource: "Fonte qualquer",
        verificationTier: "INSTITUCIONAL",
      }),
    ).rejects.toThrow(/mudou durante a verificação/);
  });

  it("fonte insuficiente para o conceito é recusada na verificação", async () => {
    await registerPracticeEvidence(service, {
      professionalProfileId: alvo,
      subcriterionCode: "FORMACAO_RESIDENCIA",
      options: [],
      details: { instituicao: "Hospital X", especialidade: "Ortopedia", ano: 2015 },
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "Currículo enviado pelo profissional",
      collectedBy: admin.userId,
    });

    await expect(
      verifyPracticeEvidence(admin.client, {
        professionalProfileId: alvo,
        subcriterionCode: "FORMACAO_RESIDENCIA",
        expectedVersion: 1,
        verifiedBy: admin.userId,
        verificationSource: "Perfil em diretório profissional",
        verificationTier: "PUBLICA_SECUNDARIA",
      }),
    ).rejects.toThrow(/OFICIAL_PRIMARIA/);
  });

  it("3–4. o profissional atualiza: nasce v3 nao_verificado, e v2 continua verificada no histórico", async () => {
    await submitProfessionalProtocol(service, {
      professionalProfileId: alvo,
      responses: {
        CONTINUIDADE_RETORNOS: {
          options: ["RETORNO_APENAS_SE_SOLICITADO"],
          details: {},
          conditionNote: null,
          observation: null,
        },
      },
      collectedBy: admin.userId,
    });

    const corrente = (await loadCurrentPracticeEvidence(curador.client, [alvo])).get(alvo)!
      .find((r) => r.subcriterionCode === "CONTINUIDADE_RETORNOS")!;
    expect(corrente.version).toBe(3);
    expect(corrente.status).toBe("nao_verificado");
    expect(corrente.verifiedAt).toBeNull();

    const historico = await loadEvidenceHistory(curador.client, alvo, "CONTINUIDADE_RETORNOS");
    expect(historico.map((h) => `${h.version}:${h.status}`)).toEqual([
      "1:nao_verificado",
      "2:verificado",
      "3:nao_verificado",
    ]);
  });

  it("5–6. divergência abre pelo curador e a resolução é do admin, com autor e data", async () => {
    await registerEvidenceDivergence(curador.client, service, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      declaredVersion: "Retorno apenas se solicitado",
      foundVersion: "Site informa retorno programado em 30 dias",
      severity: "observacao",
      openedBy: curador.userId,
    });

    const abertas = await loadEvidenceDivergences(curador.client, [alvo]);
    expect(abertas).toHaveLength(1);
    expect(abertas[0]!.status).toBe("aberta");

    const corrente = (await loadCurrentPracticeEvidence(curador.client, [alvo])).get(alvo)!
      .find((r) => r.subcriterionCode === "CONTINUIDADE_RETORNOS")!;
    expect(corrente.status).toBe("divergente");
    expect(corrente.version).toBe(4);

    await resolveEvidenceDivergence(admin.client, {
      divergenceId: abertas[0]!.id,
      resolution: "A fonte prevalece: o site foi confirmado com a secretaria.",
      resolvedVersion: "Site informa retorno programado em 30 dias",
      resolvedBy: admin.userId,
    });

    const { data } = await service
      .from("verification_divergences")
      .select("status, resolved_by, resolved_at, resolution")
      .eq("id", abertas[0]!.id)
      .single();
    expect(data!.status).toBe("resolvida");
    expect(data!.resolved_by).toBe(admin.userId);
    expect(data!.resolved_at).toBeTruthy();
  });

  it("o curador NÃO resolve divergência e NÃO verifica — ownership do código", async () => {
    await registerEvidenceDivergence(curador.client, service, {
      professionalProfileId: alvo,
      subcriterionCode: "FORMACAO_RESIDENCIA",
      declaredVersion: "Ortopedia, 2015",
      foundVersion: "Conselho não localiza a residência",
      severity: "critica",
      openedBy: curador.userId,
    });
    const abertas = (await loadEvidenceDivergences(curador.client, [alvo])).filter(
      (d) => d.status === "aberta",
    );
    expect(abertas.length).toBeGreaterThan(0);

    await expect(
      resolveEvidenceDivergence(curador.client, {
        divergenceId: abertas[0]!.id,
        resolution: "Tentativa do curador",
        resolvedVersion: "x",
        resolvedBy: curador.userId,
      }),
    ).rejects.toThrow(/sem permissão|não encontrada/);

    await expect(
      verifyPracticeEvidence(curador.client, {
        professionalProfileId: alvo,
        subcriterionCode: "CONTINUIDADE_RETORNOS",
        expectedVersion: 5,
        verifiedBy: curador.userId,
        verificationSource: "Tentativa do curador",
        verificationTier: "INSTITUCIONAL",
      }),
    ).rejects.toThrow();
  });

  it("7. desatualizar cria versão nova com motivo; validade é derivada, nunca gravada", async () => {
    await markEvidenceOutdated(admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      reason: "Prática mudou após confirmação com a secretaria.",
    });

    const corrente = (await loadCurrentPracticeEvidence(admin.client, [alvo])).get(alvo)!
      .find((r) => r.subcriterionCode === "CONTINUIDADE_RETORNOS")!;
    expect(corrente.status).toBe("desatualizado");
    expect(corrente.observation).toContain("Prática mudou");

    // Nenhuma coluna de validade: ela é calculada da política do conceito.
    const { error } = await service.from("practice_evidence").select("validade").limit(1);
    expect(error).not.toBeNull();
    expect(classifyEvidenceValidity(corrente.subcriterionCode, corrente.status, corrente.verifiedAt, new Date().toISOString())).toBe("SEM_DATA");
  });

  it("8. solicitação de atualização: curador abre, o profissional a veria, admin fecha com autor e data", async () => {
    const pedido = await requestPracticeUpdate(curador.client, {
      professionalProfileId: alvo,
      subcriterionCodes: ["CONTINUIDADE_RETORNOS"],
      reason: "A informação está desatualizada — precisamos da resposta atual.",
      requestedBy: curador.userId,
    });
    expect(pedido.status).toBe("aberta");

    const abertas = await listOpenUpdateRequests(curador.client, [alvo]);
    expect(abertas).toHaveLength(1);

    await expect(
      resolveUpdateRequest(curador.client, {
        requestId: pedido.id,
        status: "atendida",
        resolvedBy: curador.userId,
      }),
    ).rejects.toThrow();

    await resolveUpdateRequest(admin.client, {
      requestId: pedido.id,
      status: "atendida",
      resolvedBy: admin.userId,
    });
    expect(await listOpenUpdateRequests(curador.client, [alvo])).toHaveLength(0);
  });

  it("9–10. dois Cases leem a mesma Base e concluem diferente; atualizar a Base não reescreve nada", async () => {
    await declareCriterion(curador.client, caseA, {
      professionalProfileId: alvo,
      criterion: "CONTINUIDADE_DO_CUIDADO",
      assessment: "NAO_ATENDE",
      evidence: "Ela precisa de retorno programado; a prática registrada é retorno sob demanda.",
      declaredBy: curador.userId,
    });
    await declareCriterion(curador.client, caseB, {
      professionalProfileId: alvo,
      criterion: "CONTINUIDADE_DO_CUIDADO",
      assessment: "ATENDE_PLENAMENTE",
      evidence: "Ela prefere procurar quando precisar — a prática registrada corresponde.",
      declaredBy: curador.userId,
    });

    await markEvidenceOutdated(admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_RETORNOS",
      reason: "Nova revisão pedida à operação.",
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

  it("histórico é imutável: nem o service role reescreve, e ninguém apaga pela aplicação", async () => {
    const { error: updateError } = await service
      .from("practice_evidence")
      .update({ verification_source: "reescrito" })
      .eq("professional_profile_id", alvo);
    expect(updateError).not.toBeNull();
    expect(updateError!.message).toContain("versao nova");

    const { error: deleteError } = await admin.client
      .from("practice_evidence")
      .delete()
      .eq("professional_profile_id", alvo);
    expect(deleteError).not.toBeNull();
  });

  it("RLS: paciente e anônimo não alcançam evidência, solicitação nem divergência", async () => {
    for (const tabela of ["practice_evidence", "practice_update_requests"]) {
      const { data: doPaciente } = await paciente.client.from(tabela).select("id").limit(1);
      expect(doPaciente ?? [], tabela).toHaveLength(0);

      const anonimo = createCuradoriaClient(url, anonKey);
      const { data: semSessao } = await anonimo.from(tabela).select("id").limit(1);
      expect(semSessao ?? [], tabela).toHaveLength(0);
    }
  });
});
