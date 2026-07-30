# ALIGNMENT PROFILE — O Perfil de Alinhamento

**Estado**: Proposto (Missão 1 do ACE, 2026-07-25). Subordinado a [`ACE_FOUNDATION.md`](ACE_FOUNDATION.md), [`ACE_PRINCIPLES.md`](ACE_PRINCIPLES.md), [`ACE_BOUNDARIES.md`](ACE_BOUNDARIES.md) e [`ACE_DATA_CLASSIFICATION.md`](ACE_DATA_CLASSIFICATION.md), que têm prioridade máxima.

**Nenhum código, banco, API, tela, algoritmo, score ou IA foi criado.**

---

## 0. Duas notas de partida

### 0.1 Sobre a palavra "ranking"

O enunciado da missão lista "Ranking" entre o que a Aliviar já possui. Registro a divergência, sem bloquear: o Segundo Princípio do ACE proíbe ranking, e `Ontologia §8` bane a palavra do vocabulário do domínio — há inclusive teste automatizado impedindo que ela apareça em tela de paciente.

Interpretei como **"organização da shortlist"**: o Método ordena para o Curador (`organizeForCurator` — ordena, nunca corta) e apresenta ao paciente **três caminhos legítimos sem ordem de preferência**. É isso que existe. Se a intenção era outra, é decisão sua — mas ela contradiria a Constituição do ACE.

### 0.2 O levantamento que mudou tudo

Antes de propor qualquer pergunta, levantei o que **já se pergunta hoje**:

**Paciente já conta** (wizard *Sua história*): para quem é · motivo · a história · informações importantes · online ou presencial.
**Paciente já pondera** (Perfil de Prioridades — 100 pontos com Evidência): Experiência · Área de atuação · Disponibilidade · Acompanhamento contínuo · Forma do primeiro encontro · Localização.
**Médico já declara** (cadastro): formação, CRM, resumo, instituição, nível de experiência, abordagem inicial (4 formatos), oferece acompanhamento contínuo (sim/não), janela de agenda, domínios de competência.

Isso é muito. **A maior parte das perguntas "óbvias" já foi feita** — e por isso a maior parte das candidatas morreu no filtro (§6). O que sobrou é estreito de propósito.

---

## 1. Perguntas finais do PACIENTE — 5

Todas **opcionais**, todas com "prefiro não responder", todas classificadas como **P — Preferência declarada** com a fala preservada.

### PA1 — "Quando a Curadoria ficar pronta, o que ajuda mais você a decidir?"
*Ler com calma, sozinho · Conversar com alguém explicando · Os dois*

| Filtro | Resposta |
|---|---|
| Por que existe | A entrega é o momento de maior ansiedade da jornada, e hoje o Curador descobre o formato certo **durante** a conversa — tarde demais para preparar |
| Decisão que melhora | Como conduzir a fase **Apresentar**: mandar antes para ler, ou reservar tempo de conversa |
| Obtível de outra forma? | Não. Emerge na hora, por sorte |
| Obrigatória? | Opcional (sem resposta = oferecer os dois) |
| Permanente ou por caso? | **Por caso** — uma decisão grave pede mais conversa que uma simples |
| Pode gerar viés? | Baixo. Risco: virar rótulo ("não lê"). Mitigado por P10 — fala preservada, nunca adjetivo |
| Vale o tempo? | ~15s para melhorar a etapa mais delicada. **Sim** |

### PA2 — "Nas decisões sobre seu tratamento, você prefere que o médico recomende o caminho, ou prefere decidir junto com ele?"
*Prefiro que ele recomende · Prefiro decidir junto · Depende do caso*

| Filtro | Resposta |
|---|---|
| Por que existe | É **o núcleo do alinhamento** que o ACE promete: forma de decidir × forma de conduzir. Nada no Método captura isso |
| Decisão que melhora | Quais características destacar em cada um dos três caminhos, e o que conversar antes |
| Obtível de outra forma? | Não |
| Obrigatória? | Opcional |
| Permanente ou por caso? | **Por caso** |
| Pode gerar viés? | **Médio.** Risco real: virar "paciente passivo". Mitigação: é **preferência declarada sobre processo**, nunca traço inferido (`ACE_BOUNDARIES.md` §1.3); fala preservada; escopo de Case (P11) |
| Vale o tempo? | ~15s. **Sim** — sem ela, o ACE não tem o que alinhar |

