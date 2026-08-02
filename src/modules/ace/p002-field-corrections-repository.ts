import "server-only";
import { erroDeBanco } from "@/lib/observability/erros";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { EstadoInformacao } from "@/modules/ace/core/information-state";
import type { P002CompletenessFieldId } from "@/modules/ace/protocols/p002-completeness";
import type { P002HumanFieldCorrection } from "@/modules/ace/protocols/p002-human-overrides";

type CorrectionRow = {
  id: string;
  case_id: string;
  decision_case_artifact_id: string | null;
  field: string;
  estado: string;
  motivo: string;
  valor_anterior: string | null;
  corrigido_por: string;
  corrigido_em: string;
  ativo: boolean;
};

export type SaveP002FieldCorrectionInput = {
  caseId: string;
  decisionCaseArtifactId?: string | null;
  field: P002CompletenessFieldId;
  estado: EstadoInformacao;
  motivo: string;
  valorAnterior?: EstadoInformacao;
  corrigidoPor: string;
};

function mapRow(row: CorrectionRow): P002HumanFieldCorrection {
  return {
    field: row.field as P002CompletenessFieldId,
    estado: row.estado as EstadoInformacao,
    motivo: row.motivo,
    corrigidoPor: row.corrigido_por,
    corrigidoEm: row.corrigido_em,
    valorAnterior: (row.valor_anterior as EstadoInformacao | null) ?? undefined,
  };
}

/** Correção ativa mais recente por campo — precedência sobre inferência de IA. */
export async function listActiveP002FieldCorrections(
  supabase: SupabaseClient,
  caseId: string,
): Promise<P002HumanFieldCorrection[]> {
  const { data, error } = await supabase
    .from("p002_field_corrections")
    .select("*")
    .eq("case_id", caseId)
    .eq("ativo", true)
    .order("corrigido_em", { ascending: false });

  if (error) {
    // Tabela ainda não migrada — degrada com segurança sem quebrar a UI.
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    return [];
  }

  const byField = new Map<string, P002HumanFieldCorrection>();
  for (const row of data as CorrectionRow[]) {
    if (!byField.has(row.field)) {
      byField.set(row.field, mapRow(row));
    }
  }
  return [...byField.values()];
}

export async function saveP002FieldCorrection(
  supabase: SupabaseClient,
  input: SaveP002FieldCorrectionInput,
): Promise<P002HumanFieldCorrection> {
  const { data, error } = await supabase
    .from("p002_field_corrections")
    .insert({
      case_id: input.caseId,
      decision_case_artifact_id: input.decisionCaseArtifactId ?? null,
      field: input.field,
      estado: input.estado,
      motivo: input.motivo,
      valor_anterior: input.valorAnterior ?? null,
      corrigido_por: input.corrigidoPor,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw erroDeBanco("Não foi possível registrar a correção.", error);
  }

  return mapRow(data as CorrectionRow);
}
