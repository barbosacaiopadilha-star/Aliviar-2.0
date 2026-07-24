import type { CandidatoElegivelView } from "@/curator-flow/contracts/curador-view";
import {
  EventoCuradoriaTipo,
  type CasoCuradoriaStatus,
  type CasoCuradoriaView,
  type CuradoriaTecnicaView,
  type DevolutivaView,
  type DimensaoPrioridadeView,
  type DossieOpcaoView,
  type DossieStatus,
  type DossieVersaoStatus,
  type DossieVersaoView,
  type DossieView,
  type EscolhaCuradoriaView,
  type PerfilPrioridadesView,
} from "@/curadoria-flow/contracts/dossie-view";
import type { ComparativoDimensaoView } from "@/experience-flow/contracts/jornada-view";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { appendEventoCuradoria } from "@/infrastructure/curadoria/curadoria-audit";
import {
  dossieOpcaoToReportOptionPayload,
  reportOptionToDossieOpcao,
  type ReportOptionExtras,
  type ReportOptionRow,
} from "@/infrastructure/curadoria/dossie-mapper";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

interface JourneyBridge {
  journeyId: string;
  patientId: string;
  patientProfileId: string;
  casoId: string | null;
}

interface WorkspaceDossieMeta {
  curadoria_case_id?: string;
  dossie_versao_atual?: number;
  dossie_comparativo?: ComparativoDimensaoView[];
  dossie_versao_status?: DossieVersaoStatus;
  dossie_aprovado_por?: string | null;
  dossie_aprovado_em?: string | null;
  dossie_option_extras?: Record<string, ReportOptionExtras>;
}

interface CaseRow {
  id: string;
  patient_profile_id: string;
  assigned_curator_id: string | null;
  status: string;
  source_story_id: string;
  created_at: string;
  updated_at: string;
}

interface PriorityProfileRow {
  id: string;
  case_id: string;
  curator_id: string;
  status: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PriorityWeightRow {
  criterion: string;
  weight: number;
  target_value: string | null;
  evidence: string;
}

interface CuratedSelectionRow {
  id: string;
  case_id: string;
  priority_profile_id: string;
  selected_by: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CuratedSelectionOptionRow {
  id: string;
  curated_selection_id: string;
  professional_profile_id: string;
  position: number;
  rationale: string;
  band: string;
}

interface ReportRow {
  id: string;
  case_id: string;
  curated_selection_id: string;
  composition_rationale: string | null;
  emitted_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DevolutivaRecordRow {
  id: string;
  case_id: string;
  report_id: string;
  presented_by: string;
  presented_at: string | null;
  patient_questions: string[];
  observations: string[];
  next_steps: string[];
  created_at: string;
  updated_at: string;
}

interface PatientDecisionRow {
  id: string;
  case_id: string;
  curated_selection_id: string;
  chosen_option_id: string | null;
  outcome: string;
  note: string | null;
  decided_at: string;
}

interface ProfessionalProfileRow {
  id: string;
  display_name: string;
}

const PRIORITY_STATUS_VALIDATED = "VALIDATED";
const SELECTION_BANDS = ["ALTA", "BOA", "MODERADA"] as const;
const SELECTION_STATUS_FINALIZED = "DELIVERED";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function deriveCasoStatus(input: {
  hasValidatedProfile: boolean;
  hasFinalizedSelection: boolean;
  reportStatus: DossieStatus | null;
  hasDevolutiva: boolean;
  hasDecision: boolean;
}): CasoCuradoriaStatus {
  if (input.hasDecision) return "ESCOLHA";
  if (input.hasDevolutiva) return "DEVOLUTIVA";
  if (input.reportStatus === "PUBLICADO") return "PUBLICADO";
  if (input.reportStatus) return "DOSSIE";
  if (input.hasFinalizedSelection) return "MESA";
  if (input.hasValidatedProfile) return "MESA";
  return "ABERTO";
}

function deriveDossieStatus(
  report: ReportRow,
  versaoStatus?: DossieVersaoStatus,
): DossieStatus {
  if (report.delivered_at) return "PUBLICADO";
  if (versaoStatus === "APROVADO" || report.emitted_at) return "APROVADO";
  if (versaoStatus === "EM_REVISAO") return "EM_REVISAO";
  return "RASCUNHO";
}

function deriveVersaoStatus(
  report: ReportRow,
  meta?: WorkspaceDossieMeta,
): DossieVersaoStatus {
  if (report.delivered_at) return "PUBLICADO";
  if (meta?.dossie_versao_status) return meta.dossie_versao_status;
  if (report.emitted_at) return "APROVADO";
  return "RASCUNHO";
}

export class CuradoriaRepository {
  private async resolveJourneyBridge(journeyId: string): Promise<JourneyBridge> {
    const supabase = await createClient();

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, patient_id, patients!inner(id, auth_user_id)")
      .eq("id", journeyId)
      .maybeSingle();

    if (journeyError) {
      throw new BusinessRuleError(journeyError.message);
    }
    if (!journey) {
      throw new NotFoundError("Jornada");
    }

    const patientRaw = journey.patients as
      | { id: string; auth_user_id: string | null }
      | { id: string; auth_user_id: string | null }[];
    const patient = Array.isArray(patientRaw) ? patientRaw[0] : patientRaw;
    if (!patient?.auth_user_id) {
      throw new BusinessRuleError(
        "Paciente sem perfil de autenticação vinculado à curadoria.",
      );
    }

    const meta = await this.loadWorkspaceMeta(journeyId);

    return {
      journeyId,
      patientId: patient.id,
      patientProfileId: patient.auth_user_id,
      casoId: meta.curadoria_case_id ?? null,
    };
  }

  private async loadWorkspaceMeta(journeyId: string): Promise<WorkspaceDossieMeta> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_case_workspaces")
      .select("workspace_data")
      .eq("journey_id", journeyId)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return ((data?.workspace_data as WorkspaceDossieMeta | null) ?? {}) as WorkspaceDossieMeta;
  }

  private async saveWorkspaceMeta(
    journeyId: string,
    patch: Partial<WorkspaceDossieMeta>,
  ): Promise<WorkspaceDossieMeta> {
    const supabase = createServiceRoleClient() ?? (await createClient());
    const current = await this.loadWorkspaceMeta(journeyId);
    const merged = { ...current, ...patch };

    const { error } = await supabase.from("curator_case_workspaces").upsert(
      {
        journey_id: journeyId,
        workspace_data: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "journey_id" },
    );

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return merged;
  }

  private async linkCasoToJourney(journeyId: string, casoId: string): Promise<void> {
    await this.saveWorkspaceMeta(journeyId, { curadoria_case_id: casoId });
  }

