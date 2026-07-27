/**
 * CONGELAMENTO PROFUNDO — imutabilidade real, não só do nível de cima.
 *
 * Por que existe: `Object.freeze` congela apenas a superfície. Um registro
 * congelado com um array dentro continua aceitando `push`. Numa plataforma
 * onde o histórico de uma decisão de saúde precisa ser reconstruível meses
 * depois, "quase imutável" não é imutável.
 *
 * Absorvido de `src/modules/ace/core/deep-freeze.ts`. A disciplina nunca foi
 * do ACE: é da Plataforma.
 *
 * Esta camada conhece estrutura de dado. Não conhece domínio.
 */

/** Tipo de leitura de algo congelado profundamente. */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends Set<infer M>
      ? ReadonlySet<DeepReadonly<M>>
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

/**
 * Congela um valor e tudo o que ele alcança.
 *
 * Trata ciclos: um grafo com referência circular congela uma vez só, em vez
 * de recorrer para sempre. Isso importa porque artefatos com proveniência
 * podem, legitimamente, apontar de volta.
 *
 * `Date`, `RegExp` e afins são congelados como objeto, sem tentar percorrer
 * campos internos — o motor já os trata como opacos.
 */
export function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): DeepReadonly<T> {
  if (value === null || typeof value !== "object") {
    return value as DeepReadonly<T>;
  }

  const target = value as unknown as object;
  if (seen.has(target)) return value as DeepReadonly<T>;
  seen.add(target);

  if (value instanceof Map) {
    for (const [key, entry] of value) {
      deepFreeze(key, seen);
      deepFreeze(entry, seen);
    }
  } else if (value instanceof Set) {
    for (const entry of value) deepFreeze(entry, seen);
  } else {
    for (const key of Reflect.ownKeys(target)) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      // Getters não são lidos: invocá-los aqui teria efeito colateral, e
      // congelar não deve executar código do chamador.
      if (descriptor && "value" in descriptor) {
        deepFreeze(descriptor.value, seen);
      }
    }
  }

  return Object.freeze(value) as DeepReadonly<T>;
}

/** Verifica congelamento profundo — usado por teste e por guarda de invariante. */
export function isDeeplyFrozen(value: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  if (value === null || typeof value !== "object") return true;

  const target = value as object;
  if (seen.has(target)) return true;
  seen.add(target);

  if (!Object.isFrozen(target)) return false;

  if (value instanceof Map) {
    for (const [key, entry] of value) {
      if (!isDeeplyFrozen(key, seen) || !isDeeplyFrozen(entry, seen)) return false;
    }
    return true;
  }
  if (value instanceof Set) {
    for (const entry of value) if (!isDeeplyFrozen(entry, seen)) return false;
    return true;
  }

  for (const key of Reflect.ownKeys(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && "value" in descriptor && !isDeeplyFrozen(descriptor.value, seen)) {
      return false;
    }
  }
  return true;
}
