import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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

  it("nenhum módulo do código conhece propostas de derivação persistidas", () => {
    expect(ocorrencias(FONTES, /derivation_proposals|derivationProposal/i)).toEqual([]);
  });

  it("nenhum módulo persiste 'proposta' como estado de domínio", () => {
    expect(
      ocorrencias(FONTES, /\bPROPOSTA\b\s*[:=]|status\s*[:=]\s*["']PROPOSTA["']/),
      "Um estado PROPOSTA persistido é a Camada de Derivação nascendo sem fronteira humana.",
    ).toEqual([]);
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
 * O mesmo, para TypeScript.
 *
 * A guarda C-05 nasceu acusando o próprio `ciclo-de-vida-da-regra.ts`, cujo
 * comentário diz — corretamente — que a leitura derivada **não** consulta
 * `derivation_rules.state`. Guarda que cai sobre a frase que a cumpre não
 * protege nada; ela só ensina a não escrever a frase. O que se procura é
 * LEITURA, e leitura mora em código.
 */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
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
