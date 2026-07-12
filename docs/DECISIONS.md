# Registro de decisões — aliviar-conexao

Log de decisões arquiteturais e de produto, formato ADR simplificado. Todas as decisões abaixo são **reversíveis até a aprovação de um scaffold técnico** — podem ser revisitadas sem processo formal enquanto não houver código de aplicação implementado.

---

## ADR-001 — Separação entre `aliviar-conexao` e `aliviar-app`

- **Status:** Provisória / reversível
- **Contexto:** `aliviar-conexao` é um novo produto relacionado ao ecossistema Aliviar, mas sua relação exata com o `aliviar-app` (integração, dados compartilhados, autenticação) ainda não foi definida em detalhe.
- **Decisão:** tratar `aliviar-conexao` como produto separado do `aliviar-app`. Nenhuma sessão de usuário, tabela de banco de dados ou credencial é compartilhada entre os dois projetos nesta etapa.
- **Consequência:** reduz risco de acoplamento indevido e de vazamento de dados/credenciais entre produtos enquanto a relação real não está definida. Qualquer integração futura será feita por contrato de API documentado, não por acesso direto a banco ou sessão.
- **Revisitar quando:** houver decisão explícita do usuário sobre como os dois produtos devem se relacionar.

---

## ADR-002 — `docs/AGENTS.md` como documento canônico de governança

- **Status:** Definitiva (formato), conteúdo pode evoluir
- **Contexto:** múltiplos arquivos (`CLAUDE.md`, `.cursor/rules/project-governance.mdc`, documentos futuros) precisam referenciar o mesmo protocolo de trabalho dos agentes, sem duplicar texto que ficaria desatualizado em vários lugares.
- **Decisão:** `docs/AGENTS.md` é o único documento canônico do protocolo de governança. `CLAUDE.md` e `.cursor/rules/project-governance.mdc` contêm apenas resumos curtos e apontam para ele; nenhuma regra de fundo deve ser escrita exclusivamente em outro lugar.
- **Consequência:** atualizações de regra são feitas em um único ponto, evitando divergência entre o que o Claude Code, o Cursor e o usuário entendem como protocolo vigente.
- **Revisitar quando:** a estrutura de documentação do projeto crescer a ponto de justificar múltiplos documentos canônicos por área (ex.: segurança separada de fluxo de trabalho).

---

## ADR-003 — Infraestrutura desta fase limitada a desenvolvimento, sem cobrança

- **Status:** Provisória
- **Contexto:** o projeto ainda não tem stack, banco ou hospedagem definidos; qualquer recurso de infraestrutura criado nesta fase é experimental.
- **Decisão:** qualquer recurso de infraestrutura provisionado nesta fase (ex.: projeto de banco de dados de desenvolvimento) deve ser de tier gratuito, sem cobrança, e nunca um recurso de produção.
- **Consequência:** evita custo e compromisso antes de uma decisão formal de arquitetura e de produção.
- **Revisitar quando:** houver decisão de negócio para produção/deploy real, que exige autorização explícita separada do usuário.
