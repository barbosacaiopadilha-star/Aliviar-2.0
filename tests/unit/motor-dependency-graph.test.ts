import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Verificação estrutural do invariante 6 de
// docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §7 ("nenhum motor de nível
// inferior importa um motor de nível superior") e do item 13 da matriz de
// docs/LANDING_IMPLEMENTATION_AUDIT.md — até a Etapa 9, essa garantia só
// tinha sido checada por leitura manual de código a cada etapa de
// extração. Este teste lê o código-fonte real de cada motor (nunca
// reimplementa a regra em outro lugar) e falha se um import não
// autorizado aparecer — a própria arquitetura documentada é o oráculo,
// codificado como `ALLOWED_MOTOR_DEPENDENCIES` abaixo, ponto a ponto
// igual à tabela da seção 2 daquele documento.

const LANDING_DIR = path.join(process.cwd(), "src", "components", "landing");

// Módulos de motor (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2) — o
// especificador de import (`@/components/landing/<nome>`) mapeado para o
// arquivo real e para a lista de OUTROS MOTORES que ele tem permissão de
// importar (nunca a si mesmo). Hooks (`use-*`) são os únicos que podem
// importar "react" — motores puros (sem prefixo `use-`) nunca deveriam.
const MOTORS: Record<
  string,
  { file: string; allowedMotorDeps: string[]; isHook: boolean }
> = {
  // TRACK D · dos treze motores originais, doze pertenciam à landing morta
  // (`portal-experience`, `faq-book-section`, `final-cta-section`, `v2/*`) e
  // saíram com ela. Restou o único que a landing VIVA ainda usa. O guarda
  // continua valendo: um motor novo entra aqui, e as regras se aplicam a ele.
  "@/components/landing/header-compaction": {
    file: "header-compaction.ts",
    allowedMotorDeps: [],
    isHook: false,
  },
};

// Camada de Configuração (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §1)
// — qualquer motor pode ler, nenhum motor pode ser lido por ela.
const CONFIG_MODULES: string[] = [];

// Remove comentários antes de checar uso de window/document — vários
// motores mencionam "window.scrollY" ou "window.matchMedia" em prosa
// (explicando quem realmente lê o DOM na composição), o que não é o
// mesmo que o próprio motor acessá-lo.
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function extractLandingImports(source: string): string[] {
  const specifiers: string[] = [];
  const importRegex = /from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(source)) !== null) {
    if (match[1].startsWith("@/components/landing/")) specifiers.push(match[1]);
  }
  return specifiers;
}

describe("grafo de dependências dos motores (invariante 6, Architecture §7)", () => {
  for (const [specifier, motor] of Object.entries(MOTORS)) {
    describe(specifier, () => {
      const source = readFileSync(path.join(LANDING_DIR, motor.file), "utf-8");
      const imports = extractLandingImports(source);

      it("só importa a Camada de Configuração ou motores explicitamente autorizados na hierarquia", () => {
        for (const imported of imports) {
          const isConfig = CONFIG_MODULES.includes(imported);
          const isAuthorizedMotor = motor.allowedMotorDeps.includes(imported);
          const isSelf = imported === specifier;

          expect(isSelf, `${specifier} não deveria importar a si mesmo`).toBe(
            false,
          );

          if (imported in MOTORS && !isSelf) {
            expect(
              isAuthorizedMotor,
              `${specifier} importa ${imported}, mas essa dependência motor-a-motor não está na tabela da seção 2 (dependência lateral ou circular)`,
            ).toBe(true);
          } else if (!isConfig) {
            // Import dentro de src/components/landing que não é nem
            // motor nem configuração (ex.: um componente de apresentação)
            // — fora do escopo deste invariante, que trata só de
            // motor→motor e motor→configuração.
          }
        }
      });

      it(
        motor.isHook
          ? "hook: pode depender de React"
          : "motor puro: nunca importa React (sem DOM, sem estado de componente)",
        () => {
          const importsReact = /from\s+["']react["']/.test(source);
          if (motor.isHook) {
            expect(importsReact).toBe(true);
          } else {
            expect(importsReact).toBe(false);
          }
        },
      );
    });
  }

  it("nenhum arquivo da Camada de Configuração importa um motor", () => {
    for (const configSpecifier of CONFIG_MODULES) {
      const file = configSpecifier.replace("@/components/landing/", "");
      const candidates = [`${file}.ts`, `${file}.tsx`];
      let source = "";
      for (const candidate of candidates) {
        try {
          source = readFileSync(path.join(LANDING_DIR, candidate), "utf-8");
          break;
        } catch {
          continue;
        }
      }
      expect(
        source.length > 0,
        `arquivo de configuração ${configSpecifier} não encontrado`,
      ).toBe(true);

      const imports = extractLandingImports(source);
      for (const imported of imports) {
        expect(
          imported in MOTORS,
          `${configSpecifier} importa o motor ${imported} — a configuração nunca deveria conhecer lógica de motor`,
        ).toBe(false);
      }
    }
  });

  it("nenhum motor lê DOM/window diretamente, exceto os hooks explicitamente responsáveis por isso", () => {
    for (const [specifier, motor] of Object.entries(MOTORS)) {
      if (motor.isHook) continue; // use-portal-raw-progress e use-portal-motion-preference leem window por contrato — são os motores 1 e 8, fundamentais, sem outra fonte possível.
      const source = stripComments(
        readFileSync(path.join(LANDING_DIR, motor.file), "utf-8"),
      );
      const touchesDom = /\bwindow\.|\bdocument\./.test(source);
      expect(
        touchesDom,
        `${specifier} é um motor puro e não deveria referenciar window/document diretamente`,
      ).toBe(false);
    }
  });
});
