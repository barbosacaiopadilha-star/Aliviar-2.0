# AliCIA — Painel Operacional

**Versão:** 1.1  
**Status:** Canônico — inteligência operacional interna  
**Data:** 23 de julho de 2026  
**Última sincronização:** Autonomous Operation — Ciclo 004 (pesquisa KPI-Q07)  
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

| KPI | Definição | Fórmula | Valor atual (23/07/2026) | Meta GV |
|-----|-----------|---------|--------------------------|---------|
| **KPI-C01** Cobertura geográfica (prioritárias) | % de células cidade×especialidade preenchidas nas 11 cidades prioritárias | células com ≥1 perfil ÷ 22 | **90,9%** (20/22) | 90% GV¹ |
| **KPI-C02** Cobertura Grande Vitória | Idem, restrito às 4 cidades metro | células ÷ 8 | **100%** (8/8) | 90% |
| **KPI-C03** Cidades com ≥1 perfil | Cidades prioritárias com qualquer especialidade | contagem | **10/11** (90,9%) | 4/4 GV |
| **KPI-C04** Cobertura por especialidade (ES) | Perfis publicados vs. estimativa de demanda² | absoluto | Ortopedia **17** · Neuro **17** | Ver metas §2 |
| **KPI-C05** Perfis publicados (total) | Médicos no catálogo com status publicado | contagem | **34** | — |

¹ Meta 90% aplica-se primeiro à Grande Vitória; interior tem metas escalonadas (§2).  
² Estimativa de demanda ainda não calibrada — KPI em modo absoluto até piloto.

## 1.2 KPIs de qualidade de perfil

| KPI | Definição | Valor atual | Meta GV |
|-----|-----------|-------------|---------|
| **KPI-Q01** Perfis Nível A | % com formação majoritariamente confirmada | **47,1%** (16/34) | 80% |
| **KPI-Q02** Perfis Nível B | % elegíveis com campos em verificação | **52,9%** (18/34) | ≤ 20% (estável) |
| **KPI-Q03** Média de fontes por perfil | Soma de fontes ÷ perfis | **5,0** | ≥ 5,0 |
| **KPI-Q04** Perfis com CRM documentado | Fonte nível 1 presente | **100%** | 100% |
| **KPI-Q05** Perfis com RQE/TEOT | Registro de especialista | **100%** | 100% |
| **KPI-Q06** Perfis com fonte institucional | Fonte nível 2–3 | **100%** | 100% |
| **KPI-Q07** Perfis sem residência verificada | Residência ausente ou não confirmada | **50,0%** (17/34) | ≤ 10% |
| **KPI-Q08** Perfis aguardando revisão | Nível B com pendência de formação | **18** | ≤ 5 |
| **KPI-Q09** Duplicidades | Perfis com CRM ou ID duplicado | **0** | 0 |
| **KPI-Q10** Revisão periódica (180 dias) | `lastUpdated` ≤ 180 dias | **100%** | 100% |

## 1.3 KPIs de operação

| KPI | Definição | Valor atual | Instrumentação |
|-----|-----------|-------------|----------------|
| **KPI-O01** Tempo médio de publicação | Lead → publicação | **N/D**³ | Manual (ciclos) |
| **KPI-O02** Tempo médio de verificação | Coleta → Nível A ou B | **N/D**³ | Manual (ciclos) |
| **KPI-O03** Backlog de casos | Leads + rejeitados para reavaliação | **43**⁴ | Planilha de ciclo |
| **KPI-O04** Fila de triagem | Casos `LEAD — Aguardando triagem` | **0**⁵ | Operação futura |
| **KPI-O05** Produtividade semanal | Perfis publicados / semana | **23**⁶ | Ciclos 001+002+Epic 08 |
| **KPI-O06** Taxa de rejeição | Rejeitados ÷ analisados | **48,3%** (40/83) | Ciclos 001+002+Epic 08 |
| **KPI-O07** Instituições mapeadas | Instituições distintas no catálogo | **36** | Seed |
| **KPI-O08** Tempo parado (backlog envelhecido) | Casos > 14 dias sem movimento | **N/D** | Aguardando CRM operacional |

