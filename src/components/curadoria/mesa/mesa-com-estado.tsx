"use client";

import { MesaEstadoProvider, type MesaEstadoInicial } from "@/components/curadoria/mesa/mesa-estado";
import { MesaShell, type MesaShellProps } from "@/components/curadoria/mesa/mesa-shell";

/**
 * O LIMITE DE COMPOSIÇÃO DA MESA — provider acima do slot que desmonta.
 *
 * @metodo Engine §11 — o rascunho da Mesa é trabalho do Curador até ele confirmar; nada é gravado antes.
 * @metodo Experience §3 — trocar de etapa é navegação, e navegação não pode custar o que já foi escrito.
 *
 * Por que existe: a D-6 não era perda de dados, era **ciclo de vida**.
 * `MesaShell` renderiza apenas `conteudo[etapaAtual]`, então trocar de etapa
 * desmonta `MesaWorkspace` e mata o `useReducer` que guarda seleção, pareceres
 * e justificativa. A correção foi elevar o estado — e a elevação só vale
 * enquanto o provider estiver **acima** do Shell.
 *
 * Essa relação vivia solta na rota, dentro de um Server Component: qualquer
 * teste tinha de montar o provider por conta própria, e por isso continuava
 * verde mesmo se a rota rebaixasse o provider para dentro do slot. Este
 * componente é a menor peça que torna a relação **verificável**: a rota o usa,
 * o teste o usa, e rebaixar o provider quebra os dois juntos.
 *
 * ⛔ Não acrescente lógica aqui. É composição, e só: se ganhar decisão, deixa
 * de ser o limite que o teste exercita e volta a ser um harness disfarçado.
 */
export function MesaComEstado({
  caseId,
  persisted,
  ...shell
}: MesaShellProps & {
  caseId: string;
  /** Inicialização legítima vinda do servidor — aplicada uma vez, no provider. */
  persisted?: MesaEstadoInicial;
}) {
  return (
    <MesaEstadoProvider caseId={caseId} persisted={persisted}>
      <MesaShell {...shell} />
    </MesaEstadoProvider>
  );
}
