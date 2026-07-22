import type { Metadata } from "next";

import { requestPatientMagicLinkAction } from "@/lib/actions/patient-auth";

export const metadata: Metadata = {
  title: "Entrar — Portal do Paciente",
  description: "Acesse sua jornada com link mágico.",
};

interface PortalEntrarPageProps {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    email?: string;
    redirect?: string;
  }>;
}

export default async function PortalEntrarPage({ searchParams }: PortalEntrarPageProps) {
  const params = await searchParams;
  const redirect = params.redirect ?? "/portal";

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-md px-6 py-16" data-testid="portal-entrar">
        <h1 className="font-serif text-3xl font-semibold text-ink">Portal do Paciente</h1>
        <p className="mt-3 text-ink-soft">
          Informe seu e-mail. Enviaremos um link seguro para continuar sua jornada.
        </p>

        {params.sent ? (
          <p className="mt-6 card p-4 text-sm text-ink-soft" data-testid="magic-link-sent">
            Se houver uma jornada associada a este e-mail, você receberá um link em instantes.
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-4 text-sm text-coral">Não foi possível continuar. Tente novamente.</p>
        ) : null}

        <form action={requestPatientMagicLinkAction} className="mt-8 space-y-4">
          <input type="hidden" name="redirect" value={redirect} />
          <label className="block">
            <span className="text-sm font-medium text-ink">E-mail</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={params.email ?? ""}
              className="mt-1 w-full rounded-lg border border-sage/30 px-4 py-3"
              data-testid="patient-email"
            />
          </label>
          <button type="submit" className="btn-primary w-full" data-testid="patient-magic-link">
            Receber link de acesso
          </button>
        </form>
      </main>
    </div>
  );
}
