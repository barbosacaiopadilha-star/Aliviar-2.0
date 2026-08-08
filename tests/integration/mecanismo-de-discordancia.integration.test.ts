// ITEM 1.12 — O MECANISMO DE DISCORDÂNCIA, PROVADO CONTRA O BANCO REAL.
//
// P-10: "confirmar não pode ser mais barato que discordar". O que este arquivo
// prova é a metade TRANSACIONAL da Fronteira (CONTRATO_1_12 §6): o ato humano
// como entidade própria, a projeção do estado, a atomicidade do efeito, a
// idempotência lavrada e a concorrência declarativa — tudo INERTE: a
// capability nasce sem grant, e nenhum ato humano real sobrevive aos testes.
//
// AUTORIA. `decidir_proposta` só reconhece `auth.uid()`. Os testes simulam a
// identidade pelo MESMO mecanismo que a plataforma usa (o GUC transacional
// `request.jwt.claim.sub`, que é de onde `auth.uid()` lê) — não é atalho: é o
// caminho real, sem o transporte HTTP. `service_role` não decide, payload não
// decide, e há teste para os dois.
//
// PADRÃO 2.2C: fixtures sintéticas em transação SEMPRE revertida; `afterAll`
// derruba a suíte se sobrar resíduo. Zero ato real ao final.

import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";
const REGRAS = "curadoria.derivation_rules";
const TRANSICOES = "curadoria.derivation_rule_transitions";
const MAPA_REGRA = "curadoria.derivation_rule_degree_map";
const PROPOSTAS = "curadoria.derivation_proposals";
const ATOS = "curadoria.derivation_proposal_acts";
const NEEDS = "curadoria.case_needs";
const MAPA = "curadoria.case_priority_map";

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

function emTransacaoRevertida(corpo: string): { ok: boolean; saida: string } {
  return psql(`begin;\n${corpo}\nrollback;`);
}

// --- Fixtures sintéticas (padrão 2.2C) --------------------------------------

const PESSOA = "'00000000-0000-4000-8000-0000000112c1'::uuid";
const STORY = "'00000000-0000-4000-8000-0000000112c2'::uuid";
const CASO = "'00000000-0000-4000-8000-0000000112c3'::uuid";
const CURADOR = "'00000000-0000-4000-8000-0000000112d1'::uuid";
const OUTRO_CURADOR = "'00000000-0000-4000-8000-0000000112d2'::uuid";
const AUTORIDADE_FIXTURE = "'00000000-0000-4000-8000-0000000112a1'::uuid";
const CONCEITO = "MODELO_COMUNICACAO";

/** Pessoa, história, Case COM Curador responsável, e um segundo Curador. */
const CASE_FIXTURE = `
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at) values
    (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fixture-112-pessoa@local', 'x', now(), now()),
    (${CURADOR}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fixture-112-curador@local', 'x', now(), now()),
    (${OUTRO_CURADOR}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fixture-112-outro@local', 'x', now(), now());
  insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
  insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by, assigned_curator_id)
  values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA}, ${CURADOR});`;

const GRAU = `
  insert into ${NEEDS} (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
  values (${CASO}, '${CONCEITO}', '1.1.0', '{ADAPTA}', 'ESSENCIAL', 'DIRETO', ${PESSOA});`;

/** Regra vigente com cobertura total — o caminho canônico da 2.2C. */
const REGRA_VIGENTE = (id: string) => `
  insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence)
  values ('${id}', 1, 'PROPOSTA', ${AUTORIDADE_FIXTURE}, 'primeira versao, PROVISORIA', 'nenhuma operacao real');
  insert into ${TRANSICOES} (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
  values ('${id}', 1, 1, null, 'PROPOSTA', ${AUTORIDADE_FIXTURE}, 'PAPEL_INTERNO', 'proposta inicial');
  insert into ${TRANSICOES} (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
  values ('${id}', 1, 2, 'PROPOSTA', 'VIGENTE', 1, ${AUTORIDADE_FIXTURE}, 'AUTORIDADE_DE_METODO', 'ato de governanca', 'ADR-066');
  insert into ${MAPA_REGRA} (rule_id, rule_version, subcriterion_code, degree, importance) values
    ('${id}', 1, '${CONCEITO}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
    ('${id}', 1, '${CONCEITO}', 'PESA_MUITO', 'IMPORTANTE'),
    ('${id}', 1, '${CONCEITO}', 'DESEJAVEL', 'RELEVANTE'),
    ('${id}', 1, '${CONCEITO}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');`;

