import type { EsPilotCatalogReport } from "./es-pilot-catalog";

function topEntries(map: Record<string, number>, limit = 5): Array<[string, number]> {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function formatMs(ms: number): string {
  return `${ms}ms`;
}

export function formatPilotEsReport(report: EsPilotCatalogReport): string {
  const { discovery, evidence, protocol, publication, verification, connectors, phases, factory } =
    report;

  return `# Piloto ES — Relatório Operacional

**Gerado em:** ${report.generatedAt}  
**Escopo:** ${report.scope.state} — ${report.scope.specialties.join(", ")}

---

## Resumo executivo operacional

| Métrica | Valor |
|---------|------:|
| Candidatos encontrados (bruto) | ${discovery.candidatesFound} |
| Candidatos únicos | ${discovery.uniqueCandidates} |
| Duplicados | ${discovery.duplicates} |
| Ignorados (escopo/confiança) | ${discovery.ignored} |
| Rejeitados (Protocol) | ${protocol.reject} |
| Review Cases (HUMAN_REVIEW) | ${protocol.humanReview} |
| AUTO_PUBLISH | ${protocol.autoPublish} |
| Publicados | ${publication.published} |
| Verificações concluídas | ${verification.completed} |

---

## Fase 1 — Discovery

| Indicador | Valor |
|-----------|------:|
| Prontos para evidência (≥0.8) | ${discovery.readyForEvidence} |
| Descobertos (0.5–0.79) | ${discovery.discovered} |
| Falhas de fonte | ${discovery.sourceFailures} |
| Duração | ${formatMs(phases.discoveryMs)} |

### Por especialidade

${Object.entries(discovery.bySpecialty)
  .map(([k, v]) => `- **${k}:** ${v}`)
  .join("\n")}

### Por cidade

${Object.entries(discovery.byCity)
  .map(([k, v]) => `- **${k}:** ${v}`)
  .join("\n")}

### Saúde das fontes de discovery

${Object.entries(discovery.sourceHealth)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

---

## Fase 2 — Evidence Acquisition

| Indicador | Valor |
|-----------|------:|
| Packages criados | ${evidence.packagesCreated} |
| Packages rejeitados | ${evidence.packagesRejected} |
| Conflitos totais | ${evidence.totalConflicts} |
| Cobertura média | ${evidence.averageCoverage.toFixed(1)}% |
| Duração | ${formatMs(phases.evidenceMs)} |

---

## Fase 3 — Protocol Engine

| Decisão | Quantidade |
|---------|----------:|
| AUTO_PUBLISH | ${protocol.autoPublish} |
| HUMAN_REVIEW | ${protocol.humanReview} |
| REJECT | ${protocol.reject} |
| Duração | ${formatMs(phases.protocolMs)} |

---

## Fase 4 — Publication Pipeline

| Resultado | Quantidade |
|-----------|----------:|
| Tentativas | ${publication.attempted} |
| Publicados | ${publication.published} |
| Review cases | ${publication.reviewCases} |
| Falhas | ${publication.failed} |
| Sem alteração | ${publication.noChange} |
| Duração | ${formatMs(phases.publicationMs)} |

---

## Fase 5 — Verification

| Indicador | Valor |
|-----------|------:|
| Tentativas | ${verification.attempted} |
| Concluídas | ${verification.completed} |
| Falhas | ${verification.failed} |
| Pendentes de revisão | ${verification.pendingReview} |
| Duração | ${formatMs(phases.verificationMs)} |

---

## Connector Health

| Conector | Status |
|----------|--------|
${Object.entries(connectors.health)
  .map(([id, status]) => `| ${id} | ${status} |`)
  .join("\n")}

- Sucesso: ${connectors.successCount} / ${connectors.successCount + connectors.failureCount}
- Latência média: ${connectors.averageLatencyMs}ms

---

## Factory Run (orquestração automatizada)

| Campo | Valor |
|-------|-------|
| Run ID | ${factory.runId ?? "—"} |
| Status | ${factory.status ?? "—"} |
| Duração | ${factory.durationMs ?? "—"}ms |
| Publicados | ${factory.published} |
| Review cases | ${factory.reviewCases} |
| Erros | ${factory.errors} |
| Duração total factory | ${formatMs(phases.factoryMs)} |

---

## Tempo médio por etapa

| Etapa | Duração |
|-------|--------:|
| Discovery | ${formatMs(phases.discoveryMs)} |
| Evidence | ${formatMs(phases.evidenceMs)} |
| Protocol | ${formatMs(phases.protocolMs)} |
| Publication | ${formatMs(phases.publicationMs)} |
| Verification | ${formatMs(phases.verificationMs)} |
| Factory (end-to-end) | ${formatMs(phases.factoryMs)} |

---

## Catálogo curado (referência)

O seed manual contém **${report.curatedCatalog.totalDoctors}** perfis (${report.curatedCatalog.specialties.Ortopedia ?? 0} Ortopedia, ${report.curatedCatalog.specialties.Neurocirurgia ?? 0} Neurocirurgia), com ${report.curatedCatalog.completeProfiles} perfis completos.

---

## Candidatos processados

| Nome | Especialidade | Cidade | Confiança | Protocol | Publicado | Verificado |
|------|---------------|--------|----------:|----------|-----------|------------|
${report.candidates
  .map(
    (c) =>
      `| ${c.name} | ${c.specialty} | ${c.city} | ${c.confidence.toFixed(2)} | ${c.protocolOutcome} | ${c.published ? "Sim" : "Não"} | ${c.verified ? "Sim" : "Não"} |`,
  )
  .join("\n")}
`;
}

export function formatCatalogQualityReport(report: EsPilotCatalogReport): string {
  const { evidence, protocol, curatedCatalog } = report;

  return `# Relatório de Qualidade do Catálogo — Piloto ES

**Gerado em:** ${report.generatedAt}  
**Especialidades:** Ortopedia, Neurocirurgia

---

## Cobertura editorial (pipeline automatizado)

| Indicador | Valor |
|-----------|------:|
| Candidatos únicos | ${report.discovery.uniqueCandidates} |
| Cobertura média de evidência | ${evidence.averageCoverage.toFixed(1)}% |
| Conflitos detectados | ${evidence.totalConflicts} |
| AUTO_PUBLISH | ${protocol.autoPublish} |
| HUMAN_REVIEW | ${protocol.humanReview} |
| REJECT | ${protocol.reject} |

---

## Evidências mais frequentes

Com base nos campos de cobertura e packages gerados:

${topEntries(evidence.coverageBySection, 6)
  .map(([section, score]) => `- **${section}:** score acumulado ${score.toFixed(0)}`)
  .join("\n") || "- Nenhum package de evidência com cobertura detalhada"}

Tipos de evidência por candidato (média ${average(report.candidates.map((c) => c.evidenceCount)).toFixed(1)} fontes/candidato):

- Registro profissional (CRM)
- Fonte institucional (URL de origem)
- Instituição / especialidade / cidade

---

## Conectores com mais conflitos

${topEntries(evidence.conflictsByConnector, 6)
  .map(([connector, count]) => `- **${connector}:** ${count} conflito(s)`)
  .join("\n") || "- Nenhum conflito registrado nesta execução"}

### Tipos de conflito

${topEntries(evidence.conflictsByType, 6)
  .map(([type, count]) => `- **${type}:** ${count}`)
  .join("\n") || "- Nenhum"}

---

## Regras que mais levam a HUMAN_REVIEW

${topEntries(protocol.reviewRules, 8)
  .map(([rule, count]) => `- ${rule}: ${count}`)
  .join("\n") || "- Nenhuma regra pendente registrada"}

---

## Campos que costumam faltar

${topEntries(protocol.missingFields, 8)
  .map(([field, count]) => `- **${field}:** ${count} ocorrência(s)`)
  .join("\n") || "- Nenhum campo ausente registrado pelo Protocol Engine"}

---

## Catálogo curado (seed manual)

| Métrica | Valor |
|---------|------:|
| Total de médicos | ${curatedCatalog.totalDoctors} |
| Ortopedia | ${curatedCatalog.specialties.Ortopedia ?? 0} |
| Neurocirurgia | ${curatedCatalog.specialties.Neurocirurgia ?? 0} |
| Perfis completos | ${curatedCatalog.completeProfiles} |
| Média de fontes/médico | ${curatedCatalog.averageSourcesPerDoctor.toFixed(1)} |
| Cidades cobertas | ${curatedCatalog.cityCount} |

### Cidades prioritárias sem médicos

${curatedCatalog.priorityCitiesWithoutDoctors.length > 0
  ? curatedCatalog.priorityCitiesWithoutDoctors.map((c) => `- ${c}`).join("\n")
  : "- Todas as cidades prioritárias possuem ao menos um médico no seed"}

---

## Qualidade vs quantidade

O piloto prioriza **confiança** sobre volume:

- Duplicatas são consolidadas antes do Protocol
- Candidatos fora de ES/Ortopedia/Neurocirurgia são descartados
- Apenas AUTO_PUBLISH entra na Publication Pipeline
- O seed curado (${curatedCatalog.totalDoctors} perfis) representa a barra editorial desejada; o pipeline automatizado ainda produz majoritariamente HUMAN_REVIEW
`;
}

export function formatReviewCaseAnalysis(report: EsPilotCatalogReport): string {
  const reviewCandidates = report.candidates.filter((c) => c.protocolOutcome === "HUMAN_REVIEW");
  const rejectCandidates = report.candidates.filter((c) => c.protocolOutcome === "REJECT");
  const publishCandidates = report.candidates.filter((c) => c.protocolOutcome === "AUTO_PUBLISH");

  const blockers: string[] = [];
  const nonBlocking: string[] = [];

  if (report.connectors.failureCount > 0) {
    blockers.push(
      `Conector(es) com falha na execução: ${report.connectors.failureCount} — CRM real requer ALICIA_CFM_WS_CHAVE configurada`,
    );
  }

  if (report.discovery.uniqueCandidates < 10) {
    nonBlocking.push(
      `Discovery automatizado retorna ${report.discovery.uniqueCandidates} candidatos únicos — volume limitado pelas fontes mock de discovery`,
    );
  }

  if (report.protocol.humanReview > report.protocol.autoPublish) {
    nonBlocking.push(
      `${report.protocol.humanReview} candidatos em HUMAN_REVIEW vs ${report.protocol.autoPublish} AUTO_PUBLISH — esperado no piloto (residência/RQE/Nível A)`,
    );
  }

  if (report.curatedCatalog.totalDoctors >= 30 && report.publication.published < 5) {
    nonBlocking.push(
      `Catálogo curado com ${report.curatedCatalog.totalDoctors} perfis prontos para ingestão editorial; pipeline automatizado publicou ${report.publication.published}`,
    );
  }

  if (report.evidence.totalConflicts > 0) {
    nonBlocking.push(`${report.evidence.totalConflicts} conflito(s) de evidência requerem curadoria`);
  }

  const crmNotConfigured = !process.env.ALICIA_CFM_WS_CHAVE && !process.env.CFM_WS_CHAVE;
  if (crmNotConfigured) {
    blockers.push(
      "CRM Estadual ES em modo degradado — chave CFM não configurada (ALICIA_CFM_WS_CHAVE)",
    );
  }

  if (report.discovery.sourceFailures > 0) {
    nonBlocking.push(`${report.discovery.sourceFailures} fonte(s) de discovery com falha ou offline`);
  }

  const readyForUsers = blockers.length === 0 && report.curatedCatalog.completeProfiles >= 20;

  if (!readyForUsers && blockers.length === 0) {
    blockers.push(
      "Pipeline automatizado ainda não produz catálogo publicável em volume — dependência do seed curado para go-live editorial",
    );
  }

  return `# Análise de Review Cases — Piloto ES

**Gerado em:** ${report.generatedAt}

---

## Distribuição de decisões

| Decisão | Quantidade | % |
|---------|----------:|--:|
| HUMAN_REVIEW | ${report.protocol.humanReview} | ${pct(report.protocol.humanReview, report.discovery.uniqueCandidates)} |
| AUTO_PUBLISH | ${report.protocol.autoPublish} | ${pct(report.protocol.autoPublish, report.discovery.uniqueCandidates)} |
| REJECT | ${report.protocol.reject} | ${pct(report.protocol.reject, report.discovery.uniqueCandidates)} |

---

## Candidatos em HUMAN_REVIEW

${reviewCandidates.length === 0
  ? "_Nenhum candidato nesta execução._"
  : reviewCandidates
      .map(
        (c) =>
          `### ${c.name} (${c.specialty}, ${c.city})\n\n- Confiança discovery: ${c.confidence}\n- Regras pendentes: ${c.pendingRules.join(", ") || "—"}\n- Cobertura evidência: ${c.coverageAverage.toFixed(0)}%\n- Conflitos: ${c.conflictCount}`,
      )
      .join("\n\n")}

