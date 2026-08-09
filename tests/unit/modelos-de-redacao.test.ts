import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CONCEITOS_COM_BIBLIOTECA,
  LIMITE_DE_CARACTERES,
  MODELOS_DE_REDACAO,
  NATUREZA_DO_CONCEITO,
  SITUACOES,
  TITULO_DA_SITUACAO,
  conceitoTemBiblioteca,
  modelosDoConceito,
  type ConceitoElegivel,
} from "@/modules/curadoria/modelos-de-redacao";

/**
 * A BIBLIOTECA DETERMINÍSTICA DE REDAÇÃO
 * (CONTRATO_BIBLIOTECA_DE_REDACAO §13, casos 1–20).
 *
 * O que se prova aqui: os 24 textos existem, cabem em 280, respeitam o
 * território da sua natureza, preservam P-04 e carregam as quatro ressalvas
 * nomeadas. E, sobretudo, que o caminho generativo SUMIU — não há provider,
 * não há rede, não há action, não há dependência de Case ou profissional.
 *
 * Três testes do pacote anterior deixaram de existir porque o que eles
 * protegiam virou impossibilidade estrutural: injeção, timeout e validação
 * de saída de modelo não têm mais objeto.
 */

const TODOS = Object.entries(MODELOS_DE_REDACAO) as [ConceitoElegivel, typeof MODELOS_DE_REDACAO[ConceitoElegivel]][];
const TODOS_OS_TEXTOS = TODOS.flatMap(([conceito, modelos]) =>
  modelos.map((modelo) => ({ conceito, ...modelo })),
);