/** Emite a proposta inerte (2.2C) e guarda o id em GUC transacional. */
const EMITIR = (id: string) => `
  ${CASE_FIXTURE}
  ${GRAU}
  ${REGRA_VIGENTE(id)}
  select 'EMISSAO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
  select set_config('t.proposal', (select id::text from ${PROPOSTAS} where case_id = ${CASO}), true);`;

/**
 * A identidade autenticada, pelo mecanismo REAL: `auth.uid()` lê o GUC
 * `request.jwt.claim.sub` — é exatamente o que o gateway injeta numa sessão
 * de verdade. Transação-local: morre no rollback.
 */
const COMO = (quem: string) => `select set_config('request.jwt.claim.sub', ${quem.replace("::uuid", "")}, true);`;

const DECIDIR = (natureza: string, motivo = "null") =>
  `select 'DESFECHO:' || curadoria.decidir_proposta(current_setting('t.proposal')::uuid, '${natureza}', ${motivo});`;

const RAIO_X = `
  select 'ATOS:' || count(*) from ${ATOS};
  select 'ESTADO:' || state from ${PROPOSTAS} where id = current_setting('t.proposal')::uuid;
  select 'MAPA:' || count(*) from ${MAPA} m join curadoria.method_subcriteria s on s.id = m.subcriterion_id
  where m.case_id = ${CASO} and s.code = '${CONCEITO}';`;

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from ${ATOS}) || '|' || (select count(*) from ${PROPOSTAS}) || '|' ||
            (select count(*) from ${NEEDS} where case_id = ${CASO}) || '|' ||
            (select count(*) from auth.users where id in (${PESSOA}, ${CURADOR}, ${OUTRO_CURADOR}))`,
  );
  if (saida !== "0|0|0|0") {
    throw new Error(`1.12 deixou resíduo (atos|propostas|needs|users): ${saida}`);
  }
});

// ---------------------------------------------------------------------------
// §8/§15 · CONFIRMAÇÃO — ato + projeção + declaração, atomicamente
// ---------------------------------------------------------------------------
describe("confirmação — grava as duas coisas, na mesma transação", () => {
  it("ato + CONFIRMADA + declaração no Mapa com declared_by = o confirmador", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-conf")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      ${RAIO_X}
      select 'DECLARED_BY_OK:' || (m.declared_by = ${CURADOR})
      from ${MAPA} m join curadoria.method_subcriteria s on s.id = m.subcriterion_id
      where m.case_id = ${CASO} and s.code = '${CONCEITO}';
      select 'VALOR:' || m.importance
      from ${MAPA} m join curadoria.method_subcriteria s on s.id = m.subcriterion_id
      where m.case_id = ${CASO} and s.code = '${CONCEITO}';
      select 'ATO:' || a.natureza || '/' || (a.actor_id = ${CURADOR}) || '/' || a.atestado_origem_vigente || '/' || coalesce(a.motivo, '(sem motivo)')
      from ${ATOS} a;`);

    expect(r.saida).toContain("EMISSAO:EMITIDA");
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("ATOS:1");
    expect(r.saida).toContain("ESTADO:CONFIRMADA");
    expect(r.saida).toContain("MAPA:1");
    expect(r.saida).toContain("DECLARED_BY_OK:true");
    // "Cria uma declaração nova, que por acaso coincide com o proposto" —
    // o valor é o sugerido pela regra vigente.
    expect(r.saida).toContain("VALOR:MUITO_IMPORTANTE");
    expect(r.saida).toContain("ATO:CONFIRMACAO/true/true/(sem motivo)");
  });

  it("§15 · atomicidade: se a declaração no Mapa é recusada, o ATO desfaz junto", () => {
    // O caminho da confirmação passa pelos MESMOS triggers do caminho manual
    // (G-7). Perfil VALIDATED congela o Mapa → o INSERT da declaração é
    // recusado → a transação INTEIRA volta: nem ato, nem estado, nem Mapa.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-atom")}
      insert into curadoria.priority_profiles (case_id, curator_id, status, validated_at)
      values (${CASO}, ${CURADOR}, 'VALIDATED', now());
      ${COMO(CURADOR)}
      -- O handler do bloco desfaz pelo savepoint IMPLÍCITO do plpgsql: tudo o
      -- que a capability fez até a falha (ato + projeção) volta junto.
      do $tenta$ begin
        perform curadoria.decidir_proposta(current_setting('t.proposal')::uuid, 'CONFIRMACAO', null);
      exception when others then null;
      end $tenta$;
      ${RAIO_X}`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ATOS:0");
    expect(r.saida).toContain("ESTADO:PROPOSTA");
    expect(r.saida).toContain("MAPA:0");
  });
});

// ---------------------------------------------------------------------------
// §9 · RECUSA — ato + RECUSADA + NADA no Mapa
// ---------------------------------------------------------------------------
describe("recusa — produz lacuna, nunca valor", () => {
  it("ato + RECUSADA + zero linhas no Mapa", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-rec")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      ${RAIO_X}
      select 'ATO:' || a.natureza || '/' || (a.actor_id = ${CURADOR}) || '/' || a.atestado_origem_vigente
      from ${ATOS} a;`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("ATOS:1");
    expect(r.saida).toContain("ESTADO:RECUSADA");
    expect(r.saida).toContain("MAPA:0");
    expect(r.saida).toContain("ATO:RECUSA/true/true");
  });

  it("O2-D · confirmar e recusar produzem o MESMO formato de registro", () => {
    // Mesma entidade, mesmas colunas, mesmo atestado — só a natureza varia.
    const confirmacao = emTransacaoRevertida(`
      ${EMITIR("r112-fmt1")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      select 'FORMATO:' || a.natureza || '|' || (a.proposal_id is not null) || '|' || (a.actor_id is not null)
        || '|' || (a.acted_at is not null) || '|' || a.atestado_origem_vigente || '|' || (a.motivo is null)
      from ${ATOS} a;`);
    const recusa = emTransacaoRevertida(`
      ${EMITIR("r112-fmt2")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      select 'FORMATO:' || a.natureza || '|' || (a.proposal_id is not null) || '|' || (a.actor_id is not null)
        || '|' || (a.acted_at is not null) || '|' || a.atestado_origem_vigente || '|' || (a.motivo is null)
      from ${ATOS} a;`);

    expect(confirmacao.saida).toContain("FORMATO:CONFIRMACAO|true|true|true|true|true");
    expect(recusa.saida).toContain("FORMATO:RECUSA|true|true|true|true|true");
  });
});

