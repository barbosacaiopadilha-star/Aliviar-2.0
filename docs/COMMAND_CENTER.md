# Shadow Launch Command Center — Primeiros 30 dias (ES)

Instrumentos de acompanhamento **manual** do piloto (a V1 não tem telemetria automática). Ver `SHADOW_LAUNCH_PLAN.md`, `RECOVERY.md`, `DEPLOY_RUNBOOK.md`.

> **Estado em 2026-09-03.** O Shadow Launch com o motor ACE não aconteceu: até 12/08 a produção nunca tinha curado ninguém (todas as histórias eram fixtures), e o motor saiu do produto em 21/08; `SIM-99` e `SIM-101` no registro de achados têm os números de setembro. Este painel manual segue válido como instrumento, com o vocabulário corrigido abaixo. O instrumento de observação da primeira rodada real é o **Diário de Observação** do Guia da Primeira Rodada (`docs/rede/`).

## Dashboard diário (lido do estado real do Caso)

Pacientes cadastrados · pacientes ativos (Casos não terminais) · curadorias em andamento (`IN_CURATION`+`HUMAN_REVIEW`) · entregues (`DELIVERED`) · tempo médio até 1º contato (meta ≤1 dia útil) · tempo médio até entrega (meta ≤5 dias úteis) · pendências (`WAITING_FOR_INFORMATION`) · incidentes abertos (meta 0 P0/P1).

## Daily Report

Entraram hoje? · finalizaram? · Mesas registradas? · incidentes? · alguma Mesa parou por falta de três caminhos legítimos? · **algum paciente sem resposta?** (gatilho vermelho — nenhum paciente > 1 dia útil sem retorno).

## Incident Commander

- **P0** risco ao paciente / operação parada (erro total; urgência mal conduzida; falha de RLS; entrega sem Mesa registrada pelo Curador) — imediato.
- **P1** bloqueia um caso (sem profissional compatível; falha de auth) — mesmo dia.
- **P2** atrito (documentos ausentes; desistência) — 3 dias.
- **P3** cosmético — V1.1.
  Cada incidente: responsável · prazo · impacto · status · resolução. P0/P1 não fecham sem causa-raiz.

## Patient Review (por caso)

Tempo total · nº de interações · dificuldades · feedback do paciente/Curador/Supervisor · **feedback sobre a Mesa** (o que o Curador quis saber e não tinha, de qual lado? onde o papel não bastou? — é o que o Diário de Observação colhe) · lições aprendidas.

## Weekly Review

O que funcionou / não funcionou · padrões · melhorias V1.1 (escopo ADR-031) · melhorias V2 (só registrar) · estado de A1/A2.

## Critérios para encerrar o Shadow Launch (ES validado)

5–10 casos reais concluídos ponta a ponta · satisfação positiva consistente · zero P0/P1 aberto · zero quebra de invariante · A2 registrado · tempos dentro das metas. Só então avaliar expansão — decisão explícita do responsável.

## Invariantes inegociáveis

A Mesa é de gente, registrada pelo Curador antes de qualquer entrega · comunica, nunca decide · sem ranking/score · entrega imutável · paciente é o decisor ("nenhuma destas" é resultado válido) · paciente nunca vê a grade da Mesa. *(histórico: "revisão humana obrigatória (P009)", "comunica, nunca decide (P010)", "paciente nunca vê ACE/protocolos".)*
