// TRANSPARÊNCIA DA BASE — o profissional lê o que é dele, e só.
//
// A decisão de 2026-08-01 abriu a leitura das próprias evidências. Este
// arquivo prova as duas metades: ele alcança as suas, e não alcança as de
// terceiro — nem o Mapa do Profissional, cuja restrição é decisão da ADR-040
// e permanece de pé.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  loadCurrentPracticeEvidence,
  loadOwnEvidenceDivergences,
  loadOwnPracticeEvidence,
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

describe("Transparência da Base para o profissional (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let professionalIds: Record<string, string>;
  let admin: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let dono: { client: ReturnType<typeof createCuradoriaClient>; userId: string };
  let meuPerfil: string;
  let doOutro: string;
  let criadoAqui = false;

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
    dono = await loginAs("profissional");

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));
    doOutro = professionalIds["fixture-d"]!;

    await service.from("practice_evidence").delete().in("professional_profile_id", Object.values(professionalIds));
    await service.from("verification_divergences").delete().in("professional_profile_id", Object.values(professionalIds));

    // O perfil profissional da conta de teste — é ele que a policy reconhece
    // pelo `profile_id`. A conta existe em test-users, mas o cadastro
    // profissional não: criamos um, marcado como fixture, e removemos ao fim.
    const { data: existente } = await service
      .from("professional_profiles")
      .select("id")
      .eq("profile_id", dono.userId)
      .maybeSingle();

    if (existente) {
      meuPerfil = existente.id as string;
    } else {
      const { data, error } = await service
        .from("professional_profiles")
        .insert({
          profile_id: dono.userId,
          display_name: "Profissional Transparência (sintético)",
          professional_identifier: `transparencia-${Date.now()}`,
          is_test_fixture: true,
          is_demo: false,
          crm: "999999",
          crm_uf: "SP",
          professional_summary:
            "Perfil sintético de teste automatizado. Não representa profissional real.",
          experience_level: "experiente",
          intake_approach: "ambos",
          offers_continuous_care: true,
          availability_window: "flexible",
          created_by: admin.userId,
        })
        .select("id")
        .single();
      if (error) throw new Error(`perfil do profissional de teste: ${error.message}`);
      meuPerfil = data!.id as string;
      criadoAqui = true;
    }

    // Uma evidência dele (verificada) e uma de outro profissional.
    await registerPracticeEvidence(service, {
      professionalProfileId: meuPerfil,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      options: ["MENSAGEM_COM_EQUIPE_OU_SECRETARIA"],
      details: {},
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "Autodeclaração pelo Protocolo da Prática Profissional",
      collectedBy: dono.userId,
    });
    await verifyPracticeEvidence(admin.client, {
      professionalProfileId: meuPerfil,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      expectedVersion: 1,
      verifiedBy: admin.userId,
      verificationSource: "Confirmação por telefone com a secretaria",
      verificationTier: "INSTITUCIONAL",
    });

    await registerPracticeEvidence(service, {
      professionalProfileId: doOutro,
      subcriterionCode: "ACESSO_MODALIDADE",
      options: ["PRESENCIAL"],
      details: {},
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "Autodeclaração pelo Protocolo da Prática Profissional",
      collectedBy: admin.userId,
    });
  }, 120_000);

  afterAll(async () => {
    await service.from("verification_divergences").delete().in("professional_profile_id", Object.values(professionalIds ?? {}));
    await service.from("practice_evidence").delete().eq("professional_profile_id", meuPerfil);
    if (criadoAqui) await service.from("professional_profiles").delete().eq("id", meuPerfil);
    await cleanupCuradoriaCertificationFixture(service);
  }, 60_000);

  it("o profissional lê as PRÓPRIAS evidências, com versões e estado", async () => {
    const minhas = await loadOwnPracticeEvidence(dono.client, meuPerfil);

    expect(minhas.length).toBeGreaterThan(0);
    expect(minhas.every((v) => v.subcriterionCode === "CONTINUIDADE_CANAIS")).toBe(true);
    // Cronológico: v1 declarada, v2 verificada.
    expect(minhas.map((v) => `${v.version}:${v.status}`)).toEqual([
      "1:nao_verificado",
      "2:verificado",
    ]);
    expect(minhas[1]!.verifiedAt).toBeTruthy();
  });

  it("NUNCA lê evidência de terceiro — nem pedindo pelo id dele", async () => {
    expect(await loadOwnPracticeEvidence(dono.client, doOutro)).toEqual([]);

    const { data } = await dono.client
      .from("practice_evidence")
      .select("id")
      .eq("professional_profile_id", doOutro);
    expect(data ?? []).toHaveLength(0);
  });

  it("a projeção não entrega governança: sem verificador, sem fonte de verificação", async () => {
    const minhas = await loadOwnPracticeEvidence(dono.client, meuPerfil);
    const verificada = minhas.find((v) => v.status === "verificado")!;

    expect(Object.keys(verificada)).not.toContain("verifiedBy");
    expect(Object.keys(verificada)).not.toContain("verificationSource");
    expect(Object.keys(verificada)).not.toContain("collectedBy");
    expect(Object.keys(verificada)).not.toContain("observation");
  });

  it("vê a divergência aberta sobre si — o que esclarecer, sem o parecer da operação", async () => {
    await registerEvidenceDivergence(curador.client, service, {
      professionalProfileId: meuPerfil,
      subcriterionCode: "CONTINUIDADE_CANAIS",
      declaredVersion: "Mensagem com a equipe ou secretaria",
      foundVersion: "O site informa apenas reagendamento",
      severity: "observacao",
      openedBy: curador.userId,
    });

    const divergencias = await loadOwnEvidenceDivergences(dono.client, meuPerfil);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0]!.foundVersion).toContain("apenas reagendamento");
    // A projeção não carrega parecer nem identidade de quem analisou.
    expect(Object.keys(divergencias[0]!)).not.toContain("resolution");
    expect(Object.keys(divergencias[0]!)).not.toContain("openedBy");
    expect(Object.keys(divergencias[0]!)).not.toContain("resolvedBy");
  });

  it("o Mapa do Profissional continua fora do alcance dele — ADR-040 item 6 intacta", async () => {
    const { data } = await dono.client
      .from("professional_subcriterion_map")
      .select("id")
      .eq("professional_profile_id", meuPerfil);
    expect(data ?? []).toHaveLength(0);
  });

  it("o profissional continua sem escrever na Base — transparência não é permissão", async () => {
    const { error } = await dono.client.from("practice_evidence").insert({
      professional_profile_id: meuPerfil,
      subcriterion_code: "ACESSO_MODALIDADE",
      catalog_version: "1.0.0",
      version: 1,
      options: ["REMOTO"],
      source_tier: "INSTITUCIONAL",
      source: "Tentativa direta",
      collected_at: new Date().toISOString(),
      collected_by: dono.userId,
    });
    expect(error).not.toBeNull();
  });

  it("Curador e Administrador mantêm exatamente o alcance que já tinham", async () => {
    const doCurador = await loadCurrentPracticeEvidence(curador.client, [meuPerfil, doOutro]);
    expect(doCurador.get(meuPerfil)?.length).toBeGreaterThan(0);
    expect(doCurador.get(doOutro)?.length).toBeGreaterThan(0);

    const doAdmin = await loadCurrentPracticeEvidence(admin.client, [meuPerfil, doOutro]);
    expect(doAdmin.get(meuPerfil)?.length).toBeGreaterThan(0);
    expect(doAdmin.get(doOutro)?.length).toBeGreaterThan(0);
  });

  it("paciente e anônimo continuam sem alcançar nada", async () => {
    const paciente = await loginAs("paciente");
    const { data: doPaciente } = await paciente.client.from("practice_evidence").select("id").limit(1);
    expect(doPaciente ?? []).toHaveLength(0);

    const anonimo = createCuradoriaClient(url, anonKey);
    const { data: semSessao } = await anonimo.from("practice_evidence").select("id").limit(1);
    expect(semSessao ?? []).toHaveLength(0);
  });
});
