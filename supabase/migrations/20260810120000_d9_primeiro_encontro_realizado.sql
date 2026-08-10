-- D-9 · O PRIMEIRO ENCONTRO COM O CURADOR PASSA A TER PROVA DE REALIZAÇÃO.
--
-- `consultation_records` já guardava `meeting_scheduled_at` — a data prevista.
-- Agendar não é realizar, e o produto não tinha como distinguir as duas coisas:
-- a realização vinha sendo inferida dos PRODUTOS do encontro
-- (`understanding_confirmed_at`, validação dos mapas), e produto não é prova de
-- evento. O Curador pode confirmar entendimento lendo a história, sem encontro.
--
-- Uma coluna, nullable, sem default, sem backfill, sem trigger. `null` significa
-- exatamente "não existe prova registrada de realização" — nunca "não houve".
--
-- Fora de escopo, de propósito: cancelamento, no-show, status de agenda,
-- histórico de reagendamento e o agendamento formal do Segundo Encontro (D-10).
--
-- Rollback: alter table curadoria.consultation_records drop column meeting_held_at;

alter table curadoria.consultation_records
  add column meeting_held_at timestamptz null;

comment on column curadoria.consultation_records.meeting_held_at is
  'D-9: prova de que o Primeiro Encontro aconteceu. NUNCA inferido de understanding_confirmed_at, validated_at ou meeting_scheduled_at — produto do encontro não é prova do evento. null = sem prova registrada.';
