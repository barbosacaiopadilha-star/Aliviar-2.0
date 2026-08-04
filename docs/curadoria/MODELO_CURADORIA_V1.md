# MODELO DA CURADORIA — v3.0

> **Documento canônico do domínio da Curadoria Aliviar.**
> Consolidado em 2026-07-27 a partir das decisões tomadas durante a evolução
> do modelo (reforma do cruzamento, cadastro enriquecido, política de fontes,
> saneamento da rede, certificação do ciclo e Dashboard do Curador).
>
> **v3.0 (2026-08-04, ADR-067 · pacote A-01):** executa a reescrita prescrita
> pela ADR-067 — **§7.1, §7.2, §7.3 e §7.4 deixam de descrever pontuação**
> ("Avaliação Técnica 0–100", "Compatibilidade Assistencial 0–100", pesos
> percentuais e normalização sobre 100 pontos), que a **ADR-042** havia removido
> em 2026-07-28 sem que o corpo do documento fosse atualizado (achado **P17** da
> auditoria operacional). Institui o **§10.1 — Verbos canônicos do domínio**
> (fonte única do vocabulário de atos) e regulariza o §11 com as ADR-066,
> ADR-067 e ADR-068. Nenhum conceito, escala, célula ou critério foi criado,
> alterado ou removido nesta versão: é quitação de dívida documental.
>
> **v2.0 (2026-08-03, ADR-065):** institui a **Compatibilidade Relacional**
> como quarta leitura da Curadoria (§7.2-R), com documento normativo próprio em
> [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md);
> regulariza o §11 com a virada da ADR-042 (Mapa de Prioridades no lugar dos
> orçamentos de 100 pontos), quitando a dívida de versão das ADR-039/040/041/042.
>
> A partir deste documento: novos desenvolvimentos seguem este modelo;
> alterações conceituais exigem ADR específica que o referencie; conceito que
> não está aqui não é conceito do domínio — é candidato a ADR ou é ruído.
>
> Subordinado à Constituição da Aliviar e à ADR-035 (autoridade decisória
> única do Curador). Em conflito, elas vencem.

---

## 1. Princípio

A Curadoria Aliviar **não procura "o melhor médico"**. Ela identifica **três
caminhos tecnicamente legítimos e compatíveis com as prioridades declaradas
pela pessoa**.

A decisão é construída pelo cruzamento entre:

- a necessidade técnica do caso;
- o perfil técnico do profissional;
- o perfil assistencial do profissional;
- o perfil de prioridades do paciente.

**O sistema organiza. O Curador interpreta. A decisão é humana.**

### 1.1 O objeto da Curadoria

O objeto da Curadoria **não é o médico — é o caminho de cuidado**. O médico é
quem materializa esse caminho.

A distinção é pequena hoje e estrutural amanhã: ela permite que a Aliviar
venha a comparar não apenas profissionais, mas formas distintas de conduzir
um caso — abordagem conservadora versus cirúrgica, modelos diferentes de
acompanhamento — sem mudar o domínio de novo. Tudo neste documento que fala
de "profissional" deve ser lido como "o profissional enquanto materialização
de um caminho de cuidado".

---

## 2. As quatro camadas

A Curadoria possui exatamente quatro camadas. Nenhuma superfície, motor ou
documento futuro deve inventar uma quinta sem ADR.

| Camada | Nome | Natureza | Saída |
|---|---|---|---|
| 1 | Filtros Eliminatórios | porta de entrada | participa / não participa / pendente de verificação, **sempre com motivo** |
| 2 | Perfil Técnico do Profissional | **juízo do Curador**, conceito a conceito | conclusão assinada (§7.1) — **nenhuma pontuação** |
| 3 | Perfil Assistencial do Profissional | cadastro estruturado de fatos | fatos declarados — **nenhuma pontuação** |
| 4 | Perfil de Prioridades do Paciente | **importância declarada** por conceito (escala fechada de 5 níveis, ADR-039) | entrada do Motor — **nenhuma pontuação** |

*(Até a ADR-042, as camadas 2 e 4 tinham "orçamentos" de 100 pontos cada. Os
orçamentos foram substituídos pelo Mapa de Prioridades; a coluna acima passou
de "Pontuação" para "Saída" na v3.0, por coerência — **nenhuma camada foi
criada, removida ou renomeada**.)*

