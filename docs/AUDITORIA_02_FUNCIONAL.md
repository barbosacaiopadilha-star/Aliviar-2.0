# AUDITORIA 02 — FUNCIONAL

**Data:** 2026-08-02 · **Fase:** 2 da Auditoria Geral (após `AUDITORIA_01_DOMINIO.md`)
**Natureza:** inspeção somente — nenhum código, banco, teste ou doc canônico foi alterado.
**Pergunta única:** *todas as funcionalidades, telas, rotas, ações e estados estão completos, coerentes, acessíveis e alinhados ao fluxo concebido?*

## 1. Resumo executivo

**Veredicto: a cobertura funcional ainda possui lacunas.** O caminho principal certificado pelo E2E (Admin → Curador → Paciente, 12 passos) é sólido e bem defendido. Fora dele, a auditoria encontrou três padrões dominantes:

1. **Domínio pronto, superfície ausente.** O padrão mais recorrente e mais grave: banco + actions + testes de integração completos, e **nenhum botão**. Casos: todo o ramo de aproximação intermediada do Concierge (6 actions órfãs — quando a paciente escolhe que a Aliviar faça a aproximação, *nada acontece*); a Avaliação técnica de critérios (6×4) — a aba com esse nome renderiza outra coisa e a pendência "N critérios sem avaliação" é perpétua; os filtros obrigatórios do Perfil (componente `MandatoryFilters` nunca renderizado — a exigência de área do Case é *indefinível* pela UI); a resolução de pedidos de atualização; a resposta do Profissional a divergências; o painel de divergências prometido ao Admin pela porta de publicação.
2. **Guardas que moram numa camada só.** Regras críticas existindo apenas no cliente React (reabrir/regravar seleção), apenas no trigger (congelar relatório emitido), ou em lugar nenhum (Mapa de Prioridades editável **após** o reconhecimento da paciente — a Invariante 28 protege as tabelas aposentadas, não a autoridade atual; história enviada pode regredir a rascunho; seleção entregue alterável no banco; uploads sem validação de tipo/tamanho em três actions).
3. **Estados e caminhos sem volta ou sem chegada.** `SUPERSEDED` inalcançável (Perfil reconhecido é beco sem saída — "corrigir exige novo Perfil" é inexequível); declaração de área terminal incorrigível pela UI; entrega não-atômica que pode deixar a paciente com seleção entregue e relatório nulo (tela vazia); `markReportDelivered` destruindo o carimbo de emissão; `/api/crm/leads` interceptada pelo middleware (o lead do site institucional **nunca chega**).

Achados totais: **7 críticos, 24 altos, ~35 médios**, detalhados na §12. O que está aderente (e é muito) está na §13.

## 2. Escopo e método

Sete frentes de inspeção paralelas e independentes, todas com evidência `arquivo:linha` e nível de certeza declarado: (1) rotas+navegação; (2) Administrador; (3) Curador; (4) Paciente; (5) demais papéis (Profissional, Atendente, Concierge); (6) máquinas de estado (13 mapeadas); (7) Server Actions (103 inventariadas) + órfãos + 26 cenários de exceção. Onde dois auditores divergiram, prevaleceu a evidência direta (ex.: `/curador` **é** código morto — o redirect em `next.config.ts` foi lido e listado; a alegação contrária de outro auditor não tinha lido o config).

## 3. Inventário de rotas (síntese)

~45 rotas de página + 2 APIs. Inventário completo por rota (URL, arquivo, papel, finalidade, fonte de dados, entrada de navegação, presença no E2E) foi levantado; síntese dos desvios:

| Categoria | Rotas | Situação |
|---|---|---|
| Vivas e navegáveis | públicas, auth, wizard (7), `/paciente/*` (6), `/admin/*` (16), `/coa/curadoria/*` (=portal-curador, 4), `/coa/{atendimento,concierge}`, `/atendimento[+leadId]`, `/acompanhamento`, `/profissional` | ok |
| **Mortas atrás de redirect** | `/curador/*` (7 arquivos), `/portal-paciente/*` (4), `/admin/crm` (raiz — a página do "Painel Concierge" nunca renderiza) | código compilado inalcançável |
| **Órfãs** (sem entrada de navegação) | `/admin/crm/configuracoes` (zero refs), `/coa` (hub — só por URL), `/acompanhamento` (só via login do concierge) | alcançáveis apenas por URL |
| **Duplicadas** | `curadoria_tecnica` como rota estática **e** slug de `[etapa]` (a estática sempre vence — 1 de 4 etapas roda por arquivo distinto) | duplicação estrutural |
| **API quebrada** | `/api/crm/leads` — não está em PUBLIC_PATHS; middleware devolve 307→/login a POSTs externos | **crítico** |
| Navegação de documento (dívidas) | `reconhecer-perfil.tsx` (reload — RECONHECE-REFRESH-001), `patients-table.tsx` (âncora — NAV-COMMIT-001), `lead-workspace.tsx:148` (âncora **sem dívida registrada** — 3º caso do padrão) | documentado ×2, não documentado ×1 |

Resíduos de rota: 5 `revalidatePath("/curador/...")` no-ops; `ROLE_HOME.curador_medico` apontando para um redirect (login do curador = 307+rewrite a cada vez); redirect `permanent:true` de `/portal-paciente/:path*` descartando o subcaminho (conteúdo de "como-funciona" perdido sem reabrigo).

## 4. Matriz por papel (capacidades com superfície real)

| Papel | Completo | Parcial | Sem superfície (domínio pronto) |
|---|---|---|---|
| **Administrador** | dashboard; pacientes (criar+credenciais 1×, reset senha, acesso, editar tel/cidade/UF); profissionais (criar, verificar registro c/ fonte, área c/ fonte, publicar/despublicar, documentos); equipe (2 papéis); casos (lista, iniciar, atribuir/reatribuir); ACE observabilidade; CRM (6 telas) | edição de profissional **apaga competências** (P0); nome/e-mail do paciente ineditáveis; sem confirmação destrutiva em 5 superfícies; despublicar/reset sem motivo/auditoria; sem filtro de pendências na lista | painel de divergências (a pendência aponta para ele — **não existe**); conceder `atendente`/`concierge`; `practice_update_requests` |
| **Curador** | fila (minhas+disponíveis, assumir c/ motivo); acolhimento (história chega sozinha); Mapa 28 incremental; Portas (declarar 4 estados c/ justificativa); Rede (6 filtros, recorte dito); Compatibilidade (Motor); seleção 3+pareceres+reabrir; Relatório (rascunho assistido→emitir→entregar 2 etapas); Base de Evidências (abrir divergência, pedir atualização) | corrigir declaração terminal (upsert existe, UI não); PENDENTE sem realimentação; "Salvar rascunho" ativo pós-emissão (erro cru do trigger); "etapa N de 7" na fila (são 4); memória da Mesa volátil | **Avaliação técnica** (`declareCriterionAction` órfã — pendência perpétua, leitura da paciente vazia); **filtros obrigatórios/preferências** (`MandatoryFilters` órfão); continuidade/tentativas |
| **Paciente** | login/next; home 4 estados; wizard completo+retomada+conflito otimista; documentos (upload/excluir); Perfil (revelação progressiva, reconhecer idempotente); curadoria (3 caminhos, comparação por textura, decisão→contato→relationship ponta a ponta); linha do tempo; RLS A×B sólida | **falsa confirmação de salvamento** em sessão expirada (P0); história enviada editável por URL (mesma falsa confirmação); "remover" só desanexa; `/paciente/perfil` = conta, não Perfil; linha do tempo sem os marcos da jornada; imprimir só no formato legado | **download/visualização de documento** (inexistente); "nenhuma das três" (deliberadamente adiado v1.1, componente órfão testado) |
| **Atendente** | fila de leads; ficha; duplicidade; **qualificar→converter→abrir Case→encaminhar (ciclo completo — corrige a Fase 1)** | — | **sem permissão CRM** (não cria contato/tarefa/agenda) nem COA (barrado em `/coa/atendimento` pela página, aceito pelo layout); sem criação manual de lead |
| **Concierge** | CRM completo; dashboards de leitura (2) | notificações só como contador | **as 6 actions de aproximação** (criar/despachar/responder/cancelar tentativa; ler/arquivar notificação) — o trabalho do papel é inexecutável |
| **Profissional** | Protocolo da Prática (rascunho+submissão); declarações ME1–ME5; ver evidências/divergências | pedidos de atualização visíveis sem como atender | responder divergência; **saber que foi selecionado** (nenhuma leitura de connection; RLS de notificações não o inclui); possível chave inconsistente em `alignment_professional_answers` (user.id × professional_profiles.id) |

