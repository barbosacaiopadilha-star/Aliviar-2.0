// ITEM 2.2B — O CICLO DE VIDA DEIXOU DE SER IMPOSSÍVEL.
//
// Antes deste pacote, uma regra que entrasse em VIGENTE nunca mais saía: MR1.1
// recusa UPDATE, MR1.2 recusa segunda linha VIGENTE, e não havia terceira via.
// A ADR-069 desfez o nó separando FATO de ATO. Este arquivo prova que o banco
// passou a sustentar as duas coisas.
//
// ANTI-VACUIDADE. Cada prova de recusa faz cinco coisas, nesta ordem:
//   1. cria o cenário e CONFIRMA que ele nasceu;
//   2. confirma o estado anterior — para que a recusa seja sobre a transição
//      certa, e não sobre um cenário que nunca chegou lá;
//   3. tenta a operação proibida;
//   4. exige a falha NOMEANDO a constraint, o índice ou o trigger responsável;
//   5. reverte, e o arquivo termina com as três tabelas vazias.
//
// Tudo dentro de transações revertidas — num stack local compartilhado, teste
// que deixa linha é teste que quebra o próximo.

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const CONTAINER = "supabase_db_aliviar-conexao";
const REGRAS = "curadoria.derivation_rules";
const TRANSICOES = "curadoria.derivation_rule_transitions";
const PROPOSTAS = "curadoria.derivation_proposals";

