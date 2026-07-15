# Domínio: Connection & Relationship Engine

**Estado**: Conceitual (Fase 0 concluída). Nenhuma lógica está implementada. `src/modules/connection/` existe apenas como pasta reservada, com um único arquivo (`index.ts`) contendo o comentário `// Módulo reservado — aguarda implementação no MVP.` — nenhum código funcional. `src/modules/relationship/` não existe, nem mesmo como placeholder.

## Missão

Cobrir o que acontece depois que a Curadoria é entregue: o momento pontual de conexão (paciente decide, primeiro contato) e o ciclo de vida longitudinal do relacionamento (atendimento continuado, encerramento, eventual reabertura). Existe porque a auditoria de integração Jornada×Compatibility Intelligence concluiu "C) Ainda não" — hoje não há nenhum ponto natural de coleta para os sinais de Camada 3/4 do CI, e este domínio é o que criaria esse ponto.

## Responsabilidade

- **Connection** (pontual): registrar a decisão final do paciente e o primeiro contato com o profissional escolhido.
- **Relationship** (longitudinal): acompanhar o ciclo de vida do atendimento — continuidade, encerramento, reabertura (`REABERTA` já identificada como o sinal comportamental mais forte e menos invasivo, pois não exige nenhuma pergunta nova ao paciente).

## Fronteiras

**Pertence a este domínio**: tudo entre "Curadoria entregue" e "Caso encerrado", incluindo qualquer reabertura.
**Não pertence**: gerar ou revisar a Curadoria (ACE/Curadoria), interpretar os sinais coletados como hipótese de compatibilidade (isso é exclusivo de Compatibility Intelligence — este domínio apenas produz e registra o sinal, nunca o interpreta).

## Entradas

- `FinalCuradoria`/`DeliveryArtifact` (da Curadoria).
- Ações do paciente e do profissional após a entrega (hoje nenhuma capturada — não implementado).

## Saídas

- Estado de relacionamento (ex.: ativo, encerrado, reaberto) — formato ainda não desenhado.
- Sinal bruto de comportamento (ex.: reabertura) disponível para Compatibility Intelligence consumir como evidência.

## Dependências

- Depende da Curadoria para saber que uma entrega aconteceu.
- É a única fonte possível, hoje, para os sinais de Camada 3 (experiência vivida) do CI — mas o CI depende deste domínio, não o contrário.

## Fonte oficial da verdade

- Ainda não existe — este domínio não tem implementação, logo não tem fonte de dado real hoje. Quando implementado, seria a fonte oficial exclusiva do "estado de relacionamento" do Caso pós-entrega.

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
