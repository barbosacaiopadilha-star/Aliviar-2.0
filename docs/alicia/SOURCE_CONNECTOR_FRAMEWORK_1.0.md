# Source Connector Framework 1.0 — AliCIA

Padroniza como qualquer fonte externa será integrada ao ecossistema AliCIA, sem consumir APIs reais nesta versão.

**Versão:** 1.0  
**Localização:** `src/alicia/connectors/`

---

## Princípio central

Toda fonte externa passa por um **contrato único** (`SourceConnector`). O restante do sistema nunca depende do formato bruto da fonte — apenas do modelo normalizado e validado.

```
Fonte Externa (mock)
       │
       ▼
SourceConnector.fetch()
       │
       ▼
normalize() → NormalizerPipeline
       │
       ▼
validate() → Validation Layer
       │
       ▼
NormalizedConnectorRecord (modelo comum)
```

---

## Arquitetura

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Contrato | `ports/source-connector.ts` | Interface `SourceConnector` |
| Registry | `connector-registry.ts` | Registro dinâmico de conectores |
| Manager | `connector-manager.ts` | Execução, enable/disable, retries, status |
| Health Monitor | `health-monitor.ts` | Estados e disponibilidade |
| Rate Limiter | `rate-limiter.ts` | Limites e backoff exponencial |
| Normalizer | `normalizer-pipeline.ts` | Conversão para modelo comum |
| Validation | `validation-layer.ts` | Schema, campos, tipos, consistência |
| Events | `connector-event-emitter.ts` | Eventos do ciclo de vida |
| Metrics | `connector-metrics.ts` | Execuções, latência, throughput |
| Mocks | `mocks/` | 6 conectores simulados |
| Studio | `studio-adapter.ts` | Snapshot read-only para monitor |

---

## Contrato SourceConnector

```typescript
interface SourceConnector {
  id: string;
  name: string;
  version: string;
  priority: number;

  supports(): boolean;
  health(): ConnectorHealthStatus;
  authenticate(): Promise<ConnectorAuthResult>;
  fetch(): Promise<ConnectorFetchResult>;
  normalize(raw): NormalizedConnectorRecord[];
  validate(record): ValidationResult;
  rateLimit(): RateLimitConfig;
}
```

Nenhuma implementação real nesta Epic — apenas mocks que implementam o contrato.

---

## Ciclo de vida

1. **Registro** — `ConnectorRegistry.register()` ou `ConnectorManager.register()`
2. **Habilitação** — conector entra no pool de execução
3. **Execução** — `ConnectorManager.runConnector()` ou `runAll()`
4. **Autenticação** — `authenticate()` (mock retorna token)
5. **Fetch** — `fetch()` retorna dados brutos mockados
6. **Normalização** — `NormalizerPipeline` converte para modelo comum
7. **Validação** — registros inválidos são descartados (nunca seguem adiante)
8. **Métricas + Health** — atualização de latência, disponibilidade e status
9. **Eventos** — publicação de `ConnectorStarted`, `ConnectorSucceeded`, etc.

Em falha transitória: retry com backoff exponencial até `maxRetries`, depois `ConnectorFailed` e entrada na fila de retries.

---

## Eventos

| Evento | Quando |
|--------|--------|
| `ConnectorStarted` | Início de execução |
| `ConnectorSucceeded` | Fetch + normalização + validação OK |
| `ConnectorFailed` | Falha após esgotar retries |
| `ConnectorRetried` | Nova tentativa agendada |
| `ConnectorDisabled` | Conector desabilitado |
| `ConnectorRecovered` | Saúde restaurada (OFFLINE/DEGRADED → ONLINE) |

---

## Health Monitor

Estados: `ONLINE`, `DEGRADED`, `OFFLINE`, `MAINTENANCE`, `UNKNOWN`

Registra por conector:
- última execução
- tempo médio de latência
- taxa de falhas
- disponibilidade (sucessos / total)

