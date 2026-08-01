# Decisões Técnicas da Continuidade Pós-Decisão — Fase 10A

> **Fecha** as decisões `NT-1` a `NT-4` deixadas abertas por [`MODELAGEM_CONTINUIDADE_POS_DECISAO.md`](./MODELAGEM_CONTINUIDADE_POS_DECISAO.md), para que o primeiro incremento seja implementável **sem decisão silenciosa durante a codificação**.
> **Autoridade:** [ADR-043](../DECISIONS.md) (direção) · ADR-027 (Connection) · ADR-028 (Relationship) · ADR-029 (Temporary Access, **aprovada e não implementada**) · o código e as migrations vigentes.
> **Não faz:** implementar · migration · alterar RLS · tela · SLA · canal para o profissional · protocolo clínico · decisão jurídica · tocar Motor, critérios, pesos, filtros ou seleção dos três.
> **Data:** 2026-08-01

---

# 0 · Resumo executivo das decisões

**Duas propostas da própria Fase 10 são rejeitadas nesta fase**, com fundamento. Isso é o resultado esperado de fechar decisões em vez de acumulá-las.

| # | Decisão | Resultado |
|---|---|---|
| **NT-1** | renomear `CONTATO_INICIADO` → `CONTATO_DECLARADO` | **REJEITADA** — churn com risco de regressão e ganho zero de capacidade |
| **NT-2** | pausa por segurança como evento, não status | **CONFIRMADA e refinada** — bloqueio ativo separado, fora do primeiro incremento |
| **NT-3** | regresso `EM_APROXIMACAO → DECISAO_REGISTRADA` | **PREJUDICADA** — cai junto com o estado |
| **NT-4** | caixa de trabalho como projeção, nunca segunda atribuição | **CONFIRMADA** |
| — | status `EM_APROXIMACAO` | **REJEITADO por ora** — derivável e sem produtor |
| — | `approach_attempts` | **APROVADO como desenho**, adiado para o incremento 2 |
| — | `team_notifications` | **APROVADO como desenho**, adiado para o incremento 2 |
| — | acesso do Concierge | **DECIDIDO — reutiliza `can_access_case()`, sem predicado novo** |

**A descoberta que simplificou tudo:** `curadoria.can_access_case(uuid)` já existe, é `security definer`, já autoriza `cases` e carrega no comentário a regra do projeto — *"Autorização do Case pela responsabilidade ATUAL. Quem já entregou o Case não continua enxergando."* **O primeiro incremento não precisa inventar autorização: precisa aplicar a que já existe a duas tabelas.**

## 0.1 · Correções após a verificação prévia da Fase 10B

*Três premissas deste documento estavam erradas e foram corrigidas antes da implementação. **Nenhuma decisão material de NT-1 a NT-4 foi alterada** — as três são correções factuais.*

| # | Premissa errada | Correção | Onde |
|---|---|---|---|
| **D-1** | supunha `case_id` em `connection_events`, tornando o contrato de RLS inexecutável como escrito | a tabela tem apenas `connection_id`; a policy usa o **join canônico já vigente nela**, com **semântica de autorização idêntica**. **Nenhuma coluna é acrescentada** | §6, §18 |
| **D-2** | supunha uma lista de Cases na área do Concierge; a área é construída sobre **CRM** e não tem lista de Cases nem de Connections | a caixa de continuidade é **seção nova**, distinta da fila de CRM, sem misturar as duas fontes de trabalho. NT-4 permanece: **nenhuma entidade de tarefa** | §18 |
| **D-3** | não registrava o estado do ledger | migration **local apenas**; produção intocada; a divergência remota passa de 4 para 5 migrations; **reconciliação continua precondição de publicação** | §18 |

---

# 1 · Recuperação de NT-1 a NT-4

*As quatro estão identificadas na §23 do documento da Fase 10, com esses rótulos exatos. **Nenhuma inconsistência de numeração encontrada.***

## NT-1 — Renomeio `CONTATO_INICIADO` → `CONTATO_DECLARADO`

**Formulação fiel (Fase 10, §5.2 e §23):** *"`CONTATO_INICIADO` não diz por quem. Sob dois modos vira ambíguo — e foi essa ambiguidade que produziu a divergência D1. É renomeio de rótulo, não de semântica."*

**Por que permaneceu aberta:** toca um valor vivo, com *trigger*, espelho em `state-machine.ts`, componente e testes.

**Alternativas:** (a) renomear com aceitação dupla na leitura; (b) manter e documentar a semântica; (c) manter e desambiguar por `contact_mode`.

**Dependências:** `assert_connection_valid_transition`, `connection_events_type_check`, `state-machine.ts`, `types.ts`, `commands.ts`, `ConnectionProgressPanel`, 14 arquivos de teste.

**Risco de decidir errado:** **alto na direção do renomeio** — regressão em domínio implementado, auditado e coberto (ADR-027 Fase 4), em troca de nenhuma capacidade nova.

> ### DECISÃO NT-1 — **REJEITADA. O valor permanece `CONTATO_INICIADO`.**
> **Fundamento:** a ambiguidade que produziu D1 não estava no nome — estava em **não existir registro de quem poderia agir**. `contact_mode` resolve isso na origem: com o modo registrado, `CONTATO_INICIADO` é inequívoco (no modo direto, é declaração dela; no intermediado, o contato da Aliviar tem eventos próprios). **Renomear seria tratar o sintoma com risco de regressão em código congelado.**
> **O que fica no lugar:** comentário de coluna e documentação de domínio fixando a semântica — *`CONTATO_INICIADO` é sempre declaração da paciente de que **ela** iniciou o contato*.
> **Revisitar quando:** a aproximação intermediada existir e a leitura em produção mostrar confusão real de operadores — evidência, não hipótese.

## NT-2 — Pausa por segurança como evento, não status

