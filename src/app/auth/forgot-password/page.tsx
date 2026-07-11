import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";

const errorMessages: Record<string, string> = {
  missing_email: "Informe seu e-mail.",
  invalid_link: "Link inválido ou expirado. Solicite um novo link.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? "Não foi possível enviar o e-mail." : null;
  const emailSent = params.sent === "1";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-ink">Recuperar senha</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Informe seu e-mail para receber o link de redefinição.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
            {errorMessage}
          </div>
        )}

        {emailSent ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--sage)] bg-[var(--sage-soft)] px-4 py-3 text-sm text-ink">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
            </div>
            <Link href="/login" className="btn-secondary block w-full text-center">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form action={requestPasswordResetAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                E-mail
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Enviar link de recuperação
            </button>
            <Link href="/login" className="btn-secondary block w-full text-center">
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
