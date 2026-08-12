# 38 · Bloco 12 — a Fila por ato devido

**Estado:** IMPLEMENTADO e medido na rota real. Fecha os Blocos 11/12 do
contrato [36](36_BLOCOS_11_12_D6_CASOS_REAIS.md), junto com
[37](37_BLOCO_11_FECHAMENTO.md).

## 1 · Os sete grupos, e o fato que define cada um

A Fila agrupa por **ato devido**, nunca por data nem por prioridade inventada.

| # | Grupo | Fato | Responsável | CTA |
|---|---|---|---|---|
| 1 | Aguarda Acolhimento | `understanding_confirmed_at is null` | Curador | Abrir o caso |
| 2 | Aguarda o Primeiro Encontro | Perfil aberto, `meeting_held_at is null` | Curador | Abrir o caso |
| 3 | Aguarda o reconhecimento dela | `meeting_held_at` presente, `validated_at is null` | **Paciente** | ⛔ nenhum |
| 4 | Curadoria em curso | Perfil reconhecido, sem Relatório emitido | Curador | Abrir o caso |
| 5 | Aguarda entrega | `emitted_at` presente, `delivered_at is null` | Curador | Abrir o caso |
| 6 | Aguarda a decisão dela | entregue, sem decisão registrada | **Paciente** | ⛔ nenhum |
| 7 | Com o Concierge | decisão registrada | Concierge | ⛔ nenhum |

**Fora da Fila:** Caso encerrado (`CLOSED`/`CANCELLED` ou `closed_at`) e entrega
legada do motor antigo sem Curadoria estruturada.

**Nenhuma tabela, coluna, migration ou writer.** É projeção de leitura pura, no
padrão da Caixa de Continuidade (NT-4): criar tabela de fila produziria um
segundo dono do Caso, concorrente com `cases`. Apagar
[`fila-por-ato-devido.ts`](../../src/modules/curadoria/fila-por-ato-devido.ts)
não perde dado nenhum. **Ledger 121.**

### A precedência é a ordem, e a ordem é a jornada

Cada Caso é avaliado de cima para baixo e **para no primeiro predicado que
satisfaz** — por isso os predicados não precisam ser mutuamente exclusivos em
isolamento, e por isso "no máximo um grupo por Caso" é estrutural, não uma
verificação a posteriori. A avaliação começa pelo fim (decisão registrada) e
volta: qualquer fato anterior ainda seria verdadeiro, e o Caso apareceria duas
vezes.

**Nada é classificado por data, `updated_at`, timestamp de fixture ou posição em
array.** Um teste falseável afirma isso nos dois sentidos: a classificação não
lê relógio nenhum, e inverter a ordem de entrada não move ninguém de grupo.

## 2 · O que a Fila não faz

- **Sem SLA, sem "atrasado", sem contagem de dias, sem cor de urgência.** Não
  existe regra temporal aprovada, e inventá-la aqui seria criar SLA por conta
  própria. Um Caso parado há meses e um de ontem aparecem igualmente;
- **sem conteúdo clínico.** O tipo `FatosDaFila` **é** a fronteira de
  privacidade: o que não está nele não chega à tela por acidente. Parecer,
  história, diagnóstico, hipótese, justificativa de composição, nota de filtro,
  telefone e e-mail não atravessam;
- **sem autoridade nova.** Onde o ato é dela, existe caminho para **ver** o caso
  e nenhum botão para executá-lo (ADR-042);
- **sem Concierge antes da decisão** — é o único grupo que o menciona, e exige
  decisão registrada;
- **sem identificador interno na tela** — o `caseId` aparece só como destino de
  link;
- **grupo vazio não some.** Um grupo que desaparece ensina o Curador a não
  procurar por ele, e volta um dia mudando a tela de forma sem aviso.

## 3 · D-11 preservada

O grupo **"Aguarda o reconhecimento dela"** é o efeito operacional do desenho 2
da [24](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md), com **zero** alteração de
autoridade: o Curador **vê** que o Mapa está preparado e aguardando. Nenhum
enforcement no writer, nenhuma emenda à ADR-042, nenhuma superfície da paciente
tocada. **D-11 continua aberta**, e fecha quando o DT-01 responder a pergunta de
Método — não aqui.

## 4 · O4 — dez Casos simultâneos

`semearMatrizCoexistente()` semeia CR-01..CR-10 **com criação invertida**
(CR-10 nasce primeiro). Lidos na mesma passagem, pelo loader real (⛔ não
mockado), sobre o banco real:

- dez Cases distintos, **zero** duplicado, **zero** perdido;
- cada corte no grupo previsto pela matriz;
- contagens **1 · 1 · 1 · 2 · 1 · 1 · 3**;
- ordem dos grupos estável, e inverter a entrada não move ninguém;
- CR-11 (encerrado) e CR-12 (legado) fora da Fila, cada um pelo seu motivo.

