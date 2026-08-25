import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import { medirCuradoria, type AtosDoCase, type MedicaoDaCuradoria } from "./medicao-da-curadoria";

/**
 * A MEDIÇÃO, LIDA DO QUE JÁ ESTÁ GRAVADO — ADR-089.
 *
 * Onze leituras, todas `select` de carimbo. Nenhuma escrita, nenhuma tabela
 * nova, nenhuma migration: cada ato da Curadoria já datava a si mesmo desde
 * que foi construído, e este módulo só junta os carimbos.
 *
 * NENHUM CONTEÚDO CLÍNICO ATRAVESSA AQUI. Os `select` pedem data e nada mais
 * — nem narrativa, nem juízo, nem nome. O que sai deste módulo é quando as
 * coisas aconteceram e quantas foram; o que foi dito continua onde sempre
 * esteve, sob as políticas de sempre.
 *
 * A RLS continua sendo a autoridade: quem chama passa o próprio cliente, e o
 * banco decide o que essa pessoa enxerga. Não há `service_role` aqui, e não
 * há capability nova — a medição não pode ver mais do que quem a pediu.
 */

/** Uma consulta falha nunca vira "essa etapa não aconteceu" — ETAPA 7. */
function exigir<T>(resultado: { data: T | null; error: unknown }, oQue: string): T | null {
  if (resultado.error) throw erroDeBanco(`Não foi possível medir ${oQue}.`, resultado.error);
  return resultado.data;
}

function carimbos(linhas: Record<string, unknown>[] | null, coluna: string): string[] {
  return (linhas ?? [])
    .map((linha) => linha[coluna])
    .filter((valor): valor is string => typeof valor === "string" && valor.length > 0);
}

export async function carregarAtosDoCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<AtosDoCase> {
  const [
    caso,
    acolhimento,
    mapa,
    necessidades,
    areas,
    criterios,
    selecao,
    relatorio,
    decisao,
  ] = await Promise.all([
    supabase.from("cases").select("started_at, created_at, source_story_id").eq("id", caseId).maybeSingle(),
    supabase
      .from("consultation_records")
      .select("meeting_held_at, registered_at, understanding_confirmed_at")
      .eq("case_id", caseId)
      .maybeSingle(),
    supabase.from("case_priority_map").select("created_at").eq("case_id", caseId),
    supabase.from("case_needs").select("declared_at").eq("case_id", caseId),
    supabase.from("area_compatibility_declarations").select("declared_at").eq("case_id", caseId),
    supabase.from("criterion_declarations").select("declared_at").eq("case_id", caseId),
    supabase.from("curated_selections").select("created_at").eq("case_id", caseId).maybeSingle(),
    supabase.from("curadoria_reports").select("emitted_at, delivered_at").eq("case_id", caseId).maybeSingle(),
    supabase.from("patient_curadoria_decisions").select("decided_at").eq("case_id", caseId).maybeSingle(),
  ]);

  const casoRow = exigir(caso, "a abertura do Case");
  const acolhimentoRow = exigir(acolhimento, "o Acolhimento");
  const selecaoRow = exigir(selecao, "a composição");
  const relatorioRow = exigir(relatorio, "o Relatório");
  const decisaoRow = exigir(decisao, "a decisão");

  // A história vive fora do Case (`patient_stories`), ligada por
  // `source_story_id`. Sem o vínculo não há o que medir na Entrada — e isso
  // é diferente de a história não ter sido enviada.
  let historiaEnviadaEm: string | null = null;
  const storyId = casoRow?.source_story_id as string | null | undefined;
  if (storyId) {
    const historia = await supabase
      .from("patient_stories")
      .select("submitted_at")
      .eq("id", storyId)
      .maybeSingle();
    historiaEnviadaEm = (exigir(historia, "o envio da história")?.submitted_at as string | null) ?? null;
  }

  return {
    // `started_at` é o marco do Método; `created_at` é a rede de segurança
    // para Cases anteriores ao campo. Nunca `now()`: inventar um começo
    // produziria uma duração falsa com cara de verdadeira.
    caseAbertoEm:
      ((casoRow?.started_at as string | null) ?? (casoRow?.created_at as string | null)) ?? null,
    historiaEnviadaEm,
    acolhimento: [
      (acolhimentoRow?.meeting_held_at as string | null) ?? null,
      (acolhimentoRow?.registered_at as string | null) ?? null,
      (acolhimentoRow?.understanding_confirmed_at as string | null) ?? null,
    ],
    mapa: carimbos(exigir(mapa, "o Mapa de Prioridades"), "created_at"),
    protocoloDaPessoa: carimbos(exigir(necessidades, "o Protocolo da Pessoa"), "declared_at"),
    rede: carimbos(exigir(areas, "a Rede elegível"), "declared_at"),
    avaliacao: carimbos(exigir(criterios, "a avaliação técnica"), "declared_at"),
    composicaoEm: (selecaoRow?.created_at as string | null) ?? null,
    relatorioEmitidoEm: (relatorioRow?.emitted_at as string | null) ?? null,
    relatorioEntregueEm: (relatorioRow?.delivered_at as string | null) ?? null,
    decisaoEm: (decisaoRow?.decided_at as string | null) ?? null,
  };
}

export async function medirCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<MedicaoDaCuradoria> {
  return medirCuradoria(await carregarAtosDoCase(supabase, caseId));
}

export type CaseMedido = {
  caseId: string;
  abertoEm: string | null;
  medicao: MedicaoDaCuradoria;
};

/**
 * Todos os Cases que a pessoa que pediu pode ver, medidos.
 *
 * Sem ordenação por duração: ordenar por "quem demorou" é o primeiro passo
 * para a medição virar régua de pessoa, e a ADR-089 fecha essa porta. A ordem
 * é cronológica, como um diário.
 */
export async function medirTodosOsCases(
  supabase: SupabaseClient,
  limite = 50,
): Promise<CaseMedido[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("id, started_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw erroDeBanco("Não foi possível listar os Cases para medição.", error);

  const casos = data ?? [];

  return Promise.all(
    casos.map(async (caso) => ({
      caseId: caso.id as string,
      abertoEm: ((caso.started_at as string | null) ?? (caso.created_at as string | null)) ?? null,
      medicao: await medirCase(supabase, caso.id as string),
    })),
  );
}
