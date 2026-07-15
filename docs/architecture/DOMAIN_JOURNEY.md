# Domínio: Jornada do Paciente

**Estado**: Implementado (V1.0).

## Missão

Levar uma pessoa desde o primeiro contato com a Aliviar (Landing) até a decisão de abrir um Caso — e, depois de o Caso ser entregue, sustentar a experiência do paciente dentro do produto (Home adaptativa, acompanhamento do status). É o único domínio que fala diretamente com o paciente antes da Curadoria existir.

## Responsabilidade

- Comunicar a proposta da Aliviar (Landing) de forma editorial, não comercial.
- Coletar a história do paciente através do wizard "sua história" (6 etapas: para-quem → motivo → história → informações → preferências → revisão), com persistência real em Supabase (`patient_stories`) e concorrência otimista — nunca `localStorage`-only.
- Sustentar a experiência autenticada do paciente via `PatientShell` — uma Home adaptativa com 4 estados (`no_story` / `draft` / `submitted_without_case` / `case_available`).
- Traduzir o estado técnico do Caso em linguagem humana para o paciente, nunca expor estado interno do ACE.

## Fronteiras

**Pertence a este domínio**: Landing, wizard de história, Home do paciente, tradução de status de Caso para linguagem do paciente.
**Não pertence**: abrir o Caso formalmente (ação manual da equipe, fora deste domínio), qualquer protocolo do ACE, a decisão de Curadoria, o primeiro contato com o profissional (ver `DOMAIN_CONNECTION_RELATIONSHIP.md` — hoje reservado/vazio), qualquer registro de acompanhamento pós-entrega de 12 meses (também reservado/vazio).

## Entradas

- Visita anônima à Landing.
- Respostas do paciente ao wizard de 6 etapas.
- Estado do Caso, conforme publicado pela Curadoria via `patient_case_overview`.

## Saídas

- `patient_stories` (história persistida, rascunho ou submetida).
- Sinal para a equipe de que uma história está pronta para virar Caso (a criação do Caso em si é ação manual da equipe, fora deste domínio).
- Interface visível do status ao paciente (9 rótulos exatos, fonte: `patient_case_overview`).

## Dependências

- Depende do ACE e da Curadoria para saber o que mostrar como status (consome `patient_case_overview`, nunca lê tabelas internas do ACE diretamente).
- Não depende de Connection & Relationship, Compatibility Intelligence, Observatório ou Governança do Conhecimento — hoje nenhum destes existe de forma a alimentar a Jornada.

## Fonte oficial da verdade

- **História do paciente**: `patient_stories` (Supabase), gerenciada por `src/modules/story`.
- **Estado exibido do Caso**: a view `patient_case_overview` (`supabase/migrations/20260712150000_final_curadoria_delivery.sql:90-107`), nunca o estado interno do ACE diretamente.
- **Mapa completo de etapas (0–11)**: `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` é a fonte de referência para o desenho da experiência ponta a ponta, incluindo o que já está implementado e o que ainda é apenas modelo.

## Invariantes

- O wizard nunca cria um Caso automaticamente — a transição história → Caso é sempre uma ação humana da equipe.
- O paciente nunca vê vocabulário interno do ACE (nomes de protocolo, IDs de artefato, terminologia de Curador) — apenas os 9 rótulos de status oficiais.
- A Home do paciente reflete só o que é real: os 4 estados existem porque essas são as 4 situações reais possíveis hoje, não uma simplificação de mais estados internos.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá tomar decisões de compatibilidade ou elegibilidade — isso é exclusivo do ACE.
- Nunca poderá aprovar, validar ou entregar uma Curadoria — isso é exclusivo da Curadoria (P009/P010).
- Nunca poderá inferir ou registrar prioridades de compatibilidade humana (L2 do CI) sem que isso seja desenhado explicitamente como extensão deste domínio, autorizada pelo usuário — hoje a etapa "preferências" do wizard é apenas o local estrutural onde isso poderia um dia acontecer, não uma implementação de CI.

## Documentos relacionados

- `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` — mapa completo das 12 etapas (0-11).
- `docs/PRODUCT_ARCHITECTURE.md` — arquitetura de produto original (parcialmente pré-implementação; corrigida seção a seção conforme V1.0 real).
- `DOMAIN_ACE.md`, `DOMAIN_CURATION.md` — domínios a jusante que a Jornada consome via status.
- `DOMAIN_CONNECTION_RELATIONSHIP.md` — domínio conceitual que futuramente continuaria a jornada após a entrega da Curadoria.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `Paciente → JORNADA ──▶ ACE`.
