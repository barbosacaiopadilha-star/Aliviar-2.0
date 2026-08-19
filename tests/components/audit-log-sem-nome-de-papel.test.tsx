import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AuditLogList } from "@/components/admin/audit-log-list";
import type { AuditLogEntry } from "@/modules/team/types";

/**
 * O feed de atividade não inventa nome de papel.
 *
 * Medido no painel do Admin em 2026-08-19: entradas sem `roleName` saíam como
 * `Sistema revogou o papel "papel"` — o rótulo genérico entre aspas, com a
 * mesma aparência tipográfica de um nome real. Quem lê o histórico não tinha
 * como saber que ali faltava informação.
 */

function entrada(over: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "a1",
    action: "role_revoked",
    actorName: "Sistema",
    roleName: null,
    targetName: null,
    createdAt: new Date("2026-08-19T12:00:00Z").toISOString(),
    ...over,
  } as AuditLogEntry;
}

describe("feed de atividade — papel sem nome", () => {
  it("não escreve um papel chamado \"papel\"", () => {
    render(<AuditLogList entries={[entrada()]} emptyMessage="vazio" />);

    expect(screen.queryByText(/o papel "papel"/)).not.toBeInTheDocument();
    expect(screen.getByText(/revogou um papel/)).toBeInTheDocument();
  });

  it("quando o nome existe, ele aparece entre aspas", () => {
    render(
      <AuditLogList
        entries={[entrada({ action: "role_granted", roleName: "Curador Médico" })]}
        emptyMessage="vazio"
      />,
    );

    expect(screen.getByText(/concedeu o papel "Curador Médico"/)).toBeInTheDocument();
  });
});
