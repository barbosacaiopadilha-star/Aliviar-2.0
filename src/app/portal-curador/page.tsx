import Link from "next/link";

import { MethodStepper } from "@/components/curadoria/method-stepper";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { getPrimaryActionLabel, phaseHref } from "@/modules/curadoria/cos/conduction-ui";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { COS_PHASE_LABELS } from "@/modules/curadoria/cos/types";
import { resolveGreetingFirstName } from "@/modules/auth/display-identity";

// MÓDULO 1 — PAINEL INICIAL, agora sobre o banco (MISSÃO 209, Fases 3 e 4).
//
// Qual problema do Curador esta tela resolve?
//   "Eu tenho pessoas em andamento. Por onde eu começo agora?"
//
// A ordenação é por quem precisa de você, derivada do Motor de Condução sobre
// a Memória real — não mais de um campo de mock. Nenhuma métrica de
// produtividade aparece aqui, por decisão de método (Experience §3).

export default async function PainelInicialPage() {
  const auth = await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();

  const caseIds = await listCaseIds(supabase);
  const records = (
    await Promise.all(caseIds.map((id) => loadCuradoriaRecord(supabase, id)))
  ).filter((record): record is NonNullable<typeof record> => record !== null);

  const conducted = records
    .map((record) => ({ record, state: conduct(record) }))
    // Bloqueio primeiro, depois alerta, depois ação, e por último o que está
    // com o paciente — quem precisa de você antes de quem você acompanha.
    .sort((a, b) => {
      const rank = (entry: typeof a) =>
        entry.state.alerts.some((alert) => alert.severity === "bloqueio")
          ? 0
          : entry.state.alerts.length > 0
            ? 1
            : entry.state.nextStep.kind === "acao"
              ? 2
              : 3;
      return rank(a) - rank(b);
    });

  const needsCurator = conducted.filter((entry) => entry.state.nextStep.kind === "acao").length;
  const firstName = resolveGreetingFirstName(auth);

  return (
    <div className="space-y-10">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">Bom dia, {firstName}.</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          {conducted.length === 0
            ? "Nenhuma Curadoria atribuída a você no momento."
            : needsCurator === 1
              ? "Uma pessoa espera um passo seu hoje."
              : `${needsCurator} pessoas esperam um passo seu hoje.`}
        </p>
      </header>

      {conducted.length === 0 ? (
        // Estado vazio real: o Portal acabou de ser ligado ao banco e a rede
        // ainda não foi cadastrada. Diz o que acontece a seguir em vez de
        // deixar uma tela muda.
        <Card padding="lg" className="max-w-reading space-y-3">
          <CardHeader>
            <CardTitle>Ainda não há Curadorias aqui</CardTitle>
            <CardDescription>
              Assim que um Caso for aberto e atribuído a você, ele aparece nesta tela com o próximo
              passo já indicado.
            </CardDescription>
          </CardHeader>
          <p className="text-sm leading-relaxed text-ink-muted">
            Nada foi perdido e nada está carregando — a lista está vazia porque ainda não existe
            Caso atribuído ao seu nome.
          </p>
        </Card>
      ) : (
        <section aria-labelledby="casos-heading" className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="casos-heading" className="font-sans text-xl font-semibold text-ink">
              Suas Curadorias
            </h2>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Na ordem de quem precisa de você
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {conducted.map(({ record, state }) => (
              <Card key={record.caseId} className="space-y-4">
                <div>
                  <h3 className="font-sans text-lg font-semibold text-ink">{record.patientName}</h3>
                  <MethodStepper current={state.currentReasoningStep} variant="compact" />
                </div>

                <p className="text-sm leading-relaxed text-ink">
                  {COS_PHASE_LABELS[state.currentPhase]} — {state.nextStep.description}
                </p>

                {state.alerts.map((alert) => (
                  <p key={alert.code} className="text-sm text-ink-muted">
                    <span className="font-mono text-xs">{alert.code}</span> · {alert.title}
                  </p>
                ))}

                <div className="border-t border-border pt-4">
                  {state.nextStep.kind === "aguardando" ? (
                    <p className="text-sm text-ink-muted">
                      {state.nextStep.label}.{" "}
                      <Link
                        href={`/coa/curadoria/casos/${record.caseId}`}
                        className="font-medium text-brand-primary underline-offset-4 hover:underline"
                      >
                        Abrir o caso
                      </Link>
                    </p>
                  ) : (
                    <Link
                      href={phaseHref(record.caseId, state.nextStep.phase)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      {getPrimaryActionLabel(state)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
