import { RuntimeError } from "./errors";
import type { ShutdownPolicy } from "./types";

// Política padrão do WP3: ordem reversa das dependências. A continuidade
// após falha NÃO é uma política — é invariante do ciclo de vida (ver
// types.ts) e vive no RuntimeLifecycle, nunca aqui.
export function createReverseShutdownPolicy(): ShutdownPolicy {
  return {
    name: "reverse-dependency-order",
    planOrder(started) {
      return [...started].reverse();
    },
  };
}

// Valida o plano produzido por uma política antes de qualquer transição
// de estado: precisa ser uma permutação exata das dependências iniciadas.
// Plano inválido falha ANTES de STOPPING — o contexto permanece
// consistente (runtime segue READY, nada foi parado pela metade).
export function assertValidShutdownPlan(
  policyName: string,
  started: readonly string[],
  plan: readonly string[],
): void {
  const isPermutation =
    plan.length === started.length &&
    new Set(plan).size === plan.length &&
    plan.every((name) => started.includes(name));

  if (!isPermutation) {
    throw new RuntimeError({
      code: "SHUTDOWN_PLAN_INVALID",
      message: `A política de shutdown "${policyName}" produziu um plano que não é uma permutação das dependências iniciadas.`,
    });
  }
}
