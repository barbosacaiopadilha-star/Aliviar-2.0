import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CONTAINER_PADRAO, argumentosPsql, containerDoBanco } from "../apoio/stack-local";

/**
 * P-1 · OS SETE PASSOS DO ROLLBACK COMPATÍVEL — e os negativos.
 *
 * Arnês determinístico: cada cenário NASCE da cadeia real de migrations, num
 * banco descartável próprio dentro da stack isolada — o ledger é escrito pelo
 * aplicador no ato de aplicar cada arquivo (como o CLI faz), nunca editado
 * depois. Nenhum estado parcialmente mutado é reutilizado entre casos:
 *
 *   · `p1_a121` — cadeia até 121 (o estado da Production): negativos do script
 *     e prova de que o writer antigo funciona lá;
 *   · `p1_b127` — cadeia até 127: incompatibilidade antes, compensação, modo
 *     ativo, idempotência, preservação e desvio derivável;
 *   · `p1_c127` — reconstrução limpa até 127: o ciclo completo
 *     compensar → retornar, provando o contrato 127 de volta e desvio zero.
 *
 * O substrato não-curadoria (auth/storage/roles) vem de clone do banco da
 * própria stack isolada — restore comprovado —, e o schema `curadoria` +
 * ledger nascem SÓ da cadeia. ⛔ Nunca roda na stack original nem em Production.
 */

const RAIZ = path.resolve(__dirname, "..", "..");
const MIGRACOES = path.join(RAIZ, "supabase", "migrations");
const SCRIPT = path.join(RAIZ, "scripts", "emergencia", "rollback-compativel-c7.sql");
const CORTE_121 = "20260812210000"; // arquivo 122 (porta pública) — a Production parou antes dele

const isolada = containerDoBanco() !== CONTAINER_PADRAO;
const container = () => argumentosPsql("")[1]!;

function psqlEm(banco: string, sql: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", container(), "psql", "-U", "postgres", "-d", banco, "-t", "-A", "-v", "ON_ERROR_STOP=1"],
    { encoding: "utf8", input: sql },
  ).trim();
}

/** Aplica o script emergencial com as variáveis dadas; devolve ok+saída. */
function aplicarScript(banco: string, vars: string[]): { ok: boolean; saida: string } {
  const sql = readFileSync(SCRIPT, "utf8");
  // spawnSync: RAISE NOTICE sai por stderr mesmo em sucesso — os dois fluxos
  // compõem a saída, e o código de saída decide ok.
  const r = spawnSync(
    "docker",
    ["exec", "-i", container(), "psql", "-U", "postgres", "-d", banco, ...vars],
    { encoding: "utf8", input: sql },
  );
  return { ok: r.status === 0, saida: String(r.stderr ?? "") + String(r.stdout ?? "") };
}

/**
 * Constrói um cenário: substrato clonado, `curadoria` zerado, e a cadeia real
 * aplicada arquivo a arquivo até o corte — cada arquivo em transação própria,
 * com a linha do ledger escrita PELO APLICADOR no mesmo ato.
 */
function construirCenario(banco: string, ateExclusivo: string | null) {
  psqlEm("postgres", `drop database if exists ${banco} with (force);`);
  psqlEm("postgres", `create database ${banco};`);
  execFileSync(
    "docker",
    ["exec", container(), "sh", "-c", `pg_dump -U postgres -d postgres | psql -q -U postgres -d ${banco} >/dev/null 2>&1 || true`],
    { encoding: "utf8" },
  );
  // Zera o que a cadeia vai construir. O substrato (auth, storage, extensões,
  // papéis) permanece do clone — restore comprovado.
  psqlEm(
    banco,
    `drop schema if exists curadoria cascade;
     drop schema if exists supabase_migrations cascade;
     create schema supabase_migrations;
     create table supabase_migrations.schema_migrations (
       version text primary key, statements text[], name text
     );`,
  );

  const arquivos = readdirSync(MIGRACOES)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => (ateExclusivo ? f < ateExclusivo : true));

  const lote = arquivos
    .map((arquivo) => {
      const corpo = readFileSync(path.join(MIGRACOES, arquivo), "utf8");
      const versao = arquivo.slice(0, 14);
      const nome = arquivo.slice(15, arquivo.length - 4);
      return `begin;\n${corpo}\ninsert into supabase_migrations.schema_migrations (version, name, statements) values ('${versao}', '${nome.replace(/'/g, "''")}', '{}');\ncommit;\n`;
    })
    .join("\n");
  execFileSync(
    "docker",
    ["exec", "-i", container(), "psql", "-q", "-U", "postgres", "-d", banco, "-v", "ON_ERROR_STOP=1"],
    { encoding: "utf8", input: lote },
  );

  // A cadeia cria `curadoria.profiles` vazio; os testes precisam de um perfil.
  // O clone trouxe usuários reais de auth — vinculamos um, como o trigger de
  // signup faria.
  psqlEm(
    banco,
    `insert into curadoria.profiles (id, display_name)
     select id, 'P1 Sintético' from auth.users limit 1
     on conflict (id) do nothing;`,
  );
  return psqlEm(banco, "select count(*) from supabase_migrations.schema_migrations;");
}

