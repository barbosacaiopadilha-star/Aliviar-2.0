import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * O VOCABULÁRIO DAS PEÇAS DE PAPEL — guarda do `SIM-63`.
 *
 * Duas vezes em vinte e quatro horas um termo foi aposentado por decisão e
 * sobreviveu no documento que alguém iria imprimir: a "Ficha da Paciente"
 * (ADR-097, achada em 28/08 pela manhã) e o "Roteiro de Atendimento"
 * (ADR-100, achado na mesma noite, já publicado no Kit da Curadoria).
 *
 * A causa é estrutural, e é a mesma das duas vezes: **decisão que troca uma
 * palavra não chega sozinha aos documentos**, e são muitos — dez guias e seis
 * peças de rede, em duas pastas de naturezas diferentes:
 *
 * - `docs/guias/` são guias de leitura; o PDF deles é ignorado pelo Git.
 * - `docs/rede/` são as peças de papel da operação: PDF versionado, publicado
 *   em `public/rede/` e oferecido no Kit em `/admin`.
 *
 * Editar um não edita o outro. Este teste é o que acusa quando isso acontece.
 *
 * **A regra, e o porquê da forma dela:** um termo aposentado só pode aparecer
 * na linha que também cita a ADR que o aposentou. Não é burocracia — é o que
 * separa uma **menção histórica deliberada** (*"até aqui este guia dizia X
 * (ADR-100)"*, que tem valor e deve continuar existindo) de uma **sobra**, que
 * é alguém lendo instrução velha na hora de operar.
 *
 * É teste de fonte, como o `sistema-visual-consolidado`: o que se protege é
 * vocabulário, e vocabulário volta por decisão local razoável — "só nesta
 * frase", "aqui é histórico" — que ninguém percebe uma a uma.
 */

const RAIZ = path.resolve(__dirname, "../..");
const PASTAS = ["docs/guias", "docs/rede"];

/**
 * O CÓDIGO TAMBÉM CARREGA VOCABULÁRIO — extensão de 01/09 (`SIM-84`).
 *
 * A guarda nasceu varrendo só `docs/`, e a travessia mostrou o buraco: três
 * mensagens em `src/` ainda diziam **"Atendente"**, papel que a ADR-100
 * extinguiu. Nenhuma delas chegava à tela — eram razões internas —, mas
 * **nada impedia a próxima de ser um rótulo de botão.**
 *
 * **A regra é a mesma, e o passe também:** termo aposentado só sobrevive na
 * linha que cita a ADR que o aposentou. O que muda é o alcance.
 *
 * **O que NÃO se varre, e a fronteira é deliberada:**
 *
 * - **Comentários.** `* Superfície do Atendente — Nível 1` é contexto
 *   histórico dentro do código, e exigir citação de ADR em cada um seria
 *   ruído. Comentário errado constrange; **rótulo errado desinforma quem opera.**
 * - **Identificadores.** `listLeadsForAtendente`, a role `atendente` no banco.
 *   Renomear coluna, enum e função é migration com risco próprio, e o texto que
 *   a pessoa lê já diz Supervisor. **A fronteira é a tela, não o nome.**
 */
const PASTAS_DE_CODIGO = ["src"];

/**
 * Quais linhas do arquivo são comentário — rastreado, não adivinhado.
 *
 * Prefixo não basta: a **continuação** de um bloco não começa com `*` em JSX,
 * e `{/*` do JSX não casa com `/*`. Percorrer o arquivo mantendo o estado
 * "dentro de bloco" é o que acerta os dois. Custou uma volta: a primeira versão
 * deixava passar um comentário JSX no `portal-shell`.
 */
function linhasDeComentario(fonte: string): boolean[] {
  let dentro = false;
  return fonte.split("\n").map((linha) => {
    const eraDentro = dentro;
    const abre = linha.lastIndexOf("/*");
    const fecha = linha.lastIndexOf("*/");
    if (!dentro && abre >= 0 && fecha < abre) dentro = true;
    else if (dentro && fecha > (abre < 0 ? -1 : abre)) dentro = false;
    const soLinha = linha.trimStart().startsWith("//");
    return eraDentro || dentro || soLinha || (abre >= 0 && fecha > abre);
  });
}

/** `listLeadsForAtendente` é nome, não frase: letra colada antes do termo. */
function ehIdentificador(linha: string, termo: string): boolean {
  const i = linha.indexOf(termo);
  if (i <= 0) return false;
  return /[A-Za-z0-9_]/.test(linha[i - 1]);
}

function arquivosDeCodigo(pasta: string): string[] {
  const base = path.join(RAIZ, pasta);
  const achados: string[] = [];
  const andar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const alvo = path.join(dir, nome);
      if (statSync(alvo).isDirectory()) andar(alvo);
      else if (/\.tsx?$/.test(alvo)) achados.push(alvo);
    }
  };
  andar(base);
  return achados;
}

