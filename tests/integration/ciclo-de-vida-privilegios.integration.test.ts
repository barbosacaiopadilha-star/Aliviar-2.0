// PACOTE 2.2B-R1 — AS LEITURAS DO CICLO DE VIDA NÃO SÃO ANÔNIMAS.
//
// `create function` concede EXECUTE a `PUBLIC` por padrão, e `PUBLIC` alcança
// `anon`. A migration do 2.2B fez `revoke all ... from anon, authenticated` e
// isso NÃO bastou: os dois papéis nunca tiveram grant próprio — o que eles
// tinham era o padrão de `PUBLIC`, que `revoke ... from <papel>` não alcança.
// A Verificação Independente encontrou o buraco; este arquivo o fecha e o
// mantém fechado.
//
// A pergunta é feita ao PostgreSQL, nunca ao texto das migrations: uma
// migration futura que faça `drop` + `create` destas funções volta a conceder
// EXECUTE a PUBLIC em silêncio, e é essa regressão que precisa cair aqui.
//
// ANTI-VACUIDADE. A mutação A deste pacote devolve `EXECUTE` a `PUBLIC` e
// confirma que estes oráculos caem — sem isso, "PUBLIC não tem EXECUTE" seria
// uma frase sobre um catálogo que ninguém leu.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";

/**
 * Assinatura completa: `has_function_privilege` precisa dela para desambiguar
 * sobrecargas, e escrevê-la aqui documenta o contrato que o teste protege.
 * Se alguém mudar a assinatura, o `regprocedure` falha e o teste cai — que é o
 * comportamento certo: privilégio conferido na assinatura errada não prova nada.
 */
const LEITURAS = [
  "curadoria.derivation_rule_state(text,integer)",
  "curadoria.derivation_rule_current_version(text)",
] as const;

/** Os papéis de aplicação. Nenhum deles pode alcançar a estrutura inerte. */
const PAPEIS_DE_APLICACAO = ["anon", "authenticated", "service_role", "authenticator"] as const;

