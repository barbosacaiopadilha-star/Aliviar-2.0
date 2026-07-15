# Domínio: Compatibility Intelligence (CI)

**Estado**: Conceitual — Fases 0 a 6 concluídas. Nenhum código, schema, protocolo, Ontologia, Kernel ou Constituição foi alterado. O único item pendente é empírico (validar o método de priorização com pacientes reais), não conceitual.

## Missão

Aprender, ao longo do tempo e de forma agregada, o que torna um par paciente-profissional humanamente compatível — para além da elegibilidade técnica que o ACE já garante — sem nunca decidir por um paciente individual e sem nunca julgar indivíduos.

## Responsabilidade

- Modelar 4 camadas de compatibilidade: **L1 técnica** (= P007 do ACE, inalterada, hermética), **L2 prioridades declaradas** (novo), **L3 experiência vivida** (novo), **L4 aprendizado coletivo agregado** (novo, nunca sobre indivíduos).
- Elicitar prioridades humanas de forma cognitivamente viável (modelo híbrido: até 5 dimensões, orçamento de pontos distribuído só entre elas — hipótese pendente de validação real, não decisão fechada).
- Manter uma ontologia própria de dimensões de compatibilidade (árvore de 4 ramos: Relação Terapêutica / Continuidade e Coordenação / Aspectos Práticos / Contexto de Vida como camada transversal).
- Aplicar uma teoria formal da evidência (Indicador → Evidência → Inferência → Resultado), com escada de confiança qualitativa (nunca numérica) e lista de campos permanentemente banidos (idêntica à da ADR-014: popularidade, tempo de cadastro, demografia, avaliação por estrelas, volume).
- Governar o ciclo de vida da evidência (Nascida → Madura → Elegível → Removida) com pré-condições estritas (origem rastreável, Caso terminal estável, sem contestação aberta, consentimento válido, sem dependência de campo banido).
- Propor — nunca aprovar — padrões de compatibilidade à Governança do Conhecimento.

## Fronteiras

**Pertence a este domínio**: L2/L3/L4, elicitação de prioridades, teoria da evidência, ciclo de vida da evidência, proposição de hipóteses.
**Não pertence**: L1/elegibilidade técnica (ACE, hermético), aprovação de conhecimento (Governança do Conhecimento, exclusiva), coleta do sinal bruto de comportamento (Connection & Relationship Engine), atrito operacional/UX de qualquer domínio (Observatório da Experiência — evidência de compatibilidade humana e evidência de atrito operacional são disjuntas por definição, mesmo usando a palavra "evidência" em ambos os domínios).

## Entradas

- Prioridades declaradas pelo paciente (via Jornada — etapa "preferências" do wizard é o local estrutural, ainda não implementado para este fim).
- Sinal de experiência vivida (via Connection & Relationship Engine — ex.: `REABERTA`).
- Elegibilidade técnica já resolvida pelo ACE (L1, consumida, nunca alterada).

## Saídas

- Hipóteses de compatibilidade humana, propostas à Governança do Conhecimento.
- Nunca gera diretamente uma saída visível ao paciente ou ao Curador — toda saída passa primeiro pela aprovação da Governança.

## Dependências

- Depende do ACE (L1, consumida sem alteração).
- Depende da Jornada (L2) e de Connection & Relationship (L3) para sinal de entrada — nenhum dos dois ainda implementado para esse fim.
- Depende da Governança do Conhecimento para que qualquer hipótese vire padrão aprovado.

## Fonte oficial da verdade

- **Hipóteses de compatibilidade**: exclusivamente Compatibility Intelligence — nenhum outro domínio pode propor um padrão de compatibilidade humana.
- **Padrão aprovado (utilizável)**: nunca o CI — sempre a Governança do Conhecimento, mesmo que o CI seja quem o originou.

## Invariantes

- L1 permanece hermética — CI nunca altera P007 diretamente.
- Nenhum campo banido pode ser dependência de uma evidência elegível (mesma lista da ADR-014).
- L4 é sempre agregado — nunca produz julgamento sobre um profissional ou paciente individual.
- Confiança de evidência é sempre qualitativa (escada Muito sustentado → Sem evidência), nunca numérica/score.
- CI propõe; nunca aprova, rejeita ou retira um padrão sozinho — isso é exclusivo da Equipe Clínica via Governança do Conhecimento.
- Retratação ou exclusão de dado pelo paciente é sempre honrada, inclusive retroativamente para uso futuro.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá decidir por um paciente individual — CI trabalha em agregado (L4) ou em apoio a uma decisão humana (L2/L3), nunca substituindo a escolha do paciente.
- Nunca poderá aprovar seu próprio conhecimento — depende sempre da Governança do Conhecimento (Equipe Clínica).
- Nunca poderá usar volume, popularidade, demografia, tempo de cadastro ou avaliação por estrelas como evidência, mesmo indiretamente.
- Nunca poderá ser implementado (código, schema, protocolo) sem autorização explícita do usuário — per regra de maturidade arquitetural, e por ainda faltar validação empírica do método de priorização (Fase 2).

## Documentos relacionados

- `docs/DECISIONS.md` — ADR-014 (lista de campos banidos).
- `docs/ace/04-specs/P010-final-curadoria-delivery/specification.md`/`prompt.md` — evidência textual pré-existente de que "não existe ranking" e "a escolha final é do cliente" já são normativos, compatíveis com a filosofia do CI.
- `DOMAIN_ACE.md` — fonte de L1.
- `DOMAIN_CONNECTION_RELATIONSHIP.md` — fonte de L3.
- `DOMAIN_JOURNEY.md` — fonte estrutural futura de L2.
- `DOMAIN_KNOWLEDGE_GOVERNANCE.md` — único domínio que pode aprovar o que o CI propõe.
- `DOMAIN_EXPERIENCE_OBSERVATORY.md` — domínio irmão, escopo disjunto (atrito operacional vs. compatibilidade humana).

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `RELATIONSHIP ──▶ (evidência) ──▶ COMPATIBILITY INTELLIGENCE ──▶ GOVERNANÇA DO CONHECIMENTO ──▶ (conhecimento aprovado) ──▶ volta ao CI`.
