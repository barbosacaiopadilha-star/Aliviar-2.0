# 28 · B3-COPY — microcontrato da conexão pós-decisão

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-11 |
| **Base** | `7d4fe7f` · worktree do Engenheiro **preservado**, nada resetado |
| **Natureza** | microcontrato de copy. **Zero edição, zero commit** |

---

## 0 · O achado, confirmado em EV-B3-004

Empilhados, um debaixo do outro, no mesmo scroll de 390px:

> **"Sua decisão está registrada."** · *"Você escolheu Ana…"* · *"a próxima etapa passa a ser acompanhada pela Equipe Aliviar."*
>
> **"Com quem você gostaria de seguir?"** · *"Os profissionais foram apresentados sem ordem de preferência…"* · ○ Ana… · **[Quero seguir com um dos três]**

**Um rádio não marcado, com uma opção, e um botão que fala em três.** A Arquitetura E foi aplicada nos dados (`opcoesDaConexao` filtrado) e **não** na linguagem.

**`ConnectionChoicePanel` não foi tocado entre `7df89b7` e `7d4fe7f`** — o filtro é correto e a copy ficou para trás.

## 1 · Modo explícito — nunca inferido

```ts
type Modo = "canonico" | "legado";
```

**Prop nova e obrigatória.** A rota já sabe a resposta ([page.tsx:96](../../src/app/paciente/curadoria/page.tsx:96)):

```ts
modo={legado ? "legado" : "canonico"}
```

> **Proibido inferir por `providerPresentations.length === 1`.** Uma entrega legada
> pode legitimamente ter um profissional, e o estado **R3** (Curadoria canônica,
> conexão existente, decisão ausente) também chega com um — e é **canônico**.

**Guarda de segurança:** modo canônico com `providerPresentations` vazio →
**não renderizar nada**. Nunca um card com nome indefinido.

## 2 · O que a action realmente faz — a âncora de toda a copy

| Action | Efeito real | O que a copy **não** pode dizer |
|---|---|---|
| `createConnectionAction` | cria `connection_records` em `DECISAO_REGISTRADA`; o caso passa a aparecer para quem cuida dele; destrava os registros seguintes | ❌ "iniciar contato" · ❌ "a Aliviar vai procurar" · ❌ prazo |
| `registerContactIntentAction` | → `CONTATO_INICIADO` — **declaração dela** | ❌ que a Aliviar iniciou |
| `confirmFirstAppointmentAction` | → terminal + nascimento do Relationship | — |
| `closeWithoutRelationshipAction` | → terminal | — |
| `correctChoiceAction` | troca o profissional em `DECISAO_REGISTRADA` | **inexistente no canônico** (§10) |

> **Trava herdada de `ContactModePanel`, que é explícita:** *"A aproximação
> intermediada **ainda não existe operacionalmente**"* e *"**nada** sobre o
> Concierge estar acompanhando, porque isso ainda não é verificável"*.
>
> **Nenhuma frase deste contrato promete que a Aliviar procura o profissional.**

## 3 · Copy final — modo **CANÔNICO**

### 3.1 · Abertura · `connection === null`, `step === "choosing"`

| Elemento | Texto exato |
|---|---|
| **h2** | `Começar seu acompanhamento` |
| **informação fixa** | `Caminho escolhido: {nome}` |
| **p** | `Sua decisão já está registrada. Abrir o acompanhamento é o passo seguinte — e não há pressa.` |
| **erro** | `FormMessage variant="error"`, quando houver |
| **CTA** | `Abrir meu acompanhamento` |

**Presentes:** h2 · linha fixa · parágrafo · erro · **um** botão.
**Ausentes:** ❌ `fieldset`/`legend` · ❌ `Radio` · ❌ "Cancelar" · ❌ qualquer menção a *três*, a *ordem de preferência* ou a *escolher*.

> **§5 — a pessoa decidida é informação fixa.** `Caminho escolhido: {nome}` é
> texto rotulado, **não** controle: nada para marcar, nada para desmarcar, e a
> identidade **nunca** some.

### 3.2 · Revisão · `step === "reviewing"`

| Elemento | Texto exato |
|---|---|
| **h2** | `O que acontece ao abrir seu acompanhamento` |
| **p1** | `Seu acompanhamento com {nome} passa a ser visível para quem cuida do seu caso na Aliviar.` |
| **p2** | `Não há consulta marcada, não há horário, e {nome} ainda não foi procurado.` |
| **p3** | `Seu caso continua sob responsabilidade da Aliviar — ele nunca fica sem alguém respondendo por ele.` |
| **p4** | `Sua decisão continua registrada do jeito que está: abrir o acompanhamento não altera o que você já decidiu.` |
| **p5** | `Os outros dois caminhos continuam na Mesa, do jeito que você os deixou.` |
| **CTA** | `Abrir meu acompanhamento` |
| **secundário** | `Voltar` |

