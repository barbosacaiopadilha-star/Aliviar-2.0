# Leitura técnica das pendências jurídicas — hipótese de trabalho

> **O QUE ESTE DOCUMENTO É:** a leitura de um engenheiro sobre as pendências de
> `PENDENCIAS_JURIDICAS_PARA_IMPLEMENTACAO_DOCUMENTAL.md`, para que a
> implementação avance em paralelo à espera da resposta do advogado.
>
> **O QUE ELE NÃO É:** parecer jurídico. Nada aqui substitui a confirmação de
> quem responde pela OAB e tem responsabilidade profissional sobre a resposta.
> Onde eu cito dispositivo, cito para que possa ser conferido — não para que
> seja acreditado.
>
> **COMO USAR:** cada item traz **a leitura**, **o fundamento** e **o grau de
> confiança**. Onde a confiança é baixa, está dito. O advogado responde
> **confirmando ou corrigindo**, que é mais rápido do que redigir do zero.

**Data:** 2026-08-31 · **Autor:** Engenheiro Líder (Claude) · **Decide:** o Fundador, com o advogado.

> **EMENDA DO MESMO DIA — leia antes do resto.** Esta leitura foi escrita a
> partir do *documento de perguntas*, **sem os cinco documentos em mãos**. Horas
> depois eles chegaram e entraram no repositório (`docs/juridico/`). **Uma das
> minhas observações caiu ao confronto com o texto real** — a do foro, corrigida
> na seção 7. As demais se sustentaram. Fica registrado que ler o resumo não é
> ler o documento, e que eu levantei alarme sobre uma cláusula que não tinha
> lido.

---

## Sumário da leitura

| Pendência | Leitura | Confiança |
|---|---|---|
| **D-6** testemunhas do Contrato | Dispensáveis — e a pergunta real é outra | **Média-alta** |
| **D-6** firma na Procuração | Não é exigência do instrumento; é opção de quem recebe | **Alta** |
| **D-3** nível de assinatura | N2 para quatro; a Procuração é a exceção, e por um motivo preciso | **Alta** |
| **D-7** representante legal | (a), e por uma razão de prova, não de direito | **Alta** |
| **D-8** prazo do DSR | 15 dias corridos | **Alta** |
| **[19]** precedência Anexo × Procuração | O sistema não precisa da resposta para ser seguro | **Alta** |
| **C11** preço no contrato | Respondido pela ADR-107 | **Certa** |
| ~~**[5] / C-foro** comarca~~ | **Alarme meu, retirado em 31/08** — a cláusula já ressalva o consumidor | **Alta** |
| **C8** renovação automática | Evitar na V1 | **Média-alta** |
| **[9]** Política e Termos do site | Não é trabalho do advogado; é nosso | **Alta** |

---

# 1 · D-6 — as duas testemunhas do Contrato

**É o item mais bloqueante do documento, e acho que a pergunta está formulada
de um jeito que esconde a resposta.**

## O que as duas testemunhas fazem — e o que elas não fazem

**Elas não validam o contrato.** Um contrato de prestação de serviços entre
partes capazes, com objeto lícito e forma não vedada em lei, é **plenamente
válido sem testemunha nenhuma**. Isso não está em discussão.

O que as duas testemunhas dão é outra coisa: **status de título executivo
extrajudicial** — CPC, art. 784, III, que trata do documento particular
assinado pelo devedor e por duas testemunhas.

A diferença é **o caminho da cobrança**, e só:

| Com testemunhas | Sem testemunhas |
|---|---|
| Execução direta: penhora sem discutir o mérito | Ação monitória ou cobrança ordinária |
| Mais rápido | Mais lento, e o contrato continua valendo |

**Portanto a pergunta não é "o contrato vale sem testemunhas?" — vale.
A pergunta é "queremos que ele seja título executivo?"**, que é decisão
**comercial** sobre inadimplência, não formalidade jurídica.

E aqui entra um dado da própria Aliviar: **R$ 500 parcelados em 12×** (ADR-107).
Execução de R$ 41,67 mensais não é caminho que se percorra — o custo do processo
supera o crédito muito antes. **O título executivo, neste preço, tem valor
prático próximo de zero.**

## O dispositivo que provavelmente resolve

