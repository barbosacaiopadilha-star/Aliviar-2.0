# ADR-D — Autoridade de Confirmação e Declaração

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` |
| **Estado** | **EM ELABORAÇÃO CONCLUÍDA — aguardando revisão constitucional do Agente 00.** Não lavrada em `DECISIONS.md` |
| **Natureza** | **Decisão de domínio.** Não descreve banco, migration, API, interface, policy concreta ou código |
| **Subordinada a** | Constituição da Aliviar · **ADR-035** (autoridade decisória única do Curador) · **ADR-040 item 6** (item congelado) · **ADR-060** (segregação de funções) · [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0 · [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) |
| **Completa** | [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) (o oferecimento) · [`ADR_B_JUIZO_HUMANO.md`](ADR_B_JUIZO_HUMANO.md) (o juízo). Esta fecha **a autoridade** |
| **Referencia** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 §2.4, §8.2, §14 · [`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`](IMPEDIMENTO_F_02_MODELO_DE_DADOS.md) · [`../CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](../CORRECAO_DOMINIO_PAPEIS_E_CASE.md) |
| **Origem** | Missão "ADR-D" · impedimento I-3 do pacote F-02 · pendência DP-9 |

> **Nada foi implementado.** Nenhuma tabela, migration, constraint, policy, API, interface,
> tipo, teste ou linha de código foi criada ou alterada. Nenhum documento canônico foi
> modificado. Este arquivo é o único produto da missão.
>
> **Por que não está em `DECISIONS.md`:** lavrar pressupõe aprovação. Mesmo motivo das
> ADR-A e ADR-B.

---

## Sumário executivo

A pergunta desta ADR é uma só: **quem tem autoridade para transformar uma proposta em
declaração válida?**

A resposta-raiz:

> **Confirmar é adotar.** Quem confirma não "aprova" a formulação de outro — passa a
> responder por ela **como se a tivesse formulado**. A autoria da declaração resultante é
> inteiramente de quem confirmou, e a regra que a sugeriu não divide essa autoria com
> ninguém.

Disso decorre a regra que organiza toda a ADR:

> **Só confirma quem poderia ter declarado.** A proposta não cria autoridade; ela oferece a
> quem já a tem. Se alguém precisa de autorização especial para confirmar algo, é porque não
> tinha autoridade sobre o fato — e então não deveria estar confirmando.

**Duas decisões consequentes**, ambas contra o esperado:

**(1) Esta ADR NÃO reabre a RLS congelada.** A pendência DP-9 supunha que a 2.0 exigiria
ampliar quem escreve o Mapa do Profissional (ADR-040 item 6). **Não exige.** O gargalo G4 é
de capacidade, e a 2.0 já o resolve pelo outro lado: o ato deixa de ser 28 digitações e
passa a ser 28 confirmações informadas. **Nenhum item congelado é tocado** — e ADR que
evita reabrir congelamento é melhor que ADR que o reabre bem.

**(2) Esta ADR cria uma regra nova de incompatibilidade**, que aperta em vez de afrouxar:

> **Quem confirma o Mapa de um profissional em um Case não pode ser quem julga e seleciona
> nesse mesmo Case.**

É *"quem avalia não atesta"* (ADR-060) aplicado ao ato novo. Hoje a regra **não é
exequível** — uma única conta acumula Administrador e Curador. Esta ADR declara a
incompatibilidade **agora**, exige que a exceção seja **visível** enquanto durar, e a vincula
à segunda conta que a ADR-060 já previu.

---

# PARTE I — Os cinco verbos da autoridade

## 1. O que significa confirmar

**Definição formal:**

> **Confirmar** é o ato pelo qual quem detém **autoridade originária** sobre um fato
> **adota como sua** uma formulação produzida por outrem — passando a **responder por ela
> como se a tivesse formulado** —, praticado de forma explícita, sobre uma formulação
> **visível na íntegra**, e registrado com autor, data e o que estava à vista.

Cinco elementos constitutivos:

| # | Elemento | Sem ele |
|---|---|---|
| 1 | **Autoridade originária** sobre o fato | é opinião de terceiro |
| 2 | **Formulação preexistente**, produzida por outro | não há o que confirmar (§7) |
| 3 | **Adoção** — o ato transfere a autoria para quem confirma | seria "aprovar", que divide responsabilidade e portanto a dissolve |
| 4 | **Visibilidade integral** do que se adota | é assinatura em branco |
| 5 | **Registro** com autor, data e contexto visível | não é auditável, logo não aconteceu |

**O elemento 3 é o coração desta ADR.** A formulação alternativa — "o sistema propôs e o
humano aprovou" — reparte a autoria entre uma regra e uma pessoa, e autoria repartida com
uma regra é autoria de ninguém. Aqui: **a regra sugeriu, a pessoa declarou.** A proposta
permanece como prova de que a sugestão existiu (ADR-A §3), e nada mais.

**Consequência dura, e desconfortável de propósito:** quem confirma uma proposta errada
**errou pessoalmente**. Não é possível dizer depois "o sistema sugeriu". O sistema sugeriu,
sim — e ele nunca teve autoridade nenhuma.

## 2. O que significa declarar

**Definição formal:**

> **Declarar** é o ato pelo qual quem detém **autoridade originária** sobre um fato o
> **afirma pela primeira vez**, sem que exista formulação anterior a adotar, respondendo
> integralmente por ele.

| Aspecto | Conteúdo |
|---|---|
| **Origem da formulação** | a própria pessoa que declara |
| **Autoridade exigida** | a mesma de confirmar — é a autoridade sobre o **fato**, não sobre o **ato** |
| **Registro obrigatório** | autor, data, e o que estava visível |
| **Produz** | uma **declaração** — entrada válida do Método (ADR-A §2 item 4) |

**Declarar e confirmar produzem o mesmo tipo de coisa.** A diferença está apenas em **de
onde veio a formulação**. É por isso que a autoridade exigida é idêntica, e é por isso que
a regra do §4 vale para os dois: *só confirma quem poderia ter declarado*.

## 3. Os cinco verbos, formalmente distinguidos

| Verbo | Definição | Quem pratica | Produz | Reversível? |
|---|---|---|---|---|
| **DECLARAR** | afirmar originariamente um fato sobre o qual se tem autoridade | quem tem a autoridade | **declaração** | por supersessão |
| **CONFIRMAR** | adotar como sua a formulação de outrem (§1) | quem tem a autoridade | **declaração** + registro do ato | por supersessão |
| **RECONHECER** | ato pelo qual a pessoa afirma que uma **representação de si** lhe corresponde | **somente a paciente** | **habilitação** — nunca um valor | **não** (ADR-049: supersessão, nunca reversão) |
| **VALIDAR** | verificar conformidade de algo a uma regra objetiva | **o sistema** | **verdadeiro/falso + motivo** | não se aplica |
| **REVISAR** | examinar sem concluir | qualquer papel previsto | **nada**, por si | não se aplica |

