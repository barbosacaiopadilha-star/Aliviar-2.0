import type { Metadata } from "next";

import { DocumentoLegalView } from "@/components/governanca/documento-legal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { carregarDocumentoPublico } from "@/modules/governanca/repository";
import { metadataDeDocumento } from "@/modules/governanca/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDeDocumento("privacidade", "Política de Privacidade");
}

// A página não guarda o texto: ela SERVE a versão vigente que está no banco.
// É o que permite ao jurídico publicar sem tocar em código, e ao aceite
// apontar para exatamente o que foi lido.
export const dynamic = "force-dynamic";

export default async function PrivacidadePage() {
  const supabase = await createServerSupabaseClient();
  const encontrado = await carregarDocumentoPublico(supabase, "privacidade");

  if (!encontrado) {
    return (
      <article className="mx-auto max-w-reading px-6 py-16">
        <h1 className="font-serif text-3xl font-normal leading-snug text-ink">
          Política de Privacidade
        </h1>
        <p className="mt-6 leading-relaxed text-ink-muted">
          O documento ainda não foi publicado. A infraestrutura está pronta para recebê-lo — assim
          que a redação oficial for aprovada, ela aparece aqui com versão, data de vigência e
          endereço permanente.
        </p>
      </article>
    );
  }

  return <DocumentoLegalView documento={encontrado.documento} versao={encontrado.vigente} />;
}
