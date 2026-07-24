/**
 * Seed idempotente da rede de demonstração — dados fictícios (prefixo DEMO_).
 * Uso: node scripts/seed-rede-demonstracao.mjs [--cleanup]
 */
import { randomUUID } from "node:crypto";
import {
  ADMIN_USER_ID,
  createAdminClient,
  loadValidationEnv,
} from "./local/validation-lib.mjs";

const MARKER_KEY = "DEMO_REDE_DEMONSTRACAO";
const DEMO_PATIENT_EMAIL = "DEMO_paciente@aliviar.demo";
const DEMO_JOURNEY_TITLE = "DEMO_Jornada compatibilidade dossiê";

const DEMO_DOCTORS = [
  {
    id: "DEMO_DOC_A",
    nome: "DEMO_Dra. Ana Costa",
    especialidade: "Cardiologia",
    nota_curador: "Trajetória sólida em cardiologia preventiva.",
  },
  {
    id: "DEMO_DOC_B",
    nome: "DEMO_Dr. Bruno Mendes",
    especialidade: "Cardiologia",
    nota_curador: "Experiência em abordagem conservadora.",
  },
  {
    id: "DEMO_DOC_C",
    nome: "DEMO_Dra. Carla Ribeiro",
    especialidade: "Cardiologia",
    nota_curador: "Forte em comunicação e acompanhamento longitudinal.",
  },
];

const DEMO_DIMENSOES = [
  { nome: "Experiência clínica", descricao: "Trajetória e volume de casos similares" },
  { nome: "Proximidade", descricao: "Facilidade de acesso e logística" },
  { nome: "Abordagem", descricao: "Estilo de comunicação e método" },
];

const DEMO_PESOS = {
  "Experiência clínica": 40,
  Proximidade: 30,
  Abordagem: 30,
};

async function hasMarker(admin) {
  const { data, error } = await admin
    .from("system_configuration")
    .select("key")
    .eq("key", MARKER_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`marker_check_failed:${error.message}`);
  }

  return Boolean(data);
}

async function writeMarker(admin, payload) {
  const { error } = await admin.from("system_configuration").upsert({
    key: MARKER_KEY,
    value: payload,
    updated_by: ADMIN_USER_ID,
  });

  if (error) {
    throw new Error(`marker_write_failed:${error.message}`);
  }
}

async function resolveDemoAuthUserIdFromPatients(admin, email) {
  const { data: patients, error } = await admin
    .from("patients")
    .select("auth_user_id")
    .ilike("email", email)
    .not("auth_user_id", "is", null)
    .limit(1);

  if (error) {
    throw new Error(`patient_auth_lookup_failed:${error.message}`);
  }

  return patients?.[0]?.auth_user_id ?? null;
}

async function findAuthUserByEmail(admin, email) {
  const fromPatients = await resolveDemoAuthUserIdFromPatients(admin, email);
  if (fromPatients) {
    return { id: fromPatients, email: email.trim().toLowerCase() };
  }

  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      if (/invalid jwt|unverifiable/i.test(error.message)) {
        return null;
      }
      throw new Error(`auth_list_failed:${error.message}`);
    }

    const hit = data.users.find((user) => (user.email ?? "").toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }

  return null;
}

async function ensureDemoAuthUser(admin, email, password) {
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    return existing.id;
  }

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    if (authError && /already been registered/i.test(authError.message)) {
      const retry = await findAuthUserByEmail(admin, email);
      if (retry) {
        return retry.id;
      }
    }

    if (authError && /invalid jwt|unverifiable/i.test(authError.message)) {
      const fallback = await resolveDemoAuthUserIdFromPatients(admin, email);
      if (fallback) {
        return fallback;
      }
    }

    throw new Error(`auth_user_create_failed:${authError?.message ?? "no_user"}`);
  }

  return authUser.user.id;
}

async function ensureCuradoriaProfile(admin, profileId, displayName) {
  const { error } = await admin.schema("curadoria").from("profiles").upsert({
    id: profileId,
    display_name: displayName,
  });

  if (error) {
    throw new Error(`curadoria_profile_upsert_failed:${error.message}`);
  }
}

async function ensureProfessionalProfile(admin, doctor) {
  const profileId = doctor.professional_profile_id;

  const { error: profileError } = await admin.schema("curadoria").from("professional_profiles").upsert({
    id: profileId,
    display_name: doctor.nome,
    professional_identifier: doctor.id,
    status: "ativo",
    publication_status: "publicado",
    created_by: ADMIN_USER_ID,
    practical_considerations: [],
  });

  if (profileError) {
    throw new Error(`professional_profile_upsert_failed:${profileError.message}`);
  }

  await admin
    .schema("curadoria")
    .from("professional_competency_areas")
    .delete()
    .eq("professional_profile_id", profileId);

  const { error: competencyError } = await admin
    .schema("curadoria")
    .from("professional_competency_areas")
    .insert({
      professional_profile_id: profileId,
      domain: "saude_fisica",
      focus: "acompanhamento_continuo",
    });

  if (competencyError) {
    throw new Error(`professional_competency_insert_failed:${competencyError.message}`);
  }
}

