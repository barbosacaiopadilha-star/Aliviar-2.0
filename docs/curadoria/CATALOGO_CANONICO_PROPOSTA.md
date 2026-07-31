# Catálogo Canônico de Conceitos da Curadoria — Proposta

> **Status:** proposta de Método, não aprovada. Não implementar antes de decisão registrada em ADR.
> **Base:** ADR-039, ADR-040, ADR-041, ADR-042; `mapa-profissional.ts`, `motor-compatibilidade.ts`, `cruzamento.ts`, `dossie.ts`, `fontes.ts`; tabelas `method_subcriteria`, `professional_subcriterion_map`, `case_priority_map`, `criterion_declarations`.
> **Data:** 2026-07-31

---

# DOCUMENTO 1 — Diagnóstico do catálogo atual

## 1.1 A descoberta que organiza tudo

O catálogo atual **já é dividido em duas naturezas**, e essa divisão está no código, não na documentação:

```
TECHNICAL_CRITERIA = FORMACAO, EXPERIENCIA, HISTORICO          (13 subcritérios)
PATIENT_CRITERIA   = ACESSO, CONTINUIDADE_DO_CUIDADO, MODELO   (13 subcritérios)
```

`cruzamento.ts:134` explica por quê: *"Os três critérios do paciente usam exatamente os eixos do Perfil Assistencial — é o que torna o cruzamento assistencial uma comparação entre duas declarações, e não uma inferência."*

E `dossie.ts` completa a razão do outro lado: *"Uma residência em ortopedia é excelente para um caso e irrelevante para outro; quem sabe a diferença é quem entendeu o caso."*

**Consequência para o catálogo: os 13 conceitos técnicos não têm lado da paciente.** Ninguém declara preferência por fellowship. O Case declara importância, o Curador julga relevância, e a paciente nunca é perguntada. Metade do contrato canônico é, portanto, estruturalmente mais simples — e tentar dar a esses conceitos uma "pergunta à paciente" seria inventar demanda que não existe.

## 1.2 Inventário dos 26 subcritérios vigentes

**Legenda:** *Motor* = participa das 15 células · *Evid.* = tem evidência hoje · *Prov.* = tem proveniência hoje · *Perm.* = permanente (profissional) ou do Case

### Eixo técnico — julgamento humano, sem lado da paciente

| Código | Nome | Grupo | Definição vigente | Motor | Evid. | Prov. | Perm. | Múltipla escolha? | Problema |
|---|---|---|---|---|---|---|---|---|---|
| `FORMACAO_GRADUACAO` | Graduação | FORMACAO | Onde e quando se formou em medicina | sim | não | não | permanente | não — é fato datado | — |
| `FORMACAO_RESIDENCIA` | Residência médica | FORMACAO | Residência concluída na especialidade | sim | não | não | permanente | não | — |
| `FORMACAO_ESPECIALIZACAO` | Especialização | FORMACAO | Título de especialista ou especialização formal | sim | não | não | permanente | não | — |
| `FORMACAO_FELLOWSHIP` | Fellowship | FORMACAO | Formação avançada em subárea | sim | não | não | permanente | não | — |
| `FORMACAO_COMPLEMENTAR` | Formação complementar | FORMACAO | Pós-graduação e cursos relevantes | sim | não | não | permanente | sim | **vago** — "relevante para este caso" é juízo do Case dentro de um conceito permanente |
| `EXPERIENCIA_TEMPO_DE_PRATICA` | Tempo de prática | EXPERIENCIA | Há quanto tempo atua na especialidade | sim | não | não | permanente | não — faixa | — |
| `EXPERIENCIA_CASOS_SEMELHANTES` | Casos semelhantes | EXPERIENCIA | Experiência com situações parecidas | sim | não | não | **do Case, gravado como permanente** | não | **duplicado** com o seguinte |
| `EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO` | Condição ou procedimento | EXPERIENCIA | Experiência específica na condição | sim | não | não | **do Case, gravado como permanente** | não | **duplicado** com o anterior |
| `EXPERIENCIA_VOLUME_DE_ATUACAO` | Volume de atuação | EXPERIENCIA | Com que frequência atende esse tipo de caso | sim | não | não | permanente | não — faixa | **risco**: volume lido como mérito |
| `HISTORICO_REGULARIDADE` | Regularidade profissional | HISTORICO | Registro regular, sem pendência | sim | não | não | permanente **volátil** | não | **duplica** `registration_status`, que já é requisito de publicação |
| `HISTORICO_TRAJETORIA_INSTITUCIONAL` | Trajetória institucional | HISTORICO | Serviços e instituições em que atuou | sim | não | não | permanente | sim | — |
| `HISTORICO_PRODUCAO_ACADEMICA` | Produção acadêmica | HISTORICO | Publicação e produção científica | sim | não | não | permanente | não | **sobreposto** ao seguinte |
| `HISTORICO_ENSINO_E_PESQUISA` | Ensino e pesquisa | HISTORICO | Participação em ensino e formação | sim | não | não | permanente | não | **sobreposto** ao anterior |

### Eixo assistencial — comparável, com lado da paciente

