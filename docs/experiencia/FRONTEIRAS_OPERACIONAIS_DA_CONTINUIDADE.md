# Fronteiras Operacionais da Continuidade — Fase 9C.1

> **Resolve:** `Q-C8` (quando o Concierge assume) e `Q-C4` (canais e prazos) da [ADR-043](../DECISIONS.md). **Delimita** `Q-C9` (urgência).
> **Método:** investigação do código, migrations, políticas e configuração — **não** leitura de documentos. Onde a operação não sustenta uma promessa, a promessa fica bloqueada.
> **Não faz:** aplicar patches · alterar ADRs · implementar código · criar migration · alterar RLS · criar protocolo clínico · inventar canal, horário ou prazo.
> **Data:** 2026-08-01

---

# 0 · O achado que reenquadra a fase

A Fase 9B concluiu que *"a coluna do Concierge está vazia — o papel mais presente nas Fases 7 a 9 é o único sem nenhuma autoridade operacional"*. **A investigação mostrou que isso é parcialmente falso, e a parte falsa é a mais importante.**

**O mecanismo de responsabilidade existe, é auditado, e é bom.** `curadoria.cases` tem `responsible_id` e `responsible_role`, com `concierge` entre os três níveis; existe `transfer_case_responsibility()` com auditoria obrigatória e motivo; existe `case_responsibility_changes`; e a missão do papel está escrita no código: *"Acompanha a escolha do médico, o agendamento e os retornos até o encerramento."*

**A consequência disso é grande: não existe intervalo sem responsável.** O Case sempre tem dono, porque responsabilidade é **coluna**, não inferência. A pergunta Q-C8 supunha um vazio que o domínio já não tem.

**E o que falta é preciso, não difuso:** o Concierge **não aparece em nenhuma política RLS de `connection_records` ou `connection_events`**. Ele pode ser o responsável pelo Case e, ainda assim, **não conseguir ler a decisão da paciente**. Não é lacuna de papel — é lacuna de visibilidade, e por isso é implementação, não decisão.

---

# 1 · Estado real da operação

| # | Item | Estado | Evidência |
|---|---|---|---|
| 1 | **Papel Concierge** | **IMPLEMENTADO** | `insert into curadoria.roles (slug,name) values ('concierge','Concierge')` — `20260724054819_crm_operational_foundation.sql:1` |
| 2 | **Missão do papel, escrita** | **IMPLEMENTADO** | `RESPONSIBLE_ROLE_MISSIONS.concierge` = *"Acompanha a escolha do médico, o agendamento e os retornos até o encerramento"* — `src/modules/cases/responsibility.ts` |
| 3 | **Atribuição de responsabilidade do Case** | **IMPLEMENTADO** | `cases.responsible_id`, `cases.responsible_role check in ('atendente','curador_medico','concierge')` — `20260724192549_case_responsavel_fase1.sql` |
| 4 | **Transferência auditada** | **IMPLEMENTADO** | `transfer_case_responsibility(_case_id,_new_responsible_id,_new_role,_reason)`; ator vem de `auth.uid()`, **motivo obrigatório**, valida papel real do destinatário, idempotente, grava auditoria antes de mover — `20260724193459_case_transferencia_auditada_fase3b.sql:30-132` |
| 5 | **Histórico de troca de responsável** | **IMPLEMENTADO** | `case_responsibility_changes` — `20260724192608_case_auditoria_troca_responsavel_fase2.sql` |
| 6 | **Auto-atribuição (assumir caso disponível)** | **IMPLEMENTADO (para Curador)** | `_is_self_claim` e `cases_select_disponivel_para_curador` — `20260725230458_curador_ve_paciente_e_assume_case_disponivel.sql:33,64,87` |
| 7 | **Fila / caixa de trabalho** | **PARCIALMENTE IMPLEMENTADO** | `crm_tasks` (*"Tarefas e próximas ações do Concierge"*) com `assigned_to`, `status`, `priority`, `due_at` — `20260724054907_…tables.sql:100`. **Mas é ancorada em `crm_contacts`, não em `connection_records`**: não há fila alimentada por decisão da paciente |
| 8 | **Concierge no CRM** | **IMPLEMENTADO** | `crm_cases.responsible_concierge_id` + RLS própria — `20260724054907:54`, `20260724054932_…rls.sql:28-30` |
| 9 | **Notificação à paciente** | **PARCIALMENTE IMPLEMENTADO** | `patient_notifications` existe, com trigger que protege o conteúdo; **`insert` é `administrador` apenas** (`patient_notifications_insert_admin_only`) — `20260723164543_…stage3` |
| 10 | **Notificação à equipe** | **INEXISTENTE** | nenhuma tabela, fila, e-mail, webhook ou serviço. `registerPatientDecision` insere e chama `revalidatePath` das rotas da paciente — `src/modules/curadoria/repository.ts`, `actions.ts` |
| 11 | **Registro de leitura (por pessoa da equipe)** | **INEXISTENTE** | nenhuma coluna `read_at` para papéis internos em nenhum fluxo de decisão |
| 12 | **Registro de assunção** | **IMPLEMENTADO** | é a própria transferência (item 4) + auditoria (item 5) — **existe e é verificável** |
| 13 | **Canal WhatsApp** | **IMPLEMENTADO** | número oficial aprovado pelo responsável do projeto (MISSÃO 205): `ALIVIAR_WHATSAPP = "5511979037133"`, fonte única, com tópicos contextualizados — `src/components/curadoria/whatsapp-contact.tsx` |
| 14 | **Telefone de voz** | **INEXISTENTE** | nenhuma referência a canal de voz em código ou configuração |
| 15 | **E-mail operacional** | **NÃO VERIFICADO** | não há serviço de envio no código; a existência de caixa fora da plataforma não é verificável aqui |
| 16 | **Horário de operação** | **INEXISTENTE** | busca por `business_hours`/`horario_operacao`/`expediente` em `src/` e `docs/` — zero ocorrências |
| 17 | **Escalonamento** | **INEXISTENTE** | nenhuma regra, gatilho, alerta ou temporizador |
| 18 | **Acompanhamento após a decisão** | **INEXISTENTE** | nenhum mecanismo observa `connection_records` parados |
| 19 | **Connection** | **IMPLEMENTADO** (ADR-027) | `connection_records`/`connection_events`, 4 estados, transições por *trigger* |
| 20 | **Relationship** | **IMPLEMENTADO, capacidades pendentes** (ADR-028) | `relationship_records` (`ATIVO`/`ENCERRADO`), `relationship_events` — `20260723164933:103-118`; seis capacidades pendentes, entre elas **Troca de Profissional** |
| 21 | **Contato direto da paciente** | **IMPLEMENTADO** | `CONTATO_INICIADO` por declaração dela — `commands.ts` (`registerContactIntent`) |
| 22 | **Contato intermediado pela Aliviar** | **INEXISTENTE** | nenhum evento, canal ou registro |
| 23 | **Visibilidade do Concierge sobre a Connection** | **INEXISTENTE — e é a lacuna crítica** | zero ocorrências de `concierge` em `20260723164933_curadoria_stage5_connection_relationship.sql`. As policies cobrem paciente, administrador e **curador do caso**; **o Concierge não está em nenhuma** |

