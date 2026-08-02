# EXPERIENCE BOOK 2.0
## O documento canônico da experiência da Aliviar

> **Natureza:** direção criativa. Não é design system, não é especificação de interface, não é arquitetura. Nenhuma linha deste documento diz como implementar — todas dizem **o que a pessoa deve sentir**, e o que na tela hoje impede que ela sinta.
>
> **Base empírica:** dezenove capturas reais dos sete ambientes, com sessão autenticada por papel, feitas em 2026-08-01. Toda crítica aqui tem um endereço no que foi visto. Onde não houve captura, está declarado — e nada foi inventado para preencher.
>
> **Herda como fechado:** [SISTEMA_VISUAL.md](./SISTEMA_VISUAL.md) (R1–R20), [ARQUITETURA_DA_EXPERIENCIA.md](./ARQUITETURA_DA_EXPERIENCIA.md), ADR-045, [DIRECAO_DE_ARTE_2_1.md](./DIRECAO_DE_ARTE_2_1.md), `docs/EXPERIENCE_BIBLE.md`, `docs/BRAND_GUIDELINES.md`.
>
> **Autoridade:** este livro é subordinado à Constituição e ao Sistema Visual. Onde parecer contradizê-los, eles vencem — e a contradição é um defeito deste documento, a ser corrigido aqui.

---

# SUMÁRIO

**PARTE I — A PERGUNTA**
1. A resposta, em uma frase
2. As sete emoções
3. O que a Aliviar não é
4. O teste do logotipo apagado

**PARTE II — OS PRINCÍPIOS PERMANENTES**
5. Nove princípios de direção criativa

**PARTE III — A GRAMÁTICA**
6. Arquitetura da atenção
7. Ritmo por composição
8. Luz e peso
9. Silêncio
10. Hierarquia emocional
11. Narrativa visual: a jornada como filme

**PARTE IV — OS SETE AMBIENTES**
12. Fachada
13. Recepção
14. Jornada do Paciente
15. Curadoria
16. Sala da Decisão
17. Concierge
18. Administração

**PARTE V — IDENTIDADE**
19. O que faz uma tela parecer Aliviar
20. Psicologia por ambiente
21. Os testes de aceitação

**PARTE VI — O QUE FAZER COM ISTO**
22. Ordem de trabalho
23. O que este livro deliberadamente não decide

---
---

# PARTE I — A PERGUNTA

---

## 1 · A resposta, em uma frase

Todo este documento existe para responder uma coisa: **como a Aliviar deve fazer uma pessoa se sentir?**

A resposta:

> ### Ela deve sentir que parou de carregar aquilo sozinha.

Não "informada". Não "no controle". Não "confiante". Essas são consequências, e nenhuma delas é o núcleo.

O núcleo é **alívio de carga**. É o que o nome da empresa já diz, e é a única emoção que justifica a existência de tudo o que foi construído. Uma pessoa chega à Aliviar carregando três pesos ao mesmo tempo: o medo do que ela tem, a responsabilidade de escolher certo, e a solidão de estar decidindo sem ninguém do lado dela que entenda do assunto e não tenha interesse na escolha.

A plataforma não pode tirar o primeiro peso — não é medicina, e prometer isso seria mentira. Mas os outros dois são exatamente o que a Aliviar existe para dividir.

**Portanto, o teste de qualquer tela nova é este:** *depois de ver esta tela, a pessoa está carregando mais ou menos do que antes de vê-la?*

Uma tela que informa e aumenta a carga falhou. Uma tela que informa menos e alivia mais passou. Isso é contraintuitivo para quem vem de produto digital, onde mais informação é quase sempre mais valor. Aqui não é. Aqui, informação que a pessoa não pediu e não sabe usar é **mais uma coisa para ela carregar**.

### 1.1 O corolário difícil

Se a emoção-núcleo é alívio de carga, então **a interface não pode pedir nada que ela não precise dar naquele instante**. Cada campo, cada escolha, cada "confirme" é uma transferência de peso da plataforma para a pessoa.

Isso reordena prioridades de um jeito incômodo para engenharia: **a tela mais bem-sucedida da Aliviar é a que pede menos, não a que oferece mais.** A tela que diz *"não há nada para você fazer agora, e quando houver, esta tela vai dizer"* é uma das telas mais valiosas do produto — não um estado degradado a ser preenchido depois.

### 1.2 As três emoções proibidas

Nenhuma superfície da pessoa atendida pode produzir:

**Pressa.** Nada com prazo visível, contagem regressiva, "restam", "ainda não", "pendente há X dias". A decisão dela não tem relógio, e fabricar um seria transformar cuidado em funil.

**Avaliação.** Nada que faça a pessoa sentir que ela — ou a história dela — está sendo pontuada, classificada ou comparada com a de outra pessoa. Isso inclui barras de completude de perfil, "seu cadastro está 60% completo", e qualquer marca de "faltou responder".

**Culpa.** Nada que atribua a ela o motivo de algo não ter acontecido. Se um campo está vazio, a tela diz que ele pode ficar vazio. Se um passo não avançou, a tela diz de quem é a vez — e nunca é dela por omissão.

---

## 2 · As sete emoções

Cada ambiente carrega exatamente **uma** emoção dominante. Não duas. Um ambiente que tenta carregar duas emoções não carrega nenhuma — é a mesma razão pela qual uma cena de cinema tem um objetivo dramático, não três.

| Ambiente | Emoção dominante | A frase que a pessoa deveria poder dizer ao sair |
|---|---|---|
| **Fachada** | Confiança | *"Isso aqui é sério, e não está tentando me vender nada."* |
| **Recepção** | Acolhimento | *"Alguém começou a me ouvir."* |
| **Jornada** | Construção | *"Minha história está sendo montada, e eu vejo isso acontecendo."* |
| **Curadoria** | Reflexão | *"Tem gente pensando no meu caso com calma."* |
| **Sala da Decisão** | Segurança | *"Eu entendi, e a escolha é minha."* |
| **Concierge** | Continuidade | *"Não acabou quando eu escolhi."* |
| **Administração** | Controle | *"Eu sei o estado da operação sem procurar."* |

### 2.1 Por que a Curadoria é "reflexão" e não "competência"

A tentação óbvia seria fazer a Curadoria transmitir **competência** — mostrar rigor, método, credenciais. Está errado, e o erro é sutil.

Competência exibida gera comparação: se a plataforma demonstra o quanto sabe, a pessoa passa a avaliar se sabe o bastante. Reflexão gera confiança sem convite à auditoria: quando você vê alguém pensando com calma sobre o seu problema, você não fica medindo o QI da pessoa — você relaxa.

**Consequência de composição:** a Curadoria não deve exibir volume de análise. Nada de "12 critérios avaliados", "38 profissionais considerados", "análise completa". Volume é competência exibida. O que ela deve exibir é **tempo dedicado** — e tempo se comunica por espaço, por silêncio e por escrita corrida, não por contadores.

### 2.2 Por que a Administração é "controle" e não "eficiência"

Eficiência é uma métrica de ferramenta. Controle é um estado emocional de quem opera. A diferença aparece na primeira tela: uma ferramenta eficiente mostra tudo o que existe; uma superfície que dá controle mostra **o que mudou e o que exige ação**, e mantém o resto acessível sem estar presente.

A Visão geral atual falha exatamente aqui, e a §18 detalha.

---

## 3 · O que a Aliviar não é

Definir por negação é mais preciso do que por afirmação, porque as forças que empurram um produto de saúde para o lugar errado são específicas e conhecidas.

**Não é um hospital.** Nada de branco clínico, cruz, jaleco, estetoscópio, azul-hospitalar saturado, ícone de coração com batimento. Hospital comunica emergência, e emergência é exatamente o estado mental em que ninguém decide bem.

**Não é um marketplace.** Nada de card de profissional com foto sorrindo, estrela, "mais procurado", "disponível hoje", filtro de preço, botão "agendar agora". A pessoa não está comprando um serviço numa vitrine; ela está sendo apresentada a três pessoas por alguém em quem confia.

**Não é uma seguradora.** Nada de linguagem de cobertura, elegibilidade, plano, benefício, carência. Isso empurra a relação para contrato, e contrato é o oposto de acolhimento.

**Não é uma startup.** Nada de gradiente vibrante, ilustração isométrica, mascote, emoji funcional, microcopy espirituoso, confete, "🎉 tudo pronto!". Humor e energia são inadequados quando alguém está com medo.

**Não é um prontuário.** Nada de densidade de sistema clínico na superfície da pessoa — abreviação, código, sigla não expandida, tabela de campos. Prontuário é linguagem de quem opera sobre ela, não de quem conversa com ela.

**Não é um consultório de terapia.** Isso é o erro oposto, e vale registrar porque a correção exagerada existe: nada de tom excessivamente suave, frases contemplativas sem informação, imagem de natureza abstrata, "respire fundo". A pessoa quer ser cuidada **e** quer saber das coisas. Acolhimento sem substância vira condescendência.

---

## 4 · O teste do logotipo apagado

O critério de excelência deste livro é uma pergunta: **se todo o logotipo da Aliviar desaparecesse, alguém reconheceria esta interface só pela experiência?**

Hoje a resposta honesta é **"quase"**. Há uma assinatura real e já perceptível, e há três lacunas que impedem o reconhecimento.

**O que já assina.** A alternância serifa/sem-serifa com significado moral (se uma pessoa escreveu, é serifa) é rara o bastante em produto digital para funcionar como impressão digital. O papel quente em vez de branco puro. A ausência total de semáforo. A escrita que remove pressão em vez de adicionar ("Você pode deixar em branco se preferir", "Você pode fechar esta página com tranquilidade") — essa voz é, hoje, o ativo mais reconhecível da Aliviar, mais do que qualquer decisão visual.

**O que ainda impede o reconhecimento.**

