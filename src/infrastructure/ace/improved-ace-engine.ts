import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  ACE_MELHORADO_VERSION,
  type AceInputPayload,
  type AceStructuredResult,
  type AceTriggerSource,
} from "@/ace-flow/contracts/ace-analysis";

export interface ImprovedAceEngineInput {
  view: JornadaDoPacienteView;
  observacoesStaff?: string | null;
  contextoStaff?: string | null;
  trigger: AceTriggerSource;
}

export function buildAceInputPayload(input: ImprovedAceEngineInput): AceInputPayload {
  return {
    etapa_atual: input.view.etapa_atual,
    documentos_count: input.view.extensoes.documentos.length,
    observacoes_staff: input.observacoesStaff ?? null,
    contexto_staff: input.contextoStaff ?? null,
    trigger: input.trigger,
  };
}

export function executarAceMelhorado(input: ImprovedAceEngineInput): AceStructuredResult {
  const documentos = input.view.extensoes.documentos.map((doc) => ({
    id: doc.id,
    nome: doc.nome_arquivo,
    status: doc.status,
  }));

  const lacunas: string[] = [];
  const pontos: string[] = [];
  const proximos: string[] = [];

  if (documentos.length === 0) {
    lacunas.push("Nenhum documento recebido para análise operacional.");
    proximos.push("Aguardar envio de documentação pelo paciente.");
  }

  const pendentes = documentos.filter((d) => d.status === "RECEBIDO" || d.status === "EM_ANALISE");
  if (pendentes.length > 0) {
    pontos.push(`${pendentes.length} documento(s) aguardam revisão operacional.`);
  }

  if (input.view.bloqueio) {
    pontos.push(`Bloqueio ativo: ${input.view.bloqueio.motivo_humano}`);
    proximos.push("Resolver bloqueio antes de avançar a curadoria.");
  }

  if (input.observacoesStaff?.trim()) {
    pontos.push("Observações da equipe registradas para contexto do curador.");
  }

  const status =
    documentos.length === 0 ? "PARCIAL" : lacunas.length > 0 ? "PARCIAL" : "CONCLUIDO";

  const contextoOperacional = [
    `Etapa atual: ${input.view.etapa_atual}`,
    `Estado visível: ${input.view.estado_visivel}`,
    `Documentos na jornada: ${documentos.length}`,
    input.contextoStaff ? `Contexto da equipe: ${input.contextoStaff}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const resumo = [
    `Análise operacional ACE ${ACE_MELHORADO_VERSION} para apoio à curadoria.`,
    documentos.length
      ? `${documentos.length} documento(s) mapeado(s).`
      : "Aguardando documentação.",
    status === "PARCIAL"
      ? "Análise parcial — revisão humana necessária."
      : "Análise estruturada pronta para o curador.",
  ].join(" ");

  if (status === "CONCLUIDO") {
    proximos.push("Encaminhar para curadoria quando a equipe validar.");
  }

  return {
    versao: ACE_MELHORADO_VERSION,
    status,
    documentos_analisados: documentos,
    contexto_operacional: contextoOperacional,
    lacunas_informacao: lacunas,
    pontos_atencao_operacional: pontos,
    proximos_passos_sugeridos: proximos,
    resumo_para_curador: resumo,
  };
}
