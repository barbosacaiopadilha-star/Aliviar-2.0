"use client";

import Link from "next/link";
import { useState } from "react";

import {
  buildClosingMessages,
  CONVERSATION_HOST,
  preferredNameFrom,
  type ConversationMessage,
  type ConversationTurn,
} from "./conversation-model";

export function FirstConversationExperience() {
  const [turn, setTurn] = useState<ConversationTurn>("greeting");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const [duration, setDuration] = useState("");

  const beginConversation = () => {
    setMessages([{ from: "ana", text: "Como posso te chamar?" }]);
    setTurn("ask-name");
  };

  const submitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const displayName = preferredNameFrom(trimmed);

    setMessages((current) => [
      ...current,
      { from: "patient", text: trimmed },
      { from: "ana", text: `Prazer, ${displayName}. O que te trouxe até nós?` },
    ]);
    setTurn("ask-story");
  };

  const submitStory = () => {
    const trimmed = story.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { from: "patient", text: trimmed },
      { from: "ana", text: "Há quanto tempo você convive com isso?" },
    ]);
    setTurn("ask-duration");
  };

  const submitDuration = (value: string) => {
    const trimmed = value.trim();
    const displayName = preferredNameFrom(name);

    setMessages((current) => [
      ...current,
      {
        from: "patient",
        text: trimmed.length > 0 ? trimmed : "Prefiro falar disso depois.",
      },
      ...buildClosingMessages(displayName),
    ]);
    setTurn("closing");
  };

  return (
    <div className="conversation">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="conversation__main">
        <div className="conversation__thread" aria-live="polite">
          {turn === "greeting" && (
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
        </div>

        <div className="conversation__composer">
          {turn === "greeting" && (
            <button type="button" className="chapter-one__cta" onClick={beginConversation}>
              Podemos conversar
            </button>
          )}

          {turn === "ask-name" && (
            <>
              <label htmlFor="conversation-name" className="conversation__prompt">
                Sua resposta
              </label>
              <input
                id="conversation-name"
                type="text"
                autoComplete="name"
                className="conversation__input"
                placeholder="Como você gosta de ser chamado"
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
                Responder
              </button>
            </>
          )}

          {turn === "ask-story" && (
            <>
              <label htmlFor="conversation-story" className="conversation__prompt">
                Sua resposta
              </label>
              <textarea
                id="conversation-story"
                className="conversation__textarea"
                placeholder="Conte do seu jeito. Não precisa ser completo."
                rows={5}
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
            </>
          )}

          {turn === "ask-duration" && (
            <>
              <label htmlFor="conversation-duration" className="conversation__prompt">
                Sua resposta
              </label>
              <input
                id="conversation-duration"
                type="text"
                className="conversation__input"
                placeholder="Ex.: alguns meses, há anos..."
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
                  Responder
                </button>
                <button
                  type="button"
                  className="conversation__skip"
                  onClick={() => submitDuration("")}
                >
                  Prefiro falar disso depois
                </button>
              </div>
            </>
          )}

          {turn === "closing" && (
            <p className="conversation__closing-note">Por enquanto, é isso. Estamos com você.</p>
          )}
        </div>
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
