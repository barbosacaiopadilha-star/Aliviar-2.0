import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export interface RegistrarDocumentoPacienteInput {
  pacienteId: string;
  jornadaId: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanhoBytes: number;
  conteudoBase64: string;
}

export class SupabasePatientDocumentRepository {
  constructor(private readonly projection: JornadaProjectionPort) {}

  async registrar(input: RegistrarDocumentoPacienteInput): Promise<{ documentoId: string }> {
    const supabase = await createClient();
    const documentoId = randomUUID();
    const recebidoEm = new Date().toISOString();
    const storagePath = `patient-documents/${input.pacienteId}/${documentoId}/${input.nomeArquivo}`;

    const { error } = await supabase.from("patient_documents").insert({
      id: documentoId,
      patient_id: input.pacienteId,
      journey_id: input.jornadaId,
      nome_arquivo: input.nomeArquivo,
      tipo_mime: input.tipoMime,
      tamanho_bytes: input.tamanhoBytes,
      status: "RECEBIDO",
      storage_path: storagePath,
      recebido_em: recebidoEm,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const projecao = await this.projection.obterPorId(input.jornadaId);
    if (!projecao) {
      throw new NotFoundError("Jornada");
    }

    await this.projection.salvar({
      ...projecao,
      extensoes: {
        ...projecao.extensoes,
        documentos: [
          ...projecao.extensoes.documentos,
          {
            id: documentoId,
            nome_arquivo: input.nomeArquivo,
            status: "RECEBIDO",
            recebido_em: recebidoEm,
          },
        ],
      },
      atualizadaEm: recebidoEm,
    });

    return { documentoId };
  }
}
