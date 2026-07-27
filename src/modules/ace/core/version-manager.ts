// Version Manager — nunca sobrescreve: uma "correção" é sempre uma nova versão
// referenciando a anterior (docs/ace/03-kernel/kernel.md, seção 4).
//
// A mecânica de versionar foi absorvida em
// `src/platform/records/versioned-record.ts`, porque não é do ACE: qualquer
// registro que precise ser reconstruído depois tem a mesma necessidade. Este
// arquivo permanece com a assinatura que os protocolos já usam, e apenas
// delega — não há duas implementações do mesmo versionamento.

import {
  createInitialVersion as createInitialRecord,
  createNextVersion as createNextRecord,
} from "@/platform/records/versioned-record";

import type { Artifact } from "./artifact-contract";

// `producedBy` é estampado pelo próprio artefato, que o traz dentro de `data`
// (ADR-012). A Plataforma exige a origem como parâmetro explícito; aqui ela é
// lida de onde o ACE sempre a colocou, preservando o comportamento anterior.
function originOf(data: object): string {
  const declared = (data as { producedBy?: unknown }).producedBy;
  return typeof declared === "string" ? declared : "ace";
}

export function createInitialVersion<TData extends object>(
  data: TData,
): Readonly<TData & Artifact> {
  return createInitialRecord(data, originOf(data)) as Readonly<TData & Artifact>;
}

export function createNextVersion<TData extends object, TPrevious extends Artifact>(
  previous: TPrevious,
  data: TData,
): Readonly<TData & Artifact> {
  return createNextRecord(previous, data, originOf(data)) as Readonly<TData & Artifact>;
}
