import { EmptyState } from "@/components/ui/empty-state";
import type { AuditLogEntry } from "@/modules/team/types";

type AuditLogListProps = {
  entries: AuditLogEntry[];
  emptyMessage: string;
  showTarget?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function describeEntry(entry: AuditLogEntry, showTarget: boolean): string {
  const actorLabel = entry.actorName ?? "Sistema";
  const targetLabel = showTarget && entry.targetName ? ` para ${entry.targetName}` : "";
  const verbo = entry.action === "role_granted" ? "concedeu" : "revogou";

  // Sem o nome do papel, a frase saía como `revogou o papel "papel"`: o rótulo
  // genérico entre aspas, com a mesma aparência de um nome real. Ausência de
  // nome é dita como ausência — o trecho entre aspas some e a frase continua
  // verdadeira, em vez de inventar um papel chamado "papel".
  const complemento = entry.roleName ? `o papel "${entry.roleName}"` : "um papel";

  return `${actorLabel} ${verbo} ${complemento}${targetLabel}`;
}

export function AuditLogList({ entries, emptyMessage, showTarget = false }: AuditLogListProps) {
  if (entries.length === 0) {
    return <EmptyState title={emptyMessage} description="Ainda não há informações para exibir." />;
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-0.5 py-3 text-sm">
          <span className="text-ink">{describeEntry(entry, showTarget)}</span>
          <span className="text-xs text-ink-muted">{formatDate(entry.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
