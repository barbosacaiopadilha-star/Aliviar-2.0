/**
 * POLÍTICA DE CAMPOS — o que um registro não pode conter, e o que ele ainda
 * não tem direito de conter.
 *
 * Por que existe: uma lista única de "campos proibidos" não consegue exprimir
 * a distinção que importa. Há campos que nunca podem existir em lugar nenhum, e
 * há campos perfeitamente legítimos que, num registro produzido cedo demais,
 * significam que alguém antecipou uma conclusão. Os dois casos parecem iguais
 * numa lista plana, e são problemas diferentes.
 *
 *   permanente  → este campo nunca deveria existir aqui
 *   antecipado  → este campo é válido, mas não ainda
 *
 * A busca é recursiva de propósito: esconder um campo proibido dentro de um
 * objeto aninhado não deveria funcionar, e sem recursão funcionaria.
 *
 * Absorvido de `src/modules/ace/core/field-policy.ts` (ADR-014). Lá o
 * mecanismo vinha grudado no vocabulário — nomes de campo clínico, ordem de
 * protocolo. Aqui fica só o mecanismo: quem chama traz sua lista e sua ordem.
 *
 * Esta camada não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem
 * Administrador. Conhece campo.
 */

/**
 * Onde um registro está numa sequência. `order` é um número porque a
 * Plataforma não pode saber os nomes das etapas de ninguém — só que existe
 * um antes e um depois.
 */
export type StageOrder<TStage extends string> = Readonly<Record<TStage, number>>;

export type FieldPolicy<TStage extends string> = {
  /** Proibidos sempre, em qualquer registro, permanentemente. */
  readonly permanentlyForbidden: readonly string[];
  /** Campo → primeira etapa em que ele passa a ser legítimo. */
  readonly reservedUntil: Readonly<Record<string, TStage>>;
  readonly stageOrder: StageOrder<TStage>;
};

export type FieldViolation<TStage extends string> =
  | { readonly kind: "permanently_forbidden"; readonly field: string }
  | { readonly kind: "anticipated"; readonly field: string; readonly availableFrom: TStage };

/** Todas as chaves alcançáveis, em qualquer profundidade. */
function collectKeys(candidate: unknown, found: Set<string>, seen: WeakSet<object>): void {
  if (candidate === null || typeof candidate !== "object") return;

  const target = candidate as object;
  if (seen.has(target)) return;
  seen.add(target);

  if (Array.isArray(candidate)) {
    for (const entry of candidate) collectKeys(entry, found, seen);
    return;
  }

  for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
    found.add(key);
    collectKeys(value, found, seen);
  }
}

export function reachableKeys(candidate: unknown): ReadonlySet<string> {
  const found = new Set<string>();
  collectKeys(candidate, found, new WeakSet());
  return found;
}

/**
 * Encontra as violações. Não lança: quem chama decide se aquilo é um erro
 * fatal do seu domínio ou um aviso — e só quem chama sabe qual mensagem faz
 * sentido para quem vai ler.
 */
export function findFieldViolations<TStage extends string>(
  candidate: unknown,
  policy: FieldPolicy<TStage>,
  producedAtStage: TStage,
): ReadonlyArray<FieldViolation<TStage>> {
  const keys = reachableKeys(candidate);
  const producedOrder = policy.stageOrder[producedAtStage];
  const violations: Array<FieldViolation<TStage>> = [];

  for (const field of policy.permanentlyForbidden) {
    if (keys.has(field)) violations.push({ kind: "permanently_forbidden", field });
  }

  for (const field of keys) {
    const availableFrom = policy.reservedUntil[field];
    if (availableFrom !== undefined && policy.stageOrder[availableFrom] > producedOrder) {
      violations.push({ kind: "anticipated", field, availableFrom });
    }
  }

  return violations;
}
