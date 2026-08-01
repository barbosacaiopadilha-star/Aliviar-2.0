# Modelagem Técnica da Continuidade Pós-Decisão — Fase 10

> **Objetivo:** definir a **menor evolução coerente** do domínio que torne a [ADR-043](../DECISIONS.md) implementável.
> **Não faz:** implementar · criar migration · alterar RLS · criar tela · definir SLA · criar agenda · criar protocolo clínico · emitir decisão jurídica · tocar Motor, critérios, pesos, filtros ou seleção dos três.
> **Preserva integralmente:** Motor de Compatibilidade · critérios · pesos · filtros · seleção dos três · **autoria da decisão pela paciente** · responsabilidade auditada do Case · ausência de ranking · legitimidade de "nenhum dos três".
> **Data:** 2026-08-01

> **Local canônico.** Este documento vive em `docs/architecture/`, junto de [`DOMAIN_CONNECTION_RELATIONSHIP.md`](./DOMAIN_CONNECTION_RELATIONSHIP.md) — o documento de domínio referenciado por ADR-027, ADR-028 e ADR-029 —, de [`DOMAIN_RELATIONSHIP.md`](./DOMAIN_RELATIONSHIP.md) e de [`ARCHITECTURAL_INVARIANTS.md`](./ARCHITECTURAL_INVARIANTS.md). **Não existe árvore de arquitetura paralela.**

---

# 1 · Inventário do domínio vigente

| # | Capacidade | Artefatos | Classificação |
|---|---|---|---|
| 1 | **Decisão da paciente** | `curadoria.patient_curadoria_decisions` (`outcome ∈ CHOSEN\|NONE_OF_THEM`, `chosen_option_id`, `note`, `decided_at`); RLS `patient_decisions_insert_patient`, `patient_decisions_select_own_or_team`; `repository.registerPatientDecision` (idempotente em `23505`); `actions.ts` | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 2 | **"Nenhum dos três"** | mesmo `outcome`, valor `NONE_OF_THEM` | **UTILIZÁVEL SEM ALTERAÇÃO** — é desfecho de primeira classe |
| 3 | **`DECISAO_REGISTRADA`** | `connection_records.status`; RPC `create_connection_with_event` (registro + evento numa transação) | **UTILIZÁVEL COM EXTENSÃO** |
| 4 | **Correção da decisão** | `CORRECAO_ESCOLHA`; `commands.correctChoice`; *trigger* `assert_connection_valid_transition` (só em `DECISAO_REGISTRADA`); `assert_connection_professional_in_delivery` (só dentro dos três) | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 5 | **`CONTATO_INICIADO`** | `commands.registerContactIntent` — *"sempre uma declaração do paciente, nunca verificada externamente"*; UI: *"Você registrou que iniciou o contato"* | **CONFLITANTE** — o nome não diz **por quem**; sob dois modos, torna-se ambíguo |
| 6 | **Primeiro atendimento** | `PRIMEIRO_ATENDIMENTO_REALIZADO` (terminal); `confirmFirstAppointmentAndBirthRelationship` (nascimento atômico) | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 7 | **Encerramento sem relacionamento** | `ENCERRADO_SEM_RELACIONAMENTO` (terminal) | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 8 | **Máquina de estados** | `state-machine.ts` espelhando o *trigger*; `apply_connection_transition` com concorrência otimista (`55000`) | **UTILIZÁVEL COM EXTENSÃO** |
| 9 | **Responsabilidade do Case** | `cases.responsible_id`, `cases.responsible_role ∈ (atendente, curador_medico, concierge)`; índice `cases_responsible_idx` | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 10 | **Transferência ao Concierge** | `transfer_case_responsibility()` — ator de `auth.uid()`, **motivo obrigatório**, valida papel real do destinatário, idempotente, audita antes de mover; `case_responsibility_changes`; `modules/cases/responsibility.ts` | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 11 | **Papel `concierge`** | `curadoria.roles`; `crm_cases.responsible_concierge_id`; `crm_tasks`, `crm_appointments`, `crm_interactions` com RLS própria | **UTILIZÁVEL COM EXTENSÃO** |
| 12 | **Acesso da equipe à Connection** | `connection_records_select_admin_or_case_curator`; `connection_events_select_*` | **UTILIZÁVEL COM EXTENSÃO** — **o Concierge não aparece em nenhuma** |
| 13 | **Notificação à paciente** | `patient_notifications` (+ *trigger* `protect_patient_notification_content`); `insert` **admin-only** | **CONFLITANTE para uso interno** — semântica é paciente-facing |
| 14 | **Notificação à equipe** | — | **INEXISTENTE** |
| 15 | **Registro de leitura / visualização** | — | **INEXISTENTE** |
| 16 | **Contato da Aliviar com o profissional** | — | **INEXISTENTE** |
| 17 | **Disponibilidade / reserva / agenda** | — | **INEXISTENTE** (61 migrations, zero ocorrências) |
| 18 | **Detecção de inércia** | — | **INEXISTENTE** |
| 19 | **Relationship** | `relationship_records` (`ATIVO\|ENCERRADO`), `relationship_events` (`RELACIONAMENTO_INICIADO`, `ENCERRAMENTO_PLANEJADO_DECLARADO`, `INTERRUPCAO_DECLARADA`, `REABERTURA_OBSERVADA`); `unique(connection_id)`; `assert_relationship_matches_connection` | **UTILIZÁVEL SEM ALTERAÇÃO** |
| 20 | **Troca de Profissional** | — nenhum evento em `relationship_events_type_check` | **INEXISTENTE** — capacidade pendente da ADR-028 |
| 21 | **Temporary Access** | **ADR-029 aprovada; `src/modules/temporary-access/` e migration não existem** | **INEXISTENTE** |
| 22 | **Testes vigentes** | 4 unitários, 3 de componente, 5 de integração, 2 e2e sobre Connection/Relationship | **UTILIZÁVEL COM EXTENSÃO** |

