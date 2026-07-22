"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { JourneyHeader, OnboardingProgress } from "@/components/canonical";
import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import { useExperience } from "@/components/canonical/ExperienceProvider";
import { ExperienceStateGate } from "@/components/canonical/ExperienceStateGate";
import { AcompanhamentoPortalSurface } from "@/components/portal/surfaces/AcompanhamentoPortalSurface";
import { CuradoriaPortalSurface } from "@/components/portal/surfaces/CuradoriaPortalSurface";
import { DocumentosPortalSurface } from "@/components/portal/surfaces/DocumentosPortalSurface";
import { EntregaPortalSurface } from "@/components/portal/surfaces/EntregaPortalSurface";
import { EscolhaPortalSurface } from "@/components/portal/surfaces/EscolhaPortalSurface";
import { OnboardingPortalSurface } from "@/components/portal/surfaces/OnboardingPortalSurface";
import { PortalTimelineSection } from "@/components/portal/PortalTimelineSection";
import { PortalFeedbackSection } from "@/components/portal/PortalFeedbackSection";
import { resolvePortalSurface } from "@/experience-layer/resolve-canonical-experience";
import { listarNotificacoes } from "@/experience-layer/api/notificacoes-client";
import { integrarNotificacoesNaTimeline } from "@/infrastructure/notifications/journey-notification-engine";
import type { TimelineItemView } from "@/experience-flow/contracts/jornada-view";
import type { NotificationTimelineItemView } from "@/notification-flow/contracts/journey-notification";

export function PortalExperienceRouter() {
  const { loadState, refresh } = useExperience();

  return (
    <ExperienceStateGate>
      {loadState.status === "ready" ? (
        <PortalReadySurface onRefresh={refresh} />
      ) : null}
    </ExperienceStateGate>
  );
}

function PortalReadySurface({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { loadState } = useExperience();
  const [timelineIntegrada, setTimelineIntegrada] = useState<
    Array<TimelineItemView | NotificationTimelineItemView>
  >(loadState.status === "ready" ? loadState.view.timeline : []);

  useEffect(() => {
    if (loadState.status !== "ready") return;

    const timer = window.setTimeout(() => {
      void listarNotificacoes()
        .then((notificacoes) => {
          const base = loadState.experience.minhaJornada?.timeline ?? loadState.view.timeline;
          setTimelineIntegrada(integrarNotificacoesNaTimeline(base, notificacoes));
        })
        .catch(() => {
          setTimelineIntegrada(loadState.experience.minhaJornada?.timeline ?? loadState.view.timeline);
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadState]);

  if (loadState.status !== "ready") {
    return null;
  }

  const { view, experience } = loadState;
  const surface = resolvePortalSurface(view);
  const showTimeline =
    surface !== "acompanhamento" &&
    surface !== "minha-jornada" &&
    surface !== "onboarding";

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-12" data-testid="portal-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <JourneyHeader titulo="Portal do Paciente" estado_visivel={view.estado_visivel} />
          <Link href="/portal/notificacoes" className="btn-secondary text-sm" data-testid="portal-notificacoes-link">
            Notificações
          </Link>
        </div>

        {surface === "onboarding" && experience.onboarding ? (
          <>
            <OnboardingSurface model={experience.onboarding} />
            <OnboardingPortalSurface model={experience.onboarding} onAdvanced={onRefresh} />
          </>
        ) : null}

        {surface === "documentos" && experience.documentos ? (
          <DocumentosPortalSurface model={experience.documentos} onUploaded={onRefresh} />
        ) : null}

        {surface === "curadoria" && experience.curadoria ? (
          <CuradoriaPortalSurface model={experience.curadoria} />
        ) : null}

        {surface === "entrega" && experience.entrega ? (
          <EntregaPortalSurface model={experience.entrega} onAdvanced={onRefresh} />
        ) : null}

        {surface === "escolha" && experience.escolha ? (
          <EscolhaPortalSurface model={experience.escolha} onChosen={onRefresh} />
        ) : null}

        {surface === "acompanhamento" && experience.acompanhamento ? (
          <AcompanhamentoPortalSurface model={experience.acompanhamento} ace={experience.ace} />
        ) : null}

        {surface === "minha-jornada" && experience.minhaJornada ? (
          <MinhaJornadaSurface model={experience.minhaJornada} ace={experience.ace} />
        ) : null}

        {showTimeline ? <PortalTimelineSection items={timelineIntegrada} /> : null}

        {surface === "acompanhamento" || surface === "minha-jornada" ? (
          <PortalFeedbackSection jornadaId={view.jornada_id} />
        ) : null}

        {surface === "onboarding" && experience.onboarding ? (
          <OnboardingProgress
            etapas={experience.onboarding.etapas_fluxo}
            percentual={experience.onboarding.progresso.percentual}
          />
        ) : null}
      </main>
    </div>
  );
}
