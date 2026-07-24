import Image from "next/image";

import { ALIVIAR_SCENES, type AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

type ImmersiveBackdropProps = {
  scene?: AliviarSceneKey;
  src?: string;
  /** 0–100 — opacidade da imagem antes dos overlays */
  imageOpacity?: number;
  variant?: "landing-hero" | "landing-soft" | "patient-intimate" | "patient-warm";
  className?: string;
  priority?: boolean;
};

const overlayClasses: Record<NonNullable<ImmersiveBackdropProps["variant"]>, string> = {
  "landing-hero":
    "bg-gradient-to-b from-[#f9f8f6]/92 via-[#f9f8f6]/78 to-[#f9f8f6]/96",
  "landing-soft":
    "bg-gradient-to-b from-[#f9f8f6]/88 via-[#f9f8f6]/94 to-[#f9f8f6]",
  "patient-intimate":
    "bg-gradient-to-br from-[#f4f0e8]/94 via-[#f9f8f6]/90 to-[#f4f5f2]/96",
  "patient-warm":
    "bg-gradient-to-tr from-[#f5efe6]/95 via-[#f9f8f6]/88 to-[#f4f5f2]/94",
};

export function ImmersiveBackdrop({
  scene,
  src,
  imageOpacity = 35,
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
        style={{ opacity: imageOpacity / 100 }}
      />
      <div className={cn("absolute inset-0", overlayClasses[variant])} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(249_248_246/0.4)_100%)]" />
    </div>
  );
}
