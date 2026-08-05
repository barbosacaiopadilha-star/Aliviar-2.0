"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import {
  NEED_DEGREES,
  NEED_DEGREE_LABELS,
  PERSON_PROTOCOL,
  type NeedDegree,
  type PersonQuestion,
} from "@/modules/curadoria/protocolos";
import type { CaseNeedRecord } from "@/modules/curadoria/protocolos-repository";
import {
  registerPersonNeedAction,
} from "@/modules/curadoria/protocolos-actions";

/**
 * PROTOCOLO DA PESSOA — a conversa, instrumentada.
 *
 * @metodo Fundamentos §13 — quem reconhece a própria necessidade é a pessoa
 * @metodo Ontologia §3.13 — leitura proposta não é decisão: o ato é dela
 * @metodo Experience §5 — conversa instrumentada, nunca formulário frio
 *
 * Governado por docs/curadoria/protocolos/PROTOCOLO_PESSOA.md (P1..P16) e
 * pela GRAMATICA_DAS_PERGUNTAS.md §4 — grau declarado, nunca inferido.
 *
 * Por que existe: o Curador precisa registrar, DURANTE a conversa, o que a
 * pessoa disse na forma em que disse — pergunta direta como está; tradução
 * como proposta que ela reconhece, corrige ou recusa, com o ato dela
 * separado da leitura dele. Sem este painel, a necessidade viraria anotação
 * livre, incomparável e sem reconhecimento.
 *
 * O que este painel NUNCA faz: gerar necessidade de texto livre, inferir
 * grau, ou concluir compatibilidade. Registro, não julgamento.
 */

type Props = { caseId: string; needs: CaseNeedRecord[] };

const ACK_LABELS: Record<CaseNeedRecord["acknowledgment"], string> = {
  PENDENTE: "Aguardando o reconhecimento dela",
  RECONHECIDA: "Reconhecida por ela",
  CORRIGIDA: "Corrigida por ela",
  RECUSADA: "Recusada por ela",
};

