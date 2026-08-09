# ADR-070 — Aprovação da Regra Material 001 · Continuidade / Coordenação

| Campo | Valor |
|---|---|
| **Número** | **ADR-070** — primeiro número livre (o log vai até ADR-069) |
| **Objeto único** | aprovar o **conteúdo** da Regra Material 001, versão 1 |
| **Autoridade aprovadora** | **`DT-01 — Fundador / Autoridade de Método`** (DP-4 fechada em 2026-08-05) |
| **Redação** | Agente 02 — Arquiteto da Curadoria 2.0, 2026-08-08 |
| **Status** | ✅ **APROVADA E LAVRADA pelo DT-01 em 2026-08-08.** Inscrita em [`DECISIONS.md`](../DECISIONS.md) |
| **Identidade técnica do aprovador** | `54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b` (`REGISTRO_DE_GOVERNANCA.md` §1.1) |
| **Base do ato** | `f1a7060` — a Regra 001 **já existe em produção**, em `PROPOSTA` |

---

## 1. Contexto

O `CONTRATO_1_A` (PA-13 §10.2) registrou que *"a forma da regra e sua primeira
instância exigem lavratura própria"*, e o emissor profissional do
`CONTRATO_2_C` (PA-17) nasceu **vazio-honesto** porque nenhuma regra existe:
seu DR3 diz, no código, que o conjunto de candidatas é *"vazio por construção"*
até que a Autoridade de Método lavre a primeira.

A ficha [`REGRA_001_CONTINUIDADE_COORDENACAO.md`](REGRA_001_CONTINUIDADE_COORDENACAO.md)
v2.0 fechou essa semântica. Falta o instrumento que a **aprove**.

**A ADR-069 não serve para isso** — e o diz de si mesma: *"Esta ADR não autoriza
implementação… a forma física do registro, os escritores e o pipeline de
aprovação permanecem fora de escopo."* Mais decisivo: seu §12 **exige uma ADR**
na entrada em `VIGENTE`. Uma norma que exige ADR não pode ser a ADR que ela
mesma exige. **Esta é essa ADR.**

## 2. Decisão

Fica **aprovado o conteúdo** da regra abaixo, para nascer em `PROPOSTA`:

| Campo | Valor |
|---|---|
| **`rule_id`** | **`CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`** |
| **`version`** | **1** |
| **Conceito** | **`CONTINUIDADE_COORDENACAO`**, catálogo **1.1.0** |
| **Lado** | **profissional** — independente do Case |
| **Maturidade** | **PROVISÓRIA** |

### 2.1 Semântica aprovada — por referência normativa

A semântica aprovada é **integralmente** a da ficha
[`REGRA_001_CONTINUIDADE_COORDENACAO.md`](REGRA_001_CONTINUIDADE_COORDENACAO.md)
**v2.0**, que permanece a **autoridade material** do conteúdo. Esta ADR
**aprova**; a ficha **normatiza**. Não se reproduz aqui o que lá está lavrado.

Fixam-se, para leitura direta, os cinco desfechos:

| Entrada | Saída |
|---|---|
| ≥1 de `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`, `ENVIA_RELATORIO_ESCRITO`, `PARTICIPA_DE_DISCUSSAO_DE_CASO` | **`CONFIRMADO`** |
| `ATUA_DE_FORMA_INDEPENDENTE`, sem conduta direta | **`NAO_CONFIRMADO`** |
| `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` **isolada** | **`NENHUMA_PROPOSTA`** |
| ausência de evidência, ou `options` vazio | **`NENHUMA_PROPOSTA`** |
| conduta direta **+** `ATUA_DE_FORMA_INDEPENDENTE` | **`NENHUMA_PROPOSTA`** · `EVIDENCIA_CONTRADITORIA` |

**`NAO_INFORMADO` não é derivado na v1** — o conceito não possui opção canônica
legítima para esse estado, e o estado de governança `nao_localizado` não pode
ocupar esse lugar (I-5).

### 2.2 Limites — o que a regra afirma

> Existe evidência profissional estruturada e versionada de conduta de
> coordenação — ou de atuação independente — **suficiente para sustentar uma
> proposta de estado**.

### 2.3 Limites — o que a regra **não** afirma

Qualidade global · competência clínica · melhor cuidado · melhor médico ·
eficiência · rapidez · resultado clínico · integração perfeita · superioridade ·
ranking · score · recomendação · adequação global ao Case.

