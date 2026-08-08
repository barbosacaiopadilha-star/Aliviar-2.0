# Contrato do Item 1.12 — Mecanismo de Discordância na Fronteira Humana

| Campo | Valor |
|---|---|
| **Versão** | v1.1 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **APROVADO — Guardião da CURADORIA 2.0, 2026-08-08** (`CONTRATO_1_12 APROVADO COM RESSALVA`; ressalva não material, incorporada no §13; pendência do §18 resolvida — Opção 1). Parecer catalogado como **PA-12** no [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md). Nasceu como **PROPOSTA** na base `2d11f81`; lavratura da aprovação no commit registrado no PA-12 |
| **Base** | `cfbcc41` (Item 1.11 formalmente encerrado; pré-voo do 1.12 concluído) |
| **Objeto canônico** | Mecanismo de discordância na Fronteira Humana |
| **Princípio** | **P-10 — "Confirmar não pode ser mais barato que discordar"** (oficial: DP-7, ADR-066, Congelamento §5.2) |
| **Aceite canônico** | **O2 verde — P-10 como contrato testado** |
| **Implementação** | **NÃO AUTORIZADA** por este documento; exige aprovação e missão própria |

---

## 1. Estado e autoridade

Vinculantes: **P-10** (oficial) · **ADR-066** §6 (quem confirma), §7 (quem recusa
e as três decisões), §8 (proposta nunca deixa de existir), §11 (cinco estados,
lista fechada), §14.1 item 2 (o alvo define a autoridade) · **ADR-068** (o ato registra
autor, data e o que estava visível; a confirmação grava **duas** coisas) ·
**Arquitetura §2.4** (nove elementos; ato válido definido negativamente) ·
**Congelamento §5.2** · **CONTRATO_1_8_R1** §18/§21 (C-01, capabilities
nominais) · **CONTRATO_1_11** (anti-ranking, painel agregado, §17.4 do cliente
administrativo) · **AC-BLOCO/§5.4.0/DP-5** (ato por item) · **D-01** (um
escritor por entrada do Motor). A ADR-069 **não governa propostas**; é usada
apenas como padrão arquitetural da casa (ato → estado derivado), onde
compatível.

Nenhuma decisão lavrada é reaberta por este contrato.

## 2. Objeto

Converter P-10 em mecanismo implementável: **o ato humano de decidir uma
proposta** — confirmar ou recusar — com simetria de disponibilidade, gate,
número de interações, proeminência, registro e auditabilidade, **sem** simetria
de efeito no Mapa.

## 3. Não-objetivos

Abrir a Fronteira Humana · apresentar proposta a humano · emitir proposta real ·
superfície de decisão (UI) · alvo do lado profissional (herda o mecanismo quando
`2.C`/ADR-068 o abrirem) · regime de bloco (proibido — DP-5/AC-BLOCO) · alterar
o painel 1.11 · ranking · mérito.

## 4. Definições

| Termo | Definição |
|---|---|
| **Proposta** | linha de `derivation_proposals` (ADR-066 §14, doze itens, imutável na emissão) |
| **Ato decisório** | o ato humano único que decide uma proposta: `CONFIRMACAO` ou `RECUSA` |
| **Decisor** | quem tem autoridade sobre o campo alvo (ADR-066 §6) — para o alvo Case: **o Curador responsável pelo Case** |
| **Decidível** | proposta em `state = 'PROPOSTA'` cuja origem está vigente (condições 5 e 6 do ato válido) |
| **Efeito** | o que o ato produz além do próprio registro: declaração no Mapa (confirmação) ou nada (recusa) |

## 5. P-10 operacional — a simetria, dimensão a dimensão

