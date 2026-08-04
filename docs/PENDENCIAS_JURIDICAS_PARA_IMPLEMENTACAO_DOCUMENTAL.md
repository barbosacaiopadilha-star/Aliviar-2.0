# Pendências jurídicas para a implementação documental — Aliviar

Documento de perguntas para o advogado responsável. **Nenhuma cláusula dos documentos recebidos foi alterada, reescrita ou sugerida.** O que existe aqui são perguntas objetivas cujas respostas definem como os documentos serão apresentados, assinados e guardados no sistema.

**Data:** 2026-08-03 · **Destinatário:** advogado responsável · **Origem:** análise técnica dos cinco documentos recebidos, para implementação da assinatura eletrônica.

**O que já foi feito:** os cinco documentos foram lidos integralmente e analisados **apenas** do ponto de vista de como transformá-los em experiência digital. A base técnica para receber documentos personalizados e assinaturas eletrônicas já está construída e testada. **O que falta é a decisão jurídica** sobre os pontos abaixo.

**O que NÃO estamos pedindo:** parecer sobre risco, redação de cláusula nova, ou revisão de mérito. Só respostas objetivas às perguntas marcadas.

---

# A. Contexto do produto

## O que é a Aliviar

A Aliviar ajuda pessoas a encontrar cuidado médico com critério. Alguém chega em um momento difícil — um diagnóstico, uma dúvida sobre operar ou não, uma negativa do plano — e não sabe por onde começar. A Aliviar organiza essa jornada: escuta a história, analisa a documentação, identifica profissionais compatíveis e acompanha a pessoa ao longo do processo.

A Aliviar **não presta serviço médico**. Não diagnostica, não prescreve, não trata, não garante resultado. Isso está expresso no contrato recebido e é a base de todo o desenho do produto.

## O que é a Curadoria

É o trabalho de encontrar e apresentar profissionais compatíveis com o caso da pessoa. A equipe estuda a história, avalia a rede de médicos parceiros contra critérios definidos e entrega uma proposta — sempre validada por uma pessoa da equipe, nunca automática. A escolha final é da paciente.

## O que é o Concierge

É o acompanhamento contínuo depois da escolha: apoio na documentação, no contato com clínicas e hospitais, no acompanhamento de protocolos junto à operadora e, quando necessário, na interlocução administrativa (inclusive ouvidoria e ANS). **A duração prevista desse acompanhamento é de 12 meses.**

## Decisões de produto já tomadas

1. **O contrato será único.** Um só instrumento cobrindo Curadoria e Concierge — a pessoa não assina dois contratos, nem contrata etapas separadas.
2. **A vigência será de 12 meses**, contados da assinatura.
3. **O paciente assinará eletronicamente**, dentro da plataforma, logo no primeiro acesso — antes de contar sua história clínica.
4. **Os documentos serão personalizados por pessoa.** Cada contrato é gerado com o nome, a qualificação e as condições daquela pessoa, e é *esse* documento que ela lê e assina — não um modelo genérico.
5. **Cada documento assinado fica guardado com prova de integridade.** O sistema registra o texto exato assinado, a data e a hora, e uma "impressão digital" matemática do documento (um código que muda se um único caractere do texto mudar). Anos depois, é possível demonstrar que aquela pessoa assinou exatamente aquele texto.
6. **Não existe Portal do Médico na versão 1.** O profissional não faz cadastro, não faz login e não tem tela própria. Ele é identificado e homologado pela equipe da Aliviar, e os documentos dele são obtidos fora do sistema e **registrados** pela equipe, com declaração de como foram obtidos.

---

# B. Decisões obrigatórias

Quatro decisões bloqueiam a implementação. Estão transcritas com a mesma identificação do documento técnico interno, para rastreabilidade.

---

## D-3 — Nível de assinatura exigido por documento

**Pergunta objetiva:** para cada um dos cinco documentos, qual forma de assinatura eletrônica é suficiente?

**Por que precisa de resposta:** a tela de assinatura muda conforme a resposta, e o que o sistema guarda como prova também.

**Efeito no fluxo digital:** o nível mais simples permite assinar em uma única sessão, sem custo por documento. O nível mais forte exige um serviço externo de assinatura, com custo por documento, espera e um fornecedor a mais tratando dados.

