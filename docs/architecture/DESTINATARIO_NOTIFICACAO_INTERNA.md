# O destinatário da notificação interna — Fase 10C

> **Resolve** a pendência **P6** da [ADR-044](../DECISIONS.md): *a notificação interna deve ser destinada a uma pessoa específica ou a um papel/fila?*
> **É a única pendência que bloqueia a migration do Incremento 2.**
> **Não faz:** implementar · migration · alterar RLS · tela · canal · SLA · Temporary Access · tocar Motor, critérios, pesos, filtros ou seleção dos três.
> **Data:** 2026-08-01

---

# 0 · A resposta, antes do argumento

> **Nenhuma das duas. A notificação é do Case.**
>
> **Visibilidade** deriva de `curadoria.can_access_case(case_id)` — o mesmo predicado do Incremento 1, já provado contra banco real. **Destinatário individual é opcional e serve só como evidência de a quem se dirigiu a atenção; nunca como fonte de acesso nem de responsabilidade.**

E há uma razão para essa resposta não ser arbitrária: **o projeto já resolveu exatamente este problema uma vez, para o Curador, e não usou destinatário por papel.** Usou visibilidade sobre o Case.

---

# 1 · Estado real do domínio

*Constatações no código, migrations e políticas — não interpretações.*

| # | Constatação | Onde |
|---|---|---|
| F1 | **`cases.responsible_id` e `responsible_role` são NULLABLE.** Um Case **pode** existir sem pessoa responsável — não é hipótese, é o esquema | `information_schema`; `20260724192549` |
| F2 | Hoje, no banco local, **nenhum Case está sem responsável** (0 de 0). A situação é possível, não frequente | consulta direta |
| F3 | A transferência só acontece por `transfer_case_responsibility()`: ator de `auth.uid()`, **motivo obrigatório**, papel real do destinatário validado, **idempotente** (transferir para quem já é responsável não gera evento) | `20260724193459`, `20260725230458` |
| F4 | **Quem pode transferir:** administrador · quem tem o Case hoje · o Curador designado quando não há responsável · **ou um Curador assumindo para si um Case de ninguém** | `20260725230458:98-104` |
| F5 | **Não existe evento de aceite separado.** A transferência **é** o ato de assunção — deliberado, com motivo e auditoria | idem |
| F6 | Auditoria em `case_responsibility_changes`, cuja exclusão a **ADR-038** proíbe fora do descarte autorizado | `20260724192608`; provado no Incremento 1 |
| F7 | **JÁ EXISTE FILA POR PAPEL — e é resolvida por visibilidade, não por destinatário.** `cases_select_disponivel_para_curador`: qualquer Curador vê Cases com `responsible_id is null and assigned_curator_id is null`. O comentário da migration é a doutrina: *"Um Case sem responsável E sem curador atribuído não é de ninguém. Deixá-lo invisível não protege o paciente — só garante que ele espere mais."* | `20260725230458:33-40` |
| F8 | A autoassunção entra **dentro da mesma função**, não numa segunda porta — *"duas portas para o mesmo invariante são duas regras que podem divergir"* | `20260725230458:44-48` |
| F9 | A caixa do Concierge identifica trabalho por **projeção**: Connections não-terminais visíveis por RLS. Não filtra por papel nem por id — *"se a policy não deixar ver, não vem"* | `continuity-worklist.ts` |
| F10 | **Não existe diretório de membros ativos por papel** — só `user_roles`, sem noção de "quem está ativo hoje" | busca no repositório |
| F11 | **Não existe status de ausência, férias, indisponibilidade ou substituição** para nenhum papel | busca em 62 migrations |
| F12 | `patient_notifications` é paciente-facing: `profile_id` é a paciente, `insert` só de administrador, *trigger* protege conteúdo | `20260723164543` |
| F13 | O Incremento 1 provou: responsável atual lê · **outro Concierge não lê** · **ex-responsável perde acesso** · novo responsável ganha · Concierge **não** lê a formulação do trade-off | `connection-contact-mode.integration.test.ts` |

**A consequência de F7 é a mais importante desta fase.** A pergunta "como mostrar trabalho a um papel quando ninguém é dono ainda?" **já foi respondida neste repositório**. A resposta foi: *tornar o Case visível ao papel, e deixar que alguém assuma.* **Não** foi criar um destinatário por papel.

---

# 2 · Alternativas

