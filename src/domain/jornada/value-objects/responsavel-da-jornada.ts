export const RESPONSAVEIS_DA_JORNADA = [
  "PACIENTE",
  "ACE",
  "GESTOR",
  "CURADOR",
  "EQUIPE_ALIVIAR",
  "NENHUM",
] as const;

export type ResponsavelDaJornadaCodigo = (typeof RESPONSAVEIS_DA_JORNADA)[number];

export class ResponsavelDaJornada {
  private constructor(readonly codigo: ResponsavelDaJornadaCodigo) {}

  static fromCodigo(codigo: ResponsavelDaJornadaCodigo): ResponsavelDaJornada {
    return new ResponsavelDaJornada(codigo);
  }

  static paciente(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("PACIENTE");
  }

  static ace(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("ACE");
  }

  static gestor(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("GESTOR");
  }

  static curador(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("CURADOR");
  }

  static equipeAliviar(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("EQUIPE_ALIVIAR");
  }

  static nenhum(): ResponsavelDaJornada {
    return ResponsavelDaJornada.fromCodigo("NENHUM");
  }

  equals(outro: ResponsavelDaJornada): boolean {
    return this.codigo === outro.codigo;
  }
}
