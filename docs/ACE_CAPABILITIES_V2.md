# ACE_CAPABILITIES_V2 — a arquitetura de capacidades da V2

**Estado**: arquitetura definitiva proposta. Nenhuma linha de código, banco ou ADR foi alterada para produzir este documento.
**Origem**: Decisão de Fundador registrada em 26/07/2026, sobre o Inventário do ACE.
**Escopo**: define *onde cada capacidade pertence*. Não define *como movê-la* — isso é missão posterior.

---

## 1. A premissa

> A Curadoria da Aliviar possui uma única autoridade decisória. Essa autoridade é o Curador.
> O ACE deixa de ser um motor de Curadoria e passa a ser um conjunto de capacidades reutilizáveis
> colocadas a serviço do Curador.

Isto não é uma opinião de engenharia. É decisão de produto, e nenhuma classificação abaixo pode contrariá-la.

Duas consequências que orientam todo o documento:

1. **Uma capacidade nunca é julgada pelo módulo em que nasceu.** É julgada pelo que faz e por quem serve.
2. **"Descontinuar como protocolo" não é sinônimo de apagar.** Na maioria dos casos, a capacidade continua existindo — em outro lugar, com outro dono, sem autoridade.

---

## 2. Como ler as categorias

| | Categoria | Significado preciso |
|---|---|---|
| **A** | Permanece como está | Já está no lugar certo, com o dono certo. Nada muda. |
| **B** | Incorporar à Mesa | Instrumento de quem escolhe. Vive onde a escolha acontece. |
| **C** | Incorporar ao Briefing | Contexto para o Curador chegar preparado à conversa. |
| **D** | Serviço compartilhado | Não pertence à Curadoria nem ao ACE: pertence à plataforma. |
| **E** | Absorver e descontinuar como protocolo | A função sobrevive dentro de outra coisa; o protocolo independente, não. |

**A categoria E é a mais lida errado.** Ela quase nunca significa perda de comportamento. Significa que
o comportamento deixa de ter nome próprio e passa a ser parte de algo maior — normalmente da Mesa,
do Briefing, ou de um serviço compartilhado. Quando E de fato significa desaparecimento, o documento diz
isso explicitamente.

---

## 3. Mapa completo

O inventário anterior contava 24 capacidades. Este documento conta **28** — porque extrair disciplina
escondida dentro de protocolos é justamente o objetivo desta missão. Três capacidades novas apareceram
ao abrir o P010 e o retorno-a-protocolo.

| # | Capacidade | Exerce autoridade? | Quem usa hoje | Quem usará depois | Cat. |
|---|---|---|---|---|---|
| 1 | Narrative (P001) — a história como artefato versionado | Não | Orquestrador | Ninguém (o COS já guarda a narrativa) | **E** |
| 2 | P002 — Estruturação do caso | Não | Administrador | Briefing | **C** |
| 3 | P002 — Correções humanas de campo | Não | Administrador | Briefing | **C** |
| 4 | P003 — Verificação do caso | Não | Administrador | Briefing | **C** |
| 5 | P004 — Modelagem do contexto (classificação) | Não¹ | Administrador | Briefing | **C** |
| 6 | P004 — Transporte de Restrições Obrigatórias | Não | Administrador | Serviço compartilhado | **D** |
| 7 | P005 — Perfil de competências | Não | Administrador | Ninguém (passo intermediário) | **E** |
| 8 | P006 — Conjunto elegível | Não | Administrador | Mesa | **B** |
| 9 | P007 — Matriz de compatibilidade | Não | Administrador | Mesa | **B** |
| 10 | P008 — Shortlist (reduzir a três) | **Sim** | Administrador | Curador, na Mesa | **E** |
| 11 | P008 — Recusa de desempate arbitrário | Não | P008 | Já existe na Mesa (alerta C-01) | **E** |
| 12 | P009 — Autoridade de revisão | **Sim** | Administrador | Curador, na Mesa | **E** |
| 13 | P009 — Validação estrutural da decisão | Não | P009 | Já existe na Mesa (`validateMesaClosure`) | **E** |
| 14 | P010 — Montagem da entrega | Não | Administrador | Relatório do Curador | **E** |
| 15 | P010 — Verificador de vocabulário proibido | Não | P010 | Serviço compartilhado | **D** |
| 16 | P010 — Validador de cadeia de proveniência | Não | P010 | Serviço compartilhado | **D** |
| 17 | Orquestrador do pipeline | Não² | Administrador | O Curador (humano) | **E** |
| 18 | Retorno a protocolo — ponto de retomada | Não | P009 | Ninguém | **E** |
| 19 | Retorno a protocolo — invalidação em cascata | Não | P009 | Serviço compartilhado | **D** |
| 20 | Contrato de artefato (proveniência obrigatória) | Não | Todos os protocolos | Plataforma | **D** |
| 21 | Version Manager (versão imutável, nunca sobrescreve) | Não | Todos os protocolos | Plataforma | **D** |
| 22 | Deep freeze (imutabilidade profunda) | Não | Todos os artefatos | Plataforma | **D** |
| 23 | Estado de Informação (10 estados semânticos) | Não | P002 / P003 | Plataforma | **D** |
| 24 | Contratos de erro e validação | Não | Protocolos | Plataforma | **D** |
| 25 | Política de campos por estágio | Não | Todos os artefatos | Ninguém (sem pipeline, sem objeto) | **E** |
| 26 | Portas e adaptadores de provider | Não | P006 / P007 | Plataforma | **D** |
| 27 | LLM Gateway (validação + proteção de ambiente) | Não | P002/P003/P004/P010 | Plataforma | **D** |
| 28 | Rótulos humanos de artefato | Não | Telas do ACE | Plataforma | **D** |
| 29 | Observabilidade de execução | Não | Administrador | Administrador | **A** |
| 30 | Golden Set | Não | Equipe | Equipe | **A** |

