# Consolidação Estrutural — Banco → Schema → Migrations → Código → Testes → Portal

**2026-07-24.** Substitui a Missão 3 (cancelada). Nada commitado, nada em push, nada em deploy.

**O banco remoto (`aliviar-2-prod`, schema `curadoria`) é a única fonte de verdade.** Tudo abaixo foi alinhado a ele.

---

## 1. Migrations — de 2 para 24 arquivos, verificados por hash

O repositório tinha **2** arquivos de migration; produção tinha **35** aplicadas. As 33 ausentes incluíam toda a RLS do Case, a transferência auditada e a conversão de lead.

**Como foram recuperadas** — nunca por transcrição:

1. Função temporária `curadoria._export_migrations()` leu `supabase_migrations.schema_migrations` (removida ao fim, inclusive do histórico).
2. [`scripts/extract-remote-migrations.mjs`](../scripts/extract-remote-migrations.mjs) gravou cada statement em arquivo, banco → processo → disco.
3. **Cada arquivo conferido por md5 contra `md5(statements[1])` do banco. Os 24 são byte-a-byte idênticos ao que produção executou.**

Divisão respeitada: as **12 migrations do schema `public` são da AliCIA** e não entraram neste repositório. O arquivo local `20260724030000_stage8` (versão divergente da real `20260724023512`) foi substituído pelo extrato verificado.

## 2. Bug real encontrado e corrigido — RLS do Case

A reconstrução fiel expôs um defeito **meu**, da fase 3a, presente em produção:

As policies de `cases` usavam `can_access_case(id)`, que **reconsulta a tabela**. A função é `STABLE`: em `INSERT … RETURNING`, o snapshot dela ainda não contém a linha recém-inserida — o `EXISTS` devolve `false` e o RETURNING falha com violação de RLS. **Todo `.insert().select()` do supabase-js quebrava, mesmo para quem tinha permissão.** Os 133 testes de integração falhando em massa eram, em parte, este bug.

**Correção** — migration `20260724205002_case_rls_linha_propria_fix`, aplicada em produção e extraída para o repo (hash conferido): a policy da própria tabela avalia **as colunas da linha** (`has_role('administrador') or responsible_id = auth.uid() or assigned_curator_id = auth.uid()`). A regra de acesso não mudou em nada; mudou o mecanismo. `can_access_case()` permanece para as outras tabelas (`case_events`), onde a linha do Case já é visível no snapshot.

## 3. Schema local = produção, número a número

`supabase db reset` aplica os 24 arquivos do zero, sem erro:

| | Local | Produção |
|---|---|---|
| Tabelas | 47 | 47 |
| Funções | 40 | 40 |
| Triggers | 38 | 38 |
| Policies | 122 | 122 |
| Tabelas sem RLS | 0 | 0 |

Ajustes de ambiente que isso exigiu:
- `supabase/config.toml`: PostgREST local passa a expor `curadoria` (produção já expunha).
- `supabase/seed.sql` e `scripts/bootstrap-local-test-users.mjs`: falavam com `public.roles` — o catálogo da AliCIA. Migrados para `curadoria`.

## 4. Testes de integração — a divergência que ninguém via

Os 15 arquivos criavam o client **sem schema**: batiam no `public`. Ou seja, mesmo quando os 133 passavam, **passavam contra o banco de outro produto**.

Correção: [`tests/integration/curadoria-client.ts`](../tests/integration/curadoria-client.ts) — mesmo `db: { schema: "curadoria" }` dos clients de produção, mesma técnica de tipo do `admin.ts`. As 72 chamadas nos 15 arquivos usam o helper.

**Perigo evitado**: `.env.local` aponta para produção — rodar os testes com ele escreveria dados de teste no banco real. As variáveis locais são injetadas **inline** no ambiente do processo de teste (o `setup-env.ts` respeita o que já está definido); `.env.local` não foi tocado e as chaves de produção não foram sobrescritas.

## 5. Portal do Curador — zero mock

| Antes | Agora |
|---|---|
| Feed de atividade = `MOCK_ACTIVITY` (eventos falsos numa tela de produção) | [`portal/activity.ts`](../src/modules/curadoria/portal/activity.ts): `case_events` + `case_responsibility_changes`, nomes resolvidos numa consulta (sem N+1), RLS decide o que o Curador vê |
| Cabeçalho = persona "Helena Vasconcelos" | Identidade de quem está logado; o layout agora também exige `curador_medico` (fechava um vão: páginas exigiam papel, o layout renderizava para qualquer sessão) |
| `mock-data.ts` (544 linhas) + `case-card.tsx` órfão | **Apagados**, junto com o teste que validava o mock |

`cos/mock-records.ts` permanece: é fixture de teste unitário, não dependência de módulo.

## 6. Resultado das suítes

| Suíte | Resultado |
|---|---|
| `npm run test:integration` | ✅ **140/140** (eram 2 passando; 0 skipped) |
| `npm test` (unit) | ✅ 845 + 1 todo |
| `npm run test:components` | ✅ 185 |
| `npm run test:golden` | ✅ 1 |
| `tsc --noEmit` · lint · build | ✅ limpos |

**Total: 1.171 testes passando.** Pela primeira vez, os testes de integração provam o comportamento do **banco real do produto** — mesmo schema, mesmas policies, mesmas funções, mesmos triggers.

## 7. Tipos

Nenhum tipo gerado de banco existia nem passou a existir — o projeto tipa à mão nos módulos. O que a consolidação alinhou foi o **tipo do client**: os testes agora produzem o mesmo `SupabaseClient` (schema `curadoria`) que os repositórios declaram, sem cast fora do helper.

## 8. Estado de produção após a consolidação

- 2 Cases intactos · 36 migrations registradas · função de export removida
- Única mudança comportamental: a correção da RLS (§2) — regra idêntica, mecanismo correto

## 9. O que segue em aberto (fora do escopo desta missão)

1. Perfis operacionais separados (Atendente/Curador/Concierge reais) — depende de três e-mails
2. Validação autenticada no navegador (dashboard, mobile, superfície do Atendente)
3. Fixtures do CRM (4 registros de smoke test) — recomendação de apagar, aguarda autorização
4. Fases 3c/4 da unificação `crm_cases` → `cases`
