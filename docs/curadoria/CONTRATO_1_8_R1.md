# Contrato Corretivo do Item 1.8-R1 — Fechamento da Proveniência da Ficha

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-07 |
| **Status** | **Vigente — contrato lavrado pelo DT-01**, nível derivado |
| **Decide** | DT-01 — Fundador |
| **Base técnica** | `c3242ea` |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §11, §17.4 · [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) · [`ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md`](ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md) |
| **Origem** | Pré-voo corretivo do Item 1.8-R1 (2026-08-07) |

> Este documento **não é uma ADR**. Ele lavra decisões do DT-01 sobre um pacote e
> especifica a persistência mínima que o pacote exige. Onde tocar domínio, ele
> cita a ADR que já decidiu — nunca decide por conta própria.

---

## 1. D1 — O §11.4 vincula o Item 1.8

> **O Item 1.8 somente se encerra quando a árvore de proveniência aplicável do
> §11.4 puder ser reconstruída de forma coerente.**

"Aplicável" é termo técnico, definido no §8 deste contrato: um ramo
semanticamente inexistente não é exigido; um ramo que sustente afirmação
exibida é exigido por inteiro.

| Item | Estado lavrado |
|---|---|
| **`c3242ea`** | **BASE TÉCNICA VÁLIDA — ITEM 1.8 CONCLUÍDO PARCIALMENTE.** Preservado integralmente; nada nele é revertido |
| **Item 1.8** | **CONCLUÍDO PARCIALMENTE** — §11.4 não satisfeito |
| **Item 1.8-R1** | **ABERTO** — Fechamento da Proveniência da Ficha de Explicação |

## 2. D2 — Persistência autorizada

O DT-01 autoriza **uma** migration, exclusivamente para persistir:

```
professional_subcriterion_map
        │
        └──▶ a versão exata de practice_evidence
              que sustenta o status confirmado
```

**Limites da autorização, expressos:** a migration **não antecipa `2.C`** e
**não cria proposta do lado profissional**. Nenhum emissor nasce aqui.

## 3. O vínculo — desenho escolhido

### 3.1 As chaves reais, verificadas

| Tabela | Identifica o profissional por | Identifica o conceito por | Versiona por |
|---|---|---|---|
| `professional_subcriterion_map` | `professional_profile_id` | **`subcriterion_id uuid`** → `method_subcriteria (id)` | não versiona (UPSERT) |
| `practice_evidence` | `professional_profile_id` | **`subcriterion_code text`** | `version integer`, append-only, `unique (professional_profile_id, subcriterion_code, version)` |

**As duas tabelas identificam conceito de formas diferentes.** Essa é a razão
técnica que decide o desenho, e ela precisa estar escrita: nenhuma chave
estrangeira pode arbitrar a igualdade de conceito entre elas sem uma tradução
`id ⟷ code`, e unificar as duas convenções é migration muito maior do que esta
R1 autoriza.

### 3.2 A forma sugerida pelo DT-01, e por que não é adotada

A forma `(professional_profile_id, subcriterion_code, evidence_version)` com FK
para a chave única de `practice_evidence` **seria** integralmente declarativa —
mas exige acrescentar `subcriterion_code` ao Mapa, criando **uma segunda
representação do conceito na mesma linha**, ao lado de `subcriterion_id`. Isso
contraria P-07 (uma origem por fato) e passa a exigir um terceiro mecanismo só
para manter as duas colunas coerentes. O custo é maior que o ganho.

### 3.3 Desenho lavrado

```
professional_subcriterion_map
  professional_profile_id   (existente)
  subcriterion_id           (existente)
  status                    (existente)
  declared_by               (existente — PP-02)
  updated_at                (existente)
  evidence_id  uuid  NULL   ← o vínculo
```

**`evidence_id` é o ponteiro de versão.** `practice_evidence.id` identifica
**exatamente uma** tripla `(profissional, conceito, versão)`. Apontar para a
linha é apontar para a versão — e é mais forte do que guardar o número, porque
não existe a possibilidade de o número apontar para a linha errada.

**Nenhuma coluna `evidence_version` é criada.** A versão se lê pelo vínculo.
Guardá-la duas vezes seria o mesmo fato em dois lugares (P-07), com a
possibilidade de divergirem.

### 3.4 O que arbitra o quê

| Exigência | Arbitrado por | Mecanismo |
|---|---|---|
| a evidência **existe** | **FK** | declarativo |
| a evidência é do **mesmo profissional** | **FK composta** | `(evidence_id, professional_profile_id)` → `practice_evidence (id, professional_profile_id)`, apoiada em `unique (id, professional_profile_id)` acrescentada a `practice_evidence` |
| a evidência é do **mesmo conceito** | **constraint trigger** | exige a tradução `subcriterion_id → code`; nenhuma FK a alcança (§3.1) |
| a **versão exata** | **PK de `practice_evidence`** | estrutural |
| o vínculo **nunca fica obsoleto** | **trigger `BEFORE UPDATE`** | §7.2 |

O `unique (id, professional_profile_id)` é redundante com a chave primária e
existe **só** para habilitar a FK composta. O custo é um índice a mais numa
tabela append-only; o ganho é metade da coerência sair da convenção e entrar no
banco.

## 4. Semântica do vínculo

> **`evidence_id` identifica exatamente a evidência que justificava o `status` no
> momento da confirmação do Mapa do Profissional.** Nunca "a evidência mais
> recente".

| Pergunta | Resposta lavrada |
|---|---|
| Pode ser `NULL`? | **Sim, obrigatoriamente** — há registros anteriores ao regime, e o backfill é proibido |
| Em quais estados? | Em **qualquer** um dos três (`CONFIRMADO`, `NAO_CONFIRMADO`, `NAO_INFORMADO`). Os três são afirmações sobre alguém e os três pedem base; a nulidade é concessão ao legado, nunca ao estado |
| Semântica do `NULL` | **Registro sem vínculo de evidência** — anterior ao regime, ou gravado por fluxo que ainda não informa a base. **Nunca** "sem evidência", **nunca** "evidência desconhecida" (I-8). Mesma disciplina que a PP-02 fixou para `declared_by` |
| Legado pode permanecer sem vínculo? | **Sim.** Nenhum backfill, nenhuma inferência retroativa |
| A ausência bloqueia AC-EXPLICA? | **Sim** — `NULL` ⇒ ramo estado **AUSENTE** ⇒ afirmação dependente **não exibível** (§8) |
| Mudar o `status` exige declarar nova evidência? | **Sim, quando já havia vínculo** — imposto por trigger (§7.2). Linha que nunca teve vínculo continua podendo mudar de status sem ele, e permanece não exibível |
| Atualizar evidência sem mexer no Mapa altera o vínculo? | **Não — por construção.** `practice_evidence` é append-only: `UPDATE` e `DELETE` são recusados por trigger. Evidência nova é **linha nova, `id` novo**; o Mapa continua apontando para a antiga |
| Versão nova substitui a antiga automaticamente? | **Não — pelo mesmo motivo.** Não existe caminho que troque o ponteiro sem alguém gravá-lo |

