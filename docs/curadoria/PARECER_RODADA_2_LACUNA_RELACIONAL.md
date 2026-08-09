# Parecer — S-1 / S-2 / S-3 / S-4 e a próxima rodada

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `a28abb1` — Rodada 1 (R-1 + R-2) certificada |
| **Natureza** | **decisão arquitetural e semântica**. Zero código, zero CSS, zero teste, zero domínio |

---

## Parte I — S-1 · a ausência relacional exige ato humano?

### As sete provas do §6

| # | Pergunta | Resposta, na fonte |
|---|---|---|
| 1 | **Quem produz a evidência relacional?** | O **profissional**, no próprio Protocolo — `RelationalEvidence` vem de `practice_evidence`. **Nunca o Curador.** |
| 2 | **Em que etapa?** | **Fora da Mesa**, na coleta do Protocolo, que antecede a Curadoria |
| 3 | **Existe ação humana esperada quando falta?** | **SIM — e ela já existe na Mesa.** `requestPracticeUpdateAction` (`mesa-evidencias-panel.tsx:618`) é o ato do Curador de **solicitar atualização da prática**; `listOpenUpdateRequests` já é carregado pela própria tela da Curadoria Técnica |
| 4 | **A ausência bloqueia progressão?** | **Não.** Nenhuma etapa fica `BLOQUEADA` — o regime não tem esse estado |
| 5 | **Há `pending`/`waitingOn` relacionado?** | **Sim, e distinto:** `criteriosPendentes` (declarações aguardando) e `criteriosInsuficientes` (lacunas) são campos separados |
| 6 | **A Mesa conduz o Curador a resolver?** | **Sim.** `criteriosInsuficientes > 0` classifica o profissional como `INSUFICIENTE` na linha de investigação |
| 7 | **Pode permanecer legitimamente até o encerramento?** | **Sim.** P-04, e o próprio painel diz: *"julgar com a incompletude visível é legítimo"* |

### A colisão de nomes que escondia a resposta

O motor relacional produz `LACUNA_DE_INFORMACAO` por um caminho único:

```
if (!evidence) → state "NAO_INFORMADO" → MATRIZ_RELACIONAL → "LACUNA_DE_INFORMACAO"
```

> **O token `NAO_INFORMADO` significa coisas diferentes nos dois motores** — e é
> por isso que a inconsistência sobreviveu à Rodada 1.

| Motor | Token | Significado real | Equivale, na regra da Rodada 1, a |
|---|---|---|---|
| **assistencial** | `NAO_INFORMADO` | *"analisado, mas sem informação suficiente"* — **alguém olhou** | ⇒ `neutro` |
| **assistencial** | `status = null` | *"ainda não investigado"* — **ninguém olhou** | ⇒ `atencao` |
| **relacional** | `NAO_INFORMADO` | **"sem evidência vigente"** — **ninguém declarou** | ⇒ **`atencao`** |

**A lacuna relacional é o caso *"ninguém olhou ainda"*, não o caso *"olharam e
não havia"*.** Ela foi classificada como `neutro` porque carrega o nome do outro.

### O domínio já concordava, e em dois lugares

1. **O código diz**, citando **ADR-065 §10.3**: *"as lacunas relacionais entram
   **na mesma contagem de atenção** que as assistenciais — a linha de
   investigação não distingue a leitura de origem, só a pendência."*
2. **A linha de investigação já as trata como atenção** (`INSUFICIENTE`).

> Ou seja: **a linha de investigação diz atenção enquanto o painel relacional
> pinta neutro.** É exatamente a mesma classe de divergência que a Rodada 1
> corrigiu — sobrevivente porque estava numa terceira superfície.

### S-1 não é decisão nova

> **DECISÃO S-1 = `atencao` (S-1A).**
>
> Não é semântica nova: é **a regra já certificada na Rodada 1, aplicada ao
> motor onde ela ainda não tinha sido aplicada**. O commit base chama-se *"lacuna
> não é um estado só"* — S-1 é a terceira superfície da mesma frase.

