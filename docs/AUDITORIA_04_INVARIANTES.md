# AUDITORIA 04 — INVARIANTES, GOVERNANÇA E LIMITES DO SISTEMA

**Data:** 2026-08-02 · **Fase:** 4 da Auditoria Geral (após Fases 1–3)
**Natureza:** inspeção somente. Único artefato novo: este documento.
**Perguntas:** *quais regras jamais podem ser violadas?* e *quem garante cada uma?*

**Método.** Duas varreduras novas (inventário das invariantes **declaradas** nos documentos normativos; decisões silenciosas em `src/` + DDL) somadas à evidência viva das Fases 1–3 (matriz de 20 invariantes com definição de banco, ~22 operações sem transação, RLS policy a policy, censo de dados). Convenção de camadas: **B**anco (trigger/constraint/policy/índice/RPC) · **S**ervidor (action/repository) · **C**liente (React) · **T**este.

---

## 1. Mapa completo das invariantes

O corpo normativo declara **~160 invariantes**: Ontologia §6 (36 numeradas: Existência 1–11, Autoria 12–15, Quantidade 16–19, Natureza 20–27, **Imutabilidade 28–32**, Informação 33–36), Architectural Invariants (19), Engine (13 inconsistências I-01..I-13 + 6 barreiras), Fundamentos (P1–P13 + 10 proibições do Cap.14), Constituição (9 princípios + 6 restrições absolutas), Produto (15), UX (13), Modelo v1.0 (~14 regras), ADRs declarativas (020, 025, 038, 041, 042, 044). O inventário completo por domínio, com traço de implementação linha a linha, está no relatório da varredura; a matriz da §2 consolida as executáveis.

Distribuição do inventário: **~35 plenamente mecanizadas** (banco ou banco+servidor+teste) · **~45 parciais** (uma camada só, geralmente servidor ou cliente) · **~25 puramente textuais** (nenhum traço em camada alguma) · **~15 aposentadas por ADR mas ainda declaradas como vigentes nos docs** (soma-100, cruzamentos 0–100, C-01..C-06) · o restante são princípios de processo não mecanizáveis.

## 2. Matriz — Regra × camada que protege × camada que não protege × risco

### 2.1 Núcleo do Método (as que jamais poderiam ser violadas)

