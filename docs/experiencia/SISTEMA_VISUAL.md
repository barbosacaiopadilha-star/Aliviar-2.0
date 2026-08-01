# Sistema Visual da Aliviar — Fase 2

> **Status:** linguagem visual. Não é interface, não é componente, não é tela, não é código.
> **Herda:** [ARQUITETURA_DA_EXPERIENCIA.md](./ARQUITETURA_DA_EXPERIENCIA.md) (Fase 1, aprovada) sobre a arquitetura operacional congelada.
> **Data:** 2026-08-01

---

# 1 · Manifesto Visual

**Um sistema visual de saúde normalmente resolve um problema de densidade:** como caber muita informação em pouco espaço. O nosso resolve o oposto — **como fazer pouca informação ocupar o espaço que ela merece.**

Sete decisões fundam esta linguagem:

**A superfície absorve luz, nunca reflete.** Tudo que brilha parece tecnologia. Tudo que é fosco parece objeto — e objetos se guardam, telas se fecham.

**A cor nunca julga.** Não existe verde de aprovado nem vermelho de reprovado nesta plataforma. A paleta inteira foi construída para tornar impossível o semáforo.

**A tipografia tem função moral.** A serifa carrega voz humana; a sem-serifa carrega função de sistema. Quando a pessoa lê algo em serifa, alguém escreveu aquilo. Isso é promessa, não estilo.

**A hierarquia visual é a hierarquia dela.** O que ela declarou mais importante ocupa mais espaço. Sempre. A tela é uma projeção das prioridades dela, não da nossa arquitetura de informação.

**Nada se soma no olho.** Nenhum elemento repetido, contável ou empilhável representa qualidade. Se pode ser contado, vira placar.

**O vazio é estrutura, não sobra.** Ele é dimensionado com a mesma disciplina que o conteúdo.

**Cada elemento significa uma coisa e sempre a mesma coisa.** Um cartão é sempre um cartão. Profundidade sempre quer dizer o mesmo. Nada existe por beleza.

---

# 2 · Linguagem arquitetônica

Cinco arquiteturas informam a Aliviar. O fio que as une: **são todos lugares onde uma pessoa espera ou se concentra sem se sentir processada.**

**A clínica contemporânea que não parece hospital.** Recepção com mesa, não balcão. Materiais domésticos onde a norma seria inox. Nenhuma sinalização de emergência à vista. *O que tomamos:* a prova de que precisão clínica e calor não se opõem — que se pode ser rigoroso sem ser frio.

**A hotelaria de pequeno porte.** Quem recebe sabe seu nome antes de você dizer. O ambiente foi preparado antes da sua chegada. Não há fila, não há senha, não há formulário na entrada. *O que tomamos:* a sensação de ter sido esperado — o núcleo emocional da Recepção.

**A arquitetura residencial bem iluminada.** Janela grande, luz lateral, móveis que envelhecem bem. Nada de espetacular; tudo confortável de habitar por horas. *O que tomamos:* a luz e a escala. Uma sala de estar é o oposto de um dashboard: você fica nela sem tarefa.

**A sala de leitura de biblioteca.** O silêncio não é imposto — é um acordo entre quem está ali. Mesas amplas, cada pessoa com seu espaço, ninguém interrompendo ninguém. *O que tomamos:* o silêncio visual como pacto, e a mesa ampla como superfície de trabalho respeitosa. A Mesa de Comparação nasce daqui.

**A sala de um objeto só, do museu.** Uma peça, muito espaço em volta, luz dirigida apenas a ela. O vazio existe para que você olhe. *O que tomamos:* a coragem de dedicar uma tela inteira a uma decisão — a Sala da Decisão é literalmente isto.

**O que NÃO nos inspira, e por quê:** o aeroporto (fluxo eficiente, pessoa como carga), a farmácia (produto em prateleira, escolha por preço), a agência bancária (mesa que separa, não que aproxima), o coworking (energia, produtividade, ruído).

---

# 3 · Materiais

Materiais digitais são **tratamentos de superfície com significado fixo**. Cada um aparece em um lugar e é proibido em outro.

