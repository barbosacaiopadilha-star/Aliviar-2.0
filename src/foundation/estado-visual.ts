/**
 * FUNDAÇÃO · O VOCABULÁRIO VISUAL DE ESTADO.
 *
 * @metodo docs/repaginacao/12_DESIGN_SYSTEM_ALVO.md §2 — uma gramática, quatro sotaques
 * @metodo docs/repaginacao/13_MODELO_DE_ESTADOS.md §4 — cor nunca sozinha
 *
 * Este módulo não nasceu aqui: ele foi **promovido**. As cinco funções da cor e
 * os símbolos que as acompanham foram decididos, implementados e certificados na
 * Mesa do Curador (nível ESSENCIAL · E-2, Rodadas 1 e 2). O que a Fundação faz é
 * tirá-los de dentro de uma superfície e colocá-los onde as quatro trilhas podem
 * consumir a MESMA definição — em vez de cada uma redescobrir a regra.
 *
 * A Mesa continua dona dos SEUS mapeamentos (que desfecho é qual papel); a
 * Fundação é dona do vocabulário.
 *
 * | papel         | função        | significa                                |
 * |---------------|---------------|------------------------------------------|
 * | `estrutura`   | institucional | identidade, navegação — nunca resultado  |
 * | `resolvido`   | de estado     | processo concluído — NUNCA desfecho bom  |
 * | `atencao`     | de atenção    | falta ato humano                         |
 * | `impedimento` | de estado     | erro, conflito, bloqueio                 |
 * | `neutro`      | de estado     | contexto, não iniciado, repouso          |
 *
 * Duas proibições que este arquivo existe para sustentar, e que valem para o
 * produto inteiro, não só para a Mesa:
 *
 * - **verde é processual.** Nunca significa evidência favorável, benefício
 *   clínico, melhor opção ou conclusão positiva.
 * - **vermelho é impedimento.** Nunca significa divergência, evidência
 *   contrária ou discordância legítima — divergir não é errar.
 *
 * E nenhuma distinção depende de cor sozinha: todo estado exibido carrega
 * **cor + símbolo + texto**.
 */

export type PapelVisual = "estrutura" | "resolvido" | "atencao" | "impedimento" | "neutro";

/** Os cinco papéis, em ordem de leitura. Fonte para varredura e para teste. */
export const PAPEIS_VISUAIS = [
  "estrutura",
  "resolvido",
  "atencao",
  "impedimento",
  "neutro",
] as const satisfies readonly PapelVisual[];

export type MarcaDeEstado = {
  papel: PapelVisual;
  /** Símbolo curto — a distinção que sobrevive ao daltonismo e ao cinza. */
  sinal: string;
};

/**
 * O símbolo canônico de cada papel (`13_MODELO_DE_ESTADOS.md` §4).
 *
 * Um mapeamento específico pode escolher outro símbolo quando ele diz mais —
 * a Mesa usa `↻` para "evidência nova pede releitura" e `=` para sucesso
 * idempotente. O que não pode é um papel aparecer **sem** símbolo.
 */
export const SINAL_DO_PAPEL: Readonly<Record<PapelVisual, string>> = {
  estrutura: "·",
  resolvido: "✓",
  atencao: "●",
  impedimento: "!",
  neutro: "·",
};

/** A classe CSS de um papel. Uma só fonte, para não espalhar regra. */
export function classeDoPapel(papel: PapelVisual): string {
  return `mesa-estado mesa-estado--${papel}`;
}
