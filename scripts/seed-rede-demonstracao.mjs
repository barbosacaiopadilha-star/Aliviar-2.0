#!/usr/bin/env node
/**
 * Seed da rede de DEMONSTRAÇÃO — profissionais fictícios (MISSÃO 209, Fase 5).
 *
 * ⚠️  ESTES PROFISSIONAIS NÃO EXISTEM.
 *
 * Existem para que a Mesa de Curadoria possa ser exercitada de ponta a ponta
 * com dados completos, antes de a rede real ser cadastrada. Cada um é marcado
 * de forma inequívoca em `professional_summary` e no identificador
 * (`DEMO-*`), para que ninguém confunda com profissional aprovado de verdade.
 *
 * Por que isso NÃO roda sozinho: o banco de destino é o mesmo que serve
 * pacientes reais. Um médico fictício ali dentro pode acabar numa Curadoria
 * de verdade, e o paciente receberia como opção de cuidado alguém que não
 * existe. Rodar é sempre decisão deliberada de quem opera.
 *
 *   node scripts/seed-rede-demonstracao.mjs           # insere
 *   node scripts/seed-rede-demonstracao.mjs --remove  # remove tudo o que inseriu
 *
 * Exige NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */

import { createClient } from "@supabase/supabase-js";

import { resolverAlvoLocal } from "./env-guard.mjs";

const MARCA = "[PERFIL DE DEMONSTRAÇÃO — profissional fictício, não existe]";

// Sete perfis que cobrem o espectro do Motor de propósito: combinações
// diferentes de experiência, abordagem, continuidade e disponibilidade, mais
// dois com lacunas deliberadas — para que o Curador veja como o sistema se
// comporta quando o cadastro está incompleto.
const REDE = [
  {
    display_name: "Dra. Beatriz Fontenelle (demo)",
    professional_identifier: "DEMO-001",
    crm_uf: "SP",
    experience_level: "experiente",
    intake_approach: "avaliacao_inicial",
    offers_continuous_care: true,
    availability_window: "flexible",
    domains: ["saude_emocional_mental"],
  },
  {
    display_name: "Dr. Ismael Cardoso (demo)",
    professional_identifier: "DEMO-002",
    crm_uf: "SP",
    experience_level: "altamente_experiente",
    intake_approach: "ambos",
    offers_continuous_care: true,
    availability_window: "limited",
    domains: [], // lacuna deliberada: área de atuação não levantada
  },
  {
    display_name: "Dra. Solange Vieira (demo)",
    professional_identifier: "DEMO-003",
    crm_uf: "SP",
    experience_level: "experiente",
    intake_approach: "conexao_direta",
    offers_continuous_care: false,
    availability_window: "flexible",
    domains: ["saude_emocional_mental"],
  },
  {
    display_name: "Dr. Rafael Toledo (demo)",
    professional_identifier: "DEMO-004",
    crm_uf: "SP",
    experience_level: "geral",
    intake_approach: "ambos",
    offers_continuous_care: true,
    availability_window: "limited",
    domains: ["saude_emocional_mental", "saude_fisica"],
  },
  {
    display_name: "Dra. Ana Lúcia Prado (demo)",
    professional_identifier: "DEMO-005",
    crm_uf: "SP",
    experience_level: "altamente_experiente",
    intake_approach: "aprofundamento_previo",
    offers_continuous_care: true,
    availability_window: "unavailable_soon",
    domains: ["saude_fisica"],
  },
  {
    display_name: "Dr. Henrique Sá (demo)",
    professional_identifier: "DEMO-006",
    crm_uf: "RJ", // fora de SP: exercita a eliminação por restrição de UF
    experience_level: "experiente",
    intake_approach: "avaliacao_inicial",
    offers_continuous_care: true,
    availability_window: "flexible",
    domains: ["saude_emocional_mental"],
  },
  {
    display_name: "Dra. Marta Nogueira (demo)",
    professional_identifier: "DEMO-007",
    crm_uf: "SP",
    experience_level: null, // lacuna deliberada
    intake_approach: null, // lacuna deliberada
    offers_continuous_care: null,
    availability_window: "flexible",
    domains: ["saude_emocional_mental"],
  },
];

// O alvo NUNCA vem de `.env.local` — este script apaga linhas
// (`DELETE ... LIKE 'DEMO-%'`), e `.env.local` aponta para um projeto
// hospedado. `resolverAlvoLocal` valida antes de qualquer chamada externa.
let alvo;
try {
  alvo = resolverAlvoLocal("Seed da rede de demonstração");
} catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

function env(name) {
  const value = alvo[name] ?? process.env[name];
  if (!value) throw new Error(`${name} não está definida.`);
  return value;
}

const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  db: { schema: "curadoria" },
  auth: { autoRefreshToken: false, persistSession: false },
});

async function remover() {
  const { data } = await supabase
    .from("professional_profiles")
    .select("id, display_name")
    .like("professional_identifier", "DEMO-%");

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) {
    console.log("Nenhum perfil de demonstração encontrado.");
    return;
  }

  await supabase.from("professional_competency_areas").delete().in("professional_profile_id", ids);
  const { error } = await supabase.from("professional_profiles").delete().in("id", ids);
  if (error) throw new Error(error.message);

  console.log(`Removidos ${ids.length} perfis de demonstração.`);
}

async function inserir() {
  // created_by é obrigatório e precisa ser um profile real. Usa o primeiro
  // administrador — nunca inventa um id.
  const { data: admins } = await supabase
    .from("user_roles")
    .select("profile_id, roles!inner(slug)")
    .eq("roles.slug", "administrador")
    .limit(1);

  const createdBy = admins?.[0]?.profile_id;
  if (!createdBy) {
    throw new Error(
      "Nenhum administrador encontrado. O seed não inventa autoria — cadastre um administrador antes.",
    );
  }

  for (const perfil of REDE) {
    const { domains, ...campos } = perfil;

    const { data, error } = await supabase
      .from("professional_profiles")
      .insert({
        ...campos,
        professional_summary: MARCA,
        status: "ativo",
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ ${perfil.display_name}: ${error.message}`);
      continue;
    }

    if (domains.length > 0) {
      await supabase.from("professional_competency_areas").insert(
        domains.map((domain) => ({
          professional_profile_id: data.id,
          domain,
          focus: "avaliacao",
        })),
      );
    }

    console.log(`  ✓ ${perfil.display_name}`);
  }

  console.log(
    `\n${REDE.length} perfis de DEMONSTRAÇÃO inseridos. Todos marcados com "${MARCA}".`,
  );
  console.log("Para remover: node scripts/seed-rede-demonstracao.mjs --remove");
}

const remove = process.argv.includes("--remove");

console.log(
  remove
    ? "Removendo a rede de demonstração...\n"
    : "⚠️  Inserindo profissionais FICTÍCIOS no banco configurado.\n",
);

await (remove ? remover() : inserir());
