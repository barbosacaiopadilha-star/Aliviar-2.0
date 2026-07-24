# Discovery Engine 1.0 — AliCIA

Primeiro motor de descoberta contínua de candidatos elegíveis para o pipeline AliCIA.

**Versão:** 1.0  
**Localização:** `src/alicia/discovery/`

---

## Princípio central

O Discovery Engine **encontra** candidatos. Ele **não**:

- publica perfis;
- coleta evidências;
- decide elegibilidade (Protocol Engine);
- consulta APIs reais nesta epic.

```
Internet (mock)
      ↓
Discovery Engine
      ↓
Discovery Queue
      ↓
Evidence Engine (integração futura)
```

---

## Arquitetura

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Engine | `discovery-engine.ts` | Orquestra fontes, normalização, dedup e fila |
| Fontes | `sources/mock-sources.ts` | Conectores simulados |
| Normalização | `normalizer.ts` | Padroniza nomes, CRM, UF, especialidades, cidades, URLs |
| Identidade | `identity-hash.ts` | Hash determinístico por nome + CRM + UF + especialidade |
| Deduplicação | `deduplicator.ts` | Unifica candidatos repetidos entre fontes |
| Fila | `discovery-queue.ts` | Estados para consumo futuro pelo Evidence Engine |
| Métricas | `metrics.ts` | Contadores operacionais |
| Auditoria | `audit.ts` | Eventos append-only por fonte |
| Studio | `studio-adapter.ts` | Snapshot read-only para Discovery Inbox |

---

## Interface `DiscoverySource`

```typescript
interface DiscoverySource {
  id: string;
  name: string;
  priority: number;
  discover(): DiscoverySourceResult;
  health(): SourceHealthStatus;
}
```

### Fontes mock (Epic 15)

| ID | Nome | Health mock |
|----|------|-------------|
| `cfm` | CFM | ONLINE |
| `crm-estadual` | CRM Estadual | ONLINE |
| `hospital` | Hospital | DEGRADED |
| `universidade` | Universidade | ONLINE |
| `sociedade-medica` | Sociedade Médica | ONLINE |
| `site-institucional` | Site Institucional | UNKNOWN |

---

## Modelo `DiscoveryCandidate`

Campos mínimos:

- `candidateId`, `nome`, `crm`, `crmUf`
- `especialidade`, `cidade`, `estado`
- `fonteOrigem`, `fontesEncontradas[]`
- `urlOrigem`, `dataDescoberta`
- `confidence`, `hashIdentidade`, `status`

### Status do candidato

`DISCOVERED` → `NORMALIZED` → `QUEUED` / `DUPLICATE` / `IGNORED`

---

## Discovery Queue

Estados da fila:

| Estado | Significado |
|--------|-------------|
| `DISCOVERED` | Normalizado e enfileirado |
| `READY_FOR_EVIDENCE` | Confiança ≥ 0.8 — pronto para Evidence Engine |
| `DUPLICATE` | Registro repetido de outra fonte |
| `IGNORED` | Fora de escopo ou baixa confiança |

---

## Normalização

- Remove espaços extras e acentos para comparação
- Padroniza prefixos `Dr.` / `Dra.`
- CRM numérico com formato `XX.XXX`
- Especialidades no escopo: Ortopedia, Neurocirurgia
- Cidades via `canonicalizeCityName` (ES)
- URLs apenas `http`/`https`
- Telefones formatados quando presentes

---

## Identidade e deduplicação

`IdentityHash = sha256(nome + crm + crmUf + especialidade)` (normalizados)

Quando duas fontes retornam o mesmo médico:

- mantém **um** candidato único;
- agrega todas as fontes em `fontesEncontradas`;
- registra entradas `DUPLICATE` na fila para auditoria.

---

## Health

Cada fonte implementa `health()`:

`ONLINE` | `DEGRADED` | `OFFLINE` | `UNKNOWN`

Fontes `OFFLINE` são ignoradas na execução e registradas como falha.

---

## Métricas (`DiscoveryMetrics`)

- candidatos encontrados
- duplicados
- ignorados
- enfileirados / prontos para evidence
- fontes executadas
- falhas
- tempo médio por execução

---

## Auditoria

Eventos append-only por fonte:

- horário
- quantidade encontrada / normalizada
- duplicados
- falhas
- duração

Histórico nunca é apagado.

---

## Studio — Discovery Inbox

**Rota:** `/alicia/studio/discovery`

Tela somente leitura exibindo:

- novos candidatos
- fonte(s)
- status
- duplicidade
- prontos para Evidence

Sem ações manuais. Sem bypass.

---

## API pública

```typescript
import {
  DiscoveryEngine,
  runDiscovery,
  getDiscoveryInboxSnapshot,
  buildIdentityHash,
  deduplicateCandidates,
  defaultDiscoverySources,
} from "@/alicia/discovery";
```

---

## Testes

```bash
npm run test:discovery-engine
npx vitest run src/alicia/discovery
```

Cenários cobertos: descoberta simples, múltiplas fontes, deduplicação, hash, normalização, fila, health, falha de fonte, métricas, auditoria, Studio snapshot.

---

## Integração futura

1. **Evidence Engine** — consumir `READY_FOR_EVIDENCE` da fila
2. **Protocol Engine** — após coleta de evidências (sem alteração nesta epic)
3. **Publication Pipeline** — após `AUTO_PUBLISH` (sem alteração nesta epic)
4. **APIs reais** — substituir mocks em `sources/` mantendo `DiscoverySource`
5. **Persistência** — adapter Supabase/Postgres para fila e auditoria

---

## Limitações (MVP)

- Todas as fontes são mockadas
- Fila e métricas em memória (sessão)
- Escopo geográfico: ES
- Escopo clínico: Ortopedia e Neurocirurgia
- Sem integração com banco externo
