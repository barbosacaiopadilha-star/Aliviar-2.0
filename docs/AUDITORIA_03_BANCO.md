# AUDITORIA 03 — BANCO DE DADOS, SEGURANÇA E INTEGRIDADE

**Data:** 2026-08-02 · **Fase:** 3 da Auditoria Geral (após `AUDITORIA_01_DOMINIO.md` e `AUDITORIA_02_FUNCIONAL.md`)
**Natureza:** inspeção somente — nenhuma escrita foi executada no banco (nem em transação revertida); nenhum código, migration, policy ou dado foi alterado.
**Pergunta única:** *o banco preserva as regras do domínio, a segurança, a consistência transacional e a integridade, mesmo quando a interface é contornada?*

## 1. Resumo executivo

**Veredicto: o banco ainda possui riscos de integridade ou segurança.**

O alicerce é bom — melhor do que o esperado: RLS ligada em 100% das 71 tabelas, `anon` com **zero** grants de tabela, zero SQL dinâmico, zero recursão de policy, ledger 69/69 em paridade perfeita com zero drift na amostra, e as três funções mais sensíveis (`acknowledge_priority_profile`, `transfer_case_responsibility`, `discard_case_admin`) corretas e bem construídas. Os testes negativos de acesso cruzado existem e são bons.

Os riscos estão em quatro famílias:

1. **Invariantes do Método sem guarda de banco** (Parte 3): das 20 invariantes verificadas na definição viva, 3 estão **desprotegidas** (seleção DELIVERED mutável; Mapa reconhecido editável; `emitted_at`/`delivered_at` fora da lista congelada), 1 é **contraditória** (SUPERSEDED: o banco proíbe o caminho certo e permite o errado) e 6 são parciais. O contorno via PostgREST com JWT legítimo é real em todas elas.
2. **Atomicidade** (Parte 4): ~22 operações multi-escrita sem transação, **uma** com compensação. Dois riscos críticos: a entrega (estado parcial irreversível voltado ao paciente, com um caminho que **retorna sucesso numa falha real** — erro descartado em `report-repository.ts:169`) e a conversão de lead (paciente-fantasma notificado + operador travado para sempre).
3. **Catálogo com dois donos** (Parte 7): em runtime, **quem manda é o TypeScript** — a tabela de 166 opções não é lida por nenhum código, `practice_evidence.subcriterion_code` não tem FK, nada confronta `options[]` com as opções canônicas, 36 códigos já divergem, e o catálogo em si não tem nenhuma proteção de imutabilidade (a norma é menos protegida que o dado que ela normatiza).
4. **Auditoria bipolar** (Parte 10): onde houve migration pensada para rastro, o registro é exemplar (`case_responsibility_changes`, divergências, `approach_attempts`); onde é `update`/`upsert` no TS, é zero — reset de senha **sem nenhum registro**, publicação/despublicação sem histórico, documentos com hard delete sem tombstone, reconhecimento e emissão/entrega **sem autor**.

Adicionalmente, **o dossiê de migração remota está desatualizado e não deve ser autorizado como está** (§12), e **os dados locais são 100% sintéticos e majoritariamente não marcados como tal** (§10).

## 2. Escopo e método

Seis frentes independentes sobre o banco local vivo (PostgreSQL 17.6, container `supabase_db_aliviar-conexao`), todas somente-leitura: (1) inventário + paridade; (2) matriz de invariantes (definições vivas via `pg_get_*`); (3) transações e atomicidade (código + `prosrc`); (4) RLS/grants/SECURITY DEFINER policy a policy; (5) Catálogo + qualidade de dados (contagens vivas); (6) dossiê remoto + observabilidade. Falsos positivos foram descartados com prova (registrados na §7).

## 3. Inventário (síntese)

Schema `curadoria`: **71 tabelas** (todas com RLS), 1 view (`patient_case_overview`, `security_invoker=true`), **66 functions** (44 SECURITY DEFINER, todas com `SET search_path`; 22 invoker, 13 sem search_path — concentradas no bloco stage5/Connection que escapou dos hardenings de 27/07), **63 triggers**, **155–191 policies** (contagem varia por método; matriz completa na §7), 8 enums, 187 índices (19 parciais), 166 FKs, 157 CHECKs. `public`: **vazio** (migração legado concluída; `migrations-legacy-public/` inerte por convenção de diretório). Storage: 2 buckets privados, **ambos com `file_size_limit` e `allowed_mime_types` NULOS**. Grants: `authenticated` amplo sob RLS; **`anon` com zero grants de tabela** (a trava mais forte do sistema); 11 funções invocáveis por `anon` de fato (corrige o backlog S1 — nenhuma das sensíveis).

