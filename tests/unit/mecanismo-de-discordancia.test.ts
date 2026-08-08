import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 1.12 — AS GUARDAS ESTRUTURAIS DO MECANISMO DE DISCORDÂNCIA.
 *
 * P-10: "confirmar não pode ser mais barato que discordar". As provas de
 * COMPORTAMENTO (atomicidade, idempotência, concorrência, gate) vivem em
 * `tests/integration/mecanismo-de-discordancia.integration.test.ts`, contra o
 * banco real. Aqui ficam as guardas que não precisam de banco: as que impedem
 * a assimetria de nascer no CÓDIGO — por capability separada, por motivo
 * obrigatório, por superfície unilateral ou por escritor não lavrado.
 */

const RAIZ = process.cwd();
const MIGRATION_1_12 = "supabase/migrations/20260808150000_mecanismo_de_discordancia.sql";

const sqlBruto = readFileSync(join(RAIZ, MIGRATION_1_12), "utf8");
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

const FONTES = varrer("src");

function todasAsMigrations(): string {
  return readdirSync(join(RAIZ, "supabase", "migrations"))
    .filter((nome) => nome.endsWith(".sql"))
    .map((nome) => readFileSync(join(RAIZ, "supabase", "migrations", nome), "utf8"))
    .join("\n");
}

describe("G-2 · capability ÚNICA — a simetria começa no banco", () => {
  it("não existe `confirmar_proposta` nem `recusar_proposta` em migration nenhuma", () => {
    const tudo = todasAsMigrations();
    for (const proibida of [
      /create\s+(or\s+replace\s+)?function\s+[a-z_.]*confirmar_proposta/i,
      /create\s+(or\s+replace\s+)?function\s+[a-z_.]*recusar_proposta/i,
    ]) {
      expect(
        proibida.test(tudo),
        "capabilities separadas poderiam divergir em gate, validação ou registro — a assimetria nasceria no banco (CONTRATO_1_12 §14)",
      ).toBe(false);
    }
  });

  it("a natureza é parâmetro de lista fechada da MESMA função", () => {
    expect(sql).toContain("curadoria.decidir_proposta(");
    expect(sql).toContain("p_natureza text");
    expect(sql).toContain("p_natureza not in ('CONFIRMACAO', 'RECUSA')");
  });

  it("o gate roda ANTES de qualquer ramo por natureza — O2-C por construção", () => {
    const corpo = sql.slice(
      sql.indexOf("create or replace function curadoria.decidir_proposta"),
      sql.indexOf("comment on function curadoria.decidir_proposta"),
    );
    const posGate = corpo.indexOf("is_curator_for_case");
    const posRamo = corpo.indexOf("if p_natureza = 'CONFIRMACAO' then");

    expect(posGate).toBeGreaterThan(-1);
    expect(posRamo).toBeGreaterThan(-1);
    expect(posGate, "o gate precisa preceder o único ramo que distingue naturezas").toBeLessThan(
      posRamo,
    );
    // E há UM ramo só por natureza no efeito — nenhum gate duplicado.
    expect(corpo.match(/is_curator_for_case/g)).toHaveLength(1);
  });
});

describe("G-3 · o motivo é oferecido, nunca exigido", () => {
  it("a assinatura declara `p_motivo text default null` — a ausência é o padrão", () => {
    expect(sql).toContain("p_motivo text default null");
  });

  it("nenhum caminho recusa por ausência de motivo — 'motivo ausente' não é erro", () => {
    const corpo = sql.slice(sql.indexOf("curadoria.decidir_proposta"));
    // O único retorno sobre motivo é o de FORMATO (excede 280). Um `is null`
    // que devolvesse erro seria P-10 violado pela porta dos fundos.
    expect(corpo).toContain("MOTIVO_INVALIDO");
    expect(/motivo_normalizado\s+is\s+null\s+then\s+return/i.test(corpo)).toBe(false);
  });
});

