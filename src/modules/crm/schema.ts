import { z } from "zod";

export const qualifyLeadInputSchema = z.object({
  leadId: z.string().uuid(),
  notes: z.string().trim().max(2000).optional(),
});

export type QualifyLeadInput = z.infer<typeof qualifyLeadInputSchema>;

/**
 * Conversão de lead em Patient.
 *
 * Ou se aponta para um paciente que já existe (`existingPatientProfileId`), ou
 * se informa nome e e-mail para criar um novo — nunca os dois. O refinamento
 * abaixo existe porque "criar mesmo já existindo" é exatamente como se produz
 * a duplicidade que este fluxo deveria impedir.
 */
export const convertLeadInputSchema = z
  .object({
    leadId: z.string().uuid(),
    existingPatientProfileId: z.string().uuid().optional(),
    email: z.string().email("E-mail inválido.").optional(),
    displayName: z.string().trim().min(1, "Informe o nome do paciente.").max(120).optional(),
    administrativeException: z.boolean().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => Boolean(v.existingPatientProfileId) !== Boolean(v.email && v.displayName), {
    message: "Escolha vincular a um paciente existente OU criar um novo — nunca os dois.",
  })
  .refine((v) => !v.administrativeException || (v.reason?.trim().length ?? 0) > 0, {
    message: "Uma exceção administrativa precisa de motivo registrado.",
    path: ["reason"],
  });

export type ConvertLeadInput = z.infer<typeof convertLeadInputSchema>;

export const openCaseInputSchema = z.object({
  leadId: z.string().uuid(),
  // O que a pessoa contou no primeiro contato. Vira a História que fundamenta
  // o Case — um Case não nasce sem que alguém tenha dito alguma coisa.
  initialStory: z.string().trim().max(4000).optional(),
});

export type OpenCaseInput = z.infer<typeof openCaseInputSchema>;