**Opções possíveis** (nomes internos entre parênteses, para referência nas respostas):

- **(N1) Aceite autenticado** — a pessoa entra com login e senha, lê o documento e confirma. O sistema registra quem, quando, de qual endereço de internet e qual navegador, junto do texto exato.
- **(N2) Assinatura com declaração de vontade** — tudo do N1, mais: o documento é gerado com os dados daquela pessoa, ela precisa percorrer o texto até o fim, e digita o próprio nome completo, que o sistema confere com o cadastro antes de gravar.
- **(N3) Assinatura com evidência externa** — tudo do N2, mais um provedor externo de assinatura (por exemplo, certificado ICP-Brasil, ou código enviado por outro canal).

**Recomendação de produto:** **N2 para os cinco documentos** na versão 1, com o N3 preparado para a Procuração caso alguma operadora ou a ANS venha a recusar procuração eletrônica na prática. O fundamento dessa recomendação é a própria cláusula 11 do contrato recebido, que reconhece como válidas as comunicações e assinaturas eletrônicas e autoriza o uso de registros eletrônicos como meio de prova.

**Resposta do advogado:**

| Documento | Nível suficiente (N1 / N2 / N3) | Observação |
|---|---|---|
| Contrato de Prestação de Serviços | | |
| Anexo I — LGPD do Contratante | | |
| Procuração Particular | | |
| Termo LGPD do Médico | | |
| Termo de Idoneidade | | |

---

## D-6 — Procuração exige testemunhas ou reconhecimento de firma?

**Pergunta objetiva:** o Contrato precisa mesmo ser assinado por duas testemunhas e em duas vias? E a Procuração precisa de firma reconhecida para ser aceita por operadoras, ouvidorias e ANS?

**Por que precisa de resposta:** os dois documentos recebidos dizem coisas diferentes sobre forma, e um deles diz duas coisas diferentes sobre si mesmo:

- **A Procuração** tem uma única linha de assinatura, do outorgante, com CPF. **Não menciona testemunha nem reconhecimento de firma.**
- **O Contrato** encerra determinando que as partes firmem "em duas vias de igual teor e forma, juntamente com 2 (duas) testemunhas", com espaço para nome e CPF de cada uma. **Mas a cláusula 11.1 do mesmo contrato reconhece a assinatura eletrônica como válida.** As duas coisas não convivem no mesmo fluxo digital sem uma definição de quem redigiu o documento.

**Efeito no fluxo digital:** se as duas testemunhas permanecerem, o contrato **não se completa em uma sessão**. Seria preciso coletar nome, CPF e manifestação de duas pessoas que não são usuárias da plataforma — um fluxo com quatro assinantes, cadastro de terceiros e espera. Isso muda substancialmente o tamanho da implementação e o tempo até a primeira paciente ativa.

**Opções possíveis:**

- **(a)** O fecho do Contrato é ajustado para assinatura eletrônica, coerente com a cláusula 11 — o fluxo digital segue direto.
- **(b)** As testemunhas permanecem e o sistema passa a suportar instrumentos com quatro assinantes, incluindo pessoas sem conta na plataforma.
- **(c)** As testemunhas permanecem, mas são pessoas da própria equipe da Aliviar — o que exige definição jurídica sobre quem pode testemunhar nesse contexto.

**Recomendação de produto:** **(a)**, por ser a única compatível com uma jornada digital contínua. **A decisão, porém, não é nossa** — não presumimos que o fecho possa ser alterado.

**Resposta do advogado:**

- O Contrato exige duas testemunhas? ☐ Sim ☐ Não · Se sim, quem pode ser testemunha: ______________________
- O Contrato exige duas vias físicas? ☐ Sim ☐ Não
- A Procuração exige firma reconhecida? ☐ Sim ☐ Não
- Alguma operadora, ouvidoria ou a ANS recusa procuração assinada eletronicamente, na sua experiência? ☐ Sim ☐ Não ☐ Não sei — testar no piloto

---

## D-7 — Paciente representado (menor, incapaz, familiar) assina como?

**Pergunta objetiva:** haverá modelo com representante legal? Quem assina quando a paciente não assina por si?

