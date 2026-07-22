export type EntregaFormato = "RESUMO" | "RECOMENDACAO" | "DOCUMENTO";

export interface EntregaAoPaciente {
  entregaId: string;
  jornadaId: string;
  formato: EntregaFormato;
  conteudo: string;
  produzidaEm: string;
  produzidaPor: string;
}
