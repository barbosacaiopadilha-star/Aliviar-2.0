import { DocumentoLegalView } from "@/components/governanca/documento-legal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { carregarDocumentoPublico } from "@/modules/governanca/repository";

/**
 * A página pública de um documento, por slug. Uma peça só para todos eles: o
 * que muda entre Privacidade, Termos e cada Consentimento é o slug e o texto
 * — e o texto mora no banco, publicado pelo jurídico, nunca no código.
 *
 * O estado "ainda não publicado" é de primeira classe, e não um erro: esta
 * Sprint entrega a infraestrutura ANTES dos textos, e a página precisa dizer
 * isso com honestidade em vez de quebrar ou fingir conteúdo.
 */
export async function PaginaDeDocumento({
  slug,
  tituloProvisorio,
}: {
  slug: string;
  tituloProvisorio: string;
}) {
  const supabase = await createServerSupabaseClient();
  const encontrado = await carregarDocumentoPublico(supabase, slug);

  if (!encontrado) {
    return (
      <article className="mx-auto max-w-reading px-6 py-16">
        <h1 className="font-serif text-3xl font-normal leading-snug text-ink">
          {tituloProvisorio}
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
