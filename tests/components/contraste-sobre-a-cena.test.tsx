import { readFileSync } from "node:fs";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  PatientPageHeader,
  PatientWelcome,
} from "@/components/paciente/dashboard/patient-primitives";
import { ProximaAcao } from "@/components/paciente/experiencia/proxima-acao";
import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { derivePatientPending } from "@/modules/paciente/next-action";

/**
 * A LEITURA SOBRE A CENA — DUAS CAUSAS, DUAS CORREÇÕES.
 *
 * A 2ª emenda da ADR-085 (24/08) pôs a cena da casa em força total atrás de
 * TODA a área autenticada e decidiu, na mesma frase, que "texto solto sobre a
 * fotografia morreu como recurso: tudo é card ou está dentro de card".
 *
 * PRIMEIRA CAUSA — a regra não foi aplicada às superfícies que já eram
 * "papel" antes da foto existir. Medido no celular, sobre a cena noturna:
 *
 * - "Precisa de você" (faixa quente a 50%) ................ 1,11:1
 * - a porta para "Seus documentos", em Meus dados ......... 1,53:1
 * - o percurso, em Sua Jornada ............................ 1,62:1
 * - "Sua história está salva pela metade" ................. 2,78:1
 *
 * SEGUNDA CAUSA, achada pelo Fundador no telefone ("tem algumas quase
 * invisíveis") — o texto DENTRO do card. Aqui o vidro não tinha culpa: com o
 * cartão CRISTALIZADO NO TETO (0,84) e na zona de leitura, a tinta apagada
 * entregava 3,5 a 4,0:1 e a sálvia de marca, 2,07:1. Lá fora essas cores
 * pousam em papel opaco; nesta casa pousam em vidro sobre uma sala escura.
 *
 * O mínimo da WCAG AA para texto normal é 4,5:1. Nenhuma das duas era
 * calibragem de gosto: era texto ilegível para quem lê no telefone.
 *
 * O que estes oráculos guardam é a REGRA, nunca a aparência: superfície de
 * bloco nasce sobre vidro; a tinta desta casa é a legível; e o material que o
 * Fundador calibrou (ADR-084 — "igual à vitrine, piso ZERO") não se mexe.
 */

const CSS = readFileSync("src/app/patient-dashboard.css", "utf8");
const GLOBAIS = readFileSync("src/app/globals.css", "utf8");

/**
 * Um bloco `.patient-dashboard { ... }`, recortado pela chave que FECHA ele —
 * não pela primeira chave que aparecer. Em `globals.css` a regra vive dentro
 * de uma `@layer` e fecha indentada; recortar por `"\n}"` engoliria meio
 * arquivo e faria um `toContain` passar por acidente.
 */
function blocoDaCasa(css: string) {
  const inicio = css.indexOf(".patient-dashboard {");
  if (inicio === -1) return "";
  const indent = css.slice(css.lastIndexOf("\n", inicio) + 1, inicio);
  const fim = css.indexOf(`\n${indent}}`, inicio);
  return css.slice(inicio, fim === -1 ? undefined : fim);
}

/** Os apelidos que a folha de ambiente declara — atmosfera, nunca paleta. */
const CASA = blocoDaCasa(CSS);
/** O escopo que a FUNDAÇÃO abre para esta sala — onde a tinta é decidida. */
const ESCOPO_DA_CASA = blocoDaCasa(GLOBAIS);

afterEach(cleanup);

/** A raiz renderizada carrega o vidro? */
function raizTemVidro(container: HTMLElement) {
  const raiz = container.firstElementChild;
  return {
    tag: raiz?.tagName.toLowerCase(),
    classes: raiz?.className ?? "",
  };
}

describe("A casa da paciente não escreve direto sobre a cena", () => {
  it("o cabeçalho do Início é vidro, não texto solto", () => {
    const { container } = render(<PatientWelcome name="Maria Andrade" subtitle="Boa noite." />);
    const { tag, classes } = raizTemVidro(container);

    expect(tag).toBe("header");
    expect(classes).toContain("patient-card");
    expect(classes).toContain("patient-veu");
  });

  it("o cabeçalho das demais telas também — a cena está atrás de todas", () => {
    const { container } = render(
      <PatientPageHeader title="Seus documentos" description="Tudo o que você enviou." />,
    );
    const { classes } = raizTemVidro(container);

    expect(classes).toContain("patient-card");
    expect(classes).toContain("patient-veu");
  });
});

