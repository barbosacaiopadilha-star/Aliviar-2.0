import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 2.4 — AS GUARDAS ESTÁTICAS DE `curator_judgments` (CONTRATO_2_4 §20).
 *
 * A metade VIVA — CHECKs recusando no banco, árbitros de concorrência,
 * append-only, compatibilidade evidência×julgamento — está em
 * `tests/integration/curator-judgments.integration.test.ts`. Aqui fica a
 * metade que impede a regressão de nascer no CÓDIGO: a migration abandonando
 * o CHECK pela FK proibida, `AREA` reaparecendo, um writer ou superfície
 * nascendo em `src/` antes do 2.3 autorizado, ou o Motor ganhando caminho
 * até o juízo humano.
 */

const RAIZ = process.cwd();
const MIGRATION_2_4 = "supabase/migrations/20260808230000_2_4_curator_judgments.sql";

const sqlBruto = readFileSync(join(RAIZ, MIGRATION_2_4), "utf8");
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

/** O bloco do CREATE TABLE principal — onde coluna proibida tentaria nascer. */
const blocoDaTabela = sql.slice(
  sql.indexOf("create table if not exists curadoria.curator_judgments"),
  sql.indexOf("comment on table curadoria.curator_judgments"),
);

function migrations(): { nome: string; conteudo: string }[] {
  return readdirSync(join(RAIZ, "supabase", "migrations"))
    .filter((nome) => nome.endsWith(".sql"))
    .map((nome) => ({
      nome,
      conteudo: readFileSync(join(RAIZ, "supabase", "migrations", nome), "utf8"),
    }));
}

/** Migrations nascidas COM ou DEPOIS do 2.4 — o corte da vigilância. */
function migrationsDoRegime(): { nome: string; conteudo: string }[] {
  return migrations().filter((m) => m.nome >= "20260808230000");
}

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

describe("G-2.4-1/2 · o domínio fechado vive em CHECK — nunca em FK ao Catálogo", () => {
  it("as duas naturezas e os seis pares estão nominais na migration", () => {
    expect(sql).toContain("check (natureza in ('TECNICO', 'RELACIONAL'))");
    expect(sql).toContain("(natureza = 'TECNICO' and subcriterion_code in ('FORMACAO', 'EXPERIENCIA', 'HISTORICO'))");
    for (const relacional of [
      "'MODELO_DECISAO_COMPARTILHADA'",
      "'MODELO_PREFERENCIAS_E_RESTRICOES'",
      "'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS'",
    ]) {
      expect(sql).toContain(relacional);
    }
  });

  it("PROIBIÇÃO EXPRESSA (PA-15 reg. 1): o conceito não referencia o Catálogo", () => {
    expect(
      sql.includes("references curadoria.method_subcriteria"),
      "o campo de conceito virou FK ao Catálogo — FORMACAO/EXPERIENCIA/HISTORICO são identificadores de critério, não códigos de subcritério",
    ).toBe(false);
  });

  it("os três estados da ADR-067 §13, nominais — e nenhum quarto", () => {
    expect(sql).toContain("check (state in ('VIGENTE', 'SUPERADO', 'RETIRADO'))");
    for (const proibido of ["'PENDENTE'", "'RASCUNHO'", "'DRAFT'"]) {
      expect(sql.includes(proibido), `um quarto estado nasceu: ${proibido}`).toBe(false);
    }
  });
});

describe("G-2.4-3 · `AREA` estruturalmente ausente (RS-03)", () => {
  it("nenhuma coluna, valor ou conceito `AREA` no corpo da entidade", () => {
    // No CÓDIGO da tabela e dos CHECKs — o comentário normativo pode citar a
    // proibição sem ressuscitá-la.
    expect(/\barea\b/i.test(blocoDaTabela), "`AREA` apareceu na entidade").toBe(false);
    expect(sql.includes("'AREA'"), "`AREA` apareceu como valor em CHECK").toBe(false);
  });
});

describe("G-2.4-5/6 · referência sem texto copiado; autoria obrigatória", () => {
  it("a migration não cria coluna de texto de evidência — ponteiro id+version somente", () => {
    for (const proibido of ["evidence_text", "texto_da_evidencia", "evidencia_texto", "texto_copiado"]) {
      expect(sql.includes(proibido), `texto de evidência duplicado: ${proibido}`).toBe(false);
    }
    expect(sql).toContain("evidence_id uuid not null");
    expect(sql).toContain("evidence_version integer not null");
  });

  it("`actor_id` é not null com FK a profiles — a autoria é da versão, sempre", () => {
    expect(sql).toContain("actor_id uuid not null");
    expect(blocoDaTabela).toContain("references curadoria.profiles (id)");
  });
});

