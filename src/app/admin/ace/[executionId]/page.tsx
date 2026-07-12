import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases";
import {
  ACE_EXECUTION_STATUS_LABELS,
  getExecution,
  listArtifactsForCase,
  listExecutionEvents,
} from "@/modules/concierge";

import { AceExecutionTimeline } from "@/components/ace/ace-execution-timeline";
import { AceArtifactsList } from "@/components/cases/ace-artifacts-list";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Detalhe da execução",
  robots: { index: false, follow: false },
};

type AdminAceExecutionDetailPageProps = {
  params: Promise<{ executionId: string }>;
};

export default async function AdminAceExecutionDetailPage({ params }: AdminAceExecutionDetailPageProps) {
  await requireRole("administrador");
  const { executionId } = await params;

  const supabase = await createServerSupabaseClient();
  const execution = await getExecution(supabase, executionId);
  if (!execution) {
    notFound();
  }

  const [kase, events, artifacts] = await Promise.all([
    getCase(supabase, execution.caseId),
    listExecutionEvents(supabase, executionId),
    listArtifactsForCase(supabase, execution.caseId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ace" className="text-sm text-brand-primary hover:text-brand-primary-deep">
          ← Voltar para Observabilidade do ACE
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Execução de {kase?.patientName ?? "paciente não encontrado"}
          </h1>
          <Badge>{ACE_EXECUTION_STATUS_LABELS[execution.status]}</Badge>
        </div>
        <p className="text-sm text-ink-muted">
          Iniciada por {execution.startedByName} em {new Date(execution.startedAt).toLocaleString("pt-BR")}
          {execution.finishedAt ? ` · finalizada em ${new Date(execution.finishedAt).toLocaleString("pt-BR")}` : ""}
          {kase ? (
            <>
              {" · "}
              <Link href={`/admin/casos/${kase.id}`} className="text-brand-primary hover:text-brand-primary-deep">
                Ver Caso
              </Link>
            </>
          ) : null}
        </p>
      </div>

      {execution.failureMessage ? (
        <Alert variant={execution.status === "BLOCKED" ? "warning" : "error"}>{execution.failureMessage}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Timeline completa</h2>
        </CardHeader>
        <AceExecutionTimeline events={events} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Artefatos do caso (P001-P008)</h2>
          <p className="text-sm text-ink-muted">
            Inclui artefatos reaproveitados de tentativas anteriores — um artefato válido nunca é recalculado.
          </p>
        </CardHeader>
        <AceArtifactsList artifacts={artifacts} />
      </Card>
    </div>
  );
}
