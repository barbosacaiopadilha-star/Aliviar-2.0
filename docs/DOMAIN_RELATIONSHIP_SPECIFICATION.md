# Especificação do Domínio: Relationship

**Estado**: Conceitual — especificação formal, consolidando Connection & Relationship — Fases 0 e 1 desta sessão (2026-07-15). A Fase 2 originalmente destinada a fechar "autoridade de divergência" e "definição completa de PAUSADO" foi interrompida antes de concluir — este documento registra esses dois pontos como lacunas explícitas, não como decisões tomadas. Nenhum código, schema, migration ou API foi criado ou alterado para produzir esta especificação. `src/modules/relationship` continua não existindo, nem mesmo como pasta reservada.

**Autoridade**: subordinada a `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` (documento de domínio, que continua sendo a entrada da tabela de domínios em `ARCHITECTURE_BLUEPRINT.md`), a `ARCHITECTURAL_INVARIANTS.md` e, acima de ambos, à Constituição da Aliviar. Este documento **detalha e formaliza** a parte "Relationship" já anunciada em `DOMAIN_CONNECTION_RELATIONSHIP.md` — não a substitui nem cria um oitavo domínio.

**Nota de leitura obrigatória antes de qualquer decisão técnica futura**: as Etapas 9 e 10 (papéis de Curador e Atendente) introduzem conceitos — Reunião de Acolhimento conduzida pelo Curador, "três médicos", papel de Atendente, "contrato" — que **não têm base em nenhum documento ou código já implementado** desta sessão. A Etapa 11 (Auditoria) registra essa tensão explicitamente. Este documento formaliza o que foi pedido, mas não declara essas seções como já reconciliadas com `docs/architecture/DOMAIN_CURATION.md` (Implementado) nem com o catálogo de papéis da ADR-006.

---

## Etapa 1 — Definição oficial

**O que é Relationship?** O domínio responsável por um ciclo de cuidado continuado entre um paciente e um profissional específicos, iniciado pela confirmação real de um primeiro atendimento e mantido, encerrado ou sucedido por eventos explícitos — nunca por inferência, tempo decorrido ou silêncio.

**O que definitivamente NÃO é Relationship**:

- Não é o mecanismo de escolha do profissional nem a confirmação do primeiro contato — isso é **Connection**, já implementado, terminal e imutável no momento em que Relationship começa a existir.
- Não é o motor que gera ou revisa uma Curadoria — isso é **ACE**/**Curadoria**.
- Não é quem decide se um par foi humanamente compatível — isso é **Compatibility Intelligence**, exclusivamente.
- Não é quem observa atrito operacional/UX, inclusive sobre o próprio uso do produto por quem vive um Relationship — isso é **Observatório da Experiência**.
- Não é um sistema de vigilância, pontuação ou telemetria do paciente.
- Não é uma fase interna ou uma extensão de Connection. A hipótese "Relationship é apenas uma fase posterior de Connection" foi testada e refutada com evidência estrutural real (Fase 0, Etapa 12): a Connection terminal é imutável por trigger de banco, testado em produção (Fase 4) — Relationship não pode, e não deve, mutar o que Connection já fechou.

**Qual promessa este domínio entrega?** Garantir que, uma vez que um cuidado real começou, exista um registro fiel, append-only e nunca inferido de como esse cuidado evolui — continuidade, encerramento, eventual reabertura — sem nunca julgar, pontuar ou decidir pelo paciente.

**Onde começa?** No evento `PRIMEIRO_ATENDIMENTO_REALIZADO` — produzido por Connection, consumido como fato de nascimento por Relationship. Não é um evento duplicado; é o mesmo fato real, visto por dois domínios.

**Onde termina?** No evento explícito de encerramento definitivo daquele ciclo específico — nunca por tempo, nunca por presunção, nunca por silêncio.

**Responsabilidade exclusiva**: registrar, como fato bruto — nunca como interpretação — a evolução de um relacionamento de cuidado já iniciado: continuidade, troca de profissional, encerramento, e o sinal que autoriza uma eventual reabertura.

**O que pertence obrigatoriamente a outros domínios**:

- **Connection**: escolha do profissional, correção dessa escolha, confirmação do primeiro contato/atendimento.
- **ACE**: qualquer nova Shortlist; qualquer novo Caso decorrente de reabertura.
- **CI**: toda interpretação de compatibilidade a partir dos fatos que Relationship produz — Relationship nunca gera hipótese, nunca produz CI.
- **Observatório**: toda leitura de atrito operacional/UX.
- **Operação**: canal, cadência prática, SLA, quem conduz contato — deliberadamente deixado fora da teoria do domínio (lacunas operacionais já registradas nas Fases 0/1).

---

## Etapa 2 — Fronteiras (tabela de eventos)

| Evento                           | Domínio responsável                                            | Quem produz                                           | Quem consome                                                                             | Quem nunca deve conhecer                  | Quem nunca deve alterar                                 |
| -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `DECISAO_REGISTRADA`             | Connection                                                     | Paciente                                              | Connection, Curadoria (leitura)                                                          | —                                         | Relationship, CI, Observatório, ACE                     |
| `CORRECAO_ESCOLHA`               | Connection                                                     | Paciente                                              | Connection                                                                               | —                                         | Relationship, CI, Observatório, ACE                     |
| `CONTATO_INICIADO`               | Connection                                                     | Paciente                                              | Connection                                                                               | —                                         | Relationship, CI, Observatório, ACE                     |
| `PRIMEIRO_ATENDIMENTO_REALIZADO` | Connection (produz) / Relationship (nasce a partir dele)       | Paciente                                              | Connection (fecha seu ciclo), Relationship (nasce), CI (fato de origem, L3)              | —                                         | Relationship nunca reescreve este evento — só o consome |
| `ENCERRADO_SEM_RELACIONAMENTO`   | Connection, terminal                                           | Paciente                                              | Connection                                                                               | Relationship (nunca nasce a partir deste) | qualquer domínio                                        |
| Continuidade relatada            | Relationship                                                   | Paciente (hoje); profissional (quando houver canal)   | Relationship, CI (fato bruto)                                                            | —                                         | CI, Observatório, ACE                                   |
| Encerramento de Relationship     | Relationship                                                   | Paciente; profissional (futuro); equipe (excepcional) | Relationship, CI                                                                         | —                                         | CI, Observatório, ACE                                   |
| Troca de profissional            | Relationship (encerra) → Connection (novo ciclo)               | Paciente                                              | Relationship, Connection (novo registro), CI                                             | —                                         | qualquer domínio, sobre o registro antigo               |
| Reabertura                       | Relationship (fecha definitivamente) → Journey/ACE (novo Caso) | Paciente                                              | Journey/ACE, CI (sinal `REABERTA`, já citado por `DOMAIN_COMPATIBILITY_INTELLIGENCE.md`) | —                                         | qualquer domínio, sobre o Relationship antigo           |
| Correção de registro             | Relationship                                                   | Autor do relato original                              | Relationship                                                                             | —                                         | qualquer domínio — sempre evento novo, nunca edição     |

---

## Etapa 3 — Estados oficiais

### ATIVO

- **Definição**: o Relationship existe e não foi encerrado por nenhum evento explícito.
- **Como nasce**: automaticamente, no mesmo instante do nascimento do Relationship (`PRIMEIRO_ATENDIMENTO_REALIZADO`).
- **Como termina**: por evento explícito de encerramento (qualquer categoria válida, Etapa 4).
- **Quem pode criar**: ninguém "cria" ATIVO isoladamente — é o estado resultante do nascimento.
- **Quem nunca cria**: o sistema, por inferência ou silêncio.
- **Quem pode visualizar**: o próprio paciente; o profissional (quando houver canal); curador/admin do Caso associado (leitura, mesmo padrão já usado por Connection); CI (fato agregado).
- **Quem nunca modifica**: CI, Observatório, ACE — nenhum tem autoridade de escrita sobre o estado de Relationship.

### ENCERRADO

- **Definição**: o ciclo de cuidado daquele Relationship específico chegou a um fim definitivo e registrado.
- **Como nasce**: por evento explícito de encerramento.
- **Como termina**: nunca — é terminal. Um relacionamento futuro entre as mesmas pessoas exige um **novo** Relationship (via reabertura ou troca), nunca uma reversão deste.
- **Quem pode criar**: paciente (sempre); profissional (quando houver canal); equipe administrativa (só excepcionalmente, com evidência concreta e autoria nomeada — nunca por inatividade).
- **Quem nunca cria**: o sistema automaticamente; CI; Observatório.
- **Quem pode visualizar**: mesmos leitores de ATIVO.
- **Quem nunca modifica**: qualquer parte, uma vez registrado — só pode ser seguido de um evento de correção (novo evento) ou de uma reabertura (novo ciclo), nunca editado.

### PAUSADO — não declarado como estado oficial

**Registrando exatamente o que a Fase 1 concluiu (veredito B) e o que a Fase 2 não chegou a fechar**: PAUSADO tem ao menos uma consequência de domínio real e não-redundante já identificada (modular a cadência de um eventual check-in periódico para quem já avisou de um hiato esperado), mas não tem definição suficiente de evento de origem, necessidade de data prevista, teto de duração ou efeito completo sobre autoridade/encerramento. A fase dedicada a fechar isso (Autoridade de Divergência e Definição de PAUSADO) foi interrompida antes de produzir veredito. **Por isso, esta especificação não declara PAUSADO como estado oficial.** Qualquer hiato relatado explicitamente por paciente ou profissional é, até nova decisão, tratado como um fato registrado dentro do próprio estado ATIVO — nunca como uma transição de estado.

---

## Etapa 4 — Eventos oficiais

| Evento                                        | Descrição                                                                                        | Origem                     | Autoridade                                          | Imutável                         | Consumidores                                        | Pode ser corrigido?         | Removido? | Substituído? |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------- | --------- | ------------ |
| Nascimento (`PRIMEIRO_ATENDIMENTO_REALIZADO`) | Confirmação de que o primeiro atendimento ocorreu                                                | Connection                 | Paciente (hoje)                                     | Sim                              | Relationship, CI                                    | Sim, por evento de correção | Não       | Não          |
| Continuidade relatada                         | Fato de que o cuidado prosseguiu (novo atendimento, ou resposta a verificação periódica)         | Relationship               | Paciente/profissional (quando houver canal)         | Sim                              | Relationship, CI                                    | Sim, por evento de correção | Não       | Não          |
| Encerramento                                  | Fim definitivo declarado explicitamente                                                          | Relationship               | Paciente/profissional (futuro)/equipe (excepcional) | Sim                              | Relationship, CI, Observatório (se atrito relatado) | Sim, por evento de correção | Não       | Não          |
| Troca de profissional                         | Encerramento de um Relationship ATIVO com intenção declarada de continuar com outro profissional | Relationship → Connection  | Paciente                                            | Sim                              | Relationship, Connection (novo ciclo), CI           | Sim                         | Não       | Não          |
| Reabertura                                    | Sinal de que a pessoa deseja retomar cuidado depois de um ciclo já ENCERRADO                     | Relationship → Journey/ACE | Paciente                                            | Sim                              | Journey/ACE, CI (`REABERTA`)                        | Sim                         | Não       | Não          |
| Correção de registro                          | Ajuste factual sobre um evento anterior, feito por engano                                        | Relationship               | Autor do relato original                            | Sim (o evento de correção em si) | Relationship                                        | N/A (é a própria correção)  | Não       | Não          |
| Contestação                                   | Segunda parte discorda de um relato já registrado                                                | Relationship               | A parte que discorda (quando houver canal)          | Sim                              | Relationship                                        | Sim                         | Não       | Não          |
| Solicitação de ajuda                          | Pedido de suporte operacional                                                                    | Relationship               | Paciente/profissional                               | Sim                              | Operação (efeito), Relationship (registro)          | Sim                         | Não       | Não          |

**Nenhum evento pode ser removido ou substituído** — mesmo padrão append-only já em produção em Connection (`connection_events`). Toda correção é sempre um evento novo.

---

## Etapa 5 — Autoridade

| Fato                    | Quem registra                                                             | Quem pode contestar                                         | Quem resolve conflito             |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| Primeiro atendimento    | Paciente (hoje); profissional (futuro)                                    | Profissional (quando houver canal)                          | **Lacuna — sem dono documentado** |
| Continuidade            | Paciente/profissional                                                     | A outra parte (quando houver canal)                         | **Lacuna**                        |
| Pausa                   | Não aplicável — PAUSADO não é estado oficial (Etapa 3)                    | —                                                           | —                                 |
| Retomada                | Não aplicável pela mesma razão — tratado como continuidade relatada       | —                                                           | —                                 |
| Encerramento            | Paciente; profissional (futuro); equipe (excepcional, evidência concreta) | A outra parte                                               | **Lacuna**                        |
| Correção                | Autor do relato original                                                  | Qualquer parte envolvida no fato original                   | **Lacuna**                        |
| Troca                   | Paciente                                                                  | Não se aplica (decisão do paciente sobre a própria escolha) | Não se aplica                     |
| Novo ciclo (reabertura) | Paciente                                                                  | Não se aplica                                               | Não se aplica                     |

**Registrado exatamente como instruído**: em toda linha onde a resposta documental não existe, a coluna "quem resolve conflito" permanece **lacuna**, nunca preenchida por invenção. Essa é a lacuna conceitual mais recorrente de todo o domínio, já identificada na Fase 0 e reafirmada na Fase 1 sem resolução.

---

## Etapa 6 — Invariantes

Verificados um por um contra a teoria consolidada nas Fases 0 e 1:

1. **Relationship nunca nasce sem Connection terminal.** Válido — é a própria definição de origem (Etapa 1).
2. **Relationship nunca altera Connection.** Válido — Connection é imutável após terminal, garantido por trigger de banco já testado (Fase 4).
3. **Relationship nunca modifica Caso.** Válido — nenhuma responsabilidade de Relationship inclui `cases.status`; mesmo padrão já confirmado para Connection.
4. **Relationship nunca interpreta comportamento.** Válido — decorre de `DOMAIN_COMPATIBILITY_INTELLIGENCE.md`: coleta é de Connection & Relationship, interpretação é exclusiva do CI.
5. **Relationship nunca gera hipótese.** Válido — mesma fonte.
6. **Relationship nunca produz CI.** Válido — CI é sempre quem consome os fatos, nunca o contrário.
7. **Relationship nunca encerra sozinho** (por decisão automática do sistema). Válido — todo encerramento exige evento explícito de uma autoridade humana nomeada.
8. **Relationship nunca nasce por silêncio.** Válido — nasce exclusivamente do evento real `PRIMEIRO_ATENDIMENTO_REALIZADO`.
9. **Relationship nunca muda profissional** (dentro do mesmo registro). Válido — troca de profissional sempre encerra o Relationship atual e inicia um novo ciclo (Fase 1, Etapa 5); nunca uma mutação interna.
10. **Relationship nunca reaproveita ciclo encerrado.** Válido — reabertura sempre origina um Caso novo (invariante #14, `ARCHITECTURAL_INVARIANTS.md`, já existente antes desta sessão).
11. _(Adicional, decorrente da Etapa 3)_ **Nenhum estado é declarado sem consequência de domínio própria e evento de origem explícito.** É exatamente por que PAUSADO não foi aceito como estado oficial nesta especificação.
12. _(Adicional, decorrente da Etapa 5)_ **Nenhuma autoridade de resolução de conflito é presumida onde não há decisão documental** — reforça a lacuna registrada, em vez de mascará-la.

Nenhum dos invariantes propostos precisou ser rejeitado; dois foram adicionados por decorrência direta das etapas anteriores.

---

## Etapa 7 — Máquina de Estados Conceitual

```
(Relationship não existe)
        │
        │ evento: PRIMEIRO_ATENDIMENTO_REALIZADO (herdado de Connection)
        ▼
     ATIVO ◀────────────────────────────┐
        │                               │ evento: continuidade relatada
        │                               │ (não muda o estado — só acumula fato)
        │───────────────────────────────┘
        │
        │ evento: encerramento explícito
        │ (paciente / profissional / equipe excepcional / decorrente de troca de profissional)
        ▼
   ENCERRADO  (terminal para este registro específico)
        │
        └──▶ [fora desta máquina] reabertura → novo Caso → nova Connection → Relationship inteiramente novo
```

- **Estado inicial**: inexistente — Relationship só passa a existir com o evento de nascimento.
- **Transições permitidas**: `(inexistente) → ATIVO` (nascimento); `ATIVO → ATIVO` (continuidade relatada, sem mudança de rótulo); `ATIVO → ENCERRADO` (qualquer categoria de encerramento).
- **Estados finais**: `ENCERRADO`.
- **Transições proibidas**: `ENCERRADO → ATIVO` (reversão direta — não existe; só reabertura via ciclo novo); qualquer transição sem evento explícito.
- **Eventos impossíveis**: retomada automática por data prevista; encerramento por inatividade; qualquer transição inferida de ausência de resposta.

Cada transição já foi justificada em detalhe nas Fases 0 e 1 desta sessão — este diagrama consolida, não reabre, essas justificativas.

---

## Etapa 8 — Cadeia de Responsabilidade

```
Paciente
   │
   ▼
Atendente         ← NOVO, ver nota de auditoria (Etapa 11)
   │
   ▼
Curador           ← papel parcialmente implementado (P009); Reunião de Acolhimento é NOVA, ver Etapa 11
   │
   ▼
Equipe Médica     ← hoje corresponde ao pipeline ACE (P001-P008) + revisão humana única (P009), não a "três médicos" deliberando — ver Etapa 11
   │
   ▼
Relationship      ← domínio desta especificação, ainda conceitual
   │
   ▼
CI                ← Conceitual, Fases 0-6 do próprio CI já concluídas
   │
   ▼
Observatório      ← Protocolo ativo, sem dado real (aguarda Shadow Launch)
```

- **Paciente**: vive a experiência; único autor com canal hoje para relatar qualquer fato de Relationship.
- **Atendente**: acompanhamento operacional permanente, do primeiro contato ao "encerramento do contrato" (Etapa 10) — nunca decide nada técnico ou clínico.
- **Curador**: conduz a Reunião de Acolhimento (Etapa 9, novo) e acompanha a entrega da Curadoria (parcialmente já implementado via P009).
- **Equipe Médica**: hoje, no sistema real, é o pipeline ACE + revisão humana — não uma reunião de três médicos.
- **Relationship**: registra fatos brutos pós-atendimento.
- **CI**: interpreta.
- **Observatório**: observa atrito, transversalmente, em qualquer ponto da cadeia.

---

## Etapa 9 — Papel do Curador

> Conforme instruído nesta fase, formalizando exatamente o que foi descrito. Ver Etapa 11 para a tensão registrada contra `docs/architecture/DOMAIN_CURATION.md` (Implementado).

O Curador possui exatamente duas responsabilidades principais.

**Responsabilidade 1 — Realizar a Reunião de Acolhimento.**
Objetivos: ouvir; explicar; acolher; organizar a história; esclarecer o processo; preparar o material para a Curadoria.
Nunca: diagnosticar; prescrever; interpretar exames; escolher tratamento; emitir opinião médica.

**Responsabilidade 2 — Ser o responsável pelo acompanhamento da Curadoria.**
Após a análise dos três médicos: receber a Curadoria consolidada; garantir sua entrega ao paciente; explicar o resultado; esclarecer dúvidas sobre o documento; coordenar o encaminhamento definido.
Nunca: alterar a decisão médica; substituir médico; reinterpretar a Curadoria.

---

## Etapa 10 — Papel da Atendente

> Mesma ressalva da Etapa 9.

Responsabilidade: acompanhar o paciente desde o primeiro contato até o encerramento do contrato — ponto permanente de apoio operacional.
Nunca: exercer papel técnico; exercer papel clínico; substituir o Curador; substituir médico.

---

## Etapa 11 — Auditoria

**Existe alguma contradição entre Relationship e Connection?** Não. A teoria de Relationship desta especificação permanece 100% compatível com o Connection já implementado e promovido — nenhuma alteração é exigida em `src/modules/connection`, nas migrations ou nos testes já validados (Fase 4).

**Existe alguma responsabilidade duplicada?** Não identificada entre Relationship/CI/Observatório/ACE — as fronteiras já foram testadas explicitamente nas Fases 0 e 1.

**Existe alguma lacuna?** Sim, várias, cumulativas:

- Autoridade para resolver divergência genuína entre relatos — nunca resolvida (Fase 1 e a Fase 2 interrompida).
- Definição completa de PAUSADO — candidato registrado, não fechado.
- **A mais significativa desta fase**: uma divergência real entre o que as Etapas 9/10 descrevem (Reunião de Acolhimento conduzida pelo Curador, "três médicos", papel de Atendente, "contrato") e o que está de fato implementado e documentado. `docs/architecture/DOMAIN_CURATION.md` (Estado: **Implementado**) define a responsabilidade real do Curador Médico como exclusivamente P009 (revisar a Shortlist já gerada pelo ACE) — nada em nenhum código ou documento desta sessão descreve o Curador conduzindo um encontro de acolhimento com o paciente; o acolhimento real (`sua-historia`) é um wizard de autoatendimento, sem qualquer intermediação humana no fluxo implementado. O catálogo de papéis (ADR-006, `user_roles`) tem quatro papéis — `administrador`, `curador_medico`, `paciente`, `profissional` — **nenhum "atendente"**. "Três médicos" não corresponde ao mecanismo real do ACE (pipeline determinístico P001-P008 + um único Curador humano em P009, nunca três médicos deliberando). "Contrato"/"encerramento do contrato" não aparece em `PRODUCT_ARCHITECTURE.md` nem em nenhum outro documento — o Concierge é descrito como um ciclo de 12 meses, nunca como um contrato comercial com essa terminologia.

**Existe alguma decisão ainda sem dono?** Sim — quem resolve divergência de fato (Etapa 5) permanece sem dono documentado.

**Existe alguma promessa impossível?** Potencialmente: uma Reunião de Acolhimento real (não documental) com cada paciente exige dimensionamento de equipe de Curadores compatível com o volume — questão operacional, não conceitual, mas que merece nota antes de qualquer decisão de escala.

**Existe alguma fronteira mal definida?** Sim: o papel de Atendente, como descrito ("desde o primeiro contato até o encerramento do contrato"), se sobrepõe pelo menos parcialmente com o que hoje é responsabilidade documentada do Administrador (ADR-006: cria a conta, ativa/desativa acesso). Não fica claro, a partir desta fase, se Atendente é um papel novo formal (exigindo entrada própria no catálogo de papéis) ou uma função operacional dentro da equipe já existente, sem representação própria em `user_roles`.

---

## Documentos relacionados

- `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` — domínio-pai, Connection já implementado.
- `docs/architecture/DOMAIN_CURATION.md` — fonte oficial do papel real e já implementado do Curador Médico (P009) — ver tensão registrada na Etapa 11.
- `docs/architecture/DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — consumidor dos fatos que Relationship produzirá (L3).
- `docs/architecture/DOMAIN_EXPERIENCE_OBSERVATORY.md` — consumidor de atrito operacional.
- `docs/architecture/ARCHITECTURAL_INVARIANTS.md` — invariante #14 (reabertura), base para a Etapa 6.
- `docs/DECISIONS.md` — ADR-006 (catálogo de papéis, referenciado na Etapa 11), ADR-027 (promoção de Connection).

## Diagrama

Ver diagrama mestre em `docs/architecture/ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `CONNECTION ──▶ RELATIONSHIP ──▶ (evidência) ──▶ COMPATIBILITY INTELLIGENCE`.