| Dimensão | Regra | Fonte |
|---|---|---|
| Disponibilidade | quem pode confirmar pode recusar; ninguém recusa o que não poderia confirmar | ADR-066 §7 |
| Gate humano | as mesmas seis condições de validade, para os dois atos | ADR-066 §6 |
| Número de interações | idêntico | O2 · §2.4 el. 5 |
| Proeminência | idêntica na superfície (quando ela nascer) | ADR-066 §7.1 |
| Registro do ato | mesmo tipo de registro, mesma entidade, mesmos campos | ADR-068 |
| Auditabilidade | idêntica — autor, data, o que estava visível | ADR-068 |
| Justificativa | motivo **oferecido, nunca exigido** — nos **dois** atos (§18) | ADR-066 §7.2 |
| **Efeito no Mapa** | **assimétrico por decisão lavrada**: confirmar declara; recusar produz **lacuna** | ADR-066 §7.3 |

## 6. Fronteira Humana

O mecanismo deste contrato é **a metade transacional** da Fronteira (elementos
5–9 do §2.4): o ato equivalente, a autoria, a data, o registro do desfecho e o
bloqueio de avanço sem ato válido. A metade **expositiva** (elementos 1–4,
exibir declaração/proposta/origem/versão) já é servida pela Ficha (Item 1.8) e
**não ganha superfície aqui** (§20).

## 7. Atores e gates

**Alvo Case (importância)** — único alvo com emissor existente: o decisor é o
**Curador responsável pelo Case**. O gate é verificado **dentro da capability**
(padrão `acknowledge_case_need`): ator = `auth.uid()`, autenticado, com
`is_curator_for_case(case_id)` — nunca só na superfície. Papel
`administrador` **não** decide por atalho: autoridade sobre o campo é a do §6 da
ADR-066, não a do papel técnico.

**Alvo profissional** — sem emissor, sem propostas possíveis: **fora de escopo**;
quando nascer, herda este mecanismo com o gate da ADR-068.

As seis condições do ato válido (ADR-066 §6) valem **cumulativamente e para os
dois atos**; a falta de qualquer uma torna o ato **inexistente**.

## 8. Semântica de confirmação

Grava **duas coisas, na mesma transação** (ADR-068 §16):

1. **o ato humano** — autor, data, proposta referenciada, atestado do visível;
2. **a declaração no Mapa** (`case_priority_map`), com o valor sugerido,
   `declared_by` = o confirmador.

> *"A confirmação não move a proposta para dentro do Mapa. Ela cria uma
> declaração nova, que por acaso coincide com o que foi proposto."* (ADR-066 §6)

## 9. Semântica de recusa

Grava: **o ato humano** + o desfecho `RECUSADA` + **nada no Mapa**. O campo
volta a **lacuna** — nunca ao valor proposto, nunca a valor anterior. Recusar
**não obriga** declaração subsequente; declaração posterior é ato próprio e
independente. A proposta recusada **permanece para sempre** (ADR-066 §8).

## 10. Persistência do ato — a decisão central

**Comparação exigida:**

| Critério | A — colunas na proposta | **B — tabela append-only de atos** | C — outra |
|---|---|---|---|
| Auditabilidade | ato diluído no oferecimento | **ato é entidade própria** | — |
| Imutabilidade | exige UPDATE em registro "imutável na emissão" | **INSERT-only; UPDATE/DELETE recusados por trigger** | — |
| Histórico | um ato só, sem trilha de tentativas | trilha natural | — |
| Concorrência | UPDATE condicional | **índice único: um ato decisório por proposta** | — |
| Separação conceitual | mistura sistema (oferecimento) e humano (ato) | **ADR-068 §33: a autoria é inteiramente de quem decidiu** | — |
| Aderência à casa | — | `practice_evidence` · transições da 2.2B · PP-03C | — |

> **Cláusula normativa: Opção B.** Nasce a entidade
> **`curadoria.derivation_proposal_acts`** — append-only, imposto por trigger —
> com, no mínimo: identidade · `proposal_id` (FK `RESTRICT` para a proposta) ·
> **natureza** (`CONFIRMACAO` | `RECUSA`, lista fechada) · **ator** (not null) ·
> **data do ato** (not null) · **atestado do visível** (§19) · **motivo**
> (nullable, §18). RLS ligada, **zero policy, zero grant**: a única porta é a
> capability (§14).