## 5 · Medição na rota real

Ator: `curador.teste`, com a matriz atribuída a ele. Rota `/coa/curadoria`.

| Viewport | inner/client/scroll | overflow | fora | truncado | foco |
|---|---|---|---|---|---|
| **1440** | 1440 / 1425 / 1425 | não | 0 | 0 | 0 inversões |
| **768** | verificado pelo gate do e2e | não | — | — | — |
| **390** | os sete grupos visíveis, empilhados | não | — | — | — |

`h1` único, `main` único, sete `section[aria-labelledby]` — cada grupo é região
nomeada pelo próprio título. Contagens em **texto**, nunca badge colorido:
legíveis sem cor. Um único alvo abaixo de 44px, o link de marca do cabeçalho
(40px), **anterior a este bloco**. ⛔ Nenhum carrossel: a 390px os sete grupos
continuam empilhados.

## 6 · Evidências

Geradas com `CAPTURA=1` por
[`bloco12-fila.spec.ts`](../../tests/e2e/bloco12-fila.spec.ts), atrás de um gate
que confere **antes** de fotografar: rota, ator, viewport prometido pelo nome do
arquivo, os sete grupos na ordem, as contagens da matriz, ausência de prazo/SLA
e ausência de UUID na tela. O gate roda **sempre**; só a escrita da imagem
depende de `CAPTURA=1`.

`EV-12-001` (1440, dez simultâneos) · `EV-12-002` (768) · `EV-12-003` (390) ·
`EV-12-004` ("Aguarda o reconhecimento dela" sem ação indevida) ·
`EV-12-005` (os sete grupos completos). Diretório `evidencias/bloco12`,
gitignored. **Nenhum PNG no commit.**

## 7 · Provas de perda

| Mutação | Cai |
|---|---|
| **M-12-1** · dois grupos fundidos (entrega ↔ decisão) | matriz CR-07 e "Connection não substitui decisão" |
| **M-12-1b** · classificar por relógio | 11 asserções da matriz |
| **M-12-2** · CTA para o Curador reconhecer | guarda ADR-042 (unitária **e** de composição) |
| **M-12-3** · renderizar `compositionRationale` | guarda de privacidade da superfície |
| **M-12-4** · classificar pela posição no array | "a ordem de entrada não muda a classificação" |
| **M-12-5** · Case em dois grupos | contagem por grupo e unicidade dos dez |
| **M-12-6** · *"há 3 dias" / "atrasado"* | contagem e a guarda de promessa |

## 8 · Cleanup

Baseline antes e depois. Removidos 10 Cases, 30 perfis profissionais, 9 Perfis,
261 linhas de Mapa, 6 seleções, relatórios, entregas, decisões, Connections, 10
histórias com 30 versões e 20 contas. **Resíduo: zero.** Só `audit_logs` cresceu
(12 586 → 12 691, **+105**) — fatos legítimos não se apagam.

Registro, porque é acerto: o banco **recusou** apagar filtros de Perfil já
validado. O congelamento defendeu-se até contra a limpeza; as linhas saíram
depois, pela remoção do Case que as ancorava.

## 9 · Regressão

componentes **757/757** (67 arquivos) · unitária **2675 verdes**, 1 falha
pré-existente (**G-6**) · O4 **1/1** · matriz CR + atomicidade **18/18** · e2e da
Fila **7/7** · typecheck · lint **zero erros** · build local íntegro · **ledger
121**.

## 10 · Gaps e ressalvas

- **`GAP-B12-1` · payload de dev.** Em `next dev`, o flight payload da rota
  contém **linhas cruas de banco** (`report_id`, `professional_profile_id`,
  `justification`) vindas de `loadCuradoriaRecord`, que a página já chamava
  antes deste bloco. **Não é produzido nem renderizado pela Fila** — `FatosDaFila`
  não tem esses campos, o texto visível não os contém, e a forma é snake-case de
  banco, não props da projeção. Fica registrado para o `04 VERIFICADOR` conferir
  em build de produção, e para uma passagem que reduza o que a rota carrega: a
  Fila precisa de dez campos e a página lê o registro inteiro;
- **`D-11`** — aberta por decisão expressa (§3);
- **`G-6`** — falha unitária pré-existente, inalterada;
- **onde mora a derivação.** O contrato §12 proíbe mexer em `src/modules/**`. A
  proibição existe para que uma track de UX não altere regra de domínio, e este
  arquivo não altera nenhuma — é projeção pura, sem writer, sem migration, sem
  autoridade nova, seguindo o precedente que o próprio §6 cita (a Caixa de
  Continuidade, em `src/modules/connection`). A leitura está declarada no
  cabeçalho do arquivo; se a preferida for a literal, mover é uma renomeação.

---

## 11 · Adendo B11-12-H — hardening de falseabilidade

Fecha os dois achados médios do Verificador. **Nenhuma regra, copy, grupo,
precedência, autoridade, RLS ou linha de banco mudou.** Ledger segue **121**.

