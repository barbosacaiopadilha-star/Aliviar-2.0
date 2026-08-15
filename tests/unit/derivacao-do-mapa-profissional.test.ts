import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CATALOGO_GERADO, type CatalogoConceito } from "@/modules/curadoria/catalogo-gerado";
import {
  derivarMapaDoProfissional,
  EntradaInvalidaDaDerivacao,
  selecionarEvidenciaCorrente,
  type DerivacaoDeConceito,
  type EntradaDaDerivacao,
  type EvidenciaDeDerivacao,
} from "@/modules/curadoria/derivacao-do-mapa-profissional";

/**
 * ITEM 1.A — FUNÇÃO PURA DE DERIVAÇÃO DO MAPA DO PROFISSIONAL.
 *
 * CONTRATO_1_A (PA-13): a v1 é a mecânica completa com conteúdo material
 * VAZIO — nenhuma regra evidência→estado foi aprovada, então nenhum estado é
 * proposto, para conceito nenhum. Estes testes provam as duas metades:
 *
 *   1. a mecânica é total, determinística e honesta (todo conceito recebe
 *      exatamente um braço; lacuna jamais vira estado; erro técnico é
 *      exceção);
 *   2. o conteúdo é vazio DE VERDADE (PROPOSTO e LACUNA inalcançáveis; as
 *      guardas G-1..G-5 do §13 mordem o fonte e a árvore de produção).
 */

const RAIZ = process.cwd();
const CAMINHO_DO_MODULO = "src/modules/curadoria/derivacao-do-mapa-profissional.ts";

const fonteBruto = readFileSync(join(RAIZ, CAMINHO_DO_MODULO), "utf8");
/** O fonte sem comentários — o que executa, não o que explica. */
const fonte = fonteBruto
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("//"))
  .join("\n");

// ---------------------------------------------------------------------------
// A matriz do §7, pinada — se o Catálogo mudar de classe, este oráculo acusa
// ---------------------------------------------------------------------------

/** Os nove automáticos, nominais (§7/§9 da missão) — únicos candidatos a regra futura. */
const AUTOMATICOS = [
  "ACESSO_DISPONIBILIDADE",
  "ACESSO_MODALIDADE",
  "ACESSO_PRAZO_PARA_CONSULTA",
  "CONTINUIDADE_CANAIS",
  "CONTINUIDADE_COORDENACAO",
  "CONTINUIDADE_EQUIPE_DE_APOIO",
  "MODELO_ALTERNATIVAS",
  "MODELO_COMUNICACAO",
  "MODELO_PARTICIPACAO_FAMILIAR",
] as const;

const MISTOS = ["ACESSO_LOCAL_DE_ATENDIMENTO", "CONTINUIDADE_RETORNOS"] as const;

const ATIVOS = CATALOGO_GERADO.filter((conceito) => conceito.active);
const HUMANOS = ATIVOS.filter((conceito) => conceito.cruzamento === "humano");
const INATIVOS = CATALOGO_GERADO.filter((conceito) => !conceito.active);

function conceito(code: string): CatalogoConceito {
  const achado = CATALOGO_GERADO.find((entry) => entry.code === code);
  if (!achado) throw new Error(`Conceito fora do Catálogo gerado: ${code}`);
  return achado;
}

let sequencia = 0;
function evidencia(
  code: string,
  extra: Partial<Omit<EvidenciaDeDerivacao, "subcriterionCode">> = {},
): EvidenciaDeDerivacao {
  sequencia += 1;
  return {
    id: `ev-${String(sequencia).padStart(4, "0")}`,
    subcriterionCode: code,
    version: 1,
    options: ["OPCAO_QUALQUER"],
    status: "nao_verificado",
    ...extra,
  };
}

function derivar(
  conceitos: readonly CatalogoConceito[],
  evidencias: readonly EvidenciaDeDerivacao[] = [],
  regras?: EntradaDaDerivacao["regras"],
) {
  return derivarMapaDoProfissional({ conceitos, evidencias, regras });
}