---

# 2 · Distinções obrigatórias

Dez termos, dez significados. **Nenhum implica o seguinte.**

| Termo | Significado na Aliviar | Verificável hoje? |
|---|---|---|
| **Estar visível** | o dado é legível por RLS a quem tem o papel | ✅ — mas **não** para o Concierge (item 23) |
| **Estar alcançável** | existe um caminho pelo qual a paciente chega a uma pessoa | ✅ via WhatsApp |
| **Receber uma solicitação** | ela pediu algo, e o pedido chegou a um destino | ⛔ não há destino registrado |
| **Ser notificado** | uma mensagem foi **despachada** a uma pessoa | ⛔ inexistente para a equipe |
| **Receber uma atribuição** | o Case passou a ter aquela pessoa como responsável | ✅ `transfer_case_responsibility` |
| **Visualizar uma atribuição** | a pessoa abriu e viu | ⛔ não registrado |
| **Assumir responsabilidade** | a pessoa passa a dever aquilo | ✅ **é a atribuição**, com motivo e auditoria |
| **Iniciar atendimento** | a pessoa começou a trabalhar no caso | ⛔ não registrado |
| **Responder** | a pessoa falou com a paciente | ⛔ não registrado (WhatsApp é externo) |
| **Iniciar acompanhamento** | trabalho contínuo, com dono e continuidade | ⛔ inexistente |

**A distinção que mais importa:** **receber uma atribuição e assumir responsabilidade são, neste domínio, o mesmo evento** — porque a transferência exige ator autenticado, papel real do destinatário e **motivo escrito**. Não é um empurrão de tarefa: é um ato deliberado de alguém. **Visualizar, porém, é outra coisa, e não é registrada.**

---

# 3 · Q-C8 — Quando o Concierge assume

## 3.1 · As cinco alternativas

| | **A — confirmação** | **B — registro** | **C — atribuição** | **D — aceite humano** | **E — 1º contato** |
|---|---|---|---|---|---|
| **Verificabilidade** | baixa: ato de UI sem persistência garantida | **alta**: fato do banco | **alta**: função auditada | alta, **mas indistinguível de C** aqui | baixa: contato é externo |
| **Intervalo sem responsável** | — | — | do registro até a transferência | idem | **longo e perigoso** |
| **Honestidade** | *"alguém cuida"* — falso, ninguém sabe | *"está registrado"* — verdadeiro | *"[nome] é responsável"* — verdadeiro | idem | *"[nome] falou com você"* — só depois |
| **Risco operacional** | alto: promessa sem lastro | baixo | baixo | baixo | **alto: caso órfão** |
| **Fora do horário** | pior: promete vigilância | **neutro** | depende de gente | idem | pior |
| **Falha de notificação** | invisível | **irrelevante — não depende de notificação** | pode atrasar | idem | invisível |
| **Escalonamento** | impossível | **possível: dá marco inicial** | possível | possível | impossível |
| **Impacto na paciente** | ilusão de cuidado | verdade modesta | verdade concreta, com nome | idem | abandono no intervalo |
| **ADR-027/028/043** | conflita: cria estado não persistido | compatível | **compatível e já implementado** | compatível | conflita com ADR-043 §4 |

## 3.2 · A decisão — dois eventos, nenhum intervalo