**Por que precisa de resposta:** nenhum dos cinco documentos prevê representante. Todos preveem um único titular, pessoa física, qualificado e assinando em nome próprio. Não há campo, cláusula ou linha de assinatura para responsável, curador ou familiar.

**Efeito no fluxo digital:** é cenário realista no dia a dia da Aliviar — paciente idoso, paciente em tratamento oncológico com um filho conduzindo as tratativas, menor de idade. Hoje, na prática, o familiar assinaria no lugar da paciente e **o registro diria que foi a própria paciente**. Essa é a falha que queremos evitar: um registro eletrônico atribuído a quem não praticou o ato vale menos do que um registro honesto de que outra pessoa o praticou.

**Opções possíveis:**

- **(a)** A versão 1 atende apenas titulares maiores e capazes assinando por si. Qualquer outro caso é tratado fora do sistema e registrado como tal, com declaração de quem assinou e em que qualidade.
- **(b)** São produzidos modelos com representante legal, e o sistema passa a suportar representação como situação normal.

**Recomendação de produto:** **(a) para a versão 1**, com a regra explícita de que representação, quando ocorrer, é registrada como representação — nunca como ato da própria titular.

**Resposta do advogado:**

- Haverá modelo com representante legal? ☐ Sim, produzirei ☐ Não na V1
- Quais documentos comprobatórios o sistema deve guardar nesse caso? ______________________

---

## D-8 — Prazo de resposta ao DSR *(pedidos do titular sobre seus dados)*

**Pergunta objetiva:** em quantos dias a Aliviar responderá a um pedido de acesso, correção, exclusão, portabilidade ou revogação? Quem é o Encarregado e qual o canal?

**Por que precisa de resposta:** o Anexo I lista os direitos do titular (item 6) mas **não fixa prazo nem indica onde exercê-los**. Nenhum dos cinco documentos nomeia Encarregado ou canal de contato.

**Efeito no fluxo digital:** a tela onde a paciente abre esses pedidos já existe e funciona. Hoje ela mostra "aberto em tal data", sem prometer prazo — o que é honesto, mas incompleto. Com o prazo definido, a tela passa a exibir o compromisso e a operação passa a ter alvo e alerta de vencimento. Sem canal declarado, não há para onde apontar a pessoa.

**Opções possíveis:** prazo definido e publicado; ou nenhum prazo declarado, apenas o registro do pedido; ou prazo interno de operação, não publicado ao titular.

**Recomendação de produto:** prazo definido e publicado, junto com a indicação do Encarregado e do canal — as três coisas são a mesma conversa.

**Resposta do advogado:**

- Prazo de resposta: ________ dias · ☐ corridos ☐ úteis
- Encarregado (nome): ______________________
- Canal de exercício de direitos (e-mail/telefone/endereço): ______________________
- Prazo de retenção após o fim da relação: ______________________

---

# C. Contrato único — Curadoria + Concierge

A decisão de produto é ter **um só contrato** cobrindo os dois serviços, com **vigência de 12 meses**. O documento recebido é o ponto de partida. Precisamos da confirmação de cada item abaixo.

**Observação factual, sem juízo de mérito:** a cláusula 1.1 do contrato recebido descreve o objeto como assessoria administrativa, documental e operacional, e interlocução com prestadores, operadoras e ANS. A cláusula 1.3 prevê a apresentação de profissionais. **O texto não menciona expressamente** nem a atividade de Curadoria como a descrevemos na seção A, nem o acompanhamento continuado de 12 meses. Se o contrato deve cobrir os dois serviços, é preciso confirmar se o objeto atual já os abrange ou se será complementado.

