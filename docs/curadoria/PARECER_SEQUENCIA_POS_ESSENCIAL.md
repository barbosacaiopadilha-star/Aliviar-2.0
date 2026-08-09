# Parecer — sequência da evolução UX após o nível ESSENCIAL

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `5c02877` — nível ESSENCIAL certificado |
| **Natureza** | **decisão arquitetural**. Nenhuma linha de código |

---

## Parte I — R-1 · o que `LACUNA_DE_INFORMACAO` significa

### A resposta está no domínio, e não é nenhuma das duas superfícies

`LACUNA_DE_INFORMACAO` é um dos **quatro resultados** do motor de
compatibilidade. E o domínio diz, em dois lugares, que ele **funde duas
situações diferentes**:

> *"ADR-040: ausência de registro é diferente de `NAO_INFORMADO`. **As duas caem
> em `LACUNA_DE_INFORMACAO`** — mas o Curador precisa saber se alguém olhou e
> não soube, ou se ninguém olhou ainda. Por isso o estado vem junto, e não some
> dentro do resultado."*
> — `motor-compatibilidade.ts`
>
> *"`SEM_REGISTRO` e `NAO_INFORMADO` caem os dois em `LACUNA_DE_INFORMACAO`, mas
> um significa **'ninguém olhou ainda'** e o outro **'olharam e não havia'**.
> São conversas diferentes com o profissional."*
> — `mesa-cruzamento-view.ts`

A distinção **já existe como dado**: `CompatibilityRow.status` viaja ao lado de
`result` exatamente para não se perder, e `CompatibilitySummary.gapsWithoutAnyRecord`
já conta separadamente as lacunas sem registro algum.

### Aplicando a gramática certificada

> **A pergunta do §4 — "`LACUNA_DE_INFORMACAO` por si só implica ação humana
> pendente?" — não tem resposta única, porque o resultado não é único.**

| `result` | `status` | frase que o domínio já usa | implica ato humano? | cor |
|---|---|---|---|---|
| `LACUNA_DE_INFORMACAO` | `null` — sem registro | *"Ainda não investigado"* | **sim** — investigar é ato do Curador | **`atencao`** |
| `LACUNA_DE_INFORMACAO` | `NAO_INFORMADO` | *"Analisado, mas sem informação suficiente"* | **não** — já olharam; é fato registrado | **`neutro`** |

**As duas superfícies estão parcialmente erradas, e por motivos opostos:**

- **Comparação premium** (tudo âmbar) chama de pendência algo que **já foi
  investigado e concluído como insuficiente** — gasta o âmbar onde não há ato, e
  o §5.2 da auditoria diz que âmbar só orienta se for raro.
- **Leitura relacional** (tudo neutro) esconde item que **ninguém olhou** — que
  é exatamente a pendência que a Mesa existe para expor (o mesmo princípio do
  E-1 certificado).

### O §5 respondido

*"Existe uma lacuna"* e *"a lacuna exige que o Curador aja agora"* **são
distintas no domínio** — e a arquitetura visual deve distingui-las, porque o
domínio distingue primeiro. **Não é distinção artificial: é a leitura de um
campo que já existe.**

**Nenhuma semântica nova. Nenhum estado novo. Nenhum cálculo novo.** A regra
passa a ler `status` além de `result` — ambos já presentes na mesma linha.

## Parte II — R-2 · a fonte central deve absorver as regras locais?

### Aplicando o teste do §7, membro a membro

`TOM_CLASSES` tem cinco entradas. **Quatro são leitura; uma é estado.**

| Token | O que é | Forma | Veredito |
|---|---|---|---|
| `alta` | leitura de evidência | sólida, cor institucional | **local — legítimo** |
| `media` | leitura de evidência | pontilhada, cor institucional | **local — legítimo** |
| `lacuna` | leitura de evidência | tracejada, cinza | **local — legítimo**, com a correção da Parte I |
| `neutra` | leitura de evidência | fina, cinza | **local — legítimo** |
| **`juizo`** | **estado operacional** — *"Aguarda juízo do Curador"* | dupla, **`--color-attention`** | **é semântica de estado ⇒ tende à fonte central** |

O próprio comentário do arquivo já reconhece a diferença: *"A única exceção é
`juizo`: 'Aguarda juízo do Curador' é falta de **ATO HUMANO**, não leitura de
evidência — e por isso é o único que recebe âmbar."*

### Por que centralizar os outros quatro seria erro

A fonte central exporta `PapelVisual = estrutura | resolvido | atencao |
impedimento | neutro` — **taxonomia de estados**. As quatro leituras são
**taxonomia de forma** (sólida/pontilhada/tracejada/fina) — e existem
precisamente porque compartilham a **mesma cor** e se distinguem por **forma**,
que é o que sobrevive ao daltonismo e não carrega julgamento.

> **Forçá-las dentro de `PapelVisual` misturaria as duas taxonomias que o §8
> manda separar** — e desfaria a decisão certificada em E-3.

