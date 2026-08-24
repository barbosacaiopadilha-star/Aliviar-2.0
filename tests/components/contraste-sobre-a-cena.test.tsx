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
 * TEXTO SOLTO SOBRE A FOTOGRAFIA NÃO VOLTA.
 *
 * A 2ª emenda da ADR-085 (24/08) pôs a cena da casa em força total atrás de
 * TODA a área autenticada e decidiu, na mesma frase, que "texto solto sobre a
 * fotografia morreu como recurso: tudo é card ou está dentro de card".
 *
 * A regra foi aplicada ao hero e aos cards do Início — e não às superfícies
 * que já eram "papel" antes da foto existir. O resultado, medido na aba local
 * no celular sobre a cena noturna:
 *
 * - "Precisa de você" (faixa quente a 50%) ................ 1,11:1
 * - a porta para "Seus documentos", em Meus dados ......... 1,53:1
 * - o percurso, em Sua Jornada ............................ 1,62:1
 * - "Sua história está salva pela metade" ................. 2,78:1
 *
 * O mínimo da WCAG AA para texto normal é 4,5:1. Não era calibragem de gosto:
 * era texto ilegível para quem lê no telefone, que é o foco declarado.
 *
 * O que estes oráculos guardam é a REGRA, não a aparência: toda superfície de
 * bloco da casa dela nasce sobre vidro (`patient-veu`), porque é o vidro que
 * cristaliza na zona de leitura e devolve o fundo ao texto. A única exceção
 * legítima é a LINHA discreta da porta do Concierge — para ela, quem responde
 * é o véu de marfim, mais denso no celular.
 */

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

describe("O véu de marfim responde pelo que não é card", () => {
  const CSS = readFileSync("src/app/patient-dashboard.css", "utf8");

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