### PA3 — "Há algo de um atendimento anterior que você não quer que se repita?"
*Texto curto, opcional*

| Filtro | Resposta |
|---|---|
| Por que existe | O Método pergunta o **problema** (motivo, história); nunca a **experiência de cuidado**. É o insumo mais fértil de ponto de atenção |
| Decisão que melhora | O que garantir ao escolher e o que dizer antes da decisão ("você mencionou que se sentiu apressada; este profissional declara reservar…") |
| Obtível de outra forma? | Às vezes emerge na Consulta Inicial — por sorte, não por método |
| Obrigatória? | **Opcional** — muita gente não terá o que dizer, e isso é normal |
| Permanente ou por caso? | Por caso |
| Pode gerar viés? | **Médio-alto se mal formulada.** Se citar nome de profissional, vira reputação informal — proibida (§1.4). **Mitigação obrigatória**: a pergunta é sobre *o que aconteceu*, não sobre *quem*; nome citado fica na fala do paciente e **nunca vira dado sobre aquele profissional** |
| Vale o tempo? | ~30s. **Sim** — é a que mais gera ponto de atenção acionável |

### PA4 — "Alguém mais participa dessa decisão com você?"
*Só eu · Alguém da família · Um responsável legal · Prefiro não dizer*

| Filtro | Resposta |
|---|---|
| Por que existe | Se a decisão é compartilhada, apresentar só ao paciente falha — e o Curador costuma descobrir quando tudo já está pronto |
| Decisão que melhora | Quem convidar para a apresentação; o ritmo de entrega |
| Obtível de outra forma? | Parcialmente ("para quem é" já existe, mas responde outra coisa: quem é o paciente, não quem decide) |
| Obrigatória? | Opcional |
| Permanente ou por caso? | Por caso |
| Pode gerar viés? | **Médio — exige cuidado.** Pode tangenciar estado civil/composição familiar (atributo protegido). **Mitigações**: opções não capturam vínculo específico; "prefiro não dizer" sempre presente; **jamais filtra ou ordena profissionais** — serve só à condução da apresentação |
| Vale o tempo? | ~10s. **Sim** |

### PA5 — "Tem alguma questão prática que pode dificultar você ir às consultas?"
*Horário de trabalho · Deslocamento · Cuidar de outra pessoa · Nenhuma · Prefiro não dizer*

| Filtro | Resposta |
|---|---|
| Por que existe | O Método tem **peso** de Localização e modalidade, mas não a **barreira concreta**. Peso alto em localização não diz *por quê* |
| Decisão que melhora | Viabilidade real — evita entregar três caminhos impossíveis de cumprir |
| Obtível de outra forma? | Não com essa concretude |
| Obrigatória? | Opcional |
| Permanente ou por caso? | Por caso |
| Pode gerar viés? | **Médio.** Pode revelar deficiência ou condição socioeconômica (protegidos). **Mitigações**: opções sobre **logística da consulta**, nunca sobre a pessoa; sem campo de detalhamento de saúde; **nunca filtra profissional** — informa horário e modalidade a conversar |
| Vale o tempo? | ~15s. **Sim** — evita retrabalho e frustração |

**Tempo total estimado: ~85 segundos.** Dentro da meta de 2 minutos.

---

## 2. Perguntas finais do MÉDICO — 5

Todas sobre **forma de conduzir**, nunca qualidade, competência ou reputação. Todas **F — Fato declarado**, com data e direito de correção pelo próprio médico (P8).

### ME1 — "Quando você explica um diagnóstico ou um plano, como costuma fazer?"
*Converso e respondo dúvidas · Também entrego por escrito · Mostro exames e desenho · Varia conforme a pessoa*

