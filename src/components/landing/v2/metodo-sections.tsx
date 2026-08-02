import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";

// LANDING 2.0 — SEÇÕES DO MÉTODO (MISSÃO 201, ADR-033)
//
// O problema → O Método Aliviar → Como funciona → Como tomamos decisões.
// Toda a comunicação reforça Método, Curadoria, Critério e Decisão
// Compartilhada — nenhum discurso baseado em IA, nenhum mecanismo interno
// nomeado (LANDING_CREATIVE_DIRECTION §2, preservado pela ADR-033).
//
// Rastreabilidade: Fundamentos §2 (o problema real), §5.3 (a pergunta certa),
// §9 (Curadoria Compartilhada); Experiência §Momento 2 (o Método em três
// frases); Experience Bible §7 (voz da Landing: reconhece, não convence).

// ---------------------------------------------------------------------------
// 2. O problema
// ---------------------------------------------------------------------------

const OBSTACLES = [
  {
    title: "Opções demais, critério de menos",
    text: "Listas, notas e anúncios não dizem o que importa: se aquele médico faz sentido para a sua situação.",
  },
  {
    title: "Informação que ninguém traduz",
    text: "Currículo, titulação, tempo de experiência — dados difíceis de interpretar sozinho, no momento em que você menos tem energia para isso.",
  },
  {
    title: "Recomendações que são anúncios",
    text: "Em muitos lugares, quem aparece primeiro é quem pagou mais. Você sente que está sendo empurrado — e está.",
  },
  {
    title: "A pior hora para decidir sozinho",
    text: "Medo, dor e pressa são maus conselheiros. E é exatamente nesse estado que a decisão costuma ser exigida.",
  },
] as const;