const d = describe.skipIf(!isolada);

d("P-1 · rollback compatível — cenários determinísticos", () => {
  it("cenário A nasce da cadeia até 121; o writer antigo FUNCIONA lá; o script RECUSA", () => {
    const ledger = construirCenario("p1_a121", CORTE_121);
    expect(ledger, "cadeia até 121").toBe("121");

    // O writer antigo, no mundo antigo: publica por escrita direta, sem guardas
    // do Corte 7 — é o comportamento da Production hoje.
    psqlEm(
      "p1_a121",
      `insert into curadoria.professional_profiles (display_name, professional_identifier, created_by, crm, crm_uf, registration_status, registration_source, registration_verified_at, registration_verified_by)
       select 'P1 A', 'P1-A-1', id, '0', 'SP', 'regular', 'p1', now(), id from curadoria.profiles limit 1;
       insert into curadoria.professional_practice_areas (professional_profile_id, raw_text, verification_status, source, verified_at, verified_by)
       select p.id, 'area', 'verificado', 'p1', now(), p.created_by from curadoria.professional_profiles p where p.professional_identifier='P1-A-1';
       update curadoria.professional_profiles set publication_status='publicado', updated_by=created_by where professional_identifier='P1-A-1';`,
    );
    expect(
      psqlEm("p1_a121", `select publication_status from curadoria.professional_profiles where professional_identifier='P1-A-1';`),
    ).toBe("publicado");

    // Negativo: contra ledger 121 o script recusa com a mensagem certa.
    const r = aplicarScript("p1_a121", ["-v", "confirmo=COMPENSAR-C7", "-v", "banco=p1_a121"]);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("contrato compensável é exatamente 127");
  }, 600_000);

  it("cenário B nasce da cadeia até 127; incompatível antes; compensação ativa e auditada; writer legado volta; nada se perde; desvio derivável; idempotente; negativos de confirmação e banco", () => {
    const ledger = construirCenario("p1_b127", null);
    expect(ledger, "cadeia até 127").toBe("127");

    // Passo 3 · incompatibilidade ANTES: a escrita legada é recusada.
    psqlEm(
      "p1_b127",
      `insert into curadoria.professional_profiles (display_name, professional_identifier, created_by, crm, crm_uf, registration_status, registration_source, registration_verified_at, registration_verified_by)
       select 'P1 B', 'P1-B-1', id, '0', 'SP', 'regular', 'p1', now(), id from curadoria.profiles limit 1;
       insert into curadoria.professional_practice_areas (professional_profile_id, raw_text, verification_status, source, verified_at, verified_by)
       select p.id, 'area', 'verificado', 'p1', now(), p.created_by from curadoria.professional_profiles p where p.professional_identifier='P1-B-1';`,
    );
    let recusa = "";
    try {
      psqlEm("p1_b127", `update curadoria.professional_profiles set publication_status='publicado', updated_by=created_by where professional_identifier='P1-B-1';`);
    } catch (e) {
      recusa = String(e);
    }
    expect(recusa, "o writer legado é incompatível com 127").toContain("mudan");

    // E o delete antigo (732d063 apaga COMPETÊNCIAS, não perfis): perfil SEM
    // história sai — a guarda de exclusão NÃO precisa ser relaxada.
    psqlEm(
      "p1_b127",
      `insert into curadoria.professional_profiles (display_name, professional_identifier, created_by)
       select 'P1 B del', 'P1-B-DEL', id from curadoria.profiles limit 1;`,
    );
    expect(
      psqlEm("p1_b127", `delete from curadoria.professional_profiles where professional_identifier='P1-B-DEL' returning 'APAGOU';`),
    ).toContain("APAGOU");

    const antes = psqlEm(
      "p1_b127",
      `select (select count(*) from curadoria.audit_logs)||'|'||(select count(*) from curadoria.professional_profiles)||'|'||(select count(*) from information_schema.columns where table_schema='curadoria' and table_name='professional_profiles' and column_name like 'ciclo%');`,
    );

    // Negativos de G1, ANTES de compensar: confirmação errada e banco errado.
    expect(aplicarScript("p1_b127", ["-v", "confirmo=NAO", "-v", "banco=p1_b127"]).ok).toBe(false);
    expect(aplicarScript("p1_b127", ["-v", "confirmo=COMPENSAR-C7", "-v", "banco=outro"]).ok).toBe(false);
    expect(aplicarScript("p1_b127", []).ok, "sem variáveis também recusa").toBe(false);

    // Passo 4 · compensação.
    const r = aplicarScript("p1_b127", ["-v", "confirmo=COMPENSAR-C7", "-v", "banco=p1_b127"]);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("MODO COMPATÍVEL ATIVADO");
    const linhas = psqlEm("p1_b127", `select id||'@'||created_at||'@'||coalesce(actor_id::text,'-') from curadoria.audit_logs where metadata->>'evento'='modo_compativel_ativado' order by id;`);
    expect(linhas.split("\n").length, "marcadores: " + linhas).toBe(1);

    // Passo 5 · o writer legado volta a funcionar — e o ciclo NÃO é derivado.
    psqlEm("p1_b127", `update curadoria.professional_profiles set publication_status='publicado', updated_by=created_by where professional_identifier='P1-B-1';`);
    expect(
      psqlEm("p1_b127", `select publication_status||'|'||coalesce(ciclo_de_vida::text,'X') from curadoria.professional_profiles where professional_identifier='P1-B-1';`),
    ).toBe("publicado|PREPARACAO");

    // Passo 6 · preservação: nada sumiu além do delete deliberado do teste.
    const depois = psqlEm(
      "p1_b127",
      `select (select count(*) from curadoria.audit_logs)||'|'||(select count(*) from curadoria.professional_profiles)||'|'||(select count(*) from information_schema.columns where table_schema='curadoria' and table_name='professional_profiles' and column_name like 'ciclo%');`,
    );
    const [trilhaAntes, perfisAntes] = antes.split("|").map(Number);
    const [trilhaDepois, perfisDepois, colunas] = depois.split("|").map(Number);
    // +2, e os dois são prova: o marcador do modo compatível E a trilha legada
    // professional_published (20260802162000), que VOLTA a funcionar quando a
    // escrita legada volta — auditoria preservada, não vazamento.
    expect(trilhaDepois).toBe(trilhaAntes + 2);
    // O delete deliberado do teste acontece ANTES do snapshot: entre os dois
    // instantes nenhum perfil pode sumir.
    expect(perfisDepois).toBe(perfisAntes); // nada some no modo compatívelado do teste
    expect(colunas).toBe(5);

    // Desvio derivável — o detector que originou o Corte 7.
    expect(
      Number(psqlEm("p1_b127", `select count(*) from curadoria.professional_profiles where (ciclo_de_vida='PUBLICADO_ATIVO') is distinct from (status='ativo' and publication_status='publicado');`)),
    ).toBeGreaterThanOrEqual(1);

    // As demais guardas seguem vivas: autoria do ciclo continua obrigatória.
    let autoria = "";
    try {
      psqlEm("p1_b127", `update curadoria.professional_profiles set ciclo_de_vida='PAUSADO', ciclo_motivo='REVISAO_CADASTRAL' where professional_identifier='P1-B-1';`);
    } catch (e) {
      autoria = String(e);
    }
    // B-1 está em PREPARACAO (a escrita legada não move o ciclo): PAUSADO é
    // proibido pela MATRIZ, que recusa antes mesmo da autoria — prova de que
    // as guardas do ciclo seguem vivas no modo compatível.
    expect(autoria).toContain("não permitida");

    // Idempotência: segunda execução é no-op sem marcador novo.
    const r2 = aplicarScript("p1_b127", ["-v", "confirmo=COMPENSAR-C7", "-v", "banco=p1_b127"]);
    expect(r2.ok, r2.saida).toBe(true);
    expect(r2.saida).toContain("JÁ ATIVO");
    expect(
      psqlEm("p1_b127", `select count(*) from curadoria.audit_logs where metadata->>'evento'='modo_compativel_ativado';`),
    ).toBe("1");
  }, 600_000);

  it("cenário C (reconstrução limpa 127): compensar → retornar devolve o contrato, sem história fabricada, desvio zero", () => {
    const ledger = construirCenario("p1_c127", null);
    expect(ledger).toBe("127");

    psqlEm(
      "p1_c127",
      `insert into curadoria.professional_profiles (display_name, professional_identifier, created_by, crm, crm_uf, registration_status, registration_source, registration_verified_at, registration_verified_by)
       select 'P1 C', 'P1-C-1', id, '0', 'SP', 'regular', 'p1', now(), id from curadoria.profiles limit 1;
       insert into curadoria.professional_practice_areas (professional_profile_id, raw_text, verification_status, source, verified_at, verified_by)
       select p.id, 'area', 'verificado', 'p1', now(), p.created_by from curadoria.professional_profiles p where p.professional_identifier='P1-C-1';`,
    );

    const r = aplicarScript("p1_c127", ["-v", "confirmo=COMPENSAR-C7", "-v", "banco=p1_c127"]);
    expect(r.ok, r.saida).toBe(true);
    psqlEm("p1_c127", `update curadoria.professional_profiles set publication_status='publicado', updated_by=created_by where professional_identifier='P1-C-1';`);

    // RETORNO (SQL exclusivo do arnês — a futura migration de republicação):
    // reaplica a função 127 lendo-a da fonte viva (o banco da stack isolada),
    // re-sincroniza no padrão 125/126 SEM motivo/autoria/data, e audita o fim.
    const corpo127 = psqlEm("postgres", `select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='assert_ciclo_do_profissional';`);
    expect(corpo127).toContain("mudanças de ciclo");
    psqlEm("p1_c127", corpo127 + ";");
    psqlEm(
      "p1_c127",
      `begin;
       alter table curadoria.professional_profiles disable trigger assert_ciclo_do_profissional;
       alter table curadoria.professional_profiles disable trigger registrar_trilha_do_ciclo;
       update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO'
        where ciclo_de_vida='PREPARACAO' and is_demo=false and is_test_fixture=false
          and status='ativo' and publication_status='publicado';
       update curadoria.professional_profiles
          set status = case when ciclo_de_vida in ('PREPARACAO','PUBLICADO_ATIVO') then 'ativo' else 'inativo' end,
              publication_status = case when ciclo_de_vida='PUBLICADO_ATIVO' then 'publicado' else 'nao_publicado' end
        where ciclo_de_vida is not null;
       alter table curadoria.professional_profiles enable trigger assert_ciclo_do_profissional;
       alter table curadoria.professional_profiles enable trigger registrar_trilha_do_ciclo;
       insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
       values (null, 'professional_ciclo_publicado_ativo', null, jsonb_build_object('evento','modo_compativel_encerrado'));
       commit;`,
    );

    // Writer único de volta:
    let recusa = "";
    try {
      psqlEm("p1_c127", `update curadoria.professional_profiles set publication_status='nao_publicado' where professional_identifier='P1-C-1';`);
    } catch (e) {
      recusa = String(e);
    }
    expect(recusa, "a recusa legada voltou").toContain("mudan");

    // Ressincronização sem história fabricada:
    expect(
      psqlEm("p1_c127", `select count(*) from curadoria.professional_profiles where professional_identifier='P1-C-1' and (ciclo_motivo is not null or ciclo_alterado_por is not null or ciclo_alterado_em is not null);`),
    ).toBe("0");
    expect(
      psqlEm("p1_c127", `select ciclo_de_vida::text from curadoria.professional_profiles where professional_identifier='P1-C-1';`),
    ).toBe("PUBLICADO_ATIVO");

    // Divergência final zero:
    expect(
      psqlEm("p1_c127", `select count(*) from curadoria.professional_profiles where (ciclo_de_vida='PUBLICADO_ATIVO') is distinct from (status='ativo' and publication_status='publicado');`),
    ).toBe("0");
  }, 600_000);
});

