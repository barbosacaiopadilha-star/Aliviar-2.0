# Regra Material 001 — `CONTINUIDADE_COORDENACAO`

| Campo | Valor |
|---|---|
| **Versão do documento** | **v2.0** — incorpora a decisão final do DT-01 sobre a lacuna do §9 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **PRONTA PARA ATO DE MÉTODO** — semântica **fechada nas cinco opções**; zero comportamento implícito; nenhuma ADR nova; **não promovida** |
| **Base** | `f3f8a77` (v1.0 lavrada em `deeb9f3`) |
| **Origem** | Decisão do **DT-01** após a classificação dos nove automáticos: `CONTINUIDADE_COORDENACAO` é o alvo da primeira Regra Material |
| **Natureza** | Lavratura documental. **Zero código, zero migration, zero promoção** |

> **A v1.0 desta ficha registrou uma lacuna única e se recusou a preenchê-la por
> inferência. O DT-01 a resolveu em ato próprio (§9).** A semântica da v1 está
> agora **fechada nas cinco opções canônicas**, exaustivamente, sem qualquer
> comportamento implícito remanescente. A regra está pronta para o ato formal de
> promoção.

---

## 1. O conceito, provado na fonte

Lido diretamente do catálogo gerado no HEAD — **nada copiado de memória**.

| Atributo | Valor vigente |
|---|---|
| `code` | `CONTINUIDADE_COORDENACAO` |
| `name` | Coordenação com outros profissionais |
| `description` | **"Como conversa com os outros profissionais que cuidam da pessoa."** |
| `axis` / `group` | `CONTINUIDADE_DO_CUIDADO` |
| `active` | **`true`** |
| `cruzamento` | **`automatico`** |
| `motorParticipation` | **`DIRETO`** |
| `evidenceSource` | **`entrevista`** |
| `responseType` | `multipla_escolha` |
| `required` | **`false`** |
| `conditionalRules` | **`[]`** (vazio) |
| `reviewMonths` | 12 |
| `catalogVersion` | **`1.1.0`** |

**Opções profissionais vigentes — exatamente cinco**, campo único `principal`,
todas `active: true`, todas **`satisfiedBy: null`**:

| # | Valor vigente | Rótulo |
|---|---|---|
| 1 | `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` | Contata diretamente o outro profissional |
| 2 | `ENVIA_RELATORIO_ESCRITO` | Envia relatório escrito |
| 3 | `PARTICIPA_DE_DISCUSSAO_DE_CASO` | Participa de discussão de caso |
| 4 | `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` | Orienta a pessoa a levar a informação |
| 5 | `ATUA_DE_FORMA_INDEPENDENTE` | Atua de forma independente |

**Não existe** opção de "não sei", "não se aplica" ou "não informado" no lado
profissional. **Não existe** opção fora dessas cinco.

*(Lado da pessoa, para registro: `SIM` · `NAO` · `NAO_SEI_INFORMAR` — **não
participa desta regra**, §17.)*

## 2. Identidade da regra — padrão real validado

**`rule_id` proposto: `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`**

Validado contra a estrutura real de `curadoria.derivation_rules`:

| Verificação | Resultado |
|---|---|
| Restrição de formato de `rule_id` | **não existe** — só `text not null check (length(btrim(rule_id)) > 0)` |
| Chave | `primary key (rule_id, version)` — versão é `integer >= 1` |
| Unicidade | índice parcial: **no máximo uma versão `VIGENTE` por `rule_id`** |
| Vínculo da proposta | FK `derivation_proposals (rule_id, rule_version) → derivation_rules (rule_id, version)` |
| `rule_id` já existentes | **nenhum** — a tabela nasceu inerte e segue vazia |

> **A identidade proposta é admissível e será a primeira**: esta regra
> **estabelece a convenção** `<CONCEITO>_<QUALIFICADOR_DA_FORMA>`.

## 3. Fronteira com o Concierge Aliviar — lavrada

> O **Concierge Aliviar pode facilitar** a coordenação: obter contatos, reunir
> documentos, organizar fluxo, solicitar agenda e viabilizar a comunicação.
> **O Concierge não substitui o profissional no ato de coordenação clínica com
> outros profissionais.** Agendar a conversa não é conversar. Transportar o
> relatório não é escrevê-lo. Discutir o caso é ato clínico e permanece do
> profissional.
>
> Portanto **`CONTINUIDADE_COORDENACAO` permanece característica legítima da
> prática do profissional**, e medi-la não atribui ao médico ônus por função
> operacional que a Aliviar pretende assumir — ao contrário de
> `CONTINUIDADE_CANAIS`, retirado por esta mesma razão.

