import type { OfficialSourceRegistrySnapshot } from "./types";

function stageCell(active: boolean): string {
  return active ? "✅" : "—";
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function formatLatency(ms: number | null): string {
  return ms === null ? "—" : `${ms}ms`;
}

function formatSync(iso: string | null): string {
  return iso ? iso.replace("T", " ").replace(/\.\d{3}Z$/, " UTC") : "—";
}

export function formatOfficialSourceRoadmapMarkdown(
  snapshot: OfficialSourceRegistrySnapshot,
): string {
  const { ranking, sources, pilotScope, generatedAt } = snapshot;

  const homologationTable = sources
    .map(
      (s) =>
        `| ${s.nome} | ${s.tipo} | ${s.responsavel} | ${s.status} | ${stageCell(s.mock)} | ${stageCell(s.homologacao)} | ${stageCell(s.staging)} | ${stageCell(s.producao)} | ${formatSync(s.ultimaSincronizacao)} | ${formatPercent(s.coberturaObtida)} | ${(s.confiabilidade * 100).toFixed(0)}% | ${formatLatency(s.latenciaMs)} |`,
    )
    .join("\n");

  return `# Roadmap — Fontes Oficiais AliCIA

**Gerado em:** ${generatedAt}  
**Escopo piloto:** ${pilotScope}  
**Programa:** Missão 009 — Official Source Program

---

## Resumo executivo

Plano de homologação gradual para substituir adapters mockados por integrações oficiais, **sem alteração arquitetural** e **sem novos motores**.

| Indicador piloto (baseline) | Valor |
|-----------------------------|------:|
| Cobertura média (evidências) | 88% |
| HUMAN_REVIEW | 6 / 6 |
| AUTO_PUBLISH | 0 / 6 |
| Conectores mock | 8 / 9 |
| Conector em homologação | 1 (CRM ES) |

---

## Respostas estratégicas

### Qual fonte gera maior ganho de cobertura?

**${ranking.maiorGanhoCobertura.nome}** (+${ranking.maiorGanhoCobertura.ganhoCoberturaEstimado} pp estimados)

Categorias: ${ranking.maiorGanhoCobertura.categoriasAtendidas.join(", ")}.

_Empate técnico com Residência CNRM (+22 pp); Graduação MEC é a primeira alavanca acadêmica._

### Qual reduz mais HUMAN_REVIEW?

**${ranking.maiorReducaoReview.nome}** (${ranking.maiorReducaoReview.reducaoReviewEstimada}% dos candidatos)

Regras impactadas: ${ranking.maiorReducaoReview.regrasProtocoloImpactadas.join(", ")}.

_FORM-002 (residência confirmada) é regra bloqueante no Protocol Engine._

### Qual melhora mais AUTO_PUBLISH?

**${ranking.maiorGanhoAutoPublish.nome}** (${ranking.maiorGanhoAutoPublish.ganhoAutoPublishEstimado}% dos candidatos com caminho Nível B)

Combinado com CRM Estadual oficial, desbloqueia o caminho documentado em \`protocol-engine.test.ts\` para AUTO_PUBLISH Nível B.

### Qual deve ser integrada primeiro?

**${ranking.primeiraIntegracao.nome}**

${ranking.primeiraIntegracao.notas ?? "Adapter já implementado; ativar credencial e validar em homologação."}

---

## Plano de homologação por fonte

| Nome | Tipo | Responsável | Status | Mock | Homologação | Staging | Produção | Última sincronização | Cobertura obtida | Confiabilidade | Latência |
|------|------|-------------|--------|:----:|:-----------:|:-------:|:--------:|---------------------|-----------------:|---------------:|---------:|
${homologationTable}

---

## Sequência de integração recomendada

| Fase | Fonte | Objetivo | Critério de saída |
|-----:|-------|----------|-------------------|
| 1 | CRM Estadual ES | Identidade e CRM ativo verificados | 95% sucesso em homologação, latência < 500ms |
| 2 | Residência CNRM | FORM-002 satisfeita | Graduação+residência confirmadas em staging |
| 3 | Graduação MEC | FORM-001 satisfeita | Dados acadêmicos cruzados com CRM |
| 4 | CFM Portal | Consolidação nacional | Redundância com CRM ES |
| 5 | Hospital Corpo Clínico | FORM-003 atuação atual | Parceria ICOT/Meridional |
| 6 | Universidade Docente | Candidatos fora do escopo | EMESCAM/UFES API ou crawler |
| 7 | Sociedade Médica | Especialidade/RQE | SBOT homologada |
| 8 | Fellowship Programas | Trajetória avançada | Complementar residência |
| 9 | Site Institucional | Instituições nível 4–5 | Crawler estável |

---

## Matriz fonte → categoria de evidência

| Fonte | Graduação | Residência | RQE | Instituições | Especialidade | Localização | Fontes |
|-------|:---------:|:----------:|:---:|:------------:|:-------------:|:-----------:|:------:|
| CRM Estadual ES | — | — | ✅ | — | ✅ | ✅ | ✅ |
| CFM Portal | ✅ | — | ✅ | — | ✅ | — | ✅ |
| Graduação MEC | ✅ | — | — | — | — | — | — |
| Residência CNRM | — | ✅ | — | — | — | — | — |
| Fellowship | — | ✅ | — | — | — | — | — |
| Hospital | — | ✅ | — | ✅ | — | ✅ | — |
| Universidade | ✅ | ✅ | — | ✅ | — | — | — |
| Sociedade Médica | — | ✅ | ✅ | — | ✅ | — | — |
| Site Institucional | — | — | — | ✅ | — | ✅ | — |

---

## Riscos e dependências

1. **CRM Estadual offline** — bloqueia confiança em identidade; sem ele, demais fontes não ancoram CRM.
2. **Bridge Protocol ↔ Evidence** — cobertura de evidências ≠ decisão de publicação; AUTO_PUBLISH exige \`candidate.graduation/residency.verified\` (fora do escopo desta missão).
3. **APIs acadêmicas fragmentadas** — MEC, CNRM e hospitais não têm API unificada; crawler pode ser necessário.
4. **Candidatos fora do escopo** — 3 packages (Lucas, André, Helena Martins) dependem de universidade/CFM oficial.

---

## Artefatos

| Artefato | Localização |
|----------|-------------|
| OfficialSourceRegistry | \`src/alicia/connectors/official-sources/\` |
| Conectores existentes | \`src/alicia/connectors/adapters/\` |
| Relatório cobertura | \`docs/alicia/EVIDENCE_COVERAGE_REPORT.md\` |
| Piloto ES | \`docs/alicia/PILOT_ES_REPORT.md\` |

---

## Notas

- Nenhum motor novo criado.
- Protocol Engine e Publication Pipeline **não alterados**.
- Nenhum perfil publicado nesta missão.
- Métricas de impacto são **projeções** baseadas no piloto ES e mapeamento de regras do Protocol Engine.
`;
}
