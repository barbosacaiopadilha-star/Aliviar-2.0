import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHAMADORES_DE_CAPABILITIES,
  ehChamadorDe,
  ehLeitorAutorizado,
  LEITORES_DE_PROPOSTA_AUTORIZADOS,
} from "./leitores-de-proposta-autorizados";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO C: DERIVAÇÃO
 *
 * A Camada de Derivação **ainda não existe** e, enquanto a ADR-A não existir,
 * não pode existir. Estas guardas são de **ausência**: elas provam que nada no
 * repositório já faz, por atalho, o que a arquitetura só autoriza depois de
 * decisão registrada. Guarda de ausência é o único tipo de guarda possível
 * sobre uma camada que não nasceu — e é exatamente o que o critério AC-BLOCO
 * da Arquitetura §17.4 pede ("a ausência do teste é o aceite").
 *
 * ┌ C-01 — Nenhuma proposta persistida existe
 * │ Objetivo ......... impedir que `derivation_proposals` nasça antes da ADR-A
 * │                    e das dez dependências do §15.0.
 * │ Princípio ........ "Proposta nunca é declaração" (P-08); Arquitetura §15.0.
 * │ Arquivos ......... src/** · supabase/migrations/**
 * │ Validação ........ varredura textual do repositório.
 * │ Teste ............ negativo (zero ocorrências) · fronteira (a varredura
 * │                    enxerga migrations, não só código).
 * │ Falha ............ alguém cria a tabela ou o módulo sem passar pela ADR.
 * │ Detecção ......... suíte unitária, sem banco.
 * ├ C-02 — Nenhum regime de confirmação em bloco (AC-BLOCO)
 * │ Princípio ........ Arquitetura §5.4.0: proibido existir, **nem atrás de
 * │                    feature flag**, enquanto DP-5 estiver aberta.
 * ├ C-03 — Filtro eliminatório nunca é derivado
 * │ Princípio ........ Arquitetura §5.5 e RS-07: o sistema sinaliza para
 * │                    discussão; quem declara filtro é o Curador, item a item.
 * │ Validação ........ quem escreve `priority_profile_filters` não conhece grau,
 * │                    `ESSENCIAL` nem o Protocolo da Pessoa.
 * └ C-04 — A única derivação autorizada hoje (ADR-065) não persiste nada
 *   Princípio ........ Arquitetura §15.0 e §2.3 (DR* nunca escreve nos Mapas).
 */

const RAIZ = process.cwd();

function arquivosDe(diretorio: string, extensoes: string[]): string[] {
  const encontrados: string[] = [];
  const caminhar = (atual: string) => {
    for (const entrada of readdirSync(atual)) {
      const completo = path.join(atual, entrada);
      if (statSync(completo).isDirectory()) {
        caminhar(completo);
        continue;
      }
      if (extensoes.some((ext) => entrada.endsWith(ext))) encontrados.push(completo);
    }
  };
  caminhar(diretorio);
  return encontrados;
}

const FONTES = arquivosDe(path.join(RAIZ, "src"), [".ts", ".tsx"]);
const MIGRATIONS = arquivosDe(path.join(RAIZ, "supabase", "migrations"), [".sql"]);

function ocorrencias(arquivos: string[], padrao: RegExp): string[] {
  return arquivos
    .filter((arquivo) => padrao.test(readFileSync(arquivo, "utf8")))
    .map((arquivo) => path.relative(RAIZ, arquivo));
}

/**
 * Escrita de verdade, não menção: procura `from("<tabela>")` e olha só até a
 * próxima tabela da mesma cadeia. Um módulo que LÊ esta tabela e ESCREVE em
 * outra não pode contar como escritor — foi assim que a primeira versão desta
 * guarda acusou `mesa-cruzamento.ts`, que só faz `select`.
 */
