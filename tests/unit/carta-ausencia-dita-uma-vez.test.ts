import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_LABELS,
  PATIENT_DIMENSIONS,
  dimensoesAConfirmar,
  dimensoesConhecidas,
  fraseDoQueNaoSabemos,
  type PatientDimension,
} from "@/modules/paciente/experiencia";

/**
 * A AUSÊNCIA É DITA UMA VEZ.
 *
 * Cinco dimensões por carta, três cartas: quando nada foi confirmado, a pessoa
 * lia quinze vezes "Ainda não foi possível confirmar". A ausência era
 * verdadeira; repeti-la quinze vezes é que não era informação — a página
 * inteira virava um inventário de vazios no momento em que ela mais precisa
 * de chão.
 *
 * O que estes testes protegem: nada é escondido (as dimensões ausentes são
 * NOMEADAS), a frase não afirma mais do que sabemos, e ela termina numa saída.
 */

function dim(criterion: string, label: string, level: PatientDimension["level"]): PatientDimension {
  return { criterion, label, level };
}

const TODAS_A_CONFIRMAR: PatientDimension[] = PATIENT_DIMENSIONS.map((d) =>
  dim(d.criterion, d.label, "A_CONFIRMAR"),
);

describe("o recorte: o que se sabe vira linha, o que falta vira frase", () => {
  it("separa conhecidas de ausentes sem perder nenhuma", () => {
    const mistura = [
      dim("FORMACAO", "Formação", "PLENO"),
      dim("EXPERIENCIA", "Experiência", "A_CONFIRMAR"),
      dim("ACESSO", "Acesso", "NAO_ATENDE"),
    ];
    expect(dimensoesConhecidas(mistura).map((d) => d.criterion)).toEqual(["FORMACAO", "ACESSO"]);
    expect(dimensoesAConfirmar(mistura).map((d) => d.criterion)).toEqual(["EXPERIENCIA"]);
    expect(dimensoesConhecidas(mistura).length + dimensoesAConfirmar(mistura).length).toBe(3);
  });

  it("NAO_ATENDE continua sendo linha — é fato conhecido, não ausência", () => {
    // A carta precisa dizer "não encontra este ponto": é disso que a frase de
    // prontidão se alimenta. Varrê-lo para "o que não sabemos" seria esconder
    // um custo real da opção.
    const so = [dim("ACESSO", "Acesso", "NAO_ATENDE")];
    expect(dimensoesConhecidas(so)).toHaveLength(1);
    expect(fraseDoQueNaoSabemos(so)).toBeNull();
  });
});

describe("a frase única", () => {
  it("sem ausência alguma, não existe frase", () => {
    const todas = PATIENT_DIMENSIONS.map((d) => dim(d.criterion, d.label, "PLENO"));
    expect(fraseDoQueNaoSabemos(todas)).toBeNull();
  });

  it("uma só ausência: sem vírgula, sem 'e'", () => {
    const frase = fraseDoQueNaoSabemos([dim("ACESSO", "Acesso", "A_CONFIRMAR")]);
    expect(frase).toContain("Ainda não pudemos confirmar acesso.");
    expect(frase).not.toContain(" e ");
  });

  it("duas ausências: liga com 'e', nunca com vírgula final", () => {
    const frase = fraseDoQueNaoSabemos([
      dim("CONTINUIDADE_DO_CUIDADO", "Continuidade", "A_CONFIRMAR"),
      dim("ACESSO", "Acesso", "A_CONFIRMAR"),
    ]);
    expect(frase).toContain("continuidade e acesso");
  });

  it("as cinco: uma frase só, com as cinco NOMEADAS — nada é escondido", () => {
    const frase = fraseDoQueNaoSabemos(TODAS_A_CONFIRMAR)!;
    for (const d of PATIENT_DIMENSIONS) {
      expect(frase.toLowerCase(), `dimensão omitida: ${d.label}`).toContain(d.label.toLowerCase());
    }
    // Uma frase de ausência, não cinco: o ponto final antes da saída é o único.
    expect(frase.split("Ainda não pudemos confirmar")).toHaveLength(2);
  });

  it("NÃO afirma que o profissional deixou de declarar — do vazio nada se afirma", () => {
    // `A_CONFIRMAR` cobre tanto o que ele não respondeu quanto o que a equipe
    // ainda não verificou. Dizer "não declarou" inventaria, sobre um médico
    // real, um fato que não temos.
    const frase = fraseDoQueNaoSabemos(TODAS_A_CONFIRMAR)!.toLowerCase();
    for (const proibido of ["não declarou", "nao declarou", "não informou", "se recusou", "omitiu"]) {
      expect(frase, `afirmação indevida: ${proibido}`).not.toContain(proibido);
    }
  });

  it("termina na saída, não na falta", () => {
    const frase = fraseDoQueNaoSabemos(TODAS_A_CONFIRMAR)!;
    expect(frase).toContain("Sua Curadora pode buscar isso");
    expect(frase.trimEnd().endsWith("é só pedir.")).toBe(true);
  });

  it("não reintroduz o rótulo repetido que a mudança veio eliminar", () => {
    const frase = fraseDoQueNaoSabemos(TODAS_A_CONFIRMAR)!;
    expect(frase).not.toContain(COMPATIBILITY_LABELS.A_CONFIRMAR);
  });
});
