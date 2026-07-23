# Especificação Oficial da Experiência da Curadoria Compartilhada

**Estado**: **Proposto** — aguardando aprovação do responsável do projeto.

**Autoridade**: obrigatório para Landing, Portal do Curador, Portal do Paciente, Relatórios, comunicação, treinamento e evolução futura do Método.

**O que este documento é.** A coreografia da relação entre **Paciente, Curador e Sistema**, momento a momento. Não descreve funcionalidades; descreve quem faz o quê, quando, e o que cada um sente enquanto isso acontece.

**Como se distingue dos documentos irmãos:**

| Documento | Responde |
|---|---|
| [`FUNDAMENTOS`](FUNDAMENTOS_DO_METODO_ALIVIAR.md) | O que a Aliviar é |
| [`ONTOLOGIA`](ONTOLOGIA_CURADORIA_COMPARTILHADA.md) | Do que a Curadoria é feita |
| [`ENGINE`](CURATION_ENGINE_SPECIFICATION.md) | Como o processo interno funciona |
| [`EXPERIENCE_BIBLE`](EXPERIENCE_BIBLE.md) | **Como cada etapa deve fazer a pessoa se sentir** |
| **Este documento** | **Como a conversa acontece entre os três participantes** |

A Experience Bible define a emoção-alvo; esta especificação define a **coreografia** que a produz. Onde houver conflito, a Bible prevalece.

**Nenhum código, componente ou schema foi criado ou alterado nesta missão.**

---

## 1. O princípio

**A tecnologia nunca é protagonista. O protagonista é a conversa.**

O Portal existe para potencializar essa conversa — nunca para substituí-la, nunca para competir com ela, nunca para ser o assunto dela.

Disso derivam três regras de coreografia que valem em todos os nove momentos:

**R1 — O Sistema nunca fala com o paciente sem passar por uma pessoa.** Nenhuma notificação automática comunica decisão, resultado, atraso ou pedido. A única exceção é a informação de andamento já combinada.

**R2 — Durante a escuta, o Sistema desaparece.** Enquanto o paciente fala, a tela é mínima. O registro acontece em traços curtos, ou depois. Um Curador dividido entre a pessoa e o software não está conduzindo.

**R3 — O que o paciente vê é o mesmo que o Curador vê, menos o nível interno.** Nunca uma versão simplificada, resumida ou "adaptada". Compartilhar é ver a mesma coisa — a diferença é apenas o score, que é ferramenta de ofício.

---

## 2. Os três participantes

| | Traz | Nunca faz |
|---|---|---|
| **Paciente** | A verdade sobre a própria vida, e a decisão final | Precisa saber medicina, ou justificar a escolha |
| **Curador** | Competência de condução, interpretação e análise | Diagnostica, opina clinicamente, ou escolhe pelo paciente |
| **Sistema** | Memória, organização, cálculo, rastreabilidade | Conduz, decide, seleciona ou fala sozinho |

Uma leitura que vale para todos os momentos: **o Sistema é o terceiro participante mais silencioso da sala.** Ele nunca pede a palavra.

---

## 3. Os nove momentos

Cada momento é descrito em cinco vistas: **o que acontece**, **o Paciente**, **o Curador**, **o Sistema**, e **o sinal de que funcionou**.

---

### Momento 1 — Preparação

*O paciente ainda não chegou.*

**O que acontece.** O Curador se prepara para conhecer uma pessoa, não para abrir um caso.

**O Paciente.** Ausente — mas já está sendo cuidado. A qualidade desta meia hora aparece nos primeiros dois minutos da conversa.

**O Curador.** Precisa saber quatro coisas, e nenhuma a mais:

1. **Quem é essa pessoa** — nome, quem ela acompanha (muitas vezes não é por si que ela procurou), o que a trouxe.
2. **O que ela já contou** — para nunca pedir que recomece.
3. **O que já se sabe de documentos** — revisados antes, nunca abertos pela primeira vez na frente dela.
4. **O que falta** — para saber o que perguntar, e para não fingir que sabe.

