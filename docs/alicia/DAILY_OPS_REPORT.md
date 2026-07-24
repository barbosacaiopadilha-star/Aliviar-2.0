# AliCIA — Daily Ops Report
## Ciclo Operacional Diário · 23 de julho de 2026

**Papel:** Operations Manager  
**Status da plataforma:** Beta · engenharia congelada  
**Fontes lidas:** `OPERATIONAL_DASHBOARD.md` · `CATALOG_METRICS.md` · `PROTOCOLO_ALICIA_1.0.md` · `OPERACAO_ALICIA_1.0.md`  
**Nota de consistência:** `OPERATIONAL_DASHBOARD.md` reflete snapshot pré-Epic 08 (21 perfis). Números operacionais deste relatório seguem **`CATALOG_METRICS.md`** (34 perfis, pós-Epic 08).

---

## 1. Diagnóstico automático

### KPI mais distante da meta

| KPI | Atual | Meta | Distância |
|-----|-------|------|-----------|
| **KPI-Q07** — perfis sem residência verificada | **50,0%** (17/34) | ≤ 10% | **+40,0 pp** 🔴 |
| KPI-Q01 — perfis Nível A | 47,1% (16/34) | 80% | −32,9 pp |
| KPI-Q02 — perfis Nível B | 52,9% (18/34) | ≤ 20% | +32,9 pp |
| KPI-C01 — células cidade×especialidade | 90,9% (20/22) | 90% GV¹ | Meta GV atingida |
| KPI-Q03 — média de fontes | 5,0 | ≥ 5,0 | ✅ Na meta |

¹ Grande Vitória: **100%** (8/8 células). Lacuna estadual concentrada em **Viana** (2 células vazias).

**KPI atacado neste ciclo:** **KPI-Q07** (residência não verificada) — o mais distante da meta operacional.

---

### Maior lacuna geográfica

| Cidade | Ortopedia | Neurocirurgia | Status |
|--------|-----------|---------------|--------|
| **Viana** | ❌ | ❌ | **Única cidade prioritária sem perfil** |

Demais 10 cidades: cobertura mínima (≥1 perfil por especialidade). Interior em profundidade 1×1 — lacuna de **densidade**, não de presença.

---

### Maior lacuna documental

| Tipo | Perfis | % catálogo |
|------|--------|------------|
| Residência não confirmada | **17** | 50,0% |
| Graduação não confirmada | **18** | 52,9% |

**Especialidade com pior base documental:** Neurocirurgia — apenas **35,3% Nível A** (6/17), **64,7% Nível B** (11/17).

---

### Perfis mais próximos de subir Nível B → A

Critério: Nível B + CRM/RQE documentados + ≥1 fonte institucional nível 2–3 + menor esforço marginal (metro, fontes já no dossiê).

| Prioridade | ID | Nome | Cidade | Por que está perto |
|------------|-----|------|--------|-------------------|
| **1** | `andre-faria-teixeira` | Dr. André Faria Junho Teixeira | Vitória | 5 fontes; Instituto de Neurocirurgia; **URL de formação no site médico** já catalogada; CRM/RQE ok |
| **2** | `paulo-melo-jacques` | Dr. Paulo de Melo Jacques | Cariácica | 6 fontes; Meridional + HEC; **DOI de publicação científica** (2018); CRM/RQE duplo |
| 3 | `luciano-pontes-lobo` | Dr. Luciano Pontes Lobo | Guarapari | 5 fontes; Endocenter/Jayme Santos Neves; graduação parcialmente rastreável |

---

## 2. Prioridade única escolhida

### **Ciclo 004 — Revisão de qualidade: Neurocirurgia metro (elevação B → A)**

| Campo | Decisão |
|-------|---------|
| **Tipo** | Qualidade (não expansão geográfica) |
| **Especialidade** | Neurocirurgia |
| **Região** | Grande Vitória (Vitória + Cariácica) |
| **Perfis alvo** | 2 (`andre-faria-teixeira`, `paulo-melo-jacques`) |
| **KPI primário** | KPI-Q07 |
| **KPI secundário** | KPI-Q01 (Neuro 35,3% → ~47%) |

### Por que foi escolhido (e não Viana)

A regra de priorização do painel operacional (Cap. 8) ordena:

1. Células GV vazias → **já resolvidas** (100% pós-Epic 08)
2. **Maior gap de Nível A na especialidade com pior KPI-Q01** → Neurocirurgia (−44,7 pp vs meta 80%)
3. Instituição âncora subexplorada (INEST) → ciclo seguinte

Viana é lacuna geográfica real, mas **KPI-Q07 está 40 pp acima do teto** — impacta confiança do beta mais do que +2 células em cidade sem demanda validada no piloto. A Operação (Cap. 2 metas M-QLT-02) pede **≥ 2 elevações B → A por ciclo de revisão** antes de nova expansão.

**Uma prioridade. Não duas.** Viana fica na fila do próximo ciclo.

---

## 3. Plano operacional do ciclo

### Objetivo do ciclo

Elevar **2 perfis de neurocirurgia** da Grande Vitória de **Nível B para Nível A**, confirmando **graduação e residência** com fontes nível 1–3, reduzindo KPI-Q07 e KPI-Q01.

