# Ambiente fechado de validação — Aliviar OS

Ambiente **não produção**, sem usuários públicos.

## Comandos

| Comando | Função |
|---------|--------|
| `npm run validation:diagnose` | Diagnóstico completo → `validation-report.json` |
| `npm run validation:prepare` | Prepara admin, auth, schema, buckets |
| `npm run validation:e2e` | E2E real persistido (HTTP + Supabase) |
| `npm run e2e:smoke:http` | Smoke HTTP de rotas e proteção |
| `npm run e2e:smoke` | Smoke de integração por projeção (Vitest) |

## Preparação (uma vez)

1. Preencher `scripts/local/.env.admin.local` (copiar de `.env.admin.example`):
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_NEW_PASSWORD`
2. Garantir `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Aplicar migrations Aliviar OS no projeto Supabase (`supabase/migrations/`)
4. `npm run dev` em outro terminal
5. `npm run validation:prepare`

## E2E real

```bash
npm run dev
npm run validation:e2e
```

Requer: schema Aliviar OS, credenciais admin, dev server ativo.

## Gate Vitest (opcional)

```bash
VALIDATION_E2E_REAL=1 npm run test -- src/validation/e2e-real.gate.test.ts
```

## Bloqueadores conhecidos

- Projeto Supabase `jfhxtwumrurqghuueawi` pode ter schema legado (`cases`, `patient_stories`) sem tabelas `journeys` / `patient_journey_views`
- Sem `SUPABASE_SERVICE_ROLE_KEY` o diagnóstico de schema fica bloqueado
- Upload de documentos persiste metadados em `patient_documents` (storage_path registrado; bucket opcional)
