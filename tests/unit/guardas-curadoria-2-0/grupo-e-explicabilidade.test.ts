import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_LABELS,
  COMPATIBILITY_RESULTS,
  crossPriorityAndProfessional,
  summarySentence,
} from "@/modules/curadoria/motor-compatibilidade";
import {
  SUBCRITERION_STATUSES,
  SUBCRITERION_STATUS_LABELS,
  SUBCRITERION_STATUS_MEANING,
} from "@/modules/curadoria/mapa-profissional";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO E: EXPLICABILIDADE
 *
 * O critério AC-EXPLICA (§17.4) só é plenamente testável quando a Ficha de
 * Explicação existir (Onda 1.8). O que já é testável hoje é a **primitiva** da
 * qual toda explicação depende: a distinção entre "ninguém olhou" e "olharam e
 * não souberam" tem de sobreviver à leitura, e nenhuma frase automática pode
 * concluir qualidade nem preencher lacuna com texto de reserva.
 *
 * ┌ E-01 — A lacuna sobrevive à leitura
 * │ Objetivo ......... `LACUNA_DE_INFORMACAO` nunca apaga a diferença entre
 * │                    ausência de registro e `NAO_INFORMADO` declarado.
 * │ Princípio ........ Congelamento I-8; Arquitetura §4.3 (inventário de
 * │                    lacunas) e P-04.
 * │ Arquivos ......... motor-compatibilidade.ts
 * │ Validação ........ o `status` acompanha a linha, e o resumo separa as duas.
 * │ Falha ............ alguém colapsa `status: null` em `NAO_INFORMADO`.
 * ├ E-02 — Nenhuma frase automática conclui qualidade
 * │ Princípio ........ Congelamento I-9; Arquitetura §11.5.
 * │ Validação ........ varredura léxica sobre toda frase gerada pelo Motor e
 * │                    sobre todo rótulo de estado.
 * ├ E-03 — Nenhum texto de reserva ocupa o lugar da explicação
 * │ Princípio ........ AC-EXPLICA item 6: "erro é erro; não vira explicação".
 * └ E-04 — O vocabulário do Motor não alcança a paciente
 *   Princípio ........ Congelamento I-5; Arquitetura §11.5; fronteira já
 *                      existente `PATIENT_FORBIDDEN_TERMS`.
 */

const LEXICO_DE_QUALIDADE =
  /\b(melhor|pior|ideal|excelente|ótim|superior|inferior|recomendad|garantid|assegurad|indicad para você)/i;

const TEXTOS_DE_RESERVA =
  /informação indisponível|dados insuficientes|gerado pelo sistema|não disponível no momento|sem informações/i;

function leitura(status: (typeof SUBCRITERION_STATUSES)[number] | null) {
  return crossPriorityAndProfessional({
    casePriorities: [
      { subcriterionCode: "ACESSO_MODALIDADE", importance: "MUITO_IMPORTANTE" },
      { subcriterionCode: "CONTINUIDADE_RETORNOS", importance: "IMPORTANTE" },
    ],
    professionalStates:
      status === null ? [] : [{ subcriterionCode: "ACESSO_MODALIDADE", status }],
    activeSubcriterionCodes: ["ACESSO_MODALIDADE", "CONTINUIDADE_RETORNOS"],
  });
}

