/**
 * GOVERNANÇA — o domínio puro dos documentos, versões e pendências.
 *
 * @metodo Fundamentos §13 — quem consente é a pessoa, e o ato é dela
 *
 * Este arquivo não conhece banco nem React: recebe o que foi lido e responde
 * quem ainda precisa aceitar o quê. É a peça testável sem stack de pé, e a
 * mesma regra que o gate do servidor consulta antes de liberar uma superfície.
 *
 * O que ele NUNCA faz: decidir conteúdo jurídico. Prazo, base legal e texto
 * são de quem assina — aqui só existe a mecânica de vigência e pendência.
 */

/** Público-alvo de um documento — espelha `curadoria.legal_audience`. */
export const AUDIENCIAS = ["paciente", "profissional", "equipe"] as const;
export type Audiencia = (typeof AUDIENCIAS)[number];

/** Origem do aceite — espelha `curadoria.legal_acceptance_origin`. */
export const ORIGENS_DE_ACEITE = [
  "primeiro_acesso",
  "reaceite_por_nova_versao",
  "escolha_de_profissional",
  "portal_da_conta",
] as const;
export type OrigemDeAceite = (typeof ORIGENS_DE_ACEITE)[number];

/**
 * Os papéis operacionais mapeados para a audiência dos documentos. A equipe
 * inteira lê dado clínico — por isso todos os papéis internos caem em
 * "equipe", e o Termo de Confidencialidade os alcança sem exceção.
 */
const AUDIENCIA_POR_PAPEL: Record<string, Audiencia> = {
  paciente: "paciente",
  profissional: "profissional",
  curador_medico: "equipe",
  atendente: "equipe",
  concierge: "equipe",
  administrador: "equipe",
};

export function audienciasDosPapeis(papeis: readonly string[]): Audiencia[] {
  const encontradas = new Set<Audiencia>();
  for (const papel of papeis) {
    const audiencia = AUDIENCIA_POR_PAPEL[papel];
    if (audiencia) encontradas.add(audiencia);
  }
  return [...encontradas];
}

export type DocumentoLegal = {
  id: string;
  slug: string;
  nome: string;
  resumo: string | null;
  audiencia: Audiencia[];
  obrigatorio: boolean;
  revogavel: boolean;
  ativo: boolean;
};

export type VersaoDeDocumento = {
  id: string;
  documentId: string;
  versao: string;
  conteudo: string;
  conteudoHash: string;
  idioma: string;
  requiresReacceptance: boolean;
  effectiveAt: string;
  publishedAt: string;
};

export type AceiteRegistrado = {
  id: string;
  profileId: string;
  versionId: string;
  conteudoHash: string;
  aceitoEm: string;
  origem: OrigemDeAceite;
  idioma: string;
  contexto: Record<string, unknown>;
  /** Preenchido quando o titular revogou — o aceite em si nunca some. */
  revogadoEm: string | null;
};

/**
 * A versão vigente de um documento: a mais recente que já entrou em vigor.
 * Espelha `curadoria.versao_vigente` — a mesma regra dos dois lados, para que
 * a tela nunca ofereça para aceite algo que o banco recusaria.
 */
export function versaoVigente(
  versoes: readonly VersaoDeDocumento[],
  agora: Date = new Date(),
): VersaoDeDocumento | null {
  const emVigor = versoes
    .filter((v) => new Date(v.effectiveAt).getTime() <= agora.getTime())
    .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt));
  return emVigor[0] ?? null;
}

export type PendenciaDeAceite = {
  documento: DocumentoLegal;
  versao: VersaoDeDocumento;
  /** `nunca_aceito` distingue primeiro acesso de reaceite por versão nova. */
  motivo: "nunca_aceito" | "versao_nova" | "revogado";
};

/**
 * O que falta esta pessoa aceitar. Regra, em uma frase: para cada documento
 * OBRIGATÓRIO da audiência dela, existe pendência quando não há aceite vigente
 * e não-revogado da versão vigente.
 *
 * `requiresReacceptance` é o que separa mudança material de correção
 * editorial: versão nova marcada como editorial não incomoda quem já aceitou
 * a anterior — e a decisão de qual é qual é de quem assina o documento, não
 * deste código.
 */
export function pendenciasDeAceite(input: {
  audiencias: readonly Audiencia[];
  documentos: readonly DocumentoLegal[];
  versoesPorDocumento: ReadonlyMap<string, readonly VersaoDeDocumento[]>;
  aceites: readonly AceiteRegistrado[];
  agora?: Date;
}): PendenciaDeAceite[] {
  const agora = input.agora ?? new Date();
  const audiencias = new Set(input.audiencias);
  const pendencias: PendenciaDeAceite[] = [];

  for (const documento of input.documentos) {
    if (!documento.ativo || !documento.obrigatorio) continue;
    if (!documento.audiencia.some((a) => audiencias.has(a))) continue;

    const versoes = input.versoesPorDocumento.get(documento.id) ?? [];
    const vigente = versaoVigente(versoes, agora);
    if (!vigente) continue; // documento sem versão publicada não cobra nada

    const idsDoDocumento = new Set(versoes.map((v) => v.id));
    const aceitesDoDocumento = input.aceites.filter((a) => idsDoDocumento.has(a.versionId));
    const aceiteDaVigente = aceitesDoDocumento.find(
      (a) => a.versionId === vigente.id && a.revogadoEm === null,
    );
    if (aceiteDaVigente) continue;

    // Aceitou a vigente e revogou: volta a pender, com o motivo dito.
    if (aceitesDoDocumento.some((a) => a.versionId === vigente.id)) {
      pendencias.push({ documento, versao: vigente, motivo: "revogado" });
      continue;
    }

    const aceitouAlgumaAnterior = aceitesDoDocumento.some((a) => a.revogadoEm === null);
    if (!aceitouAlgumaAnterior) {
      pendencias.push({ documento, versao: vigente, motivo: "nunca_aceito" });
      continue;
    }

    // Já aceitou versão anterior: só volta a pender se a nova for material.
    if (vigente.requiresReacceptance) {
      pendencias.push({ documento, versao: vigente, motivo: "versao_nova" });
    }
  }

  return pendencias;
}

/**
 * O permalink de prova: endereça UMA versão, para sempre. É o que um registro
 * de aceite aponta, e o que se abre anos depois para ler o texto exato.
 */
export function permalinkDaVersao(slug: string, versao: string): string {
  return `/legal/${slug}/v/${encodeURIComponent(versao)}`;
}
