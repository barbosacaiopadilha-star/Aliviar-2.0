# Publication Pipeline 1.0 — AliCIA

Transforma decisões `AUTO_PUBLISH` do Protocol Engine em publicações seguras, auditáveis, idempotentes e reversíveis no catálogo público.

**Versão:** 1.0  
**Protocolo base:** Protocol Engine 1.0 / Protocolo AliCIA 1.0  
**Localização:** `src/alicia/publication-pipeline/`

---

## Princípio central

`AUTO_PUBLISH` **não** significa publicar imediatamente. Significa que o candidato está **autorizado a entrar no pipeline automático de publicação**.

Toda publicação deve ser:

- validada (preflight);
- versionada (snapshots imutáveis);
- auditável (eventos append-only);
- idempotente (mesma decisão → mesmo resultado);
- verificável (post-publish verification);
- reversível (rollback sem apagar histórico).

---

## Fluxo obrigatório

```
ProtocolDecision (AUTO_PUBLISH)
        ↓
PublicationDraft          ← somente dados públicos
        ↓
PreflightValidation       ← READY_TO_PUBLISH | PUBLICATION_BLOCKED
        ↓
ImmutableSnapshot         ← antes de alterar catálogo
        ↓
Publish (atômico)
        ↓
PostPublishVerification   ← PUBLICATION_VERIFIED | PUBLICATION_INCONSISTENT
        ↓
Audit (append-only)
```

Em qualquer falha crítica:

- não publicar; **ou**
- executar rollback seguro; **e**
- criar Review Case no Studio.

---

## Módulos

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Draft Builder | `draft-builder.ts` | `DoctorCandidate` + `EvidenceReport` + `AUTO_PUBLISH` → `PublicationDraft` |
| Preflight Validator | `preflight-validator.ts` | Validações estruturais e de política antes da publicação |
| Snapshot | `snapshot.ts` | Cria snapshots imutáveis com hash determinístico |
| Update Classifier | `update-classifier.ts` | `NO_CHANGE` / `MINOR_UPDATE` / `MATERIAL_UPDATE` / `REVIEW_REQUIRED` |
| Publisher | `publisher.ts` | Publicação atômica com verificação de hash |
| Post-Publish Verifier | `post-publish-verifier.ts` | Confirma integridade após publicação |
| Rollback | `rollback.ts` | Restaura versão anterior preservando histórico |
| Audit | `audit.ts` | Trilha append-only de eventos |
| Pipeline | `pipeline.ts` | Orquestrador do fluxo completo |
| Repository | `infrastructure/in-memory-publication-repository.ts` | Persistência em memória (MVP) |

---

## Contratos principais

### Entrada (`PipelineInput`)

```typescript
{
  candidate: DoctorCandidate;
  evidence: Evidence[];
  decision: PublicationDecision; // outcome deve ser AUTO_PUBLISH
  protocolDecisionId: string;
  evidenceReportId: string;
}
```

### Saída (`PipelineResult`)

| Status | Significado |
|--------|-------------|
| `PUBLISHED` | Publicado e verificado |
| `ALREADY_PUBLISHED` | Idempotência — decisão já processada |
| `NO_CHANGE` | Payload idêntico ao publicado |
| `BLOCKED` | Preflight ou atualização bloqueada |
| `REJECTED` | Entrada não é AUTO_PUBLISH |
| `ROLLBACK_EXECUTED` | Inconsistência detectada, rollback aplicado |

### PublicationDraft

Contém **somente** dados públicos compatíveis com `DoctorImportRecord`:

- identidade, CRM, RQE, especialidade, localização;
- graduação/residência confirmadas;
- instituições, áreas de atuação, fontes;
- campos pendentes permitidos (`__PENDING_VERIFICATION__`);
- versão do protocolo e referências de auditoria.

**Nunca inclui:** notas privadas, nível A/B, métricas internas, evidências descartadas, conflitos internos.

---

## Preflight

Validações executadas antes da publicação:

| Código | Condição |
|--------|----------|
| `NOT_AUTO_PUBLISH` | Decisão diferente de AUTO_PUBLISH |
| `CRM_MISSING` / `CRM_INVALID` | CRM ausente ou inválido |
| `RQE_MISSING` | RQE ausente (Ortopedia) |
| `SPECIALTY_OUT_OF_SCOPE` | Especialidade fora de Ortopedia/Neurocirurgia |
| `IDENTITY_CONFLICT` | Conflito de identidade |
| `INVALID_CITY` / `INVALID_COORDINATES` | Localização inválida |
| `INSUFFICIENT_SOURCES` | Menos de 2 fontes públicas |
| `INVALID_URL` | URL malformada |
| `INTERNAL_SENTINEL` | `__PRIVATE__` ou `__INTERNAL__` no payload |
| `PROMOTIONAL_LANGUAGE` / `RANKING_LANGUAGE` | Linguagem proibida |
| `DUPLICATE_CRM` / `DUPLICATE_SLUG` | Duplicidade no catálogo |
| `SCHEMA_INVALID` | Incompatível com schema do catálogo |
| `PRIVATE_DATA_LEAK` | Dados privados detectados |

Resultado: `READY_TO_PUBLISH` ou `PUBLICATION_BLOCKED` (com motivos estruturados).

---

## Snapshots imutáveis

Campos mínimos:

- `snapshotId`, `doctorId`, `profileVersion`
- `payload`, `deterministicHash`
- `protocolVersion`, `protocolDecisionId`, `evidenceReportId`
- `createdAt`, `publishedAt`, `supersedesSnapshotId`
- `idempotencyKey`

Snapshots **nunca** são editados. Toda correção gera novo snapshot.

---

## Idempotência

Chave derivada de:

```
hash(candidateId + protocolDecisionId + protocolVersion + contentHash)
```

Reprocessar a mesma decisão retorna `ALREADY_PUBLISHED` sem duplicar perfil, fontes, snapshots ou eventos.

---

## Atualizações

Quando o médico já está publicado:

| Classificação | Comportamento |
|---------------|---------------|
| `NO_CHANGE` | Retorna sem publicar |
| `MINOR_UPDATE` | Novo snapshot e publicação segura |
| `MATERIAL_UPDATE` | Interrompe automação → Review Case |
| `REVIEW_REQUIRED` | Perda de evidência ou novos conflitos → Review Case |

Campos materiais: `name`, `specialty`, `location.*`, `graduation.institution`, `mainInstitution`.

---

## Publicação atômica

`publishSnapshotAtomically`:

1. Stage do snapshot (se necessário);
2. `repository.publish(snapshotId)`;
3. Verificação de hash publicado vs. snapshot;
4. Em divergência → rollback automático.

Não permite estado parcial no catálogo.

---

## Post-publish verification

Após publicar, verifica:

- perfil recuperável;
- rota pública resolvível (id/slug);
- especialidade e cidade corretas;
- fontes presentes;
- ausência de sentinelas internas;
- payload corresponde ao snapshot;
- nenhuma informação privada vazou.

Resultado: `PUBLICATION_VERIFIED` ou `PUBLICATION_INCONSISTENT` (com rollback automático).

---

## Rollback

- Remove versão defeituosa do catálogo ativo;
- Restaura último snapshot válido;
- Preserva snapshots e eventos (append-only);
- Registra incidente e motivo;
- Cria Review Case no Studio.

---

## Auditoria

Eventos append-only:

| Evento | Momento |
|--------|---------|
| `PUBLICATION_DRAFTED` | Draft criado |
| `PREFLIGHT_PASSED` / `PREFLIGHT_BLOCKED` | Resultado do preflight |
| `SNAPSHOT_STAGED` | Snapshot preparado |
| `PROFILE_PUBLISHED` | Publicação concluída |
| `POST_PUBLISH_VERIFIED` | Verificação OK |
| `PUBLICATION_INCONSISTENT` | Verificação falhou |
| `PUBLICATION_FAILED` | Falha geral |
| `ROLLBACK_EXECUTED` | Rollback aplicado |

Cada evento contém: `candidateId`, `doctorId`, `protocolDecisionId`, `snapshotId`, `protocolVersion`, `outcome`, `reasons`, `evidenceIds`.

---

## Integração com Protocol Engine

```
ProtocolEngine.evaluate(candidate, evidence)
        ↓
PublicationDecision.outcome === "AUTO_PUBLISH"
        ↓
PublicationPipeline.execute(input)
```

Entradas `HUMAN_REVIEW` e `REJECT` são rejeitadas pelo pipeline (`REJECTED`).

---

## Integração com Studio

**Arquivo:** `src/alicia/studio/publication-bridge.ts`

- `getPublicationReviewCases(candidates)` — exceções para o Inbox;
- `runStudioPublication(candidate)` — execução pontual;
- `getSessionPublicationPipeline()` — instância compartilhada na sessão.

O Studio recebe **apenas exceções**:

- `PUBLICATION_BLOCKED`
- `PUBLICATION_INCONSISTENT`
- `MATERIAL_UPDATE`
- `REVIEW_REQUIRED`
- `ROLLBACK_FAILED`

Não há botão "publicar mesmo assim". Não há bypass do Protocol Engine ou do preflight.

---

## Limitações atuais (MVP)

- Repositório **em memória** (`InMemoryPublicationRepository`);
- Sem persistência em banco;
- Sem alteração direta do seed do catálogo;
- Verificação de filtros do mapa é indireta (via payload/schema);
- Pipeline de sessão do Studio não sobrevive a reload da página.

---

## Caminho futuro

1. **Persistência real** — adapter Supabase/Postgres com tabelas `publication_snapshots`, `publication_events`;
2. **Sincronização com seed** — export controlado de snapshots publicados para `catalog.seed.json`;
3. **Verificação de filtros** — integração com camada de catálogo em runtime;
4. **Studio workflow** — resolução de Review Cases com re-submissão ao pipeline;
5. **Métricas operacionais** — taxa de bloqueio, rollback, tempo médio de publicação.

---

## API pública

```typescript
import {
  PublicationPipeline,
  runPublicationPipeline,
  buildPublicationDraft,
  runPreflightValidation,
  createImmutableSnapshot,
  classifyUpdate,
  verifyPublishedProfile,
  executeRollback,
  PublicationAuditTrail,
  InMemoryPublicationRepository,
} from "@/alicia/publication-pipeline";
```

---

## Testes

Cobertura mínima exigida: **95%** em `publication-pipeline/`.

```bash
npx vitest run src/alicia/publication-pipeline
npx vitest run --coverage src/alicia/publication-pipeline
```

18 cenários obrigatórios cobertos em `__tests__/publication-pipeline.test.ts`.
