# A Travessia da Paciente — Projeto Experiência Visual · Etapa 2

> **Status:** projeto de experiência percebida de `/paciente/curadoria`. Não é wireframe, não é layout, não é CSS, não é componente novo.
> **Fonte de verdade:** [NARRATIVA_DA_EXPERIENCIA.md](./NARRATIVA_DA_EXPERIENCIA.md) — nenhuma decisão aqui a contraria. Herda, congelados, todos os documentos que ela herda.
> **Não altera:** domínio, banco, Motor, Curadoria, Connection, Relationship, regras, estados, RLS. Nenhuma funcionalidade muda. Nenhuma tela nova. Cada afirmação sobre o que existe é rastreável ao código do RC1 (caminhos citados).
> **Data:** 2026-08-01

---

# 1 · Como a paciente entra

Ela chega a `/paciente/curadoria` vinda do corredor — a home `/paciente`, pelo `CuradoriaCard` ("Acompanhar") ou pelos `QuickLinks`. A página só tem conteúdo porque um Relatório foi **entregue**: a RLS libera a leitura pelo `delivered_at` (comentário em [page.tsx:29](../../src/app/paciente/curadoria/page.tsx)), e antes disso ela encontra o estado vazio honesto ("Ainda não há relatórios aqui.").

**O que ela sabe.** Que contou sua história e alguém leu. Que reconheceu o próprio Perfil — sem reconhecimento a Curadoria não avança (playbook RC1, etapa obrigatória). Que um Curador com nome preparou três caminhos para o caso dela — a Recepção e a Sala prometeram exatamente isso.

**O que ainda não sabe.** Quem são os três. Qual a diferença entre eles. O que acontece depois de escolher — quem segue com ela, o que é reversível e até quando. E não sabe — porque nenhuma superfície deve dizer — que existe qualquer expectativa sobre quanto tempo ela leve.

**A emoção.** Curiosidade tensa. É o momento que a jornada inteira preparou, e ela chega com o hábito do ranking no bolso e o medo de errar no peito.

**A pergunta.** Ao entrar: *"qual é a diferença entre eles?"* — e, atrás dela, esperando a vez: *"posso decidir? é meu direito?"* e *"estou sozinha de novo?"*. A página atravessa as três perguntas, e é por isso que ela precisa ser uma travessia, não uma pilha.

---

# 2 · Onde os quatro ambientes começam e terminam

A página hoje ([page.tsx:74-110](../../src/app/paciente/curadoria/page.tsx)) empilha tudo em `space-y-8` — os quatro ambientes separados por 32px, a mesma distância que separa dois cartões quaisquer. As fronteiras reais, porém, **já existem na estrutura condicional do código**; o trabalho é torná-las perceptíveis.

| Ambiente | Começa em | Termina em | Gatilho da passagem |
|---|---|---|---|
| **Sala Particular** (o eco dela — a antessala da travessia) | o topo da página: o enquadramento na voz do Curador — título, "os três são legítimos — a ordem é de apresentação", e o `compositionRationale` que ele escreveu ([caminhos-panel.tsx:66-77](../../src/components/paciente/caminhos/caminhos-panel.tsx)) | quando ela terminou de se reencontrar no próprio caso | **dela:** o primeiro gesto em direção às cartas. Ninguém a empurra — o enquadramento não tem botão |
| **Mesa de Comparação** | as três cartas fechadas (`patient-cartas`) | quando ela conheceu os três — condição `todasConhecidas`, já implementada com memória por `localStorage` ([caminhos-panel.tsx:62,102](../../src/components/paciente/caminhos/caminhos-panel.tsx)) | **conclusão, não navegação:** conhecer a terceira carta faz o convite existir. É a lei da travessia da Narrativa acontecendo em código real |
| **Sala da Decisão** | o convite ("nenhum deles está pré-escolhido") e o painel de escolha (`ConnectionChoicePanel`, etapas `choosing` → `reviewing`) | a confirmação explícita — `createConnectionAction`, o único ato que persiste ([connection-choice-panel.tsx:76-110](../../src/components/patient/connection-choice-panel.tsx)) | **dela, duas vezes:** escolher e depois confirmar, com revisão entre as duas. Nada foi escrito antes disso |
| **Espaço de Acompanhamento** | o `router.refresh()` pós-confirmação: `ConnectionProgressPanel` assume, com `ContactModePanel` enquanto `DECISAO_REGISTRADA` e `RelationshipStatusPanel` quando o Relationship nasce | não termina — é a varanda | **do sistema, silencioso:** a casa simplesmente continua. Sem parabéns, sem modal — exatamente como a Narrativa manda |

