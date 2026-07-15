// Motor de Transição de Saída (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §2, motor 7) — descreve como o ambiente do Portal deixa de dominar a
// página nos últimos instantes, antes da Biblioteca (FAQ). Função pura,
// sem memória: `handoff`/`presence` são clamp direto de `overall`, sem
// amortecimento — nenhum valor anterior é necessário.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 6) — mesma
// matemática exata, só relocada. `HANDOFF_START` movida para cá por ser
// de uso exclusivo deste cálculo (mesmo padrão já usado para DAMPING no
// Motor de Ambiente e para os keyframes no Motor de Vídeo).
//
// Fronteira preservada: este motor só descreve a saída do próprio
// Portal — nunca controla o vídeo companheiro (que tem seu próprio
// ScrollTrigger do GSAP, Etapa 5), nunca o FAQ, nunca o cabeçalho.
// Onde a Fotografia/Ambiente/conteúdo hoje multiplicam sua própria
// opacidade por `presence`, isso continua acontecendo na composição —
// nunca dentro deste módulo.
const HANDOFF_START = 0.88;

export type PortalExitState = {
  /** Fração (0 a 1) de quanto da transição de saída já ocorreu. */
  handoff: number;
  /** Inverso de `handoff` — quanto do Portal ainda está presente
   *  (equivalente a "presence" no código original). */
  portalPresence: number;
  /** Já começou a sair (handoff > 0). */
  isExiting: boolean;
  /** Saída totalmente concluída (handoff >= 1). */
  isComplete: boolean;
};

export function computePortalExitState(overall: number): PortalExitState {
  const safeOverall = Number.isFinite(overall) ? overall : 0;
  const handoff = Math.min(
    Math.max((safeOverall - HANDOFF_START) / (1 - HANDOFF_START), 0),
    1,
  );
  const portalPresence = 1 - handoff;

  return {
    handoff,
    portalPresence,
    isExiting: handoff > 0,
    isComplete: handoff >= 1,
  };
}
