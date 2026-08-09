# Pré-flight de Materialização da Regra 001 — os três gates

| Campo | Valor |
|---|---|
| **Versão** | **v2.0** — Gate B fechado; Gate C desdobrado em C1/C2; inventário 91→113 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Base** | `c40b896` (v1.0 lavrada em `368fe99`) |
| **Regra** | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`, versão 1 |
| **Status** | ⚠️ **SUPERADO PELOS FATOS (2026-08-08)** — os quatro gates fecharam: **D-13 comprovada** por backup lógico com restauração ensaiada · deploy feito (produção em **114**) · **Regra 001 nascida em `PROPOSTA`** (`f1a7060`) · **ADR-070 APROVADA E LAVRADA**. Mantido como **registro histórico do rito**; o pacote vigente da promoção vive em [`ADR_070_APROVACAO_DA_REGRA_001.md`](ADR_070_APROVACAO_DA_REGRA_001.md) §10 |
| **Natureza** | governança documental. **Zero código, zero migration, zero deploy, zero inserção, zero promoção** |

> **A semântica da Regra 001 não é objeto desta missão e não foi tocada.** A
> ficha v2.0 permanece a autoridade material.

---

## 1. Os gates, agora em quatro

| Gate | Objeto | Resultado |
|---|---|---|
| **A — Autoridade documental** | `approval_adr` | 🟢 **VERDE** — **ADR-070** lavrada |
| **B — Identidade técnica** | `approved_by` / `actor_id` | 🟢 **VERDE** — comprovada pelo Agente 01, ratificada pelo DT-01, lavrada em 2026-08-08 |
| **C1 — Schema no ambiente alvo** | tabelas existirem onde o ato ocorrerá | 🔴 **VERMELHO em produção** · 🟢 verde em dev/local |
| **C2 — Caminho de materialização** | como escrever a primeira regra | 🟡 **AMARELO** — o mecanismo existe e é legítimo (**migration**, ato administrativo controlado); depende de C1 e de uma escolha menor do DT-01 (§6.3) |

**Promoção apta somente com A + B + C1 + C2 verdes.**

> **O desdobramento do Gate C não é formalidade.** A v1.0 dizia "falta writer".
> Está mais claro agora: **o writer legítimo existe** (a migration, ato
> administrativo do regime), e o que falta é **o schema no ambiente onde o ato
> vale** — problema de natureza inteiramente diferente, e que não se resolve
> criando writer nenhum.

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

## 3. GATE B — 🟢 **VERDE** (lavrado em 2026-08-08)

| Campo | Valor |
|---|---|
| **Identidade normativa** | `DT-01 — Fundador / Autoridade de Método` (DP-4, 2026-08-05) |
| **Identidade técnica** | **`54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b`** |
| **Conta humana** | `barbosacaiopadilha@gmail.com` |
| **Fonte da comprovação** | `auth.users` do projeto **`aliviar-2-prod`** |
| **Verificador técnico** | **Agente 01 — Implementador / Responsável de Engenharia** |
| **Data** | **2026-08-08** · ratificado pelo DT-01 no mesmo ato |
| **Documento que registra** | [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) §1.1 |

Conta comprovadamente **humana · pessoal · ativa · e-mail confirmado · anterior
a esta missão**, e comprovadamente **não** fixture, service account, conta
técnica compartilhada, conta de Curador, conta do Concierge, nem conta criada
para satisfazer constraint. Compatível com as três colunas (`proposed_by`,
`approved_by`, `actor_id`) — **nenhuma tem FK que o impeça**.

> **UUID ≠ autoridade.** O identificador prova **quem é a pessoa**. A autoridade
> segue derivando **só** da governança que constituiu o papel (DP-4). O vínculo
> é **pessoa técnica comprovada + papel normativo já lavrado** — e as quatro
> proibições do §1.1 (nada de `service_role` como autoridade humana, conta
> técnica sem vínculo, delegação informal, aprovação pelo Implementador)
> permanecem integralmente em vigor.

**Nenhuma tabela de mapeamento criada** — nenhuma autoridade vigente a exige.
**Nenhum segredo publicado.**

### 3.0 Histórico — por que este gate esteve vermelho

*(Preservado: a pendência foi real, foi registrada pelo próprio ato de nomeação
de 2026-08-05, e o pré-flight v1.0 mediu que ela bloqueava até o nascimento.)*

### 3.1 A autoridade normativa existe

`REGISTRO_DE_GOVERNANCA.md` §1.1 — **DP-4 fechada em 2026-08-05**: ocupante
**`DT-01 — Fundador`**, situação **ATIVA**, acumulação temporária, escopo Regras
de Derivação da Curadoria 2.0. Autoridade conferida: *aprovar regra · promover
para `VIGENTE` · suspender · reativar · revogar*.

### 3.2 *(histórico)* A identidade técnica não existia — registrado pelo próprio ato de nomeação

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

### 3.5 Ato mínimo — **EXECUTADO em 2026-08-08**

Os três passos previstos foram cumpridos exatamente como especificados: o DT-01
designou a conta, o **Agente 01** verificou-a em `auth.users` de produção, e o
Agente 02 lavra aqui e no §1.1 do Registro. **Nenhuma migration, nenhum código.**

### 3.6 A escolha menor que resta — quem **propõe**

O comentário de `derivation_rules.proposed_by` é explícito: *"São pessoas
diferentes por desenho — **propor é de qualquer papel interno; aprovar é da
Autoridade**."*

| Opção | Efeito |
|---|---|
| **outro humano interno** propõe | preserva o desenho; exige **um segundo vínculo técnico** lavrado (hoje inexistente) |
| **DT-01** propõe **e** aprova | tecnicamente permitido (sem FK, sem constraint que o impeça) e normativamente admissível — **mas aprofunda a acumulação** já declarada em ADR-068 item 6 / RA-1 do PA-2 |

**Recomendação:** se hoje não existe segundo vínculo lavrado — e não existe —, o
DT-01 pode propor, **com uma condição**: a acumulação deve ser **nomeada no
`reason` da transição de nascimento**. É a aplicação literal do §1.1: *"a
acumulação é declarada, não silenciosa — e é essa declaração que impede que ela
vire o normal."* **Não inventar segunda identidade** só para satisfazer o
desenho.

---

## 3B. GATE C1 — o schema **não existe em produção**

### 3B.1 O descompasso, e a corroboração independente

| Ambiente | Ledger | Última migration |
|---|---|---|
| **produção** (`aliviar-2-prod`) | **91** | `20260803150000` |
| **dev / local** | **113** | `20260808270000` |

**Faltam exatamente 22.** O repositório **corrobora a medição do Agente 01 por
fonte independente**: o `PLANO_OFICIAL_DE_LANCAMENTO_1_0.md` §152 registra que
*"as migrations já foram aplicadas. Em 2026-08-03 às 22:10:08Z, **pela
integração Supabase↔GitHub, disparada pelo push do merge**. Produção está em
`91 / 20260803150000`, com equivalência estrutural provada."* **Os dois números
batem.**

**Consequência direta:** `curadoria.derivation_rules` (migration nº 7 da lista)
e `curadoria.derivation_rule_transitions` (nº 9) **não existem em produção**. É
**impossível** materializar a Regra 001 lá hoje — não por falta de autorização,
mas por falta de tabela.

### 3B.2 Isto **não** é detalhe de deploy — classificação arquitetural

O descompasso 91→113 é **dívida de publicação de um arco inteiro de trabalho
certificado**, não deriva acidental. Três fatos vigentes o classificam:

1. **A publicação é all-or-nothing.** `PLANO_OFICIAL_DE_LANCAMENTO_1_0.md` §349:
   *"enquanto a integração Supabase↔GitHub estiver ativa, **parar de mergear
   `.sql` em `main` é a única forma** [de conter alterações de schema] — ou
   desligá-la. **Não existe congelamento parcial.**"*
2. **A contenção foi deliberada.** `INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md` §88
   registra o branch `g0-1-regime-de-instrumentos` com **PR deliberadamente não
   aberto**, *"aguarda janela autorizada"*, pela mesma razão. O descompasso é
   **efeito de uma decisão de segurança**, não de esquecimento.
3. **A pré-condição do deploy é uma decisão do Fundador que segue aberta.** A
   `AUDITORIA_09_PRODUCAO` fixa a **"Ordem segura (não executada)"** com o passo
   **1 = backup ampliado e PITR confirmado**, e registra que a documentação
   **se contradiz** sobre a existência de backup (*"plano free — sem PITR"* ×
   *"o Supabase mantém PITR"* × *"NÃO VERIFICADO"*). Na consolidação NO-GO isso
   é a decisão **D-13 — nível mínimo de backup + RTO/RPO**, dona: **Fundador**,
   prazo: **antes de produção**. **Continua aberta.**

> **Achado que muda o destinatário:** o GATE C1 **não está bloqueado por
> engenharia**. Está bloqueado por **D-13**, uma decisão que o DT-01 já devia
> desde a Auditoria Geral. Engenharia executa depois; não pode decidir antes.

### 3B.3 Inventário das 22 — uma a uma

Legenda: **E** = estrutura · **D** = contém **DML de topo** (dado material
aplicado pela própria migration).

| # | Migration | Commit | Pacote / item de origem | Governança | Tipo |
|---|---|---|---|---|---|
| 92 | `20260803170000_menor_privilegio_nas_funcoes_de_governanca` | `912db46` | endurecimento de segurança (menor privilégio) | encerrado | E |
| 93 | `20260804120000_autoria_nos_dois_mapas` | `89c4225` | **PP-02** — proveniência/autoria nos dois Mapas | encerrado | E |
| 94 | `20260804160000_paciente_registra_o_proprio_desfecho` | `cc82e0f` | **PP-03A** — caminho autorizado de escrita da paciente | encerrado | E |
| 95 | `20260804170000_desfecho_da_paciente_grants_hardening` | `56793ea` | **PP-03B** — ACL efetiva, guarda real, `SUPERSEDED` | encerrado | E |
| 96 | `20260805090000_estrutura_inerte_da_camada_de_derivacao` | `1ed29f8` | **Item 2.1** | **FORMALMENTE ENCERRADO** | E |
| 97 | `20260805140000_dp3_listas_p3_a_p7_no_catalogo` | `94caeec` | **DP-3** — listas P3..P7 no Catálogo | **DP-3 resolvida** | **D** |
| 98 | `20260805170000_infraestrutura_da_regra_de_derivacao` | `30c6809` | **Item 2.2A** | **ENCERRADO** | E |
| 99 | `20260805200000_endurecimento_da_regra_de_derivacao` | `7770d7f` | **Item 2.2A-MR1** | **ENCERRADO** | E |
| 100 | `20260806100000_ciclo_de_vida_da_regra_de_derivacao` | `1a7ef86` | **Item 2.2B** (ADR-069) | **ENCERRADO com ressalvas registradas** | E |
| 101 | `20260806140000_menor_privilegio_nas_leituras_do_ciclo_de_vida` | `72e0a2b` | **Item 2.2B-R1** | **ENCERRADO** | E |
| 102 | `20260806180000_ponte_grau_importancia` | `b38cd34` | **Item 2.2C** (ADR-066) | **ENCERRADO** | E |
| 103 | `20260806220000_participacao_do_motor_e_unicidade_por_conceito` | `36dde31` | **Item 2.2C-R1** (+ fecha o **1.1**) | **ENCERRADO** | **D** |
| 104 | `20260807120000_vinculo_de_evidencia_no_mapa_do_profissional` | `041b423` | **Item 1.8-R1** — migration expressamente autorizada pelo Contrato | **ENCERRADO** (12/12) | E |
| 105 | `20260807150000_leitor_controlado_de_propostas` | `041b423` | **Item 1.8-R1** | **ENCERRADO** | E |
| 106 | `20260807190000_reapresentacao_estrita_do_vinculo` | `095054e` | **Item 1.8-R1-MR1** | **ENCERRADO sem ressalvas** | E |
| 107 | `20260808100000_leitor_agregado_de_propostas` | `4928af6` | **Item 1.11** (+ MR1) | **FORMALMENTE ENCERRADO** | E |
| 108 | `20260808150000_mecanismo_de_discordancia` | `cdf485d` | **Item 1.12** (PA-12) | **FORMALMENTE ENCERRADO** | E |
| 109 | `20260808190000_1_12_mr1_cerca_total_do_estado_decisorio` | `2c52832` | **Item 1.12-MR1** | **ENCERRADO** | E |
| 110 | `20260808210000_2_6_g10_nome_do_curador_do_caso` | `01f45dc` | **Item 2.6** (PA-14; absorve o **1.2**) | **ENCERRADO** | E |
| 111 | `20260808230000_2_4_curator_judgments` | `2f6ec05` | **Item 2.4** (PA-15) | **ENCERRADO** | E |
| 112 | `20260808250000_2_3_divisao_da_avaliacao` | `8305d97` | **Item 2.3** (PA-16) | **ENCERRADO** | E |
| 113 | `20260808270000_2_c_abertura_da_fronteira` | `42bca9b` | **Item 2.C** (PA-17) | **ENCERRADO** | E |

**Resposta ao §6 da missão — verificado, não presumido:** as 22 correspondem
integralmente a pacotes **implementados, verificados, certificados e formalmente
encerrados**. As Ondas 1 e 2 foram declaradas **FORMALMENTE ENCERRADAS** pelo
Guardião em 2026-08-08 (PA-18), e o `MAPA_DOS_PACOTES.md` §3 confirma item a
item. **Nenhuma certificação foi reexecutada** — apenas conferida.

**Dado material: apenas duas.** Todas as demais são estrutura pura (o restante
do DML mora **dentro de corpos de função**, não é aplicado pela migration):

| Migration | O que grava |
|---|---|
| **97** `dp3_listas_p3_a_p7_no_catalogo` | `insert into method_subcriterion_options` — **opções do Catálogo** |
| **103** `participacao_do_motor_e_unicidade_por_conceito` | `update method_subcriteria set motor_participation` — **atualiza o Catálogo** |

> Essas duas **tocam o Catálogo em produção**. São exatamente as que exigem
> conferência pós-deploy própria, e as únicas em que "estrutura idêntica" não
> basta como prova.

**Ordem obrigatória: a cronológica dos timestamps**, sem exceção — há
dependências duras (2.2A→2.2A-MR1→2.2B→2.2B-R1→2.2C→2.2C-R1; 1.11→1.12→1.12-MR1;
2.6→2.4→2.3→2.C). É a ordem natural do `db push`; **nenhuma pode subir
isolada**.

**Pendências bloqueantes entre elas: nenhuma.** As quatro higienes não
bloqueantes (F-2.3-1, F-2.4-1, F-2.6-1, F-2.C-1) foram consolidadas em **H-T-01**,
que o Guardião decidiu tratar em **missão separada** e que **não bloqueia a
primeira regra material**.

**H-T-01 conferida, não reaberta (§10 da missão):** nenhuma das 22 depende de
guarda ainda inexistente para ser implantada com segurança. As guardas de que
dependem já estão **dentro das próprias migrations** (triggers, CHECKs, índices
parciais), e as tabelas novas nascem **inertes** — RLS ligada, zero policies,
zero grants. **O descompasso de produção não é motivo para reabrir H-T-01.**

### 3B.4 Ato legítimo para fechar C1

**Dois mecanismos existem e ambos estão documentados:**

| Via | Como | Consequência |
|---|---|---|
| **merge em `main`** | a integração Supabase↔GitHub aplica o DDL automaticamente — foi o que ocorreu em 2026-08-03 | **all-or-nothing**, e o push em `main` **também publica a aplicação** na Vercel: schema e código sobem juntos |
| **CLI em janela autorizada** | `supabase db push` / `migration up --linked` | é o **rito escrito** do [`PLANO_RECONCILIACAO_LEDGER.md`](PLANO_RECONCILIACAO_LEDGER.md), que fixa: *"migration em ambiente hospedado se aplica pelo fluxo da CLI, que preserva a versão do arquivo"*; o MCP `apply_migration` **só em emergência autorizada**, porque carimba timestamp novo e **cria dívida de ledger** |

**Pré-condições que o repositório já fixa** (`PLANO_RECONCILIACAO_LEDGER` §3
passo 0 + `AUDITORIA_09` "Ordem segura"): árvore limpa · **backup/ponto de
restauração confirmado no painel** · token da CLI · **janela sem operação
ativa** · ordem obrigatória · `migration list --linked` conferido antes e depois.

**Rollback:** as migrations são **aditivas** e cada uma traz seu bloco de
rollback objeto a objeto. Mas a `AUDITORIA_09` registra o **ponto de
não-retorno** operacional: aplicado o DDL, o Instant Rollback da Vercel deixa de
ser seguro. **Rollback de schema ≠ rollback de aplicação.**

**Verificação pós-deploy: obrigatória**, e com dois itens que não são genéricos —
as migrations **97** e **103**, que alteram o Catálogo.

**Quem autoriza:** **DT-01**, e antes disso **D-13**. **Quem executa:** Agente 01,
em **missão própria de Engenharia**.

## 4. GATE C2 — o caminho de materialização

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
> (executada com privilégio de dono, fora de RLS) — o que torna o GATE C2 um ato
> de **engenharia**.

### 4.1.1 Mecanismo de **menor autoridade residual**

A primeira regra é **ato raro de Método**, não função de produto. Antes de criar
qualquer superfície permanente, o teste é: *o que resta ligado depois do ato?*

| Mecanismo | Autoridade residual | Veredito |
|---|---|---|
| **migration com os dois `INSERT`** | **zero** — o privilégio é do processo de deploy, que já existe; nada novo fica ligado; o ato fica versionado, revisável e auditável no repositório | ✅ **escolhido** |
| RPC `SECURITY DEFINER` + grant | **permanente** — uma função capaz de criar regras passa a existir para sempre | ❌ |
| Action / endpoint / UI | **permanente e exposta** — superfície de produto para ato que ocorre uma vez | ❌ |
| `grant` direto nas tabelas | **permanente** — desfaz a inércia deliberada do 2.2A/2.2B | ❌ |
| MCP `apply_migration` | baixa, **mas cria dívida de ledger** (carimba timestamp novo) — o `PLANO_RECONCILIACAO_LEDGER` o reserva a **emergência autorizada** | ❌ não é emergência |

> **A migration é o "ato administrativo controlado" que o regime já prevê.**
> Ela deixa **menos** autoridade residual que qualquer alternativa — inclusive
> menos que um writer "temporário", que só é temporário enquanto alguém lembra
> de removê-lo. **Nenhum writer permanente será criado.**

### 4.1.2 Ambiente do ato — decisão confrontada com as autoridades

A preferência do DT-01 (§8 da missão) foi confrontada e **é sustentada pelos
documentos vigentes**:

| Preferência do DT-01 | Autoridade que a sustenta |
|---|---|
| não inserir em produção antes de reconciliar o schema | impossível de outro modo: as tabelas **não existem** lá (C1) |
| não tratar local/fixture como primeiro ato real de R-1 | **CD-1** (*"nenhum valor estabiliza antes de Cases reais"*) · ADR-070 §2.6 (a regra nasce **para ser observada**) · a `practice_evidence` real não existe em dev |

**Escolha: A → B, nesta ordem.** Smoke técnico em local **primeiro**, deploy e
materialização em produção **depois** — e **o smoke não conta como R-1**.

### 4.1.3 O UUID real **não** vai para o ambiente local

Tecnicamente caberia (não há FK). **Deve ser evitado**, por três razões:

1. Criaria uma linha que **parece** o DT-01 num ambiente onde ele nunca se
   autenticou — identidade sem autenticação é exatamente o que o §1.1 proíbe em
   espírito.
2. O repositório já carrega o achado inverso (**ADR-057 / D-20**, dados de teste
   em produção). *Identidade de produção em ambiente de teste* é a mesma classe
   de contaminação, na direção contrária.
3. **É desnecessário.** Como não há FK, um UUID local claramente rotulado prova
   **exatamente as mesmas coisas**: as constraints, os triggers, o grafo, o
   constraint trigger deferido e a unicidade da vigência. **Nada se perde.**

> **Regra:** smoke local usa UUID local rotulado. O UUID real
> `54ec5c6a-…` aparece **uma única vez**: no ato real, em produção.

**O smoke local não cria identidade real, não representa autenticação, não é ato
operacional e não inicia R-1.**

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

## 7B. A sequência até `REGRA 001 — VIGENTE / PROVISÓRIA`

| # | Ato | Quem | Gate |
|---|---|---|---|
| # | Ato | Quem | Situação em 2026-08-08 |
|---|---|---|---|
| **0** | **Decidir D-13** — backup e ponto de restauração | **DT-01** | ✅ **FEITO** — comprovada por **backup lógico com restauração ensaiada** (PITR não contratado) |
| 1 | Lavratura do Gate B | Agente 02 | ✅ **FEITO** — `REGISTRO_DE_GOVERNANCA` §1.1 |
| 2 | Smoke técnico local | Agente 01 | ✅ **FEITO** |
| 3 | Backup ampliado + ponto de restauração | Agente 01, sob D-13 | ✅ **FEITO** |
| 4 | **Deploy das 22 migrations** | Agente 01 | ✅ **FEITO** — produção saiu de 91 |
| 5 | Verificação pós-deploy | Agente 01 | ✅ **FEITO** — as duas tabelas do ciclo existem em produção |
| 6 | **Nascimento** em `PROPOSTA` — dois `INSERT`, uma transação | Agente 01 | ✅ **FEITO** — `f1a7060`, migration 114; `actor_id` real, `PAPEL_INTERNO`, **acumulação declarada no `reason`** |
| 7 | **Aprovação e lavratura da ADR-070** | **DT-01** + Agente 02 | ✅ **FEITO** — inscrita em `DECISIONS.md` no ato |
| **8** | **Promoção** `PROPOSTA → VIGENTE` | **DT-01**, executado pelo **Engenheiro** | 🟡 **PRÓXIMO ATO** — pacote pronto em [`ADR_070`](ADR_070_APROVACAO_DA_REGRA_001.md) §10 |
| 9 | **Leitura derivada** — `derivation_rule_state()` = `VIGENTE` | Engenheiro | após o 8 |
| 10 | **Emenda própria** que liga a regra ao DR3 do emissor profissional | Engenheiro, **missão própria** | **só depois** — e é ela, não a promoção, que aproxima R-1 |
| 11 | Smoke controlado com evidência real | Engenharia + Curadoria | **R-1 inicia aqui** |

> **Correção da sequência original, provada em `ADR_070` §10.5:** a v2.0 deste
> documento supunha que R-1 começaria logo após a promoção. **Não começa.** A
> regra `VIGENTE` **não emite proposta alguma** — o emissor Case-side exige
> cobertura em `derivation_rule_degree_map` (zero linhas, e CD-1 proíbe criá-las)
> e o emissor profissional tem `candidatas := 0` por construção. **Falta a
> emenda própria** que o `CONTRATO_2_C` previu em texto. Por isso o passo 10
> existe, e é ele — não o 8 — que antecede R-1.


## 8. Perguntas obrigatórias

| # | Resposta |
|---|---|
| 1 | **Sim** — Agente 01 comprovou em `auth.users` de `aliviar-2-prod`; DT-01 ratificou |
| 2 | **Sim** — nenhuma autoridade vigente exige tabela de mapeamento; o `REGISTRO_DE_GOVERNANCA` §1.1 é a fonte documental |
| 3 | **Sim — 🟢 VERDE** |
| 4 | [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) §1.1, com espelho neste §3 |
| 5 | **Não** — `curadoria.derivation_rules` é a migration nº 98 da série; produção parou na 91 |
| 6 | **Não** — `curadoria.derivation_rule_transitions` é a nº 100 |
| 7 | **22** (91 → 113) |
| 8 | Inventariadas uma a uma em §3B.3 |
| 9 | **Sim** — todas pertencem a pacotes implementados, verificados, certificados e **formalmente encerrados**; Ondas 1 e 2 encerradas pelo Guardião (PA-18) e conferidas no `MAPA_DOS_PACOTES` §3. **Nenhuma certificação foi reexecutada** |
| 10 | **Nenhuma pendência bloqueante.** As quatro higienes viraram **H-T-01**, tratada em missão separada e **não bloqueante** |
| 11 | **Todas podem ser aplicadas** do ponto de vista de conteúdo. O impedimento é **de pré-condição operacional**, não de migration: **D-13** (backup/PITR) segue aberta |
| 12 | **A cronológica dos timestamps**, sem exceção — há dependências duras (2.2A→MR1→2.2B→B-R1→2.2C→C-R1; 1.11→1.12→MR1; 2.6→2.4→2.3→2.C). Nenhuma sobe isolada |
| 13 | **Sim** — missão própria do Agente 01 |
| 14 | **DT-01** — e antes dele, a decisão **D-13** |
| 15 | **Sim, recomendado** — smoke técnico local com UUID **local rotulado** (§4.1.3). Não é R-1 |
| 16 | **Sim, obrigatório** — `migration list --linked` = 113, existência das duas tabelas, **e conferência específica do Catálogo** (migrations 97 e 103, as únicas com DML de topo) |
| 17 | Tecnicamente sim (sem FK) — **mas produziria significado falso** |
| 18 | **Sim, deve ser evitado.** Um UUID local rotulado prova exatamente o mesmo; o real aparece **uma única vez**, no ato real em produção (§4.1.3) |
| 19 | **Qualquer papel interno** — `authority = 'PAPEL_INTERNO'`, restrito ao nascimento pela constraint `papel_interno_so_propoe` |
| 20 | **Sim, tecnicamente e normativamente** — mas aprofunda a acumulação já declarada (ADR-068 item 6 / RA-1 do PA-2). **Condição:** declarar a acumulação no `reason` da transição (§3.6). **Não inventar segunda identidade** |
| 21 | **Agente 01**, por migration |
| 22 | **Não** — e não deve ser criado |
| 23 | **Sim** — a **migration é** o ato administrativo controlado que o regime prevê |
| 24 | **A migration**: autoridade residual **zero**; versionada, revisável, auditável (§4.1.1) |
| 25 | No **mesmo ato** em que o DT-01 promove a regra (§2.4) — passo 7 da sequência. **Nunca silenciosamente** |
| 26 | **`derivation_rule_transitions`** na transição de promoção: `actor_id` + `authority = 'AUTORIDADE_DE_METODO'` + `approval_adr = 'ADR-070'`. **Confrontado com a ADR-069 e confirmado**: *"a versão é fato; a transição é ato"* — e `derivation_rules.approved_by` é inalcançável após o nascimento (MR1.1 recusa `UPDATE`) |
| 27 | Após o passo 5 — deploy das 22 verificado em produção |
| 28 | Após o passo 6 — nascimento consumado em `PROPOSTA` |
| 29 | **`DT-01 — FUNDADOR / AUTORIDADE DE MÉTODO`** |
| 30 | Os dez atos de §7B |

## 9. CD-1 e R-1

**CD-1 — `INTACTA`.** Nada nesta missão tocou grau, importância, ponte,
Case-side ou `derivation_rule_degree_map`. Nenhuma das 22 migrations pendentes
altera esse quadro: a ponte (`b38cd34`) sobe **vazia**, sem uma única linha de
correspondência.

**R-1 — `ABERTA / NÃO INICIADA OPERACIONALMENTE`.** Nenhuma observação real
começou. Smoke local e fixtures **não contam**. O primeiro ato real exige
ambiente operacional legítimo **e** evidência profissional real — nenhum dos
dois existe hoje.

## 10. Veredito

> ### GATE A 🟢 · GATE B 🟢 · GATE C1 🔴 · GATE C2 🟡
>
> ### PRÉ-FLIGHT — BLOQUEADO EM C1
>
> **O Gate B fechou.** O vínculo `DT-01 → 54ec5c6a-…` está comprovado,
> ratificado e lavrado. Era o bloqueio nomeado na v1.0, e não é mais.
>
> **O bloqueio mudou de natureza — e de dono.** Não é falta de writer: o
> mecanismo legítimo existe e é a **migration**, com autoridade residual zero.
> É **falta de schema no ambiente onde o ato vale** — as tabelas do ciclo da
> Regra 001 **não existem em produção**, que parou em `91 / 20260803150000`.
>
> **E o que trava o deploy não é engenharia: é uma decisão que o DT-01 já
> devia.** A `AUDITORIA_09_PRODUCAO` fixa backup e PITR como passo 1 da ordem
> segura e registra que a documentação **se contradiz** sobre a existência de
> backup. Na consolidação NO-GO isso é **D-13 — nível mínimo de backup +
> RTO/RPO**, dona **Fundador**, prazo *"antes de produção"*, **aberta**.
>
> **Ato mínimo, único e suficiente para destravar:** **decidir D-13** e
> confirmar o ponto de restauração no painel. Tudo o mais já está especificado —
> o inventário das 22, a ordem, o rito de deploy, o rito de nascimento, o rito
> de promoção e a sequência dos dez atos.
>
> **As 22 migrations estão integralmente certificadas.** O descompasso 91→113 é
> **dívida de publicação de trabalho pronto**, efeito de uma contenção
> deliberada de segurança — não deriva acidental, e não motivo para reabrir
> pacote algum.