## 5. Máquinas de estado (13 mapeadas — desvios)

Mapeamento completo por máquina (inicial, transições, ator, trigger, auditoria, teste) foi levantado; máquinas com espelho TS + trigger + teste: Case (9 estados), responsabilidade, Connection, Relationship, approach_attempts, história, Relatório (carimbos). Desvios:

- **Estados inalcançáveis:** `priority_profiles.SUPERSEDED` (nenhuma escrita — Invariante 28 inexequível); `ace_executions.CANCELLED` e `PENDING` (insert nasce RUNNING); `case_events.note_updated`; `practice_update_requests.{atendida,cancelada}` (action órfã); `team_notifications.{read,archived}` (actions órfãs); estado "aprovado-não-emitido" do Relatório (aprovação e emissão são a mesma chamada).
- **Estados finais ainda mutáveis:** seleção `DELIVERED` sem trigger de congelamento (guarda só no código; `DELIVERED→DRAFT` passa pela constraint); história `enviada→rascunho` não bloqueada pelo trigger (só `data` é protegida); **`case_priority_map` sem proteção pós-reconhecimento** (o trigger da Invariante 28 cobre `priority_weights`/`filters` — as tabelas aposentadas); `emitted_at` fora da lista congelada de `assert_report_lifecycle` (e `markReportDelivered` o sobrescreve).
- **Máquinas sem banco:** funil CRM (18 estados só em TS, coluna `text` sem CHECK); `ace_executions.status` sem trigger.
- **Máquinas desconectadas:** `cases.status` não é movido por nenhum fluxo da Curadoria — entregar o Relatório não leva o Case a `DELIVERED`; `IN_CURATION/HUMAN_REVIEW/DELIVERED` são operados só pelo dropdown manual, e a `patient_case_overview` conta a história errada à paciente se ninguém mexer no dropdown.
- **Coluna morta:** `cases.current_stage` (lida e tipada, nunca escrita).
- **Duplicidades semânticas:** `AGUARDANDO_DECLARACAO` × `INFORMACAO_INSUFICIENTE` (distinção defensável — "ninguém olhou" vs "olharam e não deu" — que a UI não comunica); `DELIVERED` com 4 significados em 4 objetos; `VALIDATED` com atores opostos (paciente no Perfil, curador no ACE); `em_verificacao` fantasma no TS (não existe no enum; `nao_localizado`/`desatualizado` existem e faltam no tipo).

## 6. Caminhos principais e alternativos

