# Production Deploy Runbook — V1.0.0

Runbook do deploy de produção. Não substitui a confirmação de infraestrutura no painel (backup/banco/env).

> **Estado em 2026-09-03.** Este é o runbook do release candidate `v1.0.0` de julho, mantido como registro (a auditoria `REL-02` no registro de achados apontou afirmações desatualizadas nele). Hoje a publicação é o `git push` de `main` para `origin` (`github.com/barbosacaiopadilha-star/aliviar.git`): a Vercel constrói a partir de `main`, e a integração GitHub do Supabase aplica no ato qualquer migration que o push carregue (`SIM-97`) — push é produção, nas duas pontas. Autorização explícita do Fundador antes de cada push (`docs/AGENTS.md`). O motor ACE saiu do produto em 21/08 e `CLAUDE_API_KEY` está aposentada desde 03/09.

## Estado do Release Candidate *(histórico — julho de 2026)*

- RC: commit `8c99d4b`, tag **`v1.0.0`**, branch `main`, working tree limpo.
- CI: typecheck 0 · lint 0 · 650 testes · build 36/36.
- Remote de produção: `aliviar` → `github.com/barbosacaiopadilha-star/Aliviar-2.0.git`.
- **Fast-forward confirmado** (GATE 1): `aliviar/main` (`452e073`) é ancestral de `v1.0.0` — push é fast-forward.

## Pré-deploy (operador)

- [ ] `git fetch aliviar` + `git merge-base --is-ancestor aliviar/main v1.0.0` → **OK** (já confirmado).
- [ ] Env de produção na Vercel: as 3 vars Supabase + `CRM_SITE_LEAD_SECRET` (sem ela o endpoint de leads responde 503). `NODE_ENV` é do runtime, não se cadastra. *(histórico: `CLAUDE_API_KEY`, "sem ela o ACE degrada" — não há mais modelo.)*
- [ ] Banco de produção Supabase correto; migrations aplicadas.
- [ ] **Backup validado** (snapshot antes do deploy).
- [ ] Vigília humana de logs definida (não há telemetria automática na V1).

## Sequência de publicação

```bash
git -C "C:/Users/barbo/OneDrive/Desktop/PROJETOS DO CLAUDE/aliviar" push origin main
```

A integração git da Vercel dispara o deploy; confirmar no painel que o build partiu do commit publicado e chegou a **READY**. Se o push carregou migration, conferir também o ledger de produção (`supabase_migrations.schema_migrations`) — ela já entrou. *(histórico: o comando original empurrava a tag `v1.0.0` do caminho antigo `Projects/aliviar-conexao` para o remoto `aliviar`; base e remoto mudaram em 26/08.)*

## Pós-deploy (na URL de produção)

- [ ] `/` (PortalExperience) 200, sem asset quebrado
- [ ] `/login` 200 (calor ambiente/entrada da ADR-031)
- [ ] `/sua-historia` 200
- [ ] `/paciente` 200 após login
- [ ] health/logs sem erro; headers de segurança presentes
- [ ] registrar horário do deploy e o commit publicado

## Rollback

Redeploy do deployment anterior pelo painel Vercel (imediato) ou `git revert`/redeploy de `v1.0.0-landing`. Ver `RECOVERY.md`.