**Conclusão do inventário:** **o domínio vigente cobre a decisão, a correção, a responsabilidade e o desfecho.** O que falta concentra-se em três eixos: **visibilidade** (12), **notificação** (13–15) e **atuação da Aliviar sobre terceiros** (16–17, 20–21).

---

# 2 · Princípios de modelagem

Os doze princípios do escopo são adotados como **restrições de projeto**, e três merecem consequência explícita:

**Persistência ≠ notificação (P1).** Nenhuma projeção derivada de `connection_records` pode ser chamada de "aviso". Notificação exige artefato próprio com estados (§9).

**Acesso ≠ responsabilidade (P4) e responsabilidade organizacional ≠ atribuição pessoal (P5).** Consequência direta: **o acesso do Concierge é derivado da responsabilidade do Case, nunca do papel** (§8).

**Nenhuma capacidade futura simulada por texto (P12).** Consequência: **nenhum estado novo entra no enum antes de existir quem o produza.** Estado sem produtor é promessa disfarçada de dado.

---

# 3 · Fronteiras entre agregados

> **Regra que governa esta seção: `connection_records` não vira tabela genérica.** Ela guarda **o vínculo pontual entre uma decisão e um profissional**, e nada mais. Fatos com ciclo de vida próprio ganham agregado próprio; fatos derivados ficam em projeção.

| Fato | Onde vive | Justificativa |
|---|---|---|
| **A decisão** | `patient_curadoria_decisions` | já é o registro de autoria dela; **não se move** |
| **Responsabilidade pelo Case** | `cases.responsible_id/_role` | **fonte única de "de quem é este Case"**; não se duplica |
| **Atribuição ao Concierge** | **a mesma** — é a transferência | criar segunda atribuição produziria **dois donos concorrentes** |
| **Modo de contato** | **`connection_records.contact_mode`** (nova coluna) | é propriedade **1:1 e estável** do vínculo, escolhida uma vez; tabela própria seria indireção sem ganho |
| **Contato com o profissional** | **novo agregado `approach_attempts`** | tem **ciclo de vida próprio e cardinalidade N** (várias tentativas, canais, respostas). Modelar como colunas de `connection_records` seria exatamente a genericização proibida |
| **Disponibilidade** | **resposta dentro de `approach_attempts`** | **não** é entidade global: disponibilidade global implicaria agenda, e agenda não existe |
| **Alteração mediada** | **evento**, em Connection **ou** Relationship conforme o momento (§14) | segue a fronteira dos módulos, não cria terceiro território |
| **Primeiro atendimento** | `connection_records` (terminal) | já é |
| **Início de Relationship** | `relationship_records` | já é, com nascimento atômico |
| **Notificação** | **novo agregado `team_notifications`** (§9) | estados próprios; não é propriedade de nenhum dos anteriores |
| **Inércia** | **projeção derivada**, sem tabela | é ausência de fato; **ausência não se persiste** (§10) |
| **Pausa por segurança** | **evento, nunca status** | ver §5.3 |

---

# 4 · Modo de contato

**Valores:** `CONTATO_DIRETO_ACOMPANHADO` · `APROXIMACAO_INTERMEDIADA`.

**Quando é escolhido.** No ato da decisão ou imediatamente após, **sempre por manifestação explícita**. **`contact_mode` é `null` até ser escolhido, e `null` não é modo** — é ausência de escolha, e nenhuma rotina pode tratá-lo como padrão.

**Quem escolhe.** **Apenas a paciente.** Nem sistema, nem Curador, nem Concierge.

**Pode ser alterado?** **Sim, enquanto nenhuma aproximação tiver sido despachada e nenhum contato declarado.** Depois disso o modo é histórico: já produziu efeito no mundo. A alteração gera evento próprio, nunca sobrescrita silenciosa.

**Consentimento.** No modo intermediado o ato autoriza a Aliviar a **procurar um terceiro em nome dela** — o que é diferente de registrar uma escolha. **Se o consentimento pode ser expresso no mesmo ato ou exige manifestação separada é `DEPENDENTE DE PRIVACIDADE/JURÍDICO`** (ADR-043 Q-C1) e **não é decidido aqui**. A modelagem apenas garante que o modo seja **registrado com autoria e momento**, permitindo qualquer das duas respostas.

**Eventos por modo:**

| | Direto acompanhado | Intermediado |
|---|---|---|
| **comuns** | `modo_contato_definido` · `indisponibilidade_informada` · `primeiro_contato_realizado` · `connection_encerrada` · alteração | idem |
| **exclusivos** | `contato_direto_declarado` **(só a paciente)** | `aproximacao_solicitada` · `aproximacao_despachada` · `aproximacao_recebida` · `disponibilidade_informada` **(só a Aliviar/profissional)** |

**A exclusividade é invariante testável:** um `aproximacao_despachada` num Connection em modo direto é **erro de domínio**, não caso de borda.

**Registros existentes.** Ficam com `contact_mode = null`, lidos como **`LEGADO_AUTOSSERVICO`** na projeção. **Nenhum backfill.** Atribuir `CONTATO_DIRETO_ACOMPANHADO` retroativamente afirmaria uma escolha que ninguém fez, e atribuir `APROXIMACAO_INTERMEDIADA` afirmaria um serviço que não existiu.

---

# 5 · Estados de Connection

## 5.1 · A decisão de projeto mais importante desta fase

O escopo lista dezenove estados. **Transformá-los em dezenove valores de `connection_records.status` seria um erro**, por três razões: forçaria todos os casos pelo mesmo caminho (o escopo proíbe); genericizaria a tabela (§3 proíbe); e criaria estados sem produtor (P12 proíbe).

