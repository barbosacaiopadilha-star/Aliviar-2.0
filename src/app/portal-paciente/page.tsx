import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import Link from "next/link";

import { JornadaTimeline } from "@/components/curadoria/jornada-timeline";
import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buildJornada } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

// TELA 1 — MINHA JORNADA
//
// Qual pergunta esta tela responde?
//   "Em que etapa está minha Curadoria, e o que acontece agora?"
//
// O princípio central da MISSÃO 205 é que o paciente nunca precise fazer essa
// pergunta. A Jornada é derivada da mesma Memória que o Curador usa — o que
// aparece aqui existe no registro, e o nível interno nunca atravessa.
//
// Paciente de demonstração: Rosa (caso-2024), a jornada mais avançada — Dossiê
// entregue, aguardando a decisão dela. É o estado que melhor mostra a
// distinção entre "sua vez" e "a equipe está trabalhando".

// Carrega a Curadoria do próprio paciente. A RLS já garante que ele só
// enxerga o Caso dele — nunca passamos id pela URL, para que não exista nem
// a tentação de olhar o de outra pessoa.
async function loadMinhaCuradoria() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;
  return loadCuradoriaRecord(supabase, caseId);
}

export default async function MinhaJornadaPage() {
  const record = await loadMinhaCuradoria();
  if (!record) return <SemCuradoria />;
  const jornada = buildJornada(record);
  const current = jornada.stages.find((stage) => stage.id === jornada.currentStage)!;

  return (
    <div className="space-y-8">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">
          Sua Curadoria, {jornada.patientFirstName}
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">{current.description}</p>
      </header>

      {/* O que acontece agora, dito antes da linha do tempo — quem abre o
          Portal quer a resposta imediata, não precisa procurá-la. */}
      <Card className="border-brand-gold/40">
        <CardHeader>
          <CardTitle>Agora</CardTitle>
          <CardDescription>
            {current.nextAction
              ? current.nextAction.owner === "VOCE"
                ? "É a sua vez — no seu tempo, sem prazo."
                : `${jornada.curatorName} está com isso.`
              : `Com ${current.responsible}.`}
          </CardDescription>
        </CardHeader>
        <p className="text-base text-ink">
          {current.nextAction?.label ?? current.label}
        </p>
        {jornada.promisedReturn ? (
          <p className="mt-2 text-sm text-ink-muted">
            Retorno combinado para{" "}
            {new Date(jornada.promisedReturn).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            })}
            .
          </p>
        ) : null}
      </Card>

      <section aria-labelledby="jornada-heading" className="space-y-4">
        <h2 id="jornada-heading" className="font-sans text-xl font-semibold text-ink">
          Sua jornada, do começo ao acompanhamento
        </h2>
        <JornadaTimeline jornada={jornada} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suas prioridades</CardTitle>
            <CardDescription>
              O que você definiu como importante, e que orientou toda a Curadoria.
            </CardDescription>
          </CardHeader>
          {/* min-h-11: o Portal é usado principalmente no celular, e um link
              de 16px de altura fica abaixo do alvo mínimo de toque
              (WCAG 2.5.8). */}
          <Link
            href="/portal-paciente/prioridades"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Ver meu Perfil de Prioridades →
          </Link>
        </Card>

        <WhatsappContact />
      </div>
    </div>
  );
}
