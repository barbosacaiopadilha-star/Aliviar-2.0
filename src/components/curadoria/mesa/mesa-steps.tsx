"use client";

/**
 * PAINEL B — Navegação da Curadoria, no mesmo ambiente.
 *
 * @metodo Guided Experience §1 — a plataforma se organiza pela jornada mental de quem a usa
 * @metodo Ontologia §3.13 — ordem de leitura, jamais colocação
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho
 *
 * Por que existe: a Mesa empilhava tudo — orçamento, elegibilidade,
 * comparação e seleção na mesma rolagem, dez painéis competindo. Agora cada
 * etapa da investigação abre na área de trabalho, sem trocar de tela e sem
 * perder o contexto.
 *
 * O que nunca faz: bloquear uma etapa. O Curador conduz a investigação e
 * entra onde quiser; etapas que dependem de outra dizem do que dependem.
 */

import { cn } from "@/components/ui/cn";
import type { MesaEtapaId, MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

const MARCA: Record<MesaEtapaState["status"], string> = {
  PRONTA: "✓",
  PENDENTE: "●",
  AGUARDA: "·",
};

const ESTADO_LABEL: Record<MesaEtapaState["status"], string> = {
  PRONTA: "respondida",
  PENDENTE: "aguarda você",
  AGUARDA: "depende de outra etapa",
};

export function MesaSteps({
  etapas,
  atual,
  proxima,
  onSelecionar,
}: {
  etapas: MesaEtapaState[];
  atual: MesaEtapaId;
  /** A etapa onde está a próxima decisão — recebe a marca de destino. */
  proxima: MesaEtapaId;
  onSelecionar: (etapa: MesaEtapaId) => void;
}) {
  return (
    <nav aria-label="Etapas da Curadoria Técnica" className="mesa-steps">
      <ol className="mesa-steps__list">
        {etapas.map((etapa) => {
          const ativa = etapa.id === atual;
          return (
            <li key={etapa.id}>
              <button
                type="button"
                onClick={() => onSelecionar(etapa.id)}
                aria-current={ativa ? "step" : undefined}
                className={cn("mesa-step", ativa && "mesa-step--ativa")}
              >
                <span aria-hidden="true" className={cn("mesa-step__marca", `mesa-step__marca--${etapa.status.toLowerCase()}`)}>
                  {MARCA[etapa.status]}
                </span>
                <span className="mesa-step__label">{etapa.label}</span>
                {etapa.id === proxima && !ativa ? (
                  <span aria-hidden="true" className="mesa-step__destino" />
                ) : null}
                <span className="sr-only">
                  , {ESTADO_LABEL[etapa.status]}
                  {etapa.pending ? `: ${etapa.pending}` : ""}
                  {etapa.waitingOn ? `: ${etapa.waitingOn}` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
