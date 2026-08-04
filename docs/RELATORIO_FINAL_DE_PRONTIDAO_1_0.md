# RELATÓRIO FINAL DE PRONTIDÃO PARA LANÇAMENTO — ALIVIAR 1.0

**Data:** 2026-08-03
**Escopo:** execução do Bloco A do Plano Oficial de Lançamento (Passos 1 a 6C) e auditorias associadas
**Natureza:** artefato permanente. Substitui os relatórios operacionais desta execução como referência para a decisão de GO.
**Estado ao publicar este documento:** nenhuma alteração pendente foi executada. Produção não foi publicada, credenciais não foram rotacionadas, integrações não foram desligadas, plano não foi alterado.

---

## 1. Resumo executivo

### Situação inicial

Em 2026-08-03, ao abrir o Bloco A, o projeto estava assim: seis Sprints de trabalho (Release Gates 1 a 4, infraestrutura de governança/LGPD, backup e observabilidade) existiam apenas no branch `remediacao/b2-verificacao-release`, com CI verde, **sem merge**. A `main` estava em `ef7b7e9`, com CI **vermelha**. O Plano Oficial afirmava que nada estava publicado.

### Situação atual

- **`main` = `4ad2f1f02fabe3c538ff6782a3cfd8bf330ce59c`**, contendo os 12 commits das seis Sprints, com **CI verde comprovada** — a primeira da história do projeto.
- **Tag `lancamento-v1.0.0`** (anotada) aponta para esse commit, local e remotamente.
- **Produção continua servindo `ef7b7e9`** — o código novo **não** foi publicado.
- **O schema de produção já está em 91 migrations**, idêntico ao que o commit `4ad2f1f` espera, com equivalência estrutural provada por impressão digital.
- A publicação automática da Vercel está **pausada** por `vercel.json`, e a pausa resistiu a três pushes.

### Principais mudanças ocorridas durante a execução

Quatro fatos alteraram o entendimento do projeto, e nenhum deles era conhecido quando o Bloco A começou:

1. **Produção nunca esteve despublicada.** A aplicação está no ar desde 2026-08-03 06:30Z e vinha sendo publicada automaticamente a cada push em `main`.
2. **Existe um segundo pipeline de publicação**, independente da Vercel: a integração nativa Supabase↔GitHub, que aplica migrations em produção ~30 s após cada push em `main`. Ela aplicou as três migrations pendentes às 22:10:08Z, disparada pelo push do merge deste próprio Bloco A.
3. **Credenciais de produção — inclusive a senha do banco em texto claro — estão no `.env.local` da estação de trabalho**, junto do token de administração.
4. **O projeto de produção está no plano Free do Supabase**, o que significa **ausência de backup automático e de PITR**. Não é uma verificação pendente: é uma ausência.

### Conclusão

**A engenharia está pronta e provada. A infraestrutura não está.** O código pode ser publicado com baixo risco assim que houver rede de segurança. A operação — base legal, Rede mínima, limpeza e ensaio — permanece aberta, e é ela que separa o projeto do primeiro paciente real.

O achado que mais importa não é nenhum dos defeitos encontrados: é que **o banco de produção, hoje, não tem como voltar atrás.**

---

## 2. Linha do tempo

### Auditoria do fluxo de deploy (pré-Bloco A)

**Objetivo:** determinar se o merge em `main` publicaria automaticamente em produção.
**Resultado:** confirmado que sim, pela Vercel. Recomendada a Estratégia A — pausar a publicação por `vercel.json`.
**Evidências:** `main` sem `vercel.json`; proteção de branch do GitHub com `protected: false` e `required_status_checks.enforcement_level: "off"`; `project.updatedAt` posterior ao último deploy, indicando configuração inalterada; o branch `remediacao/b2-verificacao-release` acumulou 12 commits com zero deployments graças ao `git.deploymentEnabled` introduzido em `2954a38`.
**Impacto:** deu ao Bloco A a sequência que faltava — mergear, obter CI verde, marcar e migrar **antes** de publicar.
**Falha desta auditoria, registrada:** ela examinou Vercel, GitHub Actions, `vercel.json`, proteção de branch e scripts de `package.json`. **Não examinou a integração Supabase↔GitHub.** Essa omissão é a causa-raiz do incidente do Passo 6.

