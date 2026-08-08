# Pré-flight de Materialização da Regra 001 — os três gates

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Base** | `368fe99` |
| **Regra** | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`, versão 1 |
| **Status** | **BLOQUEADO EM GATE B** (e, por consequência, em GATE C) |
| **Natureza** | governança documental. **Zero código, zero migration, zero inserção, zero promoção** |

> **A semântica da Regra 001 não é objeto desta missão e não foi tocada.** A
> ficha v2.0 permanece a autoridade material.

---

## 1. Os três gates

| Gate | Objeto | Resultado |
|---|---|---|
| **A — Autoridade documental** | `approval_adr` | 🟢 **VERDE** — instrumento lavrado: **ADR-070** |
| **B — Identidade técnica** | `approved_by` / `actor_id` | 🔴 **VERMELHO** — não existe, e já estava registrado como pendente |
| **C — Materialização** | regra existir em `PROPOSTA` | 🔴 **VERMELHO** — não há escritor; **e depende de B** |

**Promoção apta somente com A + B + C verdes.**

---

## 2. GATE A — `approval_adr`

### 2.1 A ADR-069 **não** serve, e ela mesma o diz

Confrontada a hipótese `approval_adr = ADR-069`. **Reprovada em três provas
textuais do próprio verbete:**

| # | Texto literal da ADR-069 | Consequência |
|---|---|---|
| 1 | *"**Esta ADR não autoriza implementação**: o Item 2.2B exige autorização formal de abertura pelo DT-01, e a forma física do registro, os escritores e **o pipeline de aprovação permanecem fora de escopo**."* | exclui-se expressamente da função de aprovar |
| 2 | item 7: *"entrada em `VIGENTE` e qualquer entrada em `REVOGADA` **exigem ADR**"* | **uma norma que exige ADR não pode ser a ADR que ela exige** — seria circular |
| 3 | título e objeto: *"Ciclo de vida das regras"* | governa o **movimento**, não o **conteúdo** de nenhuma regra específica |

### 2.2 Não há ADR anterior que aprove a semântica material

Varridas ADR-065, 066, 067, 068, 069, o `MODELO_CURADORIA_V1`, a Arquitetura
§10.5, os contratos 1.A e 2.C, o `REGISTRO_DE_GOVERNANCA` e o
`REGISTRO_DOS_PARECERES`.

**Nenhuma aprova o conteúdo de uma regra concreta.** Ao contrário: o
`CONTRATO_1_A` (PA-13 §10.2) declara que *"a forma da regra e sua primeira
instância **exigem lavratura própria**"* — a ausência é **deliberada**, não
lacuna.

**Não há precedente**: `derivation_rules` está vazia; nenhuma regra foi jamais
aprovada.

### 2.3 Resultado — caminho **B** do §5 da missão

> **Nova ADR específica é necessária: `ADR-070`** — primeiro número livre (o log
> termina em ADR-069).

Lavrada em [`ADR_070_APROVACAO_DA_REGRA_001.md`](ADR_070_APROVACAO_DA_REGRA_001.md):
objeto único, curta e **referencial** (não redesenha a regra; aponta para a
ficha v2.0 como autoridade material), com os vinte itens exigidos.

**Valor legítimo da coluna:**

```
approval_adr = 'ADR-070'
```

### 2.4 Por que o gate é **verde** e não amarelo

O verbete ainda não está em `DECISIONS.md` — deliberadamente, pela determinação
do próprio DT-01 registrada na ADR-069 (*"nenhum registro intermediário em
estado `PROPOSTA` foi inserido neste log append-only"*). Isso **não** deixa o
gate aberto, porque:

> **Aprovar a ADR-070 e promover a Regra 001 são o mesmo momento.** A ADR **é** o
> ato de aprovação. Não há um "antes" operacional em que ela deva estar inscrita
> — a inscrição do verbete integra o ato do DT-01, junto com a transição.

O instrumento existe, está completo e tem número. **Nada falta a produzir aqui.**

---

## 3. GATE B — identidade técnica da Autoridade

### 3.1 A autoridade normativa existe

`REGISTRO_DE_GOVERNANCA.md` §1.1 — **DP-4 fechada em 2026-08-05**: ocupante
**`DT-01 — Fundador`**, situação **ATIVA**, acumulação temporária, escopo Regras
de Derivação da Curadoria 2.0. Autoridade conferida: *aprovar regra · promover
para `VIGENTE` · suspender · reativar · revogar*.

### 3.2 A identidade técnica **não** existe — registrado pelo próprio ato de nomeação

O mesmo §1.1, no ato que nomeou o DT-01, já dizia:

> *"**Vínculo técnico:** o padrão vigente exige identificador técnico para a
> autoria dos atos. Ele **não está documentado neste repositório**, e não é
> inventado aqui: fica registrado como **vínculo técnico pendente de resolução
> operacional**, sem alterar a validade da nomeação humana."*

**Verificação independente feita nesta missão — nada mudou desde 2026-08-05:**

| Verificação | Resultado |
|---|---|
| identidade humana semeada em migration | **nenhuma** — `curadoria.profiles` só recebe linha pelo trigger de signup real |
| papel/capability nomeando a Autoridade de Método no banco | **não existe** — `AUTORIDADE_DE_METODO` aparece apenas como valor de `CHECK` em `derivation_rule_transitions.authority`, nunca como papel atribuível |
| UUID do DT-01 em qualquer documento | **nenhum** |
| ADR-069, 5ª ressalva | *"Autoridade de Método vaga até a DP-4 ser fechada"* — a **nomeação** foi resolvida; o **vínculo técnico**, não |

### 3.3 Papel ≠ identidade — e a proibição é expressa

O §1.1 lista o que a nomeação **não** autoriza:

| # | Proibição |
|---|---|
| 1 | `service_role` como autoridade humana |
| 2 | conta técnica sem vínculo com o DT-01 |
| 3 | delegação informal |
| 4 | aprovação pelo Implementador |

**Nenhum UUID foi inventado. Nenhuma fixture foi usada.**

### 3.4 A consequência que ninguém tinha medido: **B bloqueia até o nascimento**

Duas colunas `NOT NULL` fecham o caminho **antes** da promoção:

| Coluna | Definição real | Ato que exige |
|---|---|---|
| `derivation_rules.proposed_by` | `uuid **not null**` | **nascimento** |
| `derivation_rule_transitions.actor_id` | `uuid **not null**` | **nascimento** e promoção |

> **Nenhuma regra pode sequer nascer sem uma identidade técnica real.** O GATE B
> não é apenas o gate da promoção — é o gate do primeiro insert.

**Atenuação real:** o nascimento aceita `authority = 'PAPEL_INTERNO'` (constraint
`derivation_rule_transitions_papel_interno_so_propoe`: papel interno **só**
propõe). Ou seja, o nascimento pode usar a identidade de **qualquer papel interno
legítimo** — não precisa ser a do DT-01. **Só a promoção exige o DT-01.** Mas
**nenhuma** identidade humana está documentada neste repositório, então hoje as
duas faltam.

### 3.5 Ato mínimo para constituir o vínculo

**Classificação: `cadastro operacional` + `decisão de governança`.
Não é migration. Não é código.**

| Passo | Quem | O quê |
|---|---|---|
| 1 | **DT-01** | designar **qual conta real** (a que já usa no sistema) o representa como Autoridade de Método |
| 2 | **Responsável de engenharia** | verificar operacionalmente que a conta existe e obter seu identificador em `curadoria.profiles` — **sem divulgar credencial** |
| 3 | **Agente 02** | lavrar o vínculo no `REGISTRO_DE_GOVERNANCA.md` §1.1, substituindo a nota de pendência |

**Menor pacote possível.** Nada além disso é necessário para este gate.

**Fica em aberto, e é decisão do DT-01, não desta missão:** se o **nascimento**
usará a identidade do próprio DT-01 (acumulando também o papel de propositor) ou
a de outro papel interno. A segunda opção reduz a acumulação já declarada como
risco aceito (ADR-068 item 6 / RA-1 do PA-2).

---

## 4. GATE C — materialização em `PROPOSTA`

### 4.1 Não existe escritor — e isso é intencional

| Verificação na fonte | `derivation_rules` | `derivation_rule_transitions` |
|---|---|---|
| RLS habilitada | **sim** | **sim** |
| policies | **zero** | **zero** |
| `grant` a qualquer papel | **zero** — nem `service_role` | **zero** |
| função escritora / RPC | **nenhuma** | **nenhuma** |
| `UPDATE` / `DELETE` | **recusados por trigger** (MR1.1), para todo papel | **recusados por trigger** |

O comentário da própria tabela declara: *"Item 2.2B: **INERTE** — RLS
habilitada, zero policies, nenhum grant a papel de aplicação. **Nenhum escritor
nasce aqui.**"*

O repositório concede `grant all … to service_role` tabela a tabela, dezenas de
vezes. **Estas duas foram deliberadamente deixadas de fora.**

> **Não invento writer.** O único caminho legítimo hoje é uma **migration**
> (executada com privilégio de dono, fora de RLS) — o que torna o GATE C um ato
> de **engenharia**.

### 4.2 O rito de nascimento, na estrutura real

**Nascimento = DOIS `INSERT` numa ÚNICA transação.** Não são dois atos: o
trigger `derivation_rules_exige_transicao_inicial` é **constraint trigger
deferido** — *"nascimento entra na mesma transação, em qualquer ordem, e no
COMMIT o par precisa estar completo"*. Versão sem ato de nascimento é recusada
no commit.

**INSERT 1 — `curadoria.derivation_rules`**

| Coluna | Valor | Fundamento |
|---|---|---|
| `rule_id` | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA` | ADR-070 §2 · sem restrição de formato; primeira regra, estabelece a convenção |
| `version` | `1` | `check (version >= 1)` |
| `state` | `PROPOSTA` | **obrigatório** — `check (state = 'PROPOSTA')` |
| `effective_from` | **`null`** | §4.4 |
| `effective_to` | **`null`** | não há fim a declarar |
| `proposed_by` | **⛔ GATE B** — identidade de papel interno | `uuid not null` |
| `approved_by` | **`null`** | §4.3 |
| `approval_adr` | **`null`** | §4.3 |
| `rationale` | texto do §5 | `not null`, não vazio |
| `evidence` | texto do §6 | `not null`, não vazio |
| `suspended_or_revoked_at` | `null` | não se aplica |
| `created_at` | `default now()` | fato |

