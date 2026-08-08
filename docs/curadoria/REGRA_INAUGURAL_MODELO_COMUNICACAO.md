# Ficha Normativa — Regra Inaugural · `MODELO_COMUNICACAO_CONDUTA_DECLARADA`

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **BLOQUEADA POR SEMÂNTICA INSUFICIENTE** (§5) |
| **Base** | `fc25ff7` |
| **Decisão de origem** | **DT-01 — Fundador / Autoridade de Método**: **VIA V1 adotada** — não reclassificar `FORMACAO_RESIDENCIA`, não reabrir o território técnico humano, não alterar o `CONTRATO_1_A`, não criar exceção. Novo alvo inaugural: **`MODELO_COMUNICACAO`** |
| **Identidade** | `MODELO_COMUNICACAO_CONDUTA_DECLARADA` — `rule_id` é `text` sem convenção lexical imposta; **nenhuma adaptação necessária** |
| **Relação com a tentativa anterior** | [`REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA.md`](REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA.md) **permanece íntegra** — ver §12 |

---

## 1. Resumo executivo

A VIA V1 foi bem escolhida: `MODELO_COMUNICACAO` é **estruturalmente elegível** —
`cruzamento: automatico`, `motorParticipation: DIRETO`, opções canônicas dos dois
lados, `satisfied_by` declarado, fonte e versionamento definidos. **O emissor do
2.C o aceita.** Os três impedimentos que bloquearam a Residência **não existem
aqui**.

Resta **um**, e é o que a missão §24 chamou de questão material mais importante:
**a condição exata para `CONFIRMADO`**. A única autoridade que a define — o
`DOMINIO_COMPATIBILIDADE_RELACIONAL` §5.1, anexo canônico e congelado da ADR-065
— a define **relativamente à pessoa**, e o Mapa do Profissional guarda um estado
**absoluto**. Sem decisão da Autoridade, emitir exigiria inventar semântica.
**§24 é explícito: não inventar.**

## 2. Fonte canônica lida (não de memória)

| Atributo | Valor vigente |
|---|---|
| `code` · `group` · `axis` | `MODELO_COMUNICACAO` · `MODELO_DE_ATENDIMENTO` · `MODELO_DE_ATENDIMENTO` |
| `name` · `description` | "Como explica" · "Condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento." |
| `active` · `catalogVersion` | `true` · **1.1.0** |
| **`professionalQuestion`** | **"Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?"** |
| **`patientQuestion`** | **"O que te ajudaria a entender melhor o que for explicado?"** |
| `responseType` | **`multipla_escolha`** |
| **`cruzamento`** | **`automatico`** ✅ |
| **`motorParticipation`** | **`DIRETO`** ✅ |
| **`evidenceSource`** | **`entrevista`** |
| `reviewMonths` | **12** |

**Sete condutas profissionais** (campo `principal`, todas ativas, `satisfiedBy: null` — como esperado: `satisfied_by` é atributo do **lado da pessoa**): `ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR` · `VERIFICA_SE_A_PESSOA_COMPREENDEU` · `REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO` · `USA_APOIO_VISUAL_OU_DESENHO` · `ENVIA_RESUMO_ESCRITO` · `RESERVA_TEMPO_PARA_PERGUNTAS` · `AUTORIZA_GRAVACAO_DA_CONSULTA`.

**Seis opções da pessoa**, todas com `satisfiedBy` **preenchido**: `EXPLICACAO_SEM_TERMOS_TECNICOS` · `QUE_CONFIRMEM_SE_ENTENDI` · `ALGO_ESCRITO_PARA_LEVAR` · `DESENHO_OU_IMAGEM` · `TEMPO_PARA_PERGUNTAR` · `PODER_GRAVAR_A_CONVERSA`.

## 3. As três etapas, preservadas separadas

**A — derivação profissional**: evidência do profissional → proposta de estado
profissional *(é o objeto desta regra)*. **B — Fronteira Humana**: proposta →
confirmação/recusa humana item a item *(2.C)*. **C — cruzamento**: estado
confirmado × necessidade da pessoa → leitura de compatibilidade *(Motor)*.
**Não se colapsam** — e `satisfied_by` pertence **exclusivamente à etapa C**:
ele conecta *opção da pessoa → conduta do profissional* e **não pode ser usado
para inventar o estado profissional** (§11 da missão, preservado).

## 4. O que a regra afirmaria — e o que jamais afirma

