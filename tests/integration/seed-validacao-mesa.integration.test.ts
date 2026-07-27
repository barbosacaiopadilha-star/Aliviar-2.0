// SEED DA VALIDAÇÃO DE USABILIDADE — PROMPT 8
//
// Prepara o Case de certificação no ESTADO INICIAL RECOMENDADO do teste com
// pessoa real no papel de Curador:
//
//   - Perfil de Prioridades validado (pré-condição da Mesa);
//   - pesos AINDA NÃO distribuídos (Tarefas 2 e 3 começam do zero);
//   - NENHUMA declaração de área (Tarefa 4 começa do zero — todas pendentes);
//   - nenhuma avaliação de critério, nenhuma seleção;
//   - Fixtures A, B, C e D publicadas com dossiês e fontes sintéticas.
//
// Diferente das suítes normais, este arquivo NÃO limpa nada ao final — o
// propósito é deixar dados vivos para a sessão manual. Por isso ele só roda
// com SEED_MESA=1; sem a variável, é ignorado pelas execuções normais.
//
// Idempotente: rodar de novo reaproveita fixture e Case existentes.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import * as curadoria from "@/modules/curadoria/repository";

import { createCuradoriaClient } from "./curadoria-client";
import {
  CERTIFICATION_AREA_REQUIREMENT,
  createCuradoriaCertificationFixture,
  markCaseAsCertification,
} from "./certificacao-fixture";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const SEED_PATIENT_EMAIL = "validacao-mesa@example.test";

describe.skipIf(!process.env.SEED_MESA)("seed — validação de usabilidade da Mesa (não roda nas suítes)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
  });

  it("deixa o Case de certificação pronto para a sessão e imprime o endereço", async () => {
    const adminAccount = accounts.find((a) => a.role === "administrador")!;
    const adminAuth = createCuradoriaClient(url, anonKey);
    await adminAuth.auth.signInWithPassword({ email: adminAccount.email, password: adminAccount.password });
    const {
      data: { user: adminUser },
    } = await adminAuth.auth.getUser();

    const curadorAccount = accounts.find((a) => a.role === "curador_medico")!;
    const curadorAuth = createCuradoriaClient(url, anonKey);
    await curadorAuth.auth.signInWithPassword({ email: curadorAccount.email, password: curadorAccount.password });
    const {
      data: { user: curadorUser },
    } = await curadorAuth.auth.getUser();

    // Fixtures A–D (idempotente por professional_identifier).
    await createCuradoriaCertificationFixture(service);

    // Case: reaproveita o da sessão se já existir; senão nasce pelo caminho real.
    const { data: existente } = await service
      .from("cases")
      .select("id")
      .eq("is_certification", true)
      .eq("assigned_curator_id", curadorUser!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let caseId: string;

    if (existente) {
      caseId = existente.id as string;
    } else {
      const { data: pacienteExistente } = await service.auth.admin.listUsers({ perPage: 1000 });
      const jaExiste = pacienteExistente?.users.find((u) => u.email === SEED_PATIENT_EMAIL);

      let pacienteProfileId: string;
      let pacientePassword: string | null = null;

      if (jaExiste) {
        pacienteProfileId = jaExiste.id;
      } else {
        const paciente = await createPatientAccount(
          service,
          adminAuth,
          { email: SEED_PATIENT_EMAIL, displayName: "Paciente de Validação (sintético)" },
          adminUser!.id,
        );
        pacienteProfileId = paciente.profileId;
        pacientePassword = paciente.password;
      }

      if (!pacientePassword) {
        throw new Error(
          "A conta do paciente de validação já existe mas o Case não. Apague a conta validacao-mesa@example.test e rode o seed de novo.",
        );
      }

      const patientClient = createCuradoriaClient(url, anonKey);
      await patientClient.auth.signInWithPassword({ email: SEED_PATIENT_EMAIL, password: pacientePassword });
      const draft = await getOrCreateActiveStory(patientClient, pacienteProfileId);
      const story = await submitStory(patientClient, draft.id, draft.revision);

      const kase = await createCase(adminAuth, story.id, curadorUser!.id, adminUser!.id);
      caseId = kase.id;
      await markCaseAsCertification(service, caseId);
    }

    // Perfil validado com os três filtros do caso — e NADA além disso.
    const { data: perfil } = await service
      .from("priority_profiles")
      .select("id, status")
      .eq("case_id", caseId)
      .maybeSingle();

    if (!perfil) {
      const priorityProfileId = await curadoria.createPriorityProfile(curadorAuth, caseId, curadorUser!.id);
      await curadoria.addFilter(curadorAuth, priorityProfileId, "FILTRO_OBRIGATORIO", "AREA_DE_ATUACAO", CERTIFICATION_AREA_REQUIREMENT, "Reproduz o filtro do caso real.");
      await curadoria.addFilter(curadorAuth, priorityProfileId, "FILTRO_OBRIGATORIO", "UF", "SP", "Estado onde a pessoa reside.");
      await curadoria.addFilter(curadorAuth, priorityProfileId, "FILTRO_OBRIGATORIO", "CUIDADO_CONTINUO", "true", "Ela quer acompanhamento do começo ao fim.");
      await curadoria.saveWeight(curadorAuth, priorityProfileId, "EXPERIENCIA", 50, null, "Peso legado para permitir a validação do Perfil.");
      await curadoria.saveWeight(curadorAuth, priorityProfileId, "CONTINUIDADE", 50, null, "Peso legado para permitir a validação do Perfil.");
      await curadoria.validatePriorityProfile(curadorAuth, priorityProfileId, "Lido em voz alta e confirmado.");
    }

    // Estado inicial recomendado: zera o trabalho da Mesa, preservando o Case.
    await service.from("cruzamento_weights").delete().eq("case_id", caseId);
    await service.from("area_compatibility_declarations").delete().eq("case_id", caseId);
    await service.from("criterion_declarations").delete().eq("case_id", caseId);
    const { data: selecoes } = await service.from("curated_selections").select("id").eq("case_id", caseId);
    for (const selecao of selecoes ?? []) {
      await service.from("curated_selection_options").delete().eq("curated_selection_id", selecao.id);
      await service.from("curadoria_reports").delete().eq("curated_selection_id", selecao.id);
    }
    if ((selecoes ?? []).length > 0) {
      await service.from("curated_selections").delete().eq("case_id", caseId);
    }

    // Confirmação objetiva do estado inicial.
    const [pesos, declaracoes, selecao] = await Promise.all([
      service.from("cruzamento_weights").select("criterion").eq("case_id", caseId),
      service.from("area_compatibility_declarations").select("professional_profile_id").eq("case_id", caseId),
      service.from("curated_selections").select("id").eq("case_id", caseId).maybeSingle(),
    ]);
    expect(pesos.data).toHaveLength(0);
    expect(declaracoes.data).toHaveLength(0);
    expect(selecao.data).toBeNull();

    // eslint-disable-next-line no-console
    console.log(`\n=== SESSÃO PRONTA ===\nMesa: http://localhost:3000/coa/curadoria/casos/${caseId}/curadoria_tecnica\nEntrar como: curador_medico (test-users.local.json)\n`);
  }, 120_000);
});