// ---------------------------------------------------------------------------
// §7 · O GATE — um só, para os dois atos (O2-C)
// ---------------------------------------------------------------------------
describe("O2-C · quem pode confirmar pode recusar; quem não pode, não pode nada", () => {
  it("o Curador responsável passa nos DOIS sentidos", () => {
    for (const natureza of ["CONFIRMACAO", "RECUSA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`r112-gate-${natureza.toLowerCase()}`)}
        ${COMO(CURADOR)}
        ${DECIDIR(natureza)}`);
      expect(r.saida, natureza).toContain("DESFECHO:ATO_REGISTRADO");
    }
  });

  it("quem NÃO é o Curador do Case recebe SEM_AUTORIDADE nos DOIS sentidos", () => {
    for (const natureza of ["CONFIRMACAO", "RECUSA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`r112-neg-${natureza.toLowerCase()}`)}
        ${COMO(OUTRO_CURADOR)}
        ${DECIDIR(natureza)}
        select 'ATOS:' || count(*) from ${ATOS};`);
      expect(r.saida, natureza).toContain("DESFECHO:SEM_AUTORIDADE");
      expect(r.saida, `${natureza} produziu efeito sem autoridade`).toContain("ATOS:0");
    }
  });

  it("§14 · sem identidade autenticada não há decisor — payload não é autoria", () => {
    // Nenhum `request.jwt.claim.sub`: auth.uid() é null. A assinatura nem
    // ACEITA um actor_id — não existe o que forjar.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-anon")}
      ${DECIDIR("CONFIRMACAO")}
      select 'ATOS:' || count(*) from ${ATOS};`);
    expect(r.saida).toContain("DESFECHO:SEM_AUTORIDADE");
    expect(r.saida).toContain("ATOS:0");
  });
});

// ---------------------------------------------------------------------------
// §12/§13 · IDEMPOTÊNCIA — as quatro combinações lavradas
// ---------------------------------------------------------------------------
describe("idempotência — a tabela do §13, combinação por combinação", () => {
  it("mesmo ator + mesma intenção → ATO_JA_REGISTRADO (e nada é gravado de novo)", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-idem1")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      ${DECIDIR("CONFIRMACAO")}
      select 'ATOS:' || count(*) from ${ATOS};
      select 'MAPA:' || count(*) from ${MAPA} where case_id = ${CASO};`);

    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("DESFECHO:ATO_JA_REGISTRADO");
    expect(r.saida).toContain("ATOS:1");
    expect(r.saida).toContain("MAPA:1");
  });

  it("mesmo ator + intenção contrária → ATO_JA_CONSUMADO", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-idem2")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      ${DECIDIR("RECUSA")}
      select 'ATOS:' || count(*) from ${ATOS};`);

    expect(r.saida).toContain("DESFECHO:ATO_JA_CONSUMADO");
    expect(r.saida).toContain("ATOS:1");
  });

  it("OUTRO ator + mesma intenção → ATO_JA_CONSUMADO (ressalva do Guardião)", () => {
    // O cenário real da ressalva: o Case foi REATRIBUÍDO depois da decisão. O
    // novo Curador passa no gate — e ainda assim NÃO recebe ATO_JA_REGISTRADO:
    // ninguém recebe resposta que o faça acreditar que registrou pessoalmente
    // um ato cujo autor real é outro.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-idem3")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      update curadoria.cases set assigned_curator_id = ${OUTRO_CURADOR} where id = ${CASO};
      ${COMO(OUTRO_CURADOR)}
      ${DECIDIR("RECUSA")}
      select 'AUTOR_ORIGINAL:' || (a.actor_id = ${CURADOR}) from ${ATOS} a;`);

    expect(r.saida).toContain("DESFECHO:ATO_JA_CONSUMADO");
    expect(r.saida, "a resposta não pode sugerir autoria de quem não decidiu").not.toContain(
      "DESFECHO:ATO_JA_REGISTRADO\nDESFECHO:ATO_JA_REGISTRADO",
    );
    expect(r.saida).toContain("AUTOR_ORIGINAL:true");
  });

  it("OUTRO ator + intenção contrária → ATO_JA_CONSUMADO", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-idem4")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      update curadoria.cases set assigned_curator_id = ${OUTRO_CURADOR} where id = ${CASO};
      ${COMO(OUTRO_CURADOR)}
      ${DECIDIR("RECUSA")}
      select 'ATOS:' || count(*) from ${ATOS};`);

    expect(r.saida).toContain("DESFECHO:ATO_JA_CONSUMADO");
    expect(r.saida).toContain("ATOS:1");
  });
});

// ---------------------------------------------------------------------------
// §13 · CONCORRÊNCIA — o árbitro é declarativo
// ---------------------------------------------------------------------------
describe("concorrência — no máximo UM ato decisório por proposta", () => {
  it("o índice único recusa um segundo ato mesmo por baixo da capability", () => {
    // A corrida que escapasse do lock cairia AQUI. O insert direto (como
    // superusuário, dentro de transação revertida) simula exatamente o
    // segundo INSERT de uma corrida — e o índice o recusa.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-conc")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      insert into ${ATOS} (proposal_id, natureza, actor_id, atestado_origem_vigente)
      values (current_setting('t.proposal')::uuid, 'CONFIRMACAO', ${OUTRO_CURADOR}, true);`);

    expect(r.ok).toBe(false);
    expect(r.saida).toContain("derivation_proposal_acts_um_por_proposta");
  });

  it("§13 · decidibilidade mudou durante a operação: origem re-declarada → PROPOSTA_NAO_DECIDIVEL", () => {
    // Condição 6 reavaliada NA transação do ato: a pessoa re-declarou o grau
    // depois da emissão (S1 pendente) — decidir sobre fala que mudou seria
    // decidir sobre nada.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-s1")}
      update ${NEEDS} set degree = 'DESEJAVEL' where case_id = ${CASO} and subcriterion_code = '${CONCEITO}';
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      select 'ATOS:' || count(*) from ${ATOS};
      select 'ESTADO:' || state from ${PROPOSTAS} where id = current_setting('t.proposal')::uuid;`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:PROPOSTA_NAO_DECIDIVEL");
    expect(r.saida).toContain("ATOS:0");
    expect(r.saida).toContain("ESTADO:PROPOSTA");
  });

  it("declaração manual nasceu depois da emissão: ela PREVALECE, e a proposta não é decidível", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-manual")}
      insert into ${MAPA} (case_id, subcriterion_id, importance, declared_by)
      select ${CASO}, s.id, 'RELEVANTE', ${CURADOR} from curadoria.method_subcriteria s where s.code = '${CONCEITO}';
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      select 'ATOS:' || count(*) from ${ATOS};
      select 'MANUAL_INTACTA:' || (m.importance = 'RELEVANTE') from ${MAPA} m where m.case_id = ${CASO};`);

    expect(r.saida).toContain("DESFECHO:PROPOSTA_NAO_DECIDIVEL");
    expect(r.saida).toContain("ATOS:0");
    expect(r.saida).toContain("MANUAL_INTACTA:true");
  });
});

