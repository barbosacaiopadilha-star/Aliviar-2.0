import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getCase, listCaseEvents, listCaseNotes } from "@/modules/cases";
import { listArtifactsForCase, listExecutionEventsForCase, listExecutionsForCase } from "@/modules/concierge";
import { listActiveP002FieldCorrections } from "@/modules/ace/p002-field-corrections-repository";
import { getPatientAccount, getPatientProfile, getProfessionalDisplayNames } from "@/modules/profiles";
import { listStoryAttachments } from "@/modules/story/attachment-repository";
import { getStoryById } from "@/modules/story/repository";
import { listTeamMembers } from "@/modules/team/repository";
import { CASE_STATUS_LABELS } from "@/modules/cases/types";

import { AceExecutionsHistory } from "@/components/ace/ace-executions-history";
import { AceArtifactsList } from "@/components/cases/ace-artifacts-list";
import { AceShortlistViewer } from "@/components/cases/ace-shortlist-viewer";
import { CaseCuratorAssignment } from "@/components/cases/case-curator-assignment";
import { CaseEventsTimeline } from "@/components/cases/case-events-timeline";
import { CaseNotesLog } from "@/components/cases/case-notes-log";
import { CaseStatusControl } from "@/components/cases/case-status-control";
import { StorySummary } from "@/components/story/story-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";

export const metadata: Metadata = {
  title: "Detalhe do caso",
  robots: { index: false, follow: false },
};

type AdminCaseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCaseDetailPage({ params }: AdminCaseDetailPageProps) {
  await requireRole("administrador");
  const { id } = await params;

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  const caseDetail = await getCase(regularClient, id);
  if (!caseDetail) {
    notFound();
  }

  const [account, patientProfile, story, events, members, notes] = await Promise.all([
    getPatientAccount(regularClient, adminClient, caseDetail.patientProfileId),
    getPatientProfile(regularClient, caseDetail.patientProfileId),
    getStoryById(regularClient, caseDetail.sourceStoryId),
    listCaseEvents(regularClient, id),
    listTeamMembers(regularClient, adminClient),
    listCaseNotes(regularClient, id),
  ]);

  const attachments = story ? await listStoryAttachments(regularClient, story.id) : [];
  const curators = members
    .filter((member) => member.roles.includes("curador_medico"))
    .map((member) => ({ id: member.profileId, name: member.displayName }));

  const [executions, executionEvents, artifacts, p002Corrections] = await Promise.all([
    listExecutionsForCase(regularClient, id),
    listExecutionEventsForCase(regularClient, id),
    listArtifactsForCase(regularClient, id),
    listActiveP002FieldCorrections(regularClient, id),
  ]);

  const shortlistArtifact = artifacts.find((artifact) => artifact.artifactType === "Shortlist");
  const shortlist = shortlistArtifact ? (shortlistArtifact.payload as Shortlist) : null;
  const shortlistProviderIds = shortlist
    ? shortlist.status === "COMPOSED"
      ? shortlist.selectedProviderIds
      : shortlist.candidateProviderIds
    : [];
  const namesByProviderId = await getProfessionalDisplayNames(regularClient, shortlistProviderIds);


  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-sans text-2xl font-semibold text-ink">Caso de {caseDetail.patientName}</h1>
          <Badge variant={caseDetail.status === "DELIVERED" || caseDetail.status === "CLOSED" ? "sage" : "default"}>
            {CASE_STATUS_LABELS[caseDetail.status]}
          </Badge>
          <Link
            href={`/admin/casos/${caseDetail.id}/revisao`}
            className="text-sm font-medium text-brand-primary hover:text-brand-primary-deep"
          >
            Human Review →
          </Link>
        </div>
        <p className="text-sm text-ink-muted">
          Criado em {new Date(caseDetail.createdAt).toLocaleDateString("pt-BR")} — a história original nunca é
          alterada por este caso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Paciente</h2>
        </CardHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Nome</dt>
            <dd className="text-sm text-ink">{caseDetail.patientName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">E-mail</dt>
            <dd className="text-sm text-ink">{account?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Telefone</dt>
            <dd className="text-sm text-ink">{patientProfile?.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Cidade</dt>
            <dd className="text-sm text-ink">
              {patientProfile?.city ? `${patientProfile.city}${patientProfile.state ? `/${patientProfile.state}` : ""}` : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Status</h2>
          </CardHeader>
          <CaseStatusControl caseId={caseDetail.id} currentStatus={caseDetail.status} />
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Curador médico</h2>
          </CardHeader>
          <CaseCuratorAssignment
            caseId={caseDetail.id}
            currentCuratorId={caseDetail.assignedCuratorId}
            currentCuratorName={caseDetail.assignedCuratorName}
            curators={curators}
          />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">História original</h2>
          <p className="text-sm text-ink-muted">Somente leitura — o caso nunca altera a história do paciente.</p>
        </CardHeader>
        {story ? <StorySummary data={story.data} /> : <EmptyState title="História não encontrada." />}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Anexos</h2>
        </CardHeader>
        {attachments.length === 0 ? (
          <EmptyState title="Nenhum anexo vinculado a esta história." />
        ) : (
          <ul className="divide-y divide-border">
            {attachments.map((attachment) => (
              <li key={attachment.documentId} className="py-2 text-sm text-ink">
                {attachment.fileName}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Execução do ACE</h2>
          <p className="text-sm text-ink-muted">P001 a P008 apenas — nunca revisão humana (P009) ou entrega (P010).</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Execuções anteriores</h2>
          <p className="text-sm text-ink-muted">Todas as tentativas — nenhuma falha ou bloqueio desaparece do histórico.</p>
        </CardHeader>
        <AceExecutionsHistory executions={executions} events={executionEvents} detailBasePath="/admin/ace" />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Artefatos (P001-P008)</h2>
        </CardHeader>
        <AceArtifactsList artifacts={artifacts} caseId={caseDetail.id} p002Corrections={p002Corrections} />
      </Card>

      {shortlist ? (
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Shortlist interna</h2>
          </CardHeader>
          <AceShortlistViewer shortlist={shortlist} namesByProviderId={namesByProviderId} />
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Notas internas</h2>
        </CardHeader>
        <CaseNotesLog caseId={caseDetail.id} initialNotes={notes} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Linha do tempo</h2>
        </CardHeader>
        <CaseEventsTimeline events={events} />
      </Card>
    </div>
  );
}
