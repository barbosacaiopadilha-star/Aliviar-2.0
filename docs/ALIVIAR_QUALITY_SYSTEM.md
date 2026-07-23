# Aliviar Quality System (AQS)

**Estado**: **Proposto** — aguardando aprovação do responsável do projeto.

**Autoridade**: obrigatório para Portal do Curador, Portal do Paciente, treinamento, auditoria, expansão da empresa, certificação de Curadores e evolução futura do Método.

**O que o AQS mede.** A qualidade da **Curadoria** — não o desempenho de médicos, não satisfação por estrelas, não produtividade de pessoas.

**Princípio fundador:**

> **Uma Curadoria excelente precisa ser excelente independentemente de quem a conduziu.**

O Método existe para produzir consistência. Se a qualidade depende do talento individual do Curador, não há método — há sorte na alocação. O AQS é o instrumento que verifica se o Método está, de fato, produzindo o que promete.

**Nenhuma funcionalidade foi criada. Nenhuma regra de metodologia, ontologia ou experiência foi alterada** — o AQS mede o que já está definido nos documentos canônicos.

---

## 1. A taxonomia que organiza tudo

Antes dos critérios, a distinção que evita o desperdício clássico de um sistema de qualidade: **pedir que humanos verifiquem o que o software já torna impossível.**

Todo critério do AQS pertence a uma de três classes:

| Classe | O que significa | Quem verifica |
|---|---|---|
| **Estrutural** | Violar é impossível — o schema ou o Motor impedem | Ninguém. Já está garantido |
| **Verificável** | Uma regra fechada decide, sem julgamento | O sistema, automaticamente |
| **Julgado** | Exige leitura humana; não há regra que substitua | Curador, par ou auditor |

**A regra derivada:** o checklist oficial (§3) contém **apenas critérios Julgados**. Pedir ao Curador que confirme "todo peso tem evidência" seria teatro — o banco recusa um peso sem evidência. Checklist que verifica o impossível treina a marcar caixa sem ler.

Quando um critério Julgado for mecanizado no futuro, ele **sai** do checklist e entra em Verificável. O checklist encolhe conforme o sistema amadurece — nunca cresce por acúmulo.

---

## 2. Critérios de qualidade

Uma Curadoria é excelente quando os doze critérios abaixo são verdadeiros.

### Compreensão

**Q-01 — A história foi compreendida, não coletada.** *(Julgado)*
Houve o momento de devolução e o paciente reconheceu a própria história.
*Verificação:* existe registro de confirmação de compreensão, e a narrativa registrada é prosa em linguagem de pessoa — não uma lista de campos.
*Falha típica:* narrativa que parece formulário transcrito.

**Q-02 — O Caso separa fato de interpretação.** *(Julgado)*
Diagnóstico e hipótese aparecem como **relatados**, nunca emitidos pela Aliviar.
*Verificação:* leitura do Caso; nenhuma afirmação clínica sem origem declarada.

### Prioridades

**Q-03 — O Perfil foi validado pelo paciente.** *(Estrutural)*
Sem validação não existe Curadoria. Garantido por schema.

**Q-04 — Todo peso carrega Evidência de Curadoria.** *(Estrutural)*
`evidence` é `NOT NULL` e não-vazio.

**Q-05 — A distribuição soma exatamente 100.** *(Estrutural)*
Trigger de banco no momento da validação.

**Q-06 — As evidências são falas, não paráfrases do Curador.** *(Julgado)*
A evidência registra o que o paciente disse, preferencialmente nas palavras dele.
*Verificação:* leitura. Uma evidência que soa como conclusão do Curador (*"paciente valoriza continuidade"*) é insuficiente; a fala é o que sustenta.
*Este é o critério Julgado mais importante do AQS* — é ele que separa um Perfil que pertence ao paciente de um Perfil que o Curador achou correto.

**Q-07 — Os pesos são coerentes com a história.** *(Julgado)*
Cada peso alto encontra correspondência no que foi contado.
*Verificação:* leitura cruzada história ↔ pesos. Um peso de 40 sem nenhum eco na narrativa é sinal de que veio do Curador.

**Q-08 — Nenhum aspecto é filtro e critério ao mesmo tempo.** *(Verificável)*
Detectado como I-03 pelo Motor de Condução.

### Análise

