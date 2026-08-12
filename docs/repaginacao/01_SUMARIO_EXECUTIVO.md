# 01 · Sumário executivo — Contrato Mestre de Repaginação

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-10 |
| **Branch** | `main` · **HEAD** `730294f` · **1 commit à frente** de `origin/main` (`dff4c86`) |
| **Árvore** | limpa, exceto `?? AGENTS.md` — **pré-existente, não tocado** |
| **Natureza** | arquitetura de produto/UX. **Zero código, zero migration, zero publicação** |

---

## O diagnóstico em uma frase

> **A Aliviar não tem um problema de aparência. Tem um problema de continuidade
> — entre telas, entre papéis e entre o que o sistema sabe e o que ele conta.**

As duas auditorias mostram um produto cujo **núcleo é sólido** e cujas **bordas
não se encontram**. A Rodada 2 registrou isso explicitamente no que **não**
atritou: *"o contexto nunca falta ao Curador"*, *"as mensagens de bloqueio dizem
o que falta, nominalmente"*, *"a paciente nunca vê número, nota, score ou
ranking"*. **O Método sobrevive à operação real.** O que não sobrevive é a
costura.

## Os cinco fatos que governam este contrato

**1 · A paciente não tem como pedir ajuda.** Nenhuma das oito telas dela tem
canal, botão ou formulário; o Curador é nomeado e não é clicável (P1). Ela chega
a receber **três caminhos médicos** e decidir **sozinha**.

**2 · Três atos importantes não chegam do outro lado.** A decisão da paciente
não persiste (P5/B2-1), o pedido de complemento **não existe como superfície**
(B2-3), e emitir o relatório **não** o entrega (`33` × `40…42`). A matriz de
passagens da Rodada 2 tem **três "não"** em sete linhas.

**3 · O mesmo estado é dito de formas diferentes em telas diferentes.** Case diz
*"Relatório — Concluída"* enquanto a Mesa diz *"Relatório, aguarda você"* (C5).
Documentos está vazio com relatório entregue (P3). A Home diz uma coisa e a
linha do tempo outra (D2-1, P6).

**4 · O Curador escreve dezenove textos livres para três profissionais.** Nove
juízos + nove pareceres + um do conjunto (C1) — e juízo e parecer *"pedem, com
outras palavras, a mesma leitura"*.

**5 · Existem quatro cascas de aplicação, duas bibliotecas de primitivos, quatro
cartões, três landings mortas e 22 componentes órfãos** (D-1, D-2, D-3, D-11,
D-12).

## O princípio

> **Complexidade para dentro. Clareza para fora.**

E um segundo, que a evidência impõe:

> **Toda ação visível precisa ter consequência visível — para quem agiu e para
> quem espera.**

## A forma da repaginação

| Camada | Direção |
|---|---|
| **Landing** | editorial e experiencial — **90–95% preservada** ([plano próprio](../PLANO_ATUALIZACAO_LANDING_2026_08.md)) |
| **Entrada** | transição, não corte |
| **Paciente** | íntimo, orientador, **mobile-first**, sempre com uma saída para gente |
| **Curador** | denso, analítico, **desktop-first** — a Mesa **não é redesenhada** |
| **Backoffice** | funcional, mas da mesma família |

## O que **não** muda

Método · autoria humana · ausência de ranking, score e percentual · rastreabilidade ·
independência · a arquitetura de quatro painéis da Mesa · os contratos e guardas
da Curadoria 2.0.

## Prioridade

| | |
|---|---|
| **P0** | Concierge presente · estados que divergem · decisão sem consequência · Documentos vazio · entrega × emissão |
| **P1** | Home e Jornada consolidadas · comparador dos caminhos · redação do Curador · fila |
| **P2** | design system unificado · shells · questionário para download |
| **P3** | backoffice · limpeza dos órfãos |

## Veredito

> ### CONTRATO MESTRE DE REPAGINAÇÃO APTO PARA REVISÃO E POSTERIOR HANDOFF AO 03 ENGENHEIRO
>
> **Com uma condição:** os **onze itens** de [21_DECISOES_NECESSARIAS](21_DECISOES_NECESSARIAS.md)
> precisam de resposta do DT-01 antes que os blocos correspondentes sejam
> abertos. Os blocos que **não** dependem deles podem começar imediatamente.

## Mapa dos documentos

