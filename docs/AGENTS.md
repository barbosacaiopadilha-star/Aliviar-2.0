# Protocolo de Construção do Projeto — aliviar-conexao

Este é o **documento canônico** de governança dos agentes de IA neste projeto. `CLAUDE.md` e `.cursor/rules/project-governance.mdc` são ponteiros curtos para este arquivo e não devem duplicar seu conteúdo — qualquer atualização de regra é feita aqui primeiro.

## Objetivo

Construir o projeto do início ao fim mantendo estabilidade, organização, segurança e rastreabilidade, com o mínimo de intervenção manual necessária do usuário.

## Papéis

- **Claude Code — Engenheiro Líder.** Compreende a arquitetura, analisa o repositório, define a ordem das tarefas, identifica causas raiz, toma decisões técnicas, cria planos de implementação, executa comandos e testes, valida cada etapa, revisa alterações produzidas pelo Cursor.
- **Cursor — Engenheiro de Implementação.** Implementa as tarefas definidas pelo Claude Code: edita código, corrige bugs, tipagem, lint e testes, refatora pequenos trechos, melhora organização e desempenho. Não altera arquitetura por iniciativa própria — melhorias estruturais identificadas devem ser documentadas em `docs/DECISIONS.md` como proposta, aguardando validação do Claude Code.
- **Usuário (Caio) — decisões de negócio, produção e aprovação final.** Autoriza mudanças em produção, decisões comerciais (ex.: recursos com cobrança), e aprova o encerramento de cada etapa relevante.

## Fluxo obrigatório

Toda tarefa segue estas oito etapas, nesta ordem, sem pular nenhuma:

1. **Analisar** — entender o pedido e o estado atual do código/documentação relevante.
2. **Identificar causa raiz** — não tratar sintomas; entender por que o problema ou a necessidade existe.
3. **Definir solução** — propor a abordagem antes de implementar, especialmente havendo impacto arquitetural.
4. **Implementar** — Claude Code implementa diretamente ou delega ao Cursor uma tarefa objetiva (ver `docs/WORKFLOW.md` para o formato de delegação).
5. **Validar** — conferir que o resultado corresponde ao que foi definido.
6. **Executar testes** — lint, tipagem, testes automatizados, build, conforme aplicável ao que existir no projeto naquele momento.
7. **Revisar** — Claude Code revisa qualquer alteração produzida pelo Cursor antes de considerar a tarefa concluída.
8. **Documentar** — registrar objetivo, alterações, arquivos modificados, comandos executados, validações, riscos e pendências.

Nenhuma etapa é considerada concluída sem evidência de validação.

## Automação de contas e credenciais temporárias

O usuário não deve precisar criar manualmente contas de teste, usuários administrativos temporários, senhas ou dados de desenvolvimento quando isso puder ser automatizado. Sempre que necessário e tecnicamente possível, o Claude Code pode: gerar credenciais temporárias fortes e aleatórias, criar usuários de teste, executar seeds e migrations de desenvolvimento, configurar autenticação e variáveis locais, automatizar bootstrap e scripts administrativos — **desde que já exista um mecanismo real (aplicação, banco, autenticação) que necessite dessas credenciais.** Nunca criar credenciais antecipadamente "por precaução". Nunca pedir ao usuário para inventar senhas.

## Regras de segurança

- Nunca revelar senhas, tokens, chaves privadas ou service role keys em código, commits, logs ou relatórios.
- Nunca commitar arquivos de credenciais — `.gitignore` deve cobrir todos os `.env*` e arquivos locais de admin.
- Nunca usar credenciais administrativas (ex.: service role) no frontend/cliente.
- Credenciais temporárias de desenvolvimento ficam apenas em arquivos locais ignorados pelo Git.
- `docs/CREDENTIALS.md` registra apenas identificador, finalidade, ambiente e local de armazenamento — nunca valores.
- **Produção só pode ser alterada mediante autorização explícita do usuário.** Nenhuma automação deste projeto cria recursos com cobrança, altera produção ou faz deploy sem confirmação explícita.
- **`git push` de um arquivo em `supabase/migrations/` para `main` É alteração de produção.** A integração GitHub do Supabase (configurada no painel, invisível neste repositório) aplica a migration no banco de produção no momento do push — sem `db push`, sem MCP, sem confirmação. Descoberto em 03/09 (`SIM-97`). Portanto: **migration só se commita em `main` com autorização para produção já dada**, e o ledger de produção se confere antes e depois.
- **Depois de cada `git push`, o check-run do commit é a última linha do relatório.** O repositório é público: `api.github.com/repos/barbosacaiopadilha-star/aliviar/commits/<sha>/check-runs` responde sem login com o veredito de cada job, e `…/check-runs/<id>/annotations` traz o erro. "Testes verdes" medidos só na máquina local não são o verde do projeto — em 03/09 o gate estável esteve vermelho por sete commits seguidos sem ninguém olhar (`SIM-98`).
- Nenhum recurso de outro projeto (ex.: `aliviar-app`) é reutilizado, copiado ou modificado sem análise e autorização técnica específica.

## Relatório obrigatório por ciclo

Todo ciclo de trabalho relevante gera um registro com: objetivo da tarefa, causa raiz, alterações realizadas, arquivos modificados, comandos executados, validações realizadas, riscos identificados, pendências e próximos passos.

## Critério de conclusão do projeto

O projeto só é considerado concluído quando: todos os testes relevantes passarem; o sistema iniciar corretamente; não existirem erros críticos conhecidos; a autenticação funcionar corretamente; o banco estiver consistente; a documentação técnica estiver atualizada; e existir um relatório final com o inventário de credenciais temporárias a serem substituídas pelo proprietário do sistema.
