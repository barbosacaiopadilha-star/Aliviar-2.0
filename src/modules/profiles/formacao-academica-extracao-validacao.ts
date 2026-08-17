import { z } from "zod";

import { FORMACAO_KINDS, type FormacaoKind } from "@/modules/profiles/formacao-academica";

/**
 * OS PORTÕES DO CANDIDATO — onde "não inventar" vira código.
 *
 * Todo candidato a formação, venha do seccionador determinístico (B1) ou de um
 * modelo (B2), atravessa DOIS portões antes de existir:
 *
 * 1. Forma: tipo em lista fechada, tamanhos com teto, anos plausíveis e
 *    período coerente. Saída malformada derruba o candidato, nunca o run
 *    inteiro silenciosamente — o descarte é contado e reportado.
 * 2. Presença literal: título e instituição precisam EXISTIR no texto
 *    extraído, comparados sem caixa/acentos/espaços. O que o currículo não
 *    diz, o candidato não pode dizer — é a defesa objetiva contra alucinação
 *    de modelo e contra instrução maliciosa embutida no PDF: o texto injetado
 *    até passa no portão (está literalmente lá), mas jamais vira formação
 *    confirmada, porque NENHUM caminho do extrator grava `verificado` — a
 *    última porta é sempre uma pessoa.
 */

export const ANO_MINIMO = 1940;

export type CandidatoDeFormacao = {
  kind: FormacaoKind;
  title: string;
  institution: string | null;
  city: string | null;
  country: string | null;
  periodStart: number | null;
  periodEnd: number | null;
};

/** Schema do candidato — também é o contrato de saída estruturada do B2. */
export const candidatoSchema = z.object({
  kind: z.enum(FORMACAO_KINDS),
  title: z.string().trim().min(2).max(200),
  institution: z.string().trim().min(2).max(200).nullable(),
  city: z.string().trim().min(2).max(120).nullable(),
  country: z.string().trim().min(2).max(120).nullable(),
  periodStart: z.number().int().nullable(),
  periodEnd: z.number().int().nullable(),
});

/** Caixa, acentos e espaços fora — sobra o que o texto de fato diz. */
export function normalizarParaComparacao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type Descarte = { candidato: unknown; motivo: string };

export function validarCandidato(
  bruto: unknown,
  textoExtraido: string,
  agora = new Date(),
): { candidato: CandidatoDeFormacao | null; descarte: Descarte | null } {
  const parsed = candidatoSchema.safeParse(bruto);
  if (!parsed.success) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "forma_invalida" } };
  }
  const c = parsed.data;

  const anoMax = agora.getFullYear() + 1;
  for (const ano of [c.periodStart, c.periodEnd]) {
    if (ano !== null && (ano < ANO_MINIMO || ano > anoMax)) {
      return { candidato: null, descarte: { candidato: bruto, motivo: "ano_implausivel" } };
    }
  }
  if (c.periodStart !== null && c.periodEnd !== null && c.periodEnd < c.periodStart) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "periodo_incoerente" } };
  }

  const texto = normalizarParaComparacao(textoExtraido);
  if (!texto.includes(normalizarParaComparacao(c.title))) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "titulo_ausente_do_texto" } };
  }
  if (c.institution && !texto.includes(normalizarParaComparacao(c.institution))) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "instituicao_ausente_do_texto" } };
  }
  if (c.city && !texto.includes(normalizarParaComparacao(c.city))) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "cidade_ausente_do_texto" } };
  }
  if (c.country && !texto.includes(normalizarParaComparacao(c.country))) {
    return { candidato: null, descarte: { candidato: bruto, motivo: "pais_ausente_do_texto" } };
  }

  return { candidato: c, descarte: null };
}

/**
 * Chave de deduplicação — inclui o PERÍODO de propósito: a mesma pós na mesma
 * casa em anos diferentes é outra formação, não duplicata (correção do item 5).
 */
export function chaveDeDuplicidade(c: {
  kind: string;
  title: string;
  institution: string | null;
  periodStart: number | null;
  periodEnd: number | null;
}): string {
  return [
    c.kind,
    normalizarParaComparacao(c.title),
    c.institution ? normalizarParaComparacao(c.institution) : "",
    c.periodStart ?? "",
    c.periodEnd ?? "",
  ].join("|");
}
