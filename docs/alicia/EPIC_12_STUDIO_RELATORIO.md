# AliCIA — Epic 12 — Relatório de Implementação
## AliCIA Studio MVP

**Data:** 22 de julho de 2026  
**Papel:** Principal Product Engineer  
**Status:** MVP entregue — aguardando revisão  
**Escopo:** Workspace operacional interno — sem alteração ao produto público

---

## Resumo executivo

Foi implementado o **AliCIA Studio MVP** — workspace interno para operadores trabalharem candidatos a perfil sem consultar apenas documentos estáticos.

**Rotas:**

| Rota | Módulo |
|------|--------|
| `/alicia/studio` | Dashboard (Módulo 6) |
| `/alicia/studio/inbox` | Inbox (Módulo 1) |
| `/alicia/studio/candidatos/[id]` | Página do candidato (Módulos 2–5) |

**Persistência:** `localStorage` (`alicia-studio-state-v1`) — mock compatível com arquitetura atual, substituível por adapter Supabase futuro.

**Não alterado:** produto público, UX pública, catálogo público, Protocolo, Operação, Autoridade, Moat, Discovery Engine.

---

## Módulos entregues

### Módulo 1 — Inbox

- Kanban visual com 7 colunas: Novo · Triagem · Coleta · Verificação · Revisão · Publicado · Arquivado
- Cards com caso, especialidade, cidade, progresso de checklist e pendências
- Link direto para página do candidato

### Módulo 2 — Página do candidato

- Nome, CRM, RQE, cidade, especialidade
- Seletor de status e nível operacional (A/B)
- Resumo com pendências
- Checklist, fontes e histórico na mesma página

### Módulo 3 — Checklist operacional

- 35 itens derivados do Protocolo AliCIA 1.0 — Capítulo 12 (A–G)
- Estados cíclicos ao clicar: □ pendente → ◐ em andamento → ✓ concluído → 🚫 bloqueado
- Agrupamento por seção (Elegibilidade, Coleta, Instituições, etc.)

### Módulo 4 — Fontes

- CRUD completo: adicionar, editar, remover
- Campos: nome, tipo, URL, data de consulta, responsável
- Cada mutação gera entrada no histórico

### Módulo 5 — Histórico

- Log append-only — nunca remove entradas
- Ações: caso criado, status, checklist, fontes, nível
- Timestamp, ator e detalhe por evento

### Módulo 6 — Dashboard

- Backlog (não publicados)
- Perfis Nível A e Nível B
- Total de pendências
- Tempo médio até publicação (dias)
- Distribuição por status
- Tabela de casos recentes
- Botão "Restaurar dados demo"

---

## Arquitetura

```
src/alicia/studio/           ← Lógica pura (tipos, store, checklist, mock)
src/components/alicia/studio/ ← UI client-side
src/app/alicia/studio/        ← Rotas Next.js
```

| Arquivo | Responsabilidade |
|---------|------------------|
| `types.ts` | Contratos do Studio |
| `operational-checklist.ts` | Definições A–G do Protocolo |
| `studio-store.ts` | Mutações puras + métricas |
| `mock-data.ts` | Seed: 3 perfis do catálogo + 5 leads sintéticos |
| `StudioProvider.tsx` | Context + localStorage |
| `AliciaStudioShell.tsx` | Shell interno (≠ AliciaShell público) |

**Compatibilidade futura:** tipos alinhados a `CatalogDoctorOperationalRecord`, `DoctorLifecycleState` e `DoctorImportRecord` — adapter pode mapear casos `ALC-ES-*` para repositório Supabase sem mudar UI.

---

## Dados demo

8 candidatos pré-carregados:

| Caso | Status | Origem |
|------|--------|--------|
| ALC-ES-2026-00001 | Publicado · Nível A | Catálogo (Victor Marchezi Cobe) |
| ALC-ES-2026-00002 | Publicado · Nível B | Catálogo |
| ALC-ES-2026-00003 | Revisão · Nível B | Catálogo |
| ALC-ES-2026-00004 | Novo | Lead sintético (Viana) |
| ALC-ES-2026-00005 | Triagem | Lead sintético |
| ALC-ES-2026-00006 | Coleta | Lead sintético (Linhares) |
| ALC-ES-2026-00007 | Verificação | Lead sintético (Colatina) |
| ALC-ES-2026-00008 | Arquivado | Descarte D05 |

---

## Qualidade

| Verificação | Resultado |
|-------------|-----------|
| `npx vitest run src/alicia/studio` | ✅ 6/6 |
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (arquivos Studio) | ✅ 0 erros |
| `npm run build` | ✅ Pass — rotas `/alicia/studio/*` geradas |

---

## Deliberadamente fora do escopo (conforme Epic)

- Autenticação e permissões
- Multiusuário
- Banco de dados / API
- Publicação automática no catálogo público
- Integração com `catalog-factory` pipeline de ingestão
- Drag-and-drop no kanban (visual por colunas apenas)

---

## Como testar

```bash
npm run dev
# Abrir http://localhost:3000/alicia/studio
```

1. **Dashboard** — verificar métricas e distribuição
2. **Inbox** — navegar colunas por status
3. **Candidato** — alterar status, checklist, adicionar/editar/remover fonte
4. **Histórico** — confirmar que cada ação gera log
5. Recarregar página — estado persiste em localStorage
6. "Restaurar dados demo" — reset ao seed inicial

---

## Próximos passos sugeridos (pós-revisão)

1. Adapter de persistência (Supabase ou arquivo) substituindo localStorage
2. Sincronização unidirecional Studio → seed (publicação assistida)
3. Timestamps por transição de status (Fábrica — CF-T01)
4. Autenticação staff quando sair do MVP
5. Testes E2E do fluxo operador completo

---

*Epic 12 — AliCIA Studio MVP. Sem commit. Sem push. Aguardando revisão.*
