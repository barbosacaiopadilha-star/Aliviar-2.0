"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";

import { buildCraftLines } from "./craft-model";
import { buildFilmContinuationLines } from "./continuation-model";
import {
  FILM_ASSIMILATION_MS,
  FILM_OPENING_MS,
} from "./film-model";
import { LimiarAtmosphere } from "./LimiarAtmosphere";
import { LimiarFilm } from "./LimiarFilm";
import { LimiarInviteSection } from "./LimiarInviteSection";
import { LimiarPresence } from "./LimiarPresence";
import { LimiarRevealSection } from "./LimiarRevealSection";
import { buildPathLines } from "./path-model";
import { LANDING_SECTION_MS } from "./stage-tokens";
import { THRESHOLD_FIRST_LINE } from "./threshold-model";
import { THRESHOLD_GESTURE_READY_MS } from "./threshold-gesture";

type LimiarPhase =
  | "threshold"
  | "opening"
  | "film"
  | "assimilation"
  | "after";

type LimiarExperienceProps = {
  filmSrc: string;
};

const FILM_CONTINUATION_LINES = buildFilmContinuationLines();
const CRAFT_LINES = buildCraftLines();
const PATH_LINES = buildPathLines();

export function LimiarExperience({ filmSrc }: LimiarExperienceProps) {
  const [phase, setPhase] = useState<LimiarPhase>("threshold");
  const [gestureReady, setGestureReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<number[]>([]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setGestureReady(true), THRESHOLD_GESTURE_READY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const beginFilm = useCallback(() => {
    if (!gestureReady || phase !== "threshold") return;

    setPhase("opening");

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play();
    }

    schedule(() => setPhase("film"), FILM_OPENING_MS);
  }, [gestureReady, phase, schedule]);

  const handleFilmEnded = useCallback(() => {
    setPhase("assimilation");
    schedule(() => setPhase("after"), FILM_ASSIMILATION_MS);
  }, [schedule]);

  const handleLampKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      beginFilm();
    }
  };

  const showThreshold = phase === "threshold" || phase === "opening";
  const showFilm = phase === "opening" || phase === "film" || phase === "assimilation";
  const awaitingGesture = gestureReady && phase === "threshold";

  return (
    <div className={`limiar limiar--${phase}`}>
      <LimiarAtmosphere />
      {phase !== "film" && phase !== "opening" && <LimiarPresence />}

      {showThreshold && (
        <main className="limiar__main">
          <div
            className={`limiar__lamp${awaitingGesture ? " limiar__lamp--awaiting" : ""}`}
            role={awaitingGesture ? "button" : undefined}
            tabIndex={awaitingGesture ? 0 : undefined}
            aria-label={awaitingGesture ? "Tocar a luz" : undefined}
            onClick={awaitingGesture ? beginFilm : undefined}
            onKeyDown={awaitingGesture ? handleLampKeyDown : undefined}
          >
            <span className="limiar__lamp-halo" />
            <span className="limiar__lamp-core" />
          </div>

          <p className="limiar__voice limiar__line">{THRESHOLD_FIRST_LINE}</p>

          <p className="sr-only">O ambiente permanece quieto. Não há pressa.</p>
        </main>
      )}

      <LimiarFilm
        filmSrc={filmSrc}
        videoRef={videoRef}
        visible={showFilm}
        readyToLoad={gestureReady}
        onEnded={handleFilmEnded}
        onError={handleFilmEnded}
      />

      {phase === "after" && (
        <>
          <main className="limiar__main limiar__main--landing">
            <LimiarRevealSection
              lines={FILM_CONTINUATION_LINES}
              className="limiar__continuation"
            />
            <LimiarRevealSection lines={CRAFT_LINES} className="limiar__craft" />
            <LimiarRevealSection lines={PATH_LINES} className="limiar__path" />
            <LimiarInviteSection />
          </main>

          <footer
            className="limiar__footer"
            style={{ animationDelay: `${LANDING_SECTION_MS.farewell}ms` }}
          >
            <Link href="/login" className="limiar__staff-link">
              Equipe
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
