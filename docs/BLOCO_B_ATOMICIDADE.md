# BLOCO B — ATOMICIDADE DAS OPERAÇÕES COMPOSTAS

**Data:** 2026-08-02 · **Branch:** `remediacao/bloco-b` · Gabarito arquitetural: módulo Connection/`transfer_case_responsibility` (padrão de 10 pontos do mandato, aplicado a todas as RPCs).

## 1. Matriz transacional (estado ANTES → estratégia)

| Operação | Etapas antes | Ponto de falha / estado parcial | Gate | Estratégia aplicada | Idempotência | Auditoria |
|---|---|---|---|---|---|---|
| Entrega da Curadoria | 3 statements na action; erro do SELECT do relatório **engolido → `success:true`**; `emitted_at` sobrescrito | seleção DELIVERED + relatório não entregue (par de telas inconsistente) | B11/B12 | **RPC `deliver_curadoria`**: valida (curador designado, 3 opções, 3 pareceres, rationale, relatório emitido) e entrega seleção+relatório com o MESMO carimbo numa transação; trigger `enforce_delivery_requires_emitted_report` | repetição = mesmo resultado, timestamps intactos (ADR-048/050/064) | `case_event` + `audit_log` `curadoria_delivered` |
| Conversão de lead | createUser fora de transação → grant → RPC que recusa depois | conta Auth órfã notificada; retry travado (e-mail duplicado) | B14 | **Saga**: `patient_provisioning` (operation_key única, REGISTERED→CONVERTED\|COMPENSATED) + `register_provisioned_patient` (papel+registro+ficha CRM numa transação) + `compensate_patient_provisioning`+`deleteUser`; boas-vindas só pós-commit | retomada pela mesma chave; "já convertido" ≠ erro | registro da operação + `record_crm_audit` |
| Abertura de Case | `active_case_id = null` hard-coded (raiz em `20260724200921:77`) | retry = 23505 ininteligível; vínculos históricos perdidos | B13 | `CREATE OR REPLACE` (migration nova): grava o id real; reencontro por `patient_stories.data->>'lead_id'` (reparo incremental); 23505 → erro de domínio | retry devolve o MESMO Case | mantida |
| Criação admin de paciente | createUser + INSERTs soltos | conta sem papel; credenciais de operação não concluída | prova E6 | mesma saga da conversão (verificada de ponta a ponta; provas novas) | operation_key `patient-account:<id>` | idem |
| Atualização de profissional | `replaceCompetencyDomains([])` deleta tudo | 158/162 publicados a zero | B15 | **Semântica de patch**: `[]` = no-op; esvaziar exige `{esvaziamentoExplicito:true}`; substituição por reordenação com guarda (aditivo→subtrativo; falha deixa no máx. superconjunto; retry converge) | convergente | — (trilha geral no C) |
| Documento+vínculo | compensação furada; `remove()` sem checagem | órfão invisível no bucket | B16 | Saga fechada em `attachDocumentToStory`: 23505=reuso; recusa real ⇒ compensação (linha+storage) com 2 guardas (vinculado nunca é removido; RLS); compensação falha ⇒ `registrarErro` + **RPC `register_patient_document_residue`** → `audit_logs` `patient_document_orphaned` | duplo clique reutiliza | evento de resíduo observável |
| (fora do bloco) `saveSelection`/`saveReport` | 3 statements | seleção/report sem opções | — | **mitigado** (a entrega recusa ≠3 no banco); promoção a RPC fica registrada em AT-04/AT-06 | — | — |

## 2. Migrations (locais, aditivas, rollback no próprio arquivo; ledger 73/73)

`20260802150000_entrega_transacional_deliver_curadoria.sql` · `20260802151000_open_case_from_lead_idempotente_de_verdade.sql` · `20260802152000_conversao_com_provisionamento_compensavel.sql` · `20260802153000_rastro_de_documento_sem_vinculo.sql`. As 5 congeladas de 02/08 intocadas; nada aplicado remotamente. Resíduo aceito e documentado: valores de enum (`curadoria_delivered`, `patient_document_orphaned`) não removíveis em rollback.

