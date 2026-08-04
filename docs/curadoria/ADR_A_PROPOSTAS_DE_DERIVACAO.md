# ADR-A — Propostas de Derivação e a Ponte entre Declaração e Método

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` |
| **Estado** | **EM ELABORAÇÃO CONCLUÍDA — aguardando revisão constitucional do Agente 00.** Não lavrada em `DECISIONS.md` |
| **Natureza** | **Decisão de domínio.** Não descreve banco, migration, API, interface ou código |
| **Subordinada a** | Constituição da Aliviar · ADR-035 (autoridade decisória única do Curador) · [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0 · [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) |
| **Referencia** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 §2.3, §2.4, §5.4.0, §9.4, §10.3, §10.3.0, §10.5, §10.6 · [`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`](IMPEDIMENTO_F_02_MODELO_DE_DADOS.md) · [`REGISTRO_DAS_GUARDAS_2_0.md`](REGISTRO_DAS_GUARDAS_2_0.md) (guarda C-01) |
| **Origem** | Missão "ADR-A", em resposta ao impedimento I-1 do pacote F-02 |

> **Nada foi implementado.** Nenhuma tabela, migration, constraint, índice, policy, API,
> interface, tipo, teste ou linha de código foi criada ou alterada. Este arquivo é o único
> produto da missão.
>
> **Por que não está em `DECISIONS.md`:** lavrar uma ADR no log canônico é ato que
> pressupõe aprovação. Esta ADR ainda vai à revisão constitucional. O precedente é o da
> ADR-065, cujo conteúdo normativo viveu em documento próprio antes e depois da lavratura.
> **A lavratura é ato posterior, do Guardião ou do Fundador — não deste agente.**

---

## Sumário executivo

Esta ADR responde a uma única pergunta, em vinte perguntas menores: **o que uma proposta
de derivação é, dentro do Método?**

A resposta curta, da qual tudo o mais decorre:

> **Uma proposta de derivação é um oferecimento datado e rastreável — o registro de que o
> Método, aplicando uma regra nomeada e versionada a uma declaração específica, sugeriu um
> valor a uma pessoa que tem autoridade para declará-lo. Ela é prova de que a sugestão
> existiu. Nunca é o valor.**

Disso decorre a decisão estrutural mais consequente desta ADR: **a proposta é imutável e o
desfecho é outro fato.** Confirmar não altera a proposta — grava um ato humano que a
referencia. Não existe UPDATE em nenhum ponto do ciclo, e o append-only deixa de ser
disciplina para ser consequência da modelagem.

Esta ADR também declara formalmente a **reabertura substancial da invariante I-10** (§18) e
define **quando a ponte entre grau e importância existe e quando deixa de existir** (§16,
§17) — sem fixar um único valor de correspondência, porque valores exigem Cases reais.

---

# PARTE I — A proposta de derivação

## 1. O que é uma proposta de derivação

**Definição formal:**

> **Proposta de derivação** é o registro imutável de um **oferecimento**: o ato pelo qual o
> Método, executando uma **regra de derivação vigente e versionada** sobre uma **declaração
> de origem identificada**, apresenta a uma **pessoa com autoridade sobre o campo alvo** um
> **valor sugerido** para esse campo, acompanhado de tudo o que é necessário para que essa
> pessoa possa aceitá-lo ou recusá-lo com conhecimento de causa.

Cinco elementos são constitutivos — falta de qualquer um e não há proposta, há ruído:

| # | Elemento | Sem ele |
|---|---|---|
| 1 | **Uma declaração de origem**, identificada e versionada | o oferecimento não vem de ninguém; é invenção |
| 2 | **Uma regra nomeada e versionada** | não se sabe o que transformou a origem no valor |
| 3 | **Um campo alvo cuja autoridade é humana** | não há a quem oferecer; se o campo fosse do sistema, não haveria proposta, haveria cálculo |
| 4 | **Um valor sugerido** | não há oferecimento |
| 5 | **Uma data de emissão** | não se sabe o que estava visível quando se ofereceu |

**A natureza do ato:** uma proposta é **um ato do sistema dirigido a um humano**. Não é um
fato sobre a paciente, nem sobre o profissional, nem sobre o Case. É um fato sobre **o
sistema**: "nesta data, com esta regra, foi sugerido isto". Essa distinção é o que impede
que a proposta seja lida, algum dia, como se fosse a verdade que ela apenas sugeriu.

**A analogia que o domínio já conhece:** uma proposta está para o Mapa como uma
**evidência** está para o juízo do Curador. A evidência informa; não conclui. A proposta
oferece; não declara. O Método já sabe operar essa distinção — a ADR-040 a fixou quando
separou o estado do profissional da evidência que o sustenta.

## 2. O que uma proposta NÃO é

Respondido explicitamente, porque cada item abaixo é um modo real de a 2.0 falhar:

| # | Uma proposta **não** é | Por quê importa |
|---|---|---|
| 1 | **Não é uma declaração** | declaração tem autor humano com autoridade sobre o fato (P-07). Proposta tem autor-regra |
| 2 | **Não é uma decisão** | decidir é ato humano nomeado (ADR-035). Nenhuma proposta decide nada, nem "provisoriamente" |
| 3 | **Não é um valor do Mapa** | o Mapa é a única entrada do Motor (ADR-039/040). A proposta vive fora dele |
| 4 | **Não é entrada válida do Pipeline de Leitura** | Arquitetura §2.3. O Motor lê Mapas confirmados, nunca propostas |
| 5 | **Não é um rascunho editável** | rascunho se corrige no lugar; proposta é imutável (§12) |
| 6 | **Não é opinião do Curador** | ele ainda não se manifestou; confundir as duas coisas apaga a autoria dele |
| 7 | **Não é fato sobre a pessoa nem sobre o profissional** | é fato sobre o sistema (§1) |
| 8 | **Não é uma tarefa nem uma fila de trabalho** | uma fila pode ser esvaziada em lote, adiada, atribuída. Tratar proposta como tarefa é o primeiro passo para o carimbo |
| 9 | **Não é um cache nem uma otimização** | não existe para poupar tempo; existe para tornar visível uma tradução que hoje é mental |
| 10 | **Não é histórico de versões do Mapa** | o histórico do Mapa é do Mapa. A proposta registra o que foi *oferecido*, inclusive o que foi recusado — que nunca esteve no Mapa |
| 11 | **Não é uma recomendação ao Método** | não sugere mudar regra, catálogo ou processo |
| 12 | **Não é um sinal de qualidade** | nem da pessoa, nem do profissional, nem do Curador que a recusa |

## 3. Uma proposta possui autoridade?

**Não possui autoridade decisória. Possui autoridade probatória sobre si mesma.**

| Sobre o quê | Tem autoridade? | Justificativa |
|---|---|---|
| Sobre o **valor do campo alvo** | **Nenhuma** | o valor é do humano que declara ou confirma (P-07, P-08). Uma proposta não confirmada não vale coisa alguma como valor |
| Sobre **o que o Método concluiu** | **Nenhuma** | o Método conclui pela leitura do Motor sobre Mapas confirmados, nunca por proposta |
| Sobre **o que foi oferecido, quando, por qual regra** | **Total e exclusiva** | é o único registro desse fato. Nenhuma outra estrutura o guarda |
| Sobre **o que estava visível ao confirmador** | **Total** | é o que torna a confirmação auditável em vez de declaratória |

**A formulação que resolve a ambiguidade:**

> **Autoridade probatória, nunca decisória.** Uma proposta prova que houve oferecimento;
> não prova, sugere nem antecipa que o oferecimento estava certo.

**Consequência dura:** se toda proposta de um Case desaparecesse, **nenhum valor da
Curadoria mudaria** — mudaria apenas a capacidade de auditar como se chegou a eles. É esse
o teste que separa registro probatório de fonte de verdade, e a proposta precisa passar
nele sempre.

## 4. Quem pode criar uma proposta

**Somente o Pipeline de Derivação, executando uma regra de derivação vigente.** Uma única
origem, sem exceção.

| Ator | Pode criar? | Justificativa |
|---|---|---|
| **Sistema (Pipeline de Derivação)** | **Sim — é o único** | criar proposta é executar regra; executar regra é o que este pipeline faz e a única coisa que ele faz |
| **Motor (Pipeline de Leitura)** | **Não** | quem lê não propõe. Se o Motor pudesse propor, a leitura passaria a alimentar a própria entrada — o laço que a Arquitetura §2.3 partiu em dois pipelines |
| **Curador** | **Não** | o Curador **declara** ou **confirma**. Se ele criasse proposta e depois a confirmasse, estaria confirmando a si mesmo, e o registro diria "o sistema propôs" sobre um ato inteiramente humano — falsificação de proveniência |
| **Administrador** | **Não** | mesma razão |
| **Paciente** | **Não** | ela **declara** (autoridade máxima sobre o que quer). Rebaixar a declaração dela a proposta seria inverter a hierarquia que a 2.0 existe para corrigir |
| **Profissional** | **Não** | idem, sobre a própria prática |
| **Autoridade de Método** | **Não diretamente** | ela cria, versiona e suspende **regras**; as propostas nascem da execução delas. Autoridade sobre a regra ≠ autoridade sobre a instância |

**Regra derivada:** não existe proposta "manual", "avulsa" ou "de exceção". Uma sugestão
que não veio de regra versionada **não é proposta** — é conversa, e conversa não entra em
registro de proveniência.

## 5. Quem pode alterar uma proposta

**Ninguém. Nunca. Em nenhuma circunstância.**

| Quem | Pode alterar? |
|---|---|
| Sistema · Motor · Curador · Administrador · Paciente · Profissional · Autoridade de Método · Engenharia | **Não** |

**Justificativa:** a proposta é o registro do que foi oferecido. Alterá-la reescreve o
passado e destrói a única coisa que ela tem — a autoridade probatória do §3. É o mesmo
fundamento do I-7 (*histórico é imutável*) e do regime append-only da Base de Evidências.

**O que se faz quando a proposta está errada:** emite-se **outra**. A regra corrigida gera
nova proposta, com nova versão; a anterior passa a `SUPERADA` (§9) e permanece legível.
Corrigir é sempre acrescentar.

**Consequência de modelagem — a decisão estrutural desta ADR:**

> **A proposta nunca muda porque o desfecho não mora nela.** Confirmar, recusar ou superar
> são **fatos distintos**, registrados separadamente, que **referenciam** a proposta.

Isso elimina a última tentação de UPDATE do ciclo e torna o append-only uma propriedade da
modelagem, não uma disciplina que alguém precisa lembrar de respeitar.

## 6. Quem pode confirmar uma proposta

**Somente quem tem autoridade declarada sobre o campo alvo** — a mesma pessoa que
declararia o valor se não houvesse proposta nenhuma. A proposta não cria autoridade nova;
apenas oferece a quem já a tem.

| Campo alvo | Quem confirma | Fundamento |
|---|---|---|
| **Importância no Mapa de Prioridades** (conceitos com lado da pessoa) | **o Curador** responsável pelo Case | ADR-039: o Mapa é declaração do Curador sobre o que este Case exige |
| **Estado no Mapa do Profissional** | **papel interno habilitado**, conforme **ADR-D** | ADR-040 item 6; hoje restrito a `administrador`, e ampliar é matéria da ADR-D — **fora do escopo desta ADR** |
| **Qualquer campo cuja autoridade seja da paciente ou do profissional** | **ninguém confirma por eles** | esses campos não recebem proposta: eles são declarados diretamente (§16) |

**Condições de validade do ato de confirmar** — todas cumulativas, e a falta de qualquer
uma torna o ato inexistente, não inválido:

| # | Condição |
|---|---|
| 1 | O confirmador é pessoa nomeada, autenticada, com autoridade sobre o campo |
| 2 | Foram exibidos os nove elementos da Fronteira Humana (Arquitetura §2.4) |
| 3 | O ato é **explícito e positivo** — nunca por decurso, navegação, rolagem, fim de sessão ou ação de terceiro |
| 4 | O ato é **por item**, enquanto DP-5 estiver aberta (Arquitetura §5.4.0) |
| 5 | A proposta está em estado `PROPOSTA` — as demais não são confirmáveis |
| 6 | A declaração de origem está **vigente** (não superada) no momento do ato |

**O que a confirmação faz, exatamente:** grava **duas** coisas — o ato humano (autor, data,
proposta referenciada, o que estava visível) e a **declaração** no Mapa, com o valor. O
valor passa a existir no Mapa **porque uma pessoa o declarou**, e a proposta fica como
prova de que ela o fez informada.

> **A confirmação não move a proposta para dentro do Mapa. Ela cria uma declaração nova,
> que por acaso coincide com o que foi proposto.**

Essa formulação não é preciosismo: é o que impede a implementação de tratar confirmação
como uma promoção de registro — que reintroduziria, por outra porta, a proposta como fonte
de verdade.

## 7. Quem pode rejeitar uma proposta

**Exatamente as mesmas pessoas do §6, e sob as mesmas seis condições.** Nenhum ator pode
recusar o que não poderia confirmar, e vice-versa.

**Três decisões de domínio sobre a recusa:**

| # | Decisão | Justificativa |
|---|---|---|
| 1 | **Recusar custa o mesmo que confirmar** — mesmo número de atos, mesma proeminência na superfície | P-10. Se discordar for mais caro, a proposta vira decisão automática disfarçada |
| 2 | **O motivo da recusa é oferecido, nunca exigido** | exigir justificativa encareceria a discordância e violaria P-10 pela porta dos fundos. **A ausência de motivo é ela própria um dado**, e o painel de discordância a registra como tal |
| 3 | **Recusar não obriga a declarar em seguida** | recusar a sugestão e ainda não saber o valor certo é estado legítimo. O campo volta a **lacuna** — nunca ao valor proposto "por segurança", nunca a um valor anterior |

**O que a recusa produz:** o registro do ato humano, o estado `RECUSADA`, e **nada no
Mapa**. Se o Curador declarar depois um valor diferente, essa declaração é ato próprio,
independente, e não fica "vinculada" à recusa — embora o painel de discordância possa
relacioná-las para leitura.

**A recusa é o dado mais valioso do sistema.** É por ela que se descobre que uma regra está
errada (§10.5 da Arquitetura). Um sistema onde ninguém recusa não é um sistema calibrado —
é um sistema onde ninguém lê.

## 8. Quando uma proposta deixa de existir

**Nunca.**

> **Proposta não deixa de existir. Muda de estado.**

| Situação | O que acontece |
|---|---|
| Foi confirmada | permanece, em `CONFIRMADA` |
| Foi recusada | permanece, em `RECUSADA` |
| A origem foi superada | permanece, em `SUPERADA` |
| A regra foi revogada | permanece, em `RETIRADA` se ainda não tinha desfecho |
| O Case foi encerrado | permanece |
| O conceito saiu do catálogo | permanece, legível na versão de catálogo da época |
| Alguém quer "limpar" | **não existe limpeza** |

**Fundamento:** I-7 e §7.3 da Governança do Catálogo — desativação, nunca exclusão física.
Uma proposta apagada é uma confirmação que perdeu a prova de ter sido informada; o Case
inteiro deixa de ser auditável.

**Arquivamento (§10, etapa 7) é de visibilidade, não de existência.** Uma proposta
arquivada sai das superfícies de trabalho e permanece integralmente disponível à auditoria.

**Única exceção admitida, e ela é externa ao domínio:** exercício de direito de eliminação
sob a LGPD, que segue a política de retenção vigente (ADR-038, ADR-055) e apaga o Case
inteiro, não propostas seletivamente. Apagar propostas mantendo confirmações produziria um
registro que afirma "foi informado" sem poder prová-lo — pior que apagar tudo.

## 9. Quando uma proposta é supersedida

Supersessão é o mecanismo pelo qual uma proposta deixa de ser oferecível **sem deixar de
existir**. Cinco causas, todas objetivas e verificáveis:

| # | Causa | Estado resultante | Justificativa |
|---|---|---|---|
| **S1** | **A declaração de origem foi superada** (nova versão de `case_needs` ou nova evidência vigente) | `SUPERADA` | a proposta fala de um fato que a pessoa já corrigiu. Arquitetura §10.6 |
| **S2** | **Nova proposta foi emitida para o mesmo alvo a partir da mesma origem** (regra corrigida ou nova versão) | a anterior vai a `SUPERADA` | dois oferecimentos vivos para o mesmo campo produziriam ambiguidade na Fronteira Humana |
| **S3** | **A regra que a gerou foi revogada** e a proposta ainda não tinha desfecho | `RETIRADA` | ver §11 |
| **S4** | **A regra que a gerou foi suspensa** e a proposta ainda não tinha desfecho | `RETIRADA` | suspensão é ato humano de governança (§10.5 da Arquitetura); enquanto durar, o oferecimento não deve estar de pé |
| **S5** | **O conceito alvo foi desativado no catálogo** | `SUPERADA` | §7.3 da Governança do Catálogo — mas **Case aberto nunca perde conceito no meio do caminho**: S5 só se aplica a Cases novos |

**A regra que fecha o ciclo, herdada da Arquitetura §10.6 e aqui tornada normativa:**

> **Nenhuma confirmação permanece vigente apontando para origem retratada.**

Quando **S1** ocorre, a supersessão **atravessa**: a proposta vai a `SUPERADA`, **e a
confirmação que se apoiava nela também**. A declaração correspondente no Mapa deixa de ser
entrada válida do Pipeline de Leitura, e o conceito volta a **lacuna** — nunca a um valor
anterior. Nova proposta pode nascer; **novo ato humano é exigido**; confirmação não se
herda.

**O que a supersessão nunca faz:** não reescreve Relatório já emitido (isso é errata
versionada, ADR-050, ato humano) · não apaga nada · não reabre reconhecimento de Perfil já
dado (ADR-049), que segue seu próprio rito de supersessão.

## 10. O ciclo de vida completo

Sete etapas. Somente as etapas 3 e 4 envolvem humano; somente a 4 produz valor.

```
1 · NASCIMENTO (emissão)
    o Pipeline de Derivação aplica regra vigente a declaração de origem vigente
    → registra: origem, regra, versão, alvo, valor sugerido, data, catálogo, consequência
    → estado: PROPOSTA
         │