function braco(resultados: readonly DerivacaoDeConceito[], code: string): DerivacaoDeConceito {
  const achado = resultados.find((resultado) => resultado.code === code);
  if (!achado) throw new Error(`Sem resultado para ${code}`);
  return achado;
}

/** Toda evidência sintética possível de um conceito, para os testes exaustivos. */
function cenariosDeEvidencia(code: string): readonly (readonly EvidenciaDeDerivacao[])[] {
  return [
    [],
    [evidencia(code)],
    [evidencia(code, { version: 1 }), evidencia(code, { version: 2, status: "verificado" })],
    [evidencia(code, { version: 3 }), evidencia(code, { version: 3 })],
  ];
}

describe("§7 · a matriz total — o Catálogo gerado ainda é o que o contrato lavrou", () => {
  it("29 ativos: 9 automáticos, 2 mistos, 18 humanos — e 6 inativos do legado", () => {
    expect(ATIVOS).toHaveLength(29);
    expect(ATIVOS.filter((c) => c.cruzamento === "automatico").map((c) => c.code).sort()).toEqual([
      ...AUTOMATICOS,
    ]);
    expect(ATIVOS.filter((c) => c.cruzamento === "misto").map((c) => c.code).sort()).toEqual([
      ...MISTOS,
    ]);
    expect(HUMANOS).toHaveLength(18);
    expect(INATIVOS).toHaveLength(6);
  });

  it("todo conceito do Catálogo recebe exatamente um braço — totalidade sobre domínio fechado", () => {
    const { resultados } = derivar(CATALOGO_GERADO);
    expect(resultados).toHaveLength(CATALOGO_GERADO.length);
    expect(new Set(resultados.map((r) => r.code)).size).toBe(CATALOGO_GERADO.length);

    const contagem = { FORA_DA_DERIVACAO: 0, NAO_SUPORTADO: 0, LACUNA: 0, PROPOSTO: 0 };
    for (const resultado of resultados) contagem[resultado.braco] += 1;
    expect(contagem).toEqual({
      NAO_SUPORTADO: 9,
      FORA_DA_DERIVACAO: 2 + 18 + 6,
      LACUNA: 0,
      PROPOSTO: 0,
    });
  });

  it("a saída sai em ordem lexicográfica de code — a ordem de chegada não tem semântica", () => {
    const { resultados } = derivar([...CATALOGO_GERADO].reverse());
    const codes = resultados.map((r) => r.code);
    expect(codes).toEqual([...codes].sort());
  });
});

describe("§7 · os nove automáticos — NAO_SUPORTADO enquanto nenhuma regra for lavrada", () => {
  for (const code of AUTOMATICOS) {
    it(`${code}: pertence ao mecanismo e responde NAO_SUPORTADO · SEM_REGRA_APROVADA`, () => {
      const semEvidencia = braco(derivar([conceito(code)]).resultados, code);
      expect(semEvidencia).toEqual({ braco: "NAO_SUPORTADO", code, motivo: "SEM_REGRA_APROVADA" });

      // Com evidência dá NO MESMO: sem regra aprovada não há o que aplicar —
      // evidência presente não é semântica (§2, Opção B).
      const comEvidencia = braco(
        derivar([conceito(code)], [evidencia(code, { status: "verificado" })]).resultados,
        code,
      );
      expect(comEvidencia).toEqual(semEvidencia);
    });
  }
});

