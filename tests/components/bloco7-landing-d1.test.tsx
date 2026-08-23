import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PaginaPublica from "@/app/(public)/page";
import { PublicHeader } from "@/components/landing/public-header";

/**
 * BLOCO 7 / D-1 · a Landing, provada pela composição real da rota.
 *
 * **D-1 foi resolvida como "a referência é a espinha visual".** A prova não é
 * um parecer: é o que a Track D FEZ — apagou 23 arquivos de landing e, no
 * mesmo contrato, blindou `landing/editorial/**` por escrito. Quem quisesse a
 * página mais curta tinha ali o momento.
 *
 * Consequência vinculante, e é o que T-7-1 guarda: `ProblemaSection`,
 * `RespiroSection`, `FaqCompactSection` e `ConviteSection` **não podem sair**.
 */

const RAIZ = process.cwd();
const ler = (relativo: string) => readFileSync(path.join(RAIZ, relativo), "utf8");
const FONTE_DA_ROTA = "src/app/(public)/page.tsx";

/** `RevealGroup` pergunta ao navegador por `prefers-reduced-motion`. */
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe("T-7-1 · os blocos, e a ordem", () => {
  /**
   * A ordem do contrato 34 §6, já reconciliada com a landing viva: o que a
   * referência chama de "Como funciona" é a seção densa das cinco etapas que
   * a página **já tinha** (antes com eyebrow "O Método"), e "Nosso Método"
   * — os quatro movimentos — é seção nova. Sem essa reconciliação, dois
   * eyebrows diriam "Método" na mesma página.
   */
  /**
   * Ordem decidida pelo Fundador em 22/08 (fidelidade ao mockup dele) e
   * ENXUGADA por ele em 23/08 (ADR-081, "pode cortar!"): a operação é
   * simples, e a página repetia as mesmas quatro ideias 4–5 vezes. Saíram
   * da composição — copy congelada nos componentes, describes ao final:
   * ConfiancaStripSection, PrioridadesSection e ConciergeSection.
   * Uma ideia por bloco, dentro dos 4 capítulos do Edifício (ADR-080).
   */
  // Auditoria de fusão F1 (23/08): QuemSomosSection saiu da rota — a sala
  // verde virou o card floresta que FECHA o "Como funciona" (a âncora
  // #quem-somos e a copy seguem na página, dentro do MetodoSection).
  // ADR-082 (23/08, roteiro do Fundador): quatro atos — Recepção (hero +
  // vídeo de apresentação), Curadoria (manifesto + Curador + passos 01–03),
  // Escolha (passos 04–05) e Concierge (dúvidas + convite).
  // Ordem expressa do Fundador (23/08): o vídeo de apresentação abre a
  // Recepção, ACIMA do Capítulo Zero.
  const ORDEM = [
    "VideoSection",
    "HeroEditorial",
    "MetodoSection",
    "EscolhaSection",
    "RespiroSection",
    "FaqCompactSection",
    "ConviteSection",
  ];

  it("a rota compõe os sete blocos dos quatro atos, na ordem prescrita", () => {
    const fonte = ler(FONTE_DA_ROTA);
    const posicoes = ORDEM.map((bloco) => ({ bloco, at: fonte.indexOf(`<${bloco}`) }));

    for (const { bloco, at } of posicoes) {
      expect(at, `${bloco} não está na composição da rota`).toBeGreaterThan(-1);
    }
    for (let i = 1; i < posicoes.length; i += 1) {
      expect(
        posicoes[i]!.at,
        `${posicoes[i]!.bloco} veio antes de ${posicoes[i - 1]!.bloco}`,
      ).toBeGreaterThan(posicoes[i - 1]!.at);
    }
  });

  /**
   * A guarda da D-1 — REABERTA EM VOZ ALTA para uma das quatro:
   * `ProblemaSection` ("O cenário atual") saiu por decisão direta do
   * Fundador em 22/08, exatamente pelo rito que esta guarda existia para
   * forçar. A copy dela segue congelada no componente (describe ao final).
   * As três restantes continuam intocáveis sem novo rito.
   */
  it.each(["RespiroSection", "FaqCompactSection", "ConviteSection"])(
    "%s permanece — é a decisão da D-1, e não se reabre",
    (bloco) => {
      expect(ler(FONTE_DA_ROTA)).toContain(`<${bloco}`);
    },
  );

  it("a página monta, e traz o conteúdo protegido", () => {
    render(<PaginaPublica />);

    // Depois da ADR-082, o que segue protegido na tela é o Respiro (D-1) e
    // a apresentação do Curador (copy do Fundador) — afirmado aqui.
    // O Respiro carrega o MARCADOR PROVISÓRIO do Fundador ("Curisco" —
    // brincadeira pré-lançamento, ele troca depois); quando a frase
    // canônica voltar, este oráculo volta junto.
    expect(screen.getByText("Curisco")).toBeInTheDocument();
    expect(screen.getByText("Você não precisa escolher sozinho.")).toBeInTheDocument();
  });
});

