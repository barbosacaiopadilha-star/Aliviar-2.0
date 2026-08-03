import type { Metadata } from "next";

import { PaginaDeDocumento } from "@/components/governanca/pagina-de-documento";

export const metadata: Metadata = { title: "Termos do Profissional" };
export const dynamic = "force-dynamic";

export default function TermosDoProfissionalPage() {
  return <PaginaDeDocumento slug="termos-profissional" tituloProvisorio="Termos do Profissional" />;
}
