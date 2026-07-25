"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { recordPatientAnswerAction, removePatientAnswerAction } from "@/modules/briefing/actions";
import { captureStateLabel } from "@/modules/briefing/capture-state";
import {
  PATIENT_OPTIONS,
  PATIENT_OPTION_LABELS,
  PATIENT_QUESTIONS,
  PATIENT_QUESTION_TEXT,
  type PatientAlignmentAnswer,
  type PatientQuestionId,
} from "@/modules/briefing/types";

/**
 * CAPTURA DO PERFIL DE ALINHAMENTO — durante a Consulta Inicial.
 *
 * @metodo Método §2 — a Consulta Inicial é conversa, não formulário
 * @metodo Experience §5 — UX3: o próximo passo é visível, único e opcional
 * @metodo Ontologia §8 — nada aqui pontua, ordena ou classifica pessoa
 *
 * Governado por docs/ALIGNMENT_PROFILE.md §1 (as 5 perguntas aprovadas) e
 * ACE_PRINCIPLES.md (P2 — não é medida; P4 — a fala tem precedência sobre o
 * rótulo; P8 — direito de voltar atrás; P16 — o Briefing nunca é requisito).
 *
 * Por que existe: as respostas do paciente só entram no sistema se alguém
 * puder registrá-las. Quem registra é o Curador, durante a conversa — não é
 * um formulário que a pessoa preenche sozinha, porque estas perguntas pedem
 * confiança já estabelecida.
 *
 * O que NUNCA faz: obrigar resposta, contar quantas faltam, mostrar barra de
 * progresso, percentual ou fração. Cada pergunta salva sozinha, porque a
 * conversa não segue a ordem da tela.
 */

type Props = {
  caseId: string;
  patientFirstName: string;
  answers: PatientAlignmentAnswer[];
};

export function AlignmentCapture({ caseId, patientFirstName, answers }: Props) {
  const registradas = new Map(answers.map((a) => [a.questionId, a]));
  const ultimaAtualizacao = answers
    .map((a) => a.answeredAt)
    .sort()
    .at(-1);

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Como conduzir esta Curadoria</CardTitle>
          <Badge variant="sage">
            {captureStateLabel(registradas.size, PATIENT_QUESTIONS.length, ultimaAtualizacao)}
          </Badge>
        </div>
        <CardDescription>
          O que {patientFirstName} contou sobre como prefere decidir. Registre durante a conversa, na
          ordem que ela acontecer. Nenhuma pergunta é obrigatória — e a Curadoria segue igual sem
          nenhuma delas.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {PATIENT_QUESTIONS.map((questionId) => (
          <QuestionRow
            key={questionId}
            caseId={caseId}
            questionId={questionId}
            answer={registradas.get(questionId) ?? null}
          />
        ))}
      </div>
    </Card>
  );
}

function QuestionRow({
  caseId,
  questionId,
  answer,
}: {
  caseId: string;
  questionId: PatientQuestionId;
  answer: PatientAlignmentAnswer | null;
}) {
  const [option, setOption] = useState(answer?.option ?? "");
  const [verbatim, setVerbatim] = useState(answer?.verbatim ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  const opcoes = PATIENT_OPTIONS[questionId] as readonly string[];
  const alterado = option !== (answer?.option ?? "") || verbatim !== (answer?.verbatim ?? "");

  function salvar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const result = await recordPatientAnswerAction({
        caseId,
        questionId,
        option,
        verbatim: verbatim.trim() || undefined,
      });
      if (result.success) setSalvo(true);
      else setErro(result.error);
    });
  }

  function retirar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const result = await removePatientAnswerAction({ caseId, questionId });
      if (result.success) {
        setOption("");
        setVerbatim("");
      } else {
        setErro(result.error);
      }
    });
  }

  return (
    <fieldset className="rounded-md border border-border bg-surface p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        {PATIENT_QUESTION_TEXT[questionId]}
      </legend>

      <div className="mt-2 space-y-0.5">
        {opcoes.map((valor) => (
          <Radio
            key={valor}
            id={`${questionId}-${valor}`}
            name={`${questionId}-${caseId}`}
            value={valor}
            checked={option === valor}
            onChange={() => setOption(valor)}
            label={PATIENT_OPTION_LABELS[valor] ?? valor}
            disabled={pending}
          />
        ))}
      </div>

      {/* A fala preservada tem precedência sobre o rótulo da opção (P4).
          É opcional porque nem toda resposta vem com frase. */}
      <label htmlFor={`${questionId}-verbatim`} className="mt-3 block text-xs text-ink-muted">
        Se ela disse algo com as próprias palavras, guarde a frase — ela vale mais que a opção.
      </label>
      <Textarea
        id={`${questionId}-verbatim`}
        rows={2}
        maxLength={2000}
        value={verbatim}
        onChange={(event) => setVerbatim(event.target.value)}
        disabled={pending}
        className="mt-1"
        placeholder="Palavras dela, sem resumir"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={salvar} disabled={pending || !option || !alterado}>
          {answer ? "Atualizar" : "Registrar"}
        </Button>

        {answer ? (
          <Button type="button" variant="ghost" onClick={retirar} disabled={pending}>
            Retirar resposta
          </Button>
        ) : null}

        {salvo && !alterado ? (
          <span className="text-sm text-ink-muted">Registrado.</span>
        ) : null}
        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </fieldset>
  );
}
