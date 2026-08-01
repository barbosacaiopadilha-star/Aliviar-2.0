# A Linguagem dos Ambientes — Projeto Experiência Visual · Etapa 3

> **Status:** a gramática oficial da Aliviar. Como a plataforma fala, escuta, conduz e silencia. Nenhuma tela será desenhada antes desta gramática, e nenhum texto novo poderá contrariá-la.
> **Fontes de verdade obrigatórias:** [NARRATIVA_DA_EXPERIENCIA.md](./NARRATIVA_DA_EXPERIENCIA.md) (Etapa 1) · [TRAVESSIA_DA_PACIENTE.md](./TRAVESSIA_DA_PACIENTE.md) (Etapa 2) · todos os documentos congelados F1–F9C.1, incluindo as regras L1–L14 (Lugar), R1–R18 (Sistema Visual), N1–N10/O1–O9 (Decisão→Mesa), SD-N1..N12 (Sala da Decisão) e os vocabulários da F1 e da Dramaturgia §10.
> **Não altera:** domínio, banco, Motor, Curadoria, Connection, Relationship, RLS, regras, estados, fluxos. Nenhuma implementação.
> **Data:** 2026-08-01

---

# 2 · A voz da Aliviar

**Quem fala.** Duas vozes, e apenas duas — a distinção é a R3, e é moral antes de ser tipográfica:

- **Uma pessoa** — o Curador, com nome e rosto; e a própria paciente, cujas palavras voltam intactas. Tudo o que uma pessoa escreveu aparece em serifa e leva autoria. *"Ninguém se sente ouvido por uma instituição"* (F3 §4.1.7).
- **A casa** — a função que organiza: rótulos, portas, estados, datas. Sem-serifa, sem personalidade, sem "nós" emotivo. A casa nunca finge ser gente: *"estamos com você nessa jornada!"* destrói confiança (F3 §10).

**Quando fala.** Na entrada de cada ambiente (uma vez, para nomear e enquadrar — Travessia §6: "explica uma vez por ambiente, na entrada dele"); quando a dúvida nasce (quem lê a história dela é dito no momento exato em que ela vai escrever — F3 §3); quando algo que ela fez precisa de eco (o rascunho guardado, a escolha registrada); e quando o difícil precisa ser dito (ausência, limitação, encerramento — sempre como fato, nunca como defeito).

**Quando deixa de falar.** Quando algo importante está acontecendo. A regra da Dramaturgia §9 é literal: *a Aliviar só fala quando não está atrapalhando* — nunca enquanto ela escreve, lê a carta, está na Mesa ou decide.

**Quem nunca fala.** O Método (subcritério, matriz, Motor, catálogo — *"a língua dela nunca encontra a língua do Método"*, F1 P12). O sistema como personagem ("processando", "operação realizada"). A urgência. O julgamento — de médicos, de escolhas, de prontidão, de emoção. E "a equipe": **todo estado nomeia um papel, e o papel tem nome de pessoa** (F9C.1 D-C1).

**A plataforma explica?** Sim — uma vez, na entrada, antes do gesto. Nunca durante, nunca depois como justificativa.
**Convida?** Sim — abrindo portas, nunca empurrando. O convite existe porque algo se concluiu (L3), e não carrega imperativo.
**Afirma?** Só o que tem autoridade verificável (contrato 9B: nomeia **quem**, nunca **quando**; diz o que sabe, como sabe, e admite o que não sabe).
**Pergunta?** Sim — e é seu gesto mais nobre: a carta termina com a dúvida honesta do Curador (F3 §4.3). Mas nunca pergunta retórica, nunca "tem certeza?", nunca pergunta que vigia ("já decidiu?").
**Espera?** Sempre que a próxima ação é dela. *A plataforma nunca avança sozinha depois de um momento emocional* (F3 §9) — e a espera é dita em palavras, com conteúdo, nunca com barra (R16).

---

# 3 · Os quatro modos de linguagem

Toda frase da plataforma está em exatamente um destes modos. Não existem outros.

