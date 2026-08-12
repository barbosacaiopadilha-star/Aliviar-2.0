import {
  LandingCard,
  LandingEyebrow,
  LandingSection,
} from "@/components/landing/editorial/landing-section";
import { LinkButton } from "@/components/landing/link-button";

/**
 * Os atos da Fachada — CRITICA_LANDING_2_2 §6 (storyboard aprovado).
 *
 * A página deixou de ser sete batidas idênticas: agora alterna aberto,
 * médio, vazio, denso e corte. Duas fusões fizeram isso possível — "O
 * Método" absorveu o "Caminho claro" (uma explicação só, com densidade de
 * explicação de verdade), e "Suas prioridades" absorveu "Um documento"
 * (uma entrega só, mostrada na gramática real do produto).
 */

const PROBLEMA_ITENS = [
  {
    title: "Opções demais, critério de menos",
    text: "Listas e anúncios não dizem o que importa para a sua situação.",
  },
  {
    title: "Informação que ninguém traduz",
    text: "Currículos difíceis de interpretar sozinho, justamente quando você menos tem energia.",
  },
  {
    title: "A pior hora para decidir",
    text: "Medo e pressa são maus conselheiros. E é exatamente aí que a decisão é exigida.",
  },
] as const;

/**
 * BLOCO 7 · "Nosso Método" — os quatro movimentos, sempre nesta ordem.
 *
 * Copy literal do contrato 34 §6.3. Descreve o que a Aliviar FAZ, com verbos
 * que o produto cumpre: entender, registrar, estudar, apresentar. Nenhum
 * promete resultado clínico, prazo ou escolha feita por nós.
 */
const PILARES_DO_METODO = [
  {
    title: "Consciência",
    text: "Entender o que está em jogo antes de decidir qualquer coisa.",
  },
  {
    title: "Contexto",
    text: "Sua história, suas prioridades e o que você não abre mão — nas suas palavras.",
  },
  {
    title: "Análise",
    text: "Um Curador estuda o seu caso e compara caminhos, pessoa a pessoa.",
  },
  {
    title: "Direção",
    text: "Três caminhos legítimos, com o que cada um oferece e o que cada um pede.",
  },
] as const;

/**
 * BLOCO 7 · "Concierge Aliviar" — o serviço, nunca uma pessoa designada.
 *
 * Aqui morava a colisão que o contrato 34 §4.1 resolveu: a referência pede uma
 * seção "Concierge", e o produto diz que até a decisão quem responde é o
 * **Curador**, que não existe identidade persistida de Concierge (GAP-D12-C1)
 * e que não há SLA aprovado.
 *
 * Por isso a copy fala da CASA, e o terceiro pilar começa literalmente por
 * "Depois que você escolhe" — que é exatamente onde o Concierge entra. Nada
 * aqui promete pessoa, foto, telefone, horário, prazo, agendamento ou
 * intermediação com o profissional.
 */
const PILARES_DO_CONCIERGE = [
  {
    title: "Organização que simplifica",
    text: "Documentos, etapas e informações reunidos num lugar só — você não precisa guardar nada de cabeça.",
  },
  {
    title: "Navegação com segurança",
    text: "Quando surge uma dúvida, há alguém da Aliviar para responder. Você nunca fica diante de uma decisão sem ter a quem perguntar.",
  },
  {
    title: "Acompanhamento que acolhe",
    text: "Depois que você escolhe, a Aliviar continua com você — o caso nunca fica sem alguém respondendo por ele.",
  },
] as const;

/**
 * BLOCO 7 · as quatro linhas editoriais. A quarta é a dourada, e é a que
 * devolve a autonomia: tudo o que veio antes existe para que a decisão
 * continue sendo dela.
 */
const LINHAS_EDITORIAIS = [
  "Curadoria é método.",
  "Concierge é tranquilidade.",
  "Independência é o que torna as duas possíveis.",
  "E a decisão continua sendo sua.",
] as const;

/**
 * BLOCO 7 · os quatro diferenciais — **todos verificáveis contra o produto no
 * ar**. O primeiro recolhe a frase que saiu do eyebrow do Hero, e por isso a
 * seção de independência do plano §B.2 não é criada: repeti-la alongaria a
 * página sem dizer nada novo.
 */
const DIFERENCIAIS = [
  "Curadoria médica independente — sem vínculo com operadoras ou hospitais.",
  "Um Curador humano estuda cada caso — nenhum algoritmo escolhe por você.",
  "Sem ranking, sem nota, sem “melhor opção”.",
  "Você decide, e a Aliviar continua com você depois.",
] as const;

