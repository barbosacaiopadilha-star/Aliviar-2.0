import type {
  CasoDeCuradoriaView,
  ComentarioOperacionalView,
  ConjuntoElegivelView,
  CuratorWorkspaceData,
  FilaCasoItemView,
  OpcaoRegistradaView,
  TimelineOperacionalItemView,
} from "@/curator-flow/contracts/curador-view";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import {
  derivarEstadoOperacionalCurador,
  prioridadeOrdemEstado,
} from "@/infrastructure/curador/curador-estado-operacional";
import {
  anexarComentario,
  atualizarConjuntoElegivel,
  entregaEstaAprovada,
  normalizarWorkspace,
  opcoesEstaoCompletas,
  registrarOpcoes,
  WORKSPACE_VAZIO,
} from "@/infrastructure/curador/curador-workspace";
import { readModelToView, viewToReadModel } from "@/infrastructure/jornada/jornada-view-projection";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

interface WorkspaceRow {
  journey_id: string;
  curator_id: string | null;
  assumed_at: string | null;
  workspace_data: unknown;
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

function normalizeJourneyRow(raw: JourneyRowRaw): JourneyRow {
  const patient = Array.isArray(raw.patient) ? raw.patient[0] ?? null : raw.patient ?? null;
  return { id: raw.id, patient_id: raw.patient_id, title: raw.title, patient };
}

interface ProfileRow {
  id: string;
  full_name: string;
}

export class SupabaseCuradorQuery {
  async listarFila(): Promise<FilaCasoItemView[]> {
    const supabase = await createClient();

    const { data: views, error } = await supabase
      .from("patient_journey_views")
      .select("journey_id, patient_id, view_data, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const journeyIds = (views ?? []).map((v) => v.journey_id as string);
    if (journeyIds.length === 0) {
      return [];
    }

    const [{ data: journeys }, { data: workspaces }, { data: profiles }] = await Promise.all([
      supabase
        .from("journeys")
        .select("id, patient_id, title, patient:patients(full_name, preferred_name)")
        .in("id", journeyIds),
      supabase.from("curator_case_workspaces").select("*").in("journey_id", journeyIds),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const journeyMap = new Map(
      (journeys as JourneyRowRaw[] | null)?.map((j) => [j.id, normalizeJourneyRow(j)]) ?? [],
    );
    const workspaceMap = new Map(
      (workspaces as WorkspaceRow[] | null)?.map((w) => [w.journey_id, w]) ?? [],
    );
    const profileMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);

    const fila: FilaCasoItemView[] = [];

    for (const row of views ?? []) {
      const view = readModelToView(
        viewToReadModel(row.view_data as JornadaDoPacienteView),
      );
      const journey = journeyMap.get(row.journey_id as string);
      if (!journey) continue;

      const ws = workspaceMap.get(row.journey_id as string);
      const workspace = normalizarWorkspace(ws?.workspace_data);
      const estado = derivarEstadoOperacionalCurador(
        view,
        opcoesEstaoCompletas(workspace.opcoes_registradas),
        entregaEstaAprovada(workspace.rascunho_entrega),
      );

      const curadorId = ws?.curator_id ?? null;
      const curador = curadorId ? profileMap.get(curadorId) : null;
      const pacienteNome =
        journey.patient?.preferred_name?.trim() ||
        journey.patient?.full_name ||
        "Paciente";

      fila.push({
        jornada_id: row.journey_id as string,
        paciente_id: row.patient_id as string,
        paciente_nome: pacienteNome,
        titulo_jornada: journey.title,
        estado_operacional: estado,
        etapa_atual: view.etapa_atual,
        curador_id: curadorId,
        curador_nome: curador?.full_name ?? null,
        atualizado_em: row.updated_at as string,
        prioridade_ordem: prioridadeOrdemEstado(estado),
      });
    }

    return fila.sort((a, b) => {
      if (a.prioridade_ordem !== b.prioridade_ordem) {
        return a.prioridade_ordem - b.prioridade_ordem;
      }
      return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime();
    });
  }

  async obterCaso(jornadaId: string): Promise<CasoDeCuradoriaView | null> {
    const supabase = await createClient();

    const { data: viewRow, error: viewError } = await supabase
      .from("patient_journey_views")
      .select("journey_id, patient_id, view_data, updated_at")
      .eq("journey_id", jornadaId)
      .maybeSingle();

    if (viewError) {
      throw new BusinessRuleError(viewError.message);
    }
    if (!viewRow?.view_data) {
      return null;
    }

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, patient_id, title, patient:patients(full_name, preferred_name)")
      .eq("id", jornadaId)
      .maybeSingle();

    if (journeyError || !journey) {
      return null;
    }

    const workspaceRow = await this.obterWorkspaceRow(jornadaId);
    const workspace = normalizarWorkspace(workspaceRow?.workspace_data);

    const jornadaView = readModelToView(
      viewToReadModel(viewRow.view_data as JornadaDoPacienteView),
    );

    let curadorNome: string | null = null;
    if (workspaceRow?.curator_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", workspaceRow.curator_id)
        .maybeSingle();
      curadorNome = (profile as ProfileRow | null)?.full_name ?? null;
    }

    const { data: events } = await supabase
      .from("journey_events")
      .select("id, title, description, occurred_at, category, created_by")
      .eq("journey_id", jornadaId)
      .order("occurred_at", { ascending: true });

    const timelineOperacional: TimelineOperacionalItemView[] = [
      ...(events ?? []).map((event) => ({
        id: event.id as string,
        tipo: "EVENTO" as const,
        titulo: event.title as string,
        descricao: (event.description as string) ?? "",
        responsavel: null,
        ocorrido_em: event.occurred_at as string,
      })),
      ...workspace.comentarios.map((c) => ({
        id: c.id,
        tipo: "COMENTARIO" as const,
        titulo: `Comentário — ${c.autor_nome}`,
        descricao: c.conteudo,
        responsavel: null,
        ocorrido_em: c.criado_em,
      })),
    ].sort(
      (a, b) => new Date(a.ocorrido_em).getTime() - new Date(b.ocorrido_em).getTime(),
    );

    const journeyData = normalizeJourneyRow(journey as JourneyRowRaw);
    const pacienteNome =
      journeyData.patient?.preferred_name?.trim() ||
      journeyData.patient?.full_name ||
      "Paciente";

    return {
      jornada_id: jornadaId,
      paciente_id: viewRow.patient_id as string,
      paciente_nome: pacienteNome,
      titulo_jornada: journeyData.title,
      jornada: jornadaView,
      estado_operacional: derivarEstadoOperacionalCurador(
        jornadaView,
        opcoesEstaoCompletas(workspace.opcoes_registradas),
        entregaEstaAprovada(workspace.rascunho_entrega),
      ),
      curador_id: workspaceRow?.curator_id ?? null,
      curador_nome: curadorNome,
      assumido_em: workspaceRow?.assumed_at ?? null,
      sessao: workspace.sessao,
      conjunto_elegivel: workspace.conjunto_elegivel,
      opcoes_registradas: workspace.opcoes_registradas,
      rascunho_entrega: workspace.rascunho_entrega,
      documentos: jornadaView.extensoes.documentos,
      bloqueio: jornadaView.bloqueio,
      responsavel: jornadaView.responsavel,
      timeline_jornada: jornadaView.timeline,
      timeline_operacional: timelineOperacional,
      comentarios: workspace.comentarios,
    };
  }

  async assumirCaso(jornadaId: string, curadorId: string): Promise<void> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from("curator_case_workspaces").upsert(
      {
        journey_id: jornadaId,
        curator_id: curadorId,
        assumed_at: now,
        workspace_data: WORKSPACE_VAZIO,
        updated_at: now,
      },
      { onConflict: "journey_id" },
    );

    if (error) {
      throw new BusinessRuleError(error.message);
    }
  }

  async salvarConjuntoElegivel(
    jornadaId: string,
    conjunto: ConjuntoElegivelView,
  ): Promise<CuratorWorkspaceData> {
    const workspace = await this.mutarWorkspace(jornadaId, (current) =>
      atualizarConjuntoElegivel(current, conjunto),
    );
    return workspace;
  }

  async salvarOpcoes(
    jornadaId: string,
    opcoes: OpcaoRegistradaView[],
  ): Promise<CuratorWorkspaceData> {
    if (opcoes.length !== 3) {
      throw new BusinessRuleError("Exatamente três opções devem ser registradas.");
    }
    return this.mutarWorkspace(jornadaId, (current) => registrarOpcoes(current, opcoes));
  }

  async adicionarComentario(
    jornadaId: string,
    comentario: ComentarioOperacionalView,
  ): Promise<CuratorWorkspaceData> {
    return this.mutarWorkspace(jornadaId, (current) => anexarComentario(current, comentario));
  }

  async aprovarEntrega(
    jornadaId: string,
    curadorId: string,
  ): Promise<CuratorWorkspaceData> {
    return this.mutarWorkspace(jornadaId, (current) => {
      if (!current.rascunho_entrega?.entrega) {
        throw new BusinessRuleError("Rascunho de entrega não encontrado.");
      }
      const now = new Date().toISOString();
      return {
        ...current,
        rascunho_entrega: {
          ...current.rascunho_entrega,
          modo: "APROVADO",
          aprovado_em: now,
          aprovado_por: curadorId,
          atualizado_em: now,
        },
      };
    });
  }

  async marcarEntregaPublicada(jornadaId: string): Promise<void> {
    await this.mutarWorkspace(jornadaId, (current) => {
      if (!current.rascunho_entrega) {
        throw new BusinessRuleError("Rascunho de entrega não encontrado.");
      }
      return {
        ...current,
        rascunho_entrega: {
          ...current.rascunho_entrega,
          modo: "PUBLICADO",
          atualizado_em: new Date().toISOString(),
        },
      };
    });
  }

  async obterWorkspaceData(jornadaId: string): Promise<CuratorWorkspaceData> {
    const row = await this.obterWorkspaceRow(jornadaId);
    return normalizarWorkspace(row?.workspace_data);
  }

  async atualizarWorkspaceData(
    jornadaId: string,
    workspace: CuratorWorkspaceData,
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("curator_case_workspaces")
      .update({ workspace_data: workspace, updated_at: new Date().toISOString() })
      .eq("journey_id", jornadaId);

    if (error) {
      throw new BusinessRuleError(error.message);
    }
  }

  private async obterWorkspaceRow(jornadaId: string): Promise<WorkspaceRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_case_workspaces")
      .select("*")
      .eq("journey_id", jornadaId)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }
    return (data as WorkspaceRow | null) ?? null;
  }

  private async mutarWorkspace(
    jornadaId: string,
    mutator: (workspace: CuratorWorkspaceData) => CuratorWorkspaceData,
  ): Promise<CuratorWorkspaceData> {
    const row = await this.obterWorkspaceRow(jornadaId);
    if (!row) {
      throw new NotFoundError("Workspace do curador");
    }

    const atual = normalizarWorkspace(row.workspace_data);
    const atualizado = mutator(atual);
    await this.atualizarWorkspaceData(jornadaId, atualizado);
    return atualizado;
  }

  criarComentario(params: {
    autorId: string;
    autorNome: string;
    conteudo: string;
  }): ComentarioOperacionalView {
    return {
      id: randomUUID(),
      autor_id: params.autorId,
      autor_nome: params.autorNome,
      conteudo: params.conteudo,
      criado_em: new Date().toISOString(),
    };
  }
}