## 4. O que a regra afirma

> Existe **evidência profissional estruturada e versionada** de conduta de
> coordenação — ou de atuação independente — **suficiente para sustentar uma
> proposta de estado** do conceito `CONTINUIDADE_COORDENACAO`.

## 5. O que a regra NÃO afirma

Não afirma qualidade global · competência clínica · melhor cuidado · melhor
médico · eficiência · rapidez · resultado clínico · integração perfeita ·
superioridade · ranking · score · recomendação · adequação global ao Case.

**`NAO_CONFIRMADO` não significa "mau profissional".** Significa exclusivamente:
*não foi declarada uma conduta de coordenação com outros profissionais, segundo
o significado formal do conceito.*

## 6. Semântica — as três saídas

Vocabulário do Mapa (`curadoria.subcriterion_status`), com a definição canônica
da própria migration: *"CONFIRMADO: a característica está presente.
NAO_CONFIRMADO: a operação verificou que não está. NAO_INFORMADO: não há
informação suficiente para afirmar nem negar. **Ausência de linha é diferente de
NAO_INFORMADO**: a primeira é item não trabalhado, a segunda é item analisado."*

### 6.1 `CONFIRMADO`

Derivar quando a evidência corrente contiver **pelo menos uma** das **três**
condutas canônicas **diretas** de coordenação:

- `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`
- `ENVIA_RELATORIO_ESCRITO`
- `PARTICIPA_DE_DISCUSSAO_DE_CASO`

**`ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` não integra este conjunto** (§9). Quando
acompanha uma das três, o resultado continua `CONFIRMADO` — **mas quem governa é
a conduta direta**, nunca a soma.

### 6.2 `NAO_CONFIRMADO`

Derivar **somente** diante da presença positiva da opção canônica exata
**`ATUA_DE_FORMA_INDEPENDENTE`**. Nunca por ausência, nunca por inferência,
nunca por estado de governança.

### 6.3 `NAO_INFORMADO` — **não derivado nesta v1**

O §8 da missão condiciona: só derivar se existir **evidência positiva e
canônica** de que a informação foi buscada e não pôde ser informada.

**Prova de que a condição falha, sem inventar nada:**

1. O catálogo **sabe** representar isso — `NAO_INFORMADO` é opção canônica real
   em `VIABILIDADE_COBERTURA_E_CONVENIO` e em dois campos de
   `VIABILIDADE_CUSTO_E_PAGAMENTO`.
2. Em `CONTINUIDADE_COORDENACAO` essa opção **deliberadamente não existe**.
3. O único candidato próximo é o estado de verificação **`nao_localizado`** —
   e **usá-lo seria violar I-5 frontalmente**: é vocabulário de *governança*,
   e I-5 proíbe que o estado da informação use o vocabulário da correspondência.

> **Conclusão:** `NAO_INFORMADO` **não é derivável** nesta v1. Nenhuma opção
> inventada. É a aplicação literal do §8.

### 6.4 Ausência

| Situação | Saída |
|---|---|
| Nenhuma linha de evidência para o par (profissional, conceito) | **nenhuma proposta** |
| Evidência corrente com `options` **vazio** | **nenhuma proposta** — declaração ausente não é negativa |

Nunca converter ausência em `NAO_CONFIRMADO`. Nunca em `NAO_INFORMADO`. **P-04.**

## 7. Condicionalidade do cenário — o ponto obrigatório (§11)

A pergunta profissional abre com **"Quando a pessoa já é acompanhada por outros
profissionais…"**. Verificação estrutural:

| Verificação | Resultado |
|---|---|
| `conditionalRules` | **`[]`** — nenhuma condição estrutural |
| `required` | **`false`** — a pergunta pode ficar sem resposta |
| Opção de "não se aplica" | **não existe** |
| Protocolo (Q9) declara salto/condição | **não** |

> **A condicionalidade existe apenas no enunciado — não tem representação
> estrutural.**

**Como os dois casos se separam hoje, sem colapso:**

| Caso real | Registro | Saída da regra |
|---|---|---|
| Profissional **nunca enfrentou** o cenário | não responde (lícito: `required: false`) → **sem evidência** | **nenhuma proposta** |
| Profissional **enfrenta e atua sozinho** | seleciona `ATUA_DE_FORMA_INDEPENDENTE` | **`NAO_CONFIRMADO`** |

