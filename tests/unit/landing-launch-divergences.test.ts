import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CARDS } from "@/components/landing/faq-cards";

// LAND DO PACIENTE — Fase 10 (Fechamento das Divergências de Lançamento).
// Testes de regressão para as três decisões do responsável do produto:
// (1) remoção do CTA de WhatsApp placeholder; (2) reescrita da carta 3
// do FAQ; (3) aprovação do Vídeo Companheiro ambiente em vez do vídeo
// institucional de 10 minutos. Verificações puramente textuais (leitura
// de arquivo real, nunca reimplementação da regra em outro lugar) — a
// parte que exige renderização React vive em
// tests/components/final-actions-integration.test.tsx.

const LANDING_DIR = path.join(process.cwd(), "src", "components", "landing");
const DOCS_DIR = path.join(process.cwd(), "docs");

function readLanding(file: string): string {
  return readFileSync(path.join(LANDING_DIR, file), "utf-8");
}

function readDoc(file: string): string {
  return readFileSync(path.join(DOCS_DIR, file), "utf-8");
}

// Remove comentários antes de checar "wa.me" — o código documenta, de
// propósito, por que o link foi removido (mesmo padrão já usado em
// header-compaction.ts) — isso é histórico desejável, não uma
// reintrodução do destino ativo. O teste verifica código funcional,
// nunca prosa explicativa.
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const LANDING_SOURCE_FILES = [
  "portal-experience.tsx",
  "portal-frames.tsx",
  "portal-scenes.ts",
  "faq-book-section.tsx",
  "faq-cards.ts",
  "faq-book-turn.ts",
  "final-cta-section.tsx",
  "final-actions.tsx",
  "public-header.tsx",
  "public-footer.tsx",
  "video-section.tsx",
];

describe("Decisão 1 — CTA de WhatsApp removido", () => {
  it("`wa.me` não existe mais em nenhum código funcional da Landing (fora de comentários históricos)", () => {
    for (const file of LANDING_SOURCE_FILES) {
      const source = stripComments(readLanding(file));
      expect(
        source,
        `${file} ainda contém "wa.me" fora de um comentário`,
      ).not.toMatch(/wa\.me/i);
    }
  });

  it("final-actions.tsx expõe exatamente um CTA, apontando para /sua-historia", () => {
    const source = readLanding("final-actions.tsx");
    const hrefMatches = [...source.matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(hrefMatches).toEqual(["/sua-historia"]);
  });

  it("nenhum LinkButton da Landing aponta para destino placeholder (#, vazio, example.com)", () => {
    for (const file of LANDING_SOURCE_FILES) {
      const source = readLanding(file);
      const hrefMatches = [...source.matchAll(/href="([^"]*)"/g)].map(
        (match) => match[1],
      );
      for (const href of hrefMatches) {
        expect(href, `${file} tem um href vazio`).not.toBe("");
        expect(href, `${file} tem um href "#" solto`).not.toBe("#");
        expect(href, `${file} tem um href de exemplo`).not.toMatch(
          /example\.com|wa\.me/i,
        );
      }
    }
  });
});

