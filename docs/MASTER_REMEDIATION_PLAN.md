# MASTER REMEDIATION PLAN — PLANO MESTRE DE CORREÇÕES DO ALIVIAR

**Data:** 2026-08-02 · **Status:** PROPOSTO — nenhuma correção começa antes da aprovação explícita deste plano.
**Base:** `AUDITORIA_GERAL_CONSOLIDADA.md` (13 causas raiz, decisões D-01..D-21), `REGISTRO_UNICO_DE_ACHADOS.md` (68 achados: 15 P0 · 27 P1 · 22 P2 · 4 P3), `GO_NO_GO_FINAL.md` (NO-GO).
**Princípio organizador:** blocos por **causa raiz**, não por bug. Cada bloco fecha uma estrutura que fabrica problemas — e com ela, todos os achados derivados. **Regra de ouro herdada da Fase 10:** toda correção de integridade nasce com um teste que **falha antes** e passa depois (prova de regressão); as travas de defeito são desarmadas **no mesmo commit** da correção.

---

## 1. Mapa das causas raiz → blocos

| Causa raiz (Consolidada §4) | Bloco que a resolve |
| --- | --- |
| CR-5 Release fora do git | **Bloco 0 — Fundação** |
| CR-11 Bus factor / credenciais (parte urgente: rotação) | **Bloco 0** (rotação) + **Bloco I** (operação) |
| CR-4 Decisões sem ADR / só-na-memória | **Bloco A — Governança das decisões** |
| CR-6 Ausência de CI + CR-13 testes que certificam o defeito (parte 1) | **Bloco G1 — Rede de segurança de testes** |
| CR-2 Curadoria sem RPC + CR-8 multi-escrita com erro descartado | **Bloco B — Atomicidade** |
| CR-1 Invariantes fora do banco + CR-9 auditoria como acidente | **Bloco C — Imutabilidade e auditoria** |
| CR-8/CR-13 (defeitos destrutivos e silêncios pontuais) | **Bloco D — Falso sucesso e silêncios** |
| CR-3 Fontes de verdade duplicadas | **Bloco E — Fonte única** |
| CR-7 Capacidade sem superfície | **Bloco F — Superfícies e papéis** |
| CR-12 Privacidade e retenção inexistentes | **Bloco H — Privacidade e dado clínico** |
| CR-10 Sem staging/telemetria + CR-11 (operação) | **Bloco I — Operação, observabilidade e recuperação** |
| (consequência de CR-5/CR-10) publicação remota | **Bloco J — Publicação controlada** |
| CR-13 (parte 2: E2E/limpeza/guardas) | **Bloco G2 — Honestidade do E2E** |
| CR-4 residual + dívidas P2/P3 | **Bloco K — Documentação canônica e higiene** |

**Cobertura: 68/68 achados mapeados** (matriz completa na §2; verificação de completude no checklist da §10).

---

## 2. Blocos

### BLOCO 0 — Fundação: versionar e estancar
**Causa raiz:** CR-5 (release fora do git) + a parte de incidente de CR-11.
**Descrição:** transformar o working tree certificado num commit taguedo e encerrar o incidente de credenciais. Nada de refactor — commit do estado como está (a auditoria já o descreveu; corrigir antes de versionar destruiria a rastreabilidade das correções).
**Encontrada por:** F8 (H-C1), F9, F5 (§15).
**Resolve:** REL-01 · SEG-01 · DOC-05 (parte: registrar os prompts/decisões da sessão enquanto existem).
**Módulos:** nenhum (git + painéis). **Tabelas/migrations:** nenhuma (as 5 migrations entram no commit **sem serem aplicadas remotamente**). **ADRs:** nenhuma nova (registro da release no CHANGELOG).
**Testes que mudam:** nenhum. **E2E:** nenhum. **Docs:** CHANGELOG (entrada da release), CREDENTIALS.md (registro do incidente e da rotação — sem valores).
**Dependências:** decisão **D-02** (versionar — recomendação: commit integral + tag `reconstrucao-v1.2.0`); rotação exige o responsável (painéis Supabase/Vercel).
**Risco:** baixíssimo (commit é reversível; a preservação externa `d99b3e80…` é o seguro).
**Ordem:** **primeiro, obrigatório, bloqueia tudo.**
**Passos:** (1) remover as 2 linhas de senha do `.env.local` → rotacionar as 2 senhas humanas + senha do banco + `SUPABASE_ACCESS_TOKEN` + verificar `ANTHROPIC_API_KEY` órfã na Vercel; (2) `git add -A` cuidadoso (conferir `untracked-incluidos.txt`; adicionar `.build-id`/locks ao `.gitignore` antes); (3) commit + tag; (4) push **sem** deploy (Vercel: pausar auto-deploy da janela ou push em branch — decidir na execução); (5) atualizar build-info por rebuild local para provar commit verdadeiro.

### BLOCO A — Governança das decisões
**Causa raiz:** CR-4.
**Descrição:** uma sessão de decisões com o responsável (D-01, D-03..D-10, D-12..D-16, D-20, D-21) convertida em ADRs — porque cinco blocos técnicos não podem começar sem elas. Inclui as ADRs de regularização do passado.
**Encontrada por:** F1 (§3.2), F8 (todo).
**Resolve:** CAT-02 · DOC-02 · DOC-04 · DOC-05 (restante) · PAP-03 · IM-07.
**Módulos:** nenhum. **Tabelas:** nenhuma. **Migrations:** nenhuma. **ADRs:** novas ADR-046+ (aprovação do Catálogo 1.0.0; papéis atendente/concierge; ampliação do Curador — regularizar ou reverter; renomeações de critérios; reabertura pós-021; correções de status 029/041/043/044; regra de marcação de supersedida — decidir formato).
**Testes/E2E:** nenhum. **Docs:** DECISIONS.md (append), CATALOGO_CANONICO_PROPOSTA.md (cabeçalho pós-D-01), INDEX (entrada das novas).
**Dependências:** Bloco 0 (as ADRs nascem versionadas). **Exige o responsável** — é o bloco onde a máquina para e a pessoa decide.
**Risco:** baixo (só documentos); risco real é **não fazer** (blocos E/F/H/J ficariam sem autoridade).
**Ordem:** 2º, em paralelo com G1 e o início de I.