> **A maioria desses "estados" não é status do Connection — é (a) propriedade de outro agregado, (b) fato derivado de eventos, ou (c) sobreposição que não altera o vínculo.**

## 5.2 · O status canônico — extensão mínima

| Status | Fato | Ator | Entrada | Transições permitidas | Proibidas | Frase à paciente | Vigência |
|---|---|---|---|---|---|---|---|
| `DECISAO_REGISTRADA` | há escolha registrada; nada tocou o mundo | paciente | `decisao_registrada` | `EM_APROXIMACAO` (só intermediado) · `CONTATO_DECLARADO` (só direto) · dois terminais | qualquer regresso | *"sua decisão está registrada"* · *"pode trocar enquanto não tiver falado com [nome]"* | **VIGENTE** |
| **`EM_APROXIMACAO`** *(novo)* | a Aliviar está agindo junto ao profissional | **Concierge** | `aproximacao_despachada` | `CONTATO_DECLARADO`? **não** · `PRIMEIRO_ATENDIMENTO_REALIZADO` · `ENCERRADO_SEM_RELACIONAMENTO` · regresso a `DECISAO_REGISTRADA` **se toda tentativa falhar** | existir em modo direto | *"falamos com [nome] em [data]"* | **NOVO** |
| `CONTATO_INICIADO` → **`CONTATO_DECLARADO`** *(renomeio semântico)* | a paciente declarou ter iniciado contato | **paciente** | `contato_direto_declarado` | dois terminais | correção direta da escolha | *"você registrou que iniciou o contato"* | **VIGENTE, renomeado** |
| `PRIMEIRO_ATENDIMENTO_REALIZADO` | terminal; nasce Relationship | paciente | `primeiro_contato_realizado` | — | qualquer | *"você registrou o primeiro atendimento"* | **VIGENTE** |
| `ENCERRADO_SEM_RELACIONAMENTO` | terminal; não vingou | paciente | `connection_encerrada` | — | qualquer | *"você registrou que o contato não avançou"* | **VIGENTE** |

**Sobre o regresso `EM_APROXIMACAO → DECISAO_REGISTRADA`:** é a **única transição regressiva** proposta, e existe por uma razão de dignidade: se a aproximação não produziu nada, **a janela de correção direta da paciente deve voltar a existir**. Fechá-la por um ato nosso que não deu em nada seria puni-la pela nossa tentativa. **Requer decisão explícita** (§23, NT-3) por alterar o *trigger* vigente.

**Sobre o renomeio.** `CONTATO_INICIADO` não diz por quem. Sob dois modos vira ambíguo — e foi essa ambiguidade que produziu a divergência D1. **É renomeio de rótulo, não de semântica**, e o valor vigente permanece legível (§17).

## 5.3 · O que **não** vira status — e por quê

| "Estado" do escopo | Onde realmente vive |
|---|---|
| modo de contato definido | **coluna** `contact_mode` |
| responsabilidade organizacional ativa | **derivado**: existe desde `decisao_registrada`, por definição |
| transferência pendente · Concierge responsável | **`cases.responsible_role`** — não duplicar |
| aguardando ação da paciente / da Aliviar | **projeção** de `contact_mode` + último evento |
| profissional recebeu · aguardando resposta · disponível · indisponível | **`approach_attempts.status`** — são estados **da tentativa**, não do vínculo |
| alteração solicitada | **evento** + estado da solicitação (§14) |
| retorno à Mesa / à Curadoria | **não são estados de Connection** — o retorno é ato do Case/Curadoria; o Connection termina ou permanece |
| **pausado por segurança** | **evento de sobreposição, nunca status** |

> **Precedente aplicado — ADR-028.** A implementação paralela de Relationship propunha um estado `PAUSADO`, e a teoria aprovada o rejeitou porque *"PAUSADO nunca teve consequência de domínio própria comprovada"*. **A pausa por segurança está na mesma situação, e com razão adicional:** ela **não pode** alterar o estado da decisão — A_DECISAO §10.1 exige que o processo fique *exatamente como estava*. Um status a alteraria. **Portanto: evento, com sobreposição de apresentação, e nenhum efeito no vínculo.**

---

# 6 · Eventos

**Regra:** nenhum evento sem consumidor. Os marcados ⛔ **não são propostos agora** — ficam registrados como conceitualmente distintos, para que ninguém os funda depois.