describe("§2/§3 · o universo fechado", () => {
  it("1 · os seis conceitos têm biblioteca", () => {
    expect(CONCEITOS_COM_BIBLIOTECA.sort()).toEqual(
      [
        "EXPERIENCIA",
        "FORMACAO",
        "HISTORICO",
        "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
        "MODELO_DECISAO_COMPARTILHADA",
        "MODELO_PREFERENCIAS_E_RESTRICOES",
      ].sort(),
    );
  });

  it("2 · `AREA` não é membro do tipo — e não tem biblioteca", () => {
    // @ts-expect-error — `AREA` não é `ConceitoElegivel`: a ausência é erro de
    // compilação, não teste esquecido. Se alguém a acrescentar ao tipo, este
    // `@ts-expect-error` passa a ser inútil e o TypeScript acusa.
    const proibido: ConceitoElegivel = "AREA";
    expect(proibido).toBe("AREA");
    expect(conceitoTemBiblioteca("AREA")).toBe(false);
    expect(modelosDoConceito("AREA")).toEqual([]);
  });

  it("3 · quatro situações por conceito, 24 no total, sem id repetido", () => {
    for (const [conceito, modelos] of TODOS) {
      expect(modelos, conceito).toHaveLength(4);
      expect(modelos.map((m) => m.situacao).sort()).toEqual([...SITUACOES].sort());
    }
    expect(TODOS_OS_TEXTOS).toHaveLength(24);
    expect(new Set(TODOS_OS_TEXTOS.map((m) => m.id)).size).toBe(24);
  });

  it("as quatro situações têm título de interface", () => {
    for (const situacao of SITUACOES) {
      expect(TITULO_DA_SITUACAO[situacao]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("§3 · o limite de 280 é guarda, não truncamento", () => {
  it("4 · todos os 24 textos cabem em 280 caracteres", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      expect(
        modelo.texto.length,
        `${modelo.id} tem ${modelo.texto.length} caracteres`,
      ).toBeLessThanOrEqual(LIMITE_DE_CARACTERES);
    }
  });

  it("nenhum texto é vazio, e nenhum vem com espaço nas pontas", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      expect(modelo.texto.trim().length, modelo.id).toBeGreaterThan(0);
      expect(modelo.texto, modelo.id).toBe(modelo.texto.trim());
    }
  });

  it("o limite bate com o do campo real da conclusão", () => {
    const painel = readFileSync("src/components/curadoria/mesa/painel-de-juizo.tsx", "utf8");
    expect(painel).toContain("maxLength={280}");
    expect(LIMITE_DE_CARACTERES).toBe(280);
  });
});

describe("§4 · regra de natureza — território conferido texto a texto", () => {
  /**
   * O léxico RELACIONAL é escrito por SIGNIFICADO, não por token solto.
   * `historico-ressalva` diz "registra vínculos e instituições" — vínculo
   * INSTITUCIONAL, onde a trajetória ocorreu, que é justamente a guarda
   * daquele conceito. Um padrão ingênuo por `\bvinculo\b` daria falso
   * positivo e obrigaria a afrouxar a guarda depois; o padrão por relação
   * COM A PESSOA não dá.
   */
  const LEXICO_RELACIONAL = [
    /\bescuta\b/,
    /\bacolhiment\w*\b/,
    /\bempati\w*\b/,
    /\bvinculo\s+com\s+(a|o)\s+(pessoa|paciente)\b/,
    /\brelacao\s+com\s+(a|o)\s+(pessoa|paciente)\b/,
    // B-2 (§17.2) — famílias relacionais inequívocas. O qualificador é
    // OBRIGATÓRIO: em "vínculos **e** instituições" o que segue é `e`, e em
    // "vínculo **institucional**" é termo fora da lista — nenhum casa.
    /\b(vinculos?|relacao|relacoes)\s+(terapeutic|afetiv|humaniz|de\s+confianca|de\s+cuidado|de\s+proximidade)\w*/,
    /\bdisponibilidade\s+emocional\b/,
  ];

  const LEXICO_DE_MERITO = [
    /\bmerito\b/,
    /\bqualificac\w*\b/,
    /\bcompetenci\w*\b/,
    /\btitulac\w*\b/,
    /\bcredenci\w*\b/,
    /\bformacao\b/,
    // B-2 (§17.2) — famílias de mérito comparativo.
    /\bexperient\w*\b/,
    /\b(mais|maior)\s+experienc\w*\b/,
    /\brenomad\w*\b/,
    /\bexcelenci\w*\b/,
    /\bsuperior\w*\b/,
    /\bpreparo\s+tecnic\w*\b/,
    /\bdomin\w*\s+(a\s+)?tecnic\w*\b/,
  ];

  const bloqueia = (frase: string, lexico: readonly RegExp[]) =>
    lexico.some((padrao) => padrao.test(semAcento(frase)));

  const semAcento = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

  it("19 · nenhum texto TECNICO fala de relação com a pessoa", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      if (NATUREZA_DO_CONCEITO[modelo.conceito] !== "TECNICO") continue;
      const texto = semAcento(modelo.texto);
      for (const padrao of LEXICO_RELACIONAL) {
        expect(padrao.test(texto), `${modelo.id} fala de relação: ${padrao}`).toBe(false);
      }
    }
  });

  it("20 · nenhum texto RELACIONAL fala de mérito", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      if (NATUREZA_DO_CONCEITO[modelo.conceito] !== "RELACIONAL") continue;
      const texto = semAcento(modelo.texto);
      for (const padrao of LEXICO_DE_MERITO) {
        expect(padrao.test(texto), `${modelo.id} fala de mérito: ${padrao}`).toBe(false);
      }
    }
  });

  it("as bibliotecas não compartilham texto entre naturezas — nem dentro delas", () => {
    const textos = TODOS_OS_TEXTOS.map((m) => m.texto);
    expect(new Set(textos).size).toBe(24);
  });

  // -------------------------------------------------------------------------
  // B-2 · as contraprovas do §17.2 — a guarda pega o que deve e solta o que
  // deve. Sem os dois lados, "endurecer" viraria bloquear tudo.
  // -------------------------------------------------------------------------

  it("B-2 · os 13 casos da ressalva são TODOS detectados", () => {
    const PROIBIDOS: [string, "TECNICO" | "RELACIONAL"][] = [
      ["vínculo terapêutico", "TECNICO"],
      ["vínculo afetivo", "TECNICO"],
      ["vínculo de confiança", "TECNICO"],
      ["relação de cuidado", "TECNICO"],
      ["disponibilidade emocional", "TECNICO"],
      ["mais experiente", "RELACIONAL"],
      ["maior experiência", "RELACIONAL"],
      ["renomado", "RELACIONAL"],
      ["especialista renomado", "RELACIONAL"],
      ["domina a técnica", "RELACIONAL"],
      ["preparo técnico", "RELACIONAL"],
      ["superior tecnicamente", "RELACIONAL"],
      ["excelência técnica", "RELACIONAL"],
    ];
    expect(PROIBIDOS).toHaveLength(13);
    for (const [frase, natureza] of PROIBIDOS) {
      const lexico = natureza === "TECNICO" ? LEXICO_RELACIONAL : LEXICO_DE_MERITO;
      expect(bloqueia(frase, lexico), `escapou da guarda: "${frase}"`).toBe(true);
    }
  });

  it("B-2 · os 9 usos legítimos do §9 continuam TODOS livres", () => {
    const LEGITIMOS: [string, "TECNICO" | "RELACIONAL"][] = [
      ["vínculos e instituições", "TECNICO"],
      ["vínculo institucional", "TECNICO"],
      ["vínculo com a instituição", "TECNICO"],
      ["trajetória institucional", "TECNICO"],
      ["instituição de formação", "TECNICO"],
      ["experiência descritiva", "RELACIONAL"],
      ["a experiência da pessoa na consulta", "RELACIONAL"],
      ["encaminha a um especialista", "RELACIONAL"],
      ["conduta declarada", "RELACIONAL"],
    ];
    expect(LEGITIMOS).toHaveLength(9);
    for (const [frase, natureza] of LEGITIMOS) {
      const lexico = natureza === "TECNICO" ? LEXICO_RELACIONAL : LEXICO_DE_MERITO;
      expect(bloqueia(frase, lexico), `bloqueado indevidamente: "${frase}"`).toBe(false);
    }
  });

  it("B-2 · `experiente` é bloqueado; `experiência` permanece livre", () => {
    // Depois de `experien` vem `t` no adjetivo de mérito e `c` no substantivo
    // descritivo — é essa letra que separa o juízo da descrição.
    expect(bloqueia("profissional experiente", LEXICO_DE_MERITO)).toBe(true);
    expect(bloqueia("mais experiente", LEXICO_DE_MERITO)).toBe(true);
    expect(bloqueia("maior experiência", LEXICO_DE_MERITO)).toBe(true);

    expect(bloqueia("a experiência da pessoa na consulta", LEXICO_DE_MERITO)).toBe(false);
    expect(bloqueia("a experiência relatada", LEXICO_DE_MERITO)).toBe(false);
  });

  it("B-2 · `especialista` sozinho continua livre — só o juízo de mérito cai", () => {
    expect(bloqueia("encaminha a um especialista", LEXICO_DE_MERITO)).toBe(false);
    expect(bloqueia("conversa com o especialista que acompanha", LEXICO_DE_MERITO)).toBe(false);
    expect(bloqueia("especialista renomado", LEXICO_DE_MERITO)).toBe(true);
  });

  it("B-2 · `vínculo` só cai com qualificador relacional — o institucional passa", () => {
    // A guarda vigente já era precisa aqui; o endurecimento não podia
    // reintroduzir o falso positivo que o §7 mandou preservar.
    expect(bloqueia("O histórico registra vínculos e instituições.", LEXICO_RELACIONAL)).toBe(false);
    expect(bloqueia("vínculo institucional", LEXICO_RELACIONAL)).toBe(false);
    expect(bloqueia("vínculo terapêutico", LEXICO_RELACIONAL)).toBe(true);
    expect(bloqueia("relação de cuidado", LEXICO_RELACIONAL)).toBe(true);
  });

  it("B-2 · o texto real do Histórico que motivou a precisão continua verde", () => {
    const ressalva = MODELOS_DE_REDACAO.HISTORICO.find((m) => m.situacao === "COM_RESSALVA")!;
    expect(ressalva.texto).toContain("vínculos e instituições");
    expect(bloqueia(ressalva.texto, LEXICO_RELACIONAL)).toBe(false);
  });

  it("B-2 · a guarda é proteção contra REGRESSÃO EDITORIAL — e prova isso", () => {
    // Falseabilidade: um texto técnico editado para falar de vínculo
    // terapêutico DEVE cair. Se este teste passasse com a guarda anterior,
    // o endurecimento não teria efeito nenhum.
    const editadoIndevidamente =
      "A formação está documentada e sustenta um vínculo terapêutico sólido com a pessoa.";
    expect(bloqueia(editadoIndevidamente, LEXICO_RELACIONAL)).toBe(true);

    const relacionalEditadoIndevidamente =
      "As condutas declaradas mostram excelência técnica e preparo técnico.";
    expect(bloqueia(relacionalEditadoIndevidamente, LEXICO_DE_MERITO)).toBe(true);
  });

  it("nenhum texto usa vocabulário comparativo de mérito", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      const texto = semAcento(modelo.texto);
      for (const padrao of [
        /\bmelhor\b/,
        /\bpior\b/,
        /\bideal\b/,
        /\brecomend\w*\b/,
        /\bindicad[oa]\b/,
        /\bsuperior\b/,
        /\bscore\b/,
        /\brank\w*\b/,
        /\d+\s*%/,
      ]) {
        expect(padrao.test(texto), `${modelo.id} compara: ${padrao}`).toBe(false);
      }
    }
  });
});

