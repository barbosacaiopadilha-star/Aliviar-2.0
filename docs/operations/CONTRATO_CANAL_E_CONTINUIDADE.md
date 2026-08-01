# Contrato Operacional de Canal e Continuidade — Fase 10E

> **Resolve** as pendências **P1–P4** da [ADR-044](../DECISIONS.md) — canal interno, horário, prazos e escalonamento — no que é decidível a partir do que existe, e **põe como pergunta o que só a operação pode responder**.
> **Não faz:** implementar · migration · alterar RLS · reabrir jurídico validado · inventar SLA · protocolo clínico · publicar.
> **Data:** 2026-08-01

---

# 0 · Duas premissas da missão que a investigação não confirmou

*Registradas antes de tudo, porque mudam o que este documento pode entregar.*

## 0.1 · Os instrumentos jurídicos não estão no repositório

A missão estabelece que *"os instrumentos jurídicos da Aliviar já estão aprovados e são fonte de verdade"* e pede, na §7, que se identifique **o que já está autorizado**.

**Busca feita:** `docs/` por termo, jurídico, legal, privacidade, LGPD, consentimento, contrato · `src/app` por rota de termos ou política · `src/components` por superfície de aceite. **Nenhum resultado.** Não há instrumento jurídico versionado neste repositório, nem tela de aceite, nem registro de consentimento no domínio.

**O que isso significa, com precisão:** não é afirmação de que os instrumentos não existam — provavelmente existem fora do repositório, aprovados e assinados. Significa que **eu não consigo lê-los**, e portanto **não posso dizer o que eles autorizam**. A regra da missão — *registrar bloqueio jurídico só se houver contradição explícita* — pressupõe poder verificar a contradição, e essa verificação não é possível aqui.

**Consequência para a §7:** ela é entregue como **inventário do que a aproximação intermediada exigiria**, com a pergunta endereçada, e **não** como declaração do que já está autorizado. Inventar autorização seria pior do que registrar a lacuna.

## 0.2 · Canal, horário e capacidade não são deriváveis do código

As §§2–4 pedem que se **decida** canal, horário e compromissos temporais. Essas não são propriedades do software: são fatos sobre pessoas — quem trabalha quando, quem olha o quê, quem cobre quem.

O que este documento faz, então: **decide o que é consequência do que já existe** (§2, e é mais do que parece), **registra a ausência onde ela é o fato** (§3), e **transforma o restante numa folha de decisão com perguntas fechadas** (§9.3), em vez de devolver "pendente de operação" como já se fez três vezes nas fases anteriores.

---

# 1 · Inventário real

*Constatações verificadas. Nenhum canal, horário ou capacidade inventado.*

| # | Item | Estado |
|---|---|---|
| F1 | **`team_notifications`** — notificação interna **persistida na plataforma**, visível pela seção de continuidade do painel do Concierge, com `read_at`/`read_by` e `archived_at` | **IMPLEMENTADO** (Incremento 2) |
| F2 | **Caixa de continuidade** — projeção derivada de fatos, com seis sinais de trabalho pendente, na área do Concierge | **IMPLEMENTADO** |
| F3 | **WhatsApp oficial** — número aprovado pelo responsável do projeto (MISSÃO 205), fonte única em `whatsapp-contact.tsx`, com tópicos contextualizados | **IMPLEMENTADO** |
| F4 | Superfícies onde o WhatsApp aparece: `portal-paciente` (3 páginas) e `sem-curadoria` | **IMPLEMENTADO** |
| F5 | Regra escrita no próprio componente: **nunca prometer resposta imediata**, nunca virar navegação principal, nunca aparecer como chat aberto | **VIGENTE** |
| F6 | **`patient_notifications`** — canal da Aliviar **para a paciente**, com `insert` restrito a `administrador` | **IMPLEMENTADO, paciente-facing** |
| F7 | **Serviço de envio externo** — e-mail, push, SMS | **INEXISTENTE.** Nenhuma dependência de envio em `package.json` nem em `src/` |
| F8 | **Telefone de voz** | **INEXISTENTE** — nenhuma referência em código ou configuração |
| F9 | **Horário de operação formalizado** | **INEXISTENTE** — nenhuma ocorrência em `src/` ou `docs/`; as duas menções existentes são documentos afirmando que ele **não existe** |
| F10 | **Monitoramento de canal** — quem observa o WhatsApp, com que cobertura | **NÃO VERIFICÁVEL** no repositório |
| F11 | **Ausência, férias, substituição** | **INEXISTENTE** no domínio (62 migrations, nenhuma noção) |
| F12 | **Escalonamento** | **INEXISTENTE** — nenhuma regra, gatilho ou alerta |
| F13 | **Responsável do Case** — `cases.responsible_id/_role`, com transferência auditada | **IMPLEMENTADO** |
| F14 | **Instrumentos jurídicos** | **AUSENTES DO REPOSITÓRIO** (§0.1) |

