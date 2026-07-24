# Homologação B6 — GO formal para Shadow Launch

**Data:** 2026-07-24  
**Projeto Supabase:** `awdlmeykminwyifnygkm`  
**Branch homologada:** `release/v1.0.0-beta` (`00a0ff8`)  
**Branch de integração:** `release/b6-shadow-launch` → `main`

## Decisão

**GO** — fluxo Mesa → Dossiê → Portal → Devolutiva → Escolha validado com autenticação real, RLS e banco de produção.

## Evidências E2E

| Suite | Resultado | Jornada | Etapas |
|-------|-----------|---------|--------|
| B6 (`validate-e2e-curadoria-b6.mjs`) | `SUCESSO:SIM` | `c1965b84-5a6c-4a28-a0dd-e8cf9bda0f9a` | 22/22 |
| E2E real (`validate-e2e-real.mjs`) | `SUCESSO:SIM` | `6d7e7fbd-e09e-42fc-bcb5-e2d788c86ab3` | 14/14 |

## Cenários validados

- Admin, Curador e Paciente autenticados
- Curadoria completa: mesa → dossiê → aprovar → publicar
- Portal do Paciente com 3 opções
- Devolutiva e conclusão
- Escolha do paciente com reconstrução em `patient_curadoria_decisions`
- Outcome `CHOSEN` (constraint `decision_outcome_coherent`)

## Qualidade (release homologada)

| Check | Resultado |
|-------|-----------|
| Typecheck | ✅ |
| Lint | ✅ |
| Build | ✅ |
| Testes unitários | ✅ 873 passed |

## Integração cirúrgica em `main`

A branch `main` do repositório **Aliviar-2.0** já implementa o fluxo equivalente em `src/modules/curadoria/` (server actions + portais autenticados). Esta PR **não** substitui a arquitetura de produção.

Entregas desta integração:

1. Relatório formal de homologação (este documento)
2. Scripts operacionais em `scripts/local/` (homologação e admin)
3. Correção idempotente em `registerPatientDecision` (retry seguro na escolha)

Os scripts `validate-e2e-curadoria-b6.mjs` e `validate-e2e-real.mjs` exercitam rotas `/api/v1/*` da stack homologada (`release/v1.0.0-beta`). Em `main`, o fluxo equivalente é exercitado pelos portais e server actions — não pelas mesmas rotas HTTP.

## Restrições respeitadas

- Nenhuma funcionalidade nova
- Método, AliCIA e UX inalterados
- Sem merge de históricos não relacionados
- Sem force push ou reset destrutivo

## Próximo passo

Aguardar CI verde e autorização do Fundador para merge e deploy Shadow Launch.
