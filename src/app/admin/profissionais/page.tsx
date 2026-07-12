import Link from "next/link";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listProfessionalProfiles } from "@/modules/profiles";

import { ProfessionalsTable } from "@/components/profiles/professionals-table";

export const metadata: Metadata = {
  title: "Profissionais",
  robots: { index: false, follow: false },
};

export default async function ProfessionalListPage() {
  await requireRole("administrador");
  const supabase = await createServerSupabaseClient();
  const professionals = await listProfessionalProfiles(supabase);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">Profissionais</h1>
          <p className="text-sm text-ink-muted">
            Cadastro administrativo da Rede Aliviar — criado e mantido pela equipe, nunca por
            autocadastro.
          </p>
        </div>
        <Link
          href="/admin/profissionais/novo"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
        >
          Novo profissional
        </Link>
      </div>

      <ProfessionalsTable professionals={professionals} />
    </div>
  );
}