Nenhum ambiente novo. As quatro fronteiras são as que a Narrativa §8 já mapeou — este documento apenas as localiza no código, linha a linha.

---

# 3 · Cada ambiente por dentro da travessia

## Sala Particular (o eco — a entrada da página)

- **Emoção:** o alívio de reconhecer-se antes de comparar. **Pergunta:** *"isto ainda é sobre mim?"* **Transformação:** de ansiosa pelos três → ancorada no próprio caso.
- **Aparece:** a voz do Curador (o `compositionRationale` é a única prosa dele na página — deve ser lida como voz humana, serifa, antes de qualquer estrutura); a frase de reenquadramento; as prioridades dela na ordem dela (ver §9.2).
- **Desaparece (da percepção):** qualquer sinal da Mesa — as cartas não disputam a primeira dobra com o enquadramento.
- **Destaque:** as palavras — dele e dela. **Silencioso:** tudo o mais. Nenhum botão, nenhum convite, nenhuma contagem.

## Mesa de Comparação

- **Emoção:** clareza sem pressão. **Pergunta:** *"qual é a diferença entre eles?"* **Transformação:** de "qual é o melhor?" → "o que muda entre eles nisto que me importa — e do que abro mão em cada um?"
- **Aparece:** primeiro o comum (o enquadramento já disse: os três são legítimos e atendem ao caso dela), depois as pessoas (retrato + a frase do Curador sobre por que este caminho está aqui — [carta-caminho.tsx:68-72](../../src/components/paciente/caminhos/carta-caminho.tsx)), depois as diferenças, uma carta por vez.
- **Desaparece:** a barra de dez traços (§9.3); qualquer resíduo de medida.
- **Destaque:** a carta aberta — o resto do ambiente recua (comportamento já existente: uma carta por vez, [caminhos-panel.tsx:19-21](../../src/components/paciente/caminhos/caminhos-panel.tsx)).
- **Silencioso:** a comparação lado a lado (opcional, dita como opcional — "muita gente prefere ler um por um", [estados-vazios.tsx:61-71](../../src/components/paciente/experiencia/estados-vazios.tsx)); a memória "você já conheceu este caminho" (sussurro, nunca checklist); e o relógio, que não existe.

## Sala da Decisão

- **Emoção:** autonomia sem solidão. **Pergunta:** *"posso decidir? é meu direito?"* **Transformação:** de informada → autora de uma decisão.
- **Aparece:** os três nomes com o mesmo peso (`Radio` neutro, nenhum pré-selecionado — [connection-choice-panel.tsx:146-172](../../src/components/patient/connection-choice-panel.tsx)); a revisão antes de confirmar; as verdades que o Contrato Operacional autoriza: *"você ainda poderá corrigi-la enquanto não iniciar o contato"* — a única frase de reversibilidade verdadeira.
- **Desaparece:** a Mesa inteira. Este é o mecanismo central da travessia: quando ela entra na Decisão, a informação **para de crescer** — as cartas assentam, recuadas, disponíveis mas apagadas. Nenhuma informação nova aparece deste ponto em diante.
- **Destaque:** nada. A Sala é o cômodo vazio — mais de 70% de vazio como alvo (F2 §10), quatro saídas de mesmo peso: os três caminhos e sair sem confirmar (que já é a quarta porta: nada se perde, nada foi escrito, e a página reabre onde estava — comportamento real, `localStorage` + estado no banco intocado).
- **Silencioso:** tudo depois da confirmação. Nenhuma celebração, nenhum "ótima escolha" — o código já não celebra; a forma não pode trair isso.

## Espaço de Acompanhamento