/* As pendências vêm da projeção real, nunca de literais — mesma disciplina do
   oráculo A3a: se a Fundação mudar, estes testes acompanham em vez de mentir. */
const HISTORIA_EM_PREENCHIMENTO: FatosDoCaso = {
  historia: { existe: true, enviadaEm: null },
  caso: null,
  relatorio: null,
  pendencia: null,
};

const CURADORIA_EM_CURSO: FatosDoCaso = {
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
  relatorio: null,
  pendencia: null,
};

describe("A Próxima Ação é card nos dois estados", () => {
  it("com ato dela: vidro, e o fio de dourado continua distinguindo", () => {
    const pending = derivePatientPending({
      leitura: lerEstado(HISTORIA_EM_PREENCHIMENTO),
      jornada: null,
    });
    if (pending.kind !== "action") throw new Error("fixture deixou de produzir uma ação");

    const { classes } = raizTemVidro(render(<ProximaAcao pending={pending} />).container);

    expect(classes).toContain("patient-card");
    expect(classes).toContain("patient-veu");
    // O dourado não é enfeite: é o que separa "isto depende de você" do resto.
    // Ele mora numa classe própria porque a borda do vidro venceria a
    // utilitária do Tailwind por especificidade.
    expect(classes).toContain("patient-card--acao");
    // A faixa quente a 50% era o que media 1,11:1 sobre a cena noturna.
    expect(classes).not.toContain("bg-[color-mix");
  });

  it("sem ato dela: vidro também, sem fio superior fingindo separar", () => {
    const pending = derivePatientPending({
      leitura: lerEstado(CURADORIA_EM_CURSO),
      jornada: null,
    });
    if (pending.kind !== "nothing") throw new Error("fixture deixou de produzir 'nothing'");

    const { classes } = raizTemVidro(render(<ProximaAcao pending={pending} />).container);

    expect(classes).toContain("patient-veu");
    // Sobre fotografia, borda superior não separa nada — só deixa texto solto.
    expect(classes).not.toContain("border-t");
  });
});

describe("Dentro do card, a tinta desta casa é a legível", () => {
  it("a tinta apagada e a sálvia descem para o degrau legível da escala", () => {
    expect(ESCOPO_DA_CASA).toContain("--color-ink-muted: var(--scale-neutro-700)");
    expect(ESCOPO_DA_CASA).toContain("--color-brand-sage: var(--scale-sage-800)");
  });

  it("a decisão mora na FUNDAÇÃO, não na folha de ambiente", () => {
    // Um ambiente escolhe atmosfera, nunca paleta — é a guarda da paleta
    // única (`paleta-unica.test.ts`), e ela está certa. O que muda aqui não é
    // a paleta: é o SUBSTRATO (vidro sobre cena, em vez de papel opaco).
    expect(CASA).not.toContain("--color-ink-muted:");
    expect(CASA).not.toContain("--color-brand-sage:");
  });

  it("e vale SÓ nesta sala — o padrão da fundação continua de pé", () => {
    // O Curador e o Administrador seguem com a tinta de fora, porque lá não
    // há fotografia atrás do texto.
    expect(GLOBAIS).toContain("--color-ink-muted: var(--scale-neutro-600)");
    expect(GLOBAIS).toContain("--color-brand-sage: var(--scale-sage-500)");
  });

  it("o teto do vidro continua em 0,84 — o material não foi mexido", () => {
    // A correção foi de TINTA. A dinâmica que o Fundador calibrou na ADR-084
    // ("igual à vitrine, piso ZERO") fica exatamente como está.
    expect(CSS).toContain("var(--veu-solidez, 0) * 0.84");
  });
});

describe("O véu de marfim responde pelo que não é card", () => {
  it("no celular o véu ganha corpo na base, e o topo continua respirando", () => {
    const movel = CSS.slice(CSS.indexOf("@media (max-width: 1023px)"));
    const veu = movel.slice(0, movel.indexOf("}", movel.indexOf("linear-gradient")));

    // O topo NÃO muda: é onde a cena precisa aparecer (calibragem do Fundador).
    expect(veu).toContain("34%");
    // A base sobe — é lá que caem as linhas soltas, como a porta do Concierge.
    expect(veu).toContain("74%");
  });

  it("o fio de dourado é aplicado depois da borda do vidro", () => {
    const regra = CSS.indexOf(".patient-card.patient-veu.patient-card--acao");
    const vidro = CSS.indexOf(".patient-dashboard .patient-card.patient-veu,");

    expect(regra).toBeGreaterThan(-1);
    expect(regra).toBeGreaterThan(vidro);
  });
});