**O Sistema.** Apresenta a pessoa, não o registro. A tela de preparação é uma leitura curta em prosa, não um formulário preenchido. Marca claramente o que é **fato relatado** e o que é **lacuna** — porque o Curador precisa saber a diferença antes de abrir a boca.

**Como o Sistema reduz ansiedade antes da consulta.** Duas coisas, e nada além:
- Diz o que o Curador **não** vai precisar perguntar (já está registrado).
- Diz o que **precisa** ser perguntado, sem transformar isso em roteiro obrigatório.

**Nunca.** Sugerir perguntas prontas para copiar. Estimar duração. Mostrar quantos casos ele tem hoje.

**Sinal de que funcionou.** O Curador entra na conversa sabendo o nome da pessoa e o que ela já disse — e o paciente percebe isso na primeira frase.

---

### Momento 2 — Primeiro contato

*O paciente entra.*

**O que acontece.** Dois minutos que definem o resto.

**O Paciente.** Chega cansado e cético. Já contou essa história antes, para gente que não escutou. Espera ser interrompido.

**O Curador.** Recebe demonstrando que leu — não perguntando do zero. E explica o Método em três frases, nunca mais:

> *"Eu não vou te dizer qual médico escolher.
> Vou te ajudar a descobrir o que mais importa pra você nessa decisão.
> Depois eu trago três caminhos, explico a diferença entre eles, e a escolha é sua."*

Isso é a explicação completa. Não existe versão longa. Se o paciente perguntar mais, o Curador responde o que foi perguntado — nunca a apresentação institucional inteira.

**Como deixar claro que ninguém decidirá por ele.** Dizendo, com todas as letras, no primeiro minuto — e repetindo no momento da entrega. Autonomia declarada uma vez só é promessa; declarada nas duas pontas é compromisso.

**O Sistema.** Fechado, ou reduzido a uma única linha de contexto. Nenhuma tela é mostrada ao paciente neste momento.

**Nunca.** Nomear mecanismo interno. Explicar "como funciona por trás". Pedir dados cadastrais antes de perguntar como ela está.

**Sinal de que funcionou.** O paciente para de se explicar defensivamente e começa a contar.

---

### Momento 3 — Construção da História

**O que acontece.** A escuta inteira, antes de qualquer organização.

**O Paciente.** Conta. Se sai da ordem, tudo bem. Se volta atrás, tudo bem. Ninguém o corta para preencher campo.

**O Curador.**

- **Como escuta:** sem estruturar. A pergunta seguinte é a da conversa, nunca a da lista.
- **Como registra:** em traços curtos, com os olhos na pessoa. O registro completo acontece depois. Um Curador digitando parágrafos enquanto o paciente fala está registrando bem e escutando mal.
- **Como confirma entendimento:** com a **devolução** — organiza e devolve em voz alta: *"deixa eu ver se entendi…"*. Esse momento não é opcional nem apressável: é o produto desta etapa.

**O Sistema.** Acompanha sem interromper. Isso significa, concretamente: nada valida em tempo real, nada avisa, nada sugere, nada exige campo preenchido para continuar. Salva sozinho, em silêncio.

**Nunca.** Formulário no lugar da escuta. Campo obrigatório durante a conversa. Qualquer alerta enquanto o paciente fala.

**Sinal de que funcionou.** O paciente diz, ou pensa: **"é exatamente isso."**

---

### Momento 4 — Perfil de Prioridades

*O momento mais importante da Curadoria.*

**O que acontece.** A história vira critério, e o critério vira peso — com o paciente dentro.

**O Paciente.** Descobre o que valoriza. É quase sempre a primeira vez que alguém o ajuda a nomear isso. Ele chega sabendo o que teme, não o que prioriza.

**O Curador conduz assim:**