### Passo 1 — Pausar a publicação automática

**Objetivo:** impedir que o merge virasse publicação.
**Resultado:** ✅ concluído. Commit `6dcbc02`, empurrado às 21:56:44Z.
**Evidências:** zero deployments na API da Vercel; `latestDeployment` inalterado; API de Deployments do GitHub com `ef7b7e9` como mais recente; 13 amostras de `/api/build-info` entre 21:56:56 e 22:00:35Z, todas com `commit=ef7b7e9`.
**Impacto:** produção protegida contra publicação acidental de código. **Não protegeu o schema** — fato descoberto depois.
**Efeito colateral previsto:** a CI de `main` foi disparada e falhou, pela mesma causa já conhecida (etapa `Contas de teste permanentes`).

### Passo 2 — Limpeza da árvore de trabalho

**Objetivo:** remover o espelho duplicado do branch, preservando o que só existia localmente.
**Resultado:** ✅ concluído. `stash@{0}` = `3b9b372a089900fb15af6637506aa8ba9f8c601c`, com 23 arquivos rastreados + 36 não rastreados.
**Evidências:** comparação blob a blob confirmou 23/23 e 31/36 idênticos ao branch, com exatamente **5 arquivos exclusivos** — o Plano Oficial e 4 PNGs de evidência — copiados externamente com SHA-256 conferido na origem e na cópia; recuperabilidade provada extraindo do stash e comparando hashes.
**Impacto:** árvore limpa para o merge, sem perda de nada.
**Observação registrada:** o diretório `.backups/` (6,3 MB) reapareceu como não rastreado porque o `.gitignore` da `main` não o ignorava — a linha 90 vinha do branch. Preservado intocado; voltou a ser ignorado após o merge.

### Passo 3 — Merge

**Objetivo:** incorporar o branch à `main`, preservando a pausa.
**Resultado:** ✅ concluído. **`4ad2f1f02fabe3c538ff6782a3cfd8bf330ce59c`**, 12 commits, 55 arquivos, +4.554 / −164. Empurrado às 22:09:33Z.
**Evidências:** um único conflito, `vercel.json` (add/add), resolvido mantendo apenas `"main": false`; nenhum arquivo preservado do Passo 2 entrou no merge; `git diff --check` vazio; zero deployments em quatro fontes independentes.
**Impacto:** primeiro merge grande da história do projeto que não virou publicação de código. **Mas virou publicação de schema** — sem que ninguém soubesse, naquele momento.
**Achado de auditoria:** o merge trouxe `scripts/migration-ledger.mjs`, ausente do espelho da árvore de trabalho. O espelho tinha 23 arquivos rastreados; o branch alterava 24. Incorporar pelo branch, e não pela árvore, foi a decisão correta.

### Passo 4 — CI no commit de merge

**Objetivo:** provar `main` verde no commit consolidado.
**Resultado:** ✅ concluído. Run `30857578623`, `conclusion: success`, 9m21s.
**Evidências:** ambos os jobs verdes, etapa a etapa, sem nenhuma `skipped`. A etapa `Contas de teste permanentes` — que derrubava as quatro execuções anteriores de `main` — passou em 4 s e 5 s. A etapa `Verificação das migrations (ledger)` passou em 2 s. Zero artefatos (por desenho do workflow).
**Impacto:** as correções `aad957d` (paginação do bootstrap) e `0ce03c3` (formato JSON do ledger) surtiram efeito. `main` deixou de ser um branch que nunca esteve verde.

### Passo 5 — Tag

**Objetivo:** criar referência imutável ao commit validado.
**Resultado:** ✅ concluído. `lancamento-v1.0.0`, objeto `830644d770c56854fd276ab8b37ea9b17cfad7dd`, tipo `tag` (anotada), apontando para `4ad2f1f`. Empurrada às 22:23:13Z.
**Evidências:** `git ls-remote` com a referência desreferenciada (`^{}`) resolvendo para `4ad2f1f`; confirmação pela API do GitHub em duas chamadas; **nenhum workflow disparado** — o workflow não tem gatilho `tags:`.
**Impacto:** existe um ponto de referência estável para a release.

### Passo 6A — Preparação do dossiê REC-03