**As três distinções que mais importam:**

| Par | Diferença |
|---|---|
| **Confirmar × Reconhecer** | confirmar produz **valor**; reconhecer produz **habilitação**. A paciente, ao reconhecer o Perfil, não declara importância nenhuma — ela afirma que aquilo a representa, e destrava a Mesa. Tratar reconhecimento como confirmação transformaria a paciente em confirmadora do Mapa, invertendo a autoridade que a ADR-042 fixou |
| **Confirmar × Validar** | validar é do **sistema** e não cria fato: verifica que a proposta tem proveniência completa, que o conceito participa do Motor, que o catálogo é coerente. **Validação nunca substitui confirmação**, e proposta validada continua sendo proposta |
| **Confirmar × Revisar** | revisar **não produz nada**. "Revisado por" não é ato de domínio nesta versão: se produzisse efeito, seria confirmação com outro nome, e teria de exigir a mesma autoridade. Um sistema com "revisar" e "confirmar" convive com a dúvida sobre qual dos dois vale |

---

# PARTE II — Quem confirma

## 4. Quem pode confirmar — por ator

**A regra geral, da qual todas as linhas abaixo derivam:**

> **Só confirma quem poderia ter declarado.** A autoridade é sobre o **fato**, nunca sobre
> o **ato de confirmar**.

| Ator | Pode confirmar? | O quê, exatamente | Fundamento |
|---|---|---|---|
| **Paciente** | **Não** — e a ausência é proteção, não limitação | Nada. Ela **declara** (história, P1–P17, restrições) e **reconhece** (§3). Nenhuma proposta é dirigida a ela | Nunca se oferece a alguém a tradução do que ela mesma disse para que "confirme": isso a tornaria responsável por uma formulação do Método. O que ela faz sobre a tradução é **reconhecer ou discordar**, na tela de duas colunas (Arquitetura §6.2.1) |
| **Curador** | **Sim** | **A importância** dos conceitos com lado da pessoa, no Mapa de Prioridades do Case | ADR-039: o Mapa é declaração dele sobre o que este caso exige. Ele poderia declarar; logo pode confirmar |
| **Concierge** | **Não** | Nada. Sua autoridade começa depois da entrega | Correção de Domínio: Nível 3. Arquitetura §2.2 (correção C-3): não compõe, não aprova, não participa da formação da recomendação |
| **Administrador** | **Sim, no recorte vigente** | **O estado** do profissional no Mapa do Profissional | **ADR-040 item 6** — escrita é do `administrador`. Item congelado, **não reaberto** aqui (§14.2) |
| **Sistema** | **Nunca** | Nada. Ele **valida** (§3) e registra | Validar não é confirmar. Se o sistema pudesse confirmar, a Fronteira Humana seria decorativa |
| **Motor** | **Nunca** | Nada. Ele **lê** Mapas já confirmados | ADR-A §4: quem lê não propõe; e quem propõe não confirma. Fechar o laço destruiria a separação dos dois pipelines |
| **Autoridade de Método** | **Não, sobre instâncias** | Ela cria, versiona, suspende e revoga **regras** | ADR-A §14.3. Autoridade sobre a regra ≠ autoridade sobre o que a regra produz. Confundi-las faria de quem escreve a regra o confirmador tácito de tudo que ela gera |
| **Profissional** | **Não** | Ele **declara** a própria prática (Q1–Q28); não confirma o estado derivado dela | I-12: o profissional lê o que é dele; **a governança sobre ele continua da operação**. E §4.6 do Congelamento: autodeclaração nunca nasce verificada |

## 5. Quem nunca poderá confirmar

Proibições permanentes. Alterar qualquer uma exige ADR que revogue esta **e** decisão do
Fundador nos três primeiros casos:

| # | Nunca confirma | Por quê |
|---|---|---|
| 1 | **O Motor**, sobre qualquer coisa | fecharia o laço leitura → entrada |
| 2 | **O Sistema**, por decurso, silêncio, prazo, navegação, fim de sessão ou ação de terceiro | ADR-A §6 condição 3; **ausência de ação nunca é confirmação** |
| 3 | **A Autoridade de Método**, sobre instâncias geradas por regra que ela aprovou | seria juiz em causa própria, e apagaria o sinal de discordância que calibra a regra |
| 4 | **O Concierge**, sobre qualquer coisa anterior à entrega | Correção de Domínio |
| 5 | **A paciente**, sobre a tradução do que ela declarou | inverteria a autoridade e a tornaria responsável por formulação do Método |
| 6 | **O profissional**, sobre o próprio estado derivado | autodeclaração não nasce verificada |
| 7 | **Qualquer pessoa, em nome de outra** | delegação é proibida (§12) |
| 8 | **Quem julga e seleciona no Case**, sobre o Mapa do profissional daquele Case | regra nova desta ADR (§13.2) |

---

# PARTE III — As relações entre proposta, confirmação e declaração

## 6. Uma proposta pode existir sem confirmação?

**Sim — e é o estado normal, não uma anomalia.**

| Situação | Estado |
|---|---|
| Oferecida, ainda não vista | `PROPOSTA` |
| Vista e deixada em aberto | `PROPOSTA` — indefinidamente, **sem prazo** |
| Recusada | `RECUSADA` — existiu, e nunca produziu declaração |
| Origem retratada antes de qualquer ato | `SUPERADA` |
| Regra suspensa antes de qualquer ato | `RETIRADA` |

**Uma proposta jamais confirmada é um registro legítimo e completo.** Ela prova que houve
oferecimento; a ausência de desfecho prova que ninguém adotou. As duas informações são
igualmente úteis à auditoria, e nenhum mecanismo pode "limpar" propostas sem desfecho —
isso apagaria a evidência de que algo ficou por decidir.

## 7. Uma confirmação pode existir sem proposta?

**Não. Por definição.**

Confirmar é adotar formulação de outrem (§1); sem formulação anterior, não há o que adotar.
O que existe sem proposta é **declaração direta** (§2), e ela é o caminho majoritário: os 11
conceitos técnicos, o contexto clínico, os filtros, os juízos, a história, as respostas da
pessoa — nada disso nasce de proposta.

**Três consequências:**

