# Incidente — `CLAUDE_API_KEY` não é lida em produção (Vercel)

**Status: RESOLVIDO** (ver seção "Resolução" ao final). Registro técnico mantido como está — não é um documento normativo — para uso interno e para eventual anexo a um chamado de suporte da Vercel.

## Resumo objetivo

A variável de ambiente que o ACE usa para autenticar com a API da Anthropic (`CLAUDE_API_KEY`) está presente no painel da Vercel, escopada para **Production**, com um valor aparentemente preenchido — mas o aplicativo, em runtime, continua reportando que ela **não está configurada** (`ACE_MODEL_NOT_CONFIGURED`), mesmo depois de um novo deploy criado após a variável ter sido definida.

## Linha do tempo

1. **Ocorrência original (antes desta sessão)**: uma variável chamada `ANTHROPIC_API_KEY` estava corretamente registrada no painel da Vercel (confirmado pelo próprio suporte da Vercel), mas `process.env.ANTHROPIC_API_KEY` chegava como string vazia em runtime — provado por um log de diagnóstico temporário mostrando a chave presente em `Object.keys(process.env)`, porém com `length: 0`, enquanto uma variável irmã igualmente marcada "Sensitive" (`SUPABASE_SERVICE_ROLE_KEY`) injetava corretamente na mesma invocação. Um chamado de suporte foi aberto com a Vercel.
2. **Contorno aplicado**: por sugestão da própria Vercel, o nome da variável lida pelo código foi trocado de `ANTHROPIC_API_KEY` para `CLAUDE_API_KEY` (commit `b17e81f`) — a hipótese era que o *registro específico* daquela variável estivesse corrompido, e criar um registro novo (com outro nome) contornaria o problema.
3. **Validação na época**: um novo deploy foi forçado via commit vazio (`chore: trigger fresh production build to test CLAUDE_API_KEY`, deploy `dpl_AjtXB7qW7yW8mevqT3a2XwiiUJ1k`, `READY`). Presumiu-se resolvido.
4. **Hoje (esta sessão)**: ao auditar o Health Check em produção (`/admin/ace`), a variável `CLAUDE_API_KEY` aparece no painel da Vercel (Production, "Sensitive", "Updated 20h ago"), mas o Health Check mostra: *"CLAUDE_API_KEY não está configurada em produção"*. O painel de métricas já registrava **4 execuções reais, todas com falha**, código `ACE_MODEL_NOT_CONFIGURED`.
5. **Tentativa de correção repetida**: por sugestão do mesmo padrão já validado no histórico do projeto, foi criado um segundo commit vazio (`65f221d`, zero arquivos alterados) e enviado a `main`, gerando um novo deploy (`dpl_7DRErowRdhb8kGgHHasVPmZfrh9U`, `READY`).
6. **Reteste**: um novo Caso de teste ("Curisco1") foi executado em produção depois desse deploy. **Resultado: falhou novamente**, com o mesmo `failureCode: "ACE_MODEL_NOT_CONFIGURED"` (evidência: log estruturado da execução, evento `FAILED`, `metadata.failureCode: "ACE_MODEL_NOT_CONFIGURED"`).

## Achado adicional (não a causa, mas ruído a limpar depois)

A variável antiga `ANTHROPIC_API_KEY` ainda está presente em Production no painel da Vercel — o código nunca a lê (confirmado por busca em todo `src/`), então ela é inofensiva funcionalmente, mas é resíduo da tentativa anterior e vale remover depois deste incidente estar fechado, para não confundir o próximo diagnóstico.

## Hipótese

O padrão do sintoma é **idêntico** ao da ocorrência original — variável presente e visível no painel, porém não injetada em runtime — só que agora acontecendo com um **segundo nome de variável diferente**. Isso enfraquece a hipótese original ("o registro específico de `ANTHROPIC_API_KEY` estava corrompido") e fortalece uma hipótese mais ampla: **algo no projeto/conta/ambiente da Vercel está impedindo variáveis `Sensitive` de serem injetadas corretamente em runtime para este projeto especificamente** — não é um problema do nome da variável.

