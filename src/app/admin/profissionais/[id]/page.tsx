import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import {
  getProfessionalProfile,
  listCompetencyDomains,
  setProfessionalStatusAction,
  updateProfessionalProfileAction,
} from "@/modules/profiles";
import {
  publishProfessionalAction,
  savePracticeAreaAction,
  verifyRegistrationAction,
} from "@/modules/profiles/professional-actions";
import {
  countOpenCriticalDivergences,
  getPracticeArea,
} from "@/modules/profiles/professional-repository";
import { listPublicationPendencies } from "@/modules/profiles/publication-pendencies";
import { destinosPossiveis } from "@/modules/profiles/ciclo-do-profissional";
import {
  mudarCicloDoProfissionalAction,
  preverImpactoDaTransicaoAction,
} from "@/modules/profiles/ciclo-do-profissional-actions";
import { CicloDoProfissionalPanel } from "@/components/profiles/ciclo-do-profissional-panel";
import { PublicationPanel } from "@/components/profiles/publication-panel";
import { ProtocoloPraticaForm } from "@/components/profissional/protocolo-pratica-form";
import {
  saveProtocolDraftForProfessionalAction,
  submitProtocolForProfessionalAction,
} from "@/modules/curadoria/protocolos-actions";
import { loadProtocolDraft } from "@/modules/curadoria/protocolos-repository";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { MapaProfissionalPanel } from "@/components/profiles/mapa-profissional-panel";
import { ProfessionalDocumentsPanel } from "@/components/profiles/professional-documents-panel";
import { ProfessionalProfileForm } from "@/components/profiles/professional-profile-form";
import { listProfessionalDocuments } from "@/modules/profiles/professional-document-repository";
import { loadProfessionalMap } from "@/modules/curadoria/mapa-profissional-repository";

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
  const competencyDomains = professional ? await listCompetencyDomains(supabase, id) : [];

  if (!professional) {
    notFound();
  }

  const [documents, mapa, practiceArea, criticalDivergences, protocolDraft] = await Promise.all([
    listProfessionalDocuments(supabase, id),
    loadProfessionalMap(supabase, id),
    getPracticeArea(supabase, id),
    countOpenCriticalDivergences(supabase, id),
    loadProtocolDraft(supabase, id),
  ]);

  const pendencies = listPublicationPendencies({
    professional,
    practiceArea: practiceArea
      ? {
          rawText: practiceArea.rawText,
          tags: practiceArea.tags,
          verificationStatus: practiceArea.verificationStatus,
        }
      : null,
    openCriticalDivergences: criticalDivergences,
  });

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
          initialExperienceLevel={professional.experienceLevel ?? ""}
          initialIntakeApproach={professional.intakeApproach ?? ""}
          initialOffersContinuousCare={professional.offersContinuousCare}
          initialAvailabilityWindow={professional.availabilityWindow ?? ""}
          initialCompetencyDomains={competencyDomains}
        />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Publicação</h2>
          <p className="text-sm text-ink-muted">
            Publicar é uma porta com condições: registro verificado, área de atuação verificada e
            cadastro sem divergência crítica. O que faltar aparece aqui, com o caminho de correção.
          </p>
        </CardHeader>
        <PublicationPanel
          isPublished={professional.publicationStatus === "publicado"}
          pendencies={pendencies}
          registration={{
            status: professional.registrationStatus,
            source: professional.registrationSource,
          }}
          practiceArea={
            practiceArea
              ? {
                  rawText: practiceArea.rawText,
                  tags: practiceArea.tags,
                  source: practiceArea.source,
                  verified: practiceArea.verificationStatus === "verificado",
                }
              : null
          }
          verifyRegistrationAction={verifyRegistrationAction.bind(null, id)}
          savePracticeAreaAction={savePracticeAreaAction.bind(null, id)}
          publishAction={publishProfessionalAction.bind(null, id, nextPublicationStatus)}
        />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Ciclo de vida</h2>
          <p className="text-sm text-ink-muted">
            Onde este profissional está na Rede, e por quê. Toda mudança de estado tem motivo, autor e
            data — e o impacto aparece antes da confirmação, nunca depois.
          </p>
        </CardHeader>
        <CicloDoProfissionalPanel
          cicloAtual={professional.ciclo}
          destinos={destinosPossiveis(professional.ciclo)}
          preverImpacto={async (para) => preverImpactoDaTransicaoAction(id, para)}
          mudarCiclo={async (pedido) => mudarCicloDoProfissionalAction({ profissionalId: id, ...pedido })}
        />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Documentos</h2>
        </CardHeader>

        <ProfessionalDocumentsPanel professionalProfileId={id} initialDocuments={documents} />
      </Card>

      {/* O Catálogo 1.0.0 no cadastro (ETAPA 5): o mesmo Protocolo da Prática
          que o profissional preenche sozinho, agora registrável pela equipe —
          a proveniência diz quem coletou. Uma única fonte: PRACTICE_CATALOG,
          espelho validado do catálogo ativo no banco. */}
      <ProtocoloPraticaForm
        initialResponses={protocolDraft.responses}
        lastSavedAt={protocolDraft.updatedAt}
        saveAction={saveProtocolDraftForProfessionalAction.bind(null, id)}
        submitAction={submitProtocolForProfessionalAction.bind(null, id)}
        mode="admin"
      />

      {/* O outro lado do Mapa de Prioridades do Case (ADR-039). Dado
          operacional interno: existir aqui não publica ninguém e não altera o
          estado editorial. */}
      <MapaProfissionalPanel
        professionalProfileId={id}
        groups={mapa.groups}
        completion={mapa.completion}
      />
    </div>
  );
}
