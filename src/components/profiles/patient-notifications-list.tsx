"use client";

import { useState, useTransition } from "react";

import { markPatientNotificationReadAction } from "@/modules/profiles/patient-notification-actions";
import type { PatientNotification } from "@/modules/profiles/types";

type PatientNotificationsListProps = {
  notifications: PatientNotification[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function PatientNotificationsList({ notifications }: PatientNotificationsListProps) {
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.readAt).map((n) => n.id)),
  );
  const [, startTransition] = useTransition();

  function handleMarkRead(id: string) {
    setReadIds((current) => new Set(current).add(id));
    startTransition(async () => {
      // A marcação é otimista — e o retorno era descartado. Numa recusa, a
      // tela seguia dizendo "lida" e o banco discordava: bastava recarregar
      // para a notificação reaparecer, sem explicação. A correção aqui é
      // desfazer, não alarmar: esta é a superfície da paciente, e "voltou a
      // aparecer" já é a verdade dita no tom certo. Falha de rede idem.
      const desfazer = () =>
        setReadIds((current) => {
          const proximo = new Set(current);
          proximo.delete(id);
          return proximo;
        });

      try {
        const resultado = await markPatientNotificationReadAction(id);
        if (!resultado.success) desfazer();
      } catch {
        desfazer();
      }
    });
  }

  return (
    <ul className="divide-y divide-border">
      {notifications.map((notification) => {
        const isRead = readIds.has(notification.id);
        return (
          <li key={notification.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className={isRead ? "text-sm text-ink-muted" : "text-sm font-medium text-ink"}>
                {notification.title}
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p>
              <p className="mt-1 text-xs text-ink-muted">{formatDate(notification.createdAt)}</p>
            </div>
            {!isRead ? (
              <button
                type="button"
                onClick={() => handleMarkRead(notification.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-brand-primary hover:text-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Marcar como lida
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
