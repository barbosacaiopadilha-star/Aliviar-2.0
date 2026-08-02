# BLOCO B.5 — VALIDAÇÃO ARQUITETURAL DAS RPCs

**Data:** 2026-08-02 · **Natureza:** revisão somente-leitura do diff exato do Bloco B (`7b0d6b7..31c5735`, 20 arquivos, 4 migrations, 6 RPCs). Nenhum código, teste, migration ou documento existente foi alterado; nenhum commit foi criado.

## 1. Resumo

As 6 RPCs do Bloco B **seguem um único padrão entre si** — o mais rigoroso do repositório (convergem em 8 das 10 dimensões: naming `_underscore`, `security definer`, `search_path` citado, `revoke`/`grant`, ator por `auth.uid()`, vocabulário de SQLSTATE `42501/P0002/23514/23505`, mensagens na voz do domínio, cabeçalho documental de 5 seções). As divergências internas são de grau (força da autorização, shape de retorno, destino de auditoria, idempotência em 5/6). **A assimetria relevante não está entre as RPCs — está entre as camadas**: a compensação vive em 3 lugares com justificativas não reconciliadas, e 2 regras de domínio existem em SQL **e** em TypeScript. Foram encontrados **3 itens bloqueantes-para-C**, 7 registráveis e 8 cosméticos.

## 2. Tabela das RPCs (6 × 10 dimensões — síntese; evidência migration:linha no corpo da revisão)

| RPC | Auth | Autorização | Validação | Transação | Idempotência | Locking | Retorno | Erro | Auditoria |
|---|---|---|---|---|---|---|---|---|---|
| `deliver_curadoria` | `auth.uid()` | **papel+relação** (admin OU curador designado) | 5 checks (emitido, rationale, 3+3, ramo DELIVERED) | ✔ | por estado | FOR UPDATE ×3 (seleção/case/relatório) | linha | domínio PT-BR | `case_events`+`audit_logs` (ramo de reparo só `case_events`) |
| `convert_lead_to_patient` v2 | ✔ | papel só (sem relação c/ `assigned_to`) | 4 checks | ✔ | por estado | FOR UPDATE no lead; **provisioning sem lock** | linha | domínio | `record_crm_audit` (resolução da saga não auditada) |
| `open_case_from_lead` | ✔ | papel só | 2 checks | ✔ (+bloco 23505) | 2 camadas (id real + reencontro por `lead_id`) | FOR UPDATE no lead | linha | domínio | `record_crm_audit` (ramo de reparo sem auditoria) |
| `register_provisioned_patient` | ✔ | papel só | 5 checks | ✔ | **por `operation_key` única** + FOR UPDATE na operação | operação; TOCTOU teórico em contacts | linha | domínio (**falta `if not found` no lookup do papel** — R3) | `record_crm_audit`+trigger `role_granted` |
| `compensate_patient_provisioning` | ✔ | papel só | 3 checks | ✔ | por estado | FOR UPDATE na operação | linha | domínio | `record_crm_audit`+trigger `role_revoked` |
| `register_patient_document_residue` | ✔ | **dono OU admin** | 3 checks | ✔ (1 INSERT) | **nenhuma** (retry duplica rastro — R1) | nenhum | **void** (única) | domínio | `audit_logs` `patient_document_orphaned` |

## 3. Tabela das actions

| Action | Fina? | Achado |
|---|---|---|
| `deliverSelectionAction` | **✔ — melhor exemplar** (parse→RPC→erro→revalidação pós-sucesso) | única do bloco sem `registrarErro` no caminho de falha (C8) |
| `convertLeadToPatientAction` | **parcial** | compensação do Auth na action = **lugar certo** (fronteira Admin API); MAS: retomada da saga reimplementada em TS (regra duplicada c/ a RPC — R2) e **`error` descartado na leitura de `patient_provisioning` → reabre o beco do e-mail em silêncio (B2 🔴)**; `created:true` para conta de tentativa anterior (C7) |
| `professional-actions` | ✔ | guard "lista vazia" duplicado (2 dead guards — C5) |
| `attachment-actions` | ✔ (afinou; compensação migrou p/ repository) | cria a 3ª localização de compensação do bloco |
| `patient-account-actions` | **não tocada** | `setPatientAccessAction` segue 3 escritas/2 sistemas sem compensação (R7); `operation_key` derivada do id novo **não idempotentiza** (B3 🔴) |