| Código | Nome | Grupo | Definição vigente | Motor | Evid. | Prov. | Perm. | Múltipla escolha? | Problema |
|---|---|---|---|---|---|---|---|---|---|
| `ACESSO_LOCALIZACAO` | Localização | ACESSO | Onde atende, e o quanto pesa no deslocamento | sim | não | não | permanente | sim | **duas coisas numa** — onde atende (fato) e peso do deslocamento (do Case) |
| `ACESSO_MODALIDADE` | Modalidade de atendimento | ACESSO | Presencial, remoto ou os dois | sim | não | não | permanente | sim | — |
| `ACESSO_DISPONIBILIDADE` | Disponibilidade | ACESSO | Horários e janelas em que atende | sim | não | não | permanente **volátil** | sim | — |
| `ACESSO_PRAZO_PARA_CONSULTA` | Prazo para a consulta | ACESSO | Quanto tempo até ser atendido | sim | não | não | permanente **volátil** | não — faixa | — |
| `CONTINUIDADE_RETORNOS` | Retornos | CONTINUIDADE | Como e com que frequência acontecem | sim | não | não | permanente | sim | — |
| `CONTINUIDADE_POS_PROCEDIMENTO` | Acompanhamento pós-procedimento | CONTINUIDADE | O que acontece depois, e por quanto tempo | sim | não | não | permanente | sim | — |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | Equipe de apoio | CONTINUIDADE | Equipe que acompanha junto | sim | não | não | permanente | sim | — |
| `CONTINUIDADE_COORDENACAO` | Coordenação com outros profissionais | CONTINUIDADE | Como conversa com os outros que cuidam | sim | não | não | permanente | sim | — |
| `MODELO_COMUNICACAO` | Comunicação | MODELO | Como explica, e o quanto se faz entender | sim | não | não | permanente | sim | **ambíguo** — "o quanto se faz entender" é julgamento de qualidade |
| `MODELO_DECISAO_COMPARTILHADA` | Decisão compartilhada | MODELO | O quanto decide junto, e não pela pessoa | sim | não | não | permanente | sim | **"o quanto"** sugere gradação — o Método não gradua |
| `MODELO_PARTICIPACAO_FAMILIAR` | Participação da família | MODELO | Abertura para a família participar | sim | não | não | permanente | sim | — |
| `MODELO_ALTERNATIVAS` | Explicação de alternativas | MODELO | Se apresenta os caminhos, inclusive não intervir | sim | não | não | permanente | sim | — |
| `MODELO_PREFERENCIAS_E_RESTRICOES` | Preferências e restrições | MODELO | Como acolhe o que a pessoa quer e não aceita | sim | não | não | permanente | sim | **definição ampla demais** — "o que a pessoa quer" cabe quase tudo, e conceito que cabe tudo não explica nada |

## 1.3 Achados transversais

**A1 — Nenhum dos 26 tem evidência ou proveniência.** `professional_subcriterion_map` guarda `status` (3 estados) e `note` (≤280, opcional, declarada no código como *"apoio à leitura, não laudo"*). A área de atuação, ao lado, tem `verification_status`, fonte, data e responsável. **A assimetria não tem justificativa de Método** — é ordem de construção.

**A2 — Evidência existe, mas presa ao Case.** `criterion_declarations` exige `evidence` em texto, com autor e data, mas por Case e sobre os 6 grupos, não sobre os 26. O que se apura no Case A não existe no Case B.

**A3 — Quatro definições contêm julgamento embutido.** "o quanto se faz entender", "o quanto decide junto", "relevantes para este caso", "o quanto isso pesa no deslocamento". Todas misturam fato permanente com juízo do Case — exatamente o que a ADR-040 item 3 separa.

**A4 — Duas duplicações reais.** `CASOS_SEMELHANTES` × `CONDICAO_OU_PROCEDIMENTO`; `PRODUCAO_ACADEMICA` × `ENSINO_E_PESQUISA`.

**A5 — Uma duplicação com o cadastro.** `HISTORICO_REGULARIDADE` repete `registration_status`, que já é condição de publicação verificada contra fonte oficial primária. Registrar duas vezes cria a possibilidade de divergirem.

**A6 — Idiomas e acessibilidade existem em camadas periféricas, mas não no catálogo — e por decisão de Método, continuarão não existindo.** `fontes.ts` conhece `IDIOMAS` e `ACESSIBILIDADE` como tipos de informação, com fonte mínima definida, e as tags do grupo MODELO em `cruzamento.ts:175` citam ambos. Nenhum dos 26 os representa.

**Decisão de Método de 2026-07-31:** idiomas e acessibilidade física **não entram** nesta reformulação; acessibilidade comunicacional **não existe como conceito independente** — o que se refere a clareza e adaptação da comunicação é absorvido por `MODELO_COMUNICACAO`. Isto não é lacuna a resolver nesta fase.

**Consequência que fica aberta (não é lacuna do catálogo, é inconsistência de código):** `fontes.ts` e as tags de `cruzamento.ts:175` passam a referenciar conceitos que o catálogo deliberadamente não tem. Pelo princípio de fonte única (§7.1 do documento de operação), essas listas precisam derivar do catálogo ou deixar de citar o que ele não representa. **Registrado para correção em missão própria — não é matéria desta consolidação.**

---

# DOCUMENTO 1B — Vazios (ETAPA 2)