**Objetivo:** documentar a aplicação das três migrations pendentes em produção.
**Resultado:** 🔴 **INTERROMPIDO.** As verificações iniciais reprovaram: produção já estava em **91 migrations**, não 88.
**Evidências:** ledger em `91 / 20260803150000`; as seis tabelas de governança presentes; `has_table_privilege('authenticated','case_responsibility_changes','select')` verdadeiro; impressão digital estrutural de 157 itens (`ab84ae1881ec4ec303ac1f2efc50fbbd`) **idêntica** ao ambiente local validado pela CI; impressão do ledger (`9081b5d131542eff5fcca498c485463e`) idêntica em produção, local e na tag; tabelas novas com zero linhas.
**Impacto:** o Passo 6 perdeu o objeto. A aplicação foi **completa e correta**, mas fora do procedimento.

### Passo 6C — Auditoria forense da alteração concorrente

**Objetivo:** identificar a origem da aplicação das migrations às 22:10:08Z.
**Resultado:** ✅ **origem identificada com prova documental.**

A integração nativa **Supabase↔GitHub**, `workflow_run 1c724448f10945c3bb5a9eab71077203`:

```
22:10:03  Cloning git repo... git_ref=main
22:10:06  Checking service health... project_ref=awdlmeykminwyifnygkm
22:10:07  Skipping configuration for protected branch...
22:10:07  Connecting to database... host=[…]:5432
22:10:08  Applying migration... file=20260803130000_grants_case_responsibility_changes.sql
22:10:08  Applying migration... file=20260803140000_governanca_documentos_aceites_lgpd.sql
22:10:09  Applying migration... file=20260803150000_governanca_aceite_do_profissional.sql
22:10:09  Skipping seed data for protected branch...
22:10:09  No functions to deploy.
```

**Disparada pelo push do Passo 3**, 30 s antes. O mesmo mecanismo havia aplicado lotes anteriores em 04:47, 05:48 e reportado "up to date" em 06:16, 06:31 e 21:57.

**Hipóteses descartadas, com prova:**
- **GitHub Actions:** um único workflow no repositório, **zero referências a `secrets.`** — sem credencial, não há como escrever em produção.
- **Vercel:** nenhum deployment ocorreu; sem `postinstall`, `prepare`, `vercel-build` ou `postbuild`; `vercel.json` sem `crons` ou `buildCommand`; as três rotas de API não executam DDL.
- **Processo local:** CLI Supabase inativa desde 21:45:38Z, 25 minutos antes; 2.050 linhas de trace do dia com **zero** ocorrências de `db push`, `link`, `--linked`, `--project-ref` ou `supabase.co`.
- **Outra sessão ou agente:** o log da plataforma nomeia o executor; não há evidência de terceiros.

**Impacto:** revelou o segundo pipeline e invalidou o pressuposto central do plano — "pausar a Vercel congela produção".

### Auditoria SEG-01 / SEG-02

**Objetivo:** conter credenciais expostas e a automação concorrente.
**Resultado:** diagnóstico completo, plano em três estratégias, nenhuma execução.
**Impacto:** identificou que **cinco das sete entradas de `.env.local` são de produção e nenhuma é necessária para desenvolver**.

### Revisão Executiva Final

**Resultado:** GO com ressalvas, condicionado a backup confirmado, contenção decidida e Grupo 1 rotacionado.

### Verificação de backup

**Resultado:** 🔴 **BACKUP NÃO CONFIRMADO** — e a causa não é falta de acesso.
**Evidência:** Management API, `get_organization` → organização `aliviar-alpha`, **`plan: "free"`**. No plano Free não há backup agendado restaurável nem PITR disponível.
**Impacto:** o pré-requisito nº 1 do GO não pode ser satisfeito por verificação. Só por contratação.

---

## 3. Descobertas relevantes

### Engenharia

**Confirmado:** o software está completo e provado. Doze commits, 55 arquivos, CI verde etapa a etapa incluindo suíte de integração completa (228 s), build íntegro, verificação de backend único no bundle e smoke E2E do porteiro de ambiente.
**Confirmado:** as correções de CI (`aad957d`, `0ce03c3`) resolveram a causa real — paginação do bootstrap e formato de saída da CLI —, não o sintoma.
**Descartado:** a hipótese de que o espelho na árvore de trabalho fosse cópia fiel do branch. Faltava um arquivo.

