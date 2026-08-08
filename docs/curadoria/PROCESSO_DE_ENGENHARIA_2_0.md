# PROCESSO DE ENGENHARIA — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | **v1.0** |
| **Estado** | **PROCESSO OFICIAL** — aguardando homologação final do DT-01 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 (missão DT-27) |
| **Data** | 2026-08-04 · **Branch:** `curadoria/onda-1-9-1-10-proveniencia` · **HEAD:** `2c7b202` |
| **Natureza** | **Consolidação.** Nenhuma metodologia nova; nenhuma decisão reinterpretada; nenhuma opinião acrescentada |
| **Origem** | ENG-001 · ENG-002 · ENG-003 (Release 1.0 da Onda 1A) · início da Onda 1B |
| **Autoridade sobre** | como a engenharia da 2.0 trabalha — **nunca** sobre o que ela constrói |
| **Subordinado a** | Constituição · ADRs vigentes · `MODELO_CURADORIA_V1.md` · `CONGELAMENTO_ARQUITETURAL.md` · `ARQUITETURA_CURADORIA_2_0.md` |

> **Este documento não altera domínio, arquitetura funcional, ADR, Método, Onda 1
> ou Onda 2.** Nenhum código, banco, migration ou teste foi tocado para produzi-lo.
>
> **Toda regra abaixo é descrição do que já aconteceu**, com a evidência ao lado.
> Onde não houve prática observada, está escrito que não houve.

---

## 1. Objetivo

O Processo de Engenharia 2.0 existe para responder a uma pergunta que a auditoria
operacional deixou aberta e que as três primeiras Sprints responderam na prática:

> **Como construir a Curadoria 2.0 sem que a engenharia decida, por omissão, o
> que só o Método pode decidir?**

O processo não organiza tarefas — isso qualquer plano faz. Ele organiza
**autoridade**: garante que cada linha de código escrita tenha, antes dela, uma
decisão registrada por quem tinha o direito de tomá-la.

**Três resultados observados que o justificam:**

| Evidência | O que provou |
|---|---|
| Pacote **F-02** interrompido antes da primeira linha (`faf5d8d`) | O Implementador identificou que as entidades não tinham domínio definido. **Parar produziu mais valor que entregar** |
| **Item 1.5** interrompido **duas vezes**, e entregue na terceira (`9f6ee86`) | A primeira parada expôs a falta de definição de "aberto"; a segunda, a falta de caminho de escrita. A entrega só veio quando as duas existiam |
| **Release 1.0 da Onda 1A** fechada com cinco itens (`1599390`) | Itens pequenos, cada um com achado próprio, mergeados um a um, sem reabertura |

---

## 2. Princípios

Cinco princípios, todos com prática observada. **Nenhum é novo** — cada um foi
exercido antes de ser escrito.

### 2.1 · Domínio acima da implementação

O domínio decide o que existe; a implementação decide como. Quando os dois
divergem, **o domínio vence e a implementação para**.

> *Evidência:* o pacote F-02 foi interrompido porque criar `derivation_proposals`
> exigiria que o Implementador escolhesse estados, proveniência e ciclo de
> supersessão — decisões de domínio. As ADR-066/067/068 (`d93d746`) vieram
> depois, e só então o domínio ficou fechado.

### 2.2 · Autoridade antes do código

Nenhum pacote começa sem que a autoridade sobre o que ele constrói esteja
**nomeada e registrada**. Autoridade que só existe em conversa não é autoridade.

> *Evidência:* o Item 1.5 foi bloqueado porque o Método que o sustentava existia
> apenas como resultado de missão. Materializá-lo em documento versionado
> (`METODO_ACOLHIMENTO_PREPARADO.md`) foi pré-condição da implementação.

### 2.3 · Código nunca substitui decisão

Um comportamento implementado não se torna a norma por estar em produção. Onde
código e documento divergem, **um dos dois é defeito** — e quem diz qual é o
Método, nunca o código.

