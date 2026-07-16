# Arquitetura Técnica do Domínio Relationship

**Estado**: **PROPOSTO — aguardando aprovação do responsável do projeto.** Este documento não se autodeclara canônico (`docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §4). Deriva exclusivamente da teoria já aprovada em `docs/architecture/DOMAIN_RELATIONSHIP.md` (Veredito A, Fase 4.1) e do padrão técnico **committado e validado** de `src/modules/connection` (lido via `git show HEAD`, nunca a working tree). **A implementação paralela não auditada** (`src/modules/relationship/`, suas migrations, testes, e as alterações em `src/modules/connection/actions.ts`/`repository.ts`) **não foi lida nem usada como fonte de nenhuma decisão aqui** — será auditada contra esta arquitetura numa fase posterior. Nenhum código, schema, migration ou API foi criado ou alterado para produzir este documento.

---

## Etapa 1 — Aggregate Root

- **Nome conceitual**: `RelationshipRecord`.
- **Identidade**: chave natural = `connectionId` de origem (1:1, não repetível). Carrega também `patientProfileId`, `professionalProfileId`, `caseId` (herdado, para rastreabilidade e RLS).
- **Responsabilidade exclusiva**: manter o estado atual (ATIVO/ENCERRADO) e a proveniência completa de cada fato relatado, de forma consistente e nunca inferida.
- **Instante de nascimento**: `occurredAt` do evento de Nascimento.
- **Instante de encerramento**: `occurredAt` do evento de Encerramento (qualquer subtipo).
- **Limites transacionais**: todo comando que produz evento e potencialmente muda o estado denormalizado é uma única transação.
- **Invariantes protegidos**: todos os já formalizados em `DOMAIN_RELATIONSHIP.md` (nasce uma vez, não muda Connection/paciente/profissional de origem, nunca por silêncio/inferência, append-only, etc.).
- **Dados imutáveis**: `connectionId`, `caseId`, `patientProfileId`, `professionalProfileId`, `startedAt`.
- **Dados mutáveis só por comando**: `status`, `endedAt`/`endReason`.
- **Dados que nunca pertencem ao Aggregate**: interpretação de compatibilidade (CI); conteúdo clínico; dados de Curadoria/Shortlist; PAUSADO.

---

## Etapa 2 — Conteúdo do Aggregate

| Elemento               | Classificação                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------- |
| estado                 | Campo do Aggregate (denormalizado)                                                    |
| paciente               | Referência externa, imutável                                                          |
| profissional           | Referência externa, imutável                                                          |
| Connection de origem   | Referência externa, imutável, chave de identidade                                     |
| Caso                   | Referência externa, herdada, denormalizada                                            |
| data real de início    | Campo do Aggregate                                                                    |
| data de encerramento   | Campo do Aggregate (nullable)                                                         |
| motivo de encerramento | Value Object (`EndReason`), projetado como campo denormalizado opcional               |
| autoria                | Value Object (`Provenance`), presente em cada evento — nunca campo único do Aggregate |
| registrador            | Parte do mesmo `Provenance`                                                           |
| origem do relato       | Parte do `Provenance` (canal direto vs. em-nome-de)                                   |
| contestação            | Domain Event                                                                          |
| correção               | Domain Event                                                                          |
| solicitação de ajuda   | Domain Event operacional                                                              |
| ExperienceSignal       | Dado derivado — **nunca pertence ao Aggregate**                                       |
| dados de check-in      | Dado derivado/externo — coberto pelo evento Continuidade, não é campo próprio         |
| **PAUSADO**            | **Dado proibido**                                                                     |

---

## Etapa 3 — Entidades e Value Objects

Nenhuma entidade interna além do Aggregate Root — mesmo padrão de Connection (Aggregate único + histórico de eventos, sem entidades filhas com identidade própria).

**Value Objects**:

1. **Provenance** — quem viveu vs. quem registrou. Invariante: `subjectId` sempre presente; `recordedById` pode diferir (relatado em nome de). Imutável. Igualdade estrutural. Dados mínimos: `subjectId`, `recordedById`, canal. Nunca contém: texto livre sem ID validado, autor nulo.
2. **EventTiming** — `occurredAt`/`recordedAt`. Invariante: `recordedAt >= occurredAt`. Imutável.
3. **EndReason** — categoria (conjunto fechado: paciente/profissional/administrativo-geral/falecimento/troca-de-profissional) + texto livre opcional. Nunca contém julgamento clínico ou causa não declarada.
4. **EventReference** — ponteiro imutável a um evento anterior do mesmo Aggregate. Invariante: nunca circular, sempre aponta para um evento temporalmente anterior.
5. **OperationalEffectDecision** — decisor, relatos considerados (via `EventReference`), efeito escolhido, justificativa. Invariante: nunca declara qual relato é "verdadeiro", só qual efeito vigora.

Nenhum TypeScript definido nesta fase.

---

## Etapa 4 — Catálogo de comandos

| Comando                                      | Ator                                    | Estado permitido           | Evento produzido                                                            | Efeito no estado                       | Repetido                      | Erro esperado                           |
| -------------------------------------------- | --------------------------------------- | -------------------------- | --------------------------------------------------------------------------- | -------------------------------------- | ----------------------------- | --------------------------------------- |
| `createFromFirstAppointment`                 | Paciente (hoje) / profissional (futuro) | Nenhum Relationship prévio | Nascimento                                                                  | Cria ATIVO                             | Rejeitado (unicidade)         | `ALREADY_EXISTS`                        |
| `recordContinuity`                           | Paciente/profissional                   | ATIVO                      | Continuidade Relatada                                                       | Nenhum                                 | Permitido, sempre novo evento | `TERMINAL_STATE`                        |
| `close`                                      | Paciente (sempre)/profissional (futuro) | ATIVO                      | Encerramento                                                                | ATIVO→ENCERRADO                        | Rejeitado                     | `TERMINAL_STATE`, `CONCURRENT_CONFLICT` |
| `closeForProfessionalSwitch`                 | Paciente, exclusivo                     | ATIVO                      | Encerramento (motivo=troca)                                                 | ATIVO→ENCERRADO                        | Rejeitado                     | `TERMINAL_STATE`                        |
| `closeAdministratively` (inclui falecimento) | Administrador, exclusivo                | ATIVO                      | Encerramento (administrativo/falecimento)                                   | ATIVO→ENCERRADO                        | Rejeitado                     | `TERMINAL_STATE`, `NOT_AUTHORIZED`      |
| `recordCorrection`                           | Autor original do evento referenciado   | ATIVO ou ENCERRADO         | Correção                                                                    | Nenhum                                 | Permitido                     | `NOT_OWNER`, `INVALID_REFERENCE`        |
| `recordContestation`                         | Quem discorda (≠ autor original)        | ATIVO ou ENCERRADO         | Contestação                                                                 | Nenhum                                 | Permitido                     | `INVALID_REFERENCE`                     |
| `decideOperationalEffect`                    | Atendente/Curador (Operação Humana)     | ATIVO ou ENCERRADO         | Resolução de Efeito Operacional (+ Encerramento, se o efeito assim decidir) | Indireto                               | Permitido                     | `NOT_AUTHORIZED`                        |
| `recordAssistanceRequest`                    | Paciente/profissional                   | Ver Etapa 7 (pendência)    | Solicitação de Ajuda                                                        | Nenhum                                 | Permitido                     | —                                       |
| `recordReopeningSignal`                      | Paciente, exclusivo                     | ENCERRADO, exclusivo       | Reabertura                                                                  | Nenhum (efeito real fora do Aggregate) | Permitido                     | `INVALID_STATE`                         |

**Nunca criado**: pausar, retomar, inferir continuidade, expirar, reabrir o mesmo Relationship, trocar profissional dentro do mesmo Aggregate, interpretar sinal.

---

## Etapa 5 — Domain Events

| Evento                           | Autor/Registrador     | Altera estado?                         | Produz sinal?              | Consumidores                 | Categoria                        |
| -------------------------------- | --------------------- | -------------------------------------- | -------------------------- | ---------------------------- | -------------------------------- |
| Nascimento                       | Paciente/profissional | Sim (cria)                             | Sim                        | CI                           | Domínio + fronteira (Connection) |
| Continuidade Relatada            | Paciente/profissional | Não                                    | Sim                        | CI                           | Factual                          |
| Encerramento (todos os subtipos) | Conforme comando      | Sim                                    | Sim, exceto falecimento    | CI, Observatório (se atrito) | Domínio                          |
| Correção                         | Autor original        | Não                                    | Não                        | —                            | Administrativo                   |
| Contestação                      | Quem discorda         | Não                                    | Não                        | —                            | Administrativo                   |
| Resolução de Efeito Operacional  | Atendente/Curador     | Indireto                               | Não                        | —                            | Administrativo                   |
| Solicitação de Ajuda             | Paciente/profissional | Não                                    | Não (Observatório, talvez) | Operação                     | Operacional                      |
| Reabertura                       | Paciente              | Não (Relationship permanece ENCERRADO) | Sim (`REABERTA`)           | CI, Journey                  | Fronteira                        |

Nenhum evento contém interpretação de compatibilidade.

---

## Etapa 6 — Nascimento atômico

**Modelo escolhido: B — uma única operação transacional.**

| Modelo                                             | Avaliação                                                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A (Connection confirma, Relationship nasce depois) | **Rejeitado** — risco real de Connection terminal sem Relationship se a segunda operação falhar                                                                                                               |
| **B (transação única)**                            | **Escolhido** — elimina estruturalmente o risco; extensão direta do padrão já validado (`create_connection_with_event`/`apply_connection_transition`, `security invoker`, Fase 4 de Connection, 14/14 testes) |
| C (Outbox/eventual consistency)                    | **Rejeitado** — complexidade desnecessária; nenhum outro domínio do sistema usa esse padrão; sem ganho identificado para um caso local ao mesmo Postgres                                                      |

**Detalhe conceitual**: uma nova função de PERSISTÊNCIA (não uma nova regra de domínio) compõe, na mesma transação, (a) a transição de Connection para `PRIMEIRO_ATENDIMENTO_REALIZADO` com concorrência otimista (já existe) e (b) a criação do Relationship com seu evento de Nascimento. O comando puro `confirmFirstAppointment` de `connection/commands.ts` **nunca é alterado** — continua vivendo só no domínio Connection, sem saber que Relationship existe. A dependência é sempre Relationship→Connection, nunca o contrário.

**Estado transitório aceito**: só a janela da própria transação de banco. Se falhar, nada persiste — Connection permanece no estado anterior, disponível para nova tentativa. Não existe "Connection terminal, Relationship pendente" observável.

---

## Etapa 7 — Máquina técnica de estados

Transições válidas: `(inexistente)→ATIVO` [Nascimento]; `ATIVO→ENCERRADO` [qualquer Encerramento]. Inválidas: `ENCERRADO→ATIVO`; qualquer transição sem comando explícito. Terminal: ENCERRADO.

**As quatro perguntas obrigatórias**:

- **Correção após ENCERRADO?** **Sim** — corrige um fato histórico, nunca reabre o estado.
- **Contestação após ENCERRADO?** **Sim** — mesma lógica.
- **Decisão operacional após ENCERRADO?** **Sim**, mas nunca reabre o estado — só esclarece efeito histórico/auditoria.
- **Solicitação de ajuda após ENCERRADO?** **Definição técnica pendente.** A teoria (`DOMAIN_RELATIONSHIP.md`) nunca fechou isso explicitamente. Esta arquitetura adota, provisoriamente e de forma reversível, **permitir por padrão** (o risco de proibir — impedir alguém de pedir ajuda após um encerramento doloroso — parece maior que o risco de permitir um pedido "tardio"). **Esta é uma escolha técnica conservadora, não uma decisão de negócio nova** — sinalizada aqui, não escondida, e é o único item que impede o Veredito A desta fase (ver Etapa 19).

---

## Etapa 8 — Correção e contestação

- Referência ao fato anterior: via `EventReference`, imutável.
- Correção/contestação nunca apagam — são sempre eventos novos; uma projeção de leitura resolve qual é o fato mais recente sobre X, sem jamais sobrescrever fisicamente o original.
- `OperationalEffectDecision` referencia (potencialmente múltiplos) eventos em conflito via `EventReference`.
- Nova evidência → nova `Resolução de Efeito Operacional`, referenciando a decisão anterior, nunca a substituindo.
- "Recurso" de uma decisão de efeito é, tecnicamente, apenas mais uma Contestação — sem precisar de um tipo de evento novo.
- Estado vigente durante uma contestação: o mesmo ATIVO/ENCERRADO de sempre — reforça a ausência de `EM_DIVERGÊNCIA`.
- Edição destrutiva impedida estruturalmente: nenhum comando de UPDATE/DELETE sobre eventos, só INSERT (mesmo padrão de `connection_events`).
- Cadeia circular impedida: `EventReference` só aponta para eventos estritamente anteriores.
- Fato vigente: sempre uma função de leitura sobre a cadeia de referências, nunca uma coluna sobrescrita.

---

## Etapa 9 — Repository Port (conceitual)

`findById` · `findByConnectionId` · `findActiveByPatient` · `createFromFirstAppointment(draft, event)` — transacional, compõe com a transição de Connection · `applyTransition(id, expectedStatus, newStatus, event)` — concorrência otimista · `addFactualEvent` · `addCorrection(id, reference, event)` · `addContestation(id, reference, event)` · `recordOperationalEffectDecision` · `listEvents`.

Nenhum método genérico `save()`/`update()` — cada método nomeado por intenção de domínio, mesmo padrão de `ConnectionRepository`. Conflito concorrente é uma propriedade do retorno (`CONCURRENT_CONFLICT`), não uma consulta separada.

---

## Etapa 10 — Persistência conceitual (sem schema)

Registro principal (estado denormalizado) + histórico append-only (eventos com `Provenance`, `EventTiming`, payload, `EventReference` opcional). Unicidade por `connectionId`. Referências imutáveis a `caseId`/`patientProfileId`/`professionalProfileId`. Índices conceituais: por `connectionId`, por `patientProfileId`+status, por `caseId` (RLS de curador/admin).

**Respostas diretas**: 1:1 com Connection, sempre. Mais de um ativo por paciente: **sim**, tecnicamente possível (Casos independentes simultâneos). Mais de um pelo mesmo profissional: **sim** (1:N). Mais de um por Caso: **não hoje**, mas por transitividade da constraint de Connection, não por constraint própria de Relationship. Ciclos encadeados: referência explícita ao Caso de origem, nunca mutação do registro antigo. Duplicidade de nascimento: impedida pela unicidade por `connectionId`, garantida na mesma transação do nascimento.

---

## Etapa 11 — Concorrência e idempotência

Dois nascimentos simultâneos: exatamente um vence (unicidade transacional). Encerramentos simultâneos: concorrência otimista (`expected status = ATIVO`). Continuidade concorrente com encerramento: aditiva, sempre aceita como fato histórico, nunca reabre o estado. Correções/contestações concorrentes: sem disputa, ambas aditivas. Retry/clique duplo/múltiplas abas: protegidos pela mesma unicidade/concorrência otimista do banco, independentemente do cliente. Evento fora de ordem: aceito (a Teoria da Temporalidade distingue `occurredAt` de `recordedAt`, e o invariante `recordedAt >= occurredAt` é local a cada evento, não uma ordem global).

Sem chave idempotente adicional — unicidade + concorrência otimista já cobrem os cenários. Retry seguro para comandos aditivos; retry de comandos que mudam status deve ser evitado no cliente (mesmo padrão de reset local já usado em `ConnectionChoicePanel`), mas o servidor já rejeita com segurança de qualquer forma.

---

## Etapa 12 — Matriz de autorização

Resumo (matriz completa por comando no corpo do trabalho desta fase): `createFromFirstAppointment`/`recordContinuity`/`close`/`closeForProfessionalSwitch`/`recordCorrection`(quando autor)/`recordContestation`/`recordAssistanceRequest`/`recordReopeningSignal` → paciente. `closeAdministratively` → exclusivamente Administrador. `decideOperationalEffect` → Atendente/Curador (Operação Humana).

**Nota crítica**: `decideOperationalEffect` exige autoridade de Atendente/Curador, mas **"Atendente" não é uma role técnica existente** (ADR-006: `administrador`/`curador_medico`/`paciente`/`profissional`). Decisão técnica explícita desta fase: mapear a execução para a role `curador_medico` ou `administrador` já existente, preservando a autoria operacional só como metadado (`Provenance`), nunca como permissão técnica própria. Quando a operação registra em nome do paciente, a autoria (`Provenance.subjectId`) permanece sempre do paciente — só `recordedById` muda.

---

## Etapa 13 — RLS conceitual

Paciente lê/escreve só o próprio (`patient_profile_id = auth.uid()`, mesmo padrão de Connection). Profissional: nenhum acesso técnico hoje (sem canal). Curador/Admin leem via `cases.assigned_curator_id`. Atendente sem role própria atua sob `curador_medico`/`administrador`. Administrador só escreve via `closeAdministratively`. Eventos: nenhuma policy de UPDATE/DELETE. Falecimento: só Administrador registra, nunca inferido. IDs sempre derivados da sessão autenticada, nunca do cliente (mesmo padrão de `connection/actions.ts`, `authState.user.id`).

Padrão de 4 camadas preservado sem alteração: Server Action valida sessão/papel; Repository `server-only`; banco como defesa em profundidade.

---

## Etapa 14 — Integrações

**Connection**: transacional no nascimento, nunca depois. **Journey**: Relationship só emite o sinal de reabertura, nunca cria Caso — consistência eventual aceitável. **Curadoria**: Relationship nunca decide reaproveitamento de Shortlist. **CI**: unidirecional, só leitura, eventual. **Observatório**: unidirecional, só atrito. **Operação Humana**: sempre através dos comandos formais, nunca contornando invariantes por fora do Aggregate.

---

## Etapa 15 — Experience Signals

Elegíveis: Nascimento, Continuidade, Encerramento (paciente/profissional/troca), Reabertura (`REABERTA`, já citada por `DOMAIN_COMPATIBILITY_INTELLIGENCE.md`). **Nunca elegível**: Encerramento por Falecimento (invariante já formalizado), Correção, Resolução de Efeito Operacional. Depende de revisão futura: Encerramento Administrativo genérico. Contestação: nunca vira sinal de compatibilidade automaticamente. Solicitação de Ajuda: pode alimentar Observatório, não o CI. Silêncio: nunca produz sinal. CI em si não foi desenhado aqui.

---

## Etapa 16 — Estratégia de testes (planejamento, nada escrito)

**Unitários**: máquina, comandos, guards, correção/contestação, os 3 subtipos de encerramento, falecimento, troca de profissional. **Integração**: nascimento atômico (incluindo falha simulada), append-only, RLS, autorização, concorrência (nascimentos/encerramentos simultâneos), idempotência, histórico, vínculo Caso/Connection. **Componentes/Actions**: sessão, papel, sucesso, conflito, erro sanitizado, refresh, submissão duplicada. **E2E**: primeiro atendimento → nascimento → acompanhamento → encerramento/troca → ciclo novo.

---

## Etapa 17 — Ordem futura de implementação

1. Tipos e Value Objects + erros. 2. Máquina de estados pura. 3. Comandos puros. 4. Testes unitários. 5. Porta de repositório. 6. Migration: registro + histórico + constraints. 7. Migration: função transacional de nascimento (a mais crítica — toca Connection). 8. Migration: função transacional de transição. 9. Repository (`server-only`). 10. RLS. 11. Testes de integração (Supabase local). 12. Server Actions. 13. Testes de Action/componente. 14. Apresentação (fase própria). 15. E2E. 16. Promoção documental.

Cada etapa validável isoladamente, mesmo critério já usado em Connection.

---

## Etapa 18 — Auditoria arquitetural

Nenhum Aggregate grande demais, evento/comando redundante, CRUD disfarçado, dependência circular, mutação de Connection, criação de Caso por Relationship, interpretação de sinal, PAUSADO reaparecendo, falecimento gerando sinal, contestação destrutiva, evento sem autor/registrador, transição não-atômica, duplicidade de nascimento, estado terminal mutável, ou dependência da implementação paralela.

**Dois achados reais, registrados, não escondidos**: (1) "permitir Solicitação de Ajuda após ENCERRADO por padrão" é uma decisão técnica que toca produto, sinalizada como pendência (Etapa 7/19); (2) `decideOperationalEffect` e o registro em nome do paciente pela Atendente dependem de uma role técnica que não existe — mitigado por mapeamento para `curador_medico`/`administrador`, mas é um achado real, não uma solução limpa.

---

## Etapa 19 — Veredito

**B) Arquitetura consistente, mas existem definições técnicas bloqueantes.**

Justificativa: dos 13 itens exigidos para Veredito A, 12 estão integralmente definidos com justificativa completa e sem contradizer a teoria aprovada. Resta exatamente **uma** definição técnica sem base conceitual suficiente na teoria já aprovada — se `recordAssistanceRequest` é válido após `ENCERRADO` (Etapa 7) — adotada aqui apenas provisoriamente, de forma conservadora e reversível, exatamente como a instrução desta fase previu ("registrar definição técnica pendente e justificar eventual Veredito B"). Nenhuma decisão foi adaptada para justificar a implementação paralela — nenhum código dela foi lido.

---

## Documentos relacionados

- `docs/architecture/DOMAIN_RELATIONSHIP.md` — teoria de origem, Veredito A.
- `docs/OPERATIONAL_ROLES_MODEL.md` — base da Etapa 12/13, inclusive a lacuna de role técnica da Atendente.
- `src/modules/connection/` (versão committada, `git show HEAD`) — padrão técnico de referência.
