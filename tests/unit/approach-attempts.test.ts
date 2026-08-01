import { describe, expect, it } from "vitest";

import {
  deduplicationKey,
  isApproachAttemptStatus,
  isApproachResponseKind,
  isInInbox,
  isOpenAttempt,
  isTerminalAttemptStatus,
  isValidAttemptTransition,
  APPROACH_ATTEMPT_STATUSES,
  TEAM_NOTIFICATION_KINDS,
  type TeamNotification,
} from "@/modules/connection/approach";

/**
 * Incremento 2 — o domínio puro da tentativa e da notificação.
 *
 * O que estes testes pinam não é comportamento de tela: são as regras que a
 * ADR-044 exige e que uma refatoração distraída apagaria sem perceber.
 */

describe("Estados da tentativa", () => {
  it("tem exatamente quatro, todos verificáveis", () => {
    expect(APPROACH_ATTEMPT_STATUSES).toEqual([
      "CRIADA",
      "DESPACHADA",
      "RESPONDIDA",
      "CANCELADA",
    ]);
  });

  it("não admite estados de intenção nem de espera", () => {
    // Cada um destes foi rejeitado por um motivo diferente: intenção não é
    // fato, espera é derivável, ausência de resposta exigiria regra temporal,
    // e disponível/indisponível são desfecho — não estado.
    for (const proibido of [
      "PRONTA_PARA_ENVIO",
      "AGUARDANDO_RESPOSTA",
      "SEM_RESPOSTA",
      "DISPONIVEL",
      "INDISPONIVEL",
      "ATIVO",
    ]) {
      expect(isApproachAttemptStatus(proibido)).toBe(false);
    }
  });

  it("permite avançar e nunca regredir", () => {
    expect(isValidAttemptTransition("CRIADA", "DESPACHADA")).toBe(true);
    expect(isValidAttemptTransition("CRIADA", "CANCELADA")).toBe(true);
    expect(isValidAttemptTransition("DESPACHADA", "RESPONDIDA")).toBe(true);
    expect(isValidAttemptTransition("DESPACHADA", "CANCELADA")).toBe(true);

    expect(isValidAttemptTransition("DESPACHADA", "CRIADA")).toBe(false);
    expect(isValidAttemptTransition("RESPONDIDA", "DESPACHADA")).toBe(false);
    expect(isValidAttemptTransition("CANCELADA", "DESPACHADA")).toBe(false);
    expect(isValidAttemptTransition("CRIADA", "RESPONDIDA")).toBe(false);
  });

  it("terminal encerra a TENTATIVA — nova tentativa é linha nova", () => {
    expect(isTerminalAttemptStatus("RESPONDIDA")).toBe(true);
    expect(isTerminalAttemptStatus("CANCELADA")).toBe(true);
    expect(isTerminalAttemptStatus("CRIADA")).toBe(false);
    expect(isTerminalAttemptStatus("DESPACHADA")).toBe(false);
  });

  it("aberta é a que ainda pede algo de alguém", () => {
    expect(isOpenAttempt("CRIADA")).toBe(true);
    expect(isOpenAttempt("DESPACHADA")).toBe(true);
    expect(isOpenAttempt("RESPONDIDA")).toBe(false);
    expect(isOpenAttempt("CANCELADA")).toBe(false);
  });
});

describe("Desfecho da resposta", () => {
  it("aceita apenas os dois desfechos verificáveis", () => {
    expect(isApproachResponseKind("PODE_RECEBER_CONTATO")).toBe(true);
    expect(isApproachResponseKind("INDISPONIVEL")).toBe(true);
  });

  it("não existe desfecho de silêncio", () => {
    expect(isApproachResponseKind("SEM_RESPOSTA")).toBe(false);
    expect(isApproachResponseKind("NAO_RESPONDEU")).toBe(false);
    expect(isApproachResponseKind(null)).toBe(false);
  });
});

describe("Deduplicação da notificação", () => {
  it("é derivada de (fato, id do fato) — nunca do responsável", () => {
    expect(deduplicationKey("TENTATIVA_DESPACHADA", "attempt-1")).toBe(
      "TENTATIVA_DESPACHADA:attempt-1",
    );
  });

  it("o mesmo fato produz sempre a mesma chave, independentemente de quem responde", () => {
    // É isto que garante que reatribuir o Case não gere notificação nova:
    // reatribuição não é um fato sobre o qual a equipe precise ser avisada.
    const primeira = deduplicationKey("PROFISSIONAL_INDISPONIVEL", "attempt-9");
    const depoisDaTransferencia = deduplicationKey("PROFISSIONAL_INDISPONIVEL", "attempt-9");
    expect(primeira).toBe(depoisDaTransferencia);
  });

  it("fatos diferentes produzem chaves diferentes", () => {
    expect(deduplicationKey("TENTATIVA_DESPACHADA", "a")).not.toBe(
      deduplicationKey("TENTATIVA_CANCELADA", "a"),
    );
  });
});

describe("Notificação interna", () => {
  const base: TeamNotification = {
    id: "n1",
    caseId: "case-1",
    connectionId: "conn-1",
    approachAttemptId: null,
    kind: "TENTATIVA_DESPACHADA",
    recipientUserId: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    readAt: null,
    readBy: null,
    archivedAt: null,
  };

  it("está na caixa enquanto não foi vista nem arquivada", () => {
    expect(isInInbox(base)).toBe(true);
  });

  it("sai da caixa quando lida ou arquivada", () => {
    expect(isInInbox({ ...base, readAt: "2026-08-01T11:00:00.000Z", readBy: "u1" })).toBe(false);
    expect(isInInbox({ ...base, archivedAt: "2026-08-01T11:00:00.000Z" })).toBe(false);
  });

  it("não tem papel como destinatário — o conjunto de tipos não o prevê", () => {
    expect(TEAM_NOTIFICATION_KINDS).not.toContain("recipient_role");
    expect(Object.keys(base)).not.toContain("recipientRole");
  });

  it("recipientUserId é campo de evidência, e o tipo não o torna obrigatório", () => {
    // Se um dia virar obrigatório, é sinal de que passou a ser usado como
    // fonte de acesso — o que a decisão P6 proíbe.
    expect(base.recipientUserId).toBeNull();
    expect(isInInbox(base)).toBe(true);
  });
});