| Item | Classificação | Justificativa |
|---|---|---|
| Modalidade | **representado** | `ACESSO_MODALIDADE` |
| Localização | **insuficiente** | mistura local de atendimento com peso do deslocamento |
| Horários | **representado** | dentro de `ACESSO_DISPONIBILIDADE` |
| Disponibilidade | **representado** | `ACESSO_DISPONIBILIDADE` |
| Prazo para consulta | **representado** | `ACESSO_PRAZO_PARA_CONSULTA` |
| Retornos | **representado** | `CONTINUIDADE_RETORNOS` |
| Frequência de acompanhamento | **representado** | dentro de `CONTINUIDADE_RETORNOS` |
| Acompanhamento pós-procedimento | **representado** | `CONTINUIDADE_POS_PROCEDIMENTO` |
| **Canais entre consultas** | **ausente por esquecimento** | Não há conceito para "como falo com ele entre uma consulta e outra". É uma das necessidades mais concretas de quem está doente, e nenhum dos 26 a alcança |
| Equipe de apoio | **representado** | `CONTINUIDADE_EQUIPE_DE_APOIO` |
| Coordenação | **representado** | `CONTINUIDADE_COORDENACAO` |
| Comunicação | **insuficiente** | conceito existe, definição contém julgamento de qualidade |
| Adaptação de linguagem | **representado como opção** | absorvido por `MODELO_COMUNICACAO` — é conduta observável, nunca conceito próprio |
| Confirmação de compreensão | **representado como opção** | idem |
| Decisão compartilhada | **representado** | `MODELO_DECISAO_COMPARTILHADA` |
| Apresentação de alternativas | **representado** | `MODELO_ALTERNATIVAS` |
| Participação da família | **representado** | `MODELO_PARTICIPACAO_FAMILIAR` |
| Preferências e restrições | **insuficiente** | catch-all; precisa de definição estreita |
| **Idiomas** | **fora do escopo desta reformulação — decisão de Método** | decidido em 2026-07-31: não entra no Catálogo Canônico desta fase |
| **Acessibilidade física** | **fora do escopo desta reformulação — decisão de Método** | idem |
| **Acessibilidade comunicacional** | **não é conceito independente — decisão de Método** | clareza e adaptação da comunicação são absorvidas por `MODELO_COMUNICACAO` |
| Recursos para pessoas com deficiência | **fora do escopo desta reformulação** | decorre das três decisões acima |
| **Limites de atuação** | **ausente por esquecimento** | o que o profissional **não** atende. Hoje só se descobre depois. É proteção da paciente, não do médico |
| Necessidade de encaminhamento | **representado se limites entrar** | é opção de `LIMITES_DE_ATUACAO` |
| **Custo** | **entra — decisão de Método 2026-07-31** | `VIABILIDADE_CUSTO_E_PAGAMENTO`, fora da matriz do Motor |
| **Convênio** | **entra — decisão de Método 2026-07-31** | `VIABILIDADE_COBERTURA_E_CONVENIO`, fora da matriz do Motor |
| Reembolso | **representado como opção** | opções de `VIABILIDADE_COBERTURA_E_CONVENIO`; nunca cruzado automaticamente |
| Formas de pagamento | **representado como opção** | opções de `VIABILIDADE_CUSTO_E_PAGAMENTO` |

## 1B.1 — Custo e convênio: decisão tomada

**Decisão de Método de 2026-07-31: entram**, como dois conceitos do eixo Viabilidade de Acesso — `VIABILIDADE_COBERTURA_E_CONVENIO` e `VIABILIDADE_CUSTO_E_PAGAMENTO`. Servem para identificar se o cuidado recomendado é concretamente viável para a paciente.

A forma aprovada é a do meio-termo que havia sido proposto: **viabilidade declarada, nunca comparada automaticamente.** Fora da matriz do Motor; sem pontuação, ranking, ordenação ou juízo sobre preço; produzindo apenas informação de viabilidade, condição de acesso, pendência de confirmação ou barreira objetiva sinalizada ao Curador. A conclusão é humana e específica do Case. Contratos completos no Eixo 5.

---

# DOCUMENTO 2 — Princípios do catálogo (ETAPA 3)

Aos quinze princípios recebidos, que adoto integralmente, acrescento cinco que derivam do código e sem os quais o catálogo não se sustenta:

**P16 — Um conceito pertence a uma natureza só.** Ou é fato permanente do profissional, ou é juízo do Case. Definição que contenha as duas ("relevante para este caso", "o quanto pesa no deslocamento") está errada e precisa ser partida.

**P17 — O eixo técnico não tem lado da paciente.** Ninguém declara preferência por residência. O Case declara importância; o Curador julga relevância. Inventar pergunta à paciente nesses conceitos criaria demanda artificial.

**P18 — Selecionar mais opções nunca é melhor.** Múltipla escolha descreve amplitude de prática, não qualidade. Nenhuma leitura pode contar opções.

**P19 — Todo conceito declara sua volatilidade.** `fontes.ts` já separa `ESTAVEL` de `VOLATIL` e exporta `isStale`. Conceito sem prazo de revisão convida a confiar em dado velho.

**P20 — Opção selecionada não é evidência.** Uma escolha em formulário é declaração. Vira `verificado` apenas quando uma pessoa autorizada olha a fonte e assina — regra que `fontes.ts` já impõe e que o catálogo não pode afrouxar.

---

# DOCUMENTO 3 — Catálogo Canônico proposto

**Estrutura:** 5 eixos, **28 conceitos canônicos** — 26 assistenciais/técnicos + 2 de viabilidade de acesso (fora da matriz do Motor).

Notação do contrato: **ID · Nome · Definição · Pergunta humana** / **Profissional:** pergunta, tipo, opções / **Paciente:** pergunta, tipo, opções / **Cruzamento:** automático ou humano / **Evidência:** fonte mínima, volatilidade, revisão.

---

## EIXO 1 — ACESSO AO CUIDADO (4 conceitos)

### `ACESSO_MODALIDADE` · Modalidade de atendimento
**Definição:** em que formatos o profissional atende.
**Pergunta humana:** *É possível ser atendida do jeito que consigo?*

**Profissional** — *"Em quais formatos você atende hoje?"* · múltipla escolha
`PRESENCIAL` · `REMOTO` · `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` · `PRIMEIRA_REMOTA_CONDICIONADA` (exige condição estruturada) · `HIBRIDO_CONFORME_O_CASO` (exige condição)
Complemento livre: apenas para condição não representada.

**Paciente** — *"Como você consegue ser atendida?"* · múltipla escolha + grau
`PRECISO_REMOTO` · `PREFIRO_REMOTO` · `PRECISO_PRESENCIAL` · `PREFIRO_PRESENCIAL` · `TANTO_FAZ` · `NAO_SEI_INFORMAR`
Grau: essencial · preferência · sem preferência. Flexibilidade: aceita o outro formato eventualmente (sim/não).

