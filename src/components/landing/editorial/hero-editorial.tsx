import { LinkButton } from "@/components/landing/link-button";

/* Auditoria de fusão F7 (23/08): o link "Assistir ao vídeo" saiu — o vídeo
   é a dobra seguinte, e o link prometia o que a rolagem já entrega. Com
   ele foi a máquina de detectar o arquivo do vídeo, que só existia para
   decidir se o link aparecia. */

export function HeroEditorial() {
  return (
    <section className="landing-hero-immersive">
      {/* ADR-080 · 3ª rodada: o hero vive DENTRO do Capítulo 1 (a Entrada)
          — o cenário vem do CapituloDoEdificio, não daqui. O card de vidro
          liso pousa na área livre da cena; no celular, sobre o piso do
          retrato 9:16. */}
      <div className="relative z-10 mx-auto w-full max-w-content px-5 lg:px-10">
        <div className="landing-hero-grid">
          <div className="landing-fade-in landing-hero-col landing-veu p-7 sm:p-10 lg:p-12">
            {/* A frase que estava aqui — "Curadoria médica independente" — não
                se perdeu: hoje está gravada na própria cena da recepção e nos
                fatos da banda dos Curadores. */}
            {/* "Capítulo Zero" → "Seja bem-vindo" (pedido do Fundador,
                23/08): a Recepção recebe, não numera. */}
            <p className="landing-eyebrow">Seja bem-vindo</p>
            <h1 className="landing-hero-title text-4xl sm:text-[2.75rem] lg:text-[3.5rem]">
              Uma decisão de saúde importante.
              <br />
              Você não precisa tomá-la sozinho.
            </h1>
            {/* Sem "o médico certo para você": prometer o certo é prometer
                resultado, e a Fachada nunca promete mais do que o interior
                entrega (L14; Linguagem §6 — família de "ideal"). A decisão é
                dela; a companhia é nossa. */}
            <p className="landing-body mt-8 max-w-2xl text-lg text-[var(--color-ink-muted)]">
              Com você em cada etapa — da sua história até uma decisão que é sua.
            </p>

            {/* A porta é UMA (CRITICA_LANDING_2_2 §5; C1/ADR-075). */}
            <div className="landing-hero-ctas mt-12">
              <LinkButton
                href="/solicitar-atendimento"
                variant="primary"
                className="landing-porta w-full sm:w-auto"
              >
                Solicitar atendimento
              </LinkButton>
            </div>
          </div>

          {/* ADR-080: a coluna direita fica LIVRE de propósito — é onde a
              cena mostra a família no balcão. A foto deixou de ser cartão
              para ser o próprio ambiente da seção. */}
        </div>
      </div>
    </section>
  );
}
