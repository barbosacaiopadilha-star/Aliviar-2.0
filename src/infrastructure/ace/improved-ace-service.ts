import {
  ACE_MELHORADO_VERSION,
  type AceAnalysisRunView,
  type AceAnaliseCuradorView,
  type AceStructuredResult,
  type AceTriggerSource,
} from "@/ace-flow/contracts/ace-analysis";
import type { AnaliseRepositoryPort } from "@/application/ports/analise-repository-port";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  buildAceInputPayload,
  executarAceMelhorado,
  type ImprovedAceEngineInput,
} from "@/infrastructure/ace/improved-ace-engine";
import { avancarProjecaoAposAnaliseInicial } from "@/infrastructure/jornada/jornada-view-projection";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { readModelToView } from "@/infrastructure/jornada/jornada-view-projection";
import { createCorrelationId } from "@/infrastructure/observability/correlation-id";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalAudit } from "api/shared/observability/instrument-operation";

const jornadaProjection = new SupabaseJornadaProjection();

function mapRun(row: Record<string, unknown>): AceAnalysisRunView {
  const id = row.id as string;
  const result = row.result_payload as AceStructuredResult | null;
  return {
    id,
    execution_id: id,
    jornada_id: row.journey_id as string,
    ace_version: row.ace_version as string,
    status: row.status as AceAnalysisRunView["status"],
    duration_ms: row.duration_ms as number,
    correlation_id: row.correlation_id as string,
    retries: row.retries as number,
    triggered_by: row.triggered_by as AceTriggerSource,
    iniciado_em: row.iniciado_em as string,
    concluido_em: (row.concluido_em as string) ?? null,
    resultado: result,
  };
}

export function toAceAnaliseCuradorView(run: AceAnalysisRunView): AceAnaliseCuradorView | null {
  if (!run.resultado) return null;
  return {
    run_id: run.id,
    execution_id: run.execution_id,
    versao: run.ace_version,
    status: run.status,
    resumo_para_curador: run.resultado.resumo_para_curador,
    lacunas_informacao: run.resultado.lacunas_informacao,
    pontos_atencao_operacional: run.resultado.pontos_atencao_operacional,
    proximos_passos_sugeridos: run.resultado.proximos_passos_sugeridos,
    documentos_analisados: run.resultado.documentos_analisados,
    atualizado_em: run.concluido_em ?? run.iniciado_em,
  };
}

export class ImprovedAceService {
  async executarParaJornada(params: {
    jornadaId: string;
    trigger: AceTriggerSource;
    actorId?: string | null;
    observacoesStaff?: string | null;
    contextoStaff?: string | null;
    avancarProjecao?: boolean;
  }): Promise<AceAnalysisRunView> {
    const correlationId = createCorrelationId();
    const started = performance.now();
    const supabase = await createClient();

    const projecao = await jornadaProjection.obterPorId(params.jornadaId);
    if (!projecao) {
      throw new Error("jornada_not_found");
    }

    const view = readModelToView(projecao);
    const inputPayload = buildAceInputPayload({
      view,
      observacoesStaff: params.observacoesStaff,
      contextoStaff: params.contextoStaff,
      trigger: params.trigger,
    });

    const { data: runRow, error: insertError } = await supabase
      .from("ace_analysis_runs")
      .insert({
        journey_id: params.jornadaId,
        patient_id: view.paciente_id,
        ace_version: ACE_MELHORADO_VERSION,
        input_payload: inputPayload,
        status: "INICIADO",
        correlation_id: correlationId,
        triggered_by: params.trigger,
        actor_id: params.actorId ?? null,
      })
      .select("id")
      .single();

    if (insertError || !runRow) {
      throw new Error(insertError?.message ?? "ace_run_create_failed");
    }

    await recordOperationalAudit({
      eventType: "ACE_ANALISE_INICIO",
      correlationId,
      jornadaId: params.jornadaId,
      patientId: view.paciente_id,
      actorId: params.actorId ?? null,
      actorRole: params.actorId ? "STAFF" : "SYSTEM",
      resultado: "SUCESSO",
      metadata: { trigger: params.trigger, ace_version: ACE_MELHORADO_VERSION },
    });

    let resultado: AceStructuredResult;
    let status: AceAnalysisRunView["status"] = "CONCLUIDO";

    try {
      resultado = executarAceMelhorado({
        view,
        observacoesStaff: params.observacoesStaff,
        contextoStaff: params.contextoStaff,
        trigger: params.trigger,
      });
      status = resultado.status;
    } catch {
      status = "FALHA";
      resultado = {
        versao: ACE_MELHORADO_VERSION,
        status: "FALHA",
        documentos_analisados: [],
        contexto_operacional: "Falha na análise operacional.",
        lacunas_informacao: ["Análise não concluída."],
        pontos_atencao_operacional: [],
        proximos_passos_sugeridos: ["Reexecutar análise ACE."],
        resumo_para_curador: "Análise ACE falhou — revisão manual necessária.",
      };
    }

    const durationMs = Math.round(performance.now() - started);
    const concluidoEm = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("ace_analysis_runs")
      .update({
        result_payload: resultado,
        status,
        duration_ms: durationMs,
        concluido_em: concluidoEm,
      })
      .eq("id", runRow.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "ace_run_update_failed");
    }

