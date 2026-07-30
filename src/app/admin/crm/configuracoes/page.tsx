import { requireAnyRole } from "@/modules/auth/guard";
import { WHATSAPP_ENV_VARS } from "@/modules/crm";
import { Card, CardHeader } from "@/components/ui/card";

export default async function CrmSettingsPage() {
  await requireAnyRole(["administrador"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Configurações do CRM</h1>
        <p className="text-sm text-ink-muted">Opções administrativas e preparação para integrações externas.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">WhatsApp</h2>
          <p className="text-sm text-ink-muted">Integração não configurada. Configure as variáveis abaixo para habilitar o adapter oficial futuramente.</p>
        </CardHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          {WHATSAPP_ENV_VARS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Leads do site</h2>
          <p className="text-sm text-ink-muted">
            Endpoint preparado em <code className="text-xs">POST /api/crm/leads</code> com validação, honeypot e deduplicação.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
