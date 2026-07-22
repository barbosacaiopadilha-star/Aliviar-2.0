"use client";

import { useEffect, type RefObject } from "react";

import { FILM_POSTER_SRC } from "./film-model";

type LimiarFilmProps = {
  filmSrc: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  readyToLoad: boolean;
  onEnded: () => void;
  onError: () => void;
};

export function LimiarFilm({
  filmSrc,
  videoRef,
  visible,
  readyToLoad,
  onEnded,
  onError,
}: LimiarFilmProps) {
  useEffect(() => {
    if (!readyToLoad) return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
  }, [readyToLoad, videoRef]);

  return (
    <div
      className={`limiar-film${visible ? " limiar-film--visible" : ""}`}
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
            ? "Filme institucional Aliviar — reprodução em andamento"
            : undefined
        }
        onEnded={onEnded}
        onError={onError}
      >
        <source src={filmSrc} type="video/mp4" />
      </video>
    </div>
  );
}
