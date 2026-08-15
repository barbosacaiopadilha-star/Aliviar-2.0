import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";
import { containerDoBanco } from "../apoio/stack-local";

/**
 * =============================================================================
 * ITEM 2.3 — DIVISÃO DA AVALIAÇÃO: O CAMINHO OPERACIONAL, PROVADO NO BANCO
 * =============================================================================
 *
 * CONTRATO_2_3 (PA-16). O Motor lê e sinaliza; o Curador conclui; o BANCO
 * arbitra; a etapa deriva. O que se prova aqui:
 *
 *   · `registrar_julgamento`: gate-first, autoria por sessão, os quatro
 *     desfechos do §7 — e a idempotência do PA-15 ("mesmo conteúdo" = todos
 *     os campos materiais; outro ator JAMAIS recebe sucesso idempotente);
 *   · `retirar_julgamento` / RS-2.3-1: retirar exige CUMULATIVAMENTE ser
 *     Curador do Case E autor da versão vigente — o sucessor supersede,
 *     nunca retira ato alheio;
 *   · trigger JS3: evidência nova supersede o juízo compatível na MESMA
 *     transação, sem criar juízo, sem copiar conclusão;
 *   · a tabela permanece INTOCÁVEL (zero policy, zero grant) — todo acesso
 *     pelas capabilities; concorrência arbitrada pelos índices do 2.4.
 *
 * A identidade é simulada pelo mecanismo real (`request.jwt.claim.sub`);
 * fixtures sintéticas em transação revertida; resíduo zero.
 */

const CONTAINER = containerDoBanco();

function psql(script: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"],
    { input: script, encoding: "utf8" },
  ).trim();
}

function emTransacaoRevertida(corpo: string): string {
  return psql(`begin;\n${corpo}\nrollback;`);
}

const CURADOR_A = "00000000-0000-4000-8000-000000230a01";
const CURADOR_B = "00000000-0000-4000-8000-000000230b01";
const PACIENTE = "00000000-0000-4000-8000-000000230c01";
const PERFIL = "00000000-0000-4000-8000-000000230d01";
const CASE_ID = "00000000-0000-4000-8000-000000231001";
const OUTRO_CASE = "00000000-0000-4000-8000-000000231002";

const EV_FORMACAO = "00000000-0000-4000-8000-000000232001";
const EV_EXPERIENCIA = "00000000-0000-4000-8000-000000232002";
const EV_REL_DECISAO = "00000000-0000-4000-8000-000000232003";

const FIXTURE = `
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${CURADOR_A}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '23-curador-a@local', 'x', now(), now()),
  ('${CURADOR_B}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '23-curador-b@local', 'x', now(), now()),
  ('${PACIENTE}',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '23-paciente@local', 'x', now(), now());

insert into curadoria.patient_stories (id, profile_id, created_by, status) values
  ('00000000-0000-4000-8000-000000233001', '${PACIENTE}', '${PACIENTE}', 'enviada'),
  ('00000000-0000-4000-8000-000000233002', '${PACIENTE}', '${PACIENTE}', 'enviada');

insert into curadoria.cases (id, patient_profile_id, source_story_id, assigned_curator_id, created_by) values
  ('${CASE_ID}',   '${PACIENTE}', '00000000-0000-4000-8000-000000233001', '${CURADOR_A}', '${PACIENTE}'),
  ('${OUTRO_CASE}','${PACIENTE}', '00000000-0000-4000-8000-000000233002', '${CURADOR_A}', '${PACIENTE}');

insert into curadoria.professional_profiles (id, profile_id, display_name, professional_identifier, created_by) values
  ('${PERFIL}', null, 'Profissional da Divisao 2.3', 'CRM-23-0001', '${CURADOR_A}');

insert into curadoria.practice_evidence
  (id, professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
values
  ('${EV_FORMACAO}',    '${PERFIL}', 'FORMACAO_GRADUACAO', 1, '{}', 'INSTITUCIONAL', 'diploma', now(), '${CURADOR_A}', 'nao_verificado'),
  ('${EV_EXPERIENCIA}', '${PERFIL}', 'EXPERIENCIA_TEMPO_DE_PRATICA', 1, '{ATE_2}', 'INSTITUCIONAL', 'registro', now(), '${CURADOR_A}', 'nao_verificado'),
  ('${EV_REL_DECISAO}', '${PERFIL}', 'MODELO_DECISAO_COMPARTILHADA', 1, '{APRESENTA_TODAS_AS_OPCOES_ADEQUADAS}', 'INSTITUCIONAL', 'entrevista', now(), '${CURADOR_A}', 'nao_verificado');
`;