describe("E-01 · A lacuna sobrevive à leitura", () => {
  it("ausência de registro e NAO_INFORMADO dão o mesmo resultado, e seguem distinguíveis", () => {
    const semRegistro = leitura(null).rows.find((r) => r.subcriterionCode === "ACESSO_MODALIDADE")!;
    const declarado = leitura("NAO_INFORMADO").rows.find(
      (r) => r.subcriterionCode === "ACESSO_MODALIDADE",
    )!;

    expect(semRegistro.result).toBe("LACUNA_DE_INFORMACAO");
    expect(declarado.result).toBe("LACUNA_DE_INFORMACAO");
    expect(
      semRegistro.status,
      "Sem o `status`, quem lê não sabe se ninguém olhou ou se olharam e não souberam — e as duas exigem ações diferentes.",
    ).toBeNull();
    expect(declarado.status).toBe("NAO_INFORMADO");
  });

  it("o resumo conta separadamente as lacunas de quem ninguém tratou", () => {
    expect(leitura(null).summary.gapsWithoutAnyRecord).toBe(2);
    expect(leitura("NAO_INFORMADO").summary.gapsWithoutAnyRecord).toBe(1);
  });

  it("o que o Case não declarou é fato sobre o Case — nunca sobre o profissional", () => {
    const parcial = crossPriorityAndProfessional({
      casePriorities: [{ subcriterionCode: "ACESSO_MODALIDADE", importance: "IMPORTANTE" }],
      professionalStates: [],
      activeSubcriterionCodes: ["ACESSO_MODALIDADE", "CONTINUIDADE_RETORNOS"],
    });
    expect(parcial.summary.notDeclaredByCase).toBe(1);
    expect(parcial.rows.map((r) => r.subcriterionCode)).toEqual(["ACESSO_MODALIDADE"]);
  });
});

describe("E-02 · Nenhuma frase automática conclui qualidade", () => {
  it("nenhuma frase de resumo do Motor emite juízo", () => {
    for (const estado of [...SUBCRITERION_STATUSES, null] as const) {
      const frase = summarySentence(leitura(estado).summary);
      expect(
        LEXICO_DE_QUALIDADE.test(frase),
        `A frase "${frase}" conclui qualidade. O Motor organiza; quem conclui é uma pessoa.`,
      ).toBe(false);
    }
  });

  it("nenhum rótulo ou significado de estado promete que a necessidade será atendida", () => {
    const textos = [
      ...Object.values(SUBCRITERION_STATUS_LABELS),
      ...Object.values(SUBCRITERION_STATUS_MEANING),
      ...Object.values(COMPATIBILITY_LABELS),
    ];
    for (const texto of textos) {
      expect(
        LEXICO_DE_QUALIDADE.test(texto),
        `"${texto}" promete ou julga. Congelamento I-9: nenhuma frase automática conclui qualidade.`,
      ).toBe(false);
    }
  });
});

describe("E-03 · Nenhum texto de reserva ocupa o lugar da explicação", () => {
  it("as frases do Motor nunca usam texto genérico de indisponibilidade", () => {
    for (const estado of [...SUBCRITERION_STATUSES, null] as const) {
      expect(TEXTOS_DE_RESERVA.test(summarySentence(leitura(estado).summary))).toBe(false);
    }
  });

  it("nenhum rótulo é traço, vazio ou reticências — silêncio é indistinguível de 'não existe'", () => {
    for (const [chave, rotulo] of Object.entries({
      ...COMPATIBILITY_LABELS,
      ...SUBCRITERION_STATUS_LABELS,
    })) {
      expect(rotulo.trim().length, `O rótulo de ${chave} está vazio.`).toBeGreaterThan(2);
      expect(["-", "—", "...", "…", "n/a", "N/A"]).not.toContain(rotulo.trim());
    }
  });
});

describe("E-04 · O vocabulário do Motor não alcança a paciente", () => {
  it("os termos do mecanismo continuam barrados na fronteira dela", () => {
    for (const termo of ["motor", "cruzamento", "score", "ranking"]) {
      expect(
        violatesPatientVocabulary(`A leitura usou o ${termo} do sistema.`),
        `O termo "${termo}" deixou de ser barrado na superfície da paciente.`,
      ).not.toBeNull();
    }
  });

  it("nenhum nome interno de resultado é texto apresentável — eles são código, não frase", () => {
    for (const resultado of COMPATIBILITY_RESULTS) {
      expect(resultado).toMatch(/^[A-Z_]+$/);
    }
  });
});
