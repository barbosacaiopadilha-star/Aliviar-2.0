"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { FormMessage } from "@/components/ui/form-message";
import type { ProviderPresentation } from "@/modules/curadoria/opcao-apresentada";
import {
  createConnectionAction,
} from "@/modules/connection/actions";
import type { ConnectionRecord } from "@/modules/connection/types";

import { ConnectionProgressPanel } from "./connection-progress-panel";

import type { ReactNode } from "react";

type ConnectionChoicePanelProps = {
  caseId: string;
  providerPresentations: ProviderPresentation[];
  connection: ConnectionRecord | null;
  /**
   * CORTE DE 23/08 · o modo de contato entra no MESMO cartão do
   * acompanhamento (era um segundo cartão logo abaixo — cerimônia).
   * Repassado ao ConnectionProgressPanel, que o mostra só no estado em que
   * ele faz sentido.
   */
  rodape?: ReactNode;
};

// Permite ao paciente escolher um dos três profissionais apresentados na
// própria Curadoria e revisar antes de confirmar. Nunca escreve no banco antes
// da confirmação explícita; a persistência passa exclusivamente por
// createConnectionAction (PR3) — esta interface nunca decide, apenas coleta a
// decisão já tomada pelo paciente.
//
// O PROP `modo` SAIU. Ele distinguia a Curadoria do Método da entrega do motor
// ACE, e o motor foi removido: tudo que chega aqui é canônico. O que era o
// ramo "legado" — reabrir a escolha e chamar `correctChoiceAction` — nunca foi
// alcançável pelo canônico, por decisão explícita (§5, que dizia
// "`onRequestEdit` NUNCA é passado"). Removê-lo não fecha nenhuma porta que
// estivesse aberta.
//
// O comando de domínio `correctChoice` permanece intacto em
// `modules/connection` com seus testes: se a paciente vier a poder corrigir a
// escolha no caminho canônico, isso é decisão de Método — não se decide
// apagando código.
export function ConnectionChoicePanel({
  caseId,
  providerPresentations,
  connection,
  rodape,
}: ConnectionChoicePanelProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!connection);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Connection existe e não estamos em modo de edição: delega a exibição
  // (e as ações de desfecho, PR5) para ConnectionProgressPanel.
  if (connection && !isEditing) {
    return (
      <ConnectionProgressPanel
        caseId={caseId}
        connection={connection}
        providerPresentations={providerPresentations}
        rodape={rodape}
      />
    );
  }

  function handleConfirm(professionalProfileId: string) {
    setError(null);

    startTransition(async () => {
      const result = await createConnectionAction({
        caseId,
        professionalProfileId,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // router.refresh() só reexecuta o Server Component (busca o
      // Connection já persistido) — nunca reseta o estado local deste
      // Client Component sozinho. Sem este reset explícito, `isEditing`
      // continuaria em edição depois do refresh, arriscando uma segunda
      // submissão sobre o mesmo valor.
      setIsEditing(false);
      router.refresh();
    });
  }

  // A Sala da Decisão — nada foi persistido ainda.
  //
  // §1 · guarda: canônico sem pessoa não renderiza nada. Nunca um card com
  // nome indefinido.
  const pessoaCanonica = providerPresentations[0] ?? null;
  if (!pessoaCanonica) return null;

  // CORTE DE 23/08 (decisão do Fundador, "aplique todos os cortes"): eram
  // DOIS cartões em sequência — "Começar seu acompanhamento" com um botão, e
  // depois "O que acontece ao abrir" com as verdades e OUTRO botão de mesmo
  // nome. Duas confirmações para um gesto que a doutrina define como único
  // (SD-O2/SD-P3). Agora é um cartão: as verdades vêm ANTES do gesto, como
  // SD-O1 pede — ditas uma vez, como informação e nunca como advertência —,
  // e o gesto é um só. Cada verdade continua afirmando apenas o que tem
  // autoridade verificável (§17.4): a Aliviar ainda não procura o
  // profissional, e dizer que procuraria seria prometer capacidade
  // inexistente.
  const nome = pessoaCanonica.displayName;
  return (
    <PatientCard className="ambiente-decisao">
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        Começar seu acompanhamento
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--patient-ink)]">
        Caminho escolhido: {nome}
      </p>

      <div className="mt-5 max-w-prose space-y-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        <p>
          Ao abrir, seu acompanhamento com {nome} passa a ser visível para quem cuida do seu caso
          na Aliviar. Não há consulta marcada, não há horário, e {nome} ainda não foi procurado.
        </p>
        <p>
          Seu caso continua sob responsabilidade da Aliviar, sua decisão continua registrada do
          jeito que está, e os outros dois caminhos continuam na Mesa. Não há pressa.
        </p>
      </div>

      {error ? (
        <FormMessage variant="error" className="mt-4">
          {error}
        </FormMessage>
      ) : null}

      <div className="mt-8">
        <Button
          type="button"
          isLoading={isPending}
          onClick={() => handleConfirm(pessoaCanonica.providerId)}
        >
          Abrir meu acompanhamento
        </Button>
      </div>
    </PatientCard>
  );
}
