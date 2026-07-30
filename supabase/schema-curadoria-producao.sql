


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "curadoria";


ALTER SCHEMA "curadoria" OWNER TO "postgres";


CREATE TYPE "curadoria"."ace_execution_status" AS ENUM (
    'PENDING',
    'RUNNING',
    'BLOCKED',
    'FAILED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE "curadoria"."ace_execution_status" OWNER TO "postgres";


CREATE TYPE "curadoria"."audit_action" AS ENUM (
    'role_granted',
    'role_revoked'
);


ALTER TYPE "curadoria"."audit_action" OWNER TO "postgres";


CREATE TYPE "curadoria"."case_event_type" AS ENUM (
    'created',
    'status_changed',
    'curator_assigned',
    'note_updated'
);


ALTER TYPE "curadoria"."case_event_type" OWNER TO "postgres";


CREATE TYPE "curadoria"."case_status" AS ENUM (
    'NEW',
    'IN_REVIEW',
    'WAITING_FOR_INFORMATION',
    'READY_FOR_CURATION',
    'IN_CURATION',
    'HUMAN_REVIEW',
    'DELIVERED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE "curadoria"."case_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."append_crm_audit_log"("_action" "text", "_entity_type" "text", "_entity_id" "uuid", "_previous_values" "jsonb" DEFAULT NULL::"jsonb", "_new_values" "jsonb" DEFAULT NULL::"jsonb", "_context" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare
  _id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;

  if not (curadoria.has_role('administrador') or curadoria.has_role('concierge')) then
    raise exception 'Não autorizado.';
  end if;

  if btrim(coalesce(_action, '')) = '' or btrim(coalesce(_entity_type, '')) = '' then
    raise exception 'Ação ou entidade inválida.';
  end if;

  insert into curadoria.crm_audit_log (
    actor_id, action, entity_type, entity_id, previous_values, new_values, context
  ) values (
    auth.uid(), _action, _entity_type, _entity_id, _previous_values, _new_values, _context
  )
  returning id into _id;

  return _id;
end;
$$;


ALTER FUNCTION "curadoria"."append_crm_audit_log"("_action" "text", "_entity_type" "text", "_entity_id" "uuid", "_previous_values" "jsonb", "_new_values" "jsonb", "_context" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "curadoria"."connection_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "final_curadoria_delivery_id" "uuid" NOT NULL,
    "patient_profile_id" "uuid" NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'DECISAO_REGISTRADA'::"text" NOT NULL,
    "decided_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "connection_records_status_check" CHECK (("status" = ANY (ARRAY['DECISAO_REGISTRADA'::"text", 'CONTATO_INICIADO'::"text", 'PRIMEIRO_ATENDIMENTO_REALIZADO'::"text", 'ENCERRADO_SEM_RELACIONAMENTO'::"text"])))
);


ALTER TABLE "curadoria"."connection_records" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."apply_connection_transition"("p_connection_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_professional_profile_id" "uuid", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS "curadoria"."connection_records"
    LANGUAGE "plpgsql"
    AS $$
declare v_record curadoria.connection_records;
begin
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);
  update curadoria.connection_records set status = p_new_status, professional_profile_id = p_professional_profile_id where id = p_connection_id and status = p_expected_status returning * into v_record;
  if not found then raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status using errcode = '55000'; end if;
  return v_record;
end; $$;


ALTER FUNCTION "curadoria"."apply_connection_transition"("p_connection_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_professional_profile_id" "uuid", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."relationship_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "patient_profile_id" "uuid" NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'ATIVO'::"text" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "relationship_records_status_check" CHECK (("status" = ANY (ARRAY['ATIVO'::"text", 'ENCERRADO'::"text"])))
);


ALTER TABLE "curadoria"."relationship_records" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."apply_relationship_transition"("p_relationship_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS "curadoria"."relationship_records"
    LANGUAGE "plpgsql"
    AS $$
declare v_record curadoria.relationship_records;
begin
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);
  update curadoria.relationship_records set status = p_new_status where id = p_relationship_id and status = p_expected_status returning * into v_record;
  if not found then raise exception 'relationship_records: transição concorrente detectada para % (esperado %)', p_relationship_id, p_expected_status using errcode = '55000'; end if;
  return v_record;
end; $$;


ALTER FUNCTION "curadoria"."apply_relationship_transition"("p_relationship_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."assert_connection_professional_in_delivery"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if not exists (
    select 1 from curadoria.final_curadoria_deliveries d, jsonb_array_elements(d.provider_presentations) as presentation
    where d.id = new.final_curadoria_delivery_id and presentation ->> 'providerId' = new.professional_profile_id::text
  ) then
    raise exception 'professional_profile_id % não pertence aos profissionais apresentados em final_curadoria_delivery_id %', new.professional_profile_id, new.final_curadoria_delivery_id using errcode = '23514';
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."assert_connection_professional_in_delivery"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."assert_connection_valid_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.professional_profile_id is distinct from old.professional_profile_id and old.status is distinct from 'DECISAO_REGISTRADA' then
    raise exception 'connection_records: correção de profissional só é permitida enquanto status = DECISAO_REGISTRADA (atual: %)', old.status using errcode = '23514';
  end if;
  if new.status is distinct from old.status then
    if old.status in ('PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: % é um estado terminal, nenhuma transição é permitida a partir dele', old.status using errcode = '23514';
    end if;
    if old.status = 'DECISAO_REGISTRADA' and new.status not in ('CONTATO_INICIADO','PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de DECISAO_REGISTRADA para % não é válida', new.status using errcode = '23514';
    end if;
    if old.status = 'CONTATO_INICIADO' and new.status not in ('PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de CONTATO_INICIADO para % não é válida', new.status using errcode = '23514';
    end if;
  end if;
  new.updated_at = now();
  return new;
end; $$;


ALTER FUNCTION "curadoria"."assert_connection_valid_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."assert_relationship_immutable_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.connection_id is distinct from old.connection_id then raise exception 'relationship_records: connection_id é imutável' using errcode = '23514'; end if;
  if new.case_id is distinct from old.case_id then raise exception 'relationship_records: case_id é imutável' using errcode = '23514'; end if;
  if new.patient_profile_id is distinct from old.patient_profile_id then raise exception 'relationship_records: patient_profile_id é imutável' using errcode = '23514'; end if;
  if new.professional_profile_id is distinct from old.professional_profile_id then raise exception 'relationship_records: professional_profile_id é imutável' using errcode = '23514'; end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."assert_relationship_immutable_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."assert_relationship_matches_connection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare v_connection curadoria.connection_records;
begin
  select * into v_connection from curadoria.connection_records where id = new.connection_id;
  if not found then raise exception 'relationship_records: connection_id % não encontrado', new.connection_id using errcode = '23503'; end if;
  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', new.connection_id, v_connection.status using errcode = '23514'; end if;
  if new.case_id is distinct from v_connection.case_id or new.patient_profile_id is distinct from v_connection.patient_profile_id or new.professional_profile_id is distinct from v_connection.professional_profile_id then
    raise exception 'relationship_records: case_id/patient_profile_id/professional_profile_id devem corresponder exatamente ao connection_id referenciado' using errcode = '23514';
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."assert_relationship_matches_connection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."assert_relationship_valid_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status is distinct from old.status then
    if old.status = 'ENCERRADO' then raise exception 'relationship_records: % é um estado terminal', old.status using errcode = '23514'; end if;
    if old.status = 'ATIVO' and new.status not in ('ENCERRADO') then raise exception 'relationship_records: transição de ATIVO para % não é válida', new.status using errcode = '23514'; end if;
  end if;
  new.updated_at = now();
  return new;
end; $$;


ALTER FUNCTION "curadoria"."assert_relationship_valid_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."can_access_crm_contact"("_contact_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
  select exists (
    select 1
    from curadoria.crm_contacts c
    where c.id = _contact_id
      and (
        curadoria.has_role('administrador')
        or (curadoria.has_role('concierge') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (
          curadoria.has_role('curador_medico')
          and exists (
            select 1
            from curadoria.crm_cases k
            where k.contact_id = c.id
              and k.responsible_curator_id = auth.uid()
              and k.pipeline_stage in (
                'sent_to_curator',
                'curation_in_progress',
                'report_ready',
                'report_delivered',
                'doctor_selected',
                'scheduling_support',
                'completed'
              )
          )
        )
      )
  );
$$;


ALTER FUNCTION "curadoria"."can_access_crm_contact"("_contact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."confirm_first_appointment_and_birth_relationship"("p_connection_id" "uuid", "p_expected_status" "text", "p_actor_id" "uuid", "p_connection_event_payload" "jsonb", "p_relationship_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS TABLE("connection_record" "curadoria"."connection_records", "relationship_record" "curadoria"."relationship_records")
    LANGUAGE "plpgsql"
    AS $$
declare v_connection curadoria.connection_records; v_relationship curadoria.relationship_records;
begin
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, 'PRIMEIRO_ATENDIMENTO_REALIZADO', p_actor_id, p_connection_event_payload, p_occurred_at, p_recorded_at);
  update curadoria.connection_records set status = 'PRIMEIRO_ATENDIMENTO_REALIZADO' where id = p_connection_id and status = p_expected_status returning * into v_connection;
  if not found then raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status using errcode = '55000'; end if;
  insert into curadoria.relationship_records (connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at)
  values (v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at) returning * into v_relationship;
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_relationship.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_relationship_event_payload, p_occurred_at, p_recorded_at);
  return query select v_connection, v_relationship;
end; $$;


ALTER FUNCTION "curadoria"."confirm_first_appointment_and_birth_relationship"("p_connection_id" "uuid", "p_expected_status" "text", "p_actor_id" "uuid", "p_connection_event_payload" "jsonb", "p_relationship_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."create_connection_with_event"("p_case_id" "uuid", "p_final_curadoria_delivery_id" "uuid", "p_patient_profile_id" "uuid", "p_professional_profile_id" "uuid", "p_decided_at" timestamp with time zone, "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS "curadoria"."connection_records"
    LANGUAGE "plpgsql"
    AS $$
declare v_record curadoria.connection_records;
begin
  insert into curadoria.connection_records (case_id, final_curadoria_delivery_id, patient_profile_id, professional_profile_id, status, decided_at)
  values (p_case_id, p_final_curadoria_delivery_id, p_patient_profile_id, p_professional_profile_id, 'DECISAO_REGISTRADA', p_decided_at) returning * into v_record;
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'DECISAO_REGISTRADA', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);
  return v_record;
end; $$;


ALTER FUNCTION "curadoria"."create_connection_with_event"("p_case_id" "uuid", "p_final_curadoria_delivery_id" "uuid", "p_patient_profile_id" "uuid", "p_professional_profile_id" "uuid", "p_decided_at" timestamp with time zone, "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."create_relationship_with_event"("p_connection_id" "uuid", "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS "curadoria"."relationship_records"
    LANGUAGE "plpgsql"
    AS $$
declare v_connection curadoria.connection_records; v_record curadoria.relationship_records;
begin
  select * into v_connection from curadoria.connection_records where id = p_connection_id;
  if not found then raise exception 'relationship_records: connection_id % não encontrado', p_connection_id using errcode = '23503'; end if;
  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', p_connection_id, v_connection.status using errcode = '23514'; end if;
  insert into curadoria.relationship_records (connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at)
  values (v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at) returning * into v_record;
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);
  return v_record;
end; $$;


ALTER FUNCTION "curadoria"."create_relationship_with_event"("p_connection_id" "uuid", "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."enforce_case_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
declare allowed boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    allowed := case old.status
      when 'NEW' then new.status in ('IN_REVIEW','CANCELLED')
      when 'IN_REVIEW' then new.status in ('WAITING_FOR_INFORMATION','READY_FOR_CURATION','CANCELLED')
      when 'WAITING_FOR_INFORMATION' then new.status in ('IN_REVIEW','CANCELLED')
      when 'READY_FOR_CURATION' then new.status in ('IN_CURATION','CANCELLED')
      when 'IN_CURATION' then new.status in ('HUMAN_REVIEW','WAITING_FOR_INFORMATION','CANCELLED')
      when 'HUMAN_REVIEW' then new.status in ('DELIVERED','WAITING_FOR_INFORMATION','CANCELLED')
      when 'DELIVERED' then new.status in ('CLOSED')
      else false end;
    if not allowed then raise exception 'Transição de status inválida: % -> %', old.status, new.status; end if;
    if new.status = 'IN_CURATION' and old.started_at is null then new.started_at := now(); end if;
    if new.status in ('CLOSED','CANCELLED') then new.closed_at := coalesce(new.closed_at, now()); end if;
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."enforce_case_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."enforce_priority_profile_validation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare total integer;
begin
  if new.status = 'VALIDATED' and (old.status is distinct from 'VALIDATED') then
    select coalesce(sum(weight), 0) into total from curadoria.priority_weights where priority_profile_id = new.id;
    if total <> 100 then
      raise exception 'A distribuicao de pesos precisa somar exatamente 100 pontos (soma atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "curadoria"."enforce_priority_profile_validation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."enforce_report_has_three"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare total integer;
begin
  if new.emitted_at is not null and old.emitted_at is null then
    select count(*) into total from curadoria.curadoria_report_options where report_id = new.id;
    if total <> 3 then
      raise exception 'O Relatorio apresenta sempre exatamente tres opcoes (atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "curadoria"."enforce_report_has_three"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."enforce_selection_has_three"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare total integer;
begin
  if new.status = 'DELIVERED' and (old.status is distinct from 'DELIVERED') then
    select count(*) into total from curadoria.curated_selection_options where curated_selection_id = new.id;
    if total <> 3 then
      raise exception 'A Curadoria apresenta sempre exatamente tres opcoes (atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "curadoria"."enforce_selection_has_three"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
begin
  begin
    insert into curadoria.profiles (id, display_name) values (new.id, new.raw_user_meta_data ->> 'display_name');
    insert into curadoria.user_settings (profile_id) values (new.id);
  exception when others then
    null; -- nunca propaga: o signup (de qualquer produto) jamais é abortado por este espelhamento
  end;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."has_role"("_role_slug" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
  select exists (
    select 1 from curadoria.user_roles ur
    join curadoria.roles r on r.id = ur.role_id
    where ur.profile_id = auth.uid() and r.slug = _role_slug
  );
$$;


ALTER FUNCTION "curadoria"."has_role"("_role_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."is_case_curator_for_story"("_story_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
  select exists (select 1 from curadoria.cases c where c.source_story_id = _story_id and c.assigned_curator_id = auth.uid());
$$;


ALTER FUNCTION "curadoria"."is_case_curator_for_story"("_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."is_curator_for_case"("_case_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
  select exists (select 1 from curadoria.cases c where c.id = _case_id and c.assigned_curator_id = auth.uid());
$$;


ALTER FUNCTION "curadoria"."is_curator_for_case"("_case_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "curadoria"."is_curator_for_case"("_case_id" "uuid") IS 'True quando quem chama e o Curador atribuido ao Caso.';



CREATE OR REPLACE FUNCTION "curadoria"."is_curator_for_crm_case"("_case_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
  select exists (
    select 1
    from curadoria.crm_cases c
    where c.id = _case_id
      and c.responsible_curator_id = auth.uid()
  );
$$;


ALTER FUNCTION "curadoria"."is_curator_for_crm_case"("_case_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."is_patient_for_case"("_case_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
  select exists (select 1 from curadoria.cases c where c.id = _case_id and c.patient_profile_id = auth.uid());
$$;


ALTER FUNCTION "curadoria"."is_patient_for_case"("_case_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "curadoria"."is_patient_for_case"("_case_id" "uuid") IS 'True quando quem chama e o paciente dono do Caso.';



CREATE OR REPLACE FUNCTION "curadoria"."log_user_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
begin
  if tg_op = 'INSERT' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(),'role_granted', new.profile_id, jsonb_build_object('role_id', new.role_id));
    return new;
  elsif tg_op = 'DELETE' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(),'role_revoked', old.profile_id, jsonb_build_object('role_id', old.role_id));
    return old;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "curadoria"."log_user_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."notify_patient_welcome"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
declare _role_slug text;
begin
  select slug into _role_slug from curadoria.roles where id = new.role_id;
  if _role_slug = 'paciente' then
    insert into curadoria.patient_notifications (profile_id, title, body)
    values (new.profile_id, 'Bem-vindo à Aliviar', 'Sua conta foi criada. A partir de agora você pode acompanhar sua jornada por aqui, no seu tempo — sem pressa.');
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."notify_patient_welcome"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."protect_delivered_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare report_delivered timestamptz;
begin
  select delivered_at into report_delivered from curadoria.curadoria_reports where id = coalesce(new.report_id, old.report_id);
  if report_delivered is not null then
    raise exception 'Este Relatorio ja foi entregue ao paciente e nao pode mais ser alterado.';
  end if;
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "curadoria"."protect_delivered_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."protect_patient_notification_content"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
begin
  if not curadoria.has_role('administrador') then
    new.title := old.title; new.body := old.body; new.profile_id := old.profile_id; new.created_at := old.created_at;
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."protect_patient_notification_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."protect_validated_priority_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria', 'pg_temp'
    AS $$
declare profile_status text;
begin
  select status into profile_status from curadoria.priority_profiles where id = coalesce(new.priority_profile_id, old.priority_profile_id);
  if profile_status = 'VALIDATED' then
    raise exception 'Este Perfil de Prioridades ja foi validado pelo paciente e nao pode mais ser alterado.';
  end if;
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "curadoria"."protect_validated_priority_profile"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."relationship_events" (
    "id" bigint NOT NULL,
    "relationship_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "relationship_events_temporal_order" CHECK (("recorded_at" >= "occurred_at")),
    CONSTRAINT "relationship_events_type_check" CHECK (("event_type" = ANY (ARRAY['RELACIONAMENTO_INICIADO'::"text", 'ENCERRAMENTO_PLANEJADO_DECLARADO'::"text", 'INTERRUPCAO_DECLARADA'::"text", 'REABERTURA_OBSERVADA'::"text"])))
);


ALTER TABLE "curadoria"."relationship_events" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."register_relationship_reopening"("p_relationship_id" "uuid", "p_new_case_id" "uuid", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) RETURNS "curadoria"."relationship_events"
    LANGUAGE "plpgsql"
    AS $$
declare v_relationship curadoria.relationship_records; v_event curadoria.relationship_events; v_final_payload jsonb;
begin
  select * into v_relationship from curadoria.relationship_records where id = p_relationship_id;
  if not found then raise exception 'relationship_events: relationship_id % não encontrado', p_relationship_id using errcode = '23503'; end if;
  if v_relationship.status <> 'ENCERRADO' then raise exception 'relationship_events: reabertura só pode ser registrada contra um Relationship terminal (atual: %)', v_relationship.status using errcode = '23514'; end if;
  if not exists (select 1 from curadoria.cases where id = p_new_case_id) then raise exception 'relationship_events: novo Caso % não encontrado', p_new_case_id using errcode = '23503'; end if;
  v_final_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('newCaseId', p_new_case_id);
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, 'REABERTURA_OBSERVADA', p_actor_id, v_final_payload, p_occurred_at, p_recorded_at) returning * into v_event;
  return v_event;
end; $$;


ALTER FUNCTION "curadoria"."register_relationship_reopening"("p_relationship_id" "uuid", "p_new_case_id" "uuid", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "curadoria"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."track_patient_story_revision"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
begin
  if tg_op = 'UPDATE' and old.status = 'enviada' and new.data is distinct from old.data then
    raise exception 'Esta história já foi enviada e não pode mais ser editada.';
  end if;
  if tg_op = 'INSERT' then new.revision := 1; else new.revision := old.revision + 1; end if;
  new.updated_at := now();
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status <> 'enviada') then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."track_patient_story_revision"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "curadoria"."track_patient_story_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'curadoria'
    AS $$
begin
  if tg_op = 'INSERT' or new.current_step is distinct from old.current_step or new.status is distinct from old.status then
    insert into curadoria.patient_story_versions (story_id, revision, data, current_step, status, created_by)
    values (new.id, new.revision, new.data, new.current_step, new.status, new.profile_id);
  end if;
  return new;
end; $$;


ALTER FUNCTION "curadoria"."track_patient_story_version"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."ace_artifacts" (
    "id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "execution_id" "uuid" NOT NULL,
    "artifact_type" "text" NOT NULL,
    "version" integer NOT NULL,
    "protocol_id" "text" NOT NULL,
    "protocol_version" "text" NOT NULL,
    "method_version" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "supersedes" "uuid",
    "validation_status" "text" DEFAULT 'valid'::"text" NOT NULL,
    CONSTRAINT "ace_artifacts_artifact_type_check" CHECK (("artifact_type" = ANY (ARRAY['Narrative'::"text", 'DecisionCase'::"text", 'CaseAudit'::"text", 'DecisionContext'::"text", 'CompetencyProfile'::"text", 'EligibleProviderSet'::"text", 'CompatibilityMatrix'::"text", 'Shortlist'::"text"]))),
    CONSTRAINT "ace_artifacts_protocol_id_check" CHECK (("protocol_id" = ANY (ARRAY['P001'::"text", 'P002'::"text", 'P003'::"text", 'P004'::"text", 'P005'::"text", 'P006'::"text", 'P007'::"text", 'P008'::"text", 'P009'::"text", 'P010'::"text"]))),
    CONSTRAINT "ace_artifacts_validation_status_check" CHECK (("validation_status" = ANY (ARRAY['valid'::"text", 'blocked'::"text"])))
);


ALTER TABLE "curadoria"."ace_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."ace_execution_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "protocol_id" "text",
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ace_execution_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['STARTED'::"text", 'RESUMED'::"text", 'PROTOCOL_STARTED'::"text", 'PROTOCOL_COMPLETED'::"text", 'ARTIFACT_REUSED'::"text", 'BLOCKED'::"text", 'FAILED'::"text", 'COMPLETED'::"text"]))),
    CONSTRAINT "ace_execution_events_protocol_id_check" CHECK (("protocol_id" = ANY (ARRAY['P001'::"text", 'P002'::"text", 'P003'::"text", 'P004'::"text", 'P005'::"text", 'P006'::"text", 'P007'::"text", 'P008'::"text", 'P009'::"text", 'P010'::"text"])))
);


ALTER TABLE "curadoria"."ace_execution_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."ace_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "started_by" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "curadoria"."ace_execution_status" DEFAULT 'PENDING'::"curadoria"."ace_execution_status" NOT NULL,
    "current_protocol" "text",
    "method_version" "text" NOT NULL,
    "failure_code" "text",
    "failure_message" "text",
    "retry_of" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ace_executions_current_protocol_check" CHECK (("current_protocol" = ANY (ARRAY['P001'::"text", 'P002'::"text", 'P003'::"text", 'P004'::"text", 'P005'::"text", 'P006'::"text", 'P007'::"text", 'P008'::"text", 'P009'::"text", 'P010'::"text"])))
);


ALTER TABLE "curadoria"."ace_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."audit_logs" (
    "id" bigint NOT NULL,
    "actor_id" "uuid",
    "action" "curadoria"."audit_action" NOT NULL,
    "target_profile_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."audit_logs" OWNER TO "postgres";


ALTER TABLE "curadoria"."audit_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."case_clinical_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "diagnosis" "text",
    "hypothesis" "text",
    "exams" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "treatments" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clinical_context" "text",
    "limitations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."case_clinical_context" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."case_clinical_context" IS 'Estruturacao do Caso. diagnosis e hypothesis registram fato relatado - a Aliviar nunca diagnostica nem interpreta exame.';



CREATE TABLE IF NOT EXISTS "curadoria"."case_events" (
    "id" bigint NOT NULL,
    "case_id" "uuid" NOT NULL,
    "event_type" "curadoria"."case_event_type" NOT NULL,
    "actor_id" "uuid",
    "from_value" "text",
    "to_value" "text",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."case_events" OWNER TO "postgres";


ALTER TABLE "curadoria"."case_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."case_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."case_notes" (
    "id" bigint NOT NULL,
    "case_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "case_notes_body_not_blank" CHECK (("btrim"("body") <> ''::"text"))
);


ALTER TABLE "curadoria"."case_notes" OWNER TO "postgres";


ALTER TABLE "curadoria"."case_notes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."case_notes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_profile_id" "uuid" NOT NULL,
    "source_story_id" "uuid" NOT NULL,
    "status" "curadoria"."case_status" DEFAULT 'NEW'::"curadoria"."case_status" NOT NULL,
    "current_stage" "text",
    "assigned_curator_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "method_version" "text"
);


ALTER TABLE "curadoria"."cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."compatibility_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "priority_profile_id" "uuid" NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "internal_score" numeric(5,2) NOT NULL,
    "band" "text" NOT NULL,
    "criteria_without_data" integer DEFAULT 0 NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "compatibility_analyses_band_check" CHECK (("band" = ANY (ARRAY['MUITO_ALTA'::"text", 'ALTA'::"text", 'BOA'::"text", 'MODERADA'::"text"]))),
    CONSTRAINT "compatibility_analyses_internal_score_check" CHECK ((("internal_score" >= (0)::numeric) AND ("internal_score" <= (100)::numeric)))
);


ALTER TABLE "curadoria"."compatibility_analyses" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."compatibility_analyses" IS 'Analise de compatibilidade contra um Perfil validado. internal_score nunca tem policy de SELECT para o paciente.';



CREATE TABLE IF NOT EXISTS "curadoria"."compatibility_criterion_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "compatibility_analysis_id" "uuid" NOT NULL,
    "criterion" "text" NOT NULL,
    "weight" integer NOT NULL,
    "alignment" integer,
    "contribution" numeric(6,2) DEFAULT 0 NOT NULL,
    "explanation" "text" NOT NULL,
    CONSTRAINT "compatibility_criterion_results_alignment_check" CHECK ((("alignment" IS NULL) OR (("alignment" >= 0) AND ("alignment" <= 100)))),
    CONSTRAINT "criterion_explanation_not_blank" CHECK (("btrim"("explanation") <> ''::"text"))
);


ALTER TABLE "curadoria"."compatibility_criterion_results" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."compatibility_criterion_results" IS 'Distribuicao por criterio com explicacao humana. alignment null = ausencia de dado, nunca valor inventado.';



CREATE TABLE IF NOT EXISTS "curadoria"."connection_events" (
    "id" bigint NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "connection_events_temporal_order" CHECK (("recorded_at" >= "occurred_at")),
    CONSTRAINT "connection_events_type_check" CHECK (("event_type" = ANY (ARRAY['DECISAO_REGISTRADA'::"text", 'CORRECAO_ESCOLHA'::"text", 'CONTATO_INICIADO'::"text", 'PRIMEIRO_ATENDIMENTO_REALIZADO'::"text", 'ENCERRADO_SEM_RELACIONAMENTO'::"text"])))
);


ALTER TABLE "curadoria"."connection_events" OWNER TO "postgres";


ALTER TABLE "curadoria"."connection_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."connection_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."consultation_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "curator_id" "uuid" NOT NULL,
    "context_reviewed" boolean DEFAULT false NOT NULL,
    "documents_reviewed" boolean DEFAULT false NOT NULL,
    "meeting_scheduled_at" timestamp with time zone,
    "known_facts" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "open_pendencies" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "narrative" "text",
    "motivation" "text",
    "understanding_confirmed_at" timestamp with time zone,
    "registered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."consultation_records" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."consultation_records" IS 'Consulta Inicial - Acolhimento e Historia. understanding_confirmed_at registra o momento de reconhecimento; sem ele a etapa nao cumpriu seu proposito.';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "case_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'agendado'::"text" NOT NULL,
    "assigned_to" "uuid" NOT NULL,
    "location_or_link" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_appointments_status_check" CHECK (("status" = ANY (ARRAY['agendado'::"text", 'confirmado'::"text", 'concluido'::"text", 'cancelado'::"text", 'nao_compareceu'::"text"]))),
    CONSTRAINT "crm_appointments_title_not_blank" CHECK (("btrim"("title") <> ''::"text"))
);


ALTER TABLE "curadoria"."crm_appointments" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_appointments" IS 'Agenda operacional — não é prontuário nem agenda médica complexa.';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "previous_values" "jsonb",
    "new_values" "jsonb",
    "context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."crm_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_audit_log" IS 'Trilha de auditoria do CRM — somente leitura administrativa.';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "status" "text" DEFAULT 'aberto'::"text" NOT NULL,
    "pipeline_stage" "text" DEFAULT 'new_contact'::"text" NOT NULL,
    "responsible_concierge_id" "uuid",
    "responsible_curator_id" "uuid",
    "priority" "text" DEFAULT 'media'::"text" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_cases_priority_check" CHECK (("priority" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'urgente'::"text"]))),
    CONSTRAINT "crm_cases_status_check" CHECK (("status" = ANY (ARRAY['aberto'::"text", 'fechado'::"text", 'arquivado'::"text"]))),
    CONSTRAINT "crm_cases_title_not_blank" CHECK (("btrim"("title") <> ''::"text"))
);


ALTER TABLE "curadoria"."crm_cases" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_cases" IS 'Casos operacionais vinculados a contatos — distintos dos casos clínicos de curadoria.';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "preferred_name" "text",
    "phone" "text",
    "phone_normalized" "text",
    "email" "text",
    "email_normalized" "text",
    "city" "text",
    "state" "text",
    "source" "text" NOT NULL,
    "source_detail" "text",
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "pipeline_stage" "text" DEFAULT 'new_contact'::"text" NOT NULL,
    "assigned_to" "uuid",
    "priority" "text" DEFAULT 'media'::"text" NOT NULL,
    "initial_reason" "text",
    "preferred_channel" "text",
    "consent_status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "consent_recorded_at" timestamp with time zone,
    "last_interaction_at" timestamp with time zone,
    "next_action_at" timestamp with time zone,
    "active_case_id" "uuid",
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_contacts_consent_status_check" CHECK (("consent_status" = ANY (ARRAY['pendente'::"text", 'concedido'::"text", 'negado'::"text", 'revogado'::"text"]))),
    CONSTRAINT "crm_contacts_full_name_not_blank" CHECK (("btrim"("full_name") <> ''::"text")),
    CONSTRAINT "crm_contacts_priority_check" CHECK (("priority" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'urgente'::"text"]))),
    CONSTRAINT "crm_contacts_state_format" CHECK ((("state" IS NULL) OR ("state" ~ '^[A-Z]{2}$'::"text"))),
    CONSTRAINT "crm_contacts_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'arquivado'::"text"])))
);


