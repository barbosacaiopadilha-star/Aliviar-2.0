# Inventário do Estado Atual — Congelamento Arquitetural da Curadoria

> **Etapa 1** da sequência de revisão arquitetural (Etapa 0 = congelar · **Etapa 1 = inventariar** ·
> Etapa 2 = auditar · Etapa 3 = definir a 2.0 · Etapa 4 = aprovar · Etapa 5 = retomar).
>
> **Data:** 2026-08-04 · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` · **HEAD:** `97ed8b2`
>
> Levantamento de estado. **Nada foi alterado, aplicado, commitado, publicado ou descartado.**
> Os únicos comandos executados foram de leitura e diagnóstico (`git`, `tsc --noEmit`,
> `vitest run`, listagens read-only de migrations e deployments).

---

## 0. Ordem de congelamento — registro

**Em vigor desde 2026-08-04.** Suspensos: novas funcionalidades, telas, componentes, fluxos;
alterações no Motor de Compatibilidade, na Mesa, nos painéis (Paciente, Curador, Concierge,
Administrador); novas migrations da Curadoria; refatorações estruturais; mudanças de
arquitetura; alterações em relatórios, cruzamento, critérios e subcritérios.

**Permanecem autorizados:** correções de bug crítico, correções de segurança, correções que
impeçam o funcionamento, testes, diagnósticos, auditorias, leitura de código, levantamento de
arquitetura, documentação.

**Nenhuma tarefa de implementação estava em execução quando a ordem chegou.** A sessão em
curso era leitura para a auditoria operacional (Etapa 2), já concluída em
[`curadoria/AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md`](curadoria/AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md).

---

## 1. Saúde do repositório — verificada agora

| Verificação | Comando | Resultado |
|---|---|---|
| Tipagem | `npm run typecheck` | ✅ **limpa** (exit 0) |
| Testes unitários | `npm test` | ✅ **141 arquivos · 1.782 testes · 0 falhas** (1 todo) — 11,9 s |
| Testes de componente | `npm run test:components` | ✅ **50 arquivos · 419 testes · 0 falhas** — 25,9 s |
| Testes de integração | `npm run test:integration` | ⏸️ **não executados nesta sessão** — exigem a stack Supabase local compartilhada entre worktrees; rodá-los agora derrubaria seeds de outras sessões. Sem indício de quebra. |
| E2E (Playwright) | `npm run test:e2e` | ⏸️ **não executados** — exigem build local + stack. Última execução conhecida (commit `ef7b7e9`) registra **pendência declarada**: três specs sem rodada verde (`reconstrucao-fluxo-completo`, `connection-choice`, `relationship-status`) por timeout de sessão, e triagem aberta de `auth`/`authorization`/`patient-portal`/`admin-professionals`. |

**Nenhum teste quebrado conhecido nas suítes executáveis sem banco.** A única dívida de teste
registrada é a de E2E acima, herdada e documentada em mensagem de commit.

---

## 2. Mudanças não commitadas

Árvore **sem modificações rastreadas** (`git status` não lista nenhum `M`). Existem **8 arquivos
não rastreados**, todos preservados:

| Arquivo | Natureza | Classificação |
|---|---|---|
| `supabase/migrations/20260803170000_menor_privilegio_nas_funcoes_de_governanca.sql` | 191 linhas — revoga `EXECUTE` de `PUBLIC` em 7 funções de governança documental e fecha a autorização de `pendencias_legais_do_profissional` | **Correção de segurança — autorizada pelo congelamento.** Aguardando decisão de commit/aplicação |
| `tests/integration/governanca-privilegios.integration.test.ts` | 369 linhas — prova a camada de privilégio (`anon` recusado ⇒ `PUBLIC` sem privilégio) e que nenhum fluxo legítimo quebrou | Par da migration acima |
| `docs/MENSAGEM_PARA_ADVOGADO_DOCUMENTOS_DIGITAIS.md` | documento | Fora da Curadoria |
| `docs/PENDENCIAS_JURIDICAS_PARA_IMPLEMENTACAO_DOCUMENTAL.md` | documento | Fora da Curadoria |
| `docs/PLANO_OFICIAL_DE_LANCAMENTO_1_0.md` | documento | Fora da Curadoria |
| `docs/REC-03_REGISTRO_DE_APLICACAO_REMOTA.md` | documento | Fora da Curadoria |
| `docs/RELATORIO_FINAL_DE_PRONTIDAO_1_0.md` | documento | Fora da Curadoria |
| `docs/curadoria/AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md` | documento | **Produto da Etapa 2**, criado nesta sessão |

⚠️ **Referência quebrada a registrar:** o cabeçalho da migration cita
`docs/ACHADO_SEGURANCA_FUNCOES_GOVERNANCA_PUBLIC.md`, **que não existe no repositório** — nem
rastreado, nem não rastreado, nem em histórico. O achado que a justifica não está escrito.

### Stashes — **não descartar**

| | Descrição |
|---|---|
| `stash@{0}` | "espelho da b2 na arvore de main — Passo 2 do Bloco A (não descartar sem autorização)" |
| `stash@{1}` | "Incremento 3 (relatório de inércia) — fora do escopo do RC1" |

---

## 3. Branches

### 3.1 Situação da branch atual

`seguranca/menor-privilegio-funcoes-governanca` está **em paridade exata com `origin/main`**
(`0 ahead, 0 behind`, ambos em `97ed8b2`). Ela existe apenas como espaço de trabalho da correção
de segurança não commitada — **nenhum commit próprio ainda**.

### 3.2 Branches com trabalho relevante

| Branch | HEAD | Estado | Classificação sob o congelamento |
|---|---|---|---|
| `main` | `97ed8b2` | = `origin/main`; publicada em produção | Base |
| **`g0-1-regime-de-instrumentos`** | `3e3a577` | commitada e publicada em `origin`; **PR deliberadamente não aberto** | ⏸️ **Congelada por decisão anterior** — a integração Supabase↔GitHub aplica DDL ao mergear em `main`; aguarda janela autorizada |
| `remediacao/bloco-b` | `31c5735` | `6 ahead, 1 behind` de `origin/remediacao/bloco-b` | ⏸️ Aguardando redefinição |
| `remediacao/b2-verificacao-release` | `b1129d9` | worktree ativo em scratchpad | ⏸️ Aguardando redefinição |
| `remediacao/bloco-e` | `d8daba5` | worktree `onda1-bloco-e` | ⏸️ Aguardando redefinição |
| `remediacao/bloco-i1` | `066fd0b` | worktree `onda1-bloco-i1` | ⏸️ Aguardando redefinição |
| `remediacao/bloco-k1` | `e422b51` | worktree `onda1-bloco-k1` | ⏸️ Aguardando redefinição |
| `remediacao/bloco-a`, `-b6`, `-c`, `-d`, `-g1` | vários | locais, sem worktree | Blocos com "docs: record …" no topo — aparentemente encerrados |
| `feat/curadoria-compartilhada` | `1a99933` | `1 ahead` de `aliviar/…` | ⏸️ Antiga |
| `release/arquitetura-canonica` | `fc7179e` | publicada | Histórica |
| `calibration/adr-032` | `f9f3284` | local | Histórica |
| `backup-antes-da-reorganizacao`, `backup-apos-primeira-reorganizacao` | `d77e085`, `9070eb3` | locais | Backups — **não remover** |
| `pr/2` | `1c2c8d6` | hotfix landing (Copilot) | Aberto no GitHub |
| 8 branches `claude/*` | várias | sessões de agente | Efêmeras; três apontam para `ef7b7e9` |

### 3.3 Worktrees ativos (8 — **nenhum com trabalho perdido, mas todos ociosos**)

```
C:/Users/barbo/Projects/aliviar-conexao                          97ed8b2  [seguranca/menor-privilegio-...]
…/scratchpad/wt-ci                                               b1129d9  [remediacao/b2-verificacao-release]
.claude/worktrees/ecstatic-tesla-649d9e                          ef7b7e9  (detached)
.claude/worktrees/inspiring-dijkstra-7d2753                      ef7b7e9  (detached)
.claude/worktrees/mystifying-yonath-6214d7                       ef7b7e9  (detached)
.claude/worktrees/onda1-bloco-e                                  d8daba5  [remediacao/bloco-e]
.claude/worktrees/onda1-bloco-i1                                 066fd0b  [remediacao/bloco-i1]
.claude/worktrees/onda1-bloco-k1                                 e422b51  [remediacao/bloco-k1]
```

⚠️ **Risco operacional ativo:** os worktrees compartilham a **mesma stack Supabase local**.
Sessões concorrentes apagam seeds, rotacionam senhas e disputam a porta 3001. Durante o
congelamento, convém não abrir mais de uma sessão de teste por vez.

---

## 4. Migrations

**Ledger de produção e repositório estão reconciliados.** A deriva histórica
(`20260731190334` × `20260730100000`) descrita em
[`curadoria/PLANO_RECONCILIACAO_LEDGER.md`](curadoria/PLANO_RECONCILIACAO_LEDGER.md)
**foi resolvida**: produção registra hoje o nome do repositório.

| | Quantidade |
|---|---|
| Migrations no repositório | **92** |
| Aplicadas em produção (`awdlmeykminwyifnygkm`) | **91** |
| No repositório e **não aplicadas** | **1** |
| Em produção **sem arquivo** no repositório | **0** |

**A única pendente:**

```
20260803170000_menor_privilegio_nas_funcoes_de_governanca.sql
```

— não commitada, não aplicada, não publicada. É correção de segurança (autorizada), mas
**aplicá-la exige janela e autorização explícita**: a integração Supabase↔GitHub aplica DDL ao
mergear em `main`, e produção opera sem backup/PITR confirmado.

**Estado do banco local:** não verificado nesta sessão (exigiria subir a stack compartilhada).
`npm run supabase:ledger:check` é o comando que responde isso quando for necessário.

---

## 5. Deploy

**Nenhum deploy parcial ou com erro.** Todos os 20 deployments mais recentes do projeto Vercel
`aliviar-2-0` (`prj_D8UhxU9oBRFLPRGkGVH3oCOxJcFu`) estão em estado `READY`.

| | |
|---|---|
| **Produção vigente** | `dpl_5Qmjt3qHJr9WiafTSbQCD5ZCnRc5` · commit `97ed8b2` · "ci(deploy): publicar Aliviar 1.0 em producao" · `READY` |
| **Deployment mais recente** | `dpl_AqBM4HiaPBVdzpkrap7RU4sVANp8` · commit `3e3a577` (branch `g0-1-regime-de-instrumentos`) · `target: null` = **preview, não produção** — coerente com o congelamento do G0.1 |
| **Rollback disponível** | sim — vários `isRollbackCandidate: true`, o anterior sendo `ef7b7e9` |

**CI:** um único workflow (`.github/workflows/remediacao.yml`), disparado em `pull_request` e em
push para `main` e `remediacao/**`. O job "gates estáveis (devem passar)" cobre a árvore.

---

## 6. Tarefas em andamento e prompts parcialmente implementados

### 6.1 Em andamento — marcadas **"aguardando redefinição arquitetural"**

| # | Tarefa | Estado real | Onde vive |
|---|---|---|---|
| **T1** | **Menor privilégio nas funções de governança** | Migration + teste **escritos e completos**; não commitados, não aplicados. O documento do achado que a justifica **não existe** | Árvore de trabalho, branch atual |
| **T2** | **G0.1 — regime de instrumentos documentais** | Commitada (`3e3a577`) e publicada no branch remoto; **PR proibido** até janela autorizada | `g0-1-regime-de-instrumentos` |
| **T3** | **Blocos de remediação B / B2 / E / I1 / K1** | Commitados em branches próprias com worktree aberto; sem merge | 5 branches + worktrees |
| **T4** | **Triagem de E2E do Catálogo 1.1.0** | Declarada pendente no próprio commit `ef7b7e9`: 3 specs sem rodada verde + 4 áreas por triar | `main` (dívida herdada) |

### 6.2 Implementado parcialmente pelo Método — **não é bug, é escopo aberto**

Estes itens têm ADR ou registro canônico e ficaram deliberadamente incompletos. **Todos entram
na Etapa 3 como insumo.**

| # | Item | Registro | Estado |
|---|---|---|---|
| **I1** | **Chave de ordenação interna de leitura** | `MODELO_CURADORIA_V1.md` §11 | **Sem definição** desde a ADR-042. A Mesa apresenta na ordem da Rede — arbitrária. Exige ADR |
| **I2** | **Opções canônicas de P3–P7** (5 conceitos de tradução) | `protocolos.ts`, marcadas `OPCOES_PROVISORIAS_*` | Listas provisórias em código; nem o doc nem a migration as materializam. Pendência de Método |
| **I3** | **Compatibilidade Relacional — implantação** | ADR-065, ordem prescrita: migration → motor → Mesa → Relatório → Dashboard | Migration, motor, Mesa e Relatório **feitos**; **Dashboard não** |
| **I4** | **Ideias v1.1** | registro próprio | Frequência de condutas + itens 🟡 dos RELEASE BLOCKERS — não implementar |
| **I5** | **ACE (P001–P010)** | ADR-035/036 descontinuaram o P009 | `runAceExecution` **sem nenhum chamador** em `src/`; dashboards e entrega legada ainda vivos. Destino formal por decidir |
| **I6** | **Módulo `discovery` (Busca Direta)** | previsto no plano técnico | Reservado e vazio |
| **I7** | **Reconciliação de documentos canônicos** | — | `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md` descrevem produto anterior à ADR-042 |

### 6.3 Bloqueio operacional que independe de software

**A Rede real é inexistente** — zero profissionais reais publicados em produção. A Curadoria não
roda sem eles. Isto continua sendo, como no RC1, o único impedimento real de operação.

---

## 7. Resumo em uma tela

| Pergunta | Resposta |
|---|---|
| Quais branches existem? | 26 locais (5 de remediação com worktree, 1 congelada por decisão, 2 backups, 8 efêmeras de agente); 10 remotos em cada um dos dois remotes |
| Quais arquivos foram modificados? | **Nenhum arquivo rastreado.** 8 não rastreados (1 migration + 1 teste de segurança, 6 documentos) |
| Quais tarefas estão abertas? | 4 em andamento (T1–T4) + 7 de escopo aberto do Método (I1–I7) |
| Prompts parcialmente implementados? | Sim: ADR-065 sem o Dashboard (I3); opções P3–P7 provisórias (I2); ordenação sem chave (I1) |
| Migrations pendentes? | **1** — `20260803170000`, de segurança, não commitada nem aplicada |
| Testes quebrados? | **Nenhum** em typecheck, unitários (1.782) e componentes (419). Integração e E2E não executados; dívida de E2E herdada e documentada |
| Mudanças não commitadas? | Sim — os 8 não rastreados acima, mais **2 stashes que não devem ser descartados** |
| Deploy parcial? | **Não.** Produção em `97ed8b2`, `READY`. O deployment mais recente é preview do G0.1, não produção |

---

## 8. Decisões que aguardam o responsável (não tomadas aqui)

1. **T1 — a correção de segurança entra agora ou espera?** É autorizada pelo congelamento, mas
   aplicar DDL em produção exige janela e autorização explícita.
2. **Escrever o `ACHADO_SEGURANCA_FUNCOES_GOVERNANCA_PUBLIC.md` ausente**, ou corrigir a
   referência no cabeçalho da migration.
3. **T2 (G0.1)** — mantém congelada sem PR? (recomendação: sim, até a janela).
4. **T3** — as cinco branches de remediação com worktree: manter abertas ou encerrar os worktrees
   preservando as branches? (recomendação: encerrar os worktrees, preservar as branches — reduz
   a disputa pela stack local sem perder nada).
5. **I5 (ACE)** — descontinuar formalmente por ADR, ou manter? A Etapa 3 depende dessa resposta.

---

*Fim do inventário. Nenhuma das pendências acima foi executada, alterada ou descartada.*