- **Emoção:** continuidade. **Pergunta:** *"estou sozinha de novo?"* **Transformação:** de quem age → quem é acompanhada.
- **Aparece:** o nome — *"você escolheu seguir com {nome}"* ([connection-progress-panel.tsx](../../src/components/patient/connection-progress-panel.tsx)); o próximo passo possível dito sem prazo ("quando você decidir dar o próximo passo, pode registrar por aqui"); o modo de começar, sem pré-seleção e sem promessa ([contact-mode-panel.tsx:13-26](../../src/components/patient/contact-mode-panel.tsx)); o acompanhamento ativo quando nasce.
- **Desaparece:** os outros dois caminhos — saem de cena, nunca da história: as cartas permanecem alcançáveis acima, assentadas (F1 P14: depois da decisão as alternativas saem de cena; A_DECISAO: saem no primeiro atendimento — a percepção segue o domínio: enquanto `DECISAO_REGISTRADA`, corrigir reabre a escolha, e as cartas voltam à luz).
- **Destaque:** quem está com ela. **Silencioso:** as ações terminais ("o contato não avançou" é `ghost`, presente sem alarde — já é assim no código; permanece assim na forma).

---

# 4 · Os componentes existentes, um a um

Inventário integral do que a página renderiza hoje ([page.tsx](../../src/app/paciente/curadoria/page.tsx)). Nenhuma alteração funcional em nenhuma linha desta tabela.

| Componente (arquivo) | Classificação | Justificativa |
|---|---|---|
| `PatientEmptyState` (estado sem entrega) | **permanece** | linguagem já correta ("aparecerão com calma neste espaço") |
| `CaminhosPanel` ([caminhos-panel.tsx](../../src/components/paciente/caminhos/caminhos-panel.tsx)) | **é dividido** (percepção, não código) | hoje um `<section>` único contém dois ambientes: o enquadramento (Sala Particular) e as cartas + comparação (Mesa). A divisão é perceptiva — vazio, luz e limiar entre os dois blocos que ele já renderiza em sequência |
| — o enquadramento ("Seus três caminhos" + `compositionRationale`) | **muda apenas visualmente** | de cartão com título de seção para prosa em serifa com ar — a voz do Curador lida como carta, não como header |
| — o convite pós-`todasConhecidas` | **muda apenas visualmente** (inclui linguagem) | vira o limiar da Sala da Decisão (§5). A frase atual — "Agora você possui as informações necessárias para decidir" — **declara suficiência**, e a Mesa não julga prontidão (A_MESA §7; A_SALA_DA_DECISAO: nenhum sinal de completude). Redita sem veredito: a segunda frase já existente ("Não há pressa, e nenhum deles está pré-escolhido") é a correta e basta |
| `CartaCaminho` ([carta-caminho.tsx](../../src/components/paciente/caminhos/carta-caminho.tsx)) | **muda apenas visualmente** | abre no lugar, uma por vez, memória de leitura — tudo certo e preservado. Muda: a seção "Como responde ao seu Perfil" troca a barra pela gramática de frase + textura de linha (§9.3); os chips de "O que encontramos"/"Perguntas" viram texto corrido ou lista com ar (chips empilháveis se contam no olho — F2 R5) |
| `Retrato` ([retrato.tsx](../../src/components/paciente/caminhos/retrato.tsx)) | **permanece** | iniciais tipográficas determinísticas, sem foto falsa — já cumpre F2 §7 ("nenhum banco de imagens") com honestidade |
| `BarraCompatibilidade` ([barra-compatibilidade.tsx](../../src/components/paciente/caminhos/barra-compatibilidade.tsx)) | **desaparece** (como forma) | dez traços contáveis em degraus (10/6/0/1 — [experiencia.ts:195-200](../../src/modules/paciente/experiencia.ts)) são magnitude, e magnitude é nota. A informação que carrega — o estado por extenso, que o próprio componente admite ser "ele que informa" — permanece integralmente, redita como frase com textura de linha (§9.3). Nenhum dado muda |
| `ComparacaoCaminhos` ([comparacao-caminhos.tsx](../../src/components/paciente/caminhos/comparacao-caminhos.tsx)) | **muda apenas visualmente** | a leitura "uma dimensão por vez, nunca tabela" está correta e fica. Mudam: o seletor deixa a aparência de abas-pílula (tab é elemento banido — F2 §12) mantendo a mesma interação de foco por dimensão; e as células trocam a barra pela frase com textura (§9.3) |
| `ComparacaoNaoIniciada` ([estados-vazios.tsx:61](../../src/components/paciente/experiencia/estados-vazios.tsx)) | **muda apenas visualmente** | a linguagem ("Comparar é opcional — muita gente prefere ler um por um") é exemplar; perde a moldura de cartão vazio e vira uma frase com ar |
| `FinalCuradoriaView` ([final-curadoria-view.tsx](../../src/components/patient/final-curadoria-view.tsx)) | **muda de posição** | formato do motor ACE legado. Quando a Curadoria do Método existe, hoje os dois aparecem em sequência com o mesmo peso — dois relatórios da mesma decisão. Recua para o fim da travessia como documento histórico ("seu relatório entregue em {data}"), junto do PDF; quando é a única entrega existente, permanece onde está. Render condicional já existente; nenhuma condição muda |
| `ConnectionChoicePanel` ([connection-choice-panel.tsx](../../src/components/patient/connection-choice-panel.tsx)) | **muda apenas visualmente** | as duas etapas (escolher → revisar) e a correção em `DECISAO_REGISTRADA` são exatamente a Sala da Decisão. Ganha o vazio, o limiar de entrada e o silêncio pós-confirmação |
| `ConnectionProgressPanel` ([connection-progress-panel.tsx](../../src/components/patient/connection-progress-panel.tsx)) | **permanece** | linguagem já auditada pelo Contrato Operacional (declarações dela, nunca promessas). Recebe apenas a luz doméstica da varanda |
| `ContactModePanel` ([contact-mode-panel.tsx](../../src/components/patient/contact-mode-panel.tsx)) | **permanece** | nenhum modo pré-selecionado, nenhuma promessa, marcador honesto de capacidade pendente — o componente já é o contrato em forma de tela |
| `RelationshipStatusPanel` ([relationship-status-panel.tsx](../../src/components/patient/relationship-status-panel.tsx)) | **permanece** | estados oficiais, revisão antes de ato terminal, zero avaliação |
| Link "Baixar em PDF" ([page.tsx:100-109](../../src/app/paciente/curadoria/page.tsx)) | **muda de posição + visualmente** | pertence à Mesa (o Relatório que se leva à família e à consulta — Narrativa §8); hoje flutua no fim absoluto da página com estilo inline próprio em vez do botão oficial (dívida já registrada na Narrativa §9) |

