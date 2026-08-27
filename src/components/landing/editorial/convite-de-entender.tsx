import Link from "next/link";

/**
 * O CONVITE DE ENTENDER — a saída de quem não está pronto para conversar.
 *
 * Fica logo abaixo da porta ("Quero conversar com a Aliviar"), e a posição
 * é o desenho: é ali que a hesitação acontece. A pessoa lê a promessa,
 * chega no botão, não se sente pronta — e precisa, naquele exato ponto, de
 * um lugar para entender antes. Sem isso a Landing só oferecia duas saídas:
 * aceitar a conversa, ou ir embora.
 *
 * POR QUE NÃO É MAIS UM LIVRO. A primeira versão desenhava um volume
 * fechado, com lombada e fecho, para render a ideia de "abrir e descobrir".
 * Vista na tela, a capa media 22×28px — nesse tamanho a lombada vira ruído
 * e o que se lê é um retângulo com um ponto. A metáfora não chegava, e um
 * objeto que se anuncia como coisa e não é lido como coisa gasta atenção
 * sem entregar nada.
 *
 * Então ele assume o que é: **um link**. Segunda ação, um degrau abaixo do
 * convite principal — a porta é o botão; isto é a janela. E o nome do
 * arquivo mudou junto: uma classe chamada `livro` que não desenha livro
 * nenhum mente para quem ler o código depois, e esta casa já rejeitou uma
 * palavra hoje pelo mesmo motivo.
 *
 * O SUBLINHADO É PERMANENTE, e isso foi decidido olhando a tela. A versão
 * anterior usava o `link-underline` da fundação, que cresce do zero no
 * hover — e no CELULAR não existe hover. O link virava texto azul claro
 * solto, indistinguível de legenda, para a maioria de quem chega. Agora a
 * linha está sempre lá, a 40%, e o hover a intensifica.
 *
 * MOVIMENTO. A seta desloca 2px quando alguém chega, dizendo a direção, e
 * a linha muda de tom. As duas respondem a interação e passam pelo §230:
 * *movimento existe para explicar de onde algo veio, nunca para chamar
 * atenção*. Nada pulsa, nada se repete sozinho.
 */
export function ConviteDeEntender() {
  return (
    <Link href="/o-que-e" className="landing-convite">
      <span>O que é a Aliviar</span>
      {/* A seta é decorativa: o destino já está dito na palavra ao lado, e
          um leitor de tela não ganha nada ouvindo "seta para a direita". */}
      <span aria-hidden="true" className="landing-convite-seta">
        →
      </span>
    </Link>
  );
}