**O `state` da proposta não é reaberto** (ADR-066 §11 permanece): ele passa a
ser **projeção do ato**, atualizada **na mesma transação, por trigger disparado
pelo INSERT do ato** — e uma guarda prova que `state` decisório
(`CONFIRMADA`/`RECUSADA`) **nunca muda por outro caminho**. Uma origem por fato
(P-07): o **ato** é a origem; `state` é leitura materializada dele.

## 11. Estados e transições

| Pergunta | Cláusula |
|---|---|
| Precondição do ato | `state = 'PROPOSTA'` **e** origem vigente (condições 5 e 6), verificadas **na transação do ato** |
| Confirmação | `PROPOSTA → CONFIRMADA` + declaração no Mapa |
| Recusa | `PROPOSTA → RECUSADA` |
| Terminais para ato humano | `CONFIRMADA` · `RECUSADA` · `SUPERADA` · `RETIRADA` — **nenhum novo ato sobre elas** |
| `SUPERADA`/`RETIRADA` | transições **sistêmicas** (S1/S2/S5, ADR-066 §9) — **não são atos deste contrato** e não passam pela tabela de atos |
| Proposta decidida recebe novo ato? | **NÃO** — arbitragem declarativa (§13) |
| Fonte de verdade | o **ato** (append-only); `state` é projeção transacionalmente síncrona |

## 12. Idempotência

| Cenário | Desfecho nomeado |
|---|---|
| Primeiro ato válido | `ATO_REGISTRADO` |
| Repetição da **mesma intenção pelo mesmo ator** (duplo clique, retry de cliente/RPC) sobre proposta já decidida **naquele mesmo sentido** | **`ATO_JA_REGISTRADO`** — sucesso idempotente; **nada é gravado** |
| Intenção **contrária**, ou **outro ator**, sobre proposta já decidida | **`ATO_JA_CONSUMADO`** — conflito de domínio; nada é gravado |
| Repetição sobre `SUPERADA`/`RETIRADA` | `PROPOSTA_NAO_DECIDIVEL` |

Nada disso é deixado à implementação: os quatro desfechos são contrato.

## 13. Concorrência

**O árbitro é declarativo: índice único sobre os atos — no máximo UM ato
decisório por proposta** — combinado com a verificação transacional da
precondição sobre a linha da proposta.

| Cenário | Resultado |
|---|---|
| confirmar × recusar simultâneos | o primeiro INSERT vence; o segundo cai no índice e é traduzido para `ATO_JA_CONSUMADO` |
| dois confirmadores concorrentes (**outro** ator, mesmo sentido) | o primeiro vence; o segundo recebe **`ATO_JA_CONSUMADO`** *(ressalva do Guardião, 2026-08-08)* |
| dois recusadores concorrentes (**outro** ator, mesmo sentido) | **`ATO_JA_CONSUMADO`** — mesma regra |
| decisão durante supersessão (S1) | a condição 6 é reavaliada na transação; se a origem deixou de estar vigente, `PROPOSTA_NAO_DECIDIVEL` |
| retry concorrente | resolvido pelas linhas acima — determinístico, sem lock inventado |

> **Regra vinculante (ressalva do Guardião, alinhando este §13 ao §12):**
> `ATO_JA_REGISTRADO` é **exclusivo** de *mesmo ator + mesma intenção*.
> **Qualquer outro ator recebe `ATO_JA_CONSUMADO` — inclusive quando tenta o
> mesmo sentido.** A autoria do primeiro ato prevalece, e o segundo ator nunca
> recebe resposta que possa fazê-lo acreditar que registrou pessoalmente um ato
> cujo autor real é outro.
>
> | Combinação | Desfecho |
> |---|---|
> | mesmo ator + mesma intenção | `ATO_JA_REGISTRADO` |
> | mesmo ator + intenção contrária | `ATO_JA_CONSUMADO` |
> | outro ator + mesma intenção | `ATO_JA_CONSUMADO` |
> | outro ator + intenção contrária | `ATO_JA_CONSUMADO` |