| Evento | Produtor · autoridade | Pré-condição | Payload mínimo | Sensível | Idempotência | Efeito | Visibilidade | Falha |
|---|---|---|---|---|---|---|---|---|
| `decisao_registrada` | **paciente** | entrega publicada | profissional | não | ✅ `unique(curated_selection_id)` | cria Connection | paciente, Curador, admin | duplicidade → retry seguro |
| `modo_contato_definido` | **paciente** | Connection em `DECISAO_REGISTRADA` | modo | não | por (connection, modo) | grava `contact_mode` | idem + Concierge | modo inválido para o estado |
| `responsabilidade_transferida` | **pessoa** (ator autenticado) | papel real do destinatário | novo responsável, papel, **motivo** | não | ✅ já implementada | move o Case | equipe | papel inexistente |
| `continuidade_atribuida` | ⛔ **não proposto** | — | — | — | — | — | — | **seria segundo dono** — é a transferência acima |
| `notificacao_criada` | **sistema** | decisão registrada | destino, referência | não | por (referência, destino) | cria notificação | equipe | — |
| `notificacao_despachada` | **sistema** | criada | canal, momento | não | por tentativa | marca despacho | equipe | canal indisponível |
| `notificacao_lida` | **pessoa** | despachada | quem, quando | não | primeira leitura vence | marca leitura | equipe | — |
| `contato_direto_declarado` | **paciente, exclusivamente** | modo **direto** | — | não | por Connection | fecha correção direta | paciente, Curador, Concierge | declarado sem ter contatado |
| `aproximacao_solicitada` | **paciente** (autorização) | modo **intermediado** | — | não | por Connection | habilita despacho | equipe | sem autorização |
| `aproximacao_despachada` | **Concierge** | solicitada | canal, momento, quem | ⚠️ identifica a paciente | por tentativa | → `EM_APROXIMACAO`; **fecha correção direta** | equipe + paciente (estado) | canal inválido |
| `aproximacao_recebida` | **sistema/Concierge** | despachada | evidência | não | por tentativa | marca recebimento | equipe | **inverificável na maioria dos canais** |
| `disponibilidade_informada` | **profissional** (ou Concierge relatando) | despachada | pode receber contato | não | por tentativa | resposta positiva | equipe + paciente | relato sem origem |
| `indisponibilidade_informada` | **profissional / Concierge** | despachada **ou** relato da paciente | motivo, origem, definitiva? | não | por tentativa | §15 | equipe + paciente | confundir com ausência de resposta |
| `primeiro_contato_realizado` | **paciente** | qualquer não-terminal | — | não | ✅ implementada | terminal + nasce Relationship | todos | inferir de contato |
| `alteracao_solicitada` | **paciente** | pós-fechamento da janela | novo profissional (dos três), motivo | não | por solicitação aberta | abre pendência | equipe | Concierge originar |
| `alteracao_executada` | **Concierge**, a pedido dela | solicitação aberta | referência à solicitação | não | por solicitação | troca **sem apagar** | todos | executar sem solicitação |
| `retorno_curadoria_solicitado` | **paciente** ou **Curador** | qualquer | motivo/"o que faltou" | ⚠️ texto dela | por pedido | sinaliza Curadoria | equipe | virar formulário classificado |
| `connection_encerrada` | **paciente** | não-terminal | — | não | ✅ implementada | terminal sem Relationship | todos | **encerrar por tempo** |
| `relationship_iniciado` | **domínio** | primeiro atendimento | — | ✅ atômica | nasce Relationship | todos | duplicidade → `unique(connection_id)` |

---

# 7 · Responsabilidade

**Preservado sem alteração:** `cases.responsible_id` · `cases.responsible_role` · `transfer_case_responsibility()` · motivo obrigatório · auditoria em `case_responsibility_changes` · validação do papel real · idempotência.

**As seis distinções, e onde cada uma vive:**

| Distinção | Representação | Novo? |
|---|---|---|
| **Responsabilidade organizacional da Aliviar** | **derivada**: existe desde `decisao_registrada`. **Não precisa de coluna** — é consequência do fato de haver decisão | não |
| **Responsável atual pelo Case** | `cases.responsible_id/_role` | não |
| **Responsável por uma ação específica** | **`approach_attempts.actor_id`** e o ator de cada evento | sim (dentro do novo agregado) |
| **Quem visualizou** | `notificacao_lida.actor_id` | sim (§9) |
| **Quem executou** | ator do evento correspondente | não |
| **Quem respondeu** | `approach_attempts.responded_by` + origem | sim |

> **Não há segundo dono do Case.** Uma "caixa de trabalho" do Concierge é **projeção de leitura** sobre Cases dos quais ele já é responsável + notificações não lidas — **nunca uma segunda tabela de atribuição**. Se a operação vier a exigir tarefa destacada da responsabilidade, ela se modela como **tarefa** (o padrão já existe em `crm_tasks`), com dono próprio e **sem jamais representar posse do Case**.

---

# 8 · Acesso do Concierge

**Princípio: o acesso deriva do vínculo com o Case, nunca do papel.** Ter `concierge` não pode dar visão de decisões de pacientes que não são sua responsabilidade.

| Pergunta | Resposta proposta |
|---|---|
| Quais registros precisa ler | `connection_records` e `connection_events` **do Case sob sua responsabilidade**; a decisão (profissional escolhido e desfecho); a entrega final para conhecer os três |
| Quais campos | profissional escolhido · estado · modo · histórico de eventos · **retratos e contexto da entrega** |
| Depende de ser o responsável atual? | **Sim** — condição necessária: `cases.responsible_id = auth.uid()` **e** `responsible_role = 'concierge'` |
| Administradores mantêm leitura? | **sim**, inalterada |
| Curador mantém leitura após a transferência? | **sim** — continua respondendo por dúvidas sobre o caso e os três (A_DECISAO §7). Perde a **responsabilidade primária**, não a leitura |
| A paciente mantém controle? | **sim, integralmente** — nada aqui reduz seus direitos |
| Pode alterar a decisão? | **não.** Só executa `alteracao_executada` **a partir de solicitação dela** |
| Pode registrar contato? | **`aproximacao_*` sim** (é ato dele). **`contato_direto_declarado` não** — é declaração exclusiva da paciente |
| Pode registrar indisponibilidade? | **sim**, com origem registrada |
| Pode solicitar retorno à Curadoria? | **pode sinalizar**; quem reabre é o Curador |
| Quem lê a formulação do trade-off? | hoje paciente, Curador e admin. **A inclusão do Concierge é `DEPENDENTE DE PRIVACIDADE/JURÍDICO`** e **não é proposta aqui.** A função dele não a exige |

**Políticas conceituais** (não escritas como migration): `connection_records_select_case_concierge` e `connection_events_select_case_concierge`, ambas condicionadas ao vínculo acima; escrita restrita aos eventos que lhe pertencem. **Nenhuma política concede leitura por papel isolado.**

---

# 9 · Notificação verificável

## 9.1 · Alternativas