| Regra | Protege | NÃO protege | Risco |
|---|---|---|---|
| História única em rascunho | **B** (índice parcial) + S + T | — | nenhum — inviolável |
| História enviada imutável | B-parcial (só `data`) + C | **B para `status`** (enviada→rascunho passa) | reversão silenciosa; recuperável via `patient_story_versions` |
| Perfil reconhecido imutável (ONT-28) | **nenhuma camada no modelo vigente** — trigger protege as tabelas aposentadas | B, S | VALIDATED→DRAFT sem rastro; **Mapa (`case_priority_map`) editável pós-reconhecimento** |
| Correção exige novo Perfil (SUPERSEDED) | — | **todas** — e o índice `one_active_per_case` **bloqueia o caminho certo** | invariante contraditória: o único caminho praticável é o proibido |
| Exatamente 3 opções | B (trigger na entrega + CHECKs position/unique) + S + C + T | B para INSERT já-DELIVERED; DRAFT com 0 opções | defesa em profundidade quase completa |
| Seleção entregue imutável | S (uma linha de repository) + C | **B — nenhum trigger** | DELIVERED→DRAFT via PostgREST; retira a Curadoria da paciente |
| Relatório entregue imutável (ONT-29) | B-parcial (opções congeladas; conteúdo pós-emissão) | **B para `emitted_at`/`delivered_at`** (fora da lista congelada — a entrega sobrescreve a emissão, confirmado em dado) | perda irrecuperável do carimbo real |
| Entrega exige Relatório emitido | leitura (delivery-contract) | **escrita: nenhuma** — sem relatório, a action entrega assim mesmo | estado parcial voltado à paciente (C4) |
| Nenhum score/ranking/soma | S (motor puro) + T (testes pinam ausência) + vocabulário proibido | resíduos no schema (`internal_score`, `band`); ordenações implícitas (§9) | forte em código; alfabético/ordem-do-select comunicam ranking por acidente |
| Reconhecimento é ato da paciente | **B (RPC com guarda na 1ª linha)** + S + T | autor não registrado (só `validated_at`) | inviolável quanto ao ator; cego quanto à trilha |
| Publicado cumpre 5 gates | **B (trigger vivo)** + S (espelho) + T | pós-publicação (curto-circuito por desenho; `inativo+publicado` existe em dado) | forte na entrada, sem revalidação contínua |
| Demo/fixture nunca alcança paciente | **B (trigger bidirecional)** + S + T | dados E2E não marcados (161 perfis com flags de produção) | a guarda é boa; a disciplina de dados, não |
| Escolha só do paciente (ONT-14) | **B (exception na RPC)** + RLS | — | inviolável |
| Escolha imutável (ONT-30) | — | **B tem GRANT UPDATE + policy de UPDATE ao próprio paciente** | doc e banco em contradição direta (correção enquanto DECISAO_REGISTRADA é desenho — mas a Ontologia não o prevê) |
| Médico 1× por Relatório | **B (unique)** + S | — | inviolável |
| Declaração de área com autor+justificativa condicional | **B (CHECKs vivos)** + S | histórico (upsert sobrescreve o juízo anterior) | estado atual protegido; auditoria zero |
| Tentativa terminal = linha nova (ADR-044) | **B (trigger + índice parcial + CHECKs de coerência)** + T | superfície (inexecutável — Fase 2) | o gabarito de como proteger; sem botão |
| Competências não somem | — | **todas** (delete antes do guard; sem trigger; sem versão) | C1 — perda silenciosa confirmada em dado (158/162 publicados a zero) |
| Um VALIDATED de review por Caso (ADR-025) | **B (índice único parcial)** + T | — | inviolável (pipeline aposentado) |
| Case/notas/eventos append-only | B (ausência de policy UPDATE/DELETE + triggers dedicados) | documentos do paciente (**deletáveis mesmo anexados a Case** — F2) | única violação real de append-only |

### 2.2 Regras de acesso (as invioláveis de verdade)

Paciente↔paciente, curador↔curador (por Case), profissional→próprio, `anon`→**nada**: **B (RLS + funções de guarda) + T (testes negativos reais)**. Nenhum contorno encontrado. Ressalvas: F4 (curador lê `display_name` de todo paciente com Case), admin como bypass total sem trilha própria, timestamps forjáveis nas 6 RPCs PUBLIC (ator protegido, tempo não).

## 3. Estados finais — reversibilidade

| Estado final | Pode voltar? | Quem permite | Banco impede? | Servidor impede? | Cliente | Trilha | Justificativa obrig. |
|---|---|---|---|---|---|---|---|
| História `enviada` | **sim** (status) | policy do próprio paciente | não | não | esconde | versões (parcial) | não |
| Perfil `VALIDATED` | **sim** | policy FOR ALL do curador/admin | não | não | esconde | **nenhuma** | não |
| Seleção `DELIVERED` | **sim** | idem | não | 1 linha de repo | esconde | nenhuma | não |
| Relatório emitido | conteúdo não; **carimbos sim** | trigger incompleto | parcial | parcial | esconde | sem autor | não |
| Relatório entregue | opções não; linha parcial | trigger dedicado (opções) | parcial | sim | sim | sem autor | não |
| Publicação | reversível **por desenho** (despublicar) | admin | n/a | n/a | n/a | **nenhuma** | **não** |
| Connection terminais (`PRIMEIRO_ATENDIMENTO`, `ENCERRADO_SEM_RELACIONAMENTO`) | **não** | trigger de transição | **sim** | sim | sim | eventos | n/a |
| Relationship `ENCERRADO` | não (reabertura = evento novo) | trigger + campos imutáveis | **sim** | sim | sim | eventos | sim |
| Tentativa `RESPONDIDA`/`CANCELADA` | **não** (linha nova) | trigger + índice | **sim** | sim | — | carimbos | parcial |
| Case `CANCELLED`/`CLOSED` | não | trigger de transição | **sim** | sim | sim | case_events | não (status sem motivo) |
| Descarte de Case | não (hard delete auditado) | RPC service-role | **sim** | sim | sem superfície | **audit exemplar** | **sim** |