describe("G-2.4-8 (estática) · a migration nasce inerte e o regime não abre nada", () => {
  it("RLS ligada nas duas tabelas, revoke amplo, e NENHUM grant ou policy na migration", () => {
    expect(sql).toContain("alter table curadoria.curator_judgments enable row level security");
    expect(sql).toContain("alter table curadoria.curator_judgment_evidence_refs enable row level security");
    expect(sql).toContain("revoke all on table curadoria.curator_judgments from public, anon, authenticated");
    expect(sql).toContain("revoke all on table curadoria.curator_judgment_evidence_refs from public, anon, authenticated");
    // Comando real de GRANT — os COMMENTs normativos citam a palavra ao
    // lavrar a inércia, e citar não é conceder.
    expect(
      /grant\s+(select|insert|update|delete|all|execute)\b/i.test(sql),
      "um grant nasceu com a entidade inerte",
    ).toBe(false);
    expect(/create\s+policy/i.test(sql), "uma policy nasceu com a entidade inerte").toBe(false);
  });

  it("nenhuma migration do regime concede grant ou policy sobre a entidade", () => {
    for (const migration of migrationsDoRegime()) {
      expect(
        /grant\s+[\s\S]{0,120}?curator_judgment/i.test(migration.conteudo),
        `${migration.nome} abriu grant sobre o juízo antes do 2.3 autorizado`,
      ).toBe(false);
      expect(
        /create\s+policy[\s\S]{0,220}?curator_judgment/i.test(migration.conteudo),
        `${migration.nome} criou policy sobre o juízo antes do 2.3 autorizado`,
      ).toBe(false);
    }
  });
});

describe("G-2.4-7/8/9 (estática) · zero writer, zero superfície, Motor sem caminho ao juízo", () => {
  it("só o caminho LAVRADO do 2.3 menciona `curator_judgments` — e nenhum módulo toca a tabela", () => {
    // Na origem (2.4 inerte) esta lista era VAZIA. O CONTRATO_2_3 §12/§13
    // lavrou o caminho operacional — domínio puro, repository de leitura,
    // actions finas e o painel da Mesa — e a lista fechada cresce por
    // contrato, nunca por silêncio: qualquer QUINTO módulo derruba aqui
    // (G-2.4-7: Motor/pipeline não julga; G-2.4-9: destino único).
    const autorizados = [
      "src/components/curadoria/mesa/painel-de-juizo.tsx",
      "src/modules/curadoria/julgamento-actions.ts",
      "src/modules/curadoria/julgamentos-repository.ts",
      "src/modules/curadoria/julgamentos.ts",
    ];
    const mencionam = varrer("src")
      .filter((arquivo) => readFileSync(join(RAIZ, arquivo), "utf8").includes("curator_judgment"))
      .sort();
    expect(mencionam).toEqual(autorizados.filter((a) => mencionam.includes(a)));
    expect(mencionam.every((arquivo) => autorizados.includes(arquivo))).toBe(true);
    // E a TABELA continua intocável por qualquer módulo — o acesso é sempre
    // pelas capabilities (a varredura viva da inércia segue no teste de
    // integração e no unit do 2.3).
    const tocamTabela = varrer("src").filter((arquivo) =>
      /from\(\s*["']curator_judgment/.test(readFileSync(join(RAIZ, arquivo), "utf8")),
    );
    expect(tocamTabela).toEqual([]);
  });

  it("`derivation_proposals` não ganhou alvo de julgamento em nenhuma migration do regime", () => {
    for (const migration of migrationsDoRegime()) {
      const tocaProposta =
        /alter\s+table[\s\S]{0,80}?derivation_proposals/i.test(migration.conteudo) &&
        /judgment|juizo|julgamento/i.test(migration.conteudo.replace(/--[^\n]*/g, ""));
      expect(tocaProposta, `${migration.nome} deu à proposta um alvo de juízo (G-2.4-7)`).toBe(false);
    }
  });
});