### Infraestrutura

**Confirmado:** existem **dois** pipelines de publicação partindo do mesmo gatilho — Vercel (código) e Supabase↔GitHub (schema) — e apenas um estava sob controle.
**Confirmado:** a pausa por `vercel.json` funciona e é confiável; resistiu a três pushes, incluindo o merge.
**Confirmado:** a proteção SSO da Vercel cobre todos os URLs exceto o domínio de produção. Preview é ambiente utilizável e inacessível ao público.
**Descartado:** que a CI ou a Vercel pudessem escrever em produção.
**Não verificado:** a configuração da integração Supabase só é legível pelo painel; tudo o que se sabe dela vem de seus logs de execução.

### Banco

**Confirmado:** produção em `91 / 20260803150000`, com equivalência estrutural exata ao commit `4ad2f1f` — 157 itens cobrindo colunas com tipo e nulidade, definições de constraints, expressões de policies, `md5` do corpo de cada função e grants por papel.
**Confirmado:** as três migrations são **estritamente aditivas**; os únicos `alter table` incidem sobre tabelas criadas pela própria migration `140000`.
**Confirmado:** a migration `20260803130000` corrigiu um defeito **em curso** — o `permission denied for table case_responsibility_changes` registrado às 22:01:12Z, antes da aplicação.
**Confirmado:** nenhuma escrita administrativa após 22:10:09Z.

**Hashes SHA-256 das três migrations aplicadas** (normalizados LF, idênticos entre a tag e o disco):

| Arquivo | SHA-256 |
|---|---|
| `20260803130000_grants_case_responsibility_changes.sql` | `a80c41d5a14e22a98cc51f3430946bbaf4cfdbee237d3764ec38974af973edd7` |
| `20260803140000_governanca_documentos_aceites_lgpd.sql` | `f517524b8f8c3a0b1a32379e40a09ddd872e659745e37369f6c6c06f1f23cb0a` |
| `20260803150000_governanca_aceite_do_profissional.sql` | `8bfbc7139b7c42ba40e2f14a29230ad9118a9e947d224b6b784ec158e49b0b02` |

### Segurança

**Confirmado:** `.env.local` contém, além de chaves de produção, o **token de administração** e a **senha do banco em texto claro**. `supabase/.temp/project-ref` vincula o diretório ao projeto de produção.
**Confirmado como higiene que funcionou:** todos os `.env*` estão no `.gitignore`; **nenhum `.env` jamais foi commitado**, verificado em todo o histórico; `env-guard.mjs` mantém `awdlmeykminwyifnygkm` em `PROJETOS_PROIBIDOS` e recusa antes da primeira chamada de rede; `guard-db-reset.mjs` bloqueia `--linked` e `--project-ref`.
**Confirmado:** o token da CLI **não** está em keychain — vem exclusivamente de `.env.local`.
**Confirmado:** advisors de produção com **0 ERROR** e 91 WARN, sendo 22 `anon_security_definer_function_executable` (mesma classe do defeito corrigido em `5e36d18`) e 1 `auth_leaked_password_protection` desativada.
**Descartado:** que as credenciais expostas tenham causado o incidente das migrations.

### Operação

**Confirmado:** produção tem **usuários reais em uso** — 7 contas reais, 3 com login nas duas horas anteriores, último às 22:13:31Z, e 35 sessões registradas.
**Confirmado:** **ninguém completou uma Curadoria** — zero seleções, zero conexões. O uso é exploratório.
**Confirmado:** 40 de 47 contas em produção são de teste.
**Confirmado:** a Rede publicada saiu de zero para **1**, por ação humana às 22:02:49Z. O mínimo operacional é 3.

### Governança

**Confirmado:** a infraestrutura de governança/LGPD existe e está aplicada em produção — seis tabelas, cinco funções, policies e grants —, mas **com zero documentos publicados**. `/privacidade` responde 307.
**Confirmado:** o plano da organização é **Free**, sem backup e sem PITR.
**Confirmado por evidência técnica, com leitura corrigida:** `archive_mode = on` e `archive_command` apontando para `wal-g` existem em produção — mas são infraestrutura interna da plataforma, presentes em todos os projetos, e **não implicam PITR contratado**.

