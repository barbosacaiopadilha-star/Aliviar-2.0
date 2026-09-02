import type { Metadata } from "next";

export const SITE_NAME = "Aliviar Curadoria Médica";

export const DESCRICAO_PADRAO =
  "Curadoria médica e de cuidado independente — conectando pessoas a profissionais de confiança, sem posição paga.";

/**
 * A IMAGEM DO LINK (01/09/2026). Até aqui nenhuma página declarava
 * `og:image`: todo endereço da Aliviar colado no WhatsApp, num e-mail ou numa
 * rede saía como um retângulo cinza. É o primeiro contato visual de quem
 * recebe o convite — e o WhatsApp virou o canal de atendimento (ADR-111).
 *
 * O arquivo é gerado por `scripts/gerar-og-image.mjs`, com a mesma cena da
 * home. Não edite `public/og.jpg` à mão: rode o gerador.
 */
export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Uma decisão de saúde importante. Você não precisa tomá-la sozinho. — Aliviar Curadoria Médica",
};

/**
 * O CABEÇALHO DE UMA PÁGINA PÚBLICA INDEXÁVEL — canônico e Open Graph juntos,
 * numa peça só.
 *
 * **Por que uma função, e não campos soltos em cada página.** O metadata do
 * Next é herdado do layout, mas a mistura é **rasa**: uma página que escreve
 * `openGraph: { url: "/o-que-e" }` não acrescenta a `url` ao Open Graph do
 * layout — ela **troca o objeto inteiro**, e perde a imagem, o `siteName`, o
 * `type` e o `locale` junto. Foi exatamente o que aconteceu no primeiro
 * conserto de 01/09: a `og:image` sobrou nas quatro páginas jurídicas
 * `noindex` e sumiu justamente da home, de `/o-que-e` e de
 * `/solicitar-atendimento` — as três que alguém compartilha.
 *
 * **E o canônico não pode subir para o layout**, que seria a outra saída
 * óbvia: sendo herdado, um `canonical: "/"` na raiz declararia todas as
 * páginas como cópias da home, e canônico errado tira a página do índice.
 *
 * Sobra este meio: cada página indexável chama esta função com a sua rota, e
 * recebe o conjunto completo e coerente.
 */
export function metadataPublica({
  rota,
  titulo,
  descricao,
}: {
  /** Caminho absoluto a partir da raiz, como "/o-que-e". A home é "/". */
  rota: string;
  /** O título do Open Graph. Sem ele, vale o nome da casa. */
  titulo?: string;
  descricao?: string;
}): Metadata {
  const texto = descricao ?? DESCRICAO_PADRAO;
  return {
    alternates: { canonical: rota },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      title: titulo ?? SITE_NAME,
      description: texto,
      url: rota,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo ?? SITE_NAME,
      description: texto,
      images: [OG_IMAGE.url],
    },
  };
}
