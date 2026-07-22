import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { JourneyNotificationDraft } from "@/notification-flow/contracts/journey-notification";

function etapaAnteriorEra(
  anterior: JornadaDoPacienteView | null,
  etapa: JornadaDoPacienteView["etapa_atual"],
): boolean {
  return anterior?.etapa_atual === etapa;
}

function etapaAtualE(
  atual: JornadaDoPacienteView,
  etapa: JornadaDoPacienteView["etapa_atual"],
): boolean {
  return atual.etapa_atual === etapa;
}

function estadoAnteriorEra(
  anterior: JornadaDoPacienteView | null,
  estado: JornadaDoPacienteView["estado_visivel"],
): boolean {
  return anterior?.estado_visivel === estado;
}

export function derivarNotificacoesDaJornada(params: {
  jornadaId: string;
  anterior: JornadaDoPacienteView | null;
  atual: JornadaDoPacienteView;
}): JourneyNotificationDraft[] {
  const { jornadaId, anterior, atual } = params;
  const drafts: JourneyNotificationDraft[] = [];
  const ref = atual.atualizada_em;

  const docsAnteriores = new Set((anterior?.extensoes.documentos ?? []).map((d) => d.id));
  for (const doc of atual.extensoes.documentos) {
    if (!docsAnteriores.has(doc.id) && (doc.status === "RECEBIDO" || doc.status === "EM_ANALISE")) {
      drafts.push({
        tipo: "DOCUMENTOS_RECEBIDOS",
        titulo: "Documento recebido",
        mensagem: `${doc.nome_arquivo} foi recebido e será analisado pela equipe.`,
        prioridade: "NORMAL",
        origem: "DOCUMENTO",
        referencia_tipo: "DOCUMENTO",
        referencia_id: doc.id,
        source_event_key: `${jornadaId}:DOCUMENTOS_RECEBIDOS:${doc.id}`,
        data: doc.recebido_em,
      });
    }
  }

  const bloqueioAtual = atual.bloqueio;
  const bloqueioAnterior = anterior?.bloqueio ?? null;
  const pacienteResponsavel = atual.responsavel.tipo === "PACIENTE";
  const docsPendentes =
    pacienteResponsavel &&
    bloqueioAtual &&
    (atual.estado_visivel === "AGUARDANDO_DOCUMENTOS" || atual.etapa_atual === "HISTORIA");

  if (docsPendentes && !bloqueioAnterior) {
    drafts.push({
      tipo: "DOCUMENTOS_PENDENTES",
      titulo: "Documentos pendentes",
      mensagem: bloqueioAtual.motivo_humano,
      prioridade: "ALTA",
      origem: "DOCUMENTO",
      referencia_tipo: "ETAPA",
      referencia_id: atual.etapa_atual,
      source_event_key: `${jornadaId}:DOCUMENTOS_PENDENTES:${bloqueioAtual.desde}`,
      data: bloqueioAtual.desde,
    });
  }

  if (
    etapaAtualE(atual, "CURADORIA") &&
    !etapaAnteriorEra(anterior, "CURADORIA") &&
    atual.estado_visivel === "EM_CURADORIA"
  ) {
    drafts.push({
      tipo: "CURADORIA_INICIADA",
      titulo: "Curadoria iniciada",
      mensagem: "Sua jornada entrou em curadoria. A equipe está analisando seu caso com cuidado.",
      prioridade: "NORMAL",
      origem: "JORNADA",
      referencia_tipo: "ETAPA",
      referencia_id: "CURADORIA",
      source_event_key: `${jornadaId}:CURADORIA_INICIADA:${ref}`,
      data: ref,
    });
  }

  if (
    etapaAnteriorEra(anterior, "CURADORIA") &&
    !etapaAtualE(atual, "CURADORIA") &&
    (atual.etapa_atual === "ENTREGA" || atual.etapa_atual === "ESCOLHA")
  ) {
    drafts.push({
      tipo: "CURADORIA_CONCLUIDA",
      titulo: "Curadoria concluída",
      mensagem: "A curadoria do seu caso foi concluída. Em breve você terá novidades.",
      prioridade: "NORMAL",
      origem: "JORNADA",
      referencia_tipo: "ETAPA",
      referencia_id: "CURADORIA",
      source_event_key: `${jornadaId}:CURADORIA_CONCLUIDA:${ref}`,
      data: ref,
    });
  }

  const entregaDisponivel =
    atual.estado_visivel === "ENTREGA_DISPONIVEL" ||
    (atual.extensoes.entrega !== null &&
      atual.etapa_atual === "ENTREGA" &&
      !estadoAnteriorEra(anterior, "ENTREGA_DISPONIVEL"));

  if (entregaDisponivel && atual.extensoes.entrega) {
    drafts.push({
      tipo: "ENTREGA_DISPONIVEL",
      titulo: "Entrega disponível",
      mensagem: "Sua entrega de curadoria está pronta para leitura.",
      prioridade: "ALTA",
      origem: "ENTREGA",
      referencia_tipo: "ENTREGA",
      referencia_id: atual.extensoes.entrega.entrega_id,
      source_event_key: `${jornadaId}:ENTREGA_DISPONIVEL:${atual.extensoes.entrega.entrega_id}`,
      data: ref,
    });
  }

  const escolhaAtual = atual.extensoes.escolha_registrada;
  const escolhaAnterior = anterior?.extensoes.escolha_registrada ?? null;
  if (escolhaAtual && !escolhaAnterior) {
    drafts.push({
      tipo: "ESCOLHA_REGISTRADA",
      titulo: "Escolha registrada",
      mensagem: `Sua escolha da opção ${escolhaAtual.opcao_indice + 1} foi registrada.`,
      prioridade: "NORMAL",
      origem: "ESCOLHA",
      referencia_tipo: "ESCOLHA",
      referencia_id: String(escolhaAtual.opcao_indice),
      source_event_key: `${jornadaId}:ESCOLHA_REGISTRADA:${escolhaAtual.registrada_em}`,
      data: escolhaAtual.registrada_em,
    });
  }

  if (
    etapaAtualE(atual, "ACOMPANHAMENTO") &&
    !etapaAnteriorEra(anterior, "ACOMPANHAMENTO") &&
    atual.estado_visivel === "EM_ACOMPANHAMENTO"
  ) {
    drafts.push({
      tipo: "ACOMPANHAMENTO_INICIADO",
      titulo: "Acompanhamento iniciado",
      mensagem: "Sua jornada entrou em acompanhamento com a ACE Aliviar.",
      prioridade: "NORMAL",
      origem: "ACOMPANHAMENTO",
      referencia_tipo: "ACOMPANHAMENTO",
      referencia_id: jornadaId,
      source_event_key: `${jornadaId}:ACOMPANHAMENTO_INICIADO:${ref}`,
      data: ref,
    });
  }

  return drafts;
}

