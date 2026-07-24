"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatPhoneDisplay } from "@/modules/crm/phone";
import { CONTACT_SOURCE_LABELS, type CrmContactSummary } from "@/modules/crm/types";

import { CrmStageBadge } from "./crm-stage-badge";

type CrmContactsTableProps = {
  contacts: CrmContactSummary[];
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function CrmContactsTable({ contacts }: CrmContactsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) => {
      const haystack = `${contact.fullName} ${contact.phone ?? ""} ${contact.email ?? ""} ${contact.city ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, search]);

  if (contacts.length === 0) {
    return <EmptyState title="Nenhum contato ainda" description="Cadastre o primeiro contato para iniciar o acompanhamento." />;
  }

  return (
    <div className="space-y-4">
      <Input label="Buscar contatos" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, telefone, e-mail ou cidade" />

      <div className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Telefone</TableHeaderCell>
              <TableHeaderCell>Origem</TableHeaderCell>
              <TableHeaderCell>Etapa</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell>Última interação</TableHeaderCell>
              <TableHeaderCell>Próxima ação</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/admin/crm/contatos/${contact.id}`} className="font-medium text-brand-primary hover:text-brand-primary-deep">
                    {contact.fullName}
                  </Link>
                </TableCell>
                <TableCell>{formatPhoneDisplay(contact.phoneNormalized)}</TableCell>
                <TableCell>{CONTACT_SOURCE_LABELS[contact.source]}</TableCell>
                <TableCell><CrmStageBadge stage={contact.pipelineStage} /></TableCell>
                <TableCell>{contact.assignedToName ?? "—"}</TableCell>
                <TableCell>{formatDate(contact.lastInteractionAt)}</TableCell>
                <TableCell>{formatDate(contact.nextActionAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((contact) => (
          <Card key={contact.id} padding="sm">
            <div className="space-y-2">
              <Link href={`/admin/crm/contatos/${contact.id}`} className="font-medium text-brand-primary">
                {contact.fullName}
              </Link>
              <p className="text-sm text-ink-muted">{formatPhoneDisplay(contact.phoneNormalized)}</p>
              <CrmStageBadge stage={contact.pipelineStage} />
              <p className="text-xs text-ink-muted">Próxima ação: {formatDate(contact.nextActionAt)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