| # | Ponto | Confirmação / resposta |
|---|---|---|
| C1 | **Título definitivo** do contrato | |
| C2 | **Objeto**: o texto atual já cobre Curadoria + Concierge, ou será complementado? | ☐ Já cobre ☐ Será complementado |
| C3 | **Cobertura da Curadoria** — seleção e apresentação de profissionais está no objeto? | ☐ Sim ☐ Não ☐ Ajustar |
| C4 | **Cobertura do Concierge** — acompanhamento continuado está no objeto? | ☐ Sim ☐ Não ☐ Ajustar |
| C5 | **Vigência de 12 meses** confirmada? | ☐ Sim ☐ Outro prazo: ______ |
| C6 | **Início da vigência**: data da assinatura eletrônica? | ☐ Sim ☐ Outro marco: ______ |
| C7 | **Término**: automático ao fim dos 12 meses? | ☐ Sim ☐ Outro: ______ |
| C8 | **Renovação**: automática, por aditivo, ou não há? | ☐ Automática ☐ Por aditivo ☐ Não há |
| C9 | **Rescisão antecipada**: quais hipóteses valem (cláusula 10.2)? | |
| C10 | **Aviso prévio** para denúncia imotivada: quantos dias? | ______ dias |
| C11 | **Preço e forma de pagamento**: serão preenchidos por paciente, no momento da geração do contrato? | ☐ Sim ☐ Não ☐ Preço fixo: ______ |
| C12 | **Representação administrativa**: fica no contrato ou só na procuração? | ☐ Só na procuração ☐ Ambos |
| C13 | **Relação contrato ↔ procuração**: a procuração é acessória do contrato? | |
| C14 | **Assinatura eletrônica** confirmada como forma válida (cláusula 11)? | ☐ Sim ☐ Não |
| C15 | **Testemunhas**: ver D-6 | ☐ Sim ☐ Não |
| C16 | **Duas vias**: exigidas em formato digital? | ☐ Sim ☐ Não ☐ Substituídas por cópia baixável |

---

# D. Procuração Particular

| # | Ponto | Confirmação / resposta |
|---|---|---|
| D1 | **Obrigatoriedade**: assinada por todos no início, ou só quando a representação for efetivamente acionada? | ☐ Todos ☐ Só quando acionada |
| D2 | **Prazo do mandato** (cláusula 4.1, hoje em branco) | ______ meses |
| D3 | **Assinatura eletrônica** é suficiente? | ☐ Sim ☐ Não |
| D4 | **Testemunhas**: exigidas? | ☐ Sim ☐ Não |
| D5 | **Reconhecimento de firma**: exigido? | ☐ Sim ☐ Não |
| D6 | **Revogação**: a cláusula 4.1 prevê revogação por escrito. O sistema deve gerar um documento datado de revogação para a paciente apresentar a terceiros? | ☐ Sim ☐ Não |
| D7 | **Download e apresentação isolada**: a procuração será apresentada a operadora, ouvidoria e ANS. Há exigência de formato, cabeçalho ou identificação específica? | |

**Nota de produto:** a recomendação atual é **(D1) exigir a procuração somente quando houver representação administrativa** — o que também é o que o contrato recebido prevê, ao tratá-la como instrumento próprio e eventual (cláusula 4.2). A procuração é o único dos cinco documentos cujo destinatário é externo à Aliviar.

---

# E. LGPD do paciente — Anexo I

| # | Ponto | Confirmação / resposta |
|---|---|---|
| E1 | **Assinatura separada do contrato**: o Anexo é ato próprio, com assinatura e registro independentes? | ☐ Sim ☐ Não |
| E2 | **Consentimento destacado para dados sensíveis** (item 4.1): apresentá-lo em bloco visualmente separado, com confirmação própria dentro do ato do Anexo, atende ao requisito de consentimento "específico e destacado"? Ou o consentimento sensível deve ser um documento próprio, com aceite e revogação inteiramente independentes? | ☐ Basta o destaque no Anexo ☐ Documento próprio |
| E3 | **Hipóteses de revogação**: o item 8.1 prevê revogação a qualquer tempo. Vale para o Anexo inteiro, ou é possível revogar apenas partes? | ☐ Só integral ☐ Também por partes: ______ |
| E4 | **Efeitos da revogação**: o que a Aliviar deve parar de fazer imediatamente? O que continua por outra base legal? | |
| E5 | **Precedência entre instrumentos**: o Anexo (itens 3.1 e 4.1) e a Procuração (cláusula 3.1) autorizam compartilhamento de dados sensíveis com operadoras e ANS, com objetos parcialmente sobrepostos. **Se a paciente revogar um e mantiver o outro, qual prevalece?** O sistema precisa dessa resposta para saber o que bloquear. | |
| E6 | **Encarregado** — ver D-8 | |
| E7 | **Canal de exercício de direitos** — ver D-8 | |
| E8 | **Retenção**: o item 5.1 fala em "tempo necessário", sem prazo. Há prazo a declarar? | ☐ Sim: ______ ☐ Manter como está |