## Acolhe

- **Objetivo:** devolver o momento dela, para que se sinta vista — nunca consolada, nunca vendida.
- **Tom:** sóbrio, segunda pessoa, sem empatia performática. *"Acolhe porque devolve, não porque consola"* (F3 §10).
- **Ritmo:** o mais lento; frases curtas com muito ar antes e depois.
- **Quantidade:** mínima — uma a três frases. O acolhimento não discursa.
- **Jamais aparece:** promessa, argumento, número, imperativo, "estamos juntos", explicação do Método, qualquer pedido.
- **Onde vive:** Entrada, abertura da Recepção, estados vazios ("Ainda não há relatórios aqui… para reler com a família ou levar à consulta"), o eco da Sala.

## Explica

- **Objetivo:** dizer o que vai acontecer, quem faz e quem vê — antes do gesto, para que ela aja sabendo.
- **Tom:** preciso e honesto sobre os próprios limites: *"confiança se constrói com precisão sobre os limites do próprio conhecimento"* (F3 §10). Voz da casa, exceto quando é o Curador explicando o caso — aí é carta.
- **Ritmo:** um bloco por ambiente, na entrada. Nunca em série, nunca em tooltip, nunca atrás de hover (R17).
- **Quantidade:** o suficiente para uma decisão informada — e nada além; se retirar 30% não piora, retire (F2 §13.2.7).
- **Jamais aparece:** antecipação de fato ("o Curador foi avisado" — bloqueada por 9B), prazo, capacidade que não existe, resposta a pergunta que ainda não surgiu (§5).
- **Onde vive:** o enquadramento da Mesa, as quatro verdades antes da confirmação, as opções de modo de contato, "quem vai ler sua história".

## Confirma

- **Objetivo:** ecoar um ato dela — nunca aprová-lo. A confirmação é espelho, não aplauso.
- **Tom:** declarativo, no passado ou no presente do registro: *"É assim que está registrado."* ([contact-mode-panel.tsx:109](../../src/components/patient/contact-mode-panel.tsx)) — a frase-modelo do modo inteiro.
- **Ritmo:** imediato e curto; depois dele, silêncio.
- **Quantidade:** uma frase. Duas, se o alcance do ato precisar ser redito.
- **Jamais aparece:** celebração, elogio ("ótima escolha" declara que existia certo e errado — F9), verde de sucesso (R2), "com sucesso", segunda confirmação (SD-N: nunca pedir confirmação duas vezes), qualquer avanço automático.
- **Onde vive:** revisões antes de ato ("Você está confirmando que…"), ecos pós-ato ("Você escolheu seguir com {nome}"), o indicador de rascunho guardado.

## Silencia

- **Objetivo:** devolver o ritmo a ela. O silêncio não é ausência de conteúdo — é o conteúdo (F1 P9: o vazio é conteúdo).
- **Tom:** nenhum.
- **Ritmo:** o dela.
- **Quantidade:** zero texto — ou o mínimo que uma superfície exige (um nome, uma data, na margem).
- **Jamais aparece:** preenchimento por ansiedade nossa, sugestão "aproveite para…", notificação, badge, qualquer som (L12).
- **Onde vive:** §4.

---

# 4 · O silêncio

*A seção que orienta toda a plataforma.*

**Quando parar de explicar.** No instante em que a explicação vira justificativa — isto é, depois que as opções apareceram (F4 §7: "depois que as opções aparecem, explicar soa a justificativa") e depois que o ato foi praticado. Explicação é porta de entrada; dentro do ambiente, ela já cumpriu seu papel.

**Quando apenas mostrar.** Sempre que o conteúdo é dela ou sobre ela: a história, a carta, o Mapa, os retratos, a frase que escreveu. Conteúdo emocional não divide a tela com instrução (F2 §10.2) — a moldura se cala para o conteúdo falar.

