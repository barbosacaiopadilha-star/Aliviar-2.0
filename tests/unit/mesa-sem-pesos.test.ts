import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * VARREDURA FINAL DA VIRADA — ADR-042.
 *
 * Guardas de texto de propósito: o que precisa ser garantido não é o retorno
 * de uma função, é que o modelo antigo não volte a ter autoridade. Um teste
 * de comportamento passaria feliz enquanto alguém reintroduz a soma de 100
 * pontos por baixo.
 */
function fontes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return fontes(caminho);
    return /\.(ts|tsx)$/.test(entrada.name) ? [caminho] : [];
  });
}

/** Comentário que EXPLICA a virada cita o vocabulário antigo de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .split("\n")
    .filter((linha) => {
      const limpa = linha.trimStart();
      return (
        !limpa.startsWith("//") &&
        !limpa.startsWith("*") &&
        !limpa.startsWith("/*") &&
        !limpa.startsWith("{/*")
      );
    })
    .join("\n");
}

const CODIGO = fontes(join(process.cwd(), "src")).map((arquivo) => ({
  arquivo: arquivo.replace(process.cwd(), "").replace(/\\/g, "/"),
  texto: semComentarios(readFileSync(arquivo, "utf8")),
}));

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

describe("cruzamento_weights não tem escritor nem consumidor operacional", () => {
  it("nenhum arquivo de src grava na tabela", () => {
    for (const { arquivo, texto } of CODIGO) {
      const escreve = /from\("cruzamento_weights"\)\s*\.?\s*(upsert|insert|update|delete)/.test(
        texto,
      );
      expect(escreve, arquivo).toBe(false);
    }
  });

  it("loadCruzamentoWeights e saveCruzamentoBlockWeights não existem mais", () => {
    for (const { arquivo, texto } of CODIGO) {
      expect(texto.includes("loadCruzamentoWeights"), arquivo).toBe(false);
      expect(texto.includes("saveCruzamentoBlockWeights"), arquivo).toBe(false);
    }
  });

  it("a Mesa não lê a tabela", () => {
    expect(ler("src/modules/curadoria/mesa-cruzamento.ts")).not.toContain("cruzamento_weights");
  });
});

describe("priority_weights não tem escritor nem consumidor operacional", () => {
  it("nenhum arquivo de src grava na tabela", () => {
    for (const { arquivo, texto } of CODIGO) {
      const escreve = /from\("priority_weights"\)\s*\.?\s*(upsert|insert|update|delete)/.test(texto);
      expect(escreve, arquivo).toBe(false);
    }
  });

  it("não participa da Mesa, das fases, do reconhecimento nem do Relatório", () => {
    for (const relativo of [
      "src/modules/curadoria/mesa-cruzamento.ts",
      "src/modules/curadoria/mesa-cruzamento-view.ts",
      "src/modules/curadoria/cos/phases.ts",
      "src/modules/curadoria/reconhecimento-do-perfil.ts",
      "src/modules/curadoria/relatorio-inteligente.ts",
      "src/modules/curadoria/relatorio-assistido.ts",
      "src/modules/paciente/experiencia-loader.ts",
    ]) {
      expect(ler(relativo), relativo).not.toContain("priority_weights");
    }
  });
});

describe("O vocabulário do orçamento saiu do código operacional", () => {
  const PROIBIDOS = [
    "BLOCK_POINTS",
    "coverageSentence",
    "coveredWeight",
    "totalWeight",
    "budgetOf",
    "clampWeight",
  ];

  it("a Mesa, a condução e o Relatório não usam nenhum deles", () => {
    for (const relativo of [
      "src/modules/curadoria/mesa-cruzamento.ts",
      "src/modules/curadoria/mesa-cruzamento-view.ts",
      "src/modules/curadoria/mesa-investigacao.ts",
      "src/modules/curadoria/cos/conduction.ts",
      "src/modules/curadoria/cos/phases.ts",
      "src/modules/curadoria/relatorio-inteligente.ts",
      "src/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes.tsx",
    ]) {
      const texto = ler(relativo);
      for (const termo of PROIBIDOS) {
        expect(texto.includes(termo), `${relativo} → ${termo}`).toBe(false);
      }
    }
  });

  // M5: `mesa-doctor-card.tsx` e `mesa-comparison.tsx` saíram do repositório —
  // eram os últimos exibidores de banda e da "conta" de pesos.
  it("nenhuma superfície da Mesa fala em 100 pontos", () => {
    for (const relativo of [
      "src/modules/curadoria/mesa-cruzamento.ts",
      "src/modules/curadoria/mesa-cruzamento-view.ts",
      "src/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes.tsx",
      "src/components/curadoria/mesa-preocupacoes/compor-os-tres.tsx",
      "src/modules/curadoria/cos/conduction.ts",
    ]) {
      expect(ler(relativo), relativo).not.toMatch(/100 pontos|de 100\b/);
    }
  });

  it("nenhuma superfície da Mesa exibe score ou nota", () => {
    for (const relativo of [
      "src/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes.tsx",
      "src/components/curadoria/mesa-preocupacoes/compor-os-tres.tsx",
      "src/components/curadoria/cruzamento-mesa.tsx",
    ]) {
      expect(ler(relativo), relativo).not.toContain("internalScore");
    }
  });
});

describe("A Mesa consome o Motor central, sem reproduzi-lo", () => {
  const mesa = ler("src/modules/curadoria/mesa-cruzamento.ts");
  const view = ler("src/modules/curadoria/mesa-cruzamento-view.ts");
  const matriz = ler("src/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes.tsx");

  it("o loader chama o Motor e os Mapas", () => {
    expect(mesa).toContain("crossPriorityAndProfessional");
    expect(mesa).toContain("loadCasePriorityMap");
    expect(mesa).toContain("loadProfessionalMap");
  });

  it("a matriz do Motor não é reproduzida na Mesa nem na interface", () => {
    // Reproduzir a matriz criaria duas verdades sobre o mesmo cruzamento.
    for (const [nome, texto] of [
      ["view", view],
      ["matriz", matriz],
    ] as const) {
      expect(texto.includes("crossOne"), nome).toBe(false);
      expect(texto.includes("MATRIZ"), nome).toBe(false);
    }
  });

  it("a interface não recalcula compatibilidade — só lê o que recebeu", () => {
    expect(matriz).not.toContain("crossPriorityAndProfessional");
  });
});

describe("Dados históricos e migrations preservados", () => {
  it("as tabelas legadas continuam existindo nas migrations", () => {
    const migrations = readdirSync(join(process.cwd(), "supabase/migrations"))
      .map((nome) => readFileSync(join(process.cwd(), "supabase/migrations", nome), "utf8"))
      .join("\n");

    expect(migrations).toContain("create table curadoria.priority_weights");
    expect(migrations).toContain("cruzamento_weights");
    // Nenhuma migration apaga as tabelas nem converte os dados.
    expect(migrations).not.toMatch(/drop table[\s\S]{0,40}priority_weights/i);
    expect(migrations).not.toMatch(/drop table[\s\S]{0,40}cruzamento_weights/i);
  });

  it("nenhuma sincronização entre os dois modelos foi criada", () => {
    for (const { arquivo, texto } of CODIGO) {
      const converte =
        /(priority_weights|cruzamento_weights)/.test(texto) &&
        /case_priority_map/.test(texto) &&
        /insert|upsert/.test(texto);
      expect(converte, arquivo).toBe(false);
    }
  });

  it("M5: a tabela permanece, e nenhum código a lê — nem para histórico", () => {
    // Os dados continuam no banco e as migrations não foram tocadas; o que
    // deixou de existir é qualquer caminho de código até eles.
    for (const { arquivo, texto } of CODIGO) {
      expect(texto.includes('from("priority_weights")'), arquivo).toBe(false);
    }
  });
});
