# A Sala Particular de Curadoria — Fase 5

> **Status:** especificação arquitetônica do ambiente. Concreta em organização espacial; **ainda não é tela, componente, layout ou Figma.**
> **Herda, congelados:** arquitetura operacional · [Experiência](./ARQUITETURA_DA_EXPERIENCIA.md) · [Sistema Visual](./SISTEMA_VISUAL.md) · [Dramaturgia](./DRAMATURGIA_DA_EXPERIENCIA.md) · [Arquitetura do Lugar](./ARQUITETURA_DO_LUGAR.md).
> **Data:** 2026-08-01

---

# 0 · As três perguntas herdadas, e suas respostas

A Fase 3 deixou três problemas. Eles se resolvem juntos, e a resposta ao primeiro determina a arquitetura inteira.

**1 · Como a carta (prosa) e o Perfil (estrutura) convivem sem que a estrutura mate a voz?**
**Não convivem no espaço. Sucedem-se no tempo.** A carta vem primeiro e ocupa a sala inteira. Ela responde. **Só então** a estrutura aparece — não ao lado da carta, mas **precipitada dela**, como sedimento de uma conversa que acabou de acontecer. Estrutura que nasce de diálogo não é formulário; é ata.

**2 · Como mostrar ordem sem mostrar pontuação?**
**Pela quantidade de espaço e de palavra, nunca por marca.** O que importa mais ocupa mais linhas, corpo maior, e vem dito por inteiro — com o motivo que ela deu. O que importa menos cabe numa linha. **É assim que uma pessoa fala:** fala-se mais longamente do que pesa mais. A hierarquia é retórica, não numérica.

**3 · Como um ambiente sem ação obrigatória não parece vazio nem inacabado?**
**Não deixando nenhum buraco em forma de botão.** Uma sala parece inacabada quando há um lugar óbvio onde uma ação deveria estar e não está. Se a sala não tem esse lugar, não falta nada. E o que a preenche não é tarefa — é **presença**: a carta de alguém, as palavras dela, e o fato visível de que um trabalho está em curso.

---

# 1 · Planta conceitual

```
   ┌─ vindo do Reconhecimento ────────────────────────────┐
   │                                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  A · CABECEIRA                                                    │
│     o nome dela · o Curador (rosto, nome) · onde ela está         │
│     ─────────────────────────────────────────────────────────     │
│                                                                    │
│  B · A CARTA, EM REPOUSO                          ← objeto         │
│     as primeiras linhas visíveis; abre no lugar                    │
│     ─────────────────────────────────────────────────────────     │
│                                                                    │
│                                                                    │
│  C · O CENTRO — o que importa no seu caso                          │
│                                                                    │
│      ╭────────────────────────────────────────────╮                │
│      │  o que não pode faltar                     │  ← gravidade   │
│      │  (mais espaço, mais palavra, o porquê dela)│                │
│      ╰────────────────────────────────────────────╯                │
│         o que ajudaria muito                                       │
│         o que seria bom, se houver                                 │
│         o que não pesa neste momento                               │
│                                                                    │
│                                              │ D · MARGEM          │
│                                              │ datas, quem, quando │
│                                                                    │
│  ────────────────────────────────────────────────────────────     │
│                                                                    │
│  E · A PORTA          (só existe quando há três do outro lado)     │
└──────────────────────────────────────────────────────────────────┘
        │
        └─ o Concierge, no corredor, fora da sala
```

**Escala.** Média — mais fechada que a Recepção, mais aberta que o Reconhecimento. Coluna única, medida de leitura de 60–68 caracteres, margens largas. **Nunca duas colunas:** duas colunas convidam a comparar lados, e aqui não há nada a comparar.

**Profundidade.** Rasa, um plano só. Nada se eleva, nada abre por cima. A única exceção temporária é a carta ao ser aberta, e mesmo ela **expande no lugar**, não sobre.

**Centro de gravidade.** A primeira prioridade — *o que não pode faltar*. É o elemento maior, mais alto e mais falante da sala. Tudo abaixo dela decresce. **Se a pessoa olhar por dois segundos e sair, é isso que ela leva.**

