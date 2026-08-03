# DOMÍNIO DA COMPATIBILIDADE RELACIONAL — DEFINIÇÃO OFICIAL v1.0

**Status:** **APROVADO E CONGELADO** pelo fundador em 2026-08-03 (ADR-065). Substitui a minuta anterior.
**Natureza:** documento normativo do domínio — anexo canônico da ADR-065, subordinado ao `MODELO_CURADORIA_V1.md` (v2.0).
**Data:** 2026-08-03.
**Decisões vigentes do fundador:** nome "Compatibilidade Relacional"; ordenação adiada; extensão do Eixo 3 sem vocabulário nem tabelas paralelas; leitura que informa e não pontua, não ranqueia, não elimina, não se soma.

Após aprovação deste documento: nenhuma nova ideia, nenhum novo conceito, nenhuma nova dimensão. Toda evolução futura exige nova ADR.

---

# Parte 1 — Revisão completa do Eixo MODELO_DE_ATENDIMENTO

## 1.1 `MODELO_COMUNICACAO` — "Como explica"

- **Objetivo:** registrar as condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento.
- **Necessidade que representa:** *"Vou entender o que ele me disser?"* — a pessoa precisa sair da consulta compreendendo o próprio caso.
- **Pergunta do paciente (vigente):** "O que te ajudaria a entender melhor o que for explicado?"
- **Pergunta do profissional (vigente):** "Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?" (7 condutas fechadas: adapta a linguagem · verifica compreensão · reexplica de outra forma · usa apoio visual · envia resumo escrito · reserva tempo para perguntas · autoriza gravação).
- **Forma de cruzamento:** automático, por correspondência opção-a-opção.
- **Permanece:** **integralmente**, com um acréscimo de infraestrutura de domínio: as 6 opções da pessoa (hoje provisórias no código) passam a ser canônicas, e cada uma declara suas condutas correspondentes (Parte 4).
- **Justificativa:** é o conceito mais maduro do eixo; os dois lados já falam a mesma língua e a correspondência é quase 1:1. Nada a remover, nada a fundir.

## 1.2 `MODELO_DECISAO_COMPARTILHADA` — "Como conduz decisões"

- **Objetivo:** registrar as condutas diante de mais de uma alternativa clinicamente adequada.
- **Necessidade:** *"Eu vou participar da decisão sobre mim?"* — o grau de protagonismo que a pessoa quer (e o que o profissional pratica).
- **Pergunta do paciente (vigente):** "Quando houver mais de um caminho possível, como você gostaria de participar da decisão?" (4 opções: quero decidir com orientação · quero que recomende e eu confirmo · prefiro que o médico decida · não sei ainda).
- **Pergunta do profissional (vigente):** "Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?" (7 condutas: apresenta todas as opções · explica riscos e benefícios · pergunta o que importa para a pessoa · oferece tempo · sugere segunda opinião · recomenda e explica o porquê · decide e comunica).
- **Forma de cruzamento:** **humano obrigatório** (decisão de Método vigente: a mesma conduta muda de sentido conforme a pessoa — "prefiro que o médico decida" torna "decide e comunica a conduta" adequado; para "quero decidir com orientação", o mesmo item exige leitura).
- **Permanece:** **integralmente**. O que este domínio acrescenta é a superfície de juízo que hoje falta (Parte 7).
- **Justificativa:** é o coração da pergunta "por que este profissional para esta pessoa". Automatizá-lo seria o erro mais grave do catálogo (registro vigente); ignorá-lo seria amputar o domínio.

## 1.3 `MODELO_PARTICIPACAO_FAMILIAR` — "Participação de acompanhantes"

- **Objetivo:** registrar abertura e condições para presença de acompanhantes. Abertura à família nunca significa inclusão obrigatória.
- **Necessidade:** *"Posso ter alguém comigo?"* — presença de quem a pessoa escolher, nos momentos que ela escolher.
- **Pergunta do paciente (vigente):** "Você quer que alguém participe das conversas?" (4 opções: sempre · em algumas conversas · prefiro sozinha · não tenho preferência).
- **Pergunta do profissional (vigente):** "Como você conduz a presença de acompanhantes?" (5 condutas: bem-vindo sempre · mediante autorização da pessoa · parte da consulta a sós · contato com família entre consultas se autorizado · atendimento apenas individual).
- **Forma de cruzamento:** automático, por correspondência.
- **Permanece:** **integralmente**.
- **Justificativa:** completo nos dois lados no banco; só recebe o mapa de correspondências. Registro de honestidade: "atendimento apenas individual" declarado **não** satisfaz quem quer acompanhante — o resultado registra o fato, nunca elimina o profissional.