**A regra jamais lê ausência como independência.** Os dois permanecem distintos.

**Risco residual registrado (nível instrumento, não nível regra):** um
profissional que nunca enfrentou o cenário pode ainda assim marcar
`ATUA_DE_FORMA_INDEPENDENTE` lendo o rótulo como *"trabalho sozinho em geral"*.
Isso é **ambiguidade do instrumento**, não defeito da regra — e é **observável
por R-1**. Não se corrige inventando opção; corrige-se, se a observação
confirmar, por revisão do Catálogo em ato próprio.

## 8. Evidência e estado de verificação

**Fonte:** `evidenceSource = entrevista` — significa **conduta declarada pelo
profissional em instrumento estruturado**. A regra **não** transforma declaração
em prova de que a conduta ocorre sempre. A frase honesta é *"a conduta
registrada é…"*, nunca *"o profissional sempre faz…"*.

### 8.1 Confronto do §13 com I-5 — **sem conflito**

O enum real `curadoria.verification_status` tem **cinco** valores:
`nao_verificado` (default) · `verificado` · `divergente` · `nao_localizado` ·
`desatualizado`.

| Autoridade | Texto | Efeito |
|---|---|---|
| **I-5** (Congelamento §76) | *"o estado da informação nunca usa o vocabulário da correspondência"* | proíbe **traduzir** o estado em atende/não atende — **não** proíbe evidência não verificada de gerar proposta |
| **ADR-D** §6 | *"confirmação sobre evidência não verificada aparece como **lacuna de governança** — nunca como compatibilidade menor (I-5)"* | **autoriza expressamente** o caminho |
| **CONTRATO_2_C §7** (PA-17) | o emissor lê `id, version, collected_at, collected_by, catalog_version` — **não lê `status` e não filtra por ele** | o regime vigente é **cego ao estado**: ele acompanha, não bloqueia |

> **Veredito do §13: COMPATÍVEL.** Nenhum dos cinco estados bloqueia a proposta;
> **todos** acompanham integralmente pela vinculação exata a `evidence_id`, e
> **nenhum** jamais é ocultado nem traduzido em vocabulário de correspondência.
> A Fronteira Humana é onde o estado é visto e pesado — por gente, não por regra.

## 9. `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` — **DECIDIDA PELO DT-01**

### 9.0 A decisão — ato do DT-01, 2026-08-08

> **Quando presente isoladamente**, a opção canônica
> `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`:
> **não deriva `CONFIRMADO`** · **não deriva `NAO_CONFIRMADO`** · **não deriva
> `NAO_INFORMADO`**.
>
> **Resultado: `NENHUMA_PROPOSTA`.**
>
> **Fundamento do DT-01:** a conduta orienta a pessoa a transportar a
> informação, mas, isoladamente, **não demonstra ato de coordenação praticado
> pelo profissional com outro profissional**. Isto **não constitui juízo
> negativo sobre a conduta** — é apenas **insuficiência para afirmar** o estado
> absoluto `CONFIRMADO` de `CONTINUIDADE_COORDENACAO`.
>
> **Quando presente junto de uma conduta positiva direta já classificada**, a
> **conduta positiva direta governa o resultado** e a regra propõe
> `CONFIRMADO`. **Sem score, sem contagem, sem gradação.**

**Leitura adotada: B** (das duas apresentadas na v1.0 desta ficha).

### 9.0.1 A decisão é P-04 aplicado — não apenas compatível com ele

**P-04** (Arquitetura §180): *"Ausência de informação nunca vira ausência da
característica. `null` ≠ `false`; lacuna ≠ 'não atende'."* E o `CONTRATO_1_A`
§111 é explícito: *"`NAO_CONFIRMADO` afirma ausência **verificada**"*.

`ORIENTA…` isolada é exatamente uma **lacuna** quanto ao ato de coordenação
praticado: não é prova de que ele ocorre, **nem** verificação de que não ocorre.
O DT-01 poderia ter escolhido `NAO_CONFIRMADO`; escolher `NENHUMA_PROPOSTA` é o
**único desfecho que P-04 admite**. A decisão não passou no teste de P-04 — ela
**é** P-04 no caso concreto.

### 9.1 Registro histórico: o que foi procurado antes do ato, e não encontrado

Varredura completa por autoridade que classifique esta opção como coordenação
positiva ou não:

| Fonte consultada | Resultado |
|---|---|
| Catálogo gerado (HEAD) | lista a opção; **não classifica** |
| `method_subcriterion_options` (migration 1.0.0) | insere a opção; **não classifica** |
| `PROTOCOLO_PRATICA_PROFISSIONAL.md` Q9 | trata as **cinco** uniformemente como "condutas" — inclusive a negativa; **não classifica** |
| `CATALOGO_CANONICO_PROPOSTA.md` | lista as cinco em linha; **não classifica** |
| ADRs, Domínio Relacional, Modelo da Curadoria, Contratos 1.A/2.C | **silêncio total** |

**Nenhuma autoridade vigente resolvia** — por isso a questão subiu ao DT-01, e
por isso a resposta teve de ser **ato de método**, não leitura de arquitetura.

### 9.2 Por que o Agente 02 não podia resolver sozinho

O único elemento que **sugere** resposta é a `description` do próprio conceito —
**"Como conversa com os outros profissionais"** —, sob a qual orientar a pessoa
a levar a informação **não é conversar com o outro profissional**: é delegar o
transporte da informação à paciente. É leitura defensável, **mas é inferência**,
e a missão a proíbe.

Tampouco posso adotar silenciosamente o tratamento conservador ("não conta"),
porque **P-04 não cobre este caso**: P-04 governa *ausência de evidência*, e aqui
há **declaração positiva** cujo significado é que está em aberto. Adotar o
conservador seria criar **comportamento implícito** para uma de cinco opções
canônicas — exatamente o que a Q26 desta lavratura proíbe.

### 9.3 Consequência exata da decisão

| Composição da evidência | Saída **decidida** |
|---|---|
| `ORIENTA…` **sozinha** | **`NENHUMA_PROPOSTA`** |
| `ORIENTA…` + uma das três condutas diretas | **`CONFIRMADO`** — governado pela conduta direta |
| `ORIENTA…` + `ATUA_DE_FORMA_INDEPENDENTE` | **`NAO_CONFIRMADO`** — ver §9.4 |

O conjunto positivo da v1 fica em **três** condutas diretas.

### 9.4 Consequência derivada: a contradição **estreita**

A v1.0 tratava como contraditória a coexistência de "conduta positiva **+**
`ATUA_DE_FORMA_INDEPENDENTE`". Com `ORIENTA…` **fora** do conjunto positivo,
essa combinação **deixa de ser contraditória**.

**Derivação, pelo princípio que o próprio DT-01 enunciou** — *"a conduta positiva
direta governa o resultado"*, isto é, **a conduta classificada governa sobre a
insuficiente**:

| Presente | Classificação | Governa? |
|---|---|---|
| `ORIENTA…` | **insuficiente** para afirmar o estado (§9.0) | não |
| `ATUA_DE_FORMA_INDEPENDENTE` | **negativa explícita** classificada (§6.2) | **sim** |

⇒ `ORIENTA…` + `ATUA_DE_FORMA_INDEPENDENTE` (sem conduta direta) ⇒
**`NAO_CONFIRMADO`**.

> **Isto é aplicação simétrica da regra do DT-01, não decisão nova.** A
> alternativa — tratar como contradição — exigiria que `ORIENTA…` fosse
> positiva, que é precisamente o que o ato acaba de negar. **Registrado
> explicitamente para que não reste comportamento implícito.**
>
> **A contradição real passa a exigir uma das três condutas diretas** junto com
> a negativa (§11).

## 10. Múltiplas condutas

Duas, três ou quatro condutas positivas produzem **um único `CONFIRMADO`**.

**Proibidos:** score · peso · intensidade · soma · contagem · "mais coordenado"
· ranking · qualquer gradação. As condutas permanecem **integralmente
disponíveis como evidência e proveniência** — visíveis, nunca aritméticas.
*(Espelha a regra já lavrada no Protocolo para `CONTINUIDADE_EQUIPE_DE_APOIO`:
"contagem de tipos jamais vira qualidade".)*

## 11. Contradição na mesma evidência

`options` é `text[]` de múltipla escolha **sem constraint** que impeça
`ATUA_DE_FORMA_INDEPENDENTE` de coexistir com uma conduta positiva na **mesma
versão** de evidência.

Não há regime vigente que arbitre entre valores dentro de **uma mesma versão** —
o versionamento arbitra entre versões (`max(version)`), não dentro delas.

