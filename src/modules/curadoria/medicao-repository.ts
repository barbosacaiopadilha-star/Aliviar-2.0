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
 * EM LOTE, SEMPRE. A primeira versão carregava um Case por vez e a lista
 * chamava a função dentro de um laço — 1 + 11×N consultas, 551 para cinquenta
 * Cases. Aqui existe um caminho só, que recebe uma LISTA de ids e faz onze
 * consultas independentemente de quantos Cases sejam; medir um é medir uma
 * lista de um. Um caminho só também significa um caminho testado.
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
function exigir<T>(resultado: { data: T | null; error: unknown }, oQue: string): T {
  if (resultado.error) throw erroDeBanco(`Não foi possível medir ${oQue}.`, resultado.error);
  return (resultado.data ?? []) as T;
}

type Linha = Record<string, unknown>;

/** Agrupa carimbos por `case_id`, descartando o que não for texto utilizável. */
function porCase(linhas: Linha[], coluna: string): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const linha of linhas) {
    const caseId = linha.case_id;
    const valor = linha[coluna];
    if (typeof caseId !== "string" || typeof valor !== "string" || valor.length === 0) continue;
    const atual = mapa.get(caseId);
    if (atual) atual.push(valor);
    else mapa.set(caseId, [valor]);
  }
  return mapa;
}

function primeiraPorCase(linhas: Linha[]): Map<string, Linha> {
  const mapa = new Map<string, Linha>();
  for (const linha of linhas) {
    const caseId = linha.case_id;
    if (typeof caseId === "string" && !mapa.has(caseId)) mapa.set(caseId, linha);
  }
  return mapa;
}

