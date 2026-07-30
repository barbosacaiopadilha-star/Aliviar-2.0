# ACE BOUNDARIES — Limites éticos, técnicos e operacionais

**Estado**: Proposto (2026-07-25). Par de [`ACE_FOUNDATION.md`](ACE_FOUNDATION.md).

Este documento existe para ser consultado quando alguém perguntar *"posso usar este dado?"*. Se a resposta não estiver aqui, a resposta é **não** até que esteja.

---

## 1. O que NUNCA entra — lista explícita

Cada categoria: por que não · risco que cria · alternativa ética.

### 1.1 Atributos protegidos por lei
Raça, cor, etnia, origem, religião, orientação sexual, identidade de gênero, deficiência, idade (do paciente como critério de afinidade), estado civil, filiação política ou sindical, condição socioeconômica.

**Por que não**: usar isso para aproximar pessoas é discriminação — inclusive quando a intenção é boa ("vou sugerir alguém parecido com ela"). A boa intenção não neutraliza o efeito: cristaliza segregação e retira da pessoa a escolha.
**Risco**: discriminação sistemática e invisível; responsabilização legal (LGPD Art. 11 — dado sensível); dano reputacional irreversível.
**Alternativa**: se o paciente **espontaneamente declarar** uma preferência dessa natureza, ela é registrada como **fala do paciente** e tratada pelo Curador na conversa — nunca como critério do sistema. A escolha continua dele; o mecanismo não a automatiza.

### 1.2 Proxies de atributo protegido
CEP como substituto de renda ou raça, nome/sobrenome como origem, foto, escola de formação como classe social, "perfil de bairro".

**Por que não**: proxy é o mesmo dano com disfarce técnico — e mais perigoso, porque passa despercebido em revisão.
**Risco**: discriminação indireta, tipicamente descoberta tarde e por terceiros.
**Alternativa**: usar o fato operacional direto e verificável (ex.: **distância até o consultório**, que é logística real), nunca o proxy demográfico.

### 1.3 Traços de personalidade, inferências psicológicas e saúde mental não declarada
Testes, tipologias, "perfil comportamental", inferência de ansiedade/depressão a partir de texto, análise de sentimento sobre a fala do paciente.

**Por que não**: a Aliviar não diagnostica, não interpreta psique e não pediu autorização para isso. Inferir estado mental de quem procura ajuda médica é invasivo e frequentemente errado.
**Risco**: estereotipagem, dano emocional, prática indevida de avaliação clínica, quebra de confiança.
**Alternativa**: registrar **o que a pessoa disse**, com as palavras dela (Evidência de Curadoria), e deixar a leitura para o Curador — que é humano, conversa com ela e pode perguntar.

### 1.4 Reputação informal, boatos e "todo mundo sabe"
Comentários de bastidor, opinião de terceiros não identificados, histórico de fofoca profissional.

**Por que não**: não é verificável, não é contestável por quem é alvo, e propaga injustiça com aparência de informação.
**Risco**: difamação, decisão sobre falsidade, dano a profissional sem direito de resposta.
**Alternativa**: **fato declarado pelo médico** ou **registro público verificável** (ex.: situação cadastral em conselho profissional), sempre com origem e data.

### 1.5 Redes sociais, marketing e presença digital
Número de seguidores, engajamento, qualidade do site, produção de conteúdo, "influência".

**Por que não**: mede habilidade de comunicação pública, não adequação ao caso desta pessoa. Favorece quem investe em imagem e penaliza quem investe em consultório.
**Risco**: distorção estrutural da rede em favor de marketing; conflito com a promessa de curadoria isenta.
**Alternativa**: se comunicação importa para este paciente, o critério legítimo é **como o médico declara conduzir a consulta** — e a verificação é a conversa, não o Instagram.

### 1.6 Avaliações e notas de pacientes sem contexto
Estrelas de plataformas, média de reviews, NPS agregado.

**Por que não**: nota agregada esconde o que importa (quem avaliou, com que caso, em que circunstância) e é manipulável. Além disso, reintroduz pelo lado de fora o ranking que o Segundo Princípio proíbe.
**Risco**: injustiça com quem atende casos difíceis; falsa objetividade; incentivo perverso.
**Alternativa**: relato **qualitativo, identificado e contextualizado**, coletado pela própria Aliviar após um Case real, tratado como fato-com-origem e nunca agregado em nota.

### 1.7 Desfechos clínicos como métrica de qualidade
Taxa de sucesso, mortalidade, complicações, "resultados".

**Por que não**: sem ajuste de risco, penaliza exatamente quem aceita os casos mais graves. E a Aliviar não tem dado, método nem mandato para isso.
**Risco**: dano grave à rede e ao paciente — empurra os casos difíceis para longe de quem sabe tratá-los.
**Alternativa**: **experiência declarada com o tipo de caso** (fato declarado pelo médico), sem transformar em métrica comparativa.

### 1.8 Preços, comissões e qualquer incentivo comercial
Valor da consulta como critério de afinidade, margem, prioridade de parceiro, patrocínio.

**Por que não**: transformaria a Curadoria em venda. É a linha que separa a Aliviar de um classificado.
**Risco**: conflito de interesse na decisão mais sensível da vida de alguém; perda de legitimidade.
**Alternativa**: **viabilidade financeira** é fato operacional (cobertura, faixa de valor) tratado na etapa de viabilidade — nunca como compatibilidade, e nunca ordenando por margem.

### 1.9 Dados de terceiros e de outros pacientes
Histórico de outros Cases, "pacientes como você", comportamento agregado de outras pessoas.

**Por que não**: usa a intimidade de uns para decidir sobre outros, sem consentimento; e "pessoas como você" é estereótipo com roupa estatística.
**Risco**: violação de privacidade; vieses históricos perpetuados.
**Alternativa**: usar **o que esta pessoa disse sobre este caso**. A Curadoria é individual por definição.

