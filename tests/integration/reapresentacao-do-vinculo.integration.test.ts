// ITEM 1.8-R1-MR1 — REAPRESENTAÇÃO ESTRITA DO VÍNCULO (Contrato §22.4–§22.7).
//
// O R1 recusava manter o vínculo antigo implicitamente numa mudança de status;
// deixava passar `evidence_id = NULL` no mesmo ato. O MR1 fecha essa borda:
// o Mapa é UPSERT, e zerar o vínculo junto com o status apagaria PARA SEMPRE a
// sustentação explícita do estado (§22.5).
//
//   legado sem vínculo  ≠  ato novo removendo vínculo
//
// Cada recusa nomeia QUEM arbitrou: o trigger de reapresentação, a FK composta
// ou o constraint trigger de conceito. A concorrência usa DUAS CONEXÕES reais
// — nunca uma transação simulando duas — e prova que a confirmação final é
// sustentada exatamente pela evidência apresentada pela gravação vencedora.

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const CONTAINER = "supabase_db_aliviar-conexao";

const ARGS = (sql: string) => [
  "exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres",
  "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql,
];

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    return {
      ok: true,
      saida: execFileSync("docker", ARGS(sql), { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim(),
    };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

const U = (s: string) => `'00000000-0000-4000-8000-0000000c${s}'::uuid`;
const PESSOA = U("0001");
const PROF = U("0f01");
const OUTRO_PROF = U("0f02");
const EV0 = U("0e00");
const EV_A = U("0e0a");
const EV_B = U("0e0b");
const EV_OUTRO_PROF = U("0e0c");
const EV_OUTRO_CONCEITO = U("0e0d");
const CONCEITO = "ACESSO_MODALIDADE";
const OUTRO_CONCEITO = "MODELO_COMUNICACAO";

function opcaoValida(code: string): string {
  return psql(
    `select value from curadoria.method_subcriterion_options where subcriterion_code='${code}' and side='profissional' and active limit 1`,
  ).saida.split("\n")[0]!;
}

function idDoConceito(code: string): string {
  return psql(`select id from curadoria.method_subcriteria where code='${code}'`).saida;
}

const evidencia = (id: string, prof: string, code: string, versao: number) => `
  insert into curadoria.practice_evidence
    (id, professional_profile_id, subcriterion_code, catalog_version, version, options, details,
     source_tier, source, collected_at, collected_by, status)
  values (${id}, ${prof}, '${code}', '1.1.0', ${versao}, '{${opcaoValida(code)}}', '{}',
          'OFICIAL_PRIMARIA', 'mr1 v${versao}', '2026-07-0${versao}T08:00:00Z', ${PESSOA}, 'nao_verificado');`;

/** A linha sob teste volta ao estado inicial entre cenários. */
function restaurarLinha() {
  const r = psql(`
    update curadoria.professional_subcriterion_map
    set status = 'CONFIRMADO', evidence_id = ${EV0}
    where professional_profile_id = ${PROF}
      and subcriterion_id = '${idDoConceito(CONCEITO)}'::uuid
      and (status is distinct from 'CONFIRMADO' or evidence_id is distinct from ${EV0});
    select status || '|' || evidence_id from curadoria.professional_subcriterion_map
    where professional_profile_id = ${PROF} and subcriterion_id = '${idDoConceito(CONCEITO)}'::uuid;
  `);
  expect(r.ok, r.saida).toBe(true);
}

beforeAll(() => {
  const r = psql(`
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
    values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'mr1-vinculo@local', 'x', now(), now());
    insert into curadoria.professional_profiles (id, display_name, professional_identifier, crm_uf, status, created_by)
    values (${PROF}, 'Prof MR1 (sintetico)', 'MR1-001', 'SP', 'ativo', ${PESSOA}),
           (${OUTRO_PROF}, 'Outro MR1 (sintetico)', 'MR1-002', 'SP', 'ativo', ${PESSOA});

    ${evidencia(EV0, PROF, CONCEITO, 1)}
    ${evidencia(EV_A, PROF, CONCEITO, 2)}
    ${evidencia(EV_B, PROF, CONCEITO, 3)}
    ${evidencia(EV_OUTRO_PROF, OUTRO_PROF, CONCEITO, 1)}
    ${evidencia(EV_OUTRO_CONCEITO, PROF, OUTRO_CONCEITO, 1)}

    insert into curadoria.professional_subcriterion_map
      (professional_profile_id, subcriterion_id, status, declared_by, evidence_id)
    values (${PROF}, '${idDoConceito(CONCEITO)}'::uuid, 'CONFIRMADO', ${PESSOA}, ${EV0});
    -- Linha LEGADA: sem vínculo, de antes do regime.
    insert into curadoria.professional_subcriterion_map
      (professional_profile_id, subcriterion_id, status)
    values (${OUTRO_PROF}, '${idDoConceito(CONCEITO)}'::uuid, 'CONFIRMADO');
  `);
  if (!r.ok) throw new Error(`fixture falhou:\n${r.saida}`);
}, 60_000);

afterAll(() => {
  psql(`
    alter table curadoria.practice_evidence disable trigger practice_evidence_no_update;
    delete from curadoria.professional_subcriterion_map where professional_profile_id in (${PROF}, ${OUTRO_PROF});
    delete from curadoria.practice_evidence where professional_profile_id in (${PROF}, ${OUTRO_PROF});
    delete from curadoria.professional_profiles where id in (${PROF}, ${OUTRO_PROF});
    delete from auth.users where id = ${PESSOA};
    alter table curadoria.practice_evidence enable trigger practice_evidence_no_update;
  `);
  const { saida } = psql(
    `select (select count(*) from curadoria.professional_subcriterion_map) || '|' ||
            (select count(*) from curadoria.practice_evidence)`,
  );
  if (saida !== "0|0") throw new Error(`MR1 deixou resíduo: map|evidencias = ${saida}`);
});

const alterar = (sets: string, prof = PROF, code = CONCEITO) =>
  psql(`
    update curadoria.professional_subcriterion_map
    set ${sets}
    where professional_profile_id = ${prof}
      and subcriterion_id = '${idDoConceito(code)}'::uuid;
  `);

describe("§22.6 · os seis cenários do trigger, cada recusa com o árbitro nomeado", () => {
  it("T1 · status muda mantendo o vínculo antigo implicitamente → RECUSA (trigger de reapresentação)", () => {
    restaurarLinha();
    const r = alterar(`status = 'NAO_INFORMADO'`);
    expect(r.ok, "a mudança passou sem reapresentar o vínculo").toBe(false);
    expect(r.saida).toContain("sem reapresentar a evidencia");
    expect(r.saida).toContain("1.8-R1 §7.2");
  });

  it("T2 · status muda com evidence_id = NULL → RECUSA (a borda central do MR1)", () => {
    restaurarLinha();
    // A prova explícita do §22.5:
    //   OLD.evidence_id = EV0 (válido) · NEW.status ≠ OLD.status · NEW.evidence_id = NULL
    const r = alterar(`status = 'NAO_INFORMADO', evidence_id = null`);
    expect(r.ok, "zerar o vínculo junto com o status PASSOU — a lacuna do R1 continua aberta").toBe(false);
    expect(r.saida).toContain("apagando o vinculo de evidencia");
    expect(r.saida).toContain("1.8-R1-MR1 §22.5");
    // E não foi outra proteção que segurou:
    expect(r.saida).not.toContain("violates foreign key");
    expect(r.saida).not.toContain("Evidencia de outro conceito");

    const estado = psql(
      `select status || '|' || coalesce(evidence_id::text,'null') from curadoria.professional_subcriterion_map where professional_profile_id=${PROF} and subcriterion_id='${idDoConceito(CONCEITO)}'::uuid`,
    );
    expect(estado.saida, "a linha mudou apesar da recusa").toBe(
      `CONFIRMADO|${EV0.replace(/'/g, "").replace("::uuid", "")}`,
    );
  });

  it("T3 · status muda com NOVO vínculo válido → ACEITA", () => {
    restaurarLinha();
    const r = alterar(`status = 'NAO_INFORMADO', evidence_id = ${EV_A}`);
    expect(r.ok, r.saida).toBe(true);
    const estado = psql(
      `select status || '|' || evidence_id from curadoria.professional_subcriterion_map where professional_profile_id=${PROF} and subcriterion_id='${idDoConceito(CONCEITO)}'::uuid`,
    );
    expect(estado.saida).toBe(`NAO_INFORMADO|${EV_A.replace(/'/g, "").replace("::uuid", "")}`);
  });

  it("T4 · linha LEGADA sem vínculo muda de status — compatibilidade do §7.2 preservada", () => {
    const r = alterar(`status = 'NAO_INFORMADO'`, OUTRO_PROF);
    expect(r.ok, `o legado quebrou: ${r.saida}`).toBe(true);
    const volta = alterar(`status = 'CONFIRMADO'`, OUTRO_PROF);
    expect(volta.ok).toBe(true);
    // E permanece sem vínculo — nada foi inferido nem preenchido.
    const estado = psql(
      `select coalesce(evidence_id::text,'null') from curadoria.professional_subcriterion_map where professional_profile_id=${OUTRO_PROF} and subcriterion_id='${idDoConceito(CONCEITO)}'::uuid`,
    );
    expect(estado.saida).toBe("null");
  });

  it("T5 · novo vínculo de OUTRO profissional → RECUSA (FK composta)", () => {
    restaurarLinha();
    const r = alterar(`status = 'NAO_INFORMADO', evidence_id = ${EV_OUTRO_PROF}`);
    expect(r.ok, "evidência de outro profissional sustentou a mudança").toBe(false);
    expect(r.saida).toContain("professional_subcriterion_map_evidencia_fk");
  });

  it("T6 · novo vínculo de OUTRO conceito → RECUSA (constraint trigger de conceito)", () => {
    restaurarLinha();
    const r = alterar(`status = 'NAO_INFORMADO', evidence_id = ${EV_OUTRO_CONCEITO}`);
    expect(r.ok, "evidência de outro conceito sustentou a mudança").toBe(false);
    expect(r.saida).toContain("Evidencia de outro conceito");
    expect(r.saida).toContain("1.8-R1 §3.4");
  });

  it("revincular SEM mudar status permanece permitido — o MR1 não expandiu o contrato", () => {
    restaurarLinha();
    const r = alterar(`evidence_id = ${EV_A}`);
    expect(r.ok, r.saida).toBe(true);
    restaurarLinha();
  });
});

describe("§22.7 · concorrência real — duas conexões, a mesma confirmação", () => {
  it("o row-lock serializa; nenhuma gravação perde o vínculo; a final é sustentada pela evidência da vencedora", async () => {
    restaurarLinha();
    const subId = idDoConceito(CONCEITO);

    const estadoInicial = psql(
      `select status || '|' || evidence_id from curadoria.professional_subcriterion_map where professional_profile_id=${PROF} and subcriterion_id='${subId}'::uuid`,
    ).saida;
    expect(estadoInicial).toBe(`CONFIRMADO|${EV0.replace(/'/g, "").replace("::uuid", "")}`);

    // Conexão A: BEGIN → UPDATE (segura o row-lock) → pg_sleep(2) → COMMIT.
    // Conexão B: parte ~600ms depois, em autocommit — fica BLOQUEADA no lock
    // até A commitar, e então o BEFORE UPDATE reavalia contra o estado que A
    // gravou. Duas conexões de verdade: processos psql independentes.
    const a = execFileAsync(
      "docker",
      ARGS(`
        begin;
        update curadoria.professional_subcriterion_map
        set status = 'NAO_INFORMADO', evidence_id = ${EV_A}
        where professional_profile_id = ${PROF} and subcriterion_id = '${subId}'::uuid;
        select pg_sleep(2);
        commit;
        select 'A_COMMIT';
      `),
      { encoding: "utf-8" },
    ).then(
      (r) => ({ quem: "A", ok: true, saida: r.stdout }),
      (e) => ({ quem: "A", ok: false, saida: `${e.stdout ?? ""}${e.stderr ?? ""}` }),
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    const b = execFileAsync(
      "docker",
      ARGS(`
        update curadoria.professional_subcriterion_map
        set status = 'NAO_CONFIRMADO', evidence_id = ${EV_B}
        where professional_profile_id = ${PROF} and subcriterion_id = '${subId}'::uuid;
        select 'B_COMMIT';
      `),
      { encoding: "utf-8" },
    ).then(
      (r) => ({ quem: "B", ok: true, saida: r.stdout }),
      (e) => ({ quem: "B", ok: false, saida: `${e.stdout ?? ""}${e.stderr ?? ""}` }),
    );

    const [ra, rb] = await Promise.all([a, b]);

    // A ordem efetiva: A segura o lock por ~2s e commita primeiro; B esperou o
    // lock, reavaliou OLD = (NAO_INFORMADO, EV_A) e gravou por cima com um
    // vínculo NOVO e explícito — reapresentação legítima. Determinístico: A
    // aplica, B vence por último commit.
    expect(ra.ok, `A falhou: ${ra.saida}`).toBe(true);
    expect(rb.ok, `B falhou: ${rb.saida}`).toBe(true);

    const final = psql(
      `select status || '|' || evidence_id from curadoria.professional_subcriterion_map where professional_profile_id=${PROF} and subcriterion_id='${subId}'::uuid`,
    ).saida;
    // A confirmação final é sustentada EXATAMENTE pela evidência que a
    // gravação vencedora (B) apresentou — nunca por vínculo herdado, nunca
    // por NULL.
    expect(final).toBe(`NAO_CONFIRMADO|${EV_B.replace(/'/g, "").replace("::uuid", "")}`);

    // E a variante em que B tenta vencer SEM reapresentar: bloqueia.
    restaurarLinha();
    const a2 = execFileAsync(
      "docker",
      ARGS(`
        begin;
        update curadoria.professional_subcriterion_map
        set status = 'NAO_INFORMADO', evidence_id = ${EV_A}
        where professional_profile_id = ${PROF} and subcriterion_id = '${subId}'::uuid;
        select pg_sleep(2);
        commit;
      `),
      { encoding: "utf-8" },
    ).then(
      (r) => ({ ok: true, saida: r.stdout }),
      (e) => ({ ok: false, saida: `${e.stdout ?? ""}${e.stderr ?? ""}` }),
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
    const b2 = execFileAsync(
      "docker",
      // B muda o status e ZERA o vínculo — contra o estado que A gravou, o
      // trigger recusa: é a borda do MR1 valendo também sob concorrência.
      ARGS(`
        update curadoria.professional_subcriterion_map
        set status = 'NAO_CONFIRMADO', evidence_id = null
        where professional_profile_id = ${PROF} and subcriterion_id = '${subId}'::uuid;
      `),
      { encoding: "utf-8" },
    ).then(
      (r) => ({ ok: true, saida: r.stdout }),
      (e) => ({ ok: false, saida: `${e.stdout ?? ""}${e.stderr ?? ""}` }),
    );
    const [ra2, rb2] = await Promise.all([a2, b2]);
    expect(ra2.ok).toBe(true);
    expect(rb2.ok, "B zerou o vínculo sob concorrência").toBe(false);
    expect(rb2.saida).toContain("apagando o vinculo de evidencia");

    const final2 = psql(
      `select status || '|' || evidence_id from curadoria.professional_subcriterion_map where professional_profile_id=${PROF} and subcriterion_id='${subId}'::uuid`,
    ).saida;
    // Nenhuma gravação perdeu o vínculo: vale o estado que A apresentou.
    expect(final2).toBe(`NAO_INFORMADO|${EV_A.replace(/'/g, "").replace("::uuid", "")}`);

    restaurarLinha();
  }, 30_000);
});
