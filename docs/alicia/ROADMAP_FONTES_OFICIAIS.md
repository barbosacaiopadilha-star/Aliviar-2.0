# Roadmap — Fontes Oficiais AliCIA

**Gerado em:** 2026-07-24T03:57:21.336Z  
**Escopo piloto:** ES — Ortopedia, Neurocirurgia  
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

**Graduação Médica — MEC / e-MEC** (+22 pp estimados)

Categorias: Graduação.

_Empate técnico com Residência CNRM (+22 pp); Graduação MEC é a primeira alavanca acadêmica._

### Qual reduz mais HUMAN_REVIEW?

**Residência Médica — CNRM / COREME** (100% dos candidatos)

Regras impactadas: FORM-002, ELIG-010.

_FORM-002 (residência confirmada) é regra bloqueante no Protocol Engine._

### Qual melhora mais AUTO_PUBLISH?

**Residência Médica — CNRM / COREME** (67% dos candidatos com caminho Nível B)

Combinado com CRM Estadual oficial, desbloqueia o caminho documentado em `protocol-engine.test.ts` para AUTO_PUBLISH Nível B.

### Qual deve ser integrada primeiro?

**CRM Estadual ES — WebService CFM**

Adapter real implementado; requer ALICIA_CFM_WS_CHAVE. OFFLINE no último piloto.

---

## Plano de homologação por fonte

| Nome | Tipo | Responsável | Status | Mock | Homologação | Staging | Produção | Última sincronização | Cobertura obtida | Confiabilidade | Latência |
|------|------|-------------|--------|:----:|:-----------:|:-------:|:--------:|---------------------|-----------------:|---------------:|---------:|
| CRM Estadual ES — WebService CFM | registro-profissional | Integrações / Ops | homologacao | — | ✅ | — | — | — | 0% | 92% | — |
| CFM — Conselho Federal de Medicina | registro-profissional | Integrações | mock | ✅ | — | — | — | 2026-07-23 04:25:30 UTC | 11% | 90% | 45ms |
| Graduação Médica — MEC / e-MEC | academico | Dados Acadêmicos | mock | ✅ | — | — | — | 2026-07-23 04:25:37 UTC | 22% | 88% | 120ms |
| Residência Médica — CNRM / COREME | academico | Dados Acadêmicos | mock | ✅ | — | — | — | 2026-07-23 04:25:37 UTC | 22% | 87% | 130ms |
| Fellowship — Programas Avançados | academico | Dados Acadêmicos | mock | ✅ | — | — | — | 2026-07-23 04:25:37 UTC | 11% | 82% | 110ms |
| Hospital — Corpo Clínico (ICOT / Meridional) | institucional | Parcerias Clínicas | mock | ✅ | — | — | — | 2026-07-23 04:25:30 UTC | 6% | 84% | 180ms |
| Universidade — Corpo Docente (EMESCAM / UFES) | academico | Parcerias Acadêmicas | mock | ✅ | — | — | — | 2026-07-23 04:25:30 UTC | 5% | 79% | 200ms |
| Sociedade Médica — SBOT / Associações | sociedade | Parcerias Profissionais | mock | ✅ | — | — | — | 2026-07-23 04:25:30 UTC | 5% | 82% | 95ms |
| Site Institucional — Clínicas e Consultórios | institucional | Crawler / Ops | mock | ✅ | — | — | — | 2026-07-23 04:25:30 UTC | 5% | 75% | 250ms |

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
2. **Bridge Protocol ↔ Evidence** — cobertura de evidências ≠ decisão de publicação; AUTO_PUBLISH exige `candidate.graduation/residency.verified` (fora do escopo desta missão).
3. **APIs acadêmicas fragmentadas** — MEC, CNRM e hospitais não têm API unificada; crawler pode ser necessário.
4. **Candidatos fora do escopo** — 3 packages (Lucas, André, Helena Martins) dependem de universidade/CFM oficial.

---

## Artefatos

| Artefato | Localização |
|----------|-------------|
| OfficialSourceRegistry | `src/alicia/connectors/official-sources/` |
| Conectores existentes | `src/alicia/connectors/adapters/` |
| Relatório cobertura | `docs/alicia/EVIDENCE_COVERAGE_REPORT.md` |
| Piloto ES | `docs/alicia/PILOT_ES_REPORT.md` |

---

## Notas

- Nenhum motor novo criado.
- Protocol Engine e Publication Pipeline **não alterados**.
- Nenhum perfil publicado nesta missão.
- Métricas de impacto são **projeções** baseadas no piloto ES e mapeamento de regras do Protocol Engine.

