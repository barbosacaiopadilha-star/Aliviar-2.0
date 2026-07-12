import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres."),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