  private async ensurePatientProfile(patientProfileId: string): Promise<void> {
    const supabase = await createClient();
    const { data: existing, error: readError } = await supabase
      .schema("curadoria")
      .from("profiles")
      .select("id")
      .eq("id", patientProfileId)
      .maybeSingle();

    if (readError) {
      throw new BusinessRuleError(readError.message);
    }
    if (existing) return;

    const { error } = await supabase.schema("curadoria").from("profiles").insert({
      id: patientProfileId,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }
  }

  private async getOrCreatePatientStory(
    patientProfileId: string,
    createdBy: string,
  ): Promise<string> {
    const supabase = await createClient();

    const { data: existing, error: readError } = await supabase
      .schema("curadoria")
      .from("patient_stories")
      .select("id")
      .eq("profile_id", patientProfileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readError) {
      throw new BusinessRuleError(readError.message);
    }
    if (existing) {
      return existing.id as string;
    }

    const storyId = randomUUID();
    const { error } = await supabase.schema("curadoria").from("patient_stories").insert({
      id: storyId,
      profile_id: patientProfileId,
      status: "SUBMITTED",
      current_step: "COMPLETE",
      data: {},
      revision: 1,
      created_by: createdBy,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return storyId;
  }

  private async loadCaseRow(casoId: string): Promise<CaseRow> {
    const supabase = createServiceRoleClient() ?? (await createClient());
    const { data, error } = await supabase
      .schema("curadoria")
      .from("cases")
      .select("*")
      .eq("id", casoId)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!data) {
      throw new NotFoundError("Caso de curadoria");
    }

    return data as CaseRow;
  }

  private async resolveCasoId(bridge: JourneyBridge): Promise<string | null> {
    if (bridge.casoId) {
      return bridge.casoId;
    }

    const casoId = await this.findCasoIdByPatientProfile(bridge.patientProfileId);
    if (!casoId) {
      return null;
    }

    await this.linkCasoToJourney(bridge.journeyId, casoId);
    return casoId;
  }

  private async findCasoIdByPatientProfile(patientProfileId: string): Promise<string | null> {
    const supabase = createServiceRoleClient() ?? (await createClient());
    const { data, error } = await supabase
      .schema("curadoria")
      .from("cases")
      .select("id")
      .eq("patient_profile_id", patientProfileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return (data?.id as string | undefined) ?? null;
  }

  private async loadPerfil(
    casoId: string,
    journeyId: string,
  ): Promise<PerfilPrioridadesView | null> {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .schema("curadoria")
      .from("priority_profiles")
      .select("*")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!profile) {
      return null;
    }

    const profileRow = profile as PriorityProfileRow;

    const { data: weights, error: weightsError } = await supabase
      .schema("curadoria")
      .from("priority_weights")
      .select("criterion, weight, target_value, evidence")
      .eq("priority_profile_id", profileRow.id);

    if (weightsError) {
      throw new BusinessRuleError(weightsError.message);
    }

    const weightRows = (weights ?? []) as PriorityWeightRow[];
    const pesos: Record<string, number> = {};
    const dimensoes: DimensaoPrioridadeView[] = weightRows.map((row) => {
      pesos[row.criterion] = row.weight;
      return {
        nome: row.criterion,
        descricao: row.evidence || undefined,
        valor: row.weight,
      };
    });

    return {
      id: profileRow.id,
      caso_id: casoId,
      journey_id: journeyId,
      dimensoes,
      pesos,
      validado: profileRow.status === PRIORITY_STATUS_VALIDATED,
      validado_por: profileRow.status === PRIORITY_STATUS_VALIDATED ? profileRow.curator_id : null,
      validado_em: profileRow.validated_at,
      criado_em: profileRow.created_at,
      atualizado_em: profileRow.updated_at,
    };
  }

  private async loadCuradoriaTecnica(
    casoId: string,
    journeyId: string,
  ): Promise<CuradoriaTecnicaView | null> {
    const supabase = await createClient();

    const { data: selection, error } = await supabase
      .schema("curadoria")
      .from("curated_selections")
      .select("*")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!selection) {
      return null;
    }

    const selectionRow = selection as CuratedSelectionRow;

    const { data: options, error: optionsError } = await supabase
      .schema("curadoria")
      .from("curated_selection_options")
      .select("id, curated_selection_id, professional_profile_id, position, rationale, band")
      .eq("curated_selection_id", selectionRow.id)
      .order("position", { ascending: true });

    if (optionsError) {
      throw new BusinessRuleError(optionsError.message);
    }

    const optionRows = (options ?? []) as CuratedSelectionOptionRow[];
    const professionalIds = optionRows.map((o) => o.professional_profile_id);
    const professionals = await this.loadProfessionalProfiles(professionalIds);

    const candidatos: CandidatoElegivelView[] = optionRows.map((option) => {
      const professional = professionals.get(option.professional_profile_id);
      return {
        id: option.professional_profile_id,
        nome: professional?.display_name ?? "",
        especialidade: professional?.especialidade ?? "",
        nota_curador: option.rationale || null,
      };
    });

    const concluida = selectionRow.status === SELECTION_STATUS_FINALIZED;

    return {
      id: selectionRow.id,
      caso_id: casoId,
      journey_id: journeyId,
      status: concluida ? "CONCLUIDA" : "EM_ANDAMENTO",
      candidatos_selecionados: candidatos,
      concluida_por: concluida ? selectionRow.selected_by : null,
      concluida_em: concluida ? selectionRow.updated_at : null,
      criado_em: selectionRow.created_at,
      atualizado_em: selectionRow.updated_at,
    };
  }

  private async loadProfessionalProfiles(
    ids: string[],
  ): Promise<Map<string, { display_name: string; especialidade: string }>> {
    const map = new Map<string, { display_name: string; especialidade: string }>();
    if (ids.length === 0) return map;

    const supabase = await createClient();
    const { data: profiles, error } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .select("id, display_name")
      .in("id", ids);

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const { data: competencies, error: compError } = await supabase
      .schema("curadoria")
      .from("professional_competency_areas")
      .select("professional_profile_id, domain")
      .in("professional_profile_id", ids);

    if (compError) {
      throw new BusinessRuleError(compError.message);
    }

    const specialtyByProfile = new Map<string, string>();
    for (const row of competencies ?? []) {
      const profileId = row.professional_profile_id as string;
      if (!specialtyByProfile.has(profileId)) {
        specialtyByProfile.set(profileId, row.domain as string);
      }
    }

    for (const profile of (profiles ?? []) as ProfessionalProfileRow[]) {
      map.set(profile.id, {
        display_name: profile.display_name,
        especialidade: specialtyByProfile.get(profile.id) ?? "",
      });
    }

    return map;
  }

  private async loadDossie(
    casoId: string,
    journeyId: string,
    workspaceMeta: WorkspaceDossieMeta,
  ): Promise<DossieView | null> {
    const supabase = await createClient();

    const { data: report, error } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .select("*")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!report) {
      return null;
    }

    const reportRow = report as ReportRow;
    const caseRow = await this.loadCaseRow(casoId);
    const versao = await this.buildDossieVersao(reportRow, workspaceMeta);

    const status = deriveDossieStatus(reportRow, versao.status);
    const versaoPublicada =
      status === "PUBLICADO" || versao.status === "PUBLICADO" ? versao : null;

    return {
      id: reportRow.id,
      caso_id: casoId,
      journey_id: journeyId,
      status,
      versao_atual: workspaceMeta.dossie_versao_atual ?? 1,
      curador_id: caseRow.assigned_curator_id ?? "",
      publicado_em: reportRow.delivered_at,
      publicado_por: reportRow.delivered_at ? caseRow.assigned_curator_id : null,
      criado_em: reportRow.created_at,
      atualizado_em: reportRow.updated_at,
      versao_publicada: versaoPublicada,
    };
  }