describe("Decisão 2 — carta 3 do FAQ reescrita", () => {
  it("continua havendo exatamente 6 cartas", () => {
    expect(CARDS).toHaveLength(6);
  });

  it("a carta 3 (índice 2) mantém a pergunta emocional original", () => {
    expect(CARDS[2].duvidaTitle).toEqual(["Não sei qual", "caminho escolher"]);
  });

  it("a carta 3 não menciona Busca Direta, discovery, connection, roadmap ou 'em breve'", () => {
    const card = CARDS[2];
    const fullText = [
      ...card.duvidaTitle,
      card.duvidaText,
      ...card.solucaoTitle,
      card.solucaoText,
    ].join(" ");
    expect(fullText).not.toMatch(/busca direta/i);
    expect(fullText).not.toMatch(/discovery/i);
    expect(fullText).not.toMatch(/connection/i);
    expect(fullText).not.toMatch(/roadmap/i);
    expect(fullText).not.toMatch(/em breve/i);
  });

  it("a carta 3 tem pergunta e solução coerentes e não vazias", () => {
    const card = CARDS[2];
    expect(card.duvidaText.length).toBeGreaterThan(0);
    expect(card.solucaoText.length).toBeGreaterThan(0);
    expect(card.solucaoTitle.join(" ")).not.toBe("");
  });

  it('nenhuma outra carta ("Busca Direta") aparece em nenhuma das 6 cartas', () => {
    for (const card of CARDS) {
      const fullText = [
        ...card.duvidaTitle,
        card.duvidaText,
        ...card.solucaoTitle,
        card.solucaoText,
      ].join(" ");
      expect(fullText).not.toMatch(/busca direta/i);
    }
  });

  it("as outras quatro cartas (0, 3, 4, 5) permanecem byte a byte inalteradas desde a Fase 10", () => {
    expect(CARDS[0]).toEqual({
      duvidaTitle: ["Não sei", "por onde começar"],
      duvidaText:
        "Você tem uma situação de saúde, mas não sabe como organizar os próximos passos.",
      solucaoTitle: ["Curadoria", "organizada"],
      solucaoText:
        "Uma pessoa da nossa equipe entende sua história e organiza um caminho claro para você.",
    });
    expect(CARDS[3]).toEqual({
      duvidaTitle: ["Preocupado com", "meus dados"],
      duvidaText:
        "Contar sua história com uma empresa exige confiança sobre o que acontece com essa informação.",
      solucaoTitle: ["Uso restrito", "e consentido"],
      solucaoText:
        "Suas informações organizam seu atendimento e nunca são compartilhadas sem sua autorização.",
    });
    expect(CARDS[4]).toEqual({
      duvidaTitle: ["Quanto tempo", "vou esperar"],
      duvidaText:
        "A incerteza sobre prazos é uma das partes mais difíceis de buscar cuidado.",
      solucaoTitle: ["Clareza sobre", "o próximo passo"],
      solucaoText:
        "O tempo varia conforme sua situação, mas você nunca fica sem saber o que vem a seguir.",
    });
    expect(CARDS[5]).toEqual({
      duvidaTitle: ["A Aliviar", "substitui um médico?"],
      duvidaText:
        "É natural se perguntar se a curadoria troca o acompanhamento profissional de saúde.",
      solucaoTitle: ["Conectamos você", "a quem cuida"],
      solucaoText:
        "O cuidado em si é sempre humano — nós organizamos o caminho até ele.",
    });
  });
});

describe("Retorno Controlado — carta 2 do FAQ sem promessa de canal inexistente", () => {
  it("a carta 2 (índice 1) tem o texto autorizado, sem mencionar WhatsApp ou qualquer canal específico", () => {
    expect(CARDS[1]).toEqual({
      duvidaTitle: ["Tenho medo de", "ficar sem suporte"],
      duvidaText: "Você teme ficar sozinho depois do primeiro contato.",
      solucaoTitle: ["Acompanhamento", "contínuo"],
      solucaoText:
        "A equipe Aliviar continua com você em cada etapa do processo. Você sempre sabe qual é o próximo passo e nunca precisa enfrentar esse caminho sozinho.",
    });
  });

  it("nenhuma carta do FAQ menciona WhatsApp, telefone, e-mail, Curador, Atendente ou Concierge", () => {
    for (const card of CARDS) {
      const fullText = [
        ...card.duvidaTitle,
        card.duvidaText,
        ...card.solucaoTitle,
        card.solucaoText,
      ].join(" ");
      expect(fullText).not.toMatch(/whatsapp/i);
      expect(fullText).not.toMatch(/telefone/i);
      expect(fullText).not.toMatch(/e-mail/i);
      // \b evita falso positivo com "Curadoria" (termo já aprovado e em
      // uso na Landing) — só barra "Curador"/"curador" como palavra própria.
      expect(fullText).not.toMatch(/\bcurador\b/i);
      expect(fullText).not.toMatch(/atendente/i);
      expect(fullText).not.toMatch(/concierge/i);
    }
  });
});