> **DECISÃO D-C1: a responsabilidade nasce em dois momentos distintos, e nunca há vazio entre eles.**
>
> **Responsabilidade organizacional da Aliviar → Alternativa B (`decisao_registrada`).** É fato do banco, verificável, independente de notificação, e dá o marco inicial de qualquer escalonamento futuro.
>
> **Responsabilidade pessoal do Concierge → Alternativa C/D (a transferência).** No domínio da Aliviar, **C e D são o mesmo evento**: `transfer_case_responsibility` exige ator autenticado, valida o papel real do destinatário e **exige motivo escrito**. Não é fila empurrando trabalho; é uma pessoa assumindo, com registro.
>
> **Entre os dois marcos, o responsável é o Curador do caso** — não por convenção, **mas porque `cases.responsible_role` continua dizendo `curador_medico` até a transferência acontecer.** O Case nunca fica sem dono.

**Fundamento:** a alternativa E foi rejeitada por criar caso órfão; a A, por afirmar responsabilidade que nada sustenta. B e C não competem — **respondem a perguntas diferentes**: *"a Aliviar deve algo?"* e *"quem, com nome, deve?"*.

**Autoridade:** arquitetura implementada (itens 3, 4, 5) + ADR-043 §4.

## 3.3 · O que falta para D-C1 operar

**Bloqueio B-1 — o Concierge não lê a Connection** (item 23). Pode ser responsável pelo Case e não enxergar a decisão. **É implementação de RLS, não decisão** — e sem ela a transferência é um gesto vazio.

**Bloqueio B-2 — nada avisa que há decisão para atribuir** (item 10). A transferência é manual e depende de alguém olhar. **Enquanto isso, o Curador é o responsável de fato**, e essa é a razão pela qual a responsabilidade organizacional precisa nascer antes: ela é o que impede o intervalo de virar abandono.

---

# 4 · Responsabilidade organizacional × pessoal

## 4.1 · O que a Aliviar deve, a partir de `decisao_registrada`

Guardar a decisão íntegra · atribuir o Case a uma pessoa Concierge · não deixar a paciente descobrir sozinha uma indisponibilidade (ADR-043 §8) · manter alguém alcançável · **dizer a verdade sobre o estado real**, inclusive quando a verdade é "ninguém viu ainda".

## 4.2 · O que a pessoa Concierge deve, a partir da transferência

Conhecer o caso sem pedir que ela reconte a história · conduzir (Modo A) ou acompanhar (Modo B) a aproximação · registrar o que aconteceu · comunicar indisponibilidade **antes que ela descubra** · devolver ao Curador o que for do caso · **nunca decidir por ela**.

## 4.3 · As sete perguntas

| Pergunta | Resposta | Estado |
|---|---|---|
| Quem responde **antes** da atribuição individual? | **o Curador do caso** — `cases.responsible_role` ainda diz `curador_medico` | ✅ resolvido |
| Quem percebe **atribuições não assumidas**? | ⛔ **ninguém** — não há detecção de caso parado (itens 17, 18) | **B-3** |
| Quem atua se o Concierge está indisponível? | ⛔ **não definido** — não há cobertura, plantão ou substituto | **B-4** |
| Quem pode **reatribuir**? | administrador, e o próprio responsável, via a mesma função auditada | ✅ resolvido |
| Quem **audita casos parados**? | ⛔ **ninguém** — não há relatório, alerta ou painel | **B-3** |
| Quando o **Curador continua participante**? | **sempre**, para tudo que seja do caso, dos três ou da informação (A_DECISAO §3, §7) | ✅ resolvido |
| Quando ele deixa de ser **responsável primário**? | **na transferência**, e só nela — não na decisão, não na entrega | ✅ resolvido |

> **A expressão "a equipe cuidará" fica proibida em qualquer superfície.** Todo estado nomeia um papel, e o papel tem nome de pessoa.

---

# 5 · Q-C4 — Canais reais

| Canal | Quem inicia | Quem recebe | Registro | Entrega | Leitura | Sensíveis | Monitorado | Horário | Contingência | Limitações |
|---|---|---|---|---|---|---|---|---|---|---|
| **Plataforma** | ambos | conforme RLS | ✅ banco | ✅ implícita | ⛔ | ✅ | ⛔ nada observa | 24/7 (software) | — | **não notifica ninguém**; só quem entra vê |
| **WhatsApp** (oficial, aprovado) | **a paciente** | número único da Aliviar | ⛔ fora do sistema | ⛔ | ⛔ | ⚠️ **não decidido** | ⛔ não verificável | ⛔ inexistente | ⛔ | o próprio componente proíbe **prometer resposta imediata** |
| **`patient_notifications`** | **administrador** | a paciente | ✅ banco | ✅ | ⛔ | ✅ | — | 24/7 | — | **é para ela, não para a equipe**; insert admin-only |
| **Telefone de voz** | — | — | — | — | — | — | — | — | — | **INEXISTENTE** |
| **E-mail** | — | — | — | — | — | — | — | — | — | **NÃO VERIFICADO** — sem serviço de envio no código |

**Três conclusões:**

**O único canal humano da paciente para a Aliviar é o WhatsApp** — existe, é oficial e foi aprovado. **É iniciado por ela**, nunca por nós, e não tem registro no sistema, entrega verificável nem monitoramento comprovável.

**Não existe canal da Aliviar para a equipe.** Nada notifica ninguém sobre nada (itens 10, 11).

**`patient_notifications` é o único canal da Aliviar para a paciente — e depende de um administrador.** Não é automatizável hoje sem decisão sobre quem escreve.