¹ Ver §5.3 — classifica urgência e complexidade, o que se aproxima de julgamento. A classificação C vem com condição.
² Não decide *quem*, mas decide *quando cada etapa acontece* — o que sob a nova arquitetura é do Curador. Ver §7.1.

**Distribuição**: A = 2 · B = 2 · C = 4 · D = 13 · E = 9.

O número que mais importa é o **13 em D**. A maior parte do valor do ACE nunca foi a Curadoria que ele
produzia — foi a disciplina com que ele a produzia.

---

## 4. Capacidades decisionais

São três, e são o alvo exato da decisão de Fundador. Para cada uma: o que desaparece, o que continua
existindo, o que é absorvido, o que vira serviço compartilhado.

### 4.1 P008 — Shortlist Builder

**Objetivo**: reduzir o conjunto elegível a exatamente três candidatos, qualitativamente.
**Exerce autoridade**: **SIM.** Reduzir a três *é* a escolha.

| Parte | Destino |
|---|---|
| **Desaparece** | O ato de reduzir a três por conta própria. Isto é a autoridade paralela, e ela deixa de existir. |
| **Continua existindo** | A recusa de desempatar sem critério. O P008 retorna `BLOCKED / AMBIGUOUS_COMPOSITION` quando há mais de três igualmente fundamentados — nunca escolhe os três primeiros. |
| **Absorvido por** | A Mesa. E já está: o alerta **C-01** do Motor de Condução diz *"N opções equivalentes — o Motor não desempata, a composição é sua"*. O COS reimplementou a melhor parte do P008 sem saber. |
| **Vira serviço compartilhado** | Nada. |

> **Como a autoridade é absorvida pelo Curador**: ela já era dele no Método (P14 — o algoritmo nunca
> seleciona os três). A Mesa lhe dá a rede inteira comparada e ele escolhe. O P008 não transfere
> autoridade: ele para de exercer uma que nunca deveria ter tido.

### 4.2 P009 — Human Review

**Objetivo**: validar estruturalmente uma decisão humana sobre a Shortlist. Único artefato `decisional: true` do ACE (ADR-016).
**Exerce autoridade**: **SIM.** É a segunda autoridade decisória nomeada da plataforma.

| Parte | Destino |
|---|---|
| **Desaparece** | O papel de "revisor que aprova, ajusta ou rejeita uma proposta da máquina". Sem P008, não há proposta a revisar. |
| **Continua existindo** | A validação estrutural: exatamente três, sem repetição, cada um fundamentado, autoria humana registrada. |
| **Absorvido por** | A Mesa. E já está: `validateMesaClosure` verifica exatamente isso, em linguagem de pessoa, ao lado do botão — nunca como erro de sistema. |
| **Vira serviço compartilhado** | Nada. |

