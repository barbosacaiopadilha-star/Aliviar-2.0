import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import {
  getProfessionalProfile,
  setProfessionalPublicationStatusAction,
  setProfessionalStatusAction,
  updateProfessionalProfileAction,
} from "@/modules/profiles";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ProfessionalDocumentsPanel } from "@/components/profiles/professional-documents-panel";
import { ProfessionalProfileForm } from "@/components/profiles/professional-profile-form";
import { listProfessionalDocuments } from "@/modules/profiles/professional-document-repository";

export const metadata: Metadata = {
  title: "Editar profissional",
  robots: { index: false, follow: false },
};

type EditProfessionalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProfessionalPage({ params }: EditProfessionalPageProps) {
  await requireRole("administrador");
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const professional = await getProfessionalProfile(supabase, id);

  if (!professional) {
    notFound();
  }

  const documents = await listProfessionalDocuments(supabase, id);

  const nextStatus = professional.status === "ativo" ? "inativo" : "ativo";
  const nextPublicationStatus =
    professional.publicationStatus === "publicado" ? "nao_publicado" : "publicado";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-xl font-semibold text-ink sm:text-2xl">
                {professional.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={professional.status === "ativo" ? "sage" : "default"}>
                  {professional.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
                <Badge variant={professional.publicationStatus === "publicado" ? "gold" : "default"}>
                  {professional.publicationStatus === "publicado" ? "Publicado" : "Não publicado"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <form action={setProfessionalStatusAction.bind(null, id, nextStatus)}>
                <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                  {professional.status === "ativo" ? "Desativar" : "Ativar"}
                </Button>
              </form>
              <form action={setProfessionalPublicationStatusAction.bind(null, id, nextPublicationStatus)}>
                <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                  {professional.publicationStatus === "publicado" ? "Despublicar" : "Publicar"}
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>

        <ProfessionalProfileForm
          action={updateProfessionalProfileAction.bind(null, id)}
          submitLabel="Salvar alterações"
          initialDisplayName={professional.displayName}
          initialProfessionalIdentifier={professional.professionalIdentifier}
          initialCrm={professional.crm ?? ""}
          initialCrmUf={professional.crmUf ?? ""}
          initialProfessionalSummary={professional.professionalSummary ?? ""}
          initialInstitutionName={professional.institutionName ?? ""}
        />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Documentos</h2>
        </CardHeader>

        <ProfessionalDocumentsPanel professionalProfileId={id} initialDocuments={documents} />
      </Card>
    </div>
  );
}
