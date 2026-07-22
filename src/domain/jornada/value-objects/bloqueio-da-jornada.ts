import type { EtapaDaJornada } from "./etapa-da-jornada";

export interface BloqueioDaJornadaProps {
  id: string;
  etapa: EtapaDaJornada;
  motivo: string;
  criadoEm: string;
  ativo: boolean;
}

export class BloqueioDaJornada {
  readonly id: string;
  readonly etapa: EtapaDaJornada;
  readonly motivo: string;
  readonly criadoEm: string;
  readonly ativo: boolean;

  private constructor(props: BloqueioDaJornadaProps) {
    this.id = props.id;
    this.etapa = props.etapa;
    this.motivo = props.motivo;
    this.criadoEm = props.criadoEm;
    this.ativo = props.ativo;
  }

  static criar(params: {
    id: string;
    etapa: EtapaDaJornada;
    motivo: string;
    criadoEm: string;
  }): BloqueioDaJornada {
    const motivo = params.motivo.trim();
    if (!motivo) {
      throw new Error("Bloqueio da jornada exige motivo.");
    }

    return new BloqueioDaJornada({
      id: params.id,
      etapa: params.etapa,
      motivo,
      criadoEm: params.criadoEm,
      ativo: true,
    });
  }

  static reidratar(props: BloqueioDaJornadaProps): BloqueioDaJornada {
    return new BloqueioDaJornada(props);
  }

  inativar(): BloqueioDaJornada {
    return BloqueioDaJornada.reidratar({
      id: this.id,
      etapa: this.etapa,
      motivo: this.motivo,
      criadoEm: this.criadoEm,
      ativo: false,
    });
  }

  impedeAvanco(): boolean {
    return this.ativo;
  }
}
