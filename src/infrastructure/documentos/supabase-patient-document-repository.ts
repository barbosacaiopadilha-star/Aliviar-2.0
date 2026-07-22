import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { obterLimitesUploadConfigurados } from "@/infrastructure/governance/system-configuration";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const STORAGE_BUCKET = "patient-documents";

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
    const limits = await obterLimitesUploadConfigurados();
    const maxBytes = limits.max_bytes;

    if (input.tamanhoBytes <= 0 || input.tamanhoBytes > maxBytes) {
      throw new BusinessRuleError("Tamanho de arquivo inválido.");
    }

    if (!input.conteudoBase64?.trim()) {
      throw new BusinessRuleError("Conteúdo do documento é obrigatório.");
    }

    const supabase = await createClient();
    const documentoId = randomUUID();
    const recebidoEm = new Date().toISOString();
    const storagePath = `${input.pacienteId}/${documentoId}/${input.nomeArquivo}`;

    const buffer = Buffer.from(input.conteudoBase64, "base64");
    if (buffer.length !== input.tamanhoBytes) {
      throw new BusinessRuleError("Tamanho do arquivo não corresponde ao conteúdo enviado.");
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: input.tipoMime,
        upsert: false,
      });

    if (uploadError) {
      throw new BusinessRuleError(uploadError.message);
    }

    const { error: insertError } = await supabase.from("patient_documents").insert({
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

    if (insertError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw new BusinessRuleError(insertError.message);
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