| # | Consequência |
|---|---|
| 1 | **Não existe "confirmar" um valor formulado por outro humano.** Se um segundo Curador adota a formulação do primeiro, isso é **declaração nova**, com autoria própria — não confirmação. Chamar de confirmação diluiria a autoria entre dois humanos, que é o problema que o §1 elemento 3 evita |
| 2 | **Não existe confirmação retroativa** de declarações antigas sem proveniência (R-05 da Arquitetura). Elas permanecem marcadas como digitação anterior à 2.0; **inventar proposta retroativa para "regularizá-las" é proibido** |
| 3 | **Toda confirmação aponta para exatamente uma proposta** — nunca para várias, nunca para nenhuma |

## 8. Uma declaração pode nascer sem confirmação?

**Sim — e é assim que nasce a maioria delas.** As duas origens são igualmente legítimas e
produzem declarações com o mesmo estatuto:

| Origem | Exemplos | Autoria |
|---|---|---|
| **Declaração direta** | história e P1–P17 (paciente) · Q1–Q28 (profissional) · contexto clínico, 11 importâncias técnicas, filtros, área (Curador) · juízos H8–H11 (Curador) | de quem declarou |
| **Confirmação de proposta** | importância dos conceitos com lado da pessoa · estado do profissional no Mapa | de quem confirmou |

**Regra de não-ambiguidade:** uma declaração **sempre sabe qual das duas origens teve**, e
essa informação é parte da proveniência (§20). Uma declaração que não sabe de onde veio é
exatamente o defeito D1/D2 que a 2.0 existe para corrigir.

## 9. Quando a confirmação produz uma nova declaração

**Em um único caso:** quando quem tem autoridade **adota** o valor proposto, com o ato
válido em todas as condições da ADR-A §6.

O que se grava, em um ato indivisível:

| # | O que é gravado |
|---|---|
| 1 | **O ato de confirmar** — autor, data, proposta referenciada, o que estava visível |
| 2 | **A declaração** no Mapa, com o valor, **autorada por quem confirmou** |
| 3 | **O desfecho** `CONFIRMADA` na proposta, com o ponteiro para a declaração (ADR-A §9.4) |

**Atomicidade é domínio, não implementação:** os três precisam existir juntos ou nenhum
existe. Um ato registrado sem declaração produziria confirmação que não confirmou nada; uma
declaração sem ato produziria valor sem autor — que é a doença da 1.0.

> **A confirmação não move a proposta para dentro do Mapa. Ela cria uma declaração nova,
> que por acaso coincide com o que foi proposto** (ADR-A §6).

## 10. Quando a confirmação não produz declaração

| # | Situação | O que acontece |
|---|---|---|
| 1 | **Recusa** | ato registrado; **nada no Mapa**; o conceito volta a **lacuna** — nunca ao valor proposto, nunca a um valor anterior |
| 2 | **Retirada da proposta** antes do ato (regra suspensa/revogada) | não há o que confirmar |
| 3 | **Proposta superada** antes do ato | idem; nova proposta pode nascer, e **novo ato é exigido** |
| 4 | **Ato inválido** — falta qualquer condição da ADR-A §6 | o ato **não existe**; não há registro de tentativa |
| 5 | **Alvo já com declaração vigente** | **não deveria haver proposta**: proposta só é oferecida sobre alvo sem declaração vigente (§18.2). Se houver, é defeito |

## 11. Autoridade originária por categoria de informação

Tabela normativa. **Cada fato tem exatamente uma autoridade originária** (P-07).

| Categoria | Autoridade originária | Como entra | Confirmável? |
|---|---|---|---|
| **História clínica narrada** | **a paciente** | declaração direta, texto livre | não — texto livre nunca vira proposta |
| **Preferências e necessidades (P1–P17, com grau)** | **a paciente** | declaração direta, escala fechada | não por ela; **origina** proposta de importância |
| **Restrições e recusas (texto guiado)** | **a paciente** | declaração direta | não — texto guiado nunca atravessa ponte |
| **Reconhecimento do Perfil** | **a paciente, exclusivamente** | ato próprio | não — é reconhecimento, não confirmação (§3) |
| **Decisão final sobre o caminho** | **a paciente, exclusivamente** | ato próprio | não |
| **Contexto clínico estruturado** | **o Curador** | declaração direta | não |
| **Importância — conceitos com lado da pessoa** | **o Curador** | **confirmação de proposta** ou declaração direta | **sim** |
| **Importância — 11 conceitos técnicos** | **o Curador** | declaração direta (não há origem) | não |
| **Filtro eliminatório, incluindo área** | **o Curador** | declaração direta, **item a item** | **nunca** (§5.5 da Arquitetura; ADR-B §4.4) |
| **Juízo técnico e relacional** | **o Curador** | declaração direta | **nunca** — não existe proposta de julgamento (ADR-B §15) |
| **Seleção dos três** | **o Curador** | decisão | não |
| **Autoria do Relatório** | **o Curador** | autoria | não |
| **Prática declarada (Q1–Q28)** | **o profissional** | declaração direta | não por ele |
| **Verificação de evidência** | **operação** (papel previsto) | ato humano assinado sobre versão (I-6) | não — é governança, não confirmação |
| **Resolução de divergência** | **o Curador** | ato próprio | não |
| **Estado no Mapa do Profissional** | **operação** — `administrador` no recorte vigente | **confirmação de proposta** ou declaração direta | **sim** |
| **Dados administrativos** (conta, publicação, papéis) | **o Administrador** | declaração direta | não |
| **Regra de derivação** | **Autoridade de Método** | aprovação por ADR | não |
| **Catálogo, escala, célula, conceito** | **o Fundador**, por ADR | migration | não |

**Leitura da tabela:** de dezenove categorias, **exatamente duas** são confirmáveis. Todo o
resto é declaração direta. Isso é intencional: **a confirmação é a exceção do sistema, não
a regra** — coerente com a reclassificação do bloco como mecanismo excepcional (Arquitetura
§5.4.0).

---

# PARTE IV — Propriedades da autoridade

## 12. A autoridade pode ser delegada?

**Não.**

| Aspecto | Regra |
|---|---|
| **Delegar** — autorizar terceiro a agir em nome de quem tem autoridade | **proibido**, sem exceção |
| **Substituir** — outra pessoa **com a mesma autoridade** agir **em nome próprio** | **permitido**, e é o mecanismo correto |
| **"Confirmado por X a pedido de Y"** | **não existe** no domínio |
| **Conta compartilhada** | inviabiliza a autoria; é violação, não delegação |

**Justificativa:** a autoria é o único mecanismo de responsabilização do Método (ADR-035).
Delegação cria uma cadeia em que ninguém respondeu — cada elo aponta para o anterior. A
substituição preserva a responsabilização: **o substituto responde pelo que ele fez**, e a
troca fica visível na cadeia de versões.

