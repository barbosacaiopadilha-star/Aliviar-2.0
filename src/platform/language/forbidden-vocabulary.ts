/**
 * VOCABULÁRIO PROIBIDO — verificação mecânica de texto, com consciência de negação.
 *
 * Por que existe: alguns textos não podem conter certas expressões. Verificar
 * isso por substring é ingênuo e produz falso positivo no caso mais importante:
 * quando o texto precisa NEGAR a expressão para explicar que ela não se aplica.
 *
 *   "não funciona como um ranking"   → legítimo, e obrigatório em alguns textos
 *   "este é o primeiro no ranking"   → proibido
 *
 * Uma lista fechada de verbos de negação nunca fecha essa classe de problema —
 * a linguagem humana varia demais. A verificação troca a pergunta "qual verbo
 * nega?" por "existe QUALQUER gatilho de negação dentro da MESMA cláusula?".
 *
 * Absorvido de `src/modules/ace/artifacts/final-curadoria.ts`, onde nasceu para
 * proteger um único documento e onde as calibrações CAL-001 e CAL-004 pagaram o
 * preço de descobrir os casos difíceis. A disciplina nunca foi daquele artefato.
 *
 * ------------------------------------------------------------------------
 * O QUE ESTA CAMADA NÃO SABE
 * ------------------------------------------------------------------------
 * Não sabe quais palavras são proibidas. Isso é conhecimento de domínio: quem
 * escreve para um paciente sabe o que não pode dizer; quem escreve um log
 * técnico tem outra lista. A Plataforma fornece o mecanismo; o domínio fornece
 * a política.
 *
 * Não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem Administrador.
 * Conhece texto.
 */

/** Gatilhos de negação: conjunto pequeno e fechado, nunca um verbo específico. */
const NEGATION_TRIGGER = /\bn[ãa]o\b|\bnunca\b|\bsem\b|\bnenhum\w*\b|\bjamais\b/;

/**
 * O que encerra a cláusula local. Uma negação anterior a um destes nunca
 * "alcança" uma expressão posterior:
 *
 *   "não sei se você reparou, MAS este é o primeiro no ranking"
 *
 * A negação pertence à oração anterior. Vírgula sozinha nunca delimita — só
 * quando acompanha uma conjunção, o que a própria conjunção já cobre.
 */
function clauseBoundaryPattern(): RegExp {
  return /[.?!\n;:]|\bmas\b|\bpor[ée]m\b|\bcontudo\b|\bentretanto\b|\btodavia\b|\bno entanto\b/g;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** O trecho entre o limite de cláusula mais próximo e a ocorrência. */
function localClauseBefore(text: string, index: number): string {
  const preceding = text.slice(0, index);
  const boundary = clauseBoundaryPattern();

  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(preceding)) !== null) {
    start = match.index + match[0].length;
  }
  return preceding.slice(start);
}

function occurrenceIndices(text: string, phrase: string): number[] {
  const indices: number[] = [];
  const pattern = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) indices.push(match.index);
  return indices;
}

/**
 * A política de vocabulário de um tipo de texto.
 *
 * A distinção entre as duas listas é o núcleo desta capacidade:
 *
 * - `absolute`: proibido em qualquer forma. Negar não legitima — dizer
 *   "não temos vencedor" já introduz a ideia de vencedor onde ela não deveria
 *   existir. É a regra mais dura, e é a certa para superfícies de paciente.
 *
 * - `unlessNegated`: proibido afirmar, permitido negar. Existe porque alguns
 *   textos precisam explicar que algo não se aplica, e negar exige nomear.
 */
export type VocabularyPolicy = {
  readonly absolute: readonly string[];
  readonly unlessNegated: readonly string[];
};

export type VocabularyFinding = {
  /** A expressão encontrada, como está na política. */
  readonly phrase: string;
  /** Onde apareceu no texto normalizado. */
  readonly index: number;
  readonly kind: "absolute" | "unnegated";
  /** A cláusula em que apareceu — para quem for corrigir localizar sem caçar. */
  readonly clause: string;
};

/**
 * Analisa um texto contra uma política. Nunca lança, nunca reescreve.
 *
 * Devolver achados em vez de lançar é deliberado: quem chama decide se aquilo
 * é bloqueio (um artefato que não pode existir) ou aviso a um humano (um texto
 * que a pessoa ainda vai revisar). A mesma verificação serve aos dois.
 */
export function inspectVocabulary(text: string, policy: VocabularyPolicy): VocabularyFinding[] {
  const normalized = text.toLowerCase();
  const findings: VocabularyFinding[] = [];

  for (const phrase of policy.absolute) {
    for (const index of occurrenceIndices(normalized, phrase.toLowerCase())) {
      findings.push({
        phrase,
        index,
        kind: "absolute",
        clause: localClauseBefore(normalized, index).trim(),
      });
    }
  }

  for (const phrase of policy.unlessNegated) {
    for (const index of occurrenceIndices(normalized, phrase.toLowerCase())) {
      const clause = localClauseBefore(normalized, index);
      if (!NEGATION_TRIGGER.test(clause)) {
        findings.push({ phrase, index, kind: "unnegated", clause: clause.trim() });
      }
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

/** Atalho para quem só precisa saber se passa. */
export function violatesVocabulary(text: string, policy: VocabularyPolicy): boolean {
  return inspectVocabulary(text, policy).length > 0;
}

/**
 * Aplica a política a vários campos de uma vez, dizendo em qual campo cada
 * achado apareceu — a informação que falta para uma tela apontar o erro no
 * lugar certo, em vez de dizer "há algo errado em algum lugar".
 */
export function inspectFields(
  fields: Readonly<Record<string, string | null | undefined>>,
  policy: VocabularyPolicy,
): ReadonlyArray<VocabularyFinding & { readonly field: string }> {
  const findings: Array<VocabularyFinding & { field: string }> = [];
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    for (const finding of inspectVocabulary(value, policy)) {
      findings.push({ ...finding, field });
    }
  }
  return findings;
}
