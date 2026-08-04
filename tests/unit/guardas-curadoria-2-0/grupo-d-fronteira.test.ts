import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO D: FRONTEIRA
 *
 * A Fronteira Humana (§2.4) e a separação física entre os dois pipelines
 * (AC-PIPELINE, §17.4) só podem ser plenamente verificadas quando a Camada de
 * Derivação existir. O que **já** é verificável hoje, e o que estas guardas
 * protegem, é a metade que sustenta as duas: **uma origem por fato**, e a
 * ausência de qualquer caminho que grave num Mapa do Motor sem passar pela
 * camada de escrita conhecida.
 *
 * ┌ D-01 — Uma origem por fato
 * │ Objetivo ......... cada entrada do Motor tem exatamente um lugar que a
 * │                    escreve. Duas portas de escrita = duas verdades.
 * │ Princípio ........ P-07 (Arquitetura §1.2); §4.2 (três fluxos, uma origem).
 * │ Arquivos ......... mapa-prioridades-repository.ts · mapa-profissional-repository.ts
 * │ Validação ........ varredura: quem escreve cada tabela.
 * │ Teste ............ positivo (o escritor conhecido) · negativo (nenhum
 * │                    segundo escritor) · regressão (a lista é pinada).
 * │ Falha ............ um segundo módulo passa a gravar o Mapa.
 * │ Detecção ......... suíte unitária, sem banco.
 * ├ D-02 — Separação física, na parte já existente (AC-PIPELINE antecipado)
 * │ Princípio ........ Arquitetura §17.4 AC-PIPELINE e §2.3.
 * │ Validação ........ o motor puro não é importado por quem escreve, e não
 * │                    importa quem escreve.
 * └ D-03 — Nenhuma leitura do Motor é persistida
 *   Princípio ........ Arquitetura §2.3 ("persistir resultado de leitura é
 *                      proibido — a leitura é recalculada sempre").
 */

const RAIZ = process.cwd();

function arquivosDe(diretorio: string, extensoes: string[]): string[] {
  const encontrados: string[] = [];
  const caminhar = (atual: string) => {
    for (const entrada of readdirSync(atual)) {
      const completo = path.join(atual, entrada);
      if (statSync(completo).isDirectory()) {
        caminhar(completo);
        continue;
      }
      if (extensoes.some((ext) => entrada.endsWith(ext))) encontrados.push(completo);
    }
  };
  caminhar(diretorio);
  return encontrados;
}

const FONTES = arquivosDe(path.join(RAIZ, "src"), [".ts", ".tsx"]);

/**
 * Escrita de verdade, não menção: procura `from("<tabela>")` e olha só até a
 * próxima tabela da mesma cadeia. Um módulo que LÊ esta tabela e ESCREVE em
 * outra não é escritor dela.
 */
function escritoresDe(tabela: string): string[] {
  const referencia = new RegExp(`from\\(\\s*["']${tabela}["']\\s*\\)`, "g");
  return FONTES.filter((arquivo) => {
    const fonte = readFileSync(arquivo, "utf8");
    referencia.lastIndex = 0;
    let encontro: RegExpExecArray | null;
    while ((encontro = referencia.exec(fonte)) !== null) {
      const inicio = encontro.index + encontro[0].length;
      const cadeia = fonte.slice(inicio, inicio + 400).split(/\.from\(/)[0];
      if (/\.(insert|upsert|update|delete)\(/.test(cadeia)) return true;
    }
    return false;
  }).map((arquivo) => path.relative(RAIZ, arquivo).split(path.sep).join("/"));
}

describe("D-01 · Uma origem por fato", () => {
  it("o Mapa de Prioridades do Case tem exatamente um escritor", () => {
    expect(
      escritoresDe("case_priority_map"),
      "Duas portas de escrita na única entrada do Motor pelo lado do Case (ADR-039) = duas verdades sobre o mesmo fato.",
    ).toEqual(["src/modules/curadoria/mapa-prioridades-repository.ts"]);
  });

  it("o Mapa do Profissional tem exatamente um escritor", () => {
    expect(
      escritoresDe("professional_subcriterion_map"),
      "Duas portas de escrita na única entrada do Motor pelo lado do profissional (ADR-040) = duas verdades sobre o mesmo fato.",
    ).toEqual(["src/modules/curadoria/mapa-profissional-repository.ts"]);
  });
});

describe("D-02 · Separação física entre ler e escrever", () => {
  const MOTORES_PUROS = [
    "src/modules/curadoria/motor-compatibilidade.ts",
    "src/modules/curadoria/motor-relacional.ts",
  ];

  it("nenhum motor puro importa um repositório de escrita", () => {
    for (const relativo of MOTORES_PUROS) {
      const fonte = readFileSync(path.join(RAIZ, relativo), "utf8");
      const importados = [...fonte.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const importado of importados) {
        expect(
          /-repository|\/actions|actions"/.test(importado),
          `${relativo} importa "${importado}". O Pipeline de Leitura não pode depender de quem persiste.`,
        ).toBe(false);
      }
    }
  });

  it("os repositórios de escrita dos Mapas não importam o Motor", () => {
    for (const relativo of [
      "src/modules/curadoria/mapa-prioridades-repository.ts",
      "src/modules/curadoria/mapa-profissional-repository.ts",
    ]) {
      const fonte = readFileSync(path.join(RAIZ, relativo), "utf8");
      const importados = [...fonte.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const importado of importados) {
        expect(
          /motor-compatibilidade|motor-relacional/.test(importado),
          `${relativo} importa "${importado}" — quem escreve a declaração não pode consultar a leitura para decidir o que escrever.`,
        ).toBe(false);
      }
    }
  });
});

describe("D-03 · Nenhuma leitura do Motor é persistida", () => {
  it("nenhum módulo grava resultado de compatibilidade em tabela", () => {
    const suspeitos = FONTES.filter((arquivo) => {
      const fonte = readFileSync(arquivo, "utf8");
      const gravaResultado =
        /\.(insert|upsert|update)\(\s*\{[^}]*\b(result|resultado|compatibility_result|reading)\b/.test(
          fonte,
        );
      return gravaResultado && /COMPATIBILIDADE|CompatibilityResult/.test(fonte);
    }).map((a) => path.relative(RAIZ, a));

    expect(
      suspeitos,
      "A leitura é recalculada sempre. Persistida, ela envelhece em silêncio e passa a contradizer as declarações.",
    ).toEqual([]);
  });

  it("o contrato da leitura não tem campo de persistência (id, criado_em, versão gravada)", async () => {
    const { crossPriorityAndProfessional } = await import(
      "@/modules/curadoria/motor-compatibilidade"
    );
    const leitura = crossPriorityAndProfessional({
      casePriorities: [{ subcriterionCode: "ACESSO_MODALIDADE", importance: "IMPORTANTE" }],
      professionalStates: [],
      activeSubcriterionCodes: ["ACESSO_MODALIDADE"],
    });
    for (const chave of [...Object.keys(leitura), ...Object.keys(leitura.rows[0])]) {
      expect(
        /^id$|_id$|created_at|updated_at|persisted/i.test(chave),
        `A leitura expõe "${chave}" — sinal de que alguém pretende gravá-la.`,
      ).toBe(false);
    }
  });
});
