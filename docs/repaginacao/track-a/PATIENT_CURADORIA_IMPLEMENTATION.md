# B1 · Minha Curadoria — a tela preservada, o portão protegido

**Base:** `6d47c4d` → `76bb466` · **Migration: nenhuma.** **`src/`: intocado.**

---

## 1 · A auditoria disse para não redesenhar

A missão pedia repaginar a apresentação dos três caminhos. A auditoria
incremental mostrou que ela **já satisfazia o contrato**: `CaminhosPanel`,
`CartaCaminho`, `BarraCompatibilidade` e `ComparacaoCaminhos` já entregam zero
score, zero ranking, zero percentual, zero "melhor opção" e zero numeração de
posição; a copy vigente é *"os três são legítimos — a ordem é de apresentação,
não de preferência"*; explorar já é separado de comparar (uma carta por vez, e
a comparação nasce vazia); a ação é "Conhecer este caminho", não uma escolha.

E havia **22 guardas permanentes** em `paciente-caminhos.test.tsx` defendendo
exatamente isso.

**Decisão: não redesenhar.** Mexer ali seria desfazer trabalho considerado sem
defeito que justificasse, arriscando 22 garantias por estética.

## 2 · O que realmente faltava

`loadPatientCuradoria` carrega as guardas de entrega — e **nenhuma tinha teste
no repositório**. Trocar o portão por `EMITTED` não derrubava nada. Mesmo
padrão pelo qual a D-12.1 foi reprovada: a garantia existia e nada a defendia.

## 3 · A fixture saiu de dentro do spec

`seedDeliveredCase` era função local de `connection-choice.spec.ts`. Extraída
para `tests/apoio/apoio-curadoria-entregue.ts`, com a mesma cadeia canônica —
Acolhimento, contexto, critérios, Mapa, validação, seleção humana, Relatório,
aprovação, emissão, entrega. Atores, Case, Relatório, três caminhos, autoria e
carimbos: idênticos.

Duas mudanças, ambas para o helper servir aos dois runners: o `expect` do
Playwright virou `throw` com a mesma severidade, e nasceu `entregar: false` —
que **não fabrica estado**, apenas para a cadeia um passo antes da entrega, no
instante que existe de verdade no ciclo.

**Prova de que a extração foi conservadora:** `connection-choice.spec.ts`
executado de verdade, **8/8 verde**.

## 4 · O mapa das três guardas

| | guarda | onde | o que exige |
|---|---|---|---|
| **GATE-A** | `.eq("status", "DELIVERED")` | seleção | a seleção foi entregue |
| **GATE-B** | `if (!selection?.delivered_at) return null` | seleção | e tem o carimbo |
| **GATE-C** | `if (!report?.delivered_at) return null` | Relatório | e o Relatório também |

A precedência é a ordem da leitura: A filtra na consulta, B confere o carimbo
da seleção, C confere o do Relatório. **São independentes** — e a medição
abaixo prova que são três, não uma repetida.

## 5 · G1–G4

| | cenário | resultado |
|---|---|---|
| **G1** | emitida, não entregue | indisponível — e o Relatório **existe** emitido do lado de dentro |
| **G2** | apresentada, não entregue | o encontro não abre o digital |
| **G3** | entregue | abre, com os três caminhos |
| **G4** | carimbo sem conteúdo | **impossível por construção** — ver §6 |

G1 traz asserção de que o Relatório existe: sem ela, o teste passaria pelo
motivo errado (não haver Relatório nenhum) e o portão continuaria sem prova.

## 6 · G4 — dois invariantes, não um

O primeiro fechamento confundiu duas coisas. Separadas:

**INVARIANTE A — o carimbo não se reverte.**
Autoridade: `assert_delivered_selection_immutable_trigger`, `assert_report_lifecycle`.
Provado: o banco recusa `delivered_at = null` com
*"O carimbo de entrega do Relatorio e definitivo"* (23514).

**INVARIANTE B — entregue exige conteúdo legítimo.**
Autoridade: quatro triggers encadeados, todos verificados no catálogo:

```
enforce_selection_has_three_trigger                            seleção exige três
enforce_report_has_three_trigger                               Relatório exige três
enforce_delivery_requires_emitted_report_trigger               entregar exige emitido
enforce_report_delivery_requires_delivered_selection_trigger   Relatório entregue
                                                               exige seleção entregue
```

Encadeados: Relatório entregue ⇒ seleção entregue ⇒ Relatório emitido ⇒ três
opções. **Não existe entrega sem conteúdo.**

O teste **T-B1-4b** ataca o elo mais frágil dessa cadeia — o único pelo qual um
Relatório poderia ser carimbado sozinho — e prova que `markReportDelivered`
sobre seleção não entregue é **recusado**, sem deixar resíduo.

## 7 · Mutações — redundância medida, não perda ausente

| | mutação | testes que caem | classificação |
|---|---|---|---|
| **M1** | `EMITTED` passa a valer como `DELIVERED` | **0** | **probe de redundância defensiva** |
| **M3** | M1 + GATE-C enfraquecido | **0** | **probe de redundância defensiva** |
| **M2** | as três guardas removidas | **3** | **prova de perda material** |

