import { describe, expect, it } from "vitest";

import {
  construirFicha,
  explicarLeitura,
  GRAUS_DE_CONFIANCA,
  NAO_HA_POSICAO,
  type EntradaDaFicha,
  type OrigemDoConceito,
} from "@/modules/curadoria/ficha-de-explicacao";
import {
  paraMesa,
  paraPaciente,
  paraRelatorio,
} from "@/modules/curadoria/ficha-de-explicacao-vocabulario";
import { PATIENT_FORBIDDEN_TERMS, violatesPatientVocabulary } from "@/modules/paciente/experiencia";
import { conceitosForaDoMotor } from "@/modules/curadoria/participacao-no-motor";
import { CATALOGO_GERADO } from "@/modules/curadoria/catalogo-gerado";

/**
 * ITEM 1.8 — FICHA DE EXPLICAÇÃO (Arquitetura §11).
 *
 * O que se prova aqui: as seis respostas existem separadas; a confiança é
 * qualitativa e obedece às cinco proibições; os três vocabulários dizem a mesma
 * verdade em três línguas; e AC-EXPLICA bloqueia em vez de inventar.
 */

const DECLARACAO = {
  degree: "ESSENCIAL" as const,
  declaredAt: "2026-08-01T10:00:00+00:00",
  declaredBy: "00000000-0000-4000-8000-0000000000a1",
};

const origem = (code: string, over: Partial<OrigemDoConceito> = {}): OrigemDoConceito => ({
  subcriterionCode: code,
  declaracaoOriginal: DECLARACAO,
  derivacao: null,
  ...over,
});

const REGRA_VIGENTE = {
  ruleId: "regra-sintetica",
  ruleVersion: 1,
  estadoDaRegra: "VIGENTE" as const,
  propostaId: "00000000-0000-4000-8000-0000000000p1",
};

function entrada(over: Partial<EntradaDaFicha> = {}): EntradaDaFicha {
  return {
    professionalProfileId: "00000000-0000-4000-8000-0000000000f1",
    leitura: {
      rows: [
        {
          subcriterionCode: "MODELO_COMUNICACAO",
          importance: "MUITO_IMPORTANTE",
          status: "CONFIRMADO",
          result: "ALTA_COMPATIBILIDADE",
        },
      ],
      summary: {
        totalSubcriteria: 1,
        highCompatibility: 1,
        mediumCompatibility: 0,
        informationGaps: 0,
        notRelevant: 0,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
    },
    origens: [origem("MODELO_COMUNICACAO")],
    foraDoMotorPorMetodo: conceitosForaDoMotor(),
    ...over,
  };
}

function fichaOk(over: Partial<EntradaDaFicha> = {}) {
  const r = construirFicha(entrada(over));
  if (!r.renderizavel) throw new Error(`esperava Ficha, veio bloqueio: ${JSON.stringify(r.bloqueios)}`);
  return r.ficha;
}

// ===========================================================================
// §11.2 — as seis respostas
// ===========================================================================

describe("§11.2 · as seis respostas existem, e existem separadas", () => {
  it("a Ficha responde as seis, cada uma no seu campo", () => {
    const { respostas } = fichaOk();
    expect(Object.keys(respostas).sort()).toEqual([
      "criteriosQueInfluenciaram",
      "criteriosQueNaoInfluenciaram",
      "grauDeConfianca",
      "lacunas",
      "porQueFoiEscolhida",
      "porQueNestaPosicao",
    ]);
  });

  it("1 — por que foi escolhida: declaração dela e estado dele lado a lado", () => {
    const [c] = fichaOk().respostas.porQueFoiEscolhida;
    expect(c).toEqual({
      subcriterionCode: "MODELO_COMUNICACAO",
      degreeDela: "ESSENCIAL",
      estadoDele: "CONFIRMADO",
      resultado: "ALTA_COMPATIBILIDADE",
    });
  });

  it("2 — a resposta sobre posição é NÃO HÁ POSIÇÃO, dita explicitamente", () => {
    expect(fichaOk().respostas.porQueNestaPosicao).toBe(NAO_HA_POSICAO);
    expect(paraMesa(fichaOk()).porQueNestaPosicao).toMatch(/não há posição/i);
    expect(paraPaciente(fichaOk()).sobreAOrdem).toMatch(/não quer dizer nada/i);
  });

  it("4 — os três motivos de não-influência nunca são fundidos", () => {
    const foraDoMotor = conceitosForaDoMotor()[0]!;
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
          {
            subcriterionCode: foraDoMotor,
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "NAO_RELEVANTE",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "NAO_INFLUENCIA",
            status: "CONFIRMADO",
            result: "NAO_RELEVANTE",
          },
        ],
        summary: {
          totalSubcriteria: 3,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 0,
          notRelevant: 2,
          gapsWithoutAnyRecord: 0,
          notDeclaredByCase: 0,
        },
      },
      origens: [
        origem("MODELO_COMUNICACAO"),
        origem(foraDoMotor),
        origem("MODELO_ALTERNATIVAS", {
          declaracaoOriginal: { ...DECLARACAO, degree: "SEM_PREFERENCIA" },
        }),
      ],
    });

    const motivos = ficha.respostas.criteriosQueNaoInfluenciaram;
    expect(motivos.find((m) => m.subcriterionCode === foraDoMotor)?.motivo).toBe(
      "FORA_DO_MOTOR_POR_METODO",
    );
    expect(motivos.find((m) => m.subcriterionCode === "MODELO_ALTERNATIVAS")?.motivo).toBe(
      "GRAU_SEM_PREFERENCIA",
    );
    // (b) é fato sobre o CASE: todo conceito ativo que não entrou na leitura.
    const naoDeclarados = motivos.filter(
      (m) => m.motivo === "SEM_IMPORTANCIA_DECLARADA_PELO_CASE",
    );
    expect(naoDeclarados.length).toBeGreaterThan(0);
    expect(naoDeclarados.map((m) => m.subcriterionCode)).not.toContain("MODELO_COMUNICACAO");
  });

  it("5 — as lacunas vêm separadas por natureza, nunca somadas", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "MUITO_IMPORTANTE",
            status: "NAO_INFORMADO",
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 3,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 2,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      origens: [
        origem("MODELO_COMUNICACAO"),
        origem("MODELO_ALTERNATIVAS"),
        origem("ACESSO_MODALIDADE"),
      ],
      pendencias: [{ subcriterionCode: "ACESSO_MODALIDADE", natureza: "JUIZO_HUMANO_PENDENTE" }],
    });

    expect(ficha.respostas.lacunas).toEqual([
      { subcriterionCode: "MODELO_COMUNICACAO", natureza: "NINGUEM_OLHOU" },
      { subcriterionCode: "MODELO_ALTERNATIVAS", natureza: "OLHARAM_E_NAO_SOUBERAM" },
      { subcriterionCode: "ACESSO_MODALIDADE", natureza: "JUIZO_HUMANO_PENDENTE" },
    ]);
  });
});

