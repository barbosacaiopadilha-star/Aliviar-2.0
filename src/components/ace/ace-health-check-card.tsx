import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { AceLanguageModelHealthStatus } from "@/modules/concierge/language-model";
import type { AceHealthCheck } from "@/modules/concierge/types";

type AceHealthCheckCardProps = {
  healthCheck: AceHealthCheck;
};

const LANGUAGE_MODEL_STATUS_LABELS: Record<AceLanguageModelHealthStatus, string> = {
  ANTHROPIC_CONFIGURED: "Anthropic configurado",
  FAKE_MODEL_NON_PRODUCTION: "Modelo fake (ambiente não produtivo)",
  MODEL_NOT_CONFIGURED: "Não configurado",
};

// Diagnóstico operacional do Método, não do pipeline de uma execução
// específica — responde "dá para confiar no ACE agora?" antes de colocar
// pacientes reais em produção. GO LIVE: MODEL_NOT_CONFIGURED só ocorre em
// produção sem CLAUDE_API_KEY — nunca um estado operacional válido,
// por isso aparece como não saudável aqui, nunca escondido.
export function AceHealthCheckCard({ healthCheck }: AceHealthCheckCardProps) {
  const hasStuckExecutions = healthCheck.stuckRunningExecutions.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Modelo de linguagem</p>
          <p className={`mt-1 text-sm font-medium ${healthCheck.languageModelHealthy ? "text-ink" : "text-error"}`}>
            {LANGUAGE_MODEL_STATUS_LABELS[healthCheck.languageModelStatus]}
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Profissionais elegíveis (P006/P007)</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{healthCheck.eligibleProfessionalsCount}</p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Profissionais com dados incompletos</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{healthCheck.professionalsMissingCompetencyDataCount}</p>
        </div>
      </div>

      {!healthCheck.languageModelHealthy ? (
        <Alert variant="error">
          CLAUDE_API_KEY não está configurada em produção — o ACE não pode executar nenhum protocolo que dependa de
          modelo de linguagem até a chave ser configurada. O sistema nunca usa o modelo fake fora de
          desenvolvimento/teste.
        </Alert>
      ) : null}

      {healthCheck.professionalsMissingCompetencyDataCount > 0 ? (
        <Alert variant="warning">
          {healthCheck.professionalsMissingCompetencyDataCount} profissional(is) sem experiência, abordagem de intake ou
          área de competência cadastrada — o ACE nunca inventa esses dados, então esses profissionais ficam de fora de
          toda Shortlist até o cadastro ser completado em{" "}
          <Link href="/admin/profissionais" className="underline">
            Profissionais
          </Link>
          .
        </Alert>
      ) : null}

      {hasStuckExecutions ? (
        <Alert variant="error">
          <p className="font-medium">
            {healthCheck.stuckRunningExecutions.length} execução(ões) em &quot;Em execução&quot; há mais de 30 minutos —
            possível interrupção anormal (ex.: reinício do servidor a meio da execução).
          </p>
          <ul className="mt-2 space-y-1">
            {healthCheck.stuckRunningExecutions.map((execution) => (
              <li key={execution.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge>{execution.patientName}</Badge>
                <span>desde {new Date(execution.startedAt).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Alert variant="info">Nenhuma execução presa em &quot;Em execução&quot; no momento.</Alert>
      )}
    </div>
  );
}
