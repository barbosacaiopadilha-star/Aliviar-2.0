# Arquitetura da Experiência Digital da Aliviar — Fase 1

> **Status:** filosofia e arquitetura da experiência. Não é especificação de interface, não é componente, não é código.
> **Restrição fundadora:** a arquitetura operacional está congelada (2026-08-01). Esta camada se constrói **sobre** ela, nunca contra.
> **Data:** 2026-08-01

---

# 1. Manifesto da Experiência Digital da Aliviar

**Uma pessoa não chega à Aliviar por curiosidade.** Ela chega porque alguém adoeceu — ela mesma, ou alguém que ela ama. Chega assustada, cansada de portais de convênio, de listas de médicos com estrelinhas, de sistemas que a tratam como um número de protocolo.

O software que ela vai encontrar tem uma escolha a fazer, e é uma escolha moral antes de ser estética: **parecer uma ferramenta, ou parecer um lugar.**

Nós escolhemos lugar.

**Nove convicções fundam esta camada:**

**Um.** Ninguém deveria precisar aprender a usar a Aliviar. Ela deveria ser atravessada, não operada.

**Dois.** A pressa é do sistema, nunca da pessoa. Nenhuma tela conta o tempo dela.

**Três.** Espaço vazio não é desperdício — é respeito. Uma tela cheia diz "temos muito a processar". Uma tela com ar diz "você tem tempo".

**Quatro.** A informação difícil merece contexto antes de aparecer. Nada importante surge sem preparação.

**Cinco.** A pessoa nunca está sendo avaliada. Ela não tem perfil pontuado, não tem score de engajamento, não é comparada com outros pacientes.

**Seis.** Os profissionais também não estão sendo avaliados. Não há melhor médico. Há três caminhos legítimos, e a diferença entre eles não é de qualidade.

**Sete.** A tecnologia organizou; o humano decidiu. Isso não é disclaimer de rodapé — é a estrutura visível de cada ambiente.

**Oito.** O silêncio é material de construção. O que não dizemos protege o que dizemos.

**Nove.** Nada aqui deve parecer um sistema de saúde. Deve parecer que alguém preparou um lugar e esperou por ela.

---

# 2. Arquitetura Espacial da Jornada

Seis ambientes. Cada um resolve **uma** pergunta emocional, e só passa adiante quando ela está respondida.

| Ambiente | A pergunta que ele responde | Estado emocional na saída |
|---|---|---|
| **O Limiar** | *"Este lugar é sério? Posso confiar?"* | curiosidade com alívio |
| **A Recepção** | *"Fui recebida? Alguém sabe que estou aqui?"* | sensação de ter sido esperada |
| **A Sala Reservada** | *"Alguém entendeu o meu caso?"* | reconhecimento — "é isso mesmo" |
| **A Mesa** | *"Como eu decido entre três?"* | clareza sem pressão |
| **A Sala da Decisão** | *"Posso decidir? É meu direito?"* | autonomia sem solidão |
| **O Acompanhamento** | *"E agora, estou sozinha de novo?"* | continuidade |

**A regra da travessia:** cada ambiente **abre a porta do seguinte**, mas nunca empurra. E cada um permanece acessível depois — voltar não é regressão, é revisitar um lugar por onde já se passou. A jornada tem direção; não tem catraca.

**O que a arquitetura espacial NÃO é:** não é um prédio ilustrado, não há plantas baixas, não há avatar caminhando por corredores, não há metáfora literal. **O espaço é sentido, não desenhado.** A percepção de ambiente vem de ritmo, densidade, luz e silêncio — não de cenografia.

---

# 3. Os ambientes, em detalhe

## 3.1 · O LIMIAR — a primeira respiração

Antes da Recepção existe um instante que a maioria dos produtos desperdiça: o primeiro segundo.

