# Manual Operacional do Curador — v1.0

> Referência oficial para treinamento, auditoria e operação do Curador
> Médico. Traduz o [Modelo da Curadoria v1.0](curadoria/MODELO_CURADORIA_V1.md)
> em prática — não cria regra nenhuma: tudo aqui já existe no domínio e é
> cobrado pelo sistema. Onde o Manual e o Modelo divergirem, o Modelo vale.
> Substitui o `MANUAL_DA_CURADORIA.md` anterior (pré-Modelo v1.0).

---

## Capítulo 1 — O papel do Curador

**O propósito da Curadoria** não é encontrar "o melhor médico". É identificar
**três caminhos de cuidado tecnicamente legítimos e compatíveis com as
prioridades que a pessoa declarou**. O objeto do seu trabalho é o caminho de
cuidado; o médico é quem o materializa.

**O que você faz:** conduz a Consulta Inicial; constrói o Perfil com a
pessoa; declara a compatibilidade de área de cada profissional; distribui os
pesos dos dois cruzamentos; avalia cada critério com evidência; seleciona os
três caminhos; escreve (ou revisa e assume) o Relatório; apresenta em
conversa.

**O que você não faz:** não decide pela pessoa; não recomenda um dos três;
não ordena por preferência; não inventa dado que o cadastro não tem; não
transforma ausência de informação em julgamento; não verifica cadastro (isso
é ato do Administrador — quem avalia não atesta).

**Limites éticos e responsabilidade.** Você é a única autoridade decisória da
Curadoria (ADR-035) — e por isso tudo o que você declara fica registrado com
seu nome e hora. A responsabilidade tem uma contrapartida: o sistema nunca
decide por você, e também nunca deixa uma decisão sua sem assinatura.

**Orientar ≠ decidir.** Orientar é dar à pessoa o que ela precisa para
decidir: os três caminhos, o que cada um oferece, o que cada um custa, e as
perguntas que valem ser feitas. Decidir é dela, sempre, no tempo dela.

---

## Capítulo 2 — Jornada da Curadoria

| Etapa | Objetivo | Entradas | Saídas | Concluída quando |
|---|---|---|---|---|
| **Consulta Inicial** | ouvir a história inteira e devolvê-la organizada | a história da pessoa | registro da consulta, compreensão confirmada | a pessoa reconhece o que você devolveu |
| **Construção do Perfil** | descobrir com ela o que importa nesta busca | a conversa | filtros obrigatórios + prioridades declaradas | os critérios estão registrados com as palavras dela |
| **Validação** | ela reconhecer o Perfil como seu | Perfil construído | Perfil `VALIDADO`, com sua nota de validação | você leu em voz alta e ela confirmou — registrado |
| **Curadoria Técnica (Mesa)** | comparar quem pode participar | Perfil validado + Rede publicada | declarações de área, pesos 2×100, avaliações, seleção de três | exatamente três selecionados, com justificativa |
| **Relatório** | o documento que ela relê sozinha | seleção + evidências | Relatório aprovado e emitido | você aprovou (autoria) e emitiu — congela |
| **Apresentação (Devolutiva)** | entregar em conversa, nunca por anexo | Relatório emitido | registro do encontro | dúvidas, observações e próximos passos registrados |
| **Escolha da pessoa** | a decisão dela | os três caminhos | decisão registrada por ela | ela registrou — ou registrou que nenhum serve |
| **Transição ao Concierge** | o acompanhamento assume | a escolha | Connection criada | o Concierge é o responsável visível |

O sistema cobra cada porta: a Mesa não abre sem Perfil validado; a seleção
não fecha sem três; o Relatório não emite sem aprovação; nada chega à pessoa
antes da entrega.

---

## Capítulo 3 — Construção do Perfil

**A conversa.** O Perfil nasce do que a pessoa fala, não de um formulário.
Pergunte pelo que pesa: *"Quanto pesa conseguir acessar este profissional?
Quanto pesa que ele acompanhe toda a sua jornada? Quanto pesa a forma como
você deseja ser cuidada?"* — são as perguntas oficiais dos três critérios de
prioridade.

**Filtro ou prioridade?** A régua: **filtro elimina; prioridade pondera.**
Só é filtro o que for inegociável para ela (área, UF, presencial, cuidado
contínuo). Um desejo tratado como filtro esvazia a Rede; um inegociável
tratado como peso entrega um caminho que ela já disse que não serve.

**Registro.** Grave o que ela declarou, com as palavras dela — nunca o que
você concluiu por ela. Nota registra contexto ("estado onde reside").