## 14. Capability e writer

> **Uma capability única para os dois atos — a simetria começa aqui.**

| Item | Cláusula |
|---|---|
| Nome lógico | **`curadoria.decidir_proposta(p_proposal_id uuid, p_natureza text, p_motivo text default null)`** — verbo-primeiro, como as demais |
| Uma ou duas? | **UMA.** Capabilities separadas poderiam divergir em gate, validação ou registro — a assimetria nasceria no banco. A natureza é parâmetro de lista fechada |
| Regime | `SECURITY DEFINER` · `search_path` fixo · referências qualificadas · zero SQL dinâmico · **gate interno**: ator = `auth.uid()`, `is_curator_for_case` (padrão `acknowledge_case_need`) |
| Quem invoca | **o cliente autenticado do Curador** — nunca o cliente administrativo; a autoria é verdadeira, não impersonada |
| O que escreve | o ato (`derivation_proposal_acts`) · a projeção `state` (via trigger) · **na confirmação**, a declaração em `case_priority_map` |
| Escrita direta às tabelas | **permanece proibida** — RLS sem policy em atos e propostas; C-01 intacta (nenhum `src/` conhece as tabelas) |
| Saída mínima | um desfecho nomeado (§12/§21) — nenhum conteúdo de proposta, nenhum dado de terceiro |
| **C-01d** | evolui **por lavratura, aqui**: o conjunto de funções que alcançam `derivation_proposals` passa a `{emissor · leitora individual · leitora agregada · decisora}` — um quinto nome derruba a guarda |
| **D-01** | evolui **por lavratura, aqui**: os escritores de `case_priority_map` passam a `{mapa-prioridades-repository (declaração manual) · decidir_proposta (declaração por confirmação)}` — ambos nominais, ambos auditados; um terceiro derruba |

## 15. Relação com o Mapa

**Atomicidade obrigatória:** ato + projeção + (na confirmação) declaração no
Mapa acontecem **na mesma transação**. Falha em qualquer parte = **rollback
total** — não existe estado intermediário "ato sem efeito" nem "efeito sem
ato"; o catálogo de erros (§21) não contém "falha parcial" porque a transação a
torna impossível.

A declaração criada pela confirmação tem `declared_by` = o confirmador e passa
pelo **mesmo trigger de validação** do caminho manual (subcritério ativo etc.) —
divergência de validações entre os dois escritores é defeito, e há guarda (§22).

## 16. Relação com o painel 1.11

O painel **não muda** — nenhuma exceção necessária. Ele conta por `state`;
quando um ato válido produzir `RECUSADA`, a contagem aparece sozinha. Permanecem:
agregado-somente, anti-ranking, nenhuma linha individual, ausência de motivo
registrada como dado (a natureza sem motivo é contável).

## 17. Privacidade

O **ato individual** existe para a Fronteira e para a **projeção de Auditoria**
(§11.6 da Arquitetura) — com autor e data; é a auditabilidade exigida, não
vazamento. O painel segue agregado. O motivo **nunca** vira score, mérito ou
eixo de ranking. A capability devolve saída mínima. O cliente administrativo
não participa do fluxo (§14). Célula pequena: vale a condição registrada no
CONTRATO_1_11 §9.3 (sair da Mesa exige decisão de supressão antes).

## 18. Motivo