> **Decisão, pelo fallback expressamente autorizado no §20 da missão de
> lavratura:** presença simultânea de **uma das três condutas diretas** e de
> `ATUA_DE_FORMA_INDEPENDENTE` na mesma versão corrente ⇒ **`NENHUMA_PROPOSTA`**,
> com desfecho tipado `EVIDENCIA_CONTRADITORIA`. A regra **não arbitra
> silenciosamente**. A contradição é fato da evidência e volta para quem a
> coletou.

**Estreitada pela decisão do §9:** `ORIENTA…` + `ATUA_DE_FORMA_INDEPENDENTE`
**não** é contradição — é `NAO_CONFIRMADO` (§9.4). Só as **três diretas**
contradizem a negativa.

## 12. Evidência incompatível

Valor em `options` que **não pertença** às cinco opções canônicas ativas do
conceito na `catalog_version` da evidência ⇒ **nenhuma proposta**, desfecho
tipado `EVIDENCIA_INCOMPATIVEL`.

**Isto não é hipótese teórica:** `practice_evidence.options` **não tem check
nem trigger** validando contra `method_subcriterion_options` — a validação é
responsabilidade da regra. *(Divergência de `catalog_version` já é barrada antes,
pelo emissor: `CATALOGO_DIVERGENTE`.)*

## 13. Proposta ≠ estado final

```
evidência  ──[ REGRA 001 ]──▶  proposta  ──[ FRONTEIRA HUMANA ]──▶  confirmação | recusa
```

A regra **não escreve no Mapa do Profissional**, não julga e não confirma. O
emissor lavrado (`emitir_proposta_de_estado`, PA-17) já garante isso
estruturalmente, e a declaração manual **prevalece** sobre a proposta
(`DECLARACAO_MANUAL_VIGENTE`).

## 14. Independência do Case e CD-1

| Proibição | Prova |
|---|---|
| `case_needs` | a regra lê **apenas** `practice_evidence` do par (profissional, conceito) |
| grau / importância | nenhuma entrada de grau; nenhuma saída de importância |
| respostas da pessoa | o lado `paciente` do conceito **não é lido** |
| `satisfied_by` | as cinco opções têm **`satisfiedBy: null`** — não há o que ler |
| ponte grau→importância | **zero linhas** em `derivation_rule_degree_map`, cuja coluna `degree` é, por construção, o grau de `case_needs` — a ponte é **Case-side**; uma regra do lado profissional simplesmente não a povoa |
| estabilização proibida | nenhum valor da ponte é fixado |

> **CD-1 permanece intacta.** O fato profissional existe **antes e
> independentemente** de qualquer Case.

## 15. Casos obrigatórios

| | Entrada | Saída |
|---|---|---|
| **A** | `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` | **`CONFIRMADO`** |
| **B** | `ENVIA_RELATORIO_ESCRITO` | **`CONFIRMADO`** |
| **C** | `PARTICIPA_DE_DISCUSSAO_DE_CASO` | **`CONFIRMADO`** |
| **D** | `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` **isolada** | **`NENHUMA_PROPOSTA`** — decidido pelo DT-01 (§9) |
| **E** | `ATUA_DE_FORMA_INDEPENDENTE` | **`NAO_CONFIRMADO`** |
| **F** | nenhuma evidência | **nenhuma proposta** |
| **G** | valor fora das cinco canônicas | **nenhuma proposta** · `EVIDENCIA_INCOMPATIVEL` |
| **H** | evidência `nao_verificado` (ou `divergente`/`nao_localizado`/`desatualizado`) | **propõe normalmente**; estado acompanha a proveniência, **nunca oculto, nunca traduzido** (§8.1) |
| **I** | múltiplas condutas positivas | **um único `CONFIRMADO`** |
| **J** | cenário nunca aplicável | **nenhuma proposta** — jamais `NAO_CONFIRMADO`, jamais `NAO_INFORMADO` (§7) |
| **K** | **conduta direta** + `ATUA_DE_FORMA_INDEPENDENTE` na mesma versão | **`NENHUMA_PROPOSTA`** · `EVIDENCIA_CONTRADITORIA` (§11) |
| **L** | evidência corrente com `options` vazio | **`NENHUMA_PROPOSTA`** (§6.4) |
| **M** | `ORIENTA…` + `ATUA_DE_FORMA_INDEPENDENTE`, **sem** conduta direta | **`NAO_CONFIRMADO`** — a classificada governa (§9.4) |
| **N** | `ORIENTA…` + conduta direta | **`CONFIRMADO`** — governado pela direta, **sem soma** (§9.3) |

