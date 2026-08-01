# A Sala da Decisão — Fase 9

> **Status:** projeto do ambiente. Funções da experiência e requisitos verificáveis; sem wireframes, sem layout, sem cor, sem componente, sem código.
> **Herda integralmente:** [A_DECISAO.md](./A_DECISAO.md) (10 proibições N · 9 obrigações O · 7 princípios P) · [A_MESA.md](./A_MESA.md) (saídas, transições, limites) · e, por elas, Método · Motor · Catálogo · Governança · [Experiência](./ARQUITETURA_DA_EXPERIENCIA.md) · [Sistema Visual](./SISTEMA_VISUAL.md) · [Dramaturgia](./DRAMATURGIA_DA_EXPERIENCIA.md) · [Arquitetura do Lugar](./ARQUITETURA_DO_LUGAR.md) · [Sala Particular](./SALA_PARTICULAR.md) · [O Encontro](./O_ENCONTRO.md).
> **Não altera:** Método, Motor, pesos, critérios, a Mesa, nem regra clínica alguma.
> **Data:** 2026-08-01

---

# 0 · Conflitos e lacunas herdados

*Registrados antes de qualquer projeto, porque a regra de dependência proíbe corrigi-los em silêncio. Nenhuma correção abaixo está aprovada — são propostas, e a decisão é do domínio (§16).*

## 0.1 · CONFLITO — A reversibilidade é prometida por um documento e recusada pelo outro

**O conflito.** [A_DECISAO.md §8](./A_DECISAO.md) instrui o Concierge a oferecer, a quem está insegura, quatro consolos — entre eles **"que a decisão é reversível"**. [A_MESA.md §2](./A_MESA.md) recusa explicitamente prometer reversibilidade, por não existir regra que a defina, e chama isso de "vender tranquilidade a crédito".

**O impacto — e ele é grave.** A promessa não está num rótulo de botão: está na boca de uma pessoa da Aliviar, dita a alguém em pânico, no momento de maior fragilidade da jornada. Se depois a escolha se revelar não-reversível — porque o profissional já foi contatado, porque houve reserva de agenda, porque a operação não tem caminho de volta —, **a Aliviar terá quebrado sua promessa exatamente onde mais prometeu.** Nenhuma outra falha desta arquitetura custaria tanto.

**Menor correção arquitetônica possível.** Não é remover o consolo — é **limitá-lo ao que a operação sustenta**. O Concierge passa a dizer apenas o que for verdade dentro da janela definida em §16-Q1, com esta forma: *"até [marco], nada está fechado; se mudar de ideia, é só me dizer."* Enquanto Q1 não for decidida, **o Concierge não afirma reversibilidade** — diz que vai confirmar, e confirma. Uma frase a menos é reparável; uma promessa quebrada não.

## 0.2 · CONFLITO — O Concierge entra "no instante da decisão", mas a Mesa exige a porta dele antes

**O conflito.** [A_DECISAO.md §8](./A_DECISAO.md): *"Quando entra. **No instante da decisão — não antes.** Durante a Curadoria esteve no corredor."* Mas a obrigação **O5**, aplicada pela Mesa, exige a porta *"quero conversar"* → Concierge **permanente na Mesa**, que é inteiramente anterior à decisão.

**O impacto.** Sem resolução, ou a porta da Mesa não tem destino, ou o Concierge chega antes do previsto e a passagem nominal do Curador (A_DECISAO §7) perde sentido.

**Menor correção possível.** Distinguir dois verbos que os documentos tratam como um: **estar alcançável** e **assumir o acompanhamento**. O Concierge é *alcançável* desde a Mesa, pela porta, quando ela o procura; ele *assume* no instante da decisão, apresentado nominalmente pelo Curador. A frase de §8 passa a ler-se como sobre o assumir, não sobre o existir. Nada mais muda.

## 0.3 · LACUNA — "O Curador foi avisado" é uma promessa que o sistema não pode garantir

**A lacuna.** [A_DECISAO.md §5.2](./A_DECISAO.md): *"Imediatamente ela sabe que **o Curador foi avisado** e o que ele fará em seguida."*

**O impacto.** O sistema pode garantir que **despachou** o aviso. Não pode garantir que foi lido, nem quando alguém agirá. Dizer "avisado" e "o que ele fará" é a plataforma declarando concluído algo que depende de ação humana — precisamente o que a §8 deste brief proíbe.

**Menor correção possível.** Reformular para o que tem autoridade: **quem** foi avisado (nome), **quando** o aviso saiu, e **qual é o prazo humano comprometido** (§16-Q5). Se o prazo não estiver definido, diz-se o que se sabe e não se promete o que não se sabe.

## 0.4 · LACUNA — "A alternativa sai de cena" não está ancorada em nenhum evento

**A lacuna.** [A_DECISAO.md §5.2](./A_DECISAO.md) determina que os outros dois deixam a superfície principal *"no mesmo instante"* — mas "o mesmo instante" de quê: da confirmação, do registro, da comunicação ao profissional? Os três são momentos diferentes (§ deste documento, vocabulário).

**O impacto.** Se as alternativas saem na confirmação e o profissional escolhido se revelar indisponível, a paciente fica sem escolha e sem alternativas visíveis — e o retorno delas parecerá um rebaixamento do que ela decidiu.

**Menor correção possível.** Ancorar a saída de cena no **encaminhamento aceito**, não na confirmação; e estabelecer que, se a condição material falhar, as alternativas voltam **com a decisão dela preservada e nomeada como válida** — a falha é da condição, nunca da escolha.

## 0.5 · LACUNA — Não existe definição de "comunicada"

A palavra aparece implicitamente em toda a arquitetura (o momento a partir do qual há terceiros envolvidos), mas nenhum documento a define. **Esta é a lacuna de maior alcance operacional**, e a §6 deste documento a decompõe sem resolvê-la — porque resolvê-la é decisão de domínio (§16-Q1, Q2, Q3).

---

# 1 · A pergunta central: o vocabulário da decisão

> **O que precisa acontecer entre a pessoa compreender sua preferência e a Aliviar tratar essa preferência como uma decisão?**

**Resposta curta: precisa acontecer um ato dela, dito por ela, que ela reconheça como tendo acontecido.** Compreensão não é decisão; inclinação não é decisão; e a Aliviar não pode inferir decisão de nenhum comportamento — só recebê-la quando declarada.

**Resposta longa: sete estados distintos, e confundi-los é a origem de todo dano possível neste cômodo.**

| # | Termo | O que é | Onde vive | Quem o produz | O que a Aliviar pode fazer com ele |
|---|---|---|---|---|---|
| 1 | **Preferência** | um gosto, uma inclinação de leitura: *"acho que gostei mais deste"* | dentro dela, na Mesa | ela, sozinha | **nada.** Não é observável, não é registrável, não autoriza coisa alguma |
| 2 | **Inclinação** | preferência que já se orienta a um nome, mas ainda sem o custo aceito: *"acho que é ele"* | dentro dela; às vezes dita ao Concierge | ela | **nada automático.** Jamais tratada como decisão, jamais registrada como intenção |
| 3 | **Decisão formulada** | a preferência **com o custo nomeado**: *"escolho este, mesmo abrindo mão daquilo"* | é o produto da Mesa; entra com ela na Sala | ela | recebê-la, dar-lhe lugar, **nunca exigi-la** |
| 4 | **Confirmação** | o ato deliberado de dizer à Aliviar que a decisão formulada vale — inequívoco, único, dela | **acontece na Sala** | ela, e só ela | é o único gatilho legítimo de tudo o que segue |
| 5 | **Registro** | o fato de a Aliviar ter guardado a confirmação | sistema | o sistema, imediatamente | garantir; e é a única coisa que a plataforma pode declarar sozinha |
| 6 | **Comunicação** | o momento em que **terceiros passam a saber**: equipe, depois o profissional | operação | pessoas | despachar; e **dizer honestamente o que já saiu e o que não** |
| 7 | **Efeitos operacionais** | consequências materiais no mundo: contato feito, agenda tocada, expectativa criada no profissional | mundo real | operação e profissional | **nunca declarar como feitos antes de o serem** |

**As quatro fronteiras que este vocabulário estabelece — e que são requisitos, não descrições:**

**Fronteira 1 — entre 2 e 3 (inclinação → decisão formulada): o custo.** É o que a Mesa produz. Sem ele há apontamento, não decisão.

**Fronteira 2 — entre 3 e 4 (formulada → confirmada): o ato.** Compreender que se escolheu não é ter dito que se escolheu. **A Aliviar não age sobre compreensão — age sobre declaração.**

**Fronteira 3 — entre 5 e 6 (registro → comunicação): o terceiro.** Antes dela, a decisão vive entre ela e a Aliviar e não tocou ninguém. Depois dela, há uma pessoa do outro lado com expectativa. **É esta fronteira, e não a confirmação, que governa a reversibilidade** (§6).

**Fronteira 4 — entre 6 e 7 (comunicação → efeitos): o mundo.** O que foi dito a alguém ainda não é o que já aconteceu. Confundi-las produz a mentira mais comum de plataformas: declarar concluído o que só foi despachado.

---

# 2 · Missão da Sala

## Por que este cômodo existe

**Porque a decisão precisa de um lugar que não seja o lugar da comparação.** É a herança direta de **P3** e **N3**: comparar e decidir são atos distintos, e um ambiente que faz os dois inclina o segundo com o material do primeiro. A Mesa é densa por necessidade — retratos, mapa, prioridades, proveniência. **A Sala é recolhida pela mesma necessidade.**

