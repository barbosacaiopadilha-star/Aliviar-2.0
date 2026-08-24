"use client";

import { useEffect } from "react";

/**
 * O EFEITO TRANSLÚCIDO (vocabulário do Fundador, 23/08) — a versão
 * aprovada: o card ENTRA vidro quase incolor e vai CLAREANDO gradualmente,
 * atado à rolagem, até ficar branco na zona de leitura — depois derrete de
 * volta ao sair. Contínuo, simétrico, sem salto.
 *
 * O único conserto que permaneceu do episódio do card grande: a régua é a
 * distância da zona de leitura à BORDA mais próxima do card (não ao centro)
 * — assim um card alto fica branco a travessia INTEIRA da leitura, com a
 * mesma rampa de chegada e saída dos pequenos.
 *
 * Só opacidade anima (barato); roda inclusive com "menos movimento" — é um
 * clarear, não um deslocamento.
 */
export function VidroDinamico() {
  useEffect(() => {
    let agendado = false;

    const atualizar = () => {
      agendado = false;
      // A lista é relida a cada quadro: capturá-la uma vez só deixava de
      // fora qualquer card cujo nó o React tivesse trocado na hidratação —
      // foi assim que o card do Curador ficou sem o efeito (23/08).
      // Duas casas, uma linguagem (decisão do Fundador, 23/08): o efeito
      // deixou de ser da vitrine e passou a ser da marca — a área da
      // paciente é a continuação da Landing, e os cards dela respondem à
      // rolagem do mesmo jeito.
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".landing-editorial .landing-veu, .patient-dashboard .patient-veu",
        ),
      );
      const alturaDaTela = window.innerHeight;
      const centroDaTela = alturaDaTela / 2;
      for (const card of cards) {
        const caixa = card.getBoundingClientRect();
        if (caixa.bottom < -alturaDaTela || caixa.top > alturaDaTela * 2) continue;
        let distancia;
        if (caixa.height >= alturaDaTela * 0.85) {
          // A ÚNICA exceção — card mais alto que a tela: a régua olha a
          // borda mais próxima, para ele ficar branco a leitura inteira
          // (o conserto pontual do card do Curador).
          const abaixo = caixa.top - centroDaTela;
          const acima = centroDaTela - caixa.bottom;
          distancia = Math.max(abaixo, acima, 0) / centroDaTela;
        } else {
          // Todos os demais: EXATAMENTE a versão aprovada pelo Fundador —
          // clareamento pelo centro, linear, simétrico.
          const centroDoCard = (caixa.top + caixa.bottom) / 2;
          distancia = Math.abs(centroDoCard - centroDaTela) / centroDaTela;
        }
        const solidez = Math.max(0, Math.min(1, 1.02 - distancia * 1.02));
        card.style.setProperty("--veu-solidez", solidez.toFixed(3));
      }
    };

    const aoRolar = () => {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(atualizar);
      }
    };

    // QUANDO A PRIMEIRA PINTURA ACONTECE (conserto de 24/08).
    //
    // Esperar um quadro NÃO bastava. A página chega em pedaços: este efeito
    // roda quando o SHELL hidrata, e nesse instante o conteúdo da página já
    // está no HTML mas ainda não foi adotado pelo React. Pintar ali escrevia
    // `--veu-solidez` num nó que o React ia hidratar depois — e ele acusava
    // árvore inconsistente, porque o servidor não mandou esse atributo.
    //
    // Agora a primeira pintura espera a página terminar de carregar e o
    // navegador ficar ocioso. Não é elegância: é a única janela em que dá
    // para garantir que não existe pedaço a caminho.
    let ocioso = 0;
    let quadro = 0;
    const primeiraPintura = () => {
      const agendarOcioso = window.requestIdleCallback
        ? window.requestIdleCallback
        : (fn: () => void) => window.setTimeout(fn, 1);
      ocioso = agendarOcioso(() => {
        quadro = requestAnimationFrame(atualizar);
      }) as unknown as number;
    };

    if (document.readyState === "complete") {
      primeiraPintura();
    } else {
      window.addEventListener("load", primeiraPintura, { once: true });
    }

    // E CARTÃO QUE CHEGA DEPOIS NÃO ESPERA ROLAGEM (a segunda cara do mesmo
    // defeito). Antes, um cartão que aparecesse por streaming ou por
    // navegação client-side ficava sem pintura até alguém rolar — parado em
    // solidez 0, que é o estado MAIS TRANSPARENTE. Sobre a cena noturna,
    // isso é texto sem fundo. O observador repinta assim que a árvore muda.
    const observador = new MutationObserver(aoRolar);
    observador.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("load", primeiraPintura);
      if (ocioso && window.cancelIdleCallback) window.cancelIdleCallback(ocioso);
      else if (ocioso) window.clearTimeout(ocioso);
      if (quadro) cancelAnimationFrame(quadro);
      observador.disconnect();
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return null;
}