| Material | O que transmite | Onde aparece | Onde NUNCA aparece |
|---|---|---|---|
| **Papel** | permanência, leitura, algo que se guarda | superfície primária de todo conteúdo: história, Relatório, Mapa, retratos | como fundo de navegação ou controle |
| **Madeira clara** | estrutura acolhedora, envelhecer bem | moldura e enquadramento: cabeçalho do ambiente, faixa do comum na Mesa | jamais em superfície de conteúdo — é o móvel, não o documento |
| **Tecido** | separação suave, absorção de som | fundos de ambiente, áreas de repouso entre blocos | em nada que precise ser lido com precisão |
| **Pedra fosca** | permanência, gravidade, o que não muda | o que foi assinado: Relatório emitido, decisão registrada, proveniência | em qualquer coisa provisória ou editável |
| **Cerâmica** | objeto pequeno e preciso, feito à mão | marcas e indicadores mínimos, o retrato do Curador | como fundo ou superfície ampla |
| **Metal** | precisão fria | **quase nunca** — apenas fios de 1px em separadores estruturais | qualquer superfície, qualquer preenchimento, qualquer botão |
| **Vidro** | **proibido como material** | — | tudo. Sem glassmorphism, sem blur de fundo, sem transparência sobre conteúdo |

**A regra de ouro dos materiais:** nenhuma superfície tem gradiente, brilho especular ou sombra projetada dura. A profundidade vem de **valor e textura**, nunca de sombra dramática.

**A textura obrigatória:** todas as superfícies de papel carregam um grão quase imperceptível — perceptível de perto, invisível a um metro. É o que separa um ambiente caro de um barato, e é a diferença entre "fundo branco" e "papel".

---

# 4 · Luz

A luz é o principal instrumento narrativo deste sistema. **Ela muda ao longo da jornada, e essa mudança é sentida antes de ser notada.**

**Constantes.** Direção sempre lateral-superior, como janela grande à esquerda. Sombras sempre longas, suaves e de baixa opacidade — nunca escuras, nunca duras. Nenhum ambiente usa luz frontal direta (achata tudo e parece flash).

**A progressão da temperatura ao longo da jornada:**

| Ambiente | Temperatura | Contraste | Intensidade | Por quê |
|---|---|---|---|---|
| **Limiar** | neutra-quente | médio | alta | primeira impressão precisa de clareza sem frieza |
| **Recepção** | quente | médio-baixo | alta, ampla | acolher: luz de sala clara em dia bom |
| **Sala Reservada** | mais quente | baixo | média, concentrada | intimidade — a luz fecha em torno da leitura |
| **Mesa** | **a mais neutra** | **o mais alto** | alta, uniforme | comparar exige ver bem; aqui a luz é honesta, não gentil |
| **Sala da Decisão** | quente | **o mais baixo** | média, difusa | nada deve chamar atenção; a calma é fisicamente construída |
| **Acompanhamento** | a mais quente | baixo | média | doméstica — a luz de quem já está em casa |

**A decisão mais importante desta seção:** a Mesa é o único ambiente com luz neutra e contraste alto. Comparar sob luz quente e macia seria estetizar uma decisão difícil. Ali a Aliviar não conforta — ela **mostra com clareza**, e volta a acolher na sala seguinte.

**Modo escuro:** não existe como padrão. A jornada acontece de dia. Se algum dia for oferecido, será preferência explícita, nunca automático por horário — escuridão automática comunica urgência e vigília.

---

# 5 · Paleta

Pensada como ambiente, não como marca. **Nomeada por material, nunca por função** — "papel", não "background-primary"; "tinta", não "text-color". Nome funcional convida uso funcional, e uso funcional leva a dashboard.

## 5.1 A base — 70% de qualquer tela

| Nome | Descrição | Papel |
|---|---|---|
| **Papel** | branco-quente levemente amarelado, nunca puro | superfície de todo conteúdo |
| **Papel recuado** | um passo mais escuro, quase imperceptível | fundo de ambiente, atrás do papel |
| **Linho** | neutro claro acinzentado-quente | áreas de repouso, tecido |
| **Tinta** | marrom-acinzentado muito escuro, **nunca preto puro** | todo texto de leitura |
| **Tinta suave** | a mesma tinta a ~65% | texto secundário, proveniência |

Preto puro sobre branco puro é a assinatura visual do documento burocrático. A dupla papel-tinta é a de um livro bem impresso.

## 5.2 As cores de identidade