**Primeiro: a plataforma não tem um gesto próprio.** Toda experiência memorável tem um movimento que só ela faz — um jeito de virar página, de revelar, de confirmar. A Aliviar tem uma travessia de 480ms projetada e não usada como travessia. Sem gesto próprio, a interface é reconhecível **parada** e anônima **em uso**, e ninguém usa uma interface parada.

**Segundo: a Fachada e o Produto não parecem o mesmo lugar em ritmo.** Parecem na paleta, na tipografia e no material — a rodada anterior resolveu isso. Mas a Fachada respira em blocos de 8,5rem e o Produto respira em blocos de 1,5rem. A pessoa atravessa uma porta e o tempo muda de velocidade.

**Terceiro: os fundos operacionais são genéricos.** A Administração, se perdesse o logo, seria indistinguível de qualquer painel de CRM bem-feito. Isso é tratável sem perder densidade, e a §18 diz como.

**Para a resposta virar "sim", este livro precisa produzir três coisas** — e produz, nas partes III e IV: um gesto próprio (§11.4), uma unidade de tempo entre fachada e produto (§7.3), e uma assinatura de composição para os fundos (§18.4).

---
---

# PARTE II — OS PRINCÍPIOS PERMANENTES

---

## 5 · Nove princípios de direção criativa

Estes princípios são **permanentes**. Não são preferências desta rodada; são o que torna a experiência reconhecível ao longo do tempo. Cada um traz: o enunciado, por que existe, como verificar, e o modo de falha típico.

---

### P1 — A tela mostra a vez, nunca a fila

**Enunciado.** Em qualquer momento, a superfície da pessoa deixa óbvio **de quem é a vez** — dela, do Curador, ou de ninguém. Nunca exibe a fila, a posição, o tempo estimado ou o volume de trabalho por trás.

**Por que existe.** Fila é a estrutura visual da ansiedade. Saber que você é o número 4 não ajuda em nada e transforma espera em contagem. Saber que "agora é a vez do Curador ler" transforma a mesma espera em confiança delegada.

**Como verificar.** Cubra todo o texto da tela. Ainda dá para dizer de quem é a vez? Se a resposta depende de ler um parágrafo, a informação está no lugar errado — ela deveria estar na composição.

**Modo de falha.** Aparece um indicador de progresso "3 de 7", ou um "aguardando análise" sem sujeito. Ambos convertem vez em fila.

**Estado atual.** A casa da paciente acerta isto de forma exemplar: *"Ela começa pela conversa em que seu Curador ouve a sua história inteira. Nada aqui depende de você agora."* É a melhor execução deste princípio na plataforma. A Recepção acerta pelo traço de progresso sem número.

---

### P2 — O sistema nunca fala de si mesmo

**Enunciado.** Nenhuma superfície da pessoa menciona a existência do software: cadastro, registro, sistema, plataforma, dados, perfil, conta, sincronizado, salvo, processado.

**Por que existe.** Toda menção ao sistema lembra a pessoa de que ela está sendo processada por um mecanismo. O princípio de tecnologia invisível já existe no cânone; aqui ele vira regra de composição, não só de vocabulário.

**Como verificar.** Leia a tela em voz alta imaginando que é uma pessoa falando com outra numa sala. Qualquer palavra que soaria estranha nessa sala é vocabulário de sistema.

**Modo de falha.** "Seus dados foram salvos" em vez de "O que você escreveu está guardado". "Complete seu perfil" em vez de "Falta uma coisa que ajuda o seu Curador".

**Estado atual.** Zero ocorrências nas superfícies dela — auditado. Nos fundos, ainda há ("Endpoint preparado em POST"), o que é aceitável, mas a §18 argumenta que nem tanto quanto se supõe.

---

### P3 — O silêncio é conteúdo, não sobra

**Enunciado.** O vazio de uma tela é dimensionado antes do conteúdo entrar, com a mesma disciplina de um bloco de texto. Espaço que sobrou não é silêncio.

**Por que existe.** Densidade alta comunica *"temos muito a processar e pouco espaço"* — a estética de quem precisa provar valor por volume. Densidade baixa e **deliberada** comunica *"o que está aqui é o que importa"*. Mas densidade baixa e **acidental** comunica abandono, que é pior que ambas.

**Como verificar.** Aponte para a maior área vazia da tela e responda: *o que este vazio está fazendo?* Se a resposta for "nada, é onde o conteúdo acabou", é sobra.

**Modo de falha.** É o defeito mais comum da plataforma hoje, e aparece em dois extremos opostos: a Fachada tem vazio uniforme demais (§12.4) e a fila da Curadoria tem 45% de largura sem função (§15.3).

---

### P4 — Nada que possa ser somado pelo olho

**Enunciado.** Nenhum elemento repetido, contável ou empilhável representa qualidade, progresso ou adequação. Já é regra permanente do Sistema Visual (R5); aqui se estende à composição.

**Por que existe.** O olho totaliza automaticamente. Três ícones iguais viram "3". Cinco linhas de mesma altura viram uma coluna comparável. No instante em que algo pode ser somado, a pessoa soma — e some do lugar de quem escolhe para o lugar de quem confere um placar.

**Como verificar.** Tire um print, desfoque até o texto sumir e olhe as manchas. Se alguma sequência de manchas parece contável ou comparável entre colunas, o anti-ranking foi quebrado pela forma, mesmo que o texto negue.

**Modo de falha.** Grades regulares. É por isso que a matriz do Mapa tem alturas irregulares por projeto — não é estética, é estrutura anti-soma.

---

### P5 — A pessoa aparece antes do processo

**Enunciado.** Em toda tela, o primeiro elemento com peso é alguma coisa que vem **dela** — o nome dela, a frase dela, a prioridade dela, a história dela. Nunca um rótulo do sistema, um estado, um passo ou um título de seção.

**Por que existe.** É o que separa "estou sendo atendido" de "estou dentro de um processo". A ordem dos elementos é uma declaração de quem é o assunto.

**Como verificar.** Qual é o primeiro texto legível da tela, de cima para baixo? Se for um rótulo, o princípio está quebrado.

**Modo de falha.** Na casa da paciente hoje, o primeiro texto é `SUA JORNADA` — um rótulo, em caixa alta, antes de "Olá, Paciente Teste." O princípio está quebrado por dois centímetros de composição. Ver §14.2.

---

### P6 — Uma decisão por ambiente

**Enunciado.** Cada ambiente tem exatamente uma ação principal. As demais existem em peso claramente subordinado, ou não existem.

**Por que existe.** Duas ações de peso equivalente não dobram a chance de agir — dividem a certeza. Para quem está com medo, ambiguidade de ação é mais uma decisão a tomar antes da decisão que importa.

**Como verificar.** Mostre a tela por dois segundos e pergunte "o que se faz aqui?". Se vierem duas respostas, há duas ações.

**Modo de falha.** A Fachada tem hoje dois botões lado a lado no Hero, de peso quase igual — "Contar minha história" e "Entrar na minha Jornada" (§12.2).

---

### P7 — A lacuna tem o mesmo peso do dado

**Enunciado.** O que não se sabe é apresentado com o mesmo tamanho, a mesma tipografia e o mesmo espaço do que se sabe. Nunca em cinza apagado, nunca menor, nunca com ícone de alerta.

**Por que existe.** Desenhar ausência como falta transforma ausência em desvantagem, e desvantagem é a semente do ranking. Um profissional sobre quem não temos uma informação não é pior — é apenas um profissional sobre quem não temos aquela informação.

**Como verificar.** Compare visualmente uma célula preenchida e uma vazia. Se a vazia parece "faltando", falhou.

**Nota de tensão.** Este princípio vale para as superfícies **dela**. Nos fundos operacionais vale o inverso, e por bom motivo — ver §18.3, onde argumento que zero deve recuar de peso. Não é contradição: na superfície dela a lacuna é sobre outra pessoa e não pode virar julgamento; no fundo, a lacuna é sobre a própria operação e é ruído que rouba o primeiro olhar.

---

### P8 — Todo movimento explica uma origem

**Enunciado.** Movimento existe para dizer de onde algo veio ou para onde algo foi. Nunca para chamar atenção, nunca para celebrar, nunca para preencher espera.

**Por que existe.** Movimento decorativo é o sinal mais rápido de "produto que quer ser notado". A Aliviar quer ser esquecida enquanto usada.

**Como verificar.** Para cada animação, complete a frase: *"isto se move para mostrar que ___ veio de ___"*. Se não completar, remova.

---

### P9 — A voz humana e a voz do sistema nunca se misturam na mesma frase

**Enunciado.** Já é R3. Aqui vira regra de composição: onde as duas vozes se encontram, há separação **espacial** — linhas diferentes, com ar entre elas —, nunca só troca de fonte no meio da linha.

**Por que existe.** É a assinatura mais forte da Aliviar, e a que mais barato se perde. Uma data em sem-serifa no meio de uma frase em serifa destrói a promessa de que aquilo foi escrito por alguém.

---
---

# PARTE III — A GRAMÁTICA

---

## 6 · Arquitetura da atenção

### 6.1 O método

Toda tela é mapeada em cinco posições. Não são sugestões: são o roteiro da cena.

**Primeiro olhar.** Onde o olho pousa em menos de um segundo, sem esforço. Determinado por contraste e massa, quase nunca por posição.

**Segundo olhar.** Para onde ele vai imediatamente depois. Determinado por proximidade e alinhamento.

**Terceiro olhar.** O que ele encontra ao completar a leitura. Aqui mora a informação que sustenta, não a que convoca.

**Ponto de descanso.** A região para onde o olho volta entre leituras. **Toda tela precisa de um.** Uma tela sem ponto de descanso é uma tela onde o olho não para de trabalhar, e olho que não para produz cansaço que a pessoa atribui ao assunto — não à interface.

**Ação principal.** O que se faz ali. Deve coincidir com o segundo ou terceiro olhar, **nunca com o primeiro**. Uma ação no primeiro olhar é uma tela que pede antes de dizer.

### 6.2 O erro mais caro: o falso primeiro olhar

