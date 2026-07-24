import Link from "next/link";

import type { Metadata } from "next";

import { DashboardLayout, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCases } from "@/modules/cases";

export const metadata: Metadata = {
  title: "Curador Médico",
  robots: { index: false, follow: false },
};

export default async function CuradorDashboardPage() {
  const state = await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();

  const cases = await listCases(supabase);
  const waitingInfo = cases.filter((c) => c.status === "WAITING_FOR_INFORMATION").length;
  const readyForCuration = cases.filter((c) => c.status === "READY_FOR_CURATION").length;

  return (
    <DashboardLayout
      title={`Olá, ${state.profile?.displayName ?? "Curador Médico"}`}
      description="Seus casos atribuídos, em um só lugar."
      breadcrumbs={[{ label: "Dashboard", href: "/curador" }, { label: "Início" }]}
      primaryAction={
        <Link
          href="/curador/casos"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Ver meus casos
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Casos atribuídos" value={cases.length} href="/curador/casos" />
          <KpiCard label="Aguardando informação" value={waitingInfo} href="/curador/casos" />
          <KpiCard label="Prontos para curadoria" value={readyForCuration} href="/curador/casos" />
        </div>
      }
    />
  );
}
