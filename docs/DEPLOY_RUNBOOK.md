# Production Deploy Runbook — V1.0.0

Runbook do deploy de produção. Não substitui a confirmação de infraestrutura no painel (backup/banco/env).

## Estado do Release Candidate

- RC: commit `8c99d4b`, tag **`v1.0.0`**, branch `main`, working tree limpo.
- CI: typecheck 0 · lint 0 · 650 testes · build 36/36.
- Remote de produção: `aliviar` → `github.com/barbosacaiopadilha-star/Aliviar-2.0.git`.
- **Fast-forward confirmado** (GATE 1): `aliviar/main` (`452e073`) é ancestral de `v1.0.0` — push é fast-forward.

## Pré-deploy (operador)

- [ ] `git fetch aliviar` + `git merge-base --is-ancestor aliviar/main v1.0.0` → **OK** (já confirmado).
- [ ] Env de produção na Vercel: as 3 vars Supabase + `NODE_ENV=production` + `CLAUDE_API_KEY` (sem ela o ACE degrada; fallback fake é vedado em produção).
- [ ] Banco de produção Supabase correto; migrations aplicadas.
- [ ] **Backup validado** (snapshot antes do deploy).
- [ ] Vigília humana de logs definida (não há telemetria automática na V1).

## Sequência de publicação

```bash
git -C C:/Users/barbo/Projects/aliviar-conexao push aliviar main --tags
```

A integração git da Vercel dispara o deploy; confirmar no painel que o build partiu de `8c99d4b`/`v1.0.0` e chegou a **READY**.

## Pós-deploy (na URL de produção)

- [ ] `/` (PortalExperience) 200, sem asset quebrado
- [ ] `/login` 200 (calor ambiente/entrada da ADR-031)
- [ ] `/sua-historia` 200
- [ ] `/paciente` 200 após login
- [ ] health/logs sem erro; headers de segurança presentes
- [ ] registrar horário do deploy e o commit publicado

## Rollback

Redeploy do deployment anterior pelo painel Vercel (imediato) ou `git revert`/redeploy de `v1.0.0-landing`. Ver `RECOVERY.md`.