### BLOCO G1 — Rede de segurança de testes (antes de corrigir)
**Causa raiz:** CR-6 + CR-13 (parte 1).
**Descrição:** escrever a **suíte de invariantes que falha hoje** (cada furo da matriz F3 §5 / F4 §2 vira um teste vermelho), cobrir as RPCs nunca testadas, montar o CI mínimo. É a definição de "reproduzir antes de corrigir" aplicada ao plano inteiro: os blocos B/C/D só são aceitos quando esta suíte vira verde.
**Encontrada por:** F6 (§21.1-2), F4.
**Resolve:** TST-02 · TST-04 · SEG-04 · TST-01 (mecanismo: inventário das 5 travas, desarme executado em D).
**Módulos:** `tests/integration/**` (novos: `invariantes/*.integration.test.ts`), `.github/workflows/`. **Tabelas:** leitura apenas. **Migrations:** nenhuma. **ADRs:** nenhuma.
**Testes criados:** ~25-35 novos — imutabilidade (DELIVERED→DRAFT deve recusar; VALIDATED→DRAFT; mapa pós-reconhecimento; enviada→rascunho; emitted_at regravável; INSERT já-DELIVERED com 0 opções), atomicidade (entrega com relatório recusado; conversão com RPC recusando; duplo submit de `open_case_from_lead`; `saveSelection` com INSERT falho), `acknowledge_priority_profile` (6 cenários), eixo CRM (convert/qualify/open), fail-open da blocklist (consulta falhando ⇒ deve fechar). **Todos vermelhos na criação — é o esperado e o critério.**
**E2E:** nenhum ainda. **Docs:** nota de método no cabeçalho da suíte.
**Dependências:** Bloco 0. **Risco:** baixo (só adiciona testes; CI só com as suítes hoje verdes + as novas marcadas `expected-fail` até os blocos B/C/D).
**Ordem:** 2º, paralelo com A.

### BLOCO B — Atomicidade (as 5 operações compostas viram RPC)
**Causa raiz:** CR-2 + CR-8.
**Descrição:** promover a RPC transacional — pelo gabarito do módulo Connection — as cinco escritas compostas: **entrega da Curadoria** (idempotente, exige relatório emitido, preserva `emitted_at`, grava autor + case_event), **conversão de lead** (com compensação/`deleteUser` e saída do estado travado), **`open_case_from_lead`** (corrigir `active_case_id`), **seleção** (save atômico), **criação de paciente** (compensação do auth órfão). Eliminar o antipadrão erro-descartado nas 4 posições.
**Encontrada por:** F2 (C4), F3 (§6), F4, F5 (§10), F9.
**Resolve:** AT-01 · AT-02 · AT-03 · AT-04 · AT-05 · AT-06 · IM-03 · FS-05 · AU-04 (case_events dos atos) · parte de AU-02 (autoria de emissão/entrega).
**Módulos:** `src/modules/curadoria/{actions,repository,report-repository}`, `src/modules/crm/{conversion-actions,lead-repository}`, `src/modules/profiles/patient-account-*`, `src/modules/cases/repository`. **Tabelas:** `curated_selections`, `curadoria_reports` (+colunas de autor `emitted_by`/`delivered_by`/`acknowledged_by` se D-06 confirmar), `cases`, `case_events`, `crm_*`. **Migrations:** 3-4 novas locais (RPCs `deliver_curadoria`, `convert_lead_to_patient` revisada, fix de `open_case_from_lead`, colunas de autoria). **ADRs:** 1 nova (política transacional da Curadoria — formaliza o gabarito Connection como regra).
**Testes:** os de G1 deste grupo passam a verdes; integração da entrega passa a chamar **a action/RPC real** (fim do bypass — F6). **E2E:** `reconstrucao-fluxo-completo` passos 11-12 revalidados; ganha oráculo de banco da entrega (em G2).
**Docs:** BACKLOG (fechar itens), comentários das actions renomeadas (GOV-03 parcial: `deliverSelectionAction` passa a dizer o que faz).
**Dependências:** G1 (testes vermelhos prontos), A (nenhuma decisão bloqueante — D-06 influencia colunas de autoria).
**Risco:** **médio-alto** — mexe no coração; mitigado por: testes-primeiro, RPC nova convivendo com caminho antigo até o switch, E2E completo como gate de saída.
**Ordem:** 3º (após G1), paralelo com D.