**Leitura do inventário: a Aliviar tem um canal interno e um canal de entrada da paciente. Não tem nenhum canal de saída ativo — nem para a equipe, nem para o profissional.**

---

# 2 · O canal interno da equipe — DECIDIDO

> ### D-1 · `team_notifications` na plataforma **é** o canal interno canônico.
>
> Não é escolha entre alternativas: é o reconhecimento de um fato. Ele existe, está implementado, é persistido, tem leitura registrada e já aparece na área de quem responde. **Um canal que já funciona não precisa ser escolhido — precisa ser declarado.**

**Canal secundário: nenhum, por ora.** Adicionar um segundo canal antes de saber se o primeiro é olhado seria resolver o problema errado. **Revisitar quando** a operação relatar que a caixa não está sendo vista — o que exige, primeiro, medir (§5).

**Quem recebe a atenção operacional:** o **responsável atual pelo Case**, calculado por `can_access_case`. Não há destinatário por papel, e a notificação acompanha a reatribuição sem nenhuma escrita (decisão P6).

**Como alguém encontra o que é novo:** entrando na área do Concierge. **É pull, não push** — e isto precisa ser dito com todas as letras, porque é a limitação central deste contrato: **se ninguém entra, ninguém vê.** A caixa mostra o que está pendente; ela não avisa ninguém.

**Os três estados, distintos:**

| Estado | Significado | Existe? |
|---|---|---|
| **persistida** | o registro existe e está na caixa de quem responde | ✅ |
| **vista** | alguém abriu a área e a notificação estava lá | ⛔ **não é registrado** — e não deve ser inferido de acesso à página |
| **lida** | alguém marcou explicitamente que viu | ✅ `read_at` + `read_by` |

**Despacho externo: não existe, e este contrato não o cria** (F7). O que permanece sem despacho externo: **tudo**. Nenhuma notificação sai da plataforma hoje.

---

# 3 · Horário operacional — A AUSÊNCIA É O FATO

> ### D-2 · Não existe horário operacional formalizado, e este documento não inventa um.
>
> A missão autoriza expressamente registrar isso em vez de inventar promessa. **É o que se faz.**

**Consequências imediatas, todas verificáveis:**

**Nenhuma frase pode dizer quando a equipe volta.** *"Nossa equipe retorna às 9h"* é proibida — não porque soe mal, mas porque não há nada que a torne verdadeira.

**"Fora do horário" não é um estado do sistema.** Sem horário definido, não existe dentro nem fora, e nenhuma superfície pode se comportar diferente por hora do dia.

**A linguagem é a mesma sempre.** O que se pode dizer à paciente às 3h da manhã é exatamente o que se pode dizer às 15h: **o que está registrado, e quem responde pelo caso dela.**

**Plantão: inexistente** (F11, F12). **Feriados e fuso: sem sentido enquanto não houver horário.**

> **Isto não é um vazio confortável.** Sem horário, nenhum prazo é assumível (§4), e a detecção de inércia fica sem unidade de medida (§5). **É a decisão que mais destrava as outras, e é a única que este documento não pode tomar sozinho.**

---

# 4 · Compromissos temporais — NENHUM ASSUMÍVEL HOJE

**Regra da missão, aplicada sem exceção:** *prazo sem responsável, medição e contingência é proibido.*