async function cleanupOrphanDemo(admin) {
  const authUser = await findAuthUserByEmail(admin, DEMO_PATIENT_EMAIL);
  if (!authUser) return;

  const { data: patients } = await admin
    .from("patients")
    .select("id")
    .eq("auth_user_id", authUser.id);

  for (const patient of patients ?? []) {
    const { data: journeys } = await admin
      .from("journeys")
      .select("id")
      .eq("patient_id", patient.id)
      .ilike("title", "DEMO_%");

    for (const journey of journeys ?? []) {
      await admin.from("curator_case_workspaces").delete().eq("journey_id", journey.id);
      await admin.from("patient_journey_views").delete().eq("journey_id", journey.id);
      await admin.from("journeys").delete().eq("id", journey.id);
    }
  }

  const { data: cases } = await admin
    .schema("curadoria")
    .from("cases")
    .select("id")
    .eq("patient_profile_id", authUser.id);

  for (const caso of cases ?? []) {
    await admin.schema("curadoria").from("patient_curadoria_decisions").delete().eq("case_id", caso.id);
    await admin.schema("curadoria").from("devolutiva_records").delete().eq("case_id", caso.id);

    const { data: reports } = await admin
      .schema("curadoria")
      .from("curadoria_reports")
      .select("id")
      .eq("case_id", caso.id);

    if (reports?.length) {
      await admin
        .schema("curadoria")
        .from("curadoria_report_options")
        .delete()
        .in(
          "report_id",
          reports.map((row) => row.id),
        );
      await admin.schema("curadoria").from("curadoria_reports").delete().eq("case_id", caso.id);
    }

    const { data: selections } = await admin
      .schema("curadoria")
      .from("curated_selections")
      .select("id")
      .eq("case_id", caso.id);

    if (selections?.length) {
      await admin
        .schema("curadoria")
        .from("curated_selection_options")
        .delete()
        .in(
          "curated_selection_id",
          selections.map((row) => row.id),
        );
      await admin.schema("curadoria").from("curated_selections").delete().eq("case_id", caso.id);
    }

    const { data: profiles } = await admin
      .schema("curadoria")
      .from("priority_profiles")
      .select("id")
      .eq("case_id", caso.id);

    if (profiles?.length) {
      await admin
        .schema("curadoria")
        .from("priority_weights")
        .delete()
        .in(
          "priority_profile_id",
          profiles.map((row) => row.id),
        );
      await admin.schema("curadoria").from("priority_profiles").delete().eq("case_id", caso.id);
    }

    await admin.schema("curadoria").from("case_events").delete().eq("case_id", caso.id);
    await admin.schema("curadoria").from("cases").delete().eq("id", caso.id);
  }

  await admin.schema("curadoria").from("patient_stories").delete().eq("profile_id", authUser.id);
}

