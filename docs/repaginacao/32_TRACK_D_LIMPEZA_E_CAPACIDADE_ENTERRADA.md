# 32 · Track D — o que sai, o que fica, e a capacidade enterrada

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-11 |
| **Base** | `3eb234d` · ledger **121** · árvore com os dois `??` **pré-existentes**, intocados |
| **Natureza** | contrato vinculante. **Zero produção, zero teste, zero migration, zero RLS, zero evidência** |
| **Destinatário** | **`03 ENGENHEIRO`** |

---

## 1 · Pré-flight

HEAD `3eb234d` ✓ · Track C certificada em `3eb234d` ✓ · ledger **121/121** ✓ ·
árvore apenas com `AGENTS.md` e `foundation/FOUNDATION_VERIFICATION.md` ✓ ·
**nenhuma Track encerrada é reaberta** ✓

## 2 · Quantitativo até o fim da repaginação

| | Fatias |
|---|---|
| **concluídas** | Fundação · Bloco 2 (Estados) · Track A · Trilha B · **Track B/B3** · **Track C** |
| **pendentes** | **Bloco 3 → esta Track** · Bloco 7 (Landing) · Blocos 11/12 (Mesa e Fila) · passe final |
| **bloqueadas/adiadas** | D-1 · D-5 · D-6 · D-10 · GAP-D12-C1 · `GAP-B3-COPY-ID` · A3b/A4 · Fila (exige 5–10 casos reais) |

**Caminho crítico:** **Track D → Bloco 7 (destrava com D-1) → Blocos 11/12
(destravam com D-6) → passe final.** A Track D **não** está no caminho crítico
de ninguém, mas o **encurta**: ela remove as três landings mortas antes que o
Bloco 7 tenha chance de editar a errada — que é o motivo pelo qual
[18](18_FASES_DE_IMPLEMENTACAO.md) a colocou cedo.

**Prompts restantes — de 12–16 para 9–12.** A Track C consumiu quatro. Ajuste
apenas por fato novo: esta Track cabe em **duas** passagens (§9).

**Fora do encerramento atual:** Fila do Curador (sem casos reais) · conversa
dentro da plataforma (**D-8: não agora**) · limpeza retroativa do banco local
([29 §16](29_B3_FECHAMENTO_TRACK_B.md)).

## 3 · Bloco 3 confirmado — e reenquadrado

**Confirmo o Bloco 3.** Não há dependência material que o impeça: a landing viva
é `landing/editorial/*`, provada em [`(public)/page.tsx`](../../src/app/(public)/page.tsx),
e nenhuma remoção prescrita aqui toca banco, RLS ou domínio.

**Mas o nome "limpeza" está errado, e a varredura mostra por quê.**

> ### O achado que reenquadra a Track
>
> [`mandatory-filters.tsx`](../../src/components/curadoria/mandatory-filters.tsx)
> tem **zero importadores** — e é a **única** superfície de filtros obrigatórios
> do repositório inteiro (busca por capacidade: `mandatory_filters`,
> `MandatoryFilterKind`, `priority_profile_filters` → só ele).
>
> Ele chama três actions, e **duas delas** — `addMandatoryFilterAction` e
> `addPreferenceAction` — estão na lista `FLUXO_COMPLETO` de
> [`actions-have-callers.test.ts`](../../tests/unit/actions-have-callers.test.ts),
> o teste que afirma que *"a Curadoria é executável de ponta a ponta pela
> interface"*. **Ele passa só porque o arquivo órfão contém as strings.**
>
> E a própria docstring do componente diz para que ele nasceu:
>
> > *"a fase Filtros era a única do COS sem nenhuma superfície… o Curador não
> > tinha onde registrar um requisito inegociável. **Uma etapa que ninguém
> > consegue executar é documentação, não jornada.**"*
>
> **O componente escrito para curar o defeito de action órfã está órfão.** É a
> quarta ocorrência da mesma classe — depois de `CuradoriaDecisionPanel`,
> `SemCuradoria` e `WhatsappContact`.