### 15.1 Matriz **exaustiva** — prova de zero comportamento implícito

Sejam **D** = {`CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`,
`ENVIA_RELATORIO_ESCRITO`, `PARTICIPA_DE_DISCUSSAO_DE_CASO`} (diretas),
**O** = `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`, **N** =
`ATUA_DE_FORMA_INDEPENDENTE`. Toda evidência possível é um subconjunto das cinco
opções — **as 32 combinações caem, sem sobra, em oito classes**:

| # | Composição | Saída | Fundamento |
|---|---|---|---|
| 1 | sem linha de evidência | `NENHUMA_PROPOSTA` | §6.4 · P-04 |
| 2 | `options` vazio | `NENHUMA_PROPOSTA` | §6.4 · P-04 |
| 3 | **O** sozinha | `NENHUMA_PROPOSTA` | **§9.0 — ato do DT-01** |
| 4 | **≥1 D**, sem N (com ou sem O) | `CONFIRMADO` | §6.1 · §9.3 |
| 5 | **N** sozinha | `NAO_CONFIRMADO` | §6.2 |
| 6 | **O + N**, sem D | `NAO_CONFIRMADO` | §9.4 |
| 7 | **≥1 D + N** (com ou sem O) | `NENHUMA_PROPOSTA` · `EVIDENCIA_CONTRADITORIA` | §11 |
| 8 | qualquer valor fora das cinco canônicas | `NENHUMA_PROPOSTA` · `EVIDENCIA_INCOMPATIVEL` | §12 |

> **Cobertura verificável:** as classes 1–8 são **mutuamente exclusivas** e
> **cobrem todo o espaço** de entradas. Nenhuma composição fica sem saída
> nomeada. **Zero comportamento implícito.**

## 16. Versionamento e proveniência

Toda proposta preserva, obrigatoriamente:

| Item | Origem estrutural |
|---|---|
| `rule_id` | `derivation_proposals.rule_id` → FK `derivation_rules` |
| `rule_version` | `derivation_proposals.rule_version` (`integer >= 1`) |
| `evidence_id` | `practice_evidence.id` — vínculo **exato**, `practice_evidence:<id>` |
| `evidence_version` | `practice_evidence.version` (leitura corrente = `max(version)`) |
| `catalog_version` | conferida entre evidência e conceito pelo emissor |
| origem | `source` + `source_tier` da evidência |
| autor | `collected_by` |
| data | `collected_at` |
| **estado de verificação** | `practice_evidence.status` — acompanha **sempre**, oculto **nunca** |

Tudo append-only: `practice_evidence` é imutável por trigger (sem update, sem
delete) e `derivation_rules` versiona por linha nova.

## 17. Maturidade

Nasce **`PROPOSTA`** — não por convenção, mas por **constraint**
(`derivation_rules_nasce_em_proposta`: `check (state = 'PROPOSTA')`) — e
**metodologicamente provisória**.
**Nenhum threshold inventado.** **R-1 permanece aberta.**

**Descoberta relevante para a promoção:** a constraint
`derivation_rules_vigente_exige_autoridade` torna estrutural o que era doutrina —
`state = 'VIGENTE'` exige **`approved_by`**, **`approval_adr`** e
**`effective_from`**. Ou seja: **`PROPOSTA` não exige ADR; `VIGENTE` exige, no
banco**. A transição pela ADR-069 é possível e já tem guarda física.

## 18. O que R-1 deve observar

**R-1 permanece ABERTA.** Observáveis:

Confirmação pelo Curador · recusa e **motivo** · distância entre conduta
declarada e prática observada · **quantas vezes `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`
aparece isolada** — mede o **custo empírico da decisão do §9**: cada ocorrência
é um profissional sobre quem a v1 escolheu não afirmar nada, e a frequência dirá
se a leitura B se sustenta ou se o Catálogo precisa distinguir melhor a conduta ·
seleção de
`ATUA_DE_FORMA_INDEPENDENTE` por quem nunca enfrentou o cenário (§7) ·
frequência de `EVIDENCIA_CONTRADITORIA` · mudanças de evidência ao longo dos
12 meses de revisão.

## 19. Histórico das tentativas — preservado, sem renumeração

