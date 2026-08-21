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
import { BotaoCicloDoProfissional } from "@/components/profiles/botao-ciclo-do-profissional";
import { CicloDoProfissionalPanel } from "@/components/profiles/ciclo-do-profissional-panel";
import { PublicationPanel } from "@/components/profiles/publication-panel";
import { ProtocoloPraticaForm } from "@/components/profissional/protocolo-pratica-form";
import {
  saveProtocolDraftForProfessionalAction,
  submitProtocolForProfessionalAction,
} from "@/modules/curadoria/protocolos-actions";
import { loadProtocolDraft } from "@/modules/curadoria/protocolos-repository";

import { Badge } from "@/components/ui/badge";
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
  params: Promise<{ id: string; etapa: string }>;
};

export default async function EditProfessionalPage({
  params,
}: EditProfessionalPageProps) {
  await requireRole("administrador");
  const { id, etapa: etapaBruta } = await params;
  const etapa = resolveProfessionalWorkflowStep(etapaBruta);

  const supabase = await createServerSupabaseClient();
  const professional = await getProfessionalProfile(supabase, id);

  if (!professional) {
    notFound();
  }

  const nextStatus = professional.status === "ativo" ? "inativo" : "ativo";

  /**
   * Publicado não se desativa por aqui — e o botão para de fingir que sim.
   *
   * O banco recusa, com a frase certa: "Publicar e despublicar são mudanças de
   * ciclo. Use a transição do ciclo de vida — `status` e `publication_status`
   * apenas a espelham." Enquanto o botão continuou visível, quem operava clicava
   * num ato impossível e recebia de volta um "Algo não saiu como esperado" — a
   * tela oferecendo o que o modelo proíbe, e escondendo o porquê.
   *
   * A saída legítima existe e é melhor: a etapa Ciclo de vida pede motivo e
   * registra autoria. É para lá que este cabeçalho aponta agora.
   */
  const publicado = professional.publicationStatus === "publicado";
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
              {publicado ? (
                <p className="max-w-reading text-sm text-ink-muted">
                  Publicado. Para tirar da Rede, use{" "}
                  <a
                    href={professionalWorkflowStepHref(id, "rede")}
                    className="font-medium text-brand-primary underline underline-offset-4"
                  >
                    Ciclo de vida
                  </a>{" "}
                  — lá a mudança pede motivo e fica com autoria.
                </p>
              ) : (
                <BotaoCicloDoProfissional
                  acao={setProfessionalStatusAction.bind(null, id, nextStatus)}
                  rotulo={professional.status === "ativo" ? "Desativar" : "Ativar"}
                />
              )}
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
                {/* NAVEGAÇÃO DE VERDADE (`<a>`), não `<Link>` — e de propósito.
                    Medido: depois de uma action, clicar num `<Link>` para uma
                    etapa AINDA NÃO VISITADA não navega. O payload chega, a URL
                    não muda, e a tela fica parada até recarregar à mão. Visitar
                    a etapa antes resolve; prefetch ligado ou desligado não muda
                    nada — só uma visita real aquece a rota.
                    Cada etapa busca dados próprios no servidor, então a
                    navegação cheia custa pouco aqui. E custa muito menos que um
                    fluxo de seis etapas que trava no meio do trabalho. */}
                <a
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
                </a>
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
        {/* `<a>` pelo mesmo motivo da barra de etapas — ver o comentário lá. */}
        {indiceEtapa > 0 ? (
          <a
            href={professionalWorkflowStepHref(
              id,
              PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa - 1]!.id,
            )}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-ink hover:bg-recessed"
          >
            Voltar: {PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa - 1]!.label}
          </a>
        ) : (
          <span />
        )}
        {indiceEtapa < PROFESSIONAL_WORKFLOW_STEPS.length - 1 ? (
          <a
            href={professionalWorkflowStepHref(
              id,
              PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa + 1]!.id,
            )}
            className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-surface hover:bg-brand-primary-deep"
          >
            Continuar: {PROFESSIONAL_WORKFLOW_STEPS[indiceEtapa + 1]!.label}
          </a>
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
    const [practiceArea, criticalDivergences, mapaDoProfissional] = await Promise.all([
      getPracticeArea(supabase, id),
      countOpenCriticalDivergences(supabase, id),
      loadProfessionalMap(supabase, id),
    ]);
    // F-9 · a porta diz o custo. Publicar sem Mapa continua permitido — mas
    // quem publica fica sabendo com quantas lacunas este perfil chega à Mesa,
    // em vez de o Curador descobrir na hora da Curadoria.
    const mapaAviso =
      mapaDoProfissional.completion.pending > 0
        ? `Este perfil entra na Mesa com ${mapaDoProfissional.completion.pending} de ${mapaDoProfissional.completion.total} subcritérios sem tratamento no Mapa — cada um vira lacuna na comparação. Dá para publicar assim; a etapa "Mapa" é onde isso se resolve.`
        : null;
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
          mapaAviso={mapaAviso}
          registration={{
            status: professional.registrationStatus,
            source: professional.registrationSource,
            verifiedAt: professional.registrationVerifiedAt,
          }}
          practiceArea={
            practiceArea
              ? {
                  rawText: practiceArea.rawText,
                  tags: practiceArea.tags,
                  source: practiceArea.source,
                  verified: practiceArea.verificationStatus === "verificado",
                  verifiedAt: practiceArea.verifiedAt,
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