**Luz.** Quente, contraste baixo, concentrada no centro. Bordas mais recuadas. É a luz de um abajur sobre uma mesa, não a de um teto inteiro aceso.

**Vazio.** ~55% da superfície. Concentrado em duas faixas: **acima da carta** (o ar da chegada) e **abaixo do centro** (o ar que impede que a porta pareça o próximo passo obrigatório).

**Ritmo.** O mais lento da casa depois da Decisão. Nada aparece progressivamente, nada anima na entrada. **Tudo já está lá quando ela chega** — porque foi preparado antes, e a preparação prévia é a matéria do acolhimento.

---

# 2 · A CARTA

## Onde vive

**Na sala, sempre — em repouso.** A carta não é uma tela anterior que ficou para trás. Ela é um **objeto que permanece na mesa** depois de lido: recolhida, ocupando pouco espaço vertical, mostrando as primeiras linhas e o nome de quem escreveu.

Isto importa: **um documento que some depois de aceito é um termo de uso.** Um que fica é uma carta.

## Como é aberta

**Expande no lugar**, empurrando o resto da sala para baixo — nunca abre em camada por cima, nunca vira modal. Abrir por cima significaria interromper a sala; abrir dentro significa que a sala **tem espaço para isso**.

Aberta, ela ocupa o centro e o resto recua para a periferia da atenção. Fechada, volta ao repouso. **Pode ser reaberta quantas vezes ela quiser, para sempre.**

## Como é composta

A carta não é texto solto: é a **composição das leituras que o Curador escreveu, conceito a conceito** — que o sistema já grava, uma por prioridade, com autoria e data. A experiência costura essas leituras em prosa contínua, na ordem de importância declarada.

Isso tem uma consequência de projeto que vale registrar: **a carta é construível sobre a arquitetura congelada, sem estrutura nova.** O que muda é a forma de apresentar, não o que se guarda.

## Como termina

**Com a dúvida real do Curador.** Não com "confirme se está correto", não com "revise as informações". Com a pergunta que ele genuinamente tem depois de ler a história dela:

> *"Uma coisa não ficou clara para mim: você prefere resolver isso o quanto antes, ou prefere entender bem antes de decidir? Isso muda bastante o que eu procuro."*

E termina com o nome dele, a data, e nada mais. **Sem botão dentro da carta.** Botão dentro de carta transforma carta em formulário.

## Como convida ao diálogo

Pela pergunta aberta — e por um espaço logo abaixo dela onde **é evidentemente possível escrever**, sem que nada peça que se escreva. A diferença entre um campo obrigatório e um espaço disponível é a mesma que entre um interrogatório e uma conversa: **os dois têm silêncio, mas só um deles é confortável.**

---

# 3 · O GESTO DO RECONHECIMENTO

*Herdado da Fase 3 como fechado: o gesto é responder, nunca confirmar. Aqui ele ganha forma espacial.*

## Como acontece

Ela lê a carta. Abaixo da pergunta há um espaço para escrever. **Ela escreve.**

Ao enviar, três coisas acontecem — e a ordem é deliberada:

**Um.** A resposta dela **entra na carta**, logo abaixo da pergunta, com marcação visível de que é a voz dela. A carta deixa de ser um texto de uma pessoa e passa a ser **um diálogo de duas**. Este é o instante do reconhecimento, e ele não tem nome nem selo: apenas a carta ficou maior.

**Dois.** Nada celebra. Sem confete, sem "obrigado!", sem checkmark, sem avanço automático. **A sala fica quieta** — porque celebrar a compreensão de alguém seria transformá-la em conquista de produto.

**Três.** O centro da sala **se assenta**. As prioridades, que até aqui estavam presentes mas discretas, ganham peso e definição. Não aparecem do nada — **estavam lá e passaram a ter contorno.** É a precipitação da estrutura a partir da conversa.

## Como corrige

**A correção não é um modo separado.** Cada prioridade, no centro, tem uma frase discreta ao lado: *"não é bem assim"*. Tocá-la abre um espaço para ela escrever — com as palavras dela — o que está diferente.

E a regra que preserva o diálogo: **a correção entra ao lado da leitura, nunca no lugar dela.** As duas ficam:

> *Entendemos que você precisa ser atendida perto de casa.*
> *Você respondeu: "não é bem perto de casa, é perto do trabalho da minha filha, que é quem me leva."*

**Corrigir é a melhor coisa que pode acontecer nesta sala.** Significa que ela leu com atenção e se sentiu à vontade para discordar. O ambiente trata correção como **participação** — jamais como erro dela, jamais como erro nosso.

## Como complementa

O mesmo gesto serve para acrescentar. Ao lado do conjunto, sem destaque: *"tem mais uma coisa"*. Espaço aberto, sem estrutura, sem categoria a escolher. **Ela não precisa saber onde aquilo se encaixa** — encaixar é trabalho do Curador.

## Como o Curador recebe

Do lado dele, cada resposta, correção e acréscimo chega **como o que é: a voz dela**, com data, separada da leitura que ele havia escrito. Ele não recebe um formulário preenchido; recebe **uma conversa que continuou**.

E há uma assimetria deliberada: **ela responde quando quiser; ele responde quando puder.** A sala não promete resposta imediata, e não simula presença. Se ele ainda não viu, a sala diz apenas *"[Curador] ainda não leu sua resposta"* — honesto, sem ansiedade.

---

# 4 · O PERFIL ASSISTENCIAL — como a narrativa vira estrutura

## O princípio

**A estrutura não substitui a carta. Ela é o que sobra da carta depois que a conversa aconteceu.**

A carta é como o Curador **entendeu**. O Perfil é o que ficou **acordado**. A diferença entre os dois é o diálogo — e é por isso que a estrutura só se assenta depois da resposta dela.

## Como nasce sem parecer formulário

Quatro decisões, e cada uma bloqueia um mecanismo específico de "formulário":

**Nasce depois, não antes.** Formulário existe antes de você preencher. Aqui, a estrutura aparece **como resultado** de algo que já foi dito. Estrutura posterior à fala é ata; anterior, é questionário.

**Não tem campos — tem frases.** Cada prioridade é uma frase completa em segunda pessoa, não um rótulo com valor: *"Você precisa poder falar com alguém entre as consultas"*, jamais `Canais entre consultas: Essencial`.

**Não tem grade.** Nada alinha em colunas, nada tem altura uniforme. **Grade regular é a assinatura visual do formulário**, e a irregularidade aqui é estrutural: cada item tem a altura que sua importância pede.

**Não tem estado de preenchimento.** Nenhum "3 de 8 preenchidos", nenhuma barra, nenhum item pendente destacado. Se algo ainda não foi conversado, aparece com naturalidade: *"ainda não conversamos sobre isso"* — no mesmo tom de tudo o mais.

## O que a estrutura mostra que a carta não mostrava

**Ordem.** A carta é linear e prosaica. A estrutura mostra **peso relativo** — o que é inegociável e o que é desejável. É a informação que a prosa esconde e que ela precisa ter antes de comparar.

---

# 5 · AS PRIORIDADES

*O centro de gravidade da sala.*

## Como aparecem

Em **quatro zonas de peso decrescente**, separadas por espaço — nunca por linha, nunca por caixa, nunca por rótulo de nível:

| Zona | Como se anuncia | Tratamento |
|---|---|---|
| **1** | *"O que não pode faltar"* | corpo maior, mais espaço vertical, frase completa **com o motivo que ela deu** |
| **2** | *"O que ajudaria muito"* | corpo de leitura, frase completa, sem motivo |
| **3** | *"O que seria bom, se houver"* | corpo de leitura, frase curta |
| **4** | *"O que não pesa neste momento"* | tinta suave, uma linha, agrupado |

Os títulos de zona são **frases sobre a vida dela**, não nomes de níveis. *"O que não pode faltar"* descreve a realidade dela; *"Muito importante"* atribui um valor a um item. A primeira é fala; a segunda é escala.

## Como ocupam espaço

**O espaço é o codificador da importância — o único.** A zona 1 pode ocupar sozinha metade da altura do centro. A zona 4 cabe em três linhas.