describe("T-7-2 · cada link do header aponta para um id que existe", () => {
  // ADR-081: "Para quem é" e "Concierge" saíram do menu junto com as seções.
  const ANCORAS = ["como-funciona", "quem-somos"];

  it("os id existem na página renderizada", () => {
    const { container } = render(<PaginaPublica />);
    for (const id of ANCORAS) {
      expect(container.querySelector(`#${id}`), `o id #${id} não existe`).not.toBeNull();
    }
  });

  it("nenhum link do header é morto — todo href tem destino", () => {
    const { container: pagina } = render(<PaginaPublica />);
    const ids = new Set([...pagina.querySelectorAll("[id]")].map((e) => e.id));
    cleanup();

    render(<PublicHeader />);
    const ancoras = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("#"));

    expect(ancoras.length, "o header ficou sem navegação").toBeGreaterThanOrEqual(2);
    for (const href of ancoras) {
      expect(ids, `${href} não corresponde a nenhum id da página`).toContain(href.slice(1));
    }
  });
});

describe("T-7-3 · o convite anônimo, e o reconhecimento de quem já mora aqui", () => {
  // OPS-R3A1 · o convite anônimo continua sendo o que o Bloco 7 protegeu — o
  // que mudou foi PARA ONDE ele leva. `Começar` apontava para `/sua-historia`,
  // que exige conta: quem chegava sem conta batia em porta trancada. O destino
  // público passou a ser `/solicitar-atendimento`. A regra do Bloco 7 (o
  // header anônimo convida, e o portalCta autenticado não é tocado) segue
  // intacta e é ela que estas asserções continuam guardando.
  it("o header anônimo traz Solicitar atendimento → /solicitar-atendimento", () => {
    render(<PublicHeader />);

    const comecar = screen.getByRole("link", { name: "Solicitar atendimento" });
    expect(comecar).toHaveAttribute("href", "/solicitar-atendimento");
  });

  it("Entrar sobrevive, e é outro gesto — nunca o convite", () => {
    render(<PublicHeader />);

    const entrar = screen.getAllByRole("link", { name: "Entrar" });
    expect(entrar.length, "Entrar sumiu do header").toBeGreaterThanOrEqual(1);
    for (const link of entrar) expect(link).toHaveAttribute("href", "/login");
  });

  it("o portalCta autenticado permanece intacto, e Entrar dá lugar a ele", () => {
    render(<PublicHeader portalCta={{ href: "/paciente", label: "Minha Jornada" }} />);

    expect(screen.getAllByRole("link", { name: "Minha Jornada" })[0]).toHaveAttribute(
      "href",
      "/paciente",
    );
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    // E o convite continua lá: quem já entrou também pode começar uma história.
    expect(screen.getByRole("link", { name: "Solicitar atendimento" })).toHaveAttribute(
      "href",
      "/solicitar-atendimento",
    );
  });

  it("nenhum CTA aponta para placeholder", () => {
    render(<PublicHeader />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      expect(["#", "", "https://example.com"], `href placeholder: ${href}`).not.toContain(href);
    }
  });
});