1. **Nomeia os aspectos que apareceram na história** — não oferece um catálogo. *"Pelo que você me contou, três coisas apareceram forte: continuidade, experiência, e conseguir começar logo."*
2. **Pergunta pela troca, nunca pelo número.** *"Se você tivesse que abrir mão de uma dessas, qual seria?"* O peso nasce do conflito entre duas coisas boas — é ali que ele aparece.
3. **Propõe uma distribuição em voz alta.** *"Então continuidade pesa quase o dobro de experiência, é isso?"* O Curador propõe; o paciente corrige.
4. **Registra a evidência junto do peso**, na hora, com a fala dele.

**Como os pesos são explicados.** Sempre como proporção entre coisas, nunca como nota isolada. *"Continuidade 40, experiência 30"* não significa nada sozinho. *"Continuidade pesa mais do que experiência, e as duas juntas pesam mais que tudo o resto"* significa tudo.

**Como os pesos são validados.** Pela liturgia de quatro passos (Experience §2.3): leitura em voz alta na ordem, evidência junto de cada um, pergunta aberta (*"o que está faltando aqui?"*, nunca *"está tudo certo?"*), e ajuste imediato se houver hesitação.

**Como este momento vira ganho de confiança — a descoberta central desta especificação:**

> **A confiança não nasce quando o paciente concorda. Nasce quando ele corrige.**

Enquanto o paciente só concorda, ele ainda está sendo atendido. No instante em que diz *"não, experiência pesa menos do que isso"*, ele deixa de receber um serviço e passa a ser autor. Por isso o Curador **propõe** uma distribuição em vez de perguntar do zero: uma proposta pode ser corrigida; uma pergunta em branco só pode ser respondida.

Daí decorre uma regra de conduta: **se o paciente não corrigir nada, o Curador não deve comemorar — deve verificar.** Concordância total costuma significar que ele não entendeu, ou que está sendo educado.

**O Sistema.** Mostra a proporção e o que falta em linguagem natural. **Nunca reajusta um peso quando outro muda** — isso tiraria do paciente o controle da própria prioridade. Nunca sugere distribuição. Nunca aceita peso sem evidência.

**Nunca.** Pedir um número ao paciente. Oferecer uma distribuição "usual". Herdar pesos de casos parecidos. Tratar hesitação como obstáculo.

**Sinal de que funcionou.** O paciente corrige pelo menos uma coisa — e depois diz: **"isso aqui sou eu."**

---

### Momento 5 — Transição

*A consulta termina. A Curadoria começa.*

**O que acontece.** O paciente sai da sala e entra no silêncio. É o ponto de maior risco de perda de confiança em toda a experiência.

**O Paciente.** Fez a parte dele. Agora não há nada para fazer, e o padrão que ele conhece de todo lugar é ser esquecido.

**O Curador.** Encerra dizendo três coisas concretas, nunca genéricas:

> *"Agora eu vou analisar os profissionais da nossa rede com base exatamente no que a gente construiu aqui.
> Isso leva até quinta-feira.
> Na quinta eu te procuro — mesmo que ainda não esteja pronto, eu te procuro pra dizer como está."*

A terceira frase é a que sustenta a confiança. Prazo sem compromisso de retorno é promessa; prazo com retorno garantido é relação.

**O Sistema.** Mostra ao paciente, no Portal: **quem** está com o caso dele (pelo nome), **o que** está acontecendo em linguagem de pessoa, e **quando** ele terá notícia (data real).

**Como mostrar que existe trabalho técnico acontecendo, sem expor o mecanismo.** Mostrando trabalho **humano**: *"Helena está analisando os profissionais"*. Nunca *"processando"*, nunca barra de progresso, nunca percentual, nunca nome de mecanismo interno.

**Transparência sem exposição.** O paciente pode sempre saber **em que ponto** está e **por qual critério** as coisas acontecem. Nunca **quem** foi descartado — publicar isso produziria juízo sobre profissionais que não participaram da conversa.

**Se o prazo for atrasar:** avisa-se **antes** de vencer, com nova data. Prazo renegociado com antecedência preserva confiança; prazo estourado em silêncio a destrói.

**Nunca.** Silêncio maior que o combinado. Espera sem previsão. Notificação automática no lugar de contato humano.

**Sinal de que funcionou.** O paciente não precisa perguntar como está.

---

