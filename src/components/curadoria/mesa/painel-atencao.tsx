"use client";

/**
 * PAINEL INTELIGENTE — só o que ainda merece atenção.
 *
 * @metodo Engine §5.5 — a lacuna aparece como lacuna, nunca preenchida por suposição
 * @metodo Experience §3 — o copiloto sinaliza e nunca bloqueia sem explicar
 *
 * Por que existe: o painel lateral repetia o Case inteiro, inclusive o que já
 * estava resolvido, e por isso parava de ser lido. Aqui ele devolve apenas o
 * que continua aberto — e cada item leva à etapa onde se resolve, num clique.
 *
 * O que nunca faz: mostrar item resolvido, ordenar por gravidade inventada,
 * ou sumir quando está vazio. Painel vazio é resposta: nada pendente.
 */

import { useMesaNavegacao } from "@/components/curadoria/mesa/mesa-navegacao";
import type { AtencaoItem, AtencaoTipo } from "@/modules/curadoria/mesa-investigacao";
import { MESA_ETAPA_LABELS, type MesaEtapaId } from "@/modules/curadoria/mesa-etapas";

const MARCA: Record<AtencaoTipo, string> = {
  DIVERGENCIA: "⚠",
  INSUFICIENTE: "◌",
  DECLARACAO: "●",
  AVALIACAO: "●",
  JUIZO: "●",
};

const TIPO_LABEL: Record<AtencaoTipo, string> = {
  DIVERGENCIA: "divergência",
  INSUFICIENTE: "informação insuficiente",
  DECLARACAO: "declaração pendente",
  AVALIACAO: "avaliação pendente",
  JUIZO: "juízo pendente",
};

export function PainelAtencao({
  itens,
  onIr,
  rotuloDoDestino,
}: {
  itens: AtencaoItem[];
  onIr?: (etapa: MesaEtapaId) => void;
  /**
   * Como esta superfície NOMEIA o lugar onde o item se resolve.
   *
   * A Mesa antiga tem etapas, e o destino é o nome da etapa. A Mesa nova
   * (ADR-093) não tem etapa nenhuma — é um documento contínuo, com seções.
   * Dizer "Resolver em Avaliação técnica" lá mandaria o Curador para uma
   * geografia que não existe.
   *
   * O item continua sabendo A QUE ETAPA ele pertence: isso é vocabulário do
   * Método e não muda. O que muda é o mapa de cada tela — e o mapa é de quem
   * desenha a tela, não de quem deriva a pendência.
   */
  rotuloDoDestino?: (etapa: MesaEtapaId) => string;
}) {
  const doAmbiente = useMesaNavegacao();
  const ir = onIr ?? doAmbiente;
  const nomeDoDestino = rotuloDoDestino ?? ((etapa: MesaEtapaId) => MESA_ETAPA_LABELS[etapa]);

  if (itens.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nada pendente neste momento. O que aparecer aqui é o que ainda depende de você.
      </p>
    );
  }

  return (
    /* AS CLASSES `mesa-atencao*` NÃO FAZIAM NADA — `SIM-50`.
     *
     * Elas moram em `src/app/mesa-curador.css`, que **nunca foi importado por
     * lugar nenhum**: sem `@import` no `globals.css` e sem importador em
     * `src/`. Verificado também no commit anterior à remoção da Mesa antiga,
     * para não confundir com regressão daquela remoção — não é.
     *
     * O efeito era visível e ninguém tinha olhado: a marca do item ficava
     * numa linha sozinha, acima do nome, em vez de ao lado. Passou
     * despercebido enquanto o painel vivia no aside da Mesa antiga; ficou
     * evidente quando ele subiu para o topo da Mesa nova.
     *
     * A intenção original está preservada aqui, em utilitários: lista com
     * respiro, marca fora do fluxo do texto, ação sublinhada embaixo.
     */
    <ul className="grid gap-3 text-xs leading-relaxed">
      {itens.map((item) => (
        <li key={item.id} className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-0.5 flex-none text-[0.6875rem] text-[var(--color-ambient-accent)]"
          >
            {MARCA[item.tipo]}
          </span>
          <div className="min-w-0">
            <p className="text-ink">
              <span className="font-medium">{item.quem}</span>
              <span className="sr-only"> — {TIPO_LABEL[item.tipo]}</span>
            </p>
            <p className="text-ink-muted">{item.frase}</p>
            {/* O rótulo diz PARA ONDE leva. Repetido cinco vezes, "Resolver
                nesta etapa" virava ruído idêntico e não dizia se o próximo
                clique trocava de assunto. */}
            {ir ? (
              <button type="button" className="mt-1 text-[0.6875rem] text-[var(--color-brand-primary)] underline underline-offset-[3px]" onClick={() => ir(item.etapa)}>
                Resolver em {nomeDoDestino(item.etapa)}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
