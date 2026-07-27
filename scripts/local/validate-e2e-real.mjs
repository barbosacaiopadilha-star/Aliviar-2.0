/**
 * E2E real — fluxo completo persistido via HTTP + Supabase.
 * Sem mocks. Sem fixtures de projeção.
 */
import {
  ADMIN_EMAIL,
  ADMIN_USER_ID,
  TRES_OPCOES,
  createAdminClient,
  diagnoseDatabaseSchema,
  fetchWithCookies,
  loadValidationEnv,
  patientMagicLinkSession,
  staffSignIn,
  StepRecorder,
  writeReport,
} from "./validation-lib.mjs";

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
    throw new Error(`${label}_failed:${response.res.status}`);
  }
  return payload;
}

async function main() {
  const env = loadValidationEnv({ comando: "validation:e2e" });
  const recorder = new StepRecorder();
  const problemas = [];
  const ts = Date.now();
  const patientEmail = `e2e.patient.${ts}@validation.aliviar.local`;
  const patientPassword = `E2e-${ts}-Aa1!`;

  console.log("E2E_REAL_START");
  console.log(`BASE:${env.VALIDATION_BASE_URL}`);

  for (const key of ["SUPABASE_SERVICE_ROLE_KEY", "ADMIN_NEW_PASSWORD", "SUPABASE_ANON_KEY"]) {
    if (!env[key]) {
      problemas.push({ classe: "CONFIGURACAO", severidade: "P0", mensagem: `${key} ausente` });
      throw new Error(`missing_${key}`);
    }
  }

  try {
    await fetch(`${env.VALIDATION_BASE_URL}/login`);
  } catch {
    problemas.push({ classe: "AMBIENTE", severidade: "P0", mensagem: "Dev server inacessivel" });
    throw new Error("dev_server_down");
  }

  const admin = createAdminClient(env);
  const schema = await diagnoseDatabaseSchema(admin);
  if (!schema.ready) {
    problemas.push({
      classe: "INFRAESTRUTURA",
      severidade: "P0",
      mensagem: `Schema incompleto: ${schema.missing.join(", ")}`,
    });
    throw new Error("schema_not_ready");
  }

  const staffStore = await staffSignIn(env, ADMIN_EMAIL, env.ADMIN_NEW_PASSWORD);

  const casoRes = await fetchWithCookies(
    env,
    staffStore.store,
    "/api/v1/casos",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Paciente E2E Validação",
        journey_title: `Caso E2E ${ts}`,
        manager_id: ADMIN_USER_ID,
        email: patientEmail,
        phone: "11999990000",
      }),
    },
  );
  const caso = await assertOk("criar_caso", casoRes, recorder, "STAFF");
  const jornadaId = caso.jornada_id ?? caso.jornadaId;
  const pacienteId = caso.paciente_id ?? caso.pacienteId;

  const { data: authUser, error: createUserError } = await admin.auth.admin.createUser({
    email: patientEmail,
    password: patientPassword,
    email_confirm: true,
  });
  if (createUserError || !authUser.user) {
    throw new Error(`create_patient_auth_failed:${createUserError?.message}`);
  }

  const { error: linkError } = await admin
    .from("patients")
    .update({ auth_user_id: authUser.user.id })
    .eq("id", pacienteId);
  if (linkError) {
    throw new Error(`link_patient_auth_failed:${linkError.message}`);
  }
  recorder.record({
    etapa: "magic_link_paciente",
    entrou: true,
    saiu: true,
    responsavel: "PACIENTE",
    status: 200,
    erro: null,
  });

  const patientSession = await patientMagicLinkSession(env, admin, patientEmail);

  const jornadaRes = await fetchWithCookies(env, patientSession.store, "/api/v1/me/jornada");
  await assertOk("portal_jornada", jornadaRes, recorder, "PACIENTE");

  const docBytes = Buffer.from("E2E validation document content");
  const docContent = docBytes.toString("base64");
  const docRes = await fetchWithCookies(env, patientSession.store, "/api/v1/me/documentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome_arquivo: "exame-e2e.pdf",
      tipo_mime: "application/pdf",
      tamanho_bytes: docBytes.length,
      conteudo_base64: docContent,
    }),
  });
  await assertOk("upload_documento", docRes, recorder, "PACIENTE");

  const analiseRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/jornadas/${jornadaId}/analise-inicial`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacoes: "Análise inicial E2E real.", contexto: "Validação" }),
    },
  );
  await assertOk("analise_inicial", analiseRes, recorder, "STAFF");

  const assumirRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/curador/casos/${jornadaId}/assumir`,
    { method: "POST" },
  );
  await assertOk("curador_assumir", assumirRes, recorder, "CURADOR");

  const sessaoRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/curador/casos/${jornadaId}/sessao`,
    { method: "POST" },
  );
  await assertOk("curador_sessao", sessaoRes, recorder, "CURADOR");

  const opcoesRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/curador/casos/${jornadaId}/opcoes`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opcoes: TRES_OPCOES }),
    },
  );
  await assertOk("curador_opcoes", opcoesRes, recorder, "CURADOR");

  const aprovarRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/curador/casos/${jornadaId}/entrega/aprovar`,
    { method: "POST" },
  );
  await assertOk("curador_aprovar", aprovarRes, recorder, "CURADOR");

  const publicarRes = await fetchWithCookies(
    env,
    staffStore.store,
    `/api/v1/curador/casos/${jornadaId}/entrega/publicar`,
    { method: "POST" },
  );
  await assertOk("curador_publicar", publicarRes, recorder, "CURADOR");

  const entregaPacienteRes = await fetchWithCookies(env, patientSession.store, "/api/v1/me/jornada");
  const entregaView = await assertOk("paciente_entrega", entregaPacienteRes, recorder, "PACIENTE");

  const avancarRes = await fetchWithCookies(
    env,
    patientSession.store,
    "/api/v1/me/entrega/avancar",
    { method: "POST" },
  );
  await assertOk("paciente_avancar_escolha", avancarRes, recorder, "PACIENTE");

  const escolhaRes = await fetchWithCookies(env, patientSession.store, "/api/v1/me/escolha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opcao_indice: 1, observacao: "Escolha E2E" }),
  });
  const finalView = await assertOk("paciente_escolha", escolhaRes, recorder, "PACIENTE");

  const etapaFinal =
    finalView?.etapa_atual ?? finalView?.data?.etapa_atual ?? entregaView?.etapa_atual;
  if (etapaFinal !== "ACOMPANHAMENTO") {
    problemas.push({
      classe: "INFRAESTRUTURA",
      severidade: "P1",
      mensagem: `Etapa final esperada ACOMPANHAMENTO, recebida ${etapaFinal}`,
    });
  }

  recorder.record({
    etapa: "relacionamento",
    entrou: true,
    saiu: etapaFinal === "ACOMPANHAMENTO",
    responsavel: "PACIENTE",
    status: 200,
    erro: etapaFinal !== "ACOMPANHAMENTO" ? `etapa_${etapaFinal}` : null,
  });

  const report = {
    tipo: "e2e_real",
    gerado_em: new Date().toISOString(),
    jornada_id: jornadaId,
    paciente_id: pacienteId,
    paciente_email: patientEmail,
    etapas: recorder.steps,
    problemas,
    sucesso: problemas.length === 0 && etapaFinal === "ACOMPANHAMENTO",
  };
  writeReport(report);

  console.log("E2E_REAL_END");
  console.log(`SUCESSO:${report.sucesso ? "SIM" : "NAO"}`);
  console.log(`JORNADA:${jornadaId}`);
  console.log(`ETAPAS:${recorder.steps.length}`);

  await admin.auth.admin.deleteUser(authUser.user.id);

  process.exit(report.sucesso ? 0 : 1);
}

main().catch(async (error) => {
  const report = {
    tipo: "e2e_real",
    gerado_em: new Date().toISOString(),
    fatal: error.message,
    sucesso: false,
  };
  writeReport(report);
  console.error(`E2E_REAL_FATAL:${error.message}`);
  process.exit(1);
});
