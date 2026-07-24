# AliCIA — Protocol Engine 1.0

**Versão:** 1.0  
**Data:** 23 de julho de 2026  
**Epic:** 13 — Protocol Engine  
**Status:** Implementado — aguardando revisão  
**Protocolo aplicado:** AliCIA 1.0 (congelado — não alterado)

---

## Resumo executivo

O **Protocol Engine** transforma o Protocolo AliCIA 1.0 em código executável e determinístico. Nenhum operador decide mais se um médico entra no catálogo — o engine responde exclusivamente:

| Decisão | Significado |
|---------|-------------|
| `AUTO_PUBLISH` | Todas as regras obrigatórias satisfeitas para publicação em Nível B |
| `HUMAN_REVIEW` | Exceção, pendência ou Nível A (quatro olhos) — operador resolve |
| `REJECT` | Fora do escopo ou inelegível — não entra no pipeline |

**Sem IA. Sem inferência. Sem heurística. Somente regras explícitas.**

---

## Arquitetura

```
src/alicia/protocol-engine/
├── types.ts                 # Tipos canônicos (Evidence, DoctorCandidate, etc.)
├── constants.ts             # Versão do protocolo, escopo ES, especialidades
├── source-levels.ts         # Classificação determinística de fontes (níveis 1–7)
├── rules/
│   └── index.ts             # 20 regras executáveis (ELIG, FORM, PUB)
├── evidence-evaluator.ts    # Evidence[] → EvidenceReport
├── eligibility-engine.ts    # DoctorCandidate + EvidenceReport → Eligible/Not/Review
├── publication-decision.ts  # Decisão final AUTO_PUBLISH | HUMAN_REVIEW | REJECT
├── audit-trail.ts           # Trilha append-only de decisões
├── protocol-engine.ts       # Orquestrador principal
├── studio-adapter.ts        # Integração com Studio
└── index.ts                 # API pública
```

### Fluxo de decisão

```
Evidence[] + DoctorCandidate
        ↓
  Evidence Evaluator → EvidenceReport (confirmado/pendente/conflitante/insuficiente)
        ↓
  Rule Engine (20 regras) → satisfied | failed | pending
        ↓
  Eligibility Engine → eligible | not_eligible | review_required + Nível A/B/C
        ↓
  Publication Decision → AUTO_PUBLISH | HUMAN_REVIEW | REJECT
        ↓
  Audit Trail (append-only)
```

---

## Módulo 1 — Rule Engine

### Regras de elegibilidade (13)

| ID | Regra | Protocolo | Resultado se falha |
|----|-------|-----------|-------------------|
| ELIG-001 | Nome completo coletado | Cap. 12 — A1 | failed |
| ELIG-002 | CRM documentado | Cap. 3 — 3.1 | pending → HUMAN_REVIEW |
| ELIG-003 | CRM ativo | Cap. 3 — 3.1 | failed (suspenso/cancelado) |
| ELIG-004 | Especialidade no escopo | Cap. 2 | failed → REJECT |
| ELIG-005 | Atuação no ES | Cap. 3 — 3.3 | failed |
| ELIG-006 | RQE/TEOT ortopedia | Cap. 3 — 3.2 | failed |
| ELIG-007 | RQE/título neuro | Cap. 3 — 3.2 | pending |
| ELIG-008 | Fonte nível 1–3 | Cap. 12 — A7 | failed |
| ELIG-009 | Documentação mínima | Cap. 3 — 3.4 | pending/failed |
| ELIG-010 | Trajetória verificável | Cap. 3 — 3.5 | pending |
| ELIG-011 | Fontes utilizáveis | Cap. 7 — 7.3 | failed → REJECT |
| ELIG-012 | Sem conflito de identidade | Cap. 7 — 7.3 | pending |
| ELIG-013 | Sem duplicidade de CRM | Cap. 8 — 8.1 | failed → REJECT |

### Regras de formação (4)

| ID | Regra | Protocolo |
|----|-------|-----------|
| FORM-001 | Graduação confirmada (Nível A) | Cap. 7 — 7.1 |
| FORM-002 | Residência confirmada (Nível A) | Cap. 7 — 7.1 |
| FORM-003 | Atuação atual confirmada | Cap. 7 — 7.1 |
| FORM-004 | Especialidade confirmada | Cap. 7 — 7.1 |

### Regras de publicação (3)

