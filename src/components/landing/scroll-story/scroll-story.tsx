"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { GrandFinaleActions } from "@/components/landing/scroll-story/grand-finale-actions";
import { SceneBackground } from "@/components/landing/scroll-story/scene-background";
import { SCROLL_STORY_SCENES } from "@/components/landing/scroll-story/scenes-data";

type ScrollStoryProps = {
  videoSrc?: string;
  videoPoster?: string;
  ambientVideoSrc?: string;
  resolvedPhotos: Record<string, string | undefined>;
};

// Orquestra a jornada em 7 cenas: um único fundo fixo (SceneBackground)
// atrás de blocos de texto empilhados, cada um ocupando uma tela cheia.
// Um IntersectionObserver decide qual cena está "ativa" pela posição de
// rolagem — o vídeo nunca é controlado pelo scroll (ver docs/LANDING_V3_SCENES.md
// e o conceito da Landing V3), só as legendas mudam.
export function ScrollStory({ videoSrc, videoPoster, ambientVideoSrc, resolvedPhotos }: ScrollStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sceneRefs.current.findIndex((el) => el === entry.target);
          if (index !== -1) setActiveIndex(index);
        }
      },
      { threshold: 0.5 },
    );

    for (const el of sceneRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <SceneBackground
        scenes={SCROLL_STORY_SCENES}
        activeIndex={activeIndex}
        videoSrc={videoSrc}
        videoPoster={videoPoster}
        ambientVideoSrc={ambientVideoSrc}
        resolvedPhotos={resolvedPhotos}
      />

      <div className="relative z-10 -mt-[100svh]">
        {SCROLL_STORY_SCENES.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            className={cn(
              "flex min-h-[100svh] flex-col justify-end px-4 pb-16 lg:justify-center lg:px-8",
              scene.isGrandFinale && "justify-center pb-0 lg:justify-center",
            )}
          >
            <div
              className={cn(
                "mx-auto w-full max-w-reading",
                scene.isGrandFinale ? "text-center" : "text-left",
              )}
            >
              {scene.eyebrow && (
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-[0.16em]",
                    scene.textTone === "dark" ? "text-brand-sage" : "text-brand-sage-light",
                  )}
                >
                  {scene.eyebrow}
                </span>
              )}

              {scene.heading && (
                <h1
                  className={cn(
                    "mt-3 font-serif text-3xl font-semibold lg:text-4xl",
                    scene.textTone === "dark" ? "text-ink" : "text-surface",
                  )}
                >
                  {scene.heading}
                </h1>
              )}

              <p
                className={cn(
                  scene.heading
                    ? "mt-3 text-lg"
                    : "mt-3 font-serif text-2xl font-semibold lg:text-3xl",
                  scene.textTone === "dark" ? "text-ink" : "text-surface",
                  scene.heading && (scene.textTone === "dark" ? "text-ink-muted" : "text-surface/85"),
                )}
              >
                {scene.caption}
              </p>

              {scene.microline && (
                <p
                  className={cn(
                    "mt-2 text-sm",
                    scene.textTone === "dark" ? "text-ink-muted" : "text-surface/85",
                  )}
                >
                  {scene.microline}
                </p>
              )}

              {scene.isGrandFinale && (
                <div className="mt-8 flex justify-center">
                  <GrandFinaleActions />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