describe("§7 · humanos, mistos e inativos — FORA_DA_DERIVACAO, com motivo nomeado", () => {
  it("os 18 humanos (inclusive os 4 NUNCA) respondem CRUZAMENTO_HUMANO", () => {
    const { resultados } = derivar(HUMANOS);
    for (const humano of HUMANOS) {
      expect(braco(resultados, humano.code)).toEqual({
        braco: "FORA_DA_DERIVACAO",
        code: humano.code,
        motivo: "CRUZAMENTO_HUMANO",
      });
    }
    for (const nunca of [
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "VIABILIDADE_COBERTURA_E_CONVENIO",
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
    ]) {
      expect(braco(resultados, nunca).braco).toBe("FORA_DA_DERIVACAO");
    }
  });

  for (const code of MISTOS) {
    it(`${code} (misto): a parte humana não se separa sem decisão — CRUZAMENTO_MISTO`, () => {
      expect(braco(derivar([conceito(code)], [evidencia(code)]).resultados, code)).toEqual({
        braco: "FORA_DA_DERIVACAO",
        code,
        motivo: "CRUZAMENTO_MISTO",
      });
    });
  }

  it("os 6 inativos do legado respondem CONCEITO_INATIVO — fora de circulação", () => {
    const { resultados } = derivar(INATIVOS);
    for (const inativo of INATIVOS) {
      expect(braco(resultados, inativo.code)).toEqual({
        braco: "FORA_DA_DERIVACAO",
        code: inativo.code,
        motivo: "CONCEITO_INATIVO",
      });
    }
  });

  it("nenhum humano ou misto é promovido a mecanismo por evidência farta", () => {
    const cheios = [...HUMANOS, ...MISTOS.map(conceito)];
    const evidencias = cheios.map((c) => evidencia(c.code, { status: "verificado" }));
    const { resultados } = derivar(cheios, evidencias);
    expect(resultados.every((r) => r.braco === "FORA_DA_DERIVACAO")).toBe(true);
  });
});

describe("G-3 · do vazio, nada se afirma — P-04/I-8, a propriedade permanente", () => {
  it("entrada sem evidência para o conceito jamais produz PROPOSTO — para NENHUM conceito", () => {
    const { resultados } = derivar(CATALOGO_GERADO, []);
    expect(resultados.some((r) => r.braco === "PROPOSTO")).toBe(false);
  });

  it("exaustivo: todo conceito × todo cenário de evidência × com/sem regra — nunca PROPOSTO, nunca LACUNA, nunca estado", () => {
    for (const entry of CATALOGO_GERADO) {
      for (const evidencias of cenariosDeEvidencia(entry.code)) {
        for (const regras of [
          undefined,
          [{ subcriterionCode: entry.code, ruleId: "regra-nao-lavrada", ruleVersion: 1 }],
        ]) {
          const { resultados } = derivar([entry], evidencias, regras);
          expect(resultados).toHaveLength(1);
          expect(["FORA_DA_DERIVACAO", "NAO_SUPORTADO"]).toContain(resultados[0].braco);
          // Nenhum braço da v1 carrega estado — nem campo `estado` existe
          // na saída alcançável.
          expect(JSON.stringify(resultados)).not.toMatch(
            /"estado"|CONFIRMADO|NAO_CONFIRMADO|NAO_INFORMADO/,
          );
        }
      }
    }
  });

  it("ausência não vira NAO_INFORMADO: a regra 'sem evidência → NAO_INFORMADO' está superada (PA-13)", () => {
    // O contrário — o colapso da Arquitetura §10.4 — produziria estado do
    // enum na saída. A saída da v1 não tem estado NENHUM.
    const saida = JSON.stringify(derivar(CATALOGO_GERADO, []));
    expect(saida).not.toContain("NAO_INFORMADO");
  });

  it("null/undefined não são coerção positiva: evidência malformada é ERRO, nunca estado", () => {
    const malformadas = [
      { ...evidencia("ACESSO_MODALIDADE"), options: undefined },
      { ...evidencia("ACESSO_MODALIDADE"), options: null },
      { ...evidencia("ACESSO_MODALIDADE"), status: undefined },
      { ...evidencia("ACESSO_MODALIDADE"), version: undefined },
    ];
    for (const ruim of malformadas) {
      expect(() =>
        derivar([conceito("ACESSO_MODALIDADE")], [ruim as unknown as EvidenciaDeDerivacao]),
      ).toThrow(EntradaInvalidaDaDerivacao);
    }
  });

  it("pseudo-regra passada por argumento não ativa braço: sem forma lavrada, não há intérprete", () => {
    const code = "MODELO_COMUNICACAO";
    const sem = derivar([conceito(code)], [evidencia(code)]);
    const com = derivar([conceito(code)], [evidencia(code)], [
      { subcriterionCode: code, ruleId: "tentativa-de-atalho", ruleVersion: 7 },
    ]);
    expect(com).toEqual(sem);
  });
});