## 1.4 `MODELO_ALTERNATIVAS` — "Explicação de alternativas"

- **Objetivo:** registrar se o profissional apresenta os caminhos possíveis, inclusive o de não intervir.
- **Necessidade:** *"Vou conhecer minhas opções de verdade — inclusive a de não fazer nada?"*
- **Pergunta do paciente (vigente):** "O que você precisa saber antes de aceitar um tratamento?"
- **Pergunta do profissional (vigente):** "Ao propor uma conduta, quais dessas você costuma apresentar?" (6 condutas: opções disponíveis · acompanhar sem intervir · riscos de cada caminho · o que acontece se nada for feito · limites do que se sabe hoje · custo e cobertura de cada opção).
- **Forma de cruzamento:** automático, por correspondência.
- **Permanece:** **integralmente**, com a mesma materialização do lado da pessoa que 1.1 (4 opções hoje provisórias).
- **Justificativa:** fronteira nítida com 1.2 (aqui: *o que* é apresentado; lá: *como* se decide) e com Viabilidade (aqui cruza *se ele apresenta custos*; quanto custa permanece humano, fora do eixo). A honestidade sobre incerteza — "limites do que se sabe hoje" — já mora aqui, o que fecha uma lacuna que de outro modo pediria conceito novo.

## 1.5 `MODELO_PREFERENCIAS_E_RESTRICOES` — "Respeito a recusas e restrições"

- **Objetivo:** registrar como o profissional lida com recusas explícitas e restrições pessoais, religiosas ou culturais.
- **Necessidade:** *"Aquilo que eu não aceito vai ser respeitado?"*
- **Pergunta do paciente (vigente):** "Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?" — **único texto guiado** do protocolo da pessoa.
- **Pergunta do profissional (vigente):** "Quando a pessoa recusa uma conduta ou tem restrição pessoal, religiosa ou cultural, o que você costuma fazer?" (5 condutas: registra no prontuário · busca alternativa compatível · explica consequências e mantém acompanhamento · encaminha quando não pode atender · não acompanha quem recusa a conduta indicada).
- **Forma de cruzamento:** **humano obrigatório** — texto livre da pessoa jamais entra em motor (regra vigente).
- **Permanece:** **integralmente**, com a definição estreitada vigente (a definição ampla anterior foi condenada: "conceito que cabe tudo não explica nada").
- **Justificativa:** é onde valores, religião e cultura entram no domínio sem virarem taxonomia — a pessoa diz com as próprias palavras; o Curador lê contra condutas declaradas.

**Resumo da Parte 1: os 5 conceitos vigentes permanecem integralmente. Nenhum é removido, fundido ou reduzido.**

---

# Parte 2 — Revisão profunda dos quatro conceitos novos sugeridos

## 2.1 `MODELO_RITMO_DA_CONSULTA`

| Pergunta | Resposta |
|---|---|
| Resolve necessidade real? | Sim — "vou ter tempo de falar e de perguntar?" é uma angústia real e frequente. |
| Já existe no catálogo? | **A metade verificável, sim**: profissional `RESERVA_TEMPO_PARA_PERGUNTAS` e pessoa `TEMPO_PARA_PERGUNTAR` são opções de `MODELO_COMUNICACAO`. |
| Existe parcialmente? | A metade restante — duração declarada da consulta — não existe. |
| É redundante? | Na parte que importa, sim. |
| Deve ser incorporado? | **Não.** |
| Deve ser descartado? | **Sim — descartado.** |

**Justificativa:** a necessidade legítima ("ter tempo") já cruza dentro de `MODELO_COMUNICACAO`. O que sobraria — minutos declarados de consulta — é um número, e número declarado (a) convida à comparação e à ordenação que o Método proíbe, (b) é promessa que a Aliviar não consegue verificar (violaria a Política de Promessas), e (c) mede agenda, não relação. O conceito reprova no teste de consolidação ("provar que não cabe em conceito existente").

## 2.2 `MODELO_CANAL_ENTRE_CONSULTAS`

