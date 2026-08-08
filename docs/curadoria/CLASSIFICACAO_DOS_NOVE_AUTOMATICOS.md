# Classificação dos Nove Conceitos Automáticos e Seleção do Alvo da Regra Inaugural

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **Emitida** — análise arquitetural e de Método; nível derivado, datado |
| **Base** | `846d594` |
| **Origem** | Decisão do **DT-01**: classificar os nove por **natureza funcional** antes de escolher o alvo — ser `automatico` é condição **necessária, não suficiente** |
| **Fonte** | Catálogo gerado no HEAD, lido diretamente (nenhuma lista copiada de relatório anterior) |

---

## 1. Os nove, provados na fonte

Varredura do catálogo no HEAD por `cruzamento: "automatico"` **e** `active: true`
— resultado: **exatamente nove**, os mesmos que o `CONTRATO_1_A` §7 e o emissor
do 2.C reconhecem como estruturalmente elegíveis.

## 2. Matriz de classificação

| Conceito | Eixo | Pergunta da pessoa | Pergunta do profissional | Evidência | `satisfied_by` | Estado absoluto derivável? | **Natureza** | Elegível à 001? |
|---|---|---|---|---|---|---|---|---|
| `MODELO_COMUNICACAO` | MODELO | "O que te ajudaria a entender melhor o que for explicado?" | "…quais dessas ações você costuma realizar?" | entrevista | **SIM** | **não** — §5.1 do domínio define pairwise | **PAIRWISE** | não |
| `MODELO_PARTICIPACAO_FAMILIAR` | MODELO | "Você quer que alguém participe das conversas?" | "Como você conduz a presença de acompanhantes?" | entrevista | **SIM** | não | **PAIRWISE** | não |
| `MODELO_ALTERNATIVAS` | MODELO | "O que você precisa saber antes de aceitar um tratamento?" | "Ao propor uma conduta, quais dessas você costuma apresentar?" | entrevista | **SIM** | não | **PAIRWISE** | não |
| `ACESSO_MODALIDADE` | ACESSO | "Como você consegue ser atendida?" | "Em quais formatos você atende hoje?" | institucional | não | **fato sim; estado não** (§4) | **HÍBRIDO** | não |
| `ACESSO_DISPONIBILIDADE` | ACESSO | "Quando você consegue ser atendida?" | "Em quais janelas você atende habitualmente?" | institucional | não | **fato sim; estado não** (§4) | **HÍBRIDO** | não |
| `ACESSO_PRAZO_PARA_CONSULTA` | ACESSO | "Em quanto tempo você precisa ser atendida?" | "Qual o prazo habitual para a primeira consulta?" | institucional | não | **fato sim; estado não** (§4) | **HÍBRIDO** *(componente Concierge: encaixe)* | não |
| `CONTINUIDADE_CANAIS` | CONTINUIDADE | "Você precisa conseguir falar com alguém entre as consultas?" | "Entre uma consulta e outra, como a pessoa consegue contato?" | institucional | não | tem negativa explícita, mas… | **CONCIERGE_OPERACIONAL** (§6) | **não — decisão DT-01** |
| `CONTINUIDADE_COORDENACAO` | CONTINUIDADE | "…outros profissionais que precisariam conversar entre si?" | "Quando a pessoa já é acompanhada por outros profissionais, o que você costuma fazer?" | entrevista | não | **SIM** — negativa explícita `ATUA_DE_FORMA_INDEPENDENTE` | **PROFISSIONAL_ABSOLUTO** *(com nota Concierge)* | **SIM** |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | CONTINUIDADE | "Você precisa de acompanhamento de mais de um tipo de profissional?" | "Quem mais acompanha as pessoas que você atende?" | institucional | não | **SIM** — negativa explícita `ATUA_SEM_EQUIPE_FIXA` | **PROFISSIONAL_ABSOLUTO** *(ressalva §13)* | **SIM** |

