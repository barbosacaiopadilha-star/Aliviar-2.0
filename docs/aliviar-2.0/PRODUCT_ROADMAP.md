# PRODUCT ROADMAP — Aliviar Platform

**Versão:** 1.0  
**Data:** 23 de julho de 2026  
**Base arquitetural:** [`FOUNDATION_FREEZE.md`](./FOUNDATION_FREEZE.md) — **FROZEN**  
**Branch de referência:** `release/v1.0.0-beta`  
**Horizonte:** 6 · 12 · 24 meses

---

## Declaração

Este documento define a evolução da **Aliviar Platform** sobre a Foundation congelada da Aliviar 2.0.

O roadmap é organizado por **capacidades de negócio**, não por módulos técnicos. Toda iniciativa deve utilizar os aggregates oficiais existentes e respeitar os princípios P1–P8 do Foundation Freeze.

**Regra de conformidade:** se uma iniciativa exigir novo aggregate, alteração de invariante, mudança de RBAC ou quebra de Event Flow, ela **não pode ser executada** sem RFC + Architecture Review + ADR.

---

## Princípios do Roadmap

| Princípio | Implicação |
|-----------|------------|
| Capacidade sobre módulo | Entregas são descritas pelo valor ao paciente, curador ou operação |
| Foundation first | Projeções e orquestração antes de qualquer mudança estrutural |
| AliCIA é produto independente | Integração somente por interfaces públicas (API, catálogo, conectores) |
| Session ≠ Operation Actor | Toda nova mutação respeita delegação explícita |
| RFC explícito | Conflitos com o freeze são registrados, não ignorados |

---

## Estado atual (baseline — Foundation Complete)

| Capacidade | O que já existe |
|------------|-----------------|
| Experiência do Paciente | Landing → Handoff → Portal → Compartilhar → História → Curadoria → Relatório em elaboração → Leitura (vertical-slice) |
| Experiência do Curador | Workspace, processo de curadoria, aprovação, entrega |
| Curadoria Assistida | ACE Melhorado v2.0; AliCIA catálogo público separado |
| Governança Clínica | Audit trail append-only, versionamento em Report/Process/Delivery |
| Operação | Health/readiness, métricas, filas operacionais, notificações (schema) |

---

## CAPACIDADE 01 — Experiência do Paciente

### Objetivo

Permitir que o paciente compreenda sua jornada, leia o relatório com clareza, escolha com confiança e acompanhe o cuidado após a curadoria — sem ruptura narrativa desde o primeiro contato.

### Valor de negócio

- Reduz ansiedade e abandono entre etapas
- Aumenta taxa de leitura e confirmação do relatório
- Converte curadoria em decisão informada (escolha do médico)
- Gera sinal de satisfação para melhoria contínua

### Dependências

- Foundation: `Journey`, `JourneyMemory`, `ReportDelivery`, `Identity`
- Infra: Supabase Auth (paciente), RLS, storage de documentos
- Operação: notificações transacionais (Capacidade 05)

### Aggregates utilizados

| Aggregate | Uso |
|-----------|-----|
| `Journey` | Avanço de etapa (ENTREGA → ESCOLHA → ACOMPANHAMENTO) |
| `JourneyMemory` | Timeline PORTAL, narrativa contínua |
| `ReportDelivery` | Publicação, primeira visualização, confirmação de leitura |
| `Identity` | Gate de sessão paciente; `actorId` nas mutações |

### Risco arquitetural

| Risco | Mitigação |
|-------|-----------|
| Misturar sessão HTTP com ator de operação | Manter padrão `resolvePatientAccess` → `actorId` |
| Duplicar estado de etapa fora do kernel | Avanços via `advanceJourney` com `KernelActor` |
| Escolha como novo aggregate | **RFC necessário** se regra de escolha exceder projeção `escolha_registrada` |

### Prioridade

**P0** — é o núcleo da proposta de valor da plataforma.

### Critério de pronto

- Paciente completa fluxo Landing → Leitura → Escolha em produção
- Confirmação de leitura registrada em `ReportDelivery`
- Escolha refletida na projeção da jornada (`ESCOLHA` → `ACOMPANHAMENTO`)
- E2E paciente passando em ambiente de produção
- Nenhuma violação do auth consistency audit

### Iniciativas por horizonte