O Limiar é a página pública. Ele tem **uma tarefa e nenhuma outra**: fazer com que quem chegou assustado desacelere meio segundo. Não vende, não explica o Método, não lista funcionalidades, não tem prova social, não tem contador de pacientes atendidos.

**Atmosfera:** ampla, clara, sem urgência. Uma frase que reconhece o momento dela antes de falar de nós — a Aliviar aparece depois da pessoa, nunca antes.

**O que nunca aparece aqui:** "comece agora", "cadastre-se grátis", "em 3 passos simples", selos, banners, pop-ups.

## 3.2 · A RECEPÇÃO — o lugar preparado

*Etapa 1 do projeto.*

A Recepção é onde a pessoa percebe que **este lugar sabia que ela viria**. É o ambiente que o Método chama de Acolhimento, e é a primeira prova de que a Aliviar não é um formulário com boas intenções.

### Como transmite ACOLHIMENTO

O acolhimento não vem de dizer "bem-vinda". Vem de **três gestos concretos**:

**O nome dela vem antes de qualquer outra coisa.** Não como saudação automática ("Olá, Maria!"), mas como reconhecimento: a tela sabe quem chegou e diz apenas o necessário para que ela reconheça o próprio lugar.

**O sistema pergunta pouco de cada vez.** A história dela é colhida em passos curtos, com uma pergunta por vez, e cada resposta é confirmada antes da seguinte. Ninguém enfrenta um formulário de 40 campos num dia difícil.

**Nada é obrigatório sem razão dita.** Quando um campo é necessário, a tela explica por que precisa — e quando não é, ela oferece "prefiro não responder agora" com a mesma dignidade das outras opções.

### Como transmite PRIVACIDADE

Privacidade não se comunica com um cadeado no canto. Comunica-se com **arquitetura**:

**A Recepção é visivelmente reservada.** Nada de barra lateral com dez seções, nada de notificações, nada de "outras pessoas também...". A pessoa está sozinha no ambiente, e o ambiente demonstra isso pela ausência de qualquer sinal de multidão.

**Quem vê o quê é dito antes de ser perguntado.** Antes de ela escrever a própria história, a tela diz quem vai ler — o Curador que vai cuidar do caso dela, e mais ninguém. Isso não é política de privacidade; é uma frase curta no momento em que a dúvida nasce.

**O que ela escreve fica com ela até que ela envie.** O rascunho é dela. A tela deixa isso explícito, e o envio é um ato deliberado, nunca um autosave silencioso que a faz sentir observada enquanto pensa.

### Como transmite TRANQUILIDADE

**Nenhum prazo aparece sem que ela tenha perguntado.** Nada de "responda em 24h", nada de barra de progresso correndo, nada de badge vermelho.

**Uma coisa por vez, com ar em volta.** Densidade baixa, tipografia generosa, transições lentas o suficiente para o olho acompanhar. A velocidade da interface comunica a velocidade esperada dela.

**O estado é dito em palavras, nunca em percentual.** "Estamos organizando as informações do seu caso" é tranquilizador. "Perfil 40% completo" é uma cobrança disfarçada de informação.

### Como transmite CONFIANÇA

A confiança, aqui, é construída por **precisão, não por promessa**:

**A Aliviar diz o que vai fazer, na ordem em que vai fazer.** A pessoa vê a jornada inteira desde a Recepção — os seis ambientes, o que acontece em cada um — antes de dar o primeiro passo. Ninguém confia em quem não mostra o caminho.

**Nunca há afirmação sem origem.** Toda informação que a plataforma apresenta sobre um profissional carrega de onde veio e quando foi verificada. Isso vem da arquitetura congelada — a Base de Evidências existe exatamente para isso — e a experiência apenas **torna visível o que o sistema já garante**.

**O que não se sabe é dito.** "Ainda não foi possível confirmar" aparece com a mesma naturalidade de qualquer outra informação. Uma plataforma que admite lacunas é mais confiável que uma que nunca as tem.

### Como ela percebe que o espaço foi preparado para ela

