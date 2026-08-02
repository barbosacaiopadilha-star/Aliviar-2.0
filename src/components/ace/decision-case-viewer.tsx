"use client";

import { useMemo, useState } from "react";

import { JsonViewer } from "@/components/ace/json-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { EstadoInformacao } from "@/modules/ace/core/information-state";
import {
  classifyP002CatalogFields,
  inferP002TechnicalHypotheses,
  type P002CompletenessFieldId,
} from "@/modules/ace/protocols/p002-completeness";
import {
  applyHumanCorrection,
  resolveFieldStateWithOverrides,
  type P002HumanFieldCorrection,
} from "@/modules/ace/protocols/p002-human-overrides";

type DecisionCaseViewerProps = {
  decisionCase: DecisionCase;
  narrative?: Narrative | null;
  humanCorrections?: P002HumanFieldCorrection[];
  onCorrection?: (correction: P002HumanFieldCorrection) => void;
};

const ESTADO_LABELS: Record<EstadoInformacao, string> = {
  conhecido: "Conhecido",
  ausencia_declarada: "Ausência declarada",
  desconhecido: "Desconhecido",
  nao_perguntado: "Não perguntado",
  sem_resposta: "Sem resposta",
  nao_se_aplica: "Não se aplica",
  conflitante: "Conflitante",
  requer_confirmacao: "Requer confirmação",
  determinado_pelo_caso: "Determinado pelo caso",
  determinado_pelo_curador: "Determinado pelo Curador",
};

const FIELD_LABELS: Record<P002CompletenessFieldId, string> = {
  decision: "Decisão",
  goal: "Objetivo",
  especialidade: "Especialidade",
  exames: "Exames complementares",
  preco_consulta: "Valor da consulta",
  outras_doencas: "Outras condições de saúde",
  localizacao: "Localização",
  convenio: "Convênio",
  modalidade: "Modalidade de atendimento",
  atendimento_anterior: "Atendimento anterior com especialista",
};

function EstadoBadge({ estado }: { estado: EstadoInformacao }) {
  const variant =
    estado === "conhecido" || estado === "ausencia_declarada" || estado === "determinado_pelo_caso"
      ? "sage"
      : estado === "nao_se_aplica"
        ? "default"
        : estado === "conflitante" || estado === "requer_confirmacao"
          ? "gold"
          : "default";

  return <Badge variant={variant}>{ESTADO_LABELS[estado]}</Badge>;
}

function Section({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  empty?: string;
}) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card className="space-y-3">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {hasContent ? children : <p className="text-sm text-ink-muted">{empty ?? "Nenhum item."}</p>}
    </Card>
  );
}

