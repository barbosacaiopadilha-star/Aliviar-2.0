# Changelog — P008 (Shortlist Builder)

## v0.2 — 2026-07-12 (Sprint 10 — correção obrigatória antes do P009)

- **Correção de arquitetura**: a ordenação por `providerId` foi promovida indevidamente, na v0.1, a critério de *seleção* quando havia mais de três providers qualificados (os três primeiros alfabeticamente eram escolhidos). O arquiteto do projeto identificou que isso violava a regra "nunca produza ranking" — a posição alfabética não tem relação alguma com adequação ao caso, tornando a escolha arbitrária.
- **Correção aplicada**: `providerId` agora serve exclusivamente para serialização neutra de um conjunto já decidido pela Qualificação. Quando há mais de três providers qualificados, o resultado passa a ser `BLOCKED` com o novo `blockedReason: "AMBIGUOUS_COMPOSITION"` — nunca uma seleção mecânica. Todos os candidatos aptos são preservados em um novo campo, `candidateProviderIds`, com justificativa individual em `providerRationales`, para que a resolução seja feita por revisão humana (P009), não pelo P008.
- **Novo campo `blockedReason`**: distingue as três causas possíveis de bloqueio — `INSUFFICIENT_OPTIONS` (menos de três candidatos no total), `INSUFFICIENT_EVIDENCE` (três ou mais candidatos, mas poucos qualificados) e `AMBIGUOUS_COMPOSITION` (mais de três qualificados, sem critério legítimo de desempate). Antes, a v0.1 tinha apenas um `compositionRationale` textual, sem uma classificação estruturada da causa.
- **Novo campo `candidateProviderIds`**: preserva os providers qualificados quando `BLOCKED` (vazio quando `COMPOSED`, onde `selectedProviderIds` já cobre o mesmo papel).
- Documentos atualizados: `specification.md` (seção "Composição" reescrita, nova seção "Ordenação por providerId", nova tabela de `blockedReason`, Fluxo/Regras/Saída/Critérios/Casos de Exceção), `prompt.md`, `examples.md` (Exemplo 2 reescrito), `tests.md` (T02 reescrito + T02b/T02c novos, T13 ajustado).
- Código atualizado: `src/modules/ace/artifacts/shortlist.ts`, `src/modules/ace/protocols/p008-shortlist-builder.ts`, `src/modules/ace/core/field-policy.ts` (+`blockedReason`, +`candidateProviderIds` em `STAGE_RESERVED_FIELDS`).
- Testes atualizados/adicionados: `ace-shortlist.test.ts`, `ace-p008-shortlist-builder.test.ts`.

## v0.1 — 2026-07-12 (Sprint 9)

- Primeira versão do protocolo, especificada e implementada após a correção do `constraintAlignment` do P007 (ADR-015) — a Shortlist não deveria ser construída sobre uma CompatibilityMatrix com essa lacuna estrutural ainda aberta.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código:
  - `src/modules/ace/artifacts/shortlist.ts` — artefato `Shortlist`, com dois estados possíveis (`COMPOSED`/`BLOCKED`), validações de invariantes (exatamente três providers sem duplicatas em ordem alfabética quando `COMPOSED`; nenhum provider selecionado quando `BLOCKED`; justificativa individual obrigatória por provider selecionado).
  - `src/modules/ace/protocols/p008-shortlist-builder.ts` — quarto protocolo do pipeline inteiramente determinístico. Critério de qualificação e critério de desempate documentados e justificados em `specification.md` ("Qualificação" e "Composição — alternativa escolhida e motivo").
  - `src/modules/ace/core/protocol-id.ts` — `ProtocolId` estendido para incluir `"P008"`.
  - `src/modules/ace/core/field-policy.ts` — `STAGE_RESERVED_FIELDS` ganhou `selectedProviderIds`, `providerRationales`, `compositionRationale`, `relevantLimitations`, todos reservados a partir do P008 (a entrada `shortlist` já existia como marcador desde o ADR-014, mas nenhum campo do artefato final usa esse nome literal — os nomes definitivos, mais descritivos, foram os efetivamente reservados).
- **Decisão de qualificação**: um provider é apto a compor a Shortlist quando `competencyAlignment` e `experienceAlignment` não são `INSUFFICIENT` — as outras quatro dimensões não bloqueiam a qualificação. Ver `specification.md`, seção "Qualificação — critério adotado e motivo", para a alternativa descartada (exigir ausência de `INSUFFICIENT` em todas as seis dimensões) e por que ela se tornou inviável após o ADR-015 (o `constraintAlignment` fica `INSUFFICIENT` sempre que há qualquer Restrição Obrigatória registrada, dado que o perfil do provider ainda não tem atributos estruturados para verificá-las).
- **Decisão de composição**: quando há mais de três providers qualificados, o desempate é por ordem alfabética de `providerId` — nunca por comparação de qualidade entre eles, para não introduzir um ranking disfarçado. Ver `specification.md`, seção "Composição — alternativa escolhida e motivo".
- Nenhum novo atributo de provider foi introduzido. Nenhum conceito de P009/P010 foi antecipado.
