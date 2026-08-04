# Decisões do Módulo de Governança Documental — Aliviar 1.0

Fechamento das oito decisões da §19 de [`ARQUITETURA_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md`](ARQUITETURA_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md), contra o texto real dos cinco documentos jurídicos recebidos.

**Status:** proposta de decisão. Nada aqui está aprovado. Documento separado — e não apêndice da arquitetura — porque as decisões ainda não foram formalizadas: a arquitetura permanece intacta até que sejam.

**Natureza:** nenhum documento jurídico foi alterado, copiado para o repositório ou reescrito. Nenhuma cláusula é interpretada como norma. Onde a resposta depende de leitura jurídica, este documento **não responde** — marca a pergunta e nomeia o responsável.

**Fonte primária.** Os cinco arquivos `.docx` não estão no repositório; foram lidos de `C:\Users\barbo\Downloads` em cópia temporária fora do projeto, sem edição:

| Documento | Arquivo lido |
|---|---|
| Contrato | `CONTRATO DE PRESTAÇÃO DE SERVIÇOS.docx` |
| Anexo I LGPD | `ANEXO I – TERMO LGPD E CIÊNCIA DE TRATAMENTO DE DADOS DO CONTRATANTE.docx` |
| Procuração | `PROCURAÇÃO PARTICULAR PARA REPRESENTAÇÃO ADMINISTRATIVA (1).docx` |
| Termo LGPD do Médico | `TERMO LGPD – TRATAMENTO DE DADOS PESSOAIS DO MÉDICO PARCEIRO.docx` |
| Termo de Idoneidade | `TERMO DE IDONEIDADE DOS DADOS FORNECIDOS PELO MÉDICO.docx` |

**Fonte secundária:** arquitetura aprovada, migrations `20260803140000` e `20260803150000`, `src/modules/governanca/*`, `tests/integration/governanca-aceites.integration.test.ts`.

---

## Achado que precede todas as decisões

> **Os cinco documentos recebidos são de regime Instrumento. Nenhum é de Adesão.**

Todos nomeiam e qualificam o titular dentro do corpo que será assinado — não apenas no cadastro. O Contrato qualifica o CONTRATANTE com oito campos; o Anexo I abre com `TITULAR DOS DADOS: [NOME], CPF nº [xxx]`; a Procuração qualifica o OUTORGANTE; os dois termos do médico abrem com nome, CRM/UF, RQE e CPF. Os cinco encerram com cidade, data e linha de assinatura nominal.

**A §2.3 da arquitetura classificou quatro deles como Adesão. Está errada contra o texto real.** A correção precisa ser feita quando estas decisões forem aprovadas.

**Consequência direta no roadmap:** G3 (regime de instrumento) deixa de ser um incremento posterior e passa a ser **pré-requisito de qualquer publicação**. Sem ele, o único documento publicável seria uma Política de Privacidade ou Termos de Uso de adesão — e nenhum dos dois foi recebido. G1 sozinho não coloca documento nenhum em produção.

Segundo achado, de sinal contrário e igualmente importante: **o próprio Contrato autoriza a assinatura eletrônica e o uso de registros eletrônicos como prova** (cláusula 11.1 e 11.2). O modelo de aceite auditável já implementado não precisa de fundamento contratual novo — ele tem fundamento no texto que a pessoa assina. Isso sustenta o nível N2 sem depender de plataforma externa.

---

# Parte 1 — Inventário documental real

## 1.1 Contrato de Prestação de Serviços de Assessoria Administrativa e Operacional em Saúde Suplementar

| Campo | Leitura |
|---|---|
| **Público-alvo** | Paciente (CONTRATANTE), pessoa física |
| **Finalidade** | Assessoria administrativa, documental e operacional; interlocução com prestadores, operadoras e ANS. O texto exclui expressamente ato médico, diagnóstico, prescrição e promessa de resultado (1.2, 2.2) |
| **Regime** | **Instrumento** — qualificação completa do contratante, preço, prazo e foro no corpo assinado |
| **Obrigatoriedade** | Obrigatório. É o instrumento que constitui a relação; sem ele nada mais se sustenta |
| **Momento da jornada** | Contratação — primeiro ato, antes da história clínica |
| **Campos variáveis** | **Da CONTRATADA (fixos por publicação):** razão social, CNPJ, sede. **Do CONTRATANTE:** nome, nacionalidade, estado civil, profissão, RG, CPF, endereço. **Do negócio:** preço (9.1), forma de pagamento (9.1), prazo de vigência e data de início (10.1), dias de aviso prévio (10.2.b), comarca do foro (15.1), cidade e data |
| **Assinantes** | CONTRATADA, CONTRATANTE e **duas testemunhas com nome e CPF**, em duas vias — conforme o fecho do documento |
| **Revogação** | Não revogável no sentido de consentimento. Prevê **rescisão** por acordo, denúncia, infração, perda de objeto ou inviabilidade (10.2), com efeitos que sobrevivem ao término (10.4) |
| **Download** | Necessário. Instrumento com obrigações recíprocas e valor econômico |
| **Relação com os demais** | Incorpora o **Anexo I** como parte integrante para todos os fins (13.1); remete a **procuração em instrumento próprio** para representação (4.2); a cláusula 8 trata das informações de profissionais, ligando-se ao **Termo de Idoneidade**; a cláusula 11 é o fundamento contratual da assinatura eletrônica |

**Nota técnica:** a cláusula 11.2 autoriza expressamente o uso de protocolos, e-mails e documentos eletrônicos como meio de prova da execução. O pacote de prova previsto na arquitetura (§8.2) é exatamente esse artefato.

## 1.2 Anexo I — Termo LGPD e Ciência de Tratamento de Dados do Contratante

| Campo | Leitura |
|---|---|
| **Público-alvo** | Paciente, na qualidade de titular de dados |
| **Finalidade** | Declarar finalidades, categorias, compartilhamento, retenção, direitos e segurança; e colher **consentimento específico para dados sensíveis de saúde** (4.1) |
| **Regime** | **Instrumento** — abre nomeando controladora e titular com CPF, encerra com cidade, data e assinatura nominal |
| **Obrigatoriedade** | Obrigatório. Sem ele não há base declarada para tratar dado de saúde |
| **Momento da jornada** | Imediatamente após o Contrato, na mesma sessão de contratação |
| **Campos variáveis** | Razão social e CNPJ da controladora; nome e CPF do titular; cidade e data |
| **Assinantes** | Titular e controladora |
| **Revogação** | **Sim, revogável — dito pelo próprio texto** (8.1): a qualquer tempo, mediante solicitação expressa, sem invalidar tratamentos anteriores e com ciência de que pode comprometer a continuidade dos serviços |
| **Download** | Necessário |
| **Relação com os demais** | É anexo integrante do Contrato (13.1 do Contrato). Sua cláusula 3.1 autoriza compartilhamento com operadoras e ANS — objeto que **se sobrepõe parcialmente** à cláusula 3.1 da Procuração (ver Parte 6, item 10) |

