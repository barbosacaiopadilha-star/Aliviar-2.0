export const ETAPAS_DA_JORNADA = [
  "PRIMEIRA_DUVIDA",
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
  "ACE",
  "CURADORIA",
  "ENTREGA",
  "ESCOLHA",
  "ACOMPANHAMENTO",
  "RELACIONAMENTO",
] as const;

export type EtapaDaJornadaCodigo = (typeof ETAPAS_DA_JORNADA)[number];

const ORDEM_POR_CODIGO: Record<EtapaDaJornadaCodigo, number> = {
  PRIMEIRA_DUVIDA: 1,
  PRIMEIRO_CONTATO: 2,
  DESCOBERTA: 3,
  ENTENDIMENTO_METODO: 4,
  CONFIANCA: 5,
  CADASTRO: 6,
  HISTORIA: 7,
  ACE: 8,
  CURADORIA: 9,
  ENTREGA: 10,
  ESCOLHA: 11,
  ACOMPANHAMENTO: 12,
  RELACIONAMENTO: 13,
};

export class EtapaDaJornada {
  private constructor(
    readonly codigo: EtapaDaJornadaCodigo,
    readonly ordem: number,
  ) {}

  static fromCodigo(codigo: EtapaDaJornadaCodigo): EtapaDaJornada {
    return new EtapaDaJornada(codigo, ORDEM_POR_CODIGO[codigo]);
  }

  static primeiraDuvida(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("PRIMEIRA_DUVIDA");
  }

  static primeiroContato(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("PRIMEIRO_CONTATO");
  }

  static descoberta(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("DESCOBERTA");
  }

  static entendimentoMetodo(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("ENTENDIMENTO_METODO");
  }

  static confianca(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("CONFIANCA");
  }

  static cadastro(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("CADASTRO");
  }

  static historia(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("HISTORIA");
  }

  static ace(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("ACE");
  }

  static curadoria(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("CURADORIA");
  }

  static entrega(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("ENTREGA");
  }

  static escolha(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("ESCOLHA");
  }

  static acompanhamento(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("ACOMPANHAMENTO");
  }

  static relacionamento(): EtapaDaJornada {
    return EtapaDaJornada.fromCodigo("RELACIONAMENTO");
  }

  equals(outra: EtapaDaJornada): boolean {
    return this.codigo === outra.codigo;
  }

  toString(): string {
    return this.codigo;
  }
}