describe("G-4 · anti-ranking — motivo e recusa não viram mérito", () => {
  it("nenhum módulo de `src/` lê o motivo do ato — visibilidade é só Auditoria", () => {
    // ABERTURA 2.C (PA-17): a leitura NOMINAL da Fronteira exibe autoria,
    // data e desfecho do ato (elementos 6–8 do A2c) — e o select dela NÃO
    // pede a coluna `motivo`, que segue legível só na Auditoria (PA-12 §18).
    const LEITURA_DA_FRONTEIRA = "src/modules/curadoria/fronteira-do-mapa-repository.ts";
    const fronteira = readFileSync(join(RAIZ, LEITURA_DA_FRONTEIRA), "utf8");
    const selectDosAtos = fronteira.slice(
      fronteira.indexOf("derivation_proposal_acts"),
      fronteira.indexOf("in(\"proposal_id\"", fronteira.indexOf("derivation_proposal_acts")),
    );
    expect(selectDosAtos.includes("motivo"), "a Fronteira passou a ler o motivo do ato").toBe(false);

    for (const arquivo of FONTES) {
      if (arquivo === LEITURA_DA_FRONTEIRA) continue;
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((linha) => !linha.trimStart().startsWith("//"))
        .join("\n");
      expect(
        codigo.includes("derivation_proposal_acts"),
        `${arquivo} conhece a tabela de atos — o motivo só é legível na projeção de Auditoria (Guardião, Opção 1)`,
      ).toBe(false);
    }
  });

  it("a leitora agregada do painel segue sem dimensão pessoal e sem motivo", () => {
    const painel = readFileSync(
      join(RAIZ, "src/modules/curadoria/painel-de-discordancia-repository.ts"),
      "utf8",
    );
    for (const proibido of ["motivo", "actor_id", "ranking", "score"]) {
      expect(painel.includes(proibido), `o painel passou a expor ${proibido}`).toBe(false);
    }
  });
});

describe("G-5 · a superfície de decisão é a LAVRADA pela abertura (PA-17)", () => {
  it("só as actions nominais da Fronteira invocam `decidir_proposta` — e com os DOIS atos", () => {
    // A Onda 1B encerrou com a abertura do 2.C: a superfície nasceu com os
    // dois atos JUNTOS (P-10 preservado — confirmar e recusar no mesmo
    // módulo, mesmo custo). Um segundo invocador continua derrubando.
    const AUTORIZADO = "src/modules/curadoria/fronteira-do-mapa-actions.ts";
    const invocam = FONTES.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((linha) => !linha.trimStart().startsWith("//"))
        .join("\n");
      return codigo.includes("decidir_proposta");
    });
    expect(invocam, "um invocador da decisora nasceu fora da lavratura").toEqual([AUTORIZADO]);
    const actions = readFileSync(join(RAIZ, AUTORIZADO), "utf8");
    expect(actions).toContain("CONFIRMACAO");
    expect(actions).toContain("RECUSA");
  });

  it("nenhuma action, route ou componente de decisão de proposta existe", () => {
    const suspeitos = FONTES.filter((arquivo) =>
      /decidir-proposta|decisao-de-proposta|confirmar-proposta|recusar-proposta/i.test(arquivo),
    );
    expect(suspeitos).toEqual([]);
  });
});

describe("G-6 · a autoria vem da autenticação, não do payload", () => {
  it("a assinatura NÃO tem parâmetro de ator — não existe o que forjar", () => {
    expect(sql).toContain(
      "curadoria.decidir_proposta(\n  p_proposal_id uuid,\n  p_natureza text,\n  p_motivo text default null\n)",
    );
    const assinatura = sql.slice(
      sql.indexOf("curadoria.decidir_proposta("),
      sql.indexOf("returns text"),
    );
    expect(assinatura.includes("actor"), "a assinatura aceita ator do cliente").toBe(false);
  });

  it("o ator é `auth.uid()`, e sem ele não há decisor", () => {
    const corpo = sql.slice(sql.indexOf("ator := auth.uid()"));
    expect(corpo.length).toBeGreaterThan(100);
    expect(sql).toContain("ator := auth.uid();");
  });
});