**INSERT 2 — `curadoria.derivation_rule_transitions`**

| Coluna | Valor | Fundamento |
|---|---|---|
| `rule_id` / `rule_version` | mesma chave | FK `restrict` dos dois lados |
| `seq` | **`1`** | `(from_state is null) = (seq = 1)` |
| `from_state` | **`null`** | nascimento não tem origem |
| `to_state` | **`PROPOSTA`** | grafo fechado |
| `vigencia_seq` | **`null`** | `(vigencia_seq is not null) = (to_state = 'VIGENTE')` |
| `actor_id` | **⛔ GATE B** | `uuid not null` |
| `authority` | **`PAPEL_INTERNO`** | *"qualquer papel interno propõe"*; a constraint o **restringe ao nascimento** |
| `reason` | motivo do nascimento, não vazio | `not null` — *"registrado sem porquê é carimbo"* |
| `approval_adr` | **`null`** | exigida só em `VIGENTE`/`REVOGADA` |
| `emergency_justification` | **`null`** | exclusiva do freio do Curador |
| `occurred_at` | `default now()` | fato, nunca chave de ordenação |

**Append-only garantido** pelos triggers `recusa_alteracao_de_regra` nas duas
tabelas — `UPDATE`/`DELETE` recusados para todo papel, inclusive `service_role`.

