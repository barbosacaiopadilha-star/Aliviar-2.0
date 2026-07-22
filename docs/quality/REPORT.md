# EPIC-24 — Feedback, Incidentes e Melhoria Contínua

## 1. Feedback do Paciente

Tabela `patient_journey_feedback`. Campos: satisfação geral, clareza, facilidade, comentários.

API: `POST /api/v1/me/feedback`. UI: `PortalFeedbackSection` no portal.

Sempre associado à jornada. Auditoria: `FEEDBACK_REGISTRADO`.

## 2. Feedback do Curador

Tabela `curator_journey_feedback`. Campos opcionais: dificuldades, informações ausentes, sugestões, problemas operacionais.

API: `POST /api/v1/curador/feedback`. UI no `CuradorCaseTools`. Nunca obrigatório.

## 3. Incidentes

Tabela `operational_incidents` + eventos append-only em `operational_incident_events`.

Campos: id, jornada, categoria, severidade, descrição, status, responsável, criado em, resolvido em.

Triggers impedem DELETE/UPDATE em eventos.

## 4. Painel de Qualidade

`/admin/qualidade` — incidentes abertos/resolvidos, feedback recente, principais categorias, indicadores.

API: `GET /api/v1/admin/qualidade`, `POST/PATCH /api/v1/admin/qualidade/incidentes`.

## 5. Indicadores

Contrato `QualityIndicatorsView`: tempo médio até resolução, incidentes por categoria, satisfação média, feedback pendente.

Sem ranking de pessoas.

## 6. Testes

`quality.test.ts` — indicadores, RBAC, ausência de categorias clínicas.

## 7. Autoauditoria

**Problemas que mais impactam pacientes?** Sim — painel exibe `principais_categorias` e feedback recente com scores e comentários por jornada.

**Acompanhar resolução de incidentes?** Sim — status ABERTO/EM_ANDAMENTO/RESOLVIDO, `resolvido_em`, eventos append-only auditáveis (`INCIDENTE_*`).

**Melhoria sem rastreabilidade?** Não — todo feedback e incidente gera `FEEDBACK_REGISTRADO` ou `INCIDENTE_*` em `operational_audit_events`.

## 8. Próximo programa

PROGRAM-14 / EPIC-25 — Relatórios operacionais exportáveis.
