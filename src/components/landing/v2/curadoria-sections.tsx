import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";

// LANDING 2.0 — SEÇÕES DA CURADORIA (MISSÃO 201, ADR-033)
//
// Perfil de Prioridades → Curadoria Compartilhada → Relatório.
// Mostra o processo, nunca a arquitetura. O exemplo de pesos é declarado
// como exemplo — nenhum dado fictício apresentado como real
// (PRODUCT_VISION, "o que nunca faremos").
//
// Rastreabilidade: Fundamentos §10 (Perfil de Prioridades), §11
// (Compatibilidade), §12 (Decisão Compartilhada); Ontologia §3.4, §3.6;
// Experiência §Momento 4 (a confiança nasce quando o paciente corrige) e
// §Momento 8 (três caminhos, nunca ranking); Experience Bible §2.3.

// ---------------------------------------------------------------------------
// 6. Perfil de Prioridades
// ---------------------------------------------------------------------------

// Exemplo ilustrativo, declarado como tal na própria seção.
const EXAMPLE_WEIGHTS = [
  {
    label: "Acompanhamento contínuo",
    weight: 40,
    quote: "“Não quero recomeçar do zero com outra pessoa.”",
  },
  {
    label: "Experiência",
    weight: 35,
    quote: "“Queria alguém que já tivesse visto muitos casos como o meu.”",
  },
  {
    label: "Começar logo",
    weight: 25,
    quote: "“Se demorar demais para marcar, eu desisto. Eu me conheço.”",
  },
] as const;

export function PrioridadesSection() {
  return (
    <SectionContainer className="landing-section landing-bg-parchment">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionReveal className="max-w-reading space-y-5">
            <SectionEyebrow align="left">Perfil de Prioridades</SectionEyebrow>
            <h2 className="landing-heading text-3xl lg:text-4xl">
              Suas prioridades ganham forma — nas suas palavras.
            </h2>
            <p className="landing-lead">
              Junto com seu Curador, você distribui cem pontos entre o que importa para você. Cada
              peso nasce de algo que você disse — e fica registrado com a sua fala ao lado, para que
              você se reconheça nele.
            </p>
            <p className="landing-lead">
              Nada é presumido, nada vem preenchido, nada é herdado de &ldquo;casos parecidos&rdquo;.
              E nada avança sem você confirmar que aquele retrato é seu.
            </p>
          </SectionReveal>

          <SectionReveal delayMs={100} className="landing-panel-soft p-7 lg:p-9">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
              Um exemplo de como fica
            </p>
            <ul className="mt-5 space-y-6">
              {EXAMPLE_WEIGHTS.map((entry) => (
                <li key={entry.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{entry.label}</span>
                    <span className="tabular-nums font-serif text-lg font-semibold text-brand-primary-deep">
                      {entry.weight} pontos
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60"
                  >
                    <div
                      className="h-full rounded-full bg-brand-sage"
                      style={{ width: `${entry.weight}%` }}
                    />
                  </div>
                  <p className="mt-2 border-l-2 border-brand-gold/50 pl-2 text-xs italic leading-relaxed text-ink-muted">
                    {entry.quote}
                  </p>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 7. Curadoria Compartilhada
// ---------------------------------------------------------------------------

export function CompartilhadaSection() {
  return (
    <SectionContainer className="landing-section landing-bg-linen">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-5">
          <SectionEyebrow>Curadoria Compartilhada</SectionEyebrow>
          <h2 className="landing-heading text-3xl lg:text-4xl">
            Compartilhada porque ninguém decide sozinho — nem você, nem nós.
          </h2>
          <p className="text-base leading-relaxed text-ink-muted">
            Você traz o que só você sabe: sua história, seus limites, o que importa. Seu Curador traz
            o que você não precisa saber: como analisar, comparar e explicar. A soma dessas duas
            competências é a Curadoria — e a escolha final continua inteiramente com você.
          </p>
        </SectionReveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {(
            [
              {
                title: "Três caminhos, nunca um vencedor",
                text: "As opções não vêm em ordem de melhor para pior. São três caminhos diferentes, todos legítimos.",
              },
              {
                title: "Cada opção diz o que custa",
                text: "Nenhuma é apresentada só com virtudes. Você sempre sabe o que ganha e o que abre mão em cada uma.",
              },
              {
                title: "Explicado pelos seus critérios",
                text: "As diferenças são explicadas pelo que você definiu como importante — nunca por qualidade abstrata.",
              },
            ] as const
          ).map((item, index) => (
            <SectionReveal
              key={item.title}
              delayMs={index * 80}
              className="landing-panel p-7"
            >
              <h3 className="font-sans text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-[1.7] text-ink-muted">{item.text}</p>
            </SectionReveal>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 8. Relatório
// ---------------------------------------------------------------------------

export function RelatorioSection() {
  return (
    <SectionContainer className="landing-section landing-bg-parchment">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionReveal className="max-w-reading space-y-5 lg:order-2">
            <SectionEyebrow align="left">O Relatório</SectionEyebrow>
            <h2 className="landing-heading text-3xl lg:text-4xl">
              Um documento para reler com calma — e com quem você quiser.
            </h2>
            <p className="landing-lead">
              Seu Curador apresenta as três opções pessoalmente, explica as diferenças e responde
              suas dúvidas. Depois da conversa, o Relatório fica com você: suas prioridades, as três
              opções, o que cada uma oferece e o que cada uma custa — em linguagem simples, sem
              jargão.
            </p>
            <p className="landing-lead">
              É o tipo de documento que você pode mostrar para a família, levar para o médico
              escolhido, e entender sozinho seis meses depois.
            </p>
          </SectionReveal>

          <SectionReveal delayMs={100} className="lg:order-1">
            <div className="landing-panel-soft space-y-3 p-7 lg:p-9">
              {(
                [
                  "Suas prioridades, com as suas palavras",
                  "Três opções com a mesma estrutura e o mesmo cuidado",
                  "O que cada caminho oferece — e o que cada um custa",
                  "Perguntas sugeridas para a primeira consulta",
                ] as const
              ).map((line) => (
                <div key={line} className="landing-panel-inset flex items-baseline gap-3 p-4">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  <p className="text-sm leading-relaxed text-ink">{line}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </div>
    </SectionContainer>
  );
}
