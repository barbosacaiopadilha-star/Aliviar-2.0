import { PRACTICE_CATALOG } from "./evidencias-pratica";

/**
 * A PARTICIPAÇÃO NO MOTOR, EXECUTÁVEL — Item 1.1 (DP-1 ratificada).
 *
 * @metodo ADR-041 — a matriz do Motor: 15 células, quatro resultados
 * @metodo ADR-065 — condução de notícias difíceis exige cruzamento humano
 * @metodo Congelamento §4.3 — o Motor organiza, não escolhe (I-1)
 *
 * Por que existe: `MOTOR_PARTICIPATION` declarava, desde sempre, que quatro
 * conceitos NUNCA entram no Motor. A declaração era passiva — nenhuma linha de
 * código a consultava —, e o Motor cruzava os quatro como se fossem qualquer
 * outro (achado P15). O Método dizia uma coisa e o software fazia outra.
 *
 * Os quatro não estão fora por acaso. `VIABILIDADE_COBERTURA_E_CONVENIO` e
 * `VIABILIDADE_CUSTO_E_PAGAMENTO` são condições de possibilidade, não medida de
 * profissional: cruzá-los produziria "baixa compatibilidade" para quem apenas
 * não atende o convênio dela. `MODELO_PREFERENCIAS_E_RESTRICOES` é texto livre
 * dela, que nenhuma matriz de três estados representa. E
 * `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` exige juízo humano por decisão
 * expressa da ADR-065.
 *
 * **Fonte única.** O conjunto é DERIVADO de `PRACTICE_CATALOG.motor` — o mesmo
 * `MOTOR_PARTICIPATION` que a Matriz de Cobertura já declara. Nenhuma lista
 * nova nasce aqui: uma segunda lista divergiria da primeira em silêncio, e o
 * defeito que este item corrige é exatamente uma declaração que ninguém lia.
 *
 * Puro: sem React, sem banco.
 */

const FORA_DO_MOTOR: ReadonlySet<string> = new Set(
  PRACTICE_CATALOG.filter((conceito) => conceito.motor === "NUNCA").map(
    (conceito) => conceito.code,
  ),
);

/**
 * Recusa nomeada, não `false` silencioso.
 *
 * Um conceito `NUNCA` chegando à geração de célula não é dado ruim — é código
 * que contornou a guarda de entrada. Devolver um resultado qualquer esconderia
 * isso; parar diz onde o contrato foi rompido.
 */
export class ConceitoForaDoMotorError extends Error {
  constructor(readonly subcriterionCode: string) {
    super(
      `Conceito "${subcriterionCode}" tem MOTOR_PARTICIPATION = NUNCA e não pode gerar célula. ` +
        "Ele exige juízo humano; o Motor não o cruza (DP-1).",
    );
    this.name = "ConceitoForaDoMotorError";
  }
}

/** O conceito participa do cruzamento automático? */
export function participaDoMotor(subcriterionCode: string): boolean {
  return !FORA_DO_MOTOR.has(subcriterionCode);
}

/** Os que exigem juízo humano — lidos do Catálogo, nunca listados à mão. */
export function conceitosForaDoMotor(): readonly string[] {
  return [...FORA_DO_MOTOR].sort();
}

/**
 * GUARDA DE ENTRADA (A2, primeiro nível).
 *
 * Tira os `NUNCA` do universo do Motor ANTES de qualquer leitura. Não filtra
 * linha depois de montada: o conceito nunca chega a existir para o cruzamento,
 * nem como linha, nem na contagem do resumo, nem entre os "ainda não
 * declarados" — porque ele não está pendente de declaração nenhuma.
 *
 * Nada é apagado (A3): o dado segue no banco, íntegro e legível pelas
 * superfícies que o mostram. O que muda é quem pode usá-lo.
 */
export function apenasConceitosDoMotor(
  subcriterionCodes: readonly string[],
): readonly string[] {
  return subcriterionCodes.filter(participaDoMotor);
}
