import type { Metadata } from "next";

import { requireRole } from "@/modules/auth/guard";
import { createProfessionalProfileAction } from "@/modules/profiles";

import { Card, CardHeader } from "@/components/ui/card";
import { ProfessionalProfileForm } from "@/components/profiles/professional-profile-form";

export const metadata: Metadata = {
  title: "Novo profissional",
  robots: { index: false, follow: false },
};

export default async function NewProfessionalPage() {
  await requireRole("administrador");

  return (
    <Card>
      <CardHeader>
        <h1 className="font-sans text-xl font-semibold text-ink sm:text-2xl">Novo profissional</h1>
        <p className="text-sm text-ink-muted">
          Este cadastro é feito apenas pela equipe Aliviar — não existe formulário público de
          autocadastro.
        </p>
      </CardHeader>

      <ProfessionalProfileForm action={createProfessionalProfileAction} submitLabel="Criar profissional" />
    </Card>
  );
}