### Momento 6 — Curadoria Técnica

*Só o Curador. O paciente não está.*

**O que acontece.** O Perfil validado encontra a rede aprovada.

**O Paciente.** Ausente. Mas presente em cada linha: são os critérios dele que estão sendo aplicados.

**O Curador.**

- **Como compara:** critério a critério, com a conta à vista. Ele nunca vê um número sem a decomposição que o produziu — porque em poucos dias vai precisar explicar isso a um ser humano.
- **Como interpreta compatibilidade:** como **insumo**, não como resposta. A ordenação organiza a leitura; não fecha a questão.
- **Como preserva autonomia — a regra que define este momento:** o Curador pode discordar da ordem e selecionar um profissional que não está no topo. Isso não é exceção, é o Método funcionando. O que se exige dele é **dizer por quê**, e esse porquê fica registrado.
- **Como escreve justificativas:** antes de selecionar, nunca depois. Justificar antes impede que a escolha seja feita por intuição e racionalizada em seguida.
- **Como mantém rastreabilidade:** toda observação sobre um profissional é registrada no caso, com autoria, no momento em que é pensada.

**O Sistema.** Reconhece, explica e entrega — e para. Nunca corta a lista em três, nunca marca favorito, nunca desempata. Diante de empate, mostra os equivalentes e devolve a composição ao Curador.

**Nunca.** Apresentar "os três sugeridos". Esconder quem foi eliminado do Curador. Converter ausência de dado em nota baixa.

**Sinal de que funcionou.** O Curador consegue explicar as três escolhas sem consultar a tela.

---

### Momento 7 — Elaboração do Relatório

**O que acontece.** Nasce um parecer técnico — não um documento preenchido.

**O Paciente.** Ausente, mas é o único leitor que importa. Tudo o que ele não entender está errado, mesmo que esteja correto.

**O Curador.** Escreve como quem assina. O texto vai ser relido em casa, mostrado para a família, talvez levado ao médico escolhido.

**Quando uma justificativa é suficiente.** Quando passa nos três testes, todos obrigatórios:

1. **Nomeia o critério do paciente** — não uma qualidade abstrata. *"Responde ao que você colocou como mais importante"*, nunca *"profissional altamente qualificado"*.
2. **Diz o que a opção custa.** Toda opção tem trade-off. Opção sem custo declarado não é opção — é recomendação disfarçada.
3. **Poderia ser lida em voz alta para o paciente sem tradução.** Se o Curador precisaria explicar a própria frase, a frase ainda não está pronta.

**Quando precisa ser aprofundada.** Em três situações:

- **Contraintuitiva** — a opção não é a mais alinhada ao peso dominante. Exige dizer explicitamente por que ela ainda merece estar ali.
- **Incompatibilidade forte** — a opção vai mal em algo que o paciente disse que importa muito. Exige nomear isso antes que o paciente descubra sozinho.
- **Cobertura baixa** — havia pouca informação no cadastro. Exige dizer o que não se sabe, sem enfeitar.

**Como demonstrar rigor.** Pela consistência, nunca pelo volume: as três opções com a mesma estrutura, a mesma extensão aproximada e a mesma energia. Assimetria de entusiasmo é indução travestida de qualidade.

**Como demonstrar independência.** Dizendo o que não se sabe e o que cada opção custa. Um relatório que só elogia é um relatório que vende. **Independência se demonstra pelo limite declarado, nunca pela afirmação de isenção.**

**O Sistema.** Impede que score interno, linguagem de ranking ou nome de mecanismo entrem no texto. Não escreve nenhuma justificativa — só as de dimensão, que são insumo para o Curador escrever as dele.

**Nunca.** Ordem que sugira colocação. Superlativo. Promessa de resultado. Conteúdo clínico.

**Sinal de que funcionou.** O Curador leria o relatório em voz alta sem mudar uma palavra.

---

### Momento 8 — Devolutiva

**O que acontece.** As três opções encontram a pessoa que vai escolher.

**O Paciente.** Espera uma resposta. Vai receber uma decisão para tomar — e precisa sair capaz de tomá-la.

