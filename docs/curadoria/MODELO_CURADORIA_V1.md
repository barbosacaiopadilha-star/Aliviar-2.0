# MODELO DA CURADORIA — v1.0

> **Documento canônico do domínio da Curadoria Aliviar.**
> Consolidado em 2026-07-27 a partir das decisões tomadas durante a evolução
> do modelo (reforma do cruzamento, cadastro enriquecido, política de fontes,
> saneamento da rede, certificação do ciclo e Dashboard do Curador).
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

| Camada | Nome | Natureza | Pontuação |
|---|---|---|---|
| 1 | Filtros Eliminatórios | porta de entrada | nenhuma |
| 2 | Perfil Técnico do Profissional | avaliação pelo Curador | 100 pontos |
| 3 | Perfil Assistencial do Profissional | cadastro estruturado de fatos | nenhuma |
| 4 | Perfil de Prioridades do Paciente | pesos declarados pela pessoa | 100 pontos |

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
caso**. Orçamento próprio: **100 pontos**, distribuídos pelo Curador entre
três critérios.

Cada critério recebe peso e é avaliado pelo Curador em quatro estados (§7.3).
**As evidências nunca recebem peso nem nota** — elas justificam a avaliação.
Deduzir mérito de contagem de diplomas seria transformar volume em qualidade.

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
não do paciente em abstrato. Orçamento próprio: **100 pontos**.

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

O sistema executa **dois cruzamentos independentes**. Os dois resultados
permanecem separados. **Nunca existe um número de 200 pontos** — somá-los
faria técnica comprar deficiência assistencial, e vice-versa.

### 7.1 Cruzamento Técnico

```
Necessidade técnica do caso  ×  Perfil Técnico do Profissional
                     ↓
          Avaliação Técnica (0–100)
```

O Curador avalia cada critério técnico contra o que **este caso** exige,
usando as evidências do cadastro. Nenhum diploma sabe o que o caso exige; o
sistema monta o dossiê, o Curador declara.

### 7.2 Cruzamento Assistencial

```
Perfil Assistencial do Profissional  ×  Perfil de Prioridades do Paciente
                     ↓
       Compatibilidade Assistencial (0–100)
```

Comparação entre o que a pessoa declarou querer e o que o profissional
declarou oferecer — leitura de duas declarações, não inferência. Cada
resultado volta com a frase que explica a comparação.

### 7.3 A escala de avaliação — quatro estados

Todo critério, nos dois cruzamentos, é avaliado em:

| Estado | Alinhamento |
|---|---|
| Atende plenamente | 100% do peso |
| Atende parcialmente | 50% do peso |
| Não atende | 0% do peso |
| Informação insuficiente | **sai do cálculo** — nunca vira zero |

### 7.4 Cobertura

Informação insuficiente reduz a **cobertura**, nunca a avaliação. O
resultado é normalizado sobre o peso efetivamente avaliável e a lacuna é
dita por extenso:

> Avaliação construída sobre 90 dos 100 pontos possíveis.

O que distingue um cadastro vazio de um "não atende em tudo" é a cobertura:
num caso não se sabe; no outro, sabe-se que não.

---

## 8. Resultado, decisão e Relatório

### 8.1 O que cada profissional carrega ao fim do cruzamento

- **Avaliação Técnica** (0–100);
- **Compatibilidade Assistencial** (0–100);
- **Cobertura** de cada cruzamento;
- **Evidências** que justificam cada critério;
- **Pontos de atenção** — obrigatórios para o Relatório.

### 8.2 Decisão do Curador

O Curador **nunca escolhe baseado apenas nos números**. A decisão considera
avaliação técnica, compatibilidade assistencial, cobertura, evidências,
pontos de atenção e contexto clínico. O sistema pode **ordenar a leitura**
internamente; ordenação de leitura não é colocação, e a interface jamais usa
vocabulário de pódio.

A seleção é de **exatamente três caminhos**, distintos, todos participantes
(nenhum eliminado, nenhum pendente), com justificativa e autoria humana.

### 8.3 Relatório

O Relatório continua **humano**. Poderá usar as evidências registradas para
construir um **rascunho**; o Curador é responsável pela versão final. Cada
opção carrega justificativa, relação com os pesos e ao menos um ponto de
atenção.

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
| Rascunho do Relatório a partir de evidências | previsto (§8.3) | **pendente** — funcionalidade futura, missão própria | — |
| Ordenação interna de leitura | permitida (§8.2) | **sem chave definida** — a ordenação pelo total combinado foi removida junto com ele; escolher a nova chave (técnica? assistencial?) é decisão de domínio e exige ADR. Até lá, a comparação apresenta na ordem da Rede | — |

Nenhuma pendência autoriza mudança de código sem missão específica que
referencie este documento e ajuste esta tabela.

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