/**
 * Termo aposentado → a decisão que o aposentou. A ADR é o passe: citá-la na
 * mesma linha autoriza a menção, porque prova que quem escreveu sabia.
 */
const APOSENTADOS: ReadonlyArray<{ termo: string; adr: string; virou: string }> = [
  { termo: "Ficha da Paciente", adr: "ADR-097", virou: "Ficha do Assistido" },
  { termo: "Guia do Atendente", adr: "ADR-100", virou: "Guia do Supervisor" },
  { termo: "Roteiro de Atendimento", adr: "ADR-100", virou: "Roteiro do Supervisor" },
  { termo: "Guia do Concierge", adr: "ADR-106", virou: "Guia do Acompanhamento" },
  { termo: "Roteiro do Concierge", adr: "ADR-106", virou: "Roteiro do Acompanhamento" },
  // "Atendente" solto vem por último: é o mais amplo, e por isso o mais
  // propenso a voltar sem que ninguém repare.
  { termo: "Atendente", adr: "ADR-100", virou: "Supervisor" },
  // 28/08 · O PREÇO ENTRA NA MESMA GUARDA, e é o item mais caro da lista: um
  // termo velho num guia constrange, um PREÇO velho num roteiro que alguém lê
  // em voz alta vira compromisso. O R$ 450 vivia em quatro lugares, incluindo
  // a página pública `/o-que-e` — e três deles ninguém teria conferido.
  { termo: "R$ 450", adr: "ADR-107", virou: "R$ 500" },
];

function arquivosHtml(pasta: string): string[] {
  const base = path.join(RAIZ, pasta);
  const achados: string[] = [];
  const andar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const alvo = path.join(dir, nome);
      if (statSync(alvo).isDirectory()) andar(alvo);
      else if (alvo.endsWith(".html")) achados.push(alvo);
    }
  };
  andar(base);
  return achados;
}

describe("Vocabulário das peças de papel — SIM-63", () => {
  it("nenhum termo aposentado sobrevive sem citar a ADR que o aposentou", () => {
    const sobras: string[] = [];

    for (const pasta of PASTAS) {
      for (const arquivo of arquivosHtml(pasta)) {
        const linhas = readFileSync(arquivo, "utf-8").split("\n");
        const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");

        linhas.forEach((linha, i) => {
          for (const { termo, adr, virou } of APOSENTADOS) {
            if (!linha.includes(termo)) continue;
            // A ADR na mesma linha é o passe da menção histórica deliberada.
            if (linha.includes(adr)) return;
            sobras.push(
              `${relativo}:${i + 1} — "${termo}" (${adr} trocou por "${virou}"). ` +
                `Se a menção for histórica de propósito, cite a ${adr} na mesma linha.`,
            );
            return;
          }
        });
      }
    }

    expect(sobras, `\n${sobras.join("\n")}\n`).toEqual([]);
  });

  it("nenhum termo aposentado sobrevive no código das telas (SIM-84)", () => {
    const sobras: string[] = [];
    for (const pasta of PASTAS_DE_CODIGO) {
      for (const arquivo of arquivosDeCodigo(pasta)) {
        const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");
        const fonte = readFileSync(arquivo, "utf-8");
        const comentario = linhasDeComentario(fonte);
        fonte.split("\n").forEach((linha, i) => {
          for (const { termo, adr, virou } of APOSENTADOS) {
            if (!linha.includes(termo)) continue;
            if (linha.includes(adr)) return;
            if (comentario[i] || ehIdentificador(linha, termo)) return;
            sobras.push(
              `${relativo}:${i + 1} — "${termo}" (${adr} trocou por "${virou}"). ` +
                "Identificador de banco pode ficar; TEXTO não.",
            );
            return;
          }
        });
      }
    }
    expect(sobras, `\n${sobras.join("\n")}\n`).toEqual([]);
  });

  it("as duas pastas existem e têm peças — senão este teste passa por vazio", () => {
    for (const pasta of PASTAS) {
      expect(arquivosHtml(pasta).length, `sem .html em ${pasta}`).toBeGreaterThan(0);
    }
  });
});

