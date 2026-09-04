import type { CSSProperties } from "react";

import { cn } from "@/components/ui/cn";

/**
 * A CENA RESPONSIVA (Dossiê da Landing Responsiva, 23/08).
 *
 * Quatro ambientes fotográficos, cada um em duas versões geradas: alta para
 * o celular (852×1846) e 16:9 para o computador (1672×941). O `<picture>`
 * faz o aparelho baixar SÓ a versão que vai usar — antes as duas desciam,
 * e isso era desperdício real de dados de quem chega pelo telefone.
 *
 * WebP primeiro, JPEG como rede de segurança; PNGs originais preservados
 * fora do bundle. A fotografia é decorativa (`alt=""`): todo o conteúdo
 * essencial vive em HTML, nunca dentro da imagem.
 */
export const CENAS = {
  recepcao: "recepcao",
  curadoria: "curadoria",
  tresMedicos: "tres-medicos",
  concierge: "concierge",
  /* 27/08 · A ENTRADA. O terraço ao entardecer, gerado pelo Fundador para a
     porta de acesso. É a primeira cena ESCURA da casa, e isso não é detalhe:
     é ela que torna possível o cartão de vidro com texto claro — sobre as
     quatro cenas diurnas, texto claro seria ilegível. */
  entrada: "entrada",
  /* 28/08 · O ATENDIMENTO. A sala de espera com as duas poltronas, o telefone
     e a marca na parede — gerada pelo Fundador para `/solicitar-atendimento`.
     É cena CLARA, então o cartão dela é o da Landing (letra escura sobre vidro
     claro), nunca o da porta de acesso: o `cbdb794` já registrou que texto
     claro só sobrevive sobre a cena escura do terraço. */
  atendimento: "atendimento",
  /* 04/09 · O QUE É A ALIVIAR. A mesma recepção da Landing, num momento cheio
     de gente (parte pública da casa), para a página /o-que-e. Cena CLARA:
     card denso da Landing. Gerada como novo take do mesmo ambiente (v1.1). */
  oQueE: "o-que-e",
  /* 04/09 · Os capítulos de /o-que-e sobre CHAPAS DOS FILMES (sem gente, sem
     texto, parede livre): a vertical é a chapa inteira; a de computador é o
     recorte central 16:9 da mesma chapa. Nenhuma imagem gerada. */
  oQueEProblema: "o-que-e-problema",
  oQueEComo: "o-que-e-como",
  oQueEDiferencas: "o-que-e-diferencas",
  oQueECusto: "o-que-e-custo",
  /* 04/09 · A recepção pública de /sua-historia, sobre a chapa da escuta do
     filme (o dossiê aberto sendo construído). Mesmo mecanismo dos capítulos. */
  suaHistoria: "sua-historia",
} as const;

export type CenaKey = (typeof CENAS)[keyof typeof CENAS];

/**
 * O retrato do celular tem 852×1846 em todas as cenas do dossiê de 23/08.
 * O Atendimento nasceu depois, em 941×1672 — o enquadramento é do Fundador, e
 * recortá-lo para caber na medida antiga trocaria composição por uniformidade.
 * Declarar a medida real importa: é dela que o navegador tira a proporção
 * antes da imagem chegar, e proporção errada é salto de layout.
 *
 * Fica registrado que uma extensão mecânica da parede (941×2572) foi tentada
 * em 28/08 e DESCARTADA: esticar uma faixa de 140px para 900px amplificou o
 * gradiente e trocou o creme da sala por um caramelo amadeirado — a sala
 * deixava de ser a mesma sala. O que resolvia o problema que ela tentava
 * resolver era o vidro escovado, que já existia.
 */
const RETRATO: Partial<Record<CenaKey, { largura: number; altura: number }>> = {
  atendimento: { largura: 941, altura: 1672 },
  "o-que-e": { largura: 941, altura: 1672 },
  "o-que-e-problema": { largura: 941, altura: 1672 },
  "o-que-e-como": { largura: 941, altura: 1672 },
  "o-que-e-diferencas": { largura: 941, altura: 1672 },
  "o-que-e-custo": { largura: 941, altura: 1672 },
  "sua-historia": { largura: 941, altura: 1672 },
};
const RETRATO_PADRAO = { largura: 852, altura: 1846 };

export function CenaResponsiva({
  cena,
  prioridade = false,
  className,
  posicaoMobile,
  posicaoDesktop,
}: {
  cena: CenaKey;
  /** Só a Recepção carrega antecipadamente; as outras três são preguiçosas. */
  prioridade?: boolean;
  className?: string;
  posicaoMobile?: string;
  posicaoDesktop?: string;
}) {
  const base = `/landing/v2/${cena}`;
  const retrato = RETRATO[cena] ?? RETRATO_PADRAO;
  return (
    <picture aria-hidden="true" className={cn("landing-cena", className)}>
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={`${base}-desktop.webp`}
        width={1672}
        height={941}
      />
      <source
        media="(min-width: 768px)"
        type="image/jpeg"
        srcSet={`${base}-desktop.jpg`}
        width={1672}
        height={941}
      />
      <source
        type="image/webp"
        srcSet={`${base}-mobile.webp`}
        width={retrato.largura}
        height={retrato.altura}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- fotografia de
          ambiente servida por <picture>: o next/image não expressa a troca
          por breakpoint com dois arquivos de proporções diferentes. */}
      <img
        src={`${base}-mobile.jpg`}
        alt=""
        width={retrato.largura}
        height={retrato.altura}
        decoding="async"
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : "auto"}
        className="landing-cena-img"
        style={
          {
            "--cena-pos-mobile": posicaoMobile ?? "center",
            "--cena-pos-desktop": posicaoDesktop ?? "center",
          } as CSSProperties
        }
      />
    </picture>
  );
}