function psql(sql: string): string {
  return execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

function linhas(sql: string): string[] {
  const saida = psql(sql);
  return saida === "" ? [] : saida.split("\n").map((l) => l.trim());
}

describe("2.2B-R1 · as duas leituras existem, e é sobre elas que se fala", () => {
  it("as assinaturas do catálogo são exatamente as que este arquivo confere", () => {
    const encontradas = linhas(`
      select p.oid::regprocedure::text
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria'
        and p.proname in ('derivation_rule_state','derivation_rule_current_version')
      order by 1
    `);

    // Sem esta prova, todas as demais poderiam estar conferindo o nada.
    expect(encontradas.map((s) => s.replace(/\s+/g, ""))).toEqual(
      [...LEITURAS].map((s) => s.replace(/\s+/g, "")).sort(),
    );
  });
});

describe("2.2B-R1 · ACL — PUBLIC não executa", () => {
  it.each(LEITURAS)("%s: o grantee vazio (PUBLIC) não aparece na ACL", (assinatura) => {
    const [acl] = linhas(`
      select coalesce(proacl::text, '(null=default)')
      from pg_proc where oid = '${assinatura}'::regprocedure
    `);

    // ACL `null` significa PADRÃO — e o padrão do PostgreSQL É `PUBLIC EXECUTE`.
    // Por isso `null` reprova: seria o buraco de volta, disfarçado de ausência.
    expect(acl, "a ACL voltou ao padrão, que concede EXECUTE a PUBLIC").not.toBe("(null=default)");
    // `=X/...` com grantee vazio é PUBLIC. `postgres=X/...` é o proprietário.
    expect(acl, "PUBLIC recuperou EXECUTE").not.toMatch(/(^|,)\{?=X\//);
    expect(acl, "o proprietário perdeu EXECUTE — as provas internas parariam").toContain(
      "postgres=X/postgres",
    );
  });

  it.each(LEITURAS)("%s: PUBLIC não tem EXECUTE, perguntado ao PostgreSQL", (assinatura) => {
    const [temPublic] = linhas(`
      select has_function_privilege('public', '${assinatura}', 'EXECUTE')::text
    `);
    expect(temPublic, "PUBLIC executa a leitura do ciclo de vida").toBe("false");
  });
});

describe("2.2B-R1 · nenhum papel de aplicação herda EXECUTE", () => {
  it.each(PAPEIS_DE_APLICACAO)("%s não executa nenhuma das duas", (papel) => {
    for (const assinatura of LEITURAS) {
      const [tem] = linhas(`
        select has_function_privilege('${papel}', '${assinatura}', 'EXECUTE')::text
      `);
      expect(tem, `${papel} alcança ${assinatura} — a estrutura deixou de ser inerte`).toBe("false");
    }
  });

  it("nenhum dos papéis tem grant PRÓPRIO na ACL — não havia, e não passou a haver", () => {
    for (const assinatura of LEITURAS) {
      const [acl] = linhas(`
        select coalesce(proacl::text,'') from pg_proc where oid = '${assinatura}'::regprocedure
      `);
      for (const papel of PAPEIS_DE_APLICACAO) {
        expect(acl, `${papel} ganhou grant próprio em ${assinatura}`).not.toContain(`${papel}=`);
      }
    }
  });
});

describe("2.2B-R1 · o estado administrativo continua podendo executar", () => {
  it.each(LEITURAS)("%s: o proprietário executa — as provas internas seguem possíveis", (assinatura) => {
    const [tem] = linhas(`select has_function_privilege('postgres', '${assinatura}', 'EXECUTE')::text`);
    expect(tem, "o proprietário perdeu EXECUTE: revogar de PUBLIC não pode fechar a porta dele").toBe(
      "true",
    );
  });

  it("e a execução realmente acontece, não é só privilégio no papel", () => {
    // Chamada real, com a árvore vazia: `null` é a resposta correta para uma
    // versão que não existe — e prova que a função roda.
    const [resposta] = linhas(`
      select coalesce(curadoria.derivation_rule_state('nao-existe', 1), '(null)')
    `);
    expect(resposta).toBe("(null)");
  });
});

describe("2.2B-R1 · as funções continuam SECURITY INVOKER", () => {
  it.each(LEITURAS)("%s: prosecdef = false, sem search_path e sem troca de dono", (assinatura) => {
    const [linha] = linhas(`
      select p.prosecdef::text || '|' || pg_get_userbyid(p.proowner)
             || '|' || coalesce(array_to_string(p.proconfig, ','), '(nenhum)')
      from pg_proc p where p.oid = '${assinatura}'::regprocedure
    `);

    const [secdef, dono, config] = linha!.split("|");
    // Transformar em DEFINER para "compensar" o revoke seria o oposto da
    // correção: passaria a ler com a autoridade do dono, não do chamador.
    expect(secdef, "a função virou SECURITY DEFINER").toBe("false");
    expect(dono, "o proprietário mudou").toBe("postgres");
    expect(config, "apareceu um SET (search_path ou outro) que não existia").toBe("(nenhum)");
  });
});

describe("2.2B-R1 · a inércia do 2.2B permanece intacta", () => {
  it("RLS habilitada e ZERO policies na estrutura de transições", () => {
    const [rls] = linhas(`
      select case when relrowsecurity then 't' else 'f' end
      from pg_class where oid = 'curadoria.derivation_rule_transitions'::regclass
    `);
    expect(rls, "a RLS foi desabilitada").toBe("t");

    const [policies] = linhas(`
      select count(*) from pg_policies
      where schemaname='curadoria'
        and tablename in ('derivation_rule_transitions','derivation_rules','derivation_proposals')
    `);
    expect(policies, "nasceu uma policy — o pacote corrige privilégio, não abre porta").toBe("0");
  });

  it("nenhum papel de aplicação alcança as três tabelas", () => {
    for (const tabela of [
      "curadoria.derivation_rule_transitions",
      "curadoria.derivation_rules",
      "curadoria.derivation_proposals",
    ]) {
      for (const papel of ["anon", "authenticated", "service_role"]) {
        for (const privilegio of ["select", "insert", "update", "delete"]) {
          const [tem] = linhas(
            `select has_table_privilege('${papel}','${tabela}','${privilegio}')::text`,
          );
          expect(tem, `${papel} tem ${privilegio} em ${tabela}`).toBe("false");
        }
      }
    }
  });

  it("as estruturas continuam vazias: o pacote não inaugurou uso", () => {
    const [linha] = linhas(`
      select (select count(*) from curadoria.derivation_rules) || '|' ||
             (select count(*) from curadoria.derivation_rule_transitions) || '|' ||
             (select count(*) from curadoria.derivation_proposals)
    `);
    expect(linha).toBe("0|0|0");
  });
});
