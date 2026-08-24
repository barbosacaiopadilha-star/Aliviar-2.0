#!/usr/bin/env node
/**
 * Seed da SIMULAÇÃO — três profissionais de perfil COMPLETO (24/08).
 *
 * ⚠️  ESTES PROFISSIONAIS NÃO EXISTEM.
 *
 * Diferença para `seed-rede-demonstracao.mjs`: aquele cobre o espectro do
 * Motor de propósito, com duas lacunas DELIBERADAS, para o Curador ver como o
 * sistema se comporta com cadastro incompleto. Este aqui é o oposto — três
 * fichas sem nenhum buraco, para a travessia inteira poder ser percorrida:
 * competência, formação com selo, experiência e disponibilidade.
 *
 * Os três são diferentes entre si de propósito (experiência, abordagem de
 * entrada, continuidade e janela de agenda), senão a comparação do Motor não
 * teria o que comparar. O que NÃO varia é a completude.
 *
 * Marcação: identificador `SIM-*` e o aviso no fim do resumo profissional.
 * Um médico fictício confundido com um aprovado de verdade é o pior defeito
 * possível deste produto — a marca vale mesmo aqui, onde o alvo é local.
 *
 *   node scripts/with-local-supabase.mjs node scripts/seed-simulacao-local.mjs
 *   node scripts/with-local-supabase.mjs node scripts/seed-simulacao-local.mjs --remove
 *
 * O alvo NUNCA vem de `.env.local` (que aponta para o projeto hospedado):
 * `resolverAlvoLocal` recusa qualquer coisa que não seja a stack local.
 */

import { createClient } from "@supabase/supabase-js";

import { resolverAlvoLocal } from "./env-guard.mjs";

const MARCA = "[PERFIL DE SIMULAÇÃO — profissional fictício, não existe]";

const REDE = [
  {
    display_name: "Dra. Helena Vasconcelos (simulação)",
    professional_identifier: "SIM-001",
    crm: "123456",
    crm_uf: "SP",
    institution_name: "Instituto Aliviar de Simulação",
    resumo:
      "Clínica com prática longa em dor persistente, com atenção especial a quem já passou por " +
      "vários especialistas sem resposta clara. Prefere uma avaliação inicial antes de propor " +
      "conduta, e acompanha o caso ao longo do tempo.",
    experience_level: "altamente_experiente",
    intake_approach: "avaliacao_inicial",
    offers_continuous_care: true,
    availability_window: "flexible",
    competencias: [
      { domain: "saude_fisica", focus: "avaliacao" },
      { domain: "saude_fisica", focus: "acompanhamento_continuo" },
    ],
    formacao: [
      { title: "Medicina", kind: "graduacao", institution: "Universidade de São Paulo", period_start: 2001, period_end: 2006 },
      { title: "Clínica Médica", kind: "residencia", institution: "Hospital das Clínicas da FMUSP", period_start: 2007, period_end: 2009 },
      { title: "Dor e Cuidados Paliativos", kind: "especializacao", institution: "Universidade Federal de São Paulo", period_start: 2010, period_end: 2012 },
    ],
    experiencia: {
      years_of_practice: 18,
      main_areas: ["dor persistente", "reabilitação", "segunda opinião"],
      predominant_cases: "Pessoas com dor de longa duração e diagnóstico ainda em aberto.",
      current_practice: "Consultório próprio, com retorno estruturado e contato entre consultas.",
    },
  },
  {
    display_name: "Dr. Otávio Lemos (simulação)",
    professional_identifier: "SIM-002",
    crm: "234567",
    crm_uf: "SP",
    institution_name: "Instituto Aliviar de Simulação",
    resumo:
      "Trabalha com escuta longa e conversa direta desde o primeiro encontro. Costuma receber " +
      "quem chega cansado de explicar a própria história e quer ser ouvido antes de qualquer exame.",
    experience_level: "experiente",
    intake_approach: "conexao_direta",
    offers_continuous_care: true,
    availability_window: "limited",
    competencias: [
      { domain: "saude_emocional_mental", focus: "avaliacao" },
      { domain: "saude_emocional_mental", focus: "intervencao" },
    ],
    formacao: [
      { title: "Medicina", kind: "graduacao", institution: "Universidade Estadual de Campinas", period_start: 2005, period_end: 2010 },
      { title: "Psiquiatria", kind: "residencia", institution: "Instituto de Psiquiatria da USP", period_start: 2011, period_end: 2014 },
      { title: "Terapia Cognitivo-Comportamental", kind: "pos_graduacao", institution: "Universidade Federal do Rio Grande do Sul", period_start: 2015, period_end: 2016 },
    ],
    experiencia: {
      years_of_practice: 14,
      main_areas: ["ansiedade", "sofrimento persistente", "acompanhamento longo"],
      predominant_cases: "Adultos em quadros que se arrastam há anos, muitas vezes sem diagnóstico único.",
      current_practice: "Atendimento em consultório, com agenda reduzida e vagas espaçadas.",
    },
  },
  {
    display_name: "Dra. Cecília Andrade (simulação)",
    professional_identifier: "SIM-003",
    crm: "345678",
    crm_uf: "SP",
    institution_name: "Instituto Aliviar de Simulação",
    resumo:
      "Faz um aprofundamento do histórico antes do primeiro encontro, para chegar à consulta já " +
      "conhecendo o caso. Indicada para quem tem muitos exames acumulados e quer entender o conjunto.",
    experience_level: "experiente",
    intake_approach: "aprofundamento_previo",
    offers_continuous_care: false,
    availability_window: "flexible",
    competencias: [
      { domain: "saude_fisica", focus: "esclarecimento" },
      { domain: "saude_emocional_mental", focus: "avaliacao" },
    ],
    formacao: [
      { title: "Medicina", kind: "graduacao", institution: "Universidade Federal de Minas Gerais", period_start: 2004, period_end: 2009 },
      { title: "Neurologia", kind: "residencia", institution: "Hospital das Clínicas da UFMG", period_start: 2010, period_end: 2013 },
      { title: "Cefaleias", kind: "fellowship", institution: "Universidade Federal de São Paulo", period_start: 2014, period_end: 2015 },
    ],
    experiencia: {
      years_of_practice: 15,
      main_areas: ["cefaleias", "investigação diagnóstica", "revisão de exames"],
      predominant_cases: "Quadros já investigados por outros profissionais, com exames a interpretar.",
      current_practice: "Consultas de esclarecimento, sem acompanhamento contínuo — devolve o caso com um plano.",
    },
  },
];

