# EPIC-23 — Comunicação e Notificações da Jornada

## 1. Central de Notificações

Modelo único persistido em `patient_notifications`.

Campos: id, jornada_id, tipo, título, mensagem, prioridade, data, lida, origem, referencia_tipo, referencia_id.

Contrato: `src/notification-flow/contracts/journey-notification.ts`.

## 2. Motor de Eventos

`derivarNotificacoesDaJornada()` mapeia transições da Jornada:

- DOCUMENTOS_RECEBIDOS
- DOCUMENTOS_PENDENTES
- CURADORIA_INICIADA / CONCLUIDA
- ENTREGA_DISPONIVEL
- ESCOLHA_REGISTRADA
- ACOMPANHAMENTO_INICIADO

Geração idempotente via `source_event_key`. Hook em `SupabaseJornadaProjection.salvar()`.

## 3. Inbox

Página `/portal/notificacoes` com listagem, marcar como lida, filtros e pesquisa.

Consome API exclusivamente.

## 4. Timeline

`integrarNotificacoesNaTimeline()` mescla notificações com timeline da jornada.

Cada notificação aponta para etapa, documento, entrega, escolha ou acompanhamento.

## 5. Preferências

Tabela `patient_notification_preferences`.

Contratos: receber_email, receber_whatsapp, somente_plataforma.

Sem integração externa.

## 6. API

- GET /api/v1/notificacoes
- PATCH /api/v1/notificacoes/{id}
- GET /api/v1/notificacoes/preferencias
- PUT /api/v1/notificacoes/preferencias

## 7. Testes

`journey-notification.test.ts` — geração, filtros, timeline, ausência de decisão clínica.

## 8. Autoauditoria

**Paciente entende a etapa pela central?** Sim — cada notificação deriva de `estado_visivel`, `etapa_atual` ou extensões da Jornada, com título e mensagem descritivos (ex.: "Curadoria iniciada", "Entrega disponível").

**Notificação fora da Jornada?** Não — `derivarNotificacoesDaJornada()` recebe apenas `JornadaDoPacienteView` anterior/atual. Geração ocorre exclusivamente em `SupabaseJornadaProjection.salvar()`.

## 9. Próximo programa

PROGRAM-13 / EPIC-24 — Relatórios e exportação operacional (sem decisão clínica).
