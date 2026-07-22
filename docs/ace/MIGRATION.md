# Migração ACE Legado → ACE Melhorado

## O que mudou

O pipeline legado registrava apenas um evento textual em `journey_events` sem resultado estruturado.

O ACE Melhorado (v2.0.0) persiste execuções em `ace_analysis_runs` e projeta resumo em `extensoes.ace_analise`.

## Compatibilidade de API

`POST /api/v1/jornadas/{jornadaId}/analise-inicial` mantém o mesmo contrato de entrada/saída.

Internamente delega ao `ImprovedAceService`.

## Rollback

Reverter migration `20260732180000_ace_melhorado.sql` e restaurar implementação anterior de `supabase-analise-repository.ts`.

## Verificação

```bash
npm run test -- src/infrastructure/ace/improved-ace.test.ts
npm run test -- src/validation/smoke-e2e.test.ts
```

Grep por `create_journey_event` em `supabase-analise-repository.ts` deve retornar zero resultados.
