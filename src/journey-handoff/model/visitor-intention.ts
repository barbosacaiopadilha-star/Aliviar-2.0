/** Intenção declarada pelo visitante na experiência pública. */
export type VisitorIntention =
  | "INICIAR_CONVERSA"
  | "CONTAR_HISTORIA"
  | "ACEITAR_ACOMPANHAMENTO";

export const VISITOR_INTENTION_LABELS: Record<VisitorIntention, string> = {
  INICIAR_CONVERSA: "Iniciar conversa",
  CONTAR_HISTORIA: "Contar história",
  ACEITAR_ACOMPANHAMENTO: "Aceitar acompanhamento",
};

export function isVisitorIntention(value: string): value is VisitorIntention {
  return value === "INICIAR_CONVERSA" || value === "CONTAR_HISTORIA" || value === "ACEITAR_ACOMPANHAMENTO";
}
