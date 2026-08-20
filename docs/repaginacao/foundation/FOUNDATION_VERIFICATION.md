# Fundação · Gate de verificação independente (04 VERIFICADOR)

| Campo | Valor |
|---|---|
| **Missão** | 3/15 — Gate independente da Fundação da Repaginação |
| **Base** | `f951a25` |
| **HEAD sob verificação** | `5b737b9` |
| **`origin/main`** | `dff4c86` |
| **Data** | 2026-08-10 |
| **Veredito** | **FUNDAÇÃO REPROVADA — FOUNDATION FREEZE NÃO AUTORIZADO** |

> O gate não reprova a Fundação como desenho. Reprova **uma linha do contrato
> de estado** que produz, num estado que o domínio alcança hoje, a mesma classe
> de contradição que a Fundação existe para eliminar. Todo o resto passou.

---

## 1. Pré-flight

Cadeia confirmada: `dff4c86` → `730294f` → `f951a25` → `6ab0a62` → `46439c6` → `5b737b9` (HEAD).
`730294f` e `f951a25` são **docs-only** (0 arquivos fora de `docs/`).
Árvore com 1 item **untracked pré-existente** (`AGENTS.md`), não produzido pela Fundação.

**Delta da Fundação:** 16 arquivos, +1576/−41 — 7 docs, 9 de código/teste.

| Escopo | Arquivos no delta |
|---|---|
| `supabase/` · migrations · `*.sql` | **0** |
| `src/modules/` | **0** |
| migrations antes → depois | 116 → 116 · ledger sincronizado |

Nenhuma migration, policy, trigger, enum de domínio ou regra de negócio alterada.

---

## 2. Contrato de estado — as dez perguntas

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Quais dados reais entram? | `patient_stories.submitted_at`, `cases.closed_at`, responsável do Caso, `curadoria_reports.emitted_at`, `curadoria_reports.delivered_at` — **todos verificados no schema real** |
| 2 | Estado inventado? | Não. `EstadoCanonico` é vocabulário apresentacional, disjunto de `case_status` |
| 3 | Persistência nova? | **Não.** Zero escrita, zero `async`, zero cliente de banco em `src/foundation/` |
| 4 | Enum de domínio paralelo? | Não — nenhum valor compartilhado com `case_status` |
| 5 | Heurística como fato? | Não, **exceto o achado F-1** |
| 6 | Fallback seguro? | Sim — `INDETERMINADO` com tom neutro e zero ação |
| 7 | `null` vira `false`? | Não — `historia: null` → `INDETERMINADO` |
| 8 | Ausência vira conclusão? | **SIM — F-1** |
| 9 | Emissão vira entrega? | Não — `RELATORIO_EMITIDO` dá `conteudo=false`, ações vazias |
| 10 | Sinalização vira decisão? | Não — `decisaoDaPaciente()` devolve sempre `registrada: false` |

### F-1 · MATERIAL — conclusão vira entrega

O ramo `CASO_CONCLUIDO` devolve `temConteudoParaPaciente: true` e
`acoesPaciente: ["VER_CURADORIA"]` **sem consultar `relatorio.entregueEm`**.

A docstring do próprio campo diz: *"Existe algo para a pessoa abrir agora?
**Só verdadeiro quando entregue.**"* — contrariada pelo ramo, e também pelo
teste que a guarda (`"…só é verdadeiro com entrega ou conclusão reais"`), que
aceita a alternativa permissiva.

**O estado é alcançável.** Provado em transação revertida contra o banco local:

```
apos_criar:    status=NEW       closed_at=NULL
apos_CANCELAR: status=CANCELLED closed_at=2026-08-10 12:25:04.790541+00
relatorio_entregue=0
```

O trigger `enforce_case_status_transition_trigger` grava `closed_at` para
`CLOSED` **e para `CANCELLED`**, e `CANCELLED` é alcançável de todos os estados
iniciais. E `FatosDoCaso` **não tem fato de cancelamento** — nenhuma trilha
consegue expressá-lo sem inventar estado local, que é justamente o que a
Fundação proíbe.

