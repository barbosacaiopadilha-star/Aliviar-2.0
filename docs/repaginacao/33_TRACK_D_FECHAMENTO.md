# 33 · Track D — fechamento

**Estado:** implementada, pronta para o **04 VERIFICADOR** · 2026-08-11
**Contrato que este documento fecha:** [32](32_TRACK_D_LIMPEZA_E_CAPACIDADE_ENTERRADA.md)
**Base:** `9783310` · ledger **121** · nenhuma migration, RLS, grant ou action

> ### O bloco chamado "limpeza" guardava a única porta de uma fase do Método.
>
> Vinte e oito arquivos saíram com substituto vivo provado. **Dez ficaram, com
> o motivo escrito.** E `mandatory-filters` ficou porque apagá-lo removeria a
> única superfície da fase Filtros do COS — e faria `actions-have-callers`
> ficar verde por **ausência**.

---

## 1 · A régua que decidiu cada alvo

```
uso zero COM substituto vivo nomeado  →  código morto: sai
uso zero SEM substituto               →  capacidade enterrada: fica, registrada
```

É a regra da Fundação — *construir → provar uso zero → remover* — com a etapa
que faltava explicitada: **provar o substituto**, não só a ausência de import.

## 2 · A cascata foi calculada, nunca decorada

Remover as sete raízes de R1 → recalcular quem ficou com zero importadores →
remover → repetir. **Convergiu em quatro rodadas**, e o discriminador que
impediu o estrago é este: só entra na cascata quem **tinha** importadores e
perdeu **todos** para ela. Órfão pré-existente não é vítima de cascata — é
capacidade enterrada, e foi assim que os dez ficaram de fora automaticamente.

| rodada | entraram |
|---|---|
| raízes | 12 (7 de R1 + R2..R5) |
| 1 | 11 — `faq-book-turn`, `final-actions`, `golden-thread`, os cinco `portal-*`, dois `use-portal-*`, `video-section` |
| 2 | 3 — `faq-cards`, `portal-narrative`, `portal-scenes` |
| 3 | 1 — `portal-frames` |
| 4 | 1 — `section-eyebrow` |
| **total** | **28** |

Conferência final: **nenhum vazamento** — nenhum removido continuava importado
por sobrevivente. `link-button.tsx` **ficou**, com 9 importadores, dos quais 5
sobrevivem.

## 3 · O que saiu (28) e o que ficou (10)

**Saíram** — cluster da landing morta (22), `components/index.ts` (sem
exports), `sem-curadoria.tsx` (substituto: `PatientEmptyState` — **fecha
GAP-C-1**), os dois cartões do `/admin/ace` (rota já removida) e
`patient-status-widget` (substituto: `patient-home-state`).

**Ficaram, com motivo no repositório:** `mandatory-filters` (GAP-D-1),
`patient-notifications-list` (GAP-D-2), `ui/skeleton` e `ui/tabs` (biblioteca
canônica da Fundação, D-2), e os seis do GAP-D-3 — `human-review-history`,
`activity-feed`, `evidence-card`, `jornada-timeline`, `evidencia-chips`,
`scroll-action-link`.

## 4 · T-D-2 — o detector, que é o produto real

`tests/unit/track-d-detector-de-orfaos.test.ts`. Nenhum arquivo de
`src/components` pode ter zero importadores fora de uma **allowlist com motivo
escrito**. Ele teria pego `CuradoriaDecisionPanel`, `SemCuradoria`,
`WhatsappContact` e `mandatory-filters` **antes** de cada uma das quatro
descobertas.

A allowlist é verificada nos **dois sentidos**, e isso importa: nenhum órfão
fora dela **e** nenhuma entrada nela que já não seja órfã ou que aponte para
arquivo inexistente. Lista que apodrece em silêncio é a mesma doença com outro
nome. No dia em que a Mesa renderizar `mandatory-filters`, a entrada vira
mentira e o teste **obriga** a removê-la — é assim que o GAP-D-1 fecha em voz
alta.

## 5 · `actions-have-callers` — corrigido, não mantido

O contrato §8 pedia manter; a missão pediu corrigir. **Corrigi, e o teste
estava mesmo afirmando o que é falso.**

Ele concatenava `src/app` + `src/components` **inteiros** numa string e
perguntava se o nome da action aparecia. Um arquivo órfão contém a chamada —
então **ele satisfazia a própria verificação**. Medido:

```
FLUXO_COMPLETO, por alcance real a partir de src/app:
  10 actions   ALCANÇÁVEIS
  addMandatoryFilterAction   ENTERRADA
  addPreferenceAction        ENTERRADA
```

A régua passou a ser o grafo de imports a partir de `src/app`, com o módulo que
**declara** as actions excluído da fonte de chamadores. E a mentira virou fato
nomeado: as duas ficam numa lista `ENTERRADAS`, afirmada nos dois sentidos — a
porta existe (não pode ser apagada) **e** continua inalcançável (o gap continua
aberto).

O guarda fraco original — *toda action tem algum chamador em qualquer lugar* —
permanece: ele ainda pega uma action escrita sem nenhuma tela.