**Formulação fiel (Fase 10, §5.3):** *"a pausa por segurança … **não pode** alterar o estado da decisão — A_DECISAO §10.1 exige que o processo fique exatamente como estava. Um status a alteraria. Portanto: evento, com sobreposição de apresentação, e nenhum efeito no vínculo."*

**Por que permaneceu aberta:** o evento diz que a pausa **começou**; não diz que continua **ativa**, nem como se libera.

**Alternativas:** evento sem projeção · bloqueio ativo separado · tabela de restrições · coluna de suspensão · regra derivada · status.

**Risco:** **alto** — errar aqui produz ou um processo que não recua de fato, ou um estado clínico inferido.

> ### DECISÃO NT-2 — **CONFIRMADA a rejeição do status; refinado o mecanismo.** Ver §10.

## NT-3 — Regresso `EM_APROXIMACAO → DECISAO_REGISTRADA`

**Formulação fiel (Fase 10, §5.2):** *"é a única transição regressiva proposta … se a aproximação não produziu nada, a janela de correção direta da paciente deve voltar a existir. Fechá-la por um ato nosso que não deu em nada seria puni-la pela nossa tentativa."*

**Por que permaneceu aberta:** altera *trigger* vigente e introduz a primeira transição regressiva do domínio.

> ### DECISÃO NT-3 — **PREJUDICADA.** Depende de `EM_APROXIMACAO`, rejeitado em §9. **O princípio que a motivava é preservado** e reaparece como invariante: *nenhum ato da Aliviar encurta a janela de correção direta da paciente sem ter produzido efeito no mundo* (§15, I-6). Quando a aproximação intermediada for implementada, esta decisão volta com o estado.

## NT-4 — Caixa de trabalho como projeção

**Formulação fiel (Fase 10, §7):** *"Uma 'caixa de trabalho' do Concierge é projeção de leitura sobre Cases dos quais ele já é responsável + notificações não lidas — nunca uma segunda tabela de atribuição."*

**Por que permaneceu aberta:** precisa provar que a projeção basta para detectar trabalho parado, sem entidade de tarefa.

> ### DECISÃO NT-4 — **CONFIRMADA.** Ver §4.

---

# 2 · `approach_attempts`

> ### DECISÃO — **APROVADO como tabela própria. NÃO entra no primeiro incremento.**

**Por que tabela própria, e não `connection_records`:** cardinalidade **1:N** — várias tentativas por Connection, com canais e desfechos diferentes. Achatar em colunas obrigaria a sobrescrever a tentativa anterior, **destruindo a evidência de que tentamos** — que é justamente o que a ADR-043 exige registrar.

**Por que não apenas eventos:** eventos registram **o que aconteceu**; a tentativa tem **estado corrente consultável** ("há tentativa aberta?"). Derivar isso de eventos a cada leitura é projeção sem dono, propensa a divergir.

**Atores:** cria e despacha o **Concierge responsável**; responde o **profissional** (ou o Concierge relatando, com origem registrada).

**Estados — só os verificáveis:**

| Estado | Fato verificável? | Decisão |
|---|---|---|
| `CRIADA` | sim — alguém a criou | **adotado** |
| pronta para envio | ⛔ não é fato, é intenção | **rejeitado** |
| `DESPACHADA` | sim — nós enviamos | **adotado** |
| recebimento verificável | ⛔ inverificável na maioria dos canais | **rejeitado como estado** — vira **atributo opcional** `received_evidence`, preenchido só quando existir |
| aguardando resposta | ⛔ derivável (`DESPACHADA` sem resposta) | **rejeitado** |
| `RESPONDIDA` | sim | **adotado**, com `outcome ∈ (PODE_RECEBER_CONTATO, INDISPONIVEL)` |
| disponível / indisponível | — | **são `outcome`, não estados** |
| sem resposta | ⛔ é ausência; exigiria regra temporal inexistente | **rejeitado** — derivado, `DEPENDENTE DE OPERAÇÃO` |
| `CANCELADA` | sim — alguém cancelou | **adotado** |
| encerrada | ⛔ duplicaria `RESPONDIDA`/`CANCELADA` | **rejeitado** |

**Ciclo:** `CRIADA → DESPACHADA → RESPONDIDA | CANCELADA`. `CANCELADA` também a partir de `CRIADA`.

**Ausência de resposta ≠ indisponibilidade.** A primeira é **nosso** silêncio de retorno; a segunda é **fato declarado** com origem. Confundi-las produziria a pior falha possível: declarar alguém indisponível porque não respondeu.

**Dados mínimos:** connection · profissional · modo de envio · ator · momentos de criação/despacho/resposta · `outcome` · origem da resposta.
**Idempotência:** por (connection, tentativa aberta) — não existem duas tentativas abertas simultâneas.
**Auditoria:** append-only, no padrão do projeto. **Retenção:** `DEPENDENTE DE PRIVACIDADE/JURÍDICO`.
**Indisponibilidade:** é `outcome`, e **não altera `professional_profile_id`** nem seleciona substituto.
**Primeiro contato:** independente — `PRIMEIRO_ATENDIMENTO_REALIZADO` **nunca** é inferido de tentativa.
**Temporary Access:** a concessão, quando existir, é referenciada **pela tentativa**; sem ADR-029 implementada, a tentativa registra apenas que houve despacho.

---

# 3 · `team_notifications`

| Alternativa | Veredito |
|---|---|
| **1. Estender `patient_notifications`** | **REJEITADA.** Estrutura é paciente-facing por construção: `profile_id` é o paciente destinatário, `select_own_or_admin`, *trigger* que protege conteúdo. Admitir destinatários internos criaria risco real de vazamento por política mal escrita — **e o custo do erro é mostrar a uma paciente algo escrito para a equipe** |
| **2. Tabela própria** | **APROVADA** como núcleo |
| **3. Caixa de trabalho derivada** | **APROVADA e suficiente para o primeiro incremento** |
| **4. Evento de domínio com projeção** | **APROVADA** como origem |
| **5. Combinação** | **É a solução**: o fato de domínio origina; a notificação é evidência operacional; a caixa é projeção |

