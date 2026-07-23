/**
 * Etapas operacionais do Kernel ÔÇö sequ├¬ncia can├┤nica da Plataforma.
 * A Plataforma come├ºa em CADASTRO; ENCERRADO ├® terminal.
 */
export const OPERATIONAL_STAGES = [
  "CADASTRO",
  "HISTORIA",
  "ACE",
  "CURADORIA",
  "ENTREGA",
  "ESCOLHA",
  "ACOMPANHAMENTO",
  "RELACIONAMENTO",
  "ENCERRADO",
] as const;

export type OperationalStage = (typeof OPERATIONAL_STAGES)[number];

export function isOperationalStage(value: string): value is OperationalStage {
  return (OPERATIONAL_STAGES as readonly string[]).includes(value);
}

export function operationalStageIndex(stage: OperationalStage): number {
  return OPERATIONAL_STAGES.indexOf(stage);
}

export function nextOperationalStage(stage: OperationalStage): OperationalStage | null {
  const index = operationalStageIndex(stage);
  if (index < 0 || index >= OPERATIONAL_STAGES.length - 1) {
    return null;
  }
  return OPERATIONAL_STAGES[index + 1] ?? null;
}

export function isTerminalStage(stage: OperationalStage): boolean {
  return stage === "ENCERRADO";
}
