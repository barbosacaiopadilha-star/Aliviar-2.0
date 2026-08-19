/**
 * FORMAÇÃO ACADÊMICA — domínio puro da seção que o paciente vê.
 *
 * Três regras que este módulo existe para tornar inquebráveis:
 *
 * 1. Campo ausente é OMITIDO — nunca vira "não informado", linha vazia ou
 *    placeholder. A ausência é verdade e a verdade não precisa de enfeite.
 * 2. Nenhum rótulo promove curso, pós ou fellowship a título de especialista.
 *    O título exibido é o gravado, palavra por palavra.
 * 3. O selo é ÚNICO e binário. Não existe gradação, contagem comparável nem
 *    selo de prestígio — formação não gera nota, nível nem ranking.
 */

export const FORMACAO_KINDS = [
  "graduacao",
  "residencia",
  "especializacao",
  "fellowship",
  "pos_graduacao",
  "curso",
] as const;

export type FormacaoKind = (typeof FORMACAO_KINDS)[number];

export function isFormacaoKind(value: string): value is FormacaoKind {
  return (FORMACAO_KINDS as readonly string[]).includes(value);
}

/**
 * Rótulos neutros de TIPO. Deliberadamente nenhum deles contém a palavra
 * "especialista": "Especialização" nomeia o percurso, não outorga o título
 * (decisão vinculante 11).
 */
export const FORMACAO_KIND_LABELS: Record<FormacaoKind, string> = {
  graduacao: "Graduação",
  residencia: "Residência médica",
  especializacao: "Especialização",
  fellowship: "Fellowship",
  pos_graduacao: "Pós-graduação",
  curso: "Curso",
};

export const SELO_FORMACAO_VERIFICADA = "Formação verificada pela equipe";

/**
 * F-2 · A frase do estado indisponível — fonte única, neutra e sem técnica.
 * Ela existe para NÃO confundir "ainda não há formação confirmada" (silêncio
 * legítimo, o bloco não aparece) com "não conseguimos ler agora".
 */
export const FORMACAO_INDISPONIVEL = "Formação acadêmica temporariamente indisponível";

export type FormacaoStatus = "nao_verificado" | "verificado" | "divergente";

/** A entrada como a equipe a vê (administrativo). */
export type FormacaoEntrada = {
  id: string;
  professionalProfileId: string;
  kind: FormacaoKind;
  title: string;
  institution: string | null;
  city: string | null;
  country: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  notes: string | null;
  verificationStatus: FormacaoStatus;
  verifiedAt: string | null;
  /** Conceito do MEC do curso (1–5) — só graduação. Lançado pela equipe. */
  mecConceito: number | null;
  /** Ano do ciclo avaliativo, quando lançado. */
  mecConceitoAno: number | null;
  /** Rastro interno de extração — jamais atravessa para o paciente. */
  origem: { documentId: string; humanEdited: boolean } | null;
};

/** A entrada como o paciente a vê: só o confirmado, sem fonte, sem método. */
export type FormacaoPublica = {
  kind: FormacaoKind;
  title: string;
  institution: string | null;
  city: string | null;
  country: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  mecConceito: number | null;
  mecConceitoAno: number | null;
};

/** "2010–2016", "2016" ou null — nunca string vazia, nunca traço solto. */
export function formatarPeriodo(start: number | null, end: number | null): string | null {
  if (start !== null && end !== null) return start === end ? String(start) : `${start}–${end}`;
  if (start !== null) return String(start);
  if (end !== null) return String(end);
  return null;
}

/** "São Paulo, Brasil", "Brasil" ou null — a vírgula só existe com as duas partes. */
export function formatarLocal(city: string | null, country: string | null): string | null {
  const cidade = city?.trim() || null;
  const pais = country?.trim() || null;
  if (cidade && pais) return `${cidade}, ${pais}`;
  return cidade ?? pais ?? null;
}

/**
 * As linhas que a apresentação pública pode imprimir, já sem ausências.
 * Quem renderiza itera — não decide. É aqui que "campo vazio não prejudica o
 * layout" deixa de depender da disciplina de cada tela.
 */
export function linhasPublicas(entrada: FormacaoPublica): string[] {
  const linhas: string[] = [];
  const local = formatarLocal(entrada.city, entrada.country);
  const periodo = formatarPeriodo(entrada.periodStart, entrada.periodEnd);
  const instituicao = entrada.institution?.trim();
  if (instituicao) linhas.push(comConceitoDoMec(instituicao, entrada));
  if (local) linhas.push(local);
  if (periodo) linhas.push(periodo);
  return linhas;
}

/**
 * O conceito do MEC entra DENTRO da frase da instituição — nunca como linha
 * própria, selo ou número solto.
 *
 * A razão é de leitura, não de estilo: a carta é toda prosa, e um número
 * isolado seria a única coisa comparável entre as três opções. O olho iria
 * direto nele, e a paciente leria um ranking de três notas em vez de três
 * caminhos diferentes — que é o oposto do que a Curadoria fez por ela. Na
 * frase da escola, o conceito é o que de fato é: um fato sobre o curso, do
 * mesmo peso que a cidade e o ano.
 *
 * Sem conceito lançado, a frase é a instituição e nada mais — ausência é
 * omissão, como todo o resto deste módulo (regra 1).
 */
function comConceitoDoMec(instituicao: string, entrada: FormacaoPublica): string {
  if (entrada.mecConceito === null) return instituicao;
  const ano = entrada.mecConceitoAno === null ? "" : ` (${entrada.mecConceitoAno})`;
  return `${instituicao} — curso com conceito ${entrada.mecConceito} no MEC${ano}`;
}

/** Ordem estável de apresentação por tipo — trajetória, nunca mérito. */
export const ORDEM_DE_APRESENTACAO: readonly FormacaoKind[] = [
  "graduacao",
  "residencia",
  "especializacao",
  "fellowship",
  "pos_graduacao",
  "curso",
];

export function ordenarParaApresentacao<T extends { kind: FormacaoKind; periodStart: number | null }>(
  entradas: readonly T[],
): T[] {
  return [...entradas].sort((a, b) => {
    const porTipo = ORDEM_DE_APRESENTACAO.indexOf(a.kind) - ORDEM_DE_APRESENTACAO.indexOf(b.kind);
    if (porTipo !== 0) return porTipo;
    return (a.periodStart ?? 0) - (b.periodStart ?? 0);
  });
}

/** O selo existe quando há AO MENOS uma formação confirmada — e é um só. */
export function temSeloDeVerificacao(confirmadas: readonly FormacaoPublica[]): boolean {
  return confirmadas.length > 0;
}