| Horizonte | Iniciativa |
|-----------|------------|
| **6 meses** | Consolidar leitura do relatório em produção; confirmação de leitura; portal de escolha (projeção existente); feedback pós-leitura |
| **12 meses** | Acompanhamento pós-escolha (timeline + compromissos); comunicação bidirecional paciente-equipe; NPS/satisfação integrado à jornada |
| **24 meses** | Jornada de relacionamento de longo prazo; reengajamento proativo; personalização de experiência por perfil clínico (projeções) |

---

## CAPACIDADE 02 — Experiência do Curador

### Objetivo

Maximizar a produtividade e a qualidade da curadoria, permitindo que o curador pesquise, compare, revise e entregue com segurança — em um workspace unificado.

### Valor de negócio

- Reduz tempo por caso
- Aumenta consistência e rastreabilidade das decisões
- Melhora qualidade do relatório entregue ao paciente
- Habilita colaboração entre curadores sem perder ownership

### Dependências

- Foundation: `CurationReport`, `CurationProcess`, `JourneyMemory`, `Case`
- Infra: Curator Workspace API, domain snapshots
- Capacidade 03 (opcional): enriquecimento via AliCIA

### Aggregates utilizados

| Aggregate | Uso |
|-----------|-----|
| `CurationReport` | Evidências, candidatos, notas, aprovação |
| `CurationProcess` | Investigação, revisões, comparação, ciclo final |
| `JourneyMemory` | Contexto compartilhado pelo paciente |
| `Case` | Ownership e contexto do caso |
| `Identity` | `curatorActorId` derivado de staff profile |

### Risco arquitetural

| Risco | Mitigação |
|-------|-----------|
| Regras de aprovação na rota HTTP | Manter em aggregate + status machine |
| Colaboração multi-curador como novo aggregate | **RFC necessário** se ownership simultâneo exigir invariante novo |
| Duplicar candidatos entre Report e Process | Process referencia Report; fonte única em Report |

### Prioridade

**P0** — sem curador produtivo não há entrega de valor.

### Critério de pronto

- Curador completa fluxo Fila → Workspace → Pesquisa → Aprovação → Entrega
- Tempo médio de caso mensurável (Capacidade 05)
- Audit trail completo por relatório
- Zero mutação sem `curatorActorId` explícito

### Iniciativas por horizonte

| Horizonte | Iniciativa |
|-----------|------------|
| **6 meses** | Workspace estável em produção; comparação de candidatos; checklist de qualidade; templates de curadoria |
| **12 meses** | Colaboração (notas privadas, favoritos, histórico); indicadores de produtividade por curador; revisão por pares |
| **24 meses** | Quality scoring automático; fila inteligente por complexidade; mentoria entre curadores |

---

## CAPACIDADE 03 — Curadoria Assistida

### Objetivo

Enriquecer a curadoria com dados verificáveis de formação e trajetória profissional, **sem acoplar** a Aliviar Platform ao domínio interno da AliCIA.

### Valor de negócio

- Acelera pesquisa de candidatos médicos
- Aumenta confiança nas recomendações (fontes citadas)
- Reduz trabalho manual de verificação
- Mantém independência de produto entre Aliviar e AliCIA

### Dependências

- AliCIA: catálogo público (`/alicia`), API de perfis, conectores (interfaces públicas)
- Foundation: `CurationReport`, `CurationProcess` (evidências e candidatos)
- **Não depende** de código interno de `src/alicia/studio/`

### Aggregates utilizados

| Aggregate | Uso |
|-----------|-----|
| `CurationReport` | Evidências com origem AliCIA; candidatos médicos |
| `CurationProcess` | Findings de pesquisa externa |
| `JourneyMemory` | Contexto clínico do paciente (não misturar com catálogo) |

### Risco arquitetural

| Risco | Mitigação |
|-------|-----------|
| Acoplamento direto ao Studio AliCIA | Adapter via interface pública; nunca importar `src/alicia/*` em domínio Aliviar |
| AliCIA virar fonte de verdade da jornada | Catálogo é referência; decisão permanece no curador |
| Novo aggregate "MedicalProfile" | **RFC necessário** — preferir evidência em `CurationReport` |

### Prioridade

**P1** — alto valor, depende de maturidade do workspace (Cap. 02).

### Critério de pronto

