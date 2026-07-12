// Adaptadores reais das portas do ACE (ports/provider-repository.ts,
// ports/provider-profile-repository.ts), lidos de professional_profiles +
// professional_competency_areas (ÉPICO 1/SPRINT 3). Nunca inventam dado
// ausente: um profissional sem experience_level, ou sem nenhuma linha em
// professional_competency_areas, simplesmente não aparece como candidato —
// nunca aparece com um valor fabricado. P006/P007 já foram desenhados para
// tratar essa ausência como insuficiência explícita, nunca como erro.
//
// providerType é fixado em "individual": a Rede Aliviar hoje só modela
// profissionais individuais (nenhuma instituição/equipe estruturada ainda -
// ver comentário de 20260712050010_professional_profiles.sql). recordVersion
// é fixado em 1: professional_profiles não tem um conceito de versão por
// linha hoje — isto é só o metadado mínimo que a porta do ACE exige, nunca
// dado inventado sobre o profissional em si.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ClinicalDomain } from "@/modules/ace/artifacts/decision-context";
import type { CompetencyFocus, ExperienceLevel } from "@/modules/ace/artifacts/competency-profile";
import type { CareProviderCandidate, ProviderRepository } from "@/modules/ace/ports/provider-repository";
import type {
  CareProviderProfile,
  ProviderIntakeApproach,
  ProviderProfileRepository,
} from "@/modules/ace/ports/provider-profile-repository";
import type {
  CareProviderPresentation,
  ProviderPresentationRepository,
} from "@/modules/ace/ports/provider-presentation-repository";

type CompetencyAreaRow = {
  professional_profile_id: string;
  domain: ClinicalDomain;
  focus: CompetencyFocus;
};

async function competencyAreasByProfileId(
  supabase: SupabaseClient,
  professionalProfileIds: string[],
): Promise<Map<string, { domain: ClinicalDomain; focus: CompetencyFocus }[]>> {
  const map = new Map<string, { domain: ClinicalDomain; focus: CompetencyFocus }[]>();
  if (professionalProfileIds.length === 0) return map;

  const { data } = await supabase
    .from("professional_competency_areas")
    .select("professional_profile_id, domain, focus")
    .in("professional_profile_id", professionalProfileIds);

  for (const row of (data ?? []) as CompetencyAreaRow[]) {
    const list = map.get(row.professional_profile_id) ?? [];
    list.push({ domain: row.domain, focus: row.focus });
    map.set(row.professional_profile_id, list);
  }

  return map;
}

export class SupabaseProviderRepository implements ProviderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByDomain(domain: ClinicalDomain): Promise<CareProviderCandidate[]> {
    const { data: matchingAreaRows } = await this.supabase
      .from("professional_competency_areas")
      .select("professional_profile_id")
      .eq("domain", domain);

    const candidateIds = Array.from(
      new Set((matchingAreaRows ?? []).map((row) => row.professional_profile_id as string)),
    );

    if (candidateIds.length === 0) {
      return [];
    }

    const [{ data: profiles }, areasByProfileId] = await Promise.all([
      this.supabase
        .from("professional_profiles")
        .select("id, status, experience_level, updated_at")
        .in("id", candidateIds),
      competencyAreasByProfileId(this.supabase, candidateIds),
    ]);

    const candidates: CareProviderCandidate[] = [];

    for (const profile of profiles ?? []) {
      const experienceLevel = profile.experience_level as ExperienceLevel | null;
      if (!experienceLevel) {
        // Insuficiência explícita — nunca inventa o nível de experiência.
        continue;
      }

      candidates.push({
        providerId: profile.id as string,
        providerType: "individual",
        status: profile.status === "ativo" ? "active" : "inactive",
        competencyAreas: areasByProfileId.get(profile.id as string) ?? [],
        experienceLevel,
        recordVersion: 1,
        lastVerifiedAt: profile.updated_at as string,
      });
    }

    return candidates;
  }
}

export class SupabaseProviderProfileRepository implements ProviderProfileRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByIds(providerIds: string[]): Promise<CareProviderProfile[]> {
    if (providerIds.length === 0) {
      return [];
    }

    const [{ data: profiles }, areasByProfileId] = await Promise.all([
      this.supabase
        .from("professional_profiles")
        .select(
          "id, status, experience_level, intake_approach, offers_continuous_care, availability_window, updated_at",
        )
        .in("id", providerIds),
      competencyAreasByProfileId(this.supabase, providerIds),
    ]);

    const result: CareProviderProfile[] = [];

    for (const profile of profiles ?? []) {
      const experienceLevel = profile.experience_level as ExperienceLevel | null;
      const intakeApproach = profile.intake_approach as ProviderIntakeApproach | null;

      if (!experienceLevel || !intakeApproach) {
        // Perfil incompleto — P007 já trata isso como "perfil não
        // encontrado" (buildMissingProfileEntry), nunca inventamos os
        // campos ausentes.
        continue;
      }

      result.push({
        providerId: profile.id as string,
        providerType: "individual",
        status: profile.status === "ativo" ? "active" : "inactive",
        competencyAreas: areasByProfileId.get(profile.id as string) ?? [],
        experienceLevel,
        recordVersion: 1,
        lastVerifiedAt: profile.updated_at as string,
        intakeApproach,
        offersContinuousCare: profile.offers_continuous_care as boolean | null,
        availabilityWindow: profile.availability_window as CareProviderProfile["availabilityWindow"],
      });
    }

    return result;
  }
}

// Porta separada da ProviderProfileRepository (P010, ver docs/ace/04-specs/
// P010-final-curadoria-delivery/specification.md, "Porta de dados de
// apresentação"): dado institucional de apresentação ao paciente, nunca
// dado de análise. Um profissional sem professional_summary preenchido
// simplesmente não aparece — o P010 já trata a ausência como bloqueio
// estruturado, nunca preenche a lacuna.
export class SupabaseProviderPresentationRepository implements ProviderPresentationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByIds(providerIds: string[]): Promise<CareProviderPresentation[]> {
    if (providerIds.length === 0) {
      return [];
    }

    const { data: profiles } = await this.supabase
      .from("professional_profiles")
      .select("id, display_name, professional_summary, practical_considerations")
      .in("id", providerIds);

    const result: CareProviderPresentation[] = [];

    for (const profile of profiles ?? []) {
      const professionalSummary = profile.professional_summary as string | null;
      if (!professionalSummary) {
        continue;
      }

      result.push({
        providerId: profile.id as string,
        displayName: profile.display_name as string,
        professionalSummary,
        practicalConsiderations: (profile.practical_considerations as string[] | null) ?? [],
      });
    }

    return result;
  }
}