### 4.3 `approved_by` e `approval_adr` **na tabela da regra**: permanecem nulos

Achado estrutural que muda o desenho da execução:

1. A ADR-069 tornou `derivation_rules.state` **registro imutável do nascimento** —
   e a constraint o fixa em `PROPOSTA` **para sempre**. Logo
   `derivation_rules_vigente_exige_autoridade` é **vacuamente verdadeira** — a
   própria ADR-069 o registra na Consequência.
2. **MR1.1 recusa `UPDATE`.** Portanto essas duas colunas **nunca poderão ser
   preenchidas depois do nascimento**.
3. Preenchê-las **no** nascimento afirmaria uma aprovação que ainda não ocorreu.

> **Conclusão:** as duas colunas ficam **`null` permanentemente**, e isso é
> **correto, não perda**. Pela doutrina da ADR-069 — *"a versão é fato; a
> transição é ato"* — aprovar é **ato**, e o registro vinculante do aprovador é
> `derivation_rule_transitions.actor_id` + `.approval_adr` na transição de
> promoção, onde o banco **exige** ambos.

### 4.4 `effective_from`: nulo em `PROPOSTA`

Nulo no nascimento — regra em `PROPOSTA` não vigora, e *"fora da vigência, não
propõe"*. **Não backdatear.** A constraint `vigencia_coerente` só exige
`effective_to > effective_from`; nada obriga preenchimento em `PROPOSTA`.

**Ressalva a decidir na promoção:** `MR1.1` impede preencher
`derivation_rules.effective_from` depois. O início real da vigência fica
registrado no `occurred_at` da transição `PROPOSTA → VIGENTE` — coerente com a
doutrina do §4.3, e é o que a leitura derivada `derivation_rule_state()` usa.

