import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PaginaPublica from "@/app/(public)/page";
import { PublicHeader } from "@/components/landing/public-header";

/**
 * A LANDING RESPONSIVA — provada pela composição real da rota.
 *
 * Histórico das guardas deste arquivo, na ordem em que foram reabertas EM
 * VOZ ALTA (nunca por silêncio): a D-1 protegia Problema, Respiro, FAQ e
 * Convite; o Problema saiu em 22/08; a vitrine enxuta (ADR-081) levou
 * pilares, Prioridades e Concierge; a ADR-082 reorganizou tudo em quatro
 * atos; e o Dossiê da Landing Responsiva (23/08) fez a reforma final —
 * quatro ambientes fotográficos, mobile first, e mais nada.
 *
 * Com o dossiê, **Respiro e FAQ deixam a página**. É a terceira e última
 * reabertura da D-1, decidida pelo Fundador com a consequência dita: as
 * dúvidas de preço e de dados deixam de ser respondidas na vitrine e
 * passam a viver na conversa. As copies seguem congeladas nos componentes.
 */

const RAIZ = process.cwd();
const ler = (relativo: string) => readFileSync(path.join(RAIZ, relativo), "utf8");
const FONTE_DA_ROTA = "src/app/(public)/page.tsx";

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

describe("T-7-1 · os quatro ambientes, e a ordem", () => {
  /** Critério de aceite 1 e 2 do dossiê: exatamente quatro, nesta ordem. */
  const ORDEM = [
    "AmbienteRecepcao",
    "AmbienteCuradoria",
    "AmbienteEscolha",
    "AmbienteConcierge",
  ];

  it("a rota compõe os quatro ambientes, na ordem prescrita", () => {
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

  it("não existe um quinto ambiente fotográfico", () => {
    const { container } = render(<PaginaPublica />);
    expect(container.querySelectorAll("section.landing-ambiente")).toHaveLength(4);
  });

  it("o Fio de Cuidado costura as três passagens, na gramática do dossiê", () => {
    const fonte = ler(FONTE_DA_ROTA);
    for (const forma of ["ramifica", "tres", "converge"]) {
      expect(fonte, `o fio "${forma}" saiu da composição`).toContain(`forma="${forma}"`);
    }
  });
});

describe("T-7-2 · a navegação aponta para ids que existem", () => {
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

describe("T-7-3 · a porta única, e o reconhecimento de quem já mora aqui", () => {
  it("o convite do header leva a /solicitar-atendimento", () => {
    render(<PublicHeader />);
    // O rótulo encolhe para "Começar" no celular (dossiê) — no DOM os dois
    // textos existem e o CSS decide qual aparece.
    const convite = screen.getByRole("link", { name: /Solicitar atendimento/ });
    expect(convite).toHaveAttribute("href", "/solicitar-atendimento");
    expect(convite.textContent).toContain("Começar");
  });

  it("os dois CTAs da página levam à MESMA porta", () => {
    render(<PaginaPublica />);
    const portas = screen.getAllByRole("link", { name: "Quero conversar com a Aliviar" });
    expect(portas.length, "a página precisa dos dois convites").toBe(2);
    for (const porta of portas) {
      expect(porta).toHaveAttribute("href", "/solicitar-atendimento");
    }
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
    expect(screen.getByRole("link", { name: /Solicitar atendimento/ })).toHaveAttribute(
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

describe("T-7-4 · imagens responsivas — o celular baixa só o que usa", () => {
  it("cada ambiente serve mobile e desktop pelo <picture>, com WebP antes do JPEG", () => {
    const { container } = render(<PaginaPublica />);
    const cenas = container.querySelectorAll("picture.landing-cena");
    expect(cenas).toHaveLength(4);

    for (const cena of cenas) {
      const fontes = [...cena.querySelectorAll("source")];
      const desktop = fontes.filter((f) => f.getAttribute("media") === "(min-width: 768px)");
      expect(desktop.length, "faltou a versão de computador").toBe(2);
      expect(desktop[0]!.getAttribute("type")).toBe("image/webp");
      expect(desktop.every((f) => (f.getAttribute("srcSet") ?? "").includes("-desktop."))).toBe(
        true,
      );

      const img = cena.querySelector("img")!;
      expect(img.getAttribute("src"), "o fallback do celular é a versão alta").toContain(
        "-mobile.jpg",
      );
      expect(img.getAttribute("alt"), "a fotografia é decorativa").toBe("");
    }
  });

  it("só a Recepção carrega antecipadamente; as outras três são preguiçosas", () => {
    const { container } = render(<PaginaPublica />);
    const loading = [...container.querySelectorAll("img.landing-cena-img")].map((i) =>
      i.getAttribute("loading"),
    );
    expect(loading).toEqual(["eager", "lazy", "lazy", "lazy"]);
  });
});

describe("T-7-6 · hierarquia de cabeçalhos", () => {
  it("um único h1, e cada ambiente seguinte em h2", () => {
    render(<PaginaPublica />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual([
      "Você não precisa escolher sozinho.",
      "Três caminhos, explicados. A escolha continua sendo sua.",
      "Depois da escolha, continuamos com você.",
    ]);
  });
});

describe("A copy é a do dossiê, palavra por palavra", () => {
  const COPY_EXATA = [
    // Recepção
    "A Aliviar organiza sua escolha:",
    "Escuta você",
    "Analisa especialistas",
    "Apresenta três opções",
    // Curadoria — os três "Sem" viram marcadores, sem mudar as palavras
    "O curador Aliviar escuta a sua história, compreende suas necessidades e avalia cada possibilidade com cuidado e independência.",
    "Sem indicações automáticas.",
    "Sem pressão.",
    "Nenhum médico paga para aparecer aqui.",
    "Apenas uma orientação humana, criteriosa e transparente para ajudar você a encontrar o cuidado certo com segurança e confiança.",
    // Escolha
    "A Aliviar apresenta três opções compatíveis com a sua necessidade e explica os pontos importantes de cada uma. Você decide com clareza, sem pressão e sem favorecimentos.",
    // Concierge
    "Documentos e etapas num lugar só",
    "Alguém da Aliviar para responder",
    "Acompanhamento dos próximos passos",
  ];

  it.each(COPY_EXATA)("está na página: %s", (frase) => {
    render(<PaginaPublica />);
    expect(screen.getByText(frase)).toBeInTheDocument();
  });

  it("o microtexto de segurança acompanha os dois convites", () => {
    render(<PaginaPublica />);
    expect(screen.getAllByText("Sem dados de saúde agora.")).toHaveLength(2);
  });
});

describe("A fronteira do serviço — o Concierge não promete o que a casa não faz", () => {
  /**
   * O dossiê pedia "A Aliviar organiza consultas" e o marcador "Agenda e
   * confirmações". O domínio registra o contrário: *a aproximação
   * intermediada não existe* — nenhum contato é feito pela Aliviar, e a
   * decisão sobre intermediação segue aberta. Esta guarda impede que a
   * promessa volte por descuido.
   */
  const PROIBIDOS = [
    "agenda",
    "agendamos",
    "agendamento",
    "confirmações",
    "organiza consultas",
    "marcamos",
  ];

  it.each(PROIBIDOS)("a página não promete %s", (termo) => {
    const { container } = render(<PaginaPublica />);
    expect((container.textContent ?? "").toLowerCase()).not.toContain(termo.toLowerCase());
  });

  it("nenhuma promessa de resultado clínico ou de escolha feita pela casa", () => {
    const { container } = render(<PaginaPublica />);
    const texto = (container.textContent ?? "").toLowerCase();
    // Palavras inteiras: "cura" mora dentro de "curadoria" e de "procura".
    const PROMESSAS = [/melhor médico/, /garantimos/, /\bcura\b/, /escolhemos por você/];
    for (const promessa of PROMESSAS) {
      expect(promessa.test(texto), `a página diz "${promessa.source}"`).toBe(false);
    }
  });
});

describe("O vídeo da casa — só a pedido, nunca sozinho", () => {
  it("a capa convida com a chamada e a duração real do arquivo", () => {
    render(<PaginaPublica />);
    const gatilho = screen.getByRole("button", { name: /Veja a Aliviar por dentro/ });
    expect(gatilho).toBeInTheDocument();
    // 1 min 20 s é a duração medida do webm; a página já disse "2 min".
    expect(gatilho.textContent).toContain("1 min 20 s");
  });

  it("nenhum player nasce montado na página", () => {
    const { container } = render(<PaginaPublica />);
    expect(container.querySelector("video")).toBeNull();
  });

  it("a capa vive no ambiente da Curadoria, não na Recepção", () => {
    const { container } = render(<PaginaPublica />);
    const ambientes = [...container.querySelectorAll("section.landing-ambiente")];
    expect(ambientes[0]!.querySelector(".landing-video-caixa"), "o vídeo voltou à Recepção").toBeNull();
    expect(ambientes[1]!.querySelector(".landing-video-caixa")).not.toBeNull();
  });
});

/* ==========================================================================
   As copies CONGELADAS — o que saiu da página segue canônico no componente.
   Se algum bloco voltar, volta exatamente assim.
   ========================================================================== */

describe("Dúvidas frequentes fora da página — copy congelada (dossiê, 23/08)", () => {
  const PERGUNTAS = [
    "Não sei por onde começar",
    "A Aliviar substitui um médico?",
    "Meus dados estão seguros?",
    "Quanto custa e como funciona?",
  ];

  it.each(PERGUNTAS)("está no componente: %s", async (pergunta) => {
    const { FaqCompactSection } = await import("@/components/landing/editorial/faq-compact");
    render(<FaqCompactSection />);
    expect(screen.getByText(pergunta)).toBeInTheDocument();
  });
});

describe("Respiro fora da página — copy congelada (dossiê, 23/08)", () => {
  it("o Respiro segue exportado, com o marcador provisório do Fundador", async () => {
    const { RespiroSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<RespiroSection />);
    expect(screen.getByText("Curisco")).toBeInTheDocument();
  });
});

describe("Curador, fatos e limites fora da página — copy congelada", () => {
  it("o card do Curador segue no componente, com os fatos e os limites", async () => {
    const { MetodoSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<MetodoSection />);
    expect(screen.getByText("Você não precisa escolher sozinho.")).toBeInTheDocument();
    expect(screen.getByText("caminhos com nome — nunca um só")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres — prometemos um processo sério.",
      ),
    ).toBeInTheDocument();
  });

  it("os cinco passos da jornada seguem nos componentes (01–03 e 04–05)", async () => {
    const { MetodoSection, EscolhaSection } = await import(
      "@/components/landing/editorial/editorial-sections"
    );

    render(<MetodoSection />);
    for (const passo of ["Você conta sua história", "Vocês definem o que importa", "A equipe analisa"]) {
      expect(screen.getByText(passo)).toBeInTheDocument();
    }
    cleanup();

    render(<EscolhaSection />);
    for (const passo of ["Você recebe três opções", "A decisão é sua"]) {
      expect(screen.getByText(passo)).toBeInTheDocument();
    }
  });
});

describe("Concierge, Prioridades e Pilares fora da página — copy congelada (ADR-081)", () => {
  it("o terceiro pilar do Concierge segue começando por 'Depois que você escolhe'", async () => {
    const { ConciergeSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ConciergeSection />);
    const pilar = screen.getByText(/o caso nunca fica sem alguém respondendo por ele/);
    expect(pilar.textContent?.trim().startsWith("Depois que você escolhe")).toBe(true);
  });

  it("as linhas editoriais e os diferenciais seguem congelados", async () => {
    const { LINHAS_EDITORIAIS, DIFERENCIAIS, FRASE_CUIDAR_CONGELADA } = await import(
      "@/components/landing/editorial/editorial-sections"
    );
    expect([...LINHAS_EDITORIAIS]).toEqual([
      "Curadoria é método.",
      "Concierge é tranquilidade.",
      "Independência é o que torna as duas possíveis.",
      "E a decisão continua sendo sua.",
    ]);
    expect(DIFERENCIAIS[2]).toBe("Sem ranking, sem nota, sem “melhor opção”.");
    expect(FRASE_CUIDAR_CONGELADA).toBe(
      "Cuidar é um caminho. E você não precisa fazer isso sozinho.",
    );
  });
});

describe("Nosso Método e O cenário atual — copy congelada desde 22/08", () => {
  it("os quatro movimentos seguem no componente", async () => {
    const { NossoMetodoSection } = await import(
      "@/components/landing/editorial/editorial-sections"
    );
    render(<NossoMetodoSection />);
    expect(
      screen.getByText(
        "Três, nunca um. Uma indicação única esconde o que foi descartado; três mostram o que cada caminho cobra.",
      ),
    ).toBeInTheDocument();
  });

  it("o cenário atual segue no componente", async () => {
    const { ProblemaSection } = await import("@/components/landing/editorial/editorial-sections");
    render(<ProblemaSection />);
    expect(screen.getByText("Escolher um médico virou um problema de navegação.")).toBeInTheDocument();
  });
});
