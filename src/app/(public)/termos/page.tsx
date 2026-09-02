import type { Metadata } from "next";

import { PaginaDeDocumento } from "@/components/governanca/pagina-de-documento";
import { metadataDeDocumento } from "@/modules/governanca/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDeDocumento("termos", "Termos de Uso");
}

export const dynamic = "force-dynamic";

export default function TermosPage() {
  return <PaginaDeDocumento slug="termos" tituloProvisorio="Termos de Uso" />;
}