---

## 4. Situação atual do projeto

| Dimensão | Estado | Detalhe |
|---|---|---|
| **Repositório** | ✅ | `main` = `origin/main` = `4ad2f1f`; árvore limpa; 2 stashes preservados |
| **Produção (código)** | 🟡 | `ef7b7e9`, build `2026-08-03T06:30:58Z` — defasado em 12 commits |
| **Banco** | ✅ | `91 / 20260803150000`; impressão `ab84ae1881ec4ec303ac1f2efc50fbbd` |
| **CI** | ✅ | Run `30857578623` verde em `4ad2f1f` |
| **Deploy** | ⏸️ | Pausado por `vercel.json`; zero deployments desde 21:56Z |
| **Tag** | ✅ | `lancamento-v1.0.0` (anotada) → `4ad2f1f`, local e remota |
| **Schema** | ✅ | Equivalência estrutural provada com a tag |
| **Integrações** | 🔴 | Supabase↔GitHub **ativa**, aplica migrations em `main` sem janela |
| **Credenciais** | 🔴 | Token admin, service role e senha do banco em `.env.local`, não rotacionados |
| **Backup** | 🔴 | **Inexistente** — plano Free |
| **PITR** | 🔴 | **Indisponível** — exige add-on sobre Pro |
| **Jurídico** | 🔴 | 0 documentos publicados; `/privacidade` → 307 |
| **Rede Curada** | 🔴 | 1 profissional publicado de 7 perfis; mínimo é 3 |
| **Operação** | 🔴 | 40 contas de teste; plantão não nomeado; ensaio não executado |

**Dados em produção:** 47 contas (40 de teste, 7 reais) · 7 perfis profissionais · 3 cases · 5 histórias enviadas · 0 seleções · 0 conexões · 0 documentos jurídicos.