| Compromisso | Responsável | Medição | Contingência | Assumível? |
|---|---|---|---|---|
| **visualizar** | responsável atual | ⛔ "vista" não é registrada (§2) | ⛔ | **não** |
| **assumir** | quem transfere | ✅ transferência é auditada | ⛔ sem escalonamento | **não** |
| **agir** | responsável atual | ✅ eventos da tentativa têm carimbo | ⛔ | **não** |
| **atualizar a paciente** | responsável atual | ⛔ não há canal de saída ativo | ⛔ | **não** |
| **escalonar** | ⛔ **ninguém definido** | ⛔ | ⛔ | **não** |

**Dois dos cinco já têm medição** — assumir e agir. Falta-lhes **contingência**: um prazo cujo descumprimento não aciona ninguém não é compromisso, é expectativa.

> ### D-3 · Nenhum prazo é assumido. A linguagem da continuidade continua nomeando **quem**, nunca **quando**.
> **O que destrava cada um está em §9.3** — e são três decisões, não cinco.

---

# 5 · Detecção de inércia — ESTRUTURA DECIDIDA, PONTEIRO PENDENTE

## 5.1 · Fatos que podem iniciar medição

**Todos são atos nossos, com carimbo temporal já persistido.** Nenhum é comportamento da paciente.

| Marco inicial | Já registrado? | O que a ausência de avanço significa |
|---|---|---|
| decisão registrada sem transferência | ✅ | o Case decidido continua com o Curador; ninguém assumiu a continuidade |
| transferência sem evento posterior | ✅ | alguém assumiu e nada aconteceu |
| notificação persistida sem `read_at` | ✅ | ninguém viu |
| tentativa `CRIADA` sem `dispatched_at` | ✅ | preparamos e não enviamos |
| tentativa `DESPACHADA` sem `responded_at` | ✅ | enviamos e não sabemos o resultado |
| modo intermediado sem tentativa aberta | ✅ | ela pediu que procurássemos, e ninguém está procurando |

> ### D-4 · A estrutura de medição está completa. Falta **uma** variável: o limite temporal.
> Todos os seis marcos já existem no banco com data. **O instrumento está pronto e o ponteiro não foi posto** — e pôr o ponteiro exige saber o horário (§3), porque "dois dias" significa coisas diferentes com e sem expediente.

## 5.2 · O que fica decidido independentemente do limite

**Responsável pelo escalonamento:** ⛔ **não definido** — é a pergunta Q-3 de §9.3.

**Ação de recuperação:** **reatribuir o Case pela função auditada**, com motivo. Não existe "cutucar" — existe passar a responsabilidade a quem vai agir.

**O que a paciente vê:** **nada.** Inércia é falha nossa, e transformá-la em informação para ela seria pedir que ela cobrasse a Aliviar. A única coisa que ela pode ver é o que já foi decidido: o que está registrado e quem responde pelo caso dela.

**O que nunca pode ser inferido, e é a proibição mais importante desta seção:**

> **Comportamento da paciente nunca é medida de inércia operacional.** Não se mede quanto ela demora, quantas vezes volta, se abriu a Mesa, quando leu a carta. **A operação é o objeto da medição; ela nunca é.** Um Case parado porque ela está pensando **não é um Case parado** — é uma pessoa decidindo, e a arquitetura inteira existe para proteger esse tempo.

---

# 6 · Contato direto acompanhado — DECIDIDO no que não exige canal

**Quando o Concierge entra:** na transferência de responsabilidade, que já é o evento de assunção. Antes dela, o Curador responde.

**Quando pergunta sobre o avanço:** **uma vez**, depois de ela ter tido tempo de agir — e **nunca de novo se ela não quiser**. A cadência exata é Q-4 (§9.3); o que fica decidido é o **teto**: uma pergunta, não uma sequência.

**Por qual canal:** o WhatsApp oficial é o único canal humano existente — **mas ele é iniciado por ela** (F3, F5). **Iniciar contato ativo pela Aliviar é capacidade que não existe** e depende de Q-2.

**Como registra indisponibilidade:** pelo mesmo evento da tentativa, com `response_source = RELATO_PACIENTE`. **Já implementado** — o relato dela sobre o profissional é registrável sem nenhuma capacidade nova.

