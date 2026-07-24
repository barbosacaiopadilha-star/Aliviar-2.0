# RC-01 — Production Gate

Gate de produção para garantir que a plataforma AliCIA compila, tipa e testa integralmente.

**Data:** 2026-07-23  
**Escopo:** `src/infrastructure/persistence/` e bloqueadores de build/typecheck/test

---

## Causa raiz

### 1. Persistence — erros de TypeScript (já resolvidos no branch)

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `repositories/supabase-journey-bootstrap-port.ts` | Import inválido `./persistence-clocks` | `ClockPort` importado de `@/journey-handoff/ports/handoff-ports` |
| `repositories/supabase-snapshot-repositories.ts` | `patientId` inexistente em `CurationProcessSnapshot` | Campo corrigido para `journeyId` |
| `repositories/supabase-snapshot-repositories.ts` | Comparação com status `"ARCHIVED"` fora do union | Condição removida; filtro usa apenas `COMPLETED` e `CANCELLED` |
| `create-persistence-stack.ts` | `SupabaseReportRepository` incompatível com `InMemoryReportRepository` nos lookups | Tipos dos adapters de lookup alinhados ao repositório Supabase |
| `curator-workspace-runtime.ts` | `access.profile.email` inexistente no tipo `Profile` | `email: null` passado explicitamente ao stack |

### 2. Testes — timeout em verification studio adapter

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `verification/__tests__/modules-coverage.test.ts` | `getVerificationCenterSnapshot({ refresh: true })` usa conectores reais e excede 5s no suite completo | Timeout aumentado para 30s (mesmo padrão de `operations/__tests__/modules-coverage.test.ts`) |

### 3. Lint — código morto em persistence

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `create-persistence-stack.ts` | `resolvedIdentity` atribuído mas não usado | Chamada mantida (`resolveIdentity`), variável removida |
| `repositories/supabase-snapshot-repositories.ts` | Import `randomUUID` não utilizado | Import removido |

---

## Arquivos alterados neste RC

```
src/infrastructure/persistence/create-persistence-stack.ts
src/infrastructure/persistence/repositories/supabase-snapshot-repositories.ts
src/alicia/verification/__tests__/modules-coverage.test.ts
docs/alicia/RC01_PRODUCTION_GATE.md
```

**Nota:** Os fixes de persistence listados na seção 1 já estavam presentes no working tree. Este RC documenta o estado e aplica apenas os ajustes finais de lint + timeout de teste.

---

## Impacto

- **Comportamento funcional:** inalterado
- **Motores AliCIA:** Discovery, Connectors, Evidence, Protocol, Publication, Workflow, Verification, Factory, Studio — sem alteração de runtime
- **Persistence:** apenas limpeza de imports/variáveis mortas
- **Testes:** timeout alinhado ao padrão existente (operations); nenhuma mudança em lógica de verificação

---

## Validação

Todos os gates obrigatórios passam:

```bash
npm run lint        # ✓ 0 errors
npm run typecheck   # ✓ 0 errors
npm run build       # ✓ 82 rotas geradas
npm test            # ✓ 819 passed, 7 skipped
```

---

## Restrições respeitadas

- Nenhuma funcionalidade nova
- Nenhum motor alterado (runtime)
- Sem commit, sem push
- Parado para revisão
