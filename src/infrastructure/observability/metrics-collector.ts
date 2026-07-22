import type { ColetaMetricasOperacionais } from "@/observability-flow/contracts/operational-metrics";
import { derivarPainelOperacional } from "@/infrastructure/workflow/derivar-painel-operacional";
import { SupabaseWorkflowQuery } from "@/infrastructure/workflow/supabase-workflow-query";

const HORAS_CURADORIA_PADRAO = 24;

export async function coletarMetricasOperacionais(): Promise<ColetaMetricasOperacionais> {
  const query = new SupabaseWorkflowQuery();
  const casos = await query.listarCasosOperacionais();
  const painel = derivarPainelOperacional(casos);

  const casosBloqueados = painel.casos_bloqueados.map((c) => c.jornada_id);
  const casosSlaCritico = painel.slas_vencendo
    .filter((s) => s.status === "VENCIDO" || s.status === "PROXIMO_VENCIMENTO")
    .map((s) => s.jornada_id);

  const etapas = new Map<string, number[]>();
  for (const caso of casos) {
    const atualizado = Date.parse(caso.atualizado_em);
    if (Number.isNaN(atualizado)) continue;
    const elapsed = Date.now() - atualizado;
    const etapa = caso.view.etapa_atual;
    const bucket = etapas.get(etapa) ?? [];
    bucket.push(elapsed);
    etapas.set(etapa, bucket);
  }

  const metricas: ColetaMetricasOperacionais["metricas"] = [];

  for (const [etapa, amostras] of etapas.entries()) {
    const media = amostras.reduce((acc, v) => acc + v, 0) / amostras.length;
    metricas.push({
      codigo: "TEMPO_MEDIO_ETAPA",
      coletada_em: new Date().toISOString(),
      unidade: "ms",
      etapa,
      valor: Math.round(media),
      amostras: amostras.length,
    });
  }

  const curadoriaAmostras = casos.filter((c) => c.view.etapa_atual === "CURADORIA");
  metricas.push({
    codigo: "TEMPO_MEDIO_CURADORIA",
    coletada_em: new Date().toISOString(),
    unidade: "horas",
    valor: curadoriaAmostras.length
      ? Math.round(
          curadoriaAmostras.reduce((acc, c) => {
            const atualizado = Date.parse(c.atualizado_em);
            if (Number.isNaN(atualizado)) return acc;
            return acc + (Date.now() - atualizado) / (1000 * 60 * 60);
          }, 0) / curadoriaAmostras.length,
        )
      : HORAS_CURADORIA_PADRAO,
    amostras: curadoriaAmostras.length,
  });

  metricas.push({
    codigo: "CASOS_BLOQUEADOS",
    coletada_em: new Date().toISOString(),
    unidade: "contagem",
    valor: casosBloqueados.length,
    casos: casosBloqueados,
  });

  metricas.push({
    codigo: "CASOS_SLA_CRITICO",
    coletada_em: new Date().toISOString(),
    unidade: "contagem",
    valor: casosSlaCritico.length,
    casos: casosSlaCritico,
  });

  return {
    metricas,
    gerado_em: new Date().toISOString(),
  };
}
