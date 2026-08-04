# PP-03 — Autoridade de escrita da paciente sobre o reconhecimento

| Campo | Valor |
|---|---|
| **Identificador** | **PP-03** |
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **Branch:** `curadoria/2-0-documentacao` · **HEAD:** `22cb0d3` |
| **Estado** | **Parecer arquitetural emitido** — encaminhado ao DT-01 |
| **Natureza** | **Exclusivamente arquitetural.** Nenhum código, banco, migration, RPC, RLS ou action foi criado ou alterado |
| **Origem** | Verificação Independente da Etapa 2C — *"ETAPA 2C BLOQUEADA POR AUTORIDADE"* · DT-44 |
| **Decisão** | **PP-03 APROVADO COM RESSALVAS** |
| **Executado sob** | [`PROCESSO_DE_ENGENHARIA_2_0.md`](PROCESSO_DE_ENGENHARIA_2_0.md) — §2.2 (autoridade antes do código) e §7.1 (interrupção por ausência de autoridade) |

---

## 1. Resumo executivo

A Verificação está certa, e o achado é mais desconfortável do que "falta uma permissão".

> **Hoje, o reconhecimento da paciente sobre a tradução do Curador é escrito
> pelo próprio Curador.**

`acknowledgePersonNeedAction` exige `curador_medico` ou `administrador`
(`protocolos-actions.ts:178`), e o RLS de `case_needs` só admite escrita interna.
A paciente **lê** as próprias respostas desde a ADR-065
(`case_needs_select_patient`, migration `20260803120000`) — e **não pode escrever
nenhuma delas**. Os quatro desfechos do DT-22 existem, exigem o texto dela, e
**ela não tem como executá-los**.

Isso não é lacuna de implementação: é a mesma inversão que a Curadoria 2.0
existe para corrigir, aparecendo no ato mais sensível do produto.

**A boa notícia:** o problema já foi resolvido uma vez, no mesmo repositório, para
o mesmo tipo de ato. `acknowledge_priority_profile` é uma RPC `SECURITY DEFINER`
que dá à paciente **exatamente um verbo** sobre uma tabela que ela não pode
escrever. **O menor contrato de autoridade é a réplica desse precedente por
conceito** — e nada além dele.

---

## 2. Situação atual

### 2.1 Quem escreve `case_needs`

Migration `20260801100000_protocolos_oficiais.sql`, linhas 96–110:

| Operação | Quem | Policy |
|---|---|---|
| `SELECT` | `administrador` **ou** Curador do Case | `case_needs_select_interno` |
| `SELECT` | **a paciente do Case** | `case_needs_select_patient` (ADR-065, `20260803120000`) |
| `INSERT` | `administrador` **ou** Curador do Case | `case_needs_write_interno` |
| `UPDATE` | `administrador` **ou** Curador do Case | `case_needs_update_interno` |

> **A paciente lê e não escreve.** Nenhuma policy de escrita a contempla.

### 2.2 Quem escreve `priority_profiles`

| Operação | Quem |
|---|---|
| Criação e conteúdo | interno (Curador / administrador) |
| **Reconhecimento** (`status = 'VALIDATED'`, `validated_at`) | **a paciente**, exclusivamente por RPC `SECURITY DEFINER` |

### 2.3 Quem escreve `acknowledgment` (em `case_needs`)

**Coluna:** `acknowledgment text not null default 'PENDENTE'`, domínio fechado —
`PENDENTE` · `RECONHECIDA` · `CORRIGIDA` · `RECUSADA`, com o CHECK
`case_needs_correcao_tem_texto` exigindo `correction` quando `CORRIGIDA`.

**Escritor único hoje:** `acknowledgePersonNeed` (`protocolos-repository.ts:266`),
chamada por `acknowledgePersonNeedAction`, que exige
`requireAnyRoleForAction(["curador_medico", "administrador"])`.

> **O ato que o domínio reserva à paciente é praticado, no código, pelo Curador.**

### 2.4 Quem confirma o Perfil

`curadoria.acknowledge_priority_profile(_case_id uuid)` —
`SECURITY DEFINER`, `set search_path`, autorização por
`curadoria.is_patient_for_case(_case_id)`, idempotente, com
`audit_log` `profile_recognized` e `actor_id = auth.uid()`
(`20260728030000` + `20260802159000`).

### 2.5 O fluxo atual, desenhado