| Pergunta | Resposta |
|---|---|
| Resolve necessidade real? | Sim — e por isso o Método já a resolveu. |
| Já existe no catálogo? | **Sim, integralmente**: `CONTINUIDADE_CANAIS` tem 7 opções de canal do profissional, campo `prazo_de_resposta` (mesmo dia · até 48h · até 5 dias úteis · sem prazo definido), pergunta da pessoa ("Você precisa conseguir falar com alguém entre as consultas?") e até a regra "NAO_HA_CANAL é fato declarado, não defeito". |
| Existe parcialmente? | Não — existe por inteiro. |
| É redundante? | **Totalmente.** |
| Deve ser incorporado? | **Não.** |
| Deve ser descartado? | **Sim — descartado.** |

**Justificativa:** criar o gêmeo no Eixo 3 seria o "terceiro vocabulário para a mesma coisa" que a ADR-039 proíbe, e violaria o princípio "um conceito, uma natureza". Também não se justifica mover o conceito de eixo: canal e prazo de resposta são organização do cuidado (assistencial), não forma da relação. A pessoa não perde nada: o canal continua cruzando na leitura assistencial.

## 2.3 `MODELO_CONTINUIDADE_DO_VINCULO`

| Pergunta | Resposta |
|---|---|
| Resolve necessidade real? | Sim — "serei atendida sempre por ele, ou por gente diferente a cada consulta?" toca o vínculo de verdade. |
| Já existe no catálogo? | Em parte: `CONTINUIDADE_POS_PROCEDIMENTO` declara "acompanha pessoalmente todo o pós" / "acompanha com equipe" / "acompanha até a alta e encaminha"; `CONTINUIDADE_EQUIPE_DE_APOIO` declara quem mais acompanha (incl. "atua sem equipe fixa"). |
| Existe parcialmente? | Sim — o recorte não coberto é estreito: quem conduz as **consultas de rotina** fora do contexto de procedimento. |
| É redundante? | Em grande parte. |
| Deve ser incorporado? | **Não nesta versão.** |
| Deve ser descartado? | **Sim — descartado da v1.0, com porta de reavaliação definida.** |

**Justificativa:** a regra vigente de evolução exige necessidade observada em Case real — e a Rede real ainda não opera. O recorte genuinamente novo é pequeno demais para pagar o custo de um conceito (e o risco de dupla contagem com os dois conceitos de CONTINUIDADE é alto). Porta de reavaliação: se o uso observado na Mesa demonstrar a lacuna, o conceito nasce primeiro como experimental (fora do motor, invisível à paciente, expira em 12 meses) e só depois como pleno — mediante nova ADR, como manda a regra de congelamento deste documento.

## 2.4 `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`

| Pergunta | Resposta |
|---|---|
| Resolve necessidade real? | **Sim — talvez a mais real de todas no contexto da Aliviar.** O momento da notícia difícil é o de maior assimetria da relação; é onde a forma de cuidar decide se a pessoa consegue continuar no próprio tratamento. |
| Já existe no catálogo? | Não. |
| Existe parcialmente? | Nas bordas: verificação de entendimento (COMUNICACAO) e presença de acompanhante (PARTICIPACAO_FAMILIAR) tangenciam. O núcleo — *como se comunica o que dói, em que ritmo, com que preparo e com que continuidade imediata* — não existe em nenhum conceito. |
| É redundante? | Não, desde que a fronteira seja escrita (abaixo). |
| Deve ser incorporado? | **Sim — é a única adição do domínio.** |
| Deve ser descartado? | Não. |

**Justificativa e fronteiras:** a definição nasce estreitada (lição registrada do próprio catálogo): cobre **somente** a conduta na comunicação de notícia grave. Explicação rotineira permanece em `MODELO_COMUNICACAO`; presença rotineira de acompanhante permanece em `MODELO_PARTICIPACAO_FAMILIAR`; o conceito não deve ser alargado para absorvê-las (mesmo padrão de fronteira escrita que COMUNICACAO usa para idioma). Cruzamento **humano obrigatório**: "direta e completa" × "pergunta o quanto a pessoa quer saber" não é correspondência mecânica — é a mesma natureza da decisão compartilhada. Todas as opções são condutas ou preferências declaradas, nunca traços ("comunica com sensibilidade" não existe e não existirá).

---

# Parte 3 — Verificação de lacunas (pensando só na relação terapêutica, sem o catálogo)

Dimensões da relação médico–paciente examinadas uma a uma:

