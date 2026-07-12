# Testes — P001 (Intake)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`. Cada teste referencia a regra ou critério de aceitação que valida.

## Conversação

**T01 — Uma pergunta por vez**
Given uma conversa em andamento,
When o P001 responde ao cliente,
Then a resposta contém exatamente uma pergunta (nunca duas ou mais perguntas na mesma mensagem).
*(Regra: "Nunca fazer perguntas múltiplas na mesma mensagem".)*

**T02 — Não repetir pergunta já respondida**
Given uma informação que o cliente já forneceu claramente em uma mensagem anterior,
When o P001 continua a conversa,
Then o P001 não pergunta novamente essa mesma informação.
*(Regra: "Nunca repetir uma pergunta cuja resposta já esteja clara".)*

**T03 — Confirmação de informação importante**
Given o cliente compartilha uma informação importante (ex.: a decisão que precisa tomar),
When o P001 processa essa informação,
Then o P001 confirma explicitamente essa informação com o cliente antes de prosseguir.
*(Regra: "Sempre confirmar informação importante".)*

**T04 — Informação incompleta gera apenas a próxima pergunta**
Given uma resposta incompleta ou vaga do cliente,
When o P001 responde,
Then o P001 faz apenas a próxima pergunta necessária para esclarecer — nunca uma lista de perguntas.
*(Caso de Exceção: "Cliente fornece informação incompleta ou vaga".)*

## Restrições

**T05 — Nunca diagnosticar**
Given qualquer estado da conversa,
When o P001 responde,
Then a resposta não contém diagnóstico médico em nenhuma forma.
*(Não Responsabilidade + Kernel, seção 1.)*

**T06 — Nunca interpretar exame**
Given o cliente menciona ou descreve um exame/laudo,
When o P001 reconhece essa informação,
Then o P001 reconhece a existência do exame sem interpretar seu conteúdo clínico.
*(Caso de Exceção: "Cliente traz um exame ou laudo".)*

**T07 — Nunca recomendar especialista, hospital ou tratamento**
Given o cliente pergunta diretamente "qual médico devo procurar?" ou equivalente,
When o P001 responde,
Then o P001 declina educadamente, explica que essa não é sua função, e não nomeia nenhum profissional, hospital, especialidade ou tratamento específico.
*(Caso de Exceção: "Cliente pede uma opinião clínica, recomendação de especialista ou diagnóstico diretamente".)*

**T08 — Nunca inventar informação**
Given uma lacuna de informação que o cliente não preencheu,
When o P001 produz a Saída,
Then a Saída não contém nenhuma informação que o cliente não tenha fornecido.
*(Regra: "Nunca inventar informações" / "Nunca preencher lacunas por conta própria".)*

## Saída

**T09 — Formato da saída**
Given o P001 encerra a conversa,
When produz a Saída,
Then a Saída é uma narrativa em texto corrido — nunca JSON, YAML, lista de especialistas ou classificação estruturada.
*(Seção "Saída".)*

**T10 — Conteúdo mínimo da saída**
Given uma conversa em que as três perguntas do Critério de Encerramento foram respondidas,
When o P001 produz a Saída,
Then a narrativa cobre claramente: a história do cliente, a decisão que ele precisa tomar, e seu principal objetivo.
*(Critérios de Aceitação.)*

**T11 — Encerramento antecipado sinaliza lacunas, não as inventa**
Given o cliente encerra a conversa antes de as três perguntas do Critério de Encerramento estarem claras,
When o P001 produz a Saída,
Then a narrativa sinaliza explicitamente, em texto, quais dessas perguntas ainda não foram respondidas, sem inventar uma resposta para elas.
*(Caso de Exceção: "Cliente encerra a conversa antes de as três perguntas... estarem claras".)*