---

## 3. Camada 1 — Filtros Eliminatórios

Os filtros definem **quem pode participar** da Curadoria.

Quem não passa **não recebe avaliação**. Nunca recebe nota baixa. Apenas
deixa de participar — e o motivo registrado diz que foi o filtro, não uma
nota.

### 3.1 Área de atuação — o filtro principal

Declarada pelo **Curador**, por par (Case, profissional), porque a mesma
formação responde a um caso e não responde a outro. A comparação entre o que
o caso exige e o que o profissional declara é **humana** — nenhuma
equivalência semântica automática elimina ou aprova sozinha.

Quatro estados:

| Estado | Efeito |
|---|---|
| Compatível | participa |
| Parcialmente compatível | participa **somente** com confirmação explícita do Curador, com justificativa |
| Incompatível | eliminado, com justificativa obrigatória |
| Informação insuficiente | **pendente de verificação** — nunca eliminado; a ação corretiva é verificar o cadastro, não descartar a pessoa |

### 3.2 Demais filtros

Só é filtro o que for **realmente obrigatório** para este Case: estado (UF),
atendimento presencial, disponibilidade, cuidado contínuo — quando a pessoa
os declarou como inegociáveis.

O que não for obrigatório **não é filtro**: participa do Perfil de
Prioridades do Paciente como peso. A régua: filtro elimina; prioridade
pondera. Um desejo tratado como filtro esvazia a Rede; um inegociável
tratado como peso entrega à pessoa um caminho que ela já disse que não serve.

Filtro sem informação registrada deixa o profissional **pendente de
verificação** — nunca "não atende".

---

## 4. Camada 2 — Perfil Técnico do Profissional

Representa a **capacidade técnica do profissional para responder a este
caso**, em três critérios.

Cada critério é **julgado** pelo Curador nos quatro estados da escala humana
(§7.3a). **Nenhum critério recebe peso, nota ou pontuação**, e **as evidências
nunca recebem peso nem nota** — elas justificam o juízo. Deduzir mérito de
contagem de diplomas seria transformar volume em qualidade.

*(Até a ADR-042, esta camada tinha orçamento próprio de 100 pontos
distribuídos entre os três critérios. Os orçamentos foram removidos; o juízo
permanece, sem escala numérica.)*

| Critério | Pergunta | Evidências (exemplos) |
|---|---|---|
| **Formação Profissional** | Quanto a formação deste profissional responde ao caso? | graduação, residência, especialização, fellowship, pós-graduação, atualização, instituições, fontes |
| **Experiência Profissional** | Quanto a experiência deste profissional responde ao caso? | tempo de atuação, casos semelhantes, atuação atual, complexidade, frequência, fontes |
| **Histórico Profissional** | A trajetória profissional transmite segurança para este caso? | instituições, vínculos, regularidade, histórico verificável, produção científica e docência (quando relevantes), divergências, fontes |

Toda evidência carrega proveniência (fonte, estado de verificação, autor,
data) conforme a política de fontes (§9). Divergência aberta aparece na
evidência — nunca some.

---

## 5. Camada 3 — Perfil Assistencial do Profissional

Representa **como o profissional cuida**. É um **cadastro estruturado de
fatos verificáveis** — não recebe pontuação, não recebe adjetivos.
"Acolhedor" e "excelente comunicador" não são dados; decisão compartilhada
declarada e idiomas atendidos são.

Três eixos:

| Eixo | Registra |
|---|---|
| **Acesso** | estado, cidade, presencial, online, disponibilidade, tempo médio para consulta, deslocamento, demais informações logísticas |
| **Continuidade do cuidado** | acompanhamento contínuo, retornos, pós-operatório, coordenação do tratamento, equipe multidisciplinar, continuidade assistencial |
| **Modelo de atendimento** | decisão compartilhada, participação familiar, idiomas, acessibilidade, tempo médio da primeira consulta, demais características objetivas |

Booleanos são anuláveis por definição: `null` é "não se sabe", `false` é
"não oferece" — e a diferença entre os dois é a diferença entre verificar um
cadastro e descartar um profissional.

---

## 6. Camada 4 — Perfil de Prioridades do Paciente

