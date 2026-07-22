import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  FILA_POR_ETAPA,
  FILAS_OPERACIONAIS,
  type FilasOperacionaisView,
  type ItemFilaOperacional,
} from "@/workflow-flow/contracts/filas-operacionais";
import { derivarAtorComAcao, derivarFaseWorkflow } from "@/infrastructure/workflow/derivar-fase-workflow";

export interface CasoOperacionalInput {
  jornada_id: string;
  paciente_id: string;
  paciente_nome: string;
  titulo_jornada: string;
  view: JornadaDoPacienteView;
  curador_id: string | null;
  curador_nome: string | null;
  atualizado_em: string;
}

const ORDEM_FILA: Record<ItemFilaOperacional["fila"], number> = {
  PRIMEIRO_CONTATO: 0,
  DOCUMENTACAO: 1,
  CURADORIA: 2,
  ENTREGA: 3,
  ACOMPANHAMENTO: 4,
};

export function classificarCasoNaFila(caso: CasoOperacionalInput): ItemFilaOperacional {
  const fila = FILA_POR_ETAPA[caso.view.etapa_atual];
  const fase = derivarFaseWorkflow(caso.view);

  return {
    jornada_id: caso.jornada_id,
    paciente_id: caso.paciente_id,
    paciente_nome: caso.paciente_nome,
    titulo_jornada: caso.titulo_jornada,
    fila,
    etapa_atual: caso.view.etapa_atual,
    ator_com_acao: derivarAtorComAcao(caso.view, fase, caso.curador_id !== null),
    bloqueado: caso.view.bloqueio !== null,
    curador_id: caso.curador_id,
    curador_nome: caso.curador_nome,
    atualizado_em: caso.atualizado_em,
    ordem_fila: ORDEM_FILA[fila],
  };
}

export function agruparFilasOperacionais(casos: ItemFilaOperacional[]): FilasOperacionaisView {
  const filas = Object.fromEntries(
    FILAS_OPERACIONAIS.map((codigo) => [codigo, [] as ItemFilaOperacional[]]),
  ) as Record<ItemFilaOperacional["fila"], ItemFilaOperacional[]>;

  for (const caso of casos) {
    filas[caso.fila].push(caso);
  }

  for (const codigo of FILAS_OPERACIONAIS) {
    filas[codigo].sort((a, b) => {
      if (a.bloqueado !== b.bloqueado) {
        return a.bloqueado ? -1 : 1;
      }
      return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime();
    });
  }

  return {
    filas,
    total_casos: casos.length,
  };
}

export function derivarFilasOperacionais(casos: CasoOperacionalInput[]): FilasOperacionaisView {
  const itens = casos.map(classificarCasoNaFila);
  return agruparFilasOperacionais(itens);
}
