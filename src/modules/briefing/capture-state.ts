/**
 * ESTADO DE UM REGISTRO — o vocabulário que a tela usa.
 *
 * @metodo ACE_PRINCIPLES P2 — compatibilidade não é medida
 * @metodo Experience §5 — a tela informa, nunca cobra
 *
 * Por que existe: "3 de 5 respondidas" e "60% completo" transformam uma
 * conversa em barra de progresso. A pessoa passa a preencher para completar,
 * não para dizer a verdade — e o Curador passa a perseguir a barra em vez de
 * escutar. Por isso não há contagem, percentual, fração nem barra em lugar
 * nenhum desta camada.
 *
 * Um Perfil vazio é um estado legítimo (P16): nada aqui é requisito.
 */

export type CaptureState =
  | "AINDA_NAO_REGISTRADO"
  | "EM_PREENCHIMENTO"
  | "REGISTRADO"
  | "ATUALIZADO_HOJE";

export const CAPTURE_STATE_LABELS: Record<CaptureState, string> = {
  AINDA_NAO_REGISTRADO: "Ainda não registrado",
  EM_PREENCHIMENTO: "Em preenchimento",
  REGISTRADO: "Registrado",
  ATUALIZADO_HOJE: "Atualizado hoje",
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Deriva o estado a partir do que existe — nunca a partir do que falta.
 *
 * `total` entra só para distinguir "começou" de "passou por todas". Nunca é
 * exibido: quem chama recebe uma palavra, jamais um número.
 */
export function deriveCaptureState(
  answeredCount: number,
  total: number,
  lastTouchedAt?: string | null,
  now: Date = new Date(),
): CaptureState {
  if (answeredCount <= 0) return "AINDA_NAO_REGISTRADO";

  if (lastTouchedAt) {
    const touched = new Date(lastTouchedAt);
    if (!Number.isNaN(touched.getTime()) && isSameDay(touched, now)) {
      return "ATUALIZADO_HOJE";
    }
  }

  return answeredCount >= total ? "REGISTRADO" : "EM_PREENCHIMENTO";
}

/** O rótulo pronto para a tela. */
export function captureStateLabel(...args: Parameters<typeof deriveCaptureState>): string {
  return CAPTURE_STATE_LABELS[deriveCaptureState(...args)];
}
