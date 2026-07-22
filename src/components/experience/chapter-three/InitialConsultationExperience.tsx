"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildConfirmIntroLines,
  buildConfirmPauseLines,
  buildConfirmYesLines,
  buildOpenIntroLines,
  buildOpenReflectionLines,
  buildPreparationLines,
  buildSynthesisLines,
  buildTriedIntroLines,
  buildTriedReflectionLines,
  buildWelcomeLines,
  consultationBreathMs,
  consultationPauseMs,
  CONSULTATION_HOST,
  toMarinaMessages,
  type ConsultationMessage,
  type ConsultationTurn,
} from "./consultation-model";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function InitialConsultationExperience() {
  const [turn, setTurn] = useState<ConsultationTurn>("greeting");
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [tried, setTried] = useState("");
  const [open, setOpen] = useState("");
  const [started, setStarted] = useState(false);
  const [isMarinaSpeaking, setIsMarinaSpeaking] = useState(false);
  const [closingOutcome, setClosingOutcome] = useState<"none" | "follow" | "pause">("none");
  const timeoutsRef = useRef<number[]>([]);

  const clearScheduled = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearScheduled, [clearScheduled]);

  const speakAsMarina = useCallback(
    (lines: string[], onComplete?: () => void) => {
      clearScheduled();

      if (lines.length === 0) {
        onComplete?.();
        return;
      }

      const reduced = prefersReducedMotion();

      if (reduced) {
        setMessages((current) => [...current, ...toMarinaMessages(lines)]);
        onComplete?.();
        return;
      }

      setIsMarinaSpeaking(true);
      const breath = consultationBreathMs(false);
      const pause = consultationPauseMs(false);

      lines.forEach((text, index) => {
        const delay = breath + index * pause;
        const revealId = window.setTimeout(() => {
          setMessages((current) => [...current, { from: "marina", text }]);

          if (index === lines.length - 1) {
            const doneId = window.setTimeout(() => {
              setIsMarinaSpeaking(false);
              onComplete?.();
            }, pause);
            timeoutsRef.current.push(doneId);
          }
        }, delay);
        timeoutsRef.current.push(revealId);
      });
    },
    [clearScheduled],
  );

  const beginConsultation = () => {
    setStarted(true);
    speakAsMarina(
      [...buildWelcomeLines(), ...buildPreparationLines(), ...buildTriedIntroLines()],
      () => setTurn("ask-tried"),
    );
  };

  const submitTried = () => {
    const trimmed = tried.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { from: "patient", text: trimmed }]);

    speakAsMarina(
      [...buildTriedReflectionLines(), ...buildOpenIntroLines()],
      () => setTurn("ask-open"),
    );
  };

  const skipTried = () => {
    setMessages((current) => [
      ...current,
      { from: "patient", text: "Prefiro contar isso na consulta." },
    ]);

    speakAsMarina(
      [...buildTriedReflectionLines(), ...buildOpenIntroLines()],
      () => setTurn("ask-open"),
    );
  };

  const submitOpen = () => {
    const trimmed = open.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { from: "patient", text: trimmed }]);

    speakAsMarina(
      [...buildOpenReflectionLines(), ...buildSynthesisLines(), ...buildConfirmIntroLines()],
      () => setTurn("confirm"),
    );
  };

  const confirmFollow = () => {
    setClosingOutcome("follow");
    setMessages((current) => [...current, { from: "patient", text: "Sim, quero seguir." }]);
    speakAsMarina(buildConfirmYesLines(), () => setTurn("closing"));
  };

  const confirmPause = () => {
    setClosingOutcome("pause");
    setMessages((current) => [
      ...current,
      { from: "patient", text: "Ainda preciso de tempo." },
    ]);
    speakAsMarina(buildConfirmPauseLines(), () => setTurn("closing"));
  };

  const composerOpen =
    !isMarinaSpeaking && (turn === "ask-tried" || turn === "ask-open");

  return (
    <div className="conversation consultation">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="conversation__main">
        <div className="conversation__thread" aria-live="polite">
          {turn === "greeting" && !started && (
            <div className="conversation__opening">
              <p className="consultation__host-name">{CONSULTATION_HOST}</p>
              <p className="consultation__host-role">Médica · Equipe Aliviar</p>
              <p className="conversation__line conversation__line--ana">
                Consulta inicial
              </p>
              <p className="conversation__line conversation__line--ana conversation__line--soft">
                Um encontro para compreender seu caso — com calma e profundidade.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <p
              key={`${message.from}-${index}`}
              className={`conversation__line conversation__line--${message.from === "marina" ? "ana" : "patient"} conversation__line--appear`}
            >
              {message.text}
            </p>
          ))}

          {isMarinaSpeaking && (
            <p className="conversation__line conversation__line--ana conversation__line--listening">
              <span className="conversation__listening" aria-hidden="true" />
              <span className="sr-only">{CONSULTATION_HOST} está respondendo</span>
            </p>
          )}
        </div>

        {turn === "greeting" && !started && (
          <div className="conversation__composer">
            <button type="button" className="chapter-one__cta" onClick={beginConsultation}>
              Entrar na consulta
            </button>
          </div>
        )}

        {composerOpen && turn === "ask-tried" && (
          <div className="conversation__composer">
            <textarea
              id="consultation-tried"
              aria-label="O que você já tentou até aqui"
              className="conversation__textarea"
              placeholder="Escreva do seu jeito..."
              rows={4}
              value={tried}
              onChange={(event) => setTried(event.target.value)}
            />
            <div className="conversation__composer-actions">
              <button
                type="button"
                className="conversation__send"
                onClick={submitTried}
                disabled={!tried.trim()}
              >
                Compartilhar
              </button>
              <button type="button" className="conversation__skip" onClick={skipTried}>
                Prefiro contar na consulta
              </button>
            </div>
          </div>
        )}

        {composerOpen && turn === "ask-open" && (
          <div className="conversation__composer">
            <textarea
              id="consultation-open"
              aria-label="O que ainda está em aberto para você"
              className="conversation__textarea"
              placeholder="O que pesa agora..."
              rows={4}
              value={open}
              onChange={(event) => setOpen(event.target.value)}
            />
            <button
              type="button"
              className="conversation__send"
              onClick={submitOpen}
              disabled={!open.trim()}
            >
              Compartilhar
            </button>
          </div>
        )}

        {turn === "confirm" && !isMarinaSpeaking && (
          <div className="conversation__composer">
            <div className="conversation__composer-actions">
              <button type="button" className="chapter-one__cta" onClick={confirmFollow}>
                Sim, quero seguir
              </button>
              <button type="button" className="conversation__skip" onClick={confirmPause}>
                Ainda preciso de tempo
              </button>
            </div>
          </div>
        )}

        {turn === "closing" && !isMarinaSpeaking && (
          <div className="conversation__composer">
            <p className="conversation__closing-note">
              Sua história foi recebida com cuidado. Seguimos no seu ritmo.
            </p>
            {closingOutcome === "follow" && (
              <Link href="/curadoria" className="chapter-one__cta conversation__next-chapter">
                Ver como seguimos com seu caso
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