> *Evidência:* o achado P15 (viabilidade entrando no Motor) foi **caracterizado
> por teste** no pacote F-01 sem que a correção fosse aplicada. A evidência
> existe; a decisão (DP-1) segue pendente. **O teste descreve; não decide.**

### 2.4 · Capacidade operacional é o critério de conclusão

Um item está concluído quando **alguém consegue fazer, no produto, o que o item
prometia** — não quando o código compila, não quando os testes passam, não
quando a estrutura existe.

> *Evidência:* o Item 1.5 tinha, no banco, os campos `known_facts` e
> `open_pendencies` desde a migration `20260724023512`. **Existiam e ninguém
> podia preenchê-los** — zero escritores em produção. Estrutura sem caminho de
> escrita não é funcionalidade entregue.

### 2.5 · Parar por ausência de autoridade é decisão correta

Interromper não é falha de execução. É o comportamento esperado quando falta
autoridade — e o relatório de impedimento é entregável tão legítimo quanto o
código.

> *Evidência:* três interrupções (F-02, Item 1.5 duas vezes) produziram três
> decisões de domínio que não existiam. **Nenhuma delas teria sido tomada se a
> engenharia tivesse "resolvido na prática".**

---

## 3. Estrutura

Seis níveis, todos praticados. Cada um com finalidade distinta e rastro próprio
no repositório.

| Nível | Finalidade | Rastro | Exemplo observado |
|---|---|---|---|
| **Programa** | Conjunto de trabalho com uma tese única e um estado final declarado. Não tem prazo; tem critério de saída | documento de arquitetura | **Onda 1A** (correções de defeito) · **Onda 1B** (base de auditabilidade) |
| **Sprint** | Janela de execução com capacidade declarada. Agrupa o que couber; **pode terminar antes do pacote** | prefixo de merge | **ENG-003** — `merge(eng-003): …` |
| **Pré-pacote** | Trabalho que precisa existir **antes** de um Item e não pertence a ele. Normalmente migration ou decisão | prefixo `PP-` | **PP-02** — autoria nos dois Mapas (`89c4225`) |
| **Item** | Unidade de valor com aceite próprio, testes próprios e rollback próprio. É o que se declara concluído | numeração `1.x` | **Item 1.7** (`2c039a3`) |
| **Etapa** | Subdivisão de Item grande demais para um commit honesto. Cada etapa deixa a árvore funcional | sufixo na mensagem | **Item 1.10B-P2, Etapa 1** (`2c7b202`) |
| **Micro-retificação** | Correção pontual sobre trabalho já entregue, sem reabrir o pacote | sufixo `A` no identificador | **F-01A** retificando F-01 (`b85b968`) |

**Regra de fronteira observada:** um Item nunca contém decisão de domínio. Se
contiver, vira interrupção (§7) e a decisão sobe para quem tem autoridade.

---

## 4. Fluxo oficial

```
Programa
   ↓
Dossiê de Prontidão
   ↓
Arquitetura
   ↓
Pré-pacotes
   ↓
Itens
   ↓
Etapas
   ↓
Verificação
   ↓
Certificação
   ↓
Gate DT
   ↓
Release
```

**O que cada seta significa na prática:**

| Transição | Condição para atravessar |
|---|---|
| Programa → Dossiê | O programa tem tese, itens nomeados e estado final declarado |
| Dossiê → Arquitetura | Todos os bloqueios objetivamente detectáveis foram levantados **antes** de alguém abrir editor |
| Arquitetura → Pré-pacotes | O que precisa existir antes dos Itens está nomeado e ordenado |
| Pré-pacotes → Itens | As dependências de cada Item existem de fato, não por promessa |
| Itens → Etapas | Só quando o Item não cabe em um commit honesto |
| Etapas → Verificação | A árvore está limpa e a suíte verde |
| Verificação → Certificação | O delta foi revisado por quem não o escreveu |
| Certificação → Gate DT | A evidência está registrada e é reproduzível |
| Gate DT → Release | Decisão humana explícita — **nunca automática** |

---

## 5. Dossiê de Prontidão

### 5.1 Objetivo