**Correção mínima:** (a) condicionar `temConteudoParaPaciente` e
`acoesPaciente` do ramo 1 a `relatorio?.entregueEm`; (b) acrescentar o fato de
cancelamento com leitura própria; (c) alinhar teste e docstring ao invariante
documentado.

### F-3 · `RESPONDER_PENDENCIA` nunca é produzido

Declarado em `AcaoPermitida`, **zero ramos o emitem**. Quando a pendência torna
a vez do PACIENTE, `acoesPaciente` permanece vazio: a tela diz "é a sua vez" e
não oferece o que fazer.

---

## 3. Provas de perda (mutação controlada)

| Mutação | Resultado |
|---|---|
| Emissão passa a dizer que há conteúdo | **3 testes caem** ✔ |
| Pendência deixa de mandar em quem age | **2 testes caem** ✔ |
| `historia: null` deixa de ser `INDETERMINADO` | **3 testes caem** ✔ |
| Remover chave de papel do mapa | **`tsc` TS2741** ✔ |
| Remover papel do tipo `PapelVisual` | **`tsc` TS2322/TS2345** ✔ |
| Remover a regra `@media (prefers-reduced-motion)` | **nada cai — F-2** |

### F-2 · guarda de reduced-motion vacuosa

`expect(fonte.includes("prefers-reduced-motion")).toBe(true)` é satisfeito por
**menções em comentário**. Removida a regra real de `globals.css`, restam duas
citações em prosa e a suíte segue verde (13/13). A guarda protege a palavra,
não a regra.

---

## 4. Suítes

| Suíte | Comando | Resultado |
|---|---|---|
| typecheck | `npx tsc --noEmit` | **0** |
| lint | `npx eslint <delta>` | **0** |
| unit | `vitest --config vitest.config.ts` | **1 failed · 2503 passed · 5 todo (2509)** |
| components | `vitest --config vitest.components.config.ts` | **594** |
| contrato de estado | idem, arquivo | **22/22** |
| primitivos | idem, arquivo | **13/13** |
| guardas 2.0 | idem, diretório | **151/151** |
| integração HEAD | `with-local-supabase … integration` | **69 failed · 817 passed · 1 skipped** |
| integração BASE `f951a25` | idem, worktree, mesmo banco | **69 failed · 817 passed · 1 skipped** |
| build | `npm run build:local` | **exit 0** |

**Unit 2503/2504:** a falha é `tests/unit/mecanismo-de-discordancia.test.ts ›
G-6`. Causa: `core.autocrlf=true` deixa
`supabase/migrations/20260808150000_mecanismo_de_discordancia.sql` com 19113 B /
365 CR na árvore contra 18748 B / 0 CR no blob, e a asserção compara literais
com `\n`. O arquivo e o teste são **byte a byte idênticos** entre `f951a25` e
`5b737b9` (`6da93adaa2fb`), logo a falha é a mesma na base. Restaurado o blob
LF: **19/19**. Classificação: **B — preexistente / D — ambiente**. Não é
regressão da Fundação.

**Integração 69:** reproduzida e comparada. Resíduo do banco no momento das duas
execuções: `evidencias=3 map=9 cases=1 prioridades=28` — idêntico ao declarado.
Nenhum dos arquivos que falham importa `@/foundation`, `state-mark`,
`gramatica-de-estados` ou `globals.css`. **Base e HEAD falham identicamente.**
Classificação: **ruído de resíduo, sem regressão** — com a ressalva de que a
suíte **não foi executada limpa**, e integração não-executável-limpa não é
integração aprovada.

---

## 5. Eixos do gate