E existe por uma segunda razão: **para proteger a integridade da decisão** — não para produzi-la. A Sala não convence, não converte, não retém, não impede desistência. **Se a paciente sair sem confirmar, a Sala pode ter cumprido perfeitamente sua missão.**

## O que recebe da Mesa

Uma **decisão formulada** (nível 3) e nada mais — nunca uma confirmação, nunca uma intenção presumida. Concretamente: o nome de quem ela quer, a formulação do trade-off tal como ela a alcançou, as prioridades dela na ordem dela, e o estado datado da informação que sustentou a leitura (§4).

## O que precisa produzir

Um destes, **todos legítimos, nenhum preferível**: uma **confirmação** feita com compreensão e liberdade; ou um **recuo** sem dano; ou um **"nenhum dos três"** acolhido e devolvido à Curadoria; ou um **pedido de conversa**; ou uma **pausa** que não custa nada.

## Quando começa e quando termina a responsabilidade

**Começa** quando ela manifesta querer decidir sobre alguém — nunca ao clicar num nome (§4). **Termina** no **registro** (nível 5). Tudo o que vem depois — comunicação, contato, agenda, encaminhamento — pertence a pessoas, e a Sala só o **relata com honestidade**; não o executa e não o promete.

## O que pertence ao ambiente seguinte

O acompanhamento pós-decisão: a chegada do Concierge, o primeiro encontro, a preparação da consulta, a vida do relacionamento. **A Sala não é o começo do cuidado — é o fim da Curadoria.**

## A frase que mede a missão

> **A Sala cumpriu sua missão quando a paciente, ao sair, sabe exatamente o que aconteceu, o que ainda não aconteceu, e o que pode fazer se mudar de ideia — tenha ela confirmado ou não.**

Três razões para esta frase, e não "a paciente confirmou":

**É verificável sem confirmação.** Vale igualmente para quem recuou — o que impede que a métrica da Sala seja conversão.

**Mede compreensão, não ação.** Suas três metades correspondem às três coisas que a plataforma mais frequentemente esconde: o que já é irreversível, o que ainda depende de humanos, e qual é a saída.

**Torna a Sala reprovável por omissão.** Uma Sala que obtém confirmação sem que a pessoa saiba que o profissional ainda não foi contatado **falhou**, por mais eficiente que pareça.

---

# 3 · A natureza da decisão

**A decisão é um processo; a confirmação é um evento.** O processo começou no Encontro e amadureceu na Mesa. A Sala não hospeda o processo inteiro — hospeda **a passagem do processo a ato**. Por isso ela é curta sem ser apressada: o trabalho pesado já foi feito noutro cômodo.

**Escolher um profissional e autorizar o próximo passo são o mesmo ato?** **Não — e a Sala os mantém como um só assim mesmo.** São conceitualmente distintos (um é preferência declarada, outro é permissão para tocar o mundo), mas separá-los em dois atos produziria uma segunda confirmação, e segundas confirmações fazem a pessoa desconfiar de si (§5). **A resolução: um único ato, com o alcance dito antes.** Ela confirma uma vez, sabendo que aquilo autoriza a Aliviar a procurar aquele profissional — o alcance é declarado, não fatiado.

**Dita, escrita ou apenas confirmada?** **Confirmada — de forma inequívoca e deliberada, num gesto que não se faz sem querer.** Exigir voz ou escrita seria exigir performance de convicção.

**A formulação do trade-off deve ser registrada?** **Sim, se ela quiser escrevê-la; nunca como condição.** É a frase dela de [A_DECISAO §6](./A_DECISAO.md) — opcional por regra explícita, e é o único texto da Curadoria de autoria dela. A Sala oferece o lugar e o convite; **nunca o campo obrigatório, nunca o bloqueio.**

**Para quem essa formulação existe?** **Para ela.** É a distinção decisiva desta seção: a frase existe para ela reencontrar seu próprio raciocínio meses depois, e **não existe para provar nada a ninguém.**

**Quem tem acesso a ela, hoje:** a paciente; e, conforme as políticas de acesso vigentes, **o Curador do caso e o administrador**. **A transmissão ao profissional não está autorizada** — e a recomendação registrada é que nunca esteja: é reflexão privada sobre uma escolha entre pessoas, e uma delas é ele. **O acesso do Concierge não existe hoje** e depende de decisão e implementação próprias. **Minimização continua sendo o princípio:** cada papel recebe apenas o que precisa para cumprir sua responsabilidade.

> **`VIGENTE` · correção factual.** A redação anterior afirmava *"ela, e só ela"*. **Isso é falso no domínio vigente:** a nota da decisão é legível pelo Curador do caso e pelo administrador. A finalidade continua sendo dela — mas **finalidade não é exclusividade**, e o documento não pode afirmar uma privacidade que o sistema não implementa.
> **`DEPENDENTE DE VALIDAÇÃO JURÍDICA/PRIVACIDADE` · `BLOQUEADO`.** Se o acesso deve ser restringido, ou se basta que ela seja informada de quem lê, **é decisão de privacidade e permanece em aberto.** O que não pode acontecer, sob nenhuma das duas respostas, é ela escrever supondo intimidade sem saber quem lerá.

**A paciente precisa justificar sua decisão?** **Nunca.** Justificar é dever de quem responde a uma autoridade, e **aqui a autoridade é ela.**

**Como preservar a compreensão sem transformar a experiência numa prova.** Quatro regras:

- **A Sala afirma, não pergunta.** Diz o que vai acontecer; não questiona se ela entendeu. *"Você compreendeu que...?"* é interrogatório.
- **Nada é condicionado a resposta correta.** Nenhum aceite, nenhum quiz, nenhuma caixa de "li e entendi".
- **A compreensão é fornecida, não medida.** A obrigação é da Sala (dizer com clareza), não dela (demonstrar).
- **O silêncio dela é resposta suficiente.** Quem não pergunta não é considerada em dúvida.

> **A paciente nunca precisa convencer a plataforma de que escolheu certo. A plataforma é que precisa merecer a confiança dela.**

---

# 4 · Entradas legítimas e o limiar

## 4.1 · As seis entradas

**Todas são iguais.** Nenhuma produz advertência, culpa, bloqueio, aviso de etapa pulada ou exigência de percorrer a Mesa artificialmente. **A Sala não sabe — e não pergunta — por onde a pessoa andou antes.**

| Entrada | Como a Sala se comporta |
|---|---|
| **Percorreu a Mesa** | o caso ordinário; a Sala recebe a formulação e o nome |
| **Chegou decidida, direto** | idêntico. Chegar decidida é um direito, não uma pressa a corrigir — coerente com a regra da Mesa de que ordem é apresentação, nunca liberação |
| **Volta de conversa com o Curador** | a dúvida foi respondida; a Sala **não repete a resposta** nem menciona a conversa como evento |
| **Volta de conversa com o Concierge** | idem, com um cuidado maior: **nada indica que houve insegurança** |
| **Reentrada após recuo** | a Sala está como foi deixada. Sem "você voltou", sem "da última vez você...", sem retomar de onde parou como se fosse tarefa |
| **Nova Curadoria após "nenhum dos três"** | entrada plena, com três nomes novos. **Nunca comparada à anterior**, nunca marcada como segunda tentativa |

**A regra única que cobre as seis:** a Sala trata todas as entradas como a primeira, porque **nenhuma pessoa deve encontrar, no cômodo da própria decisão, o histórico do próprio titubeio.**

## 4.2 · O limiar: qual manifestação abre a Sala

**Clicar num nome não é decidir** — e esta é a regra mais importante do limiar. Um nome tocado é curiosidade, e tratá-lo como intenção transformaria a Mesa num funil.

**A Sala abre por uma manifestação que só faz sentido como decisão:** ela indica **um** profissional **e** manifesta querer seguir com ele. Duas propriedades obrigatórias: **é dirigida a alguém** (não "continuar", que é genérico) e **não é o gesto de ler** (não se abre por explorar, aprofundar, ampliar).

**E ainda assim, atravessar não é confirmar.** O limiar é uma porta, não um compromisso: estar na Sala não decide nada, e sair dela não custa nada. É por isso que a confirmação é um segundo ato, dentro da Sala — a travessia declara *sobre quem* se vai decidir; a confirmação declara *que se decidiu*.

## 4.3 · O que atravessa junto

**Vem:** o nome e o retrato em prosa (a pessoa, não a coluna — herança de **O7**); a formulação do trade-off tal como ela chegou a ela; as prioridades dela, na ordem e na voz dela (**O3**); o estado datado da informação, com aviso ativo se algo venceu (**O9**); e as portas de dúvida e conversa (**O5**).

**Fica na Mesa:** os outros dois caminhos, o Mapa completo, a Correspondência (leitura por linha), o Terreno Comum. **Não porque estejam proibidos — a Mesa continua a um gesto de distância —, mas porque comparar aqui seria refazer o trabalho já feito**, e a Sala é o lugar de sustentar uma decisão, não de reabri-la.

**A distinção que evita o funil.** Um funil estreita **e fecha**; a Sala **estreita e mantém aberto**. O que sai de vista sai *sem sair de alcance*: a Mesa está sempre a um gesto, as duas portas continuam, "nenhum destes" continua. **A prova de que não é funil é que o caminho de volta é tão fácil quanto o de diante** — e não custa nada nem produz aviso.

**Como o trade-off acompanha.** Ele atravessa **como ela o formulou**, não reprocessado, não resumido, não reordenado — no lugar de destaque da Sala, porque é a coisa mais importante que ela traz. Se ela não formulou nada explicitamente, **a Sala não inventa um**: mostra as prioridades e o que aquele caminho encontra e não encontra, e cala.

