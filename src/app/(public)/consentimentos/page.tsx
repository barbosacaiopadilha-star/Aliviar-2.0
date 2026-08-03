import type { Metadata } from "next";
import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listarDocumentosAtivos, listarVersoes } from "@/modules/governanca/repository";
import { permalinkDaVersao, versaoVigente } from "@/modules/governanca/documentos";

export const metadata: Metadata = { title: "Consentimentos" };
export const dynamic = "force-dynamic";

/**
 * O índice dos consentimentos — a página que existe para que ninguém precise
 * caçar o que assinou. Lista o que está publicado, para quem vale, e leva ao
 * texto integral e ao endereço permanente de cada versão.
 *
 * Enquanto o jurídico não publicar nada, a página diz isso — em vez de fingir
 * conteúdo ou quebrar.
 */
export default async function ConsentimentosPage() {
  const supabase = await createServerSupabaseClient();
  const documentos = await listarDocumentosAtivos(supabase);
  const versoes = await listarVersoes(supabase, documentos.map((d) => d.id));

  const consentimentos = documentos.filter((d) => d.revogavel || d.slug.startsWith("consentimento"));
  const outros = documentos.filter((d) => !consentimentos.includes(d));

  return (
    <div className="mx-auto max-w-reading px-6 py-16">
      <h1 className="font-serif text-3xl font-normal leading-snug text-ink">Consentimentos</h1>
      <p className="mt-5 max-w-prose leading-relaxed text-ink-muted">
        Cada consentimento é um ato separado, com texto próprio. Nada aqui é aceito em bloco: você
        decide um a um, e pode consultar a qualquer momento o que aceitou e quando.
      </p>

      {documentos.length === 0 ? (
        <p className="mt-10 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Nenhum documento publicado ainda. A infraestrutura está pronta para recebê-los — assim
          que a redação oficial for aprovada, eles aparecem aqui com versão e data de vigência.
        </p>
      ) : (
        <>
          <Secao titulo="Consentimentos" documentos={consentimentos} versoes={versoes} />
          <Secao titulo="Outros documentos" documentos={outros} versoes={versoes} />
        </>
      )}
    </div>
  );
}

function Secao({
  titulo,
  documentos,
  versoes,
}: {
  titulo: string;
  documentos: Awaited<ReturnType<typeof listarDocumentosAtivos>>;
  versoes: Awaited<ReturnType<typeof listarVersoes>>;
}) {
  if (documentos.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-medium text-ink">{titulo}</h2>
      <ul className="mt-4 space-y-4">
        {documentos.map((documento) => {
          const vigente = versaoVigente(versoes.get(documento.id) ?? []);
          return (
            <li key={documento.id} className="rounded-md border border-border p-4">
              <h3 className="font-medium text-ink">{documento.nome}</h3>
              {documento.resumo ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{documento.resumo}</p>
              ) : null}
              <p className="mt-2 text-xs text-ink-muted">
                Para: {documento.audiencia.join(", ")} ·{" "}
                {documento.obrigatorio ? "obrigatório" : "opcional"} ·{" "}
                {documento.revogavel ? "revogável" : "não revogável"}
              </p>
              {vigente ? (
                <p className="mt-3 text-sm">
                  <Link
                    href={permalinkDaVersao(documento.slug, vigente.versao)}
                    className="font-medium text-brand-primary underline-offset-2 hover:underline"
                  >
                    Ler a versão {vigente.versao}
                  </Link>{" "}
                  <span className="text-ink-muted">
                    · em vigor desde {new Date(vigente.effectiveAt).toLocaleDateString("pt-BR")}
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">Sem versão publicada.</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