## 4. Tabela dos repositories

| Repository | Achado |
|---|---|
| `curadoria/{repository,report-repository}` | rebaixamento limpo (zero callers de produção — grep); **mas `markReportDelivered` + PostgREST ainda alcançam o estado parcial INVERSO** (relatório entregue sem seleção entregue — B1 🔴); nada impede caller novo de produção (guarda de arquitetura ausente) |
| `story/attachment-repository` | saga de 3 sistemas em TS (o mais gordo do bloco); regra "vinculado não é resíduo" duplicada SQL↔TS (R2); inferência frágil via RLS/`maybeSingle`; único import cruzado repositório→repositório (story→profiles) |
| `profiles/professional-repository` | 3 statements sem transação (mitigação assumida em comentário — superconjunto temporário, retry converge); `esvaziamentoExplicito` sem caller de produção (C6) |
| `profiles/patient-account-repository` | melhor conversão (escrita direta→RPC); `void grantedBy` = parâmetro morto (C7); **`deleteUser` direto sem `compensate` — ordem contraditória com `conversion-actions` sem nota reconciliadora** (justificável, não escrita) |
| `profiles/patient-document-repository` | correto e mínimo (storage nunca mais silencioso) |

## 5. Tabela das migrations (M150–M153)

Nomenclatura, cabeçalho de 5 seções, rollback e ordem: **consistentes e acima do padrão histórico**. Assimetrias de forma: só M151 tem seção CONCORRÊNCIA; só M151 tem ROLLBACK em prosa (não colável); numeração de blocos em M150/M152 e não em M151/M153; `comment on function` ausente só na `convert_lead_to_patient` v2 (o comment da v1 descreve corpo antigo — C1); raciocínio do `add value` de enum documentado em M153 e não em M150. Dependências corretas; nenhuma migration do bloco depende de outra do bloco.

## 6. Padrão Connection (comparação com o pré-existente)

O repositório tem **três estilos** de RPC: **A** (CRM/Cases — `transfer_case_responsibility`: `_underscore`, definer, `auth.uid()`, P0002/23514, comment+grants no arquivo), **B** (Connection/stage5: `p_`/`v_`, **invoker**, ator por parâmetro — 4 funções de approach sem confronto com `auth.uid()` —, 02000/55000, mensagens técnicas, grants centralizados), **C** (Bloco B = Estilo A com disciplina maior + cabeçalho documental). O Bloco B **não introduziu um quarto estilo** — consolidou o A. Ressalva de documentação: `BLOCO_B_ATOMICIDADE.md` cita como "gabarito" o módulo Connection (Estilo B) e `transfer_case_responsibility` (Estilo A) no mesmo fôlego — dois estilos que divergem em 8 de 10 dimensões. O padrão real seguido foi o A.

## 7. Assimetrias encontradas

**🔴 Bloqueantes-para-C (3):**
- **B1 — Gate B12 unidirecional**: nada impede `curadoria_reports.delivered_at` sem a seleção DELIVERED (trigger novo cobre só `curated_selections`; `markReportDelivered`/PostgREST alcançam o par torto pela outra ponta). O C congelaria estados terminais sobre um par que ainda nasce inconsistente.
- **B2 — `error` descartado** em `conversion-actions.ts:120` (leitura de `patient_provisioning`): falha de leitura ⇒ fluxo cai em `createPatientAccount` ⇒ e-mail duplicado — a janela do AT-02 reaberta em silêncio, na classe exata de defeito que o bloco fechou.
- **B3 — Idempotência declarada e inexistente no caminho admin**: `operation_key = patient-account:<profileId>` deriva do id gerado na própria tentativa — não deduplica nada; o encerramento de AT-05 no Registro está apoiado nessa garantia. Requer correção da chave (ou da declaração) e revisão do encerramento.

