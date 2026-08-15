// ITEM 1.11 — O LEITOR AGREGADO CONTRA O BANCO REAL (CONTRATO_1_11 §3–§6, §13).
//
// A fixture é a prova numérica lavrada no §27 da missão: contagens cuja
// resposta certa é inequívoca (25%, e não 1/11), duas versões da mesma regra
// com taxas diferentes, e um conceito só-pendente que NÃO ganha taxa.
//
// A capability é service_role-only e a tabela continua fechada — os dois
// aceites são conferidos aqui, lado a lado, como no §21 do R1.

import { execFileSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loadPainelDeDiscordancia } from "@/modules/curadoria/painel-de-discordancia-repository";
import { SEM_OBSERVACOES_SUFICIENTES } from "@/modules/curadoria/painel-de-discordancia";
import { containerDoBanco } from "../apoio/stack-local";

const CONTAINER = containerDoBanco();

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    return {
      ok: true,
      saida: execFileSync(
        "docker",
        ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim(),
    };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

const PESSOA = "'00000000-0000-4000-8000-0000000e0001'::uuid";
const CONCEITO_A = "ACESSO_MODALIDADE";
const CONCEITO_B = "MODELO_COMUNICACAO";

const service = createAdminSupabaseClient();

beforeAll(() => {
  // Regras sintéticas (o FK composto MR1.3 exige a linha em derivation_rules).
  // As propostas nascem DIRETO com o desfecho desejado: a tabela só tem CHECKs
  // — o mecanismo humano de decisão é o Item 1.12, que não existe ainda, e o
  // painel observa fatos, não os fabrica pelo emissor.
  const r = psql(`
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
    values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'painel-1-11@local', 'x', now(), now());

    insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence) values
      ('REGRA-X', 1, 'PROPOSTA', ${PESSOA}, 'fixture 1.11', 'nenhuma'),
      ('REGRA-X', 2, 'PROPOSTA', ${PESSOA}, 'fixture 1.11', 'nenhuma'),
      ('REGRA-Y', 1, 'PROPOSTA', ${PESSOA}, 'fixture 1.11', 'nenhuma');
    insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason) values
      ('REGRA-X', 1, 1, null, 'PROPOSTA', ${PESSOA}, 'PAPEL_INTERNO', 'p'),
      ('REGRA-X', 2, 1, null, 'PROPOSTA', ${PESSOA}, 'PAPEL_INTERNO', 'p'),
      ('REGRA-Y', 1, 1, null, 'PROPOSTA', ${PESSOA}, 'PAPEL_INTERNO', 'p');

    do $fixture$
    declare
      alvos constant text[] := array[
        -- CONCEITO_A · REGRA-X v1 — a prova do §27: 3C, 1R, 4P, 2S, 1T
        '${CONCEITO_A}|REGRA-X|1|CONFIRMADA', '${CONCEITO_A}|REGRA-X|1|CONFIRMADA',
        '${CONCEITO_A}|REGRA-X|1|CONFIRMADA', '${CONCEITO_A}|REGRA-X|1|RECUSADA',
        '${CONCEITO_A}|REGRA-X|1|PROPOSTA',   '${CONCEITO_A}|REGRA-X|1|PROPOSTA',
        '${CONCEITO_A}|REGRA-X|1|PROPOSTA',   '${CONCEITO_A}|REGRA-X|1|PROPOSTA',
        '${CONCEITO_A}|REGRA-X|1|SUPERADA',   '${CONCEITO_A}|REGRA-X|1|SUPERADA',
        '${CONCEITO_A}|REGRA-X|1|RETIRADA',
        -- CONCEITO_A · REGRA-X v2 — série própria: 1C, 1R → 50%
        '${CONCEITO_A}|REGRA-X|2|CONFIRMADA', '${CONCEITO_A}|REGRA-X|2|RECUSADA',
        -- CONCEITO_B · REGRA-Y v1 — só pendentes: taxa NÃO existe
        '${CONCEITO_B}|REGRA-Y|1|PROPOSTA',   '${CONCEITO_B}|REGRA-Y|1|PROPOSTA'
      ];
      alvo text;
      partes text[];
      caso uuid;
      historia uuid;
      i integer := 0;
    begin
      foreach alvo in array alvos loop
        i := i + 1;
        partes := string_to_array(alvo, '|');
        historia := ('00000000-0000-4000-8000-00000e1' || lpad(i::text, 5, '0'))::uuid;
        caso := ('00000000-0000-4000-8000-00000e2' || lpad(i::text, 5, '0'))::uuid;
        -- status 'enviada': o indice parcial permite UM rascunho por paciente,
        -- e a fixture precisa de quinze historias do mesmo perfil sintetico.
        insert into curadoria.patient_stories (id, profile_id, created_by, status)
        values (historia, ${PESSOA}, ${PESSOA}, 'enviada');
        insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
        values (caso, ${PESSOA}, historia, ${PESSOA});
        insert into curadoria.derivation_proposals
          (case_id, subcriterion_code, target_field, suggested_value, origin_record, origin_version,
           origin_declared_at, origin_author, rule_id, rule_version, catalog_version, consequence_degree, state)
        values
          (caso, partes[1], 'importance', 'MUITO_IMPORTANTE', 'case_needs:fixture-' || i, 'ESSENCIAL',
           now(), ${PESSOA}, partes[2], partes[3]::integer, '1.1.0', 'ESSENCIAL', partes[4]);
      end loop;
    end
    $fixture$;

    select 'TOTAL:' || count(*) from curadoria.derivation_proposals;
  `);
  if (!r.ok) throw new Error(`fixture falhou:\n${r.saida}`);
  if (!r.saida.includes("TOTAL:15")) throw new Error(`fixture incompleta:\n${r.saida}`);
}, 60_000);

afterAll(() => {
  psql(`
    delete from curadoria.derivation_proposals where rule_id in ('REGRA-X','REGRA-Y');
    alter table curadoria.derivation_rule_transitions disable trigger derivation_rule_transitions_append_only;
    alter table curadoria.derivation_rules disable trigger derivation_rules_append_only;
    delete from curadoria.derivation_rule_transitions where rule_id in ('REGRA-X','REGRA-Y');
    delete from curadoria.derivation_rules where rule_id in ('REGRA-X','REGRA-Y');
    alter table curadoria.derivation_rule_transitions enable trigger derivation_rule_transitions_append_only;
    alter table curadoria.derivation_rules enable trigger derivation_rules_append_only;
    delete from curadoria.cases where patient_profile_id = ${PESSOA};
    delete from curadoria.patient_stories where profile_id = ${PESSOA};
    delete from auth.users where id = ${PESSOA};
  `);
  const { saida } = psql(
    `select (select count(*) from curadoria.derivation_proposals) || '|' ||
            (select count(*) from curadoria.derivation_rules where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            (select count(*) from curadoria.cases)`,
  );
  if (saida !== "0|0|0") throw new Error(`1.11 deixou resíduo: propostas|regras|cases = ${saida}`);
});

describe("§3 · o contrato da capability, no banco", () => {
  const FN = "curadoria.contar_propostas_por_desfecho()";

  it("DEFINER, STABLE, search_path fixo, owner de migrations — e os grants mínimos", () => {
    const { saida } = psql(`
      select 'def=' || prosecdef || '/vol=' || provolatile::text
        || '/cfg=' || array_to_string(proconfig, ';') || '/own=' || proowner::regrole::text
        || '/args=' || pronargs
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='contar_propostas_por_desfecho';
      select 'exec=' || has_function_privilege('service_role','${FN}','execute')
        || '/' || has_function_privilege('anon','${FN}','execute')
        || '/' || has_function_privilege('authenticated','${FN}','execute')
        || '/' || has_function_privilege('public','${FN}','execute');
      select 'tabela=' || has_table_privilege('service_role','curadoria.derivation_proposals','select');
    `);
    expect(saida).toContain("def=true/vol=s/cfg=search_path=curadoria, pg_temp/own=postgres/args=0");
    expect(saida).toContain("exec=true/false/false/false");
    // O aceite positivo permanente: a tabela CONTINUA fechada. Coexistem.
    expect(saida).toContain("tabela=false");
  });

  it("o corpo é um SELECT agregado — sem escrita, sem dimensão pessoal", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='contar_propostas_por_desfecho'
    `);
    const corpo = saida.replace(/--.*$/gm, "");
    for (const proibido of [/insert\s+into/i, /update\s+curadoria/i, /delete\s+from/i, /professional_profile_id/, /case_id/, /origin_/, /suggested_value/, /\bp\.id\b/]) {
      expect(proibido.test(corpo), `o corpo da agregada ganhou ${proibido}`).toBe(false);
    }
    expect(corpo).toMatch(/group by/i);
  });
});

describe("§27/§28 · a prova numérica, lida pelo caminho de produção", () => {
  it("as cinco colunas — e SÓ elas — voltam da capability", async () => {
    const { data, error } = await service.rpc("contar_propostas_por_desfecho");
    expect(error, error?.message).toBeNull();
    const linhas = (data ?? []) as Record<string, unknown>[];
    expect(linhas.length).toBeGreaterThan(0);
    for (const linha of linhas) {
      expect(Object.keys(linha).sort()).toEqual([
        "contagem",
        "rule_id",
        "rule_version",
        "state",
        "subcriterion_code",
      ]);
    }
  });

  it("nenhuma linha zero é fabricada: o conceito só-pendente tem UMA linha agregada", async () => {
    const { data } = await service.rpc("contar_propostas_por_desfecho");
    const deB = ((data ?? []) as { subcriterion_code: string; state: string }[]).filter(
      (l) => l.subcriterion_code === CONCEITO_B,
    );
    expect(deB).toHaveLength(1);
    expect(deB[0]!.state).toBe("PROPOSTA");
  });

  it("REGRA-X v1: taxa = 1/(3+1) = 25% — e NUNCA 1/11", async () => {
    const painel = await loadPainelDeDiscordancia(service);
    const v1 = painel.series.find(
      (s) => s.subcriterionCode === CONCEITO_A && s.ruleId === "REGRA-X" && s.ruleVersion === 1,
    )!;
    expect(v1.contagens).toEqual({
      PROPOSTA: 4,
      CONFIRMADA: 3,
      RECUSADA: 1,
      SUPERADA: 2,
      RETIRADA: 1,
    });
    expect(v1.discordancia).toEqual({ ha: true, taxa: 0.25, decididas: 4 });
  });

  it("REGRA-X v2 é série própria: 1/(1+1) = 50% — versões nunca somam", async () => {
    const painel = await loadPainelDeDiscordancia(service);
    const v2 = painel.series.find(
      (s) => s.subcriterionCode === CONCEITO_A && s.ruleId === "REGRA-X" && s.ruleVersion === 2,
    )!;
    expect(v2.discordancia).toEqual({ ha: true, taxa: 0.5, decididas: 2 });
    // A soma cega (2R / 6 decididas = 33%) NÃO aparece em lugar nenhum.
    const taxas = painel.series
      .filter((s) => s.ruleId === "REGRA-X")
      .map((s) => (s.discordancia.ha ? s.discordancia.taxa : null));
    expect(taxas).not.toContain(2 / 6);
  });

  it("o conceito só-pendente declara o vazio — nunca 0%", async () => {
    const painel = await loadPainelDeDiscordancia(service);
    const deB = painel.series.find((s) => s.subcriterionCode === CONCEITO_B)!;
    expect(deB.discordancia.ha).toBe(false);
    if (!deB.discordancia.ha) {
      expect(deB.discordancia.declaracao).toBe(SEM_OBSERVACOES_SUFICIENTES);
    }
    expect(deB.contagens.PROPOSTA).toBe(2);
  });

  it("§6 · revogar a regra NÃO apaga o histórico das propostas", async () => {
    const revoga = psql(`
      insert into curadoria.derivation_rule_transitions
        (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
      values ('REGRA-X', 2, 2, 'PROPOSTA', 'VIGENTE', 1, ${PESSOA}, 'AUTORIDADE_DE_METODO', 'f', 'ADR-066'),
             ('REGRA-X', 2, 3, 'VIGENTE', 'REVOGADA', null, ${PESSOA}, 'AUTORIDADE_DE_METODO', 'f', 'ADR-066');
      select 'ESTADO:' || curadoria.derivation_rule_state('REGRA-X', 2);
    `);
    expect(revoga.ok, revoga.saida).toBe(true);
    expect(revoga.saida).toContain("ESTADO:REVOGADA");

    const painel = await loadPainelDeDiscordancia(service);
    const v2 = painel.series.find(
      (s) => s.subcriterionCode === CONCEITO_A && s.ruleId === "REGRA-X" && s.ruleVersion === 2,
    );
    expect(v2, "a revogação apagou a série histórica").toBeDefined();
    expect(v2!.discordancia).toEqual({ ha: true, taxa: 0.5, decididas: 2 });
  });

  it("nenhuma dimensão pessoal atravessa o caminho inteiro", async () => {
    const painel = await loadPainelDeDiscordancia(service);
    const texto = JSON.stringify(painel);
    for (const pessoal of ["professional", "patient", "case_id", "caseId", "proposal", "origin_", "0000000e2"]) {
      expect(texto, `vazou dimensão individual: ${pessoal}`).not.toContain(pessoal);
    }
  });
});
