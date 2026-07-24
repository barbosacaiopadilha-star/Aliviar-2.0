# AliCIA — Operational Playbook

**Versão:** 1.0  
**Status:** Canônico — operação da plataforma  
**Data:** 23 de julho de 2026  
**Público:** Integration & Operations Lead, COO, operadores, curadoria, engenharia de integrações

---

## Como usar este documento

Este playbook descreve **como a AliCIA opera no dia a dia** — rotinas, responsabilidades, checklists e resposta a incidentes.

Ele complementa (não substitui):

| Documento | Escopo |
|-----------|--------|
| [`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) | Critérios editoriais e de elegibilidade |
| [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md) | Operação humana de casos e dossiês |
| [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md) | KPIs e metas |
| [`OPERATIONS_CENTER_1.0.md`](./OPERATIONS_CENTER_1.0.md) | Camada técnica de observabilidade |

**Regra de precedência:** Protocolo → Operação humana → Playbook técnico.  
Este playbook **não altera motores, protocolo ou UX**. É somente documentação operacional.

---

## Modelo operacional

### Pipeline da plataforma

```
Discovery → Evidence → Protocol → Publication → Verification → Operations
     ↑                                                              ↓
     └──────────── Review Case (exceção humana) ←──────────────────┘
```

### Princípios operacionais

1. **Automação primeiro** — humanos entram apenas em exceções (Review Cases, homologação, incidentes).
2. **Degradação graciosa** — conector offline não derruba a plataforma.
3. **Append-only** — auditoria, snapshots e histórico nunca são apagados.
4. **Dry run antes de produção** — toda integração e catálogo novo passa por simulação.
5. **Quatro olhos** — Nível A e decisões materiais exigem segundo analista (Protocolo).

### Onde operar (Studio)

| Área | Rota Studio | Função |
|------|-------------|--------|
| Discovery | `/alicia/studio/discovery` | Fila de candidatos, métricas de descoberta |
| Connectors | `/alicia/studio/connectors` | Health, latência, falhas por fonte |
| Evidence | `/alicia/studio/evidence` | Packages, cobertura, conflitos |
| Workflow / Protocol | `/alicia/studio/workflow` | Decisões AUTO_PUBLISH / HUMAN_REVIEW |
| Inbox | `/alicia/studio/inbox` | Review Cases pendentes |
| Verification | `/alicia/studio/verification` | Runs de reverificação |
| Operations | `/alicia/studio/operations` | KPIs, gargalos, alertas, timeline |
| Factory | `/alicia/studio/factory` | Runs automatizados, dry run, checkpoints |

---

## Responsabilidades (RACI)

| Papel | Responsabilidade principal | Rotinas |
|-------|---------------------------|---------|
| **Integration & Operations Lead** | Homologação de fontes, promoção para produção, incidentes de conector | Diária (connectors), semanal (homologação), mensal (roadmap fontes) |
| **COO** | Priorização de cobertura, metas, comitê de catálogo | Semanal (KPIs), mensal (cobertura) |
| **Operador de ingestão** | Discovery manual, coleta complementar, resolução de Review Cases simples | Diária |
| **Revisor de catálogo** | Protocol HUMAN_REVIEW, verificação, aprovação Nível B | Diária / semanal |
| **Curador sênior** | Nível A, conflitos RC, comitê, rollback editorial | Sob demanda + semanal |
| **Engenharia (suporte)** | RC de produção, build gates, incidentes P1 de plataforma | Sob demanda |

**Legenda RACI:** R = executa · A = aprova · C = consultado · I = informado

| Atividade | Int/Ops Lead | COO | Operador | Revisor | Curador | Engenharia |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Rotina diária Operations Center | R/A | I | C | I | I | C |
| Homologar nova fonte | R/A | C | I | I | I | C |
| Resolver Review Case | C | I | R | A | C | I |
| Erro de conector | R/A | I | C | I | I | C |
| Rollback de publicação | C | I | I | C | R/A | C |
| Promover integração | R | A | I | I | I | C |
| Validar catálogo novo | C | A | R | R | A | I |
| Incidente P1 | C | A | I | I | C | R |

---

# Parte I — Rotinas

## 1. Rotina diária

**Janela recomendada:** 09:00–09:45 (stand-up 15 min + verificações 30 min)  
**Responsável:** Integration & Operations Lead (com operador de plantão)

### Discovery

| Ação | Como | Critério de OK |
|------|------|----------------|
| Abrir Discovery Inbox | Studio → Discovery | Snapshot carregado sem erro |
| Verificar candidatos novos | Comparar `candidatesFound` com dia anterior | Variação documentada se > 50% |
| Checar duplicatas | Métricas `duplicates` e `ignored` | Duplicatas explicadas (mesma fonte ou cross-source) |
| Revisar health das fontes | `sourceHealth` por conector | Nenhuma fonte crítica OFFLINE sem plano |
| Registrar anomalia | Log operacional / Operations History | Qualquer `sourceFailures > 0` documentado |

**Escalar se:** fila cresceu ≥ 1,5× em 24h · zero candidatos por 3 dias consecutivos com fontes ONLINE.

### Connectors

| Ação | Como | Critério de OK |
|------|------|----------------|
| Abrir Connectors Center | Studio → Connectors | Painel renderiza |
| Verificar health global | ONLINE / DEGRADED / OFFLINE por conector | ≥ 80% disponibilidade nas fontes críticas |
| Revisar latência | `averageLatencyMs` por adapter | P95 < 500ms (CRM) · < 2s (demais) |
| Checar retries e DLQ | Event Bus + alertas Operations | Retries < 5 · DLQ = 0 |
| Confirmar variáveis de ambiente | Conectores reais (ex.: CRM ES) | Chave e seeds configurados em produção |

**Escalar se:** conector crítico OFFLINE > 1h · retry storm (≥ 5) · DLQ ≥ 3.

### Evidence

| Ação | Como | Critério de OK |
|------|------|----------------|
| Revisar packages gerados | Studio → Evidence | Packages sem erro estrutural |
| Checar cobertura média | Evidence Coverage | ≥ meta da fase (piloto: 88%) |
| Listar conflitos novos | `institution_mismatch`, campos divergentes | Conflitos triados (resolver ou escalar) |
| Verificar categorias vazias | Graduação, residência, CRM | Lacunas mapeadas para roadmap de fontes |

**Escalar se:** cobertura cai > 10 pp em 24h · conflitos não resolvidos > 48h em candidato pronto.

### Protocol

| Ação | Como | Critério de OK |
|------|------|----------------|
| Revisar decisões do dia | Studio → Workflow | Distribuição AUTO_PUBLISH / HUMAN_REVIEW / REJECT |
| Identificar regras bloqueantes | Top regras em HUMAN_REVIEW (ex.: FORM-001, FORM-002) | Causa raiz documentada |
| Priorizar fila humana | Inbox — confiança ≥ 0,8 primeiro | Nenhum caso > 3 dias úteis sem dono |
| Confirmar zero REJECT inesperado | Audit trail Protocol | REJECT com motivo registrado |

**Escalar se:** REJECT em massa · spike de HUMAN_REVIEW (≥ 2× média semanal).

### Publication

| Ação | Como | Critério de OK |
|------|------|----------------|
| Verificar publicações do dia | Publication audit / Factory run | Somente AUTO_PUBLISH entrou no pipeline |
| Checar preflight blocks | Status `PUBLICATION_BLOCKED` | Bloqueios com código de motivo |
| Confirmar dry run em homologação | Factory `DRY_RUN` | Nenhuma publicação acidental em staging |
| Revisar `ALREADY_PUBLISHED` / `NO_CHANGE` | Idempotência | Comportamento esperado, não incidente |

**Escalar se:** `PUBLICATION_INCONSISTENT` · `ROLLBACK_EXECUTED` · perfil público com sentinela interna.

### Verification

| Ação | Como | Critério de OK |
|------|------|----------------|
| Abrir Verification Center | Studio → Verification | Runs listados |
| Checar runs falhos | `verification_failure` alertas | Falhas com correlationId rastreável |
| Confirmar pós-publicação | Perfis publicados nas últimas 24h | `PUBLICATION_VERIFIED` ou rollback já executado |

**Escalar se:** verificação falha em perfil já público · CRM irregular detectado.

### Operations

| Ação | Como | Critério de OK |
|------|------|----------------|
| Abrir Operations Center | Studio → Operations | Health geral ≠ CRITICAL |
| Revisar bottlenecks | `slow_stage`, `growing_queue`, `degraded_connector` | Gargalos com dono e prazo |
| Registrar snapshot diário | Operations History (automático) | KPIs do dia persistidos |
| Atualizar stand-up | Fila, bloqueios, conectores, Review Cases | Equipe alinhada em 15 min |

**Meta diária:** health geral **healthy** ou **degraded** com plano; nunca **critical** sem war room.

---

## 2. Rotina semanal

**Janela recomendada:** segunda-feira, 10:00–12:00  
**Participantes:** COO, Integration & Operations Lead, revisor de catálogo

### Discovery

- Comparar `candidatesFound` semana a semana.
- Avaliar eficácia de novas seeds (CRM, hospitais, universidades).
- Propor ajustes de prioridade de fontes no Discovery Engine (via configuração, não código).
- Atualizar plano de expansão geográfica se KPI-C01 abaixo da meta.

### Connectors

- Revisar disponibilidade média por conector (meta: ≥ 95% para fontes em produção).
- Analisar top 3 erros SOAP / timeout / validação.
- Atualizar status no [`ROADMAP_FONTES_OFICIAIS.md`](./ROADMAP_FONTES_OFICIAIS.md).
- Decidir se fonte em homologação avança para staging.

### Evidence

- Relatório de cobertura por categoria (Identity, Education, Residency, Institutions).
- Identificar categorias com maior impacto em HUMAN_REVIEW.
- Cruzar conflitos recorrentes com conectores responsáveis.
- Priorizar integração da próxima fonte oficial (roadmap Missão 009).

### Protocol

- Distribuição semanal: % AUTO_PUBLISH vs HUMAN_REVIEW vs REJECT.
- Top 5 regras bloqueantes — plano de mitigação (fonte ou processo).
- Revisar casos HUMAN_REVIEW abertos > 5 dias úteis.
- Amostra QA: 10% dos casos resolvidos na semana (reprodutibilidade).

### Publication

- Taxa de publicação bem-sucedida (meta: ≥ 95% dos AUTO_PUBLISH).
- Revisar rollbacks da semana — causa raiz e ação preventiva.
- Confirmar que nenhum perfil foi publicado sem snapshot.
- Validar idempotência em re-runs de Factory.

### Verification

- Perfis com revisão periódica vencendo nos próximos 30 dias.
- Taxa de reverificação bem-sucedida.
- Amostra: 5 perfis publicados — CRM + atuação atual ainda válidos.

### Operations

- Atualizar [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md) (KPIs C, Q, O).
- Reunião de qualidade: RC abertos, KPI-Q07, fila B → A.
- Comitê de catálogo (se houver casos escalados).
- Definir **uma prioridade única** para o ciclo seguinte (modelo Daily Ops Report).

**Entregáveis semanais:**

1. Dashboard atualizado  
2. Status de homologação de fontes  
3. Fila de Review Cases priorizada  
4. Decisão de ciclo operacional (qualidade vs expansão)

---

## 3. Rotina mensal

**Janela recomendada:** primeira semana do mês, meio período  
**Participantes:** COO, Integration & Operations Lead, curador sênior, engenharia (opcional)

### Discovery

- Relatório de cobertura geográfica (KPI-C01 a KPI-C05).
- Avaliar ROI de fontes (candidatos únicos / custo operacional).
- Revisar seeds e parâmetros de discovery por região.
- Planejar lote de expansão (nova cidade prioritária).

### Connectors

- Auditoria de todas as fontes no Official Source Registry.
- Renovar chaves de API (ex.: CFM WS) se política exigir.
- Revisar rate limits e timeouts com base em métricas reais.
- Homologar ou promover integrações pendentes (ver Procedimento §4).

### Evidence

- Relatório mensal de Evidence Coverage (`EVIDENCE_COVERAGE_REPORT`).
- Meta: reduzir KPI-Q07 (residência não verificada) em ≥ 5 pp.
- Avaliar impacto de novas fontes acadêmicas (MEC, CNRM).
- Varredura de conflitos não resolvidos — zerar backlog > 30 dias.

### Protocol

- Revisar distribuição de decisões vs mês anterior.
- Calibrar expectativa de AUTO_PUBLISH (não forçar — Protocolo prevalece).
- Auditoria interna: 20% dos perfis publicados no mês.
- Treinamento se QA reprovação > 5%.

### Publication

- Inventário de versões publicadas (v1.x vs v2.0).
- Revisar todos os rollbacks do mês.
- Confirmar integridade de snapshots (hash determinístico).
- Simular disaster recovery: restaurar perfil a partir de snapshot.

### Verification

- Varredura CRM: amostra 20% do catálogo (Operação §7.3).
- Revisar perfis com `lastUpdated` > 150 dias — agendar antes de 180.
- Relatório de inconsistências detectadas.

### Operations

- Conselho de cobertura (expansão geográfica e metas trimestrais).
- Revisão de indicadores O01–O08 — instrumentar lacunas.
- Retrospectiva de incidentes do mês.
- Atualizar este playbook se processos mudaram.

**Entregáveis mensais:**

1. Relatório de cobertura e qualidade  
2. Status do roadmap de fontes oficiais  
3. Plano de expansão geográfica  
4. Ata do conselho de cobertura  
5. Classificação READY_FOR_PRODUCTION / NEEDS_IMPROVEMENT por integração

---

# Parte II — Procedimentos

## 2.1 Como homologar uma nova fonte

**Responsável:** Integration & Operations Lead  
**Referência:** [`ROADMAP_FONTES_OFICIAIS.md`](./ROADMAP_FONTES_OFICIAIS.md) · [`CRM_ES_HOMOLOGATION_REPORT.md`](./CRM_ES_HOMOLOGATION_REPORT.md) (modelo)

### Pré-requisitos

- [ ] Fonte registrada no Official Source Registry  
- [ ] Adapter implementado (mock substituído por real)  
- [ ] Variáveis de ambiente documentadas  
- [ ] Seeds de teste definidos (CRMs, instituições, URLs)  
- [ ] Baseline do piloto capturado (cobertura, HUMAN_REVIEW, AUTO_PUBLISH)

### Etapas

| # | Etapa | Ação | Critério de saída |
|---|-------|------|-------------------|
| 1 | Configuração | Validar env vars obrigatórias | Relatório de configuração 100% válido |
| 2 | Probe real | Executar consultas contra ambiente de homologação | Taxa de sucesso ≥ 95% · latência < 500ms (CRM) |
| 3 | Discovery comparativo | Mock vs Real — mesmos seeds | Diferenças documentadas; duplicidades explicadas |
| 4 | Pipeline dry run | Discovery → Evidence → Protocol → Publication (dry) → Verification → Operations | Nenhum erro crítico; nenhum perfil publicado |
| 5 | Relatório | Gerar documento `*_HOMOLOGATION_REPORT.md` | Classificação objetiva |
| 6 | Revisão | COO + curador aprovam | Ata com decisão |

### Classificação

| Status | Critério |
|--------|----------|
| **READY_FOR_PRODUCTION** | Config OK · probe ≥ 95% · sem inconsistências críticas · dry run limpo |
| **NEEDS_IMPROVEMENT** | Config incompleta · probe < 95% · conflitos não explicados · health OFFLINE |

### Restrições

- Não alterar motores durante homologação.  
- Não publicar perfis no catálogo público.  
- Não promover para produção sem relatório aprovado.

---

## 2.2 Como tratar um Review Case

**Responsável:** Operador de ingestão (execução) · Revisor de catálogo (aprovação)  
**Onde:** Studio → Inbox (`/alicia/studio/inbox`)

### O que é um Review Case

Exceção que interrompe a automação e exige decisão humana. Origens típicas:

| Origem | Motivo comum |
|--------|--------------|
| Protocol Engine | `HUMAN_REVIEW` — regra pendente (FORM-001, FORM-002, ELIG-007, F3) |
| Publication Pipeline | `PUBLICATION_BLOCKED`, `MATERIAL_UPDATE`, `REVIEW_REQUIRED` |
| Verification | Inconsistência pós-publicação |
| Rollback | Perfil revertido — requer curadoria |

### Fluxo de resolução

```
1. TRIAGEM (15 min)
   ├── Identificar candidateId e correlationId
   ├── Ler regras pendentes e conflitos de evidência
   └── Classificar: simples | complexo | escalado

2. INVESTIGAÇÃO
   ├── Abrir Evidence Package do candidato
   ├── Cruzar fontes (nível 1–3 primeiro)
   └── Registrar achados no dossiê (Operação §3–4)

3. DECISÃO
   ├── Complementar evidência → re-submeter ao pipeline
   ├── Aprovar com ressalvas (Nível B)
   ├── Escalar ao curador (Nível A, conflito RC)
   └── Rejeitar com código e fundamento

4. RE-SUBMISSÃO
   ├── Factory resume ou run on-demand
   └── Confirmar nova decisão Protocol (AUTO_PUBLISH ou permanece HUMAN_REVIEW)

5. ENCERRAMENTO
   ├── Review Case marcado resolvido
   └── Auditoria: quem, quando, fundamento, fontes
```

### Priorização da fila

1. Confiança discovery ≥ 0,80  
2. Regras FORM-002 (residência) e ELIG-007 (RQE neuro)  
3. Rollback / inconsistência pública  
4. Demais HUMAN_REVIEW por ordem de entrada  

### SLA

| Tipo | Prazo |
|------|-------|
| Review simples (fonte disponível) | 2 dias úteis |
| Review com coleta complementar | 5 dias úteis |
| Escalado ao comitê | 5 dias úteis para primeira resposta |

### O que nunca fazer

- Forçar AUTO_PUBLISH sem evidência nível 1–3.  
- Publicar Nível A sem quatro olhos.  
- Ignorar conflito `institution_mismatch` sem RC.

---

## 2.3 Como responder a um erro de conector

**Responsável:** Integration & Operations Lead  
**Onde:** Studio → Connectors · Operations Center

### Árvore de decisão

```
Conector reportou erro
        │
        ├─ OFFLINE (sem chave / config)?
        │     → Verificar env vars → corrigir → re-probe → documentar
        │
        ├─ DEGRADED (timeout / SOAP / parcial)?
        │     → Checar latência e logs → retry após backoff
        │     → Se persiste > 1h: incidente P2
        │
        ├─ Validação (schema / campo)?
        │     → Registrar payload bruto → ticket engenharia
        │     → Operar com mock até fix (degradação graciosa)
        │
        └─ Rate limit?
              → Aguardar janela → ajustar seeds / frequência
```

### Ações imediatas (primeiros 30 min)

1. Confirmar health no Connectors Center.  
2. Identificar `correlationId` e conectores afetados.  
3. Verificar se outros conectores continuam ONLINE (isolamento).  
4. Checar variáveis de ambiente e expiração de chave.  
5. Registrar incidente com timestamp, erro, impacto estimado.  
6. Comunicar COO se fonte é crítica (CRM, CNRM).

### Métricas a capturar

| Métrica | Onde |
|---------|------|
| Taxa de sucesso | Connector metrics |
| Latência média / P95 | Connector metrics |
| Retries | Event Bus / Operations alerts |
| Timeouts | Adapter metrics |
| Erros SOAP | Homologation probe / logs |

### Recuperação

- Conector não crítico: operar degradado; priorizar na rotina semanal.  
- Conector crítico (CRM ES): war room se OFFLINE > 1h; fallback manual CRM-ES para Review Cases em andamento.  
- Após recuperação: re-run Discovery para candidatos afetados.

---

## 2.4 Como executar rollback

**Responsável:** Curador sênior (aprovação) · Integration & Operations Lead (execução técnica)  
**Referência:** [`PUBLICATION_PIPELINE_1.0.md`](./PUBLICATION_PIPELINE_1.0.md) § Rollback

### Quando acionar

| Gatilho | Automático? |
|---------|-------------|
| `PUBLICATION_INCONSISTENT` (pós-verificação) | Sim |
| Sentinela interna no perfil público | Manual |
| Denúncia com evidência grave | Manual |
| CRM irregular confirmado | Manual — urgente (24h) |
| Erro factual em campo crítico | Manual |

### Procedimento

| # | Passo | Detalhe |
|---|-------|---------|
| 1 | **Suspender** | Perfil removido do catálogo ativo (não apagar histórico) |
| 2 | **Restaurar** | Último snapshot válido (append-only) |
| 3 | **Registrar** | Evento `ROLLBACK_EXECUTED` + motivo + responsável |
| 4 | **Review Case** | Criado automaticamente no Studio Inbox |
| 5 | **Investigar** | Causa raiz: evidência, protocolo, publicação, verificação |
| 6 | **Corrigir** | Coleta complementar → nova avaliação Protocol |
| 7 | **Re-publicar** | Somente após AUTO_PUBLISH + verificação OK |

### Checklist de rollback

- [ ] Snapshot anterior identificado (hash válido)  
- [ ] Perfil público não exibe versão defeituosa  
- [ ] Evento de auditoria registrado  
- [ ] Review Case aberto e atribuído  
- [ ] COO informado se perfil tinha tráfego / relevância  
- [ ] Causa raiz documentada em 48h  

### O que o rollback preserva

- Snapshots anteriores (imutáveis)  
- Trilha de auditoria append-only  
- Histórico de versões no dossiê editorial  

### O que nunca fazer

- Apagar snapshots ou logs.  
- Re-publicar sem nova rodada Protocol + Verification.  
- Rollback silencioso sem Review Case.

---

## 2.5 Como promover uma integração para produção

**Responsável:** Integration & Operations Lead (execução) · COO (aprovação)

### Pré-requisitos

- [ ] Homologação concluída com **READY_FOR_PRODUCTION**  
- [ ] Relatório `*_HOMOLOGATION_REPORT.md` aprovado  
- [ ] Variáveis de produção configuradas (sem secrets em repositório)  
- [ ] Dry run em staging executado na semana anterior  
- [ ] Rollback plan documentado  
- [ ] Operations Center com alertas configurados para a fonte  

### Etapas de promoção

| # | Etapa | Ação |
|---|-------|------|
| 1 | Janela de mudança | Agendar fora de pico; comunicar equipe |
| 2 | Config produção | Aplicar env vars; validar com config report |
| 3 | Canary | Habilitar conector para subset de seeds (ex.: 2 CRMs) |
| 4 | Monitorar 24h | Health, latência, erros, impacto em Evidence |
| 5 | Expandir | Aumentar seeds / habilitar discovery completo |
| 6 | Atualizar registry | `ROADMAP_FONTES_OFICIAIS.md` → status **producao** |
| 7 | Baseline pós-deploy | Capturar KPIs: cobertura, HUMAN_REVIEW, AUTO_PUBLISH |
| 8 | Retrospectiva | 7 dias após promoção — lições aprendidas |

### Critérios de rollback de promoção

- Taxa de sucesso < 90% por 24h  
- Latência P95 > 2× baseline de homologação  
- Conflitos de evidência não explicados em massa  
- Incidente P1 associado à fonte  

**Ação:** desabilitar conector (`ALICIA_*_ENABLED=false`), voltar para mock, abrir incidente.

---

## 2.6 Como revisar indicadores

**Responsável:** COO (decisão) · Integration & Operations Lead (coleta)  
**Referência:** [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md)

### Cadência

| Frequência | Indicadores | Ação |
|------------|-------------|------|
| Diária | Operations Center health, alertas, bottlenecks | Triage |
| Semanal | KPI-C, KPI-Q, fila Review Cases | Priorizar ciclo |
| Mensal | KPI-O, cobertura, auditoria | Conselho de cobertura |

### Painéis por camada

| Camada | Fonte | Indicadores-chave |
|--------|-------|-------------------|
| Plataforma | Operations Center | Latência P95/P99, throughput, review rate, publication rate |
| Pipeline | Factory runs | candidatesFound, published, reviewCases, errors |
| Editorial | OPERATIONAL_DASHBOARD | KPI-Q01 (Nível A), KPI-Q07 (residência), KPI-C01 (cobertura) |
| Integrações | Connectors + Roadmap | Disponibilidade, latência, status homologação |

### Roteiro de revisão semanal (30 min)

1. **Saúde geral** — Operations Center: healthy / degraded / critical?  
2. **Maior distância da meta** — qual KPI tem maior gap? (ex.: KPI-Q07)  
3. **Uma prioridade** — definir ciclo único (qualidade ou expansão, não ambos).  
4. **Fila** — Review Cases: quantos, há quanto tempo, quem é o dono?  
5. **Conectores** — algum OFFLINE ou DEGRADED?  
6. **Decisão** — registrar no relatório semanal / Daily Ops.

### Sinais de alerta

| Sinal | Resposta |
|-------|----------|
| Review rate ≥ 2× semana anterior | Investigar regras Protocol e fontes Evidence |
| Publication rate < 80% | Checar preflight blocks e AUTO_PUBLISH |
| KPI-Q07 > 40% | Ciclo de revisão B → A antes de expansão geográfica |
| Backlog Review > 10 | Reforço temporário ou pausar novos discoveries |
| Conector crítico DEGRADED | Incidente P2 |

---

## 2.7 Como validar um novo catálogo

**Responsável:** Revisor de catálogo (execução) · Curador sênior (aprovação Nível A)  
**Referência:** [`CATALOG_QUALITY_REPORT.md`](./CATALOG_QUALITY_REPORT.md) · Catalog Factory

### Contextos

| Contexto | Exemplo |
|----------|---------|
| Ingestão seed curado | 34 perfis Epic 08 |
| Saída de Factory run | Pipeline automatizado |
| Lote geográfico novo | Expansão Viana, Colatina |
| Atualização major (v2.0) | Mudança em campo crítico |

### Procedimento de validação

| # | Etapa | Verificação |
|---|-------|-------------|
| 1 | **Dry run** | Factory `dryRun: true` — zero publicações reais |
| 2 | **Estrutural** | CRM válido, especialidade no escopo, cidade no ES |
| 3 | **Duplicatas** | Dedup por CRM + UF + hash identidade = 0 |
| 4 | **Fontes** | ≥ 2 fontes públicas por perfil; nível 1–3 para campos críticos |
| 5 | **Cobertura** | Evidence coverage ≥ meta; conflitos resolvidos ou em RC |
| 6 | **Protocol** | Decisão por candidato registrada |
| 7 | **Níveis** | A/B atribuídos conforme Protocolo Cap. 7 |
| 8 | **QA amostra** | 10% reproduzido por segundo analista |
| 9 | **Publicação** | Somente candidatos AUTO_PUBLISH entram no pipeline |
| 10 | **Pós-publicação** | Verification OK; nenhuma sentinela interna |

### Critérios de aceite

| Critério | Meta |
|----------|------|
| Duplicidades | 0 |
| Perfis sem CRM documentado | 0% |
| Conflitos abertos em publicação | 0 |
| QA reprovação | ≤ 5% |
| Cobertura evidência (pipeline) | ≥ meta da fase |
| HUMAN_REVIEW sem dono > 5 dias | 0 |

### Entregáveis

- `CATALOG_QUALITY_REPORT.md` atualizado  
- Lista de exceções (HUMAN_REVIEW) com plano  
- Aprovação COO para go-live  
- Registro de versão do catálogo (baseline pós-validação)

---

# Parte III — Checklists operacionais

## Checklist A — Abertura do dia (15 min)

- [ ] Operations Center acessível — health ≠ CRITICAL  
- [ ] Nenhum alerta `connector_offline` sem dono  
- [ ] Nenhum alerta `publication_failure` nas últimas 24h  
- [ ] Review Cases novos triados e atribuídos  
- [ ] Factory: último run COMPLETED ou explicado  
- [ ] Stand-up realizado — bloqueios documentados  

## Checklist B — Fechamento do dia (10 min)

- [ ] Snapshots Operations History persistidos  
- [ ] Incidentes do dia registrados (ou "nenhum")  
- [ ] Review Cases sem atualização > 24h têm dono  
- [ ] Conectores DEGRADED com plano de recuperação  
- [ ] Handoff para plantão (se aplicável)  

## Checklist C — Homologação de fonte

- [ ] Registro no Official Source Registry  
- [ ] Env vars validadas  
- [ ] Probe real ≥ 95% sucesso  
- [ ] Comparativo Mock vs Real documentado  
- [ ] Pipeline dry run sem publicação  
- [ ] Relatório gerado e classificado  
- [ ] Aprovação COO  

## Checklist D — Resolução de Review Case

- [ ] candidateId e correlationId identificados  
- [ ] Regras pendentes listadas  
- [ ] Evidências nível 1–3 consultadas  
- [ ] Decisão fundamentada no Protocolo  
- [ ] Re-submissão ao pipeline (se aplicável)  
- [ ] Encerramento registrado na auditoria  

## Checklist E — Promoção para produção

- [ ] READY_FOR_PRODUCTION confirmado  
- [ ] Env produção configurado  
- [ ] Canary 24h OK  
- [ ] Alertas Operations ativos  
- [ ] Roadmap atualizado  
- [ ] Baseline pós-deploy capturado  

## Checklist F — Validação de catálogo

- [ ] Dry run executado  
- [ ] Zero duplicatas  
- [ ] QA 10% aprovado  
- [ ] Verification pós-publicação OK  
- [ ] Relatório de qualidade gerado  
- [ ] Aprovação curador + COO  

---

# Parte IV — Playbooks de incidentes

## INC-01 — Conector crítico OFFLINE

| Campo | Valor |
|-------|-------|
| **Severidade** | P1 se CRM ES · P2 demais |
| **Gatilho** | Health OFFLINE > 1h |
| **Impacto** | Discovery/Evidence degradados; HUMAN_REVIEW aumenta |

**Resposta:**

1. Confirmar escopo (um vs todos os conectores).  
2. Verificar env vars e conectividade externa.  
3. Habilitar modo degradado — plataforma continua com mocks.  
4. Comunicar COO e operadores (CRM manual temporário).  
5. Re-probe após correção.  
6. Re-run Discovery para candidatos afetados.  
7. Post-mortem em 48h.

---

## INC-02 — Publicação inconsistente / Rollback

| Campo | Valor |
|-------|-------|
| **Severidade** | P1 |
| **Gatilho** | `PUBLICATION_INCONSISTENT` ou sentinela em perfil público |
| **Impacto** | Dado incorreto visível ao paciente |

**Resposta:**

1. Rollback imediato (automático ou manual).  
2. Confirmar perfil restaurado ao snapshot anterior.  
3. Abrir Review Case — prioridade máxima.  
4. Suspender AUTO_PUBLISH para o candidato até resolução.  
5. COO + curador sênior em war room se perfil de alto tráfego.  
6. Causa raiz em 24h; correção de processo em 7 dias.

---

## INC-03 — Spike de Review Cases

| Campo | Valor |
|-------|-------|
| **Severidade** | P2 |
| **Gatilho** | Review cases ≥ 2× média semanal |
| **Impacto** | Backlog humano; pipeline estagna |

**Resposta:**

1. Identificar regra bloqueante dominante (FORM-001, FORM-002, etc.).  
2. Verificar se conector de evidência falhou em massa.  
3. Priorizar fila por confiança e impacto.  
4. Avaliar se nova fonte oficial resolve (roadmap).  
5. Reforço temporário de operadores se backlog > 10.  
6. Não afrouxar Protocolo para "limpar fila".

---

## INC-04 — Retry storm / DLQ crescente

| Campo | Valor |
|-------|-------|
| **Severidade** | P2 |
| **Gatilho** | ≥ 5 retries ou DLQ ≥ 3 |
| **Impacto** | Latência elevada; runs Factory falham |

**Resposta:**

1. Pausar Factory scheduler (modo MANUAL).  
2. Identificar estágio e correlationId na Operational Timeline.  
3. Corrigir causa (conector, payload, timeout).  
4. Drenar DLQ com reprocessamento controlado.  
5. Retomar Factory com run on-demand em dry run.  
6. Reativar scheduler após 1 run limpo.

---

## INC-05 — Queda de cobertura de evidência

| Campo | Valor |
|-------|-------|
| **Severidade** | P3 |
| **Gatilho** | Cobertura cai > 10 pp em 24h |
| **Impacto** | Mais HUMAN_REVIEW; menos AUTO_PUBLISH |

**Resposta:**

1. Comparar Evidence Coverage por categoria.  
2. Identificar conector responsável pela categoria afetada.  
3. Verificar se mock substituiu real inadvertidamente.  
4. Re-executar Evidence para candidatos afetados.  
5. Documentar no relatório semanal.

---

## INC-06 — CRM irregular em perfil publicado

| Campo | Valor |
|-------|-------|
| **Severidade** | P1 |
| **Gatilho** | Verification detecta situação CRM ≠ ativa |
| **Impacto** | Perfil de médico potencialmente inelegível no ar |

**Resposta:**

1. Suspender perfil público imediatamente (rollback).  
2. Consulta manual CRM-ES para confirmação.  
3. Se confirmado irregular: manter suspenso; arquivar se Protocolo exigir.  
4. Se falso positivo: documentar e restaurar com novo snapshot.  
5. Revisar ciclo de verificação periódica (180 dias).

---

# Parte V — Comandos e artefatos de referência

## Comandos operacionais (validação)

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run alicia:crm-homologation    # homologação CRM ES
```

## Relatórios gerados

| Relatório | Quando gerar |
|-----------|--------------|
| `CRM_ES_HOMOLOGATION_REPORT.md` | Após homologação CRM |
| `PILOT_ES_REPORT.md` | Após piloto regional |
| `CATALOG_QUALITY_REPORT.md` | Após validação de catálogo |
| `REVIEW_CASE_ANALYSIS.md` | Análise periódica da fila |
| `EVIDENCE_COVERAGE_REPORT.md` | Mensal ou pós-sprint |
| `DAILY_OPS_REPORT.md` | Ciclos operacionais diários |

## Documentos canônicos

1. `PROTOCOLO_ALICIA_1.0.md` — governança  
2. `OPERACAO_ALICIA_1.0.md` — operação humana  
3. `OPERATIONAL_PLAYBOOK.md` — este documento  
4. `OPERATIONAL_DASHBOARD.md` — indicadores  

---

## Controle de versão

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-07-23 | Versão inicial — rotinas, procedimentos, checklists e incidentes |

**Próxima revisão:** 90 dias ou após primeira integração promovida para produção (CRM ES), o que ocorrer primeiro.

---

*Este playbook permite que a equipe opere a plataforma AliCIA no dia a dia sem depender de conhecimento tribal — alinhado ao Protocolo, à Operação humana e aos motores existentes.*
