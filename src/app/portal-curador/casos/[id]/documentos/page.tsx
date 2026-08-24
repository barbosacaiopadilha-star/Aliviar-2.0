import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { DocumentosDoCaso } from "@/components/curadoria/documentos-do-caso";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

export const metadata: Metadata = {
  title: "Documentos do caso",
  robots: { index: false, follow: false },
};

/**
 * OS DOCUMENTOS DO CASO — a papelada que vai e volta pelo WhatsApp.
 *
 * Decisão do Fundador (23/08): quem manda o papel para a paciente é o
 * Curador, pelo WhatsApp; ela preenche à mão, devolve por lá, e ele anexa.
 * O que faltava no produto, então, não era um upload para ela — era isto:
 * as peças já com o nome dela e o de quem cuida do caso, prontas para
 * salvar em PDF e enviar.
 *
 * Sem dependência nova e sem serviço de PDF: a página é feita para
 * imprimir, como a Curadoria da paciente já é. O que o sistema não sabe
 * fica em branco — a conversa é escrita à mão, com as palavras dela.
 */
export default async function DocumentosDoCasoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAnyRole(["curador_medico", "administrador"]);
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 lg:px-8">
      <header className="print:hidden">
        <Link
          href={`/portal-curador/casos/${id}`}
          className="text-sm text-ink-muted underline-offset-4 hover:underline"
        >
          ← Voltar ao caso
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-medium text-ink">Documentos do caso</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">
          As duas peças que {record.patientFirstName} precisa assinar, já com os dados do caso.
          Salve em PDF, envie pelo WhatsApp e anexe a devolutiva aos documentos do caso.
        </p>
      </header>

      <DocumentosDoCaso
        patientName={record.patientName}
        curatorName={record.curatorName}
        abertoEm={record.openedAt}
      />
    </div>
  );
}
