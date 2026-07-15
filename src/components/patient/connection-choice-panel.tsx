"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Radio } from "@/components/ui/radio";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import {
  correctChoiceAction,
  createConnectionAction,
} from "@/modules/connection/actions";
import type { ConnectionRecord } from "@/modules/connection/types";

import { ConnectionProgressPanel } from "./connection-progress-panel";

type ConnectionChoicePanelProps = {
  caseId: string;
  providerPresentations: ProviderPresentation[];
  connection: ConnectionRecord | null;
};

type Step = "choosing" | "reviewing";

// Permite ao paciente escolher um dos três profissionais apresentados na
// própria Curadoria, revisar antes de confirmar, e corrigir enquanto o
// Connection permanecer em DECISAO_REGISTRADA. Nunca escreve no banco antes
// da confirmação explícita; toda persistência passa exclusivamente por
// createConnectionAction/correctChoiceAction (PR3) — esta interface nunca
// decide, apenas coleta a decisão já tomada pelo paciente.
export function ConnectionChoicePanel({
  caseId,
  providerPresentations,
  connection,
}: ConnectionChoicePanelProps) {
  const router = useRouter();
  const isCorrectable = connection?.status === "DECISAO_REGISTRADA";
  const [isEditing, setIsEditing] = useState(!connection);
  const [step, setStep] = useState<Step>("choosing");
  const [selectedId, setSelectedId] = useState<string | null>(
    isCorrectable ? connection!.professionalProfileId : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const groupName = useId();

  // Connection existe e não estamos em modo de edição: delega a exibição
  // (e as ações de desfecho, PR5) para ConnectionProgressPanel — nunca
  // duplica aqui a lógica de estado além do necessário para decidir se
  // oferece "corrigir" (só em DECISAO_REGISTRADA).
  if (connection && !isEditing) {
    return (
      <ConnectionProgressPanel
        caseId={caseId}
        connection={connection}
        providerPresentations={providerPresentations}
        onRequestEdit={
          isCorrectable
            ? () => {
                setIsEditing(true);
                setStep("choosing");
              }
            : undefined
        }
      />
    );
  }

  const selectedPresentation =
    providerPresentations.find(
      (presentation) => presentation.providerId === selectedId,
    ) ?? null;

  function handleConfirm() {
    if (!selectedId) return;
    setError(null);

    startTransition(async () => {
      const result = connection
        ? await correctChoiceAction({
            caseId,
            newProfessionalProfileId: selectedId,
          })
        : await createConnectionAction({
            caseId,
            professionalProfileId: selectedId,
          });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // router.refresh() só reexecuta o Server Component (busca o
      // Connection já persistido) — nunca reseta o estado local deste
      // Client Component sozinho, diferente do reload de página inteira
      // que isto substitui. Sem este reset explícito, `isEditing`/`step`
      // continuariam "reviewing" depois do refresh, e o botão "Confirmar
      // minha escolha" reapareceria já confirmado — arriscando uma
      // segunda submissão (desta vez como correctChoiceAction) sobre o
      // mesmo valor. `isCorrectable`/`connection` já vêm corretos da nova
      // prop; só o estado local desta etapa de edição precisa voltar ao
      // repouso.
      setIsEditing(false);
      setStep("choosing");
      router.refresh();
    });
  }

  // Etapa de revisão — nada foi persistido ainda.
  if (step === "reviewing" && selectedPresentation) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Confirme sua escolha
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">
          Você escolheu seguir com {selectedPresentation.displayName}.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Essa escolha será registrada, e você ainda poderá corrigi-la enquanto
          não iniciar o contato.
        </p>
        {error ? (
          <FormMessage variant="error" className="mt-3">
            {error}
          </FormMessage>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button type="button" isLoading={isPending} onClick={handleConfirm}>
            Confirmar minha escolha
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setStep("choosing")}
          >
            Rever profissionais
          </Button>
        </div>
      </Card>
    );
  }

  // Etapa de seleção — os três profissionais com o mesmo peso visual,
  // nenhum destaque, nenhuma ordem de preferência implícita (a própria
  // ordem já vem neutra de FinalCuradoria.providerPresentations).
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">
          Com quem você gostaria de seguir?
        </h2>
        <p className="text-sm text-ink-muted">
          Os profissionais foram apresentados sem ordem de preferência. A
          escolha é sua, e você pode revisar antes de iniciar o contato.
        </p>
      </CardHeader>
      <fieldset className="space-y-3">
        <legend className="sr-only">
          Escolha um dos profissionais apresentados na sua Curadoria
        </legend>
        {providerPresentations.map((presentation) => (
          <Radio
            key={presentation.providerId}
            id={`${groupName}-${presentation.providerId}`}
            name={groupName}
            label={presentation.displayName}
            checked={selectedId === presentation.providerId}
            onChange={() => setSelectedId(presentation.providerId)}
          />
        ))}
      </fieldset>
      {error ? (
        <FormMessage variant="error" className="mt-3">
          {error}
        </FormMessage>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={!selectedId}
          onClick={() => setStep("reviewing")}
        >
          Revisar e confirmar
        </Button>
        {connection ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsEditing(false);
              setSelectedId(connection.professionalProfileId);
              setError(null);
            }}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
