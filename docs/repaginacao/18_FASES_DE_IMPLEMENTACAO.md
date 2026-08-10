# 18 · Fases de implementação

**Doze blocos.** A ordem difere da sugerida na missão em **três pontos**, e cada
divergência é justificada.

---

## A ordem final

| # | Bloco | Depende de | Decisão pendente? |
|---|---|---|---|
| **1** | **Concierge — Falar com a Aliviar** | nada | ⚠️ **[D-3]** (número/horário) |
| **2** | **Estados: fonte única** | nada | não |
| **3** | **Limpeza dos mortos** — 3 landings + 22 órfãos | nada | não |
| **4** | **Central de Documentos** | 2 | não |
| **5** | **Entrega — emitir ≠ entregar** | 2 | não |
| **6** | **Tokens e primitivos** | 3 | não |
| **7** | **Landing** | 6 | ⚠️ **[D-1]** (§B.1 do plano) |
| **8** | **PatientShell + Início + Jornada** | 2, 6 | não |
| **9** | **Minha Curadoria + comparador** | 5, 8 | não |
| **10** | **Sua História + questionário** | 4, 8 | ⚠️ **[D-4]** (valor do PDF) |
| **11** | **Mesa — ergonomia e redação** | 2, 6 | ⚠️ **[D-6]** (persistir seleção) |
| **12** | **Fila do Curador** | 2, 11 | não — mas **exige 5–10 casos** |
| **—** | **Decisão da paciente** | ⚠️ | ⚠️ **[D-2]** — **bloqueado** |
| **—** | **Pendência com destinatário** | ⚠️ | ⚠️ **[D-5]** — **bloqueado** |
| **13** | **Login / entrada** | 6, 7 | ⚠️ **[D-7]** (como entram) |
| **14** | **Backoffice** | 6 | não |
| **15** | **Passe final** — mobile, a11y, performance | tudo | não |

## As três divergências, e por quê

**① O Concierge vem primeiro, antes do design system.**
A missão sugeria Foundation no Bloco A. Mas o Concierge é **nível A** (um link
com mensagem constante), **não depende de nada**, e resolve o achado mais grave
das duas rodadas: a paciente decide sobre saúde **sem ter a quem perguntar**.
**Esperar o design system para entregar um link seria escolher a arquitetura
sobre a pessoa.**

**② Estados vêm antes de qualquer tela.**
Sete defeitos (C5, D2-1, D2-2, D2-8, P3, P6, Home) são o **mesmo** problema.
Repaginar uma tela que ainda mente sobre o estado é pintar em cima da rachadura.

**③ A limpeza dos mortos vem cedo, não no fim.**
São ~20 arquivos com **uso zero já provado**. Removê-los antes reduz o risco de o
Engenheiro editar a landing errada — risco **real**, porque `portal-experience` e
`v2/hero-experience` **parecem** ser a landing.

## Regra de tamanho

**Um bloco = um PR = uma capacidade verificável.** Nenhum bloco toca mais de um
papel, exceto o 2 (estados) e o 6 (tokens), que são **transversais por natureza**
— e por isso vêm cedo, quando há menos superfície construída sobre eles.

## O que pode começar hoje

**Blocos 2, 3, 4, 5** — nenhuma decisão pendente, nenhum backend, nenhum
migration. **O Bloco 1 começa junto se [D-3] for respondida.**

## O que está bloqueado

**Decisão da paciente** ([D-2]) e **pendência com destinatário** ([D-5]). Não têm
bloco numerado **de propósito** — não se agenda o que não foi decidido.
