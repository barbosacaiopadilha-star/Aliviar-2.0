# Catálogo Canônico — Matriz, Perguntas, Relatório, Governança e Decisão

> Complemento de [`CATALOGO_CANONICO_PROPOSTA.md`](./CATALOGO_CANONICO_PROPOSTA.md). Mesma data, mesmo status: proposta de Método, não aprovada.

---

# DOCUMENTO 4 — Matriz paciente × profissional

**Sem score. Sem soma. Sem porcentagem. Sem ordenação.** A coluna "Leitura possível" descreve o que se pode *dizer*, nunca o que se pode *calcular*.

## 4.1 Conceitos de cruzamento automático

| Conceito | Opção da paciente | Opção do profissional | Leitura possível | Autom./Humana | Justificativa |
|---|---|---|---|---|---|
| `ACESSO_MODALIDADE` | `PRECISO_REMOTO` | `REMOTO` ou `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` | correspondência encontrada | **automática** | duas declarações fechadas sobre o mesmo fato |
| `ACESSO_MODALIDADE` | `PRECISO_REMOTO` | `PRESENCIAL` | **condição relevante** — a prática conhecida não contempla o formato necessário | **automática** | fato objetivo; a leitura descreve a necessidade, não o médico |
| `ACESSO_MODALIDADE` | `PRECISO_REMOTO` | `PRIMEIRA_REMOTA_CONDICIONADA` | correspondência **sob condição declarada** | **automática**, com condição exibida | a condição é estruturada, logo verbalizável |
| `ACESSO_DISPONIBILIDADE` | `NOITE_APOS_18H` | `MANHA` + `TARDE` | condição relevante — janelas não se encontram | **automática** | interseção de conjuntos fechados |
| `ACESSO_PRAZO_PARA_CONSULTA` | `ATE_7_DIAS` | `DE_16_A_30_DIAS` | condição relevante — prazo habitual maior que o necessário | **automática** | comparação de faixas ordenadas |
| `ACESSO_MODALIDADE` | `PRECISO_REMOTO` (essencial, sem flexibilidade) | `PRESENCIAL` apenas | **impossibilidade objetiva de acesso** | **automática para sinalizar; humana para concluir** | ver §4.3 |
| `CONTINUIDADE_CANAIS` | precisa de canal (essencial) | `NAO_HA_CANAL_ENTRE_CONSULTAS` | condição relevante | **automática** | declaração contra declaração |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | `PSICOLOGIA` (essencial) | `NAO_SEI_INFORMAR` | **lacuna a confirmar antes da entrega** | **automática** | ausência de informação nunca vira ausência da característica (P12) |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | `NUTRICAO` + `PSICOLOGIA` | `ENFERMAGEM` apenas | correspondência parcial — um tipo, não os outros | **automática por tipo, nunca por contagem** | contar tipos violaria P18 |
| `MODELO_COMUNICACAO` | `VERIFICA_SE_COMPREENDI` | conduta presente | correspondência por conduta | **automática** | conduta observável, lista fechada |
| `MODELO_PARTICIPACAO_FAMILIAR` | `PREFIRO_SOZINHA` | `ACOMPANHANTE_MEDIANTE_AUTORIZACAO` | **correspondência** | **automática, com regra escrita** | abertura ≠ inclusão obrigatória |
| `MODELO_ALTERNATIVAS` | `O_QUE_ACONTECE_SE_NADA_FOR_FEITO` | conduta presente | correspondência por conduta | **automática** | idem |

## 4.2 Conceitos que exigem decisão humana