| # | Documento | Conteúdo |
|---|---|---|
| 01 | este | sumário, diagnóstico, prioridade |
| 02 | [Princípios](02_PRINCIPIOS_DE_PRODUTO.md) | o que rege cada decisão |
| 03 | [Arquitetura da informação](03_ARQUITETURA_DA_INFORMACAO.md) | rotas, shells, nomenclatura |
| 04 | [Experiência do paciente](04_EXPERIENCIA_DO_PACIENTE.md) | Home, Jornada, História, Curadoria, decisão |
| 05 | [Experiência do Curador](05_EXPERIENCIA_DO_CURADOR.md) | fila, Mesa, redação, relatório |
| 06 | [Handoffs](06_HANDOFFS.md) | matriz paciente ↔ Curador |
| 07 | [Central de Documentos](07_CENTRAL_DE_DOCUMENTOS.md) | três origens, estados, ações |
| 08 | [Questionário](08_QUESTIONARIO_DOWNLOAD.md) | antes e depois do envio |
| 09 | [Concierge e WhatsApp](09_CONCIERGE_WHATSAPP.md) | pontos de entrada e contexto permitido |
| 10 | [Entrega da Curadoria](10_ENTREGA_DA_CURADORIA.md) | emitir ≠ entregar |
| 11 | [Visualizações](11_VISUALIZACOES.md) | as nove da Rodada 2, filtradas |
| 12 | [Design system alvo](12_DESIGN_SYSTEM_ALVO.md) | gramática única |
| 13 | [Modelo de estados](13_MODELO_DE_ESTADOS.md) | fonte de verdade por estado |
| 14 | [Consolidação](14_CONSOLIDACAO_DUPLICACOES.md) | D-1..D-15 e D2-1..D2-9 |
| 15 | [Mobile](15_MOBILE.md) | estratégia por papel |
| 16 | [Acessibilidade](16_ACESSIBILIDADE.md) | critérios |
| 17 | [Performance](17_PERFORMANCE.md) | medições e limites |
| 18 | [Fases](18_FASES_DE_IMPLEMENTACAO.md) | ordem segura |
| 19 | [Critérios de aceite](19_CRITERIOS_DE_ACEITE.md) | para o 04 VERIFICADOR |
| 20 | [Não-regressão](20_NAO_REGRESSAO.md) | o que não pode quebrar |
| 21 | [Decisões necessárias](21_DECISOES_NECESSARIAS.md) | **onze**, do DT-01 |
| 22 | [Handoff](22_HANDOFF_ENGENHEIRO.md) | por bloco |
| 23 | [Adendo — dois encontros](23_ADENDO_DOIS_ENCONTROS.md) | Encontro 1 e 2 como fatos; **uma coluna** |
| 24 | [D-11 — ordem do Primeiro Encontro](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md) | preparado × validado; **colisão com a ADR-042** |
| 25 | [D-12 — Central de Documentos](25_D12_CENTRAL_DE_DOCUMENTOS.md) | **duas policies**, sem tabela, sem coluna, sem bucket |
| 26 | [B3-A — decisão, 2º encontro, handoff](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md) | contrato **suficiente**; a decisão persiste — o defeito é **silêncio** |
| 27 | [B3-R — superfície alcançável](27_B3R_SUPERFICIE_ALCANCAVEL.md) | o painel canônico é **órfão**; arquitetura **E**, um só arquivo de produção |
| 28 | [B3-COPY — microcontrato da conexão](28_B3COPY_MICROCONTRATO_DA_CONEXAO.md) | o canônico trata de continuidade; o legado preserva a escolha |
| 29 | [B3 — fechamento da Track B](29_B3_FECHAMENTO_TRACK_B.md) | **Track B encerrada** — fato, feedback, handoff, auditoria e as duas correções de cleanup |
| 30 | [Track C — Falar com a Aliviar](30_TRACK_C_FALAR_COM_A_ALIVIAR.md) | contrato da Track; D-3 já respondida pelo código, e a paciente só pede ajuda **depois** de decidir |
| 31 | [**Track C — fechamento**](31_TRACK_C_FECHAMENTO.md) | **Track C FORMALMENTE ENCERRADA** (2026-08-11, HEAD `38cdaf3`) — contato oficial certificado nas **sete superfícies**, fonte única, tópicos fechados, zero migration; gaps `GAP-C-1/2/3` preservados |