### BLOCO C — Imutabilidade dos estados finais + auditoria
**Causa raiz:** CR-1 + CR-9.
**Descrição:** aplicar a **política de guarda** (D-06) — os estados finais do Método ganham trigger/constraint no banco (o padrão do domínio Connection): seleção DELIVERED, Perfil VALIDATED + `case_priority_map` pós-reconhecimento, história `enviada` (status), carimbos na lista congelada, competências (guarda contra `replace([])`), SUPERSEDED conforme D-07 (implementar supersessão OU registrar impossibilidade), retratação pós-entrega conforme D-16. Junto, a **auditoria mínima administrativa**: reset de senha, publicação/despublicação, exclusão de documento, autoria do reconhecimento — em `audit_logs` (enum ampliado).
**Encontrada por:** F3 (§5, §13), F4 (matriz inteira), F7 (§17), F9.
**Resolve:** IM-01 · IM-02 · IM-04 · IM-05 · IM-06 · IM-08 · AU-01 · AU-02 (restante) · PAP-04 · FUN-05 · FS-03 (a guarda de banco; o form é do Bloco D) · OPS-04 · UX-03 · UX-04 (confirmações — o par de UI da trilha).
**Módulos:** migrations + `src/components` (7 confirmações destrutivas), `src/modules/profiles`, textos de promessa (alinhar ao que o banco agora garante). **Tabelas:** `curated_selections`, `priority_profiles`, `case_priority_map`, `patient_stories`, `curadoria_reports`, `professional_competency_areas`, `audit_logs`, `professional_profiles` (UNIQUE crm/uf; gate×status). **Migrations:** 4-6 novas locais (triggers de congelamento; enum audit; constraints). **ADRs:** 1 (a política de guarda — qual invariante mora onde) + a decisão D-07/D-16 registradas.
**Testes:** os de G1 deste grupo viram verdes; testes de recusa dos 6 triggers hoje sem prova. **E2E:** fluxo completo revalidado (as guardas não podem quebrar o caminho feliz — é o teste de que a política foi bem calibrada).
**Docs:** MODELO §11 (nota), Ontologia (IM-07 conforme D), textos de UI de promessa.
**Dependências:** **B primeiro** (as RPCs nascem compatíveis com os triggers; aplicar triggers antes quebraria os caminhos atuais), D-06/D-07/D-16 (A).
**Risco:** médio-alto (trigger mal calibrado trava operação legítima — mitigação: E2E completo + suíte de integração como gate; cada trigger com teste de recusa E de permissão).
**Ordem:** 4º, após B.

### BLOCO D — Falso sucesso e silêncios (defeitos destrutivos pontuais)
**Causa raiz:** CR-8/CR-13 (manifestações localizadas).
**Descrição:** os consertos cirúrgicos que não dependem de arquitetura: **fail-open da Rede → fail-closed com log**; **autosave honesto** + estado de sessão expirada de 1ª classe (frase, link, preservação); **form do profissional** re-ganha os campos de competência (com a trava de teste desarmada); **`favorablePoints`/round-trip** dos pareceres sem perda (serialização simétrica); **`/api/crm/leads`** liberada no middleware com segredo obrigatório em todo ambiente + log de ingestão; **revalidatePath do Briefing** corrigido; fail-silent operacionais distinguindo erro de vazio (worklist, dashboard `safe()` com `registrarErro`); `setEncaminhado` pós-await; Mesa com `loading.tsx`/`error.tsx` + autosave/beforeunload + isLoading do rascunho.
**Encontrada por:** F1 (§5), F2 (C1..C3), F5, F6, F7, F9.
**Resolve:** FS-01 · FS-02 · FS-03 (o form) · FS-04 · FS-06 · FUN-01 · NAV-02 · UX-02 · UX-06 · TST-01 (execução do desarme, trava a trava, no mesmo commit de cada correção).
**Módulos:** `rede-policy.ts`, `use-story-draft`/`autosave-indicator`, `professional-profile-form`, `report-editor` + `mesa.ts` (serialização), `middleware`/`public-paths`/rota de leads, `curadoria-briefing`, `continuity-worklist`, `dashboard-repository`, `lead-workspace`, `app/coa/**` (boundaries), `mesa-workspace` (autosave). **Tabelas:** nenhuma. **Migrations:** nenhuma. **ADRs:** nenhuma.
**Testes:** as 5 travas desarmadas (os 8 arquivos de `favorablePoints` corrigidos junto); novos: fail-closed da blocklist, autosave com sessão expirada renderizando o indicador, round-trip dos pareceres, POST anônimo ao endpoint de leads (com e sem segredo), teste de amarração dos alvos de revalidação. **E2E:** wizard + Mesa + entrega re-executados.
**Docs:** BACKLOG (fechar RECONHECE/NAV como "sob guarda", registrar o 3º caso do lead-workspace).
**Dependências:** G1 (testes vermelhos). Independente de B/C (arquivos disjuntos) — **pode rodar em paralelo com B**.
**Risco:** médio (cada item é pequeno; o risco é volume — mitigado por 1 commit por defeito com sua trava).
**Ordem:** 3º, paralelo com B.

### BLOCO E — Fonte única
**Causa raiz:** CR-3.
**Descrição:** executar D-05: o **banco vira a fonte do Catálogo** (recomendação da evidência) — FK em `practice_evidence.subcriterion_code`, validação de `options[]` contra `method_subcriterion_options`, imutabilidade/autoria do catálogo por trigger, TS passa a ler do banco (ou arrays gerados de migration com teste de paridade); resolver D1–D16. Mais: paridade enum↔banco (fim do fantasma `em_verificacao`), `SELECTION_SIZE` como constante, paridade parecer UI↔domínio, `cases.status` conforme D-16/FUN-03 (conectar ou aposentar com overview re-fonteada), fim do fluxo-por-substring (resultados tipados).
**Encontrada por:** F1 (§3.1), F3 (§9), F5 (§4).
**Resolve:** CAT-01 · CAT-03 · FUN-03 · FS-07 · parte de UX-08 (títulos do parecer unificados).
**Módulos:** `mapa-prioridades*`, `evidencias-pratica`, `protocolos*`, `professional-repository`, `publication-pendencies`, `fontes`, `mesa.ts`/`report-editor`, `curadoria/actions` (resultados tipados). **Tabelas:** `method_subcriteria`, `method_subcriterion_options`, `practice_evidence`. **Migrations:** 2-3 (FK + trigger de imutabilidade do catálogo + eventual coluna de ordem por eixo). **ADRs:** amarrada à D-01/D-05 (Bloco A).
**Testes:** `catalogos-coerentes` ampliado (opções, códigos, ordem, eixo — lendo a migration, não transcrevendo); teste de paridade enum↔banco (ou geração de tipos); paridade parecer.
**E2E:** Mapa (passo 7) + formulário do Protocolo revalidados.
**Docs:** CATALOGO_CANONICO_OPERACAO (nota de vigência), MODELO (referência).
**Dependências:** A (D-01/D-05). Independente de B/C em código — paralelo com C.
**Risco:** médio (mudar leitura do catálogo toca Mesa + Protocolo + Mapa; mitigado pelo teste de paridade primeiro).
**Ordem:** 4º, paralelo com C.

