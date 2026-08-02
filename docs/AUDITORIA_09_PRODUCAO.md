# AUDITORIA GERAL — FASE 9: PRODUÇÃO, OPERAÇÃO, PRIVACIDADE, INCIDENTES E RECUPERAÇÃO

**Data:** 2026-08-02
**Natureza:** inspeção somente. Nenhum deploy, nenhuma migration aplicada, nenhum commit/push, nenhuma credencial rotacionada, nenhuma alteração em código, banco, configuração ou documento existente. Nenhum valor de segredo transcrito. O Supabase remoto não foi acessado; consultas read-only ao Supabase local foram usadas apenas para metadados e contagens.
**Base:** HEAD `fd031d9` (2026-08-01 18:58), árvore de 2026-08-02 (155 modificados + 1 staged + 57 untracked), 76 migrations, ~110 documentos operacionais, mais as Auditorias 1–8.

---

## 1. Resumo executivo

Pergunta do mandato: **"O Aliviar pode ser implantado, operado, monitorado e recuperado com segurança, previsibilidade e respeito à privacidade?"**

Resposta curta: **hoje, não.** Não por fragilidade do código — as Fases anteriores mostraram um produto funcional e certificado ponta a ponta — mas porque a **camada operacional em volta dele não existe ou aponta para coordenadas falsas**:

1. **A release não é implantável.** Ela vive só no working tree (sem commit, tag ou branch); o comando de publicação escrito no runbook publicaria o código errado; o artefato certificado se autodeclara como um commit (`fd031d9`) que não contém o que ele executa; e a partir da primeira migration aplicada, o único rollback confiável (Instant Rollback da Vercel) **deixa de ser seguro**. *(Críticos, certeza alta.)*
2. **A recuperação é uma promessa não verificada.** A documentação se contradiz sobre a própria existência de backup (RECOVERY manda restaurar de um "backup gerenciado" que o baseline nega — plano free, sem PITR); o único ponto de recuperação nomeado é um dump de 3 tabelas, com ~6 dias, numa pasta local; `auth.users` e o **storage com os laudos das pacientes** ficam fora de qualquer backup; RTO/RPO têm zero ocorrências em `docs/`; a restauração nunca foi testada, por declaração do próprio repositório. *(Críticos, certeza alta.)*
3. **O sistema não conta quando erra.** Zero telemetria por decisão declarada; as actions da Curadoria (incluindo a entrega) não geram log nem referência; 14 eventos — entre eles Rede contaminada por fail-open, fila do Concierge vazia por erro e lead externo morto no middleware — só seriam descobertos por reclamação humana. 0 de 12 cenários de incidente tem processo completo; nenhum tem detecção automática; zero cobertura de LGPD num produto de dado clínico. *(Críticos, certeza alta.)*
4. **Privacidade opera no vácuo documental.** Duas senhas humanas reais em claro no `.env.local` (uma de conta de **paciente** em ambiente hospedado) — incidente potencial, não achado; credenciais já expostas em log seguem não rotacionadas; "excluir" não elimina o laudo (a cascata nunca alcança o storage); zero log de leitura de dado clínico; nenhuma política de privacidade/termos no produto; texto clínico sai para a Anthropic sem que nenhum documento a trate como suboperadora; retenção/anonimização remetidas a uma ADR "com quem responde por LGPD" que nunca foi aberta. *(Crítico + altos, certeza alta.)*
5. **Bus factor = 1, autodeclarado.** Uma única pessoa — e uma única **conta** — acumula Administrador, Curador, aprovador de migration, Incident Commander e detentor de todas as ~8 credenciais de produção (inventário oficial cobre 1). Se ela ficar indisponível, nenhuma curadoria é entregue, nenhum paciente entra, nenhum deploy ou rollback é possível, e o gatilho vermelho do Command Center dispara sem ninguém para ouvi-lo. *(Crítico, certeza alta.)*

O que há de genuinamente pronto: o isolamento local/remoto em 10 camadas de guarda, a cadeia de identidade de build, o desenho das migrations (transacionais, falha fechada, proveniência exemplar na `110000`), a RLS testada por 383 testes, a ADR-038, os runbooks de infraestrutura mecânicos e o E2E certificado — a melhor peça de verificação do repositório, que porém é inexecutável em produção por construção. O padrão transversal: **o repositório investiu pesadamente em determinismo do ambiente de desenvolvimento e quase nada no de produção.**

**Veredicto (fundamentado no §28): "A operação ainda não está pronta para produção."**

---

## 2. Escopo e método

- Seis varreduras independentes e paralelas: (i) ambientes/dependências/dados de teste; (ii) reprodutibilidade/deploy/migrations; (iii) backup/rollback; (iv) monitoramento/incidentes/smoke/observabilidade; (v) segredos/privacidade/retenção; (vi) continuidade/suporte/capacidade — consolidadas neste documento com as Partes 19 (checklist) e 20 (relação com Fases 1–8) de primeira mão.
- Evidência sempre como `arquivo:linha`, migration, consulta a catálogo ou documento; gravidade (crítico/alto/médio/baixo/informativo) e certeza (alta/média/baixa) por achado.
- Limites declarados: o estado do painel Supabase remoto (plano, PITR, variáveis Vercel) **não foi consultado** — as afirmações sobre ele vêm dos documentos do repositório e carregam a incerteza correspondente; nenhum teste de carga foi executado.

## 3. Preservação da árvore (etapa preliminar cumprida)