Leitura: **o domínio Connection/Relationship/Tentativas é o único onde "final" significa final no banco.** No núcleo da Curadoria, "final" é uma convenção de interface.

## 4. Estados reversíveis (por desenho, corretos)

Rascunhos (história, mapa, relatório pré-emissão, seleção pré-entrega); correção da escolha enquanto `DECISAO_REGISTRADA` (deliberado, com prazo de estado); redeclaração de área em estados não-terminais; reabertura da Mesa pré-emissão; despublicação (decisão humana prevista — sem trilha, o defeito é a auditoria, não a reversibilidade).

## 5–7. Classificação de falhas

**Fail-closed (correto e provado):** as duas guardas das migrations remotas (abortam a transação); trigger de publicação; RPCs de Connection (`CONCURRENT_CONFLICT` mapeado); `submitStory` (revision+status na cláusula WHERE); divergência nasce `critica+aberta`.

**Fail-safe parcial:** compensação do upload de anexo (a melhor do sistema; furos residuais logados); emissão em 2 passos cujo estado parcial é o pré-requisito do retry.

**Fail-open (falha abre a porta):** `listCriticalDivergenceBlocklist` descarta `error` → blocklist vazia → profissional bloqueado volta a ser ofertável; `/api/crm/leads` sem segredo fora de produção; `p002-field-corrections` trata tabela inexistente como "sem correções"; `canCorrect = true` por default de prop.

**Fail-silent (falha vira sucesso ou nada):** `getReportBySelection` descarta `error` → entrega "bem-sucedida" sem relatório (o pior caminho do C4); autosave com sessão expirada exibe "✓ salvo"; `case_events` inseridos sem checagem de erro (histórico com buracos invisíveis); `replaceCompetencyDomains` (delete sem erro checado); CRM audit em statement separado; `maybeSingle` convertendo duplicata em ausência (8+ leituras da espinha dorsal — duplicata de relatório faz a jornada **regredir** em silêncio).

**Fail-broken (falha deixa inconsistência voltada ao usuário):** entrega não-atômica (3 nomes sem documento); conversão de lead (paciente-fantasma notificado + operador travado); criação de paciente (auth órfão sem papel).

## 8. Autoridade de cada dado

| Dado | Dono declarado | Dono efetivo | Fontes de verdade | Conflito |
|---|---|---|---|---|
| História | Paciente | Paciente (RLS) | 1 + versões | — |
| Perfil/Mapa | Paciente reconhece; Curador preenche | **Curador/admin (policy FOR ALL, sem congelamento)** | 1 | reconhecimento não congela o objeto reconhecido |
| Catálogo | Método (doc) | **TypeScript em runtime** (3 arrays); banco autoritativo só no Mapa | **4** (1 tabela + 3 arrays), já divergentes | o dono com constraints não é consultado |
| Rede elegível | Política única (`rede-policy`) | idem + fail-open | 1 | ✓ (exceto fail-open) |
| Seleção/Relatório | Curador | Curador; banco só congela opções | 1 | carimbos sem autor |
| Estado do Case | `cases.status` (9 estados) | **ninguém** — 100% `NEW` em dado; jornada real derivada de fatos (`conduct`) | **2** (enum decorativo × derivação) | `patient_case_overview` conta a história errada |
| Ordem de apresentação | Curador (posição = apresentação) | Curador no Relatório; **alfabeto/Postgres nas demais listas** | — | ordenação implícita comunica ranking |
| "Meu Case" do paciente | — | **`updated_at desc` em DUAS queries independentes** na mesma página | 2 | podem divergir na mesma tela |
| Papel→portal | `ROLE_PRIORITY` declarado | **ordem do array vindo do banco** (`getRoleHome` ignora a prioridade) | 2 | comentário afirma o que o código não faz |
| Verificação (enum) | banco (5 valores) | banco + **2 uniões TS divergentes** (fantasma `em_verificacao`) | 3 | sem geração de tipos que detectaria |

