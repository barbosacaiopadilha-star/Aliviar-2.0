import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import {
  AguardandoAtualizacao,
  CaminhosAindaNaoProntos,
  CuradoriaNaoIniciada,
} from "@/components/paciente/experiencia/estados-vazios";
import {
  CartasSkeleton,
  ComparacaoSkeleton,
  HeroSkeleton,
  ProfileSkeleton,
  WalkSkeleton,
} from "@/components/paciente/experiencia/skeletons";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

const CSS = readFileSync(path.resolve(process.cwd(), "src/app/patient-dashboard.css"), "utf8");

/**
 * Desde a consolidação da identidade visual, a casa da paciente não declara
 * mais durações próprias: `--p-motion-*` são apelidos do orçamento de
 * movimento da fundação. Este resolvedor segue o apelido até o valor real em
 * `globals.css`, para que a guarda continue medindo o que sempre mediu — e
 * passe a medir a plataforma inteira, não um arquivo só.
 */
const GLOBALS = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

function resolveDuracaoMs(token: string): number | null {
  const declaracao = CSS.match(new RegExp(`${token}:\\s*([^;]+);`));
  if (!declaracao) return null;
  const bruto = declaracao[1]!.trim();

  const direto = bruto.match(/^(\d+)ms$/);
  if (direto) return Number(direto[1]);

  const referencia = bruto.match(/^var\((--[\w-]+)\)$/);
  if (!referencia) return null;

  const naFundacao = GLOBALS.match(new RegExp(`${referencia[1]}:\\s*(\\d+)ms`));
  return naFundacao ? Number(naFundacao[1]) : null;
}