### BLOCO F — Superfícies e papéis
**Causa raiz:** CR-7.
**Descrição:** executar D-03/D-04 **item a item** — para cada capacidade órfã: publicar a superfície, remover a capacidade, ou adiar com registro. Mínimo provável (a confirmar na decisão): superfície de **aproximação intermediada** (o banco está pronto e exemplar) + notificações internas com lista/read; **Avaliação técnica** (superfície OU remoção da pendência perpétua + da leitura vazia da paciente); **MandatoryFilters** (renderizar OU remover a exigência); **painel de divergências** do Admin (ou pendência reescrita); **concessão de papéis** atendente/concierge na Equipe + permissões COA/CRM do Atendente; vínculo `profile_id` do Profissional + canal mínimo conforme D-03; writer de produção para `is_certification` (ambiente de treino); `resolveUpdateRequest` com superfície.
**Encontrada por:** F2 (§8, C6), F7 (§13-15), F9 (Partes 12-13).
**Resolve:** ORF-01 · ORF-02 · ORF-03 · ORF-04 · ORF-05 · PAP-01 · PAP-02 · OPS-02 · OPS-05 (parte de superfícies).
**Módulos:** `src/app/{acompanhamento,coa,admin/equipe,admin/profissionais,profissional}`, `src/components/{curadoria,crm,profiles}`, `src/modules/{connection,coa/permissions,team}`. **Tabelas:** `team_notifications` (uso dos estados), `user_roles`, `professional_profiles.profile_id`, `cases.is_certification`. **Migrations:** 0-2 (depende das decisões — possivelmente nenhuma; o banco já está pronto). **ADRs:** as decisões D-03/D-04 registradas (A).
**Testes:** `actions-have-callers` estendido a 27/27 módulos com mecanismo de import real (o guarda que teria pego tudo isto); components das novas superfícies; negativos de permissão do Atendente.
**E2E:** **novos** — Concierge (escolha intermediada → tentativa → resposta), Atendente (lead → conversão → Case), concessão de papel. São os E2E das áreas com zero cobertura (F6 densidade invertida).
**Docs:** OPERATIONAL_ROLES_MODEL (ou nota), manual de operação do Concierge.
**Dependências:** A (D-03/D-04); PAP-01 antes de OPS-01 (Bloco I) — a segunda pessoa depende da concessão pela UI.
**Risco:** médio (código novo de UI sobre banco pronto; risco maior é escopo — contido pela decisão item a item).
**Ordem:** 5º, após C/E, paralelo com H.

### BLOCO H — Privacidade e dado clínico
**Causa raiz:** CR-12.
**Descrição:** executar D-08/D-09/D-10: **política de documentos** (MIME+tamanho em bucket e action + mensagem própria; download pela equipe; exclusão com confirmação, tombstone/trilha, remoção de storage **verificada**, fechamento do F2-RLS — paciente não deleta anexado a Case ativo; rotina/cascata de storage no descarte); **base de privacidade** (política publicada + consentimento na jornada + textos); tratamento Anthropic/analytics conforme D-10; retenção mínima conforme D-09 (ADR com prazos por entidade; log de leitura no escopo decidido); direitos do titular (caminhos definidos, mesmo que operacionais).
**Encontrada por:** F3 (F1/F2), F7, F9 (Partes 10-11).
**Resolve:** PRIV-01 · PRIV-02 · PRIV-03 · PRIV-04 · PRIV-05 · AU-03 · FUN-02.
**Módulos:** `patient-document-*`, `professional-document-*`, `story/attachment-*`, `documents-panel`, landing (rota /privacidade), wizard (consentimento), `layout.tsx` (analytics). **Tabelas:** `patient_documents` (tombstone se D-08), `storage.buckets` (limites), policies de DELETE. **Migrations:** 2-3 (buckets, policy F2, tombstone/audit). **ADRs:** retenção (D-09) + suboperadores (D-10).
**Testes:** upload inválido (MIME/tamanho) recusado nos 2 lados; exclusão verificada (linha E objeto); F2 fechado (negativo); consentimento persistido.
**E2E:** wizard com consentimento; upload/exclusão de documento.
**Docs:** política de privacidade (novo doc/rota), PATIENT_ENTRY_ARCHITECTURE (lacuna fechada), CREDENTIALS/ENVIRONMENT (analytics).
**Dependências:** A (D-08/D-09/D-10 + responsável LGPD nomeado); C (padrão de trilha).
**Risco:** médio (política de storage tem interação com restore — coordenar com I).
**Ordem:** 5º, paralelo com F.

