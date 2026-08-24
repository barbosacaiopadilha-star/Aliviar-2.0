import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  // MERGE DE 23/08 · a Curadoria vive no Início; a composição mora no
  // BlocoCuradoria e é ele (mais a rota que o abriga) que se audita.
  const pagina =
    ler("src/components/paciente/bloco-curadoria.tsx") + ler("src/app/paciente/page.tsx");

  it("a segunda entrega saiu — nenhum 'relatório anterior' ao lado da Curadoria", () => {
    expect(pagina).not.toContain("Seu relatório anterior");
  });

  /**
   * A REGRA FICOU MAIS FORTE, NÃO MAIS FRACA.
   *
   * Estas duas asserções exigiam que o formato legado só aparecesse na
   * ausência da Curadoria do Método — a formulação possível enquanto o motor
   * anterior ainda produzia entrega. O motor saiu, e com ele o segundo
   * formato: agora não há o que condicionar, porque não há segunda entrega.
   *
   * "Uma entrega por vez" vira "uma entrega, ponto".
   */
  it("não existe segundo formato de entrega — nem componente, nem renderização", () => {
    expect(pagina).not.toContain("FinalCuradoriaView");
    expect(pagina, "a rota não pode voltar a ler a entrega do motor anterior").not.toContain(
      "getLatestFinalCuradoriaDeliveryForPatient",
    );
    expect(
      existsSync(path.join(RAIZ, "src/components/patient/final-curadoria-view.tsx")),
      "o componente do formato legado voltou ao repositório",
    ).toBe(false);
  });

  it("a entrega que existe é a da Curadoria do Método, e ela é a única", () => {
    expect(pagina).toContain("loadPatientCuradoria");
    expect(pagina).toContain("<CaminhosPanel");
  });
});

describe("O PDF não depende mais do motor anterior (A5)", () => {
  const impressao = ler("src/app/paciente/curadoria/imprimir/page.tsx");
  // MERGE DE 23/08 · o bloco da Mesa mora no BlocoCuradoria.
  const pagina = ler("src/components/paciente/bloco-curadoria.tsx");

  it("a impressão só conhece a Curadoria do Método", () => {
    // Só o corpo da função — a ordem dos imports não diz nada sobre execução.
    const corpo = impressao.slice(impressao.indexOf("export default async function"));
    expect(corpo).toContain("loadPatientCuradoria(");
    expect(
      corpo,
      "a impressão voltou a procurar a entrega do motor anterior",
    ).not.toContain("getLatestFinalCuradoriaDeliveryForPatient(");
  });

  it("sem Curadoria não há folha inventada — a rota devolve 404", () => {
    const corpo = impressao.slice(impressao.indexOf("export default async function"));
    expect(corpo).toContain("if (!curadoria)");
    expect(corpo).toContain("notFound()");
    expect(impressao, "o formato legado saiu da impressão").not.toContain("FinalCuradoriaView");
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
    "src/modules/ace",
    "src/modules/concierge",
    "src/components/ace",
    "src/components/cases/ace-artifacts-list.tsx",
    "src/components/cases/ace-shortlist-viewer.tsx",
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
  /**
   * DP-2 MUDOU DE FORMA, NÃO DE CONTEÚDO.
   *
   * A promessa era: nenhuma operação nova pelo motor anterior, histórico
   * preservado integralmente. Enquanto havia leitor e tela, a prova era que
   * ambos continuavam existindo. O leitor e a tela saíram — o histórico, não.
   *
   * A promessa passa a ser provada onde ela de fato vive: no banco. Nenhuma
   * migration pode derrubar as tabelas do motor anterior. Apagar o registro é
   * que seria a violação; parar de exibi-lo nunca foi.
   */
  it("nenhuma migration derruba as tabelas do histórico", () => {
    const dir = path.join(RAIZ, "supabase/migrations");
    expect(existsSync(dir)).toBe(true);

    const migrations = readdirSync(dir).filter((nome) => nome.endsWith(".sql"));
    expect(migrations.length).toBeGreaterThan(0);

    for (const nome of migrations) {
      const sql = readFileSync(path.join(dir, nome), "utf8").toLowerCase();
      for (const tabela of ["ace_executions", "ace_execution_events", "ace_artifacts"]) {
        expect(
          new RegExp(`drop\\s+table\\s+(if\\s+exists\\s+)?(curadoria\\.)?${tabela}\\b`).test(sql),
          `${nome} apaga ${tabela} — o histórico do motor anterior não pode ser destruído`,
        ).toBe(false);
      }
    }
  });

  it("nenhuma superfície voltou a exibir o histórico do motor anterior", () => {
    const consumidor = ler("src/app/admin/casos/[id]/page.tsx");
    expect(consumidor).not.toContain("AceExecutionsHistory");
    expect(consumidor).not.toContain("AceArtifactsList");
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