## 4. Paridade migrations × schema × TypeScript

- **Ledger 69/69, ordem monotônica, sem duplicatas, sem arquivo órfão.** Zero drift nos 5 objetos sensíveis comparados byte a byte (trigger de transição do Case, RPC de reconhecimento, policy de update da história, CHECKs da declaração de área, índice único de rascunho). O banco local é reconstrução fiel das migrations.
- **Não existem tipos TS gerados** — o projeto tipa à mão por módulo, **sem nenhum mecanismo que detecte divergência enum↔banco**. É o vetor exato do achado: `verification_status` com valor fantasma `em_verificacao` (nunca existiu em migration alguma) e omissão dos reais `nao_localizado`/`desatualizado` em **dois** arquivos (`professional-repository.ts:278`, `publication-pendencies.ts:30`), enquanto `fontes.ts:210` tem a lista correta. Gravação com o fantasma = erro de cast em runtime; leitura dos reais = quebra de narrowing. **Alto, certeza alta.**
- SQL soltos não versionados em `supabase/` (rollbacks manuais, `schema-curadoria-producao.sql`) — fora do ledger, registrados como scripts operacionais.

## 5. Matriz de invariantes (20 verificadas — veredito por linha)

| # | Invariante | Status | Furo (quando há) |
|---|---|---|---|
| 1 | Um rascunho por paciente | **protegida** | índice parcial absoluto |
| 2 | História enviada não regride | **parcial** | trigger só protege `data`; `status enviada→rascunho` passa pela policy do próprio paciente via PostgREST |
| 3 | Perfil VALIDATED não editável | **parcial** | trigger protege `filters`/`weights` (tabelas aposentadas), **não a própria `priority_profiles`**: curador faz VALIDATED→DRAFT sem rastro |
| 4 | Correção exige SUPERSEDED | **contraditória** | nada escreve SUPERSEDED; o índice `one_active_per_case` **bloqueia o caminho certo** (novo perfil) e não bloqueia o errado (#3) |
| 5 | Seleção = exatamente 3 | **parcial** | trigger é `BEFORE UPDATE` na transição p/ DELIVERED — INSERT já-DELIVERED com 0 opções passa; DRAFT com 0 opções é aceito |
| 6 | Seleção DELIVERED imutável | **desprotegida** | nenhum trigger; `DELIVERED→DRAFT + delivered_at=null` satisfaz o CHECK e tira a Curadoria da paciente |
| 7 | Pareceres/composição obrigatórios | **parcial** | opções bem guardadas por CHECKs; **`composition_rationale` é NULLABLE** — emitir sem composição passa |
| 8 | emitted/delivered imutáveis | **desprotegida** | ambos FORA da lista congelada de `assert_report_lifecycle`; `markReportDelivered` regrava `emitted_at` (comentário do próprio trigger admite) |
| 9 | Entrega exige Relatório válido | **parcial** | zero acoplamento no banco; a action entrega a seleção e, sem relatório, **entrega assim mesmo** |
| 10 | delivered_at idempotente | **parcial** | relatório tem `.is(null)`; seleção não — reentrega move a data |
| 11 | Mapa reconhecido imutável | **desprotegida** | policy `FOR ALL` sem condição de estado; nenhum trigger pós-VALIDATED |
| 12 | Declaração de área: autor/estado/justificativa | **protegida** | CHECKs condicionais vivos no banco (INCOMPATIVEL/PARCIAL exigem rationale) |
| 13 | Publicado cumpre gates | **protegida** | 5 condições vivas; curto-circuito para já-publicado é decisão documentada (mas ver §10 anomalia #8: inativo continua publicado) |
| 14 | Competências não somem | **desprotegida** | sem trigger/PK; `replaceCompetencyDomains` deleta e retorna cedo com `[]` (= C1) |
| 15 | Filtros obrigatórios persistíveis | **protegida no banco** | tabela funcional; lacuna é só de superfície (Fase 2) |
| 16 | Documentos/anexos sem órfãos | **protegida** | FKs CASCADE + dupla posse no INSERT (resíduo: órfão de storage fora do alcance de FK) |
| 17 | Paciente restrito ao próprio | **protegida** | policies verificadas |
| 18 | Curador só nos seus Cases | **protegida** | ampliação da fila (20260725230458) é SELECT-only de Case livre; escrita só via RPC |
| 19 | Papéis operacionais | **parcial** | admin é bypass total da cadeia de Curadoria sem trilha própria |
| 20 | Demo/fixture não contamina | **protegida** | com TRIGGER (`assert_professional_allowed_in_selection`), não só query — bidirecional |

## 6. Transações e atomicidade (síntese + ranking)

Premissa confirmada: PostgREST = 1 transação por statement; atomicidade real só em RPC/trigger. **~22 operações multi-escrita sem transação; 1 com compensação** (upload de anexo — a melhor do código-base, com furos residuais logados). O sistema **sabe fazer certo** (`submitStory` com locking otimista, `declareAreaAction` upsert, `transfer_case_responsibility` com `FOR UPDATE`, módulo Connection 100% RPC) — o padrão é aplicado de forma desigual.

**Ranking de risco:**
1. 🔴 **Entrega** (`deliverSelectionAction`) — 2 escritas sem transação; estado parcial P1 = paciente com 3 nomes e nenhum documento; **P2 = `getReportBySelection` descarta o `error` e a action retorna `success:true` numa falha real**; P3 = entrega sem relatório algum. Terminal por design ⇒ estado parcial irreversível pela aplicação; zero `case_events`; detectável só por JOIN manual que ninguém roda.
2. 🔴 **Conversão de lead** — `createPatientAccount` (2 sistemas, sem compensação) encadeado com RPC que **recusa por design depois** de a conta existir: paciente-fantasma **recebe notificação de boas-vindas**; segunda tentativa trava para sempre (e-mail duplicado) sem saída pela UI.
3. 🟠 Seleção dos três (`saveSelection`) — DELETE sem checar erro + INSERT recusável por trigger ⇒ seleção com 0 opções (trabalho clínico apagado; salvo do paciente pela guarda tardia).
4. 🟠 Update de profissional + competências (C1) — DELETE sem checar erro; perda silenciosa; concorrência intercalada produz união de conjuntos.
5. 🟠 **`open_case_from_lead` — bug de idempotência dentro de RPC correta**: grava `active_case_id = null` (hard-coded) em vez do id criado ⇒ a guarda de duplo clique nunca funciona ⇒ **duplo clique = Case e história duplicados**.
6. 🟠 Criação de paciente — usuário auth órfão sem papel possível; senha exibida uma vez e perdida; sem `deleteUser` compensatório (hoje: 0 órfãos).
7. 🟡 `setPatientAccessAction` (3 escritas, 2 sistemas, **sem try/catch**), `createCase` (+`case_events` com insert sem checagem de erro — buraco silencioso no histórico), CRM (6 funções com auditoria em statement separado — furo de compliance permanente).

Antipadrão transversal: **erro descartado** em 4 posições críticas (`curadoria/repository.ts:333`, `professional-repository.ts:249`, `cases/repository.ts:214+`, `report-repository.ts:169` — este último é o mecanismo do P2).

## 7. RLS e grants (síntese)

Matriz completa tabela × comando × papel levantada (155 policies). Resultados: **zero** tabela sem RLS; **zero** policy `using=true` de escrita; **zero** recursão (grafo verificado acíclico); **zero** grant DELETE órfão; UPDATEs sem `WITH CHECK` explícito são seguros (Postgres reaplica o USING). Falsos positivos descartados com prova. Achados reais:

- **F2 (alta)** — paciente pode **deletar/atualizar documento já anexado a um Case em curadoria** (storage policy `FOR ALL` + DELETE na tabela): destruição de evidência clínica sob o Curador; única violação real de append-only no schema.
- **F1 (alta)** — buckets sem `file_size_limit`/`allowed_mime_types`: o banco **não compensa** a ausência de validação em código (Fases 2). Upload de qualquer tamanho/MIME por paciente autenticado.
- **F3 (média-alta)** — `/api/crm/leads` grava com **service role** e o segredo só é exigido em `production`: preview/staging aceitam POST anônimo.
- **F4 (média)** — `profiles_select_paciente_por_curador`: qualquer curador lê o `profiles` de **todo** paciente com Case (mitigado: só display_name/avatar).
- **F5 (média)** — 6 RPCs invoker do bloco Connection expostas a PUBLIC aceitam `occurred_at`/`recorded_at` **do chamador**: o ator não é forjável (RLS), a integridade temporal da auditoria é.
- **F7 (baixa-média)** — `curator_observations_update_own` com `WITH CHECK` explicitamente mais fraco que o USING (permite "empurrar" observação para Case alheio).
- F9 (baixa) — profissional vê a linha do próprio documento e recebe 403 no download (policies de tabela × storage divergem).

## 8. Funções SECURITY DEFINER

44 no schema, **todas** com `SET search_path`; owner `postgres`; **zero** SQL dinâmico; **zero** referência de tabela não qualificada. As três críticas — `acknowledge_priority_profile` (autorização na 1ª linha, retorno mínimo), `transfer_case_responsibility` (`FOR UPDATE`, motivo obrigatório, validação de papel do destino), `discard_case_admin` (EXECUTE só service_role, anti-personificação, audita antes de deletar) — **corretas**. Higiene menor: `has_role`/`is_*` executáveis por PUBLIC (inertes para anon — `auth.uid()` nulo); 3 padrões de search_path convivendo. Único cliente service-role no código (`admin.ts`, `server-only`) com o contrato de guarda **seguido em 13 de 14 call sites** — a exceção é o endpoint de leads (F3).

## 9. Catálogo 1.0.0 no banco

Contagens vivas **batem** (28 ativos, 4/5/5/12/2, 6 inativos 0.9.0, 166 opções). Mas:

- **Fonte autoritativa em runtime: o TypeScript.** `method_subcriteria` é lida por **um** único ponto (Mapa de Prioridades — a única superfície com FK+trigger); `method_subcriterion_options` tem **zero leituras** no código — as 166 opções são, no banco, ornamentais. As respostas do profissional (`practice_evidence`) gravam `subcriterion_code` **sem FK** e `options text[]` **sem qualquer validação contra as opções** — 36 códigos já divergem entre banco e TS, e nada perceberia. **Duas faixas de custo simultâneas são um estado que o Postgres aceita de bom grado** (o array plano perde o campo `field`).
- **Imutabilidade do catálogo: inexistente.** Nenhum trigger em `method_subcriteria`/`options`; aposentadoria é booleano sobrescrevível sem autor; a service key pode reescrever o catálogo inteiro sem rastro. A norma é menos protegida que o dado que normatiza (contraste: `practice_evidence` é append-only por trigger).
- **Ordem**: o `UNIQUE("group",display_order)` garante ordem por **grupo** (7), não por eixo (5); o eixo PRATICA_E_TRAJETORIA aparece fatiado em 3 blocos por ordem alfabética de grupo, com colisões de `display_order` dentro do eixo — **não existe ordem canônica do eixo no banco** (confirma e quantifica o D2 da Fase 1).
- `evidence_source` sem CHECK (confirmado); `texto_guiado`/`reconhecida_pelo_curador` são valores de enum-CHECK **nunca usados**; `axis` NULLABLE (subcritério ativo sem eixo é inserível).
- **`catalog_migration_log`: 0 linhas** — a rastreabilidade 0.9.0→1.0.0 prometida pela tabela não existe em dado algum (a migração local de dados não encontrou o que migrar; a tabela nunca foi alimentada).

## 10. Qualidade dos dados

**Achado-moldura: o banco local não tem nenhum dado real nem seed de demonstração.** 38 contas (5 papéis de teste + 31 `paciente.fluxo.<ts>`), 165 profissionais criados em 2026-08-02 entre 03:05 e 07:52 — **os "156 da Mesa" são 31 execuções E2E × 5 sintéticos acumulados sem limpeza**, e **não estão marcados**: `is_demo=false`, `is_test_fixture=false` em 161 deles (só as 4 Fixtures de certificação estão corretas). Indistinguíveis de dado real pelas flags (anomalia #14 — alta).

Contagens e anomalias principais (queries no relatório da frente 5):
- **#1 — C7 em dado**: o único relatório entregue tem `emitted_at == delivered_at` byte a byte, e a seleção foi marcada entregue **30ms antes** do relatório — a cadeia emitir→entregar colapsou num commit.
- **#2 — estados independentes em dado**: 2 seleções `DRAFT` com relatório `emitted/approved/reviewed` (resíduo das execuções E2E interrompidas no passo 11 — e prova viva de que nada concilia os dois estados).
- **#3 — C1 em dado**: **158 de 162 publicados com ZERO competency areas** (a tabela inteira tem 4 linhas).
- **#4**: camada de evidência de prática vazia — 161/162 publicados sem nenhuma `practice_evidence`; `professional_subcriterion_map` com 0 linhas. O lado profissional do Catálogo nunca foi preenchido.
- **#5**: `profile_id` NULL em **100%** dos 165 perfis — nenhum profissional está ligado a conta; as policies `*_select_own` do profissional nunca retornam linha para ninguém.
- **#6 — A4 em dado**: 20 Cases, **todos `NEW`**, `current_stage/started_at/responsible_role` NULL em 100% — inclusive o Case entregue à paciente.
- **#7**: 58 `case_discarded` em `audit_logs` × 0 Cases descartados — coerente com o desenho (descarte é hard-delete auditado, ADR-038) e com o uso intensivo dos testes de integração locais; registrado para que ninguém leia como divergência.
- **#8**: 2 perfis `inativo` continuam `publicado` (o gate não olha `status`; inativar não despublica).
- **#10**: 3 perfis com o mesmo CRM/SP (2 publicados) — **não existe UNIQUE em (crm, crm_uf)** nem em `professional_identifier`.
- **#11**: funil real: 27 histórias enviadas → 20 Cases → 18 Mapas (18×28 completos) → 4 seleções (todas ×3) → 1 entrega; 7 enviadas jamais viraram Case, sem estado que o sinalize.
- **#13**: autoria — `selected_by/declared_by/uploaded_by` 100% preenchidos; mas 35/35 declarações com `confirmed_by_curator=false`, 4/4 relatórios sem `generator_version/assisted_generated_at`, 2/2 evidências `nao_verificado`.
- Integridade referencial: **limpa** (0 órfãos de FK, 0 códigos aposentados referenciados — no `practice_evidence` por acaso, não por regra).

## 11. Validação dos críticos das Fases 1–2 no banco

| Crítico | O banco… | Auditoria | Recuperação |
|---|---|---|---|
| C1 competências apagadas | **permite e agrava** (CASCADE, sem versão) | não | não — perdido |
| C4 entrega não-atômica | **permite** (zero acoplamento; sem transação) | não (zero case_events) | manual, se alguém rodar o JOIN |
| C7 emitted_at sobrescrito | **permite e silencia** (fora da lista do trigger — comentário admite) | não | não — data original perdida |
| Mapa pós-reconhecimento | **permite** (policy FOR ALL) | só `updated_at` | não |
| SUPERSEDED | **silencia** (estado morto; índice bloqueia o caminho certo) | — | — |
| Seleção DELIVERED mutável | **permite** (CHECK satisfeito por DRAFT+null) | não | reversível, invisível |
| História regressível | **permite** | **parcial** — `patient_story_versions` preserva | sim, via versões |
| Declaração terminal | upsert sobrescreve; **sem append-only** (assimetria com practice_evidence) | não | não |
| Fail-open blocklist | **nada no banco** (gate só na transição p/ publicado; nenhum trigger de seleção olha divergências) | não | — |
| Upload sem validação | **confirmado**: buckets NULL/NULL | não | — |
| Endpoint de leads | service role; segredo só em production | crm_audit via RPC quando funciona | — |
| Aproximação sem superfície | banco pronto e exemplar (RPCs, carimbos, CHECKs) — inexecutável | sim (quando executado) | — |
| Catálogo TS×banco | **agrava**: sem FK/validação, a divergência grava silenciosamente | não | difícil (sem proveniência de opção) |

## 12. Dossiê remoto (Parte 9)

**NÃO PRONTO para autorização como está.** O SQL das cinco migrations é sólido (tudo transacional, falha fechada, sem DELETE de conteúdo; um arquivo = uma transação; sem comandos não-transacionais), e a ordem **deploy primeiro, migrations depois** está correta (código antigo × schema novo **quebra duro** — exceção no Mapa; código novo × schema antigo degrada suave). Mas o documento:

1. **Bloqueante:** desconhece a `20260802130000` (anexo sem recursão) — seria aplicada sem análise, backup ou rollback escrito.
2. **Bloqueante:** afirma "exatamente as duas migrations pendentes"; **pendem cinco** (remoto em `20260801220000`).
3. **Alto:** backup (§5) não inclui `patient_stories`/`patient_documents`; validação (§8) não cobre as migrations 3–5 (índice, policy nova, function, policy do Mapa) nem a prova funcional do 42P17.
4. **Médio:** sem cenário de aplicação parcial (se a #3 abortar com 1–2 aplicadas: catálogo novo vigente, anexo ainda quebrado, reconhecimento impossível — não descrito); rollback da #3 afirmado "sem perda" com base em contagem que envelhece; o `raise` da #3 não nomeia ids.
5. Tempo total do SQL: **< 5s** (volumes remotos mínimos); a janela é dominada por deploy+backup. Janela deploy↔migrations deve ser minutos: durante ela o anexo segue quebrado e Mapa (26) × Protocolo (28) divergem à vista.

## 13. Observabilidade (Parte 10)

Padrão bipolar. **Exemplares** (ator + estados + motivo obrigatório + append-only por trigger): `case_responsibility_changes`, `verification_divergences`, `approach_attempts`, `practice_evidence`, descarte de Case. **Sem rastro nenhum**: reset de senha (nada, em lugar algum — crítica), publicação/despublicação (só `updated_by` sobrescrito — crítica), exclusão/desanexo de documento (hard delete — crítica); reconhecimento do Perfil **sem autor** e sem evento; emissão e entrega **sem autor** (e a entrega destrói `emitted_at`); declaração de área e seleção sobrescritas por upsert/delete+insert sem versão; mudança de status de Case sem motivo (a assinatura nem aceita). `audit_logs` cobre exatamente 3 ações (papéis + descarte), todas escritas pelo banco — **zero inserts no TS**. IP/sessão: não registrados em lugar nenhum (só GoTrue, fora do alcance). `case_events` é promessa não cumprida: os cinco atos do Método não o escrevem.

## 14. Achados por gravidade

**Críticos (6):** entrega não-atômica com falha-como-sucesso (P2) · conversão de lead (fantasma notificado + travamento permanente) · `emitted_at`/`delivered_at` fora do congelamento + sobrescrita na entrega (confirmado em dado) · seleção DELIVERED sem qualquer guarda de banco · Mapa reconhecido editável (Invariante 28 sem objeto) · reset de senha/publicação/exclusão de documento sem qualquer auditoria (tríade administrativa irreversível às cegas).

**Altos (12):** SUPERSEDED contraditório · C1 no banco (sem trigger/versão; 158/162 publicados sem competência) · história `enviada→rascunho` · F2 (paciente deleta documento anexado a Case) · F1 (buckets NULL/NULL) · catálogo com dois donos e opções ornamentais (36 códigos divergentes graváveis em silêncio; duas faixas de custo aceitas) · catálogo sem imutabilidade/autoria · enum fantasma `em_verificacao` em 2 arquivos (sem geração de tipos) · `open_case_from_lead` idempotência quebrada (duplo clique duplica Case) · dossiê remoto desatualizado (2 bloqueantes) · 161 profissionais E2E não marcados como sintéticos · perfis `inativo+publicado` (gate não olha status).

**Médios (seleção):** F3 (leads sem segredo fora de produção) · F4 (curador lê profiles de todo paciente com Case) · F5 (timestamps forjáveis nas 6 RPCs PUBLIC) · 6 funções stage5 sem search_path · `composition_rationale` nullable · `enforce_selection_has_three` UPDATE-only · duplicidade de CRM sem UNIQUE · `catalog_migration_log` vazio · `evidence_source`/`field`/`detail_kind` sem CHECK · CRM com auditoria em statement separado · createCase com eventos silenciosamente perdíveis · 7 histórias enviadas sem Case e sem estado · F7 (`WITH CHECK` enfraquecido) · trigger `assert_publication_requirements` com curto-circuito indocumentado no dossiê · `crm=' '` passa no banco e não na UI.

**Baixos/informativos:** F8/F9 · 3 padrões de search_path · `migrations-legacy-public` por convenção · buracos de `display_order` reservados · `#7` (58 descartes auditados = uso de teste, coerente com ADR-038) · notificações 100% não lidas (coerente com E2E).

## 15. O que está protegido (e bem)

RLS universal com `anon` zerado; história única (índice absoluto); dupla posse de anexos; gate de publicação de 5 condições vivas; anti-contaminação demo/fixture **por trigger bidirecional**; declaração de área com justificativa condicional **no banco**; máquinas de Case/Connection/Relationship/approach com trigger+espelho+teste; `transfer_case_responsibility` e `discard_case_admin` como referência de como escrever RPC sensível; view com `security_invoker`; ledger em paridade perfeita e zero drift; testes negativos de acesso cruzado reais e numerosos; locking otimista da história; `patient_story_versions` como única rede de recuperação existente — e funciona.

## 16. O que pode ser contornado (síntese de contorno por JWT legítimo via PostgREST)

Paciente: regredir a própria história enviada e editá-la; deletar documento anexado a Case; subir arquivo de qualquer tipo/tamanho. Curador (ou admin): reverter Perfil VALIDATED→DRAFT e reeditar tudo sem rastro; editar o Mapa reconhecido; mutar/reverter seleção DELIVERED; reemitir sobrescrevendo `emitted_at`; redeclarar área apagando o juízo anterior. Qualquer authenticated: chamar as 6 RPCs de Connection com timestamps forjados (ator protegido). Service key: reescrever o catálogo inteiro sem rastro. Anon: **nada** (zero grants) — exceto o endpoint de leads fora de produção.

## 17. Decisões necessárias

1. **Política de guarda**: quais invariantes do Método DEVEM ter trigger/constraint (proposta implícita da evidência: itens 2, 3, 5, 6, 8, 9, 11, 14 da matriz — hoje é loteria por objeto).
2. **O ciclo SUPERSEDED** (Invariante 28): implementar a supersessão ou revogá-la formalmente.
3. **Fonte única do Catálogo**: banco autoritativo (FK + validação de opções + imutabilidade + vigência com autor) ou TS assumido como fonte com o banco rebaixado a depósito — o estado atual (dois donos divergentes) é o pior dos mundos.
4. **Transações**: promover entrega, seleção, conversão de lead e criação de paciente a RPCs (o repositório já tem o padrão pronto no módulo Connection).
5. **Auditoria mínima administrativa**: reset de senha, publicação/despublicação, exclusão de documento, reconhecimento (autor), emissão/entrega (autor).
6. **Dossiê remoto**: reescrever para as 5 migrations (backup+validação+parcialidade) antes de qualquer autorização.
7. **Higiene de dados locais**: marcar/limpar os 161 sintéticos (decisão de como marcar execuções E2E daqui em diante — flag própria? sufixo?); vincular `profile_id` dos profissionais; UNIQUE de CRM.
8. **Hardening residual**: F1–F5, search_path do stage5, segredo de leads obrigatório, geração de tipos do banco (ou teste de paridade enum↔banco).

## 18. Veredicto

**"O banco ainda possui riscos de integridade ou segurança."**

Com precisão: a **segurança perimetral** (RLS, grants, funções sensíveis, isolamento entre pacientes e entre curadores) está sólida e testada — não foi encontrada nenhuma via de acesso indevido a dado alheio, e `anon` está a zero. Os riscos reais são de **integridade interna sob credencial legítima**: as invariantes que o Método declara inegociáveis (imutabilidade do reconhecido, do entregue, do emitido; exatamente três; um Perfil corrigível só por supersessão) **não existem como objetos de banco** — existem como comportamento de UI e, às vezes, de action. A Fase 2 mostrou que a interface anda na frente do banco; esta fase mostra o custo: tudo que a interface promete como permanente é, no banco, reversível em silêncio e sem autor. Somam-se a isso a atomicidade ausente nas quatro operações que mais importam e um catálogo canônico cuja cópia com constraints é justamente a que ninguém consulta. Nada disso é irrecuperável — o repositório já contém, em `case_responsibility_changes`, `practice_evidence` e no módulo Connection, o gabarito exato de como cada uma dessas proteções se escreve.

*Nenhuma correção foi proposta em código, nenhuma migration foi criada, nenhum dado foi alterado.*