**Isso não é código morto. É capacidade enterrada — e apagá-la seria o erro.**

## 4 · O princípio que decide cada alvo

> **Uso zero com substituto vivo nomeado é código morto: sai.**
> **Uso zero sem substituto é capacidade enterrada: fica, registrada.**

É a regra da Fundação — *construir → provar uso zero → remover* — com a etapa
que faltava explicitada: **provar o substituto**, não só a ausência de import.

**Falsos positivos já eliminados na varredura:** `components/ads/index.ts` e
`components/journey/index.ts` **são importados por diretório** (`@/components/ads`)
por sete rotas. Zero import por caminho ≠ órfão.

## 5 · Inventário nominal e decisão por alvo

### 5.1 · REMOVER — código morto com substituto provado

| # | Alvo | Substituto vivo |
|---|---|---|
| **R1** | **cluster da landing morta** — raízes `landing/portal-experience.tsx`, `landing/faq-book-section.tsx`, `landing/final-cta-section.tsx`, `landing/v2/` (4 arquivos) **+ cascata exclusiva** | **`landing/editorial/*`**, renderizada por `(public)/page.tsx` |
| **R2** | `components/index.ts` | nada a substituir — **uma linha de comentário, zero exports** |
| **R3** | `curadoria/sem-curadoria.tsx` | **`PatientEmptyState`**, vivo em `paciente/curadoria/page.tsx` — fecha **GAP-C-1** |
| **R4** | `ace/ace-health-check-card.tsx` · `ace/ace-metrics-cards.tsx` | a rota `/admin/ace` **já foi removida**, e há guarda contra retorno em `entrega-unica-e-superficies-mortas.test.ts` |
| **R5** | `paciente/dashboard/patient-status-widget.tsx` | **`paciente/patient-home-state.tsx`**, vivo na Home |

**Cascata da R1 — algorítmica, nunca lista decorada.** Remover as sete raízes;
**recalcular** quem ficou com zero importadores; remover; **repetir até
estabilizar**. Medição do Arquiteto: **~23 arquivos**, incluindo
`golden-thread`, `section-eyebrow`, `video-section`, `final-actions`,
`faq-cards`, `faq-book-turn`, `portal-scenes` e os oito `portal-*`/`use-portal-*`.

> ⚠️ **`link-button.tsx` FICA — 9 consumidores, e a editorial é um deles.**
> `public-header*`, `public-footer*` e `header-compaction` **ficam.** A cada
> rodada da cascata, **reconferir antes de apagar**.

### 5.2 · MANTER com decisão documentada

| # | Alvo | Por quê | Registro |
|---|---|---|---|
| **M1** | `curadoria/mandatory-filters.tsx` | **capacidade do Método sem substituto.** Apagar mataria a fase Filtros do COS | **`GAP-D-1`** → destino **Bloco 11 (Mesa)** |
| **M2** | `profiles/patient-notifications-list.tsx` | as notificações aparecem na linha do tempo, mas **"marcar como lida" não existe em nenhum outro lugar** | **`GAP-D-2`** |
| **M3** | `ui/skeleton.tsx` · `ui/tabs.tsx` | **contrato vigente**: [`FOUNDATION_PRIMITIVES`](foundation/FOUNDATION_PRIMITIVES.md) declara `ui/` **canônica (D-2), 26 componentes**. Dicionário sem consumidor é **vocabulário**, não lixo | — |
| **M4** | `ace/human-review-history.tsx` · `curadoria/activity-feed.tsx` · `curadoria/evidence-card.tsx` · `curadoria/jornada-timeline.tsx` · `curadoria/mesa/evidencia-chips.tsx` · `curadoria/scroll-action-link.tsx` | uso zero **sem substituto integral provado**. Pelo §4, ficam | **`GAP-D-3`** |
| **M5** | `components/ads/**` | **deprecada e explicitamente não removível** pela Fundação — e ainda consumida por 7 rotas | — |

**Nenhuma decisão fica aberta para o Engenheiro.** M1–M5 são decisões
**tomadas**: mantêm-se. A condição de revisão é objetiva e está no §12.

