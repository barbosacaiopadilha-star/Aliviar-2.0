"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { deliverFinalCuradoriaAction } from "@/modules/concierge/delivery-actions";
import type { FinalCuradoriaDeliveryRecord } from "@/modules/concierge/types";

type FinalCuradoriaDeliveryPanelProps = {
  caseId: string;
  canDeliver: boolean;
  delivery: FinalCuradoriaDeliveryRecord | null;
};

// Última etapa do pipeline — nunca automática, sempre um clique explícito
// de quem já viu a decisão validada. Uma vez entregue, não há botão para
// desfazer nesta sprint: reabertura é fluxo próprio, ainda não construído.
export function FinalCuradoriaDeliveryPanel({ caseId, canDeliver, delivery }: FinalCuradoriaDeliveryPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeliver() {
    setError(null);
    startTransition(async () => {
      const result = await deliverFinalCuradoriaAction(caseId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  }

  if (delivery) {
    return (
      <Alert variant="success">
        Curadoria entregue em {new Date(delivery.deliveredAt).toLocaleString("pt-BR")} por {delivery.deliveredByName}.
      </Alert>
    );
  }

  if (!canDeliver) {
    return (
      <Alert variant="info">
        Ainda não há uma decisão de revisão validada para entregar — a Curadoria só pode ser entregue depois de um
        Aprovar ou Ajustar validado.
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Alert variant="info">
        Ao entregar, o paciente passa a ver a Curadoria completa em sua área. Esta ação não pode ser desfeita nesta
        versão do produto.
      </Alert>
      <Button type="button" isLoading={isPending} onClick={handleDeliver}>
        Entregar Curadoria ao paciente
      </Button>
      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
