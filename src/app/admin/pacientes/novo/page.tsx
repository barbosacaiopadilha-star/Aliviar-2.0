import type { Metadata } from "next";

import { requireRole } from "@/modules/auth/guard";

import { Card, CardHeader } from "@/components/ui/card";
import { CreatePatientForm } from "@/components/profiles/create-patient-form";

export const metadata: Metadata = {
  title: "Novo paciente",
  robots: { index: false, follow: false },
};

export default async function NewPatientPage() {
  await requireRole("administrador");

  return (
    <Card>
      <CardHeader>
        <h1 className="font-sans text-xl font-semibold text-ink sm:text-2xl">Novo paciente</h1>
        <p className="text-sm text-ink-muted">
          A Aliviar cria o acesso e entrega login e senha ao paciente — não existe cadastro
          público. A senha só é exibida uma única vez, logo após a criação.
        </p>
      </CardHeader>

      <CreatePatientForm />
    </Card>
  );
}
