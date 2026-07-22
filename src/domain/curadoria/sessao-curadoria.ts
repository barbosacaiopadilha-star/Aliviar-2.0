export type SessaoCuradoriaStatus = "ABERTA" | "ENCERRADA";

export interface SessaoCuradoria {
  sessaoId: string;
  jornadaId: string;
  curadorId: string;
  status: SessaoCuradoriaStatus;
  abertaEm: string;
}
