import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader } from "@/components/ui/card";

type DashboardPanelProps = {
  displayName: string;
  roleLabel: string;
};

export function DashboardPanel({ displayName, roleLabel }: DashboardPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="font-sans text-2xl font-semibold text-ink">Olá, {displayName}</h1>
          <p className="text-sm text-ink-muted">Papel atual: {roleLabel}</p>
        </CardHeader>
      </Card>

      <EmptyState
        title="Ainda não há informações para exibir."
        description="Quando houver dados disponíveis para o seu perfil, eles aparecerão aqui com clareza e cuidado."
      />
    </div>
  );
}