/**
 * QUEM COLHE O QUÊ — guarda da ADR-108.
 *
 * A Ficha do Assistido pedia ao Curador, na Consulta Inicial, o limite
 * financeiro e a faixa aceitável da pessoa. Ou seja: **o médico que precisa
 * estar livre de interesse comercial perguntava o orçamento dela** — depois de
 * o Supervisor já ter combinado preço no primeiro contato.
 *
 * O que torna isso um caso para teste, e não para uma linha de roteiro: **os
 * blocos 15 e 16 nunca foram instruídos a ninguém.** Nem o Guia do Curador nem
 * o Roteiro do Curador mencionavam dinheiro; a pergunta existia só no papel que
 * ele preenche. Um resto sem dono não é achado por releitura — é achado por
 * quem o executa, tarde demais, na frente da pessoa.
 *
 * A regra é de forma, e é o que a torna verificável: nos conceitos 15 e 16 a
 * Ficha carrega a marca de origem (`class="fonte"`) e **não** uma pergunta
 * (`class="pergunta"`). Quem reescrever o bloco e devolver a pergunta ao
 * Curador quebra este teste antes de imprimir.
 */
const VIABILIDADE = [
  "VIABILIDADE_COBERTURA_E_CONVENIO",
  "VIABILIDADE_CUSTO_E_PAGAMENTO",
] as const;

describe("Quem colhe o quê — ADR-108", () => {
  const ficha = readFileSync(path.join(RAIZ, "docs/rede/ficha-do-assistido.html"), "utf-8");

  /**
   * O bloco de um conceito, achado pelo ENDEREÇO canônico impresso (o
   * `<span class="cod">`), nunca pelo número — número quebra quando a lista
   * reordena (lição 12), e reordenar a Parte 4 é pauta aberta.
   */
  const bloco = (code: string): string => {
    const i = ficha.indexOf(`<span class="cod">${code}</span>`);
    expect(i, `conceito ${code} sumiu da Ficha (ou perdeu o endereço impresso)`).toBeGreaterThan(-1);
    return ficha.slice(ficha.lastIndexOf("<section", i), ficha.indexOf("</section>", i));
  };

  it("a dupla de Viabilidade é transcrição, não pergunta do Curador", () => {
    for (const code of VIABILIDADE) {
      const b = bloco(code);
      expect(b, `${code} sem a marca de origem`).toContain("Colhido pelo <b>Supervisor</b>");
      expect(b, `${code} voltou a ser pergunta do Curador (ADR-108)`).not.toContain('class="pergunta"');
    }
  });

  it("os outros catorze conceitos da Parte 4 continuam sendo pergunta dela", () => {
    // Só a Parte 4: a Parte 5 usa a mesma classe para DESCRIÇÕES de conceito,
    // que não são perguntas a ninguém — ali o Curador lê e circula, não pergunta.
    const parte4 = ficha.slice(ficha.indexOf("Parte 4 —"), ficha.indexOf("Parte 5 —"));
    const perguntas = (parte4.match(/class="pergunta"/g) ?? []).length;
    expect(perguntas, "a Parte 4 deixou de ter 14 perguntas com voz dela").toBe(14);
  });

  it("a proibição está escrita para o Curador, e a coleta para o Supervisor", () => {
    const contem = (arquivo: string, trecho: string) => {
      const texto = readFileSync(path.join(RAIZ, arquivo), "utf-8");
      expect(texto, `${arquivo} não diz "${trecho}"`).toContain(trecho);
    };
    // Ele precisa saber que não pergunta.
    contem("docs/guias/7-roteiro-do-curador.html", "ADR-108");
    contem("docs/guias/3-curador.html", "ADR-108");
    // E ele precisa saber que, se não perguntar, ninguém pergunta.
    // Pelo NOME do conceito, nunca pelo número da Ficha — a Ficha pode ser
    // reordenada, e citação por posição é a lição 12 esperando de novo.
    contem("docs/guias/6-roteiro-do-supervisor.html", "Cobertura e convênio");
    contem("docs/rede/roteiro-do-supervisor.html", "Cobertura e convênio");
    contem("docs/guias/2-supervisor.html", "Cobertura e convênio");
  });

  /**
   * ADR-109 — a resposta nasce de pergunta. A regra só existe se estiver
   * impressa onde o Curador lê na hora: a instrução de abertura (todas as
   * catorze, âncora, nada por inferência) e a Parte 5 fora da sala.
   */
  it("a ADR-109 está impressa onde o Curador lê", () => {
    expect(ficha).toContain("a história não responde pergunta nenhuma");
    expect(ficha).toContain("âncora, não resposta");
    expect(ficha).toContain("DEPOIS que ela sair da sala (ADR-109)");
    const diario = readFileSync(path.join(RAIZ, "docs/rede/guia-da-primeira-rodada.html"), "utf-8");
    expect(diario, "o Diário perdeu a medida do preço da regra").toContain("O preço de não inferir (ADR-109)");
  });
});