| Conceito | Por que não pode ser automático |
|---|---|
| `MODELO_DECISAO_COMPARTILHADA` | `DECIDE_E_COMUNICA` **corresponde** a quem prefere que o médico decida e **colide** com quem quer participar. A mesma opção do profissional muda de sentido conforme a pessoa — automatizar produziria o erro mais grave do catálogo |
| `MODELO_PREFERENCIAS_E_RESTRICOES` | o lado da paciente é texto guiado. Texto livre nunca entra no Motor (P10) |
| `CONTINUIDADE_POS_PROCEDIMENTO` | depende de haver procedimento previsto — juízo clínico |
| `ACESSO_LOCAL_DE_ATENDIMENTO` (deslocamento) | cidade e UF cruzam sozinhas; "duas horas de trajeto" depende de transporte, estado clínico e acompanhante |
| **Todo o eixo Prática e Trajetória** (12) | `dossie.ts` já decidiu: *"uma residência em ortopedia é excelente para um caso e irrelevante para outro"* |
| `VIABILIDADE_COBERTURA_E_CONVENIO` e `VIABILIDADE_CUSTO_E_PAGAMENTO` | comparação automática de custo produz ordenação por preço = ranking (ADR-041 item 4); reembolso depende do contrato dela com a operadora; custos adicionais dependem da conduta ainda não definida. O sistema **sinaliza** barreira objetiva e pendência; quem conclui é o Curador |

**Sinalizações estruturadas de viabilidade (fora da matriz do Motor):**

| Situação | Sinalização ao Curador |
|---|---|
| Operadora da paciente consta na lista do profissional | correspondência de cobertura |
| Paciente precisa do convênio × profissional exclusivamente particular, ou operadora fora da lista | **barreira objetiva de viabilidade** — sinalizada, nunca eliminatória |
| Faixa de custo acima do limite que ela reconheceu como viável | **barreira objetiva** — frase canônica: *"O valor informado está acima do limite que a paciente reconheceu como viável."* |
| Precisa de parcelamento × sem parcelamento | condição relevante |
| Precisa saber o valor antes × valor não informado ou sujeito a confirmação | **pendência de confirmação antes da entrega** |
| Cobertura sujeita a confirmação administrativa | correspondência sob condição |
| `PREFIRO_NAO_INFORMAR` da paciente | nenhuma sinalização — silêncio não é ausência de restrição |

## 4.3 Lacuna registrada — o Motor não comporta esta granularidade

**Não altero o Motor.** As 15 células permanecem intactas. Mas o catálogo produz duas leituras que a matriz vigente não sabe representar:

**Lacuna 1 — impossibilidade objetiva de acesso.** Quando a paciente declara uma necessidade **essencial e sem flexibilidade** e a prática registrada não a contempla — precisa de remoto e o profissional só atende presencialmente; precisa de canal entre consultas e não há canal; as janelas de horário não se cruzam e ela não pode faltar ao trabalho —, isso não é "média compatibilidade". É barreira concreta: a pessoa não consegue ser atendida. Hoje o Motor devolveria `MEDIA_COMPATIBILIDADE` pelo Princípio 2, que é semanticamente errado e perigosamente tranquilizador.

*(Esta lacuna foi identificada originalmente a partir de idiomas e acessibilidade. Com a decisão de Método que os deixou fora, ela **permanece válida** — a modalidade, a disponibilidade e os canais a sustentam sozinhos. O achado não dependia daqueles conceitos.)*

**Lacuna 2 — condição estruturada.** `PRIMEIRA_REMOTA_CONDICIONADA` é correspondência *sob condição*. O Motor tem quatro resultados e nenhum carrega condição.

**Como o Curador usa isso sem automação, enquanto o Motor não muda:**

1. A Mesa exibe as duas leituras como **sinalização de origem estruturada**, fora do resultado do Motor — do mesmo modo que hoje exibe divergências e lacunas sem que elas sejam resultado de cruzamento.
2. A conclusão continua sendo **declaração do Curador** em `criterion_declarations`, com evidência obrigatória — inclusive `NAO_ATENDE`, que já existe e já é humano.
3. Nenhuma dessas sinalizações elimina profissional, ordena lista ou entra em contagem.

**Quando reabrir o Motor:** se a operação real mostrar que a sinalização fora da matriz é ignorada ou mal compreendida, aí sim uma ADR pode avaliar um quinto resultado. Não antes — a ADR-041 já previu esse gatilho: *"Revisitar quando… a experiência real mostrar que quatro estados são poucos ou demais."*

---

# DOCUMENTO 5 — Mapa de perguntas: quem responde o quê

O Método vigente **não tem formulário autônomo da paciente**. O Curador traduz a história dela no Mapa de Prioridades, e ela **reconhece** o Perfil — ato dela, irreversível, auditado. O catálogo preserva isso.

