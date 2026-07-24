# AliCIA — DEPLOY AUTOMATION

**Comando único de publicação:**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release/release.ps1
```

Ou via npm:

```powershell
npm run release
```

---

## O que o pipeline faz

O script `scripts/release/release.ps1` executa **automaticamente**, nesta ordem:

| # | Etapa | Script |
|---|-------|--------|
| 1 | Validar ambiente (git, node, npm, gh) | `scripts/ci/validate-environment.ps1` |
| 2 | Validar Git (working tree limpa) | `scripts/ci/validate-git.ps1` |
| 3 | Validar branch de release | `scripts/ci/validate-branch.ps1` |
| 4 | Validar tags | `scripts/ci/validate-tags.ps1` |
| 5 | Validar release (base + Studio) | `scripts/ci/validate-release.ps1` |
| 6 | Validar Studio bloqueado | `scripts/ci/validate-studio.ps1` |
| 7 | Validar catálogo (34 perfis) | `scripts/ci/validate-catalog.ps1` |
| 8 | Validar documentação | `scripts/ci/validate-docs.ps1` |
| 9 | test + lint + typecheck + build | `scripts/ci/validate-*.ps1` |
| 10 | Autenticação GitHub | pausa se necessário |
| 11 | Criar repo (se não existir) + push + tags | automático |
| 12 | Aguardar deploy Vercel | `scripts/vercel/wait-deploy.ps1` |
| 13 | Smoke test produção | `scripts/vercel/smoke-production.mjs` |
| 14 | Abrir Pull Request | `gh pr create` (sem merge) |

### Única intervenção humana permitida

Se `gh` não estiver autenticado, o pipeline **para** e mostra:

```
Execute:
gh auth login
e pressione ENTER.
```

Após pressionar ENTER, **continua automaticamente**.

---

## Estrutura de scripts

```
scripts/
├── release/
│   ├── release.ps1           ← comando único
│   ├── rollback.ps1
│   ├── verify-production.ps1
│   ├── release-config.json   ← configuração central
│   ├── lib/common.ps1
│   └── reports/              ← relatórios JSON gerados
├── ci/
│   ├── validate-environment.ps1
│   ├── validate-git.ps1
│   ├── validate-branch.ps1
│   ├── validate-tags.ps1
│   ├── validate-release.ps1
│   ├── validate-studio.ps1
│   ├── validate-catalog.ps1
│   ├── validate-docs.ps1
│   ├── validate-build.ps1
│   ├── validate-tests.ps1
│   ├── validate-lint.ps1
│   └── validate-typecheck.ps1
└── vercel/
    ├── wait-deploy.ps1
    └── smoke-production.mjs
```

---

## Como publicar

### Pré-requisitos (uma vez)

1. Instalar [GitHub CLI](https://cli.github.com/): `winget install GitHub.cli`
2. Estar na branch `release/v1.0.0-beta`
3. Working tree limpa (sem alterações não relacionadas)

### Publicar

```powershell
cd "C:\Users\barbo\Downloads\Aliviar Cursor"
git checkout release/v1.0.0-beta
npm run release
```

### Flags opcionais

```powershell
# Pular build (se já validado)
powershell -File scripts/release/release.ps1 -SkipBuild

# Apenas validar + push (sem aguardar deploy)
powershell -File scripts/release/release.ps1 -SkipDeployWait