**Contagem: 2 `PROFISSIONAL_ABSOLUTO` · 3 `PAIRWISE` · 1 `CONCIERGE_OPERACIONAL`
· 3 `HÍBRIDO` · 0 `INDETERMINADO`.**

## 3. O critério que separou tudo — a **negativa declarada**

O teste do §18 exige `NAO_CONFIRMADO` **apenas por fato negativo explícito**. Só
**três** conceitos oferecem uma opção que declara a ausência:

| Conceito | Opção de negativa explícita |
|---|---|
| `CONTINUIDADE_COORDENACAO` | **`ATUA_DE_FORMA_INDEPENDENTE`** |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | **`ATUA_SEM_EQUIPE_FIXA`** |
| `CONTINUIDADE_CANAIS` | `NAO_HA_CANAL_ENTRE_CONSULTAS` — mas o conceito é do Concierge (§6) |

**É isso que torna o estado absoluto semanticamente coerente**: `CONFIRMADO` =
declarou conduta/estrutura de coordenação; `NAO_CONFIRMADO` = **declarou que não
a tem**; ausência de evidência = **nenhuma proposta**. Os três braços ganham
significado sem inventar nada — exatamente o que faltou em `MODELO_COMUNICACAO`.

## 4. Por que os três `ACESSO_*` são HÍBRIDOS, e não absolutos