1. **Compreensão mútua (entender e ser entendida)** → coberta: `MODELO_COMUNICACAO`.
2. **Poder e protagonismo na decisão** → coberta: `MODELO_DECISAO_COMPARTILHADA`.
3. **Verdade sobre as opções e sobre a incerteza** → coberta: `MODELO_ALTERNATIVAS` (inclusive "limites do que se sabe hoje" e "o que acontece se nada for feito").
4. **Presença de quem a pessoa ama** → coberta: `MODELO_PARTICIPACAO_FAMILIAR`.
5. **Respeito a valores, crenças e recusas** → coberta: `MODELO_PREFERENCIAS_E_RESTRICOES` (texto da pessoa, juízo humano).
6. **O momento da notícia difícil** → coberta pela adição da Parte 2.4.
7. **Ser tratada como pessoa, não como caso (empatia, acolhimento, calor humano)** → **excluída por constituição do Método, e deve permanecer excluída**: são traços, não condutas verificáveis; "acolhedor" e "excelente comunicador" não são dados (regra vigente). O domínio captura a *sombra observável* desses traços através das condutas dos conceitos 1–6 — que é o máximo que um método honesto pode prometer.
8. **Preferência por características do profissional (gênero, idade)** → necessidade real em cuidado íntimo, porém **inviável na arquitetura vigente**: exigiria expor e cruzar dados demográficos do profissional, campo **permanentemente banido** pela política de campos do Kernel (demografia, junto com popularidade e volume). Se um dia entrar, é decisão constitucional, não de domínio. Registrada como exclusão consciente, não como lacuna.
9. **Idioma e acessibilidade (sensorial, comunicacional)** → exclusão deliberada e registrada do Catálogo 1.0.0 ("não é tratado como lacuna nesta fase"). Permanece fora deste domínio; candidata natural à primeira evolução futura por ADR quando a Rede real trouxer o caso concreto.
10. **Permanência do vínculo (sempre o mesmo profissional)** → parcialmente coberta pelo eixo CONTINUIDADE (assistencial); o resíduo relacional fica para reavaliação futura (Parte 2.3).
11. **Confiança e reputação relacional (o que outros pacientes sentiram)** → **banida permanentemente** (popularidade/estrelas/volume — campos proibidos do Kernel). Exclusão consciente.

**Conclusão da Parte 3:** com a incorporação de `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`, **não existe dimensão importante da relação terapêutica, representável dentro da constituição do Método (condutas observáveis e declarações fechadas, sem traços, sem demografia, sem reputação), que esteja fora do domínio. O domínio pode ser considerado completo para a versão 1.0.** As exclusões dos itens 7, 8, 9, 10 e 11 são conscientes, justificadas e registradas — três delas constitucionais (permanentes) e duas evolutivas (dependem de nova ADR e de uso observado).

---

# Parte 4 — Modelo definitivo do domínio

O domínio da Compatibilidade Relacional é a **quarta leitura da Curadoria**, sobre o Eixo `MODELO_DE_ATENDIMENTO` com **exatamente seis conceitos**:

| # | Conceito | Objetivo | Pergunta do paciente | Pergunta do profissional | Cruzamento | Justificativa |
|---|---|---|---|---|---|---|
| 1 | `MODELO_COMUNICACAO` | Registrar condutas de explicação, adaptação e verificação de entendimento | "O que te ajudaria a entender melhor o que for explicado?" | "Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?" | **Automático** | Correspondência quase 1:1 entre pedido e conduta; sem espaço para juízo de valor |
| 2 | `MODELO_DECISAO_COMPARTILHADA` | Registrar condutas diante de mais de uma alternativa adequada | "Quando houver mais de um caminho possível, como você gostaria de participar da decisão?" | "Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?" | **Humano** | A mesma conduta muda de sentido conforme a pessoa; automatizar produziria o erro mais grave do catálogo |
| 3 | `MODELO_PARTICIPACAO_FAMILIAR` | Registrar abertura e condições para acompanhantes | "Você quer que alguém participe das conversas?" | "Como você conduz a presença de acompanhantes?" | **Automático** | Pedido e conduta são fatos simétricos; abertura nunca significa obrigação |
| 4 | `MODELO_ALTERNATIVAS` | Registrar se apresenta os caminhos, inclusive não intervir, com riscos, custos e limites do que se sabe | "O que você precisa saber antes de aceitar um tratamento?" | "Ao propor uma conduta, quais dessas você costuma apresentar?" | **Automático** | O *o quê* da informação é verificável por correspondência; o *como* da decisão fica no conceito 2 |
| 5 | `MODELO_PREFERENCIAS_E_RESTRICOES` | Registrar como lida com recusas e restrições pessoais, religiosas ou culturais | "Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?" (texto guiado — único do domínio) | "Quando a pessoa recusa uma conduta ou tem restrição pessoal, religiosa ou cultural, o que você costuma fazer?" | **Humano** | Texto livre da pessoa jamais entra em motor; respeito se lê caso a caso |
| 6 | `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` **(novo)** | Registrar condutas na comunicação de notícia grave: ritmo, preparo, companhia e continuidade imediata | "Se houver uma notícia difícil, como você prefere recebê-la?" (direta e completa · no meu ritmo, conforme eu perguntar · com alguém que eu escolher junto · junto com o que pode ser feito a respeito · não sei ainda) | "Ao comunicar um diagnóstico grave ou uma notícia difícil, quais dessas condutas você costuma adotar?" (reserva tempo dedicado · pergunta o quanto a pessoa quer saber · comunica junto com os próximos passos · oferece presença de acompanhante · programa recontato próximo após a notícia) | **Humano** | Mesmo fundamento do conceito 2; fronteiras escritas com os conceitos 1 e 3 |