³ KPIs O01/O02 exigem timestamps por caso (`ALC-ES-AAAA-NNNNN`). Baseline será coletado a partir do Ciclo 003.  
⁴ 8+9 (Ciclos 001–002) + 26 (Epic 08).  
⁵ Nenhum caso formal aberto fora dos ciclos concluídos.  
⁶ Semana de 22/07/2026: +5 ortopedia, +6 neurocirurgia, +12 interior (Epic 08).

---

# Capítulo 2 — Metas

## 2.1 Grande Vitória (Vitória · Vila Velha · Serra · Cariacica)

| Meta | Indicador | Alvo | Atual | Status |
|------|-----------|------|-------|--------|
| **M-GV-01** Cobertura mínima | KPI-C02 | **90%** | **100%** | 🟢 OK |
| **M-GV-02** Perfis Nível A | KPI-Q01 | **80%** | 47,1% | 🔴 Abaixo |
| **M-GV-03** Fontes médias | KPI-Q03 | **≥ 5,0** | **5,0** | 🟢 OK |
| **M-GV-04** Tempo de publicação | KPI-O01 | **< 5 dias úteis** | N/D | ⚪ Sem medição |
| **M-GV-05** Célula Cariacica ortopedia | KPI-C02 | **1 perfil** | **1** | 🟢 OK |
| **M-GV-06** CRM em 100% dos perfis | KPI-Q04 | **100%** | 100% | 🟢 OK |
| **M-GV-07** Zero duplicidade | KPI-Q09 | **0** | 0 | 🟢 OK |

## 2.2 Interior e regional

| Meta | Alvo | Prazo sugerido | Status |
|------|------|-----------------|--------|
| **M-INT-01** Primeiro perfil em Guarapari | 1 ortopedista ou neurocirurgião Nível B+ | Ciclo 004 | 🟢 Concluído (Epic 08) |
| **M-INT-02** Cobertura regional (Linhares, Colatina, Cachoeiro, São Mateus) | ≥ 1 perfil por cidade | Ciclos 005–008 | 🟢 Concluído (Epic 08) |
| **M-INT-03** Aracruz e Viana | ≥ 1 perfil cada | Ciclo 005 | 🟡 Aracruz OK · **Viana pendente** |

## 2.3 Qualidade sustentada

| Meta | Alvo |
|------|------|
| **M-QLT-01** Revisão periódica | 100% dos perfis revisados a cada 180 dias |
| **M-QLT-02** Elevação Nível B → A | ≥ 2 perfis por ciclo de revisão |
| **M-QLT-03** Residência verificada | Reduzir KPI-Q07 de 50,0% para ≤ 10% em 90 dias |

---

# Capítulo 3 — Indicadores por cidade

Escala: 🟢 meta atingida ou cobertura completa · 🟡 parcial · 🔴 sem cobertura

| Cidade | Ortopedia | Neurocirurgia | Nível A | Nível B | Fontes médias | Status |
|--------|-----------|---------------|---------|---------|---------------|--------|
| **Vitória** | 8 | 6 | 9 | 5 | 4,76 | 🟢 Hub principal |
| **Vila Velha** | 1 | 1 | 0 | 2 | 4,0 | 🟡 Baixa densidade |
| **Serra** | 1 | 3 | 2 | 2 | 4,8 | 🟢 Neuro forte |
| **Cariácica** | 1 | 1 | 0 | 2 | 5,0 | 🟢 Cobertura completa |
| **Guarapari** | 1 | 1 | 1 | 1 | 5,0 | 🟢 Interior |
| **Linhares** | 1 | 1 | 0 | 2 | 5,0 | 🟢 Interior |
| **Colatina** | 1 | 1 | 1 | 1 | 5,0 | 🟢 Interior |
| **Cachoeiro de Itapemirim** | 1 | 1 | 0 | 2 | 5,0 | 🟢 Interior |
| **São Mateus** | 1 | 1 | 0 | 2 | 5,0 | 🟢 Interior |
| **Aracruz** | 1 | 1 | 0 | 2 | 5,0 | 🟢 Interior |
| **Viana** | 0 | 0 | — | — | — | 🔴 **Única lacuna** |

**Leitura:** Vitória concentra **41,2%** dos perfis (14/34). Interior passou de 0% para **58,8%** dos perfis (20/34) após Epic 08. **Viana** é a única cidade prioritária sem cobertura.

---

# Capítulo 4 — Indicadores por especialidade

## Ortopedia

