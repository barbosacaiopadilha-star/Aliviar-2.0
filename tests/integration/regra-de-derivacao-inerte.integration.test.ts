// ITEM 2.2A — A REGRA TEM DONO, E A ESTRUTURA NÃO FAZ NADA.
//
// A Arquitetura §10.5 corrige o bloqueador B5 com uma frase que é o pacote
// inteiro: "uma regra sem dono é a pior forma de automação — ninguém a propôs,
// ninguém a aprovou, ninguém pode suspendê-la, e, quando errar, ninguém
// responde".
//
// O que este arquivo prova é que a exigência virou impossibilidade de gravar,
// não recomendação: uma regra `VIGENTE` sem Autoridade de Método e sem ADR é
// RECUSADA PELO BANCO. E que, apesar de existir, a estrutura permanece inerte —
// zero linha, zero policy, nenhum grant, nem para `service_role`.
//
// A leitura é por `psql` no container, no idioma de
// `canonical-function-grants.integration.test.ts`: sem grant, nenhum cliente da
// aplicação alcança a tabela — o que é, em si, a prova de inércia.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";
import { containerDoBanco } from "../apoio/stack-local";

const CONTAINER = containerDoBanco();
const TABELA = "curadoria.derivation_rules";

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

/** Tenta gravar e devolve o erro do banco, se houver. Sempre desfaz. */
function tentarGravar(colunas: string, valores: string): string | null {
  try {
    execFileSync(
      "docker",
      [
        "exec",
        CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        `begin; insert into ${TABELA} (${colunas}) values (${valores}); rollback;`,
      ],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return null;
  } catch (erro) {
    return String((erro as { stderr?: Buffer }).stderr ?? erro);
  }
}

const AUTOR = "'00000000-0000-4000-8000-000000000001'::uuid";
const BASE_COLUNAS = "rule_id, version, state, proposed_by, rationale, evidence";

describe("2.2A · a estrutura da Regra existe", () => {
  it("a tabela foi criada", () => {
    const [linha] = consultar(`select to_regclass('${TABELA}') is not null`);
    expect(linha![0]).toBe("t");
  });

  it("carrega os dez atributos obrigatórios do §10.5", () => {
    const colunas = new Set(
      consultar(`
        select column_name from information_schema.columns
        where table_schema='curadoria' and table_name='derivation_rules'
      `).map(([nome]) => nome!),
    );

    for (const atributo of [
      "rule_id", // identificador
      "version", // versão
      "effective_from", // vigência (início)
      "effective_to", // vigência (fim)
      "proposed_by", // autor proponente
      "approved_by", // autoridade aprovadora
      "approval_adr", // a ADR que aprovou
      "rationale", // justificativa
      "evidence", // evidência utilizada
      "state", // estado
      "suspended_or_revoked_at", // data de suspensão/revogação
      "created_at", // histórico
    ]) {
      expect(colunas.has(atributo), `falta o atributo ${atributo}`).toBe(true);
    }
  });

  it("os QUATRO estados do §10.5 são a lista fechada", () => {
    // O Postgres reescreve `state in (...)` como `state = ANY (ARRAY[...])`.
    // O que se procura é o CHECK que fala de `state` e enumera valores.
    // `and ... like '%REVOGADA%'` entrou no 2.2B: a tabela ganhou um segundo
    // CHECK que fala de `state` (`..._nasce_em_proposta`, ADR-069 §9). Quem
    // enumera os QUATRO estados é o que também menciona REVOGADA.
    const [linha] = consultar(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype='c'
        and pg_get_constraintdef(oid) like '%PROPOSTA%'
        and pg_get_constraintdef(oid) like '%REVOGADA%'
    `);
    expect(linha, "nenhum CHECK enumera os estados da Regra").toBeTruthy();
    const check = linha![0]!;

    for (const estado of ["PROPOSTA", "VIGENTE", "SUSPENSA", "REVOGADA"]) {
      expect(check, estado).toContain(estado);
    }
    // Nem mais, nem menos: os estados da PROPOSTA (ADR-066 §11) não entram aqui.
    for (const alheio of ["CONFIRMADA", "SUPERADA", "RETIRADA"]) {
      expect(check, alheio).not.toContain(alheio);
    }
  });

  it("o histórico é append-only: a chave é (identificador, versão)", () => {
    const [linha] = consultar(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype='p'
    `);
    expect(linha![0]).toMatch(/PRIMARY KEY \(rule_id, version\)/i);
  });
});

/**
 * A3 MUDOU DE LUGAR NO ITEM 2.2B — e a exigência ficou MAIS forte.
 *
 * A 2.2A exigia autoridade, ADR e vigência de uma versão que NASCESSE VIGENTE.
 * A ADR-069 §9 fechou esse nascimento: nenhuma versão nasce vigente, e vigorar
 * passou a ser um ATO posterior e separado. O CHECK original não é removido
 * (§15: preservá-lo ou não é do implementador, e foi preservado como cinto de
 * segurança), mas ficou **vacuamente verdadeiro** — e um oráculo que o exercita
 * inserindo VIGENTE deixou de ter caminho.
 *
 * FORTALECIMENTO: antes, quem tivesse os três campos criava uma regra vigente
 * de uma vez. Agora precisa de dois atos, e o segundo exige **ADR na própria
 * transição** (`..._adr_quando_exigida`) — não há como vigorar sem passar pela
 * Autoridade. As provas do ato vivem em
 * `regra-de-derivacao-ciclo-de-vida.integration.test.ts`.
 */
describe("2.2A · A3 — a exigência de autoridade migrou para o ato (ADR-069 §15)", () => {
  it("o CHECK original foi PRESERVADO — nenhuma remoção silenciosa", () => {
    const [linha] = consultar(`
      select count(*) from pg_constraint
      where conrelid = '${TABELA}'::regclass
        and conname = 'derivation_rules_vigente_exige_autoridade'
    `);
    expect(linha![0], "o CHECK de autoridade foi removido em silêncio").toBe("1");
  });

  it("e ficou vacuamente verdadeiro: o caminho que ele guardava está fechado", () => {
    const erro = tentarGravar(
      `${BASE_COLUNAS}, approved_by, approval_adr, effective_from`,
      `'r4', 1, 'VIGENTE', ${AUTOR}, 'porque sim', 'nenhuma operacao real', ${AUTOR}, 'ADR-999', now()`,
    );
    // Nem com os três campos: quem recusa agora é o nascimento, antes dele.
    expect(erro, "uma versão nasceu vigente").not.toBeNull();
    expect(erro).toContain("derivation_rules_nasce_em_proposta");
  });

  it("a exigência real vive na transição: entrar em VIGENTE sem ADR é recusado", () => {
    const [linha] = consultar(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conrelid = 'curadoria.derivation_rule_transitions'::regclass
        and conname = 'derivation_rule_transitions_adr_quando_exigida'
    `);
    expect(linha, "a exigência de ADR não migrou para o ato").toBeTruthy();
    expect(linha![0]).toContain("approval_adr IS NOT NULL");
  });

  it("PROPOSTA nasce sem autoridade — é onde toda regra começa", () => {
    const erro = tentarGravar(
      BASE_COLUNAS,
      `'r5', 1, 'PROPOSTA', ${AUTOR}, 'sugerida por alguem', 'nenhuma operacao real'`,
    );
    expect(erro, "propor exigiria autoridade — mas propor é de qualquer papel interno").toBeNull();
  });

  it("suspender ou revogar exige dizer QUANDO deixou de valer", () => {
    for (const estado of ["SUSPENSA", "REVOGADA"]) {
      const erro = tentarGravar(
        BASE_COLUNAS,
        `'r6', 1, '${estado}', ${AUTOR}, 'motivo', 'nenhuma operacao real'`,
      );
      expect(erro, estado).not.toBeNull();
      expect(erro, estado).toContain("derivation_rules_fim_tem_data");
    }
  });
});

describe("2.2A · A4/A5 — e permanece INERTE", () => {
  it("nenhum exemplo semeado: a única regra é a LAVRADA pelo DT-01, nunca uma fixture", () => {
    // A estrutura nasceu vazia (A4/A5) e nenhuma migration de ESTRUTURA
    // semeia — isso não mudou. A REGRA 001 existe desde 2026-08-08 por ATO
    // do DT-01 (migration 20260808290000: dois INSERT numa transação, com
    // autoria humana real). A guarda passa a nomeá-la: qualquer OUTRA linha
    // aqui é semeadura, e derruba.
    const [linha] = consultar(`
      select coalesce(string_agg(rule_id || '@v' || version, ',' order by rule_id), '<nenhuma>')
      from ${TABELA}
    `);
    expect(linha![0]).toBe("CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA@v1");
  });

  it("zero policies com RLS ligada", () => {
    const [linha] = consultar(`
      select relrowsecurity, (select count(*) from pg_policies where tablename='derivation_rules')
      from pg_class where relname='derivation_rules'
    `);
    expect(linha![0], "RLS não está habilitada").toBe("t");
    expect(linha![1], "alguém abriu uma policy").toBe("0");
  });

  it("nenhum grant a papel de aplicação — nem `service_role` alcança", () => {
    const [p] = consultar(`
      select
        has_table_privilege('anon', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'insert'),
        has_table_privilege('service_role', '${TABELA}', 'select')
    `);
    for (const [i, quem] of [
      "anon select",
      "authenticated select",
      "authenticated insert",
      "service_role select",
    ].entries()) {
      expect(p![i], `${quem} alcança a Regra`).toBe("f");
    }
  });

  /**
   * MR1.1 mudou este oráculo, e a distinção importa.
   *
   * Ele exigia ZERO trigger e ZERO função — correto enquanto nada existia. O
   * endurecimento acrescentou um de cada, e nenhum dos dois OPERA a Regra: o
   * trigger só RECUSA `UPDATE` e `DELETE`, e a função só levanta a exceção.
   * Proteção não é pipeline.
   *
   * A guarda passa a nomear o que é permitido, em vez de contar zero — assim
   * um escritor de verdade nascendo aqui continua caindo.
   */
  it("os únicos triggers são as duas proteções, e nenhuma função OPERA a Regra", () => {
    // O 2.2B (ADR-069 §9) acrescentou o segundo, e ele também só RECUSA: um
    // constraint trigger DEFERIDO que confere, no commit, se a versão nasceu
    // com o seu ato de nascimento. Não cria transição, não promove, não escreve
    // — recusa a versão órfã e nada mais. Proteção não é pipeline.
    //
    // A guarda continua NOMEANDO o permitido, em vez de contar zero: um
    // escritor de verdade nascendo aqui continua caindo.
    const [triggers] = consultar(`
      select coalesce(string_agg(tgname, ',' order by tgname), '(nenhum)')
      from pg_trigger where tgrelid = '${TABELA}'::regclass and not tgisinternal
    `);
    expect(triggers![0], "um trigger que não é uma das duas proteções nasceu").toBe(
      "derivation_rules_append_only,derivation_rules_exige_transicao_inicial",
    );

    /**
     * ORÁCULO SUBSTITUÍDO NO ITEM 2.2C — registro da substituição.
     *
     * CONTRATO ANTERIOR (2.2A/MR1): *"nenhuma função MENCIONA a tabela"* —
     * correto enquanto nada podia lê-la. A guarda da proteção é genérica e
     * não a cita, então zero era alcançável.
     *
     * CONTRATO NOVO (2.2C): *"nenhuma função ESCREVE na Regra; a única que a
     * LÊ é o emissor da ponte, e ele só lê"*. A ponte precisa saber qual regra
     * está vigente — é a condição 5 da ADR-066 §16. Ler para decidir se pode
     * propor não é operar: operar seria criar, versionar, promover ou suspender.
     *
     * POR QUE É CONSEQUÊNCIA DIRETA DO 2.2C: sem ler a Regra, o emissor não
     * tem como cumprir "existe regra vigente" — e emitir sem verificar seria
     * exatamente o que a ADR-069 e o §16 proíbem.
     *
     * O QUE CONTINUA GUARDADO, e é o que importa: nenhuma função escreve na
     * Regra (o ciclo de vida continua sendo ato humano registrado em
     * transição), e o leitor autorizado é nomeado — um segundo cai aqui.
     */
    const [escritoras] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='curadoria'
        and p.prosrc ~* '(insert|update|delete)[[:space:]]+(into[[:space:]]+|from[[:space:]]+)?curadoria\\.derivation_rules\\M'
    `);
    expect(escritoras![0], "uma função passou a ESCREVER na Regra").toBe("(nenhuma)");

    const [leitoras] = consultar(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='curadoria' and p.prosrc ilike '%curadoria.derivation_rules%'
    `);
    expect(
      leitoras![0],
      "uma função além do emissor da ponte passou a ler a Regra",
    ).toBe("emitir_proposta_de_importancia");
  });

  it("A4 · nenhuma proposta nasceu: a estrutura da 2.1 continua vazia", () => {
    const [linha] = consultar(`select count(*) from curadoria.derivation_proposals`);
    expect(linha![0], "uma proposta nasceu junto da infraestrutura da Regra").toBe("0");
  });
});