**Quando deixar pensar.** Sob toda decisão: o espaço abaixo de uma escolha fica vazio, porque *preencher ali é empurrar* (F2 §10.1). Na Mesa entre visitas — ela não busca mais informação, está processando (F3 §9). E diante do convite à Decisão: depois dele, o maior vazio da página (Travessia §6).

**Quando desaparecer.** Durante a leitura da carta — *a única tela da plataforma em que nada mais existe* (F6): sem menu, sem barra, sem Concierge. Depois da confirmação — a casa continua sem dizer nada. E nos estados terminais — uma frase, nenhum CTA, nenhuma sugestão de próximo passo.

**Quando nunca interromper.** A regra síntese da Dramaturgia: **enquanto ela escreve, enquanto lê, enquanto compara, enquanto decide** — ou seja, sempre que algo importante está acontecendo. Nenhuma novidade invade: espera ser encontrada (F4 §9). Nenhum autosave ruidoso, nenhuma dica durante a escrita, nenhum "você ainda está aí?".

**A prova do silêncio bem projetado** é a mesma do Concierge (F4 §10): *saber quando não falar é a prova de que alguém acompanha bem.* Uma tela que fala o tempo todo é uma tela que não está escutando.

---

# 5 · As perguntas — e a regra de nunca antecipá-las

**A regra:** a interface nunca responde perguntas que ainda não surgiram. Responder cedo demais é ruído na melhor hipótese e sugestão de problema na pior (quem explica "você está segura" instala a dúvida — F3 §3). A resposta certa aparece **no instante em que a pergunta nasce** — nem antes, nem atrás de um link.

| Ambiente | Na cabeça da paciente | Na cabeça do Curador | Na cabeça do Concierge |
|---|---|---|---|
| **Entrada** | *"posso confiar neste lugar?"* | — (ainda não há caso) | — |
| **Recepção** | *"alguém sabe que eu cheguei? quem vai ler isto?"* | *"o que ela está me contando — e o que quase não disse?"* | — (a Recepção conduz; o corredor ainda não existe para ela) |
| **Sala Particular** (com a antessala do Encontro) | *"alguém entendeu o que está acontecendo comigo? isto ainda é sobre mim?"* | *"entendi certo? o que não ficou claro para mim? ela respondeu minha dúvida?"* | *"ela está há muito tempo sem conseguir atravessar?"* — do corredor, sem entrar (F6: durante o Encontro, o Concierge não existe) |
| **Mesa de Comparação** | *"qual é a diferença entre eles — e do que abro mão em cada um?"* | *"o que escrevi permite a ela formular o trade-off?"* (a Mesa dele já fechou; agora ele responde dúvidas — porta "tenho uma dúvida sobre eles", F7) | *"ela precisa de companhia, não de dado?"* — a porta "quero conversar", nunca rotulada como ajuda (F7) |
| **Sala da Decisão** | *"posso decidir? é meu direito? o que acontece depois?"* | *"o que ela decidiu?"* — depois, como leitor (9B: só a paciente age; ele lê) | nada — o Concierge não entra na Sala (F4 §10: silêncio respeitoso) |
| **Acompanhamento** | *"estou sozinha de novo? o contato está andando?"* | fechamento, não despedida (F7) | *"preciso perguntar a ela?"* — acompanhar é perguntar a uma pessoa, nunca observar comportamento (D-C5); pergunta uma vez e não insiste (10E D-7) |

Duas consequências práticas: a reversibilidade só é dita **na revisão da escolha** (onde a pergunta "e se eu mudar de ideia?" nasce), nunca na Mesa; e o modo de contato só é perguntado **depois** da decisão registrada — perguntar antes seria responder a uma pergunta que não existe.

---

# 6 · Vocabulário

Consolidação dos vocabulários congelados (F1, F3 §10, F9, 9B, 9C.1). Nada aqui é invenção desta etapa.

## A — Palavras e frases obrigatórias

Quando o assunto surge, é assim que se diz — sem variação criativa:

| Situação | Formulação obrigatória | Fonte |
|---|---|---|
| Ausência de informação | **"ainda não foi possível confirmar"** | F1/F3 — nunca "não informado", que soa a falha de alguém |
| A espera pela leitura | **"[Nome] está lendo sua história."** | F3 §4.1.6 — pessoa, nunca processo |
| Quem cuida | **o nome próprio** do Curador/Concierge | D-C1 — "a equipe cuidará" é proibida em qualquer superfície |
| As opções | **"três caminhos"** / "os três são legítimos" | F1 — nunca "opções de médicos", nunca "resultados" |
| A reversibilidade | **"você pode corrigi-la enquanto não tiver iniciado o contato"** | 9B — a única frase de reversibilidade verdadeira; "a decisão é reversível" sem condição é bloqueada |
| A autoria da decisão | **"a escolha é sua"** + nenhum caminho pré-escolhido | F7/SD |
| O tempo | **"não há pressa"** / "no seu tempo" | F3 — e nenhuma frase com prazo, jamais |
| Recebimento da história | **"Recebemos sua história."** | status_label real do RC1 — já correta |
| Limitação de um profissional | fato descritivo ancorado na prioridade dela (*"não atende essa situação e encaminha"*) | F3 §10 — fato, não defeito |

## B — Palavras permitidas

A língua comum da casa, na voz certa: *caminho · escolha · decisão · história · carta · relatório · curadoria (nome do serviço) · prioridades · acompanhamento · contato · conhecer · comparar (verbo dela, nunca substantivo-ferramenta) · corrigir · registrar · reler · atende plenamente / atende parcialmente · o que encontramos · o que merece atenção · perguntas para a próxima conversa · quem cuida do seu caso · sua resposta · sua frase.*

## C — Palavras proibidas nas superfícies dela — com justificativa

| Proibição | Por quê |
|---|---|
| **melhor · ideal · recomendado · top · premium · indicado para você** | instala o ranking que o Método inteiro existe para impedir (F1); "não existe melhor médico" é fundação, não estilo |
| **score · nota · pontos · ranking · match · % de compatibilidade** | converte pessoas em placar; uma única aparição destrói o Método na percepção (F2 §5.3) |
| **compatibilidade** (como medida ou palavra visível) | vocabulário do Método e eco de "match"; a formulação dela é "como responde ao seu Perfil" (Travessia §9.3) |
| **pronto/pronta para decidir · "você já tem o que precisa" · qualquer declaração de suficiência** | a plataforma nunca julga prontidão — o sinal de suficiência é dela (F7; A_MESA §7; achado E2 da Travessia) |
| **você deve · escolha agora · não perca · aproveite** | imperativo e escassez são a frase que acelera (F3 §10); urgência artificial em decisão de saúde é violência comercial (F7) |
| **subcritério · eixo · matriz · motor · catálogo · evidência · verificação · divergência · grau · importância (como nível)** | a língua do Método nunca atravessa a porta (F1 P12; F3 §4.2) |
| **processando · aguarde · carregando · operação realizada com sucesso · sistema · plataforma · algoritmo** | nenhum humano fala assim olhando nos olhos (F3 §10 — o teste da voz alta) |
| **não informado** | põe a falha em alguém; a ausência é do processo ("ainda não foi possível confirmar") |
| **a equipe · nosso time cuidará** | responsabilidade sem rosto; todo papel tem nome (D-C1) |
| **o Curador foi avisado · responderemos em X · em breve · qualquer frase com "quando"** | promessas sem autoridade — aviso ≠ visibilidade; nenhum prazo existe (9B; 10E D-2/D-3) |
| **garantido · reservado · confirmado (em nome do profissional) · ele está te esperando · está tudo certo** | verbos de garantia sobre agenda que não existe (9B F9: não há tabela de agenda); resposta de profissional nunca é dita como "aceito" (9C.1) |
| **ótima escolha · excelente decisão · parabéns** | elogiar a escolha declara que existia certo e errado (F9 SD-N); celebrar transforma compreensão em conquista de produto (F3 §4.3) |
| **perfil 60% completo · faltam 2 passos · complete seu cadastro** | contagem é cobrança; completude é conceito nosso, não dela (F3 §3) |
| **paciente** (dirigido a ela) · **usuário** | ninguém é sua patologia nem seu login; fala-se com ela pelo nome (F1) |
| **contratar · adquirir · plano · pedido** | gramática de compra; ninguém adquire um profissional — começa com uma pessoa (F7 N10) |
| **pendente** (sobre decisão dela) · **indecisa · insegura · em risco de desistência** | "decisão pendente" cobra; rótulos emocionais são registro proibido (F9 §7) |
| **erro** (sobre ato dela) · "você não respondeu" | a incompletude é sempre do processo: "ainda não conversamos sobre isso" (F6) |

