export const AUTH_ERROR_CODES = [
  "missing_credentials",
  "invalid_credentials",
  "no_active_profile",
  "inactive_profile",
  "invalid_role",
  "session_expired",
  "auth_unavailable",
  "unexpected_auth_error",
  "email_not_confirmed",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  missing_credentials: "Informe e-mail e senha.",
  invalid_credentials: "E-mail ou senha incorretos.",
  no_active_profile:
    "Seu usuário existe, mas ainda não possui acesso ativo ao Aliviar OS.",
  inactive_profile: "Seu acesso ao Aliviar OS está desativado.",
  invalid_role: "Seu perfil não possui um papel interno válido.",
  session_expired: "Sua sessão expirou. Entre novamente.",
  auth_unavailable: "Não foi possível concluir o acesso agora. Tente novamente.",
  unexpected_auth_error: "Ocorreu um erro inesperado durante o acesso.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
};

export function isAuthErrorCode(value: string): value is AuthErrorCode {
  return (AUTH_ERROR_CODES as readonly string[]).includes(value);
}

export function authErrorMessage(code: string): string {
  if (isAuthErrorCode(code)) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return AUTH_ERROR_MESSAGES.unexpected_auth_error;
}

export function buildLoginUrl(options: {
  error?: AuthErrorCode;
  redirect?: string;
  email?: string;
  reset?: string;
}): string {
  const params = new URLSearchParams();

  if (options.error) {
    params.set("error", options.error);
  }
  if (options.redirect) {
    params.set("redirect", options.redirect);
  }
  if (options.email) {
    params.set("email", options.email);
  }
  if (options.reset) {
    params.set("reset", options.reset);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function mapSupabaseSignInError(message: string): AuthErrorCode {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }
  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  return "auth_unavailable";
}
