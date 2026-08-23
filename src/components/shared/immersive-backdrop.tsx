import Image from "next/image";

import { ALIVIAR_SCENES, type AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

type ImmersiveBackdropProps = {
  scene?: AliviarSceneKey;
  src?: string;
  /** 0–100 — opacidade da imagem antes dos overlays */
  imageOpacity?: number;
  /** object-position da foto — ADR-080: reenquadrar o MESMO ambiente por seção. */
  imagePosition?: string;
  variant?:
    | "landing-hero"
    | "landing-soft"
    | "patient-intimate"
    | "patient-warm"
    | "edificio-nitido"
    | "edificio-suave";
  className?: string;
  priority?: boolean;
};

const overlayClasses: Record<NonNullable<ImmersiveBackdropProps["variant"]>, string> = {
  "landing-hero":
    "bg-gradient-to-b from-[var(--color-bg-canvas)]/88 via-[var(--color-bg-canvas)]/45 to-[var(--color-bg-canvas)]/90",
  "landing-soft":
    "bg-gradient-to-b from-[var(--color-bg-canvas)]/90 via-[var(--color-bg-canvas-warm)]/95 to-[var(--color-bg-canvas)]",
  "patient-intimate":
    "bg-gradient-to-br from-[var(--color-bg-canvas-warm)]/94 via-[var(--color-bg-canvas)]/90 to-[var(--color-bg-canvas-warm)]/96",
  "patient-warm":
    "bg-gradient-to-tr from-[var(--color-bg-canvas-warm)]/95 via-[var(--color-bg-canvas)]/88 to-[var(--color-bg-canvas-warm)]/94",
  /* ADR-080 · curva de intensidade do Edifício. O véu de contraste fica na
     REGIÃO do texto (.landing-veu), nunca na foto inteira — aqui só um
     lavado direcional leve para o ambiente não disputar com o conteúdo. */
  "edificio-nitido":
    "bg-gradient-to-r from-[var(--color-bg-canvas)]/45 via-[var(--color-bg-canvas)]/10 to-transparent",
  "edificio-suave":
    "bg-gradient-to-b from-[var(--color-bg-canvas)]/72 via-[var(--color-bg-canvas)]/55 to-[var(--color-bg-canvas)]/78",
};

export function ImmersiveBackdrop({
  scene,
  src,
  imageOpacity = 35,
  imagePosition,
  variant = "landing-soft",
  className,
  priority = false,
}: ImmersiveBackdropProps) {
  const imageSrc = src ?? (scene ? ALIVIAR_SCENES[scene] : undefined);
  if (!imageSrc) return null;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Image
        src={imageSrc}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{ opacity: imageOpacity / 100, ...(imagePosition ? { objectPosition: imagePosition } : {}) }}
      />
      <div className={cn("absolute inset-0", overlayClasses[variant])} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,color-mix(in_srgb,var(--color-bg-canvas)_45%,transparent)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_75%_15%,rgba(183,154,91,0.04)_0%,transparent_70%)]" />
    </div>
  );
}
