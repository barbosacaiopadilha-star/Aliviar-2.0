"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveLeadAdminAction,
  deleteLeadAdminAction,
  restoreLeadAdminAction,
} from "@/modules/crm/admin-lead-actions";

type AdministrativeAction = "archive" | "restore" | "delete";

type LeadAdminActionsProps = {
  leadId: string;
  fullName: string;
  archived: boolean;
  hasPatient: boolean;
  hasCase: boolean;
  returnHref: string;
};

export function LeadAdminActions({
  leadId,
  fullName,
  archived,
  hasPatient,
  hasCase,
  returnHref,
}: LeadAdminActionsProps) {
  const router = useRouter();
  const [action, setAction] = useState<AdministrativeAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reasonValid = reason.trim().length >= 3 && reason.trim().length <= 500;
  const confirmationValid = confirmation === fullName;

  const close = useCallback(() => {
    if (pending) return;
    setAction(null);
    setReason("");
    setConfirmation("");
    setError(null);
  }, [pending]);

  function submit() {
    if (
      !action ||
      !reasonValid ||
      (action === "delete" && !confirmationValid) ||
      pending
    )
      return;

    setError(null);
    startTransition(async () => {
      const result =
        action === "archive"
          ? await archiveLeadAdminAction({ leadId, reason: reason.trim() })
          : action === "restore"
            ? await restoreLeadAdminAction({ leadId, reason: reason.trim() })
            : await deleteLeadAdminAction({
                leadId,
                reason: reason.trim(),
                confirmation,
              });

      if (!result.success) {
        setError(result.error ?? "Não foi possível concluir a ação.");
        return;
      }

      setAction(null);
      router.push(returnHref);
      router.refresh();
    });
  }

  const title =
    action === "archive"
      ? "Arquivar lead"
      : action === "restore"
        ? "Restaurar lead"
        : "Apagar lead definitivamente";

  return (
    <section
      className="rounded-md border border-border bg-surface p-4"
      aria-labelledby="lead-admin-title"
    >
      <h2 id="lead-admin-title" className="text-sm font-semibold text-ink">
        Administração do lead
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Ações exclusivas do Administrador. Todas exigem motivo e ficam
        registradas na auditoria.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {archived ? (
          <Button variant="secondary" onClick={() => setAction("restore")}>
            Restaurar lead
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setAction("archive")}>
            Arquivar lead
          </Button>
        )}
        <Button variant="danger" onClick={() => setAction("delete")}>
          Apagar definitivamente
        </Button>
      </div>

      <Dialog open={action !== null} onClose={close} title={title}>
        {action === "archive" ? (
          <p className="text-sm text-ink-muted">
            O lead sairá das filas e dos indicadores ativos. O Administrador
            poderá restaurá-lo depois.
          </p>
        ) : null}

        {action === "restore" ? (
          <p className="text-sm text-ink-muted">
            O lead voltará à etapa em que estava antes do arquivamento e
            reaparecerá nas filas correspondentes.
          </p>
        ) : null}

        {action === "delete" ? (
          <div className="space-y-2 rounded-md border border-error bg-error-surface p-3 text-sm text-ink">
            <p className="font-medium">Esta ação é irreversível.</p>
            <p>
              Interações, tarefas e compromissos vinculados ao lead também serão
              apagados.
            </p>
            {hasPatient || hasCase ? (
              <p>
                {hasPatient ? "O paciente será preservado. " : ""}
                {hasCase ? "O Case será preservado. " : ""}O vínculo de origem
                com este lead deixará de existir.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="lead-admin-reason"
              className="block text-sm font-medium text-ink"
            >
              Motivo da ação
            </label>
            <Textarea
              id="lead-admin-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Explique por que esta ação é necessária."
              error={reason.length > 0 && !reasonValid}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Entre 3 e 500 caracteres.
            </p>
          </div>

          {action === "delete" ? (
            <Input
              id="lead-delete-confirmation"
              label={`Digite exatamente “${fullName}” para confirmar`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              error={
                confirmation.length > 0 && !confirmationValid
                  ? "O nome não corresponde."
                  : undefined
              }
            />
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant={action === "delete" ? "danger" : "primary"}
              onClick={submit}
              disabled={
                !reasonValid || (action === "delete" && !confirmationValid)
              }
              isLoading={pending}
            >
              {action === "archive"
                ? "Confirmar arquivamento"
                : action === "restore"
                  ? "Confirmar restauração"
                  : "Apagar definitivamente"}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