describe("§5 · P-04 — lacuna nunca vira negativo", () => {
  it("21 · os seis têm alternativa de insuficiência", () => {
    for (const [conceito, modelos] of TODOS) {
      const insuficiencia = modelos.filter((m) => m.situacao === "INFORMACAO_INSUFICIENTE");
      expect(insuficiencia, conceito).toHaveLength(1);
    }
  });

  it("21(bis) · cada insuficiência diz explicitamente que a falta não afirma ausência", () => {
    const NEGACAO_DA_INFERENCIA = [
      /não afirma/i,
      /não é trajetória inexistente/i,
    ];
    for (const [conceito, modelos] of TODOS) {
      const texto = modelos.find((m) => m.situacao === "INFORMACAO_INSUFICIENTE")!.texto;
      expect(
        NEGACAO_DA_INFERENCIA.some((padrao) => padrao.test(texto)),
        `${conceito}: a insuficiência não desfaz a inferência — "${texto}"`,
      ).toBe(true);
    }
  });

  it("nenhum dos 24 afirma que o profissional NÃO possui algo", () => {
    for (const modelo of TODOS_OS_TEXTOS) {
      for (const padrao of [/\bnão possui\b/i, /\bnão tem\b/i, /\bcarece de\b/i]) {
        expect(padrao.test(modelo.texto), `${modelo.id}: afirma ausência`).toBe(false);
      }
    }
  });
});