**Os sete conceitos, separados:**

| Conceito | Onde vive | É fonte de verdade? |
|---|---|---|
| **fato de domínio** | `connection_events` / `patient_curadoria_decisions` | **sim** |
| **atribuição de trabalho** | `cases.responsible_id/_role` | **sim** |
| **notificação** | `team_notifications` | **não** — evidência operacional |
| **despacho** | estado da notificação | não |
| **leitura** | estado da notificação | **sim**, para o fato "alguém viu" |
| **assunção** | `transfer_case_responsibility` | **sim** |
| **execução** | evento correspondente | **sim** |

> ### DECISÃO — a notificação é **evidência operacional com estados próprios**, nunca fonte de verdade sobre responsabilidade.
> **Consequência exigida pelo escopo, e garantida por construção:** apagar toda a tabela de notificações **não altera quem responde pelo Case**, porque a responsabilidade vive em `cases` e sua história em `case_responsibility_changes`.
> **Estados:** `CRIADA → DESPACHADA → LIDA`; mais `FALHOU`. **`EXPIRADA` e `ESCALADA` não são adotados** — pressupõem regra temporal, e não há SLA nem horário formalizado.
> **Adiada para o incremento 2.** O primeiro incremento entrega trabalho verificável pela **projeção** (§4), sem tabela nova.

---

# 4 · Tarefa operacional — NT-4

**`cases.responsible_id` é suficiente para dizer quem responde?** **Sim, e é a única fonte.**

**Então como representar a ação pendente?** **Por derivação de fatos**, não por entidade: *Connection em `DECISAO_REGISTRADA`, sem evento posterior, cujo Case é meu*. É uma consulta, não um registro.

| Alternativa | Veredito |
|---|---|
| nenhuma tarefa nova | **ADOTADA para o primeiro incremento** |
| tarefa específica de Connection | rejeitada agora — **nenhuma ação concorrente existe ainda** |
| **caixa de trabalho derivada dos estados** | **ADOTADA** |
| entidade genérica de tarefas | **rejeitada** — seria plataforma de workflow sem necessidade atual |
| projeção sobre eventos | **é a mesma que a caixa derivada** |

**Distinguir "responsável pelo Case" de "responsável por iniciar a aproximação":** hoje **não é necessário** — são a mesma pessoa. Quando deixarem de ser (múltiplas ações concorrentes), a resposta é `approach_attempts.actor_id`, que já nomeia o executor **sem criar segundo dono do Case**.

**Detectar trabalho parado:** pela projeção — decisão registrada sem transferência; transferência sem evento posterior. **Capacidade estrutural agora; regra temporal `DEPENDENTE DE OPERAÇÃO`.**

**Reatribuir uma ação sem trocar o dono do Case:** hoje inexiste o caso; futuramente, cancelar a tentativa e criar outra com novo `actor_id` — **sem tocar `cases`**.

**Auditoria:** `case_responsibility_changes` para o Case; eventos append-only para as ações.

---

# 5 · Responsabilidade e assunção

**Preservado sem alteração:** `cases.responsible_id` · `responsible_role` · `transfer_case_responsibility()` · motivo obrigatório · validação do papel real · idempotência · `case_responsibility_changes`.

| Pergunta | Decisão |
|---|---|
| Quando nasce a responsabilidade **organizacional** | no registro da decisão. **É derivada — não recebe coluna**, porque "existe decisão" já é o fato |
| Quem responde **antes** da transferência | **o Curador do caso** — `responsible_role` ainda aponta para ele. **Não há intervalo sem dono** |
| O que a transferência altera | o responsável atual e, por consequência, **o alcance de `can_access_case`** |
| **Existe evento separado de aceite?** | **NÃO.** A transferência **exige ator autenticado, papel validado e motivo escrito** — já é um ato deliberado. Um "aceite" adicional seria segunda confirmação sem fato novo |
| Como alguém passa a ser responsável | exclusivamente por `transfer_case_responsibility()` |
| Como detectar transferência sem execução | projeção: `responsible_role = 'concierge'` e nenhum evento de Connection posterior à transferência |

> **Não existem dois donos concorrentes.** Nenhum artefato desta fase grava responsabilidade fora de `cases`.

---

# 6 · Acesso do Concierge

> ### DECISÃO — **reutilizar `curadoria.can_access_case(case_id)`. Nenhum predicado novo é escrito.**

**Fundamento — o helper já existe e já codifica a regra certa.** É `security definer`, `stable`, já autoriza `cases`, e seu comentário fixa a política do projeto: *"Autorização do Case pela responsabilidade **ATUAL**. Quem já entregou o Case não continua enxergando: o histórico em `case_responsibility_changes` registra a passagem, não devolve acesso."* Seu predicado admite **administrador**, **responsável atual** e **curador designado** (vínculo histórico).

**Aplicá-lo a `connection_records` e `connection_events` entrega, de uma vez:** acesso do Concierge responsável · preservação do administrador · preservação do Curador designado — coerente com A_DECISAO §7, que o mantém alcançável para dúvidas sobre o caso · **reatribuição tratada automaticamente**, porque o predicado lê o responsável corrente · **e nenhum acesso por papel isolado**.

**Como cada tabela o aplica — corrigido após a verificação prévia da Fase 10B (D-1).** As duas tabelas **não** recebem o mesmo predicado, porque **`connection_events` não possui `case_id`**: sua única âncora é `connection_id`.

