import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocumentoLegalView } from "@/components/governanca/documento-legal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { carregarVersaoPorPermalink } from "@/modules/governanca/repository";

export const metadata: Metadata = {
  title: "Documento — versão arquivada",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * O PERMALINK DE PROVA.
 *
 * Endereça UMA versão, para sempre — inclusive depois de superada. É para cá
 * que um registro de aceite aponta, e é isto que se abre anos depois para ler
 * o texto exato que a pessoa viu. Uma versão nova nunca altera este endereço;
 * ela ganha o seu.
 *
 * `noindex` de propósito: o buscador deve levar à versão vigente, não a uma
 * arquivada — mas o endereço permanece público e legível por quem o tem.
 */
export default async function PermalinkDeVersaoPage({
  params,
}: {
  params: Promise<{ slug: string; versao: string }>;
}) {
  const { slug, versao } = await params;
  const supabase = await createServerSupabaseClient();
  const encontrado = await carregarVersaoPorPermalink(supabase, slug, decodeURIComponent(versao));

  if (!encontrado) notFound();

  return (
    <DocumentoLegalView
      documento={encontrado.documento}
      versao={encontrado.versao}
      ehPermalink
    />
  );
}