**O Curador conduz nesta ordem, que não é acidental:**

1. **Começa pelo Perfil, não pelos médicos.** Retoma o que ela definiu como importante. É a ponte que reconecta a pessoa ao que ela mesma construiu antes do silêncio.
2. **Diz em voz alta que não é um ranking.** *"Não estão em ordem de melhor pra pior — são três caminhos diferentes, todos bons."* O que não é dito, o paciente presume; e a presunção padrão diante de uma lista é que o primeiro é o melhor.
3. **Apresenta as três pelo mesmo roteiro**, no mesmo tempo, com a mesma energia.
4. **Diz o que cada uma custa.**
5. **Explica as diferenças pelos critérios dela**, nunca por qualidade abstrata.

**Como responder perguntas.** Devolvendo ao critério, nunca à opinião. A pergunta inevitável — *"qual você escolheria?"* — tem resposta pronta, que não é evasiva nem é uma escolha:

> *"Eu não vou escolher por você, e isso não é esquiva — é porque a resposta depende de algo que só você sabe. Você me disse que começar logo era o que mais pesava. Se isso continua verdadeiro, o caminho fica mais claro. Isso mudou?"*

Pergunta clínica não se responde: encaminha-se, sem constrangimento. *"Essa é uma pergunta para o médico que você escolher — e é ótima para a primeira consulta."*

**Como impedir indução.** Oito vetores, todos fechados: ordem, destaque visual, pré-seleção, linguagem, prazo, insistência, assimetria de esforço, opinião do Curador. Nenhum é acidental — cada um precisa ser fechado de propósito.

**Como garantir decisão consciente.** Verificando as quatro condições antes de encerrar: ela compreendeu as opções; compreendeu por que chegaram até ela; não foi empurrada; e poderia ter escolhido qualquer uma das três.

**O Sistema.** Entrega o material **depois** da conversa, para reler com calma. Nunca antes — um PDF que chega antes do Curador transforma a devolutiva em conferência de documento.

**Nunca.** Entrega por notificação. Uma opção só. Um vencedor. Prazo para responder.

**Sinal de que funcionou.** O paciente consegue explicar a diferença entre as três com as próprias palavras.

---

### Momento 9 — Escolha

**O que acontece.** A decisão acontece, no tempo dela.

**O Paciente.** Escolhe — ou não escolhe nenhuma, e isso é legítimo.

**O Curador.** Não está presente. E é assim que deve ser: a escolha não precisa de testemunha.

**Como registrar.** Pelo próprio paciente, no Portal, ou por ele mesmo dizendo a alguém da equipe — com a autoria preservada como dele em qualquer caminho. **"Nenhuma destas" tem o mesmo peso visual e a mesma facilidade** que as outras três: não é um link pequeno no rodapé.

**Como confirmar.** Repetindo de volta o que foi escolhido e o que acontece a seguir. Confirmação é clareza, não é oportunidade de reconsiderar — nunca *"tem certeza?"*.

**Como encerrar.** Sem cerimônia e sem venda. Um agradecimento e o próximo passo concreto.

**Como iniciar acompanhamento.** O primeiro contato depois da escolha **parte da Aliviar**, não dela — uma mensagem depois da primeira consulta perguntando como foi. Uma pergunta de gente, não uma pesquisa de satisfação.

**Se a escolha for "nenhuma destas":** a resposta nunca é decepção. É *"que bom que você disse; vamos entender o que faltou"* — e o Caso volta ao raciocínio, normalmente à etapa Priorizar.

**Nunca.** Cobrar. Criar prazo. Tratar demora como problema. Tratar a não escolha como falha do paciente.

**Sinal de que funcionou.** O paciente diz **"a decisão foi minha"** — e é verdade.

---

## 4. Portal do Paciente

O Portal do Paciente é o **reflexo fiel** do trabalho do Curador. Nunca uma vitrine, nunca um resumo, nunca um placeholder.

**A frase que ele precisa produzir:**

> *"Existe uma equipe trabalhando cuidadosamente na minha Curadoria."*