**Nada é fundido nesta página.** As fusões da Narrativa (`prioridades`, `como-funciona`) entram como conteúdo re-abrigado — §9.2 — não como fusão de componentes daqui.

---

# 5 · A travessia

**O mecanismo: a página é um corredor vertical, e o scroll é o caminhar.** Não há navegação, não há páginas, não há wizard — há quatro cômodos em sequência no mesmo endereço, e ela os atravessa com o próprio corpo (o gesto de rolar), no próprio ritmo.

O que faz um empilhamento virar travessia são quatro coisas, todas de percepção:

**Um — os limiares.** Entre um ambiente e o seguinte, o `space-y-8` uniforme dá lugar ao limiar da F4 §11.3 adaptado ao interior da página: **um trecho de superfície quase vazia, maior que qualquer espaçamento interno, contendo apenas o nome do que se entra** — "A Mesa", "A Decisão", "Seu acompanhamento" — em serifa, peso regular. Dentro de um ambiente, os elementos ficam próximos; entre ambientes, longe. A alternância de proporção (apertar antes de abrir — L11) é o que o corpo registra como porta.

**Duas — a luz muda por cômodo.** A F2 §4 já define a progressão: o eco da Sala em temperatura quente e contraste baixo; a Mesa na luz mais neutra e contraste mais alto da casa (comparar exige ver bem); a Decisão de volta ao quente, no contraste mais baixo; a varanda, a mais doméstica. Numa única página, isso é fundo, densidade e valor tipográfico variando por bloco — perceptível no corpo antes de nomeável.