**Aplicação prática:** quando um Curador assume o Case de outro, ele **não herda** as
confirmações nem os juízos do anterior. As declarações feitas permanecem válidas, com a
autoria de quem as fez. O que ele quiser mudar, muda **declarando de novo, em nome
próprio**.

## 13. A autoridade pode ser compartilhada?

**Sobre o mesmo fato, não. Sobre fatos diferentes do mesmo objeto, sim — e é o desejável.**

### 13.1 A regra

| Situação | Permitido? |
|---|---|
| Duas pessoas com autoridade sobre **o mesmo fato** | **Não** — P-07: uma origem por fato. Duas autoridades sobre o mesmo campo produzem dois valores legítimos e contraditórios, sem critério de desempate |
| Duas pessoas com autoridade sobre **fatos diferentes** do mesmo profissional | **Sim** — a operação confirma o estado; o Curador julga o mérito. São fatos distintos |
| Duas pessoas com **a mesma autoridade**, agindo em momentos diferentes | **Sim** — é substituição (§12) |
| **Coautoria** de um mesmo ato | **Não existe.** Todo ato tem exatamente um autor |

### 13.2 A regra nova de incompatibilidade

Esta é a contribuição própria desta ADR ao domínio:

> **Quem confirma o estado de um profissional no Mapa não pode ser quem julga e seleciona
> nesse mesmo Case.**

**Justificativa.** A ADR-060 registra a exigência do Método: *"quem avalia não atesta"*. Na
1.0, a digitação do Mapa do Profissional era transcrição sem proveniência — ruim, porém
inerte. Na 2.0 ela vira **confirmação com proveniência que alimenta o Motor**, e a leitura
que o Curador vai julgar passa a depender dela. Se a mesma pessoa confirma o estado e
depois julga e seleciona sobre a leitura que aquele estado produziu, ela **atesta a própria
avaliação** — e o registro dirá "confirmado" e "julgado" como se fossem controles
independentes, quando são o mesmo juízo aplicado duas vezes.

**Escopo exato da incompatibilidade:**

| Incompatível | Compatível |
|---|---|
| confirmar estado do profissional **P** no Case **C** × julgar/selecionar **P** no Case **C** | confirmar estado de **P** e julgar **P** em **Cases diferentes** |
| | confirmar estado de **P** e julgar **outro profissional** no mesmo Case |
| | verificar evidência de **P** e julgar **P** — são governança e juízo, e I-5 já os separa |

**Estado atual: a regra NÃO é exequível.** A ADR-060 declara que uma única conta acumula
Administrador e Curador Médico, e que a segunda conta depende da janela de rotação de
credenciais e da superfície de Equipe.

**Regime de transição, declarado e obrigatório:**

| # | Enquanto a segunda conta não existir |
|---|---|
| 1 | A regra **vale como norma** e é registrada aqui |
| 2 | A violação é **inevitável** e, por isso, **aceita e datada** — como a ADR-060 já aceitou o risco correlato |
| 3 | **A exceção é visível**: quando confirmador e julgador são a mesma pessoa, a Ficha de Explicação **declara isso**, com essas palavras. Não como alerta de erro, mas como fato da cadeia de proveniência |
| 4 | A exceção **caduca** quando a segunda conta da ADR-060 entrar em operação |
| 5 | **Nenhuma superfície pode esconder a coincidência** para "não poluir a tela" |

**Por que declarar uma regra que não se pode cumprir:** porque a alternativa é não
declará-la, e então a coincidência de papéis fica invisível — e o dia em que a segunda conta
existir, ninguém lembrará que ela era necessária por esta razão. **Declarar a exceção é o
que impede que ela vire o normal.**

## 14. A autoridade pode ser retirada?

**Sim, prospectivamente. Nunca retroativamente.**

### 14.1 A regra geral

| Aspecto | Regra |
|---|---|
| **Retirar** | sim — por decisão do Fundador ou de quem ele designar; a pessoa deixa de poder declarar e confirmar dali em diante |
| **Efeito sobre atos já praticados** | **nenhum.** Permanecem válidos, com a autoria de quem os praticou |
| **Efeito retroativo** | **proibido.** Invalidar atos passados por perda de autoridade presente reescreveria o histórico (I-7) e destruiria a auditabilidade |
| **Ato praticado por quem nunca teve autoridade** | não é retirada: o ato **nunca existiu** (§1 elemento 1). É incidente, e se apura como tal |
| **Registro** | a retirada é datada; a partir dela, atos daquela pessoa são recusados |

### 14.2 O que esta ADR decide sobre a RLS congelada (ADR-040 item 6)

**A pendência DP-9 supunha que a 2.0 exigiria ampliar quem escreve o Mapa do Profissional.
Esta ADR conclui que não exige, e recomenda não ampliar.**

| Pergunta | Resposta |
|---|---|
| A confirmação é uma escrita nova, que precisa de recorte próprio? | **Não.** É escrita no mesmo campo, sobre o mesmo objeto, com a mesma consequência. O que mudou foi **como se chega ao valor**, não **que valor é** |
| O gargalo G4/RI4 exige mais gente escrevendo? | **Não.** G4 é problema de **carga**, e a 2.0 já o ataca pelo outro lado: 28 digitações viram 28 confirmações informadas. Ampliar o recorte trataria o sintoma |
| Ampliar traria ganho de segregação? | **Não — traria o oposto.** O ganho de segregação vem do §13.2, que **restringe** quem pode confirmar em função de quem julga. Ampliar o conjunto tornaria mais provável a coincidência que o §13.2 proíbe |

**Decisão:** **o recorte da ADR-040 item 6 permanece intacto.** Escrita: `administrador`.
Leitura: `administrador` e `curador_medico`. **Nenhum item congelado é reaberto por esta
ADR.**

**O que esta ADR acrescenta ao item 6** — sem alterá-lo:

| # | Acréscimo |
|---|---|
| 1 | A **incompatibilidade** do §13.2 — restringe, não amplia |
| 2 | A exigência de que o ato de confirmar registre **autor, data e o que estava visível** |
| 3 | A regra de que **o profissional continua não escrevendo** o próprio Mapa (I-12) |

**Registro de honestidade:** se, na operação real, o recorte de um único papel se mostrar
inviável, a ampliação exigirá o rito completo do §6 do Congelamento — necessidade observada
em Case concreto, demonstração de dano, análise de impacto, ADR nova e guarda de teste.
**Antecipar essa reabertura sem operação real seria exatamente o que o §6 proíbe**, e esta
ADR não a antecipa.

## 15. Quando a autoridade discorda da proposta

Remissão integral à **ADR-A §7**, com três reafirmações que pertencem a esta ADR:

| # | Reafirmação |
|---|---|
| 1 | **Discordar custa o mesmo que concordar** — mesmo número de atos, mesma proeminência (P-10) |
| 2 | **O motivo é oferecido, nunca exigido** — e a ausência de motivo é ela própria um dado |
| 3 | **Discordar não obriga a declarar em seguida** — o conceito volta a lacuna, e lacuna é estado legítimo |

**O que esta ADR acrescenta:** discordar **não é exercício excepcional de autoridade**. É o
exercício **normal** dela. Uma autoridade que só pode concordar não é autoridade — é
formalidade. Por isso o painel de discordância nasce com a primeira regra, e por isso
**discordância zero sustentada é alarme** (Arquitetura §5.4 condição 8).

## 16. O que acontece quando confirma

Remissão ao §9, com a decomposição do ato:

```
ATO DE CONFIRMAR (indivisível)
  ├─ 1. registra o ato humano  ── autor · data · proposta · o que estava visível
  ├─ 2. cria a DECLARAÇÃO no Mapa ── valor · autoria de quem confirmou
  └─ 3. marca o desfecho na proposta ── CONFIRMADA · ponteiro para a declaração
        (a proposta em si não muda — ADR-A §5)
```

**Três coisas que o ato explicitamente não faz:** não promove a proposta a declaração · não
divide autoria com a regra · não torna o valor "mais verdadeiro" do que uma declaração
direta seria. **Uma importância confirmada e uma importância declarada diretamente têm
exatamente o mesmo estatuto** — o que difere é só a proveniência.

## 17. Existe confirmação parcial?

**Não. A confirmação é atômica por item.**

| Situação | Resposta |
|---|---|
| Confirmar "em parte" um valor | **impossível** — os valores são de escala fechada; não há meio-valor |
| Confirmar com ressalva textual | **não existe.** Ressalva é discordância: quem tem ressalva **recusa** e declara o que entende |
| Confirmar vários itens em um gesto | **é o regime de bloco** — reclassificado como excepcional e **proibido de existir** enquanto DP-5 estiver aberta (Arquitetura §5.4.0). Não é "confirmação parcial": é confirmação plena de vários itens, e o problema dela é de leitura, não de parcialidade |
| Confirmar agora e completar depois | **não existe estado intermediário.** Ou o ato aconteceu, ou o conceito está em lacuna |

**Justificativa:** confirmação parcial produziria um valor que ninguém adotou inteiramente
— e a pergunta "quem respondeu por isto?" passaria a ter resposta parcial, que é o mesmo
que não ter resposta.

## 18. Existe confirmação automática?

**Não. Em nenhuma circunstância, sob nenhum nome, em nenhuma versão.**

### 18.1 As nove formas proibidas

| # | Forma | Por que é confirmação automática disfarçada |
|---|---|---|
| 1 | **Por decurso de prazo** | "não respondeu em 7 dias ⇒ aceito" |
| 2 | **Por silêncio ou inação** | ausência de ação nunca é ato |
| 3 | **Por navegação, rolagem ou fim de sessão** | interação não é decisão |
| 4 | **Por padrão pré-marcado** | a caixa já marcada confirma por quem não olhou |
| 5 | **Por herança** — confirmar em um Case propaga para outro | I-4: dois Cases podem concluir o oposto |
| 6 | **Por perfil de comportamento** — "este Curador sempre aceita" | seria o sistema decidindo por estatística sobre uma pessoa |
| 7 | **Por confiança na regra** — "esta regra nunca foi recusada" | é o argumento que transforma discordância zero em automação |
| 8 | **Por ação de terceiro** | delegação, proibida no §12 |
| 9 | **Por "confirmação implícita" na emissão do Relatório** | emitir não confirma nada; são atos distintos |

### 18.2 As duas regras que fecham a porta

| # | Regra |
|---|---|
| 1 | **Proposta só é oferecida sobre alvo sem declaração vigente.** Não existe proposta que "sobrescreve" valor existente — o que evita a construção "atualização automática do Mapa" |
| 2 | **Nenhum caminho de código pode produzir declaração a partir de proposta sem passar pelo registro de um ato humano.** É o critério de aceite **AC-PIPELINE** (Arquitetura §17.4), e é a única defesa estrutural desta proibição |

> **Assinatura humana sem leitura demonstrável não transforma automação em decisão humana**
> (Arquitetura §2.4). O inverso também vale: **ausência de assinatura nunca vira decisão, por
> mais razoável que pareça o valor proposto.**

---

# PARTE V — Participação nas demais camadas

## 19. Confirmação e supersessão

| Direção | Regra |
|---|---|
| **A proposta é superada antes do ato** | não há o que confirmar; nova proposta exige **novo ato** |
| **A origem é retratada depois do ato** | a confirmação **e** a declaração que ela criou tornam-se **superadas** (ADR-A §9, Arquitetura §10.6). O conceito volta a **lacuna** |
| **A regra é revogada depois do ato** | a confirmação **permanece válida** — foi ato humano legítimo, informado pelo que se sabia então. Fica marcada como oriunda de regra revogada |
| **Nova versão da regra gera proposta nova** | só se o alvo estiver sem declaração vigente (§18.2). Confirmação existente **não** é recalculada |
| **Confirmação nunca é revertida** | corrigir é **declarar de novo**, em nome próprio, com data própria (ADR-B §10) |

**A regra que amarra as três ADRs:**

> **Nenhuma confirmação permanece vigente apontando para origem retratada.**

**A assimetria entre origem e regra é deliberada:** origem retratada **supersede** (o fato
mudou; a adoção perdeu objeto); regra revogada **não supersede** (o fato não mudou; quem
adotou continua respondendo). Fundi-las apagaria a diferença entre "a pessoa mudou de ideia"
e "o Método mudou de opinião sobre como traduzir" — e só a primeira invalida o que foi
declarado.

## 20. Confirmação e rastreabilidade

A confirmação é **o elo humano** da cadeia de proveniência (Arquitetura §11.4):

```
frase no Relatório dela
  └─ resultado de célula
       ├─ importância ── CONFIRMAÇÃO (autor, data, o que estava visível)
       │                   └─ proposta (regra vN) ── declaração dela (versão, data)
       └─ estado ─────── CONFIRMAÇÃO (autor, data, o que estava visível)
                           └─ proposta (regra vN) ── evidência (versão, fonte, verificador, data)
```

**Cinco itens obrigatórios do registro de confirmação:**