**🟡 Registráveis (7):** R1 rastro de resíduo sem idempotência · R2 regras duplicadas SQL↔TS (retomada; vinculado-não-é-resíduo) · R3 lookup do papel sem `if not found` (erro cru) · R4 autorização papel-puro em 4/6 (`assigned_to` nunca consultado — herança, diverge do gabarito) · R5 ramos de reparo com auditoria incompleta (3 casos) · R6 update de provisioning por `profile_id` sem lock/chave · R7 `setPatientAccessAction` fora do bloco e não declarada.

**🟢 Cosméticas (8):** C1–C8 (comment ausente na v2; void/service_role únicos; formas de migration; helpers `require_actor`/`require_team_role` ausentes — 6 e 4 repetições verbatim; guards mortos; API só-de-teste; parâmetro morto/`created` impreciso; PT/EN misturado + import cruzado + `registrarErro` ausente na entrega).

## 8. Duplicações

As 8 da Parte 6 da revisão — destaque: checagem de ator 6× verbatim e composição de papel 4× (helpers ausentes); as 2 regras de domínio em duas linguagens (R2); a ordem de compensação em 2 implementações aparentemente contraditórias sem nota (§4).

## 9. Exceções que o Bloco C NÃO pode assumir resolvidas

(a) atomicidade: `saveSelection` (AT-04 ✔ declarado), `saveReport`/AT-06 (✔), `replaceCompetencyDomains` (⚠️ sub-declarado no Registro), **`setPatientAccessAction` (❌ não declarada)**, saga do anexo (compensada, não atômica — por natureza). (b) estados intermediários: **par entrega inverso ainda alcançável (B1)**; órfãos/`active_case_id`/documentos **pré-migration** sem retroativo (✔ declarado nas migrations). (c) retries: definidos em 5/6 RPCs; **não** no rastro de resíduo (R1) nem no caminho admin (B3). (d) escrita crítica por RPC: **não** — seleções, relatórios, competências, acesso do paciente e anexos seguem com escrita direta do servidor.

## 10. Veredicto

> **"O BLOCO C ainda depende de ajustes arquiteturais."**

Três ajustes — pequenos, localizados, sem redesenho: **(1)** fechar a direção inversa do par de entrega (trigger/constraint em `curadoria_reports.delivered_at` exigindo seleção DELIVERED, ou rebaixamento definitivo com guarda de arquitetura sobre `markReportDelivered`); **(2)** tratar o `error` da leitura de `patient_provisioning` na retomada (e, idealmente, mover a decisão de retomada para a RPC que já a conhece); **(3)** corrigir a chave de idempotência do caminho admin (chave fornecida pelo chamador/estável) **e revisar o encerramento de AT-05 no Registro** à luz da garantia real. Os itens 🟡/🟢 não bloqueiam: entram como insumo do C (R4/R5 tocam auditoria/autorização, que é escopo natural do C) e do K (helpers, comentários, formas). Fora esses três, a fundação transacional está posta, é consistente e é a base correta para o Bloco C.

---

**ADENDO (B.6, 2026-08-02):** os três bloqueantes foram fechados no Bloco B.6 (migration `20260802154000`, gates novos B17/B18/B19 vermelhos→verdes, AT-05 reaberto e reencerrado com a garantia real — `docs/BLOCO_B6_FECHAMENTO_ARQUITETURAL.md`). O veredicto desta validação passa a ser:

> **"O BLOCO C pode assumir a fundação transacional."**

Os 7 registráveis e 8 cosméticos permanecem como registrados (insumo de C e K); as exceções do §9 permanecem válidas, exceto as três resolvidas.