Um **falso primeiro olhar** é um elemento que ganha o primeiro olhar sem merecê-lo — quase sempre por contraste alto em algo que é apenas orientação: um rótulo de navegação, um selo de status, um filtro selecionado.

O custo é invisível e enorme. A pessoa não percebe que olhou para o lugar errado; ela apenas sente que a tela é confusa, e não consegue dizer por quê.

**Este foi o defeito estrutural mais disseminado da plataforma**, e valia para todas as superfícies autenticadas: o item ativo da navegação era o objeto de maior contraste da tela. Numa página cujo assunto é "Olá, [nome da pessoa]", o olho pousava primeiro num rótulo dizendo "Início". Já corrigido; registrado aqui como o modo de falha a vigiar, porque ele volta com facilidade.

### 6.3 A regra do descanso

O ponto de descanso não pode ser o rodapé. Rodapé é fim, não pausa. O descanso precisa estar **dentro** da região de leitura — normalmente uma faixa de vazio entre o bloco principal e o secundário, com pelo menos a altura de três linhas de corpo.

Uma tela cujo único vazio está depois de todo o conteúdo não tem descanso: tem fim.

---

## 7 · Ritmo por composição

O prompt pede explicitamente: **ritmo sem usar cor**. Isso é correto e é o teste mais duro de direção de arte, porque cor é o atalho preguiçoso para criar variação.

### 7.1 As quatro alavancas

**Densidade.** Quantos caracteres por área. Um trecho denso seguido de um trecho aberto cria batida; densidade uniforme não cria nenhuma, seja ela alta ou baixa.

**Medida.** A largura da coluna de leitura. Alternar entre uma coluna estreita (leitura íntima) e uma faixa larga (declaração) muda a respiração sem tocar em cor.

**Altura de bloco.** Blocos de alturas iguais produzem monotonia mesmo com conteúdos diferentes. Alturas deliberadamente desiguais produzem hierarquia sem nenhum recurso gráfico.

**Intervalo.** O espaço entre blocos. Intervalo constante é metrônomo; intervalo variável é frase musical.

### 7.2 O diagnóstico: a plataforma tem dois problemas opostos e nenhum ponto de equilíbrio

**A Fachada é uniformemente vazia.** Sete seções, 8.579 pixels de altura, aproximadamente 2.500 caracteres de texto — cerca de **0,4 caractere por pixel de altura**, com respiro praticamente idêntico acima e abaixo de cada seção. Não há uma única passagem densa para contrastar com as abertas.

Isto é contraintuitivo e precisa ser dito com clareza: **vazio uniforme é tão arrítmico quanto densidade uniforme.** O olho não descansa na Fachada porque nunca esteve tenso. Ele apenas desliza. E deslizar não é a mesma coisa que ser conduzido.

**A Administração era uniformemente densa.** Dezoito blocos de peso idêntico em sequência. Já tratado por hierarquia.

Nenhum dos dois ambientes tinha **frase musical** — só metrônomo, em andamentos opostos.

### 7.3 A unidade de tempo compartilhada

Para a Fachada e o Produto parecerem o mesmo lugar, precisam compartilhar uma **unidade de respiração**, não um valor de espaçamento. A unidade é: *o intervalo entre dois assuntos distintos é aproximadamente três vezes o intervalo entre dois parágrafos do mesmo assunto.*

Hoje a Fachada usa uma proporção perto de 10:1 e o Produto perto de 2:1. Por isso a passagem da porta muda a velocidade do tempo. A recomendação não é "diminuir o espaçamento da Fachada" — é **fazer as duas obedecerem à mesma proporção**, o que aproxima a Fachada e afasta ligeiramente o Produto.

### 7.4 Como construir uma frase, concretamente

Uma sequência com ritmo, na Fachada, seria:

1. **Chegada** — máxima abertura. Uma frase, muito ar. A pessoa para.
2. **Reconhecimento** — densidade média. Três blocos curtos que nomeiam o problema dela. A pessoa se vê.
3. **Respiro** — quase nada. Uma linha só, muito espaço. A pessoa assenta.
4. **Método** — **densidade alta**, deliberada. É aqui que a Aliviar explica como funciona, e explicação merece densidade: texto corrido, medida estreita, leitura de verdade. **Esta é a passagem densa que hoje não existe em nenhum lugar da Fachada.**
5. **A sala escura** — corte de material. Não é sobre densidade: é sobre mudança de ambiente. Funciona como corte de cena.
6. **Respiro longo.**
7. **Convite** — abertura média, uma ação só.

A batida seria: **aberto — médio — vazio — denso — corte — vazio — médio**. Hoje é: aberto — aberto — aberto — aberto — corte — aberto — aberto.

---

## 8 · Luz e peso

### 8.1 A luz é a única metáfora física permitida

O Sistema Visual já estabelece direção lateral-superior, sombras longas e suaves, nenhuma luz frontal. A direção criativa acrescenta: **a luz é o instrumento que diz o que é presente e o que é passado.**

- **O que está acontecendo agora** recebe mais luz: superfície mais clara, mais contraste interno, mais nitidez de borda.
- **O que já aconteceu** recua: mesma cor, menos contraste interno, borda mais macia. Nunca cinza, nunca opacidade — recuo por **valor**, para que continue perfeitamente legível.
- **O que ainda não aconteceu** não é escurecido nem apagado. É apenas menos definido em forma. Escurecer o futuro é uma promessa de que ele é pior.

### 8.2 O que deveria parecer mais leve

**A moldura.** Cabeçalho, navegação, rodapé. A moldura é o móvel, não o documento. Hoje ela ainda tem peso demais em duas situações: quando o item ativo se destaca demais (corrigido) e quando o rodapé institucional aparece com altura de seção dentro de um ambiente íntimo.

**As ações secundárias.** "Voltar", "Cancelar", "Ver depois". Devem ser leves a ponto de quase não serem vistas por quem já decidiu, e imediatamente encontráveis por quem quer sair.

**Os estados vazios.** Um estado vazio pesado é uma contradição: o vazio está dizendo que não há nada, e a caixa está dizendo que há algo. Estado vazio é texto com ar, não cartão.

### 8.3 O que deveria parecer mais profundo

**A superfície de leitura.** Onde vive a história dela, o Relatório, os retratos. Esta é a única superfície que merece parecer material — papel de verdade, com grão perceptível de perto e invisível a um metro.

**A sala escura da Fachada.** Já corrigida por valor: desceu dois degraus e passou a ler como ambiente em vez de superfície colorida. Este é o modelo de como criar profundidade sem sombra.

**A Sala da Decisão.** Deveria ser o ambiente com maior sensação de profundidade da plataforma — não por elevação, mas por **quantidade de espaço em volta de um único objeto**. Profundidade por isolamento.

### 8.4 Onde há excesso de peso hoje

**Números grandes em serifa sobre dado ausente.** Corrigido na Administração. Era o caso mais grave: doze zeros com o peso tipográfico de doze conquistas.

**Cartões dentro de cartões.** Qualquer caixa dentro de outra caixa duplica a percepção de moldura e reduz a de conteúdo. Aparece na Continuidade e nos formulários.

**Rodapés institucionais dentro de ambientes íntimos.** Um bloco navy de altura de seção no fim da Recepção pesa mais que a pergunta que a pessoa está respondendo.

### 8.5 Onde falta peso

**A frase dela.** Quando a pessoa escreve algo — o motivo, a história, uma prioridade —, aquilo deveria voltar para a tela com **mais** peso do que qualquer rótulo do sistema em volta. Hoje a frase dela e o rótulo do campo têm pesos parecidos. Isso é uma inversão de hierarquia emocional: o que ela disse é a coisa mais importante da plataforma.

**O nome do Curador.** A pessoa precisa saber que existe uma pessoa. O nome do Curador deveria ter presença tipográfica de assinatura, não de metadado.

---

## 9 · Silêncio

### 9.1 Nem todo vazio é silêncio

Três tipos de vazio, e só um deles é bom:

**Silêncio** — vazio dimensionado antes do conteúdo, com função declarada. Comunica confiança.

**Sobra** — vazio que restou porque o conteúdo acabou. Comunica abandono. A fila da Curadoria tem 45% da largura em sobra: o conteúdo ocupa a metade esquerda e a direita não faz nada. Silêncio visual é dimensionado; sobra é o que acontece quando ninguém decidiu a largura.

**Deriva** — vazio uniforme e prolongado sem variação. Comunica que a página não tem o que dizer. É o caso da Fachada.

### 9.2 Onde a interface deve respirar

**Sob uma decisão.** O espaço abaixo de uma escolha fica vazio. Preencher ali é empurrar. Nenhuma tela deve ter conteúdo logo abaixo do gesto que a pessoa vai fazer.

**Ao lado de conteúdo emocional.** A história dela nunca divide a tela com outra coisa. Nem com navegação lateral, nem com um painel de contexto, nem com "veja também".

**Entre ambientes.** A travessia. Ver §11.4.

**Depois de uma informação difícil.** Se a tela diz algo que exige assentar — uma condição, uma limitação, uma espera —, o parágrafo seguinte não começa imediatamente. Há uma pausa da altura de duas linhas.

### 9.3 Onde remover elementos, concretamente

**O rodapé duplicado da casa da paciente.** A home repete, no fim da página, exatamente os mesmos links da navegação do topo — "Minha história, Documentos, Minha Curadoria, Conta". Repetição sem hierarquia não é redundância útil: é ruído que faz a página parecer maior do que é, e faz o fim parecer um começo. **Remover.**

**O segundo CTA do Hero da Fachada.** Ver §12.2.

**As molduras dos estados vazios.** Quatro dos ambientes apresentam ausência dentro de uma caixa com borda. A caixa afirma que há um objeto ali. Remover a caixa e deixar a frase com ar comunica melhor exatamente a mesma coisa.

### 9.4 Onde ampliar espaço

