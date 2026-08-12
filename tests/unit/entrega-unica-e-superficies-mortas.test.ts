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

/**
 * T-D-1 · TRACK D — o que saiu, e o substituto que o tornou removível.
 *
 * A regra que decidiu cada alvo: **uso zero com substituto vivo nomeado é
 * código morto; uso zero SEM substituto é capacidade enterrada.** Por isso
 * `mandatory-filters` ficou, e a landing morta saiu.
 */
describe("Track D · código morto removido, substituto vivo provado", () => {
  const REMOVIDOS_COM_SUBSTITUTO: Array<[string, string]> = [
    // R1 · o cluster da landing morta. O substituto é a editorial, viva.
    ["src/components/landing/portal-experience.tsx", "landing/editorial"],
    ["src/components/landing/faq-book-section.tsx", "landing/editorial"],
    ["src/components/landing/final-cta-section.tsx", "landing/editorial"],
    ["src/components/landing/v2/hero-experience.tsx", "landing/editorial"],
    ["src/components/landing/v2/curadoria-sections.tsx", "landing/editorial"],
    ["src/components/landing/v2/metodo-sections.tsx", "landing/editorial"],
    ["src/components/landing/v2/presenca-sections.tsx", "landing/editorial"],
    // Cascata recalculada, nunca lista decorada.
    ["src/components/landing/golden-thread.tsx", "cascata de R1"],
    ["src/components/landing/section-eyebrow.tsx", "cascata de R1"],
    ["src/components/landing/video-section.tsx", "cascata de R1"],
    ["src/components/landing/portal-frames.tsx", "cascata de R1"],
    ["src/components/landing/portal-scenes.tsx", "cascata de R1"],
    ["src/components/landing/faq-cards.ts", "cascata de R1"],
    ["src/components/landing/faq-book-turn.ts", "cascata de R1"],
    ["src/components/landing/final-actions.tsx", "cascata de R1"],
    // R2..R5
    ["src/components/index.ts", "arquivo sem exports"],
    ["src/components/curadoria/sem-curadoria.tsx", "PatientEmptyState"],
    ["src/components/ace/ace-health-check-card.tsx", "rota /admin/ace já removida"],
    ["src/components/ace/ace-metrics-cards.tsx", "rota /admin/ace já removida"],
    ["src/components/paciente/dashboard/patient-status-widget.tsx", "patient-home-state"],
  ];

  for (const [alvo, substituto] of REMOVIDOS_COM_SUBSTITUTO) {
    it(`${alvo} saiu — substituto: ${substituto}`, () => {
      expect(existsSync(path.join(RAIZ, alvo))).toBe(false);
    });
  }

  it("o diretório v2 inteiro saiu", () => {
    expect(existsSync(path.join(RAIZ, "src/components/landing/v2"))).toBe(false);
  });

  /**
   * O contrário da remoção, e a parte que mais importa: o que NÃO podia sair.
   * `mandatory-filters` é a única superfície da fase Filtros do COS. Apagá-lo
   * mataria a etapa — e faria `actions-have-callers` ficar verde por ausência.
   */
  const CAPACIDADE_ENTERRADA = [
    "src/components/curadoria/mandatory-filters.tsx",
    "src/components/profiles/patient-notifications-list.tsx",
    "src/components/ui/skeleton.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/landing/link-button.tsx",
  ];

  for (const guardado of CAPACIDADE_ENTERRADA) {
    it(`${guardado} PERMANECE — uso zero sem substituto não é lixo`, () => {
      expect(existsSync(path.join(RAIZ, guardado))).toBe(true);
    });
  }

  it("a landing viva não perdeu nada", () => {
    for (const vivo of [
      "src/components/landing/editorial",
      "src/components/landing/public-header.tsx",
      "src/components/landing/public-footer.tsx",
      "src/components/landing/header-compaction.ts",
    ]) {
      expect(existsSync(path.join(RAIZ, vivo)), `${vivo} sumiu`).toBe(true);
    }
  });
});
