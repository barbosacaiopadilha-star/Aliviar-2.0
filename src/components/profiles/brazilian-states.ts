// Lista fechada de UF — evita erro de digitação em um campo que a
// migration já valida com regex (2 letras), sem inventar uma tabela nova
// para algo que nunca muda.
export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
