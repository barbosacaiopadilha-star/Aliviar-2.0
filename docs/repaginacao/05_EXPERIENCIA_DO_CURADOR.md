# 05 · Experiência do Curador

> **A Mesa não é redesenhada.** A Rodada 2 registrou que *"o contexto nunca falta
> ao Curador… não foi preciso abrir outra guia nem memorizar nada para julgar"*.
> A arquitetura de quatro painéis fica. O que muda é ergonomia, repetição e
> coerência de estado.

---

## 1. Fila — o que precisa de mim

Hoje a fila responde *"qual caso eu assumo"*. Precisa responder também *"o que
está esperando por mim"*.

| Pergunta | Como |
|---|---|
| o que precisa da minha atenção? | agrupamento **por ato devido**, não por data |
| de quem é a vez? | marca de estado por caso (§13) |
| o que está parado, e por quê? | frase de bloqueio nominal, como a Mesa já faz |
| há documento novo? | marca no caso |
| qual é o próximo ato? | rótulo da ação primária, **já existe** no painel de entrada |

**⚠️ Validação obrigatória antes de certificar a fila (§29 da missão):** simular
**5–10 casos sintéticos simultâneos** em estados diferentes. A Rodada 2 conduziu
**um** caso por todos os estados (B2-4) — **a fila com vários casos nunca foi
observada.** Nenhum agrupamento ou ordenação deve ser certificado sem isso.

## 2. Mesa — sete correções de ergonomia

Todas nascem de fricções numeradas. Nenhuma toca a arquitetura.

| # | Fricção | Correção |
|---|---|---|
| **C2** | seleção dos três caminhos é **estado local**; navegar entre perguntas perde a seleção | **persistir a seleção** — é o único item da Mesa que pode exigir backend (§25 nível C) |
| **C4** | dois vocabulários para o mesmo estado: contadores no topo × frase na barra | **uma origem, duas apresentações** — a frase deriva dos contadores (§13) |
| **C5** | Case diz *"Concluída"*, Mesa diz *"aguarda você"* | **§13** — fonte única |
| **C6** | justificativa da eliminação só é exigida no servidor | exigir **também no cliente**, sem remover a guarda do servidor |
| **C7** | *"Encerrar e gerar o Relatório"* só aparece com as 10 exigências satisfeitas — *"quem não rolar até o fim não descobre que existe um botão"* | o botão **existe sempre**, **desabilitado**, com **o que falta** ao lado. Honestidade sem invisibilidade |
| **C8** | relatório emitido aceita cliques que devolvem erro (`ERR-JQTV3FXQ`) | ações **indisponíveis** quando o relatório está congelado — o produto já **recusa** corretamente; falta a interface dizer antes |
| **C9** | atalhos existem e não se anunciam | dica de `?` junto ao botão de ajuda |

**C2 é o único com risco de backend. Os outros seis são apresentação.**

## 3. Redação — dezenove textos viram quantos?

**A evidência (C1, D2-5):** 9 juízos + 9 pareceres + 1 do conjunto = **19 textos
livres para 3 profissionais** — e *"juízo e parecer pedem, com outras palavras, a
mesma leitura"*.

**Princípio P5: escrever uma vez → revisar → assumir autoria → entregar.**

| Onde | Natureza | Decisão |
|---|---|---|
| **Juízo** (H8–H11) | ato de domínio, versionado, append-only | **permanece integral** — é o Método |
| **Parecer** por profissional | texto de apresentação à paciente | **oferece o juízo como ponto de partida**, editável, com autoria do Curador |
| **Justificativa do conjunto** | por que estes três, juntos | **permanece** — é a única que fala do conjunto |
| **Relatório** | documento final | **compõe** a partir dos anteriores; não pede reescrita |

> **Repetição legítima:** juízo (interno, versionado) e parecer (externo,
> editorial) têm **destinatários diferentes**. **Repetição redundante:** pedir que
> o Curador **redigite** o que já escreveu.
>
> **A correção é oferecer, nunca preencher.** O campo nasce vazio; um botão
> *"partir do meu juízo"* traz o texto para edição. **A guarda G-2.3-5 e sua
> emenda cobrem exatamente este caso** — alternativa pedida pelo Curador, fora do
> campo, inserida só por ato dele.

**D2-4 — a justificativa do conjunto aparece duas vezes na mesma tela:**
consolidar em uma.

## 4. Relatório — emitir ≠ entregar

Ver [10_ENTREGA_DA_CURADORIA](10_ENTREGA_DA_CURADORIA.md). Do lado do Curador:

- **C3** — *"Entregar a Curadoria"* tem confirmação em dois passos e *"clicar o
  primeiro botão e sair não entrega"*, com `delivered_at: null` confirmado no
  banco. A confirmação **permanece** (ato irreversível merece), mas a tela
  precisa dizer **que ainda não entregou** enquanto o segundo passo não vier.
- **D2-8** — estado do Relatório divergente entre duas telas → **§13**.
- **D2-3** — dois caminhos para o mesmo relatório → consolidar.

## 5. Informação repetida ao Curador

**D2-6** e **D2-7** (duas contagens do mesmo universo) → ver §14.

## 6. O que fica exatamente como está

Contexto lateral permanente · mensagens de bloqueio nominais · *"aguarda você"* ×
*"depende de outra etapa"* · *"é sua, nunca do sistema"* · incompletude legítima
declarada · recusa de editar relatório emitido · as seis etapas · os quatro
painéis.

**A Rodada 2 registrou cada um destes como acerto. Tocá-los seria regressão.**
