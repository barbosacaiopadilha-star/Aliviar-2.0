import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
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
  const ORDEM = [
    "HeroEditorial",
    "ProblemaSection",
    "RespiroSection",
    "NossoMetodoSection",
    "PrioridadesSection",
    "ConciergeSection",
    "MetodoSection",
    "QuemSomosSection",
    "FaqCompactSection",
    "ConviteSection",
  ];

  it("a rota compõe os dez blocos, na ordem prescrita", () => {
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
   * A guarda da D-1. Remover qualquer um destes quatro é reabrir uma decisão
   * fechada — e é a mutação M-7-1.
   */
  it.each(["ProblemaSection", "RespiroSection", "FaqCompactSection", "ConviteSection"])(
    "%s permanece — é a decisão da D-1, e não se reabre",
    (bloco) => {
      expect(ler(FONTE_DA_ROTA)).toContain(`<${bloco}`);
    },
  );

  it("a página monta, e traz o conteúdo das duas seções novas", () => {
    render(<PaginaPublica />);

    expect(screen.getByText("Quatro movimentos, sempre nesta ordem.")).toBeInTheDocument();
    expect(screen.getByText("Você não faz isso sozinha.")).toBeInTheDocument();
    // E o que a D-1 protege continua na tela.
    expect(screen.getByText(/Escolher um médico virou um problema de navegação/)).toBeInTheDocument();
    expect(screen.getByText("Você não precisa decidir sozinho.")).toBeInTheDocument();
  });
});

describe("T-7-2 · cada link do header aponta para um id que existe", () => {
  const ANCORAS = ["quem-somos", "para-quem", "como-funciona", "metodo", "concierge"];

  it("os cinco id existem na página renderizada", () => {
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

    expect(ancoras.length, "o header ficou sem navegação").toBeGreaterThanOrEqual(5);
    for (const href of ancoras) {
      expect(ids, `${href} não corresponde a nenhum id da página`).toContain(href.slice(1));
    }
  });
});

describe("T-7-3 · o convite anônimo, e o reconhecimento de quem já mora aqui", () => {
  it("o header anônimo traz Começar → /sua-historia", () => {
    render(<PublicHeader />);

    const comecar = screen.getByRole("link", { name: "Começar" });
    expect(comecar).toHaveAttribute("href", "/sua-historia");
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
    expect(screen.getByRole("link", { name: "Começar" })).toHaveAttribute("href", "/sua-historia");
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
    expect(h2, "as seções novas precisam ser h2").toEqual(
      expect.arrayContaining(["Quatro movimentos, sempre nesta ordem.", "Você não faz isso sozinha."]),
    );

    const h3 = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(h3, "os pilares precisam ser h3").toEqual(
      expect.arrayContaining(["Consciência", "Contexto", "Análise", "Direção"]),
    );
    expect(h3).toEqual(
      expect.arrayContaining([
        "Organização que simplifica",
        "Navegação com segurança",
        "Acompanhamento que acolhe",
      ]),
    );
  });
});

describe("Bloco 7 · a copy é a do contrato, palavra por palavra", () => {
  const COPY_EXATA = [
    // Nosso Método
    "Entender o que está em jogo antes de decidir qualquer coisa.",
    "Sua história, suas prioridades e o que você não abre mão — nas suas palavras.",
    "Um Curador estuda o seu caso e compara caminhos, pessoa a pessoa.",
    "Três caminhos legítimos, com o que cada um oferece e o que cada um pede.",
    // Concierge
    "Documentos, etapas e informações reunidos num lugar só — você não precisa guardar nada de cabeça.",
    "Quando surge uma dúvida, há alguém da Aliviar para responder. Você nunca fica diante de uma decisão sem ter a quem perguntar.",
    "Depois que você escolhe, a Aliviar continua com você — o caso nunca fica sem alguém respondendo por ele.",
    // Linhas editoriais
    "Curadoria é método.",
    "Concierge é tranquilidade.",
    "Independência é o que torna as duas possíveis.",
    "E a decisão continua sendo sua.",
    // Diferenciais
    "Curadoria médica independente — sem vínculo com operadoras ou hospitais.",
    "Um Curador humano estuda cada caso — nenhum algoritmo escolhe por você.",
    "Sem ranking, sem nota, sem “melhor opção”.",
    "Você decide, e a Aliviar continua com você depois.",
  ];

  it.each(COPY_EXATA)("está na página: %s", (frase) => {
    render(<PaginaPublica />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });

  /**
   * O terceiro pilar do Concierge é a fronteira operacional em forma de frase:
   * até a decisão quem responde é o **Curador**, e o Concierge entra depois.
   * Se esta frase deixar de começar assim, a Landing passa a prometer
   * presença dedicada desde o primeiro dia — que o produto não tem.
   */
  it("o terceiro pilar começa por 'Depois que você escolhe'", () => {
    render(<PaginaPublica />);
    const pilar = screen.getByText(/o caso nunca fica sem alguém respondendo por ele/);
    expect(pilar.textContent?.trim().startsWith("Depois que você escolhe")).toBe(true);
  });

  it("a seção Concierge não nomeia pessoa nem promete contato", () => {
    const { container } = render(<PaginaPublica />);
    const concierge = container.querySelector("#concierge")!;
    const texto = within(concierge as HTMLElement).getByRole("heading", { level: 2 })
      .parentElement!.parentElement!.textContent ?? "";

    for (const proibido of ["seu Concierge", "sua Concierge", "telefone", "WhatsApp", "agendamos"]) {
      expect(texto, `a seção Concierge diz "${proibido}"`).not.toContain(proibido);
    }
  });

  it("a autonomia da paciente é dita, não subentendida", () => {
    render(<PaginaPublica />);
    expect(screen.getByText("E a decisão continua sendo sua.")).toBeInTheDocument();
    expect(screen.getByText(/nenhum algoritmo escolhe por você/)).toBeInTheDocument();
  });
});