| ID | Regra | Protocolo |
|----|-------|-----------|
| PUB-001 | Mínimo 2 fontes | Cap. 12 — D4 |
| PUB-002 | Sem conflitos críticos | Cap. 6 — 6.3 |
| PUB-003 | Nível A exige quatro olhos | Cap. 12 — F3 |

**Total: 20 regras executáveis.**

---

## Módulo 2 — Evidence Evaluator

**Entrada:** `Evidence[]`  
**Saída:** `EvidenceReport`

### Classificação por campo

| Status | Significado |
|--------|-------------|
| `confirmed` | Fonte nível 1–3 confirma o campo |
| `pending` | Campo parcialmente suportado — aguarda confirmação |
| `conflicting` | Fontes divergentes em campo crítico |
| `insufficient` | Nenhuma fonte utilizável para o campo |

### Classificação de fontes (determinística)

| Nível | Detecção |
|-------|----------|
| 1 | Padrão CRM/RQE no nome, ou tipo "Registro profissional" |
| 2 | Tipo "Instituição", ou nome contém hospital/instituto |
| 3 | Tipo "Sociedade médica", TEOT, SBOT/SBN no nome |
| 4 | Tipo "Registro público", CNES no nome |
| 5 | Lattes, site médico/oficial no nome |
| 6 | Doctoralia, CliniGuia, tipo "Diretório" |
| 7 | Demais fontes |

---

## Módulo 3 — Eligibility Engine

**Entrada:** `DoctorCandidate` + `EvidenceReport`  
**Saída:** `EligibilityResult`

| Outcome | Condição |
|---------|----------|
| `eligible` | Todas as regras de elegibilidade satisfeitas |
| `not_eligible` | Falha em regra de rejeição (escopo, CRM irregular, fontes 6–7) |
| `review_required` | Pendências que exigem operador (CRM ausente, conflito, etc.) |

**Nível operacional sugerido:** A (formação completa) · B (parcial) · C (não publicável)

---

## Módulo 4 — Publication Decision

| Cenário | Decisão |
|---------|---------|
| CRM ausente | `HUMAN_REVIEW` |
| Residência ausente | `HUMAN_REVIEW` |
| Tudo confirmado (Nível B) | `AUTO_PUBLISH` |
| Tudo confirmado (Nível A) | `HUMAN_REVIEW` (quatro olhos — F3) |
| Especialidade fora do protocolo | `REJECT` |
| Conflitos entre fontes | `HUMAN_REVIEW` |
| Apenas fontes nível 6–7 | `REJECT` |
| CRM cancelado/suspenso | `REJECT` |

Cada decisão inclui:
- `satisfiedRules[]` — regras satisfeitas
- `pendingRules[]` — regras pendentes
- `failedRules[]` — regras violadas
- `justification` — texto derivado das regras

---

## Módulo 5 — Audit Trail

Trilha **append-only** — nunca apaga histórico.

Cada entrada registra:
- `at` — timestamp ISO
- `protocolVersion` — "1.0"
- `candidateId` / `caseId`
- `decision` — AUTO_PUBLISH | HUMAN_REVIEW | REJECT
- `rulesExecuted[]` — todas as regras com status
- `evidenceIds[]` — fontes utilizadas na decisão

```typescript
import { ProtocolEngine, AuditTrail } from "@/alicia/protocol-engine";

const trail = new AuditTrail();
const engine = new ProtocolEngine({ auditTrail: trail });
engine.evaluate(candidate, evidence);
// trail.list() — histórico imutável
```

---

## Módulo 6 — Testes

| Arquivo | Cenários |
|---------|----------|
| `source-levels.test.ts` | Classificação CRM, RQE, TEOT, instituição, diretório |
| `evidence-evaluator.test.ts` | CRM confirmado, graduação pendente, fontes baixa confiança |
| `eligibility-engine.test.ts` | Elegível, fora de escopo, CRM ausente, CRM cancelado |
| `protocol-engine.test.ts` | Todos os cenários de publicação + audit trail |
| `studio-adapter.test.ts` | Mapeamento Studio → Engine |
| `rules-coverage.test.ts` | Ortopedia sem RQE, neuro sem RQE, PUB-001 |

### Cobertura

| Métrica | Valor |
|---------|-------|
| Statements | **96,0%** |
| Branches | **91,3%** |
| Functions | **93,7%** |
| Lines | **96,0%** |
| Testes | **38** passando |

Meta de 95% atingida (excluindo `types.ts` — apenas definições de tipo).

### Quality gates

