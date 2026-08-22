"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { changeCaseStatusAction } from "@/modules/cases/actions";
import { allowedNextStatuses } from "@/modules/cases/state-machine";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

type CaseStatusControlProps = {
  caseId: string;
  currentStatus: CaseStatus;
};

/**
 * ESTADOS QUE O DROPDOWN DEIXA DE OFERECER — eram do motor, não de gente.
 *
 * `IN_CURATION`, `HUMAN_REVIEW` e `DELIVERED` eram movidos pelo orquestrador
 * do motor ACE, removido em 21/08/2026. Desde então, oferecer esses estados
 * aqui é convidar um humano a DECLARAR onde a Curadoria está — e o lugar
 * verdadeiro dela já é derivado de fatos (responsável, entrega registrada),
 * nunca de um select. Dois relógios para a mesma hora: um deles mente.
 *
 * A máquina completa continua intacta no banco (trigger da migration
 * 20260712100000, ADR-019) — nada aqui a contradiz. O que muda é o convite:
 * o Administrador segue operando a fase que é dele (revisão, aguardo de
 * informação, pronto para curadoria, cancelamento), e a fase da Curadoria
 * deixa de ter um botão que a simule. Encolher a máquina no banco fica para
 * o descongelamento (ADR-073).
 */
// Exportado (C3, auditoria 22/08): o filtro da listagem bebe da MESMA fonte
// — oferecer esses estados no filtro só produzia resultado vazio.
export const ESTADOS_DO_MOTOR_EXTINTO: readonly CaseStatus[] = ["IN_CURATION", "HUMAN_REVIEW", "DELIVERED"];

export function CaseStatusControl({ caseId, currentStatus }: CaseStatusControlProps) {
  const [status, setStatus] = useState(currentStatus);
  const [nextStatus, setNextStatus] = useState<CaseStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const options = allowedNextStatuses(status).filter(
    (option) => !ESTADOS_DO_MOTOR_EXTINTO.includes(option),
  );

  function handleChange() {
    if (!nextStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await changeCaseStatusAction({ caseId, nextStatus });
      if (result.success) {
        setStatus(nextStatus);
        setNextStatus("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">
        Status atual: <span className="font-medium text-ink">{CASE_STATUS_LABELS[status]}</span>
      </p>

      {options.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            aria-label="Novo status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as CaseStatus)}
          >
            <option value="">Selecione o novo status</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {CASE_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
          {/* Espremido pelo Select ao lado, o rótulo quebrava em duas linhas e
              o botão ficava com 64px de altura contra os 44px de todos os
              outros da tela. Ele não encolhe nem quebra: mantém a altura de
              alvo de toque e o ritmo da página. */}
          <Button
            type="button"
            variant="secondary"
            className="w-full shrink-0 whitespace-nowrap sm:w-auto"
            isLoading={isPending}
            disabled={!nextStatus}
            onClick={handleChange}
          >
            Mudar status
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Este é um status final — não há mais transições.</p>
      )}

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