```sql
-- connection_records — aplicação direta
curadoria.can_access_case(case_id)

-- connection_events — join pelo padrão canônico já vigente nesta tabela
exists (
  select 1
  from curadoria.connection_records cr
  where cr.id = connection_events.connection_id
    and curadoria.can_access_case(cr.case_id)
)
```

**Isto preserva exatamente a mesma semântica de autorização e não cria decisão nova.** O padrão de join já é o usado pela policy vigente `connection_events_select_own_patient`; a única mudança é o predicado interno.

> **`connection_events` NÃO recebe `case_id`.** Acrescentar a coluna apenas para simplificar a escrita da policy duplicaria um fato que já é derivável por chave estrangeira — criando segunda fonte de verdade para "de que Case é este evento", contra a §14.

| Condição | Decisão |
|---|---|
| **Leitura** | `can_access_case(case_id)` — **acrescenta ao conjunto atual, não substitui** as policies da paciente |
| **Inserção** | **inalterada no primeiro incremento.** Segue restrita à paciente |
| **Atualização** | **inalterada.** O Concierge **não** atualiza `connection_records` |
| **Campos necessários** | profissional escolhido · status · momentos · histórico de eventos |
| **Campos que permanecem invisíveis** | **a formulação do trade-off** — vive em `patient_curadoria_decisions`, cuja policy **não inclui o Concierge**. Invisibilidade obtida **sem escrever nada** (§7) |
| **Depois da transferência** | Concierge passa a ler; **o Curador designado continua lendo** |
| **Reatribuição** | automática — quem sai perde, quem entra ganha |
| **Paciente** | **inalterada, integralmente** |

**Respostas explícitas:**

| Pergunta | Resposta |
|---|---|
| Pode ler a decisão? | **sim** — o registro do Connection |
| Pode ler o profissional escolhido? | **sim** |
| Pode ler a formulação do trade-off? | **NÃO** — §7 |
| Pode alterar a escolha? | **NÃO** |
| Pode alterar `connection_records.status`? | **NÃO** no primeiro incremento |
| Pode registrar tentativa? | **NÃO** — `approach_attempts` não existe ainda |
| Pode registrar indisponibilidade? | **NÃO** — depende da tentativa |
| Pode solicitar retorno à Curadoria? | **pode sinalizar** fora do domínio; **quem reabre é o Curador** |

**Testes negativos obrigatórios:** Concierge **de outro Case** não lê · Concierge **sem papel** não lê · Concierge **após reatribuição** deixa de ler · Concierge **não insere nem atualiza** Connection · Concierge **não lê a nota** da decisão · paciente **não perde** nenhum acesso.

---

# 7 · Formulação do trade-off

| Dimensão | Estado |
|---|---|
| **Acesso técnico vigente** | paciente, **Curador do caso** e **administrador** (`patient_decisions_select_own_or_team`) |
| **Finalidade legítima** | **dela** — reencontrar o próprio raciocínio (A_DECISAO §6) |
| **Necessidade operacional** | **não demonstrada** para nenhum papel |
| **Concierge** | **não ampliar.** A função dele — conduzir ou acompanhar a aproximação — não exige o motivo íntimo da escolha |
| **Administrador** | mantido, por auditoria |
| **Profissional** | **nunca**, nem por padrão nem por opção no primeiro incremento |
| **Armazenamento** | mantido — é o antídoto do arrependimento, e só serve se durar |
| **Auditoria / minimização** | leitura registrada quando houver caixa de trabalho; **minimização é o princípio** |

> ### DECISÃO — **BLOQUEIO MANTIDO. `DEPENDENTE DE PRIVACIDADE/JURÍDICO`.**
> **A existência de acesso atual não prova necessidade futura**, e este documento não amplia acesso por conveniência.
> **O primeiro incremento não depende deste campo** — e isso não é coincidência: ao reutilizar `can_access_case` apenas em `connection_*`, a nota **permanece invisível ao Concierge sem que nenhuma regra precise ser escrita para escondê-la.**
> **Pendente separado (D3):** a paciente não é hoje informada de que o Curador lê sua frase. É questão de privacidade, não de arquitetura.

---

# 8 · `contact_mode`

| Definição | Decisão |
|---|---|
| **Tipo** | `text` com `check` — coerente com o projeto, que não usa enum nativo para status de domínio |
| **Valores** | `CONTATO_DIRETO_ACOMPANHADO` · `APROXIMACAO_INTERMEDIADA` |
| **Nullable** | **sim, obrigatoriamente.** `null` = **ausência de escolha**, e nenhuma rotina pode tratá-lo como padrão |
| **Momento** | no ato da decisão ou depois, sempre por manifestação explícita |
| **Ator autorizado** | **apenas a paciente** |
| **Alteração** | permitida **enquanto nenhum efeito tiver sido produzido** — sem despacho e sem contato declarado |
| **Histórico** | evento `modo_contato_definido`, append-only. **Nunca sobrescrita silenciosa** |
| **Legado** | **sem backfill.** `null` é lido como `LEGADO_AUTOSSERVICO` **na apresentação**, e este rótulo **não existe como valor persistido** — inventar um valor para o passado seria afirmar escolha que ninguém fez |
| **Consentimento** | no modo intermediado o ato autoriza procurar um terceiro. **Se exige manifestação separada é `DEPENDENTE DE PRIVACIDADE/JURÍDICO`.** A modelagem registra autoria e momento, servindo a qualquer das duas respostas |
| **Relação com status** | **nenhuma no primeiro incremento.** Não condiciona transição |
| **Validação** | `check` no banco (valores) + serviço (quem e quando). **Sem *trigger* novo** — não há regra que o exija |

**Registros antigos com `CONTATO_INICIADO` permanecem verdadeiros**: significam contato direto declarado pela paciente, que é o que de fato ocorreu.

---

# 9 · Status `EM_APROXIMACAO`