  private async buildDossieVersao(
    report: ReportRow,
    workspaceMeta: WorkspaceDossieMeta,
  ): Promise<DossieVersaoView> {
    const supabase = createServiceRoleClient() ?? (await createClient());

    const { data: options, error } = await supabase
      .schema("curadoria")
      .from("curadoria_report_options")
      .select("*")
      .eq("report_id", report.id)
      .order("position", { ascending: true });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const optionRows = (options ?? []) as ReportOptionRow[];
    const professionalIds = optionRows.map((o) => o.professional_profile_id);
    const professionals = await this.loadProfessionalProfiles(professionalIds);
    const extras = workspaceMeta.dossie_option_extras ?? {};

    const opcoes = optionRows.map((row) =>
      reportOptionToDossieOpcao(
        row,
        professionals.get(row.professional_profile_id),
        extras[String(row.position)],
      ),
    );

    const caseRow = await this.loadCaseRow(report.case_id);
    const status = deriveVersaoStatus(report, workspaceMeta);

    return {
      id: report.id,
      dossie_id: report.id,
      versao: workspaceMeta.dossie_versao_atual ?? 1,
      status,
      comparativo: workspaceMeta.dossie_comparativo ?? [],
      opcoes,
      criado_por: caseRow.assigned_curator_id ?? caseRow.patient_profile_id,
      criado_em: report.created_at,
      aprovado_por: workspaceMeta.dossie_aprovado_por ?? null,
      aprovado_em: workspaceMeta.dossie_aprovado_em ?? report.emitted_at,
    };
  }

  private async loadDevolutiva(
    casoId: string,
    journeyId: string,
  ): Promise<DevolutivaView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .select("*")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!data) {
      return null;
    }

    const row = data as DevolutivaRecordRow;
    const concluida = Boolean(row.presented_at && row.next_steps.length > 0);

    return {
      id: row.id,
      dossie_id: row.report_id,
      journey_id: journeyId,
      data_devolutiva: row.presented_at,
      dossie_apresentado: Boolean(row.presented_at),
      duvidas_relevantes: row.patient_questions ?? [],
      concluida,
      concluida_por: concluida ? row.presented_by : null,
      concluida_em: concluida ? row.presented_at : null,
      criado_em: row.created_at,
      atualizado_em: row.updated_at,
    };
  }

  private async loadEscolha(
    casoId: string,
    journeyId: string,
    patientId: string,
    selectionId: string | null,
  ): Promise<EscolhaCuradoriaView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("curadoria")
      .from("patient_curadoria_decisions")
      .select("*")
      .eq("case_id", casoId)
      .order("decided_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!data) {
      return null;
    }

    const row = data as PatientDecisionRow;
    let opcaoIndice = 0;
    let profissionalNome = "";
    let profissionalEspecialidade = "";
    let dossieId = "";
    let versaoId = "";

    if (row.chosen_option_id && selectionId) {
      const { data: chosenOption, error: optionError } = await supabase
        .schema("curadoria")
        .from("curated_selection_options")
        .select("position, professional_profile_id, curated_selection_id")
        .eq("id", row.chosen_option_id)
        .maybeSingle();

      if (optionError) {
        throw new BusinessRuleError(optionError.message);
      }

      if (chosenOption) {
        opcaoIndice = chosenOption.position as number;
        const professionals = await this.loadProfessionalProfiles([
          chosenOption.professional_profile_id as string,
        ]);
        const professional = professionals.get(chosenOption.professional_profile_id as string);
        profissionalNome = professional?.display_name ?? "";
        profissionalEspecialidade = professional?.especialidade ?? "";
      }
    }

    const { data: report } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .select("id")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (report) {
      dossieId = report.id as string;
      versaoId = report.id as string;
    }

