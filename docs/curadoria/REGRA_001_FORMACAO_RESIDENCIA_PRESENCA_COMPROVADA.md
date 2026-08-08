# Ficha Normativa — REGRA 001 · `FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA`

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **TENTATIVA INAUGURAL BLOQUEADA — substituída por decisão DT-01 (VIA V1, 2026-08-08)**; o novo alvo inaugural é `MODELO_COMUNICACAO` (ver [`REGRA_INAUGURAL_MODELO_COMUNICACAO.md`](REGRA_INAUGURAL_MODELO_COMUNICACAO.md)). **Registro histórico preservado na íntegra — não renumerado, não apagado**; a decisão material faltante do §11 permanece registrada e não foi praticada |
| **Base** | `4bcf6ea` |
| **Decisão de origem** | **DT-01 — Fundador / Autoridade de Método**: adotar `FORMACAO_RESIDENCIA` como alvo da primeira regra material |
| **Objeto desta ficha** | formalizar a decisão **e confrontá-la com as autoridades vigentes antes da promoção**, conforme determinado |

---

## 1. Resumo executivo

A escolha de `FORMACAO_RESIDENCIA` é **metodologicamente excelente** — objetiva,
auditável, de fonte oficial primária, independente da ponte Case-side. O
confronto com as autoridades vigentes, porém, encontrou **três impedimentos
materiais**, dois deles estruturais e já implementados, verificados e
certificados. **A regra não pode ser promovida como está** — e a razão não é
falha da decisão, é que o alvo escolhido pertence hoje, por lavratura, ao
**território do juízo humano**, não ao da derivação automática.

## 2. Os três impedimentos, com evidência na fonte

### I-1 — O emissor profissional **recusa este conceito por construção** (estrutural)

O emissor implementado no 2.C — verificado, certificado e encerrado — contém
([`20260808270000_2_c_abertura_da_fronteira.sql:76-79`](../../supabase/migrations/20260808270000_2_c_abertura_da_fronteira.sql)):

```
if conceito.cruzamento is distinct from 'automatico'
   or conceito.motor_participation = 'NUNCA' then
  return 'CONCEITO_SEM_PONTE';
```

E o Catálogo vigente declara para `FORMACAO_RESIDENCIA`: **`cruzamento: "humano"`**.
Resultado: **qualquer emissão para este conceito devolve `CONCEITO_SEM_PONTE`.**
Uma regra `VIGENTE` sobre ele **nunca produziria proposta alguma** — seria letra
morta no banco.

### I-2 — A classificação é lavrada, não acidental

O **`CONTRATO_1_A` §7**, aprovado pelo Guardião (**PA-13**), classifica os 14
conceitos `humano`/`INDIRETO` — **`FORMACAO_RESIDENCIA` entre eles** — como
**`FORA_DA_DERIVACAO`**, com fundamento na **ADR-067**: o critério FORMAÇÃO é
**juízo humano (H8, `TECNICO`)**, com destino `curator_judgments`. O comentário
do próprio emissor cita essa cadeia. Só os **9 conceitos `automatico`** foram
lavrados como candidatos estruturais a regra.

### I-3 — O conceito não tem vocabulário canônico, e a especialidade não tem campo

O Catálogo declara `responseType: "estruturado"` mas **`profissional: []`** —
**zero opções canônicas**. E a descrição normativa é *"Residência concluída **na
especialidade em questão**"*, enquanto **nenhuma coluna de especialidade existe
em migration alguma** (varredura: nenhum `especialidade`/`specialty`).