**Q-09 — Toda compatibilidade é explicável em uma frase.** *(Verificável)*
Nenhum resultado de dimensão sem explicação — bloqueado como I-08.

**Q-10 — A seleção tem autoria humana e justificativa própria.** *(Estrutural + Julgado)*
Autoria é estrutural (`selected_by` obrigatório). A **qualidade** da justificativa de composição é julgada.

### Entrega

**Q-11 — As justificativas passam nos três testes.** *(Julgado)*
Nomeia o critério do paciente; diz o que a opção custa; poderia ser lida em voz alta sem tradução (Experiência §Momento 7).

**Q-12 — A autonomia foi preservada.** *(Julgado)*
Os oito vetores de indução fechados; o paciente poderia ter escolhido qualquer uma das três.
*Verificação:* leitura do Relatório e do registro da devolutiva.

---

## 3. Checklist oficial — antes da entrega do Relatório

Sete itens. **Todos Julgados** — nenhum verifica o que o sistema já garante.

O checklist é assinado pelo Curador e fica na Memória da Curadoria. Assinar sem ler é uma falha de conduta, não um detalhe de processo.

| # | Item | Pergunta que o Curador responde a si mesmo |
|---|---|---|
| 1 | **História compreendida** | Se eu lesse esta narrativa em voz alta para o paciente, ele diria "é exatamente isso"? |
| 2 | **Caso estruturado sem opinião clínica** | Alguma frase aqui é minha conclusão em vez do relato dele? |
| 3 | **Evidências são falas** | Cada evidência é o que ele disse, ou o que eu concluí? |
| 4 | **Pesos ecoam a história** | Cada peso alto tem correspondência no que ele contou? |
| 5 | **Análises revisadas** | Eu entendi por que cada opção ficou onde ficou — e discordo de alguma? |
| 6 | **Justificativas completas** | Cada uma nomeia o critério dele, diz o que custa, e eu leria em voz alta sem mudar palavra? |
| 7 | **Entrega preparada** | Sei explicar as diferenças sem consultar a tela, e sei o que responder se ele perguntar qual eu escolheria? |

**O item 5 é o único que pede discordância explícita.** Um Curador que nunca discorda da ordenação está homologando o cálculo, não exercendo julgamento — e isso viola o princípio fundador do Método.

---

## 4. Critérios de revisão

Situações em que uma Curadoria **retorna** antes de seguir. Objetivas, sem julgamento sobre a pessoa.

| Código | Gatilho | Classe | Retorna para |
|---|---|---|---|
| **R-01** | Inconsistência do Motor não resolvida (I-01 a I-13) | Verificável | Fase de origem |
| **R-02** | Peso sem correspondência na história | Julgado | Priorizar |
| **R-03** | Evidência que é paráfrase, não fala | Julgado | Priorizar |
| **R-04** | Justificativa que não passa nos três testes | Julgado | Relatório |
| **R-05** | Opção sem trade-off declarado | Verificável | Relatório |
| **R-06** | Linguagem de ranking ou score no conteúdo do paciente | Verificável | Relatório |
| **R-07** | Alguma pergunta da reconstrução sem resposta | Verificável | Fase de origem |
| **R-08** | Paciente respondeu "nenhuma destas" | Verificável | Priorizar |
| **R-09** | Cobertura média de cadastro abaixo de 50% | Verificável | Governança do cadastro |

**R-08 merece nota.** "Nenhuma destas" **nunca** é falha do paciente — é sinal de que alguma etapa anterior não capturou algo. O retorno é do processo, não dele, e a conversa que se segue começa por *"o que faltou?"*.

**Nenhum critério de revisão é acionado por tempo.** Curadoria não retorna por estar demorando.

---

## 5. Padrão de documentação

Toda Curadoria concluída produz um **Dossiê** com seis peças. Nenhuma é opcional.

| Peça | Conteúdo | Quem pode ler |
|---|---|---|
| **Dossiê** | O invólucro: identificação do Caso, Curador responsável, datas de abertura e conclusão | Paciente, equipe, auditoria |
| **Perfil de Prioridades** | Critérios, pesos, evidências, restrições, observações, registro da validação | Paciente, equipe, auditoria |
| **Memória da Curadoria** | Linha do tempo completa, com autor e instante em cada entrada | Paciente (sem nível interno), equipe, auditoria |
| **Relatório** | As três opções com justificativa, relação com os pesos, trade-offs e perguntas sugeridas | Paciente, equipe, auditoria |
| **Registro da escolha** | A decisão, a data, e a justificativa se houver — inclusive "nenhuma destas" | Paciente, equipe, auditoria |
| **Histórico** | Análises completas, exclusões com motivo, scores internos, cobertura, checklist assinado | Equipe e auditoria apenas |

