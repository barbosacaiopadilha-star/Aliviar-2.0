# Runbook Operacional — Primeiro Paciente Real

Documento de operação, não de engenharia. Complementa `docs/OPERATIONS.md` (deploy/infra técnica) e `docs/DEBUGGING.md` (diagnóstico técnico) — aqui o foco é **quem faz o quê, em que ordem, e o que fazer quando algo dá errado**, na abertura da operação real da Aliviar Curadoria Médica. Nenhuma alteração de código, arquitetura ou Método está prevista neste documento — a V1 está congelada.

## 1. Abertura da operação

1. Confirmar que o bloqueio do ACE (integração Anthropic, bug de plataforma da Vercel) foi resolvido — ver `docs/DEBUGGING.md` §2 e o Health Check em `/admin/ace`. **Não abrir operação com o Health Check mostrando `MODEL_NOT_CONFIGURED`.**
2. Confirmar que o Supabase de produção está acessível e que todas as migrations em `supabase/migrations/` foram aplicadas (`supabase db push` ou equivalente do fluxo já usado em produção) — nenhuma execução real deve rodar contra um schema desatualizado.
3. Confirmar RLS ativa nas tabelas sensíveis (`professional_profiles`, `patient_profiles`, `cases`, `human_review_results` e demais) — nenhuma policy desabilitada manualmente para depuração e esquecida.
4. Remover todo dado de teste do banco de produção (ver §7 — Limpeza).
5. Confirmar que o administrador consegue logar em `/admin` com a conta real.
6. Confirmar `strict-transport-security` e certificado válidos em `https://www.aliviarcuradoriamedica.com.br` (já validado nesta auditoria).
7. Confirmar que existe backup recente do banco de produção (Supabase gerencia backups automáticos no plano em uso — confirmar retenção/PITR ativo) antes de qualquer operação em lote ou correção manual de dado.

## 2. Cadastro do primeiro profissional

Feito pelo Administrador em `/admin/profissionais/novo`. Campos obrigatórios para o profissional ser elegível a qualquer Shortlist (sem eles, o ACE nunca o inclui — o Método recusando inventar dado, não um bug, ver `docs/DEBUGGING.md` §2):

- Nome, identificador profissional, resumo profissional.
- Nível de experiência, abordagem de intake, disponibilidade.
- Ao menos uma área de competência.

Recomendado: **ao menos 3 profissionais reais** cadastrados antes do primeiro paciente — é o mínimo que o P008 (Shortlist Builder) precisa para compor uma Shortlist sem bloquear por insuficiência.

## 3. Cadastro do primeiro paciente

Feito pelo Administrador em `/admin/pacientes/novo`, com o e-mail real da pessoa. A senha inicial só aparece uma vez na tela — entregar com segurança (nunca por canal não confiável, nunca colada em chat/IA).

## 4. Primeira curadoria

1. Paciente loga com a própria conta e preenche "Sua História" até o fim.
2. Administrador ou Curador Médico cria o Caso a partir dessa história e avança o status: Novo → Em Revisão → Pronto para curadoria.
3. Iniciar a execução do ACE no Caso (`/admin/casos/[id]`).
4. Confirmar em `/admin/ace/[executionId]` que todos os protocolos completaram (`COMPLETED`), sem `FAILED`. Se houver `FAILED`, ver §6.1 para distinguir o tipo de falha antes de decidir se reexecuta.
5. Curador Médico revisa a Shortlist em Human Review e registra a decisão com justificativa genuína. Regras de Human Review: no máximo uma decisão `VALIDATED` por Caso (garantido pelo banco, ADR-025 — uma segunda tentativa é rejeitada com mensagem clara, nunca sobrescreve a primeira); o histórico de decisões é append-only, nunca editável; não existe hoje fluxo de revalidação de um Caso já `VALIDATED` (reabrir uma curadoria já aprovada exige decisão de produto própria, fora do escopo desta versão).
6. Entregar a Curadoria Final. Confirmar que o paciente acessa em `/paciente/curadoria`, incluindo "Baixar em PDF".

## 5. Acompanhamento