const PASSOS = [
  {
    title: "Você conta sua história",
    text: "Uma conversa real, humana, no seu ritmo. Nunca um formulário frio.",
  },
  {
    title: "Vocês definem o que importa",
    text: "Suas prioridades registradas com as suas próprias palavras.",
  },
  {
    title: "A equipe analisa",
    text: "Seu Curador estuda os especialistas à luz dos seus critérios.",
  },
  {
    title: "Você recebe três opções",
    text: "Três caminhos legítimos, explicados — nunca um ranking.",
  },
  {
    title: "A decisão é sua",
    text: "No seu tempo, com acompanhamento contínuo antes e depois.",
  },
] as const;

/**
 * O retrato de prioridades na gramática REAL do produto (pós-ADR-042):
 * a frase da pessoa em serifa, o peso dito em palavra. Zero números.
 *
 * Antes este mockup exibia "40 pts / 35 pts / 25 pts" — o orçamento de 100
 * pontos que a ADR-042 aboliu, e pontuação somável na mesma página que
 * promete "não vendemos posição em ranking". A vitrine não pode contradizer
 * a alma do produto.
 */
const PRIORIDADES = [
  {
    peso: "O mais importante",
    quote: "Não quero recomeçar do zero.",
    label: "Acompanhamento contínuo",
  },
  {
    peso: "Muito importante",
    quote: "Queria alguém que já visse casos como o meu.",
    label: "Experiência",
  },
  {
    peso: "Também importa",
    quote: "Se demorar, eu desisto.",
    label: "Começar logo",
  },
] as const;

function revealDelay(index: number) {
  return { transitionDelay: `${index * 90}ms` };
}

/**
 * Ato II — O ESPELHO: a pessoa se reconhece no problema.
 *
 * Movimento 2 ("Nós ouvimos", NOTA 2.3): a voz sai do centro da página —
 * composição de vitrine, que fala PARA uma plateia — e assenta na coluna à
 * esquerda, alinhada com os parágrafos abaixo: composição de conversa, que
 * fala COM uma pessoa. Mesmo texto, outra distância.
 */