**Afirmaria somente**: *existe uma declaração profissional estruturada, válida e
suficientemente governada de conduta pertencente ao conceito
`MODELO_COMUNICACAO`, capaz de sustentar uma proposta de estado profissional nos
limites definidos pelo Método.* Como a fonte é **`entrevista`** — autodeclaração
estruturada —, a formulação honesta é **"o profissional declarou adotar esta
conduta"**, nunca "o profissional efetivamente sempre a adota".

**Não afirma**: bom comunicador · empatia · comunica-se melhor que outro · que a
paciente compreenderá · que a consulta será satisfatória · que a conduta ocorre
em 100% dos atendimentos · qualidade clínica · competência médica · ranking ·
score · superioridade · recomendação · adequação global ao Case · resultado
clínico.

**Preferência da pessoa não altera a verdade do estado profissional**: ele pode
declarar `ENVIA_RESUMO_ESCRITO` independentemente de a paciente querer resumo —
o desejo dela entra só na etapa C.

## 5. A questão material — e o bloqueio

**Q-G1, respondida na fonte.** `professional_subcriterion_map` tem
`unique (professional_profile_id, subcriterion_id)` — **um estado por
(profissional, conceito)**, sem `case_id`: o estado é **absoluto e por
subcritério**, nunca por opção.

**A única autoridade que define `CONFIRMADO` para este conceito**
([`DOMINIO_COMPATIBILIDADE_RELACIONAL.md` §5.1](DOMINIO_COMPATIBILIDADE_RELACIONAL.md),
anexo canônico **congelado** da ADR-065):

| Situação da evidência | Estado derivado |
|---|---|
| Nenhuma evidência vigente do conceito | `NAO_INFORMADO` |
| Evidência vigente, mas **alguma opção pedida pela pessoa** está sem conduta correspondente | `NAO_CONFIRMADO` |
| **Toda opção pedida** tem conduta correspondente | `CONFIRMADO` |

E é assim que o código a implementa: `deriveRelationalState(concept,
**personOptions**, evidence)` ([`motor-relacional.ts:193`](../../src/modules/curadoria/motor-relacional.ts)).

> **O impedimento, em uma frase:** o único `CONFIRMADO` lavrado para
> `MODELO_COMUNICACAO` é **relativo à pessoa**; o Mapa guarda um estado
> **absoluto**. Não existe autoridade que diga o que `CONFIRMADO` significa sem
> uma pessoa na frente.

**Três consequências que impedem contornar por arquitetura:**

1. **Usar a semântica da ADR-065 exigiria `case_needs`** — o que violaria o §21
   da missão (*a preferência da pessoa não altera o estado profissional*), a
   assinatura do emissor do 2.C (só `professional_profile_id` + `subcriterion_code`,
   sem Case) e **CD-1**.
2. **Inventar uma condição absoluta** ("ao menos uma conduta") é o que §24 proíbe
   — e ela colidiria com `NAO_INFORMADO`: "respondeu a pergunta" não é
   "confirmado".
