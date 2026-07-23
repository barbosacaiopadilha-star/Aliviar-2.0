"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { buildCraftLines } from "./craft-model";
import { buildFilmContinuationLines } from "./continuation-model";
import {
  FILM_ASSIMILATION_MS,
  FILM_FALLBACK_POSTER_MS,
  FILM_OPENING_MS,
} from "./film-model";
import { LimiarAtmosphere } from "./LimiarAtmosphere";
import { LimiarFilm } from "./LimiarFilm";
import { LimiarInviteSection } from "./LimiarInviteSection";
import { LimiarPresence } from "./LimiarPresence";
import { LimiarRevealSection } from "./LimiarRevealSection";
import { logLimiarFilmError } from "./limiar-log";
import { buildPathLines } from "./path-model";
import { LANDING_SECTION_MS } from "./stage-tokens";
import { THRESHOLD_FIRST_LINE } from "./threshold-model";
import {
  THRESHOLD_GESTURE_HINT,
  THRESHOLD_GESTURE_READY_MS,
} from "./threshold-gesture";

type LimiarPhase =
  | "threshold"
  | "opening"
  | "film"
  | "assimilation"
  | "after";

type LimiarExperienceProps = {
  filmSrc: string;
  filmAvailable: boolean;
};

const FILM_CONTINUATION_LINES = buildFilmContinuationLines();
const CRAFT_LINES = buildCraftLines();
const PATH_LINES = buildPathLines();

export function LimiarExperience({ filmSrc, filmAvailable }: LimiarExperienceProps) {
  const [phase, setPhase] = useState<LimiarPhase>("threshold");
  const [gestureReady, setGestureReady] = useState(false);
  const [pendingGesture, setPendingGesture] = useState(false);
  const [gestureAcknowledged, setGestureAcknowledged] = useState(false);
  const [shouldLoadFilm, setShouldLoadFilm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<number[]>([]);
  const transitioningRef = useRef(false);

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

  const beginAssimilation = useCallback(() => {
    setPhase("assimilation");
    schedule(() => setPhase("after"), FILM_ASSIMILATION_MS);
  }, [schedule]);

  const runEditorialFilmFallback = useCallback(() => {
    if (!filmAvailable) {
      logLimiarFilmError({ src: filmSrc, reason: "asset_missing" });
    }

    schedule(() => setPhase("film"), FILM_OPENING_MS);
    schedule(() => beginAssimilation(), FILM_OPENING_MS + FILM_FALLBACK_POSTER_MS);
  }, [beginAssimilation, filmAvailable, filmSrc, schedule]);

  const beginFilm = useCallback(() => {
    if (transitioningRef.current || phase !== "threshold") return;
    if (!gestureReady && !pendingGesture) return;

    transitioningRef.current = true;
    setGestureAcknowledged(true);
    setPendingGesture(false);
    setPhase("opening");

    if (filmAvailable) {
      setShouldLoadFilm(true);

      // iOS: a reprodução real ocorre após a abertura (fora da task do gesto)
      // e, sem isto, a política de autoplay a bloqueia — o filme não toca.
      // Destravamos o elemento DENTRO do gesto com um play() mudo seguido de
      // pause(): o som só entra no play() real, preservando a dramaturgia e o
      // tempo da abertura. Falha aqui é inofensiva (o fallback abaixo garante).
      const primerVideo = videoRef.current;
      if (primerVideo) {
        primerVideo.muted = true;
        void Promise.resolve(primerVideo.play())
          .then(() => primerVideo.pause())
          .catch(() => {});
      }

      schedule(() => {
        const video = videoRef.current;
        if (video) {
          video.muted = false;
          video.currentTime = 0;
          void video.play().catch(() => {
            logLimiarFilmError({ src: filmSrc, reason: "playback_failed" });
            beginAssimilation();
          });
        }
        setPhase("film");
      }, FILM_OPENING_MS);
    } else {
      runEditorialFilmFallback();
    }
  }, [
    beginAssimilation,
    filmAvailable,
    filmSrc,
    gestureReady,
    pendingGesture,
    phase,
    runEditorialFilmFallback,
    schedule,
  ]);

  useEffect(() => {
    if (!gestureReady || !pendingGesture || phase !== "threshold" || transitioningRef.current) {
      return;
    }

    beginFilm();
  }, [beginFilm, gestureReady, pendingGesture, phase]);

  const handleFilmEnded = useCallback(() => {
    if (phase !== "film") return;
    beginAssimilation();
  }, [beginAssimilation, phase]);

  const handleFilmError = useCallback(() => {
    if (phase !== "film" && phase !== "opening") return;

    logLimiarFilmError({ src: filmSrc, reason: "load_failed" });
    beginAssimilation();
  }, [beginAssimilation, filmSrc, phase]);

  const registerGestureIntent = useCallback(() => {
    if (transitioningRef.current || phase !== "threshold") return;

    setGestureAcknowledged(true);

    if (gestureReady) {
      beginFilm();
      return;
    }

    setPendingGesture(true);
  }, [beginFilm, gestureReady, phase]);

  const showThreshold = phase === "threshold" || phase === "opening";
  const showFilm = phase === "opening" || phase === "film" || phase === "assimilation";
  const awaitingGesture = gestureReady && phase === "threshold" && !gestureAcknowledged;
  const lampInteractive = phase === "threshold" && !gestureAcknowledged;

  return (
    <div
      className={`limiar limiar--${phase}${gestureAcknowledged ? " limiar--gesture-acknowledged" : ""}`}
    >
      <LimiarAtmosphere />
      {phase !== "film" && phase !== "opening" && <LimiarPresence />}

      {showThreshold && (
        <main className="limiar__main">
          <button
            type="button"
            className={`limiar__lamp-btn${awaitingGesture ? " limiar__lamp--awaiting" : ""}${gestureAcknowledged ? " limiar__lamp--acknowledged" : ""}`}
            disabled={!lampInteractive}
            aria-disabled={!gestureReady && lampInteractive ? true : undefined}
            aria-label={gestureReady ? "Tocar a luz" : "Aguardando a luz"}
            onClick={registerGestureIntent}
          >
            <span className="limiar__lamp-halo" aria-hidden="true" />
            <span className="limiar__lamp-core" aria-hidden="true" />
          </button>

          <p className="limiar__voice limiar__line">{THRESHOLD_FIRST_LINE}</p>

          {awaitingGesture ? (
            <p className="limiar__voice limiar__hint" aria-live="polite">
              {THRESHOLD_GESTURE_HINT}
            </p>
          ) : null}

          <p className="sr-only">O ambiente permanece quieto. Não há pressa.</p>
        </main>
      )}

      <LimiarFilm
        filmSrc={filmSrc}
        filmAvailable={filmAvailable}
        videoRef={videoRef}
        visible={showFilm}
        shouldLoad={shouldLoadFilm}
        onEnded={handleFilmEnded}
        onError={handleFilmError}
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
