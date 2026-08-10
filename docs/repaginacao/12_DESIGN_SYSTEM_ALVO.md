# 12 · Design system alvo

> **O ponto de partida não é vazio.** A Rodada 1 mapeou um sistema real — escalas
> `--scale-*`, camada semântica, atmosfera por ambiente (regra R20), utilitários
> próprios, folhas por módulo. **O problema é que existem três dicionários sobre
> o mesmo sistema** (D-13) e **duas bibliotecas de primitivos** (D-2).

---

## 1. Uma gramática, quatro sotaques

**Compartilhado:** tipografia · cor semântica · espaço · raio · sombra · motion ·
vocabulário de estado · foco.

**Não compartilhado:** densidade · navegação · fundo.

| Sotaque | Densidade | Fundo |
|---|---|---|
| Landing | generosa | **arquitetura** |
| Paciente | média, respirada | **atmosfera discreta** |
| Curador | **densa** | **liso** — nunca arquitetura |
| Backoffice | densa | liso |

> **Regra dura:** fundo arquitetônico **não entra** em interface operacional. Ele
> é linguagem de acolhimento, não de trabalho.

## 2. Tokens

**Uma fonte, três dicionários viram um** (D-13).

| Camada | Papel |
|---|---|
| **escala** (`--scale-*`) | valores brutos — **ninguém consome direto** |
| **semântica** | `--color-ink`, `--color-attention`, `--mesa-line`… — **é o que a UI usa** |
| **atmosfera** (R20) | variação por ambiente, **sobre** a semântica |

**Cores de estado — já certificadas na Mesa (§13), e valem para o produto todo:**
verde **processual** · âmbar **ato humano** · vermelho **erro/bloqueio** · neutro
**contexto** · azul **estrutura**.

**Verde nunca significa desfecho favorável. Vermelho nunca significa
divergência.**

## 3. Primitivos — de dois sistemas para um

| Duplicação | Decisão |
|---|---|
| **D-2** `ui/` × `ads/` | **`ui/` é canônico.** `ads/` deprecado |
| **D-3** quatro cartões | **um** `Card`, com variantes |
| **D-8** dois sistemas de botão | **um**, com variantes |
| **D-5** três (quatro) estados vazios | **um** `EmptyState` — título + motivo + próximo passo |
| **D-6** três abas, **a oficial órfã** | **adotar a oficial**, remover as outras |
| **D-7** quatro superfícies sobrepostas | **um** `Dialog` + **um** `Drawer` |
| **D-9** três carregamentos | **um** padrão |
| **D-4** três cabeçalhos de página | **um** por shell |

## 4. Componentes que faltam

`StateMark` (cor + símbolo + texto — §13) · `Timeline` (uma só) ·
`ComparisonMatrix` (§04.1) · `DocumentItem` (§07) · `ConciergeLink` (§09) ·
`PendingBlock`.

## 5. Motion

**Permitido:** entrada suave (fade + 8–12px) · hover discreto · feedback de
seleção · transição de estado · carregamento refinado.

**Proibido:** parallax agressivo · zoom · animação decorativa · delay artificial
· cursor extravagante · qualquer coisa acima de 300ms.

**`prefers-reduced-motion` desliga tudo** — já implementado em `globals.css`,
`landing-editorial.css` e `mesa-curador.css`; **deve cobrir o que for
acrescentado**.

## 6. Ordem de adoção

Tokens → primitivos → shells → superfícies. **Nunca migrar uma tela para um
primitivo que ainda não é canônico.**

## 7. Regra de não-remoção

> **Nenhum componente é removido sem prova de uso zero.** A Rodada 1 já produziu
> essa prova para **22 órfãos** (D-12) e para **três landings mortas** (D-11) —
> **esses podem sair.** Qualquer outro exige varredura própria.