**Nota técnica:** o item 4.1 exige consentimento "livre, informado, específico e destacado". Destacado é requisito de **forma de apresentação**, e a tela precisa cumpri-lo — não basta estar no meio do texto corrido. Ver Parte 4.

## 1.3 Procuração Particular para Representação Administrativa

| Campo | Leitura |
|---|---|
| **Público-alvo** | Paciente, como OUTORGANTE |
| **Finalidade** | Outorgar poderes de representação **exclusivamente administrativa** perante operadoras, administradoras, ouvidorias, centrais de atendimento, prestadores e ANS, inclusive fluxos de NIP |
| **Regime** | **Instrumento** — qualificação do outorgante, prazo do mandato, cidade e data |
| **Obrigatoriedade** | **Condicional.** Só quando o caso envolver representação administrativa — o próprio Contrato a trata como instrumento próprio e eventual (4.2) |
| **Momento da jornada** | No momento em que a Curadoria identifica necessidade de atuação perante operadora, ouvidoria ou ANS — depois da contratação, não no onboarding |
| **Campos variáveis** | Do outorgante: nome, nacionalidade, estado civil, profissão, RG, CPF, endereço. Da outorgada: razão social, CNPJ, sede, **nome e CPF do representante legal**. Do mandato: **prazo em meses** (4.1), cidade e data |
| **Assinantes** | **Somente o OUTORGANTE.** O fecho traz uma única linha de assinatura, com CPF. **O texto não prevê testemunhas nem reconhecimento de firma** |
| **Revogação** | **Sim — dito pelo texto** (4.1): revogável a qualquer tempo, **por escrito**, preservados os atos praticados até a ciência formal da revogação |
| **Download** | **Indispensável.** É o único dos cinco cujo destinatário é externo: operadora, ouvidoria ou ANS. Precisa sair do sistema em arquivo apresentável a terceiro |
| **Relação com os demais** | Derivada do Contrato (4.2). Sua cláusula 3.1 autoriza acesso e compartilhamento de dados sensíveis, sobrepondo-se ao Anexo I |

**Notas técnicas.** (1) O prazo em meses cria uma exigência que a arquitetura ainda não previu: **vigência do instrumento assinado**, distinta da vigência da versão do modelo — uma procuração assinada expira sozinha e o sistema precisa saber disso. (2) A revogação "por escrito, com efeito a partir da ciência formal" significa que revogar no produto tem de **produzir um documento datado**, não apenas gravar uma linha. (3) A cláusula 5.1 autoriza atuação por prepostos, o que liga o mandato à identidade de quem opera — fora do escopo deste módulo, mas relevante para a Curadoria.

## 1.4 Termo LGPD — Tratamento de Dados Pessoais do Médico Parceiro/Indicado

| Campo | Leitura |
|---|---|
| **Público-alvo** | Profissional da Rede Curada |
| **Finalidade** | Regular o tratamento dos dados do médico na formação, manutenção, avaliação e apresentação da rede; e colher **autorização específica de uso de imagem, nome e dados curriculares** (4.2) |
| **Regime** | **Instrumento** — abre com nome, CRM/UF e CPF do titular; encerra com cidade, data e assinatura nominal |
| **Obrigatoriedade** | Obrigatório para integrar a Rede |
| **Momento da jornada** | Homologação, antes da publicação do perfil |
| **Campos variáveis** | Razão social e CNPJ da controladora; nome, CRM/UF e CPF do titular; cidade e data |
| **Assinantes** | Controladora e profissional |
| **Revogação** | **Parcial e prospectiva** (9.1, 9.2): a revogação da autorização de imagem ou exposição pública não afeta tratamentos já realizados nem os fundados em outras bases, e **pode inviabilizar a manutenção do perfil na rede** |
| **Download** | Necessário, no dossiê interno |
| **Relação com os demais** | Forma par com o Termo de Idoneidade, que manda interpretá-los em conjunto (9.2 do Idoneidade) |

**Nota técnica — esta é a evidência que decide a D-2.** A cláusula 9.2 diz que a retirada de autorizações **pode inviabilizar a manutenção do perfil público**. O produto precisa de um gatilho: revogação da autorização de imagem → despublicação do perfil na Rede. Sem isso, o sistema continuaria exibindo o que o titular deixou de autorizar.

## 1.5 Termo de Idoneidade dos Dados Fornecidos pelo Médico

| Campo | Leitura |
|---|---|
| **Público-alvo** | Profissional da Rede Curada |
| **Finalidade** | Declaração de veracidade e idoneidade dos dados fornecidos; autorização de uso, tratamento, avaliação e **compartilhamento restrito**; condições de pesquisa interna e limites de publicação |
| **Regime** | **Instrumento** — qualificação com CRM/UF, RQE e CPF; cidade, data e assinatura nominal |
| **Obrigatoriedade** | Obrigatório para integrar a Rede |
| **Momento da jornada** | Homologação, **depois** de o profissional fornecer os dados — a declaração recai sobre dados que já existem |
| **Campos variáveis** | Razão social e CNPJ da plataforma; nome, CRM/UF, RQE e CPF do profissional; cidade e data |
| **Assinantes** | Plataforma e profissional |
| **Revogação** | **Parcial.** A revogação alcança autorizações de imagem, currículo e exposição, por escrito e com efeitos prospectivos (8.2). A declaração de veracidade em si não é objeto de revogação. Vigência por prazo indeterminado (8.1) |
| **Download** | Necessário, no dossiê interno |
| **Relação com os demais** | Interpretado em conjunto com o Termo LGPD do Médico (9.2); pressupõe **relação contratual** com a plataforma (3.1, 6.3) e uma **política interna** sobre uso de dados estatísticos (3.2.d) — nenhuma das duas foi recebida |

**Nota técnica de alto valor.** A cláusula 2.1 declara verdadeiros "todos os dados fornecidos à PLATAFORMA", e a 2.2 obriga a atualizá-los imediatamente. No produto, esses dados são o **Protocolo da Prática** e a Base de Evidências já implementados. Ou seja: **o Termo de Idoneidade é o que dá peso jurídico ao Protocolo da Prática.** Recomendação técnica: o registro do aceite deve carregar, no `contexto`, o identificador e o hash da submissão do Protocolo vigente naquele momento — senão a declaração recai sobre um conjunto de dados que ninguém consegue reconstituir depois. A cláusula 2.2 também sugere reconfirmação periódica, hoje inexistente.

## 1.6 Mapa de relações