| Pergunta | Análise |
|---|---|
| Que fato representa | existe tentativa de aproximação aberta |
| Que evento o produz | `aproximacao_despachada` |
| Vale para os dois modos | **não** — só o intermediado |
| Sobrepõe estados da tentativa | **sim, integralmente** — é `approach_attempts` com tentativa em `DESPACHADA` |

> ### DECISÃO — **REJEITADO no primeiro incremento e enquanto `approach_attempts` não existir.**
> **Dois fundamentos, ambos regra própria da Fase 10:**
> **(1) Duplica informação derivável de outro agregado.** O escopo manda rejeitar exatamente nesse caso. "Em aproximação" é `exists(tentativa aberta)` — derivável, e derivar é melhor que sincronizar dois lugares.
> **(2) Não tem produtor.** A Fase 10 fixou que **nenhum estado entra no enum antes de existir quem o produza** — estado sem produtor é promessa disfarçada de dado. Sem `approach_attempts` e sem canal, ninguém produz este.
> **Consequência boa:** o *trigger* `assert_connection_valid_transition` **não é alterado no primeiro incremento** — o artefato de maior risco de regressão fica intocado.
> **Revisitar quando:** `approach_attempts` for implementado. **E aí a pergunta correta será se o status é necessário, e não apenas conveniente** — porque a tentativa já responde tudo, exceto a leitura barata do estado do vínculo.

---

# 10 · Pausa por segurança — NT-2

| Mecanismo | Veredito |
|---|---|
| status de Connection | **REJEITADO** — alteraria o estado que A_DECISAO §10.1 manda preservar |
| coluna de suspensão em `connection_records` | **REJEITADO** — mistura segurança com vínculo; e o recuo é do **Case**, não de um Connection |
| evento sem projeção | **INSUFICIENTE** — diz que começou, não que continua ativa nem como se libera |
| regra derivada de eventos | **INSUFICIENTE** — "há pausa ativa?" viraria projeção sem dono, propensa a divergir |
| tabela genérica de restrições | **REJEITADO** — plataforma sem necessidade |
| **bloqueio ativo separado, no Case** | **ADOTADO** |

> ### DECISÃO NT-2 — **bloqueio ativo separado, com abertura e liberação explícitas, ancorado no Case.**
> **Satisfaz todos os requisitos do escopo:** preserva o estado original (não toca `connection_records`) · impede transições incompatíveis (verificado no serviço e, quando implementado, no banco) · é auditável (abertura e liberação com ator e momento) · permite liberação autorizada · **não finge protocolo clínico** — registra que houve recuo, nunca por quê clinicamente · **não armazena diagnóstico inferido** · **não usa a demora da paciente como gatilho**, porque só abre por declaração explícita.
> **Fora do primeiro incremento**, e por razão de princípio: **não há autoridade definida para abrir e liberar um bloqueio de segurança.** Implementar o mecanismo antes de existir quem o opere criaria a aparência de proteção. **`DEPENDENTE DE CLÍNICA` quanto a critérios; `DEPENDENTE DE OPERAÇÃO` quanto a quem libera.**

---

# 11 · Fronteira Connection → Relationship

| Marco | Avaliação |
|---|---|
| primeiro **contato** realizado | ⛔ contato não é relação; no modo direto é declaração sobre uma ligação |
| primeiro atendimento **agendado** | ⛔ **não existe agenda**, e esta fase não a cria |
| **primeiro atendimento realizado** | ✅ **implementado, atômico, `unique(connection_id)`, coberto por testes de integração** |
| profissional **aceitou acompanhar** | ⛔ não modelado; exigiria vínculo dele com o caso |
| paciente **declarou início da relação** | ⚠️ é o que o marco vigente já é — renomeio sem ganho |

> ### DECISÃO — **`PRIMEIRO_ATENDIMENTO_REALIZADO` permanece a fronteira. Não é alterada.**
> **Nenhuma alternativa acrescenta capacidade; todas acrescentam pressuposto.** E a fronteira não se muda para deixar a documentação mais elegante.

**Quem governa o intervalo entre primeiro contato e primeiro atendimento:** **Connection**, com o **Concierge** como papel — e a autoridade sobre "quem responde" é `cases.responsible_role`, que é única, de modo que os dois módulos **não ficam simultaneamente responsáveis**.

**Bloqueadas no intervalo:** consulta marcada · agenda · aceite do profissional · acompanhamento iniciado.

**Troca de Profissional:** antes do primeiro atendimento é `CORRECAO_ESCOLHA` (Connection); depois, é a capacidade pendente da **ADR-028** (Relationship). **Nenhum evento de troca existe hoje em `relationship_events_type_check`** — a lacuna é real e permanece.

---

# 12 · Temporary Access

**Constatação:** **ADR-029 aprovada; `src/modules/temporary-access/` e migration não existem.** Não é tratada como capacidade existente.

| Pergunta | Resposta |
|---|---|
| O primeiro incremento depende dela? | **NÃO** |
| Quais incrementos dependem? | **apenas a aproximação intermediada**, se e quando o profissional precisar ver contexto na plataforma |
| Recurso protegido | a entrega final — o candidato que a própria ADR-029 identificou |
| Dado que não pode ser enviado sem ela | **qualquer contexto de Curadoria**. Sem TA, o profissional não tem caminho de acesso nenhum |
| A aproximação pode começar sem acesso dele à plataforma? | **Sim** — uma aproximação pode ser uma conversa humana em que a Aliviar se identifica e pergunta se ele pode receber a paciente, **sem transmitir contexto** |
| Alternativas temporárias legítimas | contato humano **sem contexto de Curadoria**; identificação mínima com autorização registrada dela |
| **Atalhos inseguros** | enviar documento por canal não auditado · conceder acesso permanente ao invés de temporário · **usar o profissional já autenticado para ampliar leitura sem TA** · transmitir a formulação do trade-off |

---

# 13 · Eventos canônicos do primeiro ciclo