| Nome | Descrição | Significado | Onde aparece |
|---|---|---|---|
| **Sage** | verde acinzentado dessaturado *(já vigente no produto)* | continuidade, cuidado, permanência | marcas de identidade, faixa do comum, ações primárias |
| **Argila** | terracota dessaturada, quente | atenção humana, algo a conversar | condições e pendências que pedem conversa — nunca erro |
| **Índigo esmaecido** | azul-acinzentado profundo, fosco | o que foi verificado e assinado | proveniência, autoria, assinatura do Curador |

**Todas as três são dessaturadas.** Cor saturada em interface de saúde produz dois efeitos indesejados: alarme e infantilização.

## 5.3 As proibições cromáticas — a parte mais importante

**Vermelho e verde nunca formam par semântico.** É a proibição fundadora. O par verde-bom/vermelho-ruim é a gramática universal do ranking, e uma única aparição dele destrói o Método na percepção da pessoa.

**Não existe cor de erro** nas superfícies dela. O que em outro produto seria erro, aqui é ou uma condição (argila) ou uma informação ausente (tinta suave). Vermelho só existe em superfícies internas de operação, jamais nas dela.

**Não existe escala cromática.** Nenhuma sequência de tons claro→escuro representando mais→menos. Escala de cor é escala de valor, e valor vira nota.

**Não existe cor por profissional.** Os três nunca recebem cores identificadoras. Cor distingue, e distinguir por cor cria hierarquia inventada — o azul parece mais confiável, o laranja mais alternativo. Os três são papel e tinta, sempre.

## 5.4 As duas famílias que nunca se confundem

Esta é a tradução visual da invariante I-5 da arquitetura congelada, e resolve o problema mais difícil do sistema.

| | **Estado da informação** | **Correspondência com o que importa a ela** |
|---|---|---|
| Pergunta | *quanto se confia neste dado?* | *isto encontra o que ela precisa?* |
| Canal visual | **cor + tipografia marginal** | **textura de linha, na área de conteúdo** |
| Vocabulário | índigo (verificado), tinta suave (declarado), argila (vencido/divergente) | linha contínua, tracejada, pontilhada, ausente |
| Posição | **na margem**, como nota de rodapé | **sob a frase**, no corpo |
| Tamanho | menor que o corpo | mesma medida do corpo |

**Canais diferentes, posições diferentes, gramáticas diferentes.** Confundi-los exigiria esforço deliberado — que é exatamente o nível de proteção que a invariante merece.

---

# 6 · Tipografia

## 6.1 As duas vozes

**Serifa — a voz humana.** Uma serifa de leitura, humanista, com boa cor de texto em corpos médios. Usada em: a história dela, o Relatório, os retratos dos profissionais, as frases do Mapa, as leituras propostas pelo Curador, toda mensagem escrita por uma pessoa.

**Sem-serifa — a função do sistema.** Uma grotesca neutra e discreta, sem personalidade forte. Usada em: rótulos, navegação, botões, metadados, datas, proveniência, estados.

**A regra de alternância, em uma frase:** *se uma pessoa escreveu, é serifa; se o sistema organizou, é sem-serifa.*

**A regra de nunca misturar:** as duas jamais convivem **na mesma frase**. Nunca "Declarado em **14/08** por Dr. Silva" com a data em outra família. A frase inteira pertence a uma voz. Onde as duas se encontram, há **separação espacial** — linhas diferentes, com ar entre elas.

## 6.2 Escala e ritmo

Escala tipográfica em progressão modesta (~1.2). Saltos grandes criam drama; a Aliviar não tem drama.

- **Corpo de leitura:** generoso, entrelinha ~1.65, **medida de 60–68 caracteres**. Ninguém lê notícia difícil em linha longa.
- **Corpo funcional:** um passo menor, entrelinha ~1.5.
- **Títulos de ambiente:** dois a três passos acima, serifa, peso regular — **nunca bold**. Peso pesado é ênfase, e ênfase é urgência.
- **Metadados:** um passo abaixo do funcional, tinta suave, sem-serifa.

**Três regras de ritmo:**

**Um.** O **negrito quase não existe.** Ênfase se faz com espaço e posição, não com peso. Quando indispensável, é em nome próprio ou termo que ela mesma usou.

**Dois.** **Nada em caixa alta** além de siglas. Caixa alta grita, e reduz a legibilidade justamente de quem lê sob estresse.

**Três.** **Alinhamento à esquerda, sempre.** Sem justificado (rios de espaço), sem centralizado em texto corrido (borda esquerda irregular cansa).

---

# 7 · Fotografia