**Como evita vigilância:** perguntando a uma pessoa, nunca observando comportamento. **Nenhum sinal derivado de uso alimenta acompanhamento** (§5.2).

**Quando encerra:** nos terminais que já existem — primeiro atendimento ou "o contato não avançou" —, **sempre por declaração dela, nunca por decurso de tempo**.

**Quando retorna à Curadoria:** quando o motivo tocar o Perfil. Decisão do Curador, não automática.

---

# 7 · Aproximação intermediada — INVENTÁRIO, NÃO AUTORIZAÇÃO

*Entregue nos termos de §0.1: o que o fluxo exigiria, não o que já está autorizado.*

| Requisito | Estado no repositório |
|---|---|
| **o que já está autorizado** | ⛔ **não verificável aqui** — instrumentos ausentes (F14) |
| **dados mínimos transmitidos** | não decidido. **Recomendação registrada e mantida: nunca a formulação do trade-off** |
| **canal permitido** | ⛔ **nenhum canal de saída existe** (F7, F8). É a barreira material, independente do jurídico |
| **responsável operacional** | ✅ o **Concierge responsável** — decidido e implementado |
| **registro necessário** | ✅ **`approach_attempts` completo** — criação, despacho, resposta, desfecho, origem |
| **o que depende de Temporary Access** | acesso do profissional a **contexto na plataforma**. ADR-029 aprovada, **não implementada** |
| **o que pode ocorrer fora da plataforma** | uma conversa humana em que a Aliviar se identifica e pergunta se ele pode receber a paciente, **sem transmitir contexto de Curadoria** — e o registro dessa conversa já cabe em `approach_attempts` |

> **A conclusão operacional é mais simples do que a jurídica:** mesmo que tudo esteja autorizado, **não há canal pelo qual falar com o profissional**. A aproximação intermediada está bloqueada por Q-2 antes de estar bloqueada por qualquer outra coisa.

---

# 8 · Promessas

| Frase | Classificação | Por quê |
|---|---|---|
| *"Sua solicitação foi registrada."* | **AUTORIZADA AGORA** | fato do sistema, verificável |
| *"Seu caso continua sob responsabilidade da Aliviar."* | **AUTORIZADA AGORA** | o Case sempre tem responsável |
| *"Quem responde pelo seu caso é [nome]."* | **AUTORIZADA AGORA** | leitura do responsável atual |
| *"Você pode falar conosco pelo WhatsApp."* | **AUTORIZADA AGORA** | canal existe e é oficial — **sem prometer quando responderemos** (F5) |
| *"Uma pessoa da Aliviar verá sua solicitação."* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** | hoje é **pull**: se ninguém entrar, ninguém vê. Emitível quando houver despacho verificável ou detecção de inércia com escalonamento |
| *"[nome] já viu sua solicitação."* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** | `read_at` existe; falta superfície que o diga a ela |
| *"O profissional foi contatado."* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** | `approach_attempts` registra; **falta o canal para que seja verdade** |
| *"Estamos aguardando retorno."* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** | derivável de `DESPACHADA` sem resposta — **e só depois que o despacho existir** |
| *"Responderemos em até [prazo]."* | **PROIBIDA** | D-3: nenhum prazo é assumível |
| *"Nossa equipe retorna às [hora]."* | **PROIBIDA** | D-2: não há horário formalizado |
| *"Ele recebeu."* | **PROIBIDA** | inverificável fora do nosso alcance |
| *"Está tudo certo."* · *"Sua consulta está reservada."* | **PROIBIDA** | não existe reserva, e nada aqui a cria |
| *"O Curador foi avisado."* | **PROIBIDA** | não há notificação ao Curador; há visibilidade |

**Nenhuma frase antecipa fato ou prazo inexistente.** Autorizadas agora: **4**. Após implementação: **4**. Proibidas: **5**.

---

# 9 · Decisões e bloqueios

## 9.1 · Decidido nesta fase

