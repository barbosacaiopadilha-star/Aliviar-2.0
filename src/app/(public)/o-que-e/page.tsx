import type { Metadata } from "next";

import { LinkButton } from "@/components/landing/link-button";

/**
 * "O QUE É A ALIVIAR" — o degrau que faltava na Fachada.
 *
 * A Landing vai de quatro ambientes fotográficos direto para "Quero
 * conversar com a Aliviar". Quem quer entender antes de topar uma ligação
 * não tinha para onde ir: ou aceitava a conversa, ou ia embora.
 *
 * Esta página é esse degrau, e é ADITIVA de propósito — nenhum dos quatro
 * ambientes é tocado. O Dossiê da Landing Responsiva (23/08) fica intacto;
 * o que entra é uma rota nova ao lado dele, para quem quer detalhe.
 *
 * O CONTEÚDO É O DO GUIA 10 (`docs/guias/10-o-que-e-a-aliviar.html`), e a
 * duplicação é consciente: o guia é o material que a equipe entrega em
 * conversa e imprime; esta é a versão pública. Quando um mudar, o outro
 * muda no mesmo dia — está escrito nos dois.
 *
 * DUAS COISAS QUE ESTA PÁGINA NÃO FAZ, e as duas são regra:
 *
 * 1. Não afirma nada sobre privacidade que o produto ainda não sustente.
 *    A base está adiada por decisão registrada (ADR-096) e a política não
 *    está publicada; dizer "seus dados estão seguros com consentimento"
 *    aqui seria repetir o `faq-compact.tsx:26`, que a auditoria condenou
 *    como afirmação sem lastro. O que se diz é o que é verdade hoje: não
 *    vendemos, e a política está em preparação.
 * 2. Não promete prazo, agendamento nem cobertura. É a ADR-064 — nenhuma
 *    superfície afirma o que o sistema não garante.
 */

export const metadata: Metadata = {
  title: "O que é a Aliviar",
  description:
    "Um médico estuda o seu caso e volta com três caminhos, explicando cada um — e você escolhe. Como funciona, quanto custa, e o que a Aliviar não é.",
};

const PASSOS = [
  {
    titulo: "Você conversa com a gente",
    texto:
      "Conta o que está acontecendo. Nessa primeira conversa a gente explica tudo, inclusive quanto custa — e você decide se faz sentido.",
  },
  {
    titulo: "Você conta sua história com calma",
    texto:
      "Sem pressa, do jeito que sair. É onde entra o que nenhum exame mostra: o que atrapalha o seu dia, o que você já tentou, o que você não quer fazer de jeito nenhum.",
  },
  {
    titulo: "Um médico — o seu Curador — estuda",
    texto:
      "Ele entende seu caso a fundo e depois analisa os profissionais que atendem o que você precisa. Isso leva tempo, e é onde está o trabalho.",
  },
  {
    titulo: "Você recebe três caminhos, numa conversa",
    texto:
      "Não é uma lista de nomes: é por que cada um está ali, o que cada um oferece, e o que cada um custa — em tempo, em deslocamento, em jeito de trabalhar.",
  },
  {
    titulo: "Você escolhe. E a gente continua com você",
    texto:
      "Por um ano, organizando documentos, próximos passos, e respondendo quando aparecer dúvida.",
  },
] as const;

const DIFERENCAS = [
  {
    titulo: "Nenhum médico paga para aparecer aqui",
    texto:
      "Não existe patrocínio, não existe posição comprada, não existe comissão. A gente não recebe nada da sua consulta. É por isso que a gente pode dizer “esse aqui talvez não seja bom para você”.",
  },
  {
    titulo: "Quem analisa é uma pessoa, não um algoritmo",
    texto:
      "Um médico lê o seu caso e assina o que escreveu. Tem nome e responde pelo que disse. Nada é gerado automaticamente.",
  },
  {
    titulo: "A escolha continua sendo sua",
    texto:
      "A gente não indica um. Apresenta três caminhos legítimos e explica cada um — inclusive o lado ruim de cada um. Se o Curador te disser qual escolher, ele estará fazendo o trabalho errado.",
  },
] as const;

const NAO_SOMOS = [
  ["Plano de saúde ou convênio", "A gente não cobre consulta nem procedimento."],
  ["Um site de busca de médicos", "Você não recebe uma lista. Recebe uma análise explicada."],
  ["Substituto do seu médico", "O cuidado clínico é dele. A gente organiza o caminho até ele."],
  [
    "Uma segunda opinião médica",
    "A gente não opina sobre o seu tratamento. A gente ajuda a encontrar quem vai cuidar.",
  ],
] as const;

