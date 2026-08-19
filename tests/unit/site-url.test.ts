import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const RAIZ = process.cwd();

/**
 * O ENDEREÇO PÚBLICO — uma fonte só, e nunca um domínio fixo no código.
 *
 * `www.aliviarcuradoriamedica.com.br` estava escrito à mão em três arquivos de
 * produção e sobreviveu, em silêncio, à perda do domínio. O `sitemap.xml`
 * listava URLs mortas, o `robots.txt` apontava para um sitemap morto, e toda
 * URL canônica e link compartilhado nascia com endereço errado.
 *
 * Estes testes existem para que isso não possa acontecer de novo sem alguém
 * ser avisado.
 */

async function carregar() {
  vi.resetModules();
  return (await import("@/lib/site-url")).SITE_URL;
}

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.resetModules();
});

describe("de onde vem o endereço", () => {
  it("o domínio próprio declarado vence tudo", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://exemplo.com.br";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "projeto.vercel.app";
    expect(await carregar()).toBe("https://exemplo.com.br");
  });

  it("sem domínio próprio, usa o que a Vercel injeta — com protocolo", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "curadoria-2-0.vercel.app";
    expect(await carregar()).toBe("https://curadoria-2-0.vercel.app");
  });

  it("sem nada, cai em localhost — nunca num domínio inventado", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(await carregar()).toBe("http://localhost:3000");
  });

  it("barra final não escapa — ela duplicaria a barra de toda URL montada", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://exemplo.com.br/";
    expect(await carregar()).toBe("https://exemplo.com.br");
  });
});

describe("nenhum domínio fixo sobrevive em src/", () => {
  function varrer(dir: string): string[] {
    return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((e) => {
      const caminho = `${dir}/${e.name}`;
      if (e.isDirectory()) return varrer(caminho);
      return /\.tsx?$/.test(e.name) ? [caminho] : [];
    });
  }

  it("o domínio perdido não volta a aparecer no código", () => {
    const culpados = varrer("src")
      .filter((f) => !f.endsWith("lib/site-url.ts"))
      .filter((f) => readFileSync(join(RAIZ, f), "utf8").includes("aliviarcuradoriamedica"));
    expect(culpados, "domínio morto reintroduzido").toEqual([]);
  });

  it("só `site-url.ts` decide o endereço — ninguém mais declara um", () => {
    const culpados = varrer("src")
      .filter((f) => !f.endsWith("lib/site-url.ts"))
      .filter((f) => /const SITE_URL\s*=\s*["'`]https?:/.test(readFileSync(join(RAIZ, f), "utf8")));
    expect(culpados, "endereço declarado fora da fonte única").toEqual([]);
  });
});
