# Aliviar 2.0 — Declaração de Conclusão

## 1. Inventário do legado

| LEGADO | SUBSTITUTO |
|--------|------------|
| `SupabaseAnaliseRepository` | `improvedAceAnaliseAdapter` |
| `journey_events` para análise | `ace_analysis_runs` |
| Projeção sem `ace_analise` | `extensoes.ace_analise` |
| Curador sem saída ACE | `AceAnaliseCuradorSurface` |
| Auditoria genérica | `ACE_ANALISE_INICIO` / `ACE_ANALISE_FIM` |

## 2. Migração

Pipeline único via `improvedAceService.executarParaJornada()`.

Triggers: `UPLOAD` (documentos em HISTORIA), `STAFF` (API analise-inicial), `SISTEMA`.

Adapter legado removido. Composition root usa exclusivamente `improvedAceAnaliseAdapter`.

## 3. Integração

| Módulo | Status |
|--------|--------|
| Jornada | `ace_analise` na projeção, avanço pós-análise |
| Workflow | Filas derivam de etapa pós-ACE |
| Portal Paciente | `mapAceExperienceModel` com resumo ACE |
| Portal Curador | `obterAnaliseParaCurador()` + surface dedicada |
| Comunicação | Notificações independentes do pipeline ACE |
| Observabilidade | Audit com version, executionId, correlationId, duration |
| Governança | RLS em `ace_analysis_runs` |
| Administração | Sem dependência do ACE legado |

## 4. Versão

Cada execução registra:

- `ace_version` (2.0.0)
- `execution_id` (= run id)
- `correlation_id`
- `duration_ms`
- `status`
- `iniciado_em` / `concluido_em`

Metadados de auditoria sem conteúdo clínico sensível.

## 5. Limpeza

Ver `docs/ace/REMOVIDO.md`.

## 6. Validação

- `typecheck`, `lint`, `test`, `build`: executados
- `validation:e2e`: requer `SUPABASE_SERVICE_ROLE_KEY` + servidor local
- `smoke-e2e.test.ts`: fluxo Upload → ACE → Curador → Entrega → Escolha → Relacionamento
- `ace-legacy-audit.test.ts`: zero referências ao adapter legado

## 7. Autoauditoria

**Aliviar 2.0 totalmente migrada?** Sim.

**Referência ao ACE legado?** Não — `SupabaseAnaliseRepository` removido.

**Pipeline paralelo?** Não — um engine, um service, um adapter.

**Tela com dados antigos?** Não — curador e paciente consomem `ace_analise` / `ace_analysis_runs`.

## 8. Conclusão

A plataforma Aliviar 2.0 opera exclusivamente com o ACE Melhorado v2.0.0.

Nenhuma funcionalidade nova foi adicionada nesta fase — apenas finalização, limpeza e validação.
