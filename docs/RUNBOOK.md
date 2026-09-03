# Runbook Operacional — Primeiro Paciente Real

Documento de operação, não de engenharia. Complementa `docs/OPERATIONS.md` (deploy/infra técnica) e `docs/DEBUGGING.md` (diagnóstico técnico) — aqui o foco é **quem faz o quê, em que ordem, e o que fazer quando algo dá errado**, na abertura da operação real da Aliviar Curadoria Médica. Nenhuma alteração de código, arquitetura ou Método está prevista neste documento — a V1 está congelada.

**Operação de produção (leia junto):** `DEPLOY_RUNBOOK.md` (publicação do release), `RECOVERY.md` (restauração em falha, ex.: 3h da manhã), `COMMAND_CENTER.md` (dashboard/daily/incidentes/critérios de encerramento do Shadow Launch). Um operador novo assume a operação lendo estes quatro documentos + `OPERATIONS.md`.

> **Estado em 2026-09-03.** Este runbook foi escrito em julho para a V1 com o motor ACE. O motor saiu do código na simplificação operacional de 21/08 — `src/modules/concierge/`, `/admin/ace` e `/admin/ace/[executionId]` não existem — e o `@anthropic-ai/sdk` saiu do `package.json` em 03/09 (ADR-056, registro de implementação). O que dependia dele está marcado *(histórico)* abaixo. O fluxo humano da primeira Curadoria real é o **Guia da Primeira Rodada** em `docs/rede/` (nove passos, ADR-073/074/075), com o Roteiro do Supervisor e a Folha da Mesa. Este documento não consta do `docs/INDEX.md`; a auditoria de agosto registrou cinco runbooks sobrepostos (`AUDITORIA_08_HISTORICO.md`).

## 1. Abertura da operação

1. *(histórico)* A abertura exigia resolver o bloqueio do ACE (integração Anthropic, bug da Vercel) e um Health Check verde em `/admin/ace`. Não há mais modelo de linguagem a configurar nem Health Check: nada bloqueia a abertura por esse lado.
2. Confirmar que o Supabase de produção está acessível e que todas as migrations em `supabase/migrations/` foram aplicadas — hoje o `git push` de `main` as aplica pela integração GitHub do Supabase (`SIM-97` no registro de achados), sem passo manual; conferir o ledger antes de qualquer Curadoria real.
3. Confirmar RLS ativa nas tabelas sensíveis (`professional_profiles`, `patient_profiles`, `cases`, `human_review_results` e demais) — nenhuma policy desabilitada manualmente para depuração e esquecida.
4. Remover todo dado de teste do banco de produção (ver §7 — Limpeza).
5. Confirmar que o administrador consegue logar em `/admin` com a conta real.
6. Confirmar `strict-transport-security` e certificado válidos em `https://www.aliviarcuradoriamedica.com.br` (já validado nesta auditoria).
7. Confirmar que existe backup recente do banco de produção (Supabase gerencia backups automáticos no plano em uso — confirmar retenção/PITR ativo) antes de qualquer operação em lote ou correção manual de dado.

## 2. Cadastro do primeiro profissional

Feito pelo Administrador em `/admin/profissionais/novo`. Campos mínimos para o profissional entrar na Mesa — o Método recusa inventar dado. Na rodada real a porta é o **Formulário do Profissional** assinado (`docs/rede/`, passo 2 do Guia da Primeira Rodada): sem ele o médico não entra na Mesa.

- Nome, identificador profissional, resumo profissional.
- Nível de experiência, abordagem de intake, disponibilidade.
- Ao menos uma área de competência.

Recomendado: **ao menos 3 profissionais reais** cadastrados antes do primeiro paciente — a Curadoria entrega três caminhos, e sem três legítimos a Mesa para (passo 6 do Guia: parar e anotar por quê é um achado, não um fracasso).

## 3. Cadastro do primeiro paciente

Feito pelo Administrador em `/admin/pacientes/novo`, com o e-mail real da pessoa. A senha inicial só aparece uma vez na tela — entregar com segurança (nunca por canal não confiável, nunca colada em chat/IA).

## 4. Primeira curadoria

A primeira Curadoria real segue o **Guia da Primeira Rodada** (`docs/rede/`), em papel, nove passos: o contato, os médicos antes do assistido, a Consulta Inicial, o reconhecimento, a Mesa, os três caminhos, a apresentação, a decisão — dela — e a ata. O sistema entra na ata (passo 9) e no que ele já sabe fazer:

1. O Supervisor abre o Case a partir do lead (conversão no CRM) e o transfere ao Curador — cada troca de responsável é auditada.
2. O Curador registra a Mesa em `/portal-curador/casos/[id]` (etapas) e o Mapa de Prioridades; a assistida reconhece o próprio perfil quando ele é apresentado.
3. A entrega fica em `/paciente/curadoria`, incluindo "Baixar em PDF". Confirmar que a pessoa acessa com a própria conta.

*(histórico)* Os passos antigos — Caso "Pronto para curadoria", execução do ACE em `/admin/casos/[id]`, confirmação de `COMPLETED` em `/admin/ace/[executionId]`, Human Review com uma única decisão `VALIDATED` (ADR-025) — descreviam o motor e a revisão dele; não existem mais no produto.

## 5. Acompanhamento

Fora do sistema (processo da equipe, não uma funcionalidade do produto, ver `docs/PRODUCT_ARCHITECTURE.md`): registrar a data da entrega para o acompanhamento periódico de 12 meses previsto no produto.

## 6. Tratamento de incidentes

| Sintoma | Onde olhar primeiro | Ação |
| --- | --- | --- |
| Paciente não vê algo que deveria | Confirmar papel efetivo (`user_roles`) e RLS — `docs/DEBUGGING.md` §4 | Nunca é a aplicação decidindo, é a policy do Postgres |
| Erro genérico na tela do paciente | Entrar como Admin/Curador, abrir o Caso e ler a mensagem interna | A regra segue: o paciente nunca vê detalhe técnico. Não há mais `failureCode` novo — `docs/DEBUGGING.md` §1–3 é histórico |
| Suspeita de dado sensível em log | Tratar como incidente de segurança, não como debug | `docs/DEBUGGING.md` §7 — nunca dado clínico, senha ou chave em log |
| *(histórico)* ACE não avança / Health Check `MODEL_NOT_CONFIGURED` | `/admin/ace` — não existe mais | Nenhuma ação: não há motor a travar nem modelo a configurar |

## 6.1 *(histórico)* Distinção entre tipos de falha do ACE

A tabela de `failureCode` que vivia aqui (`ACE_MODEL_TIMEOUT`, `ACE_MODEL_RATE_LIMITED`, `ACE_MODEL_NOT_CONFIGURED`, `CASE_AUDIT_BLOCKED`, `CONTENT_INVARIANT_VIOLATION`, Human Review pendente) descrevia o motor. Nenhum desses códigos é gravado hoje; o histórico fica em `docs/DEBUGGING.md` §1–3. O que sobreviveu é de gente, não de motor: `WAITING_FOR_INFORMATION` segue existindo como status de Case, para quando falta informação essencial da assistida — não é falha, é espera.

## 6.2 Como registrar um incidente

1. Categorizar primeiro: infraestrutura (Vercel/Supabase fora do ar, variável não injetada), regra do Método (Case parado por falta de informação genuína) ou defeito do produto — nunca misturar os três num único registro.
2. Evidência mínima: id do Case, tela, hora, papel de quem viu e a mensagem exibida — nunca dado clínico da assistida, senha ou chave.
3. Registrar no `docs/REGISTRO_UNICO_DE_ACHADOS.md` (uma linha `SIM-*`) ou, se for incidente de segurança, em documento próprio (`docs/INCIDENT_*.md`) — nunca misturado a este Runbook.
4. Critério de bloqueio da operação: infraestrutura fora do ar bloqueia a operação inteira até resolver; um Case parado por falta de informação bloqueia só aquele Case.

## 7. Limpeza de dados de teste (bloqueio operacional atual)

Antes do primeiro paciente real, remover do banco de produção:

- 3 profissionais de teste publicados (nomes fictícios). *(histórico: "elegíveis numa Shortlist real assim que o ACE voltar a funcionar".)* O estado real dos dados de produção está no registro de achados (`SIM-99`, `SIM-101`), não aqui.
- 1 paciente de teste com Caso aberto.

Isso ainda não foi executado — pendente de confirmação explícita antes da abertura da operação (ver checklist §9).

## 8. Rollback operacional

| Situação                                          | Ação                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *(histórico)* ACE falhando em produção | Era bloqueio de infraestrutura externa (Vercel), não reversível por deploy. Não existe mais motor a falhar. |
| Deploy ruim                                       | Vercel → Deployments → **Instant Rollback** para o deploy anterior (`docs/OPERATIONS.md` §13).                                                                                                                                        |
| Variável de ambiente errada                       | Corrigir no painel da Vercel e fazer **Redeploy** — não precisa reverter código.                                                                                                                                                      |
| Dado incorreto cadastrado (profissional/paciente) | Editar/desativar via painel administrativo; exclusão de conta segue o procedimento de cascade já documentado nesta sessão (ordem: `user_roles` antes de `auth.users`, e `patient_story_versions` antes se o paciente tiver história). |