---

# 5 · A confirmação sem pressão

## 5.1 · As quatro verdades que precedem a confirmação

Ditas uma vez, com serenidade, como informação — nunca como advertência:

**Primeira — o que este ato faz e o que não faz.** Que ele autoriza a Aliviar a procurar aquele profissional. Que **ainda não há consulta marcada, nem horário, nem confirmação dele**.

**Segunda — o que vem depois, e por quem.** Que uma pessoa da equipe segue a partir dali, com nome.

**Terceira — a janela de volta.** Até quando e como ela pode mudar de ideia, e a partir de quando passa a haver alguém do outro lado sabendo. **Enquanto §16-Q1 não estiver decidida, esta verdade não pode ser afirmada** — e a Sala diz o que sabe: que basta dizer, e que alguém trata disso com ela (§6.4).

**Quarta — que a alternativa continua existindo.** Que a Mesa está ali e que "nenhum destes" continua disponível **até este momento inclusive**.

## 5.2 · O que o sistema pode repetir — e o que seria repetição ansiosa

| Repetição legítima | Por quê |
|---|---|
| o nome e o retrato de quem ela escolheu | é sobre quem, não sobre se |
| a formulação do trade-off dela | é o raciocínio dela, sustentando-a |
| o alcance do ato | é a verdade operacional |
| que a informação tem data, se venceu | é honestidade (**O9**) |

| Repetição ilegítima | Por quê |
|---|---|
| *"tem certeza?"* | põe em dúvida uma decisão que ela já tomou |
| *"você não quer rever os outros dois?"* | é a Mesa perseguindo-a; e insinua erro |
| lembrar o que ela abre mão, **como aviso** | o custo é dela e já foi assumido — repeti-lo como alerta é retenção |
| qualquer segunda tela de "confirmar mesmo" | **fabrica hesitação onde não havia** |

**A regra:** *a Sala repete o que sustenta a decisão e nunca o que a questiona.*

## 5.3 · Pausa, retorno, conversa

**Pausar não é um recurso — é a condição normal.** Não existe botão de pausar porque **sair já é pausar**: nada se perde, nada expira, nada muda de estado (**N7**). E nada é registrado como pausa.

**Retornar** devolve a Sala como estava, sem retomada de progresso e sem menção à ausência.

**Conversar** está sempre a um gesto, pelas duas portas (§11), que não competem com a confirmação porque não se parecem com ela: a confirmação é o ato central; as portas são presenças laterais e permanentes.

## 5.4 · Confirmação acidental e confirmações múltiplas

**Contra a acidental — sem inventar fricção.** O gesto é **inequívoco e nomeado**: não é "continuar", não é o gesto que avança telas, e diz o que faz e sobre quem (*"seguir com [nome]"*). Fica **fora do caminho de leitura**, com espaço à sua volta, e nunca sob o dedo de quem está apenas percorrendo — herança direta do vazio-antes-da-porta da Sala Particular. **Não há confirmação por inércia, por tempo, por rolagem, por padrão pré-selecionado ou por qualquer omissão dela (SD-N4).**

**Contra as múltiplas — uma só, sempre.** **Uma decisão, um ato.** Um segundo pedido de confirmação é a plataforma dizendo "não acredito em você", e o efeito é ela deixar de acreditar em si mesma. Se um gesto único e claro não basta para o sistema, **o problema é do gesto, não da convicção dela.**

**Proibido nesta Sala, sem exceção:** contagem regressiva; urgência artificial; escassez não comprovada (*"últimos horários"*, *"ele tem poucas vagas"* — mesmo que fosse verdade, seria pressão); mensagem de perda (*"você vai perder..."*); linguagem de conversão (concluir, finalizar, garantir, aproveitar); celebração desproporcional (**N8**); e **qualquer frase que insinue acerto** — *"ótima escolha"*, *"você escolheu bem"*, *"muitas pacientes escolhem ele"*. Esta última é a mais insidiosa: **elogiar a escolha é declarar que existia certo e errado**, o que destrói **P2** e prepara o arrependimento (A_DECISAO §1: uma decisão bem tomada pode ter resultado ruim — e quem foi parabenizado pelo acerto sofre o dobro quando o resultado vem mau).

---

# 6 · Reversibilidade

*Seção obrigatória, e a única deste documento cuja resposta **não é dada** — porque não pode ser inventada. Ver o conflito 0.1.*

## 6.1 · O que já está decidido pelos documentos

Duas coisas, e só duas:

**Nada está fechado enquanto ela está na Sala e não confirmou.** Estar aqui não compromete com ninguém ([A_MESA §2](./A_MESA.md)).

**Irreversibilidade nunca é punição.** Se algo não puder ser desfeito, é por consequência material — alguém foi contatado, uma agenda foi tocada — jamais por regra disciplinar. **Não existe "você já decidiu" como argumento.**

## 6.2 · O que "comunicada" pode significar — as três fronteiras candidatas

A palavra atravessa a arquitetura inteira sem definição (lacuna 0.5). Existem três candidatas, e **a escolha entre elas é o coração de §16-Q1**:

| Candidata | Marco | Terceiros sabem? | Custo de desfazer |
|---|---|---|---|
| **A** | equipe da Aliviar informada | internos apenas | quase nulo — nada saiu da casa |
| **B** | profissional contatado | **sim, há alguém com expectativa** | há uma pessoa a quem se deve explicação |
| **C** | disponibilidade confirmada / agenda tocada | sim, e há compromisso material | há efeito no mundo de terceiros |

**Leitura arquitetônica (não é decisão):** **B é a fronteira moralmente relevante**, porque é onde nasce a expectativa de alguém — e A_DECISAO §5 já ensina que a decisão aterrissa numa pessoa, não num banco de dados. Entre a confirmação e B há uma janela naturalmente reversível; depois de B, desfazer é possível mas **exige mediação humana**, porque envolve explicação a um terceiro.

## 6.3 · O que a experiência exige, qualquer que seja a decisão de domínio

Quatro requisitos que valem para todas as respostas possíveis:

**A janela é dita antes da confirmação, não depois.** Saber depois o que era irreversível é descobrir que se foi mal informada num momento fundamental.

**A janela é dita em eventos, não em relógio.** *"Até falarmos com ele"* — nunca *"você tem 24 horas"*, que é contagem regressiva por outro nome (**§9 de A_DECISAO**).

**Depois da janela, muda o caminho, nunca a possibilidade.** Não se diz *"não é mais possível"*. Diz-se **o que passa a ser necessário** — e a honestidade tem duas metades.

**A metade que já é verdade:** o Case **continua com um responsável nomeado**. Entre a decisão e a transferência esse responsável é **o Curador do caso**; depois dela, o Concierge. **Não há momento em que o Case fique sem dono.**

**A metade que ainda não é:** que essa pessoa possa **executar** a mudança.

> **`VIGENTE` + `DEPENDENTE DE IMPLEMENTAÇÃO` · aplicação parcial (P-11).** A frase-modelo anterior — *"já falamos com ele — se quiser mudar, me diga e eu cuido disso com você"* — **não é emitível**: sua primeira metade supõe contato que a Aliviar não faz, e a segunda supõe execução que ninguém pode realizar. **A Sala pode nomear quem responde pelo Case; não pode prometer que essa pessoa desfará algo.**

**Mudar de ideia nunca custa constrangimento.** Sem "tem certeza?", sem pedir motivo, sem tom de transtorno. Herança de A_DECISAO §8: *mudar de ideia é uma pessoa vivendo, não uma inconsistência a resolver.*

## 6.4 · A regra vigente, verificada

**A ambiguidade acabou: a regra existe, está no domínio e é garantida por *trigger*.**

**Enquanto o registro permanece em `DECISAO_REGISTRADA`**, a paciente **corrige diretamente** — troca entre os três, sozinha, sem justificar, sem falar com ninguém. A escolha anterior **não é apagada**: fica na sequência de eventos.

**Depois de `CONTATO_INICIADO`**, a correção direta é **bloqueada**. E o ponto que muda a leitura de tudo: **`CONTATO_INICIADO` é hoje uma declaração da própria paciente** — ela informa que iniciou o contato. **É ela quem fecha a própria janela**, e nenhum ato da Aliviar a encurta.

**O que a Sala diz, então:** o que este ato faz agora · o que ainda não aconteceu · e **a janela, nomeando o marco**: *"enquanto você não tiver falado com [nome], pode trocar aqui mesmo."*

> **`DEPENDENTE DE IMPLEMENTAÇÃO`.** A continuação *"depois disso, é só me dizer"* **não está autorizada**. Alteração mediada é direção aprovada (ADR-043 §6) e depende da capacidade *Troca de Profissional* prevista na ADR-028 e do acesso do Concierge ao registro da decisão, hoje inexistente. **Até lá, a Sala não promete caminho de volta depois da janela — e também não afirma que não existe.**

---

# 7 · O registro da decisão

## 7.1 · O princípio

**Registra-se o que a Aliviar precisa para cuidar e para responder pelo que fez. Nada além.** Se um dado só serviria para explicar o comportamento dela, **não se registra.**

## 7.2 · O que se registra, por finalidade

**Necessários à operação** — sem eles não há como agir:
profissional escolhido · momento da confirmação · Case a que pertence · quem confirmou.

