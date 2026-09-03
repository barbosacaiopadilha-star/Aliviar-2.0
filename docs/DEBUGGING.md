# Guia de Debugging

Pontos de partida para diagnosticar os problemas mais prováveis em operação. Não repete `docs/ace/` (o que cada protocolo faz) nem `docs/DATABASE.md` (schema) — aqui é **por onde começar quando algo parece errado**.

## 1–3. Histórico — o motor ACE não executa mais

As três primeiras seções deste guia ("a execução do ACE não avança", "falhas do modelo de linguagem" e "o paciente vê um erro genérico na Curadoria") descreviam o diagnóstico de um motor que saiu do código na simplificação operacional de 2026-08-21: `src/modules/concierge/` não existe, `/admin/ace` e `/admin/ace/[executionId]` não existem, e o `@anthropic-ai/sdk` saiu do `package.json` em 2026-09-03 (ADR-056, registro de implementação). Não há modelo de linguagem, real ou fake, em nenhum caminho do produto.

O que ficou, e por quê:

- **O histórico no banco.** `curadoria.ace_executions`, `curadoria.ace_execution_events` e `curadoria.ace_artifacts` continuam íntegras, por decisão (DP-2): saiu a vitrine, não o dado. Nada novo é gravado nelas; o que existir é anterior à aposentadoria.
- **Os `failureCode` antigos**, para quem ler esse histórico: `ACE_MODEL_NOT_CONFIGURED` (chave ausente em produção), `ACE_MODEL_AUTHENTICATION_FAILED`, `ACE_MODEL_RATE_LIMITED`, `ACE_MODEL_TIMEOUT`, `ACE_MODEL_UNAVAILABLE`, `ACE_MODEL_INVALID_RESPONSE` e `ACE_MODEL_EXECUTION_FAILED`. Nenhum é acionável hoje: não há variável a configurar na Vercel (`CLAUDE_API_KEY` está aposentada — ver `docs/ENVIRONMENT_VARIABLES.md`) nem execução a retomar.
- **A regra de produto** da antiga seção 3 segue valendo e nunca dependeu do motor: o paciente não vê detalhe técnico de falha nenhuma (`docs/PRODUCT_ARCHITECTURE.md`, Princípio 5). Para saber a causa real de um erro, entre como Administrador ou Curador e abra o Caso.

Se um erro em operação parecer "do ACE", a suspeita está no lugar errado: olhe o Caso, o papel efetivo (seção 4) e o ambiente (seção 5).

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
