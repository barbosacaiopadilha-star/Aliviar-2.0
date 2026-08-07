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

// ===========================================================================
// ITEM 1.8 — FICHA DE EXPLICAÇÃO
//
// ┌ E-05 — A Ficha é derivada: não persiste, não cacheia, não guarda snapshot
// │ Princípio ........ §11.0/§11.1 — a Ficha é estágio do Motor com saída
// │                    própria, reconstruível a partir dos fatos. Um snapshot
// │                    congelaria uma explicação que a regra já mudou.
// ├ E-06 — AC-PIPELINE: nenhuma superfície explica por fora
// │ Princípio ........ nenhuma derivação alcança humano sem passar pelo leitor
// │                    oficial. Texto paralelo é explicação sem proveniência.
// └ E-07 — A confiança é qualitativa, e não vira ordem
//   Princípio ........ §11.3, proibições 1 e 3.
// ===========================================================================

import { readdirSync as lerDir, readFileSync as lerArquivo, statSync as statDe } from "node:fs";
import path18 from "node:path";

const RAIZ_18 = process.cwd();

function arquivosDe18(dir: string, exts: readonly string[]): string[] {
  const achados: string[] = [];
  const andar = (atual: string) => {
    for (const entrada of lerDir(atual)) {
      const completo = path18.join(atual, entrada);
      if (statDe(completo).isDirectory()) { andar(completo); continue; }
      if (exts.some((e) => entrada.endsWith(e))) achados.push(completo);
    }
  };
  andar(dir);
  return achados;
}

const FONTES_18 = arquivosDe18(path18.join(RAIZ_18, "src"), [".ts", ".tsx"]);
const MIGRATIONS_18 = arquivosDe18(path18.join(RAIZ_18, "supabase", "migrations"), [".sql"]);

function ocorrencias18(arquivos: readonly string[], padrao: RegExp): string[] {
  return arquivos
    .filter((a) => padrao.test(lerArquivo(a, "utf8")))
    .map((a) => path18.relative(RAIZ_18, a).split(path18.sep).join("/"));
}

const FICHA = path18.join(RAIZ_18, "src", "modules", "curadoria", "ficha-de-explicacao.ts");
const VOCABULARIO = path18.join(
  RAIZ_18,
  "src",
  "modules",
  "curadoria",
  "ficha-de-explicacao-vocabulario.ts",
);

const FONTE_DA_FICHA = lerArquivo(FICHA, "utf8");
const FONTE_DO_VOCABULARIO = lerArquivo(VOCABULARIO, "utf8");
/** Só o código: comentário que NOMEIA o defeito não é o defeito. */
const semComentario = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(\/\/|\*).*$/gm, "");
const CODIGO_DA_FICHA = semComentario(FONTE_DA_FICHA);
const CODIGO_DO_VOCABULARIO = semComentario(FONTE_DO_VOCABULARIO);

