import { Clock, HeartHandshake, ScanSearch } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";

// Camada de Configuração do Portal (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §1) — física + conteúdo de cada parada, dado puro, sem nenhuma lógica de
// motor. Extraído de portal-experience.tsx (Playbook, Etapa 0/PR1) sem
// nenhuma mudança de comportamento, texto ou física.

// Fase 6 (Origem Emocional) — cada carta nasce de uma necessidade real de
// quem chega, verificada contra o comportamento real do produto antes de
// ser escrita (nunca uma afirmação além do que o sistema realmente
// garante): status traduzido ao paciente já existe (carta 1); a história
// nunca precisa ser recontada, embora só a curadoria interna a leia, nunca
// o profissional de saúde final (carta 2, redação deliberadamente não
// nomeia quem lê); acompanhamento existe a cada etapa, mas a continuidade
// de "uma única pessoa" do início ao fim não é garantida pelo sistema hoje
// (carta 3, por isso fala em "apoio disponível", não em "alguém" fixo).
const BENEFITS: Array<{ icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; description: string }> = [
  { icon: Clock, title: "Você sabe o que vem a seguir", description: "Cada etapa é explicada antes de acontecer — para você nunca ficar perdido no meio do caminho." },
  {
    icon: ScanSearch,
    title: "Você conta sua história uma vez",
    description: "O que você compartilha acompanha a análise do seu caso — sem precisar repetir do zero.",
  },
  {
    icon: HeartHandshake,
    title: "Você encontra acompanhamento em cada etapa",
    description: "Do primeiro contato à conversa que importa, sempre com apoio disponível.",
  },
];

// Fase 6 — "verificadas" foi trocado por "organizados/reunidos": o schema
// real (professional_documents) não tem status formal de aprovação, só
// upload administrado pela equipe. A carta de conduta original ("Ética e
// conduta") não era sustentada por nenhum campo do sistema (nenhum
// histórico/incidente/revalidação existe) — substituída pela Revisão
// Humana obrigatória (P009), que é o pilar de confiança mais forte e
// melhor documentado do produto real ("a IA nunca decide sozinha", Kernel
// seção 6).
const CRITERIA: Array<{ title: string; description: string }> = [
  {
    title: "Perfis organizados com cuidado",
    description: "Formação, experiência e área de atuação de cada profissional são reunidas pela nossa equipe — nunca um perfil solto ou incompleto.",
  },
  {
    title: "Uma pessoa revisa antes de chegar até você",
    description: "Nenhuma indicação segue adiante sem a revisão de alguém da nossa equipe.",
  },
  {
    title: "Pensado para o seu caso",
    description: "Nunca um encaixe genérico — a indicação considera a sua situação real, não uma lista pronta.",
  },
];

const CONTINUACAO = ["Seleção dos profissionais", "Agendamento", "Atendimento"] as const;

export type Frame = {
  id: string;
  /** Emoção protegida por esta parada (documentação — Regra Zero). */
  emocao: string;
  /** Altura da parada — nunca uniforme: paradas de passagem (Respiro) são
   *  breves; paradas de permanência (Curadoria) sustentam mais tempo. */
  heightVh: number;
  content: ReactNode | null;
  /** Origem do calor ambiente (0-100%, percentual do palco) — interpolada
   *  continuamente pelo Motor da Caminhada, nunca salta entre paradas. */
  lightX: number;
  lightY: number;
  /** Intensidade da presença/cuidado (0-1) — cresce conforme a jornada se
   *  aprofunda emocionalmente, não geometricamente. */
  intensidade: number;
  /** Temperatura do ambiente (-1 fria a 1 quente) — canal independente,
   *  com a própria inércia, propositalmente dessincronizado da luz. */
  warmth: number;
  /** Compactação espacial (0-1) — o quanto o ambiente se torna mais
   *  íntimo e próximo conforme o cuidado se aprofunda. */
  compact: number;
  /** Capítulo 4/5 — Platô do Respiro: quando true, o Motor da Caminhada
   *  mantém os alvos travados nos próprios valores desta parada durante
   *  toda a sua extensão (nunca interpola em direção à próxima), criando
   *  um patamar real — início e fim da parada chegam ao mesmo estado.
   *  A transição para a parada seguinte só recomeça no limite da parada
   *  seguinte, com a mesma inércia de sempre — nunca um salto instantâneo. */
  holdEntireSpan?: boolean;
};

