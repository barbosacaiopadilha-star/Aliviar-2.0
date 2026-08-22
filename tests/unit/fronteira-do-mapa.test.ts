import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 2.C — AS GUARDAS ESTÁTICAS DA FRONTEIRA (CONTRATO_2_C §14).
 *
 * A metade viva — grants por catálogo, desfechos, efeito atômico, A2d —
 * está em `tests/integration/fronteira-do-mapa.integration.test.ts`; a
 * apresentação (A2c/O2-A/O2-B) em `tests/components/painel-da-fronteira`.
 * Aqui: o que impede a regressão de nascer no código — um segundo grant na
 * migration, um lote de decisão nas actions, semeadura material, escrita em
 * julgamento pelo fluxo, ou o emissor ganhando autoridade.
 */

const RAIZ = process.cwd();
const MIGRATION_2C = "supabase/migrations/20260808270000_2_c_abertura_da_fronteira.sql";

const sqlBruto = readFileSync(join(RAIZ, MIGRATION_2C), "utf8");
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

const actions = readFileSync(join(RAIZ, "src/modules/curadoria/fronteira-do-mapa-actions.ts"), "utf8");
const repository = readFileSync(
  join(RAIZ, "src/modules/curadoria/fronteira-do-mapa-repository.ts"),
  "utf8",
);
// A TELA da Fronteira saiu na redução operacional de 21/08 (era órfã — zero
// links no produto; a camada de derivação está congelada e não emite nada
// para decidir). A MECÂNICA fica inteira: migration, actions e repository
// seguem guardados abaixo. Quando a tela renascer no descongelamento, as
// guardas de apresentação renascem com ela.

describe("G-2.C-2 (estática) · a migration abre EXATAMENTE um EXECUTE — e nada mais", () => {
  it("um único GRANT, à decisora, para authenticated", () => {
    const grants = sql.match(/grant\s+(select|insert|update|delete|all|execute)\b[^;]*/gi) ?? [];
    expect(grants).toHaveLength(1);
    expect(grants[0]).toContain("execute on function curadoria.decidir_proposta");
    expect(grants[0]).toContain("to authenticated");
  });

  it("zero policy, zero grant de tabela, PUBLIC/anon revogados na própria migration", () => {
    expect(/create\s+policy/i.test(sql)).toBe(false);
    expect(/grant\s+[a-z]+\s+on\s+(table\s+)?curadoria\.\w+\s+to/i.test(sql)).toBe(false);
    expect(sql).toContain("revoke execute on function curadoria.decidir_proposta(uuid, text, text) from public, anon");
    // O emissor é revogado dos TRÊS papéis por nome: a reaplicação desfaz
    // qualquer grant intruso — inércia idempotente no efeito, não só na
    // sintaxe (endurecimento que a própria bancada de mutação motivou).
    const revokeDoEmissor = sql
      .slice(sql.indexOf("revoke execute on function curadoria.emitir_proposta_de_estado"))
      .split(";")[0];
    expect(revokeDoEmissor).toContain("from public, anon, authenticated");
  });
});

describe("G-2.C-9 (estática) · CD-1 — zero semeadura material", () => {
  it("a migration não insere regra, correspondência nem valor da ponte", () => {
    for (const proibido of [
      /insert\s+into\s+curadoria\.derivation_rules/i,
      /insert\s+into\s+curadoria\.derivation_rule_degree_map/i,
      /insert\s+into\s+curadoria\.derivation_rule_transitions/i,
      /insert\s+into\s+curadoria\.derivation_proposals/i,
    ]) {
      expect(proibido.test(sql), `a migration semeia material: ${proibido}`).toBe(false);
    }
  });
});

describe("G-2.C-8 (estática) · o emissor não escreve, não julga, não confirma", () => {
  it("o corpo do emissor não contém INSERT nenhum — vazio-honesto até a forma lavrada", () => {
    const emissor = sql.slice(
      sql.indexOf("create or replace function curadoria.emitir_proposta_de_estado"),
      sql.indexOf("comment on function curadoria.emitir_proposta_de_estado"),
    );
    expect(/insert\s+into/i.test(emissor), "o emissor ganhou escrita sem a forma lavrada").toBe(false);

    // O Mapa ele LÊ — a declaração manual prevalece, e essa é a checagem
    // legítima do espelho do emissor Case. O que A2b proíbe é ESCREVER nele.
    expect(emissor).toContain("professional_subcriterion_map");
    expect(
      /(insert\s+into|update|delete\s+from)\s+curadoria\.professional_subcriterion_map/i.test(emissor),
      "o emissor passou a escrever no Mapa (A2b/G-2.C-8)",
    ).toBe(false);

    // Juízo e ato decisório o emissor não alcança nem para ler: julgar e
    // confirmar são atos de outra autoridade.
    for (const proibido of ["curator_judgments", "derivation_proposal_acts"]) {
      expect(emissor.includes(proibido), `o emissor alcança ${proibido}`).toBe(false);
    }
  });
});

