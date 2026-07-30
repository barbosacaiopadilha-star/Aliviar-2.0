/**
 * Homologação operacional B6 — Mesa → Dossiê → Portal → Escolha.
 * HTTP + Supabase autenticado. Sem mocks.
 */
import { randomUUID } from "node:crypto";
import {
  ADMIN_EMAIL,
  ADMIN_USER_ID,
  TRES_OPCOES,
  createAdminClient,
  fetchWithCookies,
  loadValidationEnv,
  staffSignIn,
  StepRecorder,
  writeReport,
} from "./validation-lib.mjs";

const DIMENSOES = [
  { nome: "Experiência clínica", descricao: "Trajetória e volume de casos similares", valor: 40 },
  { nome: "Proximidade", descricao: "Facilidade de acesso e logística", valor: 30 },
  { nome: "Abordagem", descricao: "Estilo de comunicação e método", valor: 30 },
];

const PESOS = { "Experiência clínica": 40, Proximidade: 30, Abordagem: 30 };

async function assertOk(label, response, recorder, responsavel) {
  const payload = response.json?.data ?? response.json;
  const ok = response.res.ok || response.res.status === 201;
  recorder.record({
    etapa: label,
    entrou: true,
    saiu: ok,
    responsavel,
    status: response.res.status,
    erro: ok ? null : (payload?.error?.message ?? response.json?.message ?? response.text.slice(0, 200)),
  });
  if (!ok) {
    throw new Error(`${label}_failed:${response.res.status}:${recorder.steps.at(-1)?.erro}`);
  }
  return payload;
}

async function ensureProfessionalProfiles(admin, curadorId) {
  const profiles = [];
  for (let i = 0; i < 3; i += 1) {
    const id = randomUUID();
    const { error } = await admin.schema("curadoria").from("professional_profiles").upsert({
      id,
      display_name: `HOMOLOG_Profissional ${i + 1}`,
      professional_identifier: `HOMOLOG_DOC_${i + 1}`,
      status: "ativo",
      publication_status: "publicado",
      created_by: curadorId,
      practical_considerations: [],
    });
    if (error) throw new Error(`professional_profile_failed:${error.message}`);

    await admin.schema("curadoria").from("professional_competency_areas").upsert({
      professional_profile_id: id,
      domain: "saude_fisica",
      focus: "acompanhamento_continuo",
    });

    profiles.push({
      id,
      nome: `HOMOLOG_Profissional ${i + 1}`,
      especialidade: "Cardiologia",
      nota_curador: `Parecer homologação opção ${i + 1}.`,
    });
  }
  return profiles;
}

async function bootstrapCuradoriaCase(admin, { journeyId, patientProfileId, curadorId }) {
  const casoId = randomUUID();
  const storyId = randomUUID();
  const priorityProfileId = randomUUID();
  const now = new Date().toISOString();

  await admin.schema("curadoria").from("profiles").upsert({
    id: patientProfileId,
    display_name: "HOMOLOG_Paciente",
  });

  await admin.schema("curadoria").from("patient_profiles").upsert({
    profile_id: patientProfileId,
    status: "ativo",
  });

  await admin.schema("curadoria").from("patient_stories").insert({
    id: storyId,
    profile_id: patientProfileId,
    status: "enviada",
    current_step: "COMPLETE",
    data: { homolog: true },
    revision: 1,
    created_by: curadorId,
  });

  await admin.schema("curadoria").from("cases").insert({
    id: casoId,
    patient_profile_id: patientProfileId,
    source_story_id: storyId,
    status: "IN_CURATION",
    assigned_curator_id: curadorId,
    created_by: curadorId,
  });

  await admin.schema("curadoria").from("priority_profiles").insert({
    id: priorityProfileId,
    case_id: casoId,
    curator_id: curadorId,
    status: "DRAFT",
  });

  await admin.from("curator_case_workspaces").upsert({
    journey_id: journeyId,
    curator_id: curadorId,
    assumed_at: now,
    workspace_data: {
      curadoria_case_id: casoId,
      dossie_versao_atual: 1,
      dossie_comparativo: [],
      dossie_versao_status: "RASCUNHO",
    },
    updated_at: now,
  });

  return casoId;
}

async function createPatientAuthUser(env, email) {
  const password = `Homolog-${Date.now()}-Aa1!`;
  const admin = createAdminClient(env);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!error && data?.user?.id) {
      return { id: data.user.id, password };
    }

    const message = error?.message ?? "";
    if (/already been registered|already exists/i.test(message)) {
      const { data: patients } = await admin
        .from("patients")
        .select("auth_user_id")
        .ilike("email", email)
        .not("auth_user_id", "is", null)
        .limit(1);
      if (patients?.[0]?.auth_user_id) {
        return { id: patients[0].auth_user_id, password };
      }
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      continue;
    }

    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      return { id: payload.id, password };
    }

    const body = await response.text();
    throw new Error(`create_patient_auth_failed:${response.status}:${body.slice(0, 120)}`);
  }

  throw new Error("create_patient_auth_failed:exhausted_retries");
}

