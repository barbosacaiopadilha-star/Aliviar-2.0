import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { CASE_STATUS_LABELS, getCase, listCaseEvents } from "@/modules/cases";
import {
  getFinalCuradoriaDeliveryForCase,
  listArtifactsForCase,
  listExecutionEventsForCase,
  listExecutionsForCase,
  listHumanReviewResultsForCase,
} from "@/modules/concierge";
import { getProfessionalDisplayNames } from "@/modules/profiles";
import { listStoryAttachments } from "@/modules/story/attachment-repository";
import { getStoryById } from "@/modules/story/repository";

import { isEssentiallyQualified, type CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";

import { AceExecutionsHistory } from "@/components/ace/ace-executions-history";
import { FinalCuradoriaDeliveryPanel } from "@/components/ace/final-curadoria-delivery-panel";
import { HumanReviewForm } from "@/components/ace/human-review-form";
import { HumanReviewHistory } from "@/components/ace/human-review-history";
import { AceArtifactsList } from "@/components/cases/ace-artifacts-list";
import { AceShortlistViewer } from "@/components/cases/ace-shortlist-viewer";
import { CaseEventsTimeline } from "@/components/cases/case-events-timeline";
import { StorySummary } from "@/components/story/story-summary";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Human Review",
  robots: { index: false, follow: false },
};

type CuradorHumanReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CuradorHumanReviewPage({ params }: CuradorHumanReviewPageProps) {
  await requireRole("curador_medico");
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const caseDetail = await getCase(supabase, id);
  if (!caseDetail) {
    notFound();
  }

  const [story, events, executions, executionEvents, artifacts, reviewResults, delivery] = await Promise.all([
    getStoryById(supabase, caseDetail.sourceStoryId),
    listCaseEvents(supabase, id),
    listExecutionsForCase(supabase, id),
    listExecutionEventsForCase(supabase, id),
    listArtifactsForCase(supabase, id),
    listHumanReviewResultsForCase(supabase, id),
    getFinalCuradoriaDeliveryForCase(supabase, id),
  ]);
  const attachments = story ? await listStoryAttachments(supabase, story.id) : [];

  const shortlistArtifact = artifacts.find((artifact) => artifact.artifactType === "Shortlist");
  const compatibilityMatrixArtifact = artifacts.find((artifact) => artifact.artifactType === "CompatibilityMatrix");
  const shortlist = shortlistArtifact ? (shortlistArtifact.payload as Shortlist) : null;
  const compatibilityMatrix = compatibilityMatrixArtifact ? (compatibilityMatrixArtifact.payload as CompatibilityMatrix) : null;

  const relevantProviderIds = new Set<string>();
  if (shortlist) {
    for (const id of shortlist.status === "COMPOSED" ? shortlist.selectedProviderIds : shortlist.candidateProviderIds) {
      relevantProviderIds.add(id);
    }
  }
  if (compatibilityMatrix) {
    for (const entry of compatibilityMatrix.entries) relevantProviderIds.add(entry.providerId);
  }
  for (const result of reviewResults) {
    for (const id of result.approvedProviderIds) relevantProviderIds.add(id);
    for (const change of result.changes) relevantProviderIds.add(change.providerId);
  }
  const namesByProviderId = await getProfessionalDisplayNames(supabase, Array.from(relevantProviderIds));
  const qualifiedProviderIds = compatibilityMatrix
    ? compatibilityMatrix.entries.filter(isEssentiallyQualified).map((entry) => entry.providerId)
    : [];

  const alreadyValidated = reviewResults.some((result) => result.reviewStatus === "VALIDATED");
  const canReview = caseDetail.status === "HUMAN_REVIEW" && !alreadyValidated && Boolean(shortlist) && Boolean(compatibilityMatrix);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/curador/casos/${id}`} className="text-sm text-brand-primary hover:text-brand-primary-deep">
          ← Voltar para o Caso
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-sans text-2xl font-semibold text-ink">Human Review — {caseDetail.patientName}</h1>
          <Badge>{CASE_STATUS_LABELS[caseDetail.status]}</Badge>
        </div>
        <p className="text-sm text-ink-muted">
          O ACE nunca toma a decisão final — a decisão pertence a quem revisa. Toda ação aqui é rastreável, auditável,
          versionada e explicável.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">História original</h2>
        </CardHeader>
        {story ? <StorySummary data={story.data} /> : <EmptyState title="História não encontrada." />}
        {attachments.length > 0 ? (
          <ul className="mt-3 divide-y divide-border border-t border-border pt-3">
            {attachments.map((attachment) => (
              <li key={attachment.documentId} className="py-2 text-sm text-ink">
                {attachment.fileName}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Execução do ACE</h2>
        </CardHeader>
        <AceExecutionsHistory executions={executions} events={executionEvents} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Shortlist</h2>
        </CardHeader>
        {shortlist ? (
          <AceShortlistViewer shortlist={shortlist} namesByProviderId={namesByProviderId} />
        ) : (
          <EmptyState title="Nenhuma Shortlist disponível para este caso." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Artefatos relevantes (P001-P008)</h2>
        </CardHeader>
        <AceArtifactsList artifacts={artifacts} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Linha do tempo completa</h2>
        </CardHeader>
        <CaseEventsTimeline events={events} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Decisão do Human Review</h2>
        </CardHeader>

        {canReview && shortlist && compatibilityMatrix ? (
          <HumanReviewForm
            caseId={id}
            shortlist={shortlist}
            compatibilityMatrix={compatibilityMatrix}
            qualifiedProviderIds={qualifiedProviderIds}
            namesByProviderId={namesByProviderId}
          />
        ) : (
          <Alert variant={alreadyValidated ? "success" : "info"}>
            {alreadyValidated
              ? "Este caso já tem uma curadoria validada — veja a entrega logo abaixo."
              : `Este caso não está em revisão humana no momento (status atual: ${CASE_STATUS_LABELS[caseDetail.status]}).`}
          </Alert>
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Entrega da Curadoria</h2>
          <p className="text-sm text-ink-muted">Última etapa — o paciente só vê a Curadoria depois deste passo.</p>
        </CardHeader>
        <FinalCuradoriaDeliveryPanel caseId={id} canDeliver={alreadyValidated && !delivery} delivery={delivery} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Histórico de decisões humanas</h2>
        </CardHeader>
        <HumanReviewHistory results={reviewResults} namesByProviderId={namesByProviderId} />
      </Card>
    </div>
  );
}