---

# 7 · O ritmo

- **Quando acelerar: nunca.** O máximo permitido é não retardar — a micro-resposta ao toque dela é imediata (~120–240ms de percepção, F2 §9), porque lentidão no gesto dela seria a casa atrapalhando. A lentidão é das travessias, não das respostas.
- **Quando desacelerar.** Em toda travessia de ambiente (o dobro de qualquer movimento interno — R12); na Entrada (o único lugar atravessado mais devagar do que ela gostaria — F4 §4); e antes de qualquer ato com consequência (a revisão existe para desacelerar sem proibir).
- **Quando respirar.** No limiar entre ambientes (meio segundo de superfície limpa com o nome do que se entra — L4); depois de cada resposta dela na Recepção (a resposta anterior confirmada antes da próxima pergunta — F3 §3); e sob toda escolha (o vazio abaixo é a respiração).
- **Quando celebrar: nunca.** Não existe celebração na Aliviar — nem confete, nem "perfeito!", nem checkmark verde, nem tela de parabéns (F3 §4.3; F8 §15; SD). O que outro produto celebraria, aqui **assenta**: o reconhecimento acontece e o ambiente fica quieto; a decisão registra e a casa continua.
- **Quando não celebrar, dito de outro modo:** especialmente nos dois momentos em que toda plataforma celebra — o fim do cadastro e a conversão. Aqui o primeiro é "Recebemos sua história" (um recebimento, não uma conquista) e o segundo é o silêncio da Cena 9 da Travessia.

---

# 8 · Os estados reais, na língua dela

Todos os estados abaixo existem no RC1; nenhum é novo. A regra transversal: **o estado técnico nunca é exibido — a frase humana correspondente, sim.** E as quatro âncoras (nome dela, Curador, história, percurso — L7) permanecem em todos.

| Estado real (domínio) | O que muda visualmente | O que muda linguisticamente | O que permanece |
|---|---|---|---|
| História em rascunho (`patient_stories` em curso) | o passo atual do wizard aceso; traços de progresso sem número | perguntas uma a uma; "o texto é seu até que envie" quando a dúvida nasce | o rascunho dela, guardado e dito guardado |
| História enviada (`enviada`) | a Recepção assenta; a espera vira conteúdo | **"Recebemos sua história."** → **"[Curador] está lendo sua história."** | a história intacta, relegível |
| Perfil aguardando reconhecimento | a carta presente, o centro ainda não assentado | a dúvida do Curador em aberto; três respostas possíveis com o mesmo peso | a carta — que nunca expira nem cobra |
| Perfil `RECONHECIDO` | o centro assenta; nada celebra | a conversa continua; nenhum "parabéns" | a carta e a correção dela, lado a lado, para sempre |
| Relatório entregue (`delivered_at`) | a travessia inteira passa a existir | o enquadramento na voz do Curador; "os três são legítimos" | as prioridades dela como régua de tudo |
| Leitura dos caminhos (memória local) | carta aberta acende, as demais recuam; "você já conheceu" sussurra | descrição, nunca veredito | a ordem de apresentação — imutável e dita como tal |
| Três caminhos conhecidos (`todasConhecidas`) | a porta da Decisão passa a existir, precedida do maior vazio | convite sem suficiência: "não há pressa, nenhum está pré-escolhido" | a Mesa inteira, revisitável |
| `DECISAO_REGISTRADA` | a Mesa assenta; o nome escolhido ocupa o presente | "Você escolheu seguir com {nome}" + a única reversibilidade verdadeira + "como você quer começar" (nenhum modo pré-marcado) | os outros dois alcançáveis (corrigir reabre tudo); a frase dela |
| `CONTATO_INICIADO` | a correção desaparece (a janela fechou — por ato dela) | "Você registrou que iniciou o contato" — declaração dela, ecoada como dela | o nome, o percurso, nenhum prazo |
| `PRIMEIRO_ATENDIMENTO_REALIZADO` + Relationship `ATIVO` | a varanda plena; zero CTA no marco | "o primeiro atendimento foi confirmado" · "seu acompanhamento está ativo" | tudo que veio antes, aberto (L5) |
| `ENCERRADO_SEM_RELACIONAMENTO` | estado terminal quieto | "encerrado sem início de acompanhamento" — sem julgamento, sem nova Curadoria automática | a história completa; a escolha não é apagada |
| Relationship `ENCERRADO` | idem | "registrado como encerrado" — o motivo vive no evento, não na tela | idem |
| `NONE_OF_THEM` (nenhum dos três) | nenhuma tela de falha | a resposta é uma pergunta — "o que faltou?" — nunca uma oferta de mais três (F7) | a dignidade de primeira classe do desfecho |