**Quando usar.** No Limiar, para dar lugar ao lugar. Nos retratos dos profissionais. Em detalhes de ambiente que sinalizam cuidado — luz numa mesa, um livro, uma janela.

**Quando não usar.** Em qualquer tela de decisão. Na Sala Reservada (ali o conteúdo é ela; foto disputaria). No Mapa de Correspondência. Nunca como fundo de texto.

**Retrato de profissional — seis regras.** Pessoa real, sempre. Luz natural, ambiente de trabalho real. Enquadramento médio, altura dos olhos, expressão neutra e disponível — **nunca sorriso de catálogo**. Sem jaleco de figurino. Sem fundo removido. Sem retoque que apague idade ou marca; **um rosto real transmite mais confiança que um rosto perfeito.**

**A pessoa atendida nunca é fotografada.** Nem ela, nem representação dela, nem modelo simulando paciente. A Aliviar não ilustra sofrimento — é a regra fotográfica mais importante deste sistema.

**Banco de imagens genérico: proibido, sem exceção.** Uma foto falsa contamina toda a promessa de verdade da plataforma, e a pessoa reconhece uma foto de banco em meio segundo — mesmo sem saber nomear o que reconheceu.

---

# 8 · Iconografia

**A postura:** ícones são a exceção, não o sistema. **Palavra antes de símbolo, sempre.** Onde a maioria dos produtos coloca ícone, a Aliviar coloca a palavra — e onde a palavra basta, o ícone não entra.

**Traço:** linear, espessura única (~1.5px ótico), cantos levemente arredondados, sem preenchimento, sem duotom, sem cor própria (herdam tinta). Nível de detalhe **baixo**: reconhecíveis a 16px, sem detalhe interno.

**Quando usar:** navegação estrutural onde o rótulo se repetiria muito; ações de manipulação direta (fechar, expandir); e como âncora visual em listas longas.

**Quando evitar:** para representar conceito abstrato (confiança, qualidade, cuidado — sempre palavra); para substituir rótulo de ação importante; como decoração de título ou seção; e **jamais como estado de correspondência** — nada de check, X, alerta ou estrela em nenhuma superfície da pessoa.

**Movimento:** ícones não animam. Nunca giram, pulsam ou saltam.

---

# 9 · Movimento

**A regra que resolve tudo:** *movimento existe para explicar de onde algo veio, nunca para chamar atenção.*

**Tempos.** Micro-resposta (algo que ela tocou): ~120ms. Revelação de conteúdo (abrir detalhe): ~240ms. **Travessia de ambiente: ~480ms.** A travessia é deliberadamente o dobro — atravessar uma porta demora mais que andar por uma sala, e é essa diferença que faz o ambiente ser percebido como ambiente.

**Aceleração.** Curva suave de entrada e saída, com desaceleração mais longa que a aceleração — o movimento chega devagar, como objeto pesado assentando. Nunca elástico, nunca salto, nunca *bounce*.

**Direção com significado.** Avançar na jornada desliza para a esquerda; voltar, para a direita. Detalhe expande **no lugar** (não abre por cima) — abrir por cima é modal, e modal é interrupção. Conteúdo novo aparece por opacidade e um deslocamento mínimo, nunca por escala.

**Proibido:** parallax, entrada escalonada de listas, contadores animados, skeleton pulsante (**a espera é dita em palavras**), spinner infinito, confete, qualquer celebração, qualquer animação que se repita sem interação.

**A transição entre ambientes** é o único momento com licença expressiva: a tela anterior se recolhe, há um instante de superfície limpa com o **nome do ambiente que se entra**, e o novo assenta. É o limiar — a respiração da Fase 1, com duração.

---

# 10 · Silêncio visual

**Quanto vazio.** Como alvo de projeto: **~50% de qualquer tela é vazio deliberado**, e na Sala da Decisão passa de 70%. Isso não é resultado de ter pouco conteúdo — é orçamento de espaço definido antes do conteúdo entrar.

**Margens.** Generosas e assimétricas. A margem superior de um ambiente é maior que a inferior (o conteúdo "assenta", não flutua). Margens laterais amplas mesmo em telas grandes: **medida de leitura manda, largura de viewport não.** Uma tela larga ganha mais vazio, não mais conteúdo.

