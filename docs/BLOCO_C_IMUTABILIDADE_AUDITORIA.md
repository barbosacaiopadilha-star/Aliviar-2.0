# BLOCO C — IMUTABILIDADE, AUDITORIA E SUPERSESSÃO

**Data:** 2026-08-02 · **Branch:** `remediacao/bloco-c` · Duas frentes sobre a fundação transacional liberada pelo B.5/B.6. Nenhuma promessa de imutabilidade depende mais só da UI.

## 1. Matriz de invariantes (aprovada na Etapa 0 → implementada)

| Objeto | Estado final | Proteção implementada | Caminho legítimo de correção | Gate |
|---|---|---|---|---|
| `patient_stories` | enviada | trigger `assert_submitted_story_immutable` — status terminal + campos congelados (status, data, current_step, submitted_at, profile_id, created_by, created_at) | nova história (ADR-051; superfície fora) | C1 ✅ |
| `priority_profiles` | VALIDATED | trigger `assert_priority_profile_transition` — VALIDATED nunca regride/edita; VALIDATED→SUPERSEDED só sob flag transacional da RPC | **RPC `supersede_priority_profile`** (ADR-049): curador atribuído/admin, FOR UPDATE no Case, sucessor DRAFT vinculado (4 colunas: superseded_at/reason/actor/by-FK), audit `profile_superseded`, idempotente (sucessor DRAFT vivo ⇒ mesmo sucessor), 2-paralelas⇒1 | C3, C10 ✅ |
| `case_priority_map` | pós-reconhecimento | trigger I/U/D — congelado quando o Perfil vigente é VALIDATED; **sucessor DRAFT reabre a edição** (testado) | supersessão | C2 ✅ |
| `curated_selections`+options | DELIVERED | triggers — DELIVERED terminal; opções/pareceres/ordem congelados; INSERT já-DELIVERED recusado (sem exceção de bastidor — a entrega é transição); DRAFT→DELIVERED da RPC passa | RPC `deliver_curadoria` (retry idempotente) | C4, C7 ✅ |
| `curadoria_reports` | emitido/entregue | `assert_report_lifecycle` **estendido** (sem trigger novo): `emitted_at`/`delivered_at` monotônicos e imutáveis (null→valor uma vez; →null recusado); lista congelada pós-emissão completada; os dois ramos de `deliver_curadoria` passam por desenho | **errata** | C5, C6 ✅ |
| errata (novo) | — | tabela `curadoria_report_erratas` (version única por report, reason NOT NULL, author, content jsonb mínimo — desenho justificado: relatório novo colidiria com `one_per_selection`); imutável até para service; escrita só pela RPC | **RPC `create_report_errata`** (curador atribuído/admin, exige ENTREGUE, versão serializada por FOR UPDATE, original byte-intacto, audit `report_errata_created`; cada chamada = novo ato versionado) | gates F2 ✅ |
| `patient_curadoria_decisions` | pós-registro | trigger stage5 pré-existente — **não tocado** | evento próprio | C8 pino ✅ |
| `professional_competency_areas` | publicado | trigger de STATEMENT — DELETE que zere perfil PUBLICADO recusado fora do flag; patch do B intacto (edição legítima livre) | **RPC `remove_professional_competencies`** (admin, motivo, audit com lista removida; `esvaziamentoExplicito` delega) | gates F2 ✅ |
| `area_compatibility_declarations` | juízo terminal | PK por linha + `superseded_at/by` + **índice único parcial da vigente**; UPDATE de terminal recusado (exceção única: flip de confirmação do PARCIAL pelo próprio declarante); INFORMACAO_INSUFICIENTE segue editável | **RPC `redeclare_area_compatibility`** (curador ATRIBUÍDO — relação, não papel; histórico encadeado; audit `area_redeclared` old→new+motivo; 2-paralelas⇒1 vigente); a Rede/Mesa leem só a vigente (`listAreaDeclarations` filtrado) | gates F2 ✅ |

## 2. Migrations (10, locais, aditivas, rollback colável; ledger **84/84**)

Frente 1: `155000` história · `156000` perfil+supersessão · `157000` mapa · `158000` seleção · `159000` autoria do reconhecimento (CREATE OR REPLACE da RPC + audit `profile_recognized`). Frente 2: `160000` carimbos do relatório · `161000` errata · `162000` trilhas administrativas · `163000` redeclaração de área · `164000` remoção explícita de competências. Dados sujos: verificados ANTES de cada invariante (zero pares tortos, zero VALIDATED inconsistente, 35 declarações todas de pares distintos — nada consolidado em silêncio; ambiguidade teria abortado nomeando ids). Estados parados preservados (27 enviadas, 158 publicados sem competência, 2 DRAFT com relatório emitido).

