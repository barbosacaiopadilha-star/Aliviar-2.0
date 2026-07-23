/**
 * Cartão de um caso no Painel Inicial.
 *
 * @metodo Experience §3 — o Portal transmite controle, clareza e organização, nunca burocracia
 * @metodo Experience §5 — UX3: o próximo passo é sempre visível, único e nomeado pelo que faz
 * @metodo Ontologia §3.1 — Paciente representa a pessoa, nunca a doença
 * @metodo Fundamentos §5.2 — o Curador conduz; o sistema organiza
 *
 * Por que existe: o Painel resolve uma única pergunta do Curador — "qual é o
 * meu próximo passo?". Cada cartão responde isso para um paciente, com uma
 * única ação nomeada, sem obrigar a abrir o caso para descobrir.
 *
 * O que nunca faz: exibir métrica de produtividade, tempo parado, contagem
 * regressiva ou qualquer número que pressione o ritmo do Curador
 * (Experience §3 — "a pressa é inimiga direta do Método").
 */

import Link from "next/link";

import { MethodStepper } from "@/components/curadoria/method-stepper";
import { CaseAlert } from "@/components/curadoria/case-alert";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import type { PortalCase } from "@/modules/curadoria/portal/mock-data";

const ownerLabels: Record<PortalCase["pendencies"][number]["owner"], string> = {
  CURADOR: "com você",
  PACIENTE: "com o paciente",
  EQUIPE: "com a equipe",
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export function CaseCard({ data }: { data: PortalCase }) {
  const isWaiting = data.nextAction.kind === "aguardando";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-sans text-lg font-semibold text-ink">{data.patientName}</h3>
          <MethodStepper current={data.step} variant="compact" />
        </div>
        {data.promisedReturn ? (
          <p className="text-xs text-ink-muted">
            Retorno combinado para{" "}
            <span className="text-ink">{formatDay(data.promisedReturn)}</span>
          </p>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-ink">{data.situation}</p>

      {data.alerts.map((alert) => (
        <CaseAlert key={alert.code} {...alert} />
      ))}

      {data.pendencies.length > 0 ? (
        <ul className="space-y-1.5">
          {data.pendencies.map((pendency) => (
            <li key={pendency.id} className="text-sm text-ink-muted">
              {pendency.description}
              <span aria-hidden="true"> — </span>
              <span className="text-ink">{ownerLabels[pendency.owner]}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="border-t border-border pt-4">
        {isWaiting ? (
          // A bola não está com o Curador. O rótulo diz isso em vez de oferecer
          // uma ação — cobrar o paciente violaria Experience §2.6.
          <p className="text-sm text-ink-muted">
            {data.nextAction.label}.{" "}
            <Link
              href={data.nextAction.href}
              className="font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              Abrir o caso
            </Link>
          </p>
        ) : (
          <Link
            href={data.nextAction.href}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface",
              "transition-colors duration-fast ease-standard hover:bg-brand-primary-deep",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            )}
          >
            {data.nextAction.label}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </Card>
  );
}
