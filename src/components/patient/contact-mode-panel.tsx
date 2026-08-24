"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { defineContactModeAction } from "@/modules/connection/actions";
import type { ConnectionRecord, ContactMode } from "@/modules/connection/types";

/**
 * Como a paciente quer começar — Incremento 1 da Continuidade Pós-Decisão.
 *
 * Regras que este componente existe para cumprir, e que nenhuma delas é
 * detalhe de estilo:
 *
 *  - **Nenhum modo vem pré-selecionado.** Ausência de escolha é um estado
 *    legítimo, e um padrão marcado seria a plataforma escolhendo por ela.
 *  - **Nenhuma promessa de execução.** A aproximação intermediada ainda não
 *    existe operacionalmente; a escolha fica registrada como intenção, e o
 *    texto diz exatamente isso — sem prazo, sem "em breve", sem "entraremos
 *    em contato".
 *  - **Nada sobre o Concierge estar acompanhando**, porque isso ainda não é
 *    verificável.
 */

type ContactModePanelProps = {
  caseId: string;
  connection: ConnectionRecord;
};

const OPTIONS: ReadonlyArray<{
  value: ContactMode;
  label: string;
  detail: string;
  /** Marcador honesto de capacidade ainda não disponível. */
  pendingCapability?: string;
}> = [
  {
    value: "CONTATO_DIRETO_ACOMPANHADO",
    label: "Prefiro entrar em contato diretamente.",
    detail:
      "Você fala com a pessoa que escolheu, no seu tempo. A Aliviar continua com você — se algo não der certo, é só dizer.",
  },
  {
    value: "APROXIMACAO_INTERMEDIADA",
    // O limite entra no RÓTULO, não só no detalhe (23/08): a pessoa lê o
    // rótulo, marca, e só depois descobria que a casa ainda não faz isso.
    // A opção continua — registrar a intenção é o que vai dizer, um dia, se
    // vale existir —, mas ninguém mais escolhe achando que já acontece.
    label: "Prefiro que a Aliviar faça a aproximação (ainda não disponível).",
    detail:
      "Alguém da Aliviar procuraria a pessoa que você escolheu, em vez de você.",
    pendingCapability:
      "Ainda não conseguimos fazer essa aproximação por você. Sua escolha fica registrada, e quem cuida do seu caso vai falar com você sobre isso.",
  },
];

export function ContactModePanel({ caseId, connection }: ContactModePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // O modo só se define enquanto nenhum efeito foi produzido. Depois de
  // contato declarado ou de um terminal, é história — e história não se
  // reescreve numa tela.
  if (connection.status !== "DECISAO_REGISTRADA") return null;

  function choose(mode: ContactMode) {
    setError(null);
    startTransition(async () => {
      const result = await defineContactModeAction({ caseId, contactMode: mode });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  // CORTE DE 23/08 · deixou de ser um cartão próprio: vive como seção no pé
  // do cartão do acompanhamento (via `rodape` do ConnectionProgressPanel).
  // Um fio separa; as regras continuam as mesmas — nenhum modo pré-marcado,
  // nenhuma promessa de execução.
  return (
    <section
      aria-label="Como você quer começar"
      className="mt-8 border-t border-[var(--color-border)] pt-6"
    >
      <h3 className="font-serif text-lg font-medium text-[var(--patient-ink)]">
        Como você quer começar
      </h3>
      <p className="mt-2 text-sm text-ink">
        {connection.contactMode === null
          ? "Você ainda não disse como prefere começar. Não há pressa — e dá para mudar depois."
          : "Você pode mudar isso enquanto ainda não tiver falado com a pessoa que escolheu."}
      </p>

      {/* Estrofes separadas por fio, nunca caixas-dentro-de-caixa: ela está
          declarando como quer seguir, não escolhendo entre dois produtos. */}
      <div className="mt-4 flex flex-col">
        {OPTIONS.map((option) => {
          const selected = connection.contactMode === option.value;
          return (
            <div
              key={option.value}
              className="border-t border-[var(--color-border)] py-4 first:border-t-0 first:pt-1"
            >
              <p className="text-sm font-medium text-[var(--patient-ink)]">
                {option.label}
              </p>
              <p className="mt-1 text-sm text-ink">{option.detail}</p>
              {option.pendingCapability ? (
                <p className="mt-2 text-sm text-ink-muted">
                  {option.pendingCapability}
                </p>
              ) : null}
              <div className="mt-3">
                {selected ? (
                  <p className="text-sm text-ink-muted">
                    É assim que está registrado.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-auto"
                    disabled={isPending}
                    onClick={() => choose(option.value)}
                  >
                    {connection.contactMode === null
                      ? "Escolher"
                      : "Mudar para esta"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </section>
  );
}
