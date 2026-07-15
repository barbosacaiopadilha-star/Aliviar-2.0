// Motor de Compactação do Cabeçalho
// (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2, motor 10) — decide se
// o Header está expandido ou compacto. Função pura: um único limiar em
// pixels, sem interpolação contínua, sem histerese, sem estado
// intermediário — o comportamento real confirmado em public-header.tsx
// já era exatamente isso, não uma máquina mais sofisticada.
//
// Extraído de public-header.tsx (Playbook, Etapa 8) — mesma comparação
// exata (`>`, nunca `>=`), só nomeada e relocada. Não desenha, não
// acessa DOM, não aplica classe, não conhece Portal, FAQ, vídeo ou
// narrativa — a composição continua sendo quem lê `window.scrollY` e
// aplica o resultado ao Header.
export const HEADER_COMPACT_SCROLL_THRESHOLD = 8;

export function shouldCompactHeader(
  currentScrollY: number,
  threshold: number,
): boolean {
  const safeScrollY = Number.isFinite(currentScrollY) ? currentScrollY : 0;
  return safeScrollY > threshold;
}
