import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 1.7 — UMA ENTREGA, E NENHUMA SUPERFÍCIE MORTA (P9/P20 · critério X4).
 *
 * Duas coisas conviviam na página da paciente: a Curadoria do Método e o
 * formato do motor anterior, exibidos ao mesmo tempo sob o título "Seu
 * relatório anterior" — dois documentos concorrentes no artefato mais sensível
 * do produto (RI5). E três superfícies inalcançáveis seguiam no repositório.
 *
 * A decisão DP-2 congelou o motor anterior: nenhuma operação nova, histórico
 * preservado integralmente. Estes testes provam as duas metades — o que saiu, e
 * o que **não pode** ter saído junto.
 */

const RAIZ = process.cwd();
const ler = (relativo: string) => readFileSync(path.join(RAIZ, relativo), "utf8");

describe("Uma entrega por vez (X4)", () => {
  const pagina = ler("src/app/paciente/curadoria/page.tsx");

  it("a segunda entrega saiu — nenhum 'relatório anterior' ao lado da Curadoria", () => {
    expect(pagina).not.toContain("Seu relatório anterior");
  });

  it("o formato legado só é renderizado quando NÃO existe a Curadoria do Método", () => {
    // Todas as renderizações do documento legado são condicionadas a `!curadoria`.
    const renderizacoes = [...pagina.matchAll(/<FinalCuradoriaView/g)];
    expect(renderizacoes.length).toBeGreaterThan(0);

    for (const ocorrencia of renderizacoes) {
      const antes = pagina.slice(Math.max(0, ocorrencia.index! - 120), ocorrencia.index!);
      expect(
        antes.includes("!curadoria"),
        "há uma renderização do formato legado que não exige a ausência da Curadoria do Método",
      ).toBe(true);
    }
  });

  it("quem tem apenas o documento legado continua vendo o seu — nada foi apagado", () => {
    expect(pagina).toContain("{!curadoria && delivery ? <FinalCuradoriaView delivery={delivery} />");
  });
});

describe("O PDF não depende mais do motor anterior (A5)", () => {
  const impressao = ler("src/app/paciente/curadoria/imprimir/page.tsx");
  const pagina = ler("src/app/paciente/curadoria/page.tsx");

  it("a impressão tenta primeiro a Curadoria do Método", () => {
    // Só o corpo da função — a ordem dos imports não diz nada sobre execução.
    const corpo = impressao.slice(impressao.indexOf('export default async function'));
    const posCuradoria = corpo.indexOf("loadPatientCuradoria(");
    const posLegado = corpo.indexOf("getLatestFinalCuradoriaDeliveryForPatient(");
    expect(posCuradoria).toBeGreaterThan(-1);
    expect(posLegado).toBeGreaterThan(-1);
    expect(posCuradoria, "a entrega canônica precisa ser tentada antes da legada").toBeLessThan(
      posLegado,
    );
  });

  it("o formato legado permanece imprimível para quem só tem ele", () => {
    expect(impressao).toContain("FinalCuradoriaView");
  });

  it("o link do PDF deixou de exigir a entrega legada", () => {
    // Antes: `{delivery ? (<p>…Levar em PDF…</p>) : null}` dentro do bloco da Mesa.
    const bloco = pagina.slice(
      pagina.indexOf("const blocoMesa"),
      pagina.indexOf("  return (", pagina.indexOf("const blocoMesa")),
    );
    expect(bloco).toContain("Levar em PDF");
    expect(
      /\{delivery \? \(\s*<p/.test(bloco),
      "o link do PDF voltou a depender da entrega legada",
    ).toBe(false);
  });

  it("a view de impressão da Curadoria existe e não inventa conteúdo", () => {
    // Comentário que cita a regra ("nunca contém score") não é texto de tela:
    // o que se audita é o que é renderizado.
    const view = ler("src/components/patient/curadoria-print-view.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    // Nenhum vocabulário de mecanismo alcança o papel dela.
    for (const proibido of ["score", "ranking", "posição", "colocação", "nota final"]) {
      expect(view.toLowerCase().includes(proibido), proibido).toBe(false);
    }
    // Os pontos de atenção são obrigatórios na leitura dela — nunca omitidos.
    expect(view).toContain("attentionPoints");
  });
});

describe("Superfícies mortas removidas (P20)", () => {
  for (const superficie of [
    "src/app/curador",
    "src/app/portal-paciente",
    "src/app/admin/ace",
    "src/components/ace/ace-executions-table.tsx",
  ]) {
    it(`${superficie} não existe mais`, () => {
      expect(existsSync(path.join(RAIZ, superficie))).toBe(false);
    });
  }

  it("nenhum código vivo aponta para as rotas removidas", () => {
    const consumidor = ler("src/app/admin/casos/[id]/page.tsx");
    expect(consumidor).not.toContain('detailBasePath="/admin/ace"');
  });

  it("os redirects permanecem — quem tem link antigo continua chegando", () => {
    const config = ler("next.config.ts");
    expect(config).toContain('source: "/curador/:path*"');
    expect(config).toContain('source: "/portal-paciente/:path*"');
  });
});

describe("Histórico preservado (DP-2)", () => {
  it("o dado histórico continua legível — nenhuma tabela saiu do código", () => {
    // O histórico do motor anterior vive no banco; este pacote não o toca.
    expect(existsSync(path.join(RAIZ, "supabase/migrations"))).toBe(true);

    const leitor = ler("src/modules/concierge/execution-repository.ts");
    for (const tabela of ["ace_executions", "ace_execution_events"]) {
      expect(leitor.includes(tabela), `${tabela} deixou de ser legível`).toBe(true);
    }
  });

  it("o histórico de execuções continua visível no Case", () => {
    const consumidor = ler("src/app/admin/casos/[id]/page.tsx");
    expect(consumidor).toContain("AceExecutionsHistory");
  });
});
