import { existsSync } from "node:fs";
import path from "node:path";

import { CenaResponsiva } from "@/components/landing/editorial/cena-responsiva";
import { VideoDaCasa } from "@/components/landing/editorial/video-da-casa";
import { LinkButton } from "@/components/landing/link-button";

/**
 * OS QUATRO AMBIENTES (Dossiê da Landing Responsiva, decisão do Fundador,
 * 23/08). A narrativa tem exatamente quatro seções fotográficas —
 * Recepção, Curadoria, Escolha médica e Concierge — e nenhuma quinta.
 *
 * A copy é a do dossiê, palavra por palavra, com TRÊS exceções lavradas.
 *
 * 1 · O Card 4 dizia "A Aliviar organiza consultas" e "Agenda e
 * confirmações". O domínio da casa registra o contrário — *"a aproximação
 * intermediada não existe"*: nenhum contato é feito pela Aliviar, e a
 * decisão sobre intermediação segue aberta. Prometer agenda seria vender o
 * que não há (contrato 34 §4.1; guarda automática proíbe "agendamos" no
 * Concierge). O card fala do que a casa faz de verdade: organizar
 * documentos e etapas, responder dúvidas e acompanhar.
 *
 * 2 · O Card 3 dizia "Três médicos selecionados" — e o objeto da Curadoria
 * não é o médico. O `MANUAL_CURADOR.md` é literal: *"o propósito não é
 * encontrar 'o melhor médico'. É identificar três caminhos de cuidado...
 * o objeto do seu trabalho é o caminho de cuidado; o médico é quem o
 * materializa"*. "Caminho" está no vocabulário canônico do
 * `LANDING_UX_WRITING.md` §190, e "três médicos" já constava do
 * `DOMAIN_RELATIONSHIP_SPECIFICATION.md` como termo sem base no domínio.
 * A troca corrige uma expectativa que a Landing criava e o Curador tinha
 * de desfazer na conversa: a pessoa vinha esperando uma lista de nomes e
 * recebia três caminhos explicados, que é mais — a copy antiga vendia a
 * casa abaixo do que ela entrega.
 *
 * 3 · O Card 2 dizia "Sem interesses escondidos", que é o que toda empresa
 * diz, inclusive as que têm. O fato concreto e verificável é mais forte, e
 * é a promessa fundadora do produto (README: *"nunca por posição paga"*):
 * nenhum profissional paga para estar na Rede. A anáfora dos três "Sem"
 * se quebra de propósito — a linha mais forte da página não devia estar
 * disfarçada de terceira repetição.
 *
 * Sem texto dentro das fotografias: tudo aqui é HTML.
 */

const VIDEO_SRC = "/videos/video-institucional-aliviar.webm";

function AmbienteSection({
  id,
  cena,
  prioridade,
  posicaoCard,
  children,
  rotulo,
  posicaoMobile,
  posicaoDesktop,
}: {
  id?: string;
  cena: Parameters<typeof CenaResponsiva>[0]["cena"];
  prioridade?: boolean;
  /**
   * Onde o card pousa sobre a área livre da cena. `entre` distribui dois
   * cards — um no topo, outro no pé — que é a composição da Recepção
   * depois da fusão pedida pelo Fundador (23/08).
   */
  posicaoCard: "inferior" | "superior" | "entre";
  children: React.ReactNode;
  rotulo: string;
  posicaoMobile?: string;
  posicaoDesktop?: string;
}) {
  return (
    <section id={id} className="landing-ambiente" aria-label={rotulo}>
      <CenaResponsiva
        cena={cena}
        prioridade={prioridade}
        posicaoMobile={posicaoMobile}
        posicaoDesktop={posicaoDesktop}
      />
      <div className={`landing-ambiente-conteudo landing-ambiente-conteudo--${posicaoCard}`}>
        {children}
      </div>
    </section>
  );
}

/**
 * CARD 1 · Recepção — o VÍDEO em cima, a proposta embaixo.
 *
 * Fusão pedida pelo Fundador (23/08): os cards da Recepção e da Curadoria
 * viram um só, e o espaço de cima — a parede livre acima das pessoas —
 * passa a ser o card do vídeo. Quem chega vê, na mesma tela, o convite
 * para conhecer a casa em imagem e a proposta inteira em texto.
 */
export function AmbienteRecepcao() {
  return (
    <AmbienteSection
      id="como-funciona"
      cena="recepcao"
      prioridade
      posicaoCard="inferior"
      rotulo="Recepção"
      posicaoMobile="center 22%"
      posicaoDesktop="center"
    >
      {/* A Recepção fica com UM card só: a promessa, os três passos e a
          porta. O vídeo desceu para o topo livre da sala de curadoria
          (risco do Fundador, 23/08) — pousa onde o trabalho acontece. */}
      <div className="landing-veu landing-card-vidro">
        <h1 className="landing-hero-title text-[1.5rem] sm:text-4xl lg:text-[3.25rem]">
          Uma decisão de saúde importante.
          <br />
          Você não precisa tomá-la sozinho.
        </h1>

        <p className="landing-body mt-4 text-base text-[var(--color-ink-muted)]">
          A Aliviar organiza sua escolha:
        </p>
        <ol className="landing-passos-curtos">
          <li>Escuta você</li>
          <li>Analisa especialistas</li>
          <li>Apresenta três opções</li>
        </ol>

        <div className="landing-acoes">
          <LinkButton
            href="/solicitar-atendimento"
            variant="primary"
            className="landing-porta w-full sm:w-auto"
          >
            Quero conversar com a Aliviar
          </LinkButton>
        </div>

        <p className="landing-microtexto">Sem dados de saúde agora.</p>
      </div>
    </AmbienteSection>
  );
}

