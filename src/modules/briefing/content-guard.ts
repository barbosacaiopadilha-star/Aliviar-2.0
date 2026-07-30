/**
 * GUARD DE CONTEÚDO — campo livre do profissional.
 *
 * @metodo ACE_BOUNDARIES §1.5 — marketing não entra no ACE
 * @metodo ACE_BOUNDARIES §1.7 — promessa de resultado não entra
 *
 * Por que existe: ME5 é um campo livre onde o profissional fala de si. É o
 * espaço mais humano do cadastro — e por isso o mais fácil de virar anúncio.
 *
 * O que NUNCA faz: reescrever silenciosamente. A IA não corrige ninguém pelas
 * costas (P1). Este guard detecta, explica em linguagem humana e devolve o
 * texto intacto para a pessoa decidir o que fazer.
 *
 * Detecção é por expressão explícita, não por julgamento de mérito: preferimos
 * deixar passar algo duvidoso a acusar alguém injustamente.
 */

export type ContentIssue = {
  code: "AUTOPROMOCAO" | "PROMESSA_RESULTADO" | "COMPARACAO" | "DADO_DE_PACIENTE";
  /** O que dizer a quem escreveu — sem tom de reprovação. */
  message: string;
  /** O trecho que disparou, para a pessoa localizar no próprio texto. */
  excerpt: string;
};

type Rule = { code: ContentIssue["code"]; pattern: RegExp; message: string };

const RULES: Rule[] = [
  {
    code: "AUTOPROMOCAO",
    pattern: /\b(o|a)\s+melhor\b|\bmelhor\s+(médic|profissional|especialist)|\bn[º°]?\s*1\b|\breferência\s+(nacional|do\s+país|absoluta)|\bexcelênci|\bpremiad/i,
    message:
      "Este trecho soa como destaque comparativo. A Curadoria não compara profissionais — conte como você atende, e isso já diferencia.",
  },
  {
    code: "PROMESSA_RESULTADO",
    pattern: /\b(garant|assegur)\w*\s+(a\s+)?(cura|resultado|melhora|sucesso)|\b100%\s+de\s+(sucesso|cura)|\bsem\s+riscos?\b|\bresultado\s+garantid/i,
    message:
      "Este trecho promete um resultado. Nenhum tratamento pode ser garantido — descreva o que você faz, não o que vai acontecer.",
  },
  {
    code: "COMPARACAO",
    pattern: /\b(diferente|melhor|superior)\s+d(e|os|as)\s+(outros|demais|colegas)|\bao\s+contrário\s+d(e|os)\s+outros|\bnão\s+sou\s+como\s+(os\s+)?outros/i,
    message:
      "Este trecho se compara a outros profissionais. Fale do seu jeito de atender sem colocar colegas como referência negativa.",
  },
  {
    code: "DADO_DE_PACIENTE",
    // Cobre as duas ordens naturais: "tratei uma paciente de 62 anos" e
    // "uma paciente que atendi, de 62 anos". Idade + pessoa atendida é o
    // par que identifica; nenhum dos dois sozinho dispara.
    pattern: /\b(atendi|tratei|operei|acompanhei)\b[^.!?]{0,60}\b\d{1,3}\s*anos\b|\b(paciente|caso)\b[^.!?]{0,40}\b(atendi|tratei|operei|acompanhei)\b[^.!?]{0,40}\b\d{1,3}\s*anos\b|\bCPF\b|\bprontuário\s+n[º°]/i,
    message:
      "Este trecho parece descrever um paciente específico. Nada aqui pode identificar quem você atendeu.",
  },
];

/**
 * Analisa o texto. Nunca altera nada — devolve o que encontrou.
 * Lista vazia = pode salvar.
 */
export function inspectDeclaredText(text: string): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const rule of RULES) {
    const match = rule.pattern.exec(text);
    if (match) {
      issues.push({ code: rule.code, message: rule.message, excerpt: match[0] });
    }
  }
  return issues;
}

/**
 * GUARD DE VERBATIM — a fala do paciente nunca vira dado sobre profissional.
 *
 * @metodo ACE_BOUNDARIES §1.4 — reputação informal não entra
 *
 * O relatório da Missão 2 apontou o risco: em PA3, o paciente pode citar um
 * profissional pelo nome. A proteção NÃO é censurar a fala dele — é garantir,
 * estruturalmente, que essa fala não produza entidade, vínculo, atributo, tag
 * ou comparação sobre ninguém.
 *
 * Esta função existe para deixar a garantia EXPLÍCITA e testável: o verbatim
 * é texto pertencente ao Case, e nada no caminho de gravação o transforma em
 * outra coisa. Não tentamos adivinhar nomes próprios — detecção por
 * aproximação textual criaria falsa segurança e acusaria homônimos.
 */
export const VERBATIM_CONTRACT = {
  /** O verbatim pertence a este Case. */
  scope: "CASE" as const,
  /** Nunca cria ou vincula entidade de profissional. */
  createsProfessionalEntity: false,
  /** Nunca vira tag, atributo, nota ou comparação. */
  producesAttribute: false,
  /** Nunca alimenta ordenação, shortlist ou score. */
  feedsRanking: false,
} as const;