ALTER TABLE "curadoria"."crm_contacts" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_contacts" IS 'Contatos operacionais do CRM Aliviar — leads e pessoas em acompanhamento comercial.';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "case_id" "uuid",
    "type" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "external_reference" "text",
    "visibility" "text" DEFAULT 'operacional'::"text" NOT NULL,
    CONSTRAINT "crm_interactions_content_not_blank" CHECK (("btrim"("content") <> ''::"text")),
    CONSTRAINT "crm_interactions_direction_check" CHECK (("direction" = ANY (ARRAY['entrada'::"text", 'saida'::"text", 'interno'::"text"]))),
    CONSTRAINT "crm_interactions_visibility_check" CHECK (("visibility" = ANY (ARRAY['operacional'::"text", 'restrita'::"text", 'administrativa'::"text"])))
);


ALTER TABLE "curadoria"."crm_interactions" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_interactions" IS 'Histórico de interações operacionais (não clínicas).';



CREATE TABLE IF NOT EXISTS "curadoria"."crm_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "case_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "priority" "text" DEFAULT 'media'::"text" NOT NULL,
    "assigned_to" "uuid" NOT NULL,
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'urgente'::"text"]))),
    CONSTRAINT "crm_tasks_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_andamento'::"text", 'concluida'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "crm_tasks_title_not_blank" CHECK (("btrim"("title") <> ''::"text"))
);