    await recordOperationalAudit({
      eventType: "ACE_ANALISE_FIM",
      correlationId,
      jornadaId: params.jornadaId,
      patientId: view.paciente_id,
      actorId: params.actorId ?? null,
      actorRole: params.actorId ? "STAFF" : "SYSTEM",
      resultado: status === "FALHA" ? "FALHA" : "SUCESSO",
      durationMs,
      metadata: {
        trigger: params.trigger,
        ace_version: ACE_MELHORADO_VERSION,
        execution_id: runRow.id as string,
        status,
        duration_ms: durationMs,
      },
    });

    if (params.avancarProjecao !== false && status !== "FALHA") {
      const atualizada = avancarProjecaoAposAnaliseInicial(projecao, concluidoEm);
      await jornadaProjection.salvar({
        ...atualizada,
        extensoes: {
          ...atualizada.extensoes,
          ace_analise: {
            run_id: runRow.id as string,
            versao: resultado.versao,
            status: resultado.status,
            resumo: resultado.resumo_para_curador,
            atualizado_em: concluidoEm,
          },
        },
      });
    } else {
      const projecaoAtual = await jornadaProjection.obterPorId(params.jornadaId);
      if (projecaoAtual) {
        await jornadaProjection.salvar({
          ...projecaoAtual,
          extensoes: {
            ...projecaoAtual.extensoes,
            ace_analise: {
              run_id: runRow.id as string,
              versao: resultado.versao,
              status: resultado.status,
              resumo: resultado.resumo_para_curador,
              atualizado_em: concluidoEm,
            },
          },
          atualizadaEm: concluidoEm,
        });
      }
    }

    return mapRun(updated as Record<string, unknown>);
  }

  async obterUltimaAnalise(jornadaId: string): Promise<AceAnalysisRunView | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ace_analysis_runs")
      .select("*")
      .eq("journey_id", jornadaId)
      .order("iniciado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return mapRun(data as Record<string, unknown>);
  }

  async obterAnaliseParaCurador(jornadaId: string): Promise<AceAnaliseCuradorView | null> {
    const run = await this.obterUltimaAnalise(jornadaId);
    if (!run) return null;
    return toAceAnaliseCuradorView(run);
  }

  async obterStatusParaExperience(view: JornadaDoPacienteView): Promise<{
    ace_disponivel: boolean;
    mensagem: string | null;
  }> {
    const run = await this.obterUltimaAnalise(view.jornada_id);
    if (!run || run.status === "FALHA") {
      return { ace_disponivel: false, mensagem: null };
    }

    if (view.etapa_atual === "HISTORIA") {
      return {
        ace_disponivel: run.status === "CONCLUIDO" || run.status === "PARCIAL",
        mensagem: "Sua documentação está sendo analisada pela equipe.",
      };
    }

    if (view.etapa_atual === "ACE" || view.etapa_atual === "CURADORIA") {
      return {
        ace_disponivel: true,
        mensagem: "A ACE está acompanhando sua jornada.",
      };
    }

    return { ace_disponivel: true, mensagem: view.proximo_passo?.descricao ?? null };
  }
}

export const improvedAceService = new ImprovedAceService();

/** Adapter canônico — única entrada de análise via ACE Melhorado. */
export const improvedAceAnaliseAdapter: AnaliseRepositoryPort = {
  async executarAnaliseInicial(input, executadaPor) {
    const run = await improvedAceService.executarParaJornada({
      jornadaId: input.jornadaId,
      trigger: "STAFF",
      actorId: executadaPor,
      observacoesStaff: input.observacoes,
      contextoStaff: input.contexto ?? null,
      avancarProjecao: true,
    });

    return {
      analiseId: run.id,
      executionId: run.execution_id,
      jornadaId: input.jornadaId,
      observacoes: input.observacoes,
      contexto: input.contexto ?? null,
      executadaEm: run.concluido_em ?? run.iniciado_em,
      executadaPor,
      aceVersion: run.ace_version,
      correlationId: run.correlation_id,
      status: run.status,
      durationMs: run.duration_ms,
    };
  },
};