Por que existe: encontra diretamente **PA1**. O cadastro tem *abordagem inicial* (formato do encontro), nunca *como a explicação acontece*. · Melhora: qual caminho conversar primeiro com quem pediu material escrito · Não obtível de outra forma · Opcional · Estável (revisável) · Viés baixo — é forma, não qualidade · ~20s. **Sim**

### ME2 — "Como funciona o acompanhamento entre as consultas?"
*Canal e prazo típico declarados por ele*

Por que existe: o cadastro tem `offersContinuousCare` **sim/não** — o paciente que pesou Continuidade não sabe o que isso significa na prática · Melhora: o que prometer sem inventar; ponto de atenção quando a expectativa não cabe · Não obtível de outra forma · Opcional · Estável · Viés baixo — **atenção**: nunca comparar "quem responde mais rápido" (viraria ranking) · ~25s. **Sim**

### ME3 — "Que tipos de caso você prefere encaminhar a outro profissional?"

Por que existe: **protege o médico e o paciente**. Declarar limite é responsabilidade profissional, não fraqueza · Melhora: evita encaminhamento errado antes de ele acontecer · Não obtível de outra forma · Opcional · Estável · Viés: **nenhum se lido como escopo**; **proibido** transformar em sinal de menor competência (`ACE_BOUNDARIES.md` §1.7) — quem declara limite não é penalizado, e isso precisa estar em teste · ~25s. **Sim**

### ME4 — "Quando a família participa da decisão, como você costuma conduzir?"
*Recebo todos juntos · Prefiro conversar primeiro com o paciente · Varia*

Por que existe: encontra **PA4** · Melhora: quem convidar para a consulta inicial · Não obtível de outra forma · Opcional · Estável · Viés baixo · ~15s. **Sim** — mas é a **primeira candidata a cair** se o teste real estourar os 2 minutos (é a de menor alcance)

### ME5 — "Há algo sobre seu jeito de atender que você gostaria que o paciente soubesse antes da primeira consulta?"
*Texto curto, livre*

Por que existe: é o espaço de **autodeterminação** — onde o profissional diz o que nenhum campo captura, com as palavras dele · Melhora: dá ao Curador material humano para apresentar a pessoa, não o currículo · Não obtível de outra forma · Opcional · Estável · Viés baixo; **guard necessário**: se virar espaço de marketing ("melhor da região"), é editado pelo Curador ou devolvido — §1.5 · ~30s. **Sim**

**Tempo total estimado: ~115 segundos.** No limite da meta.

---

## 3. Observações do CURADOR — 5

O Curador **não responde questionário**. Ele registra observações — **I — Interpretação**, com autor, data e escopo de Case. Todas obedecem: pertencem ao Case, nunca migram para a pessoa (P11), nunca rotulam (P10).

| # | Observação | Forma obrigatória | Para que serve |
|---|---|---|---|
| **CU1** | **O que percebeu na conversa** | "Nesta Consulta Inicial, [paciente] pediu para revisar duas vezes o plano." | Contexto de condução para as fases seguintes |
| **CU2** | **O que já foi explicado, e a reação** | "Expliquei em [data] a diferença entre os caminhos; ela respondeu que…" | Evita repetição e perda de contexto entre etapas |
| **CU3** | **O que precisa ser abordado antes da decisão** | "Antes de decidir, é preciso conversar sobre a distância do consultório." | Vira pauta da apresentação |
| **CU4** | **Discordância de uma observação do sistema** | "Discordo do ponto de atenção sobre agenda: ela disse que consegue às sextas." | **O sinal de saúde do ACE** (P8, risco R2) — zero discordância é alarme |
| **CU5** | **Ressalva sobre uma opção** | "Este caminho pode não servir porque [fato declarado]; vale confirmar com o profissional." | Ponto de atenção humano, com o fato à vista |

**A regra que impede virar sentença**, aplicada às cinco:

✅ "O paciente demonstrou insegurança **nesta Consulta Inicial**." — situação, datada, deste Case
❌ "Paciente inseguro." — essência, permanente, rótulo

Nenhuma observação é sobre o médico **como pessoa** — apenas sobre a interação, o caso ou o encaixe.