// ===========================================================================
// §11.3 — confiança qualitativa e as cinco proibições
// ===========================================================================

describe("§11.3 · o grau de confiança é qualitativo", () => {
  it("é um dos três estados nomeados, e só", () => {
    expect(GRAUS_DE_CONFIANCA).toEqual([
      "LEITURA_COMPLETA",
      "LEITURA_COM_LACUNAS",
      "LEITURA_INSUFICIENTE",
    ]);
    expect(GRAUS_DE_CONFIANCA).toContain(fichaOk().respostas.grauDeConfianca);
  });

  it("leitura sem lacuna é COMPLETA; com lacuna é COM_LACUNAS", () => {
    expect(fichaOk().respostas.grauDeConfianca).toBe("LEITURA_COMPLETA");

    const comLacuna = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      origens: [origem("MODELO_COMUNICACAO"), origem("ACESSO_MODALIDADE")],
    });
    expect(comLacuna.respostas.grauDeConfianca).toBe("LEITURA_COM_LACUNAS");
  });

  it("sem estado para nenhum conceito essencial é INSUFICIENTE", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 1,
          highCompatibility: 0,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      origens: [origem("MODELO_COMUNICACAO")],
    });
    expect(ficha.respostas.grauDeConfianca).toBe("LEITURA_INSUFICIENTE");
  });

  // --- as cinco proibições, uma a uma ---------------------------------------

  it("proibição 1 — nunca um número: nada na Ficha é numérico", () => {
    const ficha = fichaOk();
    const numericos = Object.entries(ficha.respostas).filter(
      ([, v]) => typeof v === "number",
    );
    expect(numericos, "a confiança virou número").toEqual([]);
    expect(typeof ficha.respostas.grauDeConfianca).toBe("string");

    const textos = [
      ...paraMesa(ficha).grauDeConfianca,
      paraRelatorio(ficha).grauDeConfianca,
      paraPaciente(ficha).sobreAsInformacoes,
    ].join(" ");
    expect(textos, "nasceu percentual ou fração na confiança").not.toMatch(/\d+\s*%|\d+\s*\/\s*\d+/);
  });

  it("proibição 2 — nunca comparativo: a Ficha só fala de um profissional", () => {
    const a = fichaOk();
    const b = fichaOk({ professionalProfileId: "00000000-0000-4000-8000-0000000000f2" });
    const textoDeA = JSON.stringify([paraMesa(a), paraRelatorio(a), paraPaciente(a)]);
    expect(textoDeA, "a Ficha de um mencionou o outro").not.toContain(b.professionalProfileId);
  });

  it("proibição 3 — nunca chave de ordenação: a lista sai na ordem de entrada", () => {
    const um = entrada({ professionalProfileId: "prof-1" });
    const dois = entrada({
      professionalProfileId: "prof-2",
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 1,
          highCompatibility: 0,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
    });

    // `prof-2` tem leitura pior. Se a confiança ordenasse, ele mudaria de lugar.
    expect(explicarLeitura([um, dois]).fichas.map((f) => f.professionalProfileId)).toEqual([
      "prof-1",
      "prof-2",
    ]);
    expect(explicarLeitura([dois, um]).fichas.map((f) => f.professionalProfileId)).toEqual([
      "prof-2",
      "prof-1",
    ]);
  });

  it("proibição 4 — nunca mérito: a lacuna é dita como dívida da operação", () => {
    const comLacuna = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      origens: [origem("MODELO_COMUNICACAO"), origem("ACESSO_MODALIDADE")],
    });
    const frase = paraRelatorio(comLacuna).grauDeConfianca;
    expect(frase).toMatch(/não defeito de quem é lido/i);
    expect(frase, "a lacuna virou culpa do profissional").not.toMatch(
      /profissional (não|nao) (informou|quis|soube)/i,
    );
  });

  it("proibição 5 — nunca vocabulário de qualidade sobre a pessoa", () => {
    const ficha = fichaOk();
    const tudo = JSON.stringify([paraMesa(ficha), paraRelatorio(ficha), paraPaciente(ficha)]);
    for (const juizo of ["excelente", "melhor", "pior", "ótimo", "ruim", "qualidade do profissional"]) {
      expect(tudo.toLowerCase(), `julgamento da pessoa: "${juizo}"`).not.toContain(juizo);
    }
  });
});