```
CONTRATO  ──13.1 incorpora──►  ANEXO I (LGPD do contratante)
    │
    └──4.2 remete a────────►  PROCURAÇÃO  (condicional, destinatário externo)
    │
    └──8.1 refere-se a informações de profissionais
                                  │
TERMO LGPD DO MÉDICO ◄──9.2 interpretar em conjunto──►  TERMO DE IDONEIDADE
                                                              │
                                              2.1 recai sobre ─┘
                                              os dados do Protocolo da Prática
```

---

# Parte 2 — Decisões D-1 a D-8

Transcritas com a redação original da §19. Cada uma marcada como **INTERNA** (podemos decidir) ou **JURÍDICO** (precisa voltar ao advogado).

---

## D-1 — "Contratar os serviços" no onboarding inclui pagamento?

**Classificação: INTERNA, com uma confirmação pontual do Jurídico.**

**Problema.** A orientação aprovada diz que contratar significa assinar eletronicamente o Contrato, e que cobrança fica para módulo próprio sem bloquear a arquitetura documental — "salvo se o contrato exigir expressamente outra coisa". O contrato exige algo próximo disso.

**O que o texto diz.** A cláusula 9.1 fixa preço e forma de pagamento **dentro do instrumento**: `a quantia de R$ [XXX], da seguinte forma: [XXX]`. A 9.2 condiciona despesas extraordinárias a informação e aceite prévios. A 9.3 dá ao inadimplemento o efeito de suspender os serviços.

**Impacto no produto.** A separação entre assinar e pagar continua válida — o produto não precisa de checkout. Mas o instrumento assinado **não pode conter `R$ [XXX]`**: um contrato assinado sem preço é um contrato sem conteúdo econômico, e o efeito da 9.3 fica sem referência.

**Impacto técnico.** Preço e forma de pagamento entram como **variáveis obrigatórias da instância**, preenchidas por quem prepara o instrumento — não como integração de cobrança. Custo: dois campos no formulário de preparação. Nenhum acoplamento com meio de pagamento, faturamento ou conciliação.

**Impacto operacional.** Alguém da equipe passa a informar o valor acordado antes de o paciente assinar. Isso já acontece na conversa comercial; o que muda é onde o valor fica registrado.

**Impacto jurídico identificado no texto.** Cláusulas 9.1, 9.2 e 9.3. A pergunta que sobra — e que é do advogado — é se preencher o valor como variável da instância satisfaz a cláusula, ou se o texto precisa de ajuste de redação para contratação eletrônica.

**Opções.** (a) Preço como variável obrigatória da instância, cobrança fora do escopo. (b) Publicar preço fixo na versão do documento — inviável: mudaria a versão a cada tabela nova e cada paciente com condição diferente. (c) Assinar sem preço e formalizá-lo em aditivo — dobra os instrumentos e a chance de divergência.

**Recomendação: (a).** É a única que preserva a integridade do instrumento sem trazer cobrança para dentro do módulo.

**Consequência de adiar.** G3 não pode gerar instância de Contrato: a lista de variáveis obrigatórias fica indefinida.

**Responsável.** Fundador e Produto decidem; Jurídico confirma a suficiência da forma.

---

## D-2 — Pendência legal impede publicar o profissional na Rede?

**Classificação: INTERNA, com confirmação do Jurídico sobre o gatilho de despublicação.**

**Problema.** `pendencias_legais_do_profissional()` já responde o que falta, e por decisão explícita da migration não bloqueia nada. Falta decidir se bloqueia.

**O que o texto diz.** O Termo LGPD do Médico, 4.2, é a autorização específica de uso de imagem, nome e dados curriculares para apresentação institucional — exatamente o que a publicação do perfil faz. A 9.2 diz que a retirada dessas autorizações **poderá inviabilizar a manutenção do perfil público na rede**. O Termo de Idoneidade, 6.3, prevê suspensão do perfil por falta injustificada de documentação comprobatória.

**Impacto no produto.** Publicar um perfil sem aceite vigente significa exibir dados curriculares e imagem sem a autorização que o próprio documento estabelece como fundamento.

**Impacto técnico.** Duas regras, não uma: **(i)** publicação bloqueada enquanto houver pendência legal; **(ii)** revogação da autorização de imagem **despublica** o perfil. A (ii) é a que hoje não existe em lugar nenhum e é a que o texto praticamente descreve.

**Impacto operacional.** A Curadoria passa a ter uma ordem obrigatória: registrar aceites antes de publicar. O painel precisa dizer qual documento falta, não apenas que falta algo.

**Impacto jurídico identificado no texto.** Termo LGPD do Médico 4.2 e 9.2; Termo de Idoneidade 6.3.

**Opções.** (a) Bloquear publicação e despublicar na revogação. (b) Só alertar, sem bloquear. (c) Bloquear a publicação, mas tratar a despublicação como decisão manual da equipe.

**Recomendação: (a).** Alertar sem bloquear transfere para a operação uma verificação que o sistema sabe fazer — e a promessa de "Rede Curada" fica desmentida no primeiro perfil publicado sem termo.

**Consequência de adiar.** G4 entrega dossiê sem efeito prático, e a Rede pode ser publicada sem base documental.

**Responsável.** Produto e Técnico decidem o bloqueio; Jurídico confirma se a revogação de imagem despublica automaticamente ou exige análise caso a caso.

---

## D-3 — Nível de assinatura exigido por documento

**Classificação: JURÍDICO, com recomendação técnica fundamentada no texto.**

**Problema.** A arquitetura oferece N1 (aceite autenticado), N2 (instrumento personalizado com declaração de vontade) e N3 (evidência externa, certificado ou OTP). Falta dizer qual vale para cada documento.

**O que o texto diz.** A cláusula 11.1 do Contrato reconhece como válidas as comunicações por meio eletrônico, **inclusive assinatura eletrônica**, desde que aptas à identificação mínima do remetente e do conteúdo. A 11.2 autoriza o uso de registros eletrônicos como prova. Nenhum dos cinco documentos exige certificado digital, plataforma específica ou reconhecimento de firma. A Procuração, cujo destinatário é externo, também não exige forma especial no texto.

**Impacto no produto.** Se N2 basta, o paciente assina na tela em uma sessão, sem sair do produto e sem custo por assinatura. Se a Procuração exigir N3, ela sai do fluxo digital contínuo.

**Impacto técnico.** N2 é implementável em G3 com o que já existe: sessão autenticada, instância imutável, duplo hash, IP, user-agent, nome digitado e conferido. N3 exige suboperador novo — o que, além do custo, obriga a atualizar a política de privacidade (ADR-056 documenta os suboperadores reais).

**Impacto operacional.** N3 introduz espera, custo por documento e um segundo sistema a operar e auditar.