**Respostas vagas.** Não force um número nem uma resposta. Devolva exemplos
concretos ("se o profissional ideal atendesse a duas horas de distância,
isso mudaria algo?") e registre o que ela sustentar. O que continuar vago
fica como está: **incerteza registrada é informação; incerteza preenchida é
invenção.**

**Lacunas.** O que ela não declarou não existe no Perfil. O sistema tratará
como informação insuficiente — nunca como "não importa".

---

## Capítulo 4 — Avaliação Técnica (100 pontos)

Você distribui 100 pontos entre três critérios e avalia cada um em quatro
estados: **atende plenamente · atende parcialmente · não atende · informação
insuficiente**. Toda avaliação exige a frase de evidência — o sistema recusa
estado sem frase.

| Critério | Pergunta | Evidências que contam | O que NÃO conta |
|---|---|---|---|
| **Formação Profissional** | Quanto a formação responde ao caso? | graduação, residência, especialização, fellowship, instituições — verificadas, com fonte | quantidade de diplomas como mérito; título não verificado tratado como certo |
| **Experiência Profissional** | Quanto a experiência responde ao caso? | tempo, casos semelhantes, atuação atual, complexidade, frequência | idade; tempo desde a graduação; prestígio |
| **Histórico Profissional** | A trajetória transmite segurança para este caso? | vínculos, regularidade, histórico verificável; produção e docência quando relevantes | opinião, reputação de corredor, avaliações de pacientes |

**Divergência entre fontes:** registre-a (o sistema guarda as duas versões e
nunca escolhe uma). Divergência crítica aberta tira o profissional da Rede
visível até alguém resolvê-la com evidência.

**Quando marcar informação insuficiente:** sempre que a evidência não
sustentar conclusão. O peso do critério sai do cálculo e reaparece como
cobertura — o profissional não é punido; a lacuna fica visível. **Ausência
nunca vira zero.**

---

## Capítulo 5 — Perfil Assistencial

Cadastro estruturado de **como o profissional cuida** — sem pontuação, sem
adjetivos. Três eixos, espelhados pelos critérios de prioridade da pessoa:

- **Acesso**: estado, cidade, presencial/online, disponibilidade, tempo até a consulta;
- **Continuidade do Cuidado**: acompanhamento contínuo, retornos, pós-operatório, equipe;
- **Modelo de Atendimento**: decisão compartilhada, participação familiar, idiomas, acessibilidade.

Só fatos verificáveis. "Acolhedor" e "excelente comunicador" não são dados.
Campo em branco significa "não se sabe" — nunca "não oferece": a diferença é
a diferença entre verificar um cadastro e descartar uma pessoa.

---

## Capítulo 6 — Seleção dos três caminhos

1. **Área primeiro.** Você declara, com os dois textos à vista (o que o caso
   exige × o que o profissional declara): compatível · parcialmente
   compatível (participa só com a sua confirmação + justificativa) ·
   incompatível (justificativa obrigatória; eliminado **antes** de qualquer
   pontuação) · informação insuficiente (pendente de verificação — nunca
   descartado).
2. **Demais filtros** do Case (UF, cuidado contínuo…): quem não atende sai;
   quem não tem informação fica pendente.
3. **Cruzamento.** Dois resultados lado a lado — Avaliação Técnica 0–100 e
   Compatibilidade Assistencial 0–100 — cada um com a própria cobertura.
   **Eles nunca se somam.** Cobertura baixa com avaliação alta não é
   excelência: é incerteza.
4. **Seleção.** Exatamente três, distintos, todos participantes. Você
   escreve por que cada um entra (a justificativa menciona o que ele
   responde do caso e do Perfil dela) e o que cada um custa — **opção só com
   virtudes é recomendação disfarçada**. Pontos favoráveis não repetem a
   justificativa.

**Nunca existe "melhor médico". Existem três caminhos compatíveis, com
características e trade-offs diferentes.** A ordem é de apresentação, jamais
colocação.

---

## Capítulo 7 — Relatório

1. **Gerar rascunho assistido** (botão no editor): o sistema transforma o
   que você já declarou em texto organizado. Determinístico, sem IA — cada
   frase carrega a origem (sua declaração, evidência, cobertura, lacuna).
   O que os dados não sustentam fica pendente de você, nunca inventado.
2. **Revisar e editar** campo a campo. Salvar marca revisão — **salvar não é
   aprovar**. Regenerar sobre texto seu exige confirmação explícita.
3. **Aprovar**: o ato em que você assume a autoria da versão final, com nome
   e hora. Sem isso o sistema recusa a emissão.
4. **Emitir**: o documento congela. Nada nele muda depois — alteração
   posterior exige novo procedimento, nunca edição silenciosa.

**Você é o autor da versão final.** O rascunho é ferramenta; a assinatura é
sua.

---

## Capítulo 8 — Apresentação ao paciente

A entrega é **sempre uma conversa** — nunca uma notificação com anexo.

- Comece pelo **Perfil dela**: "você disse que isto pesava muito" — a
  apresentação inteira é resposta ao que ela declarou.
- Apresente os três como **caminhos**, na ordem do documento, dizendo que a
  ordem é de apresentação.
- Dê **o mesmo tempo e o mesmo tom** a pontos favoráveis e pontos de atenção
  — assimetria de entusiasmo é indução.
- Diga o que **não** se sabe (as lacunas do Relatório) — incerteza declarada
  é cuidado.
- Entregue as **perguntas sugeridas** como dela, para a primeira consulta.
- Encerre devolvendo a decisão: *"você não precisa decidir hoje"*. Registre
  a Devolutiva (dúvidas, observações, próximos passos).

**Nunca induza.** Nem por ênfase, nem por ordem, nem por "eu, no seu lugar".

---

## Capítulo 9 — Situações especiais

- **Informação insuficiente** num critério: avalie como tal, com a frase
  dizendo o que falta. A cobertura cai e a lacuna aparece no Relatório e na
  conversa. Se a lacuna for decisiva, peça verificação ao Administrador
  antes de fechar a seleção.
- **Divergência entre fontes**: registre com as duas versões e as duas
  fontes. Crítica → bloqueia a publicação/visibilidade do profissional até
  resolução com evidência, autor e data. Nunca escolha uma versão em silêncio.
- **Menos de três elegíveis**: a Curadoria **espera**. Não complete com
  parcialmente compatível sem convicção, não afrouxe filtro inegociável. O
  caminho é ampliar a Rede (cadastro/verificação) ou revisitar com a pessoa
  o que é de fato filtro — com ela, nunca por ela.
- **Interromper a Curadoria**: registre o motivo no Case e comunique a
  pessoa com a mesma transparência do resto. Trabalho parado sem dono é a
  falha; pausa declarada é legítima.
- **Mudança do Perfil após validação**: o Perfil validado é a base imutável
  da análise — não há edição silenciosa. Registre a solicitação; a mudança
  passa por nova conversa e nova validação com a pessoa (ver Observações ao
  final: o fluxo formal de reabertura ainda não existe no sistema).

---

## Capítulo 10 — Auditoria (checklist antes da emissão)

- [ ] Perfil **validado**, com nota de validação
- [ ] Área declarada para **todos** os participantes, com justificativa onde exigida
- [ ] Pesos: os dois cruzamentos fecham em 100
- [ ] Toda avaliação tem **evidência** (frase)
- [ ] Proveniência completa nos dados usados (fonte, verificação, autor, data)
- [ ] Nenhuma divergência **crítica** aberta nos três
- [ ] Exatamente **três** opções, distintas, cada uma com justificativa e ao menos um ponto de atenção
- [ ] Relatório **revisado** por você (não apenas gerado)
- [ ] **Aprovação** registrada (seu nome, sua hora)
- [ ] **Emitido** — e, a partir daqui, congelado

O sistema bloqueia a maioria destes itens tecnicamente; o checklist existe
para você nunca depender do bloqueio.

---

## Capítulo 11 — Perguntas frequentes

**Posso recomendar um profissional?**
Não. Você apresenta três caminhos legítimos com trade-offs diferentes. A
decisão é da pessoa (ADR-035). Recomendar — por palavra, ênfase ou ordem — é
decidir por ela.

**Posso remover um dos três caminhos?**
Antes da entrega: sim — refaça a seleção (continuam sendo três; a seleção
com dois não fecha). Depois de entregue: não — o documento é o que a pessoa
tem nas mãos. Fato novo relevante se trata na conversa e na Devolutiva.

**O que faço se faltar informação?**
Marque informação insuficiente com a frase do que falta. Nunca zero, nunca
"não atende". Se for decisiva, peça verificação antes de fechar. A lacuna
aparece na cobertura e na conversa — esconder lacuna é a única resposta
errada.

**Posso alterar o Perfil após a validação?**
Não silenciosamente. O Perfil validado é a base da análise. Mudança real =
nova conversa + nova validação com a pessoa, registrada.

**Como registro uma divergência?**
Com as duas versões e as duas fontes — o sistema preserva ambas e exige
evidência, autor e data para resolver. Você pode abrir divergência; quem
resolve cadastro é o Administrador.

**A nota alta decide?**
Não existe "nota" — existem duas avaliações separadas com cobertura. Números
organizam a leitura; a decisão considera avaliações, coberturas, evidências,
pontos de atenção e contexto clínico. O sistema organiza; você responde.

---

## Observações de alinhamento (verificação desta missão)

Conferido contra Modelo v1.0, ADRs, política de fontes, Relatório
Inteligente, Dashboard do Curador e Experiência do Paciente. Três registros,
sem alteração de domínio:

1. **Reabertura de Perfil validado não tem fluxo formal no sistema** — o
   Manual orienta o procedimento humano (nova conversa + nova validação);
   materializá-lo exigirá ADR (domínio congelado, §13).
2. **Ordenação interna de leitura está sem chave definida** desde o
   alinhamento v1.0 (§11) — a comparação apresenta na ordem da Rede; nova
   chave exige ADR.
3. **A validação de usabilidade da Mesa (sessão humana) segue pendente** —
   este Manual deve ser usado na sessão e revisado com o que ela ensinar.
