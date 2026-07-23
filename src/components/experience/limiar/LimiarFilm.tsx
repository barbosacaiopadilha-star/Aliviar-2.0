"use client";

import { useEffect, type RefObject } from "react";

import { FILM_POSTER_SRC } from "./film-model";

type LimiarFilmProps = {
  filmSrc: string;
  filmAvailable: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  shouldLoad: boolean;
  onEnded: () => void;
  onError: () => void;
};

export function LimiarFilm({
  filmSrc,
  filmAvailable,
  videoRef,
  visible,
  shouldLoad,
  onEnded,
  onError,
}: LimiarFilmProps) {
  useEffect(() => {
    if (!shouldLoad || !filmAvailable) return;

    const video = videoRef.current;
    if (!video) return;

    video.load();
  }, [shouldLoad, filmAvailable, videoRef]);

  return (
    <div
      className={`limiar-film${visible ? " limiar-film--visible" : ""}${!filmAvailable ? " limiar-film--fallback" : ""}`}
      aria-hidden={!visible}
    >
      <video
        ref={videoRef}
        className="limiar-film__image"
        playsInline
        preload="none"
        poster={FILM_POSTER_SRC}
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        aria-label={
          visible
            ? filmAvailable
              ? "Filme institucional Aliviar — reprodução em andamento"
              : "Pausa editorial — filme institucional em preparação"
            : undefined
        }
        onEnded={onEnded}
        onError={onError}
      >
        {/* Fonte presente já no primeiro render quando o filme existe (com
            preload="none", nada é buscado até load()/play()). Isto permite que
            o play() de destravamento do iOS ocorra DENTRO do gesto do usuário.
            Sem filme disponível, nenhuma <source> é emitida (fallback editorial). */}
        {filmAvailable ? <source src={filmSrc} type="video/mp4" /> : null}
      </video>
    </div>
  );
}
