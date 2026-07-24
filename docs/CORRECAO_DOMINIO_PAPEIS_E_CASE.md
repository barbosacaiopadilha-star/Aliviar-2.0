# Correção de Domínio — Papéis Operacionais, Case e o papel do CRM

**Decisão do Fundador, 2026-07-24.** Autoridade sobre banco, domínio, tipos, dashboards, permissões, textos e testes.

Encerra a tensão registrada cinco vezes em `docs/OPERATIONAL_ROLES_MODEL.md` sem decisão.

---

## 1. As três categorias que nunca se misturam

| Categoria | O que é | Exemplos |
|---|---|---|
| **Papel humano** | Quem age | Atendente, Curador, Concierge |
| **Entidade de domínio** | O que existe | Contact, Patient, **Case** |
| **Módulo do sistema** | Onde acontece | CRM, Portal do Curador, Jornada |

**O CRM é plataforma, nunca ator.** Não abre Case, não conduz Curadoria, não acompanha paciente, não decide. Organiza contatos, Cases, tarefas, agenda, histórico, documentos, responsáveis, notificações e auditoria.

---

## 2. Os três níveis humanos

### Nível 1 — Atendente
Recebe o contato · acolhe · registra · qualifica · **abre o Case** · encaminha ao Curador.

**É quem inicia o Case.**

### Nível 2 — Curador
Recebe **o mesmo Case**. Conduz a Consulta Inicial, analisa, define critérios, conduz a Curadoria Técnica, valida artefatos, produz o Relatório, encaminha ao Concierge.

**Nunca cria outro Case.**

### Nível 3 — Concierge
Atua **somente após a Curadoria**. Acompanha o paciente, auxilia na escolha e no agendamento, acompanha documentos e retorno, até o encerramento.

**Não inicia o Case. Não conduz Curadoria.**

---

## 3. Uma única fonte de verdade

Existe **apenas `Case`**. Proibido `crm_case`, `curadoria_case`, `case_curador`, `case_concierge`.

O mesmo Case percorre a jornada inteira. **Muda de responsável, nunca de identidade.**

```
Contato → Atendente → Qualificação → Abertura do Case → Curador →
Consulta Inicial → Curadoria → Relatório → Concierge →
Escolha do médico → Agendamento → Acompanhamento → Encerramento
```

---

## 4. Estado atual × alvo

### ✅ Já corrigido

**Papel `atendente` criado** — migration `papel_atendente_nivel1`. O catálogo agora tem os três níveis.

### 🔴 Bloqueador operacional: não existe separação de funções em produção

A contagem por papel enganava. Vista por **pessoa**:

| Pessoa | Papéis |
|---|---|
| **Administrador** (`54ec5c6a`) | administrador · concierge · curador_medico |
| Paciente | paciente |
| Henrique Teste Paciente | paciente |

**Há uma única pessoa operacional, e ela acumula os três níveis.** Não existe Atendente, e o Administrador está sendo usado como Curador e como Concierge — exatamente o que a Correção de Domínio proíbe.

Consequência para a certificação: **os testes de RLS por papel não podem provar o isolamento entre níveis em produção**, porque não há duas pessoas distintas para isolar. A arquitetura está correta e verificada; a operação ainda não a exercita.

Nenhum usuário fictício foi criado para contornar isso.

### ⛔ Pendente — violação estrutural

**Existem duas entidades Case:**

| Tabela | Registros | Origem |
|---|---|---|
| `curadoria.cases` | 2 | Método/ACE |
| `curadoria.crm_cases` | 2 | CRM |

Sem nenhuma FK entre elas. Isso viola a regra da fonte única e é a causa de o workflow `Atendente → Curador → Concierge` não deixar rastro no banco.

**Volume trivial: 2 + 2 registros.** A unificação é viável sem risco de perda.

---

## 5. Unificação

O alvo é `curadoria.cases` absorver o papel do `crm_cases`, porque é o Case da Ontologia §3.2 e já é referenciado por 11 tabelas do Método.

### ✅ Fase 1 — responsabilidade no Case *(aplicada 2026-07-24, migration `case_responsavel_fase1`)*

```sql
alter table curadoria.cases
  add column responsible_id uuid references curadoria.profiles(id),
  add column responsible_role text check (responsible_role in
    ('atendente','curador_medico','concierge'));
```

`opened_by` do plano original **foi descartado**: `cases.created_by` já registra quem abriu o Case. Duas colunas para o mesmo fato seriam duas fontes de verdade — exatamente o erro que esta correção existe para eliminar. `created_by` recebeu comentário declarando que é o Atendente e que é imutável.

### ✅ Fase 2 — auditoria da troca *(aplicada 2026-07-24, migration `case_auditoria_troca_responsavel_fase2`)*

`curadoria.case_responsibility_changes`, com **append-only imposto por trigger**, não por disciplina de quem escreve código:

| Garantia | Como |
|---|---|
| Nunca UPDATE, nunca DELETE | trigger `case_responsibility_changes_append_only` |
| Motivo obrigatório e não-vazio | `check (length(btrim(reason)) > 0)` |
| Papéis válidos nos dois lados | `check … in ('atendente','curador_medico','concierge')` |
| Troca sem troca é rejeitada | trigger `case_responsibility_changes_coherence` |
| Só registra quem tem o Case | RLS `…_insert`, exige `changed_by = auth.uid()` |

### ✅ Fase 3a — RLS pela responsabilidade atual *(aplicada 2026-07-24, `case_rls_responsavel_atual_fase3a`)*

Antes: `using (has_role('administrador') or assigned_curator_id = auth.uid())`. Um Atendente ou Concierge não enxergava Case nenhum, nem sendo o `responsible_id`.

Agora, via `curadoria.can_access_case(uuid)` (`SECURITY DEFINER`, `search_path` fixo):

| Quem | Enxerga |
|---|---|
| Administrador | todos |
| Responsável atual, qualquer nível | o Case que tem na mão |
| Curador designado | os Cases anteriores à Correção, cujo `responsible_id` é nulo |
| Quem já entregou o Case | **nada** — o histórico registra a passagem, não devolve acesso |

`case_events` passou a espelhar o mesmo critério. INSERT de Case agora aceita `atendente`.

### ✅ Fase 3b — transferência auditada *(aplicada 2026-07-24, `case_transferencia_auditada_fase3b`)*

`curadoria.transfer_case_responsibility(_case_id, _new_responsible_id, _new_role, _reason)`.

O ator vem de `auth.uid()`, **nunca do cliente**. Valida: ator autenticado · motivo não-vazio · papel válido · Case existente (`for update`) · permissão do ator · papel real do destinatário · transição da jornada. É idempotente. Grava a auditoria **antes** de mover o Case — se a auditoria falhar, o Case não anda.

O trigger `cases_responsibility_guard` rejeita qualquer `UPDATE` que toque em `responsible_id`/`responsible_role` fora dessa função. Escrita direta pelo cliente é impossível, não desencorajada.

**Transições normais** (sem administrador): `sem responsável → atendente` · `atendente → curador_medico` · `curador_medico → concierge`. Devolução, reabertura e salto de nível exigem administrador.

`sem responsável → curador_medico` também é normal, por uma razão operacional: **não existe nenhuma pessoa com papel `atendente` em produção**. Fechar esse caminho pararia a operação real para impor um organograma vazio. Reavaliar quando o primeiro Atendente existir.

### ⛔ Fase 3c — migrar os 2 `crm_cases` — **INTERROMPIDA**

Três condições de parada presentes. Ver §5c.

### ⛔ Fase 4 — remover `crm_cases`

Bloqueada por 4 FKs entrantes e 2 funções de RLS. Ver §5c.

---

## 5c. Por que a migração dos `crm_cases` parou

### 1. Dependência real no schema remoto

`crm_cases` não é uma tabela solta. É a espinha do módulo CRM inteiro:

| Tipo | O quê |
|---|---|
| FK entrante | `crm_contacts.active_case_id` |
| FK entrante | `crm_tasks.case_id` |
| FK entrante | `crm_interactions.case_id` |
| FK entrante | `crm_appointments.case_id` |
| Função de RLS | `curadoria.can_access_crm_contact` — governa o acesso a **todos** os contatos |
| Função de RLS | `curadoria.is_curator_for_crm_case` |
| Trigger | `set_crm_cases_updated_at` |
| Policies | 3 (SELECT/INSERT/UPDATE) |

Sem cron jobs (`pg_cron` não instalado), sem views, sem matviews.

Confirmado que **nenhuma linha de código deste repositório** referencia `crm_cases` — mas o schema remoto sozinho já é dependência suficiente.

### 2. Não existe caminho determinístico de mapeamento

`crm_contacts` **não tem nenhuma coluna** que ligue a `profiles` ou a paciente. `cases.patient_profile_id` é obrigatório e aponta para `profiles`.

Para migrar um `crm_case` seria preciso criar um `profiles` para "Ana Demonstração CRM" e decidir que é a mesma pessoa. **Isso é inventar**, não migrar.

### 3. Os 4 registros são fixtures de smoke test

Os próprios dados dizem: `"Caso operacional criado automaticamente para smoke test"`, `"Smoke test CRM — dados fictícios"`, `ana.demo.crm@exemplo.invalid`.

Pior: os **2 `crm_cases` são duplicatas um do outro** — mesmo nome, mesmo telefone (`5511977770001`), mesmo e-mail, em dois `crm_contacts` distintos criados com 7 segundos de diferença. Um deles tem `active_case_id` nulo, o outro não.

Migrar isso para `curadoria.cases` levaria lixo de teste para dentro da tabela canônica do Método.

**Recomendação**: apagar os 4 registros de fixture em vez de migrá-los, e só então avaliar a fusão estrutural com dados reais. Não apaguei — exige sua autorização.