**Necessários à continuidade do cuidado** — sem eles o próximo cuida pior:
**a formulação do trade-off, se ela a escreveu** (opcional, texto dela, sem edição — A_DECISAO §6) · pedidos de conversa abertos, com destino · a declaração de "nenhum dos três" **e o que faltou**, na resposta dela.

**Úteis à auditoria** — sem eles não é possível responder depois pelo que foi mostrado:
**a versão das informações apresentadas** — quais evidências, em que estado de verificação, com que data. É o único registro verdadeiramente indispensável à governança: permite dizer, meses depois, **sobre qual informação ela decidiu**. Herança direta da Base de Evidências e da proveniência datada.
Também: **o estado da Curadoria** no momento (quais dos três, qual Relatório) e **a pessoa da equipe** que acompanhava — porque saber a quem recorrer é continuidade, não vigilância.

**Registrado com cuidado especial — a origem da entrada.** Aqui é preciso distinguir: registrar **de qual cômodo** ela veio é operacionalmente útil; registrar **que ela "pulou a Mesa"** é julgamento. A regra: **a origem é registrada como fato de navegação, jamais interpretada como completude, diligência ou maturidade da decisão (SD-N8).**

**O recuo NÃO se registra como evento dela.** Não existe "recuou" no registro. Sair sem confirmar **é a ausência de confirmação, e ausência não é fato a arquivar** — coerente com **N7** (nada muda de estado por ausência) e com a proibição de tratar recuo como falha.

## 7.3 · O que jamais se registra

Tempo de cursor, movimento, foco, rolagem · número de revisitas **como diagnóstico** · qualquer emoção inferida · qualquer rótulo sobre ela — *indecisa*, *insegura*, *difícil*, *hesitante*, *em risco de desistência* · sinal comportamental usado para decidir o que mostrar (**N4**) · qualquer campo que exista para medir a "qualidade" da decisão dela.

> **A paciente nunca é submetida a monitoramento para provar hesitação, segurança ou compreensão. A compreensão é obrigação da Sala, não prova dela.**

---

# 8 · Comunicação e efeitos operacionais

## 8.1 · Os marcos reais, e por que a separação importa

**Nenhum implica o seguinte, e nenhum é simultâneo ao anterior.** Esta tabela foi reescrita na reconciliação (P-9): a versão anterior descrevia seis eventos de um serviço mediado que **não existe no domínio**, entre eles *"profissional contatado — autoridade: pessoa da Aliviar"*.

| # | Marco | Estado | Quem tem autoridade | Pode ser declarado à paciente |
|---|---|---|---|---|
| 1 | **decisão registrada** | `VIGENTE` | **o sistema** | imediatamente — **é a única coisa que a plataforma garante sozinha** |
| 2 | **responsabilidade transferida** ao Concierge | `VIGENTE` (mecanismo) · `DEPENDENTE DE IMPLEMENTAÇÃO` (acesso dele) | ato humano deliberado, com motivo e auditoria | *"seu caso está com [nome]"* — **só depois de transferido**, e hoje ainda não afirmável, porque ele não enxerga a decisão |
| 3 | **modo de contato escolhido** | `DIREÇÃO APROVADA, NÃO IMPLEMENTADA` | **a paciente** | — |
| 4 | **contato iniciado** | `VIGENTE` **como declaração dela** · mediado é `DIREÇÃO APROVADA` | hoje: **a paciente** | *"você registrou que iniciou o contato com [nome]"* |
| 5 | **primeiro contato realizado** | `VIGENTE` | **a paciente**, por declaração | *"você registrou o primeiro atendimento"* |
| 6 | **Relationship iniciado** | `VIGENTE` (nasce do marco 5) | o domínio, atomicamente | — pertence ao ambiente seguinte |

**Não existem, e por isso não aparecem como marcos:** equipe notificada · profissional contatado pela Aliviar · disponibilidade consultada ou confirmada · reserva · encaminhamento. Os quatro primeiros são **direção aprovada e não implementada**; **reserva não existe e nada aqui a cria**; e **"encaminhamento" não é usado como evento**, porque o domínio não tem um correspondente definido.

## 8.2 · O que ela vê imediatamente

**Que a decisão está registrada e guardada** — o único fato consumado.
**Que o Case continua sob responsabilidade da Aliviar**, e o nome de quem responde por ele hoje — que, entre a decisão e a transferência, **é o Curador do caso**.
**O que ainda não aconteceu, dito sem rodeio** — que o profissional ainda não foi contatado, que não há data.
**A frase dela, se escreveu.** O último registro da Curadoria é uma linha de autoria dela.

> **`VIGENTE` · correção factual.** A redação anterior mandava dizer *"quem foi avisado e quando saiu o aviso"* — tratando como imprecisão de linguagem o que é **ausência de fato**. **Nenhuma notificação de equipe é produzida:** o registro persiste a linha e revalida as rotas da paciente; uma pessoa só saberá **ao consultar o sistema**. Não há despacho, não há entrega, não há leitura registrada.
> **`DIREÇÃO APROVADA, NÃO IMPLEMENTADA` (ADR-043 §9):** a Aliviar deverá produzir notificação verificável, com estados distintos para criada, despachada, recebida, lida e responsabilidade assumida — e **cada estado tem uma frase própria; nenhum autoriza a frase do seguinte.**

**E não vê:** recibo, protocolo, número, resumo do pedido, celebração, barra de progresso do encaminhamento (**N8**, **N10**).

## 8.3 · Quando o profissional não está mais disponível

*O caso que mais facilmente vira culpa dela — e nunca é.*

**A Aliviar assume, explicitamente.** É falha nossa de atualidade da informação; a escolha dela permanece **íntegra e bem tomada**. A frase-modelo: *"a informação que mostramos era de [data] e mudou. A sua escolha continua fazendo sentido — o que mudou foi a condição dele, não o seu raciocínio."*

**A decisão permanece válida enquanto a condição material puder ser restaurada.** Só quando for definitivamente impossível é que se volta às alternativas — e aí **elas voltam** (correção 0.4), com a decisão dela nomeada como válida e a formulação do trade-off preservada, porque é justamente ela que orienta a nova conversa.

**Quem avisa é uma pessoa, antes que ela descubra sozinha** (A_DECISAO §10). **Nunca um estado que apareceu na tela.**

**E o Curador retorna** — porque é trabalho de Curadoria, não de acompanhamento. **O Concierge é alcançável desde a Mesa e assume o Case na transferência de responsabilidade**, com motivo registrado; os dois convivem, e a paciente não é transferida de um dia para o outro.

> **`DIREÇÃO APROVADA, NÃO IMPLEMENTADA` — esta seção inteira.** Hoje **ninguém descobre a indisponibilidade**: não há consulta de disponibilidade e não há contato da Aliviar com o profissional. Quem a encontra é a própria paciente, ao procurar — exatamente o que A_DECISAO §10 põe entre as coisas que **nunca** se fazem. **A divergência não foi corrigida por redação**, porque corrigi-la exige capacidade, não texto. Permanece aqui como destino decidido (ADR-043 §8) e **nenhuma frase desta seção pode ser dita à paciente enquanto a capacidade não existir.**

## 8.4 · A regra que governa toda esta seção

> **A plataforma nunca declara concluído o que depende de ação humana ou de confirmação externa. Na dúvida entre parecer eficiente e ser honesta, ela é honesta.**

---

# 9 · O recuo

**Recuar não é falha, abandono, objeção nem evento.** É uma pessoa exercendo exatamente o direito que a arquitetura inteira lhe garante — **não decidir é uma decisão** (A_DECISAO §1).

## 9.1 · Os sete caminhos, todos permanentes e de igual peso

**Voltar à Mesa** — a um gesto, sem aviso e sem custo. **Conversar sobre eles** → Curador. **Conversar sobre si** → Concierge. **Pausar** — que é simplesmente sair; não existe botão porque não existe estado a salvar. **Retomar depois** — a Sala como foi deixada, sem "bem-vinda de volta", sem retomada. **"Nenhum dos três"** — visível aqui como na Mesa (**N5**, §10). **Informar piora clínica** — §12.

## 9.2 · O que o recuo nunca produz

Nenhuma pressão, insistência ou tentativa de retenção · **nenhuma perda de progresso** (não há progresso; a Curadoria não é tarefa a completar) · nenhuma mensagem de fracasso ou de pendência (**N7**) · **nenhum contato automático** — nada dispara por ela ter recuado, e esta é a regra mais dura de sustentar, porque a intenção de "acompanhar" produziria exatamente o contato que **N4** proíbe · **nenhuma alteração silenciosa da Curadoria** — o Case fica como estava, sem reabertura, sem nova busca, sem reclassificação.

**Se alguém a procurar depois de um recuo, será uma pessoa, por uma razão que não seja o recuo** — informação que venceu, algo que mudou —, **nunca para perguntar se ela já decidiu** (A_DECISAO §8).

---

# 10 · "Nenhum dos três"

**Permanece integralmente o que era:** legítimo, visível, acessível e **não subordinado à escolha de um profissional** — não é uma opção que aparece dentro do fluxo de escolher alguém; é uma saída de mesmo nível (**N5**, **P4**).

**Não é diminuído por ela ter chegado à Sala.** Estar aqui não a compromete: sua presença aqui é exatamente a prova de que o limiar não foi um funil (§4.3).

## 10.1 · O que a Sala faz

