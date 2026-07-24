# Sprint 001 — Evidence Coverage 25% → 40%

**Data:** 2026-07-23  
**Status:** Concluída — aguardando revisão  
**Sem commit / sem push**

---

## Resumo executivo

Meta da sprint: elevar cobertura média de evidências do piloto ES de **25%** para **≥ 40%**.

**Resultado:** **63%** — meta superada.

---

## Melhoria escolhida (única)

**Melhorar merge** — sincronização de campos canônicos de cobertura no `EvidenceMerger`.

### Problema identificado

O `EvidenceScoreCalculator` mede cobertura via `SECTION_FIELD_MAP` com nomes canônicos (`primary`, `city`, `state`, `name`, `url`), mas o merger persistia apenas nomes internos (`especialidade`, `cidade`, `estado`, `institutionName`, `urlOrigem`). Os dados **já existiam** nos conectores — o score simplesmente não os encontrava.

### Solução

Após o merge de registros, `syncCoverageCanonicalFields()` espelha os campos internos para os canônicos usados pelo score, preservando proveniência.

**Arquivo alterado:** `src/alicia/evidence-acquisition/evidence-merger.ts`  
**Teste atualizado:** `src/alicia/evidence-acquisition/__tests__/evidence-acquisition.test.ts`

### Alternativas descartadas

| Opção | Motivo |
|-------|--------|
| Adapter CRM | CRM-ES offline sem `ALICIA_CFM_WS_CHAVE`; não desbloqueia dados já coletados |
| Integração CFM | Mesmo bloqueio de credencial; dados mock/CFM já presentes no piloto |
| Enriquecer normalização | Dados de graduação/residência não existem nas fontes atuais |
| Ampliar cobertura hospitalar | Requer novos campos nas fontes; escopo maior que o necessário |

---

## Comparativo antes / depois

| Métrica | Antes | Depois | Ganho |
|---------|------:|-------:|------:|
| **Cobertura média** | 25% | 63% | **+38 pp** |
| Ganho percentual relativo | — | — | **+152%** |
| Candidatos analisados | 6 | 6 | — |
| Categorias completas (de 7) | 1 (Fontes) | 5 | +4 |

### Cobertura por categoria

| Categoria | Antes | Depois |
|-----------|------:|-------:|
| Graduação | 0% | 0% |
| Residência | 0% | 0% |
| RQE | 0% | **100%** |
| Instituições | 0% | **100%** |
| Especialidade | 0% | **100%** |
| Localização | 0% | **100%** |
| Fontes | 100% | 100% |

### Cobertura por seção (engine)

| Seção | Antes | Depois |
|-------|------:|-------:|
| Identity | 100% | 100% |
| Registrations | 100% | 100% |
| Education | 0% | 0% |
| Residency | 0% | 0% |
| Fellowship | 0% | 0% |
| Institutions | 0% | **100%** |
| Specialties | 0% | **100%** |
| PracticeLocations | 0% | **100%** |

### Piloto ES (pipeline completo)

| Indicador | Antes | Depois |
|-----------|------:|-------:|
| Cobertura média (evidence) | 25% | 62.5% |
| AUTO_PUBLISH | 0 | 0 |
| HUMAN_REVIEW | 100% | 100% |

---

## Custo da melhoria

| Item | Valor |
|------|-------|
| Arquivos alterados | 2 |
| Linhas adicionadas | ~30 |
| Novos motores | 0 |
| Alteração de arquitetura | Nenhuma |
| Alteração Protocol Engine | Nenhuma |
| Alteração Publication Pipeline | Nenhuma |
| Credenciais externas | Nenhuma |
| Tempo de implementação | ~1h |

**Custo operacional:** zero — reutiliza dados já coletados pelos conectores existentes (CFM, hospital, universidade, sociedade, site).

---

## Impactos

### Positivos

- Score de cobertura passa a refletir dados reais já presentes nos packages.
- Três seções do engine (Institutions, Specialties, PracticeLocations) desbloqueadas sem nova coleta.
- Relatório `EVIDENCE_COVERAGE_REPORT.md` regenerado com KPIs atualizados.
- Protocol Engine e Publication Pipeline **inalterados** — apenas métrica de cobertura melhorou.

### Neutros / limitações

- Decisões de publicação permanecem 100% HUMAN_REVIEW (cobertura não é critério de auto-publish).
- Categoria RQE a 100% reflete mapeamento editorial (Registrations + Specialties), não número RQE explícito.
- Graduação e Residência continuam em 0% — requerem campos que as fontes atuais não fornecem.

---

## Próximos gargalos

1. **Graduação (0%)** — campos `institution` + `graduationYear` ausentes; requer enriquecimento do conector universidade ou parsing de currículo.
2. **Residência (0%)** — campos `institution` + `program` ausentes; requer dados de programa de residência (hospital/universidade).
3. **RQE explícito** — número RQE não é coletado; categoria editorial está completa por proxy, mas dado real ainda falta.
4. **CRM Estadual offline** — sem `ALICIA_CFM_WS_CHAVE`, conector real não contribui; piloto usa mocks/CFM.
5. **AUTO_PUBLISH** — permanece 0%; próxima sprint provavelmente exige regras de protocolo + dados de formação, não só cobertura.

---

## Quality gates

| Gate | Resultado |
|------|-----------|
| `npm test` | ✅ 837 passed, 7 skipped |
| `npm run test:evidence-coverage` | ✅ 16 passed |
| `npm run test:evidence-acquisition` | ✅ 30 passed |
| `npm run typecheck` | ✅ PASS |
| `npm run lint` | ✅ PASS (warnings pré-existentes) |
| `npm run build` | ✅ PASS |
| `npm run alicia:pilot` | ✅ PASS |

---

## Artefatos regenerados

- `docs/alicia/EVIDENCE_COVERAGE_REPORT.md`
- `docs/alicia/PILOT_ES_REPORT.md`
- `docs/alicia/CATALOG_QUALITY_REPORT.md`
- `docs/alicia/REVIEW_CASE_ANALYSIS.md`

---

## Revisão

Alterações prontas para revisão. Nenhum commit ou push realizado.