describe("§9 · determinismo — mesma entrada, mesma saída, sempre", () => {
  const entradaPadrao = (): EntradaDaDerivacao => ({
    conceitos: CATALOGO_GERADO,
    evidencias: [
      { id: "a", subcriterionCode: "ACESSO_MODALIDADE", version: 1, options: ["PRESENCIAL"], status: "verificado" },
      { id: "b", subcriterionCode: "ACESSO_MODALIDADE", version: 2, options: ["REMOTO"], status: "nao_verificado" },
      { id: "c", subcriterionCode: "MODELO_COMUNICACAO", version: 1, options: [], status: "nao_verificado" },
    ],
  });

  it("repetição → resultado idêntico", () => {
    expect(derivarMapaDoProfissional(entradaPadrao())).toEqual(
      derivarMapaDoProfissional(entradaPadrao()),
    );
  });

  it("permutação das coleções (ordem sem semântica) → resultado idêntico", () => {
    const base = entradaPadrao();
    const permutada: EntradaDaDerivacao = {
      conceitos: [...base.conceitos].reverse(),
      evidencias: [...base.evidencias].reverse(),
    };
    expect(derivarMapaDoProfissional(permutada)).toEqual(derivarMapaDoProfissional(base));
  });

  it("serializar/desserializar a entrada → resultado idêntico", () => {
    const base = entradaPadrao();
    const viajada = JSON.parse(JSON.stringify(base)) as EntradaDaDerivacao;
    expect(derivarMapaDoProfissional(viajada)).toEqual(derivarMapaDoProfissional(base));
  });

  it("ambiente não interfere: mudar env e timezone entre chamadas não muda nada", () => {
    const antes = derivarMapaDoProfissional(entradaPadrao());
    const tzOriginal = process.env.TZ;
    const marcaOriginal = process.env.DERIVACAO_1A_MARCA;
    try {
      process.env.TZ = "Pacific/Kiritimati";
      process.env.DERIVACAO_1A_MARCA = "ambiente-mudou";
      expect(derivarMapaDoProfissional(entradaPadrao())).toEqual(antes);
    } finally {
      if (tzOriginal === undefined) delete process.env.TZ;
      else process.env.TZ = tzOriginal;
      if (marcaOriginal === undefined) delete process.env.DERIVACAO_1A_MARCA;
      else process.env.DERIVACAO_1A_MARCA = marcaOriginal;
    }
  });

  it("a função não muta a entrada — sem efeito, nem para dentro", () => {
    const base = entradaPadrao();
    const foto = JSON.parse(JSON.stringify(base));
    derivarMapaDoProfissional(base);
    expect(JSON.parse(JSON.stringify(base))).toEqual(foto);
  });
});

describe("§9 · monotonicidade forte — v1 APENAS (destino pós-regra é da emenda do §10)", () => {
  it("na v1, remover evidência nunca cria estado: a saída nem depende de evidência", () => {
    // A forma forte vale HOJE porque PROPOSTO é inalcançável — ela NÃO é
    // promessa eterna: uma regra futura legítima pode derivar estado de
    // evidência que o declare, e aí a remoção mudará a saída. Quem decide
    // isso é a emenda do §10, não este teste.
    const evidencias = AUTOMATICOS.map((code) => evidencia(code, { status: "verificado" }));
    const completa = derivar(CATALOGO_GERADO, evidencias);

    for (let indice = 0; indice < evidencias.length; indice += 1) {
      const menos = evidencias.filter((_, posicao) => posicao !== indice);
      const reduzida = derivar(CATALOGO_GERADO, menos);
      expect(reduzida).toEqual(completa);
      expect(JSON.stringify(reduzida)).not.toContain("PROPOSTO");
    }
  });
});

