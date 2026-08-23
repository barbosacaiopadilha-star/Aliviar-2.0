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
/* 2ª passada da ADR-081 (23/08): as linhas SAÍRAM da tela — dentro da
   própria sala verde elas repetiam o que os fatos dizem. Permanecem
   exportadas como copy CONGELADA (guarda em bloco7-landing-d1). */
export const LINHAS_EDITORIAIS = [
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
/* 2ª passada da ADR-081 (23/08): os diferenciais SAÍRAM da tela — os quatro
   fatos (3/29/1/0) dizem o mesmo com número e menos palavras. Permanecem
   exportados como copy CONGELADA (guarda em bloco7-landing-d1). */
export const DIFERENCIAIS = [
  "Curadoria médica independente — sem vínculo com operadoras ou hospitais.",
  "Um Curador humano estuda cada caso — nenhum algoritmo escolhe por você.",
  "Sem ranking, sem nota, sem “melhor opção”.",
  "Você decide, e a Aliviar continua com você depois.",
] as const;

/**
 * ADR-078/080 · os cinco passos. A COPY é a mesma, palavra por palavra.
 * Sem fotografia nos cartões por decisão do Fundador (23/08): a imagem da
 * jornada é o AMBIENTE da seção — o corredor dos três quadros ao fundo.
 */
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
    <LandingSection
      spacing="densa"
      aria-label="Vídeo institucional"
      /* ADR-082: abre a RECEPÇÃO, acima do Capítulo Zero. A classe própria
         posiciona o card no vão do piso no celular (risco do Fundador,
         23/08): a chegada da família abre a tela LIMPA, e o vídeo pousa
         logo acima do Capítulo Zero. */
      variant="transparente"
      className="landing-video-recepcao"
    >
      {/* A pedido do Fundador (23/08), o card virou SÓ o player: o eyebrow,
          o "Assistir agora →" (fusão F3), a linha "Independente, humana e
          completa…" e por fim o título "Conheça a Aliviar" saíram — o selo
          "Assistir — 2 min" do próprio player diz tudo. */}
      <div id="video-institucional" className="landing-veu mx-auto max-w-3xl p-5 lg:p-8">
        <div className="landing-reveal">
          <HeroVideo src="/videos/video-institucional-aliviar.webm" posterScene="/landing/sala-de-espera.jpg" />
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
    <LandingSection spacing="densa" variant="transparente" aria-label="O que nos define">
      {/* ADR-080 · 3ª rodada: os cinco pilares num único vidro largo — um
          card só faz menos ruído que cinco sobre a cena. */}
      <div className="landing-veu landing-reveal mx-auto grid max-w-5xl grid-cols-1 gap-8 p-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6 lg:p-8">
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
      {/* MARCADOR PROVISÓRIO do Fundador (23/08, "uma brincadeira antes de
          lançar o produto — depois eu troco"): a frase canônica do Respiro
          ("Você não precisa decidir sozinho.") volta quando ele trocar. */}
      <p className="landing-reveal mx-auto max-w-2xl text-center font-serif text-2xl leading-[1.5] text-[var(--color-ink)] lg:text-3xl">
        Curisco
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
    /* ADR-080 · 3ª rodada: vive no Capítulo 4 (a Mesa de trabalho) — a
       fotografia interna saiu (o ambiente do capítulo JÁ é a Aliviar
       trabalhando; duas fotos empilhadas era a poluição que o Fundador
       temia). O conteúdo mora num vidro só. */
    <LandingSection id="concierge" variant="transparente" spacing="media">
      <div className="landing-veu mx-auto max-w-2xl p-6 lg:p-10">
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
    </LandingSection>
  );
}

/** O cartão de um passo da jornada — a numeração atravessa os atos. */
function PassoDaJornada({
  passo,
  numero,
  delayIndex,
}: {
  passo: (typeof PASSOS)[number];
  numero: number;
  delayIndex: number;
}) {
  return (
    <li
      className="landing-veu landing-reveal landing-etapa-seta relative overflow-visible"
      style={revealDelay(delayIndex)}
    >
      <div className="p-5">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_78%,transparent)] font-serif text-sm text-on-dark"
        >
          {String(numero).padStart(2, "0")}
        </span>
        <h3 className="landing-heading mt-4 text-base">{passo.title}</h3>
        <p className="landing-body mt-1.5 text-sm text-[var(--color-ink-muted)]">{passo.text}</p>
      </div>
    </li>
  );
}

/**
 * ATO 2 · A CURADORIA (ADR-082, roteiro do Fundador, 23/08): a página
 * inteira explica quatro atos — Recepção, Curadoria, Escolha, Concierge —
 * e este é o coração. Na cena da sala de curadoria: o manifesto, a
 * apresentação conceitual do CURADOR (copy do Fundador) e os passos 01–03.
 * Os passos 04–05 vivem no ato seguinte (a Escolha, no corredor) — a
 * numeração atravessa os ambientes de propósito: a travessia É a jornada.
 * Quando existir o vídeo do "como funciona", ele entra neste ato.
 */
