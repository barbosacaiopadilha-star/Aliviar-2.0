// Lead, Contato e Paciente — três coisas diferentes.
//
// @metodo Correção do Administrador §3 — não tratar todo lead como paciente
// @metodo Correção de Domínio §2 — quem qualifica e converte é o Atendente (Nível 1)
//
// Módulo puro: nenhuma consulta, nenhum efeito. Espelha em TypeScript as
// mesmas regras que `curadoria.convert_lead_to_patient()` impõe no banco.
// O banco garante; isto explica.

/**
 * **Lead** — pessoa que chegou por um canal de aquisição e ainda não foi
 * qualificada. Pode nunca virar paciente, e isso é normal.
 *
 * **Contact** — o registro de relacionamento no CRM. É o mesmo `crm_contacts`
 * do começo ao fim: ele não deixa de existir quando vira paciente, passa a
 * apontar para um. A origem nunca se apaga.
 *
 * **Patient** — pessoa formalmente vinculada ao atendimento. Pode ter Case
 * aberto e acessar a Área do Paciente.
 */
export const LEAD_SOURCES = ["site", "whatsapp", "indicacao", "campanha", "outro"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  campanha: "Campanha",
  outro: "Outro",
};

export function normalizeLeadSource(value: string | null | undefined): LeadSource {
  const v = (value ?? "").trim().toLowerCase();
  return (LEAD_SOURCES as readonly string[]).includes(v) ? (v as LeadSource) : "outro";
}

/** Onde o lead está antes de virar Case. Depois disso, quem manda é o Case. */
export const LEAD_STAGES = ["novo", "first_response_pending", "em_qualificacao", "qualificado", "convertido", "descartado"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo: "Novo",
  first_response_pending: "Aguardando primeiro contato",
  em_qualificacao: "Em qualificação",
  qualificado: "Qualificado",
  convertido: "Convertido em paciente",
  descartado: "Descartado",
};

export function normalizeLeadStage(value: string | null | undefined): LeadStage {
  const v = (value ?? "").trim();
  return (LEAD_STAGES as readonly string[]).includes(v) ? (v as LeadStage) : "novo";
}

export type Lead = {
  id: string;
  fullName: string;
  phoneNormalized: string | null;
  emailNormalized: string | null;
  source: LeadSource;
  sourceDetail: string | null;
  stage: LeadStage;
  qualifiedAt: string | null;
  patientProfileId: string | null;
  convertedAt: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Deduplicação
// ---------------------------------------------------------------------------

/**
 * Telefone brasileiro reduzido a dígitos, com DDI 55 quando faltar.
 *
 * `(11) 97903-7133`, `11979037133` e `+55 11 97903-7133` são a mesma pessoa.
 * Sem isso, a mesma pessoa que escreve pelo site e pelo WhatsApp vira dois
 * pacientes — e ninguém percebe até o Curador atender duas vezes.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length >= 12 && digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim().toLowerCase();
  return trimmed.length === 0 ? null : trimmed;
}

export type DuplicateMatch = {
  leadId: string;
  /** Por que achamos que é a mesma pessoa. Mostrado a quem decide, nunca escondido. */
  matchedOn: ("telefone" | "e-mail" | "vínculo com o mesmo paciente")[];
  /** `strong` = identificador único bateu. `weak` = só o nome. Nome nunca decide sozinho. */
  confidence: "strong" | "weak";
};

/**
 * Procura leads que possam ser a mesma pessoa.
 *
 * Nunca bloqueia. Quem decide se são a mesma pessoa é gente — a função só
 * mostra o que encontrou e por quê. Um homônimo bloqueado silenciosamente é
 * pior que um duplicado visível.
 */