function COMO(quem: string | null): string {
  return quem
    ? `select set_config('request.jwt.claim.sub', '${quem}', true);`
    : `select set_config('request.jwt.claim.sub', '', true);`;
}

function REGISTRAR(opts: {
  marcador?: string;
  conceito?: string;
  natureza?: string;
  conclusao?: string;
  refs?: string;
  motivo?: string | null;
  base?: string | null;
}): string {
  const {
    marcador = "R",
    conceito = "FORMACAO",
    natureza = "TECNICO",
    conclusao = "Formacao adequada ao Case.",
    refs = `[{"id": "${EV_FORMACAO}", "version": 1}]`,
    motivo = null,
    base = null,
  } = opts;
  return `
select set_config('t.ultimo_id', coalesce(r.versao_id::text, ''), true) is not null,
       set_config('t.saida_${marcador}', r.desfecho || '/' || coalesce(r.versao_id::text, '<null>'), true) is not null
from curadoria.registrar_julgamento(
  '${CASE_ID}'::uuid, '${PERFIL}'::uuid, '${conceito}', '${natureza}', '${conclusao}',
  '[]'::jsonb, '${refs}'::jsonb,
  ${motivo === null ? "null" : `'${motivo}'`},
  ${base === null ? "null" : base}
) as r;
select '${marcador}=' || split_part(current_setting('t.saida_${marcador}', true), '/', 1);`;
}

const ID_GRAVADO = `nullif(current_setting('t.ultimo_id', true), '')::uuid`;

afterAll(() => {
  const residuo = psql(`
select (select count(*) from curadoria.curator_judgments)
  || '|' || (select count(*) from curadoria.curator_judgment_evidence_refs)
  || '|' || (select count(*) from auth.users where email like '23-%@local')
  || '|' || (select count(*) from curadoria.audit_logs where action = 'julgamento_retirado');`);
  expect(residuo, "fixture do 2.3 vazou").toBe("0|0|0|0");
});

// ---------------------------------------------------------------------------
// registrar_julgamento — §7
// ---------------------------------------------------------------------------

