import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  avancarProjecaoAposAnaliseInicial,
  avancarProjecaoAposEntrega,
  avancarProjecaoAposSessaoCuradoria,
  criarProjecaoInicial,
  readModelToView,
} from "@/infrastructure/jornada/jornada-view-projection";

export function buildJornadaViewHistorico(): JornadaDoPacienteView {
  return readModelToView(
    criarProjecaoInicial({
      jornadaId: "jornada-test",
      pacienteId: "paciente-test",
      iniciadaEm: "2026-01-10T10:00:00Z",
    }),
  );
}

export function buildJornadaViewAce(): JornadaDoPacienteView {
  const inicial = criarProjecaoInicial({
    jornadaId: "jornada-test",
    pacienteId: "paciente-test",
    iniciadaEm: "2026-01-10T10:00:00Z",
  });
  return readModelToView(avancarProjecaoAposAnaliseInicial(inicial, "2026-01-12T10:00:00Z"));
}

export function buildJornadaViewCuradoria(): JornadaDoPacienteView {
  const ace = avancarProjecaoAposAnaliseInicial(
    criarProjecaoInicial({
      jornadaId: "jornada-test",
      pacienteId: "paciente-test",
      iniciadaEm: "2026-01-10T10:00:00Z",
    }),
    "2026-01-12T10:00:00Z",
  );
  return readModelToView(avancarProjecaoAposSessaoCuradoria(ace, "2026-01-14T10:00:00Z"));
}

export function buildJornadaViewEntrega(): JornadaDoPacienteView {
  const curadoria = avancarProjecaoAposSessaoCuradoria(
    avancarProjecaoAposAnaliseInicial(
      criarProjecaoInicial({
        jornadaId: "jornada-test",
        pacienteId: "paciente-test",
        iniciadaEm: "2026-01-10T10:00:00Z",
      }),
      "2026-01-12T10:00:00Z",
    ),
    "2026-01-14T10:00:00Z",
  );
  return readModelToView(avancarProjecaoAposEntrega(curadoria, "2026-01-16T10:00:00Z"));
}

export function buildJornadaViewBloqueio(): JornadaDoPacienteView {
  const view = buildJornadaViewHistorico();
  return {
    ...view,
    estado_visivel: "AGUARDANDO_DOCUMENTOS",
    bloqueio: {
      motivo_humano: "Precisamos de um documento para continuar a análise.",
      desde: "2026-01-15T09:00:00Z",
      etapa: "HISTORIA",
    },
  };
}

export function buildJornadaViewMetodo(): JornadaDoPacienteView {
  return {
    ...buildJornadaViewHistorico(),
    etapa_atual: "ENTENDIMENTO_METODO",
    etapas_concluidas: ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO", "DESCOBERTA"],
    estado_visivel: "ENTENDENDO_METODO",
  };
}

export function buildJornadaViewDescoberta(): JornadaDoPacienteView {
  return {
    ...buildJornadaViewHistorico(),
    etapa_atual: "DESCOBERTA",
    etapas_concluidas: ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO"],
    estado_visivel: "EXPLORANDO",
  };
}