ALTER TABLE "curadoria"."crm_tasks" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."crm_tasks" IS 'Tarefas e próximas ações do Concierge.';



CREATE TABLE IF NOT EXISTS "curadoria"."curadoria_report_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "justification" "text" NOT NULL,
    "relation_to_weights" "text" NOT NULL,
    "favorable_points" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "attention_points" "text"[] NOT NULL,
    "suggested_questions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "curator_observations" "text",
    CONSTRAINT "curadoria_report_options_position_check" CHECK ((("position" >= 1) AND ("position" <= 3))),
    CONSTRAINT "report_option_has_attention_point" CHECK (("array_length"("attention_points", 1) >= 1)),
    CONSTRAINT "report_option_justification_not_blank" CHECK (("btrim"("justification") <> ''::"text")),
    CONSTRAINT "report_option_relation_not_blank" CHECK (("btrim"("relation_to_weights") <> ''::"text"))
);


ALTER TABLE "curadoria"."curadoria_report_options" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."curadoria_report_options" IS 'Uma das tres opcoes do Relatorio. attention_points exige ao menos um item: opcao so com virtudes e recomendacao disfarcada.';



CREATE TABLE IF NOT EXISTS "curadoria"."curadoria_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "curated_selection_id" "uuid" NOT NULL,
    "composition_rationale" "text",
    "emitted_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "report_delivery_requires_emission" CHECK ((("delivered_at" IS NULL) OR ("emitted_at" IS NOT NULL)))
);


ALTER TABLE "curadoria"."curadoria_reports" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."curadoria_reports" IS 'Relatorio de Curadoria. Materializa e comunica a decisao humana ja registrada na selecao - nunca toma uma nova decisao.';



CREATE TABLE IF NOT EXISTS "curadoria"."curated_selection_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "curated_selection_id" "uuid" NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "band" "text" NOT NULL,
    "rationale" "text" NOT NULL,
    "trade_off" "text",
    CONSTRAINT "curated_selection_options_band_check" CHECK (("band" = ANY (ARRAY['MUITO_ALTA'::"text", 'ALTA'::"text", 'BOA'::"text", 'MODERADA'::"text"]))),
    CONSTRAINT "curated_selection_options_position_check" CHECK ((("position" >= 1) AND ("position" <= 3))),
    CONSTRAINT "option_rationale_not_blank" CHECK (("btrim"("rationale") <> ''::"text"))
);


ALTER TABLE "curadoria"."curated_selection_options" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."curated_selection_options" IS 'Uma das tres opcoes. position e ordem de apresentacao, nunca colocacao.';



CREATE TABLE IF NOT EXISTS "curadoria"."curated_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "priority_profile_id" "uuid" NOT NULL,
    "selected_by" "uuid" NOT NULL,
    "composition_rationale" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "curated_selections_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'DELIVERED'::"text"]))),
    CONSTRAINT "selection_delivery_coherent" CHECK ((("status" = 'DELIVERED'::"text") = ("delivered_at" IS NOT NULL))),
    CONSTRAINT "selection_rationale_not_blank" CHECK (("btrim"("composition_rationale") <> ''::"text"))
);


ALTER TABLE "curadoria"."curated_selections" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."curated_selections" IS 'As tres opcoes escolhidas pelo Curador. selected_by NOT NULL: toda selecao tem autoria humana nomeada.';



CREATE TABLE IF NOT EXISTS "curadoria"."devolutiva_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "report_id" "uuid" NOT NULL,
    "presented_by" "uuid" NOT NULL,
    "presented_at" timestamp with time zone,
    "patient_questions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "observations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "next_steps" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."devolutiva_records" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."devolutiva_records" IS 'A conversa de devolutiva. A entrega e sempre humana: presented_by e NOT NULL. A decisao do paciente vive em patient_curadoria_decisions, porque a autoria e dele.';



CREATE TABLE IF NOT EXISTS "curadoria"."final_curadoria_deliveries" (
    "id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "patient_profile_id" "uuid" NOT NULL,
    "human_review_result_id" "uuid" NOT NULL,
    "validated_by" "uuid" NOT NULL,
    "validated_at" timestamp with time zone NOT NULL,
    "delivered_by" "uuid" NOT NULL,
    "delivered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "generated_at" timestamp with time zone NOT NULL,
    "decision_summary" "text" NOT NULL,
    "client_context_summary" "text" NOT NULL,
    "provider_presentations" "jsonb" NOT NULL,
    "comparison_summary" "text" NOT NULL,
    "relevant_limitations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "relevant_missing_information" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "next_steps" "text"[] NOT NULL,
    "method_explanation" "text" NOT NULL,
    "disclaimer" "text" NOT NULL,
    "method_version" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."final_curadoria_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."human_review_results" (
    "id" "uuid" NOT NULL,
    "case_id" "uuid" NOT NULL,
    "execution_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewed_at" timestamp with time zone NOT NULL,
    "review_status" "text" NOT NULL,
    "review_action" "text" NOT NULL,
    "original_shortlist_artifact_id" "uuid" NOT NULL,
    "original_shortlist_artifact_version" integer NOT NULL,
    "compatibility_matrix_artifact_id" "uuid" NOT NULL,
    "compatibility_matrix_artifact_version" integer NOT NULL,
    "approved_provider_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "changes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "review_rationale" "text" NOT NULL,
    "evidence_references" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "return_to_protocol" "text",
    "method_version" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "human_review_results_return_to_protocol_check" CHECK (("return_to_protocol" = ANY (ARRAY['P001'::"text", 'P002'::"text", 'P003'::"text", 'P004'::"text", 'P005'::"text", 'P006'::"text", 'P007'::"text", 'P008'::"text", 'P009'::"text", 'P010'::"text"]))),
    CONSTRAINT "human_review_results_review_action_check" CHECK (("review_action" = ANY (ARRAY['APPROVE'::"text", 'ADJUST'::"text", 'REJECT'::"text", 'REQUEST_MORE_INFORMATION'::"text"]))),
    CONSTRAINT "human_review_results_review_status_check" CHECK (("review_status" = ANY (ARRAY['VALIDATED'::"text", 'REJECTED'::"text", 'INFORMATION_REQUESTED'::"text"])))
);


ALTER TABLE "curadoria"."human_review_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."p002_field_corrections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "decision_case_artifact_id" "uuid",
    "field" "text" NOT NULL,
    "estado" "text" NOT NULL,
    "motivo" "text" NOT NULL,
    "valor_anterior" "text",
    "corrigido_por" "uuid" NOT NULL,
    "corrigido_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL
);


ALTER TABLE "curadoria"."p002_field_corrections" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."p002_field_corrections" IS 'Correções humanas de classificação de completude P002 — append-only; a correção ativa mais recente por campo prevalece sobre inferência de IA.';



CREATE OR REPLACE VIEW "curadoria"."patient_case_overview" AS
 SELECT "id" AS "case_id",
    "patient_profile_id",
        CASE "status"
            WHEN 'NEW'::"curadoria"."case_status" THEN 'Recebemos sua história.'::"text"
            WHEN 'IN_REVIEW'::"curadoria"."case_status" THEN 'Nossa equipe está organizando as informações.'::"text"
            WHEN 'WAITING_FOR_INFORMATION'::"curadoria"."case_status" THEN 'Precisamos de uma informação adicional.'::"text"
            WHEN 'READY_FOR_CURATION'::"curadoria"."case_status" THEN 'Sua curadoria está sendo preparada.'::"text"
            WHEN 'IN_CURATION'::"curadoria"."case_status" THEN 'Sua curadoria está em andamento.'::"text"
            WHEN 'HUMAN_REVIEW'::"curadoria"."case_status" THEN 'Sua curadoria está em revisão final.'::"text"
            WHEN 'DELIVERED'::"curadoria"."case_status" THEN 'Sua Curadoria está pronta!'::"text"
            WHEN 'CLOSED'::"curadoria"."case_status" THEN 'Seu acompanhamento foi encerrado.'::"text"
            WHEN 'CANCELLED'::"curadoria"."case_status" THEN 'Não conseguimos avançar com esta curadoria no momento — nossa equipe vai entrar em contato.'::"text"
            ELSE NULL::"text"
        END AS "status_label",
    "updated_at"
   FROM "curadoria"."cases" "c"
  WHERE ("patient_profile_id" = "auth"."uid"());


ALTER VIEW "curadoria"."patient_case_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_curadoria_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "curated_selection_id" "uuid" NOT NULL,
    "chosen_option_id" "uuid",
    "outcome" "text" NOT NULL,
    "note" "text",
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decision_outcome_coherent" CHECK ((("outcome" = 'CHOSEN'::"text") = ("chosen_option_id" IS NOT NULL))),
    CONSTRAINT "patient_curadoria_decisions_outcome_check" CHECK (("outcome" = ANY (ARRAY['CHOSEN'::"text", 'NONE_OF_THEM'::"text"])))
);


ALTER TABLE "curadoria"."patient_curadoria_decisions" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."patient_curadoria_decisions" IS 'A escolha do paciente. NONE_OF_THEM e desfecho legitimo, nunca falha do paciente. Append-only.';



CREATE TABLE IF NOT EXISTS "curadoria"."patient_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "content_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_documents_file_name_not_blank" CHECK (("btrim"("file_name") <> ''::"text"))
);


ALTER TABLE "curadoria"."patient_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    CONSTRAINT "patient_notifications_body_not_blank" CHECK (("btrim"("body") <> ''::"text")),
    CONSTRAINT "patient_notifications_title_not_blank" CHECK (("btrim"("title") <> ''::"text"))
);


ALTER TABLE "curadoria"."patient_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_profiles" (
    "profile_id" "uuid" NOT NULL,
    "phone" "text",
    "city" "text",
    "state" "text",
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_profiles_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'inativo'::"text"]))),
    CONSTRAINT "patient_state_uf_format" CHECK ((("state" IS NULL) OR ("state" ~ '^[A-Z]{2}$'::"text")))
);


ALTER TABLE "curadoria"."patient_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'rascunho'::"text" NOT NULL,
    "current_step" "text" DEFAULT 'para-quem'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "patient_stories_status_check" CHECK (("status" = ANY (ARRAY['rascunho'::"text", 'enviada'::"text"])))
);


