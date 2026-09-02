import type { Metadata } from "next";

import { CenaResponsiva } from "@/components/landing/editorial/cena-responsiva";
import { SolicitarAtendimentoForm } from "@/components/publico/solicitar-atendimento-form";
import { metadataPublica } from "@/lib/metadata-publica";

export const metadata: Metadata = {
  title: "Fale com a Aliviar",
  description: "Peça atendimento à Aliviar. Uma pessoa entra em contato com você.",
  // Canônico + Open Graph vêm juntos, de uma fonte só: escrever só a `url`
  // aqui trocaria o objeto `openGraph` inteiro herdado do layout e a página
  // perderia a imagem do link. Ver src/lib/metadata-publica.ts.
  ...metadataPublica({
    rota: "/solicitar-atendimento",
    titulo: "Fale com a Aliviar",
    descricao: "Peça atendimento à Aliviar. Uma pessoa entra em contato com você.",
  }),
};

/**
 * A PORTA DE ENTRADA — `/solicitar-atendimento`.
 *
 * Rota pública. Não cria conta, não cria Case, não pergunta nada de saúde:
 * recolhe o mínimo para uma pessoa da Aliviar procurar quem pediu, e para por
 * aí. Quem converte contato em paciente é o Atendimento, por ato interno.
 *
 * 28/08 · A CENA ENTRA ATRÁS, a pedido do Fundador. Até aqui esta era a única
 * superfície pública sem ambiente: quem vinha da Landing — quatro fotografias
 * do mesmo prédio — caía num formulário sobre fundo chapado, e a casa acabava
 * antes do gesto que ela pede.
 *
 * **Cartão CLARO, e isso é decisão, não estilo.** A porta de acesso (`/login`)
 * usa vidro escuro com letra clara porque a cena dela é o terraço ao
 * entardecer; o `cbdb794` registrou que sobre cena diurna aquele cartão
 * sumiria. A sala de espera é clara, então aqui vale o material dos cards da
 * Landing: letra escura sobre vidro claro. Mesmo vidro, polaridade oposta,
 * pelo motivo que já estava escrito.
 *
 * **Vidro denso, e não o de repouso.** Os cards da Landing quase não tingem
 * parados — o realce deles vem da cristalização conduzida pela rolagem, que
 * nesta tela não existe. Sem `--denso` o formulário nasceria sobre a parede
 * crua, que é o `SIM-61` de novo.
 */
export default function SolicitarAtendimentoPage() {
  return (
    <main className="landing-ambiente landing-ambiente--formulario" aria-label="Fale com a Aliviar">
      <CenaResponsiva cena="atendimento" prioridade posicaoDesktop="right center" />

      {/* No celular a parede livre da cena está EM CIMA; no computador, à
          esquerda — e lá o `--superior` já vira centralização vertical. */}
      <div className="landing-ambiente-conteudo landing-ambiente-conteudo--superior">
        <div className="landing-veu landing-veu--denso landing-card-vidro">
          <h1 className="font-serif text-3xl leading-snug text-ink">Fale com a Aliviar</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Conte só o essencial para a gente procurar você. Nada sobre saúde nesta página — isso a
            gente conversa depois, com uma pessoa.
          </p>

          <div className="mt-8">
            <SolicitarAtendimentoForm />
          </div>
        </div>
      </div>
    </main>
  );
}