---

## 5d. Backfill: não feito, de propósito

Os 2 Cases existentes seguem com `responsible_id` nulo.

Preencher a partir de `assigned_curator_id` seria registrar um fato de responsabilidade que ninguém declarou. Nulo é honesto: significa "anterior à Correção de Domínio". A RLS já cobre esses Cases pelo vínculo histórico do Curador designado, então nada quebra por estarem nulos.

---

## 6. Correções de interpretação minhas

Registradas porque estavam em relatórios anteriores:

| Onde | Errado | Correto |
|---|---|---|
| Certificação RC-1 §5 | "`concierge` é o papel do CRM" | É o papel de **acompanhamento pós-Curadoria** |
| Certificação RC-1 §3 | "`concierge` é papel órfão" | Tem função definida; falta a **superfície** |
| `role-home.ts` | Comentário sugere papel sem propósito | Precisa ser reescrito |

---

## 7. Pendências por camada

| Camada | O que falta |
|---|---|
| **Banco** | Fases 3c e 4 (fusão de `crm_cases`) — interrompidas, §5c |
| **Código** | Nenhuma rota para `atendente` ou `concierge`; `ROLE_HOME` não os mapeia |
| **UI** | Nenhuma tela chama `transferCaseResponsibilityAction` — a operação existe e é segura, mas ninguém a alcança |
| **Dashboards** | Não existem os do Atendente e do Concierge |
| **Operação** | Ninguém tem papel `atendente`; uma só pessoa acumula os três níveis (§4) |

Já resolvido: modelo de responsabilidade, auditoria, RLS, transferência segura, tipos, schema Zod, server action, 19 testes unitários novos, e a atualização de `OPERATIONAL_ROLES_MODEL.md`.

---

## 8. Os 24 testes obrigatórios

| # | O que prova | Onde | Estado |
|---|---|---|---|
| 1 | Atendente autorizado abre Case | policy `cases_insert_atendente_curador_admin` | ✅ estrutural |
| 2 | Atendente vê o Case enquanto é responsável | `can_access_case` | ✅ |
| 3 | Atendente transfere o mesmo Case | SQL, tx revertida | ✅ |
| 4 | Curador recebe o **mesmo** `case_id` | SQL + `case-responsibility.test.ts` | ✅ |
| 5 | Atendente perde o acesso após transferir | `can_access_case` + teste unitário | ✅ |
| 6 | Curador conduz o mesmo Case | SQL | ✅ |
| 7 | Curador transfere ao Concierge | SQL | ✅ |
| 8 | Concierge recebe o mesmo `case_id` | SQL | ✅ |
| 9 | Concierge acessa só o necessário | RLS | 🟡 sem superfície para medir |
| 10 | Concierge não altera decisão técnica validada | triggers de imutabilidade do Método | 🟡 não reexercitado |
| 11 | Administrador vê conforme permissão | SQL com `set role authenticated` | ✅ |
| 12 | Usuário sem vínculo não acessa | SQL: paciente vê 0 Cases | ✅ |
| 13 | Transferência sem motivo é rejeitada | SQL + unitário | ✅ |
| 14 | Papel incompatível é rejeitado | SQL + unitário | ✅ |
| 15 | Repetição idêntica é idempotente | SQL: histórico não duplica | ✅ |
| 16 | Histórico não permite UPDATE | trigger append-only | ✅ |
| 17 | Histórico não permite DELETE | trigger append-only | ✅ |
| 18 | Ator não pode ser falsificado | `changed_by` vem de `auth.uid()` | ✅ |
| 19 | Nenhum Case duplicado na migração | — | ⛔ migração interrompida |
| 20 | Nenhum `crm_cases` perdido | — | ⛔ migração interrompida |
| 21 | O mesmo Case percorre a jornada | `case-responsibility.test.ts` | ✅ |
| 22 | Dashboards por responsabilidade | — | ⛔ dashboards não existem |
| 23 | Typecheck, lint, build, testes | **818 testes**, tsc/lint/build limpos | ✅ |
| 24 | RLS validada por papel real | `set role authenticated` + claims | 🟡 ver bloqueador §4 |

**19 de 24 verdes.** Os três ⛔ dependem de trabalho que não foi autorizado ou está bloqueado. O 24 é parcial pelo motivo do §4: uma só pessoa acumula os três papéis, então o isolamento *entre* níveis não tem como ser exercitado com gente real.

Todos os testes de SQL rodaram em transação revertida. Estado final conferido: **0 registros de histórico, 0 Cases com responsável, 2 Cases intactos.**

---

## 9. Rollback

`supabase/rollback-correcao-dominio.sql` desfaz as Fases 1, 2, 3a e 3b, na ordem certa.

Um passo é destrutivo — derrubar `case_responsibility_changes` apaga auditoria. O arquivo traz o `copy … to stdout` para exportar antes e a contagem no momento em que foi escrito (0). Nenhuma migration já aplicada foi alterada.