| | **A** individual obrigatório | **B** por papel | **C** papel + reivindicação | **D** individual derivado do Case | **E** só vínculo com o Case | **F** híbrido |
|---|---|---|---|---|---|---|
| **Fonte de responsabilidade** | ⚠️ a notificação passa a parecer fonte | ⚠️ o papel vira quase-dono | ⛔ **cria segunda assunção** | ⚠️ congela o responsável do momento | ✅ **só `cases`** | ✅ **só `cases`** |
| **Risco de dois donos** | médio | **alto** | **alto** | médio | **nenhum** | **nenhum** |
| **Após reatribuição** | ⛔ fica com o ex-responsável | ✅ indiferente | ⛔ reivindicação obsoleta | ⛔ **aponta para quem já entregou** | ✅ **acompanha o Case sozinha** | ✅ acompanha |
| **Auditabilidade** | boa | fraca (não se sabe a quem se dirigiu) | boa | boa | ⚠️ **não registra a quem se dirigiu** | ✅ **boa** |
| **Notificações órfãs** | **sim** (usuário desativado) | não | sim | **sim** | **não** | não |
| **Leitura indevida** | baixa | ⛔ **alta: todo Concierge lê tudo** | alta até reivindicar | baixa | baixa | baixa |
| **Escalabilidade** | ok | ruim (caixa comum cresce) | média | ok | **ok** | **ok** |
| **RLS** | por id | ⛔ **por papel — proibido pela ADR-044 I-10** | por papel | por id | ✅ `can_access_case` | ✅ `can_access_case` |
| **Idempotência / dedup** | por (fato, pessoa) | por (fato, papel) | complexa | por (fato, pessoa) | ✅ **por (fato, Case)** | ✅ por (fato, Case) |
| **Caixa de trabalho** | ok | ok | ok | ok | ✅ ok | ✅ ok |
| **Exige aceite?** | não | não | ⛔ **sim — e F5 diz que não existe** | não | não | não |
| **ADR-043 / ADR-044** | tensiona I-2 | **viola I-10** | **viola I-2** | tensiona I-1 | ✅ compatível | ✅ **compatível** |

**Eliminadas de imediato:**

**B** viola a invariante **I-10** da ADR-044 — *Concierge sem vínculo com o Case não acessa* — e a §7 desta missão o proíbe explicitamente: acesso por `recipient_role = 'concierge'` faria todo Concierge ler tudo.

**C** exige um **evento de reivindicação**, isto é, uma segunda assunção. F5 e F8 são categóricos: a assunção é a transferência, e criar uma segunda porta para o mesmo invariante cria duas regras que podem divergir.

**D** é a mais sedutora e falha no caso que mais importa: **congela o responsável do instante da criação.** Depois de uma transferência a notificação apontaria para quem já entregou o Case — exatamente o que `can_access_case` documenta como proibido.

**A** herda o problema de D e acrescenta órfãs: usuário desativado deixa a notificação sem ninguém.

**Restam E e F**, que diferem em uma única coisa: se o destinatário individual é registrado.

---

# 3 · O princípio inegociável, aplicado

> **`cases.responsible_id` e `responsible_role` continuam sendo a única fonte de verdade sobre quem responde pelo Case.**

Nenhuma notificação **cria** responsabilidade · **altera** responsabilidade · **mantém** responsabilidade histórica após transferência · **dá acesso permanente** a quem já entregou · **transforma papel em segundo dono**.

**Isto elimina definitivamente A, B, C e D**, e é o que separa E de F: em F, o destinatário individual precisa ser **inerte** — se ele conceder qualquer acesso, F vira A.

---

# 4 · Visibilidade não é destino

Oito conceitos, oito significados. **A modelagem não pode tratá-los como sinônimos.**

| Conceito | Onde vive | Fonte de verdade? |
|---|---|---|
| **fato vinculado ao Case** | `case_id` (+ `connection_id`, `event_id`) na notificação | ✅ referência ao fato real |
| **destinatário lógico** | **não é campo** — é o responsável atual, calculado | ✅ `cases` |
| **destinatário individual** | `recipient_user_id`, **opcional e inerte** | ⛔ **evidência apenas** |
| **quem pode visualizar** | `can_access_case(case_id)`, avaliado **agora** | ✅ derivado |
| **quem leu** | `read_at` + `read_by` | ✅ para o fato "alguém viu" |
| **quem executou** | o evento correspondente, noutra tabela | ✅ |
| **quem era responsável ao criar** | `recipient_user_id` (quando registrado) | ⛔ **histórico, não autorização** |
| **quem é responsável agora** | `cases.responsible_id` | ✅ **única** |