| Indicador | Valor | Meta | Gap |
|-----------|-------|------|-----|
| Perfis publicados | 17 | Saturação GV: ~12–15¹ | — |
| Nível A | 58,8% | 80% | −21,2 pp |
| Nível B | 41,2% | ≤ 20% | +21,2 pp |
| Fontes médias | 4,76 | 5,0 | −0,24 |
| Cidades cobertas | 10/11 | 4/4 GV | Viana ❌ |
| Instituição âncora | ICOT (7 perfis) | — | Forte |

¹ Saturação estimada a partir do corpo clínico ICOT + hospitais metro — não é teto de mercado.

## Neurocirurgia

| Indicador | Valor | Meta | Gap |
|-----------|-------|------|-----|
| Perfis publicados | 17 | Saturação GV: ~16–18¹ | — |
| Nível A | 35,3% | 80% | −44,7 pp |
| Nível B | 64,7% | ≤ 20% | +44,7 pp |
| Fontes médias | 5,24 | 5,0 | ✅ |
| Cidades cobertas | 10/11 | 4/4 GV | Viana ❌ |
| Instituições âncora | INEST (2) · Instituto Neurocirurgia (2) · Meridional (10) | — | INEST subexplorado |

¹ INEST declara 8 neurocirurgiões; apenas 2 no catálogo com fonte auditável.

---

# Capítulo 5 — Indicadores de qualidade

## Painel de saúde do catálogo

| Sinal | Valor | Severidade | Ação |
|-------|-------|------------|------|
| Duplicidades | 0 | 🟢 | Manter deduplicação na ingestão |
| Campos pendentes (qualquer) | 34/34 | 🟡 | Esperado — produção científica e períodos em todos |
| Campos críticos pendentes (graduação/residência) | 18 perfis | 🔴 | Ciclo 004 em andamento |
| Perfis sem RQE | 0 | 🟢 | — |
| Perfis sem residência verificada | 17 | 🔴 | Priorizar fontes CRM/Lattes/instituição |
| Perfis sem fonte institucional | 0 | 🟢 | — |
| Aguardando revisão (Nível B) | 18 | 🔴 | Meta: reduzir 2/ciclo |
| Perfis só com diretório (nível 6) | 0 | 🟢 | Política dos ciclos 001–002 |

## Ranking de pendências por impacto

1. **17 perfis** — residência não verificada (KPI-Q07 = 50,0%) — **pior KPI**
2. **18 perfis** — graduação pendente (KPI-Q01 bloqueado)
3. **Viana** — única cidade prioritária sem perfil (2 células vazias)
4. **INEST** — 6 neurocirurgiões estimados fora do catálogo

---

# Capítulo 6 — Indicadores de operação

## Backlog atual (derivado dos ciclos 001, 002 e Epic 08)

| Fila | Itens | Origem |
|------|-------|--------|
| Rejeitados para reavaliação | 17 | 8 (Ciclo 001) + 9 (Ciclo 002) |
| Pendências explícitas Ciclo 003 | 8 | Relatórios operacionais |
| Perfis Nível B para elevação | 18 | Catálogo (pós-Epic 08) |
| Lacunas geográficas (cidades vazias) | **1** (Viana) | CATALOG_METRICS §3 |

## Produtividade (semana 22–23/07/2026)

| Ciclo | Especialidade | Analisados | Publicados | Rejeitados | Δ catálogo |
|-------|---------------|------------|------------|------------|------------|
| 001 | Ortopedia | 18 | 5 novos + 5 mantidos | 8 | +5 |
| 002 | Neurocirurgia | 20 | 6 novos + 5 fortalecidos | 9 | +6 |
| Epic 08 | Interior ES | 26 | 13 novos | 13 | +13 |
| **004** | Neuro metro (revisão) | 2 | **0 elevados** | 0 | **0** (pesquisa bloqueada) |
| **Total** | — | **66** | **34 líquidos** | **30** | **+24** |

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

## Semana de 22–23 de julho de 2026

### Veredito: **MELHOR** que a semana anterior (expansão) · **ESTÁVEL** em qualidade

