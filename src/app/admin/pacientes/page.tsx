import Link from "next/link";

import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listPatientAccounts } from "@/modules/profiles";

import { PatientsTable } from "@/components/profiles/patients-table";

export const metadata: Metadata = {
  title: "Assistidos",
  robots: { index: false, follow: false },
};

export default async function PatientListPage() {
  await requireRole("administrador");
  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();
  const patients = await listPatientAccounts(regularClient, adminClient);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">Assistidos</h1>
          <p className="text-sm text-ink-muted">
            A equipe Aliviar realiza o cadastro inicial — não existe cadastro público de assistido.
          </p>
        </div>
        <Link
          href="/admin/pacientes/novo"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
        >
          Novo assistido
        </Link>
      </div>

      <PatientsTable patients={patients} />
    </div>
  );
}