3. **Tensão normativa real a decidir**: a ADR-065 §5.1 declara que, em múltipla
   escolha respondida, **a conduta não marcada é fato declarado** ("não é
   habitual") — enquanto o §14 desta missão determina **não** derivar
   `NAO_CONFIRMADO` por ausência de opção. As duas são defensáveis; **só a
   Autoridade escolhe**.

*(Achado que amplia a decisão: o padrão separa os nove automáticos em dois
grupos. **Com `satisfied_by` no lado da pessoa** — os relacionais, incluindo
`MODELO_COMUNICACAO` e `MODELO_PARTICIPACAO_FAMILIAR` — o estado é pairwise por
lavratura. **Sem `satisfied_by`** — `ACESSO_MODALIDADE`, `ACESSO_DISPONIBILIDADE`,
`CONTINUIDADE_CANAIS` (verificados; `satisfiedBy: null` no lado da pessoa) — não
há semântica pairwise lavrada, e o estado absoluto **também não** está definido:
a lacuna é da mesma família, mas sem a tensão do item 3.)*

## 6. Casos de teste conceituais

| Caso | Situação | Resultado |
|---|---|---|
| **A** | conduta canônica válida declarada, evidência suficiente | **indeterminado** — depende da condição do §5 |
| **B** | nenhuma evidência | **nenhuma proposta** ✅ decidido (ausência nunca emite) |
| **C** | evidência fora de `MODELO_COMUNICACAO` | **recusa estrutural** ✅ (FK composta + validação de conceito, já implementadas) |
| **D** | código de opção inexistente | **entrada inválida** ✅ (validação do Catálogo na porta de escrita da evidência) |
| **E** | versão de catálogo antiga | ✅ regime vigente: a proposta grava `catalog_version` da emissão — *permite reler sem reinterpretar* |
| **F** | evidência não verificada | **decisão pendente** — ver §7 |
| **G** | resposta "não sei informar" | **não existe** entre as sete condutas; e `NAO_INFORMADO` exige **evidência positiva** que declare a não-informação (CONTRATO_1_A §5, registro vinculante PA-13) — **nunca ausência** |
| **H** | múltiplas condutas positivas | **indeterminado** (§5) |
| **I** | uma dentre sete | **indeterminado** — é exatamente a pergunta do §5 |
| **J** | nenhuma conduta marcada | **não presumir `NAO_CONFIRMADO`** — e aqui vive a tensão do §5 item 3 |

## 7. Estado de verificação — segunda decisão pendente (menor)

`practice_evidence` distingue `collected_by`/`collected_at` (sempre) de
`verified_by`/`verified_at`/`verification_source` (obrigatórios por constraint
quando `status = 'verificado'`). Para fonte **`entrevista`** — autodeclaração —,
"verificar" tem significado próprio que **a política vigente não define**. A
missão manda **não inventar política nova**. Recomendação do Arquiteto, se a
Autoridade quiser decidir junto: **admitir evidência não verificada**, com o
estado de verificação **acompanhando a proposta sem contaminar a conclusão**
(I-5) — porque exigir verificação de uma autodeclaração de conduta tornaria a
regra inerte na prática. **Decisão da Autoridade.**

## 8. Proveniência e versionamento — sem lacuna

A proposta apontaria imutavelmente para `rule_id` · `rule_version` ·
`evidence_id` · `evidence_version` · `catalog_version` · `origin_record`
(`practice_evidence:<id>`) · `origin_author` · `origin_declared_at` ·
`emitted_at`. **Ponteiro, nunca busca retrospectiva** (C-01c). Evidência
contraditória: resolvida pelo regime vigente (corrente = `max(version)`, a única
regra de composição lavrada — PA-13 §8); contradição material remanescente ⇒
**não emitir**.

## 9. Fronteiras preservadas

**A matriz permanece intocada** — nenhuma célula alterada. **`satisfied_by`
intocado** — nenhuma correspondência criada, removida ou modificada. **Estado ≠
compatibilidade**: `CONFIRMADO`/`NAO_CONFIRMADO`/`NAO_INFORMADO` são do lado
profissional; `ALTA`/`MEDIA`/`LACUNA_DE_INFORMACAO`/`NAO_RELEVANTE` são do
cruzamento — a regra **nunca** devolve resultado de compatibilidade.
**`curator_judgments` separado**. **FORMACAO/EXPERIENCIA/HISTORICO permanecem
humanos** — nada reaberto.

## 10. CD-1 — prova de independência

A regra **não usa** `case_needs.degree` · **não usa** importância · **não usa**
`derivation_rule_degree_map` · **não faz** ponte grau→importância · **não cria**
valores Case-side. **É profissional-side autônoma. CD-1 intacta.** *(E é
precisamente por manter essa autonomia que a semântica pairwise da ADR-065 não
pode ser usada aqui — ela precisaria da pessoa.)*

## 11. R-1 e roadmap

**R-1 — INSTRUMENTADA / MITIGADA / NÃO RESOLVIDA.** A primeira regra é
**experimento operacional governado**, não prova de validade. Observar:
confirmações · recusas · **motivos** das recusas · ambiguidades · comportamento
das evidências · se o Curador entende a explicação · coerência do cruzamento
posterior. **Zero recusa não é sucesso automático** — é alarme. Nenhum threshold
criado.

**Roadmap** (não cristalizado além da inaugural): 1) `MODELO_COMUNICACAO`;
2) próximo conceito `automatico` **só após aprendizado**; 3) **nunca promover
vários juntos**; 4) FORMAÇÃO/EXPERIÊNCIA/HISTÓRICO continuam humanos; 5) R-1
orienta a evolução.

## 12. Situação da tentativa anterior — convenção documental

A ficha da Residência **não é apagada nem renumerada**. Convenção adotada,
coerente com a do repositório (documentos nomeados pelo **objeto**, não por
sequência — `CONTRATO_1_8_R1`, `CONTRATO_2_C`…): **esta ficha recebe identidade
própria pelo conceito** (`REGRA_INAUGURAL_MODELO_COMUNICACAO`), e a anterior
permanece como **tentativa inaugural bloqueada**, registrada no índice. Nenhuma
convenção nova foi inventada; o histórico fica legível na ordem em que aconteceu.

## 13. Perguntas obrigatórias

