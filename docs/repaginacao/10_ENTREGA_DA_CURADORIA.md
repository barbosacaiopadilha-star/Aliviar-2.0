# 10 · Entrega da Curadoria — emitir ≠ entregar

> **A distinção é legítima e fica.** A Rodada 2 provou que ela funciona: o
> produto **congela** o relatório emitido e **recusa** editá-lo (simulação G,
> vídeo `04`). O problema não é a separação — **é ela ser invisível**.

---

## 1. O que a evidência mostra

| Fato | Evidência |
|---|---|
| emitir **não** entrega | `33` × `40…42` — a paciente não vê nada após a emissão |
| a entrega **funciona** e muda a experiência | `05`, `06`, `50…57` — *"muda tela e tom"* |
| a confirmação em dois passos **não avisa** | C3 — *"clicar o primeiro botão e sair não entrega"*, `delivered_at: null` no banco |
| o estado diverge entre telas | C5, D2-8 |
| há dois caminhos para o mesmo documento | D2-3 (Curador), P7 (paciente) |

## 2. Os três estados, e o que cada lado vê

| Estado | Curador vê | Paciente vê | Ela pode? |
|---|---|---|---|
| **em preparo** | *"Rascunho"* | **nada** | não |
| **emitido, não entregue** | *"Emitido — ainda não entregue"* + **quando será** | *"A Aliviar está preparando"* (§07) | não |
| **entregue** | *"Entregue em [data]"* | **a Curadoria inteira** | sim |

> **A linha do meio é a que hoje não existe para ninguém.** O Curador vê
> "concluído" numa tela e "aguarda você" noutra; a paciente vê Documentos vazio.
> **Nomear esse estado resolve C5, D2-8 e P3 de uma vez.**

## 3. A confirmação em dois passos

**Permanece** — entrega é irreversível e merece confirmação.

**O que muda:** enquanto o segundo passo não vier, a tela mostra
**"Ainda não entregue"** de forma persistente, e o botão volta ao estado inicial
**sem sugerir que a entrega ocorreu**. A pergunta da confirmação diz **o que
acontece**: *"A paciente passa a ver a Curadoria inteira. Isto não se desfaz."*

## 4. A entrega do lado da paciente

**Não pode depender do PDF.** O PDF é **cópia**; a experiência é a tela.

```
Sua Curadoria está pronta.
  quem preparou · quando
Contexto — o que foi considerado
Os três caminhos                    ← §04
O que vem agora — conversa com [Curador]
Documentos desta Curadoria          ← §07
Falar com a Aliviar                 ← §09
```

**P7 — dois caminhos para o mesmo documento:** *"Levar em PDF"* e
`/paciente/curadoria/imprimir` **consolidam em um**: *"Baixar minha Curadoria"*,
que também aparece em Documentos. **A rota de impressão permanece** como destino
técnico do download, **não como caminho paralelo na navegação**.

## 5. Classificação (§25)

| Item | Nível |
|---|---|
| nomear os três estados na interface | **A** — os dados existem (`emitted_at`, `delivered_at`) |
| Documentos ler o relatório entregue | **B** |
| aviso persistente de "ainda não entregue" | **A** |
| consolidar os dois caminhos do PDF | **A** |

**Nada aqui exige migration.** A informação já está no banco — falta **contá-la**.
