import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicationPanel } from "@/components/profiles/publication-panel";
import type { PublicationPendency } from "@/modules/profiles/publication-pendencies";

// O painel passou a chamar `useRouter()` quando a publicação trocou o reload
// de página inteira por `router.refresh()` — e este arquivo, que renderiza o
// componente fora do App Router, quebrou inteiro sem que nada de C7 tivesse
// mudado. O mock existe só para montar; nenhum teste daqui afirma navegação.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

/**
 * OPS-G5 · CORTE 7 — a porta de publicação, do lado de quem opera.
 *
 * Um botão que aceita o clique e depois explica que não podia é um botão que
 * mente. Estes testes medem o atributo real do elemento — `disabled` —, não a
 * aparência dele, e checam que o motivo está ANUNCIADO, não apenas desenhado na
 * tela: um leitor de tela precisa ouvir por que o ato está indisponível.
 */

const PENDENCIA: PublicationPendency = {
  code: "REGISTRO_NAO_VERIFICADO",
  label: "Registro no conselho ainda não verificado",
  howToFix: "Verifique a situação do registro no conselho antes de publicar.",
};

const OUTRA: PublicationPendency = {
  code: "AREA_DE_ATUACAO_AUSENTE",
  label: "Área de atuação ausente",
  howToFix: "Registre a área de atuação e verifique-a.",
};

const NADA = async () => ({ success: true }) as const;

function montar(sobre: { isPublished: boolean; pendencies: PublicationPendency[] }) {
  render(
    <PublicationPanel
      isPublished={sobre.isPublished}
      pendencies={sobre.pendencies}
      registration={{ status: null, source: null, verifiedAt: null }}
      practiceArea={null}
      mapaAviso={null}
      verifyRegistrationAction={NADA}
      savePracticeAreaAction={NADA}
      publishAction={NADA}
    />,
  );
}

// `/publicar/i` casaria também com "Despublicar": a âncora importa.
const botaoPublicar = () => screen.getByRole("button", { name: /^publicar$/i });

afterEach(cleanup);

describe("C7 · publicar com pendência não é oferecido", () => {
  it("o botão está realmente indisponível, não apenas apagado", () => {
    montar({ isPublished: false, pendencies: [PENDENCIA] });
    expect(botaoPublicar()).toBeDisabled();
  });

  it("o motivo é anunciado, não só desenhado", () => {
    montar({ isPublished: false, pendencies: [PENDENCIA] });
    const descrito = botaoPublicar().getAttribute("aria-describedby");
    expect(descrito, "o botão está mudo sobre o próprio bloqueio").toBe("pendencias-de-publicacao");

    const anuncio = document.getElementById(descrito!);
    expect(anuncio, "o alvo do anúncio não existe na página").not.toBeNull();
    expect(anuncio!.textContent).toContain(PENDENCIA.label);
    expect(anuncio!.textContent, "não disse como corrigir").toContain(PENDENCIA.howToFix);
  });

  it("a contagem que a pessoa lê é a real, no singular e no plural", () => {
    montar({ isPublished: false, pendencies: [PENDENCIA] });
    expect(screen.getByText(/Falta uma condição para publicar/)).toBeInTheDocument();

    screen.getByText(/Pendências para publicação \(1\)/);
  });

  it("com duas pendências, o texto acompanha", () => {
    montar({ isPublished: false, pendencies: [PENDENCIA, OUTRA] });
    expect(screen.getByText(/Faltam 2 condições para publicar/)).toBeInTheDocument();
  });
});

describe("C7 · o bloqueio não vaza para onde não deve", () => {
  it("sem pendência, publicar está disponível", () => {
    montar({ isPublished: false, pendencies: [] });
    expect(botaoPublicar()).toBeEnabled();
    expect(botaoPublicar().getAttribute("aria-describedby")).toBeNull();
  });

  it("despublicar nunca é bloqueado — tirar da vitrine é sempre possível", () => {
    // Mesmo com pendência: um cadastro publicado que se tornou irregular PRECISA
    // poder sair. Bloquear a saída seria prender na vitrine quem não deve estar
    // nela — exatamente o contrário do que a porta protege.
    montar({ isPublished: true, pendencies: [PENDENCIA, OUTRA] });
    expect(screen.getByRole("button", { name: /^despublicar$/i })).toBeEnabled();
  });
});
