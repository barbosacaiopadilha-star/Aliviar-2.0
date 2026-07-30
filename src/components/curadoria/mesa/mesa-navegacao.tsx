"use client";

/**
 * NAVEGAÇÃO DA MESA — quem sabe trocar de etapa é o ambiente.
 *
 * O painel lateral precisa levar o Curador até onde o pendente se resolve,
 * mas ele é montado pela página, não pela Mesa. Um contexto resolve isso sem
 * obrigar a página a costurar shell e conteúdo a cada etapa.
 *
 * Sem provider, o valor é `null` e quem consome simplesmente não oferece o
 * atalho — nada quebra fora da Mesa.
 */

import { createContext, useContext } from "react";

import type { MesaEtapaId } from "@/modules/curadoria/mesa-etapas";

const MesaNavegacaoContext = createContext<((etapa: MesaEtapaId) => void) | null>(null);

export const MesaNavegacaoProvider = MesaNavegacaoContext.Provider;

export function useMesaNavegacao(): ((etapa: MesaEtapaId) => void) | null {
  return useContext(MesaNavegacaoContext);
}
