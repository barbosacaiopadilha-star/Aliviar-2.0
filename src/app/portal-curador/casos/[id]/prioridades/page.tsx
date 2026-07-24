import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { PhaseNavigator } from "@/components/curadoria/phase-navigator";
import { PriorityBuilder } from "@/components/curadoria/priority-builder";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import type { PriorityCriterion } from "@/modules/curadoria/types";

export const metadata: Metadata = {
  title: "Perfil de Prioridades",
  robots: { index: false, follow: false },
};

// MÓDULO 3 — PERFIL DE PRIORIDADES
//
// Qual problema do Curador esta tela resolve?
//   "Como eu transformo o que essa pessoa me disse em critérios que ela
//    reconheça como dela?"
//
// As quatro perguntas de qualidade (MISSÃO 102):
//   • Reduz ansiedade? O total e o que falta ficam ditos em linguagem natural,
//     nunca como um contador que pressiona.
//   • Reduz esforço cognitivo? A barra de proporção é o próprio controle — o
//     Curador não procura campo, não converte número em ideia.
//   • Aumenta clareza? Cada peso carrega a pergunta que o origina e a fala que
//     o sustenta, lado a lado.
//   • Torna o Método mais fácil? A liturgia da validação está escrita na tela,
//     como roteiro — o Curador não precisa lembrar dos quatro passos.
//   • Transmite confiança? Nada autoajusta, nada sugere, nada decide.
//
// Rastreabilidade: Fundamentos §10 e §13 (P5), Ontologia §3.6, Engine §5.2,
// Experience §2.3 e §6.

// Mapeia um filtro obrigatório ao critério equivalente, para que a tela consiga
// mostrar o conflito da Invariante 24 no lugar onde ele acontece.
const FILTER_KIND_TO_CRITERION: Record<string, PriorityCriterion> = {
  AREA_DE_ATUACAO: "AREA_DE_ATUACAO",
  UF: "LOCALIZACAO",
  CUIDADO_CONTINUO: "CONTINUIDADE",
  DISPONIBILIDADE_IMEDIATA: "DISPONIBILIDADE",
};

export default async function PrioridadesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const definition = COS_PHASE_DEFINITIONS.PRIORIDADES;
  const inconsistencies = state.inconsistencies.filter((entry) => entry.phase === "PRIORIDADES");

  const filterCriteria = record.filtros
    .map((filtro) => FILTER_KIND_TO_CRITERION[filtro.kind])
    .filter((criterion): criterion is PriorityCriterion => Boolean(criterion));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/coa/curadoria/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-ink">Perfil de Prioridades</h1>
        <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
          {definition.objective}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {inconsistencies.map((entry) => (
            <CaseAlert
              key={`${entry.code}-${entry.description}`}
              code={entry.code}
              title="Inconsistência"
              detail={entry.description}
              severity="bloqueio"
            />
          ))}

          {record.priorityProfileId ? (
            <PriorityBuilder
              patientFirstName={record.patientFirstName}
              priorityProfileId={record.priorityProfileId}
              initialWeights={record.prioridades.weights.map((weight) => ({
                criterion: weight.criterion,
                weight: weight.weight,
                evidence: weight.evidence,
              }))}
              filterCriteria={filterCriteria}
              validated={Boolean(record.validacao)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Perfil ainda não iniciado</CardTitle>
                <CardDescription>
                  O Perfil de Prioridades precisa ser criado antes desta etapa.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>O que {record.patientFirstName} exigiu</CardTitle>
              <CardDescription>
                Filtros obrigatórios eliminam. Nunca recebem peso.
              </CardDescription>
            </CardHeader>
            {record.filtros.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nenhum requisito inegociável — e isso é um resultado válido.
              </p>
            ) : (
              <ul className="space-y-3">
                {record.filtros.map((filtro) => (
                  <li key={filtro.id}>
                    <p className="text-sm font-medium text-ink">
                      {/* Um filtro booleano já é afirmação pelo próprio rótulo:
                          "Oferece acompanhamento contínuo" — nunca ": true". */}
                      {filtro.value === "true" ? filtro.label : `${filtro.label}: ${filtro.value}`}
                    </p>
                    <p className="mt-0.5 border-l-2 border-border pl-2 text-sm italic leading-relaxed text-ink-muted">
                      {filtro.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {record.prioridades.observations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
                <CardDescription>Nas palavras dele, sem virar critério.</CardDescription>
              </CardHeader>
              <ul className="space-y-2 text-sm leading-relaxed text-ink-muted">
                {record.prioridades.observations.map((observation) => (
                  <li key={observation}>{observation}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-ink-muted">As nove fases</h2>
            <PhaseNavigator phases={state.phases} caseId={record.caseId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
