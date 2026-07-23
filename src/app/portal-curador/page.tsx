import { ActivityFeed } from "@/components/curadoria/activity-feed";
import { CaseCard } from "@/components/curadoria/case-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CURRENT_CURATOR,
  MOCK_ACTIVITY,
  MOCK_CASES,
  orderByWhatNeedsYou,
} from "@/modules/curadoria/portal/mock-data";

// MÓDULO 1 — PAINEL INICIAL
//
// Qual problema do Curador esta tela resolve?
//   "Eu tenho seis pessoas em andamento. Por onde eu começo agora?"
//
// A tela existe para responder essa única pergunta. Tudo o que não ajuda a
// respondê-la foi deixado de fora — inclusive coisas que um painel
// administrativo teria por hábito: total de casos, tempo médio, gráfico de
// volume, casos parados há N dias. Nenhuma métrica de produtividade aparece
// aqui, por decisão de método (Experience §3: "a pressa é inimiga direta do
// Método").
//
// A ordenação é por "quem precisa de você", não por data: bloqueios primeiro,
// depois alertas, depois ações, e por último o que está com o paciente
// (mock-data.orderByWhatNeedsYou).

export default function PainelInicialPage() {
  const cases = orderByWhatNeedsYou(MOCK_CASES);
  const waitingOnPatient = cases.filter((entry) => entry.nextAction.kind === "aguardando");
  const needsCurator = cases.filter((entry) => entry.nextAction.kind === "acao");

  return (
    <div className="space-y-10">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">Bom dia, {CURRENT_CURATOR.firstName}.</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          {needsCurator.length === 1
            ? "Uma pessoa espera um passo seu hoje."
            : `${needsCurator.length} pessoas esperam um passo seu hoje.`}
          {waitingOnPatient.length === 1
            ? " Outra aguarda a decisão de quem está do outro lado."
            : waitingOnPatient.length > 1
              ? ` Outras ${waitingOnPatient.length} aguardam a decisão de quem está do outro lado.`
              : ""}
        </p>
      </header>

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
          {cases.map((entry) => (
            <CaseCard key={entry.id} data={entry} />
          ))}
        </div>
      </section>

      <section aria-labelledby="atividade-heading">
        <Card>
          <CardHeader>
            <CardTitle>
              <span id="atividade-heading">O que mudou desde sua última visita</span>
            </CardTitle>
            <CardDescription>
              Cada linha nomeia quem agiu — inclusive quando quem agiu foi o sistema.
            </CardDescription>
          </CardHeader>
          <ActivityFeed events={MOCK_ACTIVITY} />
        </Card>
      </section>
    </div>
  );
}