Pelo acúmulo de pequenas evidências de **cuidado prévio**: a história dela reaparece nas etapas seguintes sem que precise repetir; o Curador tem nome e rosto, e é sempre o mesmo; o que ela disse na Recepção é citado com as palavras dela, não parafraseado; e nada nunca pede a mesma informação duas vezes.

**Estado emocional esperado na saída:** *"Eu contei minha história e alguém está com ela."*

## 3.3 · A SALA RESERVADA — onde ela se reconhece

*Etapa 2 do projeto. Este é o ambiente mais delicado da jornada.*

Aqui a Aliviar devolve à pessoa o que entendeu do caso dela. É o ambiente que o Método chama de Perfil e reconhecimento — e a arquitetura congelada faz dele **um ato dela**: o Perfil não vale enquanto ela não reconhecer.

Isso não é detalhe técnico. É o coração emocional da jornada, e a experiência precisa honrá-lo.

**Atmosfera.** Íntima e silenciosa. Se a Recepção é ampla, a Sala é **próxima**. Menos largura, mais foco. A sensação é de sentar-se à mesa com alguém que leu tudo com atenção e agora vai conferir se entendeu certo.

**Narrativa.** A Sala é escrita em segunda pessoa, e é uma **leitura, não um relatório**: *"Pelo que você nos contou, entendemos que o que mais importa no seu caso é poder ser atendida perto de casa e ter com quem falar entre as consultas. É isso?"* — a pergunta no fim não é retórica. É a estrutura do ambiente.

**Disposição das informações.** Do mais importante para o menos, sempre — na ordem que **ela** declarou, nunca na ordem do sistema. O que ela disse ser essencial ocupa mais espaço, aparece primeiro, tem mais ar em volta. **A hierarquia visual é a hierarquia dela.**

**Linguagem.** A língua da vida. Nunca "subcritério", "eixo", "compatibilidade", "matriz". A pessoa nunca lê um código, nunca vê um identificador, nunca encontra vocabulário de Método. Todo o aparato canônico existe do lado de dentro e não atravessa esta porta.

**Ritmo.** Lento e reversível. Cada item pode ser corrigido ali mesmo. Corrigir não é erro — é o propósito do ambiente. E quando ela corrige, a correção aparece **com as palavras dela**, ao lado da leitura que fizemos, nunca no lugar dela. As duas versões convivem: o que entendemos e o que ela esclareceu.

**Iluminação.** Suave e uniforme. Nada de destaque agressivo, nada de alerta, nada de vermelho. Se algo está incompleto, isso é dito em texto calmo, não sinalizado como falha.

**Materiais.** Papel e tinta, não vidro e néon. Superfícies foscas, contraste médio-alto para legibilidade sem dureza, bordas suaves. A sensação tátil desejada é a de um documento bem impresso — algo que se guarda, não algo que se clica.

**Sensação-alvo:** *"Eles entenderam. E o que eles entenderam sou eu."*

**Estado emocional esperado na saída:** reconhecimento — e um alívio específico, o de não precisar explicar tudo de novo.

## 3.4 · A MESA — três caminhos, nenhuma corrida

*Etapa 3. Este ambiente **não existe** antes de o Curador ter selecionado os três.*

Isso é importante e é arquitetura, não decoração: a Mesa **nasce** quando há o que comparar. Antes disso, a porta não existe — não há sala vazia esperando, não há placeholder, não há "aguardando seleção". O ambiente aparece quando tem sentido, e sua aparição é, ela própria, um acontecimento na jornada.

**O reenquadramento fundador deste ambiente:** os três já passaram por tudo. Todos atendem aos critérios obrigatórios. **A pergunta não é "qual é o melhor" — é "com qual deles eu quero fazer isso".** A Mesa inteira é construída para tornar essa pergunta a única possível.

### A abertura obrigatória: o que os três têm em comum

