import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { listPatientDocuments } from "@/modules/profiles/patient-document-repository";
import { getLatestStory } from "@/modules/story/repository";

import { montarCentralDeDocumentos, type DocumentCenterItem } from "./central-de-documentos";

/**
 * A6 · A ÚNICA PORTA ENTRE AS FONTES REAIS E A CENTRAL.
 *
 * A projeção (`central-de-documentos`) é função pura e não sabe ler nada. Este
 * arquivo é o adaptador: lê as três fontes que já existiam e as entrega na
 * forma que a projeção aceita.
 *
 * **A tela não recebe nada além do resultado.** É o que impede a UI de
 * comparar `uploaded_by`, olhar `case_id`, interpretar `file_path` ou
 * reconstruir o portão de `deliveredAt` — ela não tem acesso a nenhuma dessas
 * coisas, e não é por disciplina: é por tipo.
 *
 * O PORTÃO DA CURADORIA APARECE DUAS VEZES, DE PROPÓSITO
 *
 * `loadPatientCuradoria` já só devolve entrega concluída (`status =
 * 'DELIVERED'` **e** `report.delivered_at`). A projeção volta a exigir
 * `deliveredAt` e conteúdo real. A redundância é intencional: se um dia o
 * loader afrouxar, a projeção segura — e os testes P4/P5 vigiam essa segunda
 * tranca de forma isolada, sem depender do banco.
 */
export async function carregarCentralDeDocumentos(
  supabase: SupabaseClient,
  patientProfileId: string,
): Promise<DocumentCenterItem[]> {
  const [documentos, curadoria, historia] = await Promise.all([
    listPatientDocuments(supabase, patientProfileId),
    loadPatientCuradoria(supabase),
    getLatestStory(supabase, patientProfileId),
  ]);

  return montarCentralDeDocumentos({
    patientProfileId,
    // `listPatientDocuments` consulta por `profile_id`, então toda linha aqui
    // é dela — `profileId` é conhecido, não lido. `filePath` fica de fora: a
    // projeção não pode vazar o que nunca recebe.
    documentos: documentos.map((documento) => ({
      id: documento.id,
      profileId: patientProfileId,
      uploadedBy: documento.uploadedBy,
      fileName: documento.fileName,
      createdAt: documento.createdAt,
    })),
    curadoria: curadoria
      ? {
          relatorio: {
            // O loader não expõe `emittedAt` — e não precisa: o portão é
            // `deliveredAt`, e informar um carimbo que a projeção ignora só
            // criaria a ilusão de que ele conta.
            emittedAt: null,
            deliveredAt: curadoria.deliveredAt,
            options: curadoria.options,
          },
          devolutiva: { presentedAt: null },
        }
      : null,
    historia: historia
      ? {
          status: historia.status,
          submittedAt: historia.submittedAt,
          updatedAt: historia.updatedAt,
        }
      : null,
  });
}