### 5.3 · As sete categorias do §4 da missão, preenchidas

| Categoria | Onde caiu |
|---|---|
| código morto comprovado | **R1–R5** |
| compatibilidade legada ainda alcançável | `ConnectionChoicePanel` modo legado — **fora desta Track** |
| dívida preservada por decisão | **M5** (`ads/`) |
| fixture/teste sem uso | **nenhum encontrado** |
| documentação obsoleta | **nenhuma prescrita** — docs de Track encerrada são histórico |
| export público ainda consumido | **`ads/index.ts`, `journey/index.ts`** — falsos positivos |
| ramo que parece morto e tem estado construtível | **M1, M2, M4** |

## 6 · Impacto

| | |
|---|---|
| **paciente** | **nenhum** — nada que ela alcança hoje muda |
| **Curador** | **nenhum agora**; `GAP-D-1` registra que a fase Filtros continua inexecutável, o que **já é verdade** |
| **operação** | **nenhum** |
| **build** | menos ~23 arquivos e a dependência `gsap` do `faq-book-section` sai do grafo da landing |

## 7 · Limites

| | |
|---|---|
| **migration** | ⛔ **proibida** — ledger fica **121** |
| **RLS · policies · grants** | ⛔ **proibidos** |
| **`src/modules/**`** | ⛔ **não tocar** — nenhuma action é removida, nem a que só o órfão chama |
| **`src/app/**`** | ⛔ apenas se um import quebrar; **nenhuma rota sai** |
| **segurança** | remoção de código não alcançável **não altera superfície de ataque**; nenhum segredo, nenhuma env, nenhum endpoint |
| **mobile / a11y** | **não se aplica** — nenhuma superfície nasce ou muda |
| **evidência visual** | **nenhuma** — não há o que fotografar. Exigir captura aqui seria teatro |
| **cleanup de fixture** | **nenhum** — nada é criado |
| **arquivos proibidos** | `AGENTS.md` · `foundation/FOUNDATION_VERIFICATION.md` · `mandatory-filters.tsx` · `patient-notifications-list.tsx` · `ui/skeleton.tsx` · `ui/tabs.tsx` · `link-button.tsx` · `landing/editorial/**` · `public-header*` · `public-footer*` |

## 8 · Testes

| # | Ação | O quê |
|---|---|---|
| **T-D-1** | **estender** [`entrega-unica-e-superficies-mortas.test.ts`](../../tests/unit/entrega-unica-e-superficies-mortas.test.ts) | as sete raízes de R1 e os alvos R2–R5 **não existem mais** |
| **T-D-2** | **novo — o detector de órfãos** | nenhum arquivo de `src/components` tem zero importadores, **exceto** os da allowlist explícita, cada um com motivo em texto |
| **T-D-3** | **manter intacto** | `actions-have-callers.test.ts` — ⚠️ **continua verde porque M1 fica.** Removê-lo derrubaria o teste, e com razão |
| **T-D-4** | **novo** | a landing viva renderiza `HeroEditorial` e as sete seções editoriais — **prova de que o vivo sobreviveu** |
| **T-D-5** | **remover** | os testes que importam **exclusivamente** arquivos de R1 — `faq-book-section` (2) e `final-cta-section` (1) |
| **T-D-6** | **manter** | os testes de M4 — eles são o que resta de prova sobre capacidade enterrada |

> ### T-D-2 é o produto real desta Track
>
> Ele teria pego `CuradoriaDecisionPanel`, `SemCuradoria`, `WhatsappContact` e
> `mandatory-filters` **antes** de qualquer uma das quatro descobertas. A
> allowlist é o mecanismo honesto: manter um órfão passa a exigir **escrever o
> motivo**, e o motivo fica no repositório.

**Forma da allowlist inicial — texto final:**

```
mandatory-filters      GAP-D-1 · fase Filtros do COS, sem substituto; destino Bloco 11
patient-notifications-list  GAP-D-2 · "marcar como lida" não existe em outro lugar
ui/skeleton, ui/tabs   biblioteca canônica da Fundação (D-2)
human-review-history, activity-feed, evidence-card,
jornada-timeline, evidencia-chips, scroll-action-link
                       GAP-D-3 · uso zero sem substituto provado
```

