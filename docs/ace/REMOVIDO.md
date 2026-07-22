# Código removido — finalização Aliviar 2.0

## Arquivos eliminados

| Arquivo | Motivo |
|---------|--------|
| `src/infrastructure/analise/supabase-analise-repository.ts` | Adapter legado substituído por `improvedAceAnaliseAdapter` |

## Pipeline eliminado

- Criação direta de `journey_events` (OBSERVATION) para análise inicial
- Avanço de projeção sem resultado estruturado ACE
- Ausência de persistência em `ace_analysis_runs`

## Substituto canônico

- `src/infrastructure/ace/improved-ace-service.ts` — `improvedAceService` + `improvedAceAnaliseAdapter`
- `src/infrastructure/ace/improved-ace-engine.ts` — `executarAceMelhorado()`
- Tabela `ace_analysis_runs` (migration `20260732180000_ace_melhorado.sql`)