## 9. Decisões silenciosas (síntese da varredura — completa no relatório)

**As cinco mais graves:** (1) `replaceCompetencyDomains` — `[]` apaga tudo, com o delete **antes** do guard; (2) `hasContext/hasDocuments = true` sem nenhum chamador passando as props — o curador declara ter revisado material que pode não existir; (3) duas fontes de "o Case do paciente" por `updated_at desc` na mesma página; (4) `maybeSingle` sem UNIQUE garantido em 8+ leituras (duplicata = ausência); (5) `getRoleHome` ignorando o `ROLE_PRIORITY` declarado quatro linhas acima.

**Outras de peso:** `'rascunho' > 'enviada'` — precedência de negócio codificada num acaso lexicográfico (documentada, frágil, sem teste); `curators[0]` pré-selecionado → **atribuição enviesada por alfabeto**; `cities[0]+states[0]` combinando cidade de um estado com UF de outro; fila de Cases com corte silencioso em `PAINEL_MAX_CASOS`; `narrative || historiaDaPaciente` — texto da paciente vira declaração do curador (e ressuscita narrativa apagada); origin `?? localhost` em produção; `validation_status default 'valid'` (o oposto da doutrina da casa); `pipeline_stage`/`approach status` como string livre com default; dois defaults de `catalog_version` coexistindo (`0.9.0` e `1.0.0`); `method_subcriteria.active default true` — subcritério novo entra em circulação sozinho; ~25 colunas onde `[]`/`{}` torna "não declarei" indistinguível de "declarei que não há"; `visibility default 'operacional'` em notas CRM; `multi ?? true` no catálogo TS (com defaults aplicados antes do spread — frágil); `requiresCurator = false` em sentença de relatório.

**Onde a casa acerta (padrões a replicar):** comentário de coluna de `contact_mode` (a regra viaja no schema); `confirmed_by_curator` documentado no DDL; `passes: null` → "Verificar o cadastro, não descartar"; `ESCAPES` dando código de primeira classe ao "não sei"; `position` citando a Ontologia no código.

## 10. Conflitos de autoridade

1. **Catálogo**: TS × banco (o com constraints não é lido; 36 códigos divergem).
2. **Estado do Case**: enum × derivação (`conduct`) — o enum perdeu, mas continua exposto (`patient_case_overview`, dropdown admin).
3. **Perfil**: reconhecimento da paciente × poder de escrita irrestrito do curador sobre o objeto reconhecido.
4. **Ordem**: doutrina "sem ranking" × ordenações alfabéticas/indefinidas em superfícies de escolha.
5. **Home por papel**: prioridade declarada × ordem do banco.
6. **Docs normativos**: Ontologia declara soma-100 e imutabilidades que ADR-042/código aposentaram ou nunca criaram; ADR-044 nega a própria implementação existente; MODELO §11 desatualizado; UX-P9 contradito pelo próprio mecanismo de vocabulário; UX-P12 ("quem garante é o banco") violado pelas invariantes I-09..I-12 verificadas no cliente.

## 11. Fonte única (onde existe, e funciona)

Motor de compatibilidade (matriz única, pura, testada); política da Rede (`rede-policy.ts` pós-NC-22); transições de Case/Connection/Relationship/Tentativa (trigger + espelho TS + teste); gate de publicação (trigger + espelho de pendências com contrato declarado); paleta de cores (origem única + teste); vocabulário proibido (módulo único + teste); revisão da história (`revision` como única moeda de concorrência).

## 12. Fontes múltiplas (onde a verdade está repartida)

Catálogo (4); enum de verificação (3); estado do Case (2); "meu Case" (2); home por papel (2); condicionais do catálogo (banco tem `conditional_rules` que ninguém lê; TS reimplementa à mão); regra "exatamente 3" (4 camadas — redundância boa, mas com furo no INSERT); jornada do curador (4 etapas) × fila ("de 7") × COS (9 fases) — três contagens da mesma coisa.

