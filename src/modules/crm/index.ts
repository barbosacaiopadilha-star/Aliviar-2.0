// Módulo CRM — a plataforma operacional da Aliviar.
//
// O CRM organiza leads, contatos, Cases, tarefas, agenda, interações,
// histórico, documentos e auditoria. Ele nunca é ator: não qualifica, não
// converte, não abre Case, não decide. Quem age são Atendente, Curador e
// Concierge — ver `@/modules/cases/responsibility`.
//
// REINTEGRAÇÃO 2026-07-24 — duas linhas de trabalho se encontraram aqui e
// são complementares, não concorrentes:
//   · a PLATAFORMA (contatos, pipeline, tarefas, agenda, WhatsApp) veio de
//     origin/main;
//   · as OPERAÇÕES AUDITADAS do domínio (lead → qualificação → conversão →
//     Case) vieram da árvore certificada e validam no banco.

export * from "./actions";
export * from "./duplicates";
export * from "./next-action";
export * from "./permissions";
export * from "./phone";
export * from "./pipeline";
export * from "./repository";
export * from "./schema";
export * from "./types";
export { createWhatsAppProvider } from "./integrations/whatsapp/provider";
export { WHATSAPP_ENV_VARS } from "./integrations/whatsapp/types";

// Operações auditadas (Correção de Domínio).
//
// `./lead` é re-exportado seletivamente: normalizePhone/normalizeEmail e
// DuplicateMatch também existem em ./phone e ./duplicates (a plataforma).
// Duas normalizações coexistirem é dívida registrada no backlog pós-release;
// até a unificação, quem importa pelo índice recebe SÓ a da plataforma, e a
// versão de ./lead fica restrita a quem a importa pelo caminho direto.
export {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  normalizeLeadSource,
  normalizeLeadStage,
  findDuplicateLeads,
  evaluateLeadConversion,
  isAdministrativeFallback,
  type Lead,
  type LeadSource,
  type LeadStage,
  type ConversionActor,
  type ConversionVerdict,
  type ConversionInput,
} from "./lead";
export * from "./lead-next-step";
export * from "./lead-repository";
export * from "./conversion-actions";