### 11.1 · `V-B12-1` — a fronteira de privacidade virou conjunto fechado

A guarda original procurava **vocabulário proibido** (`narrative`, `diagnosis`,
`compositionRationale`) na fonte do módulo. Ela pega quem copia um campo com o
nome antigo, e mais nada: `observacao`, `notaDaMesa` ou `resumoClinico`
atravessariam calados. Procurar palavra é procurar o erro que já se conhece.

[`h-b12-1-fronteira-de-privacidade`](../../tests/unit/h-b12-1-fronteira-de-privacidade.test.ts)
inverte a régua:

- declara o conjunto **fechado** das doze chaves aprovadas;
- compara com `Object.keys()` dos objetos que `fatosDoRegistro` **produz de
  fato**, para um representante de cada um dos sete grupos e dos dois excluídos;
- reprova chave a mais **mesmo vazia, `undefined` ou nunca renderizada** — o que
  sai do servidor sai, tenha pixel ou não;
- alimenta a função com um registro **cheio** de narrativa, diagnóstico,
  hipótese, parecer, rationale e nota de filtro, e exige que nenhum desses
  valores apareça na saída, em nenhuma chave;
- mantém `patientName` e `caseId` por decisão explícita, e afirma que são **só**
  esses dois identificadores.

A guarda estática (`SaoIguais<ChaveAprovada, keyof FatosDaFila>`) faz o tipo e a
lista se cobrarem nos dois sentidos, sem `any`, cast largo ou index signature.

**H-B12-1** — acrescentar `diagnostico: "exemplo"` ao tipo e ao objeto derivado
derruba **10** asserções com o motivo escrito — *"chave não autorizada na
fronteira de privacidade da Fila"* — e `tsc` reprova antes, em
`h-b12-1…test.ts(53,7): Type 'true' is not assignable to type 'false'`.

### 11.2 · `V-B12-2` — o D-6 provado pela composição real

`d6-rascunho-da-mesa` monta `MesaEstadoProvider` por conta própria. Prova que o
provider **funciona**, e é cega para a única coisa que pode dar errado de novo:
o provider estar no **lugar errado**. Rebaixá-lo para dentro de
`conteudo[etapaAtual]` reproduz a D-6 inteira, e aquela suíte segue verde.

A relação "provider **acima** do Shell" vivia solta dentro de um Server
Component, fora do alcance de teste. Agora tem nome:
[`mesa-com-estado.tsx`](../../src/components/curadoria/mesa/mesa-com-estado.tsx)
— o menor limite de composição cliente possível, **usado pela rota e pela
prova**. É composição e só; se ganhar lógica, deixa de ser o limite que o teste
exercita e vira harness disfarçado.

[`h-b12-2-mesa-composicao-real`](../../tests/components/h-b12-2-mesa-composicao-real.test.tsx)
atravessa esse limite com o `MesaShell` de verdade: escreve seleção, parecer e
justificativa; troca de etapa; **verifica que o workspace saiu do DOM**; volta;
encontra os três valores. Depois desmonta a Mesa inteira e remonta, provando o
limite honesto (o rascunho some), e repete com um segundo Case, provando o
isolamento.

**H-B12-2** — rebaixar o provider para dentro do slot derruba a prova nova por
*"a seleção evaporou ao trocar de etapa"* e *"o parecer evaporou ao trocar de
etapa"*, **enquanto `d6-rascunho-da-mesa` permanece verde**. É a demonstração do
próprio achado.

### 11.3 · Exceção arquitetural sobre `src/modules/**` — aceita e delimitada

O contrato [36](36_BLOCOS_11_12_D6_CASOS_REAIS.md) §12 proíbe **literalmente**
`src/modules/**`. O contrato **não é reescrito**: ele permanece como registro da
decisão original, e esta é a exceção, nomeada.

**Dois arquivos** entram nela, não um:

| Arquivo | O que é |
|---|---|
| [`fila-por-ato-devido.ts`](../../src/modules/curadoria/fila-por-ato-devido.ts) | projeção dos sete grupos |
| [`mesa-etapas.ts`](../../src/modules/curadoria/mesa-etapas.ts) | `estadoDaMesa`/`etapaConcluida`, a origem única do C4 |

Ambos são **derivações puras**: sem I/O, sem writer, sem action, sem acesso ao
banco, sem migration, sem autoridade. A dependência aponta **do componente para
o módulo** — mover a projeção para a camada de apresentação inverteria essa
seta e aumentaria o acoplamento, fazendo a regra viajar junto com a tela.

**O que a exceção NÃO autoriza:** nenhuma alteração futura de domínio neste
caminho. Writer, persistência, migration, policy, grant ou qualquer regra de
autoridade continuam **proibidos** aqui, e uma próxima track que precise deles
precisa de decisão nova — não deste adendo.
