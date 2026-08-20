import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAnyRole } from "@/modules/auth/guard";
import { canAccessCrm } from "@/modules/crm/permissions";

// Este layout fixava `title: "CRM Aliviar"` e as telas filhas não sobrescreviam:
// Contatos, Funil, Tarefas e Agenda ficavam com a MESMA aba, indistinguíveis no
// histórico e nos favoritos. Sem título aqui, vale o template da raiz
// (`%s — Aliviar Curadoria Médica`) e cada tela declara o seu, como Equipe e
// Profissionais já faziam.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CrmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await requireAnyRole(["administrador", "concierge"]);
  if (!canAccessCrm(state.roles)) redirect("/acesso-negado");
  return <div className="space-y-6">{children}</div>;
}