**Impacto jurídico identificado no texto.** Contrato 11.1 e 11.2. Silêncio dos demais quanto à forma — silêncio que **não interpreto**.

**Opções.** (a) N2 para os cinco na 1.0. (b) N2 para os do paciente, N3 para a Procuração pelo destinatário externo. (c) N3 para todos.

**Recomendação técnica: (a), com (b) preparado.** A cláusula 11 dá base contratual ao N2; a estrutura já prevê `nivel`, `provedor` e `evidencia_externa`, então migrar a Procuração para N3 depois não exige refatoração. O risco real não é a validade entre as partes — é a **recusa da procuração eletrônica por uma operadora específica**, que é fato operacional a descobrir no piloto, não questão de arquitetura.

**Consequência de adiar.** G3 não sai: a tela de assinatura muda conforme o nível.

**Responsável.** **Jurídico.** Produto e Técnico apenas implementam.

---

## D-4 — O Anexo LGPD e o Termo LGPD do Médico são revogáveis?

**Classificação: RESPONDIDA PELO PRÓPRIO TEXTO. Resta ao Jurídico apenas o efeito da revogação parcial.**

**Problema.** A coluna `revogavel` de `legal_documents` precisa de valor por documento, e a revogação hoje é total: revoga-se o aceite inteiro.

**O que o texto diz.**

| Documento | Revogável? | Onde |
|---|---|---|
| Anexo I LGPD | **Sim, total** | 8.1 — a qualquer tempo, sem invalidar tratamentos anteriores |
| Procuração | **Sim, total** | 4.1 — por escrito, preservados atos até a ciência formal |
| Termo LGPD do Médico | **Sim, parcial** | 9.1 e 9.2 — alcança imagem e exposição pública; efeitos prospectivos |
| Termo de Idoneidade | **Sim, parcial** | 8.2 — alcança autorizações de imagem, currículo e exposição |
| Contrato | **Não.** Rescindível | 10.2 — rescisão, não revogação |

**Impacto no produto.** Dois dos cinco têm revogação **parcial** — a pessoa retira uma autorização específica e o restante do documento continua valendo. O produto de hoje não sabe expressar isso: `revoke_legal_acceptance` derruba o aceite inteiro.

**Impacto técnico.** É preciso registrar o **escopo da revogação** (total, ou parcial com a autorização atingida). A alternativa — modelar cada autorização como consentimento granular independente — é mais correta conceitualmente e bem mais cara, e mudaria a forma de apresentação dos documentos.

**Impacto operacional.** A equipe precisa saber, ao olhar um profissional, se ele revogou o termo inteiro ou apenas a imagem: as consequências são diferentes (sair da Rede vs. perfil sem foto).

**Impacto jurídico identificado no texto.** Anexo I 8.1; Procuração 4.1; Termo LGPD do Médico 9.1 e 9.2; Idoneidade 8.2; Contrato 10.2 e 10.4.

**Opções.** (a) Revogação com escopo declarado em campo próprio. (b) Consentimentos granulares como documentos separados — muda os documentos, decisão do Jurídico. (c) Só revogação total — contraria o texto de dois documentos.

**Recomendação: (a).**

**Consequência de adiar.** Publicar com `revogavel` errado produz duas falhas opostas: oferecer revogação onde o texto não a prevê, ou negá-la onde prevê. As duas são visíveis ao titular.

**Responsável.** Técnico implementa (a); **Jurídico define o efeito prático de cada revogação parcial** — em especial se a revogação de imagem do médico despublica o perfil (liga-se à D-2).

---

## D-5 — Ordem no onboarding: documentos antes ou depois da história?

**Classificação: INTERNA.**

**Problema.** Onde os documentos entram na jornada do paciente.

**O que o texto diz.** O Contrato constitui a relação e incorpora o Anexo I (13.1). O Anexo I autoriza o tratamento de dados sensíveis (4.1) — e a história clínica **é** dado sensível. Contar a história antes de assinar o Anexo significaria coletar dado de saúde antes da autorização declarada.

**Impacto no produto.** Sequência: contratar → autorizar → contar. É também a ordem emocionalmente honesta: a pessoa firma a relação antes de se expor.

**Impacto técnico.** O gate roda no layout de `/paciente` e o wizard de história já exige sessão e papel; nada de novo é necessário além de ligar o gate.

**Impacto operacional.** Nenhum. O provisionamento da conta (ADR-018) não muda.

**Impacto jurídico identificado no texto.** Anexo I 1.1.e e 4.1; Contrato 13.1.

**Opções.** (a) Documentos antes da história. (b) História primeiro, documentos antes da Curadoria. (c) Documentos ao final.

**Recomendação: (a).**

**Consequência de adiar.** G1 não define para onde o gate desvia.

**Responsável.** Produto.

---

## D-6 — Procuração exige testemunhas ou reconhecimento de firma?

**Classificação: JURÍDICO. É a decisão mais bloqueante deste conjunto — e o achado inverte a pergunta.**

**Problema.** A pergunta original supunha que o risco de forma estaria na Procuração. Está no Contrato.

**O que o texto diz.**

- **Procuração:** o fecho traz uma única linha — nome do outorgante e CPF. **Nenhuma testemunha, nenhum reconhecimento de firma, nenhuma exigência de forma especial.**
- **Contrato:** o fecho determina que as partes firmam o instrumento **em duas vias de igual teor e forma, juntamente com 2 (duas) testemunhas**, com blocos de nome e CPF para cada uma.

**A tensão é interna ao Contrato:** a cláusula 11.1 reconhece a assinatura eletrônica como válida, e o fecho pede duas vias físicas e duas testemunhas. As duas coisas não convivem no mesmo fluxo sem uma definição de quem redigiu o documento.

**Impacto no produto.** Se as testemunhas permanecerem como estão, o Contrato **não se completa em uma sessão digital**: seria preciso coletar nome, CPF e manifestação de duas pessoas que não são usuárias da plataforma — um fluxo com quatro assinantes, cadastro de terceiros e espera. Isso muda G3 substancialmente e afeta o tempo até o primeiro paciente ativo.

**Impacto técnico.** Três desenhos possíveis, de custo muito diferente: assinatura simples do titular (o que está projetado); instrumento com múltiplos assinantes e estados intermediários (fluxo de coleta, expiração, reenvio); ou testemunhas internas identificadas (colaboradores da empresa) — que é decisão jurídica sobre quem pode testemunhar, não escolha técnica.

**Impacto operacional.** Testemunhas externas exigem operação de acompanhamento por contrato. Testemunhas internas exigem política sobre quem assina e como isso é registrado.

**Impacto jurídico identificado no texto.** Fecho do Contrato vs. cláusula 11.1 do mesmo Contrato. Fecho da Procuração (sem testemunhas). Contrato 9.2, que cita "reconhecimento de firma" entre as despesas extraordinárias possíveis — indício de que o cenário foi cogitado, sem que nada o exija.