**`NAO_CONFIRMADO` não é juízo sobre o profissional.**

### 2.4 Princípios preservados

| Princípio | Como |
|---|---|
| **P-04** | quatro dos cinco desfechos terminam em `NENHUMA_PROPOSTA`; lacuna nunca vira "não atende". A decisão sobre `ORIENTA…` **é** P-04 aplicado |
| **I-5** | os cinco estados de `verification_status` acompanham a proveniência e **nenhum** é traduzido em vocabulário de correspondência |
| **CD-1** | **intacta** — zero ponte grau→importância, zero linha em `derivation_rule_degree_map`, zero valor Case-side, zero `satisfied_by` |
| **Independência do Case** | a regra lê **apenas** `practice_evidence` do par (profissional, conceito) |
| **ADR-068** | a proposta **não** escreve no Mapa: a Fronteira Humana confirma ou recusa |

### 2.5 Vínculo com o Modelo

A regra realiza a Autoridade de Método sobre Regras de Derivação da
**Arquitetura §10.5**, dentro do regime do
[`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md): **um estado por conceito,
sem peso, sem nota, sem score**.

### 2.6 R-1 permanece **ABERTA**

Esta aprovação **não** encerra o risco dominante *"a proposta vira decisão
automática disfarçada"*. A regra nasce para ser **observada**. Observável
principal: a frequência de `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` isolada — mede
o custo empírico da decisão de método tomada em 2026-08-08.

### 2.7 Revisão

Revisão **jamais** por atualização silenciosa: **somente por versão nova**
(MR1.1 recusa `UPDATE` e `DELETE` em `derivation_rules` para todo papel,
inclusive `service_role`).

## 3. Autorização de promoção

Fica **autorizada** a promoção `PROPOSTA → VIGENTE` da versão 1 **pelo rito da
ADR-069**, e **somente** por ele.

Esta ADR **é** o valor legítimo de `approval_adr` exigido pela constraint
`derivation_rule_transitions_adr_quando_exigida` na entrada em `VIGENTE`:

```
approval_adr = 'ADR-070'
```

**A autorização não é execução.** A promoção continua exigindo o ato próprio da
Autoridade de Método, com `actor_id` real, `authority = 'AUTORIDADE_DE_METODO'`
e motivo — e **está bloqueada** enquanto o vínculo técnico da Autoridade não
existir (GATE B do pré-flight).

## 4. O que esta ADR **não** abre

Catálogo · Concierge · Formação · Experiência · Histórico · matriz de
cruzamento · outras regras · o Item 2.5 (proibido enquanto DP-5 estiver aberta)
· qualquer reabertura da semântica da Regra 001.

**Uma ADR, um objeto.**

## 5. Separação de autoridades

| Pergunta | Instrumento |
|---|---|
| *"esta regra e esta semântica estão aprovadas?"* | **ADR-070** (esta) |
| *"como esta versão passa de `PROPOSTA` a `VIGENTE`, `SUSPENSA` ou `REVOGADA`?"* | **ADR-069** |

Não se misturam: a ADR-069 governa o **movimento**; esta governa o **conteúdo**
que se move.

## 6. Consequência

Com esta ADR aprovada e o vínculo técnico resolvido, a Regra 001 pode nascer e,
em ato posterior e separado, ser promovida. No momento em que for `VIGENTE`, o
conceito `CONTINUIDADE_COORDENACAO` **deixa o ramo `NAO_SUPORTADO`** do
`CONTRATO_1_A` §7, e o DR3 do emissor do `CONTRATO_2_C` passa a ter candidata —
por **emenda própria**, nunca por edição silenciosa.

**Nada disso acontece pela existência desta ADR.** Ela aprova; não executa.

## 7. Revisitar quando

A observação de R-1 mostrar que a semântica conservadora produz mais silêncio do
que informação — em especial se `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` isolada
for frequente. **A resposta correta será uma versão 2, nunca a edição desta.**

## 8. Dependências

`REGRA_001_CONTINUIDADE_COORDENACAO.md` v2.0 (autoridade material) ·
`CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md` (escolha do alvo) · ADR-069 (ciclo) ·
ADR-066 (propostas) · ADR-067 (juízo humano) · ADR-068 (autoridade de
confirmação) · `CONTRATO_1_A` (PA-13) · `CONTRATO_2_C` (PA-17) · Arquitetura
§10.5 · `CONGELAMENTO_ARQUITETURAL.md` (P-04, I-5) ·
`REGISTRO_DE_GOVERNANCA.md` §1.1 (DP-4).

## 9. Inscrição em `DECISIONS.md` — feita **agora**, e por quê

A v1.0 deste texto **não** foi inscrita no log, deliberadamente: a ADR-069
registra a determinação do próprio DT-01 de que *"nenhum registro intermediário
em estado `PROPOSTA` foi inserido neste log append-only"* (ADR-062).

**Essa condição deixou de existir.** O DT-01 pratica **agora** o ato de
aprovação, e a regra **já existe** em `PROPOSTA` no banco de produção. O
registro deixa de ser proposta de decisão e passa a ser **decisão efetiva** —
que é exatamente o que o log append-only recebe. **Data real do ato:
2026-08-08.** Nenhuma data retroativa foi usada.

---

## 10. Pré-flight documental da promoção — o pacote exato

**Nada aqui é executado.** É o conteúdo do `INSERT` único que o ato posterior
fará em `curadoria.derivation_rule_transitions`:

| Coluna | Valor | Guarda que o determina |
|---|---|---|
| `rule_id` | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA` | FK para a versão existente |
| `rule_version` | `1` | idem |
| `seq` | **`2`** | `valida_transicao_da_regra`: `seq = anterior + 1`, e a anterior é `1` |
| `from_state` | **`PROPOSTA`** | cadeia: precisa igualar o `to_state` da transição `seq=1` |
| `to_state` | **`VIGENTE`** | `grafo_fechado` — `PROPOSTA→VIGENTE` é arco permitido |
| `vigencia_seq` | **`1`** | `vigencia_seq_coerente` (obrigatório em `VIGENTE`) + o trigger calcula *vigências fechadas + 1* = **0 + 1** |
| `actor_id` | **`54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b`** | `not null` — identidade técnica lavrada do DT-01 |
| `authority` | **`AUTORIDADE_DE_METODO`** | `papel_interno_so_propoe` **proíbe** `PAPEL_INTERNO` aqui; `CURADOR_DO_CASE` só freia |
| `approval_adr` | **`ADR-070`** | `adr_quando_exigida`: obrigatório na entrada em `VIGENTE` |
| `emergency_justification` | **`null`** | `emergencia_e_do_freio`: exclusiva do Curador |
| `occurred_at` | **`default now()`** — fato, no momento real | §11.3: fato, nunca chave de ordenação |

### 10.1 `reason` canônico

> Promoção da primeira regra material da Curadoria 2.0 a VIGENTE, por ato da
> Autoridade de Método sobre a ADR-070, que aprovou o conteúdo da versão 1 nos
> termos da ficha REGRA_001_CONTINUIDADE_COORDENACAO.md v2.0. Maturidade
> metodológica PROVISÓRIA: vigente no ciclo, provisória no Método. R-1 aberta e
> ainda não iniciada — a promoção não emite proposta alguma (§10.4). Revisão
> somente por versão nova; jamais por atualização silenciosa (MR1.1).

### 10.2 `derivation_rules.approved_by` — **confirmado: não é o registro vinculante**

| Prova | Resultado |
|---|---|
| `derivation_rules_vigente_exige_autoridade` = `state <> 'VIGENTE' or (approved_by …)` | `state` está **preso em `PROPOSTA`** pela constraint `derivation_rules_nasce_em_proposta` ⇒ o CHECK é **vacuamente verdadeiro para sempre** |
| MR1.1 (`recusa_alteracao_de_regra`) | recusa `UPDATE` para **todo** papel ⇒ `approved_by` é **inalcançável** após o nascimento |
| ADR-069, Consequência | declara, em texto, que este CHECK *"torna-se vacuamente verdadeiro — o que é diferente de errado"* |
| Documento que ainda exija `approved_by` preenchido | **nenhum** |

> **Nenhuma inconsistência.** O aprovador vinculante é
> **`derivation_rule_transitions.actor_id`** com **`authority = 'AUTORIDADE_DE_METODO'`**
> e **`approval_adr = 'ADR-070'`**. É a doutrina da ADR-069 aplicada: *a versão é
> fato, a transição é ato* — e aprovar é ato.

### 10.3 `effective_from` — **onde vive a vigência temporal**

**Varredura completa por leitores de `derivation_rules.effective_from` em
migrations e código: nenhum.** As duas únicas ocorrências fora da definição da
coluna são o `insert` do nascimento (grava `null`) e um comentário.

| Pergunta | Resposta provada |
|---|---|
| Algo lê `effective_from`? | **não** |
| Alguma constraint o exige? | **não** — `vigencia_coerente` só compara `effective_to > effective_from` quando ambos existem |
| Onde vive o fato temporal vinculante? | **`derivation_rule_transitions.occurred_at`** da transição de entrada em `VIGENTE` |
| A doutrina *"fora da vigência, não propõe"* (Arquitetura §10.5) está honrada? | **sim** — o emissor testa `derivation_rule_state(...) = 'VIGENTE'`, e `SUSPENSA`/`REVOGADA` deixam de propor imediatamente |

**Conflito real: não há.** A doutrina foi preservada; **só o mecanismo mudou** de
coluna para transição, que é precisamente o que a ADR-069 decidiu.

**Duas observações honestas, nenhuma bloqueante:**

1. O comentário da coluna ainda diz *"Vigência: início e fim. 'Fora da vigência,
   não propõe'"* — promessa que a coluna **não cumpre mais**. É **comentário
   defasado**, e a ADR-069 já autorizou tratar os vestígios como decisão do
   implementador (manter como cinto de segurança ou remover).
2. Com transições, a vigência **começa quando o ato é praticado** — não é
   possível **agendar** início futuro, o que `effective_from` permitiria. É
   **consequência assumida** da ADR-069, e **nenhuma necessidade atual existe**.
   Se um dia existir, o caminho é ADR nova, não `UPDATE`.

### 10.4 A prova exigida: promoção por `INSERT` puro

> **SIM — é possível promover exclusivamente por `INSERT` na tabela de
> transições, sem nenhum `UPDATE` em `derivation_rules`.**

Prova, na fonte:

```sql
create or replace function curadoria.derivation_rule_state(_rule_id text, _version integer)
returns text language sql stable as $$
  select t.to_state
  from curadoria.derivation_rule_transitions t     -- ← lê SÓ as transições
  where t.rule_id = _rule_id and t.rule_version = _version
  order by t.seq desc
  limit 1;
$$;
```

A leitura canônica do estado **não toca `derivation_rules`**. O mesmo vale para
`derivation_rule_current_version(text)`, que deriva a versão vigente inteiramente
das transições. E o emissor da ponte confirma o uso: `and
curadoria.derivation_rule_state(r.rule_id, r.version) = 'VIGENTE'` — com o
comentário *"nunca de `derivation_rules.state`, que é o inicial"*.

**Inserida a transição `seq=2 → VIGENTE`, o estado derivado passa a `VIGENTE`
imediatamente.** Nenhum `UPDATE` é necessário — e nenhum seria possível.

### 10.5 O que a promoção **não** liga — e por que isso importa

Achado que o ato de promoção precisa carregar, para que ninguém espere efeito
que não virá:

| Emissor | Por que **não** emitirá, mesmo com a regra `VIGENTE` |
|---|---|
| **Case-side** (ponte, `b38cd34`) | seu DR3 exige linha em `derivation_rule_degree_map` para o conceito. A Regra 001 é **profissional-side** e tem **zero** linhas lá — **e CD-1 proíbe criá-las** |
| **Profissional** (`emitir_proposta_de_estado`, 2.C) | seu DR3 tem `candidatas := 0` **por construção**, e o próprio código diz: *"quando a lavratura da forma acontecer, é ELA que pluga a consulta aqui — **emenda própria, nunca edição silenciosa**"* |

> **A promoção torna a regra vigente e legalmente utilizável; ela não emite
> nada.** O emissor profissional continuará devolvendo `SEM_REGRA_VIGENTE` até a
> **emenda própria** que ligue a consulta — ato de engenharia posterior, previsto
> em texto pelo `CONTRATO_2_C`, e **fora desta ADR**.
>
> **Consequência direta: R-1 não começa na promoção.** Começa quando a emenda
> existir **e** houver `practice_evidence` real. Isso é coerência, não atraso: a
> Fronteira nasceu vazio-honesta e assim permanece até que alguém a ligue
> deliberadamente.
