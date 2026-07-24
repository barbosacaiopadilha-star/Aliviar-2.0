import { describe, expect, it } from "vitest";

import { findPossibleDuplicates } from "@/modules/crm/duplicates";
import { computeNextActionAt, isOverdue } from "@/modules/crm/next-action";
import { normalizeEmail, normalizePhone } from "@/modules/crm/phone";
import { allowedNextStages, isTransitionAllowed } from "@/modules/crm/pipeline";
import { hasCrmPermission } from "@/modules/crm/permissions";
import type { CrmContactSummary } from "@/modules/crm/types";

const baseContact = (overrides: Partial<CrmContactSummary> = {}): CrmContactSummary => ({
  id: "c1",
  fullName: "Maria Silva",
  preferredName: null,
  phone: "(11) 99999-0000",
  phoneNormalized: "5511999990000",
  email: "maria@example.com",
  emailNormalized: "maria@example.com",
  city: "São Paulo",
  state: "SP",
  source: "site",
  sourceDetail: null,
  status: "ativo",
  pipelineStage: "new_contact",
  assignedTo: null,
  assignedToName: null,
  priority: "media",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  lastInteractionAt: null,
  nextActionAt: null,
  archivedAt: null,
  consentStatus: "pendente",
  consentRecordedAt: null,
  activeCaseId: null,
  activeCaseTitle: null,
  ...overrides,
});

describe("crm phone normalization", () => {
  it("normaliza telefone brasileiro com DDD", () => {
    expect(normalizePhone("(11) 98888-7777")).toBe("5511988887777");
  });

  it("preserva telefone já com código do país", () => {
    expect(normalizePhone("+55 11 98888-7777")).toBe("5511988887777");
  });
});

describe("crm duplicate detection", () => {
  it("detecta duplicidade por telefone", () => {
    const matches = findPossibleDuplicates([baseContact()], { phone: "11999990000" });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.reasons).toContain("phone");
  });

  it("detecta duplicidade por e-mail", () => {
    const matches = findPossibleDuplicates([baseContact()], { email: "Maria@Example.com" });
    expect(matches[0]?.reasons).toContain("email");
  });
});

describe("crm pipeline transitions", () => {
  it("bloqueia consulta inicial agendada sem compromisso", () => {
    expect(
      isTransitionAllowed("initial_consultation_scheduling", "initial_consultation_scheduled", {
        hasInitialConsultationAppointment: false,
      }),
    ).toBe(false);
  });

  it("permite consulta inicial agendada com override administrativo", () => {
    expect(
      isTransitionAllowed("initial_consultation_scheduling", "initial_consultation_scheduled", {
        hasInitialConsultationAppointment: false,
        explicitAdminOverride: true,
      }),
    ).toBe(true);
  });

  it("não permite concluir sem confirmação explícita", () => {
    expect(isTransitionAllowed("scheduling_support", "completed", {})).toBe(false);
  });

  it("expõe próximas etapas válidas", () => {
    expect(allowedNextStages("new_contact")).toContain("first_response_pending");
  });
});

describe("crm next action", () => {
  it("prioriza a tarefa pendente mais próxima", () => {
    const result = computeNextActionAt({
      tasks: [
        { status: "pendente", dueAt: "2026-07-25T10:00:00.000Z", title: "Retorno" },
        { status: "pendente", dueAt: "2026-07-24T10:00:00.000Z", title: "Urgente" },
      ],
      appointments: [],
    });
    expect(result.nextActionAt).toBe("2026-07-24T10:00:00.000Z");
  });

  it("identifica atraso", () => {
    expect(isOverdue("2020-01-01T00:00:00.000Z", new Date("2026-01-01T00:00:00.000Z"))).toBe(true);
  });
});

describe("crm permissions", () => {
  it("concierge pode criar contato", () => {
    expect(hasCrmPermission(["concierge"], "crm.create_contact")).toBe(true);
  });

  it("concierge não gerencia permissões", () => {
    expect(hasCrmPermission(["concierge"], "crm.manage_permissions")).toBe(false);
  });

  it("administrador possui acesso amplo", () => {
    expect(hasCrmPermission(["administrador"], "crm.view_audit")).toBe(true);
  });
});

describe("crm email normalization", () => {
  it("normaliza e-mail", () => {
    expect(normalizeEmail("  Maria@Example.COM ")).toBe("maria@example.com");
  });
});
