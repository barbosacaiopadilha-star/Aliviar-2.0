"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * O vídeo em repouso digno — Ato I da Landing (CRITICA_LANDING_2_2 §6).
 *
 * Antes: autoplay em loop, mudo, competindo com a frase do Hero pelo primeiro
 * olhar — e o conteúdo em movimento é um avatar cartoon que o cânone visual
 * rejeita nominalmente (DESIGN_SYSTEM §0/§8). O vídeo continua protagonista
 * (ADR-033), mas em repouso é uma fotografia real da casa: nada nesta página
 * se move sem ser convidado, e o primeiro movimento passa a ser da pessoa.
 *
 * Ao escolher assistir, o vídeo toca com som e controles — quem apertou o
 * play quer assistir de verdade, não ver um GIF.
 */
type HeroVideoProps = {
  src: string;
  /** Fotografia real da casa — o quadro de abertura. */
  posterScene: string;
};

export function HeroVideo({ src, posterScene }: HeroVideoProps) {
  const [assistindo, setAssistindo] = useState(false);

  if (assistindo) {
    return (
      <div className="landing-video-cinema">
        <video
          src={src}
          controls
          autoPlay
          playsInline
          preload="auto"
          aria-label="Vídeo institucional da Aliviar"
          className="aspect-video w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="landing-video-cinema">
      <button
        type="button"
        onClick={() => setAssistindo(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        aria-label="Assistir ao vídeo institucional da Aliviar — cerca de dois minutos"
      >
        {/* A cena parada da casa: um vídeo em repouso parece uma fotografia,
            nunca uma ausência (e nunca um cartoon em loop). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- poster de
            cena estática já otimizado em public/scenes, mesmo uso do
            ImmersiveBackdrop. */}
        <img
          src={posterScene}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_28%,transparent)] transition-colors duration-base ease-standard group-hover:bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_36%,transparent)]" />
        {/* O rótulo e o play carregam o próprio fundo escuro: o véu global é
            atmosfera (decorativo), mas texto sobre fotografia clara precisa
            de piso local — 65–72% de tinta institucional garante AA mesmo na
            área mais clara da cena (pior caso calculado: 6,2:1). */}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_65%,transparent)] text-on-dark transition-transform duration-base ease-standard group-hover:scale-105">
            <Play className="ml-0.5 size-6" aria-hidden="true" />
          </span>
          <span className="rounded-pill bg-[color-mix(in_srgb,var(--color-brand-primary-darkest)_72%,transparent)] px-4 py-1.5 text-sm font-medium tracking-[0.02em] text-on-dark">
            Conheça a Aliviar — 2 min
          </span>
        </span>
      </button>
    </div>
  );
}
