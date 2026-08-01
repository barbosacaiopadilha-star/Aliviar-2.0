import Link from "next/link";

import { ExpandableSection } from "@/components/paciente/experiencia/expandable-section";
import { cn } from "@/components/ui/cn";

/**
 * JourneyWalk — a jornada como caminhada, não como lista de tarefas.
 *
 * A régua anterior mostrava sete caixas com descrição, estado e ação: sete
 * ideias competindo na mesma tela. Aqui a etapa atual recebe a palavra e as
 * demais viram marcas discretas no caminho — passado à esquerda, futuro à
 * direita, sem nenhuma parecer pendência cobrada.
 *
 * Acessibilidade: `ol` com `aria-current="step"` na etapa atual; cada marca
 * carrega o estado em texto para leitor de tela, nunca só em cor ou forma.
 */
export type WalkStage = {
  id: string;
  label: string;
  status: "done" | "current" | "ahead";
  /**
   * Para onde esta etapa leva. Ausente = etapa que ainda não tem superfície
   * própria; ela continua legível, mas não vira link para lugar nenhum —
   * navegar para uma tela que não existe é pior que não navegar.
   */
  href?: string;
};

const STATUS_LABEL: Record<WalkStage["status"], string> = {
  done: "concluída",
  current: "etapa atual",
  ahead: "ainda por vir",
};

/**
 * O "como funciona" reabrigado — Narrativa §8 / Travessia §9.2.
 *
 * Este conteúdo vivia em /portal-paciente/como-funciona e ficou sem endereço
 * quando o redirect 301 apontou tudo para /paciente. A caminhada é o lugar
 * natural dele: quem quer saber o que acontece em cada etapa pergunta aqui.
 * É explicação breve, progressiva e opcional — ela segue sem abrir.
 */
const COMO_E_FEITA = [
  {
    titulo: "Sua história",
    texto:
      "Seu Curador escuta tudo antes de organizar qualquer coisa, e devolve organizado até você reconhecer: “é exatamente isso”.",
    quem: "Você e seu Curador",
  },
  {
    titulo: "O que precisa ser decidido",
    texto:
      "A conversa vira material de trabalho: o que é necessidade, o que é limite, o que é receio. Nada é acrescentado além do que você disse.",
    quem: "Seu Curador",
  },
  {
    titulo: "Suas prioridades",
    texto:
      "Cada aspecto do cuidado recebe o nível de importância que você deu a ele na conversa. Nada avança até você confirmar que esse retrato é o seu.",
    quem: "Você decide, seu Curador registra",
  },
  {
    titulo: "A análise",
    texto:
      "Para cada profissional já aprovado pela Aliviar, registra-se o que foi confirmado, o que não foi e o que ainda não se sabe — sem nota, sem classificação, sem lista do melhor.",
    quem: "Seu Curador, apoiado pela organização do sistema",
  },
  {
    titulo: "Os três caminhos",
    texto:
      "Seu Curador escolhe três caminhos e escreve, para cada um, por que ele está ali, o que oferece e o que custa. A escolha dos três é dele — nunca do sistema.",
    quem: "Seu Curador",
  },
  {
    titulo: "A apresentação",
    texto:
      "As opções são sempre apresentadas por uma pessoa, que explica as diferenças e responde suas dúvidas. A decisão final é exclusivamente sua.",
    quem: "Você e seu Curador",
  },
] as const;

const TRES_COISAS = [
  "Nenhum profissional paga para estar na nossa rede, nem para aparecer entre os seus caminhos.",
  "Nenhuma opção é escolhida por um sistema — a seleção é sempre de uma pessoa, com nome.",
  "A decisão final é sua, no seu tempo. Não existe prazo para você responder.",
] as const;

export function JourneyWalk({
  stages,
  currentDetail,
  curatorName,
}: {
  stages: WalkStage[];
  /** O que está acontecendo agora — a única frase desta seção. */
  currentDetail?: string;
  /** Quem conduz — assina o "como é feita". Ausente, a explicação não abre. */
  curatorName?: string;
}) {
  const current = stages.find((stage) => stage.status === "current");

  return (
    <section aria-labelledby="patient-walk-title" className="patient-walk">
      <h2 id="patient-walk-title" className="patient-section-title">
        Sua jornada
      </h2>

      <ol className="patient-walk__track">
        {stages.map((stage) => (
          <li
            key={stage.id}
            aria-current={stage.status === "current" ? "step" : undefined}
            className={cn("patient-walk__step", `patient-walk__step--${stage.status}`)}
          >
            <span className="patient-walk__dot" aria-hidden="true" />
            {/* A linha do tempo navega; o painel resume. Um não substitui o
                outro. Etapa sem destino continua legível como texto. */}
            {stage.href ? (
              <Link href={stage.href} className="patient-walk__label patient-walk__link">
                {stage.label}
                <span className="sr-only">, {STATUS_LABEL[stage.status]}</span>
              </Link>
            ) : (
              <>
                <span className="patient-walk__label">{stage.label}</span>
                <span className="sr-only">, {STATUS_LABEL[stage.status]}</span>
              </>
            )}
          </li>
        ))}
      </ol>

      {current ? (
        <p className="patient-body mt-5 max-w-xl text-[var(--color-ink-muted)]">
          <span className="font-medium text-[var(--patient-ink)]">{current.label}.</span>{" "}
          {currentDetail}
        </p>
      ) : null}

      {curatorName ? (
        <ExpandableSection
          className="mt-6"
          label="Como sua Curadoria é feita"
          expandedLabel="Recolher"
        >
          <div className="max-w-2xl space-y-6">
            <ol className="space-y-5">
              {COMO_E_FEITA.map((passo) => (
                <li key={passo.titulo} className="space-y-1.5">
                  <h3 className="font-serif text-base font-medium text-[var(--patient-ink)]">
                    {passo.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {passo.texto}
                  </p>
                  <p className="text-xs font-medium text-[var(--color-brand-sage)]">{passo.quem}</p>
                </li>
              ))}
            </ol>

            <div className="border-t border-[var(--color-border)] pt-5">
              <h3 className="font-serif text-base font-medium text-[var(--patient-ink)]">
                Três coisas que nunca mudam
              </h3>
              <ul className="mt-3 space-y-2">
                {TRES_COISAS.map((coisa) => (
                  <li key={coisa} className="text-sm leading-relaxed text-[var(--patient-ink)]">
                    {coisa}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-[var(--color-ink-muted)]">
              Sua Curadoria está sendo conduzida por {curatorName}.
            </p>
          </div>
        </ExpandableSection>
      ) : null}
    </section>
  );
}