**A linha que define esta fase:** *destinatário individual* e *quem pode visualizar* são coisas diferentes, e o primeiro **nunca** determina o segundo.

---

# 5 · Reatribuição

**A regra canônica do projeto prevalece: quem já entregou o Case não continua enxergando.**

| Pergunta | Resposta |
|---|---|
| Não lidas acompanham o Case? | **Sim — automaticamente.** A visibilidade é recalculada a cada leitura; nada é movido |
| Lidas permanecem visíveis ao anterior? | **Não.** Ele perde o acesso ao Case, e com ele à notificação |
| Ele mantém histórico? | **Sim, mas em `case_responsibility_changes`** — o registro da passagem, não a notificação |
| Reatribuir fisicamente? | **Não.** Reescrever destinatário criaria a segunda fonte |
| Basta recalcular por `can_access_case`? | **Sim. É toda a mecânica** |
| Novo responsável precisa de nova notificação? | **Não** para o mesmo fato — a existente já é dele. **Sim** se houver **fato novo** |
| Como evitar duplicidade? | dedup por **(fato, Case)**, não por pessoa. Reatribuir não é fato novo |
| Auditoria preservada? | **Sim** — `recipient_user_id` guarda a quem a atenção se dirigiu à época; nada é sobrescrito |
| Arquivadas? | Somem da caixa e **permanecem no registro**; a visibilidade segue a mesma regra |

**Nenhuma escrita acontece na reatribuição.** É a propriedade mais valiosa desta decisão: transferir o Case não toca a tabela de notificações, e por isso as duas nunca divergem.

---

# 6 · Notificações órfãs

**A escolha as elimina por construção**, porque a visibilidade nunca depende de uma pessoa existir.

| Situação | Comportamento |
|---|---|
| destinatário desativado | **nada quebra** — quem vê é o responsável atual. `recipient_user_id` vira histórico |
| responsável deixa o papel | perde o acesso ao Case, e à notificação junto |
| Case transferido | §5 |
| destinatário sem acesso | **irrelevante** — nunca teve acesso *por ser destinatário* |
| **não existe Concierge disponível** | **o Case continua com o responsável atual — o Curador.** Não fica órfão: F1 permite `null`, mas a jornada não passa por `null` |
| Case ainda com Curador | ele vê, porque é o responsável. Correto |
| notificação criada antes da transferência | acompanha o Case sozinha |
| transferência falha | nada muda; a notificação continua visível a quem responde |
| usuário removido | `recipient_user_id` pode ficar pendurado — **nunca deixa a notificação inacessível** |

**Dependências futuras, marcadas e não inventadas:**

**Case sem responsável nenhum.** F1 o permite. Hoje **não existe fila por papel para o Concierge** — só para o Curador (F7). Se um Case chegar a `responsible_id is null` com `responsible_role = 'concierge'`, **ninguém o vê**. O caminho já provado é o de F7: uma policy de disponibilidade análoga. **Não é criada aqui**, porque a situação não existe na jornada atual e inventá-la seria criar fila sem operação.

**Ausência, férias e substituição** não existem no domínio (F11). Enquanto não existirem, "o responsável está de férias" é problema humano, resolvido por transferência.

---

# 7 · RLS conceitual

**Predicado principal: `curadoria.can_access_case(case_id)`** — o mesmo do Incremento 1, `security definer`, já testado, que autoriza administrador, responsável atual e Curador designado, e **revoga automaticamente de quem entregou**.

**Leitura:** `can_access_case(case_id)`. **Nada mais.**
**Escrita de leitura** (marcar lida/arquivada): quem pode ler.
**Criação:** pelo serviço que produz o fato, nunca por pessoa avulsa.

**Proibições explícitas:** **nenhuma policy usa `recipient_role`** · **nenhuma usa `recipient_user_id`** como condição de acesso · **nenhuma concede por `has_role('concierge')` isolado** · **a paciente não lê notificação interna** — `can_access_case` não a inclui, e é assim que fica.

> **Se um dia `recipient_user_id` aparecer numa cláusula `using`, a decisão foi revertida sem ADR.** É o sinal a vigiar em revisão.

---

# 8 · Modelo de dados mínimo

