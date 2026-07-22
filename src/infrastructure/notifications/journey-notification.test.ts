import { describe, expect, it } from "vitest";

import { buildJornadaViewCuradoria, buildJornadaViewEntrega } from "@/test/build-jornada-view";
import {
  derivarNotificacoesDaJornada,
  filtrarNotificacoes,
  integrarNotificacoesNaTimeline,
} from "@/infrastructure/notifications/journey-notification-engine";
import type { JourneyNotificationView } from "@/notification-flow/contracts/journey-notification";

describe("Motor de eventos de notificação", () => {
  it("gera notificação de curadoria iniciada na transição de etapa", () => {
    const anterior = buildJornadaViewEntrega();
    const atual = {
      ...buildJornadaViewCuradoria(),
      etapa_atual: "CURADORIA" as const,
      estado_visivel: "EM_CURADORIA" as const,
      atualizada_em: "2026-07-22T12:00:00Z",
    };

    const drafts = derivarNotificacoesDaJornada({
      jornadaId: atual.jornada_id,
      anterior,
      atual,
    });

    expect(drafts.some((d) => d.tipo === "CURADORIA_INICIADA")).toBe(true);
  });

  it("gera notificação de entrega disponível quando extensão aparece", () => {
    const anterior = buildJornadaViewCuradoria();
    const atual = buildJornadaViewEntrega();

    const drafts = derivarNotificacoesDaJornada({
      jornadaId: atual.jornada_id,
      anterior,
      atual,
    });

    expect(drafts.some((d) => d.tipo === "ENTREGA_DISPONIVEL")).toBe(true);
  });

  it("não gera notificação sem transição de jornada", () => {
    const view = buildJornadaViewCuradoria();
    const drafts = derivarNotificacoesDaJornada({
      jornadaId: view.jornada_id,
      anterior: view,
      atual: view,
    });
    expect(drafts).toHaveLength(0);
  });

  it("filtra notificações por tipo e leitura", () => {
    const items: JourneyNotificationView[] = [
      {
        id: "1",
        jornada_id: "j-1",
        tipo: "ENTREGA_DISPONIVEL",
        titulo: "Entrega",
        mensagem: "Pronta",
        prioridade: "ALTA",
        data: "2026-01-01",
        lida: false,
        origem: "ENTREGA",
        referencia_tipo: "ENTREGA",
        referencia_id: "e-1",
      },
      {
        id: "2",
        jornada_id: "j-1",
        tipo: "CURADORIA_INICIADA",
        titulo: "Curadoria",
        mensagem: "Iniciada",
        prioridade: "NORMAL",
        data: "2026-01-02",
        lida: true,
        origem: "JORNADA",
        referencia_tipo: "ETAPA",
        referencia_id: "CURADORIA",
      },
    ];

    const filtradas = filtrarNotificacoes(items, { tipo: "ENTREGA_DISPONIVEL", lida: false });
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0]?.id).toBe("1");
  });

  it("integra notificações na timeline com referências", () => {
    const timeline = [
      {
        id: "t-1",
        tipo: "INICIO" as const,
        titulo: "Início",
        descricao: "Jornada iniciada",
        ocorrido_em: "2026-01-01T00:00:00Z",
        etapa: "HISTORIA" as const,
        visibilidade: "PUBLICO" as const,
      },
    ];

    const notificacoes: JourneyNotificationView[] = [
      {
        id: "n-1",
        jornada_id: "j-1",
        tipo: "DOCUMENTOS_RECEBIDOS",
        titulo: "Documento",
        mensagem: "Recebido",
        prioridade: "NORMAL",
        data: "2026-01-02T00:00:00Z",
        lida: false,
        origem: "DOCUMENTO",
        referencia_tipo: "DOCUMENTO",
        referencia_id: "doc-1",
      },
    ];

    const integrada = integrarNotificacoesNaTimeline(timeline, notificacoes);
    expect(integrada).toHaveLength(2);
    expect(integrada[0]?.id).toBe("notif-n-1");
  });

  it("não inclui campos de decisão clínica nas notificações", () => {
    const view = buildJornadaViewEntrega();
    const drafts = derivarNotificacoesDaJornada({
      jornadaId: view.jornada_id,
      anterior: null,
      atual: view,
    });

    for (const draft of drafts) {
      expect(draft).not.toHaveProperty("recomendacao");
      expect(draft).not.toHaveProperty("ranking");
      expect(draft).not.toHaveProperty("decisao_clinica");
    }
  });
});
