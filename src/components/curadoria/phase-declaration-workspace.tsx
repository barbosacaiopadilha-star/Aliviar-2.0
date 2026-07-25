"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { registerCasoAction, registerHistoriaAction } from "@/modules/curadoria/actions";

/**
 * Tela de trabalho das Fases 2 (História) e 3 (Caso) — texto declarado pelo
 * Curador + confirmação-ato, num único componente para as duas fases.
 *
 * @metodo Engine §4 — o Motor reconhece e explica; quem declara é o Curador
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * Por que existe: ONE ALIVIAR, Problema 1 — as fases 2 e 3 explicavam e
 * terminavam sem CTA; o Curador lia "falta registrar a narrativa" e não
 * tinha onde. Mesmo remédio do Acolhimento, generalizado: registro é ato do
 * Curador, confirmação nunca regride, e a fase concluída troca o botão pelo
 * Prosseguir.
 */
export function PhaseDeclarationWorkspace({
  phase,
  caseId,
  initialText,
  understandingConfirmedAt,
  nextPhaseHref,
  nextPhaseLabel,
}: {
  phase: "historia" | "caso";
  caseId: string;
  initialText: string | null;
  /** Só na História: quando o paciente reconheceu a própria história. */
  understandingConfirmedAt?: string | null;
  nextPhaseHref: string;
  nextPhaseLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState(initialText ?? "");
  const [confirmar, setConfirmar] = useState(false);

  const isHistoria = phase === "historia";
  const textoRegistrado = Boolean(initialText?.trim());
  const confirmado = Boolean(understandingConfirmedAt);
  const concluida = isHistoria ? textoRegistrado && confirmado : textoRegistrado;

  const copy = isHistoria
    ? {
        titulo: "Registrar a História",
        descricao:
          "Escreva a história organizada a partir do que a pessoa contou — com as palavras dela, nunca com jargão.",
        rotuloTexto: "História organizada",
        botao: "Registrar a história",
        confirmacao: "Fiz a devolução e o paciente reconheceu a própria história",
      }
    : {
        titulo: "Registrar o Caso",
        descricao:
          "Descreva o contexto clínico como fato relatado. A Aliviar nunca diagnostica nem interpreta exame.",
        rotuloTexto: "Contexto clínico relatado",
        botao: "Registrar o contexto clínico",
        confirmacao: null,
      };

  function salvar() {
    if (pending) return;
    setErro(null);
    startTransition(async () => {
      const result = isHistoria
        ? await registerHistoriaAction({
            caseId,
            narrative: texto.trim() || undefined,
            confirmUnderstanding: confirmar || undefined,
          })
        : await registerCasoAction({ caseId, clinicalContext: texto.trim() });
      if (result.success) {
        setConfirmar(false);
        router.refresh();
      } else {
        setErro(result.error);
      }
    });
  }

  const algoPraSalvar = isHistoria
    ? texto.trim() !== (initialText ?? "").trim() || (confirmar && !confirmado)
    : texto.trim() !== (initialText ?? "").trim() && texto.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.titulo}</CardTitle>
        <CardDescription>{copy.descricao}</CardDescription>
      </CardHeader>

      {erro ? (
        <p role="alert" className="mb-3 rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-ink-muted">{copy.rotuloTexto}</span>
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          rows={8}
          disabled={pending}
          className="block w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </label>

      {isHistoria && copy.confirmacao ? (
        <div className="mt-4">
          {confirmado ? (
            <p className="text-sm text-ink-muted">
              ✓ O paciente reconheceu a própria história — registrado e permanente.
            </p>
          ) : (
            <Checkbox
              label={copy.confirmacao}
              checked={confirmar}
              disabled={pending}
              onChange={(event) => setConfirmar(event.target.checked)}
            />
          )}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {!concluida || algoPraSalvar ? (
          <Button type="button" onClick={salvar} disabled={pending || !algoPraSalvar} isLoading={pending}>
            {pending ? "Registrando…" : copy.botao}
          </Button>
        ) : null}

        {concluida ? (
          <Link
            href={nextPhaseHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {nextPhaseLabel}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="text-xs text-ink-muted">
            {isHistoria
              ? "A próxima fase abre com a história registrada e o reconhecimento confirmado."
              : "A próxima fase abre com o contexto clínico registrado."}
          </p>
        )}
      </div>
    </Card>
  );
}
