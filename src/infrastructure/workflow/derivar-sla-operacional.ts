import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  FILA_POR_ETAPA,
  type FilaOperacionalCodigo,
} from "@/workflow-flow/contracts/filas-operacionais";
import {
  POLITICAS_SLA,
  type PoliticaSlaFila,
  type SlaEtapaOperacional,
  type StatusSla,
} from "@/workflow-flow/contracts/sla-operacional";

const MS_POR_HORA = 60 * 60 * 1000;

export function obterPoliticaSla(
  fila: FilaOperacionalCodigo,
  politicas?: readonly PoliticaSlaFila[],
): PoliticaSlaFila {
  const source = politicas ?? POLITICAS_SLA;
  const politica = source.find((p) => p.fila === fila);
  if (!politica) {
    throw new Error(`Política SLA não definida para fila ${fila}`);
  }
  return politica;
}

export function calcularStatusSla(
  horasDecorridas: number,
  tempoEsperadoHoras: number,
  tempoLimiteHoras: number,
): StatusSla {
  if (horasDecorridas >= tempoLimiteHoras) {
    return "VENCIDO";
  }
  if (horasDecorridas >= tempoEsperadoHoras) {
    return "PROXIMO_VENCIMENTO";
  }
  return "NO_PRAZO";
}

export function derivarSlaEtapa(params: {
  jornadaId: string;
  view: JornadaDoPacienteView;
  referenciaAgora?: Date;
  politicas?: readonly PoliticaSlaFila[];
}): SlaEtapaOperacional {
  const fila = FILA_POR_ETAPA[params.view.etapa_atual];
  const politica = obterPoliticaSla(fila, params.politicas);
  const agora = params.referenciaAgora ?? new Date();
  const inicio = new Date(params.view.atualizada_em);
  const horasDecorridas = (agora.getTime() - inicio.getTime()) / MS_POR_HORA;
  const limite = new Date(inicio.getTime() + politica.tempo_limite_horas * MS_POR_HORA);

  return {
    jornada_id: params.view.jornada_id,
    fila,
    tempo_esperado_horas: politica.tempo_esperado_horas,
    tempo_limite_horas: politica.tempo_limite_horas,
    responsavel: politica.responsavel,
    status: calcularStatusSla(
      horasDecorridas,
      politica.tempo_esperado_horas,
      politica.tempo_limite_horas,
    ),
    inicio_em: inicio.toISOString(),
    limite_em: limite.toISOString(),
    horas_decorridas: Math.round(horasDecorridas * 10) / 10,
  };
}

export function listarSlasVencendo(
  casos: Array<{ jornada_id: string; view: JornadaDoPacienteView }>,
  referenciaAgora?: Date,
): SlaEtapaOperacional[] {
  return casos
    .map((c) => derivarSlaEtapa({ jornadaId: c.jornada_id, view: c.view, referenciaAgora }))
    .filter((s) => s.status !== "NO_PRAZO")
    .sort((a, b) => new Date(a.limite_em).getTime() - new Date(b.limite_em).getTime());
}