**Acolhe sem correção de rota** — nada de "quer rever?", nada de "tem certeza?", nada de reapresentar os três.
**Pergunta "o que faltou?"** — pergunta, não oferta (A_DECISAO §4.2). E a resposta é **livre e opcional**: transformá-la em formulário classificado seria pedir que ela diagnostique a nossa falha.
**Preserva a carta** — que segue aberta, porque é o canal do relacionamento e não um documento vencido.
**Devolve o caso à Curadoria** — a um Curador, com nome, não a uma fila.
**Não oferece mais três de imediato** (A_DECISAO §4.3).
**Não atribui culpa, não pede desculpa em nome dela, não a reclassifica**, e **não trata o resultado como exceção operacional indesejada** — o que significa, concretamente: não existe no sistema métrica, rótulo ou estado que enquadre isto como resultado ruim. **A quarta possibilidade — que ela seja difícil de agradar — não existe como categoria.**

## 10.2 · O que retorna à Curadoria e o que permanece

**Retorna:** a declaração; **o que faltou, nas palavras dela**; as prioridades como estavam; a carta; e **quais informações ela viu, em que estado** — porque uma lacuna de verificação pode ter sido a causa.

**Permanece registrado:** a declaração e o que faltou (continuidade do cuidado); o estado da Curadoria e a versão das informações (auditoria). **Não permanece:** nenhum rótulo sobre ela, nenhuma contagem de tentativas, nenhuma marca de "segunda rodada".

**Como ela acompanha o próximo passo.** Por uma pessoa que diz o que vai fazer — herança de A_DECISAO §4.3: *"então ainda não é isso. Vamos entender melhor."* **Sem prazo prometido que não se possa cumprir** (§16-Q5), e **sem estado de espera com aparência de pendência dela.**

## 10.3 · Como evitar que a nova Curadoria repita o Perfil anterior

*O risco real: se o Perfil não mudar, os três novos serão equivalentes aos três velhos, e a segunda rodada falhará pelo mesmo motivo.*

**A regra:** **nova Curadoria exige entendimento revisado, não apenas nova busca.** O "o que faltou" precisa produzir uma alteração observável no Perfil — uma prioridade acrescentada, reordenada, corrigida no grau ou reinterpretada — **ou a constatação explícita, por uma pessoa, de que o Perfil estava certo e o que falta é rede.**

**As duas causas levam a caminhos diferentes** (A_DECISAO §4.3): se faltou entendimento → volta ao **Encontro**; se falta rede → diz-se isso, com estas palavras, e **não se abre nova rodada de comparação para produzir a mesma frustração.**

**A verificação, formulada como requisito:** *nenhuma nova Mesa é aberta sobre um Perfil inalterado sem que uma pessoa tenha registrado por que ele permanece o mesmo* (**SD-O9**).

---

# 11 · Dúvida e insegurança

**As duas portas de [A_DECISAO §3.4](./A_DECISAO.md) permanecem, com o mesmo peso, sem serem acionadas por comportamento e sem competir com a decisão.**

**Como não competem.** Por assimetria de natureza, não de tamanho: **a confirmação é o ato central da Sala; as portas são presenças laterais e permanentes.** Estão sempre no mesmo lugar, não se movem, não aparecem em resposta a nada, e **não crescem quando ela demora** (**N4**). Uma porta que aparece no momento da hesitação é a plataforma diagnosticando — proibido por **P5**.

**A plataforma nunca infere qual porta é necessária.** Ela oferece as duas e **quem sabe é a paciente**.

**Os nomes.** *"Tenho uma dúvida sobre eles."* · *"Quero conversar."* **Nunca:** ajuda, suporte, dificuldade, "não consigo decidir", "precisa de orientação?" — porque apertar um botão de ajuda no meio de uma decisão sobre a própria saúde é admitir que não se está dando conta, e ninguém faz isso.

## 11.1 · Destino, contexto, espera e retorno

| | **"Tenho uma dúvida sobre eles"** | **"Quero conversar"** |
|---|---|---|
| **Destino** | **o Curador**, nominalmente — quem entendeu o caso e escolheu os três | **o Concierge**, nominalmente — alcançável desde a Mesa (correção 0.2) |
| **O que acompanha** | quem ela estava considerando, a prioridade em questão, o estado e a data da informação — **para ele não a fazer repetir a história** | **o mínimo**: que ela quer conversar, e o Case. **Nunca "está insegura", nunca "está há X dias decidindo"** |
| **Expectativa de resposta** | dita com honestidade — **e depende de §16-Q5**. Enquanto não houver prazo comprometido, **diz-se quem vai responder, não quando** | idem, com precedência humana maior |
| **Enquanto não acontece** | **a Sala não muda.** Nada trava, nada fica pendente, a confirmação continua possível — pedir uma dúvida não a impede de decidir | idem. **Nunca "aguardando retorno"**, que transforma o cuidado em fila |
| **Retorno** | a Sala como estava. **A resposta não é repetida na tela**, e a conversa não vira evento visível | idem, com cuidado maior: **nada, em nenhuma superfície, indica que houve conversa** |

**A regra que protege as duas.** **Pedir conversa nunca é sinal.** Não muda o que a Sala mostra, não gera acompanhamento automático, não marca o Case, não a distingue de quem não pediu. Herança direta de **P5** e **N4**.

---

# 12 · Piora clínica e urgência

> **Nenhuma decisão de experiência pode se sobrepor à segurança de quem está sendo cuidado. Quando as duas colidirem, a experiência cede — sempre, e sem discussão.** ([A_DECISAO §10.1](./A_DECISAO.md))

**Esta seção não define protocolo clínico, porque nenhum existe** (§16-Q7). Define apenas o recuo da arquitetura.

**Como se manifesta.** **Por ela dizer** — nunca por inferência. Existe um caminho declarado, permanente, cujo nome fala de ter piorado ou precisar de ajuda agora. **A Sala não detecta, não infere, não classifica gravidade** — inferir estado clínico de comportamento seria a versão mais perigosa do que **P5** proíbe.

**O que acontece:**

**A arquitetura sai da frente.** Nada de percurso, cômodo, comparação ou decisão. Nada é pedido.
**Uma pessoa antes de um formulário.** O caminho mais curto até alguém da Aliviar, imediatamente visível.

> **`BLOQUEADO` · `DEPENDENTE DE VALIDAÇÃO CLÍNICA`.** A redação anterior dizia *"Telefone antes de formulário"*. **Não existe canal de voz confirmado nem horário de operação formalizado**, e o único canal humano existente é iniciado pela paciente, sem monitoramento contínuo comprovável — **não pode ser apresentado como canal de urgência**, nem como solução provisória.
**A Aliviar diz o que não é.** *"A Curadoria não atende urgência"* — declaração institucional de escopo, que a Direção tem autoridade para fazer e que pode ser dita hoje. **Fingir que atendemos seria perigoso.**

**O encaminhamento a um serviço de urgência é a consequência necessária dessa frase — e está bloqueado por §16-Q7.** A_DECISAO §10.1 estabelece o princípio (*saber dizer "isto não é conosco — procure agora este outro lugar" é parte de cuidar*); **qual serviço, com que texto e sob que critério é matéria clínica que este documento tem proibição explícita de criar.** Enquanto Q7 estiver aberta, a Sala faz o que tem autoridade para fazer: **encurta ao máximo o caminho até uma pessoa da Aliviar** e diz que a Curadoria não atende urgência. O que ela **não** pode fazer é emitir orientação de encaminhamento por conta própria.
**O processo espera, intacto.** A decisão não é apagada, não é confirmada, não é revertida. **Fica exatamente como estava**, e nenhum efeito operacional é disparado por este caminho.
**O retorno é possível só quando for adequado** — e **quem julga isso é uma pessoa, com ela.** A plataforma não reabre a Curadoria por conta própria e não a procura para retomar.

**Dependências pendentes, declaradas:** o que caracteriza urgência para efeito de encaminhamento; que serviço se indica e com que texto; qual canal humano atende e em que horário; se há qualquer dever de registro clínico. **Nada disso pode ser inventado por design de experiência** (§16-Q7).

---

# 13 · Estados da Sala

**Não é um funil.** São situações em que a paciente pode estar; várias convivem; a maioria transita para várias outras; **nenhuma é obrigatória** e **a ordem não é imposta**. Em **todos** eles valem, sem repetição: a Mesa a um gesto, as duas portas, "nenhum dos três", o caminho de piora clínica, e a proibição de qualquer disparo por comportamento.

**Uma distinção necessária, para que §2 e esta seção não se contradigam.** A §2 estabelece que a responsabilidade da Sala **termina no registro** — e os estados **E10, E11 e E12 são posteriores a ele**. Não são exceção à regra: neles a Sala **não produz mais nada**, e sua única função remanescente é **relatar com honestidade o que pessoas fizeram** (SD-P4, §8.4). São modelados aqui, e não no ambiente seguinte, por uma razão específica: **é neles que a plataforma mais facilmente mentiria** — declarando contato, agenda ou acompanhamento que ainda não existem. Estão nesta lista para que essa mentira seja proibida por escrito, não porque a Sala continue trabalhando.

**E1 · Chegou com preferência** — *Vê:* a pessoa escolhida, sua formulação, as prioridades dela, o alcance do ato. *Pode:* tudo. *Sistema pode:* apresentar as quatro verdades (§5.1). *Não pode:* presumir intenção de confirmar; tratar a chegada como conversão iniciada. → qualquer estado.

**E2 · Formulando a decisão** — *Vê:* o mesmo; nada muda por ela estar demorando. *Pode:* reler, sair, perguntar, escrever a frase. *Sistema pode:* **nada — este é o estado em que o sistema mais precisa ficar quieto.** *Não pode:* oferecer ajuda, dica, comparação ou qualquer conteúdo novo (**N4**). → qualquer estado.

