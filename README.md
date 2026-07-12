# Aliviar Conexão

## Fase atual

Este repositório está em **fase de fundação documental e de governança**. Não há aplicação implementada: nenhum framework foi escolhido, nenhuma dependência foi instalada, nenhum código de produto existe ainda.

## Relação com o `aliviar-app`

`aliviar-conexao` é tratado, **provisoriamente**, como um produto separado do `aliviar-app` — sem compartilhar sessão, banco de dados ou credenciais. Essa decisão é reversível e está registrada em `docs/DECISIONS.md` (ADR-001); qualquer integração futura entre os dois produtos deverá ser definida por contrato de API explícito, não por acoplamento direto.

## Onde está a documentação

- [`docs/AGENTS.md`](docs/AGENTS.md) — documento canônico de governança dos agentes (papéis, fluxo obrigatório, segurança).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — estado atual da arquitetura (ainda não definida).
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — fluxo de trabalho detalhado.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — histórico de decisões (ADRs).
- [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md) — inventário de credenciais (nunca com valores).
- [`CLAUDE.md`](CLAUDE.md) e [`.cursor/rules/project-governance.mdc`](.cursor/rules/project-governance.mdc) — ponteiros curtos para o documento canônico, usados pelas ferramentas de IA.

## Regras de segurança (resumo)

Nunca commitar segredos (senhas, tokens, chaves, service role keys), nunca usar credenciais administrativas no cliente/frontend, nunca registrar segredos em logs. Credenciais temporárias de desenvolvimento ficam apenas em arquivos locais ignorados pelo Git. Alterações em produção exigem autorização explícita do responsável pelo projeto. Detalhes completos em `docs/AGENTS.md`.

## Próximos passos

Os próximos passos dependem de decisões técnicas ainda não tomadas: escolha de stack, modelagem de dados, mecanismo de autenticação e infraestrutura (banco de dados, hospedagem). Nenhuma funcionalidade deve ser presumida até essas decisões serem registradas em `docs/DECISIONS.md` e `docs/ARCHITECTURE.md`.
