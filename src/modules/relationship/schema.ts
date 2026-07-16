import { z } from "zod";

// Validação antecipada e amigável do lado da Server Action — a autoridade
// final continua sendo o domínio puro (commands.ts) e o banco (PR1),
// nunca este schema. Mesmo padrão já usado por connection/schema.ts.

const caseIdSchema = z.string().uuid();

export const declarePlannedRelationshipClosureInputSchema = z.object({
  caseId: caseIdSchema,
});
export type DeclarePlannedRelationshipClosureFormInput = z.infer<
  typeof declarePlannedRelationshipClosureInputSchema
>;

export const declareRelationshipInterruptionInputSchema = z.object({
  caseId: caseIdSchema,
  // Obrigatoriedade condicional (equipe vs. paciente) é responsabilidade
  // do domínio (commands.ts, INVALID_TERMINATION) — este schema só valida
  // forma, nunca decide quem precisa preenchê-la.
  observation: z.string().trim().min(1).optional(),
});
export type DeclareRelationshipInterruptionFormInput = z.infer<
  typeof declareRelationshipInterruptionInputSchema
>;

export const registerObservedRelationshipReopeningInputSchema = z.object({
  // Caso original — identifica o Relationship terminal que receberá o
  // evento (nunca um relationshipId aceito diretamente do cliente).
  caseId: caseIdSchema,
  newCaseId: caseIdSchema,
});
export type RegisterObservedRelationshipReopeningFormInput = z.infer<
  typeof registerObservedRelationshipReopeningInputSchema
>;
