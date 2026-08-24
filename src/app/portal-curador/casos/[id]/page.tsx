import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { AlignmentCapture } from "@/components/curadoria/alignment-capture";
import { ConductionPanel } from "@/components/curadoria/conduction-panel";
import { CuradoriaBriefing } from "@/components/curadoria/curadoria-briefing";
import { ObservationCapture } from "@/components/curadoria/observation-capture";
import { loadBriefing } from "@/modules/briefing/repository";
import { MemoryTimeline, ReconstructionReport } from "@/components/curadoria/memory-timeline";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildMemory, runReconstructionTest } from "@/modules/curadoria/cos/memory";
import { buildCuratorJourney } from "@/modules/curadoria/cos/journey";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
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

/**
 * A DOBRA DO HUB (24/08) — `<details>` nativo, mesma mecânica do teste de
 * reconstrução: título sempre à vista, conteúdo a um clique, zero estado.
 * Para o que é ocasional (registrar, auditar), não para o que é leitura
 * de toda visita (condução, briefing).
 */
function Recolhido({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="rounded-md border border-border bg-surface">
      <summary className="cursor-pointer list-none px-6 py-4 font-sans text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
        {titulo}
      </summary>
      <div className="px-2 pb-2">{children}</div>
    </details>
  );
}

export default async function CasoWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authState = await requireAnyRole(["curador_medico", "administrador"]);
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
  // M3: nomes pela fonte canônica do record (`professional_profiles`),
  // nunca pelas análises do motor aposentado.
  const nomesPorId = record.curadoriaTecnica.professionalNames;
  const professionalsInReview = record.relatorio.options
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((option) => ({
      profileId: option.professionalId,
      displayName: nomesPorId[option.professionalId] ?? "Profissional",
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

        {/* A papelada do caso (23/08): o Curador gera as peças já com os
            dados dela, salva em PDF e manda pelo WhatsApp — que é por onde
            o papel vai e volta. */}
        <p className="mt-3">
          <Link
            href={`/portal-curador/casos/${record.caseId}/documentos`}
            className="text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Documentos para enviar
          </Link>
        </p>
      </div>

      {/* CORTE DE 24/08 · UM sistema de progresso. O JourneyNavigator saía
          daqui: ele repetia, em lista, o que o ConductionPanel já responde
          melhor ("onde estou, o que falta, próximo passo"). O mapa completo
          continua no aside das ETAPAS — onde navegar entre etapas é o
          assunto. Sem o aside, a coluna volta a ser uma só. */}
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6">
          <ConductionPanel state={state} caseId={record.caseId} journey={journey} />

          {/* Contexto para a apresentação. Vem depois do Motor de Condução
              (o que fazer agora) e antes da história — é o que o Curador
              consulta quando vai conversar com a pessoa. */}
          <CuradoriaBriefing data={briefing} />

          {/* CORTE DE 24/08 (2ª passada do Fundador): as duas superfícies de
              captura abriam INTEIRAS em toda visita — e registrar é ato
              ocasional, não leitura do dia. Viram dobras: o título à vista,
              o formulário a um clique. Nada saiu; recolheu. */}
          <Recolhido titulo="Registrar alinhamento da conversa">
            <AlignmentCapture
              caseId={record.caseId}
              patientFirstName={record.patientFirstName}
              answers={briefing.patientAnswers}
            />
          </Recolhido>

          <Recolhido titulo="Registrar observação">
            <ObservationCapture
              caseId={record.caseId}
              observations={briefing.observations}
              viewerId={authState.user.id}
            />
          </Recolhido>

          {/* CORTE DE 24/08 (decisão do Fundador, "o que dá pra cortar e
              resumir"): a história inteira saiu do hub — ela já vive no
              Acolhimento, que é onde se trabalha nela, e aqui era a mesma
              parede de texto numa segunda tela. O Briefing acima segue
              resumindo o essencial para a conversa. */}

          {/* CORTE DE 24/08 · a Memória recolhe: é registro reconstruível
              (auditoria), não trabalho do dia — mesma régua do teste de
              reconstrução logo abaixo. */}
          <Recolhido titulo="Memória da Curadoria">
            <Card>
              <CardHeader>
                <CardDescription>
                  Tudo o que aconteceu, com autor e instante. Toda decisão precisa ser
                  reconstruível.
                </CardDescription>
              </CardHeader>
              <MemoryTimeline entries={memory} />
            </Card>
          </Recolhido>

          {/* AUDITORIA, NÃO TRABALHO (F-5). O Teste de reconstrução é um
              instrumento de QA — as nove perguntas que o registro precisa
              responder meses depois. Ele ficava aberto na tela de trabalho de
              TODO caso, cobrando atenção diária por um ato que é ocasional.
              Continua aqui, calculado e a um clique — mas fechado: quem audita
              abre; quem opera passa. */}
          <Card>
            <details>
              <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
                <CardHeader>
                  <CardTitle>Teste de reconstrução</CardTitle>
                  <CardDescription>
                    As nove perguntas que o registro precisa responder meses depois. Abra
                    para conferir — isto é auditoria, não etapa.
                  </CardDescription>
                </CardHeader>
              </summary>
              <div className="mt-4">
                <ReconstructionReport answers={reconstruction} />
              </div>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