export function integrarNotificacoesNaTimeline(
  timeline: import("@/experience-flow/contracts/jornada-view").TimelineItemView[],
  notificacoes: import("@/notification-flow/contracts/journey-notification").JourneyNotificationView[],
): Array<
  | import("@/experience-flow/contracts/jornada-view").TimelineItemView
  | import("@/notification-flow/contracts/journey-notification").NotificationTimelineItemView
> {
  const notificationItems: import("@/notification-flow/contracts/journey-notification").NotificationTimelineItemView[] =
    notificacoes.map((n) => ({
      id: `notif-${n.id}`,
      tipo: "NOTIFICACAO",
      titulo: n.titulo,
      descricao: n.mensagem,
      ocorrido_em: n.data,
      etapa: n.referencia_tipo === "ETAPA" ? n.referencia_id : null,
      visibilidade: "PUBLICO",
      notificacao_id: n.id,
      referencia_tipo: n.referencia_tipo,
      referencia_id: n.referencia_id,
      lida: n.lida,
    }));

  return [...timeline, ...notificationItems].sort(
    (a, b) => new Date(b.ocorrido_em).getTime() - new Date(a.ocorrido_em).getTime(),
  );
}

export function filtrarNotificacoes<T extends { tipo: string; lida: boolean; titulo: string; mensagem: string }>(
  items: T[],
  filter: { tipo?: string; lida?: boolean; q?: string },
): T[] {
  let result = items;

  if (filter.tipo) {
    result = result.filter((item) => item.tipo === filter.tipo);
  }

  if (filter.lida !== undefined) {
    result = result.filter((item) => item.lida === filter.lida);
  }

  const q = filter.q?.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (item) => item.titulo.toLowerCase().includes(q) || item.mensagem.toLowerCase().includes(q),
    );
  }

  return result;
}
