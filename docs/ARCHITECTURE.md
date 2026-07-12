# Arquitetura — aliviar-conexao

## Estado atual

- O repositório está em **fase de fundação** — apenas documentação e governança, sem código de aplicação.
- **Nenhuma stack foi formalmente adotada.** Este documento não escolhe nem sugere framework, linguagem ou banco de dados — isso será registrado aqui somente depois de uma decisão explícita, com o ADR correspondente em `docs/DECISIONS.md`.
- `aliviar-conexao` é tratado **provisoriamente** como um produto separado do `aliviar-app` (ver ADR-001 em `docs/DECISIONS.md`): não compartilha sessão de usuário, banco de dados nem credenciais com aquele projeto.
- Qualquer integração futura entre `aliviar-conexao` e `aliviar-app` (ou outro sistema) deverá ser definida por um **contrato de API explícito e documentado**, nunca por acoplamento direto de banco ou sessão.

## Natureza reversível

Todas as decisões registradas neste documento e em `docs/DECISIONS.md` são **reversíveis até que exista um scaffold técnico aprovado**. Isso significa que a separação de produto, a ausência de stack definida e qualquer outra decisão provisória podem ser revisadas sem processo formal enquanto não houver código de aplicação implementado.

## Próxima atualização

Este documento será reescrito assim que houver uma decisão formal de stack, modelo de dados e infraestrutura, autorizada pelo usuário.
