# Recovery — Restauração de Produção

Sequência exata para restaurar a operação (ex.: falha às 3h). Complementa `OPERATIONS.md`/`RUNBOOK.md`; para deploy ver `DEPLOY_RUNBOOK.md`.

## Sequência

1. **Escopo (2 min):** `GET /` e `/login` respondem? Falha total ou parcial? Ver deployment atual e logs na Vercel; ver status do projeto Supabase.
2. **Deploy ruim (código):** rollback imediato = **redeploy do deployment anterior** pelo painel Vercel (instantâneo, sem git). Refúgio git: tags `v1.0.0-landing` / commit `d5a42f2`.
3. **Banco (Supabase):** o projeto está no plano free — **não há backup gerenciado nem PITR** (verificado em 25/08). O único ponto de recuperação é o dump lógico de `npm run backup:producao` (`scripts/backup-producao.mjs`: `curadoria`, `auth`, índice do storage e os bytes), com restauração ensaiada com sucesso em 08/08 (decisão D-13, por dump lógico). Restaurar exige duas passadas no DDL de `auth`/`storage` (antes e depois de `curadoria`) e a carga de dados com `session_replication_role = replica`. As migrations em `supabase/migrations/` são a fonte da verdade do schema; o ledger vai junto no dump.
4. **Env (auth quebra / leads respondem 503):** conferir no painel Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRM_SITE_LEAD_SECRET`. Precedente real de variável que chegava vazia em runtime: `INCIDENT_CLAUDE_API_KEY_PRODUCTION.md` *(a chave em si está aposentada desde 03/09; não há mais modelo a "cair em fake")*.
5. **Auth/sessão:** o middleware redireciona a `/login`; validar sessão Supabase.
6. **Congelar a operação:** pausar novos casos até estabilizar; **nenhum paciente fica sem retorno**.
7. **Registrar:** horário, sintoma, código do incidente (`error.digest`), ação, resultado — como uma linha `SIM-*` no `REGISTRO_UNICO_DE_ACHADOS.md` (o "log de incidentes do Command Center" nunca existiu como arquivo).
8. **Reabrir** só após smoke pós-recovery (`/`, `/login`, `/sua-historia`, `/paciente`, health/logs).

## Rollback disponível

- Redeploy Vercel do deployment anterior (imediato).
- Git: `v1.0.0-landing`, `v0.1.0-rc1`, commit `d5a42f2`. Nunca `--force`.
