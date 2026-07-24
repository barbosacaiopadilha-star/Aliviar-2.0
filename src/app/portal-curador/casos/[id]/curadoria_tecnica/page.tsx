import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { MesaContextPanel } from "@/components/curadoria/mesa-context-panel";
import { MesaPriorityPanel } from "@/components/curadoria/mesa-priority-panel";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { PhaseNavigator } from "@/components/curadoria/phase-navigator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";

export const metadata: Metadata = {
  title: "Mesa de Curadoria",
  robots: { index: false, follow: false },
};

// MESA DE CURADORIA — MÓDULO 4 / MISSÃO 203
//
// Qual problema do Curador esta tela resolve?
//   "Tenho o Perfil validado e a rede aprovada. Como eu construo, com
//    julgamento próprio, as três opções que vou apresentar?"
//
// As cinco áreas da missão, sem troca de tela:
//   1. Contexto ................ MesaContextPanel  (coluna lateral, sempre visível)
//   2. Perfil de Prioridades ... MesaPriorityPanel (coluna lateral, sempre visível)
//   3. Médicos elegíveis ....... MesaWorkspace     (cartões da rede aprovada)
//   4. Comparação .............. MesaComparison    (lado a lado, sem ranking)
//   5. Parecer do Curador ...... MesaWorkspace     (editor por opção + composição)
//
// A Mesa só abre com o Perfil validado — a entrada da fase é verificada pelo
// Motor de Condução, nunca presumida aqui. Sem validação, a tela explica o que
// falta em vez de mostrar uma mesa vazia.
//
// Rastreabilidade: Fundamentos §13 (P6, P14), Ontologia §3.10 e §3.13,
// Engine §5.3, §5.5 e §11 (Barreira 4), Experience §3 e §6, AQS Q-10 e Q-11.

export default async function MesaCuradoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const definition = COS_PHASE_DEFINITIONS.CURADORIA_TECNICA;
  const phaseState = state.phases.find((entry) => entry.phase === "CURADORIA_TECNICA")!;
  const phaseAlerts = state.alerts.filter((alert) => alert.phase === "CURADORIA_TECNICA");
  const { analyses, excluded, computedAt } = record.curadoriaTecnica;

  const blocked = phaseState.status === "BLOQUEADA";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/portal-curador/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-ink">Mesa de Curadoria</h1>
        <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
          {definition.objective}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* min-w-0: item de grid tem min-width auto por padrão, o que impede
            a coluna de encolher e faz a tabela de comparação empurrar a
            página inteira no mobile. O scroll pertence à tabela, nunca ao
            corpo (Experience §4 — a página nunca rola na horizontal). */}
        <div className="min-w-0 space-y-6">
          {phaseAlerts.map((alert) => (
            <CaseAlert key={alert.code} {...alert} />
          ))}

          {blocked ? (
            <Card>
              <CardHeader>
                <CardTitle>A Mesa ainda não abre</CardTitle>
                <CardDescription>{phaseState.reason}</CardDescription>
              </CardHeader>
              <p className="max-w-reading text-sm leading-relaxed text-ink">
                A comparação só acontece depois que {record.patientFirstName} valida o Perfil de
                Prioridades. Sem o critério dele, qualquer análise seria a Aliviar decidindo com
                aparência de método.
              </p>
            </Card>
          ) : !computedAt ? (
            <Card>
              <CardHeader>
                <CardTitle>Comparação ainda não executada</CardTitle>
                <CardDescription>
                  O Perfil está validado — falta aplicar à rede aprovada.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <MesaWorkspace
              analyses={analyses}
              excluded={excluded}
              curatorName={record.curatorName}
              patientFirstName={record.patientFirstName}
            />
          )}
        </div>

        <aside className="space-y-6">
          <MesaContextPanel record={record} />
          <MesaPriorityPanel record={record} />
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-ink-muted">As nove fases</h2>
            <PhaseNavigator phases={state.phases} caseId={record.caseId} />
          </div>
        </aside>
      </div>

    </div>
  );
}
