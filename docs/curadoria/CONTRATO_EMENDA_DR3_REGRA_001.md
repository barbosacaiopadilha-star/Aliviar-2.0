# Contrato da Emenda DR3 — conectar a Regra 001 `VIGENTE` ao emissor profissional

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Base** | `08a6d6d` |
| **Objeto** | a **emenda própria** que o DR3 do `CONTRATO_2_C` previu em texto |
| **Alvo** | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA` v1, `VIGENTE`, `PROVISÓRIA` |
| **Status** | **especificação — implementação PROIBIDA nesta missão** |

> **A semântica da Regra 001 não é objeto desta missão.** A ficha
> [`REGRA_001_CONTINUIDADE_COORDENACAO.md`](REGRA_001_CONTINUIDADE_COORDENACAO.md)
> v2.0 e a [`ADR-070`](ADR_070_APROVACAO_DA_REGRA_001.md) permanecem as
> autoridades. Esta emenda **executa** o que elas decidiram; não redecide nada.

---

## 1. O achado que reorganiza a missão

A promoção da Regra 001 disparou o trigger `ocupa_conceitos_da_versao`. Ele faz:

```sql
for conceito in
  select distinct m.subcriterion_code
  from curadoria.derivation_rule_degree_map m        -- ← Case-side
  where m.rule_id = new.rule_id and m.rule_version = new.rule_version