### 1.10 Qualquer coisa impossível de verificar ou de contestar
Suposições, "impressões" sem autor, dados sem data, informação que a pessoa alvo não pode corrigir.

**Por que não**: viola P5 (origem), P6 (explicabilidade) e P8 (revisão) de uma vez.
**Risco**: decisão sobre ficção.
**Alternativa**: registrar como **lacuna** e perguntar.

---

## 2. O que PODE entrar

Tudo abaixo entra **classificado** conforme [`ACE_DATA_CLASSIFICATION.md`](ACE_DATA_CLASSIFICATION.md), com origem e data.

### 2.1 Do PACIENTE — sobre como ele decide, com as palavras dele

Legítimo (sempre como *preferência declarada*, na fala original):
- o que ele disse precisar entender antes de decidir
- ritmo declarado ("quero resolver logo" / "preciso de tempo")
- experiência anterior relatada ("já passei por isso e senti falta de…")
- quem participa da decisão, se ele mencionar
- preferências práticas: local, horário, telemedicina, idioma
- o que o preocupa neste caso, nas palavras dele

**Limites**: sempre **declarado, nunca inferido**; sempre **fala preservada**, nunca resumo que vira rótulo; **sem questionário psicológico**, sem tipologia, sem escala de personalidade. Se não foi dito, não existe.

### 2.2 Do MÉDICO — sobre como ele atua, declarado por ele

Legítimo (sempre como *fato declarado*, com data e direito de correção):
- formação, títulos, tempo de atuação, áreas de foco
- tipos de caso com que declara ter experiência
- como declara conduzir a primeira consulta e o acompanhamento
- disponibilidade real: agenda, telemedicina, retorno, canais
- idiomas, acessibilidade do consultório, localização
- convênios e formatos de atendimento
- situação cadastral em conselho profissional (fonte pública verificável)

**Limites**: **nada de avaliação subjetiva sobre o médico**, venha de quem vier. Nenhum atributo pessoal protegido. Nada que ele não possa ver e corrigir.

### 2.3 Do CURADOR — percepções, sem virar sentença

Legítimo (sempre como *interpretação*, com autor e data):
- o que percebeu na conversa e considera relevante **para este Case**
- o que já explicou ao paciente e como ele reagiu
- o que recomenda abordar antes da decisão
- discordância explícita de uma observação do sistema

**Limites que impedem a percepção de virar julgamento permanente** (P11):
1. **Escopo de Case** — a percepção pertence a este Case e não migra para o cadastro da pessoa
2. **Autor e data obrigatórios** — nunca "percebeu-se que"
3. **Sobre situação, não sobre essência** (P10) — "ela pediu mais tempo", não "ela é insegura"
4. **Visível ao próprio Curador seguinte como interpretação**, jamais como fato
5. **Revisável** — o Curador seguinte pode registrar leitura diferente sem apagar a anterior
6. **Nunca sobre o médico como pessoa** — sobre a interação, o caso, o encaixe

---

## 3. O que cada um NUNCA vê

### 3.1 O paciente nunca vê
- score interno, contribuição de critério, cálculo de qualquer natureza
- observações internas de Curadoria e percepções do Curador
- comparações entre médicos além dos três caminhos apresentados, sem ordem de preferência
- dados de outros pacientes ou de outros Cases
- vocabulário técnico interno (protocolo, artefato, enum, pipeline)

**Por quê**: o paciente decide melhor com o que é dele — a própria história, as opções explicadas e as limitações ditas. O bastidor da Curadoria não o ajuda a decidir; ele o pressiona a concordar.

### 3.2 O médico nunca vê
- a história clínica do paciente antes do encaminhamento efetivo, e mesmo então só o necessário
- observações do Curador sobre a compatibilidade
- comparações com outros profissionais
- por que foi ou não incluído nos três caminhos
- percepções do paciente sobre ele

**Por quê**: o médico é parte da rede, não avaliado por ela. Expor comparação criaria competição onde deve haver adequação — e o Método não avalia médicos, aproxima pessoas.

### 3.3 O Curador vê tudo o que é do Case
Com origem, data, autor e justificativa — **e sem números** (`ACE_FOUNDATION.md` §5).

---

## 4. Limites de uso

O ACE **não pode** ser usado para: avaliar desempenho de médicos · alimentar marketing ou vendas · priorizar parceiro comercial · gerar relatório de "melhores" · treinar modelo com histórico de escolhas sem missão ética própria · pontuar pacientes · justificar recusa de atendimento.

Dado do ACE **não é exportável** para fora do processo de Curadoria sem decisão registrada do Fundador.

## 5. Limites técnicos

1. **Posterior aos filtros clínicos** — nunca antes, nunca por cima
2. **Sem canal direto ao paciente** — toda saída passa por Curador
3. **Sem persistência de reputação** — observação é do Case, não da pessoa
4. **Degradação segura** — indisponível, a Curadoria continua (P16)
5. **Sem decisão automática** — nenhuma saída dispara ação sozinha
6. **Auditável** — toda observação reconstruível: entrada, regra, justificativa, data

## 6. Quando a resposta não estiver aqui

Perguntar, nesta ordem:

1. Isso é **verificável** e a pessoa alvo pode **corrigir**?
2. Isso ajuda **esta decisão**, deste paciente, agora?
3. Se o alvo lesse, sentiria que foi **tratado com justiça**?
4. Isso funciona como **proxy** de algo proibido?
5. Isso pode ser explicado em **uma frase legível**?

**Qualquer "não" → o dado não entra**, e a dúvida vira registro para o Fundador decidir. Na dúvida, a Aliviar erra por proteger a pessoa.
