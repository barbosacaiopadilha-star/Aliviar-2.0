/**
 * Navegador das nove fases do COS.
 *
 * @metodo Ontologia §3.11 — Curadoria: fases com critérios de entrada e saída próprios
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho; toda transição tem ator humano
 * @metodo Fundamentos §5.2 — voltar a uma etapa anterior é o processo funcionando, não retrocesso
 * @metodo Experience §5 — UX2: sempre mostrar contexto; UX7: saída sempre disponível
 *
 * Por que existe: o Curador precisa enxergar a Curadoria inteira de uma vez —
 * o que já fechou, o que está aberto e o que ainda não pode começar, com o
 * motivo de cada bloqueio. Sem isso, ele precisaria abrir fase por fase para
 * descobrir onde parou.
 *
 * O que nunca faz: exibir percentual de conclusão, e nunca impedir a navegação
 * para uma fase já concluída. Uma fase bloqueada mostra o porquê em vez de
 * simplesmente ficar cinza — botão desabilitado sem explicação é burocracia,
 * não copiloto (Experience §6).
 */

import Link from "next/link";

import { COS_PHASE_LABELS, type PhaseState, type PhaseStatus } from "@/modules/curadoria/cos/types";
import { cn } from "@/components/ui/cn";

const statusLabels: Record<PhaseStatus, string> = {
  CONCLUIDA: "Concluída",
  EM_ANDAMENTO: "Em andamento",
  DISPONIVEL: "Pronta para começar",
  AGUARDANDO: "Com o paciente",
  BLOQUEADA: "Ainda não",
};

const statusClasses: Record<PhaseStatus, string> = {
  CONCLUIDA: "border-brand-sage/40 bg-brand-sage-light/20",
  EM_ANDAMENTO: "border-brand-primary/40 bg-surface",
  DISPONIVEL: "border-border bg-surface",
  AGUARDANDO: "border-border bg-canvas",
  BLOQUEADA: "border-border bg-canvas",
};

/**
 * Fases com tela de trabalho própria. As demais abrem apenas a definição
 * operacional (objetivo, critérios, regras) — informação legítima, mas não um
 * lugar onde se executa algo. Marcá-las evita prometer navegação que leva a
 * um beco: o Curador clica esperando trabalhar e encontra leitura.
 */
const PHASES_WITH_WORKSPACE = new Set(["PRIORIDADES", "CURADORIA_TECNICA"]);

export function PhaseNavigator({ phases, caseId }: { phases: PhaseState[]; caseId: string }) {
  return (
    <ol className="space-y-2">
      {phases.map((state, index) => {
        const isNavigable = state.status !== "BLOQUEADA";
        const hasWorkspace = PHASES_WITH_WORKSPACE.has(state.phase);
        const label = COS_PHASE_LABELS[state.phase];

        const content = (
          <div
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md border p-3",
              statusClasses[state.status],
              isNavigable && "transition-colors duration-fast ease-standard hover:border-brand-primary/50",
            )}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-ink-muted">{index + 1}</span>
              <span
                className={cn(
                  "text-sm",
                  state.status === "BLOQUEADA" ? "text-ink-muted" : "font-medium text-ink",
                )}
              >
                {label}
              </span>
            </div>
            <span className="text-xs text-ink-muted">
              {statusLabels[state.status]}
              {isNavigable && !hasWorkspace ? (
                <span className="ml-2 text-ink-muted/80">· só leitura</span>
              ) : null}
            </span>
            {state.status === "BLOQUEADA" ? (
              // Diz o que falta, nunca só "indisponível". Bloqueio sem motivo
              // explicado é burocracia (Experience §3).
              <p className="w-full text-xs text-ink-muted">Depende de: {state.reason}</p>
            ) : null}
          </div>
        );

        return (
          <li key={state.phase}>
            {isNavigable ? (
              <Link
                href={`/portal-curador/casos/${caseId}/${state.phase.toLowerCase()}`}
                className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
