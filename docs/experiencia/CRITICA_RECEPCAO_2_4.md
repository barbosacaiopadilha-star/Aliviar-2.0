# Crítica de Direção de Arte + Nota de Execução — Recepção 2.4

> **Status:** VALIDADA e IMPLEMENTADA (2026-08-01). O usuário aprovou A–H integralmente e a correção transversal dos 110 casos `token/NN` como correção de defeito. Validação medida: caminho percorrido visível (dourado a 40% no DOM), foco no índigo da casa (`#123B67` a 20% — zero azul de fábrica), rodapé ausente na Recepção e presente na Landing, upload em pt-BR. Guardas novas: `tests/unit/recepcao-sem-campanha.test.ts` e o teste do padrão `token/NN` em `paleta-unica.test.ts`.
> **Método:** percurso real logado como paciente de teste, pelas sete telas da Recepção, em viewport 1280×800 e 390×844 — mais medição de DOM computado onde a captura levantou suspeita. Nenhuma conclusão vem só de código.
> **Data:** 2026-08-01

---

# PARTE 1 — CRÍTICA

## 1 · Como a Landing termina, como a Recepção começa

**A Landing termina bem:** no convite calmo ("Quando você quiser começar…"), a porta única, a soleira. O clique atravessa para `/sua-historia`.

**A Recepção começa bem:** a capa fala a mesma língua — serifa grande, papel quente, *"Sua história merece ser contada com calma"*, *"uma pessoa, com nome, lê tudo com atenção"*. Mesma moldura, mesma voz. **Em material e em tom, é a mesma casa.**

A continuidade quebra em cinco pontos — quatro deles invisíveis numa leitura de código, todos sentidos no percurso.

## 2 · As rupturas, por gravidade

### R1 — O caminho percorrido é invisível (defeito de renderização, medido)

O componente de progresso foi **desenhado certo**: traço largo dourado para o passo atual, traços curtos dourados a 40% para o caminho já percorrido. Mas `bg-brand-gold/40` não compila — modificador de opacidade sobre token `var()` não gera utilidade no Tailwind v3 — e o DOM confirma: os traços do passado computam `rgba(0,0,0,0)`.

**Consequência emocional:** em toda tela, o passo ativo parece ser o primeiro. A pessoa avança e a tela insiste que ela está no começo. O caminho **apaga atrás dela** — o oposto exato da regra que a própria casa usa na área do paciente ("o caminho já percorrido permanece iluminado"). É a razão material pela qual a Recepção transmite "faltam muitas telas" em vez de "estamos avançando".

### R2 — O anel de foco é o azul de fábrica do Tailwind (medido)

`ring-focus/20` também não compila. Ao focar qualquer campo, o navegador aplica o fallback do Tailwind: **`rgba(59,130,246,0.5)` — azul saturado de startup**, a cor mais proibida da marca, exatamente no momento em que a pessoa começa a digitar a própria história.

**Escala:** o padrão quebrado (`token/NN`) tem **110 ocorrências em toda a plataforma** — cada uma é uma utilidade que silenciosamente não existe (bordas de alertas, anéis, véus). A guarda de paleta não pega porque são classes configuradas, não `var()` cru.

### R3 — A Landing inteira mora embaixo de cada pergunta

O rodapé institucional — "Você não precisa decidir sozinho", logotipo, navegação, copyright — continua presente **dentro da conversa**. Quem rola além do "Continuar" na pergunta sobre o próprio medo encontra a voz da campanha. Já registrado como a ruptura nº 1 pelo Experience Book (§13.5); confirmado de novo no percurso. É o momento mais nítido em que a pessoa percebe que está "num site".

### R4 — "Choose File" / "No file chosen"

Na etapa de informações, o anexo é o controle **nativo do navegador, em inglês**. Sistema operacional cru, no idioma errado, na etapa mais sensível. Nenhum outro elemento da casa quebra tanto a voz.

### R5 — Os rótulos de formulário

*"Sua resposta"* acima de cada campo — a única palavra de formulário numa tela que já fez a pergunta. E a pergunta, o subtítulo, o rótulo e o campo estão a intervalos quase iguais: agrupados, leem como bloco de formulário, não como fala + resposta.

### Menores, registrados

- **"nossa equipe"** ×2 (informações: "ajude nossa equipe"; revisão: "Nossa equipe de curadoria analisa") — responsabilidade sem rosto, resíduo D-C1 já condenado pelas auditorias.
- **"Continuar" desabilitado** em azul-acinzentado (para-quem, história) — porta trancada antes de responder. Padrão do DS; fica como está nesta rodada, registrado.
- **A capa fala com quem não entrou** ("você precisa já ter uma conta… entra com seu login") **mesmo para quem já está logado** — ruído condicional; distinguir o estado é comportamento, não composição. Pendência de produto.
- **O gesto ausente:** nenhuma soleira nos dois momentos-porta da Recepção ("Começar", "Enviar minha história").

