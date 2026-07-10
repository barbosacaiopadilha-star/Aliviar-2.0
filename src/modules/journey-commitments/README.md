# Módulo journey-commitments

Compromissos assumidos pela Aliviar em benefício do paciente dentro de uma Jornada.

## Responsabilidade

- Criar compromissos com responsável e prazo opcional
- Iniciar, concluir e cancelar compromissos
- Exibir histórico na Jornada
- Identificar Jornadas ativas sem compromisso em aberto

## Regras

- Todo compromisso pertence a uma Jornada
- Responsável único e ativo
- Sem exclusão física — cancelar quando criado por engano
- Transições: PENDING → IN_PROGRESS | COMPLETED | CANCELLED; IN_PROGRESS → COMPLETED | CANCELLED
- Jornadas FINISHED/CANCELLED não recebem novos compromissos
- Autoria (`created_by`) vem da sessão
- **Sem integração com Memória da Jornada** (Sprint 2B)

## Status

| Status | Label |
|--------|-------|
| PENDING | Pendente |
| IN_PROGRESS | Em andamento |
| COMPLETED | Concluído |
| CANCELLED | Cancelado |

## Testes de integração

```env
TEST_STAFF_EMAIL=...
TEST_STAFF_PASSWORD=...
TEST_JOURNEY_ID=...
TEST_ASSIGNEE_ID=...
```
