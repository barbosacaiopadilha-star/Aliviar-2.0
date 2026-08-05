# ADR-069 — Ciclo de Vida das Regras de Derivação

| Campo | Valor |
|---|---|
| **Identificador** | **ADR-069** — próximo número real disponível (último lavrado: ADR-068) |
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-05 · **Branch:** `curadoria/onda-1-9-1-10-proveniencia` · **HEAD:** `7770d7f` |
| **Estado** | **APROVADA** pelo **DT-01** em **2026-08-05**. **Lavrada em `DECISIONS.md`** |
| **Objeto único** | Ciclo de vida das regras de derivação |
| **Origem** | Verificação independente do Item 2.2A-MR1 · interrupção do Item 2.2B pelo Agente 01 |
| **Subordinada a** | Constituição · ADR-035 · **ADR-066** · **ADR-067** · Arquitetura §5.4 e §10.5 · Congelamento (I-7) |
| **Desbloqueia** | **Item 2.2B** — e nada mais |

> **Nenhum código, migration, tabela, schema, trigger, índice, FK ou teste de
> implementação foi criado ou alterado.** Nenhuma ADR existente foi tocada.
> 2.2B não iniciada; 2.C não aberta.
>
> ## ✅ Estado de autoridade
>
> **Esta ADR está APROVADA pelo DT-01 em 2026-08-05** e **lavrada** no log
> canônico (`DECISIONS.md`, verbete ADR-069).
>
> A lavratura ocorreu **somente após a aprovação**, por determinação do DT-01:
> o log é append-only (ADR-062), e **nenhum registro intermediário em estado
> `PROPOSTA` foi inserido**. O conteúdo arquitetural aprovado é o mesmo do
> commit da proposta, `4e43b74` — **nenhuma decisão foi alterada na lavratura**.
>
> **Esta ADR não autoriza implementação.** O Item 2.2B exige autorização formal
> de abertura pelo DT-01.

---

## 1. Resumo executivo

A proposta anterior recomendou a arquitetura; **esta ADR fecha as três decisões que faltavam** e que fizeram o Agente 01 interromper o 2.2B corretamente.

| # | Decisão | Resposta |
|---|---|---|
| **B-1** | Destino de `derivation_rules.state` | **Deixa de ser fonte de verdade e passa a ser o registro do estado inicial** — imutável, como todo o resto da linha. **Não vira cache** |
| **B-2** | Grafo de transições | **Nove pares avaliados; cinco permitidos, quatro proibidos.** `REVOGADA` é terminal; **`PROPOSTA → REVOGADA` não existe** — o ato correto é `PROPOSTA → SUSPENSA` |
| **B-3** | Novo significado de MR1.2 | O invariante muda de **sujeito**, não de conteúdo: passa a ser garantido sobre a **transição** — *"no máximo uma transição para `VIGENTE` sem transição de saída posterior, por `rule_id`"* |

**O princípio que sustenta as três:**

> **A versão da regra nunca muda, porque o estado não mora nela.** É a ADR-066 §5 — *"a proposta nunca muda porque o desfecho não mora nela"* — aplicada ao terceiro objeto da mesma família.

**A decisão B-1 é a que exige mais coragem e é a que evita o pior desfecho.** A saída fácil seria manter `state` como cache derivado — nada quebra, tudo continua legível. **É exatamente a armadilha:** um cache é uma segunda fonte de verdade que só diverge quando ninguém está olhando, e o sistema inteiro foi construído para não ter duas verdades sobre o mesmo fato (**P-07**).

---

## 2. Autoridade e estado documental

| Item | Situação |
|---|---|
| **Número** | **ADR-069** — confirmado disponível na lavratura (último lavrado: ADR-068) |
| **Estado** | **APROVADA** |
| **Aprovação DT-01** | **2026-08-05** — arquitetura aprovada integralmente, sem alteração de conteúdo |
| **Lavratura** | **realizada** — verbete único em `DECISIONS.md`, **sem registro intermediário em `PROPOSTA`** |
| **Local canônico** | `docs/curadoria/ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md`, no padrão de ADR_A/B/D |
| **Versionamento** | proposta em `4e43b74`; lavratura em commit documental próprio |

---

## 3. Problema

