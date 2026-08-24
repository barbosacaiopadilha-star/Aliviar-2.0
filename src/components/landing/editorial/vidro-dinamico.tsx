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

    // A primeira pintura espera o quadro seguinte: escrever a variável no
    // `style` durante a hidratação fazia o React comparar um atributo que o
    // servidor não tinha e acusar árvore inconsistente (achado de 23/08 na
    // casa da paciente, onde o cartão também é `motion` do framer).
    const primeira = requestAnimationFrame(atualizar);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    return () => {
      cancelAnimationFrame(primeira);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return null;
}