export function ProtocoloPessoaPanel({ caseId, needs }: Props) {
  const byCode = new Map(needs.map((need) => [need.subcriterionCode, need]));
  const [openCode, setOpenCode] = useState<string | null>(null);

  const respondidas = PERSON_PROTOCOL.filter(
    (p) => p.mode !== "DECLARACAO_CLINICA" && byCode.has(p.subcriterionCode),
  ).length;
  const totalPerguntas = PERSON_PROTOCOL.filter((p) => p.mode !== "DECLARACAO_CLINICA").length;

  return (
    <div className="space-y-3">
      <Badge variant="sage">{`${respondidas} de ${totalPerguntas} conversas registradas`}</Badge>

      <ul className="space-y-2">
        {PERSON_PROTOCOL.map((question) => {
          const need = byCode.get(question.subcriterionCode) ?? null;
          return (
            <li key={question.id} className="rounded border p-2 text-sm">
              <NeedRow
                caseId={caseId}
                question={question}
                need={need}
                open={openCode === question.subcriterionCode}
                onToggle={() =>
                  setOpenCode(openCode === question.subcriterionCode ? null : question.subcriterionCode)
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NeedRow({
  caseId,
  question,
  need,
  open,
  onToggle,
}: {
  caseId: string;
  question: PersonQuestion;
  need: CaseNeedRecord | null;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{question.id} · {question.question}</span>
        {need ? (
          <Badge variant={need.acknowledgment === "PENDENTE" ? "default" : "sage"}>
            {ACK_LABELS[need.acknowledgment]}
          </Badge>
        ) : question.mode === "DECLARACAO_CLINICA" ? (
          <Badge variant="default">Declaração clínica do Curador</Badge>
        ) : (
          <Badge variant="default">Sem registro</Badge>
        )}
      </div>

      {need ? (
        <p className="text-ink-muted">
          {need.options.map((option) => question.options[option] ?? option).join(" · ") ||
            need.guidedText ||
            "(declaração clínica)"}
          {" — "}
          {NEED_DEGREE_LABELS[need.degree].split(" — ")[0]}
          {need.flexibility ? ` · flexibilidade: ${need.flexibility}` : ""}
          {need.origin === "TRADUCAO" && need.proposedReading ? (
            <span className="block italic">Leitura proposta: {need.proposedReading}</span>
          ) : null}
          {need.correction ? <span className="block">Correção dela: {need.correction}</span> : null}
        </p>
      ) : null}

      {question.mode !== "DECLARACAO_CLINICA" ? (
        <Button type="button" variant="ghost" size="sm" onClick={onToggle}>
          {open ? "Fechar" : need ? "Atualizar registro" : "Registrar conversa"}
        </Button>
      ) : null}

      {open ? <NeedForm caseId={caseId} question={question} existing={need} onDone={onToggle} /> : null}

      {/* PP-03C — AQUI HAVIA OS TRÊS BOTÕES DE DESFECHO.
          "Reconheceu", "Corrigiu" e "Recusou" gravavam, pela mão do Curador, o
          ato que o Método reserva à paciente: o registro dizia "reconhecida" e
          ninguém podia provar que foi ela. O desfecho passou a ser praticado
          por ela, na tela dela, por `acknowledge_case_need`.
          O Curador continua registrando a TRADUÇÃO — e passa a apenas ler o
          que ela respondeu, que é a relação correta entre os dois. */}
      {need?.origin === "TRADUCAO" && need.acknowledgment === "PENDENTE" ? (
        <p className="rounded border border-dashed p-2 text-xs text-[var(--color-ink-muted)]">
          Esta leitura aguarda a resposta dela. O desfecho é ato da paciente, na Jornada dela — não
          se registra por aqui.
        </p>
      ) : null}
    </div>
  );
}

function NeedForm({
  caseId,
  question,
  existing,
  onDone,
}: {
  caseId: string;
  question: PersonQuestion;
  existing: CaseNeedRecord | null;
  onDone: () => void;
}) {
  const [options, setOptions] = useState<string[]>(existing?.options ?? []);
  const [degree, setDegree] = useState<NeedDegree>(existing?.degree ?? "PESA_MUITO");
  const [flexibility, setFlexibility] = useState(existing?.flexibility ?? "");
  const [guidedText, setGuidedText] = useState(existing?.guidedText ?? "");
  const [proposedReading, setProposedReading] = useState(existing?.proposedReading ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(code: string) {
    setOptions((current) =>
      question.multi
        ? current.includes(code)
          ? current.filter((o) => o !== code)
          : [...current, code]
        : [code],
    );
  }

  function submit() {
    startTransition(async () => {
      const result = await registerPersonNeedAction({
        caseId,
        subcriterionCode: question.subcriterionCode,
        options,
        degree,
        flexibility: flexibility.trim() === "" ? null : flexibility,
        guidedText: guidedText.trim() === "" ? null : guidedText,
        origin: question.mode,
        proposedReading:
          question.mode === "TRADUCAO" && proposedReading.trim() !== "" ? proposedReading : null,
      });
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-3 rounded border p-3">
      {question.mode === "TRADUCAO" ? (
        <Textarea
          aria-label="Leitura proposta"
          value={proposedReading}
          onChange={(event) => setProposedReading(event.target.value)}
          placeholder="Pelo que você me contou, entendi que… É isso?"
        />
      ) : null}

      {Object.entries(question.options).map(([code, label]) =>
        question.multi ? (
          <Checkbox
            key={code}
            id={`${question.id}__${code}`}
            checked={options.includes(code)}
            onChange={() => toggle(code)}
            label={label}
          />
        ) : (
          <Radio
            key={code}
            id={`${question.id}__${code}`}
            name={`${question.id}__opcao`}
            checked={options.includes(code)}
            onChange={() => toggle(code)}
            label={label}
          />
        ),
      )}

      {question.allowsGuidedText ? (
        <Textarea
          aria-label="O que precisa ser respeitado (palavras dela)"
          value={guidedText}
          onChange={(event) => setGuidedText(event.target.value)}
          placeholder="Nas palavras dela — o que não aceita, o que precisa ser respeitado."
        />
      ) : null}

      <fieldset className="space-y-1">
        <legend className="text-xs font-medium">Quanto isso pesa, segundo ela</legend>
        {NEED_DEGREES.map((value) => (
          <Radio
            key={value}
            id={`${question.id}__grau__${value}`}
            name={`${question.id}__grau`}
            checked={degree === value}
            onChange={() => setDegree(value)}
            label={NEED_DEGREE_LABELS[value]}
          />
        ))}
      </fieldset>

      {question.flexibilityQuestion ? (
        <Textarea
          aria-label={question.flexibilityQuestion}
          value={flexibility}
          onChange={(event) => setFlexibility(event.target.value)}
          placeholder={question.flexibilityQuestion}
        />
      ) : null}

      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <Button type="button" size="sm" onClick={submit} disabled={pending}>
        Registrar
      </Button>
    </div>
  );
}