Isso funciona porque **espaço não se soma nem se compara entre pessoas.** Ninguém olha e pensa "esta prioridade tem 4 e aquela tem 2". Percebe-se que uma é maior — e maior, aqui, quer dizer *mais presente na vida dela*, que é exatamente o que se quer dizer.

## Como revelam importância sem parecer pontuação

Seis proibições, e elas são a especificação:

**Sem número.** Nenhum "1º, 2º, 3º", nenhuma contagem, nenhum peso.
**Sem marca de nível.** Nenhum ícone, estrela, ponto, barra ou preenchimento.
**Sem cor graduada.** Nenhuma escala de tom claro→escuro. A tinta é a mesma; o que muda é tamanho e quantidade de texto.
**Sem alinhamento comparável.** Itens de zonas diferentes não se alinham verticalmente. Não há coluna onde o olho possa medir.
**Sem total.** Nenhum "8 prioridades definidas".
**Sem o vocabulário do Método.** Nunca "subcritério", "eixo", "nível", "importância" como rótulo.

## A prioridade que carrega o motivo

Só as da zona 1 trazem o **porquê dela**, entre aspas, na voz dela:

> **Você precisa poder ser atendida sem sair de casa.**
> *"não tenho quem me leve, e no ônibus eu passo mal"*

Isso faz três coisas ao mesmo tempo: prova que alguém escutou o detalhe periférico (Fase 3, comportamento 2); explica ao Curador do futuro **por que** aquilo é inegociável; e devolve a ela a própria voz no lugar de maior peso da sala.

---

# 6 · A PREPARAÇÃO PARA A MESA

*Sem botão, sem pressão, sem ruptura.*

## O estado de espera

Depois do reconhecimento, a Sala entra em **espera com conteúdo**. Ela não terminou nada — está aguardando algo que acontece em outro lugar: o Curador procurando.

A sala diz isso uma vez, embaixo, discretamente: *"Com isto em mãos, [Curador] está procurando profissionais que atendam ao que importa para você."* Nunca "aguarde", nunca "em processamento", nunca com estimativa de tempo.

**Esperar aqui não é vazio, porque há o que olhar: o próprio caso, compreendido.** Este é o argumento arquitetônico que justifica a sala existir separada — ela é a única sala da casa onde a espera tem substância.

## A frase que reenquadra

Dita **aqui**, e não na Mesa. É a peça de preparação emocional mais importante da jornada:

> *"Provavelmente mais de um profissional vai atender ao que você precisa. Quando isso acontecer, a escolha não será sobre qual é o melhor — será sobre com quem você quer fazer isso."*

Plantada antes das opções existirem, ela é **enquadramento**. Dita depois, seria justificativa — e justificativa chega tarde, porque o cérebro já entrou em modo de escolha.

## Como a porta aparece

**A porta não é um botão que ela habilita. É um cômodo que passa a existir.**

Quando o Curador conclui a seleção, a Sala **muda de estado sozinha** — sem notificação invasiva, sem badge, sem e-mail com urgência. Na próxima vez que ela entrar, há uma porta no rodapé que antes não existia, e ela é descrita pelo que há do outro lado, não pela ação:

> **Três caminhos possíveis para o seu caso.**
> *[Curador] separou três profissionais e escreveu sobre cada um.*

Sem verbo imperativo. Sem "ver agora". Sem destaque cromático. **É uma porta, e portas não insistem.**

## Por que não há ruptura

Porque **nada muda ao atravessar** exceto o cômodo: o nome dela permanece, o Curador permanece, a carta permanece acessível, as prioridades **reaparecem na Mesa como as linhas do Mapa**, na mesma ordem e com a mesma voz.

A continuidade não é feita de transição bonita. É feita de **os mesmos objetos estarem no cômodo seguinte.**

---

# 7 · O CONCIERGE NESTA SALA

**Ele não entra.** A Sala Particular é, junto com a Decisão, um dos dois cômodos onde a presença do Concierge seria intrusão.

**Fica no corredor**, e sua presença é sentida por estar visível **na borda** — sempre no mesmo lugar, sem se mover, sem chamar.