```
Curador traduz            → case_needs (origin = 'TRADUCAO', proposed_reading)
                                        declared_by = Curador
                              ▲
                              │ UPDATE  ← acknowledgePersonNeedAction
                              │           requireAnyRoleForAction(curador, admin)
                        ✗ PACIENTE não alcança
                              │
Paciente lê                → case_needs_select_patient  (só SELECT)
                              │
Paciente reconhece o Perfil → acknowledge_priority_profile  (RPC, SECURITY DEFINER)
                              → priority_profiles.status = VALIDATED
                              → audit_logs.profile_recognized (actor = ela)
```

**A assimetria é o bloqueio:** existe caminho de escrita da paciente para o
**Perfil inteiro**, e nenhum para **o conceito**, que é onde o DT-22 pôs os quatro
desfechos.

---

## 3. Comparação dos precedentes

| Aspecto | `acknowledge_priority_profile` (RPC) | `acknowledgePersonNeed` (repositório) |
|---|---|---|
| **Camada** | banco, `SECURITY DEFINER` | aplicação, cliente autenticado |
| **Autorização** | `is_patient_for_case` — **a paciente** | `requireAnyRoleForAction` — **Curador/admin** |
| **Alcance da escrita** | **duas colunas** de uma linha | duas colunas, por RLS interna |
| **Objeto** | o Perfil (um por Case) | **um conceito** de `case_needs` |
| **Idempotência** | sim — `JA_RECONHECIDO` | não declarada |
| **Estados de recusa** | 5 retornos nomeados | exceções com frase |
| **Auditoria** | `audit_logs.profile_recognized`, autor = ela | **nenhuma** |
| **Autoria do ato** | `auth.uid()` da paciente | implícita, do Curador |
| **Validação de conteúdo** | gate de completude do Mapa | **exige texto** em `CORRIGIDA`/`RECUSADA` (DT-22) |

### 3.1 O que pode ser reutilizado

| # | Princípio | Por quê |
|---|---|---|
| **1** | **`SECURITY DEFINER` com autorização explícita no corpo** | Concede **um verbo**, não uma permissão. A paciente nunca ganha `UPDATE` na tabela |
| **2** | **`is_patient_for_case` como única porta** | Já existe, já é usada em cinco migrations, e amarra o ato ao Case dela |
| **3** | **`set search_path = curadoria, pg_temp`** | Padrão de segurança de toda função `SECURITY DEFINER` da casa |
| **4** | **Retornos nomeados em vez de exceção** | Permite à superfície distinguir "não autorizado" de "já respondido" sem interpretar mensagem |
| **5** | **Idempotência declarada** | Repetir o ato não gera segundo efeito nem segundo evento |
| **6** | **`audit_log` no ato efetivo, com `actor_id = auth.uid()`** | Trilha nasce com o ato; tentativas não geram evento |
| **7** | **`revoke ... from anon` + `grant ... to authenticated`** | Padrão de grants endurecido (`20260728050000`) |
| **8** | **Redefinição por `CREATE OR REPLACE` em migration nova** | A original nunca é editada — precedente de `20260802159000` |

### 3.2 O que **não** pode ser reutilizado