**Opções.** (a) Jurídico ajusta o fecho do Contrato para assinatura eletrônica, coerente com a cláusula 11 — G3 segue como projetado. (b) Testemunhas permanecem e o módulo ganha instrumento multi-assinante — G3 cresce muito. (c) Contrato assinado fora do sistema e apenas registrado — descaracteriza o objetivo desta fase para a jornada do paciente.

**Recomendação técnica: (a)**, por ser a única compatível com uma jornada digital contínua. **Mas a decisão não é nossa**, e não presumo que o fecho possa ser alterado.

**Pergunta operacional adicional, também do Jurídico:** operadoras, ouvidorias e a ANS aceitam procuração particular assinada eletronicamente, sem firma reconhecida? O texto não exige; o destinatário externo pode exigir na prática. Se exigir, a Procuração migra para N3 (ver D-3) — sem impacto na arquitetura, com impacto na jornada.

**Consequência de adiar.** **G3 fica bloqueado para o Contrato.** Os demais instrumentos podem avançar; o Contrato, que é a base da relação, não.

**Responsável.** **Jurídico**, integralmente.

---

## D-7 — Paciente representado (menor, incapaz, familiar) assina como?

**Classificação: JURÍDICO para a forma; INTERNA para o escopo do piloto.**

**Problema.** Quem assina quando o paciente não assina por si.

**O que o texto diz.** **Nada.** Os cinco documentos preveem um único titular pessoa física, qualificado e assinando em nome próprio. Não há campo, cláusula ou linha de assinatura para representante legal, responsável ou curador. Isso é ausência verificada, não interpretação.

**Impacto no produto.** É cenário realista no domínio da Aliviar: paciente idoso, paciente em tratamento oncológico com familiar conduzindo as tratativas, menor de idade. Hoje, na prática, o familiar assinaria no lugar do titular — e o registro diria que foi o titular. **Essa é a falha silenciosa a evitar:** um aceite eletrônico atribuído a quem não praticou o ato vale menos que um registro honesto de que outra pessoa o praticou.

**Impacto técnico.** O banco já tem a distinção de que se precisa: `natureza`, `registrado_por` e `forma_de_obtencao` foram criados justamente para separar "o titular praticou" de "a equipe registrou". Falta a figura do **representante**: quem, com qual vínculo, sob qual documento comprobatório.

**Impacto operacional.** Sem decisão, a equipe improvisa caso a caso — e o improviso não fica registrado.

**Impacto jurídico identificado no texto.** Ausência de previsão nos cinco documentos.

**Opções.** (a) 1.0 atende apenas titulares maiores e capazes assinando por si; qualquer outro caso é tratado fora do sistema e registrado com proveniência declarada. (b) Jurídico produz modelos com representante, e o módulo passa a suportar representação. (c) Aceitar assinatura de familiar sem distinção — **não recomendada em nenhuma hipótese**: registra como titular quem não é.

**Recomendação: (a) para a 1.0**, com a regra explícita de que representação, quando ocorrer, é registrada como tal e nunca como ato do titular.

**Consequência de adiar.** Não bloqueia G3 sob a opção (a). Bloqueia o atendimento de casos reais que aparecerão cedo.

**Responsável.** Produto define o escopo do piloto; **Jurídico decide a forma** se houver representação.

---

## D-8 — Prazo de resposta ao DSR

**Classificação: JURÍDICO.**

**Problema.** `data_subject_requests.prazo_em` existe vazia, esperando decisão (achado PRIV-03, ADR-055).

**O que o texto diz.** O Anexo I, item 6, lista os direitos do titular e **não fixa prazo nem indica canal de exercício**. O item 5 trata a retenção por referência a finalidade e obrigações, sem prazo numérico. Nenhum dos cinco documentos nomeia Encarregado ou canal de contato para exercício de direitos.

**Impacto no produto.** A área de pedidos já existe e mostra "aberto em ...", sem prometer prazo — o que hoje é honesto. Com prazo definido, o produto passa a exibir compromisso e a operação passa a ter alvo.

**Impacto técnico.** Preencher uma coluna existente e derivar o prazo na abertura. Baixo.

**Impacto operacional.** Alto: prazo declarado é promessa a cumprir, com alerta de vencimento e responsável designado (ADR-055 nomeia o Fundador como responsável interino).

**Impacto jurídico identificado no texto.** Anexo I, itens 5 e 6.

**Opções.** (a) Prazo definido pelo Jurídico. (b) Sem prazo declarado, apenas o registro do pedido. (c) Prazo interno operacional, não publicado.

**Recomendação: (a)**, junto com a designação do canal e do Encarregado — as três lacunas são a mesma conversa.

**Consequência de adiar.** Não bloqueia G1 nem G3. Bloqueia G8.

**Responsável.** **Jurídico** e o responsável por LGPD.

---

## 2.9 Separação por instância decisória

**Podemos decidir internamente (Fundador, Produto, Técnico):**

- **D-1** — preço como variável da instância; cobrança fora do escopo *(Jurídico apenas confirma a forma)*
- **D-2** — pendência bloqueia publicação na Rede *(Jurídico confirma o gatilho de despublicação)*
- **D-4** — revogação com escopo declarado *(Jurídico define o efeito de cada revogação parcial)*
- **D-5** — documentos antes da história
- **D-7 (escopo)** — a 1.0 atende titulares assinando por si

**Precisa voltar ao advogado, sem substituto interno:**

- **D-3** — nível de assinatura exigido por documento
- **D-6** — testemunhas e duas vias no fecho do Contrato; aceitação externa da procuração eletrônica
- **D-7 (forma)** — modelo com representante legal, se houver
- **D-8** — prazo de resposta, canal de exercício de direitos e Encarregado
- Toda a **Parte 6** abaixo

---

# Parte 3 — Slugs e classificação

Proposta de tabela definitiva. **Não gravada em banco.** Os cinco primeiros são os documentos recebidos; os dois últimos têm rota pública implementada e texto ainda não recebido.

