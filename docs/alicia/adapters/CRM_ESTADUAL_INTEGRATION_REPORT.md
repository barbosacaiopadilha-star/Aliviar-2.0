# Relatório de Integração — CRM Estadual (ES) v1.0

**Data:** 2026-07-23  
**Escopo:** Substituição do mock `crm-estadual` por adapter real  
**Status:** Pronto para revisão

---

## Resumo executivo

O conector `crm-estadual` foi substituído por integração real com o **Web Service público do CFM** (fonte oficial para CRM-ES). A interface `SourceConnector` foi preservada. Falhas de configuração ou de rede degradam apenas o conector — a plataforma continua operando com os demais conectores mock.

---

## Fonte escolhida

| Critério | Avaliação |
|----------|-----------|
| Pública e oficial | ✅ CFM WS — Resolução 2.129/15 |
| Dados permitidos | ✅ Nome, CRM, UF, situação, especialidade |
| API documentada | ✅ SOAP `Consultar` |
| Sem scraping | ✅ Integração via WS formal |
| Custo | Chave necessária (gratuita para entes públicos) |

**Não utilizado:** APIs pagas de terceiros (Consultar.IO, Shelf).  
**Não utilizado:** Scraping do portal CRM Virtual.

---

## Arquivos entregues

| Arquivo | Responsabilidade |
|---------|------------------|
| `adapters/crm-estadual/crm-estadual-connector.ts` | Implementação `SourceConnector` |
| `adapters/crm-estadual/cfm-soap-client.ts` | Cliente SOAP (fetch nativo) |
| `adapters/crm-estadual/config.ts` | Configuração via env |
| `adapters/crm-estadual/metrics.ts` | Métricas do adapter |
| `adapters/crm-estadual/types.ts` | Tipos |
| `default-connectors.ts` | Composição com adapter real |
| `docs/alicia/adapters/CRM_ESTADUAL_ADAPTER.md` | Documentação |

---

## Comportamento observado

### Com chave configurada (testes com client mockado)

- `authenticate()` → sucesso
- `fetch()` → consulta cada CRM seed via SOAP
- `normalize()` → `NormalizedConnectorRecord` compatível com pipeline
- Health → `ONLINE`

### Sem chave (ambiente local padrão)

- Health inicial → `DEGRADED`
- `fetch()` → `{ success: false, data: [], error: "Chave CFM WS não configurada" }`
- ConnectorManager → falha isolada do conector
- Demais 5 conectores mock → executam normalmente

### Erro SOAP / timeout

- Health → `DEGRADED`
- Métricas registram `failures` + `degradedEvents`
- Plataforma não lança exceção não tratada

---

## Métricas

| Métrica | Descrição |
|---------|-----------|
| `requests` | Total de chamadas SOAP |
| `successes` | Consultas com médico encontrado |
| `failures` | Erros de rede/parse/auth |
| `notFound` | CRM consultado sem resultado |
| `degradedEvents` | Entradas em modo degradado |
| `averageLatencyMs` | Latência média |
| `configured` | `true` se chave + seeds presentes |

---

## Testes executados

| Suite | Resultado |
|-------|-----------|
| `npm run test:connectors` | ✅ 49 testes, 97.2% cobertura |
| Adapter unit tests | 18 cenários |
| Framework connectors tests | Preservados com `defaultMockConnectors` |

Cenários cobertos:
- Config/env
- Parse/build SOAP
- Degradação sem chave
- Fetch com client injetado
- Falha SOAP → degradado
- Normalização e validação

---

## Impacto na plataforma

| Componente | Alterado? |
|------------|-----------|
| Discovery Engine | ❌ Não |
| Event Bus | ❌ Não |
| Protocol Engine | ❌ Não |
| Publication Pipeline | ❌ Não |
| Connector Framework | ❌ Comportamento inalterado |
| Studio Connector Monitor | ✅ Usa `defaultConnectors` (adapter real) |
| Verification Runner | ✅ Usa `defaultConnectors` |

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Chave CFM não disponível em dev | Modo degradado automático |
| Rate limit CFM | Limite conservador 10/min |
| SOAP namespace divergente | Parser tolerante por tag name |
| Cidade ausente na fonte | Campo `"Não informado pela fonte"` |

---

## Recomendação

Aprovar para revisão. Após obtenção da chave CFM em ambiente de staging, validar consulta real com:

```env
ALICIA_CFM_WS_CHAVE=<chave>
ALICIA_CRM_ESTADUAL_SEED_CRMS=45210
```

**Não integrar próxima fonte até revisão desta.**
