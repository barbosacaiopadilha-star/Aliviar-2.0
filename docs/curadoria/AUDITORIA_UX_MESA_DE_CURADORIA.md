# Auditoria UX/UI da Curadoria 2.0 — da tela de formulário à Mesa orientada à decisão

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `8a2c954` |
| **Natureza** | **auditoria + arquitetura UX/UI**. Nenhuma linha de código produzida |
| **Escopo medido** | 5 rotas do Portal do Curador · 56 componentes · **220 frases de tela** |

> **Nada aqui altera banco, migration, RPC, RLS, grant, estado, autoridade,
> autoria, idempotência, concorrência, contrato ou semântica.** Onde uma
> melhoria exigiria isso, ela foi **parada e documentada** no §12.

---

## 1. A hipótese foi testada — e é só parcialmente verdadeira

A missão pediu para **demonstrar**, não presumir. Extraí mecanicamente todo o
texto de tela das superfícies do Curador (conteúdo entre tags JSX e props
textuais, descontados os comentários) e medi repetição literal.

| Medida | Resultado |
|---|---|
| frases de tela distintas | **220** |
| frases que aparecem em **2+ arquivos** | **8** |
| dessas, rótulos genéricos que **devem** repetir (`Cancelar`, `Confirmar`, `Remover`, `Registrar`) | **6** |
| **redundância literal real** | **2** |

> ### A interface não é verbosa por repetição. Isso está medido.
>
> As duas únicas duplicações reais são *"Por que estas três, juntas"*
> (`mesa-workspace` × `report-editor`) e o par
> *"O que você observou"* / *"Registrar a apresentação"*
> (`observation-capture` × `devolutiva-workspace` × `report-editor`).
> **Ambas são legítimas** — a mesma pergunta feita na Mesa e relida no
> Relatório é continuidade, não eco.

**O problema é outro, e a medição o mostra.** Cruzando densidade estrutural com
presença de ação:

| Superfície | h | sec | cards | **botões** | `<p>` | total |
|---|---|---|---|---|---|---|
| `curadoria-briefing` | 5 | 5 | 3 | **0** | **15** | **28** |
| `mesa-workspace` | 3 | 3 | 2 | 6 | 13 | 27 |
| `curadoria_tecnica/page` | 8 | 7 | **7** | **0** | 4 | **26** |
| `painel-de-juizo` | 3 | 1 | **8** | 5 | 8 | 25 |
| `cruzamento-mesa` | 4 | 1 | 2 | 4 | 10 | 21 |
| `step-method-reference` | 7 | 1 | 1 | **0** | 4 | 13 |

> ### As três superfícies mais densas têm **zero ações**.
>
> A carga cognitiva da Mesa não vem de dizer a mesma coisa duas vezes. Vem de
> **superfícies que só se leem** ocupando o mesmo peso visual das superfícies
> onde se decide. **A hipótese se confirma em densidade e hierarquia, e se
> refuta em redundância textual.**

## 2. O que já está certo — e não deve ser tocado

Auditoria honesta começa por aqui. A Mesa **não** é um formulário ingênuo:

| Acerto | Onde |
|---|---|
| **cada etapa é uma pergunta**, não um substantivo — *"Quanto cada subcritério importa para esta pessoa?"* | `mesa-etapas.ts` |
| **nenhuma etapa bloqueia** — quem não pode ainda **diz do que depende** | `MesaEtapaStatus` sem `BLOQUEADA` |
| **contexto nunca sai da tela**; a navegação troca só a área de trabalho | `mesa-shell` |
| **cabeçalho responde "de quem é a vez"** em uma linha, com `aria-live` | `mesa-header` |
| **estado formal já tem tradução humana** e não vaza código para a tela | `DESFECHO_LEGIVEL` |
| **anti-ranking por desenho** — sem score, nota, estrela, colocação | briefing, painéis |

**Nada disso entra em proposta de mudança.** A arquitetura de quatro painéis é o
alicerce sobre o qual esta auditoria trabalha.

## 3. Os quatro achados reais

### A-1 · O nome da etapa aparece duas vezes, ao mesmo tempo