| # | Slug | Título | Público | Regime | Obrigatoriedade | Evento que torna obrigatório | Ordem | Nível | Revogação | Download |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `contrato-de-prestacao-de-servicos` | Contrato de Prestação de Serviços de Assessoria Administrativa e Operacional em Saúde Suplementar | paciente | Instrumento | Obrigatório | Primeiro acesso autenticado do paciente | 1 | N2 *(pendente D-3/D-6)* | Não (rescisão) | Sim |
| 2 | `anexo-i-lgpd-do-contratante` | Anexo I — Termo LGPD e Ciência de Tratamento de Dados do Contratante | paciente | Instrumento | Obrigatório | Assinatura do documento 1 (anexo integrante) | 2 | N2 | **Sim, total** (8.1) | Sim |
| 3 | `procuracao-representacao-administrativa` | Procuração Particular para Representação Administrativa | paciente | Instrumento | **Condicional** | Curadoria declara necessidade de atuação perante operadora, ouvidoria ou ANS | 3 | N2 *(N3 se destinatário externo exigir)* | **Sim, total, por escrito** (4.1) | Sim — **destinatário externo** |
| 4 | `termo-lgpd-do-medico` | Termo LGPD — Tratamento de Dados Pessoais do Médico Parceiro/Indicado | profissional | Instrumento | Obrigatório | Entrada em homologação | 1 | Registro pela equipe *(natureza `registrado_pela_equipe`)* | **Sim, parcial** (9.1, 9.2) | Sim — dossiê interno |
| 5 | `termo-de-idoneidade-do-medico` | Termo de Idoneidade dos Dados Fornecidos pelo Médico | profissional | Instrumento | Obrigatório | Submissão do Protocolo da Prática | 2 | Registro pela equipe | **Sim, parcial** (8.2) | Sim — dossiê interno |
| 6 | `politica-de-privacidade` | Política de Privacidade | paciente, profissional, equipe | Adesão | A definir | Primeiro acesso | 0 | N1 | Não | Sim, pública |
| 7 | `termos-de-uso` | Termos de Uso da Plataforma | paciente | Adesão | A definir | Primeiro acesso | 0 | N1 | Não | Sim, pública |

**Notas.**

- **Ordem 0** para os documentos 6 e 7: se existirem, precedem o Contrato — descrevem a plataforma, não a relação de serviço. **Texto não recebido** (Parte 6, item 9).
- **Documento 3** é o único condicional. O evento que o torna obrigatório é um ato da Curadoria, não do sistema — precisa de um marcador no Case, hoje inexistente.
- **Documentos 4 e 5** têm ordem entre si: a Idoneidade declara veracidade sobre dados já fornecidos, então o Protocolo da Prática vem antes.
- **Contrato do profissional:** os documentos 4 e 5 pressupõem relação contratual (Idoneidade 3.1 e 6.3). Se existir contrato do profissional, ele entra como documento 8, de regime Instrumento e ordem 0 na audiência profissional. **Não recebido.**
- **Questionário de Homologação:** citado na diretriz do dossiê, existe no produto como **Protocolo da Prática** (dado estruturado, não documento jurídico versionado). Recomendação: permanece dado, e o Termo de Idoneidade é o que lhe dá peso jurídico — com o `contexto` do aceite carimbando o identificador e o hash da submissão vigente. Transformá-lo em documento assinado é decisão do Jurídico.

---

# Parte 4 — Jornada do paciente

## 4.1 Sequência recomendada

```
1. ENTRADA
   Conta provisionada pelo Administrador (ADR-018). A pessoa recebe credenciais
   e faz o primeiro acesso. Nada muda aqui.

2. IDENTIFICAÇÃO
   O instrumento exige 8 campos de qualificação que a conta não tem hoje:
   nacionalidade, estado civil, profissão, RG, endereço completo.
   → Tela de qualificação ANTES do contrato.
     Um instrumento com lacuna não é oferecido para assinatura.
   → O que já existe no cadastro vem preenchido e é confirmado, não redigitado.

3. APRESENTAÇÃO
   Índice do que será assinado, em uma frase por documento:
   o que é, por que existe, o que muda para ela.
   Sem jargão. Sem modal. Sem "aceito tudo".

4. LEITURA
   Um documento por vez, com os PRÓPRIOS dados já no texto —
   é isto que distingue instrumento de termo padrão.
   Versão, vigência e permalink sempre visíveis.
   A confirmação só habilita ao fim do texto (evidência de N2).

5. CONSENTIMENTO DESTACADO PARA DADOS SENSÍVEIS
   Etapa visualmente própria, fora do corpo corrido:
   a cláusula 4.1 do Anexo I, na íntegra, em bloco destacado,
   com confirmação específica e separada da confirmação do Anexo,
   e com a consequência da recusa dita (o próprio texto a declara).

6. ASSINATURA
   Declaração de vontade: nome completo digitado, conferido com o cadastro.
   Servidor carimba: hash da instância + hash da versão-modelo +
   IP + user-agent + data/hora + nível.

7. EVIDÊNCIA
   Comprovante em tela: o que foi assinado, quando, sob qual versão,
   hash e onde reencontrar. Artefato PDF derivado (G5).
   A promessa "você reencontra isso quando quiser" fica verdadeira no mesmo dia.

8. LIBERAÇÃO
   Gate libera. A jornada segue para a história clínica e a Curadoria.
   A Procuração NÃO entra aqui: entra quando o caso a exigir.
```

## 4.2 Contrato e Anexo I: uma etapa ou duas?

**Recomendação: apresentação sequencial na mesma sessão, com dois atos independentes e um terceiro ato destacado dentro do Anexo.**

O que sustenta cada parte da recomendação:

- **Mesma sessão** — a cláusula 13.1 do Contrato incorpora o Anexo "para todos os fins". Separá-los em momentos distintos criaria um contrato vigente sem seu anexo integrante.
- **Atos independentes** — porque as revogabilidades divergem: o Anexo é revogável (8.1) e o Contrato não é. Um único ato para os dois tornaria a revogação do Anexo tecnicamente impossível sem desfazer o Contrato.
- **Consentimento sensível destacado** — o item 4.1 exige consentimento "livre, informado, específico e **destacado**". Destaque é forma de apresentação, e a tela precisa cumpri-lo: bloco visualmente separado, confirmação própria, gravada no `contexto` do aceite do Anexo (`consentimento_sensivel: true`), sob o mesmo hash.

**A questão que fica para o Jurídico:** se a confirmação destacada dentro do ato do Anexo satisfaz o requisito de especificidade, ou se o consentimento sensível deve ser um documento próprio, com aceite e revogação inteiramente independentes. **Não respondo isso.** A arquitetura suporta as duas formas; a segunda exige um sexto documento e é decisão de redação.

**Ordem final proposta:** Contrato (ato 1) → Anexo I (ato 2, com consentimento sensível destacado como confirmação própria) → *[condicional, depois]* Procuração (ato 3).

---

# Parte 5 — Jornada do profissional

## 5.1 Operação interna