async function cleanup(admin) {
  console.log("DEMO_CLEANUP_START");

  const { data: marker } = await admin
    .from("system_configuration")
    .select("value")
    .eq("key", MARKER_KEY)
    .maybeSingle();

  const ids = marker?.value ?? {};

  if (ids.journey_id) {
    await admin.from("curator_case_workspaces").delete().eq("journey_id", ids.journey_id);
    await admin.from("patient_journey_views").delete().eq("journey_id", ids.journey_id);
    await admin.from("journeys").delete().eq("id", ids.journey_id);
  }

  if (ids.caso_id) {
    const casoId = ids.caso_id;
    await admin.schema("curadoria").from("patient_curadoria_decisions").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("devolutiva_records").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("curadoria_report_options").delete().in(
      "report_id",
      (
        await admin
          .schema("curadoria")
          .from("curadoria_reports")
          .select("id")
          .eq("case_id", casoId)
      ).data?.map((row) => row.id) ?? [],
    );
    await admin.schema("curadoria").from("curadoria_reports").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("curated_selection_options").delete().in(
      "curated_selection_id",
      (
        await admin
          .schema("curadoria")
          .from("curated_selections")
          .select("id")
          .eq("case_id", casoId)
      ).data?.map((row) => row.id) ?? [],
    );
    await admin.schema("curadoria").from("curated_selections").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("priority_weights").delete().in(
      "priority_profile_id",
      (
        await admin
          .schema("curadoria")
          .from("priority_profiles")
          .select("id")
          .eq("case_id", casoId)
      ).data?.map((row) => row.id) ?? [],
    );
    await admin.schema("curadoria").from("priority_profiles").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("case_events").delete().eq("case_id", casoId);
    await admin.schema("curadoria").from("cases").delete().eq("id", casoId);
  }

  if (ids.story_id) {
    await admin.schema("curadoria").from("patient_stories").delete().eq("id", ids.story_id);
  }

  if (ids.patient_profile_id) {
    await admin.schema("curadoria").from("patient_profiles").delete().eq("profile_id", ids.patient_profile_id);
    await admin.schema("curadoria").from("profiles").delete().eq("id", ids.patient_profile_id);
  }

  for (const doctor of ids.doctors ?? []) {
    await admin.schema("curadoria").from("professional_competency_areas").delete().eq(
      "professional_profile_id",
      doctor.professional_profile_id,
    );
    await admin.schema("curadoria").from("professional_profiles").delete().eq("id", doctor.professional_profile_id);
  }

  if (ids.patient_id) {
    const { data: patient } = await admin
      .from("patients")
      .select("auth_user_id")
      .eq("id", ids.patient_id)
      .maybeSingle();
    await admin.from("patients").delete().eq("id", ids.patient_id);
    if (patient?.auth_user_id) {
      await admin.auth.admin.deleteUser(patient.auth_user_id);
    }
  }

  await admin.from("system_configuration").delete().eq("key", MARKER_KEY);

  console.log("DEMO_CLEANUP_DONE");
}

