"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import {
  ACE_EXECUTION_STATUSES,
  ACE_EXECUTION_STATUS_LABELS,
  type AceExecutionOverview,
  type AceExecutionStatus,
} from "@/modules/concierge/types";

const PAGE_SIZE = 10;
const PERIOD_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const STATUS_BADGE_CLASS: Record<AceExecutionStatus, string> = {
  PENDING: "",
  RUNNING: "",
  BLOCKED: "text-error",
  FAILED: "text-error",
  COMPLETED: "",
  CANCELLED: "",
};

type CuratorOption = { id: string; name: string };

type AceExecutionsTableProps = {
  executions: AceExecutionOverview[];
  curators: CuratorOption[];
};

export function AceExecutionsTable({ executions, curators }: AceExecutionsTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [curatorFilter, setCuratorFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const periodMs = PERIOD_MS[periodFilter];
    const now = Date.now();

    return executions.filter((execution) => {
      if (trimmed && !execution.patientName.toLowerCase().includes(trimmed) && !execution.caseId.toLowerCase().includes(trimmed)) {
        return false;
      }
      if (statusFilter && execution.status !== statusFilter) return false;
      if (curatorFilter && execution.startedBy !== curatorFilter) return false;
      if (periodMs && now - new Date(execution.startedAt).getTime() > periodMs) return false;
      return true;
    });
  }, [executions, query, statusFilter, curatorFilter, periodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (executions.length === 0) {
    return (
      <EmptyState
        title="Nenhuma execução do ACE ainda."
        description="Execuções aparecem aqui assim que um Administrador ou Curador Médico iniciar o ACE em um Caso."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <SearchField
          label="Buscar por paciente ou id do caso"
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
          {ACE_EXECUTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ACE_EXECUTION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por quem iniciou"
          value={curatorFilter}
          onChange={(event) => {
            setCuratorFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos que iniciaram</option>
          {curators.map((curator) => (
            <option key={curator.id} value={curator.id}>
              {curator.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por período"
          value={periodFilter}
          onChange={(event) => {
            setPeriodFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todo o período</option>
          <option value="24h">Últimas 24 horas</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma execução encontrada." description="Tente ajustar a busca ou os filtros." />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Paciente</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Protocolo atual</TableHeaderCell>
                <TableHeaderCell>Iniciada por</TableHeaderCell>
                <TableHeaderCell>Iniciada em</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Ações</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <span className="font-medium text-ink">{execution.patientName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_CLASS[execution.status]}>
                      {ACE_EXECUTION_STATUS_LABELS[execution.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{execution.currentProtocol ?? "—"}</TableCell>
                  <TableCell>{execution.startedByName}</TableCell>
                  <TableCell>{new Date(execution.startedAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/ace/${execution.id}`}
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