### Resultado esperado

| Métrica | Antes | Depois (projetado) |
|---------|-------|-------------------|
| Perfis Nível A (total) | 16 (47,1%) | **18 (52,9%)** |
| Neuro Nível A | 6 (35,3%) | **8 (47,1%)** |
| Perfis sem residência verificada | 17 (50,0%) | **15 (44,1%)** |
| Perfis Nível B | 18 | **16** |

### Critério de sucesso

- [ ] `andre-faria-teixeira` e `paulo-melo-jacques` com graduação **verified: true** em fonte nível 1–3
- [ ] Residência em neurocirurgia documentada com ≥1 fonte nível 1–3 cada
- [ ] Checklist Operação §D (verificação) e §E (revisão editorial) concluídos
- [ ] Nível A aprovado com **quatro olhos** (revisor + curador sênior — Protocolo Cap. 7.1, Operação §F)
- [ ] `unverifiedFields` reduzido a períodos e produção científica apenas
- [ ] Nenhuma alteração de UX, catálogo público ou código

---

## 4. Execução — qualidade

### Médicos a revisar

| # | ID | Nome | Cidade | Nível atual | Alvo |
|---|-----|------|--------|-------------|------|
| 1 | `andre-faria-teixeira` | Dr. André Faria Junho Teixeira | Vitória | B | **A** |
| 2 | `paulo-melo-jacques` | Dr. Paulo de Melo Jacques | Cariácica | B | **A** |

### Documentos faltantes (por perfil)

#### `andre-faria-teixeira`

| Campo | Estado | Ação |
|-------|--------|------|
| Graduação | `__PENDING_VERIFICATION__` | Extrair de site médico (`andreteixeira.site.med.br/formacao`) + cruzar CRM-ES |
| Residência | `[]` vazio | Buscar em site médico, CRM-ES, Lattes/CV se disponível |
| Especializações | Pendente | Registrar se constarem em fonte 1–3; senão manter pendente |
| Períodos | Pendente | Preencher somente com fonte explícita |
| Produção científica | Pendente | Não bloqueia Nível A se formação confirmada |

#### `paulo-melo-jacques`

| Campo | Estado | Ação |
|-------|--------|------|
| Graduação | `__PENDING_VERIFICATION__` | Cruzar CRM-ES + publicação DOI (autoria institucional) + Meridional/HEC |
| Residência | `[]` vazio | Buscar em CRM-ES, currículo em publicação científica, site institucional Meridional |
| Especializações | Pendente | RQE 459 e 460 já documentados — confirmar programas de origem |
| Períodos | Pendente | Extrair apenas de fontes aceitas |
| Produção científica | DOI existente | Vincular ao dossiê; não inventar lista adicional |

### Fontes prioritárias (ordem de consulta)

| Ordem | Fonte | Nível | Aplicação |
|-------|-------|-------|-----------|
| 1 | CRM-ES / consulta pública | 1 | Graduação, residência, situação |
| 2 | Site médico (`andreteixeira.site.med.br`) | 5 → cruzar com 1 | Formação André |
| 3 | Instituto de Neurocirurgia | 2 | Vínculo + confirmação institucional André |
| 4 | Hospital Meridional / HEC | 2 | Vínculo Paulo |
| 5 | DOI Arquivos Brasileiros de Neurocirurgia (2018) | 3–4 | Autoria e afiliação Paulo |
| 6 | CNES / CliniGuia | 4 | Vínculo complementar se necessário |

**Proibido:** publicar campo confirmado sem fonte nível 1–3 (Protocolo Cap. 6).

### Cidades afetadas

- **Vitória** (1 perfil elevado)
- **Cariácica** (1 perfil elevado)

Sem alteração de cobertura geográfica — apenas qualidade.

---

## 5. Fluxo operacional (Protocolo + Operação)

```
REVISÃO (casos existentes)
    ↓
COLETA COMPLEMENTAR (graduação + residência)
    ↓
VERIFICAÇÃO (atribuir Nível A — checklist D)
    ↓
REVISÃO EDITORIAL (checklist E)
    ↓
APROVAÇÃO QUATRO OLHOS (checklist F3)
    ↓
ATUALIZAÇÃO DOSSIÊ + classificação Nível A
```

### Registro por caso (template)

| Caso | Etapa | Responsável | Decisão | Timestamp |
|------|-------|-------------|---------|-----------|
| ALC-ES-2026-REV-001 | Coleta complementar | Revisor catálogo | — | — |
| ALC-ES-2026-REV-002 | Coleta complementar | Revisor catálogo | — | — |

*(Preencher no Studio durante execução — sem alteração de produto.)*

---

## 6. Inconsistências e ações corretivas

