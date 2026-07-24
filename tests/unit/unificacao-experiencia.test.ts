import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// MISSÃO 206 — guardas de unificação.
//
// A missão consolidou dois shells escritos separadamente e consertou links que
// levavam o usuário para fora da experiência. Estes testes existem para que a
// unificação não se desfaça sozinha: são as regras que, se quebradas de novo,
// recriam a sensação de "mudei de sistema".

const ROOT = process.cwd();

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf8");
}

function listRoutes(dir: string): string[] {
  const absolute = path.join(ROOT, dir);
  const found: string[] = [];

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...listRoutes(relative));
    else if (entry.name === "page.tsx" || entry.name === "layout.tsx") found.push(relative);
  }

  return found;
}

const PORTAL_DIRS = ["src/app/portal-curador", "src/app/portal-paciente"];

describe("um shell só para os dois Portais", () => {
  it("nenhum layout de Portal desenha o próprio cabeçalho", () => {
    for (const dir of PORTAL_DIRS) {
      const layout = read(`${dir}/layout.tsx`);
      expect(
        layout.includes("<header"),
        `${dir}/layout.tsx voltou a desenhar um cabeçalho próprio — dois shells divergentes são a fronteira entre produtos que o paciente nunca deve perceber.`,
      ).toBe(false);
      expect(layout).toContain("PortalShell");
    }
  });

  it("o shell único existe e declara sua origem no Método", () => {
    const shell = read("src/components/curadoria/portal-shell.tsx");
    expect(shell).toContain("@metodo");
    expect(shell).toContain("Por que existe:");
  });
});

describe("nenhum fluxo termina fora da experiência", () => {
  it("a Landing leva quem já é paciente para a Jornada, nunca para uma tela genérica", () => {
    const files = ["hero-experience", "presenca-sections"].map((name) =>
      read(`src/components/landing/v2/${name}.tsx`),
    );

    for (const file of files) {
      if (!file.includes("Acessar minha Jornada")) continue;
      const beforeCta = file.slice(0, file.indexOf("Acessar minha Jornada"));
      const lastHref = beforeCta.lastIndexOf('href="');
      const href = beforeCta.slice(lastHref + 6, beforeCta.indexOf('"', lastHref + 6));
      expect(href, "o convite para a Jornada precisa levar à Jornada").toBe("/portal-paciente");
    }
  });

  it("todo link interno estático dos Portais aponta para uma rota que existe", () => {
    const routes = new Set(
      [...listRoutes("src/app/portal-curador"), ...listRoutes("src/app/portal-paciente")]
        .filter((file) => file.endsWith("page.tsx"))
        .map((file) => file.replace("src/app", "").replace("/page.tsx", "") || "/"),
    );

    const sources = [
      ...listRoutes("src/app/portal-curador"),
      ...listRoutes("src/app/portal-paciente"),
      ...readdirSync(path.join(ROOT, "src/components/curadoria"))
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => `src/components/curadoria/${file}`),
    ];

    for (const source of sources) {
      const content = read(source);
      const links = [...content.matchAll(/href="(\/portal-[a-z-]+[a-z0-9/_-]*)"/g)].map((m) => m[1]!);

      for (const link of links) {
        // Rotas dinâmicas são cobertas pelos segmentos [id]/[fase]; aqui só
        // verificamos os caminhos estáticos.
        if (link.includes("[")) continue;
        expect(routes.has(link), `${source} aponta para ${link}, que não existe`).toBe(true);
      }
    }
  });
});

describe("uma linguagem só", () => {
  const FORBIDDEN_IN_PATIENT = ["Curador Médico", "P00", "ACE", "shortlist", "score"];

  it("nenhuma superfície do paciente usa vocabulário interno", () => {
    for (const file of listRoutes("src/app/portal-paciente")) {
      const content = read(file);
      for (const term of FORBIDDEN_IN_PATIENT) {
        expect(content, `${file} usa "${term}", que nunca chega ao paciente`).not.toContain(term);
      }
    }
  });

  it("o número oficial do WhatsApp tem fonte única", () => {
    const sources = readdirSync(path.join(ROOT, "src/components/curadoria"))
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => `src/components/curadoria/${file}`);

    const withLiteral = sources.filter((file) => read(file).includes("5511979037133"));
    expect(
      withLiteral,
      "o número oficial deve viver em um lugar só — qualquer outra superfície importa a constante",
    ).toEqual(["src/components/curadoria/whatsapp-contact.tsx"]);
  });
});
