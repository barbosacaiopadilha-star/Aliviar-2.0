export type MetricaCodigo =
  | "TEMPO_MEDIO_ETAPA"
  | "TEMPO_MEDIO_CURADORIA"
  | "CASOS_BLOQUEADOS"
  | "CASOS_SLA_CRITICO";

export interface MetricaOperacionalBase {
  codigo: MetricaCodigo;
  coletada_em: string;
  unidade: "ms" | "horas" | "contagem";
}

export interface MetricaTempoMedioEtapa extends MetricaOperacionalBase {
  codigo: "TEMPO_MEDIO_ETAPA";
  unidade: "ms";
  etapa: string;
  valor: number;
  amostras: number;
}

export interface MetricaTempoMedioCuradoria extends MetricaOperacionalBase {
  codigo: "TEMPO_MEDIO_CURADORIA";
  unidade: "horas";
  valor: number;
  amostras: number;
}

export interface MetricaCasosBloqueados extends MetricaOperacionalBase {
  codigo: "CASOS_BLOQUEADOS";
  unidade: "contagem";
  valor: number;
  casos: string[];
}

export interface MetricaCasosSlaCritico extends MetricaOperacionalBase {
  codigo: "CASOS_SLA_CRITICO";
  unidade: "contagem";
  valor: number;
  casos: string[];
}

export type MetricaOperacional =
  | MetricaTempoMedioEtapa
  | MetricaTempoMedioCuradoria
  | MetricaCasosBloqueados
  | MetricaCasosSlaCritico;

export interface ColetaMetricasOperacionais {
  metricas: MetricaOperacional[];
  gerado_em: string;
}