- **Principal (E2E 12 passos):** verde e re-executável; cobre 12 URLs. **Não toca**: `/coa/atendimento`, `/coa/concierge`, `/admin/crm/*`, `/atendimento`, `/acompanhamento`, `/profissional` — exatamente onde se concentram os achados críticos de rota/permissão.
- **Alternativos que funcionam:** retomada do wizard em qualquer passo; reabrir acolhimento/mapa/seleção-não-entregue; redeclarar área em estados não-terminais; substituição na seleção; reset de senha; despublicar; reatribuir curador; correção de escolha da paciente (`DECISAO_REGISTRADA`); idempotência do reconhecimento.
- **Alternativos quebrados/inexistentes:** corrigir Perfil reconhecido (C3); corrigir declaração terminal; reabrir seleção *depois* de emitir (copy promete "até entregar", código trava na emissão); lead do site (API bloqueada); aproximação intermediada (C4); "nenhuma das três" (adiado, registrado).

## 7. Estados de erro e exceção (26 cenários — síntese)

Implementados e bons: registro inexistente → `notFound()` (11 rotas verificadas); acesso sem papel; Rede vazia; <3 elegíveis (E-01/E-02); falha de banco com `erroDeBanco`+referência nas leituras da Mesa; concorrência da história (locking otimista exemplar); duplo clique (8 componentes críticos com `pending/disabled`); relatório emitido-não-entregue invisível à paciente (dupla exigência de `delivered_at`).

Quebrados/incompletos: **upload inválido** (nenhuma validação de MIME/tamanho em 3 actions); **entrega não idempotente** (`deliverSelection` sem `.is("delivered_at", null)` — reentrega sobrescreve o carimbo) e **não-atômica** (seleção entregue + relatório recusado pelo trigger = tela vazia da paciente, sem rollback); **concorrência da Mesa** inexistente (dois curadores sobrescrevem-se); **error boundaries ausentes em 6 segmentos** (`portal-curador`, `coa`, `atendimento`, `acompanhamento`, `(public)`, `portal-paciente`) e o boundary existente não mostra a referência `ERR-`; actions do curador devolvendo `error.message` cru (inclusive Postgres); sessão expirada → falsa confirmação (wizard) e acusação indevida ("Este Perfil não é seu") no reconhecimento; "cancelar" presente em só 4 formulários.

## 8. Funcionalidades órfãs

- **14 Server Actions sem consumidor** (+3 transitivas): as 6 de `approach-actions.ts`; `declareCriterionAction`; `resolveUpdateRequestAction`; `registerObservedRelationshipReopeningAction`; `updateContactAction`; `archiveContactAction`; `updateAppointmentAction`; `setProfessionalPublicationStatusAction` (duplicata); `saveCruzamentoWeightsAction` (deprecada ADR-042 — deveria ter sido removida); + `addMandatoryFilterAction`/`addPreferenceAction`/`removeFilterAction` via componente órfão.
- **Componentes nunca renderizados:** `MandatoryFilters` (302 linhas — mata funcionalidade viva), `CuradoriaDecisionPanel` (testado, adiado v1.1), `ActivityFeed`, `EvidenceCard`, `ScrollActionLink`, `Skeleton`, 6 seções da Landing v2 (as mesmas seções que a ADR-033 mandou publicar — ver Fase 1), `mock-records.ts` (~430 linhas).
- **Tabelas sem leitura:** deliberadas (`compatibility_analyses`, `priority_weights`, `crm_cases`) e sem dono (`patient_priority_declarations`, `professional_communication/experience/career_entries/education_entries`, `method_subcriterion_options`; `cruzamento_weights` contradiz o próprio comentário "segue legível" — nada o lê).
- **Campos escritos e nunca exibidos:** `experience_level`, `intake_approach`, `availability_window`, `offers_continuous_care` — nunca aparecem na Mesa, no Relatório nem para a paciente (e são inescrevíveis desde que o formulário os perdeu — ver P0 do Admin).
- **Guard-rail furado:** `actions-have-callers.test.ts` cobre 4 de ~12 módulos de actions — exatamente o buraco por onde as órfãs passaram.

## 9. Funcionalidades ausentes ou incompletas (sem decisão registrada)

