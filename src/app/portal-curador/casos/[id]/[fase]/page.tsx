import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { PhaseNavigator } from "@/components/curadoria/phase-navigator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import { COS_PHASES, COS_PHASE_LABELS, type CosPhaseId } from "@/modules/curadoria/cos/types";
import { CURADORIA_STEP_LABELS } from "@/modules/curadoria/types";

export const metadata: Metadata = {
  title: "Fase da Curadoria",
  robots: { index: false, follow: false },
};

// COS — TELA DE FASE
//
// Qual problema do Curador esta tela resolve?
//   "O que exatamente esta fase espera de mim, e por quê?"
//
// A tela é inteiramente dirigida por COS_PHASE_DEFINITIONS: objetivo, critérios
// de entrada e saída, informações obrigatórias e opcionais, artefatos, estados,
// validações, alertas, exceções e rastreabilidade vêm da definição canônica,
// nunca de texto escrito na tela. Mudar o Método muda esta tela — nunca o
// contrário.
//
// As telas de trabalho de cada fase (Módulos 2 a 6) nascem sobre esta base.

function isPhase(value: string): value is CosPhaseId {
  return (COS_PHASES as readonly string[]).includes(value);
}

export default async function FasePage({ params }: { params: Promise<{ id: string; fase: string }> }) {
  const { id, fase } = await params;
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);
  const phaseId = fase.toUpperCase();

  if (!record || !isPhase(phaseId)) {
    notFound();
  }

  const definition = COS_PHASE_DEFINITIONS[phaseId];
  const state = conduct(record);
  const phaseState = state.phases.find((entry) => entry.phase === phaseId)!;
  const phaseAlerts = state.alerts.filter((alert) => alert.phase === phaseId);
  const phaseInconsistencies = state.inconsistencies.filter((entry) => entry.phase === phaseId);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/portal-curador/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">{definition.label}</h1>
          <Badge variant={phaseState.status === "CONCLUIDA" ? "sage" : "default"}>
            {phaseState.status === "CONCLUIDA" ? "Concluída" : "Em aberto"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Fase {definition.order} de 9
          <span aria-hidden="true"> · </span>
          raciocínio: {CURADORIA_STEP_LABELS[definition.reasoningStep]}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Objetivo</CardTitle>
            </CardHeader>
            <p className="max-w-reading text-base leading-relaxed text-ink">{definition.objective}</p>
          </Card>

          {phaseAlerts.length > 0 || phaseInconsistencies.length > 0 ? (
            <div className="space-y-3">
              {phaseAlerts.map((alert) => (
                <CaseAlert key={alert.code} {...alert} />
              ))}
              {phaseInconsistencies.map((entry) => (
                <CaseAlert
                  key={`${entry.code}-${entry.description}`}
                  code={entry.code}
                  title="Inconsistência"
                  detail={entry.description}
                  severity="bloqueio"
                />
              ))}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>O que esta fase espera</CardTitle>
              <CardDescription>
                {phaseState.missing.length === 0
                  ? "Tudo atendido."
                  : `${phaseState.missing.length} ${phaseState.missing.length === 1 ? "item em aberto" : "itens em aberto"}.`}
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2">
              {definition.exitCriteria.map((criterion) => {
                const met = criterion.isMet(record);
                return (
                  <li key={criterion.id} className="flex items-baseline gap-2 text-sm">
                    <span aria-hidden="true" className={met ? "text-brand-sage" : "text-ink-muted"}>
                      {met ? "✓" : "○"}
                    </span>
                    <span className={met ? "text-ink-muted line-through" : "text-ink"}>
                      {criterion.description}
                    </span>
                    <span className="sr-only">{met ? "(atendido)" : "(em aberto)"}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações obrigatórias</CardTitle>
              </CardHeader>
              {definition.requiredInformation.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Nenhuma — nesta fase, ausência de informação também é um resultado válido.
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-ink">
                  {definition.requiredInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações opcionais</CardTitle>
              </CardHeader>
              <ul className="space-y-1 text-sm text-ink-muted">
                {definition.optionalInformation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regras que valem aqui</CardTitle>
              <CardDescription>
                Vindas dos documentos canônicos — nunca escritas nesta tela.
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2 text-sm leading-relaxed text-ink">
              {definition.validations.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>De onde estas regras vieram</CardTitle>
              <CardDescription>
                Toda tela do COS consegue apontar o documento que a originou.
              </CardDescription>
            </CardHeader>
            <ul className="space-y-3">
              {definition.traceability.map((citation) => (
                <li key={`${citation.source}-${citation.section}-${citation.rule}`} className="text-sm">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    {citation.source} {citation.section}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-ink">{citation.rule}</p>
                </li>
              ))}
            </ul>
          </Card>

          {definition.artifacts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Artefatos produzidos</CardTitle>
              </CardHeader>
              <ul className="space-y-1 text-sm text-ink">
                {definition.artifacts.map((artifact) => (
                  <li key={artifact}>{artifact}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-ink-muted">As nove fases</h2>
          <PhaseNavigator phases={state.phases} caseId={record.caseId} />
          <p className="pt-2 text-xs leading-relaxed text-ink-muted">
            A tela de trabalho de {COS_PHASE_LABELS[phaseId]} chega nos próximos módulos. Esta é a
            definição operacional que ela vai materializar.
          </p>
        </aside>
      </div>
    </div>
  );
}