**Nenhuma comparação começa pela diferença.** A Mesa abre com uma faixa sólida e visualmente unificada — o **terreno comum**: os três atendem à sua área, à sua região, ao seu prazo, ao que você disse ser inegociável. Isso não é resumo; é a fundação sobre a qual tudo o mais será lido.

O efeito psicológico é decisivo: quem começa vendo o comum lê as diferenças como **variações entre opções válidas**. Quem começa vendo as diferenças lê tudo como disputa.

### Atmosfera

Ampla de novo — depois da intimidade da Sala, a Mesa se abre. Horizontal, com os três lado a lado, **do mesmo tamanho, com o mesmo peso visual, sempre**. Nenhum é destacado, nenhum aparece primeiro por mérito, nenhum tem selo.

**A ordem das três colunas é a que o Curador apresentou** — e a tela diz isso: *"Na ordem em que [nome do Curador] organizou."* Ordem sem critério oculto é ordem inocente.

---

# 4. O Gráfico Comparativo — o **Mapa de Correspondência**

Este é o objeto mais perigoso da plataforma inteira. Um gráfico mal desenhado destrói o Método em três segundos — porque o olho soma antes de a razão ler.

## 4.1 Que gráfico usar

**Uma matriz qualitativa, orientada pelas prioridades dela.**

**Linhas** = o que ela disse que importa, na ordem de importância que **ela** declarou.
**Colunas** = os três profissionais.
**Células** = o estado da correspondência entre aquela prioridade e a prática registrada daquele profissional.

Não é radar. Não é barra. Não é pizza. Não é linha. Não é bolha.

## 4.2 Por que esta forma, e não as outras

Quase todo gráfico comparativo tem um **eixo quantitativo compartilhado** — e eixo compartilhado é uma máquina de ranking. Comprimento de barra, área de radar, posição em escala: o olho compara magnitude automaticamente, antes de qualquer legenda.

**A matriz qualitativa não tem magnitude.** Não há o que ser maior. Cada célula é um **estado**, não um valor — e estados não se somam.

E há uma escolha estrutural que faz a diferença toda: **o sujeito do gráfico é ela, não eles**. As linhas são as prioridades dela. Ler de cima para baixo é ler a própria vida. Os profissionais são a variação, não o objeto. Um gráfico cujas linhas fossem os atributos dos médicos seria, inevitavelmente, um comparador de médicos.

**O radar merece rejeição explícita**, porque é a escolha óbvia e é a pior: três polígonos sobrepostos produzem áreas, e área é a metáfora visual mais forte de "quantidade de qualidade" que existe. Quem vê três radares vê imediatamente qual é "maior". Nenhuma legenda desfaz isso.

## 4.3 Como impedir a leitura de ranking — sete travas

**Trava 1 — Não existe total.** Nenhuma linha de soma, nenhuma coluna de resumo, nenhum "X de Y". E o layout não tem lugar onde um total caberia — a ausência é estrutural, não uma omissão que alguém possa "corrigir" depois.

**Trava 2 — Os marcadores não são contáveis à distância.** Cada célula carrega **uma frase curta**, específica daquele profissional. Frases não se somam num relance. Símbolos idênticos repetidos, sim — e é por isso que não usamos ícones uniformes preenchendo células.

**Trava 3 — As três colunas nunca são idênticas em conteúdo.** Cada uma diz algo distinto sobre aquela pessoa. O olho lê **diferença**, não *mais* e *menos*.

**Trava 4 — Lacuna tem o mesmo peso visual que correspondência.** "Ainda não foi possível confirmar" não é vermelho, não é vazio, não é meio-tom. É informação, com a mesma dignidade tipográfica de qualquer outra. Uma lacuna desenhada como falta vira desvantagem, e desvantagem vira ranking.

**Trava 5 — Duas famílias visuais que nunca se confundem.** O *estado da informação* (verificada, declarada, vencida) e a *correspondência com a prioridade dela* usam vocabulários visuais **incompatíveis por desenho** — famílias diferentes de forma e de tratamento. Esta é a invariante I-5 da arquitetura congelada, e a experiência a herda como lei.

