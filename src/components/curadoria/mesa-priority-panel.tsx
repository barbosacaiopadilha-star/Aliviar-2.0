/**
 * Priority Profile (leitura) — Área 2 da Mesa de Curadoria.
 *
 * @metodo Fundamentos §10 — o Perfil de Prioridades é o que orienta todas as etapas seguintes
 * @metodo Ontologia §3.6 — Peso é o par valor + Evidência de Curadoria, e é do paciente
 * @metodo Experience §2.3 — o peso com a fala ao lado é reconhecimento, não nota
 * @metodo Engine §3 — a entrada do Motor é sempre um Perfil validado e congelado
 *
 * Por que existe: durante a análise, o Curador volta ao Perfil o tempo todo —
 * é o critério contra o qual tudo se compara. Precisa estar sempre à vista,
 * em leitura rápida: proporção, evidência, quem validou e quando.
 *
 * O que nunca faz: permitir edição (o Perfil validado é imutável — corrigir
 * exige um novo, com o paciente), mostrar percentual de barra como se fosse
 * nota, ou parecer planilha — cada peso é uma afirmação do paciente, não uma
 * célula.
 */

import { EvidenceCard } from "@/components/curadoria/evidence-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PRIORITY_CRITERION_LABELS } from "@/modules/curadoria/types";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

export function MesaPriorityPanel({ record }: { record: CuradoriaRecord }) {
  const { weights, observations } = record.prioridades;
  const validation = record.validacao;

  return (
    <Card className="space-y-5 border-brand-gold/40">
      <CardHeader>
        <CardTitle>O que importa para {record.patientFirstName}</CardTitle>
        <CardDescription>
          {validation
            ? `Validado por ${record.patientFirstName} em ${new Date(validation.validatedAt).toLocaleDateString("pt-BR")} · conduzido por ${record.curatorName}`
            : "Ainda não validado — a Mesa não deveria estar aberta."}
        </CardDescription>
      </CardHeader>

      <ul className="space-y-4">
        {weights.map((weight) => (
          <li key={weight.criterion}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink">
                {PRIORITY_CRITERION_LABELS[weight.criterion]}
              </span>
              <span className="tabular-nums font-serif text-lg font-semibold text-brand-primary-deep">
                {weight.weight}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand-sage"
                style={{ width: `${weight.weight}%` }}
              />
            </div>
            <EvidenceCard evidence={weight.evidence} className="mt-2" />
          </li>
        ))}
      </ul>

      {validation?.correctionsMade.length ? (
        <p className="text-xs leading-relaxed text-ink-muted">
          Corrigido pelo paciente na validação: {validation.correctionsMade.join("; ")}.
        </p>
      ) : null}

      {observations.length > 0 ? (
        <div className="border-t border-border pt-4">
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">Observações</h3>
          <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-ink-muted">
            {observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