> **Como a autoridade é absorvida pelo Curador**: a autoridade não muda de mãos — ela deixa de estar
> em dois lugares. Hoje o Curador decide na Mesa *e* um revisor decide no P009. Depois, só a Mesa.

**Observação de fato**: a tela do P009 do Curador está inacessível em produção (o redirect
`/curador/*` → `/coa/curadoria/*` a mata). Na prática, a segunda autoridade só era exercível pelo
Administrador. A decisão de Fundador formaliza algo que a infraestrutura já impedia por acidente.

### 4.3 P010 — Final Curadoria Delivery

**Objetivo**: materializar a decisão do P009 num documento para o paciente.
**Exerce autoridade**: **NÃO** — e nunca exerceu (ADR-016: o P010 comunica, nunca decide).

Este é o caso mais rico do inventário: o protocolo desaparece, mas **três capacidades internas
sobrevivem**, duas delas com valor muito acima do protocolo que as continha.

| Parte | Destino |
|---|---|
| **Desaparece** | A montagem da entrega a partir da cadeia de artefatos do ACE. |
| **Absorvido por** | O Relatório do Curador, que já monta e entrega o documento (`curadoria_reports` → entrega ao paciente). |
| **Vira serviço compartilhado (1)** | **Verificador de vocabulário proibido, com consciência de negação.** Ver §4.4. |
| **Vira serviço compartilhado (2)** | **Validador de cadeia de proveniência** — verifica que cada artefato referencia corretamente aquele de que deriva. |

### 4.4 O verificador de vocabulário — a capacidade mais subestimada do ACE

Merece seção própria porque é sofisticada e porque **o Relatório do Curador hoje não tem nada
equivalente**.

O P010 verifica mecanicamente que o texto entregue ao paciente não contém "primeiro lugar",
"segunda opção", "melhor profissional", "mais recomendado", "vencedor", "score", "percentual", "nota:".

O que o torna raro é o que ele **não** faz: banir a substring. As calibrações CAL-001 e CAL-004
resolveram um problema real — a própria especificação exige explicar *que não há ranking entre os três*,
e negar a existência de ranking exige nomeá-lo. A verificação pergunta *"existe algum gatilho de negação
dentro da mesma cláusula?"* em vez de *"qual verbo específico nega?"*.

> Isto é a Ontologia §8 e o UX_PRINCIPLES P9 transformados em código determinístico e auditável.
> Hoje protege apenas o texto do P010. Deveria proteger todo texto que chega ao paciente — o Relatório,
> a Devolutiva, a apresentação de cada opção.

**Nota de fronteira**: o UX_PRINCIPLES P9 diz que vocabulário proibido "não entra nem para ser negado"
nas telas do paciente. O P010 permite o uso negado porque a sua especificação o exige. São regras
diferentes para superfícies diferentes — o serviço compartilhado precisa expor as duas severidades,
não escolher uma.

---

## 5. Capacidades cognitivas

Nenhuma exerce autoridade. Todas fazem exatamente o que a decisão autoriza: organizar, resumir,
estruturar, explicar, sugerir. A pergunta para cada uma é apenas *em que momento da jornada ela serve*.

### 5.1 P002 — Estruturação do caso · e as correções humanas

**Como melhora o trabalho do Curador**: transforma a história em texto livre numa leitura organizada
— o que a pessoa contou, separado em fatos, limites e contexto — antes da conversa.

**Momento da jornada**: **Briefing**. É exatamente o papel que o Briefing já ocupa: o Curador chega
sabendo o que já se sabe, e a pessoa nunca recomeça do zero.

**Por que as correções humanas importam tanto**: quando a equipe corrige um campo que o modelo
estruturou errado, a correção é persistida e **reaplicada em toda reexecução**. A máquina nunca
sobrescreve o humano. Este é o Ciclo do Motor implementado, e é o padrão que qualquer sugestão
futura da plataforma deve seguir.

**Categoria**: **C**.

### 5.2 P003 — Verificação do caso

**Como melhora o trabalho do Curador**: aponta o que falta, o que está ambíguo e o que bloqueia —
sem preencher nada.

