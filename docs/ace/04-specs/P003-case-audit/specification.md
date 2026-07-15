# P003 — Case Audit

## Objetivo

Avaliar se o DecisionCase produzido pelo P002 possui informação suficiente para prosseguir de forma responsável para as próximas etapas do ACE, produzindo um artefato de auditoria (CaseAudit) — sem alterar o DecisionCase avaliado.

## Responsabilidades

- Classificar a prontidão do DecisionCase em exatamente um dos três estados oficiais: `READY`, `READY_WITH_WARNINGS`, `BLOCKED`.
- Identificar e categorizar problemas encontrados como bloqueio (`BlockingIssue`) ou aviso (`Warning`).
- Distinguir, para cada problema identificado, entre: ausência de informação, informação contraditória, informação ambígua, informação insuficiente.
- Produzir uma pergunta recomendada (`RecommendedQuestion`) por bloqueio/aviso identificado — nunca mais de uma por item, nunca uma pergunta indutiva.
- Registrar rastreabilidade ao DecisionCase auditado (id e versão) e à versão do Método.

## Não Responsabilidades

O P003 nunca:

- Modifica o DecisionCase auditado.
- Cria diagnóstico.
- Infere especialidade médica.
- Sugere especialista.
- Interpreta exame.
- Adiciona informação ao Caso (isso seria papel do P002 ou de um humano, nunca do P003).
- Inicia o próximo protocolo.
- Produz mais de uma pergunta recomendada por item identificado.
- Formula pergunta indutiva (que sugira a resposta ou uma direção clínica).

## Entradas

- DecisionCase (artefato produzido pelo P002).

## Pré-condições

- O DecisionCase de entrada deve existir e ter sido produzido/validado pelo P002.

## Fluxo

1. Receber o DecisionCase.
2. Verificar se `decisionStatement.decision` e `decisionStatement.goal` são não nulos.
3. Para cada entrada em `missingInformation` do DecisionCase, avaliar se ela é essencial (bloqueante) ou desejável (aviso) para prosseguir — ausência de decisão ou objetivo é sempre bloqueante; demais lacunas são avisos.
4. Avaliar sinais de informação contraditória, ambígua ou insuficiente entre os campos do DecisionCase.
5. Classificar cada problema encontrado como `BlockingIssue` ou `Warning`, com sua categoria (`ausencia`, `contradicao`, `ambiguidade`, `insuficiencia`).
6. Determinar o status geral: `BLOCKED` se houver ao menos um `BlockingIssue`; `READY_WITH_WARNINGS` se não houver `BlockingIssue` mas houver ao menos um `Warning`; `READY` caso contrário.
7. Gerar exatamente uma `RecommendedQuestion` por `BlockingIssue`/`Warning` identificado, em linguagem clara e não indutiva.
8. Construir o CaseAudit, referenciando o DecisionCase auditado (id + versão) e a versão do Método — sem alterar o DecisionCase original.

## Regras

- Este protocolo herda integralmente as restrições do Kernel (`docs/ace/03-kernel/kernel.md`).
- `BLOCKED`: existe ausência de informação essencial que impede uma análise responsável — hoje, `decision` ou `goal` nulos (com a entrada correspondente em `missingInformation` do DecisionCase, já garantida pelo P002) são sempre bloqueantes.
- `READY_WITH_WARNINGS`: as informações essenciais existem (`decision` e `goal` presentes), mas há lacunas desejáveis (outras entradas de `missingInformation`) ou limitações não bloqueantes.
- `READY`: não existem bloqueios nem avisos relevantes.
- `recommendedQuestions` contém apenas perguntas necessárias para resolver bloqueios ou avisos — nunca uma pergunta para um item já resolvido, nunca mais de uma pergunta por item.
- Uma pergunta por item, linguagem clara e não indutiva (nunca sugere resposta ou direção clínica).
- O protocolo distingue explicitamente, via categoria: ausência de informação, informação contraditória, informação ambígua, informação insuficiente.
- O DecisionCase avaliado nunca é modificado — o CaseAudit é sempre um artefato novo e separado.
- **Content Invariant (ADR-024, `docs/DECISIONS.md`):** cada achado adicional de auditoria semântica (categoria `ausencia` ou `insuficiencia`) também indica a que se refere (`relatedField`: `decision`, `goal` ou `other`). Um achado com `relatedField: "other"` (restrição ou preferência prática opcional) nunca pode ter `severity: "blocking"` — o protocolo rejeita deterministicamente (nunca corrige) uma resposta do modelo que viole essa regra, antes de construir o CaseAudit.

