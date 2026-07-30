import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { conduct } from "@/modules/curadoria/cos/conduction";
import {
  CURATOR_JOURNEY_DEFINITIONS,
  CURATOR_JOURNEY_ORDER,
  buildCuratorJourney,
} from "@/modules/curadoria/cos/journey";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";

/**
 * Guardas da Simplificação da Jornada.
 *
 * Regressão típica: alguém acrescenta uma etapa e esquece a rota, ou volta a
 * escrever "fase" numa tela, ou reintroduz uma tela que só explica. Estes
 * testes existem para que isso quebre a suíte em vez de chegar ao Curador.
 */

const ROUTES_DIR = path.resolve(process.cwd(), "src/app/portal-curador/casos/[id]");
const CURADORIA_COMPONENTS = path.resolve(process.cwd(), "src/components/curadoria");

function routeSlugs(): string[] {
  return readdirSync(ROUTES_DIR).filter((entry) =>
    statSync(path.join(ROUTES_DIR, entry)).isDirectory(),
  );
}

describe("nenhuma etapa órfã — toda etapa tem onde acontecer", () => {
  it("cada etapa da jornada é servida por uma rota", () => {
    const slugs = routeSlugs();
    const dinamica = slugs.some((slug) => slug.startsWith("["));

    for (const step of CURATOR_JOURNEY_ORDER) {
      const slug = CURATOR_JOURNEY_DEFINITIONS[step].slug;
      const servida = slugs.includes(slug) || dinamica;
      expect(servida, `etapa sem rota: ${slug}`).toBe(true);
    }
  });

  it("nenhuma etapa fica sem o que mostrar: sempre há algo pronto OU algo em aberto", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps) {
        expect(
          step.settled.length + step.missing.length,
          `etapa vazia, sem critério nenhum: ${step.label}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("nenhuma etapa concluída deixa de nomear o que vem depois", () => {
    for (const step of CURATOR_JOURNEY_ORDER) {
      expect(CURATOR_JOURNEY_DEFINITIONS[step].completionSentence.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("nenhuma tela do Curador voltou a ser documentação", () => {
  function pageFiles(): { file: string; source: string }[] {
    const found: { file: string; source: string }[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry === "page.tsx") found.push({ file: full, source: readFileSync(full, "utf8") });
      }
    };
    walk(ROUTES_DIR);
    return found;
  }

  it("nenhuma tela declara que a tela de trabalho está em outro módulo", () => {
    for (const { file, source } of pageFiles()) {
      expect(source, `${file} anuncia trabalho futuro em vez de trabalhar`).not.toContain(
        "chega nos próximos módulos",
      );
      expect(source, `${file} se descreve como tela-explicação`).not.toContain(
        "Esta tela explica o que a fase espera",
      );
    }
  });

  it("os cartões de documentação saíram do fluxo principal", () => {
    for (const { file, source } of pageFiles()) {
      for (const cartao of ["Informações obrigatórias", "Regras que valem aqui", "De onde estas regras vieram"]) {
        expect(source, `${file} voltou a abrir documentação no fluxo: ${cartao}`).not.toContain(
          `<CardTitle>${cartao}</CardTitle>`,
        );
      }
    }
  });

  it("a referência do Método continua existindo — nada foi apagado", () => {
    const referencia = readFileSync(
      path.join(CURADORIA_COMPONENTS, "step-method-reference.tsx"),
      "utf8",
    );
    for (const secao of [
      "Regras que valem aqui",
      "De onde estas regras vieram",
      "Artefatos produzidos",
      "Etapa do raciocínio",
    ]) {
      expect(referencia, `a referência perdeu uma seção do Método: ${secao}`).toContain(secao);
    }
  });
});

describe("nenhuma referência à navegação antiga sobreviveu", () => {
  it("o navegador de nove fases não existe mais", () => {
    const componentes = readdirSync(CURADORIA_COMPONENTS);
    expect(componentes).not.toContain("phase-navigator.tsx");
  });

  it("nenhuma tela do Curador ainda fala em nove fases", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
      });

    const arquivos = [...walk(ROUTES_DIR), ...walk(CURADORIA_COMPONENTS)];
    for (const arquivo of arquivos) {
      if (!arquivo.endsWith(".tsx")) continue;
      const source = readFileSync(arquivo, "utf8");
      // Só o texto renderizado importa; comentários explicam a mudança e podem
      // (devem) citar as nove fases do Método.
      expect(source, `${arquivo} exibe "As nove fases" na tela`).not.toContain(">As nove fases<");
      expect(source, `${arquivo} exibe "de 9 fases" na tela`).not.toContain("de 9 fases");
    }
  });
});