**Apenas os que têm consumidor.** Os demais ficam desenhados nas §2–3 e entram com seus agregados.

| Evento | Produtor · autoridade | Pré-condição | Payload mínimo | Efeito | Idempotência | Visibilidade | Consumidor | Falha |
|---|---|---|---|---|---|---|---|---|
| **`decisao_registrada`** *(vigente)* | **paciente** | entrega publicada | profissional | cria Connection | `unique(curated_selection_id)` | paciente, Curador, admin, **+ Concierge responsável** | caixa de trabalho | duplicidade → retry seguro |
| **`modo_contato_definido`** *(novo)* | **paciente** | Connection sem efeito produzido | modo, ator, momento | grava `contact_mode` | por (connection, modo) | idem | caixa de trabalho; futura aproximação | modo inválido; ator não-paciente |
| **`responsabilidade_transferida`** *(vigente)* | **pessoa autenticada** | papel real validado | responsável, papel, **motivo** | move o Case | ✅ já implementada | equipe | caixa de trabalho; detecção de inércia | papel inexistente |
| **`CORRECAO_ESCOLHA`** *(vigente)* | **paciente** | `DECISAO_REGISTRADA`; dentro dos três | novo profissional | troca **sem apagar** | por evento | todos com acesso | histórico | fora da janela → recusado |
| **`CONTATO_INICIADO`** *(vigente)* | **paciente, exclusivamente** | não-terminal | — | fecha correção direta | por Connection | todos com acesso | caixa de trabalho | declarado sem contato — inverificável, aceito |
| **`PRIMEIRO_ATENDIMENTO_REALIZADO`** *(vigente)* | **paciente** | não-terminal | — | terminal + Relationship atômico | ✅ implementada | todos | Relationship | inferir de contato — proibido |
| **`ENCERRADO_SEM_RELACIONAMENTO`** *(vigente)* | **paciente** | não-terminal | — | terminal sem Relationship | ✅ implementada | todos | caixa de trabalho | encerrar por tempo — proibido |

**Não entram no primeiro ciclo, por não terem consumidor ainda:** `notificacao_criada` · `notificacao_despachada` · `notificacao_lida` · `aproximacao_*` · `disponibilidade_informada` · `indisponibilidade_informada` · `alteracao_*`. **Ficam nominados para que ninguém os funda depois.**

**Distinções obrigatórias, preservadas:** decisão registrada ≠ trabalho criado (projeção) ≠ responsabilidade transferida ≠ notificação criada ≠ lida ≠ ação assumida ≠ tentativa iniciada ≠ contato declarado pela paciente ≠ indisponibilidade ≠ primeiro contato realizado. **Dez conceitos, dez nomes.**

---

# 14 · Fontes de verdade

| Fato | Fonte de verdade | Tipo |
|---|---|---|
| decisão | `patient_curadoria_decisions` | tabela |
| profissional escolhido | `connection_records.professional_profile_id` | tabela |
| modo de contato | `connection_records.contact_mode` | tabela **(novo)** |
| responsável pelo Case | `cases.responsible_id/_role` | tabela |
| histórico de responsabilidade | `case_responsibility_changes` | tabela |
| responsável pela ação | *(hoje = responsável pelo Case)* · futuro `approach_attempts.actor_id` | — |
| estado de Connection | `connection_records.status` | tabela |
| **trabalho pendente** | — | **PROJEÇÃO** sobre Case + Connection + eventos |
| tentativa de aproximação | `approach_attempts` | **não existe ainda** |
| notificação / leitura | `team_notifications` | **não existe ainda** |
| assunção | `transfer_case_responsibility` + `case_responsibility_changes` | tabela |
| disponibilidade | `approach_attempts.outcome` | **não existe ainda** |
| primeiro contato | `connection_records.status = CONTATO_INICIADO` | tabela |
| primeiro atendimento | `connection_records.status` terminal | tabela |
| Relationship | `relationship_records` | tabela |
| alteração da escolha | `connection_events` (`CORRECAO_ESCOLHA`) | tabela |

**Nenhum fato tem duas fontes concorrentes.** O único item derivado — **trabalho pendente** — está **explicitamente marcado como projeção** e não é persistido.

---

# 15 · Invariantes finais

**I-1.** Só a paciente confirma ou corrige diretamente sua escolha.
**I-2.** O Concierge nunca escolhe profissional pela paciente.
**I-3.** Concierge não vinculado ao Case **não lê** a decisão. *(teste negativo obrigatório)*
**I-4.** Notificação não é fonte de responsabilidade — apagá-la não altera quem responde.
**I-5.** Responsabilidade não prova leitura; leitura não prova execução.
**I-6.** **Nenhum ato da Aliviar encurta a janela de correção direta sem ter produzido efeito no mundo.** *(princípio herdado de NT-3)*
**I-7.** Silêncio não é sucesso e não encerra Connection.
**I-8.** Indisponibilidade não seleciona outra pessoa nem altera `professional_profile_id`.
**I-9.** `contact_mode` nunca é inferido, herdado ou preenchido por padrão.
**I-10.** Legado não é reescrito: nenhum modo atribuído retroativamente.
**I-11.** Nenhuma transição apaga evento anterior.
**I-12.** Pausa por segurança preserva o estado anterior.
**I-13.** Connection e Relationship nunca respondem pelo mesmo fato — a autoridade é `cases.responsible_role`, única.
**I-14.** Nenhum estado existe no enum sem produtor autorizado.
**I-15.** O Concierge não lê a formulação do trade-off.

---

# 16 · Necessidade de ADR

| Avaliação | Resposta |
|---|---|
| Apenas detalham a ADR-043? | **o primeiro incremento, sim** |
| Alteram a ADR-027? | **não** — a máquina de estados e os *triggers* ficam intactos |
| Alteram a ADR-028? | **não** — a fronteira permanece |
| Dependem da ADR-029? | **só a aproximação intermediada** |
| Criam conceito arquitetural novo? | **não no incremento 1.** `approach_attempts` e `team_notifications` **criam** |

