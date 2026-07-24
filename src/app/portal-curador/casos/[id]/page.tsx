import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { ConductionPanel } from "@/components/curadoria/conduction-panel";
import { MemoryTimeline, ReconstructionReport } from "@/components/curadoria/memory-timeline";
import { PhaseNavigator } from "@/components/curadoria/phase-navigator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildMemory, runReconstructionTest } from "@/modules/curadoria/cos/memory";
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
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const memory = buildMemory(record);
  const reconstruction = runReconstructionTest(record);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/portal-curador"
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
          <ConductionPanel state={state} caseId={record.caseId} />

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
          <h2 className="text-xs uppercase tracking-wide text-ink-muted">As nove fases</h2>
          <PhaseNavigator phases={state.phases} caseId={record.caseId} />
        </aside>
      </div>
    </div>
  );
}
