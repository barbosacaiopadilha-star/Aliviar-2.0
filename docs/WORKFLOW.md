# Fluxo de trabalho — aliviar-conexao

## As oito etapas

Todo ciclo de trabalho segue, nesta ordem, sem pular etapas: analisar → identificar causa raiz → definir solução → implementar → validar → executar testes → revisar → documentar. Ver `docs/AGENTS.md` para a descrição completa de cada etapa.

## Delegação: Claude Code → Cursor

Quando o Claude Code delega uma tarefa ao Cursor, a delegação deve conter, sempre:

- objetivo da tarefa;
- causa raiz identificada;
- arquivos permitidos (lista explícita);
- arquivos proibidos (lista explícita ou categorias);
- instruções de implementação;
- critérios objetivos de aceite;
- comandos de validação a executar;
- testes obrigatórios, quando aplicável;
- riscos conhecidos;
- resultado esperado.

O Cursor implementa **exatamente** o escopo definido. Não amplia o escopo, não altera arquitetura, não modifica arquivos fora da lista autorizada.

## Revisão: Cursor → Claude Code

Toda alteração produzida pelo Cursor é revisada pelo Claude Code antes de ser considerada concluída. A revisão verifica: a alteração corresponde ao escopo definido; os critérios de aceite foram cumpridos; as validações (lint/tipagem/testes/build, quando aplicável) passaram; nenhum arquivo fora do autorizado foi tocado; nenhum segredo foi introduzido.

## Validação antes de concluir

Nenhuma tarefa é marcada como concluída sem evidência de validação (comando executado + resultado observado). Se uma validação não puder ser executada (ex.: bloqueio de ambiente), isso deve ser registrado explicitamente como pendência, não presumido como aprovado.

## Tratamento de bloqueios

Quando uma tarefa encontra um bloqueio que depende de decisão do usuário, de credencial externa, de autorização de acesso ou de recurso pago:

1. Parar a implementação naquele ponto.
2. Registrar exatamente o que está bloqueado e por quê.
3. Preparar, quando possível, tudo que não depende do bloqueio.
4. Solicitar ao usuário apenas a decisão mínima inevitável — nunca prosseguir "assumindo" uma resposta a uma decisão de negócio ou de produção.

## Controle de escopo

Cada entrega (tarefa do Cursor ou ciclo do Claude Code) tem um objetivo único e verificável. Não misturar refatoração com funcionalidade nova. Não alterar mais de um módulo funcional por entrega, salvo autorização explícita.

## Proteção de alterações preexistentes

Nunca descartar, reverter ou sobrescrever alterações existentes (código, commits, documentos) sem autorização explícita do usuário. Antes de qualquer ação potencialmente destrutiva (reset, force push, sobrescrita de arquivo com conteúdo divergente), confirmar o estado atual e comunicar o que será alterado.

## Estrutura do relatório de cada ciclo

Todo relatório de ciclo deve conter, no mínimo: objetivo, causa raiz, alterações realizadas, arquivos modificados, comandos executados, validações realizadas, riscos identificados, pendências e próximos passos.