// ---------------------------------------------------------------------------
// §10/§11 · PROJEÇÃO E CERCA — o estado decisório só nasce do ato
// ---------------------------------------------------------------------------
describe("G-1/criterio 4 · CONFIRMADA/RECUSADA só pelo trigger do ato", () => {
  it("UPDATE direto do estado decisório é recusado pela cerca", () => {
    for (const alvo of ["CONFIRMADA", "RECUSADA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`r112-cerca-${alvo.toLowerCase()}`)}
        update ${PROPOSTAS} set state = '${alvo}' where id = current_setting('t.proposal')::uuid;`);
      expect(r.ok, alvo).toBe(false);
      expect(r.saida, alvo).toContain("Estado decisorio so nasce do ato");
    }
  });

  it("proposta decidida não muda de estado — nem por superusuário", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-final")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      update ${PROPOSTAS} set state = 'SUPERADA' where id = current_setting('t.proposal')::uuid;`);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("Proposta decidida nao muda de estado");
  });

  it("PROPOSTA → SUPERADA segue livre: transição sistêmica não é ato deste contrato", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-s1-livre")}
      update ${PROPOSTAS} set state = 'SUPERADA' where id = current_setting('t.proposal')::uuid;
      select 'ESTADO:' || state from ${PROPOSTAS} where id = current_setting('t.proposal')::uuid;`);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ESTADO:SUPERADA");
  });

  it("§11 · SUPERADA não é decidível — nenhum ato humano sobre ela", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-superada")}
      update ${PROPOSTAS} set state = 'SUPERADA' where id = current_setting('t.proposal')::uuid;
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      select 'ATOS:' || count(*) from ${ATOS};`);
    expect(r.saida).toContain("DESFECHO:PROPOSTA_NAO_DECIDIVEL");
    expect(r.saida).toContain("ATOS:0");
  });

  it("G-8 · o ato é append-only: UPDATE e DELETE recusados", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-ao")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      update ${ATOS} set natureza = 'CONFIRMACAO';`);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("append-only");

    const d = emTransacaoRevertida(`
      ${EMITIR("r112-ao2")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      delete from ${ATOS};`);
    expect(d.ok).toBe(false);
    expect(d.saida).toContain("append-only");
  });
});

