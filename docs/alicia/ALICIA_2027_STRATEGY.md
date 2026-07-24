# AliCIA — Estratégia Espírito Santo Reference 2027

**Versão:** 1.0  
**Data:** 23 de julho de 2026  
**Papel:** Diretor Geral  
**Horizonte:** 12 meses (ago/2026 — jul/2027)  
**Status:** Canônico — estratégia operacional interna  
**Escopo:** empresa, catálogo, operação, parcerias — **sem software, sem UX, sem arquitetura**

**Documentos de referência (congelados):**  
[`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) · [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md) · [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md) · [`CATALOG_METRICS.md`](./CATALOG_METRICS.md) · [`MOAT_ALICIA_1.0.md`](./MOAT_ALICIA_1.0.md)

**Baseline (23/07/2026):** 34 perfis · 10/11 cidades · KPI-C01 90,9% · KPI-Q01 47,1% · KPI-Q07 50,0% · 36 instituições mapeadas

---

## Premissa estratégica

A AliCIA não vence por volume de telas. Vence por ser a **instituição que o Espírito Santo consulta quando precisa de informação verificável sobre cirurgiões** — com regras públicas, fontes rastreáveis e histórico auditável.

Nos próximos 12 meses, a engenharia permanece congelada. Todo investimento vai para **cobertura, qualidade documental, velocidade operacional e legitimidade institucional**.

---

# 1. Visão para o Espírito Santo

## 1.1 Declaração de visão

> **Até julho de 2027, a AliCIA será a referência verificável sobre ortopedistas e neurocirurgiões do Espírito Santo** — a primeira fonte que pacientes, familiares, médicos generalistas e instituições de saúde consultam quando precisam de informação estruturada, com fonte e limites explícitos, sobre quem opera no estado.

“Referência” aqui não significa “maior lista”. Significa **maior confiança verificável por unidade geográfica e especialidade**.

## 1.2 Critérios objetivos — quando saberemos que chegamos

A visão estará **atingida** quando **todos** os critérios abaixo forem verdadeiros simultaneamente:

| # | Critério | Métrica | Baseline (jul/2026) | Meta (jul/2027) | Como medir |
|---|----------|---------|---------------------|-----------------|------------|
| **R1** | Cobertura estadual prioritária | KPI-C01 (células cidade×especialidade nas 11 cidades) | 90,9% (20/22) | **≥ 100%** (22/22) | `CATALOG_METRICS` §3 |
| **R2** | Profundidade metropolitana | Perfis nas 6 cidades metro | 18 (53%) | **≥ 45 perfis** (≥60% do catálogo) | Seed + cobertura |
| **R3** | Qualidade documental | KPI-Q01 (Nível A) | 47,1% | **≥ 80%** | Classificação operacional |
| **R4** | Residência verificada | KPI-Q07 (sem residência confirmada) | 50,0% | **≤ 10%** | Seed `residency` |
| **R5** | Rastreabilidade | KPI-Q03 (média de fontes) | 5,0 | **≥ 5,5** | Seed `transparency.sources` |
| **R6** | Integridade de registro | KPI-Q04 + KPI-Q09 | 100% CRM · 0 duplicidades | **100% · 0** | Auditoria trimestral |
| **R7** | Atualidade | KPI-Q10 (revisão 180 dias) | 100% | **100%** | `lastUpdated` |
| **R8** | Velocidade operacional | KPI-O01 (lead → publicação) | N/D | **≤ 5 dias úteis** (mediana) | Timestamp `ALC-ES` |
| **R9** | Reconhecimento institucional | Parcerias formais ativas | 0 | **≥ 3** (hospital, sociedade ou universidade) | Contrato/MOU registrado |
| **R10** | Validação externa | Piloto de confiança concluído | Em preparação | **GO ou GO com ressalvas** | `PILOTO_REAL_001` |
| **R11** | Densidade institucional âncora | INEST (8 declarados vs. publicados) | 25% (2/8) | **≥ 75%** (6/8) | Corpo clínico auditável |
| **R12** | Referência citável | Menções espontâneas em contexto de escolha | 0 baseline | **≥ 5 evidências** documentadas | Pesquisa qualitativa + CRM institucional |

**Veredito de referência:** atingidos **≥ 10 de 12** critérios, incluindo obrigatoriamente **R1, R3, R4 e R10**.

## 1.3 O que “referência” não significa

| Não é | Por quê |
|-------|---------|
| Maior diretório do Brasil | Escopo é ES; profundidade > amplitude nacional |
| Recomendação de médicos | Protocolo proíbe ranking e pay-to-play |
| Catálogo fechado | Campos em verificação são feature, não bug |
| Cobertura de todas as especialidades cirúrgicas | Especialização gradual após domínio do piloto |

---

# 2. Sequência de cidades

## 2.1 Matriz de priorização (dados, não opinião)

Critérios ponderados com base no estado atual do catálogo, demografia IBGE 2024 (estimativa populacional), infraestrutura de saúde mapeada e capacidade operacional comprovada nos Ciclos 001–002 e Epic 08.

| Cidade | Prioridade AliCIA | Pop. estimada | Perfis atuais | Hospitais mapeados | Univ./residência | Concentração médica | Capacidade ops | Score |
|--------|-------------------|---------------|---------------|--------------------|------------------|---------------------|----------------|-------|
| **Vitória** | metro | ~365 mil | 14 | 12+ (HEC, Meridional, ICOT, INEST…) | EMESCAM · ICEPI | **41,2%** do catálogo | Alta (hub) | **P0** |
| **Serra** | metro | ~540 mil | 4 | Metropolitano, INEST, Meridional | EMESCAM (campus) | 11,8% | Alta | **P0** |
| **Vila Velha** | metro | ~500 mil | 2 | HINSG, Meridional | Proximidade EMESCAM | 5,9% | Média | **P1** |
| **Cariácica** | metro | ~390 mil | 2 | Meridional, HEC | Proximidade EMESCAM | 5,9% | Média | **P1** |
| **Viana** | metro | ~80 mil | **0** | A mapear | Proximidade metro | **0%** — única lacuna | Alta (ciclo curto) | **P0** |
| **Guarapari** | metro | ~130 mil | 2 | Endocenter, Jayme Santos Neves | — | 5,9% | Média (Epic 08) | **P2** |
| **Linhares** | regional | ~180 mil | 2 | Hospital Geral de Linhares | — | 5,9% | Média (Epic 08) | **P2** |
| **Colatina** | regional | ~110 mil | 2 | CEONCO, Unimed Noroeste | — | 5,9% | Média (Epic 08) | **P2** |
| **Cachoeiro** | regional | ~210 mil | 2 | Santa Casa | — | 5,9% | Média (Epic 08) | **P2** |
| **São Mateus** | regional | ~120 mil | 2 | Dr. Arnizaut Silvares | — | 5,9% | Média (Epic 08) | **P2** |
| **Aracruz** | regional | ~100 mil | 2 | São Camilo | — | 5,9% | Média (Epic 08) | **P2** |
| **Nova Venécia** | other | ~55 mil | 0 | A mapear | — | 0% | Baixa | **P3** |
| **Barra de São Francisco** | other | ~45 mil | 0 | A mapear | — | 0% | Baixa | **P3** |

**Leitura:** Vitória concentra 41,2% dos perfis porque concentra universidade médica (EMESCAM), residências (ICEPI), ICOT (7 vínculos) e Meridional (11 vínculos). Serra tem 3× a população de Viana mas apenas 4 perfis — gap de densidade, não de presença. Viana é P0 por ser a **única célula vazia** nas 11 prioritárias (KPI-C01 bloqueado em 90,9%).

## 2.2 Ordem de entrada — 12 meses

### Fase A — Fechar lacunas (meses 1–3)

| Ordem | Cidade | Ação | Justificativa |
|-------|--------|------|---------------|
| **1** | **Viana** | 2 perfis mínimo (orto + neuro) | Única lacuna KPI-C01; metro; ciclo replicável do Epic 08 |
| **2** | **Vitória** | Profundidade (+6 a +8 perfis) | Maior concentração médica do ES; 8 orto + 6 neuro ainda abaixo da saturação estimada (12–15 orto, 16–18 neuro) |
| **3** | **Serra** | Profundidade (+4 perfis) | 540 mil hab. · INEST (6 neuro fora do catálogo) · Hospital Metropolitano |

### Fase B — Densidade metro (meses 4–6)

| Ordem | Cidade | Ação | Justificativa |
|-------|--------|------|---------------|
| **4** | **Vila Velha** | +3 perfis | 500 mil hab. · apenas 2 perfis · HINSG mapeado |
| **5** | **Cariácica** | +2 perfis + elevação B→A | 390 mil hab. · 100% Nível B hoje |
| **6** | **Guarapari** | +2 perfis | Única cidade metro litorânea sem densidade; Endocenter como âncora |

### Fase C — Profundidade regional (meses 7–9)

| Ordem | Cidade | Ação | Justificativa |
|-------|--------|------|---------------|
| **7–11** | Interior (Linhares, Colatina, Cachoeiro, São Mateus, Aracruz) | +1 perfil/cidade/especialidade onde viável | Cobertura mínima já atingida; agora profundidade (2→3 por célula) |
| **12** | **INEST (transversal)** | +4 neuro Serra/Vitória | 75% gap institucional (2/8 publicados) |

### Fase D — Expansão periférica (meses 10–12)

| Ordem | Cidade | Ação | Justificativa |
|-------|--------|------|---------------|
| **13** | **Nova Venécia** | 1º perfil (especialidade com maior demanda regional) | Maior cidade `priority: other` no norte do ES |
| **14** | **Barra de São Francisco** | 1º perfil | Segundo polo `other`; complementa eixo norte |

**Regra:** nenhuma cidade `other` entra antes de KPI-C01 = 100% nas 11 prioritárias **e** KPI-Q01 ≥ 65%.

---

# 3. Especialidades prioritárias

## 3.1 Continuidade: Ortopedia e Neurocirurgia

| Fator | Ortopedia | Neurocirurgia |
|-------|-----------|---------------|
| Perfis publicados | 17 | 17 |
| Nível A | 58,8% | **35,3%** ← pior |
| Residência verificada | 58,8% | **35,3%** |
| RQE/TEOT documentado | 100% | 100% |
| Playbook operacional | Ciclos 001, 008 | Ciclos 002, 008 |
| Instituições âncora | ICOT (7), Meridional (11) | INEST (2/8), Instituto Neurocirurgia (2) |

**Por que continuam prioritárias:**

1. **Paridade operacional** — 17×17 permite comparabilidade e equilíbrio geográfico (células cidade×especialidade).
2. **Infraestrutura de verificação madura** — 100% CRM/RQE; média 5,0 fontes; zero duplicidades.
3. **Demanda clínica** — ortopedia e neurocirurgia são as especialidades cirúrgicas de maior volume de busca ativa em piloto (`PILOTO_REAL_001`).
4. **Gap de qualidade mensurável** — neurocirurgia com −44,7 pp vs meta Nível A; maior retorno de ciclos B→A.
5. **Capacidade atual** — equipe já publicou 34 perfis nas duas especialidades em 3 semanas de operação intensa.

## 3.2 Ordem de trabalho dentro das especialidades

```
1. Elevação B → A (qualidade) — especialmente neurocirurgia
2. Profundidade em células já abertas (densidade)
3. Novos perfis em células vazias (Viana)
4. Expansão institucional (INEST, ICOT, Meridional)
```

## 3.3 Quando considerar nova especialidade cirúrgica

Nova especialidade (ex.: cirurgia vascular, cirurgia torácica) **só entra** quando **todos** os gates forem atingidos:

| Gate | Limiar |
|------|--------|
| G1 — Cobertura | KPI-C01 ≥ 100% nas 11 prioritárias |
| G2 — Qualidade | KPI-Q01 ≥ 70% nas especialidades atuais |
| G3 — Residência | KPI-Q07 ≤ 15% |
| G4 — Operação | KPI-O01 medido e ≤ 7 dias úteis por 2 trimestres |
| G5 — Demanda | Evidência de ≥ 3 buscas espontâneas/mês no piloto ou parceiro institucional solicitando |
| G6 — Fontes | ≥ 2 instituições âncora identificadas com corpo clínico auditável na nova especialidade |

**Projeção realista:** avaliação de terceira especialidade no **Q4 2027** no earliest, mais provável em **2028**.

---

# 4. Metas trimestrais

## Q1 — Ago a Out 2026 · “Fechar e elevar”

| Dimensão | Meta | Métrica-alvo |
|----------|------|--------------|
| **Cobertura** | Viana coberta; KPI-C01 = 100% | 22/22 células · 36 perfis |
| **Qualidade** | 8 elevações B→A (4 orto + 4 neuro) | KPI-Q01 ≥ 55% · KPI-Q07 ≤ 40% |
| **Operação** | Instrumentar KPI-O01/O02; piloto real executado | TMP mediana ≤ 8 dias · 8 sessões piloto |
| **Métricas-chave** | Baseline formal de velocidade | 100% casos com timestamp `ALC-ES` |

**Entregas operacionais:**
- Ciclo 005 Viana (2 perfis)
- Ciclos revisão 006–008 (elevação metro neuro + orto)
- Relatório `PILOTO_REAL_001` concluído
- Biblioteca institucional ES expandida (36 → 45 instituições)

---

## Q2 — Nov 2026 a Jan 2027 · “Densidade metro”

| Dimensão | Meta | Métrica-alvo |
|----------|------|--------------|
| **Cobertura** | +12 perfis metro (Vitória, Serra, VV, Cariácica) | 48 perfis totais |
| **Qualidade** | 10 elevações B→A | KPI-Q01 ≥ 65% · KPI-Q07 ≤ 30% |
| **Operação** | 6 perfis/semana sustentáveis | KPI-O01 ≤ 6 dias úteis |
| **Métricas-chave** | INEST ≥ 50% cobertura declarada | 4/8 neuro publicados |

**Entregas operacionais:**
- Playbook INEST (ciclo institucional dedicado)
- Profundidade Vitória (+6 perfis)
- Primeira parceria formal (hospital ou sociedade médica)

---

## Q3 — Fev a Abr 2027 · “Profundidade estadual”

| Dimensão | Meta | Métrica-alvo |
|----------|------|--------------|
| **Cobertura** | Interior com ≥2 perfis/célula onde viável | 58 perfis totais |
| **Qualidade** | 12 elevações B→A acumuladas no trimestre | KPI-Q01 ≥ 72% · KPI-Q07 ≤ 20% |
| **Operação** | Revisão 180 dias sem atraso | KPI-Q10 = 100% · KPI-O08 = 0 casos >14 dias |
| **Métricas-chave** | Média de fontes | KPI-Q03 ≥ 5,3 |

**Entregas operacionais:**
- Ciclos de profundidade interior (5 cidades)
- Relatório trimestral de transparência operacional (1º)
- 2ª parceria institucional ativa

---

## Q4 — Mai a Jul 2027 · “Referência”

| Dimensão | Meta | Métrica-alvo |
|----------|------|--------------|
| **Cobertura** | Nova Venécia + Barra de SF (1 perfil cada) | 62+ perfis · 13 cidades |
| **Qualidade** | Meta anual de referência | KPI-Q01 ≥ **80%** · KPI-Q07 ≤ **10%** |
| **Operação** | Fábrica em ritmo de escala | 8–10 perfis/semana · KPI-O01 ≤ 5 dias |
| **Métricas-chave** | Critérios R1–R12 (§1.2) | ≥ 10/12 atingidos |

**Entregas operacionais:**
- Auditoria externa de amostra (10% reprodutibilidade — Operação §8)
- 3ª parceria institucional
- Relatório anual ES Reference 2027
- Decisão formal: expandir especialidade ou consolidar ES

---

# 5. OKRs 2027

## Objetivo 1 — Ser a referência verificável do ES em ortopedia e neurocirurgia

| KR | Baseline | Meta jul/2027 | Dono |
|----|----------|---------------|------|
| **KR1.1** Cobertura células prioritárias (KPI-C01) | 90,9% | **100%** | COO |
| **KR1.2** Perfis publicados no ES | 34 | **≥ 60** | Operação |
| **KR1.3** Cidades com cobertura (prioritárias + 2 other) | 10 | **13** | COO |

## Objetivo 2 — Qualidade que sustenta confiança

| KR | Baseline | Meta jul/2027 | Dono |
|----|----------|---------------|------|
| **KR2.1** Perfis Nível A (KPI-Q01) | 47,1% | **≥ 80%** | Curadoria |
| **KR2.2** Sem residência verificada (KPI-Q07) | 50,0% | **≤ 10%** | Curadoria |
| **KR2.3** Média de fontes (KPI-Q03) | 5,0 | **≥ 5,5** | Operação |
| **KR2.4** Elevações B→A no ano | 0 (Ciclo 004) | **≥ 30** | Revisão |

## Objetivo 3 — Operação previsível e escalável

| KR | Baseline | Meta jul/2027 | Dono |
|----|----------|---------------|------|
| **KR3.1** Tempo médio de publicação (KPI-O01) | N/D | **≤ 5 dias úteis** | COO |
| **KR3.2** Backlog envelhecido >14 dias (KPI-O08) | N/D | **0** | Operação |
| **KR3.3** Produtividade sustentável | ~23/semana (pico) | **8/semana** média | Operação |
| **KR3.4** Taxa de rejeição | 48,3% | **≤ 35%** (pré-triagem) | Data Ops |

## Objetivo 4 — Legitimidade institucional

| KR | Baseline | Meta jul/2027 | Dono |
|----|----------|---------------|------|
| **KR4.1** Parcerias formais ativas | 0 | **≥ 3** | Diretor Geral |
| **KR4.2** INEST cobertura auditável | 25% (2/8) | **≥ 75%** (6/8) | Operação |
| **KR4.3** Piloto de confiança | Em preparação | **GO** documentado | Pesquisa |
| **KR4.4** Satisfação piloto (confiança útil) | N/D | **≥ 70%** dos participantes | Pesquisa |

## Objetivo 5 — Construir moat informacional

| KR | Baseline | Meta jul/2027 | Dono |
|----|----------|---------------|------|
| **KR5.1** Instituições mapeadas | 36 | **≥ 55** | Operação |
| **KR5.2** Cruzamentos institucionais únicos | N/D | **≥ 100** pares médico×instituição verificados | Data Ops |
| **KR5.3** Revisões periódicas no prazo (KPI-Q10) | 100% | **100%** | Curadoria |
| **KR5.4** Incidentes de integridade (pay-to-play, dado inventado) | 0 | **0** | Diretor Geral |

---

# 6. Riscos à confiança e mitigação

| # | Risco | Probabilidade | Impacto | Sinal de alerta | Mitigação |
|---|-------|---------------|---------|-----------------|-----------|
| **R1** | Publicar formação sem fonte nível 1–3 | Média | **Crítico** | Ciclo 004: 0 elevações por bloqueio correto | Manter quatro olhos; nunca afrouxar Protocolo por meta de volume |
| **R2** | Diluição de qualidade na expansão | Alta | Alto | KPI-Q07 subiu de 42,9% → 50% pós-Epic 08 | Regra: 2 ciclos B→A para cada ciclo de expansão geográfica |
| **R3** | Lattes/CRM inacessíveis | Alta | Médio | CAPTCHA bloqueou Ciclo 004 | Canal manual CRM-ES; parceria EMESCAM/ICEPI para residências |
| **R4** | Percepção de ranking ou recomendação | Média | Alto | Piloto: participante interpreta como “melhor médico” | Reforçar linguagem de transparência; treinar moderador |
| **R5** | Pressão comercial de médicos/hospitais | Baixa | **Crítico** | Solicitação de alteração sem fonte | MOAT Cap. 8: recusa documentada; log imutável |
| **R6** | Dados desatualizados (>180 dias) | Média | Médio | KPI-Q10 < 100% | Alertas de revisão; squad dedicado trimestral |
| **R7** | Homônimos e duplicidades | Baixa | Alto | KPI-Q09 > 0 | Deduplicação na entrada (CRM + nome + cidade) |
| **R8** | Catálogo incompleto interpretado como incompetência | Alta | Médio | “Não achei meu médico” no piloto | Comunicar escopo e limites; Viana e INEST como prioridades visíveis internamente |
| **R9** | Dependência de poucas instituições | Média | Médio | Meridional em 32% dos perfis | Diversificar fontes; mapear HEC, Santa Casa, regionais |
| **R10** | Equipe operacional insuficiente | Média | Alto | KPI-O01 > 10 dias | Contratar 1 operador + 1 revisor no Q2; squad B→A dedicado |
| **R11** | Concorrente com lista maior e critério menor | Média | Médio | Diretórios com 100+ perfis sem RQE | Não competir por volume; publicar relatório de metodologia |
| **R12** | Incidente de dado incorreto publicado | Baixa | **Crítico** | Contestação com prova | Correção pública em 48h; registro no dossiê; revisão do processo |

### Plano de resposta a incidente (R12)

```
1. Suspender perfil afetado em ≤ 4h
2. Abrir caso ALC-ES-INC-AAAA-NNNNN
3. Re-verificar com fonte nível 1–3
4. Publicar correção com diff de fontes
5. QA ampliado (20%) no lote da mesma instituição
6. Relatório ao Diretor Geral em 72h
```

---

# 7. Oportunidades de aceleração

## 7.1 Parcerias institucionais (impacto alto)

| Oportunidade | Instituição | O que acelera | Pré-requisito |
|--------------|-------------|---------------|---------------|
| **O1** Corpo clínico auditável | **INEST** (8 neuro declarados) | +6 perfis neuro · KPI institucional | MOU sem pay-to-play |
| **O2** Ortopedia capixaba | **ICOT** (7 vínculos atuais) | +5 orto Vitória · fontes nível 2 | Acesso a lista oficial corpo clínico |
| **O3** Rede metro | **Hospital Meridional** (11 vínculos) | Cruzamento de vínculos · residências | Contato institucional formal |
| **O4** Residências | **EMESCAM / ICEPI** | Desbloqueio KPI-Q07 em lote | Parceria acadêmica (não endosso) |
| **O5** Interior norte | **Hospital Geral Linhares** · **Dr. Arnizaut Silvares** | Profundidade regional | Epic 08 já provou playbook |

## 7.2 Sociedades médicas (impacto médio-alto)

| Oportunidade | Entidade | O que acelera |
|--------------|----------|---------------|
| **O6** | **SBOT** (já em 17 perfis orto) | Confirmação TEOT/RQE · produção científica |
| **O7** | **SBN** (já em perfis neuro) | Validação RQE · congressos |
| **O8** | **SBOT-ES / SBN-ES** (regionais) | Legitimidade local · indicação de pares |

## 7.3 Universidades (impacto médio)

| Oportunidade | Entidade | O que acelera |
|--------------|----------|---------------|
| **O9** | **EMESCAM** | Graduação/residência de 11 neuro com graduação pendente |
| **O10** | **UFES** (programas de pós) | Produção científica · fellowships |
| **O11** | **Multivix** | Interior (Colatina, Cachoeiro) |

## 7.4 Hospitais públicos (impacto médio)

| Oportunidade | Entidade | O que acelera |
|--------------|----------|---------------|
| **O12** | **HEC** | 2 vínculos atuais → expansão neuro metro |
| **O13** | **Santa Casa Cachoeiro** | Profundidade sul do ES |
| **O14** | **Hospitals estaduais regionais** | Jayme Santos Neves, HINSG |

## 7.5 Operacionais (impacto médio, custo baixo)

| Oportunidade | O que acelera |
|--------------|---------------|
| **O15** Pré-triagem por CRM inválido | Reduz taxa de rejeição 48% → 35% |
| **O16** Biblioteca de instituições canônicas | −25 min coleta/perfil |
| **O17** Squad B→A dedicado (2 revisores) | 2 elevações/ciclo garantidas |
| **O18** Acesso humano CRM-ES presencial | Desbloqueia Ciclo 004 retomada |

## 7.6 Priorização de oportunidades

```
Impacto imediato (Q1):  O18 → O1 → O4 → O17
Consolidação (Q2–Q3):   O2 → O3 → O6 → O7
Legitimidade (Q4):      O8 → O9 → relatório transparência
```

---

# 8. Roadmap Executivo 2027

## Visão do ano em uma linha

**De catálogo piloto (34 perfis, 1 lacuna, 50% sem residência) para referência estadual verificável (60+ perfis, 100% células, 80% Nível A, 3 parcerias).**

---

## Trimestre 1 — Ago–Out 2026 · Fundação

| Mês | Iniciativa | Tipo | Resultado esperado |
|-----|------------|------|-------------------|
| Ago | Ciclo 005 Viana | Cobertura | KPI-C01 = 100% |
| Ago | Retomar Ciclo 004 (CRM manual) | Qualidade | +2 Nível A |
| Set | Piloto Real 001 (8–10 sessões) | Validação | GO/NO-GO confiança |
| Set | Instrumentação KPI-O01/O02 | Operação | TMP medido |
| Out | Ciclo INEST (fase 1) | Institucional | +2 neuro Serra |
| Out | Biblioteca institucional v2 | Operação | 45 instituições |

**Checkpoint Q1:** 38 perfis · KPI-C01 100% · KPI-Q01 ≥ 55% · piloto concluído

---

## Trimestre 2 — Nov 2026–Jan 2027 · Densidade

| Mês | Iniciativa | Tipo | Resultado esperado |
|-----|------------|------|-------------------|
| Nov | Profundidade Vitória (+4) | Cobertura | Hub ≥ 18 perfis |
| Dez | Profundidade Serra (+3) | Cobertura | INEST ≥ 4/8 |
| Dez | 1ª parceria formal (SBOT-ES ou hospital) | Legitimidade | MOU assinado |
| Jan | Vila Velha + Cariácica (+5) | Cobertura | Metro ≥ 30 perfis |
| Jan | Contratação operador + revisor | Operação | 6 perfis/semana |

**Checkpoint Q2:** 48 perfis · KPI-Q01 ≥ 65% · KPI-O01 ≤ 6 dias · 1 parceria

---

## Trimestre 3 — Fev–Abr 2027 · Profundidade

| Mês | Iniciativa | Tipo | Resultado esperado |
|-----|------------|------|-------------------|
| Fev | Ciclos interior (5 cidades × profundidade) | Cobertura | 2+ perfis/célula |
| Mar | Squad B→A em escala (10 elevações) | Qualidade | KPI-Q07 ≤ 20% |
| Mar | 2ª parceria (EMESCAM ou INEST) | Legitimidade | Acesso residências |
| Abr | Relatório transparência Q1 | Institucional | Publicação interna |
| Abr | Revisão 180 dias — 1º ciclo completo | Operação | KPI-Q10 = 100% |

**Checkpoint Q3:** 58 perfis · KPI-Q01 ≥ 72% · 2 parcerias · 0 backlog >14 dias

---

## Trimestre 4 — Mai–Jul 2027 · Referência

| Mês | Iniciativa | Tipo | Resultado esperado |
|-----|------------|------|-------------------|
| Mai | Nova Venécia + Barra de SF | Expansão | 13 cidades |
| Jun | Auditoria 10% reprodutibilidade | Qualidade | Operação §8 |
| Jun | INEST fase final (6/8) | Institucional | KR4.2 atingido |
| Jul | 3ª parceria + relatório anual | Legitimidade | Critérios R1–R12 |
| Jul | Decisão 2028: especialidade ou estado | Estratégia | Board documentado |

**Checkpoint Q4:** 62+ perfis · KPI-Q01 ≥ 80% · KPI-Q07 ≤ 10% · ≥ 10/12 critérios de referência

---

## Roadmap visual — empresa (não software)

```
jul/26          out/26          jan/27          abr/27          jul/27
  │               │               │               │               │
  ├─ Viana ───────┤               │               │               │
  ├─ Qualidade B→A ──────────────┤               │               │
  ├─ Piloto confiança ─┤          │               │               │
  │               ├─ Densidade metro ─────────────┤               │
  │               ├─ INEST ───────────────────────┤               │
  │               │               ├─ Interior depth ────────────┤
  │               │               ├─ Parcerias (3) ───────────────┤
  │               │               │               ├─ Expansão other
  │               │               │               ├─ Auditoria ───┤
  ▼               ▼               ▼               ▼               ▼
 34 perfis       38–42           48–52           55–58           62+
 90,9% cov      100% cov        65% Nível A     72% Nível A      80% Nível A
```

---

## Recursos necessários (operacionais, não engenharia)

| Papel | Hoje (estimado) | jul/2027 | Quando contratar |
|-------|-----------------|----------|------------------|
| COO / Operações | 1 | 1 | — |
| Operador ingestão | 1 | **2** | Q2 |
| Revisor catálogo | 1 | **2** | Q2 |
| Curador sênior | 1 | 1 | — |
| Data Ops (fontes) | 0,5 | **1** | Q1 |
| Pesquisa / piloto | 0,5 | 0,5 | — |
| Diretor Geral (parcerias) | 1 | 1 | — |

**Investimento operacional estimado:** foco em pessoas e acesso a fontes (CRM-ES, congressos, deslocamento interior) — **sem budget de produto**.

---

## Regras invioláveis do roadmap

1. **Nenhuma meta de volume justifica afrouxar o Protocolo.**
2. **Expansão geográfica alterna com ciclos de qualidade** (mínimo 1 ciclo B→A a cada 2 ciclos de expansão).
3. **Parcerias nunca incluem pay-to-play, ranking ou edição sem fonte.**
4. **Toda iniciativa tem KPI de antes/depois** — sem métrica, não entra.
5. **Uma prioridade por ciclo** — regra operacional herdada da Operação.

---

## Apêndice — Projeção numérica consolidada

| Indicador | jul/2026 | out/2026 | jan/2027 | abr/2027 | jul/2027 |
|-----------|----------|----------|----------|----------|----------|
| Perfis | 34 | 40 | 50 | 58 | **62+** |
| KPI-C01 | 90,9% | **100%** | 100% | 100% | 100% |
| KPI-Q01 | 47,1% | 55% | 65% | 72% | **80%** |
| KPI-Q07 | 50,0% | 40% | 30% | 20% | **10%** |
| KPI-Q03 | 5,0 | 5,1 | 5,2 | 5,4 | **5,5** |
| Instituições | 36 | 45 | 48 | 52 | **55** |
| Parcerias | 0 | 0 | 1 | 2 | **3** |
| Cidades | 10 | 11 | 11 | 11 | **13** |

---

*Documento criado na Fase 2 — Espírito Santo Reference. Nenhum código, produto, UX, Protocolo ou Operação alterados. Aguardando revisão do Diretor Geral.*
