import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * DOCUMENTO ÓRFÃO — definição e diagnóstico (Release de Reconstrução, ETAPA 9).
 *
 * **Definição.** Documento órfão é uma linha de `patient_documents` criada
 * para o fluxo da história que não tem vínculo correspondente em
 * `patient_story_attachments` e não está legitimamente associada a outro
 * fluxo suportado.
 *
 * A parte final da definição importa: `patient_documents` **também** serve o
 * autosserviço do Portal do Paciente, onde a pessoa envia um documento sem
 * amarrá-lo a história nenhuma. Esse documento não tem anexo e **não é
 * órfão** — tratar todo documento sem vínculo como lixo apagaria o que ela
 * enviou de propósito.
 *
 * O que distingue os dois hoje é o momento: o fluxo da história cria
 * documento e vínculo na mesma ação (com compensação em caso de falha). Um
 * documento sem vínculo criado há segundos pode estar no meio dessa operação;
 * um documento sem vínculo com horas de vida é do autosserviço — ou é o
 * resíduo de uma compensação que não concluiu, e aí o log tem a referência.
 *
 * Por isso este módulo **não apaga nada**. Ele lista candidatos para uma
 * pessoa decidir. Apagar por heurística seria repetir, do outro lado, o erro
 * que a compensação veio corrigir.
 */

export type CandidatoAOrfao = {
  documentId: string;
  profileId: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  /** Segundos desde a criação — abaixo da carência, pode estar em curso. */
  idadeEmSegundos: number;
  temVinculoComHistoria: boolean;
  /** Por que este documento entrou na lista, em português. */
  motivo: string;
};

/**
 * Carência antes de considerar um documento sem vínculo como candidato.
 * Cobre a janela entre criar o documento e criar o anexo, inclusive quando a
 * compensação está a caminho.
 */
export const CARENCIA_EM_SEGUNDOS = 300;

export async function listarCandidatosAOrfao(
  supabase: SupabaseClient,
  { agora = new Date() }: { agora?: Date } = {},
): Promise<CandidatoAOrfao[]> {
  const { data: documentos, error } = await supabase
    .from("patient_documents")
    .select("id, profile_id, file_name, file_path, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Diagnóstico de órfãos: ${error.message}`);

  const ids = (documentos ?? []).map((linha) => linha.id as string);
  if (ids.length === 0) return [];

  const { data: vinculos } = await supabase
    .from("patient_story_attachments")
    .select("document_id")
    .in("document_id", ids);

  const comVinculo = new Set((vinculos ?? []).map((linha) => linha.document_id as string));

  return (documentos ?? [])
    .filter((linha) => !comVinculo.has(linha.id as string))
    .map((linha) => {
      const criadoEm = new Date(linha.created_at as string);
      const idadeEmSegundos = Math.floor((agora.getTime() - criadoEm.getTime()) / 1000);

      return {
        documentId: linha.id as string,
        profileId: linha.profile_id as string,
        fileName: linha.file_name as string,
        filePath: linha.file_path as string,
        createdAt: linha.created_at as string,
        idadeEmSegundos,
        temVinculoComHistoria: false,
        motivo:
          idadeEmSegundos < CARENCIA_EM_SEGUNDOS
            ? "Criado há pouco — pode ser uma operação de anexo ainda em curso, ou uma compensação a caminho. Não é órfão ainda."
            : "Sem vínculo com história. Pode ser envio pelo Portal do Paciente (legítimo) ou resíduo de compensação que não concluiu — o log tem a referência, quando foi o segundo caso.",
      };
    });
}
