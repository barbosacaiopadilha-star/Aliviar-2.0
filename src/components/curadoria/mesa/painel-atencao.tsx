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
};

const TIPO_LABEL: Record<AtencaoTipo, string> = {
  DIVERGENCIA: "divergência",
  INSUFICIENTE: "informação insuficiente",
  DECLARACAO: "declaração pendente",
  AVALIACAO: "avaliação pendente",
};

export function PainelAtencao({
  itens,
  onIr,
}: {
  itens: AtencaoItem[];
  onIr?: (etapa: MesaEtapaId) => void;
}) {
  const doAmbiente = useMesaNavegacao();
  const ir = onIr ?? doAmbiente;

  if (itens.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nada pendente neste momento. O que aparecer aqui é o que ainda depende de você.
      </p>
    );
  }

  return (
    <ul className="mesa-atencao">
      {itens.map((item) => (
        <li key={item.id} className="mesa-atencao__item">
          <span aria-hidden="true" className="mesa-atencao__marca">
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
              <button type="button" className="mesa-atencao__ir" onClick={() => ir(item.etapa)}>
                Resolver em {MESA_ETAPA_LABELS[item.etapa]}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
