import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 2.6 RESIDUAL — AS GUARDAS ESTÁTICAS (CONTRATO_2_6 §16).
 *
 * A metade VIVA das guardas — policies pinadas no pg_policies, RLS negando
 * papel a papel, capability respondendo pelo catálogo — está em
 * `tests/integration/governanca-do-mapa-do-profissional.integration.test.ts`.
 * Aqui fica a metade que não precisa de banco: a que impede a regressão de
 * nascer no CÓDIGO — uma migration nova abrindo `profiles`, um writer novo do
 * Mapa, um consumidor da capability fora do caminho da paciente, ou o
 * catálogo de desfechos ganhando o `CASE_NAO_ENCONTRADO` que a ressalva do
 * Guardião removeu do domínio.
 */

const RAIZ = process.cwd();
const MIGRATION_2_6 = "supabase/migrations/20260808210000_2_6_g10_nome_do_curador_do_caso.sql";

const sqlBruto = readFileSync(join(RAIZ, MIGRATION_2_6), "utf8");
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

function migrations(): { nome: string; conteudo: string }[] {
  return readdirSync(join(RAIZ, "supabase", "migrations"))
    .filter((nome) => nome.endsWith(".sql"))
    .map((nome) => ({
      nome,
      conteudo: readFileSync(join(RAIZ, "supabase", "migrations", nome), "utf8"),
    }));
}

/** Migrations nascidas COM ou DEPOIS do 2.6 — o corte da vigilância estática. */
function migrationsDoRegime(): { nome: string; conteudo: string }[] {
  return migrations().filter((m) => m.nome >= "20260808210000");
}

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

const FONTES = varrer("src");

function codigoSemComentarios(arquivo: string): string {
  return readFileSync(join(RAIZ, arquivo), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("//"))
    .join("\n");
}

describe("§11 · a migration da capability — regime lavrado, byte a byte", () => {
  it("SECURITY DEFINER · STABLE · STRICT · search_path fixo — declarados no fonte", () => {
    for (const marca of [
      "security definer",
      "stable",
      "strict",
      "set search_path = curadoria, pg_temp",
    ]) {
      expect(sql.includes(marca), `regime ausente: ${marca}`).toBe(true);
    }
  });

  it("grants exatos: revoke PUBLIC e anon, EXECUTE a authenticated — e nada mais", () => {
    expect(sql).toContain("revoke all on function curadoria.nome_do_curador_do_caso(uuid) from public");
    expect(sql).toContain("revoke execute on function curadoria.nome_do_curador_do_caso(uuid) from anon");
    expect(sql).toContain("grant execute on function curadoria.nome_do_curador_do_caso(uuid) to authenticated");
    expect(sql.match(/grant /g), "um segundo grant nasceu na migration").toHaveLength(1);
  });

  it("o catálogo fechado em TRÊS: os desfechos lavrados presentes, CASE_NAO_ENCONTRADO inexistente", () => {
    for (const desfecho of ["'OK'", "'SEM_AUTORIDADE'", "'CURADOR_NAO_ATRIBUIDO'"]) {
      expect(sql).toContain(desfecho);
    }
    // No CÓDIGO — o comentário de cabeçalho documenta a remoção, e citar a
    // ressalva não é ressuscitá-la.
    expect(sql.includes("CASE_NAO_ENCONTRADO"), "o desfecho removido do domínio reapareceu").toBe(
      false,
    );
  });

  it("gate-first no fonte: is_patient_for_case antes de qualquer SELECT de dado", () => {
    const corpo = sql.slice(sql.indexOf("begin"));
    expect(corpo.indexOf("is_patient_for_case")).toBeGreaterThan(-1);
    expect(corpo.indexOf("is_patient_for_case")).toBeLessThan(corpo.indexOf("select"));
  });

  it("saída mínima: a única leitura de profiles é display_name por chave — nenhum outro campo", () => {
    expect(sql).toContain("select p.display_name");
    for (const proibido of ["p.id,", "avatar", "email", "phone", "created_at", "updated_at", "deleted_at"]) {
      expect(sql.includes(proibido), `a capability lê ${proibido} de profiles`).toBe(false);
    }
  });

  it("nenhuma policy, view, tabela ou SQL dinâmico nasce nesta migration", () => {
    for (const proibido of ["create policy", "create view", "create table", "execute format", "execute '"]) {
      expect(sql.includes(proibido), `a migration cria: ${proibido}`).toBe(false);
    }
  });
});

