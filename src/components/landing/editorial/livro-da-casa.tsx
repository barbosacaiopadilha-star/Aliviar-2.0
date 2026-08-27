import Link from "next/link";

/**
 * O LIVRO DA CASA — o convite que fica na parede de cima.
 *
 * Ideia do Fundador (27/08): um objeto no alto da Recepção, com a forma dos
 * materiais impressos da Aliviar, que a pessoa abre para descobrir o que a
 * casa é. Ele pousa exatamente no vão que a cena deixa acima das pessoas.
 *
 * O QUE ELE NÃO TENTA SER, e a decisão é deliberada: fotografia. A ideia
 * original era compor o livro NA imagem, na mão da Curadora. Isso é retoque
 * fotográfico e depende da cena ser regerada — sem isso, qualquer objeto
 * desenhado por cima leria como adesivo colado. Então ele assume o que é: um
 * convite em material da casa, na paleta da casa, pousado sobre a cena.
 *
 * MOVIMENTO — a regra que decidiu este desenho. O Sistema Visual §230 é a
 * frase mais enfática do documento: *"movimento existe para explicar de onde
 * algo veio, nunca para chamar atenção"*, e §238 proíbe "qualquer animação
 * que se repita sem interação". Um objeto pulsando sozinho para ser notado
 * está proibido por escrito.
 *
 * O que sobra é melhor para este público: o livro **reage a quem chega**.
 * Ergue-se um fio no hover e no foco, e a sombra desce junto — o gesto de
 * quem levanta algo da mesa. É movimento que explica a natureza do objeto
 * (isto se pega), não que implora atenção. Com quem está com medo, convite
 * funciona melhor que grito.
 *
 * LEGIBILIDADE — a lição do `SIM-61`, aplicada antes de acontecer de novo. O
 * objeto NÃO conta com a fotografia para se ver: tem superfície opaca
 * própria. Se a cena mudar de enquadramento ou escurecer, ele continua
 * legível. Nada de vidro aqui, também: §63 proíbe o material, e o vão da
 * ADR-084 é a casa da pessoa atendida, não a Fachada.
 *
 * O RÓTULO É PERMANENTE, e não some no repouso. O essencial nunca fica
 * escondido atrás de hover (§350, sobre tooltip): um objeto mudo obrigaria a
 * pessoa a adivinhar que ele é clicável, e quem adivinha erra e desiste.
 */
export function LivroDaCasa() {
  return (
    <Link
      href="/o-que-e"
      className="landing-livro"
      aria-label="O que é a Aliviar — abrir e entender como funciona"
    >
      {/* A lombada e o fecho. Decorativo por inteiro: o
          nome acessível vive no `aria-label` acima, e o rótulo visível logo
          abaixo. */}
      <span aria-hidden="true" className="landing-livro-capa">
        <span className="landing-livro-lombada" />
        <span className="landing-livro-fecho" />
      </span>

      <span className="landing-livro-rotulo">
        <span className="landing-livro-titulo">O que é a Aliviar</span>
        <span className="landing-livro-chamada">Abra e entenda</span>
      </span>
    </Link>
  );
}