**Regra de completude:** um Caso não pode ser encerrado com uma peça faltando. **Regra de imutabilidade:** nenhuma peça é editada depois de fechada; correção gera nova versão com o motivo registrado.

---

## 6. Processo de auditoria

### Quando acontece

| Tipo | Frequência | Escopo |
|---|---|---|
| **Amostral** | Contínua | Uma Curadoria concluída a cada dez, sorteada — nunca escolhida |
| **Dirigida** | Sob gatilho | Toda Curadoria com R-08 (nenhuma destas), troca de profissional em menos de 60 dias, ou reclamação |
| **De certificação** | Por Curador | As três primeiras Curadorias de um Curador em homologação (§8) |
| **De método** | Trimestral | Leitura transversal de todas as auditorias do período, buscando padrão |

O sorteio da amostral é obrigatório. Auditar os casos que "parecem problemáticos" mede a intuição de quem escolhe, não a qualidade do Método.

### Como revisar uma Curadoria meses depois

Quatro passos, nesta ordem:

1. **Reconstruir sem conversar com ninguém.** O auditor lê só o Dossiê. Se precisar perguntar ao Curador o que aconteceu, a trilha já falhou — e isso é o primeiro achado.
2. **Rodar as nove perguntas da reconstrução** (Engine §5.6). Cada uma respondida ou não, sem meio-termo.
3. **Aplicar os doze critérios de qualidade**, ignorando os Estruturais (já garantidos) e verificando os Verificáveis e Julgados.
4. **Emitir veredito.**

### Como identificar falhas metodológicas

O auditor procura três coisas, e só três:

- **Divergência entre o que foi decidido e o que foi registrado** — a seleção não corresponde às justificativas escritas.
- **Ausência que deveria ser presença** — uma etapa aconteceu na conversa mas não existe no registro.
- **Autoria trocada** — algo que deveria ser do paciente aparece como do Curador, ou algo que deveria ser humano aparece como do sistema. **É a falha mais grave que uma auditoria pode encontrar**, porque atinge o núcleo do Método.

### Veredito

| Veredito | Significado | Consequência |
|---|---|---|
| **Conforme** | Doze critérios atendidos, nove perguntas respondidas | Nenhuma |
| **Conforme com observação** | Critérios atendidos; algo digno de registro | Entra na auditoria de método trimestral |
| **Não conforme — processo** | Um critério Julgado falhou | Devolução ao Curador com o critério nomeado |
| **Não conforme — sistema** | A trilha não permitiu reconstruir | Correção do sistema, nunca do Curador |

**A distinção entre as duas não-conformidades é obrigatória.** Culpar o Curador por uma lacuna que o sistema não permitiu registrar destrói a confiança no AQS e não corrige nada.

---

## 7. Melhoria contínua

### A regra de origem

Toda mudança do Método nasce de **caso real, evidência, auditoria ou feedback estruturado**. Nunca de opinião isolada, por mais experiente que seja quem opina.

### O ciclo

```
Caso real → Achado registrado → Padrão identificado → Proposta → Análise de impacto → Decisão → Registro
```

**Um achado isolado não muda nada.** É registrado e fica. Só quando o mesmo achado aparece pela **terceira vez** ele obriga uma decisão explícita — a mesma regra de três já vigente na governança documental do projeto.

Isso protege o Método de duas coisas: da reação exagerada a um caso atípico, e do acúmulo silencioso de problemas que ninguém contou.

### Fontes válidas de achado

| Fonte | O que produz |
|---|---|
| Auditoria amostral | Achados de conformidade |
| Auditoria de método | Padrões transversais |
| Revisão entre pares | Divergências de julgamento |
| Curador em operação | Fricção real observada na conversa |
| Paciente | Feedback sobre a experiência, nunca sobre o médico |
| Motor | Frequência de cada exceção e inconsistência |

**A frequência de exceções do Motor é a fonte mais objetiva que existe.** Se E-02 (menos de três elegíveis) dispara em 30% dos casos, o problema não é o Método — é a rede aprovada, e o achado pertence à governança do cadastro.