Transições automáticas:
- failure rate ≥ 20% → `DEGRADED`
- failure rate ≥ 50% → `OFFLINE`
- sucesso após OFFLINE/DEGRADED → `ConnectorRecovered`

---

## Rate Limiter

- Limite por minuto (`perMinute`)
- Limite por hora (`perHour`)
- Backoff exponencial: `base * 2^(attempt-1)`, limitado por `backoffMaxMs`
- Retries configuráveis por conector (`maxRetries`)

Nenhuma chamada HTTP real — o limiter controla apenas execuções in-process.

---

## Normalização

Modelo comum `NormalizedConnectorRecord`:

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| recordId | string | sim |
| sourceId | string | sim |
| sourceType | ConnectorSourceType | sim |
| nome | string | sim (≥ 3 chars) |
| crm | string | sim (com dígito) |
| crmUf | string | sim |
| especialidade | string | sim |
| cidade | string | sim |
| estado | string | sim (2 chars UF) |
| urlOrigem | string | sim (http) |
| confidence | number | sim (0–1) |
| fetchedAt | string | sim |
| telefone | string | não |

---

## Validation Layer

Valida em duas camadas:
1. `connector.validate()` — regras específicas do conector
2. `validateNormalizedRecord()` — regras globais do framework

Dados inválidos **nunca seguem adiante** — são contabilizados em `invalidCount` do resultado.

---

## Métricas

| Métrica | Descrição |
|---------|-----------|
| totalExecutions | Total de execuções |
| successfulExecutions | Sucessos |
| failedExecutions | Falhas |
| retries | Tentativas de retry |
| averageLatencyMs | Latência média |
| throughputPerMinute | Execuções no último minuto |
| availability | Taxa de sucesso global |
| byConnector | Breakdown por conector |

---

## Mock Connectors

| ID | Nome | Prioridade | Health |
|----|------|------------|--------|
| crm-estadual | CRM Estadual (ES) | 1 | ONLINE |
| cfm | CFM | 2 | ONLINE |
| hospital | Hospital — Corpo Clínico | 3 | ONLINE |
| universidade | Universidade — Corpo Docente | 4 | DEGRADED |
| sociedade-medica | Sociedade Médica | 5 | ONLINE |
| site-institucional | Site Institucional | 6 | ONLINE |

Todos retornam dados mockados. Nenhuma integração real.

---

## Studio — Connector Monitor

Rota: `/alicia/studio/connectors`

Somente leitura. Exibe:
- lista de conectores com health e status
- disponibilidade e latência
- última sincronização
- fila de retries
- eventos recentes

---

## API pública

```typescript
import {
  ConnectorManager,
  ConnectorRegistry,
  defaultMockConnectors,
  getConnectorMonitorSnapshot,
} from "@/alicia/connectors";
```

---

## Testes

```bash
npm run test:connectors
```

Cobertura mínima: 95% linhas/funções/statements, 80% branches.

Cenários cobertos: registro, descoberta dinâmica, normalização, validação, rate limiting, retries, backoff, health, métricas, eventos, falhas, studio adapter.

---

## Integração futura

Este framework foi projetado para que, no futuro:

1. **Discovery Engine** possa consumir `NormalizedConnectorRecord` via adaptador, sem alterar seu contrato atual
2. **Evidence Engine** receba evidências derivadas de conectores reais
3. Conectores reais substituam mocks implementando `SourceConnector`
4. `ConnectorRegistry.registerOrReplace()` permita hot-swap sem alterar código existente

Nesta Epic, nenhum motor existente foi modificado.

---

## Limitações (MVP)

- Sem APIs reais
- Sem persistência (tudo in-memory)
- Sem ações administrativas no Studio
- Sem integração direta com Event Bus (preparado para Epic futura)
- Retry queue não persiste entre reinícios de sessão

---

## Restrições respeitadas

- Nenhuma API real
- Nenhum banco novo
- Motores existentes inalterados
- Protocolo inalterado
- UX pública inalterada
- Studio: adição somente leitura
