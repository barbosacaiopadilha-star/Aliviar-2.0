import type {
  CuratorFeedbackView,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  OperationalIncidentEventView,
  OperationalIncidentView,
  PatientFeedbackView,
  QualityIndicatorsView,
  QualityPanelView,
} from "@/quality-flow/contracts/operational-quality";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalAudit } from "api/shared/observability/instrument-operation";

const MS_HORA = 60 * 60 * 1000;

function validateScore(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${field}_invalid`);
  }
}

export class QualityFeedbackService {
  async registrarFeedbackPaciente(
    patientId: string,
    input: {
      jornada_id: string;
      satisfacao_geral: number;
      clareza_informacoes: number;
      facilidade_uso: number;
      comentarios?: string | null;
    },
  ): Promise<PatientFeedbackView> {
    validateScore(input.satisfacao_geral, "satisfacao_geral");
    validateScore(input.clareza_informacoes, "clareza_informacoes");
    validateScore(input.facilidade_uso, "facilidade_uso");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("patient_journey_feedback")
      .insert({
        patient_id: patientId,
        journey_id: input.jornada_id,
        satisfacao_geral: input.satisfacao_geral,
        clareza_informacoes: input.clareza_informacoes,
        facilidade_uso: input.facilidade_uso,
        comentarios: input.comentarios ?? null,
      })
      .select("id, journey_id, satisfacao_geral, clareza_informacoes, facilidade_uso, comentarios, criado_em")
      .single();

    if (error || !data) throw new Error(error?.message ?? "feedback_create_failed");

    await recordOperationalAudit({
      eventType: "FEEDBACK_REGISTRADO",
      patientId,
      jornadaId: input.jornada_id,
      actorRole: "PATIENT",
      resultado: "SUCESSO",
      metadata: { tipo: "PACIENTE", feedback_id: data.id as string },
    });

    return {
      id: data.id as string,
      jornada_id: data.journey_id as string,
      satisfacao_geral: data.satisfacao_geral as number,
      clareza_informacoes: data.clareza_informacoes as number,
      facilidade_uso: data.facilidade_uso as number,
      comentarios: (data.comentarios as string) ?? null,
      criado_em: data.criado_em as string,
    };
  }

  async registrarFeedbackCurador(
    curatorId: string,
    input: {
      jornada_id: string;
      dificuldades?: string | null;
      informacoes_ausentes?: string | null;
      sugestoes?: string | null;
      problemas_operacionais?: string | null;
    },
  ): Promise<CuratorFeedbackView> {
    const hasContent =
      input.dificuldades?.trim() ||
      input.informacoes_ausentes?.trim() ||
      input.sugestoes?.trim() ||
      input.problemas_operacionais?.trim();

    if (!hasContent) {
      throw new Error("feedback_curador_vazio");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_journey_feedback")
      .insert({
        curator_id: curatorId,
        journey_id: input.jornada_id,
        dificuldades: input.dificuldades ?? null,
        informacoes_ausentes: input.informacoes_ausentes ?? null,
        sugestoes: input.sugestoes ?? null,
        problemas_operacionais: input.problemas_operacionais ?? null,
      })
      .select(
        "id, journey_id, dificuldades, informacoes_ausentes, sugestoes, problemas_operacionais, criado_em",
      )
      .single();

    if (error || !data) throw new Error(error?.message ?? "feedback_create_failed");

    await recordOperationalAudit({
      eventType: "FEEDBACK_REGISTRADO",
      curatorId,
      jornadaId: input.jornada_id,
      actorId: curatorId,
      actorRole: "STAFF",
      resultado: "SUCESSO",
      metadata: { tipo: "CURADOR", feedback_id: data.id as string },
    });

    return {
      id: data.id as string,
      jornada_id: data.journey_id as string,
      dificuldades: (data.dificuldades as string) ?? null,
      informacoes_ausentes: (data.informacoes_ausentes as string) ?? null,
      sugestoes: (data.sugestoes as string) ?? null,
      problemas_operacionais: (data.problemas_operacionais as string) ?? null,
      criado_em: data.criado_em as string,
    };
  }

  async listarFeedbackPacienteRecente(limit = 10): Promise<PatientFeedbackView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("patient_journey_feedback")
      .select("id, journey_id, satisfacao_geral, clareza_informacoes, facilidade_uso, comentarios, criado_em")
      .order("criado_em", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      jornada_id: row.journey_id as string,
      satisfacao_geral: row.satisfacao_geral as number,
      clareza_informacoes: row.clareza_informacoes as number,
      facilidade_uso: row.facilidade_uso as number,
      comentarios: (row.comentarios as string) ?? null,
      criado_em: row.criado_em as string,
    }));
  }

  async listarFeedbackCuradorRecente(limit = 10): Promise<CuratorFeedbackView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_journey_feedback")
      .select(
        "id, journey_id, dificuldades, informacoes_ausentes, sugestoes, problemas_operacionais, criado_em",
      )
      .order("criado_em", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      jornada_id: row.journey_id as string,
      dificuldades: (row.dificuldades as string) ?? null,
      informacoes_ausentes: (row.informacoes_ausentes as string) ?? null,
      sugestoes: (row.sugestoes as string) ?? null,
      problemas_operacionais: (row.problemas_operacionais as string) ?? null,
      criado_em: row.criado_em as string,
    }));
  }
}

export class QualityIncidentService {
  private async mapIncident(row: Record<string, unknown>): Promise<OperationalIncidentView> {
    const supabase = await createClient();
    let responsavelNome: string | null = null;
    const responsavelId = (row.responsavel_id as string) ?? null;

    if (responsavelId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", responsavelId)
        .maybeSingle();
      responsavelNome = (profile?.full_name as string) ?? null;
    }

    return {
      id: row.id as string,
      jornada_id: row.journey_id as string,
      categoria: row.categoria as IncidentCategory,
      severidade: row.severidade as IncidentSeverity,
      descricao: row.descricao as string,
      status: row.status as IncidentStatus,
      responsavel_id: responsavelId,
      responsavel_nome: responsavelNome,
      criado_em: row.criado_em as string,
      resolvido_em: (row.resolvido_em as string) ?? null,
    };
  }

  async criarIncidente(
    actorId: string,
    input: {
      jornada_id: string;
      categoria: IncidentCategory;
      severidade: IncidentSeverity;
      descricao: string;
      responsavel_id?: string | null;
    },
  ): Promise<OperationalIncidentView> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("operational_incidents")
      .insert({
        journey_id: input.jornada_id,
        categoria: input.categoria,
        severidade: input.severidade,
        descricao: input.descricao.trim(),
        status: "ABERTO",
        responsavel_id: input.responsavel_id ?? null,
        criado_por: actorId,
      })
      .select(
        "id, journey_id, categoria, severidade, descricao, status, responsavel_id, criado_em, resolvido_em",
      )
      .single();

    if (error || !data) throw new Error(error?.message ?? "incident_create_failed");

    await supabase.from("operational_incident_events").insert({
      incident_id: data.id,
      evento_tipo: "CRIADO",
      status: "ABERTO",
      responsavel_id: input.responsavel_id ?? null,
      descricao: input.descricao.trim(),
      actor_id: actorId,
    });

    await recordOperationalAudit({
      eventType: "INCIDENTE_CRIADO",
      actorId,
      actorRole: "STAFF",
      jornadaId: input.jornada_id,
      resultado: "SUCESSO",
      metadata: { incident_id: data.id as string, categoria: input.categoria },
    });

    return this.mapIncident(data as Record<string, unknown>);
  }

  async atualizarIncidente(
    actorId: string,
    incidentId: string,
    input: { status?: IncidentStatus; responsavel_id?: string | null; nota?: string },
  ): Promise<OperationalIncidentView> {
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("operational_incidents")
      .select("id, journey_id, status, responsavel_id, resolvido_em")
      .eq("id", incidentId)
      .single();

    if (!current) throw new Error("incident_not_found");

    const nextStatus = input.status ?? (current.status as IncidentStatus);
    const nextResponsavel =
      input.responsavel_id !== undefined ? input.responsavel_id : (current.responsavel_id as string | null);
    const resolvedAt =
      nextStatus === "RESOLVIDO" ? new Date().toISOString() : (current.resolvido_em as string | null);

    const { data, error } = await supabase
      .from("operational_incidents")
      .update({
        status: nextStatus,
        responsavel_id: nextResponsavel,
        resolvido_em: resolvedAt,
      })
      .eq("id", incidentId)
      .select(
        "id, journey_id, categoria, severidade, descricao, status, responsavel_id, criado_em, resolvido_em",
      )
      .single();

    if (error || !data) throw new Error(error?.message ?? "incident_update_failed");

    let eventoTipo: OperationalIncidentEventView["evento_tipo"] = "NOTA";
    if (input.status && input.status !== current.status) {
      eventoTipo = input.status === "RESOLVIDO" ? "RESOLVIDO" : "STATUS_ALTERADO";
    } else if (input.responsavel_id !== undefined) {
      eventoTipo = "RESPONSAVEL_ATRIBUIDO";
    }

    await supabase.from("operational_incident_events").insert({
      incident_id: incidentId,
      evento_tipo: eventoTipo,
      status: nextStatus,
      responsavel_id: nextResponsavel,
      descricao: input.nota ?? null,
      actor_id: actorId,
    });

    await recordOperationalAudit({
      eventType: nextStatus === "RESOLVIDO" ? "INCIDENTE_ENCERRADO" : "INCIDENTE_ATUALIZADO",
      actorId,
      actorRole: "STAFF",
      jornadaId: current.journey_id as string,
      resultado: "SUCESSO",
      metadata: { incident_id: incidentId, status: nextStatus },
    });

    return this.mapIncident(data as Record<string, unknown>);
  }

  async listarPorStatus(status: IncidentStatus, limit = 20): Promise<OperationalIncidentView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("operational_incidents")
      .select(
        "id, journey_id, categoria, severidade, descricao, status, responsavel_id, criado_em, resolvido_em",
      )
      .eq("status", status)
      .order("criado_em", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return Promise.all((data ?? []).map((row) => this.mapIncident(row as Record<string, unknown>)));
  }

  async listarEventos(incidentId: string): Promise<OperationalIncidentEventView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("operational_incident_events")
      .select("id, incident_id, evento_tipo, status, responsavel_id, descricao, ocorrido_em")
      .eq("incident_id", incidentId)
      .order("ocorrido_em", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      incident_id: row.incident_id as string,
      evento_tipo: row.evento_tipo as OperationalIncidentEventView["evento_tipo"],
      status: (row.status as IncidentStatus) ?? null,
      responsavel_id: (row.responsavel_id as string) ?? null,
      descricao: (row.descricao as string) ?? null,
      ocorrido_em: row.ocorrido_em as string,
    }));
  }
}

export function calcularIndicadoresQualidade(params: {
  incidentes: Array<{ categoria: IncidentCategory; criado_em: string; resolvido_em: string | null }>;
  feedbacks: Array<{ satisfacao_geral: number; clareza_informacoes: number; facilidade_uso: number }>;
  incidentesAbertos: number;
}): QualityIndicatorsView {
  const porCategoria = new Map<IncidentCategory, number>();
  let somaResolucaoHoras = 0;
  let resolvidos = 0;

  for (const incidente of params.incidentes) {
    porCategoria.set(incidente.categoria, (porCategoria.get(incidente.categoria) ?? 0) + 1);
    if (incidente.resolvido_em) {
      somaResolucaoHoras +=
        (new Date(incidente.resolvido_em).getTime() - new Date(incidente.criado_em).getTime()) / MS_HORA;
      resolvidos += 1;
    }
  }

  let somaSatisfacao = 0;
  for (const fb of params.feedbacks) {
    somaSatisfacao += (fb.satisfacao_geral + fb.clareza_informacoes + fb.facilidade_uso) / 3;
  }

  return {
    tempo_medio_resolucao_horas: resolvidos
      ? Math.round((somaResolucaoHoras / resolvidos) * 10) / 10
      : 0,
    incidentes_por_categoria: [...porCategoria.entries()].map(([categoria, total]) => ({
      categoria,
      total,
    })),
    satisfacao_media: params.feedbacks.length
      ? Math.round((somaSatisfacao / params.feedbacks.length) * 10) / 10
      : 0,
    feedback_pendente: params.incidentesAbertos,
    amostras_feedback: params.feedbacks.length,
    amostras_incidentes: params.incidentes.length,
    gerado_em: new Date().toISOString(),
  };
}

export class QualityPanelService {
  constructor(
    private readonly feedback = new QualityFeedbackService(),
    private readonly incidents = new QualityIncidentService(),
  ) {}

  async obterPainel(): Promise<QualityPanelView> {
    const [abertos, resolvidos, feedbackPaciente, feedbackCurador] = await Promise.all([
      this.incidents.listarPorStatus("ABERTO", 15),
      this.incidents.listarPorStatus("RESOLVIDO", 15),
      this.feedback.listarFeedbackPacienteRecente(10),
      this.feedback.listarFeedbackCuradorRecente(10),
    ]);

    const supabase = await createClient();
    const { data: categorias } = await supabase
      .from("operational_incidents")
      .select("categoria");

    const counts = new Map<IncidentCategory, number>();
    for (const row of categorias ?? []) {
      const cat = row.categoria as IncidentCategory;
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }

    const principais_categorias = [...counts.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    return {
      incidentes_abertos: abertos,
      incidentes_resolvidos: resolvidos,
      feedback_paciente_recente: feedbackPaciente,
      feedback_curador_recente: feedbackCurador,
      principais_categorias,
    };
  }

  async obterIndicadores(): Promise<QualityIndicatorsView> {
    const supabase = await createClient();
    const [{ data: incidentes }, { data: feedbacks }, abertos] = await Promise.all([
      supabase
        .from("operational_incidents")
        .select("categoria, criado_em, resolvido_em"),
      supabase
        .from("patient_journey_feedback")
        .select("satisfacao_geral, clareza_informacoes, facilidade_uso"),
      this.incidents.listarPorStatus("ABERTO", 1000),
    ]);

    return calcularIndicadoresQualidade({
      incidentes: (incidentes ?? []) as Array<{
        categoria: IncidentCategory;
        criado_em: string;
        resolvido_em: string | null;
      }>,
      feedbacks: (feedbacks ?? []) as Array<{
        satisfacao_geral: number;
        clareza_informacoes: number;
        facilidade_uso: number;
      }>,
      incidentesAbertos: abertos.length,
    });
  }
}

export const qualityFeedbackService = new QualityFeedbackService();
export const qualityIncidentService = new QualityIncidentService();
export const qualityPanelService = new QualityPanelService();