```
1. ENTRADA EM HOMOLOGAÇÃO
   A Curadoria identifica e contata o profissional. Fora do sistema.

2. PERFIL CRIADO PELA EQUIPE
   /admin/profissionais/novo. Sem conta, sem login, sem portal.

3. DOCUMENTOS PREENCHIDOS
   A equipe prepara as instâncias com os dados do profissional
   (nome, CRM/UF, RQE, CPF, cidade, data).
   ORDEM: Protocolo da Prática ANTES do Termo de Idoneidade —
   a declaração de veracidade recai sobre dados que já existem (2.1).

4. PROFISSIONAL ASSINA OU FORNECE O ACEITE
   Fora do sistema. Ver 5.2.

5. EQUIPE REGISTRA A PROVENIÊNCIA
   register_professional_acceptances: forma de obtenção obrigatória,
   evidência quando existir, data real do ato (pode ser retroativa, nunca futura),
   ator lido de auth.uid(). O banco recusa registro sem forma declarada.
   O contexto carimba o id e o hash da submissão do Protocolo vigente.

6. DOSSIÊ
   Aba jurídica em /admin/profissionais/[id]: aceites, versões,
   evidências, pendências. Nunca visível ao paciente.

7. CURADORIA VISUALIZA E BAIXA
   Texto da versão pelo permalink (sem registro).
   Evidência assinada por URL assinada de 60s, com registro obrigatório
   gravado ANTES da emissão.

8. NOVA VERSÃO
   Versão material reabre pendência; editorial não perturba.
   Pendência aberta → perfil não publicável (D-2).
   Revogação da autorização de imagem → despublicação (D-2, texto 9.2).
```

## 5.2 Como obter o aceite sem Portal do Profissional

Três alternativas, no máximo pedido:

### Alternativa A — Documento assinado, obtido pela equipe e registrado com proveniência

O profissional recebe os instrumentos pelo canal que a equipe já usa, assina — de próprio punho ou por qualquer ferramenta eletrônica que ele já utilize — e devolve. A equipe arquiva a evidência no bucket privado e registra o aceite declarando a forma de obtenção.

- **A favor:** é exatamente o que o banco já implementa e o que os testes já provam. Zero dependência externa, zero superfície pública nova, zero custo por assinatura. A distinção entre "o titular assinou" e "a equipe registrou" fica preservada por constraint — não some por descuido.
- **Contra:** depende de disciplina operacional; a qualidade da prova varia com a qualidade da evidência arquivada.

### Alternativa B — Link temporário externo

Token de uso único levando a uma tela de leitura e assinatura sem conta.

- **A favor:** assinatura eletrônica do próprio titular, com IP e user-agent.
- **Contra:** cria superfície pública autenticada por token — exatamente o que a 1.0 evitou ao não ter Portal. Token em e-mail ou WhatsApp é identificação fraca para documento com declaração de responsabilidade patrimonial (Idoneidade 7.2). Exige expiração, revogação, limite de tentativas e auditoria própria: é meio portal, com o custo de portal e a segurança de menos.

### Alternativa C — Plataforma terceira de assinatura

- **A favor:** trilha externa independente, mais próxima do N3, familiar ao profissional.
- **Contra:** suboperador novo — a ADR-056 obriga a documentá-lo na política de privacidade antes do primeiro uso; custo por documento; integração e um segundo sistema a auditar; e o dado do profissional passa a existir fora da nossa fronteira.

### Recomendação para a 1.0: **Alternativa A**

É a única que não adiciona superfície, fornecedor nem custo, e é a que o banco já sustenta com garantias testadas. A Rede da 1.0 é pequena e homologada uma a uma pela Curadoria — o gargalo não é a escala do registro, é o contato humano que já existe.

**Gatilho de revisão:** quando a Rede crescer a ponto de o registro manual atrasar homologações, ou se o Jurídico exigir N3 para os termos do profissional, a Alternativa C entra sem refatoração — muda `natureza`, `provedor` e `evidencia_externa`; a estrutura permanece.

---

# Parte 6 — Lacunas nos documentos recebidos

Lista objetiva para retorno ao advogado. Somente problemas concretos verificados no texto. Nenhuma sugestão de redação.

### Placeholders não preenchidos

1. **Nos cinco documentos** — razão social, CNPJ e sede da empresa em branco (`[RAZÃO SOCIAL]`, `[XXX]`, `[endereço completo]`). Nenhum documento pode ser publicado antes disso: são dados da CONTRATADA/CONTROLADORA/PLATAFORMA, fixos por publicação, não variáveis por titular.
2. **Contrato, cláusula 9.1** — preço (`R$ [XXX]`) e forma de pagamento (`[XXX]`) em branco. Ver D-1.
3. **Contrato, cláusula 10.1** — prazo de vigência (`[prazo]`) e data de início (`[data]`) em branco.
4. **Contrato, cláusula 10.2.b** — prazo de aviso prévio para denúncia imotivada (`[XXX] dias`) em branco.
5. **Contrato, cláusula 15.1** — comarca do foro (`[cidade/UF]`) em branco.
6. **Procuração, cláusula 4.1** — prazo do mandato (`[XXX] meses`) em branco. **É o único documento com validade própria que expira**; sem o prazo, não há como o sistema saber quando a representação deixa de valer.
7. **Procuração, preâmbulo** — nome e CPF do representante legal da outorgada em branco.
8. **Nos cinco** — cidade e data de assinatura em branco (variável da instância, resolvida na assinatura).

### Documentos mencionados e não recebidos

9. **Política de Privacidade e Termos de Uso da plataforma.** O produto tem as rotas `/privacidade` e `/termos` implementadas e servindo página de "ainda não publicado". Nenhum dos cinco documentos os substitui: os cinco regem a relação de serviço, não o uso da plataforma.
10. **Contrato do profissional.** O Termo de Idoneidade pressupõe relação contratual em duas cláusulas — 3.1 ("limites contratuais") e 6.3 ("encerramento da relação contratual") — e a 9.2 manda interpretá-lo "em conjunto com os demais instrumentos contratuais firmados entre as partes". Esse instrumento não foi recebido. **Existe?**
11. **Política interna da PLATAFORMA sobre uso de dados estatísticos.** Citada como limite vinculante no Termo de Idoneidade 3.2.d. Não recebida. Enquanto não existir, a cláusula remete a um documento inexistente.
12. **Questionário de Homologação.** Citado na diretriz do dossiê. No produto existe como Protocolo da Prática — dado estruturado, sem status jurídico. Precisa virar documento assinado, ou permanece dado coberto pela declaração de veracidade do Termo de Idoneidade (2.1)?

### Campos e cláusulas incompatíveis com assinatura digital

