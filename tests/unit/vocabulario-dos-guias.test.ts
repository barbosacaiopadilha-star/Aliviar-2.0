import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * O VOCABULÁRIO DAS PEÇAS DE PAPEL — guarda do `SIM-63`.
 *
 * Duas vezes em vinte e quatro horas um termo foi aposentado por decisão e
 * sobreviveu no documento que alguém iria imprimir: a "Ficha da Paciente"
 * (ADR-097, achada em 28/08 pela manhã) e o "Roteiro de Atendimento"
 * (ADR-100, achado na mesma noite, já publicado no Kit da Curadoria).
 *
 * A causa é estrutural, e é a mesma das duas vezes: **decisão que troca uma
 * palavra não chega sozinha aos documentos**, e são muitos — dez guias e seis
 * peças de rede, em duas pastas de naturezas diferentes:
 *
 * - `docs/guias/` são guias de leitura; o PDF deles é ignorado pelo Git.
 * - `docs/rede/` são as peças de papel da operação: PDF versionado, publicado
 *   em `public/rede/` e oferecido no Kit em `/admin`.
 *
 * Editar um não edita o outro. Este teste é o que acusa quando isso acontece.
 *
 * **A regra, e o porquê da forma dela:** um termo aposentado só pode aparecer
 * na linha que também cita a ADR que o aposentou. Não é burocracia — é o que
 * separa uma **menção histórica deliberada** (*"até aqui este guia dizia X
 * (ADR-100)"*, que tem valor e deve continuar existindo) de uma **sobra**, que
 * é alguém lendo instrução velha na hora de operar.
 *
 * É teste de fonte, como o `sistema-visual-consolidado`: o que se protege é
 * vocabulário, e vocabulário volta por decisão local razoável — "só nesta
 * frase", "aqui é histórico" — que ninguém percebe uma a uma.
 */

const RAIZ = path.resolve(__dirname, "../..");
const PASTAS = ["docs/guias", "docs/rede"];

/**
 * Termo aposentado → a decisão que o aposentou. A ADR é o passe: citá-la na
 * mesma linha autoriza a menção, porque prova que quem escreveu sabia.
 */
const APOSENTADOS: ReadonlyArray<{ termo: string; adr: string; virou: string }> = [
  { termo: "Ficha da Paciente", adr: "ADR-097", virou: "Ficha do Assistido" },
  { termo: "Guia do Atendente", adr: "ADR-100", virou: "Guia do Supervisor" },
  { termo: "Roteiro de Atendimento", adr: "ADR-100", virou: "Roteiro do Supervisor" },
  { termo: "Guia do Concierge", adr: "ADR-106", virou: "Guia do Acompanhamento" },
  { termo: "Roteiro do Concierge", adr: "ADR-106", virou: "Roteiro do Acompanhamento" },
  // "Atendente" solto vem por último: é o mais amplo, e por isso o mais
  // propenso a voltar sem que ninguém repare.
  { termo: "Atendente", adr: "ADR-100", virou: "Supervisor" },
];

function arquivosHtml(pasta: string): string[] {
  const base = path.join(RAIZ, pasta);
  const achados: string[] = [];
  const andar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const alvo = path.join(dir, nome);
      if (statSync(alvo).isDirectory()) andar(alvo);
      else if (alvo.endsWith(".html")) achados.push(alvo);
    }
  };
  andar(base);
  return achados;
}

describe("Vocabulário das peças de papel — SIM-63", () => {
  it("nenhum termo aposentado sobrevive sem citar a ADR que o aposentou", () => {
    const sobras: string[] = [];

    for (const pasta of PASTAS) {
      for (const arquivo of arquivosHtml(pasta)) {
        const linhas = readFileSync(arquivo, "utf-8").split("\n");
        const relativo = path.relative(RAIZ, arquivo).replace(/\\/g, "/");

        linhas.forEach((linha, i) => {
          for (const { termo, adr, virou } of APOSENTADOS) {
            if (!linha.includes(termo)) continue;
            // A ADR na mesma linha é o passe da menção histórica deliberada.
            if (linha.includes(adr)) return;
            sobras.push(
              `${relativo}:${i + 1} — "${termo}" (${adr} trocou por "${virou}"). ` +
                `Se a menção for histórica de propósito, cite a ${adr} na mesma linha.`,
            );
            return;
          }
        });
      }
    }

    expect(sobras, `\n${sobras.join("\n")}\n`).toEqual([]);
  });

  it("as duas pastas existem e têm peças — senão este teste passa por vazio", () => {
    for (const pasta of PASTAS) {
      expect(arquivosHtml(pasta).length, `sem .html em ${pasta}`).toBeGreaterThan(0);
    }
  });
});
