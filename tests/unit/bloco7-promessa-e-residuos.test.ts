import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * BLOCO 7 · T-7-4, T-7-5 e T-7-10 — o que a Landing NUNCA pode dizer.
 *
 * A Landing é a primeira coisa que alguém em pânico lê sobre a Aliviar. Uma
 * frase a mais aqui não é copy: é uma promessa que o produto vai ter de
 * cumprir, e ele não tem como.
 *
 * T-7-4 é a guarda de promessa do contrato 34 §6.5 — e a lição de M-C3, na
 * Track C, é que varrer vocabulário sozinho não basta. Por isso ela varre
 * padrões (prazos, métricas com número, verbos de agendamento), e não uma
 * lista de palavras soltas.
 */

const RAIZ = process.cwd();
const LANDING = path.join(RAIZ, "src/components/landing");
const PUBLIC_APP = path.join(RAIZ, "src/app/(public)");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

function relativo(arquivo: string): string {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

/** O texto que a Landing exibe — literais de string e de JSX, sem comentários. */
function copyDaLanding(): Array<{ arquivo: string; texto: string }> {
  return [...arquivos(LANDING), ...arquivos(PUBLIC_APP)].map((arquivo) => ({
    arquivo: relativo(arquivo),
    texto: readFileSync(arquivo, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ""),
  }));
}

describe("T-7-4 · nenhuma promessa que o produto não cumpre", () => {
  const PROIBIDOS: Array<[string, RegExp]> = [
    ["prazo em horas", /\b(em até|dentro de)\s+\d+\s*(h|horas?)/i],
    ["prazo em dias", /\b(em até|dentro de)\s+\d+\s*dias?/i],
    ["resposta imediata", /respost[ao]\s+(imediat|em minutos)/i],
    ["horário de atendimento", /hor[áa]rio\s+de\s+atendimento/i],
    ["dias úteis", /dias?\s+[úu]teis/i],
    ["entraremos em contato", /entraremos\s+em\s+contato/i],
    ["em breve", /\bem\s+breve\b/i],
    ["agendamento", /\bagendamos\b|\bagendaremos\b|\bmarcamos\s+(a\s+)?consulta/i],
    ["intermediação com o profissional", /falamos\s+com\s+(o|a)\s+(m[ée]dic|profissional)/i],
    ["número de médicos", /\b\d[\d.]*\s*(\+\s*)?(m[ée]dicos|especialistas|profissionais)\b/i],
    ["número de cidades", /\b\d[\d.]*\s*(\+\s*)?cidades\b/i],
    ["número de casos", /\b\d[\d.]*\s*(\+\s*)?(casos|pacientes|fam[íi]lias)\s+(atendid|acompanhad)/i],
    ["depoimento atribuído", /—\s*(Maria|João|Ana|Paula|Carlos)\s*,\s*(paciente|cliente)/i],
    ["selo ou certificação", /\b(selo|certificad[oa]\s+por|premiad[oa])\b/i],
    ["diagnóstico ou cura", /\b(diagnosticamos|curamos|garantimos\s+(o\s+)?resultado)\b/i],
  ];

  it("os arquivos da Landing foram lidos — sem isto, tudo passaria em falso", () => {
    expect(copyDaLanding().length).toBeGreaterThan(5);
  });

  for (const [rotulo, padrao] of PROIBIDOS) {
    it(`nenhum arquivo da Landing promete ${rotulo}`, () => {
      for (const { arquivo, texto } of copyDaLanding()) {
        const achado = texto.match(padrao);
        expect(
          achado?.[0] ?? null,
          `${arquivo} promete ${rotulo}: "${achado?.[0]}". A Landing nunca ` +
            `afirma capacidade que o produto não tem (contrato 34 §6.5).`,
        ).toBeNull();
      }
    });
  }

  /**
   * A seção Concierge é o ponto mais fácil de escorregar: a referência pede a
   * seção, e o produto diz que o Concierge só entra DEPOIS da decisão. Nomear
   * uma pessoa seria pior ainda — não existe identidade persistida de
   * Concierge (GAP-D12-C1), e o produto diz "Equipe Aliviar".
   */
  it("a seção Concierge não promete pessoa designada", () => {
    const secoes = readFileSync(
      path.join(RAIZ, "src/components/landing/editorial/editorial-sections.tsx"),
      "utf8",
    );
    const inicio = secoes.indexOf("PILARES_DO_CONCIERGE");
    const fim = secoes.indexOf("]", secoes.indexOf("] as const", inicio));
    const bloco = secoes.slice(inicio, fim);

    for (const proibido of ["seu Concierge", "sua Concierge", "dedicad", "designad", "à sua disposição"]) {
      expect(bloco, `a copy do Concierge diz "${proibido}"`).not.toContain(proibido);
    }
    expect(
      bloco,
      "o terceiro pilar precisa situar o Concierge DEPOIS da escolha",
    ).toContain("Depois que você escolhe");
  });
});

describe("T-7-5 · o WhatsApp não entra na Landing", () => {
  /**
   * A Track C definiu `Falar com a Aliviar` como canal **da paciente**, nas
   * sete superfícies autenticadas. Na Landing ele viraria suporte a estranho,
   * que é capacidade inexistente — e a porta pública é `Começar`, e só.
   *
   * A guarda olha o TEXTO e a CONSTANTE: importar `whatsappHref` da fonte
   * oficial e usá-lo aqui produziria um `wa.me` sem escrever "wa.me" em lugar
   * nenhum. É a rota que a mutação M-7-4 percorre.
   */
  const SINAIS = ["Falar com a Aliviar", "wa.me", "whatsappHref", "ALIVIAR_WHATSAPP", "WhatsappContact", "ConciergeLink"];

  for (const sinal of SINAIS) {
    it(`"${sinal}" não aparece em components/landing nem em app/(public)`, () => {
      for (const { arquivo, texto } of copyDaLanding()) {
        expect(
          texto,
          `${arquivo} traz "${sinal}". O canal do WhatsApp é da paciente ` +
            `autenticada (Track C §6.7) — na Landing seria suporte a estranho.`,
        ).not.toContain(sinal);
      }
    });
  }
});

describe("T-7-10 · os dois seletores órfãos saíram", () => {
  const CSS = ["src/app/globals.css", "src/app/landing-editorial.css"];

  it.each(CSS)("%s não contém as classes da landing morta", (arquivo) => {
    const fonte = readFileSync(path.join(RAIZ, arquivo), "utf8");
    for (const classe of [".golden-thread-path", ".landing-faq-book"]) {
      expect(fonte, `${arquivo} ainda tem ${classe}`).not.toContain(classe);
    }
  });

  it("a landing editorial continua sendo a única implementação viva", () => {
    const nomes = readdirSync(LANDING);
    for (const morto of ["portal-experience.tsx", "faq-book-section.tsx", "final-cta-section.tsx", "v2"]) {
      expect(nomes, `${morto} voltou`).not.toContain(morto);
    }
    expect(nomes).toContain("editorial");
  });
});