| # | Resposta |
|---|---|
| Q1 | **SIM** — ativo, catálogo 1.1.0 |
| Q2 | **SIM** — `cruzamento: automatico` |
| Q3 | **SIM** — é um dos nove |
| Q4 | **SIM** — redação vigente transcrita no §2 |
| Q5 | **SIM** — sete condutas canônicas ativas |
| Q6 | **SIM** — redação vigente transcrita |
| Q7 | **SIM** — seis opções |
| Q8 | **SIM** — todas as seis com `satisfiedBy` preenchido |
| Q9 | **SIM** — guarda F-02 (hash recomputado) e portão de paridade verdes |
| Q10 | **SIM** — `options text[]` + `details jsonb`, com validação contra o catálogo na porta de escrita |
| Q11 | **evidência por (profissional, conceito, versão)**; as condutas vivem em `options[]` — a unidade da **evidência** é o conceito, a das **condutas** é a opção |
| Q12 | **NÃO DECIDIDA** — a única definição existente é **pairwise** (§5). **É o bloqueio** |
| Q13 | **indeterminado** — pertence à Q12 |
| Q14 | **indeterminado** — pertence à Q12 |
| Q15 | **NÃO por ausência simples** (§14 da missão) — mas há **tensão lavrada** com a ADR-065 §5.1, que só a Autoridade resolve |
| Q16 | **NÃO** — ausência de evidência nunca emite |
| Q17 | **SIM** — exige evidência positiva que declare a não-informação |
| Q18 | **decisão pendente** (§7); recomendação: sim, com o estado acompanhando |
| Q19 | **SIM** — §8 |
| Q20 | **SIM** — só estado profissional |
| Q21 | **SIM** — cruzamento é etapa posterior |
| Q22 | **SIM** — `satisfied_by` é correspondência, nunca derivação |
| Q23 | **SIM** — matriz intocada |
| Q24 | **SIM** — separado |
| Q25 | **SIM** — permanece humana |
| Q26 | **SIM** — CD-1 intacta |
| Q27 | **SIM** — R-1 aberta |
| Q28 | **SIM** — duas: a condição de `CONFIRMADO` (§5, **bloqueante**) e o estado de verificação (§7, menor) |
| Q29 | **provável** — fixar a semântica do estado absoluto de um conceito do bloco relacional **congelado** pela ADR-065 tende a exigir ADR (ou emenda ao anexo); a Autoridade decide a forma |
| Q30 | **NÃO** — ver veredito |

## 14. Veredito

> ### `MODELO_COMUNICACAO` — REGRA INAUGURAL BLOQUEADA POR SEMÂNTICA INSUFICIENTE

**Decisão faltante (bloqueante):** *qual é a condição exata para
`professional_subcriterion_map.status = CONFIRMADO` em `MODELO_COMUNICACAO`,
sabendo que o estado é **absoluto** e que a única definição lavrada é
**relativa à pessoa**?*

**Autoridade competente:** **DT-01 — Autoridade de Método** (com o Guardião, se
a forma escolhida exigir ADR ou emenda ao anexo congelado da ADR-065).

| Alternativa | O que significa | Impacto |
|---|---|---|
| **B1** — `CONFIRMADO` = existe declaração válida com **≥1 conduta canônica** | o estado afirma "declarou conduta de comunicação" | simples e emitível já; mas **aproxima `CONFIRMADO` de "respondeu"** e esvazia a distinção com `NAO_INFORMADO` |
| **B2** — `CONFIRMADO` = **todas as sete** condutas declaradas | estado exigente e inequívoco | quase nunca verdadeiro; a regra nasceria praticamente inerte |
| **B3** — **conjunto mínimo nomeado** pelo Método (ex.: verificar compreensão + reexplicar) | o Método declara o que é o núcleo do conceito | **decisão de Método legítima e falseável** — a que melhor honra "condutas observáveis, não traço" |
| **B4** — reconhecer que o estado deste conceito **é intrinsecamente pairwise** e que o bloco relacional **não deriva estado absoluto** | os 6 relacionais saem da derivação de estado; restam **`ACESSO_*`/`CONTINUIDADE_*`** (sem `satisfied_by`) como alvos inaugurais | preserva a ADR-065 sem emenda; **muda o alvo pela terceira vez**, e a lacuna do estado absoluto reaparece lá — sem a tensão do §5 item 3 |

**Recomendação do Arquiteto: B3** — é a única que produz semântica **falseável**
sem contradizer a ADR-065 nem esvaziar `CONFIRMADO`, e é exatamente o tipo de
decisão que o Método existe para tomar. **A escolha é da Autoridade.**

**Nada foi promovido, nenhuma regra entrou no banco, nenhuma migration criada,
nenhum catálogo ou `satisfied_by` tocado.**