const ARGS = (sql: string) => [
  "exec",
  CONTAINER,
  "psql",
  "-U",
  "postgres",
  "-d",
  "postgres",
  "-At",
  "-F",
  "|",
  "-v",
  "ON_ERROR_STOP=1",
  "-c",
  sql,
];

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    const saida = execFileSync("docker", ARGS(sql), {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, saida: saida.trim() };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

/** Roda dentro de uma transação SEMPRE revertida. Devolve o que saiu. */
function emTransacaoRevertida(corpo: string): { ok: boolean; saida: string } {
  return psql(`begin;\n${corpo}\nrollback;`);
}

const AUTOR = "'00000000-0000-4000-8000-000000000001'::uuid";

/** Uma versão nasce sempre em PROPOSTA — o CHECK derivation_rules_nasce_em_proposta. */
const VERSAO = (id: string, v: number) =>
  `insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence)
   values ('${id}', ${v}, 'PROPOSTA', ${AUTOR}, 'justificativa', 'nenhuma operacao real');`;

/** O ato de nascimento, sem o qual a versão não existe (ADR §9). */
const NASCIMENTO = (id: string, v: number, autoridade = "PAPEL_INTERNO") =>
  `insert into ${TRANSICOES}
     (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
   values ('${id}', ${v}, 1, null, 'PROPOSTA', ${AUTOR}, '${autoridade}', 'proposta inicial');`;

/** Uma transição qualquer. `vigencia` só é preenchida na entrada em VIGENTE. */
const TRANSICAO = (opcoes: {
  id: string;
  v?: number;
  seq: number;
  de: string | null;
  para: string;
  vigencia?: number | null;
  autoridade?: string;
  adr?: string | null;
  emergencia?: string | null;
  motivo?: string;
}) => {
  const {
    id,
    v = 1,
    seq,
    de,
    para,
    vigencia = para === "VIGENTE" ? 1 : null,
    autoridade = "AUTORIDADE_DE_METODO",
    adr = para === "VIGENTE" || para === "REVOGADA" ? "ADR-999" : null,
    emergencia = null,
    motivo = "motivo do ato",
  } = opcoes;
  const txt = (valor: string | null) => (valor === null ? "null" : `'${valor}'`);
  return `insert into ${TRANSICOES}
     (rule_id, rule_version, seq, from_state, to_state, vigencia_seq,
      actor_id, authority, reason, approval_adr, emergency_justification)
   values ('${id}', ${v}, ${seq}, ${txt(de)}, '${para}', ${vigencia ?? "null"},
     ${AUTOR}, '${autoridade}', '${motivo}', ${txt(adr)}, ${txt(emergencia)});`;
};

/** O caminho canônico até VIGENTE — nascimento e promoção. */
const ATE_VIGENTE = (id: string, v = 1) =>
  `${VERSAO(id, v)}
   ${NASCIMENTO(id, v)}
   ${TRANSICAO({ id, v, seq: 2, de: "PROPOSTA", para: "VIGENTE" })}`;

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from ${REGRAS} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            (select count(*) from ${TRANSICOES} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            (select count(*) from ${PROPOSTAS})`,
  );
  if (saida !== "0|0|0") {
    throw new Error(`2.2B deixou resíduo: regras|transicoes|propostas = ${saida}`);
  }
});

// ---------------------------------------------------------------------------

describe("Nascimento · toda versão nasce em PROPOSTA, com transição inicial", () => {
  it("a versão nasce PROPOSTA e a leitura derivada concorda com o nascimento", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-nasce").split(NASCIMENTO("cv-nasce", 1))[0]}
      ${NASCIMENTO("cv-nasce", 1)}
      select 'NASCEU:' || count(*) from ${TRANSICOES} where rule_id = 'cv-nasce';
      select 'ESTADO:' || curadoria.derivation_rule_state('cv-nasce', 1);
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("NASCEU:1");
    expect(r.saida).toContain("ESTADO:PROPOSTA");
  });

  it("nenhuma versão nasce VIGENTE — o CHECK de nascimento recusa", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence,
                             approved_by, approval_adr, effective_from)
      values ('cv-vig', 1, 'VIGENTE', ${AUTOR}, 'j', 'e', ${AUTOR}, 'ADR-999', now());
    `);

    expect(r.ok, "o banco aceitou uma versão nascendo VIGENTE").toBe(false);
    expect(r.saida).toContain("derivation_rules_nasce_em_proposta");
  });

  it.each(["SUSPENSA", "REVOGADA"])("nenhuma versão nasce %s", (estado) => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence,
                             suspended_or_revoked_at)
      values ('cv-n-${estado}', 1, '${estado}', ${AUTOR}, 'j', 'e', now());
    `);

    expect(r.ok, `o banco aceitou uma versão nascendo ${estado}`).toBe(false);
    expect(r.saida).toContain("derivation_rules_nasce_em_proposta");
  });

  it("versão sem transição inicial é recusada — o par é indivisível (§9)", () => {
    // O trigger é DEFERIDO: `set constraints all immediate` força a conferência
    // dentro da transação, sem precisar de commit — e sem deixar resíduo.
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-orfa", 1)}
      select 'NASCEU:' || count(*) from ${REGRAS} where rule_id = 'cv-orfa';
      set constraints all immediate;
    `);

    expect(r.saida, "o cenário não nasceu — a recusa seria sobre o nada").toContain("NASCEU:1");
    expect(r.ok, "uma versão existiu sem ato de nascimento").toBe(false);
    expect(r.saida).toContain("sem transicao inicial");
  });

  it("transição inicial com seq diferente de 1 é recusada", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-seq0", 1)}
      insert into ${TRANSICOES}
        (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
      values ('cv-seq0', 1, 5, null, 'PROPOSTA', ${AUTOR}, 'PAPEL_INTERNO', 'r');
    `);

    expect(r.ok, "um nascimento nasceu fora de seq=1").toBe(false);
    // Duas proteções cobrem este caso, e o trigger BEFORE chega primeiro; a
    // CHECK `..._nascimento_e_o_primeiro` é a segunda linha, provada pela
    // mutação B (remover o trigger não abre a porta).
    expect(r.saida).toContain("deve ser seq=1 sem origem");
  });

  it("transição órfã não nasce — não há versão para ela (MR1.3 estendida)", () => {
    const r = emTransacaoRevertida(NASCIMENTO("cv-inexistente", 1));

    expect(r.ok, "uma transição nasceu sem versão").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_versao_fk");
  });
});

// ---------------------------------------------------------------------------

describe("Promoção · PROPOSTA → VIGENTE", () => {
  it("promove, e o estado corrente passa a VIGENTE sem tocar a versão", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-promo")}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-promo', 1);
      select 'INICIAL:' || state from ${REGRAS} where rule_id = 'cv-promo';
      select 'VIGENTE_DA_REGRA:' || coalesce(curadoria.derivation_rule_current_version('cv-promo')::text, 'null');
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:VIGENTE");
    // O fato não mudou: a versão continua registrando como NASCEU.
    expect(r.saida).toContain("INICIAL:PROPOSTA");
    expect(r.saida).toContain("VIGENTE_DA_REGRA:1");
  });

  it("sem ADR a promoção é recusada — entrada em VIGENTE exige ADR (§12)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-sem-adr", 1)}
      ${NASCIMENTO("cv-sem-adr", 1)}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-sem-adr', 1);
      ${TRANSICAO({ id: "cv-sem-adr", seq: 2, de: "PROPOSTA", para: "VIGENTE", adr: null })}
    `);

    expect(r.saida, "o cenário não chegou a PROPOSTA").toContain("ANTES:PROPOSTA");
    expect(r.ok, "promoveu sem ADR").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_adr_quando_exigida");
  });

  it("sem motivo a transição é recusada — todas exigem, sem exceção (§7)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-sem-motivo", 1)}
      ${NASCIMENTO("cv-sem-motivo", 1)}
      ${TRANSICAO({ id: "cv-sem-motivo", seq: 2, de: "PROPOSTA", para: "VIGENTE", motivo: "   " })}
    `);

    expect(r.ok, "uma transição nasceu sem motivo").toBe(false);
    expect(r.saida).toContain("reason_check");
  });

  it("sem autor a transição é recusada — transição sem autor não existe (§12)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-sem-autor", 1)}
      ${NASCIMENTO("cv-sem-autor", 1)}
      insert into ${TRANSICOES}
        (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
      values ('cv-sem-autor', 1, 2, 'PROPOSTA', 'VIGENTE', 1, null, 'AUTORIDADE_DE_METODO', 'r', 'ADR-999');
    `);

    expect(r.ok, "uma transição nasceu sem autor").toBe(false);
    expect(r.saida).toContain("actor_id");
  });

  it("SEGUNDA VIGENTE do mesmo rule_id é recusada pelo índice — MR1.2 reinterpretado", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-dupla", 1)}
      select 'V1:' || curadoria.derivation_rule_state('cv-dupla', 1);
      ${VERSAO("cv-dupla", 2)}
      ${NASCIMENTO("cv-dupla", 2)}
      select 'V2:' || curadoria.derivation_rule_state('cv-dupla', 2);
      ${TRANSICAO({ id: "cv-dupla", v: 2, seq: 2, de: "PROPOSTA", para: "VIGENTE" })}
    `);

    expect(r.saida, "a v1 não chegou a VIGENTE").toContain("V1:VIGENTE");
    expect(r.saida, "a v2 não chegou a PROPOSTA").toContain("V2:PROPOSTA");
    expect(r.ok, "duas versões da mesma regra ficaram vigentes ao mesmo tempo").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_uma_vigente_por_regra");
  });

  it("regras DIFERENTES vigoram em paralelo — a unicidade é por rule_id", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-par-a")}
      ${ATE_VIGENTE("cv-par-b")}
      select 'A:' || curadoria.derivation_rule_state('cv-par-a', 1);
      select 'B:' || curadoria.derivation_rule_state('cv-par-b', 1);
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("A:VIGENTE");
    expect(r.saida).toContain("B:VIGENTE");
  });

  it("vigencia_seq forjado é recusado — o ordinal não é escolha de quem escreve", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-forja", 1)}
      ${NASCIMENTO("cv-forja", 1)}
      ${TRANSICAO({ id: "cv-forja", seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 7 })}
    `);

    expect(r.ok, "um ordinal de vigência inventado passou").toBe(false);
    expect(r.saida).toContain("vigencia_seq");
  });
});