| # | Ato | Data | Desfecho |
|---|---|---|---|
| 1 | [`REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA`](REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA.md) | 2026-08-08 · `fc25ff7` | **BLOQUEADA** — três impedimentos estruturais |
| 2 | [`REGRA_INAUGURAL_MODELO_COMUNICACAO`](REGRA_INAUGURAL_MODELO_COMUNICACAO.md) | 2026-08-08 · `846d594` | **BLOQUEADA** — semântica absoluta inexistente |
| 3 | [`CLASSIFICACAO_DOS_NOVE_AUTOMATICOS`](CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md) | 2026-08-08 · `deeb9f3` | decisão preparatória — 2 candidatos legítimos |
| 4 | **Esta ficha, v1.0** | 2026-08-08 · `f3f8a77` | primeira candidata **escolhida após classificação completa** — lavrada com **uma** lacuna nomeada |
| 5 | **Esta ficha, v2.0** | 2026-08-08 | **decisão do DT-01 incorporada** — semântica fechada; **PRONTA PARA ATO DE MÉTODO** |

Nenhum ato anterior apagado ou renumerado. A v1.0 permanece integralmente
legível no histórico do repositório, com a lacuna que registrou.

## 20. Perguntas obrigatórias

| # | Resposta |
|---|---|
| 1 | **Sim** — `active: true` |
| 2 | **Sim** — `cruzamento: automatico` |
| 3 | **Sim** — `motorParticipation: DIRETO` |
| 4 | **Sim** — classificado assim em `deeb9f3`, candidato nº 1 |
| 5 | **Sim** — `evidenceSource: entrevista` |
| 6 | As cinco de §1, campo `principal`, todas ativas, todas `satisfiedBy: null` |
| 7 | **Três, definitivamente**: `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`, `ENVIA_RELATORIO_ESCRITO`, `PARTICIPA_DE_DISCUSSAO_DE_CASO` |
| 8 | **Sim** — negativa explícita e declarada |
| 9 | **Sim** — e é a **única** entrada que sustenta `NAO_CONFIRMADO` |
| 10 | **Sim** — uma basta |
| 11 | **Sim** — um único `CONFIRMADO`, sem gradação |
| 12 | **Não** — decidido pelo DT-01: isolada ⇒ `NENHUMA_PROPOSTA`; acompanhada de conduta direta ⇒ `CONFIRMADO` governado pela direta (§9) |
| 13 | Condicional **no enunciado**, sem representação estrutural (`conditionalRules: []`, `required: false`) |
| 14 | Por **não resposta** ⇒ sem evidência ⇒ **nenhuma proposta**. Não existe opção de "não se aplica", e a regra nunca lê ausência como independência |
| 15 | **Sim** — nenhuma proposta |
| 16 | **Não** — o catálogo tem `NAO_INFORMADO` canônico em três campos de VIABILIDADE, e **deliberadamente não** aqui; `nao_localizado` é governança e cruzá-lo violaria I-5 |
| 17 | **Sim** — I-5 não proíbe, ADR-D autoriza, e o emissor vigente (PA-17) é cego ao estado |
| 18 | **Sim** — integralmente, via vínculo exato a `evidence_id`; nunca oculto, nunca traduzido |
| 19 | **Sim** — lê apenas `practice_evidence` do par (profissional, conceito) |
| 20 | **Não participa** — as cinco opções têm `satisfiedBy: null` |
| 21 | **Sim** — zero ponte, zero linha em `derivation_rule_degree_map`, zero valor Case-side, zero estabilização |
| 22 | **Sim** — o Concierge facilita; o ato clínico permanece do profissional (§3) |
| 23 | **Não** — nenhum conflito. ADR-065 não se aplica (sem `satisfied_by`); ADR-066 é Case-side; ADR-067 confirma o automático; ADR-068 rege a confirmação; ADR-069 rege o ciclo. **1.A e 2.C: compatibilidade provada em §21** — a Regra 001 é exatamente a lavratura que o DR3 do emissor do 2.C previu |
| 24 | **Não para nascer `PROPOSTA`.** **Sim, estruturalmente, para promover a `VIGENTE`** — `approval_adr` é `not null` na constraint (§17) |
| 25 | **Sim** — fechada nas **cinco** opções; matriz exaustiva em §15.1 |
| 26 | **Não** — as 32 composições possíveis caem em **oito classes mutuamente exclusivas e exaustivas**, cada uma com saída nomeada (§15.1). A única consequência derivada (§9.4) foi **lavrada explicitamente**, não adotada em silêncio |
| 27 | **Sim** — as catorze entradas de §15 e as oito classes de §15.1 têm saída verificável |
| 28 | **Sim** — R-1 tem sete observáveis nomeados (§18) |
| 29 | **Sim** — pronta para o ato de método |
| 30 | **Sim** — `PROPOSTA → VIGENTE` é um dos cinco pares permitidos pelo grafo fechado da ADR-069, com guarda física (§21.2) |