**Quando não preencher — quatro situações:**
1. **Sob decisão importante.** O espaço abaixo de uma escolha fica vazio. Preencher ali é empurrar.
2. **Ao lado de conteúdo emocional.** A história dela nunca divide a tela com outra coisa.
3. **Quando não há o que dizer.** Estado vazio é uma frase curta com muito ar, **nunca uma ilustração com sugestão de próxima ação**.
4. **Entre ambientes.** O limiar é vazio com um nome.

**Como o vazio comunica confiança.** Densidade alta comunica *"temos muito a processar e pouco espaço"* — a estética de quem precisa provar valor por volume. Densidade baixa comunica *"o que está aqui é o que importa"* — só quem confia no próprio conteúdo pode se dar ao luxo de mostrar pouco.

Há um segundo efeito, mais sutil e mais valioso: **o vazio devolve o ritmo à pessoa.** Uma tela cheia impõe a velocidade dela. Uma tela com ar deixa que ela escolha a sua.

---

# 11 · O MAPA DE CORRESPONDÊNCIA — especificação visual completa

O objeto central do sistema. A Fase 1 definiu sua natureza; aqui se define sua forma.

## 11.1 Anatomia, de cima para baixo

**(a) O enquadramento — três frases, serifa, corpo de leitura.** Antes de qualquer elemento gráfico. Sem caixa, sem ícone, sem destaque: apenas texto com ar. *"Estes três atendem a tudo o que era indispensável… não existe uma coluna melhor."*

**(b) A FAIXA DO COMUM — uma superfície única, indivisa.** Material: madeira clara ou sage muito claro. **Não tem colunas.** É uma só superfície horizontal, atravessando toda a largura, listando o que os três compartilham.

Isto é a decisão visual mais importante do Mapa: **antes de existir qualquer divisão, existe uma superfície inteira.** Quem lê primeiro o indiviso lê as diferenças abaixo como variação dentro de um conjunto válido.

**(c) A MATRIZ.** Abaixo da faixa, e visualmente subordinada a ela — menor peso, não maior.

**(d) OS TRÊS RETRATOS EM PROSA.** Fecham o ambiente, em serifa, corpo de leitura, largura de coluna confortável.

## 11.2 A organização da matriz

**Linhas = as prioridades dela, na ordem que ela declarou.** Cada linha começa com a prioridade **na voz dela** — *"Você disse que precisa ter com quem falar entre as consultas."* — em serifa, à esquerda, com largura generosa.

**Colunas = os três, na ordem em que o Curador apresentou.** Larguras idênticas, tratamento idêntico, nomes no mesmo peso. Acima das colunas, uma linha discreta em sem-serifa: *"Na ordem em que [Curador] organizou."*

**As linhas têm ALTURAS DIFERENTES, proporcionais à importância que ela declarou.** A prioridade essencial ocupa mais espaço vertical e corpo tipográfico maior; a menos importante, menos.

Isso serve a dois propósitos simultâneos, e é a peça mais engenhosa do desenho:

1. **A hierarquia visual passa a ser a dela**, literalmente — a tela é o retrato das prioridades dela.
2. **Impede a soma visual.** Uma grade regular convida a contar colunas. Uma grade de alturas irregulares **não produz coluna comparável** — não há alinhamento que permita ao olho totalizar. O anti-ranking está na estrutura, não no aviso.

## 11.3 A célula

Cada célula contém **uma frase curta, específica daquele profissional**, em serifa. Nunca um símbolo, nunca um valor, nunca um ícone.

Frases não se somam num relance; símbolos idênticos, sim. É por isso que a célula é texto.

Sob a frase, **uma linha de apoio fina** — o único codificador visual de correspondência:

| Tratamento da linha | O que diz |
|---|---|
| **Contínua** | a prática registrada encontra o que ela procura |
| **Tracejada** | encontra sob condição, e a condição está dita na frase |
| **Pontilhada** | ainda não foi possível confirmar |
| **Ausente** | não se aplica a este caso |

**Por que textura de linha, e não cor ou preenchimento.** Contínuo, tracejado e pontilhado são **diferenças de textura, não de magnitude**. Não existe intuição de que tracejado seja "menos" que contínuo — enquanto meia-estrela é inequivocamente menos que estrela cheia, e cinza é menos que verde. A textura descreve **natureza**, não **quantidade**. E não se soma: ninguém totaliza tracejados.

**A lacuna tem o mesmo peso de tudo.** Mesma tipografia, mesmo tamanho, mesma cor de tinta, mesma altura de célula. Pontilhado não é apagado — é uma linha presente, com outra textura. Desenhar ausência como falta a transformaria em desvantagem, e desvantagem é a semente do ranking.

