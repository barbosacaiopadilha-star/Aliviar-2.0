import { describe, expect, it } from "vitest";

import {
  buildJornadaViewAce,
  buildJornadaViewBloqueio,
  buildJornadaViewCuradoria,
  buildJornadaViewDescoberta,
  buildJornadaViewEntrega,
  buildJornadaViewHistorico,
} from "@/test/build-jornada-view";
import {
  aplicarComandoAtribuicao,
  InMemoryAtribuicaoStore,
} from "@/infrastructure/workflow/atribuicao-store";
import { derivarFaseWorkflow, resolverEstadoWorkflowCaso } from "@/infrastructure/workflow/derivar-fase-workflow";
import { classificarCasoNaFila, derivarFilasOperacionais } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { calcularStatusSla, derivarSlaEtapa } from "@/infrastructure/workflow/derivar-sla-operacional";
import { derivarNotificacoesCaso } from "@/infrastructure/workflow/derivar-notificacoes-operacionais";
import { derivarPainelOperacional } from "@/infrastructure/workflow/derivar-painel-operacional";
import {
  projetarSnapshotWorkflow,
  validarMarcoFluxo,
  TRANSICOES_FLUXO_COMPLETO,
} from "@/infrastructure/workflow/workflow-orchestrator";
import { CICLO_WORKFLOW } from "@/workflow-flow/contracts/workflow-engine";
import { FILAS_OPERACIONAIS } from "@/workflow-flow/contracts/filas-operacionais";

function casoBase(view = buildJornadaViewHistorico()) {
  return {
    jornada_id: "jornada-1",
    paciente_id: "paciente-1",
    paciente_nome: "Maria Silva",
    titulo_jornada: "Jornada teste",
    view,
    curador_id: null as string | null,
    curador_nome: null as string | null,
    atualizado_em: view.atualizada_em,
  };
}

describe("Workflow Engine", () => {
  it("ciclo canônico Paciente → Operação → Curador → Paciente", () => {
    expect(CICLO_WORKFLOW).toEqual([
      "PACIENTE_ATIVO",
      "OPERACAO_PROCESSANDO",
      "CURADOR_ATIVO",
      "PACIENTE_RETORNO",
    ]);
  });

  it("deriva PACIENTE_ATIVO no onboarding inicial", () => {
    const view = buildJornadaViewHistorico();
    expect(derivarFaseWorkflow(view)).toBe("PACIENTE_ATIVO");
  });

  it("deriva OPERACAO_PROCESSANDO no ACE", () => {
    expect(derivarFaseWorkflow(buildJornadaViewAce())).toBe("OPERACAO_PROCESSANDO");
  });

  it("deriva CURADOR_ATIVO na curadoria", () => {
    expect(derivarFaseWorkflow(buildJornadaViewCuradoria())).toBe("CURADOR_ATIVO");
  });

  it("deriva PACIENTE_RETORNO na entrega", () => {
    expect(derivarFaseWorkflow(buildJornadaViewEntrega())).toBe("PACIENTE_RETORNO");
  });

  it("bloqueio com responsável paciente mantém ação do paciente", () => {
    const view = {
      ...buildJornadaViewBloqueio(),
      responsavel: { tipo: "PACIENTE" as const, nome_exibicao: null, canal: "NENHUM" as const },
    };
    const estado = resolverEstadoWorkflowCaso({
      view,
      curadorAtribuido: false,
    });
    expect(estado.bloqueado).toBe(true);
    expect(estado.ator_com_acao).toBe("PACIENTE");
  });
});

describe("Filas operacionais", () => {
  it("classifica etapas nas cinco filas", () => {
    const descoberta = classificarCasoNaFila(casoBase(buildJornadaViewDescoberta()));
    const historico = classificarCasoNaFila(casoBase(buildJornadaViewHistorico()));
    const ace = classificarCasoNaFila(casoBase(buildJornadaViewAce()));
    const curadoria = classificarCasoNaFila(casoBase(buildJornadaViewCuradoria()));
    const entrega = classificarCasoNaFila(casoBase(buildJornadaViewEntrega()));

    expect(descoberta.fila).toBe("PRIMEIRO_CONTATO");
    expect(historico.fila).toBe("DOCUMENTACAO");
    expect(ace.fila).toBe("DOCUMENTACAO");
    expect(curadoria.fila).toBe("CURADORIA");
    expect(entrega.fila).toBe("ENTREGA");
  });

  it("agrupa casos por fila derivada da jornada", () => {
    const filas = derivarFilasOperacionais([
      casoBase(buildJornadaViewHistorico()),
      casoBase(buildJornadaViewCuradoria()),
      casoBase(buildJornadaViewEntrega()),
    ]);

    expect(FILAS_OPERACIONAIS.every((f) => Array.isArray(filas.filas[f]))).toBe(true);
    expect(filas.filas.CURADORIA).toHaveLength(1);
    expect(filas.total_casos).toBe(3);
  });
});

describe("SLA operacional", () => {
  it("calcula status sem decisão automática", () => {
    expect(calcularStatusSla(10, 24, 48)).toBe("NO_PRAZO");
    expect(calcularStatusSla(30, 24, 48)).toBe("PROXIMO_VENCIMENTO");
    expect(calcularStatusSla(50, 24, 48)).toBe("VENCIDO");
  });

  it("deriva SLA com responsável e limites", () => {
    const view = buildJornadaViewCuradoria();
    const ref = new Date("2026-01-20T10:00:00Z");
    const sla = derivarSlaEtapa({
      jornadaId: "jornada-1",
      view,
      referenciaAgora: ref,
    });

    expect(sla.fila).toBe("CURADORIA");
    expect(sla.responsavel).toBe("CURADOR");
    expect(sla.tempo_esperado_horas).toBe(72);
    expect(sla.tempo_limite_horas).toBe(120);
    expect(["NO_PRAZO", "PROXIMO_VENCIMENTO", "VENCIDO"]).toContain(sla.status);
  });
});