**Trava 6 — Nenhuma ordenação derivada.** As colunas nunca se reordenam por nada calculado. Não existe "ordenar por". A ordem é a do Curador, e é fixa.

**Trava 7 — O ambiente diz, em texto, o que o gráfico não é.** Uma frase permanente, não um tooltip escondido: *"Este mapa não classifica profissionais. Ele mostra onde a prática de cada um encontra o que você disse que importa."*

## 4.4 Como explicar o gráfico a ela

Em três frases, na abertura da Mesa, antes do gráfico aparecer:

> *"Estes três atendem a tudo o que era indispensável para o seu caso.*
> *O que muda entre eles é onde a forma de trabalhar de cada um encontra as coisas que você disse que importam mais.*
> *Não existe uma coluna melhor — existem três jeitos diferentes de cuidar."*

E, ao lado de cada linha, a razão de ela estar ali: *"Você disse que precisa ter com quem falar entre as consultas."* A prioridade é sempre reapresentada **na voz dela**, para que o gráfico seja lido como espelho, não como julgamento.

## 4.5 Como o gráfico se integra ao ambiente

**Ele não é o ambiente — é o móvel central dele.** Chega depois do terreno comum, precedido pelas três frases de enquadramento, e é seguido pelos três **retratos em prosa** (§4.6). O gráfico organiza; a prosa humaniza; a decisão vem depois, em outra sala.

Visualmente, ele não parece um gráfico de software: sem grid pesado, sem eixos desenhados, sem legenda de cores flutuante, sem eixo numérico. Parece **uma página de um documento cuidadosamente diagramado** — mais próximo de uma tabela de um livro bem editado que de um dashboard.

E ele é **silencioso**: não anima na entrada, não pulsa, não destaca nada sozinho. Move-se apenas quando ela interage.

## 4.6 O que acompanha o gráfico, obrigatoriamente

Um gráfico sozinho reduz pessoas a células. Por isso a Mesa nunca o apresenta sem **três retratos em prosa** — um parágrafo por profissional, escrito pelo Curador, dizendo como aquela pessoa trabalha, em linguagem humana.

O gráfico responde *"onde encontra o que importa para mim"*. A prosa responde *"quem é essa pessoa"*. Nenhum dos dois basta sozinho, e a ordem importa: **o comum, depois o mapa, depois os retratos.**

**Estado emocional esperado na saída da Mesa:** *"Eu entendi a diferença entre eles, e nenhum me pareceu pior."*

---

# 5 · A SALA DA DECISÃO

*Etapa 4.*

A Mesa mostrou. A Sala da Decisão **espera**.

A separação entre os dois ambientes é deliberada e talvez seja a decisão de arquitetura mais importante desta camada: **comparar e decidir não acontecem no mesmo lugar.** Decidir na mesma tela em que se compara transforma a comparação em pressão. Aqui, ela sai da Mesa e entra num ambiente que não tem mais informação nova — tem calma.

**Como transmite CALMA.** Densidade mínima. A Sala tem menos elementos que qualquer outro ambiente da jornada. Nenhum dado novo aparece aqui: quem chegou já viu tudo o que precisava. A tela não tenta convencer.

**Como transmite AUTONOMIA.** As três opções aparecem **sem nenhuma sugestão**. Sem "recomendado", sem destaque, sem pré-seleção, sem opção marcada por padrão. E existe sempre uma quarta saída legítima, com o mesmo peso visual das outras três: *"Prefiro pensar mais"* — que **não é adiamento nem abandono**, é uma escolha registrada, e o ambiente a trata como tal.

**Como transmite SEGURANÇA.** A decisão é reversível até ser comunicada, e isso é dito **antes** de ela escolher, não depois. Ninguém decide bem sob a impressão de que não há volta.

