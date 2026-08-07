/**
 * A LISTA NOMINAL DOS MÓDULOS AUTORIZADOS A INVOCAR A CAPABILITY DE
 * PROVENIÊNCIA (`curadoria.ler_proposta_para_proveniencia`).
 *
 * @metodo CONTRATO_1_8_R1 §21.6/§21.7 (lavratura `78e261c`)
 *
 * A LISTA MUDOU DE SUJEITO. Na emenda `e1186ec` ela isentava o repositório de
 * citar a TABELA; com a capability (§21), a tabela sumiu de `src/` por inteiro
 * e a C-01 voltou a proibi-la sem exceção. O que a lista nomeia agora é quem
 * pode INVOCAR a função — e continua sendo um módulo só.
 *
 * Declarada **uma vez** e usada por todas as guardas que dependem dela:
 *
 * - **C-01b** (`grupo-c-derivacao.test.ts`) — audita a inércia do arquivo:
 *   read-only, não decisório;
 * - **C-01c** (mesma suíte) — o vínculo da evidência é ponteiro, nunca busca;
 * - **C-01d** (mesma suíte) — a capability tem um chamador só, e nenhuma
 *   segunda função SQL expõe propostas.
 *
 * Duas cópias da lista divergiriam no dia em que alguém acrescentasse um nome a
 * uma e esquecesse a outra — e a guarda esquecida passaria a acusar o
 * autorizado, ou pior, a isentar quem ninguém autorizou. Autorizar é, no mesmo
 * ato, submeter à auditoria: um segundo nome futuro nasce auditado por
 * construção.
 *
 * A autorização é de um VERBO — invocar a capability para reconstruir e
 * auditar proveniência —, nunca de um arquivo. Os nove verbos de consumo do
 * §18.3 (escolher regra, emitir, calcular importância, recalcular Motor,
 * ordenar, filtrar, decidir…) continuam proibidos a todos, **inclusive ao
 * autorizado**.
 */
export const LEITORES_DE_PROPOSTA_AUTORIZADOS = [
  "src/modules/curadoria/cadeia-de-proveniencia-repository.ts",
] as const;

/** Normaliza separador de caminho para comparar em qualquer sistema. */
export function ehLeitorAutorizado(caminho: string): boolean {
  const normalizado = caminho.split("\\").join("/");
  return (LEITORES_DE_PROPOSTA_AUTORIZADOS as readonly string[]).includes(normalizado);
}
