import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * T-D-2 · O DETECTOR DE ÓRFÃOS — o produto mais duradouro da Track D.
 *
 * Quatro vezes a mesma classe de defeito passou por auditoria em vez de por
 * suíte: `CuradoriaDecisionPanel` ficou fora da rota com tudo verde;
 * `SemCuradoria` nunca foi renderizado; `WhatsappContact` alcançava ninguém
 * porque seu único importador era o anterior; e `mandatory-filters` — escrito
 * justamente para curar uma action órfã — está órfão ele mesmo.
 *
 * Este teste teria pego as quatro. Depois dele, superfície órfã deixa de ser
 * achado de auditoria e passa a ser **falha de suíte**.
 *
 * O mecanismo honesto é a allowlist: manter um órfão passa a exigir
 * **escrever o motivo**, e o motivo fica no repositório. Ela é verificada nos
 * dois sentidos — nenhum órfão fora dela, e nenhuma entrada nela que já não
 * seja órfã ou que aponte para arquivo inexistente. Lista que apodrece em
 * silêncio é a mesma doença com outro nome.
 *
 * A régua NÃO é "uso zero é lixo". É a do contrato 32 §4:
 *
 *   uso zero COM substituto vivo nomeado  → código morto: sai
 *   uso zero SEM substituto               → capacidade enterrada: fica, registrada
 */

const RAIZ = process.cwd();
const SRC = path.join(RAIZ, "src");
const COMPONENTS = path.join(SRC, "components");

/**
 * Os oito órfãos autorizados, cada um com o motivo por extenso.
 *
 * Acrescentar uma linha aqui é um ato deliberado e revisável — nunca um efeito
 * colateral. A Mesa deu superfície ao `mandatory-filters` no Bloco 11, ele saiu desta
 * lista, e o GAP-D-1 fechou —
 * ele deixa de ser órfão, esta entrada fica obsoleta e o teste **exige** que
 * ela saia: é assim que o `GAP-D-1` fecha em voz alta.
 */
const ORFAOS_AUTORIZADOS: Record<string, string> = {
  "src/components/profiles/patient-notifications-list.tsx":
    "GAP-D-2 · as notificações aparecem na linha do tempo, mas 'marcar como lida' não existe em nenhum outro lugar.",
  "src/components/ui/skeleton.tsx":
    "Biblioteca canônica da Fundação (D-2, FOUNDATION_PRIMITIVES). Dicionário sem consumidor é vocabulário, não lixo.",
  "src/components/ui/tabs.tsx":
    "Biblioteca canônica da Fundação (D-2, FOUNDATION_PRIMITIVES). Dicionário sem consumidor é vocabulário, não lixo.",
  "src/components/curadoria/activity-feed.tsx":
    "GAP-D-3 · uso zero sem substituto integral provado.",
  "src/components/curadoria/evidence-card.tsx":
    "GAP-D-3 · uso zero sem substituto integral provado.",
  "src/components/curadoria/jornada-timeline.tsx":
    "GAP-D-3 · uso zero sem substituto integral provado.",
  "src/components/curadoria/mesa/evidencia-chips.tsx":
    "GAP-D-3 · uso zero sem substituto integral provado.",
  "src/components/curadoria/scroll-action-link.tsx":
    "GAP-D-3 · uso zero sem substituto integral provado.",
};

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

/**
 * Resolve um especificador para um arquivo real.
 *
 * O `index.ts` importa: `@/components/ads` resolve para `ads/index.ts`, e foi
 * por isso que `ads/index.ts` e `journey/index.ts` apareceram como falsos
 * positivos na varredura manual. Zero import POR CAMINHO não é órfão.
 */
function resolver(especificador: string, deOnde: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deOnde), especificador);
  else return null;

  for (const tentativa of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    try {
      if (statSync(tentativa).isFile()) return tentativa;
    } catch {
      // caminho inexistente — segue tentando
    }
  }
  return null;
}

function relativo(arquivo: string): string {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

/** Quantos arquivos de `src/` importam cada arquivo de `src/`. */
function importadores(): Map<string, number> {
  const todos = arquivos(SRC);
  const contagem = new Map(todos.map((f) => [f, 0]));

  for (const arquivo of todos) {
    const codigo = readFileSync(arquivo, "utf8");
    for (const re of [/from\s+["']([^"']+)["']/g, /import\(\s*["']([^"']+)["']\s*\)/g]) {
      for (const m of codigo.matchAll(re)) {
        const destino = resolver(m[1]!, arquivo);
        if (destino && destino !== arquivo && contagem.has(destino)) {
          contagem.set(destino, contagem.get(destino)! + 1);
        }
      }
    }
  }
  return contagem;
}

describe("T-D-2 · nenhum componente órfão fora da allowlist", () => {
  const contagem = importadores();
  const orfaos = arquivos(COMPONENTS)
    .filter((f) => contagem.get(f) === 0)
    .map(relativo)
    .sort();

  it("o grafo enxerga a árvore — sem isto, tudo abaixo passaria em falso", () => {
    expect(contagem.size).toBeGreaterThan(100);
    expect([...contagem.values()].some((n) => n > 0)).toBe(true);
  });

  it("todo órfão está na allowlist, com motivo escrito", () => {
    const semMotivo = orfaos.filter((f) => !ORFAOS_AUTORIZADOS[f]);
    expect(
      semMotivo,
      "componente que ninguém importa: ou ele tem substituto vivo e SAI, ou " +
        "é capacidade enterrada e entra na allowlist COM o motivo por extenso",
    ).toEqual([]);
  });

  it("a allowlist não apodrece — toda entrada existe e continua órfã", () => {
    for (const [alvo, motivo] of Object.entries(ORFAOS_AUTORIZADOS)) {
      const completo = path.join(RAIZ, alvo);
      let existe = false;
      try {
        existe = statSync(completo).isFile();
      } catch {
        existe = false;
      }
      expect(existe, `${alvo} está na allowlist e não existe mais — apague a entrada`).toBe(true);
      expect(
        orfaos,
        `${alvo} ganhou importador: a entrada da allowlist virou mentira e precisa sair`,
      ).toContain(alvo);
      expect(motivo.trim().length, `${alvo} está na allowlist sem motivo`).toBeGreaterThan(20);
    }
  });

  it("são exatamente oito — o órfão do motor anterior saiu com ele", () => {
    expect(orfaos).toEqual(Object.keys(ORFAOS_AUTORIZADOS).sort());
  });
});