**E3 · Pronta para confirmar** — **Este estado não existe para o sistema.** Nenhuma superfície o representa, nenhuma marca o registra, **e a Sala jamais o reconhece** (**N9**). Existe apenas dentro dela, e é o critério de A_DECISAO §2 — conseguir dizer o que abre mão. *Próxima transição:* a que ela quiser.

**E4 · Pediu dúvida sobre os profissionais** — *Vê:* que a pergunta chegou a alguém com nome. *Pode:* tudo, **inclusive confirmar** — a pergunta não trava a decisão. *Sistema pode:* despachar com o contexto do caso. *Não pode:* bloquear a confirmação; marcar "aguardando"; responder no lugar do Curador. → qualquer estado.

**E5 · Pediu conversa** — igual a E4, com o Concierge e com o contexto mínimo. *Não pode:* transmitir qualquer leitura emocional; marcar o Case; alterar o que a Sala mostra. → qualquer estado.

**E6 · Pausou** — *Vê:* nada, porque saiu. *Sistema pode:* **nada.** *Não pode:* contato automático, lembrete, mudança de estado, degradação (**N7**). → volta quando quiser, a qualquer estado.

**E7 · Recuou para a Mesa** — *Vê:* a Mesa como estava. *Sistema pode:* nada além de manter tudo intacto. *Não pode:* registrar recuo; avisar alguém; mostrar "você voltou". → qualquer estado, inclusive voltar à Sala.

**E8 · Declarou "nenhum dos três"** — *Vê:* acolhimento e a pergunta "o que faltou?"; depois, uma pessoa e o que ela fará. *Pode:* responder ou não; voltar atrás. *Sistema pode:* registrar a declaração e a resposta dela; devolver à Curadoria. *Não pode:* oferecer mais três; classificar a resposta; rotulá-la; tratar como exceção indesejada. → nova Curadoria, ou pausa, ou conversa.

**E9 · Confirmou** — *Vê:* que está registrado, **quem responde pelo Case hoje** (o Curador, até a transferência), e **o que ainda não aconteceu**. *Pode:* escrever a frase; conversar; **trocar entre os três, enquanto não tiver declarado contato** (§6.4). *Sistema pode:* registrar. *Não pode:* celebrar; emitir recibo; declarar contato, agenda ou consulta; **dizer que alguém foi avisado**; prometer alteração mediada. → E10.

**E10 · Decisão registrada, aguardando ação humana** — *Vê:* o que está feito e o que está pendente **do nosso lado**, sem contagem, sem barra, **e sem que a pendência pareça dela**. *Pode:* conversar; trocar, enquanto a janela existir. *Sistema pode:* manter a verdade atualizada quando uma pessoa reportar um passo. *Não pode:* inventar progresso; **prometer prazo — nenhum é comprometido, e não há horário de operação formalizado**; declarar qualquer marco da §8.1 sem que a pessoa com autoridade o tenha produzido. → E12, ou E11, ou E14, ou conversa.

**E11 · Profissional indisponível** — *Vê:* o aviso, dado por uma pessoa, assumindo a falha como nossa, com a decisão dela nomeada como válida. *Pode:* esperar restauração; retomar as alternativas; declarar "nenhum dos três"; conversar. *Sistema pode:* preservar a decisão e a formulação; devolver as alternativas quando a impossibilidade for definitiva. *Não pode:* apresentar isso como erro dela; retirar a escolha silenciosamente; substituir o profissional por conta própria. → alternativas, ou nova Curadoria, ou pausa.

**E12 · Encaminhamento iniciado** — *Vê:* o que foi efetivamente acordado, e por quem. *Pode:* tudo o que o cômodo seguinte permitir. *Sistema pode:* relatar o que pessoas confirmaram. *Não pode:* declarar acompanhamento iniciado antes de o Concierge ter assumido nominalmente. → ambiente seguinte.

**E13 · Piora clínica ou urgência** — *Vê:* o caminho mais curto até uma pessoa da Aliviar, e a informação de que a Curadoria não atende urgência. *Pode:* falar com alguém. *Sistema pode:* recuar e preservar tudo. *Não pode:* pedir qualquer coisa; disparar efeito operacional; inferir gravidade; reabrir sozinho; **apresentar qualquer canal existente como canal de urgência**; **prometer rapidez** — não há horário de operação nem monitoramento contínuo comprovável. → retomada apenas por decisão humana com ela.

**E14 · O contato não avançou** *(acrescentado na reconciliação — P-8)* — *Vê:* o registro de que a conexão não vingou, **sem tom de fracasso dela**. *Pode:* voltar às alternativas; declarar "nenhum dos três"; conversar; pausar. *Sistema pode:* registrar o desfecho e preservar tudo. *Não pode:* **encerrar por decurso de tempo** — só a declaração dela encerra; tratar como falha, contabilizar como desistência, ou rotulá-la. → alternativas, ou nova Curadoria, ou pausa.

> **`VIGENTE` · correção factual (P-8).** Este desfecho **existe no domínio** — a conexão pode simplesmente não vingar — e nenhum documento das Fases 7 a 9 o previa. **Silêncio nunca é desfecho:** um Case sem movimento não pode ser tratado, contado ou exibido como conexão bem-sucedida, nem encerrado por inatividade.

---

# 14 · O que a Sala herda e o que entrega

## 14.1 · Herda (auditável)

**Princípios:** todos os 7 de A_DECISAO (P1–P7), sem exceção nem atenuação.
**Proibições:** todas as 10 (N1–N10) — e sua aplicação neste cômodo está mapeada em §17.1.
**Obrigações:** as 9 (O1–O9), com a leitura de que **O1 e O2 foram cumpridas pela Mesa** e a Sala não as repete (repetir a comparação aqui violaria P3); as demais valem diretamente.
**Da Mesa:** as saídas (Decisão, sair sem escolher, "nenhum destes", as duas portas); o limiar como porta e não compromisso; a recusa de prometer reversibilidade; a regra de que ordem é apresentação e nunca liberação; e os limites de responsabilidade (a Mesa não decide, não recalcula, não reordena).
**Informações:** o nome e o retrato; a formulação do trade-off; as prioridades na ordem e na voz dela; o estado datado da informação.

## 14.2 · Entrega ao ambiente seguinte (só fatos produzidos ou confirmados aqui)

**Pode declarar verdadeiro:**
decisão **registrada**, com momento e Case · **profissional escolhido** por ela · a **formulação do trade-off**, se ela a escreveu · **conversa solicitada**, com destino e sem leitura emocional · **processo pausado por ausência de confirmação** (que não é evento registrado, apenas ausência) · **retorno à Curadoria** com o "o que faltou" · **autorização para procurar o profissional** — que é o alcance real do ato · **a versão das informações apresentadas.**

**Não pode declarar, em hipótese alguma:**
consulta marcada · profissional confirmado ou ciente · disponibilidade verificada · acompanhamento iniciado · decisão irreversível (**enquanto §16-Q1 estiver aberta, nem reversível**) · compreensão comprovada · prontidão atestada · qualquer estado emocional · qualquer prazo não comprometido por uma pessoa.

---

# 15 · Proibições, obrigações e princípios da Sala

*Requisitos específicos deste cômodo. Não repetem N/O/P — herdam-nos e acrescentam o que só esta fase torna necessário.*

## 15.1 · Proibições — SD-N

**SD-N1.** Tratar qualquer sinal que não seja a confirmação explícita como decisão — clique num nome, travessia do limiar, tempo, retorno ou inclinação dita a alguém.
**SD-N2.** Pedir confirmação mais de uma vez, sob qualquer forma (segunda tela, "tem certeza?", reconfirmação por canal diverso).
**SD-N3.** Declarar concluído, marcado, confirmado ou iniciado qualquer evento da §8.1 que dependa de pessoa ou de terceiro e ainda não tenha ocorrido.
**SD-N4.** Permitir que a confirmação ocorra por inércia, tempo, rolagem, padrão pré-selecionado, ou por qualquer omissão dela.
**SD-N5.** Afirmar, negar ou insinuar reversibilidade além do que a decisão de domínio §16-Q1 tiver estabelecido.
**SD-N6.** Registrar recuo, pausa, hesitação, número de visitas ou qualquer rótulo sobre a pessoa.
**SD-N7.** Exigir, condicionar ou induzir a escrita da frase dela; ou usá-la para qualquer finalidade de avaliação.
**SD-N8.** Interpretar a origem da entrada como completude, diligência ou maturidade da decisão.
**SD-N9.** Emitir qualquer frase que insinue acerto ou erro na escolha — inclusive elogio ("ótima escolha", "você escolheu bem", "muitas escolhem ele").
**SD-N10.** Bloquear a confirmação por haver conversa pendente, dúvida em aberto ou informação vencida — a informação vencida é **dita**, nunca usada como trava.
**SD-N11.** Disparar qualquer contato automático em razão de recuo, pausa, demora ou pedido de conversa.
**SD-N12.** Apresentar indisponibilidade do profissional como consequência, erro ou responsabilidade da paciente.

## 15.2 · Obrigações — SD-O

