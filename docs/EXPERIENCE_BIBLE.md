# Experience Bible — Aliviar

**Estado**: **Proposto** — aguardando aprovação do responsável do projeto (`docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §4).

**Autoridade**: referência obrigatória para UX, UI, Landing, Portal do Curador, Portal do Paciente e toda comunicação da Aliviar. A partir daqui, **nenhuma decisão de produto se justifica apenas por requisito funcional**. "Funciona" deixa de ser argumento suficiente; a pergunta passa a ser o que a pessoa sente enquanto funciona.

**O que este documento não governa** (para não criar autoridade concorrente):

| Assunto | Onde vive |
|---|---|
| O que a Aliviar é e como pensa | [`FUNDAMENTOS_DO_METODO_ALIVIAR.md`](FUNDAMENTOS_DO_METODO_ALIVIAR.md) |
| Entidades, estados, regras, invariantes | [`ONTOLOGIA_CURADORIA_COMPARTILHADA.md`](ONTOLOGIA_CURADORIA_COMPARTILHADA.md) |
| Personalidade e voz da marca | [`BRAND_GUIDELINES.md`](BRAND_GUIDELINES.md) |
| Cores, tipografia, tokens, componentes | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| Primeiro contato (Landing), em profundidade | [`LANDING_EXPERIENCE_PHILOSOPHY.md`](LANDING_EXPERIENCE_PHILOSOPHY.md) |

Este documento **herda** todos eles e descreve o que nenhum deles descreve: a experiência emocional contínua da jornada inteira, do primeiro contato ao acompanhamento.

**Nenhum componente, React, Next.js, banco ou arquitetura foi escrito nesta missão.**

---

## 1. O princípio

A Aliviar não entrega uma Curadoria. **A Aliviar conduz uma pessoa durante uma das decisões mais importantes da vida dela.**

Isso muda o critério de qualidade de tudo. Um relatório tecnicamente impecável que deixa a pessoa mais confusa do que antes é um fracasso do Método, não um sucesso com um problema de apresentação.

Três obrigações valem em **todas** as etapas, sem exceção:

1. **Cada etapa reduz ansiedade.** Se a pessoa termina uma etapa mais tensa do que começou, a etapa está errada — mesmo que tenha coletado tudo o que precisava.
2. **Cada etapa aumenta clareza.** Ela deve sempre saber onde está, o que acabou de acontecer e o que vem a seguir.
3. **Cada etapa aumenta confiança.** Confiança não se declara; acumula-se por consistência entre o que foi prometido e o que aconteceu.

### O teste único

Antes de aprovar qualquer tela, texto, transição ou fluxo:

> **Se a pessoa que eu mais amo estivesse do outro lado desta tela, no pior dia dela — isto ajudaria, ou só cumpriria a função?**

Se a resposta for "cumpriria a função", não está pronto.

---

## 2. Jornada do Paciente

Cada etapa é descrita em quatro tempos: **o que sente**, **o que espera**, **o que teme** e **como a Aliviar responde**. Nenhum deles descreve funcionalidade.

---

### Etapa 1 — Primeiro contato

**O que sente.** Cansaço, na maioria das vezes, antes de qualquer outra coisa. Já procurou em outros lugares, já recebeu informação demais, já sentiu que estava sendo vendida alguma coisa. Muitas vezes chega não por si — chega por um pai, uma mãe, um filho. Está fazendo isso *além* de tudo o que já carrega.

**O que espera.** Quase nada. Chega com a expectativa baixa de quem já se decepcionou com sites de saúde. Espera, no máximo, mais uma lista.

**O que teme.** Ser tratada como lead. Ser empurrada. Descobrir, três cliques adiante, que o serviço não é o que parecia. Perder tempo — o recurso que ela tem menos.

**Como a Aliviar responde.**

O primeiro contato **reconhece, não convence**. A pessoa não precisa ser persuadida de que tem um problema; ela já sabe. Precisa reconhecer que chegou no lugar certo.

- Nenhum pedido antes de qualquer entrega. Nada de e-mail antes de valor.
- O ritmo pertence a quem lê. Nada avança sozinho, nada interrompe, nada persegue.
- A autoridade aparece pelo **limite declarado** — dizer o que a Aliviar não faz (não indicamos tratamento, não damos opinião clínica) comunica mais confiança do que qualquer superlativo.
- A saída está sempre disponível, sem fricção e sem mensagem de retenção.

**A frase que ela deveria poder dizer:** *"Acho que aqui é diferente."*

---

### Etapa 2 — Consulta Inicial

**O que sente.** Alívio antecipado misturado com exposição. Vai contar coisas íntimas para alguém que não conhece. Pode sentir vergonha de não saber explicar direito, ou culpa por não ter procurado ajuda antes.

**O que espera.** Ser interrompida. Ter que resumir. Ouvir "isso não é comigo".

**O que teme.** Não conseguir explicar o que está sentindo — e que a decisão saia errada por causa disso.

**Como a Aliviar responde.**

**Como deve ser recebida.** Por uma pessoa com nome, que já sabe por que ela está ali. Nunca precisa recontar o básico do zero. A conversa começa com o Curador demonstrando que leu — não com "me conta o que está acontecendo" do zero absoluto.

**Como deve ser ouvida.** Inteira, antes de qualquer organização. A etapa **Compreender** existe para isso: escutar sem estruturar. Nenhuma pergunta serve para preencher campo; toda pergunta serve para entender. O Curador não faz a pergunta seguinte da lista — faz a pergunta seguinte da conversa.

**Como percebe que está sendo compreendida.** Pela **devolução**. Em algum momento o Curador organiza e devolve: *"Deixa eu ver se entendi..."*. O momento em que ela pensa **"é exatamente isso"** é o momento em que a confiança nasce. Ele não pode ser pulado nem apressado — é o produto da etapa, não um efeito colateral dela.

**Como a confiança se constrói.** Por três gestos concretos:
- O Curador diz **o que não vai fazer** ("eu não vou opinar sobre seu tratamento — isso é do médico").
- O Curador diz **o que vem depois**, com prazo real.
- O Curador **não finge saber** o que não sabe.

**Nunca.** Um formulário no lugar da conversa. Uma tela dividindo a atenção do Curador enquanto a pessoa fala. Uma pergunta cuja única razão de existir é um campo vazio no sistema.

**A frase que ela deveria poder dizer:** *"Ela entendeu o que está acontecendo comigo."*

---

### Etapa 3 — Construção do Perfil de Prioridades

**O que sente.** Surpresa. Ninguém nunca perguntou o que **ela** valoriza — só o que ela tem. Costuma ser a primeira vez que alguém a ajuda a nomear isso.

**O que espera.** Que alguém decida por ela o que é importante.

**O que teme.** Escolher errado. Dizer que prioriza uma coisa e depois descobrir que era outra.

**Como a Aliviar responde.**

**Por que esta etapa aumenta segurança.** Porque ela transfere o controle sem transferir o peso. A pessoa descobre que não precisa saber medicina para decidir bem — precisa saber o que importa para ela, e nisso ela é a maior especialista que existe. A ansiedade da decisão diminui quando o critério fica visível: **decidir entre opções é difícil; decidir o que importa é possível.**

**Por que mostrar os pesos aumenta credibilidade.** Porque os pesos não são uma nota da Aliviar — são a fala dela, formalizada. Quando vê `Experiência — 35 pontos` acompanhado de *"para mim isso é o mais importante"*, ela não está vendo um número do sistema. Está vendo a si mesma.

É isso que separa transparência de exposição: **cada peso mostra a evidência que o originou**. Um número sozinho seria arbitrário e assustador. O número com a frase dela ao lado é reconhecimento.

**Como validar os pesos junto ao paciente.** A validação é um momento com liturgia própria, nunca um checkbox:

1. **O Curador lê em voz alta**, na ordem de peso, em linguagem humana — nunca "critério EXPERIENCIA, peso 35", e sim *"o que mais pesa para você é experiência; depois, conseguir começar logo"*.
2. **Cada peso vem com sua evidência**: "isso ficou assim porque você me disse que...".
3. **A pergunta de conferência é aberta**, nunca de confirmação: *"o que está faltando aqui?"* — nunca *"está tudo certo?"*, que só convida a concordar.
4. **Mudar é fácil e sem constrangimento.** Se ela hesitar, ajusta-se ali. Hesitação é informação, não obstáculo.
5. **A validação é dita, não clicada.** O sistema registra o que aconteceu na conversa; nunca substitui a conversa por um aceite.

**Nunca.** Pedir um número ao paciente. Perguntar "de 0 a 10, quanto vale...". Sugerir uma distribuição "usual". Herdar pesos de casos parecidos. Preencher qualquer peso por inferência.

**A frase que ela deveria poder dizer:** *"Isso aqui sou eu."*

---

### Etapa 4 — Curadoria

**O que sente.** Vazio. A conversa acabou, ela fez a parte dela, e agora não há nada para fazer. É a etapa mais silenciosa e a mais perigosa emocionalmente.

**O que espera.** Ser esquecida. É o padrão que ela conhece de todo lugar.

**O que teme.** Que ninguém esteja trabalhando. Que ela precise cobrar.

**Como a Aliviar responde.**

Esta é a etapa onde a experiência quase sempre falha nos outros lugares — e onde a Aliviar precisa ser irrepreensível.

**A regra central: mostra-se trabalho humano, nunca processamento.** O paciente jamais vê mecanismo interno, protocolo, barra de progresso técnica ou a palavra "processando". O que ele vê é uma pessoa trabalhando:

- **Quem** está com o caso dele, pelo nome.
- **Em que ponto** o trabalho está, em linguagem de pessoa: *"analisando os profissionais"*, nunca *"executando comparação"*.
- **Quando** ele terá notícia — uma data real, não "em breve".

**Três ausências que causam abandono, e como evitá-las:**

| Sensação a evitar | O que a causa | O que fazemos |
|---|---|---|
| Espera vazia | Tela estática sem nenhum sinal de vida | Estado que mostra a etapa atual e o próximo marco, com data |
| Abandono | Silêncio maior que o prometido | Notícia no prazo combinado **mesmo quando não há novidade** — "ainda estamos analisando, seu retorno continua para quinta" |
| Falso progresso | Barra que anda sozinha sem significar nada | Nenhum indicador que não corresponda a um fato real do trabalho |

**Uma regra que vale ouro:** se o prazo vai atrasar, a Aliviar avisa **antes** do prazo vencer, não depois. Um prazo renegociado com antecedência preserva confiança; um prazo estourado em silêncio a destrói.

**Nunca.** Percentual de conclusão. Contagem regressiva. Animação de "processando" que sugere máquina pensando. Nome de mecanismo interno. Silêncio maior que o combinado.

**A frase que ele deveria poder dizer:** *"Sei que tem gente cuidando disso."*

---

### Etapa 5 — Entrega do Relatório

**O que sente.** Expectativa e medo em partes iguais. É o momento pelo qual esperou — e o momento em que vai ter que decidir.

**O que espera.** Uma resposta. Que alguém diga qual é o melhor.

**O que teme.** Não entender. Ter que escolher sem base. Escolher errado.

**Como a Aliviar responde.**

**A entrega é sempre humana.** Nunca uma notificação com um PDF anexo. Um Curador apresenta, explica e responde — o documento fica com o paciente **depois** da conversa, para reler com calma e com quem ele quiser.

**Como o Curador apresenta as três opções:**

1. **Começa pelo Perfil, não pelos médicos.** Retoma o que ela definiu como importante. Isso reancora a conversa no critério dela antes de qualquer nome aparecer.
2. **Diz em voz alta que não é um ranking.** Explicitamente: *"não estão em ordem de melhor para pior — são três caminhos diferentes, todos bons"*. O que não é dito, o paciente presume; e a presunção padrão de qualquer pessoa diante de uma lista é que o primeiro é o melhor.
3. **Apresenta cada opção pelo mesmo roteiro**, no mesmo tempo, com a mesma energia. Assimetria de entusiasmo é indução.
4. **Diz o que cada opção custa.** Toda opção tem um trade-off. Uma opção apresentada só com virtudes não é uma opção — é uma recomendação disfarçada. *"Este tem a maior experiência na sua área; em compensação, a agenda dele é a mais apertada dos três."*
5. **Explica as diferenças pelos critérios dela**, nunca por qualidade abstrata: *"este responde melhor ao que você colocou como mais importante; aquele responde melhor ao segundo"*.

**Como responder dúvidas.** Devolvendo ao critério, nunca à opinião. Quando vier a pergunta inevitável — *"qual você escolheria?"* — a resposta não é evasiva nem é uma escolha:

> *"Eu não vou escolher por você, e isso não é uma esquiva — é porque a resposta depende de algo que só você sabe. Você me disse que começar logo era o que mais pesava. Se isso continua verdadeiro hoje, o caminho fica mais claro. Isso mudou?"*

O Curador nunca responde uma dúvida clínica. Encaminha, com naturalidade e sem constrangimento: *"essa é uma pergunta para o médico que você escolher — e é uma ótima pergunta para a primeira consulta."*

**Como preservar autonomia.** Nenhuma opção pré-selecionada. Nenhum destaque visual. Nenhum "recomendado". Ordem declarada como apresentação, não colocação. E, ao final, a autonomia dita em palavras: *"não precisa decidir agora."*

**A frase que ela deveria poder dizer:** *"Agora eu entendo a diferença entre elas."*

---

### Etapa 6 — Escolha

**O que sente.** O peso da responsabilidade voltando para ela — desta vez, com base.

**O que espera.** Pressão para fechar.

**O que teme.** Ter sido conduzida sem perceber. Descobrir depois que a escolha não era tão livre assim.

**Como a Aliviar responde.**

**Como garantir que ela nunca sinta que foi induzida.** Indução raramente é explícita; mora nos detalhes. Cada um destes é um vetor de indução, e todos ficam fechados:

| Vetor | O que fazemos |
|---|---|
| Ordem | Declarada como apresentação; nunca "melhor primeiro" |
| Destaque visual | Nenhum. As três opções têm exatamente o mesmo peso gráfico |
| Pré-seleção | Nenhuma. Nada vem marcado |
| Linguagem | Nenhum "recomendado", "mais escolhido", "destaque" |
| Prazo | Nenhum. Sem contagem, sem "responda até" |
| Insistência | Um lembrete gentil, no prazo combinado. Nunca uma sequência de cobranças |
| Assimetria de esforço | Escolher qualquer uma das três custa o mesmo número de passos |
| Opinião do Curador | Nunca oferecida, mesmo se solicitada |

**"Nenhuma destas" tem o mesmo peso visual e a mesma facilidade que as outras opções.** Não é um link pequeno no rodapé. É um caminho legítimo, e é tratado como informação valiosa: significa que alguma etapa anterior não capturou algo. A resposta a ele nunca é decepção — é *"que bom que você disse; vamos entender o que faltou"*.

**A frase que ela deveria poder dizer:** *"A decisão foi minha."*

---

### Etapa 7 — Acompanhamento

**O que sente.** A transição de "sendo cuidada" para "por conta própria" — o ponto onde a maioria dos serviços desaparece.

**O que espera.** Que acabe ali. Que a Aliviar tenha entregue o produto e sumido.

**O que teme.** Ter que recomeçar do zero se não der certo.

**Como a Aliviar responde.**

**Como manter a sensação de continuidade:**

- **O vínculo é com pessoas, não com um sistema.** Ela sabe para quem escrever, pelo nome.
- **O primeiro contato depois da escolha parte da Aliviar**, não dela. Uma mensagem depois da primeira consulta, perguntando como foi — não uma pesquisa de satisfação, uma pergunta de gente.
- **A história permanece inteira e acessível.** Se voltar em um ano, nada foi perdido: a história, o Perfil, os pesos, as opções, a escolha. Ela nunca recomeça do zero.
- **Trocar de profissional não é fracasso.** É um caminho previsto, sem constrangimento, sem justificativa obrigatória, sem tom de "tem certeza?".
- **Encerrar é fácil.** Nenhuma retenção, nenhuma fricção, nenhuma tentativa de reverter. Sair bem é parte de cuidar bem.

**Nunca.** Contato de rotina sem propósito. Pesquisa de satisfação como substituto de conversa. Silêncio absoluto depois da entrega.

**A frase que ela deveria poder dizer:** *"Se eu precisar, eles estão lá."*

---

## 3. Jornada do Curador

O Portal do Curador é uma ferramenta de trabalho para alguém que passa o dia conduzindo conversas difíceis. Ele precisa transmitir **controle, clareza, segurança e organização** — e nunca burocracia, excesso de formulários ou sensação de software administrativo.

### O Curador deve sentir que possui um copiloto

Um copiloto tem quatro comportamentos, e nenhum deles é "preencher formulário":

**1. Antecipa, não interroga.** O sistema já sabe o que o paciente contou e apresenta isso antes de a conversa começar. O Curador nunca pergunta ao paciente algo que o sistema já tem — cada repetição custa credibilidade que ele levou meses para construir.

**2. Sinaliza a lacuna, não bloqueia o caminho.** Quando falta algo, o sistema mostra o que falta e por que importa — e deixa continuar. *"Faltam 15 pontos para fechar a distribuição"* é copiloto. Um botão desabilitado sem explicação é burocracia.

**3. Mostra o cálculo com a conta à vista.** O Curador nunca vê um número sem a sua decomposição. Todo score vem acompanhado de quanto cada critério contribuiu e por quê — porque em dez minutos ele vai ter que explicar isso a um ser humano.

**4. Nunca decide, e nunca finge que não decidiu.** O sistema organiza e sugere ordem. Não pré-seleciona três, não marca favoritos, não usa a palavra "recomendado". A tela deixa claro, o tempo todo, que a escolha é dele — e que ela ficará registrada com o nome dele.

### O que o Portal nunca deve ser

- Um formulário longo. A tela acompanha uma conversa; conversa não tem ordem fixa. O Curador precisa registrar na ordem em que as coisas aparecem, não na ordem em que os campos foram desenhados.
- Uma tela que exige atenção enquanto o paciente fala. Durante a conversa, o registro é mínimo. O aprofundamento acontece depois.
- Um painel de métricas. Nenhum indicador de produtividade, tempo médio ou volume. A pressa é inimiga direta do Método.
- Um sistema que perde trabalho. Salvamento automático, sempre. Perder trinta minutos de escuta registrada é inaceitável.

### A experiência emocional do Curador

| Momento | Deve sentir | Nunca deve sentir |
|---|---|---|
| Abrindo o caso | Preparado — já sei quem é essa pessoa | Frio — mais um na fila |
| Durante a conversa | Presente — a tela não me disputa | Dividido entre a pessoa e o software |
| Construindo os pesos | Apoiado — a conta fecha à minha frente | Fazendo aritmética no papel |
| Lendo as compatibilidades | Informado — vejo a conta e entendo | Obedecendo a um número que não sei explicar |
| Selecionando as três | Responsável — a escolha é minha e ficará registrada | Homologando o que a máquina já decidiu |
| Entregando | Seguro — sei justificar cada opção | Lendo um relatório que não escrevi |

---

## 4. A experiência da tecnologia

A tecnologia nunca chama atenção para si. Se o paciente está pensando em *como o sistema funciona* em vez de *o que eu preciso fazer agora*, a interface falhou.

Toda interface transmite, simultaneamente: **calma, clareza, rigor, elegância e confiança.**

Onde cada uma mora concretamente:

- **Calma** — no ritmo e no espaço. Nada pisca, nada pula, nada compete por atenção. Espaço negativo generoso; cortar conteúdo antes de reduzir respiro.
- **Clareza** — na hierarquia. Uma coisa importante por tela. O próximo passo sempre visível sem rolar.
- **Rigor** — na consistência. O mesmo conceito com o mesmo nome, sempre. Nenhum número sem unidade e sem explicação.
- **Elegância** — na contenção. Discrição comunica sofisticação; densidade comunica ansiedade.
- **Confiança** — na previsibilidade. Nada acontece sem que a pessoa tenha causado. Nenhuma surpresa, nem agradável.

**Os três excessos proibidos:**

| Excesso | Por que fere o Método |
|---|---|
| Animações | Movimento chama atenção para o meio, não para o conteúdo. Toda animação é funcional (indica estado) ou não existe |
| Gráficos | Um gráfico é uma afirmação visual. Se a informação cabe em uma frase, ela vira uma frase |
| Indicadores | Cada número exibido é um número que a pessoa tenta interpretar. Número sem significado claro produz ansiedade, não informação |

---

## 5. Princípios oficiais de UX

Estes princípios governam toda decisão de interface. Em conflito com um requisito funcional, **o princípio prevalece** — salvo exceção registrada explicitamente pelo responsável do projeto.

**UX1 — Uma decisão por tela.** Se a tela pede duas decisões independentes, são duas telas. Decisão importante nunca divide atenção com outra.

**UX2 — Sempre mostrar contexto.** A pessoa nunca precisa lembrar de onde veio. Onde está, o que já aconteceu e o que falta ficam visíveis sem esforço.

**UX3 — Nunca esconder o próximo passo.** O próximo passo é sempre visível, sempre único e sempre nomeado pelo que faz. Nunca atrás de um menu, nunca ambíguo, nunca dois com o mesmo peso.

**UX4 — Toda informação importante tem explicação junto.** Explicação ao lado do dado, não atrás de um ícone de ajuda. Se precisa de tooltip para ser compreendida, o texto principal está errado.

**UX5 — Todo cálculo é justificável em uma frase.** Nenhum número aparece sem que se possa dizer, em linguagem simples, de onde ele veio. O que não passa nesse teste sai da tela.

**UX6 — A pessoa sempre entende por que algo aconteceu.** Toda mudança de estado tem causa explícita e visível. Nada muda "sozinho".

**UX7 — Saída sempre disponível.** Toda tela permite parar, voltar ou sair, sem fricção, sem culpa, sem mensagem de retenção.

**UX8 — Nenhum default que empurre uma decisão.** Nada vem pré-selecionado onde há escolha real. O estado inicial é sempre neutro.

**UX9 — O ritmo pertence à pessoa.** Nada avança sozinho, nada expira, nada pressiona. Nenhuma contagem regressiva em nenhuma superfície.

**UX10 — Erro nunca culpa a pessoa e nunca assusta.** Diz o que aconteceu, o que fazer agora, e preserva o que ela já tinha escrito. Nenhum trabalho se perde por causa de um erro.

**UX11 — Espera é informada, nunca vazia.** Toda espera diz o que está acontecendo e quando termina. Espera sem previsão é abandono.

**UX12 — Nenhuma superfície do paciente nomeia mecanismo interno.** Nenhum protocolo, score, sigla ou nome de sistema. Em nenhuma circunstância.

**UX13 — Acessibilidade é piso.** WCAG AA como mínimo, nunca meta futura. Navegável por teclado e leitor de tela, sempre. `prefers-reduced-motion` sempre respeitado.

---

## 6. Microinterações

Comportamento oficial. O princípio geral: **a interação confirma que o sistema entendeu; nunca celebra, nunca dramatiza.**

### Transições
Crossfade ou deslocamento discreto, 200–300ms, curva suave. Nunca corte abrupto, nunca flash, nunca bounce ou efeito elástico. Mudança de etapa preserva o contexto visual — a pessoa nunca sente que "trocou de sistema". Com `prefers-reduced-motion`, transições viram troca simples, sem movimento.

### Loading
Três regras por duração:
- **Até ~400ms** — nada. Um indicador que pisca e some causa mais ansiedade que o próprio tempo.
- **Até ~3s** — indicador discreto, no lugar onde o conteúdo vai aparecer. Nunca cobrindo a tela inteira.
- **Acima disso** — deixa de ser loading e vira **estado informado**: o que está acontecendo, em linguagem humana, e quando termina.

Nunca percentual que não corresponda a progresso real. Nunca frases de espera "divertidas". Nunca spinner sobre a tela toda bloqueando leitura.

### Confirmações
Só existem para o que é **irreversível**. Salvar não pede confirmação; validar o Perfil e entregar o Relatório pedem — porque congelam algo.

Uma confirmação sempre diz **o que vai acontecer**, não "tem certeza?": *"Depois de validado, este Perfil não pode mais ser alterado — corrigir exige construir um novo, junto com o paciente. Validar?"*

O botão nomeia a ação ("Validar Perfil"), nunca "OK". A ação destrutiva nunca é o default.

### Salvamentos
Automáticos, contínuos, silenciosos. O estado é discreto e permanente ("salvo há instantes"), nunca um toast que interrompe. Nunca um botão "Salvar" que deixe a pessoa em dúvida se salvou. Se a rede cair, isso é dito com calma e o conteúdo é preservado localmente — trabalho de escuta nunca se perde.

### Validações
No momento certo, nunca antes: valida-se ao sair do campo, jamais a cada tecla. Erro aparece junto ao campo, em linguagem de pessoa, dizendo como resolver. Nunca em vermelho agressivo, nunca com ícone de alerta desproporcional.

O botão de avançar **não fica desabilitado sem explicação** — ou explica ao lado o que falta, ou permite a tentativa e responde com clareza. Um botão cinza sem motivo é o oposto de copiloto.

### Pesos
A microinteração mais delicada do produto.

- **O total é sempre visível**, e o que falta é dito em linguagem natural: *"faltam 15 pontos"*, nunca `85/100` isolado.
- **Ajustar um peso nunca reajusta outro automaticamente.** Autoajuste tira do paciente o controle da própria prioridade.
- **Nenhum peso é salvo sem evidência.** O campo de evidência aparece junto do peso, no mesmo momento — nunca como etapa posterior de "documentação".
- **Fechar exatamente 100 é reconhecido com discrição** — um estado calmo de "pronto para validar", nunca confete, som ou celebração.
- **Na visão do paciente**, o peso nunca é um controle: é leitura. Barra ou proporção com o rótulo e a evidência ao lado.

### Comparações
Visão do Curador: a lista completa, ordenada, **sem corte em três** e sem nada pré-marcado. Cada linha abre a decomposição por critério — peso, alinhamento e a explicação em uma frase.

Lacuna de dado aparece como lacuna, com aparência neutra — **nunca vermelha, nunca com ícone de erro**. Falta de informação não é falha do profissional.

Selecionar uma opção é um ato deliberado, e a tela mostra o tempo todo quantas faltam para três. Nenhuma sugestão automática de conjunto.

### Relatórios
Na tela, o Relatório é lido em ritmo de leitura, não de dashboard: uma opção por vez, mesmo espaço, mesma estrutura, mesma extensão aproximada.

Nada ordena visualmente as três. Nenhum badge, cor ou selo diferencia uma. A faixa de compatibilidade aparece como palavra ("Compatibilidade alta"), nunca como número, barra comparativa ou estrela.

Exportar/imprimir preserva a mesma neutralidade — o PDF nunca ganha um destaque que a tela não tem.

---

## 7. Tom de voz

Herda integralmente a personalidade de marca (Serena, Culta sem ser distante, Acolhedora sem informalidade excessiva, Discreta, Direta — `docs/BRAND_GUIDELINES.md`). Aqui, o registro específico de cada superfície.

### Falando com o Paciente
Frases curtas. Zero jargão — clínico ou técnico. Verbos no indicativo; imperativo só como convite. Nunca diminutivo, nunca infantilização, nunca exclamação.

- ✅ *"Seu Curador está analisando os profissionais. Você tem retorno na quinta-feira."*
- ❌ *"Processamento em andamento! Aguarde..."*
- ✅ *"Não foi possível salvar agora. Seu texto está guardado — tente de novo em instantes."*
- ❌ *"Erro ao processar requisição."*

### Falando com o Curador
Direto, técnico onde precisa ser, respeitoso da expertise dele. Nunca explica o óbvio da área dele. Objetivo, sem ser seco.

- ✅ *"Faltam 15 pontos para fechar a distribuição."*
- ❌ *"Atenção! A soma dos pesos está incorreta!"*
- ✅ *"3 critérios sem dado no cadastro deste profissional — não pontuaram e não penalizaram."*
- ❌ *"Dados insuficientes. Score comprometido."*

### A voz do Sistema
O sistema fala pouco, e sempre na primeira pessoa do plural ou em voz neutra — nunca como personagem, nunca simulando gente. Nunca usa "eu". Nunca se desculpa em excesso. Nunca comemora.

- ✅ *"Salvo há instantes."* / *"Ainda não há informações para exibir."*
- ❌ *"Ops! Algo deu errado 😕"* / *"Tudo pronto! 🎉"*

### A voz do Relatório
Editorial e sóbria — é um documento que a pessoa vai reler e mostrar para a família. Terceira pessoa, sem marketing, sem adjetivo de venda. Cada opção descrita com a mesma estrutura e a mesma extensão.

- ✅ *"Atende à sua prioridade de começar logo: tem agenda aberta. Em contrapartida, atende em uma região mais distante da sua."*
- ❌ *"Excelente escolha! Profissional altamente qualificado e muito bem avaliado."*

### A voz da Landing
Reconhece, não convence. Convida, nunca ordena. Autoridade pelo limite declarado. (Detalhamento em `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` §5.)

- ✅ *"Conte sua história."*
- ❌ *"Comece agora! Vagas limitadas."*

### A voz do Portal
Funcional e discreta. Rótulos nomeiam o que a coisa é para quem a usa — nunca o nome interno da entidade. O paciente lê "Suas prioridades", nunca "Perfil de Prioridades (validado)". O Curador lê "Prioridades do paciente", nunca `priority_profile`.

---

## 8. Design emocional

A emoção-alvo de cada etapa. Toda decisão de UX se avalia contra ela: **isto aproxima ou afasta a pessoa desta emoção?**

| Etapa | Emoção-alvo | A frase que ela deveria poder dizer | O que destrói |
|---|---|---|---|
| Primeiro contato | **Acolhido** | "Acho que aqui é diferente." | Pedir algo antes de entregar valor |
| Consulta Inicial | **Compreendido** | "Ela entendeu o que está acontecendo comigo." | Formulário no lugar da escuta |
| Perfil de Prioridades | **Representado** | "Isso aqui sou eu." | Peso sem a fala dela ao lado |
| Curadoria | **Seguro** | "Sei que tem gente cuidando disso." | Silêncio maior que o combinado |
| Relatório | **Esclarecido** | "Agora eu entendo a diferença entre elas." | Três opções que parecem a mesma coisa |
| Escolha | **Confiante** | "A decisão foi minha." | Qualquer destaque em uma das três |
| Acompanhamento | **Amparado** | "Se eu precisar, eles estão lá." | Sumir depois da entrega |

### A curva emocional da jornada

A jornada tem uma forma, e ela não é uma linha ascendente. Tem um vale — a **Curadoria** — em que o paciente não faz nada e não vê nada. É o ponto de maior risco de perda de confiança em toda a experiência, e o único cujo remédio é inteiramente operacional: **cumprir o prazo prometido, e falar antes de ele vencer.**

A confiança sobe em degraus (reconhecimento → compreensão → representação), atravessa esse vale, e o Relatório precisa retomá-la do ponto onde ela estava — não do zero. Por isso a apresentação **começa pelo Perfil dela**, não pelos médicos: é a ponte que reconecta a pessoa ao que ela mesma construiu antes do silêncio.

---

## 9. O que nunca fazemos, em nenhuma superfície

- Urgência artificial: contagem regressiva, prazo fabricado, escassez, "última chance".
- Prova social fabricada ou desnecessária.
- Nomear mecanismo interno em superfície do paciente.
- Mostrar score interno de compatibilidade ao paciente.
- Ordenar, destacar, marcar ou pré-selecionar uma das três opções.
- Prometer resultado clínico, cura ou garantia.
- Dar opinião clínica, em qualquer canal, por qualquer papel.
- Simular humano em interação automatizada.
- Interromper com pop-up, modal de saída ou chat não solicitado.
- Dificultar sair, encerrar ou trocar de profissional.
- Perder trabalho já registrado por causa de um erro.
- Exibir número sem significado explicado ao lado.
- Tratar "nenhuma destas" como falha do paciente.

---

## 10. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-23 | Primeira versão — MISSÃO 004. Jornada emocional do paciente em 7 etapas (sente/espera/teme/resposta), jornada do Curador, experiência da tecnologia, 13 princípios de UX, 8 famílias de microinterações, tom de voz para 6 superfícies, design emocional com curva da jornada e o vale da Curadoria. Herda `BRAND_GUIDELINES.md`, `DESIGN_SYSTEM.md` e `LANDING_EXPERIENCE_PHILOSOPHY.md` sem duplicá-los. Nenhum componente, React, Next.js, banco ou arquitetura escrito. |
