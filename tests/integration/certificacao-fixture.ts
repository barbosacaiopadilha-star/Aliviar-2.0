// FIXTURE DE CERTIFICAÇÃO — o ciclo inteiro, sem ninguém real dentro
//
// Quatro profissionais sintéticos e um Case sintético que reproduz as regras
// do caso real (Ortopedia de coluna, SP, cuidado contínuo). Existem para que
// os contratos possam ser exercidos de ponta a ponta enquanto a Rede real
// está vazia.
//
// Três compromissos, nesta ordem de importância:
//
// 1. NADA AQUI É REAL. Nomes inventados, registros `CRM-TEST-*` que o banco
//    só aceita em fixture, instituições que não existem e fontes em domínios
//    reservados pela IETF. Não há como alguém confundir um destes com um
//    médico — e o emparelhamento fixture↔Case-de-certificação garante que
//    nem o sistema consegue.
//
// 2. NENHUM ATALHO. A fixture publica pelo gatilho real, verifica com
//    proveniência real, e a área é declarada por um Curador, não deduzida. Se
//    algum contrato apertar, a fixture quebra — que é exatamente para isso
//    que ela serve.
//
// 3. IDEMPOTENTE. Chave estável por `professional_identifier`; rodar de novo
//    reaproveita o que existe. A limpeza toca só o que está marcado.

