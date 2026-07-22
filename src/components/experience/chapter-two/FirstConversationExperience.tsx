"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildClosingMessages,
  buildDurationIntroLines,
  buildDurationReflectionLines,
  buildNameIntroLines,
  buildNameReflectionLines,
  buildStoryIntroLines,
  buildStoryReflectionLines,
  conversationBreathMs,
  conversationPauseMs,
  CONVERSATION_HOST,
  preferredNameFrom,
  toAnaMessages,
  type ConversationMessage,
  type ConversationTurn,
} from "./conversation-model";
import { ExperienceAtmosphere, ExperienceStaffFooter } from "../shared";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FirstConversationExperience() {
  const [turn, setTurn] = useState<ConversationTurn>("greeting");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const [duration, setDuration] = useState("");
  const [started, setStarted] = useState(false);
  const [isAnaSpeaking, setIsAnaSpeaking] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearScheduled = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearScheduled, [clearScheduled]);

  const speakAsAna = useCallback(
    (lines: string[], onComplete?: () => void) => {
      clearScheduled();

      if (lines.length === 0) {
        onComplete?.();
        return;
      }

      const reduced = prefersReducedMotion();

      if (reduced) {
        setMessages((current) => [...current, ...toAnaMessages(lines)]);
        onComplete?.();
        return;
      }

      setIsAnaSpeaking(true);
      const breath = conversationBreathMs(false);
      const pause = conversationPauseMs(false);

      lines.forEach((text, index) => {
        const delay = breath + index * pause;
        const revealId = window.setTimeout(() => {
          setMessages((current) => [...current, { from: "ana", text }]);

          if (index === lines.length - 1) {
            const doneId = window.setTimeout(() => {
              setIsAnaSpeaking(false);
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

  const beginConversation = () => {
    setStarted(true);
    speakAsAna(buildNameIntroLines(), () => setTurn("ask-name"));
  };

  const submitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const displayName = preferredNameFrom(trimmed);

    setMessages((current) => [...current, { from: "patient", text: trimmed }]);

    speakAsAna(
      [...buildNameReflectionLines(displayName), ...buildStoryIntroLines(displayName)],
      () => setTurn("ask-story"),
    );
  };

  const submitStory = () => {
    const trimmed = story.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { from: "patient", text: trimmed }]);

    speakAsAna(
      [...buildStoryReflectionLines(), ...buildDurationIntroLines()],
      () => setTurn("ask-duration"),
    );
  };

  const submitDuration = (value: string) => {
    const trimmed = value.trim();
    const displayName = preferredNameFrom(name);
    const answered = trimmed.length > 0;

    setMessages((current) => [
      ...current,
      {
        from: "patient",
        text: answered ? trimmed : "Prefiro falar disso depois.",
      },
    ]);

    speakAsAna(
      [
        ...buildDurationReflectionLines(answered),
        ...buildClosingMessages(displayName).map((message) => message.text),
      ],
      () => setTurn("closing"),
    );
  };

  const composerOpen =
    !isAnaSpeaking && (turn === "ask-name" || turn === "ask-story" || turn === "ask-duration");

  return (
    <div className="conversation">
      <ExperienceAtmosphere />

      <main className="conversation__main">
        <div className="conversation__thread" aria-live="polite">
          {turn === "greeting" && !started && (
            <div className="conversation__opening">
              <p className="conversation__line conversation__line--ana">
                Olá. Sou a {CONVERSATION_HOST}, da Aliviar.
              </p>
              <p className="conversation__line conversation__line--ana">
                Obrigada por ter escrito. Antes de qualquer coisa, quero ouvir você.
              </p>
              <p className="conversation__line conversation__line--ana conversation__line--soft">
                Vamos com calma — uma pergunta de cada vez.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <p
              key={`${message.from}-${index}`}
              className={`conversation__line conversation__line--${message.from} conversation__line--appear`}
            >
              {message.text}
            </p>
          ))}

          {isAnaSpeaking && (
            <p className="conversation__line conversation__line--ana conversation__line--listening">
              <span className="conversation__listening" aria-hidden="true" />
              <span className="sr-only">{CONVERSATION_HOST} está respondendo</span>
            </p>
          )}
        </div>

        {turn === "greeting" && !started && (
          <div className="conversation__composer">
            <button type="button" className="chapter-one__cta" onClick={beginConversation}>
              Podemos conversar
            </button>
          </div>
        )}

        {composerOpen && turn === "ask-name" && (
          <div className="conversation__composer">
            <input
              id="conversation-name"
              type="text"
              autoComplete="name"
              aria-label="Como você gosta de ser chamado"
              className="conversation__input"
              placeholder="Escreva aqui..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitName();
              }}
            />
            <button
              type="button"
              className="conversation__send"
              onClick={submitName}
              disabled={!name.trim()}
            >
              Continuar
            </button>
          </div>
        )}

        {composerOpen && turn === "ask-story" && (
          <div className="conversation__composer">
            <textarea
              id="conversation-story"
              aria-label="O que te trouxe até a Aliviar"
              className="conversation__textarea"
              placeholder="Escreva do seu jeito..."
              rows={4}
              value={story}
              onChange={(event) => setStory(event.target.value)}
            />
            <button
              type="button"
              className="conversation__send"
              onClick={submitStory}
              disabled={!story.trim()}
            >
              Compartilhar
            </button>
          </div>
        )}

        {composerOpen && turn === "ask-duration" && (
          <div className="conversation__composer">
            <input
              id="conversation-duration"
              type="text"
              aria-label="Há quanto tempo você convive com isso"
              className="conversation__input"
              placeholder="Se quiser responder agora..."
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitDuration(duration);
              }}
            />
            <div className="conversation__composer-actions">
              <button
                type="button"
                className="conversation__send"
                onClick={() => submitDuration(duration)}
                disabled={!duration.trim()}
              >
                Continuar
              </button>
              <button
                type="button"
                className="conversation__skip"
                onClick={() => submitDuration("")}
              >
                Prefiro falar disso depois
              </button>
            </div>
          </div>
        )}

        {turn === "closing" && !isAnaSpeaking && (
          <div className="conversation__composer">
            <p className="conversation__closing-note">Por enquanto, é isso. Estamos com você.</p>
            <Link href="/consulta" className="chapter-one__cta conversation__next-chapter">
              Preparar consulta inicial
            </Link>
          </div>
        )}
      </main>

      <ExperienceStaffFooter />
    </div>
  );
}