ALTER TABLE "curadoria"."patient_stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_story_attachments" (
    "story_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."patient_story_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."patient_story_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "revision" integer NOT NULL,
    "data" "jsonb" NOT NULL,
    "current_step" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "curadoria"."patient_story_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."priority_profile_filters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "priority_profile_id" "uuid" NOT NULL,
    "nature" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "value" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "priority_filter_value_not_blank" CHECK (("btrim"("value") <> ''::"text")),
    CONSTRAINT "priority_profile_filters_nature_check" CHECK (("nature" = ANY (ARRAY['FILTRO_OBRIGATORIO'::"text", 'PREFERENCIA'::"text"])))
);


ALTER TABLE "curadoria"."priority_profile_filters" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."priority_profile_filters" IS 'Filtros obrigatorios (eliminatorios) e Preferencias. Restricao elimina e nunca recebe peso.';



CREATE TABLE IF NOT EXISTS "curadoria"."priority_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "case_id" "uuid" NOT NULL,
    "curator_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "patient_history" "text",
    "validated_at" timestamp with time zone,
    "validation_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "priority_profile_validation_coherent" CHECK ((("status" = 'VALIDATED'::"text") = ("validated_at" IS NOT NULL))),
    CONSTRAINT "priority_profiles_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'VALIDATED'::"text", 'SUPERSEDED'::"text"])))
);


ALTER TABLE "curadoria"."priority_profiles" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."priority_profiles" IS 'Perfil de Prioridades - primeiro patrimonio construido em conjunto entre paciente e Curador.';



CREATE TABLE IF NOT EXISTS "curadoria"."priority_weights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "priority_profile_id" "uuid" NOT NULL,
    "criterion" "text" NOT NULL,
    "weight" integer NOT NULL,
    "target_value" "text",
    "evidence" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "priority_weight_evidence_not_blank" CHECK (("btrim"("evidence") <> ''::"text")),
    CONSTRAINT "priority_weights_weight_check" CHECK ((("weight" >= 0) AND ("weight" <= 100)))
);


ALTER TABLE "curadoria"."priority_weights" OWNER TO "postgres";


COMMENT ON TABLE "curadoria"."priority_weights" IS 'Distribuicao de 100 pontos. Peso e importancia atribuida pelo paciente, nunca qualidade de medico.';



COMMENT ON COLUMN "curadoria"."priority_weights"."evidence" IS 'Evidencia de Curadoria - obrigatoria. Um peso sem evidencia e estruturalmente impossivel.';



CREATE TABLE IF NOT EXISTS "curadoria"."professional_competency_areas" (
    "professional_profile_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "focus" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "professional_competency_areas_domain_check" CHECK (("domain" = ANY (ARRAY['saude_emocional_mental'::"text", 'saude_fisica'::"text", 'nao_determinado'::"text"]))),
    CONSTRAINT "professional_competency_areas_focus_check" CHECK (("focus" = ANY (ARRAY['avaliacao'::"text", 'intervencao'::"text", 'acompanhamento_continuo'::"text", 'esclarecimento'::"text"])))
);


ALTER TABLE "curadoria"."professional_competency_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."professional_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_profile_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "content_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "professional_documents_file_name_not_blank" CHECK (("btrim"("file_name") <> ''::"text"))
);


ALTER TABLE "curadoria"."professional_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."professional_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "publication_status" "text" DEFAULT 'nao_publicado'::"text" NOT NULL,
    "display_name" "text" NOT NULL,
    "professional_identifier" "text" NOT NULL,
    "crm" "text",
    "crm_uf" "text",
    "professional_summary" "text",
    "institution_name" "text",
    "experience_level" "text",
    "intake_approach" "text",
    "offers_continuous_care" boolean,
    "availability_window" "text",
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "practical_considerations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "professional_crm_uf_format" CHECK ((("crm_uf" IS NULL) OR ("crm_uf" ~ '^[A-Z]{2}$'::"text"))),
    CONSTRAINT "professional_display_name_not_blank" CHECK (("btrim"("display_name") <> ''::"text")),
    CONSTRAINT "professional_identifier_not_blank" CHECK (("btrim"("professional_identifier") <> ''::"text")),
    CONSTRAINT "professional_profiles_availability_window_check" CHECK (("availability_window" = ANY (ARRAY['flexible'::"text", 'limited'::"text", 'unavailable_soon'::"text"]))),
    CONSTRAINT "professional_profiles_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['geral'::"text", 'experiente'::"text", 'altamente_experiente'::"text"]))),
    CONSTRAINT "professional_profiles_intake_approach_check" CHECK (("intake_approach" = ANY (ARRAY['conexao_direta'::"text", 'aprofundamento_previo'::"text", 'avaliacao_inicial'::"text", 'ambos'::"text"]))),
    CONSTRAINT "professional_profiles_publication_status_check" CHECK (("publication_status" = ANY (ARRAY['publicado'::"text", 'nao_publicado'::"text"]))),
    CONSTRAINT "professional_profiles_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'inativo'::"text"])))
);


ALTER TABLE "curadoria"."professional_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "display_name_not_blank" CHECK ((("display_name" IS NULL) OR ("btrim"("display_name") <> ''::"text")))
);


ALTER TABLE "curadoria"."profiles" OWNER TO "postgres";


ALTER TABLE "curadoria"."relationship_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."relationship_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."roles" (
    "id" smallint NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."roles" OWNER TO "postgres";


ALTER TABLE "curadoria"."roles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "curadoria"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "curadoria"."user_roles" (
    "profile_id" "uuid" NOT NULL,
    "role_id" smallint NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "granted_by" "uuid"
);