### BLOCO I — Operação, observabilidade e recuperação
**Causa raiz:** CR-10 + CR-11 (restante).
**Descrição:** montar a operação que a Fase 9 constatou inexistente: **backup real** (D-13: plano/PITR OU rotina de dump com auth+storage; **um restore testado**, RTO/RPO); **runbook único de deploy** com comandos válidos, `/api/build-info` na verificação e histórico de publicações; **observabilidade mínima** (D-11: health check consultável; alertas dos 3 silêncios críticos — entrega parcial, fail-open, ingestão de leads; `registrarErro` nas actions da Curadoria; ERR- no runbook; `global-error`); **incidentes** (D-15: IC nomeado, procedimento de credencial comprometida e de acesso indevido, escala aplicada); **smoke canônico único** (com lead, anexo, build-info e limpeza escrita); **bus factor** (D-14: segunda conta segregada — depende de F/PAP-01 —, segundo detentor de credenciais, procedimento de ausência); inventário de credenciais completo com donos; furo `SUPABASE_DB_URL` fechado; staging conforme D-12; observabilidade de negócio (as 5 perguntas críticas respondíveis); DAD-02 (contas de teste em produção) conforme D-20; funil FUN-04.
**Encontrada por:** F9 (inteira), F5 (§14).
**Resolve:** REC-01 · REL-02 · REL-03 · REL-04 · SEG-02 · SEG-03 · SEG-05 · OBS-01 · OBS-02 · OBS-03 · OBS-04 · OBS-05 · OPS-01 · OPS-03 · DOC-06 · DAD-02 · FUN-04.
**Módulos:** `src/app/api/health` (novo), `src/lib/observability`, `src/modules/curadoria/actions` (adoção), scripts (guard fix), runbooks. **Tabelas:** nenhuma central (talvez `ops_deploy_log` se decidido). **Migrations:** 0-1. **ADRs:** D-11/D-12/D-13/D-14/D-15 registradas.
**Testes:** health check; guard do db-reset (caso `SUPABASE_DB_URL`); smoke executável descrito como checklist verificável.
**E2E:** nenhum novo (o smoke é de produção, manual+leituras).
**Docs:** **os grandes deste bloco** — DEPLOY_RUNBOOK reescrito, OPERATIONS corrigido (schema `curadoria`!), RECOVERY com coordenadas reais, INCIDENT playbook, COMMAND_CENTER com seção de deploys, CREDENTIALS completo.
**Dependências:** 0 (começa logo após); partes finais dependem de F (PAP-01→segunda conta) e de todas as correções (runbook descreve o estado final).
**Risco:** baixo-médio (majoritariamente processo/docs/config; o restore testado é a única operação delicada — em projeto descartável).
**Ordem:** inicia em 2º (paralelo), conclui em penúltimo.

### BLOCO G2 — Honestidade do E2E e higiene de dados de teste
**Causa raiz:** CR-13 (parte 2).
**Descrição:** o pacote do E2E: religar o porteiro de ambiente (project/dependencies); `actionTimeout`/`navigationTimeout`; `trace: retain-on-failure` local; **oráculos de banco nos 3 momentos terminais** (entrega, reconhecimento, publicação); limpeza-ou-namespace por spec + marcação dos dados E2E (a 3ª categoria decidida em D-20) + storage na limpeza; `SEED_MESA` explícito; workers=1 até isolamento; guardas ampliadas (`journey-no-orphans` sem `|| dinamica`, paleta por glob, `erros-rastreaveis` exigindo adoção); negativos nas 5 linhas vazias da matriz (seleção, upload, conversão, declaração de área, entrega).
**Encontrada por:** F5 (§14), F6 (§§7-15), F9 (P18).
**Resolve:** TST-03 · TST-05 · TST-06 · DAD-01 · DAD-03 · GOV-01.
**Módulos:** `playwright.config.ts`, `tests/e2e/**`, `tests/integration/limpeza`. **Tabelas:** flags de marcação (se D-20 criar coluna — 1 migration). **ADRs:** nenhuma.
**Testes:** os próprios. **E2E:** `reconstrucao-fluxo-completo` ganha oráculos; suite completa re-executada como **certificação 2.0** — o gate de saída do plano inteiro.
**Docs:** nota de método do E2E.
**Dependências:** B/C/D (os oráculos assertam o comportamento **corrigido**); D-20.
**Risco:** baixo-médio (config de teste; o risco é revelar flakes reais — que é o objetivo).
**Ordem:** 6º, após B/C/D/E.

### BLOCO J — Publicação controlada (deploy + migração remota)
**Causa raiz:** consequência de CR-5/CR-10 — o ato final que tudo acima habilita.
**Descrição:** reescrever o dossiê para **as 5 migrations + as novas dos blocos B/C/E/H** (backup ampliado incluindo `patient_stories`/`patient_documents`/`patient_story_attachments`; rollback das 5+N incluindo a `130000` — policy antiga em `20260723164709:94`; proveniência do DELETE da `120000` — guarda com ids nomeados ou log; cenário de falha parcial; matriz código×schema com o ponto-sem-retorno documentado); executar a **ordem segura da F9 §7**: backup → deploy do código → build-info → `migration list` → `db push` em janela mínima → validações + prova funcional do 42P17 → smoke canônico → ativação.
**Encontrada por:** F3 (§12), F9 (§7).
**Resolve:** REC-02 · REC-03 · REC-04.
**Módulos:** nenhum (operação). **Tabelas:** as das migrations acumuladas. **Migrations:** aplica todas as pendentes (5 + as dos blocos). **ADRs:** autorização explícita registrada.
**Testes:** suíte completa verde antes da janela (gate). **E2E:** certificação 2.0 (G2) verde no build da janela.
**Docs:** MIGRACAO_REMOTA reescrito (vira o modelo de dossiê), registro da janela no COMMAND_CENTER.
**Dependências:** **todos os blocos técnicos** (0, A, B, C, D, E, G1, G2) + I (backup testado, smoke, runbook) + H (se as migrations de H entram na mesma janela — recomendado). É o único bloco que **toca produção**.
**Risco:** médio — mas é exatamente o risco que o plano inteiro existe para reduzir; com os gates satisfeitos, a janela é de minutos com rollback escrito.
**Ordem:** **último bloco técnico.** Exige autorização explícita na hora.