describe("G-2.C-6 (estática) · a decisora nunca escreve em julgamento", () => {
  it("a menção a curator_judgments no corpo é SÓ o EXISTS do §13.2 — leitura", () => {
    const decisora = sql.slice(
      sql.indexOf("create or replace function curadoria.decidir_proposta"),
      sql.indexOf("comment on function curadoria.decidir_proposta"),
    );
    expect(decisora).toContain("curadoria.curator_judgments");
    expect(/insert\s+into\s+curadoria\.curator_judgments|update\s+curadoria\.curator_judgments|delete\s+from\s+curadoria\.curator_judgments/i.test(decisora)).toBe(false);
  });
});

describe("G-2.C-3/7 (estática) · item a item — nenhum regime de bloco em camada alguma", () => {
  it("as actions recebem UM proposalId — sem arrays, sem laços de decisão, sem 'todos'", () => {
    expect(actions).toContain("proposalId: string");
    for (const proibido of [
      "proposalIds",
      "proposals:",
      ".map(",
      "for (",
      "for(",
      "while (",
      "Promise.all",
      "confirmarTodos",
      "recusarTodos",
    ]) {
      expect(actions.includes(proibido), `as actions ganharam regime de bloco: ${proibido}`).toBe(false);
    }
  });

  // A guarda "o painel não tem seleção múltipla nem ato em massa" saiu junto
  // com a tela — o que ela protegia era apresentação. A proteção estrutural
  // permanece nas actions (acima): uma proposta por ato, nunca regime de bloco.
});

describe("G-2.C-5 (estática) · autoria pela sessão — nunca payload", () => {
  it("nenhum ator em payload nas actions; a capability resolve auth.uid()", () => {
    for (const proibido of ["actorId", "actor_id", "autorId"]) {
      expect(actions.includes(proibido), `ator em payload: ${proibido}`).toBe(false);
    }
  });
});

describe("G-2.C-10 (estática) · a leitura apresenta de fontes canônicas — e não lê o motivo do ato", () => {
  it("o repository é leitura pura: zero insert/update/delete/rpc de escrita", () => {
    for (const proibido of [".insert(", ".upsert(", ".update(", ".delete(", 'rpc("decidir', 'rpc("registrar', 'rpc("retirar']) {
      expect(repository.includes(proibido), `a leitura da Fronteira escreve: ${proibido}`).toBe(false);
    }
  });

  it("o select dos atos não pede a coluna motivo — Auditoria continua sendo o único leitor (PA-12 §18)", () => {
    // Âncora ESPECÍFICA da consulta dos atos: `derivation_proposal_acts`
    // aparece antes no cabeçalho do módulo, e `.in(` pertence a outras
    // queries — ancorar solto faria esta guarda passar por vácuo (foi o que
    // a mutação "leitura passa a ler o motivo" provou).
    const inicio = repository.indexOf('.from("derivation_proposal_acts")');
    expect(inicio, "a consulta dos atos sumiu do módulo — a guarda ficaria vazia").toBeGreaterThan(-1);
    const selectDosAtos = repository.slice(inicio, repository.indexOf('.in("proposal_id"', inicio));
    expect(selectDosAtos).toContain(".select(");
    expect(selectDosAtos.includes("motivo"), "a Fronteira passou a ler o motivo do ato").toBe(false);
  });
});

describe("G-2.C-12 (estática) · o rollback lavrado fecha sem apagar", () => {
  it("o cabeçalho da migration lavra o rollback por revogação — nenhum DROP de tabela ou de fatos", () => {
    expect(sqlBruto).toContain("revoke execute on function curadoria.decidir_proposta");
    for (const proibido of [/drop\s+table/i, /delete\s+from\s+curadoria\.(derivation_proposal_acts|derivation_proposals|curator_judgments|professional_subcriterion_map)/i, /truncate/i]) {
      expect(proibido.test(sql), `a migration destrói fatos: ${proibido}`).toBe(false);
    }
  });
});

describe("consumo · a superfície do 2.C é UMA — o painel interno do admin", () => {
  function varrer(dir: string): string[] {
    return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
      const caminho = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) return varrer(caminho);
      return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
    });
  }

  it("ninguém consome as actions/leitura da Fronteira enquanto a tela não renascer", () => {
    // A tela saiu (redução de 21/08). A guarda vira a inversa: até a decisão
    // de descongelamento, consumidor NENHUM — uma tela nova por engano, um
    // import solto, qualquer coisa, derruba aqui e exige decisão em voz alta.
    const MODULOS_DA_FRONTEIRA = [
      "src/modules/curadoria/fronteira-do-mapa-actions.ts",
      "src/modules/curadoria/fronteira-do-mapa-repository.ts",
    ];
    const consumidores = varrer("src")
      .filter((arquivo) => !MODULOS_DA_FRONTEIRA.includes(arquivo))
      .filter((arquivo) => {
        const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
        return codigo.includes("fronteira-do-mapa-actions") || codigo.includes("fronteira-do-mapa-repository");
      })
      .sort();
    expect(consumidores).toEqual([]);
  });

  it("nenhuma superfície da paciente alcança a Fronteira", () => {
    const paciente = varrer("src/app/paciente").concat(varrer("src/components/paciente"));
    const violadores = paciente.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      return codigo.includes("fronteira-do-mapa") || codigo.includes("decidir_proposta");
    });
    expect(violadores).toEqual([]);
  });
});
