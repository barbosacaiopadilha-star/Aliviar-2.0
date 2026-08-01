import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ACHADO 1 DA AUDITORIA FUNCIONAL — a governança precisa ter executor.
 *
 * A superfície de verificação vive dentro do Portal do Curador. As actions de
 * governança exigem `administrador`. Enquanto o guarda de navegação daquele
 * portal aceitava só `curador_medico`, e nenhum usuário acumulava os dois
 * papéis, NENHUMA pessoa conseguia verificar, resolver divergência,
 * desatualizar ou fechar solicitação pela interface.
 *
 * Cada peça estava correta sozinha; o defeito morava na junta. Este teste
 * pina a junta: quem executa a ação precisa conseguir abrir a porta onde ela
 * mora.
 */

const PORTAL = path.resolve(process.cwd(), "src/app/portal-curador");
const ACTIONS = path.resolve(process.cwd(), "src/modules/curadoria/evidencias-actions.ts");

function arquivosDoPortal(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return arquivosDoPortal(caminho);
    return /\.(tsx|ts)$/.test(entrada.name) ? [caminho] : [];
  });
}

describe("A governança tem executor possível", () => {
  const guardas = arquivosDoPortal(PORTAL)
    .map((arquivo) => ({ arquivo, fonte: readFileSync(arquivo, "utf8") }))
    .filter(({ fonte }) => /require(Any)?Role\(/.test(fonte));

  it("existem guardas de navegação no Portal do Curador para auditar", () => {
    expect(guardas.length).toBeGreaterThan(0);
  });

  it("nenhuma superfície do Portal exclui o Administrador", () => {
    for (const { arquivo, fonte } of guardas) {
      const relativo = path.relative(process.cwd(), arquivo);

      expect(
        /requireRole\(\s*"curador_medico"\s*\)/.test(fonte),
        `${relativo} usa requireRole("curador_medico"), que fecha a porta ao Administrador. As ações de governança que vivem aqui dentro exigem o papel dele — sem esta porta, ficam sem executor.`,
      ).toBe(false);

      expect(
        fonte.includes('requireAnyRole(["curador_medico", "administrador"])'),
        `${relativo} precisa aceitar Curador e Administrador.`,
      ).toBe(true);
    }
  });

  it("as ações de governança continuam exigindo administrador — a porta abriu, o privilégio não", () => {
    const actions = readFileSync(ACTIONS, "utf8");

    for (const acao of [
      "verifyEvidenceAction",
      "markEvidenceOutdatedAction",
      "resolveEvidenceDivergenceAction",
      "resolveUpdateRequestAction",
    ]) {
      const trecho = actions.slice(actions.indexOf(`export async function ${acao}`));
      const primeiraGuarda = trecho.slice(0, trecho.indexOf("safeParse"));
      expect(
        primeiraGuarda,
        `${acao} deixou de exigir administrador. Abrir a porta do Portal não pode virar ampliação de privilégio.`,
      ).toContain('requireAnyRoleForAction(["administrador"])');
    }
  });

  it("abrir divergência e solicitar atualização continuam ao alcance do Curador", () => {
    const actions = readFileSync(ACTIONS, "utf8");

    for (const acao of ["openEvidenceDivergenceAction", "requestPracticeUpdateAction"]) {
      const trecho = actions.slice(actions.indexOf(`export async function ${acao}`));
      const primeiraGuarda = trecho.slice(0, trecho.indexOf("safeParse"));
      expect(primeiraGuarda, `${acao} deixou de aceitar o Curador.`).toContain(
        'requireAnyRoleForAction(["curador_medico", "administrador"])',
      );
    }
  });
});