describe("Hero vivo — saudação e contexto", () => {
  it("usa a saudação do horário quando ela existe", () => {
    render(
      <AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" greeting="Boa noite" />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Boa noite, João.");
  });

  it("sem saudação, continua íntegro — nunca fica pela metade", () => {
    render(<AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Olá, João.");
  });
});

describe("Estados vazios — acolhimento, nunca erro", () => {
  const casos = [
    { nome: "Curadoria não iniciada", ui: <CuradoriaNaoIniciada curatorName="Dra. Ana" /> },
    { nome: "Aguardando atualização", ui: <AguardandoAtualizacao /> },
    { nome: "Caminhos ainda não prontos", ui: <CaminhosAindaNaoProntos /> },
    // CORTE DE 23/08 · ComparacaoNaoIniciada saiu: a comparação deixou de
    // ter estado vazio porque deixou de ter gesto.
  ];

  it.each(casos)("$nome explica o que acontece e o que vem depois", ({ ui }) => {
    const { container } = render(ui);
    const texto = container.textContent ?? "";

    expect(texto.length).toBeGreaterThan(60);
    // Nada de linguagem de falha.
    for (const proibido of ["erro", "falha", "indisponível", "não encontrado", "vazio"]) {
      expect(texto.toLowerCase(), `linguagem de erro: ${proibido}`).not.toContain(proibido);
    }
    expect(violatesPatientVocabulary(texto)).toBeNull();
  });

  it("nenhum estado vazio cobra a pessoa com contagem do que falta", () => {
    const { container } = render(<CaminhosAindaNaoProntos />);
    expect(container.textContent).not.toMatch(/faltam?\s+\d|\d\s+de\s+3/i);
  });

  // CORTE DE 23/08 · "a comparação vazia diz que comparar é opcional" saiu
  // com a ComparacaoNaoIniciada: não existe mais comparação vazia.
});

describe("Skeletons — a forma do que vem", () => {
  const skeletons = [
    { nome: "Hero", ui: <HeroSkeleton />, rotulo: "Carregando sua jornada" },
    { nome: "Jornada", ui: <WalkSkeleton />, rotulo: "Carregando as etapas" },
    { nome: "Perfil", ui: <ProfileSkeleton />, rotulo: "Carregando seu Perfil" },
    { nome: "Cartas", ui: <CartasSkeleton />, rotulo: "Carregando seus caminhos" },
    { nome: "Comparação", ui: <ComparacaoSkeleton />, rotulo: "Carregando a comparação" },
  ];

  it.each(skeletons)("$nome anuncia carregamento uma vez, não caixa por caixa", ({ ui, rotulo }) => {
    render(ui);
    const regiao = screen.getByLabelText(rotulo);
    expect(regiao).toHaveAttribute("aria-busy", "true");
    // As caixas em si são invisíveis ao leitor de tela.
    const blocos = regiao.querySelectorAll(".p-skeleton");
    expect(blocos.length).toBeGreaterThan(0);
    for (const bloco of blocos) {
      expect(bloco).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("as cartas em carregamento têm a mesma forma das cartas reais", () => {
    const { container } = render(<CartasSkeleton />);
    expect(container.querySelector(".patient-cartas")).toBeTruthy();
    expect(container.querySelectorAll(".patient-carta")).toHaveLength(3);
  });
});

describe("Motion budget — calma, nunca espetáculo", () => {
  it("interação responde em até 250ms", () => {
    const interacao = resolveDuracaoMs("--p-motion-interaction");
    expect(interacao, "token de interação ausente ou não resolvível").not.toBeNull();
    expect(interacao!).toBeLessThanOrEqual(250);
  });

  it("nada elástico: sem bounce, sem overshoot", () => {
    // Curvas com overshoot têm o segundo ou quarto parâmetro fora de [0,1].
    const curvas = CSS.match(/cubic-bezier\([^)]+\)/g) ?? [];
    for (const curva of curvas) {
      const valores = curva.replace(/cubic-bezier\(|\)/g, "").split(",").map(Number);
      expect(valores[1], `overshoot em ${curva}`).toBeLessThanOrEqual(1);
      expect(valores[3], `overshoot em ${curva}`).toBeLessThanOrEqual(1.05);
    }
    expect(CSS).not.toMatch(/animation-timing-function:\s*(bounce|elastic)/);
  });

  it("o ambiente respira devagar — lento a ponto de não ser percebido", () => {
    const ambiente = CSS.match(/--p-motion-ambient:\s*(\d+)s/);
    expect(ambiente).toBeTruthy();
    expect(Number(ambiente![1])).toBeGreaterThanOrEqual(10);
  });

  it("poucas animações ambientais simultâneas — elas não competem por atenção", () => {
    const infinitas = CSS.match(/animation:[^;]*infinite/g) ?? [];
    // Respiração da cena, pulso da etapa atual e shimmer do skeleton. Mais que
    // isso e a tela deixa de parecer calma.
    expect(infinitas.length).toBeLessThanOrEqual(3);
  });
});

describe("Motion reduzido — a informação continua inteira", () => {
  it("cena, pulso e shimmer param", () => {
    const bloco = CSS.slice(CSS.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(bloco).toContain("patient-hero__scene");
    expect(bloco).toContain("patient-walk__step--current .patient-walk__dot");
    expect(bloco).toContain("p-skeleton");
    expect(bloco).toContain("animation: none");
  });

  it("a elevação no hover da carta também para", () => {
    const bloco = CSS.slice(CSS.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(bloco).toMatch(/patient-carta:hover\s*\{\s*transform:\s*none/);
  });
});

describe("Design tokens — uma linguagem só", () => {
  it("elevação tem exatamente três degraus", () => {
    expect(CSS).toContain("--p-elev-1");
    expect(CSS).toContain("--p-elev-2");
    expect(CSS).toContain("--p-elev-3");
    expect(CSS).not.toContain("--p-elev-4");
  });

  it("as três velocidades de leitura existem", () => {
    for (const classe of ["p-read-fast", "p-read-mid", "p-read-deep"]) {
      expect(CSS, classe).toContain(classe);
    }
  });

  it("a leitura profunda tem largura de linha confortável", () => {
    const deep = CSS.slice(CSS.indexOf(".p-read-deep"));
    expect(deep).toMatch(/max-width:\s*6\dch/);
  });
});
