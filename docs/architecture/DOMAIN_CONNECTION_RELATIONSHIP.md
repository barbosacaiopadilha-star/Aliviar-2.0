# Domínio: Connection & Relationship Engine

**Estado**: **Connection: Implementado** (`docs/DECISIONS.md`, ADR-027, 2026-07-15 — auditoria de integração concluída na Fase 4, mesmo dia) — pontual: decisão do paciente + primeiro contato. `src/modules/connection/` tem domínio puro, persistência (migrations + RLS + funções de transição atômica), Server Actions e dois componentes de apresentação (`ConnectionChoicePanel`, `ConnectionProgressPanel`), com testes unitários, de componente, e de integração validados contra banco real (Supabase local, migrations aplicadas em banco limpo, RLS, triggers, concorrência otimista de criação e de transição — 14 testes, todos passando). E2E existe (`tests/e2e/connection-choice.spec.ts`) mas não pôde ser executado nesta sessão (ver "Limitações conhecidas" abaixo) — não bloqueante para esta promoção, conforme critério definido para a Fase 4.

**Relationship: Implementação em Auditoria** (`docs/DECISIONS.md`, ADR-028, 2026-07-15). `src/modules/relationship/` existe, foi auditado contra a teoria formal aprovada (`docs/architecture/DOMAIN_RELATIONSHIP.md`, Veredito A) e teve uma divergência crítica corrigida **antes do primeiro commit** (a implementação paralela original usava quatro estados — ATIVO/PAUSADO/ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO —, a teoria aprovada exige dois: ATIVO/ENCERRADO). Nascimento atômico com Connection (`confirmFirstAppointmentAndBirthRelationship`, uma única transação), estado ATIVO, encerramento planejado, interrupção, reabertura observada, RLS, concorrência otimista e apresentação na página do paciente (`RelationshipStatusPanel`, irmã de `ConnectionChoicePanel`) estão implementados e testados (37 testes de integração, todos passando contra banco real). Seis capacidades previstas pela arquitetura técnica aprovada (`docs/architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md`, Proposto) permanecem ausentes — Correção de Registro, Contestação, Resolução de Efeito Operacional, Provenance completo, Encerramento por Falecimento, Troca de Profissional — por isso o domínio não é promovido a Implementado nesta ADR. Ver ADR-028 para a matriz de capacidades completa.

**Estado anterior (histórico, preservado — nunca apagado)**: até 2026-07-15, este domínio era classificado como _"Conceitual (Fase 0 concluída). Nenhuma lógica está implementada. `src/modules/connection/` existe apenas como pasta reservada, com um único arquivo (`index.ts`) contendo o comentário `// Módulo reservado — aguarda implementação no MVP.` — nenhum código funcional."_ Entre a descoberta da implementação não rastreada e a promoção de Connection, o domínio passou por um estado intermediário formal — **Implementação em Auditoria** (ADR-027) —, criado precisamente para permitir a validação de integração de Connection antes de sua promoção a Implementado. A implementação real de Connection surgiu no working tree **antes** de qualquer uma dessas atualizações documentais ter sido autorizada — este documento não afirma que a autorização já existia quando o código foi escrito (ver ADR-027 para o relato completo do achado e da decisão de governança). Até 2026-07-15 (Fase 6.2), a parte Relationship deste mesmo documento afirmava, corretamente para a época: _"`src/modules/relationship/` não existe, nem mesmo como placeholder, e nada nesta promoção [de Connection] autoriza sua criação."_ Essa descrição deixou de refletir a realidade quando uma implementação paralela de Relationship apareceu no working tree, de forma análoga ao que já havia ocorrido com Connection — ver ADR-028 para o relato completo.

**Limitações conhecidas (registradas, não bloqueantes)**: (1) os testes E2E de Connection existem mas não puderam ser executados nesta sessão — a página `/login` apresenta uma falha de temporização sob automação Playwright real (elemento do formulário "not visible" / "detached from the DOM" durante `fill()`), reproduzida de forma consistente mesmo contra um banco local limpo; não é causada por nada implementado ou alterado no domínio Connection, e não foi investigada a fundo por estar fora do escopo desta fase (o problema é da página de login, não de Connection). (2) A camada de Server Action (`actions.ts`) não pôde ser testada diretamente — `next/headers` não está disponível no runtime do Vitest — mas essa é uma limitação transversal a todo o projeto (nenhum outro módulo, incluindo `concierge/human-review-actions.ts`, tem um teste de Server Action dedicado); a autorização que a action realiza é validada de forma redundante e real pelas policies de RLS (testadas) e pelos testes de componente que verificam o contrato de chamada de cada action.

## Missão

Cobrir o que acontece depois que a Curadoria é entregue: o momento pontual de conexão (paciente decide, primeiro contato) e o ciclo de vida longitudinal do relacionamento (atendimento continuado, encerramento, eventual reabertura). Existe porque a auditoria de integração Jornada×Compatibility Intelligence concluiu "C) Ainda não" — hoje não há nenhum ponto natural de coleta para os sinais de Camada 3/4 do CI, e este domínio é o que criaria esse ponto.

## Responsabilidade