> **DECISÃO D-C2: nenhum canal novo é criado, escolhido ou pressuposto nesta fase.** A continuidade acontece **na plataforma** (registro e estado visível) e **no WhatsApp** (conversa iniciada por ela). Qualquer promessa que exija a Aliviar iniciar contato com a paciente está **bloqueada** até existir canal com dono e monitoramento (**B-5**).

---

# 6 · Q-C4 — Prazos

**Investigação:** não existe horário de operação em lugar nenhum (item 16); não existe escalonamento (17); não existe medição de nada (11, 18); não existe monitoramento de canal (§5).

| Compromisso | Responsável | Evento inicial | Evento final | Medição | Capacidade | Frase possível |
|---|---|---|---|---|---|---|
| **atribuir** | administrador / Concierge | `decisao_registrada` | transferência | ✅ possível (dois marcos existem) | ⛔ sem alerta, depende de olhar | *"seu caso está com [nome]"* — **só depois de atribuído** |
| **visualizar** | Concierge | atribuição | — | ⛔ não registrado | ⛔ | **nenhuma** |
| **primeiro contato** | Concierge | atribuição | — | ⛔ externo | ⛔ | **nenhuma** |
| **consultar o profissional** | Concierge | Modo A | — | ⛔ inexistente | ⛔ | **nenhuma** |
| **atualizar a paciente** | Concierge | qualquer | — | ⛔ | ⛔ | **nenhuma** |
| **ausência de resposta** | — | — | — | ⛔ | ⛔ | **nenhuma** |
| **indisponibilidade** | — | — | — | ⛔ | ⛔ | **nenhuma** |

> **DECISÃO D-C3: nenhum prazo é assumido. Nenhum SLA é inventado.**
> **A linguagem da continuidade é não temporal e factual: nomeia *quem* e *o que já aconteceu*, nunca *quando*.**
>
> **Capacidade necessária para autorizar prazo futuro** — os quatro, cumulativos: (1) horário de operação declarado; (2) notificação verificável à equipe; (3) registro de visualização ou assunção com marco temporal; (4) detecção de caso parado com escalonamento nominal. **Enquanto os quatro não existirem, prazo prometido é promessa falsa.**

---

# 7 · Fora do horário

**Não existe horário oficial** (item 16). **Isso é, em si, a resposta** — e a honestidade exigida é maior, não menor.

**O que a paciente pode saber, fora e dentro do horário indistintamente:** o que foi **registrado** (verdadeiro sempre) · o que foi **despachado** (hoje: nada) · **que nenhuma pessoa viu ainda**, quando for o caso · e o que fazer diante de piora clínica (§12).

**Proibido:** dizer que alguém foi avisado quando só um evento foi criado (ADR-043 §9) · sugerir vigilância contínua, que não existe · **anunciar horário de retorno** — porque não há horário oficial a anunciar. Enquanto não houver, **não se diz quando a operação volta**; diz-se o que está guardado e por onde ela alcança uma pessoa.

---

# 8 · Falhas operacionais

| Falha | Quem detecta | Como | Escalonamento | Recuperação | Ela vê | **Não** se pode afirmar | Registro necessário |
|---|---|---|---|---|---|---|---|
| **decisão sem atribuição** | ⛔ ninguém | — | ⛔ **B-3** | administrador, ao olhar | decisão registrada | *"alguém está cuidando"* | marco de decisão sem transferência |
| **notificação não despachada** | ⛔ | — | ⛔ | — | nada muda | *"avisamos [nome]"* | evento de despacho |
| **despachada, não recebida** | ⛔ | — | ⛔ | — | nada muda | *"chegou a [nome]"* | acuse de entrega |
| **atribuição não visualizada** | ⛔ | — | ⛔ **B-3** | administrador | *"está com [nome]"* — **verdade** | *"[nome] já viu"* | marco de visualização |
| **Concierge indisponível** | ⛔ **B-4** | — | ⛔ | administrador reatribui (existe) | nada muda | *"[nome] responde hoje"* | ausência/cobertura |
| **paciente não responde** | Concierge, ao olhar | manual | ⛔ | Concierge | nada — **e é correto**: silêncio dela é direito (N4) | *"desistiu"* · *"encerrado"* | **nada — não se registra silêncio dela** |
| **profissional não responde** | Concierge (Modo A) | manual | ⛔ | Concierge | estado real, quando houver | *"ele recebeu"* · *"ele recusou"* | tentativa e resultado |
| **canal inválido** | quem tenta | falha do envio | ⛔ | Concierge | ⛔ hoje nada | *"não conseguimos falar com você"* sem tentar de novo | falha de canal |
| **contato interrompido** | Concierge | manual | ⛔ | Concierge | estado real | *"a conexão fracassou"* | evento de interrupção |
| **caso sem atualização** | ⛔ **B-3** | — | ⛔ | administrador | nada | *"está em andamento"* | último movimento |
| **indisponibilidade descoberta** | hoje **a paciente, sozinha** | ligando | ⛔ | Concierge (após ADR-043) | ⛔ hoje nada | *"avisaremos se algo mudar"* | evento de indisponibilidade |

**O padrão é uniforme e precisa ser dito sem suavização: nenhuma falha desta tabela é detectada por mecanismo. Todas dependem de alguém olhar.** É a lacuna **B-3**, e ela é a diferença entre um processo acompanhado e um processo que parece acompanhado.

---

# 9 · Contato direto acompanhado (Modo B)

**Hoje este modo é o comportamento padrão sem acompanhamento nenhum.** O mínimo que o torna realmente acompanhado:

