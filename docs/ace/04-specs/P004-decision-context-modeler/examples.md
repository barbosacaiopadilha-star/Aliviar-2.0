# Exemplos — P004 (Decision Context Modeler)

Reaproveita os DecisionCase/CaseAudit de `docs/ace/04-specs/P002-case-builder/examples.md` e `docs/ace/04-specs/P003-case-audit/examples.md`, mantendo rastreabilidade entre os protocolos.

## Contexto simples (caso simples do P002/P003 — READY)

**Entrada:** DecisionCase (decisão: "encontrar um profissional para conversar sobre ansiedade", sem restrições) + CaseAudit (`status: READY`).

**Saída (DecisionContext):**

- `decisionType`: `"buscar_acompanhamento"`
- `objective`: "Ter um espaço de escuta para lidar com a ansiedade."
- `clinicalDomain`: `"saude_emocional_mental"`
- `complexity`: `"baixa"` — nenhuma restrição obrigatória, nenhuma lacuna.
- `urgency`: `"nao_determinado"` — o cliente não relatou nenhum sinal de prazo ou pressão de tempo.
- `strategy`: `"conexao_direta"` — o Caso está claro e completo o suficiente para seguir direto à conexão.
- `assumptions`: ["Nenhuma restrição de tempo foi mencionada, por isso a urgência não foi classificada como alta ou baixa, e sim como não determinada."]
- `rationale`: "O cliente busca um espaço de conversa pontual, sem sinalizar necessidade de acompanhamento contínuo ou urgência — a decisão já está clara o suficiente para prosseguir diretamente."

## Contexto complexo (caso intermediário do P002/P003 — READY, com restrição de prazo)

**Entrada:** DecisionCase (decisão: "decidir se a cirurgia no joelho é necessária"; restrição obrigatória: "não estar em recuperação durante viagem de trabalho em 3 meses") + CaseAudit (`status: READY`).

**Saída (DecisionContext):**

- `decisionType`: `"decidir_intervencao"`
- `objective`: "Ter clareza e segurança antes de decidir."
- `clinicalDomain`: `"saude_fisica"`
- `complexity`: `"media"` — há uma restrição obrigatória relevante para considerar.
- `urgency`: `"media"` — a restrição de prazo (viagem em 3 meses) indica uma janela de tempo relevante para a decisão, ainda que não seja uma emergência.
- `strategy`: `"avaliacao_inicial"` — o cliente busca entender se a intervenção é realmente necessária antes de decidir, não uma conexão imediata para realizá-la.
- `assumptions`: ["A restrição de viagem foi interpretada como um sinal de urgência moderada, não alta, pois há um prazo de meses, não de dias."]
- `rationale`: "O cliente já tem uma dúvida específica (necessidade da cirurgia) e uma restrição de tempo concreta, mas ainda busca entender as opções antes de decidir — por isso a estratégia recomendada é uma avaliação inicial, não uma conexão direta."

## Rejeição (caso complexo do P002/P003 — BLOCKED)

**Entrada:** DecisionCase (decisão: `null`) + CaseAudit (`status: BLOCKED`, com um `BlockingIssue` de categoria `ausencia`).

**Saída:** o P004 **rejeita a execução** — nenhum DecisionContext é produzido. A resposta sinaliza que o Caso precisa ser resolvido primeiro, apontando para as `recommendedQuestions` já presentes na CaseAudit (ex.: "Qual decisão específica você precisa tomar neste momento?").
