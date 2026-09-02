import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { carregarDocumentoPublico, listarDocumentosAtivos, listarVersoes } from "./repository";
import { versaoVigente } from "./documentos";

/**
 * INDEXÁVEL SÓ QUANDO HÁ TEXTO (01/09/2026).
 *
 * As quatro páginas jurídicas — Termos, Privacidade, Consentimentos e Termos
 * do Profissional — dizem, com honestidade, que o documento ainda não foi
 * publicado. E até aqui as quatro se declaravam `index, follow`: o buscador
 * era convidado a guardar, em nome da Aliviar, quatro páginas vazias sobre
 * privacidade e contrato. Numa empresa de saúde isso não é só ruído de SEO —
 * é a primeira impressão errada para quem procura exatamente essa garantia.
 *
 * A regra não podia ser um `noindex` fixo: no dia em que o jurídico publicar,
 * um `noindex` esquecido manteria o documento fora da busca para sempre, em
 * silêncio. Então a decisão nasce do próprio banco — a mesma leitura que a
 * página usa para escolher o que mostrar. **Sem texto vigente, `noindex`; com
 * texto vigente, indexável.** Nada para lembrar de virar depois.
 */
export async function metadataDeDocumento(slug: string, titulo: string): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const encontrado = await carregarDocumentoPublico(supabase, slug);
  const publicado = encontrado?.vigente != null;

  return {
    title: titulo,
    robots: { index: publicado, follow: true },
  };
}

/**
 * O índice dos consentimentos segue a mesma regra, mas a pergunta é outra:
 * ele só vale a pena ser encontrado quando existe pelo menos um documento
 * com versão vigente para listar.
 */
export async function metadataDoIndiceDeConsentimentos(titulo: string): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const documentos = await listarDocumentosAtivos(supabase);
  const versoes = await listarVersoes(
    supabase,
    documentos.map((d) => d.id),
  );
  const algumPublicado = documentos.some((d) => versaoVigente(versoes.get(d.id) ?? []) != null);

  return {
    title: titulo,
    robots: { index: algumPublicado, follow: true },
  };
}
