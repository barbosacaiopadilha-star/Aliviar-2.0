import { describe, expect, it } from "vitest";

import {
  CONNECTION_STATUS_LABELS,
  CONTACT_MODE_LABELS,
  readContinuity,
  responsibilityLabel,
  violatesTeamVocabulary,
} from "@/modules/connection/continuity-labels";
import type { ContinuityWorkItem } from "@/modules/connection/continuity-worklist";

/**
 * A gramática da área do Concierge, protegida por teste.
 *
 * O risco que estes casos evitam não é estético: é a operação passar a
 * cobrar prazo que ninguém comprometeu, tratar ausência de resposta como
 * desfecho, ou dar por encerrado um trabalho porque alguém abriu um aviso.
 */

function buildItem(overrides: Partial<ContinuityWorkItem> = {}): ContinuityWorkItem {
  return {
    caseId: "case-1",
    connectionId: "conn-1",
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    professionalProfileId: "prof-1",
    decidedAt: "2026-07-15T10:00:00.000Z",
    awaitingContactMode: true,
    attemptCreatedNotDispatched: false,
    attemptDispatchedWithoutResponse: false,
    unavailabilityNeedsAction: false,
    intermediatedWithoutOpenAttempt: false,
    unreadNotifications: 0,
    readButStillPending: false,
    totalAttempts: 0,
    ...overrides,
  };
}

describe("Continuidade — ler não é fazer", () => {
  it("alguém ter visto NÃO remove nada do que ainda falta", () => {
    const semLeitura = readContinuity(
      buildItem({ attemptDispatchedWithoutResponse: true, awaitingContactMode: false }),
    );
    const comLeitura = readContinuity(
      buildItem({
        attemptDispatchedWithoutResponse: true,
        awaitingContactMode: false,
        readButStillPending: true,
      }),
    );

    expect(comLeitura.pending).toEqual(semLeitura.pending);
    expect(comLeitura.pending.length).toBeGreaterThan(0);
    expect(comLeitura.seen).toBe(true);
  });

  it("visto e pendente são dimensões independentes, exibíveis ao mesmo tempo", () => {
    const leitura = readContinuity(
      buildItem({ readButStillPending: true, unavailabilityNeedsAction: true, awaitingContactMode: false }),
    );

    expect(leitura.seen).toBe(true);
    expect(leitura.pending).toContain("o profissional respondeu que não está disponível");
  });

  it("avisos não abertos não viram pendência de trabalho — são outra dimensão", () => {
    const leitura = readContinuity(buildItem({ awaitingContactMode: false, unreadNotifications: 3 }));

    expect(leitura.unseen).toBe(3);
    expect(leitura.pending).toEqual([]);
  });
});

describe("Continuidade — fatos, nunca prazo ou julgamento", () => {
  it("ausência de resposta é dita como ausência de fato, nunca como desfecho", () => {
    const leitura = readContinuity(
      buildItem({ attemptDispatchedWithoutResponse: true, awaitingContactMode: false }),
    );

    const frase = leitura.pending.join(" ");
    expect(frase).toContain("nenhuma resposta registrada");
    expect(frase.toLowerCase()).not.toContain("sem resposta há");
    expect(frase.toLowerCase()).not.toContain("não respondeu");
  });

  it("nenhum rótulo da área usa prazo, atraso, prioridade ou língua de sistema", () => {
    const todos = [
      ...Object.values(CONNECTION_STATUS_LABELS),
      ...Object.values(CONTACT_MODE_LABELS),
      ...readContinuity(
        buildItem({
          attemptCreatedNotDispatched: true,
          attemptDispatchedWithoutResponse: true,
          unavailabilityNeedsAction: true,
          intermediatedWithoutOpenAttempt: true,
        }),
      ).pending,
      responsibilityLabel("concierge"),
      responsibilityLabel("curador_medico"),
      responsibilityLabel("atendente"),
      responsibilityLabel(null),
    ].join(" · ");

    expect(violatesTeamVocabulary(todos)).toBeNull();
    // Nenhum nome de enum atravessa para a tela.
    expect(todos).not.toMatch(/[A-Z]{3,}_[A-Z_]{3,}/);
  });

  it("indisponibilidade é fato do profissional, nunca falha da paciente", () => {
    const leitura = readContinuity(buildItem({ unavailabilityNeedsAction: true, awaitingContactMode: false }));
    const frase = leitura.pending.join(" ").toLowerCase();

    expect(frase).toContain("o profissional respondeu");
    for (const proibido of ["falhou", "erro", "recusou", "problema"]) {
      expect(frase, `julgamento: ${proibido}`).not.toContain(proibido);
    }
  });
});

describe("Continuidade — responsabilidade tem fonte única", () => {
  it("cada papel do Case vira uma frase humana, sem vocabulário de ticket", () => {
    expect(responsibilityLabel("concierge")).toBe("Com você agora");
    expect(responsibilityLabel("curador_medico")).toBe("Ainda com a Curadoria");
    expect(responsibilityLabel(null)).toBe("Sem responsável registrado");

    for (const papel of ["concierge", "curador_medico", "atendente", "administrador", null]) {
      expect(violatesTeamVocabulary(responsibilityLabel(papel))).toBeNull();
    }
  });

  it("o guarda de vocabulário reconhece os termos proibidos da área", () => {
    expect(violatesTeamVocabulary("Este caso está atrasado")).toBe("atrasado");
    expect(violatesTeamVocabulary("visível por vínculo anterior")).toBe("vínculo anterior");
    expect(violatesTeamVocabulary("Requer atenção")).toBe("requer atenção");
    expect(violatesTeamVocabulary("Casos que seguem com você")).toBeNull();
  });
});