**Acima do nome da pessoa**, em toda tela onde ele aparece. O nome dela precisa de mais ar acima do que qualquer título de seção.

**Entre a pergunta e o campo**, na Recepção. Hoje a distância entre a pergunta e o rótulo "Sua resposta" é quase a mesma que entre o rótulo e o campo. Isso agrupa a pergunta com o formulário. A pergunta deveria pertencer visualmente à voz humana, e o campo ao ato de responder — com ar entre os dois.

### 9.5 Onde reduzir densidade

Somente nos fundos, e somente por agrupamento — nunca escondendo. A Administração não precisa de menos informação; precisa que a informação apareça em **três camadas de leitura** em vez de uma (§18.3).

---

## 10 · Hierarquia emocional

Hierarquia não é tamanho de fonte. É a ordem em que as coisas **importam**, e ela nem sempre coincide com a ordem em que são lidas.

### 10.1 A escala de importância percebida da Aliviar

Do mais importante ao menos, em qualquer superfície da pessoa:

1. **O que ela disse.** A frase dela, com as palavras dela.
2. **Quem está cuidando.** O nome do Curador, a existência de uma pessoa.
3. **De quem é a vez.** Dela, do Curador, ou de ninguém.
4. **O que vai acontecer.** O próximo momento, descrito, não numerado.
5. **O que já aconteceu.** A memória, disponível, sem convocar.
6. **O que o sistema sabe.** Proveniência, datas, estados — na margem, sempre.

**Qualquer tela que inverta 1 e 6 falhou**, mesmo que esteja bonita e correta.

### 10.2 Peso emocional versus peso visual

Existem elementos com alto peso emocional e baixo peso visual — e eles são os mais perigosos.

**Exemplo real:** a frase *"Você pode fechar esta página com tranquilidade"*, na casa da paciente, está hoje no menor corpo tipográfico do bloco, abaixo de dois parágrafos maiores. Ela tem o **maior** peso emocional da tela inteira: é a única frase que efetivamente tira peso das costas de quem está esperando. Está tratada como nota de rodapé.

**Regra:** frases que aliviam carga não vão em corpo menor. Elas podem ir em corpo menor que o título, nunca em corpo menor que a informação operacional em volta.

### 10.3 A hierarquia é dela, não nossa

Já é R4. A consequência de direção criativa: **quando a pessoa declarou o que é mais importante, a tela obedece a essa ordem mesmo quando outra ordem seria mais eficiente.** Se ela disse que "ter com quem falar entre as consultas" é o mais importante, isso ocupa mais espaço vertical e corpo maior que os demais — mesmo que a informação sobre esse item seja curta e a informação sobre outro item seja longa.

Espaço proporcional à importância **declarada**, nunca ao volume de conteúdo disponível. É contraintuitivo para quem diagrama, e é a decisão que faz a tela ser o retrato dela.

---

## 11 · Narrativa visual: a jornada como filme

### 11.1 A estrutura em cinco atos

A jornada completa é um filme, e tem a estrutura de um:

**Ato I — A chegada (Fachada).** Objetivo dramático: *fazer a pessoa acreditar que este lugar é sério.* Tom: sóbrio, amplo, sem pressa. Termina quando ela decide contar.

**Ato II — A escuta (Recepção).** Objetivo: *fazer a pessoa sentir que foi ouvida, não coletada.* Tom: íntimo, uma coisa por vez, ritmo dela. Termina quando ela terminou de falar.

**Ato III — A espera (Jornada + Curadoria).** Objetivo: *fazer a espera parecer trabalho de alguém, não silêncio de máquina.* É o ato mais difícil, porque nada acontece na tela dela. Termina quando o Relatório existe.

**Ato IV — O encontro (Sala da Decisão).** Clímax. Objetivo: *fazer a pessoa se sentir segura para escolher.* Todo o resto existe para este ato.

**Ato V — A continuidade (Concierge).** Objetivo: *provar que não acabou.* Tom: doméstico, baixo, presente.

### 11.2 O ato mais fraco é o III, e a razão é estrutural

No Ato III não há nada para mostrar. A pessoa terminou de falar e ninguém pode dizer a ela o que está sendo feito, porque contar o processo violaria a tecnologia invisível e exibir volume violaria a §2.1.

Hoje a plataforma resolve isso com **uma frase muito boa** e nada mais. A frase carrega o ato sozinha.

**Recomendação de direção:** o Ato III precisa de **um sinal de presença que não seja informação**. Não uma barra, não um status, não uma estimativa. Algo como: a tela do Ato III **muda de luz** entre a visita de ontem e a de hoje — não muda de conteúdo, muda de atmosfera. A pessoa não consegue nomear o que mudou, mas percebe que o lugar não está congelado.

Isto é deliberadamente difícil e deliberadamente sutil. É a única forma que encontrei de comunicar "alguém está trabalhando" sem contar o trabalho, sem fabricar urgência e sem quebrar nenhuma regra permanente. Fica registrado como **direção**, não como especificação — a execução exige uma rodada própria.

### 11.3 As passagens: onde o filme corta

Há quatro cortes reais na jornada, e cada um merece tratamento distinto:

**Fachada → Recepção.** Corte de intenção. A pessoa decidiu falar. Deve haver uma queda de temperatura de marketing: a moldura institucional recua e o ambiente fecha em torno dela. Hoje **não recua** — o rodapé institucional continua presente na Recepção, com a mesma altura e a mesma voz da Fachada. Ver §13.5.

**Recepção → Espera.** Corte de entrega. Ela terminou. Este é o momento de maior vulnerabilidade da jornada inteira — ela acabou de entregar a própria história a estranhos. Merece o tratamento mais cuidadoso da plataforma, e hoje é uma transição comum de página.

**Espera → Sala da Decisão.** Corte de revelação. É o corte mais importante do filme.

**Sala → Continuidade.** Corte de assentamento. Depois do ato, silêncio — e a plataforma já acerta isto: nenhum parabéns, nenhuma celebração, a tela apenas assenta.

### 11.4 O gesto próprio da Aliviar

Este é o item que, hoje, mais falta para o teste do logotipo apagado passar.

**A proposta: a travessia com nome.**

Ao passar de um ambiente para outro, a tela anterior se recolhe, há **um instante de superfície limpa com o nome do ambiente em que se entra**, e o novo assenta. Duração aproximadamente o dobro de qualquer outro movimento — atravessar uma porta demora mais do que andar pela sala.

Três razões pelas quais isto é a assinatura certa:

1. **É funcional, não decorativo.** Diz de onde a pessoa veio e onde chegou. Passa no teste do P8.
2. **É raro.** Praticamente nenhum produto digital nomeia o lugar em que você está entrando. É o gesto de um edifício, não de um app.
3. **É emocionalmente correto.** Dar nome ao cômodo é a forma mais econômica de dizer "você está num lugar, não numa tela".

A duração já está orçada no Sistema Visual (§9) e não está sendo usada como travessia. **Ativar isto é a maior conversão de identidade disponível ao menor custo.**

---
---

# PARTE IV — OS SETE AMBIENTES

---

## 12 · FACHADA

> **Emoção dominante:** confiança.
> **A frase que ela deveria poder dizer:** *"Isso aqui é sério, e não está tentando me vender nada."*

### 12.1 Como começa

Começa bem, e começa certo. Uma frase em serifa grande — *"Uma decisão de saúde importante. Você não precisa tomá-la sozinho."* — sobre uma fotografia de ambiente real, com muito ar. Não há promessa, não há superlativo, não há número. A pessoa entende em três segundos que não está num diretório de anúncios.

**A abertura é o melhor momento da plataforma inteira.** Vale registrar isso antes das críticas, porque é o padrão contra o qual o resto deveria ser medido.

### 12.2 O primeiro problema: duas portas na mesma parede

Logo abaixo da frase há **dois botões lado a lado**, de peso quase equivalente: "Contar minha história" e "Entrar na minha Jornada".

Isso viola P6, e o custo é maior do que parece. Os dois botões falam com **públicos completamente diferentes** — um com quem nunca esteve aqui, outro com quem já está no meio da jornada — mas estão compostos como se fossem duas opções da mesma pessoa. Quem chega pela primeira vez precisa, no primeiro segundo da relação, descartar uma opção que não era para ela. É um micro-esforço cognitivo cobrado exatamente de quem tem menos energia.

**Recomendação.** Uma porta na parede: "Contar minha história", sozinha, com todo o peso. O retorno de quem já é paciente pertence à **moldura**, não ao palco — o "Entrar" do cabeçalho já existe e já faz esse trabalho. Quem está no meio da jornada não precisa ser convidado; precisa ser reconhecido, e reconhecimento mora no canto superior, não no centro.

### 12.3 O segundo problema: o vazio negro abaixo da promessa

Imediatamente abaixo dos CTAs há um retângulo grande e **completamente preto** — o vídeo institucional, sem quadro de abertura visível.

Do ponto de vista de direção, isto é grave. A composição é: promessa emocional → convite → **buraco**. O primeiro objeto de máximo contraste da página é um vazio sem informação. Ele domina o primeiro olhar por massa e por contraste, rouba a atenção da frase que acabou de ser lida, e não devolve nada.

**Recomendação.** O vídeo precisa de um quadro de abertura que seja, ele próprio, uma imagem de valor — uma cena parada do ambiente, na mesma família fotográfica do resto. Um vídeo em repouso deve parecer uma fotografia, nunca uma ausência. Se um quadro digno não existir, **o vídeo não deveria ocupar aquela posição** — deveria descer para depois do primeiro bloco de texto, onde a pessoa já tem contexto para querer assistir.

### 12.4 Como conduz, onde acelera, onde respira

Não acelera em lugar nenhum, e é este o diagnóstico central.

As sete seções — *O cenário atual · O método · Caminho claro · Prioridades · O documento · Curadores independentes · Dúvidas frequentes* — têm respiro praticamente idêntico, densidade praticamente idêntica e altura da mesma ordem. **A página tem 8.579 pixels e nenhuma mudança de andamento.**

