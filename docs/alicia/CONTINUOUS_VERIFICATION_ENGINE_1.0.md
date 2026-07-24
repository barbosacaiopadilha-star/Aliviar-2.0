# Continuous Verification Engine 1.0 — AliCIA

Mecanismo de revalidação contínua dos perfis publicados, garantindo compatibilidade com o Protocolo ao longo do tempo.

**Versão:** 1.0  
**Localização:** `src/alicia/verification/`

---

## Princípio central

Um perfil publicado **não permanece válido por inferência temporal**. A plataforma revalida periodicamente comparando a versão publicada com fontes atuais (via Connectors) e reavaliando pelo Protocol Engine.

Nunca publica diretamente — a decisão final segue o fluxo existente via Event Bus.

---

## Arquitetura

```
Verification Planner → seleciona perfis
        │
Verification Runner
        │
   Connectors (mock)
        ↓
   Evidence (construída internamente)
        ↓
   Protocol Engine (avaliação)
        ↓
   Change Detector (comparação)
        ↓
   Verification Decision
        ↓
   Event Bus → ProfileChanged / ReviewCaseCreated / PublicationRequested
```

---

## Módulos

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Scheduler | `scheduler.ts` | Frequências DAILY/WEEKLY/MONTHLY/ON_DEMAND |
| Planner | `planner.ts` | Seleção de perfis para reavaliação |
| Runner | `verification-runner.ts` | Orquestra Connectors → Evidence → Protocol |
| Change Detector | `change-detector.ts` | Compara campos e classifica mudanças |
| Decision | `verification-decision.ts` | VERIFIED / UPDATE_REQUIRED / REVIEW_REQUIRED / UNPUBLISH_RECOMMENDED |
| History | `verification-history.ts` | Registro append-only |
| Metrics | `verification-metrics.ts` | Observabilidade operacional |
| Engine | `verification-engine.ts` | Orquestrador principal |
| Bus Bridge | `integration/verification-bus-bridge.ts` | Integração via Event Bus |

---

## Scheduler

Cada perfil possui:

| Campo | Descrição |
|-------|-----------|
| `lastVerifiedAt` | Última verificação concluída |
| `nextVerificationAt` | Próxima verificação agendada |
| `verificationFrequency` | DAILY / WEEKLY / MONTHLY / ON_DEMAND |

---

## Planner — Critérios de seleção

- Tempo desde última verificação
- Mudança em fonte
- Nova evidência disponível
- Publicação recente
- Perfil nunca revisado
- Verificação sob demanda

---

## Change Detector — Classificação

| Classificação | Critério |
|---------------|----------|
| `NO_CHANGE` | Nenhum campo alterado |
| `MINOR_CHANGE` | Alteração em localização ou campos não materiais |
| `MATERIAL_CHANGE` | CRM, RQE, especialidade, residência, instituições ou status |
| `CONFLICT` | CRM divergente ou status inativo |

Campos comparados: CRM, RQE, instituições, residência, especialidade, localização, fontes, status.

---

## Verification Decision

| Resultado | Quando |
|-----------|--------|
| `VERIFIED` | Sem mudanças ou mudança leve aceitável |
| `UPDATE_REQUIRED` | Mudança material com AUTO_PUBLISH |
| `REVIEW_REQUIRED` | Pendências do Protocolo ou mudança material sem AUTO_PUBLISH |
| `UNPUBLISH_RECOMMENDED` | Conflito ou REJECT do Protocolo |

---

## Eventos (via Event Bus)

| Evento | Descrição |
|--------|-----------|
| `VerificationRequested` | Verificação solicitada |
| `VerificationStarted` | Execução iniciada |
| `VerificationCompleted` | Verificação concluída |
| `VerificationFailed` | Falha na execução |
| `ProfileChanged` | Mudança detectada |
| `ReviewRequested` | Revisão humana necessária |

### Fluxo de integração

```
VerificationRequested
        ↓
VerificationCompleted
        ↓
ProfileChanged (se houver mudança)
        ↓
ReviewCaseCreated  ou  PublicationRequested
```

A integração ocorre via `VerificationBusBridge` — o Workflow Engine existente **não é modificado**.

---

## Histórico

Registro append-only com:

- quem verificou
- quando
- o que mudou
- versão anterior e nova
- fontes consultadas
- decisão e classificação

Nunca apaga registros.

---

## Métricas

- Perfis verificados
- Sem mudanças
- Mudanças leves
- Mudanças materiais
- Conflitos
- Tempo médio
- Taxa de atualização
- Fila pendente

---

## Studio — Verification Center

Rota: `/alicia/studio/verification`

Somente leitura. Exibe:
- fila de verificações
- últimas verificações
- mudanças detectadas
- revisão pendente
- histórico completo

---

## API pública

```typescript
import {
  VerificationEngine,
  VerificationBusBridge,
  getVerificationCenterSnapshot,
} from "@/alicia/verification";
```

---

## Testes

```bash
npm run test:verification
```

Cobertura mínima: 95%.

---

## Limitações (MVP)

- Sem IA ou inferência
- Sem APIs reais
- Sem persistência (in-memory)
- Connectors mockados
- Workflow Engine não modificado — bridge independente
- Evidence construída internamente pelo runner (não altera Evidence Engine)

---

## Integração futura

1. Substituir mocks por perfis reais do catálogo publicado
2. Conectar Evidence Engine via Event Bus (sem chamada direta)
3. Persistir histórico e agendamentos
4. Alertas operacionais para UNPUBLISH_RECOMMENDED

---

## Restrições respeitadas

- Nenhuma IA ou inferência
- Nenhuma API real
- Nenhum banco novo
- Protocolo inalterado
- Motores existentes inalterados funcionalmente
- UX pública inalterada