Levantar, **antes de qualquer implementação**, tudo o que pode impedir um Item de
ser concluído — e que seja **objetivamente detectável por leitura do repositório**.

### 5.2 Responsabilidades

| Papel | Responsabilidade |
|---|---|
| **Arquiteto** | Produzir o Dossiê: mapear dependências reais, verificar que cada campo exigido tem caminho de escrita, confirmar que cada autoridade citada existe em documento |
| **Implementador** | Ler o Dossiê antes de abrir editor. **Interromper se encontrar bloqueio que o Dossiê não previu** |
| **DT** | Decidir sobre os bloqueios que exigem autoridade |

### 5.3 Limite

> **O Implementador não deve descobrir bloqueios objetivamente detectáveis.**

Se um bloqueio podia ser encontrado por leitura do repositório — uma tabela sem
coluna, um campo sem escritor, uma guarda ativa, uma ADR inexistente — encontrá-lo
durante a implementação é **falha do Dossiê**, não do Implementador.

> *Evidência:* o Item 1.5 foi aberto duas vezes sobre um Método que exigia
> conteúdo em `known_facts` — campo cuja ausência de escritores era detectável com
> um `grep`. Ambas as interrupções foram corretas, e ambas eram evitáveis.

**O que o Dossiê não cobre:** bloqueios que só aparecem ao executar — falha de
runtime, comportamento inesperado de dependência, divergência entre ambientes.
Esses são descoberta legítima do Implementador.

---

## 6. Implementação

Quatro regras, todas observadas nos vinte e cinco commits do programa.

| # | Regra | Como se manifesta |
|---|---|---|
| **6.1** | **Commits pequenos** | Um commit por Item ou por Etapa. Nenhum commit do programa mistura dois achados |
| **6.2** | **Rollback obrigatório** | Todo Item declara o seu antes de começar. Nos Itens da Onda 1A, o rollback foi sempre "reverter o commit" — possível **porque** os commits são pequenos |
| **6.3** | **Etapas autocontidas** | Cada Etapa deixa a árvore compilando, os testes verdes e o produto funcional. Nenhuma Etapa depende da seguinte para não quebrar |
| **6.4** | **Testes dirigidos** | O teste prova o comportamento que o Item prometeu — não a implementação que o produziu. Testes de caracterização (que descrevem o que existe, sem julgar) são entregável legítimo (F-01) |

**Separação de escopo observada:** o pacote de segurança
(`912db46` → `de162e0`) foi mantido em commit e merge próprios, separado de todo
o trabalho da 2.0. **Misturar escopos é proibido**, e a separação foi preservada
mesmo quando os dois estavam na mesma árvore.

---

## 7. Interrupção

Quatro causas legítimas. **Interromper por qualquer uma delas é execução correta
do processo**, e produz um entregável: o relatório de impedimento.

| # | Causa | Como se reconhece | Ocorrência observada |
|---|---|---|---|
| **7.1** | **Ausência de autoridade** | A decisão necessária não existe em nenhum documento versionado | Item 1.5 — o Método existia só como resultado de missão |
| **7.2** | **Necessidade de ADR** | A implementação exigiria criar ou alterar conceito, escala, critério, estado ou regra de domínio | F-02 — `derivation_proposals` sem ADR-A |
| **7.3** | **Contrato inexistente** | Um campo, action ou superfície exigido pelo escopo não tem caminho de escrita, leitura ou consumo | Item 1.5 — `known_facts` sem escritores |
| **7.4** | **Conflito de domínio** | Dois documentos vigentes exigem coisas incompatíveis, ou uma guarda ativa proíbe o que o Item pede | F-02 × guarda C-01 |

### 7.1b O relatório de impedimento

Formato observado (`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`):

1. **Ponto exato da interrupção** — antes de qual linha
2. **Os bloqueios, numerados**, com evidência reproduzível
3. **Bloqueios menores** que não bastam sozinhos mas somam
4. **O que não foi feito, e por que não parcialmente**
5. **Alternativas técnicas possíveis — nenhuma escolhida**
6. **Decisões necessárias para desbloquear**
7. **Conformidade** — o que não foi tocado