```

A Regra 001 é **profissional-side** e tem **zero linhas** ali — CD-1 proíbe
criá-las. O laço percorreu **zero conceitos**.

> ### A Regra 001 está `VIGENTE` e **não ocupa conceito nenhum**.
>
> `derivation_concept_vigencia` **não tem linha** para
> `CONTINUIDADE_COORDENACAO`.

Isso não é defeito da promoção — ela fez exatamente o que o regime manda. É a
**medida exata da lacuna**: hoje, a única estrutura que declara *"esta regra
governa este conceito"* é Case-side, e a Regra 001 não pode usá-la.

**Consequência que precisa ser dita:** o invariante *"no máximo uma regra
vigente por conceito"* (ADR-066 §16, condição 8) **está aberto no lado
profissional**. Se uma segunda regra profissional fosse promovida sobre
`CONTINUIDADE_COORDENACAO` hoje, **nada colidiria**. A emenda fecha isso.

## 2. Recorte exato do DR3 — lido na fonte, HEAD `08a6d6d`

**Função:** `curadoria.emitir_proposta_de_estado(_professional_profile_id uuid,
_subcriterion_code text, _actor_id uuid) returns text` · `language plpgsql` ·
**`SECURITY INVOKER`** · `set search_path = curadoria, pg_temp` · **zero grants**.

| Etapa | O que faz | Desfecho |
|---|---|---|
| entrada | três argumentos não nulos | `ENTRADA_INVALIDA` |
| DR1 | conceito existe e está ativo | `CONCEITO_INEXISTENTE` |
| DR1 | `cruzamento = 'automatico'` **e** `motor_participation <> 'NUNCA'` | `CONCEITO_SEM_PONTE` |
| DR2 | evidência corrente do par = `max(version)` de `practice_evidence` | `SEM_EVIDENCIA` |
| DR2 | `evidencia.catalog_version = conceito.catalog_version` | `CATALOGO_DIVERGENTE` |
| — | declaração manual prevalece | `DECLARACAO_MANUAL_VIGENTE` |
| **DR3** | **`candidatas := 0;`** — literal, sem consulta | **`SEM_REGRA_VIGENTE`** |
| braço de emissão | `raise exception` — **inalcançável por construção** | — |

**Onde `candidatas := 0` nasce:** é uma atribuição literal, precedida do
comentário que **autoriza esta emenda em texto**: *"quando a lavratura da forma
acontecer, é ELA que pluga a consulta aqui (emenda própria, nunca edição
silenciosa)"*.

**Onde a consulta entra:** exatamente no lugar de `candidatas := 0`.

**Guardas que protegem o escritor:** `SECURITY INVOKER` · `search_path` fixo ·
zero grants nos três papéis · índice único
`derivation_proposals_uma_por_alvo_profissional (professional_profile_id,
subcriterion_code, rule_id, rule_version) where professional_profile_id is not
null` · `derivation_proposals_alvo_unico` (Case **ou** profissional, nunca os
dois) · append-only em `practice_evidence`.

## 3. A lacuna verdadeira — §21 respondido sem eufemismo

A Regra 001 possui hoje: **identidade** (`rule_id`), **versão**, **ciclo**
(transições), **rationale**, **evidence**, **estado derivado**.

**Não possui:**

| Falta | Consequência |
|---|---|
| **declaração de qual conceito governa** | não há campo, nem tabela, nem FK. `rule_id` é `text` **sem restrição de formato**, e §8 desta missão proíbe inferir pelo texto |
| **representação executável da semântica** | as oito classes da ficha §15.1 **não existem em lugar algum que uma máquina leia** |

> **`rule_id` não contém a lógica, e não vamos fingir que contém.** A Regra 001
> é hoje um **registro de governança sem corpo executável**. Essa é a lacuna, e
> preenchê-la **é** a emenda.

**Precedente que dá a forma:** no lado Case, `derivation_rule_degree_map` faz as
**duas** coisas numa tabela só — declara a cobertura (`subcriterion_code`) e
carrega a correspondência (`degree → importance`), por `(rule_id, rule_version)`.
É a doutrina da ADR-066: **correspondência versionada, por regra, versão e
conceito.** O lado profissional deve espelhar a **forma**, nunca a tabela.

## 4. §20 — onde vive a lógica executável

Existem **dois** pontos que anteciparam esta emenda em texto. Confrontá-los é
obrigatório antes de escolher.

| Candidato | Texto que o antecipa | Veredito |
|---|---|---|
| **SQL — DR3 do emissor 2.C** | *"é ELA que pluga a consulta aqui (emenda própria…)"* | ✅ **escolhido** |
| **TypeScript — `derivarMapaDoProfissional` (1.A)** | *"é exatamente aqui que a emenda do §10 ativará… o caminho coberto-por-regra"* — e o contrato **já tem o slot** `regras?: readonly RegraResolvida[]` | ❌ **recusado** |

**Por que o 1.A é recusado, apesar de convidar:**

1. **Seu critério de aceite é ter zero chamadores** (A1 do `CONTRATO_1_A`,
   *"verificável"*). Dar-lhe chamadores **reabre um item formalmente
   encerrado**.
2. **O emissor é o único escritor** de proposta profissional, e já foi lavrado
   como tal (PA-17). Derivar em TS e persistir em SQL criaria **duas origens
   para o mesmo fato** — violação direta de **P-07**.
3. A avaliação precisa da evidência corrente, da versão do catálogo e do estado
   derivado da regra — **tudo já está no emissor**, em uma transação.

> **Decisão: a semântica vive como DADO; o avaliador vive em SQL, dentro do
> único escritor já lavrado.** Não é conveniência — é o que a arquitetura
> vigente faz no lado Case, e o único caminho que não reabre item encerrado nem
> duplica origem.

**Consequência honesta, não bloqueante:** o braço `NAO_SUPORTADO` do 1.A devolve
o motivo `SEM_REGRA_APROVADA`, que **deixa de ser verdade** quando a cobertura
existir. Como a função tem **zero chamadores**, ela não afirma nada sobre o
mundo — é contrato puro. **Remédio de uma linha:** registrar na ficha do 1.A que
o executável vive no emissor e que o braço é **declaração de contrato, não
espelho do banco**. Não tocar no código.

## 5. A estrutura nova — `derivation_rule_option_semantics`

Nome proposto. Espelha a **forma** de `derivation_rule_degree_map`, **não** a
reutiliza. `derivation_rule_degree_map` **permanece vazio**; CD-1 intacta.

| Coluna | Tipo | Papel |
|---|---|---|
| `rule_id` | `text` | parte da FK para `derivation_rules (rule_id, version)`, `on update/delete restrict` |
| `rule_version` | `integer` | idem |
| `subcriterion_code` | `text` | **a declaração de cobertura** — FK para `method_subcriteria (code)`, `restrict` |
| `option_value` | `text` | opção canônica do lado **profissional** do conceito |
| `papel` | `text` | `check (papel in ('POSITIVA_DIRETA','NEGATIVA_EXPLICITA','INSUFICIENTE'))` |
| `created_at` | `timestamptz` | `default now()` |

**PK:** `(rule_id, rule_version, subcriterion_code, option_value)` — uma opção,
um papel, por versão. **Append-only** pelo mesmo `recusa_alteracao_de_regra()`
já usado nas outras três tabelas do regime.

**Conteúdo da Regra 001 — transcrito da ficha v2.0, zero reinterpretação:**

| `option_value` | `papel` |
|---|---|
| `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` | `POSITIVA_DIRETA` |
| `ENVIA_RELATORIO_ESCRITO` | `POSITIVA_DIRETA` |
| `PARTICIPA_DE_DISCUSSAO_DE_CASO` | `POSITIVA_DIRETA` |
| `ATUA_DE_FORMA_INDEPENDENTE` | `NEGATIVA_EXPLICITA` |
| `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` | `INSUFICIENTE` |

**Guarda de cobertura total (trigger deferido), espelhando a do lado Case:** a
versão só pode vigorar cobrindo **todas** as opções ativas do conceito naquela
`catalog_version`. Opção sem papel declarado seria semântica implícita — o
oposto do que a ficha §15.1 provou.

> **Por que dados e não código:** a classificação já está aprovada; o avaliador
> é o **mesmo** para qualquer regra desta natureza; e o §19 proíbe
> `if (concept === 'CONTINUIDADE_COORDENACAO')` como estrutura permanente. Com
> papéis em tabela, o avaliador nunca menciona conceito nem opção.

## 6. Fechar o buraco da ocupação

Duas portas existem no lado Case; **as duas precisam de espelho profissional**,
e a segunda é a que resolve o caso concreto (a Regra 001 **já** está `VIGENTE`,
então a cobertura nascerá depois da promoção — cenário que o próprio código
previu).

| Porta | Gatilho | O que a emenda faz |
|---|---|---|
| **1** | `after insert on derivation_rule_transitions`, `to_state = 'VIGENTE'` | `ocupa_conceitos_da_versao()` passa a percorrer **também** os `subcriterion_code` distintos de `derivation_rule_option_semantics`. Recusa **atômica** preservada |
| **2** | `after insert on derivation_rule_option_semantics` | espelho de `ocupa_conceito_por_correspondencia()`: se a versão **já** vigora, a cobertura nova ocupa o conceito agora; se ele já tem dona, a cobertura é **recusada** e as existentes ficam intactas |

**Isto cumpre a ADR-066 §16 condição 8 — não a emenda.** O texto da condição diz
*"regra"*, sem qualificar lado; só a **implementação** era Case-side, porque só
existia cobertura Case-side. **Nenhuma ADR nova é necessária.**

**Efeito no caso real:** ao inserir as cinco linhas da Regra 001, a porta 2
dispara, `proxima_ocupacao_do_conceito('CONTINUIDADE_COORDENACAO')` devolve
**1**, e o conceito passa a ser ocupado pela regra — fechando o buraco do §1.

## 7. A consulta da regra no DR3

Substitui `candidatas := 0`. Requisitos do §7 da missão, um a um:

```sql
-- DR3 · a regra material VIGENTE que cobre ESTE conceito, no lado profissional.
select s.rule_id, s.rule_version
  into regra
