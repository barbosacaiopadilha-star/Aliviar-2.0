"use client";

import { useState, useTransition } from "react";

import {
  ACKNOWLEDGE_ACTION_LABEL,
  ACKNOWLEDGE_CONFIRMATION,
  DECISION_MESSAGES,
  decideAcknowledgement,
} from "@/modules/curadoria/reconhecimento-do-perfil";
import { reconhecerPerfilAction } from "@/modules/paciente/reconhecimento-actions";

/**
 * O ato dela, na tela dela — ADR-042.
 *
 * Antes este botão não existia: quem registrava o "reconhecimento da paciente"
 * era o Curador, dentro do Priority Builder, e só depois que os 100 pontos
 * fechassem. O ato era descrito como dela e executado por outra pessoa.
 *
 * A confirmação diz O QUE VAI ACONTECER em vez de "tem certeza?"
 * (EXPERIENCE_BIBLE): ela está congelando o Perfil, e isso é a Invariante 28 —
 * corrigir exige construir um novo junto com a Curadoria.
 */
export function ReconhecerPerfil({
  caseId,
  pendentes,
  validated,
}: {
  caseId: string;
  pendentes: number;
  validated: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const decisao = decideAcknowledgement(validated ? "VALIDATED" : "DRAFT", pendentes);

  if (decisao === "JA_RECONHECIDO") return null;

  // Mapa incompleto não é falha dela — é o trabalho ainda acontecendo. A tela
  // conta o estado em vez de mostrar um botão desabilitado sem explicação.
  if (decisao !== "PODE_RECONHECER") {
    return (
      <p className="mt-5 max-w-reading text-sm leading-relaxed text-ink-muted">
        {DECISION_MESSAGES[decisao]}
      </p>
    );
  }

  const confirmar = () => {
    setErro(null);
    iniciar(async () => {
      const resultado = await reconhecerPerfilAction({ caseId });
      if (!resultado.success) {
        setErro(resultado.error);
        setConfirmando(false);
      }
    });
  };

  return (
    <div className="mt-5 space-y-3">
      <p className="max-w-reading text-sm leading-relaxed text-ink">
        Este retrato representa corretamente o que é importante para você? Se algo não estiver com a
        sua cara, fale com seu Curador antes de confirmar — dá tempo, e revisar é normal.
      </p>

      {confirmando ? (
        <div className="space-y-3">
          <p className="max-w-reading text-sm leading-relaxed text-ink">{ACKNOWLEDGE_CONFIRMATION}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmar}
              disabled={pendente}
              className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pendente ? "Registrando…" : "Sim, confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={pendente}
              className="inline-flex min-h-11 items-center rounded-md border border-ink-muted/30 px-4 py-2.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Ainda não
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {ACKNOWLEDGE_ACTION_LABEL}
        </button>
      )}

      {erro ? (
        <p role="alert" className="max-w-reading text-sm leading-relaxed text-ink">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