export function findDuplicateLeads(
  candidate: { phone?: string | null; email?: string | null; fullName?: string | null; patientProfileId?: string | null },
  existing: readonly Lead[],
): DuplicateMatch[] {
  const phone = normalizePhone(candidate.phone);
  const email = normalizeEmail(candidate.email);
  const name = (candidate.fullName ?? "").trim().toLowerCase();

  const matches: DuplicateMatch[] = [];

  for (const lead of existing) {
    const on: DuplicateMatch["matchedOn"] = [];
    if (phone && lead.phoneNormalized === phone) on.push("telefone");
    if (email && lead.emailNormalized === email) on.push("e-mail");
    if (candidate.patientProfileId && lead.patientProfileId === candidate.patientProfileId) {
      on.push("vínculo com o mesmo paciente");
    }

    if (on.length > 0) {
      matches.push({ leadId: lead.id, matchedOn: on, confidence: "strong" });
      continue;
    }

    // Nome igual é pista, não prova. "Maria Silva" existe muitas vezes.
    if (name.length > 0 && lead.fullName.trim().toLowerCase() === name) {
      matches.push({ leadId: lead.id, matchedOn: [], confidence: "weak" });
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Conversão
// ---------------------------------------------------------------------------

export type ConversionActor = {
  id: string;
  roles: readonly string[];
};

export type ConversionVerdict =
  /** Já convertido neste mesmo paciente. Não é erro e não gera novo registro. */
  | { outcome: "already-converted"; patientProfileId: string }
  /** Pode converter, mas há possíveis duplicatas para um humano confirmar. */
  | { outcome: "needs-confirmation"; duplicates: DuplicateMatch[] }
  | { outcome: "allowed" }
  | { outcome: "rejected"; reason: string };

export type ConversionInput = {
  lead: Lead;
  actor: ConversionActor;
  /** Leads já existentes contra os quais checar duplicidade. */
  existingLeads: readonly Lead[];
  /** Confirmação humana de que as duplicatas mostradas não são a mesma pessoa. */
  duplicatesConfirmed?: boolean;
  /** Exceção administrativa: converter sem qualificação. Só administrador. */
  administrativeException?: { reason: string };
};

export function evaluateLeadConversion(input: ConversionInput): ConversionVerdict {
  const { lead, actor, existingLeads, duplicatesConfirmed, administrativeException } = input;

  if (lead.patientProfileId) {
    return { outcome: "already-converted", patientProfileId: lead.patientProfileId };
  }

  const isAdmin = actor.roles.includes("administrador");
  const isAtendente = actor.roles.includes("atendente");

  // O Curador conduz o Case que recebe; o Concierge acompanha depois. Nenhum
  // dos dois converte lead — se pudessem, o Nível 1 deixaria de existir na
  // prática e o Case nasceria em qualquer lugar.
  if (!isAtendente && !isAdmin) {
    return {
      outcome: "rejected",
      reason: "Só o Atendente converte lead em paciente. O Curador conduz o Case; o Concierge acompanha depois.",
    };
  }

  if (lead.qualifiedAt === null) {
    if (!isAdmin || !administrativeException) {
      return {
        outcome: "rejected",
        reason: "Este lead ainda não foi qualificado. Qualifique antes de converter.",
      };
    }
    if (administrativeException.reason.trim().length === 0) {
      return { outcome: "rejected", reason: "Uma exceção administrativa precisa de motivo registrado." };
    }
  }

  const duplicates = findDuplicateLeads(
    { phone: lead.phoneNormalized, email: lead.emailNormalized, fullName: lead.fullName },
    existingLeads.filter((other) => other.id !== lead.id),
  );

  if (duplicates.length > 0 && !duplicatesConfirmed) {
    return { outcome: "needs-confirmation", duplicates };
  }

  return { outcome: "allowed" };
}

/**
 * O Administrador tem acesso global — o que não é o mesmo que ser o ator
 * padrão da operação. Ele intervém em exceções; quem trabalha o lead no dia
 * a dia é o Atendente.
 */
export function isAdministrativeFallback(actor: ConversionActor): boolean {
  return actor.roles.includes("administrador") && !actor.roles.includes("atendente");
}