ALTER TABLE "curadoria"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "curadoria"."user_settings" (
    "profile_id" "uuid" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "curadoria"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "curadoria"."ace_artifacts"
    ADD CONSTRAINT "ace_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."ace_execution_events"
    ADD CONSTRAINT "ace_execution_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."ace_executions"
    ADD CONSTRAINT "ace_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."case_clinical_context"
    ADD CONSTRAINT "case_clinical_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."case_events"
    ADD CONSTRAINT "case_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."case_notes"
    ADD CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."cases"
    ADD CONSTRAINT "cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."compatibility_analyses"
    ADD CONSTRAINT "compatibility_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."compatibility_criterion_results"
    ADD CONSTRAINT "compatibility_criterion_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."connection_events"
    ADD CONSTRAINT "connection_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."connection_records"
    ADD CONSTRAINT "connection_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."consultation_records"
    ADD CONSTRAINT "consultation_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_appointments"
    ADD CONSTRAINT "crm_appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_audit_log"
    ADD CONSTRAINT "crm_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_cases"
    ADD CONSTRAINT "crm_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_interactions"
    ADD CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."curadoria_report_options"
    ADD CONSTRAINT "curadoria_report_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."curadoria_reports"
    ADD CONSTRAINT "curadoria_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."curated_selection_options"
    ADD CONSTRAINT "curated_selection_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."curated_selections"
    ADD CONSTRAINT "curated_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."devolutiva_records"
    ADD CONSTRAINT "devolutiva_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."p002_field_corrections"
    ADD CONSTRAINT "p002_field_corrections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."patient_curadoria_decisions"
    ADD CONSTRAINT "patient_curadoria_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."patient_documents"
    ADD CONSTRAINT "patient_documents_file_path_key" UNIQUE ("file_path");



ALTER TABLE ONLY "curadoria"."patient_documents"
    ADD CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."patient_notifications"
    ADD CONSTRAINT "patient_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."patient_profiles"
    ADD CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "curadoria"."patient_stories"
    ADD CONSTRAINT "patient_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."patient_story_attachments"
    ADD CONSTRAINT "patient_story_attachments_pkey" PRIMARY KEY ("story_id", "document_id");



ALTER TABLE ONLY "curadoria"."patient_story_versions"
    ADD CONSTRAINT "patient_story_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."priority_profile_filters"
    ADD CONSTRAINT "priority_profile_filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."priority_profiles"
    ADD CONSTRAINT "priority_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."priority_weights"
    ADD CONSTRAINT "priority_weights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."professional_competency_areas"
    ADD CONSTRAINT "professional_competency_areas_pkey" PRIMARY KEY ("professional_profile_id", "domain", "focus");



ALTER TABLE ONLY "curadoria"."professional_documents"
    ADD CONSTRAINT "professional_documents_file_path_key" UNIQUE ("file_path");



ALTER TABLE ONLY "curadoria"."professional_documents"
    ADD CONSTRAINT "professional_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."relationship_events"
    ADD CONSTRAINT "relationship_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."relationship_records"
    ADD CONSTRAINT "relationship_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "curadoria"."roles"
    ADD CONSTRAINT "roles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "curadoria"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("profile_id", "role_id");



ALTER TABLE ONLY "curadoria"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("profile_id");



CREATE INDEX "ace_artifacts_case_id_idx" ON "curadoria"."ace_artifacts" USING "btree" ("case_id", "created_at");



CREATE INDEX "ace_artifacts_execution_id_idx" ON "curadoria"."ace_artifacts" USING "btree" ("execution_id");



CREATE INDEX "ace_execution_events_case_id_idx" ON "curadoria"."ace_execution_events" USING "btree" ("case_id", "created_at");



CREATE INDEX "ace_execution_events_execution_id_idx" ON "curadoria"."ace_execution_events" USING "btree" ("execution_id", "created_at");



CREATE INDEX "ace_executions_case_id_idx" ON "curadoria"."ace_executions" USING "btree" ("case_id", "created_at" DESC);



CREATE UNIQUE INDEX "ace_executions_one_running_per_case_idx" ON "curadoria"."ace_executions" USING "btree" ("case_id") WHERE ("status" = 'RUNNING'::"curadoria"."ace_execution_status");



CREATE INDEX "audit_logs_actor_id_idx" ON "curadoria"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "audit_logs_created_at_idx" ON "curadoria"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "audit_logs_target_profile_id_idx" ON "curadoria"."audit_logs" USING "btree" ("target_profile_id");



CREATE UNIQUE INDEX "case_clinical_context_one_per_case" ON "curadoria"."case_clinical_context" USING "btree" ("case_id");



CREATE INDEX "case_events_case_id_idx" ON "curadoria"."case_events" USING "btree" ("case_id", "created_at");



CREATE INDEX "case_notes_case_id_idx" ON "curadoria"."case_notes" USING "btree" ("case_id", "created_at");



CREATE INDEX "cases_assigned_curator_id_idx" ON "curadoria"."cases" USING "btree" ("assigned_curator_id");



CREATE UNIQUE INDEX "cases_one_active_per_story_idx" ON "curadoria"."cases" USING "btree" ("source_story_id") WHERE ("status" <> ALL (ARRAY['CLOSED'::"curadoria"."case_status", 'CANCELLED'::"curadoria"."case_status"]));



CREATE INDEX "cases_patient_profile_id_idx" ON "curadoria"."cases" USING "btree" ("patient_profile_id");



CREATE INDEX "cases_status_idx" ON "curadoria"."cases" USING "btree" ("status");



CREATE INDEX "cases_updated_at_idx" ON "curadoria"."cases" USING "btree" ("updated_at" DESC);



CREATE INDEX "compatibility_analyses_case_idx" ON "curadoria"."compatibility_analyses" USING "btree" ("case_id");



CREATE UNIQUE INDEX "compatibility_analyses_one_per_provider" ON "curadoria"."compatibility_analyses" USING "btree" ("priority_profile_id", "professional_profile_id");



CREATE UNIQUE INDEX "compatibility_criterion_results_one_per_criterion" ON "curadoria"."compatibility_criterion_results" USING "btree" ("compatibility_analysis_id", "criterion");



CREATE INDEX "connection_events_connection_id_idx" ON "curadoria"."connection_events" USING "btree" ("connection_id", "occurred_at");



CREATE UNIQUE INDEX "connection_records_case_id_key" ON "curadoria"."connection_records" USING "btree" ("case_id");



CREATE INDEX "connection_records_patient_profile_id_idx" ON "curadoria"."connection_records" USING "btree" ("patient_profile_id");



CREATE UNIQUE INDEX "consultation_records_one_per_case" ON "curadoria"."consultation_records" USING "btree" ("case_id");



CREATE INDEX "crm_appointments_assigned_start_idx" ON "curadoria"."crm_appointments" USING "btree" ("assigned_to", "start_at");



CREATE INDEX "crm_appointments_contact_id_idx" ON "curadoria"."crm_appointments" USING "btree" ("contact_id");



CREATE INDEX "crm_appointments_start_at_idx" ON "curadoria"."crm_appointments" USING "btree" ("start_at");



CREATE INDEX "crm_audit_log_created_at_idx" ON "curadoria"."crm_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "crm_audit_log_entity_idx" ON "curadoria"."crm_audit_log" USING "btree" ("entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "crm_cases_contact_id_idx" ON "curadoria"."crm_cases" USING "btree" ("contact_id");



CREATE INDEX "crm_cases_pipeline_stage_idx" ON "curadoria"."crm_cases" USING "btree" ("pipeline_stage");



CREATE INDEX "crm_cases_responsible_concierge_idx" ON "curadoria"."crm_cases" USING "btree" ("responsible_concierge_id");



CREATE INDEX "crm_cases_responsible_curator_idx" ON "curadoria"."crm_cases" USING "btree" ("responsible_curator_id");



CREATE INDEX "crm_contacts_assigned_to_idx" ON "curadoria"."crm_contacts" USING "btree" ("assigned_to");



CREATE INDEX "crm_contacts_created_at_idx" ON "curadoria"."crm_contacts" USING "btree" ("created_at" DESC);



CREATE INDEX "crm_contacts_email_normalized_idx" ON "curadoria"."crm_contacts" USING "btree" ("email_normalized") WHERE ("email_normalized" IS NOT NULL);



CREATE INDEX "crm_contacts_next_action_at_idx" ON "curadoria"."crm_contacts" USING "btree" ("next_action_at");



CREATE INDEX "crm_contacts_phone_normalized_idx" ON "curadoria"."crm_contacts" USING "btree" ("phone_normalized") WHERE ("phone_normalized" IS NOT NULL);



CREATE INDEX "crm_contacts_pipeline_stage_idx" ON "curadoria"."crm_contacts" USING "btree" ("pipeline_stage");



CREATE INDEX "crm_contacts_status_idx" ON "curadoria"."crm_contacts" USING "btree" ("status");



CREATE INDEX "crm_interactions_case_id_idx" ON "curadoria"."crm_interactions" USING "btree" ("case_id");



CREATE INDEX "crm_interactions_contact_id_occurred_idx" ON "curadoria"."crm_interactions" USING "btree" ("contact_id", "occurred_at" DESC);



CREATE INDEX "crm_tasks_assigned_due_idx" ON "curadoria"."crm_tasks" USING "btree" ("assigned_to", "due_at");



CREATE INDEX "crm_tasks_contact_id_idx" ON "curadoria"."crm_tasks" USING "btree" ("contact_id");



CREATE INDEX "crm_tasks_status_idx" ON "curadoria"."crm_tasks" USING "btree" ("status");



CREATE UNIQUE INDEX "curadoria_report_options_unique_position" ON "curadoria"."curadoria_report_options" USING "btree" ("report_id", "position");



CREATE UNIQUE INDEX "curadoria_report_options_unique_provider" ON "curadoria"."curadoria_report_options" USING "btree" ("report_id", "professional_profile_id");



CREATE UNIQUE INDEX "curadoria_reports_one_per_selection" ON "curadoria"."curadoria_reports" USING "btree" ("curated_selection_id");



CREATE UNIQUE INDEX "curated_selection_options_unique_position" ON "curadoria"."curated_selection_options" USING "btree" ("curated_selection_id", "position");



CREATE UNIQUE INDEX "curated_selection_options_unique_provider" ON "curadoria"."curated_selection_options" USING "btree" ("curated_selection_id", "professional_profile_id");



CREATE UNIQUE INDEX "curated_selections_one_active_per_profile" ON "curadoria"."curated_selections" USING "btree" ("priority_profile_id");



CREATE UNIQUE INDEX "devolutiva_records_one_per_report" ON "curadoria"."devolutiva_records" USING "btree" ("report_id");



CREATE UNIQUE INDEX "final_curadoria_deliveries_case_id_key" ON "curadoria"."final_curadoria_deliveries" USING "btree" ("case_id");



CREATE INDEX "final_curadoria_deliveries_patient_profile_id_idx" ON "curadoria"."final_curadoria_deliveries" USING "btree" ("patient_profile_id");



CREATE INDEX "human_review_results_case_id_idx" ON "curadoria"."human_review_results" USING "btree" ("case_id", "created_at" DESC);



CREATE INDEX "human_review_results_execution_id_idx" ON "curadoria"."human_review_results" USING "btree" ("execution_id");



CREATE UNIQUE INDEX "human_review_results_one_validated_per_case_idx" ON "curadoria"."human_review_results" USING "btree" ("case_id") WHERE ("review_status" = 'VALIDATED'::"text");



CREATE INDEX "p002_field_corrections_case_id_idx" ON "curadoria"."p002_field_corrections" USING "btree" ("case_id", "field", "corrigido_em" DESC);



CREATE UNIQUE INDEX "patient_curadoria_decisions_one_per_selection" ON "curadoria"."patient_curadoria_decisions" USING "btree" ("curated_selection_id");



CREATE INDEX "patient_documents_profile_id_idx" ON "curadoria"."patient_documents" USING "btree" ("profile_id");



CREATE INDEX "patient_notifications_created_at_idx" ON "curadoria"."patient_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "patient_notifications_profile_id_idx" ON "curadoria"."patient_notifications" USING "btree" ("profile_id");



CREATE INDEX "patient_stories_profile_id_idx" ON "curadoria"."patient_stories" USING "btree" ("profile_id");



CREATE INDEX "patient_stories_profile_id_status_idx" ON "curadoria"."patient_stories" USING "btree" ("profile_id", "status");



CREATE INDEX "patient_story_attachments_document_id_idx" ON "curadoria"."patient_story_attachments" USING "btree" ("document_id");



CREATE INDEX "patient_story_versions_story_id_idx" ON "curadoria"."patient_story_versions" USING "btree" ("story_id", "revision");



CREATE INDEX "priority_profile_filters_profile_idx" ON "curadoria"."priority_profile_filters" USING "btree" ("priority_profile_id");



CREATE INDEX "priority_profiles_case_idx" ON "curadoria"."priority_profiles" USING "btree" ("case_id");



CREATE UNIQUE INDEX "priority_profiles_one_active_per_case" ON "curadoria"."priority_profiles" USING "btree" ("case_id") WHERE ("status" <> 'SUPERSEDED'::"text");



CREATE UNIQUE INDEX "priority_weights_one_per_criterion" ON "curadoria"."priority_weights" USING "btree" ("priority_profile_id", "criterion");



CREATE INDEX "professional_competency_areas_domain_idx" ON "curadoria"."professional_competency_areas" USING "btree" ("domain");



CREATE INDEX "professional_documents_professional_profile_id_idx" ON "curadoria"."professional_documents" USING "btree" ("professional_profile_id");



CREATE UNIQUE INDEX "professional_profiles_profile_id_key" ON "curadoria"."professional_profiles" USING "btree" ("profile_id") WHERE ("profile_id" IS NOT NULL);



CREATE INDEX "professional_profiles_publication_status_idx" ON "curadoria"."professional_profiles" USING "btree" ("publication_status");



CREATE INDEX "professional_profiles_status_idx" ON "curadoria"."professional_profiles" USING "btree" ("status");



CREATE INDEX "profiles_deleted_at_idx" ON "curadoria"."profiles" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "relationship_events_relationship_id_idx" ON "curadoria"."relationship_events" USING "btree" ("relationship_id", "occurred_at");



CREATE INDEX "relationship_records_case_id_idx" ON "curadoria"."relationship_records" USING "btree" ("case_id");



CREATE UNIQUE INDEX "relationship_records_connection_id_key" ON "curadoria"."relationship_records" USING "btree" ("connection_id");



CREATE INDEX "relationship_records_patient_profile_id_idx" ON "curadoria"."relationship_records" USING "btree" ("patient_profile_id");



CREATE INDEX "user_roles_role_id_idx" ON "curadoria"."user_roles" USING "btree" ("role_id");



CREATE OR REPLACE TRIGGER "connection_records_assert_professional_in_delivery" BEFORE INSERT OR UPDATE OF "professional_profile_id" ON "curadoria"."connection_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."assert_connection_professional_in_delivery"();



CREATE OR REPLACE TRIGGER "connection_records_assert_valid_transition" BEFORE UPDATE ON "curadoria"."connection_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."assert_connection_valid_transition"();



CREATE OR REPLACE TRIGGER "enforce_case_status_transition_trigger" BEFORE UPDATE ON "curadoria"."cases" FOR EACH ROW EXECUTE FUNCTION "curadoria"."enforce_case_status_transition"();



CREATE OR REPLACE TRIGGER "enforce_priority_profile_validation_trigger" BEFORE UPDATE ON "curadoria"."priority_profiles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."enforce_priority_profile_validation"();



CREATE OR REPLACE TRIGGER "enforce_report_has_three_trigger" BEFORE UPDATE ON "curadoria"."curadoria_reports" FOR EACH ROW EXECUTE FUNCTION "curadoria"."enforce_report_has_three"();



CREATE OR REPLACE TRIGGER "enforce_selection_has_three_trigger" BEFORE UPDATE ON "curadoria"."curated_selections" FOR EACH ROW EXECUTE FUNCTION "curadoria"."enforce_selection_has_three"();



CREATE OR REPLACE TRIGGER "log_user_roles_delete" AFTER DELETE ON "curadoria"."user_roles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."log_user_role_change"();



CREATE OR REPLACE TRIGGER "log_user_roles_insert" AFTER INSERT ON "curadoria"."user_roles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."log_user_role_change"();



CREATE OR REPLACE TRIGGER "notify_patient_welcome_on_role_grant" AFTER INSERT ON "curadoria"."user_roles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."notify_patient_welcome"();



CREATE OR REPLACE TRIGGER "protect_delivered_report_options" BEFORE INSERT OR DELETE OR UPDATE ON "curadoria"."curadoria_report_options" FOR EACH ROW EXECUTE FUNCTION "curadoria"."protect_delivered_report"();



CREATE OR REPLACE TRIGGER "protect_patient_notification_content_trigger" BEFORE UPDATE ON "curadoria"."patient_notifications" FOR EACH ROW EXECUTE FUNCTION "curadoria"."protect_patient_notification_content"();



CREATE OR REPLACE TRIGGER "protect_validated_priority_filters" BEFORE INSERT OR DELETE OR UPDATE ON "curadoria"."priority_profile_filters" FOR EACH ROW EXECUTE FUNCTION "curadoria"."protect_validated_priority_profile"();



CREATE OR REPLACE TRIGGER "protect_validated_priority_weights" BEFORE INSERT OR DELETE OR UPDATE ON "curadoria"."priority_weights" FOR EACH ROW EXECUTE FUNCTION "curadoria"."protect_validated_priority_profile"();



CREATE OR REPLACE TRIGGER "relationship_records_assert_immutable_fields" BEFORE UPDATE ON "curadoria"."relationship_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."assert_relationship_immutable_fields"();



CREATE OR REPLACE TRIGGER "relationship_records_assert_matches_connection" BEFORE INSERT ON "curadoria"."relationship_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."assert_relationship_matches_connection"();



CREATE OR REPLACE TRIGGER "relationship_records_assert_valid_transition" BEFORE UPDATE ON "curadoria"."relationship_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."assert_relationship_valid_transition"();



CREATE OR REPLACE TRIGGER "set_ace_executions_updated_at" BEFORE UPDATE ON "curadoria"."ace_executions" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_case_clinical_context_updated_at" BEFORE UPDATE ON "curadoria"."case_clinical_context" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_cases_updated_at" BEFORE UPDATE ON "curadoria"."cases" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_consultation_records_updated_at" BEFORE UPDATE ON "curadoria"."consultation_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_crm_appointments_updated_at" BEFORE UPDATE ON "curadoria"."crm_appointments" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_crm_cases_updated_at" BEFORE UPDATE ON "curadoria"."crm_cases" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_crm_contacts_updated_at" BEFORE UPDATE ON "curadoria"."crm_contacts" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_crm_tasks_updated_at" BEFORE UPDATE ON "curadoria"."crm_tasks" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_curadoria_reports_updated_at" BEFORE UPDATE ON "curadoria"."curadoria_reports" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_curated_selections_updated_at" BEFORE UPDATE ON "curadoria"."curated_selections" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_devolutiva_records_updated_at" BEFORE UPDATE ON "curadoria"."devolutiva_records" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_patient_profiles_updated_at" BEFORE UPDATE ON "curadoria"."patient_profiles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_priority_profiles_updated_at" BEFORE UPDATE ON "curadoria"."priority_profiles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_professional_profiles_updated_at" BEFORE UPDATE ON "curadoria"."professional_profiles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "curadoria"."profiles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_roles_updated_at" BEFORE UPDATE ON "curadoria"."roles" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_settings_updated_at" BEFORE UPDATE ON "curadoria"."user_settings" FOR EACH ROW EXECUTE FUNCTION "curadoria"."set_updated_at"();



CREATE OR REPLACE TRIGGER "track_patient_story_revision_trigger" BEFORE INSERT OR UPDATE ON "curadoria"."patient_stories" FOR EACH ROW EXECUTE FUNCTION "curadoria"."track_patient_story_revision"();



CREATE OR REPLACE TRIGGER "track_patient_story_version_trigger" AFTER INSERT OR UPDATE ON "curadoria"."patient_stories" FOR EACH ROW EXECUTE FUNCTION "curadoria"."track_patient_story_version"();



ALTER TABLE ONLY "curadoria"."ace_artifacts"
    ADD CONSTRAINT "ace_artifacts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."ace_artifacts"
    ADD CONSTRAINT "ace_artifacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."ace_artifacts"
    ADD CONSTRAINT "ace_artifacts_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "curadoria"."ace_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."ace_artifacts"
    ADD CONSTRAINT "ace_artifacts_supersedes_fkey" FOREIGN KEY ("supersedes") REFERENCES "curadoria"."ace_artifacts"("id");



ALTER TABLE ONLY "curadoria"."ace_execution_events"
    ADD CONSTRAINT "ace_execution_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."ace_execution_events"
    ADD CONSTRAINT "ace_execution_events_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "curadoria"."ace_executions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."ace_executions"
    ADD CONSTRAINT "ace_executions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."ace_executions"
    ADD CONSTRAINT "ace_executions_retry_of_fkey" FOREIGN KEY ("retry_of") REFERENCES "curadoria"."ace_executions"("id");



ALTER TABLE ONLY "curadoria"."ace_executions"
    ADD CONSTRAINT "ace_executions_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."audit_logs"
    ADD CONSTRAINT "audit_logs_target_profile_id_fkey" FOREIGN KEY ("target_profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."case_clinical_context"
    ADD CONSTRAINT "case_clinical_context_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."case_events"
    ADD CONSTRAINT "case_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."case_events"
    ADD CONSTRAINT "case_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."case_notes"
    ADD CONSTRAINT "case_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."case_notes"
    ADD CONSTRAINT "case_notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."cases"
    ADD CONSTRAINT "cases_assigned_curator_id_fkey" FOREIGN KEY ("assigned_curator_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."cases"
    ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."cases"
    ADD CONSTRAINT "cases_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."cases"
    ADD CONSTRAINT "cases_source_story_id_fkey" FOREIGN KEY ("source_story_id") REFERENCES "curadoria"."patient_stories"("id");



ALTER TABLE ONLY "curadoria"."compatibility_analyses"
    ADD CONSTRAINT "compatibility_analyses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."compatibility_analyses"
    ADD CONSTRAINT "compatibility_analyses_priority_profile_id_fkey" FOREIGN KEY ("priority_profile_id") REFERENCES "curadoria"."priority_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."compatibility_analyses"
    ADD CONSTRAINT "compatibility_analyses_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."compatibility_criterion_results"
    ADD CONSTRAINT "compatibility_criterion_results_compatibility_analysis_id_fkey" FOREIGN KEY ("compatibility_analysis_id") REFERENCES "curadoria"."compatibility_analyses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."connection_events"
    ADD CONSTRAINT "connection_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."connection_events"
    ADD CONSTRAINT "connection_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "curadoria"."connection_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."connection_records"
    ADD CONSTRAINT "connection_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."connection_records"
    ADD CONSTRAINT "connection_records_final_curadoria_delivery_id_fkey" FOREIGN KEY ("final_curadoria_delivery_id") REFERENCES "curadoria"."final_curadoria_deliveries"("id");



ALTER TABLE ONLY "curadoria"."connection_records"
    ADD CONSTRAINT "connection_records_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."connection_records"
    ADD CONSTRAINT "connection_records_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id");



ALTER TABLE ONLY "curadoria"."consultation_records"
    ADD CONSTRAINT "consultation_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."consultation_records"
    ADD CONSTRAINT "consultation_records_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."crm_appointments"
    ADD CONSTRAINT "crm_appointments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."crm_appointments"
    ADD CONSTRAINT "crm_appointments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."crm_cases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_appointments"
    ADD CONSTRAINT "crm_appointments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "curadoria"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."crm_appointments"
    ADD CONSTRAINT "crm_appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."crm_audit_log"
    ADD CONSTRAINT "crm_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_cases"
    ADD CONSTRAINT "crm_cases_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "curadoria"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."crm_cases"
    ADD CONSTRAINT "crm_cases_responsible_concierge_id_fkey" FOREIGN KEY ("responsible_concierge_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_cases"
    ADD CONSTRAINT "crm_cases_responsible_curator_id_fkey" FOREIGN KEY ("responsible_curator_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_active_case_fk" FOREIGN KEY ("active_case_id") REFERENCES "curadoria"."crm_cases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_interactions"
    ADD CONSTRAINT "crm_interactions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."crm_cases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_interactions"
    ADD CONSTRAINT "crm_interactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "curadoria"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."crm_interactions"
    ADD CONSTRAINT "crm_interactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."crm_cases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "curadoria"."crm_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."crm_tasks"
    ADD CONSTRAINT "crm_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."curadoria_report_options"
    ADD CONSTRAINT "curadoria_report_options_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id");



ALTER TABLE ONLY "curadoria"."curadoria_report_options"
    ADD CONSTRAINT "curadoria_report_options_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "curadoria"."curadoria_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curadoria_reports"
    ADD CONSTRAINT "curadoria_reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curadoria_reports"
    ADD CONSTRAINT "curadoria_reports_curated_selection_id_fkey" FOREIGN KEY ("curated_selection_id") REFERENCES "curadoria"."curated_selections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curated_selection_options"
    ADD CONSTRAINT "curated_selection_options_curated_selection_id_fkey" FOREIGN KEY ("curated_selection_id") REFERENCES "curadoria"."curated_selections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curated_selection_options"
    ADD CONSTRAINT "curated_selection_options_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id");



ALTER TABLE ONLY "curadoria"."curated_selections"
    ADD CONSTRAINT "curated_selections_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curated_selections"
    ADD CONSTRAINT "curated_selections_priority_profile_id_fkey" FOREIGN KEY ("priority_profile_id") REFERENCES "curadoria"."priority_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."curated_selections"
    ADD CONSTRAINT "curated_selections_selected_by_fkey" FOREIGN KEY ("selected_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."devolutiva_records"
    ADD CONSTRAINT "devolutiva_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."devolutiva_records"
    ADD CONSTRAINT "devolutiva_records_presented_by_fkey" FOREIGN KEY ("presented_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."devolutiva_records"
    ADD CONSTRAINT "devolutiva_records_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "curadoria"."curadoria_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_delivered_by_fkey" FOREIGN KEY ("delivered_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_human_review_result_id_fkey" FOREIGN KEY ("human_review_result_id") REFERENCES "curadoria"."human_review_results"("id");



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."final_curadoria_deliveries"
    ADD CONSTRAINT "final_curadoria_deliveries_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_compatibility_matrix_artifact_id_fkey" FOREIGN KEY ("compatibility_matrix_artifact_id") REFERENCES "curadoria"."ace_artifacts"("id");



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "curadoria"."ace_executions"("id");



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_original_shortlist_artifact_id_fkey" FOREIGN KEY ("original_shortlist_artifact_id") REFERENCES "curadoria"."ace_artifacts"("id");



ALTER TABLE ONLY "curadoria"."human_review_results"
    ADD CONSTRAINT "human_review_results_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."p002_field_corrections"
    ADD CONSTRAINT "p002_field_corrections_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."p002_field_corrections"
    ADD CONSTRAINT "p002_field_corrections_corrigido_por_fkey" FOREIGN KEY ("corrigido_por") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."patient_curadoria_decisions"
    ADD CONSTRAINT "patient_curadoria_decisions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_curadoria_decisions"
    ADD CONSTRAINT "patient_curadoria_decisions_chosen_option_id_fkey" FOREIGN KEY ("chosen_option_id") REFERENCES "curadoria"."curated_selection_options"("id");



ALTER TABLE ONLY "curadoria"."patient_curadoria_decisions"
    ADD CONSTRAINT "patient_curadoria_decisions_curated_selection_id_fkey" FOREIGN KEY ("curated_selection_id") REFERENCES "curadoria"."curated_selections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_documents"
    ADD CONSTRAINT "patient_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_documents"
    ADD CONSTRAINT "patient_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."patient_notifications"
    ADD CONSTRAINT "patient_notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_profiles"
    ADD CONSTRAINT "patient_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_stories"
    ADD CONSTRAINT "patient_stories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."patient_stories"
    ADD CONSTRAINT "patient_stories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_story_attachments"
    ADD CONSTRAINT "patient_story_attachments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "curadoria"."patient_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_story_attachments"
    ADD CONSTRAINT "patient_story_attachments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "curadoria"."patient_stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."patient_story_versions"
    ADD CONSTRAINT "patient_story_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."patient_story_versions"
    ADD CONSTRAINT "patient_story_versions_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "curadoria"."patient_stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."priority_profile_filters"
    ADD CONSTRAINT "priority_profile_filters_priority_profile_id_fkey" FOREIGN KEY ("priority_profile_id") REFERENCES "curadoria"."priority_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."priority_profiles"
    ADD CONSTRAINT "priority_profiles_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."priority_profiles"
    ADD CONSTRAINT "priority_profiles_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."priority_weights"
    ADD CONSTRAINT "priority_weights_priority_profile_id_fkey" FOREIGN KEY ("priority_profile_id") REFERENCES "curadoria"."priority_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."professional_competency_areas"
    ADD CONSTRAINT "professional_competency_areas_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."professional_documents"
    ADD CONSTRAINT "professional_documents_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."professional_documents"
    ADD CONSTRAINT "professional_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."relationship_events"
    ADD CONSTRAINT "relationship_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."relationship_events"
    ADD CONSTRAINT "relationship_events_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "curadoria"."relationship_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."relationship_records"
    ADD CONSTRAINT "relationship_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "curadoria"."cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."relationship_records"
    ADD CONSTRAINT "relationship_records_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "curadoria"."connection_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."relationship_records"
    ADD CONSTRAINT "relationship_records_patient_profile_id_fkey" FOREIGN KEY ("patient_profile_id") REFERENCES "curadoria"."profiles"("id");



ALTER TABLE ONLY "curadoria"."relationship_records"
    ADD CONSTRAINT "relationship_records_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "curadoria"."professional_profiles"("id");



ALTER TABLE ONLY "curadoria"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "curadoria"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "curadoria"."user_roles"
    ADD CONSTRAINT "user_roles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "curadoria"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "curadoria"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "curadoria"."user_settings"
    ADD CONSTRAINT "user_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "curadoria"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "curadoria"."ace_artifacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ace_artifacts_insert_admin_or_case_curator" ON "curadoria"."ace_artifacts" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_artifacts"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "ace_artifacts_select_admin_or_case_curator" ON "curadoria"."ace_artifacts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_artifacts"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."ace_execution_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ace_execution_events_insert_admin_or_case_curator" ON "curadoria"."ace_execution_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_execution_events"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "ace_execution_events_select_admin_or_case_curator" ON "curadoria"."ace_execution_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_execution_events"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."ace_executions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ace_executions_insert_admin_or_case_curator" ON "curadoria"."ace_executions" FOR INSERT TO "authenticated" WITH CHECK ((("started_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_executions"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "ace_executions_select_admin_or_case_curator" ON "curadoria"."ace_executions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_executions"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "ace_executions_update_admin_or_case_curator" ON "curadoria"."ace_executions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_executions"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "ace_executions"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_select_admin_only" ON "curadoria"."audit_logs" FOR SELECT TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text"));



ALTER TABLE "curadoria"."case_clinical_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "curadoria"."case_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "case_events_insert_admin_or_case_curator" ON "curadoria"."case_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "case_events"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "case_events_select_admin_or_case_curator" ON "curadoria"."case_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "case_events"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."case_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "case_notes_insert_admin_or_case_curator" ON "curadoria"."case_notes" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "case_notes"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "case_notes_select_admin_or_case_curator" ON "curadoria"."case_notes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "case_notes"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cases_insert_admin_or_curator" ON "curadoria"."cases" FOR INSERT TO "authenticated" WITH CHECK ((("curadoria"."has_role"('administrador'::"text") OR "curadoria"."has_role"('curador_medico'::"text")) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "cases_select_admin_or_assigned_curator" ON "curadoria"."cases" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_curator_id" = "auth"."uid"())));



CREATE POLICY "cases_update_admin_or_assigned_curator" ON "curadoria"."cases" FOR UPDATE TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_curator_id" = "auth"."uid"()))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("assigned_curator_id" = "auth"."uid"())));



CREATE POLICY "clinical_context_select_patient" ON "curadoria"."case_clinical_context" FOR SELECT TO "authenticated" USING ("curadoria"."is_patient_for_case"("case_id"));



CREATE POLICY "clinical_context_write_curator" ON "curadoria"."case_clinical_context" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."compatibility_analyses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compatibility_analyses_curator_only" ON "curadoria"."compatibility_analyses" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."compatibility_criterion_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compatibility_criterion_results_curator_only" ON "curadoria"."compatibility_criterion_results" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."compatibility_analyses" "a"
  WHERE (("a"."id" = "compatibility_criterion_results"."compatibility_analysis_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("a"."case_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."compatibility_analyses" "a"
  WHERE (("a"."id" = "compatibility_criterion_results"."compatibility_analysis_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("a"."case_id"))))));



ALTER TABLE "curadoria"."connection_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "connection_events_insert_own_patient" ON "curadoria"."connection_events" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."connection_records" "cr"
  WHERE (("cr"."id" = "connection_events"."connection_id") AND ("cr"."patient_profile_id" = "auth"."uid"()))))));



CREATE POLICY "connection_events_select_admin_or_case_curator" ON "curadoria"."connection_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("curadoria"."connection_records" "cr"
     JOIN "curadoria"."cases" "c" ON (("c"."id" = "cr"."case_id")))
  WHERE (("cr"."id" = "connection_events"."connection_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "connection_events_select_own_patient" ON "curadoria"."connection_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."connection_records" "cr"
  WHERE (("cr"."id" = "connection_events"."connection_id") AND ("cr"."patient_profile_id" = "auth"."uid"())))));