## 3 · Onde ela sente que é acompanhada (preservar intacto)

*"Você pode deixar em branco se preferir"* · *"Não existem respostas certas"* · *"uma pessoa, com nome, lê tudo com atenção"* · *"Fique à vontade para escrever quanto quiser"* · o autosave discreto · uma pergunta por tela · o progresso sem número (quando visível). A espinha da conversa **está certa** — as rupturas são a moldura e os detalhes de sistema, não a estrutura.

## 4 · Arquitetura da atenção (etapa típica)

| | Hoje | Depois |
|---|---|---|
| **Primeiro olhar** | a pergunta em serifa ✓ | igual |
| **Primeiro clique** | o campo | igual |
| **Primeiro campo** | precedido do rótulo "Sua resposta" | precedido de ar |
| **Primeira dúvida** | "quanto falta?" (o progresso não mostra o percorrido) | respondida pelo próprio traço |
| **Primeiro alívio** | "pode deixar em branco" ✓ | igual, intacto |

## 5 · Ritmo

As etapas 2–5 têm a mesma forma (pergunta + campo) — e numa **conversa** isso é virtude, não monotonia: perguntas encadeadas com a mesma calma. O problema de ritmo está nas **duas últimas** (informações e revisão), que trocam o registro de conversa pelo de cadastro — a reordenação já está registrada como decisão de produto (Experience Book §13.3) e **não** entra nesta rodada. O que entra: fazer as duas falarem com a voz do Curador em vez de "equipe".

---

# PARTE 2 — NOTA DE EXECUÇÃO (aguarda validação)

## Mudanças propostas

| # | Mudança | Natureza | Arquivos |
|---|---|---|---|
| A | **Rodapé institucional sai da Recepção.** `<PublicFooter/>` deixa o layout `(public)` e passa a ser renderizado só pela página da Landing. A Recepção termina no botão — sob a decisão, silêncio | **estrutural mínima** (nenhuma rota muda; nenhum componente novo) | `(public)/layout.tsx`, `(public)/page.tsx` |
| B | **O caminho percorrido volta a existir:** `bg-brand-gold/40` → `color-mix` válido | correção de defeito | `story-step-layout.tsx` |
| C | **O anel de foco volta a ser da casa:** `ring-focus/20` → `color-mix` válido nas 4 primitivas de campo | correção de defeito (efeito em toda a plataforma — são as primitivas) | `ui/input.tsx`, `ui/select.tsx`, `ui/textarea.tsx`, `ui/search-field.tsx` |
| D | **Os outros ~100 modificadores `token/NN`** — correção mecânica transversal (mesma intenção visual, agora renderizando) + guarda nova no teste de paleta proibindo o padrão | correção de defeito, **fora do escopo estrito da Recepção** — decisão sua abaixo | vários |
| E | **Anexo com a voz da casa:** input file estilizado, "Escolher arquivo" em pt-BR (input nativo escondido, label-botão acessível) | visual | `story-attachments.tsx` |
| F | **"Sua resposta" vira sr-only** (acessibilidade preservada) + mais ar entre pergunta e campo | visual | telas do wizard |
| G | **Copy registrada:** "nossa equipe" → "seu Curador" (informações); "Nossa equipe de curadoria analisa cada história" → "Seu Curador lê cada história com atenção antes de qualquer indicação — nunca um algoritmo decide" (revisão) | copy mínima, motivo D-C1 | 2 arquivos |
| H | **A soleira nos dois momentos-porta:** "Começar" (capa) e "Enviar minha história" (revisão) recebem `landing-porta` — o mesmo gesto, nenhum novo | visual | capa, revisão |

## Preservado integralmente

Fluxo e ordem das etapas · uma pergunta por tela · progresso sem número · todas as frases de alívio · autosave · guardas de acesso (ADR-018) · comportamento do "Continuar" desabilitado · Design System e tokens.

## Removido

Rodapé institucional da Recepção (movido, não deletado) · rótulo visível "Sua resposta" · aparência nativa do input de arquivo.

## Justificativa artística, em uma linha cada

**A.** Sob uma decisão, o espaço fica vazio — a campanha não entra no quarto onde alguém se abre. **B.** Quem avança precisa ver o próprio caminho aceso. **C.** O primeiro toque no teclado não pode vestir a cor de outra marca. **E.** Nenhuma voz de sistema no momento mais sensível. **F.** A pergunta é fala; o campo é resposta; entre os dois, ar. **G.** Responsabilidade tem nome de papel humano. **H.** A mesma soleira diz: mesma casa.

## Pendências que esta rodada NÃO resolve

Reordenação informações→início (produto) · capa condicional ao estado logado (produto) · estilo do botão desabilitado (DS, rodada própria) · rosto real do Curador (conteúdo).