| # | Item | Por quê |
|---|---|---|
| 1 | **Autor** | quem responde |
| 2 | **Data** | quando |
| 3 | **Proposta referenciada** | o que foi adotado |
| 4 | **O que estava visível** | o que o §1 elemento 4 exige, e o que distingue adoção informada de carimbo |
| 5 | **Origem da declaração resultante** — confirmada ou direta | §8, regra de não-ambiguidade |

**Sem os cinco, o ato não existe** — não é registrado como incompleto; simplesmente não
acontece.

## 21. Confirmação e explicabilidade

| Pergunta da Ficha (Arquitetura §11.2) | O que a confirmação fornece |
|---|---|
| 1 · Por que foi escolhida? | a declaração adotada, com quem a adotou |
| 3 · Quais critérios influenciaram? | a proveniência de cada importância e de cada estado |
| 5 · Quais lacunas existem? | **proposta recusada sem declaração posterior é lacuna nomeada**, não valor ausente por descuido |
| 6 · Grau de confiança | confirmação sobre evidência não verificada aparece como **lacuna de governança** — nunca como compatibilidade menor (I-5) |

**Quatro regras fechadas:**

| # | Regra |
|---|---|
| 1 | **A Ficha nomeia o confirmador**, sempre — inclusive quando é a mesma pessoa que julga (§13.2 item 3) |
| 2 | **Diferencia declaração direta de confirmação** — as duas frases não são iguais |
| 3 | **Recusa aparece como recusa**, não como ausência |
| 4 | **Nenhuma frase atribui à regra o valor confirmado** — a regra sugeriu; a pessoa declarou |

## 22. Confirmação e Relatório

| Aspecto | Regra |
|---|---|
| **A paciente vê o confirmador?** | **Não nominalmente**, e não por opacidade: o Relatório traz **uma** assinatura — a de quem o assume (H13) —, e listar cada confirmador transformaria o documento mais pessoal do produto em registro de processo |
| **A paciente vê a proveniência?** | **Sim, no Perfil** (tela de duas colunas), onde é dela por direito: *"tratado como ESSENCIAL — confirmado por [Curador], 12/03"* |
| **Confirmação altera frase do Relatório?** | **Não.** As frases derivam da leitura sobre Mapas confirmados; a confirmação é **condição** delas, não conteúdo |
| **Recusa altera?** | **Sim, indiretamente** — o conceito fica em lacuna, e o Relatório escreve a frase de lacuna, que é diferente da de ausência declarada |
| **Confirmação destrava emissão?** | **Não.** As guardas de emissão são as da ADR-064 (juízo relacional pendente, abertura em rascunho); confirmação não é gate de emissão |

---

# PARTE VI — Efeitos do ato de confirmar

## 23-IMPORTANTE. A confirmação altera o quê?

Respondido item a item, com justificativa. **As cinco respostas seguem o mesmo princípio:
confirmar acrescenta; nunca modifica.**

### A confirmação altera **a proposta**?

**Não.** A proposta é imutável (ADR-A §5, §12). O desfecho `CONFIRMADA` é **fato separado
que a referencia**, e o ponteiro para a declaração resultante é parte desse fato, não da
proposta.

*Justificativa:* a proposta é o registro do que foi **oferecido**. Alterá-la reescreveria o
que o confirmador viu, destruindo a única autoridade que ela tem — a probatória. Se a
proposta mudasse ao ser confirmada, seria impossível provar depois que o valor adotado é o
valor que foi mostrado.

### A confirmação altera **a declaração**?

**Não altera: cria.** Não existia declaração vigente para aquele alvo (§18.2 regra 1); a
confirmação **produz** uma, nova, autorada por quem confirmou.

*Justificativa:* se a confirmação alterasse uma declaração existente, haveria dois valores
legítimos sobre o mesmo fato em momentos diferentes sem supersessão explícita. Criar
sempre — e superseder quando for o caso — mantém uma única declaração vigente por alvo, com
cadeia visível.

### A confirmação altera **o histórico**?

**Não. Acrescenta ao histórico.** Regime append-only em todas as estruturas envolvidas
(I-7).

*Justificativa:* o histórico é o que permite reconstruir a decisão meses depois sem que
ninguém precise lembrar de nada. Um histórico que muda quando algo novo acontece não é
histórico — é estado atual com aparência de registro.

### A confirmação altera **o juízo**?

**Não. São atos independentes, sobre objetos diferentes.**

| | Confirmação | Juízo |
|---|---|---|
| Objeto | valor de escala fechada | conceito irredutível |
| Origem | adota formulação de outro | formula |
| Registro | ato + declaração | julgamento versionado |

*Justificativa:* confirmar o estado de um profissional não antecipa, sugere nem restringe o
juízo sobre a formação dele. **Não existe proposta de julgamento** (ADR-B §15), e nenhuma
confirmação pode produzir, alterar ou dispensar um juízo. A única relação é indireta:
confirmação superada pode superseder o juízo que se apoiava nela (ADR-B §12, JS2/JS3).

### A confirmação altera **a proveniência**?

**Não altera: estende.** A cadeia ganha um elo — o elo humano —, e nenhum elo anterior é
tocado.

*Justificativa:* proveniência é sequência de fatos imutáveis. Se um ato posterior pudesse
alterar a proveniência de um anterior, a cadeia deixaria de ser evidência e passaria a ser
narrativa. **A proveniência só cresce.**

---

# PARTE VII — Fronteiras

## 24. O que pertence ao domínio

| # | Pertence ao domínio (esta ADR decide) |
|---|---|
| 1 | As definições de confirmar (§1) e declarar (§2) |
| 2 | A distinção formal entre os cinco verbos (§3) |
| 3 | **Que confirmar é adotar** — a autoria transfere-se integralmente |
| 4 | **Que só confirma quem poderia ter declarado** |
| 5 | Quem pode e quem nunca pode confirmar (§4, §5) |
| 6 | Que proposta existe sem confirmação, e que confirmação não existe sem proposta (§6, §7) |
| 7 | A tabela de autoridade originária por categoria (§11) |
| 8 | Que autoridade **não se delega** e **não se compartilha sobre o mesmo fato** (§12, §13) |
| 9 | **A incompatibilidade confirmador × julgador** e seu regime de transição visível (§13.2) |
| 10 | Que autoridade se retira prospectivamente, nunca retroativamente (§14.1) |
| 11 | **Que a RLS da ADR-040 item 6 não é reaberta** (§14.2) |
| 12 | Que **não existe confirmação parcial** (§17) |
| 13 | Que **não existe confirmação automática**, nas nove formas (§18) |
| 14 | A assimetria entre origem retratada e regra revogada (§19) |
| 15 | Os cinco itens obrigatórios do registro (§20) |
| 16 | As cinco respostas do §23 |

## 25. O que pertence apenas à implementação