ALTER TABLE "curadoria"."connection_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "connection_records_insert_own_patient" ON "curadoria"."connection_records" FOR INSERT TO "authenticated" WITH CHECK ((("patient_profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."final_curadoria_deliveries" "d"
  WHERE (("d"."id" = "connection_records"."final_curadoria_delivery_id") AND ("d"."case_id" = "connection_records"."case_id") AND ("d"."patient_profile_id" = "auth"."uid"()))))));



CREATE POLICY "connection_records_select_admin_or_case_curator" ON "curadoria"."connection_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "connection_records"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "connection_records_select_own_patient" ON "curadoria"."connection_records" FOR SELECT TO "authenticated" USING (("patient_profile_id" = "auth"."uid"()));



CREATE POLICY "connection_records_update_own_patient" ON "curadoria"."connection_records" FOR UPDATE TO "authenticated" USING (("patient_profile_id" = "auth"."uid"())) WITH CHECK (("patient_profile_id" = "auth"."uid"()));



ALTER TABLE "curadoria"."consultation_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consultation_select_patient" ON "curadoria"."consultation_records" FOR SELECT TO "authenticated" USING ("curadoria"."is_patient_for_case"("case_id"));



CREATE POLICY "consultation_write_curator" ON "curadoria"."consultation_records" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."crm_appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_appointments_insert" ON "curadoria"."crm_appointments" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



CREATE POLICY "crm_appointments_select" ON "curadoria"."crm_appointments" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



CREATE POLICY "crm_appointments_update" ON "curadoria"."crm_appointments" FOR UPDATE TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id")))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



ALTER TABLE "curadoria"."crm_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_audit_log_select" ON "curadoria"."crm_audit_log" FOR SELECT TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text"));



ALTER TABLE "curadoria"."crm_cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_cases_insert" ON "curadoria"."crm_cases" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."has_role"('concierge'::"text")));



CREATE POLICY "crm_cases_select" ON "curadoria"."crm_cases" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("curadoria"."has_role"('concierge'::"text") AND (("responsible_concierge_id" IS NULL) OR ("responsible_concierge_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "curadoria"."crm_contacts" "c"
  WHERE (("c"."id" = "crm_cases"."contact_id") AND (("c"."assigned_to" IS NULL) OR ("c"."assigned_to" = "auth"."uid"()))))))) OR "curadoria"."is_curator_for_crm_case"("id")));



CREATE POLICY "crm_cases_update" ON "curadoria"."crm_cases" FOR UPDATE TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("curadoria"."has_role"('concierge'::"text") AND (("responsible_concierge_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "curadoria"."crm_contacts" "c"
  WHERE (("c"."id" = "crm_cases"."contact_id") AND (("c"."assigned_to" IS NULL) OR ("c"."assigned_to" = "auth"."uid"()))))))))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("curadoria"."has_role"('concierge'::"text") AND (("responsible_concierge_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "curadoria"."crm_contacts" "c"
  WHERE (("c"."id" = "crm_cases"."contact_id") AND (("c"."assigned_to" IS NULL) OR ("c"."assigned_to" = "auth"."uid"())))))))));