---

# 9 · Os componentes, segundo a gramática

Um papel principal por componente — todos reais no RC1:

| Papel | Componentes |
|---|---|
| **Fala** (acolhe/explica na voz certa) | `HeroEditorial` e seções editoriais · `AmbientHero` · o enquadramento do `CaminhosPanel` (voz do Curador) · `PatientEmptyState` / `SemCuradoria` / `ComparacaoNaoIniciada` (a espera dita em palavras) · `FormMessage` (diz o difícil como fato) |
| **Escuta** | o wizard inteiro (`StoryStepLayout`, `Textarea`, `Radio`, `StoryAttachments`) · `PatientProfileForm` · `PatientDocumentsPanel` · `ConnectionChoicePanel` em `choosing` (*"nunca decide, apenas coleta a decisão já tomada"* — comentário real do código) · `ContactModePanel` |
| **Mostra** (conteúdo dela, moldura calada) | `CartaCaminho` · `Retrato` · `ComparacaoCaminhos` · `ProfileCard` · `JourneyWalk` · `JornadaTimeline` · `PatientStatusWidget` · `StoryNarrative` · `FinalCuradoriaView` |
| **Confirma** (eco sem aplauso) | a etapa `reviewing` do `ConnectionChoicePanel` · as revisões do `ConnectionProgressPanel` e do `RelationshipStatusPanel` · `AutosaveIndicator` (o eco mais discreto da casa) |
| **Observa** (presente sem falar) | a memória de leitura do `CaminhosPanel` (localStorage — observa sem transmitir: o servidor não sabe o que ela leu) · `StoryConflictBanner` (só fala quando há conflito real) |
| **Acompanha** | `ConnectionProgressPanel` · `RelationshipStatusPanel` · a linha do tempo de `/paciente/linha-do-tempo` · `CuradoriaCard` (a porta que sabe em que momento ela está) |

Regra de manutenção: **um componente que precise de dois papéis é dois componentes** — a ambiguidade de papel é o primeiro passo da deriva para dashboard (F2 §13).

---

# 10 · Microtexto — os princípios

Regras, não textos. Todo texto novo é auditado contra elas:

1. **Nunca antecipar fatos.** Só se afirma o que já aconteceu e tem registro ("aviso ≠ visibilidade" — 9B). Teste: *isto já é verdade agora, com autoridade nomeável?*
2. **Nunca prometer prazo.** Nenhuma frase com "quando", "em breve", "logo", horário ou estimativa (D-2/D-3). Nomeia-se **quem**, nunca **quando**.
3. **Nunca declarar suficiência.** "Você já tem o que precisa para decidir" não existe — quem percebe a suficiência é ela (F7).
4. **Nunca elogiar uma escolha.** Nem criticar. O eco é neutro: o que foi registrado, e o que o ato alcança.
5. **Nunca tratar dúvida como erro.** Dúvida vai ao Curador e tem resposta; a interface a acolhe como participação (corrigir "é a melhor resposta possível" — F3 §4.3).
6. **Nunca tratar insegurança como falta de informação.** Insegurança vai ao Concierge e mais informação a **agrava** (F7) — hesitação jamais dispara conteúdo (N4).
7. **Nunca pôr a incompletude nela.** "Ainda não conversamos sobre isso", jamais "você não respondeu" (F6).
8. **Toda frase difícil é fato + dignidade.** Ausência, limitação e encerramento se dizem com a mesma tipografia e o mesmo peso do resto (R8).
9. **Toda promessa carrega autoria.** Se não há pessoa nomeável que sustente a frase, a frase não existe (SD-P: "nenhuma promessa sem autoridade identificável sobrevive").
10. **O teste final é o da voz alta** (F3 §10): leia a frase imaginando o Curador dizendo-a olhando nos olhos dela. Se soa estranho na boca de uma pessoa, está errada na tela.

---

# 11 · Os gestos da plataforma

Como a casa se comporta — sem desenho, sem animação prescrita:

- **Como convida.** Fazendo uma porta existir onde antes havia parede — nunca acendendo um botão. O convite nasce de uma conclusão dela (a terceira carta conhecida), aparece sem fanfarra e **espera**: não expira, não insiste, não repete.
- **Como recebe.** Por preparo prévio: já sabe o nome, não pergunta de novo, o Curador já tem rosto antes de ela agir. *Hotel bom não diz "estávamos te esperando" — tem a chave na mão* (F3 §3).
- **Como espera.** Em palavras, com conteúdo: diz quem está trabalhando ("{Nome} está lendo sua história"), nunca quanto falta. Sem barra, sem spinner, sem skeleton pulsante (R16) — e enquanto espera, oferece algo que vale a pena olhar: o próprio caso.
- **Como confirma.** Em dois tempos — revisão antes, eco depois — e então **assenta**: a superfície aquieta, nada pisca, nada avança sozinho.
- **Como acompanha.** De onde ela sabe encontrá-lo: presença localizada e constante, novidade que espera ser encontrada, memória que não pergunta de novo, e silêncio nos momentos importantes (as quatro evidências do Concierge — F4 §10).
- **Como corrige-se.** Quando ela discorda, a correção dela entra **ao lado** do que havia, com autoria e data — nunca por cima (F5/F6). A casa erra como gente honesta: deixando o erro e a emenda à vista.
- **Como se despede: não se despede.** Nada fecha, nada conclui, nada arquiva (L5). O fim de um ciclo é fechamento com continuidade nomeada — nunca "adeus", nunca "concluído".

---

# 12 · A matriz final