Representa **como esta pessoa deseja ser cuidada** nesta busca — é do Case,
não do paciente em abstrato. **Sem orçamento e sem pontuação:** a importância
de cada conceito é declarada em **escala fechada de cinco níveis** (ADR-039),
e é ela — não um peso — a única entrada do Motor pelo lado do Case.

*(Até a ADR-042, esta camada tinha orçamento próprio de 100 pontos.)*

Os três critérios usam **exatamente os mesmos eixos** do Perfil Assistencial
(§5) — é isso que torna o cruzamento assistencial uma comparação entre duas
declarações, e não uma inferência:

| Critério | Pergunta à pessoa |
|---|---|
| **Acesso** | Quanto pesa conseguir acessar este profissional? |
| **Continuidade do cuidado** | Quanto pesa que este profissional acompanhe toda a sua jornada? |
| **Modelo de atendimento** | Quanto pesa a forma como você deseja ser cuidada? |

Registra-se **o que a pessoa declarou** — nunca o que a equipe concluiu por
ela.

---

## 7. Motor de Cruzamento

O sistema executa **três cruzamentos independentes** (o terceiro instituído
pela ADR-065). Os resultados permanecem separados. **Nunca existe um número
combinado** — somá-los faria uma leitura comprar deficiência de outra. Nenhum
cruzamento compensa, elimina ou ordena.

### 7.1 Cruzamento Técnico

```
Necessidade técnica do caso  ×  Perfil Técnico do Profissional
                     ↓
   Juízo do Curador, conceito a conceito — sem escala numérica
```

O Curador **julga** cada critério técnico contra o que **este caso** exige,
usando as evidências do cadastro. Nenhum diploma sabe o que o caso exige; o
sistema monta o dossiê, o Curador conclui e assina.

São **três** os critérios técnicos — `FORMACAO`, `EXPERIENCIA`, `HISTORICO`
(§4) —, e o juízo sobre cada um é **irredutível**: duas pessoas igualmente
competentes, olhando as mesmas evidências, podem concluir coisas diferentes
sobre o mesmo caso, e nenhuma estaria errada por regra. É essa
irredutibilidade que reserva o cruzamento técnico ao humano (ADR-067).

O resultado **não é um número**. É uma conclusão declarada, com autor, data,
evidências referenciadas e o registro do que estava visível. O registro
canônico desse ato é `curator_judgments`, natureza `TECNICO` (ADR-067).

*(Até a ADR-042, esta seção descrevia uma "Avaliação Técnica (0–100)". A
pontuação foi removida naquela decisão; o texto acima é a versão vigente
desde a ADR-067.)*

### 7.2 Cruzamento Assistencial

```
Perfil Assistencial do Profissional  ×  Perfil de Prioridades do Paciente
                     ↓
   Leitura por conceito — quatro resultados, nenhuma soma
```

Comparação entre o que a pessoa declarou querer e o que o profissional
declarou oferecer — **leitura de duas declarações, não inferência**. É por
isso que este cruzamento é do Motor e não do Curador: onde há duas
declarações fechadas sobre o mesmo fato, não há juízo a fazer, há
correspondência a ler.

O Motor devolve, **por conceito**, um dos quatro resultados da ADR-041, e uma
frase que explica a comparação. **Não há total, não há percentual, não há
posição.** O único resumo permitido conta ocorrências — *"3 altas · 1 média ·
1 lacuna"* — e nunca compara profissionais entre si.

*(Até a ADR-042, esta seção descrevia uma "Compatibilidade Assistencial
(0–100)". A pontuação foi removida naquela decisão; o texto acima é a versão
vigente desde a ADR-067.)*

### 7.2-R Cruzamento Relacional (ADR-065)

```
Perfil Relacional da Pessoa  ×  Condutas declaradas do Profissional
                     ↓
      Compatibilidade Relacional (leitura qualitativa, sem número)
```

