import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar conversa — Aliviar",
  description: "O primeiro passo é uma conversa com a equipe Aliviar.",
};

const CONTACT_EMAIL = "contato@aliviarcuradoria.com.br";

export default function ComecarPage() {
  return (
    <div className="chapter-one chapter-one--threshold">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__threshold">
        <Link href="/" className="chapter-one__back">
          ← Voltar
        </Link>

        <p className="chapter-one__threshold-label">Capítulo 1 · Primeiro contato</p>

        <h1 className="chapter-one__threshold-title">
          O primeiro passo é uma conversa.
        </h1>

        <p className="chapter-one__threshold-body">
          Escreva para nós quando se sentir pronto. Alguém da equipe Aliviar responde — com calma,
          com atenção, sem pressa.
        </p>

        <a href={`mailto:${CONTACT_EMAIL}`} className="chapter-one__cta">
          Escrever para a Aliviar
        </a>

        <p className="chapter-one__threshold-note">{CONTACT_EMAIL}</p>
      </main>
    </div>
  );
}