Consequência direta sobre o **item 12 da missão** (*"parte material
importante… se essa correspondência não estiver normativamente definida, não
inventar; registrar a lacuna e impedir promoção"*): **a correspondência de
especialidade não está normativamente definida.** Sem ela, "residência concluída
na especialidade em questão" só seria decidível por **semelhança textual** —
exatamente o que a **ADR-035** proíbe (*comparar texto livre com texto livre é
inferência semântica, e o erro é invisível*). E sem opções canônicas, também não
há como distinguir **concluída** de **em andamento** (Caso C) sem inferir.

## 3. Fonte canônica lida (não de memória)

| Atributo | Valor vigente |
|---|---|
| `code` · `group` · `axis` | `FORMACAO_RESIDENCIA` · `FORMACAO` · `PRATICA_E_TRAJETORIA` |
| `name` · `description` | "Residência médica" · **"Residência concluída na especialidade em questão."** |
| `active` · `catalogVersion` | `true` · **1.1.0** |
| `professionalQuestion` · `patientQuestion` | "Residências concluídas" · **`null`** |
| `responseType` | `estruturado` |
| **`cruzamento`** | **`humano`** ← I-1 |
| **`motorParticipation`** | **`INDIRETO`** |
| **`evidenceSource`** | **`oficial_primaria`** ✅ (confirma o §13 da missão) |
| `reviewMonths` | **60** |
| **`profissional` (opções)** | **`[]`** ← I-3 |
| `required` · `conditionalRules` | `false` · `[]` |

## 4. A semântica decidida — preservada íntegra para uso futuro

A decisão do DT-01 sobre **o que a regra deve fazer** é boa e fica lavrada aqui,
intacta, para quando o alvo estiver apto:

**Afirma somente**: *existe evidência suficiente, segundo o Método vigente, para
sustentar a presença de residência médica concluída no recorte profissional
avaliado.*

**Não afirma**: médico melhor · maior qualidade · maior competência clínica ·
maior adequação ao Case · recomendação · ranking · pontuação · superioridade
sobre quem não tem o registro · equivalência entre residência e experiência
prática · equivalência entre formação e resultado clínico.

**Condição positiva** (todas cumulativas): evidência vigente · do profissional
correto · do subcritério `FORMACAO_RESIDENCIA` · na **versão exata** ·
proveniência válida · **materialmente suficiente** para comprovar conclusão ·
**compatível com a especialidade em questão** ⇒ proposta de **`CONFIRMADO`**.

**Assimetria inaugural, explícita**: evidência positiva suficiente ⇒ proposta
`CONFIRMADO`; **todos os demais casos ⇒ nenhuma proposta**. **`NAO_CONFIRMADO`
fica fora da v1** — nenhuma autoridade vigente fornece condição factual positiva
e inequívoca que o autorize, e ausência jamais o produz (P-04/I-8: *"do vazio,
nada se afirma"*; a linha superada da Arquitetura §10.4 está registrada como tal
no CONTRATO_1_A §5).

**Proibição de inferência simples**: `education_kind = residencia → CONFIRMADO`
**não basta** — a proposta reflete **evidência comprovante**, nunca tipo de
registro.

**Proposta ≠ confirmação**: a regra **não escreve no Mapa**; produz proposta no
mecanismo contratado, e a confirmação permanece **humana, item a item, pela
Fronteira do 2.C**, com autoria, proveniência e ato explícito.

## 5. Casos limítrofes

| Caso | Situação | Resultado |
|---|---|---|
| **A** | residência concluída, documento oficial, especialidade inequívoca | proposta `CONFIRMADO` — **hoje inalcançável** (I-1, I-3) |
| **B** | sem evidência suficiente | **nenhuma proposta**; lacuna preservada |
| **C** | programa iniciado, não concluído | **nenhuma proposta** — e hoje **indistinguível de A** sem opções canônicas (I-3) |
| **D** | especialidade divergente | **nenhuma proposta** — hoje **indecidível** sem campo de especialidade (I-3) |
| **E** | nomenclatura ambígua | **nenhuma proposta até resolução** — hoje **toda** correspondência seria ambígua |
| **F** | documento não verificado | **decisão pendente** — ver §6 |
| **G** | evidência nova após proposta/ato | **já resolvido pelo regime vigente**: o trigger JS3 (2.3) supersede o juízo; para a proposta, S1 da ADR-066 §9 a leva a `SUPERADA` e a condição 6 do ato válido a torna não decidível; **sem carry-forward** |

## 6. Estado de verificação — decisão material pendente (menor)

O regime distingue `collected_by/collected_at` (sempre) de
`verified_by/verified_at/verification_source` (obrigatórios por constraint
quando `status = 'verificado'`). A missão exige **derivar da política vigente,
não escolher arbitrariamente** — e a política **não decide** entre:
**(A)** só evidência `verificado` emite · **(B)** não verificada emite com
lacuna explícita. Coerente com o espírito conservador da regra e com I-5
(*o estado de verificação acompanha sem contaminar a conclusão*), **a
recomendação do Arquiteto é (A) para a v1** — mas **é decisão da Autoridade de
Método**, não deste documento.

## 7. Identidade, versão e estados

`rule_id` segue `text not null` sem convenção lexical imposta —
`FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA` é **tecnicamente válido**; nenhuma
adaptação de identificador é necessária. Versão **1** (`integer >= 1`), imutável
após criada. Nasce em **`PROPOSTA`** (CHECK estrutural do 2.2B: nenhuma versão
nasce fora dela); promoção a `VIGENTE` é ato da Autoridade com `approved_by`,
`approval_adr`, `effective_from` (ADR-069 §7).

**Distinção preservada**: `PROPOSTA/VIGENTE/SUSPENSA/REVOGADA` = **ciclo de vida**;
**PROVISÓRIA** = **maturidade metodológica**. A primeira regra material é
**PROVISÓRIA** por natureza — pode ser `VIGENTE` **e** provisória ao mesmo tempo.

## 8. CD-1 — prova de não contaminação

Esta regra **não usa** `case_needs.degree` · **não usa** importância · **não
usa** `derivation_rule_degree_map` · **não faz** ponte grau→importância · **não
depende** de valores da pessoa · **não cria** valores Case-side. Ela é
**profissional-side pura**. **CD-1 não é tocada** — e é justamente por isso que
a escolha do DT-01 é estrategicamente correta.

## 9. Separação do julgamento humano

**Não confundir**: esta regra derivaria o **estado factual de um subcritério** no
Mapa do Profissional; o **julgamento agregado do critério FORMAÇÃO** (H8,
`TECNICO`) permanece **humano**, em `curator_judgments`, e **a regra nunca o
substitui**. *(O impedimento I-2 nasce exatamente da tensão entre essas duas
leituras: hoje, o Catálogo trata o subcritério como território humano —
`cruzamento: humano` —, e é isso que precisa de decisão.)*

## 10. R-1 e roadmap

**R-1 — INSTRUMENTADA E MITIGADA, NÃO RESOLVIDA.** A primeira regra inaugura
aprendizado, **não prova validade do Método**. Nenhum threshold criado.
Observar depois: taxa de confirmação · taxa de recusa · motivos · divergências ·
casos ambíguos · necessidade de nova versão.

**Gatilhos qualitativos de revisão** (sem número inventado): evidência nova
incompatível · padrão recorrente de discordância · ambiguidade de especialidade ·
incapacidade de tratar limítrofes · mudança normativa · mudança de catálogo.

**Roadmap registrado, não promovido, não vinculante**: 1) `FORMACAO_RESIDENCIA`
· 2) `FORMACAO_ESPECIALIZACAO` · 3) `FORMACAO_FELLOWSHIP` · 4) EXPERIÊNCIA (após
aprendizado) · 5) HISTÓRICO · 6) RELACIONAIS (após observação real). **Nota
material**: as candidatas 2 e 3 têm **exatamente o mesmo impedimento I-1/I-2**
(`cruzamento: humano`) — os **únicos** conceitos hoje estruturalmente elegíveis
são os **nove `automatico`**: `ACESSO_DISPONIBILIDADE` · `ACESSO_MODALIDADE` ·
`ACESSO_PRAZO_PARA_CONSULTA` · `CONTINUIDADE_CANAIS` · `CONTINUIDADE_COORDENACAO`
· `CONTINUIDADE_EQUIPE_DE_APOIO` · `MODELO_ALTERNATIVAS` · `MODELO_COMUNICACAO`
· `MODELO_PARTICIPACAO_FAMILIAR`.