**Três — só um cômodo aceso por vez.** O ambiente onde ela está tem presença plena; os já atravessados **assentam** — permanecem legíveis e alcançáveis (nada fecha atrás dela — L5), mas recuados, sem disputar atenção. A `CartaCaminho` já faz isso dentro da Mesa (uma aberta, as outras recuam); a travessia estende o mesmo princípio aos quatro ambientes.

**Quatro — as portas abrem por conclusão.** Já é o comportamento real do código: o convite só existe depois de `todasConhecidas`; o acompanhamento só existe depois da confirmação; o modo de contato só enquanto `DECISAO_REGISTRADA`. A travessia não inventa gatilhos — **revela os que o domínio já tem**, dando a cada um a forma de porta em vez de forma de "mais um card que apareceu".

Ela deve sentir que caminhou — e a prova é a memória do percurso: ao voltar dias depois, a página reabre com os cômodos atravessados assentados e o cômodo atual aceso (a memória de leitura por `localStorage` e o estado da Connection já garantem isso funcionalmente).

---

# 6 · O ritmo

| Momento | O ritmo |
|---|---|
| **Desacelera** | na entrada (o eco da Sala: prosa, ar, nada clicável) e na boca da Decisão (o maior vazio da página vem imediatamente antes do painel de escolha — F5: a porta precedida do maior vazio da sala) |
| **Acelera** | nunca. O máximo que a página faz é **não retardar**: dentro da Mesa, abrir e fechar cartas responde no tempo de micro-resposta (~120–240ms, F2 §9) — a lentidão é das travessias, não dos gestos |
| **Faz silêncio** | depois da confirmação (o refresh assenta o acompanhamento sem qualquer celebração — o instante mais silencioso da plataforma) e nos estados terminais (zero CTA, uma frase) |
| **Explica** | uma vez por ambiente, na entrada dele: o enquadramento explica a Mesa antes das cartas; a revisão explica o alcance do ato antes da confirmação ("será registrada, e você ainda poderá corrigi-la enquanto não iniciar o contato"); o modo de contato explica cada opção dentro dela. Nunca durante — explicação no meio do gesto é interrupção |
| **Observa** | enquanto ela lê cartas e compara: a página não pergunta, não sugere, não conta visitas, não mede permanência (o Registro da F9 proíbe; a única memória é a de navegação, local, dela) |
| **Convida** | uma única vez: depois da terceira carta conhecida — e o convite não afirma suficiência (§4), apenas abre a porta: não há pressa, nada está pré-escolhido |

---

# 7 · O storyboard

Cena a cena, da entrada à saída. Sem desenho — só o que ela vê e sente.

**Cena 1 — A porta, no corredor.** Em `/paciente`, o `CuradoriaCard` diz numa frase em que momento ela está e oferece uma porta: "Acompanhar". Ela atravessa.

**Cena 2 — O eco da Sala.** A página abre em prosa, não em painel: o nome do Curador, a frase dele sobre como compôs os três (`compositionRationale`), e o reenquadramento — os três são legítimos, a ordem é de apresentação. Ao lado do texto, ar. Nada pisca, nada pede. Ela lê no tempo dela.

**Cena 3 — O limiar da Mesa.** Um trecho quase vazio com um nome. A luz esfria um passo; o contraste sobe. Ela sente que entrou na sala de trabalho.

**Cena 4 — As três cartas, fechadas.** Três presenças com o mesmo peso: retrato tipográfico, nome em serifa, e a frase do Curador sobre por que este caminho está aqui. Nenhum número, nenhuma ordem que não seja a de apresentação. Se ela já esteve aqui, um sussurro: "Você já conheceu este caminho."

**Cena 5 — Uma carta aberta.** Ela abre; o resto recua. Dentro, na ordem: como responde ao Perfil dela — cada dimensão em frase com sua textura de linha (§9.3) —, o que encontramos, o que merece atenção (mesmo destaque: assimetria de entusiasmo é indução — comentário real do código), perguntas para a próxima conversa, a leitura completa. Ela fecha, abre outra. Volta quantas vezes quiser.

**Cena 6 — A comparação, se ela quiser.** Uma frase com ar diz que comparar é opcional. Se ela marcar duas ou três, vê uma dimensão de cada vez, os caminhos lado a lado dentro dela — a pergunta é "o que muda nisto que me importa", nunca "quem ganha".