Ela desliza. E deslizar não é ser conduzido: é a diferença entre um filme com montagem e uma sequência de planos bonitos.

**Onde emociona.** Em dois lugares, e os dois são texto, não composição: *"Escolher um médico virou um problema de navegação"* — porque nomeia a experiência real da pessoa sem dramatizar — e *"Nós nunca perguntamos qual é o melhor médico"* — porque essa é, literalmente, a tese da empresa.

**Onde perde força.** Entre a terceira e a quinta seção. "Caminho claro", "Prioridades" e "O documento" contam a mesma coisa em três andamentos idênticos: o processo. Um visitante que chegou por medo não precisa de três explicações do método antes de saber que existe gente do outro lado.

### 12.5 Quais blocos poderiam desaparecer

**"Prioridades" e "O documento" deveriam ser um só bloco.** Ambos descrevem o mesmo artefato sob ângulos próximos. Fundidos, viram a **passagem densa** que falta à página (§7.4) — texto corrido, medida estreita, leitura de verdade, no lugar de dois blocos rasos.

**O segundo CTA do Hero.** §12.2.

### 12.6 Quais blocos deveriam existir

**Um bloco sobre o Curador — uma pessoa, com nome e rosto.** É a lacuna mais séria da Fachada.

A página inteira fala de método, processo e independência. Nenhum momento apresenta **um ser humano**. A tese central da Aliviar é que existe alguém do lado da pessoa; a Fachada afirma isso e nunca mostra. Um retrato editorial real de um Curador, com nome, com uma frase escrita por ele em serifa, faria mais pela confiança do que as três seções de processo juntas.

Isto exige um Curador real e uma fotografia real. **Não é decisão de arte** — é decisão de negócio e de privacidade, e está registrada como dependência, não como recomendação executável.

**Um bloco de limite.** A Fachada diz o que a Aliviar faz. Não diz o que **não** faz. Existe hoje uma frase nessa direção dentro da sala verde ("Não damos diagnóstico, não escolhemos por você..."), e ela é excelente — mas está enterrada no meio de uma seção sobre independência. Declarar limites é o gesto de confiança mais forte disponível a uma marca de saúde, e merece posição própria.

### 12.7 Arquitetura da atenção

| | Hoje | Deveria ser |
|---|---|---|
| **Primeiro olhar** | o retângulo preto do vídeo | a frase em serifa |
| **Segundo olhar** | a frase | o convite único |
| **Terceiro olhar** | os dois botões, em competição | a cena do ambiente |
| **Descanso** | não existe acima da dobra | a faixa de ar entre a frase e o convite |
| **Ação principal** | ambígua entre duas | "Contar minha história" |

---

## 13 · RECEPÇÃO

> **Emoção dominante:** acolhimento.
> **A frase que ela deveria poder dizer:** *"Alguém começou a me ouvir."*

### 13.1 A resposta à pergunta do prompt

*Ela sente que está começando um formulário, ou que alguém começou a ouvi-la?*

**Ouvida.** Com folga. Este é o ambiente mais bem resolvido da plataforma, e deveria ser o padrão de referência para todos os outros.

Quatro decisões fazem isso funcionar, e vale nomeá-las porque são replicáveis:

1. **Uma pergunta por tela.** Não um formulário com sete campos — uma pergunta, como numa conversa.
2. **A pergunta em serifa, grande, em posição de fala.** Ela é lida como alguém perguntando, não como um rótulo de campo.
3. **O progresso sem número.** Cinco traços, um preenchido. A pessoa sabe onde está sem ser contada.
4. **A frase que remove pressão.** *"Você pode deixar em branco se preferir."* Esta é, provavelmente, a melhor linha de microcopy da plataforma inteira: ela devolve à pessoa o direito de não responder, que é exatamente o que um formulário nunca faz.

### 13.2 O que ainda parece formulário

Três detalhes, todos de composição, nenhum de texto:

**O rótulo "Sua resposta" acima do campo.** É a única palavra de formulário na tela. A pergunta já é a pergunta; nomear o campo é o gesto de um sistema pedindo um dado. **Remover.** O campo abaixo de uma pergunta é evidentemente onde se responde.

**A distância entre a pergunta e o campo.** Hoje a pergunta, o subtítulo, o rótulo e o campo estão a intervalos quase iguais — o que os agrupa como um bloco só, e um bloco de pergunta+campo é um formulário. A pergunta pertence à voz humana; o campo pertence ao ato de responder. **Precisa de ar entre eles** — cerca do triplo do intervalo interno.

**A moldura do campo.** Uma caixa com borda em quatro lados é o objeto mais reconhecivelmente "formulário" que existe. Um campo de escrita íntima poderia ser uma superfície de papel com um fio embaixo — como uma linha de caderno —, não uma caixa. É uma mudança pequena com efeito desproporcional na percepção do gesto.

### 13.3 Onde a Recepção acelera e onde deveria desacelerar

A sequência é: *para quem · motivo · história · preferências · informações · revisão*.

**As duas últimas quebram o tom.** "Informações" e "Revisão" saem do registro de conversa e entram no registro de cadastro — e não por acaso: são as etapas onde a plataforma efetivamente precisa de dados. É a passagem mais frágil do ambiente.

**Recomendação de direção.** Se dados operacionais precisam ser pedidos, eles não podem vir **depois** da história, como um pedágio no fim da conversa. Deveriam vir **antes** dela, breves e declaradamente burocráticos ("Duas coisas rápidas antes de começarmos"), de modo que a conversa termine na história — que é o que a pessoa quer que fique por último.

Terminar a Recepção em "Revisão" faz a última impressão do ato de se abrir ser a de conferir um cadastro. **Terminar na história faria a última impressão ser a de ter falado.** É uma reordenação de fluxo, portanto **não é decisão de arte** — está registrada como recomendação que depende de validação de produto.

### 13.4 O silêncio necessário

Depois que a pessoa escreve o motivo, a tela não deveria ter mais nada abaixo do botão. Hoje há uma linha divisória, os botões, e depois o rodapé institucional inteiro. §9.2: sob uma decisão, o espaço fica vazio.

### 13.5 O corte que não acontece

Este é o problema mais sério da Recepção, e não está na tela — está **embaixo** dela.

O rodapé institucional da Fachada continua presente: *"Você não precisa decidir sozinho"*, o logotipo, a navegação, o copyright. Altura de seção, voz de marketing, dirigido a quem ainda não entrou.

**A pessoa já entrou.** Ela está escrevendo por que procurou ajuda. Repetir a promessa institucional ali é a casa se apresentando a quem já está sentado dentro dela — e, pior, é a voz da campanha invadindo o momento mais privado da jornada.

**Recomendação.** A Recepção não tem rodapé institucional. Tem, no máximo, uma linha discreta de saída. O corte Fachada → Recepção precisa ser sentido: a moldura de marketing recua e o ambiente fecha.

Isto exige separar a moldura da Fachada da moldura do wizard. **É mudança estrutural** e está registrada como dependência.

### 13.6 Arquitetura da atenção

| | Hoje | Deveria ser |
|---|---|---|
| **Primeiro olhar** | a pergunta, em serifa | igual — está certo |
| **Segundo olhar** | o campo | igual |
| **Terceiro olhar** | "Você pode deixar em branco" | igual, com mais peso |
| **Descanso** | não existe; o rodapé ocupa o lugar | a faixa vazia abaixo dos botões |
| **Ação principal** | "Continuar" | igual |

Três de cinco corretos, e os dois errados são o mesmo problema: o rodapé ocupa o lugar do silêncio.

---

## 14 · JORNADA DO PACIENTE

> **Emoção dominante:** construção.
> **A frase que ela deveria poder dizer:** *"Minha história está sendo montada, e eu vejo isso acontecendo."*

### 14.1 A resposta à pergunta do prompt

*A jornada parece uma conversa ou um cadastro?*

**Conversa** — mas uma conversa em que a outra pessoa está calada há um tempo.

O acerto: a home não pede nada. Não há campo, não há barra de completude, não há "faltam 3 itens". Duas superfícies: o que ela já começou, e o que ainda não começou — com a explicação do porquê. Para um produto de saúde, isso é raro e é correto.

### 14.2 O primeiro texto da tela é um rótulo

A página abre com `SUA JORNADA` — em caixa alta, com tracking largo, em verde, **acima do nome dela**.

Isso quebra P5 por dois centímetros de composição. O primeiro texto legível da casa de uma pessoa não pode ser uma etiqueta de seção. Além disso, caixa alta com tracking é a tipografia de **rótulo de sistema** — exatamente a voz que não deveria abrir o ambiente mais íntimo do produto.

**Recomendação.** O nome dela abre a tela. Se o rótulo de contexto for necessário, ele vai **abaixo** do cumprimento, em corpo pequeno e caixa normal. A ordem correta é: *"Olá, Paciente Teste." → "Boa noite. Estamos por aqui."* — e nada antes disso.

*(A caixa alta é um problema transversal de 83 ocorrências, já documentado como rodada própria. Aqui ela é citada porque, neste ponto específico, o custo não é tipográfico — é de hierarquia emocional.)*

### 14.3 A frase mais importante está no menor corpo

*"Você pode fechar esta página com tranquilidade."*

É a frase que efetivamente tira peso das costas de quem está esperando — a única da tela que executa a missão declarada na §1. Está no menor corpo tipográfico do bloco, abaixo de dois parágrafos maiores, tratada como nota de rodapé.

**Recomendação.** Ela sobe. Não precisa ser grande; precisa não ser **menor** que a informação operacional em volta. Peso emocional não pode ser subordinado a peso informativo (§10.2).

### 14.4 Os dois cartões têm o mesmo peso e não deveriam

A tela tem duas superfícies: "Sua história continua aqui" (com ação) e "Sua Curadoria ainda não começou" (sem ação). Têm altura, largura e presença semelhantes.