| Eixo | Veredito |
|---|---|
| A · Tokens | **APROVADO** |
| B · Primitives | **APROVADO** |
| C · State Contract | **REPROVADO** (F-1) |
| D · WaitingOn | **APROVADO** |
| E · Shell grammar | **APROVADO** |
| F · Acessibilidade | **APROVADO COM RESSALVA** (F-2) |
| G · Responsividade | **APROVADO** |
| H · Testes | **APROVADO COM RESSALVA** (F-2) |
| I · Integração | **APROVADO COM RESSALVA** (não executável limpa) |
| J · Evidência visual | **APROVADO** |
| K · Ownership | **APROVADO COM RESSALVA** (F-4) |
| L · Não-regressão | **APROVADO** |

### F-4 · `app-shell.tsx` sem dono nomeado

Consta em *"Fronteiras que já vão doer"* com dois pretendentes (C e D) e uma
regra que apenas distingue escopo, sem arbitragem. Não está na tabela de
compartilhados sob a Fundação, então a *Regra de conflito* não o alcança
explicitamente. **Nomear dono ou declará-lo compartilhado** antes de abrir C e D
em paralelo.

---

## 6. Trilhas

| Trilha | Liberada? | Motivo |
|---|---|---|
| **A — Paciente core** | **NÃO** | consome o contrato no ponto exato de F-1 |
| **B — Curadoria e entrega** | **NÃO** | dona de emissão/entrega; F-1 é a fronteira dela |
| **C — Curador** | **SIM**, após F-4 | consome vocabulário, primitivos e gramática — todos aprovados |
| **D — Público e operação** | **SIM**, após F-4 | idem; `middleware.ts` já tem dono único |

---

## 7. Ressalvas registradas

| # | Classe | Ressalva |
|---|---|---|
| **F-1** | **Material** | `CASO_CONCLUIDO` afirma conteúdo disponível sem entrega; `FatosDoCaso` não expressa cancelamento |
| **F-2** | Não material | guarda de reduced-motion satisfeita por comentário |
| **F-3** | Não material | `RESPONDER_PENDENCIA` declarado e nunca produzido |
| **F-4** | Não material | `app-shell.tsx` com dois pretendentes e sem dono |
| **F-5** | Informativo | `estrutura` e `neutro` compartilham o símbolo `·` — cor e texto seguem separando |
| **F-6** | Informativo | `--color-warning: #8a5a1f` divergente de `--color-attention`; **dívida visual a migrar nas trilhas**. A decisão de não mexer agora está **correta** — cinco superfícies vivas a repintariam sem evidência — e a Fundação **não o usou nenhuma vez** |
| **F-7** | Informativo | falha ambiental de CRLF, reincidente; segue sem `.gitattributes` normalizando `*.sql` |

---

## 8. Escopo desta verificação

Nenhuma correção implementada. Nenhum redesenho. Nenhuma alteração de domínio,
de banco de produção ou de implementação. Todas as mutações foram temporárias e
restauradas byte a byte com hash conferido. O worktree da base e os arquivos de
medição foram removidos. As duas sondas temporárias foram apagadas. A única
escrita em banco foi uma transação revertida, sem resíduo.

---

# Re-gate 3B — `5b737b9` → `8181411`

| Campo | Valor |
|---|---|
| **Commits da correção** | `0f30c89` (contrato) · `8181411` (guarda) |
| **Delta** | 7 arquivos, +396/−35 — contrato, vitrine, 2 suítes, 3 docs |
| **Domínio** | `supabase/` 0 · `src/modules/` 0 · `*.sql` 0 · migrations 116 → 116 |
| **Veredito** | **RE-GATE APROVADO COM RESSALVA — FOUNDATION FREEZE AUTORIZADO** |

## F-1 — FECHADO

`concluidoEm` virou `encerradoEm`, com o gatilho do banco citado na docstring, e
nasceu o fato `cancelado: boolean | null` lido de `status='CANCELLED'`, nunca
inferido de `closed_at`. `CASO_CONCLUIDO` passou a exigir entrega.

