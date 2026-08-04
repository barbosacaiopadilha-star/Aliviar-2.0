# ARQUITETURA DA CURADORIA 2.0

> **Natureza:** documento arquitetural. **Nada foi implementado.** Nenhum código,
> migration, banco, API, componente, teste ou documento existente foi alterado para
> produzi-lo. Este arquivo é o único produto da missão.
>
> **Versão:** **v1.3 — consolidação arquitetural (pacote A-01, 2026-08-04)** · v1.2 correções
> documentais · v1.1 revisão dirigida · v1.0 inicial.
> **Branch:** `seguranca/menor-privilegio-funcoes-governanca` · **HEAD:** `97ed8b2`
>
> **Estado:** **ARQUITETURA CONSOLIDADA** — as decisões que este documento propunha foram
> aprovadas pelo Fundador e lavradas como **ADR-066**, **ADR-067** e **ADR-068**
> (2026-08-04). Aguarda a **última revisão constitucional do Agente 00**.
> **O Agente 03 (Implementador) continua não autorizado.**
>
> **Ordem de precedência, a partir da v1.3:** onde este documento divergir das
> **ADR-066/067/068** ou do **`MODELO_CURADORIA_V1.md` v3.0**, **valem as ADRs e o
> Modelo**. Este documento é o mapa; eles são a norma.
>
> **Vocabulário:** a lista canônica dos verbos do domínio vive em
> [`MODELO_CURADORIA_V1.md` §10.1](MODELO_CURADORIA_V1.md) — **fonte única**.
> As listas parciais que existiam nas ADRs foram unificadas lá.
>
> **O que a v1.1 corrigiu:** sete bloqueadores e doze ressalvas do parecer
> constitucional. **O que a v1.2 corrigiu:** cinco correções documentais.
> **O que a v1.3 fez:** consolidou §8.2 e §9.4 conforme as ADRs aprovadas.
> O registro completo está no
> [§0 — Registro da revisão](#0--registro-da-revisão-governança).
>
> **Níveis deste documento** (§12 do parecer). Cada seção declara o seu no título:
> **[DOMÍNIO]** exige ADR para mudar · **[ARQUITETURA]** exige aprovação do Guardião ·
> **[IMPLEMENTAÇÃO]** · **[INTERFACE]** · **[OPERAÇÃO]** · **[IMPLANTAÇÃO]** ·
> **[GOVERNANÇA]**. Apenas as seções **[DOMÍNIO]**, **[ARQUITETURA]** e
> **[GOVERNANÇA]** são candidatas a canônicas; as demais são **derivadas** e
> revisáveis sem ADR.
>
> **Entradas usadas (sem nova auditoria):**
> [`AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md`](AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md) (D1–D7, P1–P20, R1–R10, G1–G8, O1–O9, RI1–RI10),
> [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0,
> [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) (I-1..I-12),
> [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md) v1.0,
> [`CATALOGO_CANONICO_OPERACAO.md`](CATALOGO_CANONICO_OPERACAO.md),
> [`../DECISIONS.md`](../DECISIONS.md) ADR-035..ADR-065,
> [`../CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](../CORRECAO_DOMINIO_PAPEIS_E_CASE.md) (três níveis humanos),
> [`../INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md`](../INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md) (Etapa 1),
> [`PLANO_DE_PACOTES_CURADORIA_2_0.md`](PLANO_DE_PACOTES_CURADORIA_2_0.md) (impedimento do Implementador).
>
> **Limite herdado:** a Rede real é inexistente em produção. Toda afirmação sobre
> carga é **estrutural**, não empírica — e o §16 trata isso como risco, não como
> detalhe.

---

## 0 — Registro da revisão **[GOVERNANÇA]**

### 0.1 Entrada não localizada como arquivo

O parecer constitucional do Agente 00 **não existe como documento no repositório**:
`grep -rl "Agente 00\|Guardião\|parecer constitucional" docs/` não retorna
nenhum arquivo. As diretivas corretivas chegaram **apenas pela missão**, e é
delas que esta revisão deriva.

**Consequência declarada:** os "sete bloqueadores" e as "doze ressalvas" citados
pela missão **não estão enumerados em lugar nenhum**. As matrizes do §0.2 e §0.3
são **reconstrução do Agente 02** a partir das catorze diretivas recebidas — não
transcrição de um original. Se a enumeração do Guardião divergir desta, **vale a
dele**, e a divergência deve ser corrigida antes de qualquer aprovação.

**Recomendação de governança:** o parecer deve ser gravado como arquivo
versionado antes da próxima revisão. Um parecer constitucional que só existe em
histórico de conversa é exatamente o tipo de conhecimento que o **P-01** proíbe.

### 0.2 Os sete bloqueadores e sua resolução

| # | Bloqueador (reconstruído) | Onde estava na v1.0 | Resolução na v1.1 | Seção |
|---|---|---|---|---|
| **B1** | Derivação dentro do mesmo pipeline da leitura (E1–E7): a fronteira humana era regra escrita, não estrutura | §2.3 | **Dois pipelines fisicamente separados** + Fronteira Humana obrigatória entre eles. Declarado: *proposta não é entrada válida para o Pipeline de Leitura* | §2.3–§2.5 |
| **B2** | Ranking por construção: ordenação por prontidão/confiança | §4.6, §10.1 M3, §15 (ADR-C) | **Removida.** Ordem neutra da Rede preservada. **ADR-C retirada do caminho** e registrada como decisão futura bloqueada | §4.6, §10.1, §15 |
| **B3** | Explicabilidade na Onda 4 — depois de derivações já apresentadas a humanos | §15 | **Antecipada para a Onda 1.** Invariante de implantação novo | §11.0, §15 |
| **B4** | Confirmação em bloco tratada como padrão da 2.0 | §3.6, §16 R-01 | **Reclassificada como mecanismo excepcional**, com 12 condições obrigatórias | §5.4 |
| **B5** | Autoridade da regra de derivação não nomeada | §10.3 | **Função formal de governança do Método** definida, com ciclo de vida completo da regra | §10.5 |
| **B6** | Onda 1.2 persistia derivação antes das dependências existirem | §15 | **Limitada a função pura sem persistência e sem consumidor**; persistência movida para depois de todas as dependências | §15 |
| **B7** | P-07..P-12 apresentados no mesmo plano de princípios constitucionais | §1 | **Reclassificados** com coluna de autoridade e ADR exigida | §1.2 |

### 0.3 As doze ressalvas e sua resolução

| # | Ressalva (reconstruída) | Resolução na v1.1 | Seção |
|---|---|---|---|
| **RS-01** | Reconhecimento em duas colunas sem onda, responsável, entradas, saídas nem comportamento em exceção | Especificação completa, com os quatro desfechos e o bloqueio de reconhecimento silencioso | §6.2 |
| **RS-02** | `derivation_proposals` podia virar fonte paralela de verdade | Passa a **referenciar** a declaração autoritativa final; nunca guarda o valor final como autoridade própria | §9.4 |
| **RS-03** | `curator_judgments` incluía `AREA` | `AREA` **retirada** — filtro eliminatório tem estrutura própria | §9.4, §11-filtros |
| **RS-04** | "Migrar" `criterion_declarations` | Trocado por **copiar preservando integralmente a origem**; as históricas permanecem legíveis e auditáveis | §9.4–§9.5 |
| **RS-05** | Append-only não declarado nas duas entidades novas | **Ambas append-only**, explicitamente | §9.4 |
| **RS-06** | Ciclo de supersessão e retificação indefinido | Ciclo de 8 passos, com supersessão automática da confirmação | §10.6 |
| **RS-07** | Filtro proposto diretamente a partir de grau `ESSENCIAL` | Passa a **sinalizar para discussão**, nunca propor filtro pronto | §5.5 |
| **RS-08** | Filtros dentro da confirmação em bloco | **Proibido** — filtros são item a item, sempre | §5.4, §5.5 |
| **RS-09** | Dez documentos canônicos novos | Substituídos por **dois níveis** (canônico / derivado) | Apêndice |
| **RS-10** | "eixo no Motor" | Trocado em todo o texto por **"eixo em quem declara"** | todo o documento |
| **RS-11** | Dívida documental do Modelo não prevista na ADR da AVALIAÇÃO | ADR-B passa a exigir atualização de §7.1, §7.2, §7.3, §7.4 e §11 | §15 |
| **RS-12** | Estado do processo e da árvore não registrado | Registrado integralmente | §0.4 |

### 0.3b As cinco correções documentais finais (v1.2)

Veredito do Agente 00 sobre a v1.1: **arquitetura aprovada com correções
documentais**. Pipelines, Fronteira Humana, ondas, entidades e tese **não foram
redesenhados**. Executadas apenas estas cinco:

| # | Correção | Resolução | Seção |
|---|---|---|---|
| **C-1** | Declarar a reabertura substancial de **I-10** | A ponte **reabre I-10 em substância**, preservando apenas a distinção formal. Seis consequências vinculantes, incluindo a proteção do teste `importancia-vs-grau.test.ts` até a ADR-A | **§10.3.0 (nova)**, §10.3 item 3 |
| **C-2** | Corrigir o mapa de responsabilidades dos filtros | `DERIVA` do Motor **removido**; sete papéis corretos declarados; regra de precedência do §5.5 | §14 (linha + nota) |
| **C-3** | Retirar o Concierge da camada **C4** | C4 passa a ser **Curador · Sistema**; Concierge atua **após a entrega** e não participa da formação da recomendação | §2.2 (linha + nota) |
| **C-4** | Bloquear explicitamente a confirmação em bloco | Regime **proibido** até DP-5 por ADR — sem implementação, sem ativação, sem aceite, **sem feature flag**. DP-5 vira pré-condição formal da Onda 2 | **§5.4.0 (nova)**, §15 Onda 2, §16.1 RR-2, §17.4 |
| **C-5** | Dois critérios de aceite bloqueantes | **AC-EXPLICA** (explicabilidade obrigatória, sem fallback) e **AC-PIPELINE** (separação física verificável), mais **AC-BLOCO** | **§17.4 (nova)**, §17.6 |

### 0.3c Consolidação — pacote A-01 (v1.3)

| # | Item do pacote | Resultado |
|---|---|---|
| 1 | Incorporar as ressalvas do Guardião às ADR-A/B/D | **NÃO EXECUTADO — impedimento declarado.** A lista não existe como arquivo (PA-05/PA-06 do `REGISTRO_DOS_PARECERES.md`; DP-11) e a missão não a enumera. Escrevê-la por inferência no log canônico seria fabricar registro de aprovação constitucional |
| 2 | Atualizar a Arquitetura (§8.2, §9.4) | **Executado.** §8.2 corrigido para "não ampliar"; §9.4 emendado de quatro para cinco estados |
| 3 | Reescrever o Modelo (§7.1–§7.4, §11) | **Executado integralmente**, mais §2, §4, §6, §8.1, §8.2 e §8.3 — todos carregavam a mesma dívida. Modelo passa a **v3.0** |
| 4 | Atualizar o Congelamento | **Executado.** §5.1 (reabertura de I-10), §5.2 (P-07/P-08/P-10), §5.3 (RLS mantida) |
| 5 | Lavrar as três ADRs | **Executado.** ADR-066, ADR-067, ADR-068, com índice de supersessões atualizado |
| 6 | Vocabulário canônico único dos verbos | **Executado.** `MODELO_CURADORIA_V1.md` §10.1 — onze verbos oficiais, seis recusados, fonte única |
| 7 | Resolver lacunas documentais do Arquiteto | **Executado no que era verificável** — ver item 1 para o que não era |

**Nenhuma decisão de domínio foi criada neste pacote.** Toda alteração acima
executa decisão já aprovada, ou corrige texto que contradizia decisão já
tomada.

### 0.4 Estado do processo — registro obrigatório

| Fato | Situação |
|---|---|
| Autoria deste arquivo | **Produto explícito do Agente 02**, criado na sessão anterior e revisado nesta |
| Ato documental | **Aceito** — produzir e revisar documento é o escopo do Agente 02 |
| Código autorizado | **Nenhum.** Zero linhas de código, migration, banco, API, componente ou teste |
| Árvore de trabalho | **Suja** — 11 arquivos não rastreados, incluindo 1 migration e 1 teste de segurança |
| Sessões paralelas | **Sim** — `INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md` e `PLANO_DE_PACOTES_CURADORIA_2_0.md` apareceram na árvore durante estas sessões, produzidos por outros agentes; 8 worktrees ativos disputam a mesma stack Supabase local |
| Arquivos não rastreados | A própria auditoria, este documento, o inventário, o plano de pacotes e 7 outros — **o insumo canônico da 2.0 não está versionado** |
| Implementação | **Bloqueada.** O Plano de Pacotes registra impedimento aberto; nenhum pacote autorizado |
| Versionamento | Os documentos precisam ser **commitados de forma controlada** antes de qualquer decisão constitucional definitiva — decidir sobre texto não versionado é decidir sobre algo que pode mudar sem registro |
| Pacote de segurança em curso | `20260803170000_menor_privilegio_nas_funcoes_de_governanca.sql` + teste de integração. **Não pode ser misturado com a Curadoria 2.0** (§14 do papel do Implementador): escopos distintos, branches distintas, commits distintos |
| Commit | **Não realizado.** Nenhum commit sem autorização expressa |

---

## Tese **[DOMÍNIO]**

> **A Curadoria 2.0 não automatiza a decisão. Ela remove as duas transcrições
> manuais que se interpuseram entre as declarações originais e o Motor, e
> converte o Curador de transcritor em garantidor da qualidade da informação e
> supervisor das exceções.**

O Método não muda. A Constituição não muda. As treze decisões humanas do §4 da
auditoria não mudam. O que muda é **quem alimenta o Motor**: hoje, o Curador
digita por ambas as partes; na 2.0, cada parte declara e o Curador confirma,
julga e decide.

A prova de que isso é possível já existe no próprio código: o **Motor Relacional**
(ADR-065) lê as declarações originais dos dois lados — `case_needs` de um lado,
`practice_evidence` do outro — e produz leitura explicável sem transcrição
intermediária. A 2.0 é a generalização desse precedente aos 28 conceitos.

---

# 1. Princípios da Curadoria 2.0 **[DOMÍNIO]**

Doze princípios em **duas naturezas distintas de autoridade** — e a v1.0 errou
ao apresentá-los no mesmo plano (bloqueador **B7**).

## 1.1 Reafirmações vinculantes — já constitucionais

| # | Princípio | Origem |
|---|---|---|
| **P-01** | **O conhecimento pertence ao Método, nunca ao Curador.** Nenhuma conclusão pode depender de algo que só existe na memória de uma pessoa. | Constituição · ADR-035 |
| **P-02** | **O Motor organiza; não escolhe, não ordena, não elimina, não pontua.** | I-1 · ADR-041 |
| **P-03** | **A decisão dos três caminhos é humana e nomeada.** Automatizá-la é fora de escopo permanente, não item de backlog. | ADR-035 · Fundamentos P14 |
| **P-04** | **Ausência de informação nunca vira ausência da característica.** `null` ≠ `false`; lacuna ≠ "não atende". | I-8 · §7.3 do Modelo |
| **P-05** | **Verificar é ato humano assinado sobre uma versão específica.** Resposta não é evidência verificada. | I-6 |
| **P-06** | **Histórico é imutável.** Corrigir é gravar versão nova. | I-7 · ADR-048 |

## 1.2 Princípios próprios da 2.0 — **nenhum é constitucional hoje**

**Reclassificação exigida pelo parecer (B7).** Cada um declara a autoridade que
precisa para se tornar vinculante. Enquanto a ADR correspondente não existir,
são **propostas de princípio** — vinculam este documento, não o Método.

| # | Princípio | Natureza | Autoridade necessária | Estado |
|---|---|---|---|---|
| **P-07** | **Uma origem por fato.** Toda entrada do Motor tem exatamente uma fonte declarada, e essa fonte é sempre quem tem autoridade sobre o fato: a pessoa sobre o que ela quer, o profissional sobre o que ele pratica, o Curador sobre o que este caso exige. | **princípio novo de domínio** | **ADR** (ADR-A) | proposto |
| **P-08** | **Proposta nunca é declaração.** Nada entra no Motor sem confirmação humana registrada com autor, data e o que estava visível no momento. O sistema pré-preenche; ele não decide. | **princípio novo de domínio** | **ADR** (ADR-A) | proposto |
| **P-09** | **Toda proposta diz de onde veio.** Proposta sem proveniência não é gerada. | **contrato de proveniência** — extensão operacional do P-05/I-6 e do `ProvenanceRef` já vigente; **não é princípio independente** | nenhuma nova: deriva de norma existente | vigente por herança |
| **P-10** | **Confirmar não pode ser mais barato que discordar.** | **princípio de domínio** — porque define o que conta como decisão humana válida | **ADR** (ADR-A) | proposto |
| **P-11** | **A paciente lê o que o Motor concluiu — não uma segunda versão digitada.** | **princípio de domínio** — redefine a promessa de transparência | **ADR** (ADR-B) | proposto |
| **P-12** | **Um relógio só.** Um modelo de progresso com autoridade; os demais são projeções derivadas por contrato. | **princípio arquitetural** — não toca o domínio da Curadoria; nenhuma leitura, escala, célula ou decisão muda | aprovação do Guardião; **sem ADR** | proposto |

**A tese permanece intacta:** *uma origem por fato* e *proposta nunca é
declaração* continuam sendo o coração da 2.0. O que a v1.1 corrige é a
**pretensão de autoridade**: eles não são reafirmações do que já existe — são
domínio novo, e domínio novo entra por ADR (§13 do Modelo).

## 1.3 O teste de aceitação de qualquer decisão futura

Antes de aceitar qualquer mudança na Curadoria 2.0, quatro perguntas:

1. **Quem tem autoridade sobre este fato?** — se a resposta não for uma pessoa
   nomeada, o fato não existe.
2. **De onde veio?** — se a resposta não for rastreável, a frase não é gerada.
3. **A pessoa consegue reconstruir isto sozinha, meses depois?** — se não, é
   opacidade, não simplicidade.
4. **Isto reduz intervenção humana às custas de qual das cinco garantias**
   (segurança, qualidade, ética, transparência, rastreabilidade)? — se custa
   alguma, não entra.

---

# 2. Arquitetura Operacional **[ARQUITETURA]**

## 2.1 O deslocamento do eixo

**Correção de vocabulário (RS-10).** A v1.0 dizia "eixo no Motor". Está errado, e
o erro não era só de palavra: sugeria que o Motor ganhava autoridade. O eixo da
Curadoria 2.0 é **em quem declara** — o Motor apenas deixa de ser alimentado por
transcrição e passa a ler as declarações de quem tem autoridade sobre elas.

```
CURADORIA 1.0 — eixo no transcritor

  ela declara (case_needs) ──✗ (não chega)
                                   ┌──────────────┐
  Curador transcreve ─────────────▶│    MOTOR     │──▶ leitura ──▶ Curador ──▶ Relatório
                                   └──────────────┘                   │
  ele declara (practice_evidence)──✗ (não chega)                       └─▶ redigita para a paciente
  admin transcreve ───────────────▲


CURADORIA 2.0 — eixo em quem declara

  ELA declara ─────▶ [PIPELINE DE DERIVAÇÃO] ─▶ proposta ─╮
  ELE declara ─────▶ [PIPELINE DE DERIVAÇÃO] ─▶ proposta ─┤
                                                           │
                              ╔════════════════════════════▼════════════════════════════╗
                              ║             FRONTEIRA HUMANA (obrigatória)              ║
                              ║  declaração original · proposta · origem · versão da    ║
                              ║  regra · confirmar ⟷ discordar · autoria · data ·       ║
                              ║  desfecho registrado · SEM ATO HUMANO NÃO AVANÇA        ║
                              ╚════════════════════════════╤════════════════════════════╝
                                                           │ (Mapas confirmados)
  Curador DECLARA (juízo técnico, sem proposta) ───────────┤
  Curador DECLARA filtros (item a item) ───────────────────┤
  Curador JULGA o que o catálogo marca `humano` ───────────┤
                                                           ▼
                                            [PIPELINE DE LEITURA]
                                              validar · eliminar · ler ·
                                              explicar · apresentar
                                                           │
                                    ┌──────────────────────┼──────────────────────┐
                                   Mesa                Relatório               Paciente
                                                           │
  Curador DECIDE os três caminhos e assume autoria ────────▶ Entrega
```

**O que muda de fato:** as declarações originais passam a chegar, a redigitação
para a paciente deixa de existir, e **a fronteira humana deixa de ser regra
escrita para ser estrutura**.

## 2.2 As quatro camadas de responsabilidade

A operação inteira se organiza em quatro camadas. **Cada ato do sistema pertence
a exatamente uma.** Um ato que não couber em nenhuma é candidato a eliminação.

| Camada | Nome | Natureza | Quem age | Pode ser automatizada? |
|---|---|---|---|---|
| **C1** | **Declaração** | fatos ditos por quem tem autoridade sobre eles | Paciente · Profissional · Curador (juízo técnico) | **Nunca** — automatizar é falsificar |
| **C2** | **Derivação** | propostas geradas a partir de C1, com proveniência | Motor | **Sempre** — é a camada nova da 2.0 |
| **C3** | **Confirmação e Juízo** | confirmar propostas, verificar evidência, julgar o que exige leitura | Curador · Operação | **Nunca o ato; sempre o preparo** |
| **C4** | **Composição e Entrega** | escolher três caminhos, assumir autoria, emitir, entregar | **Curador · Sistema** | **Nunca** a composição; a entrega é ato transacional do Sistema **após** os atos humanos |

### Nota sobre o Concierge (correção C-3)

A versão anterior listava o Concierge em C4. **Está errado.** O Concierge é o
Nível 3 da Correção de Domínio: **atua depois da entrega**, no fluxo de
continuidade do cuidado. Ele não pertence a nenhuma das quatro camadas de
formação da recomendação.

| Ato | Quem |
|---|---|
| **Composição da Curadoria** | **Curador e Sistema**, conforme a autoridade prevista |
| **Emissão e entrega** | **Sistema**, após atos humanos válidos (aprovação e emissão pelo Curador) |
| **Continuidade depois da entrega** | **Concierge** |

**O Concierge, explicitamente:** não compõe seleção · não aprova relatório · não
altera resultado · **não participa da formação da recomendação**. Sua autoridade
começa quando a decisão da paciente está registrada (§7.2) — nunca antes.

**Regra de fronteira (verificável por teste):** um dado produzido em C2 **nunca**
alcança o Motor sem passar por C3. Um dado que nasce em C1 e é confirmado em C3
**nunca** é reescrito por C2 — regenerar proposta sobre declaração confirmada é
o defeito P12 generalizado, e a 2.0 o proíbe estruturalmente.

## 2.3 Dois pipelines, nunca um

**Correção do bloqueador B1.** A v1.0 descrevia um pipeline único E1–E7 com a
derivação *dentro* dele. Isso é indefensável: em um pipeline único, a
fronteira entre "o sistema propôs" e "o humano decidiu" é uma regra escrita — e
regra escrita dentro de um fluxo contínuo é exatamente o que se esquece de
verificar sob pressão. A 2.0 revisada tem **dois pipelines fisicamente
separados**, que **não se chamam**.

> **Legenda:** `DR*` são estágios do Pipeline de **DR**ivação e `LE*` do Pipeline
> de **LE**itura. Não confundir com `D1..D7`, que são as **descobertas da
> auditoria**.

### Pipeline de Derivação — `DR1..DR5`

| # | Estágio | Entrada | Saída | Falha declarada |
|---|---|---|---|---|
| **DR1** | **Recepção** | declarações originais de C1 (`case_needs`, `practice_evidence`) + catálogo vigente | conjunto normalizado, com versão | catálogos divergentes → recusa |
| **DR2** | **Validação de entrada** | conjunto normalizado | conjunto elegível a derivação + **o que não é derivável, e por quê** | declaração sem proveniência → não deriva |
| **DR3** | **Aplicação de regra versionada** | conjunto elegível + regra vigente (§10.5) | **proposta**, e nada além de proposta | conceito sem regra → **sem proposta** (nunca chute); regra suspensa → sem proposta |
| **DR4** | **Persistência da proposta** | proposta | linha append-only em `derivation_proposals` com origem, regra, versão | falta qualquer campo de proveniência → não persiste |
| **DR5** | **Encerramento** | — | **fim** | — |

**O que o Pipeline de Derivação nunca faz** (verificável por teste): não produz
leitura, não elimina ninguém, não gera explicação de compatibilidade, não
apresenta nada em superfície de decisão, não escreve nos Mapas, e **não chama o
Pipeline de Leitura**. Ele termina em DR5, sempre.

### Fronteira Humana — a estrutura entre os dois

Ver §2.4. **Nenhum caminho de código liga DR5 a LE1 sem atravessá-la.**

### Pipeline de Leitura — `LE1..LE5`

**Entradas admitidas — lista fechada:**

1. declarações originais válidas (com proveniência e versão de catálogo);
2. **Mapas confirmados** (`case_priority_map`, `professional_subcriterion_map`),
   com o ato humano registrado;
3. **filtros humanos válidos** — declarados item a item (§5.5);
4. **juízos humanos válidos** — área, técnicos, relacionais.

| # | Estágio | Entrada | Saída | Falha declarada |
|---|---|---|---|---|
| **LE1** | **Validação** | as quatro entradas admitidas | conjunto válido + **inventário de lacunas** | nunca falha em silêncio: lacuna é saída, não erro |
| **LE2** | **Eliminação** | filtros declarados + gate de área declarado | participa / não participa / **pendente de verificação**, sempre com motivo | informação ausente → **pendente**, jamais "não atende" (P-04) |
| **LE3** | **Leitura** | Mapas confirmados | resultados por conceito (Compatibilidade e Relacional, **separadas**) | conceito fora do Motor → **não entra** (guarda executável, §16 R-04) |
| **LE4** | **Explicação** | LE2 + LE3 + proveniência de tudo que os produziu | **Ficha de Explicação** por profissional (§11) | frase sem origem rastreável → não é gerada |
| **LE5** | **Apresentação** | Fichas + composição declarada pelo Curador | Mesa, rascunho do Relatório, seções da paciente | juízo pendente → recusa emitir (guardas da ADR-064, mantidas) |

### A declaração que fecha a fronteira

> **Proposta não é entrada válida para o Pipeline de Leitura.**

Formalmente: **LE1 recusa qualquer valor cuja origem seja uma linha de
`derivation_proposals` em estado `PROPOSTA`.** Só entra o que já é declaração
confirmada nos Mapas. Esta é a regra mais importante da arquitetura revisada, e
o critério de aceite **A2** existe exclusivamente para prová-la.

**Invariante de pureza:** DR1–DR3 e LE1–LE4 são puros e determinísticos. **Persistir
resultado de leitura é proibido** — a leitura é recalculada sempre, e é isso que
garante que ela nunca envelhece em silêncio. A **proposta**, ao contrário, é
persistida — porque ela não é conclusão, é o registro de um oferecimento que
precisa sobreviver para ser auditado.

## 2.4 A Fronteira Humana **[ARQUITETURA]**

Não é uma tela. É uma **estrutura obrigatória** entre os dois pipelines, com
nove elementos, todos exigidos simultaneamente:

| # | Elemento | Por quê |
|---|---|---|
| 1 | **Visualização da declaração original** | sem o original, confirmar é confiar cegamente na regra |
| 2 | **Visualização da proposta** | o que exatamente está sendo oferecido |
| 3 | **Origem da proposta** | qual registro, de que data, de quem |
| 4 | **Versão da regra aplicada** | sem versão, não se sabe o que gerou aquilo (§10.5) |
| 5 | **Possibilidade equivalente de confirmar ou discordar** | P-10 tornado estrutura: mesmo número de interações, mesma proeminência |
| 6 | **Autoria** | quem praticou o ato |
| 7 | **Data** | quando |
| 8 | **Registro do desfecho** | `CONFIRMADA` · `RECUSADA` (com valor final) · `PENDENTE` — os três são registro, e "pendente" nunca vira confirmação |
| 9 | **Bloqueio de avanço sem ato humano válido** | ausência de ato **nunca** significa confirmação |

**Ato humano válido** é definido negativamente, para não deixar brecha: **não é**
ato válido o silêncio, o vencimento de prazo, a navegação para outra tela, o
fechamento de sessão, nem qualquer confirmação implícita por decurso.

> **Assinatura humana sem leitura demonstrável não transforma automação em
> decisão humana.**

Esta frase é a razão de existir do §5.4. Ela é o padrão contra o qual toda
superfície de confirmação será avaliada — e é também o motivo de o painel de
discordância nascer junto com a primeira regra, não depois.

## 2.5 O que desaparece da arquitetura

| Desaparece | Por quê | Achado |
|---|---|---|
| Transcrição do Mapa de Prioridades (~17 dos 28) | vira proposta derivada + confirmação | D1, R1 |
| Digitação do Mapa do Profissional (28/profissional) | vira proposta derivada da Base + confirmação | D2, R3, G4 |
| `criterion_declarations` nos três critérios do lado da pessoa | o Motor já responde, com mais granularidade | D3, R2 |
| Redigitação das dimensões da paciente | passa a derivar do Motor | D4, P6 |
| Segundo motor (ACE) e segundo formato de entrega | autoridade única (ADR-035/036/037) | D5, P3, P9, RI5 |
| Cinco dos seis modelos de progresso como estados independentes | viram projeções derivadas | D6, R6, P4 |
| Dois dos três instrumentos de captação da pessoa | um instrumento, uma resposta | D7, R4, R5 |
| Checkboxes burocráticos do Acolhimento | o sistema sabe o que foi aberto | P13 |
| Dependência declarada de COMPATIBILIDADE em AVALIAÇÃO | não existe no domínio | P11 |

## 2.6 O que a 2.0 não toca

As **treze decisões humanas** do §4 da auditoria e as **oito garantias** do §4 do
Congelamento. Em especial: reconhecimento do Perfil, seleção dos três, autoria do
Relatório, decisão da paciente. As 15 células, os 4 resultados, os 5 níveis de
importância, os 3 estados do profissional e os 28 conceitos permanecem
**intocados** — a 2.0 muda **quem preenche**, nunca **o que existe**.

---

# 3. Nova missão do Curador **[DOMÍNIO]**

## 3.1 A formulação

> **O Curador é o garantidor da qualidade da informação sobre a qual a Curadoria
> decide, e o supervisor das exceções que o Método reserva ao juízo humano.**

Ele deixa de ser o canal por onde os dados passam e passa a ser o responsável por
eles serem verdadeiros. Isso é **mais** responsabilidade, não menos: hoje
verificar evidência, resolver divergência e julgar o que o catálogo marca
`humano` competem por atenção com digitação.

## 3.2 O que deixa de fazer — e por quê

| Deixa de fazer | Justificativa | Para onde vai |
|---|---|---|
| Transcrever ~17 importâncias já respondidas pela pessoa | ela é a autoridade sobre o que quer (P-07); a tradução mental de hoje é o oposto de auditável | proposta derivada (DR3) + confirmação dele |
| Declarar 3×N critérios do lado da pessoa | o Motor já lê os mesmos grupos com 28 conceitos contra 3 critérios; `dossie.ts` já defende essa divisão | leitura do Motor (LE3) |
| Digitar evidência em texto livre para justificar critério | a Base já tem fonte, autor, data e verificação | referência à evidência (R10) |
| Marcar checkboxes de "contexto revisado" | fato observável pelo sistema | derivado |
| Redigitar as dimensões que a paciente lê | um caminho só do dado à frase (P-11) | derivado do Motor |
| Mover o funil do CRM depois de cada ato | os cinco estágios são deriváveis de fatos gravados | projeção (P-12) |

## 3.3 O que continua fazendo — e por quê é dele

| Continua | Justificativa |
|---|---|
| **Ouvir a história e devolvê-la até ela reconhecer** | coração do Método; nada aqui é dado |
| **Estruturar o contexto clínico** (sem diagnosticar) | exige leitura clínica que nenhuma regra faz |
| **Separar inegociável de desejo** | distinguir filtro de peso é juízo; a *proposta* pode vir de grau `ESSENCIAL`, a régua não |
| **Declarar compatibilidade de área, par a par** | ADR-035: comparar texto livre com texto livre é inferência semântica, e o erro é invisível |
| **Julgar FORMACAO / EXPERIENCIA / HISTORICO contra este caso** | "uma residência em ortopedia é excelente para um caso e irrelevante para outro" |
| **Julgar os conceitos marcados `humano`** (DECISAO_COMPARTILHADA, PREFERENCIAS_E_RESTRICOES, CONDUCAO_DE_NOTICIAS_DIFICEIS) | a mesma conduta muda de sentido conforme a pessoa |
| **Confirmar cada proposta derivada** | P-08: proposta nunca é declaração |
| **Selecionar os três caminhos** | ADR-035; é *a* decisão do Método |
| **Assumir autoria do Relatório** (aprovar, emitir) | o documento é assinado por uma pessoa |
| **Apresentar na devolutiva** | encontro humano, fora do sistema |

## 3.4 O que passa para o Motor

Derivação de proposta (DR3), **aplicação** de filtro já declarado e confirmado
(LE2 — nunca a decisão do filtro, §5.5), leitura (LE3),
explicação (LE4), inventário de lacunas (LE1), prontidão para emissão, projeção de
progresso, e a montagem de tudo que hoje é "reunir informação para poder julgar".

## 3.5 O que permanece exclusivamente humano — permanentemente

As treze decisões da auditoria §4, sem exceção e sem porta de evolução. **A
Curadoria 2.0 não abre nenhuma delas**, e qualquer proposta futura de abrir uma
é matéria constitucional, não de arquitetura.

## 3.6 A prova numérica do redesenho

Em um Case com **seis elegíveis**:

> **Ressalva da v1.1 (B4).** A estimativa abaixo foi feita pressupondo
> confirmação em bloco como padrão. O §5.4 reclassificou o bloco como mecanismo
> **excepcional** — logo **estes números não valem mais como previsão**. Ficam
> como registro do raciocínio original e como demonstração da *natureza* dos
> atos restantes, que é o que não mudou. A carga real só pode ser dimensionada
> depois da graduação por consequência (§5.4 condição 3), que é decisão de
> Método pendente (§18).

| | 1.0 | 2.0 (estimativa **invalidada** pelo §5.4) | Natureza dos atos restantes |
|---|---|---|---|
| Mapa de Prioridades | 28 classificações | ~17 confirmações (item a item nos de maior consequência) + 11 declarações técnicas | confirmação · declaração |
| Declaração de área | 6 | **6** | juízo (inalterado — é decisão) |
| Avaliação de critérios | 36 (6×6) com texto livre | **18** (3 técnicos × 6) | juízo |
| Juízo relacional | — (hoje inexistente) | **≤ 3 conceitos × 6**, só onde há declaração dos dois lados | juízo (novo, legítimo) |
| Seleção | 1 | **1** | decisão |
| Relatório | 1 | **1** | autoria |
| **Total** | **~68**, dos quais 3 são decisões do Método | **~53**, **todos** juízo, confirmação, decisão ou autoria | — |

O alvo declarado da auditoria ("menos de 20 atos") **não é atingido, e a v1.1 vai
além: deixa de persegui-lo.** Contagem de atos é a métrica errada — foi ela que
tornou a confirmação em bloco atraente. **A métrica correta é a natureza dos
atos:** a 2.0 estará certa quando **nenhum ato restante for transcrição**, ainda
que o total caia pouco. Um Curador que pratica 53 atos de juízo e confirmação
informada está fazendo o trabalho do Método; um que pratica 20 atos dos quais
metade é carimbo, não.

O que a 2.0 entrega é a eliminação de **100% dos atos de transcrição**. O total
resultante é consequência, não meta.

---

# 4. Nova missão do Motor **[DOMÍNIO]**

## 4.1 O que o Motor é

**Um leitor explicável de declarações.** Não é um recomendador, não é um
classificador, não é um otimizador. A frase que o define permanece a da
auditoria: *"ele explica melhor do que calcula — e é exatamente o que deveria
fazer"*.

## 4.2 Como recebe dados (DR1)

Três fluxos de entrada, cada um com **uma** origem (P-07):

| Fluxo | Origem | Autoridade | Chega ao Motor como |
|---|---|---|---|
| **Lado da pessoa** | Protocolo da Pessoa (P1–P17) → `case_needs` | a paciente | importância **derivada** (DR3) + **confirmada** (C3) |
| **Lado do profissional** | Base de Evidências (Q1–Q28) → `practice_evidence` | o profissional, verificado pela operação | estado **derivado** (DR3) + **confirmado** (C3) |
| **Lado do caso** | juízo técnico do Curador | o Curador | importância **declarada** (sem proposta — não há lado da pessoa) |

O Motor **nunca** lê texto livre. **Nunca** lê o que não tem versão de catálogo.
**Nunca** lê conceito marcado fora do Motor.

## 4.3 Como valida (LE1)

Quatro validações, todas com saída em vez de exceção:

1. **Coerência de catálogo** — os dois lados na mesma versão, ou recusa.
2. **Participação** — o conceito participa do Motor? (`MOTOR_PARTICIPATION`:
   DIRETO / INDIRETO / NUNCA). **Esta é a guarda que hoje não existe** e cuja
   ausência é o achado P15. Na 2.0 ela é executável, não documental.
3. **Proveniência** — toda entrada tem origem, autor e data, ou não entra.
4. **Inventário de lacunas** — o que ninguém declarou é listado *como lacuna*,
   separado do que foi declarado como ausente. As duas coisas produzem frases
   diferentes e **sempre produziram**; a 2.0 só torna a distinção visível também
   na Mesa e no painel da paciente.

## 4.4 Como calcula

**Ele não calcula.** Não há soma, média, percentual, score ou total. Há
**correspondência célula a célula** em matrizes fechadas:

- **Compatibilidade** (congelada, ADR-041): importância (5) × estado (3) = 15
  células → 4 resultados.
- **Relacional** (ADR-065): grau (4) × estado (3) = 12 células → 4 resultados +
  `AGUARDA_JUIZO_DO_CURADOR`.

As duas leituras **permanecem separadas e nunca se somam** — somá-las faria uma
comprar deficiência da outra.

## 4.5 Como elimina (LE2)

Elimina **apenas** por filtro objetivo declarado e por gate de área declarado
pelo Curador. Nunca elimina por resultado de leitura. Nunca elimina por lacuna:
informação ausente produz **pendente de verificação**, e a ação corretiva é
verificar o cadastro, não descartar a pessoa.

## 4.6 Como pontua — e como **não** ordena

**Não pontua.** Nem interna, nem "só para ordenar", nem "só para o Curador".
Essa é a garantia §4.8 do Congelamento.

**Correção do bloqueador B2.** A v1.0 propunha resolver a pendência da ordenação
(G8/P14) ordenando por **prontidão da informação**. O parecer está certo em
recusar: **isso é ranking por construção**. Quem tem cadastro mais completo
aparece primeiro; quem aparece primeiro é lido primeiro e escolhido mais; e a
paciente herdaria, na ordem das cartas, uma classificação operacional que
ninguém decidiu — sobre um eixo (completude de cadastro) que não é mérito de
ninguém e que a própria auditoria mostra depender de trabalho interno atrasado,
não do profissional.

**A arquitetura da 2.0, portanto, não pode:**

| Proibição | Por quê |
|---|---|
| ordenar candidatos por completude | completude é dívida da operação, não atributo da pessoa |
| ordenar por grau de confiança | confiança é sobre a informação; ordenar por ela transfere o juízo para a pessoa |
| ordenar por quantidade de evidências | volume não é mérito (P18 do catálogo) |
| fazer a paciente herdar ordem operacional | a ordem dela é de apresentação, e é escolha do Curador |
| criar qualquer classificação indireta | agrupamento, cor, ícone, "destaque" e seção separada são ordenação com outro nome |

**O que fica:** a **ordem neutra da Rede**, exatamente como hoje. Não é elegante,
e é honesto — é a única ordem que não afirma nada. A pendência §11 do Modelo
**permanece aberta**, e permanecer aberta é a resposta correta enquanto não
existir operação real que demonstre dano concreto (§6 do Congelamento, critério 1).

**A confiança qualitativa (§11.3) sobrevive, com escopo estritamente reduzido:**
descreve a **suficiência da leitura** de um profissional consigo mesmo; nunca
compara; nunca define posição; nunca produz ordem; nunca é apresentada como
mérito do profissional. Se em alguma superfície ela puder ser usada para
reordenar uma lista, o desenho está errado.

## 4.7 Como explica e justifica (LE4)

Ver §11 — é a peça central da 2.0 e tem seção própria.

## 4.8 Como gera relatórios

Mantém-se `relatorio-inteligente.ts` como está em natureza: puro, determinístico,
versionado, cada frase com `ProvenanceRef`, recusando escrever o que não pode
sustentar. O que muda: **as dimensões da paciente passam a derivar do Motor**
(P-11), a **abertura** ganha rascunho preservando o texto humano (P12), e a
**assinatura do Curador** deixa de ser `null`.

## 4.9 Como produz gráficos

**Não produz gráficos comparativos entre profissionais** — comparação visual é
ordenação disfarçada. O único elemento gráfico admitido é o **inventário de
cobertura de um profissional consigo mesmo**: quantos conceitos têm leitura,
quantos têm lacuna, quantos aguardam juízo. Sem eixo comum entre pessoas, sem
barra lado a lado, sem cor de "melhor".

## 4.10 Como apresenta comparações

Célula a célula, por conceito, com as duas declarações à vista — o modelo que a
aba Relacional já desenhou (Parte 7.1 do domínio relacional). Para a paciente:
cartas sequenciais, uma aberta por vez, comparação **opcional e por escolha
dela**, sem ranking, sem posição, sem vocabulário de pódio.

---

# 5. Novo fluxo operacional **[OPERAÇÃO]**

## 5.1 Questionamento etapa a etapa

Nenhuma etapa foi preservada por já existir. Legenda: **MANTÉM** · **FUNDE** ·
**AUTOMATIZA** · **ELIMINA**.

| # | Etapa (1.0) | Ainda deve existir? | Objetivo | Executor (2.0) | Veredito |
|---|---|---|---|---|---|
| 1 | Captação e qualificação (CRM) | **Sim** | transformar contato em Assistido | Atendente (conversa) + Sistema (estágio) | **AUTOMATIZA** os 5 estágios deriváveis; a conversa é humana |
| 2 | Criação da conta | **Sim** | ADR-018: nunca autocadastro | Administrador | **MANTÉM** |
| 3 | `sua-historia` (wizard 6 passos) | **Sim** | a história nas palavras dela | Paciente | **FUNDE** com o Protocolo (§5.3) |
| 4 | Briefing PA1–PA5 | **Não** | duplica wizard e Protocolo | — | **ELIMINA** (R4) |
| 5 | Abertura do Case | **Sim, como fato** | existir o objeto de trabalho | Sistema | **AUTOMATIZA**: história enviada + papel = Case `NEW` (G5/O6) |
| 6 | Acolhimento / História / Caso | **Sim** | ouvir inteiro e devolver organizado | **Curador** | **MANTÉM** integralmente; **ELIMINA** os dois checkboxes (P13) |
| 7 | Filtros eliminatórios | **Sim** | registrar o inegociável | **Curador declara, item a item**; o sistema apenas **sinaliza para discussão** | **MANTÉM integralmente humana** — a v1.0 propunha derivar o filtro de `ESSENCIAL`; corrigido (RS-07, §5.5) |
| 8 | Mapa de Prioridades — 17 com lado da pessoa | **Sim, como confirmação** | declarar quanto cada conceito importa | Motor propõe · **Curador confirma** | **AUTOMATIZA a proposta** (D1/R1/O3) — **exige ADR** |
| 9 | Mapa de Prioridades — 11 técnicos | **Sim** | o que este caso exige | **Curador declara** | **MANTÉM** — não há lado da pessoa |
| 10 | Reconhecimento do Perfil | **Sim** | ela reconhecer o Perfil como dela | **Paciente, e só ela** | **MANTÉM** — e passa a mostrar **o que ela declarou** (P8) |
| 11 | Mapa do Profissional (28/profissional) | **Sim, como confirmação** | estado do profissional por conceito | Motor propõe da Base · **operação confirma** | **AUTOMATIZA a proposta** (D2/R3/O1) |
| 12 | Verificação de evidência | **Sim** | ato humano assinado sobre versão | Operação / Curador | **MANTÉM** — I-6, e ganha prioridade de atenção |
| 13 | Resolução de divergência | **Sim** | duas fontes discordam | Curador | **MANTÉM** |
| 14 | Gate de área, par a par | **Sim** | quem participa desta Curadoria | **Curador** | **MANTÉM**; sugestão por tags é **opcional e nunca veredito** (O9/ADR-035) |
| 15 | Avaliação — ACESSO / CONTINUIDADE / MODELO | **Não** | o Motor já responde, melhor | Motor | **ELIMINA** (D3/R2/O2) — **exige ADR** |
| 16 | Avaliação — FORMACAO / EXPERIENCIA / HISTORICO | **Sim** | juízo técnico contra este caso | **Curador** | **MANTÉM** |
| 17 | Juízo relacional (3 conceitos `humano`) | **Sim** | o sentido da conduta depende da pessoa | **Curador** | **MANTÉM** (ADR-065) |
| 18 | Etapa COMPATIBILIDADE da Mesa | **Sim, como leitura** | organizar o encontro conceito a conceito | Motor | **MANTÉM**; **ELIMINA** a dependência falsa de AVALIAÇÃO (P11) |
| 19 | Seleção dos três caminhos | **Sim** | a decisão do Método | **Curador** | **MANTÉM**; a ordem de leitura permanece **neutra, a da Rede** (G8 fica aberto — §4.6) |
| 20 | Relatório — rascunho | **Sim** | propor o texto com proveniência | Motor | **MANTÉM**; **corrige** a sobrescrita da abertura (P12) |
| 21 | Relatório — revisão, aprovação, emissão | **Sim** | autoria humana | **Curador** | **MANTÉM**; ganha **painel de prontidão** antes de tentar emitir (G6/O8) |
| 22 | Entrega | **Sim** | ato transacional único | Sistema (`deliver_curadoria`) | **MANTÉM** |
| 23 | Entrega legada do ACE | **Não** | dois documentos concorrentes | — | **ELIMINA** (D5/P9/RI5) |
| 24 | Devolutiva | **Sim** | apresentar pessoalmente | Curador | **MANTÉM** |
| 25 | Decisão da paciente | **Sim** | a decisão é dela | **Paciente** | **MANTÉM**; **FUNDE** os dois registros em um (R9) |
| 26 | Acompanhamento | **Sim** | continuidade do vínculo | Concierge | **MANTÉM** |
| 27 | Etapa DOSSIÊ da jornada | **Não** | não tem destino | — | **ELIMINA** (P10) |
| 28 | Modelos de progresso paralelos (6) | **Não, como estados** | descrever onde o Case está | Sistema | **FUNDE** em um modelo com 5 projeções (P-12/R6) |

**Contagem:** 28 etapas examinadas · **17 mantidas** · **4 fundidas** ·
**5 automatizadas em preparo** (a decisão permanece humana em todas) ·
**5 eliminadas** (4, 15, 23, 27, 28-como-estados).

## 5.2 O fluxo redesenhado, ponta a ponta

```
CONTATO ─(Atendente, conversa humana)─▶ contratação
   │
   └▶ Administrador cria a conta (ADR-018)
         │
         └▶ PROTOCOLO ÚNICO DA PESSOA  ◀── ela responde uma vez só
               │  (história livre + P1–P17 fechadas, mesmo instrumento)
               │
               ├─▶ [SISTEMA] Case aberto automaticamente
               │
               └─▶ ACOLHIMENTO (Curador, humano, inalterado)
                     │   ouvir · devolver organizado · contexto clínico
                     │
                     ├─▶ [SINALIZAÇÃO] grau ESSENCIAL ─▶ "conversar se é filtro" ─▶ Curador DECLARA item a item
                     ├─▶ [DERIVAÇÃO DR3] propõe 17 importâncias ─▶ ‖FRONTEIRA HUMANA‖ ─▶ confirma/discorda
                     └─▶ Curador declara 11 importâncias técnicas
                           │
                           └─▶ PERFIL ──▶ RECONHECIMENTO DELA ★ gate único e real
                                 │        (ela lê o que ela declarou — P8 corrigido)
                                 │
    Base de Evidências ──▶ [DERIVAÇÃO DR3] propõe 28 estados ──▶ ‖FRONTEIRA HUMANA‖ ──▶ operação confirma
    (permanente, por profissional, fora do Case)                    │
                                                                     ▼
                                 └─▶ MESA ──▶ [LE2] elegibilidade ──▶ Curador declara área (par a par)
                                       │
                                       ├─▶ [LE3] leitura de Compatibilidade (28 conceitos)
                                       ├─▶ [LE3] leitura Relacional (6 conceitos)
                                       ├─▶ [LE4] FICHA DE EXPLICAÇÃO por profissional
                                       │
                                       ├─▶ Curador julga 3 critérios técnicos × N
                                       ├─▶ Curador julga 3 conceitos relacionais × N
                                       │
                                       └─▶ SELEÇÃO DOS TRÊS ★ decisão humana nomeada
                                             │
                                             └─▶ [LE5] rascunho ──▶ Curador revisa/assina
                                                   │  (painel de prontidão antes de emitir)
                                                   │
                                                   └─▶ ENTREGA (transacional, formato único)
                                                         │
                                                         └─▶ DEVOLUTIVA (Curador, humana)
                                                               │
                                                               └─▶ DECISÃO DELA ★ (inclui "nenhuma destas")
                                                                     │
                                                                     └─▶ Concierge · acompanhamento
```

★ = os três atos que a Constituição reserva a pessoas nomeadas, e que a 2.0 não
toca.

## 5.3 O Protocolo Único da Pessoa

**Problema resolvido:** D7/R4 — a mesma pessoa é perguntada três vezes.

**Desenho:** um instrumento, duas naturezas de resposta, uma sessão:

| Parte | Natureza | Destino | Alcança o Motor? |
|---|---|---|---|
| **A — Sua história** | texto livre, nas palavras dela | `patient_stories` (inalterado) | **Nunca** (P-04/gramática) — é leitura do Curador |
| **B — O que importa para você** | P1–P17, opções fechadas + grau | `case_needs` | **Sim**, como origem da proposta de importância |
| **C — O que você não aceita** | texto guiado (único do domínio) | `case_needs` conceito 5 | **Nunca** — juízo humano |

O briefing PA1–PA5 deixa de existir; suas perguntas ou já estão em B, ou não são
conceito do domínio. **Nada se perde**: a auditoria registra que as respostas do
briefing não alcançam a cadeia decisória hoje.

**Mesma regra para o profissional:** ME1–ME5 deixa de existir; Q1–Q28 é o
instrumento único, e é ele que alimenta a Base de Evidências (R5).

## 5.4 A confirmação em bloco — mecanismo excepcional **[ARQUITETURA]**

**Correção do bloqueador B4.** A v1.0 tratou a confirmação em bloco como o modo
normal de operar a Fronteira Humana, e chegou a contabilizá-la como ganho
("1 confirmação em bloco + N discordâncias"). Isso está errado: **o bloco é a
forma mais barata de produzir uma assinatura sem leitura**, e uma assinatura sem
leitura não converte automação em decisão humana.

**Classificação corrigida:** a confirmação em bloco é **mecanismo excepcional de
ergonomia**, jamais padrão constitucional. O padrão é o item a item. O bloco é
uma concessão à carga, disponível apenas sob as doze condições abaixo — todas
cumulativas.

### 5.4.0 Bloqueio formal do regime — correção C-4 **[GOVERNANÇA]**

> **O regime de confirmação em bloco permanece PROIBIDO enquanto DP-5 —
> graduação por consequência — não estiver decidido e incorporado por ADR
> válida.**

Este bloqueio é explícito, não dedutível. Sete afirmações vinculantes:

| # | Afirmação |
|---|---|
| 1 | **A ausência da régua impede a implementação.** Nenhum código de bloco pode ser escrito antes de DP-5 |
| 2 | **A ausência da régua impede a ativação.** Ainda que implementado por engano, o regime não pode ser ligado |
| 3 | **A ausência da régua impede os testes de aceite do regime.** Não existe aceite possível de um mecanismo cujo critério de elegibilidade não foi definido — um teste verde aqui seria falso |
| 4 | **Implementação parcial não pode ficar escondida atrás de feature flag.** Flag desligada é código presente, revisado como se fosse combinado, e ligável por engano. Enquanto DP-5 estiver aberto, **o mecanismo não existe no repositório** |
| 5 | **Filtros eliminatórios continuam sempre excluídos** — inclusive depois de DP-5 decidido. Nenhuma régua futura pode torná-los elegíveis (§5.5) |
| 6 | **A confirmação individual permanece o regime padrão**, antes e depois de DP-5. O bloco nunca vira padrão por decurso, por conveniência ou por volume |
| 7 | **A graduação deverá distinguir consequências e definir, nominalmente, quais itens nunca podem entrar em bloco** — uma régua que não produza essa lista não satisfaz DP-5 |

**Consequência de sequenciamento:** **DP-5 é pré-condição formal da Onda 2**
(§15). Sem ela, a Onda 2 pode entregar derivação com confirmação **item a item**
— e apenas isso.

| # | Condição obrigatória | Natureza |
|---|---|---|
| **1** | **Filtros eliminatórios nunca entram em bloco** | proibição absoluta |
| **2** | **Filtros são avaliados item a item, sempre** | proibição absoluta |
| **3** | **Propostas são graduadas por consequência** — quanto uma confirmação errada altera a leitura, a elegibilidade ou o que a paciente lerá | classificação obrigatória, declarada por conceito |
| **4** | **Propostas de maior consequência exigem leitura individual** — não são elegíveis a bloco em nenhuma circunstância | proibição por grau |
| **5** | **Amostragem obrigatória para abertura individual** — mesmo em bloco, um subconjunto é aberto item a item, e o bloco não fecha sem ele | anti-carimbo |
| **6** | **Interruptor para desativar o modo em bloco por Case** | controle operacional |
| **7** | **Interruptor para suspender uma regra de derivação** (§10.5) — suspensa, ela deixa de propor; o que já foi confirmado permanece, marcado | controle de governança |
| **8** | **Discordância zero sustentada dispara revisão** — não é indicador de sucesso, é alarme | anti-carimbo |
| **9** | **O painel de discordância nasce com a primeira regra derivada** — nunca depois | pré-condição de onda |
| **10** | **Confirmar e discordar exigem esforço operacional equivalente** | P-10 |
| **11** | **O Curador vê declaração, proposta, origem e regra antes de agir** — inclusive em bloco, e por item | Fronteira Humana (§2.4) |
| **12** | **Ausência de ação nunca significa confirmação** | proibição absoluta |

**As doze condições descrevem o regime que só poderá existir depois de DP-5**
(§5.4.0). Até lá, nenhuma delas é implementável, porque o regime que elas regulam
está proibido de existir.

> **Assinatura humana sem leitura demonstrável não transforma automação em
> decisão humana.**

**Consequência sobre a contagem de atos (§3.6):** a estimativa da v1.0 fica
**inválida** — ela pressupunha bloco como padrão. A v1.1 não substitui o número
por outro: dimensionar a carga real depende de saber quantas propostas caem em
cada grau de consequência, e isso é decisão de Método ainda não tomada (§18).
Registrar a incerteza é mais honesto que reestimar.

## 5.5 A fronteira dos filtros eliminatórios **[DOMÍNIO]**

**Correção das ressalvas RS-07 e RS-08.** A v1.0 propunha derivar filtro
obrigatório de grau `ESSENCIAL`. É indefensável: **filtro elimina**. Um filtro
proposto por regra e confirmado em massa esvazia a Rede sem que ninguém tenha
decidido esvaziá-la — e o efeito é invisível, porque quem foi eliminado não
aparece na tela para ser reconsiderado.

Oito regras fechadas:

| # | Regra |
|---|---|
| 1 | Filtro eliminatório **não é juízo relacional** — não vai para `curator_judgments` |
| 2 | Filtro eliminatório **não é estado genérico de compatibilidade** — não usa a escala do Motor |
| 3 | **Nunca entra em confirmação em bloco** |
| 4 | Mantém seus **quatro estados próprios** (Modelo §3.1): compatível · parcialmente compatível · incompatível · informação insuficiente |
| 5 | Exige **autoria humana prevista** — nomeada, registrada, por par (Case, profissional) |
| 6 | **Sempre preserva o motivo** — quem não participa nunca é "nota baixa", é motivo declarado |
| 7 | **Produz exclusão somente depois de confirmação válida** — nunca por derivação |
| 8 | **Não pode ser inferido automaticamente a partir de grau `ESSENCIAL`** |

**O que o sistema pode fazer:** sinalizar. A frase permitida é *"ela declarou
isto como essencial — vale conversar se é inegociável"*. A frase proibida é
*"proposta de filtro obrigatório: confirmar"*. A diferença entre as duas é a
diferença entre pauta e veredito, e o Método reserva o veredito ao Curador.

A regra do Modelo §3.2 permanece intacta: **filtro elimina; prioridade pondera.**
Um desejo tratado como filtro esvazia a Rede; um inegociável tratado como peso
entrega à pessoa um caminho que ela já disse que não serve. Essa distinção é
juízo, e juízo não se deriva.

---

# 6. Novo fluxo do paciente **[OPERAÇÃO]**

## 6.1 Os atos dela

Hoje ela tem **dois** atos no sistema. Na 2.0 ela tem **três** — e o terceiro é
uma correção de justiça, não uma tarefa nova:

| # | Ato | Natureza | Observação |
|---|---|---|---|
| 1 | **Declarar** — história + P1–P17 + restrições | uma sessão, um instrumento | hoje são três instrumentos (R4) |
| 2 | **Reconhecer o Perfil** | gate absoluto | hoje ela reconhece a *tradução* do Curador; na 2.0 reconhece **a própria declaração** ao lado da tradução proposta (P8) |
| 3 | **Decidir** | CHOSEN / NONE_OF_THEM | inalterado, registro unificado (R9) |

## 6.2 O reconhecimento redesenhado

Este é o ponto de experiência mais importante da 2.0. Hoje o texto afirma que o
Perfil foi construído com ela, e o que ela vê é `case_priority_map` — a
classificação do Curador. Na 2.0 a tela mostra **duas colunas**:

```
Seu Perfil de Prioridades

O que você disse                          Como isso entrou na sua Curadoria
─────────────────────────────────────────────────────────────────────────
"Preciso conseguir falar com alguém       Tratado como ESSENCIAL
 entre as consultas"                       — confirmado por [Curador], 12/03
 (você respondeu em 10/03)

"Seria bom ter algo escrito para levar"   Tratado como DESEJÁVEL
 (você respondeu em 10/03)                 — confirmado por [Curador], 12/03

Sobre a sua condição, [Curador] entendeu que este caso pede:
  · experiência específica neste tipo de caso
  · acompanhamento após procedimento
  (declarado por [Curador] em 12/03 — não veio de uma pergunta a você)

[ Isso me representa — reconhecer ]     [ Quero corrigir algo ]
```

**As duas colunas, definidas:**

| | Conteúdo | Autoridade | Nunca contém |
|---|---|---|---|
| **Coluna 1 — O que a pessoa declarou** | as respostas dela, na forma em que ela as deu, com a data | **dela** | tradução, reclassificação, resumo do Curador |
| **Coluna 2 — Como a informação foi traduzida para o Método** | a importância resultante, a regra e versão que a propôs, quem confirmou e quando | do **Curador que confirmou** | conteúdo apresentado como se tivesse vindo dela |

O que o Curador declarou **sozinho** (os 11 conceitos técnicos) fica em um bloco
**terceiro e nomeado**, jamais dentro da coluna 1 — a tela precisa deixar óbvio o
que não veio dela.

**Três garantias que essa tela cria:**

1. A tradução deixa de ser mental e passa a ser **visível para quem tem
   autoridade sobre o original**. A pessoa é o melhor auditor da própria
   tradução — e hoje ela é a única que não pode vê-la.
2. O que o Curador declarou sozinho é dito como tal.
3. A correção usa a **supersessão** já existente (ADR-049), sem inventar fluxo.

### 6.2.1 Especificação — ressalva RS-01 **[INTERFACE / OPERAÇÃO]**

| Item | Definição |
|---|---|
| **Onda** | **Onda 1** — é pré-condição de qualquer derivação consumida (§15). Sem ela, a pessoa não pode auditar a tradução que decide por ela |
| **Responsável pela execução** | **a paciente** pratica o ato; o **Curador** responde pela coluna 2; o **sistema** monta e registra |
| **Entradas** | `case_needs` (declarações dela, com data) · `case_priority_map` (valores confirmados) · `derivation_proposals` (proposta, origem, regra, versão, confirmador) · declarações técnicas do Curador |
| **Saídas** | `priority_profiles.status` (reconhecido) **ou** um dos três desfechos alternativos abaixo · registro do ato com autoria, data e **o que estava visível no momento** |

**Os quatro desfechos — deliberadamente distintos:**

| Desfecho | O que a pessoa está dizendo | Efeito |
|---|---|---|
| **Confirmar a tradução** | "é isso" | Perfil reconhecido; Mesa destravada |
| **Discordar da tradução** | "eu disse isso, mas não é isso que significa" | **não é supersessão** — a declaração original permanece; volta ao Curador uma **pendência de retradução** nomeada, com o comentário dela. O Perfil **não** é reconhecido |
| **Corrigir a declaração original** | "eu disse errado / mudei" | **é supersessão** (ADR-049): nova versão de `case_needs`, e o ciclo do §10.6 dispara integralmente |
| **Deixar pendente** | não agir | **nada acontece.** Ausência de resposta **nunca** é reconhecimento |

| Comportamento exigido | Regra |
|---|---|
| **Ausência de resposta** | Perfil permanece **não reconhecido**, indefinidamente. Sem prazo, sem decurso, sem lembrete que confirme por ela. A Mesa continua bloqueada — e esse bloqueio é correto |
| **Discordância** | registrada com o texto dela; gera pendência ao Curador; **nunca** altera o valor sozinha; o Curador pode retraduzir (nova confirmação) ou manter (com justificativa registrada, visível a ela) |
| **Correção da declaração original** | supersessão da declaração; toda confirmação vinculada a ela é **automaticamente superada** (§10.6); nova proposta pode ser derivada; **novo ato humano é exigido** |
| **Supersessão** | Perfil anterior permanece íntegro e legível na versão da época; o novo Perfil exige **novo reconhecimento** — reconhecimento não se herda |
| **Efeito sobre confirmações anteriores** | confirmações apontando para origem superada tornam-se `SUPERADA`, **nunca são apagadas**, e deixam de ser entrada válida do Pipeline de Leitura |
| **Bloqueio de reconhecimento silencioso** | proibidos: reconhecimento por decurso de prazo, por navegação, por rolagem, por fechamento de sessão, por ação de terceiro (ADR-042 já removeu o reconhecimento pelo Curador — a v1.1 estende a proibição a qualquer mecanismo implícito) |

**Critérios de aceite:**

| # | Critério | Verificação |
|---|---|---|
| RC-1 | Toda linha da coluna 2 tem origem, regra, versão, confirmador e data | teste de componente |
| RC-2 | Nenhuma linha da coluna 1 contém texto produzido pelo Curador | teste de componente |
| RC-3 | Os quatro desfechos são alcançáveis e distinguíveis, com esforço equivalente | teste de componente (P-10) |
| RC-4 | Ausência de ação nunca produz `status = reconhecido` | teste de integração |
| RC-5 | Supersessão da origem marca a confirmação como `SUPERADA` sem apagá-la | teste de integração |
| RC-6 | Perfil superado permanece legível no formato da época | teste de integração |

## 6.3 O que ela lê durante a Curadoria

Inalterado em natureza: sete etapas com frase por etapa e responsável por nome.
Correções: **ELIMINA** a etapa DOSSIÊ sem destino (P10) e o responsável passa a
derivar de **um** relógio (P-12), acabando com "ela vê Curador enquanto o
Concierge já a acompanha".

## 6.4 O que ela lê na entrega

| Elemento | 1.0 | 2.0 |
|---|---|---|
| Formato | **dois** documentos concorrentes | **um** |
| Cinco dimensões | de `criterion_declarations` (digitação) | **derivadas do Motor** (P-11) |
| Assinatura | ausente (`curatorName: null`) | **nome de quem escreveu** |
| Seção relacional | prevista (ADR-065) | presente, com frases da Parte 6 do domínio |
| Ranking / score / posição | ausente | **ausente** (garantia mantida e testada) |
| Pontos de atenção | obrigatórios | **obrigatórios** |

---

# 7. Novo fluxo do Concierge **[OPERAÇÃO]**

O Concierge é o **Nível 3** da Correção de Domínio: acompanha depois da
Curadoria. A auditoria encontrou aqui um defeito específico — a inferência de
responsável tem duas fontes e uma vence por precedência, produzindo divergência
silenciosa (RI6).

## 7.1 Redesenho

| Questão | Resposta da 2.0 |
|---|---|
| **Ainda deve existir?** | **Sim.** É o único papel presente depois da decisão, e a continuidade é promessa da Aliviar. |
| **Qual o objetivo?** | Acompanhar a travessia entre a decisão e o vínculo real, e ser a referência contínua depois. |
| **Quem executa?** | Concierge (humano) · Sistema (o relógio). |
| **Pode desaparecer?** | Não. |
| **Pode ser automatizada?** | A **transferência de responsabilidade**, sim — é derivável do fato "decisão registrada". O acompanhamento, não. |
| **Pode ser fundida?** | Com o Atendente, **não**: a Correção de Domínio separou deliberadamente Nível 1 e Nível 3. |
| **Duplicidade?** | Sim — o funil do CRM e a Memória da Curadoria descrevem o mesmo fato. |
| **Retrabalho?** | Sim — mover o funil à mão depois da decisão. |
| **Decisão humana desnecessária?** | Sim — "quem é o responsável agora" não é decisão, é consequência. |

## 7.2 O contrato de responsabilidade

**Uma regra, derivada, sem precedência ambígua:**

```
responsável(Case) = f(fato mais recente registrado no Case)

  Case aberto, sem acolhimento          → Atendente
  Acolhimento iniciado                  → Curador
  ... até a devolutiva registrada       → Curador
  Decisão da paciente registrada        → Concierge
  Relacionamento encerrado              → Concierge (até o encerramento do ciclo)
```

O funil do CRM **não é mais fonte**: ele passa a ser **projeção** desta função
(P-12). Isso resolve RI6 e cinco dos seis "relógios" de uma vez.

---

# 8. Novo fluxo administrativo **[OPERAÇÃO]**

## 8.1 O que o Administrador deixa de fazer

| Deixa de fazer | Por quê | Vai para |
|---|---|---|
| **Preencher o Mapa do Profissional (28 por profissional)** | é transcrição de `practice_evidence`, sem proveniência | proposta derivada + confirmação **de qualquer papel interno habilitado** |
| Abrir Case manualmente | derivável | Sistema |
| Manter o funil sincronizado | derivável | Sistema |

## 8.2 A correção de G4/RI4 — o gargalo de pessoa

> **Atualizado pelo pacote A-01 (2026-08-04), conforme ADR-068 §14.2.** A versão
> anterior desta seção antecipava que confirmar "pode ser exercido pelo mesmo
> perfil que já verifica evidência", sugerindo ampliação do recorte. **A ADR-068
> examinou e recusou a ampliação.** O texto abaixo é a versão vigente.

Hoje **um único papel** (`administrador`) escreve o Mapa do Profissional, e um
profissional sem Mapa vira 28 lacunas em **todos** os Cases simultaneamente.

**Redesenho:** o ato deixa de ser "digitar 28 estados" e passa a ser
**"confirmar 28 propostas derivadas da Base"** — cada uma com a declaração
original, a regra e a versão à vista. **É por aí que G4 se resolve:** o gargalo é
de **carga**, e a carga cai porque o ato encolhe, não porque mais gente escreve.

**O recorte de escrita permanece intacto** (ADR-040 item 6, §4.7 do
Congelamento): escrita `administrador`, leitura `administrador` e
`curador_medico`. **A ADR-068 recusou ampliá-lo** por dois motivos: ampliar
trataria o sintoma, e aumentaria a probabilidade da coincidência que a regra
seguinte proíbe.

**Regra nova que acompanha (ADR-068 item 6):**

> **Quem confirma o Mapa de um profissional em um Case não pode ser quem julga e
> seleciona esse profissional nesse Case.**

É *"quem avalia não atesta"* (ADR-060) aplicado ao ato novo. **Hoje é
inexequível** — uma única conta acumula Administrador e Curador. A exceção é
aceita, datada, **obrigatoriamente visível na Ficha de Explicação**, e caduca
quando a segunda conta prevista na ADR-060 entrar em operação. **Nenhuma
superfície pode ocultar a coincidência.**

## 8.3 O que o Administrador continua fazendo

Criar conta e entregar credenciais (ADR-018), cadastrar e publicar profissional,
verificar evidência, resolver divergência, gerir equipe e papéis, e — novo —
**operar o painel de saúde da informação** (§13.4): quantos profissionais têm
Base incompleta, quantas verificações vencem, quantas divergências estão abertas.

## 8.4 A destinação do ACE

A ADR-035/036/037 já retiraram a autoridade do ACE; `runAceExecution` não tem
chamador. A 2.0 exige **fechar formalmente** (§15, ADR-D):

1. Superfícies `/admin/ace/*` — retiradas (observabilidade de motor inerte).
2. Dado histórico (`ace_artifacts`, execuções) — **preservado, nunca apagado**
   (P-06/I-7), marcado como histórico e fora de toda leitura de produto.
3. Segunda entrega na página da paciente — **retirada** (P9/RI5).
4. A máquina de estados do Case (`IN_CURATION`, `HUMAN_REVIEW`), hoje movida só
   pelo orquestrador inerte, passa a derivar do modelo único de progresso (P-12).

---

# 9. Novo modelo de dados **[ARQUITETURA]**

## 9.1 Regras de saneamento aplicadas

1. **Elimina duplicidade** — dois lugares dizendo o mesmo fato viram um, com
   projeção.
2. **Elimina campo sem função** — nenhum consumidor, nenhuma influência: sai (com
   dado preservado).
3. **Elimina informação derivável** — o que se calcula não se armazena, salvo
   quando o armazenamento **é** o registro de um ato humano.
4. **Nunca apaga histórico** — desativação, nunca exclusão física (§7.3 da
   Governança do Catálogo).

## 9.2 Entidades do lado da pessoa

| Entidade | Por que existe | Quem alimenta | Quem consome | Influência no Motor | Nos relatórios | Nos dashboards | Veredito 2.0 |
|---|---|---|---|---|---|---|---|
| `patient_stories` | a história nas palavras dela | **paciente** | Curador (leitura) | **nenhuma** (texto livre não entra) | contexto do Curador | jornada dela | **MANTÉM** |
| `case_needs` (P1–P17) | o que ela declara querer, com grau | **paciente** | Motor (via derivação), Relacional (direto), painel dela | **origem** da proposta de importância | frases relacionais | Perfil dela | **PROMOVE a fonte primária** |
| `case_priority_map` | importância por conceito neste Case | **Curador (confirma ou declara)** | Motor | **única entrada pelo lado do Case** (ADR-039, congelado) | ordem das frases | Perfil | **MANTÉM estrutura; muda o autor efetivo** |
| `priority_profile_filters` | o inegociável | **Curador declara, item a item** | LE2 | gate | motivo de não-participação | Mesa | **MANTÉM em estrutura própria**; **nunca** derivado, **nunca** em bloco (§5.5) |
| `priority_profiles.status` | o reconhecimento dela | **paciente** | gate da Mesa | gate absoluto | — | jornada | **MANTÉM intocado** |
| `patient_curadoria_decisions` | a decisão dela | **paciente** | Concierge, relógio | — | — | jornada | **MANTÉM como fonte única** (R9) |
| Briefing PA1–PA5 | — | paciente | ninguém na cadeia | **nenhuma** | nenhum | nenhum | **ELIMINA** (dado histórico preservado) |
| `priority_weights` | orçamento de 100 pontos | — | ninguém | nenhuma | nenhum | nenhum | **ELIMINA da cadeia** (ADR-042); histórico preservado |

## 9.3 Entidades do lado do profissional

| Entidade | Por que existe | Quem alimenta | Quem consome | Influência no Motor | Veredito 2.0 |
|---|---|---|---|---|---|
| `professional_profiles` / `_care_model` / `_practice_areas` | identidade e cadastro | admin | LE2, dossiê | filtro e gate | **MANTÉM** |
| `practice_evidence` (append-only, versionada, com proveniência) | o que ele declara praticar | **profissional + operação (verificação)** | DR3 (derivação), Relacional | **origem** da proposta de estado | **PROMOVE a fonte primária** |
| `professional_subcriterion_map` | estado por conceito | **operação (confirma proposta)** | Motor | **única entrada pelo lado do profissional** (ADR-040, congelado) | **MANTÉM estrutura; muda o autor efetivo** |
| `verification_divergences` | duas fontes discordam | Curador | LE2 (bloqueio) | bloqueio | **MANTÉM** |
| Briefing ME1–ME5 | — | profissional | ninguém na cadeia | nenhuma | **ELIMINA** (histórico preservado) |

## 9.4 Entidades novas — exatamente duas

> **Atualizado pelo pacote A-01 (2026-08-04).** As duas entidades passaram a ter
> domínio fechado por ADR: **`derivation_proposals`** pela **ADR-066** e
> **`curator_judgments`** pela **ADR-067**. Onde esta seção divergir das ADRs,
> **valem as ADRs** — elas são a norma; esta seção é o mapa.
>
> **Emenda de estados (ADR-066 §11b):** o desfecho da proposta passa de **quatro
> para cinco** estados — `PROPOSTA` · `CONFIRMADA` · `RECUSADA` · `SUPERADA` ·
> **`RETIRADA`**. A quinta distingue *"a origem mudou"* (`SUPERADA`) de *"a regra
> foi suspensa ou revogada"* (`RETIRADA`): a primeira é operação normal, a
> segunda é sinal de que a regra pode estar errada, e precisa ser contável
> separadamente no painel de discordância.
>
> **Estados de `curator_judgments` (ADR-067 §13):** `VIGENTE` · `SUPERADO` ·
> `RETIRADO`, com **no máximo um `VIGENTE`** por (Case, profissional, conceito).

A 2.0 **não** cria um modelo de dados novo. Cria duas entidades, ambas
consequência direta de P-08 e P-09.

### `derivation_proposals` — a Camada de Derivação materializada

**Correção da ressalva RS-02.** A v1.0 previa um campo "valor final, quando
diferente do proposto" — o que faria da tabela de propostas uma **fonte paralela
de verdade**: dois lugares guardando o valor que decide, com risco de divergirem.
Corrigido: a proposta **registra o desfecho e referencia** a declaração
autoritativa; **nunca a contém**.

| Campo | Papel |
|---|---|
| alvo (`case_priority_map` ou `professional_subcriterion_map` + chave) | o que está sendo proposto |
| valor proposto | a importância ou o estado sugerido — **é histórico do oferecimento, nunca autoridade** |
| **origem** (tabela, registro, versão, data da declaração original) | P-09: de onde veio |
| regra aplicada + **versão da regra** | o que transformou a origem na proposta (§10.5) |
| grau de consequência (§5.4 condição 3) | define se é elegível a bloco |
| desfecho: `PROPOSTA` · `CONFIRMADA` · `RECUSADA` · `SUPERADA` · `RETIRADA` (ADR-066) | o ciclo |
| confirmador (autor, data) — nulo enquanto `PROPOSTA` | P-08: o ato humano |
| **referência à declaração autoritativa final** (ponteiro para a linha do Mapa) | **substitui** o "valor final": a autoridade vive no Mapa, e a proposta apenas aponta para ela |
| motivo da recusa, quando houver | a discordância, preservada como texto dela/dele |

**Regras fechadas da entidade:**

| # | Regra |
|---|---|
| 1 | **Append-only.** Mudança de desfecho grava linha nova; nada é sobrescrito (I-7) |
| 2 | **Nunca é fonte paralela de verdade.** Nenhuma leitura de produto resolve valor a partir daqui |
| 3 | **Nunca guarda o valor final como autoridade própria** — guarda o ponteiro |
| 4 | **Não é entrada do Pipeline de Leitura** (§2.3) |
| 5 | Sem qualquer campo de proveniência, **não persiste** |

**Por que ela existe:** sem ela, "o sistema pré-preencheu" e "o humano decidiu"
tornam-se indistinguíveis no banco — e a auditabilidade da 2.0 morre no dia um.

**Quem alimenta:** Pipeline de Derivação (DR4).
**Quem consome:** Fronteira Humana, Ficha de Explicação, painel de discordância,
auditoria.
**Influência no Motor:** **nenhuma** — o Motor lê os Mapas confirmados. Esta é a
fronteira C2→C3 tornada física.

### `curator_judgments` — o juízo humano onde não há célula

Hoje o juízo relacional dos três conceitos `humano` não tem lugar próprio, e o
juízo técnico mora em `criterion_declarations` misturado com o que sai da cadeia.

**Correção da ressalva RS-03: `AREA` foi retirada.** Compatibilidade de área é
**filtro eliminatório**, não juízo de compatibilidade: tem quatro estados
próprios (Modelo §3.1), elimina, e produz motivo de não-participação. Guardá-la
junto dos juízos convidaria, mais cedo ou mais tarde, a tratá-la com a mesma
ergonomia — inclusive em bloco. Ela permanece em **estrutura própria de filtro**
(§5.5).

| Campo | Papel |
|---|---|
| Case + profissional + conceito | o par julgado |
| natureza: `TECNICO` (FORMACAO/EXPERIENCIA/HISTORICO) · `RELACIONAL` (os 3 conceitos `humano`) — **e nada além** | por que é humano |
| leitura do Curador (texto curto) | o juízo |
| referências de evidência (nunca texto livre re-digitado) | R10 resolvido |
| autor, data, e **o que estava visível no momento** | rastreabilidade (§9 do Modelo) |
| declaração de origem vinculada + versão | permite a supersessão do §10.6 |

**Regras fechadas:** **append-only** (RS-05); retificar é gravar versão nova;
juízo vinculado a origem superada torna-se `SUPERADO` e sai das entradas válidas
do Pipeline de Leitura, sem ser apagado.

### Preservação de `criterion_declarations` — correção da ressalva RS-04

A v1.0 dizia "migra os três técnicos para cá". **Migrar é errado** — move o
registro para fora do contexto em que foi feito e reescreve a história. Corrigido:

| # | Regra |
|---|---|
| 1 | `criterion_declarations` **permanece**, íntegra, legível e auditável |
| 2 | Os juízos técnicos são **copiados** para `curator_judgments`, **preservando integralmente a origem**: autor original, data original, texto original e referência à linha de origem |
| 3 | A cópia **declara que é cópia** — nunca se apresenta como ato novo |
| 4 | Nenhum registro histórico é apagado, reescrito ou "traduzido" para o vocabulário novo |
| 5 | Os três critérios do lado da pessoa **param de receber escrita nova**; os existentes continuam legíveis no formato da época |

## 9.5 O que sai do modelo

| Sai | Motivo | Destino do dado |
|---|---|---|
| Três critérios do lado da pessoa em `criterion_declarations` | duplicam a leitura do Motor (R2) | preservados como histórico; nunca reescritos |
| `criterion_declarations.evidence` (texto livre) | duplica a Base (R10) | substituído por referência a `practice_evidence` |
| Briefings PA/ME | não alcançam a cadeia (R4/R5) | preservados, fora da cadeia |
| `priority_weights`, `cruzamento_weights`, `compatibility_analyses` | motor aposentado (ADR-042) | preservados como histórico |
| Estágio do funil como **estado** | vira projeção (P-12) | a coluna permanece, alimentada por derivação |
| Decisão duplicada na `DevolutivaRecord` | R9 | referência à fonte única |

## 9.6 Contagem

**28 conceitos: inalterados. 15 células: inalteradas. 4 resultados, 5 níveis, 3
estados: inalterados.** Duas entidades novas, seis saneamentos, zero conceito
novo de domínio. **A 2.0 não toca o Congelamento §4** — ela o cumpre em lugares
onde hoje ele é promessa e não guarda (P15).

---

# 10. Novo motor de compatibilidade **[DOMÍNIO]**

## 10.1 O que muda no Motor de Compatibilidade

**Nada na física.** A matriz 5×3, os quatro resultados, a distinção
`LACUNA_DE_INFORMACAO` (status `null`) × `NAO_INFORMADO`, a recusa de comparar
catálogos divergentes, a derivação de seis células a partir de três princípios
escritos — tudo permanece, e permanece congelado.

Mudam **duas coisas fora da física** — a terceira foi retirada pelo parecer (B2):

| # | Mudança | Natureza |
|---|---|---|
| **M1** | **As entradas passam a ter origem declarada.** O Motor lê os mesmos Mapas; os Mapas passam a ser confirmações registradas, não digitação. | correção de arquitetura, não de domínio |
| **M2** | **A guarda de participação passa a ser executável.** `MOTOR_PARTICIPATION: NUNCA` (viabilidade, texto livre) deixa de ser contrato documental e passa a ser recusa no cruzamento — resolvendo P15/RI8. | **correção de defeito** sob §12 do Modelo, se a verificação confirmar |
| ~~M3~~ | ~~Chave de ordenação por prontidão~~ | **RETIRADA (B2).** Era ranking por construção. A ordem permanece **a neutra da Rede**; a pendência §11 do Modelo permanece **aberta** — ver §4.6 e §15 |

## 10.2 As quatro leituras, e a proibição de somá-las

| Leitura | Sobre o quê | Produz | Congelada por |
|---|---|---|---|
| **Elegibilidade** | filtros + área | participa / não participa / pendente de verificação, **sempre com motivo** | Modelo §3 |
| **Compatibilidade** | 28 conceitos, importância × estado | 4 resultados por conceito | ADR-041 |
| **Relacional** | 6 conceitos, grau × estado | 4 resultados + `AGUARDA_JUIZO_DO_CURADOR` | ADR-065 |
| **Juízo** | 3 técnicos + 3 relacionais | leitura assinada do Curador | ADR-035 |

*(A **área** não é leitura de compatibilidade: é filtro eliminatório, com quatro
estados próprios e estrutura própria — §5.5, RS-03.)*

**Regra fechada:** as quatro permanecem separadas. Nenhum agregado, nenhum total,
nenhum "resumo geral". O único resumo permitido é **contagem de ocorrências**
("3 altas · 1 média · 1 lacuna · 2 aguardam juízo") — nunca comparativa entre
profissionais.

## 10.3 A regra de derivação de importância (DR3, lado da pessoa)

**Esta é a decisão central da 2.0 e a única que toca o congelado.** Ela exige
ADR própria (§15, ADR-A). Esta seção define a **forma** da regra, não seus
valores — os valores são decisão de Método.

### 10.3.0 Declaração de reabertura da invariante I-10 **[GOVERNANÇA]**

**Correção C-1 do parecer.** As versões anteriores deste documento afirmavam que
a ponte preservava I-10 integralmente. **Isso não se sustenta**, e a arquitetura
não vai tentar salvar a invariante por redefinição semântica.

> **A criação de uma ponte versionada entre grau declarado pela pessoa e
> importância utilizada no Case reabre a invariante I-10 em substância, embora
> preserve a distinção formal entre as duas escalas.**

O que a invariante diz hoje (§5 do Congelamento): *"Grau da pessoa ≠ importância
do Case — escalas sem valor em comum, e só a importância alcança o Motor."* A
ponte **não cria valor em comum** — as escalas continuam com domínios distintos,
e o teste continua podendo prová-lo. Mas cria **uma correspondência declarada e
sistemática** entre elas, que é precisamente o que a separação existia para
impedir. Chamar isso de "preservação" seria manter a letra e perder o motivo.

**Consequências formais, todas vinculantes:**

| # | Consequência |
|---|---|
| 1 | **A ADR-A deverá registrar essa reabertura de forma explícita** — nomeando I-10, citando o §5 e o §6 do Congelamento, e apresentando a análise de impacto que o §6 exige. Uma ADR que aprove a ponte sem dizer que reabre I-10 está incompleta |
| 2 | **A forma e a governança da ponte podem ser decididas agora** — estrutura da tabela, versionamento, autoridade (§10.5), ciclo de vida e obrigatoriedade de confirmação humana não dependem de operação real |
| 3 | **Os valores estáveis da ponte não podem ser aprovados antes de Cases reais** — o §6 do Congelamento exige necessidade observada em operação concreta, e a Rede real não existe (RI10) |
| 4 | **Qualquer versão anterior à evidência operacional deverá ser marcada como `PROVISÓRIA`**, com vigência limitada e revisão obrigatória. Regra provisória que ninguém revisa vira permanente por inércia |
| 5 | **O teste `importancia-vs-grau.test.ts` não poderá ser reinterpretado silenciosamente.** Ele hoje protege a separação das escalas; enquanto a ADR-A não existir, ele protege exatamente isso e **não pode ser afrouxado, renomeado ou ter sua asserção relaxada** para acomodar a ponte |
| 6 | **A finalidade do teste só é atualizada depois da ADR correspondente** — e a atualização é parte do escopo da ADR, não trabalho de implementação. Enquanto a ADR não existir, um teste vermelho por causa da ponte é sinal de que a ponte chegou antes da decisão |

**Registro de honestidade:** esta é a única reabertura substancial de invariante
que a Curadoria 2.0 propõe. Todas as demais mudanças ou são correção de defeito
(§12 do Modelo) ou são evolução já prevista. Se o Guardião recusar a reabertura,
a 2.0 continua de pé sem a ponte — perde a derivação de importância (O3),
mantém tudo o mais, e o Curador segue declarando os 17 conceitos à mão. **A
arquitetura foi desenhada para sobreviver a essa recusa.**

**Forma exigida:**

```
grau declarado pela pessoa  ──[tabela de correspondência versionada]──▶  importância proposta
```

Seis exigências não negociáveis sobre essa tabela:

1. **Total e explícita** — todo grau tem correspondência declarada; nenhum caso
   cai em "o Curador decide sozinho por omissão".
2. **Versionada** — a proposta guarda a versão da tabela que a gerou (§7.5 da
   Governança).
3. **Não-bijetora por desenho** — grau e importância continuam escalas com
   domínios distintos; a tabela é uma **ponte declarada**, não uma equivalência.
   Isso preserva a **forma** de I-10, não a sua substância (§10.3.0). O teste
   `importancia-vs-grau.test.ts` **permanece intocado até a ADR-A**, e sua
   finalidade só muda pela própria ADR.
4. **Silenciosa nos 11 técnicos** — conceito sem lado da pessoa **não recebe
   proposta**. Nunca se inventa origem.
5. **Recusável sem atrito** — discordar deve custar o mesmo que concordar
   (P-10).
6. **Auditável de trás para frente** — de qualquer importância no Mapa, chega-se
   à frase que ela escreveu e à data em que escreveu.

**O ganho real não é economia de atos.** É que uma tradução que hoje acontece
**dentro da cabeça do Curador** passa a acontecer **na frente de todo mundo** —
inclusive dela. Uma tradução mental é irrecuperável em auditoria; uma tabela
versionada é a coisa mais auditável que existe.

## 10.4 A regra de derivação de estado (DR3, lado do profissional)

**Risco baixo, precedente implementado.** `deriveRelationalState` já faz
exatamente isto para seis conceitos (Parte 5.1 do domínio relacional):

| Situação da evidência vigente | Estado proposto |
|---|---|
| Nenhuma evidência vigente do conceito | `NAO_INFORMADO` |
| Evidência vigente, sem conduta correspondente ao que se pergunta | `NAO_CONFIRMADO` |
| Evidência vigente com conduta correspondente | `CONFIRMADO` |

Duas exigências adicionais da 2.0:

- **Autodeclaração nunca nasce confirmada sem verificação** (§4.6 do
  Congelamento): a proposta carrega o `verification_status` da evidência que a
  sustenta, e a superfície de confirmação mostra esse estado. Confirmar sobre
  evidência não verificada é permitido, **é registrado como tal**, e aparece na
  Ficha de Explicação como lacuna de governança — nunca como compatibilidade
  menor (I-5: governança ≠ compatibilidade).
- **Evidência vencida** (`isStale`) produz proposta de revisão, não estado novo.

## 10.5 Autoridade e governança da regra de derivação **[GOVERNANÇA]**

**Correção do bloqueador B5.** A v1.0 descrevia a forma da regra sem dizer quem
responde por ela. Uma regra sem dono é a pior forma de automação: ninguém a
propôs, ninguém a aprovou, ninguém pode suspendê-la — e, quando errar, ninguém
responde.

### A autoridade

A autoridade **não é um cargo operacional novo**, e este documento não cria
nenhum. É uma **função formal de governança do Método**, exercida por decisão
humana explícita e sujeita a ADR:

> **Autoridade de Método sobre Regras de Derivação** — função de governança,
> não posto de trabalho. Pode ser exercida por uma pessoa nomeada, por um comitê
> ou pelo responsável do Método; **quem a exerce é decisão do Fundador**, não
> desta arquitetura.

| Ato | Quem pode | Registro exigido |
|---|---|---|
| **Propor** uma regra nova | qualquer papel interno (Curador, operação, engenharia) | proposta com justificativa e evidência |
| **Aprovar** | **a Autoridade de Método**, por **ADR** | ADR referenciando o `MODELO_CURADORIA_V1.md` |
| **Versionar** | a Autoridade | nova versão; a anterior permanece legível |
| **Alterar** | a Autoridade, por nova versão | nunca edição no lugar (I-7) |
| **Suspender** | **a Autoridade ou o Curador responsável pelo Case** (§5.4 condição 7) | motivo e data; suspensão é ato reversível e registrado |
| **Revogar** | a Autoridade, por ADR | ADR de revogação |
| **Revisar resultados** | a Autoridade, obrigatoriamente, com o painel de discordância | revisão periódica registrada |
| **Responder pelos efeitos** | **a Autoridade** — inclusive por confirmações feitas sobre proposta errada | é o ponto: alguém responde |

### O ciclo de vida da regra

Toda regra de derivação é um objeto de governança com dez atributos
obrigatórios. Regra sem qualquer um deles **não propõe**:

| Atributo | Papel |
|---|---|
| **identificador** | estável, nunca reutilizado |
| **versão** | a proposta guarda a versão que a gerou |
| **vigência** | início e fim; fora da vigência, não propõe |
| **autor proponente** | quem sugeriu |
| **autoridade aprovadora** | quem respondeu por ela |
| **justificativa** | por que existe |
| **evidência utilizada** | o que a sustenta — e, hoje, a resposta honesta é "nenhuma operação real" |
| **estado** | `PROPOSTA` · `VIGENTE` · `SUSPENSA` · `REVOGADA` |
| **histórico** | append-only, todas as versões legíveis |
| **data de suspensão ou revogação** | quando deixou de valer |

### A regra sobre os valores

> **Forma e governança podem ser decididas agora. Valores, não.**

A **forma** da ponte entre escalas (§10.3), a estrutura da regra, sua autoridade
e seu ciclo de vida são decisões arquiteturais que podem ser tomadas sem
operação real. **Os valores da correspondência não podem se tornar estáveis
antes de Cases reais** — o §6 do Congelamento exige necessidade observada, e a
Rede real não existe (RI10).

**Consequência prática:** a primeira versão de qualquer tabela grau→importância
nasce marcada **`PROVISÓRIA`**, com vigência limitada e revisão obrigatória após
os primeiros Cases reais. Uma regra provisória que ninguém revisa vira
permanente por inércia — e é exatamente assim que uma tradução errada se torna a
verdade do sistema.

## 10.6 Ciclo de supersessão e retificação **[ARQUITETURA]**

**Correção da ressalva RS-06.** A v1.0 não dizia o que acontece com uma
confirmação quando a declaração que a originou é retratada. Sem essa regra, o
sistema acumula confirmações vigentes apontando para verdades que a pessoa já
corrigiu — o pior defeito possível em um sistema que promete proveniência.

**O ciclo, em oito passos:**

```
1. Declaração original é criada                    (pessoa ou profissional)
2. Proposta é derivada                             (DR1..DR5, regra vN)
3. Proposta é confirmada ou recusada               (Fronteira Humana, autor + data)
4. Declaração original é posteriormente SUPERSEDIDA (nova versão da origem)
        │
        ▼
5. Confirmação vinculada à origem anterior torna-se SUPERADA  ← automático
        │  · nunca é apagada
        │  · deixa de ser entrada válida do Pipeline de Leitura
        │  · o Mapa correspondente volta a "sem declaração vigente"
        ▼
6. Nova proposta PODE ser derivada                 (regra vigente no momento)
7. NOVO ato humano é EXIGIDO                       ← nunca herdado
8. Histórico anterior permanece íntegro            (I-7)
```

**A regra que fecha o ciclo:**

> **Nenhuma confirmação permanece vigente apontando para origem retratada.**

**Três consequências que precisam estar visíveis na operação:**

| Consequência | Comportamento |
|---|---|
| O Mapa perde uma entrada | o conceito volta a **lacuna**, nunca a um valor antigo "por segurança". Lacuna é a verdade: ninguém confirmou sobre a declaração nova |
| A leitura muda | recalculada, porque nunca foi persistida (§2.3) |
| O Relatório já emitido | **não se reescreve sozinho.** Documento emitido é imutável; corrigi-lo é **errata versionada** (ADR-050), ato humano, nunca efeito colateral de supersessão |

**Vale igualmente para `curator_judgments`:** juízo cuja origem foi superada
torna-se `SUPERADO` e exige novo ato — o Curador não herda o próprio juízo sobre
um fato que mudou.

---

# 11. Novo motor de explicabilidade **[ARQUITETURA]**

## 11.0 Invariante de implantação — correção do bloqueador B3

> **Nenhuma derivação entra em superfície sem explicação reproduzível.**

A v1.0 colocou a Ficha de Explicação na Onda 4, **depois** de as derivações já
estarem sendo confirmadas por humanos nas Ondas 1 e 2. Isso é insustentável: a
Fronteira Humana (§2.4) exige que o confirmador veja origem, regra e versão — e
isso **é** explicabilidade. Sem ela, a confirmação é cega por desenho, e o
carimbo deixa de ser risco para virar a única opção disponível.

**Correção:** a explicabilidade é **pré-condição da primeira derivação
apresentada a qualquer humano**, e integra a Onda 1 (§15). A Onda 4 fica
reservada a **refinamento de linguagem, visualização e experiência** — nunca à
existência da explicação.

## 11.1 A peça central da 2.0

Hoje a explicação existe **dentro** do gerador de Relatório. Na 2.0 ela é um
**estágio próprio do Motor (LE4)**, com saída própria — a **Ficha de Explicação** —
consumida por três superfícies distintas (Mesa, Relatório, painel da paciente),
cada uma com seu vocabulário.

**Por que separar:** hoje a explicação só existe onde há Relatório. Um Curador na
Mesa, um auditor seis meses depois e a própria paciente perguntando "por que
este?" precisam da mesma resposta, e hoje só o Relatório a tem.

## 11.2 A Ficha de Explicação — as seis respostas obrigatórias

Para **cada profissional lido**, o Motor produz uma Ficha que responde, sem
exceção. **A Ficha existe também para a proposta**, não só para a leitura: toda
derivação apresentada na Fronteira Humana carrega declaração original, regra
aplicada, versão, proposta, e — depois do ato — confirmador e desfecho
(§11.0).

| # | Pergunta | Como se responde | Fonte |
|---|---|---|---|
| **1** | **Por que foi escolhida?** | os conceitos em que houve correspondência, cada um com a declaração dela e a declaração dele lado a lado | LE3 + C1 |
| **2** | **Por que ficou nesta posição?** | **"Não há posição."** A ordem é a **neutra da Rede** — não afirma nada sobre ninguém (§4.6). A Ficha diz isso explicitamente em vez de silenciar. | contrato |
| **3** | **Quais critérios influenciaram?** | lista dos conceitos que entraram na leitura, com o resultado de cada um | LE3 |
| **4** | **Quais critérios NÃO influenciaram — e por quê?** | três motivos distintos, nunca fundidos: (a) **fora do Motor por Método** (viabilidade, prática, texto livre); (b) **sem importância declarada pelo Case** (`notDeclaredByCase` — fato sobre o Case, nunca sobre o profissional); (c) **grau sem preferência** da pessoa | LE1 + LE3 |
| **5** | **Quais lacunas existem?** | separadas por natureza: **ninguém olhou** (`LACUNA_DE_INFORMACAO`) · **olharam e não souberam** (`NAO_INFORMADO`) · **evidência vencida** · **juízo humano pendente** · **divergência aberta** | LE1 |
| **6** | **Qual o grau de confiança?** | **qualitativo, nunca numérico, nunca comparativo** — ver §11.3 | LE1 |

## 11.3 Grau de confiança sem inventar score

O maior risco desta seção é que "grau de confiança" vire, por dentro, um número
comparável — e portanto um ranking. A 2.0 fecha essa porta por desenho:

| Estado | Definição | O que a superfície faz |
|---|---|---|
| `LEITURA_COMPLETA` | todo conceito com importância declarada tem estado do profissional, verificado e vigente | leitura pode sustentar conversa |
| `LEITURA_COM_LACUNAS` | há conceitos sem estado, com evidência vencida, ou com juízo pendente | **as lacunas são listadas, uma a uma** |
| `LEITURA_INSUFICIENTE` | não há estado para nenhum conceito essencial do Case | a ação é **verificar o cadastro**, nunca descartar |

**Escopo reduzido pelo parecer (B2).** A confiança **descreve a suficiência da
leitura** de um profissional consigo mesmo. Ela **nunca** compara, **nunca**
define posição, **nunca** produz ordem e **nunca** é apresentada como mérito do
profissional — completude de cadastro é dívida da operação, não qualidade de
quem é lido.

Cinco proibições, verificáveis por teste:

1. **Nunca um número.** Nem percentual de cobertura na superfície da paciente,
   nem "18/28".
2. **Nunca comparativo.** A Ficha de um profissional jamais menciona outro.
3. **Nunca chave de ordenação** — nem interna, nem "só para o Curador", nem por
   agrupamento, cor, ícone ou seção destacada.
4. **Nunca mérito** — a frase nunca atribui a lacuna ao profissional quando ela é
   da operação.
5. **Nunca vocabulário de qualidade.** Confiança é sobre **a informação**, nunca
   sobre **a pessoa** — I-5 é a regra que separa as duas, e ela vale aqui
   integralmente.

## 11.4 A cadeia de proveniência completa

A 2.0 estará certa quando esta cadeia estiver fechada, ponta a ponta, para
qualquer frase:

```
frase no Relatório dela
  └─ resultado de célula (conceito, importância × estado)
       ├─ importância ── confirmação (autor, data) ── proposta (regra vN) ── case_needs (resposta dela, data)
       └─ estado ─────── confirmação (autor, data) ── proposta (regra vN) ── practice_evidence (versão, fonte, verificador, data)
```

**Critério de aceite (§17):** dada qualquer frase entregue a uma paciente, é
possível reconstruir essa árvore inteira **sem que ninguém precise lembrar de
nada**. Hoje dois dos quatro ramos terminam em "o Curador digitou".

## 11.5 Vocabulário por superfície

A mesma Ficha, três linguagens — a fronteira mecânica `PATIENT_FORBIDDEN_TERMS`
permanece e passa a cobrir a Ficha:

| Superfície | Vocabulário | Exemplo |
|---|---|---|
| **Mesa** | técnico completo: conceitos, células, resultados nomeados | "MODELO_COMUNICACAO · ESSENCIAL × CONFIRMADO → ALTA" |
| **Relatório** | verbalização com proveniência | "Para você é essencial que confirmem se você entendeu. Este profissional declara que verifica se a pessoa compreendeu." |
| **Auditoria** | identificadores canônicos + timestamps + autores | árvore do §11.4, sem prosa |

A paciente **nunca** vê célula, matriz, contagem ou resultado nomeado.

---

# 12. Novo modelo de relatórios **[INTERFACE]**

## 12.1 Princípio

**Um Relatório, um formato, uma assinatura, uma origem por frase.**

## 12.2 Composição

| Seção | Origem | Quem assume | Muda na 2.0? |
|---|---|---|---|
| **Abertura** ("por que estas três, juntas") | rascunho da composição declarada + **texto humano preservado** | Curador | **Sim** — corrige P12: regenerar nunca apaga o que a pessoa escreveu |
| Justificativa por opção | LE4, com proveniência | Motor propõe, Curador assina | não |
| Relação com as prioridades | LE4, ordenada por importância | Motor | não |
| Leitura relacional | LE4 + `curator_judgments` | Motor + Curador | **Sim** — frases dos 3 conceitos humanos só após juízo |
| Pontos de atenção | LE4, **obrigatórios** | Motor propõe, Curador completa | não — "opção só com virtudes é recomendação" |
| Pontos favoráveis / perguntas sugeridas | LE4 | Motor | não |
| Lacunas | LE1 | Motor | **Sim** — passam a ser as mesmas da Ficha, não uma segunda lista |
| Observações do Curador | vazio ao nascer, por princípio | Curador | não |
| **Assinatura** | quem aprovou e emitiu | Sistema | **Sim** — deixa de ser `null` (P7) |

## 12.3 As cinco dimensões da paciente

**A correção mais importante para a experiência dela.** Passam a derivar de LE3/LE4
(P-11). Consequências:

- Sem digitação do Curador, ela **não** lê mais "ainda precisamos confirmar" em
  tudo enquanto o Motor tem leitura completa (D4).
- Onde há lacuna real, ela continua lendo lacuna — e a frase distingue "ninguém
  olhou" de "olharam e não souberam", como o Relatório já faz.
- O Curador **pode acrescentar**, nunca substituir: acréscimo é `curator_judgments`
  com autoria, não sobrescrita silenciosa.

## 12.4 Ciclo e guardas

Ciclo inalterado: gerar → revisar → aprovar → emitir → entregar, com
`deliver_curadoria` transacional (ADR-048). As duas guardas de emissão da ADR-064
permanecem, e ganham **antecipação**: o painel de prontidão (§13.2) mostra o que
falta **antes** de o Curador tentar emitir — resolvendo G6 sem afrouxar guarda
nenhuma.

## 12.5 Relatórios internos (operação)

Novos, e **nenhum deles compara pessoas**:

| Relatório | Responde | Para quem |
|---|---|---|
| **Saúde da informação da Rede** | quantos profissionais têm Base incompleta, verificações vencendo, divergências abertas | Administrador |
| **Prontidão do Case** | o que falta para emitir, item a item | Curador |
| **Taxa de discordância das derivações** | com que frequência o humano recusa a proposta, por conceito e por versão de regra | Método |

O terceiro é o **instrumento de calibração da 2.0**: se a taxa de discordância de
uma regra for alta, a regra está errada — não o Curador. Sem ele, a tabela
grau→importância nunca poderia ser corrigida por evidência.

---

# 13. Nova arquitetura dos dashboards **[INTERFACE]**

**Não são telas. São responsabilidades.** Cada painel responde a **uma** pergunta
de **um** papel. Painel que responde a duas perguntas é dois painéis.

## 13.1 O que a Paciente precisa compreender

> *"O que vocês entenderam de mim, onde isso está, e por que estes três caminhos."*

| Painel | Responde | Origem | Proibido |
|---|---|---|---|
| **Meu Perfil** | "isto é o que eu disse, e isto é como entrou" (duas colunas, §6.2) | `case_needs` + `case_priority_map` + confirmações | esconder a tradução |
| **Onde estou** | etapa atual + responsável por nome | relógio único (P-12) | etapa sem destino (P10) |
| **Meus caminhos** | as três cartas, sequenciais, uma aberta por vez | LE4 | ranking, score, posição, comparação forçada, segundo documento |
| **Minha decisão** | registrar, no tempo dela, incluindo "nenhuma destas" | `patient_curadoria_decisions` | tornar "nenhuma" mais caro que escolher |

## 13.2 O que o Curador precisa verificar

> *"O que exige a minha decisão agora, e o que ainda não posso sustentar."*

| Painel | Responde | Substitui |
|---|---|---|
| **Fila de decisões** | os atos que só ele pode fazer, neste Case, agora | a Mesa que hoje mistura decisão com digitação |
| **Confirmações pendentes** | as propostas derivadas, com a declaração original ao lado | as 28 + 28 digitações |
| **Painel de juízo** | os conceitos `humano`, duas declarações lado a lado, campo de leitura | superfície que hoje falta (ADR-065 Parte 7.1) |
| **Prontidão para emissão** | o que falta, antes de tentar | descobrir ao falhar (G6) |
| **Linha de investigação** | lacunas, evidências vencidas, divergências abertas | itens dispersos |

**O que a Mesa nunca tem:** ordenação por resultado, medalha, cor de "melhor",
contagem comparativa entre profissionais, botão de "aprovar profissional".

## 13.3 O que o Concierge precisa acompanhar

> *"Quem está comigo agora, e o que prometi a cada uma."*

Painel de vínculos ativos por fato registrado (decisão, primeiro contato,
acompanhamento, encerramento), com a responsabilidade derivada do relógio único
(§7.2). **Nenhuma métrica de conversão** — o Concierge acompanha pessoas, não
funil.

## 13.4 O que o Administrador precisa controlar

> *"A informação sobre a qual a Curadoria decide está saudável?"*

| Painel | Responde |
|---|---|
| **Saúde da Rede** | profissionais publicados, Base incompleta, verificações vencendo, divergências abertas |
| **Fila de confirmação** | propostas de estado aguardando confirmação, por profissional |
| **Governança de acesso** | quem pode confirmar o quê (menor privilégio, ADR-060) |
| **Integridade do catálogo** | versão vigente, conceitos ativos, coerência entre código e banco |

**O que sai:** `/admin/ace/*` — observabilidade de motor que não executa (§8.4).

## 13.5 O que o Motor precisa explicar

> *"De onde veio cada coisa que eu disse."*

A **Ficha de Explicação** (§11) é a superfície do Motor. Ela não é um dashboard
de operação — é o artefato que torna as outras quatro auditáveis. Consumida pela
Mesa em vocabulário técnico, pelo Relatório em verbalização, pela auditoria em
identificadores.

---

# 14. Mapa de responsabilidades **[OPERAÇÃO]**

Seis verbos, e **cada ato do sistema tem exatamente um**:

**DECLARA** (é a autoridade sobre o fato) · **DERIVA** (propõe, com proveniência)
· **CONFIRMA** (aceita ou recusa a proposta, com autoria) · **JULGA** (lê o que
exige juízo) · **DECIDE** (escolhe) · **AUDITA** (verifica depois).

| Ato | Paciente | Motor | Curador | Concierge | Administrador | Sistema |
|---|---|---|---|---|---|---|
| História e P1–P17 | **DECLARA** | — | — | — | — | registra |
| Restrições (texto guiado) | **DECLARA** | — | JULGA | — | — | registra |
| Abertura do Case | — | — | — | — | — | **DERIVA** |
| Contexto clínico | — | — | **DECLARA** | — | — | registra |
| **Filtros eliminatórios** — ver nota abaixo | (origem da conversa) | **aplica apenas filtro válido, autorado e confirmado** | **JULGA e DECLARA, item a item** | — | **DECLARA** quando for o papel previsto | **sinaliza tema** + registra motivo, autoria, data e estado |
| Importância — 17 com lado dela | (origem) | DERIVA | **CONFIRMA** | — | — | — |
| Importância — 11 técnicos | — | — | **DECLARA** | — | — | — |
| Reconhecimento do Perfil | **DECIDE** | — | — | — | — | gate |
| Evidência de prática | — | — | — | — | — | registra |
| Verificação de evidência | — | — | **JULGA** | — | JULGA | — |
| Estado do profissional (28) | — | DERIVA | — | — | **CONFIRMA** | — |
| Divergência entre fontes | — | sinaliza | **JULGA** | — | — | — |
| Elegibilidade objetiva | — | **DERIVA** | — | — | — | — |
| Compatibilidade de área | — | sugere | **DECLARA** | — | — | — |
| Leitura de Compatibilidade | — | **DERIVA** | — | — | — | — |
| Leitura Relacional | — | **DERIVA** | — | — | — | — |
| Juízo técnico (3 critérios) | — | prepara | **JULGA** | — | — | — |
| Juízo relacional (3 conceitos) | — | prepara | **JULGA** | — | — | — |
| Ficha de Explicação | — | **DERIVA** | — | — | — | — |
| Seleção dos três | — | — | **DECIDE** | — | — | — |
| Rascunho do Relatório | — | **DERIVA** | — | — | — | — |
| Abertura do Relatório | — | propõe | **DECLARA** | — | — | preserva |
| Aprovação e emissão | — | — | **DECIDE** | — | — | guarda |
| Entrega | — | — | — | — | — | **DERIVA** (transacional) |
| Devolutiva | recebe | — | **DECLARA** | — | — | registra |
| Decisão final | **DECIDE** | — | — | — | — | registra |
| Responsável atual | — | — | — | — | — | **DERIVA** (§7.2) |
| Progresso (5 projeções) | — | — | — | — | — | **DERIVA** |
| Acompanhamento | — | — | — | **DECLARA** | — | registra |
| Conta e publicação | — | — | — | — | **DECLARA** | — |
| Saúde da informação | — | DERIVA | — | — | **AUDITA** | — |

### Nota obrigatória sobre a linha dos filtros eliminatórios (correção C-2)

A versão anterior desta tabela atribuía **`DERIVA`** ao Motor na linha dos
filtros — em contradição direta com o §5.5, que proíbe derivar filtro. **O Motor
nunca deriva filtro.** A responsabilidade correta, em sete pontos:

| # | Papel | O que faz — e o que não faz |
|---|---|---|
| 1 | **Sistema** | **sinaliza o tema para discussão** — "ela declarou isto como essencial; vale conversar se é inegociável". **Nunca** apresenta filtro pronto para confirmação |
| 2 | **Curador** | **conduz a verificação** — separa inegociável de desejo, com a pessoa |
| 3 | **Pessoa com autoridade prevista** | **declara ou confirma o filtro, individualmente**, por par (Case, profissional) quando for o caso |
| 4 | **Motor** | **aplica somente filtro válido, autorado e confirmado.** Filtro sem autoria não elimina ninguém |
| 5 | **Sistema** | **registra motivo, autoria, data e estado** — quem não participa nunca é "nota baixa", é motivo declarado |
| 6 | — | **Nenhum filtro pode nascer de grau `ESSENCIAL`** |
| 7 | — | **Nenhum filtro pode entrar em confirmação em bloco** (§5.4 condições 1 e 2) |

Esta linha e o §5.5 dizem a mesma coisa. Se um dia divergirem, **vale o §5.5**,
que é `[DOMÍNIO]`.

**Leitura do mapa:** o Curador aparece **14 vezes** — 6 como DECLARA/JULGA sobre
filtros e juízos, 2 como DECIDE, 2 como CONFIRMA. **Zero como transcritor.** Era
esse o objetivo.

---

# 15. Plano macro de implantação **[IMPLANTAÇÃO]**

**Reescrito na v1.1** — correção dos bloqueadores **B3** (explicabilidade tarde
demais) e **B6** (derivação persistida antes das dependências).

## 15.0 A regra de sequenciamento que faltava

> **Nenhuma derivação persistida ou consumida pode começar antes de existirem,
> simultaneamente:** `derivation_proposals` · proveniência completa · regra
> versionada · autoridade da regra · explicabilidade · reconhecimento em duas
> colunas · mecanismo de discordância · painel de discordância · guardas contra
> vazamento de critérios · critérios de supersessão.

**Consequência imediata sobre a antiga Onda 1.2** ("Mapa do Profissional proposto
a partir da Base"): ela **violava** essa regra — persistia e apresentava
propostas antes de sete das dez dependências existirem. Corrigida em duas
partes:

| Antes (v1.0) | Depois (v1.1) |
|---|---|
| **1.2** — Mapa do Profissional proposto a partir da Base, na primeira onda | **1.A** — **função pura de derivação**, sem persistência, sem consumidor, sem superfície, sem efeito operacional (código inerte por desenho, verificável: zero chamadores) · **2.C** — persistência e apresentação, **só depois** das dez dependências |

## Onda 0 — Verificar e decidir (nenhuma linha de código)

| Item | Ato |
|---|---|
| **Entrada** | auditoria concluída; arquitetura revisada submetida ao Guardião |
| **Escopo** | 0.1 confirmar/refutar P15 · 0.2 destino formal do ACE · 0.3 listas provisórias P3–P7 · 0.4 aprovação deste documento · **0.5 nomear a Autoridade de Método sobre Regras de Derivação (§10.5)** · **0.6 versionar (commitar) os documentos da 2.0** |
| **Saída** | decisões registradas em ADR ou em documento canônico |
| **Dependências** | nenhuma |
| **Rollback** | não se aplica — nada muda no produto |
| **Estado híbrido** | não se aplica |
| **Evidência necessária** | nenhuma além da já produzida |
| **Valor independente** | alto: 0.1 e 0.2 valem por si, independentemente do resto da 2.0 |
| **Proibições** | nenhuma decisão sobre **valores** de regra (§10.5); nenhum código |

## Onda 1 — Corrigir defeitos e construir a base de auditabilidade

Nada aqui deriva nada em produção. **Explicabilidade e reconhecimento entram
aqui**, antes de qualquer proposta existir.

| Item | Conteúdo |
|---|---|
| **Entrada** | Onda 0 fechada; P15 com veredito; Autoridade nomeada |
| **Escopo — correções de defeito** | 1.1 guarda executável de participação no Motor (P15/RI8) · 1.2 assinatura do Curador (P7) · 1.3 abertura preservada na regeneração (P12) · 1.4 remoção da dependência falsa COMPAT→AVALIAÇÃO (P11) · 1.5 checkboxes derivados (P13) · 1.6 painel de prontidão (G6) · 1.7 retirada da segunda entrega e das superfícies mortas (P9/P20) |
| **Escopo — base de auditabilidade** | **1.8 Ficha de Explicação (§11), incluindo explicação de proposta** · **1.9 cadeia de proveniência ponta a ponta (§11.4)** · **1.10 reconhecimento em duas colunas (§6.2.1)** · **1.11 painel de discordância, vazio** · **1.12 mecanismo de discordância na Fronteira Humana** |
| **Escopo — código inerte** | **1.A** função pura de derivação do Mapa do Profissional: sem persistência, sem consumidor, sem superfície |
| **Saída** | os defeitos corrigidos; a infraestrutura de explicação e de discordância existindo e testada **antes** da primeira proposta |
| **Dependências** | 1.1 precede tudo que toque o Motor |
| **Rollback** | por item: cada correção é um commit revertível; 1.A é removível sem efeito (não tem chamador) |
| **Estado híbrido possível** | **sim** — o sistema opera exatamente como hoje, com defeitos a menos. Nenhuma derivação em uso |
| **Evidência necessária** | nenhuma de operação real: são defeitos e infraestrutura |
| **Valor independente** | **alto** — cada item vale sozinho, mesmo que a 2.0 nunca avance |
| **Proibições** | **nenhuma proposta persistida**; **nenhuma proposta apresentada a humano**; nenhuma alteração de escala, célula ou papel |
| **Critério de saída** | as dez dependências do §15.0 existem e são testadas; a paciente já lê o que o Motor concluiu; nenhum invariante do Motor é mais promessa sem guarda |

## Onda 2 — A virada do eixo (cada item exige ADR)

| Item | Conteúdo |
|---|---|
| **Entrada** | Onda 1 **integralmente verde**; ADRs aprovadas; Autoridade nomeada e ativa; **DP-1 respondido**. **Para o subescopo 2.5 e somente para ele: DP-5 decidido e incorporado por ADR válida — sem isso, 2.5 não entra na onda** |
| **Escopo** | 2.1 `derivation_proposals` append-only (**ADR-A**) · 2.2 ponte grau→importância, forma e governança, valores **provisórios**, com a reabertura de I-10 declarada (**ADR-A**, §10.3.0) · 2.3 divisão da etapa AVALIAÇÃO (**ADR-B**) · 2.4 `curator_judgments` sem `AREA` (**ADR-B**) · **2.5 regime de bloco — BLOQUEADO até DP-5 (§5.4.0); a onda pode fechar sem ele** · 2.6 governança de quem confirma o Mapa do Profissional (**ADR-D**, toca ADR-040 item 6) · **2.C** persistência e apresentação da derivação do Mapa do Profissional, **com confirmação item a item** |
| **Saída** | zero atos de transcrição; toda entrada do Motor com origem declarada |
| **Dependências** | **todas as dez** do §15.0 |
| **Rollback** | suspender a regra (§5.4 condição 7) devolve o sistema ao regime de declaração direta **sem perder dado**: as confirmações já feitas permanecem válidas, e as propostas param de nascer. **Este é o rollback mais importante do plano** |
| **Estado híbrido possível** | **sim, e é o modo esperado** — alguns conceitos derivados, outros declarados diretamente; Cases antigos no regime antigo |
| **Evidência necessária** | para a **forma**, nenhuma; para **fixar valores**, Cases reais (§10.5) |
| **Valor independente** | médio — depende da Onda 1 inteira |
| **Proibições** | **nenhum código de confirmação em bloco no repositório enquanto DP-5 estiver aberto — nem atrás de feature flag** (§5.4.0); filtros eliminatórios fora de qualquer derivação e de qualquer bloco (§5.5); nenhuma chave de ordenação (§4.6); nenhum valor de regra declarado estável |
| **Critério de saída** | painel de discordância produzindo dado; nenhuma proposta lida pelo Pipeline de Leitura (A2 verde); **AC-BLOCO verde** (§17.4) |

## Onda 3 — Um relógio, um instrumento (independente da Onda 2)

| Item | Conteúdo |
|---|---|
| **Entrada** | Onda 1 fechada |
| **Escopo** | 3.1 modelo único de progresso + projeções (R6/P4) · 3.2 responsável derivado por fato (§7.2) · 3.3 Protocolo Único da Pessoa (R4) · 3.4 instrumento único do profissional (R5) · 3.5 fonte única da decisão (R9) · **3.6 reescrita de `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md`** (P17/P18) |
| **Saída** | um relógio; um instrumento por lado; documentos canônicos descrevendo o produto vigente |
| **Dependências** | Onda 1. **Não depende da Onda 2** |
| **Rollback** | por item; 3.1 e 3.2 exigem manter a coluna antiga do funil em paralelo durante uma janela |
| **Estado híbrido possível** | sim — instrumentos antigos legíveis, novos em uso |
| **Evidência necessária** | nenhuma |
| **Valor independente** | **alto** |
| **Proibições** | nenhum dado histórico apagado; nenhum briefing antigo reinterpretado |

## Onda 4 — Refinamento (e **apenas** refinamento)

**Correção do B3.** A Onda 4 **não contém** a explicabilidade — ela nasceu na
Onda 1. Aqui há somente:

| Item | Conteúdo |
|---|---|
| **Entrada** | Ondas 1–3 fechadas |
| **Escopo** | linguagem das frases · visualização da Ficha · ergonomia da Fronteira Humana · experiência das superfícies |
| **Saída** | mesma informação, melhor apresentada |
| **Rollback** | trivial — camada de apresentação |
| **Proibições** | **não pode introduzir explicação nova, nem alterar o que a Ficha responde**; não pode introduzir agrupamento, cor ou destaque que produza ordenação indireta (§4.6) |

## Onda 5 — Calibração por operação real

| Item | Conteúdo |
|---|---|
| **Entrada** | **Rede real existente** e Cases reais concluídos. Sem isso, não começa |
| **Escopo** | fixar valores da ponte grau→importância · dimensionar o juízo relacional real · avaliar se o regime de bloco sobrevive ao P-10 · revisar a graduação por consequência |
| **Evidência necessária** | **Cases concretos** — é a única onda que exige, e é o §6 do Congelamento aplicado |
| **Proibições** | nenhuma decisão de calibração por hipótese |

## Dependências e sequenciamento

```
Onda 0 ──▶ Onda 1 ──┬──▶ Onda 2 ──▶ Onda 4 ──▶ Onda 5 (exige Rede real)
                     └──▶ Onda 3 (independente da Onda 2)
```

## ADRs necessárias

| ADR | Objeto | Estado |
|---|---|---|
| **ADR-A** | Camada de derivação: `derivation_proposals`, Fronteira Humana, ponte grau→importância (**forma e governança**), graduação por consequência, regime excepcional de bloco, e os princípios **P-07, P-08, P-10** | necessária para a Onda 2 |
| **ADR-B** | Divisão da etapa AVALIAÇÃO, `curator_judgments`, princípio **P-11**. **Deve atualizar, no mesmo ato, o `MODELO_CURADORIA_V1.md`: §7.1, §7.2, §7.3, §7.4, §11 e todo trecho afetado** (RS-11) | necessária para a Onda 2 |
| ~~**ADR-C**~~ | ~~Chave de ordenação interna de leitura~~ | **RETIRADA DO CAMINHO (B2).** Registrada como **decisão futura bloqueada por ausência de necessidade operacional real** — o §6 do Congelamento exige Case concreto, e a ordem neutra da Rede não causa dano demonstrado. Reabre-se, se algum dia, pela Onda 5 |
| **ADR-D** | Governança da confirmação do Mapa do Profissional (toca ADR-040 item 6 e a RLS congelada) | necessária para a Onda 2 |
| **ADR-E** | Destino formal do ACE e do dado histórico | necessária para a Onda 0/1 |

### A dívida documental da ADR-B — ressalva RS-11 · **QUITADA (A-01)**

O `MODELO_CURADORIA_V1.md` carregava a dívida P17: o §7 descrevia "Avaliação
Técnica (0–100)" que a ADR-042 removera em 2026-07-28, e só o §11 registrava a
supersessão. **O pacote A-01 executou a reescrita integral** no mesmo ato da
lavratura da ADR-067. O Modelo passou a **v3.0**.

| Trecho do Modelo | O que mudou | Estado |
|---|---|---|
| **§7.1** Cruzamento Técnico | saída "(0–100)" removida; descreve o **juízo declarado** do Curador, com o critério de irredutibilidade | ✅ |
| **§7.2** Cruzamento Assistencial | "(0–100)" removido; descreve a **leitura por conceito**, quatro resultados, sem total | ✅ |
| **§7.3** Escala de avaliação | reescrito como **duas escalas declaradamente distintas** — (a) quatro estados do juízo humano, **sem percentual de peso**; (b) quatro resultados do Motor. Nunca se somam, nunca se convertem | ✅ |
| **§7.4** Cobertura | reescrito como **inventário de lacunas** com as cinco naturezas; sem percentual, sem 100 pontos | ✅ |
| **§11** Estado da implementação | oito linhas novas: P17 quitado, divisão da AVALIAÇÃO, juízo, derivação, ponte, autoridade, verbos, ordenação | ✅ |
| **demais trechos afetados** | §2 (coluna "Pontuação" → "Saída"), §4 e §6 (orçamentos de 100), §8.1 (as duas saídas 0–100), §8.2 ("nunca escolhe baseado apenas nos números"), §8.3 ("relação com os pesos") | ✅ |
| **§10.1** *(além do prescrito)* | **verbos canônicos do domínio** — fonte única, instituída pelo A-01 | ✅ |

**Regra, agora cumprida:** nenhuma ADR da 2.0 pode deixar o corpo normativo do
Modelo contradizendo a decisão registrada. Decisão em ADR com corpo
desatualizado é como invariante sem guarda — promessa, não garantia.

## Pré-condições técnicas herdadas (fora do escopo, bloqueantes)

Existência da Rede real · commit do Bloco E (fonte única do catálogo) · janela
autorizada para DDL em produção · **árvore limpa e documentos versionados**
(§0.4) · **separação estrita do pacote de segurança em curso**.

---

# 16. Riscos da migração **[IMPLANTAÇÃO]**

| # | Risco | Sev. | Por quê | Mitigação |
|---|---|---|---|---|
| **R-01** | **A proposta vira decisão automática disfarçada.** O registro dirá "o humano confirmou" quando ninguém leu. | **Alta — permanece o risco dominante** | é o modo de falha mais provável de toda a 2.0, e o mais difícil de detectar depois | **v1.1:** bloco reclassificado como excepcional com 12 condições (§5.4); graduação por consequência; amostragem obrigatória; painel de discordância nascendo com a primeira regra; P-10 como contrato testado. **Risco residual: continua alto** — nenhuma dessas medidas prova leitura, apenas encarece o carimbo |
| **R-02** | **A tabela grau→importância fixa uma tradução errada.** Uma correspondência ruim erra em **todos** os Cases de uma vez, silenciosamente. | **Alta** | hoje o erro é individual e visível ao Curador; derivado, ele é sistêmico e invisível | versão obrigatória na proposta; taxa de discordância por conceito; regra de que discordância alta corrige a **tabela**, não o Curador; Onda 5 antes de considerar a tabela estável |
| **R-03** | **Perda de conhecimento tácito do Curador.** O que ele fazia "sem saber que fazia" ao traduzir pode não caber em tabela. | **Alta** | o Método vive nesse juízo | a discordância é **dado**, não exceção: cada recusa registra o valor final e permite ler o que a tabela não captura |
| **R-04** | **Viabilidade vazando para o Motor** (P15) durante a transição | **Alta se confirmado** | invariante congelado sem guarda executável | guarda em 1.1, **antes** de qualquer derivação (Onda 1 precede Onda 2 por este motivo) |
| **R-05** | **Dados legados sem proveniência.** Cases já rodados têm Mapas digitados sem origem. | Média | a promessa "toda entrada tem origem" nasceria falsa | origem explícita `DIGITACAO_ANTERIOR_A_2_0`; **nunca** inventar proveniência retroativa (a ADR-039 já decidiu: mapeamento inventado é pior que não migrar) |
| **R-06** | **Case aberto no meio da virada.** | Média | ninguém pode perder ou ganhar conceito no meio do caminho (§7.6 da Governança) | Case aberto termina no regime em que nasceu; a 2.0 vale para Cases novos e supersessões |
| **R-07** | **Perfil já reconhecido.** Reconhecimento é irreversível (ADR-049); a tela nova mostra mais do que a antiga. | Média | mudança de catálogo não reabre reconhecimento | Perfis antigos permanecem válidos e são exibidos no formato da época; a tela de duas colunas entra pelos Perfis novos |
| **R-08** | **A carga do Curador não cai — pode até subir.** Com o bloco restrito a exceção (§5.4), a 2.0 troca digitação rápida por confirmação informada, que é mais lenta por item. | **Média, e assumida** | a métrica correta é a natureza do ato, não a contagem (§3.6) | nenhuma mitigação que reintroduza o bloco como padrão. Se a carga inviabilizar a operação, a resposta é **reduzir escopo de derivação**, nunca baratear a confirmação |
| **R-09** | **Sobrecarga do Curador com um trabalho novo.** Juízo relacional (ADR-065) é trabalho que hoje não existe. | Média | trocar 30 digitações por 18 juízos difíceis pode não aliviar ninguém | medir tempo por natureza de ato, não contagem; se o juízo relacional se mostrar caro demais, a resposta é reduzir escopo de conceitos `humano` **por ADR**, nunca automatizá-los |
| **R-10** | **Nada disto foi observado em operação real.** | **Bloqueante para a Onda 5** | zero profissionais reais publicados | Ondas 0–4 são estruturais e seguras sem Rede; **nenhuma calibração de valores** antes de Cases reais |
| **R-11** | **Documentos canônicos descrevendo o produto anterior** (P17, P18) | Média | quem ler `PRODUCT_ARCHITECTURE.md` como estado atual construirá sobre mapa vencido | reescrita como item explícito da Onda 3, não como "quando sobrar tempo" |
| **R-12** | **A 2.0 ser lida como automação da Curadoria.** | **Alta, reputacional** | "eixo no Motor" era frase que se interpretava mal por fora — corrigida para **"eixo em quem declara"** (RS-10) | linguagem fechada: o Motor **lê**; o Curador **decide**; nenhuma superfície, documento de venda ou texto à paciente pode dizer o contrário |

## 16.1 Riscos residuais da própria v1.1

| # | Risco residual | Sev. | Por quê permanece |
|---|---|---|---|
| **RR-1** | **A Fronteira Humana pode ser contornada em implementação.** Ela é estrutura no documento; no código, seria um contrato entre módulos que alguém pode furar com um import. | **Média — rebaixada pela C-5** | a v1.1 confiava só no critério A2 e numa *recomendação*. A v1.2 eleva a separação física a **critério de aceite bloqueante (AC-PIPELINE, §17.4)**, verificável por análise estrutural de dependências. Residual: o teste precisa existir e ser mantido bloqueante em CI |
| **RR-2** | **A graduação por consequência ainda não existe** (DP-5) | **Alta, mas contida** | sem ela a condição 4 não é aplicável. **Mitigação estrutural (C-4):** o regime de bloco está **formalmente proibido** — não pode ser implementado, ativado, testado como aceite, nem mantido atrás de flag — até DP-5 ser decidido por ADR (§5.4.0). O risco deixa de ser "bloco mal calibrado" e passa a ser "carga alta com confirmação item a item", que é o risco R-08, aceito |
| **RR-3** | **A Autoridade de Método é uma função sem ocupante.** O §10.5 a define; nomeá-la é ato do Fundador | **Alta** | regra sem dono é o que o B5 apontou. A v1.1 corrige o desenho, não a lacuna organizacional |
| **RR-4** | **A pendência de ordenação (§11 do Modelo) fica aberta por tempo indeterminado.** | Média | é a decisão certa (B2), mas significa que a Mesa continua apresentando em ordem arbitrária quando a Rede crescer. O custo é real e está aceito |
| **RR-5** | **O parecer do Guardião não está versionado.** As matrizes do §0.2 e §0.3 são reconstrução | Média | risco de a correção ter endereçado uma enumeração diferente da real |
| **RR-6** | **Os documentos da 2.0 não estão commitados.** Auditoria, arquitetura, inventário e plano de pacotes vivem em árvore suja, com sessões paralelas escrevendo | **Alta, de processo** | decidir constitucionalmente sobre texto não versionado é decidir sobre algo que pode mudar sem registro (§0.4) |

---

# 17. Critérios de aceite para implementação **[IMPLEMENTAÇÃO]**

Cada critério é **verificável** — por teste, por consulta ou por reconstrução
documental. Nenhum depende de opinião.

## 17.1 De arquitetura

| # | Critério | Como se verifica |
|---|---|---|
| A1 | Toda entrada do Motor tem origem declarada e rastreável | consulta: zero linhas em `case_priority_map` / `professional_subcriterion_map` sem proposta ou declaração de origem correspondente (exceto legado marcado) |
| A2 | **Proposta não é entrada válida para o Pipeline de Leitura** | teste: LE1 recusa qualquer valor cuja origem seja `derivation_proposals` em estado `PROPOSTA`; **e** teste estrutural de que nenhum módulo do Pipeline de Leitura importa o Pipeline de Derivação |
| A2b | Os dois pipelines não se chamam | teste estrutural: DR5 não tem chamador em LE*; DR* não escreve nos Mapas |
| A2c | A Fronteira Humana exibe os nove elementos do §2.4 | teste de componente |
| A2d | Ausência de ato humano nunca produz confirmação | teste de integração: decurso de prazo, navegação e fim de sessão deixam o desfecho em `PROPOSTA` |
| A3 | Toda proposta declara origem, regra e versão | CHECK de proveniência, no padrão já usado em área e registro |
| A4 | Conceito `MOTOR_PARTICIPATION: NUNCA` nunca aparece em cruzamento | teste de guarda — resolve P15/RI8 |
| A5 | Resultado de Motor nunca é persistido | teste: ausência de coluna de resultado |
| A6 | As quatro leituras nunca se somam | teste: ausência de campo agregado (mesmo padrão do teste que hoje pina a ausência de `total`) |
| A7 | 28 conceitos, 15 células, 4 resultados, 5 níveis, 3 estados inalterados | guardas de contagem já existentes, mantidas verdes |

## 17.2 De experiência da paciente

| # | Critério | Como se verifica |
|---|---|---|
| X1 | As cinco dimensões derivam do Motor | teste: com `criterion_declarations` vazia e Motor completo, ela lê conteúdo — não "ainda precisamos confirmar" |
| X2 | O Perfil mostra o que ela declarou, ao lado da tradução | teste de componente: as duas colunas presentes |
| X3 | O Relatório chega assinado | teste: `curatorName` nunca `null` em Case entregue |
| X4 | Um só formato de entrega | teste: a página nunca renderiza dois documentos |
| X5 | Nenhum termo de ranking, score ou posição alcança superfície dela | `PATIENT_FORBIDDEN_TERMS`, estendido à Ficha |
| X6 | Nenhuma etapa da jornada sem destino | teste de navegação |

## 17.3 De operação

| # | Critério | Como se verifica |
|---|---|---|
| O1 | Zero atos de transcrição no fluxo do Curador | inspeção do fluxo: nenhum campo pede digitação de dado já declarado |
| O2 | Discordar custa o mesmo que concordar | teste de componente: mesmo número de interações para confirmar e para recusar |
| O3 | O Curador sabe o que falta antes de tentar emitir | teste: painel de prontidão precede a guarda de emissão |
| O4 | Um relógio; cinco projeções derivadas | teste: nenhuma projeção é escrita diretamente |
| O5 | Trabalho humano nunca é sobrescrito sem aviso | teste: regenerar rascunho preserva a abertura (P12) |
| O6 | Taxa de discordância observável por conceito e por versão de regra | painel existe **desde a primeira regra** e é consultado |
| O7 | Filtro eliminatório nunca é derivado nem confirmado em bloco | teste: `priority_profile_filters` só aceita escrita com autoria humana por item |
| O8 | Toda regra de derivação tem os dez atributos do §10.5 | CHECK; regra incompleta não propõe |
| O9 | Suspender uma regra interrompe propostas sem invalidar confirmações feitas | teste de integração |
| O10 | Supersessão da origem marca confirmações e juízos como superados, sem apagar | teste de integração (§10.6) |
| O11 | Nenhuma confirmação vigente aponta para origem retratada | consulta de invariante, executável periodicamente |

## 17.4 Critérios de aceite **bloqueantes** — correção C-5

Diferem dos demais em uma coisa: **vermelho aqui interrompe a entrega**, não gera
ressalva. São dois, mais o de bloqueio de regime.

### AC-EXPLICA — Explicabilidade obrigatória

> **Nenhuma proposta, derivação ou leitura pode ser renderizada, entregue ou
> consumida por uma superfície humana sem a correspondente explicação
> reproduzível.**

Comportamento esperado, verificável conceitualmente (o teste é escrito na
implementação; aqui se define o que ele prova):

| # | Situação | Comportamento exigido |
|---|---|---|
| 1 | **Ficha de Explicação ausente** | **bloqueia a renderização** — a superfície não mostra o item |
| 2 | **Origem ausente** | bloqueia a renderização |
| 3 | **Regra ausente** | bloqueia a renderização |
| 4 | **Versão da regra ausente** | bloqueia a renderização |
| 5 | **Declaração original ausente** | bloqueia a renderização |
| 6 | **Fallback genérico** | **proibido** — nenhum texto de reserva ("informação indisponível", "gerado pelo sistema", string vazia, traço) pode ocupar o lugar da explicação. Erro é erro; não vira explicação |
| 7 | **Superfície do Curador** | **não contorna o bloqueio** — a Mesa não mostra o que não pode explicar |
| 8 | **Superfície da paciente** | **não contorna o bloqueio** — a carta não mostra o que não pode explicar |

**O que "bloqueia" significa:** o item não aparece, e a superfície declara que há
um item não exibível por falta de explicação. **Não** significa esconder em
silêncio — silêncio é indistinguível de "não existe", e a 2.0 proíbe essa
confusão desde o P-04.

**Este critério torna verificável o invariante do §11.0.**

### AC-PIPELINE — Separação física entre os pipelines

Eleva a recomendação de RR-1 a **critério bloqueante**: a separação deixa de ser
convenção e passa a ser propriedade estrutural.

| # | Regra | Verificação |
|---|---|---|
| 1 | **Módulo do Pipeline de Derivação não importa módulo do Pipeline de Leitura** | teste estrutural de dependências |
| 2 | **Módulo do Pipeline de Leitura não importa a persistência de propostas como fonte de entrada** | teste estrutural |
| 3 | **Não existe função compartilhada que faça a passagem automática** entre os dois | teste estrutural + revisão de contrato |
| 4 | **Proposta não vira declaração por importação, chamada indireta, evento ou efeito colateral** | teste de integração: nenhum caminho produz linha em Mapa sem ato humano registrado |
| 5 | **O teste falha diante de dependência proibida** — não avisa, falha | o teste é bloqueante em CI |
| 6 | **Convenção textual não é suficiente** | comentário, nome de pasta ou regra em documento não satisfazem este critério |
| 7 | **A separação é verificável estruturalmente** | por análise do grafo de dependências, não por leitura humana |

**Distinção obrigatória — o que é permitido e o que não é:**

| Permitido — compartilhamento legítimo | Proibido — dependência de execução ou de dado autoritativo |
|---|---|
| **tipos** e **contratos imutáveis** (formato de conceito, código do catálogo, enum de estado) | **importar função** do outro pipeline |
| **constantes de domínio** (os 28 códigos, os 4 resultados) | **ler a persistência de propostas** como entrada de leitura |
| **utilitários puros sem estado** (formatação, comparação de versão) | **evento ou callback** que empurre proposta para dentro da leitura |
| | **efeito colateral** que grave em Mapa a partir do fluxo de derivação |

A régua: **compartilhar o vocabulário é legítimo; compartilhar o caminho da
execução ou a fonte do valor autoritativo, não.**

### AC-BLOCO — Ausência do regime de confirmação em bloco

Enquanto DP-5 estiver aberto (§5.4.0):

| # | Verificação |
|---|---|
| 1 | **Nenhum mecanismo de confirmação em bloco existe no repositório** — nem inativo, nem atrás de feature flag |
| 2 | Toda confirmação registrada tem **ato humano por item** |
| 3 | Nenhum teste de aceite do regime de bloco existe ou passa — a ausência do teste **é** o aceite |
| 4 | `priority_profile_filters` nunca aceita escrita em lote |

## 17.5 De Método — as quatro perguntas finais

| # | Pergunta | Aceite |
|---|---|---|
| M1 | Alguma das treze decisões humanas foi tocada? | **Não**, verificável item a item |
| M2 | Alguma das oito garantias do Congelamento foi enfraquecida? | **Não** — e duas (proveniência, ausência de conclusão automática) foram **reforçadas** |
| M3 | Dada qualquer frase entregue a uma paciente, é possível reconstruir a árvore do §11.4 sem que ninguém precise lembrar de nada? | **Sim** — é o critério de sucesso final |
| M4 | Um auditor externo, lendo só o banco e os documentos, chega às mesmas conclusões que o Curador chegou? | **Sim** — é o que P-01 significa na prática |

## 17.6 Condição de bloqueio

**Nenhuma onda posterior à 1 começa se qualquer critério da onda anterior estiver
vermelho.** E a Onda 5 não começa sem Rede real — calibrar por hipótese é
exatamente o que o §6 do Congelamento proíbe.

**Os três critérios do §17.4 são bloqueantes em outro sentido:** vermelho neles
interrompe a **entrega**, não apenas a onda seguinte. Uma superfície que renderiza
sem explicação, um pipeline que importa o outro, ou um mecanismo de bloco
existindo antes de DP-5 — qualquer um dos três impede publicar, independentemente
do estado do resto.

---

# 18. Decisões humanas ainda pendentes **[GOVERNANÇA]**

Nenhuma delas é do Agente 02. Todas bloqueiam algo nomeado.

| # | Decisão | De quem | Bloqueia |
|---|---|---|---|
| **DP-1** | **P15** — o Motor recebe viabilidade? Se sim: guarda executável ou correção do Congelamento §4.3 | Arquiteto + Guardião | Onda 1.1, e portanto tudo |
| **DP-2** | **Destino formal do ACE** e do dado histórico | Fundador | retirada da segunda entrega (P9) |
| **DP-3** | **Listas provisórias P3–P7** (`OPCOES_PROVISORIAS_*`) | Método | a ponte grau→importância |
| **DP-4** | **Quem exerce a Autoridade de Método sobre Regras de Derivação** (§10.5). **A função foi instituída** (2026-08-04); falta o ocupante | **Fundador** | toda a Onda 2 |
| **DP-5** | **A régua de graduação por consequência** — **estrutura aprovada (2026-08-04); valores pendentes de Rede Real.** Falta a lista nominal dos itens que nunca entram em bloco | Método, **por ADR** | **pré-condição formal do subescopo 2.5 da Onda 2.** Enquanto aberta, o regime de bloco está **proibido de existir no repositório** (§5.4.0, AC-BLOCO) |
| **DP-6** | **A tabela grau→importância** — os valores, não a forma | Método, **após Cases reais** | a estabilização da regra (Onda 5) |
| ~~**DP-7**~~ | ~~Os princípios P-07, P-08, P-10 viram domínio?~~ | — | **RESPONDIDA (2026-08-04): sim.** Promovidos a princípios oficiais de domínio, lavrados na **ADR-066** e registrados no Congelamento §5.2. **P-11** segue na ADR-067 |
| **DP-8** | **P-12 (um relógio) é aprovado como princípio arquitetural?** | Guardião, sem ADR | Onda 3 |
| ~~**DP-9**~~ | ~~Ampliar quem confirma o Mapa do Profissional~~ | — | **RESPONDIDA (2026-08-04): não ampliar.** A **ADR-068 §14.2** examinou e recusou; a RLS da ADR-040 item 6 permanece intacta. G4 resolve-se pela redução do ato, não pela ampliação do recorte |
| **DP-10** | **Versionar os documentos da 2.0 e separar o pacote de segurança** | responsável de engenharia | qualquer decisão constitucional definitiva (§0.4) |
| **DP-11** | **Gravar o parecer do Guardião como arquivo** | Agente 00 | a validação das matrizes §0.2/§0.3 |

---

# Apêndice — Organização documental **[GOVERNANÇA]**

**Correção da ressalva RS-09.** A v1.0 propunha criar **dez documentos canônicos
novos**. É excesso: multiplicar canônicos multiplica pontos de divergência, e o
projeto já carrega a dívida de dois documentos canônicos descrevendo produto
anterior (P17/P18). Criar dez mais é agravar o problema que a 2.0 quer resolver.

**A 2.0 organiza-se em dois níveis, não em dez documentos.**

## Nível canônico — muda por ADR ou por aprovação do Guardião

| Conteúdo | Onde vive |
|---|---|
| **Princípios de domínio** (§1) | no `MODELO_CURADORIA_V1.md`, como emenda, quando as ADRs os aprovarem |
| **Arquitetura** (§2, §9 estrutura, §10, §11) | **este documento**, quando aprovado |
| **Governança essencial** (§10.5 autoridade da regra, §10.6 supersessão) | **este documento** + as ADRs |
| **ADRs aprovadas** | `docs/DECISIONS.md`, como sempre |

## Nível derivado — muda sem ADR

Modelo físico · campos de tabelas · mockups · especificações de tela · plano de
implantação · ondas · riscos · critérios transitórios. Vivem **onde a
implementação precisar**, e **não** são canônicos.

## Classificação das seções deste documento

| Nível | Seções |
|---|---|
| **DOMÍNIO** | Tese · §1 · §3 · §4 · §5.5 · §10 |
| **ARQUITETURA** | §2 · §9 · §11 |
| **GOVERNANÇA** | §0 · §10.5 · §10.6 · §18 · Apêndice |
| **OPERAÇÃO** | §5 · §6 · §7 · §8 · §14 |
| **INTERFACE** | §6.2.1 · §12 · §13 |
| **IMPLEMENTAÇÃO** | §17 |
| **IMPLANTAÇÃO** | §15 · §16 |

**Somente DOMÍNIO, ARQUITETURA e GOVERNANÇA são candidatos a canônicos.** As
demais são derivadas e podem ser revistas por missão comum.

## Destino dos documentos atuais (nenhum apagado — §7.3 da Governança)

| Documento | Destino |
|---|---|
| `MODELO_CURADORIA_V1.md` v2.0 | **permanece o canônico do domínio**; a 2.0 é subordinada a ele. §7.1–§7.4 e §11 são atualizados **pela ADR-B**, não por este documento |
| `CONGELAMENTO_ARQUITETURAL.md` | **permanece**; é o que a 2.0 promete não violar |
| `DOMINIO_COMPATIBILIDADE_RELACIONAL.md` | **permanece**; é o precedente que a 2.0 generaliza |
| `CATALOGO_CANONICO_*.md` | **permanecem** como fonte do catálogo |
| `AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md` | **permanece** como diagnóstico datado |
| `INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md` | **permanece** como estado datado da Etapa 1 |
| `PLANO_DE_PACOTES_CURADORIA_2_0.md` | **permanece**; seu impedimento §1.6 é respondido pelo §18 deste documento |
| **Este documento** | candidato a canônico nas seções DOMÍNIO/ARQUITETURA/GOVERNANÇA; as demais permanecem derivadas |

---

*Fim da arquitetura revisada (v1.1). **Nenhuma seção deste documento autoriza
alteração de código.** Nenhum código, migration, banco, API, componente ou teste
foi criado ou alterado. A Onda 0 é integralmente de decisão; a Onda 1 exige
missão própria por item; as Ondas 2 em diante exigem, cada uma, a ADR nominada
no §15, referenciando o `MODELO_CURADORIA_V1.md` e ajustando a tabela do seu §11.
**O Agente 03 (Implementador) não está autorizado.** Próximo destino: Agente 00 —
Guardião, para nova revisão constitucional.*