export function DecisionCaseViewer({
  decisionCase,
  narrative,
  humanCorrections = [],
  onCorrection,
}: DecisionCaseViewerProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  const catalog = useMemo(() => {
    if (!narrative) return [];
    return classifyP002CatalogFields(narrative).map((entry) => ({
      ...entry,
      state: resolveFieldStateWithOverrides(entry.field, entry.state, humanCorrections),
    }));
  }, [narrative, humanCorrections]);

  const hypotheses = useMemo(
    () => (narrative ? inferP002TechnicalHypotheses(narrative) : []),
    [narrative],
  );

  const confirmedInfo = catalog.filter(
    (entry) =>
      entry.state === "conhecido" ||
      entry.state === "ausencia_declarada" ||
      entry.state === "determinado_pelo_caso" ||
      entry.state === "determinado_pelo_curador",
  );

  const unknownInfo = catalog.filter(
    (entry) =>
      entry.state === "desconhecido" ||
      entry.state === "nao_perguntado" ||
      entry.state === "sem_resposta",
  );

  function markAsNotApplicable(field: P002CompletenessFieldId) {
    if (!onCorrection) return;
    const previous = catalog.find((entry) => entry.field === field)?.state;
    onCorrection({
      field,
      estado: "nao_se_aplica",
      motivo: "Marcado como não aplicável pelo Curador.",
      corrigidoPor: "curador",
      corrigidoEm: new Date().toISOString(),
      valorAnterior: previous,
    });
  }

  return (
    <div className="space-y-4">
      <Section
        title="Declaração de decisão"
        description="O que o paciente precisa decidir e qual objetivo busca."
      >
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-ink">Decisão</dt>
            <dd className="text-ink-muted">
              {decisionCase.decisionStatement.decision ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Objetivo</dt>
            <dd className="text-ink-muted">{decisionCase.decisionStatement.goal ?? "—"}</dd>
          </div>
          {decisionCase.decisionStatement.originEvidence ? (
            <div>
              <dt className="font-medium text-ink">Evidência</dt>
              <dd className="border-l-2 border-border pl-2 italic text-ink-muted">
                &ldquo;{decisionCase.decisionStatement.originEvidence.quote}&rdquo;
              </dd>
            </div>
          ) : null}
        </dl>
      </Section>

      <Section
        title="Restrições obrigatórias"
        description="Condições que eliminam alternativas — cada uma com evidência na narrativa."
        empty="Nenhuma restrição obrigatória identificada."
      >
        <ul className="space-y-3">
          {decisionCase.mandatoryConstraints.map((constraint, index) => (
            <li key={`${constraint.description}-${index}`} className="rounded-md border border-border p-3 text-sm">
              <p className="text-ink">{constraint.description}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Fonte: {constraint.sourceType === "fato_relatado" ? "fato relatado" : "inferência estrutural"}
              </p>
              <p className="mt-1 border-l-2 border-border pl-2 italic text-ink-muted">
                &ldquo;{constraint.originEvidence.quote}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Preferências"
        description="Características desejáveis, mas não eliminatórias."
        empty="Nenhuma preferência registrada."
      >
        <ul className="space-y-3">
          {decisionCase.preferences.map((preference, index) => (
            <li key={`${preference.description}-${index}`} className="rounded-md border border-border p-3 text-sm">
              <p className="text-ink">{preference.description}</p>
              <p className="mt-1 border-l-2 border-border pl-2 italic text-ink-muted">
                &ldquo;{preference.originEvidence.quote}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {confirmedInfo.length > 0 ? (
        <Section title="Informações confirmadas" description="Dados respondidos ou declarados explicitamente.">
          <ul className="space-y-2">
            {confirmedInfo.map((entry) => (
              <li key={entry.field} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-ink">{FIELD_LABELS[entry.field]}</span>
                <EstadoBadge estado={entry.state} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section
        title="Informações ausentes"
        description="Somente lacunas reais — não confundidas com negações ou campos fora de escopo."
        empty="Nenhuma lacuna obrigatória identificada."
      >
        <ul className="space-y-2">
          {decisionCase.missingInformation.map((entry, index) => (
            <li key={`${entry.relatedField}-${index}`} className="rounded-md border border-[color-mix(in_srgb,var(--color-brand-gold)_30%,transparent)] p-3 text-sm">
              <p className="text-ink">{entry.description}</p>
              <p className="mt-1 text-xs text-ink-muted">Campo: {entry.relatedField}</p>
            </li>
          ))}
        </ul>
      </Section>

      {hypotheses.length > 0 ? (
        <Section
          title="Hipóteses técnicas"
          description="Inferências que exigem validação humana — não são pendências do paciente."
        >
          <ul className="space-y-2">
            {hypotheses.map((hypothesis) => (
              <li key={hypothesis.field} className="rounded-md border border-border p-3 text-sm">
                <p className="text-ink">{hypothesis.description}</p>
                <Badge variant="gold" className="mt-2">
                  Requer validação do Curador
                </Badge>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {unknownInfo.length > 0 ? (
        <Section title="Pontos que precisam de validação" description="Informação ainda não resolvida.">
          <ul className="space-y-2">
            {unknownInfo.map((entry) => (
              <li
                key={entry.field}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{FIELD_LABELS[entry.field]}</span>
                  <EstadoBadge estado={entry.state} />
                </div>
                {onCorrection ? (
                  <button
                    type="button"
                    onClick={() => markAsNotApplicable(entry.field)}
                    className="text-xs text-brand-primary underline-offset-4 hover:underline"
                  >
                    Marcar como não aplicável
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowTechnical((value) => !value)}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
          aria-expanded={showTechnical}
        >
          {showTechnical ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
        </button>
        {showTechnical ? (
          <div className="mt-3">
            <JsonViewer value={decisionCase} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { applyHumanCorrection };