**Cruzamento:** **automático.** Declaração contra declaração.
**Evidência:** fonte mínima institucional · **VOLÁTIL** · revisão sugerida 6 meses.

### `ACESSO_LOCAL_DE_ATENDIMENTO` · Local de atendimento
*(substitui `ACESSO_LOCALIZACAO`, que misturava fato e juízo)*
**Definição:** onde o profissional atende presencialmente.
**Pergunta humana:** *Consigo chegar até lá?*

**Profissional** — *"Em quais endereços você atende presencialmente?"* · múltipla escolha estruturada (cidade + UF + tipo de local: consultório, hospital, clínica, ambulatório)
**Paciente** — *"De onde você pode se deslocar, e até onde?"* · cidade/UF + faixa de deslocamento aceitável (`ATE_30_MIN` · `ATE_1H` · `ATE_2H` · `QUALQUER_DISTANCIA` · `NAO_POSSO_ME_DESLOCAR`) + grau.

**Cruzamento:** **automático** para cidade/UF; **humano** para tempo de deslocamento real, que depende de transporte, condição clínica e acompanhante.
**Evidência:** institucional · VOLÁTIL · 6 meses.

### `ACESSO_DISPONIBILIDADE` · Disponibilidade
**Definição:** janelas habituais de atendimento.
**Pergunta humana:** *Ele atende quando eu consigo ir?*

**Profissional** — *"Em quais janelas você atende habitualmente?"* · múltipla escolha
`MANHA_DIAS_UTEIS` · `TARDE_DIAS_UTEIS` · `NOITE_APOS_18H` · `SABADO` · `DOMINGO_OU_FERIADO` · `SOB_AGENDAMENTO_ESPECIFICO`
**Paciente** — *"Quando você consegue ser atendida?"* · múltipla escolha + grau + flexibilidade (`POSSO_FALTAR_AO_TRABALHO` sim/não).

**Cruzamento:** **automático** — interseção de janelas. Interseção vazia é **condição relevante**, nunca "não atende" automático.
**Evidência:** institucional · **VOLÁTIL** · 3 meses.

### `ACESSO_PRAZO_PARA_CONSULTA` · Prazo para a primeira consulta
**Definição:** tempo habitual até o primeiro atendimento.
**Pergunta humana:** *Vou conseguir ser atendida a tempo?*

**Profissional** — *"Qual o prazo habitual para a primeira consulta?"* · escolha única em faixa
`ATE_7_DIAS` · `DE_8_A_15_DIAS` · `DE_16_A_30_DIAS` · `DE_31_A_60_DIAS` · `MAIS_DE_60_DIAS` · `VARIA_CONFORME_O_CASO` (exige condição)
**Paciente** — *"Em quanto tempo você precisa ser atendida?"* · faixa + grau.

**Cruzamento:** **automático** por comparação de faixas. Prazo do profissional maior que a necessidade → **condição relevante**, com atenção.
**Evidência:** institucional · **VOLÁTIL** · 3 meses. Prazo é a informação que mais envelhece.

---

## EIXO 2 — CONTINUIDADE DO CUIDADO (5 conceitos)

### `CONTINUIDADE_RETORNOS` · Retornos
**Definição:** como o profissional organiza o retorno após a primeira consulta.
**Pergunta humana:** *Depois da primeira consulta, o que acontece?*

**Profissional** — *"Após a primeira consulta, quais dessas condutas você costuma adotar?"* · múltipla escolha
`RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA` · `RETORNO_CONFORME_EVOLUCAO` · `RETORNO_APENAS_SE_SOLICITADO` · `ENVIA_ORIENTACAO_ESCRITA` · `REAVALIA_EXAMES_ENTRE_CONSULTAS`
Frequência habitual, quando programado: `ATE_30_DIAS` · `DE_1_A_3_MESES` · `DE_3_A_6_MESES` · `ACIMA_DE_6_MESES` · `DEPENDE_DA_EVOLUCAO` (exige condição)
**Paciente** — *"Como você gostaria que fosse o acompanhamento depois da primeira consulta?"* · múltipla escolha + grau.

**Cruzamento:** **automático** para presença de conduta; **humano** para adequação da frequência ao quadro clínico.
**Evidência:** institucional ou entrevista · ESTÁVEL · 12 meses.

### `CONTINUIDADE_CANAIS` · Canais entre consultas — **NOVO**
**Definição:** por onde e em que condições a pessoa pode falar com o profissional ou a equipe entre consultas.
**Pergunta humana:** *Se eu piorar na quinta à noite, com quem eu falo?*

**Profissional** — *"Entre uma consulta e outra, como a pessoa consegue contato?"* · múltipla escolha
`MENSAGEM_DIRETA_COM_O_PROFISSIONAL` · `MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA` · `TELEFONE_EM_HORARIO_COMERCIAL` · `PORTAL_OU_APLICATIVO` · `CONTATO_DE_URGENCIA_FORA_DO_HORARIO` · `APENAS_REAGENDAMENTO` · `NAO_HA_CANAL_ENTRE_CONSULTAS`
Prazo habitual de resposta: `MESMO_DIA` · `ATE_48H` · `ATE_5_DIAS_UTEIS` · `SEM_PRAZO_DEFINIDO`
**Paciente** — *"Você precisa conseguir falar com alguém entre as consultas?"* · múltipla escolha + grau.

**Cruzamento:** **automático.** `NAO_HA_CANAL` é fato declarado, não defeito — e a paciente que precisa de canal merece saber antes, não depois.
**Evidência:** institucional ou entrevista · VOLÁTIL · 6 meses.

### `CONTINUIDADE_POS_PROCEDIMENTO` · Acompanhamento pós-procedimento
**Definição:** o que acontece depois de um procedimento, e por quanto tempo.
**Pergunta humana:** *Depois da cirurgia, quem cuida de mim?*