Download/visualização de documentos da paciente; painel de divergências do Admin; concessão de papéis operacionais na Equipe; permissões CRM/COA do Atendente; criação manual de lead; notificação do Profissional selecionado; canal de resposta do Profissional (divergência/atualização); acompanhamento pós-`PRIMEIRO_ATENDIMENTO_REALIZADO`; realimentação da Porta quando a informação pedida chega; marcos da jornada na linha do tempo; validação de arquivos; edição de nome/e-mail de paciente; filtros na fila do curador; vínculo agendamento CRM ↔ Connection.

## 10. Rotas e navegação (consolidado)

Ver §3. Adicionais: deep links cobertos por guard em página+layout (exceção: árvore `/atendimento` só no layout — única sem defesa em profundidade); breadcrumbs "CRM" (6 páginas) apontando para o redirect; nav de `/coa/{atendimento,concierge}` linkando `/admin/crm/*` cujo layout barra não-admin/concierge; `/coa/atendimento` com guard divergente layout×página; `/api/crm/leads` exige segredo **só em produção** (preview aceita POST anônimo).

## 11. Relação com a Auditoria 1

| Achado funcional | Relação com a Fase 1 |
|---|---|
| Atendente com ciclo completo de conversão | **Corrige** a Fase 1 (A8): o doc `PAPEL_ADMINISTRADOR` está defasado, não o produto — reclassificar como doc defasado |
| Mapa editável pós-reconhecimento | **Aprofunda** a Fase 1: a Invariante 28 está formalmente implementada (trigger existe) mas protege as tabelas que a ADR-042 aposentou — consequência funcional da migração de autoridade sem migração da proteção |
| `criterion_declarations` sem superfície | A Fase 1 já apontara a camada como "única peça viva que nenhum doc descreve" (§5.11); a Fase 2 mostra que tampouco tem UI de escrita — decisão ausente em dois planos |
| Catálogo com 4 fontes (Fase 1 §3.1) | Confirmado em superfície: o form do Protocolo usa a lista TS e o Mapa usa o banco **na mesma página** do admin |
| `markReportDelivered`/`saveReport`/fail-open blocklist | Fase 1 §5 (defeitos observados) — confirmados e ampliados (não-atomicidade da entrega; `emitted_at` fora da lista do trigger) |
| Órfãs de ADR (`saveCruzamentoWeightsAction`, schemas 0-100) | Decorrem da ADR-042 executada sem varredura de resíduos — mesma família do §5.4 da Fase 1 |
| Landing v2: 6 seções órfãs | As seções da ADR-033 **existem como componentes** e nunca foram montadas — reclassifica a divergência da Fase 1 de "não implementada" para "implementada e não publicada" |
| `/curador`, `/portal-paciente`, mocks | Código legado compilado — família da ADR-021 (congelamento inoperante) e da ADR-009 (multiplicidade de shells/rotas) |

## 12. Achados por gravidade (consolidado, com evidência)

### Críticos (7)
| # | Achado | Evidência | Certeza |
|---|---|---|---|
| C1 | Edição de profissional **apaga áreas de competência** a cada salvamento (form perdeu os campos; action segue chamando `replaceCompetencyDomains([])` que deleta e não reinsere); o teste unitário existente trava o comportamento como correto | `professional-profile-form.tsx:35-44,100-173` + `professional-actions.ts:275` + `professional-repository.ts:246-251` | alta |
| C2 | `/api/crm/leads` interceptada pelo middleware (fora de PUBLIC_PATHS) — lead do site institucional recebe 307→/login e **nunca chega** | `public-paths.ts` + `middleware.ts` matcher | alta |
| C3 | Sessão expirada no wizard → **"✓ Sua resposta foi salva."** com a action recusada e o erro engolido (cache local mitiga parcialmente, na mesma máquina) | `use-story-draft.tsx:207-211` + `autosave-indicator.tsx:20-27` | alta |
| C4 | Entrega **não-atômica**: seleção vira DELIVERED e, se o relatório for recusado pelo trigger, não há rollback — paciente com seleção entregue e relatório nulo = tela vazia | `actions.ts:276-287` + `patient-curadoria.ts:88` | alta |
| C5 | `SUPERSEDED` inalcançável: Perfil reconhecido é beco sem saída — índice impede segundo perfil, trigger impede corrigir o atual, nada escreve SUPERSEDED. **Invariante 28 inexequível** | `stage7:33,78-89`; grep de escrita = zero | alta |
| C6 | Ramo `APROXIMACAO_INTERMEDIADA` inteiro sem superfície (6 actions órfãs) — a escolha da paciente por aproximação intermediada **não produz nenhuma ação possível** da equipe | `approach-actions.ts:57-160`; grep consumidores = zero | alta |
| C7 | `markReportDelivered` sobrescreve `emitted_at` (fora da lista do trigger) — o carimbo real de emissão é destruído na entrega | `report-repository.ts:155-163` + `20260727110000:52-66` | alta |

