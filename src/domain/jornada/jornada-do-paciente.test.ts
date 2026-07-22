import { describe, expect, it } from "vitest";
import {
  EtapaDaJornada,
  JornadaDoPaciente,
  SEQUENCIA_OFICIAL_ETAPAS,
  type EventoPublicadoPeloAce,
  type EventoPublicadoPelaCuradoria,
  type EventoPublicadoPeloPaciente,
  type EventoPublicadoPeloRelacionamento,
} from "./index";

const BASE_TIME = "2026-07-22T10:00:00.000Z";

function avancarTodasEtapas(jornada: JornadaDoPaciente, inicio = 0): JornadaDoPaciente {
  let atual = jornada;
  for (let i = inicio; i < SEQUENCIA_OFICIAL_ETAPAS.length; i += 1) {
    const resultado = atual.concluirEtapaAtual({
      marcoId: `marco-${i}`,
      ocorridoEm: new Date(Date.parse(BASE_TIME) + i * 60_000).toISOString(),
    });
    if (!resultado.ok) {
      throw new Error(resultado.error.message);
    }
    atual = resultado.value;
  }
  return atual;
}

describe("JornadaDoPaciente", () => {
  it("inicia na primeira etapa oficial com evento JornadaIniciada", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    expect(jornada.etapaAtual.equals(EtapaDaJornada.primeiraDuvida())).toBe(true);
    expect(jornada.proximaEtapa?.equals(EtapaDaJornada.primeiroContato())).toBe(true);
    expect(jornada.etapasConcluidas).toHaveLength(0);
    expect(jornada.historico).toHaveLength(1);
    expect(jornada.eventos[0]?.type).toBe("JornadaIniciada");
  });

  it("percorre o fluxo completo das 13 etapas e conclui a jornada", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const concluida = avancarTodasEtapas(jornada);

    expect(concluida.estaConcluida()).toBe(true);
    expect(concluida.etapasConcluidas).toHaveLength(13);
    expect(concluida.eventos.at(-1)?.type).toBe("JornadaConcluida");
    expect(concluida.concluidaEm).not.toBeNull();
  });

  it("emite EtapaConcluida a cada avanço", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const resultado = jornada.concluirEtapaAtual({
      marcoId: "marco-1",
      ocorridoEm: "2026-07-22T10:01:00.000Z",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.etapaAtual.equals(EtapaDaJornada.primeiroContato())).toBe(true);
      expect(resultado.value.eventos.some((evento) => evento.type === "EtapaConcluida")).toBe(true);
    }
  });

  it("impede conclusão quando há bloqueio ativo", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const bloqueada = jornada.bloquearEtapaAtual({
      bloqueioId: "bloqueio-1",
      marcoId: "marco-bloqueio",
      motivo: "Aguardando documento",
      ocorridoEm: "2026-07-22T10:01:00.000Z",
    });

    expect(bloqueada.ok).toBe(true);
    if (!bloqueada.ok) return;

    const tentativa = bloqueada.value.concluirEtapaAtual({
      marcoId: "marco-tentativa",
      ocorridoEm: "2026-07-22T10:02:00.000Z",
    });

    expect(tentativa.ok).toBe(false);
    if (!tentativa.ok) {
      expect(tentativa.error.code).toBe("JORNADA_BLOQUEADA");
    }
  });

  it("retoma etapa após bloqueio e permite avanço", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const bloqueada = jornada.bloquearEtapaAtual({
      bloqueioId: "bloqueio-1",
      marcoId: "marco-bloqueio",
      motivo: "Aguardando documento",
      ocorridoEm: "2026-07-22T10:01:00.000Z",
    });

    if (!bloqueada.ok) throw new Error("bloqueio falhou");

    const retomada = bloqueada.value.retomarEtapaAtual({
      marcoId: "marco-retomada",
      ocorridoEm: "2026-07-22T10:02:00.000Z",
    });

    expect(retomada.ok).toBe(true);
    if (!retomada.ok) return;

    expect(retomada.value.bloqueioAtivo).toBeNull();
    expect(retomada.value.eventos.some((evento) => evento.type === "EtapaRetomada")).toBe(true);

    const avancada = retomada.value.concluirEtapaAtual({
      marcoId: "marco-avanco",
      ocorridoEm: "2026-07-22T10:03:00.000Z",
    });

    expect(avancada.ok).toBe(true);
  });

  it("reidrata snapshot válido e revalida invariantes", () => {
    const original = avancarTodasEtapas(
      JornadaDoPaciente.iniciar({
        id: "jornada-1",
        pacienteId: "paciente-1",
        iniciadaEm: BASE_TIME,
        marcoId: "marco-inicio",
      }),
      0,
    );

    const snapshot = original.toSnapshot();
    const reidratada = JornadaDoPaciente.reidratar(snapshot);

    expect(reidratada.ok).toBe(true);
    if (reidratada.ok) {
      expect(reidratada.value.estaConcluida()).toBe(true);
      expect(reidratada.value.etapasConcluidas).toHaveLength(13);
      expect(reidratada.value.historico.length).toBe(original.historico.length);
    }
  });

  it("rejeita reidratação com etapas fora de sequência", () => {
    const invalida = JornadaDoPaciente.reidratar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      etapaAtual: "DESCOBERTA",
      etapasConcluidas: ["PRIMEIRA_DUVIDA"],
      bloqueios: [],
      historico: [
        {
          id: "marco-1",
          tipo: "JORNADA_INICIADA",
          etapa: "PRIMEIRA_DUVIDA",
          descricao: "Início",
          ocorridoEm: BASE_TIME,
        },
      ],
      responsavelAtual: "EQUIPE_ALIVIAR",
      iniciadaEm: BASE_TIME,
      atualizadaEm: BASE_TIME,
      concluidaEm: null,
    });

    expect(invalida.ok).toBe(false);
    if (!invalida.ok) {
      expect(invalida.error.code).toBe("REIDRATACAO_INVALIDA");
    }
  });

  it("mantém histórico append-only com marcos crescentes", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const tamanhoInicial = jornada.historico.length;

    const comEvento = jornada.receberEventoExterno({
      marcoId: "marco-externo",
      evento: {
        origem: "PACIENTE",
        pacienteId: "paciente-1",
        tipo: "CONTATO_INICIADO",
        ocorridoEm: "2026-07-22T10:01:00.000Z",
        descricao: "Paciente iniciou contato",
      } satisfies EventoPublicadoPeloPaciente,
    });

    expect(comEvento.ok).toBe(true);
    if (comEvento.ok) {
      expect(comEvento.value.historico.length).toBe(tamanhoInicial + 1);
      expect(comEvento.value.historico.at(-1)?.tipo).toBe("EVENTO_EXTERNO_REGISTRADO");
    }
  });

  it("registra eventos externos sem transferir controle de estado", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const etapaAntes = jornada.etapaAtual.codigo;

    const eventos: Array<EventoPublicadoPeloAce | EventoPublicadoPelaCuradoria | EventoPublicadoPeloRelacionamento> = [
      {
        origem: "ACE",
        pacienteId: "paciente-1",
        tipo: "ACE_ATIVADO",
        ocorridoEm: "2026-07-22T10:01:00.000Z",
        descricao: "ACE ativado",
      },
      {
        origem: "CURADORIA",
        pacienteId: "paciente-1",
        tipo: "SESSAO_ABERTA",
        ocorridoEm: "2026-07-22T10:02:00.000Z",
        descricao: "Sessão de curadoria aberta",
      },
      {
        origem: "RELACIONAMENTO",
        pacienteId: "paciente-1",
        tipo: "VINCULO_ESTABELECIDO",
        ocorridoEm: "2026-07-22T10:03:00.000Z",
        descricao: "Vínculo estabelecido",
      },
    ];

    let atual = jornada;
    for (const [index, evento] of eventos.entries()) {
      const resultado = atual.receberEventoExterno({
        marcoId: `marco-ext-${index}`,
        evento,
      });
      if (!resultado.ok) throw new Error(resultado.error.message);
      atual = resultado.value;
    }

    expect(atual.etapaAtual.codigo).toBe(etapaAntes);
    expect(atual.historico.filter((marco) => marco.tipo === "EVENTO_EXTERNO_REGISTRADO")).toHaveLength(3);
  });

  it("impede mutações após jornada concluída", () => {
    const concluida = avancarTodasEtapas(
      JornadaDoPaciente.iniciar({
        id: "jornada-1",
        pacienteId: "paciente-1",
        iniciadaEm: BASE_TIME,
        marcoId: "marco-inicio",
      }),
    );

    const tentativa = concluida.concluirEtapaAtual({
      marcoId: "marco-invalido",
      ocorridoEm: "2026-07-22T12:00:00.000Z",
    });

    expect(tentativa.ok).toBe(false);
    if (!tentativa.ok) {
      expect(tentativa.error.code).toBe("JORNADA_JA_CONCLUIDA");
    }
  });

  it("rejeita evento externo de paciente diferente", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const resultado = jornada.receberEventoExterno({
      marcoId: "marco-ext",
      evento: {
        origem: "PACIENTE",
        pacienteId: "outro-paciente",
        tipo: "CONTATO_INICIADO",
        ocorridoEm: "2026-07-22T10:01:00.000Z",
        descricao: "Contato",
      },
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("ETAPA_INVALIDA");
    }
  });

  it("não permite segundo bloqueio ativo simultâneo", () => {
    const jornada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    });

    const primeiro = jornada.bloquearEtapaAtual({
      bloqueioId: "bloqueio-1",
      marcoId: "marco-bloqueio-1",
      motivo: "Primeiro bloqueio",
      ocorridoEm: "2026-07-22T10:01:00.000Z",
    });

    if (!primeiro.ok) throw new Error("primeiro bloqueio falhou");

    const segundo = primeiro.value.bloquearEtapaAtual({
      bloqueioId: "bloqueio-2",
      marcoId: "marco-bloqueio-2",
      motivo: "Segundo bloqueio",
      ocorridoEm: "2026-07-22T10:02:00.000Z",
    });

    expect(segundo.ok).toBe(false);
  });
});

describe("Value Objects da Jornada", () => {
  it("EstadoDaEtapa bloqueada não permite avanço", () => {
    const estado = EtapaDaJornada.primeiraDuvida();
    expect(estado).toBeDefined();
    const bloqueada = JornadaDoPaciente.iniciar({
      id: "jornada-1",
      pacienteId: "paciente-1",
      iniciadaEm: BASE_TIME,
      marcoId: "marco-inicio",
    }).bloquearEtapaAtual({
      bloqueioId: "bloqueio-1",
      marcoId: "marco-bloqueio",
      motivo: "Teste",
      ocorridoEm: "2026-07-22T10:01:00.000Z",
    });

    if (!bloqueada.ok) throw new Error("bloqueio falhou");
    expect(bloqueada.value.estadoDaEtapaAtual().codigo).toBe("BLOQUEADA");
    expect(bloqueada.value.estadoDaEtapaAtual().permiteAvanco()).toBe(false);
  });
});
