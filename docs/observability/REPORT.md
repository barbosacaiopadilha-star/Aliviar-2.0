# EPIC-20 — Observabilidade Operacional

Relatório consolidado do programa de observabilidade, auditoria e recuperação.

## 1. Logs estruturados

- `src/infrastructure/observability/structured-log.ts`
- Campos: timestamp, correlationId, jornadaId, patientId, curatorId, operationType, durationMs, result, errorCode
- Sanitização: `sanitize-log-payload.ts` remove email, senha, base64 e strings longas
- Integração via `api/shared/observability/instrument-operation.ts`

## 2. Audit Trail

- Migration: `20260727180000_operational_audit_trail.sql`
- Tabela append-only: `operational_audit_events` (sem UPDATE/DELETE para authenticated)
- Repositório: `supabase-audit-trail.ts`
- Eventos: LOGIN, UPLOAD, JORNADA_ALTERADA, SESSAO_INICIO, OPCOES_REGISTRADAS, APROVACAO, PUBLICACAO, ESCOLHA_PACIENTE

## 3. Health Checks

- `GET /api/v1/health` — banco, storage, auth, migrations (tabelas), filas, config
- Relatório com status `ok | degraded | down` e latências

## 4. Recovery

- `src/infrastructure/observability/recovery.ts` — procedimentos por cenário
- `docs/observability/RECOVERY.md` — runbook operacional

## 5. Métricas

- Contratos: `src/observability-flow/contracts/operational-metrics.ts`
- Coleta: `metrics-collector.ts`
- Endpoint: `GET /api/v1/operacao/metricas`

## 6. Testes

- `src/infrastructure/observability/*.test.ts`

## 7. Autoauditoria

| Pergunta | Evidência |
|----------|-----------|
| O que aconteceu? | `operational_audit_events.event_type` + logs estruturados |
| Quando? | `occurred_at` / `timestamp` |
| Quem executou? | `actor_id` + `actor_role` (mascarado em logs) |
| Qual jornada? | `jornada_id` / `patient_id` |
| Como recuperar? | `recovery.ts` + `RECOVERY.md` |

## 8. Próximo programa

- Exportação de métricas para APM externo
- Alertas automáticos em SLA crítico
- Dashboard operacional (fora do escopo deste EPIC)

**OBSERVABILIDADE OPERACIONAL IMPLEMENTADA**
