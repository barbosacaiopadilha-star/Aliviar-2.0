"use client";

import Link from "next/link";
import { useCallback } from "react";

import { usePaginatedFilter } from "@/components/admin/use-paginated-filter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { PatientAccountSummary } from "@/modules/profiles/patient-account-repository";

type PatientsTableProps = {
  patients: PatientAccountSummary[];
};

export function PatientsTable({ patients }: PatientsTableProps) {
  const matchesQuery = useCallback(
    (patient: PatientAccountSummary, query: string) =>
      patient.displayName.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query),
    [],
  );

  const { query, setQuery, page, setPage, totalPages, pageItems, totalMatches } = usePaginatedFilter(
    patients,
    matchesQuery,
  );

  if (patients.length === 0) {
    return (
      <EmptyState
        title="Ainda não há pacientes cadastrados."
        description="Crie o primeiro cadastro para começar a atender pela Aliviar."
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

      {totalMatches === 0 ? (
        <EmptyState
          title="Nenhum paciente encontrado."
          description="Tente buscar por outro nome ou e-mail."
        />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>E-mail</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Ações</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((patient) => (
                <TableRow key={patient.profileId}>
                  <TableCell>
                    <span className="font-medium text-ink">{patient.displayName}</span>
                  </TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>
                    <Badge variant={patient.accountStatus === "ativo" ? "sage" : "default"}>
                      {patient.accountStatus === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/pacientes/${patient.profileId}`}
                      className="font-medium text-brand-primary hover:text-brand-primary-deep"
                    >
                      Gerenciar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}