> **A etapa de revisão permanece** — é o único lugar onde as quatro verdades são
> ditas, e elas valem mais do que o clique que economizariam.
>
> **p4 substitui a linha legada** *"Enquanto você não tiver falado com {nome},
> pode trocar aqui mesmo…"*, que no canônico seria **falsa**: o fato é
> append-only. E `Voltar aos caminhos` vira `Voltar`, porque não há caminhos
> para onde voltar.

### 3.3 · Acompanhamento aberto · `DECISAO_REGISTRADA` — `ConnectionProgressPanel`

| Elemento | Texto exato |
|---|---|
| **h2** | `Seu acompanhamento` |
| **p1** | `Acompanhamento aberto com {nome}.` |
| **p2** | `Quando você decidir dar o próximo passo, pode registrar por aqui.` |
| **botões** | `Já iniciei o contato` · `O primeiro atendimento já aconteceu` · `O contato não avançou` |

**Ausentes:** ❌ `Sua escolha` (duplica o card decidido acima) · ❌ `Você escolheu seguir com {nome}.` · ❌ **`Alterar minha escolha`** · ❌ a linha *"pode trocar aqui mesmo"*.

### 3.4 · Estados terminais — **inalterados**

`CONTATO_INICIADO`, `PRIMEIRO_ATENDIMENTO_REALIZADO` e
`ENCERRADO_SEM_RELACIONAMENTO` já são neutros de modo e já dizem só o que
aconteceu. **Nenhuma mudança**, nos dois modos.

## 4 · Controles por estado canônico

| Estado | Rádio | CTA principal | Alterar escolha | Cancelar |
|---|---|---|---|---|
| abertura | ❌ | `Abrir meu acompanhamento` | ❌ | ❌ |
| revisão | ❌ | `Abrir meu acompanhamento` | ❌ | `Voltar` |
| `DECISAO_REGISTRADA` | ❌ | os três registros dela | ❌ | ❌ |
| `CONTATO_INICIADO` | ❌ | inalterado | ❌ | ❌ |
| terminais | ❌ | **nenhum** | ❌ | ❌ |
| `NONE_OF_THEM` | — | **o painel não existe** (H3) | — | — |

## 5 · Alteração e correção no canônico — **proibidas**

> **`onRequestEdit` nunca é passado no modo canônico.**

Com isso `isEditing` jamais vira `true`, o passo de escolha nunca reaparece, e
**`correctChoiceAction` fica inalcançável pelo canônico** — sem remover a action,
que o legado usa.

**Consequência já declarada na B3-R:** trocar de profissional deixa de ser
oferecido a quem tem decisão canônica, porque contradiria um fato append-only.
**Continuam disponíveis:** mudar o modo de contato, declarar contato iniciado,
declarar o atendimento, e encerrar. **A via legítima de mudar de rumo é uma nova
seleção curada.**

## 6 · Modo **LEGADO** (H4) — congelado, palavra por palavra

**Nada muda.** `Com quem você gostaria de seguir?` · `Os profissionais foram
apresentados sem ordem de preferência. A escolha é sua, e você pode revisar antes
de iniciar o contato.` · três `Radio` · `Quero seguir com um dos três` ·
`Quero seguir com {nome}` · `O que acontece ao seguir com {nome}` · as quatro
verdades **incluindo** *"pode trocar aqui mesmo, sem precisar explicar nada"* ·
`Seguir com {nome}` · `Voltar aos caminhos` · `Cancelar` ·
**`Alterar minha escolha` preservado integralmente**.

## 7 · Props mínimas

| Prop | Origem | Nova? |
|---|---|---|
| `caseId` | rota | ❌ |
| `providerPresentations` | `opcoesDaConexao` — já filtrado | ❌ |
| `connection` | rota | ❌ |
| **`modo`** | **`legado ? "legado" : "canonico"`** | ✅ **única** |

`ConnectionProgressPanel` recebe o mesmo `modo`, repassado por
`ConnectionChoicePanel`. **Nenhuma consulta nova, nenhum loader novo.**

## 8 · Arquivos de produção

| Arquivo | O quê |
|---|---|
| [`connection-choice-panel.tsx`](../../src/components/patient/connection-choice-panel.tsx) | prop `modo`; §3.1 e §3.2; nunca passar `onRequestEdit` no canônico |
| [`connection-progress-panel.tsx`](../../src/components/patient/connection-progress-panel.tsx) | prop `modo`; §3.3 em `DECISAO_REGISTRADA`; terminais intactos |
| [`page.tsx`](../../src/app/paciente/curadoria/page.tsx) | passar `modo` |

