# CRM Aliviar — Migration

## Arquivo

`supabase/migrations/20260724190000_crm_operational_foundation.sql`

## Aplicar localmente

```bash
npm run supabase:reset
```

ou, em ambiente já inicializado:

```bash
npx supabase migration up
```

## Aplicar em produção

1. Revisar a migration no PR.
2. Executar via pipeline Supabase ou `supabase db push` com credenciais do projeto.
3. Conceder papel `concierge` aos usuários operacionais (ver `docs/crm/PERMISSIONS.md`).
4. Validar acesso em `/admin/crm`.

## Tabelas criadas

- `curadoria.crm_contacts`
- `curadoria.crm_cases`
- `curadoria.crm_interactions`
- `curadoria.crm_tasks`
- `curadoria.crm_appointments`
- `curadoria.crm_audit_log`

## Bloqueador conhecido

Se `curadoria.has_role` ou `curadoria.set_updated_at` não existirem no banco alvo, as migrations anteriores do schema `curadoria` precisam estar aplicadas antes desta.
