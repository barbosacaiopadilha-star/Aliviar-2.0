import { describe, expect, it } from "vitest";

import {
  emptyParecer,
  ressalvasDaMesa,
  validateMesaClosure,
  type ParecerDraft,
  type RessalvaInput,
} from "@/modules/curadoria/mesa";

/**
 * AS RESSALVAS DA MESA — o sistema observa sem impedir.
 *
 * Na simulação, três pareceres idênticos passaram sem um pio, e uma Curadoria
 * com tudo por confirmar foi entregue sem aviso. Cada regra isolada estava
 * certa; o silêncio sobre o conjunto era do sistema.
 *
 * O que estes testes protegem, além do aviso existir: que ele NUNCA vire
 * bloqueio. Ressalva que trava é ressalva que se aprende a contornar com texto
 * de fachada — e aí o sistema piorou o trabalho em vez de ajudá-lo.
 */

const NOMES: Record<string, string> = {
  a: "Dra. Beatriz Fontenelle",
  b: "Dr. Ismael Cardoso",
  c: "Dra. Solange Vieira",
};

function parecer(id: string, texto: string): ParecerDraft {
  return {
    professionalId: id,
    whyIncluded: texto,
    prioritiesServed: texto,
    limitations: texto,
    questions: "",
    observations: "",
  };
}

function entrada(over: Partial<RessalvaInput> = {}): RessalvaInput {
  return {
    selectedIds: ["a", "b", "c"],
    pareceres: [parecer("a", "um"), parecer("b", "dois"), parecer("c", "tres")],
    namesById: NOMES,
    temAlgumaConfirmacao: { a: true, b: true, c: true },
    ...over,
  };
}

describe("pareceres repetidos", () => {
  it("três textos diferentes: nenhuma ressalva", () => {
    expect(ressalvasDaMesa(entrada())).toEqual([]);
  });

  it("dois pareceres iguais: nomeia os dois profissionais", () => {
    const r = ressalvasDaMesa(
      entrada({ pareceres: [parecer("a", "igual"), parecer("b", "igual"), parecer("c", "outro")] }),
    );
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("PARECERES_REPETIDOS");
    expect(r[0].texto).toContain("Dra. Beatriz Fontenelle");
    expect(r[0].texto).toContain("Dr. Ismael Cardoso");
    expect(r[0].texto).not.toContain("Dra. Solange Vieira");
  });

  it("com TRÊS repetidos, enumera 'A, B e C' — nunca 'A e B e C'", () => {
    // Só apareceu ao ler a frase na tela com os três nomes: o teste anterior
    // tinha dois, e `join(" e ")` passava. Ninguém escreve "A e B e C".
    const r = ressalvasDaMesa(
      entrada({ pareceres: ["a", "b", "c"].map((id) => parecer(id, "mesmo")) }),
    );
    const texto = r.find((x) => x.kind === "PARECERES_REPETIDOS")!.texto;
    expect(texto).toContain("Dra. Beatriz Fontenelle, Dr. Ismael Cardoso e Dra. Solange Vieira");
    expect(texto).not.toContain(" e Dr. Ismael Cardoso e ");
  });

  it("espaço e caixa não disfarçam repetição", () => {
    const r = ressalvasDaMesa(
      entrada({
        pareceres: [parecer("a", "Atende  bem"), parecer("b", "atende bem"), parecer("c", "outro")],
      }),
    );
    expect(r.map((x) => x.kind)).toContain("PARECERES_REPETIDOS");
  });

  it("pareceres VAZIOS não geram ressalva — a falta já é dita pela validação", () => {
    // Dois avisos para o mesmo fato ensinariam o Curador a ignorar os dois.
    const r = ressalvasDaMesa({
      ...entrada(),
      pareceres: ["a", "b", "c"].map(emptyParecer),
    });
    expect(r.map((x) => x.kind)).not.toContain("PARECERES_REPETIDOS");
  });
});

describe("nada confirmado", () => {
  it("uma opção sem nenhuma confirmação: avisa, no singular, nomeando", () => {
    const r = ressalvasDaMesa(entrada({ temAlgumaConfirmacao: { a: true, b: false, c: true } }));
    expect(r).toHaveLength(1);
    expect(r[0].kind).toBe("NADA_CONFIRMADO");
    expect(r[0].texto).toContain("Dr. Ismael Cardoso");
    expect(r[0].texto).toContain("chega à Curadoria");
  });

  it("as três sem confirmação: um aviso só, no plural", () => {
    const r = ressalvasDaMesa(entrada({ temAlgumaConfirmacao: { a: false, b: false, c: false } }));
    const nada = r.filter((x) => x.kind === "NADA_CONFIRMADO");
    expect(nada).toHaveLength(1);
    expect(nada[0].texto).toContain("chegam");
    expect(nada[0].texto).toContain(
      "Dra. Beatriz Fontenelle, Dr. Ismael Cardoso e Dra. Solange Vieira",
    );
  });

  it("desconhecido não é o mesmo que ausente: sem informação, sem aviso", () => {
    // `temAlgumaConfirmacao` sem a chave significa "não sei", e do vazio nada
    // se afirma — inclusive uma ressalva.
    expect(ressalvasDaMesa(entrada({ temAlgumaConfirmacao: {} }))).toEqual([]);
  });
});

describe("ressalva NUNCA é impedimento", () => {
  it("com as duas ressalvas acesas, o encerramento continua válido", () => {
    const pareceres = ["a", "b", "c"].map((id) => parecer(id, "exatamente o mesmo texto"));
    const input = entrada({ pareceres, temAlgumaConfirmacao: { a: false, b: false, c: false } });

    expect(ressalvasDaMesa(input).length).toBeGreaterThanOrEqual(2);

    // A validação — que é quem decide o clique — não vê nada faltando.
    expect(
      validateMesaClosure({
        selectedIds: input.selectedIds,
        pareceres,
        compositionRationale: "As três respondem à prioridade dominante por caminhos diferentes.",
        curatorName: "Helena Vasconcelos",
        namesById: NOMES,
      }),
    ).toEqual([]);
  });
});
