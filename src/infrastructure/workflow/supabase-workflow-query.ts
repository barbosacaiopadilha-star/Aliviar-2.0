import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { EventoAtribuicaoAppend } from "@/workflow-flow/contracts/atribuicao-operacional";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { createClient } from "@/lib/supabase/server";
import {
  aplicarComandoAtribuicao,
  type AtribuicaoStorePort,
} from "@/infrastructure/workflow/atribuicao-store";
import type { ComandoAtribuicaoOperacional } from "@/workflow-flow/contracts/atribuicao-operacional";
import { readModelToView, viewToReadModel } from "@/infrastructure/jornada/jornada-view-projection";
import type { CasoOperacionalInput } from "@/infrastructure/workflow/derivar-filas-operacionais";

interface ViewRow {
  journey_id: string;
  patient_id: string;
  view_data: unknown;
  updated_at: string;
}

interface JourneyRow {
  id: string;
  patient_id: string;
  title: string;
  patient: { full_name: string; preferred_name: string | null } | null;
}

type JourneyRowRaw = Omit<JourneyRow, "patient"> & {
  patient?:
    | { full_name: string; preferred_name: string | null }
    | { full_name: string; preferred_name: string | null }[]
    | null;
};

interface WorkspaceRow {
  journey_id: string;
  curator_id: string | null;
}

interface AssignmentRow {
  id: string;
  journey_id: string;
  tipo: string;
  de_curador_id: string | null;
  para_curador_id: string | null;
  motivo: string | null;
  registrado_em: string;
  registrado_por: string;
}

function normalizeJourneyRow(raw: JourneyRowRaw): JourneyRow {
  const patient = Array.isArray(raw.patient) ? raw.patient[0] ?? null : raw.patient ?? null;
  return { id: raw.id, patient_id: raw.patient_id, title: raw.title, patient };
}

function mapAssignmentRow(row: AssignmentRow): EventoAtribuicaoAppend {
  return {
    id: row.id,
    jornada_id: row.journey_id,
    tipo: row.tipo as EventoAtribuicaoAppend["tipo"],
    de_curador_id: row.de_curador_id,
    para_curador_id: row.para_curador_id,
    motivo: row.motivo,
    registrado_em: row.registrado_em,
    registrado_por: row.registrado_por,
  };
}

export class SupabaseWorkflowQuery {
  async listarCasosOperacionais(): Promise<CasoOperacionalInput[]> {
    const supabase = await createClient();

    const { data: views, error } = await supabase
      .from("patient_journey_views")
      .select("journey_id, patient_id, view_data, updated_at");

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    if (!views?.length) {
      return [];
    }

    const journeyIds = views.map((v) => v.journey_id as string);

    const [{ data: journeys }, { data: workspaces }] = await Promise.all([
      supabase
        .from("journeys")
        .select("id, patient_id, title, patient:patients(full_name, preferred_name)")
        .in("id", journeyIds),
      supabase.from("curator_case_workspaces").select("journey_id, curator_id").in("journey_id", journeyIds),
    ]);

    const journeyMap = new Map(
      (journeys as JourneyRowRaw[] | null)?.map((j) => [j.id, normalizeJourneyRow(j)]) ?? [],
    );
    const workspaceMap = new Map(
      (workspaces as WorkspaceRow[] | null)?.map((w) => [w.journey_id, w.curator_id]) ?? [],
    );

    const casos: CasoOperacionalInput[] = [];

    for (const row of views as ViewRow[]) {
      const journey = journeyMap.get(row.journey_id);
      if (!journey) continue;

      const view = readModelToView(viewToReadModel(row.view_data as JornadaDoPacienteView));
      const pacienteNome =
        journey.patient?.preferred_name?.trim() ||
        journey.patient?.full_name ||
        "Paciente";

      casos.push({
        jornada_id: row.journey_id,
        paciente_id: row.patient_id,
        paciente_nome: pacienteNome,
        titulo_jornada: journey.title,
        view,
        curador_id: workspaceMap.get(row.journey_id) ?? null,
        curador_nome: null,
        atualizado_em: row.updated_at,
      });
    }

    return casos;
  }
}

export class SupabaseAtribuicaoStore implements AtribuicaoStorePort {
  async listarHistorico(jornadaId: string): Promise<EventoAtribuicaoAppend[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("operational_assignment_events")
      .select("*")
      .eq("journey_id", jornadaId)
      .order("registrado_em", { ascending: true });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return (data as AssignmentRow[] | null)?.map(mapAssignmentRow) ?? [];
  }

  async registrarEvento(
    evento: Omit<EventoAtribuicaoAppend, "id" | "registrado_em">,
  ): Promise<EventoAtribuicaoAppend> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("operational_assignment_events")
      .insert({
        journey_id: evento.jornada_id,
        tipo: evento.tipo,
        de_curador_id: evento.de_curador_id,
        para_curador_id: evento.para_curador_id,
        motivo: evento.motivo,
        registrado_por: evento.registrado_por,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new BusinessRuleError(error?.message ?? "Falha ao registrar atribuição.");
    }

    return mapAssignmentRow(data as AssignmentRow);
  }

  async obterAtribuicaoAtual(jornadaId: string): Promise<import("@/workflow-flow/contracts/atribuicao-operacional").AtribuicaoAtualView> {
    const historico = await this.listarHistorico(jornadaId);
    const ultimoEncerrar = [...historico].reverse().find((e) => e.tipo === "ENCERRAR");
    const encerrado = ultimoEncerrar !== undefined;

    let curadorId: string | null = null;
    let assumidoEm: string | null = null;

    if (!encerrado) {
      for (let i = historico.length - 1; i >= 0; i--) {
        const evt = historico[i]!;
        if (evt.tipo === "ASSUMIR" || evt.tipo === "TRANSFERIR") {
          curadorId = evt.para_curador_id;
          assumidoEm = evt.registrado_em;
          break;
        }
      }
    }

    return {
      jornada_id: jornadaId,
      curador_id: curadorId,
      assumido_em: assumidoEm,
      encerrado,
      historico,
    };
  }

  async executarComando(comando: ComandoAtribuicaoOperacional): Promise<EventoAtribuicaoAppend> {
    const evento = aplicarComandoAtribuicao(comando);
    return this.registrarEvento(evento);
  }
}
