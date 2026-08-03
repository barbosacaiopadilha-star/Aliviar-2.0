/**
 * Itens do Relatório ↔ textarea — a transformação com inversa definida (FRENTE D3).
 *
 * O dado canônico das coleções do Relatório (`attention_points`,
 * `suggested_questions`, `favorable_points`) é SEMPRE `string[]`: do banco à
 * página, da página ao editor, do editor à action. Nada vira texto delimitado
 * em trânsito — a textarea é só superfície de edição.
 *
 * CONTRATO DE EDIÇÃO (o mesmo da Devolutiva, o padrão da casa):
 * - exibição: um item por linha (`itensParaTextarea`);
 * - leitura: UMA LINHA NÃO VAZIA = UM ITEM (`textareaParaItens`); espaços e
 *   pontuação DENTRO de uma linha nunca separam itens;
 * - item legado com quebra de linha interna: enquanto o campo NÃO é editado,
 *   o array carregado é reenviado intacto (a exibição nunca contamina o dado
 *   — responsabilidade do chamador, ver ReportEditor); se o Curador editar o
 *   campo, vale o que ele vê: cada linha visível vira um item. Essa
 *   re-tokenização é a regra definida — nunca fusão por espaço.
 */

/** Um item por linha — a exibição sugerida para edição em textarea. */
export function itensParaTextarea(itens: string[]): string {
  return itens.join("\n");
}

/**
 * A inversa definida: cada linha não vazia é um item. Aparas de espaço nas
 * bordas da linha saem (o schema do Relatório já normaliza com `.trim()`);
 * espaços internos e pontuação permanecem intactos.
 */
export function textareaParaItens(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}
