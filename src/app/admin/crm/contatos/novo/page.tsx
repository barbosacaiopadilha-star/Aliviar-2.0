import { CrmNewContactForm } from "@/components/crm/crm-new-contact-form";
import { requireAnyRole } from "@/modules/auth/guard";

export default async function CrmNewContactPage() {
  await requireAnyRole(["administrador", "concierge"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Novo contato</h1>
        <p className="text-sm text-ink-muted">Cadastro rápido com verificação de possíveis duplicidades.</p>
      </div>
      <CrmNewContactForm />
    </div>
  );
}
