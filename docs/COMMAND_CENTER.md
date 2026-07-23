# Shadow Launch Command Center — Primeiros 30 dias (ES)

Instrumentos de acompanhamento **manual** do piloto (a V1 não tem telemetria automática). Ver `SHADOW_LAUNCH_PLAN.md`, `RECOVERY.md`, `DEPLOY_RUNBOOK.md`.

## Dashboard diário (lido do estado real do Caso)

Pacientes cadastrados · pacientes ativos (Casos não terminais) · curadorias em andamento (`IN_CURATION`+`HUMAN_REVIEW`) · entregues (`DELIVERED`) · tempo médio até 1º contato (meta ≤1 dia útil) · tempo médio até entrega (meta ≤5 dias úteis) · pendências (`WAITING_FOR_INFORMATION`) · incidentes abertos (meta 0 P0/P1).

## Daily Report

Entraram hoje? · finalizaram? · revisões humanas (P009)? · incidentes? · ACE com comportamento inesperado? · **algum paciente sem resposta?** (gatilho vermelho — nenhum paciente > 1 dia útil sem retorno).

## Incident Commander

- **P0** risco ao paciente / operação parada (erro total; urgência mal conduzida; falha de RLS; entrega sem revisão humana) — imediato.
- **P1** bloqueia um caso (sem profissional compatível; falha de auth; ACE saída inadequada) — mesmo dia.
- **P2** atrito (documentos ausentes; desistência; discordância Curador↔ACE) — 3 dias.
- **P3** cosmético — V1.1.
  Cada incidente: responsável · prazo · impacto · status · resolução. P0/P1 não fecham sem causa-raiz.

## Patient Review (por caso)

Tempo total · nº de interações · dificuldades · feedback do paciente/Curador/Atendente · **feedback sobre o ACE** (Shortlist ajudou? precisou ajuste? — alimenta a calibração) · lições aprendidas.

## Weekly Review

O que funcionou / não funcionou · padrões · melhorias V1.1 (escopo ADR-031) · melhorias V2 (só registrar) · estado de A1/A2.

## Critérios para encerrar o Shadow Launch (ES validado)

5–10 casos reais concluídos ponta a ponta · satisfação positiva consistente · zero P0/P1 aberto · zero quebra de invariante · saída inadequada do ACE sempre capturada pela revisão · A2 registrado · tempos dentro das metas. Só então avaliar expansão — decisão explícita do responsável.

## Invariantes inegociáveis

Revisão humana obrigatória antes de qualquer entrega (P009) · comunica, nunca decide (P010) · sem ranking/score · entrega imutável · paciente é o decisor · paciente nunca vê ACE/protocolos.