---

## 8. Indicadores internos

### A fronteira, primeiro

Existe uma tensão real entre este capítulo e a Experience Bible §3, que proíbe painel de métricas no Portal do Curador ("a pressa é inimiga direta do Método"). A resolução não relativiza nenhum dos dois:

> **O AQS mede o Método, nunca a pessoa. Nenhum indicador aparece no Portal do Curador, e nenhum indicador é apurado por Curador para fins de comparação.**

Três proibições absolutas decorrem disso:

1. **Nenhum ranking de Curadores**, em nenhuma superfície, para nenhuma finalidade.
2. **Nenhum indicador visível ao Curador durante o trabalho.**
3. **Nenhum indicador de velocidade tratado como meta.** Tempo é medido para verificar se a Aliviar cumpre o que prometeu ao paciente — nunca para pedir que o Curador acelere.

A única exceção é a auditoria de certificação (§8), em que os indicadores de um Curador específico são lidos — com ele presente, e para formação, nunca para classificação.

### Os indicadores

| Código | Indicador | O que revela | Lido por |
|---|---|---|---|
| **IND-01** | Prazo prometido cumprido | Se a Aliviar cumpre o que combina — o compromisso que sustenta o momento de maior risco da jornada | Trimestral |
| **IND-02** | Perfil validado no primeiro encontro | Se a conversa está conseguindo chegar ao critério | Trimestral |
| **IND-03** | Correções feitas pelo paciente na validação | Se o Perfil é dele. **Um número muito baixo é sinal ruim**, não bom | Trimestral |
| **IND-04** | Taxa de retorno para revisão, por critério R-xx | Onde o Método trava com mais frequência | Trimestral |
| **IND-05** | Frequência de cada exceção do Motor | Se o problema é o Método ou a rede aprovada | Contínuo |
| **IND-06** | Cobertura média de cadastro | Saúde da rede, não do Curador | Contínuo |
| **IND-07** | Completude documental do Dossiê | Se a documentação está sendo produzida de fato | Contínuo |
| **IND-08** | Perguntas da reconstrução respondidas | Se a Memória cumpre o teste | Contínuo |
| **IND-09** | Frequência de "nenhuma destas" | Se as opções estão chegando adequadas | Trimestral |
| **IND-10** | Conformidade nas auditorias amostrais | Consistência do Método entre Curadores | Trimestral |

**IND-03 é o indicador mais contraintuitivo do AQS e o mais fiel ao Método.** Se os pacientes quase nunca corrigem nada durante a validação, isso não significa que os Curadores estão acertando — significa, provavelmente, que os pacientes estão concordando por educação. Um número saudável é alto.

### Métricas explicitamente proibidas

Casos por Curador · tempo médio de atendimento como meta · satisfação por estrelas · NPS do médico · volume mensal · comparação entre Curadores · qualquer indicador que apareça na tela de quem está atendendo.

---

## 9. Certificação de Curadores

### Os três níveis

| Nível | Pode | Não pode |
|---|---|---|
| **Em formação** | Observar Curadorias; conduzir com Curador certificado presente | Conduzir sozinho; assinar entrega |
| **Em homologação** | Conduzir sozinho | Entregar sem revisão entre pares |
| **Certificado** | Conduzir e entregar de forma autônoma | — |

### Critérios para homologação → certificado

Todos obrigatórios:

1. **Três Curadorias completas auditadas**, todas com veredito Conforme ou Conforme com observação.
2. **Nenhuma falha de autoria** em nenhuma delas — o erro que atinge o núcleo do Método é eliminatório, não somável.
3. **Avaliação de condução**: um Curador certificado observa uma Consulta Inicial completa e avalia quatro coisas, todas Julgadas — se a escuta aconteceu antes da estruturação; se a devolução foi feita; se os pesos nasceram de perguntas de troca em vez de números; se a liturgia da validação foi seguida.
4. **Avaliação escrita de justificativas**: dado um Caso real anonimizado com Perfil e análises, o candidato escreve as três justificativas e a de composição. Avaliadas pelos três testes do Momento 7.
5. **Prova de resposta**: como ele responde a *"qual você escolheria?"*. Devolver ao critério do paciente é aprovação; dar opinião é reprovação imediata.

### Homologação

