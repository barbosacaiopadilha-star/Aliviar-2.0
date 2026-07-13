# Inventário de credenciais — aliviar-conexao

> **Aviso:** este arquivo nunca deve conter senhas, tokens, chaves (públicas ou privadas), URLs de conexão completas com credenciais embutidas, ou qualquer outro valor secreto. Apenas metadados sobre a credencial. Se um valor secreto for inserido aqui por engano, ele deve ser removido e a credencial correspondente deve ser considerada comprometida e rotacionada.

## Inventário

| Identificador | Finalidade | Ambiente | Local de armazenamento | Componentes consumidores | Status de rotação | Observações |
|---|---|---|---|---|---|---|
| Contas de teste técnico (TASK-003 + TASK-004A): `admin.teste@aliviar-conexao.local`, `profissional.teste@aliviar-conexao.local`, `paciente.teste@aliviar-conexao.local` | Validar RLS (`profiles`/`user_roles`/`audit_logs`/`user_settings`) e o fluxo real de autenticação (login/sessão/autorização por papel) | Supabase local (Docker) | Conta criada por `supabase/seed.sql` (senha inicial descartada); senha utilizável para login é (re)gerada por `scripts/bootstrap-local-test-users.mjs` e gravada só em `test-users.local.json` (não versionado, coberto por `*.local.json` no `.gitignore`) | Testes de integração (`tests/integration/auth-flow.integration.test.ts`) e, futuramente, testes E2E da TASK-004B | Descartável e idempotente — `bootstrap-local-test-users.mjs` pode ser reexecutado a qualquer momento, gera nova senha e nunca a exibe | Nunca usar essas contas fora do Supabase local; a service role key usada pelo script é lida em tempo de execução e nunca persistida em arquivo. |
| `ANTHROPIC_API_KEY` (GO LIVE) | Fornecedor real do `AceLanguageModel` (P002/P003/P004/P010) — substitui o `FakeAceLanguageModel` determinístico quando presente | Produção (Vercel) | Variável de ambiente do projeto Vercel; nunca versionada (`.env.example` só documenta o nome, sem valor) | `src/modules/concierge/anthropic-language-model.ts`, selecionado automaticamente por `getAceLanguageModel()` em `src/modules/concierge/language-model.ts` | Gerenciada diretamente no painel da Anthropic pelo proprietário do sistema — rotação é responsabilidade dele, fora do alcance dos agentes | Ausência da chave em dev/teste cai no modelo fake (seguro). Ausência em produção (`NODE_ENV=production`) **falha explicitamente** (`AceLanguageModelConfigurationError`, GO LIVE #2) — nunca cai silenciosamente no modelo fake. Ver `docs/ENVIRONMENT_VARIABLES.md`. |

## Procedimento

- Toda credencial temporária de desenvolvimento criada pelos agentes é registrada aqui (sem valor) no mesmo ciclo em que é criada.
- Credenciais só são criadas quando já existe um mecanismo real que as consome — nunca antecipadamente.
- Ao final do projeto, ou antes de produção, toda credencial temporária listada aqui deve ser substituída por credenciais definitivas geridas pelo proprietário do sistema.