> ### DECISÃO — **o primeiro incremento NÃO exige nova ADR.**
> **Fundamento:** ele **aplica um helper canônico existente** (`can_access_case`) a duas tabelas, acrescenta uma coluna opcional e uma projeção de leitura. Não há alternativa arquitetural relevante nem conceito novo — há execução de uma direção já decidida na ADR-043. **ADR por rotina desvaloriza o instrumento.**
>
> **Uma ADR será necessária antes do incremento 2**, quando entrarem `approach_attempts` e `team_notifications`: são **dois agregados novos, com impacto transversal e alternativas reais** (as cinco comparadas em §3). **Número seguinte disponível: ADR-044.** **Não foi acrescentada a `docs/DECISIONS.md` nesta fase**, e não deve ser antes de a decisão de canal existir — uma ADR sobre notificação sem canal decidido nasceria incompleta.

---

# 17 · Primeiro incremento

**Defeito concreto que resolve:**

> O Case possui responsável, mas o Concierge responsável **pode não conseguir enxergar a decisão** nem **receber trabalho verificável** sobre ela.

**Objetivo:** tornar o Concierge responsável capaz de **ver a decisão do seu Case** e **encontrar o trabalho pendente**, sem ampliar acesso por papel, sem tocar a máquina de estados e sem prometer nada novo à paciente.

**Não inclui:** aproximação intermediada · notificações · tentativas · indisponibilidade · alteração mediada · pausa por segurança · `EM_APROXIMACAO` · renomeio.

---

# 18 · Contrato do primeiro incremento

## Banco

**Alteração 1 — `connection_records.contact_mode`**
`text null`, com `check (contact_mode is null or contact_mode in ('CONTATO_DIRETO_ACOMPANHADO','APROXIMACAO_INTERMEDIADA'))`.
**Sem default. Sem backfill. Sem `not null`.** Comentário de coluna registrando que `null` é ausência de escolha, nunca padrão.

**Alteração 2 — comentário de coluna em `connection_records.status`**
Fixa a semântica de `CONTATO_INICIADO` como declaração da paciente (substitui o renomeio rejeitado em NT-1).

**Índice:** apenas se a projeção exigir — a avaliar contra `connection_records_case_id_key` e `cases_responsible_idx`, **que provavelmente já bastam**.
**Triggers:** **nenhum criado ou alterado.** `assert_connection_valid_transition` e `assert_connection_professional_in_delivery` ficam intactos.
**Compatibilidade:** aditiva. Nenhuma linha existente muda.

> **Ledger — corrigido após a verificação prévia da Fase 10B (D-3).** A migration deste incremento **pode ser criada e testada apenas no ambiente local autorizado**. **Nenhuma aplicação em produção está autorizada; nenhum push ou publicação está autorizado.**
> Produção está hoje **4 migrations atrás** do repositório, além da deriva de nome (`20260730100000` no repositório × `20260731190334` em produção). **A nova migration aumentará temporariamente essa divergência para 5** — o que é esperado e aceito enquanto o trabalho for local.
> **A reconciliação prevista em [`PLANO_RECONCILIACAO_LEDGER.md`](../curadoria/PLANO_RECONCILIACAO_LEDGER.md) permanece precondição obrigatória de qualquer publicação.** Nenhum reparo remoto de ledger é feito por esta fase.

## RLS

**Lê:** acrescentar policies **em adição**, nunca em substituição às da paciente.
· `connection_records` → `curadoria.can_access_case(case_id)`, direto.
· `connection_events` → `exists (select 1 from curadoria.connection_records cr where cr.id = connection_events.connection_id and curadoria.can_access_case(cr.case_id))`, porque **esta tabela não tem `case_id`** (§6). **Nenhuma coluna é acrescentada a ela.**
**Insere:** **inalterado** (paciente).
**Atualiza:** **inalterado** (paciente).
**`patient_curadoria_decisions`:** **inalterada** — é o que mantém a formulação do trade-off invisível ao Concierge.

**Testes negativos obrigatórios:** Concierge de outro Case não lê · sem papel não lê · após reatribuição deixa de ler · não insere · não atualiza · **não lê a nota** · Curador designado continua lendo · paciente não perde acesso.

## Serviço

**Nenhuma função nova produz evento novo.** O incremento é de leitura, mais um comando pequeno: `defineContactMode(connectionId, mode)` — **ator obrigatoriamente a paciente**, recusado se houver efeito produzido, gravando `modo_contato_definido` **na mesma transação** da atualização da coluna (padrão já usado em `create_connection_with_event`).
**Idempotência:** repetir o mesmo modo é no-op bem-sucedido.
**Erros:** ator não autorizado · modo inválido · efeito já produzido · concorrência otimista no padrão `55000` vigente.

**Projeção — caixa de trabalho:** consulta de leitura, **sem tabela**, retornando Cases onde `responsible_id = auth.uid()`, `responsible_role = 'concierge'`, com Connection não-terminal — e, quando aplicável, sinalizando decisão registrada sem evento posterior.

## Concierge

**Como encontra o caso:** pela caixa de trabalho derivada, **numa seção nova** do painel do Concierge.

