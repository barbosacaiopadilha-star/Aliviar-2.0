# Parecer A-1 — o rótulo duplicado da etapa

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `596ca74` — ESSENCIAL, Rodada 1 e Rodada 2 certificadas |
| **Natureza** | arquitetura estrita de A-1. **Zero código** |

---

## A. Estado atual da região

Ordem visual, de cima para baixo, tudo simultaneamente visível:

| # | Elemento | Onde vive | O que carrega |
|---|---|---|---|
| 1 | nome da pessoa | `mesa-header` | quem |
| 2 | área · curador · `N de M etapas` | `mesa-header` | contexto |
| 3 | **"Sua vez: …"** | `mesa-header` | de quem é a vez |
| 4 | alertas | `mesa-header` | exceções |
| 5 | **trilha das seis etapas** — marca de estado + **rótulo** + ponto de destino | `mesa-steps` | **onde estou**, estado, próxima decisão |
| 6 | **faixa de pendência** — marca + **rótulo** + frase (`pending`/`waitingOn`) | `mesa-steps` | o que falta, na etapa atual e na próxima |
| 7 | linha de investigação | `mesa-work` | onde o raciocínio está |
| 8 | **`mesa-work__title`** — **rótulo da etapa** | `mesa-shell:193` | *(nada além de #5)* |
| 9 | `mesa-work__question` — a pergunta da etapa | `mesa-shell:194` | **a tarefa** |
| 10 | conteúdo da etapa | — | trabalho |

## B. A duplicação — e ela cresceu

**A hipótese se confirma, e o número é maior do que a auditoria registrou.**
`MESA_ETAPA_LABELS[etapaAtual]` é renderizado em **três** lugares ao mesmo
tempo:

| Ocorrência | Elemento | Função |
|---|---|---|
| **A** | `mesa-step__label` da etapa **ativa** (`mesa-step--ativa`, `aria-current="step"`) | **localizar** — onde estou entre seis |
| **B** | `mesa-steps__pendencia-etapa` na faixa do E-1 | **distinguir** — separa a linha da etapa atual da linha da próxima |
| **C** | **`mesa-work__title`** | **nada** — repete A sem acrescentar |

| Situação | Rótulos simultâneos |
|---|---|
| etapa ativa **com** pendência | **3** (A + B + C) |
| etapa ativa **sem** pendência | **2** (A + C) |

> **O E-1 acrescentou a ocorrência B — e ela é legítima:** com duas linhas na
> faixa, cada uma precisa dizer de qual etapa fala. **A e B têm funções
> distintas. C não tem nenhuma.**

**Teste do §4 — há diferença funcional entre A e C?** Não. Mesma constante,
mesma etapa, mesmo instante, a poucos pixels de distância. A diferença é só de
estilo: C é um *eyebrow* de 11px em `--color-ambient-accent`. **É duplicação
real**, não divisão de trabalho entre localização e tarefa — porque **a tarefa
já é a linha 9**.

## C. Proposta

**Sai apenas a linha 8** — `mesa-shell.tsx:193`. Uma linha de JSX.

```
antes:   [trilha]  →  Rede elegível  →  Quem pode participar desta Curadoria?
depois:  [trilha]  →  Quem pode participar desta Curadoria?
```

A **pergunta passa a ser o primeiro título da área de trabalho**, que é o §28
literalmente.

**Opção B considerada e descartada:** fundir o rótulo como prefixo da pergunta
(*"Rede elegível — Quem pode participar…"*). Não reduz nada, alonga a linha que
mais importa e piora a quebra no celular. **Opção C (manter) fica excluída pelo
teste do §4.** Não fabrico três alternativas: **A é claramente superior**.

## D. O que permanece — prova do §8

> *"Se eu remover este rótulo, um usuário que chegou direto ainda sabe em qual
> etapa está?"* — **Sim, por três caminhos independentes.**

1. **A trilha**, com `mesa-step--ativa` **e** `aria-current="step"` na etapa
   aberta. É a mesma string, da mesma constante.
2. **A faixa de pendência**, que nomeia a etapa atual quando ela deve algo.
3. **A pergunta**, que é única por etapa — as seis são distintas entre si.

**§9 — entrada direta: o cenário de risco não existe.** A Mesa **não tem rota
por etapa**: vive inteira em `curadoria_tecnica`, e a navegação é em página. Ao
chegar, o shell abre em `decisao.etapa` **e a trilha já renderiza com a etapa
ativa marcada**. Não há como aterrissar numa etapa sem a trilha ao lado.

*(A rota `casos/[id]/[etapa]` é outra superfície — as nove fases do COS. Fora de
A-1.)*

## E. Mobile

**O que é mensurável agora, pelo CSS real:**

| Valor | Fonte |
|---|---|
| `.mesa-work__title` | `font-size: 0.6875rem` (11px), sem `line-height` próprio |
| `.mesa-work__question` | `margin-top: 0.375rem` (6px) — existe **para separar do título** |

**Recuperação estimada: ≈16–17px** (a caixa de linha do título), e **≈22–23px**
se o `margin-top` da pergunta sair junto — o que é correto, já que ele só existe
por causa do elemento removido.

**Por que exatamente aqui importa.** O próprio CSS registra o problema medido:

> *"Com o cabeçalho quebrando em quatro linhas e as etapas em três, ele ocupava
> **295px de uma tela de 844 — 35% da altura permanentemente gasta em
> contexto**."*

O topo já foi tornado `static` no celular por causa disso. **A-1 devolve altura
no primeiro elemento logo abaixo dele** — e o E-1 acrescentou a faixa de
pendência nessa mesma vizinhança. **As duas mudanças se compensam.**

**As alturas renderizadas em 320 / 375 / 768px ficam "a medir na
implementação"** — não invento número que o CSS não me dá.

## F. Delta previsto

| Arquivo | Mudança |
|---|---|
| `src/components/curadoria/mesa/mesa-shell.tsx` | remover a linha 193 |
| `src/app/mesa-curador.css` | remover a regra `.mesa-work__title` (ficaria órfã) e o `margin-top` de `.mesa-work__question` |

**São os únicos.** Varredura: `mesa-work__title` aparece em **exatamente dois
lugares** — a regra CSS e o JSX. **Nenhum teste o referencia.**

**Observação para o Engenheiro:** algum teste que hoje conte ocorrências do
rótulo por `getAllByText` pode ver o número cair. Se cair, é o efeito esperado —
não um defeito.

## G. Testes

| # | Prova |
|---|---|
| **T-A1-1** | a etapa ativa continua identificável **pela trilha** — botão com `aria-current="step"` e o rótulo correto |
| **T-A1-2** | a pergunta da etapa continua visível **e é o primeiro título** da área de trabalho |
| **T-A1-3** | o rótulo **não aparece mais** fora da trilha — nenhuma ocorrência em `mesa-work` |
| **T-A1-4** | o conteúdo da etapa renderiza igual; nenhum bloco desaparece |
| **T-A1-5** | `pending` / `waitingOn` intactos — faixa visual **e** `sr-only` |
| **T-A1-6** | a 320px não há overflow horizontal nem regressão de layout |
| **T-A1-7** | trocar de etapa continua trocando a pergunta e o conteúdo — atalhos de teclado preservados |

**T-A1-7 é acréscimo meu:** a linha removida vive ao lado do `etapaAtual`, e vale
provar que a navegação em página não foi afetada.

## H. Antes × depois

| Métrica | Antes | Depois esperado |
|---|---|---|
| rótulos simultâneos (etapa com pendência) | **3** | **2** |
| rótulos simultâneos (etapa sem pendência) | **2** | **1** |
| linhas de texto entre a trilha e o conteúdo | 2 | **1** |
| altura recuperada (cálculo do CSS) | — | **≈16–23px** |
| altura em 320px | *a medir* | *a medir* |
| altura em 375px | *a medir* | *a medir* |
| altura em 768px | *a medir* | *a medir* |
| **informação perdida** | — | **nenhuma** |

## I. Risco

> **BAIXO.**

**Cenário de falha mais provável:** o Curador não percebe qual etapa está aberta
porque o rótulo saiu da área de trabalho.

**Por que é improvável:** a etapa ativa é a **única** com `mesa-step--ativa` na
trilha, carrega `aria-current="step"` para tecnologia assistiva, e a pergunta
imediatamente abaixo é exclusiva daquela etapa. Além disso, **não existe rota
por etapa** — ninguém chega numa etapa sem a trilha renderizada acima.

**Reversibilidade: máxima.** Um `git revert` de duas hunks, sem domínio, sem
dados, sem contrato, sem infraestrutura nova.

## Gate do §25 — sete de sete

| # | Exigência | Prova |
|---|---|---|
| 1 | existe duplicação real | **3 ocorrências** simultâneas da mesma constante (§B) |
| 2 | a trilha preserva localização | `mesa-step--ativa` + `aria-current="step"` + faixa de pendência |
| 3 | a pergunta preserva a tarefa | `MESA_ETAPA_QUESTIONS`, uma por etapa, intocada |
| 4 | remover não elimina informação | mesma string, mesma constante, visível na trilha |
| 5 | mobile tende a melhorar | ≈16–23px devolvidos no ponto onde o CSS registra 295px/844 |
| 6 | não precisa reescrever texto | **zero** string alterada |
| 7 | sem impacto funcional | um `<p>` a menos; estado, atalhos e `aria-live` intactos |

**Nada de A-4, A-3 ou S-4(cálculo) entrou nesta arquitetura.** A trilha não foi
redesenhada (§13); nenhum estado, papel ou regra cromática foi tocado (§14).

---

# DECISÃO A-1

## EXECUTAR

**Escopo exato:** remover `mesa-shell.tsx:193` e as duas regras CSS que ficam
órfãs. Nada mais.

# PRÓXIMO PACOTE

**Rodada 3 — A-1 isolada.** Uma linha de JSX, duas de CSS, sete provas.

**Explicitamente fora:** A-4 · A-3 · S-4(cálculo) · qualquer limpeza
oportunista na trilha, no cabeçalho ou nos cards.

# PRÓXIMO AGENTE

**`03 ENGENHEIRO`**