// ===========================================================================
// §11.5 — os três vocabulários
// ===========================================================================

describe("§11.5 · três vocabulários, uma verdade", () => {
  it("Mesa: técnico completo, com célula nomeada e a árvore de proveniência", () => {
    const mesa = paraMesa(fichaOk({ origens: [origem("MODELO_COMUNICACAO", { derivacao: REGRA_VIGENTE })] }));
    expect(mesa.porQueFoiEscolhida[0]).toBe(
      "MODELO_COMUNICACAO · ESSENCIAL × CONFIRMADO → ALTA_COMPATIBILIDADE",
    );
    expect(mesa.proveniencia[0]).toContain("regra regra-sintetica v1 [VIGENTE]");
    expect(mesa.proveniencia[0]).toContain("case_needs(ESSENCIAL");
  });

  it("Relatório: verbaliza e carrega a proveniência, sem copiar o técnico cru", () => {
    const rel = paraRelatorio(fichaOk({ origens: [origem("MODELO_COMUNICACAO", { derivacao: REGRA_VIGENTE })] }));
    expect(rel.porQueFoiEscolhida[0]).toContain("Como explica");
    expect(rel.porQueFoiEscolhida[0]).toContain("regra regra-sintetica, versão 1");
    expect(rel.porQueFoiEscolhida[0], "copiou a representação técnica crua").not.toContain(
      "MODELO_COMUNICACAO",
    );
    expect(rel.porQueFoiEscolhida[0]).not.toContain("×");
  });

  it("paciente: nenhum termo proibido, nenhum identificador técnico", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      origens: [
        origem("MODELO_COMUNICACAO", { derivacao: REGRA_VIGENTE }),
        origem("MODELO_ALTERNATIVAS", { derivacao: REGRA_VIGENTE }),
      ],
    });

    const texto = Object.values(paraPaciente(ficha)).flat().join(" ");

    const proibido = violatesPatientVocabulary(texto);
    expect(proibido, `vazou termo proibido: ${proibido}`).toBeNull();

    // Identificadores técnicos: código de conceito, id de regra, versão, enums.
    for (const vazamento of [
      "MODELO_COMUNICACAO",
      "regra-sintetica",
      "v1",
      "versão 1",
      "ALTA_COMPATIBILIDADE",
      "LACUNA_DE_INFORMACAO",
      "CONFIRMADO",
      "ESSENCIAL",
      "LEITURA_COM_LACUNAS",
      REGRA_VIGENTE.propostaId,
      ficha.professionalProfileId,
    ]) {
      expect(texto, `vazou identificador técnico: ${vazamento}`).not.toContain(vazamento);
    }
  });

  it("os termos proibidos cobrem a Ficha da paciente em qualquer combinação", () => {
    // Falseabilidade: a varredura enxerga de verdade o que ela promete varrer.
    expect(PATIENT_FORBIDDEN_TERMS.length).toBeGreaterThan(5);
    for (const termo of PATIENT_FORBIDDEN_TERMS) {
      // A varredura acusa — qual termo ela nomeia pode ser um prefixo legítimo
      // (`internalScore` acusa por `score`), e exigir o nome exato mediria a
      // ordem da lista em vez da proteção.
      expect(
        violatesPatientVocabulary(`frase da paciente com ${termo} no meio`),
        `a varredura não pegou "${termo}"`,
      ).not.toBeNull();
    }
  });

  it("os três vocabulários falam do MESMO conjunto de conceitos", () => {
    const ficha = fichaOk();
    expect(paraMesa(ficha).criteriosQueInfluenciaram).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
    expect(paraRelatorio(ficha).criteriosQueInfluenciaram).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
    expect(paraPaciente(ficha).oQueFoiConsiderado).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
  });
});