describe("§3.7 · as quatro ressalvas carregam a guarda do seu conceito", () => {
  const ressalvaDe = (conceito: ConceitoElegivel) =>
    MODELOS_DE_REDACAO[conceito].find((m) => m.situacao === "COM_RESSALVA")!.texto;

  it("22 · experiência: não reduz a tempo de prática", () => {
    expect(MODELOS_DE_REDACAO.EXPERIENCIA.map((m) => m.texto).join(" ")).toContain(
      "não pelo tempo de prática",
    );
  });

  it("22 · histórico: não converte nome institucional em mérito", () => {
    expect(ressalvaDe("HISTORICO")).toContain("não pelo nome das instituições");
  });

  it("22 · preferências: intenção de conduta não é garantia", () => {
    expect(ressalvaDe("MODELO_PREFERENCIAS_E_RESTRICOES")).toContain(
      "intenção de conduta, não garantia",
    );
  });

  it("22 · notícias difíceis: conduta não é disposição pessoal", () => {
    expect(ressalvaDe("MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS")).toContain(
      "descreve conduta, não disposição pessoal",
    );
  });

  it("as ressalvas não são intercambiáveis — cada guarda mora no seu conceito", () => {
    const historico = ressalvaDe("HISTORICO");
    expect(historico.includes("tempo de prática")).toBe(false);
    expect(ressalvaDe("MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS").includes("instituições")).toBe(false);
  });
});