| Alternativa | Avaliação |
|---|---|
| **Estender `patient_notifications`** | **Rejeitada.** Semântica é paciente-facing (`profile_id` = destinatário paciente, RLS `select_own_or_admin`, *trigger* que protege conteúdo). Misturar destinatários internos criaria risco real de vazamento por política mal escrita |
| **Caixa de trabalho a partir de tarefas** | **Insuficiente sozinha.** `crm_tasks` ancora em `crm_contacts`, não em Case/Connection; e tarefa ≠ notificação |
| **Evento de domínio com projeção** | **Necessária, insuficiente.** Dá o fato; não dá despacho, leitura nem destinatário |
| **Tabela própria `team_notifications`** | **Adotada** como núcleo |
| **Combinação** | **Recomendada:** evento de domínio **produz** a notificação; a projeção alimenta a caixa de trabalho |

## 9.2 · Estados

`CRIADA` → `DESPACHADA` → `DISPONIVEL_PARA_LEITURA` → `LIDA` → `ASSUMIDA`; mais `FALHOU`.

**`EXPIRADA` e `ESCALADA` não são propostos** — pressupõem regra temporal, e **não há SLA nem horário de operação**. Ficam registrados como conceitos distintos para adoção futura (§10).

**Destinatário.** O responsável atual pelo Case. **Quando não há destinatário individual** — o caso mais provável no início —, o destinatário é o **papel**, e a notificação fica numa caixa coletiva até alguém assumir. **`ASSUMIDA` é registrada como a transferência de responsabilidade, não como um "aceite" paralelo.**

**Idempotência e deduplicação:** chave por (referência de domínio, destinatário); um mesmo fato não gera duas notificações. **Auditoria:** append-only, no padrão já usado. **Retenção:** `DEPENDENTE DE PRIVACIDADE/JURÍDICO`. **Fora do horário:** a notificação é criada normalmente; **o sistema não afirma que alguém verá** — não existe horário formalizado.

**Frases por estágio:** `CRIADA` → *"sua decisão está registrada"* · `DESPACHADA` → *"avisamos [nome]"* · `LIDA` → *"[nome] já viu"* · `ASSUMIDA` → *"[nome] está cuidando disso com você"*. **Nenhum estágio autoriza a frase do seguinte.**

**Canal:** o agregado registra **qual canal foi usado**, e **não obriga nenhum**. Push, e-mail e WhatsApp **não são modelados como obrigatórios** — o domínio ainda não decidiu canal.

---

# 10 · Detecção de inércia

**Todos os sinais são fatos operacionais nossos. Nenhum é comportamento da paciente.**

| Sinal | Fato observado |
|---|---|
| decisão sem transferência | Connection em `DECISAO_REGISTRADA` e `cases.responsible_role ≠ concierge` |
| transferência sem leitura | responsabilidade transferida, notificação não `LIDA` |
| ação atribuída sem execução | notificação `LIDA` sem evento subsequente |
| despacho sem resposta | `approach_attempts` despachada sem resposta nem indisponibilidade |
| estado sem atualização | último evento do Connection além de um limite **futuro** |
| ausência de desfecho | Connection não-terminal indefinidamente |

**Proibidos, por P7 e pelas proibições N4/P5:** tempo de cursor · número de visitas · demora dela na Mesa · hesitação suposta · qualquer inferência emocional. **A paciente não é objeto de medição; a nossa operação é.**

**Três camadas, deliberadamente separadas:**

**Capacidade estrutural de medir** — **modelável agora**: basta que cada fato tenha marco temporal. É o que os eventos já dão.
**Regra temporal** — **`DEPENDENTE DE OPERAÇÃO`**: nenhuma duração é inventada aqui.
**Escalonamento** — **`DEPENDENTE DE OPERAÇÃO`**: exige destinatário de escalada e cobertura, que não existem.

> **A modelagem entrega o instrumento e não move o ponteiro.** Sem isso, a lacuna B-3 da Fase 9C.1 — nenhuma falha é detectada por mecanismo — permanece indefinidamente.

---

# 11 · Contato direto acompanhado — fluxo mínimo

1. **Escolha explícita do modo** → `modo_contato_definido`.
2. **Acesso ao meio de contato** do profissional, quando autorizado — **e com a data da informação**, porque contato é dado volátil.
3. **Declaração de que iniciou** → `contato_direto_declarado`, **exclusiva dela**.
4. **"Não consegui falar"** → registro próprio, **que não é indisponibilidade e não fecha a janela de correção**. É a lacuna que hoje deixa a paciente sem saída intermediária.
5. **Indisponibilidade** → `indisponibilidade_informada` com origem "relato da paciente".
6. **Pedido de conversa** → não altera estado algum, **e não é sinal** (P5).
7. **Acompanhamento** → o Concierge **pergunta**, uma vez, por meio humano. **Nunca observa comportamento.**
8. **Primeiro contato realizado** · 9. **Encerramento sem relacionamento** · 10. **Retorno à Curadoria** → eventos existentes/§6.

**Silêncio nunca confirma contato**, e **nenhum detalhe da conversa é solicitado** — o registro é factual (aconteceu / não consegui / ele não está disponível), nunca narrativo.

---

# 12 · Aproximação intermediada — fluxo mínimo

1. **Autorização** → `aproximacao_solicitada`.
2. **Dados mínimos transmitidos** → **o necessário para responder ou iniciar**. **Nunca a formulação do trade-off**, nunca as prioridades ordenadas, nunca a existência dos outros dois.
3. **Temporary Access** → §13.
4. **Responsável** → **o Concierge do Case**, nominal.
5. **Despacho** → `aproximacao_despachada` (canal, momento, ator) — **fecha a correção direta**.
6. **Recebimento** → `aproximacao_recebida` **só quando verificável**; na maioria dos canais não é, e então **não se afirma**.
7. **Resposta** → `disponibilidade_informada` ou `indisponibilidade_informada`.
8. **Ausência de resposta** → **não é indisponibilidade**; permanece `EM_APROXIMACAO` até decisão humana.
9. **Atualização à paciente** → estado real, **sem prazo**.
10. **Primeiro contato realizado** → terminal + Relationship.

**As cinco distinções que esta fase não pode borrar:**

