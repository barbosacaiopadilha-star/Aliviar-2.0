# Recuperação Operacional — Aliviar OS

Procedimentos transversais para incidentes sem alterar regras de negócio.

## Princípios

1. Preservar consistência entre storage, banco e projeção da jornada
2. Usar `correlationId` para rastrear tentativas e retries
3. Consultar `operational_audit_events` (append-only) antes de reexecutar
4. Nunca expor dados sensíveis em logs ou mensagens ao usuário

## Cenários

### Falha de upload

1. Localizar evento `UPLOAD` no audit trail pelo `correlationId`
2. Verificar objeto no bucket `patient-documents` e linha em `patient_documents`
3. Se storage existe e DB não: reexecutar projeção da jornada
4. Se DB existe e storage não: solicitar reenvio ao paciente
5. O repositório já remove objeto órfão se insert falhar após upload

### Falha de publicação

1. Localizar evento `PUBLICACAO` no audit trail
2. Confirmar rascunho em modo `APROVADO` no workspace do curador
3. Reexecutar `POST /api/v1/curador/casos/{id}/entrega/publicar`
4. Validar etapa `ENTREGA` visível ao paciente

### Falha de autenticação

1. Consultar eventos `LOGIN` com `correlationId` ou janela temporal
2. Verificar `patients.auth_user_id` para pacientes
3. Reemitir magic link se OTP expirou
4. Encerrar sessões antigas se necessário

### Indisponibilidade do banco

1. Executar `GET /api/v1/health` e revisar checks `database:*`
2. Pausar operações de escrita não idempotentes
3. Aguardar recuperação do Supabase
4. Reprocessar com o mesmo `correlationId` (header `x-correlation-id`)

## Referência em código

- Procedimentos: `src/infrastructure/observability/recovery.ts`
- Health: `GET /api/v1/health`
- Métricas: `GET /api/v1/operacao/metricas`