Dois invariantes aprovados, ambos corretos, produzem juntos um estado terminal.

| Invariante | Implementação | Efeito |
|---|---|---|
| **MR1.1** | trigger `derivation_rules_append_only` — recusa `UPDATE` e `DELETE` **para todo papel, inclusive `service_role`** | a linha nunca muda |
| **MR1.2** | índice único parcial `where state = 'VIGENTE'`, por `rule_id` | só uma linha `VIGENTE` por regra |

Com `primary key (rule_id, version)` e `state` como coluna da linha:

| Caminho de saída de `VIGENTE` | Resultado |
|---|---|
| `UPDATE state` | recusado por MR1.1 |
| `DELETE` | recusado por MR1.1 |
| nova versão com `state='VIGENTE'` | recusada por MR1.2 |
| nova versão com `state='SUSPENSA'` | aceita, **e inútil** — a anterior segue `VIGENTE` |

> **Uma regra que entra em `VIGENTE` nunca mais sai.**

**Quatro consequências que o tornam bloqueante:**

1. Os atos **versionar, alterar, suspender e revogar** do §10.5 tornam-se inexequíveis.
2. O **freio do Curador** (§5.4 condição 7) não existe.
3. O **rollback mestre da Onda 2** — *"suspender a regra devolve ao regime de declaração direta sem perder dado"* — deixa de existir.
4. A ADR-066 §18.4 obriga a primeira versão da ponte a nascer **`PROVISÓRIA`** — isto é, **feita para ser revista**. Sem saída de `VIGENTE`, não há revisão possível.

**Causa raiz:** `state` foi modelado como propriedade da versão. **Não é.** A versão é um **fato** — em tal data alguém propôs isto, com esta justificativa. Fato não muda. O estado é a **posição desse fato num ciclo que corre no tempo**.

---

## 4. Princípio arquitetural

> **A versão da regra é fato imutável. A transição é ato append-only. O estado vigente é leitura derivada — nunca um campo que alguém edita.**

| Conceito | Natureza | Muda? |
|---|---|---|
| **Regra** (`rule_id`) | identidade estável, nunca reutilizada | não |
| **Versão** (`rule_id`, `version`) | **fato**: conteúdo, justificativa, evidência, autoria, data | **nunca** |
| **Transição** | **ato**: mudança de posição no ciclo, com autor, data e motivo | append-only |
| **Estado vigente** | **leitura** da última transição | não é armazenado como verdade |

**Não é arquitetura nova.** É o terceiro uso do mesmo padrão:

| Objeto | Fato imutável | Ato separado | Fonte |
|---|---|---|---|
| Proposta | a proposta | o desfecho | ADR-066 §5 |
| Julgamento | a versão do juízo | a versão nova | ADR-067 §9 |
| **Regra** | **a versão** | **a transição** | **esta ADR** |

---

## 5. Decisão B-1 — destino de `derivation_rules.state`

### 5.1 A decisão

> **`state` deixa de ser fonte de verdade e permanece na linha como registro imutável do estado inicial da versão — o estado em que ela nasceu.**

**Não é removido. Não é cache. Não é atualizado. Nunca.**

### 5.2 As quatro respostas exigidas

| Pergunta | Resposta |
|---|---|
| **Fonte canônica do estado** | **A última transição registrada para aquela versão.** Nada mais |
| **A coluna permanece?** | **Sim** |
| **Qual é a sua natureza?** | **Registro histórico do estado inicial** — parte do fato "esta versão nasceu assim". Protegida por MR1.1, como todo o resto da linha |
| **O que deixa de depender dela** | Toda leitura de estado corrente · MR1.2 · a decisão de emitir proposta · qualquer consulta de "está vigente?" |

### 5.3 Como se evita duas fontes de verdade

**Três regras, e a terceira é a que resolve:**

| # | Regra |
|---|---|
| 1 | **`state` só é escrito no nascimento da versão** (MR1.1 já garante; nenhuma exceção é criada) |
| 2 | **Nenhum consumidor lê `state` para saber o estado corrente** — apenas para saber **como a versão nasceu** |
| 3 | **`state` é semanticamente renomeado, não fisicamente.** Ele deixa de significar *"o estado"* e passa a significar *"o estado inicial"*. **Um campo cujo significado é 'inicial' não pode divergir do corrente — porque não afirma nada sobre o corrente** |