| Registro | Valor |
| --- | --- |
| Commit HEAD | `fd031d975bcfcc517b24d42ebbff059f0afefce5` (2026-08-01 18:58:55 -0300) |
| `git status --short` | 213 entradas: 155 ` M`, 1 `MM` (`tests/integration/limpeza/global.ts`), 57 `??` |
| Conteúdo da cópia | `tracked-diff.patch` (diff binário-seguro de HEAD, 379 KB) + `untracked-files.tar.gz` (57 arquivos: 5 migrations, 8 auditorias, docs, testes, scripts, configuração não secreta) + manifestos (HEAD, status, listas) |
| Exclusões | `.env*`, `.next`, `node_modules`, artefatos Playwright já fora por `.gitignore`; filtro adicional por padrões de segredo retornou **zero** exclusões necessárias |
| Arquivo | `preservacao_fd031d9_2026-08-02.tar.gz` |
| SHA-256 | `d99b3e8043ac7249766d63b9d6fa2af8833992414dd775baeee3172940ac6823` |
| Data/hora | 2026-08-02 14:18:43 |
| Local externo | `C:\Users\barbo\aliviar-preservacao\2026-08-02_fd031d9\` — arquivo e checksum marcados somente-leitura |

Nenhum commit foi feito. A cópia permite reconstruir a árvore exata (HEAD + patch + untracked), mas **não substitui o versionamento** — permanece no mesmo disco da máquina de desenvolvimento (mesmo ponto único de falha de mídia do dump de produção, §8).

## 4. Ambientes

**Staging não existe. Produção é o primeiro e único ambiente remoto real** (`AMBIENTES.md:11-14` tem exatamente duas linhas: local e remoto; o único outro projeto hospedado conhecido é a homologação legada ALICIA, explicitamente desautorizada em `validation-guard.mjs:39-43`). Toda validação contra infraestrutura remota é validação com pacientes reais — e sem telemetria (§10). *(Alto, certeza alta.)*

Inventário: **(A) dev local** Docker (API 54321, PG 54322, buckets privados 50MiB, Inbucket como SMTP, confirmação de e-mail desligada); **(B) integração Vitest** e **(C) certificação E2E** sobre a mesma stack, com guardas próprias e trava de exclusão mútua; **(D) produção** — Supabase ref `awdlmeykminwyifnygkm`, Vercel `aliviar-2-0` (conta pessoal, sem `vercel.json`), domínio `www.aliviarcuradoriamedica.com.br`, 5 variáveis no painel, rodando **~58 commits atrás** do main local.

As guardas anti-remoto da v1.1 são **reais e de qualidade acima da média** — 10 camadas verificadas (`next.config.ts` como autoridade única, `env-guard.mjs` que lança em vez de retornar, `with-local-supabase`, `guard-db-reset`, guarda do Playwright, das suítes, `validation-guard` com allowlist vazia por nascimento, `verify-bundle-backend`, limpeza de `.next`, `/api/build-info`). Três vãos:
- **P1-02 (alto):** as guardas cobrem o caminho npm; Studio, `psql` e CLI manual ficam fora — e a CLI está linkada a produção com o token no `.env.local`.
- **P1-03 (alto):** furo na guarda de `db reset` via variável `SUPABASE_DB_URL` — a regex de ref não casa com `db.<ref>.supabase.co`, o loop faz `continue` e a CLI roda. O caminho por flag é forte; o por env, não.
- **P1-04/05 (médios):** `ambiente-integro.setup.ts` não é gate (nenhum `project` com `dependencies`; roda em paralelo com os specs) e `reuseExistingServer` pode reaproveitar um servidor apontado para produção.

`OPERATIONS.md` valida RLS e cria papéis no schema **errado** (`public` em vez de `curadoria`) — um operador seguindo o runbook obteria falso verde (`OPERATIONS.md:63-118` vs `src/lib/supabase/env.ts:1-11`). *(Alto, certeza alta.)*

## 5. Reprodutibilidade

- **(a) Reconstruir a release só do repositório: NÃO.** A release é o working tree; `git checkout fd031d9` num clone limpo produz 01/08 — sem as 5 migrations, sem os 6 scripts de build/verificação, sem `/api/build-info`, sem os specs que pinam as migrations. Circularidade agravante: **os próprios instrumentos de reprodutibilidade (new-build-id, verify-bundle-backend) não estão em commit nenhum.** *(Crítico, certeza alta.)*
- **(b) Build determinístico: parcialmente.** Determinístico no backend (bundle verificado, `.next` sempre limpo); não determinístico no artefato (`NEXT_PUBLIC_BUILD_TIME` embutido; `BUILD_ID` com timestamp por desenho; sem `engines` — `.nvmrc` diz 22, a máquina roda Node 24; nada exige `npm ci` localmente). *(Alto.)*
- **(c) O artefato corresponde a um commit: NÃO — corresponde a um commit mentiroso.** `/api/build-info` reporta `commit: fd031d9`, que não contém o código em execução. Diagnóstico por `git checkout` do commit reportado olharia código errado sem aviso. *(Crítico.)*
- **(d) Provar o que está em produção: NÃO.** A rota prova backend, integridade do disco e hora — e afirma um commit falsificável (hoje falso). Sem hash de conteúdo, sem assinatura.
- **(e) Provenance/SBOM: NÃO.** Sem CI (`.github/` inexistente): o "typecheck 0 · lint 0 · 650 testes" do runbook é execução manual local sem artefato de prova.
- **(f) Tag/versão: nenhuma cobre a release.** 9 tags (mais recente `rc1`→`80c0289`); `package.json` congelado em `0.1.0`; três esquemas de versão paralelos e incoerentes.

A cadeia de identidade de build em si (id único por construção, verificação disco×bundle, exposição em runtime) é **tecnicamente impecável — ancorada num ponto falso**.

## 6. Deploy

Não existe *um* runbook: o procedimento real precisa ser reconstruído de **5 documentos parcialmente contraditórios** de datas e versões diferentes; `DEPLOY_RUNBOOK.md:7` fixa um RC de 3 releases atrás (commit, tag e "working tree limpo" — três afirmações hoje falsas), e o comando de publicação (`git push aliviar main --tags`) **publicaria o código de 01/08 contra o banco de 02/08** — o cenário que o próprio playbook declara NO GO. *(Críticos, certeza alta.)*

Das 9 etapas reconstruídas (preparação → backup → build → migrations → deploy → verificação → smoke → monitoramento → encerramento): **7 dependem de memória humana em ponto crítico; 3 (verificação, monitoramento, encerramento) são integralmente memoriais.** Destaques:
- O `ledger:check` (paridade de migrations) **só funciona contra a stack local** — não existe guarda de paridade para produção.
- `verify-bundle-backend.mjs` **nunca roda no artefato de produção** (o bundle real é construído na Vercel, onde nada o executa).
- `/api/build-info` — a única prova do que está no ar — **não aparece em nenhum runbook**.
- Não existe, em lugar nenhum, um histórico de "que commit foi publicado, quando, por quem" (o Command Center não tem seção para isso).
- O runbook de deploy nomeia **o caminho absoluto do disco do Fundador** (`git -C C:/Users/barbo/...`) — máquina, não papel.

## 7. Código × migrations (as 5 pendentes)

Transacionalidade: um arquivo = uma transação; zero comandos não-transacionais; falha parcial *dentro* de um arquivo é impossível — *entre* arquivos é possível e não documentada. Locks: todos triviais no volume atual (milissegundos). Matriz:

| Migration | Apaga dado? | Proveniência | Rollback escrito? | Código antigo × schema novo | Código novo × schema antigo |
| --- | --- | --- | --- | --- | --- |
| `100000` catálogo (635 l.) | Não (só `active=false`; perde `updated_at`/`"group"` originais) | parcial (`catalog_version`, sem trigger que o proteja) | sim — troca de vigência, não restauração | **QUEBRA DURO** — `mapa-prioridades-repository.ts:45-49` lança `grupo desconhecido: VIABILIDADE`, derrubando toda a superfície do Mapa | degrada (26 de 28) |
| `110000` dados (219 l.) | **Não** (só INSERT; legado intocado) | **exemplar** (`catalog_migration_log.original_value`) | sim, limpo por `migrated_row_id` | neutro | neutro |
| `120000` rascunho (69 l.) | **SIM — único `DELETE`** | **NENHUMA** | só o índice; o DELETE não | erro 23505 visível à paciente (HEAD não trata) | degrada |
| `130000` anexo (56 l.) | Não | n/a | **NÃO — o dossiê a desconhece**; a policy antiga existe em `20260723164709:94` mas ninguém aponta para ela | compatível (o bug 42P17 some) | anexo continua quebrado |
| `140000` mapa (29 l.) | Não | n/a | sim, trivial (`drop policy`) | compatível | reconhecimento impossível — a Curadoria trava |

Achados de peso: **o dossiê afirma "exatamente as duas migrations pendentes" quando pendem cinco**, e não menciona a `130000` uma única vez (os 2 bloqueantes da Fase 3 seguem intactos, texto idêntico). A guarda da `100000` exige exatamente 28 ativos — qualquer deriva remota entre a leitura de 02/08 e a aplicação aborta. O `DELETE` da `120000` depende de uma contagem que envelhece e o `raise` não nomeia ids. Falha entre a `110000` e a `130000` deixa produção **pior que antes** (catálogo novo + anexo quebrado + reconhecimento impossível) — e as duas migrations que consertam bugs visíveis à paciente são, por timestamp, as últimas. Achados finos: `left(notas, 280)` pode truncar texto do Curador sem registro; `RETURNING INTO` sob `ON CONFLICT DO NOTHING` pode gravar `migrated_row_id` residual (rollback deletaria linha errada em cenário de conflito).

**Ordem segura (não executada):** 0) commitar+taguear a release — pré-requisito absoluto, hoje não satisfeito; 1) backup ampliado (3 tabelas do dossiê **+ `patient_stories` + `patient_documents` + `patient_story_attachments`**) e PITR confirmado; 2) deploy do código novo (novo×antigo degrada; antigo×novo quebra — ordem obrigatória); 3) verificar `/api/build-info`; 4) `migration list --linked` confirmando **5** pendentes; 5) `db push` em janela mínima; 6) validações da §8 do dossiê **+ as 4 ausentes** (índice, policy, função com grants, prova funcional do 42P17); 7) smoke 22 itens **+ anexar documento + reconhecer Perfil**; 8) ativação. **Ponto de não-retorno:** aplicada a `100000`, o Instant Rollback da Vercel deixa de ser seguro — nenhum documento registra isso. *(Crítico.)*

## 8. Backup e restauração

**A documentação se contradiz sobre a existência de backup.** `RECOVERY.md:9` (restaurar do "backup gerenciado") e `MIGRACAO_REMOTA:149` ("o Supabase mantém PITR") × `BASELINE_CANONICAL_ARCHITECTURE.md:134` e `BACKLOG_TECNICO.md:17` ("plano free — sem PITR, sem backup automático") × `RC1_GO_LIVE_PLAYBOOK.md:24` ("NÃO VERIFICADO"). O documento designado para a hora do incidente é o único que não registra a incerteza. *(Crítico, certeza alta; a resolução exige o painel, fora de escopo.)*

| Dimensão | Estado |
| --- | --- |
| Rotina de backup lógico | **Inexistente** — zero scripts; único `pg_dump` documentado é manual, `--data-only`, de 3 tabelas, sem as tabelas de paciente que as migrations tocam |
| Ponto de recuperação nomeado | `aliviar-prod-pre-canonical.dump` — **pasta local do desenvolvedor**, ~6 dias/58 commits desatualizado, sem cofre nem cópia |
| Auth (`auth.users`) | **Fora de todo backup** (`--schema=curadoria`); restauração de identidades não documentada — restore do schema sem auth = ninguém loga, vínculos órfãos |
| **Storage (laudos das pacientes)** | **Nenhuma menção a backup em documento nenhum.** Restore do banco devolveria linhas apontando para arquivos que não voltam |
| Config não versionada | Site URL/Redirects, limites de bucket (NULL), SMTP, proteção de senha vazada — perdidos silenciosamente num restore |
| Schema/RLS | **Única dimensão com backup real e verificado** — ledger 69/69, zero drift (Fase 3) |
| RTO / RPO | **Zero ocorrências em `docs/`** |
| Restauração testada | **Nunca** — `GO_LIVE_READINESS.md:106` declara "não testados" |
| Responsável por backup | Não nomeado; a mesma pessoa única detém o único dump |

## 9. Rollback

- **Código:** impossível hoje — a release não tem commit/tag/deployment anterior; Instant Rollback volta ~58 commits; runbooks apontam coordenadas git que não batem com o repositório (`RECOVERY`→`d5a42f2`; `DEPLOY_RUNBOOK`→`8c99d4b`/`v1.0.0`≠real). *(Crítico.)*
- **Migration:** zero down migrations no repo; a CLI não tem `down`; rollback é 100% SQL manual escrito em prosa, nunca executado, cobrindo 2 das 5.
- **Dados:** `120000` é ponto sem retorno (DELETE sem proveniência); `110000` reversível de forma limpa.
- **Policies:** reversíveis — a policy antiga da `130000` existe em duas fontes (`20260723164709:94`; `schema-curadoria-producao.sql:3300`), mas nenhum documento aponta para elas; reverter a `130000` **reintroduz o 42P17**; reverter a `140000` **congela a operação**.
- **Storage/configuração:** rollback inexistente (sem backup) / adequado só para env vars.
- `OPERATIONS.md:162` afirma que migrations "só adicionam — nada a reverter": **falso** para esta release (DELETE na `120000`, DROP POLICY na `130000`). Nenhum runbook tem matriz código×schema — os únicos textos que reconhecem o acoplamento são notas laterais em dois arquivos de rollback legados, que são também o gabarito ("restaurar a ESTRUTURA não restaura o COMPORTAMENTO") que falta a esta release.

## 10. Monitoramento

- O "sistema de observabilidade" da release é **uma chamada a `console.error` com JSON** (`erros.ts:104`) para o log efêmero da Vercel — sem sink, alerta, agregação ou retenção definida. `ERR-*` **não é catálogo**: é referência aleatória de ocorrência, não documentada em nenhum runbook (que usam `error.digest`, sistema paralelo sem ponte).
- Adoção assimétrica: repositories e actions de profiles/story adotaram; **as actions da Curadoria não** — `curadoria/actions.ts:35-37` devolve `error.message` cru sem log. As falhas mais críticas (entrega) são as menos observáveis.
- **Sem health check**: `/api/build-info` responde "que build" e nunca "está saudável" (Supabase caído → 200 OK); nenhum endpoint para monitor externo; o único health check real é uma tela de admin que cobre só o modelo do ACE.
- Error boundaries: 5 segmentos cobertos; **a Mesa (`/coa`) e o portal-curador descobertos**; sem `global-error.tsx`.
- Confronto risco×alerta: dos 12 riscos críticos listados no mandato, **nenhum tem alerta automático**; 3 são silêncio absoluto de gravidade crítica — entrega parcial (duas escritas sem transação e sem log), **Rede contaminada por fail-open** (`rede-policy.ts:34` nunca lê `error`; profissional com divergência crítica pode ser selecionado para paciente real), fila do Concierge vazia por erro (pixel-idêntica a "sem trabalho"), mais o **lead externo morto no middleware** (§15 da Fase 2 confirmado em três camadas: matcher inclui `/api/*`, `/api/crm/leads` fora das públicas → 302 para `/login`; o integrador lê como sucesso; nem por SQL se reconstrói o que se perdeu).
- **14 eventos hoje só seriam descobertos por reclamação humana** (lista completa consolidada: entrega parcial, lead perdido, Rede contaminada, fila vazia, conta sem papel, documento órfão — o módulo de diagnóstico existe e tem **zero chamadores** —, rascunho abandonado, Case parado, Perfil sem reconhecimento, case_events perdidos, painel degradado mudo, upload falhado, login quebrado, migration não aplicada).

## 11. Incidentes

- Processo completo: **0 de 12 cenários.** Parcial: 6 (indisponibilidade — o melhor; perda de dados — com pré-requisito NÃO VERIFICADO; acesso indevido — só prevenção, resposta inexistente; credencial comprometida — precedente real **em aberto** sem procedimento de rotação; profissional errado — só pré-entrega; integração fora — só Anthropic). Inexistente: 6, incluindo **vazamento de dados** (zero menção a LGPD/ANPD/notificação de titular em qualquer runbook) e **entrega incorreta** (imutável por design, sem caminho humano de retratação).
- Nenhum cenário tem **detecção automática**. O único incidente real da história (`INCIDENT_CLAUDE_API_KEY_PRODUCTION.md`) foi descoberto por auditoria manual **depois de 4 falhas reais**; registro e verificação exemplares, prevenção zero (nenhum alerta criado depois); a escala P0–P3 existe e nunca foi aplicada; o "Incident Commander" é um papel sem ocupante; a variável órfã com chave real segue ativa no painel.
- O único processo genérico de registro (§6.2 do RUNBOOK) é escrito inteiro na linguagem do ACE — os campos de evidência exigidos não existem para incidentes do fluxo real de Curadoria.

## 12. Segredos

- **INCIDENTE POTENCIAL (crítico, certeza alta):** `.env.local:1` e `:4` contêm, em comentário, **duas senhas humanas reais em texto claro** — uma de conta de **paciente** (titular de dados de saúde) e uma do **administrador** — num arquivo que aponta deliberadamente para o ambiente hospedado. São anotação humana pura (o Next as ignora); nenhum uso técnico legítimo. Tratamento devido: rotação de ambas, remoção das linhas, avaliação de circulação do arquivo (backups de disco, nuvem, sessões de agente).
- `SUPABASE_ACCESS_TOKEN` — **maior blast radius do sistema** (conta Supabase inteira, todos os projetos: reset, criação/deleção, leitura de chaves) — ausente de `CREDENTIALS.md`, `.env.example` e `ENVIRONMENT_VARIABLES.md`. E o playbook registra que **senha do banco e access token já apareceram em log de sessão; rotação PENDENTE** (item de NO GO em aberto). *(Alto.)*
- `CREDENTIALS.md` cobre **1 das ~8 credenciais de produção**; sem coluna de dono, sem expiração, sem procedimento de rotação (nem para service role — não existe escrito como rotacioná-la sem derrubar a operação). `CRM_SITE_LEAD_SECRET` e `WHATSAPP_ACCESS_TOKEN` fora dos três documentos.
- Positivos: histórico git limpo (nenhum `.env` jamais versionado; confirmado por `--diff-filter=A`); fail-closed do endpoint de leads em produção; `config.toml` sem segredos. Sem CI, o `.gitignore` é a única barreira (sem gitleaks/pre-commit). `test-users.local.json` (senhas locais em claro) documentado e de baixo risco.

## 13. Privacidade

- **Mapa de dados completo levantado** (identidade, contato, história em texto livre, documentos/laudos em bucket, Mapa, Case, notas, relatório, escolha, acompanhamento, notificações, logs, CRM) com RLS por categoria. Minimização **deliberada e boa** no desenho: curador vê nome e nada além; telefone só titular+admin; `team_notifications` e `audit_logs` comprovadamente sem dado clínico (com teste que varre as chaves do metadado).
- **Zero log de leitura** — admin ou service role lê todas as histórias e baixa todos os laudos sem deixar rastro. Para dado de saúde, a lacuna operacional mais significativa. *(Alto.)*
- **Três processadores reais: Supabase, Vercel e Anthropic** — o texto clínico da paciente sai para a API da Anthropic (mitigação boa: prompt nunca logado) e **nenhum documento a trata como suboperadora nem informa a titular**. `@vercel/analytics` ativo em todas as rotas (inclusive `/paciente/*`) sem consentimento — a URL visitada é indício de condição de saúde. *(Altos.)*
- **Nenhuma política de privacidade, termo ou aviso de tratamento** no produto (grep: zero; nenhuma rota `/privacidade`); a única menção pública é uma linha de FAQ que afirma consentimento **sem documento que a sustente**. Consentimento existe só no CRM (campo, não fluxo); a jornada `/sua-historia` não coleta nem registra consentimento. `PATIENT_ENTRY_ARCHITECTURE.md:165` reconhece a lacuna como decisão pendente.
- **Direitos do titular sem superfície:** acesso parcial (lê o próprio), portabilidade só impressão do relatório, correção impossível (história imutável por trigger sem porta de retificação; Perfil reconhecido sem caminho — `SUPERSEDED` nunca é escrito), exclusão inexistente na UI (§14), revogação sem efeito automatizado.
- Exposição em logs: quase nula (2 `console.*` no repo inteiro) com uma ressalva — `serializarCausa` propaga `details`/`hint` do Postgres, que podem carregar fragmento de dado clínico ao log da Vercel.

## 14. Retenção e exclusão

- **Não existe política de retenção** — por declaração de fonte primária (`RETENCAO_E_DESCARTE_DE_CASES.md §7`: prazos e anonimização fora de escopo, exigem ADR própria "com quem responde por LGPD" — ADR que não existe). Nenhuma entidade tem prazo, base, tombstone ou anonimização. Logs crescem sem limite **por desenho declarado**.
- **"Excluir" não elimina o laudo:**
  - a "lixeira" de documentos é hard delete imediato **sem confirmação** (Fase 7), e a remoção no bucket **não é verificada** — o retorno de `.remove()` é descartado; se falhar, o arquivo clínico permanece **órfão e invisível** (linha já apagada), inauditável e inencontrável para atender eliminação (`patient-document-repository.ts:111`; mesmo padrão no de profissional);
  - **nenhuma cascata do banco alcança o storage**: `discard_case_admin` apaga Case, história e linhas — **todos os PDFs continuam no bucket** (a migration tem zero referência a storage), o que invalida na prática a afirmação da ADR-038 de que o descarte "atende à eliminação";
  - a paciente pode apagar laudo **já anexado a história enviada em Curadoria ativa** — o anexo some do Case sem evento, log ou aviso;
  - não existe "descarte de titular": a ADR-038 resolveu a metade do Case; `profiles`/`auth.users`/telefone permanecem, e a exclusão de conta é SQL manual com ordem decorada.
- `profiles.deleted_at` é um campo órfão (nenhuma escrita, nenhuma policy o filtra) — falsa impressão de soft delete. Interação descarte×restore (um restore ressuscita o apagado junto com a prova do apagamento) não tratada em documento nenhum.
- Positivo real: a ADR-038 em si é engenharia sólida (autorização no corpo da função, motivo obrigatório, auditoria gravada antes do delete e sobrevivente a ele, 14 cenários certificados).

## 15. Continuidade operacional

**Bus factor = 1 — autodeclarado por escrito** (`RUNBOOK.md §9`: único administrador; mesma **conta** acumula Administrador e Curador Médico, "risco operacional de ponto único"). Consequências verificadas em cadeia: sem essa pessoa, nenhuma curadoria é entregue (revisão humana obrigatória, decisão única por banco), nenhum paciente entra (sem cadastro público; senha inicial aparece uma vez), nenhum deploy/rollback/correção de env (credenciais sem segundo detentor), e o gatilho vermelho ("nenhum paciente >1 dia útil sem retorno") dispara sem executor. Sem escalonamento, contato reserva, break-glass ou "se eu não responder em X, faça Y".

- Deploy nomeia a máquina de uma pessoa, não um papel; remote em conta GitHub pessoal.
- `CREDENTIALS.md` sem coluna de dono; ~7 credenciais de produção fora do inventário; senha do banco "no seu gerenciador de senhas" (singular, pessoal).
- Aprovador de migration = autor = executor; a justificativa de segurança do runbook ("banco começa vazio", "nenhuma migration destrutiva") é hoje falsa.
- Material de treinamento existe e é bom (Manual, Modelo, Fundamentos) — mas **nunca houve um segundo leitor**: a única ficha de validação com pessoa real (`VALIDACAO_USABILIDADE_MESA.md`) está inteiramente em branco, gate incluído.
- **Ambiente de treino é inalcançável:** o sandbox `is_certification` existe no banco com emparelhamento bidirecional exemplar, mas nenhuma action/página/script de produção o escreve — só testes de integração com service role contra o Docker local. Um Curador novo não consegue praticar sem ser desenvolvedor.
- Passagem de plantão inexistente; Daily Report/log de incidentes vivem fora do sistema; docs operacionais com afirmações obsoletas que enganariam um sucessor (PORTAL_CURADOR "aberto no middleware" — já corrigido; Incident Commander sem nome; pendências de 07/15 nunca fechadas).
- O julgamento que não se transfere por runbook é o **do Método** (quatro estados com frase de evidência, filtro vs prioridade, seleção com justificativa genuína) — exatamente o do papel sem substituto.

## 16. Suporte e operação diária

Das 15 operações auditadas: **4 com UI segura** (reset de senha do paciente — o fluxo mais bem-feito da parte, sem enumeração de contas; transferência de Case com trilha completa; lead duplicado com detecção ativa; reabertura da Mesa pré-entrega), **5 parciais**, **6 sem caminho nenhum ou só SQL**:

- **Relatório incorreto já entregue (crítico):** não dá para reemitir (regeneração bloqueada por `emitted_at`), não há errata/versionamento, e `markReportDelivered` **sobrescreve `emitted_at` com o instante da entrega** — o registro de quando o Curador emitiu é destruído (confirmação em código do C7 da Fase 2; o banco não impede porque `emitted_at` está fora da lista congelada).
- **Correção de dados do Método (crítico):** história perdida por sessão expirada é irrecuperável (o dado nunca chegou ao banco — falsa confirmação P0 da Fase 2); Perfil reconhecido só se corrige por `UPDATE` manual sem trilha (o `SUPERSEDED` desenhado para isso nunca é escrito por ninguém), contradizendo "tudo fica registrado com seu nome e hora" do Manual.
- Exclusão (Case/conta/titular) = SQL com service role; a função certificada da ADR-038 tem **zero superfície** (grep: nenhuma referência em `src/`).
- Documento inválido: sem revisão, sem rejeição, sem download pela equipe, upload validando apenas `size === 0`; "remover" anexo só desanexa.
- Desativar profissional tem botão; **a desativação não propaga**: ninguém é avisado sobre seleções vigentes, a Mesa em andamento perde o perfil sem explicação, e despublicar é uma das **14 actions órfãs** (Fase 2) — junto com o ramo inteiro da aproximação intermediada (a paciente escolhe e **nada acontece**), `declareCriterion` (pendência perpétua) e os filtros obrigatórios.
- Fila de erros: só ACE; canal de suporte ao usuário: inexistente no produto; `/admin/equipe` não concede atendente/concierge — **provisionar a segunda pessoa exige SQL contra produção**, o gargalo que trava a mitigação do bus factor.
- `team_notifications` nunca é marcada como lida (estados inalcançáveis) — o contador de não-lidas cresce monotonamente e degrada a priorização da worklist.

## 17. Capacidade e performance

O gargalo real do primeiro ano **não é o Postgres — é a pessoa** (§15). Limites técnicos:

**Conhecidos (17):** Rede da Mesa = varredura completa sem paginação mas com fan-out em lote correto (0,15 ms com 156); **teto do padrão `.in(ids)` ≈ 200 ids → URL >8 KB → falha silenciosa** — medido pela própria equipe com 276 contas, e a Mesa usa exatamente esse padrão (está a ~64 perfis do limite); **teto de 1000 na Admin API pegando só a página 1** — acima disso, conta banida aparece como **ativa** sem aviso; fila do Atendente trunca em 100 e painel do Curador em 60, sem "mostrando N de M" (chocando com o gatilho "algum paciente sem resposta?"); body de Server Action = 1 MB por default não declarado (o único teto de upload que existe — buckets NULL/NULL confirmados no catálogo, código validando só `size===0`, MIME aceito qualquer); zero paginação em 8 listagens admin; 80 FKs de coluna única sem índice (várias em caminho quente; os 81 índices existentes são bem escolhidos — omissão sistemática, não desleixo); 0 de 81 índices com `CONCURRENTLY`; `maxDuration` em 0 rotas + cliente Anthropic sem timeout (SDK espera ~10 min; a plataforma corta antes — o corte cai **fora** da tabela de `failureCode` do runbook); retenção de logs inexistente (~22 linhas de audit por Case medidas); N+1 evitado deliberadamente (única exceção: submit de protocolos, ~34 round-trips não-atômicos); sem error tracking.

**Desconhecidos (14):** tempo de parede do ACE em produção (0 execuções locais), `maxDuration` efetivo da conta Vercel, Mesa com 200+, latência do remoto, p99 de documento, bytes de `ace_artifacts`, cold start das rotas admin, concorrência de dois curadores na mesma Mesa, custo por curadoria em tokens, rate limit real da Anthropic, retenção real de backup do plano, retenção dos logs Vercel (único repositório de erros), tempo de restore, qualquer teste de carga.

## 18. Dependências externas

| Dependência | Estado |
| --- | --- |
| **Supabase produção** | Tudo (banco/auth/storage/RLS). Sem retry/fallback/cache — caiu, sistema fora. Lock-in **arquitetural** (a autorização é RLS/triggers/functions — bom desenho, migração = reescrever a segurança). Backup NÃO VERIFICADO |
| **Vercel** | Build+runtime+CDN, conta pessoal, sem `vercel.json`; Instant Rollback é o único rollback confiável — e deixa de ser seguro após a migration #1 (§7) |
| **Anthropic** | Modelo do ACE; erros classificados exemplarmente, mas sem timeout/maxRetries explícitos e sem `maxDuration` — a classificação pode nunca ser exercida no caso mais provável |
| **E-mail de auth** | **Dependência não inventariada**: nenhuma configuração de SMTP de produção no repo — reset de senha (o caminho de recuperação da paciente) provavelmente depende do SMTP default do Supabase com rate limit agressivo; sem remetente/domínio/bounce monitorado *(alto, certeza média)* |
| **WhatsApp** | Número real hardcoded no bundle (`whatsapp-contact.tsx:27`); trocar exige deploy; canal humano central sem mitigação |
| **Site institucional → `/api/crm/leads`** | Endpoint bloqueado pelo middleware (§10); segredo fora do inventário; comparação não-constante; sem rate limit; origem consumidora não identificada em doc nenhum |
| **@vercel/analytics** | Terceiro recebendo pageviews de rotas de saúde sem consentimento (§13) |
| **Google Fonts** | Self-host em build; sem risco de runtime |
| Observabilidade externa | **Inexistente** (grep: zero Sentry/Datadog/etc.) |

## 19. Smoke test pós-deploy

**Quatro listas concorrentes, nenhuma canônica** (OPERATIONS §12 obsoleta — testa o ACE, fora do fluxo certificado; DEPLOY_RUNBOOK 6 itens; RC1_GO_LIVE_PLAYBOOK §4 com 22 itens — a melhor e mais recente; RECOVERY 5). Contra a lista do mandato, o §4 cobre bem o miolo (Case→Acolhimento→Mapa→reconhecimento→seleção→relatório→entrega→escolha→Concierge) e tem o melhor item do conjunto (permissões negativas 19/20, NO GO absoluto) — mas **não cobre**: criação de história, **anexo de documento**, declaração de área, **lead externo** (nenhuma das 4 listas testa o endpoint — exatamente o furo que deixaria o bloqueio do middleware passar pelo Go Live) e **`/api/build-info`** (a rota que detectaria o bloqueador nº 1 do próprio playbook não está em nenhum smoke).

O E2E certificado é superior a qualquer smoke documentado (asserts de comportamento, persistência observada, asserts negativos) e **inexecutável em produção por construção** (baseURL fixo, asserts que exigem `ambiente=local`, credenciais locais, webServer próprio, guardas encadeadas) — e nenhum documento distingue smoke de produção × E2E de certificação (nenhum runbook sequer menciona `tests/e2e/`).

Seguro em produção: leituras puras (`/`, `/login`, `/api/build-info`, headers, logins, listas). Inseguro: itens 8–18 (criam dado real). **A limpeza é o ponto mais frágil:** um checkbox de uma linha ("descartar o Case de teste") para desfazer 11 escritas; o descarte não remove profissional publicado, conta da paciente, história, documento no bucket, relatório, connection; a exclusão é estruturalmente difícil (o smoke troca de responsável 2×, acionando exatamente o caminho que já travou a ADR-038); a ordem de limpeza manual citada como "documentado nesta sessão" não aponta para arquivo nenhum; e **dado de teste de rodadas anteriores já está em produção sem ter sido limpo** (3 pacientes, ≥2 de teste, decisão pendente que **não está na lista NO GO**).

## 20. Observabilidade de negócio

Das 15 perguntas operacionais: **3 bem respondidas na UI** (leads chegados, Cases sem responsável — "o número que precisa doer", pendências de publicação), **2 parciais/enviesadas** ("atrasado" mede idade desde criação, não inatividade; "concluído" mistura DELIVERED), **10 sem resposta ou só-SQL** — sendo **5 críticas**: leads **perdidos** (nem por SQL: os bloqueados no middleware nunca chegam ao banco), **Perfis aguardando reconhecimento** (o bloqueio duro do fluxo, sem contador agregado em lugar nenhum), **Redes vazias** (e o fail-open **infla** a Rede em vez de esvaziá-la), **documentos órfãos** (a consulta existe pronta em `documentos-orfaos.ts` — zero chamadores), **aproximações atrasadas** (recusa deliberada de juízo temporal — decisão de método legítima cujo custo operacional nenhum documento reconhece).

O painel executivo mede **aquisição e carga, zero sobre o Método** (14 indicadores: nenhum sobre Perfil, Rede, seleção, relatório, entrega, escolha). Ninguém vê o estado do Método: o Curador vê a própria fila (sem métrica, por decisão declarada), o Concierge a própria continuidade (sem atraso, por decisão declarada), o Admin vê Cases e leads. A cultura de honestidade de dado é exemplar (`null`≠`0`, funil que só encolhe, zero recuado) — e muda com a engenharia: `safe()` engole 7 consultas falhas sem registrar. As métricas que os próprios documentos exigem (tempo até 1º contato ≤1 dia útil, até entrega ≤5) **não são computáveis pela UI** — o Command Center admite: acompanhamento manual.

## 21. Dados de teste × produção

- **158 perfis sintéticos publicados e não marcados** no banco local (165 totais: 0 `is_demo`, 4 fixture, 161 sem marca) — o maior produtor de dado sintético (specs E2E) **não participa do esquema de marcação** (cria e publica sem setar flag nenhuma; teardown global de 5 linhas só devolve a trava). Pelas flags, indistinguíveis de reais — e o critério NO GO "algum DEMO publicado" **não os acionaria**, porque não são DEMO. Não existe terceira categoria "resíduo de execução automatizada" (pergunta já aberta na Fase 3). *(Alto.)*
- **28 arquivos sintéticos órfãos** no bucket `patient-documents` local — a limpeza de integração cobre 25+ tabelas e **zero buckets**.
- `seed.sql` escreve direto em `auth.users` protegido só por comentário (a guarda efetiva é o `guard-db-reset` — que tem o furo P1-03); atenuante real: senha aleatória descartada.
- **Contas de teste em produção: 3 pacientes, ≥2 de teste, decisão pendente** (playbook) — fora da lista NO GO. *(Alto, certeza média.)*
- Positivos: higiene de e-mails exemplar (37/38 em `@aliviar-conexao.local`, TLD reservado); o emparelhamento fixture↔certificação com CHECKs bidirecionais é o gabarito que falta ao E2E.

## 22. Relação com as Fases 1–8 (impacto operacional dos bloqueadores anteriores)

| Bloqueador anterior | Impacto operacional (esta fase) |
| --- | --- |
| C4/C7 — entrega não-atômica; `emitted_at` destruído (F2) | **Corrupção + suporte**: entrega parcial sem log (§10) e relatório errado sem retratação nem carimbo real (§16) — os dois piores cenários de suporte não têm nem detecção nem correção |
| C2 — `/api/crm/leads` bloqueada (F2) | **Confiança + diagnóstico**: canal de aquisição morto, invisível por design (§10, §20); nem reconstrução por SQL |
| C3 — falsa confirmação de sessão expirada (F2) | **Perda de dados irreversível**: a única correção é a paciente reescrever (§16) |
| F2/F9 — RLS com achados; paciente deleta documento em Case ativo (F3) | **Privacidade + recuperação**: sem backup de storage e sem tombstone, a deleção é irreversível e invisível (§8, §14) |
| Dossiê remoto NÃO PRONTO (F3) | **Indisponibilidade**: os 2 bloqueantes seguem intactos; `db push` guiado pelo dossiê aplicaria uma migration desconhecida sem backup nem rollback (§7) |
| Invariante 28 inexequível — `SUPERSEDED` nunca escrito (F4) | **Suporte**: correção de Perfil só por SQL sem trilha (§16) |
| Segredos concentrados; 2 senhas humanas (F5) | **Segurança**: agora classificado incidente potencial — senha de titular de dado de saúde em claro (§12) |
| Porteiro E2E morto; certificação sem oráculo de banco (F6) | **Diagnóstico**: a certificação prova fluxo, não invariantes — e o artefato certificado não é reproduzível (§5) |
| Lixeira sem confirmação; promessas sobre estado volátil (F7) | **Privacidade + confiança**: hard delete de laudo a um toque, com órfão invisível no bucket (§14) |
| H-C1 — release untracked (F8) | **Tudo**: é a raiz de §5, §6, §7 e §9 — sem commit não há deploy correto, prova, nem rollback |
| H-C2 — Catálogo sem aprovação registrada (F8) | **Governança do deploy**: a autorização da migração remota (dossiê) herda uma decisão que só existe em memória de sessão |

## 23. Achados por gravidade

**Críticos (12):**
- OP-C1 — Release sem commit: não implantável, não reproduzível, sem rollback de código (§5, §9).
- OP-C2 — Artefato se autodeclara commit falso; impossível provar o que roda em produção (§5).
- OP-C3 — Comando de publicação do runbook publica código errado; nenhum runbook único vigente (§6).
- OP-C4 — Dossiê remoto: "duas" migrations quando são cinco; `130000` inexistente nele; bloqueantes da Fase 3 intactos (§7).
- OP-C5 — Pós-migration #1, o Instant Rollback deixa de ser seguro — não documentado (§7, §9).
- OP-C6 — Documentação contraditória sobre existência de backup; único ponto de recuperação = dump parcial de ~6 dias em pasta local; RTO/RPO inexistentes; restauração nunca testada (§8).
- OP-C7 — Auth e storage (laudos) fora de qualquer backup (§8).
- OP-C8 — `DELETE` da `120000` sem proveniência — ponto sem retorno (§7).
- OP-C9 — Duas senhas humanas reais em claro (uma de paciente) em arquivo apontando para ambiente hospedado — **incidente potencial**; credenciais já expostas seguem não rotacionadas (§12).
- OP-C10 — Fail-open da Rede + entrega parcial + fila do Concierge: falhas críticas mudas; 14 eventos descobertos só por reclamação; 0/12 cenários de incidente completos; zero LGPD operacional (§10, §11).
- OP-C11 — Bus factor 1 em pessoa e em conta; credenciais sem segundo detentor; ambiente de treino inalcançável; segregação exigida pelo Método inexequível (§15).
- OP-C12 — Relatório entregue incorreto: sem retratação e com carimbo de emissão destruído; correção de Perfil/história sem caminho ou irreversível (§16).

**Altos (seleção, 18):** staging inexistente + zero telemetria (primeiro detector = paciente); guardas não cobrem Studio/psql/CLI + furo `SUPABASE_DB_URL`; `OPERATIONS.md` valida o schema errado e afirma "migrations só adicionam"; build não determinístico (BUILD_TIME, Node 22×24, sem `npm ci` exigido); sem CI/SBOM/tag da release; verify-bundle nunca roda no artefato real; backup pré-migração sem as tabelas de paciente; rollback da `130000` não escrito; `SUPABASE_ACCESS_TOKEN` fora de toda governança; inventário de credenciais 1/~8 e sem donos; zero log de leitura de dado clínico; Anthropic não tratada como suboperadora + analytics sem consentimento; nenhuma política de privacidade/termos; storage sem cascata nem verificação de remoção; SMTP de produção inexistente no repo; 158 sintéticos não marcados + contas de teste em produção fora do NO GO; 14 actions órfãs com consequência operacional (aproximação intermediada inerte); teto `.in()` ~200 e Admin API 1000 com degradação perigosa (banido→ativo); smoke sem lead/anexo/build-info e limpeza de uma linha.

**Médios (seleção):** divergência de runbooks entre si e com o git real; `.build-id` untracked e não ignorado; 2 variáveis fora de `.env.example`; guarda da `120000` sem ids; truncamentos silenciosos 100/60; 80 FKs sem índice; retenção de logs inexistente; `deleted_at` órfão; `ANTHROPIC_API_KEY` órfã ativa; WhatsApp hardcoded; possível mudança semântica de acesso a documentos órfãos na `130000`; interação descarte×restore não tratada.

**Baixos/informativos:** higiene de e-mails sintéticos exemplar; emparelhamento fixture↔certificação exemplar; N+1 evitado deliberadamente; reset de senha do paciente bem-feito; transferência de Case com trilha completa; lock-in Supabase como decisão arquitetural consciente.

## 24. Tudo que está operacionalmente pronto

- Isolamento local/remoto em 10 camadas, com raciocínio escrito em cada guarda; guardas que lançam em vez de retornar.
- Cadeia de identidade de build (id único, verificação disco×bundle, `/api/build-info`) — pronta para ancorar num commit verdadeiro.
- As 5 migrations em si: SQL sólido, transacional, falha fechada; proveniência exemplar na `110000`; guardas que abortam em vez de corromper.
- RLS certificada por 383 testes de integração; ledger 69/69 com guarda automatizada; schema como código, zero drift.
- ADR-038 (descarte) como função de banco; transferência de Case auditada ponta a ponta; detecção de lead duplicado; reset de senha sem enumeração.
- Runbooks de infraestrutura mecânicos (`RECOVERY` sequencial; tabela sintoma→ação; a distinção falha-técnica × decisão-do-Método do §6.1 é transferível e rara).
- O E2E certificado + porteiro de ambiente: a melhor peça de verificação do repositório.
- Minimização de dados deliberada; logs de auditoria comprovadamente sem conteúdo clínico; histórico git limpo de segredos.
- Cultura de honestidade de dado nos painéis (`null`≠`0`, zero recuado, funil que só encolhe).

## 25. Tudo que impede operação segura

Em uma frase cada, os impedimentos (não recomendações — a decisão é do responsável):

1. A release não existe como commit — nada a publicar, nada a que voltar.
2. O procedimento de deploy escrito publica a versão errada.
3. Não se sabe se backup existe; o que se sabe é que auth e laudos estão fora dele e que restauração nunca foi testada.
4. O rollback deixa de existir no instante em que a primeira migration é aplicada.
5. O dossiê que autoriza a migração remota descreve outra migração (2 de 5).
6. Duas senhas humanas reais — uma de paciente — estão em claro num arquivo da máquina de desenvolvimento, e credenciais já expostas não foram rotacionadas.
7. O sistema não avisa quando erra: as três falhas mais graves (entrega parcial, Rede contaminada, lead perdido) são mudas.
8. Não há processo de incidente executável, nem notificação de titular, num produto de dado de saúde sem política de privacidade publicada.
9. "Excluir" não elimina o laudo do bucket — nem por cascata, nem verificadamente por ação manual.
10. Uma única pessoa/conta é o administrador, o curador, o aprovador, o respondedor e o cofre — sem substituto, sem treino possível para um segundo.
11. Erros já entregues (relatório incorreto, Perfil errado, história perdida) não têm caminho de correção pelo sistema.
12. Dado sintético não marcado convive com produção (contas de teste lá, 158 perfis sem flag aqui) e o critério de NO GO não os detecta.

## 26. Decisões necessárias

1. **Versionar a release** (commit + tag) — desbloqueia deploy, prova e rollback; é o mesmo item nº 1 da Fase 8 (H-C1). Nada nesta fase é executável antes disso.
2. **Resolver a contradição do backup no painel** (plano/PITR) e decidir: plano pago com PITR **ou** rotina de dump verificado — incluindo auth, storage e as tabelas de paciente; definir RTO/RPO; **testar uma restauração** antes do primeiro dia real.
3. **Tratar o incidente de credenciais**: rotacionar as duas senhas humanas, a senha do banco e o access token já expostos; remover as linhas do `.env.local`; completar `CREDENTIALS.md` (~8 credenciais, com dono e procedimento de rotação); decidir sobre cofre compartilhado.
4. **Reescrever o dossiê para as 5 migrations** (decisão nº 6 da Fase 3, ainda aberta) com: backup ampliado, rollback da `130000` (a policy antiga está em `20260723164709:94`), cenário de falha parcial, e a ordem segura do §7 — só então decidir a autorização.
5. **Decidir o mínimo de observabilidade para abrir**: um health check real, alerta para os 3 silêncios críticos (entrega parcial, fail-open da Rede, ingestão de leads — que exige antes decidir a rota no middleware), e o destino dos logs (`ERR-` pesquisável ou não).
6. **Decidir o processo de incidente mínimo**: quem é o Incident Commander, o procedimento de credencial comprometida, e a resposta a acesso indevido/vazamento com notificação de titular (com quem responde por LGPD — a mesma ADR pendente da retenção).
7. **Publicar a base de privacidade**: política/termos, consentimento na jornada da história, e o papel da Anthropic e do analytics — ou decidir formalmente adiar com risco registrado.
8. **Decidir o destino do storage na exclusão** (cascata ou rotina de órfãos — o módulo já existe, sem chamadores) e a política de retenção mínima.
9. **Mitigar o bus factor**: segunda conta com papel segregado (exige resolver a concessão de papéis, hoje só SQL), segundo detentor de credenciais, e o caminho de treino (dar superfície ao `is_certification`).
10. **Definir o smoke canônico** (unificar as 4 listas; incluir lead, anexo, `/api/build-info`; escrever a limpeza como procedimento) e decidir o destino dos dados de teste já em produção — incluindo-os na lista NO GO ou aceitando-os por escrito.

## 27. Checklist Go/No-Go operacional

Critérios objetivos e verificáveis — **nenhum está satisfeito hoje**; o E2E 12/12 não substitui nenhum deles:

| # | Critério | Verificação objetiva | Hoje |
| --- | --- | --- | --- |
| 1 | Release versionada | `git tag` aponta para commit que contém as 5 migrations e o código certificado; `git status` limpo | ❌ working tree com 213 entradas |
| 2 | Migrations aprovadas | Dossiê descreve as 5, com rollback das 5 e cenário de falha parcial; autorização explícita registrada | ❌ dossiê descreve 2 |
| 3 | Backup completo | Dump/PITR confirmado no painel cobrindo `curadoria` + auth + storage; checksum + local externo ao disco do dev | ❌ contraditório/não verificado |
| 4 | Restore testado | Uma restauração executada em ambiente descartável, com tempo medido (RTO) e perda medida (RPO) | ❌ nunca |
| 5 | Secrets protegidos | Senhas humanas removidas e rotacionadas; token/senha expostos rotacionados; inventário completo com donos | ❌ pendente desde o playbook |
| 6 | Alertas ativos | Health check consultável por monitor externo + alerta para entrega parcial, fail-open da Rede e ingestão de leads | ❌ inexistentes |
| 7 | Incident response | Incident Commander nomeado; procedimento de credencial comprometida e de acesso indevido escritos | ❌ papel sem ocupante |
| 8 | Smoke test | Lista única canônica, incluindo lead externo, anexo e `/api/build-info`, com procedimento de limpeza escrito | ❌ 4 listas divergentes |
| 9 | Rollback | Matriz código×schema escrita; ponto de não-retorno da #1 documentado; rollback da `130000` escrito | ❌ inexistente |
| 10 | Responsável presente | Janela com a pessoa disponível **e** um segundo contato com acesso mínimo de emergência | ❌ bus factor 1 |
| 11 | Janela aprovada | Autorização explícita do responsável para a sequência do §7, etapa por etapa | ❌ não solicitada |

## 28. Veredicto

> **"A operação ainda não está pronta para produção."**

Justificativas objetivas, em ordem de peso:

1. **Não há o que implantar com segurança**: a release certificada não é um commit; o procedimento escrito publicaria outra versão; o artefato mente sobre a própria origem; e o único rollback existente deixa de ser seguro no primeiro passo da migração (OP-C1..C5).
2. **Não há de onde voltar**: backup contraditório e não verificado, sem auth, sem os laudos das pacientes, sem RTO/RPO, jamais testado — sobre uma release cujo único `DELETE` não tem proveniência (OP-C6..C8).
3. **Não há como saber que algo deu errado**: zero detecção automática em 12 cenários de incidente, três falhas críticas estruturalmente mudas, e 14 eventos cuja descoberta depende de uma paciente reclamar (OP-C10).
4. **Não há com quem contar além de uma pessoa**: bus factor 1 em pessoa, conta e credenciais, num produto cujo próprio Método exige segregação que a operação atual torna inexequível (OP-C11).
5. **A privacidade opera sem base**: incidente potencial de credenciais em aberto, exclusão que não elimina, leitura sem rastro, e nenhum documento de privacidade — num produto de dado clínico (OP-C9, §13, §14).

O que este veredicto **não** diz: que o produto está longe. A distância até o GO é **operacional e enumerável** — as 10 decisões do §26 e os 11 critérios do §27 são finitos, a maioria de dias e não meses, e vários já têm a metade técnica pronta (a cadeia de build espera um commit verdadeiro; o módulo de órfãos espera um chamador; o sandbox de treino espera uma superfície; o dossiê espera uma reescrita). O que falta não é engenharia nova — é transformar uma operação que vive na memória de uma pessoa em uma operação que sobrevive a ela.

---

*Fase 9 encerrada. Artefatos desta fase: este documento e a cópia de preservação externa (§3). Nenhum arquivo existente foi alterado; nenhum comando de mutação foi executado contra qualquer ambiente.*