// ---------------------------------------------------------------------------

/**
 * 2.2B-R1 · A RESPONSABILIDADE PELO ORDINAL É DO TRIGGER DE CADEIA.
 *
 * A Verificação Independente pediu que a divisão do MR1.2 ficasse provada, e
 * não apenas afirmada. **O MR1.2 é garantido pelo CONJUNTO**, com papéis
 * distintos e não intercambiáveis:
 *
 *   · TRIGGER DE CADEIA — valida `from_state`, a continuidade, o `seq` e o
 *     ORDINAL CORRETO de `vigencia_seq`. É ele, e só ele, que impede ordinal
 *     forjado.
 *   · ÍNDICE ÚNICO PARCIAL — arbitra a COLISÃO: duas entradas concorrentes sob
 *     o mesmo ordinal canônico, uma vence. Vale para todo papel, inclusive
 *     `service_role`, e não depende de disciplina de aplicação.
 *
 * **Nenhum dos dois garante o MR1.2 sozinho**, e este bloco existe para que
 * nenhuma leitura futura atribua ao índice a validação do ordinal: o índice
 * não sabe qual ordinal é o certo — ele só recusa o repetido.
 *
 * A mutação B do pacote 2.2B-R1 remove o trigger e confirma que estas provas
 * caem enquanto as do índice permanecem distinguíveis.
 */