| Campo | Obrigatório? | Papel |
|---|---|---|
| `id` | ✅ | identidade |
| **`case_id`** | ✅ **NOT NULL** | **âncora de autorização — é o que torna a decisão real** |
| `connection_id` | opcional | o fato costuma ser da Connection, mas nem todo fato é |
| `event_id` | opcional | referência ao evento de origem, quando houver |
| `kind` | ✅ | que fato chamou atenção; conjunto fechado |
| `recipient_user_id` | **opcional, INERTE** | **evidência de a quem a atenção se dirigiu. Nunca condição de acesso** |
| `recipient_role` | ⛔ **não existe** | seria o caminho para acesso por papel |
| `created_at` | ✅ | — |
| `created_by` | opcional | quem/que serviço produziu |
| `read_at`, `read_by` | opcionais | o fato "alguém viu", com nome |
| `archived_at`, `archived_by` | opcionais | saiu da caixa; **não encerra trabalho** |
| **`deduplication_key`** | ✅ **UNIQUE** | derivada de **(fato, Case)** — nunca da pessoa |
| `status` | ⛔ **não existe** | derivável de `read_at`/`archived_at`; um campo a mais divergiria |
| `metadata` | ⛔ **não existe** | campo sem semântica definida vira depósito |

**Fonte de verdade:** `case_id`, `kind`, `deduplication_key`, `read_at`/`read_by`.
**Auditoria apenas:** `recipient_user_id`, `created_by`, `archived_*`.
**Não devem existir:** `recipient_role`, `status`, `metadata`, e **qualquer campo de responsabilidade**.

---

# 9 · Leitura e arquivamento

**Quem marca como lida:** quem pode ler — ou seja, quem tem vínculo atual com o Case.

**Leitura é por notificação, não por pessoa.** `read_at` + `read_by` bastam: registram **que alguém viu e quem foi**, que é o fato operacional necessário. Um histórico por pessoa responderia "quem mais leu?", pergunta que **ninguém precisa fazer** — e que, se fosse feita, viraria medição de gente. **Fica como dependência futura, não como campo especulativo.**

**Arquivar** = sai da caixa. **Não encerra trabalho, não encerra tentativa, não muda estado de nada.**

**Após reatribuição:** `read_at` **permanece** — o fato de alguém ter visto é histórico, e o novo responsável precisa saber que já foi visto, não fingir que não foi. **Notificação lida não some da caixa do novo responsável se o trabalho continuar pendente** — porque a caixa é derivada de fatos (§10), não da notificação.

> **ADR-044 prevalece: ler não executa o trabalho.**

---

# 10 · Trabalho pendente permanece derivado

O trabalho continua vindo de **fatos**: decisão registrada sem transferência · Case sem modo definido · **tentativa aberta sem resposta** · notificação não lida.

**A notificação pode:** chamar atenção · aparecer numa caixa · registrar que alguém viu.

**A notificação não pode:** ser a única evidência de trabalho pendente · encerrar tentativa · mudar estado da Connection · transferir o Case · marcar ação como executada.

**Teste mental que fecha a questão:** *apagar `team_notifications` inteira deixa alguém sem trabalho a fazer?* **Não.** A caixa continua derivando de tentativas e Connections. **Perde-se atenção, nunca obrigação.**

---

# 11 · Decisão

> ### P6 — RESOLVIDA. Alternativa **F (híbrido)**, na forma restrita.
>
> **A notificação interna é do Case.** Persiste `case_id` **NOT NULL** e, opcionalmente, `recipient_user_id` como **evidência inerte** de a quem a atenção se dirigiu.
>
> **A visibilidade deriva integralmente de `curadoria.can_access_case(case_id)`, avaliado no momento da leitura.** `recipient_user_id` **nunca** aparece numa cláusula de autorização.
>
> **Não existe `recipient_role`.**

**Validação contra o domínio real — a preferência inicial da missão foi confirmada, e por evidência, não por gosto:**

**F7 é o precedente.** O projeto já enfrentou "trabalho visível a um papel sem dono" e resolveu por **visibilidade sobre o Case**, com autoassunção dentro da mesma função de transferência. Repetir o padrão é coerência; inventar destinatário por papel seria a segunda porta que F8 alerta contra.

**F5 elimina C.** Não existe aceite separado, e criar um só para notificações traria assunção paralela à responsabilidade.

**F13 mostra que o mecanismo já funciona.** Os quatro comportamentos que P6 precisa garantir — responsável lê, outro não lê, ex-responsável perde, novo ganha — **já estão provados contra banco real** para `connection_records`. Reusar o mesmo predicado herda a prova.

**Por que F e não E:** E não registra a quem a atenção se dirigiu, e essa informação tem valor de auditoria real — *"avisamos [nome] em [data]"* é uma das frases que a ADR-043 §9 quer poder dizer com honestidade. F a preserva **sem** que ela conceda nada.

