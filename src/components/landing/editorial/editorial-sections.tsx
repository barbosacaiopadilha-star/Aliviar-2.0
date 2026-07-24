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
        <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
          Escolher um médico virou um problema de navegação.
        </h2>
        <p className="landing-body mx-auto mt-5 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Existem bons médicos e informação de sobra. O que falta é alguém do seu lado na hora de decidir.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PROBLEMA_CARDS.map((card) => (
          <LandingCard key={card.title} className="landing-fade-in">
            <h3 className="font-serif text-xl font-semibold">{card.title}</h3>
            <p className="landing-body mt-3 text-[var(--color-ink-muted)]">{card.text}</p>
          </LandingCard>
        ))}
      </div>
    </LandingSection>
  );
}

export function MetodoSection() {
  return (
    <LandingSection variant="white" atmosphere="landingAtrium">
      <div className="mx-auto max-w-3xl text-center">
        <LandingEyebrow>O Método</LandingEyebrow>
        <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
          Nós nunca perguntamos &ldquo;qual é o melhor médico?&rdquo;
        </h2>
        <p className="landing-body mx-auto mt-5 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Perguntamos algo mais útil: entre os médicos aprovados pelo nosso rigor técnico, quais combinam com o que{" "}
          <em>você</em> definiu como importante?
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {METODO_PILARES.map((pilar) => (
          <LandingCard key={pilar.title} className="text-center">
            <h3 className="font-serif text-2xl font-semibold">{pilar.title}</h3>
            <p className="landing-body mt-3 text-[var(--color-ink-muted)]">{pilar.text}</p>
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
        <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
          Do primeiro contato à escolha.
        </h2>
      </div>

      <ol className="mx-auto mt-14 max-w-2xl space-y-6">
        {PASSOS.map((passo, index) => (
          <li key={passo.title} className="landing-card flex gap-5 p-6 lg:p-7">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-forest)] font-serif text-sm font-semibold text-[var(--landing-linen)]"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="font-serif text-xl font-semibold">{passo.title}</h3>
              <p className="landing-body mt-2 text-[var(--color-ink-muted)]">{passo.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}

export function PrioridadesSection() {
  return (
    <LandingSection variant="white" atmosphere="landingAtrium">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
          Suas prioridades, nas suas palavras.
        </h2>
        <p className="landing-body mx-auto mt-5 max-w-2xl text-lg text-[var(--color-ink-muted)]">
          Nada é presumido ou herdado de casos parecidos. Você distribui pesos e confirma o retrato do que importa.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-xl">
        <LandingCard className="space-y-6">
          {PRIORIDADES.map((item) => (
            <div key={item.label} className="border-b border-[var(--color-border)] pb-6 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{item.label}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{item.pts} pts</span>
              </div>
              <p className="landing-body mt-2 text-sm italic text-[var(--color-ink-muted)]">
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
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
            Um documento para reler com calma.
          </h2>
          <p className="landing-body mt-5 text-lg text-[var(--color-ink-muted)]">
            Suas prioridades, as três opções, o que cada caminho oferece e o que custa — em linguagem simples. Para
            reler com a família ou levar à consulta.
          </p>
        </div>

        <LandingCard>
          <h3 className="font-serif text-xl font-semibold">Sua Jornada</h3>
          <p className="landing-body mt-3 text-[var(--color-ink-muted)]">
            Quem está cuidando, em que ponto está e quando terá notícia. Sempre com nome e data.
          </p>
          <div className="mt-6 space-y-4 border-t border-[var(--color-border)] pt-6">
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
        <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight text-[var(--landing-linen)] lg:text-4xl">
          Curadores independentes.
        </h2>
        <p className="landing-body mt-5 text-lg text-[var(--landing-linen)]/80">
          Os médicos que apresentamos passam por aprovação própria e prévia. Nenhum profissional paga para estar aqui.
        </p>

        <div className="mt-10 rounded-2xl border border-[var(--landing-linen)]/15 bg-[var(--landing-linen)]/5 p-6 lg:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-linen)]/70">
            O que não fazemos
          </h3>
          <p className="landing-body mt-4 text-[var(--landing-linen)]/85">
            Não damos diagnóstico, não escolhemos por você, não vendemos posição em ranking e não prometemos milagres
            — prometemos um processo sério.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}