## Saída

Um CaseAudit contendo, no mínimo:

- `status` (`ReadinessStatus`)
- `blockingIssues`
- `warnings`
- `missingInformation` (reportada a partir do DecisionCase auditado, nunca ampliada)
- `recommendedQuestions`
- `auditedArtifactId`
- `auditedArtifactVersion`
- `methodVersion`
- `createdAt`

Nunca contém diagnóstico, especialidade inferida, nível de confiança, compatibilidade, competências ou especialistas.

## Critérios de Aceitação

- [ ] O DecisionCase original permanece inalterado (mesmo id, mesma versão, mesmo conteúdo) após a auditoria.
- [ ] `status` é exatamente um de `READY`, `READY_WITH_WARNINGS`, `BLOCKED`.
- [ ] `status` é `BLOCKED` se e somente se `blockingIssues` não está vazio.
- [ ] `status` é `READY_WITH_WARNINGS` se e somente se `blockingIssues` está vazio e `warnings` não está vazio.
- [ ] `status` é `READY` se e somente se `blockingIssues` e `warnings` estão ambos vazios.
- [ ] Cada `BlockingIssue`/`Warning` possui exatamente uma `RecommendedQuestion` correspondente.
- [ ] Nenhuma `RecommendedQuestion` é indutiva (não sugere resposta nem direção clínica).
- [ ] `auditedArtifactId` e `auditedArtifactVersion` correspondem exatamente ao DecisionCase avaliado.
- [ ] Nenhum campo proibido (diagnóstico, especialidade, especialista, nível de confiança, compatibilidade) está presente.

## Casos de Exceção

- **Decisão ausente** (`decisionStatement.decision === null`): `BlockingIssue` de categoria `ausencia` + `RecommendedQuestion` pedindo esclarecimento da decisão.
- **Objetivo ausente** (`decisionStatement.goal === null`): `BlockingIssue` de categoria `ausencia` + `RecommendedQuestion` pedindo esclarecimento do objetivo.
- **Narrativa insuficiente** (refletida em múltiplas entradas essenciais de `missingInformation`): `BLOCKED` com múltiplos `BlockingIssues`.
- **Restrição/preferência opcional ausente** (entrada de `missingInformation` não relacionada a decisão/objetivo): `Warning` de categoria `insuficiencia`, não bloqueante.
- **Informação contraditória** (dois elementos do DecisionCase logicamente incompatíveis): `BlockingIssue` de categoria `contradicao` + `RecommendedQuestion` pedindo esclarecimento da contradição.
- **Informação ambígua** (elemento presente mas que não permite uma leitura única): `Warning` ou `BlockingIssue` de categoria `ambiguidade`, conforme a ambiguidade impeça ou não uma análise responsável.

## Dependências

- `docs/ace/00-constitution/constitution.md` — princípios não-negociáveis.
- `docs/ace/02-ontology/ontology.md` — Estado de Prontidão, Auditoria do Caso, Bloqueio, Aviso, Pergunta Recomendada.
- `docs/ace/03-kernel/kernel.md` — restrições universais herdadas.
- P002 — Case Builder (produz a entrada deste protocolo).
- Protocolo seguinte: ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P003 — Case Audit, formalizada a partir da entrada (DecisionCase), saída (CaseAudit) e pergunta única definidas pelo arquiteto do projeto. |