Pelo que entendo, a **Lei 14.620/2023** acrescentou o **§4º ao art. 784 do CPC**,
em substância: nos títulos executivos constituídos ou atestados por meio
eletrônico, admite-se qualquer modalidade de assinatura eletrônica prevista em
lei, **dispensada a assinatura de testemunhas quando a integridade do documento
for conferida por provedor de assinatura**.

Se for isso, o fecho do Contrato ("duas vias e duas testemunhas") é **herança de
modelo em papel**, e a cláusula 11.1 do mesmo contrato — que reconhece a
assinatura eletrônica — é a que expressa a intenção real.

**Confiança: média-alta no dispositivo; BAIXA na aplicação ao nosso caso.**
E a dúvida é específica e vale ser feita ao advogado nestas palavras:

> **O nosso N2 é "provedor de assinatura" para efeito do §4º?**
> Não usamos serviço externo: o próprio sistema gera o documento personalizado,
> registra quem/quando/de onde, guarda o texto exato e um hash de integridade.
> Isso satisfaz "integridade conferida por provedor de assinatura", ou o
> dispositivo pressupõe um terceiro?

**Se a resposta for "precisa de terceiro"**, a decisão vira comercial: pagar um
provedor externo para ganhar um título executivo que, a R$ 41,67 por parcela,
não se executa. **Minha recomendação seria não pagar** — e assinar em N2,
aceitando cobrança monitória no caso raro de inadimplência.

## As duas vias

Não há exigência legal de duas vias; é prática de papel, para cada parte ficar
com o seu. **No digital isso se cumpre melhor:** as duas partes acessam o mesmo
documento, com prova de integridade, a qualquer momento. Um PDF baixável resolve
o propósito inteiro.

**Leitura:** as duas vias podem ser substituídas por cópia baixável (opção C16
"substituídas por cópia baixável"). **Confiança: alta.**

---

# 2 · D-6 (segunda parte) — firma reconhecida na Procuração

**Leitura: não é exigência do instrumento — é faculdade de quem o recebe.**

**Fundamento:** Código Civil, art. 654, §2º — *o terceiro com quem o mandatário
tratar pode exigir que a procuração traga a firma reconhecida*. A leitura direta
é que **o reconhecimento não é requisito de validade do mandato**; é uma
exigência que o destinatário **pode** fazer.

Isso muda a natureza da pergunta: **não é jurídica, é empírica.** Nenhum
advogado consegue afirmar com certeza o que uma operadora específica vai aceitar
no balcão — isso varia por operadora, por canal e às vezes por atendente.

**Recomendação:** manter a opção que o próprio documento oferece —
*"☐ Não sei — testar no piloto"* — e tratar como **achado de operação**, não como
bloqueio. O Diário do Ensaio e da primeira Curadoria é o instrumento certo.

**Consequência para o produto, e ela é boa:** o sistema deve ser construído para
que a Procuração seja **gerada, baixada e impressa** — se uma operadora exigir
firma, a pessoa leva ao cartório o mesmo documento. Nada se perde; só se acrescenta
um passo, naquele caso.

**Confiança: alta.**

---

# 3 · D-3 — nível de assinatura por documento

**Leitura: a recomendação de produto (N2 para os cinco, N3 preparado para a
Procuração) está juridicamente bem colocada — e o motivo é mais preciso do que o
documento diz.**

**Fundamento:** MP 2.200-2/2001, art. 10, §2º. Documentos assinados por meios
que **não** são ICP-Brasil são válidos **desde que admitidos como válidos pelas
partes, ou aceitos pela pessoa a quem for oposto o documento**.

Daí sai a divisão exata:

**Quatro documentos vivem entre Aliviar e a pessoa.** Contrato, Anexo I, Termo
LGPD do Médico e Termo de Idoneidade só são opostos entre quem os assinou. E o
**próprio Contrato, na cláusula 11.1, declara a assinatura eletrônica válida** —
ou seja, as partes admitiram. **N2 basta, e o fundamento está dentro do
documento.**

**A Procuração é diferente, e é a única.** Ela é oposta a um **terceiro** —
operadora, ouvidoria, ANS — que não assinou nada e não se vinculou à cláusula
11.1. A validade dela perante esse terceiro depende de o terceiro aceitar
(art. 10, §2º, segunda parte).

**Leitura final:**

