# ADR-B — Juízo Humano e o Registro dos Julgamentos do Curador

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` |
| **Estado** | **EM ELABORAÇÃO CONCLUÍDA — aguardando revisão constitucional do Agente 00.** Não lavrada em `DECISIONS.md` |
| **Natureza** | **Decisão de domínio.** Não descreve banco, migration, API, interface, dashboard ou código |
| **Subordinada a** | Constituição da Aliviar · **ADR-035** (autoridade decisória única do Curador) · [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0 · [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) |
| **Complementa** | [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) — a ADR-A define o oferecimento; esta define o juízo |
| **Referencia** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 §3, §5.5, §9.4, §10.6, §11 · [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md) v1.0 Partes 4 e 5.3 · [`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`](IMPEDIMENTO_F_02_MODELO_DE_DADOS.md) |
| **Origem** | Missão "ADR-B", em resposta ao impedimento I-1 do pacote F-02 (metade `curator_judgments`) |

> **Nada foi implementado.** Nenhuma tabela, migration, constraint, índice, policy, API,
> interface, dashboard, tipo, teste ou linha de código foi criada ou alterada. Nenhum
> documento canônico foi modificado. Este arquivo é o único produto da missão.
>
> **Por que não está em `DECISIONS.md`:** lavrar pressupõe aprovação, e esta ADR ainda vai
> à revisão constitucional. Mesmo motivo declarado na ADR-A.
>
> **Dívida documental (RS-11):** esta ADR **prescreve** a reescrita do
> `MODELO_CURADORIA_V1.md` §7.1–§7.4 e §11 com texto pronto (§30). A execução dessa
> reescrita é ato da **aprovação**, não desta missão — alterar o Modelo agora seria
> antecipar uma decisão que ainda não foi tomada.

---

## Sumário executivo

A ADR-A respondeu o que o Método **oferece**. Esta responde o que o Método **jamais poderá
decidir sozinho**.

A definição-raiz:

> **Juízo Humano é o ato indivisível pelo qual uma pessoa nomeada, com autoridade prevista,
> atribui sentido a fatos que o Método reuniu mas não pode compor — produzindo uma
> conclusão que não é dedutível dos fatos isoladamente, e assumindo responsabilidade
> pessoal por ela.**

Disso decorre a decisão de escopo mais consequente desta ADR, e a que o F-02 esperava:

> **`curator_judgments` registra exatamente duas naturezas de juízo — `TECNICO` e
> `RELACIONAL` — sobre exatamente seis conceitos. Nada mais.** Área é filtro. Verificação e
> divergência são governança da informação. Confirmação é ADR-A. Seleção e autoria são
> decisões, e decisões não moram aqui.

E a distinção que organiza tudo:

> **Confirmar é responder a um valor que já foi formulado. Julgar é formular.** Confundir as
> duas coisas é a maneira mais rápida de transformar juízo em carimbo — e é exatamente o
> que a arquitetura de dois pipelines existe para impedir.

---

# PARTE I — A natureza do Juízo Humano

## 1. O que é um Juízo Humano

**Definição formal:**

> **Juízo Humano** é o **ato indivisível** pelo qual uma **pessoa nomeada**, investida de
> **autoridade prevista** sobre a matéria, **atribui sentido** a um conjunto de fatos que o
> Método reuniu, comparou e apresentou — mas que ele **não pode compor**, porque a
> composição depende de considerar **este caso** e **esta pessoa** —, produzindo uma
> **conclusão** que não é dedutível dos fatos tomados isoladamente, e pela qual essa pessoa
> **responde**.

Seis elementos constitutivos. Falta de qualquer um e não há juízo:

| # | Elemento | Sem ele |
|---|---|---|
| 1 | **Pessoa nomeada** | não há quem responda; conclusão anônima é conclusão de ninguém |
| 2 | **Autoridade prevista** sobre a matéria | é opinião de terceiro, não juízo do Método |
| 3 | **Fatos reunidos e visíveis** | é palpite; julgar no escuro não é julgar |
| 4 | **Irredutibilidade** — a conclusão não decorre dos fatos por regra | se decorresse, seria derivação, e derivação não é juízo (§16) |
| 5 | **Conclusão** — uma posição, não uma dúvida registrada | "não sei ainda" é ausência legítima de juízo, não juízo |
| 6 | **Responsabilidade** | juízo sem autoria é o problema que a 2.0 existe para resolver |

**O critério de irredutibilidade, aplicado.** Um juízo é humano quando duas pessoas
igualmente competentes, olhando os mesmos fatos, poderiam legitimamente concluir coisas
diferentes — **e nenhuma das duas estaria errada por regra**. É o caso de:

- *"esta residência em ortopedia responde a este caso?"* — a mesma formação é excelente
  para um caso e irrelevante para outro (`dossie.ts`);
- *"'decide e comunica a conduta' serve a esta pessoa?"* — corresponde a quem prefere que o
  médico decida e **colide** com quem quer participar. **A mesma conduta muda de sentido
  conforme a pessoa** (`DOMINIO_COMPATIBILIDADE_RELACIONAL` §1.2).

Quando duas pessoas competentes **não** podem divergir legitimamente — *"ela pediu resumo
escrito; ele declara que envia resumo escrito"* —, não há juízo a fazer. Há leitura. E
leitura é do Motor.

## 2. O que NÃO é Juízo Humano

Respondido explicitamente, porque cada item é um modo real de a 2.0 falhar:

| # | Não é juízo | Por quê |
|---|---|---|
| 1 | **Confirmar uma proposta** | confirmar responde a um valor já formulado; julgar formula. Ver §16 |
| 2 | **Preferência ou gosto do Curador** | juízo é sobre o encontro entre este caso e este profissional, nunca sobre afinidade |
| 3 | **Diagnóstico, prescrição ou conduta clínica** | proibição permanente do papel; o Curador nunca interpreta clinicamente |
| 4 | **Opinião sobre a pessoa do profissional** | ADR-040 item 2: nenhum adjetivo de qualidade sobre gente |
| 5 | **Anotação em texto livre** | anotação não conclui, não tem alvo declarado e não entra em explicação |
| 6 | **Nota, peso, percentual ou posição** | não há escala no juízo; ele conclui, não mede |
| 7 | **Leitura de duas declarações fechadas** | é comparação, e comparação é do Motor (`dossie.ts`: *"ler, não inferir"*) |
| 8 | **Verificar uma evidência** | é **governança da informação**, não compatibilidade — I-5 separa as duas, e esta ADR mantém a separação (§4.3) |
| 9 | **Resolver uma divergência entre fontes** | idem: governança |
| 10 | **Escolher os três caminhos** | é **decisão**, não juízo. Ver §16 e §4.2 |
| 11 | **Aprovar e emitir o Relatório** | é **autoria**, ato distinto |
| 12 | **Qualquer coisa que o sistema possa reproduzir** | se é reproduzível por regra, não é irredutível — logo não é juízo |
| 13 | **Ato de terceiro em nome do Curador** | juízo é indelegável (§7 condição 8) |

## 3. A missão do Curador depois da Curadoria 2.0

**A formulação canônica**, que esta ADR fixa:

> **O Curador é o garantidor da qualidade da informação sobre a qual a Curadoria decide, o
> autor dos juízos que o Método reserva ao humano, e o único decisor dos três caminhos.**

Quatro funções, e nenhuma delas é transcrição:

| # | Função | Natureza | Onde se registra |
|---|---|---|---|
| **F1** | **Garantir a qualidade da informação** — verificar evidência, resolver divergência, recusar proposta errada | governança | Base de Evidências · divergências · desfechos da ADR-A |
| **F2** | **Julgar o que é irredutível** — 3 conceitos técnicos + 3 conceitos relacionais | **juízo** | **`curator_judgments`** |
| **F3** | **Declarar o que só ele sabe** — contexto clínico, importância dos 11 conceitos técnicos, filtros eliminatórios (incl. área) | declaração | estruturas próprias |
| **F4** | **Decidir e assinar** — selecionar os três, compor a abertura, aprovar, emitir, apresentar | **decisão e autoria** | seleção · Relatório |

**O que isso é, em relação ao que era:** é **mais** responsabilidade, não menos. Hoje
verificar evidência, resolver divergência e julgar o que o catálogo marca `humano`
competem por atenção com ~68 atos, dos quais a maioria é digitação. A 2.0 remove a
digitação e deixa as quatro funções acima — todas irredutíveis.

## 4. Decisões que permanecem exclusivamente humanas — lista exaustiva

Dezesseis atos. A lista é **fechada**: ato humano que não esteja aqui não existe como
exclusividade, e ato daqui não pode ser automatizado sem ADR que revogue esta.

### 4.1 Atos da paciente — 2 (nunca do Curador, nunca do sistema)

| # | Ato | Fundamento |
|---|---|---|
| **H1** | **Reconhecer o Perfil de Prioridades** | Invariante 12 da Ontologia; ADR-042 removeu a versão em que o Curador reconhecia por ela; ADR-049 rege a supersessão |
| **H2** | **Registrar a decisão**, incluindo "nenhuma destas" | é a decisão dela sobre a própria vida; "nenhuma" é desfecho legítimo e igualmente barato |

### 4.2 Atos do Curador — 12

| # | Ato | Natureza | Registro |
|---|---|---|---|
| **H3** | **Ouvir a história e devolvê-la até ela reconhecer** | escuta | consulta / narrativa |
| **H4** | **Estruturar o contexto clínico** (sem jamais diagnosticar) | declaração | contexto do Case |
| **H5** | **Separar inegociável de desejo** | juízo **de filtro** | estrutura de filtros (§5.5 da Arquitetura) |
| **H6** | **Declarar a compatibilidade de área**, par a par, em 4 estados | juízo **de filtro** | estrutura de filtros — **não** `curator_judgments` (§4.4) |
| **H7** | **Declarar a importância dos 11 conceitos técnicos** (sem lado da pessoa) | declaração | Mapa de Prioridades |
| **H8** | **Julgar FORMAÇÃO contra este caso** | **juízo `TECNICO`** | **`curator_judgments`** |
| **H9** | **Julgar EXPERIÊNCIA contra este caso** | **juízo `TECNICO`** | **`curator_judgments`** |
| **H10** | **Julgar HISTÓRICO contra este caso** | **juízo `TECNICO`** | **`curator_judgments`** |
| **H11** | **Julgar os 3 conceitos relacionais `humano`** — `MODELO_DECISAO_COMPARTILHADA`, `MODELO_PREFERENCIAS_E_RESTRICOES`, `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` | **juízo `RELACIONAL`** | **`curator_judgments`** |
| **H12** | **Selecionar os três caminhos** | **decisão** | seleção, com autoria |
| **H13** | **Compor a abertura e assumir autoria do Relatório** (aprovar, emitir) | **autoria** | Relatório |
| **H14** | **Apresentar pessoalmente na devolutiva** | encontro | devolutiva |

### 4.3 Atos de governança da informação — 2 (Curador ou papel interno previsto)

| # | Ato | Fundamento |
|---|---|---|
| **H15** | **Verificar uma evidência** — ato humano assinado, vinculado a uma **versão específica** | I-6 |
| **H16** | **Resolver divergência entre fontes**, preservando as duas versões | política de fontes |

### 4.4 A decisão de escopo — o que entra em `curator_judgments`

**Somente H8, H9, H10 e H11.** Duas naturezas, seis conceitos:

| Natureza | Conceitos | Quantos por par (Case, profissional) |
|---|---|---|
| **`TECNICO`** | `FORMACAO` · `EXPERIENCIA` · `HISTORICO` | até 3 |
| **`RELACIONAL`** | `MODELO_DECISAO_COMPARTILHADA` · `MODELO_PREFERENCIAS_E_RESTRICOES` · `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` | até 3 |

**Lista fechada de naturezas. Lista fechada de conceitos.** Acrescentar qualquer um exige
nova ADR que referencie esta.

**As quatro exclusões, com justificativa** — porque cada uma foi tentação real:

| Excluído | Por quê |
|---|---|
| **`AREA`** (ressalva RS-03, confirmada aqui) | área é **filtro eliminatório**: tem quatro estados próprios (`COMPATIVEL`/`PARCIALMENTE_COMPATIVEL`/`INCOMPATIVEL`/`INFORMACAO_INSUFICIENTE`), **elimina**, e produz motivo de não-participação. Guardá-la junto dos juízos convidaria a tratá-la com a mesma ergonomia — inclusive em bloco, que o §5.4.0 proíbe para filtros |
| **Os 3 critérios do lado da pessoa** (`ACESSO`, `CONTINUIDADE_DO_CUIDADO`, `MODELO_DE_ATENDIMENTO`) | deixam de ser humanos (§5). O Motor já responde, com 28 conceitos contra 3 critérios |
| **Verificação e divergência** (H15, H16) | **I-5: governança ≠ compatibilidade.** O estado da informação nunca usa o vocabulário da correspondência. Misturá-los no mesmo registro é a primeira porta para "evidência não verificada ⇒ menos compatível", que é exatamente o que I-5 proíbe |
| **Seleção e autoria** (H12, H13) | são **decisão** e **autoria**, não juízo (§16). Têm registro próprio, com composição e justificativa |

## 5. Decisões que deixam de ser humanas — lista exaustiva

**Três, e apenas três.** Todas pela mesma razão: falham no critério de irredutibilidade
(§1) — duas pessoas competentes **não** podem divergir legitimamente sobre elas.

| # | Deixa de ser humana | Passa a | Fundamento |
|---|---|---|---|
| **1** | **Declarar o critério `ACESSO`** por profissional | leitura do Motor sobre os conceitos do eixo Acesso | `dossie.ts`: *"duas declarações comparadas… ler, não inferir"* |
| **2** | **Declarar o critério `CONTINUIDADE_DO_CUIDADO`** | leitura do Motor sobre o eixo Continuidade | idem |
| **3** | **Declarar o critério `MODELO_DE_ATENDIMENTO`** | leitura do Motor (Compatibilidade) + **juízo humano preservado** nos 3 conceitos `humano` do eixo (H11) | idem, com a ressalva de que o eixo tem parte automática e parte humana — e a ADR-065 já as separou |

**A divisão exata da etapa AVALIAÇÃO**, que era a decisão que faltava:

```
AVALIAÇÃO (1.0)                          AVALIAÇÃO (2.0)
6 critérios × N profissionais            ┌─ 3 critérios do lado da pessoa → MOTOR (leitura)
= 6N declarações manuais                 └─ 3 critérios técnicos → CURADOR (juízo H8–H10)
com texto livre de evidência                + 3 conceitos relacionais → CURADOR (juízo H11)
                                            com referência a evidência, nunca texto redigitado
