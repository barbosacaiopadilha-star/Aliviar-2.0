import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

export interface JornadaDoPacienteReadModel {
  jornadaId: string;
  pacienteId: string;
  etapaAtual: JornadaDoPacienteView["etapa_atual"];
  etapasConcluidas: JornadaDoPacienteView["etapas_concluidas"];
  estadoVisivel: JornadaDoPacienteView["estado_visivel"];
  proximoPasso: JornadaDoPacienteView["proximo_passo"];
  responsavel: JornadaDoPacienteView["responsavel"];
  bloqueio: JornadaDoPacienteView["bloqueio"];
  timeline: JornadaDoPacienteView["timeline"];
  iniciadaEm: string;
  atualizadaEm: string;
  concluidaEm: string | null;
}