**E `atencao` aqui significa o que a gramática certificada define:** *"olhe
aqui, há ato humano possível"* — o ato existe (`requestPracticeUpdate`), é do
Curador, e está na Mesa. **Nunca significa erro, falha, conflito ou resultado
ruim** (§5), e **nunca bloqueia** (prova 7).

## Parte II — S-2 · o teste T-3

**Vai na mesma rodada de S-1, obrigatoriamente.** S-1 troca justamente o papel
que o T-3 deveria proteger; deixá-lo para depois entregaria a mudança sem rede.

**O novo T-3 deve observar comportamento, não texto:**

| Exigência | Forma |
|---|---|
| **render real** | montar o painel relacional com uma leitura **sem evidência** e afirmar a **classe/papel resultante** |
| **matar a regressão** | restaurar o papel `neutro` para a lacuna relacional **deve** derrubar o teste |
| **matar o desacoplamento** | o componente deixar de consultar a regra esperada **deve** derrubar o teste |
| **matar o alvo vazio** | asserção explícita de que o recorte tem **≥ 1 elemento** antes de qualquer verificação |
| **não depender de literal** | nenhuma asserção por substring, comentário ou presença de string |

**Cobrir os dois lados:** lacuna relacional ⇒ `atencao`; e um caso de leitura
**com** evidência ⇒ **não** `atencao` — senão o teste passaria pintando tudo de
âmbar.

## Parte III — S-3 · `BORDA_DO_PAPEL.neutro`

`BORDA_DO_PAPEL` vive **local**, em `leitura-relacional-panel.tsx:113`
(`Partial<Record<PapelVisual, string>>`), e tem **um único consumidor**: a linha
121, para `juizo`.

Com **S-1 = `atencao`**, a lacuna relacional passa a precisar da entrada
**`atencao`** — e a entrada `neutro` **permanece inalcançável**.

> **DECISÃO S-3: remover — na mesma rodada de S-1.**
>
> Não é remoção por assepsia: **a implementação de S-1 edita exatamente este
> mapa**. Remover ali é um gesto; adiar significa tocar o mesmo arquivo duas
> vezes, e código morto que sobrevive a uma rodada tende a sobreviver a todas.
>
> Nada se perde: `neutro` continua existindo como `PapelVisual` e como
> `classeDoPapel` na fonte central. O que sai é **uma variante de borda local
> sem consumidor**.

*(Registro: se S-1 tivesse ido para `neutro`, esta entrada passaria a ser usada
e a decisão seria a oposta. S-3 dependia de S-1, como o §9 previu.)*

## Parte IV — S-4 · `criteriosInsuficientes`

### O que a contagem realmente soma

```
criteriosInsuficientes =
    células assistenciais com LACUNA_DE_INFORMACAO      ← inclui SEM_REGISTRO e NAO_INFORMADO
  + summary.lacunas do motor relacional                 ← só "sem evidência"
```

**Três causas distintas somadas num número:**

| Origem | Alguém olhou? | Pela Rodada 1 / S-1, é atenção? | A palavra *"declarados"* cobre? |
|---|---|---|---|
| assistencial, `status = null` | **não** | **sim** | ❌ **não** |
| assistencial, `NAO_INFORMADO` | **sim** | **não** | ✅ sim |
| relacional, sem evidência | **não** | **sim** | ❌ **não** |

### Duas dívidas, de naturezas diferentes

**(a) A frase está errada — e é só texto.** *"N critérios **declarados** como
informação insuficiente"* é falsa em **dois dos três casos**: ninguém declarou
nada. Correção que descreve os três sem afirmar pendência:

> **"N critérios sem informação suficiente."**

**(b) A contagem talvez esteja errada para quem a consome — e isso é cálculo.**
`criteriosInsuficientes` alimenta `INSUFICIENTE`, que é uma classificação de
**atenção**. Mas ela inclui o caso assistencial `NAO_INFORMADO`, que a **Rodada 1
acabou de declarar não-acionável**.

