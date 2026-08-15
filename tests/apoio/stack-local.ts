/**
 * OPS-G5 · CORTE 7 (remediação) — de qual banco a suíte fala.
 *
 * Vinte e quatro pontos da árvore escreviam o nome do contêiner à mão. Enquanto
 * só existiu uma stack local isso passou despercebido; no instante em que a
 * suíte foi apontada para uma stack isolada, os testes que **leem** catálogo
 * continuaram passando (os dois bancos têm as mesmas migrations) e os que
 * **escrevem** fixture por `psql` gravaram no banco errado — e falharam com
 * mensagens que não diziam nada sobre a causa.
 *
 * O nome passa a vir de um lugar só. O padrão é a stack de sempre, então nada
 * muda para quem não define a variável.
 */
export const CONTAINER_PADRAO = "supabase_db_aliviar-conexao";

export function containerDoBanco(): string {
  const escolhido = process.env.SUPABASE_DB_CONTAINER?.trim();
  return escolhido && escolhido.length > 0 ? escolhido : CONTAINER_PADRAO;
}

/**
 * Os argumentos de `docker exec … psql -c <sql>`, já com o contêiner certo.
 * Existe para que nenhum chamador precise montar o array — e para que a
 * substituição mecânica dos 24 pontos fosse uma decisão só, aplicada 24 vezes.
 */
export function argumentosPsql(sql: string): string[] {
  return ["exec", containerDoBanco(), "psql", "-U", "postgres", "-t", "-A", "-c", sql];
}

/**
 * O backend que o E2E espera encontrar no /api/info da aplicação. O porteiro
 * comparava um literal — apontar o E2E para uma stack isolada era impossível
 * sem editar teste. Mesmo contrato do contêiner: variável explícita, padrão
 * retrocompatível.
 */
export function backendEsperado(): string {
  const escolhido = process.env.E2E_SUPABASE_HOST?.trim();
  return escolhido && escolhido.length > 0 ? escolhido : "127.0.0.1:54321";
}
