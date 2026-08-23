import type { CSSProperties } from "react";

import { cn } from "@/components/ui/cn";

/**
 * A CENA RESPONSIVA (Dossiê da Landing Responsiva, 23/08).
 *
 * Quatro ambientes fotográficos, cada um em duas versões geradas: alta para
 * o celular (852×1846) e 16:9 para o computador (1672×941). O `<picture>`
 * faz o aparelho baixar SÓ a versão que vai usar — antes as duas desciam,
 * e isso era desperdício real de dados de quem chega pelo telefone.
 *
 * WebP primeiro, JPEG como rede de segurança; PNGs originais preservados
 * fora do bundle. A fotografia é decorativa (`alt=""`): todo o conteúdo
 * essencial vive em HTML, nunca dentro da imagem.
 */
export const CENAS = {
  recepcao: "recepcao",
  curadoria: "curadoria",
  tresMedicos: "tres-medicos",
  concierge: "concierge",
} as const;

export type CenaKey = (typeof CENAS)[keyof typeof CENAS];

export function CenaResponsiva({
  cena,
  prioridade = false,
  className,
  posicaoMobile,
  posicaoDesktop,
}: {
  cena: CenaKey;
  /** Só a Recepção carrega antecipadamente; as outras três são preguiçosas. */
  prioridade?: boolean;
  className?: string;
  posicaoMobile?: string;
  posicaoDesktop?: string;
}) {
  const base = `/landing/v2/${cena}`;
  return (
    <picture aria-hidden="true" className={cn("landing-cena", className)}>
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={`${base}-desktop.webp`}
        width={1672}
        height={941}
      />
      <source
        media="(min-width: 768px)"
        type="image/jpeg"
        srcSet={`${base}-desktop.jpg`}
        width={1672}
        height={941}
      />
      <source type="image/webp" srcSet={`${base}-mobile.webp`} width={852} height={1846} />
      {/* eslint-disable-next-line @next/next/no-img-element -- fotografia de
          ambiente servida por <picture>: o next/image não expressa a troca
          por breakpoint com dois arquivos de proporções diferentes. */}
      <img
        src={`${base}-mobile.jpg`}
        alt=""
        width={852}
        height={1846}
        decoding="async"
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : "auto"}
        className="landing-cena-img"
        style={
          {
            "--cena-pos-mobile": posicaoMobile ?? "center",
            "--cena-pos-desktop": posicaoDesktop ?? "center",
          } as CSSProperties
        }
      />
    </picture>
  );
}
