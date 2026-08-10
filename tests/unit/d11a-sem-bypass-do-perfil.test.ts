import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * D-11A · O BYPASS NÃO ERA DO PRODUTO. ERA DO SEED.
 *
 * A auditoria encontrou um Perfil `VALIDATED` sem encontro agendado, sem
 * encontro realizado e sem história reconhecida — e a leitura fácil seria
 * "a paciente consegue validar antes do encontro". **Não era isso.**
 *
 * A via oficial é dela (ADR-042): `acknowledge_priority_profile`, com gate
 * `is_patient_for_case` e auditoria com `actor_role = paciente`. O que produziu
 * aquele estado foi `validatePriorityProfile` — um writer que morava no
 * repositório de PRODUÇÃO, sem nenhum chamador legítimo, e que o seed usava
 * para montar cenário.
 *
 * Ele saiu do produto e virou fixture declarada. Estas guardas existem para
 * que não volte, e para que a via oficial continue sendo a única.
 */

const SRC = "src";
const FIXTURE = "tests/apoio/fixture-perfil.ts";

function arquivosDe(dir: string, ext: RegExp, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivosDe(caminho, ext, acc);
    else if (ext.test(nome)) acc.push(caminho);
  }
  return acc;
}

const FONTES = arquivosDe(SRC, /\.(ts|tsx)$/);
const semComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("T-D11A-1/2 · o writer órfão saiu da produção", () => {
  it("nenhum arquivo de `src/` declara ou chama `validatePriorityProfile`", () => {
    expect(FONTES.length).toBeGreaterThan(100); // a varredura achou o projeto
    const culpados = FONTES.filter((f) =>
      semComentarios(readFileSync(f, "utf8")).includes("validatePriorityProfile"),
    );
    expect(culpados, `writer órfão de volta em: ${culpados.join(", ")}`).toHaveLength(0);
  });

  it("e nenhum arquivo de `src/` escreve `status: \"VALIDATED\"` direto", () => {
    // A via oficial passa pela RPC. Um update direto em `priority_profiles`
    // dentro do produto seria outro bypass, com outro nome.
    const culpados = FONTES.filter((f) => {
      const codigo = semComentarios(readFileSync(f, "utf8"));
      return /priority_profiles[\s\S]{0,400}?status:\s*["']VALIDATED["']/.test(codigo);
    });
    expect(culpados, `gravação direta de VALIDATED em: ${culpados.join(", ")}`).toHaveLength(0);
  });

  it("T-D11A-2 · a produção compila sem ele — nada em `src/` o importava", () => {
    const importadores = FONTES.filter((f) =>
      semComentarios(readFileSync(f, "utf8")).includes("fixtureValidarPerfil"),
    );
    expect(importadores, `produção importando fixture: ${importadores.join(", ")}`).toHaveLength(0);
  });
});

describe("T-D11A-7 · a fixture é de teste, e se declara como tal", () => {
  const fonte = readFileSync(FIXTURE, "utf8");

  it("vive fora de `src/` e diz por que existe", () => {
    expect(fonte).toContain("não pertence ao runtime de produção");
    expect(fonte).toContain("acknowledge_priority_profile");
  });

  it("o nome não se disfarça de método de repositório", () => {
    expect(fonte).toContain("export async function fixtureValidarPerfil");
    expect(fonte).not.toContain("export async function validatePriorityProfile");
  });
});

describe("T-D11A-3/4 · a via oficial continua sendo a única, e é da paciente", () => {
  it("a RPC de reconhecimento segue viva e é chamada pelo produto", () => {
    const chamadores = FONTES.filter((f) =>
      semComentarios(readFileSync(f, "utf8")).includes("acknowledge_priority_profile"),
    );
    expect(chamadores.length, "a via oficial da paciente sumiu").toBeGreaterThan(0);
  });

  it("T-D11A-4 · o Curador não tem action equivalente", () => {
    const actions = semComentarios(readFileSync("src/modules/curadoria/actions.ts", "utf8"));
    for (const proibido of ["validateProfileAction", "validatePriorityProfile", "acknowledge_priority_profile"]) {
      expect(actions, `o Curador ganhou caminho para o ato dela: ${proibido}`).not.toContain(proibido);
    }
  });

  it("e nenhuma superfície de Curador ou Admin alcança a RPC", () => {
    const alcancam = FONTES.filter((f) => {
      if (!/curador|admin|portal-curador|atendimento/i.test(f)) return false;
      return semComentarios(readFileSync(f, "utf8")).includes("acknowledge_priority_profile");
    });
    expect(alcancam, `caminho acidental em: ${alcancam.join(", ")}`).toHaveLength(0);
  });
});

describe("§9 · prova de perda", () => {
  it("reintroduzir o writer em `src/` derruba a guarda — e a guarda não olha comentário", () => {
    // O oráculo lê o código SEM comentários. Um arquivo que apenas MENCIONE o
    // nome numa explicação não pode derrubá-lo — e o próprio `repository.ts`
    // faz exatamente isso hoje.
    const repo = readFileSync("src/modules/curadoria/repository.ts", "utf8");
    expect(repo, "o rastro de onde o writer foi parar sumiu").toContain("validatePriorityProfile");
    expect(semComentarios(repo)).not.toContain("validatePriorityProfile");
  });
});