## O que ainda não foi verificado (depende do usuário)

- Se o campo de valor de `CLAUDE_API_KEY`, ao abrir "Edit" no painel, realmente contém algo digitado (não vazio/só espaço) — não posso ver isso, só o usuário.
- Se o chamado de suporte já aberto com a Vercel (sobre `ANTHROPIC_API_KEY`) teve alguma resposta nova, ou se precisa ser reaberto/atualizado com esta nova evidência (mesmo bug, variável diferente).

## Próximos passos possíveis (nenhum executado ainda — aguardando decisão)

1. Confirmar visualmente que o valor de `CLAUDE_API_KEY` não está vazio.
2. Apagar e recriar a variável `CLAUDE_API_KEY` do zero (novo registro, mesmo nome) — é o que efetivamente resolveu da vez anterior (criar um registro novo, não só renomear).
3. Reabrir/atualizar o chamado com a Vercel com esta cronologia completa, já que o problema recorreu num segundo nome de variável.
4. Como experimento de diagnóstico (não uma correção): testar se uma variável **não-sensitive** nova injeta corretamente, para isolar se o problema é específico a variáveis marcadas "Sensitive" neste projeto.

## Impacto no Go Live (antes da resolução)

Bloqueava integralmente o item 3 (`CLAUDE_API_KEY` de produção) do checklist de lançamento — nenhuma execução real do ACE podia ser concluída em produção enquanto isso não fosse resolvido.

## Resolução

**Data:** 2026-07-14, mesma sessão.

**Pista investigada e descartada:** cheguei a suspeitar de dois projetos Vercel diferentes (`aliviarcuradoriamedica` sem hífen vs. `aliviar-curadoria-medica-prod`). Confirmado que **`aliviar-curadoria-medica-prod` sempre foi o projeto correto** (é o que está de fato conectado ao domínio `www.aliviarcuradoriamedica.com.br`) — não era essa a causa.

**Causa raiz confirmada:** recorrência do mesmo bug de propagação já documentado na ocorrência original (variável `Sensitive` registrada corretamente no painel, com valor não vazio e formato correto — confirmado visualmente, prefixo `sk-ant-api03-...` —, mas não injetada em `process.env` no runtime do deployment). Não é um problema do nome da variável nem do projeto; é o **registro específico** daquela variável que precisa ser recriado do zero, mesmo padrão já visto com `ANTHROPIC_API_KEY`.

**Ação que resolveu:** apagar a variável `CLAUDE_API_KEY` existente no painel da Vercel (projeto `aliviar-curadoria-medica-prod`, Production) e recriá-la do zero (mesmo nome, valor colado novamente), seguido de um novo deployment (via botão "Redeploy" oferecido pela própria Vercel após salvar a variável).

**Evidência da resolução:**
- Health Check em `/admin/ace` (produção) passou a mostrar **`Anthropic configurado`** (antes: "Não configurado").
- Execução real do ACE (Caso "Curisco1", execução `69269f07-9704-457c-964b-924495ddb9a9`) completou **P001, P002 e P003 com sucesso**, com chamadas reais à API Anthropic (não ao modelo fake) — prova funcional, não só de configuração presente.

**Nota importante, para não confundir com este incidente:** essa mesma execução foi **bloqueada em P003** (`failureCode: CASE_AUDIT_BLOCKED`) — isso é um problema **diferente e já documentado separadamente** (CAL-002, `docs/ace/CALIBRATION_REPORT.md`), sobre o comportamento do protocolo P003 diante de uma restrição prática ausente. Não é uma recorrência do incidente da chave — a chave funcionou; o bloqueio veio do Método, não da infraestrutura. Uma execução chegar a `COMPLETED` de ponta a ponta depende de resolver o CAL-002 separadamente, não deste incidente.

**Limpeza pendente (não bloqueia o Go Live):** a variável órfã `ANTHROPIC_API_KEY` ainda está presente em Production no painel da Vercel, sem uso pelo código — remover quando conveniente.