| Origem da resposta da paciente | Conceitos | Justificativa |
|---|---|---|
| **Dita diretamente** | `ACESSO_MODALIDADE`, `ACESSO_DISPONIBILIDADE`, `MODELO_PARTICIPACAO_FAMILIAR`, `VIABILIDADE_COBERTURA_E_CONVENIO`, `VIABILIDADE_CUSTO_E_PAGAMENTO` | são fatos da vida dela que ela conhece melhor que ninguém; perguntar é mais respeitoso que inferir — e situação financeira **jamais** é inferida (`PREFIRO_NAO_INFORMAR` é resposta válida) |
| **Reconhecida após tradução do Curador** | `ACESSO_LOCAL_DE_ATENDIMENTO`, `ACESSO_PRAZO_PARA_CONSULTA`, `CONTINUIDADE_RETORNOS`, `CONTINUIDADE_CANAIS`, `CONTINUIDADE_COORDENACAO`, `MODELO_COMUNICACAO`, `MODELO_DECISAO_COMPARTILHADA`, `MODELO_ALTERNATIVAS`, `MODELO_PREFERENCIAS_E_RESTRICOES` | exigem entender o quadro clínico para saber o que a história dela implica |
| **Declarada exclusivamente pelo Curador** | `CONTINUIDADE_POS_PROCEDIMENTO`, `CONTINUIDADE_EQUIPE_DE_APOIO` | dependem de projeção clínica que ela não tem como fazer antes do diagnóstico |
| **Inaplicável ao lado da paciente** | os 12 conceitos de Prática e Trajetória | P17 — ninguém declara preferência por fellowship |

**Regra de redação das perguntas ao profissional (ETAPA 6):** situação concreta, nunca autoavaliação.

| Proibido | Obrigatório |
|---|---|
| "Você pratica decisão compartilhada?" | "Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?" |
| "Sua comunicação é clara?" | "Ao explicar um diagnóstico, quais dessas ações você costuma realizar?" |
| "Você oferece cuidado humanizado?" | *(pergunta inexistente — não é conceito)* |

Toda pergunta ao profissional precisa distinguir seis situações: **prática habitual** (opção marcada) · **condição** (opção + condição estruturada) · **exceção** (complemento livre) · **ausência** (`NAO_REALIZA` explícito) · **desconhecimento** (`NAO_SEI_INFORMAR`) · **inaplicabilidade** (`NAO_SE_APLICA`). Formulário que não separa as seis produz `CONFIRMADO` falso.

---

# DOCUMENTO 6 — Gramática do Relatório

O Relatório vigente é determinístico e rastreável: *"frase que não consegue dizer de onde veio não é gerada"*. A gramática abaixo estende essa regra ao catálogo.

## 6.1 Frases automáticas — permitidas

Só quando **todos** os termos vêm de opção estruturada selecionada. A frase é **verbalização**, nunca inferência.

| Situação | Forma da frase |
|---|---|
| Correspondência | *"Você procura atendimento remoto. A prática registrada deste profissional inclui atendimento remoto."* |
| Correspondência sob condição | *"A primeira consulta pode ocorrer remotamente após análise prévia da documentação, conforme as características do caso."* |
| Correspondência parcial | *"Você procura acompanhamento com nutrição e psicologia. A equipe registrada inclui enfermagem."* |
| Lacuna | *"Ainda não foi possível confirmar se este profissional oferece equipe de apoio."* |
| Condição relevante | *"Você precisa de atendimento após as 18h. As janelas registradas são manhã e tarde."* |
| Informação desatualizada | *"Esta informação foi verificada em [data] e pode ter mudado."* |

## 6.2 Frases que exigem validação do Curador

Correspondência sob condição clínica; qualquer frase sobre os 12 conceitos técnicos; qualquer frase sobre `MODELO_DECISAO_COMPARTILHADA`; qualquer frase sobre viabilidade financeira.

## 6.3 Frases que exigem evidência textual

Toda afirmação sobre prática assistencial só é gerada se houver evidência registrada com fonte, data e responsável. Sem evidência, o Relatório diz o estado — nunca descreve a prática.

## 6.3b Frases de viabilidade

