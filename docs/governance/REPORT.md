# EPIC-21 — Governança Operacional

## 1. Configuração

Centralizada em `system_configuration` com SLA, limites de upload, manutenção e mensagens globais.

## 2. Usuários

Gestão via `profiles` — ativar/desativar e alterar função, sem exclusão.

## 3. RBAC

Mecanismo único em `src/lib/auth/rbac.ts` com matriz `PERMISSION_MATRIX`.

## 4. Feature Flags

Tabela `feature_flags` com enable/rollout; alterações auditadas.

## 5. Portal Administrativo

`/admin` consumindo exclusivamente `/api/v1/admin/*`.

## 6. Auditoria

`GET /api/v1/admin/auditoria` com filtros read-only.

## 7. Testes

`rbac.test.ts`, `feature-flags.test.ts`, `system-configuration.test.ts`, `admin-portal.test.ts`.

## 8. Autoauditoria

| Pergunta | Evidência |
|----------|-----------|
| Admin sem banco? | Sim — portal + API |
| Alterações auditáveis? | Sim — CONFIG/USUARIO/FLAG events |
| Config espalhada? | Não — `system_configuration` + fallbacks documentados |

## 9. Próximo programa

Integração de alertas e exportação de auditoria.

**GOVERNANÇA OPERACIONAL IMPLEMENTADA**