## 11.4 O estado da informação, na margem

À direita de cada célula, **na margem**, em sem-serifa mínima: *verificado em 20/08* · *declarado* · *verificação vencida*. Cor da família de informação (índigo, tinta suave, argila).

**Está na margem de propósito.** Fisicamente fora da área de conteúdo, em outra família tipográfica, em outra escala e em outro vocabulário cromático. As duas leituras não se tocam.

## 11.5 O que o Mapa nunca tem

Total, subtotal, contagem, "X de Y". Coluna ou linha de resumo. Qualquer possibilidade de reordenar. Cor por profissional. Ícone de estado. Barra, círculo preenchido, escala, medidor. Destaque de qualquer coluna. Animação de entrada.

**E não há lugar onde um total caberia.** A ausência é estrutural: a matriz termina na última linha, e o que vem depois são os retratos em prosa. Ninguém "esquece" de somar — não há onde.

## 11.6 Integração ao ambiente

O Mapa **não parece um gráfico.** Sem grid visível, sem eixos desenhados, sem legenda flutuante, sem moldura de widget. Parece **uma página bem diagramada de um documento impresso** — e é isso que ele é: parte do Relatório, não uma ferramenta anexa.

Ele é **silencioso**: não anima ao entrar, não destaca nada sozinho, não tem tooltip que aparece sozinho. Move-se só quando ela toca.

Numa tela estreita, **a matriz não vira scroll horizontal.** Ela se reorganiza em **três pastas empilhadas** — uma por profissional, cada uma listando as prioridades na mesma ordem dela. Comparar exige abrir e comparar, o que é mais lento e **mais honesto**: comparação apressada em tela pequena é onde o ranking se instala.

---

# 12 · Vocabulário visual

Cada elemento significa uma coisa, sempre a mesma. **Nada existe por beleza.**

| Elemento | O que significa | Regra permanente |
|---|---|---|
| **Cartão** | um objeto sobre a mesa — algo que se pega e examina | só existe se puder ser aberto. Cartão que não abre é caixa decorativa |
| **Pasta** | um conjunto que pertence a alguém | sempre tem dono nomeado. Nunca agrupa coisas de pessoas diferentes |
| **Mesa** | superfície de trabalho compartilhada | uma por ambiente. Duas mesas na mesma tela é escritório, não sala |
| **Porta** | passagem entre ambientes, com limiar | transição de 480ms e nome do destino. Nunca abre modal |
| **Janela** | vista para algo que continua existindo sem ela | leitura, nunca ação. Ver o Relatório é janela; assinar não |
| **Folha** | conteúdo de leitura contínua | serifa, medida de 60–68, nunca dividida em colunas |
| **Margem** | onde vive o que é do sistema | proveniência, datas, estados. Nada da margem entra no corpo |
| **Fio** | separação estrutural | 1px, tinta suave. Nunca separa itens de uma lista — isso é trabalho do espaço |
| **Profundidade** | **exclusivamente** relação temporária | só o que é transitório se eleva. Conteúdo permanente é rente à superfície |
| **Faixa** | o que é comum a todos | superfície indivisa, sem colunas. Se tem divisão, não é faixa |
| **Selo** | algo que uma pessoa assinou | traz nome e data, sempre. Selo sem autor é proibido |

**Cinco elementos banidos:** *badge numérico* (contagem vira placar), *barra de progresso* (a espera é dita em palavras), *acordeão de FAQ* (esconder o que importa é confessar que não importa), *tab* (paralelismo sugere equivalência de decisões que não são equivalentes), *tooltip com informação essencial* (o essencial nunca fica escondido atrás de hover).

---

# 13 · Sistema de coerência

## 13.1 O risco real

Ninguém vai destruir este sistema de propósito. Ele será erodido por **decisões locais razoáveis**: "só um badge de contagem", "só uma barrinha de progresso", "só um verde de confirmado". Cada uma defensável sozinha; juntas, um dashboard.

## 13.2 Os três níveis de proteção

**Nível 1 — Nomes que resistem ao uso errado.** Tokens nomeados por material e por ambiente, nunca por função. `papel`, `tinta`, `sage`, `argila` — não `bg-primary`, `text-default`, `success`, `danger`. **Um token chamado `success` será usado como sucesso**, e sucesso puxa erro, e erro puxa vermelho. Não existindo o nome, não existe o gesto.