`MesaSteps` destaca a etapa ativa com seu rótulo. Logo abaixo, a área de
trabalho renderiza **o mesmo rótulo** como `mesa-work__title`, e só então a
pergunta:

```
[ ✓ Mapa de Prioridades ] [ ● Rede elegível ] …   ← navegação, ativa
  Rede elegível                                    ← mesa-work__title
  Quem pode participar desta Curadoria?            ← mesa-work__question
```

**Classificação: ELIMINAR** (o `mesa-work__title`). A navegação já diz **onde
estou**; a pergunta já diz **o que respondo**. O rótulo intermediário não
acrescenta informação, instrução, rastreabilidade nem estado.

*Teste do §4 aplicado:* perde informação? não — está na navegação, destacada.
Perde instrução? não. Rastreabilidade? não. Segurança? não. Entendimento do
estado? não. Já está inequívoco em outro elemento? **sim.** ⇒ eliminação
autorizada.

**Ganho real:** a **pergunta** vira o primeiro título da área de trabalho. A
tela passa a abrir com o raciocínio, não com o rótulo.

### A-2 · O que falta em cada etapa é invisível para quem enxerga

`MesaSteps` calcula `etapa.pending` (*o que falta, em uma frase*) e
`etapa.waitingOn` (*do que depende*) — e os entrega **apenas em `sr-only`**.
Quem enxerga recebe só `✓ ● ·`.

> **Isto é o inverso do problema comum de acessibilidade.** A informação existe,
> está calculada, é curta — e está disponível **só** para leitores de tela.
> O Curador vidente precisa **abrir cada etapa** para descobrir o que ela deve.

**Classificação: REVELAR SOB DEMANDA** — não permanente, para não recriar o muro
de texto. Proposta: a etapa **ativa** e a **próxima decisão** mostram sua frase
de pendência abaixo da trilha; as demais a revelam em `hover`/`focus`/toque —
**com equivalência textual mantida no `sr-only`**, nunca substituída.

**Nenhum dado novo. Nenhum cálculo novo.** É exposição de um campo que já existe.

### A-3 · O Briefing é uma pilha de cinco seções irmãs

`curadoria-briefing` tem **cinco `<section>` no mesmo nível visual**
(`text-sm font-semibold`), dentro de um Card, com 15 parágrafos e **nenhuma
ação**: *o que a pessoa declarou* · *o que os médicos declararam* ·
*observações* · *merece atenção* · *sugestões*.

Cinco pesos iguais = nenhuma prioridade. E duas dessas seções — **"merece
atenção"** e **"sugestões"** — são exatamente as que mudam o que o Curador faz
a seguir; estão enterradas em quarto e quinto lugar.

**Classificação: REPOSICIONAR + REVELAR SOB DEMANDA.**

| Seção | Proposta |
|---|---|
| **Merece atenção** | **primeira**, e é o único bloco com destaque cromático (âmbar) |
| **Sugestões de condução** | **segunda** |
| O que a pessoa declarou | terceira, **condensada** — íntegra sob demanda |
| O que os médicos declararam | quarta, **condensada** — íntegra sob demanda |
| Observações | **revelar sob demanda** |

### A-4 · Sete cards sem uma única ação

`curadoria_tecnica/page` empilha **sete cards** — *Investigação · Merece atenção
· O que suas declarações indicam · Prioridades do Case · Protocolo da Pessoa ·
Base de Evidências de Prática* — e **nenhum botão**. Cada bloco de leitura ganhou
um contêiner com borda, e a borda promete uma unidade de ação que não existe.

**Classificação: FUNDIR + ELIMINAR CONTÊINER.** Card é unidade de **informação
ou ação**, não moldura de parágrafo (§19). *Prioridades*, *Protocolo* e *Base de
Evidências* são **três leituras do mesmo contexto** — viram um bloco com três
subtítulos, sem três bordas.

## 4. Tela por tela

### 4.1 Mesa de Curadoria — as seis etapas (`casos/[id]/[etapa]`)

**Função:** o ambiente onde a Curadoria acontece — contexto fixo, navegação por
etapa, área de trabalho que troca.

