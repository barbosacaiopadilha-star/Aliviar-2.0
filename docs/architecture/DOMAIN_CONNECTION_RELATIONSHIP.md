# Domínio: Connection & Relationship Engine

**Estado**: **Implementado** (`docs/DECISIONS.md`, ADR-027, 2026-07-15 — auditoria de integração concluída na Fase 4, mesmo dia) — só a parte **Connection** (pontual: decisão do paciente + primeiro contato). `src/modules/connection/` tem domínio puro, persistência (migrations + RLS + funções de transição atômica), Server Actions e dois componentes de apresentação (`ConnectionChoicePanel`, `ConnectionProgressPanel`), com testes unitários, de componente, e de integração validados contra banco real (Supabase local, migrations aplicadas em banco limpo, RLS, triggers, concorrência otimista de criação e de transição — 14 testes, todos passando). E2E existe (`tests/e2e/connection-choice.spec.ts`) mas não pôde ser executado nesta sessão (ver "Limitações conhecidas" abaixo) — não bloqueante para esta promoção, conforme critério definido para a Fase 4. **Relationship** (a parte longitudinal — continuidade de atendimento, encerramento, reabertura) permanece exatamente como descrito abaixo: `src/modules/relationship/` não existe, nem mesmo como placeholder, e nada nesta promoção autoriza sua criação.

**Estado anterior (histórico, preservado — nunca apagado)**: até 2026-07-15, este domínio era classificado como _"Conceitual (Fase 0 concluída). Nenhuma lógica está implementada. `src/modules/connection/` existe apenas como pasta reservada, com um único arquivo (`index.ts`) contendo o comentário `// Módulo reservado — aguarda implementação no MVP.` — nenhum código funcional."_ Entre a descoberta da implementação não rastreada e esta promoção, o domínio passou por um estado intermediário formal — **Implementação em Auditoria** (ADR-027) —, criado precisamente para permitir esta validação de integração antes de qualquer promoção a Implementado. A implementação real surgiu no working tree **antes** de qualquer uma dessas duas atualizações documentais ter sido autorizada — este documento não afirma que a autorização já existia quando o código foi escrito (ver ADR-027 para o relato completo do achado e da decisão de governança).

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
- Ações do paciente após a entrega — implementado para a parte Connection (decisão, correção de escolha, intenção de contato, confirmação de primeiro atendimento, encerramento sem relacionamento). Ações do profissional após a entrega, e qualquer sinal da parte Relationship (continuidade, reabertura), continuam não capturadas — não implementado.

## Saídas

- Estado de `ConnectionRecord` (`DECISAO_REGISTRADA` → `CONTATO_INICIADO` → `PRIMEIRO_ATENDIMENTO_REALIZADO`/`ENCERRADO_SEM_RELACIONAMENTO`) — implementado, `connection_records`/`connection_events` (migrations PR1/PR3, `docs/DECISIONS.md` ADR-027).
- Estado de relacionamento longitudinal (ex.: reaberto) — formato ainda não desenhado, não implementado (Relationship).
- Sinal bruto de comportamento (ex.: reabertura) disponível para Compatibility Intelligence consumir como evidência — ainda não implementado (depende de Relationship).

## Dependências

- Depende da Curadoria para saber que uma entrega aconteceu — implementado (`getFinalCuradoriaDeliveryForCase`, `modules/cases/repository.ts`).
- É a única fonte possível, hoje, para os sinais de Camada 3 (experiência vivida) do CI — mas o CI depende deste domínio, não o contrário. Nenhuma integração com Compatibility Intelligence foi implementada nesta fase.

## Fonte oficial da verdade

- Para a parte Connection: `connection_records`/`connection_events` (Postgres, RLS aplicado) são a fonte oficial exclusiva do estado de decisão/primeiro contato de um Caso — implementado.
- Para a parte Relationship (estado de relacionamento longitudinal do Caso pós-entrega): ainda não existe — nenhuma implementação.

## Invariantes

- Nunca pode inferir compatibilidade a partir do sinal que coleta — apenas registra; a inferência é sempre de Compatibility Intelligence.
- Nunca pode reabrir ou alterar o `FinalCuradoria` já entregue — reabertura de relacionamento é um estado novo, não uma edição do artefato antigo.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá decidir por conta própria se um padrão de comportamento vira conhecimento aprovado — isso é exclusivo da Governança do Conhecimento, mediante proposta de Compatibility Intelligence.
- Nunca poderá gerar sozinho uma nova Shortlist ou reabrir o ACE — uma reabertura de relacionamento pode, no máximo, originar um novo Caso, nunca reescrever um Caso fechado.

## Documentos relacionados

- `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` — confirma que as etapas 9-11 (decisão e primeiro contato, acompanhamento de 12 meses, encerramento) são hoje `[MODELO — não implementado]`.
- `DOMAIN_CURATION.md` — domínio imediatamente a montante.
- `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — domínio que consome o sinal produzido aqui.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `CURADORIA ──▶ CONNECTION ──▶ RELATIONSHIP ──▶ (evidência) ──▶ COMPATIBILITY INTELLIGENCE`.