---

# 12 · Consequências para o Incremento 2

**Migration:** tabela `team_notifications` com os campos de §8 · `case_id` **NOT NULL** com FK e `on delete cascade` · **UNIQUE em `deduplication_key`** · índices por `case_id` e por `read_at is null` (a caixa) · RLS habilitada · grants mínimos.

**Policies:** `select` por `can_access_case(case_id)` · `update` (marcar lida/arquivada) pelo mesmo predicado · `insert` pelo serviço · **nenhuma cláusula referenciando `recipient_user_id` ou papel**.

**Deduplicação:** chave derivada de (fato, Case). Reatribuição **não** gera notificação nova.

**Reatribuição:** **nenhuma escrita.** É a asserção mais forte a testar.

**Leitura:** `read_at`/`read_by` na plataforma. **Sem despacho externo.**

**Caixa derivada:** a projeção existente ganha "notificação não lida" como mais um sinal — **nunca como o único**.

**Rollback:** derrubar a tabela e as policies. **Nada depende dela** — a caixa continua funcionando por fatos, que é a prova de que a separação está correta.

**Continua bloqueado por canal:** despacho externo · horário · SLA · escalonamento · expiração · retenção (P1–P5 da ADR-044).

---

# 13 · Testes obrigatórios do Incremento 2

**Positivos:** responsável atual lê · novo responsável ganha acesso · administrador audita · notificação permanece vinculada ao fato de origem · dedup impede duplicata do mesmo fato.

**Negativos, todos nomeados:**
**[NEG]** outro Concierge (com papel, sem vínculo) **não lê** · **[NEG]** ex-responsável **perde acesso** após transferência · **[NEG]** **a paciente não lê notificação interna** · **[NEG]** `recipient_user_id` divergente do responsável atual **não amplia acesso** — *o teste que protege a decisão inteira: cria-se a notificação apontando para A, transfere-se para B, e A não lê* · **[NEG]** leitura **não altera** responsabilidade · **[NEG]** arquivamento **não encerra** trabalho — a caixa derivada continua acusando pendência · **[NEG]** reatribuição **não duplica** fato nem gera notificação nova · **[NEG]** usuário desativado **não deixa** o Case sem responsável nem a notificação inacessível.

---

# 14 · Necessidade de ADR adicional

| Avaliação | Resposta |
|---|---|
| Já contida na ADR-044? | **Parcialmente.** A ADR-044 fixou o que a notificação **não é**; não fixou de quem ela é |
| Exige complemento na ADR-044? | **Não.** Isto é o **detalhamento** de uma pendência que ela própria registrou e nomeou (P6) |
| Exige ADR-045? | **Não** |
| Decisão técnica de implementação? | **Sim — é o que é.** |

> **Nenhuma ADR nova.** A escolha **não cria conceito arquitetural**: aplica `can_access_case` — helper canônico — a uma tabela nova, exatamente como o Incremento 1 fez, e **repete um padrão que o repositório já adotou** (F7). Não há alternativa arquitetural relevante sobrevivendo à ADR-044 e ao princípio de fonte única. **ADR por rotina desvaloriza o instrumento.**
>
> **Quando isto viraria ADR:** se alguém propuser acesso por papel, destinatário como fonte de autorização, ou fila de Concierge — os três contradizem invariantes já registradas e exigiriam decisão formal, não silêncio.

---

# 15 · Critério de conclusão

| # | Pergunta | Resposta |
|---|---|---|
| 1 | pessoa, papel, Case ou híbrido? | **Case**, com destinatário individual **opcional e inerte** (F restrita) |
| 2 | como a visibilidade é calculada? | `can_access_case(case_id)`, no momento da leitura |
| 3 | após reatribuição? | acompanha o Case; **nenhuma escrita**; ex-responsável perde |
| 4 | órfãs? | **impossíveis** — a visibilidade nunca depende de uma pessoa existir |
| 5 | quem lê e arquiva? | quem tem vínculo atual; arquivar não encerra trabalho |
| 6 | trabalho separado da notificação? | apagar a tabela não remove obrigação nenhuma |
| 7 | campos da migration? | §8 — **sem `recipient_role`, sem `status`, sem `metadata`** |
| 8 | quais testes protegem? | §13, com 8 negativos |
| 9 | **Incremento 2 desbloqueado?** | **Sim.** P6 era a única pendência que bloqueava a migration |

---

> **A notificação não sabe de quem ela é. Ela sabe de qual Case ela é — e quem responde pelo Case, o Case já diz.**