**Problemas:** A-1 (rótulo duplicado) · A-2 (pendência invisível) · a linha de
investigação, o título, a pergunta e o conteúdo competem no mesmo bloco.

| Ação | Elemento |
|---|---|
| **MANTER** | cabeçalho de três linhas · pergunta da etapa · trilha de seis etapas · contexto lateral · linha do tempo · atalhos |
| **ELIMINAR** | `mesa-work__title` (A-1) |
| **REVELAR SOB DEMANDA** | `etapa.pending` das etapas não-ativas (A-2) |
| **CONDENSAR** | `AtalhosDica` — vira ícone `?` no cabeçalho, mantendo o painel de ajuda |
| **SUBSTITUIR POR VISUALIZAÇÃO** | `progress.done de total` → a **própria trilha** já é a barra de progresso; o contador textual é redundante com ela |

**Hierarquia proposta:** ① pessoa + de quem é a vez → ② trilha (onde estou / o
que falta) → ③ **pergunta da etapa** → ④ área de trabalho → ⑤ contexto lateral.

**Cor:** trilha é o único lugar com estado cromático; a área de trabalho é
neutra, para que o âmbar de uma pendência real seja visto.

**Mobile:** trilha vira barra horizontal rolável com a etapa ativa centralizada;
o contexto lateral vira uma gaveta *"Contexto do Case"* — **exceto as
pendências**, que sobem para o cabeçalho.

**Risco:** nenhum. Nada aqui toca estado ou autoridade.

### 4.2 Briefing da Curadoria

**Função:** responder *"como apresento esta Curadoria para esta pessoa?"* sem
reler a Consulta Inicial.

**Problemas:** A-3 · 15 parágrafos · zero ações · cinco pesos iguais.

| Ação | Elemento |
|---|---|
| **MANTER** | as cinco seções — **todo o conteúdo permanece acessível** |
| **REPOSICIONAR** | *Merece atenção* e *Sugestões* para o topo |
| **CONDENSAR** | declarações da pessoa e dos médicos: três linhas + *"ver todas"* |
| **REVELAR SOB DEMANDA** | observações |
| **ELIMINAR** | subtítulo *"O que a própria pessoa declarou — nunca uma leitura sobre ela."* como texto permanente — vira **atributo do bloco** (uma linha, uma vez), não repetido por seção |

**Cor:** âmbar **apenas** em *Merece atenção*. As demais em cinza/marfim.

**Risco de inferência:** ⚠️ contar declarações (*"12 evidências"*) **não** deve
virar barra de proporção — proporção sugere força, e força não existe no
domínio. **Números como números.**

### 4.3 Juízo do Curador (H8–H11)

**Função:** registrar o juízo humano nos seis conceitos, por profissional.

**Problemas:** **8 cards** numa grade de dois por linha — com N profissionais, o
Curador percorre 6×N cartões visualmente idênticos. Nada distingue *"já
julgado"* de *"aguardando"* antes de ler.

| Ação | Elemento |
|---|---|
| **MANTER** | um cartão por conceito · evidências referenciadas · textarea 280 · motivo opcional · modelos de redação · histórico de versões |
| **SUBSTITUIR POR VISUALIZAÇÃO** | uma **régua de seis marcas** por profissional — `✓ ✓ ● · ✓ ●` — que diz de relance quantos conceitos aguardam juízo, **antes** de rolar |
| **REVELAR SOB DEMANDA** | histórico de versões anteriores |
| **CONDENSAR** | cartões **já julgados** colapsam para uma linha com a conclusão vigente |

**Cor:** âmbar em *aguarda seu juízo*; verde suave em *registrado*; cinza em
*não iniciado*. **Nunca** verde/vermelho para o conteúdo da conclusão.

**Risco:** ⚠️ a régua **não pode** somar ou pontuar. Seis marcas, seis estados
processuais — **nunca** "4 de 6 favoráveis". É contagem de **etapa cumprida**,
jamais de mérito.

### 4.4 Curadoria Técnica (`curadoria_tecnica`)