---

# F. Documentos do profissional

Lembrando: **não existe Portal do Médico na versão 1**. O profissional não faz login. O ato dele acontece fora do sistema e a equipe da Aliviar o registra, declarando como foi obtido e anexando a evidência quando houver.

| # | Ponto | Confirmação / resposta |
|---|---|---|
| F1 | **Existe contrato específico com o profissional?** O Termo de Idoneidade pressupõe relação contratual em duas cláusulas (3.1 "limites contratuais" e 6.3 "encerramento da relação contratual") e manda interpretá-lo "em conjunto com os demais instrumentos contratuais firmados entre as partes" (9.2). **Esse instrumento não nos foi enviado.** | ☐ Existe, enviarei ☐ Não existe ☐ Será produzido |
| F2 | **Relação entre os três documentos** (contrato do profissional, Termo LGPD, Termo de Idoneidade): qual é principal, quais são acessórios? | |
| F3 | **Assinatura eletrônica**: quando houver Portal do Profissional (versão 1.1 ou posterior), o aceite eletrônico dele será suficiente? | ☐ Sim ☐ Não |
| F4 | **Uso de imagem** (Termo LGPD 4.2): a autorização de imagem, nome e currículo é o que fundamenta a publicação do perfil na Rede? | ☐ Sim ☐ Não |
| F5 | **Escopos de revogação**: o Termo LGPD (9.1–9.2) e o Termo de Idoneidade (8.2) permitem revogar "autorizações de imagem, currículo ou exposição pública" **sem enumerar o que exatamente cessa**. Precisamos da lista fechada do que pode ser revogado isoladamente. | |
| F6 | **Efeito da revogação de imagem**: o item 9.2 diz que a retirada "poderá inviabilizar a manutenção do perfil". Isso significa que o sistema deve **despublicar automaticamente** o perfil da Rede? | ☐ Sim, automático ☐ Análise caso a caso |
| F7 | **Vínculo com o Questionário/Protocolo da Prática**: a cláusula 2.1 declara verdadeiros "todos os dados fornecidos". Na prática, esses dados são o questionário estruturado que o profissional preenche. Podemos vincular ao termo assinado uma "fotografia" imutável desses dados, para que a declaração seja reconstituível anos depois? | ☐ Sim ☐ Não ☐ O questionário deve virar documento assinado próprio |
| F8 | **Testemunhas**: exigidas em algum dos documentos do profissional? | ☐ Sim ☐ Não |

---

# G. Campos definitivos

Todos os cinco documentos estão com estes campos em branco. **Sem eles, nenhum documento pode ser publicado no sistema** — são dados fixos da empresa, iguais para todas as pessoas.

| Campo | Valor definitivo |
|---|---|
| Razão social | |
| Nome fantasia | |
| CNPJ | |
| Sede (endereço completo) | |
| Representante legal (nome) | |
| CPF do representante | |
| Cidade/UF dos instrumentos | |
| Foro (comarca/UF) | |
| Preço | |
| Forma de pagamento | |
| Vigência do contrato | 12 meses ☐ confirmado |
| Aviso prévio (denúncia imotivada) | ______ dias |
| Prazo da procuração | ______ meses |
| Encarregado (LGPD) | |
| E-mail de privacidade | |
| Canal de atendimento ao titular | |

> **Não envie dados sensíveis, senhas ou credenciais neste documento.** Apenas os campos acima, que são de identificação pública da empresa e do contrato.

---

# H. Os 22 pontos levantados na análise

Transcrição integral dos itens levantados na análise técnica, agrupados por documento. Nenhum foi omitido. A numeração original (1 a 22) está preservada entre colchetes.

## H.1 — Todos os cinco documentos

- **[1]** Razão social, CNPJ e sede da empresa em branco (`[RAZÃO SOCIAL]`, `[XXX]`, `[endereço completo]`). Nenhum documento pode ser publicado antes disso.
- **[8]** Cidade e data de assinatura em branco — resolvidos automaticamente no momento da assinatura, mas é preciso confirmar a cidade de referência.