- Curador importa perfil AliCIA como evidência em um clique
- Fonte e pendências de verificação visíveis no workspace
- Nenhuma dependência de runtime do Studio em produção Aliviar
- Contrato de integração documentado e versionado

### Iniciativas por horizonte

| Horizonte | Iniciativa |
|-----------|------------|
| **6 meses** | Link de perfil AliCIA como evidência; busca por especialidade/cidade no workspace |
| **12 meses** | Sugestão de candidatos a partir do catálogo (read-only API); score de aderência como metadado de evidência |
| **24 meses** | Pipeline de verificação contínua (webhook AliCIA → evidência atualizada); integração com conectores oficiais (CRM, etc.) |

---

## CAPACIDADE 04 — Governança Clínica

### Objetivo

Garantir auditoria, compliance, rastreabilidade e versionamento em toda a cadeia clínico-operacional — do handoff à entrega.

### Valor de negócio

- Conformidade regulatória e confiança institucional
- Capacidade de reconstruir qualquer decisão (quem, quando, por quê)
- Redução de risco legal e operacional
- Base para certificações e parcerias hospitalares

### Dependências

- Foundation: audit trails em Report, Process, Delivery; `operational_audit_events`
- Infra: correlation IDs, structured logs, RLS
- Operação: retenção e export (Capacidade 05)

### Aggregates utilizados

| Aggregate | Uso |
|-----------|-----|
| `Journey` | Transições versionadas |
| `CurationReport` | `versions[]`, `auditTrail[]` |
| `CurationProcess` | `versions[]`, `auditTrail[]` |
| `ReportDelivery` | `versions[]`, `auditTrail[]` |
| `JourneyMemory` | Timeline append-only |
| `Identity` | `actorId` / `actor_role` em todos os eventos |

### Risco arquitetural

| Risco | Mitigação |
|-------|-----------|
| UPDATE/DELETE em audit trail | Manter append-only; correções via evento de correção |
| Logs com PHI | Sanitização em `sanitize-log-payload` |
| Retenção como regra de domínio | **RFC necessário** se política de retenção alterar invariantes |

### Prioridade

**P0** — requisito não negociável para operação em saúde.

### Critério de pronto

- 100% das mutações críticas com `correlationId` e audit event
- Export de trilha por jornada disponível para admin/auditor
- Versionamento consultável por relatório e entrega
- Security Advisor Supabase sem alertas P0

### Iniciativas por horizonte

| Horizonte | Iniciativa |
|-----------|------------|
| **6 meses** | Dashboard de auditoria admin; export CSV/JSON por jornada; hardening RPC grants |
| **12 meses** | Relatório de compliance periódico; trilha unificada paciente+curador; política de retenção documentada |
| **24 meses** | Certificação de processos; integração com SIEM externo; prova de integridade (hash chain) |

---

## CAPACIDADE 05 — Operação

### Objetivo

Sustentar a plataforma em produção com agenda, pagamentos, mensageria, monitoramento e indicadores — sem comprometer o domínio clínico.

### Valor de negócio

- Disponibilidade e confiabilidade para pacientes e curadores
- Visibilidade operacional para gestão
- Base para monetização (pagamentos) e engajamento (mensageria)
- Decisões data-driven sobre capacidade e qualidade

### Dependências

- Infra: Vercel, Supabase, health/readiness, CI/CD
- Foundation: filas operacionais, `feature_flags`, `system_configuration`
- Capacidades 01–04 (eventos que alimentam indicadores)

### Aggregates utilizados

| Aggregate | Uso |
|-----------|-----|
| `Journey` | Estado para filas e SLA |
| `Case` | Ownership para roteamento operacional |
| `Identity` | Staff ativo, roles |
| *Projeções* | Métricas derivadas — **não novos aggregates** |

### Risco arquitetural

| Risco | Mitigação |
|-------|-----------|
| Pagamentos como aggregate clínico | **RFC necessário** — bounded context separado ou integração via port |
| SLA na infra em vez de projeção | Derivar de `Journey` + audit events |
| Feature flags alterando invariantes | Flags só para rollout de UI/integração, não regras de domínio |

### Prioridade

**P1** — essencial para escala, após fluxo clínico estável.

### Critério de pronto

- Readiness `200` contínuo em produção
- Indicadores: casos ativos, tempo médio por etapa, taxa de entrega
- Alertas em SLA crítico (auth, DB, storage)
- Runbook de rollback testado