**Quando permanece invisível:** enquanto ela lê a carta; enquanto escreve a resposta; enquanto corrige; **em todo o primeiro acesso à sala.** O momento do reconhecimento não admite terceiros.

**Quando aparece — três situações, e só elas:**

**Se ela voltar à sala pela terceira vez sem responder à carta.** Não para cobrar; para oferecer outra via: *"Se preferir, você pode conversar por telefone em vez de escrever."* Alguém que volta e não escreve pode ter dificuldade com escrita, e insistir na escrita seria excluir.

**Se a espera pela Mesa passar do previsto.** Para dizer o que está acontecendo, com honestidade: *"A busca está levando mais tempo que o normal — [Curador] está procurando com cuidado."* **Silêncio prolongado sem explicação é onde a confiança se rompe.**

**Se ela pedir.** Sempre, e sem ela precisar explicar o motivo.

---

# 8 · COMPORTAMENTO ESPERADO

*Como saber se a Sala funcionou.*

## Frases que gostaríamos de ouvir

> *"É exatamente isso."*
> *"Como vocês sabiam disso?"* — sobre o detalhe periférico
> *"Deixa eu explicar melhor uma coisa."* — o melhor sinal possível
> *"Eu nunca tinha visto meu caso organizado assim."*
> *"Quem escreveu isso?"* — buscando a pessoa, não o sistema

## Frases que indicam falha

> *"O que eu faço agora?"* — a sala pareceu tarefa
> *"Tem que preencher tudo?"* — pareceu formulário
> *"Isso é automático, né?"* — a carta não soou humana: falhou no essencial
> *"Está faltando alguma coisa aqui?"* — o vazio foi lido como inacabado
> *"Qual é a nota do meu perfil?"* — as prioridades pareceram pontuação

## Comportamentos a observar

**Bons sinais:** ela **reabre a carta** depois de já ter respondido (releitura é apego); **corrige alguma coisa** (leitura atenta e confiança para discordar); **acrescenta algo não perguntado**; **permanece na sala** depois de responder, sem tarefa pendente; e **volta à sala espontaneamente** durante a espera pela Mesa.

**Maus sinais:** atravessa a sala em menos de trinta segundos (não leu); responde à pergunta do Curador com uma palavra (não se sentiu convidada); nunca reabre a carta (a carta virou etapa cumprida); pergunta ao Concierge o que fazer ali (a arquitetura não explicou a si mesma).

**A métrica que não existe:** tempo de conclusão. Esta sala não tem conclusão, e otimizá-la para velocidade seria destruí-la. Se algum dia alguém propuser reduzir o tempo médio de permanência na Sala Particular, a resposta correta é que **este é o único ambiente da plataforma onde permanecer é o resultado desejado.**

---

# 9 · ESPECIFICAÇÃO ARQUITETÔNICA

## 9.1 Zonas, de cima para baixo

| Zona | Conteúdo | Peso | Permanência |
|---|---|---|---|
| **A · Cabeceira** | nome dela · Curador (rosto + nome) · onde está no percurso | discreto | fixa em toda a casa |
| **B · A carta** | em repouso: primeiras linhas + autor + data. Aberta: diálogo completo | médio fechada, **máximo** aberta | permanente, sempre reabrível |
| **C · O centro** | as prioridades, em quatro zonas de peso decrescente | **máximo** | permanente |
| **D · Margem** | datas, autoria, "conversado em" | mínimo | permanente, nunca entra no corpo |
| **E · A porta** | acesso à Mesa | baixo | **só existe quando há três** |

## 9.2 Hierarquia visual, em ordem

1. A primeira prioridade da zona 1 — **o objeto mais pesado da sala**
2. As demais da zona 1
3. A carta em repouso (sobe ao máximo quando aberta)
4. Zonas 2, 3 e 4 em decréscimo
5. A porta
6. A cabeceira
7. A margem

**A porta está em sexto de sete.** Deliberado: numa sala que não pede ação, a saída não pode ser o elemento mais visível.

## 9.3 Proximidade — o que fica perto do quê

**A carta fica perto do centro** porque um deu origem ao outro; a proximidade é a prova visual dessa origem.

