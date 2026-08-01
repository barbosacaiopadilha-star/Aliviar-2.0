// BASE DE EVIDÊNCIAS DE PRÁTICA — contra o banco real.
//
// O que se prova aqui, na ordem do risco: o banco recusa reescrita e
// apagamento (histórico é propriedade); a sequência de versões não tem
// buraco; proveniência é CHECK, não convenção; a RLS entrega leitura ao
// Curador e nada ao paciente; a divergência reutiliza a tabela de sempre; e
// a Mesa carrega o resumo por profissional sem concluir nada.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  loadCurrentPracticeEvidence,
  registerEvidenceDivergence,
  registerPracticeEvidence,
  verifyPracticeEvidence,
} from "@/modules/curadoria/evidencias-pratica-repository";

import { createCuradoriaClient } from "./curadoria-client";
import {
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
} from "./certificacao-fixture";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("Base de Evidências de Prática (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let paciente: { client: ReturnType<typeof createCuradoriaClient> };
  let alvo: string;

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
    paciente = await loginAs("paciente");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));
    alvo = professionalIds["fixture-a"]!;

    // Higiene de fixture: execuções anteriores podem ter deixado versões — e
    // como a tabela é append-only para a aplicação, só o service role limpa.
    await service
      .from("practice_evidence")
      .delete()
      .in("professional_profile_id", Object.values(professionalIds));
  }, 120_000);

  afterAll(async () => {
    // Append-only: a limpeza é do service role, único que atravessa a RLS —
    // e mesmo ele precisa do caminho de exceção? Não: trigger vale para todos.
    // Fixture some por cascade ao apagar o profissional.
    await service
      .from("verification_divergences")
      .delete()
      .in("professional_profile_id", Object.values(professionalIds ?? {}));
    await cleanupCuradoriaCertificationFixture(service);
  }, 60_000);

  it("a resposta do Protocolo nasce declarada, com proveniência completa", async () => {
    const registro = await registerPracticeEvidence(admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      options: ["MENSAGEM_COM_EQUIPE_OU_SECRETARIA", "TELEFONE_HORARIO_COMERCIAL"],
      details: {},
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "Entrevista estruturada com a secretaria",
      collectedBy: admin.userId,
    });

    expect(registro.version).toBe(1);
    expect(registro.status).toBe("nao_verificado");
    expect(registro.catalogVersion).toBe("1.0.0");
    expect(registro.collectedBy).toBe(admin.userId);
  });

  it("o domínio recusa antes do banco: opção fora do catálogo não chega a INSERT", async () => {
    await expect(
      registerPracticeEvidence(admin.client, {
        professionalProfileId: alvo,
        subcriterionCode: "CONTINUIDADE_CANAIS",
        options: ["POMBO_CORREIO"],
        details: {},
        conditionNote: null,
        observation: null,
        sourceTier: "INSTITUCIONAL",
        source: "Entrevista",
        collectedBy: admin.userId,
      }),
    ).rejects.toThrow(/não é opção canônica/);
  });

  it("verificar não toca a declaração: nasce versão nova, e as duas ficam", async () => {
    const verificada = await verifyPracticeEvidence(admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      verifiedBy: admin.userId,
      verificationSource: "Confirmação por telefone com a secretaria",
      verificationTier: "INSTITUCIONAL",
      expectedVersion: 1,
    });

    expect(verificada.version).toBe(2);
    expect(verificada.status).toBe("verificado");

    const { data } = await service
      .from("practice_evidence")
      .select("version, status")
      .eq("professional_profile_id", alvo)
      .eq("subcriterion_code", "CONTINUIDADE_CANAIS")
      .order("version");
    expect(data).toHaveLength(2);
    expect(data![0]).toMatchObject({ version: 1, status: "nao_verificado" });
    expect(data![1]).toMatchObject({ version: 2, status: "verificado" });
  });

  it("conteúdo é imutável (UPDATE recusado até do service role) e a aplicação não apaga", async () => {
    const { error: updateError } = await service
      .from("practice_evidence")
      .update({ source: "reescrito" })
      .eq("professional_profile_id", alvo);
    expect(updateError).not.toBeNull();
    expect(updateError!.message).toContain("versao nova");

    // DELETE avulso: nenhum papel de aplicação tem o privilégio — o admin
    // autenticado é recusado pelo banco. (O cascade do descarte do
    // profissional permanece possível, e o afterAll deste arquivo o exercita.)
    const { error: deleteError } = await admin.client
      .from("practice_evidence")
      .delete()
      .eq("professional_profile_id", alvo);
    expect(deleteError).not.toBeNull();
  });

  it("versão fora de sequência é recusada pelo banco", async () => {
    const { error } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: "CONTINUIDADE_CANAIS",
      catalog_version: "1.0.0",
      version: 9,
      options: ["APENAS_REAGENDAMENTO"],
      source_tier: "INSTITUCIONAL",
      source: "Tentativa de pular versão",
      collected_at: new Date().toISOString(),
      collected_by: admin.userId,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain("fora de sequencia");
  });

  it("verificado sem proveniência de verificação é recusado por CHECK", async () => {
    const { error } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: "ACESSO_MODALIDADE",
      catalog_version: "1.0.0",
      version: 1,
      options: ["PRESENCIAL"],
      source_tier: "INSTITUCIONAL",
      source: "Entrevista",
      collected_at: new Date().toISOString(),
      collected_by: admin.userId,
      status: "verificado", // sem verified_at/by/source
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/verificacao_exige_proveniencia/);
  });

  it("RLS: o Curador lê; o paciente não alcança nada; anônimo tampouco", async () => {
    const doCurador = await loadCurrentPracticeEvidence(curador.client, [alvo]);
    expect(doCurador.get(alvo)?.length).toBeGreaterThan(0);

    const { data: doPaciente } = await paciente.client
      .from("practice_evidence")
      .select("id")
      .eq("professional_profile_id", alvo);
    expect(doPaciente ?? []).toHaveLength(0);

    const anonimo = createCuradoriaClient(url, anonKey);
    const { data: semSessao } = await anonimo
      .from("practice_evidence")
      .select("id")
      .eq("professional_profile_id", alvo);
    expect(semSessao ?? []).toHaveLength(0);
  });

  it("RLS: o Curador não escreve — coleta é da operação", async () => {
    await expect(
      registerPracticeEvidence(curador.client, {
        professionalProfileId: alvo,
        subcriterionCode: "ACESSO_DISPONIBILIDADE",
        options: ["MANHA_DIAS_UTEIS"],
        details: {},
        conditionNote: null,
        observation: null,
        sourceTier: "INSTITUCIONAL",
        source: "Tentativa do curador",
        collectedBy: curador.userId,
      }),
    ).rejects.toThrow();
  });

  it("divergência vai para a tabela de sempre, e o estado corrente vira divergente", async () => {
    await registerEvidenceDivergence(admin.client, admin.client, {
      professionalProfileId: alvo,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      declaredVersion: "Mensagem com a equipe e telefone comercial",
      foundVersion: "Site informa apenas reagendamento",
      severity: "observacao",
      openedBy: admin.userId,
    });

    const { data: divergencias } = await service
      .from("verification_divergences")
      .select("subject, severity")
      .eq("professional_profile_id", alvo)
      .eq("subject", "CONTINUIDADE_CANAIS");
    expect(divergencias).toHaveLength(1);

    const corrente = await loadCurrentPracticeEvidence(admin.client, [alvo]);
    const canal = corrente.get(alvo)!.find((r) => r.subcriterionCode === "CONTINUIDADE_CANAIS")!;
    expect(canal.version).toBe(3);
    expect(canal.status).toBe("divergente");
  });

  it("a leitura corrente devolve uma linha por conceito, na versão mais alta", async () => {
    const corrente = await loadCurrentPracticeEvidence(curador.client, [alvo]);
    const rows = corrente.get(alvo)!;
    const codigos = rows.map((r) => r.subcriterionCode);
    expect(new Set(codigos).size).toBe(codigos.length);
    expect(rows.filter((r) => r.status === "divergente")).toHaveLength(1);
  });
});
