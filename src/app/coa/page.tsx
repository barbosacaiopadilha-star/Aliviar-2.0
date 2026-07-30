import { redirect } from "next/navigation";

import { getAuthState } from "@/modules/auth/session";
import { canAccessCoaLevel } from "@/modules/coa/permissions";
import { COA_LEVEL_LABELS, type CoaLevel } from "@/modules/coa/types";
import { COA_SYSTEM_NAME } from "@/modules/coa/constants";
import Link from "next/link";

// ONE ALIVIAR (Problemas 3 e 4): o hub aponta para as JORNADAS auditadas de
// cada nível — a mesma filosofia de experiência em toda a plataforma. As
// telas de pipeline (/coa/atendimento, /coa/concierge) seguem montadas como
// ferramenta da plataforma CRM, alcançáveis pelo painel administrativo, mas
// deixam de competir como porta de entrada do trabalho diário.
const LEVEL_PATHS: Record<CoaLevel, string> = {
  ATENDIMENTO: "/atendimento",
  CURADORIA: "/coa/curadoria",
  CONCIERGE: "/acompanhamento",
};

export default async function CoaHubPage() {
  const auth = await getAuthState();
  if (!auth) redirect("/login?next=/coa");

  const accessibleLevels = (["ATENDIMENTO", "CURADORIA", "CONCIERGE"] as const).filter((level) =>
    canAccessCoaLevel(auth.roles, level),
  );

  if (accessibleLevels.length === 1) {
    redirect(LEVEL_PATHS[accessibleLevels[0]!]);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-content flex-col justify-center gap-8 px-4 py-16 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
          {COA_SYSTEM_NAME}
        </p>
        <h1 className="font-serif text-3xl text-ink">Escolha sua área operacional</h1>
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Cada nível possui fila, dashboard e permissões próprias. A Jornada do Assistido
          permanece única em todo o sistema.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {accessibleLevels.map((level) => (
          <Link
            key={level}
            href={LEVEL_PATHS[level]}
            className="rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <p className="text-xs uppercase tracking-wide text-ink-muted">Nível {level === "ATENDIMENTO" ? 1 : level === "CURADORIA" ? 2 : 3}</p>
            <p className="mt-2 font-serif text-xl text-ink">{COA_LEVEL_LABELS[level]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