// ===========================================================================
// AC-EXPLICA — bloqueio nomeado
// ===========================================================================

describe("AC-EXPLICA · sem cadeia, não renderiza", () => {
  function bloqueios(over: Partial<EntradaDaFicha>) {
    const r = construirFicha(entrada(over));
    if (r.renderizavel) throw new Error("esperava bloqueio, veio Ficha");
    return r.bloqueios;
  }

  it("Ficha completa → renderiza", () => {
    expect(construirFicha(entrada()).renderizavel).toBe(true);
  });

  it("origem ausente → não renderiza", () => {
    expect(bloqueios({ origens: [] })).toEqual([
      { subcriterionCode: "MODELO_COMUNICACAO", motivo: "SEM_ORIGEM" },
    ]);
  });

  it("declaração original ausente → não renderiza", () => {
    expect(
      bloqueios({ origens: [origem("MODELO_COMUNICACAO", { declaracaoOriginal: null })] }),
    ).toEqual([{ subcriterionCode: "MODELO_COMUNICACAO", motivo: "SEM_DECLARACAO_ORIGINAL" }]);
  });

  it("regra ausente numa derivação → não renderiza", () => {
    expect(
      bloqueios({
        origens: [
          origem("MODELO_COMUNICACAO", { derivacao: { ...REGRA_VIGENTE, ruleId: "  " } }),
        ],
      }),
    ).toEqual([{ subcriterionCode: "MODELO_COMUNICACAO", motivo: "SEM_REGRA" }]);
  });

  it("versão ausente → não renderiza", () => {
    expect(
      bloqueios({
        origens: [
          origem("MODELO_COMUNICACAO", {
            derivacao: { ...REGRA_VIGENTE, ruleVersion: null as unknown as number },
          }),
        ],
      }),
    ).toEqual([{ subcriterionCode: "MODELO_COMUNICACAO", motivo: "SEM_VERSAO" }]);
  });

  it("versão errada (0, negativa ou fracionária) → recusada", () => {
    for (const v of [0, -1, 1.5]) {
      expect(
        bloqueios({
          origens: [origem("MODELO_COMUNICACAO", { derivacao: { ...REGRA_VIGENTE, ruleVersion: v } })],
        }),
        `versão ${v} passou`,
      ).toEqual([{ subcriterionCode: "MODELO_COMUNICACAO", motivo: "VERSAO_INVALIDA" }]);
    }
  });

  it("regra suspensa, revogada ou ainda em proposta → não finge validade", () => {
    for (const estado of ["SUSPENSA", "REVOGADA", "PROPOSTA"] as const) {
      expect(
        bloqueios({
          origens: [
            origem("MODELO_COMUNICACAO", { derivacao: { ...REGRA_VIGENTE, estadoDaRegra: estado } }),
          ],
        }),
        `estado ${estado} passou`,
      ).toEqual([{ subcriterionCode: "MODELO_COMUNICACAO", motivo: "REGRA_NAO_APLICAVEL" }]);
    }
  });

  it("proveniência inconsistente acumula TODOS os motivos, sem parar no primeiro", () => {
    const encontrados = bloqueios({
      origens: [
        origem("MODELO_COMUNICACAO", {
          declaracaoOriginal: null,
          derivacao: { ...REGRA_VIGENTE, ruleId: "", ruleVersion: 0, estadoDaRegra: "REVOGADA" },
        }),
      ],
    });
    expect(encontrados.map((b) => b.motivo).sort()).toEqual([
      "REGRA_NAO_APLICAVEL",
      "SEM_DECLARACAO_ORIGINAL",
      "SEM_REGRA",
      "VERSAO_INVALIDA",
    ]);
  });

  it("a superfície recebe DUAS listas: o que renderiza e o que não é exibível", () => {
    const resultado = explicarLeitura([
      entrada({ professionalProfileId: "prof-ok" }),
      entrada({ professionalProfileId: "prof-sem-origem", origens: [] }),
    ]);
    expect(resultado.fichas.map((f) => f.professionalProfileId)).toEqual(["prof-ok"]);
    expect(resultado.naoExibiveis).toHaveLength(1);
    expect(resultado.naoExibiveis[0]!.professionalProfileId).toBe("prof-sem-origem");
    expect(resultado.naoExibiveis[0]!.bloqueios[0]!.motivo).toBe("SEM_ORIGEM");
  });

  it("não existe texto de reserva: o bloqueio nomeia o conceito e o motivo", () => {
    const r = construirFicha(entrada({ origens: [] }));
    const texto = JSON.stringify(r);
    for (const reserva of [
      "não foi possível",
      "indisponível no momento",
      "sem informações",
      "tente novamente",
      "erro ao",
    ]) {
      expect(texto.toLowerCase(), `nasceu texto genérico de reserva: "${reserva}"`).not.toContain(
        reserva,
      );
    }
    expect(r.renderizavel).toBe(false);
  });
});

