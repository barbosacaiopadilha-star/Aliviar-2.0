export interface ProduzirEntregaAoPacienteRequest {
  formato: "RESUMO" | "RECOMENDACAO" | "DOCUMENTO";
  conteudo: string;
}

export interface ProduzirEntregaAoPacienteResponse {
  entrega_id: string;
  jornada_id: string;
  formato: string;
  produzida_em: string;
  produzida_por: string;
}