### 4.5 O rito de promoção — `PROPOSTA → VIGENTE`

**Um único `INSERT`** em `derivation_rule_transitions`:

| Coluna | Valor | Guarda que o exige |
|---|---|---|
| `seq` | **`2`** | monotonicidade: `seq = anterior + 1` |
| `from_state` | **`PROPOSTA`** | cadeia: precisa igualar o `to_state` anterior |
| `to_state` | **`VIGENTE`** | grafo fechado |
| `vigencia_seq` | **`1`** | *(vigências fechadas + 1)*, calculado pelo trigger |
| `actor_id` | **⛔ GATE B — o DT-01** | `not null` |
| `authority` | **`AUTORIDADE_DE_METODO`** | `PAPEL_INTERNO` **não pode** (só nascimento); `CURADOR_DO_CASE` só freia |
| `reason` | motivo da promoção | `not null` |
| `approval_adr` | **`ADR-070`** | `derivation_rule_transitions_adr_quando_exigida` |
| `emergency_justification` | **`null`** | exclusiva do Curador |

**Unicidade:** o índice único parcial `derivation_rule_transitions_uma_vigente_por_regra`
arbitra — duas promoções concorrentes calculam o mesmo `vigencia_seq` e
**colidem**; uma vence, a outra falha. Nunca "a última ganha".

**Nascimento ≠ promoção:** são transições distintas, com `seq`, `authority` e
exigência de ADR diferentes. **Nunca no mesmo ato.**

## 5. `rationale` — conteúdo correto

> Primeira regra material da Curadoria 2.0, **PROVISÓRIA**. Alvo escolhido pelo
> DT-01 após a classificação por natureza funcional dos nove conceitos
> automáticos (`CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md`), que apontou
> `CONTINUIDADE_COORDENACAO` como candidato nº 1 — conduta clínica do
> profissional, com negativa canônica explícita, independente do Case e do
> Concierge. Semântica deliberadamente **conservadora**: afirma `CONFIRMADO` só
> diante de conduta direta declarada, `NAO_CONFIRMADO` só diante da negativa
> explícita, e cala em todos os demais casos (P-04). Nasce para ser **observada**
> sob R-1 — em especial a frequência de `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`
> isolada. **Revisão somente por versão nova; jamais por atualização silenciosa
> (MR1.1).**

## 6. `evidence` — a distinção que o campo exige

`derivation_rules.evidence` é a evidência **metodológica que justifica a
existência da regra** — **nunca** a `practice_evidence` de um profissional
concreto (essa é vinculada por `evidence_id` em cada proposta, individualmente).

> Catálogo Canônico 1.1.0, conceito `CONTINUIDADE_COORDENACAO`: cinco opções
> profissionais, negativa explícita `ATUA_DE_FORMA_INDEPENDENTE`, fonte
> `entrevista`, `satisfied_by` ausente. Protocolo da Prática Profissional, Q9.
> Ficha `REGRA_001_CONTINUIDADE_COORDENACAO.md` v2.0 (autoridade material).
> `CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md`. `CONTRATO_1_A` (PA-13) e
> `CONTRATO_2_C` (PA-17). ADR-070. **Nenhuma operação real observada até esta
> data** — e dizê-lo é melhor do que omitir.

## 7. Ficha de materialização — consolidada