> **Observação sobre `page.tsx:104`:** o filtro canônico casa por **nome**
> (`opcao.displayName === decisao.chosenName`). Funciona porque as duas pontas
> vêm de `professional_profiles.display_name`, mas é frágil. **Casar por
> identificador** enquanto o arquivo já está aberto — não é copy, e é barato.

## 9 · Testes que mudam

| Arquivo | O quê |
|---|---|
| [`connection-choice.spec.ts`](../../tests/e2e/connection-choice.spec.ts) | **Caminhos 1–3, Segurança e "paciente diferente"** são canônicos: `Quero seguir com {nome}` → `Abrir meu acompanhamento`; `Seguir com {nome}` → `Abrir meu acompanhamento`; **linha 292** `Com quem você gostaria de seguir?` → `Começar seu acompanhamento`. **A guarda de estado terminal ganha `Abrir meu acompanhamento` na lista de botões proibidos** |
| linha 341 — **H4 legado** | ⛔ **não tocar** — é a prova de que o legado sobreviveu |
| [`connection-choice-panel.test.tsx`](../../tests/components/connection-choice-panel.test.tsx) | passa a exigir `modo`; os casos atuais viram **legado**; nascem os canônicos de §3.1–3.2 |
| [`sala-da-decisao.test.tsx`](../../tests/components/sala-da-decisao.test.tsx) | **legado** — a Sala da Decisão é o ato legado |
| [`b3r-composicao-da-rota.test.tsx`](../../tests/components/b3r-composicao-da-rota.test.tsx) | as ausências das linhas 159/170 seguem válidas; **acrescentar**: em R4 aparece `Começar seu acompanhamento` e **não** aparece rádio nem `Alterar minha escolha` |
| `b3-captura-decisao.spec.ts` *(untracked)* | atualizar a captura |

**Guarda permanente sugerida:** nenhuma string do conjunto
{`Com quem você gostaria de seguir`, `um dos três`, `Os profissionais foram
apresentados`} pode ser renderizada com `modo="canonico"`.

## 10 · Evidências

| | Situação |
|---|---|
| **EV-B3-001** — antes da decisão | ✅ **válida** — `mostrarConexao` é falso ali |
| **EV-B3-002** — feedback imediato | ✅ **válida** — transitório, sem painel de conexão |
| **EV-B3-003** — durável desktop | 🔄 **recapturar** — mostra a contradição |
| **EV-B3-004** — durável 390px | 🔄 **recapturar** — **é a prova do achado** |
| **EV-B3-005** *(nova)* — canônico com acompanhamento aberto, 390px | ➕ prova §3.3 sem `Alterar minha escolha` |
| **EV-B3-006** *(nova)* — legado H4, desktop | ➕ prova que os três e a correção sobreviveram |

---

## 11 · Gaps registrados

### GAP-B3-COPY-ID — o filtro canônico depende do nome, não do identificador

**Estado:** aberto · **não bloqueante** · registrado na B3-COPY-B2.

A rota escolhe quem vai para a conexão comparando **texto**:

```ts
if (decisao?.outcome === "CHOSEN") return opcao.displayName === decisao.chosenName;
```

Comparar identidade por nome é frágil por natureza — dois profissionais
homônimos na mesma entrega, ou qualquer normalização futura do nome exibido,
quebram o filtro em silêncio (a conexão simplesmente some, porque o painel
canônico devolve `null` sem pessoa).

**Por que continua assim, deliberadamente:**

- a projeção da decisão expõe apenas `outcome`, `chosenName` e `decidedAt`;
- **não há identificador na projeção** — nem da opção, nem do profissional;
- expor um id significa ampliar o loader `loadPatientCuradoria`, e ampliar
  loader está **fora** deste microcontrato (§7: uma prop nova, nenhum loader
  novo);
- enquanto isso, o filtro por `displayName` fica **preservado como está**.

**Quando fechar:** na primeira passagem que já precise tocar o loader por outro
motivo. O conserto é mecânico — projetar o `professionalProfileId` da decisão e
trocar a comparação por id, mantendo o `displayName` só para exibição.

**Por que não bloqueia:** a entrega tem três opções nomeadas por pessoas
distintas, e o pareamento é verificado de ponta a ponta pelos cenários
canônicos do `connection-choice.spec.ts`, que afirmam a pessoa decidida pelo
nome real vindo da fixture.

---

# B3-COPY APROVADA — O CANÔNICO TRATA DE CONTINUIDADE; O LEGADO PRESERVA A ESCOLHA

**Uma prop nova, três arquivos de produção, nenhuma migration, nenhum motor.**

A Arquitetura E não é reaberta: ela é **dita**. O filtro já entregava uma pessoa
só; agora a linguagem para de perguntar o que já foi respondido — e para de
prometer o que a Aliviar ainda não faz.