> **Proibição explícita.** Nenhum código pode resolver evidência por
> `max(version)` para fins de proveniência. É a semântica "use sempre a mais
> recente" que este contrato existe para impedir, e ela deve ter guarda própria.

## 5. Autoria da confirmação

Preservados como estão, sem invenção:

| Campo | Semântica lavrada |
|---|---|
| `declared_by` | Quem confirmou. **`NULL` = registro anterior ao regime de autoria** (PP-02) — nunca "autor desconhecido", nunca ausência de responsabilidade (I-8) |
| `updated_at` | **A melhor data disponível da gravação atual**, não a data histórica perfeita da confirmação |

**Nenhum `confirmed_at` é criado nesta R1.** A necessidade não foi demonstrada,
e criar a coluna afirmaria uma precisão que o sistema não tem. Fica registrado
que a data histórica exata da confirmação **não existe** e que o Mapa é UPSERT —
reconstruir frase **passada** é problema distinto de reconstruir a leitura
**corrente**, e não pertence a esta R1.

## 6. Legado

```
sem evidence_version
→ proveniência de estado AUSENTE
→ afirmação dependente do ramo estado NÃO EXIBÍVEL
```

Lavrado sem exceção. **Proibido**: backfill por `max(version)`; inferência
retrospectiva; qualquer heurística que transforme "não registrado" em
"registrado".

## 7. Escrita futura

### 7.1 Writers atuais — inventário completo

| Writer | Local | Hoje |
|---|---|---|
| `saveProfessionalMapEntries` | [`mapa-profissional-repository.ts:89`](../../src/modules/curadoria/mapa-profissional-repository.ts) | `upsert` com `onConflict: professional_profile_id,subcriterion_id`. **Não grava `declared_by`; não gravará `evidence_id` sem alteração** |
| Ação chamadora | [`mapa-profissional-actions.ts:56`](../../src/modules/curadoria/mapa-profissional-actions.ts) | único chamador |

**É um writer só, com um chamador só.** A superfície de mudança é essa, e a
alteração desse writer **entra no escopo do 1.8-R1**.

### 7.2 Contrato novo

1. O writer passa a **aceitar e gravar** a evidência sustentadora.
2. **Nenhuma action inventa versão.** A evidência vem de quem grava, ou não vem.
3. A FK arbitra profissional; a constraint trigger arbitra conceito (§3.4).
4. **Trigger `BEFORE UPDATE`:** se `status` muda e a linha **já tinha**
   `evidence_id`, a gravação é recusada quando o vínculo não é reapresentado.
   Impede que um vínculo válido passe a sustentar um estado que não é mais o
   dele.
5. Linha que **nunca teve** vínculo continua podendo mudar de status sem ele — e
   permanece não exibível pelo §8. **O fluxo existente não quebra.**

> **Nenhum fluxo de negócio novo é criado.** Não há tela nova, não há etapa nova,
> não há coleta nova. O regime torna explícito o que já era exigido pelo Método:
> quem afirma um estado sabe em que se apoiou.

## 8. `AUSENTE` × `NAO_APLICAVEL`

| Marca | Definição | Efeito |
|---|---|---|
| **`AUSENTE`** | O fato **deveria existir** e não existe | é lacuna · **bloqueia** a afirmação dependente |
| **`NAO_APLICAVEL`** | O nó **não existe semanticamente** naquele caminho | não é lacuna · **não bloqueia por si só** |

**Aplicação obrigatória ao nó `proposta`:** quando a importância foi **declarada
manualmente**, não houve derivação, e o nó é `NAO_APLICAVEL` — não uma lacuna.
Hoje `montarCadeiaDeProveniencia` marca `PROPOSTA` como sempre ausente, o que
torna `cadeia.completa` permanentemente falsa. A R1 corrige isso.

## 9. Cadeia única

> **Existe uma única modelagem de proveniência da Curadoria:
> `CadeiaDeProveniencia`.**

| Consequência | Obrigação na R1 |
|---|---|
| `OrigemDoConceito` **desaparece** | remover o tipo |
| A Ficha **consome** a cadeia do Item 1.9 | `ficha-de-explicacao.ts` passa a receber `CadeiaDeProveniencia` |
| **Nenhum** segundo modelo paralelo | — |
| **Guarda nova** contra nova duplicação | nenhum módulo fora de `cadeia-de-proveniencia.ts` pode modelar elo de proveniência |

## 10. `PROVENIENCIA_INCONSISTENTE`

Operacional, com discriminador **obrigatório**:

```
{
  motivo: "PROVENIENCIA_INCONSISTENTE",
  contradicao: <enum fechado>
}
```

| # | `contradicao` | Como se verifica |
|---|---|---|
| 1 | `PROPOSTA_INEXISTENTE` | `propostaId` não resolve linha em `derivation_proposals` |
| 2 | `PROPOSTA_DE_OUTRA_REGRA` | `proposta.rule_id` ≠ regra afirmada |
| 3 | `PROPOSTA_DE_OUTRA_VERSAO` | `proposta.rule_version` ≠ versão afirmada |
| 4 | `ALVO_DIVERGENTE` | alvo da proposta ≠ alvo da leitura |
| 5 | `ORIGEM_DE_OUTRA_PESSOA` | `origin_record` não aponta para a declaração deste Case |
| 6 | `ORIGEM_SUPERADA` | `origin_version` ≠ grau corrente em `case_needs` (S1, ADR-066 §9) |
| 7 | `CONCEITO_DIVERGENTE` | conceito difere entre proposta, declaração e linha da leitura |
| 8 | `EVIDENCIA_DIVERGENTE` | evidência não pertence ao profissional/conceito afirmados |