// ===========================================================================
// A2 — a Ficha explica, não decide · e é determinística
// ===========================================================================

describe("A2 · a Ficha explica, nunca decide", () => {
  it("não cria importância, não altera resultado, não reordena", () => {
    const base = entrada();
    const ficha = fichaOk();

    // Os resultados saem exatamente como o Motor os entregou.
    expect(ficha.respostas.criteriosQueInfluenciaram.map((c) => c.resultado)).toEqual(
      base.leitura.rows.map((r) => r.result),
    );
    // E as importâncias vêm da declaração original, não de cálculo da Ficha.
    expect(ficha.proveniencia.map((p) => p.declaracaoOriginal.degree)).toEqual(["ESSENCIAL"]);
  });

  it("é determinística: mesma entrada, mesma saída", () => {
    expect(JSON.stringify(construirFicha(entrada()))).toBe(
      JSON.stringify(construirFicha(entrada())),
    );
  });

  it("conceito fora do Motor nunca vira correspondência", () => {
    for (const code of conceitosForaDoMotor()) {
      const ficha = fichaOk({
        leitura: {
          rows: [
            {
              subcriterionCode: code,
              importance: "MUITO_IMPORTANTE",
              status: "CONFIRMADO",
              result: "NAO_RELEVANTE",
            },
          ],
          summary: {
            totalSubcriteria: 1,
            highCompatibility: 0,
            mediumCompatibility: 0,
            informationGaps: 0,
            notRelevant: 1,
            gapsWithoutAnyRecord: 0,
            notDeclaredByCase: 0,
          },
        },
        origens: [origem(code)],
      });
      expect(ficha.respostas.porQueFoiEscolhida).toEqual([]);
      expect(
        ficha.respostas.criteriosQueNaoInfluenciaram.find((m) => m.subcriterionCode === code)
          ?.motivo,
      ).toBe("FORA_DO_MOTOR_POR_METODO");
    }
  });

  it("os conceitos citados existem no Catálogo — a Ficha não inventa conceito", () => {
    const ativos = new Set(CATALOGO_GERADO.map((c) => c.code));
    const ficha = fichaOk();
    for (const grupo of [
      ficha.respostas.criteriosQueInfluenciaram,
      ficha.respostas.criteriosQueNaoInfluenciaram,
      ficha.respostas.lacunas,
    ]) {
      for (const item of grupo) expect(ativos.has(item.subcriterionCode)).toBe(true);
    }
  });
});