describe("2.2B-R1 · ordinal forjado — a prova nomeia o trigger de cadeia", () => {
  it("com o trigger ativo, um vigencia_seq incompatível é recusado POR ELE", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("r1-forja", 1)}
      ${NASCIMENTO("r1-forja", 1)}
      select 'NASCEU:' || count(*) from ${TRANSICOES} where rule_id = 'r1-forja';
      select 'ANTES:' || curadoria.derivation_rule_state('r1-forja', 1);
      select 'VIGENCIAS_FECHADAS:' || count(*) from ${TRANSICOES}
        where rule_id = 'r1-forja' and from_state = 'VIGENTE';
      ${TRANSICAO({ id: "r1-forja", seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 7 })}
    `);

    // 1. o cenário nasceu; 2. o estado anterior é o certo; 3. o ordinal
    // canônico seria 1 (zero vigências fechadas + 1), e 7 é incompatível.
    expect(r.saida, "o cenário não nasceu").toContain("NASCEU:1");
    expect(r.saida, "a versão não estava em PROPOSTA").toContain("ANTES:PROPOSTA");
    expect(r.saida, "havia vigência fechada — o ordinal canônico não seria 1").toContain(
      "VIGENCIAS_FECHADAS:0",
    );

    // 4. a recusa NOMEIA o responsável, com a mensagem do trigger de cadeia.
    expect(r.ok, "um ordinal forjado entrou").toBe(false);
    expect(r.saida, "a recusa não veio do trigger de cadeia").toContain(
      "vigencia_seq de r1-forja/1 deve ser 1 (vigencias fechadas + 1), recebido 7",
    );

    // 5. NENHUMA outra constraint é responsável: nem o índice (não há linha
    // repetida a colidir), nem o CHECK de coerência (o valor não é nulo), nem
    // o grafo (PROPOSTA→VIGENTE é permitido), nem a FK (a versão existe).
    for (const alheio of [
      "uma_vigente_por_regra",
      "vigencia_seq_coerente",
      "grafo_fechado",
      "versao_fk",
      "adr_quando_exigida",
    ]) {
      expect(r.saida, `a recusa veio de ${alheio}, não do trigger`).not.toContain(alheio);
    }
  });

  it("a MESMA linha, com o ordinal canônico, é aceita — a única diferença é o ordinal", () => {
    // Prova complementar e indispensável: sem ela, "recusou" poderia ser
    // qualquer outra coisa errada na linha.
    const r = emTransacaoRevertida(`
      ${VERSAO("r1-canon", 1)}
      ${NASCIMENTO("r1-canon", 1)}
      ${TRANSICAO({ id: "r1-canon", seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 1 })}
      select 'ACEITA:' || curadoria.derivation_rule_state('r1-canon', 1);
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ACEITA:VIGENTE");
  });

  it("depois de uma vigência fechada, o ordinal canônico anda — e o antigo é recusado", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("r1-anda")}
      ${TRANSICAO({ id: "r1-anda", seq: 3, de: "VIGENTE", para: "SUSPENSA" })}
      select 'VIGENCIAS_FECHADAS:' || count(*) from ${TRANSICOES}
        where rule_id = 'r1-anda' and from_state = 'VIGENTE';
      ${TRANSICAO({ id: "r1-anda", seq: 4, de: "SUSPENSA", para: "VIGENTE", vigencia: 1 })}
    `);

    expect(r.saida, "a vigência não foi fechada").toContain("VIGENCIAS_FECHADAS:1");
    expect(r.ok, "reativou reusando o ordinal da vigência anterior").toBe(false);
    expect(r.saida).toContain("deve ser 2 (vigencias fechadas + 1), recebido 1");
  });

  it("o índice NÃO sabe qual ordinal é o certo — ele só recusa o repetido", () => {
    // Duas entradas com ordinal 1 e 2 numa regra sem vigência fechada: a
    // segunda é forjada, e quem a recusa é o trigger. Se fosse o índice, ela
    // passaria — os dois valores são diferentes.
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("r1-indice", 1)}
      ${VERSAO("r1-indice", 2)}
      ${NASCIMENTO("r1-indice", 2)}
      ${TRANSICAO({ id: "r1-indice", v: 2, seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 2 })}
    `);

    expect(r.ok, "duas vigências abertas coexistiram sob ordinais diferentes").toBe(false);
    expect(r.saida, "quem recusou foi o índice — mas o índice não valida ordinal").toContain(
      "deve ser 1 (vigencias fechadas + 1), recebido 2",
    );
    expect(r.saida).not.toContain("uma_vigente_por_regra");
  });
});

// ---------------------------------------------------------------------------

describe("Suspensão · VIGENTE → SUSPENSA, e o freio do Curador", () => {
  it("a Autoridade suspende, o histórico fica e a regra deixa de ser lida como vigente", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-susp")}
      ${TRANSICAO({ id: "cv-susp", seq: 3, de: "VIGENTE", para: "SUSPENSA" })}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-susp', 1);
      select 'HISTORICO:' || count(*) from ${TRANSICOES} where rule_id = 'cv-susp';
      select 'VIGENTE_DA_REGRA:' || coalesce(curadoria.derivation_rule_current_version('cv-susp')::text, 'nenhuma');
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:SUSPENSA");
    // Nenhuma transição apagou outra (§10 regra 4).
    expect(r.saida).toContain("HISTORICO:3");
    expect(r.saida).toContain("VIGENTE_DA_REGRA:nenhuma");
  });

  it("o Curador aciona o freio, com justificativa de emergência e autoria", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-freio")}
      ${TRANSICAO({
        id: "cv-freio",
        seq: 3,
        de: "VIGENTE",
        para: "SUSPENSA",
        autoridade: "CURADOR_DO_CASE",
        emergencia: "a regra estava propondo importancia errada em Case real",
      })}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-freio', 1);
      select 'AUDITAVEL:' || authority || '/' || (emergency_justification is not null)::text
        from ${TRANSICOES} where rule_id = 'cv-freio' and seq = 3;
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:SUSPENSA");
    expect(r.saida).toContain("AUDITAVEL:CURADOR_DO_CASE/true");
  });

  it("o freio SEM justificativa de emergência é recusado", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-freio-mudo")}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-freio-mudo', 1);
      ${TRANSICAO({
        id: "cv-freio-mudo",
        seq: 3,
        de: "VIGENTE",
        para: "SUSPENSA",
        autoridade: "CURADOR_DO_CASE",
      })}
    `);

    expect(r.saida, "o cenário não chegou a VIGENTE").toContain("ANTES:VIGENTE");
    expect(r.ok, "o Curador parou uma regra sem dizer por quê").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_freio_do_curador");
  });

  it("a justificativa de emergência é EXCLUSIVA do freio — a Autoridade não a usa", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-emerg-autoridade")}
      ${TRANSICAO({
        id: "cv-emerg-autoridade",
        seq: 3,
        de: "VIGENTE",
        para: "SUSPENSA",
        autoridade: "AUTORIDADE_DE_METODO",
        emergencia: "emprestando a justificativa do freio",
      })}
    `);

    expect(r.ok, "a justificativa de emergência vazou para outra autoridade").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_emergencia_e_do_freio");
  });

  it("suspender liberta o ordinal: a outra versão pode então vigorar", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-liberta", 1)}
      ${TRANSICAO({ id: "cv-liberta", v: 1, seq: 3, de: "VIGENTE", para: "SUSPENSA" })}
      ${VERSAO("cv-liberta", 2)}
      ${NASCIMENTO("cv-liberta", 2)}
      ${TRANSICAO({ id: "cv-liberta", v: 2, seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 2 })}
      select 'V1:' || curadoria.derivation_rule_state('cv-liberta', 1);
      select 'V2:' || curadoria.derivation_rule_state('cv-liberta', 2);
      select 'VIGENTE_DA_REGRA:' || curadoria.derivation_rule_current_version('cv-liberta');
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("V1:SUSPENSA");
    expect(r.saida).toContain("V2:VIGENTE");
    expect(r.saida).toContain("VIGENTE_DA_REGRA:2");
  });
});

