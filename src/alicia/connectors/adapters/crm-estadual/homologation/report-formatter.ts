import type {
  CrmConfigReport,
  CrmEsHomologationReport,
  CrmHomologationClassification,
  CrmHomologationProbeResult,
  CrmPipelineImpact,
} from "./types";

const PRODUCTION_THRESHOLDS = {
  minSuccessRate: 95,
  maxAverageLatencyMs: 500,
  minAvailability: 95,
};

export function classifyCrmHomologation(input: {
  config: CrmConfigReport;
  probe: CrmHomologationProbeResult;
  pipeline: CrmPipelineImpact;
  problems: string[];
}): { classification: CrmHomologationClassification; reason: string } {
  const blockers: string[] = [];

  if (!input.config.configured) {
    blockers.push("Configuração incompleta (chave CFM ou CRMs seed ausentes).");
  }

  if (!input.config.readyForProbe) {
    blockers.push("Ambiente não está pronto para probe real.");
  }

  if (input.probe.health === "OFFLINE") {
    blockers.push("Probe retornou health OFFLINE — nenhuma consulta SOAP bem-sucedida.");
  }

  if (input.probe.configured && input.probe.successRate < PRODUCTION_THRESHOLDS.minSuccessRate) {
    blockers.push(
      `Taxa de sucesso ${input.probe.successRate}% abaixo do mínimo ${PRODUCTION_THRESHOLDS.minSuccessRate}%.`,
    );
  }

  if (
    input.probe.configured &&
    input.probe.averageLatencyMs > PRODUCTION_THRESHOLDS.maxAverageLatencyMs
  ) {
    blockers.push(
      `Latência média ${input.probe.averageLatencyMs}ms acima do limite ${PRODUCTION_THRESHOLDS.maxAverageLatencyMs}ms.`,
    );
  }

  if (input.probe.configured && input.probe.availability < PRODUCTION_THRESHOLDS.minAvailability) {
    blockers.push(
      `Disponibilidade ${input.probe.availability}% abaixo do mínimo ${PRODUCTION_THRESHOLDS.minAvailability}%.`,
    );
  }

  if (input.probe.soapErrors > 0) {
    blockers.push(`${input.probe.soapErrors} erro(s) SOAP registrado(s).`);
  }

  const allProblems = [...blockers, ...input.problems];

  if (allProblems.length > 0) {
    return {
      classification: "NEEDS_IMPROVEMENT",
      reason: allProblems.join(" "),
    };
  }

  return {
    classification: "READY_FOR_PRODUCTION",
    reason:
      "Configuração válida, probe com sucesso ≥95%, latência <500ms, sem erros SOAP bloqueantes.",
  };
}

export function buildProblemsList(
  config: CrmConfigReport,
  probe: CrmHomologationProbeResult,
): string[] {
  const problems: string[] = [];

  for (const check of config.checks) {
    if (!check.valid) {
      problems.push(`${check.variable}: ${check.message}`);
    }
  }

  if (probe.health === "OFFLINE") {
    problems.push("Integração CRM ES offline no ambiente atual.");
  }

  for (const attempt of probe.attempts) {
    if (!attempt.success && attempt.errorMessage) {
      problems.push(`CRM ${attempt.crm}: ${attempt.errorMessage}`);
    }
  }

  return [...new Set(problems)];
}

