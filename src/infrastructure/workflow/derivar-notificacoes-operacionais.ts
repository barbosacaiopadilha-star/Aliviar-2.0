import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type {
  NotificacaoOperacionalContrato,
  NotificacoesPendentesView,
} from "@/workflow-flow/contracts/notificacoes-operacionais";
import { derivarFaseWorkflow } from "@/infrastructure/workflow/derivar-fase-workflow";

export function derivarNotificacoesCaso(params: {
  jornada_id: string;
  paciente_nome: string;
  view: JornadaDoPacienteView;
  curador_atribuido: boolean;
  entrega_publicada: boolean;
}): NotificacaoOperacionalContrato[] {
  const notificacoes: NotificacaoOperacionalContrato[] = [];
  const fase = derivarFaseWorkflow(params.view);
  const ref = params.view.atualizada_em;

  if (params.view.bloqueio && params.view.responsavel.tipo === "PACIENTE") {
    notificacoes.push({
      tipo: "PACIENTE_AGUARDANDO",
      jornada_id: params.jornada_id,
      destinatario: "PACIENTE",
      titulo: "Ação necessária",
      mensagem: params.view.bloqueio.motivo_humano,
      referencia_em: ref,
      metadados: { paciente: params.paciente_nome, etapa: params.view.etapa_atual },
    });
  }

  if (fase === "CURADOR_ATIVO" && !params.curador_atribuido) {
    notificacoes.push({
      tipo: "CURADOR_PRECISA_AGIR",
      jornada_id: params.jornada_id,
      destinatario: "CURADOR",
      titulo: "Caso aguardando curador",
      mensagem: `Caso de ${params.paciente_nome} pronto para curadoria.`,
      referencia_em: ref,
      metadados: { paciente: params.paciente_nome },
    });
  }

  const docsRecentes = params.view.extensoes.documentos.filter(
    (d) => d.status === "RECEBIDO" || d.status === "EM_ANALISE",
  );
  if (docsRecentes.length > 0 && params.view.etapa_atual === "HISTORIA") {
    const ultimo = docsRecentes[docsRecentes.length - 1]!;
    notificacoes.push({
      tipo: "DOCUMENTO_RECEBIDO",
      jornada_id: params.jornada_id,
      destinatario: "OPERACAO",
      titulo: "Documento recebido",
      mensagem: `${ultimo.nome_arquivo} aguarda análise.`,
      referencia_em: ultimo.recebido_em,
      metadados: { documento_id: ultimo.id, status: ultimo.status },
    });
  }

  if (
    params.entrega_publicada &&
    (params.view.etapa_atual === "ENTREGA" || params.view.extensoes.entrega !== null)
  ) {
    notificacoes.push({
      tipo: "ENTREGA_PRONTA",
      jornada_id: params.jornada_id,
      destinatario: "PACIENTE",
      titulo: "Entrega disponível",
      mensagem: `A entrega de curadoria de ${params.paciente_nome} está pronta para leitura.`,
      referencia_em: ref,
      metadados: { paciente: params.paciente_nome },
    });
  }

  return notificacoes;
}

export function derivarNotificacoesPendentes(
  casos: Array<{
    jornada_id: string;
    paciente_nome: string;
    view: JornadaDoPacienteView;
    curador_atribuido: boolean;
    entrega_publicada: boolean;
  }>,
): NotificacoesPendentesView {
  const notificacoes = casos.flatMap((c) =>
    derivarNotificacoesCaso({
      jornada_id: c.jornada_id,
      paciente_nome: c.paciente_nome,
      view: c.view,
      curador_atribuido: c.curador_atribuido,
      entrega_publicada: c.entrega_publicada,
    }),
  );

  return { notificacoes };
}