Mas eles não são iguais em natureza: **um é a vez dela; o outro é a vez de outra pessoa.** Essa é a informação mais importante da tela (§10.1, item 3), e a composição não a expressa.

**Recomendação.** O bloco que é a vez dela tem material de superfície ativa — papel claro, borda definida, ação visível. O bloco que é a vez de outra pessoa **não é um cartão**: é texto com ar, recuado, com o fio lateral que já tem. A diferença de material comunica de quem é a vez sem uma palavra. Hoje o fio lateral já faz metade desse trabalho; a caixa desfaz a outra metade.

### 14.5 O rodapé duplicado

A página termina repetindo, como links, os mesmos itens da navegação do topo. Repetição sem hierarquia é ruído; e um fim que parece um começo alonga a percepção da página. **Remover** (§9.3).

### 14.6 Sobre a sensação de progresso

Este é o ponto mais delicado do ambiente, e onde a direção precisa ser explícita.

A tentação será dar à pessoa uma **linha do tempo com etapas marcadas**. Isso parece serviço e é, na verdade, ansiedade embalada: uma trilha com etapas visíveis é uma fila (P1), e transforma cada visita numa conferência de "andou ou não andou".

**A alternativa correta:** progresso comunicado como **acúmulo**, não como avanço. Não "etapa 3 de 6", mas "o que já existe da sua história": o que ela contou, o que já foi lido, o que já foi escrito por alguém. Uma pilha que cresce, não uma régua que preenche.

A diferença emocional é enorme. Uma régua diz *quanto falta*. Uma pilha diz *quanto já é seu*. A Aliviar deveria mostrar a pilha.

### 14.7 Arquitetura da atenção

| | Hoje | Deveria ser |
|---|---|---|
| **Primeiro olhar** | `SUA JORNADA` (rótulo) | "Olá, [nome]." |
| **Segundo olhar** | o nome | o bloco que é a vez dela |
| **Terceiro olhar** | o botão azul | o bloco de espera, como texto |
| **Descanso** | acidental, antes do rodapé | faixa dimensionada entre os dois blocos |
| **Ação principal** | "Continuar minha história" | igual — está certo |

---

## 15 · CURADORIA

> **Emoção dominante:** reflexão.
> **A frase que ela deveria poder dizer (o Curador, aqui):** *"Tenho tempo para pensar neste caso."*

### 15.1 A resposta à pergunta do prompt

*Parece um grupo de especialistas refletindo, ou uma ferramenta administrativa?*

**Nem uma coisa nem outra — hoje parece uma sala de espera vazia.**

Preciso ser honesto sobre o limite desta análise: **só foi possível capturar a Curadoria em estado vazio.** O ambiente local não tem Rede real, então nunca vi a Mesa com um caso dentro. Tudo que se segue vale para o estado observado; a análise de densidade, agrupamento e destaque com conteúdo real está declarada como pendente na §23.

O que dá para dizer com base no que foi visto:

**Acerta o tom.** *"Bom dia, Curador."* em serifa, ausências que explicam em vez de acusar, zero semáforo, zero contador. O vocabulário está certo.

**Erra a composição.** O conteúdo ocupa a metade esquerda da tela; os ~45% da direita não fazem nada. Isso é **sobra**, não silêncio (§9.1) — e sobra lateral comunica exatamente o oposto de reflexão: comunica que a ferramenta foi feita para outra largura.

**Os dois blocos têm peso idêntico.** "Ainda não há Curadorias na sua fila" e "Nenhuma Curadoria esperando" são dois avisos empatados, sem primeiro nem segundo olhar. O olho não sabe qual ler primeiro, e nenhum dos dois é mais importante — o que é, em si, o defeito: se nada é mais importante, a tela não tem hierarquia.

### 15.2 Como deveria ser composta

**A Mesa não é uma lista de trabalho. É uma mesa de trabalho.**

A diferença de composição é concreta:

- Uma **lista** é uma coluna de itens equivalentes, alinhada à esquerda, que cresce para baixo. Comunica: *aqui está o que está pendente para você.*
- Uma **mesa** é uma superfície com um objeto em foco e o contexto disposto em volta. Comunica: *aqui está o caso que você está examinando.*

A fila deveria abrir com **um caso em foco** — o que o Curador estava vendo por último, ou o próximo que ele mesmo escolheu — ocupando a largura de leitura, com os demais dispostos como referência secundária. Não porque isso seja mais eficiente, mas porque **reflexão é uma atividade sobre um objeto, não sobre um conjunto**.

Uma superfície que mostra doze casos igualmente pede triagem. Uma superfície que mostra um caso e menciona onze pede pensamento.

### 15.3 Quanto silêncio ela precisa

Menos do que a casa da paciente, e por bom motivo: o Curador trabalha horas seguidas, e vazio excessivo em ferramenta de trabalho vira quilometragem de rolagem. O alvo de ~50% da casa dela não se aplica aqui.

**O que a Mesa precisa não é de mais vazio — é de vazio no lugar certo.** Concretamente:

- **Silêncio em volta do objeto em foco.** O caso que está sendo examinado tem ar em volta; o resto pode ser denso.
- **Nenhum silêncio lateral.** A sobra de 45% à direita deve ser ocupada por contexto persistente (a história dela, as prioridades declaradas) ou a medida de leitura deve ser recentrada. Um dos dois — nunca ficar como está.
- **Silêncio antes de cada decisão.** Onde o Curador registra um julgamento, há ar acima. Mesmo em ambiente denso, decisão pede pausa.

### 15.4 Onde o olhar deve descansar

Na **história dela**. Este é o ponto mais importante deste capítulo.

O ponto de descanso da Mesa do Curador deve ser um trecho da narrativa da pessoa, em serifa, sempre visível ou sempre a um gesto de distância. Não como referência de consulta — como **âncora emocional do trabalho**.

Um Curador que passa oito horas em superfícies de análise precisa que a tela lembre, no repouso do olhar, de quem é o caso. É a diferença entre processar registros e cuidar de pessoas, e é uma decisão de composição, não de conteúdo: o mesmo texto, colocado como ponto de descanso em vez de campo de dados, muda a natureza do trabalho.

### 15.5 O que a Curadoria nunca deve exibir

Já vale por regra permanente, mas em direção criativa há um acréscimo: **nunca exibir volume de análise**. Nada de "12 critérios avaliados", "38 profissionais considerados", "análise 100% completa".

Volume é competência exibida (§2.1), e competência exibida convida auditoria. Além disso, volume é somável pelo olho (P4). A Curadoria comunica rigor por **tempo dedicado** — espaço, silêncio, escrita corrida —, jamais por contagem.

### 15.6 Arquitetura da atenção

| | Hoje (estado vazio) | Deveria ser |
|---|---|---|
| **Primeiro olhar** | "Bom dia, Curador." | o caso em foco |
| **Segundo olhar** | dois avisos empatados | a história da pessoa |
| **Terceiro olhar** | — | o próximo passo do método |
| **Descanso** | a sobra à direita (acidental) | a narrativa dela |
| **Ação principal** | ausente | o julgamento da etapa atual |

---

## 16 · SALA DA DECISÃO

> **Emoção dominante:** segurança.
> **A frase que ela deveria poder dizer:** *"Eu entendi, e a escolha é minha."*

### 16.1 Declaração de limite — o que eu não vi

**Não há uma única captura deste ambiente.**

A Sala da Decisão só existe quando há uma Curadoria entregue com três caminhos, e o ambiente local não tem Rede real para produzir esse estado. Das dezenove telas capturadas, nenhuma é dela.

Este é o ambiente que o próprio briefing define como o mais importante da plataforma. Escrever uma crítica visual dele a partir do código seria a única seção deste livro sem lastro no que a pessoa vê — e seria a pior possível para não ter esse lastro. **Não vou fazer isso.**

**O que segue é direção — o que a tela deve produzir — e não crítica do que ela produz.** A crítica fica pendente, e a §23 lista exatamente o que ela depende.

### 16.2 O que esta tela deve fazer a pessoa sentir

Uma coisa só: **que a escolha é dela, e que ela tem o que precisa para fazê-la.**

Nem alívio, nem entusiasmo, nem gratidão. **Segurança** — que é uma emoção fria, sóbria, e a única adequada ao momento. Uma pessoa que sai desta tela empolgada foi persuadida; uma pessoa que sai aliviada foi poupada de pensar. Nenhuma das duas escolheu.

O sinal de sucesso é comportamental e específico: **a pessoa deveria ser capaz de explicar a escolha dela para outra pessoa, com as próprias palavras, no dia seguinte.** Se ela consegue dizer *"escolhi a Dra. X porque para mim o mais importante era ter com quem falar entre as consultas, e ela é a que faz isso"*, a tela funcionou. Se ela só consegue dizer *"escolhi a que parecia melhor"*, a tela falhou — mesmo que a escolha tenha sido a mesma.

### 16.3 Os quatro princípios de composição desta sala

**Um. Nada se soma.** É a sala onde P4 é vida ou morte. Três colunas de mesma largura, com marcas equivalentes, produzem um placar mesmo que nenhuma palavra seja comparativa. As alturas irregulares, proporcionais à importância declarada por ela, não são um detalhe estético — são a estrutura que impede a soma.

**Dois. O comum vem antes da diferença.** Antes de qualquer divisão, existe uma superfície inteira e indivisa com o que os três compartilham. Quem lê primeiro o indiviso lê as diferenças abaixo como **variação dentro de um conjunto válido**, não como vantagem e desvantagem. Esta é a decisão de composição mais importante da plataforma inteira, e ela é puramente sequencial: a mesma informação, na ordem invertida, produziria um ranking.

**Três. Setenta por cento de vazio.** É a sala com mais silêncio de toda a plataforma. Não por elegância — por **função**: o vazio abaixo de uma escolha é o que impede a tela de empurrar. Preencher o espaço sob o gesto é a definição física de pressão.