**Veredito: 4/5 exceção legítima · 1/5 dívida real.** A dívida é pequena e
precisa: `juizo` já usa o **token certo**, mas a **regra** vive em dois lugares.

### E R-1 prova que R-2 precisa ser resolvida junto

`TOM_CLASSES.lacuna` é neutro; a comparação premium pinta âmbar. **A divergência
da Parte I é, literalmente, a mesma regra decidida em dois lugares.** Corrigir
R-1 em duas superfícies sem decidir onde a regra mora reproduziria a deriva no
próximo painel.

> **R-1 é a evidência empírica de que a parte de ESTADO da leitura precisa de
> fonte única — e a parte de FORMA não.**

**Encaminhamento: OPÇÃO R-A** — R-1 e R-2 juntas, porque são o mesmo defeito
visto de dois ângulos. Separá-las custaria duas rodadas para uma decisão só.

## Parte III — A-1 · rótulo duplicado

**A duplicação ainda existe, intacta.** O pacote certificado **não tocou**
`mesa-shell.tsx`: as linhas 193–194 seguem renderizando o rótulo da etapa e,
logo abaixo, a pergunta — enquanto a trilha já destaca a etapa ativa.

**A trilha mudou a necessidade do rótulo? Mudou — para menos.** E-1 acrescentou
uma faixa permanente com a frase de pendência da etapa atual e da próxima. A
trilha hoje diz **mais** sobre onde estou do que dizia quando o rótulo foi
escrito.

**Mobile — o argumento decisivo.** A certificação registrou que, a 320px, a
informação nova da trilha **tem custo de altura relevante**. A-1 devolve
exatamente uma linha de título nessa mesma região. **As duas mudanças se
compensam**, e a pergunta da etapa sobe para primeiro título.

**Teste de perda (§17):** nenhuma informação desaparece — o rótulo permanece na
trilha, destacado, com marca de estado e frase de pendência.

> **DECISÃO: EXECUTAR.** Arquivo único, subtrativo, reversível por `git revert`,
> e recupera altura onde o ESSENCIAL a gastou.

## Parte IV — A-3 · hierarquia do Briefing

O §11 pede para **não** assumir que "atenção primeiro" é melhor. Levei a sério,
e a resposta mudou em relação à auditoria.

**Contra reordenar agora:**

1. **Risco de ancoragem.** *"Merece atenção"* antes do que a pessoa declarou faz
   o Curador ler o contexto **através** dos pontos de atenção. O Briefing existe
   para responder *"como apresento esta Curadoria para esta pessoa"* — e essa
   pergunta pede a **declaração dela** primeiro.
2. **Ordem atual não é arbitrária:** pessoa → médicos → observações → atenção →
   sugestões é **fonte antes de leitura**, que é a doutrina do Método inteiro.
3. **Não há observação real** que diga que a atenção está sendo perdida. O ciclo
   ESSENCIAL foi certificado; o Briefing não gerou achado operacional.

**A favor:** cinco seções de peso igual continuam sem hierarquia — o problema é
real.

> **DECISÃO: ADIAR.** O problema existe, mas **a correção proposta troca um
> risco por outro**, e o segundo (viés de ancoragem em superfície de contexto
> clínico) é pior que o primeiro (rolar até a quarta seção).
>
> **Reavaliar quando houver uso real observado.** Se a espera incomodar, a
> alternativa sem risco é **densidade**: condensar as duas primeiras seções para
> que a quarta caia acima da dobra — **sem reordenar**.

## Parte V — A-4 · sete cards sem ação

O §13 está certo, e corrijo a formulação da auditoria: **superfície sem botão
não é defeito.** A Curadoria Técnica é legitimamente de **compreensão** — e a
própria auditoria concluiu que o problema é **densidade de leitura**, não
ausência de ação.

**Reformulando a pergunta como o §13 manda:** *esses sete contêineres ajudam ou
atrapalham a leitura?*

**Atrapalham** — e por uma razão de gramática, não de estética: **card promete
unidade de ação.** Sete bordas idênticas em volta de sete blocos de texto fazem
o olho procurar sete decisões que não existem. *Prioridades do Case*, *Protocolo
da Pessoa* e *Base de Evidências* são **três leituras do mesmo contexto**.

**A correção é editorial e subtrativa:** três cards viram **um bloco com três
subtítulos**. *Merece atenção* **permanece** com contêiner próprio — ali há, de
fato, algo que pede olhar.

**Teste de perda:** nenhuma. Nenhum título de seção sai; sai **borda**.

> **DECISÃO: EXECUTAR.** Purely subtrativo, sem reordenar nada, sem risco de
> viés.

## Parte VI — agrupamento

| Itens | Podem compartilhar pacote? |
|---|---|
| **R-1 + R-2** | **Sim, e devem** — são a mesma regra decidida em dois lugares (Parte II) |
| **A-1 · A-3 · A-4** | **Não.** Três arquivos, três telas, três efeitos distintos |

**São independentes por construção:** A-1 vive em `mesa-shell.tsx`, A-4 em
`curadoria_tecnica/page.tsx`, A-3 em `curadoria-briefing.tsx`. Nenhum depende do
outro, e nenhum compartilha componente.