**Momento da jornada**: **Briefing**. É a mesma gramática das lacunas que o Briefing já produz
("nenhuma evidência cobre o critério X"), e o comportamento de copiloto que a Guided Experience define:
sinaliza a lacuna, nunca bloqueia o caminho.

**Categoria**: **C**.

### 5.3 P004 — Modelagem do contexto

**Como melhora o trabalho do Curador**: classifica tipo de decisão, domínio, complexidade e urgência,
e transporta as Restrições Obrigatórias sem interpretá-las (ADR-015).

**A capacidade se divide em duas, com destinos diferentes**:

- **Transporte de Restrições Obrigatórias** — mecânico, sem julgamento, obrigatoriamente fiel.
  **Categoria D**: é a garantia de que uma restrição declarada pela pessoa atravessa a cadeia inteira
  sem ser reinterpretada. Vale para qualquer camada que carregue restrição, não só para o ACE.

- **Classificação semântica** — aqui mora a única ressalva do documento. Classificar urgência e
  complexidade não escolhe ninguém, mas *caracteriza* o caso de um jeito que influencia tudo a jusante.
  **Categoria C, com condição**: só pertence ao Briefing se for apresentada como *sugestão com fonte
  visível e correção humana disponível* — exatamente o padrão que o P002 já estabeleceu com as
  correções de campo. Se for apresentada como fato, vira autoridade disfarçada de contexto.

### 5.4 P006 — Conjunto elegível

**Como melhora o trabalho do Curador**: compara estruturalmente o perfil de competência exigido contra
cada profissional da rede e diz **quem entra, quem sai e por quê** — sem rankear.

**Momento da jornada**: **Mesa**. É o mesmo ato que os filtros obrigatórios já executam (restringir
antes de comparar), com a diferença de registrar a avaliação de cada candidato, e não só o resultado.

**Categoria**: **B**.

### 5.5 P007 — Matriz de compatibilidade

**Como melhora o trabalho do Curador**: compara cada elegível dimensão a dimensão, e cada dimensão
produz **classificação + justificativa + evidências** — nunca um rótulo solto, nunca score, nunca ordem.

**Momento da jornada**: **Mesa**, sem dúvida. É comparação explicada, que é precisamente o que o
Curador precisa ver antes de escolher.

**Ponto que exige decisão posterior**: a Mesa já tem a sua própria comparação — `computeCompatibility`
sobre os 100 pontos que a pessoa validou. As duas não são a mesma coisa: uma parte do contexto
modelado, a outra do peso declarado pela própria pessoa. **A segunda é mais fiel ao Método.** Se
coexistem, cabe decidir qual é a leitura principal e qual é a segunda opinião. Este documento não
resolve isso — registra que precisa ser resolvido antes de qualquer implementação.

**Categoria**: **B**.

---

## 6. Disciplina de engenharia

Estas capacidades não pertencem ao ACE. Pertencem à plataforma, e sempre pertenceram. O ACE foi
apenas o primeiro lugar onde alguém precisou delas.

O critério aqui é diferente: **nunca duplicar implementação**. Em vários casos o COS já reimplementou
a mesma regra à mão, com outro vocabulário. A convergência dessas duplicatas é o maior ganho técnico
disponível na V2.