**Tempo estimado: ~45 segundos** por Case (registro seletivo, não obrigatório). Dentro da meta de 1 minuto.

---

## 4. Análise de sobreposição

Comparei cada pergunta contra o Método existente e contra as outras duas frentes.

### Sobreposições com o que já existe → eliminadas (§6)
Modalidade, localização, urgência, tempo de experiência, área de atuação, formato do primeiro encontro, "oferece acompanhamento" — **todas já existem** no wizard ou no Perfil de Prioridades. Nenhuma foi repetida.

### Sobreposições internas → resolvidas por pareamento
As perguntas do médico **não duplicam** as do paciente: elas são a **outra ponta** do mesmo encontro. É exatamente o que a regra "toda observação mostra as duas pontas" (`ACE_DATA_CLASSIFICATION.md` §3.2) exige.

| Paciente | ↔ | Médico | O que o par produz |
|---|---|---|---|
| PA1 — como decide melhor | ↔ | ME1 — como explica | alinhamento ou atenção sobre **comunicação** |
| PA2 — recomendação × decisão conjunta | ↔ | ME1 + ME5 | alinhamento sobre **condução da decisão** |
| PA3 — o que não repetir | ↔ | ME2 + ME5 | **ponto de atenção** acionável |
| PA4 — quem participa | ↔ | ME4 — família na decisão | logística e clima da apresentação |
| PA5 — barreira prática | ↔ | (cadastro: agenda, modalidade) | **viabilidade**, não afinidade |
| — | | ME3 — o que encaminha | evita encaminhamento errado |

**Nenhuma pergunta do Curador repete pergunta de ninguém**: ele registra o que só um humano na conversa percebe.

### Sobreposição real encontrada e resolvida
"Qual seu ritmo para decidir?" × **Disponibilidade** (peso já existente): informação praticamente equivalente na prática — quem pesa alto "ser atendido logo" já sinalizou pressa. **Eliminada** (§6).

---

## 5. Matriz de utilidade

| Pergunta | Quem responde | Quem vê | Como ajuda a Curadoria | Viés? | Vale o esforço? | **Decisão** |
|---|---|---|---|---|---|---|
| PA1 formato de decisão | Paciente | Curador, Concierge | Prepara a entrega | Baixo | ~15s | ✅ **Manter** |
| PA2 recomendar × decidir junto | Paciente | Curador | Núcleo do alinhamento | Médio (mitigado) | ~15s | ✅ **Manter** |
| PA3 o que não repetir | Paciente | Curador | Gera ponto de atenção | Médio-alto (mitigado) | ~30s | ✅ **Manter** |
| PA4 quem participa | Paciente | Curador, Concierge | Conduz a apresentação | Médio (mitigado) | ~10s | ✅ **Manter** |
| PA5 barreira prática | Paciente | Curador, Concierge | Viabilidade real | Médio (mitigado) | ~15s | ✅ **Manter** |
| ME1 como explica | Médico | Curador | Par de PA1/PA2 | Baixo | ~20s | ✅ **Manter** |
| ME2 acompanhamento na prática | Médico | Curador | Par de PA3 + Continuidade | Baixo | ~25s | ✅ **Manter** |
| ME3 o que encaminha | Médico | Curador | Evita erro de encaminhamento | Baixo | ~25s | ✅ **Manter** |
| ME4 família na decisão | Médico | Curador | Par de PA4 | Baixo | ~15s | ✅ **Manter** (1ª a cair se estourar tempo) |
| ME5 o que gostaria que soubessem | Médico | Curador, Paciente* | Humaniza a apresentação | Baixo (guard anti-marketing) | ~30s | ✅ **Manter** |
| CU1–CU5 observações | Curador | Curador, Concierge | Contexto e discordância | Médio (mitigado por P10/P11) | ~45s | ✅ **Manter** |

\* ME5 é a única resposta do médico que pode chegar ao paciente — porque foi escrita por ele para isso.

---

## 6. Perguntas eliminadas e por quê