## 3. Auditoria mínima (Etapa 10) — trilha única em `audit_logs`, padrão `case_responsibility_changes`

Eventos novos: `profile_recognized` · `profile_superseded` · `report_emitted` (trigger — qualquer via) · `report_errata_created` · `area_redeclared` (old→new+motivo) · `competencies_removed_explicit` (lista) · `password_reset` (RPC `log_admin_action`, allowlist estrita, metadata com chave de senha/token **recusada**) · `professional_unpublished/published` (trigger de transição, autor+old→new+motivo em coluna opcional) · `patient_document_deleted` (tombstone: ids, uploaded_by, file_name, **md5 do path** — nunca caminho cru/conteúdo). `curadoria_delivered` já existia (B). **Nenhum conteúdo clínico em trilha nenhuma** (gate assertivo). Gates C9a/b/c ✅.

## 4. Autorização (Etapa 11 — fecha R4 do B.5 nas operações novas)

Supersessão, errata e redeclaração exigem **relação com o Case** (curador atribuído), não papel puro; reconhecimento é da paciente do Case. Testes negativos por operação: curador não-atribuído, outro paciente, conta sem papel, anon, PostgREST direto — todos recusados com erro de domínio. (As 4 RPCs do CRM herdadas seguem papel-puro — registrável remanescente, decisão do F/K.)

## 5. Actions/repositories (Etapa 13)

`resetPatientPassword` com trilha assinada pelo ator (falha da trilha = falha da operação — sem rastro não é sucesso) · `area-repository` sem upsert cego (primeira-declaração/edição-da-vigente; recusas do banco chegam como erro real) e leitura só-vigente herdada por Mesa/relatório/portão · `esvaziamentoExplicito` exige motivo e delega à RPC · actions do mapa/história propagam recusas do banco (verificado: sem falso sucesso). Nenhum caminho paralelo de escrita restante contorna os triggers.

## 6. Gates antes/depois

Suíte `test:remediacao`: **33→52 testes; 14→44 verdes / 19→8 vermelhos** — verdes: C1–C7, C8 (pino), C9×3, C10, B11–B19, +19 gates novos (6 da F1: descongelamento sob sucessor, vínculo+trilha, idempotência, concorrência, autorização por relação, motivo obrigatório; 13 da F2: errata ×5+imutável, redeclaração ×5, trilhas ×4, competências ×4). **Vermelhos restantes = exatamente D17–D22 (+D21b×2, D22) pelas mensagens originais.** Verificação independente do orquestrador: zero remoções nos gates originais; fixtures ajustadas com justificativa (apoio.ts caminho-real; `connection-canonica` não reverte mais fato de entrega; `approach-attempts`/`connection-contact-mode` não nascem mais DELIVERED; `professional-profile` passa motivo) — nenhuma redução de expectativa.

## 7. Regressão (Etapa 15)

Integração: 26 suítes / **261 testes verdes** (Curadoria, certificação, Connection×3, Relationship×3, entrega, patient×5, anexos, segurança, descarte, profissional, fontes, transparência, mesa, rede, cases). Unit 1719 + 1 intencional (FS-03, Bloco D) · Components 399 + 1 intencional (FS-02, Bloco D) · typecheck limpo · ledger 84/84 · porteiro 2/2. Herança do catálogo (5 arquivos, Bloco E) inalterada e fora do escopo.

## 8. Achados encerrados / riscos / adiado

**Encerrados no Registro:** IM-01..06, IM-08, AU-01, AU-02 (evidência por gate). **Parciais mantidos:** FS-05 (`case_events` de cases/repository restam — D), AT-04/AT-06 (seleção multi-statement — mitigada pelos triggers C4/C7: estado torto agora é irrecusável pelo banco; promoção a RPC segue registrada), R4-herdado do CRM. **Riscos residuais:** primeira-declaração dupla em paralelo agora falha com erro visível (era fusão silenciosa — intencional); flip de confirmação do PARCIAL só pelo declarante (correção alheia = redeclaração); recusas de redeclaração aparecem como frase do banco na Mesa até o F; DELETE de história permanece (limpeza/descarte — cascatas passam por desenho). **Adiado:** D (falso sucesso/UX de erro), F (superfícies de supersessão/errata/redeclaração), H (documentos), K (docs canônicos + cosméticos).

## 9. Rollback

Por migration, colável no próprio arquivo (drop trigger/function/table/index; enums permanecem como resíduo documentado — precedente da casa). Rollback de código = revert dos commits do bloco; nenhuma migration anterior alterada; nada aplicado remotamente.