## 11. A decisão material faltante

Para desbloquear **este** alvo, a Autoridade de Método precisa decidir **uma**
das vias — nenhuma delas praticável pelo Arquiteto:

| Via | O que exige | Custo/risco |
|---|---|---|
| **V1 — trocar o alvo** para um dos nove `automatico` | nada de novo; o mecanismo já aceita | **imediato**; mas troca o critério inaugural, e os automáticos são de acesso/continuidade/modelo, não de formação |
| **V2 — reclassificar `FORMACAO_RESIDENCIA` para `cruzamento: automatico`** | decisão de Método + migration de Catálogo + **emenda ao CONTRATO_1_A §7** (Guardião) + **resolver I-3** (opções canônicas + campo de especialidade) | alto — mexe no Catálogo congelado e reabre classificação lavrada |
| **V3 — manter o alvo e resolver só I-3**, aceitando que a regra fica inerte até V2 | lavrar opções e especialidade | **não desbloqueia**: I-1 continua recusando |

**Recomendação do Arquiteto: V1 para a primeira regra** — inaugurar o Método
onde o mecanismo já o aceita, aprender com R-1, e tratar V2 como decisão
própria e posterior, com o peso que ela merece. **A decisão é da Autoridade de
Método.**

## 12. Perguntas obrigatórias

