"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/components/ui/cn";
import { VideoSection } from "@/components/landing/video-section";

type PersistentVideoProps = {
  videoSrc?: string;
  videoPoster?: string;
};

// O vídeo permanece visível durante toda a visita — nunca desaparece. Um
// único elemento (nunca remontado, então o som nunca reinicia) muda de
// posição/tamanho via CSS (position: fixed, funciona em qualquer ponto da
// página, ao contrário de sticky): uma janela discreta no canto superior
// direito enquanto a Recepção está visível — ancorada no canto, nunca
// centralizada sobre o título, para nunca competir com a leitura do H1 —
// e encolhe ainda mais para um "companheiro" no canto inferior assim que
// o visitante rola além dela (por isso o estado minimizado é sempre menor
// que o expandido, nunca o contrário).
//
// Só renderiza quando existe um vídeo real (videoSrc): sem arquivo
// definitivo, uma janela "em breve" perseguindo o visitante a visita
// inteira seria ruído, não um recurso — nunca um placeholder permanente
// grudado na tela. Assim que o vídeo institucional real for adicionado
// (ver docs/VIDEO_INSTITUCIONAL_LANDING.md), o componente passa a
// aparecer sem nenhuma mudança de código.
export function PersistentVideo({ videoSrc, videoPoster }: PersistentVideoProps) {
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("reception-video-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      setMinimized(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (!videoSrc || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed right-4 z-modal transition-all duration-slow ease-standard",
        minimized ? "bottom-24 w-28 lg:bottom-6 lg:right-6 lg:w-36" : "top-20 w-36 sm:w-44 lg:right-6 lg:top-24 lg:w-48",
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar vídeo"
          className="absolute -right-2 -top-2 z-10 inline-flex size-6 items-center justify-center rounded-full bg-ink text-surface shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
        <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
      </div>
    </div>
  );
}
