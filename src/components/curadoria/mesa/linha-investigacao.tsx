/**
 * LINHA DE INVESTIGAÇÃO — o raciocínio, não o workflow.
 *
 * @metodo Guided Experience §2 — onde estou dentro do que estou fazendo
 *
 * Por que existe: as sete etapas da Mesa dizem *o que* está sendo feito. Esta
 * faixa diz em que ponto do **raciocínio** o Curador está — levantar a
 * hipótese, reunir evidência, conferir, concluir. São eixos diferentes: dá
 * para estar na etapa Relatório ainda reunindo evidência.
 *
 * O que nunca faz: virar navegação, ter botão, ou sugerir que a investigação
 * tem que ser percorrida nessa ordem. É espelho, não trilho.
 */

import { cn } from "@/components/ui/cn";
import type { LinhaEtapaState } from "@/modules/curadoria/mesa-investigacao";

const ESTADO: Record<LinhaEtapaState["status"], string> = {
  percorrida: "percorrida",
  agora: "onde o raciocínio está",
  adiante: "ainda por vir",
};

export function LinhaInvestigacao({ etapas }: { etapas: LinhaEtapaState[] }) {
  return (
    <ol className="mesa-raciocinio" aria-label="Linha de investigação">
      {etapas.map((etapa) => (
        <li
          key={etapa.id}
          aria-current={etapa.status === "agora" ? "step" : undefined}
          className={cn("mesa-raciocinio__item", `mesa-raciocinio__item--${etapa.status}`)}
        >
          {etapa.label}
          <span className="sr-only">, {ESTADO[etapa.status]}</span>
        </li>
      ))}
    </ol>
  );
}
