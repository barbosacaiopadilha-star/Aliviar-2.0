import Link from "next/link";
import type { Metadata } from "next";

import { PatientHomeState } from "@/components/paciente/patient-home-state";
import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import { CuradoriaNaoIniciada } from "@/components/paciente/experiencia/estados-vazios";
import { CuradoriaCard } from "@/components/paciente/experiencia/curadoria-card";
import { JourneyWalk, type WalkStage } from "@/components/paciente/experiencia/journey-walk";
import { ProfileCard } from "@/components/paciente/experiencia/profile-card";
import { PatientWelcome } from "@/components/paciente/dashboard/patient-primitives";
import { derivePatientPending } from "@/modules/paciente/next-action";
import { currentHourInBrazil, greetingFor } from "@/modules/paciente/ambiente";
import {
  mensagemPrincipal,
  STAGE_EYEBROWS,
  WALK_HREFS,
  WALK_LABELS,
  walkStatusOf,
} from "@/modules/paciente/experiencia";
import { loadComoQuerSerCuidada, loadPatientPerfil } from "@/modules/paciente/experiencia-loader";
import { loadModeloDoReconhecimento } from "@/modules/paciente/reconhecimento-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { buildJornada } from "@/modules/curadoria/jornada";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { listStoriesForProfile } from "@/modules/story/repository";
import { listPatientDocuments } from "@/modules/profiles/patient-document-repository";
import { derivePatientHomeState } from "@/modules/paciente/home-state";

export const metadata: Metadata = {
  title: "Minha Jornada",
  robots: { index: false, follow: false },
};

const SECONDARY_LINKS = [
  // ETAPA 9: abre a história EXISTENTE, no passo em que parou — nunca a
  // recepção do wizard, que recomeçava a conversa do zero.
  { label: "Minha história", href: "/sua-historia/continuar" },
  { label: "Documentos", href: "/paciente/documentos" },
  { label: "Minha Curadoria", href: "/paciente/curadoria" },
  { label: "Conta", href: "/paciente/perfil" },
];

/**
 * A home do paciente — quatro blocos, uma ideia cada.
 *
 * Hero ambiental · Jornada como caminhada · Meu Perfil (resumo) · Minha
 * Curadoria (uma frase, uma ação). Tudo o mais abre por Progressive
 * Disclosure, no mesmo ambiente.
 *
 * A régua de sete cartões com descrição, o cartão de próxima ação com três
 * parágrafos e o painel do Perfil aberto por padrão saíram da primeira
 * dobra: eram cinco ideias competindo em quem só queria saber se algo andou.
 * Nada foi removido do produto — mudou de momento.
 */