Assinada por um Curador certificado que **não** conduziu nenhuma das Curadorias auditadas, e registrada com data e nome. Certificação não se autodeclara.

### Recertificação

Anual, por auditoria amostral. Uma não conformidade de processo não descertifica — devolve à homologação até três novas Curadorias conformes. Uma falha de autoria descertifica imediatamente.

---

## 10. Revisão entre pares

### Quando é obrigatória

Gatilhos objetivos, nunca escolha subjetiva:

| Gatilho | Motivo |
|---|---|
| Curador em homologação | Toda entrega dele |
| Conflito C-01 (empate) na composição | A composição foi julgamento puro, sem apoio do cálculo |
| Exceção E-02 resolvida por revisão de restrições | Restrições mudaram durante o processo |
| Cobertura média abaixo de 50% | A análise se apoiou em pouco dado |
| Alguma opção com incompatibilidade forte | O trade-off precisa ser confirmado por outro olhar |
| A pedido do próprio Curador | Sempre disponível, nunca registrado como fraqueza |

### Como acontece

O par lê **apenas o Dossiê**, sem conversar com o Curador antes — pelo mesmo motivo da auditoria: se precisar perguntar, a trilha falhou.

Responde três perguntas, e só três:

1. As três opções se sustentam a partir deste Perfil?
2. Alguma justificativa não passa nos três testes?
3. Existe indício de indução em algum lugar?

### Como termina

O par **não altera nada**. Devolve com observações; o Curador responsável decide o que fazer, e a decisão dele fica registrada — inclusive quando é discordar. Revisão entre pares informa; nunca sobrepõe autoria.

Divergência persistente entre dois Curadores certificados não é resolvida por antiguidade nem por votação: vira **achado de método** (§7) e sobe para governança.

---

## 11. Governança

### Nenhuma alteração do Método acontece sem quatro coisas

1. **Justificativa** ancorada em caso real, evidência ou auditoria — nunca em opinião.
2. **Registro** formal como decisão versionada.
3. **Análise de impacto** sobre os documentos canônicos, o COS, os Portais, o treinamento e as Curadorias em andamento.
4. **Aprovação formal** do responsável pelo projeto.

### Hierarquia de autoridade

```
Fundamentos → Ontologia → Experiência → Engine → AQS → COS → Portais
```

Uma mudança em um nível obriga análise de impacto em **todos** os níveis abaixo. Um nível inferior nunca contradiz um superior; quando a implementação diverge da especificação, é a implementação que se corrige.

### O que acontece com as Curadorias em andamento

Uma mudança do Método **nunca se aplica retroativamente** a uma Curadoria em curso. O Perfil validado sob a versão anterior permanece válido sob ela. A versão do Método fica registrada no Dossiê.

### O que nunca muda sem nova Constituição

Os catorze princípios dos Fundamentos §13. Alterar qualquer um deles não é evolução do Método — é fundar outro.

---

## 12. Pendências

Registradas, não resolvidas. Nenhuma bloqueia a aprovação deste documento.

1. **Checklist não existe no sistema** — os sete itens são de conduta hoje, sem campo, sem assinatura, sem persistência na Memória.
2. **Nenhum indicador é apurável** — IND-01 depende de prazo modelado, que não existe; IND-03 depende de registro de correções, que existe só como texto livre.
3. **Auditoria sem superfície** — não há tela de auditor, nem sorteio de amostra.
4. **Dossiê não é gerado** — as seis peças existem separadas; nada as reúne nem impede encerrar um Caso incompleto.
5. **Certificação sem registro** — não há papel "Curador em formação" ou "em homologação" no catálogo de papéis.
6. **Revisão entre pares sem mecanismo** — nenhum gatilho é disparado automaticamente.

---

## 13. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-23 | Primeira versão — MISSÃO 104. Taxonomia Estrutural/Verificável/Julgado, 12 critérios de qualidade, checklist de 7 itens só de julgamento, 9 critérios de revisão, padrão de Dossiê com 6 peças, processo de auditoria com 4 tipos e 4 vereditos, ciclo de melhoria contínua com regra de três, 10 indicadores com fronteira explícita contra métrica de pessoa, 3 níveis de certificação, 6 gatilhos de revisão entre pares e governança de alterações. Nenhuma funcionalidade criada; nenhuma regra de metodologia, ontologia ou experiência alterada. |
