# Aliviar — Architecture Blueprint (Documento Mestre)

Documento canônico da arquitetura conceitual da Aliviar. Consolida em um único lugar o que hoje está espalhado por dezenas de documentos, ADRs e conversas — sem substituir nenhum deles como fonte normativa (`docs/DECISIONS.md` continua sendo a fonte de ADRs; `docs/ace/` continua sendo a fonte do Método). Este documento é o **mapa**, não a lei.

**Status**: consolidação puramente documental (2026-07-15). Nenhum código, migration, ACE, Compatibility Intelligence ou Constituição foi alterado ao produzir este blueprint e os documentos de domínio associados.

**Autoridade**: acima de todos os domínios está a **Constituição da Aliviar** (`docs/DECISIONS.md`, princípios permanentes), o **Kernel do ACE** (`docs/ace/03-kernel/kernel.md`, disciplina técnica interna do ACE) e a **Ontologia** (`docs/ace/02-ontology/ontology.md`, vocabulário do ACE especificamente — não um vocabulário compartilhado por todos os sete domínios). Nenhum domínio abaixo pode contrariar essa camada.

## Os sete domínios oficiais

| #   | Domínio                            | Estado                                                                                                                                                                                                                                                                                                 | Documento                                                                        |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | Jornada do Paciente                | Implementado                                                                                                                                                                                                                                                                                           | [`DOMAIN_JOURNEY.md`](./DOMAIN_JOURNEY.md)                                       |
| 2   | Aliviar Curation Engine (ACE)      | Implementado (P001–P008)                                                                                                                                                                                                                                                                               | [`DOMAIN_ACE.md`](./DOMAIN_ACE.md)                                               |
| 3   | Curadoria (Human Review + Entrega) | Implementado (P009–P010)                                                                                                                                                                                                                                                                               | [`DOMAIN_CURATION.md`](./DOMAIN_CURATION.md)                                     |
| 4   | Connection & Relationship Engine   | Connection: **Implementado** (`docs/DECISIONS.md` ADR-027, promovido 2026-07-15 após auditoria de integração contra banco real — até então, Conceitual/Fase 0, depois Implementação em Auditoria; histórico preservado no documento de domínio). Relationship: continua Conceitual, nada implementado. | [`DOMAIN_CONNECTION_RELATIONSHIP.md`](./DOMAIN_CONNECTION_RELATIONSHIP.md)       |
| 5   | Compatibility Intelligence (CI)    | Conceitual (Fases 0–6 completas)                                                                                                                                                                                                                                                                       | [`DOMAIN_COMPATIBILITY_INTELLIGENCE.md`](./DOMAIN_COMPATIBILITY_INTELLIGENCE.md) |
| 6   | Observatório da Experiência        | Protocolo ativo, sem dado real ainda                                                                                                                                                                                                                                                                   | [`DOMAIN_EXPERIENCE_OBSERVATORY.md`](./DOMAIN_EXPERIENCE_OBSERVATORY.md)         |
| 7   | Governança do Conhecimento         | Conceitual                                                                                                                                                                                                                                                                                             | [`DOMAIN_KNOWLEDGE_GOVERNANCE.md`](./DOMAIN_KNOWLEDGE_GOVERNANCE.md)             |

Todos os invariantes permanentes que atravessam mais de um domínio estão consolidados em [`ARCHITECTURAL_INVARIANTS.md`](./ARCHITECTURAL_INVARIANTS.md) — cada documento de domínio lista só os invariantes que lhe são próprios, e referencia o consolidado para os demais.

**Regra de governança arquitetural** (2026-07-15): a partir desta consolidação, nenhum domínio novo deve ser criado sem justificar explicitamente por que os sete domínios existentes não conseguem absorver a nova responsabilidade. Evolução futura deve, por padrão, ocorrer _dentro_ de um domínio já definido.

## Diagrama Mestre

