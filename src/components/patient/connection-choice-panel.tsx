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

type ConnectionChoicePanelProps = {
  caseId: string;
  providerPresentations: ProviderPresentation[];
  connection: ConnectionRecord | null;
};

type Step = "choosing" | "reviewing";

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
}: ConnectionChoicePanelProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!connection);
  const [step, setStep] = useState<Step>("choosing");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      />
    );
  }

  function handleConfirm() {
    if (!selectedId) return;
    setError(null);

    startTransition(async () => {
      const result = await createConnectionAction({
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
      // minha escolha" reapareceria já confirmado — arriscando uma segunda
      // submissão sobre o mesmo valor. `connection` já vem correto da nova
      // prop; só o estado local desta etapa de edição precisa voltar ao
      // repouso.
      setIsEditing(false);
      setStep("choosing");
      router.refresh();
    });
  }

  // A Sala da Decisão — nada foi persistido ainda.
  //
  // As quatro verdades da A_SALA_DA_DECISAO §5.1 vêm ANTES do gesto (SD-O1),
  // ditas uma vez, como informação e nunca como advertência. Cada uma só
  // afirma o que tem autoridade verificável (§17.4): o alcance real do ato
  // hoje é registrar a escolha e torná-la legível a quem cuida do caso
  // (Contrato Operacional 9B) — a Aliviar ainda não procura o profissional,
  // e dizer que procuraria seria prometer capacidade inexistente.
  //
  // O gesto é único, inequívoco e nomeado (SD-O2/SD-P3): a etapa anterior
  // declarou SOBRE QUEM se decide; esta declara QUE se decidiu. Não é
  // segunda confirmação — é o ato, precedido de vazio.
  // §1 · guarda: canônico sem pessoa não renderiza nada. Nunca um card com
  // nome indefinido.
  const pessoaCanonica = providerPresentations[0] ?? null;
  if (!pessoaCanonica) return null;

  // §3.2 · CANÔNICO — revisão. As quatro verdades permanecem: são o único
  // lugar onde elas são ditas, e valem mais que o clique que economizariam.
  if (step === "reviewing") {
    const nome = pessoaCanonica.displayName;
    return (
      <PatientCard className="ambiente-decisao">
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          O que acontece ao abrir seu acompanhamento
        </h2>

        <div className="mt-5 max-w-prose space-y-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          <p>
            Seu acompanhamento com {nome} passa a ser visível para quem cuida do seu caso na
            Aliviar.
          </p>
          <p>
            Não há consulta marcada, não há horário, e {nome} ainda não foi procurado.
          </p>
          <p>
            Seu caso continua sob responsabilidade da Aliviar — ele nunca fica sem alguém
            respondendo por ele.
          </p>
          {/* A quinta verdade substitui a linha legada "pode trocar aqui
              mesmo", que no canônico seria FALSA: o fato é append-only. */}
          <p>
            Sua decisão continua registrada do jeito que está: abrir o acompanhamento não altera o
            que você já decidiu.
          </p>
          <p>Os outros dois caminhos continuam na Mesa, do jeito que você os deixou.</p>
        </div>

        {error ? (
          <FormMessage variant="error" className="mt-4">
            {error}
          </FormMessage>
        ) : null}

        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" isLoading={isPending} onClick={handleConfirm}>
            Abrir meu acompanhamento
          </Button>
          {/* "Voltar", não "Voltar aos caminhos": não há caminhos para onde
              voltar — a escolha já foi feita no fato canônico. */}
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            disabled={isPending}
            onClick={() => setStep("choosing")}
          >
            Voltar
          </Button>
        </div>
      </PatientCard>
    );
  }

  // §3.1 · CANÔNICO — abertura. A pessoa decidida é INFORMAÇÃO FIXA: texto
  // rotulado, não controle. Nada para marcar, nada para desmarcar, e a
  // identidade nunca some.
  if (pessoaCanonica) {
    return (
      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          Começar seu acompanhamento
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--patient-ink)]">
          Caminho escolhido: {pessoaCanonica.displayName}
        </p>
        <p className="patient-body mt-3 text-[var(--color-ink-muted)]">
          Sua decisão já está registrada. Abrir o acompanhamento é o passo seguinte — e não há
          pressa.
        </p>

        {error ? (
          <FormMessage variant="error" className="mt-4">
            {error}
          </FormMessage>
        ) : null}

        <div className="mt-8">
          <Button
            type="button"
            isLoading={isPending}
            onClick={() => {
              setSelectedId(pessoaCanonica.providerId);
              setStep("reviewing");
            }}
          >
            Abrir meu acompanhamento
          </Button>
        </div>
      </PatientCard>
    );
  }

  // O ramo abaixo — lista de rádios com os três caminhos, revisão e
  // cancelamento — era a escolha do formato LEGADO, e foi removido junto com
  // o motor que o alimentava. No canônico a pessoa já está decidida quando
  // chega aqui: a escolha aconteceu no `CuradoriaDecisionPanel`, e este
  // painel só abre o acompanhamento. As guardas acima garantem que nenhum
  // caminho chega ao fim desta função.
  return null;
}