**Não recebem código:** "regra inexistente" e "versão inexistente" — já
arbitradas pela FK composta da **MR1.3**, e criar motivo para o impossível seria
código morto de outro tipo.

## 11. Oráculo de versão exata

**Prova positiva**

```
proposta persistida
→ lê rule_id / rule_version DO BANCO
→ a Ficha reproduz exatamente esses fatos
```

**Falseamento — obrigatório**

```
entrada com rule_version diferente
→ PROVENIENCIA_INCONSISTENTE / PROPOSTA_DE_OUTRA_VERSAO
→ a afirmação dependente NÃO renderiza
```

> **O teste de eco é substituído.** O oráculo atual —
> [`ficha-de-explicacao.integration.test.ts:209`](../../tests/integration/ficha-de-explicacao.integration.test.ts)
> — injeta `ruleVersion + 1`, a Ficha **renderiza mesmo assim**, e a asserção só
> confere que a saída repete a entrada. Ele prova a tautologia, não o fato.

## 12. AC-EXPLICA — a unidade de bloqueio é a afirmação

| Afirmação | Ramo necessário |
|---|---|
| **R1** — por que foi escolhida | **AMBOS** |
| **R2** — não há posição | **NENHUM** (constante do contrato, §4.6) |
| **R3** — critérios que influenciaram | **AMBOS** |
| **R4** — fora do Motor por Método | **NENHUM** (fato do Catálogo) |
| **R4** — importância ausente / grau sem preferência | **IMPORTÂNCIA** |
| **R5** — lacunas de estado | **ESTADO** |
| **R6** — grau de confiança | **união dos ramos usados no cálculo** |

> **Nenhuma afirmação pode usar um ramo incompleto e continuar marcada como
> completa.** Nenhum fallback, nenhum texto de reserva: o item não aparece, e a
> superfície declara que há item não exibível (§17.4 item 6).

## 13. Regime de transição

| Decisão do DT-01 |
|---|
| O `c3242ea` **não está autorizado a ser conectado a nenhuma superfície de produção** |
| **AC-EXPLICA integral é requisito anterior** ao primeiro consumidor da Ficha |
| **Nenhum modo de fallback** é criado |
| A **Fronteira Humana não abre** enquanto o `1.8-R1` não estiver verificado |

Isto responde ao risco levantado no pré-voo: aplicado hoje, o critério bloquearia
o resultado de célula em toda superfície. Como **nenhuma superfície consome a
Ficha ainda**, não há apagão a mitigar — desde que nenhuma seja ligada antes.

## 14. A5 / A5b

| Regra lavrada |
|---|
| **A5** continua bloqueando qualquer consumidor **não nomeado** |
| **`INERTES_AUTORIZADOS` passa a ser fonte única** dos consumidores autorizados |
| **A5b itera sobre todos** os `INERTES_AUTORIZADOS` |
| **Autorizar = auditar inércia**, no mesmo ato |
| A **Ficha permanece pura**; toda I/O mora em repository dedicado |

Hoje `A5b` audita um caminho hard-coded, enquanto `A5` já autoriza dois — e o
nome do teste ainda diz *"o único consumidor autorizado"*. Autorizado e auditado
voltam a coincidir.

## 15. Especificação da migration — contrato, não implementação

> **Esta seção não é a migration.** Ela é o contrato que a migration deverá
> cumprir. A migration **não é criada nesta missão**.

| Item | Especificação |
|---|---|
| **Tabelas alteradas** | `curadoria.professional_subcriterion_map` (coluna) · `curadoria.practice_evidence` (índice único habilitador, **nenhuma coluna**) |
| **Coluna** | `evidence_id uuid` |
| **Nullable** | **NULL permitido** — exigido pelo legado; mesma disciplina da PP-02 |
| **FK** | `(evidence_id, professional_profile_id)` → `practice_evidence (id, professional_profile_id)` |
| **ON UPDATE** | `RESTRICT` |
| **ON DELETE** | `RESTRICT` — nenhuma cascata destrutiva sobre proveniência (I-7; mesma política da MR1.3) |
| **Habilitador** | `unique (id, professional_profile_id)` em `practice_evidence` — redundante com a PK, existe só para permitir a FK composta |
| **Constraint trigger** | coerência de **conceito**: o `subcriterion_code` da evidência corresponde ao `code` de `method_subcriteria` apontado por `subcriterion_id`. `DEFERRABLE INITIALLY DEFERRED` |
| **Trigger `BEFORE UPDATE`** | recusa mudança de `status` que não reapresente `evidence_id`, **quando a linha já tinha vínculo** (§7.2) |
| **Registros legados** | **intocados.** Sem backfill, sem inferência, sem `max(version)` |
| **RLS/grants** | **inalterados.** Nenhuma policy criada, alterada ou removida; ADR-040 item 6 permanece intacta (ADR-068 item 7) |
| **Writer afetado** | `saveProfessionalMapEntries` — **um só**, com um chamador só |
| **Rollback** | `drop column evidence_id`; `drop` dos dois triggers; `drop` do índice único habilitador. **Nenhum dado preexistente é tocado**, logo nada se perde ao reverter |
| **Idempotência** | `add column if not exists` · `create ... if not exists` · `create or replace function`. Reexecutar não falha nem duplica |
| **Compatibilidade** | **total.** Coluna nova e nula não invalida nenhuma linha existente; o fluxo atual de gravação continua funcionando e passa a produzir linhas honestamente não exibíveis |
| **Concorrência** | duas gravações concorrentes do mesmo `(profissional, conceito)` continuam arbitradas pelo `unique` já existente. O trigger de mudança de status roda `BEFORE UPDATE` na linha, sob o mesmo lock — **teste de concorrência exigido** para gravação simultânea com vínculos diferentes |

## 16. Critérios de aceite do 1.8-R1

O pacote **só pode ser encerrado** quando os doze estiverem satisfeitos:

| # | Critério |
|---|---|
| 1 | Existe **uma única** `CadeiaDeProveniencia` |
| 2 | Ramo **importância** completo quando aplicável |
| 3 | Ramo **estado** com vínculo explícito à evidência exata |
| 4 | **Confirmação** presente nos dois ramos |
| 5 | `AUSENTE` e `NAO_APLICAVEL` **distintos** |
| 6 | Inconsistências confrontadas contra **fatos persistidos** |
| 7 | `PROVENIENCIA_INCONSISTENTE` **alcançável** |
| 8 | Versão exata provada por **falseamento** |
| 9 | **AC-EXPLICA por afirmação** |
| 10 | **A5/A5b** permanecem fechados |
| 11 | **`c3242ea` continua integralmente verde** |
| 12 | **Nenhuma superfície nova** é aberta |