**Ambiente:** projeto `aliviar-2-prod` (`awdlmeykminwyifnygkm`), região `sa-east-1`, `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.147, criado em 2026-07-22. Organização `aliviar-alpha`, plano **free**.

---

## 5. Riscos

| # | Risco | Classificação | Impacto | Probabilidade | Mitigação | Responsável |
|---|---|---|---|---|---|---|
| 1 | **Ausência de backup e PITR** | 🔴 Crítico | Perda **irreversível** de dado clínico | Baixa hoje, cresce a cada paciente | Migrar para Pro + add-on PITR; dump manual no intervalo | Fundador |
| 2 | **Credenciais de produção em texto claro** | 🔴 Crítico | Escrita e DDL diretos por quem alcançar a estação | Média | Rotacionar Grupo 1; remover 5 linhas de `.env.local` | Fundador |
| 3 | **Integração Supabase↔GitHub ativa** | 🟠 Alto | Migration aplicada sem janela nem revisão | Baixa hoje (0 pendentes) | Desligar durante o Bloco A; religar após P1 | Fundador |
| 4 | **Base legal inexistente** | 🟠 Alto | Dado de saúde tratado sem consentimento registrado | Certa, se entrar paciente | Publicar aviso, termos e consentimentos mínimos | Jurídico + Fundador |
| 5 | **Pausa do projeto por inatividade** | 🟠 Alto | Produção indisponível sem aviso | Média (tier Free) | Migrar para Pro | Fundador |
| 6 | **40 contas de teste em produção** | 🟡 Médio | Confusão operacional e erro humano | Média | Limpeza **após** existir backup | Admin |
| 7 | **Usuários reais em sessão** | 🟡 Médio | Rotação do JWT desloga todos | Certa, na rotação do Grupo 2 | Aviso prévio e janela agendada | Fundador |
| 8 | **22 funções `security definer` expostas a `anon`** | 🟡 Médio | Superfície de ataque; classe já corrigida antes e reincidente | Baixa | Revisar pós-GO; criar guarda automatizada | Técnico |
| 9 | **Proteção de senha vazada desativada** | 🟢 Baixo | Contas com senha comprometida | Baixa | Ativar no painel | Fundador |
| 10 | **Rollback sem matriz código × schema** | 🟢 Baixo | Voltar o deploy exige conferência manual | Baixa | Escrever na P1 | Técnico |
| 11 | **Pausa da Vercel** | 🟢 Baixo | Funciona; risco é esquecer de religar | Baixa | Data de retorno registrada | Técnico |

---

## 6. Decisões pendentes do responsável

Somente decisões. Nenhuma delas é tarefa técnica.

| # | Decisão | Bloqueia |
|---|---|---|
| **D1** | **Contratar plano Pro + add-on de PITR?** | Todo o resto. Sem isso, nenhuma operação destrutiva deve ocorrer |
| **D2** | **Autorizar a rotação do Grupo 1** (token de admin + senha do banco) e a limpeza de `.env.local`? | Dump manual seguro; SEG-01 |
| **D3** | **Estratégia de contenção da integração** — A (desligar), B (manter e adaptar) ou C (substituir)? | Segurança de qualquer push futuro |
| **D4** | **Aceitar formalmente o estado do banco** aplicado às 22:10:08Z? | Fechamento do REC-03 |
| **D5** | **Autorizar a rotação do Grupo 2** na janela da publicação, com aviso aos usuários? | Publicação do código |
| **D6** | **Destino do projeto `jfhxtwumrurqghuueawi`** (INACTIVE) antes de assinar Pro | Custo |
| **D7** | **Conteúdo jurídico** — Controlador, Encarregado, retenção, suboperadores | Primeiro paciente |
| **D8** | **Tamanho da Rede mínima** — confirmar 3, ou exigir mais | Primeiro paciente |

**Pergunta em aberto, não respondida:** quem criou o perfil profissional às 22:02:49Z e quem estava em sessão às 22:09Z. Se foi a equipe, é operação normal. Se não, há uso de produção que o plano não contabiliza.

---

## 7. Plano restante até o GO

### Ordem correta

| # | Atividade | Duração | Depende de |
|---|---|---|---|
| 1 | Decidir D1, D2, D3, D6 | — | Fundador |
| 2 | Rotacionar Grupo 1 e limpar `.env.local` | 30 min | D2 |
| 3 | **Dump manual de produção** com a chave nova, guardado fora da estação | 1 h | 2 |
| 4 | Contratar Pro + PITR | minutos | D1, D6 |
| 5 | **Aguardar a cobertura existir** e confirmar por timestamp de restauração | até 24 h | 4 |
| 6 | Desligar a integração Supabase↔GitHub | 5 min | D3 |
| 7 | Rotacionar Grupo 2 + atualizar variáveis na Vercel | 30 min | D5, aviso |
| 8 | Remover a pausa e publicar `4ad2f1f` | 15 min | 5, 7 |
| 9 | Validar `/api/health`, `/privacidade`, `/api/build-info` e smoke | 20 min | 8 |
| 10 | Remover as 40 contas de teste | 1 h | 5, 9 |
| 11 | **P1 — restore real verificado** | 1 dia | 5 |
| 12 | **Fase 2 — base legal mínima publicada** | 2 a 5 dias | D7 |
| 13 | **Fase 3 — +2 profissionais publicados** | 1 a 2 semanas | D8 |
| 14 | Fase 5 — plantão nomeado + ensaio ponta a ponta | 1 dia | 9 a 13 |
| 15 | Primeiro paciente | — | tudo |

### Caminho crítico

**Fase 3 — a Rede: 1 a 2 semanas.** É a atividade mais longa e a que menos depende de decisão técnica. A Fase 2 (jurídico, 2 a 5 dias) corre em paralelo e é a segunda mais longa.

**A infraestrutura acrescenta cerca de 2 dias e uma decisão de custo, e corre em paralelo.** Ela não atrasa o lançamento — ela deixa de fazer do lançamento uma imprudência.

### Atividades paralelas

- Passos 2 a 5 (credenciais e infraestrutura) correm junto das Fases 2 e 3.
- A homologação de profissionais não depende de nada técnico e pode começar imediatamente.
- A redação jurídica não depende de nada técnico.

### Duração estimada até o primeiro paciente

**1 a 2 semanas**, governadas pela Rede, não pelo software.

---

## 8. Mudanças necessárias no Plano Oficial

### Trechos incorretos

| Trecho | Erro | Correção |
|---|---|---|
| Abertura — *"Nada está publicado"* | **Falso.** Produção no ar desde 2026-08-03 06:30Z | Registrar que produção está publicada e vinha se publicando sozinha |
| **Parte 6 — Contingência**, "Como voltar" — *"Se for o banco: PITR do provedor"* | **O PITR não existe.** O plano oferece como recurso de emergência algo indisponível | Enquanto não houver contratação, a resposta honesta é: **não há como voltar o banco** |
| **Parte 9 — Riscos aceitos**, item 1 — mitigação *"PITR ligado, volume pequeno…"* | A mitigação citada não existe | Restam o volume pequeno e os triggers de imutabilidade |
| **Fase 4** — *"confirmar no painel que backup e PITR estão ligados. Conferência de minutos"* | Pressupõe que existam | Vira **fase de contratação**, com custo, decisão e janela |

### Trechos desatualizados

- **Fase 1 (Fechamento técnico):** concluída — merge, CI verde e tag executados.
- **Fase 4 (Publicação):** as migrations já foram aplicadas; resta apenas publicar o código.
- **Fase 3 (Rede mínima):** deixou de ser zero; está em 1 de 3.
- **Parte 2 — Checklist técnico:** o item de backup vira "Pro contratado · PITR contratado · cobertura confirmada por timestamp".

### Novos riscos

Integração Supabase↔GitHub aplicando migrations sem janela · credenciais de produção em texto claro na estação · pausa do projeto por inatividade no tier Free · usuários reais já em produção durante a preparação.

### Novos pressupostos

- **Todo push em `main` altera produção por dois caminhos, não um.**
- Recuperação de banco **não existe** até contratação.
- Produção já está em uso, ainda que exploratório.

### Novos bloqueadores

1. Contratação de Pro + PITR.
2. Rotação das credenciais expostas.
3. Contenção da integração.

### Itens que deixam de existir

- O **Passo 6 original** (aplicar as três migrations) — sem objeto; vira registro *a posteriori* no REC-03.
- O pressuposto de que **pausar a Vercel congela produção**.
- A afirmação de que **produção não tem tráfego real**.

---

## 9. Lições aprendidas

**1. Auditar o caminho conhecido não é auditar todos os caminhos.**
A auditoria de deploy examinou Vercel, GitHub Actions, `vercel.json`, proteção de branch e scripts — e concluiu, corretamente, que a pausa protegeria produção. Estava certa sobre o que examinou e errada sobre o todo, porque existia um segundo pipeline. **A pergunta certa não é "este caminho está protegido?", e sim "quantos caminhos existem?".**

**2. Automação invisível é automação perigosa — não por ser automação, por ser invisível.**
A integração Supabase↔GitHub funcionava bem havia dias e aplicou tudo corretamente. O problema nunca foi o mecanismo: foi ele não estar documentado em lugar nenhum do repositório. **Um pipeline que só existe na configuração de uma plataforma é um pipeline que a próxima pessoa não vai encontrar.**

**3. Migrations aditivas foram a rede de segurança que ninguém planejou.**
As três migrations foram aplicadas sem janela, sem backup e com usuários em sessão. Correu bem porque eram estritamente aditivas e o código antigo não as consumia. **Isso foi propriedade do código, não do processo** — e não deve ser confundido com controle.

**4. Ter backup e poder restaurar são coisas diferentes; não ter nenhum dos dois é uma terceira.**
O Bloco I provou o restore **localmente**, com RTO de 3,9 s, e isso criou a impressão de que a recuperação era um problema resolvido. Não era: em produção não havia sequer backup. **Recuperação provada num ambiente não é recuperação; é ensaio.**

**5. Credencial que não é necessária não deve existir.**
Cinco das sete entradas de `.env.local` apontam para produção, e **nenhuma é necessária para desenvolver**. O repositório construiu guardas sofisticadas (`env-guard`, `guard-db-reset`, injetor de ambiente) para proteger contra um arquivo que não precisaria estar ali. **Guardas são boas; a ausência do risco é melhor.**

**6. Processo de release: o gatilho precisa ter um efeito só.**
A configuração que produziu este incidente foi um gatilho — o push em `main` — com dois efeitos, um controlado e outro não. Qualquer que seja a estratégia futura, o princípio permanece: **quem empurra precisa saber exatamente o que vai acontecer.**

**7. Verificar em várias fontes independentes muda o resultado.**
A origem do incidente só apareceu porque a investigação consultou logs de `branch-action`, e não apenas os do Postgres. A equivalência do schema só ficou provada porque foi comparada por impressão digital, e não por inspeção visual. **Em auditoria, a fonte única é a fonte que engana.**

**8. Relatar erro próprio rápido vale mais do que relatar certo.**
Três afirmações desta execução precisaram de correção: "nada está publicado", "não partiu de mim" e "nenhum arquivo modificado na janela". Nenhuma mudou a conclusão final, mas todas estavam num relatório que embasaria decisão. **Num artefato de auditoria, a precisão da evidência é o produto.**

---

## 10. Parecer técnico final

### O software está pronto?
**Sim.** Doze commits consolidados em `main`, CI verde comprovada etapa a etapa, tag imutável, equivalência estrutural com produção provada por impressão digital, quatro Release Gates fechados e infraestrutura de governança aplicada. Nada no código impede a publicação.

### A infraestrutura está pronta?
**Não.** Faltam três coisas, e a primeira é categórica: **não existe backup nem PITR** — o banco de produção não tem como voltar atrás. As credenciais que permitem destruí-lo estão em texto claro numa estação de trabalho. E há uma automação capaz de alterar o schema sem janela. Nenhuma delas é difícil de resolver; todas são obrigatórias.

### A operação está pronta?
**Não.** Zero documentos jurídicos publicados, 1 profissional de 3 na Rede, 40 contas de teste em produção, plantão não nomeado e ensaio ponta a ponta não executado.

### O primeiro paciente pode entrar?
**Não.** Ele entregaria história clínica num sistema sem base legal publicada, sem backup e com Rede insuficiente para concluir a própria Curadoria — que exige exatamente três opções. A jornada travaria no meio, com uma pessoa real esperando.

### O lançamento pode ocorrer?
**Sim, por etapas, e não hoje.**

Separando o que costuma ser confundido:

- **Publicar o código `4ad2f1f`** é de baixo risco e deve acontecer assim que houver backup: não altera dados, o rollback da Vercel é instantâneo, e leva ao ar o `/api/health`, as páginas de governança e as correções dos quatro Release Gates. **Publicar melhora o sistema que já está no ar.**
- **Abrir para o primeiro paciente** exige a operação completa: jurídico, Rede, limpeza, plantão e ensaio.

**Parecer: 🟡 GO CONDICIONADO** para a publicação do código, satisfeitas as decisões D1, D2 e D3. **NO GO** para o primeiro paciente até o cumprimento das Fases 2, 3 e 5.

Há uma circunstância favorável que não durará: **zero seleções e zero conexões em produção.** Ninguém completou uma Curadoria ainda. A janela para arrumar a infraestrutura sem afetar o trabalho de ninguém existe, e é agora.

---

## Anexo — Identificadores para consulta futura

| Item | Valor |
|---|---|
| Commit da release | `4ad2f1f02fabe3c538ff6782a3cfd8bf330ce59c` |
| Tag | `lancamento-v1.0.0` → objeto `830644d770c56854fd276ab8b37ea9b17cfad7dd` |
| Commit da pausa | `6dcbc02d4e78ca1c371828dd0f4f89414ebf6ce9` |
| Commit anterior em produção | `ef7b7e9457db4a5f259f6c5af862cf691779cc83` |
| CI verde | run `30857578623` |
| Stash do espelho | `3b9b372a089900fb15af6637506aa8ba9f8c601c` |
| Execução da integração | `workflow_run 1c724448f10945c3bb5a9eab71077203` |
| Impressão do schema de governança | 157 itens · `ab84ae1881ec4ec303ac1f2efc50fbbd` |
| Impressão do ledger | 91 versões · `9081b5d131542eff5fcca498c485463e` |
| Projeto Supabase | `awdlmeykminwyifnygkm` (`aliviar-2-prod`, `sa-east-1`) |
| Organização | `rhwpolzovggehgokyloq` (`aliviar-alpha`, plano `free`) |
| Projeto Vercel | `prj_D8UhxU9oBRFLPRGkGVH3oCOxJcFu` / `team_MrA9yI3aYtigZx8OFoVzQtZu` |
| Deploy em produção | `dpl_EjKqv1HScXh3ftDb5Bt2Fe9dxUJM` (candidato a rollback) |
