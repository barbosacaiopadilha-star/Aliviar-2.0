import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

// noindex: esta página só faz sentido a partir de um link de redefinição
// com token — nunca deve ser indexada nem aparecer em resultado de busca.
export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};

export default function NovaSenhaPage() {
  return <UpdatePasswordForm />;
}