**Como transmite AUSÊNCIA DE PRESSÃO.** Sem prazo, sem contagem, sem "sua vaga expira", sem "outras pessoas estão vendo". Nenhum gatilho de escassez existe nesta plataforma — e não porque seria ineficaz, mas porque seria indigno.

**Como reforça que a decisão é humana.** Pela **autoria visível**: o Relatório que ela leu tem o nome do Curador que o escreveu e a data em que ele assinou. O sistema aparece no seu papel real — *"organizamos as informações; a escolha é sua"* — e essa frase não é rodapé jurídico: é o texto central do ambiente.

**Estado emocional esperado na saída:** *"Eu decidi. Ninguém decidiu por mim."*

---

# 6 · O ESPAÇO DE ACOMPANHAMENTO

*Etapa 5.*

Escolhido o profissional, **a plataforma muda de natureza**. Deixa de ser um lugar de escolha e passa a ser um lugar de percurso.

**A transformação precisa ser sentida, não anunciada.** Três mudanças simultâneas, no momento da escolha:

**A comparação desaparece.** Os outros dois profissionais saem da tela principal. Não são escondidos com culpa nem apagados — ficam no histórico, acessíveis, porque fizeram parte da jornada. Mas o presente tem um nome só. Continuar exibindo as alternativas depois da decisão é convidar o arrependimento.

**O tempo muda de direção.** Até aqui, tudo apontava para frente — o que falta, o próximo passo. A partir daqui, o ambiente é organizado em **linha do tempo**: o que aconteceu, o que está acontecendo, o que vem. A jornada vira memória em construção.

**O tom muda de preparação para presença.** A linguagem deixa de explicar o que vai acontecer e passa a registrar o que está acontecendo. Menos futuro, mais agora.

**Atmosfera:** doméstica. É o ambiente mais informal da jornada — depois da decisão, a relação não é mais institucional. É acompanhamento.

**O que este espaço nunca faz:** não pede avaliação do profissional, não pede NPS, não pergunta "como estamos indo", não gamifica adesão, não envia lembrete automático com tom de cobrança. A pessoa não é usuária de um produto; é alguém sendo cuidada.

**Estado emocional esperado:** *"Não fiquei sozinha depois de escolher."*

---

# 7 · Linguagem arquitetônica

*Etapa 6. Não é interface — é o vocabulário material da experiência.*

**Materiais.** Papel, tecido, madeira clara, pedra fosca. Nunca vidro, cromo, néon, gradiente saturado, glassmorphism. A superfície deve parecer **absorver** luz, não refleti-la. Tudo o que brilha parece tecnologia; tudo o que é fosco parece objeto.

**Luz.** Difusa e lateral, como a de uma janela grande em dia nublado — a melhor luz que existe para ler algo difícil. Nunca luz direta, nunca sombra dura, nunca modo escuro como padrão (a escuridão comunica urgência e noite; esta jornada acontece de dia).

**Profundidade.** Rasa. Uma ou duas camadas, no máximo. Sem empilhamento de modais, sem gaveta sobre gaveta. Profundidade excessiva é a sensação de perder-se — exatamente o que a pessoa já sente na vida dela.

**Fotografia.** Ambientes, não pessoas posando. Luz natural, foco suave, nenhuma modelo sorrindo com jaleco. Se aparecerem pessoas, que sejam os profissionais reais, em retratos honestos — nunca banco de imagens. **Uma foto falsa contamina toda a promessa de verdade da plataforma.**

**Texturas.** Presentes, mas quase imperceptíveis. Um grão sutil no fundo, uma variação mínima de superfície. O que distingue um ambiente caro de um barato é a textura que só se percebe de perto.

**Tipografia.** Uma serifa de leitura para o que é humano — a história dela, o Relatório, os retratos. Uma sem-serifa discreta para o que é funcional — rótulos, navegação. **A distinção tipográfica é a distinção entre voz e sistema**, e ela deve ser sentida antes de ser notada. Corpo generoso, entrelinha larga, linhas curtas (60-70 caracteres). Ninguém lê notícia difícil em linha longa.