**Profissional** — *"Após um procedimento que você realiza, quais condutas são habituais?"* · múltipla escolha
`ACOMPANHA_PESSOALMENTE_TODO_O_POS` · `ACOMPANHA_COM_EQUIPE` · `ACOMPANHA_ATE_ALTA_E_ENCAMINHA` · `ENCAMINHA_PARA_OUTRO_PROFISSIONAL` · `NAO_REALIZA_PROCEDIMENTOS`
Duração habitual: `ATE_30_DIAS` · `ATE_90_DIAS` · `ATE_6_MESES` · `ACIMA_DE_6_MESES` · `CONFORME_O_PROCEDIMENTO`
**Paciente** — reconhecida pelo Curador (a paciente raramente sabe formular isso antes de saber que haverá procedimento) + grau.

**Cruzamento:** **humano.** Depende de haver procedimento previsto neste caso — juízo clínico do Curador.
**Evidência:** entrevista · ESTÁVEL · 12 meses.

### `CONTINUIDADE_EQUIPE_DE_APOIO` · Equipe de apoio
**Definição:** existência de equipe que acompanha junto com o profissional.
**Pergunta humana:** *Existe mais alguém cuidando, além dele?*

**Profissional** — *"Quem mais acompanha as pessoas que você atende?"* · múltipla escolha
`ENFERMAGEM` · `SECRETARIA_CLINICA` · `NUTRICAO` · `PSICOLOGIA` · `FISIOTERAPIA` · `SERVICO_SOCIAL` · `OUTRO_PROFISSIONAL_DA_EQUIPE` · `ATUA_SEM_EQUIPE_FIXA`
**Paciente** — *"Você precisa de acompanhamento de mais de um tipo de profissional?"* · múltipla escolha + grau.

**Cruzamento:** **automático** para presença de cada tipo. **Contagem de tipos é proibida** (P18).
**Evidência:** institucional · ESTÁVEL · 12 meses.

### `CONTINUIDADE_COORDENACAO` · Coordenação com outros profissionais
**Definição:** como o profissional se articula com quem mais cuida da pessoa.
**Pergunta humana:** *Ele conversa com meus outros médicos?*

**Profissional** — *"Quando a pessoa já é acompanhada por outros profissionais, o que você costuma fazer?"* · múltipla escolha
`CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` · `ENVIA_RELATORIO_ESCRITO` · `PARTICIPA_DE_DISCUSSAO_DE_CASO` · `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` · `ATUA_DE_FORMA_INDEPENDENTE`
**Paciente** — *"Você já é acompanhada por outros profissionais que precisariam conversar entre si?"* · sim/não + grau.

**Cruzamento:** **automático.**
**Evidência:** entrevista · ESTÁVEL · 12 meses.

---

## EIXO 3 — MODELO DE ATENDIMENTO (5 conceitos)

### `MODELO_COMUNICACAO` · Como explica
*(definição estreitada — sai "o quanto se faz entender", que era julgamento. **Absorve, por decisão de Método de 2026-07-31, tudo que se refere a clareza, adaptação da linguagem e verificação da compreensão** — nenhum desses vira conceito próprio)*
**Definição:** condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento.
**Pergunta humana:** *Vou entender o que ele me disser?*

**Profissional** — *"Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?"* · múltipla escolha
`ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR` · `VERIFICA_SE_A_PESSOA_COMPREENDEU` · `REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO` · `USA_APOIO_VISUAL_OU_DESENHO` · `ENVIA_RESUMO_ESCRITO` · `RESERVA_TEMPO_PARA_PERGUNTAS` · `AUTORIZA_GRAVACAO_DA_CONSULTA`
**Paciente** — *"O que te ajudaria a entender melhor o que for explicado?"* · múltipla escolha + grau.

**Cruzamento:** **automático** por conduta. **Proibido** derivar "comunicação boa" de número de condutas.
**Evidência:** entrevista da Curadoria · ESTÁVEL · 12 meses.

> **Fronteira deste conceito.** Ele cobre **como o profissional explica**. Não cobre recursos para deficiência sensorial (Libras, leitura labial, material para baixa visão) nem idioma de atendimento — os dois ficaram fora do catálogo por decisão de Método, e `MODELO_COMUNICACAO` **não deve ser alargado para absorvê-los por dentro**. Alargá-lo silenciosamente recriaria o saco de gatos que `MODELO_PREFERENCIAS_E_RESTRICOES` deixou de ser.

### `MODELO_DECISAO_COMPARTILHADA` · Como conduz decisões
*(sai "o quanto decide junto" — gradação implícita)*
**Definição:** condutas observáveis diante de mais de uma alternativa adequada.
**Pergunta humana:** *Eu vou participar da decisão sobre mim?*

**Profissional** — *"Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?"* · múltipla escolha
`APRESENTA_TODAS_AS_OPCOES_ADEQUADAS` · `EXPLICA_RISCOS_E_BENEFICIOS_DE_CADA_UMA` · `PERGUNTA_O_QUE_IMPORTA_PARA_A_PESSOA` · `OFERECE_TEMPO_PARA_DECIDIR` · `SUGERE_SEGUNDA_OPINIAO_QUANDO_PERTINENTE` · `RECOMENDA_UMA_OPCAO_E_EXPLICA_O_PORQUE` · `DECIDE_E_COMUNICA_A_CONDUTA`
**Paciente** — *"Quando houver mais de um caminho possível, como você gostaria de participar da decisão?"* · escolha única + grau
`QUERO_DECIDIR_COM_ORIENTACAO` · `QUERO_QUE_O_MEDICO_RECOMENDE_E_EU_CONFIRMO` · `PREFIRO_QUE_O_MEDICO_DECIDA` · `NAO_SEI_AINDA`

