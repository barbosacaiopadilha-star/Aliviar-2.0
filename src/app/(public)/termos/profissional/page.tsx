import type { Metadata } from "next";

import { PaginaDeDocumento } from "@/components/governanca/pagina-de-documento";
import { metadataDeDocumento } from "@/modules/governanca/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDeDocumento("termos-profissional", "Termos do Profissional");
}

export const dynamic = "force-dynamic";

export default function TermosDoProfissionalPage() {
  return <PaginaDeDocumento slug="termos-profissional" tituloProvisorio="Termos do Profissional" />;
}
