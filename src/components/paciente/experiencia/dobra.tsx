import type { ReactNode } from "react";

/**
 * A DOBRA (23/08, "explicando demais em vez de mostrar visualmente").
 *
 * Nasceu dentro da carta do caminho e foi extraída quando o Mapa de
 * Prioridades precisou da mesma cura: listas longas com o título sempre à
 * vista e o conteúdo a um toque. `<details>` nativo de propósito: acessível
 * de graça, zero estado no React, e o conteúdo continua no DOM — nada some
 * da entrega, espera a vez (Progressive Disclosure).
 *
 * O CSS mora em `patient-dashboard.css` (`.patient-dobra`): seta desenhada
 * girando ao abrir, alvo de toque honesto, foco visível.
 */
export function Dobra({
  titulo,
  rotulo,
  abertaInicial = false,
  children,
}: {
  titulo: ReactNode;
  /** O rótulo acessível da seção — o que o leitor de tela anuncia. */
  rotulo: string;
  abertaInicial?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      aria-label={rotulo}
      className="patient-subcard patient-veu patient-dobra"
      open={abertaInicial || undefined}
    >
      <summary className="patient-dobra-cabecalho">
        <h4 className="patient-section-title">{titulo}</h4>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
