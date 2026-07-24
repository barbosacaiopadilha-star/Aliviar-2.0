"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { FormMessage } from "@/components/ui/form-message";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import {
  declarePlannedRelationshipClosureAction,
  declareRelationshipInterruptionAction,
} from "@/modules/relationship/actions";
import type { RelationshipRecord } from "@/modules/relationship";

type RelationshipStatusPanelProps = {
  caseId: string;
  relationship: RelationshipRecord;
  providerPresentations: ProviderPresentation[];
};

type Reviewing = "close" | "interrupt" | null;

// Superfície do paciente para acompanhar e alterar o próprio Relationship
// já nascido (PR4) — nunca cria, nunca reabre, nunca troca profissional.
// Irmão de ConnectionChoicePanel/ConnectionProgressPanel, nunca dentro
// deles: os dois domínios permanecem visualmente distintos. Toda ação
// aqui é sempre uma declaração explícita do paciente — nunca inferida por
// silêncio, nunca uma confirmação em nome do profissional.
//
// [CORRIGIDO — Fase 6.1] A versão anterior oferecia "Pausar
// acompanhamento"/"Retomar acompanhamento" e distinguia dois estados
// terminais (ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO) — construída
// sobre uma teoria de Relationship anterior à Fase 4.1, que rejeitou
// PAUSADO como estado e exige um único ENCERRADO (o motivo vive no
// evento, nunca em `relationship.status`). O componente agora só conhece
// os dois estados oficiais da teoria: ATIVO e ENCERRADO. As duas ações de
// encerramento (planejada/interrupção) continuam existindo — cada uma
// produz um evento diferente — mas ambas levam ao mesmo estado ENCERRADO,
// exibido de forma genérica (o registro não carrega hoje um motivo
// legível na própria linha do Aggregate — distinguir a mensagem exigiria
// consultar o histórico de eventos, fora do escopo desta correção).
export function RelationshipStatusPanel({
  caseId,
  relationship,
  providerPresentations,
}: RelationshipStatusPanelProps) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState<Reviewing>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = providerPresentations.find(
    (presentation) =>
      presentation.providerId === relationship.professionalProfileId,
  );
  const displayName = current?.displayName ?? "o profissional selecionado";

  function runAction(
    action: () => Promise<
      { success: true } | { success: false; error: string }
    >,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setReviewing(null);
      router.refresh();
    });
  }

  const errorBanner = error ? (
    <FormMessage variant="error" className="mt-3">
      {error}
    </FormMessage>
  ) : null;

  // Estado terminal — zero CTAs, nenhuma avaliação, nenhuma reabertura,
  // nenhuma nova Curadoria.
  if (relationship.status === "ENCERRADO") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Acompanhamento encerrado
          </h2>
        <p className="text-sm text-ink">
          Este acompanhamento foi registrado como encerrado.
        </p>
      </PatientCard>
    );
  }

  // Etapas de revisão — nada persistido ainda.
  if (reviewing === "close") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Registrar encerramento planejado
          </h2>
        <p className="text-sm text-ink">
          Você está registrando que o acompanhamento com {displayName} foi
          concluído de forma planejada.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Esse registro é final — não avalia {displayName}, e não cria uma nova
          Curadoria automaticamente.
        </p>
        {errorBanner}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            isLoading={isPending}
            onClick={() =>
              runAction(() =>
                declarePlannedRelationshipClosureAction({ caseId }),
              )
            }
          >
            Confirmar encerramento
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setReviewing(null)}
          >
            Voltar
          </Button>
        </div>
      </PatientCard>
    );
  }

  if (reviewing === "interrupt") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Registrar interrupção
          </h2>
        <p className="text-sm text-ink">
          Você está registrando que o acompanhamento com {displayName} foi
          interrompido.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Esse registro não avalia {displayName} nem indica um problema — é
          apenas uma atualização de sua parte.
        </p>
        {errorBanner}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            isLoading={isPending}
            onClick={() =>
              runAction(() => declareRelationshipInterruptionAction({ caseId }))
            }
          >
            Confirmar interrupção
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setReviewing(null)}
          >
            Voltar
          </Button>
        </div>
      </PatientCard>
    );
  }

  // ATIVO
  return (
    <PatientCard>
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        Seu acompanhamento
      </h2>
      <p className="patient-body text-[var(--patient-ink)]">
        Seu acompanhamento com {displayName} está registrado como ativo.
      </p>
      {errorBanner}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => setReviewing("close")}
        >
          Registrar encerramento planejado
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 w-auto"
        disabled={isPending}
        onClick={() => setReviewing("interrupt")}
      >
        O acompanhamento foi interrompido
      </Button>
    </PatientCard>
  );
}