| Capacidade | O que garante | Onde a Curadoria já faz o mesmo, à mão | Destino |
|---|---|---|---|
| **Version Manager** | Correção nunca sobrescreve: cria versão nova referenciando a anterior | Perfil validado é imutável — "corrigir exige construir um novo" | **D** |
| **Estado de Informação** | 10 estados que distinguem "não possui", "não perguntado", "não se aplica", "conflitante". Ausência nunca vira negativa | Briefing trata ausência como lacuna; as classes de dado do Alinhamento fazem distinção parecida, com outro vocabulário | **D** |
| **Contrato de artefato** | Todo artefato carrega quem produziu, quando, sob qual versão do Método, e de que fontes deriva | Memória da Curadoria registra autor e instante de cada evento | **D** |
| **Deep freeze** | Imutabilidade real, inclusive em campos aninhados | Garantida por trigger no banco (Perfil validado, Relatório entregue) — não em memória | **D** |
| **Contratos de erro e validação** | Erro estruturado e rastreável; saída validada antes de ser aceita | Actions retornam mensagem para gente; o banco garante o invariante | **D** |
| **Portas e adaptadores de provider** | Lê a rede sem inventar dado ausente: sem nível de experiência ou área, o profissional simplesmente não é candidato | A Mesa lê a rede com o mesmo cuidado | **D** |
| **LLM Gateway** | Validação de forma em runtime + proteção de ambiente: em produção nunca cai no modelo falso em silêncio | Nada equivalente — é a única porta de IA do produto | **D** |
| **Invalidação em cascata** | Quando a origem muda, o que dela deriva deixa de ser reaproveitado | Parcial: `priority_profiles.status = SUPERSEDED` existe, mas as análises derivadas não são invalidadas explicitamente | **D** |
| **Validador de proveniência** | Cada artefato referencia corretamente aquele de que deriva | Nada equivalente | **D** |
| **Verificador de vocabulário** | Texto ao paciente sem linguagem de ranking, com consciência de negação | Testes pinam vocabulário por tela; nenhuma verificação em runtime | **D** |
| **Rótulos humanos** | Traduz identificador técnico para linguagem de pessoa | A jornada de sete etapas faz o mesmo para as nove fases do COS | **D** |
| **Política de campos por estágio** | Impede artefato de carregar campo antes do estágio que o legitima | Sem equivalente — e sem necessidade: não há pipeline de estágios fora do ACE | **E** |

> **A política de campos é a única disciplina que de fato desaparece.** Ela resolve um problema que só
> existe dentro de um pipeline de dez estágios. Sem o pipeline, não há o que proteger.

---

## 7. Capacidades administrativas e operacionais

### 7.1 Orquestrador — categoria E

**Objetivo**: encadear P001→P008 numa execução, reaproveitando artefatos já produzidos.

Não decide *quem*, mas decide *quando cada etapa acontece* — e sob a nova arquitetura isso é do Curador.

> **Absorvido por**: o próprio Curador. Ele já é o orquestrador — as sete etapas da jornada são a
> sequência, e o Motor de Condução diz onde ele está e o que falta. A diferença é que ele invoca cada
> capacidade quando precisa dela, em vez de disparar uma cadeia que roda inteira.

A capacidade de **reaproveitar trabalho já feito** (não recomputar o que não mudou) é real e valiosa,
mas é consequência da invalidação em cascata (§6), não do orquestrador.

### 7.2 Observabilidade de execução — categoria A

Health check, métricas, tabela de execuções, timeline de eventos. **É a única superfície do ACE
efetivamente em uso hoje.** Pertence ao Administrador, está bem onde está, e continua útil enquanto
qualquer capacidade executar. Nada muda.

### 7.3 Golden Set — categoria A

Gate obrigatório (ADR-022) para mudança de prompt, modelo, SDK ou provider. Roda contra o modelo real,
fora da suíte automática.

**Sob a nova arquitetura ele fica mais importante, não menos**: se o ACE passa a sugerir ao Curador,
garantir que a sugestão não derive de regra é exatamente o que protege a decisão dele de ser
contaminada. Muda o alvo, não a função.

---

## 8. Arquitetura final

```
                          ┌─────────────┐
                          │   CURADOR   │   única autoridade decisória
                          └──────┬──────┘
                                 │  decide
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌───────────────┐         ┌───────────────┐
            │   BRIEFING    │         │     MESA      │
            │  (preparar)   │         │  (escolher)   │
            ├───────────────┤         ├───────────────┤
            │ Estruturação  │         │ Conjunto      │
            │ Correções     │         │  elegível     │
            │ Verificação   │         │ Matriz de     │
            │ Modelagem*    │         │  compatib.    │
            └───────┬───────┘         └───────┬───────┘
                    │                         │
                    └───────────┬─────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │   SERVIÇOS COMPARTILHADOS    │  da plataforma,
                 │                              │  não da Curadoria
                 │ Versionamento · Estado de    │
                 │ Informação · Proveniência ·  │
                 │ Imutabilidade · Contratos ·  │
                 │ Vocabulário · Invalidação ·  │
                 │ Portas · LLM Gateway ·       │
                 │ Rótulos · Restrições         │
                 └──────────────┬───────────────┘
                                │
                                ▼
                      ┌───────────────────┐
                      │   ADMINISTRADOR   │
                      │ Observabilidade   │
                      │ Golden Set        │
                      └───────────────────┘

  * Modelagem entra no Briefing como sugestão com fonte visível e correção
    humana disponível — nunca como fato.

  O ACE não aparece neste diagrama como motor.
  Ele é a origem histórica de treze destas capacidades.
```