**Movimento.** Lento e curto. Nada entra saltando, nada pulsa, nada chama atenção sozinho. As transições entre ambientes são mais lentas que dentro deles — atravessar uma porta demora mais que andar por uma sala, e essa diferença de ritmo é o que faz o ambiente ser percebido como ambiente.

**Espaços vazios.** Abundantes e assimétricos. Margens largas, muito ar entre blocos. O vazio nunca é preenchido "porque sobrou espaço" — **o vazio é conteúdo**: é ele que diz que não há pressa.

**Transições.** Cada mudança de ambiente tem um momento de respiração — uma tela breve que nomeia onde ela está entrando antes de mostrar o conteúdo. Não é loading: é limiar.

**Silêncio visual.** Nenhum badge, nenhum contador, nenhum ponto vermelho, nenhuma notificação não solicitada, nenhum banner. A Aliviar nunca interrompe. Quando há novidade, ela espera ser encontrada — e está onde deveria estar.

---

# 8 · Linguagem textual

**Voz.** Segunda pessoa, presente, direta. "Você contou que…", nunca "O paciente relatou que…". A Aliviar fala **com** ela, jamais **sobre** ela.

**Registro.** Culto e simples ao mesmo tempo — a língua de alguém instruído falando com clareza, não a de um sistema traduzindo jargão. Frases curtas. Um assunto por parágrafo.

**Vocabulário proibido, sem exceção:** "melhor", "ideal", "recomendado", "top", "premium", "score", "nota", "ranking", "match", "compatibilidade %", "perfil completo", "usuário", "paciente" (quando falando **com** ela — ela tem nome), "sistema", "plataforma" (em texto voltado a ela), "algoritmo", "otimizado", "eficiente".

**Vocabulário do Método que nunca atravessa para o lado dela:** subcritério, eixo, matriz, motor, catálogo, evidência, verificação, divergência, importância, grau, e todo identificador canônico. Isso existe do lado da operação e é excelente lá. Do lado dela, seria a Aliviar falando consigo mesma na frente de uma visita.

**Como se diz o difícil.** Ausência: *"Ainda não foi possível confirmar"* — nunca "não informado", que soa a falha de alguém. Limitação: *"Este profissional não atende essa situação e encaminha"* — fato, não defeito. Espera: *"Estamos organizando as informações do seu caso"* — nunca "processando".

**Como se diz o incerto.** Sem falsa segurança e sem ansiedade: *"O prazo informado é de até 15 dias, e pode variar conforme a agenda."* Dizer a variação é mais confiável do que prometer precisão.

---

# 9 · Elementos que devem ser evitados

**Da estética de produto:** dashboards, cards de métrica, gráficos de série temporal, KPIs, medidores, semáforos, gamificação, badges, streaks, confete, ilustrações corporativas de pessoas geométricas.

**Da estética de saúde:** azul hospitalar, cruz, estetoscópio, batimento cardíaco, DNA, jaleco em foto de banco de imagens, "sua saúde em primeiro lugar".

**Da estética de marketplace:** estrelas, avaliações, "X pessoas escolheram", "mais procurado", selo de destaque, comparador com checkmarks verdes e X vermelhos, preço em evidência.

**Dos padrões de conversão:** urgência artificial, escassez, contagem regressiva, pop-up de saída, "não perca", pré-seleção da opção que convém à empresa, botão de recusa em cinza apagado.

**Da linguagem de sistema:** erro com código, "algo deu errado", "operação realizada com sucesso", "clique aqui", "carregando...", spinner infinito sem explicação.

---

# 10 · Princípios permanentes da experiência

Estes princípios governam toda evolução futura desta camada. Contradizê-los exige decisão explícita registrada.

