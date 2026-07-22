export type TipoEventoAtribuicao = "ASSUMIR" | "TRANSFERIR" | "ENCERRAR";

export interface EventoAtribuicaoAppend {
  id: string;
  jornada_id: string;
  tipo: TipoEventoAtribuicao;
  de_curador_id: string | null;
  para_curador_id: string | null;
  motivo: string | null;
  registrado_em: string;
  registrado_por: string;
}

export interface AtribuicaoAtualView {
  jornada_id: string;
  curador_id: string | null;
  assumido_em: string | null;
  encerrado: boolean;
  historico: EventoAtribuicaoAppend[];
}

export interface ComandoAtribuicaoAssumir {
  tipo: "ASSUMIR";
  jornada_id: string;
  curador_id: string;
  registrado_por: string;
}

export interface ComandoAtribuicaoTransferir {
  tipo: "TRANSFERIR";
  jornada_id: string;
  de_curador_id: string;
  para_curador_id: string;
  motivo: string;
  registrado_por: string;
}

export interface ComandoAtribuicaoEncerrar {
  tipo: "ENCERRAR";
  jornada_id: string;
  curador_id: string;
  motivo: string;
  registrado_por: string;
}

export type ComandoAtribuicaoOperacional =
  | ComandoAtribuicaoAssumir
  | ComandoAtribuicaoTransferir
  | ComandoAtribuicaoEncerrar;