describe("G-7/D-01(2) · os dois escritores do Mapa, nominais", () => {
  it("o escritor de `src/` continua sendo só o repositório da declaração manual", () => {
    // A metade unitária da D-01(2): o lado aplicação não ganhou porta nova. A
    // metade banco — a capability como segundo escritor nominal — é provada em
    // integração, no catálogo do Postgres.
    const escrevem = FONTES.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      return /from\(\s*["']case_priority_map["']\s*\)\s*[\s\S]{0,120}?\.(insert|upsert|update|delete)\(/.test(
        codigo,
      );
    });
    expect(escrevem).toEqual(["src/modules/curadoria/mapa-prioridades-repository.ts"]);
  });

  it("a confirmação escreve o Mapa pelo INSERT comum — mesmos triggers, mesmas validações", () => {
    const corpo = sql.slice(sql.indexOf("if p_natureza = 'CONFIRMACAO' then"));
    expect(corpo).toContain("insert into curadoria.case_priority_map");
    // Nenhum desvio: sem ALTER de trigger, sem session_replication_role, sem
    // desabilitar validação — o caminho da capability passa pelas MESMAS
    // cercas do caminho manual (G-7), e a prova de comportamento está na
    // integração (perfil congelado derruba a transação inteira).
    // (O `alter table ... enable row level security` da PRÓPRIA tabela de atos
    // é legítimo; o desvio proibido é qualquer toque nas cercas do MAPA.)
    for (const desvio of [
      "session_replication_role",
      "disable trigger",
      "alter table curadoria.case_priority_map",
    ]) {
      expect(sqlBruto.toLowerCase().includes(desvio), `a migration desvia validação: ${desvio}`).toBe(
        false,
      );
    }
  });
});

describe("G-8 · o ato é append-only, por trigger próprio", () => {
  it("a migration cria o trigger e a função de recusa dedicada", () => {
    expect(sql).toContain("create trigger derivation_proposal_acts_append_only");
    expect(sql).toContain("curadoria.recusa_alteracao_de_ato_decisorio()");
  });

  it("naturezas são lista fechada de DOIS — estados sistêmicos não entram na tabela de atos", () => {
    expect(sql).toContain("natureza in ('CONFIRMACAO', 'RECUSA')");
    // SUPERADA/RETIRADA são transições sistêmicas (S1/S2/S5) e não passam pela
    // tabela do ato humano (§11).
    const tabela = sql.slice(
      sql.indexOf("create table curadoria.derivation_proposal_acts"),
      sql.indexOf("comment on table curadoria.derivation_proposal_acts"),
    );
    expect(tabela.includes("SUPERADA")).toBe(false);
    expect(tabela.includes("RETIRADA")).toBe(false);
  });

  it("§19 · o atestado é CHECK, não flag: ato sem atestado não é gravável", () => {
    expect(sql).toContain("atestado_origem_vigente boolean not null check (atestado_origem_vigente)");
  });

  it("§13 · o árbitro declarativo existe: um ato decisório por proposta", () => {
    expect(sql).toContain("create unique index derivation_proposal_acts_um_por_proposta");
  });
});

describe("§20 · inércia declarada na própria migration", () => {
  it("zero grant à capability — nem PUBLIC, nem anon, nem authenticated", () => {
    expect(sql).toMatch(
      /revoke execute on function curadoria\.decidir_proposta[\s\S]{0,80}from public, anon, authenticated/,
    );
    expect(
      /grant execute on function curadoria\.decidir_proposta/i.test(sql),
      "um grant abriu a Fronteira antes da lavratura própria",
    ).toBe(false);
  });

  it("a tabela de atos nasce com RLS e sem grant a papel de aplicação", () => {
    expect(sql).toContain(
      "alter table curadoria.derivation_proposal_acts enable row level security",
    );
    expect(/create policy[^;]*derivation_proposal_acts/i.test(sql)).toBe(false);
    expect(
      /grant[^;]*on curadoria\.derivation_proposal_acts[^;]*to\s+(anon|authenticated)/i.test(sql),
    ).toBe(false);
  });
});