**Cena 7 — A porta da Decisão.** Conhecida a terceira carta, um convite aparece — sem fanfarra, no fim da Mesa: não há pressa, nenhum caminho está pré-escolhido. Abaixo dele, o maior vazio da página. Quem rola adiante atravessa; quem fecha a página não perde nada.

**Cena 8 — A Sala da Decisão.** O cômodo vazio: três nomes com o mesmo peso, e mais nada. A informação parou de crescer — as cartas assentaram lá atrás. Ela marca um nome; a revisão diz o que o ato alcança e a única verdade de reversibilidade que existe. Ela confirma — ou volta, ou sai. As três saídas valem o mesmo.

**Cena 9 — O silêncio.** A confirmação assenta. Nenhum parabéns, nenhum verde de sucesso. A página simplesmente continua — e onde estava a escolha, agora está o nome: "Você escolheu seguir com {nome}."

**Cena 10 — A varanda.** O acompanhamento: o que ela pode registrar quando decidir dar o próximo passo, no tempo dela. Como quer começar — duas formas, nenhuma pré-marcada, com honestidade sobre o que a Aliviar ainda não faz. Quando o primeiro atendimento acontece e ela o declara, o acompanhamento ativo aparece com a mesma calma.

**Cena 11 — A saída.** No fim, o Relatório para levar — "Baixar em PDF" — e, se houver entrega legada, o documento histórico dela, com a data. Ela fecha a página sabendo que tudo continua ali, no mesmo lugar, aberto.

---

# 8 · Storyboard → componentes reais

Nenhum componente inventado; todos existem no RC1.

| Cena | Componente atual | Ambiente | Novo papel | Mudança visual necessária |
|---|---|---|---|---|
| 1 | `CuradoriaCard` (`paciente/experiencia/curadoria-card.tsx`) | corredor | a porta da travessia | nenhuma estrutural; linguagem de porta ("Acompanhar" já serve) |
| 2 | cabeçalho do `CaminhosPanel` (`PatientCard` + `compositionRationale`) | Sala Particular (eco) | a voz do Curador que enquadra | de cartão para prosa serifada com ar; sem moldura de painel |
| 3, 7 | — (vazio estrutural; nenhum componente) | limiares | porta entre ambientes | espaço + nome do ambiente; é diagramação, não componente novo |
| 4 | `CartaCaminho` fechada + `Retrato` | Mesa | as pessoas, antes da estrutura | mesmo peso entre as três; sussurro de memória discreto |
| 5 | `CartaCaminho` aberta (`BarraCompatibilidade` → frase+linha; chips → texto com ar) | Mesa | o Caminho — leitura vertical de um profissional | §9.3; chips deixam de ser contáveis |
| 6 | `ComparacaoNaoIniciada` / `ComparacaoCaminhos` | Mesa | a Correspondência — leitura horizontal opcional | seletor sem aparência de abas; células em frase+linha |
| 7 | convite pós-`todasConhecidas` (`PatientCard variant="note"`) | limiar da Decisão | a porta que espera | linguagem sem veredito de suficiência (§4); seguido do maior vazio da página |
| 8 | `ConnectionChoicePanel` (etapas `choosing`/`reviewing`) | Sala da Decisão | o ato — escolher, rever, confirmar | vazio de 70%; três nomes com o mesmo peso; nada mais visível |
| 9–10 | `ConnectionProgressPanel` + `ContactModePanel` | Acompanhamento | a continuidade nomeada | luz doméstica; silêncio pós-confirmação; nenhuma mudança de conteúdo |
| 10 | `RelationshipStatusPanel` | Acompanhamento | o acompanhamento vivo | idem |
| 11 | link "Baixar em PDF" + `FinalCuradoriaView` (quando houver) | fim da travessia | o documento que se leva; o histórico | botão oficial em vez de estilo inline; legado recuado como registro datado |
| (sem entrega) | `PatientEmptyState` | — | a espera dita em palavras | nenhuma |

---

# 9 · Resposta aos três achados da Etapa 1

## 9.1 Quatro ambientes → uma travessia percebida

