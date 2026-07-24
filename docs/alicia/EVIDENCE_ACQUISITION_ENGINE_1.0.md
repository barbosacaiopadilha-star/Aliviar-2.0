# Evidence Acquisition Engine 1.0

Mecanismo que transforma respostas dos conectores em **Evidence Packages** estruturados para o Protocol Engine.

**Localização:** `src/alicia/evidence-acquisition/`

---

## Objetivo

Receber dados de múltiplos conectores, agrupar por candidato, normalizar, mesclar, eliminar duplicidades, preservar proveniência e gerar um único Evidence Package por candidato.

**Sem IA. Sem inferência. Sem decisão de protocolo. Sem publicação.**

---

## Arquitetura

```
ConnectorManager.runAll()
        ↓
Evidence Collector      → agrupa por candidato (CRM+UF ou nome)
        ↓
Evidence Normalizer     → modelo único fonte-agnóstico
        ↓
Evidence Merger         → deduplica valores, agrupa proveniência
        ↓
Conflict Detector       → registra conflitos (nunca resolve)
        ↓
Evidence Score          → calcula completude por seção
        ↓
Evidence Package Builder → objeto final estruturado
        ↓
Evidence Bus Bridge     → publica eventos no Event Bus
```

### Módulos

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| 1 — Collector | `evidence-collector.ts` | Agrupa registros por candidato |
| 2 — Normalizer | `evidence-normalizer.ts` | Converte para modelo único |
| 3 — Merger | `evidence-merger.ts` | Mescla fontes, deduplica |
| 4 — Provenance | `evidence-provenance.ts` | Metadados de origem |
| 5 — Conflict Detector | `conflict-detector.ts` | Detecta conflitos objetivos |
| 6 — Package Builder | `evidence-package-builder.ts` | Monta Evidence Package |
| 7 — Score | `evidence-score.ts` | Completude por seção |
| 8 — Engine | `evidence-acquisition-engine.ts` | Orquestração |
| 9 — Bridge | `integration/evidence-bus-bridge.ts` | Eventos no Event Bus |

---

## Evidence Package

```typescript
{
  packageId: string;
  candidateId: string;
  identity: { nome, crm, crmUf, telefone };
  registrations: [{ crm, crmUf, provenance }];
  education: [];
  residency: [];
  fellowship: [];
  institutions: [{ name, url, provenance }];
  specialties: [{ primary, provenance }];
  practiceLocations: [{ city, state, provenance }];
  evidence: EvidenceItem[];
  conflicts: EvidenceConflict[];
  coverage: CoverageScore[];
  metadata: { version, sourceCount, connectorIds, ... };
}
```

---

## Proveniência

Cada evidência preserva:

| Campo | Descrição |
|-------|-----------|
| `connectorId` | ID do conector |
| `connectorVersion` | Versão do conector |
| `sourceName` | Nome legível da fonte |
| `sourceUrl` | URL de origem |
| `fetchTimestamp` | Momento da coleta |
| `rawHash` | SHA-256 do registro bruto normalizado |
| `normalizationVersion` | Versão do normalizador (`1.0.0`) |
| `confidenceDaFonte` | Confiança reportada pelo conector |

---

## Merge

Quando duas fontes fornecem o **mesmo valor** para um campo:

- Não duplica o valor
- Agrupa proveniência de ambas as fontes

Quando fornecem **valores diferentes**:

- Mantém ambos os valores
- Conflict Detector registra o conflito

---

## Conflitos

Tipos detectados (nunca resolvidos):

| Tipo | Campo |
|------|-------|
| `crm_mismatch` | CRM |
| `rqe_mismatch` | RQE |
| `specialty_mismatch` | Especialidade |
| `institution_mismatch` | Instituição |
| `name_mismatch` | Nome |
| `city_mismatch` | Cidade |

Comparação usa normalização (acentos, case, aliases de especialidade).

---

## Cobertura (Score)

Indica **completude de dados**, nunca ranking ou elegibilidade:

| Seção | Campos avaliados |
|-------|------------------|
| Identity | nome, crm |
| Registrations | crm, crmUf |
| Education | institution, graduationYear |
| Residency | institution, program |
| Fellowship | institution, program |
| Institutions | name, url |
| Specialties | primary |
| PracticeLocations | city, state |

---

## Eventos

Publicados via `EvidenceBusBridge`:

| Evento | Quando |
|--------|--------|
| `EvidencePackageCreated` | Primeiro package de um candidato |
| `EvidencePackageUpdated` | Re-aquisição com nova versão |
| `EvidenceConflictDetected` | Cada conflito detectado |
| `EvidencePackageRejected` | Candidato com dados insuficientes |

---

## Integração com Conectores

```typescript
import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { EvidenceAcquisitionEngine } from "@/alicia/evidence-acquisition";

const manager = new ConnectorManager();
for (const c of defaultConnectors) manager.register(c);
const run = await manager.runAll();

const engine = new EvidenceAcquisitionEngine();
const result = engine.acquire(
  run.results.map((r) => ({
    connectorId: r.connectorId,
    connectorVersion: "1.0.0",
    connectorName: r.connectorId,
    success: r.success,
    records: r.records,
    fetchedAt: run.completedAt,
  })),
);
```

---

## Integração com Protocol Engine

O Evidence Package é a **entrada estruturada** para o Protocol Engine. A conversão para `DoctorCandidate` + `Evidence[]` do protocolo ocorre em uma camada de integração futura — este engine **não executa** regras de protocolo.

---

## Studio — Evidence Explorer

Rota: `/alicia/studio/evidence`

Somente leitura. Exibe:

- Evidence Packages gerados
- Fontes e proveniência
- Conflitos detectados
- Cobertura por seção
- Histórico de aquisições

---

## Testes

```bash
npm run test:evidence-acquisition
```

Cobertura mínima: 95% linhas/funções/statements, 80% branches.

---

## Restrições respeitadas

- Nenhuma alteração ao Discovery Engine, Connector Framework, Event Bus (comportamento), Workflow Engine, Protocol Engine, Publication Pipeline
- Nenhuma IA ou inferência
- Nenhuma decisão de protocolo
- Nenhuma publicação
- Nenhum banco novo
- Studio: apenas tela aditiva (Evidence Explorer)
