import type {
  AtribuicaoAtualView,
  ComandoAtribuicaoOperacional,
  EventoAtribuicaoAppend,
} from "@/workflow-flow/contracts/atribuicao-operacional";

export interface AtribuicaoStorePort {
  listarHistorico(jornadaId: string): Promise<EventoAtribuicaoAppend[]>;
  registrarEvento(evento: Omit<EventoAtribuicaoAppend, "id" | "registrado_em">): Promise<EventoAtribuicaoAppend>;
  obterAtribuicaoAtual(jornadaId: string): Promise<AtribuicaoAtualView>;
}

export class InMemoryAtribuicaoStore implements AtribuicaoStorePort {
  private readonly eventos = new Map<string, EventoAtribuicaoAppend[]>();
  private seq = 0;

  async listarHistorico(jornadaId: string): Promise<EventoAtribuicaoAppend[]> {
    return [...(this.eventos.get(jornadaId) ?? [])];
  }

  async registrarEvento(
    evento: Omit<EventoAtribuicaoAppend, "id" | "registrado_em">,
  ): Promise<EventoAtribuicaoAppend> {
    const completo: EventoAtribuicaoAppend = {
      ...evento,
      id: `evt-${++this.seq}`,
      registrado_em: new Date().toISOString(),
    };
    const lista = this.eventos.get(evento.jornada_id) ?? [];
    lista.push(completo);
    this.eventos.set(evento.jornada_id, lista);
    return completo;
  }

  async obterAtribuicaoAtual(jornadaId: string): Promise<AtribuicaoAtualView> {
    const historico = await this.listarHistorico(jornadaId);
    const ultimoEncerrar = [...historico].reverse().find((e) => e.tipo === "ENCERRAR");
    const encerrado = ultimoEncerrar !== undefined;

    let curadorId: string | null = null;
    let assumidoEm: string | null = null;

    if (!encerrado) {
      for (let i = historico.length - 1; i >= 0; i--) {
        const evt = historico[i]!;
        if (evt.tipo === "ASSUMIR" || evt.tipo === "TRANSFERIR") {
          curadorId = evt.para_curador_id;
          assumidoEm = evt.registrado_em;
          break;
        }
      }
    }

    return {
      jornada_id: jornadaId,
      curador_id: curadorId,
      assumido_em: assumidoEm,
      encerrado,
      historico,
    };
  }
}

export function aplicarComandoAtribuicao(
  comando: ComandoAtribuicaoOperacional,
): Omit<EventoAtribuicaoAppend, "id" | "registrado_em"> {
  switch (comando.tipo) {
    case "ASSUMIR":
      return {
        jornada_id: comando.jornada_id,
        tipo: "ASSUMIR",
        de_curador_id: null,
        para_curador_id: comando.curador_id,
        motivo: null,
        registrado_por: comando.registrado_por,
      };
    case "TRANSFERIR":
      return {
        jornada_id: comando.jornada_id,
        tipo: "TRANSFERIR",
        de_curador_id: comando.de_curador_id,
        para_curador_id: comando.para_curador_id,
        motivo: comando.motivo,
        registrado_por: comando.registrado_por,
      };
    case "ENCERRAR":
      return {
        jornada_id: comando.jornada_id,
        tipo: "ENCERRAR",
        de_curador_id: comando.curador_id,
        para_curador_id: null,
        motivo: comando.motivo,
        registrado_por: comando.registrado_por,
      };
  }
}