/**
 * DE QUEM É O JUÍZO — guarda do rótulo da Parte 5.
 *
 * A escala perguntava, nos vinte e nove conceitos, **"Quanto isto importa para
 * ela?"** — e a Folha da Mesa copiava isso numa coluna chamada **"Importância
 * (dela)"**. Mas em **treze deles a pessoa não é perguntada**: a Parte 5 diz,
 * na própria abertura, que ali a importância vem da leitura da história. Era
 * juízo do Curador rotulado como declaração dela, e cruzado na Mesa como se
 * fosse — dez dos treze sendo credenciais do médico (graduação, residência,
 * fellowship, produção acadêmica), sobre as quais ela nunca abriu a boca.
 *
 * O produto inteiro se apoia em *"o critério é dela, não nosso"*. Um
 * instrumento que atribui a ela treze critérios que ela não declarou desmente
 * essa frase todo dia, em papel, na frente de quem assina embaixo. É a mesma
 * família do `SIM-55` e do `SIM-28`: **autoria atribuída errado**.
 *
 * A regra é de contagem, e é o que a torna verificável: a Parte 4 tem 16
 * rótulos com a voz dela, a Parte 5 tem 13 com a leitura dele, e **nenhuma das
 * duas tem o rótulo da outra**. Mover um conceito de parte sem trocar o rótulo
 * quebra este teste antes de imprimir.
 */
describe("De quem é o juízo — o rótulo da Parte 5", () => {
  const ficha = readFileSync(path.join(RAIZ, "docs/rede/ficha-do-assistido.html"), "utf-8");
  const folha = readFileSync(path.join(RAIZ, "docs/rede/folha-da-mesa.html"), "utf-8");

  const DELA = "Quanto isto importa para ela?";
  const DELE = "Quanto isto pesa neste caso?";

  const partes = () => {
    const i5 = ficha.indexOf("Parte 5 —");
    const i6 = ficha.indexOf("Parte 6 —");
    expect(i5, "a Parte 5 sumiu da Ficha").toBeGreaterThan(-1);
    expect(i6, "a Parte 6 sumiu da Ficha").toBeGreaterThan(i5);
    return { parte4: ficha.slice(0, i5), parte5: ficha.slice(i5, i6) };
  };
  const contar = (texto: string, agulha: string) => texto.split(agulha).length - 1;

  it("a Parte 4 pergunta a ela, e só a ela — os 16 conceitos com voz dela", () => {
    const { parte4 } = partes();
    expect(contar(parte4, DELA), "a Parte 4 deixou de ter 16 rótulos com a voz dela").toBe(16);
    expect(contar(parte4, DELE), "rótulo de leitura do Curador vazou para a Parte 4").toBe(0);
  });

  it("a Parte 5 não atribui a ela o que é leitura do Curador — os 13", () => {
    const { parte5 } = partes();
    expect(contar(parte5, DELE), "a Parte 5 deixou de ter 13 rótulos de leitura do Curador").toBe(13);
    expect(contar(parte5, DELA), "a Parte 5 voltou a chamar de dela o juízo do Curador").toBe(0);
    expect(parte5, "a abertura da Parte 5 parou de dizer que ela não é perguntada").toContain(
      "a pessoa não é perguntada sobre nenhum deles",
    );
  });

  it("a Folha da Mesa não chama de dela a coluna que mistura as duas origens", () => {
    expect(folha, 'a coluna voltou a se chamar "Importância (dela)"').not.toContain("Importância (dela)");
    expect(folha, "a legenda parou de explicar a marca °").toContain("as linhas com °");
    // Uma marca por conceito da Parte 5 — nem a mais, nem a menos.
    expect(folha.split(" <b>°</b>").length - 1, "as 13 linhas de leitura do Curador perderam a marca").toBe(13);
  });
});