> **A regra 3 é a decisão.** Duas fontes de verdade existem quando dois campos afirmam **o mesmo fato**. Aqui passam a afirmar **fatos diferentes**: um diz como nasceu, outro diz onde está. **Não há o que divergir.**

### 5.4 Por que não as outras três opções

| Opção | Rejeitada porque |
|---|---|
| **Permanece apenas como estado inicial** | ✅ **é a escolhida** |
| **Removido** | Destruiria o fato "esta versão nasceu em `PROPOSTA`" e exigiria alterar a linha — **UPDATE proibido por MR1.1**, e apagar fato viola **I-7** |
| **Cache derivado** | **A armadilha.** Exigiria escrita fora do nascimento — quebrando MR1.1 — e criaria segunda fonte que só diverge quando ninguém olha. Contraria **P-07** e reintroduz *"a última tentação de UPDATE"* que a ADR-066 §5 declara eliminada |
| **Outra** | Nenhuma identificada que preserve MR1.1 sem exceção |

**Consequência para o `CHECK` de autoridade do MR1.** Hoje `derivation_rules_vigente_exige_autoridade` valida a linha. Como nenhuma versão nascerá em `VIGENTE` (§9), ele passa a ser **vacuamente verdadeiro** — e a exigência real migra para a **transição para `VIGENTE`** (§12). **O CHECK permanece; ganha um companheiro mais preciso.** Onde ele mora fisicamente é do implementador.

---

## 6. Decisão B-2 — grafo de transições

### 6.1 Confirmações expressas

| Pergunta | Resposta |
|---|---|
| **`REVOGADA` é terminal?** | **Sim, absolutamente.** Nenhuma transição parte dela. §10.5: revogar é definitivo, suspender é reversível |
| **Reativação é `SUSPENSA → VIGENTE`?** | **Sim** — e é a única forma de reativar |
| **`PROPOSTA → REVOGADA` existe?** | **Não.** O ato correto é **`PROPOSTA → SUSPENSA`** — ver §6.2 |
| **Uma versão pode voltar a `PROPOSTA`?** | **Não, nunca.** `PROPOSTA` é estado de nascimento; voltar a ele apagaria que a versão já foi apreciada |
| **Múltiplos ciclos `VIGENTE ↔ SUSPENSA` na mesma versão?** | **Sim, sem limite** — e **contá-los é sinal de calibração** (§12.5 da Arquitetura). Limitar apagaria informação |

### 6.2 Por que `PROPOSTA → REVOGADA` não existe

Poderia parecer natural: *"a proposta foi recusada, revoguem-na"*. **É erro de vocabulário, e ele tem consequência.**

**Revogar é retirar algo que valeu.** Uma versão em `PROPOSTA` **nunca valeu** — nunca emitiu proposta alguma, nunca alcançou humano nenhum. Marcá-la `REVOGADA` afirmaria que houve vigência a desfazer.

**`SUSPENSA` descreve o fato corretamente:** a versão existe, está registrada, **não está em vigor**, e a porta permanece aberta caso a Autoridade retome a apreciação. Se nunca retomar, ela apenas permanece suspensa — **e permanecer suspensa é um desfecho legítimo, não uma pendência**.

*(Precedente do mesmo raciocínio: ADR-066 §11a recusou `PENDENTE` como estado da proposta, porque ausência de desfecho não é desfecho. Aqui, ausência de vigência não é revogação.)*

### 6.3 Autoridade — os três atores

| Ator | Pode | Fundamento |
|---|---|---|
| **Autoridade de Método** | propor · aprovar · reativar · revogar · suspender | §10.5, os oito atos |
| **Qualquer papel interno** | **apenas propor** (criar versão em `PROPOSTA`) | §10.5 ato 1: *"qualquer papel interno — Curador, operação, engenharia"* |
| **Curador do Case** | **apenas suspender**, como freio de emergência | §5.4 condição 7 |

**O freio do Curador é deliberadamente assimétrico:** ele **pode desligar** e **não pode religar**. Quem para uma regra em curso não é quem decide que ela voltou a servir — isso é da Autoridade. **Freio é freio, não volante.**