export function formatCrmHomologationMarkdown(report: CrmEsHomologationReport): string {
  const { config, probe, discovery, pipeline, baseline, classification, classificationReason } =
    report;

  const configTable = config.checks
    .map(
      (c) =>
        `| ${c.variable} | ${c.present ? "✅" : "❌"} | ${c.valid ? "✅" : "❌"} | ${c.maskedValue} | ${c.message} |`,
    )
    .join("\n");

  const probeTable =
    probe.attempts.length === 0
      ? "_Nenhuma tentativa — configuração ausente._"
      : probe.attempts
          .map(
            (a) =>
              `| ${a.crm} | ${a.success ? "✅" : "❌"} | ${a.latencyMs}ms | ${a.errorKind ?? "—"} | ${a.recordName ?? a.errorMessage ?? "—"} |`,
          )
          .join("\n");

  const mockCandidates = discovery.mock.candidates
    .map((c) => `- ${c.nome} (CRM ${c.crm}) — ${c.especialidade}, ${c.cidade}`)
    .join("\n");

  const realCandidates =
    discovery.real.candidates.length === 0
      ? "_Nenhum candidato — fetch real falhou ou retornou vazio._"
      : discovery.real.candidates
          .map((c) => `- ${c.nome} (CRM ${c.crm}) — ${c.especialidade}, ${c.cidade}`)
          .join("\n");

  const inconsistencies =
    discovery.inconsistencies.length === 0
      ? "_Nenhuma inconsistência campo a campo._"
      : discovery.inconsistencies
          .map((i) => `- CRM ${i.crm} · **${i.field}**: mock="${i.mock}" → real="${i.real}"`)
          .join("\n");

  return `# Relatório de Homologação — CRM Estadual ES

**Gerado em:** ${report.generatedAt}  
**Missão:** 010 — CRM Estadual ES Homologation & Pilot  
**Classificação:** **${classification}**

---

## ETAPA 1 — Validação de configuração

| Variável | Presente | Válida | Valor (mascarado) | Mensagem |
|----------|:--------:|:------:|-------------------|----------|
${configTable}

| Parâmetro | Valor |
|-----------|-------|
| Configurado | ${config.configured ? "✅ Sim" : "❌ Não"} |
| UF | ${config.uf} |
| CRMs seed | ${config.seedCount} |
| Service URL | ${config.serviceUrl} |
| Timeout | ${config.requestTimeoutMs}ms |
| Habilitado | ${config.enabled ? "Sim" : "Não"} |

---

## ETAPA 2 — Testes reais (homologação)

| Métrica | Valor |
|---------|------:|
| Health | ${probe.health} |
| Taxa de sucesso | ${probe.successRate}% |
| Disponibilidade | ${probe.availability}% |
| Latência média | ${probe.averageLatencyMs}ms |
| Erros SOAP | ${probe.soapErrors} |
| Timeouts | ${probe.timeouts} |
| Retries | ${probe.retries} |
| Início | ${probe.startedAt} |
| Fim | ${probe.completedAt} |

### Tentativas por CRM

| CRM | Sucesso | Latência | Tipo erro | Resultado |
|-----|:-------:|---------:|-----------|-----------|
${probeTable}

---

## ETAPA 3 — Discovery Mock vs Real (CRM exclusivo)

| Indicador | Mock | Real |
|-----------|-----:|-----:|
| Candidatos encontrados | ${discovery.mock.candidatesFound} | ${discovery.real.candidatesFound} |
| Únicos | ${discovery.mock.unique} | ${discovery.real.unique} |
| Duplicados | ${discovery.mock.duplicates} | ${discovery.real.duplicates} |
| Ignorados | ${discovery.mock.ignored} | ${discovery.real.ignored} |

${discovery.real.error ? `**Erro fetch real:** ${discovery.real.error}\n` : ""}

### Candidatos Mock

${mockCandidates || "_—_"}

### Candidatos Real

${realCandidates}

### Apenas no Mock

${discovery.onlyInMock.length ? discovery.onlyInMock.map((c) => `- ${c}`).join("\n") : "_Nenhum_"}

### Apenas no Real

${discovery.onlyInReal.length ? discovery.onlyInReal.map((c) => `- ${c}`).join("\n") : "_Nenhum_"}

### Em ambos

${discovery.inBoth.length ? discovery.inBoth.map((c) => `- ${c}`).join("\n") : "_Nenhum_"}

### Inconsistências

${inconsistencies}

---

## ETAPA 4 — Pipeline (Dry Run)

| Fase | Resultado |
|------|-----------|
| Discovery | ${discovery.real.fetchSuccess ? `${discovery.real.unique} candidato(s) via CRM real` : "CRM real indisponível — baseline mock"} |
| Evidence | Cobertura média ${pipeline.coverageAverage}% |
| Protocol | HUMAN_REVIEW ${pipeline.humanReview} · AUTO_PUBLISH ${pipeline.autoPublish} |
| Publication (Dry Run) | ${pipeline.publicationDryRun} simulação(ões) |
| Verification | ${pipeline.verificationAttempted} tentativa(s) |
| Operations | ${pipeline.operationsBottlenecks} gargalo(s) |

---

## ETAPA 5 — Impacto

| Métrica | Baseline (Missão 008) | Atual | Delta |
|---------|---------------------:|------:|------:|
| Cobertura média | ${baseline.coverageAverage}% | ${pipeline.coverageAverage}% | ${pipeline.coverageDeltaVsBaseline >= 0 ? "+" : ""}${pipeline.coverageDeltaVsBaseline} pp |
| HUMAN_REVIEW | ${baseline.humanReview} | ${pipeline.humanReview} | ${pipeline.humanReviewDelta >= 0 ? "+" : ""}${pipeline.humanReviewDelta} |
| AUTO_PUBLISH | ${baseline.autoPublish} | ${pipeline.autoPublish} | ${pipeline.autoPublishDelta >= 0 ? "+" : ""}${pipeline.autoPublishDelta} |

### Problemas encontrados

${report.problems.length ? report.problems.map((p) => `- ${p}`).join("\n") : "_Nenhum bloqueante adicional._"}

### Confiabilidade da integração

- Confiabilidade estimada: ${probe.configured ? `${probe.availability}%` : "0% (não configurada)"}
- Health runtime: ${probe.health}
- ${probe.soapErrors === 0 && probe.timeouts === 0 ? "Sem timeouts ou erros SOAP na execução." : `${probe.soapErrors} SOAP / ${probe.timeouts} timeout(s).`}

---

## ETAPA 6 — Classificação

**${classification}**

${classificationReason}

---

## Restrições respeitadas

- Nenhum motor alterado
- Protocol Engine inalterado
- UX inalterada
- Nenhum perfil publicado no catálogo
- Sem commit / sem push

---

## Referências

- Adapter: \`src/alicia/connectors/adapters/crm-estadual/\`
- Homologação: \`src/alicia/connectors/adapters/crm-estadual/homologation/\`
- Roadmap fontes: \`docs/alicia/ROADMAP_FONTES_OFICIAIS.md\`
- Baseline piloto: \`docs/alicia/PILOT_ES_REPORT.md\`
`;
}