Os fatos **são** absolutos ("atendo presencial e remoto"; "atendo manhãs de dias
úteis"; "prazo habitual: 8–15 dias") — passam nos testes 1–9 do §7. **Falha o
teste 10**: o estado `CONFIRMADO/NAO_CONFIRMADO` **não tem significado
absoluto**. Todo profissional atende em *algum* formato, em *alguma* janela, com
*algum* prazo — "confirmado" só significa algo contra **o que esta pessoa
precisa** (a pergunta dela é literalmente "*Como* você consegue ser atendida?",
"*Quando*", "*Em quanto tempo*"). São conceitos de **correspondência**, e sem
`satisfied_by` **nem sequer têm a correspondência declarada** — estão numa
situação pior que a do `MODELO_COMUNICACAO`, não melhor.

**Conclusão que importa para o Método:** esses três precisam de
`satisfied_by`/faixa de correspondência para funcionar, ou de um estado de
natureza diferente (valor, não booleano). **É pauta própria, não Regra 001.**

*(Nota do §10 respondida: em `ACESSO_DISPONIBILIDADE` o Catálogo modela a
**disponibilidade real** — "janelas em que atende habitualmente" —, não a gestão
de agenda. A distinção do DT-01 está correta e o Catálogo está do lado certo;
o problema aqui não é Concierge, é ausência de semântica de estado.)*

## 5. Por que os três `MODELO_*` são PAIRWISE

Todos têm `satisfied_by` no lado da pessoa, e o
[`DOMINIO_COMPATIBILIDADE_RELACIONAL` §5.1](DOMINIO_COMPATIBILIDADE_RELACIONAL.md)
— anexo **congelado** da ADR-065 — define o estado deles **em função das opções
pedidas pela pessoa**, implementado em `deriveRelationalState(concept,
personOptions, evidence)`. **Confirmado por autoridade, não só pela presença da
coluna** (§16 da missão). Nada a criar: `MODELO_COMUNICACAO` permanece pairwise,
sem B3, sem conjunto mínimo absoluto.

## 6. IMPACTO DO CONCIERGE ALIVIAR NO MODELO

| Conceito | Hoje atribuído ao médico | O que a Aliviar pode assumir | O que continua fato do médico | Exige decisão de catálogo? | Antes do go-live? |
|---|---|---|---|---|---|
| **`CONTINUIDADE_CANAIS`** | existir canal entre consultas, prazo de resposta, meio (mensagem/telefone/portal) | **quase tudo**: ser o canal, triar, encaminhar, garantir prazo, lembrar, dar retorno | resta pouco — no máximo *"aceita ser acionado pelo canal da Aliviar"*, que **não é o que o conceito pergunta** | **SIM** — o conceito mede hoje algo que a Aliviar pretende prover | **decisão antes de o conceito virar regra**; observável depois se ficar sem regra |
| `ACESSO_PRAZO_PARA_CONSULTA` | prazo habitual da primeira consulta | **negociar encaixe, buscar vaga, acompanhar fila** | o **prazo habitual** continua fato do serviço dele | não urgente | pode observar depois |
| `CONTINUIDADE_COORDENACAO` | conduta clínica: contatar colega, enviar relatório, discutir caso | **logística**: obter contato, organizar documentos, agendar a conversa | **a conduta clínica permanece dele** — coordenar-se *é* ato médico | não | não |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | equipe que acompanha suas pessoas | **a Rede** pode complementar (não o Concierge) | **a equipe da prática dele** permanece fato dele | não | não |

> **O princípio, aplicado:** o Método não classifica o médico negativamente por
> função que a Aliviar pretende suprir. Em `CONTINUIDADE_CANAIS`, `NAO_CONFIRMADO`
> diria *"este médico não tem canal"* justamente onde a Aliviar **é** o canal —
> mediria a lacuna errada. **A decisão do DT-01 de retirá-lo dos candidatos está
> tecnicamente correta.**
>
> *(Redesenho do Concierge é pauta separada — §24 da missão respeitado.)*

## 7. Ranking dos `PROFISSIONAL_ABSOLUTO`

### **CANDIDATO 1 — `CONTINUIDADE_COORDENACAO`** ★ recomendado

`CONFIRMADO` = *o profissional declarou ao menos uma conduta de coordenação com
outros profissionais que acompanham a pessoa*. `NAO_CONFIRMADO` = declarou
**`ATUA_DE_FORMA_INDEPENDENTE`** — negativa explícita, não inferida. Ausência de
evidência ⇒ **nenhuma proposta**.

**Por que primeiro**: é **conduta clínica**, não estrutura nem logística — o
Concierge pode agendar a conversa, mas **não pode conversar pelo médico** ·
fonte **`entrevista`** (declaração estruturada do próprio profissional, autoria
clara) · quatro condutas positivas nitidamente distintas + uma negativa
explícita · independe totalmente do Case · zero sobreposição com `satisfied_by`
· **altíssimo valor de Curadoria** — coordenação é exatamente o que uma pessoa
com vários médicos precisa saber · fácil de explicar ao Curador em uma frase ·
e a observação R-1 será **informativa**: se o Curador recusar, aprende-se algo
sobre a distância entre declarar e praticar.

### **CANDIDATO 2 — `CONTINUIDADE_EQUIPE_DE_APOIO`**

`CONFIRMADO` = declarou ao menos um tipo de profissional na equipe;
`NAO_CONFIRMADO` = **`ATUA_SEM_EQUIPE_FIXA`**. Igualmente limpo em forma.
**Fica em segundo pela ressalva do §13**: `evidenceSource: institucional`, e a
composição de equipe **varia por local de atendimento** enquanto o Mapa guarda
**um estado por profissional** — ambiguidade institucional real, que o §13
manda evitar na inaugural.

### **CANDIDATO 3 — não há terceiro.**

Os outros sete são pairwise, híbridos ou do Concierge.

## 8. Perguntas obrigatórias

| # | Resposta |
|---|---|
| Q1 | `ACESSO_MODALIDADE` · `ACESSO_DISPONIBILIDADE` · `ACESSO_PRAZO_PARA_CONSULTA` · `CONTINUIDADE_EQUIPE_DE_APOIO` · `CONTINUIDADE_COORDENACAO` · `CONTINUIDADE_CANAIS` · `MODELO_COMUNICACAO` · `MODELO_PARTICIPACAO_FAMILIAR` · `MODELO_ALTERNATIVAS` — **exatamente nove** |
| Q2 | **2** |
| Q3 | **3** |
| Q4 | **1** |
| Q5 | **3** |
| Q6 | **nenhum** |
| Q7 | os três `MODELO_*` |
| Q8 | **SIM** — e confirmado por autoridade (§5.1 congelado), não só pela coluna |
| Q9 | os três `ACESSO_*` e os três `CONTINUIDADE_*` |
| Q10 | **NÃO** — os três `ACESSO_*` provam o contrário (§4) |
| Q11 | **NÃO** — fato absoluto, mas **estado** sem significado absoluto |
| Q12 | não definida — "atende em algum formato" é trivialmente verdadeiro |
| Q13 | não definível sem a necessidade da pessoa |
| Q14 | **NÃO** — mesma razão |
| Q15 | **SIM** — o Catálogo modela **disponibilidade real** ("janelas em que atende"), não gestão de agenda |
| Q16 | a **gestão** (buscar horário, reagendar, acompanhar vaga) — não modelada no conceito |
| Q17 | **SIM** — sai; **`CONCIERGE_OPERACIONAL`** |
| Q18 | resta pouco, e **não é o que o conceito pergunta** — a parte medida é a que a Aliviar pretende prover |
| Q19 | **SIM** — `CONTINUIDADE_EQUIPE_DE_APOIO` é candidato 2 |
| Q20 | **SIM** — `CONTINUIDADE_COORDENACAO` é o **candidato 1** |
| Q21 | **NÃO** — os três são pairwise por autoridade |
| Q22 | **SIM** — em `CONTINUIDADE_CANAIS`, e parcialmente em `ACESSO_PRAZO_PARA_CONSULTA` |
| Q23 | **NÃO para a Regra 001** (basta não escolhê-los); **SIM antes de qualquer regra sobre eles** |
| Q24 | **`CONTINUIDADE_COORDENACAO`** |
| Q25 | **`CONTINUIDADE_EQUIPE_DE_APOIO`** |
| Q26 | **não há terceiro** |
| Q27 | **SIM, ambos** — a semântica de estado é fixada **pela própria regra versionada** (ADR-069), sem tocar Catálogo, `satisfied_by`, matriz ou ADR-065; **nenhuma ADR nova** |
| Q28 | **`CONTINUIDADE_COORDENACAO`** — zero intervenção arquitetural |
| Q29 | **`CONTINUIDADE_COORDENACAO`** — conduta declarada × conduta praticada é o eixo onde a discordância **ensina** |
| Q30 | **`CONTINUIDADE_COORDENACAO`** |

## 9. Veredito

> ### HÁ CANDIDATO LEGÍTIMO À REGRA INAUGURAL
>
> **1º `CONTINUIDADE_COORDENACAO`** (recomendado) · **2º
> `CONTINUIDADE_EQUIPE_DE_APOIO`** (ressalva institucional do §13) · sem
> terceiro.

**Por que os dois passam onde os outros falharam**: são os únicos conceitos
automáticos que oferecem **negativa declarada** — e é a negativa que dá
significado absoluto aos três estados sem inventar semântica alguma.

**Decisão material remanescente (menor, do mesmo tipo já registrado)**: o estado
de verificação da evidência (`entrevista`/`institucional`) segue sem política
lavrada — recomendação: admitir não verificada, com o estado acompanhando sem
contaminar (I-5). Decisão da Autoridade, na lavratura da regra.

**Pauta separada registrada, não resolvida**: (a) os três `ACESSO_*` precisam de
correspondência declarada ou de estado de natureza diferente antes de qualquer
regra; (b) `CONTINUIDADE_CANAIS` precisa de decisão de produto sobre o Concierge
antes de medir o médico por ele.

**CD-1 intacta** — nenhuma classificação usou grau, importância, ponte ou
`case_needs`. **R-1 aberta.** **FORMAÇÃO/EXPERIÊNCIA/HISTÓRICO não reclassificados.**