describe("§7 · registrar_julgamento — gate, autoria e os desfechos fechados", () => {
  it("sem sessão → SEM_AUTORIDADE, nada gravado", () => {
    const saida = emTransacaoRevertida(FIXTURE + COMO(null) + REGISTRAR({}));
    expect(saida).toContain("R=SEM_AUTORIDADE");
  });

  it("quem não é o Curador do Case → SEM_AUTORIDADE (gate-first)", () => {
    const saida = emTransacaoRevertida(FIXTURE + COMO(CURADOR_B) + REGISTRAR({}));
    expect(saida).toContain("R=SEM_AUTORIDADE");
  });

  it("nascimento válido → JUIZO_REGISTRADO: v1 VIGENTE, autoria da sessão, refs com o estado REAL", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({}) +
        `
select 'FOTO=' || j.versao || '/' || j.state || '/' || (j.actor_id = '${CURADOR_A}')::text
    || '/refs:' || (select count(*) from curadoria.curator_judgment_evidence_refs r where r.judgment_id = j.id)
    || '/' || (select r.verification_status::text from curadoria.curator_judgment_evidence_refs r where r.judgment_id = j.id)
from curadoria.curator_judgments j where j.subcriterion_code = 'FORMACAO';`,
    );
    expect(saida).toContain("R=JUIZO_REGISTRADO");
    expect(saida).toContain("FOTO=1/VIGENTE/true/refs:1/nao_verificado");
  });

  it("revisão válida sobre a vigente → v1 SUPERADO + v2 VIGENTE, na MESMA transação", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        REGISTRAR({ marcador: "R2", conclusao: "Revisto com o diploma novo.", base: ID_GRAVADO }) +
        `
select 'CADEIA=' || string_agg(versao || ':' || state, ' -> ' order by versao)
from curadoria.curator_judgments where subcriterion_code = 'FORMACAO';`,
    );
    expect(saida).toContain("R1=JUIZO_REGISTRADO");
    expect(saida).toContain("R2=JUIZO_REGISTRADO");
    expect(saida).toContain("CADEIA=1:SUPERADO -> 2:VIGENTE");
  });

  it("retry do MESMO ator com MESMO conteúdo → VERSAO_JA_GRAVADA, nada duplicado", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.base', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }) +
        REGISTRAR({ marcador: "R3", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }) +
        `select 'TOTAL=' || count(*) from curadoria.curator_judgments;`,
    );
    expect(saida).toContain("R2=JUIZO_REGISTRADO");
    expect(saida).toContain("R3=VERSAO_JA_GRAVADA");
    expect(saida).toContain("TOTAL=2");
  });

  it("mesmo ator, mesma base, conteúdo DIFERENTE → CONFLITO_DE_VERSAO (a idempotência é do conteúdo)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.base', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }) +
        REGISTRAR({ marcador: "R3", conclusao: "OUTRA conclusao.", base: `current_setting('t.base', true)::uuid` }),
    );
    expect(saida).toContain("R3=CONFLITO_DE_VERSAO");
  });

  it("mutação de UM campo material (motivo) quebra a idempotência — PA-15 executável", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.base', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }) +
        REGISTRAR({ marcador: "R3", conclusao: "Revisao.", motivo: "agora com motivo", base: `current_setting('t.base', true)::uuid` }),
    );
    expect(saida).toContain("R3=CONFLITO_DE_VERSAO");
  });

  it("OUTRO ator sobre base já sucedida — mesmo conteúdo idêntico → CONFLITO, nunca idempotência alheia", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.base', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }) +
        // O Case é reatribuído — o sucessor tem TODA a autoridade de Case…
        `update curadoria.cases set assigned_curator_id = '${CURADOR_B}' where id = '${CASE_ID}';` +
        COMO(CURADOR_B) +
        // …e repete o ATO ALHEIO byte a byte. Autoria não se herda.
        REGISTRAR({ marcador: "R3", conclusao: "Revisao.", base: `current_setting('t.base', true)::uuid` }),
    );
    expect(saida).toContain("R3=CONFLITO_DE_VERSAO");
  });

  it("base null com cadeia existente → CONFLITO_DE_VERSAO (o ator não viu o que existe)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        REGISTRAR({ marcador: "R2", conclusao: "Sem saber da v1." }),
    );
    expect(saida).toContain("R2=CONFLITO_DE_VERSAO");
  });

  it("retry do PRIMEIRO ato (base null, mesmo conteúdo) → VERSAO_JA_GRAVADA", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + COMO(CURADOR_A) + REGISTRAR({ marcador: "R1" }) + REGISTRAR({ marcador: "R2" }),
    );
    expect(saida).toContain("R2=VERSAO_JA_GRAVADA");
  });

  it("base obsoleta (aponta v1 quando a ponta é v2) → CONFLITO_DE_VERSAO", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.v1', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao.", base: `current_setting('t.v1', true)::uuid` }) +
        REGISTRAR({ marcador: "R3", conclusao: "Terceira, ancorada errado.", base: `current_setting('t.v1', true)::uuid` }),
    );
    expect(saida).toContain("R3=CONFLITO_DE_VERSAO");
  });

  it("base inexistente e base de outro alvo → CONFLITO_DE_VERSAO", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1", base: `'00000000-0000-4000-8000-00000023dead'::uuid` }) +
        REGISTRAR({ marcador: "R2", conceito: "EXPERIENCIA", refs: "[]" }) +
        `select set_config('t.exp', current_setting('t.ultimo_id', true), true);` +
        REGISTRAR({ marcador: "R3", conceito: "FORMACAO", base: `current_setting('t.exp', true)::uuid` }),
    );
    expect(saida).toContain("R1=CONFLITO_DE_VERSAO");
    expect(saida).toContain("R3=CONFLITO_DE_VERSAO");
  });

  it("o writer NÃO flexibiliza o banco: família errada nas refs derruba o ato inteiro — nada parcial", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        `
do $tenta$
begin
  perform * from curadoria.registrar_julgamento(
    '${CASE_ID}'::uuid, '${PERFIL}'::uuid, 'FORMACAO', 'TECNICO', 'Com evidencia errada.',
    '[]'::jsonb, '[{"id": "${EV_EXPERIENCIA}", "version": 1}]'::jsonb, null, null);
  perform set_config('t.out', 'PASSOU', true);
exception when others then
  perform set_config('t.out', 'SQLSTATE:' || sqlstate, true);
end $tenta$;
select 'FAMILIA=' || current_setting('t.out', true);
select 'RESTOU=' || (select count(*) from curadoria.curator_judgments);`,
    );
    expect(saida).toContain("FAMILIA=SQLSTATE:23001");
    expect(saida).toContain("RESTOU=0");
  });

  it("pós-RETIRADO: novo ato com base na retirada abre v2 VIGENTE na mesma cadeia", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.v1', current_setting('t.ultimo_id', true), true);
select desfecho from curadoria.retirar_julgamento(current_setting('t.v1', true)::uuid, null);` +
        REGISTRAR({ marcador: "R2", conclusao: "Novo juizo apos retirada.", base: `current_setting('t.v1', true)::uuid` }) +
        `select 'CADEIA=' || string_agg(versao || ':' || state, ' -> ' order by versao)
from curadoria.curator_judgments where subcriterion_code = 'FORMACAO';`,
    );
    expect(saida).toContain("R2=JUIZO_REGISTRADO");
    expect(saida).toContain("CADEIA=1:RETIRADO -> 2:VIGENTE");
  });
});

// ---------------------------------------------------------------------------
// retirar_julgamento — RS-2.3-1
// ---------------------------------------------------------------------------

describe("RS-2.3-1 · retirar exige Curador do Case E autor da versão — cumulativamente", () => {
  const PREPARO =
    COMO(CURADOR_A) +
    REGISTRAR({ marcador: "R1" }) +
    `select set_config('t.v1', current_setting('t.ultimo_id', true), true);`;

  function RETIRAR(motivo: string | null = null): string {
    return `
select 'RET=' || r.desfecho from curadoria.retirar_julgamento(
  current_setting('t.v1', true)::uuid,
  ${motivo === null ? "null" : `'${motivo}'`}
) as r;`;
  }

  it("o AUTOR, Curador do Case, retira — motivo oferecido vai à trilha", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PREPARO +
        RETIRAR("julguei cedo demais") +
        `
select 'ESTADO=' || state from curadoria.curator_judgments where id = current_setting('t.v1', true)::uuid;
select 'TRILHA=' || (metadata ->> 'motivo') from curadoria.audit_logs where action = 'julgamento_retirado';`,
    );
    expect(saida).toContain("RET=JUIZO_RETIRADO");
    expect(saida).toContain("ESTADO=RETIRADO");
    expect(saida).toContain("TRILHA=julguei cedo demais");
  });

  it("sem motivo → JUIZO_RETIRADO igual — oferecido, NUNCA exigido", () => {
    const saida = emTransacaoRevertida(FIXTURE + PREPARO + RETIRAR(null));
    expect(saida).toContain("RET=JUIZO_RETIRADO");
  });

  it("Curador do Case que NÃO é o autor → SEM_AUTORIDADE, e o juízo segue VIGENTE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PREPARO +
        `update curadoria.cases set assigned_curator_id = '${CURADOR_B}' where id = '${CASE_ID}';` +
        COMO(CURADOR_B) +
        RETIRAR("discordo do anterior") +
        `select 'ESTADO=' || state from curadoria.curator_judgments where id = current_setting('t.v1', true)::uuid;`,
    );
    expect(saida).toContain("RET=SEM_AUTORIDADE");
    expect(saida).toContain("ESTADO=VIGENTE");
  });

  it("o sucessor que discorda SUPERSEDE por versão própria — o caminho que EXISTE para ele", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PREPARO +
        `update curadoria.cases set assigned_curator_id = '${CURADOR_B}' where id = '${CASE_ID}';` +
        COMO(CURADOR_B) +
        REGISTRAR({ marcador: "R2", conclusao: "Leio diferente do colega.", base: `current_setting('t.v1', true)::uuid` }) +
        `select 'CADEIA=' || string_agg(versao || ':' || state || ':' || (actor_id = '${CURADOR_B}')::text, ' -> ' order by versao)
from curadoria.curator_judgments where subcriterion_code = 'FORMACAO';`,
    );
    expect(saida).toContain("R2=JUIZO_REGISTRADO");
    expect(saida).toContain("CADEIA=1:SUPERADO:false -> 2:VIGENTE:true");
  });

  it("quem não é Curador do Case → SEM_AUTORIDADE; sem sessão → SEM_AUTORIDADE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PREPARO +
        COMO(CURADOR_B) +
        RETIRAR() +
        `select set_config('t.saida2', '', true);` +
        COMO(null) +
        `select 'RET2=' || r.desfecho from curadoria.retirar_julgamento(current_setting('t.v1', true)::uuid, null) as r;`,
    );
    expect(saida).toContain("RET=SEM_AUTORIDADE");
    expect(saida).toContain("RET2=SEM_AUTORIDADE");
  });

  it("julgamento inexistente funde com SEM_AUTORIDADE — a capability não confirma existência", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        `select 'RET=' || r.desfecho from curadoria.retirar_julgamento('00000000-0000-4000-8000-00000023dead'::uuid, null) as r;`,
    );
    expect(saida).toContain("RET=SEM_AUTORIDADE");
  });

  it("versão não-vigente (já superada) → CONFLITO_DE_VERSAO — retirada × supersessão arbitrada", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PREPARO +
        REGISTRAR({ marcador: "R2", conclusao: "Revisao antes da retirada.", base: `current_setting('t.v1', true)::uuid` }) +
        RETIRAR("tarde demais"),
    );
    expect(saida).toContain("RET=CONFLITO_DE_VERSAO");
  });
});

// ---------------------------------------------------------------------------
// JS3 — evidência nova supersede, sem criar, sem copiar
// ---------------------------------------------------------------------------

describe("§10 · JS3 — evidência nova supersede o juízo compatível, na mesma transação", () => {
  const NOVA_EVIDENCIA = (code: string, version: number) => `
insert into curadoria.practice_evidence
  (professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
values ('${PERFIL}', '${code}', ${version},
        case when '${code}' = 'EXPERIENCIA_TEMPO_DE_PRATICA' then '{ATE_2}'::text[]
             when '${code}' = 'MODELO_DECISAO_COMPARTILHADA' then '{APRESENTA_TODAS_AS_OPCOES_ADEQUADAS}'::text[]
             when '${code}' = 'MODELO_PREFERENCIAS_E_RESTRICOES' then '{REGISTRA_A_RESTRICAO_NO_PRONTUARIO}'::text[]
             else '{}'::text[] end,
        'INSTITUCIONAL', 'fato novo', now(), '${CURADOR_A}', 'nao_verificado');`;

  it("TECNICO por família: FORMACAO_* nova supersede o juízo FORMACAO — sem sucessora, sem cópia", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        NOVA_EVIDENCIA("FORMACAO_GRADUACAO", 2) +
        `
select 'DEPOIS=' || j.state || '/sucessora:' || exists(select 1 from curadoria.curator_judgments s where s.versao_anterior_id = j.id)::text
from curadoria.curator_judgments j where j.subcriterion_code = 'FORMACAO';
select 'TOTAL=' || count(*) from curadoria.curator_judgments;`,
    );
    // Superado NA transação da evidência; NENHUM julgamento novo nasceu
    // (total segue 1) e nada foi pré-preenchido — o novo ato é humano.
    expect(saida).toContain("DEPOIS=SUPERADO/sucessora:false");
    expect(saida).toContain("TOTAL=1");
  });

  it("RELACIONAL por código: evidência do MESMO conceito supersede", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({
          marcador: "R1",
          conceito: "MODELO_DECISAO_COMPARTILHADA",
          natureza: "RELACIONAL",
          conclusao: "Conduz decisao junto.",
          refs: `[{"id": "${EV_REL_DECISAO}", "version": 1}]`,
        }) +
        NOVA_EVIDENCIA("MODELO_DECISAO_COMPARTILHADA", 2) +
        `select 'DEPOIS=' || state from curadoria.curator_judgments;`,
    );
    expect(saida).toContain("DEPOIS=SUPERADO");
  });

  it("fora do domínio, NADA acontece: HISTORICO_* nova não toca FORMACAO nem EXPERIENCIA", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        REGISTRAR({ marcador: "R2", conceito: "EXPERIENCIA", conclusao: "Experiencia suficiente.", refs: "[]" }) +
        NOVA_EVIDENCIA("HISTORICO_AREAS_DE_ATUACAO", 1) +
        `select 'ESTADOS=' || string_agg(subcriterion_code || ':' || state, ',' order by subcriterion_code)
from curadoria.curator_judgments;`,
    );
    expect(saida).toContain("ESTADOS=EXPERIENCIA:VIGENTE,FORMACAO:VIGENTE");
  });

  it("RELACIONAL de código diferente não é afetado por evidência de outro conceito relacional", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({
          marcador: "R1",
          conceito: "MODELO_DECISAO_COMPARTILHADA",
          natureza: "RELACIONAL",
          conclusao: "Conduz decisao junto.",
          refs: "[]",
        }) +
        NOVA_EVIDENCIA("MODELO_PREFERENCIAS_E_RESTRICOES", 1) +
        `select 'DEPOIS=' || state from curadoria.curator_judgments;`,
    );
    expect(saida).toContain("DEPOIS=VIGENTE");
  });

  it("pós-JS3 o ciclo fecha por ATO HUMANO: nova versão com base na superada, conclusão própria", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.v1', current_setting('t.ultimo_id', true), true);` +
        NOVA_EVIDENCIA("FORMACAO_GRADUACAO", 2) +
        REGISTRAR({
          marcador: "R2",
          conclusao: "Reli com o fato novo; concluo o mesmo, por decisao minha.",
          base: `current_setting('t.v1', true)::uuid`,
        }) +
        `select 'CADEIA=' || string_agg(versao || ':' || state, ' -> ' order by versao)
from curadoria.curator_judgments where subcriterion_code = 'FORMACAO';`,
    );
    expect(saida).toContain("R2=JUIZO_REGISTRADO");
    expect(saida).toContain("CADEIA=1:SUPERADO -> 2:VIGENTE");
  });
});