/** CARD 2 · Curadoria — o vídeo no teto livre, o curador no pé da cena. */
export function AmbienteCuradoria() {
  const temVideo = existsSync(path.join(process.cwd(), "public", VIDEO_SRC));

  return (
    <AmbienteSection
      cena="curadoria"
      posicaoCard="entre"
      rotulo="A Curadoria"
      posicaoMobile="center 30%"
    >
      {/* O VÍDEO pousa no topo livre desta cena (risco do Fundador,
          23/08): "veja como a Aliviar funciona" na sala onde o trabalho
          acontece. A capa é uma chamada, não outra fotografia — a cena
          atrás do vidro já é a imagem. */}
      {temVideo ? (
        <div className="landing-veu landing-card-vidro landing-card-abertura">
          <VideoDaCasa
            src={VIDEO_SRC}
            chamada="Veja a Aliviar por dentro"
            rotulo="Assistir ao vídeo"
            duracao="1 min 20 s"
          />
        </div>
      ) : (
        <div aria-hidden="true" />
      )}

      <div className="landing-veu landing-card-vidro">
        <h2 className="landing-heading text-2xl lg:text-[2.25rem]">
          Você não precisa escolher sozinho.
        </h2>
        <p className="landing-body mt-4 text-base text-[var(--color-ink-muted)]">
          O curador Aliviar escuta a sua história, compreende suas necessidades e avalia cada
          possibilidade com cuidado e independência.
        </p>

        {/* Os três períodos iniciados por "Sem" viram marcadores curtos —
            as palavras seguem exatamente as do dossiê. */}
        <ul className="landing-marcadores">
          <li>Sem indicações automáticas.</li>
          <li>Sem pressão.</li>
          <li>Nenhum médico paga para aparecer aqui.</li>
        </ul>

        <p className="landing-body mt-4 text-base text-[var(--color-ink-muted)]">
          Apenas uma orientação humana, criteriosa e transparente para ajudar você a encontrar o
          cuidado certo com segurança e confiança.
        </p>
      </div>
    </AmbienteSection>
  );
}

/** CARD 3 · Escolha médica — três opções, e a decisão dela. */
export function AmbienteEscolha() {
  return (
    <AmbienteSection
      id="quem-somos"
      cena="tres-medicos"
      posicaoCard="inferior"
      rotulo="A escolha"
      posicaoMobile="center 18%"
    >
      <div className="landing-veu landing-card-vidro">
        <h2 className="landing-heading text-2xl lg:text-[2.25rem]">
          Três caminhos, explicados. A escolha continua sendo sua.
        </h2>
        <p className="landing-body mt-5 text-base text-[var(--color-ink-muted)]">
          A Aliviar apresenta três opções compatíveis com a sua necessidade e explica os pontos
          importantes de cada uma. Você decide com clareza, sem pressão e sem favorecimentos.
        </p>
      </div>
    </AmbienteSection>
  );
}

/** CARD 4 · Concierge — o depois, sem prometer o que a casa não faz. */
export function AmbienteConcierge() {
  return (
    <AmbienteSection
      cena="concierge"
      posicaoCard="superior"
      rotulo="Concierge"
      posicaoMobile="center 62%"
    >
      <div className="landing-veu landing-card-vidro">
        <h2 className="landing-heading text-2xl lg:text-[2.25rem]">
          Depois da escolha, continuamos com você.
        </h2>
        <p className="landing-body mt-5 text-base text-[var(--color-ink-muted)]">
          A Aliviar organiza documentos, etapas e informações para tornar sua jornada mais simples e
          segura.
        </p>

        {/* Marcadores do dossiê, menos "Agenda e confirmações": a
            aproximação intermediada não existe no produto (F9) e a
            decisão sobre intermediação segue aberta. */}
        <ul className="landing-marcadores">
          <li>Documentos e etapas num lugar só</li>
          <li>Alguém da Aliviar para responder</li>
          <li>Acompanhamento dos próximos passos</li>
        </ul>

        <div className="landing-acoes">
          <LinkButton
            href="/solicitar-atendimento"
            variant="primary"
            className="landing-porta w-full sm:w-auto"
          >
            Quero conversar com a Aliviar
          </LinkButton>
        </div>

        <p className="landing-microtexto">Sem dados de saúde agora.</p>
      </div>
    </AmbienteSection>
  );
}
