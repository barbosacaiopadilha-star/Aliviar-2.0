import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isImportanceLevel,
  isSubcriterionGroup,
  priorityMapCompletion,
  validatePriorityMapWrite,
  type ImportanceLevel,
  type PriorityMapCompletion,
  type PriorityMapItem,
  type Subcriterion,
} from "./mapa-prioridades";

/**
 * MAPA DE PRIORIDADES — o lado do banco.
 *
 * Segue o padrão dos outros repositórios da Curadoria: só carrega e grava; o
 * cálculo mora no módulo puro (`mapa-prioridades.ts`), testável sem Supabase.
 *
 * O catálogo vem do BANCO, não da constante do domínio. A constante existe
 * para o domínio raciocinar sem ida ao servidor; a tabela é a fonte de
 * verdade em tempo de execução, e é ela que sabe o que está em circulação
 * hoje. As duas nascem da mesma migration.
 */

export type SubcriterionRecord = Subcriterion & { id: string };

export async function listSubcriterionCatalog(
  supabase: SupabaseClient,
  { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<SubcriterionRecord[]> {
  let query = supabase
    .from("method_subcriteria")
    .select("id, code, group, name, description, display_order, active");

  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query.order("group").order("display_order");
  if (error) throw new Error(`Catálogo de subcritérios: ${error.message}`);

  return (data ?? []).map((row) => {
    const group = row.group as string;
    if (!isSubcriterionGroup(group)) {
      // O banco já restringe por CHECK. Se chegou aqui, o catálogo e o
      // domínio divergiram — e isso é erro de migration, não de dado.
      throw new Error(`Subcritério "${row.code}" declara grupo desconhecido: ${group}.`);
    }
    return {
      id: row.id as string,
      code: row.code as string,
      group,
      name: row.name as string,
      description: row.description as string,
      displayOrder: row.display_order as number,
      active: row.active as boolean,
    };
  });
}

export type CasePriorityMap = {
  caseId: string;
  items: PriorityMapItem[];
  completion: PriorityMapCompletion;
};

export async function loadCasePriorityMap(
  supabase: SupabaseClient,
  caseId: string,
): Promise<CasePriorityMap> {
  const [catalogo, { data, error }] = await Promise.all([
    listSubcriterionCatalog(supabase, { includeInactive: true }),
    supabase
      .from("case_priority_map")
      .select("subcriterion_id, importance")
      .eq("case_id", caseId),
  ]);

  if (error) throw new Error(`Mapa de Prioridades: ${error.message}`);

  const codigoPorId = new Map(catalogo.map((entry) => [entry.id, entry.code]));

  const items: PriorityMapItem[] = (data ?? []).flatMap((row) => {
    const code = codigoPorId.get(row.subcriterion_id as string);
    const importance = row.importance as string;
    if (!code || !isImportanceLevel(importance)) return [];
    return [{ subcriterionCode: code, importance }];
  });

  return { caseId, items, completion: priorityMapCompletion(items, catalogo) };
}

export type PriorityMapEntry = {
  subcriterionCode: string;
  importance: ImportanceLevel;
};

/**
 * Grava o que veio, e só. Idempotente por `(case_id, subcriterion_id)`:
 * salvar o mesmo valor de novo atualiza a linha, nunca duplica.
 *
 * O que NÃO faz: apagar o que não veio. Um mapa é preenchido aos poucos, e
 * uma gravação parcial não pode significar "esqueça o resto".
 */
export async function savePriorityMapEntries(
  supabase: SupabaseClient,
  caseId: string,
  entries: readonly PriorityMapEntry[],
): Promise<CasePriorityMap> {
  if (entries.length === 0) return loadCasePriorityMap(supabase, caseId);

  const catalogo = await listSubcriterionCatalog(supabase, { includeInactive: true });

  // A recusa do domínio vem primeiro porque ela sabe explicar. A do banco vem
  // depois porque ela garante — as duas travas são de propósito.
  const rejeicoes = validatePriorityMapWrite(entries, catalogo);
  if (rejeicoes.length > 0) {
    throw new Error(descreverRejeicoes(rejeicoes));
  }

  const idPorCodigo = new Map(catalogo.map((entry) => [entry.code, entry.id]));

  const { error } = await supabase.from("case_priority_map").upsert(
    entries.map((entry) => ({
      case_id: caseId,
      subcriterion_id: idPorCodigo.get(entry.subcriterionCode)!,
      importance: entry.importance,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "case_id,subcriterion_id" },
  );

  if (error) throw new Error(`Mapa de Prioridades: ${error.message}`);

  return loadCasePriorityMap(supabase, caseId);
}

function descreverRejeicoes(
  rejeicoes: ReturnType<typeof validatePriorityMapWrite>,
): string {
  return rejeicoes
    .map((rejeicao) => {
      switch (rejeicao.reason) {
        case "SUBCRITERIO_INEXISTENTE":
          return `O subcritério "${rejeicao.code}" não existe no catálogo do Método.`;
        case "SUBCRITERIO_INATIVO":
          return `O subcritério "${rejeicao.code}" saiu de circulação e não recebe nova classificação.`;
        case "SUBCRITERIO_REPETIDO":
          return `O subcritério "${rejeicao.code}" aparece mais de uma vez na mesma gravação.`;
        case "NIVEL_INVALIDO":
          return `"${rejeicao.value}" não é um nível de importância do Método.`;
      }
    })
    .join(" ");
}