Opcional **nos dois atos** (a simetria também aqui — a autoridade só o exige
opcional na recusa; estendê-lo à confirmação custa zero e impede a assimetria
inversa) · **nunca obrigatório** — exigi-lo é violar P-10 pela porta dos fundos ·
ausência é dado válido e observável · texto curto (mesma família dos campos de
280 do domínio), sem formato imposto · não alimenta ranking.

> **MOTIVO DA RECUSA — VISIBILIDADE MÍNIMA SEGURA** *(pendência resolvida pela
> autoridade — Guardião da CURADORIA 2.0, 2026-08-08, **Opção 1**)*:
>
> **O motivo da recusa é legível somente na projeção de Auditoria.** Qualquer
> exposição adicional exige nova lavratura específica que declare:
> **destinatário · superfície · contexto · finalidade · restrições.**

## 19. "O que estava visível" — atestado, não fotografia

A proposta é **imutável na emissão** e contém, por construção, tudo o que os
elementos 1–4 da Fronteira exibem (declaração original via `origin_*`, valor,
origem, regra e versão, catálogo). Logo:

> **Cláusula:** o registro do visível é o **par**: (a) a **referência imutável**
> `proposal_id` — que fixa integralmente o que foi exibido —; (b) o **atestado
> transacional da condição 6** — a origem estava vigente no instante do ato,
> verificada na mesma transação. **Nenhum snapshot duplicado**: duplicar o que a
> proposta já garante seria segunda origem para o mesmo fato (P-07).

Se um dia a Fronteira exibir conteúdo **fora** da proposta, esse conteúdo terá
de entrar no atestado — por emenda deste contrato.

## 20. O que nasce ligado na Onda 1B — e o que fica desligado

A Onda 1B proíbe: *nenhuma proposta persistida (real), nenhuma proposta
apresentada a humano*. Portanto:

| Nasce agora | Permanece desligado |
|---|---|
| a entidade dos atos (append-only, inerte: RLS sem policy, zero grant) | **qualquer grant de `EXECUTE` na capability** — ela nasce **sem** grant a `authenticated`; conceder é ato da **abertura da Fronteira**, pacote futuro com lavratura própria |
| a capability `decidir_proposta`, completa e testada por integração (fixtures em transação com rollback, padrão 2.2C) | **toda superfície** — nenhuma UI de decisão nasce |
| o trigger de projeção do `state` | apresentação de propostas a humanos |
| guardas e oráculos (§22, §23) | emissão real de propostas |
| a evolução lavrada de C-01d e D-01 | o alvo do lado profissional |

**Consequência honesta sobre O2 (§20 e §23):** O2-C/D/E ficam **verdes no
1.12** (são propriedades da capability e do registro). **O2-A/B são oráculos da
superfície** — que não nasce aqui. Eles ficam **lavrados como aceite obrigatório
do pacote que abrir a Fronteira**, e uma guarda estrutural garante, até lá, que
**nenhuma superfície de decisão exista** — nascer só o botão de confirmar seria
exatamente a assimetria que P-10 proíbe.

## 21. Erros normativos — catálogo fechado

| Erro | Semântica de domínio |
|---|---|
| `PROPOSTA_INEXISTENTE` | o id não referencia proposta |
| `PROPOSTA_NAO_DECIDIVEL` | estado ≠ `PROPOSTA`, ou origem não vigente (condição 6) |
| `ATO_JA_REGISTRADO` | sucesso idempotente — mesma intenção, mesmo ator, já consumada |
| `ATO_JA_CONSUMADO` | conflito — a proposta já foi decidida em outro sentido ou por outrem |
| `SEM_AUTORIDADE` | ator não é o decisor do alvo (gate interno) |
| `NATUREZA_INVALIDA` | fora da lista fechada |
| `MOTIVO_INVALIDO` | excede o formato — nunca "motivo ausente": ausência é válida |
| — | **"falha parcial" não existe**: a transação é atômica (§15) |

## 22. Guardas