> Pelas hipóteses do §11: **a contagem é Hipótese A** (toda lacuna, qualquer que
> seja a causa) **enquanto o consumidor pede Hipótese C** (o que exige atenção).

**Não decido isso aqui.** O comentário invoca **ADR-065 §10.3** como autoridade
para somar as lacunas na mesma contagem de atenção — e pode ser que o domínio
queira mesmo todas. Resolver exige ler a ADR e, possivelmente, ato do DT-01.

> **DECISÃO S-4: TEXTO na Rodada 2 · CÁLCULO em missão separada.**
>
> É a aplicação literal do §28: **não transformar dívida de texto em alteração
> de domínio.** A frase nova é verdadeira para os três casos **hoje**, e
> continuará verdadeira se a contagem mudar depois — ela descreve o que se
> conta, sem prometer que tudo ali pede ação.

## Parte V — S-1 e S-4 são o mesmo conceito?

**Sim, parcialmente — e a parte comum é exatamente a que vai junto.**

Ambas nascem da diferença entre *"ninguém declarou"* e *"declarado sem
informação"*. S-1 é essa diferença **na cor**; S-4(texto) é a mesma diferença
**na frase**. S-4(cálculo) é essa diferença **no número** — e só ela toca
domínio.

**Testando contra as quatro regras do §14:**

| Regra | S-1 + S-2 + S-3 + S-4(texto) |
|---|---|
| derivam da mesma decisão semântica? | **sim** — "lacuna não é um estado só", terceira aplicação |
| mesma superfície conceitual? | **sim** — leitura relacional e a frase que a conta |
| verificáveis juntos sem perder causalidade? | **sim** — quatro asserções independentes: classe, teste, ausência do símbolo morto, string |
| não ampliam risco para domínio/backend? | **sim** — e é por isso que o cálculo fica **de fora** |

**Quatro de quatro.** Não é "aproveitar a ida": é uma decisão só, com quatro
manifestações.

## Parte VI — A-1, A-4, A-3 reconfirmados

**A-1 — EXECUTAR, decisão inalterada.** Nada em S-1/S-4 tocou `mesa-shell.tsx`;
a duplicação persiste, e o argumento de altura no mobile continua válido.
**Rodada própria, depois das ressalvas semânticas.**

**A-4 — EXECUTAR, rodada separada depois de A-1.** O princípio permanece: o
problema não é faltar botão — é que **sete bordas fazem sete blocos editoriais
parecerem sete unidades de decisão**. Retirar contêiner, preservar conteúdo,
não inventar ação.

**A-3 — MANTER EM ESPERA.** Nenhuma evidência de uso real surgiu neste ciclo. A
ordem atual preserva *fonte antes de interpretação*, e antecipar *"Merece
atenção"* faria o Curador ler o contexto através da pré-seleção do sistema.
**Reabrir só com observação.**

## Parte VII — sequência

| Rodada | Escopo | Por quê |
|---|---|---|
| **2** | **S-1 + S-2 + S-3 + S-4(texto)** | uma decisão semântica, quatro manifestações; §14 satisfeito 4/4 |
| **2-bis** | **S-4(cálculo)** — missão própria, gate de domínio | toca o que a contagem mede; exige ADR-065 §10.3 e possivelmente o DT-01 |
| **3** | **A-1** isolado | subtrativo, arquivo único, devolve altura |
| **4** | **A-4** isolado | subtrativo, sem reordenar |
| **futuro** | A-3 | só com uso observado |

**Escolhi o §19 sobre o §18**, com um ajuste: S-4 entra na Rodada 2 **apenas
como linguagem**, e a parte de cálculo sai para missão própria em vez de
esperar. Motivo: a frase falsa está na tela **hoje** e custa uma string; a
pergunta do cálculo é de domínio e não deve atrasar a correção da cor nem ser
resolvida por conveniência.

