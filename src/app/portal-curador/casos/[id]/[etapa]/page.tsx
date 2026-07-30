import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { Metadata } from "next";

import { AcolhimentoWorkspace } from "@/components/curadoria/acolhimento-workspace";
import { PhaseDeclarationWorkspace } from "@/components/curadoria/phase-declaration-workspace";
import { ReportEditor } from "@/components/curadoria/report-editor";
import { ReportStatus } from "@/components/curadoria/report-status";
import { DevolutivaWorkspace } from "@/components/curadoria/devolutiva-workspace";
import { CaseAlert } from "@/components/curadoria/case-alert";
import { JourneyNavigator } from "@/components/curadoria/journey-navigator";
import { StepMethodReference } from "@/components/curadoria/step-method-reference";
import { LastUpdate, StepStatus } from "@/components/journey";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildMemory } from "@/modules/curadoria/cos/memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { getReportLifecycle } from "@/modules/curadoria/relatorio-assistido";
import {
  CURATOR_JOURNEY_DEFINITIONS,
  buildCuratorJourney,
  journeyStepHref,
  resolveJourneyStep,
} from "@/modules/curadoria/cos/journey";
import { PHASE_STATUS_LABELS } from "@/modules/curadoria/cos/conduction-ui";

export const metadata: Metadata = {
  title: "Etapa da Curadoria",
  robots: { index: false, follow: false },
};

// ETAPA DA JORNADA DO CURADOR — ambiente de trabalho.
//
// Qual problema do Curador esta tela resolve?
//   "Onde estou nesta pessoa, o que já sabemos, e o que eu faço agora?"
//
// O que mudou (Simplificação da Jornada): esta tela era a definição operacional
// da fase — objetivo, critérios, informações obrigatórias, opcionais, regras,
// rastreabilidade e artefatos: sete cartões de documentação com um workspace
// espremido no meio. Agora ela começa pelo trabalho; a referência do Método
// fica fechada no rodapé. Nenhuma regra saiu do produto — mudou de lugar, para
// fora do caminho de quem já sabe o que está fazendo.
//
// As nove fases do COS continuam intactas no domínio; esta rota fala em etapas
// da jornada (6), que as projetam. Ver src/modules/curadoria/cos/journey.ts.

