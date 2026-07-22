# Fábrica AliCIA 1.0

**Versão:** 1.0  
**Status:** Canônico — engenharia operacional e produtividade  
**Data:** 22 de julho de 2026  
**Documentos de referência (não alterados por este arquivo):**  
[`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) · [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md) · [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md) · [`MOAT_ALICIA_1.0.md`](./MOAT_ALICIA_1.0.md)

---

## Como usar este documento

Este arquivo define a **Fábrica AliCIA** — o sistema operacional que transforma um médico desconhecido em um perfil publicado segundo o Protocolo AliCIA, com o menor tempo possível **sem reduzir qualidade, critérios ou revisão humana onde exigida**.

**Pergunta que responde:**

> Como publicar mais médicos, mais rápido, sem afrouxar o Protocolo?

**O que este documento não faz:**

- Não altera Protocolo, Operação, Autoridade ou catálogo.
- Não propõe código, arquitetura ou novas telas.
- Não autoriza automação de julgamento clínico, ranking ou inclusão paga.

**Público:** COO, CTO, Head de Data Operations, operadores, revisores.

---

# Etapa 1 — Fluxo completo da Fábrica

## 1.1 Diagrama operacional

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────────┐    ┌─────────┐    ┌─────────────┐
│  LEAD   │───▶│ TRIAGEM  │───▶│ COLETA  │───▶│ VERIFICAÇÃO  │───▶│ REVISÃO │───▶│ PUBLICAÇÃO  │
└─────────┘    └──────────┘    └─────────┘    └──────────────┘    └─────────┘    └─────────────┘
     │              │               │                  │                  │                │
     │              ▼               │                  │                  │                │
     │         DESCARTE             │                  │                  │                │
     │         (D01–D08)            │                  │                  │                │
     │                              ▼                  ▼                  ▼                │
     │                        COMPLEMENTAÇÃO ◀─── RETORNO ──── RETORNO ───┘                │
     │                              │                                                       │
     └──────────────────────────────┴───────────────────────────────────────────────────────┘
                                                                                              │
                                                                                              ▼
                    ┌──────────────────┐    ┌─────────────────────────────────────────────┐
                    │  MONITORAMENTO   │───▶│              ATUALIZAÇÃO                    │
                    │  (passivo + SLA) │    │  (revisão periódica · eventos · correções)  │
                    └──────────────────┘    └─────────────────────────────────────────────┘
```

Cada médico é um **caso** (`ALC-ES-AAAA-NNNNN`) com dossiê, histórico imutável e timestamps por transição de status.

## 1.2 Tempos por etapa — metas e baseline

| Etapa | Meta operacional (dias úteis) | Tempo de execução ativa | Fila máxima | % do TMP total¹ |
|-------|--------------------------------|-------------------------|-------------|-----------------|
| **Lead** | ≤ 2 (entrada externa) | 10–20 min | — | 5% |
| **Triagem** | ≤ 3 na fila · 15–30 min execução | 15–30 min | 15 casos | 8% |
| **Coleta** | 3–5 (Nível B) · 5–8 (Nível A) | 3–6 h distribuídas | 10 dias parado → escalar | **45%** |
| **Verificação** | 1–2 (padrão) · até 5 (conflito) | 1–3 h | 3 RC abertos → pausar publicações | 18% |
| **Revisão** | 1 (meta Fábrica) | 30–60 min | — | 10% |
| **Publicação** | 0,5 | 20–40 min | — | 4% |
| **Monitoramento** | Contínuo (calendário) | 15 min/semana/perfil | — | — |
| **Atualização** | Conforme evento (15–180 dias) | 1–4 h por evento | Revisões vencidas = prioridade | 10%² |

¹ Distribuição estimada para TMP alvo de 15 dias úteis (Fase 1 — Operação AliCIA 1.0, Cap. 10).  
² Atualização não entra no TMP de médico novo; consome capacidade paralela.

### TMP — Tempo Médio até Publicação

| Fase operacional | TMP alvo (Lead → Publicação) | TMP observado³ |
|------------------|------------------------------|----------------|
| Fase 1 (até 50 médicos) | ≤ 15 dias úteis | **N/D** — ciclos em lote, sem timestamp por caso |
| Fase 2 (50–200) | ≤ 12 dias | Projetado após Fábrica |
| Fase 3 (200–1.000) | ≤ 10 dias | Projetado após Fábrica madura |

³ Baseline real: na semana de 22/07/2026, **11 perfis líquidos** publicados em ~5 dias úteis de sprint intensivo (Ciclos 001 + 002), com **1 operador sênior** e fluxo ainda **não instrumentado por caso**. Isso equivale a ~2,2 perfis/dia útil em modo sprint — **não sustentável** como ritmo contínuo sem degradação de qualidade.

### Tempo até Nível A (adicional)

| Situação | Tempo adicional estimado |
|----------|--------------------------|
| Publicação inicial Nível B → elevação A | +5 a 15 dias úteis |
| Perfil interior (fontes escassas) | +10 a 20 dias úteis |
| Conflito de fontes (RC aberto) | +3 a 5 dias úteis |

**Dado atual (jul/2026):** 18/34 perfis (52,9%) são Nível B — a Fábrica deve tratar elevação B→A como **linha de produção paralela**, não como exceção.

---

# Etapa 2 — Detalhamento por etapa

## 2.1 Lead

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 10–20 min (execução) · SLA 2 dias úteis (entrada externa) |
| **Quem executa** | Operador de ingestão · COO (lotes O2) |
| **Documentos** | Operação Cap. 1 · Ficha de entrada mínima · Protocolo Cap. 2–3 |
| **Decisões** | Abrir caso ou não · Atribuir origem (O1–O5) · Prioridade na fila |
| **Evidências produzidas** | Caso `ALC-ES-AAAA-NNNNN` · Primeira fonte anexada · Status `LEAD — Aguardando triagem` |

**Gargalo identificado:** leads de lotes geográficos (O2) entram sem deduplicação prévia contra catálogo existente — gera retrabalho na triagem.

---

## 2.2 Triagem

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 15–30 min · fila ≤ 3 dias úteis |
| **Quem executa** | Operador de ingestão (80%) · Revisor de catálogo (homônimos, CRM irregular) |
| **Documentos** | Operação Cap. 2 · Checklist triagem (5 itens) · Protocolo Cap. 3 (elegibilidade) |
| **Decisões** | Elegível / Aguardando dados / Descartado (D01–D08) |
| **Evidências produzidas** | Checklist de triagem · Código de descarte (se aplicável) · Transição de status |

**Gargalo identificado:** taxa de rejeição de **44,7%** nos Ciclos 001–002 (17/38 analisados) — metade do esforço de triagem+coleta inicial é em candidatos que não publicam. Fontes nível 6 (Doctoralia isolado) dominam rejeições.

---

## 2.3 Coleta

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 3–5 dias (Nível B) · 5–8 dias (Nível A) · 3–6 h ativas |
| **Quem executa** | Operador de ingestão · Revisor (conflitos, segunda rodada) |
| **Documentos** | Operação Cap. 3 · Checklists B e C (Protocolo Cap. 12) · Planilha de fontes · Códigos AUS-01 a AUS-05 |
| **Decisões** | Quais campos buscar · Ordem 1–9 · Marcar ausência · Propor nível preliminar |
| **Evidências produzidas** | Dossiê completo · Pasta de evidências (prints datados) · Planilha de fontes · Lista AUS-xx |

**Gargalos identificados (maior etapa — ~45% do TMP):**

| Gargalo | Impacto | Evidência |
|---------|---------|-----------|
| Busca manual CRM-ES/CFM | 20–40 min/caso | Todo perfil exige consulta individual |
| Ordem de coleta não respeitada | Retrabalho narrativo | Operação proíbe narrativa antes de etapas 1–4 |
| Fontes institucionais não mapeadas | +2–4 h em cidades novas | Interior: 10/12 novos perfis Epic 08 = Nível B |
| Graduação/residência em fontes dispersas | +1–3 dias | KPI-Q07: 42,9% sem residência verificada (pré-Epic 08) |
| Máximo 3 coletas simultâneas/operador | Capacidade limitada | Operação Cap. 3.1 |

---

## 2.4 Verificação

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 1–2 dias (padrão) · 3–5 dias (conflito/comitê) |
| **Quem executa** | Revisor de catálogo · Curador sênior (Nível A, fraude) |
| **Documentos** | Operação Cap. 4 · Registro de Conflito (RC) · Protocolo Cap. 6–7 |
| **Decisões** | Confirmar / Pendente / Conflito · Atribuir nível A/B/C |
| **Evidências produzidas** | Checklist D · RC (se aplicável) · Status `VERIFICAÇÃO → REVISÃO` |

**Gargalo identificado:** coletor não pode ser único validador — exige segundo par de olhos, criando fila de dependência entre operador e revisor.

---

## 2.5 Revisão

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | Meta Fábrica: 1 dia útil · 30–60 min execução |
| **Quem executa** | Revisor de catálogo (≠ coletor primário) · Curador sênior (Nível A) |
| **Documentos** | Operação Cap. 5 · Checklist E (Protocolo Cap. 12) · Autoridade Cap. 3 (editorial) |
| **Decisões** | Aprovar / Retornar coleta / Escalar comitê · Coerência editorial |
| **Evidências produzidas** | Checklist E assinado · Status `APROVADO — Pronto para publicar` |

**Gargalo identificado:** quatro olhos obrigatório para Nível A duplica tempo de revisão; sem fila dedicada, perfis B publicam mais rápido que A — incentivo perverso à mediocridade se não houver meta de elevação.

---

## 2.6 Publicação

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 0,5 dia · 20–40 min execução |
| **Quem executa** | Operador de ingestão (inserção) · Revisor ou curador (tornar visível) |
| **Documentos** | Operação Cap. 6 · Checklist F · Registro de Publicação (RP) |
| **Decisões** | Publicar Nível A ou B · Registrar campos pendentes · Agendar próxima revisão (180 dias) |
| **Evidências produzidas** | RP-AAAA-NNN · Versão v1.0 · Entrada no catálogo · Hash do dossiê |

**Gargalo identificado:** hoje a publicação no catálogo exige regeneração manual do seed e validação de testes — etapa técnica acoplada à operação, sem checklist operacional unificado pós-RP.

---

## 2.7 Monitoramento

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | Contínuo · 15 min/semana/perfil em revisão ativa |
| **Quem executa** | Operador de ingestão · Revisor · COO (calendário) |
| **Documentos** | Operação Cap. 7.3–7.4 · Lista de observação (hospitais, sociedades) |
| **Decisões** | Disparar atualização ou aguardar · Priorizar varredura CRM |
| **Evidências produzidas** | Alertas de revisão vencida · Amostra CRM mensal (20%) |

**Gargalo identificado:** monitoramento passivo depende de calendário humano — sem alertas, perfis passam dos 180 dias sem revisão crítica.

---

## 2.8 Atualização

| Dimensão | Detalhe |
|----------|---------|
| **Tempo** | 1–4 h por evento · SLA 15–180 dias conforme tipo |
| **Quem executa** | Operador (coleta complementar) · Revisor (verificação) · Comitê (suspensão) |
| **Documentos** | Operação Cap. 7 · Protocolo Cap. 9 · Registro de versão (v1.x / v2.0) |
| **Decisões** | Atualizar / Suspender / Arquivar · Elevar B→A |
| **Evidências produzidas** | Nova versão · Fonte adicional · Log de auditoria |

**Gargalo identificado:** linha B→A compete com linha de médicos novos pela mesma capacidade humana — sem squad dedicado, elevação estagna (18 perfis Nível B atuais).

---

# Etapa 3 — Classificação de tarefas (A / B / C)

## Legenda

| Categoria | Definição | Regra |
|-----------|-----------|-------|
| **A** | Exige julgamento humano — não automatizar decisão | Sempre com registro e responsável |
| **B** | Parcialmente automatizável — humano valida | Automação propõe; humano aprova |
| **C** | Totalmente automatizável — sem alterar critério | Automação executa; humano audita amostra |

---

## 3.1 Lead

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Abrir caso com ID único | **C** | Sequencial, sem julgamento |
| Preencher ficha de entrada mínima | **B** | Autopreenchimento a partir da primeira fonte; humano confirma |
| Classificar origem O1–O5 | **B** | Sugestão por canal; humano confirma |
| Anexar primeira fonte | **C** | Upload e metadados (URL, data, nível sugerido) |
| Detectar duplicata contra catálogo existente | **C** | Match por CRM, nome+ cidade, slug |
| Priorizar na fila | **B** | Regras determinísticas (Operação O2 > O1); exceções humanas |

---

## 3.2 Triagem

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Verificar escopo geográfico (ES) | **C** | Regra binária |
| Verificar escopo de especialidade | **B** | Indício pode exigir leitura de RQE/site |
| Consulta CRM-ES/CFM | **B** | Automação busca; humano valida homônimos |
| Decisão elegível / descartado | **A** | Julgamento com código Dxx e evidência |
| Decisão aguardando dados | **A** | Avalia se vale esperar vs. arquivar |
| Resolver homônimo | **A** | Critério de desempate sem "feeling" — mas exige análise |

---

## 3.3 Coleta

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Buscar CRM, RQE, TEOT | **B** | Automação consulta APIs/portais; humano confirma captura |
| Ordenar coleta 1–9 | **C** | Workflow enforcement — bloquear narrativa antes de 1–4 |
| Buscar graduação em Lattes/MEC | **B** | Automação extrai candidatos; humano confirma fonte nível |
| Buscar residência em hospital/universidade | **B** | Parsing de corpo clínico; confirmação humana |
| Buscar vínculos institucionais | **B** | Biblioteca de instituições canônicas + busca |
| Registrar ausência (AUS-xx) | **B** | Automação sugere código por log de buscas; humano assina |
| Escrever narrativa do perfil | **B** | Template a partir de campos confirmados; revisor edita |
| Propor nível preliminar A/B/C | **A** | Pré-verificação — não vinculante sem revisor |

---

## 3.4 Verificação

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Confirmar CRM ativo + nome compatível | **B** | Automação compara; humano resolve variações |
| Validar RQE/TEOT por especialidade | **B** | Regras codificáveis; exceções humanas |
| Confirmar graduação/residência por hierarquia de fontes | **A** | Julgamento de suficiência — Protocolo Cap. 6 |
| Resolver conflito entre fontes (RC) | **A** | Hierarquia + fundamento protocolar |
| Atribuir nível A/B/C final | **A** | Decisão institucional |
| Escalar ao comitê | **A** | Casos ambíguos |

---

## 3.5 Revisão

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Checar coerência dossiê vs. nível | **A** | Revisor compara checklist E |
| Revisão editorial (Autoridade) | **A** | Tom, clareza, proibições |
| Quatro olhos Nível A | **A** | Obrigatório — não automatizável |
| Decisão retorno à coleta | **A** | Escopo de complementação |
| Assinar checklist F | **A** | Aprovação formal |

---

## 3.6 Publicação

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Gerar Registro de Publicação (RP) | **C** | Template com campos do dossiê |
| Inserir dados no catálogo | **B** | Import validado; humano autoriza |
| Validar testes de integridade do catálogo | **C** | Pipeline de qualidade existente |
| Tornar visível ao público | **A** | Autorização final do revisor |
| Agendar revisão 180 dias | **C** | Calendário automático |

---

## 3.7 Monitoramento e Atualização

| Tarefa | Cat. | Justificativa |
|--------|------|---------------|
| Alertar revisão vencida | **C** | Cron por `lastUpdated` |
| Varredura CRM mensal (20%) | **B** | Automação consulta; humano analisa irregularidades |
| Detectar URL de fonte quebrada | **C** | Health check trimestral |
| Coleta complementar pós-evento | **B** | Mesmo playbook da coleta inicial |
| Decisão suspender/arquivar | **A** | Comitê ou curador |
| Elevação B→A | **A** | Nova verificação de campos críticos |

---

## 3.8 Resumo da classificação

| Categoria | % estimado das tarefas | % do tempo humano |
|-----------|------------------------|-------------------|
| **A — Julgamento humano** | ~35% | ~70% |
| **B — Semi-automático** | ~45% | ~25% |
| **C — Automático** | ~20% | ~5% |

**Conclusão:** a Fábrica não remove humanos — **remove fricção** ao redor do julgamento humano.

---

# Etapa 4 — Plano de automação

## 4.1 Princípios invioláveis

1. **Protocolo prevalece** — automação nunca publica campo sem fonte rastreável.
2. **Humano aprova o que o Protocolo exige** — quatro olhos, conflitos, nível A.
3. **Automação propõe, não decide** — em categorias B, saída é rascunho para validação.
4. **Log imutável** — toda ação automática gera entrada no `08-auditoria.log`.
5. **QA 10% mantido** — amostra humana de reprodutibilidade em toda automação nova.

## 4.2 Iniciativas por onda

### Onda 1 — Fundação (0–60 dias) — eliminar retrabalho

| # | Iniciativa | Tarefas afetadas | Ganho estimado | Risco |
|---|------------|------------------|----------------|-------|
| 1.1 | **Deduplicação na entrada** | Lead: detectar duplicata | −30 min/caso duplicado · evita 100% retrabalho | Baixo |
| 1.2 | **Timestamp por transição de caso** | Todas as etapas | Habilita KPI-O01/O02/O08 | Nulo |
| 1.3 | **Kanban de status operacionais** | Fila, backlog, tempo parado | Visibilidade; −15% TMP por gestão | Baixo |
| 1.4 | **Biblioteca de instituições canônicas** | Coleta etapas 4, 6, 8 | −1–2 h/caso em cidades conhecidas | Baixo |
| 1.5 | **Template de planilha de fontes** | Coleta, verificação | −20 min/caso | Nulo |
| 1.6 | **Bloqueio de ordem de coleta** | Coleta etapas 1–9 | Elimina retrabalho narrativo | Baixo |

### Onda 2 — Aceleração (60–120 dias) — semi-automação

| # | Iniciativa | Tarefas afetadas | Ganho estimado | Risco |
|---|------------|------------------|----------------|-------|
| 2.1 | **Pré-triagem por regras** | Triagem: escopo, fonte nível 7 isolado | −40% candidatos inválidos na fila humana | Médio — falsos negativos |
| 2.2 | **Assistente de consulta CRM/RQE** | Coleta 1–2, verificação CRM | −25 min/caso | Médio — homônimos |
| 2.3 | **Gerador de narrativa rascunho** | Coleta 9 | −30 min/caso | Médio — revisão editorial obrigatória |
| 2.4 | **Fila de revisão inteligente** | Revisão | Prioriza casos prontos; −1 dia fila | Baixo |
| 2.5 | **Pipeline de publicação validada** | Publicação | −15 min/caso · menos erro de seed | Baixo |
| 2.6 | **Alertas de revisão 180 dias** | Monitoramento | Zero perfis vencidos | Nulo |

### Onda 3 — Escala (120–365 dias) — fábrica madura

| # | Iniciativa | Tarefas afetadas | Ganho estimado | Risco |
|---|------------|------------------|----------------|-------|
| 3.1 | **Ingestão por lote geográfico** | Lead O2 + triagem em batch | +50% throughput em expansão | Médio |
| 3.2 | **Monitor de corpos clínicos** | Monitoramento passivo | Detecção proativa de mudanças | Alto — falsos positivos |
| 3.3 | **Squad B→A dedicado** | Atualização | +2 elevações/ciclo sem penalizar novos | Baixo |
| 3.4 | **Score de prontidão (interno)** | Triagem → coleta | Prioriza casos com alta probabilidade de Nível A | Baixo — **nunca exibir ao paciente** |
| 3.5 | **Reprodutibilidade automatizada** | QA 10% | Amostra aleatória + diff entre analistas | Baixo |

## 4.3 O que NÃO automatizar (lista explícita)

| Item | Motivo |
|------|--------|
| Decisão de descarte (D01–D08) | Julgamento com consequência reputacional |
| Resolução de conflito de fontes | Protocolo exige fundamento, não algoritmo |
| Atribuição de Nível A | Quatro olhos obrigatório |
| Aprovação final de publicação | Separação de poderes (Operação Cap. 6) |
| Suspensão ou arquivamento | Comitê em casos graves |
| Inclusão por indicação paga | Proibido — MOAT Cap. 8 |
| Preenchimento de campo sem fonte | Violação direta do Protocolo |

---

# Etapa 5 — Indicadores da Fábrica

## 5.1 Indicadores de tempo

| ID | Indicador | Fórmula | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 |
|----|-----------|---------|-------------|-------------|-------------|
| **CF-T01** | Tempo médio por etapa | Média de `t_saída − t_entrada` por status | Instrumentar | −15% vs. baseline | −30% |
| **CF-T02** | TMP — Lead → Publicação | Dias úteis até RP | ≤ 15 | ≤ 12 | ≤ 10 |
| **CF-T03** | Tempo até Nível A | Publicação B → elevação A | ≤ 20 dias | ≤ 15 dias | ≤ 10 dias |
| **CF-T04** | Tempo parado | Dias em mesmo status > SLA da etapa | 0 casos > SLA | 0 | 0 |
| **CF-T05** | Tempo de fila de revisão | `REVISÃO — Aguardando` → aprovado | ≤ 2 dias | ≤ 1 dia | ≤ 1 dia |

## 5.2 Indicadores de volume e fila

| ID | Indicador | Fórmula | Meta |
|----|-----------|---------|------|
| **CF-V01** | Backlog total | Casos não publicados (todos os status) | Conforme fase¹ |
| **CF-V02** | Backlog envelhecido | Casos > 14 dias sem movimento | 0 |
| **CF-V03** | Fila de triagem | Status `LEAD — Aguardando triagem` | ≤ 15 |
| **CF-V04** | Casos em coleta ativa | Status `COLETA` | ≤ 3 × operadores |
| **CF-V05** | RC abertos | Registros de conflito não resolvidos | 0 em publicação · ≤ 3 total |

¹ Fase 1: ≤ 10 · Fase 2: ≤ 25 · Fase 3: ≤ 80 (Operação Cap. 8.2).

## 5.3 Indicadores de retrabalho

| ID | Indicador | Fórmula | Meta |
|----|-----------|---------|------|
| **CF-R01** | Taxa de retorno à coleta | Casos `COLETA — Complementação` ÷ publicados | ≤ 15% |
| **CF-R02** | Taxa de reprovação QA | Falhas no QA 10% ÷ amostra | ≤ 5% |
| **CF-R03** | Taxa de duplicata na entrada | Duplicatas detectadas ÷ leads | Monitorar |
| **CF-R04** | Taxa de rejeição na triagem | Descartados ÷ analisados | Monitorar² |
| **CF-R05** | Retrabalho narrativo | Perfis com narrativa reescrita pós-verificação | ≤ 5% |

² Alta rejeição pode ser saudável (rigor). Meta não é minimizar — é **não gastar coleta em candidatos que a pré-triagem eliminaria**.

## 5.4 Indicadores de produtividade

| ID | Indicador | Fórmula | Baseline (jul/2026) | Meta pós-Fábrica |
|----|-----------|---------|---------------------|------------------|
| **CF-P01** | Perfis publicados / semana | Contagem de RP na semana | **11** (sprint) · **~2–3** (sustentável estimado) | **8** (Fase 2) · **15** (Fase 3) |
| **CF-P02** | Elevações B→A / ciclo | Perfis que sobem de nível | ~0 (não priorizado) | ≥ 2/ciclo |
| **CF-P03** | Horas humanas / perfil publicado | Soma horas ÷ perfis | ~8–12 h (estimado) | ≤ 6 h (Fase 2) · ≤ 4 h (Fase 3) |
| **CF-P04** | % tarefas categoria C executadas | Automáticas ÷ total | ~5% | ≥ 30% |

## 5.5 Painel mínimo da Fábrica

Atualização **diária** (stand-up) + **semanal** (COO):

1. TMP dos últimos 5 publicados
2. Backlog por status (kanban)
3. Casos parados > SLA (CF-T04)
4. RC abertos (CF-V05)
5. Produtividade semanal (CF-P01)
6. Próximas revisões 180 dias (30 dias)

---

# Etapa 6 — Capacidade operacional

## 6.1 Modelo de capacidade

```
Capacidade semanal = (Operadores × Horas disponíveis × Eficiência) ÷ Horas por perfil
```

| Variável | Hoje (jul/2026) | Pós-Fábrica Onda 2 | Pós-Fábrica Onda 3 |
|----------|-----------------|--------------------|--------------------|
| Operadores de coleta (FTE) | 0,5–1 | 2 | 4 |
| Revisores (FTE) | 0,5 | 1,5 | 3 |
| Horas/semana disponíveis | ~20 h | ~80 h | ~160 h |
| Horas/perfil (médio) | 8–12 h | 6 h | 4 h |
| Eficiência (fila, paralelismo) | 0,7 | 0,85 | 0,9 |

## 6.2 Hoje — capacidade real

| Métrica | Valor | Contexto |
|---------|-------|----------|
| **Perfis completos / semana (sprint)** | **~11** | Ciclos 001+002 — ritmo excepcional, 1 operador sênior |
| **Perfis completos / semana (sustentável)** | **2–3** | 1 operador parcial · 3 coletas máx. · gargalo em revisão |
| **Perfis Nível A / semana** | **~1–2** | Quatro olhos + fontes completas limitam throughput |
| **Elevações B→A / semana** | **~0** | Não priorizado — 18 perfis B aguardam |
| **Horas humanas / perfil** | **8–12 h** | Coleta domina; interior mais lento |

**Diagnóstico:** a operação atual é **artesanal de alta qualidade**, não fábrica. Produz picos de sprint, não ritmo previsível.

## 6.3 Depois das melhorias — capacidade máxima

| Fase | Equipe | Perfis novos / semana | Elevações B→A / semana | TMP |
|------|--------|----------------------|------------------------|-----|
| **Fábrica Onda 1** (60 dias) | 1 op + 1 rev | 4–5 | 1 | 13 dias |
| **Fábrica Onda 2** (120 dias) | 2 op + 1,5 rev | **8** | 2 | 11 dias |
| **Fábrica Onda 3** (365 dias) | 4 op + 3 rev | **15** | 3 | 9 dias |
| **Teto teórico** (sem afrouxar Protocolo) | 6 op + 4 rev + 1 curador | **~20** | 4 | 8 dias |

**Teto teórico** assume: pré-triagem eliminando 40% de candidatos inválidos antes da coleta, biblioteca institucional madura no ES, squad B→A dedicado, zero RC abertos na fila.

## 6.4 Gargalo limitante por fase

| Fase | Gargalo principal | Alavanca |
|------|-------------------|----------|
| Hoje | Coleta manual + revisão sequencial | Onda 1 + 2 |
| Onda 2 | Revisão (quatro olhos Nível A) | Squad B→A + fila inteligente |
| Onda 3 | Monitoramento e atualização | Automação de alertas + células regionais |

---

# Etapa 7 — Roadmap Operacional da Fábrica

## 7.1 Curto prazo (0–90 dias) — Instrumentar e eliminar desperdício

**Objetivo:** medir o que não é medido; parar de fazer duas vezes o mesmo trabalho.

| Semana | Entrega | Dono | KPI impactado |
|--------|---------|------|---------------|
| 1–2 | Timestamp por transição de caso em todos os novos `ALC-ES` | COO | CF-T01, CF-T02 |
| 2–3 | Kanban de status (planilha ou ferramenta interna) | COO | CF-V01, CF-T04 |
| 3–4 | Deduplicação na entrada (CRM + nome + cidade) | Data Ops | CF-R03 |
| 4–6 | Biblioteca de instituições canônicas ES (36+ instituições) | Operador sênior | CF-P03 |
| 6–8 | Template unificado: ficha + planilha fontes + checklists | COO | CF-R05 |
| 8–10 | Squad piloto B→A: elevar 4 perfis (2 orto + 2 neuro) | Revisor | CF-T03, CF-P02 |
| 10–12 | Baseline formal de TMP e horas/perfil | COO + BI | Todos CF-T* |

**Meta ao final do curto prazo:** TMP medido · 4–5 perfis/semana sustentáveis · 4 elevações B→A.

## 7.2 Médio prazo (90–180 dias) — Semi-automação e paralelismo

**Objetivo:** 8 perfis/semana com mesma equipe ampliada moderadamente.

| Mês | Entrega | Dono | KPI impactado |
|-----|---------|------|---------------|
| 4 | Pré-triagem por regras (escopo + fonte nível 7 isolado) | Data Ops | CF-R04, CF-P03 |
| 4 | Assistente de consulta CRM/RQE (proposta + captura) | Data Ops | Coleta −25 min |
| 5 | Gerador de narrativa rascunho (campos confirmados → texto) | Data Ops + Revisor | CF-R05 |
| 5 | Fila de revisão com prioridade por prontidão | COO | CF-T05 |
| 6 | Pipeline de publicação validada (seed + testes automáticos) | Data Ops | Publicação −15 min |
| 6 | Alertas revisão 180 dias | Data Ops | CF-T04 |

**Meta ao final do médio prazo:** 8 perfis/semana · TMP ≤ 11 dias · ≥ 2 elevações B→A/ciclo · CF-P04 ≥ 20%.

## 7.3 Longo prazo (180–365 dias) — Fábrica em escala estadual

**Objetivo:** 15 perfis/semana · cobertura ES completa · revisão periódica sem atraso.

| Trimestre | Entrega | Dono | KPI impactado |
|-----------|---------|------|---------------|
| Q3 | Ingestão por lote geográfico (playbook Epic 08 repetível) | COO | CF-P01 |
| Q3 | Células operacionais: Metro / Norte / Sul do ES | COO | CF-P01 |
| Q4 | Monitor passivo de corpos clínicos (alertas, não publicação) | Data Ops | Monitoramento |
| Q4 | QA reprodutibilidade automatizado (amostra 10%) | Revisor sênior | CF-R02 |
| Q4 | Relatório trimestral de transparência operacional | COO | Confiança institucional |

**Meta ao final do longo prazo:** 15 perfis/semana · TMP ≤ 9 dias · 100% revisões 180 dias no prazo · Viana coberta.

## 7.4 Regra de ouro do roadmap

```
Nenhuma iniciativa da Fábrica entra em produção se:
  (a) reduzir critério do Protocolo, OU
  (b) remover revisão humana onde Operação exige, OU
  (c) não tiver KPI de antes/depois definido.
```

## 7.5 O que a Fábrica preserva — sempre

| Elemento | Por quê |
|----------|---------|
| Protocolo AliCIA 1.0 | Constituição — MOAT Cap. 1 |
| Quatro olhos para Nível A | Operação Cap. 5.3 |
| Fonte rastreável por fato | Protocolo Cap. 6 |
| QA 10% reprodutibilidade | Operação Cap. 8 |
| Proibição de pay-to-play | MOAT Cap. 8 |
| Comitê para casos ambíguos | Operação Cap. 5.4 |

---

# Apêndice A — Mapa de gargalos e retrabalho (diagnóstico consolidado)

| # | Gargalo / Retrabalho | Etapa | Severidade | Iniciativa |
|---|----------------------|-------|------------|------------|
| G1 | Coleta manual domina TMP (~45%) | Coleta | 🔴 Crítico | 2.2, 1.4 |
| G2 | 44,7% candidatos rejeitados após análise | Triagem+Coleta | 🔴 Crítico | 2.1 |
| G3 | Sem timestamp por caso — KPIs cegos | Todas | 🔴 Crítico | 1.2 |
| G4 | 52,9% perfis Nível B sem linha de elevação | Atualização | 🟡 Alto | Squad B→A |
| G5 | Revisão sequencial (gargalo de pessoa) | Revisão | 🟡 Alto | 2.4 |
| G6 | Publicação acoplada a regeneração manual de seed | Publicação | 🟡 Alto | 2.5 |
| G7 | Narrativa escrita antes de campos confirmados | Coleta | 🟡 Médio | 1.6 |
| G8 | Duplicatas detectadas tardiamente | Lead | 🟡 Médio | 1.1 |
| G9 | Monitoramento depende de calendário humano | Monitoramento | 🟡 Médio | 2.6 |
| G10 | Interior: fontes escassas → Nível B default | Coleta | 🟢 Estrutural | 1.4, 3.1 |

---

# Apêndice B — Glossário da Fábrica

| Termo | Definição |
|-------|-----------|
| **Fábrica AliCIA** | Sistema operacional que transforma lead em perfil publicado com máxima eficiência e rigor protocolar |
| **TMP** | Tempo Médio até Publicação (Lead → RP) |
| **Caso** | Unidade de trabalho `ALC-ES-AAAA-NNNNN` com dossiê |
| **Onda** | Fase de implementação de automação (1: fundação · 2: aceleração · 3: escala) |
| **Pré-triagem** | Filtro automático antes da triagem humana — nunca substitui decisão de descarte |
| **Squad B→A** | Equipe dedicada à elevação de perfis, paralela à linha de médicos novos |

---

# Apêndice C — Conexão com documentos canônicos

| Documento | Papel na Fábrica |
|-----------|------------------|
| **Protocolo 1.0** | Critério imutável — a Fábrica acelera, nunca altera |
| **Operação 1.0** | Fluxo base — a Fábrica instrumenta e otimiza |
| **MOAT 1.0** | Define o que não sacrificar por velocidade |
| **OPERATIONAL_DASHBOARD** | KPIs de entrada — a Fábrica adiciona CF-* |
| **CATALOG_METRICS** | Snapshot de saída — perfis publicados e qualidade |

---

*Fábrica AliCIA 1.0 · 22 de julho de 2026*  
*A Fábrica acelera o rigor. O Protocolo governa a velocidade.*