- **Connection** (pontual): registrar a decisão final do paciente e o primeiro contato com o profissional escolhido.
- **Relationship** (longitudinal): acompanhar o ciclo de vida do atendimento — continuidade, encerramento, reabertura (`REABERTA` já identificada como o sinal comportamental mais forte e menos invasivo, pois não exige nenhuma pergunta nova ao paciente).

## Fronteiras

**Pertence a este domínio**: tudo entre "Curadoria entregue" e "Caso encerrado", incluindo qualquer reabertura.
**Não pertence**: gerar ou revisar a Curadoria (ACE/Curadoria), interpretar os sinais coletados como hipótese de compatibilidade (isso é exclusivo de Compatibility Intelligence — este domínio apenas produz e registra o sinal, nunca o interpreta).

## Entradas

- `FinalCuradoria`/`DeliveryArtifact` (da Curadoria) — implementado: `connection_records.final_curadoria_delivery_id` referencia `final_curadoria_deliveries`, lido via `getFinalCuradoriaDeliveryForCase`.
- Ações do paciente após a entrega — implementado para Connection (decisão, correção de escolha, intenção de contato, confirmação de primeiro atendimento, encerramento sem relacionamento) e para as ações de Relationship já previstas (encerramento planejado, interrupção — ambas exclusivas do paciente). Ações do profissional após a entrega, reabertura observada por conta da equipe, e os eventos administrativos/operacionais da teoria aprovada (Correção, Contestação, Solicitação de Ajuda) continuam não capturadas — não implementado.

## Saídas

- Estado de `ConnectionRecord` (`DECISAO_REGISTRADA` → `CONTATO_INICIADO` → `PRIMEIRO_ATENDIMENTO_REALIZADO`/`ENCERRADO_SEM_RELACIONAMENTO`) — implementado, `connection_records`/`connection_events` (migrations PR1/PR3, `docs/DECISIONS.md` ADR-027).
- Estado de `RelationshipRecord` (ATIVO/ENCERRADO, nascido atomicamente com `PRIMEIRO_ATENDIMENTO_REALIZADO`) — implementado, `relationship_records`/`relationship_events` (`docs/DECISIONS.md` ADR-028). Reabertura (sinal `REABERTA`) implementada como evento, sem alterar o `RelationshipRecord` original.
- Sinal bruto de comportamento (ex.: reabertura) disponível para Compatibility Intelligence consumir como evidência — o fato já é produzido e persistido (`REABERTURA_OBSERVADA`); nenhuma integração de consumo por Compatibility Intelligence foi implementada.

## Dependências

- Depende da Curadoria para saber que uma entrega aconteceu — implementado (`getFinalCuradoriaDeliveryForCase`, `modules/cases/repository.ts`).
- É a única fonte possível, hoje, para os sinais de Camada 3 (experiência vivida) do CI — mas o CI depende deste domínio, não o contrário. Nenhuma integração com Compatibility Intelligence foi implementada.

## Fonte oficial da verdade

- Para a parte Connection: `connection_records`/`connection_events` (Postgres, RLS aplicado) são a fonte oficial exclusiva do estado de decisão/primeiro contato de um Caso — implementado.
- Para a parte Relationship: `relationship_records`/`relationship_events` (Postgres, RLS aplicado) são a fonte oficial do estado de relacionamento longitudinal já capturado (nascimento, ATIVO, encerramento, reabertura) — implementado, mas incompleto frente à teoria aprovada (seis capacidades ausentes, ver ADR-028).

## Invariantes

- Nunca pode inferir compatibilidade a partir do sinal que coleta — apenas registra; a inferência é sempre de Compatibility Intelligence.
- Nunca pode reabrir ou alterar o `FinalCuradoria` já entregue — reabertura de relacionamento é um estado novo, não uma edição do artefato antigo.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá decidir por conta própria se um padrão de comportamento vira conhecimento aprovado — isso é exclusivo da Governança do Conhecimento, mediante proposta de Compatibility Intelligence.
- Nunca poderá gerar sozinho uma nova Shortlist ou reabrir o ACE — uma reabertura de relacionamento pode, no máximo, originar um novo Caso, nunca reescrever um Caso fechado.

## Documentos relacionados

- `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` — Etapa 9 (decisão e primeiro contato) `[IMPLEMENTADO]`; Etapa 11 (encerramento/reabertura) `[IMPLEMENTAÇÃO EM AUDITORIA]`; Etapa 10 (acompanhamento contínuo/cadência de check-in) segue `[MODELO — não implementado]`.
- `docs/architecture/DOMAIN_RELATIONSHIP.md` — teoria formal detalhada da parte Relationship (Veredito A), referenciada por este documento como fonte de profundidade — nunca uma segunda autoridade sobre o estado do domínio, que permanece aqui.
- `docs/architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md` — arquitetura técnica (Proposto), base da matriz de capacidades da ADR-028.
- `DOMAIN_CURATION.md` — domínio imediatamente a montante.
- `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — domínio que consome o sinal produzido aqui.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `CURADORIA ──▶ CONNECTION ──▶ RELATIONSHIP ──▶ (evidência) ──▶ COMPATIBILITY INTELLIGENCE`.