// PORTAL DA ALIVIAR — a arquitetura do acolhimento, não de um edifício.
// Cada elemento existe para proteger uma emoção específica (Regra Zero):
// Chegada → Alívio · Respiro → Permissão para desacelerar · Triagem →
// Segurança para falar · Análise → Confiança · Curadoria → Companhia e
// cuidado · (Biblioteca e Convite vivem em componentes próprios, adiante
// na página). O cenário nunca troca de figura — é a mesma fotografia do
// início ao fim — e nunca se comporta como "foto com efeitos por cima":
// a luz é calor ambiente, nunca um holofote; as bordas são um
// esmaecimento orgânico e morno, nunca uma barra de interface.
export const FRAMES: Frame[] = [
  {
    id: "chegada",
    emocao: "Alívio — nada aqui exige justificativa, cadastro ou decisão imediata.",
    heightVh: 100,
    lightX: 50,
    lightY: 30,
    intensidade: 0.12,
    warmth: 0.35,
    compact: 0,
    content: (
      <div className="flex flex-col items-center gap-4">
        <SectionEyebrow>Curadoria médica independente</SectionEyebrow>
        <h1 className="max-w-reading font-serif text-4xl font-semibold leading-[1.1] text-ink lg:text-5xl">
          Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
        </h1>
        <LinkButton href="/sua-historia" variant="primary">
          Contar minha história
        </LinkButton>
      </div>
    ),
  },
  // Respiro — sem copy própria: a emoção protegida aqui é a permissão de
  // desacelerar. Para nunca ler como vazio, é o próprio calor ambiente que
  // se aprofunda de forma perceptível (ainda que lenta) nesta parada — o
  // conteúdo do momento é essa transformação sutil, não uma ausência.
  {
    id: "respiro",
    emocao: "Permissão para desacelerar — sem pressa, sem vazio, sem travamento.",
    heightVh: 55,
    content: null,
    lightX: 46,
    lightY: 34,
    intensidade: 0.34,
    warmth: 0.4,
    compact: 0.08,
    // Platô real (Capítulo 5): o ambiente chega aqui e permanece, nunca
    // avança perceptivelmente em direção à Triagem durante esta parada.
    holdEntireSpan: true,
  },
  {
    id: "triagem",
    emocao: "Segurança para falar — nunca formulário, entrevista ou avaliação.",
    heightVh: 85,
    lightX: 42,
    lightY: 36,
    intensidade: 0.42,
    warmth: 0.32,
    compact: 0.14,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Triagem</p>,
  },
  {
    id: "analise",
    emocao: "Confiança — nunca processo automático, frio ou genérico.",
    heightVh: 90,
    lightX: 58,
    lightY: 37,
    intensidade: 0.52,
    warmth: 0.22,
    compact: 0.2,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Análise do caso</p>,
  },
  {
    id: "curadoria",
    emocao: "Companhia e cuidado — nunca catálogo, comparação comercial ou automação impessoal.",
    heightVh: 110,
    lightX: 50,
    lightY: 38,
    intensidade: 0.6,
    warmth: 0.28,
    compact: 0.26,
    // Fase 6 (Origem Emocional) — de rótulo de duas palavras ("Curadoria
    // técnica") para uma frase que nasce da dúvida real de quem chega
    // ("como vocês vão encontrar alguém adequado ao meu caso?"). Sem
    // nomear "alguém" especificamente (o produto real não garante, com
    // certeza, o momento exato em que um humano lê o caso versus quando
    // o pipeline do ACE processa) — só a sequência garantida
    // estruturalmente: entendimento sempre antes de qualquer caminho.
    content: (
      <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">
        O seu caso é entendido antes de qualquer caminho aparecer.
      </p>
    ),
  },
  {
    id: "beneficios",
    emocao: "Companhia e cuidado (continuação) — o que a curadoria concretamente oferece.",
    heightVh: 110,
    lightX: 40,
    lightY: 40,
    intensidade: 0.68,
    warmth: 0.34,
    compact: 0.32,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-3">
            <benefit.icon className="mt-1 size-4 shrink-0 text-brand-sage" aria-hidden={true} />
            <div>
              <p className="font-serif text-base font-semibold text-ink">{benefit.title}</p>
              <p className="text-sm text-ink-muted">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "confianca",
    emocao: "Companhia e cuidado (continuação) — o critério por trás da curadoria, sem parecer avaliação fria.",
    heightVh: 110,
    lightX: 60,
    lightY: 41,
    intensidade: 0.76,
    warmth: 0.2,
    compact: 0.38,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {CRITERIA.map((criterion) => (
          <div key={criterion.title}>
            <p className="font-serif text-base font-semibold text-ink">{criterion.title}</p>
            <p className="text-sm text-ink-muted">{criterion.description}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "continuacao",
    emocao: "Companhia e cuidado (continuação) — o que acontece depois de escolhido o caminho.",
    heightVh: 85,
    lightX: 50,
    lightY: 43,
    intensidade: 0.82,
    warmth: 0.3,
    compact: 0.34,
    // Ponte narrativa (Fase 1 do Masterplan V1.1): a Continuação deixa de
    // ser uma lista solta de etapas e passa a fechar o arco da Curadoria —
    // uma frase de abertura torna os três passos reais concretos, uma
    // frase de fechamento reconhece que dúvidas ainda podem existir, sem
    // nomear a Biblioteca (isso é Presença Residual, Fase 2). Hierarquia
    // deliberadamente menor que a Chegada e o CTA final (Progressão
    // Hierárquica) — a moldura nunca compete com os extremos da jornada.
    content: (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-xl font-medium leading-snug text-ink lg:text-2xl">
          O que vem depois já tem forma.
        </p>
        <ul className="flex flex-col gap-1.5">
          {CONTINUACAO.map((stage) => (
            <li key={stage} className="font-serif text-lg text-ink">
              {stage}
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">E, se ainda houver dúvidas, há espaço para elas também.</p>
      </div>
    ),
  },
];

// Vídeo Companheiro — acompanha o visitante durante Triagem, Análise e o
// início da Curadoria (frames 2-4). Começa a se despedir ao entrar na
// Curadoria plena (frame 4) e termina de sair ao longo de Benefícios
// (frame 5) — nunca um corte, sempre conduzido pelo progresso real do
// scroll. Nunca é tutorial, apresentador ou vendedor: só companhia.
export const VIDEO_EXIT_AT_FRAME = 5;