M1 e M3 não derrubarem nada **não é teste fraco**: uma mutação só é perda
quando muda comportamento observável, e nesses dois casos o comportamento não
muda — outra guarda segura. É a redundância que o §3 mandou preservar,
agora medida em vez de suposta. Só com as três caídas uma Curadoria não
entregue atravessa, e aí a suíte acusa.

SHA do loader idêntico antes e depois de cada mutação; baseline verde nas duas
pontas.

## 8 · Responsabilidade

Entregue e **sem decisão**, o Curador continua responsável — mesmo com
Relatório emitido, apresentado e entregue. O teste passa um registro com o
Relatório emitido de propósito: é o cenário que levaria a fase para "escolha",
a do Concierge, se a guarda de decisão caísse.

Nenhum CTA de decisão, nenhum handoff, nenhum Concierge foi introduzido.

## 9 · Regressão

| verificação | resultado |
|---|---|
| `connection-choice.spec.ts` (o spec original) | **8/8** |
| B1 · portão de entrega | **9/9** |
| `paciente-caminhos.test.tsx` | **22/22** |
| componentes (suíte completa) | **686/686** |
| integração relevante (4 arquivos) | **27/27** |
| typecheck · lint | limpos (0 erros) |
| build local | exit 0 |
| ledger | **120/120** |

## 10 · Zero domínio

`src/` intocado. Zero migration, zero coluna, zero enum, zero estado novo. A
B1 alterou apenas `tests/` e `docs/`.

**Gaps preservados, não resolvidos:** B2 (comparador), B3 (decisão, Segundo
Encontro, handoff, Concierge), D-10 e GAP-A1.

---

# B2 · O comparador — auditado e preservado

**Base:** `abd0f27` · **Migration: nenhuma.** **`src/`: intocado.**

## 1 · As dez perguntas da auditoria

| | pergunta | resposta |
|---|---|---|
| A | já é por dimensões? | **sim** — `PATIENT_DIMENSIONS`, uma de cada vez |
| B | desktop tem leitura clara? | **sim** — os caminhos empilham dentro da dimensão |
| C | mobile evita tabela comprimida? | **sim** — não há tabela para comprimir |
| D | duplica as cartas? | não: recorte inverso (uma dimensão × N caminhos) |
| E | dimensões sem utilidade? | não — todas do domínio real |
| F | pista de ranking? | **nenhuma** |
| G | BarraCompatibilidade qualitativa? | **sim**, em modo `compact` |
| H | comparar exige escolha consciente? | **sim** — checkbox por carta |
| I | nasce vazia? | **sim** — `ComparacaoNaoIniciada` |
| J | ajuda a ver trade-off? | sim, por contraste de estado dentro da dimensão |

## 2 · Decisão: PRESERVAR

O contrato do §3 pede matriz editorial no desktop **ou** equivalência funcional
mais elegante. O comparador escolheu a segunda: **uma dimensão por vez**, com
os caminhos empilhados dentro dela. O comentário do arquivo explica por quê —
*"tabela com cinco linhas e três colunas convida a varrer o conjunto
procurando quem ganha"*.

Isso resolve desktop e mobile com **a mesma estrutura**: não existe layout de
390px "espremendo" o de 1440px, porque não existe layout horizontal nenhum.

## 3 · Explorar ≠ comparar — a diferença está no CONTROLE

**Conhecer este caminho** é `button`: um ato, abre a carta ali mesmo.
**Comparar** é `checkbox`: seleção reversível, não um ato.

Marcar não abre nada; abrir não marca nada. A separação das intenções não
depende de copy — depende do tipo de controle.

## 4 · O que as 22 guardas não alcançavam

Não duplicamos o que já estava protegido (uma dimensão por vez, troca de
dimensão, menos de dois não compara, nasce vazia, zero número/nota/ranking).
`b2-comparador-de-caminhos.test.tsx` fecha o resto:

- **T-B2-6** · comparar não decide — nenhum `button` ou `link` dentro do painel,
  e nenhuma copy de escolha no ambiente inteiro depois de conhecer os três;
- **T-B2-8** · a comparação **não é tabela**, provado pela ESTRUTURA: nenhum
  `<table>`/`<tr>`/`<td>`, nenhum `role="row"|"cell"`, e o painel empilha
  (`space-y-*`) sem `grid-cols`, `flex-row` ou `overflow-x`;
- **T-B2-3** · cada valor pertence a um caminho **nomeado**, com o estado
  chegando ao leitor de tela junto do rótulo da dimensão;
- **§8** · explorar e comparar têm controles distintos.

O T-B2-8 é estrutural de propósito: um screenshot mostra que hoje está bom, mas
não impede que amanhã alguém troque os blocos por tabela. A régua é o DOM.

## 5 · Provas de perda

| mutação | testes que caem |
|---|---|
| **M1** · comparação nasce pré-selecionada | **2** |
| **M2** · percentual entra na compatibilidade | **3** |
| **M3** · comparar passa a gravar decisão | **1** |
| **M4** · comparação vira grade horizontal | **1** |

Todas restauradas; baseline 30/30 (B2 8 + caminhos 22) nas duas pontas.

## 6 · Regressão

componentes **694/694** (64 arquivos) · B1 + curadoria **11/11** · typecheck
limpo · lint 0 erros · build exit 0 · ledger 120/120.

## 7 · Zero domínio

`src/` intocado, zero migration. B3 (decisão, Segundo Encontro, handoff,
Concierge) permanece fora.