## 3. Actions/repositories (adaptadores finos)

`curadoria/actions.ts` (entrega=RPC; revalidação só pós-sucesso; rotas do RECONHECE-REFRESH intactas) · `curadoria/{repository,report-repository}.ts` (`deliverSelection`/`markReportDelivered` rebaixadas a helpers de teste; **`emitted_at` nunca mais sobrescrito na entrega**) · `crm/conversion-actions.ts` (saga+retomada+compensação; fim do beco do e-mail) · `profiles/patient-account-repository.ts` (saga) · `profiles/professional-{repository,actions}.ts` (patch) · `story/{attachment-repository,attachment-actions}.ts` + `profiles/patient-document-repository.ts` (saga do documento; storage nunca mais silencioso) · `tests/integration/limpeza/inventario.ts` (+`patient_provisioning`).

## 4. Gates e provas

**`test:remediacao`: 7 verdes (C8 + B11–B16) / 19 vermelhos com as mensagens originais** — verificado independentemente pelo orquestrador com `git diff tests/remediacao/` vazio (nenhum oráculo tocado; o nome `deliver_curadoria` era o previsto no gate). Provas complementares 20/20 + integração nova: concorrência (2 entregas ⇒ 1; 2 open_case ⇒ mesmo Case), repetição sem regravar carimbos, falha intermediária com contagens idênticas, autorização negativa (42501 de domínio; contorno PostgREST não entrega), zero Auth órfão (caminhos conversão E admin), compensação de documento com arquivo real (banco+storage, zero resíduo), evento de resíduo só quando a compensação falha. Regressão: 12 suítes de integração dos módulos tocados verdes; unit 1718+FS-03 intencional; components 399+FS-02 intencional; typecheck limpo; porteiro 2/2.

## 5. Riscos residuais

(1) Ficha CRM de provisionamento (`provisionamento_de_conta`) visível no funil — rotulagem no D/F; sem retroativo para contas antigas. (2) Janela estreita não-silenciosa: `deleteUser` falhando após `compensate` deixa conta sem papel, logada e visível em `patient_provisioning`. (3) Contrato de saga do anexo: caller futuro com documento pré-existente SEM vínculo teria remoção na compensação (guarda protege vinculados; docstring registra). (4) Superconjunto temporário de áreas se o processo morrer entre aditivo e subtrativo (retry converge; RPC única eliminaria — registrado). (5) Banco-limpo-do-zero (73 migrations) só será provado no CI efêmero (push proibido). (6) Mudança deliberada: **atendente concede papel `paciente` via RPC definer** (antes quebrava a conversão) — coerente com ADR-063 §1/PAP-01.

## 6. O que fica para C/D/H (por desenho)

**C:** imutabilidade geral (C1–C7: reverter DELIVERED/VALIDATED, sobrescrever carimbos por UPDATE direto, INSERT já-DELIVERED), auditoria C9 (reset/despublicação/exclusão — o rastro de E8 cobre só compensação falha), `supersede_priority_profile` (C10). **D:** D17–D22 (fail-open/fail-silent fora do caminho da entrega, PUBLIC_PATHS, round-trip da UI, `.default([])`, autosave), FS-02/FS-03 intencionais. **H:** MIME/tamanho. **B-registrado:** AT-04 (`saveSelection`) e a promoção completa de AT-06 — mitigados pela recusa do banco na entrega, abertos no Registro.

## 7. Critérios de rollback

Por migration, no próprio arquivo (drop function/trigger/policy/table; enums permanecem documentados). Rollback de código = revert dos commits do bloco; os helpers rebaixados preservam compatibilidade de testes. Nenhum dado é alterado pelos rollbacks (operações novas são aditivas).