**A ordem do §2 é respeitada:** semântica (S-1) → teste (S-2) → representação
(S-3, S-4-texto) → só então simplificação estrutural (A-1, A-4).

## Parte VIII — métricas da Rodada 2

| Item | Como saberemos |
|---|---|
| **S-1** | lacuna relacional recebe `atencao` nas **três** superfícies · **nenhum** item já analisado (`NAO_INFORMADO` assistencial) recebe âmbar · **nenhum** item com evidência recebe âmbar · zero falso positivo de atenção |
| **S-2** | o teste **cai** ao restaurar `neutro` na lacuna relacional · **cai** se o componente parar de consultar a regra · **cai** se o alvo desaparecer · **não** depende de literal · afirma recorte **≥ 1** |
| **S-3** | zero referências a `BORDA_DO_PAPEL.neutro` · `juizo` segue com sua borda · `neutro` **preservado** como `PapelVisual` na fonte central |
| **S-4(texto)** | a frase é verdadeira para as **três** causas · não afirma pendência sobre item já analisado · **o número não muda** |

**Cláusula de preservação em todas:** nenhuma métrica persegue redução, e S-4
inclui explicitamente *"o número não muda"* — é como se prova que o texto foi
corrigido **sem** tocar o cálculo.

## Gate (§28)

**S-1 foi decidida pela lógica existente** — sete provas de fluxo, a colisão de
nomes entre os dois motores, e a regra já certificada na Rodada 1. **Não parou.**

**S-4 foi separada** no ponto exato em que exigiria alterar o que a contagem
mede. **A parte de domínio não foi assumida.**

**Nada reaberto:** E-1, E-2, E-3, R-1, R-2, estados certificados,
`DESFECHO_LEGIVEL` e a paleta global permanecem intocados.

---

# DECISÃO S-1

**`atencao`.** A lacuna relacional é *"ninguém declarou"*, não *"declarado sem
informação"* — o token `NAO_INFORMADO` significa coisas opostas nos dois
motores. O ato humano existe, é do Curador e está na Mesa
(`requestPracticeUpdate`). **Não é semântica nova: é a regra da Rodada 1
aplicada à terceira superfície.**

# DECISÃO S-2

**Reescrever na Rodada 2, junto com S-1.** Teste por **comportamento** — render
real, papel resultante, mutação que mata a regressão, guarda de recorte vazio,
e um caso negativo (com evidência ⇒ **não** `atencao`).

# DECISÃO S-3

**Remover, na mesma rodada de S-1** — a implementação já edita esse mapa.
`neutro` permanece vivo como `PapelVisual` na fonte central; sai só a variante
de borda local sem consumidor.

# DECISÃO S-4

**TEXTO agora, CÁLCULO em missão separada.** A frase passa a *"N critérios sem
informação suficiente"*, verdadeira para as três causas. A pergunta de **o que a
contagem deve medir** vai a missão própria, com gate de domínio e leitura da
ADR-065 §10.3.

# DECISÃO A-1

**EXECUTAR** — em rodada própria, depois das ressalvas semânticas. Inalterada.

# DECISÃO A-4

**EXECUTAR** — rodada separada, depois de A-1. Inalterada.

# DECISÃO A-3

**MANTER EM ESPERA** — nenhuma evidência de uso real surgiu.

# PRÓXIMO PACOTE

**Rodada 2 — S-1 + S-2 + S-3 + S-4(texto).** Lacuna relacional passa a
`atencao`; T-3 reescrito por comportamento; `BORDA_DO_PAPEL.neutro` removido; a
frase da contagem corrigida **sem alterar o número**.

# PRÓXIMO AGENTE

**`03 ENGENHEIRO`** — exclusivamente a Rodada 2. A missão de **S-4(cálculo)**
volta ao **`DT-01`**, por tocar o que a contagem mede.