## H.2 — Contrato de Prestação de Serviços

- **[2]** Cláusula 9.1 — preço (`R$ [XXX]`) e forma de pagamento (`[XXX]`) em branco.
- **[3]** Cláusula 10.1 — prazo de vigência (`[prazo]`) e data de início (`[data]`) em branco.
- **[4]** Cláusula 10.2.b — prazo de aviso prévio para denúncia imotivada (`[XXX] dias`) em branco.
- **[5]** Cláusula 15.1 — comarca do foro (`[cidade/UF]`) em branco.
- **[13]** Fecho — "duas vias de igual teor e forma, juntamente com 2 (duas) testemunhas", com blocos de nome e CPF. **Conflita com a cláusula 11.1 do próprio contrato**, que reconhece a assinatura eletrônica como válida. É o item mais bloqueante da lista (ver D-6).
- **[14]** Cláusula 9.2 — cita "reconhecimento de firma" e "autenticações" entre despesas extraordinárias possíveis. Não é exigência, mas indica que o cenário foi cogitado. Pergunta objetiva: alguma assinatura destes cinco documentos precisa de firma reconhecida?

## H.3 — Procuração Particular

- **[6]** Cláusula 4.1 — prazo do mandato (`[XXX] meses`) em branco. **É o único documento com validade própria que expira**; sem o prazo, o sistema não sabe quando a representação deixa de valer.
- **[7]** Preâmbulo — nome e CPF do representante legal da outorgada em branco.
- **[15]** O texto não exige testemunha nem firma reconhecida. Pergunta operacional: **operadoras, ouvidorias e ANS aceitam procuração particular assinada eletronicamente?** É o único documento com destinatário externo, e a recusa dele seria operacional, não contratual.

## H.4 — Anexo I — LGPD do Contratante

- **[16]** Não indica Encarregado (DPO), canal de contato ou endereço para exercício de direitos. O item 6 lista os direitos sem dizer onde exercê-los; a tela de pedidos já existe e não tem para onde apontar.
- **[17]** Nenhum prazo de resposta ao titular (ver D-8).
- **[18]** Retenção sem prazo numérico — item 5.1, por referência à finalidade.
- **[19]** **Autorização de dados sensíveis em dois instrumentos.** O Anexo (3.1 e 4.1) autoriza compartilhamento com operadoras, ANS e ouvidorias; a Procuração (3.1) autoriza acesso, uso, transmissão e compartilhamento dos mesmos dados para o mesmo destino. Objetos parcialmente sobrepostos, revogáveis de forma independente. **Se o titular revogar um e mantiver o outro, qual prevalece?**

## H.5 — Termo LGPD do Médico Parceiro

- **[7 — parte profissional]** CRM/UF, RQE, CPF e cidade/data em branco.
- **[16 — parte profissional]** Não indica Encarregado nem canal de exercício de direitos.
- **[21]** **Revogação parcial sem delimitação expressa.** As cláusulas 9.1 e 9.2 admitem revogar "autorizações de imagem, currículo ou exposição pública" sem enumerar o que exatamente cessa. Para implementar a revogação por partes, é preciso saber quais autorizações são revogáveis isoladamente.

## H.6 — Termo de Idoneidade

- **[8 — parte profissional]** CRM/UF, RQE, CPF em branco.
- **[10]** **Contrato do profissional não recebido.** O termo pressupõe relação contratual (3.1, 6.3) e manda interpretá-lo em conjunto com os demais instrumentos (9.2). **Esse instrumento existe?**
- **[11]** **Política interna da Plataforma sobre uso de dados estatísticos**, citada como limite vinculante (3.2.d). Não recebida. Enquanto não existir, a cláusula remete a um documento inexistente.
- **[12]** **Questionário de Homologação.** No sistema, existe como um questionário estruturado que o profissional preenche — dado organizado, sem status jurídico próprio. Deve virar documento assinado, ou permanece coberto pela declaração de veracidade da cláusula 2.1?

## H.7 — Itens que atravessam mais de um documento

