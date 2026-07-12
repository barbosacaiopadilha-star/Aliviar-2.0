// Version Manager — cria versões imutáveis de artefatos. Nunca sobrescreve:
// uma "correção" é sempre uma nova versão referenciando a anterior
// (docs/ace/03-kernel/kernel.md, seção 4).

import { randomUUID } from "node:crypto";

import type { Artifact } from "./artifact-contract";
import { deepFreeze } from "./deep-freeze";

export function createInitialVersion<TData extends object>(data: TData): Readonly<TData & Artifact> {
  return deepFreeze({
    ...data,
    id: randomUUID(),
    version: 1,
    createdAt: new Date().toISOString(),
  }) as Readonly<TData & Artifact>;
}

export function createNextVersion<TData extends object, TPrevious extends Artifact>(
  previous: TPrevious,
  data: TData,
): Readonly<TData & Artifact> {
  return deepFreeze({
    ...data,
    id: randomUUID(),
    version: previous.version + 1,
    createdAt: new Date().toISOString(),
    previousVersionId: previous.id,
  }) as Readonly<TData & Artifact>;
}
