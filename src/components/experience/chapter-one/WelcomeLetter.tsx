import { CHAPTER_ONE_CONTACT_EMAIL } from "./constants";

export function WelcomeLetter() {
  return (
    <section className="chapter-one__letter" aria-label="Carta de boas-vindas">
      <p className="chapter-one__letter-salutation chapter-one__letter-line chapter-one__letter-line--1">
        Olá,
      </p>

      <p className="chapter-one__letter-body chapter-one__letter-line chapter-one__letter-line--2">
        Se você chegou até aqui, talvez esteja cansado de carregar tudo sozinho.
      </p>

      <p className="chapter-one__letter-body chapter-one__letter-line chapter-one__letter-line--3">
        Quero que saiba: <em>você não está sozinho.</em>
      </p>

      <p className="chapter-one__letter-body chapter-one__letter-line chapter-one__letter-line--4">
        O que você vive importa — e será tratado com a seriedade que merece.
      </p>

      <p className="chapter-one__letter-body chapter-one__letter-line chapter-one__letter-line--5">
        A partir de agora, caminhamos com você. No seu ritmo.
      </p>

      <p className="chapter-one__letter-body chapter-one__letter-line chapter-one__letter-line--6">
        Hoje existe apenas um próximo passo.
      </p>

      <p className="chapter-one__letter-signoff chapter-one__letter-line chapter-one__letter-line--7">
        Com cuidado,
        <span className="chapter-one__letter-signature">Aliviar</span>
      </p>

      <p className="chapter-one__letter-cta chapter-one__letter-line chapter-one__letter-line--8">
        <a
          id="conversa"
          href={`mailto:${CHAPTER_ONE_CONTACT_EMAIL}`}
          className="chapter-one__cta"
        >
          Iniciar conversa
        </a>
      </p>
    </section>
  );
}
