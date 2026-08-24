import { redirect } from "next/navigation";

// MERGE DE 23/08 · os consentimentos vivem dentro da central de Documentos.
// A rota permanece como redirect (e continua em ROTAS_LIVRES_DO_GATE, assim
// como o destino): o direito do titular não muda de natureza por mudar de
// endereço, e nenhum link antigo cai em tela morta.
export default function DocumentosEConsentimentosPage() {
  redirect("/paciente/documentos");
}