| Candidata | Motivo da eliminação |
|---|---|
| "Online ou presencial?" | **Já existe** no wizard (`preferenciaModalidade`) |
| "Qual sua urgência?" | **Já existe** como peso de Disponibilidade |
| "Que região prefere?" | **Já existe** como Localização com alvo declarado |
| "Como prefere o primeiro encontro?" | **Já existe** — peso + alvo de Abordagem Inicial, pareado com `intakeApproach` do médico |
| "O que mais te preocupa?" | **Já existe** — motivo + informações importantes |
| "Qual seu ritmo para decidir?" | **Sobreposição** substancial com Disponibilidade (§4) |
| "Qual seu nível de conhecimento sobre a condição?" | Cria hierarquia entre pacientes e convida a tratar alguém como leigo. **Viés > utilidade** |
| Teste/tipologia de perfil de decisão | **Proibido** — `ACE_BOUNDARIES.md` §1.3 (inferência psicológica) |
| "Como você lida com más notícias?" | Terreno psicológico e potencialmente traumático. **Proibido** |
| "Prefere médico homem ou mulher?" | **Atributo protegido** (§1.1). Se o paciente declarar espontaneamente, é fala tratada pelo Curador — nunca pergunta do sistema |
| "Faixa de renda / valor que pode pagar" | Viabilidade financeira é etapa própria; como critério de afinidade é **proxy socioeconômico** (§1.2) |
| (médico) "Com que tipo de paciente você trabalha melhor?" | Produziria **perfil de paciente ideal** → seleção adversa e discriminação |
| (médico) "Como avalia sua própria didática?" | **Autoavaliação de qualidade** — proibido medir competência |
| (médico) "Quantos pacientes atende por mês?" | Vira métrica de volume comparável = **ranking pela porta dos fundos** |
| (médico) "Qual sua taxa de sucesso?" | **Proibido** — §1.7, penaliza quem aceita casos graves |
| (Curador) "Nota de encaixe de 1 a 5" | **Proibido** — Segundo Princípio |
| (Curador) "Perfil do paciente" | **Proibido** — P10, rótulo permanente |

**17 candidatas eliminadas para 15 mantidas.** O filtro fez mais do que aprovou — como deveria.

---

## 7. Recomendações para a implementação

1. **Resolver a sigla ACE antes de tudo** (`ACE_FOUNDATION.md` §0.1) — a dívida de nome só encarece.
2. **Nada é obrigatório.** Perfil de Alinhamento vazio é um Case perfeitamente válido; a Curadoria não depende dele (P16).
3. **Fala preservada sempre** — o padrão da Evidência de Curadoria, que já funciona, estendido a todas as respostas.
4. **Perguntar no momento certo**: PA1–PA5 na Consulta Inicial (conversa), **não** no wizard público — o wizard é o primeiro contato, e essas perguntas pedem confiança já estabelecida.
5. **Guards automatizados desde o primeiro commit**: adjetivo-sobre-pessoa, score/nota/ranking, nome de profissional vindo de PA3 como dado sobre ele — tudo quebrando a suíte.
6. **Medir tempo real com gente real** e cortar sem dó: ME4 é a primeira candidata; a meta de 2 minutos vale mais que a completude.
7. **Instrumentar a discordância (CU4)** desde o dia um — é o principal indicador de que o Curador continua pensando (risco R2).
8. **Revisar em 90 dias com dados de uso**: pergunta cuja resposta nunca gerou observação útil deve ser **removida**, não melhorada.

---

## Critério de sucesso

> *"Se pudermos perguntar apenas cinco coisas para cada pessoa, quais realmente mudam a qualidade da Curadoria?"*

**Do paciente**: como ele decide melhor · se quer recomendação ou decisão conjunta · o que não quer repetir · quem decide com ele · o que atrapalha na prática.

**Do médico**: como explica · como acompanha · o que encaminha · como conduz com família · o que gostaria que soubessem antes.

**Do Curador**: o que percebeu · o que já explicou · o que falta abordar · onde discorda do sistema · que ressalva faz a uma opção.

Nenhuma delas pergunta o que já foi perguntado. Nenhuma delas mede pessoa. Todas cabem no tempo.
