# Regra Material 001 — `CONTINUIDADE_COORDENACAO`

| Campo | Valor |
|---|---|
| **Versão do documento** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **BLOQUEADA POR UMA DECISÃO MATERIAL** — semântica completa em 4 das 5 opções; falta **um** ato do DT-01 (§9 desta ficha) |
| **Base** | `deeb9f3` |
| **Origem** | Decisão do **DT-01** após a classificação dos nove automáticos: `CONTINUIDADE_COORDENACAO` é o alvo da primeira Regra Material |
| **Natureza** | Lavratura documental. **Zero código, zero migration, zero promoção** |

> **Esta não é uma terceira tentativa fracassada.** A Residência foi bloqueada
> por **três impedimentos estruturais** (a regra não podia sequer executar). A
> Comunicação foi bloqueada por **ausência total** de semântica absoluta lavrada.
> Aqui a semântica **existe e está completa** para quatro das cinco opções
> canônicas; resta **uma classificação binária** que o próprio DT-01 mandou não
> inferir (§9 da missão). **Um ato de método destrava a regra inteira.**

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

Derivar quando a evidência corrente contiver **pelo menos uma** das condutas
canônicas positivas:

- `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`
- `ENVIA_RELATORIO_ESCRITO`
- `PARTICIPA_DE_DISCUSSAO_DE_CASO`
- *(`ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` — **pendente do §9**)*

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

## 9. **A LACUNA — `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`**

### 9.1 O que foi procurado, e não encontrado

Varredura completa por autoridade que classifique esta opção como coordenação
positiva ou não:

| Fonte consultada | Resultado |
|---|---|
| Catálogo gerado (HEAD) | lista a opção; **não classifica** |
| `method_subcriterion_options` (migration 1.0.0) | insere a opção; **não classifica** |
| `PROTOCOLO_PRATICA_PROFISSIONAL.md` Q9 | trata as **cinco** uniformemente como "condutas" — inclusive a negativa; **não classifica** |
| `CATALOGO_CANONICO_PROPOSTA.md` | lista as cinco em linha; **não classifica** |
| ADRs, Domínio Relacional, Modelo da Curadoria, Contratos 1.A/2.C | **silêncio total** |

**Nenhuma autoridade vigente resolve.** O §9 da missão é literal: *"Não inferir.
Se a autoridade existente não resolver: trazer especificamente ao DT-01."*

### 9.2 Por que não posso resolver sozinho

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

### 9.3 O tamanho exato da lacuna

**A decisão só altera um único caso** — a opção **isolada**:

| Composição da evidência | Saída se **conta** | Saída se **não conta** |
|---|---|---|
| `ORIENTA…` **sozinha** | **`CONFIRMADO`** | **nenhuma proposta** |
| `ORIENTA…` + qualquer positiva | `CONFIRMADO` | `CONFIRMADO` (§10) |
| `ORIENTA…` + `ATUA_DE_FORMA_INDEPENDENTE` | contradição → §11 desta ficha | contradição → §11 desta ficha |

Em **nenhuma** hipótese a opção produz `NAO_CONFIRMADO` — este exige a negativa
explícita (§6.2). **Nada de punitivo depende desta decisão**; depende apenas se
a conduta, sozinha, é suficiente para afirmar coordenação.

### 9.4 As duas saídas para o DT-01

| | Leitura | Consequência |
|---|---|---|
| **A** | é **coordenação positiva suficiente** — o profissional age deliberadamente para que a informação circule | conjunto positivo = **quatro** condutas |
| **B** | é **conduta intermediária** que não caracteriza coordenação direta — o conceito mede *"como conversa com os outros profissionais"*, e aqui não há conversa | conjunto positivo = **três** condutas; a opção isolada **não propõe nada** |

**Sem recomendação.** A escolha é ato de método, não de arquitetura.

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

> **Decisão, pelo fallback expressamente autorizado no §20 da missão:**
> presença simultânea de conduta positiva **e** `ATUA_DE_FORMA_INDEPENDENTE` na
> mesma versão corrente ⇒ **nenhuma proposta**, com desfecho tipado
> `EVIDENCIA_CONTRADITORIA`. A regra **não arbitra silenciosamente**. A
> contradição é fato da evidência e volta para quem a coletou.

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
| **D** | `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` **isolada** | ⛔ **PENDENTE DO §9** — `CONFIRMADO` (A) ou nenhuma proposta (B) |
| **E** | `ATUA_DE_FORMA_INDEPENDENTE` | **`NAO_CONFIRMADO`** |
| **F** | nenhuma evidência | **nenhuma proposta** |
| **G** | valor fora das cinco canônicas | **nenhuma proposta** · `EVIDENCIA_INCOMPATIVEL` |
| **H** | evidência `nao_verificado` (ou `divergente`/`nao_localizado`/`desatualizado`) | **propõe normalmente**; estado acompanha a proveniência, **nunca oculto, nunca traduzido** (§8.1) |
| **I** | múltiplas condutas positivas | **um único `CONFIRMADO`** |
| **J** | cenário nunca aplicável | **nenhuma proposta** — jamais `NAO_CONFIRMADO`, jamais `NAO_INFORMADO` (§7) |
| **K** | positiva **+** `ATUA_DE_FORMA_INDEPENDENTE` na mesma versão | **nenhuma proposta** · `EVIDENCIA_CONTRADITORIA` (§11) |
| **L** | evidência corrente com `options` vazio | **nenhuma proposta** (§6.4) |

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