---

## 7. Matriz completa de transições

| Origem | Destino | Permitida? | Autoridade | Motivo obrigatório? |
|---|---|---|---|---|
| **inexistente** | `PROPOSTA` | **SIM** | qualquer papel interno | **Sim** — `rationale` e `evidence` já são `NOT NULL` |
| **`PROPOSTA`** | `VIGENTE` | **SIM** | **Autoridade de Método, por ADR** | **Sim** — exige `approved_by`, `approval_adr`, `effective_from` |
| **`PROPOSTA`** | `SUSPENSA` | **SIM** | **Autoridade de Método** | **Sim** |
| **`PROPOSTA`** | `REVOGADA` | **NÃO** | — | — · não se revoga o que nunca valeu (§6.2) |
| **`VIGENTE`** | `SUSPENSA` | **SIM** | **Autoridade** **ou** **Curador do Case** (freio, §5.4 cond. 7) | **Sim** — e, se pelo Curador, **justificativa de emergência** |
| **`VIGENTE`** | `REVOGADA` | **SIM** | **Autoridade, por ADR de revogação** | **Sim** — exige ADR |
| **`SUSPENSA`** | `VIGENTE` | **SIM** (reativação) | **Autoridade de Método** | **Sim** — e **nunca** pelo Curador |
| **`SUSPENSA`** | `REVOGADA` | **SIM** | **Autoridade, por ADR de revogação** | **Sim** — exige ADR |
| **`REVOGADA`** | **qualquer** | **NÃO** | — | — · **terminal** |
| **qualquer** | `PROPOSTA` | **NÃO** | — | — · nascimento não se repete |
| **X** | **X** (mesmo estado) | **NÃO** | — | — · transição sem mudança não é ato |

**Cinco transições permitidas. Lista fechada.** Acrescentar qualquer uma exige nova ADR que referencie esta.

**Todas exigem motivo. Sem exceção.** O §10.5 diz *"suspensão é ato reversível e registrado"*, e registrado sem porquê é carimbo. Duas exigem **ADR**: entrada em `VIGENTE` e qualquer entrada em `REVOGADA`.

---

## 8. Decisão B-3 — o novo significado de MR1.2

### 8.1 O invariante, reenunciado

**Conteúdo preservado, sujeito trocado:**

| | Enunciado |
|---|---|
| **Hoje** | *"No máximo uma **linha** com `state = 'VIGENTE'` por `rule_id`"* |
| **A partir desta ADR** | *"No máximo uma **transição para `VIGENTE`** sem transição de saída posterior, por `rule_id`"* |

> **A regra não muda: continua havendo no máximo uma versão vigente por regra.** Muda o objeto que a carrega — da linha da versão para o fluxo de transições.

### 8.2 As oito respostas exigidas

| Pergunta | Resposta |
|---|---|
| **Qual objeto conceitual carrega o invariante** | **A transição** — especificamente, a transição de entrada em `VIGENTE` ainda não sucedida por transição de saída |
| **O índice parcial atual continua válido?** | **Continua correto e torna-se insuficiente.** Como nenhuma versão nascerá em `VIGENTE` (§9), ele protege um conjunto que passa a ser sempre vazio — **vacuamente verdadeiro** |
| **Será substituído?** | **Sim, em função** — não em intenção. A garantia migra para o fluxo de transições |
| **Passa a proteger outro objeto?** | **Sim: a transição, não a linha da versão** |
| **Como permanece declarativo** | **Exigência de domínio:** a unicidade deve ser garantida por **estrutura declarativa** sobre a transição de entrada em `VIGENTE`, **não** por verificação em código de aplicação. **A forma física é do implementador; a natureza declarativa é decisão de domínio e não é negociável** |
| **Como a concorrência é impedida** | Pela mesma estrutura declarativa. **Duas transições concorrentes para `VIGENTE` na mesma regra devem colidir** — uma vence, a outra falha. **Nunca "a última ganha"** |
| **Estado histórico × estado vigente** | **Histórico** = a sequência completa de transições, imutável e integral. **Vigente** = a leitura da última. O histórico é o **fato**; o vigente é uma **projeção** dele |
| **Como consultas identificam a vigente sem convenção de aplicação** | Pela **leitura da última transição**, cuja ordem é inequívoca (§11). **Nunca por "maior versão", "mais recente por `created_at`" ou qualquer heurística** — convenção de aplicação é precisamente o que esta ADR recusa |

