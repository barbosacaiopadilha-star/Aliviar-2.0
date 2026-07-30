import type { Metadata } from "next";

import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listPatientDocuments } from "@/modules/profiles";

import { PatientDocumentsPanel } from "@/components/profiles/patient-documents-panel";

export const metadata: Metadata = {
  title: "Meus documentos",
  robots: { index: false, follow: false },
};

export default async function PatientDocumentsPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const documents = await listPatientDocuments(supabase, authState.user.id);

  return (
    <div className="space-y-10">
      <PatientPageHeader
        title="Meus documentos"
        description="Documentos que você compartilha com a Aliviar ficam guardados aqui, com acesso só seu e da nossa equipe."
      />

      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Seus arquivos</h2>
        <div className="mt-6">
          <PatientDocumentsPanel initialDocuments={documents} />
        </div>
      </PatientCard>
    </div>
  );
}
