"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import {
  closeWithoutRelationshipAction,
  confirmFirstAppointmentAction,
  registerContactIntentAction,
} from "@/modules/connection/actions";
import type { ConnectionRecord } from "@/modules/connection/types";

type ConnectionProgressPanelProps = {
  caseId: string;
  connection: ConnectionRecord;
  providerPresentations: ProviderPresentation[];
  // Só é oferecida em DECISAO_REGISTRADA — o próprio ConnectionChoicePanel
  // decide isso e só passa esta prop quando a correção é permitida.
  onRequestEdit?: () => void;
};

// Ação terminal (confirmar atendimento, encerrar) sempre exige uma etapa de
// revisão antes de persistir (Etapa 7) — nunca no primeiro clique.
// Registrar intenção de contato não é terminal e é de baixa consequência
// (o paciente ainda pode confirmar atendimento ou encerrar depois), por
// isso persiste direto, sem etapa própria — mesma distinção já registrada
// no domínio (Connection & Relationship, Fase 2/3): é sempre uma
// declaração, nunca verificada externamente, mas registrá-la não é
// irreversível no sentido de fechar o Connection.
type ReviewingOutcome =
  "confirmAppointment" | "closeWithoutRelationship" | null;

// Todas as ações desta etapa são declarações do próprio paciente — nunca
// fatos verificados externamente (nenhuma integração de WhatsApp/telefonia/
// agenda existe). Nenhuma delas cria Relationship, produz ExperienceSignal
// ou envolve Compatibility Intelligence.
export function ConnectionProgressPanel({
  caseId,
  connection,
  providerPresentations,
  onRequestEdit,
}: ConnectionProgressPanelProps) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState<ReviewingOutcome>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = providerPresentations.find(
    (presentation) =>
      presentation.providerId === connection.professionalProfileId,
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

  // Estado terminal positivo — nenhum CTA, nenhuma avaliação, nenhum
  // Relationship real criado (apenas o marco de nascimento é identificado
  // pela arquitetura, nunca implementado).
  if (connection.status === "PRIMEIRO_ATENDIMENTO_REALIZADO") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Primeiro atendimento confirmado
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Você seguiu com {displayName}, e o primeiro atendimento foi
          confirmado.
        </p>
      </Card>
    );
  }

  // Estado terminal sem relacionamento — histórico preservado, nenhuma
  // ação, nenhuma nova Curadoria automática, nenhuma reabertura.
  if (connection.status === "ENCERRADO_SEM_RELACIONAMENTO") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Contato encerrado
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Este contato com {displayName} foi encerrado sem início de
          acompanhamento.
        </p>
      </Card>
    );
  }

  // Etapa de revisão de uma ação terminal — nada persistido ainda.
  if (reviewing === "confirmAppointment") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Confirmar primeiro atendimento
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Você está confirmando que o primeiro atendimento com {displayName}{" "}
          realmente aconteceu.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Esse registro encerra este acompanhamento — nenhuma avaliação do
          profissional está sendo pedida.
        </p>
        {errorBanner}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            isLoading={isPending}
            onClick={() =>
              runAction(() => confirmFirstAppointmentAction({ caseId }))
            }
          >
            Confirmar
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
      </Card>
    );
  }

  if (reviewing === "closeWithoutRelationship") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Encerrar sem continuar
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Este registro apenas informa que o contato com {displayName} não
          avançou — não avalia o profissional, não cria uma nova Curadoria, e
          não apaga a escolha já feita.
        </p>
        {errorBanner}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            isLoading={isPending}
            onClick={() =>
              runAction(() => closeWithoutRelationshipAction({ caseId }))
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
      </Card>
    );
  }

  // CONTATO_INICIADO: sem correção, sem "já iniciei contato" (já feito).
  if (connection.status === "CONTATO_INICIADO") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Seu contato
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Você registrou que iniciou o contato com {displayName}.
        </p>
        {errorBanner}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => setReviewing("confirmAppointment")}
          >
            Confirmar primeiro atendimento
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-auto"
            onClick={() => setReviewing("closeWithoutRelationship")}
          >
            O contato não avançou
          </Button>
        </div>
      </Card>
    );
  }

  // DECISAO_REGISTRADA: escolha + correção (se permitida) + as três ações.
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">
          Sua escolha
        </h2>
      </CardHeader>
      <p className="text-sm text-ink">
        Você escolheu seguir com {displayName}.
      </p>
      {onRequestEdit ? (
        <>
          <p className="mt-2 text-sm text-ink-muted">
            Você ainda pode alterar essa escolha antes de iniciar o contato.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-auto"
            onClick={onRequestEdit}
          >
            Alterar minha escolha
          </Button>
        </>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="text-sm text-ink-muted">
          Quando você decidir dar o próximo passo, pode registrar por aqui.
        </p>
        {errorBanner}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            isLoading={isPending}
            onClick={() =>
              runAction(() => registerContactIntentAction({ caseId }))
            }
          >
            Já iniciei o contato
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setReviewing("confirmAppointment")}
          >
            O primeiro atendimento já aconteceu
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-auto"
          disabled={isPending}
          onClick={() => setReviewing("closeWithoutRelationship")}
        >
          O contato não avançou
        </Button>
      </div>
    </Card>
  );
}