async function syncAdminPassword(env) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${ADMIN_USER_ID}`, {
    method: "PUT",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: env.ADMIN_NEW_PASSWORD }),
  });
  return response.ok;
}

async function main() {
  const env = loadValidationEnv({ comando: "validation:e2e:b6" });
  const recorder = new StepRecorder();
  const problemas = [];
  const ts = Date.now();
  const patientEmail = `homolog.patient.${ts}@validation.aliviar.local`;

  console.log("HOMOLOG_B6_START");
  console.log(`BASE:${env.VALIDATION_BASE_URL}`);

  const passwordSynced = await syncAdminPassword(env);
  recorder.record({
    etapa: "admin_criacao_senha",
    entrou: true,
    saiu: passwordSynced,
    responsavel: "SISTEMA",
    status: passwordSynced ? 200 : 500,
    erro: passwordSynced ? null : "sync_admin_password_failed",
  });

  const admin = createAdminClient(env);
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", ADMIN_USER_ID)
    .maybeSingle();

  recorder.record({
    etapa: "admin_perfil",
    entrou: true,
    saiu: Boolean(adminProfile?.is_active),
    responsavel: "SISTEMA",
    status: adminProfile ? 200 : 404,
    erro: adminProfile?.is_active ? null : "perfil_admin_inativo_ou_ausente",
  });
  if (!adminProfile?.is_active) {
    throw new Error("admin_profile_missing");
  }

  const staffStore = await staffSignIn(env, ADMIN_EMAIL, env.ADMIN_NEW_PASSWORD);
  recorder.record({
    etapa: "curador_autenticacao",
    entrou: true,
    saiu: true,
    responsavel: "CURADOR",
    status: 200,
    erro: null,
  });

  const casoRes = await fetchWithCookies(env, staffStore.store, "/api/v1/casos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Paciente Homologação B6",
      journey_title: `Homologação B6 ${ts}`,
      manager_id: ADMIN_USER_ID,
      email: patientEmail,
      phone: "11999990000",
    }),
  });
  const caso = await assertOk("criar_caso", casoRes, recorder, "STAFF");
  const jornadaId = caso.jornada_id ?? caso.jornadaId;
  const pacienteId = caso.paciente_id ?? caso.pacienteId;

  const { id: patientAuthId, password: patientPassword } = await createPatientAuthUser(env, patientEmail);
  const { error: linkError } = await admin
    .from("patients")
    .update({ auth_user_id: patientAuthId })
    .eq("id", pacienteId);
  if (linkError) throw new Error(`link_patient_auth_failed:${linkError.message}`);

  await bootstrapCuradoriaCase(admin, {
    journeyId: jornadaId,
    patientProfileId: patientAuthId,
    curadorId: ADMIN_USER_ID,
  });

  const patientSession = await staffSignIn(env, patientEmail, patientPassword);
  recorder.record({
    etapa: "paciente_autenticacao",
    entrou: true,
    saiu: true,
    responsavel: "PACIENTE",
    status: 200,
    erro: null,
  });

  await assertOk(
    "paciente_jornada",
    await fetchWithCookies(env, patientSession.store, "/api/v1/me/jornada"),
    recorder,
    "PACIENTE",
  );

  await assertOk(
    "curador_assumir",
    await fetchWithCookies(env, staffStore.store, `/api/v1/curador/casos/${jornadaId}/assumir`, {
      method: "POST",
    }),
    recorder,
    "CURADOR",
  );

  const casoCuradoria = await assertOk(
    "curadoria_obter_caso",
    await fetchWithCookies(env, staffStore.store, `/api/v1/curador/casos/${jornadaId}/curadoria`),
    recorder,
    "CURADOR",
  );

  await assertOk(
    "perfil_prioridades_validar",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/perfil-prioridades/validar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dimensoes: DIMENSOES, pesos: PESOS }),
      },
    ),
    recorder,
    "CURADOR",
  );

  const candidatos = await ensureProfessionalProfiles(admin, ADMIN_USER_ID);

  await assertOk(
    "mesa_concluir",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/mesa/concluir`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidatos }),
      },
    ),
    recorder,
    "CURADOR",
  );

  const dossieIniciado = await assertOk(
    "dossie_iniciar",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/dossie/iniciar`,
      { method: "POST" },
    ),
    recorder,
    "CURADOR",
  );

  const casoPosIniciar = await assertOk(
    "curadoria_pos_iniciar_dossie",
    await fetchWithCookies(env, staffStore.store, `/api/v1/curador/casos/${jornadaId}/curadoria`),
    recorder,
    "CURADOR",
  );

  const dossieId = casoPosIniciar?.dossie?.id ?? dossieIniciado?.id;
  const versaoId = dossieId;
  if (!dossieId) {
    throw new Error("dossie_id_missing_after_iniciar");
  }

  const opcoesDossie = TRES_OPCOES.map((opcao, indice) => ({
    indice,
    nome: candidatos[indice]?.nome ?? opcao.nome,
    especialidade: candidatos[indice]?.especialidade ?? opcao.especialidade,
    por_que_esta_aqui: `Parecer homologação opção ${indice + 1}.`,
    por_que_pode_fazer_sentido: opcao.por_que_pode_fazer_sentido,
    o_que_esperar: opcao.o_que_esperar,
    limitacoes: opcao.limitacoes,
    evidencias_resumo: opcao.evidencias_resumo,
  }));

  await assertOk(
    "dossie_rascunho",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/dossie/rascunho`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versao_id: versaoId,
          opcoes: opcoesDossie,
          comparativo: [{ dimensao: "Experiência clínica", narrativa: "Comparativo homologação B6." }],
        }),
      },
    ),
    recorder,
    "CURADOR",
  );

  await assertOk(
    "dossie_aprovar",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/dossie/aprovar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versao_id: versaoId }),
      },
    ),
    recorder,
    "CURADOR",
  );

  await assertOk(
    "dossie_publicar",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/dossie/publicar`,
      { method: "POST" },
    ),
    recorder,
    "CURADOR",
  );

  const dossiePaciente = await assertOk(
    "portal_dossie_visualizar",
    await fetchWithCookies(env, patientSession.store, "/api/v1/me/dossie"),
    recorder,
    "PACIENTE",
  );

  const opcoesPortal =
    dossiePaciente?.versao_publicada?.opcoes ??
    dossiePaciente?.dossie?.versao_publicada?.opcoes ??
    dossiePaciente?.opcoes ??
    [];

  if (!opcoesPortal || opcoesPortal.length !== 3) {
    problemas.push({
      classe: "PORTAL",
      severidade: "P0",
      mensagem: "Paciente não visualizou três opções do dossiê publicado",
    });
  }

  await assertOk(
    "portal_dossie_registrar_visualizacao",
    await fetchWithCookies(env, patientSession.store, "/api/v1/me/dossie/visualizar", {
      method: "POST",
    }),
    recorder,
    "PACIENTE",
  );

  await assertOk(
    "devolutiva_registrar",
    await fetchWithCookies(
      env,
      staffStore.store,
      `/api/v1/curador/casos/${jornadaId}/devolutiva`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossie_apresentado: true,
          data_devolutiva: new Date().toISOString(),
          duvidas: ["Dúvida homologação B6"],
        }),
      },
    ),
    recorder,
    "CURADOR",
  );

  const casoPosDevolutiva = await assertOk(
    "curadoria_pos_devolutiva",
    await fetchWithCookies(env, staffStore.store, `/api/v1/curador/casos/${jornadaId}/curadoria`),
    recorder,
    "CURADOR",
  );

  const devolutivaId = casoPosDevolutiva?.devolutiva?.id;
  if (devolutivaId) {
    await assertOk(
      "devolutiva_concluir",
      await fetchWithCookies(
        env,
        staffStore.store,
        `/api/v1/curador/casos/${jornadaId}/devolutiva/concluir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ devolutiva_id: devolutivaId }),
        },
      ),
      recorder,
      "CURADOR",
    );
  }

  await assertOk(
    "escolha_registrar",
    await fetchWithCookies(env, patientSession.store, "/api/v1/me/dossie/escolha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dossie_id: dossieId,
        versao_id: dossieId,
        opcao_indice: 1,
        proximos_passos: "Agendar primeira consulta com o profissional escolhido.",
        observacao: "Escolha homologação B6",
      }),
    }),
    recorder,
    "PACIENTE",
  );

  const { data: decisao } = await admin
    .schema("curadoria")
    .from("patient_curadoria_decisions")
    .select("id, chosen_option_id, outcome")
    .eq("case_id", casoPosDevolutiva?.id ?? "")
    .maybeSingle();

  recorder.record({
    etapa: "reconstrucao_escolha_banco",
    entrou: true,
    saiu: Boolean(decisao?.chosen_option_id),
    responsavel: "SISTEMA",
    status: decisao ? 200 : 404,
    erro: decisao ? null : "decisao_nao_persistida",
  });

  if (!decisao?.chosen_option_id) {
    problemas.push({
      classe: "RECONSTRUCAO",
      severidade: "P0",
      mensagem: "Escolha não persistida em patient_curadoria_decisions",
    });
  }

  const sucesso = problemas.length === 0 && recorder.steps.every((s) => s.saiu);

  const report = {
    tipo: "homolog_b6",
    gerado_em: new Date().toISOString(),
    jornada_id: jornadaId,
    paciente_id: pacienteId,
    paciente_email: patientEmail,
    dossie_id: dossieId,
    etapas: recorder.steps,
    problemas,
    sucesso,
  };
  writeReport(report);

  console.log("HOMOLOG_B6_END");
  console.log(`SUCESSO:${sucesso ? "SIM" : "NAO"}`);
  console.log(`JORNADA:${jornadaId}`);
  console.log(`ETAPAS:${recorder.steps.length}`);

  try {
    await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${patientAuthId}`, {
      method: "DELETE",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  } catch {
    // cleanup best-effort
  }

  process.exit(sucesso ? 0 : 1);
}

main().catch((error) => {
  writeReport({
    tipo: "homolog_b6",
    gerado_em: new Date().toISOString(),
    fatal: error.message,
    sucesso: false,
  });
  console.error(`HOMOLOG_B6_FATAL:${error.message}`);
  process.exit(1);
});