**Cruzamento:** **humano.** Esta é a correspondência mais fácil de errar automaticamente: `DECIDE_E_COMUNICA` combina com quem prefere que o médico decida, e colide com quem quer participar. A leitura é do Curador.
**Evidência:** entrevista da Curadoria · ESTÁVEL · 12 meses.

### `MODELO_ALTERNATIVAS` · Explicação de alternativas
**Definição:** se e como apresenta caminhos possíveis, inclusive não intervir.
**Pergunta humana:** *Vou conhecer todas as opções, inclusive a de não fazer nada?*

**Profissional** — *"Ao propor uma conduta, quais dessas você costuma apresentar?"* · múltipla escolha
`OPCOES_DE_TRATAMENTO_DISPONIVEIS` · `OPCAO_DE_ACOMPANHAR_SEM_INTERVIR` · `RISCOS_DE_CADA_CAMINHO` · `O_QUE_ACONTECE_SE_NADA_FOR_FEITO` · `LIMITES_DO_QUE_SE_SABE_HOJE` · `CUSTO_E_COBERTURA_DE_CADA_OPCAO`
**Paciente** — *"O que você precisa saber antes de aceitar um tratamento?"* · múltipla escolha + grau.

**Cruzamento:** **automático.**
**Evidência:** entrevista · ESTÁVEL · 12 meses.

### `MODELO_PARTICIPACAO_FAMILIAR` · Participação de acompanhantes
**Definição:** abertura e condições para a presença de acompanhantes.
**Pergunta humana:** *Alguém pode entrar comigo — ou eu preciso ficar sozinha?*

**Profissional** — *"Como você conduz a presença de acompanhantes?"* · múltipla escolha
`ACOMPANHANTE_BEM_VINDO_SEMPRE` · `ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA` · `PARTE_DA_CONSULTA_A_SOS` · `CONTATO_COM_FAMILIA_ENTRE_CONSULTAS_SE_AUTORIZADO` · `ATENDIMENTO_APENAS_INDIVIDUAL`
**Paciente** — *"Você quer que alguém participe das conversas?"* · escolha única + grau
`QUERO_ACOMPANHANTE_SEMPRE` · `EM_ALGUMAS_CONVERSAS` · `PREFIRO_SOZINHA` · `NAO_TENHO_PREFERENCIA`

**Cruzamento:** **automático**, com uma regra escrita: abertura à família **não** significa inclusão obrigatória. `ACOMPANHANTE_MEDIANTE_AUTORIZACAO` corresponde a `PREFIRO_SOZINHA`.
**Evidência:** entrevista · ESTÁVEL · 12 meses.

### `MODELO_PREFERENCIAS_E_RESTRICOES` · Respeito a recusas e restrições
*(definição estreitada — sai "como acolhe o que a pessoa quer", que abrangia quase tudo; fica o que o conceito realmente trata: recusas e restrições explícitas)*
**Definição:** como o profissional lida com recusas explícitas e restrições pessoais, religiosas ou culturais.
**Pergunta humana:** *Aquilo que eu não aceito vai ser respeitado?*

**Profissional** — *"Quando a pessoa recusa uma conduta ou tem restrição pessoal, religiosa ou cultural, o que você costuma fazer?"* · múltipla escolha
`REGISTRA_A_RESTRICAO_NO_PRONTUARIO` · `BUSCA_ALTERNATIVA_COMPATIVEL` · `EXPLICA_CONSEQUENCIAS_E_MANTEM_O_ACOMPANHAMENTO` · `ENCAMINHA_QUANDO_NAO_PODE_ATENDER_A_RESTRICAO` · `NAO_ACOMPANHA_QUEM_RECUSA_A_CONDUTA_INDICADA`
**Paciente** — *"Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?"* · texto guiado + grau. **Único conceito onde o texto livre da paciente é esperado** — restrição pessoal não cabe em lista fechada.

**Cruzamento:** **humano, obrigatoriamente.** Texto livre nunca entra no Motor.
**Evidência:** entrevista · ESTÁVEL · 12 meses.

---

## EIXO 4 — PRÁTICA E TRAJETÓRIA (12 conceitos) — sem lado da paciente

Aplicam-se a todos os conceitos deste eixo, por P17:

- **Paciente:** não há pergunta. O Case declara importância; o Curador julga relevância e registra em `criterion_declarations` com evidência obrigatória.
- **Cruzamento:** **humano, sempre.** Nenhum destes é comparação de declarações.
- **Frase proibida em todos:** qualquer adjetivo de qualidade sobre o profissional.

### Formação (5)
| ID | Definição | Profissional | Opções | Fonte mínima | Volatilidade |
|---|---|---|---|---|---|
| `FORMACAO_GRADUACAO` | Onde e quando se formou | "Instituição e ano de graduação" | estruturado: instituição + ano | **oficial primária** | estável · 60 meses |
| `FORMACAO_RESIDENCIA` | Residência na especialidade | "Residências concluídas" | instituição + especialidade + ano | **oficial primária** | estável · 60 meses |
| `FORMACAO_ESPECIALIZACAO` | Título de especialista | "Títulos de especialista" | entidade + área + ano | **oficial primária** | estável · 36 meses |
| `FORMACAO_FELLOWSHIP` | Formação avançada em subárea | "Fellowships realizados" | instituição + subárea + ano + país | **oficial primária** | estável · 60 meses |
| `FORMACAO_COMPLEMENTAR` | Pós-graduação e cursos | "Outras formações relevantes" | tipo + instituição + ano | institucional | estável · 36 meses |

> `FORMACAO_FELLOWSHIP` é, segundo `fontes.ts`, *"o título que mais gera divergência entre o declarado e o confirmado"* — merece atenção redobrada de verificação.

