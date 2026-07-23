# Fundamentos do Método Aliviar

**Estado**: **Proposto** — candidato a documento fundacional da empresa, ainda **não canônico**. Conforme `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §4, autoridade documental não é autodeclarada: o agente de engenharia propõe um documento como candidato, nunca o declara canônico por iniciativa própria. Este documento passa a existir como candidato e só se torna autoridade real — inclusive sobre `docs/ace/00-constitution/constitution.md` — quando o responsável pelo projeto aprovar explicitamente a hierarquia proposta no Capítulo 15.

**Natureza**: este **não é um documento técnico**. Não descreve telas, tabelas, protocolos, APIs ou código. Descreve **como a Aliviar pensa** — a metodologia que o software existe para operacionalizar. Nenhuma linha de código, componente, schema, fluxo ou protocolo foi criado ou alterado para produzir este documento.

**Escopo de mudança**: MISSÃO 001 interrompe a evolução da arquitetura baseada no ACE automático. Nada foi removido, desativado ou alterado — a interrupção é de **evolução**, não de operação. Os pontos em que este documento diverge do que está implementado e congelado (ADR-021) estão registrados no Capítulo 16, sem serem resolvidos aqui.

---

## 1. Origem da Aliviar

A Aliviar nasce de uma constatação simples e incômoda: **encontrar cuidado de confiança virou um problema de navegação, não um problema de medicina**.

Existem bons médicos. Existe informação em abundância. O que não existe é alguém do lado da pessoa no momento em que ela precisa decidir. O paciente é jogado sozinho em um ecossistema fragmentado, comercialmente enviesado e desenhado para converter, não para cuidar — exatamente quando está mais vulnerável e menos equipado para julgar.

A Aliviar existe para ocupar esse lugar vazio: **o de quem está do lado do paciente**.

> **Lacuna registrada, não inventada.** A narrativa fundacional específica da empresa — quem fundou, a partir de qual experiência pessoal, em que momento, com qual episódio concreto — não consta de nenhum documento aprovado deste repositório. Conforme `docs/ace/06-governance/governance.md` §3, conteúdo de negócio genuinamente novo e ainda não decidido é sinalizado, nunca inventado. Este capítulo registra a **origem do método**; a origem biográfica da empresa aguarda o relato do responsável pelo projeto.

---

## 2. O problema que a Aliviar resolve

O problema real não é **falta de opções**. É **excesso de opções sem critério**.

Quando alguém precisa escolher um médico, enfrenta quatro obstáculos simultâneos:

1. **Não sabe o que deveria valorizar.** A pessoa não tem repertório para saber quais critérios importam no seu caso específico — e por isso escolhe pelos únicos critérios visíveis: proximidade, preço, nota, tempo de espera.
2. **Não consegue avaliar o que vê.** Currículo, titulação, tempo de formação e volume de experiência são dados que a pessoa não tem como interpretar sozinha.
3. **Não confia no que é apresentado.** Diretórios vendem posição de destaque como se fosse recomendação; a pessoa sente que está sendo empurrada, e está.
4. **Está decidindo no pior momento possível.** Medo, dor, urgência e cansaço são péssimos conselheiros — e é exatamente nesse estado que a decisão precisa ser tomada.

Nenhum desses quatro problemas é resolvido por mais informação. Todos os quatro são resolvidos por **alguém competente, independente e presente, que conduza a pessoa através da decisão** — sem decidir por ela.

É isso que a Aliviar faz.

---

## 3. Missão

**Fazer com que nenhuma pessoa precise escolher sozinha, e no escuro, quem vai cuidar dela.**

A Aliviar conduz o paciente por um processo estruturado que transforma a história dele em critérios claros, e os critérios em opções compreensíveis — para que a escolha final seja dele, feita com consciência, e não por eliminação, sorte ou pressão.

---

## 4. Visão

Ser reconhecida como **a metodologia de referência em Curadoria Compartilhada em saúde** — o padrão que define como uma decisão de cuidado deve ser conduzida quando é conduzida com seriedade.

A ambição da Aliviar não é ser um site com muitos médicos. É que **o método** se torne a referência: que "foi feito pelo Método Aliviar" signifique, para o paciente, que sua decisão foi construída com ele, com critério e sem interesse comercial no meio.

---

## 5. Filosofia

### 5.1 A Aliviar não é um software que encontra médicos

A Aliviar é uma **metodologia de Curadoria Compartilhada**. O software é a ferramenta que a operacionaliza — nunca o contrário.

Essa frase não é retórica institucional. Ela tem uma consequência prática verificável: **o Método Aliviar precisa ser executável sem o software**. Mais lento, mais trabalhoso, menos rastreável — mas executável. Se em algum momento o método deixar de funcionar quando a tecnologia cai, o que foi construído não é mais um método apoiado por software; é um software com discurso de método.

### 5.2 O deslocamento fundamental

O que muda de paradigma não é a interface. É **onde mora a inteligência**.

| | Paradigma anterior (automático) | Método Aliviar (compartilhado) |
|---|---|---|
| Quem conduz a conversa | O sistema | O Curador |
| Quem interpreta a história | O sistema | O Curador |
| Quem define os critérios | O sistema, por inferência | O Curador, **com o paciente** |
| Quem valida os critérios | Ninguém | O paciente, explicitamente |
| Quem seleciona as opções | O sistema | O Curador |
| Quem revisa | Um humano, no fim | Não existe "no fim" — o humano está em todo o percurso |
| Quem escolhe | O paciente, entre opções que não ajudou a construir | O paciente, entre opções construídas a partir dos próprios critérios |
| O papel do sistema | Produzir a resposta | Organizar, registrar, calcular, documentar |

O humano deixa de ser um **revisor no final do processo** e passa a ser o **condutor do processo inteiro**. A tecnologia deixa de ser o autor e passa a ser o instrumento.

### 5.3 A pergunta que define tudo

A Aliviar **nunca** calcula:

> "Qual é o melhor médico?"

A Aliviar calcula:

> "Entre os médicos previamente aprovados pela Aliviar, quais apresentam maior compatibilidade com o Perfil de Prioridades construído junto ao paciente?"

Toda a arquitetura futura deve derivar dessa distinção. Ela contém quatro compromissos simultâneos:

- **"previamente aprovados"** — o universo é fechado e curado antes de qualquer cálculo; a aprovação é institucional, prévia e independente da conversa com o paciente.
- **"maior compatibilidade"** — a resposta é relativa a um critério declarado, nunca um julgamento absoluto de qualidade.
- **"Perfil de Prioridades"** — o critério não é da Aliviar; é do paciente, formalizado.
- **"construído junto ao paciente"** — o critério não é inferido, é co-construído e validado.

"Melhor médico" é uma afirmação sobre o médico. "Maior compatibilidade" é uma afirmação sobre o **encontro** entre o médico e o que aquele paciente declarou que importa. A Aliviar só faz afirmações do segundo tipo.

---

## 6. O papel do Paciente

O paciente é o **decisor**. Não é usuário de um produto, não é lead, não é caso. É a única pessoa com autoridade sobre a própria decisão.

**O paciente:**

- conta sua história, no seu tempo e nos seus termos;
- informa suas necessidades;
- informa suas restrições (financeiras, geográficas, de tempo, de preferência, de história pessoal);
- define suas prioridades — o que, para ele, pesa mais;
- **valida** seu Perfil de Prioridades — e essa validação é um ato formal, não uma formalidade;
- **escolhe** o médico.

**O paciente nunca precisa:**

- saber medicina;
- saber avaliar currículo, titulação ou experiência técnica;
- saber por que uma prioridade importa mais que outra no seu caso;
- entender como a compatibilidade é calculada;
- justificar sua escolha para a Aliviar.

**O que a Aliviar deve ao paciente:** que ele entenda **o que** está escolhendo e **por que** aquelas opções chegaram até ele — nunca que entenda o mecanismo interno. Complexidade nunca chega ao paciente.

**O limite do paciente:** ele decide sobre a própria jornada, não sobre o mérito clínico da própria condição — isso é do médico, fora da Aliviar.

---

## 7. O papel do Curador

O Curador é o **responsável humano pelo processo inteiro** — do primeiro encontro à entrega. É ele quem carrega a competência que o paciente não tem e não precisa ter.

**O Curador:**

- conduz toda a consulta;
- interpreta a história — separa o que foi dito do que foi sentido, e o que é sintoma do que é circunstância;
- **ajuda o paciente a descobrir suas prioridades** — a maioria das pessoas não chega sabendo o que valoriza; chega sabendo o que teme;
- transforma a conversa em critérios objetivos;
- valida os pesos junto ao paciente, em linguagem humana, até que o paciente reconheça o próprio caso ali;
- analisa os médicos previamente aprovados;
- **escolhe três opções** para apresentação;
- explica as diferenças entre elas.

**O Curador nunca:**

- diagnostica;
- interpreta exame;
- emite opinião clínica;
- prescreve ou indica tratamento;
- escolhe o médico pelo paciente;
- apresenta uma única opção — apresentar uma opção é decidir;
- apresenta um "vencedor" entre as três.

**A competência central do Curador não é conhecer médicos. É conduzir uma conversa que faz uma pessoa descobrir o que importa para ela.** A análise dos médicos é a parte que o sistema mais apoia; a condução da conversa é a parte que o sistema nunca substitui.

**Por que três opções.** Três é a menor pluralidade que preserva a decisão do paciente sem sobrecarregá-lo. Uma opção é uma decisão disfarçada. Duas polarizam em "certo e errado". Muitas devolvem ao paciente exatamente o problema que ele veio resolver: escolher sozinho, sem critério, no meio do excesso.

---

## 8. O papel da Tecnologia

A tecnologia é **instrumento do Curador**, não substituto dele.

**A tecnologia:**

- **organiza** informações — para que nada relevante se perca entre a conversa e a entrega;
- **registra** dados — a história, os critérios, os pesos, as opções, a escolha;
- **calcula** compatibilidades — entre o Perfil de Prioridades e cada médico previamente aprovado;
- **auxilia** o Curador — apresenta evidência, sinaliza lacuna, torna visível o que ele precisaria memorizar;
- **gera** documentação — o registro auditável do que foi decidido, por quem e com base em quê.

**A tecnologia nunca:**

- escolhe médicos;
- decide pelo paciente;
- produz recomendações finais automaticamente;
- substitui o Curador.

**O ciclo da tecnologia.** Toda operação do sistema, sem exceção, tem a mesma forma:

```
reconhece → explica → entrega ao Curador → o Curador decide → registra
```

O sistema **emoldura** a decisão; nunca a ocupa. Entre entregar e registrar existe um passo que nenhum software executa — e esse vazio não é uma etapa ainda não automatizada, é uma etapa que nunca será. (Detalhado em `docs/CURATION_ENGINE_SPECIFICATION.md` §1.)

**Consequência arquitetural direta:** nenhum artefato produzido por software tem valor decisório. Todo cálculo é **insumo para o julgamento humano**, jamais o julgamento. Um resultado de compatibilidade que chegasse ao paciente sem passar pelo Curador seria uma violação do método — não um atalho de eficiência.

**Consequência de experiência:** a tecnologia é invisível para o paciente. Ele nunca ouve o nome de um mecanismo interno, nunca vê um número que não sabe interpretar, nunca é informado de que "o sistema" fez algo. Ele conversa com uma pessoa e recebe opções explicadas por uma pessoa.

---

## 9. O conceito de Curadoria Compartilhada

**Definição.** Curadoria Compartilhada é o processo pelo qual um Curador conduz um paciente na construção conjunta dos critérios da própria decisão, aplica esses critérios a um conjunto de médicos previamente aprovados, e devolve ao paciente um pequeno número de opções compreensíveis — preservando a escolha final com o paciente.

**O que é "compartilhado":** não é a decisão dividida ao meio. É a **competência somada**:

| | Traz | Nunca precisa trazer |
|---|---|---|
| **Paciente** | A verdade sobre a própria vida: história, restrições, medos, preferências, o que importa | Competência técnica |
| **Curador** | Competência de condução, interpretação e análise | A verdade sobre a vida do paciente — ela não é dele |
| **Sistema** | Memória, organização, cálculo, rastreabilidade | Qualquer forma de julgamento |

Nenhum dos três consegue chegar sozinho a uma boa decisão. É por isso que o método é compartilhado — não por gentileza, por necessidade estrutural.

**O que a Curadoria Compartilhada não é:**

- **Não é triagem.** Triagem classifica pessoas em categorias; curadoria constrói o critério de uma pessoa específica.
- **Não é busca com filtro.** Filtro aplica um critério que o usuário já tinha; curadoria produz o critério que ele não tinha.
- **Não é recomendação algorítmica.** Recomendação otimiza um objetivo definido pela plataforma; curadoria aplica um critério definido e validado pelo paciente.
- **Não é segunda opinião médica.** Não há juízo clínico em nenhuma etapa.
- **Não é intermediação comercial.** Nenhum médico paga para estar no conjunto, para ser analisado ou para ser apresentado.

---

## 10. O conceito de Perfil de Prioridades

**Definição.** O Perfil de Prioridades é a **representação formal, validada pelo paciente, do que importa para ele naquela decisão específica** — e do peso relativo entre essas coisas.

É o artefato central do Método Aliviar. Tudo antes dele existe para construí-lo; tudo depois dele existe para aplicá-lo.

**Como nasce:** de uma conversa conduzida pelo Curador, nunca de um formulário e nunca de inferência automática. O paciente raramente chega sabendo suas prioridades — ele chega com uma história. O trabalho do Curador é transformar história em critério.

**Três propriedades obrigatórias:**

1. **É do paciente, não da Aliviar.** O Curador ajuda a descobrir e a formular; nunca substitui a preferência do paciente pela sua própria noção do que seria melhor. Um Perfil que o Curador acha correto mas o paciente não reconhece é um Perfil inválido.
2. **É explícito.** O que não foi dito e validado não pesa. Não existe prioridade implícita, presumida ou herdada de "casos parecidos".
3. **É validado.** A validação é um ato do paciente, registrado — o momento em que ele reconhece: "sim, é isso que importa para mim". Sem esse ato, o Perfil não existe e nada pode ser calculado sobre ele.

**Os pesos.** Prioridades sem peso relativo não decidem nada — porque quase todo paciente quer tudo ao mesmo tempo. O peso é o que aparece quando duas coisas boas não cabem juntas. Por isso o peso é sempre construído em linguagem humana ("se tivesse que abrir mão de uma, qual seria?") e nunca pedido como número ao paciente. O paciente valida a **compreensão**; o sistema registra a **formalização**.

**É específico e datado.** O Perfil de Prioridades vale para **aquela decisão, naquele momento**. Prioridades mudam com a vida, com o diagnóstico e com o tempo. Um Perfil nunca é um cadastro permanente do paciente; é o retrato de uma decisão.

---

## 11. O conceito de Compatibilidade

**Definição.** Compatibilidade é a medida de **alinhamento entre um médico previamente aprovado e o Perfil de Prioridades de um paciente específico**.

**O que compatibilidade não é:**

- **Não é qualidade.** Um médico excelente pode ser pouco compatível com um paciente específico — e isso não é um defeito do médico nem do cálculo.
- **Não é ranking universal.** Não existe "o mais compatível" fora de um Perfil de Prioridades. Trocando o Perfil, a ordem muda inteiramente.
- **Não é nota, avaliação ou reputação.** Não deriva de popularidade, volume, ou opinião de terceiros.
- **Não é recomendação.** É insumo de análise para o Curador. Um resultado de compatibilidade nunca chega ao paciente como resposta.

**Duas pré-condições inegociáveis:**

1. **O universo já foi aprovado.** A compatibilidade só opera sobre médicos que a Aliviar já aprovou, por critérios próprios, independentes e anteriores a qualquer paciente. **A aprovação nunca é comprada.** A compatibilidade não é um mecanismo de qualificação — a qualificação já aconteceu.
2. **O critério já foi validado.** Sem Perfil de Prioridades validado pelo paciente, não há o que calcular. Calcular compatibilidade contra um critério inferido é decidir pelo paciente com aparência de objetividade.

**Explicabilidade como condição de existência.** Toda compatibilidade precisa ser explicável em linguagem simples: *"esta opção pesa mais porque você disse que X importa mais do que Y"*. Uma compatibilidade que não pode ser explicada dessa forma não pode ser usada — não porque seja errada, mas porque não serve à conversa que o Curador precisa ter.

---

## 12. O conceito de Decisão Compartilhada

**Definição.** Decisão Compartilhada é o desenho segundo o qual **a competência é compartilhada, mas a escolha não é**. O Curador conduz; o paciente escolhe. Nenhum dos dois faz o papel do outro.

**As quatro condições de uma decisão legítima pelo Método Aliviar:**

1. **O paciente compreendeu suas opções** — sabe o que diferencia uma da outra, em termos que fazem sentido para ele.
2. **O paciente compreendeu por que aquelas opções chegaram até ele** — reconhece os próprios critérios no resultado.
3. **O paciente não foi empurrado** — nem por ordem de apresentação, nem por destaque visual, nem por urgência, nem pelo tom do Curador, nem por opinião pessoal dele.
4. **A escolha foi do paciente** — e teria sido possível escolher qualquer uma das três.

Se qualquer uma das quatro falha, o processo pode ter produzido um resultado correto, mas **não produziu uma decisão compartilhada**.

**O que a Aliviar assume e o que não assume.** A Aliviar responde pela **qualidade do processo**: pela independência do conjunto aprovado, pela fidelidade do Perfil de Prioridades, pela honestidade da análise e pela clareza da apresentação. A Aliviar **não** responde pelo resultado clínico — isso pertence à relação entre o paciente e o médico que ele escolheu, fora do escopo da Aliviar. Prometer resultado clínico seria, ao mesmo tempo, desonesto e uma quebra do método.

**Não paternalismo.** Se o paciente escolher a opção que o Curador consideraria menos indicada, a escolha é dele — e o método funcionou. O papel da Aliviar é garantir que a escolha seja **informada**, jamais que seja a escolha "certa" segundo a Aliviar.

---

## 13. Princípios da Aliviar — primeira versão

Os princípios abaixo são propostos como **Constituição do projeto**: toda decisão futura de produto, arquitetura, engenharia, operação e comunicação deverá respeitá-los. Quando um princípio conflitar com um pedido específico — de negócio, técnico ou de prazo — o princípio prevalece, salvo exceção registrada explicitamente pelo responsável do projeto. Exceção documentada é aceitável; exceção silenciosa nunca.

**Nota de escopo.** Estes são os **princípios do Método** — como uma curadoria é conduzida. `docs/PRODUCT_PRINCIPLES.md` contém os **princípios de produto** — como se decide o que construir. Os dois conjuntos são compatíveis e complementares, mas a relação formal entre eles precisa ser decidida (Capítulo 16, ponto 8) antes que qualquer um dos dois seja tratado como autoridade final.

---

**P1 — O método antes do software.**
O software existe para implementar o Método Aliviar; o método nunca é adaptado à conveniência do software. Diante de uma escolha entre entregar rápido e preservar o método, o método vence — sem exceção.

**P2 — A tecnologia nunca decide.**
Nenhum artefato produzido por software tem valor decisório. Todo cálculo, classificação ou pontuação é insumo para julgamento humano. Não há caminho, atalho, otimização ou situação de exceção em que um resultado automático chegue ao paciente como resposta da Aliviar.

**P3 — A condução é do Curador; a escolha é do paciente.**
O Curador nunca escolhe pelo paciente. O paciente nunca é deixado escolhendo sozinho. Nenhum dos dois assume o papel do outro, em nenhuma etapa.

**P4 — A pergunta certa.**
A Aliviar nunca pergunta "qual é o melhor médico". Pergunta sempre "entre os médicos previamente aprovados, quais apresentam maior compatibilidade com o Perfil de Prioridades construído junto a este paciente". Qualquer funcionalidade que responda à primeira pergunta está fora do método.

**P5 — Nenhuma prioridade existe sem validação do paciente.**
Prioridade inferida, presumida, herdada de casos semelhantes ou deduzida de comportamento não é prioridade. Só pesa o que o paciente reconheceu como seu.

**P6 — O universo é fechado e previamente aprovado.**
A compatibilidade só opera sobre médicos já aprovados pela Aliviar, por critério próprio, anterior e independente de qualquer paciente. **A aprovação nunca é comprada, em nenhuma forma** — nem posição, nem destaque, nem prioridade de apresentação, nem entrada no conjunto.

**P7 — Independência acima de receita.**
Em qualquer conflito entre o interesse do paciente e o interesse de um médico, de um parceiro ou da própria Aliviar, o paciente vence. Um modelo de receita que exija violar este princípio é um modelo de receita rejeitado, não um dilema a ser negociado.

**P8 — Se não pode ser explicado, não pode ser usado.**
Toda influência sobre a decisão do paciente — um peso, uma compatibilidade, uma ordem, uma diferença entre opções — precisa ser explicável em linguagem simples para o próprio paciente. O que não passa nesse teste é removido do processo, não escondido nele.

**P9 — Pluralidade obrigatória.**
Três opções, sempre. Nunca uma — apresentar uma opção é decidir pelo paciente. Nunca um vencedor implícito entre as três. Quando não for possível formar três opções legitimamente fundamentadas, isso é declarado ao paciente com honestidade, nunca preenchido com uma opção fraca para completar o número.

**P10 — Registro é obrigação, não subproduto.**
A história, os critérios, os pesos, as opções, as justificativas e a escolha são registrados. Uma curadoria que não pode ser reconstruída depois — quem decidiu o quê, quando e com base em qual evidência — não é uma curadoria pelo Método Aliviar.

**P11 — Nenhuma etapa aumenta a ansiedade do paciente.**
Tom, ritmo, linguagem e quantidade de informação são sempre calmos, especialmente em espera, erro, ausência de resultado ou má notícia. Nunca urgência artificial, contagem regressiva, escassez fabricada ou alarme desproporcional ao fato real.

**P12 — A complexidade nunca chega ao paciente.**
Todo o peso metodológico — protocolos, cálculos, critérios, mecanismos internos — fica com o Curador e com o sistema. O paciente recebe clareza. Ele nunca ouve o nome de um mecanismo interno da Aliviar.

**P13 — O software pode falhar; o método não pode.**
O Método Aliviar precisa permanecer executável sem o sistema — mais lento e mais trabalhoso, mas íntegro. Nenhuma etapa do método pode ser definida de forma que só exista dentro de uma implementação técnica específica.

---

## 14. O que a Aliviar nunca fará

- Vender posição, destaque, entrada no conjunto aprovado ou prioridade de apresentação — em nenhuma forma, para nenhum médico, parceiro ou instituição.
- Entregar uma recomendação automática ao paciente sem condução humana.
- Apresentar uma única opção, ou um vencedor entre as opções.
- Emitir diagnóstico, interpretar exame, indicar tratamento ou emitir opinião clínica.
- Prometer resultado clínico.
- Usar dado de saúde de uma pessoa para qualquer finalidade que não seja o cuidado dela mesma.
- Usar padrões de persuasão: urgência artificial, escassez fabricada, pré-seleção enganosa, ordem de apresentação como sugestão velada.
- Apresentar dado fictício (métrica, depoimento, indicador) como se fosse real.
- Inferir uma prioridade do paciente e tratá-la como validada.
- Substituir a conversa do Curador por um formulário, por mais eficiente que seja.

---

## 15. Relação com os documentos existentes

**Hierarquia proposta** (requer aprovação explícita do responsável do projeto — ver Capítulo 16, ponto 8):

```
0. Fundamentos do Método Aliviar (este documento) — o que a Aliviar é e como pensa
1. Constituição do ACE — restrições arquiteturais para sistemas de IA da Aliviar
2. ACE Framework → 3. Ontologia → 4. Kernel → 5. Especificações → 6. Prompts → 7. Testes → 8. Implementação
```

Hoje, `docs/ace/00-constitution/constitution.md` ocupa o nível mais alto e declara-se derivado de `docs/PRODUCT_VISION.md` e `docs/PRODUCT_PRINCIPLES.md`. Este documento propõe um nível 0 acima dele: os Fundamentos definem o **método**; a Constituição do ACE define como **um sistema de IA** deve se comportar para servi-lo.

**Documentos com os quais este é compatível hoje:**

- `docs/PRODUCT_VISION.md` — "IA sempre em papel de apoio, nunca de decisão"; "curadoria independente"; "tecnologia que nunca chama atenção para si". Coerente. Missão e visão aqui são mais estreitas e mais precisas (curadoria de decisão médica, não conexão genérica de cuidado) — ver ponto 9 do Capítulo 16.
- `docs/PRODUCT_PRINCIPLES.md` — os 15 princípios de produto são compatíveis; nenhum é contrariado.
- `docs/ace/00-constitution/constitution.md` §2, Princípio 9 — "nenhum artefato intermediário possui valor decisório". É exatamente o P2 deste documento, já constitucionalizado.
- `docs/ace/03-kernel/kernel.md` §1, §2, §3 — restrições clínicas, disciplina de informação e postura de interação. Integralmente preservadas.
- `docs/OPERATIONAL_ROLES_MODEL.md` — o Curador conduzindo a Reunião de Acolhimento e realizando a entrega humana já está descrito ali (Etapa 5), como documento Proposto.

**Documentos com os quais este diverge:** ver Capítulo 16.

---

## 16. Pontos que precisam ser discutidos antes de qualquer implementação

Nenhum ponto abaixo é resolvido neste documento. Todos exigem decisão explícita do responsável do projeto — vários exigem ADR própria.

**1. Inversão do lugar do humano no pipeline (a divergência estrutural principal).**
Hoje o ACE conduz a conversa inicial automaticamente (P001 — Intake) e o humano entra apenas no P009 (Human Review), revisando uma Shortlist pronta. O Método Aliviar coloca o Curador conduzindo desde o primeiro minuto. Não é um ajuste de etapa: é uma inversão de quem é o autor do processo. Decisão necessária: o P001 deixa de ser conduzido por IA e passa a ser instrumento de registro do Curador? O que acontece com o P009 quando o humano já esteve presente o tempo inteiro?

**2. Quem seleciona as três opções.**
`docs/ace/01-framework/framework.md` §2 define o P008 (Shortlist Builder) como um protocolo determinístico que **seleciona exatamente três Care Providers**. O Método Aliviar diz que **o Curador escolhe as três**. Conflito direto. Decisão necessária: o P008 passa a apresentar candidatos ao Curador sem selecionar, ou é substituído?

**3. Onde entra o Perfil de Prioridades.**
Não existe na Ontologia atual. O artefato mais próximo é o `DecisionContext` (P004), derivado por inferência do sistema e **nunca validado pelo paciente**. Decisão necessária: o Perfil de Prioridades é um artefato novo, uma evolução do `DecisionContext`, ou o substitui? E como o ato de validação do paciente é registrado — hoje a Reunião de Acolhimento não tem nenhum registro estruturado no sistema (`docs/OPERATIONAL_ROLES_MODEL.md`, Etapa 5, achado técnico).

**4. Compatibilidade com pesos vs. proibição de score.**
O P007 avalia hoje seis dimensões **qualitativas** e a política de campos do Kernel (§1.1) proíbe explicitamente vocabulário de score/ranking. O Método Aliviar fala em **pesos** validados pelo paciente e em **maior compatibilidade** — o que implica alguma forma de comparação ordenável. Decisão necessária: existe um valor numérico interno, visível apenas ao Curador e nunca ao paciente? Ou a comparação permanece qualitativa e o "peso" é um instrumento de conversa, não de cálculo? Esta é a decisão mais delicada do conjunto, porque toca uma proibição já mecanizada em código.

**5. "Previamente aprovados" como etapa constitutiva.**
O método afirma que a aprovação do médico é anterior, institucional e independente do paciente. Hoje o P006 filtra providers por competência a partir de um repositório — não existe um **gate de aprovação institucional** modelado como etapa do método, com critérios próprios e registro de quem aprovou. Decisão necessária: formalizar a aprovação da Rede como etapa do Método Aliviar, com critérios explícitos.

**6. Vocabulário: "médico" vs. "Care Provider".**
A ADR-013 escolheu deliberadamente "Care Provider" para manter o método desacoplado da estrutura da Rede; `docs/PRODUCT_VISION.md` fala em psicólogos e terapeutas. MISSÃO 001 fala consistentemente em **médicos**. Decisão necessária: o Método Aliviar é sobre decisão médica especificamente, ou sobre decisão de cuidado em geral? A resposta muda o escopo da empresa, não só a palavra.

**7. Vocabulário: "paciente" vs. "cliente".**
O ACE usa "cliente" em toda a Constituição, Framework e Kernel. Este documento usa "paciente", seguindo MISSÃO 001. Decisão necessária: unificar em um termo e propagar.

**8. Autoridade documental deste documento.**
Proposto como nível 0, acima da Constituição do ACE (Capítulo 15). Isso exige aprovação explícita e, provavelmente, uma ADR. Decisão necessária também sobre a relação com `docs/PRODUCT_PRINCIPLES.md`: os princípios de produto (15) e os princípios do método (13) permanecem como dois conjuntos com escopos distintos, ou são consolidados? Manter dois conjuntos sem hierarquia declarada cria exatamente a divergência que `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §1 existe para prevenir.