### 8.3 A garantia que não pode ser perdida

**Hoje o índice parcial é infalível:** vale para todo papel, inclusive `service_role`, e não depende de ninguém lembrar de verificar. **A substituição precisa manter esse patamar.** Se a unicidade passar a depender de verificação em código de aplicação, o invariante terá sido **enfraquecido**, ainda que os testes passem — e é exatamente o tipo de degradação que o MR1 existiu para impedir.

---

## 9. Estado inicial

### **Resposta única: toda versão nasce com transição inicial obrigatória para `PROPOSTA`.**

| Alternativa | Veredito |
|---|---|
| Sem transição | **Não** — criaria versão sem estado derivável, e o estado passaria a depender da coluna, contradizendo B-1 |
| **Com transição inicial obrigatória para `PROPOSTA`** | **✅ SIM** |
| Em outro estado | **Não** — nenhuma versão nasce `VIGENTE`, `SUSPENSA` ou `REVOGADA` |

**Três consequências:**

| # | Consequência |
|---|---|
| 1 | **Versão sem transição inicial não existe** — o par (versão, transição de nascimento) é indivisível |
| 2 | **Nenhuma versão nasce vigente.** Aprovar é sempre ato posterior e separado — o que torna impossível criar regra vigente sem passar pela Autoridade |
| 3 | `derivation_rules.state` no nascimento é sempre `'PROPOSTA'` — **coincidindo com a transição inicial e nunca a contradizendo** |

---

## 10. Relação transição → versão

| # | Regra |
|---|---|
| 1 | **Toda transição referencia uma versão previamente existente** — `(rule_id, version)`, o mesmo par da PK |
| 2 | **Transição sem regra e versão válidas não existe** — mesma doutrina de MR1.3: *"proposta órfã não nasce"* |
| 3 | **Nenhuma transição altera o conteúdo da versão** — a versão permanece protegida por MR1.1, sem exceção |
| 4 | **Nenhuma transição apaga transição anterior** — append-only, por **I-7** |
| 5 | **Nenhuma cascata destrutiva** — remover regra ou versão referida por transição é recusado, como MR1.3 já faz para propostas |

---

## 11. Ordenação e concorrência

### 11.1 A decisão

> **A última transição é determinada por ordem monotônica por versão — nunca por ordem temporal isolada.**

### 11.2 Por que não ordem temporal

Carimbo de tempo empata. Duas transições no mesmo instante — plausível sob concorrência — deixam *"qual é a última?"* sem resposta, e **o estado vigente passa a depender de desempate arbitrário**. Um sistema cujo estado depende de desempate não é auditável.

### 11.3 As três exigências de domínio

| # | Exigência |
|---|---|
| 1 | **Total e sem empate** dentro de uma mesma versão: dadas duas transições da mesma versão, é sempre determinável qual precede |
| 2 | **Monotônica**: nunca se insere transição "no meio" de uma sequência já registrada |
| 3 | **Independente do relógio**: o tempo é registrado como **fato** (quando aconteceu), nunca usado como **chave de ordenação** |

**A data permanece obrigatória** (§12) — para dizer *quando*, não para dizer *qual foi a última*.

**A forma física é do implementador.** O domínio exige a propriedade, não o mecanismo.

---

## 12. Autoria e autoridade

| Ato | Autor | Autoridade | Data | Motivo | Ref. de aprovação | Justificativa de emergência |
|---|---|---|---|---|---|---|
| **Criar versão** (`→ PROPOSTA`) | **sim** | qualquer papel interno | **sim** | **sim** (`rationale` + `evidence`) | não | não |
| **`PROPOSTA → VIGENTE`** | **sim** | **Autoridade de Método** | **sim** | **sim** | **sim — ADR** | não |
| **`PROPOSTA → SUSPENSA`** | **sim** | Autoridade | **sim** | **sim** | não | não |
| **`VIGENTE → SUSPENSA`** (Autoridade) | **sim** | Autoridade | **sim** | **sim** | não | não |
| **`VIGENTE → SUSPENSA`** (Curador, freio) | **sim** | **Curador do Case** | **sim** | **sim** | não | **SIM** |
| **`SUSPENSA → VIGENTE`** (reativação) | **sim** | **Autoridade** | **sim** | **sim** | **sim — ADR** | não |
| **`→ REVOGADA`** | **sim** | **Autoridade** | **sim** | **sim** | **sim — ADR de revogação** | não |

