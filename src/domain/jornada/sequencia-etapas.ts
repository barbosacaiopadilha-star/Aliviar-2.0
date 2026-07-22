import { EtapaDaJornada } from "./value-objects/etapa-da-jornada";

export const SEQUENCIA_OFICIAL_ETAPAS: readonly EtapaDaJornada[] = [
  EtapaDaJornada.primeiraDuvida(),
  EtapaDaJornada.primeiroContato(),
  EtapaDaJornada.descoberta(),
  EtapaDaJornada.entendimentoMetodo(),
  EtapaDaJornada.confianca(),
  EtapaDaJornada.cadastro(),
  EtapaDaJornada.historia(),
  EtapaDaJornada.ace(),
  EtapaDaJornada.curadoria(),
  EtapaDaJornada.entrega(),
  EtapaDaJornada.escolha(),
  EtapaDaJornada.acompanhamento(),
  EtapaDaJornada.relacionamento(),
];

export function indiceDaEtapa(etapa: EtapaDaJornada): number {
  const index = SEQUENCIA_OFICIAL_ETAPAS.findIndex((item) => item.equals(etapa));
  if (index === -1) {
    throw new Error(`Etapa inválida na sequência oficial: ${etapa.codigo}`);
  }
  return index;
}

export function proximaEtapaOficial(etapa: EtapaDaJornada): EtapaDaJornada | null {
  const index = indiceDaEtapa(etapa);
  return SEQUENCIA_OFICIAL_ETAPAS[index + 1] ?? null;
}

export function etapaAnteriorOficial(etapa: EtapaDaJornada): EtapaDaJornada | null {
  const index = indiceDaEtapa(etapa);
  return index > 0 ? SEQUENCIA_OFICIAL_ETAPAS[index - 1]! : null;
}

export function todasEtapasAnterioresConcluidas(
  etapa: EtapaDaJornada,
  etapasConcluidas: readonly EtapaDaJornada[],
): boolean {
  const index = indiceDaEtapa(etapa);
  for (let i = 0; i < index; i += 1) {
    const obrigatoria = SEQUENCIA_OFICIAL_ETAPAS[i]!;
    if (!etapasConcluidas.some((concluida) => concluida.equals(obrigatoria))) {
      return false;
    }
  }
  return true;
}
