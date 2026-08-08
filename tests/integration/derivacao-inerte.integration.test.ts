// ITEM 2.1 — A ESTRUTURA EXISTE, E NÃO FAZ NADA.
//
// A Arquitetura §15.0 proíbe "derivação persistida ou consumida" antes das dez
// dependências existirem simultaneamente. `derivation_proposals` é a PRIMEIRA
// dessas dez: criá-la vazia não é persistir derivação — é fazer existir aquilo
// que, junto das outras nove, um dia autorizará a 2.C.
//
// O que este arquivo prova é a diferença entre as duas coisas. A estrutura está
// lá, com os doze itens da ADR-066 §14 e os cinco estados do §11; e ninguém a
// alcança: zero linha, zero policy, RLS ligada, nenhum grant a papel de
// aplicação.
//
// A leitura é por `psql` dentro do container, no idioma de
// `canonical-function-grants.integration.test.ts`: a tabela não tem grant nem
// para `service_role`, então nenhum cliente da aplicação consegue sequer
// contá-la — o que é, em si, a prova mais forte de inércia que se pode ter.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";
const TABELA = "curadoria.derivation_proposals";

function consultar(sql: string): string[][] {
  const saida = execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-c", sql],
    { encoding: "utf-8" },
  );
  return saida
    .trim()
    .split(/\r?\n/)
    .filter((linha) => linha.length > 0)
    .map((linha) => linha.split("|"));
}

describe("2.1 · a estrutura existe", () => {
  it("a tabela foi criada", () => {
    const [linha] = consultar(`select to_regclass('${TABELA}') is not null`);
    expect(linha![0]).toBe("t");
  });

  it("carrega os doze itens obrigatórios da ADR-066 §14, todos not null", () => {
    const colunas = new Map(
      consultar(`
        select column_name, is_nullable
        from information_schema.columns
        where table_schema='curadoria' and table_name='derivation_proposals'
      `).map(([nome, anulavel]) => [nome!, anulavel!]),
    );

    // Itens 1, 3, 8, 9, 10, 11, 12 e o conceito/campo do item 2.
    for (const obrigatorio of [
      "id",
      "subcriterion_code",
      "target_field",
      "suggested_value",
      "origin_record",
      "origin_version",
      "origin_declared_at",
      "origin_author",
      "rule_id",
      "rule_version",
      "emitted_at",
      "catalog_version",
      "consequence_degree",
      "state",
    ]) {
      expect(colunas.has(obrigatorio), `falta a coluna ${obrigatorio}`).toBe(true);
      expect(colunas.get(obrigatorio), `${obrigatorio} aceita nulo`).toBe("NO");
    }

    // O alvo (item 2) é anulável por coluna porque é UM dos dois — a exclusão
    // mútua vive no CHECK, provado abaixo.
    expect(colunas.get("case_id")).toBe("YES");
    expect(colunas.get("professional_profile_id")).toBe("YES");
  });

  it("os cinco estados do §11 são a lista fechada — e PENDENTE não é estado", () => {
    const [linha] = consultar(`
      select pg_get_constraintdef(oid)
      from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%state%'
    `);
    const check = linha![0]!;

    for (const estado of ["PROPOSTA", "CONFIRMADA", "RECUSADA", "SUPERADA", "RETIRADA"]) {
      expect(check, estado).toContain(estado);
    }
    // ADR-066 §11(a): "pendente" é leitura operacional de PROPOSTA, não estado.
    expect(check).not.toContain("PENDENTE");
  });

  it("o alvo é UM: ou o Case, ou o profissional — nunca os dois, nunca nenhum", () => {
    const alvo = consultar(`
      select pg_get_constraintdef(oid)
      from pg_constraint
      where conrelid = '${TABELA}'::regclass
        and conname = 'derivation_proposals_alvo_unico'
    `);
    expect(alvo).toHaveLength(1);
  });
});

