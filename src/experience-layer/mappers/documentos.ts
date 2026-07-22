import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { DocumentosExperienceModel } from "../contracts/experience-models";

export function mapDocumentosExperienceModel(
  view: JornadaDoPacienteView,
): DocumentosExperienceModel | null {
  const precisaDocumentos =
    view.estado_visivel === "AGUARDANDO_DOCUMENTOS" ||
    view.bloqueio?.motivo_humano.toLowerCase().includes("documento") ||
    view.extensoes.documentos.length > 0;

  if (!precisaDocumentos) {
    return null;
  }

  return {
    jornada_id: view.jornada_id,
    documentos: view.extensoes.documentos,
    bloqueio: view.bloqueio,
    proximo_passo:
      view.proximo_passo ?? {
        titulo: "Envie seus documentos",
        descricao: "Precisamos dos arquivos solicitados para continuar.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
  };
}
