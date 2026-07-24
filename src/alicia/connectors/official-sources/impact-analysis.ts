import type { OfficialSourceImpactRanking, OfficialSourceRecord } from "./types";

function maxBy(
  sources: OfficialSourceRecord[],
  selector: (source: OfficialSourceRecord) => number,
): OfficialSourceRecord {
  return sources.reduce((best, current) =>
    selector(current) > selector(best) ? current : best,
  );
}

export function computeImpactRanking(
  sources: OfficialSourceRecord[],
): OfficialSourceImpactRanking {
  const eligible = sources.filter((source) => source.mock || source.status !== "producao");

  return {
    maiorGanhoCobertura: maxBy(eligible, (s) => s.ganhoCoberturaEstimado),
    maiorReducaoReview: maxBy(eligible, (s) => s.reducaoReviewEstimada),
    maiorGanhoAutoPublish: maxBy(eligible, (s) => s.ganhoAutoPublishEstimado),
    primeiraIntegracao: selectFirstIntegration(sources),
  };
}

/**
 * CRM Estadual tem adapter real e é pré-requisito de identidade para demais fontes.
 * Em empate de impacto, prioriza o que já está em homologação.
 */
export function selectFirstIntegration(sources: OfficialSourceRecord[]): OfficialSourceRecord {
  const crm = sources.find((s) => s.id === "crm-estadual-es");
  if (crm) {
    return crm;
  }

  return maxBy(sources, (s) => {
    const stageBonus =
      (s.homologacao ? 100 : 0) + (s.staging ? 200 : 0) + (s.producao ? 300 : 0);
    return stageBonus + s.ganhoCoberturaEstimado;
  });
}

export function sourcesInStage(
  sources: OfficialSourceRecord[],
  stage: "mock" | "homologacao" | "staging" | "producao",
): OfficialSourceRecord[] {
  switch (stage) {
    case "mock":
      return sources.filter((s) => s.mock && !s.homologacao);
    case "homologacao":
      return sources.filter((s) => s.homologacao && !s.staging);
    case "staging":
      return sources.filter((s) => s.staging && !s.producao);
    case "producao":
      return sources.filter((s) => s.producao);
  }
}