describe("§8 · seleção da corrente — DENTRO da entrada, pela única regra já lavrada", () => {
  it("corrente = max(version) entre as evidências RECEBIDAS — nunca busca fora", () => {
    const v1 = evidencia("ACESSO_MODALIDADE", { id: "antiga", version: 1 });
    const v3 = evidencia("ACESSO_MODALIDADE", { id: "corrente", version: 3 });
    const v2 = evidencia("ACESSO_MODALIDADE", { id: "meio", version: 2 });
    expect(selecionarEvidenciaCorrente([v1, v3, v2])).toEqual({
      situacao: "CORRENTE",
      evidencia: v3,
    });
  });

  it("lista vazia → AUSENTE: o que não veio, para a função, não existe", () => {
    expect(selecionarEvidenciaCorrente([])).toEqual({ situacao: "AUSENTE" });
  });

  it("empate na versão máxima → CONFLITO_DE_VERSAO — a função não arbitra (§6)", () => {
    const a = evidencia("ACESSO_MODALIDADE", { id: "zulu", version: 5 });
    const b = evidencia("ACESSO_MODALIDADE", { id: "alfa", version: 5 });
    const menor = evidencia("ACESSO_MODALIDADE", { id: "velha", version: 2 });
    expect(selecionarEvidenciaCorrente([a, b, menor])).toEqual({
      situacao: "CONFLITO_DE_VERSAO",
      versao: 5,
      ids: ["alfa", "zulu"],
    });
  });

  it("evidências de conceitos diferentes na mesma seleção → erro técnico", () => {
    expect(() =>
      selecionarEvidenciaCorrente([evidencia("ACESSO_MODALIDADE"), evidencia("CONTINUIDADE_CANAIS")]),
    ).toThrow(EntradaInvalidaDaDerivacao);
  });
});