| Conceito | Significado | Existe? |
|---|---|---|
| **contato com o profissional** | tentamos falar com ele | proposto |
| **aceite do profissional** | ele concordou em atender **esta** pessoa | **não modelado** — exigiria vínculo dele com o caso |
| **disponibilidade** | ele pode receber contato | proposto, **como resposta a uma tentativa** |
| **reserva** | horário segurado | **não existe, e esta fase não cria** |
| **consulta marcada** | compromisso das duas partes | **não existe, e esta fase não cria** |

---

# 13 · Temporary Access e privacidade

**Constatação:** a **ADR-029 está aprovada e não implementada** — não há módulo nem migration. O modo intermediado, se exigir que o profissional veja contexto, **depende dela**.

| Definição | Proposta |
|---|---|
| **Recurso protegido** | a entrega final do caso — **exatamente o candidato que a ADR-029 já identificou** |
| **Emissor** | o **Concierge responsável**, no ato do despacho |
| **Destinatário** | o profissional escolhido |
| **Duração / escopo / revogação** | limitada, mínima, revogável — nos termos da própria ADR-029 |
| **Auditoria** | concessão e revogação append-only |
| **Dados visíveis** | o necessário para responder ou iniciar |
| **Nunca visíveis por padrão** | **a formulação do trade-off** · as prioridades ordenadas · a comparação · a existência dos outros dois |
| **Relação com consentimento** | **`DEPENDENTE DE PRIVACIDADE/JURÍDICO`** — a concessão pressupõe autorização dela, cuja forma não é decidida aqui |

> **Nenhum mecanismo paralelo de acesso do profissional deve ser inventado.** Existe ADR para isso; o caminho é implementá-la, não contorná-la.

---

# 14 · Alteração mediada

**Cinco atos distintos, que não podem compartilhar nome:**

| Ato | Quando | Quem executa | Onde |
|---|---|---|---|
| **Correção direta** | janela aberta | **a paciente** | Connection (`CORRECAO_ESCOLHA`) |
| **Alteração mediada** | janela fechada, antes do 1º atendimento | **Concierge, a pedido dela** | **Connection** |
| **Retorno à Mesa** | quando quiser rever | a paciente | Curadoria (a entrega persiste) |
| **Reabertura da Curadoria** | mesmo Perfil, nova busca | Curador | Curadoria |
| **Nova Curadoria** | Perfil revisado | Curador | Curadoria |

**Depois do primeiro atendimento**, a troca **é a capacidade "Troca de Profissional" da ADR-028 e pertence a Relationship** — não a Connection. Modelar ali seria criar disputa entre módulos.

**Modelagem:** `alteracao_solicitada` (**origem obrigatória: a paciente**) → `alteracao_executada` (Concierge). **Motivo registrado. Decisão anterior preservada** — o padrão de `CORRECAO_ESCOLHA` já garante que nada é sobrescrito. **Efeitos já produzidos** (uma aproximação despachada) exigem **encerramento explícito da tentativa pendente**, nunca abandono silencioso. **Nova Curadoria só se o Perfil mudar**, com a justificativa registrada quando não mudar.

> **Invariante: o Concierge nunca origina uma alteração.** Sem `alteracao_solicitada` da paciente, `alteracao_executada` é violação — não caso de borda.

---

# 15 · Indisponibilidade

**Evento de primeira classe**, com quatro campos que o tornam útil: **quem declarou** (profissional, Concierge relatando, ou paciente), **origem/evidência**, **momento**, **profissional relacionado** — mais **se é definitiva ou temporária** (`DEPENDENTE DE OPERAÇÃO`, ADR-043 Q-C6).

**Impacto no Connection:** **não é terminal.** Enquanto puder ser restaurada, o vínculo permanece. Só quando definitiva o caminho se abre para alternativas ou nova Curadoria.

**Comunicação à paciente:** por **uma pessoa**, assumindo a falha como de atualidade da informação — **nossa** —, com a decisão dela nomeada como válida.

**Preservação das alternativas:** garantida sem esforço — a entrega final não é alterada, e o *trigger* que exige o profissional dentro dela continua valendo.

> **Não existe "segunda colocada".** O sistema **não** seleciona substituto: seria criar ordem onde o Método a recusa, e a escolha é ato dela. **E a decisão dela nunca é marcada como errada** — o que mudou foi a condição do mundo.

---

# 16 · Connection → Relationship

| Alternativa | Avaliação |
|---|---|
| primeiro **contato** realizado | ⛔ contato não é relação; e no modo direto é declaração dela sobre uma ligação |
| primeiro atendimento **agendado** | ⛔ **não existe agenda**, e esta fase não a cria |
| **primeiro atendimento realizado** | ✅ **implementado, atômico, com `unique(connection_id)`, coberto por testes de integração** |
| profissional **aceitou acompanhar** | ⛔ não modelado; exigiria vínculo dele com o caso |
| paciente **declarou início da relação** | ⚠️ redundante — é o que o marco vigente já é |

> **Decisão: `PRIMEIRO_ATENDIMENTO_REALIZADO` permanece o único marco autorizado.** A evidência é suficiente e nenhuma alternativa acrescenta capacidade — todas acrescentariam apenas pressuposto.

**No intervalo entre primeiro contato e primeiro atendimento:** **Connection responde**, e o papel é o **Concierge**. Os estados necessários já existem (`CONTATO_DECLARADO` ou `EM_APROXIMACAO`). **Ficam bloqueadas:** qualquer afirmação de consulta marcada, agenda, aceite ou acompanhamento iniciado.

**Módulos não se sobrepõem** porque a autoridade de "quem responde" é `cases.responsible_role`, que é única — não inferência de estado de módulo.

---

# 17 · Compatibilidade e migração