**P1.** Nenhuma tela deve parecer um sistema. Toda tela representa um ambiente.
**P2.** A jornada tem direção, nunca catraca. Voltar é revisitar, não regredir.
**P3.** Toda decisão importante é precedida de contexto. Nada difícil aparece sem preparação.
**P4.** Toda comparação começa pelo que os três têm em comum.
**P5.** O gráfico nunca produz ranking, e sua estrutura torna o ranking impossível — não apenas desaconselhado.
**P6.** A pessoa nunca é avaliada, medida, pontuada ou comparada com outras pessoas.
**P7.** O profissional nunca é qualificado. Não existe melhor médico nesta plataforma.
**P8.** A tecnologia organiza; o humano decide — e isso é estrutura visível, não aviso legal.
**P9.** O vazio é conteúdo. Espaço não preenchido comunica que não há pressa.
**P10.** A Aliviar nunca interrompe. Novidade espera ser encontrada.
**P11.** Ausência de informação é dita como ausência, com a mesma dignidade de qualquer outro dado.
**P12.** A língua dela nunca encontra a língua do Método.
**P13.** Comparar e decidir acontecem em ambientes diferentes.
**P14.** Depois da decisão, as alternativas saem de cena.
**P15.** Nenhuma imagem finge. Nenhum número aparece sem significado. Nenhuma promessa excede o que o sistema garante.
**P16.** Sempre existe uma saída legítima que não é escolher.

---

# 11 · Como esta experiência reforça o Método

Não é revestimento — é **tradução fiel**. Cada princípio do Método tem um correspondente espacial:

| O Método diz | O ambiente faz |
|---|---|
| O Motor organiza, o Curador decide | Comparar e decidir em salas separadas; autoria visível no Relatório |
| Não existe score nem ranking | Matriz qualitativa sem eixo, sem total, sem ordenação |
| Ausência nunca vira incompatibilidade | Lacuna com o mesmo peso visual da correspondência |
| Estado da informação ≠ correspondência | Duas famílias visuais incompatíveis por desenho |
| O reconhecimento é ato dela | A Sala Reservada existe só para isso, e a correção fica com as palavras dela |
| A importância é declarada por ela | As linhas do gráfico são as prioridades dela, na ordem dela |
| Três caminhos legítimos | Três colunas de peso idêntico, ordem sem critério |
| Toda afirmação tem origem | Proveniência visível, sem exceção |

**A experiência não precisa lutar contra o produto** — e essa é a consequência mais valiosa do congelamento. Onde outras plataformas precisam de design para disfarçar um algoritmo que ordena, aqui o design apenas mostra o que já é verdade. **Não há nada a esconder, e isso se sente.**

---

# 12 · Como isso diferencia a Aliviar

O mercado de saúde digital tem duas estéticas, e ambas falham pela mesma razão.

**O marketplace** (estrelas, avaliações, "mais procurado") trata cuidado como consumo. Ele responde "qual é o melhor?" — pergunta que, em medicina, quase nunca tem resposta e sempre tem consequência.

**O portal institucional** (azul, formulário, protocolo) trata a pessoa como processo. Responde "onde está seu cadastro?" quando ela perguntou "quem vai cuidar de mim?".

A Aliviar responde uma terceira pergunta, que ninguém está fazendo: **"com quem, entre estes três caminhos legítimos, você quer fazer isso?"**

Essa pergunta exige um lugar, não uma tela. Exige tempo, contexto, silêncio e a presença visível de um humano que decidiu. **Nenhuma plataforma tradicional pode copiar esta experiência sem antes abrir mão do ranking** — e o ranking é o modelo de negócio delas.

A diferença, no fim, não é estética. É que aqui **a informação foi verificada por alguém que assinou, e a decisão foi tomada por quem ela pertence.** O design apenas torna isso perceptível.

---

> **A experiência digital da Aliviar deve ser lembrada como um lugar onde o paciente se sentiu acolhido para tomar uma decisão importante, e não como um software onde comparou profissionais.**
