import Link from "next/link";

import { WelcomeLetter } from "./WelcomeLetter";

export function ChapterOneExperience() {
  return (
    <div className="chapter-one">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main">
        <WelcomeLetter />
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