```
                    CONSTITUIÇÃO (autoridade máxima)
                              │
                    KERNEL / ONTOLOGIA (disciplina e vocabulário do ACE)
                              │
Paciente → JORNADA ──▶ ACE ──▶ CURADORIA ──▶ CONNECTION ──▶ RELATIONSHIP
                        (P001-8) (P009+P010)                     │
                                                                  ▼
                                                    ┌────── evidência ──────┐
                                                    ▼                        │
                                          COMPATIBILITY INTELLIGENCE ────────┘
                                                    │
                                                    ▼
                                            OBSERVATÓRIO ◀── (escuta todos os domínios)
                                                    │
                                                    ▼
                                        GOVERNANÇA DO CONHECIMENTO
                                                    │
                                    (conhecimento aprovado, versionado)
                                                    │
                                                    ▼
                                    volta ao CI para futuras Curadorias
```

Este é o diagrama de referência usado, sem variação, em todos os documentos de domínio.

## Fluxo global

`Paciente → Jornada (Landing → decisão do paciente) → ACE (Caso aberto → Shortlist) → Curadoria (Shortlist → FinalCuradoria) → Connection (entrega → primeiro atendimento ou desistência) → Relationship (atendimento → encerramento/reabertura) → Compatibility Intelligence (evidência elegível → hipótese) → Observatório (contínuo, transversal) → Governança (hipótese → conhecimento aprovado, retornando ao CI)`

## Fontes oficiais da verdade (resumo — detalhe em cada domínio)

| Informação                               | Fonte oficial                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Caso (estado, transições)                | ACE + Curadoria (`src/modules/cases`)                                                                                                  |
| Narrativa                                | ACE — P001                                                                                                                             |
| Compatibilidade técnica (elegibilidade)  | ACE — P006/P007                                                                                                                        |
| Compatibilidade humana (padrão aprovado) | Governança do Conhecimento                                                                                                             |
| Relacionamento (estado, ciclo de vida)   | Connection & Relationship Engine                                                                                                       |
| Prioridades declaradas                   | Jornada do Paciente                                                                                                                    |
| Evidências                               | Múltiplas fontes catalogadas (Connection/Relationship, Jornada, justificativa do Curador) — ver `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` |
| Hipóteses                                | Compatibility Intelligence, exclusivamente                                                                                             |
| Padrões (conhecimento aprovado)          | Governança do Conhecimento, exclusivamente                                                                                             |

## Auditoria de consistência (verificação final desta consolidação)

**Existe alguma responsabilidade duplicada?** Não encontrada. Um ponto que exige nomeação explícita para nunca ser confundido: Observatório da Experiência (atrito operacional/UX de qualquer domínio) e Compatibility Intelligence (especificamente compatibilidade humana paciente↔profissional) lidam com "evidência", mas em escopos disjuntos — ver `DOMAIN_EXPERIENCE_OBSERVATORY.md` e `DOMAIN_COMPATIBILITY_INTELLIGENCE.md`.

**Existe alguma fronteira ambígua?** Não. Cada domínio tem missão, entradas e saídas verificadas independentemente (ver seção "Fronteiras" de cada `DOMAIN_*.md`).

**Existe alguma dependência circular?** Não. O fluxo é direcional: Jornada → ACE → Curadoria → Connection → Relationship → CI → Governança → (conhecimento aprovado retorna ao CI, nunca reabre um Caso já entregue). O único "retorno" no grafo é este — conhecimento aprovado alimentando futuras Curadorias, nunca um domínio anterior no mesmo ciclo.

**Existe algum domínio sem fonte oficial da verdade?** Não — todos os sete têm ao menos uma informação da qual são fonte exclusiva (ver tabela acima e cada `DOMAIN_*.md`).

**Existe algum invariante contraditório?** Não — ver `ARCHITECTURAL_INVARIANTS.md` para a lista consolidada; nenhum invariante de um domínio nega o de outro.

## Escopo explicitamente fora desta consolidação

**Discovery** (busca direta, MVP original, ADR-004) — módulo reservado, vazio, fora da jornada Concierge que fundamenta os sete domínios acima. **Gestão de Profissional** como domínio de primeira classe — hoje tratado como dado consumido via portas pelo ACE, não como domínio com ciclo de vida próprio. Nenhum dos dois tem, hoje, justificativa forte para entrar como oitavo domínio — ambos permanecem escopo conhecido e não esquecido, não lacunas desta consolidação.

Nenhuma implementação foi realizada. Nenhum código, migration, ACE, CI ou Constituição foi alterado.