Já respondido em §5, e o essencial é: **a página não precisa de telas novas porque o domínio já sequencia os ambientes por estado** — `todasConhecidas` abre a Decisão, a confirmação abre o Acompanhamento, `DECISAO_REGISTRADA` mantém o modo de contato. O que falta é forma: limiares com nome entre os blocos, luz e densidade próprias por bloco, um cômodo aceso por vez com os demais assentados, e o vazio como material de fronteira. Nenhum estado muda; a percepção deles muda.

## 9.2 Endereço para `prioridades` e `como-funciona`, sem telas novas

Os dois conteúdos hoje sem endereço (o 301 de `/portal-paciente/:path*` aponta tudo para `/paciente`) são re-abrigados em telas que já existem:

- **`prioridades`** (as zonas de importância, já sem números — ADR-042): entra no **eco da Sala Particular, no topo desta travessia**. É o lugar natural por dependência: a Mesa só faz sentido lida contra as prioridades dela, e a Narrativa já mapeou o conteúdo para a Sala Particular. A superfície existente que o recebe é o bloco de enquadramento (Cena 2) — as prioridades na ordem e na voz dela, precedendo as cartas. O componente de origem (`portal-paciente/prioridades` sobre `PatientCard variant="note"`) já renderiza exatamente isso; muda o endereço onde é montado, não o que faz.
- **`como-funciona`** (os 6 passos, quem faz o quê, as três coisas que nunca mudam): entra no **corredor — `/paciente`** —, como o detalhe expandido do `JourneyWalk`, que já mostra a caminhada por etapas com o detalhe da etapa corrente. O conteúdo de "o que acontece em cada etapa e quem faz" é a explicação que o `JourneyWalk` já quase dá; re-abrigar ali completa a peça sem criar tela.

Nenhuma tela nova, nenhuma rota nova, nenhum conteúdo perdido. A remoção física das rotas legadas continua sendo decisão de engenharia fora deste documento.

## 9.3 Eliminar "compatibilidade" como medida

**O problema, com precisão:** `BarraCompatibilidade` renderiza dez traços com preenchimento em degraus — `PLENO: 10, PARCIAL: 6, A_CONFIRMAR: 0, NAO_ATENDE: 1` ([experiencia.ts:195-200](../../src/modules/paciente/experiencia.ts)). O próprio componente confessa a tensão nos comentários ("representação visual, jamais medida… é ele [o estado por extenso] que informa") — mas dez marcas contáveis com quantidades diferentes **são** magnitude aos olhos, e magnitude é nota (F1 P5; F2 R5/R6: "nada repetido, contável ou empilhável representa qualidade; cor nunca codifica correspondência — textura de linha, sim").

**A substituição, pela linguagem já aprovada** (F2 §11.3 — a gramática do Mapa de Correspondência):

| Estado real do dado (`CompatibilityLevel`) | Hoje (barra) | Passa a ser |
|---|---|---|
| `PLENO` — "Atende plenamente" | 10 traços verdes | frase específica do profissional + **linha contínua** sob a frase |
| `PARCIAL` — "Atende parcialmente" | 6 traços | frase **com a condição dita nela** + **linha tracejada** |
| `A_CONFIRMAR` — "Ainda precisamos confirmar" | 0 traços | frase com a mesma dignidade ("ainda não foi possível confirmar") + **linha pontilhada** — presente, com outra textura; nunca vazio |
| `NAO_ATENDE` — "Não atende" | 1 traço | frase **descritiva e ancorada na prioridade dela** ("não atende essa situação e encaminha" — fato, não defeito) + **linha ausente ou pontilhada conforme o caso**, nunca cor de alerta |

Por que textura e não quantidade: contínuo, tracejado e pontilhado são **diferenças de natureza, não de magnitude** — ninguém intui que tracejado "vale menos", e ninguém totaliza tracejados (F2 §11.3). A informação transportada é idêntica: os mesmos quatro estados, as mesmas frases por extenso que hoje já são o canal principal. **Nenhum dado, tipo ou regra muda** — `COMPATIBILITY_LEVELS`, o Motor e o domínio ficam intactos; muda a forma de dizer.

