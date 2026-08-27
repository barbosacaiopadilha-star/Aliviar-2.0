"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ESTADOS_DO_MOTOR_EXTINTO } from "@/components/cases/case-status-control";
import { CASE_STATUS_LABELS, CASE_STATUSES, type CaseStatus, type CaseSummary } from "@/modules/cases/types";

const PAGE_SIZE = 10;
const PENDING_STATUSES: CaseStatus[] = ["NEW", "WAITING_FOR_INFORMATION"];

type CuratorOption = { id: string; name: string };

type CasesTableProps = {
  cases: CaseSummary[];
  curators: CuratorOption[];
  basePath: string;
};

export function CasesTable({ cases, curators, basePath }: CasesTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [curatorFilter, setCuratorFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return cases.filter((item) => {
      if (trimmed && !item.patientName.toLowerCase().includes(trimmed)) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (curatorFilter === "__unassigned__" && item.assignedCuratorId !== null) return false;
      if (curatorFilter && curatorFilter !== "__unassigned__" && item.assignedCuratorId !== curatorFilter) return false;
      return true;
    });
  }, [cases, query, statusFilter, curatorFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (cases.length === 0) {
    return (
      <EmptyState
        title="Ainda não há casos iniciados."
        description="Um caso nasce quando uma história enviada é triada pela equipe Aliviar."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SearchField
          label="Buscar por assistido"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filtrar por status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os status</option>
          {/* C3 (auditoria 22/08): os estados do motor extinto saem do
              filtro — nenhum Case pode alcançá-los, e oferecê-los só
              produzia lista vazia. A máquina no banco encolhe no
              descongelamento; aqui é só a vitrine do filtro. */}
          {CASE_STATUSES.filter((status) => !ESTADOS_DO_MOTOR_EXTINTO.includes(status)).map((status) => (
            <option key={status} value={status}>
              {CASE_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por curador médico"
          value={curatorFilter}
          onChange={(event) => {
            setCuratorFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os curadores</option>
          <option value="__unassigned__">Sem atribuição</option>
          {curators.map((curator) => (
            <option key={curator.id} value={curator.id}>
              {curator.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum caso encontrado." description="Tente ajustar a busca ou os filtros." />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Assistido</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Curador médico</TableHeaderCell>
                <TableHeaderCell>Atualizado</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Ações</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {PENDING_STATUSES.includes(item.status) ? (
                        <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
                      ) : null}
                      <span className="font-medium text-ink">{item.patientName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "DELIVERED" || item.status === "CLOSED" ? "sage" : "default"}>
                      {CASE_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.assignedCuratorName ?? "Sem atribuição"}</TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Link
                      href={`${basePath}/${item.id}`}
                      className="font-medium text-brand-primary hover:text-brand-primary-deep"
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 ? <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}