**Regra:** o relatório **lista alternativas e não escolhe**. Escolher seria o
Implementador decidindo o domínio pela porta dos fundos.

---

## 8. Verificação

| # | Regra | Conteúdo |
|---|---|---|
| **8.1** | **Verificação independente** | Quem verifica não é quem escreveu. A verificação lê o resultado, não a intenção |
| **8.2** | **Foco no delta** | Verifica-se o que mudou, não o sistema inteiro. O que não foi tocado é responsabilidade das guardas permanentes |
| **8.3** | **Classificação das divergências** | Toda divergência encontrada recebe classe, e a classe determina o destino |

### 8.3b Classes de divergência

| Classe | Definição | Destino |
|---|---|---|
| **Defeito** | O entregue não faz o que o Item prometeu | Corrige-se no próprio Item, antes de fechar |
| **Divergência de escopo** | O entregue faz mais ou menos que o combinado | Volta ao DT: reduzir o entregue ou ampliar o aceite |
| **Divergência de domínio** | O entregue contraria documento vigente | **Interrupção** (§7.4) — nunca se resolve na verificação |
| **Micro-retificação** | Ajuste pontual, sem mudança de comportamento acordado | §9 |
| **Achado fora de escopo** | Problema real, alheio ao Item | Registra-se; **não se corrige aqui** |

---

## 9. Micro-retificações

### 9.1 O que é

> **Micro-retificação é a correção pontual de um trabalho já entregue, que não
> altera o comportamento acordado nem o aceite do pacote original.**

Recebe o identificador do pacote original com sufixo `A`, `B`, …

> *Evidência:* **F-01A** retificou as guardas entregues por **F-01**, e o commit
> registra os dois no mesmo rastro: *"guardas executaveis da 2.0 (F-01,
> retificadas por F-01A)"* (`b85b968`).

### 9.2 Quando utilizar

| Cabe micro-retificação | Exemplo |
|---|---|
| A guarda entregue não cobria um caso que ela mesma se propunha a cobrir | F-01A |
| Um teste passava por motivo errado | — |
| Texto, nome ou mensagem que não altera comportamento | — |
| Correção que o próprio autor identifica logo após entregar | — |

### 9.3 Quando **não** reabrir o pacote

> **Micro-retificação não reabre Sprint, não reabre Item e não reabre aceite.**

Reabrir seria tratar como falha de planejamento o que é ajuste fino de execução —
e tornaria caro corrigir, o que é o incentivo errado.

### 9.4 Quando **não** é micro-retificação

| Não é | É |
|---|---|
| Muda o comportamento que o aceite descreveu | **Item novo** |
| Exige decisão que ninguém tomou | **Interrupção** (§7) |
| Altera domínio, escala, critério ou guarda | **ADR** |
| Amplia o escopo entregue | **Divergência de escopo** (§8.3b) |

---

## 10. Capacidade Operacional

### 10.1 A definição

> **Um Item passa de infraestrutura para funcionalidade entregue quando existe um
> caminho completo, exercitável por uma pessoa real, do ato até o efeito.**

### 10.2 Os quatro elos

Um item só tem Capacidade Operacional quando **os quatro** existem:

| # | Elo | Pergunta |
|---|---|---|
| 1 | **Superfície** | Onde a pessoa age? |
| 2 | **Caminho de escrita** | O ato chega ao banco? |
| 3 | **Consumidor** | Alguém lê o que foi gravado? |
| 4 | **Efeito observável** | Algo muda no produto por causa disso? |

**Faltando qualquer um, o item é infraestrutura** — legítima, às vezes necessária,
mas **não concluída**.

> *Evidência:* `known_facts` e `open_pendencies` existiam no banco (elo 2 parcial),
> eram lidos pelo repositório (elo 3) e alimentavam a lista de pendências da Mesa
> (elo 4) — **e não tinham superfície nem action de escrita** (elos 1 e 2). Três
> de quatro elos, e a funcionalidade não existia. **Item 1.5 só fechou quando os
> quatro existiram** (`9f6ee86`).