describe("2.1 · e permanece INERTE", () => {
  it("zero linhas — a estrutura nasceu vazia e assim está", () => {
    const [linha] = consultar(`select count(*) from ${TABELA}`);
    expect(linha![0]).toBe("0");
  });

  it("zero policies, com RLS ligada: `anon` e `authenticated` não a alcançam", () => {
    const [rls] = consultar(`
      select relrowsecurity, (select count(*) from pg_policies where tablename='derivation_proposals')
      from pg_class where relname='derivation_proposals'
    `);

    expect(rls![0], "RLS não está habilitada").toBe("t");
    expect(rls![1], "alguém abriu uma policy antes das dez dependências").toBe("0");
  });

  it("nenhum grant a papel de aplicação — nem leitura, nem escrita", () => {
    const [privilegios] = consultar(`
      select
        has_table_privilege('anon', '${TABELA}', 'select'),
        has_table_privilege('anon', '${TABELA}', 'insert'),
        has_table_privilege('authenticated', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'insert'),
        has_table_privilege('service_role', '${TABELA}', 'select'),
        has_table_privilege('service_role', '${TABELA}', 'insert')
    `);

    for (const [indice, quem] of [
      "anon select",
      "anon insert",
      "authenticated select",
      "authenticated insert",
      "service_role select",
      "service_role insert",
    ].entries()) {
      expect(privilegios![indice], `${quem} alcança a estrutura`).toBe("f");
    }
  });

  /**
   * ORÁCULO SUBSTITUÍDO NO ITEM 2.2C — registro da substituição.
   *
   * CONTRATO ANTERIOR (2.1): *"zero escritor e zero leitor: nenhuma função do
   * banco menciona a estrutura"*. Correto enquanto a Camada de Derivação não
   * tinha como nascer — a ADR-066 ainda não estava lavrada e não havia regra
   * versionada para sustentar oferecimento algum.
   *
   * CONTRATO NOVO (2.2C): *"existe EXATAMENTE UM emissor autorizado, e ele
   * produz somente proposta inerte"*. A ponte grau → importância é o produto
   * do Item 2.2C, e um emissor é o que ela é — contar zero passaria a proibir
   * o pacote que o DT-01 autorizou.
   *
   * POR QUE A SUBSTITUIÇÃO É CONSEQUÊNCIA DIRETA DO 2.2C, e não conveniência:
   * sem escritor não há proposta; sem proposta não há Fronteira Humana; e a
   * ADR-066 §15 define a ponte justamente como **produtora de oferecimento**.
   *
   * O QUE CONTINUA PROIBIDO, e é o que estas asserções guardam:
   *   · um SEGUNDO escritor — a guarda nomeia o único permitido;
   *   · qualquer LEITOR — nenhuma função consome propostas para produzir
   *     leitura canônica (A2 / AC-PIPELINE);
   *   · policy, grant ou alcance por papel de aplicação (asserções acima).
   */
  it("existe exatamente UM emissor autorizado, e nenhum leitor", () => {
    const [escritores] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhum)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ~* '(insert|update|delete)[[:space:]]+(into[[:space:]]+)?curadoria\\.derivation_proposals'
    `);
    expect(escritores![0], "nasceu um segundo escritor de propostas").toBe(
      "emitir_proposta_de_importancia",
    );

    // MUDANÇA DE CONTRATO LAVRADA — 1.8-R1 §21 (`78e261c`) e agora
    // CONTRATO_1_11 §3 (`ca49293`). Ler propostas para produzir leitura
    // canônica continua proibido (A2). O que as lavraturas criaram foram
    // LEITORES DE CAPABILITY — ambos SECURITY DEFINER, STABLE, EXECUTE só de
    // service_role, nunca alimentando o Pipeline de Leitura:
    //   · `ler_proposta_para_proveniencia` — auditoria individual (1.8-R1);
    //   · `contar_propostas_por_desfecho` — agregação observacional sem
    //     dimensão pessoal, para o Painel de Discordância (1.11).
    // O conjunto fechado passa a ser { escritor, leitor individual, leitor
    // agregado }, e um QUARTO nome derruba este oráculo como sempre derrubou
    // (§21.7; guarda C-01d cobre chamadores e o trio em unitário).
    const [leitores] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhum)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ilike '%derivation_proposals%'
        and p.proname <> 'emitir_proposta_de_importancia'
    `);
    expect(leitores![0], "nasceu função além do trio lavrado escritor/leitores").toBe(
      "contar_propostas_por_desfecho,ler_proposta_para_proveniencia",
    );

    // E cada leitor é o que a lavratura diz: definer, estável, fora do alcance
    // dos papéis de aplicação — a tabela continua fechada a todos eles.
    const [contratoDoLeitor] = consultar(`
      select prosecdef || '/' || provolatile::text || '/' ||
        has_function_privilege('service_role','curadoria.ler_proposta_para_proveniencia(uuid,text)','execute') || '/' ||
        has_function_privilege('authenticated','curadoria.ler_proposta_para_proveniencia(uuid,text)','execute') || '/' ||
        has_table_privilege('service_role','curadoria.derivation_proposals','select')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria' and p.proname = 'ler_proposta_para_proveniencia'
    `);
    expect(contratoDoLeitor![0]).toBe("true/s/true/false/false");

    const [contratoDoAgregado] = consultar(`
      select prosecdef || '/' || provolatile::text || '/' ||
        has_function_privilege('service_role','curadoria.contar_propostas_por_desfecho()','execute') || '/' ||
        has_function_privilege('authenticated','curadoria.contar_propostas_por_desfecho()','execute') || '/' ||
        has_table_privilege('service_role','curadoria.derivation_proposals','select')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria' and p.proname = 'contar_propostas_por_desfecho'
    `);
    expect(contratoDoAgregado![0]).toBe("true/s/true/false/false");
  });

  it("o emissor não alcança papel de aplicação — a estrutura segue inerte", () => {
    for (const papel of ["anon", "authenticated", "service_role"]) {
      const [linha] = consultar(`
        select has_function_privilege('${papel}',
          'curadoria.emitir_proposta_de_importancia(uuid,text,uuid)', 'EXECUTE')::text
      `);
      expect(linha![0], `${papel} executa o emissor`).toBe("false");
    }
  });

  it("zero trigger — nada dispara a partir dela", () => {
    const [linha] = consultar(`
      select count(*) from pg_trigger
      where tgrelid = '${TABELA}'::regclass and not tgisinternal
    `);
    expect(linha![0]).toBe("0");
  });
});