**Duas regras transversais:**

| # | Regra |
|---|---|
| 1 | **Toda transição tem autor nomeado.** Transição sem autor não existe — é a mesma exigência que a ADR-068 §1 faz da confirmação |
| 2 | **A justificativa de emergência é exclusiva do freio do Curador.** Ela existe para que a Autoridade, ao revisar, saiba **por que alguém precisou parar a regra sem esperar por ela** |

---

## 13. Compatibilidade com propostas

**Três confirmações, todas verificadas contra o schema vigente:**

| # | Confirmação | Evidência |
|---|---|---|
| 1 | **`derivation_proposals` continua referenciando `(rule_id, version)`** | `derivation_proposals_regra_fk`, `on update restrict`, `on delete restrict` — **MR1.3 intacta** |
| 2 | **O estado posterior da versão não altera a proveniência da proposta** | A proposta refere o **fato** (a versão), não a sua posição no ciclo. Uma proposta emitida sob `v2` continua dizendo *"nasci sob v2"* mesmo depois de `v2` ser revogada |
| 3 | **A proposta nunca referencia "a regra vigente" de forma flutuante** | A FK é para o par exato. **Não existe referência a "a vigente"** — e não pode passar a existir |

> **A regra que fecha:** uma proposta emitida sob uma versão depois revogada **permanece válida como registro do que foi oferecido**. Revogar a regra impede **novas** emissões; não reescreve as antigas. É o mesmo princípio da ADR-066 §19 — *"regra revogada não supersede a confirmação: o fato não mudou, e quem adotou continua respondendo"*.

---

## 14. Compatibilidade com ADRs e Arquitetura

| Norma | Classificação | Justificativa |
|---|---|---|
| **ADR-066** | **PRESERVADA e estendida** | §5 (fato imutável, ato separado) é o próprio fundamento desta ADR. §19 (revogação não supersede confirmação) é reafirmado no §13 |
| **ADR-067** | **PRESERVADA** | Nada aqui toca julgamento. O padrão de versionamento append-only é o mesmo |
| **ADR-068** | **PRESERVADA** | A Autoridade continua sem confirmar instâncias (§148, §160). Esta ADR trata do que ela faz com **regras** |
| **Arquitetura §5.4 cond. 7** | **PRESERVADA e tornada exequível** | O freio do Curador existia como texto e não tinha caminho. Passa a ter, com autoria e justificativa de emergência |
| **Arquitetura §10.5** | **PRESERVADA integralmente** | Os oito atos, os dez atributos e os quatro estados permanecem. **Nenhum estado criado, nenhum removido** |
| **I-7** (histórico imutável) | **PRESERVADO e reforçado** | A versão fica imutável **por modelagem**, não por disciplina; e as transições são append-only |
| **MR1.1** (append-only) | **PRESERVADO sem exceção** | **Nenhuma exceção ao trigger.** A alternativa B, que a exigia, foi rejeitada |
| **MR1.2** (uma vigente) | **REINTERPRETADO** | Conteúdo idêntico; sujeito trocado da linha para a transição (§8). **Exige que a nova garantia seja igualmente declarativa** (§8.3) |
| **MR1.3** (FK composta) | **PRESERVADA integralmente** | Intocada. E o §10 estende a mesma doutrina às transições |
| **P-07** (uma origem por fato) | **PRESERVADO** | É a razão da recusa do cache (§5.4) |

**Nenhuma incompatibilidade.** A única reinterpretação — MR1.2 — é de sujeito, não de conteúdo, e vem acompanhada da exigência do §8.3 de não perder o patamar declarativo.

---

## 15. Consequências para MR1