export function ProblemaSection() {
  return (
    <SectionContainer className="bg-canvas">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-4">
          <SectionEyebrow>O problema</SectionEyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
            Escolher um médico virou um problema de navegação — não de medicina.
          </h2>
          <p className="text-base leading-relaxed text-ink-muted">
            Existem bons médicos. Existe informação de sobra. O que falta é alguém do seu lado na
            hora de decidir.
          </p>
        </SectionReveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {OBSTACLES.map((obstacle, index) => (
            <SectionReveal
              key={obstacle.title}
              delayMs={index * 80}
              className="rounded-md border border-border bg-surface p-6"
            >
              <h3 className="font-sans text-base font-semibold text-ink">{obstacle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{obstacle.text}</p>
            </SectionReveal>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 3. O Método Aliviar
// ---------------------------------------------------------------------------

export function MetodoSection() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-4">
          <SectionEyebrow>O Método Aliviar</SectionEyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
            Nós nunca perguntamos &ldquo;qual é o melhor médico?&rdquo;
          </h2>
          <p className="text-base leading-relaxed text-ink-muted">
            Perguntamos algo mais útil: entre os médicos que a Aliviar já aprovou por critério
            próprio, quais combinam com o que <em>você</em> definiu como importante? A diferença
            entre essas duas perguntas é o Método inteiro.
          </p>
        </SectionReveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {(
            [
              {
                who: "Você",
                does: "conta sua história, define o que importa e faz a escolha final.",
              },
              {
                who: "Seu Curador",
                does: "conduz a conversa, transforma sua história em critérios e apresenta três caminhos explicados.",
              },
              {
                who: "A tecnologia",
                does: "organiza, registra e compara — em silêncio, como apoio. Nunca decide nada por ninguém.",
              },
            ] as const
          ).map((role, index) => (
            <SectionReveal
              key={role.who}
              delayMs={index * 80}
              className="rounded-md border-t-2 border-[color-mix(in_srgb,var(--color-brand-gold)_60%,transparent)] bg-canvas p-6"
            >
              <h3 className="font-serif text-xl font-semibold text-brand-primary-deep">{role.who}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink">{role.does}</p>
            </SectionReveal>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 4. Como funciona
// ---------------------------------------------------------------------------

const JOURNEY_STEPS = [
  {
    title: "Você conta sua história",
    text: "Uma conversa de verdade, com uma pessoa da equipe — nunca um formulário. No seu ritmo.",
  },
  {
    title: "Vocês definem o que importa",
    text: "Seu Curador ajuda você a descobrir e a nomear suas prioridades. Elas ficam registradas com as suas palavras.",
  },
  {
    title: "Você confirma",
    text: "Nada avança sem você reconhecer: “é isso que importa para mim”. Esse é o combinado que orienta todo o resto.",
  },
  {
    title: "A equipe analisa com calma",
    text: "Seu Curador estuda os médicos já aprovados pela Aliviar à luz das suas prioridades. Você sabe quem está cuidando e quando terá notícia.",
  },
  {
    title: "Você recebe três opções explicadas",
    text: "Três caminhos legítimos, apresentados pessoalmente — com o que cada um oferece e o que cada um custa. Nunca um ranking.",
  },
  {
    title: "Você escolhe — e seguimos juntos",
    text: "A decisão é sua, no seu tempo. Depois dela, a Aliviar continua por perto.",
  },
] as const;

export function ComoFuncionaSection() {
  return (
    <SectionContainer className="bg-canvas">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-4">
          <SectionEyebrow>Como funciona</SectionEyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
            Um caminho claro, do primeiro contato à escolha.
          </h2>
        </SectionReveal>

        <ol className="mt-10 space-y-0">
          {JOURNEY_STEPS.map((step, index) => (
            <SectionReveal key={step.title} delayMs={index * 60}>
              <li className="relative flex gap-5 border-l-2 border-[color-mix(in_srgb,var(--color-brand-sage)_40%,transparent)] pb-8 pl-6 last:border-transparent last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[9px] top-1 size-4 rounded-full border-2 border-brand-sage bg-canvas"
                />
                <div className="max-w-reading">
                  <h3 className="font-sans text-base font-semibold text-ink">
                    <span className="mr-2 font-serif text-brand-primary-deep">{index + 1}.</span>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                </div>
              </li>
            </SectionReveal>
          ))}
        </ol>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 5. Como tomamos decisões — seção inédita (MISSÃO 201)
// ---------------------------------------------------------------------------

const DECISION_LINES = [
  { who: "Você define as prioridades.", detail: "O que pesa mais é sempre decidido por você — nunca presumido." },
  { who: "O Curador conduz.", detail: "Uma pessoa experiente organiza a conversa e a análise, do início ao fim." },
  { who: "O sistema organiza.", detail: "Registra, compara e documenta — para que nada se perca. Só isso." },
  { who: "Você escolhe.", detail: "Entre três opções explicadas, qualquer uma é uma escolha legítima." },
] as const;

export function ComoDecidimosSection() {
  return (
    <SectionContainer className="bg-[linear-gradient(165deg,_var(--color-brand-primary-deep)_0%,_var(--color-brand-primary)_100%)]">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-4">
          <SectionEyebrow tone="dark">Como tomamos decisões</SectionEyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
            Cada decisão tem um dono — e nenhuma é do software.
          </h2>
          <p className="text-base leading-relaxed text-[color-mix(in_srgb,var(--color-bg-surface)_85%,transparent)]">
            Essa divisão não é um detalhe: é a diferença entre receber uma recomendação e construir
            uma decisão.
          </p>
        </SectionReveal>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {DECISION_LINES.map((line, index) => (
            <SectionReveal
              key={line.who}
              delayMs={index * 80}
              className="rounded-md border border-[color-mix(in_srgb,var(--color-bg-surface)_15%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-surface)_5%,transparent)] p-6"
            >
              <h3 className="font-serif text-lg font-semibold text-brand-gold">{line.who}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-bg-surface)_85%,transparent)]">{line.detail}</p>
            </SectionReveal>
          ))}
        </ol>
      </div>
    </SectionContainer>
  );
}