**Permitidas (verbalização de opções estruturadas):**
- *"O atendimento é por convênio [operadora], conforme registrado em [data]."*
- *"O valor informado da primeira consulta está na faixa de [faixa], sujeito a confirmação."*
- *"O valor informado está acima do limite que a paciente reconheceu como viável."*
- *"Ainda não foi possível confirmar o valor da consulta — confirmar antes da entrega."*

**Proibidas, além das gerais:**
- *"Este é o profissional mais acessível/mais barato"* — comparação de preço entre profissionais
- *"Ótimo custo-benefício"* — juízo sobre preço
- *"A paciente não teria condições de..."* — inferência de capacidade financeira; só a declaração dela existe
- Qualquer frase de custo dirigida à paciente sem validação do Curador — viabilidade é conversa, não veredito

## 6.4 Frases proibidas — nunca geradas, em nenhuma condição

| Proibido | Por quê |
|---|---|
| *"Este profissional é bom/excelente/atencioso"* | adjetivo de qualidade sobre pessoa — ADR-040 item 2 |
| *"Este profissional atende ao seu perfil"* | o objeto é a necessidade, nunca o médico |
| *"Este é o mais compatível"* | ordenação — ADR-041 item 4 |
| *"85% de compatibilidade"* | score — ADR-041 item 1 |
| *"Não atende"* gerada automaticamente | julgamento é do Curador |
| *"Ele não oferece X"* a partir de `NAO_INFORMADO` | ausência de informação ≠ ausência da característica (P12) |
| *"Tem ampla experiência"* a partir de volume | volume não é mérito |
| Qualquer frase que some, conte ou compare quantidade de opções | P18 |

**Regra contra interpretação acrescentada:** cada frase automática declara os identificadores canônicos que a originaram. Se um termo da frase não puder ser rastreado a uma opção selecionada, a frase não é gerada. Isso torna a proibição verificável por teste, não por revisão humana.

---

# DOCUMENTO 7 — Governança

## 7.1 Fonte única de verdade

O catálogo vive em `curadoria.method_subcriteria`. **Nenhum módulo mantém lista própria.** A ADR-039 item 1 já estabeleceu o princípio ao recusar um vocabulário paralelo; esta proposta o mantém.

**Violação ativa, registrada e não resolvida nesta fase.** As tags de `cruzamento.ts:175` citam "idiomas" e "acessibilidade", e `fontes.ts` mantém `IDIOMAS` e `ACESSIBILIDADE` entre os `INFORMATION_KINDS`, com fonte mínima definida. Com a decisão de Método de 2026-07-31, esses termos passam a apontar para conceitos que o catálogo **deliberadamente não tem** — deixaram de ser sinal de lacuna e passaram a ser referência órfã. As duas listas precisam derivar do catálogo ou deixar de citar o que ele não representa. **Correção em missão própria; não é matéria desta consolidação.**

## 7.2 Adicionar conceito

Exige, cumulativamente: (a) necessidade real observada em Case, não hipótese; (b) reprovação no teste de consolidação — não cabe em conceito existente; (c) opções observáveis, nunca adjetivos; (d) definição de fonte mínima e volatilidade; (e) decisão sobre participar ou não do Motor; (f) **ADR própria**. Catálogo é somente leitura pela aplicação (ADR-039 item 6): toda mudança é migration.

## 7.3 Remover conceito

Exige: zero uso em Cases dos últimos 12 meses **ou** duplicação demonstrada; preservação dos dados históricos (nunca apagar registros); marcação como `active = false`, jamais exclusão física; ADR registrando o motivo. **Case aberto nunca perde conceito no meio do caminho** — a desativação vale para Cases novos.

## 7.4 Alterar opções

Acrescentar opção é aditivo e não invalida respostas antigas. **Remover ou renomear opção exige versionamento**: a resposta antiga continua legível com o rótulo da época. Uma opção nunca muda de significado — se o significado mudar, é opção nova.

## 7.5 Versionamento

O catálogo tem versão; cada resposta guarda a versão vigente na coleta. O Relatório sabe dizer *"conforme o catálogo vigente em [data]"*. Isso é o que permite reler um Case de dois anos atrás sem reinterpretá-lo.