| # | Pertence ao F-02 e aos pacotes de superfície |
|---|---|
| 1 | Nomes de tabelas, colunas, tipos e enums |
| 2 | Se o ato de confirmar é registro próprio ou parte de outro — **desde que os três efeitos do §16 sejam atômicos** |
| 3 | Como "o que estava visível" é capturado e armazenado |
| 4 | Policies de RLS concretas — **dentro do recorte do §14.2, que esta ADR não altera** |
| 5 | Como a incompatibilidade do §13.2 é detectada e sinalizada |
| 6 | Ergonomia da Fronteira Humana — **exceto os nove elementos e a equivalência de esforço** |
| 7 | Como a Ficha exibe a coincidência confirmador/julgador (§13.2 item 3) |
| 8 | Índices, particionamento, arquivamento |
| 9 | Testes e guardas |

**Regra de arbitragem** (a mesma das ADR-A §20 e ADR-B §27): *"mudar isto muda o que o
Método afirma, ou apenas como o afirma?"*

## 26. O que permanece para o Fundador

| # | Exclusivo do Fundador |
|---|---|
| 1 | **Criar a segunda conta da ADR-060** — sem ela, a regra do §13.2 não é exequível |
| 2 | **Nomear a Autoridade de Método** (DP-4) |
| 3 | **Aprovar ou recusar a reabertura de I-10** (ADR-A §18.5) |
| 4 | **Decidir a régua de graduação por consequência** (DP-5) |
| 5 | **Qualquer ampliação futura do recorte da ADR-040 item 6** — pelo rito do §6 do Congelamento |
| 6 | **Retirar autoridade** de qualquer papel (§14.1) |
| 7 | **Designar o segundo detentor de credenciais** (ADR-060) |

## 27. O que permanece para futuras ADRs

| # | Matéria | Quando |
|---|---|---|
| 1 | **Ampliação do recorte de escrita do Mapa do Profissional** | só com necessidade observada em Case real |
| 2 | **Papel próprio de governança da informação**, distinto de `administrador` | se a operação real mostrar que o acúmulo inviabiliza o §13.2 |
| 3 | **Autoridade sobre Cases com múltiplos Curadores** simultâneos | hoje inexistente; se a operação criar o cenário |
| 4 | **Regime de confirmação em bloco** | somente após DP-5, e por ADR própria |
| 5 | **Autoridade sobre correção de dados legados** sem proveniência (R-05) | quando houver decisão sobre o passivo |

---

# PARTE VIII — Verificações

## 28. Impedimentos do F-02 — o que esta ADR remove

| Impedimento | Antes | Depois | Justificativa |
|---|---|---|---|
| **I-1** · ADRs inexistentes | resolvido por A e B | **permanece resolvido** | esta ADR completa a autoridade, que era a lacuna apontada em I-3, não em I-1 |
| **I-2** · §15.0 proíbe começar por aqui | aberto | **ABERTO** | é sequenciamento. Esta ADR fecha mais uma das dez dependências (**autoridade da regra e da confirmação**, agora completas). Restam as da Onda 1 |
| **I-3** · Entrada da Onda 2 não satisfeita | 2 dos 4 removidos | **3 dos 4 removidos** | **ADRs A, B e D existem.** Restam: **Onda 1 não iniciada** · **Autoridade de Método vaga (DP-4)** · **DP-1 aberta** |
| **I-4** · Colisão com a guarda C-01 | aberto | **ABERTO — e deve continuar** | C-01 exige a ADR-A **e as dez dependências**. Esta ADR não pede, não autoriza e não antecipa sua suspensão |

**Conclusão sobre o F-02:** **permanece bloqueado, e o bloqueio agora é inteiramente de
sequenciamento e de nomeação.** Com as três ADRs, **nenhuma decisão de domínio falta**. O
que falta é: executar a Onda 1, responder DP-1, e o Fundador nomear a Autoridade (DP-4).

## 29. Critérios de aceite

| # | Critério | Situação | Evidência |
|---|---|---|---|
| 1 | **Toda autoridade claramente definida** | **Atendido** | §4 (seis atores) · §5 (oito proibições) · §11 (dezenove categorias) |
| 2 | **Nenhuma confirmação permanece implícita** | **Atendido** | §18 enumera as nove formas proibidas e as duas regras de fechamento |
| 3 | **Nenhuma responsabilidade ambígua** | **Atendido** | §1 elemento 3 (autoria transfere) · §12 (sem delegação) · §13 (sem coautoria) |
| 4 | **O Implementador constrói sem interpretar domínio** | **Atendido** | §16 (o que o ato grava, atomicamente) · §20 (cinco itens) · §23 (cinco efeitos) · §25 (o que é dele) |
| 5 | **O Guardião verifica constitucionalmente a autoridade** | **Atendido** | cada linha cita fundamento; §14.2 declara explicitamente que **nada congelado é reaberto**; §13.2 declara uma exceção em vigor em vez de escondê-la |

---

# PARTE IX — Relatório final

## Resumo executivo

Esta ADR fecha a autoridade de confirmação com duas teses: **confirmar é adotar** — a
autoria transfere-se integralmente para quem confirma, e a regra não divide responsabilidade
com ninguém — e **só confirma quem poderia ter declarado**.

Contra o esperado, ela **não reabre a RLS congelada** (ADR-040 item 6): o gargalo G4 é de
carga, e a 2.0 já o resolve transformando 28 digitações em 28 confirmações informadas.
Ampliar o recorte trataria o sintoma e **pioraria** a segregação. Em vez disso, a ADR
**restringe**: cria a incompatibilidade entre confirmar o Mapa de um profissional e julgar
ou selecionar esse profissional no mesmo Case — aplicação direta do *"quem avalia não
atesta"* da ADR-060 —, declara que a regra **hoje não é exequível**, e exige que a exceção
seja **visível na Ficha** enquanto durar.

**Com as ADRs A, B e D, nenhuma decisão de domínio falta ao F-02.**

## Definições

Confirmar (§1) · declarar (§2) · os cinco verbos (§3) · autoridade originária por categoria
(§11) · incompatibilidade confirmador × julgador (§13.2) · as nove formas proibidas de
confirmação automática (§18.1).

## Autoridades

| Ator | Confirma | Declara |
|---|---|---|
| **Paciente** | nada | história · P1–P17 · restrições · reconhecimento · decisão |
| **Curador** | importância dos conceitos com lado da pessoa | contexto clínico · 11 importâncias técnicas · filtros e área · juízos · seleção · autoria |
| **Administrador** | estado do profissional (recorte da ADR-040 item 6) | dados administrativos |
| **Concierge** | nada | acompanhamento pós-entrega |
| **Profissional** | nada | a própria prática (Q1–Q28) |
| **Sistema** | nada — **valida** | nada |
| **Motor** | nada — **lê** | nada |

