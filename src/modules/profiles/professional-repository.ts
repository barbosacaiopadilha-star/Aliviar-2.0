import "server-only";
import { erroDeBanco } from "@/lib/observability/erros";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfessionalProfile, ProfileStatus, PublicationStatus, RegistrationStatus } from "./types";

type ProfessionalProfileRow = {
  id: string;
  profile_id: string | null;
  status: ProfileStatus;
  publication_status: PublicationStatus;
  is_demo: boolean;
  is_test_fixture: boolean;
  display_name: string;
  professional_identifier: string;
  crm: string | null;
  crm_uf: string | null;
  registration_status: RegistrationStatus | null;
  registration_source: string | null;
  registration_verified_at: string | null;
  registration_verified_by: string | null;
  professional_summary: string | null;
  institution_name: string | null;
  experience_level: string | null;
  intake_approach: string | null;
  offers_continuous_care: boolean | null;
  availability_window: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS =
  "id, profile_id, status, publication_status, is_demo, is_test_fixture, display_name, professional_identifier, crm, crm_uf, registration_status, registration_source, registration_verified_at, registration_verified_by, professional_summary, institution_name, experience_level, intake_approach, offers_continuous_care, availability_window, created_by, updated_by, created_at, updated_at";

function mapRow(row: ProfessionalProfileRow): ProfessionalProfile {
  return {
    id: row.id,
    profileId: row.profile_id,
    status: row.status,
    publicationStatus: row.publication_status,
    isDemo: row.is_demo,
    isTestFixture: row.is_test_fixture,
    displayName: row.display_name,
    professionalIdentifier: row.professional_identifier,
    crm: row.crm,
    crmUf: row.crm_uf,
    registrationStatus: row.registration_status,
    registrationSource: row.registration_source,
    registrationVerifiedAt: row.registration_verified_at,
    registrationVerifiedBy: row.registration_verified_by,
    professionalSummary: row.professional_summary,
    institutionName: row.institution_name,
    experienceLevel: row.experience_level ?? null,
    intakeApproach: row.intake_approach ?? null,
    offersContinuousCare: row.offers_continuous_care ?? null,
    availabilityWindow: row.availability_window ?? null,
    competencyDomains: [],
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
    throw erroDeBanco("Não foi possível carregar os profissionais.", error);
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
    throw erroDeBanco("Não foi possível carregar o profissional.", error);
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
  experienceLevel?: string | null;
  intakeApproach?: string | null;
  offersContinuousCare?: boolean | null;
  availabilityWindow?: string | null;
  competencyDomains?: string[];
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
      experience_level: input.experienceLevel,
      intake_approach: input.intakeApproach,
      offers_continuous_care: input.offersContinuousCare,
      availability_window: input.availabilityWindow,
      created_by: input.createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw erroDeBanco("Não foi possível criar o profissional.", error);
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
      experience_level: input.experienceLevel,
      intake_approach: input.intakeApproach,
      offers_continuous_care: input.offersContinuousCare,
      availability_window: input.availabilityWindow,
      updated_by: input.updatedBy,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw erroDeBanco("Não foi possível atualizar o profissional.", error);
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
    throw erroDeBanco("Não foi possível atualizar o status do profissional.", error);
  }
}

/**
 * Publicar um perfil de demonstração é impossível — o banco tem um CHECK que
 * recusa a combinação. Esta verificação existe para que a recusa chegue como
 * frase em português a quem clicou, e não como erro de constraint. A garantia
 * continua sendo a do banco; esta é a cortesia.
 */
export async function setProfessionalPublicationStatus(
  supabase: SupabaseClient,
  id: string,
  publicationStatus: PublicationStatus,
  updatedBy: string,
): Promise<void> {
  if (publicationStatus === "publicado") {
    const { data } = await supabase.from("professional_profiles").select("is_demo").eq("id", id).maybeSingle();

    if (data?.is_demo) {
      throw new Error(
        "Este é um perfil de demonstração e não pode ser publicado. Ele existe para exercitar o fluxo, nunca para ser oferecido a um paciente.",
      );
    }
  }

  const { error } = await supabase
    .from("professional_profiles")
    .update({ publication_status: publicationStatus, updated_by: updatedBy })
    .eq("id", id);

  if (error) {
    throw erroDeBanco("Não foi possível atualizar a publicação do profissional.", error);
  }
}

export type ReplaceCompetencyDomainsOptions = {
  /**
   * Apagar TODAS as áreas exige uma declaração explícita de esvaziamento.
   * Sem ela, lista vazia significa "nada foi declarado" — e ausência de
   * declaração nunca é autorização de apagamento (Bloco B/E7, gate B15):
   * um formulário sem os campos de competência parseia para `[]`, e a
   * versão antiga desta função apagava as áreas a cada salvamento.
   *
   * BLOCO C (Etapa 8): o esvaziamento deixou de ser um flag cosmético — ele
   * delega para a RPC `remove_professional_competencies`, que exige autor
   * (administrador ou bastidor), MOTIVO e grava a trilha
   * `competencies_removed_explicit` com a lista removida.
   */
  esvaziamentoExplicito?: boolean;
  /** Motivo do esvaziamento — obrigatório quando `esvaziamentoExplicito`. */
  motivoDoEsvaziamento?: string;
};

/**
 * Áreas de competência vivem em tabela própria porque um profissional pode ter
 * mais de uma. Semântica de patch (Bloco B/E7):
 *
 * - lista NÃO vazia = substituição do conjunto: o que foi declarado passa a
 *   valer, o que não foi declarado deixa de valer — nunca acumula
 *   silenciosamente;
 * - lista vazia = ausência de declaração: NADA é alterado, a menos que o
 *   chamador declare `esvaziamentoExplicito` (comando explícito de remoção).
 *
 * A substituição é uma reordenação com guarda — o aditivo primeiro, o
 * subtrativo por último: uma falha no meio deixa no máximo um SUPERconjunto
 * temporário (o retry converge), nunca um profissional sem área nenhuma.
 */
export async function replaceCompetencyDomains(
  supabase: SupabaseClient,
  professionalProfileId: string,
  domains: string[],
  options: ReplaceCompetencyDomainsOptions = {},
): Promise<void> {
  const declarados = [...new Set(domains)];

  if (declarados.length === 0) {
    if (!options.esvaziamentoExplicito) return;

    // O ato explícito vai pela RPC (Bloco C/Etapa 8): autoria verificada no
    // banco, motivo obrigatório, trilha competencies_removed_explicit e a
    // defesa contra esvaziamento silencioso liberada só dentro do ato.
    const motivo = options.motivoDoEsvaziamento?.trim();
    if (!motivo) {
      throw new Error(
        "Esvaziar as áreas de atuação exige o motivo — a remoção explícita é um ato auditado.",
      );
    }

    const { error } = await supabase.rpc("remove_professional_competencies", {
      _professional_profile_id: professionalProfileId,
      _reason: motivo,
    });
    if (error) throw erroDeBanco("Não foi possível remover as áreas de atuação.", error);
    return;
  }

  // 1) Aditivo: garante as áreas declaradas. `focus` é exigido pelo schema
  //    legado do ACE; "avaliacao" é o valor neutro — o Método novo compara
  //    por domínio, não por foco, então nada aqui é inventado sobre o
  //    profissional. Upsert pela PK (profile, domain, focus): repetir não
  //    duplica nem toca carimbos das linhas que já existem.
  const { error: insertError } = await supabase.from("professional_competency_areas").upsert(
    declarados.map((domain) => ({
      professional_profile_id: professionalProfileId,
      domain,
      focus: "avaliacao",
    })),
    { onConflict: "professional_profile_id,domain,focus", ignoreDuplicates: true },
  );
  if (insertError) throw erroDeBanco("Não foi possível salvar as áreas de atuação.", insertError);

  // 2) Subtrativo: só depois de o conjunto declarado existir. Os domínios são
  //    valores do CHECK da tabela (nunca texto livre) — seguros no filtro.
  const { error: deleteError } = await supabase
    .from("professional_competency_areas")
    .delete()
    .eq("professional_profile_id", professionalProfileId)
    .not("domain", "in", `(${declarados.join(",")})`);
  if (deleteError) throw erroDeBanco("Não foi possível atualizar as áreas de atuação.", deleteError);

  // 3) Focos legados de domínios mantidos (dados antigos do ACE) também saem:
  //    o conjunto final é exatamente o declarado, com o foco neutro.
  const { error: focoLegadoError } = await supabase
    .from("professional_competency_areas")
    .delete()
    .eq("professional_profile_id", professionalProfileId)
    .in("domain", declarados)
    .neq("focus", "avaliacao");
  if (focoLegadoError) {
    throw erroDeBanco("Não foi possível atualizar as áreas de atuação.", focoLegadoError);
  }
}

// ---------------------------------------------------------------------------
// Porta de publicação — o que faltava para ela ser satisfazível pela interface
// (Release de Reconstrução, ETAPA 6). O banco exige registro verificado e
// área de atuação verificada desde a política de fontes; nenhuma superfície
// escrevia esses dados. Estas funções fecham essa lacuna.
// ---------------------------------------------------------------------------

export type PracticeAreaRow = {
  rawText: string;
  tags: string[];
  source: string | null;
  verificationStatus: "nao_verificado" | "em_verificacao" | "verificado" | "divergente";
};

export async function getPracticeArea(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<PracticeAreaRow | null> {
  const { data, error } = await supabase
    .from("professional_practice_areas")
    .select("raw_text, tags, source, verification_status")
    .eq("professional_profile_id", professionalProfileId)
    .maybeSingle();

  if (error) throw erroDeBanco("Não foi possível carregar a área de atuação.", error);
  if (!data) return null;

  return {
    rawText: data.raw_text as string,
    tags: (data.tags as string[]) ?? [],
    source: (data.source as string | null) ?? null,
    verificationStatus: data.verification_status as PracticeAreaRow["verificationStatus"],
  };
}

/**
 * Grava a Área de Atuação (uma por profissional — UNIQUE no banco).
 * Verificar exige proveniência: fonte, data e autor (CHECK
 * `verificado_exige_proveniencia`); o texto original é sempre mantido.
 */
export async function upsertPracticeArea(
  supabase: SupabaseClient,
  professionalProfileId: string,
  input: { rawText: string; tags: string[]; source: string | null; verify: boolean; adminId: string },
): Promise<void> {
  const { error } = await supabase.from("professional_practice_areas").upsert(
    {
      professional_profile_id: professionalProfileId,
      raw_text: input.rawText,
      tags: input.tags,
      source: input.source,
      verification_status: input.verify ? "verificado" : "nao_verificado",
      verified_at: input.verify ? new Date().toISOString() : null,
      verified_by: input.verify ? input.adminId : null,
    },
    { onConflict: "professional_profile_id" },
  );

  if (error) throw erroDeBanco("Não foi possível salvar a área de atuação.", error);
}

/**
 * Registra o resultado da verificação do registro no conselho. O CHECK do
 * banco exige fonte, data e autor sempre que um status é declarado — nunca
 * status sem proveniência.
 */
export async function setRegistrationVerification(
  supabase: SupabaseClient,
  professionalProfileId: string,
  input: { status: RegistrationStatus; source: string; adminId: string },
): Promise<void> {
  const { error } = await supabase
    .from("professional_profiles")
    .update({
      registration_status: input.status,
      registration_source: input.source,
      registration_verified_at: new Date().toISOString(),
      registration_verified_by: input.adminId,
      updated_by: input.adminId,
    })
    .eq("id", professionalProfileId);

  if (error) throw erroDeBanco("Não foi possível registrar a verificação do registro.", error);
}

export async function countOpenCriticalDivergences(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("verification_divergences")
    .select("id", { count: "exact", head: true })
    .eq("professional_profile_id", professionalProfileId)
    .eq("status", "aberta")
    .eq("severity", "critica");

  if (error) throw erroDeBanco("Não foi possível consultar divergências do cadastro.", error);
  return count ?? 0;
}

export async function listCompetencyDomains(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("professional_competency_areas")
    .select("domain")
    .eq("professional_profile_id", professionalProfileId);

  return [...new Set((data ?? []).map((row) => row.domain as string))];
}