### 10.3 A exceção declarada

Um Item pode ser **deliberadamente** infraestrutura — código inerte por desenho.
Nesse caso, **a inércia é o aceite**, e precisa estar escrita.

> *Exemplo vigente:* o Item **1.A** entrega função pura "sem persistência, sem
> consumidor, sem superfície", com aceite "zero chamadores, verificável". Não é
> item incompleto: é item cuja promessa é não estar ligado.

---

## 11. Releases

| Conceito | Definição | Critério de fechamento | Exemplo |
|---|---|---|---|
| **Sprint** | Janela de execução com capacidade declarada | **Estado limpo e retomável** — não o pacote completo | ENG-003 |
| **Release** | Conjunto de Itens publicável, com valor coerente para quem usa | Todos os Itens com Capacidade Operacional + Gate DT | **Release 1.0 da Onda 1A** |
| **Onda** | Programa com tese única e estado final declarado | Todos os seus Itens fechados | Onda 1A · Onda 1B |

### 11.1 As três diferenças que importam

| Diferença | Consequência |
|---|---|
| **Sprint é tempo; Release é valor; Onda é tese** | Uma Sprint pode conter meia Onda; uma Onda pode levar três Sprints |
| **Sprint pode fechar incompleta; Release não** | Sprint fecha em estado limpo; Release fecha com Capacidade Operacional |
| **Só a Release atravessa o Gate DT** | Sprints não pedem decisão humana; Releases sim |

---

## 12. Regras permanentes

**As oito regras do processo.** Alteração exige decisão formal do DT-01 (§13).

| # | Regra |
|---|---|
| **1** | **Nunca implementar antes do Dossiê.** |
| **2** | **Nunca inventar autoridade.** Autoridade que não está em documento versionado não existe. |
| **3** | **Nunca alterar domínio sem autorização.** |
| **4** | **Código compilando não significa funcionalidade entregue.** |
| **5** | **Micro-retificações não reabrem Sprint.** |
| **6** | **Capacidade Operacional é o único critério para considerar um item concluído.** |
| **7** | **Parar por ausência de autoridade é decisão correta.** |
| **8** | **Uma Sprint pode terminar antes do pacote se deixar a engenharia em estado limpo e retomável.** |

---

## 13. Governança

| # | Regra |
|---|---|
| **13.1** | **Este documento somente pode ser alterado por decisão formal do DT-01.** Nenhum agente o altera por iniciativa própria — inclusive o Arquiteto que o redigiu |
| **13.2** | **Mudanças de processo exigem evidência produzida por múltiplas Sprints.** Uma Sprint difícil não é evidência; é amostra de uma |
| **13.3** | **Este documento não tem autoridade sobre o que se constrói** — só sobre como. Onde conflitar com Arquitetura, Modelo, ADR ou Congelamento, **eles vencem** |
| **13.4** | **Toda regra deste documento é descritiva de prática observada.** Regra sem prática observada não entra — entra como proposta, e espera as Sprints |

### 13.5 Limitações declaradas desta versão

| # | Limitação |
|---|---|
| 1 | **ENG-001 e ENG-002 não existem como documento.** O rastro é o histórico de commits. A consolidação usou a evidência disponível; onde ela não alcança, este documento **não afirma** |
| 2 | **A Verificação Independente (§8) tem uma ocorrência registrada** (F-01A). É a seção com menos prática observada, e a primeira candidata a revisão quando houver mais Sprints |
| 3 | **A Certificação do fluxo (§4) ainda não produziu parecer próprio** para a 2.0. A etapa está no fluxo porque foi acordada, não porque foi exercida |

---

*Fim do Processo de Engenharia 2.0 v1.0. **Nenhum Item foi aberto. Nenhum código,
banco, migration, teste ou documento de arquitetura foi alterado.** Encaminhamento
exclusivo: **DT-01**, para homologação final.*
