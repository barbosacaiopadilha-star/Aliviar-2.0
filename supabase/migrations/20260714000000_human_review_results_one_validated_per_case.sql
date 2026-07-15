-- GO LIVE — auditoria do ACE identificou que human_review_results, ao
-- contrário de ace_executions (índice único parcial em status='RUNNING') e
-- final_curadoria_deliveries (índice único em case_id), não tinha nenhuma
-- proteção de banco contra duas decisões VALIDATED concorrentes para o
-- mesmo Caso. submitHumanReview (human-review-repository.ts) faz um
-- read-then-insert de aplicação; sem esta constraint, duas submissões
-- quase simultâneas (ex.: Administrador e Curador Médico agindo no mesmo
-- Caso) poderiam ambas passar a checagem "ainda não há VALIDATED" antes de
-- qualquer uma commitar, produzindo duas decisões VALIDATED para o mesmo
-- Caso sem qualquer sinal de conflito.

create unique index human_review_results_one_validated_per_case_idx
  on public.human_review_results (case_id)
  where (review_status = 'VALIDATED');