**Quatro. A hierarquia é dela.** O que ela declarou mais importante ocupa mais espaço vertical e corpo maior. Sempre. Mesmo quando a informação sobre esse item é curta e sobre outro é longa. A tela é o retrato das prioridades dela, não da nossa arquitetura de informação.

### 16.4 A atmosfera: a sala que abre mão de cor

Esta é a única sala que **renuncia à atmosfera cromática de propósito**. Volta ao papel neutro, com azul e verde em equilíbrio exato.

A razão é de direção, não de sistema: qualquer inclinação cromática seria a Aliviar colocando o dedo na balança. Se o ambiente fosse azul, a orientação da plataforma teria mais presença que a escolha dela; se fosse verde, o caminho já percorrido teria. **A sala é neutra porque a decisão é dela.**

Que o ambiente com mais peso emocional da plataforma seja também o mais silencioso em cor é, provavelmente, a decisão mais madura de todo o sistema visual.

### 16.5 A luz

Aqui o Sistema Visual pede o contraste mais **baixo** da jornada e luz difusa — e é contraintuitivo o bastante para merecer justificativa.

O impulso natural seria iluminar o clímax. Mas contraste alto dirige o olhar, e dirigir o olhar numa tela de escolha é escolher pela pessoa. A Sala da Decisão precisa de luz **uniforme**: nenhum dos três caminhos recebe mais luz que os outros, nada se destaca sozinho, nada pisca, nada anima ao entrar.

A calma é fisicamente construída. É o oposto de um clímax cinematográfico, e é o clímax correto para este filme.

### 16.6 O que esta sala nunca pode ter

Total, subtotal, contagem, "X de Y". Coluna ou linha de resumo. Qualquer possibilidade de reordenar. Cor por profissional. Ícone de estado. Barra, círculo preenchido, escala, medidor. Destaque de qualquer coluna. Animação de entrada. Recomendação. Sugestão. "Mais compatível". Qualquer superlativo.

E — o mais importante — **não pode haver lugar onde um total caberia**. A ausência precisa ser estrutural: a matriz termina na última linha, e o que vem depois são os retratos em prosa. Ninguém "esquece" de somar quando não há onde.

### 16.7 Arquitetura da atenção pretendida

| | Deveria ser |
|---|---|
| **Primeiro olhar** | o enquadramento em três frases — *"estes três atendem a tudo o que era indispensável"* |
| **Segundo olhar** | a faixa do comum, indivisa |
| **Terceiro olhar** | a matriz, subordinada à faixa |
| **Descanso** | o vazio abaixo dos retratos em prosa |
| **Ação principal** | a escolha — precedida de vazio, nunca cercada de conteúdo |

---

## 17 · CONCIERGE

> **Emoção dominante:** continuidade.
> **A frase que ela deveria poder dizer:** *"Não acabou quando eu escolhi."*

### 17.1 A resposta à pergunta do prompt

*Como transformar "existe um acompanhamento" em "continuo acompanhada"?*

A diferença entre as duas é a diferença entre **um registro** e **uma presença**. E ela é inteiramente de composição.

Um registro é uma lista de eventos com data. Uma presença é alguém que aparece.

### 17.2 O que foi possível observar

Como na Curadoria, capturei a varanda **vazia**. O tom está certo — calmo, honesto, as ausências explicam. A atmosfera azul chegou. Mas uma varanda vazia não permite avaliar o que ela comunica quando há alguém sentado nela.

### 17.3 As três decisões de direção que fazem continuidade

**Um. A continuidade tem um rosto, não um status.**

O erro que este ambiente vai cometer, se ninguém impedir, é virar uma lista de estados: *contato iniciado · aguardando retorno · consulta marcada*. Isso é um registro. A alternativa é que cada momento seja atribuído a **alguém**: *"[Nome] falou com o consultório da Dra. X na terça."*

Mesma informação, natureza oposta. Estado é o que o sistema sabe; frase com sujeito é o que uma pessoa fez. A regra: **nenhum momento da continuidade aparece sem alguém que o tenha praticado.**

**Dois. A memória é de momentos, não de registros.**

Uma linha do tempo com ícones por categoria, datas longas e rótulos de tipo lê como log. A mesma sequência escrita em prosa, em serifa, com data discreta na margem, lê como memória.

A diferença emocional: um log diz *"isto foi registrado"*. Uma memória diz *"isto aconteceu com você"*. A Aliviar deveria guardar memórias.

**Três. O silêncio precisa ser dito.**

O momento mais delicado da continuidade é quando **nada está acontecendo**. Semanas podem passar. Uma varanda que fica igual por três semanas comunica abandono, mesmo que nada esteja errado.

A tentação será preencher com atividade fabricada — "verificamos seu caso", notificações de nada. Isso é ruído disfarçado de cuidado, e a pessoa percebe.

**A alternativa correta é nomear o silêncio.** Uma frase que diga que não está acontecendo nada, por que isso é esperado, e quem está de olho. É o mesmo movimento que a casa da paciente já executa bem com *"Nada aqui depende de você agora"* — o padrão existe e precisa ser estendido a este ambiente.

### 17.4 A leveza

Este é o único ambiente que deveria parecer **doméstico**. A jornada difícil terminou; o que resta é convivência.

Concretamente: corpo tipográfico ligeiramente maior que o operacional, entrelinha mais generosa, menos elementos por tela do que qualquer outro fundo, e nenhuma tabela — jamais uma tabela nesta superfície. Tabela é a forma de quem administra; a varanda é de quem acompanha.

### 17.5 Arquitetura da atenção

| | Deveria ser |
|---|---|
| **Primeiro olhar** | o momento mais recente, em prosa |
| **Segundo olhar** | quem o praticou |
| **Terceiro olhar** | a memória anterior, recuada por luz |
| **Descanso** | o ar entre o momento atual e a memória |
| **Ação principal** | frequentemente nenhuma — e isso é correto |

Um ambiente sem ação principal é legítimo aqui. Continuidade não é uma tarefa.

---

## 18 · ADMINISTRAÇÃO

> **Emoção dominante:** controle.
> **A frase que quem opera deveria poder dizer:** *"Eu sei o estado da operação sem procurar."*

### 18.1 A resposta à pergunta do prompt

*Como transformar uma área administrativa em algo premium, sem perder eficiência e sem parecer ERP?*

A resposta não é decorar o painel. É **mudar o que ele responde**.

Um ERP responde *"o que existe?"* — e por isso mostra tudo, em tabelas, com filtros. Uma superfície premium responde *"o que mudou e o que exige você?"* — e mantém todo o resto acessível sem estar presente.

A diferença não é estética; é editorial. Premium, em ferramenta de trabalho, é **curadoria do que aparece**. Exatamente o que a empresa vende.

### 18.2 O que a tela transmitia

O oposto de controle. A Visão geral abria com **doze indicadores idênticos**, cada um com um `0` em serifa grande e escura, seguidos de **seis cartões de gráfico** dizendo "Ainda não há dados neste período". Dezoito blocos de nada, todos com o mesmo peso.

O problema não era a ausência de dados — uma operação em repouso tem zeros, e escondê-los seria pior. O problema era a **hierarquia invertida**: numa tela cuja primeira seção se chama literalmente *"Onde agir agora"*, o dado mais vazio era o objeto mais pesado. O olho percorria doze ausências antes de encontrar qualquer coisa acionável.

Isso não comunica controle. Comunica sistema quebrado.

**Já corrigido:** o zero recuou de peso — tinta suave, corpo menor, peso regular — e continua inteiro e legível. Números com valor mantêm corpo e cor cheios; os que pedem ação mantêm o dourado de atenção.

### 18.3 As três camadas de leitura

A correção acima trata o sintoma. A cura é estrutural, e é a recomendação central deste capítulo.

Uma superfície de controle precisa de **três camadas**, lidas em tempos diferentes:

**Camada 1 — O que exige você agora.** No máximo três coisas. Sempre com sujeito e verbo, nunca só um número: *"Dois casos sem responsável há mais de um dia."* É a única camada que merece peso tipográfico alto. Se não há nada, a camada diz isso em uma frase — e essa frase é uma boa notícia, não um estado vazio.

**Camada 2 — O estado da operação.** Os números de contexto. Densidade média, peso baixo, agrupados por assunto. Existem para consulta, não para convocação.

**Camada 3 — A profundidade.** Gráficos, séries, distribuições. **Não deveriam estar na primeira tela.** Um gráfico é uma pergunta que alguém foi fazer; oferecer seis gráficos a quem não perguntou nada é ruído com aparência de rigor.

Hoje as três camadas estão **achatadas em uma só**, com peso quase uniforme. É esta a razão de a tela parecer ERP — não a densidade, mas a **falta de estratificação**.

### 18.4 A assinatura de composição dos fundos

Para a Administração passar no teste do logotipo apagado, precisa de uma marca de composição própria. Proponho três, específicas e verificáveis:

**Um. O número é serifado; o rótulo é sem-serifa.** Já acontece, e é mais distintivo do que parece — praticamente nenhum painel operacional usa serifa em dado. Estender consistentemente: todo número da instituição é serifado, sempre.

**Dois. Nenhum cartão-caixa. Fios e espaço.** Painéis genéricos são grades de caixas com sombra. A Aliviar separa por fio de 1px e por espaço. Só isso já torna a tela irreconhecível como CRM à primeira vista.

**Três. Cada agrupamento traz uma pergunta em vez de um título.** Já existe em parte — *"A carga está distribuída entre os três níveis, ou concentrada em alguém?"* é infinitamente mais Aliviar do que "Casos por responsável". **Isto é a melhor decisão da Administração hoje e ninguém a nomeou como padrão.** Deveria ser regra: todo bloco operacional é introduzido pela pergunta que ele responde, na voz da casa.

Uma tela que pergunta em vez de rotular é reconhecível sem logotipo. É exatamente a mesma postura que a plataforma tem com a paciente, aplicada a quem opera — e é o que faz os fundos pertencerem à mesma instituição, não só à mesma paleta.

