"use client";

import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import {
  CONDITION_REQUIREMENTS,
  DETAIL_REQUIREMENTS,
  type ConceptConditionalRule,
  type PracticeConcept,
} from "@/modules/curadoria/evidencias-pratica";
import {
  PROFESSIONAL_PROTOCOL,
  PROTOCOL_PARTS,
  professionalQuestionsOfPart,
  protocolProgress,
  type ProfessionalQuestion,
} from "@/modules/curadoria/protocolos";
import {
  saveOwnProtocolDraftAction,
  submitOwnProtocolAction,
} from "@/modules/curadoria/protocolos-actions";
import type { DraftResponse } from "@/modules/curadoria/protocolos-repository";

/**
 * PROTOCOLO DA PRÁTICA PROFISSIONAL — o preenchimento.
 *
 * @metodo PROTOCOLO_PRATICA_PROFISSIONAL.md — Q1..Q28, partes A–E
 * @metodo GRAMATICA_DAS_PERGUNTAS.md — situação, nunca opinião; escapes sempre
 *
 * Cinco blocos, salvamento parcial, retomada, revisão e submissão. O
 * progresso é CONTAGEM — "18 de 28 perguntas respondidas" — nunca percentual,
 * nunca qualidade: número não é mérito aqui.
 *
 * O que esta tela NUNCA diz: que responder melhora a posição do profissional,
 * que falta pouco para "completar o perfil", ou que a resposta foi
 * verificada. A submissão registra AUTODECLARAÇÃO — e diz isso com todas as
 * letras.
 */

type SaveResult = { success: true } | { success: false; error: string };
type SubmitResult =
  | { success: true; registered: number }
  | { success: false; error: string; rejected?: { subcriterionCode: string; errors: string[] }[] };

type Props = {
  initialResponses: Record<string, DraftResponse>;
  lastSavedAt: string | null;
  /** Pendências abertas pela operação — o que precisa de resposta nova. */
  revisionRequests?: { conceptCodes: string[]; reason: string }[];
  /**
   * Ações injetáveis (ETAPA 5): o mesmo formulário serve o profissional (ações
   * "own", padrão) e o cadastro administrativo (ações por profissionalProfileId).
   * Uma única renderização do Catálogo 1.0.0 — nunca duas listas.
   */
  saveAction?: (input: { responses: Record<string, DraftResponse> }) => Promise<SaveResult>;
  submitAction?: () => Promise<SubmitResult>;
  /** Muda só a moldura de texto: autodeclaração vs registro pela equipe. */
  mode?: "profissional" | "admin";
};

const PARTS = ["A", "B", "C", "D", "E"] as const;

function emptyResponse(): DraftResponse {
  return { options: [], details: {}, conditionNote: null, observation: null };
}

// ---------------------------------------------------------------------------
// Condicionais do banco — a MESMA leitura que o domínio executa na validação.
// ---------------------------------------------------------------------------

/** Campos de escolha única por decisão do catálogo aprovado (uma faixa de custo). */
const CAMPOS_DE_ESCOLHA_UNICA = new Set(["faixa"]);

function selecionadosDoCampo(response: DraftResponse, field: string): string[] {
  if (field === "principal") return response.options;
  const bruto = response.details[field];
  if (typeof bruto === "string") return [bruto];
  if (Array.isArray(bruto)) return bruto.filter((v): v is string => typeof v === "string");
  return [];
}

function regraVale(response: DraftResponse, rule: ConceptConditionalRule): boolean {
  const selecionados = selecionadosDoCampo(response, rule.when.field);
  if (rule.when.value !== undefined) return selecionados.includes(rule.when.value);
  if (rule.when.value_not !== undefined) return selecionados.some((v) => v !== rule.when.value_not);
  return false;
}

/** Um campo complementar está visível para a resposta atual? */
function campoVisivel(concept: PracticeConcept, response: DraftResponse, field: string): boolean {
  for (const regra of concept.conditionalRules) {
    if (regra.show === field && !regraVale(response, regra)) return false;
    if (regra.hide === field && regraVale(response, regra)) return false;
  }
  return true;
}

/** Remove de details os campos cuja condição de exibição deixou de valer. */
function pruneOrphanFields(
  concept: PracticeConcept,
  response: DraftResponse,
): Record<string, unknown> {
  const details = { ...response.details };
  for (const campo of concept.fields) {
    if (details[campo.field] !== undefined && !campoVisivel(concept, response, campo.field)) {
      delete details[campo.field];
    }
  }
  return details;
}

/** As opções selecionadas que exigem detalhe próprio (operadoras, parcelas). */
function detalhesExigidos(concept: PracticeConcept, response: DraftResponse) {
  const exigencias = DETAIL_REQUIREMENTS.get(concept.code) ?? [];
  return exigencias.filter((exigencia) =>
    [response.options, ...concept.fields.map((c) => selecionadosDoCampo(response, c.field))].some(
      (selecionados) => selecionados.includes(exigencia.value),
    ),
  );
}