// ---------------------------------------------------------------------------
// §18/§21 · MOTIVO E CATÁLOGO DE ERROS
// ---------------------------------------------------------------------------
describe("O2-E · o motivo é oferecido, nunca exigido", () => {
  it("ato sem motivo é válido nos DOIS sentidos — ausência é dado", () => {
    for (const natureza of ["CONFIRMACAO", "RECUSA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`r112-m-${natureza.toLowerCase()}`)}
        ${COMO(CURADOR)}
        ${DECIDIR(natureza, "null")}
        select 'MOTIVO_NULL:' || (motivo is null) from ${ATOS};`);
      expect(r.saida, natureza).toContain("DESFECHO:ATO_REGISTRADO");
      expect(r.saida, natureza).toContain("MOTIVO_NULL:true");
    }
  });

  it("motivo em branco normaliza para ausência — vazio não vira string", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-m-branco")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA", "'   '")}
      select 'MOTIVO_NULL:' || (motivo is null) from ${ATOS};`);
    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("MOTIVO_NULL:true");
  });

  it("motivo oferecido é gravado; o que excede 280 recebe MOTIVO_INVALIDO", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-m-ok")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA", "'a origem parece defasada'")}
      select 'MOTIVO:' || motivo from ${ATOS};`);
    expect(r.saida).toContain("MOTIVO:a origem parece defasada");

    const longo = emTransacaoRevertida(`
      ${EMITIR("r112-m-longo")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA", `'${"x".repeat(281)}'`)}
      select 'ATOS:' || count(*) from ${ATOS};`);
    expect(longo.saida).toContain("DESFECHO:MOTIVO_INVALIDO");
    expect(longo.saida).toContain("ATOS:0");
  });

  it("catálogo fechado: NATUREZA_INVALIDA e PROPOSTA_INEXISTENTE", () => {
    const natureza = emTransacaoRevertida(`
      ${EMITIR("r112-nat")}
      ${COMO(CURADOR)}
      ${DECIDIR("TALVEZ")}`);
    expect(natureza.saida).toContain("DESFECHO:NATUREZA_INVALIDA");

    const inexistente = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${COMO(CURADOR)}
      select 'DESFECHO:' || curadoria.decidir_proposta('00000000-0000-4000-8000-00000000dead'::uuid, 'RECUSA', null);`);
    expect(inexistente.saida).toContain("DESFECHO:PROPOSTA_INEXISTENTE");
  });
});