export default async function EtapaPage({ params }: { params: Promise<{ id: string; etapa: string }> }) {
  const { id, etapa } = await params;
  await requireRole("curador_medico");

  const stepId = resolveJourneyStep(etapa);
  if (!stepId) {
    notFound();
  }

  // Um endereço por etapa. Os slugs das nove fases continuam funcionando —
  // quem tem o link antigo chega ao lugar certo em vez de encontrar um 404 —
  // mas a barra de endereço passa a mostrar o nome da jornada.
  const definition = CURATOR_JOURNEY_DEFINITIONS[stepId];
  if (etapa.toLowerCase() !== definition.slug) {
    redirect(journeyStepHref(id, stepId));
  }

  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const journey = buildCuratorJourney(record, state);
  const step = journey.steps.find((entry) => entry.id === stepId)!;
  const stepPhases = definition.phases;

  const alerts = state.alerts.filter((alert) => stepPhases.includes(alert.phase));
  const inconsistencies = state.inconsistencies.filter((entry) => stepPhases.includes(entry.phase));

  const nextStep = journey.steps.find((entry) => entry.order === step.order + 1) ?? null;
  const lastEvent = buildMemory(record)
    .filter((entry) => stepPhases.includes(entry.phase))
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/coa/curadoria/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">{step.label}</h1>
          <Badge variant={step.status === "CONCLUIDA" ? "sage" : "default"}>
            {PHASE_STATUS_LABELS[step.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Etapa {step.order} de {journey.totalCount}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {alerts.map((alert) => (
            <CaseAlert key={alert.code} {...alert} />
          ))}
          {inconsistencies.map((entry) => (
            <CaseAlert
              key={`${entry.code}-${entry.description}`}
              code={entry.code}
              title="Inconsistência"
              detail={entry.description}
              severity="bloqueio"
            />
          ))}

          {/* ACOLHIMENTO — o entendimento inteiro numa tela só.
              "Compreender o Caso" era etapa própria, e isso fazia o Curador
              ler o mesmo material duas vezes em rotas diferentes: uma para
              registrar a história, outra para separar o que é fato clínico.
              É uma leitura só. Agora o que já se sabe, os documentos, a
              história e o contexto clínico vivem juntos, na ordem em que ele
              pensa. */}
          {stepId === "ACOLHER" ? (
            <>
              <AcolhimentoWorkspace
                caseId={record.caseId}
                contextReviewed={record.acolhimento.contextReviewed}
                documentsReviewed={record.acolhimento.documentsReviewed}
                nextPhaseHref="#a-historia"
              />

              <div id="a-historia" className="scroll-mt-6">
                <PhaseDeclarationWorkspace
                  phase="historia"
                  caseId={record.caseId}
                  initialText={record.historia.narrative}
                  understandingConfirmedAt={record.historia.understandingConfirmedAt}
                  nextPhaseHref="#registrar-o-caso"
                  nextPhaseLabel="Separar o que é fato clínico"
                />
              </div>

              <div id="registrar-o-caso" className="scroll-mt-6">
                <PhaseDeclarationWorkspace
                  phase="caso"
                  caseId={record.caseId}
                  initialText={record.caso.clinicalContext}
                  nextPhaseHref={journeyStepHref(record.caseId, "COMPARAR")}
                  nextPhaseLabel="Abrir a Mesa de Curadoria"
                />
              </div>
            </>
          ) : null}

          {/* RELATÓRIO — a pergunta aqui é "o documento está pronto?", e não
              "onde escrevo?". A tela responde isso com o estado real dos três
              pareceres, e só então leva ao editor, que vive na Mesa ao lado da
              comparação que fundamenta cada texto. */}
          {/* O Relatório é editável, revisável e entregável aqui — o ambiente
              único que faltava. Sem seleção gravada ainda, mostra o estado e
              leva à Mesa; com seleção, abre o editor. */}
          {stepId === "RELATORIO" && record.priorityProfileId && record.curadoriaTecnica.curatedSelectionId ? (
            <ReportEditor
              priorityProfileId={record.priorityProfileId}
              curatedSelectionId={record.curadoriaTecnica.curatedSelectionId}
              patientFirstName={record.patientFirstName}
              emittedAt={record.relatorio.emittedAt}
              deliveredAt={record.relatorio.deliveredAt}
              assistedGeneratedAt={
                (await getReportLifecycle(supabase, record.curadoriaTecnica.curatedSelectionId))
                  ?.assistedGeneratedAt ?? null
              }
              nextStepHref={journeyStepHref(record.caseId, "FINALIZAR")}
              initialComposition={record.relatorio.compositionRationale ?? ""}
              initialOptions={record.curadoriaTecnica.selectedProfessionalIds.map((professionalId) => {
                const option = record.relatorio.options.find(
                  (entry) => entry.professionalId === professionalId,
                );
                return {
                  professionalProfileId: professionalId,
                  // M3: nome pela fonte canônica, nunca pelas análises legadas.
                  professionalName:
                    record.curadoriaTecnica.professionalNames[professionalId] ?? "Profissional",
                  justification: option?.justification ?? "",
                  relationToWeights: option?.relationToWeights ?? "",
                  attentionPoints: option?.attentionPoints.join("\n") ?? "",
                  suggestedQuestions: option?.suggestedQuestions.join("\n") ?? "",
                  curatorObservations: option?.curatorObservations ?? "",
                };
              })}
            />
          ) : stepId === "RELATORIO" ? (
            <ReportStatus
              caseId={record.caseId}
              patientFirstName={record.patientFirstName}
              options={record.relatorio.options}
              professionalNames={
                new Map(Object.entries(record.curadoriaTecnica.professionalNames))
              }
              compositionRationale={record.relatorio.compositionRationale}
            />
          ) : null}

          {/* FINALIZAR — a apresentação é presencial e a decisão é do paciente.
              A tela declara isso em vez de fingir um botão. */}
          {stepId === "FINALIZAR" ? (
            <Card>
              <CardHeader>
                <CardTitle>A entrega é uma conversa</CardTitle>
                <CardDescription>
                  As três opções são apresentadas pessoalmente — nunca por notificação com anexo.
                </CardDescription>
              </CardHeader>
              <p className="max-w-reading text-sm leading-relaxed text-ink">
                {record.devolutiva.decision
                  ? `${record.patientFirstName} decidiu em ${new Date(record.devolutiva.decision.decidedAt).toLocaleDateString("pt-BR")}${
                      record.devolutiva.decision.outcome === "CHOSEN"
                        ? " — ela escolheu um dos caminhos."
                        : " — nenhuma das três serviu, e isso é uma resposta legítima."
                    }`
                  : `A decisão é dela, no tempo dela — a Aliviar não impõe prazo. Quando ela registrar, aparece aqui. Você registra abaixo o que aconteceu no encontro.`}
              </p>
            </Card>
          ) : null}

          {/* O registro do encontro: a única parte da Devolutiva que é do
              Curador. A decisão em si é ato do paciente — a RLS garante isso. */}
          {stepId === "FINALIZAR" && record.priorityProfileId && record.relatorio.deliveredAt ? (
            <DevolutivaWorkspace
              priorityProfileId={record.priorityProfileId}
              patientFirstName={record.patientFirstName}
              presentedAt={record.devolutiva.presentedAt}
              initial={{
                patientQuestions: record.devolutiva.patientQuestions,
                observations: record.devolutiva.observations,
                nextSteps: record.devolutiva.nextSteps,
              }}
            />
          ) : null}

          <StepStatus
            stepName={step.label}
            settled={step.settled}
            missing={step.missing}
            blockedReason={step.blockedReason}
            completionSentence={step.completionSentence}
          />

          {/* Toda etapa termina entregando o Curador na próxima — ele nunca
              volta ao painel para descobrir o que fazer. */}
          {step.status === "CONCLUIDA" && nextStep ? (
            <Card className="border-brand-sage/40">
              <CardHeader>
                <CardTitle>Próxima etapa: {nextStep.label}</CardTitle>
                <CardDescription>{nextStep.completionSentence}</CardDescription>
              </CardHeader>
              <Link
                href={journeyStepHref(record.caseId, nextStep.id)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Ir para {nextStep.label}
                <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ) : null}

          <StepMethodReference phases={stepPhases} />
        </div>

        <aside className="space-y-4">
          <LastUpdate
            at={lastEvent?.at ?? null}
            by={lastEvent?.actor}
            what={lastEvent?.description}
          />
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-ink-muted">A Curadoria inteira</h2>
            <JourneyNavigator journey={journey} caseId={record.caseId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