/**
 * P-2 · O INVENTÁRIO, pelo caminho operacional real (stdin + contêiner).
 *
 * Roda DEPOIS dos cenários do P-1, que constroem os bancos certos: `p1_a121`
 * (ledger 121 — a fase PRE não pode tocar `ciclo_de_vida`, e aqui a coluna nem
 * existe) e `p1_c127` (ledger 127 pós-retorno — divergência zero). A recusa de
 * fase tem de ser um ERRO de verdade: exit ≠ 0, não um `\echo` educado.
 */
d("P-2 · inventário pré/pós-publicação — fases, recusas e nenhuma escrita", () => {
  const INVENTARIO = path.join(RAIZ, "scripts", "publicacao", "inventario-pre-publicacao.sql");

  function inventariar(banco: string, vars: string[]): { status: number | null; saida: string } {
    const r = spawnSync(
      "docker",
      ["exec", "-i", container(), "psql", "-U", "postgres", "-d", banco, ...vars],
      { encoding: "utf8", input: readFileSync(INVENTARIO, "utf8") },
    );
    return { status: r.status, saida: String(r.stderr ?? "") + String(r.stdout ?? "") };
  }

  /** Impressão digital de escrita: contagens + maior id da trilha. */
  function digital(banco: string): string {
    return psqlEm(
      banco,
      `select (select count(*) from curadoria.professional_profiles)
        || '|' || (select count(*) from curadoria.audit_logs)
        || '|' || (select coalesce(max(id), 0) from curadoria.audit_logs);`,
    );
  }

  it("fase ausente e fase inválida: exit ≠ 0, mensagem de recusa, nenhuma escrita", () => {
    const antes = digital("p1_a121");
    for (const vars of [[], ["-v", "fase=xyz"]]) {
      const r = inventariar("p1_a121", vars);
      expect(r.status, r.saida).not.toBe(0);
      expect(r.saida).toContain("RECUSADO: passe -v fase=pre ou -v fase=pos");
      // As consultas PRE/POS não podem ter rodado.
      expect(r.saida).not.toContain("classificacao_prevista");
      expect(r.saida).not.toContain("divergencias_da_previsao");
    }
    expect(digital("p1_a121"), "a recusa escreveu no banco").toBe(antes);
  });

  it("fase=pre no ledger 121: exit 0, inventário correto, nenhuma escrita", () => {
    const antes = digital("p1_a121");
    const r = inventariar("p1_a121", ["-v", "fase=pre"]);
    expect(r.status, r.saida).toBe(0);
    // O cenário A tem exatamente 1 profissional, publicado pelo writer antigo.
    expect(r.saida).toContain("classificacao_prevista");
    expect(r.saida).toContain("PUBLICADO_ATIVO");
    expect(r.saida).toContain("backfill 123: ativo e publicado");
    // Compatibilidade 121 de verdade: nada de `ciclo_de_vida` na fase PRE — e
    // o banco nem tem a coluna, então qualquer referência teria explodido.
    expect(r.saida).not.toContain("divergencias_da_previsao");
    expect(digital("p1_a121"), "a fase PRE escreveu no banco").toBe(antes);
  });

  it("fase=pos no ledger 127: exit 0, divergência e desvio zero, nenhuma escrita", () => {
    const antes = digital("p1_c127");
    const r = inventariar("p1_c127", ["-v", "fase=pos"]);
    expect(r.status, r.saida).toBe(0);
    const semEspacos = r.saida.replace(/\s+/g, " ");
    expect(semEspacos).toContain("divergencias_da_previsao");
    expect(semEspacos).toMatch(/divergencias_da_previsao -+ 0/);
    expect(semEspacos).toMatch(/desvio_ciclo_vs_legado -+ 0/);
    expect(r.saida).not.toContain("classificacao_prevista");
    expect(digital("p1_c127"), "a fase POS escreveu no banco").toBe(antes);
  });
});
