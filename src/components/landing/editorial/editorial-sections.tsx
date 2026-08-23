import { existsSync } from "node:fs";
import path from "node:path";

import { Compass, HeartHandshake, Headset, ShieldCheck, UserCheck } from "lucide-react";

import { HeroVideo } from "@/components/landing/editorial/hero-video";
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
/**
 * Os quatro movimentos dizem POR QUE nesta ordem — nunca o que acontece.
 *
 * Esta seção nasceu para separar o MÉTODO das ETAPAS: "Como funciona" conta o
 * que acontece, em que ordem; aqui se explica a lógica que sustenta a ordem.
 * Os textos anteriores não faziam isso — descreviam os mesmos acontecimentos,
 * invadindo o papel da outra seção. O resultado era uma página que explicava a
 * mesma jornada duas vezes, com "três caminhos legítimos" repetido palavra por
 * palavra, e que anunciava ao visitante duas contagens diferentes para o mesmo
 * percurso: quatro movimentos aqui, cinco passos lá.
 *
 * A régua para escrever qualquer um destes textos: se a frase puder virar um
 * passo numerado do "Como funciona", ela está no lugar errado.
 */
const PILARES_DO_METODO = [
  {
    title: "Consciência",
    text: "Ninguém escolhe bem o que ainda não entendeu. Antes de qualquer nome, o que está em jogo precisa ficar claro.",
  },
  {
    title: "Contexto",
    text: "Não existe bom médico em abstrato — existe o certo para uma vida concreta. Por isso o critério vem de você, antes da busca.",
  },
  {
    title: "Análise",
    text: "Comparar exige uma pessoa lendo, não um filtro. Quem compara assume o que escolheu, com nome.",
  },
  {
    title: "Direção",
    text: "Três, nunca um. Uma indicação única esconde o que foi descartado; três mostram o que cada caminho cobra.",
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

/**
 * ADR-078 · os cinco passos ganham fotografia da casa (base visual do
 * Fundador). A COPY é a mesma, palavra por palavra — o layout a veste.
 * As fotos são as cenas reais de public/scenes, nunca banco de imagem.
 */
const PASSOS = [
  {
    title: "Você conta sua história",
    text: "Uma conversa real, humana, no seu ritmo. Nunca um formulário frio.",
    foto: "/landing/jornada-01-acolhimento.jpg",
  },
  {
    title: "Vocês definem o que importa",
    text: "Suas prioridades registradas com as suas próprias palavras.",
    foto: "/landing/jornada-02-compreensao.jpg",
  },
  {
    title: "A equipe analisa",
    text: "Seu Curador estuda os especialistas à luz dos seus critérios.",
    foto: "/landing/jornada-03-curadoria.jpg",
  },
  {
    title: "Você recebe três opções",
    text: "Três caminhos legítimos, explicados — nunca um ranking.",
    foto: "/landing/jornada-04-encontro.jpg",
  },
  {
    title: "A decisão é sua",
    text: "No seu tempo, com acompanhamento contínuo antes e depois.",
    foto: "/landing/jornada-05-continuidade.jpg",
  },
] as const;

/**
 * ADR-078 · a faixa de confiança logo após o Hero — os cinco pilares com
 * ícone, na gramática do mockup do Fundador. Cada frase é verificável
 * contra o produto no ar; nenhuma diz "melhores", nenhuma promete
 * agendamento (§4.1), nenhuma inventa número.
 */
const PILARES_DE_CONFIANCA = [
  {
    icon: ShieldCheck,
    title: "Independente",
    text: "Sem vínculos com operadoras ou hospitais.",
  },
  {
    icon: UserCheck,
    title: "Compatíveis com você",
    text: "Médicos aprovados pelo nosso rigor, lidos à luz do seu caso.",
  },
  {
    icon: Compass,
    title: "Decisões conscientes",
    text: "Informações claras, explicadas — nunca um ranking.",
  },
  {
    icon: HeartHandshake,
    title: "Acompanhamento",
    text: "Antes, durante e depois. Uma pessoa ao seu lado.",
  },
  {
    icon: Headset,
    title: "Concierge",
    text: "Alguém da Aliviar respondendo pelo seu caso.",
  },
] as const;

/**
 * ADR-078 · os fatos da faixa institucional — o lugar onde o mockup punha
 * "+200 especialistas" e "98% de satisfação". Métrica não medida é promessa
 * (contrato 34 §6.5); estes quatro são verificáveis contra o produto hoje.
 */
const FATOS = [
  { numero: "3", label: "caminhos com nome — nunca um só" },
  { numero: "29", label: "dimensões do Método, lidas por gente" },
  { numero: "1", label: "Curador com nome respondendo pelo seu caso" },
  { numero: "0", label: "algoritmos decidindo por você" },
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

/**
 * ADR-078 (imagens do Fundador) · O CARTÃO DO VÍDEO — logo abaixo do Hero,
 * como no mockup. O vídeo saiu da coluna do Hero (que agora é a fotografia
 * da conversa) e ganhou o próprio momento: poster da sala de espera à
 * esquerda, o convite à direita. O id continua `video-institucional` — o
 * link do Hero pousa aqui.
 */
export function VideoSection() {
  const videoPath = path.join(process.cwd(), "public", "/videos/video-institucional-aliviar.webm");
  if (!existsSync(videoPath)) return null;

  return (
    <LandingSection spacing="densa" aria-label="Vídeo institucional">
      {/* Efeito do mockup: o lado do texto assenta num painel verde-suave em
          degradê — a assinatura visual do cartão do vídeo. */}
      <div
        id="video-institucional"
        className="mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--color-brand-sage)_14%,var(--color-bg-surface))] via-[color-mix(in_srgb,var(--color-brand-sage)_22%,var(--color-bg-surface))] to-[color-mix(in_srgb,var(--color-brand-sage)_34%,var(--color-bg-surface))] p-6 lg:grid-cols-2 lg:gap-12 lg:p-10"
      >
        <div className="landing-reveal">
          <HeroVideo src="/videos/video-institucional-aliviar.webm" posterScene="/landing/sala-de-espera.jpg" />
        </div>
        <div className="landing-reveal" style={revealDelay(1)}>
          <LandingEyebrow>Vídeo institucional</LandingEyebrow>
          <h2 className="landing-heading text-2xl lg:text-3xl">Conheça a Aliviar</h2>
          <p className="landing-body mt-4 text-[var(--color-ink-muted)]">
            Independente, humana e completa — dois minutos para conhecer a casa.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-gold)]">
            Assistir agora →
          </p>
        </div>
      </div>
    </LandingSection>
  );
}

/**
 * ADR-078 · A FAIXA DE CONFIANÇA — entre o Hero e o Espelho.
 *
 * O primeiro relance do mockup do Fundador: cinco pilares com ícone, num
 * fôlego só, antes de a narrativa começar. Não substitui seção nenhuma do
 * contrato 34 — soma-se entre o Hero e o Problema, e cada frase já vivia na
 * página (diferenciais, concierge, método) em forma longa.
 */
export function ConfiancaStripSection() {
  return (
    <LandingSection spacing="densa" variant="white" aria-label="O que nos define">
      <div className="landing-reveal mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
        {PILARES_DE_CONFIANCA.map((pilar, index) => {
          const Icone = pilar.icon;
          return (
            <div
              key={pilar.title}
              className="landing-reveal flex flex-col items-center text-center sm:border-l sm:border-[var(--color-border)] sm:first:border-l-0 sm:px-4"
              style={revealDelay(index)}
            >
              <Icone aria-hidden="true" className="size-7 text-[var(--color-brand-primary)]" strokeWidth={1.5} />
              <h3 className="landing-heading mt-3 text-sm font-semibold">{pilar.title}</h3>
              <p className="landing-body mt-1.5 text-sm text-[var(--color-ink-muted)]">{pilar.text}</p>
            </div>
          );
        })}
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
      {/* ADR-078 · duas colunas na gramática do mockup: a promessa e os três
          pilares à esquerda, a fotografia REAL da casa à direita — dentro de
          um cartão, nunca atrás do título (o logotipo gravado na parede da
          recepção já disputou linha com o Hero uma vez; não de novo). */}
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="landing-reveal">
            <LandingEyebrow>Concierge Aliviar</LandingEyebrow>
            <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Você não faz isso sozinha.</h2>
          </div>

          <div className="mt-10 space-y-8">
            {PILARES_DO_CONCIERGE.map((pilar, index) => (
              <div
                key={pilar.title}
                className="landing-reveal border-l-2 border-[var(--color-brand-gold)] pl-6"
                style={revealDelay(index)}
              >
                <h3 className="landing-heading text-xl">{pilar.title}</h3>
                <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{pilar.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-reveal overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]" style={revealDelay(1)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- cena
              estática de public/scenes, mesmo uso do HeroVideo. */}
          <img
            src="/landing/concierge-atendimento.jpg"
            alt="Uma pessoa da Aliviar em atendimento, de headset, diante do computador"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
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
            São cinco passos — e uma pessoa ao seu lado em todos eles.
          </p>
        </div>

        {/* ADR-078 · os cinco passos em cartões com a fotografia da casa —
            a "jornada" do mockup do Fundador, com a copy intocada. O número
            dourado permanece: é a assinatura da contagem. */}
      </div>

      {/* O letreiro do mockup, centrado sobre a fileira de cartões. */}
      <p className="landing-reveal mt-14 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Sua jornada, com a Aliviar
      </p>

      <ol className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {PASSOS.map((passo, index) => (
          <li
            key={passo.title}
            className="landing-reveal landing-etapa-seta relative overflow-visible rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-surface)_92%,transparent)]"
            style={revealDelay(index % 3)}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- cena
                  estática de public/scenes, mesmo uso do HeroVideo. */}
              <img src={passo.foto} alt="" className="aspect-[4/3] w-full rounded-t-[var(--radius-card)] object-cover" />
              <span
                aria-hidden="true"
                className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_78%,transparent)] font-serif text-sm text-on-dark"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="p-5">
              <h3 className="landing-heading text-base">{passo.title}</h3>
              <p className="landing-body mt-1.5 text-sm text-[var(--color-ink-muted)]">{passo.text}</p>
            </div>
          </li>
        ))}
      </ol>
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
            No fim, tudo vira um documento em linguagem simples — para reler com calma, com a família ou na consulta.
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
              {/* V4 (auditoria 22/08): data absoluta no cartão-exemplo
                  envelhece — um mês depois, prometia atualização no passado.
                  A forma relativa é verdadeira para sempre. */}
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-muted)]">Próxima atualização</span>
                <span className="font-medium">em poucos dias</span>
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
      {/* Fidelidade ao mockup (2ª rodada, 22/08): a banda final é foto +
          painel verde lado a lado — a vida seguindo à esquerda, o convite à
          direita. Sem depoimento até haver gente real (ADR-078). */}
      <div className="landing-reveal mx-auto grid max-w-5xl overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] lg:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- cena
            estática de public/landing, mesmo uso das demais. */}
        <img
          src="/landing/caminho-em-frente.jpg"
          alt="Um homem caminha tranquilo à beira-mar — a vida seguindo em frente"
          className="h-full min-h-[16rem] w-full object-cover"
        />
        <div className="landing-forest-band flex flex-col justify-center p-8 lg:p-12">
          <p className="font-serif text-2xl leading-[1.4] text-[var(--landing-linen)] lg:text-3xl">
            Cuidar é um caminho. E você <em className="text-[var(--color-brand-gold)]">não precisa</em>{" "}
            fazer isso sozinho.
          </p>
          <div className="mt-8">
            <LinkButton href="/solicitar-atendimento" variant="primary" className="landing-porta">
              Solicitar atendimento
            </LinkButton>
          </div>
        </div>
      </div>
      <div className="landing-reveal mx-auto mt-12 max-w-2xl text-center">
        <p className="font-serif text-2xl leading-[1.5] text-[var(--color-ink)] lg:text-3xl">
          Quando você quiser começar, o primeiro passo é contar a sua história — no seu ritmo.
        </p>
        {/* O botão saiu daqui: o CTA do convite vive no painel verde acima
            (mockup, 2ª rodada) — mesma porta do Hero (C1/ADR-075), sem
            repetir o gesto duas vezes na mesma dobra. */}
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

        {/* ADR-078 · a faixa de fatos — onde o mockup punha números
            inventados ("+200 especialistas", "98%"), entram os quatro que o
            produto PROVA hoje. Métrica não medida é promessa (§6.5). */}
        <div className="landing-reveal mt-14 grid grid-cols-2 gap-8 lg:grid-cols-4" style={revealDelay(3)}>
          {FATOS.map((fato) => (
            <div key={fato.label}>
              <p className="font-serif text-4xl leading-none text-[var(--color-brand-gold)] lg:text-5xl">
                {fato.numero}
              </p>
              <p className="landing-body mt-2 text-sm text-on-dark-muted">{fato.label}</p>
            </div>
          ))}
        </div>

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