describe("E-05 · A Ficha é derivada — nada dela é persistido", () => {
  it("os dois módulos existem — sem eles, tudo abaixo seria vácuo", () => {
    expect(CODIGO_DA_FICHA).toMatch(/export function construirFicha/);
    expect(CODIGO_DO_VOCABULARIO).toMatch(/export function paraPaciente/);
  });

  it("nenhuma escrita: sem insert, upsert, update ou delete", () => {
    for (const [nome, codigo] of [
      ["ficha-de-explicacao", CODIGO_DA_FICHA],
      ["ficha-de-explicacao-vocabulario", CODIGO_DO_VOCABULARIO],
    ] as const) {
      expect(
        /\.(insert|upsert|update|delete)\s*\(/.test(codigo),
        `${nome} passou a escrever — a Ficha viraria fato persistido.`,
      ).toBe(false);
    }
  });

  it("nem banco, nem React, nem relógio: a Ficha é pura", () => {
    const imports = CODIGO_DA_FICHA.match(/^import[\s\S]*?;$/gm)?.join("\n") ?? "";
    expect(imports).not.toMatch(/@supabase|supabase-js|react|next\//i);
    // Relógio e sorteio quebrariam o determinismo que o §11.4 exige para
    // reconstruir a mesma árvore seis meses depois.
    expect(/Date\.now\(|new Date\(|Math\.random\(/.test(CODIGO_DA_FICHA)).toBe(false);
    expect(/Date\.now\(|new Date\(|Math\.random\(/.test(CODIGO_DO_VOCABULARIO)).toBe(false);
  });

  it("nenhum texto de reserva ocupa o lugar da explicação nos três vocabulários", () => {
    // A E-03 varre as frases do Motor. Os adaptadores da Ficha são superfície
    // nova, e uma frase de reserva aqui é pior do que no Motor: ela chega à
    // paciente parecendo explicação. A mutação M4 do Item 1.8 nasceu vácua
    // justamente porque nada olhava para este arquivo.
    const RESERVA =
      /não foi possível|nao foi possivel|informação indisponível|dados insuficientes|gerado pelo sistema|não disponível no momento|sem informações|tente novamente|erro ao/i;
    for (const [nome, codigo] of [
      ["ficha-de-explicacao", CODIGO_DA_FICHA],
      ["ficha-de-explicacao-vocabulario", CODIGO_DO_VOCABULARIO],
    ] as const) {
      const achado = codigo.match(RESERVA);
      expect(achado?.[0], `${nome} ganhou texto genérico de reserva`).toBeUndefined();
    }
  });

  it("nenhum cache nem snapshot da explicação", () => {
    for (const proibido of [/\bcache\b/i, /\bsnapshot\b/i, /localStorage/, /sessionStorage/]) {
      expect(proibido.test(CODIGO_DA_FICHA), `a Ficha ganhou ${proibido}`).toBe(false);
    }
  });

  it("o pacote não criou migration nem tabela", () => {
    const novas = MIGRATIONS_18.filter((arquivo) =>
      /ficha|explicacao|explanation/i.test(path18.basename(arquivo)),
    );
    expect(novas, "o Item 1.8 criou migration — a Ficha é derivada").toEqual([]);
    // O que se procura é uma tabela cujo NOME guarde explicação. Varrer
    // `create table[^;]*explicacao` pegava a palavra em qualquer coluna ou
    // comentário de qualquer migration — prosa, não estrutura.
    const comTabelaDeFicha = MIGRATIONS_18.filter((arquivo) =>
      /create table\s+(if not exists\s+)?[a-z_.]*(ficha|explicacao|explanation)/i.test(
        semComentario(lerArquivo(arquivo, "utf8")),
      ),
    ).map((a) => path18.basename(a));
    expect(comTabelaDeFicha, "nasceu tabela para guardar explicação").toEqual([]);
  });
});

describe("E-06 · AC-PIPELINE — ninguém explica por fora do leitor oficial", () => {
  it("nenhuma superfície reconstrói a explicação por conta própria", () => {
    const INTERFACE = FONTES_18.filter(
      (arquivo) =>
        arquivo.includes(`${path18.sep}app${path18.sep}`) ||
        arquivo.includes(`${path18.sep}components${path18.sep}`),
    );
    expect(
      ocorrencias18(INTERFACE, /derivation_(proposals|rules|rule_degree_map|concept_vigencia)/),
      "uma superfície foi ler a Camada de Derivação direto, sem passar pela Ficha.",
    ).toEqual([]);
    expect(
      ocorrencias18(INTERFACE, /crossPriorityAndProfessional|celulaDoMotor|crossOne/),
      "uma superfície cruzou o Motor por conta própria em vez de consumir a Ficha.",
    ).toEqual([]);
  });

  it("a Ficha é a única a montar as seis respostas", () => {
    // Se um segundo lugar montar `porQueFoiEscolhida`, existem duas explicações
    // possíveis para o mesmo fato — e nenhuma delas é a oficial.
    const montadores = ocorrencias18(FONTES_18, /porQueFoiEscolhida\s*:/).filter(
      (arquivo) => !arquivo.includes("ficha-de-explicacao"),
    );
    expect(montadores, "nasceu um segundo montador das seis respostas").toEqual([]);
  });

  it("o adaptador da paciente não conhece regra, versão nem proposta", () => {
    const trecho =
      CODIGO_DO_VOCABULARIO.split("export function paraPaciente")[1]?.split(
        "const LACUNA_PARA_PACIENTE",
      )[0] ?? "";
    expect(trecho.length, "o adaptador da paciente não foi encontrado").toBeGreaterThan(100);
    for (const tecnico of ["ruleId", "ruleVersion", "propostaId", "estadoDaRegra", "resultado"]) {
      expect(trecho, `o texto da paciente passou a citar ${tecnico}`).not.toContain(tecnico);
    }
  });
});

describe("E-07 · A confiança é qualitativa, e não vira ordem", () => {
  it("os três estados são fechados, e nenhum é número", () => {
    expect(CODIGO_DA_FICHA).toMatch(
      /GRAUS_DE_CONFIANCA[\s\S]{0,140}"LEITURA_COMPLETA"[\s\S]{0,80}"LEITURA_COM_LACUNAS"[\s\S]{0,80}"LEITURA_INSUFICIENTE"/,
    );
  });

  it("a confiança nunca é usada para ordenar, agrupar ou comparar", () => {
    for (const codigo of [CODIGO_DA_FICHA, CODIGO_DO_VOCABULARIO]) {
      expect(
        /\.sort\([^)]*(grauDeConfianca|confianca)/i.test(codigo),
        "a confiança virou chave de ordenação — a proibição 3 do §11.3.",
      ).toBe(false);
    }
    expect(
      /(grauDeConfianca|confianca)[\s\S]{0,40}(>|<|>=|<=)[\s\S]{0,40}(grauDeConfianca|confianca)/i.test(
        CODIGO_DA_FICHA,
      ),
      "a confiança passou a ser comparada entre si — comparativo é a proibição 2.",
    ).toBe(false);
  });

  it("nenhum score, percentual ou contagem nasce dentro da Ficha", () => {
    for (const proibido of [/\bscore\b/i, /percentual/i, /\bpontuacao\b/i, /\bpontuação\b/i]) {
      expect(proibido.test(CODIGO_DA_FICHA), `a Ficha ganhou ${proibido}`).toBe(false);
      expect(proibido.test(CODIGO_DO_VOCABULARIO), `o vocabulário ganhou ${proibido}`).toBe(false);
    }
  });
});

// ===========================================================================
// R1 · A2 — E-08: UMA ÚNICA MODELAGEM DE PROVENIÊNCIA
//
// Princípio (CONTRATO_1_8_R1 §9): `CadeiaDeProveniencia` é o único modelo
// autoritativo. O `c3242ea` provou como o segundo nasce: um tipo "inofensivo"
// (`OrigemDoConceito`) copiando regra/versão/proposta para uso local — e dois
// modelos para o mesmo fato divergem em silêncio.
// ===========================================================================

describe("E-08 · CadeiaDeProveniencia é o único modelo de proveniência", () => {
  const MODULO_CANONICO = "cadeia-de-proveniencia.ts";

  /**
   * Detecção PURA sobre `(caminho, conteúdo)` — falseável com entrada
   * sintética (§18.5).
   *
   * O que caracteriza um modelo concorrente não é citar um campo — é um TIPO
   * declarado fora do módulo canônico que COMBINA a identidade da regra
   * (rule id/versão) com outro elo de proveniência (proposta, evidência,
   * origem). Projeção legítima não faz isso: ela referencia a cadeia, não
   * recopia os fatos dela.
   */
  function modelosConcorrentes(
    arquivos: readonly { caminho: string; conteudo: string }[],
  ): string[] {
    const encontrados: string[] = [];
    for (const { caminho, conteudo } of arquivos) {
      const normalizado = caminho.split("\\").join("/");
      if (normalizado.endsWith(MODULO_CANONICO)) continue;

      const declaracoes = semComentario(conteudo).matchAll(
        /(?:type|interface)\s+(\w+)[^={]*=?\s*\{([\s\S]*?)\n\}/g,
      );
      for (const [, nome, corpo] of declaracoes) {
        const temRegra = /ruleId|ruleVersion|rule_id|rule_version/.test(corpo!);
        const temOutroElo =
          /propostaId|proposalId|evidenceId|evidence_id|originRecord|origin_record/.test(corpo!);
        if (temRegra && temOutroElo) encontrados.push(`${normalizado} → ${nome}`);
      }
    }
    return encontrados;
  }

  const FONTES_A2 = FONTES_18.map((arquivo) => ({
    caminho: path18.relative(RAIZ_18, arquivo),
    conteudo: lerArquivo(arquivo, "utf8"),
  }));

  it("nenhum tipo fora do módulo canônico combina regra com outro elo", () => {
    expect(
      modelosConcorrentes(FONTES_A2),
      "nasceu um segundo modelo de proveniência — o defeito que a A2 eliminou.",
    ).toEqual([]);
  });

  it("o falseamento: `OutraProveniencia` sintética derruba a guarda", () => {
    const sintetico = [
      ...FONTES_A2,
      {
        caminho: "src/modules/curadoria/outra-proveniencia.ts",
        conteudo: `export type OutraProveniencia = {
  ruleId: string;
  ruleVersion: number;
  proposalId: string;
  evidenceId: string;
}`,
      },
    ];
    expect(modelosConcorrentes(sintetico)).toEqual([
      "src/modules/curadoria/outra-proveniencia.ts → OutraProveniencia",
    ]);
  });

  it("projeção legítima NÃO cai: tipo que referencia a cadeia não é modelo", () => {
    const projecao = modelosConcorrentes([
      {
        caminho: "src/modules/curadoria/uma-projecao.ts",
        conteudo: `export type FichaProjection = {
  titulo: string;
  cadeia: CadeiaDeProveniencia;
  frases: string[];
}`,
      },
    ]);
    expect(projecao, "a guarda ficou ampla demais e proíbe projeção legítima").toEqual([]);
  });

  it("a Ficha consome a cadeia — e não possui campos de proveniência próprios", () => {
    // Só o CÓDIGO: o cabeçalho da Ficha NOMEIA o modelo eliminado ao explicar
    // a mudança, e guarda que cai sobre a frase que registra o cumprimento não
    // protege nada — a mesma lição da C-05 e do 2.2C-R1.
    const ficha = semComentario(lerArquivo(FICHA, "utf8"));
    expect(ficha, "a Ficha parou de consumir a cadeia canônica").toMatch(
      /CadeiaDeProveniencia/,
    );
    expect(
      /OrigemDoConceito|ProvenienciaDoConceito/.test(ficha),
      "o modelo paralelo do c3242ea voltou.",
    ).toBe(false);
  });
});

// ===========================================================================
// R1 · A3 — E-09: O BLOQUEIO É POR AFIRMAÇÃO, E NINGUÉM O CONTORNA
//
// Princípio (CONTRATO_1_8_R1 §12/§13, missão A3 §20/§21): a supressão é
// nomeada, o discriminador técnico morre antes da paciente, e nenhuma
// superfície consome a Ficha antes do regime autorizar.
// ===========================================================================

describe("E-09 · supressão nomeada, paciente sem discriminador, superfície sem atalho", () => {
  it("os adaptadores suprimem COM NOME — as linhas de supressão existem", () => {
    // Falseável: a mutação que remove a supressão (afirmação bloqueada
    // simplesmente sumindo) derruba esta guarda antes de qualquer teste de
    // comportamento — silêncio é o defeito que o AC-EXPLICA proíbe.
    expect(CODIGO_DO_VOCABULARIO).toMatch(/AFIRMACAO_SUPRIMIDA_MESA/);
    expect(CODIGO_DO_VOCABULARIO).toMatch(/AFIRMACAO_SUPRIMIDA_RELATORIO/);
    expect(CODIGO_DO_VOCABULARIO).toMatch(/exibivel/);
  });

  it("o adaptador da paciente não conhece bloqueio técnico: nem motivo, nem contradição", () => {
    const trecho =
      CODIGO_DO_VOCABULARIO.split("export function paraPaciente")[1] ?? "";
    expect(trecho.length, "o adaptador da paciente não foi encontrado").toBeGreaterThan(100);
    for (const tecnico of [
      "contradicao",
      "PROVENIENCIA_INCONSISTENTE",
      "SEM_EVIDENCIA_VINCULADA",
      "bloqueios",
      "PROPOSTA_DE_OUTRA_VERSAO",
    ]) {
      expect(trecho, `o texto da paciente passou a citar ${tecnico}`).not.toContain(tecnico);
    }
  });

  it("nenhuma superfície importa a Ficha — o regime de transição continua fechado", () => {
    // CONTRATO §13 (regime de transição): AC-EXPLICA integral é requisito
    // ANTERIOR ao primeiro consumidor. Enquanto o R1 não fechar e a Fronteira
    // não abrir, componente/route/action nenhum consome a Ficha.
    const INTERFACE = FONTES_18.filter(
      (arquivo) =>
        arquivo.includes(`${path18.sep}app${path18.sep}`) ||
        arquivo.includes(`${path18.sep}components${path18.sep}`),
    );
    expect(
      ocorrencias18(INTERFACE, /ficha-de-explicacao/),
      "uma superfície ligou a Ficha antes do regime autorizar.",
    ).toEqual([]);
  });

  it("a Ficha não decide a partir do bloqueio: nenhum sort/filter de profissionais por status", () => {
    for (const codigo of [CODIGO_DA_FICHA, CODIGO_DO_VOCABULARIO]) {
      expect(
        /\.sort\([^)]*(exibivel|bloqueio|integral)/i.test(codigo),
        "o status de afirmação virou chave de ordenação — explicar não é decidir.",
      ).toBe(false);
    }
  });
});