| Situação | Estratégia |
|---|---|
| **Registros sem modo** | **estado legado** `LEGADO_AUTOSSERVICO` na leitura. **Sem backfill** — inferir o modo seria afirmar escolha que ninguém fez |
| **`CONTATO_INICIADO` já declarado** | **interpretação compatível**: significa contato direto declarado pela paciente. **É verdade histórica**, e por isso o valor pode ser lido no novo vocabulário |
| **Renomeio para `CONTATO_DECLARADO`** | **migração compatível**: aceitar ambos na leitura durante a transição; **nunca reescrever eventos passados** |
| **Casos encerrados / em Relationship** | **intocados.** Terminais permanecem terminais |
| **Decisões ainda corrigíveis** | inalteradas — a janela vigente continua valendo |
| **Triggers existentes** | `assert_connection_valid_transition` **precisa de alteração** para admitir `EM_APROXIMACAO` e o regresso; `assert_connection_professional_in_delivery` **permanece** |
| **Enum de eventos** | **aditivo** — nenhum valor removido |
| **Auditoria** | **imutável**; nada reescrito |
| **RLS** | aditiva (Concierge por vínculo); nenhuma política existente enfraquecida |
| **Consumidores / componentes** | `ConnectionProgressPanel` e `ConnectionChoicePanel` passam a tratar modo e novos estados; **comportamento legado preservado** |
| **Impossibilidade de inferência** | **declarada**: não há como saber se um Connection antigo teria sido intermediado. **Não se atribui contato intermediado a registros de autosserviço** |

---

# 18 · Alterações propostas

| Camada | Artefato atual | Alteração | Necessidade | Alternativa considerada | Risco | Compat. | Migration | Serviço | Teste |
|---|---|---|---|---|---|---|---|---|---|
| **Banco** | `connection_records` | + `contact_mode` (nullable) | §4 | tabela própria | baixo | aditiva | sim | connection | modo nulo é legado |
| **Banco** | `connection_records.status` | + `EM_APROXIMACAO` | §5.2 | derivar de evento | médio | aditiva | sim | connection | transições por modo |
| **Banco** | *trigger* de transição | admitir novo estado + regresso | §5.2 | manter rígido | **médio** | requer revisão | sim | — | regresso só sem efeito |
| **Banco** | — | `approach_attempts` | §3, §12 | colunas em connection | baixo | nova | sim | connection | N tentativas |
| **Banco** | — | `team_notifications` | §9 | reusar `patient_notifications` | **médio (privacidade)** | nova | sim | novo | estados |
| **Domínio** | `state-machine.ts` | espelhar novos estados | §5 | só banco | baixo | — | — | connection | paridade banco↔código |
| **Domínio** | `commands.ts` | comandos por modo | §4 | condicional na UI | baixo | — | — | connection | evento exclusivo recusado |
| **RLS** | `connection_*` | + Concierge **por vínculo** | §8 | por papel | **alto se por papel** | aditiva | sim | — | **negativo**: outro Concierge não lê |
| **Notificações** | — | evento + projeção | §9 | — | médio | nova | sim | novo | idempotência |
| **Rotas** | painel do paciente | escolha de modo | §4 | padrão silencioso | baixo | — | — | — | sem pré-seleção |
| **Interface** | `ConnectionProgressPanel` | frases por estado | §9 | — | baixo | — | — | — | frase proibida ausente |
| **Observabilidade** | — | projeção de inércia | §10 | — | baixo | nova | não | novo | sem sinal de paciente |

---

# 19 · Invariantes testáveis

**I1.** Só a paciente produz `decisao_registrada`, `CORRECAO_ESCOLHA`, `contato_direto_declarado`, `primeiro_contato_realizado` e `connection_encerrada`.
**I2.** `contact_mode` nunca é inferido, herdado ou preenchido por padrão.
**I3.** O Case sempre tem responsável válido; nenhuma transição o deixa nulo.
**I4.** Toda transferência tem ator, papel validado, **motivo** e auditoria.
**I5.** Concierge sem vínculo com o Case **não lê** a decisão. *(teste negativo obrigatório)*
**I6.** Nenhuma projeção derivada de persistência produz afirmação de notificação.
**I7.** Silêncio não encerra Connection — só declaração dela.
**I8.** Indisponibilidade **nunca** altera `professional_profile_id`.
**I9.** `alteracao_executada` sem `alteracao_solicitada` da paciente é recusada.
**I10.** `primeiro_contato_realizado` nunca é inferido de contato ou aproximação.
**I11.** Nenhuma transição apaga evento anterior; histórico é append-only.
**I12.** Nenhum estado do enum existe sem produtor autorizado. *(guarda contra flag sem semântica)*
**I13.** Evento exclusivo de um modo é recusado no outro.
**I14.** Nenhum sinal derivado de comportamento da paciente alimenta detecção de inércia.

---

# 20 · Plano de implementação

*Incrementos pequenos e reversíveis. **Sem estimativa de prazo.***

| # | Incremento | Depende de | Migration | Risco · rollback | **Passa a poder prometer** |
|---|---|---|---|---|---|
| **1** | `contact_mode` + estado legado | — | aditiva | baixo · coluna sem uso | *"você escolhe como quer começar"* |
| **2** | **Acesso mínimo do Concierge** (por vínculo) | 1 | RLS aditiva | baixo · revogar política | *"seu caso está com [nome]"* |
| **3** | Evento + projeção de notificação | 2 | nova tabela | médio · desligar projeção | *"avisamos [nome]"* · *"[nome] já viu"* |
| **4** | Transferência + caixa de trabalho | 3 | — | baixo | *"[nome] está cuidando disso"* |
| **5** | Contato direto acompanhado | 1, 2 | eventos aditivos | baixo | *"me diga se não conseguiu falar"* |
| **6** | Aproximação intermediada (+ Temporary Access) | 2, 5, **ADR-029** | `approach_attempts` | **alto — toca terceiros** · suspender modo | *"falamos com [nome] em [data]"* |
| **7** | Indisponibilidade | 6 | evento | médio | *"ele não está disponível — a falha é nossa"* |
| **8** | Alteração mediada | 7, **ADR-028** | evento + *trigger* | **alto — altera regra vigente** | *"é só me dizer que eu cuido disso"* |
| **9** | Fronteira com Relationship | 8 | — | baixo | — (confirma o já existente) |
| **10** | Observabilidade e inércia | 3, 4 | — | baixo | *"ainda não foi vista por uma pessoa"* |