### Experiência (4)
| ID | Definição | Profissional | Opções | Fonte mínima | Volatilidade |
|---|---|---|---|---|---|
| `EXPERIENCIA_TEMPO_DE_PRATICA` | Tempo na especialidade | "Há quanto tempo atua" | faixas: `ATE_2` · `3_A_5` · `6_A_10` · `11_A_20` · `MAIS_DE_20` anos | institucional | volátil · 12 meses |
| `EXPERIENCIA_NO_TIPO_DE_CASO` **(fusão)** | Experiência na condição/procedimento e em casos semelhantes | "Com quais condições e procedimentos você tem prática regular?" | lista estruturada por área | institucional | volátil · 12 meses |
| `EXPERIENCIA_VOLUME_DE_ATUACAO` | Frequência com que atende esse tipo de caso | "Com que frequência atende" | `SEMANALMENTE` · `MENSALMENTE` · `ALGUMAS_VEZES_AO_ANO` · `RARAMENTE` | institucional | volátil · 12 meses |
| `PRATICA_LIMITES_DE_ATUACAO` **(NOVO)** | O que o profissional **não** atende e quando encaminha | "Quais situações você não atende e encaminha?" | lista estruturada + `ENCAMINHA_COM_INDICACAO` · `ENCAMINHA_SEM_INDICACAO` | entrevista | estável · 12 meses |

> **`PRATICA_LIMITES_DE_ATUACAO` protege a paciente, não o médico.** Sem ele, a incompatibilidade só aparece na consulta — depois da espera, do deslocamento e do custo.

### Histórico (3, após fusão)
| ID | Definição | Profissional | Opções | Fonte mínima | Volatilidade |
|---|---|---|---|---|---|
| `HISTORICO_TRAJETORIA_INSTITUCIONAL` | Serviços e instituições onde atuou | "Vínculos institucionais atuais e anteriores" | instituição + período + tipo | **oficial primária** | volátil · 12 meses |
| `HISTORICO_ATIVIDADE_ACADEMICA` **(fusão)** | Produção científica, ensino e formação de outros | "Atividade acadêmica" | `PUBLICA_REGULARMENTE` · `PUBLICOU_NO_PASSADO` · `LECIONA` · `ORIENTA_RESIDENTES` · `SEM_ATIVIDADE_ACADEMICA` | pública secundária | volátil · 24 meses |
| `HISTORICO_AREAS_DE_ATUACAO` | Áreas em que atua hoje | já existe como `professional_practice_areas` | texto bruto + tags + verificação | institucional | volátil · 12 meses |

> **`HISTORICO_REGULARIDADE` é removido do catálogo.** Ele duplica `registration_status`, que já é condição de publicação verificada contra fonte oficial primária, com fonte, data e responsável obrigatórios por `CHECK` no banco. Dois registros da mesma verdade podem divergir — e aí não se sabe qual vale.

---

## EIXO 5 — VIABILIDADE DE ACESSO (2 conceitos)

> **Decisão de Método de 2026-07-31:** custo e convênio **entram** no Método. Eles respondem se o cuidado recomendado é concretamente viável para esta pessoa.
>
> **Nenhum dos dois participa da matriz vigente do Motor.** Não produzem pontuação, ranking, porcentagem, ordenação, julgamento de qualidade nem comparação automática de preços. Produzem apenas: informação de viabilidade, condição de acesso, pendência de confirmação, ou barreira objetiva declarada ao Curador. **A conclusão é humana e específica do Case.**

### `VIABILIDADE_COBERTURA_E_CONVENIO` · Cobertura e convênio
**Definição:** por quais formas de cobertura o profissional atende, e o que a pessoa precisa usar.
**Pergunta humana:** *Eu consigo ser atendida pela forma de cobertura que tenho?*

**Profissional** — *"Por quais formas de cobertura você atende hoje?"* · múltipla escolha
`EXCLUSIVAMENTE_PARTICULAR` · `CONVENIOS_SELECIONADOS` (**exige lista estruturada de operadoras — obrigatória**) · `EMITE_DOCUMENTACAO_PARA_REEMBOLSO` · `NAO_EMITE_DOCUMENTACAO_PARA_REEMBOLSO` · `SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA` (exige condição) · `NAO_INFORMADO`

> **Regra dura:** `CONVENIOS_SELECIONADOS` sem a lista de operadoras é **inválido**. "Aceita convênio" sem dizer qual não é informação — é a aparência dela, e mandaria a paciente descobrir na recepção que o convênio dela não vale.

**Paciente** — *"Como você pretende usar sua cobertura?"* · múltipla escolha + grau
`PRECISO_USAR_ESTE_CONVENIO` (+ operadora) · `POSSO_USAR_REEMBOLSO` · `ACEITO_ATENDIMENTO_PARTICULAR` · `PRECISO_CONFIRMAR_MINHA_COBERTURA` · `SEM_RESTRICAO_DECLARADA` · `NAO_SE_APLICA`

**Relação entre os lados**
- **Correspondência:** operadora declarada pela paciente consta na lista do profissional.
- **Barreira objetiva:** paciente `PRECISO_USAR_ESTE_CONVENIO` (essencial) × profissional `EXCLUSIVAMENTE_PARTICULAR`, ou operadora ausente da lista. **Sinaliza; não elimina.**
- **Condição:** profissional `SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA` → correspondência sob condição, com a condição exibida.
- **Pendência:** paciente `PRECISO_CONFIRMAR_MINHA_COBERTURA` → confirmar antes da entrega.
- **Nunca cruzado automaticamente:** reembolso, que depende do contrato dela com a operadora — fato que a Aliviar não conhece.

**Evidência e validade:** fonte mínima **institucional** (o profissional ou a clínica declaram; nenhuma fonte pública sustenta convênio) · **VOLÁTIL** · revisão **3 meses**. Credenciamento cai sem aviso, e cair sem aviso é justamente o que faz a pessoa perder a consulta.