// ---------------------------------------------------------------------------
// Leitura da Mesa e segurança
// ---------------------------------------------------------------------------

describe("§12 · leitura gate-first e a tabela intocável", () => {
  it("o Curador lê a cadeia com sucessão e refs; não-curador e sem-sessão leem NADA", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `
select 'LEITURA=' || count(*) || '/' || min(subcriterion_code) from curadoria.ler_julgamentos_para_avaliacao('${CASE_ID}'::uuid, '${PERFIL}'::uuid);` +
        COMO(CURADOR_B) +
        `select 'ALHEIO=' || count(*) from curadoria.ler_julgamentos_para_avaliacao('${CASE_ID}'::uuid, '${PERFIL}'::uuid);` +
        COMO(null) +
        `select 'ANONIMO=' || count(*) from curadoria.ler_julgamentos_para_avaliacao('${CASE_ID}'::uuid, '${PERFIL}'::uuid);`,
    );
    expect(saida).toContain("LEITURA=1/FORMACAO");
    expect(saida).toContain("ALHEIO=0");
    expect(saida).toContain("ANONIMO=0");
  });

  it("a tabela segue INTOCÁVEL: zero policy, zero grant — o caminho é a capability", () => {
    const saida = psql(`
select (select count(*) from pg_policies where schemaname = 'curadoria' and tablename like 'curator_judgment%')
  || '|' || (select count(*) from information_schema.role_table_grants
             where table_schema = 'curadoria' and table_name like 'curator_judgment%'
               and grantee in ('anon', 'authenticated'));`);
    expect(saida).toBe("0|0");
  });

  it("grants exatos: as três capabilities a authenticated; anon e PUBLIC sem nada; comparador interno fechado", () => {
    const saida = psql(`
select has_function_privilege('authenticated', 'curadoria.registrar_julgamento(uuid,uuid,text,text,text,jsonb,jsonb,text,uuid)', 'execute')::text
  || '|' || has_function_privilege('authenticated', 'curadoria.retirar_julgamento(uuid,text)', 'execute')::text
  || '|' || has_function_privilege('authenticated', 'curadoria.ler_julgamentos_para_avaliacao(uuid,uuid)', 'execute')::text
  || '|' || has_function_privilege('anon', 'curadoria.registrar_julgamento(uuid,uuid,text,text,text,jsonb,jsonb,text,uuid)', 'execute')::text
  || '|' || has_function_privilege('anon', 'curadoria.retirar_julgamento(uuid,text)', 'execute')::text
  || '|' || has_function_privilege('authenticated', 'curadoria.julgamento_tem_mesmo_conteudo(uuid,text,text,text,text,jsonb,jsonb)', 'execute')::text;`);
    expect(saida).toBe("true|true|true|false|false|false");
  });

  it("G-2.3-3 · nenhuma assinatura aceita autor — a identidade é a sessão", () => {
    const saida = psql(`
select coalesce(string_agg(p.proname, ','), '<nenhuma>')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria'
  and p.proname in ('registrar_julgamento', 'retirar_julgamento', 'ler_julgamentos_para_avaliacao')
  and pg_get_function_arguments(p.oid) ilike '%actor%';`);
    expect(saida).toBe("<nenhuma>");
  });

  it("G-2.3-4 · gate-first no fonte vivo: a boundary vem antes do primeiro acesso a dado material", () => {
    const registrar = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'curadoria' and p.proname = 'registrar_julgamento';`,
    );
    expect(registrar.indexOf("is_curator_for_case")).toBeGreaterThan(-1);
    expect(registrar.indexOf("is_curator_for_case")).toBeLessThan(
      registrar.indexOf("from curadoria.curator_judgments"),
    );
    const ler = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'curadoria' and p.proname = 'ler_julgamentos_para_avaliacao';`,
    );
    expect(ler.indexOf("is_curator_for_case")).toBeLessThan(
      ler.indexOf("from curadoria.curator_judgments"),
    );
  });

  it("G-2.3-7 · criterion_declarations permanece intacta — a migration do 2.3 nem a menciona", () => {
    const saida = psql(
      `select 'existe=' || (to_regclass('curadoria.criterion_declarations') is not null)::text;`,
    );
    expect(saida).toBe("existe=true");
    // A prova estática (unit) varre a migration; aqui, o fato vivo: a tabela
    // continua de pé com suas policies de sempre — nenhum objeto do 2.3 a toca.
    const funcoes = psql(`
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria'
  and p.proname in ('registrar_julgamento','retirar_julgamento','ler_julgamentos_para_avaliacao','js3_evidencia_nova_supersede_juizo')
  and p.prosrc ilike '%criterion_declarations%';`);
    expect(funcoes).toBe("0");
  });
});