describe("G-2.6-2/G-2.6-4 (estática) · migrations do regime não reabrem as duas tabelas", () => {
  it("nenhuma migration nova cria policy sobre curadoria.profiles", () => {
    for (const migration of migrationsDoRegime()) {
      expect(
        /create\s+policy[\s\S]{0,200}?on\s+curadoria\.profiles/i.test(migration.conteudo),
        `${migration.nome} cria policy sobre profiles — G-10 não vira RLS`,
      ).toBe(false);
    }
  });

  it("nenhuma migration nova cria policy ou grant de escrita sobre o Mapa do Profissional", () => {
    for (const migration of migrationsDoRegime()) {
      expect(
        /create\s+policy[\s\S]{0,220}?on\s+curadoria\.professional_subcriterion_map/i.test(
          migration.conteudo,
        ),
        `${migration.nome} cria policy sobre o Mapa — o recorte da ADR-068 §14.2 é intacto`,
      ).toBe(false);
      expect(
        /grant\s+(insert|update|delete|all)[\s\S]{0,120}?professional_subcriterion_map/i.test(
          migration.conteudo,
        ),
        `${migration.nome} concede escrita do Mapa`,
      ).toBe(false);
    }
  });

  it("G-2.6-3 (estática) · nenhuma migration nova vincula escrita do Mapa ao profissional autenticado", () => {
    for (const migration of migrationsDoRegime()) {
      const temVinculo =
        migration.conteudo.includes("professional_subcriterion_map") &&
        /profile_id\s*=\s*auth\.uid\(\)/.test(migration.conteudo);
      expect(temVinculo, `${migration.nome} deu ao profissional o próprio Mapa (I-12)`).toBe(false);
    }
  });
});

describe("consumo · a capability serve UMA superfície — o caminho da paciente", () => {
  it("o único módulo de src que conhece o RPC é o wrapper do caminho da paciente", () => {
    const conhecem = FONTES.filter((arquivo) =>
      codigoSemComentarios(arquivo).includes("nome_do_curador_do_caso"),
    );
    expect(conhecem).toEqual(["src/modules/paciente/nome-do-curador.ts"]);
  });

  it("o único importador do wrapper é a home da paciente — Mesa, admin e portal interno ficam fora", () => {
    const importam = FONTES.filter((arquivo) =>
      codigoSemComentarios(arquivo).includes("modules/paciente/nome-do-curador"),
    );
    expect(importam).toEqual(["src/app/paciente/page.tsx"]);
  });

  it("nenhuma superfície interna trocou sua fonte: Mesa e COS seguem lendo profiles", () => {
    // A degradação era só da paciente; o caminho interno nunca esteve quebrado
    // e não muda (§10 da missão). O leitor de nomes do COS permanece.
    const cos = readFileSync(join(RAIZ, "src/modules/curadoria/cos/repository.ts"), "utf8");
    expect(cos).toContain('from("profiles")');
    expect(cos.includes("nome_do_curador_do_caso")).toBe(false);
  });
});

describe("G-2.6-5 (estática) · o 2.C segue fechado — o 2.6 não é pretexto", () => {
  it("nenhum módulo de src invoca a capability decisora do 1.12 nem a derivação do 1.A", () => {
    // As guardas do 1.12 (G-5) e do 1.A (G-2) já vigiam isso arquivo a
    // arquivo; aqui fica o oráculo do 2.6 — que a exceção do G-10 não virou
    // porta para o resto.
    const violadores = FONTES.filter((arquivo) => {
      const codigo = codigoSemComentarios(arquivo);
      return codigo.includes("decidir_proposta") || codigo.includes("derivacao-do-mapa-profissional");
    });
    expect(violadores).toEqual([]);
  });
});