| Guarda | Prova |
|---|---|
| G-1 | nenhuma escrita direta: atos e propostas sem policy/grant; `state` decisório só muda pelo trigger do ato |
| G-2 | capability **única** — não existem `confirmar_*`/`recusar_*` separadas |
| G-3 | motivo opcional — a assinatura não o exige; teste de que ato sem motivo é válido |
| G-4 | anti-ranking do motivo e do ato — nenhum eixo por profissional; painel intacto |
| G-5 | **nenhuma superfície de decisão existe na Onda 1B** — varredura de `app/`/`components/` |
| G-6 | C-01d fechada em **quatro** funções; D-01 fechada em **dois** escritores do Mapa |
| G-7 | validações do Mapa idênticas nos dois caminhos de escrita |
| G-8 | append-only dos atos — UPDATE/DELETE recusados |

## 23. Falseabilidade — mutações obrigatórias

Cada uma deve derrubar guarda ou teste: exigir motivo só na recusa · capability
separada para recusa · clique/ato extra só para discordar (quando houver
superfície: O2-A) · esconder a recusa (O2-B) · ator que confirma mas não recusa ·
`RECUSADA` sem linha de ato · valor no Mapa após recusa · segundo ato sobre
decidida · recusa alimentando ranking · UPDATE em ato · grant concedido à
capability nesta onda · superfície de decisão nascendo antes da abertura.

## 24. Rollback

Tudo aditivo: `drop` da tabela de atos, da capability e do trigger de projeção;
reversão das guardas por `git revert`. **Nesta onda nenhum ato humano real pode
existir** (zero grants, zero propostas reais) — o rollback não apaga fato humano.
Registrado: a partir da abertura da Fronteira, rollback **nunca** apaga atos
reais (I-7; mesmo regime da proveniência).

## 25. Critérios de aceite do Item 1.12

| # | Critério |
|---|---|
| 1 | Entidade de atos append-only existe, inerte, com FK e lista fechada de naturezas |
| 2 | Capability única, gate interno, desfechos nomeados do §12/§21 — todos alcançáveis por teste |
| 3 | Confirmação grava ato + declaração no Mapa **atomicamente**; recusa grava ato + `RECUSADA` + **nada no Mapa** |
| 4 | `state` decisório muda **só** pelo trigger do ato |
| 5 | Idempotência e concorrência provadas (duplo clique, corrida confirmar×recusar, corrida de iguais) |
| 6 | Condições 5 e 6 verificadas na transação; `SUPERADA` não decidível |
| 7 | **O2-C/D/E verdes**; O2-A/B lavrados para a abertura, com G-5 verde |
| 8 | Motivo opcional provado; ausência contável |
| 9 | C-01/C-01b/C-01c/**C-01d(4)**/D-01(2) verdes |
| 10 | Painel 1.11 **inalterado** e contando `RECUSADA` de fixture |
| 11 | Zero grants na capability; zero superfície; zero proposta real |
| 12 | Rollback limpo; regressão integral verde |

## 26. Fora de escopo

Abertura da Fronteira (grants + superfície + O2-A/B ao vivo) · lado profissional ·
`2.C` · regime de bloco (DP-5) · exposição do motivo além da Auditoria (§18) ·
mudanças no painel · emissor · qualquer regra real.

## 27. Autoridade para implementação

Este documento está **APROVADO** (Guardião da CURADORIA 2.0, 2026-08-08 —
parecer PA-12). A aprovação **não autoriza implementação**: ela exige **missão
própria e explícita** ao agente implementador. Nenhuma parte deste texto, por si,
autoriza código, migration, grant ou superfície.

## 28. Encaminhamento

Aprovado com a ressalva do §13 incorporada e a pendência do §18 **resolvida pela
autoridade (Opção 1)** — nenhuma pendência normativa remanescente. O caminho é:
implementação do mecanismo inerte (§20), mediante missão própria → verificação →
o pacote futuro da **abertura da Fronteira** herda O2-A/B como aceite.