### BLOCO K — Documentação canônica e higiene (paralelo/pós)
**Causa raiz:** CR-4 residual + dívidas P2/P3.
**Descrição:** MODELO versionado pós-042 (ou rebaixado — D-17) + MANUAL alinhado; INDEX reconciliado (98 docs — ou escopo declarado); varredura única de vocabulário aposentado (CTA "Validar" e as 4 superfícies + guidance do parecer) com guarda ampliada; renomeação do curador ou rewrite registrado (D-19) + remoção dos mortos comprovados (árvores, mocks, `platform/runtime`, comentários obsoletos incl. `repository.ts:216-217`); a11y (3 consertos de alavancagem: FormField describedby/invalid, main/live da Mesa, focus trap + heading); textos dos momentos frágeis (limbo com prazo/canal, 404 na casa, privacidade — coordenado com H); unificações (5 títulos do parecer — com E; 4 nomes da entrega; Perfil×Conta); capacidade (índices dos caminhos quentes, `maxDuration`, chunking do `.in()` OU gatilhos documentados); NAV-01 (dívidas com cláusula de saída + plano de upgrade do Next em pacote); GOV-03/04.
**Encontrada por:** F1, F5, F7, F8, F9.
**Resolve:** DOC-01 · DOC-03 · UX-01 · UX-05 · UX-07 · UX-08 · NAV-01 · NAV-03 · CAP-01 · CAP-02 · CAP-03 · GOV-02 · GOV-03 · GOV-04.
**Módulos:** docs + UI de texto + limpeza. **Migrations:** 0-2 (índices — podem ir na janela J). **ADRs:** D-17/D-19.
**Testes:** guarda de vocabulário sobre texto de usuário; meta-teste dos alvos de revalidação (com E).
**Dependências:** A (D-17/D-19); textos de promessa após C (escrever o que o banco agora garante). Nenhum bloco depende de K.
**Risco:** baixo. **Ordem:** contínuo em paralelo; fecha por último.

---

## 3. Dependências (DAG)

```
                    ┌─────────────────────────────────────────────┐
                    │              BLOCO 0 — Fundação             │
                    └──────┬───────────────┬──────────────┬───────┘
                           │               │              │
                 ┌─────────▼───┐   ┌───────▼──────┐  ┌────▼─────────────┐
                 │ A Governança│   │ G1 Rede de   │  │ I Operação       │
                 │ (decisões)  │   │ testes       │  │ (início: backup, │
                 └──┬───┬───┬──┘   └───┬──────┬───┘  │ runbooks, creds) │
                    │   │   │          │      │      └────┬─────────────┘
        ┌───────────┘   │   └────────┐ │      │           │
        │               │            │ │      │           │
  ┌─────▼─────┐   ┌─────▼─────┐   ┌──▼─▼──┐ ┌─▼────────┐  │
  │ E Fonte   │   │ F Superf. │   │ B Ato-│ │ D Falso  │  │
  │ única     │   │ e papéis  │   │ micid.│ │ sucesso  │  │
  └─────┬─────┘   └─────┬─────┘   └──┬────┘ └─┬────────┘  │
        │               │            │        │           │
        │               │      ┌─────▼────────▼─┐         │
        │               │      │ C Imutabilidade│         │
        │               │      │ + auditoria    │         │
        │               │      └─────┬──────────┘         │
        │         ┌─────▼─────┐      │                    │
        │         │ H Privaci-│      │                    │
        │         │ dade      │      │                    │
        │         └─────┬─────┘      │                    │
        └───────────┬───┴────────────┤                    │
                    │          ┌─────▼──────┐             │
                    │          │ G2 E2E     │             │
                    │          │ honesto    │             │
                    │          └─────┬──────┘             │
                    │                │   ┌────────────────┘
                    │          ┌─────▼───▼──┐
                    └─────────►│ J Publica- │      K Higiene/docs:
                               │ ção        │      paralelo contínuo,
                               └────────────┘      sem dependentes
```

**Arestas críticas:** 0→tudo · G1→{B,C,D} (testes antes das correções) · B→C (RPCs antes dos triggers) · A→{E,F,H} (decisões antes de superfície/fonte/política) · {B,C,D,E}→G2 (oráculos assertam o corrigido) · F(PAP-01)→I(segunda conta) · {G2,I,H}→J.
**Paralelismo real:** {A ∥ G1 ∥ I-início} · {B ∥ D} · {C ∥ E} · {F ∥ H} · K contínuo.

## 4. Estratégia por bloco (antes / durante / depois / critérios)

Formato comum a todos os blocos; especificidades na tabela:

- **Antes:** branch por bloco a partir da tag do Bloco 0; os testes de G1 pertinentes ao bloco identificados e vermelhos; decisões do bloco registradas em ADR.
- **Durante:** um commit por achado resolvido, citando o ID do Registro; trava de defeito desarmada no mesmo commit da correção; nenhuma migration aplicada fora do local.
- **Depois:** suíte completa (unit+components+integration) verde; E2E do fluxo completo verde; diff revisado contra o escopo do bloco (nada fora).
- **Critério de aceite:** os testes-que-falhavam do bloco passam; os achados do bloco marcados `encerrado` no Registro com evidência.
- **Critério de rollback:** revert do branch/merge (blocos são só-locais até J); para J, o rollback é o do dossiê reescrito.
- **Critério de regressão:** E2E 12/12 + integração completa verdes após o merge; em G2+, com oráculos de banco.
- **Critério para liberar o próximo:** aceite + regressão + atualização do Registro; para C→G2 e G2→J, adicionalmente aprovação humana do resultado do bloco.