| Componente | Consequência |
|---|---|
| **MR1.1 · trigger append-only** | **Mantido, sem exceção.** Ganha razão de ser: agora não há sequer motivo para querer editar |
| **MR1.2 · índice parcial** | Torna-se **vacuamente verdadeiro** (nenhuma versão nasce `VIGENTE`). **Não é revogado**: continua correto e barato. A garantia real migra para a transição |
| **MR1.3 · FK composta** | **Intocada** |
| **`CHECK` de autoridade** | Torna-se vacuamente verdadeiro; a exigência real migra para a transição de entrada em `VIGENTE` (§12) |
| **`CHECK` `fim_tem_data`** | Idem |
| **`suspended_or_revoked_at`** | Deixa de ser a fonte do "quando deixou de valer" — passa a ser a data da transição, que tem autor e motivo |

> **Nada do MR1 é revogado por esta ADR.** Dois `CHECK` e um índice tornam-se vacuamente verdadeiros — o que é diferente de errado. Se são removidos ou preservados como cinto de segurança **é decisão do implementador**, e não desta ADR.

---

## 16. Impacto futuro na 2.2B

| Aspecto | Impacto |
|---|---|
| **Habilita** | suspender, revogar e reativar — hoje impossíveis |
| **Devolve** | o rollback mestre da Onda 2 |
| **Torna exequível** | o freio do Curador (§5.4 cond. 7) |
| **Exige da 2.2B** | materializar transição · garantir declarativamente a unicidade (§8.3) · garantir ordenação monotônica (§11) · exigir os atributos de autoria (§12) |
| **Não exige** | alterar a tabela de versões · alterar a FK das propostas · criar estado novo |
| **Fora de escopo desta ADR** | escritores · pipeline de aprovação · forma física do registro · nomes |

---

## 17. Riscos

| # | Risco | Mitigação |
|---|---|---|
| **RA-1** | **Reintroduzir `state` como cache** "para simplificar consultas" | §5.4 o rejeita nominalmente. É o risco mais provável, porque a solução parece inofensiva |
| **RA-2** | **Unicidade cair para código de aplicação** — testes verdes, invariante enfraquecido | §8.3 exige patamar declarativo. **É a exigência que o implementador não pode negociar** |
| **RA-3** | **Ordenação por `created_at`** — empate sob concorrência | §11 proíbe expressamente |
| **RA-4** | **Alguém criar `PROPOSTA → REVOGADA`** por parecer natural | §6.2 explica por que não existe |
| **RA-5** | **Curador reativar regra que suspendeu** | §6.3: freio é assimétrico. Reativar é da Autoridade |
| **RA-6** | **Custo de um conceito novo** | terceiro uso do mesmo padrão — custo de coerência |
| **RA-7** | **A aprovação da ADR ser lida como autorização de implementação** | São atos distintos. A ADR-069 aprova **a arquitetura**; abrir o Item 2.2B exige **autorização formal própria** do DT-01 |

---

## 18. Fora de escopo

Escritores · pipeline de aprovação · máquina de estados **completa em nível físico** · implementação da 2.2B · nomes de tabela, coluna ou índice · decisão sobre remover ou preservar os `CHECK` vacuamente verdadeiros.

---

## 19. Lavratura — executada

**A ADR foi lavrada em 2026-08-05, após a aprovação do DT-01.** Os cinco passos
previstos foram cumpridos nesta ordem:

| # | Passo | Situação |
|---|---|---|
| 1 | Estado deste documento alterado para **APROVADA**, com data e autoridade | ✅ |
| 2 | Verbete **único** inserido em `docs/DECISIONS.md`, após a ADR-068 — **sem registro intermediário em `PROPOSTA`** | ✅ |
| 3 | Linha acrescentada ao **índice de supersessões e emendas** (topo do log, ADR-062) | ✅ |
| 4 | Entrada acrescentada no `INDICE_DA_CURADORIA_2_0.md` | ✅ |
| 5 | Commit documental único | ✅ |

**Nenhuma decisão arquitetural foi alterada na lavratura.** O conteúdo dos §4 a
§18 é idêntico ao aprovado em `4e43b74`.

### 19.1 Verbete lavrado em `DECISIONS.md`

