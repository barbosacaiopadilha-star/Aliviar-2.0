import type { ReactNode } from "react";

import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";
import type { AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

/**
 * ADR-080 · 3ª rodada (23/08, decisão do Fundador): a Landing é a travessia
 * de QUATRO capítulos — um ambiente do Edifício por capítulo, nas duas
 * proporções (paisagem no computador, retrato no celular), com TODO o
 * conteúdo dentro deles (cabeçalho e rodapé ficam fora da conta).
 *
 * A dosagem que evita a poluição: o capítulo abre forte (cena nítida no
 * topo) e amansa por dentro (o véu do gradiente `edificio-capitulo` cresce
 * onde o texto denso corre). A cena nunca estica: o img fica sticky na
 * altura de UMA tela e acompanha a rolagem — zoom zero nas duas telas.
 */
export function CapituloDoEdificio({
  scene,
  imagePosition,
  backdropClassName,
  className,
  children,
  variant = "edificio-capitulo",
}: {
  scene: AliviarSceneKey;
  imagePosition?: string;
  backdropClassName?: string;
  className?: string;
  children: ReactNode;
  /** "edificio-nitido" para capítulo de UMA dobra (o hero) — sem curva de amansar. */
  variant?: "edificio-capitulo" | "edificio-nitido";
}) {
  return (
    <section className={cn("landing-capitulo relative", className)}>
      <ImmersiveBackdrop
        scene={scene}
        variant={variant}
        imageOpacity={100}
        imagePosition={imagePosition}
        className={backdropClassName}
      />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