| Bloco | Especificidades de aceite |
| --- | --- |
| 0 | tag existe; `git status` limpo; rotação evidenciada pelo responsável; build-info local reporta o commit novo |
| A | ADRs apendadas; D-01..D-21 com estado (decidida/prazo/aceita) |
| G1 | suíte vermelha documentada (lista do que falha e por quê); CI verde nas suítes estáveis |
| B | entrega idempotente provada (2ª chamada não muda carimbos); conversão com compensação provada; bypass da integração eliminado |
| C | cada trigger com par de testes (recusa + permissão); E2E feliz intacto; 7 confirmações destrutivas no ar |
| D | os 5 desarmes feitos; endpoint de leads com POST externo provado; indicador de autosave honesto renderizado em teste |
| E | teste de paridade catálogo passa; grep de `em_verificacao` = 0; `SELECTION_SIZE` único |
| F | por item de D-04: superfície testada OU remoção completa (grep de resíduo = 0) |
| H | política publicada e linkada; upload inválido recusado com mensagem própria; exclusão verificada linha+objeto |
| I | restore executado com RTO/RPO anotados; runbook único validado por dry-run; alerta dos 3 silêncios dispara em teste |
| G2 | porteiro executa (prova: log); oráculos de banco nos 3 terminais; suite E2E limpa atrás de si (sentinela) |
| J | checklist Go/No-Go da F9 §27 = 11/11 antes da janela; janela executada na ordem segura; smoke canônico OK; **novo julgamento GO/NO-GO** |
| K | vocabulário aposentado: grep = 0 em superfícies; INDEX reconciliado ou escopo declarado |

## 5. Testes (consolidado)

| Bloco | Precisam existir antes (vermelhos) | Falham hoje | Criados no bloco | E2E executados |
| --- | --- | --- | --- | --- |
| G1 | — (é o bloco que os cria) | ~25-35 novos, todos | suíte de invariantes + RPCs núcleo + CI | nenhum |
| B | invariantes de atomicidade/idempotência | sim (por desenho) | integração via action real da entrega/conversão | fluxo completo |
| C | invariantes de imutabilidade + recusa de triggers | sim | pares recusa/permissão por trigger; auditoria presente | fluxo completo |
| D | fail-closed, autosave, round-trip, leads | sim | + teste de amarração de revalidação; desarme das 5 travas | wizard, Mesa, entrega |
| E | paridade catálogo/enum | sim (paridade falha) | catalogos-coerentes ampliado; tipos gerados ou teste | Mapa, Protocolo |
| F | — | — | components novos; actions-have-callers 27/27; negativos de permissão | **novos**: Concierge, Atendente, papéis |
| H | upload/exclusão/F2 | sim | consentimento; storage verificado | wizard c/ consentimento, documentos |
| I | — | — | health; guard db-reset | — (smoke manual canônico) |
| G2 | — | — | oráculos de banco; limpeza; guardas ampliadas | **certificação 2.0 completa** |
| J | tudo verde (gate) | não pode | — | certificação 2.0 no build da janela |

## 6. Migrations

| Bloco | Exige migration? | Conteúdo | Rollback |
| --- | --- | --- | --- |
| 0, A, D, G1, G2, I*, K* | **Não** (I/K: opcionais — deploy-log, índices) | — | n/a |
| B | Sim (3-4) | RPCs (entrega, conversão, fix open_case), colunas de autoria | `drop function`/`drop column` — escrito na própria migration |
| C | Sim (4-6) | triggers de congelamento; enum audit ampliado; UNIQUE crm/uf | `drop trigger` — escrito; nenhum DML |
| E | Sim (2-3) | FK practice_evidence; imutabilidade do catálogo; ordem por eixo | `drop constraint/trigger` — escrito |
| H | Sim (2-3) | limites de bucket; policy F2; tombstone/audit de documento | escrito por migration |
| F | 0-2 | conforme D-04 (provavelmente nenhuma) | idem |
| **J** | **Aplica todas** (5 pendentes + as novas), na ordem de timestamp, após deploy do código | — | dossiê reescrito com rollback por migration + matriz código×schema |

**Regra:** nenhuma migration nova sem seção de rollback no próprio arquivo (o padrão que faltou à `120000`). O DELETE da `120000` ganha, antes de J, guarda com ids nomeados ou log de proveniência (decidir na reescrita do dossiê).

## 7. Documentação

- **ADRs novas/regularizadas (Bloco A + por bloco):** aprovação do Catálogo; política transacional; política de guarda; retenção; suboperadores; papéis; ampliação do Curador; renomeações; reabertura pós-021; correções de status 029/041/043/044; marcação de supersedida; D-12/13/14/15 operacionais.
- **Docs reescritos:** DEPLOY_RUNBOOK, OPERATIONS (schema!), RECOVERY, MIGRACAO_REMOTA (dossiê 2.0), CREDENTIALS, smoke canônico (novo), política de privacidade (novo).
- **Docs atualizados:** MODELO (D-17), MANUAL, INDEX, BACKLOG (fechamentos), CATALOGO_*, OPERATIONAL_ROLES_MODEL, COMMAND_CENTER.
- **Auditorias:** **não são editadas** (histórico imutável). O `REGISTRO_UNICO_DE_ACHADOS.md` é o documento vivo: cada achado ganha `Situação: encerrado em <commit>` — é a ponte entre a auditoria e a correção.

