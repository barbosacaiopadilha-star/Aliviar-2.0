import type { RegistrarDocumentoPacienteInput } from "@/infrastructure/documentos/supabase-patient-document-repository";
import { SupabasePatientDocumentRepository } from "@/infrastructure/documentos/supabase-patient-document-repository";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

const MAX_BYTES = 10 * 1024 * 1024;

export class RegistrarDocumentoPaciente {
  constructor(
    private readonly repository = new SupabasePatientDocumentRepository(
      new SupabaseJornadaProjection(),
    ),
  ) {}

  async execute(
    input: RegistrarDocumentoPacienteInput,
  ): Promise<Result<{ documentoId: string }, DomainError>> {
    if (input.tamanhoBytes <= 0 || input.tamanhoBytes > MAX_BYTES) {
      return err(new BusinessRuleError("Tamanho de arquivo inválido."));
    }

    if (!input.nomeArquivo.trim()) {
      return err(new BusinessRuleError("Nome do arquivo é obrigatório."));
    }

    try {
      const result = await this.repository.registrar(input);
      return ok(result);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
