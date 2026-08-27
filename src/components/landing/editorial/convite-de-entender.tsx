import Image from "next/image";

import { LinkButton } from "@/components/landing/link-button";

/**
 * O CONVITE DE ENTENDER — a saída de quem não está pronto para conversar.
 *
 * Fica logo abaixo da porta ("Quero conversar com a Aliviar"), e a posição
 * é o desenho: é ali que a hesitação acontece. A pessoa lê a promessa,
 * chega no botão, não se sente pronta — e precisa, naquele exato ponto, de
 * um lugar para entender antes. Sem isso a Landing só oferecia duas saídas:
 * aceitar a conversa, ou ir embora.
 *
 * TRÊS VERSÕES ATÉ AQUI, e cada uma morreu de um jeito diferente na tela:
 *
 * 1 · Um LIVRO desenhado, com lombada e fecho, para render "abrir e
 *     descobrir". Na tela a capa media 22×28px: lombada virava ruído e o
 *     fecho virava um ponto. Lia-se um retângulo azul, nunca um volume.
 * 2 · Um LINK puro, sem caixa. Sumiu — e pior no celular, onde não existe
 *     hover e o sublinhado da fundação (que cresce do zero) nunca aparecia.
 *     Virava texto azul solto, indistinguível de legenda.
 * 3 · Esta: o BOTÃO SECUNDÁRIO da casa. Nem armadura nem sombra de si.
 *
 * POR QUE O `secondary` E NÃO UM DESENHO NOVO. Ele já é exatamente o que se
 * pedia de acabamento: fundo transparente, fio DOURADO na borda, e no hover
 * a borda acende com um véu de 7% de ouro, junto do erguer de meio pixel que
 * todos os botões da casa têm. Inventar outro botão sofisticado ao lado de
 * um botão sofisticado que já existe é como a casa acumula dialetos.
 *
 * A HIERARQUIA É O PONTO. O primário é sólido, azul, largura cheia: a porta.
 * Este é vazado, dourado, largura do conteúdo: a janela. Se os dois tivessem
 * o mesmo peso, seriam duas portas — e duas portas é nenhuma.
 *
 * O SÍMBOLO ENTRA PEQUENO, A 20px, e é decisão, não descuido. Ele já está no
 * cabeçalho, uns 200px acima: em tamanho de assinatura, seria a marca duas
 * vezes na mesma tela — o "papel de parede corporativo" que o `SIM-41`
 * registrou como a coisa a evitar. Pequeno, ele lê como detalhe de
 * acabamento, que é o papel que tem aqui. `alt` vazio porque o texto ao lado
 * já diz tudo: um leitor de tela não ganha nada ouvindo a marca duas vezes.
 */
export function ConviteDeEntender() {
  return (
    <LinkButton
      href="/o-que-e"
      variant="secondary"
      className="mt-4 w-auto self-start px-6"
    >
      <Image
        src="/brand/aliviar-simbolo.png"
        alt=""
        width={256}
        height={266}
        className="h-5 w-auto"
      />
      O que é a Aliviar
    </LinkButton>
  );
}
