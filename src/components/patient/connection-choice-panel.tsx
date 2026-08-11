"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
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
  /**
   * B3-COPY · o modo é DITO pela rota, nunca inferido.
   *
   * Inferir por `providerPresentations.length === 1` erraria nas duas pontas:
   * uma entrega legada pode ter um profissional só, e o estado R3 (Curadoria
   * canônica, conexão existente, decisão ausente) também chega com um — e é
   * canônico.
   */
  modo: ModoDaConexao;
};

export type ModoDaConexao = "canonico" | "legado";

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
  modo,
}: ConnectionChoicePanelProps) {
  const canonico = modo === "canonico";
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
        modo={modo}
        onRequestEdit={
          // §5 · no canônico `onRequestEdit` NUNCA é passado: sem ele
          // `isEditing` jamais vira true, o passo de escolha não reaparece, e
          // `correctChoiceAction` fica inalcançável pelo canônico — sem
          // remover a action, que o legado usa.
          !canonico && isCorrectable
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
  if (canonico && !pessoaCanonica) return null;

  // §3.2 · CANÔNICO — revisão. As quatro verdades permanecem: são o único
  // lugar onde elas são ditas, e valem mais que o clique que economizariam.
  if (canonico && step === "reviewing" && pessoaCanonica) {
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
  if (canonico && pessoaCanonica) {
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

  if (step === "reviewing" && selectedPresentation) {
    const nome = selectedPresentation.displayName;
    return (
      // `ambiente-decisao`: a única coisa que esta classe faz é devolver a
      // atmosfera ao papel neutro (R20). Aqui azul e verde ficam em
      // equilíbrio de propósito — nada deve inclinar a decisão, nem a
      // orientação da Aliviar, nem o caminho já percorrido. O cômodo com
      // mais vazio é também o mais silencioso em cor.
      <PatientCard className="ambiente-decisao">
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          O que acontece ao seguir com {nome}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--patient-ink)]">
          Você escolheu seguir com {nome}.
        </p>

        <div className="mt-5 max-w-prose space-y-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          <p>
            Sua escolha fica registrada e passa a ser visível para quem cuida do seu caso na
            Aliviar. Não há consulta marcada, não há horário, e {nome} ainda não foi procurado.
          </p>
          <p>
            Seu caso continua sob responsabilidade da Aliviar — ele nunca fica sem alguém
            respondendo por ele.
          </p>
          <p>
            Enquanto você não tiver falado com {nome}, pode trocar aqui mesmo, sem precisar
            explicar nada.
          </p>
          <p>Os outros dois caminhos continuam na Mesa, do jeito que você os deixou.</p>
        </div>

        {error ? (
          <FormMessage variant="error" className="mt-4">
            {error}
          </FormMessage>
        ) : null}

        {/* O ato fica fora do caminho de leitura, com vazio à volta — nunca
            sob o dedo de quem está apenas percorrendo (SD-O2). */}
        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" isLoading={isPending} onClick={handleConfirm}>
            Seguir com {nome}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            disabled={isPending}
            onClick={() => setStep("choosing")}
          >
            Voltar aos caminhos
          </Button>
        </div>
      </PatientCard>
    );
  }

  // Etapa de seleção — os três profissionais com o mesmo peso visual,
  // nenhum destaque, nenhuma ordem de preferência implícita (a própria
  // ordem já vem neutra de FinalCuradoria.providerPresentations).
  return (
    <PatientCard>
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        Com quem você gostaria de seguir?
      </h2>
      <p className="patient-body mt-3 text-[var(--color-ink-muted)]">
        Os profissionais foram apresentados sem ordem de preferência. A escolha é sua, e você pode
        revisar antes de iniciar o contato.
      </p>
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
      {/* O limiar (§4.2): a manifestação é dirigida a alguém — nunca
          "continuar", que é genérico e transformaria a Mesa em funil.
          Atravessar não confirma; a porta não é compromisso. */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={!selectedId}
          onClick={() => setStep("reviewing")}
        >
          {selectedPresentation
            ? `Quero seguir com ${selectedPresentation.displayName}`
            : "Quero seguir com um dos três"}
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
    </PatientCard>
  );
}