**Regras estruturais do domínio (fechadas):**

- Entrada do lado da pessoa: escolhas fechadas + **grau** (`ESSENCIAL` · `PESA_MUITO` · `DESEJAVEL` · `SEM_PREFERENCIA`), com origem (direta ou tradução) e reconhecimento pela pessoa — mesmo ato de reconhecimento do Perfil, escopo ampliado.
- Entrada do lado do profissional: condutas declaradas na Base de Evidências de Prática, com fonte, versão e verificação. Sem peso, sem nota, sem adjetivo.
- Correspondência opção-a-opção declarada no catálogo (nunca por nome, sempre por identidade), somente nos 3 conceitos automáticos.
- A leitura **informa**: não pontua, não ranqueia, não elimina, não se soma às demais leituras, não promove profissional. Resultado nunca persistido.
- Grau da pessoa jamais vira importância do Case; as duas escalas não têm valor em comum.

---

# Parte 5 — Matriz definitiva

## 5.1 Derivação do estado do profissional (conceitos automáticos)

| Situação da evidência | Estado derivado |
|---|---|
| Nenhuma evidência vigente do conceito | `NAO_INFORMADO` |
| Evidência vigente, mas alguma opção pedida pela pessoa está sem conduta correspondente declarada | `NAO_CONFIRMADO` (em pergunta de múltipla escolha respondida, a conduta não marcada é fato declarado — "não é habitual" — e não lacuna) |
| Toda opção pedida tem conduta correspondente declarada | `CONFIRMADO` |

O detalhe opção-a-opção é preservado — o agregado nunca apaga o par que o sustenta.

## 5.2 A matriz completa (12 células) — com justificativa e frase real

Princípios herdados do Motor vigente: **P1** "não pesa" encerra o assunto; **P2** ausência nunca elimina e nunca vira alta; **P3** lacuna aparece como lacuna.

Exemplo usado nas frases: conceito `MODELO_COMUNICACAO`, pessoa pediu `QUE_CONFIRMEM_SE_ENTENDI` e `ALGO_ESCRITO_PARA_LEVAR`.