function escreveNaTabela(fonte: string, tabela: string): boolean {
  const referencia = new RegExp(`from\\(\\s*["']${tabela}["']\\s*\\)`, "g");
  let encontro: RegExpExecArray | null;
  while ((encontro = referencia.exec(fonte)) !== null) {
    const inicio = encontro.index + encontro[0].length;
    const cadeia = fonte.slice(inicio, inicio + 400).split(/\.from\(/)[0];
    if (/\.(insert|upsert|update|delete)\(/.test(cadeia)) return true;
  }
  return false;
}

function escritoresDe(arquivos: string[], tabela: string): string[] {
  return arquivos
    .filter((arquivo) => escreveNaTabela(readFileSync(arquivo, "utf8"), tabela))
    .map((arquivo) => path.relative(RAIZ, arquivo).split(path.sep).join("/"));
}

describe("C-01 · Nenhuma proposta persistida existe", () => {
  /**
   * ITEM 2.1 — ESTA ASSERÇÃO MUDOU DE FORMA, NÃO DE INTENÇÃO.
   *
   * Até aqui ela exigia que `derivation_proposals` não existisse em migration
   * nenhuma, com a justificativa: "a Camada de Derivação exige a ADR-A e as dez
   * dependências do §15.0 **antes de persistir qualquer proposta**".
   *
   * A ADR-A foi lavrada (ADR-066), e o §15.0 lista `derivation_proposals` como
   * a PRIMEIRA das dez dependências que precisam existir simultaneamente. A
   * regra proíbe derivação **persistida ou consumida** — não proíbe a estrutura
   * vazia nascer. Manter a proibição na forma antiga tornaria impossível
   * cumprir a própria pré-condição que ela cobra.
   *
   * A guarda passa a provar o que sempre quis dizer, e prova MAIS: a estrutura
   * pode existir, mas tem de estar INERTE. Zero linha, zero policy, RLS ligada
   * e nenhum grant a papel de aplicação — a fronteira imposta pelo banco, não
   * pela disciplina de quem programa.
   *
   * As outras duas asserções de C-01 seguem intactas, e são o que impede a
   * inércia de virar operação por descuido.
   */
  it("a estrutura pode existir, mas nasce e permanece INERTE", () => {
    const declaracoes = ocorrencias(MIGRATIONS, /create table curadoria\.derivation_proposals/i);

    // Enquanto ninguém a criar, não há o que auditar — e isso também é válido.
    if (declaracoes.length === 0) return;

    expect(declaracoes, "a estrutura foi declarada mais de uma vez").toHaveLength(1);

    // `ocorrencias` devolve caminho relativo à raiz.
    const sql = readFileSync(path.join(RAIZ, declaracoes[0]!), "utf8");

    // Nenhum dado nasce com ela: nem seed, nem backfill, nem valor inicial.
    for (const escrita of [
      /insert\s+into\s+curadoria\.derivation_proposals/i,
      /update\s+curadoria\.derivation_proposals/i,
    ]) {
      expect(escrita.test(sql), `a migration escreve na estrutura: ${escrita}`).toBe(false);
    }

    // RLS ligada e NENHUMA policy: ninguém alcança a estrutura pela aplicação.
    expect(sql).toMatch(/alter table curadoria\.derivation_proposals enable row level security/i);
    expect(
      /create policy[^;]*on curadoria\.derivation_proposals/i.test(sql),
      "uma policy abriu a estrutura antes das dez dependências do §15.0",
    ).toBe(false);

    // E nenhum grant a papel de aplicação.
    expect(
      /grant[^;]*on curadoria\.derivation_proposals[^;]*to\s+(anon|authenticated)/i.test(sql),
      "um grant abriu a estrutura a papel de aplicação",
    ).toBe(false);
  });

  /**
   * TERCEIRA EVOLUÇÃO DA C-01 (`78e261c`, CONTRATO_1_8_R1 §21.6) — A TABELA
   * SOME DE `src/` POR INTEIRO.
   *
   * A emenda `e1186ec` havia aberto exceção nominal para o repositório ler a
   * tabela; a prova de banco real (A1.1) mostrou que o banco a negava de
   * qualquer forma — a inércia do 2.1 não concede SELECT a papel algum. A
   * decisão lavrada foi a capability `ler_proposta_para_proveniencia`
   * (SECURITY DEFINER, §21): o repositório invoca a FUNÇÃO, cujo nome não
   * contém o da tabela. O único conhecimento da tabela em runtime de
   * aplicação fica encapsulado no objeto SQL.
   *
   * Logo: a C-01 volta a proibir a string em TODO o `src/`, LISTA DE ISENÇÃO
   * ZERADA — comentários incluídos, porque a varredura sempre alcançou prosa.
   * A lista nominal muda de sujeito: deixa de isentar acesso à tabela e passa
   * a nomear quem pode invocar a capability (C-01b audita inércia; C-01d
   * audita exclusividade).
   */
  function leitoresDePropostas(
    arquivos: readonly { caminho: string; conteudo: string }[],
  ): string[] {
    return arquivos
      .filter(({ conteudo }) => /derivation_proposals|derivationProposal/i.test(conteudo))
      .map(({ caminho }) => caminho.split("\\").join("/"));
  }

  const FONTES_COM_CONTEUDO = FONTES.map((arquivo) => ({
    caminho: path.relative(RAIZ, arquivo),
    conteudo: readFileSync(arquivo, "utf8"),
  }));

  it("NENHUM módulo de src/ conhece a tabela de propostas — sem exceção", () => {
    expect(
      leitoresDePropostas(FONTES_COM_CONTEUDO),
      "a string da tabela voltou a src/ — o conhecimento dela é do objeto SQL, não da aplicação.",
    ).toEqual([]);
  });

  it("a proibição é total: até o repositório canônico cai se citar a tabela", () => {
    // §18.5 — falseamento com entrada sintética, sem sujar a árvore. E desta
    // vez o próprio arquivo da lista nominal NÃO escapa: a autorização dele é
    // para invocar a capability, nunca para citar a tabela.
    const sintetico = [
      {
        caminho: "src/modules/curadoria/qualquer-outro-modulo.ts",
        conteudo: 'const x = await supabase.from("derivation_proposals").select("*");',
      },
      {
        caminho: LEITORES_DE_PROPOSTA_AUTORIZADOS[0]!,
        conteudo: "// comentário citando derivation_proposals",
      },
    ];
    expect(leitoresDePropostas(sintetico)).toEqual([
      "src/modules/curadoria/qualquer-outro-modulo.ts",
      LEITORES_DE_PROPOSTA_AUTORIZADOS[0]!,
    ]);
  });

  it("o leitor autorizado existe — sem ele, a isenção seria uma porta aberta para ninguém", () => {
    for (const autorizado of LEITORES_DE_PROPOSTA_AUTORIZADOS) {
      expect(
        FONTES_COM_CONTEUDO.some((f) => f.caminho.split("\\").join("/") === autorizado),
        `o arquivo autorizado ${autorizado} não existe`,
      ).toBe(true);
    }
  });

  /**
   * C-01b — AUDITORIA DA EXCEÇÃO (§18.4).
   *
   * Autorizar e auditar passam a ser o mesmo ato: a lista nominal é fonte única,
   * e um segundo nome futuro nasce auditado por construção.
   */
  describe("C-01b · o leitor autorizado de propostas é read-only e não decisório", () => {
    for (const autorizado of LEITORES_DE_PROPOSTA_AUTORIZADOS) {
      it(`${autorizado} não escreve, não emite, não decide`, () => {
        const fonte = readFileSync(path.join(RAIZ, autorizado), "utf8");
        const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(\/\/|\*).*$/gm, "");

        for (const escrita of [/\.insert\s*\(/, /\.update\s*\(/, /\.delete\s*\(/, /\.upsert\s*\(/]) {
          expect(escrita.test(codigo), `o leitor autorizado escreve: ${escrita}`).toBe(false);
        }
        expect(
          /\.rpc\s*\(\s*["'`](emitir|criar|gravar|registrar|aplicar)/i.test(codigo),
          "o leitor autorizado chama RPC de escrita",
        ).toBe(false);

        // Consumo (§18.3): decidir, derivar, ordenar, rodar o Motor.
        for (const consumo of [
          /crossPriorityAndProfessional|celulaDoMotor|crossOne/,
          /\.sort\s*\(/,
          /escolherRegra|selecionarRegra|emitirProposta/i,
        ]) {
          expect(consumo.test(codigo), `o leitor autorizado passou a consumir: ${consumo}`).toBe(
            false,
          );
        }

        // E não exporta função de decisão: o que sai dele é cadeia, não veredito.
        const exportados = [...codigo.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(
          (m) => m[1] as string,
        );
        for (const nome of exportados) {
          expect(
            /^(decidir|escolher|selecionar|ordenar|filtrar|emitir|aprovar|classificar)/i.test(nome),
            `o leitor autorizado exporta função de decisão: ${nome}`,
          ).toBe(false);
        }
      });

    }

    /**
     * C-01c — O VÍNCULO É PONTEIRO, NUNCA BUSCA.
     *
     * `evidence_id` aponta para a linha que sustentava o estado no momento da
     * confirmação. Resolver isso por `max(version)`, por data ou por "primeira
     * compatível" faria a cadeia afirmar que uma confirmação de julho se
     * apoiou numa evidência que nasceu em agosto — a mentira exata que o
     * vínculo existe para impedir (1.8-R1 §4, §6).
     *
     * 1.11: esta pergunta é DO CHAMADOR DA CAPABILITY INDIVIDUAL — o painel
     * agregado não resolve vínculo nenhum, então o laço é só sobre ele.
     */
    for (const autorizado of CHAMADORES_DE_CAPABILITIES.ler_proposta_para_proveniencia) {
      it(`${autorizado} resolve a evidência pelo vínculo, nunca por busca`, () => {
        const fonte = readFileSync(path.join(RAIZ, autorizado), "utf8");
        const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(\/\/|\*).*$/gm, "");

        for (const inferencia of [
          /max\s*\(\s*["'`]?version/i,
          /\.order\s*\([^)]*version/i,
          /\.order\s*\([^)]*collected_at/i,
          /\.order\s*\([^)]*created_at/i,
          /\.limit\s*\(\s*1\s*\)/,
        ]) {
          expect(
            inferencia.test(codigo),
            `o vínculo passou a ser inferido por ${inferencia} em vez de resolvido por evidence_id.`,
          ).toBe(false);
        }

        // E a resolução acontece mesmo: por igualdade de `id`.
        expect(codigo, "a evidência deixou de ser alcançada pelo vínculo").toMatch(
          /evidence_id/,
        );
        expect(codigo).toMatch(/\.eq\s*\(\s*["'`]id["'`]\s*,\s*evidenceId\s*\)/);
      });
    }
  });

  it("nenhum módulo persiste 'proposta' como estado de domínio", () => {
    // EVOLUÇÃO 1.11 (CONTRATO_1_11 §4): o Painel de Discordância CONSOME os
    // cinco desfechos do schema como CONTAGENS agregadas — `PROPOSTA: 0` num
    // mapa de contadores é leitura de fato, não estado nascendo. A isenção é
    // nominal e por par de arquivos; qualquer outro módulo continua caindo.
    const PAINEL = [
      "src/modules/curadoria/painel-de-discordancia.ts",
      "src/modules/curadoria/painel-de-discordancia-repository.ts",
    ];
    expect(
      ocorrencias(FONTES, /\bPROPOSTA\b\s*[:=]|status\s*[:=]\s*["']PROPOSTA["']/).filter(
        (caminho) => !PAINEL.includes(caminho.split("\\").join("/")),
      ),
      "Um estado PROPOSTA persistido é a Camada de Derivação nascendo sem fronteira humana.",
    ).toEqual([]);
    // E a isenção não é cheque em branco: o painel só LÊ — a C-01b audita os
    // chamadores como read-only, e a varredura de escrita pega qualquer
    // `.insert/.update` que nascesse ali.
  });

  /**
   * C-01d — CADA CAPABILITY TEM UM CHAMADOR SÓ (§21.7 · CONTRATO_1_11 §10).
   *
   * A tabela sumiu de `src/` (C-01); o que a aplicação conhece são FUNÇÕES.
   * Com o 1.11 são DUAS — a leitora individual (proveniência) e a leitora
   * agregada (painel) — cada uma com seu chamador nominal, e os papéis não se
   * cruzam: o painel que lesse a individual poderia reconstituir linhas e
   * agregar em memória (§10.1); a cadeia que lesse a agregada estaria
   * decidindo por estatística.
   *
   * A detecção olha CÓDIGO (comentário que documenta a proibição não é a
   * violação — a lição da C-05, de novo), e é pura sobre `(caminho, conteúdo)`
   * para o falseamento sintético do §18.5.
   */
  describe("C-01d · cada capability de propostas tem um chamador só", () => {
    const CAPABILITIES = Object.keys(CHAMADORES_DE_CAPABILITIES) as Array<
      keyof typeof CHAMADORES_DE_CAPABILITIES
    >;

    function chamadoresForaDoMapa(
      capability: keyof typeof CHAMADORES_DE_CAPABILITIES,
      arquivos: readonly { caminho: string; conteudo: string }[],
    ): string[] {
      return arquivos
        .filter(({ conteudo }) => {
          const codigo = conteudo
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*(\/\/|\*).*$/gm, "");
          return new RegExp(capability).test(codigo);
        })
        .map(({ caminho }) => caminho.split("\\").join("/"))
        .filter((caminho) => !ehChamadorDe(capability, caminho));
    }

    for (const capability of CAPABILITIES) {
      it(`${capability}: somente o chamador nominal a invoca — e a invoca de verdade`, () => {
        expect(
          chamadoresForaDoMapa(capability, FONTES_COM_CONTEUDO),
          `um módulo fora do mapa passou a invocar ${capability}.`,
        ).toEqual([]);
        // A lista não isenta o vazio: o chamador nominal existe e invoca.
        for (const autorizado of CHAMADORES_DE_CAPABILITIES[capability]) {
          const arquivo = FONTES_COM_CONTEUDO.find(
            (f) => f.caminho.split("\\").join("/") === autorizado,
          );
          expect(arquivo, `o chamador nominal ${autorizado} não existe`).toBeDefined();
          expect(arquivo!.conteudo).toContain(capability);
        }
      });
    }

    it("chamador CRUZADO é proibido nos dois sentidos — em código, não em prosa", () => {
      const cadeiaRepo = FONTES_COM_CONTEUDO.find((f) =>
        ehChamadorDe("ler_proposta_para_proveniencia", f.caminho.split("\\").join("/")),
      )!;
      const painelRepo = FONTES_COM_CONTEUDO.find((f) =>
        ehChamadorDe("contar_propostas_por_desfecho", f.caminho.split("\\").join("/")),
      )!;
      const soCodigo = (s: string) =>
        s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(\/\/|\*).*$/gm, "");

      expect(
        /contar_propostas_por_desfecho/.test(soCodigo(cadeiaRepo.conteudo)),
        "a cadeia passou a ler o agregado — decidir por estatística não é reconstruir proveniência.",
      ).toBe(false);
      expect(
        /ler_proposta_para_proveniencia/.test(soCodigo(painelRepo.conteudo)),
        "o painel passou a ler proposta individual — a agregação nasce no banco, e só nele (§10.1).",
      ).toBe(false);
    });

    it("um chamador sintético fora do mapa derruba a guarda — por caminho exato", () => {
      for (const capability of CAPABILITIES) {
        const sintetico = [
          {
            caminho: "src/modules/curadoria/qualquer-outro-modulo.ts",
            conteudo: `await supabase.rpc("${capability}");`,
          },
        ];
        expect(chamadoresForaDoMapa(capability, sintetico), capability).toEqual([
          "src/modules/curadoria/qualquer-outro-modulo.ts",
        ]);
      }
      // E o cruzamento sintético também cai: o painel invocando a individual.
      const cruzado = chamadoresForaDoMapa("ler_proposta_para_proveniencia", [
        {
          caminho: "src/modules/curadoria/painel-de-discordancia-repository.ts",
          conteudo: 'await supabase.rpc("ler_proposta_para_proveniencia", { p_case_id });',
        },
      ]);
      expect(cruzado, "o chamador cruzado herdou autorização").toHaveLength(1);
    });

    it("nenhuma superfície — component, route, action — invoca capability alguma", () => {
      const SUPERFICIES = FONTES_COM_CONTEUDO.filter(
        ({ caminho }) =>
          /[\\/](app|components)[\\/]/.test(caminho) || /actions?\.tsx?$/.test(caminho),
      );
      for (const capability of CAPABILITIES) {
        expect(
          SUPERFICIES.filter(({ conteudo }) => new RegExp(`rpc\\(\\s*["'\`]${capability}`).test(conteudo)).map(
            ({ caminho }) => caminho,
          ),
          `uma superfície passou a invocar ${capability} direto — a informação chega pelo repositório nominal.`,
        ).toEqual([]);
      }
    });

    /**
     * §21.7 item 3 + CONTRATO_1_11 §10 — O CONJUNTO DE FUNÇÕES SQL É FECHADO.
     *
     * Quem alcança a tabela é exatamente
     * { emitir_proposta_de_importancia (escritor, C-11),
     *   ler_proposta_para_proveniencia (leitora individual, §21),
     *   contar_propostas_por_desfecho (leitora agregada, 1.11) }.
     * Um QUARTO nome derruba a guarda.
     */
    function nomesDeFuncoesQueTocamPropostas(sqlSemComentarios: string): string[] {
      const nomes = new Set(
        [...sqlSemComentarios.matchAll(/create\s+(?:or\s+replace\s+)?function\s+curadoria\.(\w+)/gi)].map(
          (m) => m[1] as string,
        ),
      );
      return [...nomes]
        .filter((nome) => /derivation_proposals/.test(corpoDaFuncao(sqlSemComentarios, nome)))
        .sort();
    }

    it("as migrations definem exatamente três funções que tocam a tabela", () => {
      const sql = MIGRATIONS.sort()
        .map((arquivo) => semComentarios(readFileSync(arquivo, "utf8")))
        .join("\n");
      expect(nomesDeFuncoesQueTocamPropostas(sql)).toEqual([
        "contar_propostas_por_desfecho",
        "emitir_proposta_de_importancia",
        "ler_proposta_para_proveniencia",
      ]);
    });

    it("uma quarta função sintética derruba a guarda", () => {
      const sintetico = `
        create or replace function curadoria.exportar_propostas_para_planilha()
        returns void language plpgsql as $$
        begin
          perform * from curadoria.derivation_proposals;
        end;
        $$;`;
      expect(nomesDeFuncoesQueTocamPropostas(sintetico)).toEqual([
        "exportar_propostas_para_planilha",
      ]);
    });

    /**
     * ANTI-RANKING POR DESENHO (CONTRATO_1_11 §7) — a dimensão pessoal não
     * existe em NENHUMA camada da cadeia agregada, e a ordenação nunca é por
     * taxa.
     */
    it("a capability agregada não conhece dimensão pessoal — nem no corpo, nem no retorno", () => {
      const migracao = MIGRATIONS.map((a) => readFileSync(a, "utf8")).find((s) =>
        s.includes("contar_propostas_por_desfecho"),
      );
      expect(migracao, "a migration da capability agregada sumiu").toBeDefined();
      const corpo = corpoDaFuncao(semComentarios(migracao!), "contar_propostas_por_desfecho");
      expect(corpo.length, "o corpo da agregada não foi encontrado").toBeGreaterThan(50);
      for (const pessoal of [
        /professional_profile_id/,
        /case_id/,
        /\bp\.id\b/,
        /origin_author/,
        /origin_record/,
        /suggested_value/,
      ]) {
        expect(
          pessoal.test(corpo),
          `a capability agregada passou a expor dimensão individual: ${pessoal}`,
        ).toBe(false);
      }
    });

    it("o painel não ordena por taxa, não agrupa por pessoa, não vaza individual", () => {
      const ARQUIVOS_DO_PAINEL = [
        "src/modules/curadoria/painel-de-discordancia.ts",
        "src/modules/curadoria/painel-de-discordancia-repository.ts",
        "src/components/curadoria/painel-de-discordancia.tsx",
      ];
      for (const caminho of ARQUIVOS_DO_PAINEL) {
        const arquivo = FONTES_COM_CONTEUDO.find(
          (f) => f.caminho.split("\\").join("/") === caminho,
        );
        expect(arquivo, `${caminho} não existe`).toBeDefined();
        const codigo = arquivo!.conteudo
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*(\/\/|\*).*$/gm, "");
        for (const proibido of [
          /professional_profile_id/i,
          /professionalProfileId/,
          /patient/i,
          /caseId|case_id/,
          /proposal_?id|propostaId/i,
          /\.sort\([^)]*(taxa|discordancia|recusad|contagem)/i,
          /\btop\b|\bbottom\b|ranking/i,
        ]) {
          expect(
            proibido.test(codigo),
            `${caminho} ganhou dimensão pessoal ou ranking: ${proibido}`,
          ).toBe(false);
        }
      }
    });

    it("o painel vive na Mesa, e só nela", () => {
      // Quem importa o componente ou o repositório do painel tem de morar em
      // `app/portal-curador/` — paciente, público e qualquer outra superfície
      // continuam sem acesso (CONTRATO_1_11 §9.3).
      const importadores = FONTES_COM_CONTEUDO.filter(({ caminho, conteudo }) => {
        const normalizado = caminho.split("\\").join("/");
        if (normalizado.includes("modules/curadoria/painel-de-discordancia")) return false;
        if (normalizado.includes("components/curadoria/painel-de-discordancia")) return false;
        return /painel-de-discordancia/.test(conteudo);
      }).map(({ caminho }) => caminho.split("\\").join("/"));
      for (const importador of importadores) {
        expect(
          importador.startsWith("src/app/portal-curador/"),
          `o painel vazou para fora da Mesa: ${importador}`,
        ).toBe(true);
      }
      expect(importadores.length, "ninguém liga o painel — a Mesa perdeu a tela").toBeGreaterThan(0);
    });
  });

});

describe("C-02 · Nenhum regime de confirmação em bloco (AC-BLOCO)", () => {
  it("nenhum mecanismo de confirmação em lote existe — nem inativo, nem atrás de flag", () => {
    const suspeitos = ocorrencias(
      [...FONTES, ...MIGRATIONS],
      /confirmarEmBloco|confirmacaoEmBloco|confirmacao_em_bloco|bulkConfirm|confirmBulk|confirmAll|confirmarTodos|aceitarTodas/i,
    );
    expect(
      suspeitos,
      "Arquitetura §5.4.0: enquanto DP-5 estiver aberta, o regime de bloco não existe no repositório.",
    ).toEqual([]);
  });
});

describe("C-03 · Filtro eliminatório nunca é derivado", () => {
  const escritoresDeFiltro = escritoresDe(FONTES, "priority_profile_filters");

  it("existe exatamente um lugar que escreve filtros — e ele é conhecido", () => {
    expect(escritoresDeFiltro).toEqual(["src/modules/curadoria/repository.ts"]);
  });

  it("quem escreve filtro não conhece grau, ESSENCIAL nem o Protocolo da Pessoa", () => {
    for (const relativo of escritoresDeFiltro) {
      const fonte = readFileSync(path.join(RAIZ, relativo), "utf8");
      for (const padrao of [/ESSENCIAL/, /NEED_DEGREES?/, /\bdegree\b/, /PERSON_PROTOCOL/]) {
        expect(
          padrao.test(fonte),
          `${relativo} referencia ${padrao} — o filtro eliminatório passaria a nascer de derivação, e a Arquitetura §5.5 o proíbe.`,
        ).toBe(false);
      }
    }
  });
});

describe("C-04 · A única derivação autorizada não persiste nada", () => {
  it("`deriveRelationalState` (ADR-065) vive em módulo puro, sem escrita", () => {
    const fonte = readFileSync(
      path.join(RAIZ, "src", "modules", "curadoria", "motor-relacional.ts"),
      "utf8",
    );
    expect(fonte).toMatch(/export function deriveRelationalState/);
    for (const padrao of [/\.insert\(/, /\.upsert\(/, /\.update\(/, /\.delete\(/, /supabase/i]) {
      expect(
        padrao.test(fonte),
        "A derivação relacional é leitura. Se ela passar a escrever, vira declaração sem ato humano.",
      ).toBe(false);
    }
  });

  it("nenhum módulo de derivação escreve nos dois Mapas que alimentam o Motor", () => {
    const escrevemMapas = FONTES.filter((arquivo) => {
      const fonte = readFileSync(arquivo, "utf8");
      return (
        /case_priority_map|professional_subcriterion_map/.test(fonte) &&
        /\.insert\(|\.upsert\(|\.update\(|\.delete\(/.test(fonte)
      );
    }).map((a) => path.relative(RAIZ, a));

    for (const arquivo of escrevemMapas) {
      expect(
        /deriv/i.test(arquivo),
        `${arquivo} é módulo de derivação e escreve num Mapa do Motor. A Fronteira Humana (§2.4) existe exatamente para impedir isso.`,
      ).toBe(false);
    }
  });
});

/**
 * AS GUARDAS DO ITEM 2.2B — o ciclo de vida da Regra (ADR-069).
 *
 * ┌ C-05 — O estado da Regra é leitura derivada, nunca campo consultado
 * │ Objetivo ......... impedir que `derivation_rules.state` volte a ser lido
 * │                    como estado corrente, e que nasça um cache dele.
 * │ Princípio ........ ADR-069 B-1 e §5.4 · P-07 (uma origem por fato).
 * │ Falha ............ alguém consulta `state` para saber "está vigente?", ou
 * │                    cria coluna/tabela de cache do estado corrente.
 * ├ C-06 — O grafo é fechado, e fechado no BANCO
 * │ Princípio ........ ADR-069 §7 — seis pares permitidos, REVOGADA terminal.
 * ├ C-07 — MR1.2 continua declarativo depois de mudar de sujeito
 * │ Princípio ........ ADR-069 §8.3 — o patamar não cai para código de
 * │                    aplicação nem para consulta-antes-de-inserir.
 * └ C-08 — Nenhum escritor, nenhum pipeline nasceu com o ciclo de vida
 *   Princípio ........ 2.2B é estrutura inerte; 2.C não foi aberta.
 *
 * Elas protegem SEMÂNTICA, não detalhe físico: nenhuma congela nome de coluna
 * ou forma de índice que a arquitetura permita substituir.
 */

const CICLO_SQL = MIGRATIONS.filter((arquivo) => /ciclo_de_vida_da_regra/i.test(arquivo)).map(
  (arquivo) => readFileSync(arquivo, "utf8"),
);

/** Sem os comentários: uma explicação não pode disparar guarda de conteúdo. */
const CICLO_CODIGO = CICLO_SQL.join("\n").replace(/^\s*--.*$/gm, "");

/**
 * O mesmo, para TypeScript — e, desde o 2.2C-R1, também para SQL.
 *
 * A guarda C-05 nasceu acusando o próprio `ciclo-de-vida-da-regra.ts`, cujo
 * comentário diz — corretamente — que a leitura derivada **não** consulta
 * `derivation_rules.state`. Guarda que cai sobre a frase que a cumpre não
 * protege nada; ela só ensina a não escrever a frase. O que se procura é
 * LEITURA, e leitura mora em código.
 *
 * A lição se repetiu inteira três vezes no 2.2C-R1: o comentário do Catálogo
 * gerado que manda "NÃO confundir com `cruzamento`", o do emissor que declara
 * "SEM `order by rule_id`", e o rollback documentado no cabeçalho da migration
 * — cada um acusado pela guarda que ele cumpre. Daí o `--` aqui.
 */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*(\/\/|--|\*).*$/gm, "");
}

function ocorrenciasNoCodigo(arquivos: string[], padrao: RegExp): string[] {
  return arquivos
    .filter((arquivo) => padrao.test(semComentarios(readFileSync(arquivo, "utf8"))))
    .map((arquivo) => path.relative(RAIZ, arquivo).split(path.sep).join("/"));
}

describe("C-05 · O estado da Regra é leitura derivada, nunca campo consultado", () => {
  it("a migration do ciclo de vida existe — sem ela, tudo abaixo seria vácuo", () => {
    expect(CICLO_SQL.length, "a migration do Item 2.2B não foi encontrada").toBeGreaterThan(0);
  });

  it("nenhum módulo de `src/` lê `derivation_rules.state` como estado corrente", () => {
    expect(
      ocorrenciasNoCodigo(FONTES, /derivation_rules\.state|state\s*===\s*['"]VIGENTE['"]/i),
      "`state` diz como a versão NASCEU. Quem pergunta 'está vigente?' lê a última transição.",
    ).toEqual([]);
  });

  it("nenhuma coluna ou tabela de cache do estado corrente nasceu", () => {
    for (const padrao of [/current_state/i, /estado_atual/i, /cached?_state/i, /state_cache/i]) {
      expect(
        padrao.test(CICLO_CODIGO),
        "Cache é segunda fonte de verdade, e só diverge quando ninguém está olhando (ADR-069 §5.4).",
      ).toBe(false);
    }
  });

  it("a leitura derivada ordena por `seq` — nunca pelo relógio", () => {
    expect(CICLO_CODIGO).toMatch(/function curadoria\.derivation_rule_state/i);
    expect(CICLO_CODIGO).toMatch(/order by t\.seq desc/i);
    expect(
      /order by[^;]*occurred_at/i.test(CICLO_CODIGO),
      "Carimbo de tempo empata sob concorrência; estado que depende de desempate não é auditável (§11).",
    ).toBe(false);
  });

  it("nenhuma versão nasce fora de PROPOSTA, e isso é CHECK", () => {
    expect(CICLO_CODIGO).toMatch(/check\s*\(\s*state\s*=\s*'PROPOSTA'\s*\)/i);
  });
});

describe("C-06 · O grafo é fechado, e fechado no banco", () => {
  it("o grafo é CHECK, não convenção de aplicação", () => {
    expect(CICLO_CODIGO).toMatch(/constraint\s+\w*grafo_fechado\s+check/i);
  });

  it("PROPOSTA → REVOGADA não existe: não se revoga o que nunca valeu (§6.2)", () => {
    expect(
      /'PROPOSTA'\s+and\s+to_state\s+in\s*\([^)]*REVOGADA/i.test(CICLO_CODIGO),
      "PROPOSTA → REVOGADA nasceu.",
    ).toBe(false);
  });

  it("nada parte de REVOGADA: o estado é terminal (§6.1)", () => {
    expect(
      /from_state\s*=\s*'REVOGADA'/i.test(CICLO_CODIGO),
      "Uma transição partindo de REVOGADA nasceu.",
    ).toBe(false);
  });

  it("o domínio puro declara o mesmo grafo que o banco", () => {
    const fonte = readFileSync(
      path.join(RAIZ, "src", "modules", "curadoria", "ciclo-de-vida-da-regra.ts"),
      "utf8",
    );
    // Se um dia divergirem, o banco vence — e esta guarda cai antes disso.
    expect(fonte).toMatch(/"PROPOSTA"[^\]]*\["VIGENTE",\s*"SUSPENSA"\]/);
    expect(fonte).toMatch(/"VIGENTE"[^\]]*\["SUSPENSA",\s*"REVOGADA"\]/);
    expect(fonte).toMatch(/"SUSPENSA"[^\]]*\["VIGENTE",\s*"REVOGADA"\]/);
    expect(fonte).toMatch(/"REVOGADA"[^\]]*\[\]/);
  });
});

describe("C-07 · MR1.2 continua declarativo depois de mudar de sujeito", () => {
  it("a unicidade da vigente é índice único parcial, não verificação em código", () => {
    expect(CICLO_CODIGO).toMatch(
      /create unique index[\s\S]*derivation_rule_transitions_uma_vigente_por_regra/i,
    );
    expect(CICLO_CODIGO).toMatch(/where to_state = 'VIGENTE'/i);
  });

  it("nenhum módulo de `src/` alcança a estrutura do ciclo de vida", () => {
    expect(
      ocorrencias(FONTES, /derivation_rule_transitions/i),
      "A estrutura do 2.2B é inerte: nenhum módulo a alcança.",
    ).toEqual([]);
  });

  it("o índice antigo do MR1.2 deixou de ser apresentado como a garantia", () => {
    const comComentarios = CICLO_SQL.join("\n");
    expect(comComentarios).toMatch(/VACUAMENTE VERDADEIRO/i);
    expect(comComentarios).toMatch(/NAO E MAIS A GARANTIA/i);
  });
});

describe("C-08 · Nenhum escritor, nenhum pipeline nasceu com o ciclo de vida", () => {
  it("a migration não semeia, não avalia e não emite proposta", () => {
    for (const padrao of [
      /insert\s+into\s+curadoria\.derivation_rule_transitions/i,
      /insert\s+into\s+curadoria\.derivation_rules/i,
      /insert\s+into\s+curadoria\.derivation_proposals/i,
    ]) {
      expect(
        padrao.test(CICLO_CODIGO),
        "Um escritor nasceu junto da estrutura — 2.C não foi aberta.",
      ).toBe(false);
    }
  });

  it("a estrutura nasce inerte: RLS habilitada, sem policy, sem grant de aplicação", () => {
    expect(CICLO_CODIGO).toMatch(
      /alter table curadoria\.derivation_rule_transitions enable row level security/i,
    );
    expect(
      /create policy[^;]*on curadoria\.derivation_rule_transitions/i.test(CICLO_CODIGO),
      "Uma policy nasceu: a estrutura do 2.2B é inerte.",
    ).toBe(false);
    expect(CICLO_CODIGO).toMatch(/revoke all on curadoria\.derivation_rule_transitions/i);
  });
});

/**
 * ┌ C-09 — As leituras do ciclo de vida não são anônimas (pacote 2.2B-R1)
 * │ Objetivo ......... impedir que `EXECUTE` volte a `PUBLIC` — e com ele a
 * │                    `anon` —, e que a correção seja "compensada" tornando as
 * │                    funções `SECURITY DEFINER`.
 * │ Princípio ........ menor privilégio; inércia do 2.2B; ADR-069 §8.
 * │ Falha ............ uma migration futura concede a PUBLIC, ou recria a
 * │                    função com `drop`+`create` (que restaura o padrão), ou
 * │                    a declara `security definer`.
 * │ Detecção ......... varredura das migrations. O CATÁLOGO é conferido pelo
 * │                    oráculo de integração — as duas portas, de propósito:
 * │                    esta pega a intenção no texto, aquela pega o efeito.
 * │
 * │ FRONTEIRA DELIBERADA: esta guarda diz **"não expor NESTE pacote"**, não
 * │ "nunca poderá existir API autorizada". Uma exposição futura é legítima —
 * │ exige pacote próprio, com decisão registrada e política de acesso. O que
 * │ ela proíbe é a exposição por herança, sem ninguém ter decidido nada.
 * └
 * ┌ C-10 — O MR1.2 é do CONJUNTO, e nenhum texto pode dizer o contrário
 * │ Princípio ........ ressalva 2 da Verificação Independente do 2.2B.
 * │ Falha ............ alguém escreve, em teste ou comentário, que o índice
 * │                    isolado garante todo o MR1.2 — e a próxima pessoa
 * │                    remove o trigger achando que é redundante.
 * └
 */

/** As duas leituras, com a assinatura que o catálogo confirma. */
const LEITURAS_DO_CICLO = ["derivation_rule_state", "derivation_rule_current_version"] as const;

const R1_SQL = MIGRATIONS.filter((arquivo) =>
  /menor_privilegio_nas_leituras_do_ciclo_de_vida/i.test(arquivo),
).map((arquivo) => readFileSync(arquivo, "utf8"));

const R1_CODIGO = R1_SQL.join("\n").replace(/^\s*--.*$/gm, "");

/** Todas as migrations, sem comentários: um exemplo de rollback não é um grant. */
const MIGRATIONS_CODIGO = MIGRATIONS.map((arquivo) =>
  readFileSync(arquivo, "utf8").replace(/^\s*--.*$/gm, ""),
);

describe("C-09 · As leituras do ciclo de vida não são anônimas (2.2B-R1)", () => {
  it("a migration de endurecimento existe — sem ela, tudo abaixo seria vácuo", () => {
    expect(R1_SQL.length, "a migration do 2.2B-R1 não foi encontrada").toBeGreaterThan(0);
    expect(R1_CODIGO).toMatch(/revoke execute on function[\s\S]*from public/i);
  });

  it("nenhuma migration concede EXECUTE dessas funções a PUBLIC ou a papel de aplicação", () => {
    for (const sql of MIGRATIONS_CODIGO) {
      for (const funcao of LEITURAS_DO_CICLO) {
        const concessoes = new RegExp(
          `grant[^;]*execute[^;]*${funcao}[^;]*to\\s+(public|anon|authenticated|service_role)`,
          "i",
        );
        expect(
          concessoes.test(sql),
          `${funcao} recebeu grant. Expor é legítimo — mas por pacote próprio, com decisão registrada, nunca por herança.`,
        ).toBe(false);
      }
    }
  });

  it("nenhuma das duas é declarada SECURITY DEFINER", () => {
    for (const sql of MIGRATIONS_CODIGO) {
      for (const funcao of LEITURAS_DO_CICLO) {
        const definer = new RegExp(
          `create\\s+(or\\s+replace\\s+)?function\\s+curadoria\\.${funcao}[\\s\\S]{0,600}?security\\s+definer`,
          "i",
        );
        expect(
          definer.test(sql),
          `${funcao} virou SECURITY DEFINER — ler passaria a usar a autoridade do dono, não a do chamador. É o oposto da correção.`,
        ).toBe(false);
      }
    }
  });

  it("nenhuma policy de leitura nasceu nas estruturas inertes", () => {
    for (const sql of MIGRATIONS_CODIGO) {
      for (const tabela of ["derivation_rule_transitions", "derivation_rules", "derivation_proposals"]) {
        expect(
          new RegExp(`create policy[^;]*on curadoria\\.${tabela}`, "i").test(sql),
          `Nasceu uma policy em ${tabela}: a estrutura é inerte até o pacote que a abrir.`,
        ).toBe(false);
      }
    }
  });

  it("o endurecimento é mínimo: não concede nada, não toca corpo, trigger, índice nem RLS", () => {
    expect(/\bgrant\b/i.test(R1_CODIGO), "o pacote corretivo concedeu privilégio").toBe(false);
    for (const proibido of [
      /create\s+(or\s+replace\s+)?function/i,
      /create\s+(unique\s+)?index/i,
      /create\s+(constraint\s+)?trigger/i,
      /alter\s+table/i,
      /create\s+table/i,
      /create\s+policy/i,
    ]) {
      expect(
        proibido.test(R1_CODIGO),
        "o pacote corretivo saiu do escopo: ele corrige privilégio, e nada mais.",
      ).toBe(false);
    }
  });

  it("o oráculo de catálogo existe — a guarda de texto não substitui a de efeito", () => {
    const oraculo = path.join(RAIZ, "tests", "integration", "ciclo-de-vida-privilegios.integration.test.ts");
    const fonte = readFileSync(oraculo, "utf8");
    expect(fonte).toMatch(/has_function_privilege/);
    expect(fonte).toMatch(/proacl/);
    expect(fonte).toMatch(/prosecdef/);
  });
});

describe("C-10 · O MR1.2 é do CONJUNTO — trigger e índice, com papéis distintos", () => {
  const CICLO_TESTE = path.join(
    RAIZ,
    "tests",
    "integration",
    "regra-de-derivacao-ciclo-de-vida.integration.test.ts",
  );

  it("a prova contra ordinal forjado existe e nomeia o trigger de cadeia", () => {
    const fonte = readFileSync(CICLO_TESTE, "utf8");
    expect(
      fonte,
      "a prova contra ordinal forjado foi removida — era a ressalva 2 da Verificação.",
    ).toMatch(/ordinal forjado/i);
    expect(fonte).toMatch(/vigencias fechadas \+ 1/);
  });

  it("nenhum texto afirma que o índice sozinho garante todo o MR1.2", () => {
    const textos = [
      readFileSync(CICLO_TESTE, "utf8"),
      ...CICLO_SQL,
      ...R1_SQL,
      readFileSync(path.join(RAIZ, "src", "modules", "curadoria", "ciclo-de-vida-da-regra.ts"), "utf8"),
    ];
    // Formulações que atribuiriam ao índice a garantia inteira. A frase certa
    // é "o índice arbitra a colisão"; a errada é "o índice garante o MR1.2".
    const afirmacoesProibidas = [
      /[oó]\s*[ií]ndice\s+(sozinho|isolado|isoladamente)/i,
      /apenas\s+o\s+[ií]ndice\s+garante/i,
      /[oó]\s*[ií]ndice\s+garante\s+(todo\s+)?o\s+MR1\.2/i,
    ];
    for (const texto of textos) {
      for (const proibida of afirmacoesProibidas) {
        expect(
          proibida.test(texto),
          "Um texto atribuiu ao índice a garantia inteira. O índice arbitra a colisão; quem valida o ordinal é o trigger.",
        ).toBe(false);
      }
    }
  });

  it("a migration do ciclo de vida registra a divisão de responsabilidade", () => {
    const comComentarios = CICLO_SQL.join("\n");
    expect(comComentarios, "a divisão trigger × índice saiu da documentação da migration").toMatch(
      /O trigger apenas CALCULA e CONFERE o ordinal|ele n[aã]o [eé] a garantia/i,
    );
  });
});

/**
 * ┌ C-11 — A ponte é o ÚNICO escritor, e produz só proposta (Item 2.2C)
 * │ Objetivo ......... impedir segundo escritor, escrita direta nos Mapas do
 * │                    Motor e consumo de proposta pelo Pipeline de Leitura.
 * │ Princípio ........ ADR-066 §2 e §15 · A2 · AC-PIPELINE.
 * │ Falha ............ nasce outra função que escreve propostas; ou o emissor
 * │                    passa a escrever em `case_priority_map`/`case_needs`.
 * ├ C-12 — A correspondência é DADO versionado, nunca `case` em código
 * │ Princípio ........ ADR-066 §15: os valores vivem em tabela, não em lógica.
 * │ Falha ............ alguém escreve a tabela grau→importância em SQL ou TS.
 * └ C-13 — As duas escalas continuam disjuntas
 *   Princípio ........ migration 20260801140000; ADR-066 §15 propriedade 5.
 */

const PONTE_SQL = MIGRATIONS.filter((arquivo) => /ponte_grau_importancia/i.test(arquivo)).map(
  (arquivo) => readFileSync(arquivo, "utf8"),
);

const PONTE_CODIGO = PONTE_SQL.join("\n").replace(/^\s*--.*$/gm, "");

/**
 * O CORPO do emissor, entre `as $$` e `$$;`, sem comentários.
 *
 * Fatiar importa: o `comment on function` do emissor explica em prosa que ele
 * NÃO lê `derivation_rules.state`, e uma guarda que olhasse o arquivo inteiro
 * cairia justamente sobre a frase que cumpre a regra.
 */
/**
 * O corpo VIGENTE de uma função, entre `as $$` e `$$;`.
 *
 * Duas precisões que a primeira versão desta guarda não tinha, e que a fizeram
 * cair sobre o nada:
 *
 *   1. o split é no `create [or replace] function`, não no nome solto — o nome
 *      também aparece em `comment on function` e em `revoke execute`, e cortar
 *      por ele devolvia a linha do revoke em vez do corpo;
 *   2. vale a ÚLTIMA definição — `create or replace` numa migration posterior
 *      substitui a anterior, e auditar a primeira seria validar código morto.
 */
function corpoDaFuncao(sql: string, nome: string): string {
  const partes = sql.split(
    new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+curadoria\\.${nome}`, "i"),
  );
  const depois = partes[partes.length - 1] ?? "";
  const abre = depois.indexOf("$$");
  const fecha = depois.indexOf("$$;", abre + 2);
  return abre === -1 || fecha === -1 ? "" : depois.slice(abre + 2, fecha);
}

/** Todas as migrations que definem o emissor, na ordem cronológica do nome. */
const SQL_DO_EMISSOR = MIGRATIONS.filter((arquivo) =>
  /function curadoria\.emitir_proposta_de_importancia/i.test(readFileSync(arquivo, "utf8")),
)
  .sort()
  .map((arquivo) => readFileSync(arquivo, "utf8").replace(/^\s*--.*$/gm, ""))
  .join("\n");

const CORPO_DO_EMISSOR = corpoDaFuncao(SQL_DO_EMISSOR, "emitir_proposta_de_importancia");

describe("C-11 · A ponte é o único escritor, e produz só proposta (2.2C)", () => {
  it("a migration da ponte existe — sem ela, tudo abaixo seria vácuo", () => {
    expect(PONTE_SQL.length, "a migration do Item 2.2C não foi encontrada").toBeGreaterThan(0);
    expect(PONTE_CODIGO).toMatch(/function curadoria\.emitir_proposta_de_importancia/i);
  });

  it("existe exatamente UM NOME de função que escreve propostas", () => {
    // Contamos NOMES DISTINTOS, não ocorrências: o 2.2C-R1 reescreve o emissor
    // com `create or replace` numa migration nova, e isso é evolução legítima
    // do mesmo escritor. O que a guarda proíbe é um SEGUNDO nome.
    const escritoras = new Set(
      MIGRATIONS_CODIGO.flatMap((sql) =>
        sql
          .split(/create\s+or\s+replace\s+function|create\s+function/i)
          .slice(1)
          .filter((corpo) => /insert\s+into\s+curadoria\.derivation_proposals/i.test(corpo))
          .map((corpo) => corpo.trim().split(/[\s(]/)[0]),
      ),
    );
    expect([...escritoras], "nasceu um segundo escritor de propostas").toEqual([
      "curadoria.emitir_proposta_de_importancia",
    ]);
  });

  it("o emissor não escreve nos Mapas que alimentam o Motor (A2)", () => {
    const emissor = PONTE_CODIGO.split(/function curadoria\.emitir_proposta_de_importancia/i)[1] ?? "";
    expect(emissor.length, "o corpo do emissor não foi encontrado").toBeGreaterThan(200);
    for (const escrita of [
      /insert\s+into\s+curadoria\.case_priority_map/i,
      /update\s+curadoria\.case_priority_map/i,
      /delete\s+from\s+curadoria\.case_priority_map/i,
      /insert\s+into\s+curadoria\.case_needs/i,
      /update\s+curadoria\.case_needs/i,
      /delete\s+from\s+curadoria\.case_needs/i,
    ]) {
      expect(
        escrita.test(emissor),
        "A proposta virou declaração: o emissor escreveu onde o Motor lê (A2 / AC-PIPELINE).",
      ).toBe(false);
    }
  });

  it("o emissor lê o estado pela ADR-069, nunca por `derivation_rules.state`", () => {
    // O CORPO da função, entre `as $$` e `$$;`. Fatiar aqui é necessário: o
    // `comment on function` explica, em prosa, que o emissor NÃO lê
    // `derivation_rules.state` — e a frase que cumpre a regra derrubaria a
    // guarda se ela olhasse o arquivo inteiro. Foi o que aconteceu na primeira
    // execução desta guarda.
    const corpo = CORPO_DO_EMISSOR;
    expect(corpo.length, "o corpo do emissor não foi encontrado").toBeGreaterThan(500);
    expect(corpo).toMatch(/derivation_rule_state\s*\(/i);
    expect(
      /derivation_rules\.state|\br\.state\b/i.test(corpo),
      "o emissor voltou a ler o estado inicial como se fosse o corrente (ADR-069 B-1).",
    ).toBe(false);
  });

  it("nenhum módulo de `src/` alcança a correspondência nem o emissor", () => {
    expect(
      ocorrencias(FONTES, /derivation_rule_degree_map|emitir_proposta_de_importancia/i),
      "A ponte é inerte: nenhum módulo da aplicação a alcança.",
    ).toEqual([]);
  });

  it("a estrutura nasce inerte: RLS, sem policy, sem grant, sem PUBLIC EXECUTE", () => {
    expect(PONTE_CODIGO).toMatch(
      /alter table curadoria\.derivation_rule_degree_map enable row level security/i,
    );
    expect(
      /create policy[^;]*on curadoria\.derivation_rule_degree_map/i.test(PONTE_CODIGO),
      "uma policy abriu a correspondência.",
    ).toBe(false);
    expect(/\bgrant\b/i.test(PONTE_CODIGO), "a ponte concedeu privilégio a alguém").toBe(false);
    expect(PONTE_CODIGO).toMatch(
      /revoke execute on function curadoria\.emitir_proposta_de_importancia[\s\S]*from public/i,
    );
  });

  it("o emissor é SECURITY INVOKER com search_path fixo", () => {
    const emissor = PONTE_CODIGO.split(/function curadoria\.emitir_proposta_de_importancia/i)[1] ?? "";
    expect(
      /security\s+definer/i.test(emissor),
      "o emissor virou SECURITY DEFINER — elevaria autoridade para escrever.",
    ).toBe(false);
    expect(emissor).toMatch(/set search_path\s*=\s*curadoria,\s*pg_temp/i);
  });

  it("a migration não semeia regra, correspondência nem proposta", () => {
    for (const semeadura of [
      /insert\s+into\s+curadoria\.derivation_rules\b/i,
      /insert\s+into\s+curadoria\.derivation_rule_degree_map/i,
      /insert\s+into\s+curadoria\.derivation_rule_transitions/i,
    ]) {
      expect(
        semeadura.test(PONTE_CODIGO),
        "A primeira regra vigente exige identidade técnica da Autoridade, que não existe (impedimento declarado).",
      ).toBe(false);
    }
  });
});

describe("C-12 · A correspondência é DADO versionado, nunca `case` em código", () => {
  it("a tabela existe e é chaveada por (regra, versão, conceito, grau)", () => {
    expect(PONTE_CODIGO).toMatch(/create table[^;]*curadoria\.derivation_rule_degree_map/i);
    expect(PONTE_CODIGO).toMatch(
      /primary key\s*\(\s*rule_id,\s*rule_version,\s*subcriterion_code,\s*degree\s*\)/i,
    );
  });

  it("nenhuma migration traduz grau em importância por lógica embutida", () => {
    // Um `case when degree = 'ESSENCIAL' then 'MUITO_IMPORTANTE'` seria a
    // correspondência voltando a viver em código, fora de qualquer versão.
    for (const sql of MIGRATIONS_CODIGO) {
      expect(
        /when\s+[^;]{0,40}'(ESSENCIAL|PESA_MUITO|DESEJAVEL|SEM_PREFERENCIA)'[^;]{0,80}then\s+'(MUITO_IMPORTANTE|IMPORTANTE|RELEVANTE|POUCO_IMPORTANTE|NAO_INFLUENCIA)'/i.test(
          sql,
        ),
        "A tradução voltou a ser lógica embutida: ela precisa ser DADO versionado (ADR-066 §15).",
      ).toBe(false);
    }
  });

  it("nenhum módulo de `src/` traduz grau em importância", () => {
    expect(
      ocorrencias(
        FONTES,
        /(ESSENCIAL|PESA_MUITO)\s*:\s*["'](MUITO_IMPORTANTE|IMPORTANTE|RELEVANTE|POUCO_IMPORTANTE|NAO_INFLUENCIA)["']/,
      ),
      "A ponte nasceu em código, fora da regra versionada.",
    ).toEqual([]);
  });
});

describe("C-13 · As duas escalas continuam disjuntas", () => {
  it("nenhum valor de grau é valor de importância, e vice-versa", async () => {
    const { NEED_DEGREES } = await import("@/modules/curadoria/protocolos");
    const { IMPORTANCE_LEVELS } = await import("@/modules/curadoria/mapa-prioridades");
    const comuns = (NEED_DEGREES as readonly string[]).filter((g) =>
      (IMPORTANCE_LEVELS as readonly string[]).includes(g),
    );
    expect(
      comuns,
      "As escalas voltaram a ter valor em comum — a colisão da migration 20260801140000.",
    ).toEqual([]);
  });

  it("a migration da ponte declara as duas listas fechadas, separadas", () => {
    expect(PONTE_CODIGO).toMatch(
      /degree[\s\S]{0,120}'ESSENCIAL',\s*'PESA_MUITO',\s*'DESEJAVEL',\s*'SEM_PREFERENCIA'/i,
    );
    expect(PONTE_CODIGO).toMatch(
      /importance[\s\S]{0,160}'MUITO_IMPORTANTE',\s*'IMPORTANTE',\s*'RELEVANTE',\s*'POUCO_IMPORTANTE',\s*'NAO_INFLUENCIA'/i,
    );
  });
});

// ===========================================================================
// PACOTE 2.2C-R1 — PARTICIPAÇÃO DO MOTOR E UNICIDADE POR CONCEITO
//
// ┌ C-14 — A participação no Motor tem UMA fonte, e ela é o Catálogo
// │ Objetivo ......... impedir o retorno do `Record` manual, de uma segunda
// │                    fonte qualquer, ou do uso de `cruzamento` como atalho.
// │ Princípio ........ ADR-066 §16: o fato é de domínio, logo é do Catálogo.
// │ Falha ............ duas listas divergem em silêncio e o Motor passa a
// │                    responder por conceito que o método excluiu dele.
// ├ C-15 — A unicidade por conceito é do BANCO, e não arbitra por nome
// │ Princípio ........ 2.2C-R1: as DUAS portas, arbitragem declarativa, e
// │                    recusa explícita em vez de escolha silenciosa.
// └ C-16 — O que o pacote NÃO fez continua não feito
//   Princípio ........ `SEM_CORRESPONDENCIA` é reserva declarada; nenhuma
//                      regra real foi materializada; a Fronteira Humana não
//                      nasceu de carona.
// ===========================================================================

const R1C_SQL = MIGRATIONS.filter((arquivo) =>
  /participacao_do_motor_e_unicidade_por_conceito/i.test(arquivo),
).map((arquivo) => readFileSync(arquivo, "utf8"));

const R1C_CODIGO = R1C_SQL.join("\n").replace(/^\s*--.*$/gm, "");

/**
 * Toda função `curadoria.*` definida em migrations, na sua ÚLTIMA definição.
 * `create or replace` numa migration posterior é evolução legítima: auditar a
 * primeira seria reprovar o repositório pelo código que ele já substituiu.
 */
function funcoesVigentes(): Map<string, string> {
  const sql = MIGRATIONS.sort()
    .map((arquivo) => semComentarios(readFileSync(arquivo, "utf8")))
    .join("\n");
  const nomes = new Set(
    [...sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+curadoria\.(\w+)/gi)].map(
      (m) => m[1] as string,
    ),
  );
  return new Map([...nomes].map((nome) => [nome, corpoDaFuncao(sql, nome)]));
}

/** O validador do conceito, na sua ÚLTIMA definição — a que de fato vigora. */
const VALIDADOR_VIGENTE = corpoDaFuncao(
  MIGRATIONS.filter((arquivo) =>
    /function curadoria\.valida_conceito_da_correspondencia/i.test(readFileSync(arquivo, "utf8")),
  )
    .sort()
    .map((arquivo) => readFileSync(arquivo, "utf8").replace(/^\s*--.*$/gm, ""))
    .join("\n"),
  "valida_conceito_da_correspondencia",
);

describe("C-14 · A participação no Motor tem uma única fonte (2.2C-R1)", () => {
  it("a migration existe — sem ela, tudo abaixo seria vácuo", () => {
    expect(R1C_SQL.length, "a migration do 2.2C-R1 sumiu").toBe(1);
    expect(R1C_CODIGO).toMatch(/add column if not exists motor_participation/i);
  });

  it("o `Record` manual não voltou, em nenhum arquivo", () => {
    expect(
      ocorrencias(FONTES, /const\s+MOTOR_PARTICIPATION\s*:\s*Record/),
      "O Record manual voltou: duas fontes para o mesmo fato, divergindo em silêncio.",
    ).toEqual([]);
  });

  it("nenhuma lista literal de conceitos `NUNCA` mora em código", () => {
    // Três nomes canônicos numa mesma expressão é a assinatura da lista manual
    // — mesmo travestida de `Set`, de `array` ou de `switch`.
    expect(
      ocorrencias(
        FONTES,
        /VIABILIDADE_CUSTO_E_PAGAMENTO[\s\S]{0,200}VIABILIDADE_COBERTURA_E_CONVENIO[\s\S]{0,200}MODELO_PREFERENCIAS_E_RESTRICOES/,
      ),
      "A lista de conceitos fora do Motor reapareceu em código.",
    ).toEqual([]);
  });

  it("o valor consumido vem do Catálogo gerado, não de constante local", () => {
    const evidencias = readFileSync(
      path.join(RAIZ, "src", "modules", "curadoria", "evidencias-pratica.ts"),
      "utf8",
    );
    expect(evidencias, "o módulo parou de ler o atributo gerado").toMatch(
      /entry\.motorParticipation/,
    );
    const gerado = readFileSync(
      path.join(RAIZ, "src", "modules", "curadoria", "catalogo-gerado.ts"),
      "utf8",
    );
    expect(gerado, "o atributo saiu do Catálogo gerado").toMatch(/motorParticipation/);
  });

  it("o gerador e o portão de paridade projetam EXATAMENTE as mesmas colunas", () => {
    // Mencionar a coluna não basta — a primeira versão desta guarda passava com
    // o gerador já mutilado, porque o nome sobrevivia num comentário e num
    // `linha.motor_participation`. O que decide o hash é a LISTA DE PROJEÇÃO.
    const projecao = (arquivo: string): string => {
      const fonte = readFileSync(path.join(RAIZ, ...arquivo.split("/")), "utf8");
      const achado = fonte.match(/'code, "group", name[^']*'/);
      expect(achado, `lista de projeção não encontrada em ${arquivo}`).not.toBeNull();
      return (achado?.[0] ?? "").replace(/\s+/g, " ");
    };

    const doGerador = projecao("scripts/gerar-catalogo-ts.mjs");
    const doPortao = projecao("tests/remediacao/paridade-catalogo.integration.test.ts");

    expect(doGerador, "o gerador parou de projetar a participação no Motor").toContain(
      "motor_participation",
    );
    expect(
      doPortao,
      "o portão recompõe a carga com colunas diferentes das do gerador: o hash passaria a comparar dois Catálogos distintos.",
    ).toBe(doGerador);
  });

  it("`cruzamento` não foi reutilizado como substituto da participação", () => {
    expect(
      ocorrenciasNoCodigo(
        FONTES,
        /cruzamento\s*(===?|!==?)[\s\S]{0,120}(MotorParticipation|motorParticipation|DIRETO|INDIRETO|NUNCA)/,
      ),
      "`cruzamento` virou proxy da participação — são perguntas diferentes.",
    ).toEqual([]);
    expect(
      /cruzamento/i.test(VALIDADOR_VIGENTE),
      "o validador do conceito voltou a consultar `cruzamento`.",
    ).toBe(false);
  });

  it("a recusa do conceito `NUNCA` está no VALIDADOR, e cita a participação", () => {
    expect(VALIDADOR_VIGENTE.length, "o validador não foi encontrado").toBeGreaterThan(200);
    expect(VALIDADOR_VIGENTE).toMatch(/motor_participation\s*=\s*'NUNCA'/i);
    expect(VALIDADOR_VIGENTE).toMatch(/raise exception/i);
  });

  it("a heurística por eixo foi EMBORA — ela era a segunda fonte", () => {
    expect(
      /axis\s*=\s*'VIABILIDADE_DE_ACESSO'/i.test(VALIDADOR_VIGENTE),
      "o eixo voltou a decidir participação: duas fontes para a mesma pergunta.",
    ).toBe(false);
  });

  it("o emissor recusa o conceito `NUNCA` pela mesma coluna", () => {
    expect(CORPO_DO_EMISSOR).toMatch(/motor_participation\s*=\s*'NUNCA'/i);
    expect(CORPO_DO_EMISSOR).toMatch(/CONCEITO_SEM_PONTE/);
  });

  it("todo conceito ativo é obrigado a declarar — e a obrigação é CHECK", () => {
    expect(R1C_CODIGO).toMatch(/method_subcriteria_ativo_declara_motor/);
    expect(R1C_CODIGO).toMatch(/check\s*\(\s*not active or motor_participation is not null\s*\)/i);
  });

  it("a mudança do Catálogo passou pelo `catalog_guard`, com justificativa", () => {
    expect(
      R1C_CODIGO,
      "o Catálogo foi alterado sem registrar a razão: o guarda existe para isso.",
    ).toMatch(/set_config\(\s*'curadoria\.catalog_change_rationale'/);
    expect(R1C_CODIGO).toMatch(/ADR-066/);
  });
});

describe("C-15 · A unicidade por conceito é do banco (2.2C-R1)", () => {
  it("a tabela de ocupação existe, e é a árbitra declarativa", () => {
    expect(R1C_CODIGO).toMatch(/create table[^;]*curadoria\.derivation_concept_vigencia/i);
    expect(
      R1C_CODIGO,
      "sem chave primária composta não há arbitragem: sobra disciplina.",
    ).toMatch(/primary key\s*\(\s*subcriterion_code\s*,\s*ocupacao_seq\s*\)/i);
  });

  it("as DUAS portas existem — cobrir depois de vigorar é o caminho esquecido", () => {
    expect(R1C_CODIGO, "porta 1 (promoção/reativação) sumiu").toMatch(
      /function curadoria\.ocupa_conceitos_da_versao/i,
    );
    expect(R1C_CODIGO, "porta 2 (correspondência em versão vigente) sumiu").toMatch(
      /function curadoria\.ocupa_conceito_por_correspondencia/i,
    );
    expect(R1C_CODIGO).toMatch(/create trigger[^;]*on curadoria\.derivation_rule_transitions/i);
    expect(R1C_CODIGO).toMatch(/create trigger[^;]*on curadoria\.derivation_rule_degree_map/i);
  });

  it("a ocupação é append-only, como todo o resto do ciclo de vida", () => {
    expect(R1C_CODIGO).toMatch(/derivation_concept_vigencia_append_only/);
    expect(R1C_CODIGO).toMatch(/curadoria\.recusa_alteracao_de_regra/);
  });

  it("o emissor não arbitra por nome — e a remoção não é só de comentário", () => {
    expect(
      /order\s+by\s+r?\.?rule_id/i.test(CORPO_DO_EMISSOR),
      "A arbitragem por nome voltou: escolher regra por ordem alfabética é o oposto de método.",
    ).toBe(false);
    expect(
      CORPO_DO_EMISSOR,
      "sem a contagem, duas regras vigentes voltariam a degradar em escolha silenciosa.",
    ).toMatch(/candidatas\s*>\s*1/);
    expect(CORPO_DO_EMISSOR).toMatch(/INVARIANTE VIOLADO/);
  });

  it("NENHUMA função vigente do schema arbitra regra por nome", () => {
    // A pergunta é sobre o estado EFETIVO do banco, não sobre o histórico: a
    // 2.2C definiu o emissor com `order by r.rule_id` e a 2.2C-R1 o
    // substituiu. Auditar o arquivo antigo seria reprovar código já morto.
    const vigentes = funcoesVigentes();
    expect(vigentes.size, "nenhuma função foi encontrada — a varredura falhou").toBeGreaterThan(5);

    const arbitram = [...vigentes]
      .filter(([, corpo]) => /order\s+by\s+r?\.?rule_id\b/i.test(corpo))
      .map(([nome]) => nome);
    expect(arbitram, "alguma função vigente voltou a escolher a regra pelo nome.").toEqual([]);

    // A varredura enxerga o emissor — sem isto, o vazio acima seria vácuo.
    expect([...vigentes.keys()]).toContain("emitir_proposta_de_importancia");
  });

  it("a proteção NÃO é de aplicação: nada em `src` guarda a unicidade", () => {
    expect(
      ocorrencias(FONTES, /derivation_concept_vigencia/),
      "a unicidade virou responsabilidade da aplicação — o banco é que a garante.",
    ).toEqual([]);
  });

  it("a tabela de ocupação nasce inerte: RLS ligada e sem privilégio concedido", () => {
    expect(R1C_CODIGO).toMatch(
      /alter table curadoria\.derivation_concept_vigencia enable row level security/i,
    );
    expect(R1C_CODIGO).toMatch(/revoke all[\s\S]{0,120}derivation_concept_vigencia/i);
    expect(/\bgrant\b/i.test(R1C_CODIGO), "o pacote concedeu privilégio a alguém").toBe(false);
  });
});

describe("C-16 · O que o 2.2C-R1 não fez continua não feito", () => {
  it("`SEM_CORRESPONDENCIA` continua no contrato, declarado como reserva", () => {
    expect(CORPO_DO_EMISSOR).toMatch(/SEM_CORRESPONDENCIA/);
    expect(
      R1C_CODIGO,
      "o desfecho deixou de ser declarado reserva: viraria fluxo sem decisão registrada.",
    ).toMatch(/RESERVA NAO OPERACIONAL/i);
  });

  it("a cobertura total dos quatro graus continua obrigatória", () => {
    // `drop trigger if exists` seguido de `create trigger` no MESMO arquivo é
    // o padrão idempotente de sempre. O que afrouxaria a cobertura é a última
    // migration que fala do trigger deixá-lo derrubado.
    const falam = MIGRATIONS.filter((arquivo) =>
      /derivation_rule_degree_map_cobertura/.test(semComentarios(readFileSync(arquivo, "utf8"))),
    ).sort();
    expect(falam.length, "o trigger de cobertura total sumiu do repositório").toBeGreaterThan(0);

    const ultima = semComentarios(readFileSync(falam[falam.length - 1] as string, "utf8"));
    expect(
      /create constraint trigger derivation_rule_degree_map_cobertura/i.test(ultima),
      "a última migration que toca o trigger o deixou derrubado: seria fabricar o ramo em vez de alcançá-lo.",
    ).toBe(true);
    // Deferido: as quatro linhas entram na mesma transação, em qualquer ordem.
    // Sem isso a cobertura total seria inalcançável, e o ramo viraria rotina.
    expect(ultima).toMatch(/deferrable initially deferred/i);

    // E o validador que ele chama continua exigindo os quatro graus.
    const validador = funcoesVigentes().get("exige_cobertura_total_dos_graus") ?? "";
    expect(validador, "o validador de cobertura não foi encontrado").toMatch(
      /Correspondencia incompleta/i,
    );
  });

  it("nenhuma regra de derivação real foi materializada", () => {
    expect(
      ocorrencias(MIGRATIONS, /insert into curadoria\.derivation_rules/i),
      "uma regra foi semeada por migration, sem identidade técnica da Autoridade de Método.",
    ).toEqual([]);
    expect(
      ocorrencias(MIGRATIONS, /insert into curadoria\.derivation_rule_degree_map/i),
      "uma correspondência real foi semeada por migration.",
    ).toEqual([]);
  });

  it("a Fronteira Humana não nasceu de carona", () => {
    const INTERFACE = FONTES.filter(
      (arquivo) =>
        arquivo.includes(`${path.sep}app${path.sep}`) ||
        arquivo.includes(`${path.sep}components${path.sep}`),
    );
    expect(
      ocorrencias(INTERFACE, /derivation_(proposals|rules|concept_vigencia|rule_degree_map)/),
      "nasceu tela sobre a Camada de Derivação antes da Fronteira Humana ser decidida.",
    ).toEqual([]);
  });
});
