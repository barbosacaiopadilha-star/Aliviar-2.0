# Parecer Constitucional do Bloco de Domínio — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Emissor** | Agente 00 — Guardião da Curadoria 2.0 |
| **Natureza** | **Consolidação documental.** Nenhuma revisão nova, nenhuma ADR reaberta, nenhuma decisão reinterpretada |
| **Data da consolidação** | 2026-08-04 · **HEAD:** `97ed8b2` · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` |
| **Objeto** | ADR-A (Propostas de Derivação) · ADR-B (Juízo Humano) · ADR-D (Autoridade de Confirmação) |
| **Documentos revisados no percurso** | `ARQUITETURA_CURADORIA_2_0.md` v1.0 → v1.1 → v1.2 · `ADR_A_PROPOSTAS_DE_DERIVACAO.md` v1.0 · `ADR_B_JUIZO_HUMANO.md` v1.0 · `ADR_D_AUTORIDADE_DE_CONFIRMACAO.md` v1.0 |
| **Bases de aferição** | Constituição da Aliviar · ADR-035 · `MODELO_CURADORIA_V1.md` v2.0 · `CONGELAMENTO_ARQUITETURAL.md` · `AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md` · `DOMINIO_COMPATIBILIDADE_RELACIONAL.md` v1.0 · `REGISTRO_DAS_GUARDAS_2_0.md` |
| **Finalidade** | Permitir ao Arquiteto incorporar **exatamente** as ressalvas aprovadas, sem recorrer a histórico de conversa |

> **Este documento consolida pareceres já emitidos.** Não cria ressalva nova, não retira
> ressalva emitida, não altera decisão e não modifica o texto de nenhuma ADR.
>
> **Nenhum veredito aqui registrado autoriza implementação.**

---

## 1. Parecer final

### 1.1 Vereditos emitidos, na ordem

| # | Objeto | Veredito |
|---|---|---|
| 1 | `ARQUITETURA_CURADORIA_2_0.md` **v1.0** | **APROVADA COM CORREÇÕES OBRIGATÓRIAS** — sete bloqueadores e doze ressalvas |
| 2 | `ARQUITETURA_CURADORIA_2_0.md` **v1.1** | **APROVADA COM CORREÇÕES DOCUMENTAIS** — cinco correções (C-1 a C-5) |
| 3 | `ARQUITETURA_CURADORIA_2_0.md` **v1.2** | **APROVADA COM PENDÊNCIAS DE ADR E REGULARIZAÇÃO** — as cinco correções verificadas e resolvidas |
| 4 | **ADR-A** | **APROVADA COM RESSALVAS** — as sete ressalvas do §2 deste documento |
| 5 | **Bloco ADR-A + ADR-B + ADR-D** | **APROVADO COM RESSALVAS** |

### 1.2 Situação constitucional do bloco

As três ADRs formam um domínio **coerente, fronteirado e constitucionalmente sólido**. Na revisão integrada não foi encontrada violação de princípio, autoridade ambígua, responsabilidade indevidamente compartilhada, ciclo impossível ou invasão de competência entre ADRs.

**A ADR-A passa a integrar oficialmente a Constituição da Curadoria 2.0**, com a ressalva **R-1** operando como condição de vigência da reabertura de I-10.

**O domínio da Curadoria 2.0 NÃO está fechado.** O fechamento depende de decisões humanas nomeadas e de atos documentais — não de mais arquitetura.

---

## 2. As sete ressalvas

Emitidas na revisão constitucional da ADR-A. **Todas permanecem abertas**: o arquivo `ADR_A_PROPOSTAS_DE_DERIVACAO.md` não foi alterado desde a emissão. Devem ser incorporadas **no ato da lavratura**.

### R-1 — Vigência da ponte grau → importância

> **Nenhuma regra da ponte grau→importância pode alcançar o estado `VIGENTE` antes de a Rede real existir e de Cases reais estarem em curso.** Até lá permanece em `PROPOSTA` ou `SUSPENSA`.

**Fundamento.** O §6 do `CONGELAMENTO_ARQUITETURAL.md` exige, cumulativamente, cinco requisitos para reabrir decisão congelada. O critério 1 — *necessidade observada em operação real, Case concreto, não hipótese* — **não está satisfeito**, e a própria ADR-A o declara (§18.4 item 2 e §18.5). Uma ponte sem valores nada oferece; uma regra que não é `VIGENTE` não propõe (Arquitetura §10.5). A conversão que I-10 existe para impedir, portanto, **não passa a existir por esta aprovação**.

**Efeito.** A reabertura de I-10 é aprovada **quanto à forma e à governança**; torna-se efetiva apenas quando existir valor de correspondência, e nesse momento o critério 1 deve estar satisfeito — o que ocorre na entrada da Onda 5. A derivação do estado do profissional (Arquitetura §10.4) **não é afetada**: não é ponte entre escalas e não toca I-10.

**Registro de método.** Foram examinados os três caminhos do §18.5 da ADR-A. O caminho **C** — declarar que o critério 1 não se aplica a decisões de forma — foi **recusado**: emendaria o §6 do Congelamento por interpretação unilateral. O caminho **B** foi recusado por sacrificar o único ganho de Método da ponte. Adotou-se o caminho **A**, condicionado.

### R-2 — Instituição de P-07, P-08 e P-10

> **A ADR-A deve instituir explicitamente P-07, P-08 e P-10 como princípios de domínio.**

**Fundamento.** A Arquitetura §15 atribui à ADR-A a promoção desses três princípios, e a própria ADR-A registra em Pendências que *"DP-7 — esta ADR é o veículo"*. O §19 enumera dezessete itens de domínio e nenhum deles é essa promoção. Sem ela, DP-7 permanece aberta e os três princípios sobre os quais o bloco inteiro se apoia continuam sendo *propostas de princípio*.

### R-3 — Impacto sobre o `MODELO_CURADORIA_V1.md`

> **A afirmação "`MODELO_CURADORIA_V1.md` — sem impacto direto" está incorreta e deve ser substituída.**

**Fundamento.** O §12 do Modelo determina que toda ADR que altere a Curadoria **deve referenciá-lo e atualizar a versão**. A ADR-A cria conceitos de domínio que exigem: entrada de *proposta de derivação* e *ponte* no **§10** (vocabulário oficial) e registro da decisão no **§11** (estado da implementação), além do avanço de versão do Modelo. Não fazê-lo repete o padrão **P17** — decisão registrada com corpo normativo desatualizado.

*Observação de escopo:* a reescrita de **§7.1, §7.2, §7.3, §7.4 e §11** é matéria da **ADR-B §30**, que já traz o texto prescrito. R-3 trata do que cabe à ADR-A e não está coberto ali.

### R-4 — Cláusula de precedência do §11(b)

> **Retirar a cláusula "enquanto não o fizer, vale esta ADR".** O quinto estado (`RETIRADA`) é aceito; a emenda à Arquitetura §9.4 é ato do Arquiteto, posterior à aprovação.

**Fundamento.** Uma ADR em revisão não pode pré-declarar que prevalece sobre documento arquitetural já aprovado. O mérito do quinto estado foi aceito: `SUPERADA` descreve mudança **no fato** e `RETIRADA` descreve mudança **na regra**; fundi-las apagaria a distinção que calibra a regra no painel de discordância.

### R-5 — Frase final do §22

> **Reescrever a frase "o Implementador pode construir a estrutura de registro de `curator_judgments` a partir desta ADR".**

**Fundamento.** Contradiz o §25 da própria ADR-A (*"Esta ADR não autoriza implementação"*) e a guarda **C-01**. Nenhuma passagem de qualquer ADR do bloco pode liberar construção. A forma admissível é condicional — *"poderá construir, quando autorizado"*.

### R-6 — Item 2 do §13 do Modelo

> **Argumentar explicitamente por que o Modelo v1.0 não responde ao problema.**

**Fundamento.** O §13 do Modelo exige quatro requisitos para conceito novo. A ADR-A cumpre três (justifica o problema, é ADR específica, apresenta plano de compatibilidade). O segundo está implícito em D1/D2 da auditoria e precisa estar escrito.

### R-7 — Exceção LGPD do §8

> **A exceção de eliminação sob LGPD deve ser confirmada contra ADR-038 e ADR-055 por quem responde por elas, não asseverada na ADR-A.**

**Fundamento.** A ADR-A afirma que o exercício do direito de eliminação apaga o Case inteiro, e não propostas seletivamente. A conclusão é plausível e o efeito é correto; a competência para declará-la é de quem responde pela política de retenção.

---

## 3. Fundamentos

### 3.1 Princípios — situação verificada

| # | Princípio | Situação |
|---|---|---|
| P-01 | conhecimento pertence ao Método | **preservado** |
| P-02 | o Motor organiza, não escolhe | **preservado** |
| P-03 | a decisão dos três é humana e nomeada | **preservado** |
| P-04 | ausência nunca vira ausência da característica | **preservado** |
| P-05 | verificar é ato humano assinado sobre versão | **preservado** |
| P-06 | histórico é imutável | **preservado** |
| P-07 | uma origem por fato | **preservado na prática · não instituído** (R-2) |
| P-08 | proposta nunca é declaração | **preservado na prática · não instituído** (R-2) |
| P-09 | toda proposta diz de onde veio | **preservado** |
| P-10 | confirmar não é mais barato que discordar | **preservado na prática · não instituído** (R-2) |
| P-11 | a paciente lê o que o Motor concluiu | **preservado** |

**Nenhum princípio violado.**

### 3.2 Invariantes

**Congeladas e preservadas:** I-1, I-2, I-3, I-4, I-5, I-6, I-7, I-8, I-9, I-11, I-12.

**Reaberta:** **I-10**, em substância, declarada na ADR-A §18 e condicionada por **R-1**. A decisão de aprovar ou recusar a reabertura é do **Fundador** e ainda não foi dada.

**Item congelado examinado e mantido:** **ADR-040 item 6** (RLS do Mapa do Profissional). A ADR-D §14.2 recusa a ampliação que a pendência DP-9 supunha necessária, e responde DP-9 com **"não ampliar"**.

**Nenhuma invariante passa a depender de ADR além de I-10.**

### 3.3 Garantias do Congelamento

As **oito garantias do §4** permanecem intactas. Os **28 conceitos**, as **15 células**, os **4 resultados**, os **5 níveis de importância** e os **3 estados do profissional** permanecem inalterados. As **treze decisões humanas** permanecem intocadas.

### 3.4 Guardas

A guarda **C-01** permanece **correta e vermelha**. Nenhuma ADR do bloco pede, autoriza ou antecipa sua suspensão. A suspensão exige as três instâncias previstas — Guardião, Arquiteto e Governança.

### 3.5 Correções verificadas na Arquitetura v1.2

As cinco correções documentais foram verificadas e estão **resolvidas**: C-1 (declaração da reabertura de I-10, §10.3.0) · C-2 (responsabilidade sobre filtros eliminatórios, §14) · C-3 (retirada do Concierge de C4, §2.2) · C-4 (bloqueio formal do regime de confirmação em bloco, §5.4.0) · C-5 (critérios de aceite bloqueantes AC-EXPLICA, AC-PIPELINE e AC-BLOCO, §17.4).

---

## 4. Veredito

### **BLOCO CONSTITUCIONAL APROVADO COM RESSALVAS**

**A ADR-A passa a integrar oficialmente a Constituição da Curadoria 2.0**, condicionada à ressalva **R-1** e à incorporação de **R-2 a R-7** no ato da lavratura.

**ADR-B** e **ADR-D** são aprovadas sem ressalva própria.

**O domínio da Curadoria 2.0 não é declarado fechado.** Fechá-lo agora seria declarar completo um domínio cuja peça central depende de decisão ainda não dada, cujos três princípios de sustentação ainda não são domínio, e cujo campo obrigatório não tem escala.

**Nenhum veredito deste documento autoriza implementação.**

---

## 5. Condições

| # | Condição | Vinculada a |
|---|---|---|
| **CD-1** | Nenhuma regra da ponte grau→importância alcança `VIGENTE` antes de a Rede real existir e de Cases reais estarem em curso | **R-1** |
| **CD-2** | As sete ressalvas são incorporadas **no ato da lavratura** da ADR-A em `DECISIONS.md` | **R-1 a R-7** |
| **CD-3** | A reescrita do `MODELO_CURADORIA_V1.md` §7.1–§7.4 e §11 é executada **no mesmo ato** da lavratura da ADR-B, conforme o texto prescrito em ADR-B §30 | ADR-B §30 |
| **CD-4** | As emendas da Arquitetura **§9.4** (quatro → cinco estados; desfecho fora da proposta) e **§8.2** (o recorte permanece) são executadas pelo Arquiteto | ADR-A §11b · ADR-D §14.2 |
| **CD-5** | A aprovação ou recusa da reabertura de I-10 é ato do **Fundador**, e a ponte não existe sem ela | ADR-A §18.5 |
| **CD-6** | Os documentos da 2.0 são versionados em **commit controlado**, separado do pacote de segurança em curso | §0.4 da Arquitetura |

---

## 6. Autorização

### 6.1 Autorizado

| # | Ato | Responsável |
|---|---|---|
| A-1 | **Onda 0** — prosseguir integralmente, incluindo nomear a Autoridade de Método e versionar os documentos | Fundador · engenharia |
| A-2 | **Lavratura das ADR-A, ADR-B e ADR-D** em `DECISIONS.md`, sob CD-2, CD-3 e CD-4 | Guardião · Fundador |
| A-3 | **Revisão do Modelo** — reescrita de §7.1–§7.4 e §11, mais as entradas de §10 e §11 exigidas por R-3 | Arquiteto |
| A-4 | **Atualização do Congelamento** — registrar a reabertura de I-10 no §5, se e quando o Fundador a aprovar | Arquiteto, após CD-5 |
| A-5 | **Incorporação das sete ressalvas** ao texto da ADR-A | Arquiteto |
| A-6 | **Fechamento de DP-9** com a resposta "não ampliar" | Fundador, por homologação |
| A-7 | **Preparação e execução da Onda 1** — não depende de nenhuma das três ADRs | Implementador, sob missão própria |

### 6.2 Não autorizado

| # | Ato |
|---|---|
| N-1 | **Reabertura do pacote F-02** |
| N-2 | **Qualquer implementação, código, migration, tabela, policy ou constraint** derivada deste bloco |
| N-3 | **Suspensão da guarda C-01** |
| N-4 | **Fixação de qualquer valor da ponte grau→importância** |
| N-5 | **Existência do regime de confirmação em bloco no repositório** — inclusive atrás de feature flag |
| N-6 | **Ampliação do recorte de escrita do Mapa do Profissional** sem o rito completo do §6 do Congelamento |

---

## 7. Bloqueios remanescentes

### 7.1 Lacunas de domínio e de documentação

| # | Lacuna | Natureza |
|---|---|---|
| **L-1** | **Grau de consequência: campo obrigatório sem escala definida.** ADR-A §14.1 item 12 o torna obrigatório e §12 o torna imutável; a régua que o define é **DP-5**, aberta | **Domínio — bloqueia o F-02** |
| **L-2** | **DP-7 aberta** — P-07, P-08 e P-10 sustentam o bloco e ainda não são domínio | Domínio (R-2) |
| **L-3** | **A ponte grau→importância pode não existir** — decisão do Fundador pendente, sob CD-1 | Domínio (R-1) |
| **L-4** | **As sete ressalvas da ADR-A não foram incorporadas** | Documental (CD-2) |
| **L-5** | **Não existe lista canônica fechada dos verbos do domínio** — Arquitetura §14 (seis), ADR-B §16 (sete) e ADR-D §3 (cinco), sem contradição de conteúdo e sem fechamento único | Documental |
| **L-6** | **"Juízo de filtro" é categoria não nomeada** — juízo que é Juízo Humano e não é julgamento registrado | Documental |
| **L-7** | **CONFIRMAR tem extensão diferente** em ADR-B §16 (inclui recusar) e ADR-D §1 (adoção apenas) | Documental |
| **L-8** | **Reescrita do Modelo §7.1–§7.4 e §11 prescrita, não executada** | Documental (CD-3) |
| **L-9** | **Emendas da Arquitetura §9.4 e §8.2 não executadas** | Documental (CD-4) |
| **L-10** | **As três ADRs não estão lavradas** e nenhum documento da 2.0 está versionado | Governança (CD-6) |
| **L-11** | **A Autoridade de Método não tem ocupante** (DP-4) e **a segunda conta da ADR-060 não existe** — sem ela a incompatibilidade da ADR-D §13.2 é inexequível | Governança |

### 7.2 Contradição textual residual

| # | Item |
|---|---|
| **X-1** | **ADR-A §22** autoriza construir a estrutura de registro de `curator_judgments`, contra o §25 da própria ADR e contra a guarda C-01. Endereçada por **R-5** |

### 7.3 Impedimentos do F-02

| Impedimento | Situação |
|---|---|
| **I-1** · ADRs inexistentes | **removido** por ADR-A e ADR-B |
| **I-2** · A regra §15.0 proíbe começar por aqui | **aberto** — sequenciamento; Onda 1 não iniciada |
| **I-3** · Entrada da Onda 2 não satisfeita | **aberto** — restam Onda 1, DP-1 e DP-4 |
| **I-4** · Colisão com a guarda C-01 | **aberto, e deve continuar** |
| **L-1** | **aberto** — impedimento de domínio, acrescentado por este parecer consolidado |

### 7.4 Decisões humanas pendentes

**DP-1** (veredito sobre P15) · **DP-2** (destino do ACE) · **DP-3** (listas provisórias P3–P7) · **DP-4** (nomear a Autoridade de Método) · **DP-5** (régua de graduação por consequência) · **DP-6** (valores da ponte, após Cases reais) · **DP-7** (P-07/P-08/P-10 viram domínio) · **DP-9** (respondida com "não ampliar", aguardando homologação) · **DP-10** (versionar os documentos) · **DP-11** (persistir os pareceres do Guardião — atendida por este documento).

### 7.5 Pré-condições técnicas herdadas

Reconciliação do ledger de produção · janela autorizada para DDL em produção · árvore de trabalho limpa com o pacote de segurança separado · contenção das sessões paralelas · **existência da Rede real**, sem a qual a Onda 5 não começa e a ponte não estabiliza.

---

## 8. Riscos registrados

Permanecem válidos e não são reabertos aqui: **RA-1 a RA-6** (ADR-A), **RB-1 a RB-6** (ADR-B), **RD-1 a RD-6** (ADR-D), **RR-1 a RR-6** (Arquitetura §16.1), e os acrescentados pelo Guardião: **RG-1** (ponte vigente antes da Rede real), **RG-2** (imutabilidade da proposta sem guarda), **RG-3** (L-1 resolvida por iniciativa do Implementador), **RG-4** (verbo novo em superfície por ausência de lista canônica), **RG-5** (ressalvas perdidas na lavratura).

---

## 9. Conformidade desta consolidação

Nenhuma revisão nova foi realizada. Nenhuma ADR foi reaberta. Nenhuma decisão foi reinterpretada. Nenhuma ressalva foi criada ou retirada. Nenhum texto de ADR, do Modelo, do Congelamento ou da Arquitetura foi alterado. Nenhum commit foi feito.

**Este documento não autoriza implementação.**

---

*Fim do parecer consolidado. **Próximo destino: Agente 02 — Arquiteto**, para encerramento
definitivo da Consolidação Arquitetural: incorporar as sete ressalvas do §2, executar as
condições CD-2 a CD-4, e devolver o bloco à lavratura. Nenhuma implementação, nenhum
código, nenhuma migration.*