---

## 9. Dependências

Ordem imposta pela realidade, não por preferência. Cada item depende do anterior.

1. **Nada pode sair antes do Concierge ser desacoplado.** O P010 é hoje o **único** produtor de
   `final_curadoria_deliveries`, e `loadAuthorizedContext` exige essa tabela para autorizar qualquer
   Conexão. Enquanto isso for verdade, descontinuar o P010 desliga o jusante inteiro.
2. **P009 depende de P008.** Revisar uma escolha que não será mais feita não tem objeto — os dois saem
   juntos ou nenhum sai.
3. **P006 e P007 dependem das portas e adaptadores.** Se forem para a Mesa, a leitura da rede vai junto
   ou é substituída pela leitura que a Mesa já faz.
4. **P002, P003 e P004 dependem do LLM Gateway.** Nenhuma capacidade cognitiva sobrevive sem a porta de
   modelo e a sua proteção de ambiente.
5. **A observabilidade depende de haver execução.** Se as capacidades passarem a ser invocadas
   pontualmente em vez de por pipeline, o que ela observa muda de forma — a capacidade permanece, o
   objeto observado não.

---

## 10. Riscos

| Risco | Natureza | Consequência se ignorado |
|---|---|---|
| **Desligar o P010 antes de desacoplar o Concierge** | Bloqueante | Nenhum paciente consegue escolher profissional. O jusante inteiro para. |
| **Duas comparações coexistindo sem hierarquia declarada** | Método | Curador vê duas leituras de compatibilidade e não sabe qual vale. Ambiguidade onde o Método exige clareza. |
| **Modelagem (P004) apresentada como fato** | Método | Classificação de urgência vira autoridade disfarçada de contexto. Contraria a decisão de Fundador sem parecer contrariar. |
| **Extrair disciplina sem convergir a duplicata** | Técnico | Plataforma fica com duas implementações de versionamento, duas de imutabilidade, dois vocabulários de ausência. Pior que hoje. |
| **Perder as calibrações do verificador de vocabulário** | Método | CAL-001 e CAL-004 resolveram casos reais e sutis. Reimplementar ingenuamente reintroduz os falsos positivos que elas custaram a eliminar. |
| **Tratar "E" como "apagar"** | Processo | Nove capacidades em E; **sete continuam existindo** em outro lugar. Ler E como deleção destrói comportamento que a decisão nunca pediu para destruir. |

---

## 11. Plano de evolução

Sem datas e sem implementação — apenas a ordem em que as coisas podem acontecer sem quebrar nada.

**Fase 0 — Desbloquear.** Desacoplar o Concierge da tabela do P010. Enquanto isto não existir,
nenhuma outra fase pode começar. É a única fase obrigatória antes de qualquer outra.

**Fase 1 — Extrair o que é da plataforma.** As treze capacidades em D saem para infraestrutura
compartilhada, uma a uma, cada uma convergindo com a duplicata que o COS já tem. Nada da Curadoria
muda de comportamento nesta fase — é a fase mais segura e a de maior ganho permanente.

**Fase 2 — Levar as capacidades cognitivas aos seus lugares.** P006 e P007 para a Mesa; P002, P003 e a
modelagem do P004 para o Briefing. Aqui a decisão sobre as duas comparações (§5.5) precisa estar tomada.

**Fase 3 — Encerrar a autoridade paralela.** P008, P009 e P010 deixam de existir como protocolos. Já
não terão nada a fazer: suas partes valiosas terão sido absorvidas nas fases 1 e 2.

**Fase 4 — Encerrar o pipeline.** Orquestrador, retorno-a-protocolo e política de campos deixam de ter
objeto. A observabilidade se adapta ao novo formato de execução.

> A ordem é deliberada: **o que a plataforma ganha vem antes do que a Curadoria perde.** Se o trabalho
> parar no meio, ele terá parado depois de somar e antes de subtrair.