### 18.5 O que remover

**A repetição em "Atividade recente".** Oito linhas quase idênticas — *"Sistema revogou o papel Paciente" / "Admin Teste concedeu o papel Paciente"* — com o mesmo horário. Mesmo sendo artefato de dados de teste, revela que a lista não agrupa eventos idênticos consecutivos. Em operação real vai ler como log. Agrupar é mudança de conteúdo e está registrada como dependência.

**Os seis gráficos vazios da primeira tela.** Camada 3 (§18.3).

### 18.6 Arquitetura da atenção

| | Hoje | Deveria ser |
|---|---|---|
| **Primeiro olhar** | os zeros (corrigido) | a frase do que exige ação |
| **Segundo olhar** | o cumprimento | os números com valor |
| **Terceiro olhar** | disperso entre 18 blocos | pendências e atividade |
| **Descanso** | não existe | as faixas entre grupos |
| **Ação principal** | ambígua | ir ao caso que exige ação |

---
---

# PARTE V — IDENTIDADE

---

## 19 · O que faz uma tela parecer Aliviar

Lista objetiva. Uma tela que cumpre estes doze itens é reconhecível como Aliviar mesmo sem logotipo. Uma tela que falha em três ou mais não é da casa, por mais correta que esteja.

1. **O primeiro texto legível é alguma coisa que vem da pessoa** — o nome dela, uma frase dela, uma prioridade dela. Nunca um rótulo.
2. **A serifa aparece onde uma pessoa escreveu; a sem-serifa onde o sistema organizou.** E nunca as duas na mesma frase.
3. **O fundo é papel quente, nunca branco puro.** O texto é tinta escura, nunca preto puro.
4. **Não existe nenhum par verde/vermelho.** Nenhum ícone de certo ou errado, nenhuma cor que julgue.
5. **Nada na tela pode ser somado ou contado pelo olho.**
6. **A espera do sistema está dita em palavras**, não em barra nem spinner.
7. **Pelo menos um terço da tela é vazio deliberado** — e o maior vazio tem função declarada.
8. **A ausência tem o mesmo peso do dado** nas superfícies da pessoa.
9. **Existe uma frase que remove pressão** em vez de adicionar — e ela não está no menor corpo da tela.
10. **Há um sujeito humano nomeado em algum lugar.** Um Curador, um Concierge, alguém.
11. **Toda ação secundária é visivelmente mais leve que a principal**, e há exatamente uma principal.
12. **Nenhuma palavra do vocabulário do software aparece** em superfície da pessoa.

### 19.1 O teste dos três segundos

Mostre a tela por três segundos a alguém que não conhece a Aliviar e pergunte o que é.

**Falha** se a resposta contiver: sistema, painel, plataforma, app, dashboard, cadastro, portal.

**Passa** se contiver: documento, carta, página, consultório, alguma coisa de um lugar que cuida.

### 19.2 O teste do print em papel comum

Imprima a tela em preto e branco, numa impressora comum, sem cor.

**Se ainda funcionar** — se a hierarquia continuar clara, se der para saber de quem é a vez, se o que importa continuar sendo o que salta —, a tela está construída sobre composição.

**Se desmontar**, ela estava construída sobre cor. E cor é a primeira coisa que se perde: em impressão, em modo de alto contraste, em daltonismo, e na memória de quem viu a tela ontem.

---

## 20 · Psicologia por ambiente

Como cada ambiente deve ser **percebido** — em emoção, não em recurso visual.

**Fachada → confiança.**
A sensação de entrar num escritório antigo e bem cuidado, onde ninguém veio te abordar na porta. Silêncio profissional. A percepção de que este lugar existiria mesmo se você não tivesse entrado — o que é, precisamente, o que distingue uma instituição de uma campanha.

**Recepção → acolhimento.**
Alguém puxou uma cadeira antes de você pedir. A percepção de que a conversa está no seu ritmo, de que você pode não responder, e de que ninguém está preenchendo nada enquanto você fala.

**Jornada → construção.**
A sensação de voltar a um lugar onde deixaram suas coisas exatamente como você deixou. Nada cobrando, nada expirando. A percepção de que algo está sendo montado com o que você deu — e que isso é seu.

**Curadoria → reflexão.**
A percepção de um profissional que fechou a porta para pensar no seu caso. Não velocidade, não volume, não rigor exibido: **tempo dedicado**. A sensação de que alguém está demorando de propósito.

**Sala da Decisão → segurança.**
Uma sala com um objeto e muito espaço em volta. A percepção de que ninguém está te empurrando, de que ninguém prefere nada, e de que você tem o que precisa. Fria, sóbria, sem alívio prematuro — porque a decisão ainda é sua e precisa continuar sendo.

**Concierge → continuidade.**
A varanda de quem já mora na casa. A percepção de que a relação não terminou no ato, de que existe alguém de olho, e de que o silêncio é normal quando alguém te avisou que seria.

**Administração → controle.**
A mesa de quem chegou cedo e já sabe o que vai fazer. A percepção de que nada está escondido e nada está gritando — e de que a superfície separou, por você, o que exige ação do que apenas existe.

---

## 21 · Os testes de aceitação

Toda tela nova responde estas dez perguntas **antes** de existir. As sete primeiras herdam do Sistema Visual; as três últimas são desta rodada.

1. Que ambiente é este, e a luz corresponde?
2. Que estado emocional a pessoa deve ter ao sair daqui?
3. Existe algo aqui que possa ser somado ou contado pelo olho?
4. Alguma cor está julgando alguma coisa?
5. O que é voz humana está em serifa, e o que é sistema em sem-serifa?
6. A hierarquia visual é a dela ou a nossa?
7. Se eu tirar 30% do conteúdo, a tela piora? Se não piora, tire.
8. **Depois desta tela, a pessoa carrega mais ou menos do que antes?**
9. **Qual é o ponto de descanso, e ele está dentro da região de leitura?**
10. **Qual é o primeiro texto legível, e ele vem dela ou do sistema?**

A oitava é a que define a empresa. A sétima continua sendo a que mais dói.

---
---

# PARTE VI — O QUE FAZER COM ISTO

---

## 22 · Ordem de trabalho

Sequência recomendada, por retorno emocional sobre esforço. **Nenhum item é uma ordem de implementação** — este livro não decide execução.

**Primeiro: a travessia com nome (§11.4).** É a maior conversão de identidade pelo menor custo, e é o único item da lista que sozinho move a resposta do teste do logotipo apagado de "quase" para "sim".

**Segundo: o corte Fachada → Recepção (§13.5).** Tirar a moldura de marketing do momento mais íntimo da jornada. Depende de separar as duas molduras — estrutural.

**Terceiro: as inversões de hierarquia da casa da paciente (§14.2, §14.3, §14.4).** Três correções pequenas de composição, alto retorno: o nome antes do rótulo, a frase que alivia acima da que informa, e o material que diz de quem é a vez.

**Quarto: as três camadas da Administração (§18.3).** É o que transforma o painel de ERP em superfície de controle.

**Quinto: o ritmo da Fachada (§7.4, §12.5).** Fundir dois blocos rasos numa passagem densa. Depende de decisão de conteúdo.

**Sexto: a Mesa como mesa (§15.2).** Depende de ver a Curadoria com um caso real.

**Sétimo: a caixa alta transversal.** 83 ocorrências, rodada própria, já documentada.

---

## 23 · O que este livro deliberadamente não decide

Registro explícito, para que nenhuma ausência aqui seja lida como esquecimento.

**Não decide sobre a Sala da Decisão a partir de observação.** Nunca a vi. A §16 é direção, não crítica. Para criticá-la de verdade é preciso um caso com Curadoria entregue no ambiente local, com três caminhos e um Mapa de Correspondência real. **É a lacuna mais importante deste documento.**

**Não decide sobre a Mesa do Curador com conteúdo.** Só a vi vazia. Densidade, agrupamento e destaque com um caso dentro permanecem sem base empírica.

**Não decide sobre a varanda do Concierge com histórico.** Mesma limitação.

**Não decide fluxo.** A reordenação da Recepção (§13.3) — dados antes da história, para que a conversa termine na história — é recomendação de direção que depende de validação de produto e de domínio.

**Não decide conteúdo.** O bloco do Curador com rosto e nome na Fachada (§12.6) depende de uma pessoa real, de uma fotografia real e de decisão de privacidade. O agrupamento de eventos em "Atividade recente" (§18.5) é mudança de conteúdo.

**Não decide implementação.** Nenhuma linha deste livro é uma especificação técnica. Onde ele parecer descrever um componente, está descrevendo um efeito percebido — e a forma de obtê-lo é decisão de quem constrói.

---
---

## Encerramento

Este livro foi escrito a partir de dezenove telas reais, olhadas como se olha um copião: procurando o que a pessoa sente, não o que está errado.

O que ele encontrou não foi feiura. Foi **inversão** — coisas certas em ordem errada. A frase que alivia colocada como nota de rodapé. O rótulo do sistema colocado antes do nome de quem chegou. O dado ausente com o peso de uma conquista. A voz da campanha dentro do quarto onde alguém estava se abrindo.

Nenhuma dessas coisas é um defeito visível. São todas defeitos **sentidos** — e é por isso que precisavam de um documento de direção, e não de uma lista de correções.

> **Se todo o logotipo da Aliviar desaparecesse hoje, alguém reconheceria esta interface?**
>
> Hoje: quase. A voz já é inconfundível, a alternância serifa/sem-serifa já assina, e a ausência de semáforo já é rara o bastante para ser marca.
>
> O que falta não é mais identidade visual. É **um gesto** — a travessia que diz o nome do cômodo em que se entra —, **uma unidade de tempo** entre a fachada e o produto, e **uma assinatura de composição** para os fundos: a pergunta no lugar do rótulo.
>
> Com essas três, a resposta vira sim. E uma pessoa que use a Aliviar por dez minutos vai sair sabendo que esteve num lugar — não numa tela.
