import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfessionalProfile, ProfileStatus, PublicationStatus } from "./types";

type ProfessionalProfileRow = {
  id: string;
  profile_id: string | null;
  status: ProfileStatus;
  publication_status: PublicationStatus;
  display_name: string;
  professional_identifier: string;
  crm: string | null;
  crm_uf: string | null;
  professional_summary: string | null;
  institution_name: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS =
  "id, profile_id, status, publication_status, display_name, professional_identifier, crm, crm_uf, professional_summary, institution_name, created_by, updated_by, created_at, updated_at";

function mapRow(row: ProfessionalProfileRow): ProfessionalProfile {
  return {
    id: row.id,
    profileId: row.profile_id,
    status: row.status,
    publicationStatus: row.publication_status,
    displayName: row.display_name,
    professionalIdentifier: row.professional_identifier,
    crm: row.crm,
    crmUf: row.crm_uf,
    professionalSummary: row.professional_summary,
    institutionName: row.institution_name,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Nomes de exibição por id — usado onde só o providerId é conhecido (ex.:
// Shortlist do ACE, ÉPICO 1/SPRINT 3), sem precisar carregar o registro
// inteiro.
export async function getProfessionalDisplayNames(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const { data } = await supabase.from("professional_profiles").select("id, display_name").in("id", ids);

  return Object.fromEntries((data ?? []).map((row) => [row.id as string, row.display_name as string]));
}

export async function listProfessionalProfiles(
  supabase: SupabaseClient,
): Promise<ProfessionalProfile[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(SELECT_COLUMNS)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os profissionais.");
  }

  return (data as ProfessionalProfileRow[]).map(mapRow);
}

export async function getProfessionalProfile(
  supabase: SupabaseClient,
  id: string,
): Promise<ProfessionalProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar o profissional.");
  }

  return data ? mapRow(data as ProfessionalProfileRow) : null;
}

export type ProfessionalProfileFields = {
  displayName: string;
  professionalIdentifier: string;
  crm: string | null;
  crmUf: string | null;
  professionalSummary: string | null;
  institutionName: string | null;
};

export async function createProfessionalProfile(
  supabase: SupabaseClient,
  input: ProfessionalProfileFields & { createdBy: string },
): Promise<ProfessionalProfile> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .insert({
      display_name: input.displayName,
      professional_identifier: input.professionalIdentifier,
      crm: input.crm,
      crm_uf: input.crmUf,
      professional_summary: input.professionalSummary,
      institution_name: input.institutionName,
      created_by: input.createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error("Não foi possível criar o profissional.");
  }

  return mapRow(data as ProfessionalProfileRow);
}

export async function updateProfessionalProfile(
  supabase: SupabaseClient,
  id: string,
  input: ProfessionalProfileFields & { updatedBy: string },
): Promise<ProfessionalProfile> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .update({
      display_name: input.displayName,
      professional_identifier: input.professionalIdentifier,
      crm: input.crm,
      crm_uf: input.crmUf,
      professional_summary: input.professionalSummary,
      institution_name: input.institutionName,
      updated_by: input.updatedBy,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error("Não foi possível atualizar o profissional.");
  }

  return mapRow(data as ProfessionalProfileRow);
}

export async function setProfessionalStatus(
  supabase: SupabaseClient,
  id: string,
  status: ProfileStatus,
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("professional_profiles")
    .update({ status, updated_by: updatedBy })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o status do profissional.");
  }
}

export async function setProfessionalPublicationStatus(
  supabase: SupabaseClient,
  id: string,
  publicationStatus: PublicationStatus,
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("professional_profiles")
    .update({ publication_status: publicationStatus, updated_by: updatedBy })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar a publicação do profissional.");
  }
}