- **[9]** **Política de Privacidade e Termos de Uso da plataforma não recebidos.** O site já tem as páginas prontas, servindo um aviso de "ainda não publicado". Nenhum dos cinco documentos os substitui: os cinco regem a relação de serviço, não o uso do site.
- **[20]** **Ausência de previsão de representante legal** nos cinco documentos (ver D-7).
- **[22]** **Coerência verificada, sem conflito, mas com exigência para o produto.** O Contrato (1.3, 2.4, 8.2) permite compartilhar informações curriculares e estatísticas "em contexto privado e restrito"; o Termo de Idoneidade (3.3) proíbe uso aberto, ostensivo ou promocional. Os textos concordam — e juntos estabelecem uma regra permanente para o produto: **a Rede não pode ter vitrine pública de profissionais nem exibir estatística individual fora do contexto da paciente vinculada.** Hoje isso é verdade no sistema; passa a ser restrição documentada. **Confirma essa leitura?** ☐ Sim ☐ Não

---

# I. Matriz de bloqueios

O que cada resposta destrava. As colunas correspondem às etapas da implementação:

- **Arquitetura** — a estrutura do banco de dados e das regras. **Já concluída e testada**; nada aqui a bloqueia.
- **G1 — Catálogo e telas de leitura** — publicar documentos no sistema e ligar a exigência de aceite.
- **G3 — Assinatura real** — a paciente lê, assina e o sistema guarda a prova.
- **Publicação do texto** — colocar o documento no ar, disponível para leitura.

| Decisão | Documento afetado | Quem responde | Bloqueia arquitetura | Bloqueia G1 (UI) | Bloqueia G3 (assinatura) | Bloqueia publicação |
|---|---|---|---|---|---|---|
| **D-3** — nível de assinatura | Todos os cinco | Jurídico | Não | Não | **Sim** | Não |
| **D-6** — testemunhas e forma | Contrato, Procuração | Jurídico | Não | Não | **Sim** (Contrato) | Não |
| **D-7** — representante legal | Contrato, Anexo I, Procuração | Jurídico + Produto | Não | Não | Não* | Não |
| **D-8** — prazo, Encarregado, canal | Anexo I | Jurídico | Não | Não | Não | Não** |
| **C1–C16** — contrato único | Contrato | Jurídico + Fundador | Não | Não | **Sim** | **Sim** |
| **D1–D7** — procuração | Procuração | Jurídico | Não | Não | **Sim** | **Sim** |
| **E1–E8** — LGPD do paciente | Anexo I | Jurídico | Não | Não | **Sim** | **Sim** |
| **F1–F8** — documentos do profissional | Termos do médico | Jurídico | Não | Não | Não*** | **Sim** |
| **[1] Razão social, CNPJ, sede** | Todos | Fundador | Não | Não | **Sim** | **Sim** |
| **[9] Política de Privacidade e Termos de Uso** | Site | Jurídico | Não | Não | Não | **Sim** (dessas duas) |
| **[10] Contrato do profissional** | Rede | Jurídico | Não | Não | Não | **Sim** (do profissional) |
| **[19] Precedência Anexo × Procuração** | Anexo I, Procuração | Jurídico | Não | Não | Não | Não**** |
| **[21] Escopos revogáveis** | Termos do médico | Jurídico | Não | Não | Não | Não**** |

\* Sob a recomendação (a): a V1 atende titulares assinando por si.
\*\* Bloqueia a operação dos pedidos de titular, não a publicação dos documentos.
\*\*\* O registro pelo time já funciona; o que falta é o texto publicado.
\*\*\*\* Não bloqueia publicar; bloqueia **ativar** a revogação por partes e a regra de precedência.

**Leitura em uma frase:** **nada bloqueia a arquitetura, que está pronta.** O que bloqueia é a publicação dos textos (campos em branco e confirmações das seções C a F) e a assinatura real (D-3, D-6 e o preço).

---

## Como responder

Preencher diretamente neste documento, ou responder por e-mail item por item usando as identificações (D-3, C5, E2, [13]…). **Não é necessário reescrever nenhuma cláusula agora** — as respostas objetivas já destravam a implementação, e qualquer ajuste de redação pode vir depois, em documento próprio.

**Prioridade, se for preciso escolher:** **D-6** (testemunhas do Contrato) e **[1]** (razão social, CNPJ, sede) são os dois que travam mais coisas ao mesmo tempo.
