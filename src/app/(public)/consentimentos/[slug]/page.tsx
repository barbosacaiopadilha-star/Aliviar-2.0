import type { Metadata } from "next";

import { PaginaDeDocumento } from "@/components/governanca/pagina-de-documento";

export const metadata: Metadata = { title: "Consentimento" };
export const dynamic = "force-dynamic";

export default async function ConsentimentoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // O slug da URL é o slug do documento — endereço estável, decidido pelo
  // jurídico ao publicar, não por uma lista fixa aqui.
  return <PaginaDeDocumento slug={slug} tituloProvisorio="Consentimento" />;
}