const DUVIDAS = [
  [
    "Por que eu não procuro sozinho?",
    "Pode, e muita gente faz. A diferença é o que você tem na mão para decidir: sozinho, você compara pelo que está no site de cada um. Aqui, um médico estuda os três e explica em que eles diferem para o seu caso.",
  ],
  [
    "E se eu não gostar de nenhum dos três?",
    "É uma resposta legítima, e não é fracasso de ninguém. Você diz o que não serviu, e isso muda o que a gente procura na próxima rodada.",
  ],
  [
    "Quanto tempo demora?",
    "Depende do seu caso e de quantos profissionais precisam ser analisados. Seu Curador te diz o prazo na primeira conversa. A gente não promete número que não cumpriria.",
  ],
  [
    "Vocês atendem a minha cidade ou a minha especialidade?",
    "Depende. É a primeira coisa que a gente confere na conversa — e a gente prefere dizer que não do que dizer o que você quer ouvir.",
  ],
  [
    "É para a minha mãe, não para mim.",
    "Funciona igual. A diferença é que quem decide no fim é quem vai ser cuidado — a curadoria é montada para ela, com você junto.",
  ],
  [
    "Meus dados ficam seguros?",
    "O que você conta é usado só para o seu atendimento. Nada é vendido, alugado ou usado para propaganda. Nossa política de privacidade está em preparação e será publicada aqui; até lá, qualquer dúvida sobre seus dados a gente responde diretamente.",
  ],
] as const;

export default function OQueEPage() {
  return (
    <article className="mx-auto max-w-reading px-6 py-20 lg:py-28">
      <header>
        <h1 className="landing-heading text-3xl leading-tight lg:text-[2.75rem]">
          O que é a Aliviar
        </h1>
        <p className="landing-body mt-5 text-lg text-[var(--color-ink-muted)]">
          Explicado do começo, sem termo difícil — para quem está só olhando e quer entender antes
          de falar com alguém. Você não precisa decidir nada lendo isto.
        </p>
      </header>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">O problema que a gente resolve</h2>
        <p className="landing-body mt-4 text-[var(--color-ink-muted)]">
          Você, ou alguém que você ama, precisa de um médico. E aí começa a parte que ninguém conta:
          você pergunta para conhecidos, pesquisa na internet e acha listas que parecem propaganda,
          ouve três opiniões diferentes e não sabe em qual confiar. Marca uma consulta, espera três
          semanas, sai de lá com mais dúvida do que entrou. E recomeça.
        </p>
        <p className="landing-body mt-5 text-[var(--color-ink-muted)]">
          A pergunta que fica sem resposta não é{" "}
          <em>“quem é o melhor médico?”</em>. É{" "}
          <strong className="text-ink">
            “qual desses faz sentido para o meu caso, para a minha vida, e para o que eu aguento
            agora?”
          </strong>{" "}
          Nenhuma lista responde isso.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">O que a gente faz, em uma frase</h2>
        <p className="landing-body mt-4 text-lg text-ink">
          Um médico estuda o seu caso e volta com <strong>três caminhos</strong>, explicando cada um
          — e você escolhe.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">Como funciona</h2>
        <ol className="mt-6 space-y-6">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-sm font-medium text-[var(--landing-linen)]"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="landing-heading text-lg">{passo.titulo}</h3>
                <p className="landing-body mt-1 text-[var(--color-ink-muted)]">{passo.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">Três coisas que nos tornam diferentes</h2>
        <div className="mt-6 space-y-8">
          {DIFERENCAS.map((d) => (
            <div key={d.titulo} className="border-t border-[var(--color-border)] pt-5">
              <h3 className="landing-heading text-lg">{d.titulo}</h3>
              <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{d.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">O que a Aliviar não é</h2>
        <dl className="mt-6 space-y-5">
          {NAO_SOMOS.map(([o_que, porque]) => (
            <div key={o_que} className="border-t border-[var(--color-border)] pt-4">
              <dt className="landing-heading text-base">{o_que}</dt>
              <dd className="landing-body mt-1 text-[var(--color-ink-muted)]">{porque}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">Quanto custa</h2>
        <p className="landing-body mt-4 text-lg text-ink">
          <strong>R$ 450 por um ano.</strong>
        </p>
        <p className="landing-body mt-3 text-[var(--color-ink-muted)]">
          Cobre a curadoria inteira, o relatório com os três caminhos, e o acompanhamento durante o
          ano todo — alguém da Aliviar com você para organizar documentos, próximos passos e
          dúvidas. Pode ser parcelado.
        </p>
        <p className="landing-body mt-3 text-[var(--color-ink-muted)]">
          A consulta com o médico que você escolher é <strong>à parte</strong>, paga direto com ele.
          A Aliviar não recebe nada dessa consulta — e é justamente por isso que a gente pode ser
          honesta sobre quem apresentar.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="landing-heading text-2xl">Perguntas que todo mundo faz</h2>
        <dl className="mt-6 space-y-6">
          {DUVIDAS.map(([pergunta, resposta]) => (
            <div key={pergunta} className="border-t border-[var(--color-border)] pt-4">
              <dt className="landing-heading text-base">{pergunta}</dt>
              <dd className="landing-body mt-2 text-[var(--color-ink-muted)]">{resposta}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 border-t border-[var(--color-border)] pt-10">
        <h2 className="landing-heading text-2xl">Se quiser conversar</h2>
        <p className="landing-body mt-4 text-[var(--color-ink-muted)]">
          O primeiro passo é uma conversa, e ela não compromete você a nada. A gente escuta o que
          está acontecendo, explica como funciona, diz quanto custa — e você decide depois, com
          calma.
        </p>
        <div className="mt-8">
          <LinkButton href="/solicitar-atendimento" variant="primary" className="landing-porta">
            Quero conversar com a Aliviar
          </LinkButton>
          <p className="landing-body mt-3 text-sm text-[var(--color-ink-muted)]">
            Sem dados de saúde agora.
          </p>
        </div>
      </section>
    </article>
  );
}