## 7.6 Impactos de qualquer mudança

| Onde | O que verificar |
|---|---|
| Motor | mudou o conjunto de estados ou importâncias? Se sim, **ADR sobre a ADR-041** |
| Relatório | há frase para cada situação nova? Frase sem gramática não é gerada |
| Base de Evidências | evidências do conceito antigo continuam legíveis? |
| Cases abertos | nenhum Case perde ou ganha conceito no meio |
| Reconhecimento do Perfil | Perfil já reconhecido é irreversível — mudança de catálogo não o reabre |

## 7.7 Conceitos experimentais

Permitidos com três condições: marcados como experimentais no catálogo; **fora do Motor**; invisíveis à paciente. Servem para observar antes de decidir. Expiram em 12 meses — vira conceito pleno por ADR, ou sai.

---

# DOCUMENTO 8 — Decisões obrigatórias (ETAPA 12)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Os 26 devem permanecer? | **Não integralmente.** 22 permanecem, 4 mudam de forma |
| 2 | Quais mantidos? | 22 — todos exceto os quatro abaixo |
| 3 | Quais fundidos? | `CASOS_SEMELHANTES` + `CONDICAO_OU_PROCEDIMENTO` → `EXPERIENCIA_NO_TIPO_DE_CASO`; `PRODUCAO_ACADEMICA` + `ENSINO_E_PESQUISA` → `HISTORICO_ATIVIDADE_ACADEMICA` |
| 4 | Quais renomeados? | `ACESSO_LOCALIZACAO` → `ACESSO_LOCAL_DE_ATENDIMENTO`. E quatro definições estreitadas sem trocar código |
| 5 | Quais removidos? | `HISTORICO_REGULARIDADE` — duplica `registration_status` |
| 6 | Novos indispensáveis? | **2**: `CONTINUIDADE_CANAIS`, `PRATICA_LIMITES_DE_ATUACAO` |
| 7 | Idiomas entra? | **Não** — decisão de Método de 2026-07-31. Não é tratado como lacuna nesta fase |
| 8 | Acessibilidade entra? | **Não.** Física: fora desta reformulação. Comunicacional: não existe como conceito independente — clareza e adaptação da comunicação são absorvidas por `MODELO_COMUNICACAO` |
| 9 | Custo e convênio? | **Entram — decisão de Método 2026-07-31.** `VIABILIDADE_COBERTURA_E_CONVENIO` e `VIABILIDADE_CUSTO_E_PAGAMENTO`, eixo Viabilidade de Acesso, fora da matriz do Motor, cruzamento sempre humano |
| 10 | Totalmente estruturáveis? | Todo o eixo ACESSO, todo CONTINUIDADE, e `MODELO_COMUNICACAO`/`ALTERNATIVAS`/`PARTICIPACAO_FAMILIAR` |
| 11 | Exigem complemento livre? | `MODELO_PREFERENCIAS_E_RESTRICOES` (lado da paciente), condições de "depende", e toda evidência |
| 12 | Não participam do Motor? | Os 12 de Prática e Trajetória, `MODELO_PREFERENCIAS_E_RESTRICOES`, `VIABILIDADE_COBERTURA_E_CONVENIO` e `VIABILIDADE_CUSTO_E_PAGAMENTO` |
| 13 | Exigem julgamento humano por Case? | Os mesmos 15, mais `MODELO_DECISAO_COMPARTILHADA` e o deslocamento de `ACESSO_LOCAL_DE_ATENDIMENTO` |
| 14 | Tamanho final? | **28 conceitos canônicos** — 4 + 5 + 5 + 12 + 2 |

---

# DOCUMENTO 8B — Congelamento

> **O Catálogo Canônico da Curadoria está congelado na versão inicial com 28 conceitos** (`catalogo/1.0.0`): 4 em Acesso ao cuidado, 5 em Continuidade do cuidado, 5 em Modelo de atendimento, 12 em Prática e trajetória, 2 em Viabilidade de acesso.
>
> Data do congelamento: 2026-07-31. Decisões que o compõem: exclusão de idiomas e acessibilidade (não são lacuna nesta fase), absorção de clareza/adaptação/verificação por `MODELO_COMUNICACAO`, inclusão de `CONTINUIDADE_CANAIS` e `PRATICA_LIMITES_DE_ATUACAO`, inclusão do eixo Viabilidade de Acesso fora da matriz do Motor.

