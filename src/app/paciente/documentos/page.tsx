import type { Metadata } from "next";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { CentralDeDocumentos } from "@/components/paciente/documentos/central-de-documentos";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { carregarCentralDeDocumentos } from "@/modules/paciente/central-de-documentos-loader";

export const metadata: Metadata = {
  title: "Seus documentos",
  robots: { index: false, follow: false },
};

/**
 * A6 · A CENTRAL DE DOCUMENTOS.
 *
 * A página não sabe classificar nada: pede a Central pronta ao loader, que a
 * monta pela projeção da D-12.2, e entrega os itens à tela. Toda a regra —
 * origem derivada da autoria, portão de `deliveredAt`, o que é arquivo e o
 * que é artefato — mora longe daqui, testada em isolamento.
 */
export default async function PatientDocumentsPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const itens = await carregarCentralDeDocumentos(supabase, authState.user.id);

  return (
    <div className="space-y-12">
      <PatientPageHeader
        title="Seus documentos"
        description="Tudo o que você enviou e recebeu da Aliviar, em um só lugar."
      />

      {/*
        UMA folha, não uma caixa por item. O PatientShell tem arquitetura ao
        fundo, e ela não pode competir com a leitura de uma lista de exames
        (§15). Uma superfície só resolve isso sem virar grade de arquivos: o
        que a paciente vê é um dossiê, não um gerenciador.
      */}
      <PatientCard className="lg:p-12">
        <CentralDeDocumentos itens={itens} />
      </PatientCard>

      {/* C5 · Track C — no rodapé da central. É aqui que a pergunta é quase
          sempre a mesma: "como eu mando isso para vocês?". O tópico é
          `documento`, e a mensagem já chega escrita com esse assunto. */}
      <ConciergeLink topic="documento" />
    </div>
  );
}
