import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Validação estática da política de auditoria CRM — complementa testes de
 * integração que exigem Supabase autenticado.
 */
describe("crm audit security (migration contract)", () => {
  const auditMigration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260724200000_crm_audit_secure_function.sql"),
    "utf8",
  );
  const foundationMigration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260724190000_crm_operational_foundation.sql"),
    "utf8",
  );

  it("usa função SECURITY DEFINER com search_path fixo", () => {
    expect(auditMigration).toContain("security definer");
    expect(auditMigration).toContain("set search_path = curadoria, pg_temp");
    expect(auditMigration).toContain("auth.uid()");
  });

  it("remove insert direto para authenticated na tabela de auditoria", () => {
    expect(auditMigration).toContain("drop policy if exists crm_audit_log_insert");
  });

  it("não concede update ou delete na auditoria", () => {
    expect(foundationMigration).not.toMatch(/crm_audit_log_update/i);
    expect(foundationMigration).not.toMatch(/crm_audit_log_delete/i);
    const auditPolicies = foundationMigration
      .split("create policy crm_audit_log_select")[1]
      ?.split("comment on table curadoria.crm_audit_log")[0];
    expect(auditPolicies).toBeDefined();
    expect(auditPolicies).not.toMatch(/for update/i);
    expect(auditPolicies).not.toMatch(/for delete/i);
  });

  it("restringe leitura da auditoria a administrador", () => {
    expect(foundationMigration).toContain("crm_audit_log_select");
    expect(foundationMigration).toContain("curadoria.has_role('administrador')");
  });

  it("writeCrmAudit usa RPC para usuários autenticados", () => {
    const repository = readFileSync(
      resolve(process.cwd(), "src/modules/crm/repository.ts"),
      "utf8",
    );
    expect(repository).toContain('supabase.rpc("append_crm_audit_log"');
    expect(repository).toContain("if (input.actorId === null)");
  });
});