**Toda mudança futura exige, cumulativamente:** justificativa de Método (nunca conveniência de implementação) · análise de impacto sobre Motor, Relatório, Base de Evidências e Cases abertos · versionamento (respostas antigas permanecem legíveis na versão em que foram coletadas) · **ADR quando alterar o domínio** · plano de compatibilidade com respostas existentes.

**O catálogo é a única fonte de verdade** para: perguntas estruturadas, opções, evidências, correspondências, frases automáticas e regras de validade. Nenhum módulo mantém lista própria de conceitos — a violação ativa conhecida (`fontes.ts` e as tags de `cruzamento.ts`) está registrada em §7.1 e sua limpeza é pré-condição da implementação.

---

# DOCUMENTO 10 — Inventário técnico para a implementação

> Somente inventário. Nenhuma tabela, migration, tela ou alteração de Motor foi criada nesta fase.

## 10.1 Reutilizável como está

| Peça | Onde | Papel na implementação |
|---|---|---|
| `curadoria.method_subcriteria` | banco | recebe os 28 (é `code`-estável; mudança = migration, ADR-039 item 6) |
| `curadoria.case_priority_map` | banco | lado do Case — intocado |
| `curadoria.professional_subcriterion_map` | banco | os 3 estados — intocado; a evidência é ortogonal, nunca substituição |
| `verification_status` (enum, 5 valores) | banco | estado da informação da futura evidência |
| `SOURCE_TIERS` + `sourceCanSustain` + `isStale` | `fontes.ts` | fonte mínima e validade por conceito |
| `criterion_declarations` | banco | julgamento humano por Case com evidência — permanece o lugar da conclusão |
| Motor (15 células) | `motor-compatibilidade.ts` | **não muda** |
| `ProvenanceRef` | `relatorio-inteligente.ts` | ganha origens novas (aditivo) |
| CHECK de proveniência (fonte+data+autor) | migrations de área/registro | o padrão a replicar na evidência |

## 10.2 A criar (próximas missões, com ADR)

1. **Catálogo 1.0.0 no banco**: migration aditiva sobre `method_subcriteria` — inserir `CONTINUIDADE_CANAIS`, `PRATICA_LIMITES_DE_ATUACAO`, `VIABILIDADE_*`; desativar (`active=false`, nunca deletar) `HISTORICO_REGULARIDADE` e os 4 fundidos; inserir os 2 resultantes das fusões; renomear `ACESSO_LOCALIZACAO` (código novo, antigo desativado). **Backfill:** nenhum automático — a ADR-039 já decidiu que mapeamento inventado é pior que não migrar; linhas de `case_priority_map`/`professional_subcriterion_map` apontando para códigos desativados permanecem legíveis como histórico.
2. **Opções canônicas por conceito**: tabela nova (`method_options` ou afim) versionada.
3. **Base de Evidências de Prática**: tabela nova, ortogonal ao Mapa — (profissional, conceito) → fato estruturado + `verification_status` + fonte + data + responsável, com o mesmo CHECK de proveniência.
4. **Declarações de viabilidade**: lado do profissional (permanente) e da paciente (por Case), fora do Motor.

## 10.3 Componentes afetados (quando a implementação vier)

`MesaPriorityPanel` e superfícies da Mesa (sinalizações estruturadas fora da matriz) · workspace do Mapa do Profissional (evidência ao lado do estado) · `relatorio-assistido.ts`/`relatorio-inteligente.ts` (frases novas da gramática) · cadastro do profissional (perguntas estruturadas) · páginas da paciente (`prioridades`) na parte dita diretamente.

## 10.4 Riscos de compatibilidade

