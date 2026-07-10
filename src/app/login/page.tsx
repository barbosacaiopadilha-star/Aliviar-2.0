import { signInAction } from "@/lib/actions/auth";

const errorMessages: Record<string, string> = {
  missing_credentials: "Informe e-mail e senha.",
  invalid_credentials: "E-mail ou senha inválidos.",
  no_active_profile: "Seu usuário não possui perfil interno ativo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? "Não foi possível entrar." : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-ink">Aliviar OS</h1>
          <p className="mt-2 text-sm text-ink-soft">Acesso interno para colaboradores autorizados</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
            {errorMessage}
          </div>
        )}

        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="redirect" value={params.redirect ?? "/workspace"} />
          <div>
            <label htmlFor="email" className="field-label">
              E-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