2 · VALIDAÇÃO
    verificação de completude da proveniência e de participação do conceito
    → incompleta ou conceito fora do Motor: NÃO NASCE (não há proposta inválida)
         │
3 · OFERECIMENTO  ────────── FRONTEIRA HUMANA (Arquitetura §2.4) ──────────
    exibição dos nove elementos a quem tem autoridade sobre o campo
    → sem ato humano: permanece em PROPOSTA, indefinidamente, sem prazo
         │
    ┌────┴─────────────────────────────┐
    │                                  │
4a · CONFIRMAÇÃO                   4b · RECUSA
    ato humano explícito                ato humano explícito
    → grava ato + DECLARAÇÃO no Mapa    → grava ato; Mapa permanece em lacuna
    → estado: CONFIRMADA                → estado: RECUSADA
    └────┬─────────────────────────────┘
         │
5 · SUPERSESSÃO  (pode incidir sobre qualquer estado anterior — §9)
    S1 origem superada · S2 nova proposta · S3 regra revogada
    S4 regra suspensa  · S5 conceito desativado
    → estado: SUPERADA ou RETIRADA
    → se havia confirmação apoiada nela: a confirmação também é superada
         │
6 · HISTÓRICO
    todos os registros permanecem legíveis, na versão de catálogo e de regra da época
    → é o que sustenta a cadeia de proveniência (Arquitetura §11.4)
         │
