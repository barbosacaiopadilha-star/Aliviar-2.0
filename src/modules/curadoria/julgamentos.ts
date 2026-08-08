/**
 * A DIVISÃO DA ETAPA AVALIAÇÃO — o domínio puro do juízo humano (Item 2.3).
 *
 * @metodo CONTRATO_2_3 (PA-16) §2/§9 — o Motor lê e sinaliza; o Curador
 *         conclui; o banco arbitra; a etapa DERIVA
 * @metodo ADR-067 §5 — H8–H10 sempre exigidos; H11 quando o Case declarou
 *         grau para o conceito relacional humano
 *
 * Este módulo responde, sem tocar banco: dados os julgamentos lidos e os
 * conceitos relacionais que o Case declarou, o que a etapa AVALIAÇÃO ainda
 * aguarda — e por quê, com o motivo NOMEADO (E-01/E-03: lacuna dita, nunca
 * silêncio).
 *
 * O que ele NUNCA faz: criar juízo, sugerir conclusão, pré-preencher,
 * ordenar candidatas, copiar conclusão anterior. `AGUARDA_JUIZO_DO_CURADOR`
 * é derivação da AUSÊNCIA (ADR-065 §3) — `PENDENTE` não existe.
 *
 * Puro e determinístico: sem React, sem banco.
 */

/** H8–H10 — os três critérios técnicos, SEMPRE exigidos (ADR-067 §5). */
export const JULGAMENTOS_TECNICOS_EXIGIDOS = ["FORMACAO", "EXPERIENCIA", "HISTORICO"] as const;

/** H11 — os conceitos relacionais humanos; exigidos quando o Case os declarou. */
export const CONCEITOS_RELACIONAIS_HUMANOS = [
  "MODELO_DECISAO_COMPARTILHADA",
  "MODELO_PREFERENCIAS_E_RESTRICOES",
  "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
] as const;

export type JulgamentoLido = {
  id: string;
  subcriterionCode: string;
  natureza: "TECNICO" | "RELACIONAL";
  state: "VIGENTE" | "SUPERADO" | "RETIRADO";
  conclusao: string;
  motivo: string | null;
  versao: number;
  versaoAnteriorId: string | null;
  actorId: string;
  actedAt: string;
  /** Derivado no banco: existe versão que referencia esta como anterior. */
  temSucessora: boolean;
  evidencias: { evidenceId: string; evidenceVersion: number; verificationStatus: string }[];
};

/**
 * Por que um conceito exigido está aguardando — o motivo nomeado que a Mesa
 * exibe. `JUIZO_SUPERADO_POR_EVIDENCIA` é derivação estrutural: SUPERADO sem
 * sucessora só acontece via JS3 (a supersessão por nova versão — JS1 — nasce
 * com a sucessora na mesma transação).
 */
export type MotivoDeAguardo =
  | "SEM_JUIZO"
  | "JUIZO_RETIRADO"
  | "JUIZO_SUPERADO_POR_EVIDENCIA";

export type LacunaDeJuizo = {
  subcriterionCode: string;
  natureza: "TECNICO" | "RELACIONAL";
  motivo: MotivoDeAguardo;
};

/** Os conceitos exigidos para UM profissional neste Case (ADR-067 §5). */
export function conceitosExigidos(conceitosRelacionaisDeclarados: readonly string[]): {
  code: string;
  natureza: "TECNICO" | "RELACIONAL";
}[] {
  const relacionais = CONCEITOS_RELACIONAIS_HUMANOS.filter((code) =>
    conceitosRelacionaisDeclarados.includes(code),
  );
  return [
    ...JULGAMENTOS_TECNICOS_EXIGIDOS.map((code) => ({ code, natureza: "TECNICO" as const })),
    ...relacionais.map((code) => ({ code, natureza: "RELACIONAL" as const })),
  ];
}

/** A cadeia de um conceito, na ordem das versões. */
function cadeiaDoConceito(
  julgamentos: readonly JulgamentoLido[],
  code: string,
): JulgamentoLido[] {
  return julgamentos
    .filter((julgamento) => julgamento.subcriterionCode === code)
    .sort((a, b) => a.versao - b.versao);
}

/**
 * As lacunas de juízo de UM profissional: para cada conceito exigido sem
 * julgamento `VIGENTE`, o motivo nomeado. Lista vazia = a avaliação deste
 * profissional está completa (vigente e atual — o JS3 garante que vigente
 * desatualizado não existe: evidência nova o teria superado no ato).
 */
export function lacunasDeJuizo(
  julgamentos: readonly JulgamentoLido[],
  conceitosRelacionaisDeclarados: readonly string[],
): LacunaDeJuizo[] {
  const lacunas: LacunaDeJuizo[] = [];

  for (const exigido of conceitosExigidos(conceitosRelacionaisDeclarados)) {
    const cadeia = cadeiaDoConceito(julgamentos, exigido.code);
    const vigente = cadeia.find((julgamento) => julgamento.state === "VIGENTE");
    if (vigente) continue;

    const ultima = cadeia[cadeia.length - 1];
    if (!ultima) {
      lacunas.push({ subcriterionCode: exigido.code, natureza: exigido.natureza, motivo: "SEM_JUIZO" });
    } else if (ultima.state === "RETIRADO") {
      // O autor retirou sem substituir: o conceito voltou a ausência de juízo.
      lacunas.push({
        subcriterionCode: exigido.code,
        natureza: exigido.natureza,
        motivo: "JUIZO_RETIRADO",
      });
    } else {
      // SUPERADO na ponta da cadeia = JS3: evidência nova derrubou o juízo e
      // nenhum ato humano novo aconteceu ainda. O Curador vê o anterior como
      // HISTÓRICO — e o campo da nova conclusão nasce vazio (G-2.3-5).
      lacunas.push({
        subcriterionCode: exigido.code,
        natureza: exigido.natureza,
        motivo: "JUIZO_SUPERADO_POR_EVIDENCIA",
      });
    }
  }

  return lacunas;
}

/** O vigente de um conceito, se houver — a conclusão que vale agora. */
export function julgamentoVigente(
  julgamentos: readonly JulgamentoLido[],
  code: string,
): JulgamentoLido | null {
  return (
    cadeiaDoConceito(julgamentos, code).find((julgamento) => julgamento.state === "VIGENTE") ?? null
  );
}

/**
 * O regime da etapa AVALIAÇÃO (G-2.3-7): `JUIZO` é a divisão do 2.3;
 * `LEGADO_6XN` restaura a conclusão pela avaliação manual 6×N
 * (`criterion_declarations`, preservadas intactas — O-1: Cases antigos ficam
 * no regime em que nasceram, e a flag de rollback devolve a leitura antiga
 * sem perda).
 */
export type RegimeDaAvaliacao = "JUIZO" | "LEGADO_6XN";

export function regimeDaAvaliacao(flagLegado: string | undefined): RegimeDaAvaliacao {
  return flagLegado === "1" || flagLegado?.toUpperCase() === "LEGADO_6XN" ? "LEGADO_6XN" : "JUIZO";
}
