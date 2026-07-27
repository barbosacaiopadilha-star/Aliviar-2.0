/**
 * REGISTRO VERSIONADO — nada é sobrescrito; corrigir é criar uma nova versão.
 *
 * Por que existe: quando alguém corrige uma informação, o valor antigo não é
 * lixo — é o que se sabia na hora em que uma decisão foi tomada. Um `UPDATE`
 * apaga a única resposta para "com base em quê isso foi decidido?". Uma versão
 * nova, apontando para a anterior, preserva as duas coisas.
 *
 * Absorvido de `src/modules/ace/core/{artifact-contract,version-manager,
 * artifact-reference}.ts`. Aqueles arquivos falavam em "artefato de protocolo"
 * e carregavam `ProtocolId`; a disciplina de versionar sem sobrescrever não é
 * de protocolo nenhum.
 *
 * Esta camada não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem
 * Administrador. Conhece registro.
 */

import { randomUUID } from "node:crypto";

import { deepFreeze } from "../immutability/deep-freeze";

export type RecordId = string;

/**
 * A base de qualquer coisa que precise ser reconstruível depois.
 *
 * `producedBy` é `string` de propósito: quem produziu é vocabulário de quem
 * chama (um protocolo, uma tela, uma importação). A Plataforma exige que a
 * origem exista e seja estampada — não exige qual vocabulário ela usa.
 */
export type VersionedRecord = {
  readonly id: RecordId;
  readonly version: number;
  readonly createdAt: string;
  readonly previousVersionId?: RecordId;
  readonly producedBy: string;
};

/** Referência de proveniência para outro registro, com o tipo esperado. */
export type RecordReference<TType extends string> = {
  readonly recordId: RecordId;
  readonly recordVersion: number;
  readonly recordType: TType;
};

/**
 * Autoridade de um registro.
 *
 * A distinção existe porque a plataforma precisa poder responder, sem
 * ambiguidade, se um registro DECIDE alguma coisa ou apenas ORGANIZA
 * informação. Um registro `analysis` nunca vale como decisão, por mais
 * elaborado que seja — e essa checagem tem que ser mecânica, não editorial.
 */
export type RecordAuthority = "analysis" | "human_decision" | "delivery";

/** Registro sem valor decisório. `decisional` é sempre `false`, por construção. */
export type AnalysisRecord = VersionedRecord & {
  readonly authority: "analysis";
  readonly decisional: false;
};

/**
 * Registro que carrega uma decisão humana — a única forma de decisão que a
 * plataforma reconhece.
 *
 * Autoria e momento são obrigatórios na própria base: nenhum registro
 * decisório pode existir sem dizer quem decidiu e quando.
 */
export type HumanDecisionRecord = VersionedRecord & {
  readonly authority: "human_decision";
  readonly decisional: true;
  readonly decidedBy: string;
  readonly decidedAt: string;
};

/**
 * Registro que materializa e comunica uma decisão já tomada.
 *
 * `decisional: false` porque entregar não é decidir. A referência à decisão
 * original é preservada — nunca reconstruída nem reinterpretada.
 */
export type DeliveryRecord<TDecisionType extends string = string> = VersionedRecord & {
  readonly authority: "delivery";
  readonly decisional: false;
  readonly validatedBy: string;
  readonly validatedAt: string;
  readonly decisionReference: RecordReference<TDecisionType>;
};

export type AnyRecord = AnalysisRecord | HumanDecisionRecord | DeliveryRecord;

/** Só um registro de decisão humana decide. Checagem mecânica, sem exceção. */
export function isDecisional(record: { authority: RecordAuthority }): boolean {
  return record.authority === "human_decision";
}

/**
 * Primeira versão. `id`, `version`, `createdAt` são estampados aqui — nunca
 * recebidos, para que ninguém possa forjar a origem de um registro.
 */
export function createInitialVersion<TData extends object>(
  data: TData,
  producedBy: string,
): Readonly<TData & VersionedRecord> {
  return deepFreeze({
    ...data,
    id: randomUUID(),
    version: 1,
    createdAt: new Date().toISOString(),
    producedBy,
  }) as Readonly<TData & VersionedRecord>;
}

/**
 * Próxima versão, apontando para a anterior.
 *
 * Recebe `producedBy` novamente porque quem corrige pode não ser quem criou —
 * e essa diferença é exatamente o que uma auditoria quer ver.
 */
export function createNextVersion<TData extends object>(
  previous: VersionedRecord,
  data: TData,
  producedBy: string,
): Readonly<TData & VersionedRecord> {
  return deepFreeze({
    ...data,
    id: randomUUID(),
    version: previous.version + 1,
    createdAt: new Date().toISOString(),
    previousVersionId: previous.id,
    producedBy,
  }) as Readonly<TData & VersionedRecord>;
}

/** Referência a uma versão exata — nunca "a mais recente". */
export function referenceTo<TType extends string>(
  record: VersionedRecord,
  recordType: TType,
): RecordReference<TType> {
  return Object.freeze({
    recordId: record.id,
    recordVersion: record.version,
    recordType,
  });
}
