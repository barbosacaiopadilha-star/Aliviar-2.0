import { z } from "zod";

/**
 * O que a tela precisa provar antes de a operação tocar em dado de ninguém.
 *
 * O motivo é obrigatório nos três atos porque a porta do banco o exige
 * (`eliminar_titular` recusa motivo vazio) e porque a auditoria sem motivo não
 * é auditoria. O mínimo de 12 caracteres é o mesmo critério que a casa já usa
 * para eliminação de lead e retirada de profissional: "ok" não é motivo.
 */

const motivo = z
  .string()
  .trim()
  .min(12, "Escreva o motivo — ele fica na auditoria e é o que explica o ato depois.");

export const executarEliminacaoSchema = z.object({
  requestId: z.string().uuid(),
  profileId: z.string().uuid(),
  motivo,
  /**
   * O nome do titular, digitado à mão. Mesmo instrumento do
   * `delete_lead_permanently` e da retirada de profissional: um ato
   * irreversível não se dispara por um clique que se dá por engano.
   */
  confirmacao: z.string().min(1, "Digite o nome do titular para confirmar."),
});

export const registrarDesfechoSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["concluido", "recusado"]),
  desfecho: z
    .string()
    .trim()
    .min(12, "Escreva o que foi feito, ou a fundamentação da recusa — é a resposta que a pessoa recebe."),
});

export const assumirPedidoSchema = z.object({
  requestId: z.string().uuid(),
});

export type ExecutarEliminacaoInput = z.infer<typeof executarEliminacaoSchema>;
export type RegistrarDesfechoInput = z.infer<typeof registrarDesfechoSchema>;