export function ProtocoloPraticaForm({
  initialResponses,
  lastSavedAt,
  revisionRequests = [],
  saveAction = saveOwnProtocolDraftAction,
  submitAction = submitOwnProtocolAction,
  mode = "profissional",
}: Props) {
  const [responses, setResponses] = useState<Record<string, DraftResponse>>(initialResponses);
  const [part, setPart] = useState<(typeof PARTS)[number]>("A");
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState<string | null>(
    lastSavedAt ? `Rascunho retomado — salvo pela última vez em ${lastSavedAt.slice(0, 10)}.` : null,
  );
  const [pending, startTransition] = useTransition();

  const answered = useMemo(
    () => protocolProgress(Object.keys(responses).filter((code) => hasContent(responses[code]))),
    [responses],
  );

  function hasContent(response: DraftResponse | undefined): boolean {
    if (!response) return false;
    return response.options.length > 0 || Object.keys(response.details).length > 0;
  }

  function update(code: string, updater: (previous: DraftResponse) => DraftResponse) {
    setResponses((all) => ({ ...all, [code]: updater(all[code] ?? emptyResponse()) }));
  }

  function toggleOption(question: ProfessionalQuestion, optionCode: string) {
    update(question.concept.code, (previous) => {
      const selected = previous.options.includes(optionCode);
      const options = question.concept.multi
        ? selected
          ? previous.options.filter((o) => o !== optionCode)
          : [...previous.options, optionCode]
        : [optionCode];
      // Regra da resposta-mãe (condicionais do banco): campo mostrado por
      // condição não sobrevive à mudança da resposta que o sustentava.
      const next: DraftResponse = { ...previous, options };
      return { ...next, details: pruneOrphanFields(question.concept, next) };
    });
  }

  function toggleFieldValue(
    question: ProfessionalQuestion,
    field: string,
    value: string,
    single: boolean,
  ) {
    update(question.concept.code, (previous) => {
      const atual = previous.details[field];
      let proximo: string | string[] | undefined;
      if (single) {
        proximo = atual === value ? undefined : value;
      } else {
        const lista = Array.isArray(atual) ? (atual as string[]) : [];
        proximo = lista.includes(value) ? lista.filter((v) => v !== value) : [...lista, value];
        if (proximo.length === 0) proximo = undefined;
      }
      const details = { ...previous.details };
      if (proximo === undefined) delete details[field];
      else details[field] = proximo;
      const next: DraftResponse = { ...previous, details };
      return { ...next, details: pruneOrphanFields(question.concept, next) };
    });
  }

  function setDetailValue(question: ProfessionalQuestion, key: string, value: unknown) {
    update(question.concept.code, (previous) => {
      const details = { ...previous.details };
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        delete details[key];
      } else {
        details[key] = value;
      }
      return { ...previous, details };
    });
  }

  function save() {
    startTransition(async () => {
      const cleaned = Object.fromEntries(
        Object.entries(responses).filter(([, response]) => hasContent(response)),
      );
      const result = await saveAction({ responses: cleaned });
      setMessage(result.success ? "Rascunho salvo. Você pode retomar quando quiser." : result.error);
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await submitAction();
      if (result.success) {
        setReviewing(false);
        setMessage(
          mode === "admin"
            ? `${result.registered} respostas registradas pela equipe — ainda não verificadas.`
            : `${result.registered} respostas registradas como autodeclaração — ainda não verificadas. A equipe da Aliviar pode entrar em contato para confirmar informações.`,
        );
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Protocolo da Prática Profissional</CardTitle>
          <Badge variant="sage">{`${answered.answered} de ${answered.total} perguntas respondidas`}</Badge>
        </div>
        <CardDescription>
          As perguntas descrevem situações da sua prática — não há resposta certa, e marcar mais
          opções não significa nada além de descrever melhor. Tudo que você registrar entra como
          autodeclaração, ainda não verificada. Nada aqui vira medida, e responder não coloca você
          à frente nem atrás de ninguém.
        </CardDescription>
      </CardHeader>

      {revisionRequests.length > 0 ? (
        <div className="rounded border border-dashed p-3 text-sm" role="note">
          <p className="font-medium">A equipe da Aliviar pediu que você revise algumas respostas:</p>
          <ul className="mt-1 list-disc pl-5">
            {revisionRequests.map((request, index) => (
              <li key={index}>
                {request.conceptCodes
                  .map((code) => PROFESSIONAL_PROTOCOL.find((q) => q.concept.code === code)?.concept.name ?? code)
                  .join(", ")}{" "}
                — {request.reason}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-ink-muted">
            Responder de novo cria uma nova declaração — a anterior fica guardada no histórico.
          </p>
        </div>
      ) : null}

      {message ? <p className="text-sm text-ink-muted" role="status">{message}</p> : null}

      {reviewing ? (
        <ReviewPanel
          responses={responses}
          onBack={() => setReviewing(false)}
          onSubmit={submit}
          pending={pending}
          mode={mode}
        />
      ) : (
        <>
          <nav className="flex flex-wrap gap-2" aria-label="Blocos do protocolo">
            {PARTS.map((p) => (
              // O bloco ativo só se distinguia pela cor do botão: quem usa
              // leitor de tela ouvia cinco botões iguais, sem saber em qual
              // estava. `aria-current` diz o que a cor já dizia.
              <Button
                key={p}
                type="button"
                variant={p === part ? "primary" : "secondary"}
                size="sm"
                aria-current={p === part ? "true" : undefined}
                onClick={() => setPart(p)}
              >
                {PROTOCOL_PARTS[p]}
              </Button>
            ))}
          </nav>

          <div className="space-y-6">
            {professionalQuestionsOfPart(part).map((question) => (
              <QuestionBlock
                key={question.id}
                question={question}
                response={responses[question.concept.code] ?? emptyResponse()}
                onToggle={(option) => toggleOption(question, option)}
                onFieldToggle={(field, value, single) =>
                  toggleFieldValue(question, field, value, single)
                }
                onDetail={(key, value) => setDetailValue(question, key, value)}
                onCondition={(text) =>
                  update(question.concept.code, (previous) => ({
                    ...previous,
                    conditionNote: text.trim() === "" ? null : text,
                  }))
                }
                onFact={(text) =>
                  update(question.concept.code, (previous) => ({
                    ...previous,
                    details:
                      text.trim() === ""
                        ? Object.fromEntries(
                            Object.entries(previous.details).filter(([chave]) => chave !== "registro"),
                          )
                        : { ...previous.details, registro: text },
                  }))
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={pending}>
              Salvar rascunho
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviewing(true)}
              disabled={pending || answered.answered === 0}
            >
              Revisar e submeter
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/** Rótulo humano de um campo complementar do banco (fallback: o próprio nome). */
const FIELD_LABELS: Record<string, string> = {
  frequencia_habitual: "Frequência habitual, quando programado",
  prazo_de_resposta: "Prazo habitual de resposta",
  duracao_habitual: "Duração habitual do acompanhamento",
  tipo_de_local: "Tipo de local",
  encaminhamento: "Quando encaminha",
  faixa: "Faixa de custo da primeira consulta",
  formas: "Formas de pagamento",
  custos_adicionais: "Custos adicionais conhecidos",
};

function QuestionBlock({
  question,
  response,
  onToggle,
  onFieldToggle,
  onDetail,
  onCondition,
  onFact,
}: {
  question: ProfessionalQuestion;
  response: DraftResponse;
  onToggle: (option: string) => void;
  onFieldToggle: (field: string, value: string, single: boolean) => void;
  onDetail: (key: string, value: unknown) => void;
  onCondition: (text: string) => void;
  onFact: (text: string) => void;
}) {
  const concept = question.concept;

  // Condição estruturada obrigatória: qualquer valor selecionado (principal
  // ou campo complementar) marcado como condicao_estruturada no banco.
  const valoresComCondicao = CONDITION_REQUIREMENTS.get(concept.code) ?? new Set<string>();
  const needsCondition = [
    response.options,
    ...concept.fields.map((campo) => selecionadosDoCampo(response, campo.field)),
  ].some((selecionados) => selecionados.some((valor) => valoresComCondicao.has(valor)));

  const camposVisiveis = concept.fields.filter((campo) =>
    campoVisivel(concept, response, campo.field),
  );
  const exigencias = detalhesExigidos(concept, response);

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="text-sm font-medium">
        {question.id} · {question.question}
      </legend>

      {concept.kind === "CONDUTA" ? (
        <div className="space-y-2">
          {Object.entries(concept.options).map(([code, label]) =>
            concept.multi ? (
              <Checkbox
                key={code}
                id={`${concept.code}__${code}`}
                checked={response.options.includes(code)}
                onChange={() => onToggle(code)}
                label={label}
              />
            ) : (
              <Radio
                key={code}
                id={`${concept.code}__${code}`}
                name={concept.code}
                checked={response.options.includes(code)}
                onChange={() => onToggle(code)}
                label={label}
              />
            ),
          )}
        </div>
      ) : concept.fields.length === 0 ? (
        <Textarea
          aria-label={`Registro estruturado — ${concept.name}`}
          value={(response.details["registro"] as string) ?? ""}
          onChange={(event) => onFact(event.target.value)}
          placeholder="Registre os dados como constam nos documentos (instituição, ano…)"
        />
      ) : null}

      {/* Campos complementares fechados — estrutura por campos do catálogo
          aprovado (o custo achatado num único options[] morreu aqui). */}
      {camposVisiveis.map((campo) => {
        const single = CAMPOS_DE_ESCOLHA_UNICA.has(campo.field);
        const selecionados = selecionadosDoCampo(response, campo.field);
        return (
          <div key={campo.field} className="space-y-2 rounded border border-dashed p-3">
            <p className="text-xs font-medium text-ink-muted">
              {FIELD_LABELS[campo.field] ?? campo.field}
            </p>
            {Object.entries(campo.options).map(([code, label]) =>
              single ? (
                <Radio
                  key={code}
                  id={`${concept.code}__${campo.field}__${code}`}
                  name={`${concept.code}__${campo.field}`}
                  checked={selecionados.includes(code)}
                  onChange={() => onFieldToggle(campo.field, code, true)}
                  label={label}
                />
              ) : (
                <Checkbox
                  key={code}
                  id={`${concept.code}__${campo.field}__${code}`}
                  checked={selecionados.includes(code)}
                  onChange={() => onFieldToggle(campo.field, code, false)}
                  label={label}
                />
              ),
            )}
          </div>
        );
      })}

      {/* Registro livre complementar dos fatos estruturados com campos fechados. */}
      {concept.kind === "FATO_ESTRUTURADO" && concept.fields.length > 0 ? (
        <Textarea
          aria-label={`Registro estruturado — ${concept.name}`}
          value={(response.details["registro"] as string) ?? ""}
          onChange={(event) => onFact(event.target.value)}
          placeholder="Registre os dados como constam nos documentos (endereços, situações, listas…)"
        />
      ) : null}

      {/* Detalhes exigidos por opção (requires_detail do banco). */}
      {exigencias.map((exigencia) =>
        exigencia.detailKind === "lista_operadoras" ? (
          <Input
            key={exigencia.value}
            id={`${concept.code}__operadoras`}
            label="Operadoras aceitas (separe por vírgula) — obrigatório"
            value={
              Array.isArray(response.details["operadoras"])
                ? (response.details["operadoras"] as string[]).join(", ")
                : ""
            }
            onChange={(event) =>
              onDetail(
                "operadoras",
                event.target.value
                  .split(",")
                  .map((parte) => parte.trim())
                  .filter((parte) => parte.length > 0),
              )
            }
            placeholder="Ex.: Operadora A, Operadora B"
          />
        ) : exigencia.detailKind === "numero_parcelas" ? (
          <Input
            key={exigencia.value}
            id={`${concept.code}__numero_parcelas`}
            label="Número de parcelas — obrigatório"
            value={(response.details["numero_parcelas"] as string) ?? ""}
            onChange={(event) => onDetail("numero_parcelas", event.target.value)}
            placeholder="Ex.: 3"
          />
        ) : null,
      )}

      {needsCondition ? (
        <Input
          id={`${concept.code}__condicao`}
          label={`Condição — ${concept.name}`}
          value={response.conditionNote ?? ""}
          onChange={(event) => onCondition(event.target.value)}
          placeholder="Sob qual condição? (obrigatório para a opção marcada)"
          maxLength={280}
        />
      ) : null}
    </fieldset>
  );
}

function ReviewPanel({
  responses,
  onBack,
  onSubmit,
  pending,
  mode,
}: {
  responses: Record<string, DraftResponse>;
  onBack: () => void;
  onSubmit: () => void;
  pending: boolean;
  mode: "profissional" | "admin";
}) {
  const answered = PROFESSIONAL_PROTOCOL.filter((question) => {
    const response = responses[question.concept.code];
    return response && (response.options.length > 0 || Object.keys(response.details).length > 0);
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Revisão — o que será registrado</h3>
      <ul className="space-y-2 text-sm">
        {answered.map((question) => {
          const response = responses[question.concept.code]!;
          const labels = response.options.map((o) => question.concept.options[o] ?? o);
          return (
            <li key={question.id} className="rounded border p-2">
              <span className="font-medium">{question.concept.name}:</span>{" "}
              {labels.length > 0 ? labels.join(" · ") : "registro estruturado"}
              {response.conditionNote ? ` — condição: ${response.conditionNote}` : null}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-ink-muted">
        Ao submeter, estas {answered.length} respostas entram como declaração sua, com sua autoria e
        a data de hoje — ainda não verificadas. A equipe pode entrar em contato para confirmar.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={onSubmit} disabled={pending || answered.length === 0}>
          {mode === "admin" ? "Registrar pelo cadastro" : "Submeter como autodeclaração"}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack} disabled={pending}>
          Voltar e ajustar
        </Button>
      </div>
    </div>
  );
}
