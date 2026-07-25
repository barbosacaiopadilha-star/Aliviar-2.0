# CRM Aliviar — Arquitetura

## Decisões

- **Módulo:** `src/modules/crm/` — domínio operacional separado da AliCIA e dos casos clínicos (`curadoria.cases`).
- **Entidades:** `crm_contacts` (o Lead — independente do Case), `crm_interactions`, `crm_tasks`, `crm_appointments`, `crm_audit_log` no schema `curadoria`.
- **Case:** a plataforma NÃO tem entidade de Case própria. O Case é único e canônico em `curadoria.cases`, compartilhado por Atendimento, Curadoria e Concierge; nasce apenas pela abertura autorizada do Atendente (`open_case_from_lead`). A tabela paralela `crm_cases` foi removida na Convergência de Domínio (2026-07-25, migration `convergencia_b4_remove_crm_cases`).
- **Papel novo:** `concierge` adicionado ao catálogo `curadoria.roles`.
- **Rotas:** `/admin/crm/*` dentro da área administrativa existente, com layout que aceita `administrador`, `concierge` e leitura mínima de `curador_medico`.
- **Contato ≠ paciente:** leads e acompanhamento comercial não reutilizam `patient_profiles` para evitar duplicidade semântica e mistura de funil comercial com prontuário.

## Camadas

```text
src/modules/crm/          # domínio, validação, regras, repositório, actions
src/components/crm/       # UI operacional
src/app/admin/crm/        # rotas do Painel do Concierge
src/app/api/crm/leads/    # fronteira para leads do site
```

## Próxima ação

Estratégia implementada em `next-action.ts`:

1. menor `due_at` entre tarefas pendentes/em andamento;
2. menor `start_at` entre compromissos futuros relevantes;
3. valor manual `next_action_at` do contato quando não houver candidatos automáticos.

Recalculada ao criar/concluir tarefas e compromissos.

## Integrações preparadas

- **Site:** `POST /api/crm/leads` com Zod, honeypot, consentimento e deduplicação.
- **WhatsApp:** contrato em `integrations/whatsapp/` com provider desativado até credenciais.

## Limitações desta entrega

- Migration criada localmente; aplicação remota depende de `supabase db push` / pipeline de migrations.
- WhatsApp exibido como não configurado — sem caixa de entrada simulada.
- Painel do Curador completo fora de escopo; apenas autorização mínima via RLS.
- Seed de desenvolvimento não executada automaticamente.
