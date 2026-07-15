// Motor de Presença Contínua (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §2, motor 6) — sustenta os sinais que atravessam toda a jornada do
// Portal sem representar progresso: a respiração do ambiente e o pulso
// do Fio Dourado. Função pura, sem memória: `breath` é uma função direta
// do relógio (`now`), sem amortecimento; não há valor anterior a
// lembrar.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 6) — mesma
// matemática exata, só relocada.
//
// Achado real, não corrigido: apesar do comentário original do Fio
// Dourado dizer que ele "reflete a luz da sala", o código real nunca
// usa `state.intensidade`/`warmth` do Motor de Ambiente para calcular
// `threadOpacity` — só `breath`. Extraí o que o código realmente faz,
// não o que o comentário sugere; registrado aqui, não silenciosamente
// "corrigido" para bater com o comentário.
//
// Regra semântica preservada: o Fio Dourado nunca representa progresso,
// etapa ou porcentagem — `threadOpacity` é só um pulso de respiração,
// nunca ligado a `overall` nem a quantidade de paradas.
const BREATH_PERIOD_MS = 9000;
const BREATH_AMPLITUDE = 0.015;

export type ContinuousPresenceState = {
  /** Oscilação lentíssima e mínima, independente do scroll — impede o
   *  ambiente de parecer congelado mesmo parado. */
  breath: number;
  /** Pulso do Fio Dourado — nunca progresso, nunca etapa, nunca
   *  porcentagem. Só presença. */
  threadOpacity: number;
};

export function computeContinuousPresence(
  now: number,
): ContinuousPresenceState {
  const safeNow = Number.isFinite(now) ? now : 0;
  const breath =
    Math.sin((safeNow / BREATH_PERIOD_MS) * Math.PI * 2) * BREATH_AMPLITUDE;
  const threadOpacity = 0.875 + (breath / BREATH_AMPLITUDE) * 0.125;

  return { breath, threadOpacity };
}
