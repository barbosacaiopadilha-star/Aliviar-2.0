import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listSubcriterionCatalog, type SubcriterionRecord } from "./mapa-prioridades-repository";
import {
  describeRejection,
  groupProfessionalMap,
  isSubcriterionStatus,
  normalizeNote,
  professionalMapCompletion,
  validateProfessionalMapWrite,
  type ProfessionalMapCompletion,
  type ProfessionalMapGroup,
  type ProfessionalMapItem,
  type SubcriterionStatus,
} from "./mapa-profissional";

/**
 * MAPA DO PROFISSIONAL — o lado do banco.
 *
 * Reaproveita `listSubcriterionCatalog` do Mapa de Prioridades: é o MESMO
 * catálogo, lido pelo mesmo caminho. Nenhuma cópia dos 26 itens, nenhuma
 * tabela paralela — a identidade compartilhada do subcritério é o que vai
 * permitir o cruzamento.
 */

export type ProfessionalMap = {
  professionalProfileId: string;
  items: ProfessionalMapItem[];
  groups: ProfessionalMapGroup[];
  completion: ProfessionalMapCompletion;
};

export async function loadProfessionalMap(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<ProfessionalMap> {
  const [catalogo, { data, error }] = await Promise.all([
    listSubcriterionCatalog(supabase, { includeInactive: true }),
    supabase
      .from("professional_subcriterion_map")
      .select("subcriterion_id, status, note, declared_by, updated_at")
      .eq("professional_profile_id", professionalProfileId),
  ]);

  if (error) throw new Error(`Mapa do Profissional: ${error.message}`);

  const codigoPorId = new Map(catalogo.map((entry) => [entry.id, entry.code]));

  const items: ProfessionalMapItem[] = (data ?? []).flatMap((row) => {
    const code = codigoPorId.get(row.subcriterion_id as string);
    const status = row.status as string;
    if (!code || !isSubcriterionStatus(status)) return [];
    // PP-02: a autoria e lida; nenhuma escrita a preenche neste pacote.
    return [
      {
        subcriterionCode: code,
        status,
        note: (row.note as string | null) ?? null,
        declaredBy: (row.declared_by as string | null) ?? null,
        registradoEm: (row.updated_at as string | null) ?? null,
      },
    ];
  });

  return {
    professionalProfileId,
    items,
    groups: groupProfessionalMap(items, catalogo),
    completion: professionalMapCompletion(items, catalogo),
  };
}

export type ProfessionalMapEntry = {
  subcriterionCode: string;
  status: SubcriterionStatus;
  note?: string | null;
};

/**
 * Grava o que veio, e só. Idempotente por
 * `(professional_profile_id, subcriterion_id)`.
 *
 * O que NÃO faz: apagar o que não veio, nem preencher o resto como
 * `NAO_INFORMADO`. Item não trabalhado continua sem registro — é um fato
 * diferente de "analisado, sem informação", e o banco preserva a diferença.
 */
export async function saveProfessionalMapEntries(
  supabase: SupabaseClient,
  professionalProfileId: string,
  entries: readonly ProfessionalMapEntry[],
): Promise<ProfessionalMap> {
  if (entries.length === 0) return loadProfessionalMap(supabase, professionalProfileId);

  const catalogo = await listSubcriterionCatalog(supabase, { includeInactive: true });

  // A recusa do domínio vem primeiro porque ela sabe explicar o que fazer; a
  // do banco vem depois porque ela garante.
  const rejeicoes = validateProfessionalMapWrite(entries, catalogo);
  if (rejeicoes.length > 0) {
    throw new Error(rejeicoes.map((r) => describeRejection(r, catalogo)).join(" "));
  }

  const idPorCodigo = new Map(catalogo.map((entry) => [entry.code, entry.id]));

  const { error } = await supabase.from("professional_subcriterion_map").upsert(
    entries.map((entry) => ({
      professional_profile_id: professionalProfileId,
      subcriterion_id: idPorCodigo.get(entry.subcriterionCode)!,
      status: entry.status,
      note: normalizeNote(entry.note),
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "professional_profile_id,subcriterion_id" },
  );

  if (error) throw new Error(`Mapa do Profissional: ${error.message}`);

  return loadProfessionalMap(supabase, professionalProfileId);
}

export type { SubcriterionRecord };