**SD-O1.** Dizer as quatro verdades da §5.1 **antes** da confirmação: o alcance do ato; quem segue e com que nome; a janela de mudança de ideia (nos limites de §6.4); e que as alternativas continuam existindo.
**SD-O2.** Tornar o gesto de confirmar inequívoco e nomeado — dizendo o que faz e sobre quem —, fora do caminho de leitura e com vazio à volta.
**SD-O3.** Distinguir, em toda superfície, **o que está registrado** de **o que ainda depende de pessoas**, com honestidade sobre o segundo.
**SD-O4.** Oferecer o lugar da frase dela como convite opcional, preservando o texto sem edição.
**SD-O5.** Manter, em todos os estados, a Mesa a um gesto, as duas portas, "nenhum dos três" e o caminho de piora clínica.
**SD-O6.** Tratar todas as entradas como a primeira: sem histórico de titubeio, sem retomada de progresso, sem menção a etapas puladas.
**SD-O7.** Registrar a versão datada das informações apresentadas, para que se possa responder depois sobre qual informação ela decidiu.
**SD-O8.** Comunicar indisponibilidade por meio de uma pessoa, assumindo a falha como da Aliviar e nomeando a decisão dela como válida.
**SD-O9.** Não abrir nova Mesa sobre Perfil inalterado sem que uma pessoa tenha registrado por que ele permanece o mesmo.
**SD-O10.** Fazer o Concierge ser apresentado nominalmente pelo Curador no instante da decisão, sem que a paciente precise recontar sua história.

## 15.3 · Princípios — SD-P

**SD-P1.** A Aliviar age sobre declaração, nunca sobre compreensão inferida.
**SD-P2.** A compreensão é obrigação da Sala, não prova da paciente.
**SD-P3.** Uma decisão, um ato.
**SD-P4.** A responsabilidade da Sala termina no registro; o que vem depois é relatado, nunca prometido.
**SD-P5.** Irreversibilidade, quando existir, é consequência material — jamais penalidade.
**SD-P6.** Recuo é resultado legítimo da Sala, não sua falha.
**SD-P7.** Nenhuma promessa sem autoridade identificável sobrevive nesta arquitetura.

## 15.4 · Matriz de rastreabilidade

| Req. | Origem | Justificativa | Risco que evita | Como validar |
|---|---|---|---|---|
| SD-N1 | N3, P3, §4.2 | comparar e decidir são atos distintos | funil: navegação virar intenção | percorrer toda a Mesa e o limiar sem que nada seja registrado como decisão |
| SD-N2 | N1, §5.4 | dupla confirmação fabrica hesitação | ela desconfiar de si mesma | contar os atos de confirmação: exatamente um |
| SD-N3 | §8 do brief; lacuna 0.3 | separação dos seis eventos | mentir sobre o estado do mundo | para cada frase exibida, identificar quem tem autoridade (§17.4) |
| SD-N4 | N1, N9 | confirmação é ato deliberado | decisão por descuido | tentar confirmar sem gesto explícito — impossível |
| SD-N5 | **conflito 0.1** | não há regra de reversibilidade | promessa quebrada no ponto mais frágil | varrer **toda superfície e todo roteiro falado apresentados à paciente** por "reversível", "desfazer", "cancelar", "voltar atrás": nenhuma afirmação nem negação |
| SD-N6 | N4, N7, P5, §7 | ausência não é fato | vigilância comportamental | inspecionar o registro após um recuo: nada além do que já existia |
| SD-N7 | A_DECISAO §6 | a frase é opcional por regra | peso adicional em momento frágil | confirmar sem escrever nada: possível e sem perda |
| SD-N8 | N9; regra da Mesa (ordem ≠ liberação) | chegar decidida é um direito | julgamento silencioso de diligência | entrada direta produz experiência idêntica |
| SD-N9 | P2, A_DECISAO §1 | não existe melhor; decisão boa ≠ resultado bom | preparar arrependimento pelo elogio | varrer por adjetivo avaliativo sobre a escolha |
| SD-N10 | O9, P1 | honestidade não é trava | paternalismo com aparência de zelo | com informação vencida, confirmar continua possível |
| SD-N11 | N4, A_DECISAO §8, §9 | hesitação nunca dispara nada | "acompanhar" virar perseguir | recuar e observar: nenhum contato em nenhum canal |
| SD-N12 | A_DECISAO §10 | falha de atualidade é nossa | culpar a paciente por falha nossa | ler o texto de indisponibilidade: sujeito é a Aliviar |
| SD-O1 | §5.1; consequência desta fase | a verdade precede o ato | confirmar sem saber o alcance | as quatro verdades presentes antes do gesto |
| SD-O2 | N1, Sala Particular §9.3 | o ato central precisa de vazio | confirmação acidental | o gesto não está no caminho de leitura |
| SD-O3 | §8.4; lacuna 0.3 | separar registro de efeito | declarar concluído o pendente | toda superfície pós-confirmação distingue os dois |
| SD-O4 | A_DECISAO §6 | autoria dela é o último registro | perder o antídoto do arrependimento | o convite existe e é ignorável |
| SD-O5 | N5, O5, O6, A_DECISAO §10.1 | as saídas não podem estreitar | funil por remoção de alternativa | listar as saídas em cada um dos 13 estados |
| SD-O6 | §3 do brief; regra da Mesa | ninguém encontra o próprio titubeio | vergonha da hesitação | comparar as seis entradas: idênticas |
| SD-O7 | Base de Evidências; governança | responder depois pelo que se mostrou | não saber sobre o que ela decidiu | reconstruir, a partir do registro, a informação exibida |
| SD-O8 | A_DECISAO §10; lacuna 0.4 | a escolha continua íntegra | a falha material virar erro dela | o aviso vem de pessoa e nomeia a decisão como válida |
| SD-O9 | A_DECISAO §4.3 | mais opções sobre Perfil errado repete o resultado | segunda rodada falhar igual | nenhuma Mesa nova sem alteração ou justificativa registrada |
| SD-O10 | A_DECISAO §7; correção 0.2 | passagem por pessoa é continuidade | abandono no momento mais frágil | a paciente não reconta a história ao Concierge |
| SD-P1..P7 | síntese das fases 7–9 | fundam os requisitos acima | — | cada SD-N/SD-O rastreia a pelo menos um |

---

# 16 · Questões que exigem decisão de domínio

*O documento não as inventa. Cada uma bloqueia uma promessa específica.*

> **Reconciliação (P-10).** As quatro primeiras questões foram registradas como abertas, e **não estavam**: a arquitetura implementada já as respondia. O estado revisto está abaixo; as demais permanecem como estavam.

**Q1 · Até quando a escolha pode ser revista, e o que significa "comunicada"?** — **RESPONDIDA pelo domínio vigente, ampliada pela ADR-043.** A correção direta é possível enquanto o registro está no estado inicial, e é bloqueada por *trigger* depois que a paciente declara ter iniciado o contato. **"Decisão comunicada" deixa de existir como evento único** — os marcos são os da §8.1. *Permanece aberto:* o que se torna possível **depois** da janela (alteração mediada), `DEPENDENTE DE IMPLEMENTAÇÃO`.

**Q2 · Em que momento o profissional é contatado?** — **A pergunta estava mal formulada para o domínio vigente: hoje a Aliviar não contata o profissional.** A ADR-043 decidiu que passará a fazê-lo, em dois modos (intermediado e direto acompanhado). *Permanece aberto:* qual alternativa operacional, `DIREÇÃO APROVADA, NÃO IMPLEMENTADA`.

**Q3 · Existe reserva de agenda, expectativa ou compromisso?** — **RESPONDIDA: não existe.** Nada no domínio representa agenda, horário, disponibilidade consultada ou reserva. **Nenhuma decisão futura torna as frases de garantia emitíveis sem antes criar o evento que as sustente.**

**Q4 · Quem tem autoridade para alterar a escolha?** — **RESPONDIDA: a paciente, e só ela**, enquanto a janela direta existir. Curador e administrador têm leitura, não escrita. *Permanece aberto:* quem executa a **alteração mediada** depois da janela — `DEPENDENTE DE IMPLEMENTAÇÃO`, e cruza com a capacidade *Troca de Profissional* prevista na ADR-028.

**Q5 · Qual é o prazo humano comprometido — para resposta a dúvida, a conversa, e para o contato?**
*Impacto:* atravessa §8.2, §10.2, §11.1 e o estado E10. **É o que hoje impede a Sala de dizer "quando".**
*Risco:* ou prometer prazo que não se cumpre, ou o silêncio parecer abandono — os dois males que A_DECISAO §9 distingue.
*Responsável:* Operação.

**Q6 · A formulação do trade-off é visível ao Curador e ao Concierge?**
*Decisão:* quem lê a frase dela.
*Por que não se inventa:* é decisão de privacidade, não de design.
*Impacto:* §3 estabelece que ela existe **para a paciente**; que outros a leiam é decisão separada, e a paciente precisaria saber.
*Risco:* ela escrever supondo intimidade e ser lida por terceiros.
*Responsável:* Direção + Privacidade.

**Q7 · Política de urgência.**
*Decisão:* o que caracteriza urgência para encaminhamento; que serviço se indica; que canal humano atende, com que horário; se há dever de registro.
*Por que não se inventa:* **é matéria clínica**, e este documento tem proibição explícita de criar regra clínica.
*Impacto:* §12 fica incompleta sem ela.
*Risco:* **risco à segurança de uma pessoa** — o único risco desta lista que não é de experiência.
*Responsável:* Direção + responsabilidade técnica clínica.

**Q8 · Efeitos jurídicos da confirmação.**
*Decisão:* se a confirmação constitui qualquer obrigação da Aliviar, do profissional ou da paciente.
*Impacto:* governa a linguagem da §5.1 e a proibição de gramática de compra ganha ou perde consequência.
*Risco:* linguagem de cuidado encobrindo (ou criando) vínculo não pretendido.
*Responsável:* Jurídico.

