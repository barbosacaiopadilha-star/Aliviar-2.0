# Centro de Operações Aliviar (COA)

Documento operacional da reestruturação organizacional da plataforma. Não altera o Método Aliviar, a Ontologia, a Experience Bible, o Curation Engine nem o Curator Operating System — apenas reorganiza como a aplicação existente expõe o trabalho interno.

## Visão

Um único sistema operacional interno substitui o conceito isolado de "Portal do Curador". O Assistido continua vendo apenas sua **Jornada**; internamente, três níveis independentes compartilham o mesmo banco, a mesma timeline e o mesmo WhatsApp **(11) 97903-7133**.

## Estrutura

| Nível | Área | Papel | Rota canônica | Fila |
|-------|------|-------|---------------|------|
| 1 | Atendimento | Atendente (`concierge`) | `/coa/atendimento` | Fila de Leads |
| 2 | Curadoria | Curador (`curador_medico`) | `/coa/curadoria` | Fila de Curadorias |
| 3 | Concierge | Concierge (`concierge`) | `/coa/concierge` | Fila de Acompanhamentos |

Hub multi-nível (administrador): `/coa`

## Jornada operacional

```
Lead → Atendente → Assistido → Consulta Inicial → Curadoria → Dossiê → Escolha → Concierge → Acompanhamento → Encerramento
```

Mapeamento no funil CRM (`src/modules/crm/pipeline.ts`):

- **Atendimento:** `new_contact` … `initial_consultation_scheduled`
- **Curadoria:** `sent_to_curator` … `report_delivered`
- **Concierge:** `doctor_selected` … `completed`

## Módulo COA

`src/modules/coa/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `types.ts` | Níveis, papéis visíveis ao Assistido, registro de transferência |
| `levels.ts` | Mapeamento etapa do funil → nível COA → fase da jornada |
| `permissions.ts` | Menor privilégio por nível |
| `journey-responsibility.ts` | Quem o Assistido vê como responsável atual |
| `transfers.ts` | Registro de transferências (interação + auditoria CRM) |
| `actions.ts` | Server actions: `transferToCuradoriaAction`, `transferToConciergeAction` |

## Dashboards

### Atendimento (`/coa/atendimento`)

Reutiliza `getDashboardData` do CRM. KPIs: leads novos, em contato, aguardando resposta, convertidos, contratações, consultas agendadas. Operação via `/admin/crm/contatos`, funil, tarefas e agenda.

O Atendente **não** acessa Mesa, ACE, compatibilidades ou Dossiê.

### Curadoria (`/coa/curadoria`)

Reutiliza COS completo: `portal-curador` (rewrite interno), Motor de Condução, Mesa, nove fases, Perfil de Prioridades, ACE, Dossiê, Devolutiva.

### Concierge (`/coa/concierge`)

Novo dashboard `getConciergeDashboardData`: pacientes ativos pós-escolha, pendências, consultas, alertas. Operação via CRM (contatos, tarefas, agenda).

O Concierge **não** altera Perfil de Prioridades, ACE, Dossiê ou escolha.

## Transferências

Toda mudança de responsável registra:

- origem e destino (nível COA)
- responsável, data, motivo, observações
- interação CRM (`atualizacao_status`) com payload JSON
- evento `coa_transfer` em `crm_audit_log`

**UI:** painel na ficha do contato (`CoaTransferPanel` em `/admin/crm/contatos/[id]`):
- Atendimento → **Enviar para Curadoria** (etapas Nível 1)
- Curadoria → **Transferir para Concierge** (etapas Nível 2)

**Automático:** ao mover o funil para `doctor_selected` (escolha do profissional), o sistema registra handoff Curadoria → Concierge, atribui o Concierge e revalida as filas — sem nova migration.

## Portal do Assistido

`src/modules/curadoria/jornada.ts` + `patient-status-widget.tsx`

O Assistido vê **um responsável por vez** (Atendente, Curador ou Concierge) — nunca departamentos. Resolvido por `resolveCurrentResponsible()`.

## Autenticação

| Papel | Home pós-login |
|-------|------------------|
| `concierge` | `/coa/atendimento` |
| `curador_medico` | `/coa/curadoria` |
| `administrador` | `/coa` |
| `paciente` | `/paciente` |

Redirects legados (`next.config.ts`):

- `/portal-curador/*` → `/coa/curadoria/*`
- `/curador/*` → `/coa/curadoria/*`
- `/admin/crm` → `/coa/atendimento`

## Impacto no banco

**Nenhuma migration nova.** Transferências usam tabelas existentes:

- `crm_contacts` (Lead) e `curadoria.cases` (o Case canônico). A etapa pós-Atendimento é PROJEÇÃO derivada do Case (`pipeline-projection.ts`), nunca estado editável. `crm_cases` foi removida em 2026-07-25.
- `crm_interactions` (registro de handoff)
- `crm_audit_log` (auditoria append-only)

## Componentes reutilizados

- CRM: `repository.ts`, `actions.ts`, `pipeline.ts`, componentes `src/components/crm/`
- COS: `conduction.ts`, `phases.ts`, `repository.ts`, Mesa, `portal-shell.tsx`
- ACE: pipeline completo em `src/modules/concierge/` + `src/modules/ace/`
- Paciente: `patient-shell.tsx`, `jornada-timeline.tsx`, `buildJornada()`
- Shell: `app-shell.tsx` com `systemLabel` por nível COA

## Aderência ao Método

- COS, nove fases e Motor de Condução: **intactos**
- Perfil de Prioridades, validação do paciente, três opções: **intactos**
- Jornada como projeção da Memória da Curadoria: **intacta**, com responsável dinâmico
- WhatsApp único: `whatsapp-contact.tsx` — fonte canônica `(11) 97903-7133`
- Separação de filas por nível: **implementada** nos dashboards COA

## Homologação pendente

Deploy **não** realizado. Validar localmente:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Fluxo de aceite manual: Lead → Atendente converte → Curador executa Curadoria → Assistido escolhe → Concierge assume automaticamente.
