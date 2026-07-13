# Guia de Debugging

Pontos de partida para diagnosticar os problemas mais prováveis em operação. Não repete `docs/ace/` (o que cada protocolo faz) nem `docs/DATABASE.md` (schema) — aqui é **por onde começar quando algo parece errado**.

## 1. "A execução do ACE não avança" ou "o paciente está preso em um estado"

1. Abra `/admin/ace` (dashboard de observabilidade) — mostra execuções em `RUNNING` há mais de 30 minutos (`stuckRunningExecutions` em `getAceHealthCheck()`, `src/modules/concierge/execution-repository.ts`) — sintoma típico de reinício do servidor a meio da execução.
2. Abra `/admin/ace/[executionId]` para essa execução — a timeline (`ace_execution_events`) mostra exatamente em qual protocolo parou e o último evento (`STARTED`/`RESUMED`/`PROTOCOL_STARTED`/`PROTOCOL_COMPLETED`/`ARTIFACT_REUSED`/`BLOCKED`/`FAILED`/`COMPLETED` — `AceExecutionEventType`, `src/modules/concierge/types.ts`).
3. Reexecutar a mesma ação de "rodar ACE" na página do Caso é seguro — o orquestrador (`orchestrator.ts`) reaproveita artefatos já persistidos por protocolo (idempotência/retomada) em vez de recomeçar do zero.
4. Se o evento mais recente é `FAILED`, veja o `failureCode` do `ace_executions` — tabela abaixo.

## 2. Falhas do modelo de linguagem (`failureCode`)

Todos definidos em `src/modules/concierge/anthropic-language-model.ts` (classificação) e propagados por `src/modules/concierge/orchestrator.ts`/`delivery-repository.ts`. Nunca expõem a mensagem crua do provedor — sempre uma mensagem fixa e sanitizada, tanto para o Curador quanto (nunca em detalhe técnico) para o paciente.

| `failureCode` | Causa | Onde olhar |
|---|---|---|
| `ACE_MODEL_NOT_CONFIGURED` | `ANTHROPIC_API_KEY` ausente em produção | `docs/ENVIRONMENT_VARIABLES.md` — configurar a variável na Vercel. |
| `ACE_MODEL_AUTHENTICATION_FAILED` | Chave inválida/revogada (`Anthropic.AuthenticationError`) | Verificar a chave no painel da Anthropic. |
| `ACE_MODEL_RATE_LIMITED` | Limite de requisições excedido (`RateLimitError`) | Aguardar/verificar plano da conta Anthropic. |
| `ACE_MODEL_TIMEOUT` | Timeout de conexão (`APIConnectionTimeoutError`) | Geralmente transitório — retomar a execução. |
| `ACE_MODEL_UNAVAILABLE` | Provedor indisponível (`APIConnectionError`, `InternalServerError`) | Checar status da Anthropic — geralmente transitório. |
| `ACE_MODEL_INVALID_RESPONSE` | Resposta sem o `tool_use` esperado (saída estruturada falhou) | Não é transitório — indica incompatibilidade entre o schema esperado e a resposta real; investigar o `prompt.md` do protocolo envolvido. |
| `ACE_MODEL_EXECUTION_FAILED` | Qualquer outro erro não classificado do SDK | Ver logs do servidor (nunca contêm prompt nem segredo — `docs/AGENTS.md`). |

Health Check (`/admin/ace`, `AceHealthCheckCard`) mostra o estado agregado do modelo — `ANTHROPIC_CONFIGURED` / `FAKE_MODEL_NON_PRODUCTION` / `MODEL_NOT_CONFIGURED` (`AceLanguageModelHealthStatus`, `src/modules/concierge/language-model.ts`). `MODEL_NOT_CONFIGURED` só é saudável dizer "ok" fora de produção — em produção é sempre tratado como não saudável.

## 3. "O paciente vê um erro genérico na Curadoria"

Por design, o paciente nunca vê `failureCode`, prompt, nome de modelo ou detalhe técnico (`docs/PRODUCT_ARCHITECTURE.md`, Princípio 5). Para saber a causa real: entre como Administrador/Curador Médico, abra o Caso e veja a mensagem interna (sanitizada, mas com mais contexto que a do paciente) e o `failureCode` na observabilidade (`/admin/ace/[executionId]`).

## 4. RLS negando acesso inesperadamente

- Confirme o papel efetivo do usuário: `user_roles` (associação N:N, ADR-006) — nunca uma coluna de papel fixa.
- Para o Curador Médico: acesso a um Caso específico depende de `assigned_curator_id = auth.uid()` (ver `docs/PRODUCT_ARCHITECTURE.md` ADR-019) — Administrador vê todos os Casos, Curador só os atribuídos a ele.
- Para o paciente: a única tabela com SELECT direto é `final_curadoria_deliveries`; todo o resto passa pela view `patient_case_overview` ou pelos próprios repositórios de paciente. Se o paciente "não vê nada", primeiro confirme que o `profile_id` da sessão bate com o dono do registro — RLS nunca é a aplicação decidindo, é sempre a policy do Postgres.
- `docs/DATABASE.md` lista, por tabela, se ela é append-only (sem policy de UPDATE/DELETE) — um erro de update/delete negado nessas tabelas é esperado, não um bug.

## 5. Ambiente local não sobe (Supabase/Docker)

- `npm run supabase:start` requer Docker Desktop rodando. Erro típico: `docker: O sistema não pode encontrar o arquivo especificado` — Docker Desktop não está em execução (não é um bug do projeto).
- Testes de integração (`npm run test:integration`) e e2e (`npm run test:e2e`) **exigem** Supabase local rodando — sem Docker, rode apenas `npm run test`/`npm run test:components` e registre a limitação, nunca crie um workaround ou mock permanente para contornar.
- `npm run bootstrap:test-users` recria os usuários de teste locais (`test-users.local.json`, nunca versionado) — seguro de rodar quantas vezes forem necessárias.

## 6. Build de produção falha, mas `tsc`/lint local passam

- Rode `npm run build` localmente antes de assumir que é só um problema da Vercel — várias checagens (rotas dinâmicas, geração estática) só acontecem no build real, não no `next dev` nem no `tsc --noEmit` isolado.
- Avisos conhecidos e inofensivos: `@supabase/supabase-js` reclama de `process.version` no Edge Runtime (não afeta produção, é aviso de compatibilidade do bundler).

## 7. Logs e segredos

Nunca espere (nem adicione) prompt, resposta bruta do modelo, chave ou token em log — `docs/AGENTS.md`, regra de segurança. Se um log parecer conter algo assim, trate como incidente de segurança, não como debug normal.