| Documento | Nível | Por quê |
|---|---|---|
| Contrato | **N2** | Cláusula 11.1: as partes admitiram |
| Anexo I — LGPD | **N2** | Ato entre as partes; a prova é do consentimento |
| Termo LGPD do Médico | **N2** | Idem |
| Termo de Idoneidade | **N2** | Idem |
| **Procuração** | **N2 com N3 preparado** | **Único com destinatário externo** |

**Confiança: alta.**

---

# 4 · D-7 — paciente representado

**Leitura: opção (a) — V1 atende titulares maiores e capazes assinando por si.**

E acrescento um fundamento que o documento não usa, e que acho mais forte que a
conveniência de implementação:

**Um registro eletrônico atribuído a quem não praticou o ato é pior que nenhum
registro.** Se o filho assina pela mãe e o sistema grava "a mãe assinou", a prova
que a Aliviar guarda é **falsa** — e ela desmorona no primeiro questionamento,
levando junto a credibilidade de todos os outros registros da mesma base.

O documento já diz isso muito bem; eu só reforço que **é a razão principal, não
a secundária**. Registro honesto de representação vale mais que registro falso
de titularidade.

**O que a V1 deve fazer quando o caso aparecer** (e vai aparecer — paciente
idoso, filho conduzindo):

1. O ato acontece **fora do sistema**, em papel;
2. A equipe **registra que houve representação**, com nome e CPF de quem assinou
   e em que qualidade;
3. O documento comprobatório é anexado.

**Menores:** LGPD art. 14 exige consentimento específico de ao menos um dos pais
ou responsável legal para dados de crianças, e o melhor interesse como critério.
Se a Aliviar pretende atender menores na V1, isso é decisão de produto **antes**
de ser de contrato.

**Confiança: alta** na recomendação; **a decisão sobre menores é do Fundador**,
não minha.

---

# 5 · D-8 — prazo do DSR, Encarregado e canal

**Leitura: 15 dias corridos, publicado.**

**Fundamento:** LGPD art. 19, II — a confirmação de existência ou o acesso aos
dados é fornecida em até **15 dias** contados da requisição, quando pedida em
forma completa. (O inciso I trata do formato simplificado, imediato.)

Para os demais direitos — correção, anonimização, portabilidade, eliminação — a
LGPD (art. 18, §3º) remete a prazo e forma de regulamentação da ANPD, que não
fechou o tema. **A prática de mercado é aplicar os mesmos 15 dias por analogia**,
e é o que eu recomendaria: **um prazo único, para todos os direitos, publicado.**

Prometer mais que a lei é permitido; prometer menos, não. Um prazo único evita a
tela ter de explicar por que um pedido tem prazo e outro não.

**Encarregado:** já preenchido no documento — **Caio Padilha**. Coerente com a
ADR-055.

**Canal — e aqui há um problema real que não é jurídico:** o documento traz
`padilhacaiobarbosa@gmail.com`. **Um canal de exercício de direitos de uma
empresa de dados de saúde não deveria ser um Gmail pessoal.** Não é ilegal, mas
é frágil: some com a pessoa, não sobrevive a uma troca de responsável, e
comunica amadorismo justamente na página que existe para gerar confiança.

**Recomendação: `privacidade@` no domínio próprio** — o que amarra este item à
decisão de domínio que já estava na lista. **É mais uma razão para ela, e talvez
a melhor.**

**Confiança: alta** no prazo; a observação do canal é **de produto**, não jurídica.

---

# 6 · [19] — precedência entre o Anexo I e a Procuração

Este é o item mais interessante do documento, e tenho uma resposta que **não
depende de qual seja a resposta jurídica**.

**A pergunta:** o Anexo (3.1 e 4.1) e a Procuração (3.1) autorizam compartilhar
dados sensíveis com operadoras/ANS, com objetos sobrepostos. Se a pessoa revogar
um e mantiver o outro, qual prevalece?

**A leitura jurídica provável:** são bases distintas. O Anexo é **consentimento**
(LGPD art. 7º, I; art. 11, I para sensíveis). A Procuração é **mandato** — o que
ela dá é *poder de agir*, e o tratamento de dados que ela viabiliza se apoia na
execução do que foi contratado.

Disso decorre, na prática:

- **Revogou só a Procuração:** a Aliviar perde o poder de representar. Pode ainda
  deter os dados, mas não age perante terceiros.
- **Revogou só o Anexo:** o mandato existe no papel, mas a Aliviar não pode
  compartilhar o dado sensível necessário para exercê-lo. **O mandato fica oco.**