describe("§9/§12 · o caminho generativo não existe mais", () => {
  const biblioteca = readFileSync("src/modules/curadoria/modelos-de-redacao.ts", "utf8");
  const painel = readFileSync("src/components/curadoria/mesa/painel-de-juizo.tsx", "utf8");
  const pagina = readFileSync(
    "src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx",
    "utf8",
  );

  it("14 · zero provider: a biblioteca e o painel não importam o modelo de linguagem", () => {
    for (const arquivo of [biblioteca, painel]) {
      expect(arquivo.includes("language-model")).toBe(false);
      expect(arquivo.includes("concierge")).toBe(false);
      expect(arquivo.toLowerCase().includes("anthropic")).toBe(false);
      expect(arquivo.toLowerCase().includes("claude")).toBe(false);
    }
  });

  it("15 · zero rede: nenhum fetch, RPC, action de geração ou chamada assíncrona", () => {
    for (const proibido of ["fetch(", ".rpc(", "await ", "async ", "http", "XMLHttpRequest"]) {
      expect(biblioteca.includes(proibido), `a biblioteca faz rede: ${proibido}`).toBe(false);
    }
    // A biblioteca é dado puro: nem sequer exporta função assíncrona.
    expect(biblioteca.includes("Promise")).toBe(false);
  });

  it("16 · zero server action de geração — os arquivos foram removidos", () => {
    for (const arquivo of [painel, pagina]) {
      expect(arquivo.includes("assistencia-de-redacao")).toBe(false);
      expect(arquivo.includes("sugerirRedacaoAction")).toBe(false);
      expect(arquivo.includes("assistenciaDisponivel")).toBe(false);
    }
  });

  it("17/18 · zero dependência de Case, profissional, evidência ou paciente", () => {
    // O MECANISMO, nunca o comentário: um texto que NEGA a dependência
    // contém legitimamente as palavras; o código, jamais.
    const codigo = biblioteca
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((linha) => !/^\s*(\/\/|\*)/.test(linha))
      .join("\n");
    for (const proibido of [
      "caseId",
      "professionalProfileId",
      "evidencia",
      "paciente",
      "supabase",
      "process.env",
    ]) {
      expect(codigo.includes(proibido), `a biblioteca depende de: ${proibido}`).toBe(false);
    }
    // Falseabilidade: a varredura enxerga o código de verdade.
    expect(codigo).toContain("export function modelosDoConceito(code: string)");
  });

  it("a feature flag desapareceu da superfície", () => {
    for (const arquivo of [biblioteca, painel, pagina]) {
      expect(arquivo.includes("ASSISTENCIA_DE_REDACAO_IA")).toBe(false);
    }
  });

  it("estados de geração sumiram: sem loading, sem timeout, sem limite de gerações", () => {
    for (const proibido of [
      "gerando",
      "Gerar outras",
      "timeout",
      "MAXIMO_DE_GERACOES",
      "SAIDA_RECUSADA",
      "ERRO_TECNICO_DA_SUGESTAO",
    ]) {
      expect(painel.includes(proibido), `estado generativo sobreviveu: ${proibido}`).toBe(false);
    }
  });

  it("a porta do Concierge voltou a exigir protocolo — sem generalidade morta", () => {
    const porta = readFileSync("src/modules/concierge/language-model.ts", "utf8");
    expect(porta).toContain("protocolId: ProtocolId;");
    expect(porta).toContain("protocolVersion: string;");
    expect(porta.includes("usageId")).toBe(false);
    expect(porta.includes("timeoutMs")).toBe(false);
  });
});

