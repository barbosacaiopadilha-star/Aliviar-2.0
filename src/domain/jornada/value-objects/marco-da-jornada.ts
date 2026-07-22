import type { EtapaDaJornada } from "./etapa-da-jornada";

export type MarcoDaJornadaTipo =
  | "JORNADA_INICIADA"
  | "ETAPA_CONCLUIDA"
  | "ETAPA_BLOQUEADA"
  | "ETAPA_RETOMADA"
  | "EVENTO_EXTERNO_REGISTRADO"
  | "JORNADA_CONCLUIDA";

export interface MarcoDaJornadaProps {
  id: string;
  tipo: MarcoDaJornadaTipo;
  etapa: EtapaDaJornada | null;
  descricao: string;
  ocorridoEm: string;
  metadados?: Record<string, string>;
}

export class MarcoDaJornada {
  readonly id: string;
  readonly tipo: MarcoDaJornadaTipo;
  readonly etapa: EtapaDaJornada | null;
  readonly descricao: string;
  readonly ocorridoEm: string;
  readonly metadados: Record<string, string>;

  private constructor(props: MarcoDaJornadaProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.etapa = props.etapa;
    this.descricao = props.descricao;
    this.ocorridoEm = props.ocorridoEm;
    this.metadados = props.metadados ?? {};
  }

  static registrar(props: MarcoDaJornadaProps): MarcoDaJornada {
    const descricao = props.descricao.trim();
    if (!descricao) {
      throw new Error("Marco da jornada exige descrição.");
    }

    return new MarcoDaJornada({
      ...props,
      descricao,
      metadados: props.metadados ?? {},
    });
  }

  static reidratar(props: MarcoDaJornadaProps): MarcoDaJornada {
    return MarcoDaJornada.registrar(props);
  }
}
