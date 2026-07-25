# ACE FOUNDATION — Documento Fundador do Aliviar Compatibility Engine

**Estado**: Proposto (Missão 0 do ACE, 2026-07-25). Não canônico até aprovação do Fundador — `DOCUMENTATION_GOVERNANCE_POLICY.md` §4. **Nenhum código, banco, API, algoritmo ou tela foi criado para produzir este documento.**

Documentos irmãos: [`ACE_PRINCIPLES.md`](ACE_PRINCIPLES.md) · [`ACE_BOUNDARIES.md`](ACE_BOUNDARIES.md) · [`ACE_DATA_CLASSIFICATION.md`](ACE_DATA_CLASSIFICATION.md)

---

## 0. Duas questões de nomenclatura, resolvidas antes de tudo

### 0.1 A sigla ACE já está ocupada

No repositório, **ACE** significa hoje *Aliviar **Curation** Engine* — o motor automático com Constituição, Framework, Ontologia, Kernel e protocolos P001–P010 (`docs/ace/`), congelado por ADR-021 e substituído pelo Método conduzido por humano.

Esta missão introduz *Aliviar **Compatibility** Engine*. **Duas coisas diferentes com a mesma sigla.** Foi exatamente esse tipo de ambiguidade que produziu as duas entidades "Case" que a Convergência de Domínio acabou de eliminar.

**Recomendação ao Fundador** (decisão dele, não minha):

| Opção | Consequência |
|---|---|
| **A. Renomear o novo** — ex.: **ACO** (Aliviar Compatibility Organizer) ou **MOC** (Motor de Organização de Compatibilidade) | Preserva o histórico do ACE antigo; custo zero de reescrita |
| **B. Renomear o antigo** para *Legacy Curation Engine* e libertar a sigla | Reescreve dezenas de documentos e ADRs congelados |
| **C. Conviver com as duas** | ❌ **Desaconselhado** — a ambiguidade é a própria semente do erro |

Enquanto não houver decisão, este documento usa **ACE = Aliviar Compatibility Engine** e sempre nomeia o antigo como *ACE automático (legado)*.

### 0.2 O que o ACE **não** é: ele não substitui o Perfil de Prioridades

Já existe no Método, em produção, `computeCompatibility()`: o paciente distribui **100 pontos** entre critérios, cada peso carregando uma **Evidência de Curadoria** (a palavra dele), e o sistema calcula aderência a **esses critérios declarados**. Isso permanece — não é o ACE, e o ACE não o revoga.

A distinção é o coração desta Constituição:

| | **Perfil de Prioridades** (existe hoje) | **ACE** (esta Constituição) |
|---|---|---|
| Mede | aderência a **critérios que o paciente declarou** | alinhamento entre **forma de decidir** e **forma de atuar** |
| Natureza | fatos verificáveis (especialidade, cidade, telemedicina, convênio) | contexto qualitativo |
| Produz | score interno + banda qualitativa | **frases explicadas — nunca número** |
| Por que pode/não pode pontuar | pode: o paciente ponderou os critérios com as próprias palavras | **não pode**: ninguém pediu para ser pontuado num eixo de temperamento |

**O ACE nunca produz número, nota, score, ranking, percentual, estrela ou medalha.** O Segundo Princípio vale integralmente para ele. O score do Perfil de Prioridades continua existindo porque mede outra coisa — e mesmo assim já é protegido: interno ao Curador, banda qualitativa ao paciente, com `coveredWeight` dizendo quanto dos 100 pontos pôde de fato ser avaliado.

---

## 1. Filosofia

A Aliviar não escolhe médicos. A Aliviar conduz pessoas por uma decisão de saúde, e quem decide é sempre gente: o Curador conduz, o paciente decide.

O ACE existe para uma finalidade estreita e honesta:

> **Organizar informação para que o Curador enxergue melhor — nunca para que ele pense menos.**

Ele nunca responde *"qual é o melhor médico?"*. Ele responde:

> *"Quais características deste médico parecem alinhadas ao contexto deste paciente e deste caso — e o que merece ser conversado antes da decisão?"*

A diferença não é retórica. A primeira pergunta produz um veredito e convida à obediência. A segunda produz **material para uma conversa** e devolve a decisão a quem é dela.

## 2. Objetivos

1. **Dar ao Curador contexto que ele levaria horas para juntar** — o que o paciente já disse, o que o médico já declarou, e onde essas duas coisas se encontram ou se estranham.
2. **Antecipar o que precisa ser explicado ao paciente** antes da decisão, para que ninguém descubra na sala de consulta algo que já era sabido.
3. **Tornar visível o que falta** — ausência de informação é informação, e precisa aparecer como ausência, jamais como julgamento.
4. **Deixar rastro** — toda observação com origem, data e justificativa legível.

**Não é objetivo do ACE**: recomendar, decidir, ordenar por preferência, prever desfecho clínico, avaliar qualidade médica, medir personalidade ou substituir qualquer etapa da Curadoria.

## 3. A ordem inegociável

```
1º  NECESSIDADE CLÍNICA      ← filtro absoluto: sem isso, nada mais importa
2º  VIABILIDADE PRÁTICA      ← acesso, agenda, cobertura, distância
3º  COMPATIBILIDADE (ACE)    ← só entre opções JÁ clinicamente adequadas
```

**O ACE nunca aproxima um paciente de um médico tecnicamente inadequado porque houve afinidade de perfil.** A compatibilidade opera *dentro* do conjunto já filtrado pela adequação clínica, nunca *sobre* ele. Se a etapa 1 esvaziar o conjunto, o ACE não tem o que fazer — e dizer isso é a resposta correta.

