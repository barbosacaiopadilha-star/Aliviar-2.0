"use client";

import { useCallback, useState, useTransition } from "react";

import { usePaginatedFilter } from "@/components/admin/use-paginated-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { grantTeamRoleAction, revokeTeamRoleAction } from "@/modules/team/actions";
import type { ManageableRoleSlug, TeamMember } from "@/modules/team/types";

const MANAGEABLE_ROLES: { slug: ManageableRoleSlug; label: string }[] = [
  { slug: "administrador", label: "Administrador" },
  { slug: "curador_medico", label: "Curador Médico" },
];

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  curador_medico: "Curador Médico",
  profissional: "Profissional",
  paciente: "Paciente",
};

type TeamTableProps = {
  members: TeamMember[];
  currentProfileId: string;
};

export function TeamTable({ members, currentProfileId }: TeamTableProps) {
  const [rolesByProfileId, setRolesByProfileId] = useState(
    () => new Map(members.map((member) => [member.profileId, member.roles])),
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const matchesQuery = useCallback(
    (member: TeamMember, query: string) =>
      member.displayName.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
    [],
  );

  const { query, setQuery, page, setPage, totalPages, pageItems, totalMatches } = usePaginatedFilter(
    members,
    matchesQuery,
  );

  function toggleRole(profileId: string, roleSlug: ManageableRoleSlug, hasRole: boolean) {
    const key = `${profileId}:${roleSlug}`;
    setPendingKey(key);
    setError(null);

    startTransition(async () => {
      const result = hasRole
        ? await revokeTeamRoleAction({ profileId, roleSlug })
        : await grantTeamRoleAction({ profileId, roleSlug });

      if (result.success) {
        setRolesByProfileId((current) => {
          const next = new Map(current);
          const roles = next.get(profileId) ?? [];
          next.set(
            profileId,
            hasRole ? roles.filter((role) => role !== roleSlug) : roles.concat(roleSlug),
          );
          return next;
        });
      } else {
        setError(result.error);
      }
      setPendingKey(null);
    });
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="Nenhuma pessoa cadastrada ainda."
        description="Cadastros de paciente ou profissional aparecerão aqui para gestão de papéis."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchField
        label="Buscar por nome ou e-mail"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}

      {totalMatches === 0 ? (
        <EmptyState title="Nenhuma pessoa encontrada." description="Tente buscar por outro nome ou e-mail." />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>E-mail</TableHeaderCell>
                <TableHeaderCell>Papéis</TableHeaderCell>
                <TableHeaderCell>Conceder / revogar</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((member) => {
                const roles = rolesByProfileId.get(member.profileId) ?? [];
                const otherRoles = roles.filter(
                  (role) => !MANAGEABLE_ROLES.some((manageable) => manageable.slug === role),
                );

                return (
                  <TableRow key={member.profileId}>
                    <TableCell>
                      <span className="font-medium text-ink">{member.displayName}</span>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {roles.length === 0 ? (
                          <span className="text-xs text-ink-muted">Sem papel</span>
                        ) : (
                          roles.map((role) => (
                            <Badge key={role} variant={role === "administrador" ? "gold" : "sage"}>
                              {ROLE_LABELS[role] ?? role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {MANAGEABLE_ROLES.map(({ slug, label }) => {
                          const hasRole = roles.includes(slug);
                          const key = `${member.profileId}:${slug}`;
                          const isSelfAdminRevoke =
                            slug === "administrador" && hasRole && member.profileId === currentProfileId;

                          return (
                            <Button
                              key={slug}
                              type="button"
                              variant={hasRole ? "secondary" : "ghost"}
                              size="sm"
                              className="w-auto text-xs"
                              disabled={pendingKey === key || isSelfAdminRevoke}
                              isLoading={pendingKey === key}
                              onClick={() => toggleRole(member.profileId, slug, hasRole)}
                              title={
                                isSelfAdminRevoke
                                  ? "Você não pode revogar seu próprio papel de administrador."
                                  : undefined
                              }
                            >
                              {hasRole ? `Revogar ${label}` : `Conceder ${label}`}
                            </Button>
                          );
                        })}
                      </div>
                      {otherRoles.length > 0 ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          Também: {otherRoles.map((role) => ROLE_LABELS[role] ?? role).join(", ")}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}
