import type { Metadata } from "next";

import { PortalNotificacoesContent } from "@/components/portal/PortalNotificacoesContent";

export const metadata: Metadata = {
  title: "Notificações — Portal do Paciente",
  description: "Central de notificações da sua jornada Aliviar.",
};

export default function PortalNotificacoesPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-2xl px-6 py-12" data-testid="portal-notificacoes-page">
        <PortalNotificacoesContent />
      </main>
    </div>
  );
}
