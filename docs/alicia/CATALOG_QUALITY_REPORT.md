# Relatório de Qualidade do Catálogo — Piloto ES

**Gerado em:** 2026-07-24T03:57:08.792Z  
**Especialidades:** Ortopedia, Neurocirurgia

---

## Cobertura editorial (pipeline automatizado)

| Indicador | Valor |
|-----------|------:|
| Candidatos únicos | 6 |
| Cobertura média de evidência | 100.0% |
| Conflitos detectados | 6 |
| AUTO_PUBLISH | 0 |
| HUMAN_REVIEW | 6 |
| REJECT | 0 |

---

## Evidências mais frequentes

Com base nos campos de cobertura e packages gerados:

- **Identity:** score acumulado 600
- **Registrations:** score acumulado 600
- **Education:** score acumulado 600
- **Residency:** score acumulado 600
- **Fellowship:** score acumulado 600
- **Institutions:** score acumulado 600

Tipos de evidência por candidato (média 40.5 fontes/candidato):

- Registro profissional (CRM)
- Fonte institucional (URL de origem)
- Instituição / especialidade / cidade

---

## Conectores com mais conflitos

- **Residência Médica — CNRM/Hospitais (Mock):** 6 conflito(s)
- **Graduação Médica — MEC/Universidades (Mock):** 6 conflito(s)
- **Fellowship — Programas Avançados (Mock):** 6 conflito(s)
- **CFM — Conselho Federal de Medicina:** 2 conflito(s)
- **Hospital — Corpo Clínico:** 1 conflito(s)

### Tipos de conflito

- **institution_mismatch:** 6

---

## Regras que mais levam a HUMAN_REVIEW

- FORM-001 — Graduação confirmada (Nível A): 6
- FORM-002 — Residência confirmada (Nível A): 6
- ELIG-007 — RQE ou título (neurocirurgia): 2

---

## Campos que costumam faltar

- **crm_status:** 6 ocorrência(s)
- **rqe:** 6 ocorrência(s)
- **teot:** 6 ocorrência(s)
- **graduation:** 6 ocorrência(s)
- **residency:** 6 ocorrência(s)
- **practice_areas:** 6 ocorrência(s)

---

## Catálogo curado (seed manual)

| Métrica | Valor |
|---------|------:|
| Total de médicos | 34 |
| Ortopedia | 17 |
| Neurocirurgia | 17 |
| Perfis completos | 14 |
| Média de fontes/médico | 5.0 |
| Cidades cobertas | 10 |

### Cidades prioritárias sem médicos

- Viana

---

## Qualidade vs quantidade

O piloto prioriza **confiança** sobre volume:

- Duplicatas são consolidadas antes do Protocol
- Candidatos fora de ES/Ortopedia/Neurocirurgia são descartados
- Apenas AUTO_PUBLISH entra na Publication Pipeline
- O seed curado (34 perfis) representa a barra editorial desejada; o pipeline automatizado ainda produz majoritariamente HUMAN_REVIEW

