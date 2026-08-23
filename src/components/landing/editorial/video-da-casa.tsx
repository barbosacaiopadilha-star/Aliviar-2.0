"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * O VÍDEO DA CASA (decisão do Fundador, 23/08).
 *
 * O player preto deixou de ser seção e o modal deixou de ser a resposta: o
 * vídeo mora no card do ambiente da Curadoria — o teto livre da sala onde
 * o trabalho acontece. Enquanto ninguém pede, é só uma CAPA (chamada em
 * serifa, play em círculo e a duração real do arquivo). Ao dar play, ele
 * CRESCE ali mesmo; e se a pessoa continuar rolando, o player GRUDA no
 * topo da tela em tamanho pequeno — para ver e ler ao mesmo tempo, sem
 * perder o que estava assistindo.
 *
 * Regras que continuam valendo: nunca toca sozinho, `preload="none"` até o
 * gesto, o player fixo tem botão de fechar alcançável por teclado, e quem
 * pede menos movimento não recebe transição nenhuma.
 */
export function VideoDaCasa({
  src,
  chamada,
  rotulo,
  duracao,
}: {
  src: string;
  chamada: string;
  rotulo: string;
  duracao?: string;
}) {
  const [tocando, setTocando] = useState(false);
  const [fixo, setFixo] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fechar = useCallback(() => {
    videoRef.current?.pause();
    setTocando(false);
    setFixo(false);
  }, []);

  const abrir = useCallback(() => {
    setTocando(true);
    // O play precisa vir do gesto da pessoa — nunca sozinho.
    requestAnimationFrame(() => {
      void videoRef.current?.play().catch(() => {
        /* se o navegador recusar, o controle fica com ela */
      });
    });
  }, []);

  /** Enquanto toca, o player gruda no topo quando o card sai da tela. */
  useEffect(() => {
    if (!tocando) return;
    const caixa = caixaRef.current;
    if (!caixa || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      ([entrada]) => setFixo(!entrada?.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px", threshold: 0.35 },
    );
    observador.observe(caixa);
    return () => observador.disconnect();
  }, [tocando]);

  return (
    <div ref={caixaRef} className="landing-video-caixa">
      {!tocando ? (
        <button type="button" className="landing-video-gatilho" onClick={abrir}>
          <span aria-hidden="true" className="landing-video-play">
            <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
          <span className="landing-video-texto">
            <span className="landing-video-chamada">{chamada}</span>
            <span className="landing-video-linha">
              {rotulo}
              {duracao ? <span className="landing-video-duracao">{duracao}</span> : null}
            </span>
          </span>
        </button>
      ) : (
        <div className={fixo ? "landing-video-quadro landing-video-quadro--fixo" : "landing-video-quadro"}>
          <video
            ref={videoRef}
            className="landing-video-player"
            src={src}
            controls
            playsInline
            preload="none"
            onEnded={fechar}
          />
          <button type="button" className="landing-video-fechar" onClick={fechar}>
            <span className="sr-only">Fechar o vídeo</span>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
