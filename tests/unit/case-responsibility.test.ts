import { describe, expect, it } from "vitest";

import {
  RESPONSIBLE_ROLES,
  canTransfer,
  evaluateTransfer,
  isNormalTransition,
  isResponsibleRole,
  type ResponsibleRole,
} from "@/modules/cases/responsibility";

const ATENDENTE = "11111111-1111-1111-1111-111111111111";
const CURADOR = "22222222-2222-2222-2222-222222222222";
const CONCIERGE = "33333333-3333-3333-3333-333333333333";
const ESTRANHO = "44444444-4444-4444-4444-444444444444";

function transfer(overrides: Partial<Parameters<typeof evaluateTransfer>[0]> = {}) {
  return evaluateTransfer({
    current: { responsibleId: ATENDENTE, responsibleRole: "atendente" },
    newResponsibleId: CURADOR,
    newRole: "curador_medico",
    reason: "Contato qualificado, seguindo para a Curadoria.",
    newResponsibleRoles: ["curador_medico"],
    actorIsAdmin: false,
    ...overrides,
  });
}

describe("os três níveis humanos", () => {
  it("são exatamente Atendente, Curador e Concierge", () => {
    expect(RESPONSIBLE_ROLES).toEqual(["atendente", "curador_medico", "concierge"]);
  });

  // O CRM é a plataforma onde o trabalho acontece; a Curadoria é o processo
  // que o Curador executa dentro do Case. Nenhum dos dois é alguém.
  it("não aceita 'crm' nem 'curadoria' como responsável", () => {
    expect(isResponsibleRole("crm")).toBe(false);
    expect(isResponsibleRole("curadoria")).toBe(false);
    expect(isResponsibleRole("administrador")).toBe(false);
  });
});

describe("a jornada oficial", () => {
  it("vai do Atendente ao Curador e do Curador ao Concierge", () => {
    expect(isNormalTransition("atendente", "curador_medico")).toBe(true);
    expect(isNormalTransition("curador_medico", "concierge")).toBe(true);
  });

  it("não anda para trás sem administrador", () => {
    expect(isNormalTransition("concierge", "curador_medico")).toBe(false);
    expect(isNormalTransition("curador_medico", "atendente")).toBe(false);
  });

  it("não pula o Curador: Atendente não entrega direto ao Concierge", () => {
    expect(isNormalTransition("atendente", "concierge")).toBe(false);
  });

  it("termina no Concierge — não há nível 4", () => {
    for (const role of RESPONSIBLE_ROLES) {
      expect(isNormalTransition("concierge", role)).toBe(false);
    }
  });
});

describe("evaluateTransfer", () => {
  it("permite a passagem normal do Atendente ao Curador", () => {
    expect(transfer()).toEqual({ outcome: "allowed" });
  });

  it("recusa transferência sem motivo", () => {
    const verdict = transfer({ reason: "   " });
    expect(verdict.outcome).toBe("rejected");
  });

  it("recusa quem não tem o papel de destino", () => {
    // Indicar alguém como Curador não o torna Curador.
    const verdict = transfer({ newResponsibleRoles: ["paciente"] });
    expect(verdict).toMatchObject({ outcome: "rejected" });
    expect(verdict.outcome === "rejected" && verdict.reason).toContain("Curador");
  });

  it("recusa salto de nível de quem não é administrador", () => {
    const verdict = transfer({ newResponsibleId: CONCIERGE, newRole: "concierge", newResponsibleRoles: ["concierge"] });
    expect(verdict.outcome).toBe("rejected");
  });

  it("deixa o administrador registrar a exceção", () => {
    const verdict = transfer({
      newResponsibleId: CONCIERGE,
      newRole: "concierge",
      newResponsibleRoles: ["concierge"],
      actorIsAdmin: true,
    });
    expect(verdict).toEqual({ outcome: "allowed" });
  });

  // Um duplo-clique não é uma violação. Repetir a mesma transferência não
  // produz erro nem gera um segundo registro de histórico.
  it("é idempotente: transferir para quem já é o responsável não muda nada", () => {
    const verdict = transfer({ newResponsibleId: ATENDENTE, newRole: "atendente" });
    expect(verdict).toEqual({ outcome: "unchanged" });
  });

  it("aceita repetição idêntica mesmo sem motivo — nada aconteceu para justificar", () => {
    const verdict = transfer({ newResponsibleId: ATENDENTE, newRole: "atendente", reason: "" });
    expect(verdict).toEqual({ outcome: "unchanged" });
  });
});

describe("quem pode entregar o Case", () => {
  const current = { responsibleId: CURADOR, responsibleRole: "curador_medico" as ResponsibleRole };

  it("o responsável atual pode", () => {
    expect(canTransfer({ actorId: CURADOR, actorIsAdmin: false, current, assignedCuratorId: null })).toBe(true);
  });

  it("quem não tem o Case na mão não pode", () => {
    expect(canTransfer({ actorId: ESTRANHO, actorIsAdmin: false, current, assignedCuratorId: null })).toBe(false);
  });

  it("o administrador pode", () => {
    expect(canTransfer({ actorId: ESTRANHO, actorIsAdmin: true, current, assignedCuratorId: null })).toBe(true);
  });

  // Os Cases abertos antes da Correção de Domínio têm responsável atual nulo.
  // O Curador que já os conduz não pode ficar trancado do lado de fora.
  it("o Curador designado alcança o Case anterior à Correção de Domínio", () => {
    expect(
      canTransfer({
        actorId: CURADOR,
        actorIsAdmin: false,
        current: { responsibleId: null, responsibleRole: null },
        assignedCuratorId: CURADOR,
      }),
    ).toBe(true);
  });

  // Assim que o Case ganha responsável atual, o campo histórico para de valer.
  // Sem isso, o Curador continuaria enxergando um Case que já entregou.
  it("o Curador designado perde a autoridade depois de entregar", () => {
    expect(
      canTransfer({
        actorId: CURADOR,
        actorIsAdmin: false,
        current: { responsibleId: CONCIERGE, responsibleRole: "concierge" },
        assignedCuratorId: CURADOR,
      }),
    ).toBe(false);
  });
});

describe("o mesmo Case percorre a jornada inteira", () => {
  // Este é o teste que impede a duplicação de Case voltar. A jornada é uma
  // sequência de trocas de responsável sobre UM registro — em nenhum momento
  // um novo Case é criado para representar a etapa seguinte.
  it("Atendente → Curador → Concierge sem nunca trocar de identidade", () => {
    const caseId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let estado = { caseId, responsibleId: ATENDENTE, responsibleRole: "atendente" as ResponsibleRole | null };

    const jornada: Array<[string, ResponsibleRole]> = [
      [CURADOR, "curador_medico"],
      [CONCIERGE, "concierge"],
    ];

    for (const [destino, papel] of jornada) {
      const verdict = evaluateTransfer({
        current: { responsibleId: estado.responsibleId, responsibleRole: estado.responsibleRole },
        newResponsibleId: destino,
        newRole: papel,
        reason: "Etapa concluída.",
        newResponsibleRoles: [papel],
        actorIsAdmin: false,
      });
      expect(verdict).toEqual({ outcome: "allowed" });
      estado = { caseId: estado.caseId, responsibleId: destino, responsibleRole: papel };
    }

    expect(estado.caseId).toBe(caseId);
    expect(estado.responsibleRole).toBe("concierge");
  });
});
