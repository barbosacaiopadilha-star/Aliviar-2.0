// O Método, em código puro. Sem banco, sem rede, sem IA, sem framework.
//
// M5 (ADR-042): este arquivo era a tradução do modelo de orçamento — validação
// da distribuição de 100 pontos, filtros obrigatórios do motor antigo, cálculo
// de `internalScore`, faixas de banda e ordenação por score. Todo esse pipeline
// foi aposentado pela ADR-042 e ficou sem chamador ao longo das ondas M1 a M4;
// aqui ele sai do código executável. Os dados que ele produziu permanecem no
// banco, legíveis, e nenhuma migration foi tocada.
//
// O que sobrevive é a única regra deste arquivo que o Método vigente exerce: a
// Curadoria apresenta exatamente três opções distintas, e quem as escolhe é o
// Curador (Fundamentos §13, P14).

export const REQUIRED_OPTION_COUNT = 3;

export function validateSelection(professionalProfileIds: string[]): { valid: boolean; error: string | null } {
  if (professionalProfileIds.length !== REQUIRED_OPTION_COUNT) {
    return {
      valid: false,
      error: `A Curadoria apresenta sempre exatamente três opções — hoje há ${professionalProfileIds.length}.`,
    };
  }
  if (new Set(professionalProfileIds).size !== professionalProfileIds.length) {
    return { valid: false, error: "O mesmo profissional foi selecionado mais de uma vez." };
  }
  return { valid: true, error: null };
}
