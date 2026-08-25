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
  ordenarPelaRevisao,
  quantasExigemRevisao,
  RESOLUCAO_INDISPONIVEL,
  respostasQueExigemRevisao,
  ROTULO_DO_DESFECHO,
} from "@/modules/curadoria/respostas-que-exigem-revisao";
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
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const respondidas = PERSON_PROTOCOL.filter(
    (p) => p.mode !== "DECLARACAO_CLINICA" && byCode.has(p.subcriterionCode),
  ).length;
  const totalPerguntas = PERSON_PROTOCOL.filter((p) => p.mode !== "DECLARACAO_CLINICA").length;

  // Item 1.10C-A — a ordem em que ele precisa ver, derivada de `case_needs`.
  // Nenhum estado novo, nenhuma consulta nova: os mesmos `needs` que já
  // chegavam, lidos por uma regra que mora fora da tela.
  const revisao = respostasQueExigemRevisao(needs);
  const perguntas = ordenarPelaRevisao(PERSON_PROTOCOL, needs);
  const perguntasVisiveis = showAllQuestions
    ? perguntas
    : perguntas.filter((question) => byCode.has(question.subcriterionCode));

  return (
    <div className="space-y-3">
      <Badge variant="sage">{`${respondidas} de ${totalPerguntas} conversas registradas`}</Badge>

      {/* ITEM 1.10C-A — O QUE ELA RESPONDEU, ANTES DE QUALQUER OUTRA COISA.
          Desde o PP-03C ela discorda por conta própria, e ele só descobria
          rolando o Protocolo inteiro até topar com um estado diferente: uma
          discordância no fim da lista atravessava a Curadoria sem ninguém ver.
          O bloco NUNCA some — quando não há nada, ele diz que não há. */}
      <section className="rounded border border-dashed p-3 text-sm">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
          Respostas dela que exigem revisão
        </h3>

        {/* M1 — quantas são, derivado de `revisao.length` na renderização.
            Nenhum estado, nada persistido: com uma ou com seis, ele lê o
            número em vez de contar. */}
        <p
          className={
            revisao.length === 0 ? "mt-2 text-[var(--color-ink-muted)]" : "mt-1 font-medium"
          }
        >
          {quantasExigemRevisao(revisao.length)}
        </p>

        {/* M2 — o limite operacional, dito antes da lista.
            Sem esta frase a ausência de botão parece defeito da tela, e um
            Curador diante de uma discordância sem caminho tende a resolver por
            fora — editando a tradução ou pedindo que "corrijam" o registro
            dela. Qualquer um dos dois desfaz o ato que o PP-03 devolveu a ela. */}
        {revisao.length > 0 ? (
          <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
            {RESOLUCAO_INDISPONIVEL}
          </p>
        ) : null}

        {revisao.length === 0 ? null : (
          <ul className="mt-2 space-y-3">
            {revisao.map((resposta) => (
              <li key={resposta.subcriterionCode} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={resposta.desfecho === "RECUSADA" ? "default" : "sage"}>
                    {ROTULO_DO_DESFECHO[resposta.desfecho]}
                  </Badge>
                  <span className="font-medium">{resposta.pergunta}</span>
                </div>

                {resposta.leituraProposta ? (
                  <p className="italic text-[var(--color-ink-muted)]">
                    Sua leitura: {resposta.leituraProposta}
                  </p>
                ) : null}

                {/* A2 — o texto DELA, inteiro. Sem `line-clamp`, sem corte,
                    sem reticências: resumir a discordância é pôr alguém entre
                    a fala dela e quem precisa lê-la. */}
                {resposta.texto ? (
                  <p className="whitespace-pre-wrap">Ela disse: {resposta.texto}</p>
                ) : (
                  <p className="text-[var(--color-ink-muted)]">
                    Registro anterior à exigência de texto — não consta o que ela disse.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* FIM DO BLOCO DE REVISAO — permanece somente leitura. */}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={showAllQuestions}
          onClick={() => setShowAllQuestions((current) => !current)}
        >
          {showAllQuestions
            ? "Recolher protocolo completo"
            : `Abrir protocolo completo (${totalPerguntas} conversas)`}
        </Button>
        {!showAllQuestions ? (
          <span className="text-xs text-[var(--color-ink-muted)]">
            As fichas sem registro ficam recolhidas até serem necessárias na conversa.
          </span>
        ) : null}
      </div>

      {perguntasVisiveis.length > 0 ? (
        <ul className="space-y-2">
          {perguntasVisiveis.map((question) => {
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
      ) : null}
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
          {/*
            O RÓTULO DIZ QUAL CONVERSA — achado da travessia de 25/08.

            Eram treze botões idênticos ("Atualizar registro") na mesma tela, e
            o mesmo rótulo ainda aparece em outras seções da Mesa. Quem lê não
            tem como saber a qual conversa cada um pertence: na travessia,
            cliquei em treze deles achando que eram de outra etapa.

            O identificador da pergunta (P1…P16) já titula cada ficha logo
            acima. Repeti-lo aqui custa cinco caracteres e devolve ao botão a
            única coisa que faltava: dizer sobre o que ele age.
          */}
          {open ? "Fechar" : need ? `Atualizar ${question.id}` : `Registrar ${question.id}`}
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
