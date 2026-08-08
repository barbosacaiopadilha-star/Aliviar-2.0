# ADR-070 — Aprovação da Regra Material 001 · Continuidade / Coordenação

| Campo | Valor |
|---|---|
| **Número** | **ADR-070** — primeiro número livre (o log vai até ADR-069) |
| **Objeto único** | aprovar o **conteúdo** da Regra Material 001, versão 1 |
| **Autoridade aprovadora** | **`DT-01 — Fundador / Autoridade de Método`** (DP-4 fechada em 2026-08-05) |
| **Redação** | Agente 02 — Arquiteto da Curadoria 2.0, 2026-08-08 |
| **Status** | **TEXTO LAVRADO — aguardando o ato de aprovação do DT-01.** Ainda **não** inscrita em `DECISIONS.md` (ver §9) |
| **Base** | `368fe99` |

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

## 9. Por que esta ADR ainda não está em `DECISIONS.md`

O verbete **não foi inscrito** no log, deliberadamente. A ADR-069 registra a
determinação do próprio DT-01: *"Lavrada somente após a aprovação… **nenhum
registro intermediário em estado `PROPOSTA` foi inserido neste log
append-only** (ADR-062)."*

O log é **append-only puro** — inscrever agora seria irreversível e afirmaria
uma aprovação que ainda não ocorreu. **O texto está pronto e completo aqui.** A
inscrição do verbete em `DECISIONS.md` é parte do **ato de aprovação do DT-01**,
não desta missão.
