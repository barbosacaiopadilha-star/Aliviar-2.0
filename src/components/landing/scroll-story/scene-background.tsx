import Image from "next/image";

import { cn } from "@/components/ui/cn";
import type { ScrollStoryScene } from "@/components/landing/scroll-story/scenes-data";

type SceneBackgroundProps = {
  scenes: ScrollStoryScene[];
  activeIndex: number;
  /** src do vídeo institucional real, só quando o arquivo existe (ver resolveInstitutionalVideo em page.tsx). */
  videoSrc?: string;
  videoPoster?: string;
  /**
   * Loop ambiente (mudo, decorativo — não é o vídeo institucional) usado na
   * cena 0 enquanto o vídeo institucional real não existe. Fonte:
   * aliviar-temp.vercel.app/assets/video/coluna_loop_alpha.webm, reuso
   * explicitamente autorizado (mesma empresa, outro produto Aliviar).
   */
  ambientVideoSrc?: string;
  /** scene.id -> caminho da foto, só quando o arquivo existe em public/scenes/. */
  resolvedPhotos: Record<string, string | undefined>;
};

// Camada única, fixa (sticky), de tela cheia — todas as cenas ficam
// empilhadas (absolute) umas sobre as outras e alternam por opacidade
// (crossfade), nunca por corte duro. prefers-reduced-motion já reduz a
// duração da transição a ~0ms via o override global em globals.css, sem
// lógica extra aqui. Um scrim escuro garante contraste do texto branco
// sobre foto/gradiente em todas as cenas exceto o Grand Finale (claro,
// texto escuro, scrim muito mais leve).
export function SceneBackground({
  scenes,
  activeIndex,
  videoSrc,
  videoPoster,
  ambientVideoSrc,
  resolvedPhotos,
}: SceneBackgroundProps) {
  return (
    <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
      {scenes.map((scene, index) => {
        const photoSrc = resolvedPhotos[scene.id];
        return (
          <div
            key={scene.id}
            aria-hidden={index !== activeIndex}
            className={cn(
              "absolute inset-0 transition-opacity duration-slow ease-standard",
              index === activeIndex ? "opacity-100" : "opacity-0",
            )}
          >
            {scene.isVideo && videoSrc ? (
              <video
                className="size-full object-cover"
                src={videoSrc}
                poster={videoPoster}
                muted
                autoPlay
                loop
                playsInline
              />
            ) : scene.isVideo && ambientVideoSrc ? (
              <video className="size-full object-cover" src={ambientVideoSrc} muted autoPlay loop playsInline />
            ) : photoSrc ? (
              <Image src={photoSrc} alt="" fill priority={index === 0} className="object-cover" />
            ) : (
              <div className={cn("size-full", scene.fallbackGradient)} />
            )}

            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0",
                scene.textTone === "dark"
                  ? "bg-surface/10"
                  : "bg-gradient-to-t from-brand-primary-deep/70 via-brand-primary-deep/20 to-transparent",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
