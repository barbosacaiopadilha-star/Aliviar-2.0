import { describe, expect, it } from "vitest";

import {
  MOCK_ACTIVITY,
  MOCK_CASES,
  MOCK_COMPATIBILITIES,
  MOCK_PRIORITY_PROFILES,
  orderByWhatNeedsYou,
} from "@/modules/curadoria/portal/mock-data";
import { bandFor } from "@/modules/curadoria/method";
import { CURADORIA_STEPS } from "@/modules/curadoria/types";

// Dado mockado também obedece aos invariantes. Uma tela construída sobre um
// mock que viola o Método ensina o comportamento errado — e depois o código
// nasce para servir a tela.

describe("casos mockados", () => {
  it("toda etapa pertence ao vocabulário oficial das sete etapas", () => {
    for (const entry of MOCK_CASES) {
      expect(CURADORIA_STEPS).toContain(entry.step);
    }
  });

  it("todo caso oferece exatamente uma próxima ação", () => {
    for (const entry of MOCK_CASES) {
      expect(entry.nextAction.label.trim().length).toBeGreaterThan(0);
      expect(entry.nextAction.href).toMatch(/^\/coa\/curadoria\//);
    }
  });

  it("nenhuma pendência existe sem dono nomeado", () => {
    for (const entry of MOCK_CASES) {
      for (const pendency of entry.pendencies) {
        expect(["CURADOR", "PACIENTE", "EQUIPE"]).toContain(pendency.owner);
      }
    }
  });

  it("todo alerta carrega código rastreável do Motor", () => {
    for (const entry of MOCK_CASES) {
      for (const alert of entry.alerts) {
        expect(alert.code).toMatch(/^[EIC]-\d{2}$/);
        expect(alert.detail.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("ordenação do Painel Inicial", () => {
  it("bloqueio vem antes de alerta, que vem antes de ação, que vem antes de espera", () => {
    const ordered = orderByWhatNeedsYou(MOCK_CASES);

    expect(ordered[0]?.alerts.some((alert) => alert.severity === "bloqueio")).toBe(true);
    expect(ordered[ordered.length - 1]?.nextAction.kind).toBe("aguardando");
  });

  it("não descarta nenhum caso", () => {
    expect(orderByWhatNeedsYou(MOCK_CASES)).toHaveLength(MOCK_CASES.length);
  });
});

describe("perfis de prioridades mockados", () => {
  it("todo peso carrega Evidência de Curadoria", () => {
    for (const profile of MOCK_PRIORITY_PROFILES) {
      for (const weight of profile.weights) {
        expect(weight.evidence.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("um Perfil validado soma exatamente 100 pontos", () => {
    const validated = MOCK_PRIORITY_PROFILES.filter((profile) => profile.status === "Validado");
    expect(validated.length).toBeGreaterThan(0);

    for (const profile of validated) {
      const total = profile.weights.reduce((sum, weight) => sum + weight.weight, 0);
      expect(total, `Perfil de ${profile.caseId} não fecha 100`).toBe(100);
    }
  });

  it("um Perfil validado registra o ato de validação", () => {
    for (const profile of MOCK_PRIORITY_PROFILES.filter((entry) => entry.status === "Validado")) {
      expect(profile.validatedAt).not.toBeNull();
      expect(profile.validationNote?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it("um Perfil em construção nunca aparece como validado", () => {
    for (const profile of MOCK_PRIORITY_PROFILES.filter((entry) => entry.status !== "Validado")) {
      expect(profile.validatedAt).toBeNull();
    }
  });
});

describe("compatibilidades mockadas", () => {
  it("a faixa corresponde ao score pelas regras do Motor", () => {
    for (const entry of MOCK_COMPATIBILITIES) {
      expect(bandFor(entry.internalScore)).toBe(entry.band);
    }
  });

  it("toda dimensão traz explicação em linguagem humana", () => {
    for (const entry of MOCK_COMPATIBILITIES) {
      for (const criterion of entry.criteria) {
        expect(criterion.explanation.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("dimensão sem dado não pontua e declara a ausência", () => {
    const withoutData = MOCK_COMPATIBILITIES.flatMap((entry) => entry.criteria).filter(
      (criterion) => criterion.alignment === null,
    );

    expect(withoutData.length).toBeGreaterThan(0);
    for (const criterion of withoutData) {
      expect(criterion.contribution).toBe(0);
      expect(criterion.explanation).toContain("nada foi presumido");
    }
  });

  it("a cobertura nunca ultrapassa 100 pontos", () => {
    for (const entry of MOCK_COMPATIBILITIES) {
      expect(entry.coveredWeight).toBeGreaterThan(0);
      expect(entry.coveredWeight).toBeLessThanOrEqual(100);
    }
  });
});

describe("atividades mockadas", () => {
  it("todo evento tem autor nomeado", () => {
    for (const event of MOCK_ACTIVITY) {
      expect(event.actor.trim().length).toBeGreaterThan(0);
    }
  });

  it("o nome do evento segue o catálogo do Motor (maiúsculas com underscore)", () => {
    for (const event of MOCK_ACTIVITY) {
      expect(event.event).toMatch(/^[A-Z_]+$/);
    }
  });
});
