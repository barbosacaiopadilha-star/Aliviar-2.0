"use client";

import { DocumentsPanel } from "@/components/profiles/documents-panel";
import {
  deletePatientDocumentAction,
  uploadPatientDocumentAction,
} from "@/modules/profiles/patient-document-actions";
import type { PatientDocument } from "@/modules/profiles/types";

type PatientDocumentsPanelProps = {
  initialDocuments: PatientDocument[];
};

export function PatientDocumentsPanel({ initialDocuments }: PatientDocumentsPanelProps) {
  return (
    <DocumentsPanel
      initialDocuments={initialDocuments}
      uploadAction={uploadPatientDocumentAction}
      onDelete={deletePatientDocumentAction}
      emptyTitle="Você ainda não enviou nenhum documento."
      emptyDescription="Quando quiser compartilhar um exame, laudo ou outro documento que ajude sua curadoria, envie por aqui — no seu tempo, sem obrigatoriedade."
    />
  );
}
