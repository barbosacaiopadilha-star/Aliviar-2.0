"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { transferCaseResponsibilityAction } from "@/modules/cases/responsibility-actions";
import type { AvailableCase } from "@/modules/curadoria/cos/repository";

/**
 * Curadorias disponíveis — o que está esperando alguém.
 *
 * @metodo Fundamentos §5 — nenhum paciente espera sem que alguém saiba
 * @metodo Ontologia §3.11 — o responsável muda; o Case é o mesmo do início ao fim
 * @metodo Experience §5 — UX3: o próximo passo é nomeado pelo que faz
 *
 * Por que existe: um Case sem curador atribuído era invisível para todos os
 * curadores, e ninguém além do administrador podia assumi-lo. O trabalho
 * ficava parado sem dono — e, pior, sem ninguém capaz de perceber que estava
 * parado. Achado do teste em produção.
 *
 * O que NUNCA faz: distribuir automaticamente, sugerir quem deve pegar o quê,
 * ou mostrar quantos casos cada Curador tem. Assumir é ato dele, com motivo
 * registrado — a mesma exigência de qualquer passagem de bastão.
 *
 * A escrita passa pelo único caminho que existe: `transfer_case_responsibility`
 * (SECURITY DEFINER), que tira o ator de `auth.uid()` e grava a auditoria na
 * mesma transação. O banco recusa se alguém tentar assumir para outra pessoa.
 */
export function AvailableCases({
  cases,
  curatorProfileId,
}: {
  cases: AvailableCase[];
  /** Vem do servidor. O banco confere que é o próprio ator, de qualquer forma. */
  curatorProfileId: string;
}) {
  if (cases.length === 0) {
    return (
      <Card className="max-w-reading space-y-2">
        <CardHeader>
          <CardTitle>Nenhuma Curadoria esperando</CardTitle>
          <CardDescription>
            Todo Case aberto já tem alguém responsável. Quando o Atendimento abrir um novo sem
            destinatário, ele aparece aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section aria-labelledby="disponiveis-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="disponiveis-heading" className="font-sans text-xl font-semibold text-ink">
          Curadorias esperando um Curador
        </h2>
        <p className="text-xs uppercase tracking-wide text-ink-muted">Quem espera há mais tempo</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cases.map((entry) => (
          <AvailableCaseCard key={entry.caseId} entry={entry} curatorProfileId={curatorProfileId} />
        ))}
      </div>
    </section>
  );
}

function esperaEmPalavras(dias: number): string {
  if (dias === 0) return "Aberto hoje";
  if (dias === 1) return "Esperando há 1 dia";
  return `Esperando há ${dias} dias`;
}

function AvailableCaseCard({
  entry,
  curatorProfileId,
}: {
  entry: AvailableCase;
  curatorProfileId: string;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function assumir() {
    setErro(null);
    startTransition(async () => {
      const result = await transferCaseResponsibilityAction({
        caseId: entry.caseId,
        newResponsibleId: curatorProfileId,
        newRole: "curador_medico",
        reason: motivo.trim(),
      });

      if (result.success) {
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível assumir esta Curadoria.");
      }
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-sans text-lg font-semibold text-ink">{entry.patientName}</h3>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-muted">
          {esperaEmPalavras(entry.waitingDays)}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        Ainda não tem Curador. Ao assumir, esta Curadoria passa a ser sua e some desta fila.
      </p>

      <div className="border-t border-border pt-4">
        {confirmando ? (
          <div className="space-y-3">
            <label
              htmlFor={`motivo-${entry.caseId}`}
              className="block text-sm font-medium text-ink"
            >
              Por que você está assumindo?
            </label>
            <p className="text-xs leading-relaxed text-ink-muted">
              Fica no histórico do Case, para quem ler a auditoria amanhã entender a decisão.
            </p>
            <Textarea
              id={`motivo-${entry.caseId}`}
              rows={2}
              maxLength={500}
              value={motivo}
              disabled={pending}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Ex.: tenho disponibilidade esta semana e o caso está esperando há dias"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={assumir}
                disabled={pending || motivo.trim().length === 0}
                isLoading={pending}
              >
                {pending ? "Assumindo…" : `Assumir a Curadoria de ${entry.patientName}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmando(false);
                  setErro(null);
                }}
                disabled={pending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" onClick={() => setConfirmando(true)}>
            Assumir esta Curadoria
          </Button>
        )}

        {erro ? (
          <p role="alert" className="mt-3 text-sm text-error">
            {erro}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
