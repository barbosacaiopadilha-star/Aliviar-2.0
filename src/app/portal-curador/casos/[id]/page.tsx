import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { AlignmentCapture } from "@/components/curadoria/alignment-capture";
import { ConductionPanel } from "@/components/curadoria/conduction-panel";
import { CuradoriaBriefing } from "@/components/curadoria/curadoria-briefing";
import { ObservationCapture } from "@/components/curadoria/observation-capture";
import { loadBriefing } from "@/modules/briefing/repository";
import { MemoryTimeline, ReconstructionReport } from "@/components/curadoria/memory-timeline";
import { JourneyNavigator } from "@/components/curadoria/journey-navigator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildMemory, runReconstructionTest } from "@/modules/curadoria/cos/memory";
import { buildCuratorJourney } from "@/modules/curadoria/cos/journey";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

export const metadata: Metadata = {
  title: "Curadoria",
  robots: { index: false, follow: false },
};

// COS — ESTAÇÃO DE TRABALHO DA CURADORIA
//
// Qual problema do Curador esta tela resolve?
//   "Eu abri este caso. Onde eu parei, o que falta, e o que eu faço agora?"
//
// É a superfície do Motor de Condução: as cinco respostas em cima, as nove
// fases no meio, a Memória embaixo. O Curador nunca precisa lembrar do Método —
// o Portal conduz o Método para que ele possa conduzir o paciente.

export default async function CasoWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authState = await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const journey = buildCuratorJourney(record, state);
  const memory = buildMemory(record);
  const reconstruction = runReconstructionTest(record);

  // BRIEFING DA CURADORIA — camada de contexto, acrescentada ao workspace.
  // As opções vêm do Relatório já construído pela Curadoria: o Briefing
  // NUNCA seleciona nem reordena profissional — ele recebe quem já está em
  // avaliação e só descreve o encontro entre o que cada um declarou.
  const nomesPorId = new Map(
    record.curadoriaTecnica.analyses.map((analise) => [analise.professionalId, analise.professionalName] as const),
  );
  const professionalsInReview = record.relatorio.options
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((option) => ({
      profileId: option.professionalId,
      displayName: nomesPorId.get(option.professionalId) ?? "Profissional",
    }));

  const briefing = await loadBriefing(
    supabase,
    record.caseId,
    record.patientName.split(/\s+/)[0] ?? record.patientName,
    professionalsInReview,
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/coa/curadoria"
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← Painel
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-ink">{record.patientName}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Caso aberto em {new Date(record.openedAt).toLocaleDateString("pt-BR")}
          {record.promisedReturn
            ? ` · retorno combinado para ${new Date(record.promisedReturn).toLocaleDateString("pt-BR")}`
            : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <ConductionPanel state={state} caseId={record.caseId} journey={journey} />

          {/* Contexto para a apresentação. Vem depois do Motor de Condução
              (o que fazer agora) e antes da história — é o que o Curador
              consulta quando vai conversar com a pessoa. */}
          <CuradoriaBriefing data={briefing} />

          {/* As duas superfícies de captura ficam DEPOIS do Briefing: o Curador
              primeiro vê o contexto que já existe, e só então registra o que
              acabou de escutar. Registrar nunca é etapa obrigatória. */}
          <AlignmentCapture
            caseId={record.caseId}
            patientFirstName={record.patientFirstName}
            answers={briefing.patientAnswers}
          />

          <ObservationCapture
            caseId={record.caseId}
            observations={briefing.observations}
            viewerId={authState.user.id}
          />

          {record.historia.narrative ? (
            <Card>
              <CardHeader>
                <CardTitle>A história de {record.patientFirstName}</CardTitle>
                <CardDescription>
                  Como o Curador a compreendeu — nunca um questionário preenchido.
                </CardDescription>
              </CardHeader>
              <p className="max-w-reading text-sm leading-relaxed text-ink">
                {record.historia.narrative}
              </p>
              {record.historia.motivation ? (
                <p className="mt-3 max-w-reading border-l-2 border-brand-gold/50 pl-3 text-sm italic leading-relaxed text-ink-muted">
                  {record.historia.motivation}
                </p>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Memória da Curadoria</CardTitle>
              <CardDescription>
                Tudo o que aconteceu, com autor e instante. Toda decisão precisa ser reconstruível.
              </CardDescription>
            </CardHeader>
            <MemoryTimeline entries={memory} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste de reconstrução</CardTitle>
              <CardDescription>
                As nove perguntas que o registro precisa responder meses depois.
              </CardDescription>
            </CardHeader>
            <ReconstructionReport answers={reconstruction} />
          </Card>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-ink-muted">A Curadoria inteira</h2>
          <JourneyNavigator journey={journey} caseId={record.caseId} />
        </aside>
      </div>
    </div>
  );
}