| # | Decisão |
|---|---|
| **D-1** | `team_notifications` na plataforma é o **canal interno canônico**; sem canal secundário; **pull, não push** |
| **D-2** | **Não existe horário operacional**, e nenhuma frase pode sugerir um |
| **D-3** | **Nenhum prazo é assumido**; a linguagem nomeia **quem**, nunca **quando** |
| **D-4** | A **estrutura de medição de inércia está completa**; falta o limite temporal |
| **D-5** | **Recuperação de inércia é reatribuição auditada**, não cobrança |
| **D-6** | **Comportamento da paciente nunca mede inércia operacional** |
| **D-7** | No contato direto, o Concierge pergunta **uma vez**, e não insiste |
| **D-8** | Indisponibilidade **relatada pela paciente** já é registrável, sem capacidade nova |
| **D-9** | **A paciente não vê inércia** — é falha nossa, não informação dela |

## 9.2 · Capacidades liberadas por estas decisões

**Nenhuma nova promessa à paciente** — e isso é resultado, não falha: o que faltava não era permissão, era capacidade.

**Liberado tecnicamente:** medição de inércia **sem escalonamento** (relatório interno do que está parado, para a operação olhar) · registro de indisponibilidade relatada por ela · a caixa de continuidade continuar sendo a única fonte de trabalho.

## 9.3 · Folha de decisão — quatro perguntas fechadas

*Só a operação responde. Cada uma destrava um conjunto específico.*

**Q-1 · Existe horário de atendimento? Quais dias e faixas, em que fuso?**
*Se não houver: a resposta "não há, e a cobertura é por esforço" também é uma resposta válida e desbloqueia D-3 parcialmente.*
**Destrava:** unidade de medida da inércia · qualquer frase temporal · comportamento fora do horário.

**Q-2 · A Aliviar tem, hoje, um canal pelo qual falar ativamente com um profissional?** *(o WhatsApp oficial serve? outro número? e-mail? quem opera?)*
**Destrava:** aproximação intermediada inteira · *"o profissional foi contatado"*.

**Q-3 · Quem é acionado quando um Case fica parado?** *(uma pessoa nomeada, ou o administrador)*
**Destrava:** escalonamento · *"uma pessoa da Aliviar verá sua solicitação"*.

**Q-4 · Depois de quanto tempo um Case parado deve ser acionado?** *(depende de Q-1)*
**Destrava:** o ponteiro de D-4 · prazo para assumir e para agir.

## 9.4 · Continua bloqueado

Despacho externo (Q-2, F7) · escalonamento (Q-3) · prazos (Q-1, Q-4) · aproximação intermediada (Q-2 + §0.1) · Temporary Access (ADR-029, não implementada) · retenção de notificações (privacidade) · pausa por segurança e urgência (**clínica** — e permanecem o único bloqueio cujo risco é a segurança de uma pessoa).

---

# 10 · Próximo incremento

> ### Incremento 3 — **Relatório de inércia, sem escalonamento e sem canal.**

**Por que este, e não o despacho:** o despacho depende de Q-2; o escalonamento depende de Q-3. **A medição não depende de nenhuma das duas** — os seis marcos já existem com data, e a única coisa que falta para *contar* é escolher um limite provisório e interno.

**Escopo:** uma projeção que liste, para administrador e Concierge, os Cases parados por marco, **usando um limite configurável e explicitamente provisório**; nenhuma notificação disparada; nenhuma frase nova à paciente; nenhum canal.

**Por que é seguro sem Q-1 e Q-4:** o limite não vira promessa nem prazo — vira **um filtro de relatório interno**. Errar o número mostra Cases demais ou de menos numa tela da operação, e não quebra nada com ninguém.

**E é o incremento que produz a informação que falta para responder Q-4:** depois de algumas semanas olhando o que de fato para, a operação decide o limite com evidência, em vez de estimativa.

**Fica de fora:** marcação de entrega ou leitura externa · escalonamento automático · contato externo de qualquer natureza · qualquer alteração na área da paciente.

---

> **A Aliviar tem uma caixa que mostra o que está parado, e ninguém encarregado de olhá-la. O contrato que falta não é de software: é o de que alguém, com nome, olha — e o de que alguém é chamado quando não olhou.**