| Paciente (grau) | Profissional (estado) | Resultado | Justificativa | Frase do Relatório |
|---|---|---|---|---|
| `ESSENCIAL` | `CONFIRMADO` | `ALTA_COMPATIBILIDADE` | O que é inegociável para ela está declarado como conduta habitual dele | "Para você é essencial que confirmem se você entendeu e ter algo escrito para levar. Este profissional declara que verifica se a pessoa compreendeu e que envia resumo escrito." |
| `ESSENCIAL` | `NAO_CONFIRMADO` | `MEDIA_COMPATIBILIDADE` | P2: a ausência de uma conduta reduz aderência neste ponto — e mais nada; não elimina | "Para você é essencial ter algo escrito para levar. Entre as condutas declaradas por este profissional, o envio de resumo escrito não está." |
| `ESSENCIAL` | `NAO_INFORMADO` | `LACUNA_DE_INFORMACAO` | P3: o que não se sabe aparece como não sabido — nunca como zero | "Para você é essencial que confirmem se você entendeu. Ainda não há registro sobre como este profissional conduz esse ponto." |
| `PESA_MUITO` | `CONFIRMADO` | `ALTA_COMPATIBILIDADE` | O que pesa muito e está declarado é correspondência plena | "Pesa muito para você ter tempo para perguntar. Este profissional declara que reserva tempo para perguntas." |
| `PESA_MUITO` | `NAO_CONFIRMADO` | `MEDIA_COMPATIBILIDADE` | P2 | "Pesa muito para você poder gravar a conversa. Entre as condutas declaradas por este profissional, a autorização de gravação não está." |
| `PESA_MUITO` | `NAO_INFORMADO` | `LACUNA_DE_INFORMACAO` | P3 | "Pesa muito para você receber explicação sem termos técnicos. Ainda não há registro sobre esse ponto." |
| `DESEJAVEL` | `CONFIRMADO` | `MEDIA_COMPATIBILIDADE` | Espelha a matriz vigente (RELEVANTE/POUCO_IMPORTANTE × CONFIRMADO = MÉDIA): o desejável presente soma conforto, não estrutura | "Você disse que seria bem-vindo um desenho ou imagem na explicação. Este profissional declara que usa apoio visual ou desenho." |
| `DESEJAVEL` | `NAO_CONFIRMADO` | `MEDIA_COMPATIBILIDADE` | P2: nenhum grau menor pode produzir resultado pior que o do grau máximo com ausência | "Você disse que seria bem-vindo algo escrito para levar. Essa conduta não está entre as declaradas por este profissional." |
| `DESEJAVEL` | `NAO_INFORMADO` | `LACUNA_DE_INFORMACAO` | P3, leitura conservadora: deixar o grau baixo silenciar um "não sei" seria o motor decidindo o que o Curador precisa saber — quem ignora a lacuna é ele, olhando para ela | *(Frase de Mesa; no Relatório da pessoa, lacunas de grau DESEJAVEL entram apenas nos pontos de atenção quando o Curador as mantiver.)* |
| `SEM_PREFERENCIA` | `CONFIRMADO` | `NAO_RELEVANTE` | P1: sem preferência da pessoa, nada que ele tenha ou deixe de ter muda o cruzamento | *(Sem frase — fora do cruzamento.)* |
| `SEM_PREFERENCIA` | `NAO_CONFIRMADO` | `NAO_RELEVANTE` | P1 | *(Sem frase.)* |
| `SEM_PREFERENCIA` | `NAO_INFORMADO` | `NAO_RELEVANTE` | P1 | *(Sem frase.)* |

## 5.3 Fora da matriz — sinalizações dos conceitos humanos

| Paciente | Profissional | Sinalização | Justificativa | O que a Mesa exibe |
|---|---|---|---|---|
| Qualquer resposta nos conceitos 2, 5 ou 6 | Qualquer declaração vigente | `AGUARDA_JUIZO_DO_CURADOR` | O sentido da conduta depende da pessoa; nenhuma célula automática existe para estes conceitos | As duas declarações lado a lado + campo de leitura do Curador (com autoria e data) |
| Qualquer resposta nos conceitos 2, 5 ou 6 | Sem evidência vigente | `AGUARDA_JUIZO_DO_CURADOR` + lacuna | A lacuna não some por ser conceito humano | Idem, com a lacuna marcada |
| `NAO_SEI_AINDA` (conceitos 2 e 6) | — | Fora do cruzamento | "Não sei ainda" é resposta legítima, não pendência dela | Registro da resposta, sem cobrança |

O resumo da leitura **conta ocorrências e nada mais**: "3 altas · 1 média · 1 lacuna · 2 aguardam juízo do Curador". Nenhuma soma, nenhum percentual, nenhuma ordenação.

---

# Parte 6 — O Relatório Inteligente, conceito por conceito (frases reais)

Seção nova em cada uma das três cartas: **"Como esse caminho conversa com a forma como você quer ser cuidada"**. Toda frase é verbalização de opções estruturadas selecionadas, com proveniência rastreada (conceito + opção da pessoa + conduta declarada + registro de evidência). Frases dos conceitos humanos só aparecem após validação do Curador.

**1. `MODELO_COMUNICACAO` (automático)**
- Correspondência: *"Para você é essencial que confirmem se você entendeu. A Dra. Helena declara que verifica se a pessoa compreendeu e que reexplica de outra forma quando necessário."*
- Parcial: *"Pesa muito para você ter algo escrito para levar. Entre as condutas declaradas pela Dra. Helena, o envio de resumo escrito não está."*
- Lacuna: *"Ainda não há registro sobre como a Dra. Helena conduz o tempo para perguntas."*

