import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { applyAreaGate, type AreaAssessment, type AreaCompatibility, type AreaGateOutcome } from "./cruzamento";

/**
 * A declaração de área é o único ponto do cruzamento em que o sistema não tem
 * opinião. Ele mostra ao Curador o que o Case exige e o que o cadastro
 * declara, lado a lado, e guarda o que ele concluiu.
 *
 * Não há comparação semântica aqui — nem sugestão persistida. "Ortopedia de
 * coluna" contra "Cirurgia da coluna vertebral" pode ser a mesma prática ou
 * não, e a diferença entre as duas leituras é clínica.
 */

export type AreaDeclaration = {
  id: string;
  caseId: string;
  professionalProfileId: string;
  compatibility: AreaCompatibility;
  confirmedByCurator: boolean;
  rationale: string | null;
  areaTextReviewed: string | null;
  caseRequirementReviewed: string | null;
  declaredBy: string;
  declaredAt: string;
};

type Row = {
  id: string;
  case_id: string;
  professional_profile_id: string;
  compatibility: AreaCompatibility;
  confirmed_by_curator: boolean;
  rationale: string | null;
  area_text_reviewed: string | null;
  case_requirement_reviewed: string | null;
  declared_by: string;
  declared_at: string;
};

function mapRow(row: Row): AreaDeclaration {
  return {
    id: row.id,
    caseId: row.case_id,
    professionalProfileId: row.professional_profile_id,
    compatibility: row.compatibility,
    confirmedByCurator: row.confirmed_by_curator,
    rationale: row.rationale,
    areaTextReviewed: row.area_text_reviewed,
    caseRequirementReviewed: row.case_requirement_reviewed,
    declaredBy: row.declared_by,
    declaredAt: row.declared_at,
  };
}

const COLUMNS =
  "id, case_id, professional_profile_id, compatibility, confirmed_by_curator, rationale, area_text_reviewed, case_requirement_reviewed, declared_by, declared_at";

export type DeclareAreaInput = {
  caseId: string;
  professionalProfileId: string;
  compatibility: AreaCompatibility;
  confirmedByCurator?: boolean;
  rationale?: string | null;
  areaTextReviewed?: string | null;
  caseRequirementReviewed?: string | null;
  declaredBy: string;
};

/**
 * Bloco C (Etapa 9, ADR-048): a declaração deixou de ser um upsert cego —
 * a tabela agora é versionada (uma VIGENTE por par + histórico preservado,
 * migration 20260802163000). Aqui vive só a via NORMAL: a primeira
 * declaração do par nasce; a vigente ainda COMPLETÁVEL (informação
 * insuficiente, confirmação de parcial) é editada em lugar. Reescrever um
 * juízo já declarado é recusado pelo BANCO com a frase de domínio — e a
 * correção legítima é a redeclaração oficial (`redeclare_area_compatibility`),
 * que arquiva a vigente e preserva o histórico.
 */
export async function declareAreaCompatibility(
  supabase: SupabaseClient,
  input: DeclareAreaInput,
): Promise<AreaDeclaration> {
  const { data: vigente, error: lookupError } = await supabase
    .from("area_compatibility_declarations")
    .select("id")
    .eq("case_id", input.caseId)
    .eq("professional_profile_id", input.professionalProfileId)
    .is("superseded_at", null)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  const payload = {
    compatibility: input.compatibility,
    confirmed_by_curator: input.confirmedByCurator ?? false,
    rationale: input.rationale ?? null,
    area_text_reviewed: input.areaTextReviewed ?? null,
    case_requirement_reviewed: input.caseRequirementReviewed ?? null,
    declared_by: input.declaredBy,
  };

  const { data, error } = vigente
    ? await supabase
        .from("area_compatibility_declarations")
        .update(payload)
        .eq("id", vigente.id as string)
        .select(COLUMNS)
        .single()
    : await supabase
        .from("area_compatibility_declarations")
        .insert({
          case_id: input.caseId,
          professional_profile_id: input.professionalProfileId,
          ...payload,
        })
        .select(COLUMNS)
        .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

/**
 * A Rede/cruzamento lê SÓ a declaração vigente de cada par — o histórico
 * superado existe para auditoria, nunca para decidir participação.
 */
export async function listAreaDeclarations(
  supabase: SupabaseClient,
  caseId: string,
): Promise<AreaDeclaration[]> {
  const { data, error } = await supabase
    .from("area_compatibility_declarations")
    .select(COLUMNS)
    .eq("case_id", caseId)
    .is("superseded_at", null);

  if (error) throw new Error(error.message);
  return (data as Row[]).map(mapRow);
}

export type AreaGateResult = AreaGateOutcome & { professionalProfileId: string };

/**
 * Quem participa deste Case, segundo o que o Curador declarou.
 *
 * Um profissional sem declaração não é "incompatível" — é `pendingVerification`
 * pela mesma razão de sempre: ninguém olhou ainda. A ação corretiva é declarar,
 * não descartar.
 */
export async function applyAreaGateForCase(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileIds: string[],
): Promise<AreaGateResult[]> {
  const declarations = await listAreaDeclarations(supabase, caseId);
  const byProfessional = new Map(declarations.map((d) => [d.professionalProfileId, d]));

  return professionalProfileIds.map((professionalProfileId) => {
    const declared = byProfessional.get(professionalProfileId);

    const assessment: AreaAssessment = declared
      ? {
          professionalProfileId,
          compatibility: declared.compatibility,
          rationale: declared.rationale,
          confirmedByCurator: declared.confirmedByCurator,
        }
      : {
          professionalProfileId,
          compatibility: "INFORMACAO_INSUFICIENTE",
          rationale: null,
          confirmedByCurator: false,
        };

    return { professionalProfileId, ...applyAreaGate(assessment) };
  });
}