> **Corrigido após a verificação prévia da Fase 10B (D-2).** A área do Concierge **existe**, mas é construída sobre o **CRM** (`crm_contacts`, `crm_tasks`, `crm_appointments`, via `getConciergeDashboardData`): **hoje ela não tem nenhuma lista de Cases ou de Connections.** A redação anterior sugeria estender uma lista que não existe.
> **Consequência para o incremento:** a caixa de continuidade é **seção nova**, **visual e semanticamente distinta** da fila de CRM, com nome próprio. **A fila de CRM e a caixa de continuidade não são a mesma fonte de trabalho** e não podem ser somadas, misturadas num mesmo contador ou apresentadas como uma lista única — o operador precisa saber de qual origem veio cada item.
> **E continua valendo NT-4:** nenhuma entidade de tarefa é criada neste incremento; a caixa é projeção.
**O que enxerga:** o Connection do seu Case — profissional escolhido, estado, modo, histórico de eventos.
**O que ainda não pode fazer:** registrar tentativa · registrar indisponibilidade · alterar escolha ou status · ler a formulação do trade-off · **e nenhuma superfície pode dizer à paciente que ele está acompanhando** enquanto não houver evidência de assunção.

## Paciente

**O que muda:** passa a poder **declarar como quer começar** (o modo), sem que isso altere nada mais.
**O que permanece igual:** decisão · janela de correção direta · declaração de contato · terminais · "nenhum dos três" · as duas portas · nada expira.
**Frases que continuam proibidas:** *"o Curador foi avisado"* · *"o Concierge já está acompanhando"* · *"entraremos em contato em breve"* · *"o profissional recebeu"* · *"a disponibilidade foi confirmada"* · *"sua consulta está encaminhada"* · *"está tudo certo"* · qualquer prazo · qualquer instrução de urgência.

## Observabilidade

Decisão registrada sem transferência · transferência sem evento posterior · **acesso negado inesperado** · Connection sem desfecho · divergência entre estado e evento. **Nenhuma métrica de conversão.**

## Testes

**Unitários:** validação do modo; recusa de ator não-paciente; recusa após efeito produzido; idempotência.
**Integração (banco real):** RLS por papel com os oito negativos; transação modo+evento; concorrência.
**Banco:** `check` do modo; **`null` permanecido em linhas legadas**; *triggers* inalterados.
**Componentes:** ausência de pré-seleção de modo; ausência das frases proibidas.
**Regressão:** as 14 suítes vigentes de Connection/Relationship **sem alteração de expectativa** — se alguma quebrar, o incremento está errado.

## Rollback

Remover as policies acrescentadas e a coluna. **Nada depende dela**; nenhum dado se perde, porque `null` é o estado legítimo anterior.

---

# 19 · Pendências e bloqueios

| # | Questão | Classificação | Risco · capacidade impedida · autoridade · próximo passo |
|---|---|---|---|
| 1 | NT-1 renomeio | **DECIDIDA** (rejeitada) | — |
| 2 | NT-4 caixa como projeção | **DECIDIDA** | — |
| 3 | Acesso do Concierge | **DECIDIDA** | — |
| 4 | `contact_mode` | **DECIDIDA** | — |
| 5 | Fronteira com Relationship | **DECIDIDA** (mantida) | — |
| 6 | ADR para o incremento 1 | **DECIDIDA** (desnecessária) | — |
| 7 | `EM_APROXIMACAO` / NT-3 | **DECIDIDA COM CONDIÇÃO** | revisitar com `approach_attempts` |
| 8 | `approach_attempts` | **DEPENDENTE DE IMPLEMENTAÇÃO** | sem ele não há aproximação intermediada · **ADR-044** |
| 9 | `team_notifications` | **DEPENDENTE DE OPERAÇÃO** | sem canal decidido, nasceria incompleta · **decidir canal** |
| 10 | Regra temporal de inércia e escalonamento | **DEPENDENTE DE OPERAÇÃO** | detecção existe, ponteiro não · **definir horário e cobertura** |
| 11 | Consentimento do modo intermediado | **DEPENDENTE DE PRIVACIDADE/JURÍDICO** | bloqueia o modo intermediado · **Jurídico** |
| 12 | Leitura da formulação do trade-off | **BLOQUEADA** | risco de ela escrever supondo intimidade · **Privacidade** · informar ou restringir |
| 13 | Dados ao profissional / Temporary Access | **BLOQUEADA** | bloqueia contexto ao profissional · **implementar ADR-029** |
| 14 | Pausa por segurança — critérios e liberação | **DEPENDENTE DE CLÍNICA** | **risco à segurança de uma pessoa** · responsabilidade técnica clínica · **acionar agora, sem esperar as demais** |
| 15 | Troca de Profissional pós-atendimento | **DEPENDENTE DE IMPLEMENTAÇÃO** | ADR-028, capacidade pendente |

---

# 20 · Auditoria final

| # | Verificação | Resultado |
|---|---|---|
| 1 | toda decisão tem fonte de autoridade | ✅ ADR-043, ADR-027/028/029, código verificado, ou bloqueio explícito |
| 2 | nenhum fato com duas fontes de verdade | ✅ §14; o único derivado é marcado como projeção |
| 3 | nenhum acesso ampliado por papel sem vínculo | ✅ `can_access_case` exige responsabilidade atual |
| 4 | notificação separada de responsabilidade | ✅ §3 — apagar notificações não altera quem responde |
| 5 | tentativa separada da Connection | ✅ §2 — agregado próprio, cardinalidade 1:N |
| 6 | dados legados permanecem verdadeiros | ✅ §8 — sem backfill, `null` é ausência de escolha |
| 7 | Temporary Access não tratado como implementado | ✅ §12 |
| 8 | pausa por segurança não virou diagnóstico | ✅ §10 — só por declaração explícita, sem inferência |
| 9 | fronteira com Relationship explícita | ✅ §11 |
| 10 | primeiro incremento sem decisão silenciosa | ✅ §18 — banco, RLS, serviço, testes e rollback especificados |

---

> **O primeiro incremento não adiciona capacidade nova — corrige uma ausência. Hoje uma pessoa pode ser responsável por um Case e não conseguir ver a decisão pela qual responde. Tudo o mais desta fase existe para que essa correção não venha acompanhada de promessas que ainda não podemos cumprir.**