**Invariante verificado em 18 combinações alcançáveis** (`cancelado × encerrado
× emitido × entregue`, excluída entrega-sem-emissão que o banco proíbe):

> `temConteudoParaPaciente = true` ⇒ `delivered_at` existe
> `VER_CURADORIA` ∈ ações ⇒ `delivered_at` existe

**0 violações.**

Alcançabilidade provada em transação revertida: `NEW → CANCELLED` produz
`closed_at=true, cancelado=true, entregues=0`, e a leitura é `CASO_CANCELADO`,
sem conteúdo e sem ação. Fixtures removidas pelo rollback.

**Cancelado + entregue:** a precedência declarada não chega a ser exercida. O
gatilho permite `DELIVERED → CLOSED` apenas, e `CANCELLED` não tem ramo de
saída — ambos terminais. Um Caso entregue **não pode** ser cancelado depois.
A precedência é, hoje, vacuamente segura. Registrada como **decisão latente**:
se algum fluxo futuro permitir cancelar após entrega, o contrato já decidiu —
por ordenação, não por deliberação — que o conteúdo some.

## F-2 — FECHADO PARCIALMENTE

A guarda passou a ler o CSS **sem comentários** e a exigir bloco `@media` com
corpo. Prova negativa reproduzida:

| variante | resultado |
|---|---|
| regra removida, comentários mantidos | **guarda falha** ✔ |
| `@media (...) { }` vazio | **guarda passa** ✗ |
| regra real com declaração | guarda passa ✔ |

A janela de inspeção do corpo (`slice(inicio, inicio + 600)`) **não é limitada
pela chave de fechamento** do bloco: esvaziado o `@media`, a janela alcança as
regras seguintes e encontra declarações que satisfazem o teste.

**Correção mínima:** recortar o corpo até a chave que fecha o bloco, em vez de
uma janela de tamanho fixo.

## F-3 — FECHADO

`RESPONDER_PENDENCIA` saiu de `AcaoPermitida`. O fato de pendência e o
`waitingOn` continuam. Reintroduzir a ação sem produtor derruba 2 testes.

## F-4 — FECHADO

`src/components/shell/app-shell.tsx` foi para a tabela de compartilhados com
`Fundação` como dono, C e D como consumidoras, e mudança centralizada por
extensão registrada. Sem ambiguidade de dois donos.

## Provas de perda

| Mutação | Resultado |
|---|---|
| M1 · retirar tratamento de cancelamento | **4 testes caem** ✔ |
| M2 · permitir `VER_CURADORIA` sem entrega | **4 testes caem** ✔ |
| M3a · retirar `@media` mantendo comentário | **1 teste cai** ✔ |
| M3b · `@media` vazio | **nada cai** ✗ |
| M4 · reintroduzir ação sem produtor | **2 testes caem** ✔ |

## Regressão

typecheck **0** · lint delta **0** · contrato **37/37** · primitivos **15/15** ·
components **596** · Mesa **37/37** · guardas **151/151** · unit **1 failed ·
2518 passed · 5 todo** (a falha é `G-6`/CRLF, preexistente e já provada) ·
`build:local` **exit 0**.

Integração não repetida: o delta não toca `src/modules/`, `tests/integration/`
nem `supabase/` — nenhum dos módulos das 69 falhas conhecidas.

## Achado novo (registrado, não corrigido)

`src/modules/admin/dashboard-metrics.ts:283` faz
`bump(c.closedAt, "casesConcluidos")` — conta `closed_at` como Caso **concluído**.
Como o gatilho grava `closed_at` também para `CANCELLED`, Casos cancelados entram
na métrica de concluídos. É a mesma inferência que a Fundação acabou de corrigir,
sobrevivendo fora dela. Consumidor externo; §7 manda registrar, não corrigir.

## Foundation Freeze

**AUTORIZADO**, com a ressalva F-2 registrada. Trilhas A, B, C e D **liberadas**.