```

**O que NÃO deixa de ser humano, apesar de parecer:** nada mais. Em particular, **a área
permanece humana** (H6) — a ADR-035 é explícita: comparar texto livre com texto livre é
inferência semântica, e o erro é invisível.

**O que nunca foi humano e apenas para de ser encenado como tal:** os checkboxes de
Acolhimento, o avanço do funil, a abertura do Case, as dimensões redigitadas para a
paciente. Não estão em §5 porque nunca foram juízo — eram burocracia com aparência de ato.

## 6. Decisões que passam definitivamente para o Método

"Definitivamente" significa: **não voltam por decisão de implementação nem de operação.**
Voltar exige ADR que revogue esta.

| # | Passa ao Método | Natureza |
|---|---|---|
| 1 | A **leitura conceito a conceito** — Compatibilidade e Relacional, separadas | correspondência em matriz fechada |
| 2 | O **inventário de lacunas**, com as cinco naturezas distintas | fato sobre a informação |
| 3 | A **aplicação** de filtro já declarado e confirmado (nunca a decisão do filtro) | execução |
| 4 | A **elegibilidade objetiva** — filtros com resposta fechada | comparação |
| 5 | O **bloqueio por divergência crítica aberta** | regra |
| 6 | O **vencimento de verificação** | regra de tempo |
| 7 | A **explicação** — a Ficha, com as seis respostas | verbalização com proveniência |
| 8 | As **cinco dimensões que a paciente lê** | derivação da leitura, não redigitação |
| 9 | A **completude** do Mapa e do Perfil | contagem |
| 10 | A **projeção de progresso** e o **responsável atual** | derivação de fato registrado |

**O que o Método nunca ganha, em nenhuma versão:** pontuar, somar, ordenar por resultado,
eliminar por leitura, concluir qualidade, escolher, assinar.

---

# PARTE II — O julgamento como registro

## 7. O que constitui um julgamento válido

Oito condições **cumulativas**. A falta de qualquer uma torna o ato **inexistente**, não
inválido — a distinção importa: um ato inexistente não deixa registro de tentativa
frustrada, simplesmente não aconteceu.

| # | Condição |
|---|---|
| 1 | **Autor nomeado e autenticado**, com autoridade prevista sobre a matéria (§4) |
| 2 | **Alvo determinado** — o par (Case, profissional) e o **conceito canônico por código**, nunca por rótulo (I-2) |
| 3 | **Natureza declarada** — `TECNICO` ou `RELACIONAL`, e nenhuma outra |
| 4 | **Fatos visíveis no momento do ato**, registrados: as declarações dos dois lados e as evidências referenciadas, cada uma com versão |
| 5 | **Conclusão expressa** — uma leitura afirmada, não uma dúvida. "Ainda não sei" **não** produz julgamento; produz ausência, e ausência é estado legítimo |
| 6 | **Ato explícito e positivo** — nunca por decurso de prazo, navegação, rolagem, fim de sessão ou herança de julgamento anterior |
| 7 | **Referência a evidência, nunca redigitação** — o juízo aponta para os registros da Base; não copia o texto deles (resolve R10 da auditoria) |
| 8 | **Indelegável** — ninguém julga em nome de outro; não existe julgamento "pela equipe", "pelo plantão" ou "pelo sistema, revisado por" |

**O que um julgamento válido explicitamente NÃO exige:**

| Não exige | Por quê |
|---|---|
| **Extensão mínima de texto** | juízo curto e certo vale mais que parágrafo defensivo |
| **Concordância com a leitura do Motor** | o Motor não decide; divergir dele é exercício legítimo, e deve ser tão barato quanto concordar |
| **Que todas as lacunas estejam fechadas** | julgar sobre informação incompleta é legítimo **se a incompletude estiver visível** — o que a condição 4 garante |
| **Aprovação de terceiro** | ADR-035: autoridade decisória única |

## 8. Informação que obrigatoriamente acompanha um julgamento

Onze itens. **Julgamento sem qualquer um deles não existe** (§7).

| # | Informação | Por que é obrigatória |
|---|---|---|
| 1 | **Identidade** do julgamento | referência estável para os atos e explicações que o citam |
| 2 | **Alvo** — Case, profissional, conceito (por código) | define de quem é a autoridade e onde a conclusão se aplica |
| 3 | **Natureza** — `TECNICO` ou `RELACIONAL` | determina a fronteira: técnico nunca fala de relação, relacional nunca fala de mérito |
| 4 | **Autor** — pessoa nomeada | quem responde |
| 5 | **Data do ato** | o "quando" |
| 6 | **A conclusão** — o texto do Curador | é o juízo |
| 7 | **Fatos visíveis** — declarações dos dois lados, com versão | o que ele estava olhando |
| 8 | **Evidências referenciadas**, cada uma com versão e estado de verificação | sustenta a conclusão sem duplicar o texto (§7 condição 7) |
| 9 | **Versão do catálogo vigente** | permite reler sem reinterpretar (§7.5 da Governança) |
| 10 | **Versão do próprio julgamento** | §9 |
| 11 | **Estado** | §13 |

**Sobre o estado de verificação da evidência (item 8):** ele acompanha a referência **sem
contaminar a conclusão**. Julgar apoiado em evidência não verificada é permitido, **é
registrado como tal**, e aparece na Ficha como **lacuna de governança** — nunca como
compatibilidade menor. É I-5 aplicado ao juízo.

## 9. O julgamento possui versões

**Sim.** Diferentemente da proposta — que é imutável e cujo desfecho é fato separado (ADR-A
§5) —, o julgamento é **naturalmente revisável**: o Curador aprende sobre o Case ao longo
dele, e revisar um juízo é sinal de bom trabalho, não de erro.

| Regra | Conteúdo |
|---|---|
| **Regime** | **Append-only.** Nenhuma versão é editada ou apagada |
| **Retificar** | é **gravar versão nova**, com autor e data próprios (I-7) |
| **Vigência** | a versão mais recente **em estado `VIGENTE`** é a que vale; todas as anteriores permanecem legíveis |
| **Sequência** | as versões formam cadeia: cada uma referencia a anterior |
| **Autoria** | a versão nova pode ter **autor diferente** da anterior — outro Curador assumindo o Case. A autoria é da versão, nunca do julgamento como um todo |
| **Motivo** | **oferecido, nunca exigido** — mesmo fundamento do P-10 aplicado à recusa na ADR-A §7 |

## 10. O julgamento pode ser corrigido — e como

**Sim, sempre, e apenas por acréscimo.**

| Situação | Como se corrige |
|---|---|
| **O Curador mudou de entendimento** | grava versão nova; a anterior fica no histórico |
| **Novos fatos apareceram** (evidência nova, divergência resolvida) | grava versão nova, referenciando os fatos novos |
| **O texto ficou mal escrito** | versão nova. **Nunca edição no lugar**, mesmo para vírgula |
| **O julgamento foi feito no profissional errado** | **retira-se** (§13, `RETIRADO`) e julga-se o certo. Não se "move" julgamento entre alvos |
| **O Curador não deveria ter julgado ainda** | **retira-se**; o conceito volta a **ausência de juízo**, que é estado legítimo e visível |
| **A conclusão foi baseada em declaração que a pessoa retratou** | supersessão automática (§12) — não é correção, é consequência |

**Não existe "desjulgar" no sentido de apagar.** Um julgamento que existiu, existiu — e o
Relatório que se apoiou nele precisa poder mostrar em quê se apoiava.

## 11. Quando um julgamento deixa de valer

Distinguir **deixar de valer** (não é mais a leitura vigente) de **deixar de existir**
(nunca acontece):

| # | Deixa de valer quando | Estado resultante |
|---|---|---|
| 1 | **Uma versão nova o substitui** | `SUPERADO` |
| 2 | **O autor o retira** sem substituir | `RETIRADO` |
| 3 | **A declaração de origem de um dos lados é retratada** | `SUPERADO` (§12) |
| 4 | **A evidência que o sustenta é superada por versão nova** | `SUPERADO` (§12) |
| 5 | **O profissional deixa de participar do Case** (filtro passa a incompatível) | permanece `VIGENTE`, mas **sai da leitura** — o julgamento não erra por o profissional ter saído |
| 6 | **O conceito é desativado no catálogo** | `SUPERADO`, **exceto em Case aberto** — Case aberto nunca perde conceito no meio do caminho |

**O que nunca faz um julgamento deixar de valer:** passagem de tempo · troca de Curador ·
encerramento do Case · mudança de versão do catálogo sem desativação do conceito ·
discordância de terceiro.

## 12. Quando um julgamento é supersedido

Quatro causas, todas objetivas:

| # | Causa | Efeito |
|---|---|---|
| **JS1** | **Versão nova do próprio julgamento** | a anterior vai a `SUPERADO`; a nova nasce `VIGENTE` |
| **JS2** | **Declaração de origem retratada** — de qualquer um dos dois lados | vai a `SUPERADO`; **novo ato humano é exigido**; o conceito volta a **ausência de juízo**, nunca ao juízo anterior |
| **JS3** | **Evidência referenciada superada por versão nova** | vai a `SUPERADO`; o Curador é notificado de que há juízo a refazer sobre fato novo |
| **JS4** | **Conceito desativado no catálogo** (só Cases novos) | vai a `SUPERADO` |

**A regra que fecha o ciclo — idêntica à da ADR-A §9, e por igual motivo:**

> **Nenhum juízo permanece vigente apoiado em fato retratado.**

**Três consequências que precisam estar visíveis na operação:**

| Consequência | Comportamento |
|---|---|
| O conceito perde a conclusão | volta a **ausência de juízo** — e a Ficha diz `AGUARDA_JUIZO_DO_CURADOR`, que é a verdade |
| A leitura muda | recalculada, porque nunca foi persistida |
| **Relatório já emitido não se reescreve sozinho** | documento emitido é imutável; corrigi-lo é **errata versionada** (ADR-050), ato humano — nunca efeito colateral |

**JS3 é a causa mais delicada** e esta ADR a decide explicitamente: **evidência nova
supersede o juízo, mesmo que a conclusão provavelmente não mudasse.** A alternativa —
manter o juízo e "avisar" — produziria conclusões vigentes apoiadas em fatos que ninguém
releu, que é exatamente a opacidade que a 2.0 combate. Custa um ato a mais; compra a
garantia de que toda conclusão vigente foi feita sobre os fatos vigentes.

## 13. Estados de um julgamento — lista fechada

**Três estados. Lista fechada.** Estado que não está aqui não existe no domínio.

| Estado | Significado | Terminal? |
|---|---|---|
| **`VIGENTE`** | é a conclusão que vale agora para aquele (Case, profissional, conceito) | não |
| **`SUPERADO`** | deixou de valer por JS1–JS4 (§12) | sim |
| **`RETIRADO`** | o autor o retirou sem substituir; o conceito voltou a ausência de juízo | sim |

**Duas decisões explícitas:**

**(a) `PENDENTE` não é estado** — mesma razão da ADR-A §11a. Ausência de juízo é ausência de
registro, não registro em estado de espera. A Mesa e a Ficha derivam
`AGUARDA_JUIZO_DO_CURADOR` da **ausência**, e é assim que a ADR-065 já opera.

**(b) Não existe estado de "rascunho"** — juízo em elaboração não é juízo (§7 condição 5).
O que a superfície faz com texto não submetido é matéria de implementação (§27), e esse
texto **não é** um julgamento.

**Invariante de unicidade:** para cada (Case, profissional, conceito) existe **no máximo um
julgamento `VIGENTE`**. Dois vigentes simultâneos sobre o mesmo alvo é estado impossível no
domínio.

## 14. O julgamento possui autoridade própria?

**Sim — autoridade decisória originária, exercida sobre fatos que não lhe pertencem.**

É a diferença exata em relação à proposta:

| | Proposta (ADR-A §3) | Julgamento |
|---|---|---|
| Autoridade sobre o valor | **nenhuma** | **total** — a conclusão é dele |
| Autoridade probatória | sobre o oferecimento | sobre o ato de julgar |
| Depende de humano posterior | **sim** — precisa ser confirmada | **não** — ele já é o ato |
| Origem da autoridade | a regra (que não decide) | a pessoa (ADR-035) |

**Mas a autoridade é condicionada em três sentidos** — e isso não a diminui, apenas a
delimita:

| # | Condição | Significado |
|---|---|---|
| 1 | **Condicionada aos fatos** | julgar exige fatos visíveis (§7 condição 4). A autoridade é para **concluir**, nunca para **inventar** o que os dois lados declararam |
| 2 | **Condicionada ao alvo** | um juízo `TECNICO` não conclui sobre relação, e um `RELACIONAL` não conclui sobre mérito técnico. Fronteiras escritas, herdadas do catálogo |
| 3 | **Condicionada à vigência do fato** | quando o fato é retratado, a autoridade não sobrevive a ele (§12) |

**O que a autoridade do julgamento nunca alcança:** eliminar profissional (é filtro) ·
ordenar (não existe ordenação) · pontuar · concluir sobre a pessoa do profissional ·
decidir os três (é H12, ato distinto) · alterar catálogo, escala, célula ou regra.

## 15. Como o julgamento se relaciona com as demais peças

| Peça | Relação | Regra fechada |
|---|---|---|
| **Declaração** | o julgamento **lê** declarações dos dois lados; nunca as altera, nunca as substitui, nunca as parafraseia como se fossem dele | uma declaração retratada supersede o juízo (JS2) |
| **Proposta** | **nenhuma relação direta.** Proposta é oferecimento sobre campo de escala fechada; juízo é conclusão sobre conceito irredutível. **Nunca existe proposta de julgamento** — o Método não pré-escreve o juízo do Curador, nem "para agilizar" |
| **Explicação** | o julgamento **entra** na Ficha como conclusão assinada, com autor e data. Onde não há julgamento, a Ficha declara `AGUARDA_JUIZO_DO_CURADOR` — **jamais inventa, jamais omite em silêncio** |
| **Evidência** | o julgamento **referencia** evidência com versão; nunca a copia (§7 condição 7). Evidência superada supersede o juízo (JS3). O estado de verificação acompanha sem contaminar (§8) |
| **Relatório** | frases sobre conceitos `humano` **só existem depois do julgamento**; o texto do Curador aparece **na íntegra ou não aparece** — o sistema nunca o resume nem o reescreve (§25) |

**A regra que amarra todas:** **nenhuma peça pode produzir, simular, antecipar ou substituir
um julgamento.** Se em alguma superfície houver um caminho pelo qual um juízo apareça sem
que uma pessoa o tenha escrito, o desenho está errado.

## 16. Os sete verbos — definição formal

A ADR fixa o vocabulário, porque a confusão entre estes verbos é a origem de quase todos os
erros de desenho da 1.0:

| Verbo | Definição formal | Quem pratica | Produz |
|---|---|---|---|
| **DECLARAR** | afirmar um fato sobre o qual se tem autoridade originária | paciente · profissional · Curador (sobre o caso) | uma **declaração** — entrada válida do Método |
| **DERIVAR** | aplicar regra versionada a uma declaração, produzindo sugestão | Pipeline de Derivação | uma **proposta** — sem autoridade (ADR-A §3) |
| **CONFIRMAR** | aceitar ou recusar um valor **já formulado por outro** | quem tem autoridade sobre o campo | uma **declaração** (se aceito) + o registro do ato |
| **LER** | comparar duas declarações fechadas segundo matriz fixa | Motor | um **resultado por célula** — nunca conclusão sobre pessoa |
| **JULGAR** | **formular** conclusão irredutível sobre fatos reunidos, assumindo responsabilidade | Curador | um **julgamento** — este documento |
| **DECIDIR** | escolher entre alternativas legítimas, fechando o que estava aberto | Curador (os três) · paciente (a dela) | uma **decisão**, com autoria |
| **EXPLICAR** | verbalizar, com proveniência, o que foi lido, julgado e decidido | Motor (a partir de tudo acima) | uma **explicação** — nunca acrescenta conteúdo |

**As três distinções que mais importam:**

| Par | Diferença |
|---|---|
| **Confirmar × Julgar** | confirmar **responde** a um valor formulado; julgar **formula**. Um sistema que oferece juízo pré-escrito para o Curador confirmar transformou juízo em carimbo |
| **Julgar × Decidir** | julgar conclui sobre **um** par (este profissional, este conceito); decidir escolhe entre **vários**. Seis juízos não somam uma decisão — a seleção dos três considera os juízos e não decorre deles |
| **Ler × Inferir** | ler compara declarações fechadas (*"ela pediu X; ele declara X"*); inferir preenche o que ninguém declarou. **O Motor lê. Ninguém infere** — nem o Motor, nem o Curador, que quando não sabe registra lacuna |

**`INTERPRETAR` e `CONCLUIR`, citados na missão:** não são verbos do domínio.
"Interpretar" é o componente cognitivo de **julgar** e não tem registro próprio; "concluir"
é o produto de **julgar** ou de **decidir**. Esta ADR **recusa** criá-los como atos
distintos — vocabulário paralelo é a origem de conceito duplicado (ADR-039 item 1).

---

# PARTE III — Fronteiras e limites

## 17. O Curador pode criar conhecimento novo?

**Sim, dentro de uma fronteira estreita, e a fronteira é o que importa.**

| Pode criar | Não pode criar |
|---|---|
| **Conhecimento sobre este encontro** — o sentido de uma conduta declarada **para esta pessoa**, neste caso | **Conhecimento sobre o mundo** — que uma conduta é boa, que uma formação é superior, que um perfil funciona melhor |
| **Conclusão que nenhuma regra produziria** | **Regra** — nenhuma conclusão dele vira regra |
| **Contexto clínico estruturado** (H4) | **Diagnóstico, prescrição, conduta** |
| **A composição dos três** — por que estes, juntos (H12/H13) | **Conceito, opção, escala, célula ou critério** — tudo isso é catálogo, e catálogo muda por migration com ADR |

**Três condições para que o conhecimento criado seja legítimo:**

| # | Condição |
|---|---|
| 1 | **É sobre este Case** — nunca se generaliza. Dois Cases leem a mesma evidência e podem concluir o oposto (I-4), e isso é correto |
| 2 | **É rastreável aos fatos** que estavam visíveis (§7 condição 4) |
| 3 | **Não se propaga sozinho** — o sistema jamais reaproveita um juízo em outro Case, nem como sugestão, nem como "padrão do Curador". Reaproveitar seria criar regra por acúmulo, sem ADR e sem autoridade |

**A consequência que precisa ficar registrada:** a Aliviar **não aprende com os juízos**
nesta versão. Não há modelo, não há memória, não há sugestão baseada em histórico. Se um
dia isso mudar, é decisão constitucional — não evolução de produto.

## 18. O Curador pode contrariar o Método?

Três situações que a pergunta esconde, e cada uma tem resposta diferente:

### 18.1 Contrariar a **leitura** do Motor — **sim, e é esperado**

O Motor lê; não decide. Selecionar um profissional cuja leitura tem lacunas ou médias, ou
não selecionar um cuja leitura é toda alta, é **exercício normal da autoridade** da
ADR-035. Nada disso é contrariar o Método — é o Método funcionando.

| Como | Quem registra |
|---|---|
| Pela seleção (H12) e pela composição declarada | o próprio ato, com justificativa e autoria |

### 18.2 Contrariar uma **regra de derivação** — **sim, item a item**

É a recusa da ADR-A §7, e é o dado mais valioso do sistema. Discordância alta corrige **a
regra**, nunca o Curador (§10.5 da Arquitetura).

| Como | Quem registra |
|---|---|
| Recusando a proposta, na Fronteira Humana | o desfecho `RECUSADA`, e o painel de discordância |

### 18.3 Contrariar o **Método** propriamente — **não**

Não pode: eliminar sem filtro declarado · selecionar menos ou mais de três · emitir sem os
gates · pontuar, ordenar ou ranquear · usar adjetivo de qualidade sobre pessoa · declarar
pela paciente · reconhecer Perfil por ela · ignorar divergência crítica aberta · alterar
catálogo, escala ou célula.

**O canal legítimo quando ele acredita que o Método está errado:**

```
1. Registra o juízo que consegue sustentar, com a ressalva (é dele, e vale)
2. Registra a divergência com o Método — em canal próprio, nomeado
3. Escala à Autoridade de Método (regra) ou ao Guardião (invariante)
4. A decisão vem por ADR, ou não vem
5. Enquanto não vier, o gate permanece de pé
```

**Nunca:** contornar o gate, desligar guarda, "resolver na prática" ou registrar juízo
falso para destravar etapa. Registrar conclusão em que não se acredita, para avançar, é o
único ato desta ADR que seria falsificação — e não há circunstância que o autorize.

## 19. O Curador pode contrariar a Proposta?

**Sim, e recusar deve custar exatamente o mesmo que confirmar** (P-10; ADR-A §7).

| Aspecto | Regra |
|---|---|
| **Como** | recusa explícita na Fronteira Humana, com os nove elementos à vista |
| **Motivo** | **oferecido, nunca exigido** — exigir encareceria a discordância. A ausência de motivo é ela própria um dado |
| **Efeito** | nada no Mapa; o conceito volta a **lacuna** — nunca ao valor proposto, nunca a um valor anterior |
| **Obrigação seguinte** | **nenhuma.** Recusar e ainda não saber o valor certo é estado legítimo |
| **Consequência sistêmica** | entra no painel de discordância, por conceito e por versão de regra. **Discordância zero sustentada é alarme**, não sucesso |

## 20. O que obrigatoriamente precisa existir antes de qualquer Juízo Humano

Sete pré-condições. **Sem elas, a superfície não oferece o juízo** — e não oferecer é o
comportamento correto, não uma falha.

| # | Pré-condição | Por quê |
|---|---|---|
| 1 | **O Perfil reconhecido pela paciente** | é o único gate verdadeiro da Mesa; julgar antes é julgar contra um Perfil que ela pode não reconhecer |
| 2 | **O profissional participando** — filtro declarado, área declarada (H6) | não se julga quem não participa; e a área é filtro, logo precede |
| 3 | **As declarações dos dois lados visíveis**, com versão | §7 condição 4 |
| 4 | **As evidências disponíveis**, com fonte, data e estado de verificação | §7 condição 7 |
| 5 | **As lacunas explicitamente listadas** | julgar sobre informação incompleta é legítimo; julgar **sem saber** que está incompleta, não |
| 6 | **A explicação reproduzível já existindo** (AC-EXPLICA, Arquitetura §17.4) | *nenhuma derivação ou leitura entra em superfície sem explicação* — e o Curador julga olhando essa superfície |
| 7 | **Autoria e data capturáveis** | juízo sem autor não existe (§7 condição 1) |

## 21. Atos do Curador que passam a ser auditáveis

Auditável = **reconstruível por terceiro, sem recorrer à memória de ninguém**.

| # | Ato | O que se torna visível |
|---|---|---|
| 1 | **A tradução grau → importância** | deixa de ser mental: proposta, regra, versão, confirmação ou recusa (ADR-A) |
| 2 | **O juízo técnico** (H8–H10) | conclusão, fatos visíveis, evidências referenciadas, autor, data, versão |
| 3 | **O juízo relacional** (H11) | idem, com as duas declarações lado a lado |
| 4 | **A declaração de área** (H6) | estado, motivo, autoria — já era registrada; passa a integrar a cadeia de explicação |
| 5 | **A declaração de filtro** (H5) | motivo, autoria, data, estado — item a item |
| 6 | **A recusa de uma proposta** | e a **ausência de motivo**, quando houver |
| 7 | **A revisão de um juízo** | a cadeia de versões, com o que mudou entre elas |
| 8 | **A seleção dos três** (H12) | composição declarada e justificativa |
| 9 | **A autoria do Relatório** (H13) | quem aprovou, quem emitiu, quando — e o nome chega à paciente |
| 10 | **O que estava visível** em cada um dos atos acima | o contexto do ato, não só o ato |

## 22. Atos do Curador que deixam de existir

| # | Deixa de existir | Substituído por |
|---|---|---|
| 1 | **Transcrever ~17 importâncias** já declaradas pela pessoa | confirmar ou recusar proposta, item a item |
| 2 | **Declarar `ACESSO`, `CONTINUIDADE_DO_CUIDADO` e `MODELO_DE_ATENDIMENTO`** por profissional | leitura do Motor (§5) |
| 3 | **Digitar texto livre de evidência** em cada critério | referência à Base, com versão |
| 4 | **Redigitar as cinco dimensões** que a paciente lê | derivação da leitura |
| 5 | **Marcar checkboxes de "contexto revisado" / "documentos revisados"** | fato observado |
| 6 | **Mover o funil do CRM** depois de cada ato | projeção derivada |
| 7 | **Descobrir o que falta só ao tentar emitir** | painel de prontidão |

## 23. Atos que nunca poderão voltar

**Removidos em definitivo.** Retornar exige ADR que revogue esta e demonstre que a remoção
causou dano — e, em três casos, exige decisão constitucional do Fundador.

| # | Nunca volta | Fundamento |
|---|---|---|
| 1 | **O Curador reconhecer o Perfil pela paciente** | ADR-042 já removeu; **constitucional** |
| 2 | **O Curador decidir qual profissional a paciente escolhe** | ADR-035; **constitucional** |
| 3 | **Qualquer pontuação, score, ranking ou posição** | §4.8 do Congelamento; **constitucional** |
| 4 | **Adjetivo de qualidade sobre pessoa** ("bom", "acolhedor", "excelente") | ADR-040 item 2 |
| 5 | **Declaração no Mapa sem proveniência** | P-07/P-08, se aprovados na ADR-A |
| 6 | **Evidência em texto livre substituindo a Base** | I-6 e R10 |
| 7 | **Juízo sobre conceito que o Motor lê por correspondência** | §5 — voltar seria reintroduzir a duplicação R2 |
| 8 | **Ausência de autoria em qualquer conclusão** | ADR-035 |
| 9 | **Sobrescrever texto humano sem aviso** | correção do P12 |
| 10 | **Conclusão automática sobre qualidade** | I-9 |

---

# PARTE IV — Participação do Juízo nas demais camadas

## 24. Como o Juízo Humano participa da Explicabilidade

O julgamento é **uma das seis fontes** da Ficha de Explicação, e a única com autor humano.

| Pergunta da Ficha (Arquitetura §11.2) | O que o juízo fornece |
|---|---|
| 1 · Por que foi escolhida? | a conclusão assinada, ao lado das correspondências lidas |
| 3 · Quais critérios influenciaram? | os seis conceitos de juízo, com a conclusão de cada |
| 5 · Quais lacunas existem? | **ausência de juízo é lacuna nomeada** — `AGUARDA_JUIZO_DO_CURADOR` |
| 6 · Grau de confiança | juízo pendente **rebaixa** para `LEITURA_COM_LACUNAS`, e a lacuna é listada |

**Cinco regras fechadas:**

| # | Regra |
|---|---|
| 1 | **Ausência de juízo nunca é omitida em silêncio.** A Ficha declara o estado — "esta leitura aguarda a conversa com o Curador" |
| 2 | **O sistema nunca redige o juízo** — nem rascunho, nem sugestão, nem "complete a frase" |
| 3 | **O texto do Curador aparece na íntegra ou não aparece.** Nunca resumido, nunca parafraseado |
| 4 | **A conclusão vem com autor e data**, sempre — inclusive na Mesa |
| 5 | **Juízo superado nunca aparece como vigente**; se citado, é como histórico, marcado |

## 25. Como o Juízo Humano participa do Relatório

| Seção | Participação do juízo |
|---|---|
| **Justificativa por opção** | o juízo técnico entra como frase assinada, junto às correspondências |
| **Leitura relacional** | **frases dos 3 conceitos `humano` só existem depois do julgamento** (ADR-065, Parte 6). Sem juízo, a carta declara o estado |
| **Pontos de atenção** | juízo pendente e lacuna de governança entram como ponto de atenção |
| **Abertura** ("por que estas três, juntas") | é **composição** (H13), não juízo — mas se apoia neles |
| **Observações do Curador** | nasce vazia por princípio; não é juízo |
| **Assinatura** | quem aprovou e emitiu — e chega à paciente |

**Três guardas herdadas e reafirmadas:**

| # | Guarda |
|---|---|
| 1 | **Emissão é recusada** com a frase-sentinela de juízo relacional pendente (ADR-064) — e o painel de prontidão mostra isso **antes** de o Curador tentar |
| 2 | **O texto do Curador nunca é reescrito pelo sistema**, nem na regeneração do rascunho (correção do P12) |
| 3 | **Nenhuma frase conclui adequação** a partir de juízo — a frase diz o fato e a leitura; adequação é dos pontos de atenção, escritos por ele |

---

# PARTE V — Fronteiras entre documentos

## 26. O que pertence à ADR-D

**Não decidido aqui, e deliberadamente:**

| # | Pertence à ADR-D |
|---|---|
| 1 | **Quem confirma o Mapa do Profissional** — hoje restrito a `administrador` (G4/RI4) |
| 2 | **O que acontece com a RLS congelada** (ADR-040 item 6, §4.7 do Congelamento) |
| 3 | **Se "verificar evidência" e "confirmar estado derivado" podem ser exercidos pelo mesmo papel** |
| 4 | **Segregação de funções** entre quem propõe regra, quem confirma proposta e quem audita (ADR-060) |
| 5 | **Quem pode julgar quando há mais de um Curador no Case** — esta ADR fixa que o juízo é **indelegável e da versão** (§9); **quem** pode assumir é ADR-D |

**Por que não aqui:** esta ADR define **o que é** juízo e **quem tem autoridade sobre a
matéria**; a ADR-D define **quais papéis do sistema encarnam essa autoridade** e sob que
controle de acesso. Misturar as duas produziria uma ADR que decide RLS — matéria congelada
— sob o disfarce de domínio.

## 27. O que pertence ao F-02

| # | Pertence ao F-02 (implementação) |
|---|---|
| 1 | Nomes de tabelas, colunas, tipos e enums |
| 2 | Como a cadeia de versões é representada |
| 3 | Como a unicidade do `VIGENTE` (§13) é garantida |
| 4 | Como as referências a evidência e a declaração são armazenadas |
| 5 | Como a supersessão é detectada — gatilho, verificação em leitura ou rotina |
| 6 | Índices, particionamento, arquivamento físico |
| 7 | Policies de RLS — **conforme a ADR-D**, nunca inventadas |
| 8 | Ergonomia do painel de juízo — **exceto** o que o §20 e o §24 fixam |
| 9 | Como texto não submetido é tratado na interface (§13b) — **não é julgamento** |
| 10 | Testes, guardas e ferramentas de verificação |

**Regra de arbitragem** (idêntica à da ADR-A §20): *"mudar isto muda o que o Método afirma,
ou apenas como o afirma?"* — se muda o que afirma, é domínio, e volta ao Arquiteto.

## 28. O que permanece decisão exclusiva do Fundador

| # | Exclusivo do Fundador |
|---|---|
| 1 | **Aprovar ou recusar a reabertura de I-10** (ADR-A §18.5) — e, com ela, a ponte |
| 2 | **Nomear a Autoridade de Método sobre Regras de Derivação** (DP-4) |
| 3 | **Decidir a régua de graduação por consequência** (DP-5) — e, com ela, se o regime de bloco chega a existir |
| 4 | **Aprovar a divisão da etapa AVALIAÇÃO** — o §5 desta ADR |
| 5 | **Alterar qualquer das treze decisões humanas** ou das oito garantias do Congelamento |
| 6 | **Reabrir os três atos constitucionais** do §23 (itens 1, 2 e 3) |
| 7 | **Autorizar a Aliviar a aprender com juízos** (§17) — hoje proibido |
| 8 | **Destino formal do ACE** (DP-2) e listas provisórias P3–P7 (DP-3) |
| 9 | **Janela de publicação** e ordem de execução das ondas |

---

# PARTE VI — Verificações

## 29. Esta ADR responde aos impedimentos restantes do F-02?

**Responde a um. Os outros três permanecem, e não são de domínio.**

| Impedimento | Antes da ADR-B | Depois | Justificativa |
|---|---|---|---|
| **I-1** · ADRs inexistentes | parcial (só ADR-A) | **RESOLVIDO** | ADR-A entregou `derivation_proposals`; esta entrega `curator_judgments` — naturezas (§4.4), conceitos, estados (§13), proveniência (§8), versionamento (§9), supersessão (§12). **A metade que faltava está fechada** |
| **I-2** · §15.0 proíbe começar por aqui | aberto | **ABERTO** | É sequenciamento. Esta ADR satisfaz mais uma das dez dependências (critérios de supersessão, agora completos para as duas entidades). As demais são trabalho da Onda 1, que não começou |
| **I-3** · Entrada da Onda 2 não satisfeita | aberto | **ABERTO, com 2 dos 4 itens removidos** | ADRs: **A e B existem; D não**. Onda 1: não iniciada. Autoridade: **vaga** (DP-4). DP-1: **aberta** |
| **I-4** · Colisão com a guarda C-01 | aberto | **ABERTO — e deve continuar** | C-01 exige a ADR-A **e as dez dependências**. A segunda metade permanece. **Esta ADR não pede, não autoriza e não antecipa a suspensão de C-01** |

**Conclusão sobre o F-02:** **permanece bloqueado.** O bloqueio de **domínio** foi
integralmente removido pelas ADRs A e B. O que resta é **sequenciamento** (I-2, I-3) e
**governança de acesso** (ADR-D), mais os impedimentos menores M-1 a M-4 do relatório
original.

## 30. Impacto no Modelo — a dívida documental RS-11

Esta ADR **prescreve** a reescrita abaixo. A execução é ato da aprovação, não desta missão.

| Trecho de `MODELO_CURADORIA_V1.md` | Situação atual | O que a aprovação desta ADR deve fazer |
|---|---|---|
| **§7.1** Cruzamento Técnico | descreve saída *"Avaliação Técnica (0–100)"* — removida pela ADR-042 | substituir a saída por **juízo declarado do Curador em três conceitos**, sem escala numérica; manter o argumento de que nenhum diploma sabe o que o caso exige |
| **§7.2** Cruzamento Assistencial | descreve *"Compatibilidade Assistencial (0–100)"* | substituir por **leitura por conceito**, com os quatro resultados do Motor; manter *"comparação entre duas declarações, não inferência"* |
| **§7.3** Escala de avaliação — quatro estados | descreve quatro estados com **percentuais de peso** (100% / 50% / 0% / sai do cálculo) | reescrever **sem percentual**: os quatro estados de avaliação passam a valer **apenas** para o juízo humano (H8–H11) e para a área; a leitura do Motor usa os **quatro resultados** da ADR-041. **Declarar que são dois vocabulários distintos e por que** |
| **§7.4** Cobertura | descreve normalização *"sobre 90 dos 100 pontos possíveis"* | reescrever como **inventário de lacunas**, com as cinco naturezas (§8 desta ADR e §11.2 da Arquitetura); **nenhum percentual, nenhum total** |
| **§11** Estado da implementação | registra a supersessão da ADR-042 apenas em linha de tabela | acrescentar as linhas de **ADR-A** e **ADR-B**; marcar a divisão da AVALIAÇÃO como decidida; **fechar** as linhas que o §7 reescrito torna obsoletas |
| **Demais trechos afetados** | qualquer menção a orçamento, pontos, total ou percentual | remover ou reescrever, mantendo registro histórico onde o §11 já o faz |

**Regra:** nenhuma ADR da 2.0 pode deixar o corpo normativo do Modelo contradizendo a
decisão registrada. **Decisão em ADR com corpo desatualizado é como invariante sem guarda —
promessa, não garantia.**

## 31. Critérios de aceite desta ADR

| # | Critério | Situação | Evidência |
|---|---|---|---|
| 1 | **Nenhum Juízo Humano permanece implícito** | **Atendido** | §4 lista os 16 atos exaustivamente; §4.4 fecha as duas naturezas e os seis conceitos |
| 2 | **Nenhuma responsabilidade do Curador permanece ambígua** | **Atendido** | §3 (quatro funções) · §16 (sete verbos) · §18 (três situações de "contrariar") |
| 3 | **O Implementador constrói `curator_judgments` sem criar domínio** | **Atendido** | §8 (proveniência) · §9 (versões) · §12 (supersessão) · §13 (estados + unicidade) · §27 (o que é dele) |
| 4 | **O Guardião verifica constitucionalmente o papel do Curador** | **Atendido** | cada ato cita fundamento; §23 separa o que é constitucional; §28 devolve ao Fundador o que é dele |
| 5 | **O Verificador reproduz todos os julgamentos possíveis** | **Atendido** | o espaço é finito e enumerável: 2 naturezas × 6 conceitos × N profissionais, com 3 estados e cadeia de versões |
| 6 | **O Certificador certifica sem recorrer a conversas** | **Atendido** | documento autocontido, com referências por arquivo e seção |

---

# PARTE VII — Relatório final

## Resumo executivo

Esta ADR define o Juízo Humano como **ato indivisível, irredutível e assinado**, e fecha o
escopo de `curator_judgments` em **duas naturezas e seis conceitos** — a decisão que o F-02
esperava. A distinção que organiza o documento é **confirmar × julgar**: confirmar responde
a um valor formulado, julgar formula. E a fronteira que mais protege o Método é a exclusão
de **área**, **verificação** e **divergência** do registro de juízo — a primeira porque é
filtro, as outras duas porque são governança da informação, e I-5 separa governança de
compatibilidade.

Com as ADRs A e B, **o bloqueio de domínio do F-02 está integralmente removido**. O
bloqueio de sequenciamento e de governança de acesso permanece.

## Definições fixadas

Juízo Humano (§1) · julgamento válido (§7) · os três estados (§13) · autoridade decisória
originária condicionada (§14) · os sete verbos (§16) · a divisão da etapa AVALIAÇÃO (§5) ·
as quatro funções do Curador (§3).

## Decisões tomadas

| # | Decisão |
|---|---|
| 1 | Juízo é **irredutível**: existe onde duas pessoas competentes podem divergir legitimamente |
| 2 | **`curator_judgments` = 2 naturezas × 6 conceitos.** Lista fechada |
| 3 | **Área excluída** — é filtro, com estrutura e quatro estados próprios |
| 4 | **Verificação e divergência excluídas** — são governança (I-5) |
| 5 | **Seleção e autoria excluídas** — são decisão e autoria, não juízo |
| 6 | Os **3 critérios do lado da pessoa** deixam de ser humanos; passam ao Motor |
| 7 | **Nunca existe proposta de julgamento** — o Método não pré-escreve o juízo |
| 8 | Julgamento **tem versões**, append-only; retificar é gravar versão nova |
| 9 | **Três estados**: `VIGENTE` · `SUPERADO` · `RETIRADO`. `PENDENTE` recusado |
| 10 | **No máximo um `VIGENTE`** por (Case, profissional, conceito) |
| 11 | **Evidência nova supersede o juízo** (JS3), ainda que a conclusão provavelmente não mudasse |
| 12 | **A Aliviar não aprende com juízos** nesta versão; mudar isso é constitucional |
| 13 | O Curador **pode** contrariar leitura e proposta; **não pode** contrariar o Método — e o canal legítimo está escrito |
| 14 | **Motivo de recusa e de revisão são oferecidos, nunca exigidos** (P-10) |

## Decisões adiadas

| # | Adiada | Para quem |
|---|---|---|
| 1 | Quem confirma o Mapa do Profissional e a RLS | **ADR-D** |
| 2 | Quem assume o Case quando há troca de Curador | **ADR-D** |
| 3 | Régua de graduação por consequência | **DP-5 / Fundador** |
| 4 | Valores da ponte grau → importância | **DP-6**, após Cases reais |
| 5 | Se o Método pode aprender com juízos | **Fundador**, decisão constitucional |

## Impacto na Arquitetura

| Seção | Impacto |
|---|---|
| §9.4 (`curator_judgments`) | **confirmado e completado** — a exclusão de `AREA` (RS-03) fica fundamentada, e acrescentam-se estados, versões e unicidade |
| §3.3 (o que o Curador continua fazendo) | **confirmado**; ganha a formulação canônica do §3 desta ADR |
| §5.1 item 15 e 16 (divisão da AVALIAÇÃO) | **confirmado e decidido** |
| §11 (explicabilidade) | **confirmado**; ausência de juízo é lacuna nomeada |
| Nenhuma emenda estrutural necessária | diferentemente da ADR-A, que exige a emenda do §9.4 de quatro para cinco estados |

## Impacto no Modelo

Reescrita prescrita de **§7.1, §7.2, §7.3, §7.4 e §11** — texto pronto no §30. É a quitação
da dívida RS-11 e do achado P17 da auditoria.

## Impacto na Explicabilidade

O juízo entra em quatro das seis respostas da Ficha; **ausência de juízo passa a ser lacuna
nomeada**, nunca omissão; o sistema nunca redige juízo; o texto do Curador aparece **na
íntegra ou não aparece**.

## Impacto no Relatório

Frases dos três conceitos `humano` **só existem depois do julgamento**; a guarda de emissão
da ADR-064 é confirmada e antecipada pelo painel de prontidão; o texto humano nunca é
reescrito pelo sistema.

## Impacto sobre o F-02

**I-1 resolvido.** I-2, I-3 e I-4 permanecem — nenhum é de domínio, e nenhuma ADR pode
resolvê-los.

## Pacotes desbloqueados

**Nenhum pacote de implementação.** Desbloqueia-se **trabalho de decisão**: a redação da
**ADR-D** (que agora tem toda a fronteira desenhada, §26), a reescrita do Modelo (§30) e a
revisão constitucional do papel do Curador.

## Pacotes ainda bloqueados

F-02 (I-2, I-3, I-4 · ADR-D · DP-1 · DP-4 · janela · árvore suja) · Onda 2 inteira (Onda 1
não iniciada) · subescopo 2.5 (DP-5) · Onda 5 (Rede real).

## ADRs dependentes

| ADR | Relação |
|---|---|
| **ADR-D** | depende desta para saber **o que** é juízo; decide **quem** o exerce e sob que RLS |
| **ADR-A** | complementar — juntas fecham o domínio das duas entidades |
| **ADR-E** (ACE) | independente |
| Futura ADR de ordenação | permanece retirada do caminho |

## Riscos

| # | Risco | Sev. |
|---|---|---|
| **RB-1** | **O sistema passar a sugerir o juízo** — "com base em casos semelhantes…". É a violação mais provável do §15 e a mais atraente comercialmente | **Alta** |
| **RB-2** | **O juízo virar campo obrigatório de formulário**, produzindo texto de preenchimento em vez de conclusão | **Alta** |
| **RB-3** | **JS3 (evidência nova supersede) gerar retrabalho percebido como burocracia**, levando a pedido de flexibilização | Média |
| **RB-4** | **Área migrar para `curator_judgments`** por conveniência de implementação, apagando a fronteira do §4.4 | Média |
| **RB-5** | **A reescrita do Modelo (§30) não acontecer** na aprovação, repetindo o P17 | **Alta, de processo** |
| **RB-6** | **Esta ADR ser lida como autorização para implementar** | **Alta, de processo** — daí §29 e §32 |

## Pendências

DP-1 · DP-4 · DP-5 · DP-6 · DP-7 · DP-10 · DP-11 · **ADR-D** · reescrita do Modelo §7.1–§7.4
e §11 · emenda da Arquitetura §9.4 (da ADR-A) · lavratura de A e B em `DECISIONS.md`
**após** aprovação.

## 32. Conformidade

Nenhuma tabela, migration, constraint, índice, policy, API, interface, dashboard, tipo,
teste ou linha de código foi criada ou alterada. Nenhum documento canônico foi modificado —
**inclusive o `MODELO_CURADORIA_V1.md`, cuja reescrita esta ADR apenas prescreve**. Nenhuma
guarda foi tocada. Nenhum commit foi feito.

**Esta ADR não autoriza implementação.**

---

*Fim da ADR-B. **Próximo destino obrigatório: Agente 00 — Guardião, para revisão
constitucional**, com atenção a três pontos: a exclusão de área, verificação e divergência
do registro de juízo (§4.4); a decisão JS3, que supersede juízo por evidência nova (§12); e
a prescrição de reescrita do Modelo (§30), que precisa ser executada no ato da aprovação
para não repetir o P17. Nenhuma implementação, nenhum código, nenhuma migration antes dessa
revisão.*
