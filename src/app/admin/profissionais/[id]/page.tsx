import Link from "next/link";
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
  classificarLegadoDoProfissionalAction as classificarLegadoAction,
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
import { FormacaoAcademicaPanel } from "@/components/profiles/formacao-academica-panel";
import { MapaProfissionalPanel } from "@/components/profiles/mapa-profissional-panel";
import { ProfessionalDocumentsPanel } from "@/components/profiles/professional-documents-panel";
import {
  listarCurriculosComUltimaLeitura,
  listarFormacaoParaRevisao,
} from "@/modules/profiles/formacao-academica-repository";
import { ProfessionalProfileForm } from "@/components/profiles/professional-profile-form";
import { listProfessionalDocuments } from "@/modules/profiles/professional-document-repository";
import { loadProfessionalMap } from "@/modules/curadoria/mapa-profissional-repository";
import {
  PROFESSIONAL_WORKFLOW_STEPS,
  professionalWorkflowStepHref,
  resolveProfessionalWorkflowStep,
  type ProfessionalWorkflowStepId,
} from "@/modules/profiles/professional-workflow";

export const metadata: Metadata = {
  title: "Editar profissional",
  robots: { index: false, follow: false },
};

type EditProfessionalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ etapa?: string }>;
};

export default async function EditProfessionalPage({
  params,
  searchParams,
}: EditProfessionalPageProps) {
  await requireRole("administrador");
  const { id } = await params;
  const etapa = resolveProfessionalWorkflowStep((await searchParams).etapa);

  const supabase = await createServerSupabaseClient();
  const professional = await getProfessionalProfile(supabase, id);

  if (!professional) {
    notFound();
  }

  const nextStatus = professional.status === "ativo" ? "inativo" : "ativo";
  const indiceEtapa = PROFESSIONAL_WORKFLOW_STEPS.findIndex(
    (item) => item.id === etapa,
  );

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
                <Badge
                  variant={professional.status === "ativo" ? "sage" : "default"}
                >
                  {professional.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
                <Badge
                  variant={
                    professional.publicationStatus === "publicado"
                      ? "gold"
                      : "default"
                  }
                >
                  {professional.publicationStatus === "publicado"
                    ? "Publicado"
                    : "Não publicado"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <form
                action={setProfessionalStatusAction.bind(null, id, nextStatus)}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {professional.status === "ativo" ? "Desativar" : "Ativar"}
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
      </Card>

      <nav
        aria-label="Etapas do cadastro profissional"
        className="rounded-md border border-border bg-surface p-2"
      >
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {PROFESSIONAL_WORKFLOW_STEPS.map((item, index) => {
            const ativa = item.id === etapa;
            return (
              <li key={item.id}>
                <Link
                  href={professionalWorkflowStepHref(id, item.id)}
                  aria-current={ativa ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
                    ativa
                      ? "bg-brand-primary text-surface"
                      : "text-ink-muted hover:bg-recessed hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="text-sm text-ink-muted" role="status">
        Etapa {indiceEtapa + 1} de {PROFESSIONAL_WORKFLOW_STEPS.length}:{" "}
        {PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa]?.label}. Apenas esta etapa é
        carregada; seu trabalho nas demais permanece salvo.
      </p>

      {await renderEtapa({ etapa, id, professional, supabase })}

      <nav
        aria-label="Continuar cadastro profissional"
        className="flex flex-wrap justify-between gap-3"
      >
        {indiceEtapa > 0 ? (
          <Link
            href={professionalWorkflowStepHref(
              id,
              PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa - 1]!.id,
            )}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-ink hover:bg-recessed"
          >
            Voltar: {PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa - 1]!.label}
          </Link>
        ) : (
          <span />
        )}
        {indiceEtapa < PROFESSIONAL_WORKFLOW_STEPS.length - 1 ? (
          <Link
            href={professionalWorkflowStepHref(
              id,
              PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa + 1]!.id,
            )}
            className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-surface hover:bg-brand-primary-deep"
          >
            Continuar: {PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa + 1]!.label}
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

type Professional = NonNullable<
  Awaited<ReturnType<typeof getProfessionalProfile>>
>;
type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function renderEtapa({
  etapa,
  id,
  professional,
  supabase,
}: {
  etapa: ProfessionalWorkflowStepId;
  id: string;
  professional: Professional;
  supabase: SupabaseClient;
}) {
  if (etapa === "cadastro") {
    const competencyDomains = await listCompetencyDomains(supabase, id);
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Dados do profissional
          </h2>
          <p className="text-sm text-ink-muted">
            Identificação e informações básicas da Rede.
          </p>
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
    );
  }

  if (etapa === "publicacao") {
    const [practiceArea, criticalDivergences] = await Promise.all([
      getPracticeArea(supabase, id),
      countOpenCriticalDivergences(supabase, id),
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
    const nextPublicationStatus =
      professional.publicationStatus === "publicado"
        ? "nao_publicado"
        : "publicado";

    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Publicação
          </h2>
          <p className="text-sm text-ink-muted">
            Registro, área de atuação e divergências críticas são conferidos
            antes da publicação.
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
          publishAction={publishProfessionalAction.bind(
            null,
            id,
            nextPublicationStatus,
          )}
        />
      </Card>
    );
  }

  if (etapa === "rede") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Ciclo de vida
          </h2>
          <p className="text-sm text-ink-muted">
            Estado na Rede, motivo, autoria e impacto de cada mudança.
          </p>
        </CardHeader>
        <CicloDoProfissionalPanel
          cicloAtual={professional.ciclo}
          destinos={destinosPossiveis(professional.ciclo)}
          preverImpacto={preverImpactoDaTransicaoAction.bind(null, id)}
          mudarCiclo={mudarCicloDoProfissionalAction.bind(null, id)}
          classificarLegado={classificarLegadoAction.bind(null, id)}
        />
      </Card>
    );
  }

  if (etapa === "documentos") {
    const [documents, formacao, curriculos] = await Promise.all([
      listProfessionalDocuments(supabase, id),
      listarFormacaoParaRevisao(supabase, id),
      listarCurriculosComUltimaLeitura(supabase, id),
    ]);
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Documentos
          </h2>
        </CardHeader>
        <ProfessionalDocumentsPanel
          professionalProfileId={id}
          initialDocuments={documents}
        />
        <FormacaoAcademicaPanel
          professionalProfileId={id}
          entradas={formacao}
          curriculos={curriculos}
        />
      </Card>
    );
  }

  if (etapa === "protocolo") {
    const protocolDraft = await loadProtocolDraft(supabase, id);
    return (
      <ProtocoloPraticaForm
        initialResponses={protocolDraft.responses}
        lastSavedAt={protocolDraft.updatedAt}
        saveAction={saveProtocolDraftForProfessionalAction.bind(null, id)}
        submitAction={submitProtocolForProfessionalAction.bind(null, id)}
        mode="admin"
      />
    );
  }

  const mapa = await loadProfessionalMap(supabase, id);
  return (
    <MapaProfissionalPanel
      professionalProfileId={id}
      groups={mapa.groups}
      completion={mapa.completion}
    />
  );
}
