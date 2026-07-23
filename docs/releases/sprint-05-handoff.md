# Sprint 05 — HANDOFF

**Epic:** Plataforma Aliviar · **Missão:** Eliminar a fronteira entre experiência pública e plataforma  
**Data:** 2026-07-22

## Objetivo

A experiência pública termina. A plataforma começa. O visitante nunca percebe a mudança.

## Entregas

| Capacidade | Status |
|---|---|
| Journey Handoff (H01) | ✅ |
| Visitor Intention (H02) | ✅ |
| Journey Bootstrap (H03) | ✅ |
| Narrative Mapping (H04) | ✅ |
| Handoff Events (H05) | ✅ |
| Portal Continuation Projection (H06) | ✅ |
| Testes (H07) | ✅ |

## Arquitetura

Pacote `src/journey-handoff/` — `@/journey-handoff`.

```
journey-handoff/
├── model/           # Handoff, Intention, PublicChapter, Bootstrap
├── events/          # HANDOFF_STARTED, HANDOFF_COMPLETED, JOURNEY_BOOTSTRAPPED
├── projection/      # Narrative mapping + portal continuation
├── ports/           # Repositórios e bootstrap
├── services/        # start, complete, bootstrap, project
├── infrastructure/  # In-memory para testes
└── api/             # Contratos e handlers internos (sem rotas)
```

### Fluxo

```
Landing / Conversa (pública)
        ↓
  JourneyHandoff + Intention
        ↓
  Narrative Checkpoint
        ↓
  Bootstrap → Case + Patient + Journey + Ownership
        ↓
  PortalContinuation (resumeAt — nunca reinicia)
```

**Regra:** Journey nasce do handoff. Nunca o contrário.

## Eventos

- `HANDOFF_STARTED`
- `HANDOFF_COMPLETED`
- `JOURNEY_BOOTSTRAPPED`

## RC

```bash
npm run journey-handoff:rc
npm run test
npm run lint
npm run build
```

## Critério de aceite

- Experiência pública termina sem ruptura
- Plataforma continua exatamente do checkpoint narrativo
- `shouldRestartExperience` é sempre `false`