**Como a Aliviar sabe que ela escolheu este modo** → **registro explícito do modo** (ADR-043 §12). Hoje inexistente: não há campo, e a ausência de escolha não é escolha.

**Que informação ela recebe para iniciar** → o nome, como falar com ele, e **a data da informação** (*"ele declarou, em [data], que atende de manhã"*). Nunca "ele está te esperando".

**Ela precisa declarar que iniciou contato?** **Pode, e é útil — mas não pode ser a única defesa contra abandono.** Hoje é: `CONTATO_INICIADO` só existe se ela declarar, e nada acontece se ela não declarar. **O acompanhamento real exige que a Aliviar pergunte, e não que ela reporte.**

**Como acompanhar sem vigiar** → **perguntando à pessoa, nunca observando comportamento.** Nenhum sinal derivado de uso, tempo ou visita — **N4** e **P5** valem aqui integralmente. Acompanhar é uma pessoa perguntando *"como foi?"*; vigiar é o sistema inferindo.

**Quando perguntar** → decisão de operação (**B-6**), e depende de horário e capacidade (§6). **Sem prazo, a regra emitível é apenas: uma vez, por uma pessoa, e não de novo se ela não quiser.**

**Como registrar indisponibilidade** → evento próprio (ADR-043 §12), inexistente hoje.

**Como evitar que silêncio vire sucesso** → **regra normativa: silêncio nunca é desfecho.** Um Case sem movimento não pode ser tratado, contado ou exibido como conexão bem-sucedida. Hoje **não há nada que impeça isso**, porque nada observa (**B-3**).

**Quando volta à Curadoria** → quando o motivo tocar o Perfil, por decisão do Curador (ADR-043 §4).

**Quando o acompanhamento pode ser encerrado** → nos terminais existentes (`PRIMEIRO_ATENDIMENTO_REALIZADO`, `ENCERRADO_SEM_RELACIONAMENTO`), **sempre por declaração dela** — **nunca por decurso de tempo.**

---

# 10 · Aproximação intermediada (Modo A)

**Nada deste modo existe hoje** (item 22). O mínimo operacional:

**Autorização** → explícita dela, com registro do modo. **Se integra o ato de confirmação ou exige manifestação separada permanece em aberto** (ADR-043 §3, Q-C1) — questão de consentimento, não de design.

**Responsável por iniciar** → **a pessoa Concierge atribuída ao Case**, nunca "a equipe", nunca o sistema.

**Canal** → **não existe canal da Aliviar para o profissional** (§5). É o bloqueio material do Modo A (**B-5**).

**Dados transmitidos** → **o mínimo para responder ou iniciar** (ADR-043 §11). **Nunca a formulação do trade-off.** Se identificar a paciente é necessário nesta etapa permanece aberto — e a alternativa de consultar disponibilidade **sem identificá-la** merece exame prioritário.

**Registro do envio** → evento de despacho, com quem, quando e por qual canal. **É o que fecha a correção direta no Modo A** (ADR-043 §6).

**Resposta esperada** → *"pode receber contato"* / *"não posso agora"* / silêncio. **Nunca "aceito", "confirmado" ou "reservado"** — não existe reserva, e nada aqui a cria.

**Atualização à paciente** → **estado real, sem prazo** (D-C3).

**Ausência de resposta** → não é indisponibilidade. **O que separa as duas exige decisão** (ADR-043 Q-C6).

**Recusa** → é fato do profissional, **nunca erro dela**; comunicada por pessoa, com a escolha nomeada como válida.

**Transição para Relationship** → §11. **E nada disso pressupõe reserva, consulta marcada ou aceite.**

---

# 11 · A passagem entre Connection e Relationship

**Reconciliação.** **ADR-027**: Connection é pontual — decisão e primeiro contato. **ADR-028**: Relationship é longitudinal, nasce do primeiro atendimento, com **Troca de Profissional** entre as seis capacidades pendentes. **ADR-043**: a continuidade operacional entre as duas é responsabilidade da Aliviar — **e é exatamente o vão que a ADR-029 já reconhece como fronteira do Domínio 4.**

**Connection começa** em `decisao_registrada`; **termina** em `PRIMEIRO_ATENDIMENTO_REALIZADO` (nascimento do Relationship, atômico — `confirmFirstAppointmentAndBirthRelationship`, ADR-028) ou em `ENCERRADO_SEM_RELACIONAMENTO` (termina **sem** Relationship).

**O Concierge participa de ambos** — é o único papel que atravessa a fronteira, e é isso que a torna uma passagem em vez de um degrau.

**Quando o contato nunca se concretiza:** o desfecho é `ENCERRADO_SEM_RELACIONAMENTO`, **declarado por ela**. **Nunca por decurso de tempo, nunca pelo sistema.**

**Onde vive a "Troca de Profissional":** **depende do momento.** Antes do primeiro atendimento é `CORRECAO_ESCOLHA`, e vive em **Connection**. Depois, é a capacidade pendente de **Relationship** (ADR-028). **São coisas diferentes com nome parecido, e confundi-las faria dois módulos disputarem o mesmo ato.**

**Como evitar que dois módulos se achem não responsáveis:** **a autoridade é `cases.responsible_role`**, que é coluna única e auditada — não inferência de estado de módulo. Enquanto o Case tiver dono, alguém responde, independentemente de onde o registro vive.