| # | Resposta |
|---|---|
| Q1 | **SIM** — existe e está ativo (catálogo 1.1.0) |
| Q2 | **SIM** em intenção; **NÃO** em operacionalização — sem opções canônicas nem campo de especialidade |
| Q3 | **SIM** — `evidenceSource: oficial_primaria` |
| Q4 | **PARCIALMENTE** — há regime de fontes e verificação; falta a decisão do §6 |
| Q5 | **NÃO** hoje — "concluída" não é distinguível de "em andamento" sem opções (I-3) |
| Q6 | **NÃO** — não existe campo de especialidade; só por semelhança textual, vedada (ADR-035) |
| Q7 | **não tratadas** — sem vocabulário canônico |
| Q8 | **não tratadas** — idem |
| Q9 | **decisão pendente** (§6); recomendação: só `verificado` na v1 |
| Q10 | **SIM** — ausência permanece não emissão |
| Q11 | **SIM** — `NAO_CONFIRMADO` fora da v1 |
| Q12 | **SIM** — proposta, nunca confirmação |
| Q13 | **SIM** — não escreve no Mapa (A2b) |
| Q14 | **SIM** — não cria julgamento |
| Q15 | **SIM** — H8 permanece humano |
| Q16 | **SIM** — não toca CD-1 |
| Q17 | **SIM** — não depende da ponte |
| Q18 | **NÃO** — C, D, E e F ficam indefinidos por I-3/§6 |
| Q19 | **SIM** — o regime de proveniência é suficiente |
| Q20 | **SIM** — esta ficha declara o que não cobre |
| Q21 | **SIM** — o comportamento implícito é `CONCEITO_SEM_PONTE`: a regra existiria e nunca emitiria |
| Q22 | **SIM** — §11 |
| Q23 | **para V1: não** · **para V2: sim** (emenda ao CONTRATO_1_A e decisão de Catálogo) |
| Q24 | **SIM** — a ADR-069 fornece ciclo suficiente |
| Q25 | tecnicamente sim; **materialmente inútil** enquanto I-1 persistir |
| Q26 | **NÃO** — promover produziria regra `VIGENTE` que nunca emite |
| Q27 | **SIM** — PROVISÓRIA |
| Q28 | **SIM** — R-1 aberta |
| Q29 | **SIM** — roadmap não vinculante |
| Q30 | **NÃO** — ver veredito |

## 13. Veredito

> ### REGRA `FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA` — BLOQUEADA
>
> **Decisão faltante**: escolha da via do §11 pela **Autoridade de Método** —
> **V1** (trocar o alvo inaugural para um dos nove conceitos `automatico`) ou
> **V2** (reclassificar o conceito, com emenda ao `CONTRATO_1_A` §7 pelo Guardião
> e resolução das lacunas de opções canônicas e de especialidade).
>
> **A semântica decidida pelo DT-01 está preservada integralmente nesta ficha** e
> vale para o alvo que a Autoridade escolher — nada dela se perde.