describe("§6 · erro técnico — defeito do chamador é exceção, nunca lacuna, nunca braço", () => {
  const casos: [string, () => unknown][] = [
    ["entrada não-objeto", () => derivarMapaDoProfissional(null as unknown as EntradaDaDerivacao)],
    [
      "conceitos não-lista",
      () => derivarMapaDoProfissional({ conceitos: "x", evidencias: [] } as unknown as EntradaDaDerivacao),
    ],
    [
      "conceito duplicado",
      () => derivar([conceito("ACESSO_MODALIDADE"), conceito("ACESSO_MODALIDADE")]),
    ],
    [
      "conceito ativo sem classificação de cruzamento",
      () => derivar([{ ...conceito("ACESSO_MODALIDADE"), cruzamento: "quantico" } as CatalogoConceito]),
    ],
    [
      "evidência de conceito fora da entrada",
      () => derivar([conceito("ACESSO_MODALIDADE")], [evidencia("CONTINUIDADE_CANAIS")]),
    ],
    [
      "evidência duplicada (mesmo id)",
      () =>
        derivar(
          [conceito("ACESSO_MODALIDADE")],
          [
            evidencia("ACESSO_MODALIDADE", { id: "repetido" }),
            evidencia("ACESSO_MODALIDADE", { id: "repetido", version: 2 }),
          ],
        ),
    ],
    [
      "version fora do regime append-only",
      () => derivar([conceito("ACESSO_MODALIDADE")], [evidencia("ACESSO_MODALIDADE", { version: 0 })]),
    ],
    [
      "regra sem identidade completa",
      () =>
        derivar([conceito("ACESSO_MODALIDADE")], [], [
          { subcriterionCode: "ACESSO_MODALIDADE", ruleId: " ", ruleVersion: 1 },
        ]),
    ],
    [
      "duas regras para o mesmo conceito",
      () =>
        derivar([conceito("ACESSO_MODALIDADE")], [], [
          { subcriterionCode: "ACESSO_MODALIDADE", ruleId: "r1", ruleVersion: 1 },
          { subcriterionCode: "ACESSO_MODALIDADE", ruleId: "r2", ruleVersion: 1 },
        ]),
    ],
    [
      "regra de conceito fora da entrada",
      () =>
        derivar([conceito("ACESSO_MODALIDADE")], [], [
          { subcriterionCode: "CONTINUIDADE_CANAIS", ruleId: "r1", ruleVersion: 1 },
        ]),
    ],
  ];

  for (const [nome, chamada] of casos) {
    it(`${nome} → EntradaInvalidaDaDerivacao`, () => {
      expect(chamada).toThrow(EntradaInvalidaDaDerivacao);
    });
  }

  it("o erro técnico não se traveste de braço: a exceção carrega motivo, não resultado", () => {
    try {
      derivar([conceito("ACESSO_MODALIDADE")], [evidencia("CONTINUIDADE_CANAIS")]);
      expect.unreachable("entrada inválida tem de lançar");
    } catch (erro) {
      expect(erro).toBeInstanceOf(EntradaInvalidaDaDerivacao);
      expect((erro as EntradaInvalidaDaDerivacao).motivo).toBe("EVIDENCIA_DE_OUTRO_CONCEITO");
      expect(JSON.stringify((erro as Error).message)).not.toMatch(/LACUNA|NAO_SUPORTADO/);
    }
  });
});

describe("§12 · especificação executável dos braços futuros — desabilitada até a emenda do §10", () => {
  // Estes casos NÃO rodam na v1: ativá-los é ato da emenda que lavrar a
  // primeira regra de correspondência — junto com a forma material da regra.
  it.todo("LACUNA · SEM_EVIDENCIA: conceito coberto por regra, entrada sem evidência dele");
  it.todo("LACUNA · EVIDENCIA_INSUFICIENTE: evidência existe mas não satisfaz a regra lavrada");
  it.todo("LACUNA · EVIDENCIA_CONFLITANTE: empate de versão corrente que a regra não resolve");
  it.todo(
    "PROPOSTO: estado + ruleId/ruleVersion + evidência exata por id/version — proveniência completa (§3.3)",
  );
});

// ---------------------------------------------------------------------------
// As guardas do §13 — o fonte e a árvore de produção sob varredura
// ---------------------------------------------------------------------------

describe("G-1 · pureza — o módulo não alcança o mundo", () => {
  it("todos os imports são type-only, de módulos puros nomeados", () => {
    const imports = fonteBruto.match(/^import .*$/gm) ?? [];
    expect(imports.length).toBeGreaterThan(0);
    for (const linha of imports) {
      expect(linha, `import com dependência viva: ${linha}`).toMatch(/^import type /);
      expect(linha).toMatch(/from "\.\/(catalogo-gerado|mapa-profissional)";$/);
    }
  });

  it("nenhum alcance a banco, rede, relógio, aleatoriedade, ambiente ou sessão", () => {
    for (const proibido of [
      "supabase",
      "createClient",
      "repository",
      "fetch(",
      "Date.now",
      "new Date",
      "Math.random",
      "process.env",
      "require(",
      "localStorage",
      "globalThis",
      "crypto.",
      "auth",
      "session",
      "cookies",
    ]) {
      expect(fonte.includes(proibido), `o fonte alcança o mundo: ${proibido}`).toBe(false);
    }
  });

  it("nenhum singleton mutável: sem let/var no nível do módulo", () => {
    const topo = fonte
      .split("\n")
      .filter((linha) => /^(export )?(let|var) /.test(linha));
    expect(topo).toEqual([]);
  });
});