## 13. Invariantes totalmente protegidas (banco + teste; contorno inexistente)

História única em rascunho · dupla posse de anexos · escolha só do paciente · médico 1× por relatório · um VALIDATED de review por Caso · terminais de Connection/Relationship/Tentativa · append-only de eventos/notas/trocas de responsabilidade/practice_evidence · gate de publicação (na entrada) · anti-contaminação demo/fixture (com trigger) · isolamento paciente↔paciente e curador↔curador · `anon` a zero · descarte auditado service-role-only · declaração de área com justificativa condicional no banco.

## 14. Invariantes parcialmente protegidas

Exatamente 3 (INSERT-DELIVERED fora do trigger) · história enviada (só `data`) · relatório imutável (opções sim; carimbos não) · entrega-exige-emissão (leitura sim; escrita não) · idempotência de entrega (relatório sim; seleção não) · pareceres (opções sim; composição nullable) · autoria (preenchida onde há coluna; ausente em reconhecer/emitir/entregar/publicar/resetar) · permissões de papéis operacionais (RLS sim; mapas de permissão de aplicação incompletos — atendente) · "sem score" (código e testes sim; resíduos de schema e ordenações implícitas não).

## 15. Invariantes sem proteção alguma

**Executáveis e desprotegidas:** Perfil reconhecido imutável (ONT-28, no modelo vigente) · correção-exige-SUPERSEDED (contraditória) · seleção DELIVERED imutável · `emitted_at`/`delivered_at` imutáveis · competências não somem · escolha imutável (ONT-30 — contrariada por grant) · documentos anexados append-only (F2) · Compatibilidade invalidada quando o Perfil muda (ONT-31).

**Declaradas e puramente textuais (nunca tiveram objeto):** ONT-2/3 (Consulta Inicial como entidade), ONT-29 (relatório-linha), ONT-33 (nada inferido), I-03/04/06/07/13, C-01..C-06, Barreiras 5–6 (parciais), ARCH-10 (retratação retroativa do paciente), ARCH-11/15–19 (CI/Observatório/Knowledge), FUND-P13, ciclo de vida do Médico (Em avaliação/Aprovado/Suspenso), estado histórico do cadastro no momento do cálculo, "declarar honestamente quando não há três" (FUND-P9).

## 16. GO / NO-GO — exclusivamente pelas invariantes

**Pergunta: o banco protege? o servidor protege? ou o sistema depende da boa vontade da interface?**

Resposta em três camadas:

1. **Acesso e identidade: o banco protege. GO.** Quem pode ver e tocar o quê é garantido por RLS + funções de guarda + testes negativos, com `anon` a zero. Nenhum contorno de acesso indevido foi encontrado em quatro fases de auditoria.
2. **Trilhos de processo (Connection, Relationship, Tentativas, responsabilidade do Case, publicação na entrada, descarte): o banco protege. GO.** São a prova de que a casa sabe construir invariante de verdade.
3. **O coração do Método (História enviada, Perfil reconhecido, Mapa, Seleção entregue, Relatório emitido/entregue, competências, catálogo): o sistema depende da interface. NO-GO para produção neste estado.** As cinco imutabilidades que definem a confiança do produto — o bloco "Imutabilidade" da própria Ontologia (28–32) — têm hoje **zero, uma ou meia camada** de proteção, e as quatro operações compostas mais importantes não são atômicas. Nada disso é visível no caminho feliz (o E2E certificado passa por cima sem tocar nos furos); tudo isso é alcançável por qualquer credencial legítima via PostgREST, sem trilha.

**Veredicto: NO-GO condicionado.** Não por segurança perimetral (que passaria), mas porque a **arquitetura de confiança declarada** — "o que foi reconhecido, entregue e emitido jamais muda, e toda mudança tem autor" — hoje é uma promessa da interface, não do sistema. O repositório contém o gabarito completo de como fechar cada furo (os trilhos da camada 2 usam exatamente os padrões que faltam na camada 3); o que está pendente é decisão e aplicação, não invenção.

*Nenhuma correção foi proposta nem aplicada, conforme a regra da fase.*