// ---------------------------------------------------------------------------

describe("Reativação · SUSPENSA → VIGENTE", () => {
  it("a Autoridade reativa, e o histórico anterior fica intacto", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-reat")}
      ${TRANSICAO({ id: "cv-reat", seq: 3, de: "VIGENTE", para: "SUSPENSA" })}
      ${TRANSICAO({ id: "cv-reat", seq: 4, de: "SUSPENSA", para: "VIGENTE", vigencia: 2 })}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-reat', 1);
      select 'HISTORICO:' || string_agg(to_state, '>' order by seq) from ${TRANSICOES} where rule_id = 'cv-reat';
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:VIGENTE");
    expect(r.saida).toContain("HISTORICO:PROPOSTA>VIGENTE>SUSPENSA>VIGENTE");
  });

  it("o CURADOR NÃO REATIVA — freio é freio, não volante (§6.3)", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-curador-religa")}
      ${TRANSICAO({
        id: "cv-curador-religa",
        seq: 3,
        de: "VIGENTE",
        para: "SUSPENSA",
        autoridade: "CURADOR_DO_CASE",
        emergencia: "freio acionado",
      })}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-curador-religa', 1);
      ${TRANSICAO({
        id: "cv-curador-religa",
        seq: 4,
        de: "SUSPENSA",
        para: "VIGENTE",
        vigencia: 2,
        autoridade: "CURADOR_DO_CASE",
      })}
    `);

    expect(r.saida, "o cenário não chegou a SUSPENSA").toContain("ANTES:SUSPENSA");
    expect(r.ok, "o Curador religou a regra que ele mesmo parou").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_freio_do_curador");
  });

  it("ciclos VIGENTE ↔ SUSPENSA sem limite, cada um com o seu ordinal", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-ciclos")}
      ${TRANSICAO({ id: "cv-ciclos", seq: 3, de: "VIGENTE", para: "SUSPENSA" })}
      ${TRANSICAO({ id: "cv-ciclos", seq: 4, de: "SUSPENSA", para: "VIGENTE", vigencia: 2 })}
      ${TRANSICAO({ id: "cv-ciclos", seq: 5, de: "VIGENTE", para: "SUSPENSA" })}
      ${TRANSICAO({ id: "cv-ciclos", seq: 6, de: "SUSPENSA", para: "VIGENTE", vigencia: 3 })}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-ciclos', 1);
      select 'CICLOS:' || count(*) from ${TRANSICOES} where rule_id='cv-ciclos' and to_state='VIGENTE';
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:VIGENTE");
    expect(r.saida).toContain("CICLOS:3");
  });
});

// ---------------------------------------------------------------------------

describe("Revogação · terminal, e a proveniência sobrevive", () => {
  it.each([
    ["VIGENTE", 3],
    ["SUSPENSA", 4],
  ] as const)("revoga a partir de %s", (origem, seq) => {
    const preparo =
      origem === "VIGENTE"
        ? ATE_VIGENTE(`cv-rev-${origem}`)
        : `${ATE_VIGENTE(`cv-rev-${origem}`)}
           ${TRANSICAO({ id: `cv-rev-${origem}`, seq: 3, de: "VIGENTE", para: "SUSPENSA" })}`;

    const r = emTransacaoRevertida(`
      ${preparo}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-rev-${origem}', 1);
      ${TRANSICAO({ id: `cv-rev-${origem}`, seq, de: origem, para: "REVOGADA" })}
      select 'CORRENTE:' || curadoria.derivation_rule_state('cv-rev-${origem}', 1);
    `);

    expect(r.saida).toContain(`ANTES:${origem}`);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("CORRENTE:REVOGADA");
  });

  it("REVOGADA é terminal: nenhuma transição parte dela", () => {
    for (const destino of ["VIGENTE", "SUSPENSA", "PROPOSTA"]) {
      const r = emTransacaoRevertida(`
        ${ATE_VIGENTE("cv-term")}
        ${TRANSICAO({ id: "cv-term", seq: 3, de: "VIGENTE", para: "REVOGADA" })}
        select 'ANTES:' || curadoria.derivation_rule_state('cv-term', 1);
        ${TRANSICAO({ id: "cv-term", seq: 4, de: "REVOGADA", para: destino, vigencia: destino === "VIGENTE" ? 2 : null })}
      `);

      expect(r.saida, "o cenário não chegou a REVOGADA").toContain("ANTES:REVOGADA");
      expect(r.ok, `REVOGADA → ${destino} nasceu`).toBe(false);
      expect(r.saida).toContain("derivation_rule_transitions_grafo_fechado");
    }
  });

  /**
   * MR1.3 é provada ESTRUTURALMENTE, e a razão fica registrada.
   *
   * A prova comportamental — inserir proposta, revogar, conferir que ela
   * continua ligada — exigiria uma cadeia de fixtures que não existe no stack
   * (`cases` e `professional_profiles` estão vazias, e `derivation_proposals`
   * tem FK para as duas). Montá-la aqui faria a prova depender de autenticação
   * e de perfil, e o teste passaria a falhar por motivo alheio ao que ele
   * afirma — o defeito que a anti-vacuidade nomeia como "fixture inexistente".
   *
   * O que se prova aqui é mais forte e não depende de linha nenhuma: a
   * proposta referencia o PAR EXATO `(rule_id, rule_version)`, com RESTRICT dos
   * dois lados, e **não existe** referência flutuante a "a versão vigente".
   * Como a transição nunca escreve na versão (append-only, provado acima),
   * mudar de estado não tem por onde alcançar a proveniência.
   */
  it("MR1.3 intacta: a proposta referencia o PAR, nunca 'a vigente'", () => {
    const r = psql(`
      select 'FK:' || pg_get_constraintdef(oid)
      from pg_constraint
      where conname = 'derivation_proposals_regra_fk'
        and conrelid = '${PROPOSTAS}'::regclass;
      select 'COLUNAS:' || string_agg(column_name, ',' order by column_name)
      from information_schema.columns
      where table_schema='curadoria' and table_name='derivation_proposals'
        and column_name in ('rule_id','rule_version');
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida, "a FK das propostas mudou de par").toContain(
      "FK:FOREIGN KEY (rule_id, rule_version) REFERENCES curadoria.derivation_rules(rule_id, version)",
    );
    expect(r.saida, "RESTRICT caiu de um dos lados").toContain("ON UPDATE RESTRICT");
    expect(r.saida).toContain("ON DELETE RESTRICT");
    expect(r.saida).toContain("COLUNAS:rule_id,rule_version");

    // E nenhuma coluna aponta para "a versão vigente" — a referência é ao fato.
    const flutuante = psql(`
      select count(*) from information_schema.columns
      where table_schema='curadoria' and table_name='derivation_proposals'
        and (column_name ilike '%current%' or column_name ilike '%vigente%')
    `);
    expect(flutuante.saida, "nasceu uma referência flutuante à versão vigente").toBe("0");
  });

  it("revogar não toca a versão: o fato que a proposta referencia é imutável", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-prov")}
      select 'VERSAO_ANTES:' || rule_id || '/' || version || '/' || state || '/' || rationale
        from ${REGRAS} where rule_id = 'cv-prov';
      ${TRANSICAO({ id: "cv-prov", seq: 3, de: "VIGENTE", para: "REVOGADA" })}
      select 'VERSAO_DEPOIS:' || rule_id || '/' || version || '/' || state || '/' || rationale
        from ${REGRAS} where rule_id = 'cv-prov';
      select 'ESTADO:' || curadoria.derivation_rule_state('cv-prov', 1);
    `);

    expect(r.ok, r.saida).toBe(true);
    // O par que a proposta referencia — e tudo o mais da linha — atravessa a
    // revogação sem um caractere de diferença.
    expect(r.saida).toContain("VERSAO_ANTES:cv-prov/1/PROPOSTA/justificativa");
    expect(r.saida).toContain("VERSAO_DEPOIS:cv-prov/1/PROPOSTA/justificativa");
    expect(r.saida).toContain("ESTADO:REVOGADA");
  });
});

// ---------------------------------------------------------------------------

describe("Transições inválidas · as arestas proibidas do grafo (§7)", () => {
  it("PROPOSTA → REVOGADA não existe: não se revoga o que nunca valeu (§6.2)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-pr-rev", 1)}
      ${NASCIMENTO("cv-pr-rev", 1)}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-pr-rev', 1);
      ${TRANSICAO({ id: "cv-pr-rev", seq: 2, de: "PROPOSTA", para: "REVOGADA" })}
    `);

    expect(r.saida).toContain("ANTES:PROPOSTA");
    expect(r.ok, "PROPOSTA → REVOGADA nasceu").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_grafo_fechado");
  });

  it.each(["VIGENTE", "SUSPENSA"])("%s → PROPOSTA é recusada: nascimento não se repete", (origem) => {
    const preparo =
      origem === "VIGENTE"
        ? ATE_VIGENTE(`cv-volta-${origem}`)
        : `${ATE_VIGENTE(`cv-volta-${origem}`)}
           ${TRANSICAO({ id: `cv-volta-${origem}`, seq: 3, de: "VIGENTE", para: "SUSPENSA" })}`;
    const proximo = origem === "VIGENTE" ? 3 : 4;

    const r = emTransacaoRevertida(`
      ${preparo}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-volta-${origem}', 1);
      ${TRANSICAO({ id: `cv-volta-${origem}`, seq: proximo, de: origem, para: "PROPOSTA" })}
    `);

    expect(r.saida).toContain(`ANTES:${origem}`);
    expect(r.ok, `${origem} → PROPOSTA nasceu`).toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_grafo_fechado");
  });

  it("X → X é recusada: transição sem mudança não é ato", () => {
    // PROPOSTA → PROPOSTA é o par que isola a CHECK do grafo: a cadeia confere
    // (a anterior terminou em PROPOSTA), o `seq` é o próximo, e não há
    // `vigencia_seq` para o trigger conferir. Quem recusa só pode ser o grafo.
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-mesmo", 1)}
      ${NASCIMENTO("cv-mesmo", 1)}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-mesmo', 1);
      ${TRANSICAO({ id: "cv-mesmo", seq: 2, de: "PROPOSTA", para: "PROPOSTA" })}
    `);

    expect(r.saida).toContain("ANTES:PROPOSTA");
    expect(r.ok, "PROPOSTA → PROPOSTA nasceu").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_grafo_fechado");
  });

  it("cadeia rompida é recusada: from_state precisa ser o destino da anterior", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-cadeia", 1)}
      ${NASCIMENTO("cv-cadeia", 1)}
      select 'ANTES:' || curadoria.derivation_rule_state('cv-cadeia', 1);
      ${TRANSICAO({ id: "cv-cadeia", seq: 2, de: "SUSPENSA", para: "VIGENTE" })}
    `);

    expect(r.saida).toContain("ANTES:PROPOSTA");
    expect(r.ok, "uma transição partiu de um estado em que a versão não estava").toBe(false);
    expect(r.saida).toContain("Cadeia rompida");
  });

  it("seq fora da ordem monotônica é recusada (§11)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-mono", 1)}
      ${NASCIMENTO("cv-mono", 1)}
      ${TRANSICAO({ id: "cv-mono", seq: 9, de: "PROPOSTA", para: "VIGENTE" })}
    `);

    expect(r.ok, "uma transição entrou fora da ordem").toBe(false);
    expect(r.saida).toContain("Ordenacao monotonica quebrada");
  });

  it("o papel interno só propõe — nenhuma outra transição é dele (§6.3)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-papel", 1)}
      ${NASCIMENTO("cv-papel", 1)}
      ${TRANSICAO({ id: "cv-papel", seq: 2, de: "PROPOSTA", para: "VIGENTE", autoridade: "PAPEL_INTERNO" })}
    `);

    expect(r.ok, "um papel interno promoveu uma regra").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_papel_interno_so_propoe");
  });

  it("estado fora da lista fechada é recusado", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-estado", 1)}
      ${NASCIMENTO("cv-estado", 1)}
      ${TRANSICAO({ id: "cv-estado", seq: 2, de: "PROPOSTA", para: "ARQUIVADA" })}
    `);

    expect(r.ok, "um quinto estado nasceu").toBe(false);
    // Duas travas independentes recusam: a lista fechada da coluna e o grafo.
    expect(r.saida).toMatch(/to_state_check|grafo_fechado/);
  });
});

// ---------------------------------------------------------------------------

describe("Append-only · nenhuma transição apaga outra (§10 regra 4)", () => {
  it("UPDATE de transição é recusado pelo trigger, e o cenário existia antes", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-upd", 1)}
      ${NASCIMENTO("cv-upd", 1)}
      select 'NASCEU:' || count(*) from ${TRANSICOES} where rule_id = 'cv-upd';
      update ${TRANSICOES} set reason = 'reescrita' where rule_id = 'cv-upd';
    `);

    expect(r.saida, "o cenário não nasceu").toContain("NASCEU:1");
    expect(r.ok, "o banco aceitou UPDATE numa transição").toBe(false);
    expect(r.saida).toContain("append-only");
  });

  it("DELETE de transição é recusado pelo trigger", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-del", 1)}
      ${NASCIMENTO("cv-del", 1)}
      select 'NASCEU:' || count(*) from ${TRANSICOES} where rule_id = 'cv-del';
      delete from ${TRANSICOES} where rule_id = 'cv-del';
    `);

    expect(r.saida).toContain("NASCEU:1");
    expect(r.ok, "o banco aceitou DELETE numa transição").toBe(false);
    expect(r.saida).toContain("append-only");
  });

  it("apagar a versão referida por transição é recusado (RESTRICT)", () => {
    const r = emTransacaoRevertida(`
      ${VERSAO("cv-fk-del", 1)}
      ${NASCIMENTO("cv-fk-del", 1)}
      delete from ${REGRAS} where rule_id = 'cv-fk-del';
    `);

    expect(r.ok, "a versão foi apagada com transição pendurada").toBe(false);
    // MR1.1 chega primeiro; a FK é a segunda linha de defesa, e o rollback
    // objeto a objeto prova as duas separadamente.
    expect(r.saida).toContain("append-only");
  });
});

// ---------------------------------------------------------------------------

describe("Proveniência · a árvore inteira se reconstrói sem ninguém lembrar de nada", () => {
  it("regra → versão → transições → estado → autor e motivo de cada ato", () => {
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-arvore")}
      ${TRANSICAO({
        id: "cv-arvore",
        seq: 3,
        de: "VIGENTE",
        para: "SUSPENSA",
        autoridade: "CURADOR_DO_CASE",
        emergencia: "parou porque estava errado",
        motivo: "freio",
      })}
      select 'ARVORE:' || string_agg(
        seq || ':' || coalesce(from_state,'—') || '>' || to_state ||
        '/' || authority || '/' || reason || '/' || (actor_id is not null)::text ||
        '/' || (occurred_at is not null)::text,
        ' | ' order by seq)
      from ${TRANSICOES} where rule_id = 'cv-arvore';
      select 'ESTADO:' || curadoria.derivation_rule_state('cv-arvore', 1);
    `);

    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain(
      "ARVORE:1:—>PROPOSTA/PAPEL_INTERNO/proposta inicial/true/true | " +
        "2:PROPOSTA>VIGENTE/AUTORIDADE_DE_METODO/motivo do ato/true/true | " +
        "3:VIGENTE>SUSPENSA/CURADOR_DO_CASE/freio/true/true",
    );
    expect(r.saida).toContain("ESTADO:SUSPENSA");
  });

  it("a leitura derivada NÃO consulta derivation_rules.state", () => {
    const [fonte] = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname='curadoria' and p.proname in
         ('derivation_rule_state','derivation_rule_current_version')`,
    ).saida.split("\n");

    expect(fonte, "a leitura derivada passou a ler o estado inicial como se fosse o corrente")
      .not.toMatch(/derivation_rules/i);
  });
});

// ---------------------------------------------------------------------------

describe("Concorrência · duas entradas em VIGENTE disputam, e o índice arbitra", () => {
  it("duas entradas com o mesmo ordinal colidem no índice — nunca 'a última ganha'", () => {
    // O ordinal é o MESMO porque nenhuma vigência foi fechada entre as duas: é
    // exatamente o que duas transações concorrentes calculariam.
    const r = emTransacaoRevertida(`
      ${ATE_VIGENTE("cv-colide", 1)}
      ${VERSAO("cv-colide", 2)}
      ${NASCIMENTO("cv-colide", 2)}
      select 'ANTES:' || curadoria.derivation_rule_current_version('cv-colide');
      ${TRANSICAO({ id: "cv-colide", v: 2, seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 1 })}
    `);

    expect(r.saida, "a primeira não chegou a vigorar").toContain("ANTES:1");
    expect(r.ok, "duas entradas em VIGENTE coexistiram").toBe(false);
    expect(r.saida).toContain("derivation_rule_transitions_uma_vigente_por_regra");
  });

  it("disputa REAL: a segunda sessão BLOQUEIA enquanto a primeira segura o ordinal", async () => {
    // Duas conexões de verdade. A primeira insere e segura; a segunda tenta o
    // mesmo ordinal e fica esperando no índice — prova de que não há janela em
    // que as duas passem. Ambas revertem: zero resíduo.
    // Duas versões APENAS PROPOSTAS: nenhuma vigora ainda, e por isso as duas
    // sessões calculam o MESMO ordinal — que é exatamente a disputa real.
    const cenario = `${VERSAO("cv-race", 1)} ${NASCIMENTO("cv-race", 1)}
      ${VERSAO("cv-race", 2)} ${NASCIMENTO("cv-race", 2)}`;

    const sessaoA = execFileAsync(
      "docker",
      ARGS(`begin;
        ${cenario}
        ${TRANSICAO({ id: "cv-race", v: 1, seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 1 })}
        select pg_sleep(2);
        select 'A_TERMINOU';
        rollback;`),
      { encoding: "utf-8" },
    );

    // Dá tempo de A pegar o cenário e a linha antes de B tentar.
    await new Promise((resolve) => setTimeout(resolve, 700));

    const inicioB = Date.now();
    const sessaoB = execFileAsync(
      "docker",
      ARGS(`begin;
        ${cenario}
        ${TRANSICAO({ id: "cv-race", v: 2, seq: 2, de: "PROPOSTA", para: "VIGENTE", vigencia: 1 })}
        select 'B_TERMINOU';
        rollback;`),
      { encoding: "utf-8" },
    ).catch((erro: { stdout?: string; stderr?: string }) => ({
      stdout: `${erro.stdout ?? ""}${erro.stderr ?? ""}`,
    }));

    const [a, b] = await Promise.all([sessaoA, sessaoB]);
    const esperaB = Date.now() - inicioB;

    expect(String(a.stdout), "a sessão A não chegou a segurar o ordinal").toContain("A_TERMINOU");
    // B só pôde concluir DEPOIS de A soltar: houve espera real no índice.
    expect(esperaB, "B não esperou por A — as duas passaram ao mesmo tempo").toBeGreaterThan(900);
    expect(String(b.stdout), "B nem chegou a tentar").toMatch(/B_TERMINOU|uma_vigente_por_regra/);
  }, 30_000);
});