| Gate | Status |
|------|--------|
| `vitest run` (protocol-engine) | ✅ 38/38 |
| `tsc --noEmit` | ✅ |
| `eslint` | ✅ 0 erros |
| `next build` | ✅ |

---

## Módulo 7 — Integração Studio

O Studio **não decide mais**. Apenas recebe **Review Cases**.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/alicia/studio/protocol-bridge.ts` | Ponte Studio → Protocol Engine |
| `src/components/alicia/studio/StudioProvider.tsx` | Expõe `reviewCases` e `getProtocolEvaluation` |
| `src/components/alicia/studio/CandidateDetail.tsx` | Remove seletor manual de Nível; exibe decisão do engine |
| `src/components/alicia/studio/InboxBoard.tsx` | Seção "Review Cases" para exceções |

### Comportamento

```typescript
import { evaluateCandidateProtocol, getStudioReviewCases } from "@/alicia/studio/protocol-bridge";

// Avalia um candidato
const evaluation = evaluateCandidateProtocol(studioCandidate);
// evaluation.decision.outcome → AUTO_PUBLISH | HUMAN_REVIEW | REJECT
// evaluation.suggestedNivel → A | B | undefined

// Lista apenas exceções (não AUTO_PUBLISH)
const reviewCases = getStudioReviewCases(candidates);
```

O operador:
- **Não atribui Nível manualmente**
- **Resolve Review Cases** (pendências, conflitos, quatro olhos)
- **Confirma publicação** após o engine autorizar

---

## Limitações conhecidas

| Limitação | Impacto | Mitigação futura |
|-----------|---------|------------------|
| Classificação de fonte por tipo/nome | Fontes com tipo genérico podem ser nível 7 | Evidence Engine com metadados explícitos de nível |
| CRM status inferido como `active` quando presente | Não valida situação real do conselho | Integração CRM-ES API |
| Checklist editorial (Cap. 12 E) não automatizado | Revisão de linguagem continua humana | Regras de texto em versão futura |
| Conflitos entre fontes detectados por campo | Não compara valores entre fontes automaticamente | Evidence Engine com extração estruturada |
| `globalAuditTrail` em memória | Não persiste entre reinícios | Persistência em banco na integração |
| Homônimos | Flag manual `hasIdentityConflict` | Deduplicação automática por CRM+nome |

---

## Integração futura com Evidence Engine

O Protocol Engine consome `Evidence[]` com nível e campos suportados **já classificados**. A integração futura com **Evidence Engine** (Epic planejada) substituirá:

| Hoje (Protocol Engine 1.0) | Futuro (Evidence Engine) |
|----------------------------|--------------------------|
| `classifySourceLevel()` por padrão de nome/tipo | Extração estruturada de fontes (CRM API, Lattes parseado, HTML institucional) |
| `supportsFields` inferidos | Campos explicitamente extraídos por fonte |
| Conflitos detectados por flag | Comparação automática de valores entre fontes |
| `hasIdentityConflict` manual | Deduplicação CRM + fuzzy name match |

**Contrato de integração:**

```typescript
// Evidence Engine produzirá:
type EvidencePackage = {
  evidence: Evidence[];          // com level e supportsFields explícitos
  conflicts: SourceConflict[];   // pré-detectados
  extractedFields: Record<EvidenceField, string | null>;
};

// Protocol Engine consumirá:
engine.evaluate(candidate, evidencePackage.evidence);
```

O Protocol Engine **não muda** — apenas recebe evidências melhor classificadas.

---

## API pública

```typescript
import {
  evaluateCandidate,
  evaluateEvidence,
  evaluateEligibility,
  decidePublication,
  ProtocolEngine,
  AuditTrail,
  evaluateStudioCandidate,
  collectReviewCases,
  PROTOCOL_VERSION,
} from "@/alicia/protocol-engine";
```

---

## Veredito

| Item | Status |
|------|--------|
| Rule Engine (20 regras) | ✅ |
| Evidence Evaluator | ✅ |
| Eligibility Engine | ✅ |
| Publication Decision | ✅ |
| Audit Trail (append-only) | ✅ |
| Testes (95%+ cobertura) | ✅ 96% |
| Integração Studio | ✅ |
| Protocolo alterado | ❌ Não |
| UX pública alterada | ❌ Não |
| Commit / push | ❌ Não (aguardando revisão) |

---

*Epic 13 — Protocol Engine 1.0. Aguardando revisão do Principal Software Architect.*