| Estado | Módulo | Papel | Entrada | Saída | Falhas |
|---|---|---|---|---|---|
| decisão registrada | Connection | **Curador** (até transferir) | `decisao_registrada` | transferência | sem atribuição (**B-3**) |
| atribuído ao Concierge | Case | **Concierge** | transferência auditada | aproximação | não visualizada (**B-3**); indisponível (**B-4**) |
| aproximação (A) | Connection *(a criar)* | **Concierge** | autorização | resposta ou indisponibilidade | sem canal (**B-5**) |
| contato direto (B) | Connection | **Concierge** acompanha | escolha do modo | declaração dela | silêncio virar sucesso (**B-3**) |
| contato declarado | Connection | **Concierge** | `CONTATO_INICIADO` | 1º atendimento ou encerramento | contato interrompido |
| **1º atendimento** | Connection → **Relationship** | **Concierge** | declaração dela | nascimento atômico | — |
| encerrado sem relação | Connection (terminal) | **Concierge** | declaração dela | — | encerramento por tempo — **proibido** |
| relação ativa | Relationship | **Concierge** | nascimento | encerramento | capacidades pendentes (ADR-028) |

---

# 12 · Q-C9 — Urgência e piora clínica

## 12.1 · O que já tem autoridade

A Curadoria **não atende urgência** — declaração institucional de escopo · a arquitetura contemplativa **recua** · o processo **pode ser pausado** · **a decisão registrada não se perde** · a experiência **não pode criar impressão de atendimento emergencial**.

## 12.2 · Inventário

| Item | Estado |
|---|---|
| Textos aprovados sobre urgência | **AUSENTE** |
| Canal humano oficial | **EXISTENTE** — WhatsApp (item 13). ⚠️ **iniciado por ela, sem monitoramento comprovável, sem horário** |
| Telefone de voz | **AUSENTE** |
| Responsável clínico | **AUSENTE** |
| Política fora do horário | **AUSENTE** — e não há horário |
| Protocolo | **AUSENTE** |
| Registro de acionamento | **AUSENTE** |
| Sinais, triagem, destino assistencial | **DEPENDENTE DE VALIDAÇÃO CLÍNICA** |

**Nada foi inventado:** nenhum sinal clínico, nenhuma triagem, nenhum destino, nenhum número novo, nenhuma instrução médica, nenhum prazo.

## 12.3 · A tensão que precisa ser dita

**O único canal humano existente não é adequado a urgência** — é iniciado por ela, não tem monitoramento verificável e não tem horário. **Oferecê-lo como caminho de urgência sem essas garantias criaria a impressão de atendimento emergencial que a própria regra proíbe.**

> **Q-C9 permanece BLOQUEADA para qualquer texto dirigido à paciente sobre o que fazer em urgência.** O bloqueio é explícito e a autoridade ausente é a **responsabilidade técnica clínica**.

---

# 13 · Decisão mínima de segurança

Existe um mínimo **não clínico**, aplicável à documentação **agora**:

**AUTORIZADO:** informar que **a Curadoria não é serviço de urgência** (escopo institucional) · **interromper promessas de resposta contemplativa** quando houver indicação de piora — nada de "no seu tempo" nesse contexto · **preservar o estado do processo**, sem confirmar, reverter ou apagar · **impedir que qualquer mensagem automática sugira acompanhamento emergencial** · **encaminhar a validação ao responsável clínico**.

**BLOQUEADO até aprovação clínica:** qualquer instrução sobre **o que fazer**, **onde ir** ou **a quem recorrer** · qualquer indicação de canal como adequado a urgência, **incluindo o WhatsApp** (§12.3) · qualquer expectativa de tempo de resposta.

> **Regra de fronteira: a Aliviar pode dizer o que não é. Não pode dizer o que a pessoa deve fazer.**

---

# 14 · Promessas autorizáveis por estado

| Estado | Frase | Classificação |
|---|---|---|
| decisão registrada | *"sua decisão está registrada"* | **AUTORIZADA AGORA** |
| decisão registrada | *"seus três caminhos continuam aqui"* | **AUTORIZADA AGORA** |
| decisão registrada | *"enquanto você não tiver falado com [nome], pode trocar aqui mesmo"* | **AUTORIZADA AGORA** — *trigger* garante |
| solicitação criada | *"seu pedido está registrado"* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** — não há destino (B-5) |
| caso atribuído | *"seu caso está com [nome]"* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** — mecanismo existe; falta o Concierge ler a Connection (B-1) |
| **pessoa ainda não assumiu** | *"sua decisão está guardada; ainda não foi vista por uma pessoa"* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** — exige marco de visualização (B-3) |
| Concierge assumiu | *"[nome] está cuidando disso com você"* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** — B-1 |
| contato **será** iniciado | *"[nome] vai falar com [profissional]"* | **DEPENDE DE OPERAÇÃO** — sem canal (B-5) |
| contato **foi** iniciado | *"falamos com [profissional] em [data]"* | **DEPENDE DE OPERAÇÃO** — B-5 |
| profissional recebeu | *"ele recebeu"* | **PROIBIDA** — inverificável, fora do nosso alcance |
| profissional respondeu | *"ele respondeu que pode receber você"* | **DEPENDE DE OPERAÇÃO** |
| indisponibilidade | *"ele não está disponível — a informação que mostramos era de [data]; a falha é nossa"* | **DEPENDE DE OPERAÇÃO** — ninguém descobre (B-5) |
| **fora do horário** | *"nossa equipe volta às [hora]"* | **PROIBIDA** — não há horário oficial |
| fora do horário | *"está guardado; ainda não foi visto por uma pessoa"* | **AUTORIZADA APÓS IMPLEMENTAÇÃO** — B-3 |
| pausa por segurança | *"a Curadoria não atende urgência"* | **AUTORIZADA AGORA** |
| pausa por segurança | *"procure [serviço/número]"* | **DEPENDE DE VALIDAÇÃO CLÍNICA** |
| qualquer | *"o Curador foi avisado"* | **PROIBIDA** — não há aviso (item 10) |
| qualquer | *"está tudo certo"* · *"seu profissional está garantido"* · *"sua consulta está reservada"* | **PROIBIDA** — não existe reserva |
| qualquer | *"responderemos em [prazo]"* | **PROIBIDA** — D-C3 |
| qualquer | *"a equipe está acompanhando"* | **PROIBIDA** — sem papel, sem mecanismo, sem evento |

