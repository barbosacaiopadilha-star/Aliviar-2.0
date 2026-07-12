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
import type { ProfessionalProfile } from "@/modules/profiles/types";

type ProfessionalsTableProps = {
  professionals: ProfessionalProfile[];
};

export function ProfessionalsTable({ professionals }: ProfessionalsTableProps) {
  const matchesQuery = useCallback(
    (professional: ProfessionalProfile, query: string) =>
      professional.displayName.toLowerCase().includes(query) ||
      professional.professionalIdentifier.toLowerCase().includes(query),
    [],
  );

  const { query, setQuery, page, setPage, totalPages, pageItems, totalMatches } = usePaginatedFilter(
    professionals,
    matchesQuery,
  );

  if (professionals.length === 0) {
    return (
      <EmptyState
        title="Ainda não há profissionais cadastrados."
        description="Crie o primeiro registro para começar a formar a Rede Aliviar."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchField
        label="Buscar por nome ou identificação"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />

      {totalMatches === 0 ? (
        <EmptyState
          title="Nenhum profissional encontrado."
          description="Tente buscar por outro nome ou identificação."
        />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Identificação</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Publicação</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Ações</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell>
                    <span className="font-medium text-ink">{professional.displayName}</span>
                  </TableCell>
                  <TableCell>{professional.professionalIdentifier}</TableCell>
                  <TableCell>
                    <Badge variant={professional.status === "ativo" ? "sage" : "default"}>
                      {professional.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={professional.publicationStatus === "publicado" ? "gold" : "default"}>
                      {professional.publicationStatus === "publicado" ? "Publicado" : "Não publicado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/profissionais/${professional.id}`}
                      className="font-medium text-brand-primary hover:text-brand-primary-deep"
                    >
                      Editar
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