export function ProblemaSection() {
  return (
    <LandingSection id="problema" spacing="media">
      <div className="landing-reveal mx-auto max-w-2xl">
        <LandingEyebrow>O cenário atual</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
          Escolher um médico virou um problema de navegação.
        </h2>
        <p className="landing-body mt-8 text-lg text-[var(--color-ink-muted)]">
          Existem bons médicos e informação de sobra. O que falta é alguém do seu lado na hora de decidir.
        </p>
      </div>

      {/* Parágrafos com fio lateral, alturas naturais — não três caixas
          contáveis de mesma altura. A mancha visual deixa de dizer "1, 2, 3"
          e passa a dizer "alguém me explicou" (R5/P4). */}
      <div className="mx-auto mt-16 max-w-2xl space-y-10">
        {PROBLEMA_ITENS.map((item, index) => (
          <div
            key={item.title}
            className="landing-reveal border-l-2 border-[var(--color-border-strong)] pl-6 lg:pl-8"
            style={revealDelay(index)}
          >
            <h3 className="landing-heading text-xl">{item.title}</h3>
            <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{item.text}</p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}

/** Ato III — RESPIRO: o único grande vazio da página. Por ser único, significa. */
export function RespiroSection() {
  return (
    <LandingSection spacing="respiro" aria-label="Pausa">
      {/* Eco deliberado da última voz da página (rodapé) — nenhuma copy
          nova: a mesma promessa, dita no meio do caminho, como ponte entre
          "o problema é esse" e "existe um jeito". */}
      <p className="landing-reveal mx-auto max-w-2xl text-center font-serif text-2xl leading-[1.5] text-[var(--color-ink)] lg:text-3xl">
        Você não precisa decidir sozinho.
      </p>
    </LandingSection>
  );
}

/**
 * BLOCO 7 · NOSSO MÉTODO — os quatro movimentos.
 *
 * A página explicava as cinco ETAPAS (o que acontece, em que ordem) e nunca
 * dizia o MÉTODO (por que nesta ordem). Quem chega pela primeira vez não
 * encontrava o que a Aliviar faz — só o que ela promete fazer.
 *
 * Quatro pilares, uma coluna em mobile com divisores horizontais, duas em
 * desktop. Sem cartão: o peso visual do cartão é da entrega (Prioridades), e
 * repeti-lo aqui achataria a hierarquia.
 */
export function NossoMetodoSection() {
  return (
    <LandingSection id="metodo" spacing="media">
      <div className="landing-reveal mx-auto max-w-2xl">
        <LandingEyebrow>Nosso Método</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
          Quatro movimentos, sempre nesta ordem.
        </h2>
      </div>

      <div className="landing-pilares mx-auto mt-16 max-w-4xl">
        {PILARES_DO_METODO.map((pilar, index) => (
          <div key={pilar.title} className="landing-reveal landing-pilar" style={revealDelay(index % 2)}>
            <h3 className="landing-heading text-xl">{pilar.title}</h3>
            <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{pilar.text}</p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}

/**
 * BLOCO 7 · CONCIERGE ALIVIAR — o serviço, e o lugar dele no tempo.
 *
 * A seção vem DEPOIS de "Suas prioridades" de propósito: o Concierge entra
 * quando já existe uma escolha a acompanhar. Pôr esta seção antes contaria a
 * história errada — e é exatamente a fronteira que o contrato 34 §4.1 fixou.
 */
export function ConciergeSection() {
  return (
    /* Sem `atmosphere`: a cena da recepção traz o logotipo gravado na parede,
       e ele caía bem atrás do título — dois logotipos disputando a mesma
       linha, o mesmo erro que o Hero já tinha corrigido. A seção fica no
       linho quente, sem fundo figurativo competindo com a leitura. */
    <LandingSection id="concierge" variant="warm" spacing="media">
      <div className="landing-reveal mx-auto max-w-2xl">
        <LandingEyebrow>Concierge Aliviar</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Você não faz isso sozinha.</h2>
      </div>

      <div className="landing-pilares landing-pilares--tres mx-auto mt-16 max-w-4xl">
        {PILARES_DO_CONCIERGE.map((pilar, index) => (
          <div key={pilar.title} className="landing-reveal landing-pilar" style={revealDelay(index)}>
            <h3 className="landing-heading text-xl">{pilar.title}</h3>
            <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{pilar.text}</p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}

/**
 * Ato IV — O MÉTODO: a passagem densa que a página não tinha.
 *
 * Fusão de "O Método" + "Caminho claro": quem quer entender, entende aqui,
 * num lugar só, em coluna estreita e leitura de verdade. Confiança nasce de
 * entender — uma página só de blocos rasos diz "não se preocupe com os
 * detalhes", que é exatamente o que gera desconfiança em saúde.
 */
export function MetodoSection() {
  return (
    <LandingSection
      id="como-funciona"
      variant="warm"
      atmosphere="consultas"
      spacing="densa"
    >
      <div className="mx-auto max-w-2xl">
        <div className="landing-reveal">
          {/* BLOCO 7 · o eyebrow passa a nomear o que a seção É — as cinco
              etapas. "Nosso Método" virou seção própria, com os quatro
              movimentos, e dois eyebrows dizendo "Método" na mesma página
              confundiriam o que já estava claro. */}
          <LandingEyebrow>Como funciona</LandingEyebrow>
          <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
            Nós nunca perguntamos &ldquo;qual é o melhor médico?&rdquo;
          </h2>
          <p className="landing-body mt-8 text-lg text-[var(--color-ink-muted)]">
            Perguntamos algo mais útil: entre os médicos aprovados pelo nosso rigor técnico, quais combinam com o que{" "}
            <em>você</em> definiu como importante?
          </p>
          {/* "O caminho que vamos percorrer juntos" — acompanhamento, não
              processo (NOTA 2.3, copy registrada). Nenhuma promessa nova:
              a companhia em cada passo já era o texto anterior. */}
          <p className="landing-body mt-5 text-lg text-[var(--color-ink-muted)]">
            O caminho que vamos percorrer juntos tem cinco passos — do primeiro contato à escolha, com uma pessoa ao
            seu lado em todos eles.
          </p>
        </div>

        <ol className="mt-12">
          {PASSOS.map((passo, index) => (
            <li
              key={passo.title}
              className="landing-reveal landing-etapa-conector flex gap-6 border-t border-[var(--color-border)] py-6 first:border-t-0 lg:gap-8"
              style={revealDelay(index % 2)}
            >
              <span
                aria-hidden="true"
                className="font-serif text-2xl font-normal leading-none text-[var(--color-brand-gold)] lg:text-3xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="landing-heading text-lg">{passo.title}</h3>
                <p className="landing-body mt-1.5 text-[var(--color-ink-muted)]">{passo.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </LandingSection>
  );
}

/**
 * Ato V — O QUE VOCÊ RECEBE.
 *
 * Fusão de "Suas prioridades" + "Um documento": uma entrega só, num único
 * mockup — o retrato das prioridades como o produto realmente as trata, e a
 * moldura da Jornada com nome e data.
 */
export function PrioridadesSection() {
  return (
    <LandingSection id="para-quem" variant="warm" atmosphere="despedida" spacing="media">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="landing-reveal">
          <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Suas prioridades, nas suas palavras.</h2>
          {/* "Você distribui pesos" saiu junto com os pontos: era a
              linguagem do orçamento abolido pela ADR-042. */}
          <p className="landing-body mt-8 text-lg text-[var(--color-ink-muted)]">
            Nada é presumido ou herdado de casos parecidos. Você confirma o retrato do que importa — e ele conduz
            toda a análise.
          </p>
          <p className="landing-body mt-5 text-lg text-[var(--color-ink-muted)]">
            No fim, um documento para reler com calma: suas prioridades, as três opções, o que cada caminho oferece e
            o que custa — em linguagem simples. Para reler com a família ou levar à consulta.
          </p>
        </div>

        <LandingCard className="landing-reveal" style={revealDelay(1)}>
          <div className="space-y-6">
            {PRIORIDADES.map((item) => (
              <div key={item.label} className="border-b border-[var(--color-border)] pb-6 last:border-0 last:pb-0">
                <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-brand-sage-deep)]">
                  {item.peso}
                </p>
                {/* A frase dela em serifa — voz humana (R3); o rótulo do
                    sistema em sem-serifa, menor, depois dela. */}
                <p className="mt-2 font-serif text-lg leading-snug text-[var(--color-ink)]">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-7">
            <h3 className="landing-heading text-lg">Sua Jornada</h3>
            <p className="landing-body mt-2 text-sm text-[var(--color-ink-muted)]">
              Quem está cuidando, em que ponto está e quando terá notícia. Sempre com nome e data.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-muted)]">Responsável</span>
                <span className="font-medium">Ana Curadora</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-muted)]">Próxima atualização</span>
                <span className="font-medium">24 de julho de 2026</span>
              </div>
            </div>
          </div>
        </LandingCard>
      </div>
    </LandingSection>
  );
}

/**
 * O CONVITE FINAL — o segundo (e último) CTA real da página.
 *
 * Antes a página terminava nas Dúvidas e caía no rodapé sem encerramento: a
 * narrativa construía a confiança e não oferecia a porta no momento em que
 * ela ficava madura. O convite nasce como consequência do percurso — quem
 * leu até aqui já sabe o que é a casa; falta só saber que pode entrar no
 * próprio ritmo. Mesmo destino, mesma soleira (o único gesto da marca),
 * nunca um convite novo competindo com o primeiro.
 */
export function ConviteSection() {
  return (
    <LandingSection spacing="media" aria-label="Convite">
      <div className="landing-reveal mx-auto max-w-2xl text-center">
        <p className="font-serif text-2xl leading-[1.5] text-[var(--color-ink)] lg:text-3xl">
          Quando você quiser começar, o primeiro passo é contar a sua história — no seu ritmo.
        </p>
        <div className="mt-10 flex justify-center">
          <LinkButton href="/sua-historia" variant="primary" className="landing-porta">
            Contar minha história
          </LinkButton>
        </div>
      </div>
    </LandingSection>
  );
}

/** Ato VI — A SALA VERDE: o corte. Intocada — já era o melhor momento. */
export function QuemSomosSection() {
  return (
    <LandingSection id="quem-somos" variant="forest">
      <div className="landing-reveal mx-auto max-w-3xl">
        <h2 className="landing-heading text-3xl text-[var(--landing-linen)] lg:text-[2.625rem]">
          Curadores independentes.
        </h2>
        <p className="landing-body mt-8 text-lg text-on-dark-muted">
          Os médicos que apresentamos passam por aprovação própria e prévia. Nenhum profissional paga para estar aqui.
        </p>

        {/* BLOCO 7 · as quatro linhas editoriais. A quarta é dourada porque é
            a que fecha o argumento inteiro: método e tranquilidade existem
            para que a decisão continue sendo DELA. */}
        <div className="landing-reveal mt-14 space-y-2" style={revealDelay(1)}>
          {LINHAS_EDITORIAIS.map((linha, index) => (
            <p
              key={linha}
              className={
                index === LINHAS_EDITORIAIS.length - 1
                  ? "font-serif text-2xl leading-[1.5] text-[var(--color-brand-gold)] lg:text-3xl"
                  : "font-serif text-2xl leading-[1.5] text-[var(--landing-linen)] lg:text-3xl"
              }
            >
              {linha}
            </p>
          ))}
        </div>

        {/* Quatro diferenciais — cada um verificável contra o produto no ar.
            Nenhum número de médicos, cidades ou casos: métrica não medida é
            promessa, e a §6.5 do contrato 34 as proíbe todas. */}
        <ul className="landing-reveal mt-14 space-y-4" style={revealDelay(2)}>
          {DIFERENCIAIS.map((item) => (
            <li key={item} className="flex gap-3 text-on-dark">
              <span aria-hidden="true" className="text-[var(--color-brand-gold)]">
                ·
              </span>
              <span className="landing-body">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-[var(--radius-card)] border border-on-dark-line bg-[color-mix(in_srgb,var(--color-on-dark)_6%,transparent)] p-8 lg:p-12">
          <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-on-dark-faint">
            O que não fazemos
          </h3>
          <p className="landing-body mt-5 text-on-dark">
            Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres
            — prometemos um processo sério.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}