**2. `MODELO_DECISAO_COMPARTILHADA` (humano — frase do sistema + leitura do Curador)**
- *"Você disse que quer decidir, com orientação. O Dr. Marcos declara que apresenta todas as opções adequadas, pergunta o que importa para a pessoa e oferece tempo para decidir. Leitura do Curador: as condutas declaradas sustentam o tipo de participação que você pediu."*
- Caso divergente: *"Você disse que prefere que o médico decida. O Dr. Marcos declara que apresenta todas as opções e pede que a pessoa participe da escolha. Leitura do Curador: esse estilo pede mais participação sua do que você disse preferir — é um ponto para conversar na primeira consulta."*

**3. `MODELO_PARTICIPACAO_FAMILIAR` (automático)**
- Correspondência: *"Para você é essencial ter acompanhante sempre. A Dra. Helena declara que acompanhante é bem-vindo em todas as consultas."*
- Parcial: *"Para você é essencial ter acompanhante sempre. O Dr. Marcos declara atendimento apenas individual."* (A frase diz o fato; nenhuma frase conclui adequação — isso é dos pontos de atenção do Curador.)

**4. `MODELO_ALTERNATIVAS` (automático)**
- *"Pesa muito para você conhecer os riscos de cada caminho e a opção de não fazer nada. A Dra. Helena declara que apresenta os riscos de cada caminho, a opção de acompanhar sem intervir e o que acontece se nada for feito."*
- Lacuna: *"Você quer conhecer os custos de cada caminho. Ainda não há registro sobre esse ponto."*

**5. `MODELO_PREFERENCIAS_E_RESTRICOES` (humano — texto da pessoa nunca é parafraseado pelo sistema)**
- *"Você registrou uma restrição que precisa ser respeitada no seu cuidado. O Dr. Marcos declara que registra restrições no prontuário e busca alternativa compatível. Leitura do Curador: levei sua restrição em conta ao compor estes três caminhos; nenhum deles exige o que você não aceita."*

**6. `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` (humano)**
- *"Você prefere receber notícias difíceis no seu ritmo, conforme for perguntando, e com alguém que você escolher junto. A Dra. Helena declara que pergunta o quanto a pessoa quer saber, oferece a presença de um acompanhante e programa um recontato próximo após a notícia. Leitura do Curador: a forma declarada de dar notícias acompanha o ritmo que você pediu."*

**Formas proibidas (nunca geradas, verificável por teste):** qualquer adjetivo ("atencioso", "acolhedor"), "atende ao seu perfil", "é o mais compatível", percentuais, contagem comparativa ("declara mais condutas que…"), conclusão de prática sem evidência registrada, comparação entre as três cartas.

**Dados parciais:** `SEM_REGISTRO` e `NAO_INFORMADO` permanecem frases distintas ("ainda não há registro" vs. "essa conduta não está entre as declaradas"). A seção nunca é omitida em silêncio: sem juízo do Curador num conceito humano, a carta declara o estado ("esta leitura aguarda a conversa com o Curador").

---

# Parte 7 — As superfícies

## 7.1 Mesa do Curador

**Etapa COMPATIBILIDADE, aba nova "Relacional"** (ao lado da aba "Assistencial", intocada):

```
COMPATIBILIDADE · Relacional          3 altas · 1 média · 1 lacuna · 2 aguardam juízo
─────────────────────────────────────────────────────────────────────────────────────
Conceito                    Grau dela      Ela pediu             Ele declara            Leitura
Como explica                Essencial      confirmar entendi-    verifica compreensão;  ALTA
                                           mento; algo escrito   envia resumo escrito
Alternativas                Pesa muito     riscos; não fazer     riscos; acompanhar     ALTA
                                           nada                  sem intervir
Acompanhantes               Essencial      acompanhante sempre   apenas individual      MÉDIA
Notícias difíceis           Pesa muito     no meu ritmo; com     pergunta o quanto      AGUARDA JUÍZO ▸
                                           alguém junto          quer saber; recontato
Decisão compartilhada       Essencial      decidir c/ orientação apresenta opções;      AGUARDA JUÍZO ▸
                                                                 pergunta o que importa
Preferências e restrições   —              [texto dela]          registra; busca        AGUARDA JUÍZO ▸
                                                                 alternativa
Como explica · gravação     Desejável      gravar a conversa     — sem registro         LACUNA
```

- **Painel de juízo** (abre em "AGUARDA JUÍZO ▸"): as duas declarações lado a lado, na íntegra, com fonte e data da evidência; campo único "Leitura do Curador" (texto curto, com autoria e carimbo); sem escala, sem nota, sem botão de "aprovar profissional".
- Lacunas e juízos pendentes entram na **linha de investigação** e nos **itens de atenção**, como as pendências assistenciais.
- **O que a aba nunca tem:** ordenação por resultado relacional, medalha, cor de "melhor", contagem comparativa entre profissionais lado a lado. A comparação premium continua existindo célula a célula — sem síntese ordenadora.

