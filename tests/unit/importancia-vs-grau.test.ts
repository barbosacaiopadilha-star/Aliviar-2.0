import { describe, expect, it } from "vitest";

import { IMPORTANCE_LEVELS } from "@/modules/curadoria/mapa-prioridades";
import { NEED_DEGREES, NEED_DEGREE_LABELS, PERSON_PROTOCOL } from "@/modules/curadoria/protocolos";
import { crossOne } from "@/modules/curadoria/motor-compatibilidade";

/**
 * ACHADO 2 — `case_priority_map.importance` × `case_needs.degree`.
 *
 * A auditoria levantou o risco de duas representações da mesma coisa — o
 * defeito que a ADR-042 eliminou. Este teste PROVA, no código, que são
 * conceitos distintos, e pina as três diferenças que os separam. Se alguém
 * as apagar (igualar escalas, ligar `degree` ao Motor, deixar o grau ser
 * inferido), o teste falha e a ambiguidade não passa em silêncio.
 *
 *   IMPORTÂNCIA — quanto o CASE declara que um subcritério pesa. Cinco
 *   níveis. Autoria do Curador. É a ÚNICA entrada do Motor pelo lado do Case
 *   (ADR-039, ADR-041).
 *
 *   GRAU — quanto a PESSOA disse que aquilo pesa PARA ELA, na resposta do
 *   Protocolo. Quatro níveis, vocabulário dela. Não entra no Motor: é o
 *   registro da fala, e alimenta a conversa do Curador.
 *
 * A tradução de um no outro é ato humano do Curador, não função. Automatizá-la
 * seria decidir por ele qual peso a fala dela tem no Case — exatamente a
 * decisão que o Método reserva a uma pessoa.
 */

describe("Importância (Case) e Grau (Pessoa) são conceitos distintos", () => {
  it("escalas diferentes: cinco níveis contra quatro, sem valor em comum", () => {
    expect(IMPORTANCE_LEVELS).toHaveLength(5);
    expect(NEED_DEGREES).toHaveLength(4);

    const intersecao = (IMPORTANCE_LEVELS as readonly string[]).filter((nivel) =>
      (NEED_DEGREES as readonly string[]).includes(nivel),
    );
    expect(
      intersecao,
      "Um valor passou a existir nas duas escalas. Escalas que se tocam viram a mesma coisa por descuido.",
    ).toEqual([]);
  });

  it("vocabulários diferentes: o grau fala a língua dela, a importância a do Método", () => {
    // A importância é declarada em termos do Case ("MUITO_IMPORTANTE").
    expect(IMPORTANCE_LEVELS).toContain("NAO_INFLUENCIA");
    // O grau tem uma resposta que só faz sentido vindo de uma pessoa.
    expect(NEED_DEGREES).toContain("SEM_PREFERENCIA");
    expect(NEED_DEGREE_LABELS.ESSENCIAL).toMatch(/sem isso o cuidado não acontece/i);
  });

  it("só a importância entra no Motor — o grau não é aceito pela matriz", () => {
    // A matriz cruza importância × estado. Um grau no lugar da importância
    // não tem célula: o Motor não sabe o que fazer com a fala dela, e é
    // assim que tem de continuar.
    for (const grau of NEED_DEGREES) {
      expect(
        () => crossOne(grau as never, "CONFIRMADO"),
        `O Motor aceitou "${grau}" como importância. O grau da pessoa não é entrada do Motor.`,
      ).toThrow();
    }
    // E a importância legítima continua funcionando, sem mudança nenhuma.
    expect(crossOne("MUITO_IMPORTANTE", "CONFIRMADO")).toBe("ALTA_COMPATIBILIDADE");
  });

  it("o protocolo da pessoa nunca declara importância — só grau", () => {
    for (const pergunta of PERSON_PROTOCOL) {
      const opcoes = Object.keys(pergunta.options);
      for (const nivel of IMPORTANCE_LEVELS) {
        expect(
          opcoes,
          `${pergunta.id} oferece "${nivel}" como resposta da pessoa. Importância é declaração do Case, não dela.`,
        ).not.toContain(nivel);
      }
    }
  });
});