| Campo | Valor ou origem legítima |
|---|---|
| `rule_id` | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA` |
| `version` | `1` |
| estado inicial | `PROPOSTA` (constraint) |
| `effective_from` | `null` |
| `effective_to` | `null` |
| `proposed_by` | **⛔ GATE B** — identidade de papel interno |
| `approved_by` | `null` **permanentemente** (§4.3) |
| `approval_adr` (tabela da regra) | `null` **permanentemente** (§4.3) |
| `approval_adr` (transição de promoção) | **`ADR-070`** |
| `rationale` | §5 |
| `evidence` | §6 |
| `suspended_or_revoked_at` | `null` |
| `created_at` | `default now()` |
| transição de nascimento | `seq=1` · `null→PROPOSTA` · `PAPEL_INTERNO` · `actor_id` **⛔ GATE B** |
| transição de promoção | `seq=2` · `PROPOSTA→VIGENTE` · `AUTORIDADE_DE_METODO` · `vigencia_seq=1` · `actor_id` **⛔ GATE B** |

**Nenhum valor inexistente foi preenchido por inferência.** As três lacunas são
a mesma: **GATE B**.

## 8. Perguntas obrigatórias

| # | Resposta |
|---|---|
| 1 | **Não** |
| 2 | Ela se exclui em texto (*"não autoriza implementação… o pipeline de aprovação permanece fora de escopo"*), **exige** ADR na entrada em `VIGENTE` — não pode ser a ADR que exige — e governa o **movimento**, não o conteúdo |
| 3 | **Não** — nenhuma ADR aprova o conteúdo de regra concreta; o `CONTRATO_1_A` §10.2 declara que isso **exige lavratura própria** |
| 4 | — |
| 5 | — |
| 6 | **Sim** |
| 7 | **ADR-070** — o log termina em ADR-069 |
| 8 | *Aprovação da Regra Material 001 — Continuidade / Coordenação*. Objeto único |
| 9 | **Sim** — curta e **referencial**: aponta a ficha v2.0 como autoridade material |
| 10 | **`DT-01 — Fundador / Autoridade de Método`** |
| 11 | **Sim** — DP-4 fechada em 2026-08-05, situação **ATIVA** |
| 12 | **Não** |
| 13 | A fonte que a governaria é `curadoria.profiles`, alimentada por signup real — **nenhuma linha do DT-01 documentada aqui**; o §1.1 já registrava a pendência em 2026-08-05 |
| 14 | **Não hoje** |
| 15 | **Não hoje** |
| 16 | Designação da conta real pelo DT-01 + verificação operacional + lavratura do vínculo no §1.1 (§3.5) |
| 17 | **DT-01** designa · **Responsável de engenharia** verifica · **Agente 02** lavra |
| 18 | **Não** — zero policies, zero grants (nem `service_role`), nenhuma RPC. Inércia **deliberada** |
| 19 | **Dois `INSERT` numa única transação** — regra + transição `seq=1`; o constraint trigger deferido valida o par no COMMIT (§4.2) |
| 20 | Os das duas tabelas em §4.2 |
| 21 | **Sim — e permanentemente** (§4.3) |
| 22 | **Sim — e permanentemente** (§4.3). O aprovador vinculante é `actor_id` da transição de promoção |
| 23 | **Sim** (§4.4) |
| 24 | `authority = 'PAPEL_INTERNO'`, `seq=1`, `null→PROPOSTA`, sem ADR |
| 25 | `authority = 'AUTORIDADE_DE_METODO'`, `seq=2`, `PROPOSTA→VIGENTE`, `vigencia_seq=1`, `approval_adr='ADR-070'` |
| 26 | §5 |
| 27 | §6 |
| 28 | **Não** — nenhum impedimento além de A/B/C. A semântica está fechada e CD-1 intacta |
| 29 | **Não.** O GATE C exige **migration** — não há escritor. E o GATE B precisa vir **antes**, porque `proposed_by` e `actor_id` são `NOT NULL` |
| 30 | **`DT-01 — FUNDADOR / AUTORIDADE DE MÉTODO`** — só ele pode designar a conta que o representa |

## 9. CD-1 e R-1

**CD-1 — `INTACTA`.** Nada nesta missão tocou a ponte grau→importância: nenhuma
linha em `derivation_rule_degree_map`, nenhum valor Case-side, nenhuma
estabilização. A Regra 001 é do lado profissional e não povoa a ponte.

**R-1 — `ABERTA`.** Nenhuma observação real começou: a regra não existe como
dado, nenhuma proposta foi emitida, o emissor do 2.C segue retornando
`SEM_REGRA_VIGENTE`.

## 10. Veredito

> ### PRÉ-FLIGHT — BLOQUEADO EM GATE B
>
> **GATE A 🟢** — `approval_adr = 'ADR-070'`, instrumento lavrado e completo.
>
> **GATE B 🔴** — não existe identidade técnica do DT-01. Pendência **já
> registrada em 2026-08-05** pelo próprio ato de nomeação; nada mudou.
>
> **GATE C 🔴** — não há escritor legítimo (zero policies, zero grants, nenhuma
> RPC) **e o gate depende de B**: `proposed_by` e `actor_id` são `NOT NULL`,
> então **nem o nascimento ocorre sem identidade**.
>
> **Ato mínimo, único e suficiente para destravar o próximo passo:**
> **o DT-01 designar qual conta real o representa como Autoridade de Método** —
> verificada pelo Responsável de engenharia e lavrada no §1.1. **Não é
> migration, não é código, não abre pacote algum.**
>
> Com B resolvido, o GATE C vira uma migration de duas linhas em uma transação,
> e a promoção vira um `INSERT` — ambos já integralmente especificados aqui.