**Nível 2 — Ausências que se notam.** O sistema não oferece: cor de erro nas superfícies dela, escala cromática, ícone de estado, barra de progresso, badge numérico. Quem precisar de um deles vai ter que **criar**, e criar é visível em revisão. A proteção mais forte de um design system não é o que ele padroniza — é o que ele **não fornece**.

**Nível 3 — Perguntas de aceitação.** Toda tela nova responde sete perguntas antes de existir:

1. **Que ambiente é este,** e a luz corresponde?
2. **Que estado emocional** ela deve ter ao sair daqui?
3. Existe algo aqui que **possa ser somado ou contado** pelo olho?
4. Alguma cor está **julgando** alguma coisa?
5. O que é **voz humana** está em serifa, e o que é sistema em sem-serifa?
6. **A hierarquia visual é a dela** ou a nossa?
7. Se eu tirar 30% do conteúdo, **a tela piora?** Se não piora, tire.

A sétima é a mais útil no dia a dia — e a que mais dói.

## 13.3 Como impedir a deriva para dashboard

**O teste do print.** Imprima a tela em papel comum. Se parecer um relatório de sistema, falhou. Se parecer uma página de documento, passou.

**O teste do estranho.** Mostre por três segundos a alguém que não conhece a Aliviar e pergunte o que é. Se a resposta contiver "sistema", "painel", "plataforma" ou "app de saúde", falhou. Se contiver "documento", "carta", "página" ou "não sei, algo de um consultório", passou.

**O teste do primeiro dashboard.** Quando alguém propuser a primeira métrica em cartão com número grande — e alguém vai —, a pergunta não é "fica bonito?", é: **"que ambiente é esse, e quem precisa desse número para decidir o quê?"** Quase sempre a resposta revela que o número é da operação, não dela — e o lugar dele é a Mesa do Curador, onde densidade é legítima.

---

# 14 · Regras permanentes

**R1.** Nenhuma superfície reflete luz. Fosco sempre.
**R2.** Vermelho e verde nunca formam par semântico. Não existe semáforo.
**R3.** Serifa é voz humana; sem-serifa é função de sistema. Nunca na mesma frase.
**R4.** A hierarquia visual é a da pessoa, nunca a da arquitetura de informação.
**R5.** Nada repetido, contável ou empilhável representa qualidade.
**R6.** Cor nunca codifica correspondência. Textura de linha, sim.
**R7.** Estado da informação vive na margem; correspondência vive no corpo.
**R8.** Lacuna tem o mesmo peso visual de qualquer outra informação.
**R9.** Profundidade significa apenas transitoriedade.
**R10.** ~50% de vazio como alvo; mais de 70% na decisão.
**R11.** Medida de leitura manda; largura de tela não. Tela maior ganha vazio.
**R12.** Movimento explica origem, nunca chama atenção. Travessia de ambiente é o dobro do resto.
**R13.** Nenhuma pessoa atendida é fotografada. Nenhum banco de imagens.
**R14.** Palavra antes de símbolo. Ícone nunca é estado.
**R15.** Nada existe por beleza. Todo elemento tem significado fixo.
**R16.** Espera é dita em palavras. Nunca barra, nunca spinner.
**R17.** O essencial nunca fica atrás de hover, tab ou acordeão.
**R18.** Tokens nomeados por material e ambiente. Nunca por função.

---

# 15 · Preparação para a Fase 3

A Fase 3 aplica este sistema à **Sala Particular de Curadoria** — o ambiente mais delicado da jornada, onde a pessoa se reconhece.

**O que a Fase 3 precisa produzir:** a estrutura espacial da Sala; como a leitura proposta pelo Curador e a correção dela convivem na mesma superfície sem que uma apague a outra; o ritmo de revelação das prioridades (uma por vez? todas com pesos diferentes?); e o gesto de reconhecimento — que é o ato mais importante que a pessoa executa em toda a plataforma e não pode parecer um "aceitar termos".

**O que a Fase 3 herda como fechado:** paleta, tipografia, luz por ambiente, movimento, vocabulário visual, as 18 regras permanentes.

**A pergunta que a Fase 3 deve responder antes de qualquer desenho:** *como uma tela demonstra que escutou?*

---

> **Se a Fase 1 definiu que a Aliviar é um lugar, a Fase 2 define de que ele é feito: papel, tinta, luz de janela e silêncio — e nada que possa ser somado.**