**A leitura de engenharia, e é a que eu recomendo implementar:**

> **A revogação de qualquer um dos dois bloqueia o compartilhamento de dado
> sensível com terceiros.**

Por quê: é a interpretação **mais restritiva**, e ela é segura sob qualquer
resposta que o advogado dê. Se ele disser que um prevalece sobre o outro,
libera-se depois — liberar é fácil. Ter compartilhado o que não podia é
irreversível.

**Isso destrava a implementação sem a resposta.** A pergunta continua valendo
para o advogado, mas deixa de ser bloqueio.

**Confiança: alta** na recomendação de engenharia; **média** na leitura jurídica.

---

# 7 · Os campos em branco — o que já dá para fechar

## O que o próprio documento já preencheu

Razão social, nome fantasia, CNPJ, sede e Encarregado **já estão lá**. O item
`[1]`, que a matriz aponta como um dos dois mais bloqueantes, **está quase
resolvido**.

## O que a ADR-107 respondeu esta semana

| Campo | Valor | Origem |
|---|---|---|
| **Preço** (C11, `[2]`) | R$ 500 por 12 meses | ADR-107 |
| **Forma de pagamento** | Até 12× de R$ 41,67, sem entrada | ADR-107 |
| **Vigência** (C5) | 12 meses | já confirmado no documento |

**C11 tem uma sub-pergunta que vale responder com cuidado:** *"o preço será
preenchido por paciente, no momento da geração do contrato?"* — **Não.** A
ADR-101 fixou que o preço é o mesmo para todos, sem margem de desconto. Então o
campo é **fixo no modelo**, não variável por pessoa. Isso simplifica a geração e
é coerente com a decisão comercial já tomada.

## O campo que esconde um risco — o foro

**CORRIGIDO em 31/08, ao ler o contrato real. Eu estava errado, e vale dizer
como.**

Escrevi que a cláusula de foro seria um risco de abusividade — que eleger a
comarca da sede (Areial/PB) faria a cláusula cair perante uma assistida de São
Paulo, pelo CDC (art. 101, I; art. 51, IV). **O raciocínio está certo; o alarme
não, porque a cláusula já se protege.** O texto real, que eu não tinha lido:

> *"15.1. Fica eleito o foro da comarca de [cidade/UF], com renúncia a qualquer
> outro, por mais privilegiado que seja, **sem prejuízo das regras protetivas
> eventualmente aplicáveis ao consumidor**."*

A ressalva final é exatamente a proteção que eu disse faltar. O advogado
antecipou o ponto. **O que resta é só preencher a comarca** — e a escolha de
Areial/PB não cria o risco que eu apontei, porque a própria cláusula cede às
regras do consumidor quando elas incidirem.

**Fica como pergunta menor, não como risco:** vale confirmar se ele prefere a
comarca da sede ou a do domicílio do contratante — mas nenhuma das duas quebra o
instrumento. **Confiança: alta**, agora com o texto na mão.

## Os que faltam e são do Fundador, não do advogado

- **Representante legal (nome e CPF)** — presumo que seja você.
- **Cidade/UF dos instrumentos** — a cidade de referência da assinatura.
- **Aviso prévio para denúncia imotivada** (C10, `[4]`) — **30 dias** é o padrão
  de mercado e não há prazo legal fixo. Nada impede 15, se você preferir mais
  leve para quem sai.
- **Prazo do mandato** (D2, `[6]`) — **leitura: 12 meses, igual à vigência do
  contrato.** Se for menor, a representação morre antes do serviço acabar; se
  for maior, a Aliviar mantém poderes depois de o contrato encerrar, o que é pior.

---

# 8 · C8 — renovação automática

**Leitura: evitar na V1. Renovação por ato expresso.**

**Fundamento:** o CDC é hostil a cobranças que a pessoa não pediu ativamente
(art. 39, III, sobre o fornecimento sem solicitação prévia é o espírito), e
renovação automática em contrato de adesão exige, no mínimo, aviso prévio claro
e caminho fácil de saída.

**E há a razão de produto, que acho mais forte:** a Aliviar vende independência.
Renovar sozinha a cobrança de quem não pediu é exatamente o gesto que
contradiz isso. **Um e-mail perguntando "quer seguir?" custa nada e diz tudo.**

**Confiança: média-alta** no jurídico; **alta** na recomendação de produto.