**Nenhuma frase antecipa evento posterior.** Autorizadas agora: **5**. Após implementação: **5**. Dependem de operação: **4**. De validação clínica: **1**. Proibidas: **7**.

---

# 15 · Decisões e bloqueios

## 15.1 · Decisões

| # | Decisão | Fundamento | Autoridade | Impacto | Documentos | Implementação exigida |
|---|---|---|---|---|---|---|
| **D-C1** | Dois marcos: responsabilidade **organizacional** em `decisao_registrada`; **pessoal** na transferência auditada. Entre eles, responde o **Curador** | itens 3–5; não há intervalo sem dono | arquitetura implementada + ADR-043 §4 | resolve Q-C8 | A_SALA, A_DECISAO, ADR-043 | **B-1** (RLS do Concierge) |
| **D-C2** | Nenhum canal novo. Continuidade na **plataforma** + **WhatsApp** iniciado por ela | §5 | constatação | limita toda promessa de contato ativo | A_SALA §11 | **B-5** |
| **D-C3** | **Nenhum prazo assumido.** Linguagem não temporal: nomeia *quem*, nunca *quando* | §6 | constatação | resolve a parte "prazos" de Q-C4 | A_SALA §8.2, §11 | quatro capacidades de §6 |
| **D-C4** | **Silêncio nunca é desfecho.** Case sem movimento não é conexão bem-sucedida; encerramento só por declaração dela | §9 | consequência de ADR-043 §2 | protege contra abandono contabilizado como êxito | A_SALA §13 | **B-3** |
| **D-C5** | Acompanhar é **perguntar a uma pessoa**, nunca observar comportamento | N4, P5 | princípios congelados | impede vigilância disfarçada de cuidado | A_SALA §7.3 | — |
| **D-C6** | **Troca de Profissional**: antes do 1º atendimento é `CORRECAO_ESCOLHA` (Connection); depois, capacidade pendente de Relationship | ADR-027, ADR-028 | reconciliação | evita disputa entre módulos | ADR-028 | — |
| **D-C7** | Mínimo não clínico de segurança **autorizado**; todo texto de instrução **bloqueado** | §13 | Direção (escopo) + ausência de autoridade clínica | delimita Q-C9 | A_SALA §12 | validação clínica |

## 15.2 · Bloqueios

| # | Questão | Autoridade ausente | Risco | Promessa impedida | Fase afetada | Próxima ação |
|---|---|---|---|---|---|---|
| **B-1** | Concierge não lê `connection_records` | — **é implementação**, não decisão | responsável que não enxerga o que responde | *"[nome] está cuidando disso"* | implementação | avaliar RLS na modelagem (sem alterar agora) |
| **B-2** | Nada avisa que há decisão para atribuir | Operação | decisão parada sem ninguém saber | *"avisamos [nome]"* | implementação | definir mecanismo de notificação à equipe |
| **B-3** | **Nenhuma falha é detectada por mecanismo** | Operação | **abandono silencioso** — o risco central desta fase | *"ainda não foi vista"* · *"está em andamento"* | implementação · 9D | detecção de caso parado + escalonamento nominal |
| **B-4** | Sem cobertura quando o Concierge está indisponível | Operação | caso órfão por ausência de pessoa | *"[nome] responde"* | implementação | definir substituição/plantão |
| **B-5** | **Não existe canal da Aliviar para o profissional** | Operação + Privacidade | Modo A inviável | tudo sobre contato intermediado | implementação | escolher canal, dono e monitoramento |
| **B-6** | Quando perguntar o resultado no Modo B | Operação | acompanhar virar cobrança | qualquer promessa de acompanhamento ativo | 9D | definir cadência, sem prazo prometido |
| **B-7** | Horário de operação inexistente | Direção + Operação | prometer o que não se cumpre | *"voltamos às [hora]"* | 9D | declarar horário, ou assumir que não há |
| **B-8** | **Política de urgência** | **responsabilidade técnica clínica** | **segurança de uma pessoa** | toda instrução de urgência | independente | **acionar responsável clínico — não esperar as demais** |

## 15.3 · Estado das três questões

**`Q-C8` — RESOLVIDA.** Dois eventos (D-C1), sem intervalo sem responsável, sobre mecanismo que já existe e é auditado. **Ressalva:** depende de **B-1** para operar de fato — mas a decisão está tomada e não depende de mais nenhuma autoridade.

