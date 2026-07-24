# CRM Estadual (ES) — Adapter Real v1.0

Integração real do conector `crm-estadual` com o **Web Service público do CFM** (Resolução CFM nº 2.129/15), fonte oficial para consulta de médicos registrados no CRM-ES.

**Localização:** `src/alicia/connectors/adapters/crm-estadual/`

---

## Fonte pública

| Item | Valor |
|------|-------|
| Serviço | CFM Web Service — Listagem de Médicos |
| Documentação | [crmvirtual.cfm.org.br](https://crmvirtual.cfm.org.br/BR/servico/web-service---listagem-de-medicos) |
| Endpoint | `https://ws.cfm.org.br:8080/WebServiceConsultaMedicos/ServicoConsultaMedicos` |
| Operação | `Consultar` (SOAP) |
| Parâmetros | `CRM`, `UF`, `ChaveIdentificacao` |
| Dados retornados | Nome, CRM, UF, situação, tipo de inscrição, especialidades |

A consulta é **individual por CRM + UF**. Não há listagem em massa gratuita sem chave de acesso.

---

## Configuração

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ALICIA_CFM_WS_CHAVE` | Sim* | Chave de acesso ao Web Service CFM |
| `ALICIA_CRM_ESTADUAL_SEED_CRMS` | Sim* | CRMs a consultar, separados por vírgula |
| `ALICIA_CRM_ESTADUAL_UF` | Não | UF do conselho (padrão: `ES`) |
| `ALICIA_CFM_WS_URL` | Não | URL do serviço SOAP |
| `ALICIA_CRM_ESTADUAL_ENABLED` | Não | `false` desabilita o conector |
| `ALICIA_CFM_WS_TIMEOUT_MS` | Não | Timeout em ms (padrão: 15000) |

\* Sem chave ou sem seed CRMs, o conector opera em **modo degradado** — a plataforma continua funcionando.

### Exemplo

```env
ALICIA_CFM_WS_CHAVE=sua-chave-cfm
ALICIA_CRM_ESTADUAL_UF=ES
ALICIA_CRM_ESTADUAL_SEED_CRMS=45210,51332,29887
```

---

## Degradação graciosa

Toda falha é tratada como **degradação do conector**, nunca como falha da plataforma:

| Condição | Health | Comportamento |
|----------|--------|---------------|
| Sem chave CFM | `DEGRADED` | `fetch()` retorna `success: false`, dados vazios |
| Sem seed CRMs | `DEGRADED` | Idem |
| Timeout / erro SOAP | `DEGRADED` | Idem, erro registrado em métricas |
| Sucesso parcial | `DEGRADED` | Retorna registros obtidos + warning |
| Sucesso total | `ONLINE` | Dados normalizados disponíveis |

O `ConnectorManager` registra falha do conector, mas **não interrompe** os demais conectores.

---

## Interface preservada

Implementa `SourceConnector<CfmCrmRawRecord>` sem alterar:

- Discovery Engine
- Event Bus
- Protocol Engine
- Publication Pipeline
- Connector Framework

Substitui apenas o mock `crm-estadual` em `defaultConnectors`.

---

## Métricas do adapter

`CrmEstadualAdapterMetrics` registra:

- `requests` — consultas SOAP realizadas
- `successes` / `failures` / `notFound`
- `degradedEvents` — entradas em modo degradado
- `averageLatencyMs`
- `lastError` / `lastSuccessAt`
- `configured` — chave + seeds presentes

Acesso via `getCrmEstadualAdapterMetrics(connector)`.

---

## Uso programático

```typescript
import {
  createCrmEstadualConnectorWithMetrics,
  CfmSoapClient,
  loadCrmEstadualConfig,
} from "@/alicia/connectors";

const connector = createCrmEstadualConnectorWithMetrics({
  config: loadCrmEstadualConfig(),
  client: new CfmSoapClient({ serviceUrl: "..." }),
});
```

---

## Testes

```bash
npm run test:connectors
```

Cobertura inclui: config, SOAP parse/build, degradação sem chave, fetch com client mockado, normalização, métricas.

---

## Limitações

- Consulta individual (não há busca por nome nesta versão)
- Requer chave CFM (gratuita para órgãos públicos)
- Cidade não fornecida pela fonte — normalizada como `"Não informado pela fonte"`
- Rate limit conservador: 10/min, 120/h

---

## Próximos passos (fora deste escopo)

- Integrar seed CRMs a partir da fila do Discovery
- Busca por nome via operação adicional do CFM WS
- Cache de consultas recentes
