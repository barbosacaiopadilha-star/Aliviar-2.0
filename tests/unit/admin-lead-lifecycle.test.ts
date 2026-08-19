import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260818220000_ciclo_administrativo_do_lead.sql",
  ),
  "utf8",
);

describe("ciclo administrativo do lead", () => {
  it("mantém arquivamento e restauração exclusivos do administrador e auditados", () => {
    expect(migration).toContain(
      "create or replace function curadoria.archive_lead",
    );
    expect(migration).toContain(
      "create or replace function curadoria.restore_lead",
    );
    expect(
      migration.match(/curadoria\.has_role\('administrador'\)/g),
    ).toHaveLength(3);
    expect(migration).toContain("'lead_archived'");
    expect(migration).toContain("'lead_restored'");
    expect(migration).toContain("archived_from_stage = _before.pipeline_stage");
  });

  it("fecha o DELETE direto e exige confirmação nominal dentro da transação", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path to 'curadoria', 'pg_temp'");
    expect(migration).toContain(
      "coalesce(_confirmation, '') <> _lead.full_name",
    );
    expect(migration).toContain("'lead_deleted_permanently'");
    expect(migration).toContain(
      "delete from curadoria.crm_contacts where id = _contact_id",
    );
    expect(migration).toContain(
      "revoke all on function curadoria.delete_lead_permanently(uuid, text, text) from public",
    );
    expect(migration).toContain(
      "revoke all on function curadoria.delete_lead_permanently(uuid, text, text) from anon",
    );
    expect(
      migration.match(/revoke all on function curadoria\..+ from anon;/g),
    ).toHaveLength(3);
    expect(migration).not.toMatch(
      /grant\s+delete\s+on\s+curadoria\.crm_contacts/i,
    );
  });

  it("mede as cascatas e preserva Patient e Case canônicos", () => {
    expect(migration).toContain("'interactions_deleted', _interaction_count");
    expect(migration).toContain("'tasks_deleted', _task_count");
    expect(migration).toContain("'appointments_deleted', _appointment_count");
    expect(migration).toContain(
      "'patient_preserved', _lead.patient_profile_id is not null",
    );
    expect(migration).toContain(
      "'case_preserved', _lead.active_case_id is not null",
    );
    expect(migration).not.toMatch(/delete from curadoria\.(profiles|cases)/i);
  });
});