## 9 · Mutações — provas de perda

| | Mutação | Deve cair |
|---|---|---|
| **M-D1** | recriar `src/components/landing/portal-experience.tsx` vazio | **T-D-2** (órfão fora da allowlist) e **T-D-1** |
| **M-D2** | remover `mandatory-filters.tsx` | **T-D-3** — duas actions do `FLUXO_COMPLETO` ficam sem chamador |
| **M-D3** | apagar uma entrada da allowlist sem apagar o arquivo | **T-D-2** |
| **M-D4** | remover `link-button.tsx` junto com a cascata | **build** + T-D-4 |
| **M-D5** | trocar a landing viva por `portal-experience` | **T-D-4** |

**M-D2 é a mutação que importa:** é a que prova que a Track **soube não apagar**.

## 10 · Regressão mínima

`npm run build` verde · suíte de unidade e componente verde · a landing pública
renderiza as sete seções editoriais · nenhuma rota perdida · nenhum redirect
alterado (`next.config.ts` **intocado** — os redirects de `/curador` e
`/portal-paciente` permanecem) · ledger **121**.

## 11 · Aprovação e reprovação

**Aprova se, e só se:** R1–R5 fora, com a cascata reconferida a cada rodada ·
M1–M5 **intactos** · T-D-1..T-D-6 no estado prescrito · M-D1..M-D5 derrubam o
previsto · build e suíte verdes · ledger 121 · os dois `??` intocados.

**Reprova se:** qualquer alvo de M1–M5 for removido · a allowlist nascer sem
motivo escrito · alguma action sair de `src/modules` · aparecer migration, RLS
ou grant · a landing viva perder uma seção · a cascata for aplicada por lista
decorada em vez de recálculo.

## 12 · Gaps preservados

| Gap | Estado |
|---|---|
| **`GAP-D-1`** — fase Filtros do COS inexecutável | **ABERTO** · destino **Bloco 11** · fecha quando a Mesa der superfície a `mandatory-filters` |
| **`GAP-D-2`** — "marcar notificação como lida" sem superfície | **ABERTO** |
| **`GAP-D-3`** — seis órfãos sem substituto provado | **ABERTO** · fecha por alvo, com substituto **nomeado** |
| `GAP-C-1` | ✅ **FECHA** nesta Track (R3) |
| `GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` · D-10 · GAP-D12-C1 · A3b/A4 | **intocados** |
| `FOUNDATION_VERIFICATION.md` fora do Git | **intocado**, por instrução expressa |

## 13 · Passagens

| # | Quem | O quê |
|---|---|---|
| **1** | **`03 ENGENHEIRO`** | **tudo**: R1–R5 com cascata, T-D-1..T-D-6, allowlist, build e suíte |
| **2** | **`04 VERIFICADOR`** | gate independente, incluindo as cinco mutações |

**Uma passagem de engenharia.** Não há banco, não há migração destrutiva, e o
único domínio tocado é a árvore de componentes. **Certificação pelo
`05 CERTIFICADOR` não é exigida** — não há superfície nova, fato novo nem
promessa nova à paciente.

---

# PRÓXIMA TRACK CONFIRMADA — CONTRATO VINCULANTE PRONTO PARA EXECUÇÃO ACELERADA

**Track D.** O Bloco 3 está confirmado, e mudou de natureza: a varredura por
capacidade encontrou **capacidade enterrada dentro do que o roadmap chamava de
lixo**. Vinte e oito arquivos saem com substituto provado; **dez ficam, com
motivo escrito** — e o `mandatory-filters` fica porque apagá-lo removeria a
única porta da fase Filtros do Método.

**O que esta Track entrega de mais duradouro não é o que ela apaga — é o
`T-D-2`.** Depois dele, uma superfície órfã deixa de ser um achado de auditoria e
passa a ser uma falha de suíte.