**Quatro obrigações:**

1. **Nunca mostrar etapa vazia.** Se uma etapa ainda não aconteceu, ela não aparece como caixa cinza esperando ser preenchida. Aparece dizendo o que vai acontecer e quando.
2. **Nunca mostrar "processando".** Mostra pessoa, ação e data.
3. **Sempre explicar.** Nenhum estado aparece sem uma frase que diga o que ele significa para ela.
4. **Sempre demonstrar evolução.** Cada visita mostra algo que mudou desde a anterior — nem que seja a confirmação de que o prazo segue de pé.

**O que ele mostra, e por quê:**

| O quê | Por quê |
|---|---|
| Quem está com o caso, pelo nome | Relação é com pessoas, não com sistema |
| Em que ponto está, em linguagem de pessoa | Clareza do próximo passo é o principal redutor de ansiedade |
| Quando terá notícia | Espera sem previsão é abandono |
| Seu Perfil de Prioridades validado, com pesos e evidências | É dela; ver a própria fala formalizada é o que produz credibilidade |
| As três opções, depois da devolutiva | Para reler com calma e com quem ela quiser |
| Sua decisão registrada | Fechamento |

**O que ele nunca mostra:** score interno, lista de analisados, quem foi eliminado, cobertura de cadastro, nome de mecanismo, qualquer número sem significado explicado ao lado.

---

## 5. Portal do Curador

**O Portal deve desaparecer. A metodologia deve aparecer.**

O Curador nunca deve sentir que está preenchendo um sistema. Cada interação é continuação da conversa — o que significa, concretamente:

- **A ordem da tela acompanha a ordem da conversa**, não o contrário. Conversa não tem ordem fixa; a tela precisa aceitar registro fora de sequência.
- **Nada é pedido duas vezes.** Se o paciente já disse, o Portal já sabe.
- **A lacuna é sinalizada, o caminho não é bloqueado.** Botão desabilitado sem explicação é burocracia.
- **O cálculo vem com a conta à vista**, porque o Curador vai ter que explicá-la.
- **Nenhuma métrica de produtividade existe.** A pressa é inimiga direta do Método.

**O teste de invisibilidade:** se ao final do dia o Curador se lembra de algo que o Portal fez, provavelmente o Portal atrapalhou. O que ele deve lembrar são as conversas.

---

## 6. Experiência compartilhada

Os momentos em que Curador e Paciente olham **a mesma informação** são o núcleo da Curadoria Compartilhada. São quatro.

| Artefato | O Curador vê | O Paciente vê | Diferença |
|---|---|---|---|
| **Perfil de Prioridades** | Critérios, pesos, evidências, observações | O mesmo | Nenhuma |
| **Distribuição dos 100 pontos** | A proporção e o total | O mesmo | Nenhuma |
| **Validação** | O registro do ato e as correções feitas | O mesmo | Nenhuma |
| **Relatório** | As três opções, justificativas, trade-offs — **mais** score interno, lista completa e eliminados | As três opções, justificativas, trade-offs | Só o nível interno |

**A regra que governa esta seção:** em três dos quatro artefatos a diferença é **zero**. No quarto, a diferença é exatamente o que a Ontologia reserva ao ofício — nada mais.

Isso tem uma consequência prática que precisa ser respeitada em qualquer implementação futura: **não existe "versão do paciente" de um artefato compartilhado.** Não se escreve duas vezes, não se resume, não se suaviza. Se algo precisou ser reescrito para o paciente entender, é porque estava mal escrito para o Curador também.

---

## 7. Memória da Curadoria

Qualquer Curadoria precisa poder ser reconstruída integralmente, e compreendida meses depois por alguém que não estava lá.

**A experiência de reconstrução tem três leitores possíveis:**

- **O próprio paciente**, revendo a própria história — vê a Memória sem o nível interno.
- **Um novo Curador**, retomando o caso após reabertura — vê tudo, e nunca precisa pedir que o paciente recomece.
- **A auditoria**, verificando se o Método foi seguido — vê tudo, incluindo quem decidiu o quê e com base em qual evidência.

