import type {
  CuratorProdutividadeView,
  CuratorSearchResultItem,
} from "@/curator-tools-flow/contracts/curator-tools";
import type { EstadoOperacionalCurador } from "@/curator-flow/contracts/curador-view";

const MS_HORA = 60 * 60 * 1000;

export function sanitizeSearchTerm(query: string): string {
  return query.trim().replace(/[%_\\]/g, "\\$&");
}

export function dedupeSearchResults(resultados: CuratorSearchResultItem[]): CuratorSearchResultItem[] {
  const unique = new Map<string, CuratorSearchResultItem>();
  for (const item of resultados) {
    const key = `${item.entity_type}:${item.entity_id}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }
  return [...unique.values()].slice(0, 30);
}

export interface ProdutividadeSample {
  estado: EstadoOperacionalCurador;
  horasDesdeAtualizacao: number;
}

export function aggregateProdutividade(samples: ProdutividadeSample[]): CuratorProdutividadeView {
  let somaHoras = 0;
  let somaRevisao = 0;
  let somaEntrega = 0;
  let emAndamento = 0;
  let revisaoCount = 0;
  let entregaCount = 0;

  for (const sample of samples) {
    somaHoras += sample.horasDesdeAtualizacao;

    if (sample.estado === "EM_ANALISE" || sample.estado === "PRONTO_PARA_ENTREGA") {
      emAndamento += 1;
      somaRevisao += sample.horasDesdeAtualizacao;
      revisaoCount += 1;
    }

    if (sample.estado === "ENTREGUE" || sample.estado === "ACOMPANHAMENTO") {
      somaEntrega += sample.horasDesdeAtualizacao;
      entregaCount += 1;
    }
  }

  const amostras = samples.length;

  return {
    tempo_medio_caso_horas: amostras ? Math.round((somaHoras / amostras) * 10) / 10 : 0,
    casos_em_andamento: emAndamento,
    tempo_medio_revisao_horas: revisaoCount ? Math.round((somaRevisao / revisaoCount) * 10) / 10 : 0,
    tempo_medio_ate_entrega_horas: entregaCount
      ? Math.round((somaEntrega / entregaCount) * 10) / 10
      : 0,
    amostras,
    gerado_em: new Date().toISOString(),
  };
}

export function horasDesde(isoDate: string, agoraMs = Date.now()): number {
  return (agoraMs - new Date(isoDate).getTime()) / MS_HORA;
}
