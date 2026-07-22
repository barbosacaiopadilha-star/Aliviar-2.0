# AliCIA — Painel Operacional

**Versão:** 1.0  
**Status:** Canônico — inteligência operacional interna  
**Data:** 22 de julho de 2026  
**Público:** COO, operadores, curadoria, BI  
**Documentos de referência:** [`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) · [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md) · [`CATALOG_METRICS.md`](./CATALOG_METRICS.md)

---

## Como usar este documento

Este painel transforma dados operacionais em **decisões**.  
É **100% interno** — nenhuma métrica aqui é exibida ao paciente.  
Não altera produto, código, Protocolo ou Operação.

**Cadência recomendada:** atualização semanal (segunda-feira) + snapshot após cada ciclo operacional.

---

# Capítulo 1 — KPIs oficiais da AliCIA

## 1.1 KPIs de cobertura

| KPI | Definição | Fórmula | Valor atual (22/07/2026) | Meta GV |
|-----|-----------|---------|--------------------------|---------|
| **KPI-C01** Cobertura geográfica (prioritárias) | % de células cidade×especialidade preenchidas nas 11 cidades prioritárias | células com ≥1 perfil ÷ 22 | **31,8%** (7/22) | 90% GV¹ |
| **KPI-C02** Cobertura Grande Vitória | Idem, restrito às 4 cidades metro | células ÷ 8 | **87,5%** (7/8) | 90% |
| **KPI-C03** Cidades com ≥1 perfil | Cidades prioritárias com qualquer especialidade | contagem | **4/11** (36,4%) | 4/4 GV |
| **KPI-C04** Cobertura por especialidade (ES) | Perfis publicados vs. estimativa de demanda² | absoluto | Ortopedia **10** · Neuro **11** | Ver metas §2 |
| **KPI-C05** Perfis publicados (total) | Médicos no catálogo com status publicado | contagem | **21** | — |

¹ Meta 90% aplica-se primeiro à Grande Vitória; interior tem metas escalonadas (§2).  
² Estimativa de demanda ainda não calibrada — KPI em modo absoluto até piloto.

## 1.2 KPIs de qualidade de perfil

| KPI | Definição | Valor atual | Meta GV |
|-----|-----------|-------------|---------|
| **KPI-Q01** Perfis Nível A | % com formação majoritariamente confirmada | **52,4%** (11/21) | 80% |
| **KPI-Q02** Perfis Nível B | % elegíveis com campos em verificação | **47,6%** (10/21) | ≤ 20% (estável) |
| **KPI-Q03** Média de fontes por perfil | Soma de fontes ÷ perfis | **4,33** | ≥ 5,0 |
| **KPI-Q04** Perfis com CRM documentado | Fonte nível 1 presente | **100%** | 100% |
| **KPI-Q05** Perfis com RQE/TEOT | Registro de especialista | **100%** | 100% |
| **KPI-Q06** Perfis com fonte institucional | Fonte nível 2–3 | **100%** | 100% |
| **KPI-Q07** Perfis sem residência verificada | Residência ausente ou não confirmada | **42,9%** (9/21) | ≤ 10% |
| **KPI-Q08** Perfis aguardando revisão | Nível B com pendência de formação | **10** | ≤ 5 |
| **KPI-Q09** Duplicidades | Perfis com CRM ou ID duplicado | **0** | 0 |
| **KPI-Q10** Revisão periódica (180 dias) | `lastUpdated` ≤ 180 dias | **100%** | 100% |

## 1.3 KPIs de operação

| KPI | Definição | Valor atual | Instrumentação |
|-----|-----------|-------------|----------------|
| **KPI-O01** Tempo médio de publicação | Lead → publicação | **N/D**³ | Manual (ciclos) |
| **KPI-O02** Tempo médio de verificação | Coleta → Nível A ou B | **N/D**³ | Manual (ciclos) |
| **KPI-O03** Backlog de casos | Leads + rejeitados para reavaliação | **17**⁴ | Planilha de ciclo |
| **KPI-O04** Fila de triagem | Casos `LEAD — Aguardando triagem` | **0**⁵ | Operação futura |
| **KPI-O05** Produtividade semanal | Perfis publicados / semana | **11**⁶ | Ciclos 001+002 |
| **KPI-O06** Taxa de rejeição | Rejeitados ÷ analisados | **44,7%** (17/38) | Ciclos 001+002 |
| **KPI-O07** Instituições mapeadas | Instituições distintas no catálogo | **18** | Seed |
| **KPI-O08** Tempo parado (backlog envelhecido) | Casos > 14 dias sem movimento | **N/D** | Aguardando CRM operacional |

³ KPIs O01/O02 exigem timestamps por caso (`ALC-ES-AAAA-NNNNN`). Baseline será coletado a partir do Ciclo 003.  
⁴ 8 rejeitados (Ciclo 001) + 9 rejeitados (Ciclo 002).  
⁵ Nenhum caso formal aberto fora dos ciclos concluídos.  
⁶ Semana de 22/07/2026: +5 ortopedia, +6 neurocirurgia.

---

# Capítulo 2 — Metas

## 2.1 Grande Vitória (Vitória · Vila Velha · Serra · Cariacica)

| Meta | Indicador | Alvo | Atual | Status |
|------|-----------|------|-------|--------|
| **M-GV-01** Cobertura mínima | KPI-C02 | **90%** | 87,5% | 🟡 Quase |
| **M-GV-02** Perfis Nível A | KPI-Q01 | **80%** | 52,4% | 🔴 Abaixo |
| **M-GV-03** Fontes médias | KPI-Q03 | **≥ 5,0** | 4,33 | 🟡 Quase |
| **M-GV-04** Tempo de publicação | KPI-O01 | **< 5 dias úteis** | N/D | ⚪ Sem medição |
| **M-GV-05** Célula Cariacica ortopedia | KPI-C02 | **1 perfil** | 0 | 🔴 Lacuna |
| **M-GV-06** CRM em 100% dos perfis | KPI-Q04 | **100%** | 100% | 🟢 OK |
| **M-GV-07** Zero duplicidade | KPI-Q09 | **0** | 0 | 🟢 OK |

## 2.2 Interior e regional (7 cidades sem perfil)

| Meta | Alvo | Prazo sugerido |
|------|------|----------------|
| **M-INT-01** Primeiro perfil em Guarapari | 1 ortopedista ou neurocirurgião Nível B+ | Ciclo 004 |
| **M-INT-02** Cobertura regional (Linhares, Colatina, Cachoeiro, São Mateus) | ≥ 1 perfil por cidade | Ciclos 005–008 |
| **M-INT-03** Aracruz e Viana | ≥ 1 perfil cada | Ciclo 005 |

## 2.3 Qualidade sustentada

| Meta | Alvo |
|------|------|
| **M-QLT-01** Revisão periódica | 100% dos perfis revisados a cada 180 dias |
| **M-QLT-02** Elevação Nível B → A | ≥ 2 perfis por ciclo de revisão |
| **M-QLT-03** Residência verificada | Reduzir KPI-Q07 de 42,9% para ≤ 10% em 90 dias |

---

# Capítulo 3 — Indicadores por cidade

Escala: 🟢 meta atingida ou cobertura completa · 🟡 parcial · 🔴 sem cobertura

| Cidade | Ortopedia | Neurocirurgia | Nível A | Nível B | Fontes médias | Status |
|--------|-----------|---------------|---------|---------|---------------|--------|
| **Vitória** | 8 | 6 | 9 | 5 | 4,4 | 🟢 Hub principal |
| **Vila Velha** | 1 | 1 | 0 | 2 | 4,0 | 🟡 Baixa densidade |
| **Serra** | 1 | 3 | 2 | 2 | 4,8 | 🟢 Neuro forte |
| **Cariacica** | 0 | 1 | 0 | 1 | 5,0 | 🟡 Lacuna ortopedia |
| **Guarapari** | 0 | 0 | — | — | — | 🔴 Vazio |
| **Viana** | 0 | 0 | — | — | — | 🔴 Vazio |
| **Linhares** | 0 | 0 | — | — | — | 🔴 Vazio |
| **Colatina** | 0 | 0 | — | — | — | 🔴 Vazio |
| **Cachoeiro de Itapemirim** | 0 | 0 | — | — | — | 🔴 Vazio |
| **São Mateus** | 0 | 0 | — | — | — | 🔴 Vazio |
| **Aracruz** | 0 | 0 | — | — | — | 🔴 Vazio |

**Leitura:** Vitória concentra **66,7%** dos perfis (14/21). Interior representa **0%** — maior gap estrutural do piloto ES.

---

# Capítulo 4 — Indicadores por especialidade

## Ortopedia

| Indicador | Valor | Meta | Gap |
|-----------|-------|------|-----|
| Perfis publicados | 10 | Saturação GV: ~12–15¹ | +2 a +5 |
| Nível A | 70% | 80% | −10 pp |
| Nível B | 30% | ≤ 20% | +10 pp |
| Fontes médias | 3,90 | 5,0 | −1,10 |
| Cidades cobertas | 3/11 | 4/4 GV | Cariacica ❌ |
| Instituição âncora | ICOT (7 perfis) | — | Forte |

¹ Saturação estimada a partir do corpo clínico ICOT + hospitais metro — não é teto de mercado.

## Neurocirurgia

| Indicador | Valor | Meta | Gap |
|-----------|-------|------|-----|
| Perfis publicados | 11 | Saturação GV: ~16–18¹ | +5 a +7 |
| Nível A | 36% | 80% | −44 pp |
| Nível B | 64% | ≤ 20% | +44 pp |
| Fontes médias | 4,73 | 5,0 | −0,27 |
| Cidades cobertas | 4/11 | 4/4 GV | OK em GV |
| Instituições âncora | INEST (2) · Instituto Neurocirurgia (2) · Meridional (10) | — | INEST subexplorado |

¹ INEST declara 8 neurocirurgiões; apenas 2 no catálogo com fonte auditável.

---

# Capítulo 5 — Indicadores de qualidade

## Painel de saúde do catálogo

| Sinal | Valor | Severidade | Ação |
|-------|-------|------------|------|
| Duplicidades | 0 | 🟢 | Manter deduplicação na ingestão |
| Campos pendentes (qualquer) | 21/21 | 🟡 | Esperado — produção científica e períodos em todos |
| Campos críticos pendentes (graduação/residência) | 9 perfis | 🔴 | Ciclo de revisão dedicado |
| Perfis sem RQE | 0 | 🟢 | — |
| Perfis sem residência verificada | 9 | 🔴 | Priorizar fontes Lattes/CNES/instituição |
| Perfis sem fonte institucional | 0 | 🟢 | — |
| Aguardando revisão (Nível B) | 10 | 🟡 | Meta: reduzir 2/ciclo |
| Perfis só com diretório (nível 6) | 0 | 🟢 | Política dos ciclos 001–002 |

## Ranking de pendências por impacto

1. **9 perfis** — graduação e/ou residência não confirmadas (bloqueio para Nível A)
2. **Cariacica** — zero ortopedistas (bloqueio KPI-C02 → 90%)
3. **INEST** — 6 neurocirurgiões estimados fora do catálogo (bloqueio cobertura neuro)
4. **Charles Takasaki** — TEOT sem RQE explícito (aceito pelo protocolo; monitorar)

---

# Capítulo 6 — Indicadores de operação

## Backlog atual (derivado dos ciclos 001 e 002)

| Fila | Itens | Origem |
|------|-------|--------|
| Rejeitados para reavaliação | 17 | 8 (Ciclo 001) + 9 (Ciclo 002) |
| Pendências explícitas Ciclo 003 | 8 | Relatórios operacionais |
| Perfis Nível B para elevação | 10 | Catálogo |
| Lacunas geográficas (cidades vazias) | 7 | CATALOG_METRICS §3 |

## Produtividade (semana 22/07/2026)

| Ciclo | Especialidade | Analisados | Publicados | Rejeitados | Δ catálogo |
|-------|---------------|------------|------------|------------|------------|
| 001 | Ortopedia | 18 | 5 novos + 5 mantidos | 8 | +5 |
| 002 | Neurocirurgia | 20 | 6 novos + 5 fortalecidos | 9 | +6 |
| **Total** | — | **38** | **11 líquidos** | **17** | **+11** |

## SLAs da Operação AliCIA (referência — não medidos automaticamente ainda)

| Etapa | SLA | Status instrumentação |
|-------|-----|------------------------|
| Entrada → triagem | ≤ 1 dia útil | ⚪ |
| Triagem → coleta | ≤ 3 dias úteis | ⚪ |
| Coleta → revisão | conforme complexidade | ⚪ |
| Publicação Nível B | após checklist Operação §F | ✅ Manual |
| Revisão periódica | 180 dias | ✅ `lastUpdated` no seed |

---

# Capítulo 7 — Relatório executivo semanal

## Semana de 22 de julho de 2026

### Veredito: **MELHOR** que a semana anterior

| Dimensão | Semana anterior (baseline piloto) | Esta semana | Δ |
|----------|-----------------------------------|-------------|---|
| Perfis publicados | 10 | **21** | **+110%** |
| Ortopedia GV | 5 | 10 | +100% |
| Neurocirurgia GV | 5 | 11 | +120% |
| Média de fontes | ~2,0 | **4,33** | **+116%** |
| CRM documentado | ~10% | **100%** | +90 pp |
| Cobertura GV (células) | 50% (4/8) | **87,5%** (7/8) | +37,5 pp |
| Nível A | ~5 (estimado) | **11** | +6 |
| Cidades com perfil | 4 | 4 | = |

### Justificativa (métricas, não opinião)

1. **Volume:** +11 perfis líquidos em dois ciclos na mesma semana — maior expansão desde o piloto.
2. **Confiança:** média de fontes subiu de ~2,0 para 4,33; todos os perfis passaram a ter CRM/RQE documentados após Ciclo 002.
3. **Cobertura metro:** células preenchidas subiram de 50% para 87,5%; falta apenas **ortopedia em Cariacica** para atingir 100% GV.
4. **Qualidade relativa:** Nível A subiu de ~50% para 52,4% em volume absoluto (+6 perfis), mas **percentual de Nível A ainda abaixo da meta** (52,4% vs. 80%) — neurocirurgia puxa o gap (36% Nível A).

### O que piorou ou estagnou

- **Taxa de rejeição alta (44,7%)** — esperada em fase de rigor protocolar; backlog de 17 casos.
- **Interior permanece 0%** — nenhuma das 7 cidades regionais recebeu perfil.
- **KPI-Q07 (residência)** permanece crítico: 42,9% sem residência verificada.

### Decisão executiva da semana

Continuar expansão **dentro da Grande Vitória** antes de abrir interior — métrica KPI-C02 (87,5%) está mais próxima da meta que KPI-C01 (31,8%).

---

# Capítulo 8 — Roadmap operacional

## Regra de priorização

Ordem determinística (nunca por opinião):

```
1. Células GV vazias (cidade × especialidade)
2. Maior gap de Nível A na especialidade com pior KPI-Q01
3. Instituição âncora com menor cobertura auditável
4. Cidades metro restantes sem perfil
5. Cidades regional prioritárias (ES_CITIES priority = regional)
```

## Próximo ciclo recomendado

### **Ciclo Operacional 003 — Cariacica + Revisão Nível B**

| Campo | Valor | Motivo métrico |
|-------|-------|----------------|
| **Cidade primária** | Cariacica | Única célula GV vazia (ortopedia) — desbloqueia KPI-C02 → **100%** |
| **Especialidade primária** | Ortopedia | Neuro já presente (1 perfil); ortopedia = 0 |
| **Objetivo secundário** | Elevar 2 perfis Nível B → A | Meta M-QLT-02; neuro tem pior KPI-Q01 (36%) |
| **Alvos de revisão** | `andre-faria-teixeira`, `paulo-melo-jacques` | Nível B + fontes institucionais já presentes; menor esforço marginal |

**KPIs esperados pós-Ciclo 003:**

| KPI | Atual | Projetado |
|-----|-------|-----------|
| KPI-C02 (GV) | 87,5% | **100%** |
| Ortopedia Cariacica | 0 | ≥ 1 |
| Nível A | 52,4% | ~57% (+1 orto A + 1 neuro A) |

## Fila dos ciclos 004–008 (derivada de métricas)

| Ciclo | Foco | Gatilho métrico |
|-------|------|-----------------|
| **004** | Neurocirurgia · INEST (Serra) | INEST: 8 declarados vs. 2 publicados (−75% cobertura institucional) |
| **005** | Ortopedia · Guarapari | Primeira cidade metro sem perfil (M-INT-01) |
| **006** | Neurocirurgia · Vila Velha densidade | Apenas 2 perfis totais; KPI densidade mais baixo |
| **007** | Ortopedia · Linhares | Maior cidade regional sem perfil |
| **008** | Neurocirurgia · Colatina | Segunda regional; paridade orto/neuro no interior |

## O que NÃO fazer agora (métricas contra-indicam)

| Ação | Por quê (métrica) |
|------|-------------------|
| Abrir novo estado | KPI-C01 ES = 31,8% — GV incompleto |
| Priorizar interior antes de Cariacica ortopedia | KPI-C02 perde 12,5% para meta 90% por 1 célula |
| Publicar só com Doctoralia | 17 rejeitados nos ciclos 001–002 por fonte insuficiente |
| Meta 80% Nível A antes de revisar 9 perfis sem residência | KPI-Q07 = 42,9% — base frágil |

---

## Apêndice A — Matriz de responsabilidade dos KPIs

| KPI | Dono | Frequência | Fonte |
|-----|------|------------|-------|
| Cobertura (C01–C05) | COO | Semanal | CATALOG_METRICS §3 |
| Qualidade (Q01–Q10) | Curador sênior | Semanal | Seed + revisão |
| Operação (O01–O08) | Operador ingestão | Semanal | Casos ALC-ES |
| Executivo (Cap. 7) | COO | Semanal | Comparativo snapshot |
| Roadmap (Cap. 8) | COO + BI | Pós-ciclo | Este documento |

## Apêndice B — Próxima instrumentação (fora do escopo desta Epic)

Esta Epic entrega **documentação apenas**. Para medir KPI-O01/O02/O08 automaticamente no futuro:

- Timestamp por transição de caso (`doctor-lifecycle`)
- Export semanal do backlog para `CATALOG_METRICS.md`
- Job `npm run alicia:metrics` (futuro) — **não implementado nesta Epic**

---

*Documento criado na Epic 06 — Inteligência Operacional. Nenhum código alterado. Aguardando revisão.*