export function MetodoSection() {
  return (
    <LandingSection id="como-funciona" variant="transparente" spacing="densa">
      <div className="landing-veu mx-auto max-w-2xl p-6 lg:p-8">
        <div className="landing-reveal">
          <LandingEyebrow>A Curadoria</LandingEyebrow>
          <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
            Nós nunca perguntamos &ldquo;qual é o melhor médico?&rdquo;
          </h2>
          <p className="landing-body mt-8 text-lg text-[var(--color-ink-muted)]">
            Perguntamos algo mais útil: entre os médicos aprovados pelo nosso rigor técnico, quais combinam com o que{" "}
            <em>você</em> definiu como importante?
          </p>
        </div>
      </div>

      {/* A apresentação do CURADOR — copy do Fundador (ADR-082), com uma
          única adaptação: "encontrar o cuidado certo" viraria promessa de
          resultado (L14; Linguagem §6 — família de "ideal"); o fecho diz o
          que a casa pode prometer: a decisão dela, com segurança.
          VIDRO BRANCO como os irmãos (decisão do Fundador, 23/08): a banda
          verde fugia da linguagem única — o destaque vem do tamanho e da
          posição, não da cor. Os números falam azul-marinho da marca. */}
      <div
        id="quem-somos"
        className="landing-veu landing-reveal mx-auto mt-14 max-w-4xl scroll-mt-24 p-7 lg:p-12"
      >
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
          Você não precisa escolher sozinho.
        </h2>
        <p className="landing-body mt-5 text-lg text-[var(--color-ink-muted)]">
          O Curador Aliviar escuta a sua história, compreende as suas necessidades e avalia cada possibilidade com
          cuidado e independência. Sem indicações automáticas, sem pressão e sem interesses escondidos — uma
          orientação humana, criteriosa e transparente, para você decidir com segurança e confiança.
        </p>
        {/* O ganho POSITIVO de contratar (pedido do Fundador, 23/08) —
            benefício do processo, nunca promessa de resultado (§6.5). */}
        <p className="landing-body mt-4 text-lg text-[var(--color-ink)]">
          Ao contratar a Aliviar, você recebe um processo inteiro dedicado ao seu caso: escuta, análise criteriosa,
          três opções sérias e acompanhamento, tudo com nome e data.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {FATOS.map((fato) => (
            <div key={fato.label}>
              <p className="font-serif text-4xl leading-none text-[var(--color-brand-primary)] lg:text-5xl">
                {fato.numero}
              </p>
              <p className="landing-body mt-2 text-sm text-[var(--color-ink-muted)]">{fato.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--color-border)] pt-7">
          <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
            O que não fazemos
          </h3>
          <p className="landing-body mt-4 text-[var(--color-ink)]">
            Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres
            — prometemos um processo sério.
          </p>
        </div>
      </div>

      {/* Os três primeiros passos — o trabalho da Curadoria. */}
      <ol className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {PASSOS.slice(0, 3).map((passo, index) => (
          <PassoDaJornada key={passo.title} passo={passo} numero={index + 1} delayIndex={index} />
        ))}
      </ol>
    </LandingSection>
  );
}

/**
 * ATO 3 · A ESCOLHA (ADR-082): no corredor dos três retratos — a cena que
 * encena literalmente as três opções. Só os passos 04–05, continuando a
 * numeração do ato anterior; os cartões dizem tudo, nenhum título novo.
 */
export function EscolhaSection() {
  return (
    <LandingSection variant="transparente" spacing="densa" aria-label="A escolha">
      <ol className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {PASSOS.slice(3).map((passo, index) => (
          <PassoDaJornada key={passo.title} passo={passo} numero={index + 4} delayIndex={index} />
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
  // Auditoria 23/08 (crítica 3, aceita pela arquitetura dos 4 capítulos):
  // as cenas do conjunto antigo saem da Landing — este interlúdio fica em
  // linho limpo entre os capítulos do Edifício.
  return (
    <LandingSection id="para-quem" variant="transparente" spacing="media">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="landing-veu landing-reveal p-6 lg:p-8">
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

        <LandingCard className="landing-veu landing-veu--denso landing-reveal" style={revealDelay(1)}>
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
    <LandingSection
      spacing="media"
      aria-label="Convite"
      /* ADR-080 · 3ª rodada: o encerramento vive no Capítulo 4 (a Mesa) —
         a foto interna e o painel verde saíram (a crítica 1 da auditoria:
         duas fotografias empilhadas). O convite é UM vidro liso sobre a
         cena da Aliviar trabalhando. Copy intocada. */
      variant="transparente"
    >
      {/* 2ª passada da ADR-081 (23/08): das duas frases do convite, fica a
          que diz o que acontece ao clicar; "Cuidar é um caminho..." segue
          congelada na constante exportada abaixo. UM vidro, UMA frase, UM
          botão — a porta única (C1/ADR-075). */}
      <div className="landing-veu landing-reveal mx-auto max-w-2xl px-6 py-10 text-center lg:px-12">
        <p className="font-serif text-2xl leading-[1.5] text-[var(--color-ink)] lg:text-3xl">
          Quando você quiser começar, o primeiro passo é contar a sua história — no seu ritmo.
        </p>
        <div className="mt-8">
          <LinkButton href="/solicitar-atendimento" variant="primary" className="landing-porta">
            Solicitar atendimento
          </LinkButton>
        </div>
      </div>
    </LandingSection>
  );
}

/* 2ª passada da ADR-081 (23/08): a frase de abertura do convite saiu da
   tela — dizia o mesmo que o Hero e o Respiro. Congelada aqui; se voltar,
   volta exatamente assim (guarda em bloco7-landing-d1). */
export const FRASE_CUIDAR_CONGELADA =
  "Cuidar é um caminho. E você não precisa fazer isso sozinho." as const;

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

        {/* 2ª passada da ADR-081 (23/08): as linhas editoriais e os
            diferenciais SAÍRAM da tela — dentro da mesma seção, repetiam os
            fatos ("independente" 3×, "a decisão é sua" 2×, "sem ranking"
            2×). As copies seguem congeladas nas constantes exportadas
            acima. A sala verde fica: título, abertura, fatos e "o que não
            fazemos". */}

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
