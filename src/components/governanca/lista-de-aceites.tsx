import Link from "next/link";

import type {
  AceiteRegistrado,
  DocumentoLegal,
  VersaoDeDocumento,
} from "@/modules/governanca/documentos";
import { permalinkDaVersao } from "@/modules/governanca/documentos";

/**
 * O histórico de aceites de uma pessoa — a superfície que responde, sem que
 * ela precise pedir a ninguém: "o que eu aceitei, quando, e qual texto era".
 *
 * Todo aceite mostra o PERMALINK da versão aceita, não o link do documento
 * vigente. A diferença é o ponto inteiro: o que ela aceitou foi aquele texto,
 * e é aquele que precisa continuar acessível — mesmo depois de superado.
 */
export function ListaDeAceites({
  aceites,
  documentos,
  versoes,
}: {
  aceites: readonly AceiteRegistrado[];
  documentos: readonly DocumentoLegal[];
  versoes: ReadonlyMap<string, readonly VersaoDeDocumento[]>;
}) {
  if (aceites.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
        Você ainda não registrou nenhum aceite.
      </p>
    );
  }

  // Índice versão → (documento, versão) para exibir nome e permalink.
  const porVersao = new Map<string, { documento: DocumentoLegal; versao: VersaoDeDocumento }>();
  for (const documento of documentos) {
    for (const versao of versoes.get(documento.id) ?? []) {
      porVersao.set(versao.id, { documento, versao });
    }
  }

  return (
    <ul className="space-y-3">
      {aceites.map((aceite) => {
        const referencia = porVersao.get(aceite.versionId);
        const revogado = aceite.revogadoEm !== null;

        return (
          <li key={aceite.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium text-ink">
                {referencia?.documento.nome ?? "Documento"}
              </h3>
              <span className={`text-xs ${revogado ? "text-ink-muted" : "text-success"}`}>
                {revogado ? "Revogado" : "Vigente"}
              </span>
            </div>

            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-ink-muted sm:grid-cols-2">
              <div className="flex gap-2">
                <dt>Versão</dt>
                <dd className="text-ink">{referencia?.versao.versao ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt>Aceito em</dt>
                <dd className="text-ink">
                  {new Date(aceite.aceitoEm).toLocaleString("pt-BR")}
                </dd>
              </div>
              {revogado ? (
                <div className="flex gap-2">
                  <dt>Revogado em</dt>
                  <dd className="text-ink">
                    {new Date(aceite.revogadoEm!).toLocaleString("pt-BR")}
                  </dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt>Idioma</dt>
                <dd className="text-ink">{aceite.idioma}</dd>
              </div>
            </dl>

            {referencia ? (
              <p className="mt-3 text-sm">
                <Link
                  href={permalinkDaVersao(referencia.documento.slug, referencia.versao.versao)}
                  className="font-medium text-brand-primary underline-offset-2 hover:underline"
                >
                  Ler o texto exato que você aceitou
                </Link>
              </p>
            ) : null}

            {/* A impressão digital do texto aceito. Não é enfeite técnico: é
                o que permite provar, depois, que o documento não mudou. */}
            <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-ink-muted">
              Impressão digital do texto: {aceite.conteudoHash}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