**Problemas:** A-4 — sete cards, zero ações.

| Ação | Elemento |
|---|---|
| **FUNDIR** | *Prioridades do Case* + *Protocolo da Pessoa* + *Base de Evidências* → um bloco **Contexto**, três subtítulos, uma borda |
| **MANTER** | *Merece atenção* como bloco próprio e destacado |
| **ELIMINAR** | contêineres de card usados só para envolver texto |
| **REPOSICIONAR** | *Investigação* logo abaixo de *Merece atenção* |

### 4.5 Referência do Método (`step-method-reference`)

Sete títulos, *Objetivo* e *Regras que valem aqui*, zero ações — **conteúdo de
terceira camada ocupando a primeira**.

**Classificação: REVELAR SOB DEMANDA.** Vira `?` ao lado da pergunta da etapa.
**Nada some** — deixa de ser leitura obrigatória.

### 4.6 Relatório e encerramento

**Função:** escrever, aprovar, emitir, entregar.

| Ação | Elemento |
|---|---|
| **CONDENSAR** | os avisos de conclusão em **um** componente de transição |
| **MANTER** | *"Antes de emitir:"* — é checagem antes de ato irreversível |
| **REPOSICIONAR** | ação de emitir isolada, com respiro, sem concorrer com texto |

**Componente único de encerramento:**

```
Curadoria concluída ✓
  Técnica concluída · Síntese concluída · Entrega registrada
  Próximo passo: finalizar
  [ Finalizar curadoria ]
```

**Cor:** verde suave **só** no estado processual concluído. **Verde jamais
significa desfecho clínico favorável.**

### 4.7 Painel do Curador (`portal-curador`)

**Proposta:** quatro contagens acionáveis — *ativas · aguardando seu juízo ·
prontas para revisão · prontas para entrega* —, cada uma um **filtro clicável**,
não um enfeite. **Zero métrica administrativa misturada a leitura clínica.**

## 5. Sistema cromático

### 5.1 Três funções que não se misturam

| Função | Papel | Regra |
|---|---|---|
| **Institucional** | identidade Aliviar | nunca comunica estado |
| **De estado** | onde o processo está | vocabulário fechado (§6) |
| **De atenção** | onde agir | **uma cor só**, e escassa |

### 5.2 A paleta

| Cor | Uso | Proibição |
|---|---|---|
| **Azul profundo** | navegação, títulos, ação primária, estrutura | **nunca** significa "positivo" |
| **Verde suave** | **estado processual concluído** — etapa respondida, juízo registrado, entrega feita | **nunca** desfecho clínico favorável |
| **Âmbar discreto** | **ação humana necessária** — `AGUARDA_JUIZO_DO_CURADOR`, pendência, superado por evidência | diz *"olhe aqui"*, **nunca** *"perigo"* |
| **Vermelho** | **erro, conflito, bloqueio, falha** | **nunca** divergência, conclusão desfavorável ou discordância |
| **Cinza / marfim** | contexto, não iniciado, repouso | — |

> **O âmbar é a cor mais importante da Mesa, e por isso é a mais cara.** Ele só
> funciona se for raro. **Regra de orçamento: no máximo uma região âmbar por
> tela** — se duas competem, nenhuma orienta.

### 5.3 Evidência: nem verde, nem vermelho

Convergência e divergência **não são acerto e erro**. Divergir é informação
legítima, e pintá-la de vermelho ensina o Curador a evitá-la.

**Proposta:** as duas em **azul**, distintas por **forma e posição** —
convergente com marca sólida, divergente com marca vazada, inconclusiva com
traço. **Cor idêntica, símbolo diferente.** Sobrevive ao daltonismo e não
carrega julgamento.

## 6. Matriz de estados