### Iniciativas por horizonte

| Horizonte | Iniciativa |
|-----------|------------|
| **6 meses** | GitHub CI verde; monitoramento 24h pós-deploy; métricas operacionais no admin; notificações transacionais (email/push) |
| **12 meses** | Agenda de consultas (integração externa); indicadores de qualidade por curador; pagamentos (MVP via gateway — **RFC**) |
| **24 meses** | Command center operacional; previsão de demanda; automação de escalação de incidentes |

---

## Roadmap consolidado

### 6 meses (H1 2027)

| # | Capacidade | Entrega principal |
|---|------------|-------------------|
| 1 | Experiência do Paciente | Leitura + escolha + feedback em produção |
| 2 | Experiência do Curador | Workspace + comparação + templates |
| 3 | Curadoria Assistida | Evidência AliCIA no workspace |
| 4 | Governança Clínica | Dashboard auditoria + export |
| 5 | Operação | CI/CD estável + métricas + notificações |

**Marco:** Primeiro caso real completo em produção (paciente → entrega → escolha).

### 12 meses (H2 2027 – H1 2028)

| # | Capacidade | Entrega principal |
|---|------------|-------------------|
| 1 | Experiência do Paciente | Acompanhamento + comunicação + NPS |
| 2 | Experiência do Curador | Colaboração + produtividade + revisão por pares |
| 3 | Curadoria Assistida | Sugestão de candidatos via API AliCIA |
| 4 | Governança Clínica | Compliance report + trilha unificada |
| 5 | Operação | Agenda + pagamentos MVP (**RFC**) |

**Marco:** Plataforma operando com múltiplos curadores e volume recorrente.

### 24 meses (2028–2029)

| # | Capacidade | Entrega principal |
|---|------------|-------------------|
| 1 | Experiência do Paciente | Relacionamento de longo prazo + personalização |
| 2 | Experiência do Curador | Quality scoring + fila inteligente |
| 3 | Curadoria Assistida | Verificação contínua + conectores oficiais |
| 4 | Governança Clínica | Certificação + SIEM + prova de integridade |
| 5 | Operação | Command center + previsão de demanda |

**Marco:** Aliviar como plataforma de referência em curadoria médica no Brasil.

---

## Matriz de prioridade

| Capacidade | P0/P1/P2 | Horizonte crítico |
|------------|----------|-------------------|
| 01 Experiência do Paciente | **P0** | 6 meses |
| 02 Experiência do Curador | **P0** | 6 meses |
| 03 Curadoria Assistida | **P1** | 12 meses |
| 04 Governança Clínica | **P0** | 6 meses |
| 05 Operação | **P1** | 6–12 meses |

---

## Registro de conflitos com Foundation Freeze

| Iniciativa | Conflito potencial | Ação requerida |
|------------|-------------------|----------------|
| Escolha do médico com regras complexas | Pode exigir aggregate ou invariante novo | RFC antes de implementar |
| Pagamentos | Novo bounded context | RFC + ADR |
| Colaboração multi-curador simultânea | Ownership em `Case` | RFC se alterar invariante |
| Aggregate `MedicalProfile` | Proibido sem RFC | Usar evidência em `CurationReport` |
| Retenção/deleção de dados clínicos | Append-only audit | RFC + revisão legal |

---

## Governança do Roadmap

- Revisão trimestral do roadmap com produto + arquitetura
- Toda iniciativa referencia capacidade (não módulo)
- Toda entrega valida critério de pronto da capacidade
- Conflitos com `FOUNDATION_FREEZE.md` → RFC obrigatório antes de sprint
- AliCIA: integração apenas por contratos públicos documentados em `docs/aliviar-2.0/integrations/alicia.md` (a criar quando Cap. 03 iniciar)

---

## Assinatura

| Campo | Valor |
|-------|-------|
| **Documento** | `docs/aliviar-2.0/PRODUCT_ROADMAP.md` |
| **Versão** | 1.0 |
| **Base** | Foundation Freeze (FROZEN) |
| **Data** | 2026-07-23 |
| **Status** | Ativo |

---

> *Este roadmap evolui a Plataforma sobre a Foundation congelada. A arquitetura não evolui aqui — apenas as capacidades de negócio.*