    const { data: devolutiva } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .select("next_steps")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id: row.id,
      journey_id: journeyId,
      patient_id: patientId,
      dossie_id: dossieId,
      dossie_versao_id: versaoId,
      opcao_indice: opcaoIndice,
      profissional_nome: profissionalNome,
      profissional_especialidade: profissionalEspecialidade,
      proximos_passos: ((devolutiva?.next_steps as string[] | undefined) ?? []).join("\n"),
      observacao_paciente: row.note,
      registrada_em: row.decided_at,
    };
  }

  async ensureCaso(
    journeyId: string,
    patientId: string,
    curadorId?: string,
  ): Promise<CasoCuradoriaView> {
    const bridge = await this.resolveJourneyBridge(journeyId);

    if (bridge.patientId !== patientId) {
      throw new BusinessRuleError("Paciente não corresponde à jornada informada.");
    }

    const existingCasoId = await this.resolveCasoId(bridge);
    if (existingCasoId) {
      if (curadorId) {
        const supabase = await createClient();
        const { error } = await supabase
          .schema("curadoria")
          .from("cases")
          .update({ assigned_curator_id: curadorId })
          .eq("id", existingCasoId)
          .is("assigned_curator_id", null);

        if (error) {
          throw new BusinessRuleError(error.message);
        }
      }

      const existente = await this.obterCasoPorJornada(journeyId);
      if (!existente) {
        throw new NotFoundError("Caso de curadoria");
      }
      return existente;
    }

    const supabase = await createClient();
    const casoId = randomUUID();
    const createdBy = curadorId ?? bridge.patientProfileId;

    await this.ensurePatientProfile(bridge.patientProfileId);
    const sourceStoryId = await this.getOrCreatePatientStory(
      bridge.patientProfileId,
      createdBy,
    );

    const { error: casoError } = await supabase.schema("curadoria").from("cases").insert({
      id: casoId,
      patient_profile_id: bridge.patientProfileId,
      source_story_id: sourceStoryId,
      status: "IN_CURATION",
      assigned_curator_id: curadorId ?? null,
      created_by: createdBy,
    });

    if (casoError) {
      throw new BusinessRuleError(casoError.message);
    }

    const priorityProfileId = randomUUID();
    const { error: perfilError } = await supabase
      .schema("curadoria")
      .from("priority_profiles")
      .insert({
        id: priorityProfileId,
        case_id: casoId,
        curator_id: curadorId ?? createdBy,
        status: "DRAFT",
      });

    if (perfilError) {
      throw new BusinessRuleError(perfilError.message);
    }

    await this.linkCasoToJourney(journeyId, casoId);

    await appendEventoCuradoria({
      casoId,
      journeyId,
      tipo: EventoCuradoriaTipo.CASO_ABERTO,
      actorId: curadorId ?? null,
      actorRole: curadorId ? "STAFF" : "SYSTEM",
      metadata: { patient_id: patientId },
    });

    const criado = await this.obterCasoPorJornada(journeyId);
    if (!criado) {
      throw new NotFoundError("Caso de curadoria");
    }
    return criado;
  }

  async obterCasoPorJornada(journeyId: string): Promise<CasoCuradoriaView | null> {
    const bridge = await this.resolveJourneyBridge(journeyId);
    const casoId = await this.resolveCasoId(bridge);
    if (!casoId) {
      return null;
    }

    const casoRow = await this.loadCaseRow(casoId);
    const workspaceMeta = await this.loadWorkspaceMeta(journeyId);

    const [perfil, mesa, dossie, devolutiva] = await Promise.all([
      this.loadPerfil(casoId, journeyId),
      this.loadCuradoriaTecnica(casoId, journeyId),
      this.loadDossie(casoId, journeyId, workspaceMeta),
      this.loadDevolutiva(casoId, journeyId),
    ]);

    const escolha = await this.loadEscolha(
      casoId,
      journeyId,
      bridge.patientId,
      mesa?.id ?? null,
    );

    const status = deriveCasoStatus({
      hasValidatedProfile: Boolean(perfil?.validado),
      hasFinalizedSelection: mesa?.status === "CONCLUIDA",
      reportStatus: dossie?.status ?? null,
      hasDevolutiva: Boolean(devolutiva),
      hasDecision: Boolean(escolha),
    });

    return {
      id: casoRow.id,
      journey_id: journeyId,
      patient_id: bridge.patientId,
      curador_id: casoRow.assigned_curator_id,
      status,
      perfil_prioridades: perfil,
      curadoria_tecnica: mesa,
      dossie,
      devolutiva,
      escolha,
      criado_em: casoRow.created_at,
      atualizado_em: casoRow.updated_at,
    };
  }

  async validarPerfilPrioridades(
    casoId: string,
    curadorId: string,
    dimensoes: DimensaoPrioridadeView[],
    pesos: Record<string, number>,
  ): Promise<PerfilPrioridadesView> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const caso = await this.obterCasoPorId(casoId);

    const { data: profile, error: profileError } = await supabase
      .schema("curadoria")
      .from("priority_profiles")
      .select("*")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (profileError) {
      throw new BusinessRuleError(profileError.message);
    }

    const profileRow = profile as PriorityProfileRow;

    const { error: deleteWeightsError } = await supabase
      .schema("curadoria")
      .from("priority_weights")
      .delete()
      .eq("priority_profile_id", profileRow.id);

    if (deleteWeightsError) {
      throw new BusinessRuleError(deleteWeightsError.message);
    }

    const weightRows = dimensoes.map((dimensao) => ({
      id: randomUUID(),
      priority_profile_id: profileRow.id,
      criterion: dimensao.nome,
      weight: pesos[dimensao.nome] ?? dimensao.valor ?? 0,
      target_value: dimensao.descricao ?? null,
      evidence: dimensao.descricao ?? "",
    }));

    if (weightRows.length > 0) {
      const { error: insertWeightsError } = await supabase
        .schema("curadoria")
        .from("priority_weights")
        .insert(weightRows);

      if (insertWeightsError) {
        throw new BusinessRuleError(insertWeightsError.message);
      }
    }

    const { error: updateError } = await supabase
      .schema("curadoria")
      .from("priority_profiles")
      .update({
        status: PRIORITY_STATUS_VALIDATED,
        curator_id: curadorId,
        validated_at: now,
      })
      .eq("id", profileRow.id);

    if (updateError) {
      throw new BusinessRuleError(updateError.message);
    }

    const { error: casoError } = await supabase
      .schema("curadoria")
      .from("cases")
      .update({ status: "IN_CURATION", assigned_curator_id: curadorId })
      .eq("id", casoId);

    if (casoError) {
      throw new BusinessRuleError(casoError.message);
    }

    await appendEventoCuradoria({
      casoId,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.PERFIL_VALIDADO,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dimensoes_count: dimensoes.length },
    });

    const atualizado = await this.loadPerfil(casoId, caso.journey_id);
    if (!atualizado) {
      throw new NotFoundError("Perfil de prioridades");
    }
    return atualizado;
  }

  async concluirCuradoriaTecnica(
    casoId: string,
    curadorId: string,
    candidatos: CandidatoElegivelView[],
  ): Promise<CuradoriaTecnicaView> {
    const supabase = await createClient();
    const caso = await this.obterCasoPorId(casoId);

    if (!caso.perfil_prioridades?.validado) {
      throw new BusinessRuleError("Perfil de prioridades deve estar validado antes da mesa.");
    }

    if (candidatos.length === 0) {
      throw new BusinessRuleError("Pelo menos um candidato deve ser selecionado.");
    }

    for (const candidato of candidatos) {
      if (!isUuid(candidato.id)) {
        throw new BusinessRuleError(
          `Candidato ${candidato.nome} deve referenciar um professional_profile_id válido.`,
        );
      }
    }

    const priorityProfileId = caso.perfil_prioridades.id;
    const now = new Date().toISOString();

    const { data: existingSelection, error: selectionReadError } = await supabase
      .schema("curadoria")
      .from("curated_selections")
      .select("id")
      .eq("case_id", casoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectionReadError) {
      throw new BusinessRuleError(selectionReadError.message);
    }

    const selectionId = (existingSelection?.id as string | undefined) ?? randomUUID();

    if (existingSelection) {
      const { error: updateSelectionError } = await supabase
        .schema("curadoria")
        .from("curated_selections")
        .update({
          selected_by: curadorId,
          status: SELECTION_STATUS_FINALIZED,
          delivered_at: now,
          composition_rationale: "Mesa de curadoria técnica concluída.",
          updated_at: now,
        })
        .eq("id", selectionId);

      if (updateSelectionError) {
        throw new BusinessRuleError(updateSelectionError.message);
      }

      const { error: deleteOptionsError } = await supabase
        .schema("curadoria")
        .from("curated_selection_options")
        .delete()
        .eq("curated_selection_id", selectionId);

      if (deleteOptionsError) {
        throw new BusinessRuleError(deleteOptionsError.message);
      }
    } else {
      const { error: insertSelectionError } = await supabase
        .schema("curadoria")
        .from("curated_selections")
        .insert({
          id: selectionId,
          case_id: casoId,
          priority_profile_id: priorityProfileId,
          selected_by: curadorId,
          composition_rationale: "Mesa de curadoria técnica concluída.",
          status: "DRAFT",
        });

      if (insertSelectionError) {
        throw new BusinessRuleError(insertSelectionError.message);
      }
    }

    const optionRows = candidatos.map((candidato, index) => ({
      id: randomUUID(),
      curated_selection_id: selectionId,
      professional_profile_id: candidato.id,
      position: index + 1,
      band: SELECTION_BANDS[index] ?? "MODERADA",
      rationale: candidato.nota_curador ?? "",
      trade_off: null,
    }));

    const { error: insertOptionsError } = await supabase
      .schema("curadoria")
      .from("curated_selection_options")
      .insert(optionRows);

    if (insertOptionsError) {
      throw new BusinessRuleError(insertOptionsError.message);
    }

    const { error: finalizeSelectionError } = await supabase
      .schema("curadoria")
      .from("curated_selections")
      .update({
        status: SELECTION_STATUS_FINALIZED,
        delivered_at: now,
        updated_at: now,
      })
      .eq("id", selectionId);

    if (finalizeSelectionError) {
      throw new BusinessRuleError(finalizeSelectionError.message);
    }

    await appendEventoCuradoria({
      casoId,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.MESA_CONCLUIDA,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { candidatos_count: candidatos.length },
    });

    const mesa = await this.loadCuradoriaTecnica(casoId, caso.journey_id);
    if (!mesa) {
      throw new NotFoundError("Mesa de curadoria técnica");
    }
    return mesa;
  }

  async iniciarDossie(casoId: string, curadorId: string): Promise<DossieView> {
    const supabase = await createClient();
    const caso = await this.obterCasoPorId(casoId);

    if (!caso.perfil_prioridades?.validado) {
      throw new BusinessRuleError("Perfil de prioridades deve estar validado.");
    }
    if (caso.curadoria_tecnica?.status !== "CONCLUIDA") {
      throw new BusinessRuleError("Mesa de curadoria técnica deve estar concluída.");
    }
    if (caso.dossie) {
      throw new BusinessRuleError("Dossiê já iniciado para este caso.");
    }

    const selectionId = caso.curadoria_tecnica.id;
    const reportId = randomUUID();

    const { error: reportError } = await supabase.schema("curadoria").from("curadoria_reports").insert({
      id: reportId,
      case_id: casoId,
      curated_selection_id: selectionId,
      composition_rationale: null,
    });

    if (reportError) {
      throw new BusinessRuleError(reportError.message);
    }

    const mesaOptions = await supabase
      .schema("curadoria")
      .from("curated_selection_options")
      .select("professional_profile_id, position, rationale")
      .eq("curated_selection_id", selectionId)
      .order("position", { ascending: true });

    if (mesaOptions.error) {
      throw new BusinessRuleError(mesaOptions.error.message);
    }

    const emptyOptions = (mesaOptions.data ?? []).map((option) => ({
      id: randomUUID(),
      report_id: reportId,
      professional_profile_id: option.professional_profile_id,
      position: option.position,
      justification: (option.rationale as string)?.trim() || "Parecer em elaboração.",
      relation_to_weights: "Relação com pesos em elaboração.",
      favorable_points: [],
      attention_points: [],
      suggested_questions: [],
      curator_observations: null,
    }));

    if (emptyOptions.length !== 3) {
      throw new BusinessRuleError("A mesa deve conter exatamente três opções para iniciar o dossiê.");
    }

    const { error: optionsError } = await supabase
      .schema("curadoria")
      .from("curadoria_report_options")
      .insert(emptyOptions);

    if (optionsError) {
      throw new BusinessRuleError(optionsError.message);
    }

    const { error: casoError } = await supabase
      .schema("curadoria")
      .from("cases")
      .update({ status: "HUMAN_REVIEW", assigned_curator_id: curadorId })
      .eq("id", casoId);

    if (casoError) {
      throw new BusinessRuleError(casoError.message);
    }

    await this.saveWorkspaceMeta(caso.journey_id, {
      dossie_versao_atual: 1,
      dossie_comparativo: [],
      dossie_versao_status: "RASCUNHO",
      dossie_aprovado_por: null,
      dossie_aprovado_em: null,
      dossie_option_extras: {},
    });

    await appendEventoCuradoria({
      casoId,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DOSSIE_INICIADO,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dossie_id: reportId, versao_id: reportId },
    });

    const dossie = await this.loadDossie(casoId, caso.journey_id, await this.loadWorkspaceMeta(caso.journey_id));
    if (!dossie) {
      throw new NotFoundError("Dossiê");
    }
    return dossie;
  }

  async salvarRascunhoDossie(
    dossieId: string,
    versaoId: string,
    opcoes: DossieOpcaoView[],
    comparativo: ComparativoDimensaoView[],
    curadorId: string,
  ): Promise<DossieVersaoView> {
    if (opcoes.length !== 3) {
      throw new BusinessRuleError("Exatamente três opções devem ser informadas.");
    }

    for (const opcao of opcoes) {
      if (!opcao.parecer.trim()) {
        throw new BusinessRuleError(`Parecer obrigatório para opção ${opcao.rotulo}.`);
      }
    }

    if (dossieId !== versaoId) {
      throw new BusinessRuleError("Versão do dossiê inválida para o relatório informado.");
    }

    const supabase = await createClient();
    const dossie = await this.obterDossiePorId(dossieId);
    const caso = await this.obterCasoPorId(dossie.case_id);
    const workspaceMeta = await this.loadWorkspaceMeta(caso.journey_id);

    if (workspaceMeta.dossie_versao_status === "APROVADO" || workspaceMeta.dossie_versao_status === "PUBLICADO") {
      throw new BusinessRuleError("Versão imutável após aprovação ou publicação.");
    }

    const { data: existingRows, error: existingError } = await supabase
      .schema("curadoria")
      .from("curadoria_report_options")
      .select("id, position, professional_profile_id, relation_to_weights")
      .eq("report_id", dossieId);

    if (existingError) {
      throw new BusinessRuleError(existingError.message);
    }

    const existingByPosition = new Map(
      (existingRows ?? []).map((row) => [row.position as number, row]),
    );

    const optionExtras: Record<string, ReportOptionExtras> = {};

    for (const opcao of opcoes) {
      const existing = existingByPosition.get(opcao.indice + 1);
      const opcaoEnriquecida: DossieOpcaoView = {
        ...opcao,
        id: opcao.id?.trim() ? opcao.id : ((existing?.id as string | undefined) ?? randomUUID()),
        professional_profile_id:
          opcao.professional_profile_id ?? (existing?.professional_profile_id as string | undefined),
        relation_to_weights: opcao.relation_to_weights?.trim()
          ? opcao.relation_to_weights
          : ((existing?.relation_to_weights as string | undefined) ?? "Relação com pesos em elaboração."),
      };

      if (!opcaoEnriquecida.professional_profile_id) {
        throw new BusinessRuleError(`Profissional não vinculado à opção ${opcao.rotulo}.`);
      }

      const payload = dossieOpcaoToReportOptionPayload(opcaoEnriquecida, dossieId);
      optionExtras[String(opcao.indice)] = {
        o_que_esperar: opcao.o_que_esperar,
        evidencias_resumo: opcao.evidencias_resumo,
      };

      const { error } = await supabase
        .schema("curadoria")
        .from("curadoria_report_options")
        .upsert(
          {
            ...payload,
            id: opcaoEnriquecida.id,
            professional_profile_id: opcaoEnriquecida.professional_profile_id,
          },
          { onConflict: "report_id,position" },
        );

      if (error) {
        throw new BusinessRuleError(error.message);
      }
    }

    await this.saveWorkspaceMeta(caso.journey_id, {
      dossie_comparativo: comparativo,
      dossie_versao_status: "RASCUNHO",
      dossie_option_extras: optionExtras,
    });

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DOSSIE_ALTERADO,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dossie_id: dossieId, versao_id: versaoId },
    });

    const atualizada = await this.carregarVersaoPorId(versaoId, caso.journey_id);
    if (!atualizada) {
      throw new NotFoundError("Versão do dossiê");
    }
    return atualizada;
  }

  async criarVersaoDossie(dossieId: string, curadorId: string): Promise<DossieVersaoView> {
    const dossie = await this.obterDossiePorId(dossieId);
    const caso = await this.obterCasoPorId(dossie.case_id);
    const workspaceMeta = await this.loadWorkspaceMeta(caso.journey_id);
    const versaoAtual = workspaceMeta.dossie_versao_atual ?? 1;
    const novaVersao = versaoAtual + 1;

    await this.saveWorkspaceMeta(caso.journey_id, {
      dossie_versao_atual: novaVersao,
      dossie_versao_status: "RASCUNHO",
      dossie_aprovado_por: null,
      dossie_aprovado_em: null,
    });

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DOSSIE_VERSAO_CRIADA,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dossie_id: dossieId, versao: novaVersao, versao_id: dossieId },
    });

    const criada = await this.carregarVersaoPorId(dossieId, caso.journey_id);
    if (!criada) {
      throw new NotFoundError("Versão do dossiê");
    }
    return criada;
  }

  async aprovarVersao(dossieVersaoId: string, curadorId: string): Promise<DossieVersaoView> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const versao = await this.carregarVersaoPorIdSemJornada(dossieVersaoId);
    if (!versao) {
      throw new NotFoundError("Versão do dossiê");
    }

    if (versao.opcoes.length !== 3 || versao.opcoes.some((o) => !o.parecer.trim())) {
      throw new BusinessRuleError("Todas as opções devem ter parecer antes da aprovação.");
    }

    const dossie = await this.obterDossiePorId(versao.dossie_id);
    const caso = await this.obterCasoPorId(dossie.case_id);

    const { error } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .update({ emitted_at: now })
      .eq("id", versao.dossie_id);

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    await this.saveWorkspaceMeta(caso.journey_id, {
      dossie_versao_status: "APROVADO",
      dossie_aprovado_por: curadorId,
      dossie_aprovado_em: now,
    });

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DOSSIE_APROVADO,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dossie_id: versao.dossie_id, versao_id: dossieVersaoId },
    });

    const atualizada = await this.carregarVersaoPorId(dossieVersaoId, caso.journey_id);
    if (!atualizada) {
      throw new NotFoundError("Versão do dossiê");
    }
    return atualizada;
  }

  async publicarDossie(dossieId: string, curadorId: string): Promise<DossieView> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const dossie = await this.obterDossiePorId(dossieId);
    const caso = await this.obterCasoPorId(dossie.case_id);
    const workspaceMeta = await this.loadWorkspaceMeta(caso.journey_id);

    const versao = await this.carregarVersaoPorId(dossieId, caso.journey_id);
    if (!versao) {
      throw new NotFoundError("Versão do dossiê");
    }

    if (versao.status !== "APROVADO" && !workspaceMeta.dossie_aprovado_em) {
      throw new BusinessRuleError("A versão atual deve estar aprovada antes da publicação.");
    }

    const { data: reportPublicado, error: reportError } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .update({ delivered_at: now, emitted_at: workspaceMeta.dossie_aprovado_em ?? now })
      .eq("id", dossieId)
      .select("*")
      .single();

    if (reportError) {
      throw new BusinessRuleError(reportError.message);
    }

    const { error: casoError } = await supabase
      .schema("curadoria")
      .from("cases")
      .update({ status: "DELIVERED" })
      .eq("id", dossie.case_id);

    if (casoError) {
      throw new BusinessRuleError(casoError.message);
    }

    await this.saveWorkspaceMeta(caso.journey_id, {
      dossie_versao_status: "PUBLICADO",
    });

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DOSSIE_PUBLICADO,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { dossie_id: dossieId, versao_id: versao.id },
    });

    const { data: existingDevolutiva } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .select("id")
      .eq("case_id", dossie.case_id)
      .maybeSingle();

    if (!existingDevolutiva) {
      const { error: devolutivaError } = await supabase
        .schema("curadoria")
        .from("devolutiva_records")
        .insert({
          id: randomUUID(),
          case_id: dossie.case_id,
          report_id: dossieId,
          presented_by: curadorId,
          patient_questions: [],
          observations: [],
          next_steps: [],
        });

      if (devolutivaError) {
        throw new BusinessRuleError(devolutivaError.message);
      }
    }

    const reportRow = reportPublicado as ReportRow;
    const versaoPublicada = await this.buildDossieVersao(reportRow, {
      ...workspaceMeta,
      dossie_versao_status: "PUBLICADO",
    });

    return {
      id: reportRow.id,
      caso_id: dossie.case_id,
      journey_id: caso.journey_id,
      status: "PUBLICADO",
      versao_atual: workspaceMeta.dossie_versao_atual ?? 1,
      curador_id: curadorId,
      publicado_em: reportRow.delivered_at,
      publicado_por: curadorId,
      criado_em: reportRow.created_at,
      atualizado_em: reportRow.updated_at,
      versao_publicada: versaoPublicada,
    };
  }

  async obterDossiePublicadoParaPaciente(
    journeyId: string,
    patientId: string,
  ): Promise<DossieView | null> {
    const bridge = await this.resolveJourneyBridge(journeyId);
    if (bridge.patientId !== patientId) {
      throw new BusinessRuleError("Paciente não autorizado para este dossiê.");
    }

    const casoId = await this.resolveCasoId(bridge);
    if (!casoId) {
      return null;
    }

    const supabase = createServiceRoleClient() ?? (await createClient());
    const { data: report, error } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .select("*")
      .eq("case_id", casoId)
      .not("delivered_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!report) {
      return null;
    }

    const workspaceMeta = await this.loadWorkspaceMeta(journeyId);
    const reportRow = report as ReportRow;
    const versao = await this.buildDossieVersao(reportRow, {
      ...workspaceMeta,
      dossie_versao_status: "PUBLICADO",
    });

    return {
      id: reportRow.id,
      caso_id: casoId,
      journey_id: journeyId,
      status: "PUBLICADO",
      versao_atual: workspaceMeta.dossie_versao_atual ?? 1,
      curador_id: "",
      publicado_em: reportRow.delivered_at,
      publicado_por: null,
      criado_em: reportRow.created_at,
      atualizado_em: reportRow.updated_at,
      versao_publicada: versao,
    };
  }

  async registrarVisualizacaoPaciente(
    dossieId: string,
    patientId: string,
    journeyId: string,
  ): Promise<void> {
    const bridge = await this.resolveJourneyBridge(journeyId);
    if (bridge.patientId !== patientId) {
      throw new BusinessRuleError("Paciente não autorizado.");
    }

    const dossie = await this.obterDossiePorId(dossieId);
    const casoId = await this.resolveCasoId(bridge);

    if (!casoId || casoId !== dossie.case_id) {
      throw new BusinessRuleError("Dossiê inválido para visualização.");
    }

    if (!dossie.delivered_at) {
      throw new BusinessRuleError("Apenas dossiês publicados podem ser visualizados.");
    }

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId,
      tipo: EventoCuradoriaTipo.DOSSIE_VISUALIZADO_PACIENTE,
      actorId: bridge.patientProfileId,
      actorRole: "PATIENT",
      metadata: { dossie_id: dossieId },
    });
  }

  async registrarDevolutiva(
    dossieId: string,
    data: string | null,
    dossieApresentado: boolean,
    duvidas: string[],
  ): Promise<DevolutivaView> {
    const supabase = await createClient();
    const dossie = await this.obterDossiePorId(dossieId);
    const caso = await this.obterCasoPorId(dossie.case_id);

    const { data: report, error: reportError } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .select("delivered_at")
      .eq("id", dossieId)
      .maybeSingle();

    if (reportError) {
      throw new BusinessRuleError(reportError.message);
    }
    if (!report?.delivered_at) {
      throw new BusinessRuleError("Dossiê deve estar publicado para registrar devolutiva.");
    }

    const presentedAt = dossieApresentado ? data ?? new Date().toISOString() : null;

    const { data: existing } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .select("id")
      .eq("report_id", dossieId)
      .maybeSingle();

    const devolutivaId = (existing?.id as string | undefined) ?? randomUUID();

    const { data: devolutiva, error } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .upsert(
        {
          id: devolutivaId,
          case_id: dossie.case_id,
          report_id: dossieId,
          presented_by: caso.curador_id ?? caso.patient_id,
          presented_at: presentedAt,
          patient_questions: duvidas,
          observations: [],
          next_steps: [],
        },
        { onConflict: "report_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DEVOLUTIVA_REGISTRADA,
      actorRole: "STAFF",
      metadata: { dossie_id: dossieId, devolutiva_id: devolutivaId },
    });

    return this.mapDevolutiva(devolutiva as DevolutivaRecordRow, caso.journey_id);
  }

  async concluirDevolutiva(devolutivaId: string, curadorId: string): Promise<DevolutivaView> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: devolutiva, error } = await supabase
      .schema("curadoria")
      .from("devolutiva_records")
      .update({
        presented_by: curadorId,
        presented_at: now,
        next_steps: ["Devolutiva concluída pelo curador."],
      })
      .eq("id", devolutivaId)
      .select("*")
      .single();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const devolutivaRow = devolutiva as DevolutivaRecordRow;
    const dossie = await this.obterDossiePorId(devolutivaRow.report_id);
    const caso = await this.obterCasoPorId(dossie.case_id);

    await appendEventoCuradoria({
      casoId: dossie.case_id,
      journeyId: caso.journey_id,
      tipo: EventoCuradoriaTipo.DEVOLUTIVA_CONCLUIDA,
      actorId: curadorId,
      actorRole: "STAFF",
      metadata: { devolutiva_id: devolutivaId },
    });

    return this.mapDevolutiva(devolutivaRow, caso.journey_id);
  }

  async registrarEscolha(
    journeyId: string,
    patientId: string,
    dossieId: string,
    versaoId: string,
    opcaoIndice: number,
    proximosPassos: string,
    observacao: string | null,
  ): Promise<EscolhaCuradoriaView> {
    if (opcaoIndice < 0 || opcaoIndice > 2) {
      throw new BusinessRuleError("Índice de opção inválido.");
    }

    const bridge = await this.resolveJourneyBridge(journeyId);
    if (bridge.patientId !== patientId) {
      throw new BusinessRuleError("Paciente não autorizado.");
    }

    const dossieRow = await this.obterDossiePorId(dossieId);

    const adminSupabase = createServiceRoleClient();
    if (!adminSupabase) {
      throw new BusinessRuleError("Service role não configurado para registrar escolha.");
    }

    const { data: caseRow, error: caseReadError } = await adminSupabase
      .schema("curadoria")
      .from("cases")
      .select("patient_profile_id")
      .eq("id", dossieRow.case_id)
      .maybeSingle();

    if (caseReadError) {
      throw new BusinessRuleError(caseReadError.message);
    }

    if (!caseRow || caseRow.patient_profile_id !== bridge.patientProfileId) {
      throw new BusinessRuleError("Dossiê inválido para registro de escolha.");
    }

    if (dossieId !== versaoId) {
      throw new BusinessRuleError("Versão do dossiê inválida para escolha.");
    }

    if (!dossieRow.delivered_at) {
      throw new BusinessRuleError("Dossiê inválido para registro de escolha.");
    }

    const { data: chosenOption, error: optionError } = await adminSupabase
      .schema("curadoria")
      .from("curated_selection_options")
      .select("id, professional_profile_id")
      .eq("curated_selection_id", dossieRow.curated_selection_id)
      .eq("position", opcaoIndice + 1)
      .maybeSingle();

    if (optionError) {
      throw new BusinessRuleError(optionError.message);
    }
    if (!chosenOption) {
      throw new NotFoundError("Opção do dossiê");
    }

    const professionals = await this.loadProfessionalProfiles([
      chosenOption.professional_profile_id as string,
    ]);
    const professional = professionals.get(chosenOption.professional_profile_id as string);

    const escolhaId = randomUUID();
    const decidedAt = new Date().toISOString();

    const { data: escolha, error } = await adminSupabase
      .schema("curadoria")
      .from("patient_curadoria_decisions")
      .insert({
        id: escolhaId,
        case_id: dossieRow.case_id,
        curated_selection_id: dossieRow.curated_selection_id,
        chosen_option_id: chosenOption.id,
        outcome: "CHOSEN",
        note: observacao,
        decided_at: decidedAt,
      })
      .select("*")
      .single();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    if (proximosPassos.trim()) {
      await adminSupabase
        .schema("curadoria")
        .from("devolutiva_records")
        .update({ next_steps: proximosPassos.split("\n").filter(Boolean) })
        .eq("case_id", dossieRow.case_id);
    }

    const { error: casoError } = await adminSupabase
      .schema("curadoria")
      .from("cases")
      .update({ status: "CLOSED" })
      .eq("id", dossieRow.case_id);

    if (casoError) {
      throw new BusinessRuleError(casoError.message);
    }

    await appendEventoCuradoria({
      casoId: dossieRow.case_id,
      journeyId,
      tipo: EventoCuradoriaTipo.ESCOLHA_REGISTRADA,
      actorId: bridge.patientProfileId,
      actorRole: "PATIENT",
      metadata: {
        dossie_id: dossieId,
        versao_id: versaoId,
        opcao_indice: opcaoIndice,
        escolha_id: escolhaId,
      },
    });

    if (proximosPassos.trim()) {
      await appendEventoCuradoria({
        casoId: dossieRow.case_id,
        journeyId,
        tipo: EventoCuradoriaTipo.PROXIMOS_PASSOS,
        actorId: bridge.patientProfileId,
        actorRole: "PATIENT",
        metadata: { escolha_id: escolhaId, proximos_passos: proximosPassos },
      });
    }

    return {
      id: escolha.id as string,
      journey_id: journeyId,
      patient_id: patientId,
      dossie_id: dossieId,
      dossie_versao_id: versaoId,
      opcao_indice: opcaoIndice,
      profissional_nome: professional?.display_name ?? "",
      profissional_especialidade: professional?.especialidade ?? "",
      proximos_passos: proximosPassos,
      observacao_paciente: observacao,
      registrada_em: decidedAt,
    };
  }

  private mapDevolutiva(row: DevolutivaRecordRow, journeyId: string): DevolutivaView {
    const concluida = Boolean(row.presented_at && row.next_steps.length > 0);
    return {
      id: row.id,
      dossie_id: row.report_id,
      journey_id: journeyId,
      data_devolutiva: row.presented_at,
      dossie_apresentado: Boolean(row.presented_at),
      duvidas_relevantes: row.patient_questions ?? [],
      concluida,
      concluida_por: concluida ? row.presented_by : null,
      concluida_em: concluida ? row.presented_at : null,
      criado_em: row.created_at,
      atualizado_em: row.updated_at,
    };
  }

  private async obterCasoPorId(casoId: string): Promise<CasoCuradoriaView> {
    const supabase = await createClient();
    const { data: workspaces, error } = await supabase
      .from("curator_case_workspaces")
      .select("journey_id, workspace_data")
      .contains("workspace_data", { curadoria_case_id: casoId })
      .limit(1);

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const journeyId = workspaces?.[0]?.journey_id as string | undefined;
    if (journeyId) {
      const view = await this.obterCasoPorJornada(journeyId);
      if (view) {
        return view;
      }
    }

    const { data: caseRow, error: caseError } = await supabase
      .schema("curadoria")
      .from("cases")
      .select("patient_profile_id")
      .eq("id", casoId)
      .maybeSingle();

    if (caseError) {
      throw new BusinessRuleError(caseError.message);
    }
    if (!caseRow) {
      throw new NotFoundError("Caso de curadoria");
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("auth_user_id", caseRow.patient_profile_id)
      .maybeSingle();

    if (patientError) {
      throw new BusinessRuleError(patientError.message);
    }

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id")
      .eq("patient_id", patient?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (journeyError) {
      throw new BusinessRuleError(journeyError.message);
    }
    if (!journey) {
      throw new NotFoundError("Caso de curadoria");
    }

    const view = await this.obterCasoPorJornada(journey.id as string);
    if (!view) {
      throw new NotFoundError("Caso de curadoria");
    }
    return view;
  }

  private async obterDossiePorId(dossieId: string): Promise<ReportRow> {
    const supabase = createServiceRoleClient() ?? (await createClient());

    const { data: dossie, error } = await supabase
      .schema("curadoria")
      .from("curadoria_reports")
      .select("*")
      .eq("id", dossieId)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    if (!dossie) {
      throw new NotFoundError("Dossiê");
    }

    return dossie as ReportRow;
  }

  private async carregarVersaoPorId(
    versaoId: string,
    journeyId: string,
  ): Promise<DossieVersaoView | null> {
    const report = await this.obterDossiePorId(versaoId);
    const workspaceMeta = await this.loadWorkspaceMeta(journeyId);
    return this.buildDossieVersao(report, workspaceMeta);
  }

  private async carregarVersaoPorIdSemJornada(versaoId: string): Promise<DossieVersaoView | null> {
    const report = await this.obterDossiePorId(versaoId);
    const caso = await this.obterCasoPorId(report.case_id);
    return this.carregarVersaoPorId(versaoId, caso.journey_id);
  }

  async obterVersaoCorrenteDossie(journeyId: string): Promise<DossieVersaoView | null> {
    const caso = await this.obterCasoPorJornada(journeyId);
    if (!caso?.dossie) {
      return null;
    }

    if (caso.dossie.status === "PUBLICADO" && caso.dossie.versao_publicada) {
      return caso.dossie.versao_publicada;
    }

    return this.carregarVersaoPorId(caso.dossie.id, journeyId);
  }
}