## 17. Acesso ao Processo de Engenharia

`PROCESSO_DE_ENGENHARIA_2_0.md` **não existe neste branch técnico** — vive em
`curadoria/2-0-documentacao`, commit `22cb0d3`.

**Estratégia lavrada: referenciar o commit imutável.** Copiar o documento para
cá criaria uma segunda cópia de documento canônico, com a possibilidade de
divergirem — exatamente o que a Política de Governança Documental proíbe.

Acesso verificável, sem alterar a árvore:

```bash
git show 22cb0d3:docs/curadoria/PROCESSO_DE_ENGENHARIA_2_0.md
```

O Agente 01 **não executa a R1 sem ter lido o Processo por esse caminho**.

## 18. Emenda da guarda C-01 — DT-01, 2026-08-07

> **Contexto.** O Implementador **interrompeu corretamente** antes de editar: o
> §10 deste contrato exige confrontar fatos da Ficha contra linhas persistidas de
> `derivation_proposals`, e a C-01 proíbe que qualquer módulo de `src/` conheça
> propostas persistidas. A interrupção foi acerto de processo.

### 18.1 A C-01 como está — auditoria

| Item | Achado |
|---|---|
| **Arquivo** | [`tests/unit/guardas-curadoria-2-0/grupo-c-derivacao.test.ts`](../../tests/unit/guardas-curadoria-2-0/grupo-c-derivacao.test.ts) |
| **Asserção bloqueante** | `it("nenhum módulo do código conhece propostas de derivação persistidas")` |
| **Varredura** | `ocorrencias(FONTES, /derivation_proposals\|derivationProposal/i)` deve ser `[]` |
| **Escopo `FONTES`** | todos os `.ts`/`.tsx` sob `src/`, **conteúdo integral — comentários inclusive** |
| **Origem** | `b85b968` (pacote F-01, retificado por F-01A) |
| **Emendada antes** | **sim** — `1ed29f8` (Item 2.1) reescreveu a primeira asserção. Há precedente de emendar a C-01 **na forma**, preservando a intenção |
| **Princípio** | P-08 ("proposta nunca é declaração") · Arquitetura §15.0 |

