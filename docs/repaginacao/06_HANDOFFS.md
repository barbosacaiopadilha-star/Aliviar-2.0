# 06 · Handoffs paciente ↔ Curador

A Rodada 2 executou as passagens e mediu o resultado. **Três das sete não chegam
do outro lado.**

---

## 1. Estado medido

| Passagem | Existe? | Chega? | Evidência |
|---|---|---|---|
| História enviada → fila | sim | **sim, imediata e nominal** | `01` |
| Documento enviado → Curador | não exercitável | — | B2-2 |
| Avanço do Curador → paciente | por desenho, não | **silêncio deliberado** | `40…42` |
| **Emissão → paciente** | **não** | **emitir não entrega** | `33` × `40…42` |
| Entrega → paciente | sim | **sim, muda tela e tom** | `05`, `06`, `50…57` |
| **Decisão → Curador** | clica | **não persiste** | `73…75` |
| **Pedido de complemento → paciente** | **não existe** | — | B2-3 |

## 2. A matriz alvo

Para cada evento: **paciente faz → sistema registra → Curador percebe → Curador
age → paciente percebe.**

| Evento | Sistema registra | Curador percebe | Curador age | Paciente percebe |
|---|---|---|---|---|
| **História enviada** | história + Caso | **fila, nominal** ✅ | assume | *"sua história chegou"* + nome do Curador |
| **Documento enviado** | documento | **marca no caso** ⚠️ *novo* | lê, referencia | *"recebemos"* + aparece em Documentos |
| **Avanço interno** | atos da Mesa | — | — | **nada** — ✅ silêncio deliberado, e assim fica |
| **Complemento pedido** ⚠️ | pendência **com destinatário** | acompanha | aguarda | **pendência no Início** + como responder |
| **Relatório emitido** | `emitted_at` | vê emitido | revisa | **nada** ✅ — emitir não é entregar |
| **Curadoria entregue** | `delivered_at` | vê entregue | conversa | **muda a tela inteira** ✅ |
| **Preferência / decisão** ⚠️ | *(depende de [D-2](21_DECISOES_NECESSARIAS.md))* | marca no caso | registra após conversa | confirmação do que foi registrado |

## 3. As três lacunas, classificadas

| # | Lacuna | Classificação | Nível (§25) |
|---|---|---|---|
| **H-1** | decisão da paciente não persiste | **decisão de produto** antes de tudo | A, C ou D — depende de [D-2] |
| **H-2** | pedido de complemento não tem superfície da paciente | **ausência no produto** — a pendência existe **só na tela do Curador** (B2-3) | **C/D** — exige destinatário e canal |
| **H-3** | documento enviado → Curador nunca foi observado | **cobertura**, não defeito | verificar antes de projetar |

> **H-2 é a mais grave das três em consequência humana.** O Curador registra que
> falta um exame; a paciente **não tem como saber disso**. Ela descobre — se
> descobrir — na conversa.

## 4. Regra permanente

> **Nenhum ato de um papel pode terminar em silêncio para o outro, exceto quando
> o silêncio for deliberado e declarado.**
>
> O único silêncio deliberado hoje é o **avanço interno do Curador** — e ele está
> **certo**: a paciente não precisa ver cada juízo. **Os outros três silêncios
> são acidentais.**
