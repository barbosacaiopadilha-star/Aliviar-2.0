import Link from "next/link";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCases } from "@/modules/cases";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Curador Médico",
  robots: { index: false, follow: false },
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="lg">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-brand-primary-deep">{value}</p>
    </Card>
  );
}

export default async function CuradorDashboardPage() {
  const state = await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();

  // RLS já restringe a listagem aos casos atribuídos a este curador.
  const cases = await listCases(supabase);
  const waitingInfo = cases.filter((c) => c.status === "WAITING_FOR_INFORMATION").length;
  const readyForCuration = cases.filter((c) => c.status === "READY_FOR_CURATION").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">
          Olá, {state.profile?.displayName ?? "Curador Médico"}
        </h1>
        <p className="text-sm text-ink-muted">Seus casos atribuídos, em um só lugar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Casos atribuídos" value={cases.length} />
        <StatCard label="Aguardando informação" value={waitingInfo} />
        <StatCard label="Prontos para curadoria" value={readyForCuration} />
      </div>

      <Link
        href="/curador/casos"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Ver meus casos
      </Link>
    </div>
  );
}