import type { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export const CERTIFICATION_CASE_TITLE = "[CERTIFICAÇÃO] Curadoria — Ortopedia de coluna";
const FIXTURE_PREFIX = "CERT-FIXTURE";

/** Fonte sintética: domínio reservado, jamais confundível com fonte real. */
function fonte(fixture: string, assunto: string): string {
  return `https://${fixture}.example.test/${assunto} — evidência sintética criada exclusivamente para certificação automatizada. Não representa fonte pública nem profissional real.`;
}

type FixtureSpec = {
  key: string;
  displayName: string;
  crm: string;
  city: string;
  practiceArea: { rawText: string; tags: string[] };
  education: { title: string; kind: string; institution: string; from: number; to: number }[];
  experience: { years: number; summary: string; mainAreas: string[] };
  career: { institution: string; role: string; from: number; to: number | null }[];
  care: { online: boolean; days: number };
  communication: { sharedDecision: boolean; familyCare: boolean | null; accessibility: string[] };
};

export const FIXTURE_SPECS: FixtureSpec[] = [
  {
    key: "fixture-a",
    displayName: "Dra. Helena Monteiro — Fixture A",
    crm: "CRM-TEST-SP-10001",
    city: "São Paulo",
    practiceArea: {
      rawText:
        "Ortopedia de coluna, tratamento clínico e cirúrgico de doenças degenerativas e traumáticas da coluna vertebral.",
      tags: ["ortopedia-de-coluna", "cirurgia-da-coluna", "coluna-vertebral"],
    },
    education: [
      { title: "Residência em Ortopedia e Traumatologia", kind: "residencia", institution: "Instituto Médico Aurora", from: 2007, to: 2010 },
      { title: "Especialização em Cirurgia da Coluna", kind: "especializacao", institution: "Centro Acadêmico Horizonte", from: 2011, to: 2012 },
    ],
    experience: {
      years: 14,
      summary:
        "Atuação sintética de certificação em casos degenerativos, traumáticos e cirúrgicos da coluna, com seguimento longitudinal.",
      mainAreas: ["coluna", "cirurgia da coluna"],
    },
    career: [
      { institution: "Hospital Escola Horizonte", role: "Médica assistente", from: 2012, to: null },
      { institution: "Clínica Aurora de Coluna", role: "Corpo clínico", from: 2014, to: null },
    ],
    care: { online: true, days: 10 },
    communication: { sharedDecision: true, familyCare: true, accessibility: ["Acesso para cadeirante"] },
  },
  {
    key: "fixture-b",
    displayName: "Dr. Rafael Nogueira — Fixture B",
    crm: "CRM-TEST-SP-10002",
    city: "Campinas",
    practiceArea: {
      rawText:
        "Cirurgia da coluna vertebral, deformidades, doenças degenerativas e tratamento de condições complexas da coluna.",
      tags: ["ortopedia-de-coluna", "cirurgia-da-coluna", "deformidades-da-coluna"],
    },
    education: [
      { title: "Residência em Ortopedia e Traumatologia", kind: "residencia", institution: "Universidade Médica Solaris", from: 2004, to: 2007 },
      { title: "Fellowship em Cirurgia da Coluna", kind: "fellowship", institution: "Instituto Clínico Meridiano", from: 2008, to: 2009 },
      { title: "Formação complementar em deformidades da coluna", kind: "curso", institution: "Centro Solaris", from: 2011, to: 2011 },
    ],
    experience: {
      years: 17,
      summary: "Atuação sintética em cirurgia da coluna, deformidades e casos de maior complexidade.",
      mainAreas: ["cirurgia da coluna", "deformidades"],
    },
    career: [
      { institution: "Hospital Universitário Solaris", role: "Médico assistente", from: 2009, to: 2016 },
      { institution: "Instituto Meridiano de Coluna", role: "Cirurgião", from: 2016, to: null },
    ],
    care: { online: true, days: 20 },
    // Participação familiar não informada de propósito: é o que derruba a
    // cobertura da Fixture B abaixo de 100.
    communication: { sharedDecision: true, familyCare: null, accessibility: [] },
  },
  {
    key: "fixture-c",
    displayName: "Dra. Marina Azevedo — Fixture C",
    crm: "CRM-TEST-SP-10003",
    city: "São Paulo",
    practiceArea: {
      rawText:
        "Tratamento conservador e cirúrgico de patologias da coluna, reabilitação integrada e acompanhamento pós-procedimento.",
      tags: ["ortopedia-de-coluna", "tratamento-conservador-da-coluna", "cirurgia-da-coluna", "reabilitacao-da-coluna"],
    },
    education: [
      { title: "Residência em Ortopedia e Traumatologia", kind: "residencia", institution: "Escola Médica Veredas", from: 2009, to: 2012 },
      { title: "Especialização em Coluna Vertebral", kind: "especializacao", institution: "Instituto Veredas", from: 2013, to: 2013 },
    ],
    experience: {
      years: 12,
      summary: "Atuação sintética em tratamento conservador, indicação cirúrgica e acompanhamento pós-procedimento.",
      mainAreas: ["coluna", "reabilitação"],
    },
    career: [
      { institution: "Clínica Veredas", role: "Médica assistente", from: 2013, to: null },
      { institution: "Centro Integrado de Reabilitação Atlas", role: "Equipe multidisciplinar", from: 2016, to: null },
    ],
    care: { online: false, days: 7 },
    communication: { sharedDecision: true, familyCare: true, accessibility: ["Acesso para cadeirante", "Libras"] },
  },
  {
    key: "fixture-d",
    displayName: "Dr. Eduardo Lima — Fixture D",
    crm: "CRM-TEST-SP-10004",
    city: "São Paulo",
    practiceArea: {
      rawText: "Cirurgia do joelho, artroscopia, lesões esportivas e reconstrução ligamentar.",
      tags: ["cirurgia-do-joelho", "artroscopia", "lesoes-esportivas"],
    },
    education: [
      { title: "Residência em Ortopedia e Traumatologia", kind: "residencia", institution: "Instituto Médico Aurora", from: 2010, to: 2013 },
      { title: "Especialização em Cirurgia do Joelho", kind: "especializacao", institution: "Centro Acadêmico Horizonte", from: 2014, to: 2015 },
    ],
    experience: {
      years: 11,
      summary: "Atuação sintética em joelho, artroscopia e lesões esportivas.",
      mainAreas: ["joelho"],
    },
    career: [{ institution: "Clínica Aurora do Joelho", role: "Cirurgião", from: 2015, to: null }],
    care: { online: true, days: 12 },
    communication: { sharedDecision: true, familyCare: true, accessibility: [] },
  },
];

export type CertificationFixture = {
  professionalIds: Record<string, string>;
  adminId: string;
};

function identifierOf(key: string): string {
  return `${FIXTURE_PREFIX}-${key.toUpperCase()}`;
}

/** O que o Case de certificação exige em área de atuação. */
export const CERTIFICATION_AREA_REQUIREMENT = "Ortopedia de coluna";

/**
 * Cria (ou reaproveita) os quatro profissionais sintéticos. Rodar duas vezes
 * devolve os mesmos identificadores e não duplica nada — a chave estável é o
 * `professional_identifier`.
 *
 * O Case não nasce aqui: ele precisa de paciente e história reais para existir
 * (`cases.source_story_id` é obrigatório), e forjá-lo por SQL contornaria
 * exatamente o contrato que a certificação deveria exercer. Quem monta o Case
 * é o teste, pelo mesmo caminho que a operação usa.
 */
export async function createCuradoriaCertificationFixture(admin: AdminClient): Promise<CertificationFixture> {
  const agora = new Date().toISOString();

  const { data: perfis } = await admin.from("profiles").select("id").limit(1);
  const adminId = perfis![0]!.id as string;

  const professionalIds: Record<string, string> = {};
  for (const spec of FIXTURE_SPECS) {
    professionalIds[spec.key] = await ensureProfessional(admin, spec, adminId, agora);
  }

  return { professionalIds, adminId };
}

/** Marca um Case já criado pelo caminho real como Case de certificação. */
export async function markCaseAsCertification(admin: AdminClient, caseId: string): Promise<void> {
  const { error } = await admin.from("cases").update({ is_certification: true }).eq("id", caseId);
  if (error) throw new Error(`fixture: marcação do Case — ${error.message}`);
}

async function ensureProfessional(
  admin: AdminClient,
  spec: FixtureSpec,
  adminId: string,
  agora: string,
): Promise<string> {
  const identifier = identifierOf(spec.key);

  const { data: existente } = await admin
    .from("professional_profiles")
    .select("id")
    .eq("professional_identifier", identifier)
    .maybeSingle();

  if (existente) return existente.id as string;

  // 1. Rascunho. Nasce não publicado, como qualquer cadastro.
  const { data, error } = await admin
    .from("professional_profiles")
    .insert({
      display_name: spec.displayName,
      professional_identifier: identifier,
      is_test_fixture: true,
      is_demo: false,
      crm: spec.crm,
      crm_uf: "SP",
      professional_summary:
        "Perfil sintético de certificação automatizada. Não representa profissional real e nunca é oferecido a paciente.",
      experience_level: "experiente",
      intake_approach: "ambos",
      offers_continuous_care: true,
      availability_window: "flexible",
      created_by: adminId,
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture ${spec.key}: cadastro — ${error.message}`);

  const id = data!.id as string;

  // 2. Registro consultado (simuladamente) no conselho, com proveniência.
  await admin
    .from("professional_profiles")
    .update({
      registration_status: "regular",
      registration_source: fonte(spec.key, "registro"),
      registration_verified_at: agora,
      registration_verified_by: adminId,
    })
    .eq("id", id);

  const proveniencia = (assunto: string) => ({
    source: fonte(spec.key, assunto),
    verification_status: "verificado" as const,
    verified_at: agora,
    verified_by: adminId,
  });

  // 3. Blocos do dossiê.
  await admin.from("professional_practice_areas").insert({
    professional_profile_id: id,
    raw_text: spec.practiceArea.rawText,
    tags: spec.practiceArea.tags,
    ...proveniencia("area-de-atuacao"),
  });

  await admin.from("professional_education_entries").insert(
    spec.education.map((e) => ({
      professional_profile_id: id,
      title: e.title,
      kind: e.kind,
      institution: e.institution,
      period_start: e.from,
      period_end: e.to,
      ...proveniencia("formacao"),
    })),
  );

  await admin.from("professional_experience").insert({
    professional_profile_id: id,
    years_of_practice: spec.experience.years,
    main_areas: spec.experience.mainAreas,
    predominant_cases: spec.experience.summary,
    current_practice: spec.experience.summary,
    ...proveniencia("experiencia"),
  });

  await admin.from("professional_career_entries").insert(
    spec.career.map((c) => ({
      professional_profile_id: id,
      institution: c.institution,
      role: c.role,
      bond: "Corpo clínico",
      period_start: c.from,
      period_end: c.to,
      ...proveniencia("trajetoria"),
    })),
  );

  await admin.from("professional_care_model").insert({
    professional_profile_id: id,
    serves_in_person: true,
    serves_online: spec.care.online,
    cities: [spec.city],
    states: ["SP"],
    offers_continuous_care: true,
    offers_return_visits: true,
    multidisciplinary_team: spec.key === "fixture-c",
    availability_window: "Manhãs",
    avg_days_to_first_appointment: spec.care.days,
    ...proveniencia("modelo-de-atendimento"),
  });

  await admin.from("professional_communication").insert({
    professional_profile_id: id,
    shared_decision: spec.communication.sharedDecision,
    family_care: spec.communication.familyCare,
    languages: ["Português"],
    accessibility: spec.communication.accessibility,
    resources: [],
    ...proveniencia("comunicacao"),
  });

  // 4. Competência legada — o filtro de área do motor antigo ainda a lê.
  await admin.from("professional_competency_areas").insert({
    professional_profile_id: id,
    domain: "saude_fisica",
    focus: "acompanhamento_continuo",
  });

  // 5. Publicação pelo gatilho real. Se algum requisito acima faltasse, isto
  //    falharia — e é essa falha que a fixture existe para poder provocar.
  const { error: pubError } = await admin
    .from("professional_profiles")
    .update({ publication_status: "publicado" })
    .eq("id", id);
  if (pubError) throw new Error(`fixture ${spec.key}: publicação — ${pubError.message}`);

  return id;
}

/**
 * Remove só o que está marcado como certificação. Nenhum `delete` aqui sabe
 * o que é um dado real, e é assim que tem de ser.
 */
export async function cleanupCuradoriaCertificationFixture(admin: AdminClient): Promise<void> {
  // Os Cases de certificação saem primeiro: `curated_selection_options` e
  // `curadoria_report_options` referenciam o profissional, e apagá-lo antes
  // violaria a FK — o erro passaria despercebido e o perfil sobreviveria à
  // rodada.
  const { data: casos } = await admin.from("cases").select("id").eq("is_certification", true);
  const caseIds = (casos ?? []).map((row) => row.id as string);

  if (caseIds.length > 0) {
    await admin.from("cases").delete().in("id", caseIds);
  }

  const { data: profissionais } = await admin
    .from("professional_profiles")
    .select("id")
    .eq("is_test_fixture", true);
  const ids = (profissionais ?? []).map((row) => row.id as string);

  if (ids.length > 0) {
    // Os blocos do dossiê caem por cascade junto com o perfil.
    await admin.from("professional_competency_areas").delete().in("professional_profile_id", ids);

    // OPS-G5 C7: `assert_exclusao_sem_historia` roda BEFORE DELETE e conta as
    // mesmas linhas que o cascade levaria — então o cascade não chega a
    // acontecer, e a remoção é recusada com "Retire da rede". A história tem de
    // sair antes do cadastro, explicitamente.
    for (const tabela of [
      "connection_records",
      "curated_selection_options",
      "curadoria_report_options",
      "professional_subcriterion_map",
      "practice_evidence",
    ] as const) {
      const { error } = await admin.from(tabela).delete().in("professional_profile_id", ids);
      if (error) throw new Error(`fixture: limpeza de ${tabela} — ${error.message}`);
    }

    // E o erro deixa de ser engolido. Foi por isso que a recusa passou
    // despercebida: as fixtures sobreviviam à rodada, e a suíte seguinte
    // encontrava perfil de certificação de pé sem Case que o autorizasse.
    const { error } = await admin.from("professional_profiles").delete().in("id", ids);
    if (error) throw new Error(`fixture: remoção dos perfis de certificação — ${error.message}`);
  }
}
