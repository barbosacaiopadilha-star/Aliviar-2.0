# Administrador, entrada do paciente e painel executivo

**Decisão do Fundador, 2026-07-24.** Complementa [`CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](CORRECAO_DOMINIO_PAPEIS_E_CASE.md), que continua sendo a autoridade sobre o Case e os três níveis humanos.

---

## 1. O Administrador

Acesso global, governança, gestão de perfis, organização do CRM, indicadores e supervisão.

**Acesso global não é responsabilidade operacional pelo Case.** O Administrador vê tudo e não é dono de nada: ele intervém em exceções, não é o ator padrão do fluxo.

**Não substitui silenciosamente Atendente, Curador ou Concierge.**

| Papel | Converte lead | Abre Case | Conduz Curadoria | Acompanha |
|---|---|---|---|---|
| Atendente (N1) | ✅ | ✅ | — | — |
| Curador (N2) | ❌ | ❌ | ✅ | — |
| Concierge (N3) | ❌ | ❌ | ❌ | ✅ |
| Administrador | 🟡 exceção | 🟡 exceção | 🟡 exceção | 🟡 exceção |

---

## 2. Lead, Contact e Patient

| | O que é |
|---|---|
| **Lead** | Pessoa que chegou por um canal de aquisição, ainda não qualificada. Pode nunca virar paciente — e tudo bem. |
| **Contact** | O registro de relacionamento no CRM (`crm_contacts`). Não deixa de existir quando vira paciente: passa a **apontar** para um. A origem nunca se apaga. |
| **Patient** | Pessoa formalmente vinculada ao atendimento. Pode ter Case e acessar a Área do Paciente. |

---

## 3. Os dois caminhos de criação de paciente

### Caminho A — administrativo *(já existia)*

`/admin/pacientes/novo` → `createPatientAccountAction`, restrito a `administrador`. Para correção de cadastro, duplicidade e situações excepcionais.

### Caminho B — conversão de lead *(construído nesta missão)*

```
Lead → atendimento inicial → qualificação pelo Atendente →
conversão em Patient → abertura do Case → encaminhamento ao Curador
```

Duas operações de servidor, ambas `SECURITY DEFINER` com `search_path` fixo e ator vindo de `auth.uid()`:

**`curadoria.qualify_lead(_contact_id, _notes)`** — só Atendente ou Administrador. Idempotente: qualificar duas vezes não reescreve quem qualificou primeiro.

**`curadoria.convert_lead_to_patient(_contact_id, _patient_profile_id, _administrative_exception, _reason)`**

| Garantia | Como |
|---|---|
| Curador e Concierge não convertem | checagem de papel, com mensagem que explica por quê |
| Qualificação é pré-requisito | exceção administrativa existe, é explícita e exige motivo |
| Idempotente | mesmo paciente → retorna sem novo efeito |
| Nunca sobrescreve | converter para **outro** paciente levanta conflito |
| Duplicidade visível | se o paciente já veio de outro lead, só administrador resolve |
| Origem preservada | `source`, `source_detail`, `created_at` e `qualified_at` intactos |
| Auditoria | `record_crm_audit` grava ator, origem, motivo e exceção |

**Colunas novas em `crm_contacts`**: `patient_profile_id`, `qualified_at`, `qualified_by`, `converted_at`, `converted_by`, com `check` de coerência (`patient_profile_id` e `converted_at` andam juntos, sempre).

### Deduplicação

`findDuplicateLeads` em [`lead.ts`](../src/modules/crm/lead.ts) confere telefone e e-mail **normalizados** — `(11) 97903-7133`, `+55 11 97903-7133` e `11979037133` são a mesma pessoa.

**Nunca bloqueia cegamente.** Mostra as correspondências e por que casaram; quem decide é gente. Nome igual é pista fraca, nunca prova — homônimo não é duplicata.

Os índices de telefone e e-mail **não são UNIQUE de propósito**: duplicidade de lead é um fato do mundo real (a mesma pessoa escreve pelo site e pelo WhatsApp) e deve chegar a um humano, não ser rejeitada pelo banco.

### Divisão de privilégio na conversão

A chave de serviço **executa** (criar conta de autenticação, conceder papel), mas **não decide**. A autorização roda no banco sob a identidade real de quem clicou. Se a pessoa não podia converter, o banco recusa mesmo com a conta já criada — porque **conversão é o vínculo, não a conta**.

---

## 4. Painel executivo do Administrador

[`/admin`](../src/app/admin/page.tsx), com filtro de período (7/30/90 dias/tudo).

### A regra que sustenta o painel

**Zero e "não sei" não são a mesma coisa.** Zero afirma algo sobre o mundo ("não há Cases atrasados"); `null` afirma algo sobre nós ("não conseguimos ler"). Cada consulta falha sozinha e vira `null`; o cartão mostra **"Informação indisponível"**, nunca 0.

`documentosPendentes` é `null` **de propósito**: `patient_documents` guarda documentos enviados, não pendentes. Não existe no domínio a noção de "faltando". Derivar um número dali seria inventar.

### Indicadores

Aquisição · Operação · Pendências e atrasos · Tempo médio — 14 indicadores, todos com fonte real.

### Gráficos

Cada um responde **uma pergunta de negócio** — o campo é obrigatório em `ChartFrame`, então não dá para acrescentar um gráfico decorativo sem antes escrever para que ele serve.

| Gráfico | Pergunta |
|---|---|
| Funil operacional | Onde a operação está perdendo gente? |
| Evolução no período | Estamos melhorando ou piorando? |
| Cases por responsável | A carga está distribuída, ou concentrada? |
| Cases por etapa | Onde os Cases estão empilhando? |
| Origem dos leads | Qual canal traz gente de verdade? |
| Pessoas por papel | A operação tem gente em cada nível? |

SVG e CSS puros, sem biblioteca. Sem JavaScript no cliente. **Nada depende só de cor**: cada barra traz o número escrito ao lado e cada série da linha tem traço próprio. Toda visualização tem a mesma informação em tabela, sob "Ver como tabela".

O funil mostra a **queda percentual entre degraus** — o número absoluto sozinho não diz onde está o vazamento.

"Sem responsável" aparece sempre, inclusive em zero: é o número que precisa doer quando cresce.

### Alerta de acúmulo de níveis

O painel avisa quando alguém acumula mais de um nível operacional: *"O Case passa de nível sem trocar de gente — a separação existe no sistema, mas não na prática."*

**Hoje isso aparece**: uma única pessoa tem `administrador + curador_medico + concierge`.

---

## 5. Testes — 12 dos 15

| # | O que prova | Estado |
|---|---|---|
| 1 | Administrador cria Patient administrativamente | ✅ fluxo pré-existente |
| 2 | Atendente converte lead qualificado | ✅ SQL + unitário |
| 3 | Lead não qualificado não converte sem exceção | ✅ SQL + unitário |
| 4 | Conversão preserva origem e histórico | ✅ SQL + unitário |
| 5 | Conversão não cria duplicidade | ✅ SQL (conflito) + unitário |
| 6 | Patient pode ser vinculado a Case | ✅ estrutural |
| 7 | Atendente abre o Case | ✅ policy `cases_insert_atendente_curador_admin` |
| 8 | Administrador não é ator padrão | ✅ `isAdministrativeFallback` + alerta no painel |
| 9 | Painel exibe dados reais | ✅ repositório contra produção |
| 10 | Funil reflete o fluxo real | ✅ 7 degraus, só encolhe |
| 11 | Gráficos respeitam filtro de período | ✅ |
| 12 | Estado vazio funciona | ✅ vazio × indisponível distintos |
| 13 | Sem permissão não acessa indicadores | ✅ `requireRole("administrador")` |
| 14 | Alternativa textual dos gráficos | ✅ tabela em `<details>` + `aria-label` |
| 15 | Mobile sem overflow | 🟡 **não verificado — ver §6** |

**855 testes** no total (+37), `tsc` limpo, lint limpo, build limpo.

Todo teste de SQL rodou em transação revertida. Estado final conferido: **0 leads convertidos, papéis intactos, 1 registro de auditoria (o pré-existente de smoke test)**.

---

## 6. O que não consegui verificar

**O painel não foi aberto no navegador.** `/admin` exige login, e eu não insiro credenciais. O servidor sobe, compila e redireciona corretamente para `/login?next=/admin`, mas o teste 15 (mobile, overflow, legibilidade dos gráficos) e a conferência visual dos estados vazios dependem de uma sessão autenticada.

Para fechar: faça login no navegador e eu verifico em seguida — incluindo mobile, contraste e a tabela alternativa de cada gráfico.

**Não existe superfície de conversão.** As operações estão prontas e seguras no servidor (`qualifyLeadAction`, `convertLeadToPatientAction`), mas **nenhuma tela as chama**. Um Atendente não tem por onde trabalhar um lead. Essa é a próxima peça — e ela só faz sentido depois que existir um Atendente de verdade.

**Alteração em `.claude/launch.json`**: acrescentei `"autoPort": true`, porque a porta 3000 estava ocupada por outro processo. É config de desenvolvimento e não afeta produção.