let alvo;
try {
  alvo = resolverAlvoLocal("Seed da simulação");
} catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

function env(nome) {
  const valor = alvo[nome] ?? process.env[nome];
  if (!valor) throw new Error(`${nome} não está definida.`);
  return valor;
}

const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  db: { schema: "curadoria" },
  auth: { autoRefreshToken: false, persistSession: false },
});

async function remover() {
  const { data } = await supabase
    .from("professional_profiles")
    .select("id")
    .like("professional_identifier", "SIM-%");

  const ids = (data ?? []).map((linha) => linha.id);
  if (ids.length === 0) {
    console.log("Nenhum perfil de simulação encontrado.");
    return;
  }

  // As filhas caem por `on delete cascade`, mas apagar explicitamente deixa o
  // efeito visível em vez de implícito.
  await supabase.from("professional_education_entries").delete().in("professional_profile_id", ids);
  await supabase.from("professional_experience").delete().in("professional_profile_id", ids);
  await supabase.from("professional_competency_areas").delete().in("professional_profile_id", ids);
  const { error } = await supabase.from("professional_profiles").delete().in("id", ids);
  if (error) throw new Error(error.message);

  console.log(`Removidos ${ids.length} perfis de simulação.`);
}

async function inserir() {
  // Autoria nunca é inventada: `created_by` e `verified_by` são o administrador
  // real do banco. Sem ele, o seed para — é a mesma regra do seed da rede.
  const { data: admins } = await supabase
    .from("user_roles")
    .select("profile_id, roles!inner(slug)")
    .eq("roles.slug", "administrador")
    .limit(1);

  const adminId = admins?.[0]?.profile_id;
  if (!adminId) {
    throw new Error(
      "Nenhum administrador encontrado. Rode `npm run bootstrap:test-users` antes — o seed não inventa autoria.",
    );
  }

  const agora = new Date().toISOString();

  for (const perfil of REDE) {
    const { competencias, formacao, experiencia, resumo, ...campos } = perfil;

    const { data, error } = await supabase
      .from("professional_profiles")
      .insert({
        ...campos,
        professional_summary: `${resumo}\n\n${MARCA}`,
        status: "ativo",
        // Perfil completo é perfil PUBLICADO — senão ele não chega à Mesa.
        publication_status: "publicado",
        created_by: adminId,
        updated_by: adminId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ ${perfil.display_name}: ${error.message}`);
      continue;
    }

    const falhas = [];

    const { error: erroCompetencia } = await supabase
      .from("professional_competency_areas")
      .insert(competencias.map((c) => ({ professional_profile_id: data.id, ...c })));
    if (erroCompetencia) falhas.push(`competência: ${erroCompetencia.message}`);

    // Formação VERIFICADA — é o selo que a carta da paciente mostra. Mão
    // humana é verificação (ADR-079): quem lança, carimba, com autoria e data.
    const { error: erroFormacao } = await supabase.from("professional_education_entries").insert(
      formacao.map((f) => ({
        professional_profile_id: data.id,
        ...f,
        source: "digitacao_manual",
        verification_status: "verificado",
        verified_at: agora,
        verified_by: adminId,
      })),
    );
    if (erroFormacao) falhas.push(`formação: ${erroFormacao.message}`);

    const { error: erroExperiencia } = await supabase.from("professional_experience").insert({
      professional_profile_id: data.id,
      ...experiencia,
      source: "digitacao_manual",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: adminId,
    });
    if (erroExperiencia) falhas.push(`experiência: ${erroExperiencia.message}`);

    if (falhas.length > 0) {
      console.error(`  ⚠ ${perfil.display_name} — ${falhas.join(" · ")}`);
    } else {
      console.log(
        `  ✓ ${perfil.display_name} — ${competencias.length} competências, ` +
          `${formacao.length} formações verificadas, experiência preenchida`,
      );
    }
  }

  console.log(`\n${REDE.length} perfis de SIMULAÇÃO inseridos, todos publicados e sem lacuna.`);
  console.log("Para remover: node scripts/with-local-supabase.mjs node scripts/seed-simulacao-local.mjs --remove");
}

const remove = process.argv.includes("--remove");
console.log(
  remove
    ? "Removendo os perfis de simulação...\n"
    : `⚠️  Inserindo profissionais FICTÍCIOS em ${alvo.NEXT_PUBLIC_SUPABASE_URL}\n`,
);

await (remove ? remover() : inserir());
