"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { FormMessage } from "@/components/ui/form-message";
import { whatsappHref } from "@/components/curadoria/whatsapp-contact";
import type { ProviderPresentation } from "@/modules/curadoria/opcao-apresentada";
import {
  closeWithoutRelationshipAction,
  confirmFirstAppointmentAction,
  registerContactIntentAction,
} from "@/modules/connection/actions";
import type { ConnectionRecord } from "@/modules/connection/types";

import type { ReactNode } from "react";

type ConnectionProgressPanelProps = {
  caseId: string;
  connection: ConnectionRecord;
  providerPresentations: ProviderPresentation[];
  /**
   * CORTE DE 23/08 · a declaração do modo de contato, que era um segundo
   * cartão. Renderizada dentro do cartão do acompanhamento no único estado
   * em que ela cabe (DECISAO_REGISTRADA) — o componente repassado tem a
   * própria guarda de status e some sozinho nos demais.
   */
  rodape?: ReactNode;
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
  rodape,
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

  /* O CONCIERGE DENTRO DA FERRAMENTA (decisão do Fundador, 24/08): quem está
     prestes a registrar um passo é exatamente quem pode ter uma dúvida antes
     de registrá-lo. Botão de verdade, ao lado das ações — mesmas regras de
     sempre: rótulo único, assunto tipado, nenhum SLA, clique não registrado. */
  const falarComAliviar = (
    <a
      href={whatsappHref("duvida")}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/70 px-5 text-sm font-medium text-[var(--patient-acento)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      Falar com a Aliviar{" "}
      <span className="sr-only">(abre o WhatsApp em nova aba)</span>
    </a>
  );

  // Estado terminal positivo — nenhum CTA, nenhuma avaliação, nenhum
  // Relationship real criado (apenas o marco de nascimento é identificado
  // pela arquitetura, nunca implementado).
  if (connection.status === "PRIMEIRO_ATENDIMENTO_REALIZADO") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Primeiro atendimento confirmado
          </h2>
        <p className="text-sm text-ink">
          Você seguiu com {displayName}, e o primeiro atendimento foi
          confirmado.
        </p>
      </PatientCard>
    );
  }

  // Estado terminal sem relacionamento — histórico preservado, nenhuma
  // ação, nenhuma nova Curadoria automática, nenhuma reabertura.
  if (connection.status === "ENCERRADO_SEM_RELACIONAMENTO") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Contato encerrado
          </h2>
        <p className="text-sm text-ink">
          Este contato com {displayName} foi encerrado sem início de
          acompanhamento.
        </p>
      </PatientCard>
    );
  }

  // Etapa de revisão de uma ação terminal — nada persistido ainda.
  if (reviewing === "confirmAppointment") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Confirmar primeiro atendimento
          </h2>
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
      </PatientCard>
    );
  }

  if (reviewing === "closeWithoutRelationship") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Encerrar sem continuar
          </h2>
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
      </PatientCard>
    );
  }

  // CONTATO_INICIADO: sem correção, sem "já iniciei contato" (já feito).
  if (connection.status === "CONTATO_INICIADO") {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
            Seu contato
          </h2>
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
          {falarComAliviar}
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
      </PatientCard>
    );
  }

  // DECISAO_REGISTRADA: o acompanhamento aberto e as três ações.
  return (
    <PatientCard>
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          Seu acompanhamento
        </h2>
      <p className="text-sm text-ink">
        {`Acompanhamento aberto com ${displayName}.`}
      </p>
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
        <div className="pt-1">{falarComAliviar}</div>
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

      {rodape}
    </PatientCard>
  );
}