// ---------------------------------------------------------------------------
// §16 · PAINEL 1.11 — inalterado, contando RECUSADA de fixture
// ---------------------------------------------------------------------------
describe("painel 1.11 — a recusa entra no agregado sem nenhuma alteração", () => {
  it("a leitora agregada conta a RECUSADA nascida do ato", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-painel")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      select 'AGREGADO:' || subcriterion_code || '/' || state || '/' || contagem
      from curadoria.contar_propostas_por_desfecho()
      where state = 'RECUSADA' and subcriterion_code = '${CONCEITO}';`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain(`AGREGADO:${CONCEITO}/RECUSADA/1`);
    // E o agregado NÃO expõe o motivo nem o ator — colunas do §16.
    expect(r.saida).not.toContain("motivo");
  });
});

// ---------------------------------------------------------------------------
// §20 · INÉRCIA — a Onda 1B não abre nada
// ---------------------------------------------------------------------------
describe("inércia — capacidade técnica não é abertura da Fronteira", () => {
  it("a capability não tem EXECUTE para PUBLIC, anon nem authenticated", () => {
    const { saida } = psql(`
      select has_function_privilege('public', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')
        || '|' || has_function_privilege('anon', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')
        || '|' || has_function_privilege('authenticated', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')`);
    expect(saida).toBe("false|false|false");
  });

  it("a tabela de atos é inalcançável por papel de aplicação — RLS sem policy, zero grant", () => {
    const { saida } = psql(`
      select (select relrowsecurity from pg_class where relname='derivation_proposal_acts')
        || '|' || (select count(*) from pg_policies where tablename='derivation_proposal_acts')
        || '|' || has_table_privilege('authenticated', '${ATOS}', 'select')
        || '|' || has_table_privilege('service_role', '${ATOS}', 'select')`);
    expect(saida).toBe("true|0|false|false");
  });

  it("zero atos reais no banco — tudo o que os testes criaram morreu no rollback", () => {
    const { saida } = psql(`select count(*) from ${ATOS}`);
    expect(saida).toBe("0");
  });
});

// ---------------------------------------------------------------------------
// §14 · D-01(2) — os DOIS escritores nominais do Mapa, no catálogo do Postgres
// ---------------------------------------------------------------------------
describe("D-01(2) · case_priority_map tem exatamente dois escritores nominais", () => {
  it("no banco, a ÚNICA função que escreve o Mapa é `decidir_proposta`", () => {
    // O primeiro escritor nominal é o repositório da declaração manual, que
    // escreve via PostgREST sob RLS — ele não é função do banco, e a metade
    // unitária da D-01 o pina em `src/`. Aqui se prova a metade nova: a
    // capability é o segundo escritor, e NENHUMA outra função acompanha.
    const { saida } = psql(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ~* '(insert[[:space:]]+into|update|delete[[:space:]]+from)[[:space:]]+curadoria\.case_priority_map'`);
    expect(saida, "um terceiro escritor do Mapa nasceu no banco").toBe("decidir_proposta");
  });

  it("o Mapa do Profissional permanece com escritor único — nenhuma função o escreve", () => {
    const { saida } = psql(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ~* '(insert[[:space:]]+into|update|delete[[:space:]]+from)[[:space:]]+curadoria\.professional_subcriterion_map'`);
    expect(saida).toBe("(nenhuma)");
  });

  it("G-7 · as validações do Mapa são as MESMAS: os triggers são da tabela, não do caminho", () => {
    // Triggers de tabela disparam para qualquer escritor — repositório ou
    // capability. A prova de comportamento (perfil congelado derruba a
    // transação da confirmação inteira) está no teste de atomicidade acima; o
    // catálogo confirma que as cercas continuam as três de sempre.
    const { saida } = psql(`
      select string_agg(tgname, ',' order by tgname)
      from pg_trigger where tgrelid = 'curadoria.case_priority_map'::regclass and not tgisinternal`);
    expect(saida).toBe(
      "case_priority_map_frozen_when_validated,case_priority_map_subcriterion_active,case_priority_map_touch",
    );
  });

  it("G-7 · comportamento: subcritério inativo é recusado TAMBÉM pelo caminho da capability", () => {
    // A mesma validação do caminho manual (`assert_subcriterion_active`),
    // exercitada pelo caminho novo: aposenta-se o conceito DEPOIS da emissão e
    // ANTES da decisão — a confirmação inteira desfaz, sem ato e sem estado.
    const r = emTransacaoRevertida(`
      ${EMITIR("r112-g7")}
      select set_config('curadoria.catalog_change_rationale', 'fixture G-7: aposentadoria pos-emissao', true);
      update curadoria.method_subcriteria set active = false where code = '${CONCEITO}';
      ${COMO(CURADOR)}
      do $tenta$ begin
        perform curadoria.decidir_proposta(current_setting('t.proposal')::uuid, 'CONFIRMACAO', null);
      exception when others then null;
      end $tenta$;
      ${RAIO_X}`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ATOS:0");
    expect(r.saida).toContain("ESTADO:PROPOSTA");
    expect(r.saida).toContain("MAPA:0");
  });
});

// ---------------------------------------------------------------------------
// MR1 (F-1.12-1) · A CERCA COMPLETA — entrada decisória e terminalidade
// ---------------------------------------------------------------------------
//
// A certificação encontrou a borda que o primeiro desenho deixou: a exigência
// do token valia só para `PROPOSTA → decisório`, e `SUPERADA → CONFIRMADA`
// nascia com ATOS = 0; `SUPERADA → PROPOSTA` reabria um terminal. Os dois
// defeitos foram REPRODUZIDOS na base `cdf485d` antes da correção — como
// OWNER, que foi onde a certificação os detectou: RLS, grants e aplicação não
// contam aqui, o teste roda no nível de quem tudo pode.
describe("MR1 · nenhum estado decisório nasce sem ato, venha de onde vier", () => {
  const IR_PARA = (estado: string) =>
    `update ${PROPOSTAS} set state='${estado}' where id=current_setting('t.proposal')::uuid;`;

  it("SUPERADA → CONFIRMADA e SUPERADA → RECUSADA são recusados, com ATOS = 0", () => {
    for (const decisorio of ["CONFIRMADA", "RECUSADA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`mr1-sup-${decisorio.toLowerCase()}`)}
        ${IR_PARA("SUPERADA")}
        ${IR_PARA(decisorio)}`);
      expect(r.ok, `SUPERADA → ${decisorio} passou`).toBe(false);
      expect(r.saida, decisorio).toContain("Estado sistemico e terminal");
    }
  });

  it("RETIRADA → CONFIRMADA e RETIRADA → RECUSADA são recusados", () => {
    for (const decisorio of ["CONFIRMADA", "RECUSADA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`mr1-ret-${decisorio.toLowerCase()}`)}
        ${IR_PARA("RETIRADA")}
        ${IR_PARA(decisorio)}`);
      expect(r.ok, `RETIRADA → ${decisorio} passou`).toBe(false);
      expect(r.saida, decisorio).toContain("Estado sistemico e terminal");
    }
  });

  it("a prova central: a recusa deixa o estado como estava e ATOS = 0", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("mr1-central")}
      ${IR_PARA("SUPERADA")}
      do $tenta$ begin
        update curadoria.derivation_proposals set state='CONFIRMADA'
        where id=current_setting('t.proposal')::uuid;
      exception when others then null;
      end $tenta$;
      select 'ESTADO:' || state from ${PROPOSTAS} where id=current_setting('t.proposal')::uuid;
      select 'ATOS:' || count(*) from ${ATOS};`);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ESTADO:SUPERADA");
    expect(r.saida).toContain("ATOS:0");
  });
});

describe("MR1 · SUPERADA e RETIRADA são terminais — não reabrem", () => {
  const IR_PARA = (estado: string) =>
    `update ${PROPOSTAS} set state='${estado}' where id=current_setting('t.proposal')::uuid;`;

  it("SUPERADA → PROPOSTA e RETIRADA → PROPOSTA são recusados", () => {
    for (const terminal of ["SUPERADA", "RETIRADA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`mr1-reabre-${terminal.toLowerCase()}`)}
        ${IR_PARA(terminal)}
        ${IR_PARA("PROPOSTA")}`);
      expect(r.ok, `${terminal} → PROPOSTA reabriu`).toBe(false);
      expect(r.saida, terminal).toContain("Estado sistemico e terminal");
    }
  });

  it("nem entre si: SUPERADA → RETIRADA é recusado", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("mr1-cruzado")}
      ${IR_PARA("SUPERADA")}
      ${IR_PARA("RETIRADA")}`);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("Estado sistemico e terminal");
  });
});

describe("MR1 · controles negativos — a cerca não bloqueia o legítimo", () => {
  it("C1 · PROPOSTA → SUPERADA e PROPOSTA → RETIRADA seguem livres", () => {
    for (const sistemico of ["SUPERADA", "RETIRADA"]) {
      const r = emTransacaoRevertida(`
        ${EMITIR(`mr1-c1-${sistemico.toLowerCase()}`)}
        update ${PROPOSTAS} set state='${sistemico}' where id=current_setting('t.proposal')::uuid;
        select 'ESTADO:' || state from ${PROPOSTAS} where id=current_setting('t.proposal')::uuid;`);
      expect(r.ok, `${sistemico}: ${r.saida}`).toBe(true);
      expect(r.saida).toContain(`ESTADO:${sistemico}`);
    }
  });

  it("C2 · a confirmação legítima pela capability continua passando", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("mr1-c2")}
      ${COMO(CURADOR)}
      ${DECIDIR("CONFIRMACAO")}
      ${RAIO_X}`);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("ESTADO:CONFIRMADA");
    expect(r.saida).toContain("MAPA:1");
  });

  it("C3 · a recusa legítima pela capability continua passando", () => {
    const r = emTransacaoRevertida(`
      ${EMITIR("mr1-c3")}
      ${COMO(CURADOR)}
      ${DECIDIR("RECUSA")}
      ${RAIO_X}`);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:ATO_REGISTRADO");
    expect(r.saida).toContain("ESTADO:RECUSADA");
    expect(r.saida).toContain("MAPA:0");
  });
});