| # | Não reutilizar | Por quê |
|---|---|---|
| **1** | **A autorização de `acknowledgePersonNeedAction`** | É exatamente o defeito: papel interno praticando ato dela |
| **2** | **O escopo "um por Case"** do Perfil | O DT-22 opera **por conceito**; a RPC precisa de `subcriterion_code` |
| **3** | **A ausência de texto** | O Perfil não guarda motivo; aqui, `CORRIGIDA` e `RECUSADA` **exigem** o texto dela (DT-22, e CHECK no banco) |
| **4** | **A ausência de auditoria** de `acknowledgePersonNeed** | O ato da paciente sem trilha é o que `20260802159000` corrigiu no Perfil |
| **5** | **O gate de completude do Mapa** | É pré-condição do Perfil, não do conceito |

---

## 4. Alternativas

### A · Paciente recebe `UPDATE` em `case_needs`

**RECUSADA.**

| # | Motivo |
|---|---|
| 1 | `UPDATE` na tabela alcança **todas** as colunas: `degree`, `options`, `guided_text`, `proposed_reading`, `declared_by`, `origin`. Restringir por policy `WITH CHECK` não impede alterar coluna alguma — policy filtra **linha**, não **coluna** |
| 2 | Exigiria triggers de coluna para reconstituir a fronteira — mais superfície de erro que a RPC |
| 3 | **Nenhum precedente:** em todo o repositório, a paciente nunca recebeu `INSERT`/`UPDATE` direto sobre tabela interna |
| 4 | Contraria o princípio 1 do §3.1: conceder verbo, não permissão |

### B · RPC específica `SECURITY DEFINER`

**ADEQUADA — e é a única com precedente direto.**

| # | Razão |
|---|---|
| 1 | Concede **um verbo** sobre **duas colunas** de **uma linha** |
| 2 | A autorização vive no corpo, é legível e testável |
| 3 | Réplica de `acknowledge_priority_profile` — mesmo ator, mesma natureza de ato, mesma tabela-alvo interna |
| 4 | Permite validar o texto do DT-22 **no banco**, não só na aplicação |
| 5 | Permite auditoria no mesmo padrão de `profile_recognized` |

### C · Action do Curador reutilizada

**RECUSADA — é o estado atual, e é o defeito.**

Manter `acknowledgePersonNeedAction` como caminho significa que o Curador
continua praticando o ato dela. O registro diria "reconhecido" sem que ninguém
possa provar que foi ela. É a mesma classe de problema que a ADR-068 §1 nomeia:
**assinatura sem o autor não é autoria**.

*(Nota: a action **não é apagada**. Ver §5.5.)*

### D · Outra alternativa com precedente

Examinei o repositório em busca de terceiro padrão de escrita da paciente sobre
objeto interno. **Existem exatamente dois**, e ambos são `SECURITY DEFINER`:
`acknowledge_priority_profile` e `register_patient_document_residue`
(`20260802153000`). **Não há terceiro padrão a propor**, e inventar um seria
arquitetura sem precedente — proibido pela missão.

---

## 5. Contrato mínimo

Definição de **contrato**, não de implementação. Nenhuma linha de SQL abaixo.

### 5.1 Entradas

| Entrada | Papel |
|---|---|
| `case_id` | o Case dela |
| `subcriterion_code` | o conceito, por **código canônico** (I-2 — nunca rótulo) |
| `acknowledgment` | um de: `RECONHECIDA` · `CORRIGIDA` · `RECUSADA`. **`PENDENTE` não é entrada** — é a ausência de ato |
| `correction` | o texto dela. Obrigatório em `CORRIGIDA` e `RECUSADA`; ignorado em `RECONHECIDA` |

### 5.2 Saídas — retornos nomeados, no padrão do precedente

| Retorno | Significado |
|---|---|
| `RECONHECIDA` / `CORRIGIDA` / `RECUSADA` | o ato aconteceu |
| `NAO_AUTORIZADO` | quem chamou não é a paciente deste Case |
| `CONCEITO_INEXISTENTE` | não há linha para (Case, conceito) |
| `NAO_TRADUZIDO` | o conceito não tem `origin = 'TRADUCAO'` — não há tradução sobre a qual se manifestar |
| `JA_RESPONDIDO` | já há desfecho não-`PENDENTE` — **idempotência** |
| `PERFIL_JA_RECONHECIDO` | o Perfil está `VALIDATED`; corrigir agora é **supersessão** (ADR-049), não segundo ato |
| `TEXTO_OBRIGATORIO` | `CORRIGIDA`/`RECUSADA` sem texto (DT-22) |

### 5.3 Autorização

**Uma única porta:** `curadoria.is_patient_for_case(case_id)`.

Nem `administrador`, nem `curador_medico`, nem `service_role` praticam este ato
por ela. **Grants:** `revoke from anon` · `grant execute to authenticated` — a
autorização real é o teste no corpo, não o grant.

### 5.4 Campos alteráveis — lista fechada

| Campo | Regra |
|---|---|
| `acknowledgment` | de `PENDENTE` para um dos três desfechos. **Nunca de volta** |
| `correction` | o texto dela; `null` quando `RECONHECIDA` |

**Dois campos. Nada mais.**

### 5.5 Campos proibidos — nenhum alcançável por ela

`degree` · `options` · `guided_text` · `flexibility` · `proposed_reading` ·
`origin` · `subcriterion_code` · `catalog_version` · `declared_by` ·
`declared_at` · `case_id` · `id`.

`updated_at` é movido pelo trigger `case_needs_touch`, não pela paciente.

**A action existente permanece**, com escopo reduzido ao que é legitimamente do
Curador: **registrar a tradução** (`proposed_reading`, `origin`). O desfecho sai
dela. Isso é ajuste de escopo da Etapa 2C, não deste parecer.

### 5.6 Autoria

| Fato | Onde vive | De quem |
|---|---|---|
| **A declaração traduzida** | `declared_by` | **do Curador** — e **não muda** |
| **O ato de reconhecer/corrigir/recusar** | `audit_logs.actor_id` | **dela**, via `auth.uid()` |

> **A autoria da declaração e a autoria do ato sobre ela são coisas distintas, e
> ficam em lugares distintos.** É a mesma separação que o comentário da tabela já
> declara: *"Leitura proposta é do Curador; reconhecimento é ato da pessoa."*

### 5.7 Auditoria

Padrão de `profile_recognized` (`20260802159000`):

| Regra | Conteúdo |
|---|---|
| **Quando** | apenas no ato **efetivo** — os retornos de recusa e idempotência **não** geram evento |
| **Autor** | `auth.uid()` — a própria paciente |
| **Ação** | valor novo no enum `curadoria.audit_action`, aditivo (mesmo precedente de `profile_recognized` e `patient_document_orphaned`) |
| **Metadata** | identificadores e carimbo: `case_id`, `subcriterion_code`, desfecho, `actor_role: 'paciente'`. **Nunca o texto dela** — conteúdo clínico não entra em metadata |
| **Transação** | o mesmo ato: ou grava os dois, ou nenhum |

---

## 6. Segurança

| Ameaça | Como é impedida |
|---|---|
| **Alterar o grau** | `degree` não está entre os dois campos alteráveis (§5.4). A RPC não o toca; ela não tem `UPDATE` na tabela |
| **Alterar opções** | idem para `options` |
| **Alterar autoria** | `declared_by` é da declaração, imutável pela RPC. O ato dela vive em `audit_logs`, separado |
| **Alterar a declaração** | `proposed_reading`, `guided_text` e `origin` fora da lista. **Ela se manifesta sobre a tradução; não a reescreve** |
| **Alterar conceito diferente** | a linha é resolvida por `(case_id, subcriterion_code)` — chave única da tabela — e `case_id` vem validado por `is_patient_for_case` |
| **Alterar Cases de terceiros** | `is_patient_for_case(case_id)` é a primeira instrução; falhando, retorna `NAO_AUTORIZADO` antes de qualquer leitura |
| **Reescrever o próprio ato** | `JA_RESPONDIDO` — desfecho não regride |
| **Corrigir depois de reconhecer o Perfil** | `PERFIL_JA_RECONHECIDO` — reconhecimento é irreversível (ADR-049); corrigir depois é **supersessão do Perfil**, não segundo ato |
| **Registrar desfecho sem motivo** | `TEXTO_OBRIGATORIO` na RPC **e** CHECK `case_needs_correcao_tem_texto` no banco — duas camadas |
| **Escalonar via `anon`** | `revoke execute from anon`, no padrão endurecido de `20260728050000` |

---

## 7. Compatibilidade

| Altera? | Resposta |
|---|---|
| **Domínio** | **Não.** Nenhum conceito, escala, grau, opção, critério ou estado é criado ou alterado. Os quatro desfechos já existem no CHECK desde `20260801100000`, e o DT-22 já os definiu |
| **Motor** | **Não.** `case_needs` **não alimenta o Motor** — o comentário da tabela é explícito: *"Nao alimenta o Motor: as cinco importancias seguem em case_priority_map"* |
| **Curadoria** | **Não.** Nenhuma fase, gate, ordem ou critério de saída muda. O gate do Perfil (`relational_needs_pending`) já exige resposta registrada; **quem a registra** é o que muda |
| **Proveniência** | **Não altera: completa.** Hoje o ato dela não tem autor rastreável. Passa a ter, no mesmo padrão do Perfil |

> **É apenas um caminho controlado de escrita** — um verbo, duas colunas, uma
> linha, uma autorização.

---

## 8. ADR

### **Cabe na ADR-068. Não exige emenda. Não exige ADR nova.**

| Fundamento | Texto vigente |
|---|---|
| **A autoridade já é dela** | ADR-068 §11: *"Reconhecimento do Perfil — a paciente, exclusivamente"*; e §4: *"O que ela faz sobre a tradução é **reconhecer ou discordar**"* |
| **O verbo já está definido** | ADR-068 §3: **RECONHECER** produz habilitação, é ato exclusivo da paciente, e **não é confirmação** |
| **Os quatro desfechos já estão decididos** | M-001 §6.2.1 (confirmar · discordar · corrigir · deixar pendente) e DT-22 (os dois que afirmam algo exigem texto) |
| **A ADR-068 não decide caminho de escrita** | §25 remete explicitamente à implementação: *"Policies de RLS concretas — dentro do recorte"* |

> **A autoridade não está sendo criada. Está sendo tornada exercível.** ADR
> define quem pode; a RPC é como. Criar ADR para um caminho de escrita
> transformaria decisão de implementação em decisão de domínio — o inverso do
> que o processo pede.

**Nenhum item congelado é tocado:** a RLS congelada pela ADR-040 item 6 é a de
`professional_subcriterion_map`, **outra tabela**. `case_needs` nasceu depois e
não está no §4 do Congelamento.

---

## 9. Impacto

### 9.1 Desbloqueado imediatamente

| Etapa / Item | Como |
|---|---|
| **Etapa 2C** | A superfície dos quatro desfechos passa a ter escritor legítimo. **É o desbloqueio direto** |
| **Item 1.10B** | O reconhecimento em duas colunas ganha os quatro desfechos praticáveis por ela |
| **Auditoria do ato dela** | O desfecho por conceito passa a ter trilha, como o Perfil já tem |

### 9.2 Não desbloqueado

| O quê | Por quê |
|---|---|
| **Item 1.11** | Painel de discordância — depende do registro de regras, não deste caminho |
| **Etapa 2D** | Fora do escopo; não avaliada |
| **Onda 2** | Inalterada — nada aqui toca derivação, propostas ou C-01 |

### 9.3 Efeito colateral a tratar na Etapa 2C

`acknowledgePersonNeedAction` deixa de ser o caminho do desfecho. **Não deve ser
apagada** — o Curador continua registrando a tradução. Reduzir seu escopo é
trabalho da Etapa 2C, com a fronteira já dada em §5.5.

---

## 10. Critérios

| Critério | Situação |
|---|---|
| **Preserva autoridade** | **Sim** — devolve à paciente o ato que o domínio já lhe reservava e que o código praticava por ela |
| **Preserva segurança** | **Sim** — nove ameaças endereçadas (§6); ela nunca recebe `UPDATE` na tabela |
| **Preserva domínio** | **Sim** — zero conceito, escala, gate ou fase alterados |
| **Minimiza escopo** | **Sim** — um verbo, duas colunas, uma linha, uma autorização, um precedente replicado |

---

## DECISÃO

# **PP-03 APROVADO COM RESSALVAS**

**Solução:** alternativa **B** — RPC específica `SECURITY DEFINER`, réplica por
conceito de `acknowledge_priority_profile`, com o contrato mínimo do §5.

### Ressalvas

| # | Ressalva | Encaminhamento |
|---|---|---|
| **R-1** | **A action atual não deve ser apagada**, e sim ter escopo reduzido ao registro da tradução (§5.5). Se for apagada, o Curador perde o caminho de registrar `proposed_reading` | Etapa 2C |
| **R-2** | **O retorno `PERFIL_JA_RECONHECIDO` é decisão minha**, derivada da ADR-049 (reconhecimento irreversível; correção é supersessão). Não está escrita em lugar nenhum como regra do conceito | **Ratificar no DT-01** |
| **R-3** | **A idempotência `JA_RESPONDIDO` também é minha**, por analogia com `JA_RECONHECIDO`. A alternativa — permitir trocar o desfecho — seria decisão de domínio, e eu não a tomo | **Ratificar no DT-01** |
| **R-4** | **O valor novo em `curadoria.audit_action` exige migration aditiva.** É consequência do contrato, não decisão nova — mesmo precedente de `profile_recognized` | registrar na Etapa 2C |
| **R-5** | **Este parecer não está commitado.** O ciclo PP-01 → DOC-01B mostrou o custo de parecer não versionado (P-01). Recomendo incluí-lo no próximo pacote documental | DT-01 |

---

*Fim do PP-03. **Nada foi implementado.** Nenhuma RPC, migration, RLS, action ou
código foi criado ou alterado. Etapa 2D não aberta; Item 1.11 não aberto.
Encaminhamento exclusivo: **DT-01**.*