**O "não é bem assim" fica colado em cada prioridade** — a correção pertence ao item, não a um modo de edição. Correção que exige entrar em modo de edição é revisão de cadastro; correção que está ao lado da frase é conversa.

**A margem fica longe** — fisicamente afastada, em outra família tipográfica e outra escala. É a separação entre o que é dela e o que é do sistema.

**A porta fica isolada**, precedida da maior faixa de vazio da sala. **O vazio antes da porta é o que impede que a porta pareça o próximo passo obrigatório.**

## 9.4 Transições internas

| O que acontece | Como se move |
|---|---|
| Abrir a carta | expande no lugar, ~240ms, empurra o resto para baixo |
| Enviar a resposta | a resposta **aparece dentro da carta**, sem transição de página |
| O centro se assentar | ~480ms, uma vez só, sem repetição |
| Abrir uma correção | espaço abre sob a prioridade; nada mais se move |
| A porta surgir | **sem animação** — está lá na próxima entrada, como se sempre tivesse estado |

A última é a mais importante: **animar a chegada da porta seria comemorar, e comemorar é empurrar.**

## 9.5 Estados do ambiente

| Estado | O que existe | O que não existe |
|---|---|---|
| **Recém-chegada** | carta fechada, centro discreto | porta |
| **Carta aberta** | diálogo, centro recuado | porta |
| **Após responder** | diálogo com a voz dela, centro assentado | porta |
| **Em espera** | tudo acima + a frase do que está acontecendo | porta |
| **Três encontrados** | tudo acima + **a porta** | — |
| **Já foi à Mesa** | tudo, com a porta agora conhecida | — |

**A sala nunca tem estado "concluída".** Não existe versão dela que diga que acabou.

## 9.6 As proibições do ambiente

Nesta sala **nunca** existem: botão primário destacado; barra ou percentual de progresso; contagem de itens; número de qualquer espécie associado a prioridade; ícone de estado; caixa, cartão ou grade em volta das prioridades; duas colunas; modal; notificação; badge; celebração de qualquer tipo; e **qualquer palavra do vocabulário do Método**.

---

# 10 · Fluxo emocional e espacial, lado a lado

| Momento | Onde ela está | O que sente | O que a sala faz |
|---|---|---|---|
| Chega do Reconhecimento | zona B | expectativa | está pronta; nada anima |
| Abre a carta | B expandida | vulnerabilidade | dá espaço; recua o resto |
| Lê a dúvida dele | fim da carta | *"ele não entendeu tudo — e disse"* | não pede nada |
| Responde | espaço sob a pergunta | **participação** | a resposta entra na carta |
| Vê o centro assentar | zona C | *"é exatamente isso"* | fica quieta |
| Corrige algo | dentro de C | **autoridade** | põe a fala dela ao lado da leitura |
| Lê o reenquadramento | rodapé de C | preparação | planta a expectativa dos três |
| Espera | sala inteira | calma com substância | diz o que acontece, sem prazo |
| Encontra a porta | zona E | prontidão | não insiste |

---

# 11 · Preparação para a Fase 6

A próxima fase desenha o **Reconhecimento** — a antessala, que agora tem contrato definido por esta:

**O que a Fase 6 herda fechado:** a carta é composta das leituras por conceito que o sistema já grava; termina com a dúvida real do Curador; não tem botão dentro; **e não morre ao ser respondida — ela migra para a Sala e permanece lá para sempre.**

**As três perguntas da Fase 6:**
1. **Como é a espera enquanto o Curador lê?** É o único tempo morto da jornada, e a Fase 3 disse que é conteúdo. Que ambiente é uma espera?
2. **Como se apresenta uma carta pela primeira vez** sem que pareça notificação, e-mail ou documento a assinar?
3. **O que acontece se ela não responder nunca?** A carta expira? O Perfil se assenta assim mesmo? O Método diz que o reconhecimento é ato dela — então **provavelmente nada se assenta, e isso precisa ser sustentável emocionalmente.**

---

> **A Sala Particular é o único cômodo da casa onde não há nada a fazer — e é o cômodo de que ela vai lembrar.**
>
> **Porque foi ali que ela leu a própria história escrita por outra pessoa, e reconheceu.**