| Tipo | Achado | Ação corretiva |
|------|--------|----------------|
| **Documentação** | 17 perfis sem residência verificada | Este ciclo ataca 2; fila de 15 permanece |
| **Documentação** | `OPERATIONAL_DASHBOARD.md` desatualizado (21 vs 34 perfis) | Atualizar Cap. 1 e 3 na próxima cadência semanal — **fora deste ciclo** |
| **Qualidade** | Neuro 64,7% Nível B | Elevar 2 perfis metro neste ciclo |
| **Duplicidades** | 0 | Manter rotina de deduplicação na ingestão |
| **Conflitos** | Nenhum CRM duplicado detectado | — |
| **Geográfico** | Viana vazia | **Não tratar neste ciclo** — fila Ciclo 005 |

---

## 7. Indicadores projetados

| Indicador | Valor esperado |
|-----------|----------------|
| Tempo por etapa (2 perfis) | Coleta: 4–6 h · Verificação: 2 h · Revisão: 1,5 h · Aprovação: 30 min |
| Tempo total do ciclo | **1,5–2 dias úteis** (1 revisor + 1 curador sênior) |
| Perfis publicados (novos) | 0 |
| Perfis elevados B → A | **2** |
| Perfis rejeitados | 0 |
| Motivos de rejeição | N/A |
| Campos mais difífeis | **Residência** (fonte dispersa) · **Graduação** (site médico sem data) |

---

## 8. Perguntas de gestão

### O que mais consumiu tempo (histórico Ciclos 001–002 + Epic 08)?

1. **Coleta de fontes nível 1–3** (CRM, instituição, sociedade) — ~45% do tempo
2. **Triagem e rejeição** (44,7% taxa de rejeição) — ~25%
3. **Verificação editorial** — ~20%
4. **Publicação administrativa** — ~10%

### O que ainda depende de intervenção manual?

- Abertura e transição de casos no Studio
- Consulta CRM-ES e sites institucionais
- Cruzamento de fontes e decisão Nível A/B
- Aprovação quatro olhos
- Regeneração do seed (`npm run alicia:seed`) após revisão
- Atualização de `CATALOG_METRICS.md` e painel operacional

### O que pode ser automatizado sem alterar o Protocolo?

| Automação | Impacto | Altera Protocolo? |
|-----------|---------|-------------------|
| Alerta de perfis B há >90 dias sem revisão | Médio | Não |
| Export semanal KPI-Q07 do seed | Alto | Não |
| Checklist de fontes por especialidade (template) | Médio | Não |
| Lembrete SLA 180 dias (`lastUpdated`) | Baixo | Não |
| **Não automatizar:** decisão Nível A, quatro olhos, texto editorial | — | — |

---

## 9. Veredito

### A AliCIA está operacional?

## **SIM — com ressalva de qualidade**

**Justificativa:**

- O catálogo está **publicado e navegável** (34 perfis, 10 cidades, beta).
- A **Operação, Protocolo e Studio** existem e permitem executar ciclos.
- O gargalo não é ausência de processo — é **profundidade documental** (50% sem residência verificada).
- A equipe **consegue operar amanhã** se executar este ciclo de revisão antes de nova expansão geográfica.

**Ressalva:** operacional ≠ excelência. KPI-Q07 e KPI-Q01 estão críticos. Sem ciclos de revisão B → A, o beta acumula perfis publicáveis mas com confiança documental abaixo da meta.

---

## 10. Síntese executiva

| Campo | Valor |
|-------|-------|
| **KPI atacado** | KPI-Q07 (residência não verificada) |
| **Progresso esperado** | 50,0% → 44,1% sem residência; +2 Nível A |
| **Impacto esperado** | Maior confiança nos perfis metro de neuro; modelo replicável para os 9 neuro B restantes |
| **Risco** | Fonte de residência indisponível → caso permanece B (não forçar Nível A) |
| **Próximo KPI sugerido** | KPI-C01 — abertura **Ciclo 005 Viana** (única lacuna geográfica) **ou** KPI-Q01 — segundo lote neuro B → A (INEST / Serra) |

---

## 11. Gargalos · Automação · Melhorias · Riscos

### Gargalos

1. Residência e graduação exigem consulta manual multi-fonte
2. Painel operacional desatualizado vs catálogo real
3. KPI-O01/O02 sem timestamps automáticos por caso
4. 18 perfis Nível B na fila de elevação

### Oportunidades de automação (sem mudar Protocolo)

1. Relatório semanal `KPI-Q07` a partir do seed
2. Fila priorizada B → A por “esforço marginal” (fontes já presentes)
3. Template de coleta complementar por especialidade

### Melhorias operacionais

1. Cadência fixa: 2 elevações B → A + 0–1 expansão geográfica por semana
2. Sincronizar `OPERATIONAL_DASHBOARD.md` após cada ciclo
3. Casos de revisão com ID `ALC-ES-AAAA-REV-NNN` separados de leads novos

### Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Elevar a A sem residência confirmada | 🔴 Alta | Protocolo Cap. 7.1 — bloquear |
| Ignorar Viana por muitos ciclos | 🟡 Média | Ciclo 005 já sugerido |
| Dashboard interno desalinhado | 🟡 Média | Atualização semanal |
| Fadiga operacional (18 B na fila) | 🟡 Média | Ritmo de 2/ciclo sustentável |

---

*Gerado em 23 de julho de 2026 — Daily Ops · Ciclo 004 proposto. Nenhum código, UX, catálogo público ou Protocolo alterado.*