- **Códigos desativados com dados vivos**: leitura histórica precisa continuar resolvendo rótulo pela versão da coleta (§7.4-7.5).
- **`caminho errado` no cruzamento de fusões**: nenhum código pode "traduzir" declaração antiga para conceito novo em silêncio.
- **Viabilidade vazando para o Motor**: precisa de guarda de teste — nenhum `VIABILIDADE_*` pode aparecer em `crossOne`/`crossCaseWithProfessionals`.
- **Deriva do ledger de produção** (pendência do gate): resolver antes da primeira migration nova, ou o guarda da NC-23 acusará para sempre.

## 10.5 Testes a criar/atualizar

Guarda "catálogo = 28, eixos = 4/5/5/12/2" · guarda "viabilidade fora do Motor" · guarda "opção selecionada nunca vira `verificado` sem assinatura" · gramática do Relatório (frase sem origem estruturada não é gerada; frases proibidas pinadas) · atualização dos testes de completude do Mapa (26→28 tratáveis? **não**: completude segue sobre os conceitos com lado do Case — decidir na missão se viabilidade conta) · integração da Base de Evidências com RLS.

## 10.6 Sequência recomendada

1. ADR do Catálogo 1.0.0 (formaliza este congelamento)
2. Migration do catálogo + guardas de contagem
3. Tabela de opções canônicas
4. Base de Evidências de Prática (com RLS e CHECK de proveniência)
5. Declarações de viabilidade
6. Superfícies (Mesa, cadastro, paciente)
7. Gramática do Relatório
8. Certificação dinâmica do conjunto

---

# DOCUMENTO 9 — Decisão de Método

## **B — O catálogo atual é parcialmente suficiente e precisa ser corrigido.**

Não é A, porque o catálogo tem falhas de conteúdo, não apenas de formalização, e elas sobrevivem inteiras às exclusões decididas:

- **duas duplicações internas** — `CASOS_SEMELHANTES` × `CONDICAO_OU_PROCEDIMENTO` e `PRODUCAO_ACADEMICA` × `ENSINO_E_PESQUISA`;
- **uma colisão com o cadastro** — `HISTORICO_REGULARIDADE` repete `registration_status`, que já é verificado contra fonte oficial primária com proveniência obrigatória por `CHECK`. Dois registros da mesma verdade podem divergir;
- **quatro definições que misturam fato permanente com juízo do Case**, contra a ADR-040 item 3;
- **duas necessidades concretas sem lugar** — *"se eu piorar na quinta à noite, com quem falo?"* e *"isto que eu tenho, ele trata?"*. A segunda é proteção direta da paciente: sem `PRATICA_LIMITES_DE_ATUACAO`, a incompatibilidade só aparece na consulta, depois da espera, do deslocamento e do custo;
- **nenhum dos 26 tem evidência ou proveniência**, enquanto a área de atuação, ao lado, tem os quatro campos. A assimetria é ordem de construção, não decisão de Método.

Não é C, porque a fundação está certa e provada. O catálogo é canônico e único (ADR-039), compartilha identidade com o lado do profissional (ADR-040 item 1), separa importância de presença (ADR-040 item 3), e a divisão técnico/assistencial que sustenta todo este desenho **já existe no código** — não precisou ser inventada. Reconstruir jogaria fora uma arquitetura que passou por quatro ADRs e uma certificação dinâmica.

**A correção é de escopo delimitado:** +5 conceitos, −2 por fusão, −1 por duplicação, 1 renomeado, 4 definições estreitadas. **O Motor não muda.** As 15 células permanecem. As duas lacunas de granularidade ficam registradas e são tratadas por sinalização fora da matriz, com a conclusão continuando a ser declaração humana.

## O que ainda depende de você

1. **Custo e convênio entram no Método?** É a única decisão que não tomo — ela define se a Aliviar considera viabilidade financeira parte da compatibilidade.
2. **A fusão de `CASOS_SEMELHANTES` com `CONDICAO_OU_PROCEDIMENTO` perde alguma distinção que você quis criar?** Se a intenção era separar semelhança de contexto de especificidade técnica, elas ficam — e aí precisam de definições que não se sobreponham.
3. **`EXPERIENCIA_VOLUME_DE_ATUACAO` sobrevive ao seu próprio princípio?** Volume alto é facilmente lido como mérito, e o Método proíbe opinar sobre gente. Mantive porque volume é fato verificável, mas é o conceito mais próximo da fronteira.