describe("Decisão 3 — Vídeo Companheiro aprovado, motores intocados", () => {
  it("VIDEO_EXIT_AT_FRAME permanece 5, exatamente como antes desta fase", () => {
    const source = readLanding("portal-frames.tsx");
    expect(source).toMatch(/export const VIDEO_EXIT_AT_FRAME = 5;/);
  });

  it("a configuração de saída do vídeo (portal-companion-video.ts) não foi tocada", () => {
    const source = readLanding("portal-companion-video.ts");
    expect(source).toMatch(/\{ opacity: 0\.8, ease: "none", duration: 1 \}/);
    expect(source).toMatch(
      /\{ opacity: 0, scale: 0\.93, filter: "blur\(6px\)", ease: "none", duration: 1 \}/,
    );
  });

  it("VideoSection continua montado dentro de PortalExperience", () => {
    const source = readLanding("portal-experience.tsx");
    expect(source).toMatch(/<VideoSection/);
    expect(source).toMatch(/variant="window"/);
  });

  it("LANDING_CREATIVE_DIRECTION.md não afirma mais que o vídeo é 'o centro' da Landing", () => {
    const doc = readDoc("LANDING_CREATIVE_DIRECTION.md");
    expect(doc).not.toMatch(
      /não é um componente qualquer — é o centro da Landing/,
    );
    expect(doc).toMatch(/Vídeo Companheiro/);
  });

  it("VIDEO_INSTITUCIONAL_LANDING.md está marcado como histórico (ADR-026)", () => {
    const doc = readDoc("VIDEO_INSTITUCIONAL_LANDING.md");
    expect(doc).toMatch(/HISTÓRICO/);
    expect(doc).toMatch(/ADR-026/);
  });

  it("docs/DECISIONS.md contém a ADR-026", () => {
    const doc = readDoc("DECISIONS.md");
    expect(doc).toMatch(/## ADR-026/);
  });
});

describe("Ordem das 12 seções preservada", () => {
  it("layout.tsx mantém Header antes e Footer depois do conteúdo", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src", "app", "(landing)", "layout.tsx"),
      "utf-8",
    );
    const chrome = readFileSync(
      path.join(process.cwd(), "src", "components", "landing", "public-chrome.tsx"),
      "utf-8",
    );
    const headerIndex = chrome.indexOf("<PublicHeader");
    const mainIndex = chrome.indexOf("{children}");
    const footerIndex = chrome.indexOf("<PublicFooter");
    expect(layout).toContain("theme-landing-green");
    expect(headerIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(headerIndex);
    expect(footerIndex).toBeGreaterThan(mainIndex);
  });

  // Atualizado pela ADR-033 (Landing 2.0, MISSÃO 201): o PortalExperience
  // deixou de abrir a página — o Hero da 2.0 assume, com a estrutura de 11
  // seções da missão. FAQ (Biblioteca) e CTA Final (Convite) permanecem, na
  // mesma ordem relativa de fechamento, agora precedidos pelas seções novas.
  it("page.tsx mantém a ordem Hero 2.0 → … → FAQ → CTA Final (ADR-033)", () => {
    const page = readFileSync(
      path.join(process.cwd(), "src", "app", "(landing)", "page.tsx"),
      "utf-8",
    );
    const heroIndex = page.indexOf("<HeroExperience");
    const quemSomosIndex = page.indexOf("<QuemSomosSection");
    const faqIndex = page.indexOf("<FaqBookSection");
    const ctaIndex = page.indexOf("<FinalCtaSection");
    expect(heroIndex).toBeGreaterThan(-1);
    expect(quemSomosIndex).toBeGreaterThan(heroIndex);
    expect(faqIndex).toBeGreaterThan(quemSomosIndex);
    expect(ctaIndex).toBeGreaterThan(faqIndex);
  });
});

describe("Documentação atualizada não contradiz a implementação aprovada", () => {
  it("a copy nova da carta 3 registrada em LANDING_UX_WRITING.md bate exatamente com faq-cards.ts", () => {
    const doc = readDoc("LANDING_UX_WRITING.md");
    const card = CARDS[2];
    expect(doc).toContain(card.duvidaText);
    expect(doc).toContain(card.solucaoText);
  });

  it("nenhum documento obrigatório desta fase ainda descreve o link de WhatsApp como algo a implementar/manter", () => {
    const audit = readDoc("LANDING_IMPLEMENTATION_AUDIT.md");
    expect(audit).not.toMatch(/\[DIVERGÊNCIA JÁ CONHECIDA\][^\n]*wa\.me/i);
  });
});