function texto(linha: Linha | undefined, coluna: string): string | null {
  const valor = linha?.[coluna];
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

export type CasoParaMedir = { id: string; started_at?: unknown; created_at?: unknown };

/**
 * Os atos de vários Cases, em onze consultas — não onze por Case.
 */
export async function carregarAtosDosCases(
  supabase: SupabaseClient,
  casos: readonly CasoParaMedir[],
): Promise<Map<string, AtosDoCase>> {
  const ids = casos.map((c) => c.id);
  if (ids.length === 0) return new Map();

  const [acolhimentos, mapas, necessidades, areas, criterios, selecoes, relatorios, decisoes] =
    await Promise.all([
      supabase
        .from("consultation_records")
        .select("case_id, meeting_held_at, registered_at, understanding_confirmed_at")
        .in("case_id", ids),
      supabase.from("case_priority_map").select("case_id, created_at").in("case_id", ids),
      supabase.from("case_needs").select("case_id, declared_at").in("case_id", ids),
      supabase
        .from("area_compatibility_declarations")
        .select("case_id, declared_at")
        .in("case_id", ids),
      supabase.from("criterion_declarations").select("case_id, declared_at").in("case_id", ids),
      supabase.from("curated_selections").select("case_id, created_at").in("case_id", ids),
      supabase
        .from("curadoria_reports")
        .select("case_id, emitted_at, delivered_at")
        .in("case_id", ids),
      supabase
        .from("patient_curadoria_decisions")
        .select("case_id, decided_at")
        .in("case_id", ids),
    ]);

  const acolhimentoPorCase = primeiraPorCase(exigir<Linha[]>(acolhimentos, "o Acolhimento"));
  const mapaPorCase = porCase(exigir<Linha[]>(mapas, "o Mapa de Prioridades"), "created_at");
  const necessidadePorCase = porCase(
    exigir<Linha[]>(necessidades, "o Protocolo da Pessoa"),
    "declared_at",
  );
  const areaPorCase = porCase(exigir<Linha[]>(areas, "a Rede elegível"), "declared_at");
  const criterioPorCase = porCase(exigir<Linha[]>(criterios, "a avaliação técnica"), "declared_at");
  const selecaoPorCase = primeiraPorCase(exigir<Linha[]>(selecoes, "a composição"));
  const relatorioPorCase = primeiraPorCase(exigir<Linha[]>(relatorios, "o Relatório"));
  const decisaoPorCase = primeiraPorCase(exigir<Linha[]>(decisoes, "a decisão"));

  // A história vive fora do Case (`patient_stories`), ligada por
  // `source_story_id`. Sem o vínculo não há o que medir na Entrada — e isso é
  // diferente de a história não ter sido enviada.
  const storyIdPorCase = new Map<string, string>();
  for (const caso of casos) {
    const storyId = (caso as Linha).source_story_id;
    if (typeof storyId === "string" && storyId.length > 0) storyIdPorCase.set(caso.id, storyId);
  }

  const envioPorStory = new Map<string, string>();
  const storyIds = [...new Set(storyIdPorCase.values())];
  if (storyIds.length > 0) {
    const historias = await supabase
      .from("patient_stories")
      .select("id, submitted_at")
      .in("id", storyIds);
    for (const linha of exigir<Linha[]>(historias, "o envio da história")) {
      const id = linha.id;
      const enviado = linha.submitted_at;
      if (typeof id === "string" && typeof enviado === "string" && enviado.length > 0) {
        envioPorStory.set(id, enviado);
      }
    }
  }

  const resultado = new Map<string, AtosDoCase>();

  for (const caso of casos) {
    const acolhimento = acolhimentoPorCase.get(caso.id);
    const storyId = storyIdPorCase.get(caso.id);

    resultado.set(caso.id, {
      // `started_at` é o marco do Método; `created_at` é a rede de segurança
      // para Cases anteriores ao campo. Nunca `now()`: inventar um começo
      // produziria uma duração falsa com cara de verdadeira.
      caseAbertoEm: texto(caso as Linha, "started_at") ?? texto(caso as Linha, "created_at"),
      historiaEnviadaEm: storyId ? (envioPorStory.get(storyId) ?? null) : null,
      acolhimento: [
        texto(acolhimento, "meeting_held_at"),
        texto(acolhimento, "registered_at"),
        texto(acolhimento, "understanding_confirmed_at"),
      ],
      mapa: mapaPorCase.get(caso.id) ?? [],
      protocoloDaPessoa: necessidadePorCase.get(caso.id) ?? [],
      rede: areaPorCase.get(caso.id) ?? [],
      avaliacao: criterioPorCase.get(caso.id) ?? [],
      composicaoEm: texto(selecaoPorCase.get(caso.id), "created_at"),
      relatorioEmitidoEm: texto(relatorioPorCase.get(caso.id), "emitted_at"),
      relatorioEntregueEm: texto(relatorioPorCase.get(caso.id), "delivered_at"),
      decisaoEm: texto(decisaoPorCase.get(caso.id), "decided_at"),
    });
  }

  return resultado;
}

export async function medirCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<MedicaoDaCuradoria | null> {
  const { data, error } = await supabase
    .from("cases")
    .select("id, started_at, created_at, source_story_id")
    .eq("id", caseId)
    .maybeSingle();

  if (error) throw erroDeBanco("Não foi possível medir a abertura do Case.", error);
  // `null` e "Case sem atos" são coisas diferentes: um não existe (ou a RLS
  // não o entrega), o outro existe e ainda não andou. Quem chama decide o que
  // dizer — colapsar os dois seria a mentira do SIM-14 em outra roupa.
  if (!data) return null;

  const atos = await carregarAtosDosCases(supabase, [data as CasoParaMedir]);
  const doCase = atos.get(caseId);
  return doCase ? medirCuradoria(doCase) : null;
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
    .select("id, started_at, created_at, source_story_id")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw erroDeBanco("Não foi possível listar os Cases para medição.", error);

  const casos = (data ?? []) as CasoParaMedir[];
  const atos = await carregarAtosDosCases(supabase, casos);

  return casos.flatMap((caso) => {
    const doCase = atos.get(caso.id);
    if (!doCase) return [];
    return [
      {
        caseId: caso.id,
        abertoEm: texto(caso as Linha, "started_at") ?? texto(caso as Linha, "created_at"),
        medicao: medirCuradoria(doCase),
      },
    ];
  });
}