ALTER TABLE "curadoria"."crm_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_contacts_insert" ON "curadoria"."crm_contacts" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."has_role"('concierge'::"text")));



CREATE POLICY "crm_contacts_select" ON "curadoria"."crm_contacts" FOR SELECT TO "authenticated" USING ("curadoria"."can_access_crm_contact"("id"));



CREATE POLICY "crm_contacts_update" ON "curadoria"."crm_contacts" FOR UPDATE TO "authenticated" USING ("curadoria"."can_access_crm_contact"("id")) WITH CHECK ("curadoria"."can_access_crm_contact"("id"));



ALTER TABLE "curadoria"."crm_interactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_interactions_insert" ON "curadoria"."crm_interactions" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."can_access_crm_contact"("contact_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."has_role"('concierge'::"text"))));



CREATE POLICY "crm_interactions_select" ON "curadoria"."crm_interactions" FOR SELECT TO "authenticated" USING (("curadoria"."can_access_crm_contact"("contact_id") AND (("visibility" = 'operacional'::"text") OR (("visibility" = 'restrita'::"text") AND "curadoria"."has_role"('administrador'::"text")) OR (("visibility" = 'administrativa'::"text") AND "curadoria"."has_role"('administrador'::"text")))));



ALTER TABLE "curadoria"."crm_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_tasks_insert" ON "curadoria"."crm_tasks" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



CREATE POLICY "crm_tasks_select" ON "curadoria"."crm_tasks" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



CREATE POLICY "crm_tasks_update" ON "curadoria"."crm_tasks" FOR UPDATE TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id")))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR ("assigned_to" = "auth"."uid"()) OR ("curadoria"."has_role"('concierge'::"text") AND "curadoria"."can_access_crm_contact"("contact_id"))));



ALTER TABLE "curadoria"."curadoria_report_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "curadoria"."curadoria_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "curadoria"."curated_selection_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "curated_selection_options_select_patient_delivered" ON "curadoria"."curated_selection_options" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."curated_selections" "s"
  WHERE (("s"."id" = "curated_selection_options"."curated_selection_id") AND ("s"."status" = 'DELIVERED'::"text") AND "curadoria"."is_patient_for_case"("s"."case_id")))));



CREATE POLICY "curated_selection_options_write_curator" ON "curadoria"."curated_selection_options" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."curated_selections" "s"
  WHERE (("s"."id" = "curated_selection_options"."curated_selection_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("s"."case_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."curated_selections" "s"
  WHERE (("s"."id" = "curated_selection_options"."curated_selection_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("s"."case_id"))))));



ALTER TABLE "curadoria"."curated_selections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "curated_selections_select_patient_delivered" ON "curadoria"."curated_selections" FOR SELECT TO "authenticated" USING ((("status" = 'DELIVERED'::"text") AND "curadoria"."is_patient_for_case"("case_id")));



CREATE POLICY "curated_selections_write_curator" ON "curadoria"."curated_selections" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."devolutiva_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devolutiva_select_patient" ON "curadoria"."devolutiva_records" FOR SELECT TO "authenticated" USING ("curadoria"."is_patient_for_case"("case_id"));



CREATE POLICY "devolutiva_write_curator" ON "curadoria"."devolutiva_records" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."final_curadoria_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "final_curadoria_deliveries_insert_admin_or_case_curator" ON "curadoria"."final_curadoria_deliveries" FOR INSERT TO "authenticated" WITH CHECK ((("delivered_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "final_curadoria_deliveries"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "final_curadoria_deliveries_select_admin_or_curator" ON "curadoria"."final_curadoria_deliveries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "final_curadoria_deliveries"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "final_curadoria_deliveries_select_own_patient" ON "curadoria"."final_curadoria_deliveries" FOR SELECT TO "authenticated" USING (("patient_profile_id" = "auth"."uid"()));



ALTER TABLE "curadoria"."human_review_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "human_review_results_insert_admin_or_case_curator" ON "curadoria"."human_review_results" FOR INSERT TO "authenticated" WITH CHECK ((("reviewer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "human_review_results"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "human_review_results_select_admin_or_case_curator" ON "curadoria"."human_review_results" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "human_review_results"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."p002_field_corrections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "p002_field_corrections_insert_admin_or_case_curator" ON "curadoria"."p002_field_corrections" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "p002_field_corrections"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "p002_field_corrections_select_admin_or_case_curator" ON "curadoria"."p002_field_corrections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "p002_field_corrections"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."patient_curadoria_decisions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_decisions_insert_patient" ON "curadoria"."patient_curadoria_decisions" FOR INSERT TO "authenticated" WITH CHECK ("curadoria"."is_patient_for_case"("case_id"));



CREATE POLICY "patient_decisions_select_own_or_team" ON "curadoria"."patient_curadoria_decisions" FOR SELECT TO "authenticated" USING (("curadoria"."is_patient_for_case"("case_id") OR "curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."patient_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_documents_delete_own_or_admin" ON "curadoria"."patient_documents" FOR DELETE TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



CREATE POLICY "patient_documents_insert_own" ON "curadoria"."patient_documents" FOR INSERT TO "authenticated" WITH CHECK ((("profile_id" = "auth"."uid"()) AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "patient_documents_select_assigned_curator" ON "curadoria"."patient_documents" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."patient_story_attachments" "psa"
  WHERE (("psa"."document_id" = "patient_documents"."id") AND "curadoria"."is_case_curator_for_story"("psa"."story_id")))));



CREATE POLICY "patient_documents_select_own_or_admin" ON "curadoria"."patient_documents" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



ALTER TABLE "curadoria"."patient_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_notifications_insert_admin_only" ON "curadoria"."patient_notifications" FOR INSERT TO "authenticated" WITH CHECK ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "patient_notifications_select_own_or_admin" ON "curadoria"."patient_notifications" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



CREATE POLICY "patient_notifications_update_own_or_admin" ON "curadoria"."patient_notifications" FOR UPDATE TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text"))) WITH CHECK ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



ALTER TABLE "curadoria"."patient_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_profiles_insert_admin" ON "curadoria"."patient_profiles" FOR INSERT TO "authenticated" WITH CHECK ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "patient_profiles_insert_own" ON "curadoria"."patient_profiles" FOR INSERT TO "authenticated" WITH CHECK ((("profile_id" = "auth"."uid"()) AND "curadoria"."has_role"('paciente'::"text")));



CREATE POLICY "patient_profiles_select_own_or_admin" ON "curadoria"."patient_profiles" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



CREATE POLICY "patient_profiles_update_admin" ON "curadoria"."patient_profiles" FOR UPDATE TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text")) WITH CHECK ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "patient_profiles_update_own" ON "curadoria"."patient_profiles" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK ((("profile_id" = "auth"."uid"()) AND "curadoria"."has_role"('paciente'::"text")));



ALTER TABLE "curadoria"."patient_stories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_stories_insert_own" ON "curadoria"."patient_stories" FOR INSERT TO "authenticated" WITH CHECK ((("profile_id" = "auth"."uid"()) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "patient_stories_select_assigned_curator" ON "curadoria"."patient_stories" FOR SELECT TO "authenticated" USING ("curadoria"."is_case_curator_for_story"("id"));



CREATE POLICY "patient_stories_select_own_or_admin" ON "curadoria"."patient_stories" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



CREATE POLICY "patient_stories_update_own" ON "curadoria"."patient_stories" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "curadoria"."patient_story_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_story_attachments_delete_own" ON "curadoria"."patient_story_attachments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."patient_stories" "ps"
  WHERE (("ps"."id" = "patient_story_attachments"."story_id") AND ("ps"."profile_id" = "auth"."uid"())))));



CREATE POLICY "patient_story_attachments_insert_own" ON "curadoria"."patient_story_attachments" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "curadoria"."patient_stories" "ps"
  WHERE (("ps"."id" = "patient_story_attachments"."story_id") AND ("ps"."profile_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "curadoria"."patient_documents" "pd"
  WHERE (("pd"."id" = "patient_story_attachments"."document_id") AND ("pd"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "patient_story_attachments_select_assigned_curator" ON "curadoria"."patient_story_attachments" FOR SELECT TO "authenticated" USING ("curadoria"."is_case_curator_for_story"("story_id"));



CREATE POLICY "patient_story_attachments_select_own_or_admin" ON "curadoria"."patient_story_attachments" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR (EXISTS ( SELECT 1
   FROM "curadoria"."patient_stories" "ps"
  WHERE (("ps"."id" = "patient_story_attachments"."story_id") AND ("ps"."profile_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."patient_story_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_story_versions_select_own_or_admin" ON "curadoria"."patient_story_versions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."patient_stories" "ps"
  WHERE (("ps"."id" = "patient_story_versions"."story_id") AND (("ps"."profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text"))))));



CREATE POLICY "priority_filters_select_patient_validated" ON "curadoria"."priority_profile_filters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_profile_filters"."priority_profile_id") AND ("p"."status" = 'VALIDATED'::"text") AND "curadoria"."is_patient_for_case"("p"."case_id")))));



CREATE POLICY "priority_filters_write_curator" ON "curadoria"."priority_profile_filters" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_profile_filters"."priority_profile_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("p"."case_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_profile_filters"."priority_profile_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("p"."case_id"))))));



ALTER TABLE "curadoria"."priority_profile_filters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "curadoria"."priority_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "priority_profiles_select_patient_validated" ON "curadoria"."priority_profiles" FOR SELECT TO "authenticated" USING ((("status" = 'VALIDATED'::"text") AND "curadoria"."is_patient_for_case"("case_id")));



CREATE POLICY "priority_profiles_write_curator" ON "curadoria"."priority_profiles" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."priority_weights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "priority_weights_select_patient_validated" ON "curadoria"."priority_weights" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_weights"."priority_profile_id") AND ("p"."status" = 'VALIDATED'::"text") AND "curadoria"."is_patient_for_case"("p"."case_id")))));



CREATE POLICY "priority_weights_write_curator" ON "curadoria"."priority_weights" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_weights"."priority_profile_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("p"."case_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."priority_profiles" "p"
  WHERE (("p"."id" = "priority_weights"."priority_profile_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("p"."case_id"))))));



ALTER TABLE "curadoria"."professional_competency_areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "professional_competency_areas_select_admin_or_own" ON "curadoria"."professional_competency_areas" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR (EXISTS ( SELECT 1
   FROM "curadoria"."professional_profiles" "pp"
  WHERE (("pp"."id" = "professional_competency_areas"."professional_profile_id") AND ("pp"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "professional_competency_areas_select_curator" ON "curadoria"."professional_competency_areas" FOR SELECT TO "authenticated" USING ("curadoria"."has_role"('curador_medico'::"text"));



CREATE POLICY "professional_competency_areas_write_admin_only" ON "curadoria"."professional_competency_areas" TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text")) WITH CHECK ("curadoria"."has_role"('administrador'::"text"));



ALTER TABLE "curadoria"."professional_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "professional_documents_delete_admin_only" ON "curadoria"."professional_documents" FOR DELETE TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "professional_documents_insert_admin_only" ON "curadoria"."professional_documents" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "professional_documents_select_admin_or_own" ON "curadoria"."professional_documents" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR (EXISTS ( SELECT 1
   FROM "curadoria"."professional_profiles" "pp"
  WHERE (("pp"."id" = "professional_documents"."professional_profile_id") AND ("pp"."profile_id" = "auth"."uid"()))))));



ALTER TABLE "curadoria"."professional_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "professional_profiles_insert_admin_only" ON "curadoria"."professional_profiles" FOR INSERT TO "authenticated" WITH CHECK (("curadoria"."has_role"('administrador'::"text") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "professional_profiles_select_admin_or_own" ON "curadoria"."professional_profiles" FOR SELECT TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR ("profile_id" = "auth"."uid"())));



CREATE POLICY "professional_profiles_select_curator" ON "curadoria"."professional_profiles" FOR SELECT TO "authenticated" USING ("curadoria"."has_role"('curador_medico'::"text"));



CREATE POLICY "professional_profiles_select_patient_delivered_option" ON "curadoria"."professional_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("curadoria"."curated_selection_options" "o"
     JOIN "curadoria"."curated_selections" "s" ON (("s"."id" = "o"."curated_selection_id")))
  WHERE (("o"."professional_profile_id" = "professional_profiles"."id") AND ("s"."status" = 'DELIVERED'::"text") AND "curadoria"."is_patient_for_case"("s"."case_id")))));



CREATE POLICY "professional_profiles_update_admin_only" ON "curadoria"."professional_profiles" FOR UPDATE TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text")) WITH CHECK (("curadoria"."has_role"('administrador'::"text") AND ("updated_by" = "auth"."uid"())));



ALTER TABLE "curadoria"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "curadoria"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_own_or_admin" ON "curadoria"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") OR "curadoria"."has_role"('administrador'::"text")));



CREATE POLICY "profiles_update_own_or_admin" ON "curadoria"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR "curadoria"."has_role"('administrador'::"text"))) WITH CHECK ((("auth"."uid"() = "id") OR "curadoria"."has_role"('administrador'::"text")));



ALTER TABLE "curadoria"."relationship_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "relationship_events_insert_patient_events" ON "curadoria"."relationship_events" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND ("event_type" = ANY (ARRAY['RELACIONAMENTO_INICIADO'::"text", 'ENCERRAMENTO_PLANEJADO_DECLARADO'::"text", 'INTERRUPCAO_DECLARADA'::"text"])) AND (EXISTS ( SELECT 1
   FROM "curadoria"."relationship_records" "rr"
  WHERE (("rr"."id" = "relationship_events"."relationship_id") AND ("rr"."patient_profile_id" = "auth"."uid"()))))));