| Estado formal | Rótulo visível | Cor | Sinal | Significado | Risco |
|---|---|---|---|---|---|
| `AGUARDA_JUIZO_DO_CURADOR` | *Aguardando seu juízo* | âmbar | `●` | falta ato humano | ⚠️ parecer "atrasado" — é estado normal |
| `JUIZO_REGISTRADO` | *Juízo registrado.* | verde suave | `✓` | ato concluído | ⚠️ ler como "aprovado" — é **processual** |
| `JUIZO_SUPERADO_POR_EVIDENCIA` | *Evidência nova desde o seu juízo* | âmbar | `↻` | pede releitura | ⚠️ parecer erro — **não é**; é atualidade |
| `JUIZO_RETIRADO` | *Julgamento retirado — o conceito voltou a aguardar juízo.* | âmbar | `●` | volta a aguardar | ⚠️ parecer perda — nada é apagado |
| `VERSAO_JA_GRAVADA` | *Já estava gravado — nada foi duplicado.* | cinza | `=` | sucesso idempotente | ⚠️ parecer falha — é **sucesso** |
| `CONFLITO_DE_VERSAO` | *O julgamento mudou desde a sua leitura.* | **vermelho** | `!` | precisa reler e reagir | conflito real |
| `SEM_AUTORIDADE` | *Você não tem autoridade para este ato.* | **vermelho** | `⨯` | ato impossível | ⚠️ nunca sugerir contorno |
| `ERRO_TECNICO` | *Não foi possível concluir o ato agora.* | **vermelho** | `!` | falha técnica | — |
| etapa `PRONTA` | *respondida* | verde suave | `✓` | etapa respondida | ⚠️ **não** significa boa |
| etapa `PENDENTE` | *aguarda você* | âmbar | `●` | ação humana | — |
| etapa `AGUARDA` | *depende de outra etapa* | cinza | `·` | ainda não é a vez | ⚠️ não é bloqueio |

> **Os rótulos já existem em `DESFECHO_LEGIVEL` e estão bons.** Esta matriz
> **não os reescreve** — acrescenta a camada visual que falta. Cada estado tem
> **cor + símbolo + texto**: nenhum depende de cor sozinha (§14).
>
> **Dois estados exigem cuidado especial:** `VERSAO_JA_GRAVADA` é **sucesso** e
> não pode parecer erro; `JUIZO_SUPERADO_POR_EVIDENCIA` é **atualidade** e não
> pode parecer falha.

## 7. Visualizações — só quatro sobrevivem ao teste

Critério: *fica realmente mais claro com um gráfico?* Se não, não existe.

| Proposta | Veredito |
|---|---|
| **Trilha das seis etapas** com marca de estado | ✅ **já existe** — é a melhor visualização da Mesa; só precisa mostrar a pendência (A-2) |
| **Régua de seis marcas por profissional** (juízo) | ✅ substitui rolar 6×N cartões |
| **Quatro contagens acionáveis** no painel inicial | ✅ são filtros, não enfeite |
| **Contagem de evidências** (12 analisadas · 8 convergentes · 3 divergentes · 1 inconclusiva) | ✅ **como números**, ❌ **como barra de proporção** |
| Barra de progresso da Curadoria | ❌ **a trilha já é** |
| Gráfico comparando profissionais | ❌ **proibido** — é ranking |
| Medidor de "força" da evidência | ❌ **não existe no domínio** |

> **Regra:** gráfico mostra padrão · texto explica · Curador decide. Onde o
> número já é claro, o número fica.

## 8. Componentes propostos

| Componente | Substitui |
|---|---|
| `TrilhaDeEtapas` (com pendência revelável) | `MesaSteps` + o contador textual |
| `BlocoDeContexto` (subtítulos, uma borda) | três a sete cards de leitura |
| `MarcaDeEstado` (cor + símbolo + texto) | badges avulsos, cada um à sua maneira |
| `ReguaDeConceitos` | rolagem por 6×N cartões |
| `EncerramentoDaCuradoria` | avisos de conclusão espalhados |
| `MaisDetalhes` | blocos expositivos permanentes |

## 9. Antes × depois

