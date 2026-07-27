/**
 * PAINEL A — Cabeçalho inteligente, sempre fixo.
 *
 * @metodo Guided Experience §2 — as cinco perguntas: onde estou, o que já foi feito, o que falta, de quem é a vez
 * @metodo Fundamentos §13 — P14: a interface organiza; a decisão é do Curador
 * @metodo Engine §5.5 — lacuna aparece como lacuna, nunca preenchida por suposição
 *
 * Por que existe: o Curador perdia contexto ao abrir qualquer painel — quem é
 * a pessoa, em que etapa está, o que falta decidir. Agora isso não sai da
 * tela, e ocupa três linhas em vez de um cartão.
 *
 * O que nunca faz: esconder um alerta para o cabeçalho parecer limpo.
 */

import { cn } from "@/components/ui/cn";
import type { ProximaDecisao } from "@/modules/curadoria/mesa-etapas";

export function MesaHeader({
  patientName,
  areaRequirement,
  curatorName,
  progress,
  decisao,
  alerts,
}: {
  patientName: string;
  areaRequirement: string | null;
  curatorName: string;
  progress: { done: number; total: number };
  decisao: ProximaDecisao;
  alerts: string[];
}) {
  return (
    <header className="mesa-header">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="font-serif text-xl font-medium leading-tight text-ink">
          {patientName}
        </h1>
        <p className="mesa-meta">
          {areaRequirement ?? "Área não definida"} · {curatorName} ·{" "}
          {progress.done} de {progress.total} etapas
        </p>
      </div>

      {/* A pergunta que a Mesa inteira responde. Quando nada depende dele, a
          frase diz do que depende — silêncio mudo pareceria tudo em ordem. */}
      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 text-sm",
          decisao.blocked ? "text-ink-muted" : "font-medium text-ink",
        )}
      >
        {decisao.blocked ? decisao.label : `Sua vez: ${decisao.label.toLowerCase()}`}
      </p>

      {alerts.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {alerts.map((alerta) => (
            <li key={alerta} className="mesa-alerta">
              {alerta}
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