**O critério de suficiência** são as nove perguntas do Engine §5.6. Se qualquer uma ficar sem resposta apenas com o registro, a trilha é insuficiente — e isso é defeito do sistema, nunca limitação aceitável.

**Uma regra de honestidade:** a Memória nunca omite uma lacuna para parecer completa. Uma pergunta sem resposta aparece como não respondida.

---

## 8. Critérios de qualidade

Uma Curadoria é excelente quando os seis são verdadeiros. Cada um tem um sinal verificável — não é avaliação subjetiva.

| Critério | Sinal verificável |
|---|---|
| O paciente sentiu-se profundamente compreendido | Houve o momento **"é exatamente isso"** na devolução da história |
| O Curador exerceu julgamento profissional | Ele selecionou e justificou por conta própria; nada foi homologação de sugestão |
| O sistema permaneceu praticamente invisível | Nenhum mecanismo interno foi nomeado ao paciente em nenhum momento |
| Todas as decisões são rastreáveis | As nove perguntas da reconstrução têm resposta |
| Toda justificativa pode ser explicada | Cada uma passa nos três testes do Momento 7 |
| A autonomia do paciente foi preservada | Os oito vetores de indução ficaram fechados, e ele poderia ter escolhido qualquer uma das três |

**Um sétimo sinal, informal mas decisivo:** o paciente corrigiu pelo menos uma coisa durante a construção do Perfil. Concordância total costuma indicar que ele não entendeu, ou está sendo educado — e nos dois casos o Perfil ainda não é dele.

---

## 9. Checklist obrigatório por superfície

Toda superfície listada abaixo precisa passar neste checklist antes de ir ao ar.

**Landing** — não promete o que o produto não cumpre hoje · não expõe mecanismo · não cria urgência · a autonomia da decisão aparece antes de qualquer convite.

**Portal do Curador** — nenhuma métrica de produtividade · nenhum bloqueio sem explicação · nenhum cálculo sem a conta à vista · nada pedido duas vezes · registro aceita ordem da conversa.

**Portal do Paciente** — nenhuma etapa vazia · nenhum "processando" · nenhum número sem significado · quem/o quê/quando sempre visíveis · nenhum score interno · nenhuma lista de eliminados.

**Relatórios** — três opções com a mesma estrutura e extensão · toda opção declara o que custa · nenhuma linguagem de ranking · nenhum score · nenhum conteúdo clínico · legível em voz alta sem tradução.

**Comunicação** — nenhuma mensagem automática comunica decisão, resultado ou atraso · todo prazo tem retorno garantido · atraso é avisado antes de vencer.

**Treinamento** — as sete etapas do raciocínio e os nove momentos com os mesmos nomes usados no Portal · a liturgia da validação ensinada como roteiro · a resposta a *"qual você escolheria?"* treinada explicitamente.

---

## 10. Pendências

Registradas, não resolvidas.

1. **Momento 1 sem superfície** — a tela de preparação do Curador não existe; hoje ele revisa lendo o caso inteiro.
2. **Momento 5 sem prazo modelado** — não há campo de prazo combinado no sistema, logo não há como avisar antes de vencer (E-12 do Motor). É a lacuna mais crítica desta especificação, porque sustenta o momento de maior risco da jornada.
3. **Portal do Paciente não reflete o COS** — hoje ele mostra o estado do Caso antigo, não os nove momentos.
4. **Registro de discordância do Curador** (Momento 6) não tem campo próprio — hoje caberia numa observação livre.
5. **Reabertura com novo Curador** (Momento 9 → novo ciclo) não tem experiência desenhada.

---

## 11. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-23 | Primeira versão — MISSÃO 103. Nove momentos em cinco vistas (o que acontece, Paciente, Curador, Sistema, sinal de que funcionou), três regras de coreografia, especificação dos dois Portais, os quatro artefatos compartilhados, a experiência de reconstrução, seis critérios de qualidade com sinal verificável e checklist por superfície. Nenhum código, componente ou schema criado ou alterado. |
