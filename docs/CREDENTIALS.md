# Inventário de credenciais — aliviar-conexao

> **Aviso:** este arquivo nunca deve conter senhas, tokens, chaves (públicas ou privadas), URLs de conexão completas com credenciais embutidas, ou qualquer outro valor secreto. Apenas metadados sobre a credencial. Se um valor secreto for inserido aqui por engano, ele deve ser removido e a credencial correspondente deve ser considerada comprometida e rotacionada.

## Inventário

| Identificador | Finalidade | Ambiente | Local de armazenamento | Componentes consumidores | Status de rotação | Observações |
|---|---|---|---|---|---|---|
| Contas de teste de RLS (TASK-003): `admin.teste@aliviar-conexao.local`, `profissional.teste@aliviar-conexao.local`, `paciente.teste@aliviar-conexao.local` | Validar políticas de RLS de `profiles`/`user_roles`/`audit_logs`/`user_settings` | Supabase local (Docker), recriado a cada `supabase db reset` | `supabase/seed.sql` — sem valor de senha no arquivo: a senha é gerada aleatoriamente em tempo de execução do seed, usada só para satisfazer o hash de `auth.users`, e nunca persistida em texto nem exibida | Nenhum (não há fluxo de login/cadastro implementado ainda) | Descartável — recriado do zero a cada reset, não precisa de rotação | Sem uso funcional de login hoje; existem só para simular `auth.uid()` durante testes de RLS a nível de banco. |

## Procedimento

- Toda credencial temporária de desenvolvimento criada pelos agentes é registrada aqui (sem valor) no mesmo ciclo em que é criada.
- Credenciais só são criadas quando já existe um mecanismo real que as consome — nunca antecipadamente.
- Ao final do projeto, ou antes de produção, toda credencial temporária listada aqui deve ser substituída por credenciais definitivas geridas pelo proprietário do sistema.