describe("§11/§10 · persistência e Método", () => {
  const biblioteca = readFileSync("src/modules/curadoria/modelos-de-redacao.ts", "utf8");
  const painel = readFileSync("src/components/curadoria/mesa/painel-de-juizo.tsx", "utf8");

  it("23 · zero template persistido: nenhum id de modelo viaja para o ato", () => {
    // O recorte ancora no `return (` QUE VEM DEPOIS do registrar — buscar o
    // primeiro do arquivo tornava a guarda vacuosa assim que qualquer
    // componente nascesse acima dele (foi o que aconteceu com a marca de
    // estado do E-2: o recorte virou string vazia e a guarda passou a não
    // olhar nada).
    const inicio = painel.indexOf("const registrar = ()");
    expect(inicio).toBeGreaterThan(0);
    const registro = painel.slice(inicio, painel.indexOf("return (", inicio));
    expect(registro).toContain("registrarJulgamentoAction");
    for (const proibido of ["modelo", "template", "situacao", "biblioteca"]) {
      expect(registro.includes(proibido), `o ato carrega: ${proibido}`).toBe(false);
    }
    expect(registro).toContain("conclusao,");
  });

  it("24 · autoria intacta: nenhuma action aceita ator, nenhum campo novo no juízo", () => {
    for (const proibido of ["ai_assisted", "template_id", "modeloId", "actorId"]) {
      expect(painel.includes(proibido), `campo novo: ${proibido}`).toBe(false);
    }
  });

  it("25 · delta zero de Método: a biblioteca não toca Motor, regra, proposta ou R-1", () => {
    for (const arquivo of [biblioteca, painel]) {
      for (const proibido of [
        "derivation_",
        "emitir_proposta",
        "decidir_proposta",
        "CONTINUIDADE_COORDENACAO",
        "degree_map",
        "curator_judgments",
      ]) {
        expect(arquivo.includes(proibido), `tocou o Método: ${proibido}`).toBe(false);
      }
    }
  });

  it("G-2.3-5 preservada: o campo nasce vazio e nada o preenche sozinho", () => {
    expect(painel).toContain('const [conclusao, setConclusao] = useState("")');
    expect(painel.includes("defaultValue")).toBe(false);
    expect(painel.includes("useEffect")).toBe(false);
    for (const proibido of [
      "setConclusao(conceito",
      "setConclusao(vigente",
      "useState(conceito",
      "value={conceito.vigente",
    ]) {
      expect(painel.includes(proibido), `a superfície pré-preenche: ${proibido}`).toBe(false);
    }
    // O único caminho do texto para o campo é o ato explícito do Curador.
    expect(painel).toContain("const usarModelo");
  });

  it("a copy da interface não nomeia IA, fornecedor nem mérito", () => {
    // Duas precisões de propósito: (a) limite de palavra, porque `EVIDENCIA`
    // contém "IA" e não é copy de IA; (b) só o código, porque o comentário
    // que DOCUMENTA a G-2.3-5 cita legitimamente a palavra que a guarda
    // proíbe na tela.
    const copy = painel
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((linha) => !/^\s*(\/\/|\*)/.test(linha))
      .join("\n");
    for (const proibido of [
      /\bIA\b/,
      /intelig[êe]ncia artificial/i,
      /\bSugerir\b/,
      /\bsugest[ãa]o\b/i,
      /melhor texto/i,
      /\brecomendad[oa]\b/i,
      /assist[êe]ncia inteligente/i,
    ]) {
      expect(proibido.test(copy), `copy proibida: ${proibido}`).toBe(false);
    }
    expect(painel).toContain("Modelos de redação");
    expect(painel).toContain("nenhum é uma conclusão");
    expect(painel).toContain("Usar este texto");
  });
});
