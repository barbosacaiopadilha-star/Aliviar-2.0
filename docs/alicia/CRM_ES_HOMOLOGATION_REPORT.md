# Relatório de Homologação — CRM Estadual ES

**Gerado em:** 2026-07-24T03:57:10.297Z  
**Missão:** 010 — CRM Estadual ES Homologation & Pilot  
**Classificação:** **NEEDS_IMPROVEMENT**

---

## ETAPA 1 — Validação de configuração

| Variável | Presente | Válida | Valor (mascarado) | Mensagem |
|----------|:--------:|:------:|-------------------|----------|
| ALICIA_CFM_WS_CHAVE | ❌ | ❌ | — | Chave CFM WS ausente — configure ALICIA_CFM_WS_CHAVE ou CFM_WS_CHAVE. |
| ALICIA_CRM_ESTADUAL_UF | ✅ | ✅ | ES | OK |
| ALICIA_CRM_ESTADUAL_SEED_CRMS | ❌ | ❌ |  | Lista de CRMs seed vazia — configure ALICIA_CRM_ESTADUAL_SEED_CRMS. |

| Parâmetro | Valor |
|-----------|-------|
| Configurado | ❌ Não |
| UF | ES |
| CRMs seed | 0 |
| Service URL | https://ws.cfm.org.br:8080/WebServiceConsultaMedicos/ServicoConsultaMedicos |
| Timeout | 15000ms |
| Habilitado | Sim |

---

## ETAPA 2 — Testes reais (homologação)

| Métrica | Valor |
|---------|------:|
| Health | OFFLINE |
| Taxa de sucesso | 0% |
| Disponibilidade | 0% |
| Latência média | 0ms |
| Erros SOAP | 0 |
| Timeouts | 0 |
| Retries | 0 |
| Início | 2026-07-24T03:57:08.774Z |
| Fim | 2026-07-24T03:57:08.775Z |

### Tentativas por CRM

| CRM | Sucesso | Latência | Tipo erro | Resultado |
|-----|:-------:|---------:|-----------|-----------|
_Nenhuma tentativa — configuração ausente._

---

## ETAPA 3 — Discovery Mock vs Real (CRM exclusivo)

| Indicador | Mock | Real |
|-----------|-----:|-----:|
| Candidatos encontrados | 2 | 0 |
| Únicos | 2 | 0 |
| Duplicados | 0 | 0 |
| Ignorados | 0 | 0 |

**Erro fetch real:** Chave CFM WS não configurada (ALICIA_CFM_WS_CHAVE).


### Candidatos Mock

- Dr. Ricardo Almeida (CRM 45.210) — Ortopedia, Vitória
- Dr. Paulo Mendes (CRM 51.332) — Ortopedia, Cariácica

### Candidatos Real

_Nenhum candidato — fetch real falhou ou retornou vazio._

### Apenas no Mock

- 45.210
- 51.332

### Apenas no Real

_Nenhum_

### Em ambos

_Nenhum_

### Inconsistências

_Nenhuma inconsistência campo a campo._

---

## ETAPA 4 — Pipeline (Dry Run)

| Fase | Resultado |
|------|-----------|
| Discovery | CRM real indisponível — baseline mock |
| Evidence | Cobertura média 0% |
| Protocol | HUMAN_REVIEW 6 · AUTO_PUBLISH 0 |
| Publication (Dry Run) | 0 simulação(ões) |
| Verification | 0 tentativa(s) |
| Operations | 2 gargalo(s) |

---

## ETAPA 5 — Impacto

| Métrica | Baseline (Missão 008) | Atual | Delta |
|---------|---------------------:|------:|------:|
| Cobertura média | 100% | 0% | -100 pp |
| HUMAN_REVIEW | 6 | 6 | +0 |
| AUTO_PUBLISH | 0 | 0 | +0 |

### Problemas encontrados

- ALICIA_CFM_WS_CHAVE: Chave CFM WS ausente — configure ALICIA_CFM_WS_CHAVE ou CFM_WS_CHAVE.
- ALICIA_CRM_ESTADUAL_SEED_CRMS: Lista de CRMs seed vazia — configure ALICIA_CRM_ESTADUAL_SEED_CRMS.
- Integração CRM ES offline no ambiente atual.
- Discovery real: Chave CFM WS não configurada (ALICIA_CFM_WS_CHAVE).

### Confiabilidade da integração

- Confiabilidade estimada: 0% (não configurada)
- Health runtime: OFFLINE
- Sem timeouts ou erros SOAP na execução.

---

## ETAPA 6 — Classificação

**NEEDS_IMPROVEMENT**

Configuração incompleta (chave CFM ou CRMs seed ausentes). Ambiente não está pronto para probe real. Probe retornou health OFFLINE — nenhuma consulta SOAP bem-sucedida. ALICIA_CFM_WS_CHAVE: Chave CFM WS ausente — configure ALICIA_CFM_WS_CHAVE ou CFM_WS_CHAVE. ALICIA_CRM_ESTADUAL_SEED_CRMS: Lista de CRMs seed vazia — configure ALICIA_CRM_ESTADUAL_SEED_CRMS. Integração CRM ES offline no ambiente atual. Discovery real: Chave CFM WS não configurada (ALICIA_CFM_WS_CHAVE).

---

## Restrições respeitadas

- Nenhum motor alterado
- Protocol Engine inalterado
- UX inalterada
- Nenhum perfil publicado no catálogo
- Sem commit / sem push

---

## Referências

- Adapter: `src/alicia/connectors/adapters/crm-estadual/`
- Homologação: `src/alicia/connectors/adapters/crm-estadual/homologation/`
- Roadmap fontes: `docs/alicia/ROADMAP_FONTES_OFICIAIS.md`
- Baseline piloto: `docs/alicia/PILOT_ES_REPORT.md`