# Sem abrir PR
powershell -File scripts/release/release.ps1 -SkipPr
```

---

## Como validar produção

```powershell
npm run release:verify
```

Ou:

```powershell
powershell -File scripts/release/verify-production.ps1
```

Com URL customizada:

```powershell
powershell -File scripts/release/verify-production.ps1 -ProductionUrl "https://aliviar-app.vercel.app"
```

### O que é verificado

- `/alicia`, `/alicia/mapa`, `/alicia/metodologia` → 200
- `/alicia/studio`, `/alicia/studio/inbox` → **404** (bloqueado)
- `/login` → 200
- `/robots.txt`, `/sitemap.xml` → 200
- Headers Vercel / metadata

Relatório salvo em `scripts/release/reports/verify-production-*.json`.

---

## Como voltar (rollback)

### Simular rollback (sem alterar nada)

```powershell
npm run release:rollback -- -DryRun
```

### Executar rollback Git local

```powershell
npm run release:rollback
```

Por padrão, volta para tag `v0.1.0-rc1`. Tag customizada:

```powershell
powershell -File scripts/release/rollback.ps1 -TargetTag v1.0.0-beta
```

### Rollback em produção (Vercel)

1. Vercel Dashboard → **Deployments**
2. Selecionar deployment estável anterior
3. **Promote to Production**

O script `rollback.ps1` **não faz force-push** automaticamente — requer aprovação explícita.

---

## Como repetir

1. Corrigir o problema identificado no relatório em `scripts/release/reports/`
2. Commitar na branch `release/v1.0.0-beta` (se necessário)
3. Executar novamente: `npm run release`

---

## Validar scripts individualmente

Cada validação pode ser executada isoladamente:

```powershell
powershell -File scripts/ci/validate-git.ps1
powershell -File scripts/ci/validate-branch.ps1
powershell -File scripts/ci/validate-tags.ps1
powershell -File scripts/ci/validate-release.ps1
powershell -File scripts/ci/validate-studio.ps1
powershell -File scripts/ci/validate-catalog.ps1
powershell -File scripts/ci/validate-docs.ps1
powershell -File scripts/ci/validate-tests.ps1
powershell -File scripts/ci/validate-lint.ps1
powershell -File scripts/ci/validate-typecheck.ps1
powershell -File scripts/ci/validate-build.ps1
```

---

## Configuração

Editar `scripts/release/release-config.json`:

| Campo | Descrição |
|-------|-----------|
| `releaseBranch` | Branch de release (`release/v1.0.0-beta`) |
| `releaseTag` | Tag principal (`v1.0.0-beta`) |
| `releaseBaseCommit` | Commit base aprovado (`8536bc6`) |
| `repoName` | Nome do repositório GitHub |
| `productionUrl` | URL pública Vercel |
| `catalogMinProfiles` | Mínimo de perfis no catálogo (34) |

---

## Vercel

O pipeline **não altera** configuração Vercel automaticamente.

Após o primeiro push:

1. Conectar repositório em [vercel.com/new](https://vercel.com/new)
2. Production Branch: `release/v1.0.0-beta` (ou `main` após merge do PR)
3. Variáveis obrigatórias:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

O script `wait-deploy.ps1` aguarda `/alicia` retornar HTTP 200.

---

## Relatórios

Todos os relatórios JSON são salvos em:

```
scripts/release/reports/
```

Tipos:

- `release-*.json` — execução completa
- `release-FAILED-*.json` — falha com detalhes
- `verify-production-*.json` — smoke test
- `smoke-production-*.json` — detalhes HTTP
- `rollback-*.json` — rollback executado

---

## O que NÃO é alterado

Este pipeline **não modifica**:

- Produto AliCIA (catálogo, UX, Discovery, Protocolo)
- Studio (apenas valida bloqueio em produção)
- Operação, Autoridade
- Código de aplicação (somente scripts de release)

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `gh auth login` pedido repetidamente | Executar `gh auth login` no **mesmo terminal** antes de `npm run release` |
| `Repository not found` | Pipeline cria repo automaticamente após auth |
| `dirty_working_tree` | `git stash` ou commitar/descartar alterações |
| `wrong_branch` | `git checkout release/v1.0.0-beta` |
| Deploy timeout | Conectar Vercel ao repo; verificar branch de produção |
| Smoke 404 em `/alicia` | Deploy ainda não concluído ou branch errada na Vercel |

---

**Última atualização:** 23 de julho de 2026