7 · ARQUIVAMENTO
    saída das superfícies de trabalho, permanência integral para auditoria
    → visibilidade, nunca existência (§8)
```

**Propriedades do ciclo, todas normativas:**

| # | Propriedade |
|---|---|
| 1 | **Não há caminho de volta.** `CONFIRMADA` não retorna a `PROPOSTA`; arrepender-se é declarar de novo, não desconfirmar |
| 2 | **Não há transição por tempo.** Nenhuma etapa avança por decurso de prazo |
| 3 | **Não há transição automática entre 3 e 4.** É a Fronteira Humana, e ela é a razão de a 2.0 existir |
| 4 | **A etapa 5 pode incidir a qualquer momento**, inclusive sobre propostas já confirmadas há meses |
| 5 | **As etapas 6 e 7 nunca terminam** |

## 11. Estados permitidos

**Cinco estados. Lista fechada.** Estado que não está aqui não existe no domínio.

| Estado | Significado | Terminal? |
|---|---|---|
| **`PROPOSTA`** | oferecida, aguardando ato humano. **Único estado não terminal** | não |
| **`CONFIRMADA`** | um humano com autoridade aceitou; existe declaração correspondente no Mapa | sim |
| **`RECUSADA`** | um humano com autoridade recusou; **não** existe declaração correspondente | sim |
| **`SUPERADA`** | deixou de ser oferecível por S1, S2 ou S5 — a origem mudou, foi substituída, ou o conceito saiu | sim |
| **`RETIRADA`** | deixou de ser oferecível por S3 ou S4 — **a regra** foi revogada ou suspensa, por ato humano de governança | sim |

**Duas decisões que esta ADR toma explicitamente:**

**(a) `PENDENTE` não é estado.** "Pendente" é a *leitura operacional* de uma proposta em
`PROPOSTA` — descreve a ausência de desfecho, não um estado próprio. Criá-lo abriria a
porta para "pendente há muito tempo → confirmar automaticamente", que é precisamente o que
o §6 condição 3 proíbe.

**(b) `RETIRADA` é acrescentada, e isto emenda a Arquitetura §9.4**, que previa quatro
estados. Justificativa: `SUPERADA` descreve mudança **no fato**; `RETIRADA` descreve
mudança **na regra**. Fundi-las apagaria a distinção entre "a pessoa corrigiu o que disse"
e "a Autoridade de Método suspendeu a regra" — duas causas com implicações opostas para a
calibração. A primeira é operação normal; a segunda é sinal de que a regra pode estar
errada, e precisa ser contável separadamente no painel de discordância.

> **Emenda registrada:** a Arquitetura §9.4 deve passar de quatro para cinco estados na
> próxima revisão, referenciando esta ADR. Enquanto não o fizer, **vale esta ADR**, que é
> a norma de domínio sobre a entidade.

## 12. O que permanece imutável

**Tudo o que foi registrado na emissão.** Uma vez nascida, nenhum atributo da proposta
muda:

| Imutável | Por quê |
|---|---|
| **Identidade** da proposta | referência estável para os atos que a citam |
| **Alvo** (Case ou profissional, conceito, campo) | mudar o alvo criaria outra proposta |
| **Valor sugerido** | é o que foi oferecido; alterá-lo falsifica o que o confirmador viu |
| **Origem** — registro, versão e data da declaração | é a base da cadeia de proveniência (§11.4 da Arquitetura) |
| **Regra e versão da regra** | sem isso não se sabe o que gerou o valor; e é a chave da calibração |
| **Versão do catálogo vigente** | permite reler um Case de dois anos atrás sem reinterpretá-lo (§7.5 da Governança) |
| **Data de emissão** | o "quando" do oferecimento |
| **Grau de consequência atribuído na emissão** | reclassificar depois mudaria retroativamente o regime a que a proposta esteve sujeita |

**Também imutáveis, e por igual razão:** os **atos humanos** — confirmação e recusa, com
autor, data e o que estava visível. Um ato humano registrado nunca é editado.

**O único atributo que evolui é o estado** — e ele evolui por registro de fato novo, não
por edição. A trajetória de estados é reconstruível a partir dos fatos, sempre.

## 13. O que pode ser corrigido

**Nada é corrigido no lugar. Tudo é corrigido por acréscimo.** A tabela abaixo é a resposta
completa:

| Situação | Como se corrige |
|---|---|
| **A regra estava errada** | a Autoridade suspende ou revoga a regra (§10.5 da Arquitetura); propostas sem desfecho vão a `RETIRADA`; nova versão da regra emite propostas novas |
| **A proposta trouxe valor errado** | não se corrige a proposta: recusa-se, e o humano declara o valor certo |
| **A pessoa declarou errado** | ela **supersede a própria declaração** (ADR-049); S1 dispara; ciclo do §9 |
| **O confirmador se enganou** | **não existe "desconfirmar".** Ele **declara de novo** no Mapa, com autoria e data próprias; a declaração anterior fica no histórico do Mapa. A proposta permanece `CONFIRMADA`, porque a confirmação de fato aconteceu |
| **O motivo da recusa foi mal escrito** | acrescenta-se observação nova; a original permanece |
| **A proveniência ficou incompleta** | **não acontece**: proposta com proveniência incompleta não nasce (§10, etapa 2) |
| **O grau de consequência estava errado** | corrige-se a **régua** (DP-5), e a correção vale para propostas futuras. As antigas permanecem com o grau da época |

**O princípio, em uma frase:** *o registro do erro é parte do registro.* Um sistema que
apaga os próprios enganos não é auditável — é apenas bem-apresentado.

## 14. Informação que obrigatoriamente acompanha uma proposta

Doze itens. **Proposta sem qualquer um deles não nasce** (§10, etapa 2). Não há campos
opcionais nesta lista; o que é opcional está declarado como tal no §14.2.

### 14.1 Obrigatórios

| # | Informação | Conteúdo | Por que é obrigatória |
|---|---|---|---|
| 1 | **Identidade** | referência estável e única | permite que atos a citem sem ambiguidade |
| 2 | **Alvo** | o Case ou o profissional, o conceito canônico (por **código**, nunca rótulo — I-2), e qual campo | define de quem é a autoridade para confirmar |
| 3 | **Valor sugerido** | um valor da escala fechada do campo | é o oferecimento |
| 4 | **Origem — registro** | qual declaração, identificada | primeiro elo da cadeia de proveniência |
| 5 | **Origem — versão** | a versão da declaração usada | permite detectar S1 |
| 6 | **Origem — data** | quando a pessoa declarou | é o que a Fronteira Humana mostra: *"você respondeu isto em 10/03"* |
| 7 | **Origem — autor** | quem declarou (a paciente, o profissional) | fecha a autoridade sobre o fato de origem |
| 8 | **Regra — identificador** | qual regra | sem ela, o valor é mágico |
| 9 | **Regra — versão** | qual versão da regra | é a chave da calibração e da auditoria retroativa |
| 10 | **Data de emissão** | quando o sistema ofereceu | distingue-se da data da origem, e a diferença importa |
| 11 | **Versão do catálogo vigente** | catálogo no momento da emissão | permite reler sem reinterpretar (§7.5 da Governança) |
| 12 | **Grau de consequência** | conforme a régua da DP-5 | define o regime a que a proposta está sujeita |

### 14.2 Sobre "autor" e "justificativa" — duas decisões explícitas

A missão lista **autor** e **justificativa** entre as informações obrigatórias. Esta ADR
decide o que cada uma significa aqui, porque a leitura ingênua produziria registro falso:

**(a) Autor.** Uma proposta tem **três** referências de autoria, e confundi-las é o erro:

| Papel | Quem | Onde vive |
|---|---|---|
| **Autor da declaração de origem** | a paciente ou o profissional | item 7, obrigatório |
| **Autor da regra** | proponente e Autoridade aprovadora | **na regra**, não na proposta (§14.3) |
| **Autor da proposta** | **não existe** | a proposta é executada, não autorada. Registrar "autor: sistema" é ruído; registrar um humano seria falso |

**(b) Justificativa.** A justificativa é atributo **da regra**, não da instância. Repetir o
mesmo texto em cada proposta produziria milhares de cópias de uma frase e, pior, permitiria
que divergissem entre si. **Decisão: a proposta referencia a justificativa da regra, e a
Fronteira Humana a exibe a partir dessa referência.** A obrigatoriedade é cumprida — a
justificativa está sempre disponível a quem confirma — sem duplicar o texto nem criar uma
segunda fonte de verdade.

### 14.3 O que vive na regra, não na proposta

Os dez atributos do §10.5 da Arquitetura: identificador · versão · vigência · autor
proponente · autoridade aprovadora · justificativa · evidência utilizada · estado ·
histórico · data de suspensão ou revogação. **A proposta guarda apenas o par
(identificador, versão)** e alcança o resto por referência.

**Regra de integridade de domínio:** uma versão de regra referida por qualquer proposta
**nunca** pode ser apagada ou editada. Regras são tão imutáveis quanto as propostas que
geraram — do contrário a proveniência aponta para o vazio.

---

# PARTE II — A ponte entre declaração e Método

## 15. O que é a ponte

**Definição formal:**

> **Ponte entre declaração e Método** é uma **correspondência total, declarada, versionada
> e revogável** entre uma **escala de declaração** — usada por quem vive o fato — e uma
> **escala de Método** — usada pelo Motor —, cuja aplicação produz **exclusivamente
> oferecimentos**, jamais valores.

Seis propriedades constitutivas:

| # | Propriedade | Significado |
|---|---|---|
| 1 | **Total** | todo valor da escala de origem tem correspondência declarada. Nenhum caso cai em omissão |
| 2 | **Declarada** | escrita, legível, aprovada — nunca implícita em código nem mental |
| 3 | **Versionada** | cada oferecimento sabe qual versão o gerou (§14.1 item 9) |
| 4 | **Revogável** | pode ser suspensa a qualquer momento, por ato humano de governança |
| 5 | **Não-injetora e não-sobrejetora por desenho** | as escalas continuam com domínios disjuntos; a ponte é correspondência, não igualdade |
| 6 | **Produtora de oferecimento** | seu produto é sempre uma proposta, nunca uma declaração |

**A ponte concreta que a 2.0 propõe** é uma só: **grau declarado pela pessoa → importância
proposta para o Case** (Arquitetura §10.3). A definição acima é genérica porque a mesma
física serve à derivação do estado do profissional a partir da Base de Evidências — que
**não** é ponte entre escalas (é leitura de condutas declaradas), mas obedece às mesmas
seis propriedades.

**O que a ponte é, em uma frase:** *tornar pública uma tradução que hoje acontece dentro da
cabeça do Curador.* O ganho não é economia de atos — é que uma tradução mental é
irrecuperável em auditoria, e uma tabela versionada é a coisa mais auditável que existe.

## 16. Quando a ponte existe

**Somente quando as sete condições abaixo são simultaneamente verdadeiras.** Basta uma
falhar e **não há oferecimento** — o campo simplesmente aguarda declaração humana direta,
como hoje.

| # | Condição |
|---|---|
| 1 | **O conceito tem lado da pessoa** — existe pergunta a ela no Protocolo. Nos 11 conceitos técnicos, não há origem, logo não há ponte |
| 2 | **A declaração de origem existe e está vigente** — não superada, não retratada |
| 3 | **A declaração é de escala fechada** — texto livre **jamais** atravessa ponte alguma |
| 4 | **O conceito participa do Motor** — `MOTOR_PARTICIPATION` ≠ `NUNCA`. Viabilidade e preferências/restrições não têm ponte |
| 5 | **Existe regra vigente, aprovada e não suspensa** para aquele conceito |
| 6 | **A Autoridade de Método está nomeada e ativa** (DP-4) — regra sem dono não propõe |
| 7 | **Os dois lados estão na mesma versão de catálogo** |

**Quatro exclusões nomeadas, para não deixar dúvida:**

| Nunca tem ponte | Por quê |
|---|---|
| **Filtros eliminatórios** | filtro elimina. Arquitetura §5.5: o sistema **sinaliza tema para discussão**, nunca oferece filtro pronto |
| **`MODELO_PREFERENCIAS_E_RESTRICOES`** | o lado da pessoa é texto guiado |
| **Os 12 conceitos de Prática e Trajetória** | não há lado da pessoa; é juízo do Curador contra o caso |
| **Os dois conceitos de Viabilidade** | fora do Motor por decisão de Método |

## 17. Quando a ponte deixa de existir

Duas formas, com consequências diferentes:

**(a) Deixa de existir para um caso concreto** — a condição falhou; nenhum oferecimento
nasce; o campo aguarda declaração direta. Nada mais acontece. É situação normal, não erro.

**(b) Deixa de existir como instituição** — cinco causas:

| # | Causa | Efeito sobre propostas sem desfecho | Efeito sobre confirmações já feitas |
|---|---|---|---|
| 1 | **A Autoridade suspende a regra** | vão a `RETIRADA` | **permanecem válidas** — foram atos humanos legítimos, informados pelo que se sabia então |
| 2 | **A Autoridade revoga a regra** | vão a `RETIRADA` | permanecem válidas, marcadas como oriundas de regra revogada |
| 3 | **A ADR que a instituiu é superada** por ADR posterior | idem | idem, com o registro da supersessão |
| 4 | **O Guardião recusa a reabertura de I-10** | **a ponte nunca nasce** | não há nenhuma |
| 5 | **A calibração real demonstra dano** (Onda 5) | a Autoridade suspende; §6 do Congelamento se aplica em sentido inverso | permanecem, e a revisão dirá o que fazer com os Cases afetados |

**A propriedade que torna a ponte segura — e que é o argumento central para aprová-la:**

> **Desligar a ponte devolve o sistema exatamente ao estado anterior, sem perder um único
> dado.** As confirmações já feitas continuam sendo declarações humanas válidas; as
> propostas param de nascer; o Curador volta a declarar os 17 conceitos à mão. **A
> Curadoria 2.0 foi desenhada para sobreviver à recusa da ponte.**

## 18. O que significa reabrir I-10 — definição formal

A invariante, no §5 do Congelamento: *"**I-10.** Grau da pessoa ≠ importância do Case —
escalas sem valor em comum, e só a importância alcança o Motor."*

### 18.1 A definição

> **Reabrir I-10 significa admitir que passa a existir uma correspondência total, declarada
> e sistematicamente aplicada entre a escala de grau e a escala de importância — e que,
> portanto, a afirmação "escalas sem valor em comum" deixa de ser descrição suficiente da
> relação entre elas, ainda que permaneça literalmente verdadeira.**

### 18.2 O que se preserva e o que se perde

| Permanece verdadeiro | Deixa de ser verdadeiro |
|---|---|
| Os **domínios são disjuntos** — `ESSENCIAL` não é `MUITO_IMPORTANTE`; nenhum valor pertence às duas escalas | Que **não existe relação sistemática** entre elas |
| **Nenhuma igualdade** é afirmada entre valores | Que a tradução é **sempre um juízo particular** daquele Curador, naquele Case |
| **Só a importância alcança o Motor** | Que **a origem da importância é opaca** — passa a ser rastreável |
| A conversão **nunca é automática** — exige ato humano | Que **nenhuma conversão institucional existe** |

### 18.3 Por que isto é reabertura, e não preservação

A invariante não foi escrita para proibir uma coincidência aritmética. Foi escrita para
**impedir que a declaração da pessoa fosse convertida em peso de Método sem passar por
juízo**. A ponte não viola a letra — mas institui exatamente a conversão que a invariante
existia para tornar impossível, ainda que sob confirmação humana.

**Chamar isso de preservação seria manter a letra e perder o motivo**, e esta ADR recusa
essa manobra explicitamente.

### 18.4 Consequências formais

| # | Consequência |
|---|---|
| 1 | Esta ADR **é** o registro da reabertura exigido pelo §6 do Congelamento, e apresenta: necessidade (D1/RI1 da auditoria: a tradução hoje é invisível e não auditável), dano da decisão vigente (a pessoa não pode auditar a tradução do que ela mesma disse), análise de impacto (§18.2) e plano de compatibilidade (§17, item da reversibilidade) |
| 2 | **O critério 1 do §6 do Congelamento — necessidade observada em operação real — NÃO está satisfeito**, e esta ADR não finge que está. Ver §18.5 |
| 3 | **Nenhum valor de correspondência é fixado aqui.** Forma e governança agora; valores após Cases reais (DP-6) |
| 4 | **Toda versão anterior à evidência operacional nasce marcada `PROVISÓRIA`**, com vigência limitada e revisão obrigatória |
| 5 | **O teste `importancia-vs-grau.test.ts` não pode ser afrouxado, renomeado nem ter asserção relaxada** por conta desta ADR. Ele protege a disjunção dos domínios, que **continua verdadeira** (§18.2) e continua devendo ser protegida |
| 6 | A finalidade daquele teste **só muda se e quando esta ADR for aprovada**, e a mudança é escopo da própria aprovação — nunca trabalho de implementação |

### 18.5 A questão que esta ADR devolve ao Guardião

O §6 do Congelamento exige, **cumulativamente**, cinco requisitos para reabrir. Esta ADR
satisfaz quatro. O primeiro — *necessidade observada em operação real, Case concreto, não
hipótese* — **não está satisfeito**, porque a Rede real não existe (RI10).

Três caminhos, e a escolha **não é do Arquiteto**:

| Caminho | Consequência |
|---|---|
| **A** — aprovar forma e governança agora, com valores bloqueados até Cases reais | é o que esta ADR propõe: nada que dependa de evidência é decidido sem evidência |
| **B** — recusar a reabertura até existir operação real | a 2.0 segue sem a ponte; perde-se O3; **todo o resto permanece de pé** |
| **C** — declarar que o critério 1 não se aplica a decisões de forma, apenas de valor | é interpretação constitucional legítima, mas **é do Guardião**, não deste agente |

## 19. O que pertence ao domínio

Tudo o que segue **é decisão de Método** e não pode ser alterado por implementação:

| # | Pertence ao domínio |
|---|---|
| 1 | A definição de proposta (§1) e o que ela não é (§2) |
| 2 | A ausência de autoridade decisória e a presença de autoridade probatória (§3) |
| 3 | Quem cria, altera, confirma e rejeita (§4–§7) |
| 4 | As seis condições de validade do ato humano (§6) |
| 5 | Que recusar custa o mesmo que confirmar, e que motivo não é exigido (§7) |
| 6 | Que proposta nunca deixa de existir (§8) |
| 7 | As cinco causas de supersessão e o atravessamento sobre a confirmação (§9) |
| 8 | As sete etapas do ciclo e as cinco propriedades que o regem (§10) |
| 9 | **Os cinco estados, como lista fechada** (§11) |
| 10 | O que é imutável (§12) e que correção é sempre por acréscimo (§13) |
| 11 | Os doze itens obrigatórios de proveniência (§14.1) |
| 12 | Que autor da proposta não existe e que justificativa vive na regra (§14.2) |
| 13 | A definição da ponte e suas seis propriedades (§15) |
| 14 | As sete condições de existência e as quatro exclusões nomeadas (§16) |
| 15 | As causas de extinção e a garantia de reversibilidade sem perda (§17) |
| 16 | A reabertura de I-10 e seus limites (§18) |
| 17 | Que a proposta é imutável e o desfecho é fato separado (§5) |

## 20. O que pertence apenas à implementação

Tudo o que segue é **livre**, desde que respeite a Parte I e a Parte II:

| # | Pertence à implementação |
|---|---|
| 1 | Nomes de tabelas, colunas, tipos, enums e índices |
| 2 | Se desfecho é tabela própria, coluna, ou evento — **desde que a proposta permaneça imutável** |
| 3 | Estratégia de chaves, particionamento, arquivamento físico |
| 4 | Formato de armazenamento da referência à regra |
| 5 | Como a supersessão é detectada — gatilho, verificação em leitura, rotina |
| 6 | Policies de RLS — **exceto quem confirma, que é ADR-D** |
| 7 | Layout, componentes e ergonomia da Fronteira Humana — **exceto os nove elementos e a equivalência de esforço, que são domínio** |
| 8 | Linguagem das mensagens, desde que respeite a gramática vigente |
| 9 | Como o painel de discordância agrega e apresenta |
| 10 | Testes, guardas e ferramentas de verificação |
| 11 | Ordem das migrations e estratégia de publicação |
| 12 | Se a função pura de derivação vive em um módulo ou vários |

**Regra de arbitragem:** em dúvida sobre se algo é domínio ou implementação, a pergunta é
*"mudar isto muda o que o Método afirma, ou apenas como o afirma?"* — se muda o que
afirma, é domínio, e volta ao Arquiteto.

---

# PARTE III — Verificações

## 21. Esta ADR responde aos quatro impedimentos do F-02?

**Resposta direta: não. Responde a um, em parte, e fornece a matéria-prima de um segundo.
Os outros dois não são de domínio e não podem ser resolvidos por ADR nenhuma.**

| Impedimento | Resolvido? | Justificativa |
|---|---|---|
| **I-1** · As ADRs que definem as duas tabelas não existem | **PARCIALMENTE** | Esta ADR entrega integralmente o domínio de `derivation_proposals` — estados, proveniência, ciclo, imutabilidade, supersessão. **`curator_judgments` continua sem ADR**: o §14 do impedimento aponta corretamente que o escopo dos juízos é matéria da **ADR-B**, que não existe. Ver §22 |
| **I-2** · A regra §15.0 proíbe começar por aqui | **NÃO** | É **sequenciamento**, não domínio. Das dez dependências, esta ADR satisfaz três (proveniência definida, regra versionada, critérios de supersessão) e **define** uma quarta (autoridade da regra, cujo ocupante segue vago — DP-4). As outras seis pertencem à Onda 1, que não começou. **Nenhuma ADR pode declarar satisfeita uma dependência que é trabalho** |
| **I-3** · A entrada da Onda 2 não está satisfeita | **NÃO** | Onda 1 não iniciada; ADR-B e ADR-D inexistentes; DP-1 aberta; Autoridade não nomeada. Esta ADR **remove um dos quatro itens** da lista de entrada e não toca os outros três |
| **I-4** · Colisão com a guarda C-01 | **NÃO — e não deve** | C-01 falha se `derivation_proposals` aparecer antes da ADR-A **e das dez dependências**. Esta ADR satisfaz a primeira metade da condição; a segunda permanece. **A guarda continua correta e deve continuar vermelha.** Desligá-la exige as três instâncias (Guardião, Arquiteto, Governança), e o Arquiteto, sozinho, é uma delas — não as três. **Esta ADR não pede, não autoriza e não antecipa a suspensão de C-01** |

**Conclusão sobre o F-02:** **permanece bloqueado.** Esta ADR era necessária para
desbloqueá-lo; não é suficiente. Quem quiser abri-lo precisa da alternativa **A** ou **B**
do §5 do relatório de impedimento — nunca da **C** por iniciativa de agente.

## 22. Sobre `curator_judgments` — fronteira declarada

A missão inclui, no resultado esperado, "implementar `curator_judgments`". Esta ADR
**entrega parte disso e recusa entregar o resto**, por uma razão de competência:

| Aspecto de `curator_judgments` | Onde é decidido |
|---|---|
| **Que é append-only** | **aqui** — mesmo fundamento do §5/§12: ato humano registrado nunca se edita |
| **Que retificar é gravar versão nova** | **aqui** — §13 |
| **Que juízo apoiado em origem superada torna-se superado e exige novo ato** | **aqui** — §9, o mesmo atravessamento |
| **Que registra autor, data e o que estava visível** | **aqui** — §12 |
| **Que referencia evidência em vez de redigitá-la** | **aqui** — decorre de P-07 |
| **Quais juízos entram** (as naturezas `TECNICO` e `RELACIONAL`, com `AREA` excluída) | **ADR-B** — é decisão sobre a divisão da etapa AVALIAÇÃO, com a dívida documental do Modelo §7.1–§7.4/§11 |

**Justificativa da recusa:** decidir aqui quais juízos existem seria decidir a divisão da
etapa AVALIAÇÃO por via transversa — a matéria central da ADR-B, que carrega junto a
obrigação de reescrever o corpo normativo do Modelo. Antecipá-la produziria duas ADRs
dizendo sobre o mesmo objeto, que é o padrão de dívida documental (P17) que a 2.0 existe
para não repetir.

**Portanto:** o Implementador pode construir a **estrutura de registro** de
`curator_judgments` a partir desta ADR, mas **não pode povoar suas naturezas** antes da
ADR-B.

## 23. Critérios de aceite desta ADR

| # | Critério | Situação | Evidência |
|---|---|---|---|
| 1 | **Nenhuma decisão de domínio permanece implícita** | **Atendido**, com duas exceções declaradas | As exceções estão nomeadas em §24 (valores da ponte, escopo de `curator_judgments`) — declaradas, não implícitas |
| 2 | **O Implementador pode implementar o modelo sem interpretar o Método** | **Atendido para `derivation_proposals`**; parcial para `curator_judgments` | §11 fecha os estados; §12 fecha a imutabilidade; §14.1 fecha a proveniência; §19/§20 separam domínio de implementação |
| 3 | **O Guardião pode verificar a aderência ao Método** | **Atendido** | Cada decisão cita seu fundamento (invariante, ADR ou seção do Modelo). §18 expõe a reabertura em vez de escondê-la, e §18.5 devolve a escolha a ele |
| 4 | **O Verificador pode reproduzir as decisões** | **Atendido** | As decisões são declarativas e enumeradas; nenhuma depende de contexto de conversa |
| 5 | **O Certificador pode certificar sem recorrer a conversas anteriores** | **Atendido** | Este documento é autocontido: define, justifica e referencia por arquivo e seção |

---

# PARTE IV — Relatório final

## Resumo executivo

Esta ADR define o domínio da proposta de derivação e da ponte entre declaração e Método,
removendo o impedimento **I-1** do pacote F-02 na parte que lhe cabe. A decisão de maior
consequência técnica é que **a proposta é imutável e o desfecho é um fato separado que a
referencia** — o que elimina UPDATE do ciclo inteiro e torna o append-only propriedade da
modelagem. A decisão de maior consequência constitucional é o **§18**, que declara
formalmente a reabertura substancial de I-10 e devolve ao Guardião a escolha sobre o
critério 1 do §6 do Congelamento, que **não está satisfeito**.

**O F-02 permanece bloqueado.** Esta ADR é condição necessária, não suficiente.

## Decisões tomadas

| # | Decisão |
|---|---|
| 1 | Proposta é **oferecimento**, com autoridade **probatória e nunca decisória** |
| 2 | **Proposta é imutável; desfecho é fato separado** — não há UPDATE no ciclo |
| 3 | **Cinco estados**, lista fechada, com `RETIRADA` acrescentada e `PENDENTE` recusado |
| 4 | Somente o Pipeline de Derivação cria; **ninguém altera**; confirma e recusa quem tem autoridade sobre o campo |
| 5 | **Recusar custa o mesmo que confirmar**, e o motivo é oferecido, nunca exigido |
| 6 | Proposta **nunca deixa de existir**; arquivamento é de visibilidade |
| 7 | **Cinco causas de supersessão**, e a supersessão **atravessa** para a confirmação |
| 8 | **Doze itens obrigatórios** de proveniência; autor-da-proposta **não existe**; justificativa vive **na regra** |
| 9 | Ponte definida com **seis propriedades**, **sete condições** de existência e **quatro exclusões** nomeadas |
| 10 | **Filtros eliminatórios nunca têm ponte** |
| 11 | **Reabertura de I-10 declarada** em substância, com os limites do §18.4 |
| 12 | **Desligar a ponte é reversível sem perda de dado** |

## Decisões adiadas — e por quê

| # | Adiada | Para quem | Por quê |
|---|---|---|---|
| 1 | **Os valores da correspondência grau → importância** | Método, após Cases reais (**DP-6**) | Fixar valores sem operação real é exatamente o que o §6 do Congelamento proíbe. Esta ADR decide a forma, não o conteúdo |
| 2 | **O escopo de `curator_judgments`** | **ADR-B** | §22 |
| 3 | **Quem confirma o Mapa do Profissional** | **ADR-D** | Toca a RLS congelada (ADR-040 item 6) |
| 4 | **A régua de graduação por consequência** | **DP-5** | Enquanto aberta, o regime de bloco está proibido de existir; a confirmação é item a item |
| 5 | **O ocupante da Autoridade de Método** | **Fundador (DP-4)** | Esta ADR define a função; nomear é ato dele |
| 6 | **A satisfação do critério 1 do §6 do Congelamento** | **Guardião (§18.5)** | É interpretação constitucional |

## Impacto na Arquitetura

| Documento | Impacto |
|---|---|
| `ARQUITETURA_CURADORIA_2_0.md` §9.4 | **Emenda necessária**: quatro estados → **cinco** (§11b). Também: o campo "desfecho" deixa de ser atributo da proposta e passa a fato separado |
| `ARQUITETURA_CURADORIA_2_0.md` §10.3.0 | **Confirmado e ampliado** pelo §18 desta ADR |
| `ARQUITETURA_CURADORIA_2_0.md` §10.6 | **Confirmado**; o ciclo de oito passos permanece, agora com as cinco causas nomeadas |
| `MODELO_CURADORIA_V1.md` | **Sem impacto direto.** A dívida §7.1–§7.4/§11 é da **ADR-B** |
| `CONGELAMENTO_ARQUITETURAL.md` §5 (I-10) | **Reabertura declarada.** Se aprovada, o §5 precisa registrar a reabertura e esta ADR |
| Guarda **C-01** | **Nenhum impacto.** Continua correta e deve continuar vermelha |

## Pacotes desbloqueados

**Nenhum pacote de implementação.** O que esta ADR desbloqueia é **trabalho de decisão**:

| Desbloqueado | Natureza |
|---|---|
| Redação da **ADR-B** | pode partir da estrutura de registro já definida (§22) |
| Redação da **ADR-D** | pode partir da definição de "quem confirma" (§6) |
| Revisão constitucional da reabertura de I-10 | §18.5 dá ao Guardião a decisão formulada |
| Emenda da Arquitetura §9.4 | escopo delimitado |

## Pacotes ainda bloqueados

| Pacote | Bloqueio remanescente |
|---|---|
| **F-02** (modelo de dados) | I-2, I-3, I-4 · ADR-B · ADR-D · DP-1 · DP-4 · janela de publicação · árvore suja |
| **Onda 2 inteira** | Onda 1 não iniciada |
| **Subescopo 2.5** (regime de bloco) | DP-5 — proibido de existir no repositório |
| **Onda 5** (calibração) | Rede real inexistente |

## ADRs dependentes

| ADR | Relação |
|---|---|
| **ADR-B** | depende desta para a estrutura de registro do juízo; decide o escopo |
| **ADR-D** | depende desta para a definição do ato de confirmar; decide quem confirma |
| **ADR-E** (destino do ACE) | independente |
| Futura ADR de ordenação (ex-**ADR-C**) | **retirada do caminho**; permanece bloqueada por ausência de necessidade real |

## Riscos

| # | Risco | Severidade |
|---|---|---|
| **RA-1** | **O Guardião recusar a reabertura de I-10** (§18.5, caminho B) | **Alta probabilidade, baixo dano** — a 2.0 sobrevive sem a ponte; perde-se O3 |
| **RA-2** | **A imutabilidade da proposta ser contornada na implementação** por um UPDATE "só para o estado" | **Alta** — é a forma mais provável de o §12 ser perdido. Exige guarda explícita |
| **RA-3** | **A proposta virar fila de trabalho** na superfície (§2 item 8) | **Alta** — é o caminho natural de qualquer UI, e reintroduz o carimbo por ergonomia |
| **RA-4** | **Regra referida por proposta ser apagada ou editada**, quebrando a proveniência (§14.3) | Média |
| **RA-5** | **`RETIRADA` e `SUPERADA` serem fundidas** por conveniência, apagando a distinção que calibra a regra | Média |
| **RA-6** | **Esta ADR ser lida como autorização para implementar** | **Alta, de processo** — daí o §21 e o §25 |

## Pendências

DP-1 (veredito de P15) · DP-4 (nomear a Autoridade) · DP-5 (régua de consequência) ·
DP-6 (valores da ponte) · DP-7 (P-07/P-08/P-10 viram domínio — **esta ADR é o veículo**) ·
DP-10 (versionar os documentos) · DP-11 (gravar o parecer do Guardião) · ADR-B · ADR-D ·
emenda da Arquitetura §9.4 · lavratura desta ADR em `DECISIONS.md` **após** aprovação.

## 25. Conformidade

Nenhuma tabela, migration, constraint, índice, policy, view, API, interface, tipo, teste ou
linha de código foi criada ou alterada. Nenhum documento canônico foi modificado. Nenhuma
guarda foi tocada, desligada ou contornada. Nenhum commit foi feito.

**Esta ADR não autoriza implementação.** Ela remove um impedimento de domínio; os
impedimentos de sequenciamento e de governança permanecem, e estão nomeados no §21.

---

*Fim da ADR-A. **Próximo destino obrigatório: Agente 00 — Guardião, para revisão
constitucional**, com atenção especial ao §18.5, que devolve a ele uma decisão que não é do
Arquiteto. Nenhuma implementação antes dessa revisão.*