---

## 12. Autocrítica

**Ainda existe alguma capacidade exercendo autoridade além do Curador?**
Não, com uma ressalva declarada. P008 e P009 são as únicas que exerciam, e ambas estão em E com a
autoridade explicitamente absorvida. A ressalva é o **P004**: classificar urgência e complexidade não
escolhe ninguém, mas influencia tudo. Por isso a classificação C veio com condição — sugestão com fonte
e correção humana, nunca fato. **Reclassifiquei durante a revisão**: na primeira passagem P004 estava em
C sem condição, o que era insuficiente.

**Existe alguma capacidade vivendo no ACE apenas por herança histórica?**
Sim, treze — todas as de categoria D. Nenhuma delas sabe o que é uma Curadoria. Estão no ACE porque foi
lá que alguém precisou delas primeiro.

**Existe alguma capacidade que deveria pertencer ao Briefing?**
Quatro, e todas já estão classificadas em C. A verificação (P003) é a mais evidente: ela já fala a mesma
língua de lacuna que o Briefing usa.

**Existe alguma capacidade que deveria pertencer à Mesa?**
Duas em B — e, importante, **duas outras que já estão lá sem que ninguém tenha notado**: a recusa de
desempate do P008 (alerta C-01) e a validação estrutural do P009 (`validateMesaClosure`). O COS
reimplementou as melhores partes dos dois protocolos decisionais de forma independente. Isso é o
argumento mais forte de que a absorção não perde comportamento — em parte, já aconteceu.

**Existe alguma disciplina de engenharia escondida dentro de um protocolo?**
Sim, e esta foi a descoberta desta missão. **Três**, que o inventário anterior não tinha separado:
- o verificador de vocabulário proibido, dentro do P010;
- o validador de cadeia de proveniência, dentro do P010;
- a invalidação em cascata de derivados, dentro do retorno-a-protocolo.

As três foram promovidas a capacidades próprias em D. Sem essa separação, teriam sido descartadas junto
com os protocolos que as continham — que é exatamente o erro que esta missão existia para evitar.

---

## 13. A pergunta final

> **Se `src/modules/ace` desaparecesse amanhã, quais capacidades a Aliviar faria questão de manter?**

Não os protocolos. Nenhum deles, individualmente, é insubstituível — a Mesa já faz o trabalho de
comparar e escolher, e o faz com o critério que a própria pessoa declarou.

O que a Aliviar faria questão de manter é **a maneira de tratar informação**:

1. **Que corrigir nunca sobrescreve** — cria uma versão nova que aponta para a anterior.
2. **Que ausência não é negativa** — dez estados que distinguem "não perguntei" de "ela não tem".
3. **Que todo dado carrega de onde veio** — autor, instante, fonte, versão do Método.
4. **Que a máquina nunca sobrescreve o humano** — a correção da equipe é reaplicada em toda reexecução.
5. **Que texto ao paciente é verificado mecanicamente** contra linguagem de ranking, sabendo distinguir
   "não há ranking" de "ranking".
6. **Que a ausência de dado nunca é preenchida** — quem não tem cadastro completo não vira candidato
   com valor fabricado.
7. **Que nada se recomputa em silêncio** quando a origem muda.
8. **Que existe uma única porta de IA**, com validação de forma e proteção de ambiente.

Nenhum desses oito itens é sobre Curadoria. Todos são sobre **honestidade com o dado de uma pessoa que
está decidindo sobre a própria saúde** — e é isso que a Aliviar não pode perder.

O resto é organização de código.

---

## 14. Resposta ao critério de sucesso

Qualquer desenvolvedor que ler este documento deve conseguir responder:

> *"O ACE ainda existe?"*

**O ACE continua existindo como um conjunto de capacidades reutilizáveis da plataforma, mas a Curadoria
possui uma única autoridade decisória: o Curador."**

---

*Levantado por leitura direta de `src/modules/ace/` (41 arquivos, 4.361 linhas), `src/modules/concierge/`,
`src/components/ace/`, `tests/golden/` e `docs/DECISIONS.md`, com verificação de alcançabilidade de rotas
em produção. Nenhum arquivo de código, migração ou ADR foi alterado.*