### `VIABILIDADE_CUSTO_E_PAGAMENTO` · Custo e pagamento
**Definição:** o custo declarado do atendimento e as formas de pagá-lo.
**Pergunta humana:** *Eu consigo pagar por isto?*

**Profissional** — *"Qual o custo da primeira consulta e como pode ser pago?"* · estruturado
Faixa: `ATE_300` · `DE_301_A_600` · `DE_601_A_1000` · `DE_1001_A_2000` · `ACIMA_DE_2000` · `SUJEITO_A_CONFIRMACAO` (exige condição) · `NAO_INFORMADO`
Formas: `DINHEIRO_OU_PIX` · `CARTAO_A_VISTA` · `CARTAO_PARCELADO` (+ número de parcelas) · `TRANSFERENCIA` · `BOLETO`
Custos adicionais conhecidos: `EXAMES_NAO_INCLUSOS` · `RETORNO_COBRADO_A_PARTE` · `TAXA_DE_PROCEDIMENTO` · `SEM_CUSTOS_ADICIONAIS_CONHECIDOS` · `NAO_INFORMADO`

**Paciente** — *"O que precisa ser verdade para você conseguir pagar?"* · múltipla escolha + grau
`TENHO_LIMITE_FINANCEIRO` (+ faixa) · `PRECISO_SABER_O_VALOR_ANTES_DE_ESCOLHER` · `ACEITO_ATE_ESTA_FAIXA` · `PRECISO_DE_PARCELAMENTO` · `NAO_DECLAREI_RESTRICAO` · `PREFIRO_NAO_INFORMAR` · `NAO_SE_APLICA`

> `PREFIRO_NAO_INFORMAR` é resposta legítima e **nunca** é tratada como ausência de restrição. O Método não deduz situação financeira de silêncio.

**Relação entre os lados**
- **Barreira objetiva declarada:** faixa do profissional acima da faixa que a paciente reconheceu como viável. Frase exata permitida: *"O valor informado está acima do limite que a paciente reconheceu como viável."* **Não elimina o profissional.**
- **Condição:** `PRECISO_DE_PARCELAMENTO` × profissional sem `CARTAO_PARCELADO` → condição relevante.
- **Pendência:** `PRECISO_SABER_O_VALOR_ANTES_DE_ESCOLHER` × profissional `NAO_INFORMADO` ou `SUJEITO_A_CONFIRMACAO` → **confirmar antes da entrega**; a escolha dela depende disso.
- **Nunca cruzado automaticamente:** custos adicionais, que dependem da conduta clínica ainda não definida.
- **Proibido em qualquer circunstância:** comparar faixas entre profissionais, ordenar por preço, chamar o mais barato de melhor opção, ou inferir capacidade financeira a partir de qualquer dado que não seja a declaração dela.

**Evidência e validade:** fonte mínima **institucional** · **VOLÁTIL** · revisão **3 meses**. Valor desatualizado apresentado como atual é promessa falsa.

**Cruzamento dos dois conceitos:** **humano, sempre.** O Curador vê a sinalização e decide. Comparar preço automaticamente produziria ordenação por custo — ranking, proibido pela ADR-041 item 4 — e transformaria viabilidade em compatibilidade assistencial, que é outra coisa: um profissional caro não é menos adequado, é menos acessível.

---

# Tamanho final (ETAPA 10)

| Eixo | Conceitos | Antes |
|---|---|---|
| Acesso ao cuidado | **4** | 4 |
| Continuidade do cuidado | **5** | 4 |
| Modelo de atendimento | **5** | 5 |
| Prática e trajetória | **12** | 13 |
| Viabilidade de acesso | **2** | — |
| **Total** | **28** | **26** |

**Movimentos:** 26 → 28 (+2 assistenciais, +2 de viabilidade, −2 por fusão, −1 por remoção, +1 formalização).

- **Adicionados (2):** `CONTINUIDADE_CANAIS`, `PRATICA_LIMITES_DE_ATUACAO`
- **Fundidos (2 pares → 2):** `CASOS_SEMELHANTES` + `CONDICAO_OU_PROCEDIMENTO` → `EXPERIENCIA_NO_TIPO_DE_CASO`; `PRODUCAO_ACADEMICA` + `ENSINO_E_PESQUISA` → `HISTORICO_ATIVIDADE_ACADEMICA`
- **Removido (1):** `HISTORICO_REGULARIDADE` — duplicava `registration_status`
- **Renomeado (1):** `ACESSO_LOCALIZACAO` → `ACESSO_LOCAL_DE_ATENDIMENTO` (o juízo de deslocamento passa ao lado da paciente)
- **Formalizado (1):** `HISTORICO_AREAS_DE_ATUACAO` — já existia como tabela, não como conceito do catálogo
- **Definições estreitadas (4):** `MODELO_COMUNICACAO`, `MODELO_DECISAO_COMPARTILHADA`, `MODELO_PREFERENCIAS_E_RESTRICOES`, `FORMACAO_COMPLEMENTAR`
- **Entram, por decisão de Método de 2026-07-31:** `VIABILIDADE_COBERTURA_E_CONVENIO` e `VIABILIDADE_CUSTO_E_PAGAMENTO` — fora da matriz do Motor, cruzamento sempre humano
- **Não entram, por decisão de Método de 2026-07-31:** idiomas, acessibilidade física, acessibilidade comunicacional

**Justificativa do tamanho:** cada conceito passou pelo teste "se for removido, a Curadoria perde capacidade relevante de compreender, cruzar ou explicar?". Os quatro novos passam porque representam perguntas que hoje não têm onde ser respondidas: *"se eu piorar na quinta à noite, com quem falo?"*, *"isto que eu tenho, ele trata?"*, *"minha cobertura vale aqui?"* e *"eu consigo pagar por isto?"*. A ausência de idiomas e acessibilidade não é lacuna deste catálogo — é decisão registrada, e a proposta não a trata como pendência.