**E a palavra.** "Compatibilidade" é vocabulário do Método (F1: a língua dela nunca encontra a língua do Método) e ecoa "match %". Nas superfícies dela, o cabeçalho que já existe — **"Como responde ao seu Perfil"** — é a formulação correta e suficiente; a palavra "compatibilidade" não aparece em nenhum texto visível da paciente. Nomes internos de código (`BarraCompatibilidade`, `COMPATIBILITY_*`) são domínio da engenharia e ficam fora do escopo desta etapa.

---

# 10 · A matriz final

| Ambiente | Estado emocional | Pergunta da paciente | Componentes existentes | Mudanças de percepção | Resultado esperado |
|---|---|---|---|---|---|
| **Sala Particular** (eco) | reancoragem | *"isto ainda é sobre mim?"* | enquadramento do `CaminhosPanel`, conteúdo de `prioridades` re-abrigado | de cartão para prosa; prioridades dela antes das cartas; nada clicável | ela entra na Mesa com o próprio critério na mão |
| **Mesa de Comparação** | clareza sem pressão | *"qual é a diferença entre eles?"* | `CartaCaminho`, `Retrato`, `ComparacaoCaminhos`, `ComparacaoNaoIniciada` | limiar nomeado; luz honesta; frase+textura no lugar da barra; chips viram texto; seletor sem cara de abas | *"entendi a diferença, e nenhum me pareceu pior"* |
| **Sala da Decisão** | autonomia sem solidão | *"posso decidir? é meu direito?"* | convite, `ConnectionChoicePanel` | maior vazio da página antes da porta; convite sem veredito; 70%+ de vazio; Mesa assentada; silêncio após confirmar | *"eu decidi. Ninguém decidiu por mim"* — ou *"vou pensar mais, e nada se perdeu"* |
| **Espaço de Acompanhamento** | continuidade | *"estou sozinha de novo?"* | `ConnectionProgressPanel`, `ContactModePanel`, `RelationshipStatusPanel`, PDF, `FinalCuradoriaView` recuado | luz doméstica; alternativas fora de cena (nunca da história); prazo nenhum; nome sempre presente | *"sei o que aconteceu, o que ainda não aconteceu, e quem está comigo"* |

---

# 11 · O que ela sentirá de diferente

Nenhuma regra do sistema muda — nenhum estado, nenhuma transição, nenhuma permissão, nenhum dado. E ainda assim:

**Hoje**, ela abre `/paciente/curadoria` e encontra uma página com painéis empilhados a 32px uns dos outros: um cartão de título, três cards, uma comparação, um convite, um formulário de escolha, painéis de status — tudo com o mesmo peso, tudo aceso ao mesmo tempo, quatro momentos da vida dela apresentados como seções de um documento administrativo. A informação certa está toda lá; a experiência diz "sistema".

**Depois**, ela abre a mesma página e **caminha**. Primeiro reencontra o próprio caso, na voz do Curador e na dela. Atravessa um limiar com nome e entra numa sala de trabalho de luz honesta, onde conhece três pessoas — uma por vez, no ritmo dela, sem nenhum número medindo ninguém. Quando conheceu as três, uma porta aparece — porque ela concluiu algo, não porque clicou em "próximo". Do outro lado, um cômodo quase vazio onde só existe a escolha dela, e a única frase de reversibilidade que é verdadeira. Ela confirma, e nada aplaude: a casa simplesmente continua, e onde havia três nomes agora há um — o dela e o de quem segue junto.

A diferença que ela sentirá tem nome na Narrativa: **deixa de ser uma página que ela usa e passa a ser um lugar onde ela esteve.** O mesmo domínio, as mesmas regras, os mesmos dados — sentidos como travessia, não como sistema. E se alguém lhe mostrar a tela por três segundos e perguntar o que é, a resposta certa deixa de ser "um painel de saúde" e passa a ser "não sei… parece o documento de um consultório que preparou algo para mim" — que é exatamente o teste do estranho que o Sistema Visual exige.

---

> **Próxima etapa natural:** dar forma ao que aqui é percepção — luz, limiares e diagramação por ambiente — na ordem de dependência da F4 §15. Este documento é o contrato: qualquer desenho que contradiga uma linha da travessia volta para cá antes de ir para a tela.