Consequência arquitetural: o ACE é **posterior** aos filtros obrigatórios do Método. Ele não pode ser consultado antes deles, nem pode ressuscitar uma opção que a necessidade clínica excluiu.

## 4. Como o Curador usa

O ACE entrega ao Curador **observações em linguagem humana**, cada uma com origem e justificativa, em três famílias:

| Família | Pergunta que responde | Exemplo de forma (não de conteúdo real) |
|---|---|---|
| **Pontos de alinhamento** | O que nesta atuação encontra o que esta pessoa disse precisar? | "Ela disse que precisa entender cada passo. Este profissional declarou que dedica a primeira consulta à explicação do plano." |
| **Pontos de atenção** | O que pode não encaixar, e merece ser dito antes? | "Ela mencionou dificuldade de se deslocar. Este profissional atende apenas presencialmente." |
| **Lacunas** | O que não sabemos e faz falta? | "Não há informação declarada sobre disponibilidade para retorno — vale perguntar." |

Nunca: "compatibilidade 87%", "3 estrelas", "melhor opção", "recomendado".

O Curador pode **discordar de qualquer observação**, e a discordância é registrada como fato do Curador, não como erro do sistema (Direito à Revisão — `ACE_PRINCIPLES.md` P8).

## 5. Como é apresentado

- **Frases completas**, na linguagem do Método — nunca rótulos, tags de personalidade ou adjetivos sobre pessoas
- **Cada observação carrega a origem**: Paciente · Médico · Curador · Sistema · Fonte pública verificada
- **Cada observação carrega o porquê** — se não há justificativa legível, a observação não é exibida
- **Ordem sem hierarquia de valor**: alinhamentos, atenções e lacunas juntos por opção; nunca uma lista de "melhores"
- **Ausência dita como ausência**, com o que fazer a respeito

## 6. Riscos — mapa completo

| # | Risco | Impacto | Mitigação | Monitoramento |
|---|---|---|---|---|
| R1 | **Viés inconsciente amplificado** — o ACE aprende ou repete um padrão injusto | Alto — discriminação sistemática, invisível | Nenhum atributo protegido entra (`ACE_BOUNDARIES.md` §1); observações derivam só de fato declarado + critério do paciente | Auditoria periódica: quais observações se repetem entre médicos? Há correlação com atributo pessoal? |
| R2 | **Excesso de confiança** — o Curador adota a observação como veredito | Alto — a decisão humana vira carimbo | Nada de score; toda observação exige justificativa; Curador precisa **registrar sua leitura**, não só aceitar | Frequência de discordância registrada: **zero discordância é sinal de alarme**, não de acerto |
| R3 | **Interpretação equivocada** — observação lida fora de contexto | Médio | Frase completa com origem e data; nunca fragmento solto | Revisão de amostras de Curadorias entregues |
| R4 | **Estereotipagem** — a pessoa vira um tipo ("paciente ansioso") | Alto — desumaniza e prejudica | **Proibido rotular pessoas**; observações descrevem *situações e falas*, nunca *essências* | Varredura de vocabulário: adjetivos sobre pessoa são defeito |
| R5 | **Simplificação excessiva** — nuance vira bullet | Médio | Lacuna é obrigatória; a incerteza aparece | Revisão do Curador na entrega |
| R6 | **Uso fora de propósito** — observações do ACE viram critério comercial, de marketing ou de avaliação de médicos | Alto — quebra de confiança da rede | Proibição explícita (`ACE_BOUNDARIES.md` §4); dados do ACE não alimentam relatórios de desempenho | Auditoria de acesso e de exportação |
| R7 | **Deriva silenciosa** — regras mudam sem que ninguém perceba | Médio | Toda regra versionada e datada; mudança exige registro | Diff de regras a cada release |
| R8 | **Colisão de sigla (ACE × ACE)** | Médio — confusão de escopo e de governança | §0.1 desta Constituição; decisão pendente do Fundador | Revisão documental |

## 7. Recomendações para a implementação (missões futuras)

1. **Resolver a sigla primeiro** (§0.1) — antes de qualquer linha de código, para não nascer com dívida de nome.
2. **Começar pelo vocabulário, não pelo motor**: definir as observações possíveis e suas justificativas antes de qualquer mecanismo que as produza.
3. **O ACE nasce depois dos filtros**, na fase de Curadoria Técnica — nunca antes.
4. **Todo dado do médico é declarado pelo médico**, com data e possibilidade de correção por ele.
5. **Nenhuma inferência sobre o paciente sem a fala dele** — o insumo é o que ele disse, com a evidência preservada.
6. **Guard de vocabulário automatizado** desde o primeiro commit, como já existe para o vocabulário do paciente: score, ranking, nota, estrela e adjetivo-de-pessoa devem quebrar a suíte.
7. **Registrar a discordância do Curador** como dado de primeira classe — é o principal sinal de saúde do sistema.
8. **Nunca treinar um modelo com histórico de escolhas** sem uma missão própria de ética: escolhas passadas carregam os vieses passados.

---

## Critério de sucesso desta Constituição

Qualquer pessoa da equipe deve responder, sem ajuda:

**O que o ACE pode fazer?** Organizar e explicar pontos de alinhamento, atenção e lacuna entre o que o paciente disse e o que o médico declarou — sempre com origem, justificativa e supervisão humana.

**O que o ACE nunca poderá fazer?** Escolher, recomendar, pontuar, ranquear, avaliar qualidade médica, inferir personalidade, usar atributo protegido, decidir por alguém — ou existir antes da necessidade clínica.