13. **Contrato, fecho** — "duas vias de igual teor e forma, juntamente com 2 (duas) testemunhas", com blocos de nome e CPF para cada testemunha. **Conflita com a cláusula 11.1 do próprio Contrato**, que reconhece a assinatura eletrônica como válida. Este é o item mais bloqueante da lista (ver D-6).
14. **Contrato, cláusula 9.2** — cita "reconhecimento de firma" e "autenticações" entre despesas extraordinárias possíveis. Não é exigência, mas indica que o cenário foi cogitado. Pergunta objetiva: alguma das assinaturas destes cinco documentos precisa de firma reconhecida?
15. **Procuração** — o texto não exige testemunha nem firma reconhecida. Pergunta operacional para o Jurídico: **operadoras, ouvidorias e ANS aceitam procuração particular assinada eletronicamente?** É o único documento com destinatário externo, e a recusa dele é operacional, não contratual.

### Ausências que afetam o cumprimento da LGPD pelo produto

16. **Nenhum dos documentos indica Encarregado (DPO), canal de contato ou endereço para exercício de direitos.** O Anexo I lista os direitos (item 6) sem dizer onde exercê-los; o produto tem a superfície de pedidos pronta e nenhum canal declarado para apontar.
17. **Nenhum prazo de resposta ao titular.** Ver D-8.
18. **Retenção sem prazo numérico** — Anexo I, item 5.1, e Termo LGPD do Médico, 7.1, ambos por referência à finalidade. A ADR-055 fixou retenção interna da v1; os textos não a refletem nem a contradizem.

### Sobreposições e pontos a conciliar

19. **Autorização de dados sensíveis em dois instrumentos.** O Anexo I (3.1 e 4.1) autoriza compartilhamento com operadoras, ANS e ouvidorias; a Procuração (3.1) autoriza acesso, uso, transmissão e compartilhamento dos mesmos dados para o mesmo destino. Objetos parcialmente sobrepostos, revogáveis de forma independente. **Se o titular revogar o Anexo e mantiver a Procuração — ou o inverso — qual prevalece?** O sistema precisa da resposta para saber o que bloquear.
20. **Ausência de previsão de representante legal nos cinco documentos.** Ver D-7.
21. **Revogação parcial sem delimitação expressa.** Termo LGPD do Médico 9.1/9.2 e Idoneidade 8.2 admitem revogar "autorizações de imagem, currículo ou exposição pública" sem enumerar o que exatamente cessa. Para implementar a revogação com escopo (D-4), é preciso saber quais autorizações são revogáveis isoladamente.
22. **Coerência verificada, sem conflito, mas com exigência para o produto.** Contrato 1.3, 2.4 e 8.2 permitem compartilhar informações curriculares e estatísticas "em contexto privado e restrito"; Idoneidade 3.3 proíbe uso aberto, ostensivo ou promocional. Os textos concordam — e juntos estabelecem uma **invariante de produto**: a Rede não pode ter vitrine pública de profissionais nem exibir estatística individual fora do contexto do paciente vinculado. Hoje isso é verdade no código; passa a ser restrição documentada.

---

# Parte 7 — Decisão para implementação

| Decisão | Recomendação | Quem aprova | Bloqueia G1? | Bloqueia G3? |
|---|---|---|---|---|
| **D-1** — Contratação e pagamento | Preço e forma como variáveis obrigatórias da instância; cobrança fora do escopo | Fundador + Produto *(Jurídico confirma a forma)* | Não | **Sim** |
| **D-2** — Pendência bloqueia publicação na Rede | Bloquear publicação; despublicar na revogação de imagem | Produto + Técnico *(Jurídico confirma o gatilho)* | Não | Não *(bloqueia G4)* |
| **D-3** — Nível de assinatura | N2 para os cinco; N3 preparado para a Procuração | **Jurídico** | Não | **Sim** |
| **D-4** — Revogabilidade | Respondida pelo texto; implementar revogação com escopo declarado | Técnico *(Jurídico define o efeito da revogação parcial)* | **Sim** | **Sim** |
| **D-5** — Ordem no onboarding | Documentos antes da história | Produto | **Sim** | Não |
| **D-6** — Testemunhas e forma | Jurídico decide o fecho do Contrato; procuração eletrônica a validar com destinatários | **Jurídico** | Não | **Sim — só para o Contrato** |
| **D-7** — Paciente representado | 1.0 atende titulares assinando por si; representação registrada como tal | Produto *(Jurídico decide a forma, se houver)* | Não | Não |
| **D-8** — Prazo de DSR | Prazo, canal e Encarregado definidos em conjunto | **Jurídico** | Não | Não *(bloqueia G8)* |

**Sobre G1 e G3 nesta leitura.** Como os cinco documentos são de regime Instrumento, **G1 sozinho não publica nenhum deles**. G1 continua entregando valor real — catálogo ativo, rota `/aceites`, gate ligado, trilha de auditoria —, mas o primeiro documento em produção depende de G3. A ordem do roadmap não muda; o que muda é a expectativa: **o marco "paciente assina" é G3, não G1.**

---

## O que precisa da sua aprovação antes do primeiro incremento técnico

**Bloqueiam G1** — sem estas duas, o gate não pode ser ligado:

1. **D-5** — documentos antes da história. Decisão sua, sem dependência externa.
2. **D-4** — `revogavel` por documento. O texto já respondeu quatro dos cinco; falta sua aprovação da leitura e, do Jurídico, o efeito da revogação parcial dos termos do médico.

**Bloqueiam G3** — sem estas, o paciente não assina:

3. **D-6** *(Jurídico)* — o fecho do Contrato exige duas testemunhas e duas vias, e a cláusula 11 do mesmo contrato admite assinatura eletrônica. **É a decisão mais bloqueante do conjunto** e é a única que pode multiplicar o tamanho de G3.
4. **D-3** *(Jurídico)* — nível de assinatura por documento.
5. **D-1** — preço e forma de pagamento como variáveis da instância.
6. **Item 1 da Parte 6** — razão social, CNPJ e sede. Nenhum instrumento é publicável sem isso.

**Não bloqueiam o início, mas devem ir ao advogado no mesmo retorno:**

7. Itens 9 a 12 da Parte 6 — documentos mencionados e não recebidos, em especial **se existe contrato do profissional**.
8. Itens 16 a 18 — Encarregado, canal de exercício de direitos e prazo (D-8).
9. Item 19 — precedência entre o Anexo I e a Procuração quando uma for revogada.
10. **D-7** — se haverá modelo com representante legal.

**Recomendação de sequência:** aprove D-5 e D-4 agora e a Parte 6 vai ao advogado em um único retorno, com D-3, D-6, D-7 e D-8 juntos. Enquanto a resposta não vem, G1 avança até o ponto em que o gate está ligado e o catálogo ativo — e para ali, sem publicar documento nenhum.

---

**Status:** aguardando aprovação. Aprovadas, estas decisões viram ADRs em `docs/DECISIONS.md`, e a arquitetura recebe duas correções: a §2.3 (regime dos cinco documentos) e a §5.3 (vigência própria do instrumento assinado, exigida pelo prazo da Procuração).
