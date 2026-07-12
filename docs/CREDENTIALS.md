# Inventário de credenciais — aliviar-conexao

> **Aviso:** este arquivo nunca deve conter senhas, tokens, chaves (públicas ou privadas), URLs de conexão completas com credenciais embutidas, ou qualquer outro valor secreto. Apenas metadados sobre a credencial. Se um valor secreto for inserido aqui por engano, ele deve ser removido e a credencial correspondente deve ser considerada comprometida e rotacionada.

## Inventário

| Identificador | Finalidade | Ambiente | Local de armazenamento | Componentes consumidores | Status de rotação | Observações |
|---|---|---|---|---|---|---|
| _(nenhuma credencial criada ainda)_ | — | — | — | — | — | Não existe mecanismo de autenticação nem infraestrutura implementados neste repositório ainda. |

## Procedimento

- Toda credencial temporária de desenvolvimento criada pelos agentes é registrada aqui (sem valor) no mesmo ciclo em que é criada.
- Credenciais só são criadas quando já existe um mecanismo real que as consome — nunca antecipadamente.
- Ao final do projeto, ou antes de produção, toda credencial temporária listada aqui deve ser substituída por credenciais definitivas geridas pelo proprietário do sistema.