Quarta leitura da Curadoria, sobre o eixo `MODELO_DE_ATENDIMENTO` (seis
conceitos). Grau da pessoa × estado derivado da Base de Evidências, matriz
4×3 fechada, os mesmos quatro resultados do Motor de Compatibilidade;
conceitos de juízo humano nunca produzem célula — emitem
`AGUARDA_JUIZO_DO_CURADOR`. Definição normativa completa, célula a célula:
[`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md).
Esta leitura **informa** — não pontua, não ranqueia, não elimina, não se soma.

### 7.3 As duas escalas — e por que são duas

**Existem dois vocabulários de saída, e eles não se convertem um no outro.**
Confundi-los foi a origem do achado P17; esta seção os separa em definitivo.

**(a) Escala de avaliação humana — quatro estados.** Usada pelo **Curador**,
no cruzamento técnico (§7.1) e na compatibilidade de área (§3.1):

| Estado | Significado |
|---|---|
| Atende plenamente | o que este caso exige está respondido |
| Atende parcialmente | está respondido em parte, e a parte que falta é dita |
| Não atende | não está respondido — **juízo humano, nunca frase automática** |
| Informação insuficiente | **não se sabe** — nunca vira "não atende", nunca vira zero |

**Nenhum destes estados carrega peso, percentual ou nota.** A menção anterior
a "100% / 50% / 0% do peso" pertencia aos orçamentos de 100 pontos, removidos
pela ADR-042.

**(b) Escala de leitura do Motor — quatro resultados.** Usada pelo **Motor**,
nos cruzamentos assistencial (§7.2) e relacional (§7.2-R), célula a célula:
`ALTA_COMPATIBILIDADE` · `MEDIA_COMPATIBILIDADE` · `LACUNA_DE_INFORMACAO` ·
`NAO_RELEVANTE` (ADR-041), mais a sinalização `AGUARDA_JUIZO_DO_CURADOR` nos
conceitos de juízo humano (ADR-065).

**A regra que separa as duas:** a escala (a) é **conclusão de pessoa**; a
escala (b) é **correspondência de máquina**. Elas nunca se somam, nunca se
convertem e nunca aparecem na mesma coluna. Um resultado do Motor jamais é
apresentado como avaliação do Curador, e uma avaliação do Curador jamais é
apresentada como leitura do Método.

### 7.4 Cobertura — o inventário de lacunas

Informação insuficiente reduz a **cobertura**, nunca a avaliação. E cobertura,
desde a ADR-042, **não é percentual de nada**: é o **inventário das lacunas**,
dito por extenso, com as naturezas distinguidas — porque a diferença entre
elas muda o que se deve fazer:

| Natureza da lacuna | O que significa | Ação correta |
|---|---|---|
| **Ninguém olhou** (`LACUNA_DE_INFORMACAO`) | o item não foi trabalhado | trabalhar o item |
| **Olharam e não souberam** (`NAO_INFORMADO`) | foi analisado, a informação não existe | buscar fonte, ou registrar que não há |
| **Evidência vencida** | havia informação, e ela envelheceu | reverificar |
| **Juízo humano pendente** | falta a conclusão de uma pessoa | julgar |
| **Divergência aberta** | duas fontes discordam | resolver |

O que distingue um cadastro vazio de um "não atende em tudo" é a cobertura:
num caso não se sabe; no outro, sabe-se que não. **A lacuna é sempre dita,
nunca escondida, e nunca convertida em ausência da característica** (I-8).

*(Até a ADR-042, esta seção descrevia normalização sobre 100 pontos —
"Avaliação construída sobre 90 dos 100 pontos possíveis". A frase foi
removida com os orçamentos; o texto acima é a versão vigente desde a
ADR-067.)*

---

## 8. Resultado, decisão e Relatório

### 8.1 O que cada profissional carrega ao fim do cruzamento

- **Juízo Técnico** — conclusão assinada do Curador nos três critérios
  técnicos, com autor, data e evidências referenciadas (ADR-067; **nunca um
  número**);
- **Compatibilidade Assistencial** — leitura por conceito, quatro resultados
  (**nunca um número**);
- **Compatibilidade Relacional** — leitura qualitativa por conceito, com as
  sinalizações de juízo humano pendente (ADR-065; nunca um número);
- **Cobertura** — o inventário de lacunas por natureza (§7.4);
- **Evidências** que justificam cada juízo;
- **Pontos de atenção** — obrigatórios para o Relatório.

### 8.2 Decisão do Curador

**Não há números para escolher.** A decisão considera o juízo técnico, as
leituras assistencial e relacional, o inventário de lacunas, as evidências, os
pontos de atenção e o contexto clínico. **Nenhuma chave de ordenação está em
vigor**: a comparação é apresentada na ordem neutra da Rede, e a definição de
uma chave permanece decisão adiada, dependente de necessidade observada em
operação real (§11). Ordenação de leitura, se um dia existir, não é colocação —
e a interface jamais usa vocabulário de pódio.

A seleção é de **exatamente três caminhos**, distintos, todos participantes
(nenhum eliminado, nenhum pendente), com justificativa e autoria humana.

### 8.3 Relatório

O Relatório continua **humano**. Poderá usar as evidências registradas para
construir um **rascunho**; o Curador é responsável pela versão final. Cada
opção carrega justificativa, relação com **a importância declarada** dos
conceitos e ao menos um ponto de atenção.

---

## 9. Fundações que este modelo pressupõe (inalteradas)

Este documento consolida; não revoga. Permanecem em vigor:

- **Decisão humana / ADR-035** — o Curador é a única autoridade decisória;
- **Três opções** — sempre exatamente três;
- **Filtros eliminatórios** — eliminado nunca é pontuado;
- **Informação insuficiente** — nunca vira zero, `false` ou "não atende";
- **Cobertura** — a lacuna é dita, nunca escondida;
- **Proveniência** — `verificado` exige fonte, autor e data; encontrar não é
  verificar; divergências preservam as duas versões;
- **Rastreabilidade** — toda declaração registra autor, data e o que estava
  visível quando foi feita;
- **Isolamento** — demonstração e fixture de certificação nunca alcançam
  paciente.

---

## 10. Vocabulário oficial

Substituições definitivas. O termo da esquerda não deve mais aparecer em
código novo, documento novo ou tela nova:

| Não usar | Usar |
|---|---|
| "Critérios pessoais" | **Perfil de Prioridades do Paciente** |
| "Modelo de cuidado" | **Perfil Assistencial do Profissional** |
| "Subcritérios" | **Evidências** |
| "Pontuação" | **Avaliação** |
| "Ranking" | **Ordenação interna de leitura** |
| "Compatibilidade Pessoal" | **Compatibilidade Relacional** (ADR-063 §3 e ADR-065) |

### 10.1 Verbos canônicos do domínio — **fonte única**

Instituída pelo pacote A-01 (2026-08-04) para eliminar as definições
concorrentes que existiam entre a ADR-067 (sete verbos) e a ADR-068 (cinco
verbos). **Esta é a lista completa e única.** Onde qualquer documento,
inclusive as ADRs que a originaram, divergir desta tabela, **vale esta
tabela**. Verbo que não está aqui **não é ato do domínio**.

| Verbo | Definição | Quem pratica | Produz | Fonte |
|---|---|---|---|---|
| **DECLARAR** | afirmar originariamente um fato sobre o qual se tem autoridade | quem tem a autoridade sobre o fato | **declaração** — entrada válida do Método | ADR-068 §2 |
| **DERIVAR** | aplicar regra versionada a uma declaração, produzindo sugestão | Pipeline de Derivação | **proposta** — sem autoridade decisória | ADR-066 |
| **CONFIRMAR** | **adotar como sua** a formulação de outrem, passando a responder por ela | quem tem a autoridade sobre o campo | **declaração** + registro do ato | ADR-068 §1 |
| **RECUSAR** | não adotar a formulação oferecida | quem poderia confirmar | registro do ato; **nada no Mapa** — o conceito volta a lacuna | ADR-066 §7 |
| **LER** | comparar duas declarações fechadas segundo matriz fixa | Motor | **resultado por conceito** — nunca conclusão sobre pessoa | ADR-041 · ADR-065 |
| **JULGAR** | **formular** conclusão irredutível sobre fatos reunidos, respondendo por ela | Curador | **julgamento** | ADR-067 §1 |
| **DECIDIR** | escolher entre alternativas legítimas, fechando o que estava aberto | Curador (os três caminhos) · paciente (a decisão dela) | **decisão**, com autoria | ADR-035 |
| **RECONHECER** | afirmar que uma **representação de si** lhe corresponde | **somente a paciente** | **habilitação** — nunca um valor | ADR-042 · ADR-049 |
| **VERIFICAR** | atestar uma informação contra fonte, assinando sobre uma **versão específica** | operação / Curador | **estado de verificação** — governança, nunca compatibilidade (I-5) | I-6 |
| **VALIDAR** | conferir conformidade a regra objetiva | **o sistema** | verdadeiro/falso + motivo — **não cria fato** | ADR-068 §3 |
| **EXPLICAR** | verbalizar, com proveniência, o que foi lido, julgado e decidido | Motor | **explicação** — nunca acrescenta conteúdo | Arquitetura §11 |

**Verbos deliberadamente recusados como atos do domínio** — usá-los com efeito
é criar vocabulário paralelo, que a ADR-039 item 1 proíbe:

| Recusado | Por quê |
|---|---|
| **REVISAR** | examinar não produz nada; se produzisse efeito, seria confirmar com outro nome — e teria de exigir a mesma autoridade |
| **APROVAR** (uma proposta) | reparte autoria entre uma regra e uma pessoa; autoria repartida com regra é autoria de ninguém. O ato correto é **confirmar** |
| **INTERPRETAR** | é o componente cognitivo de **julgar**, sem registro próprio |
| **CONCLUIR** | é o produto de **julgar** ou de **decidir**, não um ato distinto |
| **INFERIR** | preencher o que ninguém declarou. **Ninguém infere** — nem o Motor, nem o Curador, que quando não sabe registra lacuna |
| **PONTUAR · ORDENAR · CLASSIFICAR** | proibidos pelo §4.8 do Congelamento |

**As três distinções que mais importam** (registradas porque são a origem dos
erros de desenho da 1.0):

| Par | Diferença |
|---|---|
| **Confirmar × Julgar** | confirmar **responde** a um valor já formulado; julgar **formula**. Oferecer juízo pré-escrito para o Curador confirmar transformaria juízo em carimbo |
| **Julgar × Decidir** | julgar conclui sobre **um** par; decidir escolhe entre **vários**. Seis juízos não somam uma decisão |
| **Ler × Inferir** | ler compara declarações fechadas; inferir preenche lacuna. **O Motor lê** |

---

## 11. Estado da implementação (atualizado 2026-07-27, missão de alinhamento)

Registrar a distância entre o modelo e o código é parte do modelo — é o que
impede reinterpretação silenciosa. Após a missão de alinhamento:

| Tema | Este modelo (v1.0) | Estado | Fechado por |
|---|---|---|---|
| Orçamentos | dois orçamentos de **100** pontos, resultados **separados**, sem total combinado | **alinhado** — `BLOCK_POINTS = 100`, `CruzamentoResult` sem `total`/`coverage` combinados; teste pina a ausência do campo | missão de alinhamento (2026-07-27) |
| Critérios do paciente | Acesso · Continuidade do Cuidado · Modelo de Atendimento | **alinhado** — identificadores `ACESSO` / `CONTINUIDADE_DO_CUIDADO` / `MODELO_DE_ATENDIMENTO` no código e no banco (migration `20260727100000`) | missão de alinhamento |
| Terceiro critério técnico | **Histórico Profissional** ("transmite segurança?") | **alinhado** — identificador `HISTORICO`, pergunta do §4 palavra por palavra | missão de alinhamento |
| Perfil Assistencial | camada nomeada, três eixos | **alinhado** — `PerfilAssistencial` + `assistencialProfile()` em `dossie.ts` agrupam os fatos nos três eixos, sem pontuação | missão de alinhamento |
| Rascunho do Relatório a partir de evidências | previsto (§8.3) | **superado no essencial** — o Relatório Assistido gera rascunho determinístico a partir das evidências (`relatorio-inteligente.ts`, migration `20260727110000`); a tabela anterior antecedia essa entrega | Relatório Assistido (2026-07-27+) |
| Ordenação interna de leitura | permitida (§8.2) | **sem chave definida** — a ordenação pelo total combinado foi removida junto com ele; escolher a nova chave é decisão de domínio e exige ADR (reafirmado pela ADR-065: a leitura relacional não é chave de ordenação nesta versão). Até lá, a comparação apresenta na ordem da Rede | — |
| Orçamentos de 100 pontos (linha "Orçamentos" acima) | v1.0 previa dois orçamentos de 100 | **superado pela ADR-042** — o Mapa de Prioridades (escala fechada de importância) substituiu os orçamentos; o paciente não vê pontuação. A linha original permanece como registro histórico | ADR-039/040/041/042 (2026-07-28) |
| Compatibilidade Relacional (§7.2-R) | quarta leitura, seis conceitos | **implementada em parte** — migration 1.1.0, motor relacional, Mesa e Relatório feitos; **Dashboard pendente** | ADR-065 (2026-08-03) |
| **Pontuação no corpo do documento** (§7.1–§7.4, §2, §4, §6, §8.1) | v1.0/v2.0 descreviam "0–100", pesos percentuais e normalização sobre 100 pontos | **quitado** — a ADR-042 removeu a pontuação em 2026-07-28 e o corpo do documento só foi reescrito agora. Era o achado **P17** da auditoria operacional | **ADR-067 · pacote A-01 (2026-08-04)** |
| **Divisão da etapa AVALIAÇÃO** | v2.0 não a tratava | **decidida** — `ACESSO`, `CONTINUIDADE_DO_CUIDADO` e `MODELO_DE_ATENDIMENTO` passam à leitura do Motor; `FORMACAO`, `EXPERIENCIA` e `HISTORICO` permanecem juízo do Curador | **ADR-067** |
| **Registro do juízo humano** | inexistente | **decidido, não implementado** — `curator_judgments`, duas naturezas, seis conceitos, três estados, versionado e append-only | **ADR-067** |
| **Camada de Derivação** | inexistente | **decidida, não implementada** — `derivation_proposals`, cinco estados, doze itens de proveniência, proposta imutável com desfecho separado | **ADR-066** |
| **Ponte grau → importância** | proibida por I-10 | **forma e governança decididas; valores pendentes** — I-10 reaberta **em substância** (ADR-066 §18); toda versão anterior a Cases reais nasce `PROVISÓRIA` | **ADR-066** |
| **Autoridade de confirmação** | indefinida | **decidida** — só confirma quem poderia ter declarado; **a RLS da ADR-040 item 6 não foi reaberta**; incompatibilidade confirmador × julgador declarada, hoje inexequível e com exceção visível | **ADR-068** |
| **Verbos do domínio** | dispersos, com definições concorrentes entre ADR-067 e ADR-068 | **unificados** — §10.1 é a fonte única | **pacote A-01** |
| Ordenação interna de leitura (linha acima) | permitida (§8.2) | **permanece sem chave, e a ausência agora é deliberada** — a proposta de ordenar por prontidão da informação foi **recusada** por ser ranking por construção; a ordem permanece a neutra da Rede até haver necessidade observada em operação real | Arquitetura v1.2 §4.6 (2026-08-04) |

Nenhuma pendência autoriza mudança de código sem missão específica que
referencie este documento e ajuste esta tabela. **As ADR-066, ADR-067 e
ADR-068 fecham o domínio e não autorizam implementação:** o pacote F-02
permanece bloqueado por sequenciamento, por nomeação e pela guarda C-01.

---

## 12. Governança

- Este documento é a **referência única** do domínio da Curadoria.
- Toda ADR futura que alterar a Curadoria **deve referenciá-lo** e atualizar
  a versão (v1.1, v2.0…).
- Conflito entre este documento e código é defeito de um dos dois — e a
  tabela do §11 diz de qual.
- Documentos anteriores (Ontologia, Engine Specification, Fundamentos)
  permanecem como fontes históricas de rastreabilidade (`@metodo`); onde
  divergirem deste modelo, **este modelo vale**.

---

## 13. Congelamento do Domínio (em vigor desde 2026-07-27)

Com o código alinhado a este modelo, o domínio da Curadoria está
**congelado**. A partir deste momento, não podem ser implementados
diretamente:

- novos critérios;
- novos perfis;
- novos conceitos;
- alterações de pesos ou de orçamentos;
- mudanças na estrutura do motor;
- alterações do processo da Curadoria.

Qualquer mudança deverá, antes de qualquer linha de código:

1. **justificar o problema** que pretende resolver;
2. **demonstrar por que o Modelo v1.0 não responde** ao problema;
3. **possuir ADR específica** que referencie este documento;
4. **preservar compatibilidade** ou apresentar plano explícito de migração.

O objetivo é impedir evolução contínua do domínio sem validação operacional,
preservando a estabilidade do Método Aliviar. O congelamento não impede
correção de defeito (código que contraria este documento é defeito, §12) nem
as funcionalidades já previstas aqui e pendentes no §11 — impede conceito
novo entrando sem porta.
