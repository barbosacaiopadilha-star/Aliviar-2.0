# Piloto ES — Relatório Operacional

**Gerado em:** 2026-07-24T03:57:08.792Z  
**Escopo:** ES — Ortopedia, Neurocirurgia

---

## Resumo executivo operacional

| Métrica | Valor |
|---------|------:|
| Candidatos encontrados (bruto) | 10 |
| Candidatos únicos | 6 |
| Duplicados | 3 |
| Ignorados (escopo/confiança) | 0 |
| Rejeitados (Protocol) | 0 |
| Review Cases (HUMAN_REVIEW) | 6 |
| AUTO_PUBLISH | 0 |
| Publicados | 0 |
| Verificações concluídas | 0 |

---

## Fase 1 — Discovery

| Indicador | Valor |
|-----------|------:|
| Prontos para evidência (≥0.8) | 4 |
| Descobertos (0.5–0.79) | 2 |
| Falhas de fonte | 0 |
| Duração | 2ms |

### Por especialidade

- **Ortopedia:** 4
- **Neurocirurgia:** 2

### Por cidade

- **Vitória:** 2
- **Serra:** 1
- **Cariácica:** 1
- **Vila Velha:** 1
- **Linhares:** 1

### Saúde das fontes de discovery

- cfm: ONLINE
- crm-estadual: ONLINE
- hospital: DEGRADED
- universidade: ONLINE
- sociedade-medica: ONLINE
- site-institucional: UNKNOWN

---

## Fase 2 — Evidence Acquisition

| Indicador | Valor |
|-----------|------:|
| Packages criados | 9 |
| Packages rejeitados | 0 |
| Conflitos totais | 6 |
| Cobertura média | 100.0% |
| Duração | 1540ms |

---

## Fase 3 — Protocol Engine

| Decisão | Quantidade |
|---------|----------:|
| AUTO_PUBLISH | 0 |
| HUMAN_REVIEW | 6 |
| REJECT | 0 |
| Duração | 5ms |

---

## Fase 4 — Publication Pipeline

| Resultado | Quantidade |
|-----------|----------:|
| Tentativas | 0 |
| Publicados | 0 |
| Review cases | 0 |
| Falhas | 0 |
| Sem alteração | 0 |
| Duração | 0ms |

---

## Fase 5 — Verification

| Indicador | Valor |
|-----------|------:|
| Tentativas | 0 |
| Concluídas | 0 |
| Falhas | 0 |
| Pendentes de revisão | 0 |
| Duração | 0ms |

---

## Connector Health

| Conector | Status |
|----------|--------|
| crm-estadual | OFFLINE |
| cfm | ONLINE |
| hospital | ONLINE |
| universidade | DEGRADED |
| sociedade-medica | ONLINE |
| site-institucional | ONLINE |
| academic-graduation | ONLINE |
| academic-residency | ONLINE |
| academic-fellowship | ONLINE |

- Sucesso: 8 / 9
- Latência média: 169ms

---

## Factory Run (orquestração automatizada)

| Campo | Valor |
|-------|-------|
| Run ID | factory-run-1784865430341-pwvdgt |
| Status | COMPLETED |
| Duração | 19ms |
| Publicados | 0 |
| Review cases | 11 |
| Erros | 0 |
| Duração total factory | 20ms |

---

## Tempo médio por etapa

| Etapa | Duração |
|-------|--------:|
| Discovery | 2ms |
| Evidence | 1540ms |
| Protocol | 5ms |
| Publication | 0ms |
| Verification | 0ms |
| Factory (end-to-end) | 20ms |

---

## Catálogo curado (referência)

O seed manual contém **34** perfis (17 Ortopedia, 17 Neurocirurgia), com 14 perfis completos.

---

## Candidatos processados

| Nome | Especialidade | Cidade | Confiança | Protocol | Publicado | Verificado |
|------|---------------|--------|----------:|----------|-----------|------------|
| Dr. Ricardo Almeida | Ortopedia | Vitória | 0.92 | HUMAN_REVIEW | Não | Não |
| Dra. Fernanda Lopes | Neurocirurgia | Serra | 0.90 | HUMAN_REVIEW | Não | Não |
| Dr. Paulo Mendes | Ortopedia | Cariácica | 0.86 | HUMAN_REVIEW | Não | Não |
| Dra. Camila Rocha | Ortopedia | Vila Velha | 0.84 | HUMAN_REVIEW | Não | Não |
| Dr. Gustavo Neri | Neurocirurgia | Vitória | 0.79 | HUMAN_REVIEW | Não | Não |
| Dra. Helena Duarte | Ortopedia | Linhares | 0.77 | HUMAN_REVIEW | Não | Não |