| Dimensão | Semana anterior (pós-Ciclo 002) | Esta semana (pós-Epic 08 + Ciclo 004) | Δ |
|----------|-----------------------------------|----------------------------------------|---|
| Perfis publicados | 21 | **34** | **+61,9%** |
| Ortopedia | 10 | **17** | +70% |
| Neurocirurgia | 11 | **17** | +54,5% |
| Média de fontes | 4,33 | **5,0** | +15,5% |
| CRM documentado | 100% | **100%** | = |
| Cobertura GV (células) | 87,5% (7/8) | **100%** (8/8) | +12,5 pp |
| Cobertura estadual (células) | 50% (11/22) | **90,9%** (20/22) | +40,9 pp |
| Nível A | 52,4% (11/21) | **47,1%** (16/34) | −5,3 pp¹ |
| Cidades com perfil | 4 | **10** | +6 |
| KPI-Q07 (sem residência) | 42,9% | **50,0%** | +7,1 pp² |

¹ Diluição esperada: 13 novos perfis Nível B no Epic 08.  
² Pior KPI absoluto — Ciclo 004 não elevou perfis por falta de fontes nível 1–3.

### Justificativa (métricas, não opinião)

1. **Volume:** Epic 08 adicionou +13 perfis no interior — maior expansão geográfica do piloto ES.
2. **Cobertura:** Grande Vitória atingiu **100%** das células; apenas **Viana** permanece vazia.
3. **Confiança:** média de fontes atingiu meta (**5,0**); CRM/RQE em 100%.
4. **Qualidade:** KPI-Q07 **piorou em pontos percentuais** com a entrada de perfis B do interior — Ciclo 004 (revisão neuro metro) **não concluiu elevações** por bloqueio de fontes (Lattes CAPTCHA; graduação/residência não confirmáveis em nível 1–3).

### O que piorou ou estagnou

- **KPI-Q07 = 50,0%** — pior KPI; meta ≤ 10% (gap +40 pp).
- **KPI-Q01 = 47,1%** — abaixo da meta 80% (−32,9 pp).
- **Ciclo 004:** 0 elevações B → A (pesquisa concluída, publicação bloqueada por protocolo).

### Decisão executiva da semana

Priorizar **Ciclo 005 — Viana** (única lacuna geográfica) **ou** retomar Ciclo 004 com operador humano para CRM-ES/Lattes manual. Qualidade (KPI-Q07) permanece crítica, mas expansão em Viana desbloqueia KPI-C01 → **100%** estadual.

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

### **Ciclo Operacional 005 — Viana (expansão geográfica)**

| Campo | Valor | Motivo métrico |
|-------|-------|----------------|
| **Cidade primária** | Viana | Única cidade prioritária sem perfil — desbloqueia KPI-C01 → **100%** (22/22) |
| **Especialidade primária** | Ortopedia + Neurocirurgia | 2 células vazias |
| **Objetivo secundário** | Retomar Ciclo 004 com fontes manuais | KPI-Q07 = 50,0% — gap +40 pp |
| **Gatilho** | KPI-C01 em 90,9% — Viana = único bloqueio estadual | M-INT-03 |

**KPIs esperados pós-Ciclo 005:**

| KPI | Atual | Projetado |
|-----|-------|-----------|
| KPI-C01 (estadual) | 90,9% | **100%** |
| KPI-C03 (cidades) | 10/11 | **11/11** |
| Perfis publicados | 34 | **36** (+2 mínimo) |

## Fila dos ciclos 006–009 (derivada de métricas)

| Ciclo | Foco | Gatilho métrico |
|-------|------|-----------------|
| **004** | Neuro metro B → A | ✅ Pesquisa concluída — **0 elevações** (fontes insuficientes) |
| **005** | Viana (orto + neuro) | Única lacuna geográfica (M-INT-03) |
| **006** | Neurocirurgia · INEST (Serra) | INEST: 8 declarados vs. 2 publicados |
| **007** | Revisão Nível B · lote 2 | KPI-Q07 > 40% — próximos alvos: `luciano-pontes-lobo`, perfis Epic 08 |
| **008** | Densidade · Vila Velha | Apenas 2 perfis totais |

## O que NÃO fazer agora (métricas contra-indicam)

| Ação | Por quê (métrica) |
|------|-------------------|
| Elevar Nível A sem fonte 1–3 | Ciclo 004 bloqueado — Lattes/CRM não acessíveis automaticamente |
| Abrir novo estado | KPI-C01 ES = 90,9% — Viana pendente |
| Publicar só com Doctoralia | 30 rejeitados nos ciclos 001–002+Epic 08 por fonte insuficiente |
| Ignorar KPI-Q07 | 50,0% sem residência — pior KPI operacional |

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
