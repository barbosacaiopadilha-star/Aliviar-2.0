"use client";

import { DocumentsPanel } from "@/components/profiles/documents-panel";
import {
  deleteProfessionalDocumentAction,
  uploadProfessionalDocumentAction,
} from "@/modules/profiles/professional-document-actions";
import type { ProfessionalDocument } from "@/modules/profiles/types";

type ProfessionalDocumentsPanelProps = {
  professionalProfileId: string;
  initialDocuments: ProfessionalDocument[];
};

export function ProfessionalDocumentsPanel({
  professionalProfileId,
  initialDocuments,
}: ProfessionalDocumentsPanelProps) {
  return (
    <DocumentsPanel
      initialDocuments={initialDocuments}
      uploadAction={uploadProfessionalDocumentAction.bind(null, professionalProfileId)}
      onDelete={(documentId) => deleteProfessionalDocumentAction(professionalProfileId, documentId)}
      emptyTitle="Nenhum documento enviado ainda."
      emptyDescription="Envie diploma, certificado ou comprovante deste profissional."
    />
  );
}
