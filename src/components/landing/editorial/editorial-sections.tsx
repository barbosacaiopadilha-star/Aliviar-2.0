import {
  LandingCard,
  LandingEyebrow,
  LandingSection,
} from "@/components/landing/editorial/landing-section";

const PROBLEMA_CARDS = [
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

const METODO_PILARES = [
  {
    title: "Você",
    text: "conta sua história e define prioridades.",
  },
  {
    title: "Seu Curador",
    text: "traduz isso em critérios e três caminhos.",
  },
  {
    title: "A tecnologia",
    text: "organiza e registra em silêncio.",
  },
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

const PRIORIDADES = [
  {
    label: "Acompanhamento contínuo",
    pts: 40,
    quote: "Não quero recomeçar do zero.",
  },
  {
    label: "Experiência",
    pts: 35,
    quote: "Queria alguém que já visse casos como o meu.",
  },
  {
    label: "Começar logo",
    pts: 25,
    quote: "Se demorar, eu desisto.",
  },
] as const;

export function ProblemaSection() {
  return (
    <LandingSection id="problema">
      <div className="mx-auto max-w-3xl text-center">
        <LandingEyebrow>O cenário atual</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
          Escolher um médico virou um problema de navegação.
        </h2>
        <p className="landing-body mx-auto mt-7 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Existem bons médicos e informação de sobra. O que falta é alguém do seu lado na hora de decidir.
        </p>
      </div>

      <div className="mt-16 grid gap-7 md:grid-cols-3">
        {PROBLEMA_CARDS.map((card) => (
          <LandingCard key={card.title} className="landing-fade-in">
            <h3 className="landing-heading text-xl">{card.title}</h3>
            <p className="landing-body mt-4 text-[var(--color-ink-muted)]">{card.text}</p>
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}

export function MetodoSection() {
  return (
    <LandingSection variant="warm" atmosphere="landingAtrium">
      <div className="mx-auto max-w-3xl text-center">
        <LandingEyebrow>O Método</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">
          Nós nunca perguntamos &ldquo;qual é o melhor médico?&rdquo;
        </h2>
        <p className="landing-body mx-auto mt-7 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Perguntamos algo mais útil: entre os médicos aprovados pelo nosso rigor técnico, quais combinam com o que{" "}
          <em>você</em> definiu como importante?
        </p>
      </div>

      <div className="mt-16 grid gap-7 md:grid-cols-3">
        {METODO_PILARES.map((pilar) => (
          <LandingCard key={pilar.title} className="text-center">
            <h3 className="landing-heading text-2xl">{pilar.title}</h3>
            <p className="landing-body mt-4 text-[var(--color-ink-muted)]">{pilar.text}</p>
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}

export function ComoFuncionaSection() {
  return (
    <LandingSection>
      <div className="mx-auto max-w-3xl text-center">
        <LandingEyebrow>Caminho claro</LandingEyebrow>
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Do primeiro contato à escolha.</h2>
      </div>

      <ol className="mx-auto mt-16 max-w-2xl space-y-5">
        {PASSOS.map((passo, index) => (
          <li key={passo.title} className="landing-card landing-lift flex gap-6 p-7 lg:p-8">
            <span aria-hidden="true" className="landing-step-number">
              {index + 1}
            </span>
            <div>
              <h3 className="landing-heading text-xl">{passo.title}</h3>
              <p className="landing-body mt-3 text-[var(--color-ink-muted)]">{passo.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}

export function PrioridadesSection() {
  return (
    <LandingSection variant="warm" atmosphere="landingAtrium">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Suas prioridades, nas suas palavras.</h2>
        <p className="landing-body mx-auto mt-7 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Nada é presumido ou herdado de casos parecidos. Você distribui pesos e confirma o retrato do que importa.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-xl">
        <LandingCard className="space-y-7">
          {PRIORIDADES.map((item) => (
            <div key={item.label} className="border-b border-[var(--color-border)] pb-7 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium tracking-[0.01em]">{item.label}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{item.pts} pts</span>
              </div>
              <p className="landing-body mt-3 text-sm italic text-[var(--color-ink-muted)]">
                &ldquo;{item.quote}&rdquo;
              </p>
            </div>
          ))}
        </LandingCard>
      </div>
    </LandingSection>
  );
}

export function RelatorioJornadaSection() {
  return (
    <LandingSection atmosphere="landingAtrium">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Um documento para reler com calma.</h2>
          <p className="landing-body mt-7 text-lg text-[var(--color-ink-muted)]">
            Suas prioridades, as três opções, o que cada caminho oferece e o que custa — em linguagem simples. Para
            reler com a família ou levar à consulta.
          </p>
        </div>

        <LandingCard>
          <h3 className="landing-heading text-xl">Sua Jornada</h3>
          <p className="landing-body mt-4 text-[var(--color-ink-muted)]">
            Quem está cuidando, em que ponto está e quando terá notícia. Sempre com nome e data.
          </p>
          <div className="mt-8 space-y-5 border-t border-[var(--color-border)] pt-8">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[var(--color-ink-muted)]">Responsável</span>
              <span className="font-medium">Ana Curadora</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[var(--color-ink-muted)]">Etapa atual</span>
              <span className="font-medium">Análise em andamento</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[var(--color-ink-muted)]">Próxima atualização</span>
              <span className="font-medium">24 de julho de 2026</span>
            </div>
          </div>
        </LandingCard>
      </div>
    </LandingSection>
  );
}

export function QuemSomosSection() {
  return (
    <LandingSection variant="forest">
      <div className="mx-auto max-w-3xl">
        <h2 className="landing-heading text-3xl text-[var(--landing-linen)] lg:text-[2.625rem]">
          Curadores independentes.
        </h2>
        <p className="landing-body mt-7 text-lg text-[var(--landing-linen)]/85">
          Os médicos que apresentamos passam por aprovação própria e prévia. Nenhum profissional paga para estar aqui.
        </p>

        <div className="mt-12 rounded-[var(--radius-card)] border border-[var(--landing-linen)]/15 bg-[var(--landing-linen)]/6 p-8 lg:p-10">
          <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--landing-linen)]/65">
            O que não fazemos
          </h3>
          <p className="landing-body mt-5 text-[var(--landing-linen)]/88">
            Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres
            — prometemos um processo sério.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}
