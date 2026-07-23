/**
 * Convenção de rastreabilidade do Portal do Curador (MISSÃO 100).
 *
 * Todo componente em `src/components/curadoria/` declara, no topo do arquivo,
 * de qual documento canônico ele nasceu — usando a anotação `@metodo`:
 *
 *   @metodo Experience §3 — o Curador deve sentir que possui um copiloto
 *   @metodo Engine §5.1 — toda eliminação carrega motivo em linguagem humana
 *
 * A regra é verificada automaticamente por
 * `tests/unit/curadoria-portal-traceability.test.ts`: um componente sem
 * anotação válida quebra a suíte. Isso existe para que, meses depois, seja
 * possível responder "por que esta tela se comporta assim?" abrindo o
 * documento que originou o comportamento — nunca adivinhando.
 *
 * Nenhum componente do Portal existe para preencher espaço. Se um componente
 * não consegue citar o documento que justifica sua existência, ele não deveria
 * existir.
 */

export const METHOD_SOURCES = ["Fundamentos", "Método", "Ontologia", "Experience", "Engine"] as const;

export type MethodSource = (typeof METHOD_SOURCES)[number];

export const METHOD_SOURCE_DOCUMENTS: Record<MethodSource, string> = {
  Fundamentos: "docs/FUNDAMENTOS_DO_METODO_ALIVIAR.md",
  Método: "docs/FUNDAMENTOS_DO_METODO_ALIVIAR.md",
  Ontologia: "docs/ONTOLOGIA_CURADORIA_COMPARTILHADA.md",
  Experience: "docs/EXPERIENCE_BIBLE.md",
  Engine: "docs/CURATION_ENGINE_SPECIFICATION.md",
};

/** Reconhece uma linha `@metodo <Fonte> §<seção> — <motivo>`. */
export const METHOD_ANNOTATION_PATTERN =
  /@metodo\s+(Fundamentos|Método|Ontologia|Experience|Engine)\s+§[\w.\d]+\s+—\s+\S+/u;