**Ordem defensável:** 1–2 destravam o mínimo (o Concierge enxergar o que responde); 3–4 acabam com o abandono silencioso; 5 melhora o modelo vigente **sem tocar terceiros**; **6 é a primeira vez que a Aliviar age sobre alguém de fora, e por isso vem depois de tudo que a torna auditável.**

---

# 21 · Testes necessários

**Banco e triggers:** transições válidas e inválidas por modo · regresso permitido só sem efeito produzido · profissional fora dos três recusado · terminais imutáveis.
**RLS por papel — com negativos obrigatórios:** Concierge **do** Case lê; **outro** Concierge **não lê**; Curador mantém leitura após transferência; paciente lê o próprio; ninguém escreve em nome dela.
**Idempotência:** decisão duplicada; notificação duplicada; despacho repetido.
**Concorrência:** dois atores transicionando (padrão `55000` já usado).
**Notificações:** cinco estados; nenhuma frase antecipando estágio.
**Transferência:** motivo obrigatório; papel inválido recusado; auditoria gravada antes.
**Modos:** sem pré-seleção; evento exclusivo recusado no modo errado.
**Correção direta × alteração mediada:** janela; `alteracao_executada` sem solicitação **recusada**.
**Indisponibilidade:** não altera profissional; não seleciona substituto.
**Retorno à Curadoria:** entrega preservada.
**Relationship:** nascimento atômico; `unique(connection_id)`.
**Dados legados:** `CONTATO_INICIADO` antigo continua legível; **nenhum modo atribuído retroativamente**.
**Falhas:** canal inválido; despacho sem resposta; ausência de destinatário individual.
**Interface:** as frases proibidas **não aparecem em nenhum estado** — teste de guarda textual, no padrão já usado no projeto.

---

# 22 · Observabilidade

Observável: decisão sem responsável operacional · transferências · **acesso negado inesperado** · notificação não criada · não lida · ação parada · ausência de resposta · indisponibilidade · retorno à Curadoria · Connection sem desfecho · **divergência entre estado e evento** (a mais importante: significa que a projeção mentiu).

> **Nenhuma dessas é métrica de conversão.** Não se mede taxa de escolha, tempo até decidir, abandono da Mesa ou eficácia de tela. **A operação é o objeto da medição; a paciente nunca é.**

---

# 23 · Decisões e pendências

| Item | Classificação |
|---|---|
| Decisão, correção, terminais, transferência, Relationship | **REUTILIZAÇÃO DO DOMÍNIO VIGENTE** |
| `contact_mode`; `EM_APROXIMACAO`; `approach_attempts`; `team_notifications`; RLS do Concierge por vínculo; eventos de §6 | **EXTENSÃO COMPATÍVEL** |
| **NT-1** renomeio `CONTATO_INICIADO` → `CONTATO_DECLARADO` | **NOVA DECISÃO TÉCNICA** |
| **NT-2** pausa por segurança como **evento, não status** | **NOVA DECISÃO TÉCNICA** (precedente ADR-028) |
| **NT-3** regresso `EM_APROXIMACAO → DECISAO_REGISTRADA` | **NOVA DECISÃO TÉCNICA** — altera *trigger* vigente |
| **NT-4** caixa de trabalho como **projeção**, nunca segunda atribuição | **NOVA DECISÃO TÉCNICA** |
| Canal, prazo, escalonamento, horário, definitiva × temporária | **DEPENDENTE DE OPERAÇÃO** |
| Consentimento do modo intermediado; dados ao profissional; Temporary Access; leitura da formulação; retenção | **DEPENDENTE DE PRIVACIDADE/JURÍDICO** |
| Urgência e piora clínica | **DEPENDENTE DE CLÍNICA** |
| Implementação da ADR-029; capacidade *Troca de Profissional* da ADR-028 | **BLOQUEADO** — precondição dos incrementos 6 e 8 |

**Nenhuma questão clínica ou jurídica é encerrada por esta arquitetura.**

---

# 24 · Critério de conclusão

| # | Pergunta | Onde |
|---|---|---|
| 1 | onde vive cada novo fato | §3 |
| 2 | quais estados ampliam os atuais | §5.2 — **um só novo**; §5.3 explica os que não viram status |
| 3 | como os dois modos são representados | §4 |
| 4 | como o Concierge obtém acesso | §8 — **por vínculo, nunca por papel** |
| 5 | como a notificação se torna verificável | §9 |
| 6 | como a inércia é detectada | §10 — instrumento agora, regra depois |
| 7 | como a indisponibilidade retorna ao fluxo | §15 |
| 8 | como ocorre a alteração mediada | §14 |
| 9 | onde Connection termina | §16 |
| 10 | onde Relationship começa | §16 |
| 11 | como dados legados permanecem verdadeiros | §17 — **sem backfill** |
| 12 | quais migrations e políticas | §18 |
| 13 | quais testes protegem as invariantes | §19, §21 |
| 14 | em quais incrementos implementar | §20 |

---

> **A menor evolução coerente cabe em três frases: o Concierge precisa enxergar o que responde; a decisão precisa produzir um aviso que alguém receba; e a Aliviar precisa de um lugar para registrar que falou com alguém de fora. Todo o resto desta modelagem existe para que essas três coisas não se tornem uma quarta — a de inventar agenda que não temos.**