### Altos (24 — síntese)
Mapa de Prioridades editável pós-reconhecimento (sem trigger no `case_priority_map`) · Avaliação técnica sem superfície (pendência perpétua; leitura da paciente vazia) · `MandatoryFilters` órfão (área do Case indefinível; rascunho assistido depende) · declaração de área terminal incorrigível na UI · seleção DELIVERED sem congelamento no banco · reabertura/regravação da Mesa sem guarda de servidor · concorrência da Mesa inexistente · entrega não idempotente · história `enviada→rascunho` não bloqueada · história enviada editável por URL com falsa confirmação · upload sem validação (3 actions) · sem download de documento da paciente · `/paciente/perfil` = conta (colisão de nome com o Perfil) · "remover" anexo só desanexa (reaparece em documentos) · funil CRM sem CHECK no banco · `cases.status` desconectado do fluxo real · `resolveUpdateRequestAction` órfã (pedidos nunca fecham) · notificações internas sem lista (só contador) · atendente sem permissões CRM/COA · divergências sem superfície admin (beco na porta de publicação) · equipe não concede atendente/concierge · profissional nunca sabe que foi selecionado · CRM (6 telas, 10 actions) com zero E2E · error boundaries ausentes em 6 segmentos + `ERR-` nunca chega ao usuário.

### Médios (seleção)
Guard divergente layout×página em `/coa/atendimento` · "Painel Concierge" aponta para redirect (página morta + item ativo em URL errada) · `curadoria_tecnica` rota duplicada · "etapa N de 7" (são 4) · "Salvar rascunho" ativo pós-emissão → erro cru · `hasContext/hasDocuments` não passados (checkbox de documentos sem documento) · narrativa editável pós-reconhecimento da história · admin barrado no Mapa por action (RLS e tela permitem) · conceito "sem informação" sem ação de pedir informação · reset de senha sem confirmação/notificação/autor · despublicação sem motivo · nome/e-mail de paciente ineditáveis · sem confirmação destrutiva no admin (transversal) · `em_verificacao` fantasma no TS · `lead-workspace` com âncora sem dívida registrada · memória da Mesa volátil vs copy · `/api/crm/leads` sem segredo fora de produção · linha do tempo sem os marcos · `/imprimir` inalcançável no formato canônico · chave possivelmente inconsistente em `alignment_professional_answers` · paginação client-side sem teto (2 listas) · colisão de nome `src/modules/concierge` (ACE) × papel Concierge.

### Baixos/Informativos (seleção)
Rótulo "Validação" residual (`profile-card.tsx:64`, ocorrência única) · `revalidatePath` para rotas mortas (5) · `ROLE_HOME` do curador via redirect · fila do curador sem filtros · módulos-promessa vazios (6, conforme ADR-004) · `justificativa` de reatribuição opcional · Case `WAITING→READY` exige repassar por `IN_REVIEW` · seed sem contas atendente/concierge (só bootstrap).

