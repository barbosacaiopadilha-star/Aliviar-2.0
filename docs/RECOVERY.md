# Recovery — Restauração de Produção

Sequência exata para restaurar a operação (ex.: falha às 3h). Complementa `OPERATIONS.md`/`RUNBOOK.md`; para deploy ver `DEPLOY_RUNBOOK.md`.

## Sequência

1. **Escopo (2 min):** `GET /` e `/login` respondem? Falha total ou parcial? Ver deployment atual e logs na Vercel; ver status do projeto Supabase.
2. **Deploy ruim (código):** rollback imediato = **redeploy do deployment anterior** pelo painel Vercel (instantâneo, sem git). Refúgio git: tags `v1.0.0-landing` / commit `d5a42f2`.
3. **Banco (Supabase):** se corrompido, **restaurar do backup gerenciado** (painel Supabase → Backups). As migrations em `supabase/migrations/` são a fonte da verdade do schema.
4. **Env (ACE cai em fake / auth quebra):** conferir no painel Vercel `CLAUDE_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Precedente real: `INCIDENT_CLAUDE_API_KEY_PRODUCTION.md`.
5. **Auth/sessão:** o middleware redireciona a `/login`; validar sessão Supabase.
6. **Congelar a operação:** pausar novos casos até estabilizar; **nenhum paciente fica sem retorno**.
7. **Registrar:** horário, sintoma, código do incidente (`error.digest`), ação, resultado — no log de incidentes do Command Center.
8. **Reabrir** só após smoke pós-recovery (`/`, `/login`, `/sua-historia`, `/paciente`, health/logs).

## Rollback disponível

- Redeploy Vercel do deployment anterior (imediato).
- Git: `v1.0.0-landing`, `v0.1.0-rc1`, commit `d5a42f2`. Nunca `--force`.
