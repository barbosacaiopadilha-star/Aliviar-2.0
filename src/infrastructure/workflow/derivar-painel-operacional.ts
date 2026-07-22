import type { PainelOperacionalModel } from "@/workflow-flow/contracts/painel-operacional";
import type { CasoOperacionalInput } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { classificarCasoNaFila } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { derivarSlaEtapa } from "@/infrastructure/workflow/derivar-sla-operacional";
import type { AtorWorkflow } from "@/workflow-flow/contracts/workflow-engine";

const MS_POR_HORA = 60 * 60 * 1000;

export function derivarPainelOperacional(
  casos: CasoOperacionalInput[],
  referenciaAgora?: Date,
): PainelOperacionalModel {
  const agora = referenciaAgora ?? new Date();
  const quem_precisa_agir: PainelOperacionalModel["quem_precisa_agir"] = [];
  const quem_esta_esperando: PainelOperacionalModel["quem_esta_esperando"] = [];
  const casos_bloqueados: PainelOperacionalModel["casos_bloqueados"] = [];
  const slas_vencendo: PainelOperacionalModel["slas_vencendo"] = [];

  for (const caso of casos) {
    const item = classificarCasoNaFila(caso);
    const sla = derivarSlaEtapa({
      jornadaId: caso.jornada_id,
      view: caso.view,
      referenciaAgora: agora,
    });

    if (caso.view.bloqueio) {
      casos_bloqueados.push({
        jornada_id: caso.jornada_id,
        paciente_nome: caso.paciente_nome,
        motivo: caso.view.bloqueio.motivo_humano,
        bloqueado_desde: caso.view.bloqueio.desde,
        etapa: caso.view.etapa_atual,
      });
    }

    if (item.ator_com_acao !== "NENHUM") {
      quem_precisa_agir.push({
        jornada_id: caso.jornada_id,
        paciente_nome: caso.paciente_nome,
        fila: item.fila,
        ator_com_acao: item.ator_com_acao as AtorWorkflow,
        descricao: caso.view.proximo_passo?.titulo ?? `Ação pendente em ${item.fila}`,
        atualizado_em: caso.atualizado_em,
      });
    } else {
      quem_esta_esperando.push({
        jornada_id: caso.jornada_id,
        paciente_nome: caso.paciente_nome,
        fila: item.fila,
        aguardando_desde: caso.view.atualizada_em,
        responsavel_esperado: caso.view.responsavel.nome_exibicao ?? caso.view.responsavel.tipo,
      });
    }

    if (sla.status !== "NO_PRAZO") {
      const horasRestantes = Math.max(
        0,
        (new Date(sla.limite_em).getTime() - agora.getTime()) / MS_POR_HORA,
      );
      slas_vencendo.push({
        jornada_id: caso.jornada_id,
        paciente_nome: caso.paciente_nome,
        fila: sla.fila,
        status: sla.status,
        limite_em: sla.limite_em,
        horas_restantes: Math.round(horasRestantes * 10) / 10,
      });
    }
  }

  quem_precisa_agir.sort(
    (a, b) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime(),
  );
  slas_vencendo.sort((a, b) => a.horas_restantes - b.horas_restantes);

  return {
    quem_precisa_agir,
    quem_esta_esperando,
    casos_bloqueados,
    slas_vencendo,
    gerado_em: agora.toISOString(),
  };
}
