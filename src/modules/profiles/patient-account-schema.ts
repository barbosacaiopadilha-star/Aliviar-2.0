import { z } from "zod";

// O paciente nunca se cadastra por fluxo público — este schema valida a
// criação de conta feita pela equipe Aliviar (correção de regra de
// negócio). Login = e-mail; senha é sempre gerada pelo sistema, nunca
// digitada pelo administrador (evita senha fraca escolhida ad hoc).
export const createPatientAccountSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  displayName: z.string().trim().min(2, "Informe o nome do paciente.").max(160, "Nome muito longo."),
  // Chave estável da SOLICITAÇÃO (Bloco B.6/B3): uuid gerado no render do
  // formulário e reenviado intacto em cada retry — é ela que torna a criação
  // idempotente de verdade (nunca derivada do id da conta, que só nasce
  // durante a tentativa; nunca o e-mail sozinho, que é editável e
  // reutilizável).
  operationKey: z.string().uuid("Solicitação inválida. Recarregue a página e tente novamente."),
});

export type CreatePatientAccountInput = z.infer<typeof createPatientAccountSchema>;

function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

// Dados que o administrador pode editar em nome do paciente — apenas os
// campos operacionais já existentes (Sprint Produto 2); nunca preferências
// de comunicação (permanecem exclusivamente do próprio paciente).
export const adminPatientProfileSchema = z.object({
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\+?[0-9()\-\s]{8,20}$/, "Informe um telefone válido.")
      .optional(),
  ),
  city: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, "Cidade muito longa.").optional(),
  ),
  state: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a sigla do estado (2 letras), ex.: SP.")
      .optional(),
  ),
});

export type AdminPatientProfileInput = z.infer<typeof adminPatientProfileSchema>;