export default async function PacienteHomePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [stories, caseOverview, caseIds, documentos] = await Promise.all([
    listStoriesForProfile(supabase, authState.user.id),
    getPatientCaseOverview(supabase, authState.user.id),
    listCaseIds(supabase),
    listPatientDocuments(supabase, authState.user.id),
  ]);

  const record = caseIds.length > 0 ? await loadCuradoriaRecord(supabase, caseIds[0]) : null;
  const jornada = record ? buildJornada(record) : null;
  const perfil = record ? await loadPatientPerfil(supabase, record.caseId) : null;
  // ADR-065 — o bloco relacional do Perfil: as respostas dela, nada inferido.
  const comoQuerSerCuidada = record ? await loadComoQuerSerCuidada(supabase, record.caseId) : [];
  // Etapa 2B — a comparação que ela vê ao reconhecer o Perfil é montada AQUI,
  // no servidor, e desce pronta. Nenhuma tela abaixo volta ao banco.
  const modeloDoReconhecimento = record
    ? await loadModeloDoReconhecimento(supabase, record.caseId)
    : null;

  const state = derivePatientHomeState({
    storyStatuses: stories.map((story) => story.status),
    caseOverview,
  });
  const pending = derivePatientPending({ homeState: state, jornada });

  const saudacao = greetingFor(currentHourInBrazil());
  const displayName = authState.profile?.displayName ?? "Paciente";
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  // Sem Case ainda: a jornada não começou, e a home diz isso sem simular
  // uma trilha vazia.
  if (!jornada) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <PatientWelcome name={displayName} subtitle={`${saudacao}. Estamos por aqui.`} />
        <PatientHomeState state={state} />
        {/* O resumo do que já é dela vale desde o primeiro dia — antes de
            existir Case, ele diz com honestidade o que ainda não existe. */}
        <MeuResumo
          historia={stories[0]?.data.historia ?? null}
          documentos={documentos.length}
          relatorioEmitido={false}
        />
        <CuradoriaNaoIniciada />
        <QuickLinks />
      </div>
    );
  }

  const walkStages: WalkStage[] = jornada.stages.map((stage) => ({
    id: stage.id,
    label: WALK_LABELS[stage.id],
    status: walkStatusOf(stage.status),
    // A RLS continua sendo a autoridade: o link leva a uma superfície dela,
    // e o que ela pode ver lá é decidido no servidor, não aqui.
    href: WALK_HREFS[stage.id],
  }));

  const currentStage = jornada.stages.find((stage) => stage.id === jornada.currentStage);

  // A ação principal do cartão da Curadoria: onde ela continua. Só existe
  // quando há de fato uma tela para continuar.
  const curadoriaAction =
    jornada.currentStage === "DOSSIE" ||
    jornada.currentStage === "REUNIAO" ||
    jornada.currentStage === "ESCOLHA" ||
    jornada.currentStage === "ACOMPANHAMENTO"
      ? { label: "Acompanhar", href: "/paciente/curadoria" }
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AmbientHero
        firstName={firstName}
        stage={jornada.currentStage}
        eyebrow={STAGE_EYEBROWS[jornada.currentStage]}
        greeting={saudacao}
      />

      <JourneyWalk
        stages={walkStages}
        currentDetail={currentStage?.description}
        curatorName={jornada.curatorName}
      />

      <MeuResumo
        historia={stories[0]?.data.historia ?? null}
        documentos={documentos.length}
        relatorioEmitido={Boolean(record?.relatorio.emittedAt)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {perfil && record ? (
          <ProfileCard
            perfil={perfil}
            caseId={record.caseId}
            observations={record.prioridades.observations}
            validatedAt={record.validacao?.validatedAt ?? null}
            curatorName={jornada.curatorName}
            comoQuerSerCuidada={comoQuerSerCuidada}
            modelo={modeloDoReconhecimento ?? undefined}
          />
        ) : null}

        <CuradoriaCard
          message={mensagemPrincipal(jornada.currentStage)}
          action={curadoriaAction}
          aside={
            pending.kind === "action" && !pending.action.cta
              ? `Isso acontece na conversa com ${jornada.curatorName}.`
              : undefined
          }
        />
      </div>

      <QuickLinks />
    </div>
  );
}

/**
 * O resumo do que já é da pessoa (ETAPA 9): a história dela, os documentos
 * dela, e o estado do Relatório — sempre dados reais, nunca texto fictício.
 * O que não existe ainda simplesmente não aparece como se existisse.
 */
function MeuResumo({
  historia,
  documentos,
  relatorioEmitido,
}: {
  historia: string | null;
  documentos: number;
  relatorioEmitido: boolean;
}) {
  const resumoDaHistoria = historia?.trim()
    ? historia.trim().length > 220
      ? `${historia.trim().slice(0, 220)}…`
      : historia.trim()
    : null;

  return (
    <section
      aria-label="Resumo"
      className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-3"
    >
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-ink">Sua história</p>
        {resumoDaHistoria ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{resumoDaHistoria}</p>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Você ainda não contou sua história.{" "}
            <Link href="/sua-historia/continuar" className="underline underline-offset-4">
              Começar agora
            </Link>
          </p>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink">Documentos</p>
          <p className="mt-1 text-sm text-ink-muted">
            {documentos === 0
              ? "Nenhum documento enviado."
              : `${documentos} documento(s) enviado(s).`}{" "}
            <Link href="/paciente/documentos" className="underline underline-offset-4">
              Ver
            </Link>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Relatório</p>
          <p className="mt-1 text-sm text-ink-muted">
            {relatorioEmitido ? (
              <>
                Pronto para você.{" "}
                <Link href="/paciente/curadoria" className="underline underline-offset-4">
                  Abrir
                </Link>
              </>
            ) : (
              "Em preparação pela sua Curadoria."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <nav aria-label="Acessos rápidos" className="border-t border-[var(--color-border)] pt-6">
      <ul className="flex flex-wrap gap-x-8 gap-y-3">
        {SECONDARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