---

# 9 · O que NÃO é trabalho do advogado

**`[9]` — Política de Privacidade e Termos de Uso do site.**

Estes dois **não estão entre os cinco documentos**, e não deveriam esperar por
eles. Uma política de privacidade é, antes de tudo, **descrição factual do que o
sistema faz** — que dado coleta, para quê, com quem compartilha, por quanto
tempo guarda. Isso nós sabemos melhor que qualquer advogado, e o
`LEVANTAMENTO_FACTUAL_PARA_A_POLITICA.md` existe exatamente para isso.

**Recomendação:** escrever a política a partir do levantamento factual e mandar
ao advogado para **revisão**, não para redação. É mais rápido, mais barato e mais
exato — e destrava o `SIM-60`, que é o que arma o gate de aceite.

**`[11]` — Política interna sobre uso de dados estatísticos.** Também nossa: o
Termo de Idoneidade a cita como limite vinculante, e ela **não existe**. Enquanto
não existir, a cláusula remete ao vazio. É documento curto e é de produto.

**`[12]` — Questionário de Homologação.** Leitura: **permanece coberto pela
declaração de veracidade** (cláusula 2.1), com uma condição técnica — que o
sistema guarde uma **fotografia imutável** das respostas vinculada ao termo
assinado (é a pergunta F7, e a resposta é sim). Assim a declaração é
reconstituível anos depois sem transformar o questionário em documento assinado
próprio.

**`[22]` — a restrição permanente.** Confirmo a leitura do documento: **a Rede
não pode ter vitrine pública de profissionais nem exibir estatística individual
fora do contexto da assistida vinculada.** Hoje é verdade no sistema; deve virar
regra registrada — e é candidata a ADR, porque restringe todo produto futuro.

---

# 10 · O que dá para construir agora, sob qualquer resposta

Esta é a seção que justifica o documento. **Nada abaixo depende de como o
advogado responder** — tudo é seguro sob qualquer resposta:

1. **A rota `/aceites`** e a guarda `requireAceitesEmDia` ligada nos layouts
   (fecha o `SIM-60`). O que muda com a resposta é *quais* documentos exigir,
   não a existência da tela.
2. **O motor de assinatura N2**: documento personalizado, rolagem obrigatória até
   o fim, digitação do nome conferida com o cadastro, e o registro de
   quem/quando/onde + hash do texto exato. **N2 é piso**; se o advogado pedir N3
   para a Procuração, acrescenta-se um provedor **em cima** — não se refaz.
3. **A regra restritiva do `[19]`**: revogação de qualquer instrumento bloqueia
   compartilhamento de sensível. Segura sob qualquer resposta.
4. **A geração da Procuração em PDF baixável e imprimível** — resolve o cenário
   de firma reconhecida sem depender de saber se alguma operadora vai exigir.
5. **O prazo de 15 dias na tela de DSR**, com alerta de vencimento para a
   operação.
6. **A Política de Privacidade** escrita do levantamento factual.

**O que continua bloqueado de verdade:** publicar os **textos** dos cinco
documentos (dependem das confirmações C, D, E, F) e o **título executivo**
(depende do D-6). Nada mais.

---

# 11 · O que eu perguntaria primeiro, se fosse uma pergunta só

Não é a D-6 inteira. É esta:

> **O nosso N2 — documento personalizado, rolagem até o fim, nome digitado
> conferido com o cadastro, registro de quem/quando/onde e hash de integridade —
> é suficiente para o Contrato, e dispensa as duas testemunhas do fecho?**

Ela carrega a D-3 e a D-6 juntas, e é a única cuja resposta muda o **tamanho** da
implementação em vez de só o conteúdo dela.

---

## Como este documento deve ser usado com o advogado

**Não o envie no lugar do outro.** O
`PENDENCIAS_JURIDICAS_PARA_IMPLEMENTACAO_DOCUMENTAL.md` é o documento formal, com
os campos para preencher — ele continua sendo o que se manda.

Este aqui serve para duas coisas:

1. **Para você**, decidir o que construir enquanto espera (seção 10);
2. **Opcionalmente**, como anexo secundário — algumas pessoas respondem muito
   mais rápido a "confirma ou corrige esta leitura?" do que a uma folha em
   branco. Se enviar, envie com o aviso da capa intacto: **é leitura de
   engenharia, não parecer.**
