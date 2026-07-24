/**
 * Minha Jornada — a linha do tempo das sete etapas (Tela 1, MISSÃO 205).
 *
 * @metodo Experience §2.4 — mostra-se trabalho humano, nunca processamento: quem, o quê, quando
 * @metodo Experience §5 — UX2: a pessoa nunca precisa lembrar onde está; UX3: próximo passo sempre visível
 * @metodo Jornada §4 — o Portal do Paciente nunca mostra etapa vazia e sempre demonstra evolução
 * @metodo Fundamentos §13 — P12: a complexidade nunca chega ao paciente
 *
 * Por que existe: o paciente nunca deve precisar perguntar "em que etapa está
 * minha Curadoria?". Esta tela responde isso o tempo inteiro — cada etapa diz
 * o que aconteceu, quando, quem responde por ela, e de quem é a próxima ação.
 *
 * O que nunca faz: mostrar percentual de conclusão, barra que anda sozinha,
 * "processando", ou uma etapa futura como caixa cinza vazia. Uma etapa que
 * ainda não chegou diz o que vai acontecer.
 */

import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import type { Jornada, JornadaStage, JornadaStageStatus } from "@/modules/curadoria/jornada";

const statusLabels: Record<JornadaStageStatus, string> = {
  CONCLUIDA: "Concluída",
  EM_ANDAMENTO: "Acontecendo agora",
  AGUARDANDO_VOCE: "Sua vez",
  A_CAMINHO: "A caminho",
};

const markerClasses: Record<JornadaStageStatus, string> = {
  CONCLUIDA: "border-brand-sage bg-brand-sage",
  EM_ANDAMENTO: "border-brand-primary bg-brand-primary",
  AGUARDANDO_VOCE: "border-brand-gold bg-brand-gold",
  A_CAMINHO: "border-border bg-surface",
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function StageRow({ stage, isLast }: { stage: JornadaStage; isLast: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Fio contínuo entre as etapas — a jornada é uma história, não uma
          lista de itens soltos. */}
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="absolute left-[7px] top-5 h-full w-px bg-border"
        />
      )}
      <span
        aria-hidden="true"
        className={cn("relative mt-1.5 size-[15px] shrink-0 rounded-full border-2", markerClasses[stage.status])}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3
            className={cn(
              "font-sans text-base",
              stage.status === "A_CAMINHO" ? "text-ink-muted" : "font-medium text-ink",
            )}
          >
            {stage.label}
          </h3>
          <span className="text-xs uppercase tracking-wide text-ink-muted">
            {statusLabels[stage.status]}
          </span>
        </div>

        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{stage.description}</p>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-ink-muted">
          {stage.updatedAt ? <span>Atualizado em {formatDay(stage.updatedAt)}</span> : null}
          <span>Com {stage.responsible}</span>
        </div>

        {stage.nextAction ? (
          <p className="mt-2 text-sm">
            {stage.nextAction.owner === "VOCE" ? (
              <span className="font-medium text-brand-primary-deep">
                {stage.nextAction.label}
              </span>
            ) : (
              // Ação da equipe nunca vira botão para o paciente — ele acompanha,
              // não executa.
              <span className="text-ink-muted">{stage.nextAction.label}</span>
            )}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function JornadaTimeline({ jornada }: { jornada: Jornada }) {
  return (
    <Card padding="lg">
      <ol className="relative">
        {jornada.stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isLast={index === jornada.stages.length - 1}
          />
        ))}
      </ol>
    </Card>
  );
}