describe("G-2 · zero chamadores — nenhum consumidor de produção existe", () => {
  function varrer(dir: string): string[] {
    return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
      const caminho = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) return varrer(caminho);
      return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
    });
  }

  it("varredura de `src/`: zero imports, zero calls, zero consumers (testes não contam)", () => {
    const consumidores = varrer("src")
      .filter((arquivo) => !arquivo.endsWith("derivacao-do-mapa-profissional.ts"))
      .filter((arquivo) => {
        const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
        return (
          codigo.includes("derivacao-do-mapa-profissional") ||
          codigo.includes("derivarMapaDoProfissional") ||
          codigo.includes("selecionarEvidenciaCorrente")
        );
      });
    // A prova positiva do §30 da missão: o número esperado é 0 — o 1.A é
    // mecânica à espera do 2.C, nunca superfície.
    expect(consumidores).toEqual([]);
  });
});

describe("G-4 · nenhuma semântica material em código — conteúdo só por regra versionada", () => {
  it("os literais dos três estados do Mapa não existem no fonte — nem um", () => {
    for (const estado of ['"CONFIRMADO"', '"NAO_CONFIRMADO"', '"NAO_INFORMADO"']) {
      expect(fonte.includes(estado), `semântica material em código: ${estado}`).toBe(false);
    }
  });

  it("PROPOSTO e LACUNA existem SÓ como declaração de tipo — um literal cada, nenhum construtor", () => {
    // A declaração do braço no union type usa o literal uma vez. Um segundo
    // uso significaria um objeto sendo CONSTRUÍDO — o braço deixando de ser
    // inalcançável por fora da emenda do §10.
    expect(fonte.match(/braco: "PROPOSTO"/g)).toHaveLength(1);
    expect(fonte.match(/braco: "LACUNA"/g)).toHaveLength(1);
  });

  it("nenhuma correspondência opção→estado: sem satisfied_by, sem matriz, sem switch material", () => {
    for (const proibido of ["satisfiedBy", "satisfied_by", "MATRIZ", "switch ("]) {
      expect(fonte.includes(proibido), `tradução material em código: ${proibido}`).toBe(false);
    }
  });
});

describe("G-5 · fronteira com o 2.C — nenhuma ativação operacional nasce aqui", () => {
  it("o módulo não menciona tabela, capability, emissor ou caminho de persistência", () => {
    for (const proibido of [
      "professional_subcriterion_map",
      "case_priority_map",
      "derivation_proposals",
      "derivation_proposal_acts",
      "practice_evidence",
      "curator_judgments",
      "emitir_proposta",
      "decidir_proposta",
      "capability",
      `-repository"`,
      "-actions",
      "rpc(",
      ".from(",
      ".insert(",
      ".upsert(",
      ".update(",
      ".delete(",
      "revalidate",
      "use server",
      "NextRequest",
      "NextResponse",
    ]) {
      expect(fonte.includes(proibido), `o módulo alcança o 2.C: ${proibido}`).toBe(false);
    }
  });

  it("o item não cria artefato de banco: nenhuma migration nasceu com o 1.A", () => {
    const migrations = readdirSync(join(RAIZ, "supabase", "migrations")).filter((nome) =>
      nome.endsWith(".sql"),
    );
    // `/1_a/` solto casava com qualquer timestamp terminado em 1 seguido de
    // `_a…` — p.ex. `…21141_autoria_…` (C7R). A âncora diz o que o oráculo
    // sempre quis dizer: um marcador do ITEM 1.A no nome, não três caracteres.
    const doItem = migrations.filter((nome) =>
      /(^|_)1_a(_|$)|item_1a|derivacao_do_mapa|mapa_profissional_derivacao/i.test(nome),
    );
    expect(doItem).toEqual([]);
  });
});
