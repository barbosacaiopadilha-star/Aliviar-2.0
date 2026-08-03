import type { Metadata } from "next";

import { PaginaDeDocumento } from "@/components/governanca/pagina-de-documento";

export const metadata: Metadata = { title: "Termos de Uso" };
export const dynamic = "force-dynamic";

export default function TermosPage() {
  return <PaginaDeDocumento slug="termos" tituloProvisorio="Termos de Uso" />;
}