---

## Candidatos REJECT

${rejectCandidates.length === 0
  ? "_Nenhum candidato rejeitado nesta execução._"
  : rejectCandidates
      .map(
        (c) =>
          `- **${c.name}** (${c.specialty}): regras falhas ${c.failedRules.join(", ") || "—"}`,
      )
      .join("\n")}

---

## Candidatos AUTO_PUBLISH

${publishCandidates.length === 0
  ? "_Nenhum candidato com publicação automática nesta execução._"
  : publishCandidates
      .map(
        (c) =>
          `- **${c.name}** (${c.specialty}, ${c.city}) — publicado: ${c.published ? "Sim" : "Não"}, verificado: ${c.verified ? "Sim" : "Não"}`,
      )
      .join("\n")}

---

## Regras mais frequentes em revisão

${topEntries(report.protocol.reviewRules, 10)
  .map(([rule, count]) => `1. ${rule} (${count}x)`)
  .join("\n") || "_Nenhuma_"}

---

## Relatório executivo

### O piloto está pronto para usuários?

**${readyForUsers ? "SIM — com ressalvas" : "NÃO"}**

${readyForUsers
  ? "O catálogo curado atende o mínimo editorial para exposição controlada."
  : "O pipeline automatizado ainda não substitui a curadoria manual para go-live público."}

### Bloqueadores reais

${blockers.length === 0 ? "_Nenhum bloqueador crítico identificado._" : blockers.map((b) => `- ${b}`).join("\n")}

### Pendências não bloqueantes

${nonBlocking.length === 0 ? "_Nenhuma._" : nonBlocking.map((b) => `- ${b}`).join("\n")}

---

## Recomendação operacional

1. **Go-live editorial:** usar seed curado (${report.curatedCatalog.totalDoctors} perfis, ${report.curatedCatalog.completeProfiles} completos) via ingestão catalog-factory
2. **Go-live automatizado:** configurar CRM real + ampliar fontes de discovery além de mocks
3. **Review queue:** priorizar candidatos com confiança ≥0.8 e regras FORM-002 / PUB-003 pendentes
`;
}

function increment(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function pct(part: number, total: number): string {
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((part / total) * 100)}%`;
}

export function formatExecutiveSummary(report: EsPilotCatalogReport): string {
  const analysis = formatReviewCaseAnalysis(report);
  const readyMatch = analysis.match(/\*\*(SIM|NÃO)[^*]*\*\*/);
  return readyMatch?.[0] ?? "**NÃO**";
}