// ---------------------------------------------------------------------------
// Concorrência — o árbitro é o banco
// ---------------------------------------------------------------------------

describe("§19 · concorrência — o conjunto estrutural do 2.4 decide; o writer traduz", () => {
  it("sucessora criada por FORA entre a leitura e o ato → a capability traduz para CONFLITO_DE_VERSAO", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `select set_config('t.v1', current_setting('t.ultimo_id', true), true);
-- a "outra transação": sucessão gravada direto na cadeia (o que uma corrida
-- committed produziria antes do nosso ato)
update curadoria.curator_judgments set state = 'SUPERADO' where id = current_setting('t.v1', true)::uuid;
insert into curadoria.curator_judgments
  (case_id, professional_profile_id, subcriterion_code, natureza, conclusao, fatos_visiveis, catalog_version, versao, versao_anterior_id, actor_id)
values ('${CASE_ID}', '${PERFIL}', 'FORMACAO', 'TECNICO', 'A corrida venceu.', '[]', '1.1.0', 2, current_setting('t.v1', true)::uuid, '${CURADOR_A}');` +
        REGISTRAR({ marcador: "R2", conclusao: "Chego atrasado.", base: `current_setting('t.v1', true)::uuid` }),
    );
    expect(saida).toContain("R2=CONFLITO_DE_VERSAO");
  });

  it("os árbitros declarativos seguem armados: segunda VIGENTE direta no alvo cai no índice (23505)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        COMO(CURADOR_A) +
        REGISTRAR({ marcador: "R1" }) +
        `
do $tenta$
begin
  insert into curadoria.curator_judgments
    (case_id, professional_profile_id, subcriterion_code, natureza, conclusao, fatos_visiveis, catalog_version, versao, versao_anterior_id, actor_id)
  values ('${CASE_ID}', '${PERFIL}', 'FORMACAO', 'TECNICO', 'Segunda vigente.', '[]', '1.1.0', 2,
          nullif(current_setting('t.ultimo_id', true), '')::uuid, '${CURADOR_A}');
  perform set_config('t.out', 'PASSOU', true);
exception when unique_violation then
  perform set_config('t.out', 'SQLSTATE:23505', true);
end $tenta$;
select 'ARBITRO=' || current_setting('t.out', true);`,
    );
    expect(saida).toContain("ARBITRO=SQLSTATE:23505");
  });
});
