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

## 18. Fora de escopo — expresso

`2.C` · emissor de proposta do lado profissional · Fronteira Humana ·
confirmação · interface · painel · métricas · reabertura do 2.2 · histórico dos
Mapas (UPSERT) · `confirmed_at` · unificação `subcriterion_id`/`subcriterion_code` ·
qualquer superfície nova.