describe("T-7-6 · hierarquia de cabeçalhos", () => {
  it("um único h1, seções em h2 e pilares em h3", () => {
    render(<PaginaPublica />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    // ADR-082: a apresentação do Curador é a sentinela dos h2.
    expect(h2, "as seções precisam ser h2").toEqual(
      expect.arrayContaining(["Você não precisa escolher sozinho."]),
    );

    const h3 = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(h3).toEqual(
      expect.arrayContaining([
        "Você conta sua história",
        "Vocês definem o que importa",
        "A decisão é sua",
      ]),
    );
  });
});

describe("Bloco 7 · a copy é a do contrato, palavra por palavra", () => {
  const COPY_EXATA = [
    // 2ª passada da ADR-081 (23/08): linhas editoriais e diferenciais
    // SAÍRAM da tela (repetiam os fatos dentro da própria sala verde) —
    // congelados nas constantes exportadas, describe ao final. O que a
    // página PROVA agora: os fatos e o "o que não fazemos".
    "caminhos com nome — nunca um só",
    "dimensões do Método, lidas por gente",
    "Curador com nome respondendo pelo seu caso",
    "algoritmos decidindo por você",
    "Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres — prometemos um processo sério.",
  ];

  it.each(COPY_EXATA)("está na página: %s", (frase) => {
    render(<PaginaPublica />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });

  it("a autonomia da paciente é dita, não subentendida", () => {
    render(<PaginaPublica />);
    // A autonomia continua DITA na tela: o passo 5 da jornada e o fato do
    // zero algoritmo — mesmo depois do corte das linhas editoriais.
    expect(screen.getByText("A decisão é sua")).toBeInTheDocument();
    expect(screen.getByText(/algoritmos decidindo por você/)).toBeInTheDocument();
  });
});

describe("Sala verde enxuta — linhas e diferenciais congelados fora da tela (ADR-081, 2ª passada)", () => {
  it("as quatro linhas editoriais seguem congeladas, palavra por palavra", async () => {
    const { LINHAS_EDITORIAIS } = await import("@/components/landing/editorial/editorial-sections");
    expect([...LINHAS_EDITORIAIS]).toEqual([
      "Curadoria é método.",
      "Concierge é tranquilidade.",
      "Independência é o que torna as duas possíveis.",
      "E a decisão continua sendo sua.",
    ]);
  });

  it("os quatro diferenciais seguem congelados, palavra por palavra", async () => {
    const { DIFERENCIAIS } = await import("@/components/landing/editorial/editorial-sections");
    expect([...DIFERENCIAIS]).toEqual([
      "Curadoria médica independente — sem vínculo com operadoras ou hospitais.",
      "Um Curador humano estuda cada caso — nenhum algoritmo escolhe por você.",
      "Sem ranking, sem nota, sem “melhor opção”.",
      "Você decide, e a Aliviar continua com você depois.",
    ]);
  });

  it("a frase de abertura do convite segue congelada", async () => {
    const { FRASE_CUIDAR_CONGELADA } = await import(
      "@/components/landing/editorial/editorial-sections"
    );
    expect(FRASE_CUIDAR_CONGELADA).toBe(
      "Cuidar é um caminho. E você não precisa fazer isso sozinho.",
    );
  });
});

describe("Concierge fora da página — a copy segue congelada no componente (ADR-081)", () => {
  // O corte da vitrine enxuta (23/08): a sala verde já carrega "Concierge é
  // tranquilidade". Se a seção voltar, volta com ESTA copy — e o terceiro
  // pilar continua começando por "Depois que você escolhe": é a fronteira
  // operacional (§4.1) em forma de frase.
  const PILARES_CONCIERGE = [
    "Documentos, etapas e informações reunidos num lugar só — você não precisa guardar nada de cabeça.",
    "Quando surge uma dúvida, há alguém da Aliviar para responder. Você nunca fica diante de uma decisão sem ter a quem perguntar.",
    "Depois que você escolhe, a Aliviar continua com você — o caso nunca fica sem alguém respondendo por ele.",
  ];

  it.each(PILARES_CONCIERGE)("está no componente: %s", async (frase) => {
    const { ConciergeSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ConciergeSection />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });

  it("o terceiro pilar segue começando por 'Depois que você escolhe'", async () => {
    const { ConciergeSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ConciergeSection />);
    const pilar = screen.getByText(/o caso nunca fica sem alguém respondendo por ele/);
    expect(pilar.textContent?.trim().startsWith("Depois que você escolhe")).toBe(true);
  });

  it("o componente não nomeia pessoa nem promete contato", async () => {
    const { ConciergeSection } = await import("@/components/landing/editorial/editorial-sections");
    const { container } = render(<ConciergeSection />);
    const texto = container.textContent ?? "";
    for (const proibido of ["seu Concierge", "sua Concierge", "telefone", "WhatsApp", "agendamos"]) {
      expect(texto, `o Concierge diz "${proibido}"`).not.toContain(proibido);
    }
  });
});

describe("Prioridades fora da página — a copy segue congelada no componente (ADR-081)", () => {
  const PRIORIDADES_COPY = [
    "Suas prioridades, nas suas palavras.",
    "“Não quero recomeçar do zero.”",
    "Quem está cuidando, em que ponto está e quando terá notícia. Sempre com nome e data.",
  ];

  it.each(PRIORIDADES_COPY)("está no componente: %s", async (frase) => {
    const { PrioridadesSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<PrioridadesSection />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });
});

describe("Pilares de confiança fora da página — a copy segue congelada no componente (ADR-081)", () => {
  const PILARES = [
    "Sem vínculos com operadoras ou hospitais.",
    "Médicos aprovados pelo nosso rigor, lidos à luz do seu caso.",
    "Antes, durante e depois. Uma pessoa ao seu lado.",
  ];

  it.each(PILARES)("está no componente: %s", async (frase) => {
    const { ConfiancaStripSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ConfiancaStripSection />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });
});

describe("Nosso Método fora da página — a copy segue congelada no componente", () => {
  // Os quatro movimentos saíram da página por decisão do Fundador (22/08),
  // mas a reescrita de 20/08 (POR QUE, nunca o que acontece) continua sendo
  // a versão canônica. Se a seção um dia voltar, volta com ESTA copy — e a
  // antiga, que descrevia etapas, continua sendo o que não pode voltar.
  const MOVIMENTOS = [
    "Ninguém escolhe bem o que ainda não entendeu. Antes de qualquer nome, o que está em jogo precisa ficar claro.",
    "Não existe bom médico em abstrato — existe o certo para uma vida concreta. Por isso o critério vem de você, antes da busca.",
    "Comparar exige uma pessoa lendo, não um filtro. Quem compara assume o que escolheu, com nome.",
    "Três, nunca um. Uma indicação única esconde o que foi descartado; três mostram o que cada caminho cobra.",
  ];

  it.each(MOVIMENTOS)("está no componente: %s", async (frase) => {
    const { NossoMetodoSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<NossoMetodoSection />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });
});

describe("O cenário atual fora da página — a copy segue congelada no componente", () => {
  // D-1 reaberta em voz alta pelo Fundador (22/08): a seção sai da página,
  // mas a copy permanece canônica no componente para um eventual retorno.
  const CENARIO = [
    "Escolher um médico virou um problema de navegação.",
    "Existem bons médicos e informação de sobra. O que falta é alguém do seu lado na hora de decidir.",
    "Listas e anúncios não dizem o que importa para a sua situação.",
    "Medo e pressa são maus conselheiros. E é exatamente aí que a decisão é exigida.",
  ];

  it.each(CENARIO)("está no componente: %s", async (frase) => {
    const { ProblemaSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ProblemaSection />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });
});