## 13. O que está aderente

- **O fluxo principal inteiro**, certificado e re-executável, com asserts de comportamento.
- **Autorização**: guard server-side em todas as 23 páginas admin e nas árvores de papel (página+layout); ~27 actions administrativas todas guardadas; RLS paciente-a-paciente verificada policy a policy (histórias, versões, documentos, storage, anexos com dupla posse, case, RPC de reconhecimento); `/acesso-negado` sem vazamento de informação; open-redirect mitigado no login.
- **Padrões exemplares**: locking otimista da história (com banner de conflito e recuperação local); gate de publicação de 5 condições com espelho de pendências em português sincronizado por contrato; compensação de upload em 3 passos com log de órfão; políticas de fontes (proveniência obrigatória para verificação e área); `practice_evidence` append-only com verificação otimista por versão; entrega da Curadoria invisível à paciente até a entrega humana; seleção com autoria, quarta opção impossível e "quem não participa, e por quê"; confirmações que dizem o que vai acontecer (reconhecimento, entrega, assumir case); estados vazios nomeados com próximo passo em praticamente todas as superfícies; responsividade funcional com nav mobile única e alvos ≥44px.
- **Máquinas com tripla proteção** (trigger + espelho TS + teste): Case, responsabilidade, Connection, Relationship, approach_attempts, história (parcial), Relatório (carimbos).

## 14. O que merece decisão

1. **Publicar ou remover o domínio sem superfície**: aproximação intermediada (C6), Avaliação técnica, filtros obrigatórios, resolução de pedidos, notificações internas — cada um é uma decisão de produto (a v1 opera sem isso?) hoje tomada por omissão.
2. **Onde mora cada guarda**: definir a política (banco+código, sempre? só banco?) para congelamentos — hoje é loteria por objeto (Relatório no banco, Seleção no código, Mapa em lugar nenhum).
3. **O ciclo de correção do Perfil reconhecido** (C5): implementar a supersessão prevista ou registrar formalmente que correção é impossível na v1.
4. **`cases.status`**: conectar ao fluxo real, ou aposentar como decorativo e assumir a `patient_case_overview` derivada de outra fonte.
5. **Papéis operacionais**: atendente nas permissões CRM/COA; concessão de atendente/concierge na Equipe; notificação do Profissional.
6. **Política de arquivos** (tipos/tamanho) e **download** da paciente.
7. **Nomenclatura**: `/paciente/perfil`, `DELIVERED`×4, `VALIDATED`×2, `AGUARDANDO_DECLARACAO`×`INFORMACAO_INSUFICIENTE`, módulo `concierge`.
8. **Limpeza de mortos**: `/curador/*`, `/portal-paciente/*`, `/admin/crm` raiz, mocks, actions deprecadas, componentes v2 da Landing (ou publicá-los — ADR-033).
9. **Cobertura**: E2E para CRM/atendimento/concierge/profissional; ampliar `actions-have-callers` para os 12 módulos; contas de teste para os 6 papéis no seed.

## 15. Conclusão objetiva

**"A cobertura funcional ainda possui lacunas."**

O caminho principal está completo, coerente e defendido — a certificação E2E é real e o que ela cobre é sólido. As lacunas estão nas bordas, e não são cosméticas: dois defeitos corrompem ou perdem dados silenciosamente (C1, C7), dois quebram promessas feitas à paciente na tela (C4, C6), um torna o produto surdo ao próprio canal de entrada (C2), um mente para a paciente sobre o destino do que ela escreveu (C3) e um torna inexequível uma invariante do Método (C5). O padrão estrutural por trás da maioria dos achados é um só: **camadas que andaram em velocidades diferentes** — o banco à frente da UI (domínio órfão), a UI à frente do banco (guardas só no cliente), e as ADRs à frente das varreduras de resíduo. Nenhuma correção foi proposta em código; a lista da §14 existe para virar decisão, não patch.