async function seed(admin) {
  if (await hasMarker(admin)) {
    console.log("DEMO_SEED_SKIP:marker_exists");
    return;
  }

  console.log("DEMO_SEED_START");

  await cleanupOrphanDemo(admin);

  const patientId = randomUUID();
  const journeyId = randomUUID();
  const casoId = randomUUID();
  const storyId = randomUUID();
  const priorityProfileId = randomUUID();
  const selectionId = randomUUID();
  const now = new Date().toISOString();
  const demoPassword = `DEMO-${Date.now()}-Aa1!`;

  const patientProfileId = await ensureDemoAuthUser(admin, DEMO_PATIENT_EMAIL, demoPassword);

  const { data: existingPatient, error: existingPatientError } = await admin
    .from("patients")
    .select("id")
    .eq("auth_user_id", patientProfileId)
    .maybeSingle();

  if (existingPatientError) {
    throw new Error(`patient_lookup_failed:${existingPatientError.message}`);
  }

  const resolvedPatientId = existingPatient?.id ?? patientId;

  const doctors = DEMO_DOCTORS.map((doctor) => ({
    ...doctor,
    professional_profile_id: randomUUID(),
  }));

  const { error: patientError } = await admin.from("patients").upsert({
    id: resolvedPatientId,
    full_name: "DEMO_Paciente Demonstração",
    preferred_name: "DEMO_Paciente",
    email: DEMO_PATIENT_EMAIL,
    status: "ACTIVE",
    auth_user_id: patientProfileId,
    created_by: ADMIN_USER_ID,
  });

  if (patientError) {
    throw new Error(`patient_insert_failed:${patientError.message}`);
  }

  await ensureCuradoriaProfile(admin, patientProfileId, "DEMO_Paciente");

  const { error: patientProfileError } = await admin.schema("curadoria").from("patient_profiles").upsert({
    profile_id: patientProfileId,
    status: "ativo",
  });

  if (patientProfileError) {
    throw new Error(`patient_profile_insert_failed:${patientProfileError.message}`);
  }

  const { error: journeyError } = await admin.from("journeys").insert({
    id: journeyId,
    patient_id: resolvedPatientId,
    title: DEMO_JOURNEY_TITLE,
    objective: "DEMO_Compatibilidade do fluxo Mesa → Dossiê → Devolutiva",
    status: "ACTIVE",
    priority: "NORMAL",
    manager_id: ADMIN_USER_ID,
    created_by: ADMIN_USER_ID,
  });

  if (journeyError) {
    throw new Error(`journey_insert_failed:${journeyError.message}`);
  }

  const { error: storyError } = await admin.schema("curadoria").from("patient_stories").insert({
    id: storyId,
    profile_id: patientProfileId,
    status: "enviada",
    current_step: "COMPLETE",
    data: { demo: true },
    revision: 1,
    created_by: ADMIN_USER_ID,
  });

  if (storyError) {
    throw new Error(`story_insert_failed:${storyError.message}`);
  }

  const { error: casoError } = await admin.schema("curadoria").from("cases").insert({
    id: casoId,
    patient_profile_id: patientProfileId,
    source_story_id: storyId,
    status: "IN_CURATION",
    assigned_curator_id: ADMIN_USER_ID,
    created_by: ADMIN_USER_ID,
  });

  if (casoError) {
    throw new Error(`caso_insert_failed:${casoError.message}`);
  }

  const { error: perfilError } = await admin.schema("curadoria").from("priority_profiles").insert({
    id: priorityProfileId,
    case_id: casoId,
    curator_id: ADMIN_USER_ID,
    status: "DRAFT",
  });

  if (perfilError) {
    throw new Error(`perfil_insert_failed:${perfilError.message}`);
  }

  const weightRows = DEMO_DIMENSOES.map((dimensao) => ({
    id: randomUUID(),
    priority_profile_id: priorityProfileId,
    criterion: dimensao.nome,
    weight: DEMO_PESOS[dimensao.nome],
    target_value: dimensao.descricao,
    evidence: dimensao.descricao,
  }));

  const { error: weightsError } = await admin.schema("curadoria").from("priority_weights").insert(weightRows);

  if (weightsError) {
    throw new Error(`weights_insert_failed:${weightsError.message}`);
  }

  const { error: perfilValidateError } = await admin
    .schema("curadoria")
    .from("priority_profiles")
    .update({ status: "VALIDATED", validated_at: now })
    .eq("id", priorityProfileId);

  if (perfilValidateError) {
    throw new Error(`perfil_validate_failed:${perfilValidateError.message}`);
  }

  for (const doctor of doctors) {
    await ensureProfessionalProfile(admin, doctor);
  }

  const { error: selectionError } = await admin.schema("curadoria").from("curated_selections").insert({
    id: selectionId,
    case_id: casoId,
    priority_profile_id: priorityProfileId,
    selected_by: ADMIN_USER_ID,
    composition_rationale: "DEMO_Mesa concluída com três opções.",
    status: "DRAFT",
  });

  if (selectionError) {
    throw new Error(`selection_insert_failed:${selectionError.message}`);
  }

  const selectionBands = ["ALTA", "BOA", "MODERADA"];
  const selectionOptions = doctors.map((doctor, index) => ({
    id: randomUUID(),
    curated_selection_id: selectionId,
    professional_profile_id: doctor.professional_profile_id,
    position: index + 1,
    band: selectionBands[index] ?? "MODERADA",
    rationale: doctor.nota_curador,
  }));

  const { error: selectionOptionsError } = await admin
    .schema("curadoria")
    .from("curated_selection_options")
    .insert(selectionOptions);

  if (selectionOptionsError) {
    throw new Error(`selection_options_insert_failed:${selectionOptionsError.message}`);
  }

  const { error: selectionDeliverError } = await admin
    .schema("curadoria")
    .from("curated_selections")
    .update({ status: "DELIVERED", delivered_at: now })
    .eq("id", selectionId);

  if (selectionDeliverError) {
    throw new Error(`selection_deliver_failed:${selectionDeliverError.message}`);
  }

  const { error: workspaceError } = await admin.from("curator_case_workspaces").upsert({
    journey_id: journeyId,
    curator_id: ADMIN_USER_ID,
    assumed_at: now,
    workspace_data: {
      curadoria_case_id: casoId,
      dossie_versao_atual: 1,
      dossie_comparativo: [],
      dossie_versao_status: "RASCUNHO",
    },
    updated_at: now,
  });

  if (workspaceError) {
    throw new Error(`workspace_insert_failed:${workspaceError.message}`);
  }

  const { error: eventError } = await admin.schema("curadoria").from("case_events").insert({
    case_id: casoId,
    event_type: "created",
    actor_id: ADMIN_USER_ID,
    to_value: "CASO_ABERTO",
    reason: JSON.stringify({ demo: true, journey_id: journeyId }),
  });

  if (eventError) {
    throw new Error(`case_event_insert_failed:${eventError.message}`);
  }

  await writeMarker(admin, {
    seeded_at: now,
    patient_id: resolvedPatientId,
    patient_profile_id: patientProfileId,
    journey_id: journeyId,
    caso_id: casoId,
    story_id: storyId,
    doctors,
  });

  console.log("DEMO_SEED_DONE");
  console.log(`DEMO_PATIENT:${resolvedPatientId}`);
  console.log(`DEMO_JOURNEY:${journeyId}`);
  console.log(`DEMO_CASO:${casoId}`);
}

async function main() {
  const cleanupMode = process.argv.includes("--cleanup");
  const env = loadValidationEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
    process.exit(2);
  }

  const admin = createAdminClient(env);

  if (cleanupMode) {
    await cleanup(admin);
    process.exit(0);
  }

  await seed(admin);
}

main().catch((error) => {
  console.error(`DEMO_SEED_FATAL:${error.message}`);
  process.exit(1);
});