Fora do sistema (processo da equipe, não uma funcionalidade do produto, ver `docs/PRODUCT_ARCHITECTURE.md`): registrar a data da entrega para o acompanhamento periódico de 12 meses previsto no produto.

## 6. Tratamento de incidentes

| Sintoma | Onde olhar primeiro | Ação |
|---|---|---|
| ACE não avança / trava | `/admin/ace` → execução em `RUNNING` há +30min | `docs/DEBUGGING.md` §1 — reexecutar é seguro (idempotente) |
| Health Check mostra `MODEL_NOT_CONFIGURED` | `/admin/ace` | Não iniciar/retomar execuções novas até resolver — ver §8 abaixo |
| Paciente não vê algo que deveria | Confirmar papel efetivo (`user_roles`) e RLS — `docs/DEBUGGING.md` §4 | Nunca é a aplicação decidindo, é a policy do Postgres |
| Erro genérico na tela do paciente | Entrar como Admin/Curador, ver o Caso e a mensagem interna sanitizada + `failureCode` em `/admin/ace/[executionId]` | `docs/DEBUGGING.md` §3 |
| Suspeita de dado sensível em log | Tratar como incidente de segurança, não como debug | `docs/DEBUGGING.md` §7 — nunca prompt/resposta/chave em log |

## 6.1 Distinção entre tipos de falha do ACE

Nem toda execução `FAILED` é o mesmo tipo de problema — a ação correta depende de qual é:

| `failureCode` (ou situação) | O que significa | Reexecutar automaticamente? |
|---|---|---|
| Falha técnica (`ACE_MODEL_TIMEOUT`, `ACE_MODEL_RATE_LIMITED`, `ACE_MODEL_NOT_CONFIGURED`) | Problema de infraestrutura/conectividade com o provedor do modelo — nenhum julgamento do Método envolvido | Sim, reexecução manual é segura e idempotente |
| `CASE_AUDIT_BLOCKED` (P003) | O Caso genuinamente carece de informação essencial (decisão/objetivo ausente, contradição real) — o Método está funcionando corretamente | Não é uma falha para "reexecutar" — o Caso vai para `WAITING_FOR_INFORMATION`, aguardando o paciente |
| `CONTENT_INVARIANT_VIOLATION` (P003, ADR-024) | O modelo classificou uma restrição prática opcional como bloqueante, violando uma regra fechada do Método — rejeitado antes de virar `CaseAudit` | Reexecução manual é segura (o Caso permanece no status anterior, nunca é movido para `WAITING_FOR_INFORMATION` por um problema que não é do paciente) — se persistir, é sinal de calibração, registrar como incidente (§6.2) |
| Human Review pendente | Não é falha — o Caso está corretamente aguardando decisão humana (P009) | N/A — ação é do Curador, não reexecução |

## 6.2 Como registrar um incidente

1. Categorizar primeiro: infraestrutura (ex.: chave não injetada, Vercel/Supabase fora do ar), regra de negócio do Método (ex.: `CASE_AUDIT_BLOCKED` genuíno) ou erro de comportamento do modelo (ex.: `CONTENT_INVARIANT_VIOLATION` recorrente) — nunca misturar as três num único registro.
2. Evidência mínima: `failureCode`, timestamp, `executionId`, e a mensagem sanitizada já exibida em `/admin/ace/[executionId]` — nunca prompt bruto, resposta bruta do modelo, ou chave.
3. Registrar em um documento próprio (padrão já usado: `docs/INCIDENT_*.md`), nunca misturado a `docs/ace/CALIBRATION_REPORT.md` (que é só para calibração de comportamento do Método, não infraestrutura) nem a este Runbook.
4. Critério de bloqueio da operação: qualquer incidente de infraestrutura que impeça configuração do modelo (`MODEL_NOT_CONFIGURED`) bloqueia a abertura/continuidade da operação até resolvido (§1); um `CONTENT_INVARIANT_VIOLATION` ou `CASE_AUDIT_BLOCKED` isolado não bloqueia a operação como um todo, só aquele Caso específico.

## 7. Limpeza de dados de teste (bloqueio operacional atual)

