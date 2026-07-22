export const ESTADOS_DA_ETAPA = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA",
] as const;

export type EstadoDaEtapaCodigo = (typeof ESTADOS_DA_ETAPA)[number];

export class EstadoDaEtapa {
  private constructor(readonly codigo: EstadoDaEtapaCodigo) {}

  static pendente(): EstadoDaEtapa {
    return new EstadoDaEtapa("PENDENTE");
  }

  static emAndamento(): EstadoDaEtapa {
    return new EstadoDaEtapa("EM_ANDAMENTO");
  }

  static concluida(): EstadoDaEtapa {
    return new EstadoDaEtapa("CONCLUIDA");
  }

  static bloqueada(): EstadoDaEtapa {
    return new EstadoDaEtapa("BLOQUEADA");
  }

  static fromCodigo(codigo: EstadoDaEtapaCodigo): EstadoDaEtapa {
    return new EstadoDaEtapa(codigo);
  }

  equals(outro: EstadoDaEtapa): boolean {
    return this.codigo === outro.codigo;
  }

  permiteAvanco(): boolean {
    return this.codigo === "EM_ANDAMENTO";
  }

  permiteConclusao(): boolean {
    return this.codigo === "EM_ANDAMENTO";
  }
}