## 6 · Testes ajustados, e o que se perdeu com honestidade

| arquivo | o quê |
|---|---|
| `entrega-unica-e-superficies-mortas` | **estendido** (T-D-1): 20 alvos com substituto nomeado + 5 guardados que **não podiam** sair |
| `track-d-detector-de-orfaos` | **novo** (T-D-2) |
| `track-d-landing-viva` | **novo** (T-D-4): a rota pública monta, e as sete seções editoriais + herói continuam na composição |
| `actions-have-callers` | **corrigido** (§5) |
| 12 arquivos de teste | **removidos** — cobriam exclusivamente código morto |
| `motor-dependency-graph` | **aparado**: dos 13 motores, 12 eram da landing morta; sobrou `header-compaction`, e o guarda segue valendo para o próximo motor |
| `unificacao-experiencia` | um `it` sobre `landing/v2/*` ficou sem alvo; o que ele protegia segue coberto pelo teste de links internos, logo abaixo dele |
| `patient-fase2-architecture` | duas listas apontavam para arquivos removidos; ficaram no consumidor que sobreviveu (`public-footer`) |

`landing-launch-divergences` saiu inteiro: guardava decisões de lançamento da
landing **morta** (cartas do FAQ, `final-actions`). O guarda de `wa.me` que ele
continha está coberto por T-C-4, que exige o número numa fonte única.

## 7 · Provas de perda

| | mutação | caiu |
|---|---|---|
| **M-D1** | recriar `portal-experience.tsx` vazio | **3** — T-D-2 (órfão fora da allowlist, contagem dos dez) e T-D-1 |
| **M-D2** | remover `mandatory-filters.tsx` | **8**, em três arquivos — T-D-1, T-D-2 (allowlist apodrecida) e `actions-have-callers` nos dois sentidos |
| **M-D3** | apagar uma entrada da allowlist sem apagar o arquivo | **2** — T-D-2 |
| **M-D4** | remover `link-button.tsx` junto com a cascata | **5 erros de compilação** + T-D-1 |
| **M-D5** | tirar o herói e uma seção da landing viva | **2** — T-D-4 |

**M-D2 é a que importa: ela prova que a Track soube não apagar.** Nenhuma
mutação permaneceu — `git status src/` vazio ao fim de cada uma.

> Registro de método: em M-D4 usei `tsc` no lugar do build completo. É a mesma
> prova (o import quebra), custa segundos em vez de minutos, e o build completo
> foi executado à parte, verde.

## 8 · Regressão

| | |
|---|---|
| suíte de componentes | **687/687** |
| suíte unitária | 2609 passed · **1 pré-existente** |
| typecheck | limpo |
| `npm run build:local` | **verde**, bundle íntegro |
| ledger | **121** — inalterado |
| rotas | nenhuma saiu; `next.config.ts` **intocado** |

**A falha unitária é a mesma de sempre e é alheia:**
`mecanismo-de-discordancia` › *G-6* lê `supabase/migrations/*`, e a Track D não
tem um único arquivo SQL no delta. Já foi provada idêntica no HEAD-base na
Track C.

## 9 · Impacto

**Paciente: nenhum.** Nada que ela alcança hoje mudou. **Curador: nenhum agora**
— `GAP-D-1` registra que a fase Filtros continua inexecutável, o que **já era
verdade** antes desta Track; a diferença é que agora está escrito e testado.
**Operação: nenhum.**

## 10 · Gaps

| Gap | Estado |
|---|---|
| **GAP-D-1** — fase Filtros do COS inexecutável | **ABERTO** · destino **Bloco 11** · fecha quando a Mesa der superfície a `mandatory-filters`, e T-D-2 + `actions-have-callers` **obrigam** o registro a acompanhar |
| **GAP-D-2** — "marcar notificação como lida" sem superfície | **ABERTO** |
| **GAP-D-3** — seis órfãos sem substituto provado | **ABERTO** · fecha por alvo, com substituto **nomeado** |
| **GAP-C-1** | ✅ **FECHADO** — `sem-curadoria.tsx` saiu; `PatientEmptyState` é o substituto vivo |
| `GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` · D-5 · D-10 · GAP-D12-C1 · A3b/A4 | **intocados** |
| `FOUNDATION_VERIFICATION.md` fora do Git | **intocado**, por instrução expressa |

## 11 · Observação registrada, não resolvida

`src/app/globals.css` mantém a classe `.golden-thread-path`, órfã desde que
`golden-thread.tsx` saiu. CSS não é import, o contrato §7 restringe
`src/app/**` a "apenas se um import quebrar", e nenhum quebrou. Fica para o
passe final — **não é resíduo silencioso: está escrito aqui.**

---

# TRACK D IMPLEMENTADA — PRONTA PARA O 04 VERIFICADOR

**O que esta Track entrega de mais duradouro não é o que ela apagou.** É que,
depois de T-D-2 e da correção de `actions-have-callers`, uma superfície órfã
deixou de ser achado de auditoria e passou a ser **falha de suíte**.