## 8. Sequência ótima (por redução de risco, não por facilidade)

1. **Bloco 0** — remove os dois riscos existenciais (perda da release; credencial ativa comprometida). Nada reduz mais risco por hora investida.
2. **G1 ∥ A ∥ I-início** — a rede de segurança antes de tocar o código; as decisões antes de construir sobre elas; backup/runbooks começam já (independem do código).
3. **B ∥ D** — os P0 de dados e falso-sucesso caem aqui (8 dos 15). B primeiro entre os dois se for preciso serializar (a entrega é o maior risco vivo).
4. **C ∥ E** — o banco passa a garantir o que a interface promete; o catálogo ganha um dono. Riscos de calibragem contidos pelo E2E como gate.
5. **F ∥ H** — superfícies e privacidade: dependem de decisões, criam código novo — depois que o chão (B/C) parou de se mover.
6. **G2** — o E2E é endurecido **por último entre os locais**, para assertar o comportamento final.
7. **I-fim** — segunda conta (pós-F), alertas ligados, smoke canônico pronto.
8. **J** — a única janela que toca produção, com 11/11 do checklist e autorização explícita.
9. **K** — contínuo em paralelo desde o passo 2; fecha o plano.
10. **Novo julgamento GO/NO-GO** pela régua do `GO_NO_GO_FINAL.md §6`.

## 9. Estimativa

Complexidade/risco/impacto: baixo·médio·alto. Tempo em **dias úteis de execução técnica** (sem contar o tempo de decisão do responsável, marcado ⏸):

| Bloco | Complexidade | Risco de execução | Impacto (achados) | Tempo | Observação |
| --- | --- | --- | --- | --- | --- |
| 0 | baixa | baixo | 3 (2 P0) | 0,5-1d + ⏸ rotação | |
| A | baixa (técnica) | baixo | 6 | 1-2d + ⏸ **sessão de decisões (a maior espera do plano)** | |
| G1 | alta | baixo | 4 | 3-5d | investimento que paga em B/C/D |
| B | alta | **médio-alto** | 10 (3 P0) | 4-6d | coração do produto |
| D | média | médio | 10 (5 P0) | 3-4d | paralelizável com B |
| C | alta | médio-alto | 14 | 4-6d | calibragem de triggers |
| E | média | médio | 5 | 3-5d | paralelizável com C |
| F | média-alta | médio | 9 | 4-6d ⏸ escopo por D-04 | |
| H | média | médio | 7 | 3-5d + ⏸ política/LGPD | |
| I | média | baixo-médio | 17 | 4-6d + ⏸ painéis/restore | espalhado no calendário |
| G2 | média | baixo-médio | 6 | 3-4d | |
| J | média | médio (residual) | 3 (3 P0) | 1-2d prep + janela de horas | |
| K | média | baixo | 14 | 3-5d | paralelo contínuo |
| **Total** | | | **68/68** | **~37-52 dias úteis de execução** (~5-7 semanas com paralelismo de 2 frentes), fora esperas de decisão | |

## 10. Checklist de conclusão de cada bloco

Para **todo** bloco, nesta ordem, sem exceção:

- [ ] Todos os achados do bloco marcados `encerrado` no `REGISTRO_UNICO_DE_ACHADOS.md`, cada um com commit e evidência do critério de encerramento.
- [ ] Testes que falhavam → verdes; nenhum teste desarmado sem a correção no mesmo commit; nenhum teste novo pulado/skipped.
- [ ] Suíte completa local verde (unit + components + integration) e **E2E do fluxo completo verde** no estado do branch.
- [ ] Migrations do bloco (se houver) com rollback escrito no próprio arquivo e aplicadas **somente** no local.
- [ ] ADRs/docs do bloco atualizados; nenhuma auditoria histórica editada.
- [ ] Diff auditado contra o escopo: nada corrigido "de carona" sem ID.
- [ ] CI verde (a partir de G1).
- [ ] Registro de conclusão (1 parágrafo: o que fechou, o que ficou explicitamente fora) — vira o insumo do julgamento final.
- [ ] **Aprovação humana do bloco antes de liberar o dependente** (obrigatória em: 0, A, C, G2, J; recomendada nos demais).

**Verificação de completude do plano:** 68 achados ↔ blocos — 0:{REL-01, SEG-01, DOC-05p} · A:{CAT-02, DOC-02, DOC-04, DOC-05, PAP-03, IM-07} · G1:{TST-02, TST-04, SEG-04, TST-01p} · B:{AT-01..06, IM-03, FS-05, AU-04, AU-02p} · C:{IM-01,02,04,05,06,08, AU-01, AU-02, PAP-04, FUN-05, FS-03p, OPS-04, UX-03, UX-04} · D:{FS-01,02,03,04,06, FUN-01, NAV-02, UX-02, UX-06, TST-01} · E:{CAT-01, CAT-03, FUN-03, FS-07, UX-08p} · F:{ORF-01..05, PAP-01, PAP-02, OPS-02, OPS-05} · H:{PRIV-01..05, AU-03, FUN-02} · I:{REC-01, REL-02,03,04, SEG-02,03,05, OBS-01..05, OPS-01, OPS-03, DOC-06, DAD-02, FUN-04} · G2:{TST-03,05,06, DAD-01, DAD-03, GOV-01} · J:{REC-02,03,04} · K:{DOC-01, DOC-03, UX-01,05,07,08, NAV-01,03, CAP-01..03, GOV-02,03,04}. *(p = parcial, com o complemento no bloco indicado.)*

---

**Este plano não corrige nada.** A implementação começa bloco a bloco somente após a aprovação explícita deste documento — e, dentro dela, o Bloco 0 primeiro, sempre.