describe("Notificações (contratos)", () => {
  it("deriva PACIENTE_AGUARDANDO em bloqueio", () => {
    const view = {
      ...buildJornadaViewBloqueio(),
      responsavel: { tipo: "PACIENTE" as const, nome_exibicao: null, canal: "NENHUM" as const },
    };
    const notifs = derivarNotificacoesCaso({
      jornada_id: "j-1",
      paciente_nome: "Maria",
      view,
      curador_atribuido: false,
      entrega_publicada: false,
    });
    expect(notifs.some((n) => n.tipo === "PACIENTE_AGUARDANDO")).toBe(true);
  });

  it("deriva CURADOR_PRECISA_AGIR sem atribuição", () => {
    const notifs = derivarNotificacoesCaso({
      jornada_id: "j-1",
      paciente_nome: "Maria",
      view: buildJornadaViewCuradoria(),
      curador_atribuido: false,
      entrega_publicada: false,
    });
    expect(notifs.some((n) => n.tipo === "CURADOR_PRECISA_AGIR")).toBe(true);
  });
});

describe("Atribuição append-only", () => {
  it("registra assumir, transferir e encerrar em ordem", async () => {
    const store = new InMemoryAtribuicaoStore();

    await store.registrarEvento(
      aplicarComandoAtribuicao({
        tipo: "ASSUMIR",
        jornada_id: "j-1",
        curador_id: "cur-1",
        registrado_por: "cur-1",
      }),
    );

    await store.registrarEvento(
      aplicarComandoAtribuicao({
        tipo: "TRANSFERIR",
        jornada_id: "j-1",
        de_curador_id: "cur-1",
        para_curador_id: "cur-2",
        motivo: "Carga de trabalho",
        registrado_por: "gestor-1",
      }),
    );

    const atual = await store.obterAtribuicaoAtual("j-1");
    expect(atual.curador_id).toBe("cur-2");
    expect(atual.historico).toHaveLength(2);

    await store.registrarEvento(
      aplicarComandoAtribuicao({
        tipo: "ENCERRAR",
        jornada_id: "j-1",
        curador_id: "cur-2",
        motivo: "Caso concluído",
        registrado_por: "cur-2",
      }),
    );

    const encerrado = await store.obterAtribuicaoAtual("j-1");
    expect(encerrado.encerrado).toBe(true);
    expect(encerrado.curador_id).toBeNull();
    expect(encerrado.historico).toHaveLength(3);
  });
});

describe("Painel operacional", () => {
  it("responde quem precisa agir, quem espera, bloqueios e SLA", () => {
    const painel = derivarPainelOperacional([
      casoBase(buildJornadaViewBloqueio()),
      casoBase(buildJornadaViewCuradoria()),
    ]);

    expect(painel.casos_bloqueados.length).toBeGreaterThan(0);
    expect(painel.quem_precisa_agir.length).toBeGreaterThan(0);
    expect(painel.gerado_em).toBeTruthy();
  });
});

describe("Fluxo completo operacional", () => {
  it("valida marcos do ciclo paciente → curador → paciente", () => {
    const inicio = buildJornadaViewHistorico();
    expect(validarMarcoFluxo(inicio, "PACIENTE_INICIA")).toBe(true);

    const comDocs = {
      ...buildJornadaViewAce(),
      extensoes: {
        ...buildJornadaViewAce().extensoes,
        documentos: [
          {
            id: "doc-1",
            nome_arquivo: "exame.pdf",
            status: "RECEBIDO" as const,
            recebido_em: "2026-01-13T10:00:00Z",
          },
        ],
      },
    };
    expect(validarMarcoFluxo(comDocs, "DOCUMENTOS_CHEGAM")).toBe(true);

    const curadoria = buildJornadaViewCuradoria();
    expect(validarMarcoFluxo(curadoria, "CURADOR_ASSUME")).toBe(true);

    const entrega = buildJornadaViewEntrega();
    expect(validarMarcoFluxo(entrega, "ENTREGA_PUBLICADA")).toBe(true);

    const escolha = {
      ...entrega,
      etapa_atual: "ESCOLHA" as const,
      extensoes: {
        ...entrega.extensoes,
        escolha_registrada: {
          opcao_indice: 0,
          registrada_em: "2026-01-17T10:00:00Z",
          observacao: null,
        },
      },
    };
    expect(validarMarcoFluxo(escolha, "PACIENTE_ESCOLHE")).toBe(true);

    const relacionamento = {
      ...escolha,
      etapa_atual: "ACOMPANHAMENTO" as const,
      estado_visivel: "EM_ACOMPANHAMENTO" as const,
    };
    expect(validarMarcoFluxo(relacionamento, "RELACIONAMENTO")).toBe(true);
    expect(TRANSICOES_FLUXO_COMPLETO).toHaveLength(6);
  });

  it("projeta snapshot unificado sem estado paralelo", () => {
    const snapshot = projetarSnapshotWorkflow({
      ...casoBase(buildJornadaViewCuradoria()),
      curador_id: "cur-1",
    });

    expect(snapshot.workflow.fase_atual).toBe("CURADOR_ATIVO");
    expect(snapshot.fila.fila).toBe("CURADORIA");
    expect(snapshot.sla.fila).toBe("CURADORIA");
    expect(snapshot.workflow.jornada_id).toBe(snapshot.sla.jornada_id);
  });
});