**`Q-C4` — PARCIALMENTE RESOLVIDA.** **Canais: resolvidos** (D-C2) — o inventário é completo e nenhum canal novo é pressuposto. **Prazos: resolvidos por negativa** (D-C3) — nenhum é assumido, e as quatro capacidades necessárias para autorizar prazo futuro estão nomeadas. **Permanece aberto** o canal para o profissional (**B-5**), que é o Modo A.

**`Q-C9` — DELIMITADA, MANTIDA BLOQUEADA.** O mínimo não clínico está autorizado (D-C7); todo texto de instrução permanece bloqueado por ausência de autoridade clínica (**B-8**). **A tensão registrada em §12.3 — o único canal humano existente não é adequado a urgência — precisa chegar ao responsável clínico junto com o resto.**

---

# 16 · Impacto nos patches da Fase 9D

| Patch | Situação após esta fase | Redação normativa ou condição |
|---|---|---|
| **P-1** *(remover "o Curador foi avisado")* | **APLICÁVEL INTEGRALMENTE** | *"Sua decisão fica registrada e visível para [nome], o Curador do seu caso."* **Sem "avisado", sem previsão de ação.** |
| **P-2** *(condicionar reversibilidade)* | **APLICÁVEL INTEGRALMENTE** | *"Enquanto você não tiver falado com [nome], pode trocar aqui mesmo."* **A segunda metade** (*"depois disso é só me dizer"*) **fica bloqueada por B-1** |
| **P-3** *(Concierge alcançável × assume)* | **APLICÁVEL INTEGRALMENTE** | alcançável desde a Mesa; **assume na transferência auditada** (D-C1) — não na decisão |
| **P-4** *(indisponibilidade)* | **DEPENDE DE IMPLEMENTAÇÃO** | ADR-043 tornou a promessa **pretendida**; **B-5 a mantém não cumprível.** Redigir só após o canal existir |
| **P-5** *(ancorar "a alternativa sai de cena")* | **APLICÁVEL PARCIALMENTE** | ancorar em `PRIMEIRO_ATENDIMENTO_REALIZADO` — **o único marco que existe hoje**; `aproximacao_concluida` ainda não existe |
| **P-6** *(A_MESA pode ser precisa)* | **APLICÁVEL INTEGRALMENTE** | mesma frase de P-2 |
| **P-7** *(quem lê a formulação)* | **PERMANECE BLOQUEADO** | Q-C10 / D3 — decisão de privacidade, intocada nesta fase |
| **P-8** *(falta `ENCERRADO_SEM_RELACIONAMENTO`)* | **APLICÁVEL INTEGRALMENTE** | acrescentar o estado, **com D-C4**: só por declaração dela, nunca por tempo |
| **P-9** *(§8 da Sala descreve serviço inexistente)* | **PRECISA SER REESCRITO** | substituir os seis eventos pelos marcos reais: registro · atribuição · aproximação (A ou B) · declaração · terminal. **Sem prazo** (D-C3) |
| **P-10** *(Q1..Q4 já decididas)* | **APLICÁVEL INTEGRALMENTE** | substituir pelo estado revisto do Contrato §1, mais D-C1 a D-C7 |
| **P-11** *("uma pessoa, com nome")* | **APLICÁVEL PARCIALMENTE** | verdadeiro **após a transferência**; **antes dela o nome é o do Curador** — e é isso que deve ser dito |

**Liberados integralmente: P-1, P-2, P-3, P-6, P-8, P-10.** Parcialmente: P-5, P-11. A reescrever: P-9. Dependente de implementação: P-4. Bloqueado: P-7.

---

# 17 · Critério de conclusão

| # | Pergunta | Resposta |
|---|---|---|
| 1 | quando nasce a responsabilidade da Aliviar | em `decisao_registrada` — **D-C1** |
| 2 | quando uma pessoa Concierge assume | na **transferência auditada** com motivo — **D-C1** |
| 3 | quem responde antes | **o Curador do caso**, porque `responsible_role` ainda é dele |
| 4 | quais canais existem | plataforma · WhatsApp oficial (iniciado por ela) · `patient_notifications` (admin-only). **Nada para a equipe, nada para o profissional** — **D-C2** |
| 5 | quais prazos podem ser prometidos | **nenhum** — **D-C3**, com as quatro capacidades necessárias nomeadas |
| 6 | o que ocorre fora do horário | **não há horário**; diz-se o que está guardado e o que ninguém viu — nunca quando voltamos |
| 7 | como falhas são detectadas | **não são** — todas dependem de alguém olhar: **B-3**, o risco central |
| 8 | o que torna o Modo B acompanhado | registro do modo · a Aliviar **pergunta** em vez de esperar relato · **silêncio nunca é desfecho** (D-C4, D-C5) |
| 9 | o que torna o Modo A operacional | canal para o profissional — **B-5, inexistente** |
| 10 | onde termina Connection e começa Relationship | no 1º atendimento (nascimento atômico) ou encerramento sem relação; **autoridade é `cases.responsible_role`** |
| 11 | mínimo seguro sobre urgência | **D-C7** — dizer o que não somos; **nunca o que fazer** |
| 12 | patches liberados | **P-1, P-2, P-3, P-6, P-8, P-10** integralmente |

**Bloqueios explícitos, nenhuma promessa inventada:** B-1 a B-8, com autoridade ausente nomeada em cada um.

---

> **A operação da Aliviar já sabe de quem é cada Case. O que ela ainda não sabe é quando alguém parou de olhar — e é essa, não a falta de papéis, a distância entre acompanhar e parecer que acompanha.**
