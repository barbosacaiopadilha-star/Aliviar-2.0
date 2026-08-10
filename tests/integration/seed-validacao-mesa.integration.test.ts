import { fixtureValidarPerfil } from "../apoio/fixture-perfil";
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
import { completarMapaDePrioridades } from "./support-mapa";

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

  // A conta do paciente sintético existe para alguém abrir a tela e olhar.
  // O acesso é impresso ao final: é conta local, sintética, criada por este
  // seed, e sem ela a sessão do paciente não acontece.
  let patientLogin: { email: string; password: string } | null = null;

  it("deixa o Case de certificação pronto para a sessão e imprime os endereços", async () => {
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
      // Conta sem Case é resíduo de uma limpeza anterior (as suítes apagam
      // Cases de certificação, não a conta). Recriar é local e sintético —
      // pedir intervenção manual só transferiria o trabalho para a pessoa.
      const { data: pacienteExistente } = await service.auth.admin.listUsers({ perPage: 1000 });
      const residuo = pacienteExistente?.users.find((u) => u.email === SEED_PATIENT_EMAIL);

      if (residuo) {
        // SEED-1 · a limpeza tinha um buraco, e ele custou três missões.
        //
        // A cadeia real é `crm_contacts → curadoria.profiles → auth.users`.
        // O ramo limpava só o meio dela — histórias, perfil de paciente e
        // papéis —, deixando `profiles` e `crm_contacts` de pé. Com eles,
        // `deleteUser` falha por chave estrangeira; e como o erro era
        // ignorado, o seed seguia adiante e só quebrava depois, em
        // `createPatientAccount`, com "e-mail já existe" — uma mensagem que
        // não aponta para a causa.
        //
        // A ordem abaixo é a da dependência, do mais externo para o mais
        // interno, e cada delete é fechado por `profile_id`/`id` da conta
        // sintética: nada genérico, nada que alcance outra conta.
        await service.from("patient_stories").delete().eq("profile_id", residuo.id);
        await service.from("patient_profiles").delete().eq("profile_id", residuo.id);
        await service.from("user_roles").delete().eq("profile_id", residuo.id);
        await service.from("crm_contacts").delete().eq("patient_profile_id", residuo.id);
        await service.from("profiles").delete().eq("id", residuo.id);

        // E o erro deixa de ser engolido: se ainda restar dependência, o seed
        // para aqui, dizendo qual conta e qual causa — em vez de falhar
        // adiante com um sintoma que não explica nada.
        const { error: erroDelete } = await service.auth.admin.deleteUser(residuo.id);
        if (erroDelete) {
          throw new Error(
            `SEED-1: resíduo da paciente sintética não pôde ser removido (${SEED_PATIENT_EMAIL}, ` +
              `id ${residuo.id}). Causa: ${erroDelete.message}. ` +
              "Alguma tabela nova passou a referenciar a conta e precisa entrar nesta limpeza.",
          );
        }
      }

      const paciente = await createPatientAccount(
        service,
        adminAuth,
        { email: SEED_PATIENT_EMAIL, displayName: "Paciente de Validação (sintético)" },
        adminUser!.id,
      );
      const pacienteProfileId = paciente.profileId;
      const pacientePassword = paciente.password;
      patientLogin = { email: SEED_PATIENT_EMAIL, password: pacientePassword };

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
      await completarMapaDePrioridades(curadorAuth, priorityProfileId);
      await fixtureValidarPerfil(curadorAuth, priorityProfileId, "Lido em voz alta e confirmado.");
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

    const linhas = [
      "",
      "=== SESSÃO PRONTA ===",
      `Mesa do Curador: http://localhost:3000/coa/curadoria/casos/${caseId}/curadoria_tecnica`,
      "  entrar como curador_medico (test-users.local.json)",
      "",
      "Dashboard do Paciente: http://localhost:3000/paciente",
      patientLogin
        ? `  entrar como ${patientLogin.email} / ${patientLogin.password}`
        : "  (conta reaproveitada — rode o seed de novo para gerar novo acesso)",
      "",
    ];
    // eslint-disable-next-line no-console
    console.log(linhas.join("\n"));
  }, 120_000);
});