| Superfície | Blocos | Títulos | Cards | Ações | Visualizações |
|---|---|---|---|---|---|
| **Mesa (etapa)** — antes | 5 | 3 | — | 1 | 1 |
| **Mesa (etapa)** — proposta | 4 | **2** | — | 1 | **1** *(mais informativa)* |
| **Briefing** — antes | 5 | 5 | 3 | **0** | 0 |
| **Briefing** — proposta | **3** *(2 sob demanda)* | 5 | **1** | 0 | 0 |
| **Curadoria Técnica** — antes | 7 | 8 | **7** | 0 | 0 |
| **Curadoria Técnica** — proposta | **4** | 8 | **3** | 0 | 0 |
| **Juízo (por profissional)** — antes | 6 | 3 | **6** | 5 | 0 |
| **Juízo** — proposta | 6 | 3 | **6** *(julgados colapsam)* | 5 | **1** |

> **Nenhum título de seção foi eliminado** — sumiram **contêineres** e
> **leitura obrigatória**, não conteúdo. **Toda informação continua acessível.**

## 10. Mobile

Ordem vertical fixa: ① de quem é a vez → ② pendências → ③ pergunta da etapa →
④ ação → ⑤ contexto (gaveta) → ⑥ linha do tempo (gaveta).

Trilha como barra horizontal rolável, ativa centralizada · **nada depende de
hover** (o revelável de A-2 responde a toque) · ação primária alcançável sem
rolar · pendência **nunca** dentro de gaveta.

## 11. Acessibilidade

**Contraste** AA mínimo, âmbar sobre marfim conferido · **daltonismo**: todo
estado tem símbolo além de cor, e evidência usa **forma**, não vermelho/verde ·
**teclado**: os atalhos existentes preservados, revelável acessível por `focus`
· **leitores de tela**: o `sr-only` de `MesaSteps` **permanece** — A-2
**acrescenta** ao vidente, não remove do leitor · `aria-live` do cabeçalho
mantido.

## 12. ⚠️ Gate de segurança — parado e não assumido

Estas ideias **exigiriam** dado, estado ou cálculo novo. **Nenhuma é proposta.**

| Ideia | Por que parou |
|---|---|
| *"12 analisadas · 8 convergentes"* no Briefing | exige **classificar** evidência em convergente/divergente/inconclusiva. Se essa classificação não existe formalmente, **é dado novo** — e transformá-la em barra seria inferência clínica |
| Ordenar profissionais por conceitos julgados | **ranking**, proibido no domínio |
| "Tempo aguardando juízo" | dado derivado novo, e induz pressa em ato de julgamento |
| Semáforo de "prontidão do Case" | agregação nova, com aparência de nota |
| Verde no juízo por conteúdo da conclusão | **inferência clínica** — verde é só processual |

**Só implementar contagens de evidência se a classificação já existir no
domínio. Verificação obrigatória antes de qualquer visualização — decisão do
DT-01.**

## 13. Priorização

| Nível | Proposta |
|---|---|
| **ESSENCIAL** | **A-2** — mostrar a pendência a quem enxerga *(informação já existe e está sonegada)* · **matriz de estados** com cor+símbolo+texto · **evidência sem verde/vermelho** |
| **ALTO IMPACTO** | **A-1** eliminar o título duplicado · **A-3** reordenar o Briefing · **A-4** fundir os sete cards |
| **ÚTIL** | régua de conceitos · componente único de encerramento · Método sob demanda · condensar cartões julgados |
| **OPCIONAL** | painel inicial como centro de comando · atalhos como ícone |
| **NÃO RECOMENDADA** | qualquer gráfico comparativo · barra de proporção de evidências · progresso duplicado · semáforo de prontidão |

## 14. Conclusão

> A Curadoria 2.0 **não sofre de repetição** — 8 frases repetidas em 220, e seis
> delas são botões. Sofre de **três coisas mensuráveis**: superfícies que só se
> leem com o mesmo peso das que decidem; hierarquia plana onde tudo é irmão de
> tudo; e **cor sem gramática**.
>
> A correção mais valiosa é também a mais barata: **`etapa.pending` já está
> calculado e só o leitor de tela o recebe.** Mostrá-lo a quem enxerga não custa
> dado, cálculo nem estado — e é a diferença entre uma trilha que informa e três
> símbolos que só decoram.
>
> **Nenhuma proposta aqui altera domínio.** As que alterariam estão no §12,
> paradas.