**O risco que a C-01 quis impedir, com evidência no próprio texto:** que a
derivação alcançasse um humano ou o Motor **por atalho**, antes da Fronteira
Humana — proposta virando declaração sem ato. O cabeçalho do arquivo o diz
("guardas de **ausência**: provam que nada no repositório já faz, por atalho, o
que a arquitetura só autoriza depois de decisão registrada"), e a emenda do 2.1
já precisou o verbo: *"a regra proíbe derivação **persistida ou consumida**"*.

**A distinção normativa já estava latente ali.** Ler uma proposta para
reconstruir e verificar sua proveniência **não é consumi-la** para decidir,
derivar, ordenar ou executar o Motor. A emenda torna explícita uma fronteira que
a guarda sempre quis ter, e nunca soube escrever.

> **Prova de que a varredura alcança comentário:** o módulo do Item 1.9 registra,
> em [`cadeia-de-proveniencia.ts:83`](../../src/modules/curadoria/cadeia-de-proveniencia.ts),
> ter sido apanhado por ela — *"faz bem: foi ela que apanhou este comentário"*.

### 18.2 A exceção nominal — um único ponto canônico

> **Consumidor autorizado: `src/modules/curadoria/cadeia-de-proveniencia-repository.ts`.**
> **Um só.**

```
derivation_proposals
        ↓ leitura somente
cadeia-de-proveniencia-repository.ts     ← único ponto canônico
        ↓
CadeiaDeProveniencia   (puro — compara e monta)
        ↓
Ficha                  (puro — consome)
```

**Por que este e não `ficha-de-explicacao-repository.ts`:** a proposta é **um nó
da cadeia** (o elo `PROPOSTA`), não um insumo da Ficha. Ler os nós é a
responsabilidade que o repositório da cadeia já exerce sobre as quatro fontes
existentes; a proposta é a quinta. E o repositório da Ficha **pode delegar** a
ele — logo, pelo critério do DT-01, **não se autorizam os dois**.

### 18.3 A semântica nova da C-01

> **Nenhum módulo de produção consome propostas persistidas, exceto o
> repositório canônico de proveniência, que pode somente lê-las para
> reconstrução e auditoria.**

| Consumo — **proibido a todos, inclusive ao autorizado** | Leitura — **autorizada só ao repositório canônico** |
|---|---|
| escolher regra | buscar proposta por identidade |
| emitir proposta | confrontar `rule_id` |
| alterar proposta | confrontar `rule_version` |
| calcular importância | confrontar origem |
| recalcular Motor | confrontar Case / conceito |
| ordenar | montar `CadeiaDeProveniencia` |
| filtrar profissionais | — |
| tomar decisão | — |
| montar superfície diretamente | — |

A coluna da esquerda **não é liberada pela exceção**. A exceção autoriza um
verbo — *ler para reconstruir* —, nunca um arquivo.

### 18.4 C-01b — auditoria da exceção

A exceção nominal precisa de guarda própria. **C-01b: o consumidor autorizado de
propostas é estritamente inerte e read-only.**

Falha se o arquivo autorizado contiver, direta ou indiretamente:
`.insert(` · `.update(` · `.delete(` · `.upsert(` · RPC de escrita
(`rpc("emitir_…")` e equivalentes) · emissão · seleção de regra · cálculo do
Motor · `export` de função de decisão.

> **Fonte única, à semelhança de `INERTES_AUTORIZADOS`:** a lista nominal
> `LEITORES_DE_PROPOSTA_AUTORIZADOS` é declarada **uma vez** e usada pelas duas
> guardas — **C-01** para isentar, **C-01b** para auditar. Autorizar passa a ser,
> no mesmo ato, submeter à auditoria de inércia. Um segundo nome futuro nasce
> auditado por construção.

### 18.5 Terceiro consumidor — prova obrigatória

A emenda **não pode generalizar a permissão**. Exige-se prova de falseamento:

```
src/modules/curadoria/qualquer-outro-modulo.ts
        → derivation_proposals
⇒ C-01 FALHA
```

**Como provar sem sujar a árvore:** a detecção deve ser extraída em **função
pura** sobre `(lista de arquivos, conteúdo)`, para que o falseamento se prove
com entrada sintética. Guarda que só pode ser falseada criando arquivo real não
é falseável na prática — e uma guarda que ninguém consegue derrubar de propósito
não prova que pegaria o descuido.

### 18.6 Superfícies — continuam proibidas

`components` · `routes` · `actions` · interfaces da paciente · Relatório · Mesa ·
Fronteira Humana **não acessam a proposta**, nem direta nem indiretamente. Todas
recebem a informação por `CadeiaDeProveniencia → Ficha`, **nunca por query**.

Isto já é parcialmente guardado pela **C-16** (`app/` e `components/`); a C-01
emendada cobre o restante de `src/`, inclusive `actions`, porque tudo o que não
estiver na lista nominal continua caindo.

### 18.7 Relação com A5 — listas independentes, mecanismo comum

**Não confundir, e não fundir.**

| | **A5 / A5b** | **C-01 / C-01b** |
|---|---|---|
| Sujeito | o **contrato** da Regra (`regra-de-derivacao-contrato`) | a **proposta persistida** (`derivation_proposals`) |
| Risco | a camada inerte ganhar lógica viva | a derivação alcançar humano ou Motor sem Fronteira |
| Critério de admissão | **pureza** — o autorizado não faz I/O | **leitura somente** — o autorizado **faz** I/O, por definição |
| Lista | `INERTES_AUTORIZADOS` | `LEITORES_DE_PROPOSTA_AUTORIZADOS` |

**As duas listas têm membros incompatíveis, e é isso que decide a questão.** A
Ficha está na lista da A5 e **não pode** estar na da C-01. O repositório da
cadeia está na da C-01 e **jamais** poderia estar na da A5 — ele faz I/O, que é
exatamente o que a A5b reprova.

> **Abstração comum legítima: o mecanismo, nunca a lista.** Compartilhar o
> ajudante de varredura e o formato de exceção nominal é bom. Fundir as listas
> obrigaria a afrouxar um dos dois critérios de admissão — reduzir código à custa
> de reduzir proteção.

### 18.8 RPC ou view não satisfazem a guarda

> **Abstrair o nome da tabela sem mudar a semântica do acesso não satisfaz a
> C-01.** Uma view `proveniencia_da_proposta` ou uma RPC de leitura que apenas
> escondam `derivation_proposals` do regex são **evasão**, não solução.

RPC ou view só são aceitáveis por **razão arquitetural própria** — decidida e
registrada —, nunca para escapar da varredura. Consequência operacional: toda
view ou função nova sobre `derivation_proposals` entra na **mesma lista
nominal**, e quem a consome fica sujeito à mesma regra.

### 18.9 O escopo do 1.8-R1 não é reduzido

Registrado expressamente: **os discriminadores de incoerência do ramo importância
permanecem no 1.8-R1**, e **nenhum é adiado para `2.C`**:

`PROPOSTA_INEXISTENTE` · `PROPOSTA_DE_OUTRA_REGRA` · `PROPOSTA_DE_OUTRA_VERSAO` ·
`ALVO_DIVERGENTE` · `ORIGEM_DE_OUTRA_PESSOA` · `ORIGEM_SUPERADA` ·
`CONCEITO_DIVERGENTE`

Era exatamente para poder verificá-los que a emenda foi pedida; usá-la para
encolher o pacote inverteria o propósito.

### 18.10 O que a emenda **não** muda

A Ficha continua **pura**, sem I/O · a `CadeiaDeProveniencia` continua a **única**
modelagem de proveniência (§9) · o repositório **não vira autoridade** sobre
regra nem sobre proposta — ele lê e entrega · a estrutura de
`derivation_proposals` continua **inerte no banco**: RLS ligada, sem policy, sem
grant a papel de aplicação, e a C-01 primeira asserção segue provando isso.

## 19. Estado do checkpoint técnico

O pacote `1.8-R1` está **em execução** e tem checkpoint válido:

| Item | Estado |
|---|---|
| `HEAD` | `5afe937` |
| Migration | `20260807120000_vinculo_de_evidencia_no_mapa_do_profissional.sql` — **não rastreada**, já aplicada, arquivo e funções conferidos idênticos ao banco |
| Ledger local | `104/104` |
| Restante do R1 | **não iniciado** |

> **A migration não faz parte desta emenda documental.** Ela **não é revertida**,
> **não é commitada nesta missão** e **permanece checkpoint técnico do pacote em
> execução**. O Agente 01 retoma exatamente daqui — não há motivo para recomeçar
> o R1 nem descartar a migration já provada.

## 20. Fora de escopo — expresso

`2.C` · emissor de proposta do lado profissional · Fronteira Humana ·
confirmação · interface · painel · métricas · reabertura do 2.2 · histórico dos
Mapas (UPSERT) · `confirmed_at` · unificação `subcriterion_id`/`subcriterion_code` ·
qualquer superfície nova.

## 21. Leitor controlado de `derivation_proposals` — DT-01, 2026-08-07

> **Contexto.** O caminho autorizado pelo §18 encontrou o invariante do Item 2.1:
> o repositório canônico leu a tabela diretamente e o banco recusou —
> `permission denied` para `service_role`, porque a 2.1 deliberadamente não
> concede `SELECT` a papel de aplicação. O teste A1.1 está vermelho por isso, e
> **isso é o banco funcionando**, não defeito.
>
> **Decisão do DT-01:** função leitora `SECURITY DEFINER`, contrato read-only
> estreito, `EXECUTE` exclusivamente para `service_role`. A tabela permanece
> inacessível aos papéis de aplicação. **A autoridade pertence à função, nunca ao
> papel sobre a tabela.**

### 21.1 Auditoria do contrato de inércia do 2.1 — o que continua verdadeiro

| Item | Achado |
|---|---|
| Migration | `20260805090000_estrutura_inerte_da_camada_de_derivacao.sql` — RLS ligada, zero policy, `revoke all … from anon, authenticated`; a `service_role` **nunca recebeu grant** (ausência, não revogação) |
| Oráculo | [`derivacao-inerte.integration.test.ts`](../../tests/integration/derivacao-inerte.integration.test.ts) — `has_table_privilege` **falso** para `anon`/`authenticated`/`service_role`, select e insert, e zero policies |
| Justificativa canônica | *"Quem escreve, quem lê e sob que autoridade é decisão das dez dependências do §15.0 — enquanto ela não existir, a tabela permanece fechada **por construção, não por convenção**"* |
| Precedente `SECURITY DEFINER` | há dezenas na Curadoria — `transfer_case_responsibility`, `practice_evidence_append_only`, os triggers de catálogo — todas com `search_path` fixo |

**Todas as afirmações da 2.1 continuam verdadeiras após a capability**, porque
todas falam da **tabela**: nenhuma policy nasce, nenhum grant de tabela nasce,
nenhum papel de aplicação passa a alcançá-la diretamente. E a leitura por função
nomeada é exatamente a espécie de decisão que a justificativa canônica
anunciava: uma autoridade **decidida e lavrada**, não uma abertura por herança.

> **Aceite positivo permanente do R1:**
> `has_table_privilege('service_role', 'curadoria.derivation_proposals', 'select') = false`.

### 21.2 A função — uma, e com este contrato

| Campo | Especificação |
|---|---|
| **Nome** | `curadoria.ler_proposta_para_proveniencia` — verbo-primeiro, como `emitir_…`, `valida_…`, `exige_…`, `ocupa_…` |
| **Natureza** | **capability de auditoria** — não é repository, não é writer, não é RPC de negócio |
| **Entrada** | `(p_case_id uuid, p_subcriterion_code text)` — a identidade do alvo, que é o que o repositório tem ao montar a cadeia. **`STRICT`**: entrada nula devolve vazio sem executar — nenhum curinga |
| **Cardinalidade** | devolve **0 ou 1 linha**. Zero linhas é fato de domínio (o elo decide-se na cadeia, não aqui). **Mais de uma linha ⇒ `RAISE` com mensagem nomeada `PROPOSTA_AMBIGUA`** — recusa explícita, nunca escolha silenciosa (mesmo padrão do 2.2C-R1). Hoje a unicidade por alvo decorre dos invariantes (uma regra vigente por conceito + `JA_EMITIDA`); quando os fluxos S1/S2 da `2.C` existirem, evoluir este arco é pacote próprio |
| **Escopo do alvo** | **lado do Case apenas.** Propostas do lado profissional não existem e seu emissor é matéria da `2.C`; um segundo arco de entrada será decisão própria |
| **Proibido** | listar propostas arbitrariamente · aceitar predicados abertos · paginação · `select *` · `returns setof derivation_proposals` |

### 21.3 Saída fechada — projeção nominal

`returns table` com **exatamente** estas colunas, confirmadas no schema:

`id uuid` · `case_id uuid` · `subcriterion_code text` · `rule_id text` ·
`rule_version integer` · `origin_record text` · `origin_version text` ·
`origin_declared_at timestamptz` · `origin_author uuid` · `suggested_value text` ·
`emitted_at timestamptz`

`origin_declared_at` entra além da lista esperada porque a árvore do §11.4 exige
*"resposta dela, **data**"*. **Ficam fora, deliberadamente:**
`professional_profile_id` (sempre nulo no alvo Case), `target_field`,
`catalog_version`, `consequence_degree` e `state` — nenhum dos sete
discriminadores do §10 precisa deles. **Alargar a projeção é mudança de contrato
e exige lavratura.**

### 21.4 `SECURITY DEFINER` — endurecimento obrigatório

| Item | Especificação |
|---|---|
| Owner | o papel que executa migrations (`postgres`); **nunca reatribuído** a papel de aplicação |
| Definer | `security definer` — a autoridade de leitura é da função |
| `search_path` | `set search_path = curadoria, pg_temp` — fixo na definição; `pg_temp` **por último**, para que objeto temporário do chamador não faça shadowing |
| Referências | **totalmente qualificadas** (`curadoria.derivation_proposals`) mesmo com o path fixo |
| SQL dinâmico | **proibido** — nenhum `EXECUTE`, nenhum `format()`, nenhuma interpolação; parâmetros usados só como valores tipados |
| Volatilidade | **`STABLE`** — e não é decoração: o PostgreSQL **recusa em execução** qualquer escrita dentro de função não-volátil. O read-only é do motor, não da disciplina |

### 21.5 Grants — o contrato completo

```
PUBLIC          → REVOKE EXECUTE (imediato, na mesma migration — o default é PUBLIC)
anon            → sem EXECUTE
authenticated   → sem EXECUTE
service_role    → GRANT EXECUTE (o único)
postgres/owner  → conforme administração
```

E, simultaneamente, **inalterado**: `service_role` sem `SELECT`, sem `INSERT`,
sem nada sobre a tabela. Nenhuma permissão adicional de qualquer espécie.

### 21.6 A C-01 evolui de novo — a tabela some de `src/` por inteiro

Com a capability, o repositório **não consulta mais a tabela**: ele invoca a
função (`.rpc("ler_proposta_para_proveniencia", …)`), cujo nome não contém o da
tabela. Decisão lavrada, acolhendo a preferência do DT-01:

> **A C-01 volta a proibir `derivation_proposals`/`derivationProposal` em TODO o
> `src/`, sem exceção nominal.** O único conhecimento da tabela em runtime de
> aplicação fica **encapsulado no objeto SQL**. O repositório conhece a função,
> não a tabela.

| Guarda | Sujeito após esta lavratura |
|---|---|
| **C-01** | a string da tabela — proibida em todo `src/`, **lista de isenção zerada**; comentários incluídos (a varredura sempre alcançou prosa) |
| **C-01b** | os arquivos de `LEITORES_DE_PROPOSTA_AUTORIZADOS` continuam auditados como read-only e não decisórios — a lista **muda de sujeito**: deixa de isentar acesso à tabela e passa a nomear **quem pode invocar a capability** |
| **C-01c** | intocada — o vínculo é ponteiro, nunca busca |
| **C-01d** (nova) | a capability tem **um chamador só** — ver §21.7 |

Não se reutiliza a C-01b para o novo sujeito da C-01d: **inércia do arquivo** e
**exclusividade do chamador** são perguntas diferentes, e fundi-las repetiria o
erro que o §18.7 já recusou para A5×C-01.

Consequência prática para o Agente 01: tipos e comentários do repositório não
podem conter os radicais proibidos — nomear `PropostaParaProveniencia` e
explicar por "capability de proveniência" resolve.

### 21.7 C-01d — a guarda da capability

Prova, com a lista nominal como fonte única:

1. **apenas** os arquivos de `LEITORES_DE_PROPOSTA_AUTORIZADOS` mencionam
   `ler_proposta_para_proveniencia` em `src/`;
2. nenhum `component`, `route`, `action`, superfície ou módulo fora da lista a
   invoca;
3. **nenhuma segunda função SQL expõe propostas**: varrendo as migrations, o
   conjunto de funções cujo corpo alcança `derivation_proposals` é exatamente
   `{ emitir_proposta_de_importancia (escritor, C-11), ler_proposta_para_proveniencia (leitor) }` —
   um terceiro nome derruba a guarda;
4. a detecção é **função pura** sobre `(arquivos, conteúdo)`, falseável com
   entrada sintética (§18.5).

### 21.8 O contrato do 2.1 não foi relaxado

| Continua proibido | Passa a existir |
|---|---|
| papel de aplicação → acesso **direto** à tabela | `service_role` → `EXECUTE` numa capability **read-only** de projeção mínima |

A proposta continua: **não consumida pelo Motor** · **não convertida
automaticamente em declaração** · **não apresentada diretamente a humano** ·
**não escrevível por aplicação**. A capability lê fatos para reconstruir
proveniência — os nove verbos de consumo do §18.3 permanecem proibidos a todos.

### 21.9 Oráculos — o que fica verde e o que ganha complemento

**Permanecem literalmente verdes, sem edição:** `service_role`/`authenticated`/
`anon` sem `SELECT` e sem `INSERT` na tabela · zero policies · ausência de
escrita · C-01 primeira asserção (inércia na migration) · C-09 · C-11.

**Complemento novo (nunca substituição):**
`has_function_privilege('service_role', 'curadoria.ler_proposta_para_proveniencia(uuid,text)', 'execute') = true`
· o mesmo, **falso**, para `anon`, `authenticated` e `PUBLIC` · `prosecdef = true`
· `proconfig` contém o `search_path` fixo · `provolatile = 's'`.

> Proibido trocar "sem SELECT" por "agora pode SELECT". Os dois aceites coexistem.

### 21.10 Anti-vacuidade — dez mutações obrigatórias

| # | Mutação | Efeito exigido |
|---|---|---|
| 1 | `GRANT SELECT ON … TO service_role` | oráculo da 2.1 falha |
| 2 | `GRANT EXECUTE … TO authenticated` | complemento falha |
| 3 | `GRANT EXECUTE … TO PUBLIC` | complemento falha |
| 4 | `SECURITY INVOKER` | o caminho real (A1.1) deixa de funcionar |
| 5 | `search_path` sem fixação ou sem `pg_temp` ao fim | guarda falha |
| 6 | coluna extra na projeção | contrato de saída falha |
| 7 | função aceitando listagem ampla | falha |
| 8 | segundo chamador em `src/` | C-01d falha |
| 9 | acesso direto à tabela no repositório | C-01 falha |
| 10 | operação de escrita no corpo da função | `STABLE` recusa em execução **e** a guarda textual falha |

### 21.11 A1.1 — o aceite que esta lavratura desbloqueia

O teste **já escrito** ([`cadeia-de-proveniencia-vinculo.integration.test.ts`](../../tests/integration/cadeia-de-proveniencia-vinculo.integration.test.ts))
é o aceite, sem reescrita de cenário: `practice_evidence` v1 e v2 · Mapa →
`evidence_id` da **v1** · proposta persistida → **capability** → repositório →
`CadeiaDeProveniencia`. Ele prova, de uma vez: a proposta real acessível **pelo
caminho autorizado** · a tabela inacessível diretamente · **v1 retornada apesar
da v2** (nenhum `max(version)`) · nenhuma autoridade nova sobre a proposta.

### 21.12 Migration — caminho B, e a regra que o decide

> **Nova migration sequencial.** A `20260807120000` **não é editada.**

Duas razões, nenhuma de conveniência:

1. **Regra oficial do projeto: migration aplicada é imutável.** O precedente
   está lavrado na própria C-11: o 2.2C-R1 evoluiu o emissor por
   `create or replace` **numa migration nova** — *"evolução legítima do mesmo
   escritor"*. Editar arquivo já aplicado dessincroniza arquivo ⟂ ledger
   (104/104): o runner não reexecuta versão registrada, e o aceite do checkpoint
   ("arquivo e funções no banco conferidos como idênticos") deixaria de valer.
2. **Autoridades distintas.** Vínculo de evidência (Mapa ↔ `practice_evidence`)
   e capability de leitura de propostas têm donos, riscos e rollbacks próprios.
   Misturá-los faria o rollback de um arrastar o outro.

### 21.13 Retomada do Agente 01 — ordem obrigatória

1. implementar a capability (migration nova, §21.2–§21.5);
2. ajustar o repositório para chamá-la — a tabela some de `src/`;
3. restaurar a C-01 como proibição total (lista de isenção da tabela zerada);
4. implementar a C-01d;
5. executar o A1.1;
6. provar v1 × v2;
7. provar a ausência de `SELECT` direto (aceites coexistentes do §21.9);
8. **só então** prosseguir no restante do R1.

O checkpoint técnico permanece intocado por esta lavratura: a migration
`20260807120000` não foi revertida nem commitada; o teste A1.1 permanece
vermelho até a capability existir — **e deve ser o primeiro verde da retomada**.

## 22. Condições finais do Item 1.8 — DT-01, 2026-08-07

> **Contexto.** O Agente 04 emitiu **ITEM 1.8-R1 VERIFICADO COM RESSALVAS** sobre
> `041b423`: 12/12 critérios do §16 confirmados, capability e inércia sem
> ressalvas, AC-EXPLICA verificado, regressão integralmente verde — e **três
> condições antes do encerramento formal**. Esta seção as lavra. `041b423` **não
> é reclassificado como reprovado.**

### 22.1 D1 — Proposta é ato histórico

> **Uma proposta emitida enquanto a versão da regra estava `VIGENTE` é um ato
> histórico válido.** Mudança posterior da regra para `SUSPENSA` ou `REVOGADA`
> **não invalida retroativamente** aquela proposta nem sua capacidade de compor a
> proveniência da derivação já emitida.

**A suspensão e a revogação controlam atos futuros; não reescrevem fatos
passados.** É o mesmo princípio que rege todo o corpus (ADR-062, append-only;
ADR-069, transição é ato): o estado corrente da regra governa o que ela **pode
fazer agora**, nunca o que ela **fez quando podia**.

### 22.2 D2 — O que a Ficha diz, e o que ela não pode dizer

A Ficha explica **qual regra e qual versão efetivamente emitiram** aquela
proposta. Ela **não afirma** que a regra continua vigente hoje, que continua
autorizada a nova emissão, nem que é "a regra atual".

```
validade histórica do ato  ≠  estado corrente da regra
```

A primeira sustenta a frase na tela; o segundo pertence ao ciclo de vida
(ADR-069) e às decisões de emissão futura — nunca à explicação do que já foi.

### 22.3 D3 — O destino de `REGRA_NAO_APLICAVEL`

O comportamento do `c3242ea` — `SUSPENSA`/`REVOGADA` ⇒ `REGRA_NAO_APLICAVEL` ⇒
frase removida — fica **formalmente substituído pelo regime histórico acima**, e
a substituição já está implementada em `041b423` (a Ficha não importa mais
`deixouDeValer`; o bloqueio por estado corrente deixou de existir).

**Não se cria nono discriminador** (`REGRA_NAO_VIGENTE` ou equivalente) neste
pacote, e **o R1 não é reaberto** por este motivo. Se um dia a superfície
precisar *anotar* que a regra mudou de estado depois do ato, isso é evolução de
vocabulário com lavratura própria.

### 22.4 D4 — Reapresentação obrigatória do vínculo

Se uma linha de `professional_subcriterion_map` **já possui `evidence_id`** e o
`status` é alterado, a nova gravação **deve apresentar explicitamente um vínculo
de evidência válido**:

| Gravação | Resultado |
|---|---|
| `status` muda + `evidence_id` antigo mantido implicitamente | **RECUSA** *(já implementado em `041b423`)* |
| `status` muda + `evidence_id = NULL` | **RECUSA** *(a lacuna — hoje passa; é o objeto do microcorretivo)* |
| `status` muda + **novo** `evidence_id` válido | **ACEITA** (FK composta e trigger de conceito arbitram a validade) |

**Apagar o vínculo no mesmo ato é proibido.** Revincular **sem** mudar `status`
permanece permitido — o regime disciplina a mudança de estado, não a manutenção
da evidência.

### 22.5 D5 — Por que o `NULL` é recusado

O Mapa é **UPSERT**: não existe histórico da confirmação anterior. Zerar
`evidence_id` na mesma gravação que muda o `status` **apagaria a sustentação
explícita do estado** — e apagaria para sempre, porque não há de onde recuperá-la.

```
legado sem vínculo  ≠  ato novo removendo vínculo
```

`NULL` **continua permitido** para linhas legadas já existentes (§4 — registro
sem vínculo, nunca "sem evidência"). O que ele **não pode** é ser o **resultado
de uma nova alteração de `status`** numa linha vinculada: o legado é herança de
antes do regime; o ato novo acontece sob o regime.

### 22.6 D6 — Testes obrigatórios do trigger

| # | Cenário | Resultado exigido |
|---|---|---|
| 1 | `status` muda, vínculo antigo não reapresentado | recusa |
| 2 | `status` muda + `evidence_id = NULL` | recusa |
| 3 | `status` muda + novo vínculo válido | aceita |
| 4 | linha legada sem vínculo | compatibilidade preservada conforme §7.2 — muda de `status` sem vínculo e permanece não exibível |
| 5 | evidência de **outro profissional** | recusa (FK composta) |
| 6 | evidência de **outro conceito** | recusa (trigger de conceito) |

### 22.7 D7 — Concorrência

**Cenário mínimo:** duas transações concorrentes atualizam **a mesma
confirmação** — mesmo `(professional_profile_id, subcriterion_id)` — com
`evidence_id` **diferentes e válidos**, mesmo `status` alvo ou estados
distintos.

A certificação demonstra: resultado **determinístico** · **nenhuma gravação
perde o vínculo** · **nenhuma confirmação termina sustentada por evidência não
reapresentada explicitamente** · o comportamento é a semântica normal do
row-lock do banco — o `BEFORE UPDATE` serializa sobre a linha, e a segunda
transação reavalia contra o estado que a primeira gravou.

> **Nenhum lock novo é inventado.** O lock de linha existente basta; criar
> mecanismo extra seria complexidade sem ameaça que a justifique.

### 22.8 D8 — A5/A5b: a Ficha sai de `INERTES_AUTORIZADOS`

Após o R1, `ficha-de-explicacao.ts` **não importa mais** o contrato da Regra
(verificado em `041b423`: o import de `deixouDeValer` não existe). **Autorização
nominal sem consumo real é autoridade desnecessária** — e autoridade
desnecessária é exatamente o que este corpus remove.

Lavrado: `ficha-de-explicacao.ts` **é removido** de `INERTES_AUTORIZADOS`. Após
a correção: só consumidores efetivamente necessários permanecem
(`ciclo-de-vida-da-regra.ts`) · **A5 continua barrando terceiros** · **A5b
continua iterando a lista como fonte única** (§14).

### 22.9 D9 — Escopo fechado do microcorretivo

**Exclusivamente:**

1. ajuste do trigger `exige_vinculo_ao_mudar_status` para recusar `NULL` na
   mudança de `status` quando havia vínculo (§22.4) — **em migration nova**,
   conforme a regra de imutabilidade do §21.12;
2. os seis testes do §22.6;
3. o teste concorrente do §22.7;
4. remoção da Ficha de `INERTES_AUTORIZADOS`;
5. ajuste dos oráculos **diretamente afetados**, e só deles;
6. documentação técnica mínima.

**Proibido alterar:** capability · cadeia · coerência · AC-EXPLICA ·
vocabulários · Motor · proposta · `2.C` · Fronteira Humana.

### 22.10 D10 — Estado do Item 1.8 e identificador

> **`041b423` = R1 VERIFICADO COM RESSALVAS — AGUARDA MICROCORRETIVO DE
> ENCERRAMENTO.** O Item 1.8 **permanece aberto** até o microcorretivo ser
> implementado e verificado. `041b423` **não é reprovado**.

**Identificador do microcorretivo: `1.8-R1-MR1`** — pela convenção já existente
no mapa (`2.2A-MR1`; nível *Micro-retificação* do Processo de Engenharia).
Nenhuma hierarquia nova é inventada.

Sequência esperada de encerramento: `1.8-R1-MR1` implementado → verificação
curta do Agente 04 → **ITEM 1.8 ENCERRADO** → retorno ao mapa canônico para o
próximo pacote de produto.
