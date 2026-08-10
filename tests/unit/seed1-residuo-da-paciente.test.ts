import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * SEED-1 · O RESÍDUO QUE CUSTOU TRÊS MISSÕES.
 *
 * O teardown da integração apaga o Case e deixa a conta de auth. O seed tinha
 * um ramo para exatamente isso — e ele limpava só o **meio** da cadeia.
 *
 * A cadeia real é:
 *
 *     crm_contacts.patient_profile_id → profiles.id → auth.users.id
 *
 * Limpando apenas `patient_stories`, `patient_profiles` e `user_roles`,
 * sobravam `profiles` e `crm_contacts`. Com eles de pé, `deleteUser` falha por
 * chave estrangeira — e como o erro era **ignorado**, o seed seguia adiante e
 * só quebrava depois, em `createPatientAccount`, com *"e-mail já existe"*: um
 * sintoma que não aponta para a causa.
 *
 * Esta guarda é estrutural porque a alternativa — rodar o seed — depende de
 * banco de pé e leva minutos. Ela lê o código **sem comentários**, então a
 * explicação acima não a satisfaz.
 */

const SEED = "tests/integration/seed-validacao-mesa.integration.test.ts";
const fonte = readFileSync(SEED, "utf8");
const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** O ramo que normaliza o resíduo, do `if (residuo)` até o `deleteUser`. */
function ramoDeResiduo(): string {
  const inicio = codigo.indexOf("if (residuo)");
  expect(inicio, "o ramo de resíduo sumiu — o recorte seria vazio").toBeGreaterThan(-1);
  const fim = codigo.indexOf("createPatientAccount", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return codigo.slice(inicio, fim);
}

describe("SEED-1 · a limpeza cobre a cadeia inteira", () => {
  const ramo = ramoDeResiduo();

  it("limpa as três tabelas que já limpava", () => {
    for (const tabela of ["patient_stories", "patient_profiles", "user_roles"]) {
      expect(ramo, `deixou de limpar ${tabela}`).toContain(tabela);
    }
  });

  it("e as duas que faltavam — as que travavam o `deleteUser`", () => {
    expect(ramo, "crm_contacts voltou a ficar de fora").toContain("crm_contacts");
    expect(ramo, "profiles voltou a ficar de fora").toContain('from("profiles")');
  });

  it("a ordem respeita a dependência: `crm_contacts` antes de `profiles`", () => {
    const crm = ramo.indexOf("crm_contacts");
    const profiles = ramo.indexOf('from("profiles")');
    expect(crm).toBeGreaterThan(-1);
    expect(profiles).toBeGreaterThan(crm);
  });

  it("e `profiles` antes de `deleteUser` — senão a FK derruba de novo", () => {
    const profiles = ramo.indexOf('from("profiles")');
    const del = ramo.indexOf("deleteUser");
    expect(del).toBeGreaterThan(profiles);
  });
});

describe("SEED-1 · o erro deixa de ser engolido", () => {
  const ramo = ramoDeResiduo();

  it("`deleteUser` tem o erro capturado e verificado", () => {
    expect(ramo, "o retorno de deleteUser voltou a ser descartado").toMatch(
      /(const\s*\{\s*error[^}]*\}\s*=\s*await\s+service\.auth\.admin\.deleteUser)/,
    );
    expect(ramo).toMatch(/if\s*\(\s*erroDelete\s*\)/);
  });

  it("e a falha para o seed com mensagem que aponta a causa", () => {
    expect(ramo).toContain("throw new Error");
    expect(ramo).toContain("SEED-1");
  });

  it("nenhum `catch` vazio engolindo o problema no ramo", () => {
    expect(/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(ramo), "catch vazio no ramo de resíduo").toBe(false);
  });
});

describe("§5 · a limpeza é fechada na conta sintética", () => {
  const ramo = ramoDeResiduo();

  it("todo delete é filtrado pelo id da conta — nenhum genérico", () => {
    const deletes = [...ramo.matchAll(/\.from\("([a-z_]+)"\)\s*\.delete\(\)([\s\S]{0,120}?);/g)];
    expect(deletes.length, "nenhum delete encontrado no ramo").toBeGreaterThanOrEqual(5);
    for (const [, tabela, resto] of deletes) {
      expect(resto, `delete em ${tabela} sem filtro pela conta sintética`).toMatch(
        /\.eq\("(profile_id|patient_profile_id|id)",\s*residuo\.id\)/,
      );
    }
  });

  it("e o alvo é o e-mail sintético, nunca uma varredura", () => {
    expect(codigo).toContain("SEED_PATIENT_EMAIL");
    expect(codigo).toContain("@example.test");
  });
});