## Responsabilidades

Quem confirma **responde pessoalmente** pelo valor, como se o tivesse formulado (§1). Quem
declara responde igualmente. Quem propõe — a regra — **não responde**, porque não tem
autoridade; quem responde pela regra é a Autoridade de Método, e por outra coisa: pela
qualidade da sugestão, não pelo valor adotado.

## Decisões tomadas

| # | Decisão |
|---|---|
| 1 | **Confirmar é adotar** — a autoria transfere-se integralmente |
| 2 | **Só confirma quem poderia ter declarado** |
| 3 | **Reconhecer ≠ confirmar** — produz habilitação, não valor |
| 4 | **Validar ≠ confirmar** — é do sistema e não cria fato |
| 5 | **"Revisar" não é ato de domínio** nesta versão |
| 6 | **Confirmação sem proposta não existe**; declaração sem confirmação é o caminho majoritário |
| 7 | **Duas de dezenove categorias são confirmáveis** — confirmação é exceção, não regra |
| 8 | **Autoridade não se delega**; substituição em nome próprio é o mecanismo |
| 9 | **Autoridade não se compartilha sobre o mesmo fato** |
| 10 | **Incompatibilidade confirmador × julgador**, com exceção visível e datada |
| 11 | **A RLS congelada não é reaberta** |
| 12 | **Não existe confirmação parcial** |
| 13 | **Não existe confirmação automática** — nove formas nomeadas |
| 14 | **Origem retratada supersede; regra revogada não** |
| 15 | **Confirmar acrescenta; nunca modifica** — as cinco respostas do §23 |
| 16 | **A paciente não vê o confirmador no Relatório, e vê no Perfil** |

## Decisões adiadas

Ampliação do recorte de escrita · papel próprio de governança da informação · autoridade em
Cases com múltiplos Curadores · regime de bloco (DP-5) · autoridade sobre o passivo legado
(R-05). Todas no §27, com o gatilho de cada uma.

## Impacto na Arquitetura

| Seção | Impacto |
|---|---|
| §8.2 (correção de G4/RI4) | **corrigida**: a Arquitetura sugeria que confirmar "pode ser exercido pelo mesmo perfil que verifica evidência", antecipando ampliação. Esta ADR conclui o contrário — **o recorte permanece**, e o ganho vem da restrição do §13.2 |
| §14 (mapa de responsabilidades) | **confirmado**, com a incompatibilidade nova a acrescentar |
| §2.4 (Fronteira Humana) | **confirmado**; os nove elementos são condição de validade do ato |
| §17.4 (AC-PIPELINE) | **reforçado**: passa a ser a defesa estrutural do §18.2 |
| DP-9 | **respondida — com "não ampliar"**. A pendência pode ser fechada |

## Impacto no Modelo

**Nenhum impacto direto.** O Modelo não trata de autoridade de confirmação; a dívida
documental §7.1–§7.4 e §11 é da ADR-B (§30 daquela ADR).

## Impacto na Explicabilidade

A Ficha passa a **nomear o confirmador**, **distinguir declaração direta de confirmação**,
**mostrar recusa como recusa** e **declarar a coincidência confirmador/julgador** enquanto a
exceção do §13.2 durar.

## Impacto no Relatório

Nenhuma frase muda. A confirmação é **condição** das frases, não conteúdo. A paciente vê a
proveniência no **Perfil**, não no Relatório — que traz uma assinatura só, a de quem o
assume.

## Impacto sobre o F-02

**I-3 reduzido de quatro para três pendências.** I-2 e I-4 permanecem. **Nenhuma decisão de
domínio falta.**

## Pacotes desbloqueados

Nenhum pacote de implementação. Desbloqueia-se: o fechamento de **DP-9**, a revisão
constitucional das três ADRs em conjunto, e a preparação da **Onda 1** — cuja execução não
depende de nenhuma das três.

## Pacotes ainda bloqueados

F-02 (I-2, I-4 · Onda 1 · DP-1 · DP-4) · Onda 2 inteira · subescopo 2.5 (DP-5) · Onda 5
(Rede real).

## Riscos

| # | Risco | Sev. |
|---|---|---|
| **RD-1** | **A incompatibilidade do §13.2 permanecer inexequível indefinidamente**, e a exceção virar o normal por familiaridade | **Alta** — mitigada apenas pela visibilidade obrigatória na Ficha |
| **RD-2** | **"Revisar" reaparecer na interface** com efeito de domínio, criando um segundo ato que ninguém sabe se vale | **Alta** |
| **RD-3** | **A recusa da ampliação de recorte ser lida como negligência do gargalo G4**, e alguém ampliar por conveniência sem o rito do §6 | Média |
| **RD-4** | **Alguma das nove formas do §18.1 aparecer como "melhoria de usabilidade"** — a mais provável é a caixa pré-marcada | **Alta** |
| **RD-5** | **Atomicidade dos três efeitos do §16 ser quebrada** na implementação, produzindo declaração sem ato ou ato sem declaração | **Alta** |
| **RD-6** | **Esta ADR ser lida como autorização para implementar** | **Alta, de processo** |

## Pendências

DP-1 · DP-4 · DP-5 · DP-6 · DP-7 · DP-10 · DP-11 · **DP-9: respondida, aguardando
homologação** · segunda conta da ADR-060 · reescrita do Modelo §7.1–§7.4 e §11 (ADR-B §30) ·
emenda da Arquitetura §9.4 (ADR-A) e §8.2 (esta) · lavratura de A, B e D em `DECISIONS.md`
**após** aprovação.

## 30. Conformidade

Nenhuma tabela, migration, constraint, policy, API, interface, tipo, teste ou linha de
código foi criada ou alterada. Nenhum documento canônico foi modificado. **Nenhum item
congelado foi reaberto** — e o único que a missão poderia exigir reabrir (ADR-040 item 6)
foi examinado e **mantido intacto** (§14.2). Nenhuma guarda foi tocada. Nenhum commit foi
feito.

**Esta ADR não autoriza implementação.**

---

*Fim da ADR-D. **Próximo destino obrigatório: Agente 00 — Guardião, para revisão
constitucional**, com atenção a dois pontos: o §14.2, que **recusa** reabrir a RLS congelada
e portanto responde DP-9 com "não ampliar"; e o §13.2, que declara uma regra de
incompatibilidade **hoje inexequível**, com exceção aceita, datada e obrigatoriamente
visível. Nenhuma implementação, nenhuma migration, nenhum código antes dessa revisão.*
