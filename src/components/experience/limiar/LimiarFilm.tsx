"use client";

import type { RefObject } from "react";

type LimiarFilmProps = {
  filmSrc: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  onEnded: () => void;
};

export function LimiarFilm({ filmSrc, videoRef, visible, onEnded }: LimiarFilmProps) {
  return (
    <div
      className={`limiar-film${visible ? " limiar-film--visible" : ""}`}
      aria-hidden={!visible}
    >
      <video
        ref={videoRef}
        className="limiar-film__image"
        playsInline
        preload="metadata"
        onEnded={onEnded}
      >
        <source src={filmSrc} type="video/mp4" />
      </video>
    </div>
  );
}