Nasce **`PROPOSTA`** (default da tabela) e **metodologicamente provisória**.
**Nenhum threshold inventado.** **R-1 permanece aberta.**

**Descoberta relevante para a promoção:** a constraint
`derivation_rules_vigente_exige_autoridade` torna estrutural o que era doutrina —
`state = 'VIGENTE'` exige **`approved_by`**, **`approval_adr`** e
**`effective_from`**. Ou seja: **`PROPOSTA` não exige ADR; `VIGENTE` exige, no
banco**. A transição pela ADR-069 é possível e já tem guarda física.

## 18. O que R-1 deve observar

Confirmação pelo Curador · recusa e **motivo** · distância entre conduta
declarada e prática observada · **quantas vezes `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`
aparece isolada** (mede o custo real da decisão do §9) · seleção de
`ATUA_DE_FORMA_INDEPENDENTE` por quem nunca enfrentou o cenário (§7) ·
frequência de `EVIDENCIA_CONTRADITORIA` · mudanças de evidência ao longo dos
12 meses de revisão.

## 19. Histórico das tentativas — preservado, sem renumeração

| # | Ato | Data | Desfecho |
|---|---|---|---|
| 1 | [`REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA`](REGRA_001_FORMACAO_RESIDENCIA_PRESENCA_COMPROVADA.md) | 2026-08-08 · `fc25ff7` | **BLOQUEADA** — três impedimentos estruturais |
| 2 | [`REGRA_INAUGURAL_MODELO_COMUNICACAO`](REGRA_INAUGURAL_MODELO_COMUNICACAO.md) | 2026-08-08 · `846d594` | **BLOQUEADA** — semântica absoluta inexistente |
| 3 | [`CLASSIFICACAO_DOS_NOVE_AUTOMATICOS`](CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md) | 2026-08-08 · `deeb9f3` | decisão preparatória — 2 candidatos legítimos |
| 4 | **Esta ficha** | 2026-08-08 | primeira candidata **escolhida após classificação completa** |

Nenhum ato anterior apagado ou renumerado.

## 20. Perguntas obrigatórias

| # | Resposta |
|---|---|
| 1 | **Sim** — `active: true` |
| 2 | **Sim** — `cruzamento: automatico` |
| 3 | **Sim** — `motorParticipation: DIRETO` |
| 4 | **Sim** — classificado assim em `deeb9f3`, candidato nº 1 |
| 5 | **Sim** — `evidenceSource: entrevista` |
| 6 | As cinco de §1, campo `principal`, todas ativas, todas `satisfiedBy: null` |
| 7 | Três inequívocas: `CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL`, `ENVIA_RELATORIO_ESCRITO`, `PARTICIPA_DE_DISCUSSAO_DE_CASO`. A quarta depende do §9 |
| 8 | **Sim** — negativa explícita e declarada |
| 9 | **Sim** — e é a **única** entrada que sustenta `NAO_CONFIRMADO` |
| 10 | **Sim** — uma basta |
| 11 | **Sim** — um único `CONFIRMADO`, sem gradação |
| 12 | ⛔ **INDETERMINADO — a lacuna.** Nenhuma autoridade vigente resolve (§9) |
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
| 23 | **Não** — nenhum conflito. ADR-065 não se aplica (sem `satisfied_by`); ADR-066 é Case-side; ADR-067 confirma o automático; ADR-068 rege a confirmação; ADR-069 rege o ciclo |
| 24 | **Não para nascer `PROPOSTA`.** **Sim, estruturalmente, para promover a `VIGENTE`** — `approval_adr` é `not null` na constraint (§17) |
| 25 | **Não** — completa em 4 de 5 opções; falta o §9 |
| 26 | **Não** — nenhum comportamento implícito foi adotado; **é justamente por recusar adotá-lo que a ficha está bloqueada** |
| 27 | **Sim** — cada um dos doze casos de §15 tem saída verificável, e onze estão fechados |
| 28 | **Sim** — R-1 tem sete observáveis nomeados (§18) |
| 29 | **Quase** — pronta em tudo, exceto **um** ato de método |
| 30 | **Sim** — `PROPOSTA → VIGENTE` pela ADR-069, com a guarda física da constraint |

## 21. Veredito

> ### `CONTINUIDADE_COORDENACAO` — BLOQUEADA
>
> **Lacuna, exclusivamente:**
>
> **A classificação da opção canônica `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO`
> como conduta de coordenação positiva suficiente para `CONFIRMADO` (A) ou como
> conduta intermediária que não caracteriza coordenação (B).**
>
> Nenhuma autoridade vigente a resolve, e o §9 da missão proíbe inferir.
> Decidido isso, **nada mais falta**: as outras onze saídas estão fechadas, a
> proveniência está completa, CD-1 está intacta, nenhuma ADR nova é necessária
> e a regra nasce `PROPOSTA` apta ao ciclo da ADR-069.
