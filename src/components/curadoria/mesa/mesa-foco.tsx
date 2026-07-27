"use client";

/**
 * O FOCO — qual profissional o teclado está olhando.
 *
 * Vive num contexto porque o atalho (`J`/`K`) é do ambiente da Mesa, e a
 * comparação que reage a ele está lá dentro, na área de trabalho. Passar isso
 * por props obrigaria a página a costurar shell e conteúdo a cada etapa.
 *
 * Sem provider, tudo continua funcionando pelo mouse: o contexto tem um
 * padrão inerte. Atalho é aceleração, nunca requisito.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type MesaFoco = {
  /** Índice do profissional em foco, ou -1 quando nenhum. */
  indice: number;
  total: number;
  mover: (delta: number) => void;
  /** Detalhe da célula/ficha em foco. Nunca abre sozinho. */
  detalhes: boolean;
  alternarDetalhes: () => void;
  fechar: () => void;
};

const INERTE: MesaFoco = {
  indice: -1,
  total: 0,
  mover: () => {},
  detalhes: false,
  alternarDetalhes: () => {},
  fechar: () => {},
};

const MesaFocoContext = createContext<MesaFoco>(INERTE);

export function useMesaFoco(): MesaFoco {
  return useContext(MesaFocoContext);
}

export function MesaFocoProvider({ total, children }: { total: number; children: ReactNode }) {
  const [indice, setIndice] = useState(-1);
  const [detalhes, setDetalhes] = useState(false);

  const mover = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setIndice((atual) => {
        const proximo = atual < 0 ? (delta > 0 ? 0 : total - 1) : atual + delta;
        // Circula em vez de parar: em lista curta, bater na parede custa mais
        // do que voltar ao começo.
        return ((proximo % total) + total) % total;
      });
    },
    [total],
  );

  const valor = useMemo<MesaFoco>(
    () => ({
      indice: indice >= total ? -1 : indice,
      total,
      mover,
      detalhes,
      alternarDetalhes: () => setDetalhes((atual) => !atual),
      fechar: () => setDetalhes(false),
    }),
    [indice, total, mover, detalhes],
  );

  return <MesaFocoContext.Provider value={valor}>{children}</MesaFocoContext.Provider>;
}