CREATE POLICY "relationship_events_insert_team_events" ON "curadoria"."relationship_events" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND ("event_type" = ANY (ARRAY['INTERRUPCAO_DECLARADA'::"text", 'REABERTURA_OBSERVADA'::"text"])) AND (EXISTS ( SELECT 1
   FROM ("curadoria"."relationship_records" "rr"
     JOIN "curadoria"."cases" "c" ON (("c"."id" = "rr"."case_id")))
  WHERE (("rr"."id" = "relationship_events"."relationship_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))));



CREATE POLICY "relationship_events_select_admin_or_case_curator" ON "curadoria"."relationship_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("curadoria"."relationship_records" "rr"
     JOIN "curadoria"."cases" "c" ON (("c"."id" = "rr"."case_id")))
  WHERE (("rr"."id" = "relationship_events"."relationship_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "relationship_events_select_own_patient" ON "curadoria"."relationship_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."relationship_records" "rr"
  WHERE (("rr"."id" = "relationship_events"."relationship_id") AND ("rr"."patient_profile_id" = "auth"."uid"())))));



ALTER TABLE "curadoria"."relationship_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "relationship_records_insert_own_patient" ON "curadoria"."relationship_records" FOR INSERT TO "authenticated" WITH CHECK ((("patient_profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "curadoria"."connection_records" "cr"
  WHERE (("cr"."id" = "relationship_records"."connection_id") AND ("cr"."patient_profile_id" = "auth"."uid"()) AND ("cr"."status" = 'PRIMEIRO_ATENDIMENTO_REALIZADO'::"text"))))));



CREATE POLICY "relationship_records_select_admin_or_case_curator" ON "curadoria"."relationship_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "relationship_records"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "relationship_records_select_own_patient" ON "curadoria"."relationship_records" FOR SELECT TO "authenticated" USING (("patient_profile_id" = "auth"."uid"()));



CREATE POLICY "relationship_records_update_admin_or_case_curator" ON "curadoria"."relationship_records" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "relationship_records"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."cases" "c"
  WHERE (("c"."id" = "relationship_records"."case_id") AND ("curadoria"."has_role"('administrador'::"text") OR ("c"."assigned_curator_id" = "auth"."uid"()))))));



CREATE POLICY "relationship_records_update_own_patient" ON "curadoria"."relationship_records" FOR UPDATE TO "authenticated" USING (("patient_profile_id" = "auth"."uid"())) WITH CHECK (("patient_profile_id" = "auth"."uid"()));



CREATE POLICY "report_options_select_patient_delivered" ON "curadoria"."curadoria_report_options" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."curadoria_reports" "r"
  WHERE (("r"."id" = "curadoria_report_options"."report_id") AND ("r"."delivered_at" IS NOT NULL) AND "curadoria"."is_patient_for_case"("r"."case_id")))));



CREATE POLICY "report_options_write_curator" ON "curadoria"."curadoria_report_options" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "curadoria"."curadoria_reports" "r"
  WHERE (("r"."id" = "curadoria_report_options"."report_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("r"."case_id")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "curadoria"."curadoria_reports" "r"
  WHERE (("r"."id" = "curadoria_report_options"."report_id") AND ("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("r"."case_id"))))));



CREATE POLICY "reports_select_patient_delivered" ON "curadoria"."curadoria_reports" FOR SELECT TO "authenticated" USING ((("delivered_at" IS NOT NULL) AND "curadoria"."is_patient_for_case"("case_id")));



CREATE POLICY "reports_write_curator" ON "curadoria"."curadoria_reports" TO "authenticated" USING (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id"))) WITH CHECK (("curadoria"."has_role"('administrador'::"text") OR "curadoria"."is_curator_for_case"("case_id")));



ALTER TABLE "curadoria"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_select_authenticated" ON "curadoria"."roles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "curadoria"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_delete_admin_only" ON "curadoria"."user_roles" FOR DELETE TO "authenticated" USING ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "user_roles_insert_admin_only" ON "curadoria"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("curadoria"."has_role"('administrador'::"text"));



CREATE POLICY "user_roles_select_own_or_admin" ON "curadoria"."user_roles" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "curadoria"."has_role"('administrador'::"text")));



ALTER TABLE "curadoria"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_insert_own" ON "curadoria"."user_settings" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "user_settings_select_own" ON "curadoria"."user_settings" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "user_settings_update_own" ON "curadoria"."user_settings" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "curadoria" TO "authenticated";
GRANT USAGE ON SCHEMA "curadoria" TO "anon";
GRANT USAGE ON SCHEMA "curadoria" TO "service_role";



REVOKE ALL ON FUNCTION "curadoria"."append_crm_audit_log"("_action" "text", "_entity_type" "text", "_entity_id" "uuid", "_previous_values" "jsonb", "_new_values" "jsonb", "_context" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "curadoria"."append_crm_audit_log"("_action" "text", "_entity_type" "text", "_entity_id" "uuid", "_previous_values" "jsonb", "_new_values" "jsonb", "_context" "jsonb") TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."connection_records" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."connection_records" TO "service_role";



GRANT ALL ON FUNCTION "curadoria"."apply_connection_transition"("p_connection_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_professional_profile_id" "uuid", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."relationship_records" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."relationship_records" TO "service_role";



GRANT ALL ON FUNCTION "curadoria"."apply_relationship_transition"("p_relationship_id" "uuid", "p_expected_status" "text", "p_new_status" "text", "p_event_type" "text", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT ALL ON FUNCTION "curadoria"."confirm_first_appointment_and_birth_relationship"("p_connection_id" "uuid", "p_expected_status" "text", "p_actor_id" "uuid", "p_connection_event_payload" "jsonb", "p_relationship_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT ALL ON FUNCTION "curadoria"."create_connection_with_event"("p_case_id" "uuid", "p_final_curadoria_delivery_id" "uuid", "p_patient_profile_id" "uuid", "p_professional_profile_id" "uuid", "p_decided_at" timestamp with time zone, "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT ALL ON FUNCTION "curadoria"."create_relationship_with_event"("p_connection_id" "uuid", "p_actor_id" "uuid", "p_event_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT SELECT,INSERT ON TABLE "curadoria"."relationship_events" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."relationship_events" TO "service_role";



GRANT ALL ON FUNCTION "curadoria"."register_relationship_reopening"("p_relationship_id" "uuid", "p_new_case_id" "uuid", "p_actor_id" "uuid", "p_payload" "jsonb", "p_occurred_at" timestamp with time zone, "p_recorded_at" timestamp with time zone) TO "authenticated";



GRANT SELECT,INSERT ON TABLE "curadoria"."ace_artifacts" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."ace_artifacts" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."ace_execution_events" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."ace_execution_events" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."ace_executions" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."ace_executions" TO "service_role";



GRANT SELECT ON TABLE "curadoria"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."case_clinical_context" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."case_clinical_context" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."case_events" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."case_events" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."case_notes" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."case_notes" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."cases" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."cases" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."compatibility_analyses" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."compatibility_analyses" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."compatibility_criterion_results" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."compatibility_criterion_results" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."connection_events" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."connection_events" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."consultation_records" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."consultation_records" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."crm_appointments" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_appointments" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."crm_audit_log" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_audit_log" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."crm_cases" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_cases" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."crm_contacts" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_contacts" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."crm_interactions" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_interactions" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."crm_tasks" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."crm_tasks" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."curadoria_report_options" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."curadoria_report_options" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."curadoria_reports" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."curadoria_reports" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."curated_selection_options" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."curated_selection_options" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."curated_selections" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."curated_selections" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."devolutiva_records" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."devolutiva_records" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."final_curadoria_deliveries" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."final_curadoria_deliveries" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."human_review_results" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."human_review_results" TO "service_role";



GRANT SELECT,INSERT ON TABLE "curadoria"."p002_field_corrections" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."p002_field_corrections" TO "service_role";



GRANT SELECT ON TABLE "curadoria"."patient_case_overview" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "curadoria"."patient_curadoria_decisions" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_curadoria_decisions" TO "service_role";



GRANT SELECT,INSERT,DELETE ON TABLE "curadoria"."patient_documents" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_documents" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."patient_notifications" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_notifications" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."patient_profiles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_profiles" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."patient_stories" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_stories" TO "service_role";



GRANT SELECT,INSERT,DELETE ON TABLE "curadoria"."patient_story_attachments" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_story_attachments" TO "service_role";



GRANT SELECT ON TABLE "curadoria"."patient_story_versions" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."patient_story_versions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."priority_profile_filters" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."priority_profile_filters" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."priority_profiles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."priority_profiles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."priority_weights" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."priority_weights" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "curadoria"."professional_competency_areas" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."professional_competency_areas" TO "service_role";



GRANT SELECT,INSERT,DELETE ON TABLE "curadoria"."professional_documents" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."professional_documents" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."professional_profiles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."professional_profiles" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."profiles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."profiles" TO "service_role";



GRANT SELECT ON TABLE "curadoria"."roles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."roles" TO "service_role";



GRANT SELECT,INSERT,DELETE ON TABLE "curadoria"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."user_roles" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "curadoria"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "curadoria"."user_settings" TO "service_role";





--
-- TRIGGERS (extraídos de pg_trigger via MCP — o `supabase db dump` trouxe as
-- funções de trigger mas nenhum CREATE TRIGGER, então os invariantes ficariam
-- inertes num banco recriado a partir deste arquivo).
--
CREATE TRIGGER set_ace_executions_updated_at BEFORE UPDATE ON curadoria.ace_executions FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_case_clinical_context_updated_at BEFORE UPDATE ON curadoria.case_clinical_context FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER enforce_case_status_transition_trigger BEFORE UPDATE ON curadoria.cases FOR EACH ROW EXECUTE FUNCTION curadoria.enforce_case_status_transition();
CREATE TRIGGER set_cases_updated_at BEFORE UPDATE ON curadoria.cases FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER connection_records_assert_professional_in_delivery BEFORE INSERT OR UPDATE OF professional_profile_id ON curadoria.connection_records FOR EACH ROW EXECUTE FUNCTION curadoria.assert_connection_professional_in_delivery();
CREATE TRIGGER connection_records_assert_valid_transition BEFORE UPDATE ON curadoria.connection_records FOR EACH ROW EXECUTE FUNCTION curadoria.assert_connection_valid_transition();
CREATE TRIGGER set_consultation_records_updated_at BEFORE UPDATE ON curadoria.consultation_records FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_crm_appointments_updated_at BEFORE UPDATE ON curadoria.crm_appointments FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_crm_cases_updated_at BEFORE UPDATE ON curadoria.crm_cases FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_crm_contacts_updated_at BEFORE UPDATE ON curadoria.crm_contacts FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_crm_tasks_updated_at BEFORE UPDATE ON curadoria.crm_tasks FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER protect_delivered_report_options BEFORE INSERT OR DELETE OR UPDATE ON curadoria.curadoria_report_options FOR EACH ROW EXECUTE FUNCTION curadoria.protect_delivered_report();
CREATE TRIGGER enforce_report_has_three_trigger BEFORE UPDATE ON curadoria.curadoria_reports FOR EACH ROW EXECUTE FUNCTION curadoria.enforce_report_has_three();
CREATE TRIGGER set_curadoria_reports_updated_at BEFORE UPDATE ON curadoria.curadoria_reports FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER enforce_selection_has_three_trigger BEFORE UPDATE ON curadoria.curated_selections FOR EACH ROW EXECUTE FUNCTION curadoria.enforce_selection_has_three();
CREATE TRIGGER set_curated_selections_updated_at BEFORE UPDATE ON curadoria.curated_selections FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_devolutiva_records_updated_at BEFORE UPDATE ON curadoria.devolutiva_records FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER protect_patient_notification_content_trigger BEFORE UPDATE ON curadoria.patient_notifications FOR EACH ROW EXECUTE FUNCTION curadoria.protect_patient_notification_content();
CREATE TRIGGER set_patient_profiles_updated_at BEFORE UPDATE ON curadoria.patient_profiles FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER track_patient_story_revision_trigger BEFORE INSERT OR UPDATE ON curadoria.patient_stories FOR EACH ROW EXECUTE FUNCTION curadoria.track_patient_story_revision();
CREATE TRIGGER track_patient_story_version_trigger AFTER INSERT OR UPDATE ON curadoria.patient_stories FOR EACH ROW EXECUTE FUNCTION curadoria.track_patient_story_version();
CREATE TRIGGER protect_validated_priority_filters BEFORE INSERT OR DELETE OR UPDATE ON curadoria.priority_profile_filters FOR EACH ROW EXECUTE FUNCTION curadoria.protect_validated_priority_profile();
CREATE TRIGGER enforce_priority_profile_validation_trigger BEFORE UPDATE ON curadoria.priority_profiles FOR EACH ROW EXECUTE FUNCTION curadoria.enforce_priority_profile_validation();
CREATE TRIGGER set_priority_profiles_updated_at BEFORE UPDATE ON curadoria.priority_profiles FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER protect_validated_priority_weights BEFORE INSERT OR DELETE OR UPDATE ON curadoria.priority_weights FOR EACH ROW EXECUTE FUNCTION curadoria.protect_validated_priority_profile();
CREATE TRIGGER set_professional_profiles_updated_at BEFORE UPDATE ON curadoria.professional_profiles FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON curadoria.profiles FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER relationship_records_assert_immutable_fields BEFORE UPDATE ON curadoria.relationship_records FOR EACH ROW EXECUTE FUNCTION curadoria.assert_relationship_immutable_fields();
CREATE TRIGGER relationship_records_assert_matches_connection BEFORE INSERT ON curadoria.relationship_records FOR EACH ROW EXECUTE FUNCTION curadoria.assert_relationship_matches_connection();
CREATE TRIGGER relationship_records_assert_valid_transition BEFORE UPDATE ON curadoria.relationship_records FOR EACH ROW EXECUTE FUNCTION curadoria.assert_relationship_valid_transition();
CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON curadoria.roles FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
CREATE TRIGGER log_user_roles_delete AFTER DELETE ON curadoria.user_roles FOR EACH ROW EXECUTE FUNCTION curadoria.log_user_role_change();
CREATE TRIGGER log_user_roles_insert AFTER INSERT ON curadoria.user_roles FOR EACH ROW EXECUTE FUNCTION curadoria.log_user_role_change();
CREATE TRIGGER notify_patient_welcome_on_role_grant AFTER INSERT ON curadoria.user_roles FOR EACH ROW EXECUTE FUNCTION curadoria.notify_patient_welcome();
CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON curadoria.user_settings FOR EACH ROW EXECUTE FUNCTION curadoria.set_updated_at();