Regra fixa mantida: nenhum agente de IA executa comando destrutivo contra produção sem autorização explícita, específica, por ação.

## 8.1 Golden Set (`tests/golden/`)

- *(estado em 2026-09-03)* A suíte não tem nenhum arquivo `*.golden.test.ts`: `npm run test:golden` roda vazio. O que ficou é o guard (`tests/golden/real-model-call-guard.ts`) e o teste unitário dele, mantidos por decisão de governança (ADR-022) e para nunca autorizar chamada real por engano. `CLAUDE_API_KEY` está aposentada (`docs/ENVIRONMENT_VARIABLES.md`, seção Histórico). Os itens abaixo descrevem como a suíte operava:
- Bloqueado por padrão — `CLAUDE_API_KEY` presente sozinha nunca autoriza uma execução real (ADR-022, `docs/ace/05-knowledge/golden-set-testing.md`).
- Comando autorizado para rodar de fato: `ALLOW_REAL_MODEL_CALLS=true npm run test:golden` (PowerShell: `$env:ALLOW_REAL_MODEL_CALLS = "true"; npm run test:golden`).
- Nunca rodar por curiosidade — tem custo real de API. Rodar apenas depois de editar `prompt.md` de P002/P003/P004/P010, trocar versão/modelo, ou como auditoria periódica deliberada.
- Resultados locais (`.golden-results/`) nunca são versionados (`.gitignore`) e nunca saem da máquina local.

## 8.2 Segurança

- Nunca expor segredos (chaves, tokens, senhas) em log, chat, IA ou commit.
- Nunca versionar `.env.local` ou qualquer arquivo de credencial.
- Nunca usar o cliente `service_role` no frontend — só em código server-side já auditado (`createAdminSupabaseClient`).
- Nunca alterar produção (dado, config, deploy) sem autorização explícita, específica, por ação (§8).
- Remover do painel da Vercel as variáveis órfãs `ANTHROPIC_API_KEY` (resíduo do incidente `docs/INCIDENT_CLAUDE_API_KEY_PRODUCTION.md`) e `CLAUDE_API_KEY` (aposentada em 03/09, sem consumidor no código), e revogar a chave no painel da Anthropic se não tiver outro uso — pendência do proprietário, registrada em `docs/CREDENTIALS.md`.

## 9. Contatos e responsabilidades

Estrutura atual (uma só pessoa, dois papéis — registrar aqui como realidade operacional, não como decisão de produto):

| Papel                                | Responsável                           | Observação                                                                                                                          |
| ------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Administrador                        | Caio (`barbosacaiopadilha@gmail.com`) | Único administrador cadastrado hoje                                                                                                 |
| Curador Médico                       | Caio (mesma conta)                    | Sem segregação entre quem administra o sistema e quem revisa curadorias — risco operacional de ponto único, registrado no checklist |
| Suporte de infraestrutura (Vercel)   | Nenhum caso aberto                    | O caso do bug da variável (`docs/INCIDENT_CLAUDE_API_KEY_PRODUCTION.md`) está resolvido, e a integração que dependia dele foi aposentada |
| Suporte de infraestrutura (Supabase) | Não há caso aberto no momento         | —                                                                                                                                   |

## 10. Histórico

| Versão | Data       | Mudança                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1    | 2026-07-14 | Primeira versão — runbook operacional para a abertura da V1 com o primeiro paciente real.                                                                                                                                                                                                                                                                                                         |
| 0.2    | 2026-07-15 | Auditoria de documentação pendente: adiciona checagem de Supabase/migrations/RLS/backup à abertura (§1); distinção entre tipos de falha do ACE e como registrar incidente (§6.1, §6.2); regras de Human Review — unicidade, concorrência, append-only, sem revalidação (§4); seção de Golden Set operacional (§8.1); seção de Segurança (§8.2). Nenhuma mudança de código, arquitetura ou Método. |
| 0.3    | 2026-09-03 | O motor ACE saiu do produto (21/08) e a chave da Anthropic foi aposentada (03/09): §1.1, §1.2, §2, §4, §6, §6.1, §6.2, §7, §8, §8.1, §8.2 e §9 corrigidos ou marcados como histórico; nota de estado no topo apontando para o Guia da Primeira Rodada em `docs/rede/`. Nenhuma mudança de código. |
