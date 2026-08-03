import Link from "next/link";

import type { DocumentoLegal, VersaoDeDocumento } from "@/modules/governanca/documentos";
import { permalinkDaVersao } from "@/modules/governanca/documentos";

/**
 * A superfície de leitura de um documento legal — pública e sem sessão.
 *
 * O que ela sempre mostra, junto do texto: qual VERSÃO é aquela, desde quando
 * vige, e o permalink que endereça exatamente este texto para sempre. Sem
 * isso, um documento publicado é só uma página que muda sem aviso — e não
 * serve de prova de nada.
 *
 * O conteúdo é renderizado como texto pré-formatado de propósito: quem redige
 * é o jurídico, e a infraestrutura não deve reinterpretar o que ele escreveu.
 */
export function DocumentoLegalView({
  documento,
  versao,
  ehPermalink = false,
}: {
  documento: DocumentoLegal;
  versao: VersaoDeDocumento | null;
  /** Permalink de versão: avisa quando o texto exibido já foi superado. */
  ehPermalink?: boolean;
}) {
  if (!versao) {
    return (
      <article className="mx-auto max-w-reading px-6 py-16">
        <h1 className="font-serif text-3xl font-normal leading-snug text-ink">{documento.nome}</h1>
        <p className="mt-6 leading-relaxed text-ink-muted">
          Este documento ainda não tem versão publicada. Assim que a redação oficial for aprovada,
          ela aparece aqui — com a data de vigência e o endereço permanente desta versão.
        </p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-reading px-6 py-16">
      <h1 className="font-serif text-3xl font-normal leading-snug text-ink">{documento.nome}</h1>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
        <div className="flex gap-2">
          <dt>Versão</dt>
          <dd className="font-medium text-ink">{versao.versao}</dd>
        </div>
        <div className="flex gap-2">
          <dt>Em vigor desde</dt>
          <dd className="font-medium text-ink">
            {new Date(versao.effectiveAt).toLocaleDateString("pt-BR")}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>Idioma</dt>
          <dd className="font-medium text-ink">{versao.idioma}</dd>
        </div>
      </dl>

      {ehPermalink ? (
        <p className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Você está lendo o endereço permanente desta versão. Ele nunca muda — é assim que se
          comprova, depois, exatamente qual texto estava valendo.{" "}
          <Link href={`/${documento.slug}`} className="font-medium text-brand-primary underline-offset-2 hover:underline">
            Ver a versão em vigor hoje
          </Link>
        </p>
      ) : null}

      <div className="mt-8 whitespace-pre-wrap text-base leading-[1.7] text-ink">
        {versao.conteudo}
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-ink-muted">
        <p>
          Endereço permanente desta versão:{" "}
          <Link
            href={permalinkDaVersao(documento.slug, versao.versao)}
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            {permalinkDaVersao(documento.slug, versao.versao)}
          </Link>
        </p>
      </footer>
    </article>
  );
}
