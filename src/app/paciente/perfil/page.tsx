import type { Metadata } from "next";
import Link from "next/link";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { PerfilPanel } from "@/components/paciente/perfil-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getCommunicationPreferences, getPatientProfile } from "@/modules/profiles";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { nomeDoCuradorDoCaso } from "@/modules/paciente/nome-do-curador";
import { loadComoQuerSerCuidada, loadPatientPerfil } from "@/modules/paciente/experiencia-loader";
import { loadModeloDoReconhecimento } from "@/modules/paciente/reconhecimento-model";

import { PatientProfileForm } from "@/components/profiles/patient-profile-form";

export const metadata: Metadata = {
  title: "Meu perfil",
  robots: { index: false, follow: false },
};

/**
 * ENXUGAMENTO DE 23/08 (decisão do Fundador, foco no celular).
 *
 * O Mapa de Prioridades — o painel mais longo do produto — abria INTEIRO
 * dentro da Home, dobrando a primeira tela. Ele passa a morar aqui, que é
 * onde a régua dos marcos já apontava (`MARCO_HREFS.ANALISE`) e onde o menu
 * promete "Meus dados": tudo que é dela num lugar só — primeiro o que ela
 * disse que importa, depois como falar com ela.
 *
 * Nada de novo é decidido nesta tela: os mesmos carregadores da Home, os
 * mesmos dados, o mesmo componente. O que mudou foi o endereço.
 */
export default async function PatientProfilePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [profile, preferences, caseIds] = await Promise.all([
    getPatientProfile(supabase, authState.user.id),
    getCommunicationPreferences(supabase, authState.user.id),
    listCaseIds(supabase),
  ]);

  const record = caseIds.length > 0 ? await loadCuradoriaRecord(supabase, caseIds[0]) : null;
  const perfil = record ? await loadPatientPerfil(supabase, record.caseId) : null;
  const [curatorName, comoQuerSerCuidada, modelo] = record
    ? await Promise.all([
        nomeDoCuradorDoCaso(supabase, record.caseId),
        loadComoQuerSerCuidada(supabase, record.caseId),
        loadModeloDoReconhecimento(supabase, record.caseId),
      ])
    : [null, [], null];

  return (
    <div className="space-y-10">
      {perfil && record ? (
        <PerfilPanel
          perfil={perfil}
          caseId={record.caseId}
          observations={record.prioridades.observations}
          validatedAt={record.validacao?.validatedAt ?? null}
          curatorName={curatorName}
          comoQuerSerCuidada={comoQuerSerCuidada}
          linhas={modelo?.linhas}
          tecnicos={modelo?.tecnicos}
        />
      ) : null}

      <PatientProfileForm
        initialPhone={profile?.phone ?? ""}
        initialCity={profile?.city ?? ""}
        initialState={profile?.state ?? ""}
        initialPreferredChannel={preferences.preferredChannel}
        initialAcceptsReminders={preferences.acceptsReminders}
      />

      {/* CORTE FUNDO DE 23/08 · "Documentos" saiu do menu (quatro itens, um
          por ato da casa) e passa a ser encontrado aqui, na tela do que é
          dela. A rota continua inteira — nada foi removido, só reendereçado.
          A porta é explícita, não escondida: é direito dela ver o que enviou
          e o que recebeu. */}
      <p className="max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Tudo o que você enviou e recebeu da Aliviar fica em{" "}
        <Link
          href="/paciente/documentos"
          className="font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Seus documentos
        </Link>
        .
      </p>

      {/* C6 · Track C — corrigir um dado próprio é um dos motivos mais comuns
          de querer falar com alguém. A porta fica no fim, fora do formulário:
          nunca disputa com o botão de salvar. */}
      <ConciergeLink topic="jornada" />
    </div>
  );
}