## 7.2 Dashboard do Paciente

**No cartão do Perfil de Prioridades — bloco novo "Como você quer ser cuidada"** (antes do reconhecimento; mesma linguagem dos graus, sem pontuação):

```
Como você quer ser cuidada
Essencial para você
  · Que confirmem se você entendeu, e algo escrito para levar
  · Ter acompanhante sempre
  · Decidir, com orientação
Pesa muito
  · Conhecer os riscos e a opção de não fazer nada
  · Receber notícias difíceis no seu ritmo, com alguém junto
Você registrou
  · Uma restrição que precisa ser respeitada  [o texto dela, na íntegra]

[ Isso me representa — reconhecer ]   [ Quero corrigir algo ]
```

- O reconhecimento é **o mesmo ato** de hoje, com escopo ampliado — sem segundo botão, sem segundo fluxo. Perfil reconhecido congela também este bloco; corrigir = supersessão (novo Perfil, novo reconhecimento).
- **Nas três cartas da entrega:** a seção da Parte 6, com as frases reais. A pessoa nunca vê matriz, células, contagens ou resultados nomeados ("ALTA/MÉDIA") — vê frases. Nenhuma carta se compara às outras.

---

# Parte 8 — Validação final

**1. O domínio está completo para a versão 1.0?**
Sim. Seis conceitos: cinco vigentes mantidos integralmente, um incorporado (`MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`), dois descartes definitivos (`RITMO`, `CANAL`) e um descarte com porta de reavaliação (`VINCULO`). A Parte 3 percorreu a relação terapêutica fora do catálogo e não encontrou dimensão representável que falte.

**2. Existe alguma lacuna importante?**
Nenhuma dentro da constituição do Método. As cinco exclusões registradas são conscientes: traços de personalidade, demografia e reputação são vetos constitucionais permanentes; idioma/acessibilidade e vínculo-de-longo-prazo são evoluções possíveis, cada uma exigindo nova ADR e necessidade observada em uso real.

**3. Você implementaria exatamente esse modelo?**
Sim. Ele reusa a física já provada do Motor (escala fechada, três princípios, estados sem intermediário), a Base de Evidências como fonte do lado do profissional, o grau sem colisão com importância, e a rastreabilidade por sentença já existente no gerador do Relatório. A única peça estrutural nova — a correspondência opção-a-opção declarada no catálogo — é pequena, verificável por paridade e é exatamente o que torna cada frase justificável.

**4. Existe algum risco arquitetural remanescente?**
Três, todos administráveis e nenhum de domínio:
(a) **transição de vigência do catálogo** (1.0.0 → 1.1.0) — mitigada pelas guardas de fonte única já implementadas no Bloco E, que precisa ser commitado antes;
(b) **fronteira com o Bloco F** — a materialização do lado da pessoa (P10/P12) toca arquivos que o Bloco F também tocará; a implementação desta leitura deve ser sequenciada explicitamente com a decisão sobre o Bloco F para não haver dois escritores do mesmo protocolo;
(c) **extensão do gate de reconhecimento** — Cases com Perfil já reconhecido antes da virada precisam de regra de transição explícita (o Perfil antigo permanece válido; o bloco relacional entra pelos novos Perfis e supersessões), a definir na migration — decisão de engenharia, não de domínio.

**5. Após esta aprovação, podemos iniciar imediatamente a implementação?**
Quase — faltam dois atos formais, ambos de documentação e rápidos: (1) lavrar a ADR-065 no `DECISIONS.md` com este documento como conteúdo normativo, junto da emenda do Modelo da Curadoria para v2.0 (três cruzamentos); (2) commitar a frente do Bloco E, que é pré-requisito técnico da migração do catálogo. Feitos esses dois, a implementação pode começar de imediato, na ordem: migration 1.1.0 → motor relacional → Mesa → Relatório → Dashboard.

---

## Regra de congelamento

Aprovado este documento, o domínio da Compatibilidade Relacional fica **congelado**: nenhuma nova ideia, nenhum novo conceito, nenhuma nova dimensão, nenhuma opção nova de resposta sem **nova ADR** que referencie este documento e demonstre por que ele não responde. As portas de evolução registradas (idioma/acessibilidade, vínculo, conceitos experimentais) só se abrem por esse rito.