**9. Estreitamento da missão e da visão.**
`docs/PRODUCT_VISION.md` define a Aliviar como plataforma de conexão de cuidado (apoio emocional, saúde mental, orientação de saúde), modular e evolutiva. Este documento define uma metodologia de curadoria de decisão médica. Decisão necessária: a visão anterior é substituída, contida, ou passa a conviver como horizonte de longo prazo?

**10. Relação com a V1.0 congelada e com o Shadow Launch.**
A ADR-021 congelou produto e ACE na V1.0 — apenas correção de bug e trabalho operacional são permitidos; ADR-031 e ADR-032 foram descongelamentos escopados. O Shadow Launch está armado. MISSÃO 001 interrompe a evolução da arquitetura anterior e propõe uma reorientação de método. Decisão necessária, antes de qualquer linha de código: isto abre uma V2 formal (ADR nova), e o que acontece com o Shadow Launch enquanto a fundação está sendo redefinida — segue, pausa, ou segue com escopo declarado como legado?

**11. Papel da Atendente.**
`docs/OPERATIONAL_ROLES_MODEL.md` descreve a Atendente como referência operacional contínua, mas o papel não existe no catálogo da ADR-006 nem tem superfície no sistema — tensão já registrada quatro vezes. Este documento não a menciona nos papéis do método (MISSÃO 001 define três: Paciente, Curador, Sistema). Decisão necessária: a Atendente é um papel operacional fora do método, ou um quarto papel do método?

**12. Lacuna da origem.**
A narrativa fundacional da empresa (Capítulo 1) aguarda o relato do responsável do projeto — não pode ser inventada.

---

## 17. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-23 | Primeira versão — MISSÃO 001 (Fundamentos do Método Aliviar). Materializa a mudança de paradigma de ACE automático para Curadoria Compartilhada: 12 capítulos conceituais, 13 princípios propostos como Constituição do projeto, e 12 pontos em aberto registrados sem resolução. Nenhum código, fluxo, tela, banco de dados, protocolo do ACE, Landing ou Portal foi alterado. Documento nasce como **Proposto**, não canônico. |