from curadoria.derivation_rule_option_semantics s
where s.subcriterion_code = _subcriterion_code
  and curadoria.derivation_rule_state(s.rule_id, s.rule_version) = 'VIGENTE'
group by s.rule_id, s.rule_version;
-- 0 linhas  → SEM_REGRA_VIGENTE
-- 1 linha   → segue
-- 2+ linhas → impossível: a PK de derivation_concept_vigencia arbitra (§6)
```

| Requisito | Como é cumprido |
|---|---|
| conceito exato | `s.subcriterion_code = _subcriterion_code`, por código canônico |
| estado derivado `VIGENTE` | **`derivation_rule_state()`** — nunca `derivation_rules.state` |
| versão corrente exata | a versão vem da linha de cobertura; **não** de `max(version)` |
| profissional-side | a tabela é profissional; `degree_map` não é consultado |
| sem dependência de Case | nenhuma referência a `case_id`, `case_needs`, grau ou importância |
| proveniência exata | `rule_id` e `rule_version` seguem para a proposta |
| sem fallback silencioso | zero linhas ⇒ desfecho nomeado, nunca "tenta outra" |
| suspensão/revogação | `derivation_rule_state()` é lido **a cada chamada** — nada é cacheado (§17) |
| version-safe | uma v2 vigente traz sua própria linha de cobertura; a v1 sai ao deixar `VIGENTE` (§18) |

## 8. O avaliador — genérico, uma proposta por evidência

Recebe o `options text[]` da evidência corrente e os papéis da regra. **Uma
evidência → uma avaliação → no máximo uma proposta** (§10 da missão).

| Ordem | Condição | Resultado |
|---|---|---|
| 1 | alguma opção **fora** das canônicas ativas do conceito | `EVIDENCIA_INCOMPATIVEL` |
| 2 | `options` vazio | `EVIDENCIA_INSUFICIENTE` |
| 3 | há `POSITIVA_DIRETA` **e** `NEGATIVA_EXPLICITA` | **`EVIDENCIA_CONTRADITORIA`** |
| 4 | há `POSITIVA_DIRETA` | proposta **`CONFIRMADO`** |
| 5 | há `NEGATIVA_EXPLICITA` | proposta **`NAO_CONFIRMADO`** |
| 6 | só `INSUFICIENTE` | `EVIDENCIA_INSUFICIENTE` |

**A ordem é normativa** — é a matriz de oito classes da ficha §15.1, e a regra 3
**precede** a 4 porque contradição não vira afirmação. O avaliador **não
menciona** conceito nem valor de opção: lê papéis. `NAO_INFORMADO` **não é
produzível** — nenhum papel o gera (§9 da missão).

## 9. Três desfechos novos — a lacuna do writer, nomeada

O emissor tem hoje sete desfechos; **nenhum** cobre contradição, incompatibilidade
ou insuficiência. A ficha v2.0 os nomeia, o emissor não os conhece.

**A emenda deve acrescentar exatamente três**, e nenhum a mais:

`EVIDENCIA_CONTRADITORIA` · `EVIDENCIA_INCOMPATIVEL` · `EVIDENCIA_INSUFICIENTE`

Todos são **não emissão explícita**, jamais erro silencioso — o padrão que o
comentário do emissor já declara: *"devolve sempre um desfecho nomeado"*.

## 10. Proveniência — ponteiro, nunca reconstrução

O `insert` em `derivation_proposals`, espelhando o lado Case:

| Coluna | Valor |
|---|---|
| `professional_profile_id` | `_professional_profile_id` (`case_id` **nulo** — `alvo_unico`) |
| `subcriterion_code` | `_subcriterion_code` |
| `target_field` | **`'status'`** — como o DR3 já declarava |
| `suggested_value` | `CONFIRMADO` \| `NAO_CONFIRMADO` |
| `origin_record` | **`'practice_evidence:' \|\| evidencia.id`** — ponteiro exato |
| `origin_version` | `evidencia.version` |
| `origin_declared_at` | `evidencia.collected_at` |
| `origin_author` | `evidencia.collected_by` |
| `rule_id` / `rule_version` | os da regra vigente localizada |
| `catalog_version` | `conceito.catalog_version` (já conferida contra a evidência) |
| `consequence_degree` | **`'ESTRUTURAL'`** — precedente vigente do lado Case; ver §13 |
| `state` | `'PROPOSTA'` |
| `emitted_at` | `default now()` |

**Idempotência:** `on conflict (professional_profile_id, subcriterion_code,
rule_id, rule_version) where professional_profile_id is not null do nothing` →
`JA_EMITIDA`; caso contrário `EMITIDA`. Espelho exato do lado Case.

**I-5 preservado:** o `status` de verificação **não** é copiado para a proposta
nem influencia `suggested_value`. Ele é alcançável pelo ponteiro
`practice_evidence:<id>` — **acompanha, não contamina** (§14 da missão).

## 11. Invariantes e guardas permanentes

| # | Guarda | Como se prova |
|---|---|---|
| 1 | emissor não hardcodeia estado por conceito | teste de mutação: nenhum literal de conceito ou de opção no avaliador |
| 2 | só regra `VIGENTE` é consumida | a consulta filtra por `derivation_rule_state()` |
| 3 | estado vem da função derivada | zero ocorrências de `derivation_rules.state` no emissor |
| 4 | versão exata preservada | `rule_version` da cobertura → proposta, sem `max()` |
| 5 | ausência não gera negativo | classes 2 e 6 do avaliador; `SEM_EVIDENCIA` antes de tudo |
| 6 | **CD-1 não é tocada** | `derivation_rule_degree_map` continua com **zero linhas**; nenhuma consulta a ele no caminho profissional |
| 7 | `satisfied_by` não entra | zero ocorrências no emissor e na tabela nova |
| 8 | sem regra vigente ⇒ zero proposta | `SEM_REGRA_VIGENTE` |
| 9 | suspensa/revogada ⇒ zero proposta | a leitura do estado é por chamada; nada cacheado |
| 10 | proveniência aponta para regra e evidência exatas | `origin_record` = `practice_evidence:<id>` + `rule_id`/`rule_version` |
| 11 | **uma regra vigente por conceito** | portas 1 e 2 profissionais + PK de `derivation_concept_vigencia` |
| 12 | cobertura total de opções | trigger deferido: versão não vigora com opção sem papel |
| 13 | nenhum grant novo | a tabela nova nasce **inerte**: RLS ligada, zero policies, zero grants |

## 12. Testes obrigatórios

| Caso | Entrada | Esperado |
|---|---|---|
| **A** | `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` | proposta `CONFIRMADO` |
| **B** | `ATUA_DE_FORMA_INDEPENDENTE` | proposta `NAO_CONFIRMADO` |
| **C** | `ORIENTA…` isolada | zero proposta · `EVIDENCIA_INSUFICIENTE` |
| **D** | `ORIENTA…` + positiva | `CONFIRMADO` — **uma só** |
| **E** | `ORIENTA…` + negativa | `NAO_CONFIRMADO` |
| **F** | positiva + negativa | zero proposta · `EVIDENCIA_CONTRADITORIA` |
| **G** | sem `practice_evidence` | `SEM_EVIDENCIA` |
| **H** | sem regra vigente para o conceito | `SEM_REGRA_VIGENTE` |
| **I** | regra `SUSPENSA` | zero proposta |
| **J** | regra `REVOGADA` | zero proposta |
| **K** | evidência `nao_verificado` | proposta emitida; `status` rastreável pelo ponteiro, **fora** de `suggested_value` |
| **L** | opção fora das canônicas | zero proposta · `EVIDENCIA_INCOMPATIVEL` |
| **M** | três positivas juntas | **uma** proposta `CONFIRMADO` — sem contagem |
| **N** | segunda chamada idêntica | `JA_EMITIDA` |
| **O** | segunda regra profissional promovida no mesmo conceito | **recusa atômica** |
| **P** | `catalog_version` divergente | `CATALOGO_DIVERGENTE` |
| **Q** | declaração manual existente | `DECLARACAO_MANUAL_VIGENTE` |

**M, N, O, P e Q** são acréscimos aos doze da missão: cobrem "uma proposta por
evidência" (§10), idempotência, o invariante do §16 e as guardas que já existiam
e não podem regredir.

## 13. Duas observações não bloqueantes

1. **`consequence_degree`** é `not null` sem lista fechada, e a **DP-5**
   (régua de graduação por consequência) **segue ABERTA**. A emenda usa
   `'ESTRUTURAL'`, que é o **único precedente vigente** — o mesmo literal do
   emissor Case-side. **Não é decisão nova**; é seguir o precedente. Quando a
   DP-5 fechar, os dois emissores se ajustam juntos.
2. **Ficha do 1.A** merece a nota do §4: o executável vive no emissor; o braço
   `NAO_SUPORTADO` é declaração de contrato, não espelho do banco. **Documental,
   uma linha, sem tocar código.**

## 14. Rollback

Objeto a objeto, sem `db reset`, na ordem: reverter o DR3 a `candidatas := 0` ·
remover os três desfechos novos · remover a porta 2 profissional · restaurar
`ocupa_conceitos_da_versao()` à versão que lê só o `degree_map` · **`delete` das
linhas de `derivation_concept_vigencia` criadas pela emenda** *(único ponto que
exige desabilitar temporariamente o append-only, e por isso deve ser
explicitamente autorizado)* · `drop table derivation_rule_option_semantics`.

**A regra e suas transições NÃO são revertidas** — uma regra que existiu,
existiu (I-7). Reverter a emenda devolve o emissor ao estado vazio-honesto; a
Regra 001 permanece `VIGENTE` sem cobertura, exatamente como hoje.

## 15. Escopo da implementação futura

**Uma migration**, aditiva: cria a tabela nova (inerte) · o trigger de cobertura
total · a porta 2 profissional · estende a porta 1 · substitui o DR3 · acrescenta
os três desfechos · insere as **cinco** linhas de cobertura da Regra 001.

**Zero código de aplicação. Zero grant. Zero policy. Zero RPC nova. Zero UI.**
**Nenhum conceito além de `CONTINUIDADE_COORDENACAO`** — Regra 002 não existe e
não é criada aqui.

## 16. Veredito

> ### EMENDA DR3 — PRONTA PARA IMPLEMENTAÇÃO
>
> **Nenhuma decisão material resta.** A classificação das cinco opções em três
> papéis é transcrição literal da ficha v2.0; a ordem de avaliação é a matriz
> §15.1; a forma da estrutura espelha o precedente da ADR-066; e estender a
> ocupação ao lado profissional **cumpre** a condição 8 da ADR-066, cujo texto
> já dizia *"regra"* sem qualificar lado. **Nenhuma ADR nova é necessária.**
>
> **A lacuna do §21 fica nomeada e resolvida por esta especificação:** a Regra
> 001 era registro de governança **sem corpo executável**. O corpo é
> `derivation_rule_option_semantics` + o avaliador genérico no único escritor
> lavrado.
>
> **Um buraco aberto foi encontrado e fechado no papel:** a Regra 001 está
> `VIGENTE` **ocupando conceito nenhum**, e o invariante *"uma regra vigente por
> conceito"* não alcança o lado profissional. As portas 1 e 2 profissionais
> resolvem.
>
> **CD-1 — INTACTA.** `derivation_rule_degree_map` permanece vazio e fora do
> caminho profissional. **R-1 — ABERTA / NÃO INICIADA.**
