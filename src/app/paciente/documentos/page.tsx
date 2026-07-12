import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listPatientDocuments } from "@/modules/profiles";

import { Card, CardHeader } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Meus documentos</h1>
        <p className="text-sm text-ink-muted">
          Documentos que você compartilha com a Aliviar ficam guardados aqui, com acesso só seu e
          da nossa equipe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Seus arquivos</h2>
        </CardHeader>
        <PatientDocumentsPanel initialDocuments={documents} />
      </Card>
    </div>
  );
}
