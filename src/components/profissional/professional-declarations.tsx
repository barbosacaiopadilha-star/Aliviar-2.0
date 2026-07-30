"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { declareProfessionalAnswerAction } from "@/modules/briefing/actions";
import { captureStateLabel } from "@/modules/briefing/capture-state";
import type { ContentIssue } from "@/modules/briefing/content-guard";
import {
  PROFESSIONAL_OPTIONS,
  PROFESSIONAL_OPTION_LABELS,
  PROFESSIONAL_QUESTIONS,
  PROFESSIONAL_QUESTION_TEXT,
  type ProfessionalAlignmentAnswer,
  type ProfessionalQuestionId,
} from "@/modules/briefing/types";

/**
 * DECLARAÇÕES DO PROFISSIONAL — ele fala de si, para si.
 *
 * @metodo Fundamentos §5 — o profissional é parceiro do Método, não catálogo
 * @metodo Ontologia §8 — nenhuma declaração vira nota, selo ou posição
 * @metodo Experience §5 — a tela informa, nunca cobra
 *
 * Governado por docs/ALIGNMENT_PROFILE.md §2 e ACE_PRINCIPLES.md (P8 — direito
 * à revisão; P2 — nada aqui é medida) e ACE_BOUNDARIES.md §1.5 e §1.7.
 *
 * Por que existe: o Briefing só reconhece um encontro se as duas pontas
 * existirem. Sem um lugar onde o médico declare como conduz, o Curador só
 * teria a ponta do paciente — e uma ponta só não é encontro.
 *
 * O que NUNCA faz: comparar com outro profissional, exibir quantas perguntas
 * faltam, mostrar percentual, ou dizer que responder melhora sua posição.
 * Nenhuma resposta afeta se ele aparece em uma Curadoria.
 */

type Props = { answers: ProfessionalAlignmentAnswer[] };

export function ProfessionalDeclarations({ answers }: Props) {
  const registradas = new Map(answers.map((a) => [a.questionId, a]));
  const ultima = answers
    .map((a) => a.declaredAt)
    .sort()
    .at(-1);

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Como você costuma conduzir seus pacientes?</CardTitle>
          <Badge variant="sage">
            {captureStateLabel(registradas.size, PROFESSIONAL_QUESTIONS.length, ultima)}
          </Badge>
        </div>
        <CardDescription>
          Suas respostas ajudam a equipe de Curadoria a preparar a conversa com quem chega até você.
          Nada aqui vira nota ou classificação, nada é comparado com outro profissional, e você pode
          mudar o que quiser quando quiser.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {PROFESSIONAL_QUESTIONS.map((questionId) => (
          <DeclarationRow
            key={questionId}
            questionId={questionId}
            answer={registradas.get(questionId) ?? null}
          />
        ))}
      </div>
    </Card>
  );
}

function DeclarationRow({
  questionId,
  answer,
}: {
  questionId: ProfessionalQuestionId;
  answer: ProfessionalAlignmentAnswer | null;
}) {
  const opcoes = (PROFESSIONAL_OPTIONS as Record<string, readonly string[]>)[questionId];
  const [option, setOption] = useState(answer?.option ?? "");
  const [texto, setTexto] = useState(answer?.declaredText ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [pending, startTransition] = useTransition();

  const alterado = option !== (answer?.option ?? "") || texto !== (answer?.declaredText ?? "");
  const podeSalvar = Boolean(option) || texto.trim().length > 0;

  function salvar() {
    setErro(null);
    setIssues([]);
    startTransition(async () => {
      const result = await declareProfessionalAnswerAction({
        questionId,
        option: option || undefined,
        declaredText: texto.trim() || undefined,
      });
      if (result.success) return;
      setErro(result.error);
      // O texto NÃO é limpo nem reescrito: ele continua exatamente como foi
      // digitado enquanto a pessoa decide o que fazer (P1).
      setIssues(result.issues ?? []);
    });
  }

  return (
    <fieldset className="rounded-md border border-border bg-surface p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        {PROFESSIONAL_QUESTION_TEXT[questionId]}
      </legend>

      {opcoes ? (
        <div className="mt-2 space-y-0.5">
          {opcoes.map((valor) => (
            <Radio
              key={valor}
              id={`${questionId}-${valor}`}
              name={questionId}
              value={valor}
              checked={option === valor}
              onChange={() => setOption(valor)}
              label={PROFESSIONAL_OPTION_LABELS[valor] ?? valor}
              disabled={pending}
            />
          ))}
        </div>
      ) : null}

      <label htmlFor={`${questionId}-texto`} className="mt-3 block text-xs text-ink-muted">
        {opcoes ? "Quer acrescentar algo com suas palavras? (opcional)" : "Escreva com suas palavras."}
      </label>
      <Textarea
        id={`${questionId}-texto`}
        rows={3}
        maxLength={2000}
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        disabled={pending}
        className="mt-1"
      />

      {/* Guard de conteúdo: mostra o que encontrou e devolve a decisão.
          Nunca corrige sozinho, nunca bloqueia a tela inteira. */}
      {issues.length > 0 ? (
        <div role="alert" className="mt-3 rounded-md border border-warning bg-warning-surface p-3">
          <p className="text-sm text-ink">{erro}</p>
          <ul className="mt-2 space-y-2">
            {issues.map((issue) => (
              <li key={issue.code} className="text-sm leading-relaxed text-ink">
                <span className="italic">&ldquo;{issue.excerpt}&rdquo;</span> — {issue.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            Seu texto continua aqui do jeito que você escreveu. Ajuste o que quiser e salve de novo.
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={salvar} disabled={pending || !podeSalvar || !alterado}>
          {answer ? "Atualizar" : "Salvar"}
        </Button>

        {answer && !alterado ? (
          <span className="text-sm text-ink-muted">
            Registrado em {new Date(answer.declaredAt).toLocaleDateString("pt-BR")}.
          </span>
        ) : null}

        {erro && issues.length === 0 ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </fieldset>
  );
}