> Juntá-los tornaria impossível saber **qual** mudança produziu **qual** efeito
> — e o ciclo ESSENCIAL provou o contrário: mudanças isoladas e mensuráveis
> chegaram à certificação sem ressalva bloqueante. **Preservar o método.**

## Parte VII — ordem recomendada

| Rodada | Conteúdo | Por quê |
|---|---|---|
| **1** | **R-1 + R-2** | corrige deriva **certificada**; nada novo deve ser construído sobre gramática divergente |
| **2** | **A-1** | subtrativo, arquivo único, devolve altura no mobile |
| **3** | **A-4** | subtrativo, sem reordenar, sem risco de viés |
| **4** | *(reavaliar A-3)* | só com uso real observado |

**Divirjo da sequência sugerida no §15 em um ponto: A-4 vem antes de A-3.**
A-4 **remove contêiner**; A-3 **muda ordem de leitura em superfície de contexto
clínico**. Subtrativo-e-seguro antes de reordenar-e-arriscado — e A-3 sequer
deveria entrar nesta fila sem observação.

**Contra a alternativa de pacote único (A-1+A-3+A-4):**

| Critério | Rodadas separadas | Pacote único |
|---|---|---|
| observabilidade | **alta** — um efeito por vez | baixa |
| segurança | **alta** | média |
| reversibilidade | **`revert` de um arquivo** | revert de três telas |
| clareza de efeito | **alta** | **nula** |
| risco de regressão UX | **baixo** | alto — três telas ao mesmo tempo |

## Parte VIII — como medir cada rodada

| Rodada | Métrica |
|---|---|
| **R-1 + R-2** | `LACUNA_DE_INFORMACAO` recebe **a mesma cor** nas duas superfícies **para o mesmo `status`** · nenhum item `NAO_INFORMADO` aparece em âmbar · nenhum item sem registro aparece em neutro · `juizo` importa o token da fonte central · os quatro tons de forma **permanecem locais** |
| **A-1** | títulos simultâneos na área de trabalho: **2 → 1** · a **pergunta** é o primeiro título · altura do topo a 320px **não aumenta** em relação a `5c02877` · rótulo da etapa **continua** legível na trilha |
| **A-4** | contêineres com borda: **7 → 4** · seções editoriais preservadas: **7 de 7** · altura total menor · *Merece atenção* mantém contêiner próprio |
| **A-3** *(se um dia)* | blocos antes do conteúdo de atenção · scroll até ele a 320px · **e** verificação explícita de que o contexto declarado pela pessoa continua sendo lido antes |

**Nenhuma métrica persegue redução numérica.** Todas incluem uma cláusula de
preservação.

## Gate (§23) — nada ficou indeterminado

Nenhuma decisão exigiu criar estado, inferir comportamento clínico, alterar
regra de domínio ou redefinir `LACUNA_DE_INFORMACAO`. **A Parte I não redefine o
termo — lê o campo `status` que o domínio já mantém ao lado dele, pela razão que
o próprio domínio escreveu.**

A paleta certificada **não é reaberta**: verde processual, vermelho de
impedimento, âmbar de ato humano e evidência sem verde/vermelho permanecem. R-1
não muda a gramática — **aplica-a corretamente**.

**Gráficos permanecem fora deste ciclo.** Nenhum caso inequívoco surgiu.

---

# DECISÃO R-1

**A representação deve seguir `status`, não `result`.** Sem registro
(*"ainda não investigado"*) ⇒ **`atencao`**; `NAO_INFORMADO` (*"analisado, mas
sem informação suficiente"*) ⇒ **`neutro`**. Nenhuma das duas superfícies está
correta hoje. **Nenhuma semântica nova.**

# DECISÃO R-2

**4/5 exceção legítima · 1/5 dívida.** Os tons `alta`, `media`, `lacuna` e
`neutra` são **taxonomia de forma** e permanecem locais. **`juizo` é estado** e
passa a derivar da fonte central. **Não centralizar por dogma.**

# DECISÃO A-1

**EXECUTAR** — a duplicação persiste, e a remoção devolve altura exatamente onde
o ESSENCIAL a gastou.

# DECISÃO A-3

**ADIAR** — o problema é real, mas reordenar troca rolagem por **viés de
ancoragem**. Reavaliar com uso observado; se urgir, condensar **sem** reordenar.

# DECISÃO A-4

**EXECUTAR** — não por faltar ação, e sim porque **sete bordas prometem sete
decisões que não existem**. Três cards de contexto viram um bloco com três
subtítulos.

# PRÓXIMO PACOTE RECOMENDADO

**Rodada 1 — R-1 + R-2**, juntas e sozinhas: unificar a decisão cromática de
`LACUNA_DE_INFORMACAO` por `status` nas duas superfícies, e mover **apenas**
`juizo` para a fonte central.

# PRÓXIMO AGENTE

**`03 ENGENHEIRO`** — exclusivamente a Rodada 1. A-1 e A-4 aguardam rodadas
próprias, na ordem do §VII.
