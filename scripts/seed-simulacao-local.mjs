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
    atendimento: {
      serves_in_person: true,
      serves_online: true,
      cities: ["São Paulo"],
      states: ["SP"],
      offers_continuous_care: true,
      offers_return_visits: true,
      multidisciplinary_team: true,
      availability_window: "flexible",
      avg_days_to_first_appointment: 10,
    },
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
    atendimento: {
      serves_in_person: true,
      serves_online: true,
      cities: ["São Paulo"],
      states: ["SP"],
      offers_continuous_care: true,
      offers_return_visits: true,
      multidisciplinary_team: false,
      availability_window: "limited",
      avg_days_to_first_appointment: 25,
    },
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
    atendimento: {
      serves_in_person: true,
      serves_online: false,
      cities: ["São Paulo"],
      states: ["SP"],
      offers_continuous_care: false,
      offers_return_visits: true,
      multidisciplinary_team: false,
      availability_window: "flexible",
      avg_days_to_first_appointment: 12,
    },
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
  // SÓ OS QUE ESTE SEED CRIOU — nunca "tudo que começa com SIM-".
  //
  // O filtro era `like("professional_identifier", "SIM-%")`, e isso apaga
  // qualquer perfil que alguém tenha criado À MÃO seguindo a convenção. Foi o
  // que aconteceu em 25/08: um profissional cadastrado pela tela, com Mapa
  // completo, sumiu num `--remove` que só devia limpar a semeadura.
  //
  // Um script de limpeza que apaga além do que semeou é a mesma classe de
  // defeito do `SIM-42`: dois universos para a mesma pergunta, e o mais largo
  // ganhando em silêncio.
  const identificadores = REDE.map((perfil) => perfil.professional_identifier);
  const { data } = await supabase
    .from("professional_profiles")
    .select("id")
    .in("professional_identifier", identificadores);

  const ids = (data ?? []).map((linha) => linha.id);
  if (ids.length === 0) {
    console.log("Nenhum perfil de simulação encontrado.");
    return;
  }

  // As filhas caem por `on delete cascade`, mas apagar explicitamente deixa o
  // efeito visível em vez de implícito.
  await supabase.from("professional_education_entries").delete().in("professional_profile_id", ids);
  await supabase.from("professional_experience").delete().in("professional_profile_id", ids);
  await supabase.from("professional_care_model").delete().in("professional_profile_id", ids);
  await supabase.from("professional_competency_areas").delete().in("professional_profile_id", ids);
  // O Mapa sai junto: deixá-lo para trás produziria linhas órfãs apontando
  // para perfis que não existem mais.
  await supabase.from("professional_subcriterion_map").delete().in("professional_profile_id", ids);
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
    const { competencias, formacao, experiencia, atendimento, resumo, ...campos } = perfil;

    const { data, error } = await supabase
      .from("professional_profiles")
      .insert({
        ...campos,
        professional_summary: `${resumo}\n\n${MARCA}`,
        status: "ativo",
        // NÃO se nasce publicado — e este seed vinha tentando.
        //
        // Ele gravava `publication_status: "publicado"` direto, com o comentário
        // certo ("perfil completo é perfil publicado, senão não chega à Mesa") e
        // o mecanismo errado. Desde o `OPS-G5 C7R`, `publication_status` é
        // ESPELHO: quem manda é `ciclo_de_vida`, e `assert_nascimento_do_ciclo`
        // faz todo perfil nascer em `PREPARACAO`. O espelho voltava sozinho para
        // `nao_publicado`, e o seed imprimia "todos publicados e sem lacuna"
        // sobre três perfis que nunca chegaram a Rede nenhuma.
        //
        // Publicar é ATO, com autor e motivo — e é assim que se faz aqui agora,
        // na transição logo abaixo. Escrever no espelho era pedir ao reflexo
        // que mudasse a pessoa.
        publication_status: "nao_publicado",
        // Sem isto, `assert_publication_requirements` recusa: "publicação exige
        // registro profissional verificado como regular no conselho". O seed
        // nunca escreveu estes três campos — terceira razão pela qual ele
        // vinha entregando perfis que não chegavam a Rede nenhuma.
        registration_status: "regular",
        registration_source: "Semeadura de simulação local — não houve consulta a conselho.",
        registration_verified_at: agora,
        registration_verified_by: adminId,
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

    // O MODELO DE ATENDIMENTO — a tabela que a MESA lê nos filtros
    // obrigatórios (UF e cuidado contínuo). `professional_profiles` tem uma
    // coluna de nome parecido que NÃO é esta: preencher só lá deixa o
    // profissional preso em "informação não localizada" na Rede elegível.
    const { error: erroAtendimento } = await supabase.from("professional_care_model").insert({
      professional_profile_id: data.id,
      ...atendimento,
      source: "digitacao_manual",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: adminId,
    });
    if (erroAtendimento) falhas.push(`atendimento: ${erroAtendimento.message}`);

    const { error: erroExperiencia } = await supabase.from("professional_experience").insert({
      professional_profile_id: data.id,
      ...experiencia,
      source: "digitacao_manual",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: adminId,
    });
    if (erroExperiencia) falhas.push(`experiência: ${erroExperiencia.message}`);

    // A ÁREA DE ATUAÇÃO, VERIFICADA — quarta lacuna do seed.
    //
    // `assert_publication_requirements` exige área verificada, e este seed
    // nunca escreveu uma linha de `professional_practice_areas`. Ele criava
    // competências (que são outra coisa) e parava aí.
    const { error: erroArea } = await supabase.from("professional_practice_areas").insert({
      professional_profile_id: data.id,
      raw_text: perfil.experiencia.main_areas.join(", "),
      tags: perfil.experiencia.main_areas.map((a) => a.replace(/ /g, "_")),
      source: "Semeadura de simulação local — não houve verificação real.",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: adminId,
    });
    if (erroArea) falhas.push(`área: ${erroArea.message}`);

    // ------------------------------------------------------------------
    // O MAPA DO PROFISSIONAL — sem ele, "perfil completo" é meia verdade.
    //
    // @metodo ADR-092 — o Mapa pertence à publicação
    // @metodo ADR-041 — é daqui que o Motor come
    //
    // Este seed dizia "três perfis COMPLETOS, sem nenhum buraco" e não
    // escrevia uma linha de `professional_subcriterion_map`. Nenhum dos dois
    // seeds escrevia. O efeito é o `SIM-31` reencenado a cada semeadura: a
    // Curadoria nasce lendo *"0 altas · 0 médias · 23 lacunas"*, e a paciente
    // recebe uma comparação que não compara nada.
    //
    // Os três recebem mapas DIFERENTES de propósito. Um seed que confirmasse
    // tudo em todo mundo produziria três colunas idênticas — e a Mesa nova
    // encolheria cada linha como "os três respondem igual aqui", que é o
    // oposto de ter o que comparar.
    //
    // `NAO_INFORMADO` entra de propósito em parte deles: é resposta legítima
    // do Método ("olhamos e não sabemos"), e uma Rede onde tudo é
    // `CONFIRMADO` não ensina o Curador a ler lacuna nenhuma.
    const { data: conceitos } = await supabase
      .from("method_subcriteria")
      .select("id, code")
      .eq("active", true)
      .order("code");

    const passo = { "SIM-001": 3, "SIM-002": 4, "SIM-003": 5 }[perfil.professional_identifier] ?? 3;
    const linhasDoMapa = (conceitos ?? []).map((conceito, indice) => ({
      professional_profile_id: data.id,
      subcriterion_id: conceito.id,
      status:
        indice % passo === 0
          ? "NAO_INFORMADO"
          : indice % passo === 1
            ? "NAO_CONFIRMADO"
            : "CONFIRMADO",
      declared_by: adminId,
    }));

    const { error: erroMapa } = await supabase
      .from("professional_subcriterion_map")
      .insert(linhasDoMapa);
    if (erroMapa) falhas.push(`mapa: ${erroMapa.message}`);

    // A PUBLICAÇÃO, como transição — depois de tudo estar no lugar.
    //
    // Vem por último de propósito: `assert_publication_requirements` confere
    // registro, área e divergências no momento da gravação, e publicar antes
    // de preencher seria pedir para o banco recusar (ou, pior, aceitar).
    // A PUBLICAÇÃO PASSA PELA PORTA QUE O BANCO ABRIU PARA SERVIÇOS.
    //
    // Escrever direto em `ciclo_de_vida` é recusado: "transição por serviço
    // exige ator técnico". A recusa está certa — publicar torna alguém
    // oferecível a quem decide sobre a própria saúde, e o banco quer saber de
    // quem é o ato mesmo quando quem age é um script.
    const { error: erroPublicacao } = await supabase.rpc("transicionar_ciclo_como_servico", {
      p_profissional: data.id,
      p_para: "PUBLICADO_ATIVO",
      p_motivo: "CADASTRO_VALIDADO",
      p_ator: adminId,
      p_nota: "Semeadura de simulação local — perfil fictício.",
    });
    if (erroPublicacao) falhas.push(`publicação: ${erroPublicacao.message}`);

    if (falhas.length > 0) {
      console.error(`  ⚠ ${perfil.display_name} — ${falhas.join(" · ")}`);
    } else {
      console.log(
        `  ✓ ${perfil.display_name} — ${competencias.length} competências, ` +
          `${formacao.length} formações verificadas, experiência, atendimento e Mapa preenchidos`,
      );
    }
  }

  // A FRASE FINAL OLHA O RESULTADO.
  //
  // Ela dizia "todos publicados e sem lacuna" SEMPRE — inclusive nas três
  // rodadas de 25/08 em que os três falharam na publicação, uma por vez, por
  // razões diferentes. É a mesma família do `SIM-37`: o instrumento
  // confirmando o que não aconteceu.
  const { count } = await supabase
    .from("professional_profiles")
    .select("id", { count: "exact", head: true })
    .in("professional_identifier", REDE.map((p) => p.professional_identifier))
    .eq("ciclo_de_vida", "PUBLICADO_ATIVO");
  console.log(
    `\n${count ?? 0} de ${REDE.length} perfis de SIMULAÇÃO publicados, com Mapa preenchido.`,
  );
  console.log("Para remover: node scripts/with-local-supabase.mjs node scripts/seed-simulacao-local.mjs --remove");
}

const remove = process.argv.includes("--remove");
console.log(
  remove
    ? "Removendo os perfis de simulação...\n"
    : `⚠️  Inserindo profissionais FICTÍCIOS em ${alvo.NEXT_PUBLIC_SUPABASE_URL}\n`,
);

await (remove ? remover() : inserir());