**Q9 · Quando o Concierge assume, formalmente?**
*Decisão:* ratificar a correção 0.2 — alcançável desde a Mesa, assume no instante da decisão.
*Impacto:* sem ela, a porta "quero conversar" da Mesa não tem destino definido.
*Risco:* o pedido de conversa cair no vazio.
*Responsável:* Operação.

**Q10 · O que a equipe vê quando alguém pede conversa.**
*Decisão:* o conteúdo exato do contexto transmitido.
*Impacto:* §11.1 exige "o mínimo" e proíbe leitura emocional; o limite exato é operacional.
*Risco:* reintroduzir, pelo lado da equipe, a classificação emocional que **P5** proíbe.
*Responsável:* Operação + Privacidade.

---

# 17 · Auditoria final

## 17.1 · Contra A_DECISAO.md

**Proibições (N)** — **N1** §5.2, SD-N9 (nenhum destaque, nenhum elogio) · **N2** não há três a ordenar; a Sala trata de um · **N3/P3** a Sala **é** a separação: recebe o ato, sem comparação · **N4** §5.3, §11, §13-E2, SD-N11 · **N5** §10, SD-O5 (visível **até este momento inclusive**) · **N6** nada somável; nem no registro nem na superfície · **N7** §5.3, §9.2, §13-E6 · **N8** §5.4, §8.2 · **N9** §3, §13-E3 (o estado "pronta" não existe para o sistema) · **N10** §5.4, §8.2.

**Obrigações (O)** — **O1/O2** cumpridas pela Mesa; a Sala **não as repete** (repetir violaria P3), mas **carrega a formulação** (§4.3) · **O3** §4.3 · **O4** §9, SD-P6 · **O5** §11, SD-O5 · **O6** §9.1, §10 · **O7** §4.3 (o retrato atravessa; a pessoa, não a coluna) · **O8** o limiar da Mesa; a Sala é o outro lado da porta · **O9** §4.3, §5.1, SD-N10 (dito, nunca trava).

**Princípios (P)** — **P1** §3, SD-P1 · **P2** SD-N9 · **P3** §2 (razão de existir) · **P4** §10 · **P5** §11, §12, §7.3 · **P6** §7 · **P7** §2 (a responsabilidade termina no registro; o cuidado é o cômodo seguinte).

## 17.2 · Contra A_MESA.md

**As saídas da Mesa** — Sala da Decisão: **é esta** · sair sem escolher: §9 · "nenhum destes": §10, preservado com o mesmo peso · as duas portas: §11, preservadas com os mesmos nomes e sem inferência.

**As promessas da transição** — *a porta não é compromisso*: §4.2 (atravessar não confirma) · *nada está fechado enquanto ela está na Mesa*: estendido — nada está fechado até ela confirmar (§6.1) · *a Mesa não define reversibilidade*: **honrado** — a Sala também não a inventa (§6, Q1) · *ordem é apresentação, nunca liberação*: §4.1, SD-N8.

**Os dados entregues** — nome, retrato, formulação, prioridades na voz dela, estado datado: todos recebidos e usados em §4.3; nenhum reprocessado, resumido ou reordenado.

**Os limites de responsabilidade** — a Mesa não decide, não recalcula, não reordena: a Sala **também não**, e não recalcula compatibilidade nem toca peso algum. **Nenhuma promessa da Mesa foi ampliada aqui.**

## 17.3 · Auditoria de não persuasão

Nenhum elemento **ordena** (há um só profissional) · **recomenda silenciosamente** (SD-N9 proíbe até o elogio) · **pressiona** (sem prazo, contagem, escassez, perda) · **cria urgência** (§5.4) · **pune recuo** (§9.2, SD-P6, SD-N6 — o recuo nem sequer é registrado) · **esconde "nenhum dos três"** (§10, SD-O5, presente em todos os 13 estados) · **interpreta comportamento como estado emocional** (§7.3, §11, §12) · **transforma confirmação em métrica de sucesso** — e este é o ponto que a §2 resolve na raiz: **a frase que mede a missão vale igualmente para quem não confirmou.**

## 17.4 · Auditoria de autoridade

| Afirmação feita à paciente | Quem garante | Situação |
|---|---|---|
| "sua decisão está registrada" | **sistema** | ✅ pode ser dita |
| "quem segue a partir daqui é [nome]" | **operação** | ✅ se a pessoa existir e estiver designada |
| "seu caso continua sob responsabilidade da Aliviar" | **arquitetura do Case** | ✅ o Case sempre tem responsável registrado |
| "quem responde pelo seu caso hoje é [nome]" | **arquitetura do Case** | ✅ é leitura do responsável atual |
| "enquanto você não tiver falado com [nome], pode trocar aqui mesmo" | ***trigger*** | ✅ garantido pelo domínio |
| "o aviso saiu para [nome] em [momento]" | **ninguém, hoje** | ⛔ **não há notificação alguma** — corrigido na Fase 9D |
| "seu caso está com [nome], do Concierge" | **mecanismo existe** | ⛔ **bloqueada** — ele não tem acesso ao registro da decisão |
| "o profissional ainda não foi contatado" | **sistema** | ✅ é negativa verificável |
| "esta informação é de [data]" | **Base de Evidências** | ✅ proveniência datada |
| "até [marco], nada está fechado" | **política ainda não definida** | ⛔ **bloqueada por Q1** |
| "se mudar de ideia, [nome] cuida disso com você" | **operação** | ⛔ **bloqueada por Q4** (quem é "[nome]") |
| "responderemos em [prazo]" | **operação** | ⛔ **bloqueada por Q5** |
| "a decisão é reversível" | **ninguém, hoje** | ⛔ **removida** (conflito 0.1) |
| "ele já sabe" / "consulta marcada" / "acompanhamento iniciado" | **ninguém, antes do fato** | ⛔ **proibidas** (SD-N3) |
| "a Curadoria não atende urgência" | **Direção** | ✅ é declaração institucional de escopo |
| "procure agora [serviço de urgência]" | **política clínica** | ⛔ **bloqueada por Q7** |

**Nenhuma promessa sem autoridade permanece afirmada neste documento.** As bloqueadas estão marcadas como tais e vinculadas à questão que as libera.

---

# 18 · Critério de conclusão

| # | Pergunta | Onde é respondida |
|---|---|---|
| 1 | preferência × decisão × confirmação × encaminhamento | §1 (sete níveis, quatro fronteiras) |
| 2 | quando a decisão produz efeitos | §1 (fronteiras 3 e 4), §8.1 |
| 3 | o que pode ser revertido | §6 — **decomposto, com a resposta em Q1** |
| 4 | o que acontece no recuo | §9, §13-E6/E7 |
| 5 | como "nenhum dos três" retorna | §10 |
| 6 | dúvida × insegurança sem diagnóstico | §11 (duas portas, ela escolhe) |
| 7 | o que a Sala registra | §7 |
| 8 | o que entrega ao próximo ambiente | §14.2 |
| 9 | promessas dependentes de decisão operacional | §16 (Q1–Q10), §17.4 |
| 10 | como verificar que protege autonomia, não conversão | §2 (a frase da missão), §17.3 |

---

# 19 · Estado de implementação desta Sala

*Acrescentado na reconciliação (Fase 9D). **Nenhuma decisão nova.***

## `VIGENTE` — o que a Sala pode afirmar hoje

*"Sua decisão está registrada."* · *"Seu caso continua sob responsabilidade da Aliviar."* · *"Quem responde pelo seu caso hoje é [nome]."* · *"Enquanto você não tiver falado com [nome], pode trocar aqui mesmo."* · *"Você registrou que iniciou o contato."* · *"Você pode escolher conversar."* · *"Nenhum dos três é uma resposta legítima."* · *"A Curadoria não atende urgência."*

## `DIREÇÃO APROVADA, NÃO IMPLEMENTADA` — ADR-043

Notificação verificável à equipe · atribuição operacional ao Concierge **com acesso ao que ele responde** · escolha explícita do modo de contato · a Aliviar iniciar ou coordenar o contato · consulta e resposta de disponibilidade · indisponibilidade como evento comunicado por uma pessoa · alteração mediada depois da janela direta.

## `BLOQUEADO` — nenhuma pode ser dita à paciente

*"O Curador foi avisado."* · *"O Concierge já está acompanhando."* · *"Entraremos em contato em breve."* · *"O profissional recebeu."* · *"A disponibilidade foi confirmada."* · *"Sua consulta está encaminhada."* · *"Está tudo certo."* · *"Responderemos em [prazo]"* — **não há horário de operação formalizado nem detecção de caso parado** · qualquer instrução de urgência, `DEPENDENTE DE VALIDAÇÃO CLÍNICA` · quem lê a frase dela, `DEPENDENTE DE VALIDAÇÃO JURÍDICA/PRIVACIDADE`.

## A fronteira com os módulos vizinhos

**A Sala produz confirmação e registro.** A transição até o primeiro contato é governada por **Connection**; o acompanhamento posterior, por **Relationship**, onde vive a **Troca de Profissional** já prevista na ADR-028. **A Sala não cria um terceiro território** — e a indisponibilidade antes do primeiro contato pode devolver o fluxo à Mesa ou à Curadoria, conforme modelagem futura. **O evento técnico exato dessa fronteira ainda não foi decidido e não é presumido aqui.**

---

> **A Sala da Decisão não existe para que a paciente decida. Existe para que, tendo decidido ou não, ela saia sabendo exatamente onde está — e para que nada tenha acontecido no mundo que ela não tenha autorizado.**