## 21. Compatibilidades confirmadas na fonte

### 21.1 `I-5` — governança ≠ compatibilidade

**Compatível.** Nenhum dos cinco estados de `verification_status` é traduzido em
vocabulário de correspondência; nenhum bloqueia a proposta; todos acompanham
pelo vínculo exato a `evidence_id`. `nao_localizado` **não** vira
`NAO_INFORMADO` (§6.3) — foi a tentação, e foi recusada.

### 21.2 `ADR-069` — ciclo de vida

**Compatível, com guarda física.** Lido na migration do ciclo:

| Fato verificado | Efeito |
|---|---|
| `derivation_rules_nasce_em_proposta` — `check (state = 'PROPOSTA')` | a Regra 001 **nasce `PROPOSTA` obrigatoriamente** |
| grafo fechado, cinco pares permitidos | **`PROPOSTA → VIGENTE` é um deles** |
| `qualquer → PROPOSTA` proibido | o nascimento não se repete |
| `PROPOSTA → REVOGADA` proibido | não se revoga o que nunca valeu |
| estado corrente = leitura derivada da última transição (`derivation_rule_state()`), nunca coluna atualizada | a ficha não pressupõe cache algum |
| ADR exigida na entrada em `VIGENTE` | a promoção terá de citar a ADR do ato |

### 21.3 `P-04` — ausência nunca vira ausência da característica

**Compatível — e mais que isso: a decisão do §9 é P-04 aplicado** (§9.0.1).
Quatro das oito classes de §15.1 terminam em `NENHUMA_PROPOSTA` justamente
porque P-04 impede que silêncio, lacuna, contradição ou insuficiência virem
afirmação.

### 21.4 `CONTRATO_1_A` (PA-13) — a função pura

**Compatível, e é o caminho que o próprio 1.A desenhou.** O §7 do 1.A classifica
os nove automáticos como `NAO_SUPORTADO` — *"conceito automático **sem regra de
correspondência aprovada**"* — e os nomeia *"os **únicos candidatos estruturais**
a regras futuras"*.

| Momento | Ramo do 1.A para `CONTINUIDADE_COORDENACAO` |
|---|---|
| **hoje** (regra `PROPOSTA`) | permanece **`NAO_SUPORTADO`** — nada muda |
| após `PROPOSTA → VIGENTE` | sai de `NAO_SUPORTADO` e passa a **`PROPOSTO`/`LACUNA`** conforme a evidência |

A Regra 001 **não contradiz o 1.A: cumpre-o.**

### 21.5 `CONTRATO_2_C` (PA-17) — a Fronteira e o emissor

**Compatível, e responde a uma pendência que o 2.C deixou nomeada.** O DR3 do
emissor diz literalmente que *"a FORMA da correspondência evidência→estado NÃO
TEM LAVRATURA (PA-13 §10.2)"*, que o conjunto de candidatas é **vazio por
construção**, e que *"quando a lavratura da forma acontecer, é ELA que pluga a
consulta aqui (**emenda própria, nunca edição silenciosa**)"*.

> **Esta ficha é exatamente a lavratura que o 2.C previu.** Enquanto a regra não
> for `VIGENTE`, o emissor continua retornando `SEM_REGRA_VIGENTE` e a Fronteira
> segue vazio-honesta. A ligação ao emissor será **emenda própria**, em missão de
> engenharia — **não nesta**.

## 22. Veredito

> ### `CONTINUIDADE_COORDENACAO` — REGRA INAUGURAL PRONTA PARA ATO DE MÉTODO
>
> **Semântica fechada nas cinco opções canônicas.** As 32 composições possíveis
> de evidência caem em **oito classes mutuamente exclusivas e exaustivas**, cada
> uma com saída nomeada (§15.1).
>
> **Zero comportamento implícito** — a única consequência derivada da decisão
> (§9.4) foi lavrada explicitamente, com a derivação exposta.
>
> **Nenhuma ADR nova é necessária** para a regra nascer `PROPOSTA`. A ADR passa
> a ser exigida — **estruturalmente, pelo banco** — apenas na entrada em
> `VIGENTE`.
>
> **Apta a `PROPOSTA → VIGENTE`** pelo ciclo da ADR-069.
>
> **CD-1 intacta. R-1 aberta. Regra não promovida.**
