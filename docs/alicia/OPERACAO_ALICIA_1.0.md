# Operação AliCIA 1.0

**Versão:** 1.0  
**Status:** Canônico — operação diária  
**Data:** 22 de julho de 2026  
**Documento complementar:** [`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md)

---

## Como usar este documento

O **Protocolo AliCIA** define *o quê* e *por quê*.  
Este documento define *quem*, *quando*, *em que ordem* e *como registrar*.

Juntos, respondem:

> **"Como a AliCIA funciona todos os dias?"** — não como software, como empresa.

**Regra:** se houver conflito entre operação e protocolo, **prevalece o protocolo**. A operação pode ser mais restritiva, nunca mais permissiva.

**Pré-requisito:** todo colaborador operacional lê o Protocolo 1.0 antes de executar qualquer tarefa neste manual.

---

## Visão geral do fluxo diário

```
ENTRADA → TRIAGEM → COLETA → VERIFICAÇÃO → REVISÃO → PUBLICAÇÃO → MONITORAMENTO
                ↓                              ↑
            DESCARTE                    RETORNO À COLETA
```

Cada médico é um **caso** com ID único, dossiê próprio e histórico imutável de decisões.

---

# Capítulo 1 — Como nasce um médico novo?

## 1.1 O que é um "médico novo"

Um médico novo é qualquer pessoa que **ainda não possui caso aberto** na operação AliCIA, ou que possui caso arquivado há mais de 12 meses e reentra por nova evidência de atuação no ES.

## 1.2 Quem pode indicar

| Origem | Quem indica | Forma de entrada | Prioridade na fila |
|--------|-------------|------------------|-------------------|
| **O1 — Pesquisa proativa** | Operador de ingestão | Abertura direta de caso | Normal |
| **O2 — Cobertura geográfica** | COO ou curador sênior (plano de expansão) | Lote por cidade/especialidade | Alta (quando cidade está no plano trimestral) |
| **O3 — Lacuna detectada** | Qualquer membro da operação | Formulário interno "Lacuna de cobertura" | Normal |
| **O4 — Correção / atualização** | Revisor, auditor ou titular via canal oficial | Vinculado a caso existente (não é médico "novo") | Alta se erro factual |
| **O5 — Indicação externa** | Paciente, médico, instituição, imprensa | Canal público `contato@alicia` (quando existir) | Normal — **não acelera publicação** |

### O que NÃO é indicação válida

- Pedido de inclusão mediante pagamento
- Pedido de "destaque" ou "melhor posição"
- Indicação sem nome completo ou sem cidade de atuação no ES
- Indicação de especialidade fora do escopo (Protocolo, Cap. 2)

**Princípio:** toda entrada na fila é registrada. Nenhuma entrada é aceita por relação pessoal ou comercial.

## 1.3 Como entra na fila

### Passo a passo (Operador de ingestão ou COO)

1. Abrir **Caso** com ID automático: `ALC-ES-AAAA-NNNNN`
2. Preencher **Ficha de entrada mínima:**
   - Nome (como encontrado na primeira fonte)
   - Especialidade suspeita (ortopedia / neurocirurgia)
   - Cidade de atuação no ES
   - Origem (O1–O5)
   - Quem abriu + data/hora
3. Anexar **primeira fonte** (URL, print, tipo nível 1–7)
4. Atribuir status: **`LEAD — Aguardando triagem`**
5. Inserir na **Fila de Triagem** (ordem: prioridade → data de entrada)

### SLA de entrada

| Ação | Prazo |
|------|-------|
| Registrar lead recebido externamente | 2 dias úteis |
| Abrir caso a partir de plano de cobertura | Conforme calendário trimestral |

Nenhum lead fica sem status. Lead sem ação por 30 dias → revisão semanal do COO (arquivar ou reativar).

---

# Capítulo 2 — Triagem

## 2.1 Quem faz

| Responsável | Papel |
|-------------|-------|
| **Operador de ingestão** | Triagem padrão (80% dos casos) |
| **Revisor de catálogo** | Triagem de casos com homônimo, CRM irregular ou dúvida de especialidade |

O mesmo analista que triou **não pode** ser o único revisor final da publicação (quatro olhos — ver Capítulo 5).

## 2.2 Quanto tempo

| Métrica | Meta operacional |
|---------|------------------|
| Tempo na fila de triagem | ≤ 3 dias úteis |
| Tempo de execução da triagem | 15–30 min por caso |
| Casos em triagem simultâneos por operador | Máximo 5 abertos |

Se a fila ultrapassar 15 casos pendentes, o COO redistribui ou aciona reforço temporário.

## 2.3 O que a triagem faz

A triagem **não coleta formação completa**. Ela responde apenas:

1. Este caso está no escopo (ES + ortopedia/neuro)?
2. Há indício mínimo de elegibilidade (Protocolo, Cap. 3)?
3. O caso deve seguir, aguardar documentos ou ser descartado?

### Checklist de triagem (5 minutos)

- [ ] Nome identificável
- [ ] Especialidade no escopo (indício)
- [ ] Cidade no ES (indício)
- [ ] Primeira fonte anexada
- [ ] Busca rápida CRM (mesmo que incompleta)

## 2.4 Critérios de descarte imediato

Descarte **sem** entrar em coleta. Status final: **`DESCARTADO — [código]`**

| Código | Motivo | Exemplo |
|--------|--------|---------|
| **D01** | Fora de escopo geográfico | Atua só em SP, sem vínculo no ES |
| **D02** | Fora de escopo de especialidade | Cardiologista |
| **D03** | CRM inativo / cancelado / falecido | Confirmado na consulta CRM |
| **D04** | Duplicata de caso aberto | Mesmo CRM já em pipeline ou publicado |
| **D05** | Homônimo irresolúvel | Dois CRMs possíveis, sem critério de desempate |
| **D06** | Sem especialidade no escopo | Generalista sem evidência mínima |
| **D07** | Fonte apenas nível 7 | Rede social sem corroboração |
| **D08** | Solicitação comercial | Pedido de inclusão paga |

**Registro obrigatório:** código, evidência, analista, data. Descarte é auditável — nunca silencioso.

## 2.5 Resultados possíveis da triagem

| Resultado | Próximo status | Destino |
|-----------|----------------|---------|
| **Elegível** | `COLETA — Em andamento` | Fila de Coleta |
| **Aguardando dados** | `LEAD — Dados insuficientes` | Fila de espera (revisar em 15 dias) |
| **Descartado** | `DESCARTADO — Dxx` | Arquivo morto |

---

# Capítulo 3 — Coleta

## 3.1 Quem procura

| Responsável | Escopo |
|-------------|--------|
| **Operador de ingestão** | Coleta padrão: CRM, fontes 1–4, formação básica |
| **Revisor de catálogo** | Casos com conflito, homônimo resolvido, ou segunda rodada de fontes |

Um operador tem no máximo **3 casos em coleta ativa** simultaneamente (qualidade > volume).

## 3.2 Quanto tempo

| Métrica | Meta |
|---------|------|
| Coleta padrão (Nível B esperado) | 3–5 dias úteis |
| Coleta completa (Nível A esperado) | 5–8 dias úteis |
| Caso parado em coleta | Escalar ao COO após 10 dias úteis |

## 3.3 Documentos e dados buscados — ordem obrigatória

A ordem evita retrabalho: identidade e elegibilidade antes de narrativa.

| Ordem | O que buscar | Fontes prioritárias | Campo no dossiê |
|-------|--------------|---------------------|-----------------|
| **1** | CRM + situação + nome oficial | CRM-ES / CFM | `crm` |
| **2** | RQE ou título de especialista | CRM, SBOT, SBN, TEOT | `rqe_titulo` |
| **3** | Especialidade e área de atuação | Fontes 1–3 | `especialidade`, `areas` |
| **4** | Cidade e instituição de atuação atual | Site institucional, CRM, diretório + confirmação | `atuacao_atual` |
| **5** | Graduação | Lattes, site institucional, universidade | `graduacao` |
| **6** | Residência(s) | MEC/instituição, Lattes, hospital | `residencia` |
| **7** | Treinamento complementar | Instituição, sociedade | `treinamento` |
| **8** | Vínculos institucionais adicionais | Hospitais, clínicas | `instituicoes` |
| **9** | Textos de apresentação (quem é / trajetória) | Somente fatos já confirmados nas etapas 1–8 | `narrativa` |

**Regra:** não escrever narrativa antes de fechar etapas 1–4.

## 3.4 Como registrar ausência de informação

Toda ausência usa um destes registros — nunca campo em branco sem código.

| Código | Significado | Ação no perfil |
|--------|-------------|----------------|
| **AUS-01** | Buscado em fontes 1–3; não encontrado | Marcar verificação pendente |
| **AUS-02** | Encontrado só em fonte 6; aguarda confirmação | Não publicar como confirmado |
| **AUS-03** | Conflito entre fontes | Escalar para verificação (Cap. 4) |
| **AUS-04** | Fora do escopo de coleta (ex.: mestrado irrelevante) | Não coletar; registrar "não aplicável" |
| **AUS-05** | Fonte temporariamente indisponível | Reagendar busca em 7 dias |

Cada código exige: **quem buscou**, **onde buscou** (lista de URLs/consultas), **data**.

## 3.5 Entregável da coleta

Dossiê com:

1. Checklist B e C do Protocolo (Cap. 12) preenchidos
2. Pasta de evidências (prints datados)
3. Planilha de fontes (nome, nível, URL, data, analista)
4. Lista de campos `AUS-xx`
5. Proposta de nível preliminar (A / B / C) — sujeita à verificação

Status ao concluir: **`VERIFICAÇÃO — Aguardando`**

---

# Capítulo 4 — Verificação

## 4.1 Quem valida

| Tipo de verificação | Responsável |
|---------------------|-------------|
| Verificação rotineira (CRM, RQE, campos com fonte 1–3) | **Revisor de catálogo** |
| Conflito entre fontes mesmo nível | **Revisor de catálogo** + registro para curador se não resolvido em 2 dias |
| Atribuição de Nível A | **Revisor de catálogo** + **curador sênior** (quatro olhos) |
| Suspeita de fraude ou identidade | **Curador sênior** imediato |

O operador que coletou **pode** verificar campos factuais simples, mas **não pode** ser o único validador da publicação.

## 4.2 Quanto tempo

| Métrica | Meta |
|---------|------|
| Verificação padrão | 1–2 dias úteis após coleta |
| Conflito de fontes | 3 dias úteis |
| Caso escalado ao comitê | 5 dias úteis para primeira resposta |

## 4.3 Como confirmar cada elemento

### CRM

| Passo | Ação |
|-------|------|
| 1 | Consultar CRM-ES (prioridade) ou CFM |
| 2 | Capturar tela com data visível |
| 3 | Registrar: número, UF, nome oficial, situação |
| 4 | Comparar nome com dossiê — documentar variações (Dr., abreviações) |
| **Confirmado se** | Situação ativa + nome compatível |
| **Pendente se** | Homônimo ou situação não clara |

### RQE / título

| Passo | Ação |
|-------|------|
| 1 | Buscar RQE no CRM ou título na SBOT/SBN/TEOT |
| 2 | Confirmar especialidade (ortopedia ou neurocirurgia) |
| **Ortopedia** | RQE ou TEOT obrigatório para elegibilidade — sem isso: não publica |
| **Neurocirurgia** | Sem RQE: máximo Nível B |

### Graduação

| Passo | Ação |
|-------|------|
| 1 | Fonte nível 1–3 com nome da faculdade |
| 2 | Ano só se constar na fonte |
| **Confirmado** | Instituição em fonte 1–3 |
| **Pendente** | Só fonte 5–6 |

### Residência

| Passo | Ação |
|-------|------|
| 1 | Identificar programa + instituição em fonte 1–3 |
| 2 | Cada residência é um bloco independente |
| **Confirmado** | Programa e instituição explícitos |
| **Pendente** | Menção vaga ("formado no HMMC" sem programa) |

### Treinamentos complementares

| Passo | Ação |
|-------|------|
| 1 | Confirmar programa nomeado pós-residência |
| 2 | Fonte 1–3 |
| **Se ausente** | Não inventar; omitir ou marcar pendente |

### Instituições

| Passo | Ação |
|-------|------|
| 1 | Nome canônico (Protocolo, Cap. 5) |
| 2 | Categoria institucional |
| 3 | Cidade/UF |
| 4 | Vínculo (ortopedista, neurocirurgião, etc.) |
| **Confirmado** | Fonte 1–4 |
| **Pendente** | Só diretório nível 6 |

## 4.4 Como registrar divergências

Usar **Registro de Conflito** (RC) no dossiê:

```
RC-ID: RC-AAAA-NNN
Campo: [ex.: residencia_instituicao]
Fonte A: [nome, nível, URL, valor]
Fonte B: [nome, nível, URL, valor]
Decisão: [prevalece A / pendente / escalado]
Fundamento: [artigo do protocolo]
Responsável: [nome]
Data: [ISO]
```

**Enquanto RC aberto em campo crítico:** nível máximo = C (não publica).

## 4.5 Resultado da verificação

| Resultado | Nível | Próximo status |
|-----------|-------|----------------|
| Todos os critérios A atendidos | A | `REVISÃO — Aguardando` |
| Elegível com lacunas documentadas | B | `REVISÃO — Aguardando` |
| Não elegível ou só fonte fraca | C | `OCULTO — Aguardando dados` ou `DESCARTADO` |

---

# Capítulo 5 — Revisão

## 5.1 O que é revisão

Revisão não re-checa todos os fatos — valida se o dossiê está **coerente, completo para o nível atribuído e editorialmente adequado** (Protocolo, checklist E).

## 5.2 Quem faz

| Etapa | Responsável |
|-------|-------------|
| Revisão editorial + coerência | **Revisor de catálogo** (diferente do coletor primário) |
| Aprovação Nível B | **Revisor de catálogo** |
| Aprovação Nível A | **Curador sênior** ou segundo revisor |

## 5.3 Quando um segundo analista entra

Segundo analista é **obrigatório** quando:

| Situação | Segundo analista |
|----------|------------------|
| Publicação Nível A | Sempre (quatro olhos) |
| Publicação Nível B | Recomendado; obrigatório se coletor = revisor proposto |
| QA pós-publicação (10%) | Operador diferente do publicador |
| Qualquer alteração em campo crítico pós-publicação | Sempre |

## 5.4 Quando o caso vai para o Comitê

**Comitê de Catálogo** (curador sênior + COO + 1 revisor; sem voto do coletor do caso):

| Gatilho | Prazo de reunião |
|---------|------------------|
| Conflito RC aberto > 3 dias | Próxima reunião semanal |
| Dúvida de elegibilidade não resolvida pelo protocolo | 5 dias úteis |
| Denúncia externa de erro factual | 48 horas |
| Solicitação de arquivamento do titular | 5 dias úteis |
| Mudança de nível A → B ou suspensão | Próxima reunião |

**Saída do comitê:** decisão escrita, vinculante, arquivada no dossiê.

## 5.5 Quando o perfil volta para coleta

| Motivo | Ação |
|--------|------|
| Fontes insuficientes para o nível proposto | `COLETA — Complementação` |
| RC aberto sem nova busca | Coletor busca fonte adicional |
| Revisor identifica campo publicado sem evidência | **Suspensão imediata** + coleta |
| Comitê determina complementação | Coleta com escopo definido por ata |

**Não voltar para coleta** por preferência estética de texto — isso é ajuste editorial na revisão.

---

# Capítulo 6 — Publicação

## 6.1 Quem aprova

| Nível | Aprovador |
|-------|-----------|
| **B** | Revisor de catálogo (que não seja o único coletor) |
| **A** | Curador sênior + registro do segundo revisor |

Aprovação = checklist F do Protocolo (Cap. 12) assinado digitalmente ou em registro com nome + data.

## 6.2 Quem publica

| Ação | Responsável |
|------|-------------|
| Inserir/atualizar dados no catálogo | **Operador de ingestão** sob autorização do revisor |
| Tornar visível ao público | **Revisor de catálogo** ou **curador sênior** |

**Separação:** quem aprova pode publicar; quem coletou sozinho **não pode** publicar sem segundo par de olhos.

## 6.3 Como registrar a publicação

Cada publicação gera **Registro de Publicação (RP)**:

```
RP-ID: RP-AAAA-NNN
Caso: ALC-ES-AAAA-NNNNN
Nível: A | B
Protocolo aplicado: PROTOCOLO_ALICIA_1.0
Aprovado por: [nome, papel]
Publicado por: [nome, papel]
Data/hora publicação:
Próxima revisão obrigatória: [data + 180 dias]
Campos pendentes (se B): [lista]
Hash do dossiê: [referência à versão arquivada]
```

## 6.4 Como registrar versão

Cada alteração publicada incrementa versão do perfil:

| Versão | Quando |
|--------|--------|
| `v1.0` | Primeira publicação |
| `v1.1`, `v1.2`… | Correções menores (typo, fonte adicional sem mudar fatos) |
| `v2.0` | Mudança em campo crítico (formação, instituição principal, cidade, especialidade) |

**Regra:** `v2.0` exige novo ciclo de verificação nos campos alterados + segundo analista.

Histórico de versões é **append-only** — versões anteriores nunca são apagadas.

---

# Capítulo 7 — Atualização

## 7.1 Princípio

Perfil publicado não é estático. A operação monitora mudanças e o tempo.

## 7.2 Eventos que disparam revisão

| Evento | SLA para iniciar revisão | Ação padrão |
|--------|--------------------------|-------------|
| **Novo treinamento** detectado em fonte pública | 30 dias | Coleta complementar → verificação → v2.0 se confirmado |
| **Mudança de hospital / instituição principal** | 15 dias | Verificar atuação; atualizar ou suspender se não confirmado |
| **Novo RQE ou título** | 15 dias | Atualizar; pode elevar B → A |
| **Mudança de cidade** no ES | 15 dias | Verificar; atualizar localização |
| **CRM irregular** | 24 horas | Suspender público até esclarecimento |
| **Denúncia com evidência** | 48 horas | Suspender se grave; investigar |
| **Revisão periódica vencida (180 dias)** | 0 dias (no vencimento) | Revisão de CRM + atuação atual |
| **Mudança no Protocolo** | Conforme nota de versão | Reavaliar campos afetados |

## 7.3 Periodicidade obrigatória

| Tipo | Frequência | Escopo |
|------|------------|--------|
| **Revisão crítica** | 180 dias por perfil | CRM, especialidade, atuação atual |
| **Varredura CRM** | Mensal (amostra 20% do catálogo) | Detectar irregularidades em massa |
| **Revisão de fontes quebradas** | Trimestral | URLs mortas; buscar captura nova |
| **Relatório de cobertura** | Mensal | Capítulo 8 |

## 7.4 Monitoramento passivo

Operação mantém **lista de observação**:

- Sites de hospitais do ES (mudanças de corpo clínico)
- Atualizações SBOT/SBN relevantes
- Planos trimestrais de expansão geográfica

Não exige tecnologia especial — exige **calendário e responsável**.

---

# Capítulo 8 — Qualidade

## 8.1 Cadência de gestão

| Reunião | Frequência | Participantes | Duração |
|---------|------------|---------------|---------|
| **Stand-up operacional** | Diário (15 min) | Operadores + revisor | Fila, bloqueios |
| **Revisão de qualidade** | Semanal | COO + curador sênior | Indicadores, RC abertos |
| **Comitê de catálogo** | Semanal ou sob demanda | Cap. 5.4 | Casos escalados |
| **Conselho de cobertura** | Mensal | COO + operação | Expansão geográfica |

## 8.2 Indicadores internos (KPIs)

### Eficiência

| KPI | Definição | Meta v1 (10–50 médicos) | Meta v2 (50–200) | Meta v3 (200–1000) |
|-----|-----------|-------------------------|------------------|---------------------|
| **TMP** — Tempo médio para publicar | Lead → publicação (dias úteis) | ≤ 15 dias | ≤ 12 dias | ≤ 10 dias |
| **TAT Triagem** | Entrada → fim triagem | ≤ 3 dias | ≤ 2 dias | ≤ 1 dia |
| **TAT Coleta** | Início coleta → fim coleta | ≤ 7 dias | ≤ 5 dias | ≤ 4 dias |
| **Backlog total** | Casos não publicados | ≤ 10 | ≤ 25 | ≤ 80 |

### Qualidade

| KPI | Definição | Meta |
|-----|-----------|------|
| **Taxa de descarte na triagem** | % descartados / leads | Monitorar (sem meta — indicador de qualidade da entrada) |
| **Taxa de reprovação QA** | % perfis com falha no QA 10% | ≤ 5% |
| **RC abertos** | Conflitos não resolvidos | 0 em publicação; ≤ 3 na operação |
| **Perfis Nível A** | % do catálogo publicado | Crescer ao longo do tempo; sem meta artificial |
| **Perfis Nível B** | % com pendências explícitas | Aceitável na fase piloto; documentar |

### Estoque

| KPI | Definição | Como medir |
|-----|-----------|------------|
| **Perfis em revisão** | Status `REVISÃO` + `VERIFICAÇÃO` | Contagem semanal |
| **Perfis completos (Nível A)** | Protocolo 7.1 | Relatório de cobertura |
| **Perfis aguardando documentos** | `LEAD` + `COLETA` com AUS-xx | Contagem semanal |
| **Perfis suspensos** | Status `SUSPENSO` | Contagem + motivo |
| **Perfis publicados** | Visíveis ao público | Total |

### Cobertura geográfica

| KPI | Definição | Baseline (jul/2026) |
|-----|-----------|---------------------|
| **Cobertura Grande Vitória** | % cidades metro prioritárias com ≥ 1 médico | 4/6 (67%) — faltam Guarapari, Viana |
| **Cobertura ES prioritário** | % 11 cidades prioritárias com ≥ 1 médico | 4/11 (36%) |
| **Cobertura ES total** | Médicos / população atendida (proxy: cidades com perfil) | 4 cidades |
| **Ortopedia vs Neuro** | Proporção por especialidade | 5 / 5 (equilibrado) |

### Confiabilidade operacional

| KPI | Definição | Meta |
|-----|-----------|------|
| **Reprodutibilidade QA** | 2 analistas concordam em 10% amostra | 100% |
| **Divergência auditoria** | Achados em auditoria mensal | Tendência a zero |

## 8.3 Painel mínimo (pode ser planilha)

Uma única planilha ou documento vivo atualizado semanalmente com:

1. Fila por status
2. TMP dos últimos 5 publicados
3. KPIs de cobertura
4. RC abertos
5. Próximas revisões vencendo (30 dias)

---

# Capítulo 9 — Auditoria

## 9.1 Princípio

Qualquer decisão da AliCIA deve ser **reconstruível** meses depois, sem depender da memória de quem executou.

## 9.2 O que é auditável

| Decisão | Evidência obrigatória |
|---------|----------------------|
| Entrada na fila | Ficha de entrada + origem |
| Triagem (elegível / descartado) | Checklist + código Dxx se descarte |
| Cada fato no perfil | Fonte (nível, URL, data, analista) |
| Ausência de informação | Código AUS-xx + log de busca |
| Conflito | Registro RC completo |
| Nível A/B/C | Checklist D + responsável |
| Publicação | Registro RP |
| Alteração | Versão + diff + fonte |
| Suspensão / arquivamento | Código Protocolo Cap. 9 + evidência |

## 9.3 Estrutura do dossiê (mínimo)

```
/casos/ALC-ES-AAAA-NNNNN/
  00-ficha-entrada.pdf
  01-triagem.pdf
  02-fontes/          (prints, exports)
  03-planilha-fontes.xlsx
  04-registros-conflito/
  05-checklists-A-G.pdf
  06-registro-publicacao.pdf
  07-historico-versoes/
  08-auditoria.log     (append-only)
```

## 9.4 Log de auditoria (formato)

Cada linha:

```
[timestamp ISO] [ator] [ação] [objeto] [detalhe] [ref-protocolo] [ref-fonte]
```

Exemplo:

```
2026-07-22T14:30:00-03:00 | Maria (Revisor) | APROVOU_PUBLICACAO | ALC-ES-2026-00042 | Nivel B | Protocolo 8.1 | RP-2026-018
```

## 9.5 Quem audita

| Papel | Frequência | Escopo |
|-------|------------|--------|
| **Revisor distinto (QA 10%)** | Por publicação | Reprodutibilidade |
| **Auditor interno** | Mensal | 20% dos casos publicados no mês |
| **COO** | Trimestral | 100% dos suspensos + amostra 5% do catálogo |

Achados de auditoria geram **plano de correção** com prazo — rastreado na reunião semanal.

## 9.6 Perguntas que a auditoria deve responder

Para qualquer perfil publicado:

1. Quem aprovou?
2. Quando?
3. Com base em quais evidências (lista de fontes)?
4. Qual nível (A/B)?
5. O que estava pendente na publicação?
6. Quem mais revisou (quatro olhos)?

Se alguma resposta não estiver no dossiê, a operação está em falha.

---

# Capítulo 10 — Escalabilidade

## 10.1 Princípio

Escalar de 10 → 100 → 1.000 médicos **sem mudar o protocolo**.  
O que muda é: **pessoas, filas, paralelismo e ferramentas** — não critérios.

## 10.2 Fase 1 — até 10 médicos (atual)

| Dimensão | Modelo |
|----------|--------|
| Equipe | 1 operador + 1 revisor + 1 curador sênior (podem ser parcial) |
| Fila | Planilha única |
| Dossiê | Pasta por caso |
| Comitê | Ad hoc (COO + curador) |
| TMP alvo | 15 dias |

**Foco:** aprender o fluxo, calibrar tempos, validar reprodutibilidade.

## 10.3 Fase 2 — 10 a 100 médicos

| Dimensão | Modelo |
|----------|--------|
| Equipe | 2 operadores + 2 revisores + 1 curador sênior + COO |
| Fila | Status kanban (Lead → Triagem → Coleta → Verificação → Revisão → Publicado) |
| Paralelismo | Operador: máx. 3 coletas; revisor: máx. 5 verificações |
| Lotes | Expansão por cidade (ex.: Guarapari, Colatina) |
| QA | 10% mantido |
| TMP alvo | 12 dias |

**Não muda:** checklist A–G, níveis A/B/C, hierarquia de fontes.

**Adiciona:** stand-up diário, relatório semanal de KPIs, comitê semanal fixo.

## 10.4 Fase 3 — 100 a 1.000 médicos

| Dimensão | Modelo |
|----------|--------|
| Equipe | Células por região (Metro / Norte / Sul do ES) — 2 pessoas por célula |
| Supervisão | 1 curador sênior por especialidade (ortopedia, neuro) |
| Fila | Sistema de tickets com estados = status operacionais |
| Triagem | Pode ser semi-automatizada (detecção duplicata, CRM) — **decisão final humana** |
| Coleta | Playbooks por tipo de fonte; biblioteca de instituições canônicas |
| Auditoria | Auditor dedicado (20% amostra mensal) |
| TMP alvo | 10 dias |

**Ainda não muda:** Protocolo 1.0, critérios de elegibilidade, níveis, princípios.

## 10.5 O que nunca escala com volume

Estes passos **permanecem humanos e obrigatórios** em qualquer fase:

1. Quatro olhos para Nível A
2. Registro de fonte por fato
3. Resolução de conflito por hierarquia (não por opinião)
4. Comitê para casos ambíguos
5. QA de reprodutibilidade (10%)
6. Proibição de pagamento por inclusão

## 10.6 Sinais de que a operação precisa de mais gente (não de mudar regras)

| Sinal | Resposta operacional |
|-------|---------------------|
| Backlog > meta da fase | Contratar operador/revisor |
| TMP subindo 3 semanas seguidas | Redistribuir ou simplificar lotes geográficos |
| RC abertos > 3 | Pausar novas publicações até zerar |
| QA reprovação > 5% | Treinamento + revisão do playbook (não afrouxar protocolo) |
| Revisões vencidas (180d) | Squad temporário de revisão |

## 10.7 Playbook de expansão geográfica (repetível)

Para cada nova cidade prioritária:

1. COO define meta (ex.: 3 ortopedistas + 2 neuro em Colatina)
2. Operador gera leads (O2) a partir de fontes públicas
3. Triagem em lote
4. Coleta em lote (mesma ordem Cap. 3)
5. Publicação incremental (não esperar lote completo para publicar elegíveis)
6. Relatório de cobertura atualizado

Mesmo playbook em Guarapari, Linhares ou Cachoeiro — **mesmo protocolo, mesma operação**.

---

# Apêndice A — Status operacionais (vocabulário único)

| Status | Significado | Visível ao público? |
|--------|-------------|---------------------|
| `LEAD — Aguardando triagem` | Entrou na fila | Não |
| `LEAD — Dados insuficientes` | Aguardando mínimo para triagem | Não |
| `DESCARTADO — Dxx` | Não elegível | Não |
| `COLETA — Em andamento` | Buscando fontes | Não |
| `COLETA — Complementação` | Volta por lacuna | Não |
| `VERIFICAÇÃO — Aguardando` | Dossiê completo para validar | Não |
| `REVISÃO — Aguardando` | Aguardando revisor | Não |
| `APROVADO — Pronto para publicar` | Checklist F ok | Não |
| `PUBLICADO — Nível A` | Ativo | Sim |
| `PUBLICADO — Nível B` | Ativo com pendências | Sim |
| `SUSPENSO` | Oculto temporariamente | Não |
| `ARQUIVADO` | Removido permanentemente | Não |

---

# Apêndice B — Papéis e dedicación mínima

| Papel | Dedicación mínima (Fase 1) | Dedicación (Fase 3) |
|-------|---------------------------|---------------------|
| COO | 20% | 50% |
| Operador de ingestão | 1 pessoa parcial | 4–6 pessoas |
| Revisor de catálogo | 1 pessoa parcial | 3–4 pessoas |
| Curador sênior | 10% | 1 FTE |
| Auditor | — | 20% |

---

# Apêndice C — Ritual da primeira semana (novo colaborador)

| Dia | Atividade | Documento |
|-----|-----------|-----------|
| 1 | Ler Protocolo 1.0 completo | PROTOCOLO_ALICIA_1.0 |
| 2 | Ler Operação 1.0 + glossário de status | Este documento |
| 3 | Shadowing: triagem de 2 casos | Cap. 2 |
| 4 | Shadowing: coleta de 1 caso | Cap. 3 |
| 5 | Exercício: verificação de 1 caso publicado (QA) | Cap. 4–5 |

**Critério de aptidão:** reproduzir triagem de caso-teste com mesmo resultado do curador — sem explicação verbal adicional.

---

## Controle de versão

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-07-22 | Versão inicial — operação ES ortopedia/neurocirurgia |

**Documentos canônicos AliCIA:**

1. `PROTOCOLO_ALICIA_1.0.md` — critérios e governança  
2. `OPERACAO_ALICIA_1.0.md` — execução diária  

**Próxima revisão:** 90 dias ou ao atingir 25 médicos publicados, o que ocorrer primeiro.

---

*Quem entrar na equipe da AliCIA deve conseguir operar a empresa lendo apenas estes dois documentos — sem treinamento verbal.*