Antes do primeiro paciente real, remover do banco de produção:
- 3 profissionais de teste publicados (nomes fictícios) — hoje elegíveis para aparecer numa Shortlist real assim que o ACE voltar a funcionar.
- 1 paciente de teste com Caso aberto.

Isso ainda não foi executado — pendente de confirmação explícita antes da abertura da operação (ver checklist §9).

## 8. Rollback operacional

| Situação | Ação |
|---|---|
| ACE falhando em produção | Não é reversível por deploy — é bloqueio de infraestrutura externa (Vercel). Pausar novos Casos até resolução; Casos já em andamento ficam retomáveis sem perda de dado (artefatos são imutáveis e reaproveitados). |
| Deploy ruim | Vercel → Deployments → **Instant Rollback** para o deploy anterior (`docs/OPERATIONS.md` §13). |
| Variável de ambiente errada | Corrigir no painel da Vercel e fazer **Redeploy** — não precisa reverter código. |
| Dado incorreto cadastrado (profissional/paciente) | Editar/desativar via painel administrativo; exclusão de conta segue o procedimento de cascade já documentado nesta sessão (ordem: `user_roles` antes de `auth.users`, e `patient_story_versions` antes se o paciente tiver história). |

Regra fixa mantida: nenhum agente de IA executa comando destrutivo contra produção sem autorização explícita, específica, por ação.

## 8.1 Golden Set (`tests/golden/`)

- Bloqueado por padrão — `CLAUDE_API_KEY` presente sozinha nunca autoriza uma execução real (ADR-022, `docs/ace/05-knowledge/golden-set-testing.md`).
- Comando autorizado para rodar de fato: `ALLOW_REAL_MODEL_CALLS=true npm run test:golden` (PowerShell: `$env:ALLOW_REAL_MODEL_CALLS = "true"; npm run test:golden`).
- Nunca rodar por curiosidade — tem custo real de API. Rodar apenas depois de editar `prompt.md` de P002/P003/P004/P010, trocar versão/modelo, ou como auditoria periódica deliberada.
- Resultados locais (`.golden-results/`) nunca são versionados (`.gitignore`) e nunca saem da máquina local.

## 8.2 Segurança

- Nunca expor segredos (chaves, tokens, senhas) em log, chat, IA ou commit.
- Nunca versionar `.env.local` ou qualquer arquivo de credencial.
- Nunca usar o cliente `service_role` no frontend — só em código server-side já auditado (`createAdminSupabaseClient`).
- Nunca alterar produção (dado, config, deploy) sem autorização explícita, específica, por ação (§8).
- Remover a variável órfã `ANTHROPIC_API_KEY` do painel da Vercel quando conveniente — não é usada pelo código, mas é resíduo de um incidente já resolvido (`docs/INCIDENT_CLAUDE_API_KEY_PRODUCTION.md`) e pode confundir um diagnóstico futuro.

## 9. Contatos e responsabilidades

Estrutura atual (uma só pessoa, dois papéis — registrar aqui como realidade operacional, não como decisão de produto):

| Papel | Responsável | Observação |
|---|---|---|
| Administrador | Caio (`barbosacaiopadilha@gmail.com`) | Único administrador cadastrado hoje |
| Curador Médico | Caio (mesma conta) | Sem segregação entre quem administra o sistema e quem revisa curadorias — risco operacional de ponto único, registrado no checklist |
| Suporte de infraestrutura (Vercel) | Caso aberto, aguardando resposta | Ver `docs/DEBUGGING.md` |
| Suporte de infraestrutura (Supabase) | Não há caso aberto no momento | — |

## 10. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-14 | Primeira versão — runbook operacional para a abertura da V1 com o primeiro paciente real. |
| 0.2 | 2026-07-15 | Auditoria de documentação pendente: adiciona checagem de Supabase/migrations/RLS/backup à abertura (§1); distinção entre tipos de falha do ACE e como registrar incidente (§6.1, §6.2); regras de Human Review — unicidade, concorrência, append-only, sem revalidação (§4); seção de Golden Set operacional (§8.1); seção de Segurança (§8.2). Nenhuma mudança de código, arquitetura ou Método. |