| Ambiente | Modo dominante | Emoção | Pergunta dela | Tom | Silêncio | Vocabulário-chave | Componentes | Resultado esperado |
|---|---|---|---|---|---|---|---|---|
| **Entrada** | Acolhe | desconfiança → respiro | "posso confiar?" | sóbrio, sem venda | quase total — uma frase, muito vazio | o momento dela; nenhum pedido | `HeroEditorial`, editorial, `AuthCard` | atravessar desacelerando |
| **Recepção** | Escuta (explica só na entrada) | cautela → ser esperada | "alguém sabe que cheguei?" | segunda pessoa, permissivo | absoluto enquanto ela escreve | "sua história", "no seu tempo", quem lê | wizard, `AutosaveIndicator`, `PatientProfileForm` | contar tudo, do jeito dela |
| **Sala Particular** (+ antessala) | Fala (carta) e Silencia | vulnerabilidade → "é isso" | "alguém entendeu?" | carta em serifa, dúvida honesta | total durante a leitura; nada mais existe | as palavras dela citadas; "ainda não foi possível confirmar" | carta/`ReconhecerPerfil`, `ProfileCard`, prioridades re-abrigadas | responder, corrigir, assentar |
| **Mesa** | Mostra | tensão → clareza sem pressão | "qual a diferença?" | descritivo, ancorado na voz dela | sem relógio, sem pergunta, sem sugestão | "três caminhos", "o que merece atenção", frase+textura | `CartaCaminho`, `Retrato`, `ComparacaoCaminhos` | "nenhum me pareceu pior" |
| **Sala da Decisão** | Confirma (e Silencia depois) | peso → autonomia | "posso decidir?" | quase silêncio; as quatro verdades | máximo da casa; nada após confirmar | "a escolha é sua", a única reversibilidade verdadeira | convite, `ConnectionChoicePanel` | "eu decidi — ou vou pensar, e nada se perdeu" |
| **Acompanhamento** | Acompanha | apreensão → continuidade | "estou sozinha?" | registro humano, presente | novidade espera ser encontrada | o nome de quem segue; nunca "quando" | `ConnectionProgressPanel`, `ContactModePanel`, `RelationshipStatusPanel`, linha do tempo | "sei quem está comigo" |

---

# 13 · Manifesto — Como a Aliviar conversa

> A Aliviar fala como alguém que preparou a casa antes de você chegar — e que, por isso, não precisa falar muito.
>
> **Duas vozes, nunca misturadas.** Quando uma pessoa escreveu, você vê serifa, nome e data: é gente, e assina. Quando a casa organiza, você vê a função discreta que rotula e se afasta. Nenhuma frase finge: a casa não diz "estamos emocionados", e as pessoas não dizem "operação realizada".
>
> **Fala-se uma vez, na porta.** Cada ambiente explica-se na entrada — o que vai acontecer, quem faz, quem vê — e depois se cala para que o conteúdo (que é dela) ocupe tudo. Nenhuma explicação no meio do gesto, nenhum essencial atrás de hover, nenhuma resposta a pergunta que ainda não nasceu.
>
> **Escuta-se sem interromper.** Uma pergunta por vez. Nenhuma sugestão enquanto ela escreve, nenhum "tem certeza?" enquanto decide, nenhuma cobrança quando demora. A demora não é abandono; o silêncio dela não é desfecho.
>
> **Confirma-se sem aplaudir.** Todo ato dela volta como eco neutro — "é assim que está registrado" — e então a superfície aquieta. Não existe celebração nesta casa: o que outro produto comemoraria, aqui assenta. Elogiar uma escolha seria dizer que havia uma errada.
>
> **O difícil se diz inteiro, com dignidade.** "Ainda não foi possível confirmar." "Não atende essa situação e encaminha." "O contato foi encerrado." Fatos, no mesmo corpo e na mesma tinta de tudo — porque lacuna não é demérito, limitação não é defeito e desistir não é falha.
>
> **Promete-se apenas o que tem nome.** Toda frase sobre o futuro nomeia **quem** — nunca **quando**. Se não há uma pessoa que sustente a promessa, a promessa não existe. E a única reversibilidade que se enuncia é a verdadeira: *enquanto você não tiver falado com ele, pode trocar aqui mesmo.*
>
> **E, sobretudo, sabe-se calar.** Enquanto ela escreve, lê, compara ou decide, a Aliviar desaparece. O vazio em volta do que importa não é espaço sobrando — é a casa segurando a respiração para ela pensar.
>
> Na dúvida, o teste é um só: **leia a frase em voz alta, como se o Curador a dissesse olhando nos olhos dela.** Se soa estranho na boca de uma pessoa, está errada na tela. E se ainda restar dúvida sobre o tom de uma superfície inteira, pergunte o que esta tela faz a pessoa sentir — e só depois, o que ela mostra.

---

*Fim da gramática. Toda interface nova — de qualquer designer, redator ou desenvolvedor — se audita contra os §2–§11 antes de existir, e contra o manifesto quando os §§ não bastarem.*