```markdown
## ADR-069 — Ciclo de vida das regras de derivação: a versão é fato, o estado é leitura

- **Data:** 2026-08-05
- **Status:** **Aprovada pelo DT-01** em 2026-08-05.
- **Conteúdo normativo:** `docs/curadoria/ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md` (v1.0) — anexo canônico desta ADR.
- **Dependências:** ADR-066 · ADR-067 · ADR-068 · Arquitetura §5.4 e §10.5 · I-7 · MR1.1/MR1.2/MR1.3
- **Contexto:** a verificação independente do Item 2.2A-MR1 encontrou que dois invariantes corretos — append-only por trigger (MR1.1) e uma única VIGENTE por regra (MR1.2) — produzem juntos um estado terminal: uma regra que alcança VIGENTE não pode ser suspensa, revogada nem sucedida. A causa raiz é `state` ter sido modelado como propriedade de uma linha imutável.
- **Decisão:**
  1. **A versão da regra é fato imutável; a transição é ato append-only; o estado vigente é leitura derivada.** É a ADR-066 §5 aplicada ao terceiro objeto da mesma família.
  2. **`derivation_rules.state` deixa de ser fonte de verdade** e permanece como registro imutável do **estado inicial**. Não é removido e **não vira cache** — cache seria segunda fonte de verdade, contra P-07.
  3. **Cinco transições permitidas, lista fechada:** `→PROPOSTA` · `PROPOSTA→VIGENTE` · `PROPOSTA→SUSPENSA` · `VIGENTE→SUSPENSA` · `VIGENTE→REVOGADA` · `SUSPENSA→VIGENTE` · `SUSPENSA→REVOGADA`. **`REVOGADA` é terminal**; **`PROPOSTA→REVOGADA` não existe** (não se revoga o que nunca valeu); nenhuma versão volta a `PROPOSTA`.
  4. **MR1.2 muda de sujeito, não de conteúdo:** de "uma linha VIGENTE por regra" para "uma transição de entrada em VIGENTE sem saída posterior, por regra" — e **a garantia deve permanecer declarativa**, nunca verificação em código de aplicação.
  5. **Toda versão nasce com transição inicial obrigatória para `PROPOSTA`.** Nenhuma nasce vigente.
  6. **Toda transição tem autor, data e motivo.** Entrada em VIGENTE e qualquer entrada em REVOGADA exigem **ADR**. O **Curador do Case** pode suspender como freio de emergência (§5.4 cond. 7), com justificativa de emergência — **e não pode reativar**.
  7. **Ordenação monotônica por versão**, nunca por carimbo de tempo: o estado vigente não pode depender de desempate.
  8. **`derivation_proposals` continua referenciando `(rule_id, version)`**; o estado posterior da versão não altera a proveniência da proposta.
- **Consequência:** MR1.1 e MR1.3 preservados sem exceção; MR1.2 reinterpretado; dois CHECK e um índice tornam-se vacuamente verdadeiros — preservá-los ou removê-los é do implementador. O rollback mestre da Onda 2 e o freio do Curador tornam-se exequíveis. **Esta ADR não autoriza implementação:** o Item 2.2B exige missão própria.
- **Revisitar quando:** a operação real mostrar necessidade de transição hoje proibida — em especial se `PROPOSTA→REVOGADA` se mostrar necessária na prática.
```

### 19.2 Linha para o índice de supersessões

```markdown
| MR1.2 (uma linha VIGENTE por regra, índice parcial) | ADR-069 | reinterpretação — o invariante passa a ser garantido sobre a transição; conteúdo idêntico, sujeito trocado |
```

---

## 20. Estado final

| Item | Situação |
|---|---|
| **Conteúdo** | **completo** — B-1, B-2, B-3 e as cinco decisões adicionais respondidas |
| **Estado** | **APROVADA** |
| **Aprovação DT-01** | **2026-08-05** — integral, sem alteração de conteúdo |
| **Lavratura** | **realizada** — verbete único, sem registro intermediário em `PROPOSTA` (§19) |
| **Código** | **nenhum** |
| **2.2B** | **não iniciada** — depende de autorização formal de abertura pelo DT-01 |

---

*Fim da ADR-069 v1.0. **Estado: APROVADA e lavrada** (DT-01, 2026-08-05).
**Esta ADR não autoriza implementação.** Encaminhamento: **DT-01**, para a
autorização formal de abertura do Item 2.2B.*
