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
    // MUDANÇA DE CONTRATO LAVRADA — CONTRATO_1_12 §10/§14 (PA-12). O `state`
    // decisório da proposta passou a ser PROJEÇÃO do ato humano, atualizada
    // pelo trigger `projetar_estado_da_proposta` disparado pelo INSERT em
    // `derivation_proposal_acts`. Esse trigger É um escritor do `state` — o
    // ÚNICO legítimo além do emissor, e a cerca
    // `protege_estado_decisorio` garante que nenhum outro caminho o produz.
    const [escritores] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhum)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ~* '(insert|update|delete)[[:space:]]+(into[[:space:]]+)?curadoria\\.derivation_proposals'
    `);
    expect(escritores![0], "nasceu um escritor de propostas fora da lavratura").toBe(
      // ABERTURA 2.C (PA-17, RS-2.C-1): o emissor PROFISSIONAL é o segundo
      // emissor NOMINAL (C-11 evoluída) — mas o braço de INSERT dele é
      // INALCANÇÁVEL até a forma da correspondência ser lavrada (PA-13
      // §10.2): vazio-honesto, ele ainda NÃO figura entre os escritores
      // vivos. Quando a emenda ativar o braço, esta lista evolui para TRÊS.
      // EMENDA DR3: o emissor PROFISSIONAL passou a escrever de verdade — o
      // braco de emissao foi conectado ao DR3 pela emenda lavrada. Sao TRES
      // escritores nominais; um QUARTO nome derruba.
      "emitir_proposta_de_estado,emitir_proposta_de_importancia,projetar_estado_da_proposta",
    );

    // C-01d(4) — CONTRATO_1_12 §14: o conjunto de funções que alcançam
    // `derivation_proposals` passa a QUATRO capabilities nominais
    // {emissor · leitora individual · leitora agregada · decisora}, mais o
    // trigger de projeção que a decisora dispara. Um SEXTO nome derruba este
    // oráculo como o quarto sempre derrubou:
    //   · `ler_proposta_para_proveniencia` — auditoria individual (1.8-R1);
    //   · `contar_propostas_por_desfecho` — agregação do painel (1.11);
    //   · `decidir_proposta` — o ato decisório da Fronteira (1.12), que LÊ a
    //     proposta com `for update` para a precondição transacional (§13) e
    //     nasce SEM grant algum (Onda 1B inerte).
    const [leitores] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhum)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ilike '%derivation_proposals%'
        and p.proname not in ('emitir_proposta_de_importancia', 'emitir_proposta_de_estado')
    `);
    expect(leitores![0], "nasceu função além do conjunto lavrado C-01d(4) + projeção").toBe(
      "contar_propostas_por_desfecho,decidir_proposta,ler_proposta_para_proveniencia,projetar_estado_da_proposta",
    );

    // A decisora é o que a lavratura diz: SECURITY DEFINER, VOLATILE (ela
    // escreve o ato), e INERTE — nenhum papel de aplicação a executa.
    const [contratoDaDecisora] = consultar(`
      select prosecdef || '/' || provolatile::text || '/' ||
        has_function_privilege('authenticated','curadoria.decidir_proposta(uuid,text,text)','execute') || '/' ||
        has_function_privilege('anon','curadoria.decidir_proposta(uuid,text,text)','execute') || '/' ||
        has_function_privilege('service_role','curadoria.decidir_proposta(uuid,text,text)','execute')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria' and p.proname = 'decidir_proposta'
    `);
    // ABERTURA 2.C (PA-17 §8): EXECUTE a authenticated — o único grant novo
    // do pacote; anon e service_role seguem sem nada.
    expect(contratoDaDecisora![0]).toBe("true/v/true/false/false");

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

  /**
   * ORÁCULO EVOLUÍDO PELO ITEM 1.12 (CONTRATO_1_12 §10, PA-12): "zero trigger"
   * valia enquanto o `state` não era projeção de nada. Agora a CERCA
   * `protege_estado_decisorio` vive na tabela — ela não opera a proposta,
   * ela IMPEDE que o estado decisório nasça por UPDATE direto. Proteção não é
   * pipeline (mesma distinção do MR1 da Regra). O trigger de PROJEÇÃO dispara
   * da tabela de ATOS, não desta.
   */
  it("o único trigger é a cerca do estado decisório — proteção, não operação", () => {
    const [linha] = consultar(`
      select coalesce(string_agg(tgname, ',' order by tgname), '(nenhum)')
      from pg_trigger
      where tgrelid = '${TABELA}'::regclass and not tgisinternal
    `);
    expect(linha![0]).toBe("derivation_proposals_estado_decisorio_so_pelo_ato");
  });
});
